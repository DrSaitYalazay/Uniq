/**
 * useQuantRisk — FAIR quantitatives Risiko (E1) · Datenlader + CRUD.
 *
 * Rein additiv. Lädt die `quant_scenarios` des Tenants (ein FAIR-Szenario je
 * Risiko) in eine Map `risk_id → QuantScenario` und bietet mandantensichere
 * CRUD-Operationen (upsertScenario / deleteScenario). Robust: bei fehlender
 * Auth, leerer Tabelle oder Fehler ⇒ leere Map (kein Werfen, keine Zahländerung
 * irgendwo — ohne Szenarien bleibt alles wie bisher).
 *
 * Persistiert werden NUR die Szenario-Eingaben (inputs jsonb). Die Monte-Carlo-
 * Läufe werden vom Panel on-demand aus `fairEngine.simulateScenario` berechnet;
 * eine Persistenz in `quant_runs` ist optional und hier bewusst nicht nötig.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { FairInput, FairFullInput } from "@/lib/fairEngine";

export type QuantMode = "light" | "full";

/** Persistiertes FAIR-Szenario (eine Zeile aus `quant_scenarios`). */
export interface QuantScenario {
  id?: string;
  risk_id: string;
  mode: QuantMode;
  /** light ⇒ FairInput, full ⇒ FairFullInput (per `mode` disambiguiert). */
  inputs: FairInput | FairFullInput;
  correlation_group?: string | null;
  updated_at?: string | null;
}

export interface UseQuantRiskState {
  loading: boolean;
  error: string | null;
  /** risk_id → Szenario. Leer, solange nichts erfasst wurde. */
  scenarios: Map<string, QuantScenario>;
  upsertScenario: (s: QuantScenario) => Promise<void>;
  deleteScenario: (riskId: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useQuantRisk(): UseQuantRiskState {
  const { user, tenantId, getTenantId } = useAuth();
  const [loading, setLoading] = useState<boolean>(!!user);
  const [error, setError] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<Map<string, QuantScenario>>(new Map());
  const cancelledRef = useRef(false);

  const resolveTenant = useCallback(async (): Promise<string | null> => {
    if (tenantId) return tenantId;
    try {
      const t = await getTenantId?.();
      return t ?? user?.id ?? null;
    } catch {
      return user?.id ?? null;
    }
  }, [tenantId, getTenantId, user]);

  const load = useCallback(async () => {
    if (!user) {
      setScenarios(new Map());
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const tid = await resolveTenant();
      if (!tid) {
        setScenarios(new Map());
        setLoading(false);
        return;
      }
      const { data, error: err } = await supabase
        .from("quant_scenarios")
        .select("id, risk_id, mode, inputs, correlation_group, updated_at")
        .eq("tenant_id", tid);
      if (err) throw err;
      const map = new Map<string, QuantScenario>();
      for (const row of (data ?? []) as any[]) {
        if (!row?.risk_id) continue;
        map.set(row.risk_id, {
          id: row.id,
          risk_id: row.risk_id,
          mode: (row.mode === "full" ? "full" : "light") as QuantMode,
          inputs: row.inputs ?? {},
          correlation_group: row.correlation_group ?? null,
          updated_at: row.updated_at ?? null,
        });
      }
      if (!cancelledRef.current) setScenarios(map);
    } catch (e: any) {
      // Robust: leere Map statt Fehlerzustand, damit die Seite ohne Szenarien
      // exakt wie bisher funktioniert (keine Zahländerung).
      if (!cancelledRef.current) {
        setScenarios(new Map());
        setError(e?.message ?? String(e));
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [user, resolveTenant]);

  useEffect(() => {
    cancelledRef.current = false;
    void load();
    return () => {
      cancelledRef.current = true;
    };
  }, [load]);

  const upsertScenario = useCallback(
    async (s: QuantScenario) => {
      if (!user) return;
      const tid = await resolveTenant();
      if (!tid) return;
      // Optimistisches Update der lokalen Map.
      setScenarios(prev => {
        const next = new Map(prev);
        next.set(s.risk_id, { ...s });
        return next;
      });
      const row = {
        tenant_id: tid,
        risk_id: s.risk_id,
        mode: s.mode,
        inputs: s.inputs,
        correlation_group: s.correlation_group ?? null,
        updated_by: user.id,
      };
      const { error: err } = await supabase
        .from("quant_scenarios")
        .upsert(row, { onConflict: "tenant_id,risk_id" });
      if (err) {
        setError(err.message ?? String(err));
        // Bei Fehler frisch nachladen (Konsistenz mit DB-Zustand).
        void load();
      }
    },
    [user, resolveTenant, load],
  );

  const deleteScenario = useCallback(
    async (riskId: string) => {
      if (!user) return;
      const tid = await resolveTenant();
      if (!tid) return;
      setScenarios(prev => {
        const next = new Map(prev);
        next.delete(riskId);
        return next;
      });
      const { error: err } = await supabase
        .from("quant_scenarios")
        .delete()
        .eq("tenant_id", tid)
        .eq("risk_id", riskId);
      if (err) {
        setError(err.message ?? String(err));
        void load();
      }
    },
    [user, resolveTenant, load],
  );

  return { loading, error, scenarios, upsertScenario, deleteScenario, reload: load };
}
