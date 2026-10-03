/**
 * useCoverageReview — Deckungsentscheide bei framework-übergreifender Übernahme.
 *
 * Y8 (Codex-Prüfbericht 2026-09-12): „Eine positive NIS2-Antwort auf einer
 * geteilten Kontrolle darf für ISO nicht ohne Geltungsbereichs-, Zeitraum- und
 * Nachweisentscheid automatisch voll/100 % erzeugen."
 *
 * Ein same-as-Knoten sagt, dass zwei Kontrollen INHALTLICH dasselbe verlangen.
 * Er sagt nicht, dass die Prüfung dieselben Einheiten, denselben Zeitraum und
 * dieselbe Nachweistiefe abgedeckt hat. Dieser Hook liefert genau diese
 * fehlende Aussage — als Nachschlagefunktion, die `projectAnswer` über
 * `opts.coverage` bekommt.
 *
 * WICHTIG: Alle Verbraucher der Projektion (Gap-Bildschirm, Umsetzung, Risiko,
 * Audit, Berichte) müssen denselben Resolver benutzen. Sonst entstehen wieder
 * unterschiedliche Erfüllungsquoten für denselben Stand — genau der Fehler,
 * den wir vorher hatten.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { CoverageDecision, CoverageResolver } from "@/lib/assessmentEngine";

export interface CoverageReviewRow {
  framework: string;
  control_id: string;
  asset_id: string | null;
  source_framework: string | null;
  source_control_id: string | null;
  decision: CoverageDecision;
  scope_note: string | null;
  period_from: string | null;
  period_to: string | null;
  evidence_note: string | null;
  decided_at: string | null;
}

function key(framework: string, controlId: string): string {
  return `${framework}::${controlId}`;
}

export function useCoverageReview() {
  const { user, tenantId } = useAuth();
  const [rows, setRows] = useState<Record<string, CoverageReviewRow>>({});
  const [loading, setLoading] = useState(true);
  /** true = Tabelle fehlt (Migration noch nicht gelaufen) → Gate bleibt konservativ „offen". */
  const [unavailable, setUnavailable] = useState(false);

  const reload = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("coverage_review")
      .select("framework, control_id, asset_id, source_framework, source_control_id, decision, scope_note, period_from, period_to, evidence_note, decided_at");
    if (error) {
      // Fehlende Tabelle darf die Seite nicht blockieren. Ohne Entscheide gilt
      // „offen" — das ist die konservative Richtung (gedeckelt auf teilweise).
      setUnavailable(true);
      setRows({});
      setLoading(false);
      return;
    }
    const m: Record<string, CoverageReviewRow> = {};
    for (const r of (data ?? []) as CoverageReviewRow[]) {
      // Organisationsebene (asset_id = null) ist maßgeblich für die Projektion.
      if (r.asset_id) continue;
      m[key(r.framework, r.control_id)] = r;
    }
    setUnavailable(false);
    setRows(m);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { void reload(); }, [reload]);

  /** Resolver für projectAnswer. Kein Eintrag ⇒ „offen". */
  const coverage: CoverageResolver = useCallback(
    (framework, controlId) => rows[key(framework, controlId)]?.decision ?? "offen",
    [rows],
  );

  const decisionFor = useCallback(
    (framework: string, controlId: string): CoverageReviewRow | undefined => rows[key(framework, controlId)],
    [rows],
  );

  /**
   * Entscheid speichern. `decision === null` löscht ihn (zurück auf „offen").
   * Ein Entscheid „voll" ohne Angabe zu Umfang und Nachweis wird abgelehnt —
   * genau diese Angaben sind der Grund, warum es das Feld überhaupt gibt.
   */
  const saveDecision = useCallback(async (
    framework: string,
    controlId: string,
    decision: CoverageDecision | null,
    detail: { sourceFramework?: string | null; sourceControlId?: string | null; scopeNote?: string; periodFrom?: string | null; periodTo?: string | null; evidenceNote?: string } = {},
  ): Promise<boolean> => {
    if (!tenantId) return false;
    if (decision === null) {
      const { error } = await supabase
        .from("coverage_review")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("framework", framework)
        .eq("control_id", controlId)
        .is("asset_id", null);
      if (error) { toast({ title: "Löschen fehlgeschlagen", description: error.message, variant: "destructive" }); return false; }
      setRows(prev => { const n = { ...prev }; delete n[key(framework, controlId)]; return n; });
      return true;
    }
    if (decision === "voll" && !(detail.scopeNote ?? "").trim()) {
      toast({
        title: "Angabe zum Geltungsbereich fehlt",
        description: `„Voll gedeckt“ verlangt, welche Einheiten/Standorte und welcher Zeitraum geprüft wurden.`,
        variant: "destructive",
      });
      return false;
    }
    const payload = {
      tenant_id: tenantId,
      framework,
      control_id: controlId,
      asset_id: null as string | null,
      source_framework: detail.sourceFramework ?? null,
      source_control_id: detail.sourceControlId ?? null,
      decision,
      scope_note: detail.scopeNote?.trim() || null,
      period_from: detail.periodFrom || null,
      period_to: detail.periodTo || null,
      evidence_note: detail.evidenceNote?.trim() || null,
      reviewer: user?.id ?? null,
      decided_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("coverage_review")
      .upsert(payload, { onConflict: "tenant_id,framework,control_id,asset_id" });
    if (error) {
      toast({ title: "Speichern fehlgeschlagen", description: error.message, variant: "destructive" });
      return false;
    }
    setRows(prev => ({ ...prev, [key(framework, controlId)]: { ...payload, decided_at: payload.decided_at } as CoverageReviewRow }));
    return true;
  }, [tenantId, user]);

  /** Anzahl offener Deckungsprüfungen je Framework (für Hinweise/Berichte). */
  const openCount = useMemo(() => {
    let n = 0;
    for (const k of Object.keys(rows)) if (rows[k].decision === "offen") n++;
    return n;
  }, [rows]);

  return { coverage, decisionFor, saveDecision, reload, loading, unavailable, openCount };
}
