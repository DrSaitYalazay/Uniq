/**
 * KPI Engine v3 — Step 16 (ENISA-anchored, 9 KPIs)
 *
 * Replaces the v1/v2 21-KPI engine with a defensible 9-KPI catalog:
 *   - Board layer (4+1): explainable compliance indicators for governance
 *   - Tracking layer (4): operational metrics for the implementation team
 *
 * Every KPI is tagged with:
 *   - tier   A | B | C | D  (regulatory → vendor default)
 *   - anchor short source/methodology string ("NIS2 Art. 23", "ENISA TIG §2.1",
 *             "Vendor default — configurable")
 *   - dashboardLayer  "board" | "tracking"
 *
 * Every KPI supports the "no_data" status — false-positive green is forbidden.
 *
 * Source references:
 *   - NIS2 Directive Art. 23 (24h early warning / 72h notification / 1 month final)
 *   - ENISA Technical Implementation Guidance (June 2025), §2.1 — risk acceptance
 *     example values (48h containment is an illustrative figure, not a mandate)
 *   - ENISA NIS Investments 2025, NIS360 — market benchmark context
 */

import type { SoAProjection } from "@/lib/soaProjection";
import type { ConsolidatedGap } from "@/lib/gapEngine";
import type { RiskObject } from "@/lib/riskEngine";
import { parseControlSelectionId, type TreatmentObject } from "@/lib/treatmentEngine";
import type { MaturityResult } from "@/lib/maturityEngine";
import { getReportBrandName, getReportBrandSlug } from "@/lib/reportBrand";

// ── Types ──

export type KPICategory = "compliance" | "risk" | "operational" | "maturity" | "time";
export type KPIStatus = "healthy" | "warning" | "critical" | "no_data";
export type TrendDirection = "up" | "down" | "stable";
export type KPITier = "A" | "B" | "C" | "D";
export type KPIDashboardLayer = "board" | "tracking";

export interface KPIMetric {
  id: string;
  category: KPICategory;
  tier: KPITier;
  dashboardLayer: KPIDashboardLayer;
  labelDe: string;
  labelEn: string;
  value: number;
  unit: "percent" | "count" | "score" | "days";
  target: number;
  status: KPIStatus;
  trend: TrendDirection;
  hasData: boolean;
  /** Short methodology / source attribution shown as a chip. */
  anchorDe: string;
  anchorEn: string;
  descriptionDe: string;
  descriptionEn: string;
  formulaDe: string;
  formulaEn: string;
  exampleDe: string;
  exampleEn: string;
  interpretationDe: string;
  interpretationEn: string;
  scenarioDe: string;
  scenarioEn: string;
  actionDe: string;
  actionEn: string;
}

export interface KPISnapshot {
  timestamp: string;
  metrics: Record<string, number>;
  hasData?: Record<string, boolean>;
}

export interface KPITrend {
  metricId: string;
  snapshots: { date: string; value: number }[];
  velocity: number;
  projectedCompletion: string | null;
}

export interface KPIResult {
  metrics: KPIMetric[];
  overallScore: number;
  overallStatus: KPIStatus;
  byCategory: Record<KPICategory, KPIMetric[]>;
  byLayer: Record<KPIDashboardLayer, KPIMetric[]>;
  trends: KPITrend[];
  alerts: KPIAlert[];
  velocityPerWeek: number;
  projectedCompletionDate: string | null;
}

export interface KPIAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  labelDe: string;
  labelEn: string;
  metricId: string;
}

export interface IncidentSummary {
  id: string;
  severity: string;
  status: string;
  occurred_at: string | null;
  detected_at: string | null;
  closed_at: string | null;
  reportable?: boolean;
  authority_notified?: boolean;
}

export interface KPIEngineInput {
  projection: SoAProjection;
  gaps: ConsolidatedGap[];
  risks: RiskObject[];
  treatments: TreatmentObject[];
  maturityResult: MaturityResult | null;
  actionOverrides?: Record<string, { status?: string; owner?: string; due_date?: string }>;
  previousSnapshots?: KPISnapshot[];
  incidents?: IncidentSummary[];
  /** Per-KPI user-defined target overrides (id → target). Status is recomputed proportionally. */
  targetOverrides?: Record<string, number>;
  /** Window for velocity / projection calculation. Default: latest two snapshots. */
  velocityWindow?: { fromIso: string; toIso: string };
  /** Roadmap audit deadline (ISO). When set, projected_completion target/status is aligned to it. */
  roadmapDeadlineIso?: string;
  /** Evidence records (Step 14) — feeds evidence_freshness_pct. Optional; absent/empty ⇒ no_data. */
  evidence?: { control_id?: string; valid_until: string | null }[];
  /** Deadline records (Step 15) — feeds deadline_adherence_pct. Optional; absent/empty ⇒ no_data. */
  deadlines?: { due_at: string; status: string; done_at?: string | null }[];
}

/** KPIs where lower value is better — used for proportional status recompute on target override. */
const LOWER_IS_BETTER = new Set([
  "open_high_risks", "overdue_treatments", "mttr_hours", "projected_completion",
]);

function recomputeStatusForTarget(metric: KPIMetric, newTarget: number): KPIStatus {
  if (!metric.hasData) return "no_data";
  const v = metric.value;
  if (LOWER_IS_BETTER.has(metric.id)) {
    if (v <= newTarget) return "healthy";
    if (v <= newTarget * 2 + 1) return "warning";
    return "critical";
  }
  // higher-is-better
  if (v >= newTarget) return "healthy";
  if (v >= newTarget * 0.8) return "warning";
  return "critical";
}

// ── Helpers ──

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

/** Higher-is-better banded status. */
function bandHigh(value: number, healthyAt: number, warningAt: number): KPIStatus {
  if (value >= healthyAt) return "healthy";
  if (value >= warningAt) return "warning";
  return "critical";
}

/** Lower-is-better banded status (count-style). */
function bandLow(value: number, healthyMax: number, warningMax: number): KPIStatus {
  if (value <= healthyMax) return "healthy";
  if (value <= warningMax) return "warning";
  return "critical";
}

// ── Main KPI Computation ──

export function computeKPIs(input: KPIEngineInput): KPIResult {
  const { projection, risks, treatments, maturityResult, actionOverrides, previousSnapshots, incidents, targetOverrides, velocityWindow, roadmapDeadlineIso, evidence, deadlines } = input;
  const controls = projection.allControls;
  const stats = projection.stats;
  const applicable = controls.filter(c => c.applicable && !c.isExcluded);
  const now = new Date().toISOString().slice(0, 10);
  const execActionEntries: Array<{ controlId: string; status?: string; due_date?: string; dueDate?: string }> = Array.isArray(actionOverrides)
    ? (actionOverrides as any[]).map(a => ({ ...a, controlId: a.controlId ?? a.control_id ?? a.id }))
    : Object.entries(actionOverrides ?? {}).map(([controlId, action]) => ({ ...(action as any), controlId }));
  const execByControl = new Map(execActionEntries.filter(a => a.controlId).map(a => [a.controlId, a]));
  const toTreatmentStatus = (status?: string): "planned" | "in_progress" | "done" | null => {
    const s = (status ?? "").toLowerCase();
    if (["done", "fertig", "completed", "verified"].includes(s)) return "done";
    if (["in_progress", "in-progress", "laufend", "approved", "blockiert", "blocked"].includes(s)) return "in_progress";
    if (["planned", "open", "offen", "not_started", "not-started", "proposed"].includes(s)) return "planned";
    return null;
  };
  const treatmentRuntime = (t: TreatmentObject) => {
    const linked = (t.selected_control_ids ?? []).map(id => {
      const parsed = parseControlSelectionId(id);
      return execByControl.get(id) ?? (parsed.framework ? execByControl.get(parsed.controlId) : undefined);
    }).filter(Boolean) as Array<{ status?: string; due_date?: string; dueDate?: string }>;
    const statuses = linked.map(a => toTreatmentStatus(a.status)).filter(Boolean) as Array<"planned" | "in_progress" | "done">;
    const derivedStatus = statuses.length > 0 && statuses.every(s => s === "done") ? "done"
      : statuses.some(s => s === "in_progress" || s === "done") ? "in_progress"
      : statuses[0] ?? t.status;
    const dueDates = linked.map(a => a.due_date ?? a.dueDate).filter(Boolean) as string[];
    return { status: derivedStatus, dueDates: dueDates.length ? dueDates : (t.due_date ? [t.due_date] : []) };
  };
  const snapshots = previousSnapshots ?? [];
  const incList = incidents ?? [];

  const metrics: KPIMetric[] = [];

  // ═══════════════════════════════════════════
  // #1 — Meldefristen-Einhaltung  (Tier A, NIS2 Art. 23)
  // ═══════════════════════════════════════════
  const reportable = incList.filter(i => i.reportable === true);
  const notified = reportable.filter(i => i.authority_notified === true).length;
  const meldepct = reportable.length > 0 ? pct(notified, reportable.length) : 0;
  const meldeHasData = reportable.length > 0;
  metrics.push({
    id: "meldefristen",
    category: "compliance",
    tier: "A",
    dashboardLayer: "board",
    labelDe: "Meldefristen-Einhaltung",
    labelEn: "Reporting Deadlines Adherence",
    value: meldepct,
    unit: "percent",
    target: 100,
    status: !meldeHasData ? "no_data" : meldepct >= 100 ? "healthy" : meldepct >= 80 ? "warning" : "critical",
    trend: "stable",
    hasData: meldeHasData,
    anchorDe: "NIS2 Art. 23 — Pflichtwert (24h/72h/1 Monat)",
    anchorEn: "NIS2 Art. 23 — mandatory (24h / 72h / 1 month)",
    descriptionDe: "Anteil der meldepflichtigen Vorfälle, für die eine fristgerechte Behördenmeldung erfolgt ist (Flag 'authority_notified' im Incident-Register). NIS2 Art. 23 fordert drei Fristen: 24h-Frühwarnung, 72h-Meldung, 1-Monats-Abschlussbericht. Verstöße sind sanktionsbewehrt.",
    descriptionEn: "Share of reportable incidents with timely authority notification (flag 'authority_notified' in the Incident Register). NIS2 Art. 23 mandates three deadlines: 24h early warning, 72h notification, 1-month final report. Violations are subject to sanctions.",
    formulaDe: "( Vorfälle mit authority_notified=true ÷ Vorfälle mit reportable=true ) × 100",
    formulaEn: "( Incidents with authority_notified=true ÷ Incidents with reportable=true ) × 100",
    exampleDe: meldeHasData
      ? `${notified} von ${reportable.length} meldepflichtigen Vorfällen wurden der Behörde gemeldet = ${meldepct}%.`
      : "Noch keine meldepflichtigen Vorfälle erfasst — KPI wartet auf Datengrundlage (Schritt 13).",
    exampleEn: meldeHasData
      ? `${notified} of ${reportable.length} reportable incidents have been notified to the authority = ${meldepct}%.`
      : "No reportable incidents yet — KPI awaits data basis (Step 13).",
    interpretationDe: "100% = Pflicht erfüllt. <100% = Direkter Regelverstoß gegen NIS2 Art. 23. 'Keine Daten' bedeutet nicht 'gut' — es bedeutet nur, dass kein meldepflichtiger Vorfall vorlag.",
    interpretationEn: "100% = obligation met. <100% = direct breach of NIS2 Art. 23. 'No data' does not mean 'good' — it just means no reportable incident has occurred.",
    scenarioDe: "Beispiel: 2 meldepflichtige Vorfälle im Quartal, einer ohne Behördenmeldung → 50%. Auditbefund: 'Verstoß gegen Meldepflicht.' Bei NIS2-Audit ein direktes Major Finding.",
    scenarioEn: "Example: 2 reportable incidents in a quarter, one without authority notification → 50%. Audit finding: 'Breach of reporting obligation.' Direct major finding at a NIS2 audit.",
    actionDe: "Im Incident-Register (Schritt 13) jeden meldepflichtigen Vorfall mit 'Behörde benachrichtigt' markieren, sobald die 24h/72h-Meldung erfolgt ist.",
    actionEn: "In the Incident Register (Step 13), flag 'Authority notified' for every reportable incident once the 24h/72h notification has been sent.",
  });

  // ═══════════════════════════════════════════
  // #2 — Control Implementation  (Tier C, applicable-only denominator)
  // ═══════════════════════════════════════════
  const implDenom = applicable.length;
  const implRate = pct(stats.implemented, implDenom);
  const implHasData = implDenom > 0;
  metrics.push({
    id: "control_implementation",
    category: "compliance",
    tier: "C",
    dashboardLayer: "board",
    labelDe: "Kontrollumsetzungsgrad",
    labelEn: "Control Implementation",
    value: implRate,
    unit: "percent",
    target: 100,
    status: !implHasData ? "no_data" : implRate >= 95 ? "healthy" : implRate >= 80 ? "warning" : "critical",
    trend: "stable",
    hasData: implHasData,
    anchorDe: "Markt-Benchmark — Nenner: anwendbare Kontrollen (SoA NA/Entbehrlich ausgeschlossen)",
    anchorEn: "Market benchmark — denominator: applicable controls (SoA NA/Entbehrlich excluded)",
    descriptionDe: "Anteil der für Ihr Unternehmen anwendbaren Kontrollen (SoA: 'Nicht anwendbar' und 'Entbehrlich' aus dem Nenner ausgeschlossen), die vollständig umgesetzt sind. Erst nach dieser Bereinigung ist 100% ein realistisches Ziel.",
    descriptionEn: "Share of controls applicable to your organisation (SoA: 'Not Applicable' and 'Excluded' removed from the denominator) that are fully implemented. Only after this normalisation is 100% a realistic target.",
    formulaDe: "( Vollständig umgesetzt ÷ Anwendbare Kontrollen ) × 100",
    formulaEn: "( Fully Implemented ÷ Applicable Controls ) × 100",
    exampleDe: implHasData
      ? `${stats.implemented} von ${implDenom} anwendbaren Kontrollen umgesetzt = ${implRate}%.`
      : "Keine anwendbaren Kontrollen — SoA (Schritt 10) ausfüllen.",
    exampleEn: implHasData
      ? `${stats.implemented} of ${implDenom} applicable controls implemented = ${implRate}%.`
      : "No applicable controls — complete the SoA (Step 10).",
    interpretationDe: "≥95% = audit-bereit. 80–94% = Endspurt. <80% = substanzielle Lücken. Schwellen sind konfigurierbar (Governance-Entscheidung).",
    interpretationEn: "≥95% = audit-ready. 80–94% = final stretch. <80% = substantive gaps. Thresholds are configurable (governance decision).",
    scenarioDe: "100 anwendbare Kontrollen, 78 umgesetzt → 78%. Ein Auditor fragt: 'Welche 22 sind offen und warum?' Die Antwort muss aus Schritt 12 dokumentiert sein.",
    scenarioEn: "100 applicable controls, 78 implemented → 78%. An auditor asks: 'Which 22 are open and why?' The answer must be documented from Step 12.",
    actionDe: "Schritt 12 öffnen, nach Status 'Nein/Teilweise' filtern, Hochrisiko-verknüpfte Kontrollen zuerst.",
    actionEn: "Open Step 12, filter by status 'No/Partial', high-risk-linked controls first.",
  });

  // ═══════════════════════════════════════════
  // #3 — Open High/Critical Risks  (Tier C, board)
  // ═══════════════════════════════════════════
  const highCrit = risks.filter(r => r.risk_level === "critical" || r.risk_level === "high");
  const treatedHC = highCrit.filter(r => treatments.find(t => t.risk_id === r.risk_id && treatmentRuntime(t).status === "done")).length;
  const openHC = highCrit.length - treatedHC;
  const hcHasData = risks.length > 0;
  metrics.push({
    id: "open_high_risks",
    category: "risk",
    tier: "C",
    dashboardLayer: "board",
    labelDe: "Offene Hoch-/Kritische Risiken",
    labelEn: "Open High/Critical Risks",
    value: openHC,
    unit: "count",
    target: 0,
    status: !hcHasData ? "no_data" : bandLow(openHC, 2, 5),
    trend: "stable",
    hasData: hcHasData,
    anchorDe: "Markt-Benchmark — Schwellen konfigurierbar (Risikoappetit)",
    anchorEn: "Market benchmark — thresholds configurable (risk appetite)",
    descriptionDe: "Anzahl der Risiken mit Einstufung 'Hoch' oder 'Kritisch', die noch nicht vollständig behandelt sind (Status ≠ 'erledigt' in Schritt 9).",
    descriptionEn: "Count of risks rated 'High' or 'Critical' that are not yet fully treated (status ≠ 'done' in Step 9).",
    formulaDe: "Hoch-/Kritische Risiken gesamt − vollständig behandelte Hoch-/Kritische Risiken",
    formulaEn: "Total high/critical risks − fully treated high/critical risks",
    exampleDe: hcHasData
      ? `${highCrit.length} Hoch-/Kritisch insgesamt, ${treatedHC} behandelt → ${openHC} offen.`
      : "Noch keine Risiken generiert — Pipeline durchlaufen (Schritte 6–8).",
    exampleEn: hcHasData
      ? `${highCrit.length} high/critical total, ${treatedHC} treated → ${openHC} open.`
      : "No risks generated yet — complete the pipeline (Steps 6–8).",
    interpretationDe: "Ziel 0. 1–2 = beherrschbar. 3–5 = erhöhte Aufmerksamkeit. >5 = Management-Eskalation (NIS2 Art. 20).",
    interpretationEn: "Target 0. 1–2 = manageable. 3–5 = elevated attention. >5 = management escalation (NIS2 Art. 20).",
    scenarioDe: "Risiko 'Ransomware Produktionsserver' = Kritisch, noch ohne Behandlung → zählt hier als offen.",
    scenarioEn: "Risk 'Ransomware on production servers' = Critical, untreated → counted here as open.",
    actionDe: "Schritt 9 öffnen, nach Hoch/Kritisch filtern, jedem Risiko Strategie + Owner zuweisen.",
    actionEn: "Open Step 9, filter by High/Critical, assign strategy + owner to each risk.",
  });

  // ═══════════════════════════════════════════
  // #4 — Overdue Treatments  (Tier D, tracking)
  // ═══════════════════════════════════════════
  const overdueTr = treatments.filter(t => {
    const rt = treatmentRuntime(t);
    return rt.status !== "done" && rt.dueDates.some(d => d < now);
  }).length;
  const trHasData = treatments.length > 0;
  metrics.push({
    id: "overdue_treatments",
    category: "risk",
    tier: "D",
    dashboardLayer: "tracking",
    labelDe: "Überfällige Behandlungen",
    labelEn: "Overdue Treatments",
    value: overdueTr,
    unit: "count",
    target: 0,
    status: !trHasData ? "no_data" : bandLow(overdueTr, 0, 2),
    trend: "stable",
    hasData: trHasData,
    anchorDe: "Vendor default — Schwellen konfigurierbar",
    anchorEn: "Vendor default — configurable thresholds",
    descriptionDe: "Risikobehandlungen, deren Fälligkeitsdatum überschritten ist und die noch nicht abgeschlossen wurden.",
    descriptionEn: "Risk treatments whose due date has passed and that are not yet completed.",
    formulaDe: "Anzahl( Behandlungen mit Fälligkeit < heute UND Status ≠ 'erledigt' )",
    formulaEn: "Count( treatments where due_date < today AND status ≠ 'done' )",
    exampleDe: trHasData ? `${overdueTr} Behandlungen überfällig.` : "Noch keine Behandlungen vorhanden (Schritt 9).",
    exampleEn: trHasData ? `${overdueTr} treatments overdue.` : "No treatments yet (Step 9).",
    interpretationDe: "Ziel 0. 1–2 = normale Projektreibung. >2 = systematischer Rückstand, Ursache klären.",
    interpretationEn: "Target 0. 1–2 = normal project friction. >2 = systematic backlog, investigate root cause.",
    scenarioDe: "'MFA für Admin-Konten' geplant 1.3., heute April, Status 'in Bearbeitung' → zählt hier.",
    scenarioEn: "'MFA for admin accounts' planned for 1 Mar, today April, status 'in progress' → counted here.",
    actionDe: "Schritt 9 nach Fälligkeit sortieren — Termine aktualisieren oder Behandlungen abschließen.",
    actionEn: "Sort Step 9 by due date — update deadlines or close treatments.",
  });

  // ═══════════════════════════════════════════
  // #5 — MTTR  (Tier B, ENISA TIG §2.1 — Beispielwert 48h)
  // ═══════════════════════════════════════════
  const days = (d: number) => d * 86_400_000;
  const recent90 = incList.filter(i => {
    const t = i.detected_at ? Date.parse(i.detected_at) : NaN;
    return !isNaN(t) && Date.now() - t <= days(90);
  });
  const mttrSamples = recent90
    .map(i => {
      if (!i.detected_at || !i.closed_at) return null;
      const d = Date.parse(i.detected_at), c = Date.parse(i.closed_at);
      if (isNaN(d) || isNaN(c) || c < d) return null;
      return (c - d) / 3_600_000;
    })
    .filter((v): v is number => v !== null);
  const mttrHours = mttrSamples.length > 0 ? Math.round(mttrSamples.reduce((s, v) => s + v, 0) / mttrSamples.length) : 0;
  const mttrHasData = mttrSamples.length > 0;
  metrics.push({
    id: "mttr_hours",
    category: "operational",
    tier: "B",
    dashboardLayer: "tracking",
    labelDe: "MTTR — Behebungszeit (Std.)",
    labelEn: "MTTR — Mean Time To Resolve (h)",
    value: mttrHours,
    unit: "count",
    target: 48,
    status: !mttrHasData ? "no_data" : bandLow(mttrHours, 48, 168),
    trend: "stable",
    hasData: mttrHasData,
    anchorDe: "ENISA TIG §2.1 — 48h ist Beispielwert (kein Pflichtwert); Zielwert konfigurierbar",
    anchorEn: "ENISA TIG §2.1 — 48h is an illustrative example (not mandatory); target configurable",
    descriptionDe: "Durchschnittliche Zeit zwischen Erkennung (detected_at) und Schließung (closed_at) eines Vorfalls — über die letzten 90 Tage. Der Zielwert 48h folgt dem Beispiel aus den ENISA-Risikoakzeptanzkriterien (TIG §2.1) und ist keine NIS2-Pflicht.",
    descriptionEn: "Average time between detection (detected_at) and closure (closed_at) of an incident — over the last 90 days. The 48h target follows the example from ENISA risk-acceptance criteria (TIG §2.1) and is not a NIS2 mandate.",
    formulaDe: "Ø ( closed_at − detected_at ) über geschlossene Vorfälle der letzten 90 Tage",
    formulaEn: "Avg ( closed_at − detected_at ) over closed incidents in last 90 days",
    exampleDe: mttrHasData ? `${mttrSamples.length} Vorfälle, Ø ${mttrHours} h.` : "Noch keine geschlossenen Vorfälle in 90 Tagen.",
    exampleEn: mttrHasData ? `${mttrSamples.length} incidents, avg ${mttrHours}h.` : "No closed incidents in the last 90 days.",
    interpretationDe: "≤48 h = ENISA-Beispielziel erreicht. 49–168 h = akzeptabel. >168 h (1 Woche) = zu langsam.",
    interpretationEn: "≤48h = ENISA example target met. 49–168h = acceptable. >168h (1 week) = too slow.",
    scenarioDe: "MTTR 240h: unklare Zuständigkeiten, keine Out-of-Hours-Bereitschaft → Runbooks + On-Call definieren.",
    scenarioEn: "MTTR 240h: unclear ownership, no out-of-hours coverage → define runbooks + on-call.",
    actionDe: "Runbooks je Vorfall-Typ, Eskalationsmatrix, Lieferanten-SLAs prüfen.",
    actionEn: "Runbooks per incident type, escalation matrix, review vendor SLAs.",
  });

  // ═══════════════════════════════════════════
  // #6 — Maturity: % Domains ≥ 3.0  (Tier B, board)
  // ═══════════════════════════════════════════
  const groups = maturityResult?.groups ?? [];
  const groupsAtTarget = groups.filter(g => g.maturityScore >= 3.0).length;
  const matPct = groups.length > 0 ? pct(groupsAtTarget, groups.length) : 0;
  const matHasData = groups.length > 0;
  const laggard = matHasData ? [...groups].sort((a, b) => a.maturityScore - b.maturityScore)[0] : null;
  metrics.push({
    id: "maturity_domains_at_target",
    category: "maturity",
    tier: "B",
    dashboardLayer: "board",
    labelDe: "Reifegrad: Domänen ≥ 3.0",
    labelEn: "Maturity: Domains ≥ 3.0",
    value: matPct,
    unit: "percent",
    target: 100,
    status: !matHasData ? "no_data" : matPct >= 95 ? "healthy" : matPct >= 80 ? "warning" : "critical",
    trend: "stable",
    hasData: matHasData,
    anchorDe: "ENISA-Erwartung: 'Definiert & Gesteuert' (≥ Level 3) für alle NIS2-Domänen",
    anchorEn: "ENISA expectation: 'Defined & Managed' (≥ level 3) across all NIS2 domains",
    descriptionDe: "Anteil der NIS2-Domänen, deren Reifegrad ≥ 3.0 ist. Bewusst kein Durchschnittswert: ein Mittelwert von 3.5 kann eine kritisch schwache Einzeldomäne (z.B. 1.0) verstecken. Dieser KPI macht Lücken sichtbar.",
    descriptionEn: "Share of NIS2 domains with maturity ≥ 3.0. Deliberately not an average: a mean of 3.5 can hide one critically weak domain (e.g. 1.0). This KPI surfaces gaps.",
    formulaDe: "( Domänen mit Reifegrad ≥ 3.0 ÷ Anzahl Domänen ) × 100",
    formulaEn: "( Domains with maturity ≥ 3.0 ÷ Total domains ) × 100",
    exampleDe: matHasData
      ? `${groupsAtTarget} von ${groups.length} Domänen ≥ 3.0 = ${matPct}%.${laggard && laggard.maturityScore < 3.0 ? ` Schwächste: "${laggard.title}" (${laggard.maturityScore.toFixed(1)}).` : ""}`
      : "Reifegrad (Schritt 11) ausfüllen.",
    exampleEn: matHasData
      ? `${groupsAtTarget} of ${groups.length} domains ≥ 3.0 = ${matPct}%.${laggard && laggard.maturityScore < 3.0 ? ` Weakest: "${laggard.title}" (${laggard.maturityScore.toFixed(1)}).` : ""}`
      : "Complete Maturity (Step 11).",
    interpretationDe: "100% = alle Domänen NIS2-konform. ≥95% = audit-bereit. 80–94% = einzelne Lücken. <80% = breite Schwächen.",
    interpretationEn: "100% = all domains NIS2-conformant. ≥95% = audit-ready. 80–94% = isolated gaps. <80% = broad weaknesses.",
    scenarioDe: "5 Domänen bei 4.0, 1 bei 1.0 → Durchschnitt wäre 3.5 ('grün'), aber % ≥ 3.0 = 83% (warnung). Die schwache Domäne wird sichtbar.",
    scenarioEn: "5 domains at 4.0, 1 at 1.0 → average would be 3.5 ('green'), but % ≥ 3.0 = 83% (warning). The weak domain surfaces.",
    actionDe: "Schritt 11 öffnen, Domänen < 3.0 identifizieren, je einen Quick-Win-Plan (3 Monate) erstellen.",
    actionEn: "Open Step 11, identify domains < 3.0, draft one quick-win plan (3 months) per domain.",
  });

  // ═══════════════════════════════════════════
  // #7 — High-Risk Coverage  (Tier C, tracking)
  // ═══════════════════════════════════════════
  const highRiskLinked = applicable.filter(c => c.linkedToHighRisk).length;
  const highRiskImpl = applicable.filter(c => c.linkedToHighRisk && c.implStatus === "ja").length;
  const hrCov = pct(highRiskImpl, highRiskLinked);
  const hrHasData = highRiskLinked > 0;
  metrics.push({
    id: "high_risk_coverage",
    category: "maturity",
    tier: "C",
    dashboardLayer: "tracking",
    labelDe: "Hochrisiko-Abdeckung",
    labelEn: "High-Risk Coverage",
    value: hrCov,
    unit: "percent",
    target: 100,
    status: !hrHasData ? "no_data" : hrCov >= 95 ? "healthy" : hrCov >= 80 ? "warning" : "critical",
    trend: "stable",
    hasData: hrHasData,
    anchorDe: "Markt-Benchmark — Priorisierungslogik (Kontrollen mit Hochrisiko-Bindung zuerst)",
    anchorEn: "Market benchmark — prioritisation logic (high-risk-linked controls first)",
    descriptionDe: "Anteil der mit Hochrisiken verknüpften Kontrollen, die vollständig umgesetzt sind. Misst, ob die Umsetzung dort ansetzt, wo es am dringendsten ist.",
    descriptionEn: "Share of controls linked to high risks that are fully implemented. Measures whether implementation focuses where it matters most.",
    formulaDe: "( Umgesetzte Hochrisiko-Kontrollen ÷ Hochrisiko-Kontrollen gesamt ) × 100",
    formulaEn: "( Implemented high-risk controls ÷ Total high-risk controls ) × 100",
    exampleDe: hrHasData ? `${highRiskImpl} von ${highRiskLinked} Hochrisiko-Kontrollen umgesetzt = ${hrCov}%.` : "Noch keine Hochrisiko-Verknüpfung vorhanden.",
    exampleEn: hrHasData ? `${highRiskImpl} of ${highRiskLinked} high-risk controls implemented = ${hrCov}%.` : "No high-risk linkage yet.",
    interpretationDe: "≥95% = die wichtigsten Risiken sind abgedeckt. <80% = Priorisierung verfehlt — Quick-Win.",
    interpretationEn: "≥95% = the most important risks are covered. <80% = prioritisation off — quick win available.",
    scenarioDe: "20 Hochrisiko-Kontrollen, 12 umgesetzt = 60% → kritisch. Die 8 offenen sind vermutlich Top-Priorität.",
    scenarioEn: "20 high-risk controls, 12 implemented = 60% → critical. The 8 open are likely top priority.",
    actionDe: "SoA (Schritt 10) nach 'Hochrisiko-verknüpft' filtern, offene Kontrollen abarbeiten.",
    actionEn: "Filter SoA (Step 10) by 'High-risk-linked', work through open controls.",
  });

  // ═══════════════════════════════════════════
  // #8 — Compliance Velocity  (Tier D, tracking)
  // ═══════════════════════════════════════════
  let velocity = 0;
  let velocityHasData = false;
  let velocitySpanDays = 0;
  let velocityBaselineIso: string | null = null;
  let velocityLatestIso: string | null = null;
  if (velocityWindow) {
    const fromT = new Date(velocityWindow.fromIso).getTime();
    const toT = new Date(velocityWindow.toIso).getTime();
    const sorted = [...snapshots].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const inRange = sorted.filter(s => {
      const t = new Date(s.timestamp).getTime();
      return t >= fromT && t <= toT;
    });
    // Baseline: earliest in range, or latest snapshot before fromT as fallback.
    const latest = inRange[inRange.length - 1];
    let baseline = inRange[0];
    if (latest && (!baseline || baseline === latest)) {
      const before = [...sorted].reverse().find(s => new Date(s.timestamp).getTime() < fromT);
      if (before) baseline = before;
    }
    if (latest && baseline && baseline !== latest) {
      const dDays = (new Date(latest.timestamp).getTime() - new Date(baseline.timestamp).getTime()) / 86_400_000;
      const dImpl = (latest.metrics["control_implementation"] ?? 0) - (baseline.metrics["control_implementation"] ?? 0);
      if (dDays > 0) {
        velocity = Math.round((dImpl / dDays) * 7 * 10) / 10;
        velocityHasData = true;
        velocitySpanDays = Math.round(dDays);
        velocityBaselineIso = baseline.timestamp;
        velocityLatestIso = latest.timestamp;
      }
    }
  } else if (snapshots.length >= 2) {
    const latest = snapshots[snapshots.length - 1];
    const prev = snapshots[snapshots.length - 2];
    const dDays = (new Date(latest.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 86_400_000;
    const dImpl = (latest.metrics["control_implementation"] ?? 0) - (prev.metrics["control_implementation"] ?? 0);
    if (dDays > 0) {
      velocity = Math.round((dImpl / dDays) * 7 * 10) / 10;
      velocityHasData = true;
      velocitySpanDays = Math.round(dDays);
      velocityBaselineIso = prev.timestamp;
      velocityLatestIso = latest.timestamp;
    }
  }
  const velWindowLabelDe = velocityWindow
    ? `Zeitraum: ${velocityWindow.fromIso} – ${velocityWindow.toIso}`
    : "Zeitraum: letzte zwei Snapshots";
  const velWindowLabelEn = velocityWindow
    ? `Window: ${velocityWindow.fromIso} – ${velocityWindow.toIso}`
    : "Window: last two snapshots";
  metrics.push({
    id: "compliance_velocity",
    category: "time",
    tier: "D",
    dashboardLayer: "tracking",
    labelDe: "Compliance-Geschwindigkeit",
    labelEn: "Compliance Velocity",
    value: velocity,
    unit: "score",
    target: 3,
    status: !velocityHasData ? "no_data" : velocity >= 3 ? "healthy" : velocity > 0 ? "warning" : "critical",
    trend: velocity > 0 ? "up" : velocity < 0 ? "down" : "stable",
    hasData: velocityHasData,
    anchorDe: "Vendor default — abgeleitet aus Kontrollumsetzungs-Snapshots",
    anchorEn: "Vendor default — derived from Control Implementation snapshots",
    descriptionDe: `Prozentpunkte Kontrollumsetzung pro Woche. ${velWindowLabelDe}.`,
    descriptionEn: `Percentage points of control implementation gained per week. ${velWindowLabelEn}.`,
    formulaDe: "(Rate am Endpunkt − Rate am Startpunkt) ÷ Tage im Zeitraum × 7",
    formulaEn: "(rate at end − rate at start) ÷ days in window × 7",
    exampleDe: velocityHasData
      ? `${velocity > 0 ? "+" : ""}${velocity} pp/Woche über ${velocitySpanDays} Tage (${velocityBaselineIso?.slice(0, 10)} → ${velocityLatestIso?.slice(0, 10)}).`
      : "Im gewählten Zeitraum keine 2 Snapshots verfügbar — Zeitraum erweitern oder Dashboard regelmäßig öffnen.",
    exampleEn: velocityHasData
      ? `${velocity > 0 ? "+" : ""}${velocity} pp/week over ${velocitySpanDays} days (${velocityBaselineIso?.slice(0, 10)} → ${velocityLatestIso?.slice(0, 10)}).`
      : "Not enough snapshots in the selected window — widen the range or open the dashboard regularly.",
    interpretationDe: "≥3 pp/Woche = guter Fortschritt. 0–3 = langsam. ≤0 = Stillstand/Rückschritt.",
    interpretationEn: "≥3 pp/week = good progress. 0–3 = slow. ≤0 = stalled/regressing.",
    scenarioDe: "Letzter Snapshot 60%, dieser 65%, 7 Tage Abstand → 5 pp/Woche.",
    scenarioEn: "Last snapshot 60%, this 65%, 7 days apart → 5 pp/week.",
    actionDe: "Wöchentlicher KPI-Review baut verlässliche Trenddaten auf.",
    actionEn: "Weekly KPI review builds reliable trend data.",
  });

  // ═══════════════════════════════════════════
  // #9 — Projected Completion  (Tier D, board 4+1)
  // ═══════════════════════════════════════════
  let projectedDate: string | null = null;
  let projDays = 0;
  if (velocityHasData && velocity > 0 && implRate < 100) {
    const weeksRem = Math.ceil((100 - implRate) / velocity);
    const p = new Date();
    p.setDate(p.getDate() + weeksRem * 7);
    projectedDate = p.toISOString().slice(0, 10);
    projDays = weeksRem * 7;
  }
  const projHasData = projectedDate !== null;
  // ── Roadmap deadline sync (Step 15 ↔ Step 16) ──
  // When a Roadmap audit target date is set, the projection target/status aligns with it
  // instead of the static 180/365 vendor defaults.
  let projTarget = 180;
  let projStatusBase: KPIStatus = !projHasData ? "no_data" : projDays <= 180 ? "healthy" : projDays <= 365 ? "warning" : "critical";
  let deadlineDays: number | null = null;
  if (roadmapDeadlineIso) {
    const dl = new Date(roadmapDeadlineIso);
    if (!isNaN(dl.getTime())) {
      const ms = dl.getTime() - Date.now();
      deadlineDays = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
      projTarget = deadlineDays;
      if (projHasData) {
        if (projDays <= deadlineDays) projStatusBase = "healthy";
        else if (projDays <= Math.ceil(deadlineDays * 1.25)) projStatusBase = "warning";
        else projStatusBase = "critical";
      }
    }
  }
  const deadlineSuffixDe = deadlineDays !== null ? ` Roadmap-Frist: ${deadlineDays} Tage (${roadmapDeadlineIso!.slice(0, 10)}).` : "";
  const deadlineSuffixEn = deadlineDays !== null ? ` Roadmap deadline: ${deadlineDays} days (${roadmapDeadlineIso!.slice(0, 10)}).` : "";
  metrics.push({
    id: "projected_completion",
    category: "time",
    tier: "D",
    dashboardLayer: "board",
    labelDe: "Voraussichtlicher Abschluss",
    labelEn: "Projected Completion",
    value: projDays,
    unit: "days",
    target: projTarget,
    status: projStatusBase,
    trend: "stable",
    hasData: projHasData,
    anchorDe: deadlineDays !== null
      ? "Roadmap-Audit-Termin (Schritt 15) — lineare Extrapolation der Geschwindigkeit"
      : "Vendor default — lineare Extrapolation der Geschwindigkeit (Endphase 20 % Puffer empfohlen)",
    anchorEn: deadlineDays !== null
      ? "Roadmap audit target date (Step 15) — linear velocity extrapolation"
      : "Vendor default — linear velocity extrapolation (add 20% buffer for final phase)",
    descriptionDe: "Tage bis 100% Kontrollumsetzung bei aktueller Geschwindigkeit. 'Keine Daten' bei velocity ≤ 0 — bewusst keine irreführende Zahl wie '999 Tage'." + deadlineSuffixDe,
    descriptionEn: "Days until 100% control implementation at current velocity. 'No data' when velocity ≤ 0 — deliberately no misleading number like '999 days'." + deadlineSuffixEn,
    formulaDe: "(100 − aktuelle Rate) ÷ Wochengeschwindigkeit × 7",
    formulaEn: "(100 − current rate) ÷ weekly velocity × 7",
    exampleDe: projHasData ? `Ca. ${projDays} Tage → ${projectedDate}.` : "Geschwindigkeit ≤ 0 oder zu wenige Snapshots — Prognose nicht möglich.",
    exampleEn: projHasData ? `~${projDays} days → ${projectedDate}.` : "Velocity ≤ 0 or too few snapshots — projection not possible.",
    interpretationDe: deadlineDays !== null
      ? `≤${deadlineDays} Tage = im Zeitrahmen. ${deadlineDays + 1}–${Math.ceil(deadlineDays * 1.25)} = Frist gefährdet. >${Math.ceil(deadlineDays * 1.25)} = Frist verfehlt.`
      : "≤180 Tage = im Zeitrahmen. 181–365 = Frist gefährdet. >365 = Frist verfehlt.",
    interpretationEn: deadlineDays !== null
      ? `≤${deadlineDays} days = on schedule. ${deadlineDays + 1}–${Math.ceil(deadlineDays * 1.25)} = deadline at risk. >${Math.ceil(deadlineDays * 1.25)} = deadline missed.`
      : "≤180 days = on schedule. 181–365 = deadline at risk. >365 = deadline missed.",
    scenarioDe: "Rate 60%, Velocity 3 pp/Woche → 40 ÷ 3 ≈ 13 Wochen ≈ 91 Tage.",
    scenarioEn: "Rate 60%, velocity 3 pp/week → 40 ÷ 3 ≈ 13 weeks ≈ 91 days.",
    actionDe: "Datum mit NIS2-Frist vergleichen — bei Rückstand Ressourcen oder Scope priorisieren.",
    actionEn: "Compare with the NIS2 deadline — if behind, add resources or prioritise scope.",
  });

  // ═══════════════════════════════════════════
  // #10 — Evidence Freshness  (Tier B, tracking)
  // ═══════════════════════════════════════════
  // Regel wie evidenceEngine.freshness: valid_until==null ⇒ zeitlos/ok;
  // abgelaufen wenn valid_until < heute. pct = ok / gesamt × 100.
  const evidenceList = Array.isArray(evidence) ? evidence : [];
  const evidenceOk = evidenceList.filter(e => e.valid_until == null || e.valid_until >= now).length;
  const evidencePct = evidenceList.length > 0 ? pct(evidenceOk, evidenceList.length) : 0;
  const evidenceHasData = evidenceList.length > 0;
  metrics.push({
    id: "evidence_freshness_pct",
    category: "operational",
    tier: "B",
    dashboardLayer: "tracking",
    labelDe: "Nachweis-Aktualität",
    labelEn: "Evidence Freshness",
    value: evidencePct,
    unit: "percent",
    target: 100,
    status: !evidenceHasData ? "no_data" : evidencePct >= 95 ? "healthy" : evidencePct >= 80 ? "warning" : "critical",
    trend: "stable",
    hasData: evidenceHasData,
    anchorDe: "Vendor default — konfigurierbar",
    anchorEn: "Vendor default — configurable",
    descriptionDe: "Anteil der Nachweise (Schritt 14), die noch nicht abgelaufen sind. Ein Nachweis ohne Gültigkeitsende (valid_until leer) gilt als zeitlos gültig; ansonsten abgelaufen, sobald das Gültigkeitsende vor dem heutigen Datum liegt.",
    descriptionEn: "Share of evidence records (Step 14) that have not yet expired. Evidence without an expiry (valid_until empty) counts as timeless; otherwise it is expired once the expiry date is before today.",
    formulaDe: "( Nachweise mit valid_until leer ODER valid_until ≥ heute ÷ Nachweise gesamt ) × 100",
    formulaEn: "( Evidence with valid_until empty OR valid_until ≥ today ÷ Total evidence ) × 100",
    exampleDe: evidenceHasData
      ? `${evidenceOk} von ${evidenceList.length} Nachweisen aktuell = ${evidencePct}%.`
      : "Noch keine Nachweise erfasst — KPI wartet auf Datengrundlage (Schritt 14).",
    exampleEn: evidenceHasData
      ? `${evidenceOk} of ${evidenceList.length} evidence records current = ${evidencePct}%.`
      : "No evidence records yet — KPI awaits data basis (Step 14).",
    interpretationDe: "≥95% = Nachweisbasis aktuell. 80–94% = einzelne Nachweise erneuern. <80% = breite Erneuerung nötig. Schwellen konfigurierbar.",
    interpretationEn: "≥95% = evidence base current. 80–94% = renew individual records. <80% = broad renewal needed. Thresholds configurable.",
    scenarioDe: "3 Nachweise, einer mit abgelaufenem Gültigkeitsende → 67%. Auditor prüft, ob Nachweise noch tragfähig sind.",
    scenarioEn: "3 evidence records, one past its expiry → 67%. Auditor checks whether evidence is still valid.",
    actionDe: "Schritt 14 öffnen, abgelaufene Nachweise identifizieren und aktualisieren.",
    actionEn: "Open Step 14, identify expired evidence and renew it.",
  });

  // ═══════════════════════════════════════════
  // #11 — Deadline Adherence  (Tier B, tracking)
  // ═══════════════════════════════════════════
  // Fristgerecht erledigte ÷ alle fälligen. done wenn status=='done';
  // fristgerecht wenn done_at <= due_at. Betrachtet nur Deadlines mit
  // due_at != null UND (status=='done' ODER due_at < heute).
  const deadlineList = Array.isArray(deadlines) ? deadlines : [];
  const relevantDeadlines = deadlineList.filter(d => d.due_at != null && (d.status === "done" || d.due_at < now));
  const onTimeDeadlines = relevantDeadlines.filter(d => d.status === "done" && d.done_at != null && d.done_at <= d.due_at).length;
  const deadlinePct = relevantDeadlines.length > 0 ? pct(onTimeDeadlines, relevantDeadlines.length) : 0;
  const deadlineHasData = relevantDeadlines.length > 0;
  metrics.push({
    id: "deadline_adherence_pct",
    category: "time",
    tier: "B",
    dashboardLayer: "tracking",
    labelDe: "Fristtreue",
    labelEn: "Deadline Adherence",
    value: deadlinePct,
    unit: "percent",
    target: 100,
    status: !deadlineHasData ? "no_data" : deadlinePct >= 95 ? "healthy" : deadlinePct >= 80 ? "warning" : "critical",
    trend: "stable",
    hasData: deadlineHasData,
    anchorDe: "Vendor default — konfigurierbar",
    anchorEn: "Vendor default — configurable",
    descriptionDe: "Anteil der fristgerecht erledigten Fristen (Schritt 15) an allen fälligen Fristen. Als fällig gelten Fristen mit gesetztem Termin, die entweder erledigt sind oder deren Termin vor heute liegt. Fristgerecht = Erledigung (done_at) am oder vor dem Fälligkeitstermin.",
    descriptionEn: "Share of deadlines (Step 15) completed on time out of all due deadlines. Due means deadlines with a set date that are either done or whose date is before today. On time = completion (done_at) on or before the due date.",
    formulaDe: "( Fristen mit Status 'done' UND done_at ≤ due_at ÷ Fällige Fristen ) × 100",
    formulaEn: "( Deadlines with status 'done' AND done_at ≤ due_at ÷ Due deadlines ) × 100",
    exampleDe: deadlineHasData
      ? `${onTimeDeadlines} von ${relevantDeadlines.length} fälligen Fristen fristgerecht erledigt = ${deadlinePct}%.`
      : "Noch keine fälligen Fristen — KPI wartet auf Datengrundlage (Schritt 15).",
    exampleEn: deadlineHasData
      ? `${onTimeDeadlines} of ${relevantDeadlines.length} due deadlines met on time = ${deadlinePct}%.`
      : "No due deadlines yet — KPI awaits data basis (Step 15).",
    interpretationDe: "≥95% = Fristen zuverlässig eingehalten. 80–94% = einzelne Verzüge. <80% = systematischer Fristverzug. Schwellen konfigurierbar.",
    interpretationEn: "≥95% = deadlines reliably met. 80–94% = isolated slips. <80% = systematic slippage. Thresholds configurable.",
    scenarioDe: "4 fällige Fristen: 3 rechtzeitig erledigt, 1 überfällig-offen → 75%.",
    scenarioEn: "4 due deadlines: 3 completed on time, 1 overdue-open → 75%.",
    actionDe: "Schritt 15 öffnen, überfällige und knapp erledigte Fristen prüfen, Termine realistisch planen.",
    actionEn: "Open Step 15, review overdue and narrowly met deadlines, plan realistic dates.",
  });

  // ═══════════════════════════════════════════
  // Apply user-defined target overrides (recompute status proportionally)
  // ═══════════════════════════════════════════
  if (targetOverrides) {
    for (const m of metrics) {
      const o = targetOverrides[m.id];
      if (typeof o === "number" && !isNaN(o) && o !== m.target) {
        m.target = o;
        m.status = recomputeStatusForTarget(m, o);
      }
    }
  }

  // ═══════════════════════════════════════════
  // Aggregations
  // ═══════════════════════════════════════════


  const byCategory: Record<KPICategory, KPIMetric[]> = {
    compliance: [], risk: [], operational: [], maturity: [], time: [],
  };
  const byLayer: Record<KPIDashboardLayer, KPIMetric[]> = { board: [], tracking: [] };
  for (const m of metrics) {
    byCategory[m.category].push(m);
    byLayer[m.dashboardLayer].push(m);
  }

  // Overall: weighted average of board-layer health, ignoring no_data
  const boardWithData = byLayer.board.filter(m => m.hasData);
  const overallScore = boardWithData.length === 0
    ? 0
    : Math.round(
        boardWithData.reduce((s, m) => s + (m.status === "healthy" ? 100 : m.status === "warning" ? 50 : 0), 0) /
          boardWithData.length
      );
  const overallStatus: KPIStatus =
    boardWithData.length === 0 ? "no_data" : overallScore >= 70 ? "healthy" : overallScore >= 40 ? "warning" : "critical";

  // Alerts (skip no_data — silence is honest, not green)
  const alerts: KPIAlert[] = [];
  for (const m of metrics) {
    if (m.status === "critical" || m.status === "warning") {
      const valStr = `${m.value}${m.unit === "percent" ? "%" : ""}`;
      alerts.push({
        id: `alert-${m.id}`,
        severity: m.status === "critical" ? "critical" : "warning",
        labelDe: `${m.labelDe}: ${m.status === "critical" ? "Kritischer Wert" : "Warnung"} (${valStr})`,
        labelEn: `${m.labelEn}: ${m.status === "critical" ? "Critical value" : "Warning"} (${valStr})`,
        metricId: m.id,
      });
    }
  }
  alerts.sort((a, b) => (a.severity === "critical" ? -1 : 1) - (b.severity === "critical" ? -1 : 1));

  // Unit-aware per-metric trend from last two snapshots.
  // "up" = improvement direction (semantically green), not raw value direction.
  // Higher-is-better (percent/score): up when value increased.
  // Lower-is-better (days): up when value decreased.
  if (snapshots.length >= 2) {
    const cur = snapshots[snapshots.length - 1];
    const prev = snapshots[snapshots.length - 2];
    for (const m of metrics) {
      if (!m.hasData) continue;
      const v1 = prev.metrics[m.id];
      const v2 = cur.metrics[m.id];
      if (typeof v1 !== "number" || typeof v2 !== "number") continue;
      const delta = v2 - v1;
      const threshold = m.unit === "percent" ? 2 : m.unit === "days" ? 7 : 0.2;
      if (Math.abs(delta) <= threshold) { m.trend = "stable"; continue; }
      // Richtung aus KPI_DIRECTIONS statt Unit-Heuristik: count-KPIs wie
      // open_high_risks/overdue_treatments/mttr_hours sind lower_better.
      const lowerIsBetter = KPI_DIRECTIONS[m.id] === "lower_better" || m.unit === "days";
      const improved = lowerIsBetter ? delta < 0 : delta > 0;
      m.trend = improved ? "up" : "down";
    }
  }

  const trends: KPITrend[] = metrics.map(m => ({
    metricId: m.id,
    snapshots: snapshots.map(s => ({ date: s.timestamp, value: s.metrics[m.id] ?? 0 })),
    velocity,
    projectedCompletion: projectedDate,
  }));

  return {
    metrics,
    overallScore,
    overallStatus,
    byCategory,
    byLayer,
    trends,
    alerts,
    velocityPerWeek: velocity,
    projectedCompletionDate: projectedDate,
  };
}

// ── Snapshot creation for trend tracking ──

export function createKPISnapshot(result: KPIResult): KPISnapshot {
  const metrics: Record<string, number> = {};
  const hasData: Record<string, boolean> = {};
  for (const m of result.metrics) {
    metrics[m.id] = m.value;
    hasData[m.id] = m.hasData;
  }
  return {
    timestamp: new Date().toISOString().slice(0, 10),
    metrics,
    hasData,
  };
}

// ── Category metadata ──

export const KPI_CATEGORIES: { id: KPICategory; labelDe: string; labelEn: string; icon: string; descriptionDe: string; descriptionEn: string }[] = [
  {
    id: "compliance",
    labelDe: "Compliance",
    labelEn: "Compliance",
    icon: "Shield",
    descriptionDe: "Regulatorische und SoA-basierte Kennzahlen: Meldepflichten (NIS2 Art. 23) und Umsetzungsgrad anwendbarer Kontrollen.",
    descriptionEn: "Regulatory and SoA-based metrics: reporting obligations (NIS2 Art. 23) and implementation rate of applicable controls.",
  },
  {
    id: "risk",
    labelDe: "Risiko",
    labelEn: "Risk",
    icon: "AlertTriangle",
    descriptionDe: "Risikomanagement-Status: offene Hoch-/Kritisch-Risiken und überfällige Behandlungen.",
    descriptionEn: "Risk management status: open high/critical risks and overdue treatments.",
  },
  {
    id: "operational",
    labelDe: "Operativ",
    labelEn: "Operational",
    icon: "Activity",
    descriptionDe: "Vorfall-Reaktion: MTTR (Behebungszeit) über die letzten 90 Tage.",
    descriptionEn: "Incident response: MTTR (resolution time) over the last 90 days.",
  },
  {
    id: "maturity",
    labelDe: "Reifegrad",
    labelEn: "Maturity",
    icon: "TrendingUp",
    descriptionDe: "Reifegrad-Abdeckung: Anteil der Domänen ≥ Level 3 und Hochrisiko-Abdeckung.",
    descriptionEn: "Maturity coverage: share of domains ≥ level 3 and high-risk control coverage.",
  },
  {
    id: "time",
    labelDe: "Zeit",
    labelEn: "Time",
    icon: "Clock",
    descriptionDe: "Geschwindigkeit und Prognose der Umsetzung.",
    descriptionEn: "Implementation velocity and projection.",
  },
];

// ── Tier metadata (used by dashboard chips) ──

export const KPI_TIERS: Record<KPITier, { labelDe: string; labelEn: string; descDe: string; descEn: string }> = {
  A: {
    labelDe: "A · Regulatorisch",
    labelEn: "A · Regulatory",
    descDe: "Pflichtwert aus NIS2 — nicht konfigurierbar.",
    descEn: "Mandatory value from NIS2 — not configurable.",
  },
  B: {
    labelDe: "B · ENISA",
    labelEn: "B · ENISA",
    descDe: "Aus ENISA-Leitfaden abgeleitet (z.B. TIG §2.1). Zielwert konfigurierbar.",
    descEn: "Derived from ENISA guidance (e.g. TIG §2.1). Target configurable.",
  },
  C: {
    labelDe: "C · Markt-Benchmark",
    labelEn: "C · Market benchmark",
    descDe: "Branchenüblicher Wert; Schwellen konfigurierbar (Governance-Entscheidung).",
    descEn: "Industry-typical value; thresholds configurable (governance decision).",
  },
  D: {
    labelDe: "D · Vendor default",
    labelEn: "D · Vendor default",
    descDe: "Standard-Voreinstellung — bitte mit dokumentierter Begründung anpassen.",
    descEn: "Standard preset — please adjust with documented rationale.",
  },
};

// ── KVP / Step-18 helper: alert evaluation from a stored snapshot ──
// The Dashboard (Step 16) computes full KPIMetric[] live; KVP only sees
// the lightweight snapshot ({ timestamp, metrics: { id: value } }).
// These maps let KVP reproduce the breach logic without re-running the
// full engine, so the "KPI threshold alerts" feed pulls real data.

export const KPI_DEFAULT_TARGETS: Record<string, number> = {
  meldefristen: 100,
  control_implementation: 100,
  open_high_risks: 0,
  overdue_treatments: 0,
  mttr_hours: 48,
  maturity_domains_at_target: 100,
  high_risk_coverage: 100,
  compliance_velocity: 3,
  projected_completion: 180,
  evidence_freshness_pct: 100,
  deadline_adherence_pct: 100,
};

export const KPI_DIRECTIONS: Record<string, "higher_better" | "lower_better"> = {
  meldefristen: "higher_better",
  control_implementation: "higher_better",
  open_high_risks: "lower_better",
  overdue_treatments: "lower_better",
  mttr_hours: "lower_better",
  maturity_domains_at_target: "higher_better",
  high_risk_coverage: "higher_better",
  compliance_velocity: "higher_better",
  projected_completion: "lower_better",
  evidence_freshness_pct: "higher_better",
  deadline_adherence_pct: "higher_better",
};

export const KPI_UNITS: Record<string, "percent" | "count" | "score" | "days"> = {
  meldefristen: "percent",
  control_implementation: "percent",
  open_high_risks: "count",
  overdue_treatments: "count",
  mttr_hours: "count",
  maturity_domains_at_target: "percent",
  high_risk_coverage: "percent",
  compliance_velocity: "score",
  projected_completion: "days",
  evidence_freshness_pct: "percent",
  deadline_adherence_pct: "percent",
};

export const KPI_LABELS: Record<string, { de: string; en: string }> = {
  meldefristen: { de: "Meldefristen-Einhaltung", en: "Reporting Deadlines Adherence" },
  control_implementation: { de: "Kontrollumsetzungsgrad", en: "Control Implementation" },
  open_high_risks: { de: "Offene Hoch-/Kritische Risiken", en: "Open High/Critical Risks" },
  overdue_treatments: { de: "Überfällige Behandlungen", en: "Overdue Treatments" },
  mttr_hours: { de: "MTTR (Std.)", en: "MTTR (h)" },
  maturity_domains_at_target: { de: "Reifegrad: Domänen ≥ 3.0", en: "Maturity: Domains ≥ 3.0" },
  high_risk_coverage: { de: "Hochrisiko-Abdeckung", en: "High-Risk Coverage" },
  compliance_velocity: { de: "Compliance-Geschwindigkeit", en: "Compliance Velocity" },
  projected_completion: { de: "Voraussichtlicher Abschluss", en: "Projected Completion" },
  evidence_freshness_pct: { de: "Nachweis-Aktualität", en: "Evidence Freshness" },
  deadline_adherence_pct: { de: "Fristtreue", en: "Deadline Adherence" },
};

export interface KpiAlertEntry {
  kpi_id: string;
  labelDe: string;
  labelEn: string;
  value: number;
  target: number;
  unit: "percent" | "count" | "score" | "days";
  direction: "higher_better" | "lower_better";
  severity: "critical" | "warning";
}

/**
 * Evaluate the latest KPI snapshot against targets and return only breaches.
 * Used by Step 18 (KVP) Feedback-Loop panel.
 *
 * Severity rules (mirrors the live engine bands):
 *   percent (higher_better): <80% of target → critical, else warning
 *   percent (lower_better):  ignored (no such KPI)
 *   count   (target = 0):    value > 5 → critical, 1–5 → warning
 *   count   (mttr_hours):    > 168h → critical, > 48h → warning
 *   days    (projected):     > 1.5× target → critical, > target → warning
 *   score   (velocity):      ≤ 0 → critical, < target → warning
 */
export function evaluateKpiAlerts(
  latestSnapshot: KPISnapshot | undefined,
  targetOverrides: Record<string, number> = {}
): KpiAlertEntry[] {
  if (!latestSnapshot?.metrics) return [];
  const out: KpiAlertEntry[] = [];
  for (const [id, value] of Object.entries(latestSnapshot.metrics)) {
    if (latestSnapshot.hasData?.[id] === false) continue;
    const dir = KPI_DIRECTIONS[id];
    const unit = KPI_UNITS[id];
    if (!dir || !unit) continue;
    const target = targetOverrides[id] ?? KPI_DEFAULT_TARGETS[id];
    if (target == null) continue;
    const breached = dir === "higher_better" ? value < target : value > target;
    if (!breached) continue;

    let severity: "critical" | "warning" = "warning";
    if (unit === "percent" && dir === "higher_better") {
      severity = value < target * 0.8 ? "critical" : "warning";
    } else if (unit === "count" && target === 0) {
      severity = value > 5 ? "critical" : "warning";
    } else if (id === "mttr_hours") {
      severity = value > 168 ? "critical" : "warning";
    } else if (unit === "days") {
      severity = value > target * 1.5 ? "critical" : "warning";
    } else if (unit === "score") {
      severity = value <= 0 ? "critical" : "warning";
    }

    out.push({
      kpi_id: id,
      labelDe: KPI_LABELS[id]?.de ?? id,
      labelEn: KPI_LABELS[id]?.en ?? id,
      value, target, unit, direction: dir, severity,
    });
  }
  return out;
}

/** Human-readable "value / target" formatting that respects unit. */
export function formatKpiValueTarget(value: number, target: number, unit: KpiAlertEntry["unit"], lang: "de" | "en" = "de"): string {
  const round = (n: number) => Math.round(n * 10) / 10;
  switch (unit) {
    case "percent": return `${Math.round(value)}% / ${Math.round(target)}%`;
    case "count":   return `${Math.round(value)} / ${Math.round(target)}`;
    case "days":    return lang === "de" ? `${Math.round(value)} Tage / ${Math.round(target)} Tage` : `${Math.round(value)}d / ${Math.round(target)}d`;
    case "score":   return `${round(value)} / ${round(target)}`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// E9 · kpiEngine v4 — dynamische/benchmarkbasierte Schwellen + kontinuierlicher
//       Overall + robuster Trend.  (Klasse B-KERN, rein ADDITIV.)
//
// Diese Funktionen sind OPT-IN für die UI. Sie verändern computeKPIs,
// evaluateKpiAlerts oder die statischen Bänder NICHT. Ohne Overrides und ohne
// benchmark_stats liefert resolveThresholds EXAKT die heutigen Konstanten
// (Identität), damit kein Regressionsrisiko entsteht.
//
// Referenz: ENGINE_ARCHITECTURE_MARKETGRADE.md §E9 (E9.1 Resolver, E9.2 Trend/
// Overall).
// ═══════════════════════════════════════════════════════════════════════════

export type KpiDirection = "higher_better" | "lower_better";
export type ThresholdSource = "override" | "benchmark" | "default";

/**
 * Schwellen-Tripel je KPI. `healthy`/`warning` entsprechen den heutigen Band-
 * Grenzen; `critical` ist der Score-Null-Anker für den kontinuierlichen Overall
 * (Richtung beachtet: higher_better ⇒ critical < healthy, lower_better ⇒
 * critical > healthy).
 */
export interface KpiThreshold {
  healthy: number;
  warning: number;
  critical: number;
  direction: KpiDirection;
}

/** Eine Zeile aus benchmark_stats (global, Job-befüllt). Perzentile je KPI. */
export interface BenchmarkRow {
  kpi_id: string;
  /** Kohortengröße; Peer-Schwellen erst ab k-Anonymität n ≥ 8. */
  n: number;
  p25: number;
  p50: number;
  p75: number;
}

/** Bestehende Target-Overrides: id → Zielwert (unverändert zum Live-Format). */
export type TargetOverrides = Record<string, number>;

/**
 * Heutige statische Schwellen, 1:1 aus den Band-Berechnungen in computeKPIs
 * extrahiert (healthy/warning = heutige Konstanten). `critical` ergänzt den
 * Score-Null-Anker für den kontinuierlichen Overall.
 *
 * WICHTIG: Diese Konstanten dürfen sich nicht von den Live-Bändern lösen —
 * die Fixture prüft die Identität.
 */
export const STATIC_KPI_THRESHOLDS: Record<string, KpiThreshold> = {
  meldefristen:               { healthy: 100, warning: 80,  critical: 0,   direction: "higher_better" },
  control_implementation:     { healthy: 95,  warning: 80,  critical: 0,   direction: "higher_better" },
  open_high_risks:            { healthy: 2,   warning: 5,   critical: 10,  direction: "lower_better" },
  overdue_treatments:         { healthy: 0,   warning: 2,   critical: 5,   direction: "lower_better" },
  mttr_hours:                 { healthy: 48,  warning: 168, critical: 336, direction: "lower_better" },
  maturity_domains_at_target: { healthy: 95,  warning: 80,  critical: 0,   direction: "higher_better" },
  high_risk_coverage:         { healthy: 95,  warning: 80,  critical: 0,   direction: "higher_better" },
  compliance_velocity:        { healthy: 3,   warning: 0,   critical: -3,  direction: "higher_better" },
  projected_completion:       { healthy: 180, warning: 365, critical: 730, direction: "lower_better" },
  evidence_freshness_pct:     { healthy: 95,  warning: 80,  critical: 0,   direction: "higher_better" },
  deadline_adherence_pct:     { healthy: 95,  warning: 80,  critical: 0,   direction: "higher_better" },
};

/**
 * E9.1 — Schwellen-Resolver (Prioritätskette je KPI).
 *
 *   threshold(kpi) = tenant_override                       (#1, bleibt Vorrang)
 *                 ?? benchmark_derived (nur n ≥ 8):        (#2, k-Anonymität)
 *                      higher_better: healthy=p75, warning=p50
 *                      lower_better:  healthy=p25, warning=p50
 *                 ?? static_default                        (#3, heutige Werte)
 *
 * OHNE Override UND OHNE (gültige) Benchmark ⇒ `defaults` unverändert
 * (Identität), source='default'.
 */
export function resolveThresholds(
  kpiId: string,
  overrides: TargetOverrides | null,
  bench: BenchmarkRow | null,
  defaults: KpiThreshold,
): KpiThreshold & { source: ThresholdSource } {
  const dir = defaults.direction;

  // #1 — Tenant-Override (bestehendes Single-Number-Target). Setzt `healthy`;
  //      `warning` wird proportional abgeleitet wie recomputeStatusForTarget,
  //      damit das Verhalten zur Live-Engine passt.
  const ov = overrides ? overrides[kpiId] : undefined;
  if (typeof ov === "number" && Number.isFinite(ov)) {
    const healthy = ov;
    const warning = dir === "higher_better" ? ov * 0.8 : ov * 2 + 1;
    return { healthy, warning, critical: defaults.critical, direction: dir, source: "override" };
  }

  // #2 — Benchmark-derived (nur mit k-Anonymität n ≥ 8; sonst wird die Zeile
  //      ignoriert und die Kette fällt auf den statischen Default).
  if (bench && bench.n >= 8) {
    if (dir === "higher_better") {
      return { healthy: bench.p75, warning: bench.p50, critical: defaults.critical, direction: dir, source: "benchmark" };
    }
    return { healthy: bench.p25, warning: bench.p50, critical: defaults.critical, direction: dir, source: "benchmark" };
  }

  // #3 — Statischer Default (Identität).
  return { ...defaults, source: "default" };
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/**
 * E9.2 — Trend aus der gesamten Snapshot-Reihe (statt nur Delta der letzten
 * zwei Punkte). EWMA-Glättung (α=0.3) + Kleinste-Quadrate-Slope ± Standard-
 * fehler. Der Trend-Status wechselt nur, wenn |slope| > 2·stderr — verhindert
 * „Flapping" bei Rauschen.
 *
 * `direction` bezeichnet die ROH-Wertrichtung ('up' = Werte steigen), nicht die
 * Verbesserungsrichtung. Weniger als 2 Punkte ⇒ 'flat'/nicht konfident.
 */
export function trendFromSeries(
  points: { at: string; value: number }[],
): { direction: "up" | "down" | "flat"; slope: number; stderr: number; confident: boolean } {
  const series = (points ?? [])
    .filter((p) => p && typeof p.value === "number" && Number.isFinite(p.value))
    .slice()
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const n = series.length;
  if (n < 2) return { direction: "flat", slope: 0, stderr: 0, confident: false };

  // EWMA-Glättung (α = 0.3).
  const alpha = 0.3;
  const smoothed: number[] = new Array(n);
  smoothed[0] = series[0].value;
  for (let i = 1; i < n; i++) {
    smoothed[i] = alpha * series[i].value + (1 - alpha) * smoothed[i - 1];
  }

  // Kleinste-Quadrate-Slope über (index, smoothed).
  const xs = smoothed.map((_, i) => i);
  const xMean = xs.reduce((s, v) => s + v, 0) / n;
  const yMean = smoothed.reduce((s, v) => s + v, 0) / n;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - xMean) ** 2;
    sxy += (xs[i] - xMean) * (smoothed[i] - yMean);
  }
  if (sxx === 0) return { direction: "flat", slope: 0, stderr: 0, confident: false };
  const slope = sxy / sxx;
  const intercept = yMean - slope * xMean;

  // Standardfehler der Slope: sqrt( (SSR/(n-2)) / Sxx ). n<3 ⇒ stderr=0.
  let ssr = 0;
  for (let i = 0; i < n; i++) {
    const pred = intercept + slope * xs[i];
    ssr += (smoothed[i] - pred) ** 2;
  }
  const stderr = n > 2 ? Math.sqrt(ssr / (n - 2) / sxx) : 0;

  // Konfident nur, wenn die Steigung das Rauschen klar übersteigt (kein Flapping).
  const confident = Math.abs(slope) > 2 * stderr && slope !== 0;
  const direction: "up" | "down" | "flat" = !confident ? "flat" : slope > 0 ? "up" : "down";
  return { direction, slope, stderr, confident };
}

/** Eingabe für den kontinuierlichen Overall-Score (opt-in). */
export interface ContinuousKpiInput {
  value: number;
  threshold: KpiThreshold;
  /** Gewicht (Default 1). */
  weight?: number;
  /** Bei explizit `false` wird der KPI ausgelassen (no_data ≠ 0-Score). */
  hasData?: boolean;
}

/**
 * E9.2 — Kontinuierlicher Overall (statt 100/50/0), sodass z.B. 94 % und 81 %
 * nicht mehr denselben „50" ergeben.
 *
 *   score_kpi = clamp01( (value − critical) / (healthy − critical) )   (Richtung
 *               steckt in den Schwellen: higher_better ⇒ healthy>critical,
 *               lower_better ⇒ healthy<critical — dieselbe Formel gilt für beide)
 *   Overall   = 100 · Σ w·score / Σ w
 */
export function overallScoreContinuous(kpis: ContinuousKpiInput[]): number {
  let wSum = 0;
  let acc = 0;
  for (const k of kpis ?? []) {
    if (!k || k.hasData === false || !k.threshold) continue;
    const { healthy, critical } = k.threshold;
    if (healthy === critical) continue; // degeneriert — nicht bewertbar
    const score = clamp01((k.value - critical) / (healthy - critical));
    const w = typeof k.weight === "number" && Number.isFinite(k.weight) ? k.weight : 1;
    acc += w * score;
    wSum += w;
  }
  return wSum === 0 ? 0 : (100 * acc) / wSum;
}

