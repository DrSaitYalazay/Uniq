/**
 * PostureCard — die eine verkaufbare Zahl (0–100) plus ehrlicher Ausweis.
 *
 * Rein additive Dashboard-Kachel. Nutzt die marktreife `computePosture`
 * (postureEngine E8) und speist NUR vorhandene Daten ein:
 *   C1 Framework-Reife   ≈ gewichtete Konformität (useComplianceOverview)
 *   C2 Nachweis-Aktualität = frische / alle Nachweise (evidence-TTL)
 *   C3 Reifegrad          = Ø Reifegrad / 5 (aus Selbstauskunft)
 *   C4 Fristen-Treue      = fristgerecht / fällig (rollierend 12 M, compliance_deadlines)
 *   C5 Risiko-Posture     = derzeit no_data (Residualrisiko nicht ohne Weiteres verfügbar)
 * Penalty: kritische MUSS-Lücken, fehlgeschlagene CCM-Tests, überfällige Fristen.
 *
 * Doktrin (postureEngine): fehlt eine Komponente ⇒ sie ENTFÄLLT (no_data),
 * die Gewichte renormalisieren, coverage sinkt — NIE erfundene Werte. Sind gar
 * keine Komponenten belegt (frischer Tenant, leere Tabellen), zeigt die Kachel
 * einen no_data-Zustand statt einer irreführenden 0.
 */

import { useEffect, useMemo, useState } from "react";
import { Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useComplianceOverview } from "@/hooks/useComplianceOverview";
import { useControlHealth } from "@/hooks/useControlHealth";
import { computePosture, type PostureComponentInput, type PostureResult } from "@/lib/postureEngine";
import { evidenceItemState } from "@/lib/controlHealthEngine";
import { useRiskAnalysis } from "@/hooks/useRiskAnalysis";
import { useToolData } from "@/hooks/useToolData";
import { DEFAULT_RISK_CONFIG, scoreAndLevel } from "@/lib/riskEngine";
import { effectiveResidualLI, type TreatmentObject } from "@/lib/treatmentEngine";
import type { Evidence } from "@/lib/evidenceEngine";

interface Props {
  de: boolean;
}

/**
 * Management-taugliche Klartext-Erklärung je Posture-Komponente (C1…C5).
 * Keine Abkürzungen ohne Erläuterung — jede Kachel sagt in einem Satz, WAS sie
 * misst und WORAUS sie sich speist.
 */
const COMPONENT_DESC: Record<string, { de: string; en: string }> = {
  C1: {
    de: "Wie viele Anforderungen Ihrer gewählten Frameworks bereits erfüllt sind (aus der Bewertung).",
    en: "How many requirements of your selected frameworks are already met (from the assessment).",
  },
  C2: {
    de: "Anteil der hinterlegten Nachweise (Dokumente/Belege), die noch gültig und nicht veraltet sind.",
    en: "Share of stored evidence (documents/proofs) that is still valid and not outdated.",
  },
  C3: {
    de: "Selbst eingeschätzter Umsetzungsgrad der Maßnahmen (Reifegrad 0–5), hier als Prozent.",
    en: "Self-assessed implementation level of your measures (maturity 0–5), shown here as percent.",
  },
  C4: {
    de: "Anteil der Fristen, die rechtzeitig erledigt wurden (rollierend über die letzten 12 Monate).",
    en: "Share of deadlines completed on time (rolling over the last 12 months).",
  },
  C5: {
    de: "Wie stark Ihre umgesetzten Kontrollen das Ausgangsrisiko (Brutto) senken.",
    en: "How much your implemented controls reduce the inherent (gross) risk.",
  },
};

/**
 * D.2 Posture-Gate: unter dieser Abdeckung (Anteil belegter Gewichte) wird KEINE
 * Zahl/Ampel gezeigt. Ein „33/100 Kritisch" aus zwei Bausteinen widerspricht dem
 * Hero-Wert (Konformität) und ist nicht belastbar — stattdessen: was fehlt + was
 * zu tun ist. Bausteine MIT Daten bleiben sichtbar.
 */
const POSTURE_MIN_COVERAGE = 0.7;

/** Handlungsanweisung je fehlendem Baustein (C1…C5). */
const COMPONENT_ACTION: Record<string, { de: string; en: string }> = {
  C1: {
    de: "Gap-Analyse (Phase 03) durchführen — Anforderungen bewerten.",
    en: "Run the gap analysis (phase 03) — assess requirements.",
  },
  C2: {
    de: "Nachweise hinterlegen (Umsetzung, Feld „Nachweis“ bzw. Nachweis-Register).",
    en: "Link evidence (Implementation, field \"Evidence\" or the evidence register).",
  },
  C3: {
    de: "Reifegrad erfassen — je Kontrolle in der Gap-Analyse (0–5).",
    en: "Record maturity — per control in the gap analysis (0–5).",
  },
  C4: {
    de: "Fristen pflegen (Fristen-Register) — erst mit fälligen Fristen messbar.",
    en: "Maintain deadlines (deadline register) — measurable only once deadlines fall due.",
  },
  C5: {
    de: "Control-Monitoring aktivieren und Risikoanalyse (Phase 04) mit Behandlung abschließen.",
    en: "Activate control monitoring and complete the risk analysis (phase 04) incl. treatment.",
  },
};

/** Farbton je Score — konsistent zum Dashboard (grün ≥80, amber ≥50, rose >0). */
function toneOf(score: number): { text: string; dot: string; de: string; en: string } {
  if (score >= 80) return { text: "st-ja-text", dot: "st-ja-bg", de: "Gut", en: "Good" };
  if (score >= 50) return { text: "st-teilweise-text", dot: "st-teilweise-bg", de: "Mittel", en: "Fair" };
  if (score > 0) return { text: "st-nein-text", dot: "st-nein-bg", de: "Kritisch", en: "Critical" };
  return { text: "text-muted-foreground", dot: "bg-muted-foreground/50", de: "—", en: "—" };
}

const CONF_LABEL: Record<"high" | "medium" | "low", { de: string; en: string }> = {
  high: { de: "hoch", en: "high" },
  medium: { de: "mittel", en: "medium" },
  low: { de: "niedrig", en: "low" },
};

/** Aggregierte Nachweis-Frische (C2) direkt aus der evidence-Tabelle. */
function useEvidenceFreshness(tenantId: string | null) {
  const [state, setState] = useState<{ fresh: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!tenantId) {
      setState({ fresh: 0, total: 0 });
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("evidence")
          .select("id, kind, collected_at, valid_until");
        if (error) throw error;
        const rows = (data ?? []) as Pick<Evidence, "id" | "kind" | "collected_at" | "valid_until">[];
        const now = new Date();
        let fresh = 0;
        for (const r of rows) {
          if (evidenceItemState(r as Evidence, now) === "fresh") fresh++;
        }
        if (alive) {
          setState({ fresh, total: rows.length });
          setLoading(false);
        }
      } catch {
        if (alive) {
          setState({ fresh: 0, total: 0 });
          setLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [tenantId]);

  return { state, loading };
}

interface DeadlineRow {
  id: string;
  status: string;
  starts_at: string | null;
  due_at: string | null;
  done_at: string | null;
}

/** Fristen-Treue (C4, rollierend 12 M) + Anzahl überfälliger Fristen (Penalty). */
function useDeadlineAdherence(tenantId: string | null) {
  const [state, setState] = useState<{ adherence: number | null; overdue: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!tenantId) {
      setState({ adherence: null, overdue: 0 });
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("compliance_deadlines")
          .select("id, status, starts_at, due_at, done_at")
          .eq("tenant_id", tenantId);
        if (error) throw error;
        const rows = (data ?? []) as DeadlineRow[];
        const now = Date.now();
        const windowStart = now - 365 * 86_400_000;

        // Fällig in den letzten 12 Monaten (mit due_at, Fälligkeit vergangen).
        // Stornierte Fristen zählen NICHT in die Fristtreue (weder Zähler noch
        // Nenner) — sonst senkt eine Stornierung (z. B. gelöschter Incident) die Quote.
        const dueInWindow = rows.filter((d) => {
          if (!d.due_at || d.status === "cancelled") return false;
          const due = new Date(d.due_at).getTime();
          return due <= now && due >= windowStart;
        });
        const onTime = dueInWindow.filter(
          (d) => d.status === "done" && d.done_at && new Date(d.done_at).getTime() <= new Date(d.due_at as string).getTime(),
        ).length;
        const adherence = dueInWindow.length > 0 ? onTime / dueInWindow.length : null;

        // Aktuell überfällig (offen/overdue, Fälligkeit in der Vergangenheit).
        const overdue = rows.filter(
          (d) => (d.status === "open" || d.status === "overdue") && !!d.due_at && new Date(d.due_at).getTime() < now,
        ).length;

        if (alive) {
          setState({ adherence, overdue });
          setLoading(false);
        }
      } catch {
        if (alive) {
          setState({ adherence: null, overdue: 0 });
          setLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [tenantId]);

  return { state, loading };
}

export function PostureCard({ de }: Props) {
  const { tenantId } = useAuth();
  const { overview, primary, loading: overviewLoading } = useComplianceOverview();
  const { failingCount, loading: healthLoading } = useControlHealth();
  const { state: evFresh, loading: evLoading } = useEvidenceFreshness(tenantId);
  const { state: dl, loading: dlLoading } = useDeadlineAdherence(tenantId);
  // C5: Risiken (dieselbe Ableitung wie Phase 04) + Behandlungsplan.
  const { result: riskResult, loading: riskLoading } = useRiskAnalysis(DEFAULT_RISK_CONFIG);
  const { data: treatmentState, loading: treatLoading } = useToolData<{ treatments?: TreatmentObject[] }>("risk-treatment", "risk-treatment", { treatments: [] });

  const loading = overviewLoading || healthLoading || evLoading || dlLoading || riskLoading || treatLoading;

  const result = useMemo<PostureResult | null>(() => {
    if (loading) return null;

    // C1 Framework-Reife ≈ gewichtete Konformität (Selbstauskunft ⇒ Konfidenz "low").
    let c1num = 0;
    let c1den = 0;
    let reifSum = 0;
    let reifCount = 0;
    for (const o of overview) {
      const app = o.stats.applicable;
      if (app > 0) {
        c1num += app * (o.stats.compliancePct / 100);
        c1den += app;
      }
      for (const [, eff] of o.effective) {
        if (eff.reifegrad != null) {
          reifSum += eff.reifegrad;
          reifCount++;
        }
      }
    }
    const c1: PostureComponentInput =
      c1den > 0 ? { value: c1num / c1den, confidence: "low" } : { value: null };

    // C2 Nachweis-Aktualität = frische / alle Nachweise.
    const c2: PostureComponentInput =
      evFresh && evFresh.total > 0 ? { value: evFresh.fresh / evFresh.total, confidence: "medium" } : { value: null };

    // C3 Reifegrad = Ø Reifegrad / 5.
    const c3: PostureComponentInput =
      reifCount > 0 ? { value: reifSum / reifCount / 5, confidence: "low" } : { value: null };

    // C4 Fristen-Treue (rollierend 12 M).
    const c4: PostureComponentInput =
      dl && dl.adherence != null ? { value: dl.adherence, confidence: "medium" } : { value: null };

    // C5 Risiko-Posture = Anteil des Brutto-Risikos, den ABGESCHLOSSENE Behandlungen
    // senken: 1 − Σ Rest-Score / Σ Brutto-Score. Rest-L/I zählt nur bei Behandlung
    // mit Status „done" und erfasstem Restrisiko; alles andere bleibt auf Brutto.
    // Ohne eine solche Behandlung: keine Daten (entfällt ehrlich).
    let c5: PostureComponentInput = { value: null };
    if (riskResult && riskResult.risks.length) {
      const tMap = new Map((treatmentState.treatments ?? []).filter(t => t.status === "done").map(t => [t.risk_id, t]));
      let inherent = 0, residual = 0, captured = 0;
      for (const r of riskResult.risks) {
        inherent += r.risk_score;
        const eff = effectiveResidualLI(r, tMap.get(r.risk_id));
        if (eff.captured) captured++;
        residual += scoreAndLevel(eff.likelihood, eff.impact, riskResult.config).score;
      }
      if (captured > 0 && inherent > 0) c5 = { value: Math.max(0, Math.min(1, 1 - residual / inherent)), confidence: "low" };
    }

    return computePosture({
      frameworkReadiness: c1,
      evidenceFreshness: c2,
      maturityNorm: c3,
      deadlineAdherence: c4,
      riskPosture: c5,
      criticalGaps: overview.reduce((a, o) => a + o.stats.criticalOpen, 0),
      failingTests: failingCount,
      overdueDeadlines: dl?.overdue ?? 0,
    });
  }, [loading, overview, primary, evFresh, dl, failingCount, riskResult, treatmentState.treatments]);

  // Auch bei Abdeckung 0 die Gate-Karte zeigen (alle 5 Bausteine + To-dos) statt
  // eines pauschalen Leer-Textes.
  const hasData = !!result;
  // D.2: belastbar erst ab POSTURE_MIN_COVERAGE — sonst Gate-Karte statt Zahl.
  const reliable = !!result && result.coverage >= POSTURE_MIN_COVERAGE;
  const missing = result ? result.components.filter((c) => !c.included) : [];
  const present = result ? result.components.filter((c) => c.included) : [];
  const tone = toneOf(result?.score ?? 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="size-4 text-accent" />
              {de ? "Sicherheits-Posture" : "Security posture"}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {de
                ? "Eine Kennzahl aus vorhandenen Daten (Konformität, Nachweise, Reifegrad, Fristen). Fehlende Bausteine entfallen ehrlich — keine erfundenen Werte."
                : "One score from existing data (compliance, evidence, maturity, deadlines). Missing components are honestly dropped — no invented values."}
            </p>
          </div>
          {hasData && reliable && (
            <Badge variant="outline" className={`gap-1 ${tone.text}`}>
              <span className={`size-2 rounded-full ${tone.dot}`} />
              {de ? tone.de : tone.en}
            </Badge>
          )}
          {hasData && !reliable && (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <span className="size-2 rounded-full bg-muted-foreground/50" />
              {de ? "nicht belastbar" : "not reliable"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading && (
          <div className="text-sm text-muted-foreground py-6 text-center">
            {de ? "Berechne Posture …" : "Computing posture …"}
          </div>
        )}

        {!loading && !hasData && (
          <div className="text-sm text-muted-foreground py-6 text-center">
            {de
              ? "Noch keine belegbaren Daten für eine Posture-Kennzahl. Beantworten Sie Kontrollen, hängen Sie Nachweise an oder pflegen Sie Fristen."
              : "No evidence-backed data for a posture score yet. Assess controls, attach evidence or maintain deadlines."}
          </div>
        )}

        {/* D.2 Gate: Abdeckung < 70 % ⇒ keine Zahl, keine Ampel — sondern was fehlt + was zu tun ist */}
        {!loading && hasData && result && !reliable && (
          <div className="space-y-4">
            <div className="rounded-md border st-teilweise-border st-teilweise-tint px-3 py-2.5">
              <div className="text-sm font-semibold st-teilweise-text">
                {de
                  ? `Posture noch nicht belastbar — ${missing.length} von ${result.components.length} Bausteinen ohne Daten`
                  : `Posture not yet reliable — ${missing.length} of ${result.components.length} components without data`}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {de
                  ? `Abdeckung ${Math.round(result.coverage * 100)} % (mindestens ${Math.round(POSTURE_MIN_COVERAGE * 100)} % nötig) · Konfidenz ${CONF_LABEL[result.confidence].de}. Eine Zahl aus so wenigen Bausteinen würde dem Konformitätswert widersprechen und wird deshalb nicht angezeigt.`
                  : `Coverage ${Math.round(result.coverage * 100)}% (at least ${Math.round(POSTURE_MIN_COVERAGE * 100)}% required) · confidence ${CONF_LABEL[result.confidence].en}. A score from so few components would contradict the compliance figure and is therefore not shown.`}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-foreground mb-1.5">{de ? "Fehlende Bausteine — was zu tun ist" : "Missing components — what to do"}</div>
              <ul className="space-y-1.5">
                {missing.map((c) => (
                  <li key={c.key} className="flex items-start gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs">
                    <span className="mt-1 size-2 rounded-full bg-muted-foreground/50 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-foreground">{c.label}</div>
                      <div className="text-muted-foreground">{COMPONENT_ACTION[c.key]?.[de ? "de" : "en"]}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {present.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-foreground mb-1.5">{de ? "Bausteine mit Daten" : "Components with data"}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {present.map((c) => (
                    <div key={c.key} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{c.label}</div>
                        <div className="text-[10.5px] text-muted-foreground leading-snug">{COMPONENT_DESC[c.key]?.[de ? "de" : "en"]}</div>
                      </div>
                      <div className="text-sm font-bold tabular-nums shrink-0">{c.value != null ? `${Math.round(c.value * 100)}%` : "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && hasData && result && reliable && (
          <div className="space-y-5">
            {/* Score + Abdeckung/Konfidenz */}
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="flex items-end gap-2">
                <span className={`text-4xl font-bold tabular-nums ${tone.text}`}>{Math.round(result.score)}</span>
                <span className="text-sm text-muted-foreground mb-1">/ 100</span>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                <div>
                  {de ? "Abdeckung" : "Coverage"}:{" "}
                  <span className="font-semibold text-foreground">{Math.round(result.coverage * 100)}%</span>
                </div>
                <div>
                  {de ? "Konfidenz" : "Confidence"}:{" "}
                  <span className="font-semibold text-foreground">
                    {de ? CONF_LABEL[result.confidence].de : CONF_LABEL[result.confidence].en}
                  </span>
                </div>
              </div>
            </div>
            <Progress value={result.score} className="h-2" />

            {/* Komponenten-Breakdown */}
            <div className="grid gap-2 sm:grid-cols-2">
              {result.components.map((c) => (
                <div
                  key={c.key}
                  className={`flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 ${
                    c.included ? "" : "opacity-60"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{c.label}</div>
                    <div className="text-[10.5px] text-muted-foreground leading-snug">
                      {COMPONENT_DESC[c.key]?.[de ? "de" : "en"]}
                    </div>
                    <div className="text-[10.5px] text-muted-foreground mt-0.5">
                      {c.included
                        ? `${de ? "Gewicht im Gesamtscore" : "Weight in overall score"}: ${Math.round(c.effectiveWeight * 100)}%`
                        : de
                          ? "keine Daten — fließt nicht in den Score ein"
                          : "no data — not counted in the score"}
                    </div>
                  </div>
                  <div className="text-sm font-bold tabular-nums shrink-0">
                    {c.included && c.value != null ? `${Math.round(c.value * 100)}%` : "—"}
                  </div>
                </div>
              ))}
            </div>

            {/* Abzüge (nur wenn vorhanden) */}
            {result.penalties.some((p) => p.points > 0) && (
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{de ? "Abzüge: " : "Penalties: "}</span>
                {result.penalties
                  .filter((p) => p.points > 0)
                  .map((p) => `${p.label} (−${p.points})`)
                  .join(" · ")}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PostureCard;
