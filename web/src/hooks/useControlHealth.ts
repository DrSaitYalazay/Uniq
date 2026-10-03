/**
 * useControlHealth — lädt den abgeleiteten, kontinuierlichen Control-Status
 * (Engine E3, controlHealthEngine) für den aktuellen Tenant.
 *
 * Rein additiv & read-only. Verdrahtet die vorhandene, marktreife Engine
 * `deriveControlHealth`/`frameworkReadiness` mit den (heute noch leeren)
 * Tabellen `control_tests` + `control_test_results` sowie den bereits
 * geladenen Evidence-/Assessment-Daten:
 *   – control_tests            → welche Kontrollen werden kontinuierlich geprüft
 *   – control_test_results     → jüngstes Resultat je Test (pass/fail/error/na)
 *   – answer_evidence/evidence → Nachweis-Frische (TTL) je getesteter Kontrolle
 *   – useComplianceOverview    → effektive Selbstauskunft (EffectiveAnswer)
 *
 * Robustheits-Vertrag:
 *   – KEINE control_tests (heutiger Zustand) ⇒ LEERE Map, failingCount 0,
 *     kein Fehler, kein Layout-/Zahlen-Effekt (die UI bleibt unverändert).
 *   – Jeder DB-Fehler degradiert still auf den Leer-Zustand.
 *   – RLS scoped alle Abfragen bereits auf den Tenant (Client-Muster
 *     `@/integrations/supabase/client`); Abfragen laufen nur mit tenantId.
 */

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useComplianceOverview } from "@/hooks/useComplianceOverview";
import {
  deriveControlHealth,
  frameworkReadiness,
  type ControlHealth,
  type ControlTest,
  type ControlTestResult,
} from "@/lib/controlHealthEngine";
import type { Evidence } from "@/lib/evidenceEngine";
import type { EffectiveAnswer } from "@/lib/assessmentEngine";

export interface FrameworkReadinessOut {
  score: number;
  coverage: number;
}

export interface UseControlHealthState {
  loading: boolean;
  /** Map `framework::controlId` → ControlHealth. LEER, wenn keine control_tests. */
  healthByControl: Map<string, ControlHealth>;
  /** Framework → Readiness-Rollup (nur Frameworks mit ≥1 getesteter Kontrolle). */
  readinessByFramework: Map<string, FrameworkReadinessOut>;
  /** Kontrollen mit fehlgeschlagenem Test (Posture-Penalty). 0 ohne Tests. */
  failingCount: number;
}

const ck = (framework: string, controlId: string) => `${framework}::${controlId}`;

interface RawTests {
  tests: ControlTest[];
  latestByTest: Map<string, ControlTestResult | null>;
  evidenceByControl: Map<string, Evidence[]>;
}

const EMPTY_RAW: RawTests = {
  tests: [],
  latestByTest: new Map(),
  evidenceByControl: new Map(),
};

export function useControlHealth(): UseControlHealthState {
  const { tenantId } = useAuth();
  const { overview, loading: overviewLoading } = useComplianceOverview();

  const [raw, setRaw] = useState<RawTests>(EMPTY_RAW);
  const [loadingTests, setLoadingTests] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!tenantId) {
      setRaw(EMPTY_RAW);
      setLoadingTests(false);
      return;
    }
    setLoadingTests(true);
    (async () => {
      try {
        // 1) control_tests (RLS-scoped). Leer ⇒ sofort Leer-Zustand.
        const { data: testRows, error: te } = await supabase
          .from("control_tests")
          .select("*");
        if (te) throw te;
        const tests = (testRows ?? []) as ControlTest[];
        if (tests.length === 0) {
          if (alive) {
            setRaw(EMPTY_RAW);
            setLoadingTests(false);
          }
          return;
        }

        // 2) jüngstes Resultat je Test.
        const testIds = tests.map((t) => t.id);
        const { data: resRows } = await supabase
          .from("control_test_results")
          .select("*")
          .in("test_id", testIds)
          .order("ran_at", { ascending: false });
        const latestByTest = new Map<string, ControlTestResult | null>();
        for (const r of (resRows ?? []) as ControlTestResult[]) {
          if (!latestByTest.has(r.test_id)) latestByTest.set(r.test_id, r); // erste = neueste
        }
        for (const id of testIds) if (!latestByTest.has(id)) latestByTest.set(id, null);

        // 3) Nachweise der getesteten (framework, control_id)-Paare.
        const tested = tests.filter((t) => t.framework && t.control_id);
        const pairs = new Set(tested.map((t) => ck(t.framework as string, t.control_id as string)));
        const evidenceByControl = new Map<string, Evidence[]>();
        if (pairs.size > 0) {
          const fws = Array.from(new Set(tested.map((t) => t.framework as string)));
          const cids = Array.from(new Set(tested.map((t) => t.control_id as string)));
          const { data: links } = await supabase
            .from("answer_evidence")
            .select("evidence_id, framework, control_id")
            .in("framework", fws)
            .in("control_id", cids);
          const relevant = (links ?? []).filter((l: any) => pairs.has(ck(l.framework, l.control_id)));
          const evIds = Array.from(new Set(relevant.map((l: any) => l.evidence_id as string)));
          const evById = new Map<string, Evidence>();
          if (evIds.length > 0) {
            const { data: evRows } = await supabase.from("evidence").select("*").in("id", evIds);
            for (const e of (evRows ?? []) as Evidence[]) evById.set(e.id, e);
          }
          for (const l of relevant as any[]) {
            const e = evById.get(l.evidence_id);
            if (!e) continue;
            const key = ck(l.framework, l.control_id);
            const arr = evidenceByControl.get(key) ?? [];
            arr.push(e);
            evidenceByControl.set(key, arr);
          }
        }

        if (alive) {
          setRaw({ tests, latestByTest, evidenceByControl });
          setLoadingTests(false);
        }
      } catch {
        // Still degradieren — kein no-op-Crash, kein sichtbarer Effekt.
        if (alive) {
          setRaw(EMPTY_RAW);
          setLoadingTests(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [tenantId]);

  // Effektive Selbstauskunft je `framework::controlId` aus dem Overview.
  const effByControl = useMemo(() => {
    const m = new Map<string, EffectiveAnswer>();
    for (const o of overview) {
      for (const [cid, eff] of o.effective) m.set(ck(o.framework, cid), eff);
    }
    return m;
  }, [overview]);

  return useMemo<UseControlHealthState>(() => {
    const healthByControl = new Map<string, ControlHealth>();

    // Tests je Kontrolle bündeln (mehrere Tests pro Kontrolle möglich).
    const testsByControl = new Map<string, { test: ControlTest; latest: ControlTestResult | null }[]>();
    for (const t of raw.tests) {
      if (!t.framework || !t.control_id) continue; // knoten-only Tests hier nicht abgeleitet
      const key = ck(t.framework, t.control_id);
      const arr = testsByControl.get(key) ?? [];
      arr.push({ test: t, latest: raw.latestByTest.get(t.id) ?? null });
      testsByControl.set(key, arr);
    }

    const perFramework = new Map<string, ControlHealth[]>();
    let failingCount = 0;
    for (const [key, ts] of testsByControl) {
      const framework = key.slice(0, key.indexOf("::"));
      const answer = effByControl.get(key);
      const evidence = (raw.evidenceByControl.get(key) ?? []).map((row) => ({ row, inherited: false }));
      const health = deriveControlHealth(answer, ts, evidence);
      healthByControl.set(key, health);
      if (health.testState === "fail") failingCount++;
      const arr = perFramework.get(framework) ?? [];
      arr.push(health);
      perFramework.set(framework, arr);
    }

    const readinessByFramework = new Map<string, FrameworkReadinessOut>();
    for (const [framework, healths] of perFramework) {
      readinessByFramework.set(framework, frameworkReadiness(healths));
    }

    return {
      loading: loadingTests || overviewLoading,
      healthByControl,
      readinessByFramework,
      failingCount,
    };
  }, [raw, effByControl, loadingTests, overviewLoading]);
}

export default useControlHealth;
