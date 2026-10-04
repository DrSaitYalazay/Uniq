/**
 * Risk Engine — Gap-Driven Dynamic Risk Generation
 *
 * Automatically generates risks from gap analysis results.
 * No manual risk creation — every risk traces to a gap.
 *
 * Pipeline: Gaps + Assets + Dependencies → Risk Objects → Scored & Classified
 */

import type { ConsolidatedGap, Finding, AssetInfo, Severity } from "@/lib/gapEngine";
import type { ControlEff, RiskControlLink } from "@/lib/controlEffectivenessEngine";

// ── Types ──

export type RiskLevel = "critical" | "high" | "medium" | "low";

export interface MatrixDimensions {
  rows: number; // impact axis (Y)
  cols: number; // likelihood axis (X)
}

export interface RiskMatrixConfig {
  likelihoodScale: { value: number; labelDe: string; labelEn: string }[];
  impactScale: { value: number; labelDe: string; labelEn: string }[];
  thresholds: { low_max: number; medium_max: number; high_max: number };
  formula: "multiply" | "sum" | "max";
  dimensions?: MatrixDimensions;
  /**
   * ITEM 16 — optional, config-gated acceptance gate. Additive: when neither
   * field is set the gate is inactive and behavior is identical to today.
   */
  acceptance_gate?: boolean;
  acceptance_max_level?: RiskLevel;
}

export interface RiskFindingDetail {
  control_id: string;
  control_title: string;
  control_title_en: string;
  control_description: string;
  control_description_en: string;
  finding_type: "missing" | "weak";
  risk_text: string;
  risk_text_en: string;
  measure_text: string;
  measure_text_en: string;
}

import type { CatalogRisk } from "@/data/controlCatalog";
// Themenfarbe der Risikomatrix: dieselbe Quelle wie alle anderen Diagramme.
// FEHLTE — dadurch stürzte /decision beim Laden des Moduls ab
// („ReferenceError: resolveChartHex is not defined", 12.09.2026). esbuild
// meldet so etwas nicht; siehe scripts/check-undefined-imports.mjs.
import { resolveChartHex } from "@/lib/chartPalette";
import { getStoredAccent } from "@/lib/accentTheme";

export interface RiskScenario {
  control_id: string;
  control_title: string;
  control_title_en: string;
  finding_type: "missing" | "weak";
  text_de: string;
  text_en: string;
}

export interface RiskObject {
  risk_id: string;
  related_gap_id: string;
  scope: "asset" | "organization";
  asset_id: string | null;
  asset_name: string | null;
  service_id: string | null;
  service_name: string | null;
  capability_tag: string;
  description: string;
  description_en: string;
  /**
   * Konkrete Risikoszenarien aus dem Katalog (je betroffener Kontrolle):
   * „Was passiert, wenn diese Kontrolle fehlt?" — sortiert: fehlend vor
   * teilweise, kritische Kontrollen zuerst. Quelle: Tabelle `risks`.
   */
  scenarios: RiskScenario[];
  likelihood: number;
  likelihood_reasons: string[];
  impact: number;
  impact_reasons: string[];
  risk_score: number;
  risk_level: RiskLevel;
  /** ITEM 16 — inherent (pre-treatment) risk score. Alias of risk_score at generation. */
  inherent_score?: number;
  /** ITEM 16 — residual risk after applying completed mitigations (set by applyResidualRisk). */
  residual_score?: number;
  residual_level?: RiskLevel;
  /** E2 — kontinuierliches Residual-L/I (multiplicative model, nicht gerundet). */
  residual_likelihood?: number;
  residual_impact?: number;
  /** E2 — Herleitung des Residuals je zugeordneter Kontrolle (Report-tauglich). */
  residual_factors?: ResidualFactor[];
  gap_severity: Severity;
  gap_title: string;
  gap_title_en: string;
  finding_count: number;
  missing_count: number;
  weak_count: number;
  supporting_findings: RiskFindingDetail[];
  gap_why_it_matters: string;
  gap_why_it_matters_en: string;
  gap_recommendation: string;
  gap_recommendation_en: string;
  /** Pre-built typical risks resolved via BSI GS++ ZOK hierarchy (asset) or ISMS bucket (org-wide) */
  catalog_risks: CatalogRisk[];
  /** Source ZOK paths used to resolve catalog_risks; empty when from_isms */
  zok_source_paths_de: string[];
  zok_source_paths_en: string[];
  /** True when catalog_risks come from the verbundweite ISMS bucket */
  catalog_from_isms: boolean;
  /** US4.6 — Herkunft: Engine (Gap-abgeleitet) oder manuell erfasst (manualRisks.ts). Fehlt = engine. */
  risk_source?: "engine" | "manual";
  /** P4.M.3 — L/I wurden vom Nutzer manuell überschrieben (applyOverride). */
  risk_overridden?: boolean;
  /** P4.M.3 — Pflicht-Begründung der manuellen L/I-Anpassung. */
  override_reason?: string;
  /** P4.M.3 — Wer/wann die Anpassung vorgenommen hat (Anzeige). */
  override_by?: string;
  override_at?: string;
}

export interface RiskAnalysisResult {
  risks: RiskObject[];
  summary: RiskSummary;
  config: RiskMatrixConfig;
}

export interface RiskSummary {
  totalRisks: number;
  bySeverity: Record<RiskLevel, number>;
  byScope: { organization: number; asset: number };
  averageScore: number;
  maxScore: number;
}

// ── Default scales by dimension ──

const LIKELIHOOD_LABELS: Record<number, { de: string; en: string }[]> = {
  3: [
    { de: "Unwahrscheinlich", en: "Unlikely" },
    { de: "Möglich", en: "Possible" },
    { de: "Wahrscheinlich", en: "Likely" },
  ],
  4: [
    { de: "Unwahrscheinlich", en: "Unlikely" },
    { de: "Möglich", en: "Possible" },
    { de: "Wahrscheinlich", en: "Likely" },
    { de: "Sehr wahrscheinlich", en: "Very Likely" },
  ],
  5: [
    { de: "Sehr unwahrscheinlich", en: "Very Unlikely" },
    { de: "Unwahrscheinlich", en: "Unlikely" },
    { de: "Möglich", en: "Possible" },
    { de: "Wahrscheinlich", en: "Likely" },
    { de: "Sehr wahrscheinlich", en: "Very Likely" },
  ],
};

const IMPACT_LABELS: Record<number, { de: string; en: string }[]> = {
  3: [
    { de: "Gering", en: "Minor" },
    { de: "Moderat", en: "Moderate" },
    { de: "Erheblich", en: "Major" },
  ],
  4: [
    { de: "Gering", en: "Minor" },
    { de: "Moderat", en: "Moderate" },
    { de: "Erheblich", en: "Major" },
    { de: "Katastrophal", en: "Catastrophic" },
  ],
  5: [
    { de: "Vernachlässigbar", en: "Negligible" },
    { de: "Gering", en: "Minor" },
    { de: "Moderat", en: "Moderate" },
    { de: "Erheblich", en: "Major" },
    { de: "Katastrophal", en: "Catastrophic" },
  ],
};

export function buildScaleForSize(size: number, type: "likelihood" | "impact"): { value: number; labelDe: string; labelEn: string }[] {
  const labels = type === "likelihood" ? LIKELIHOOD_LABELS : IMPACT_LABELS;
  const found = labels[size];
  if (found) return found.map((l, i) => ({ value: i + 1, labelDe: l.de, labelEn: l.en }));
  // Fallback for arbitrary sizes
  return Array.from({ length: size }, (_, i) => ({
    value: i + 1,
    labelDe: `Stufe ${i + 1}`,
    labelEn: `Level ${i + 1}`,
  }));
}

// ── Default thresholds per formula/dimensions ──

export function getDefaultThresholds(formula: "multiply" | "sum" | "max", cols: number, rows: number): { low_max: number; medium_max: number; high_max: number } {
  const maxScore = formula === "multiply" ? cols * rows : formula === "sum" ? cols + rows : Math.max(cols, rows);
  if (formula === "multiply") {
    return {
      low_max: Math.max(1, Math.round(maxScore * 0.24)),
      medium_max: Math.max(2, Math.round(maxScore * 0.48)),
      high_max: Math.max(3, Math.round(maxScore * 0.76)),
    };
  }
  if (formula === "sum") {
    return {
      low_max: Math.max(2, Math.round(maxScore * 0.4)),
      medium_max: Math.max(3, Math.round(maxScore * 0.65)),
      high_max: Math.max(4, Math.round(maxScore * 0.85)),
    };
  }
  // max
  return {
    low_max: Math.max(1, Math.round(maxScore * 0.3)),
    medium_max: Math.max(2, Math.round(maxScore * 0.55)),
    high_max: Math.max(3, Math.round(maxScore * 0.8)),
  };
}

export function getMaxScore(formula: "multiply" | "sum" | "max", cols: number, rows: number): number {
  return formula === "multiply" ? cols * rows : formula === "sum" ? cols + rows : Math.max(cols, rows);
}

// ── Default Configuration ──

export const DEFAULT_RISK_CONFIG: RiskMatrixConfig = {
  likelihoodScale: buildScaleForSize(5, "likelihood"),
  impactScale: buildScaleForSize(5, "impact"),
  thresholds: { low_max: 6, medium_max: 12, high_max: 19 },
  formula: "multiply",
  dimensions: { rows: 5, cols: 5 },
};

// ── Color Palettes ──

export interface ColorPalette {
  id: string;
  labelDe: string;
  labelEn: string;
  low: string;
  medium: string;
  high: string;
  critical: string;
}

/**
 * Risikomatrix-Paletten.
 *
 * Dr. Sait 2026-09-12 („tüm grafikler temaya uysun"): Die ERSTE Palette ist
 * jetzt die THEMENFARBE — sie wird zur Laufzeit aus derselben Quelle wie alle
 * anderen Diagramme berechnet (`resolveChartHex`), folgt also dem Akzent und
 * dem Diagramm-Modus (Ampel ↔ Themenfarbe) und ist im Bericht identisch zum
 * Bildschirm. Die festen Schemata bleiben als Auswahl erhalten; vorher war
 * „ISO Standard" der Default und die Matrix war die einzige Grafik, die den
 * Themenwechsel ignorierte.
 */
export function themeMatrixPalette(): ColorPalette {
  const ch = resolveChartHex(getStoredAccent());
  return {
    id: "theme",
    labelDe: "Themenfarbe (Standard)",
    labelEn: "Theme colour (default)",
    low: ch.niedrig, medium: ch.mittel, high: ch.hoch, critical: ch.kritisch,
  };
}

/**
 * Feste Paletten (reine Daten, keine Auswertung beim Laden des Moduls).
 *
 * Vorher stand hier `themeMatrixPalette()` direkt in einem `const`-Array:
 * beim Import wurde also Code ausgeführt, der Akzentfarbe und Diagramm-Modus
 * liest. Zwei Folgen — erstens riss ein Fehler darin das GANZE Modul mit (und
 * damit die Risikoanalyse), zweitens war die Themenfarbe ab dem ersten Import
 * eingefroren und folgte einem späteren Themenwechsel nicht mehr.
 */
const FIXED_PALETTES: ColorPalette[] = [
  { id: "iso", labelDe: "ISO Standard", labelEn: "ISO Standard", low: "#22c55e", medium: "#eab308", high: "#f97316", critical: "#dc2626" },
  { id: "vivid", labelDe: "Kräftig", labelEn: "Vivid", low: "#10b981", medium: "#f59e0b", high: "#ef4444", critical: "#991b1b" },
  { id: "pastel", labelDe: "Pastell", labelEn: "Pastel", low: "#86efac", medium: "#fde68a", high: "#A7DFC3", critical: "#fca5a5" },
  { id: "corporate", labelDe: "Unternehmen", labelEn: "Corporate", low: "#6ee7b7", medium: "#93c5fd", high: "#c084fc", critical: "#f87171" },
  { id: "contrast", labelDe: "Hoher Kontrast", labelEn: "High Contrast", low: "#15803d", medium: "#ca8a04", high: "#ea580c", critical: "#b91c1c" },
];

/**
 * Alle wählbaren Paletten — Themenfarbe zuerst, JEDES MAL frisch berechnet.
 * Immer diese Funktion aufrufen, nie ein Ergebnis zwischenspeichern, sonst
 * zeigt die Matrix nach einem Themenwechsel wieder die alte Farbe.
 */
export function colorPalettes(): ColorPalette[] {
  return [themeMatrixPalette(), ...FIXED_PALETTES];
}

// ── Likelihood Calculation ──

function calculateLikelihood(
  gap: ConsolidatedGap,
  findings: Finding[],
  maxVal: number,
): { score: number; reasons: string[] } {
  let score = 1;
  const reasons: string[] = [];

  const importanceMap: Record<string, number> = { critical: 2, high: 1.5, medium: 1, low: 0.5 };
  const maxImportance = findings.reduce((max, f) => {
    return Math.max(max, importanceMap[f.control_importance] ?? 1);
  }, 0);
  score += maxImportance;
  if (maxImportance >= 1.5) reasons.push("high-importance controls");

  const missingCount = findings.filter(f => f.finding_type === "missing").length;
  const weakCount = findings.filter(f => f.finding_type === "weak").length;
  if (missingCount > 0) {
    score += 1.5;
    reasons.push(`${missingCount} missing control(s)`);
  } else if (weakCount > 0) {
    score += 0.5;
    reasons.push(`${weakCount} partially implemented`);
  }

  if (findings.length >= 4) {
    score += 0.5;
    reasons.push("multiple findings in capability");
  }

  // B-12: Gap-Schwere (inkl. E5 Asset-Kontext: SPOF/kritischer Dienst) fließt in
  // die Eintrittswahrscheinlichkeit ein, damit Gap-Schwere und Risikostufe nicht
  // systematisch auseinanderlaufen (kritisch +1, hoch +0.5).
  const sevBoost: Record<string, number> = { critical: 1, high: 0.5, medium: 0, low: 0 };
  const sb = sevBoost[gap.severity] ?? 0;
  if (sb > 0) {
    score += sb;
    reasons.push(`gap severity ${gap.severity}`);
  }

  // Scale to maxVal (if not 5)
  const scaled = maxVal === 5 ? score : Math.round((score / 5) * maxVal);
  return { score: Math.max(1, Math.min(Math.round(scaled), maxVal)), reasons };
}

// ── Impact Calculation ──

function calculateImpact(
  gap: ConsolidatedGap,
  asset: AssetInfo | undefined,
  dependencies: { source_asset_id: string; target_asset_id: string }[],
  maxVal: number,
): { score: number; reasons: string[] } {
  let score = 2;
  const reasons: string[] = [];

  if (gap.scope === "organization") {
    score = 3;
    reasons.push("organization-wide scope");
    if (gap.gap_category === "governance") {
      score += 1;
      reasons.push("governance gap");
    }
  }

  if (asset) {
    const critMap: Record<string, number> = { Critical: 2.5, High: 2, Medium: 1, Low: 0 };
    const critBoost = critMap[asset.criticality_classification ?? ""] ?? 0;
    if (critBoost > 0) {
      score += critBoost;
      reasons.push(`${asset.criticality_classification} criticality asset`);
    }

    const depCount = typeof asset.dependency_count === "number"
      ? asset.dependency_count
      : dependencies.filter(
        d => d.source_asset_id === asset.id || d.target_asset_id === asset.id
      ).length;
    if (depCount >= 5) {
      score += 1;
      reasons.push("highly connected (≥5 deps)");
    } else if (depCount >= 2) {
      score += 0.5;
      reasons.push(`${depCount} dependencies`);
    }

    if (asset.is_single_point_of_failure) {
      score += 1;
      reasons.push("single point of failure");
    }
    if (asset.supports_critical_service) {
      score += 0.5;
      reasons.push("supports critical service");
    }
  }

  const scaled = maxVal === 5 ? score : Math.round((score / 5) * maxVal);
  return { score: Math.max(1, Math.min(Math.round(scaled), maxVal)), reasons };
}

// ── Risk Score & Level ──

function calculateRiskScore(likelihood: number, impact: number, config: RiskMatrixConfig): number {
  switch (config.formula) {
    case "sum": return likelihood + impact;
    case "max": return Math.max(likelihood, impact);
    case "multiply":
    default: return likelihood * impact;
  }
}

function classifyRisk(score: number, config: RiskMatrixConfig): RiskLevel {
  if (score <= config.thresholds.low_max) return "low";
  if (score <= config.thresholds.medium_max) return "medium";
  if (score <= config.thresholds.high_max) return "high";
  return "critical";
}

/**
 * scoreAndLevel — öffentliche, matrix-konfigurationsgleiche Berechnung von
 * Score + Stufe für beliebige (L, I). Genutzt von manuellen Risiken,
 * L/I-Overrides und dem Restrisiko (Behandlung), damit überall dieselbe
 * Formel/Schwellen wie in der Analyse gelten. L/I werden auf die Matrix-
 * Dimensionen geklemmt.
 */
export function scoreAndLevel(
  likelihood: number,
  impact: number,
  config: RiskMatrixConfig = DEFAULT_RISK_CONFIG,
): { likelihood: number; impact: number; score: number; level: RiskLevel } {
  const dims = config.dimensions ?? { rows: 5, cols: 5 };
  const l = Math.max(1, Math.min(dims.cols, Math.round(likelihood)));
  const i = Math.max(1, Math.min(dims.rows, Math.round(impact)));
  const score = calculateRiskScore(l, i, config);
  return { likelihood: l, impact: i, score, level: classifyRisk(score, config) };
}

// ── P4.A.3 · L/I-Gründe lokalisieren ──
// Die Engine sammelt reasons als kompakte EN-Schlüsselsätze (siehe
// calculateLikelihood / calculateImpact). Für die UI („Warum kritisch") werden
// sie hier deterministisch in lesbare DE/EN-Sätze übersetzt. Unbekannte
// Strings werden unverändert zurückgegeben (keine Information geht verloren).
const REASON_PATTERNS: { rx: RegExp; de: (m: RegExpMatchArray) => string; en: (m: RegExpMatchArray) => string }[] = [
  { rx: /^high-importance controls$/i,
    de: () => "betroffene Kontrollen mit hoher Wichtigkeit (MUSS/kritisch)",
    en: () => "affected controls of high importance (must/critical)" },
  { rx: /^(\d+) missing control\(s\)$/i,
    de: m => `${m[1]} fehlende Kontrolle(n)`,
    en: m => `${m[1]} missing control(s)` },
  { rx: /^(\d+) partially implemented$/i,
    de: m => `${m[1]} nur teilweise umgesetzte Kontrolle(n)`,
    en: m => `${m[1]} only partially implemented control(s)` },
  { rx: /^multiple findings in capability$/i,
    de: () => "mehrere Befunde (≥ 4) im selben Fähigkeitsbereich",
    en: () => "multiple findings (≥ 4) in the same capability" },
  { rx: /^gap severity (\w+)$/i,
    de: m => `Gap-Schwere „${({ critical: "kritisch", high: "hoch", medium: "mittel", low: "niedrig" } as Record<string, string>)[m[1].toLowerCase()] ?? m[1]}"`,
    en: m => `gap severity "${m[1].toLowerCase()}"` },
  { rx: /^organization-wide scope$/i,
    de: () => "organisationsweite Geltung",
    en: () => "organization-wide scope" },
  { rx: /^governance gap$/i,
    de: () => "Governance-Lücke (Steuerung/Verantwortung)",
    en: () => "governance gap (steering/accountability)" },
  { rx: /^(\w+) criticality asset$/i,
    de: m => `Asset-Kritikalität „${({ critical: "kritisch", high: "hoch", medium: "mittel", low: "niedrig" } as Record<string, string>)[m[1].toLowerCase()] ?? m[1]}"`,
    en: m => `asset criticality "${m[1].toLowerCase()}"` },
  { rx: /^highly connected/i,
    de: () => "stark vernetztes Asset (≥ 5 Abhängigkeiten)",
    en: () => "highly connected asset (≥ 5 dependencies)" },
  { rx: /^(\d+) dependencies$/i,
    de: m => `${m[1]} Abhängigkeiten`,
    en: m => `${m[1]} dependencies` },
  { rx: /^single point of failure$/i,
    de: () => "Single Point of Failure",
    en: () => "single point of failure" },
  { rx: /^supports critical service$/i,
    de: () => "trägt einen kritischen Dienst",
    en: () => "supports a critical service" },
  { rx: /^Manuell angepasst$/i,
    de: () => "manuell angepasst",
    en: () => "manually adjusted" },
  { rx: /^Manuell aus Katalog \((.+)\)$/i,
    de: m => `manuell aus Katalog übernommen (${m[1]})`,
    en: m => `manually taken from catalog (${m[1]})` },
  { rx: /^Manuell erfasst$/i,
    de: () => "manuell erfasst (Einschätzung des Erfassers)",
    en: () => "manually captured (assessor's estimate)" },
];

export function localizeReason(reason: string, lang: "de" | "en"): string {
  const r = (reason ?? "").trim();
  for (const p of REASON_PATTERNS) {
    const m = r.match(p.rx);
    if (m) return lang === "de" ? p.de(m) : p.en(m);
  }
  return r;
}

/**
 * explainLikelihoodImpact — liefert je Dimension die lesbaren Gründe. Fehlen
 * Engine-Gründe (z. B. Basiswert ohne Zuschläge), wird aus vorhandenen
 * Faktoren ein neutraler Hinweis abgeleitet, damit die Zeile nie leer ist.
 */
export function explainLikelihoodImpact(risk: RiskObject, lang: "de" | "en"): { likelihood: string; impact: string } {
  const de = lang === "de";
  const lr = (risk.likelihood_reasons ?? []).map(x => localizeReason(x, lang)).filter(Boolean);
  const ir = (risk.impact_reasons ?? []).map(x => localizeReason(x, lang)).filter(Boolean);
  if (lr.length === 0) {
    lr.push(de
      ? "Basiswert — keine fehlenden oder schwachen Kontrollen mit erhöhtem Gewicht"
      : "baseline — no missing or weak controls with elevated weight");
  }
  if (ir.length === 0) {
    ir.push(risk.scope === "organization"
      ? (de ? "Basiswert organisationsweit" : "baseline, organization-wide")
      : (de ? `Basiswert für Asset „${risk.asset_name ?? "—"}" ohne Kritikalitäts-Zuschlag` : `baseline for asset "${risk.asset_name ?? "—"}" without criticality boost`));
  }
  return { likelihood: lr.join(", "), impact: ir.join(", ") };
}

// ── Risk Description Generator ──

function generateRiskDescription(gap: ConsolidatedGap, lang: "de" | "en", scenarios: RiskScenario[] = []): string {
  // Bevorzugt den konkreten Katalogtext der wichtigsten betroffenen Kontrolle —
  // das ist das eigentliche Risiko. Zusammenfassung der Lücke nur als Fallback.
  const top = scenarios[0];
  if (top) return lang === "de" ? top.text_de : top.text_en;
  if (lang === "de") {
    return `Risiko aus Lücke in ${gap.capability_label}: ${gap.description}`;
  }
  return `Risk from gap in ${gap.capability_label_en}: ${gap.description_en}`;
}

/** Szenarien aus den Findings ableiten (dedupliziert nach Text, priorisiert). */
function buildScenarios(gapFindings: Finding[]): RiskScenario[] {
  const rank = (f: Finding) =>
    (f.finding_type === "missing" ? 0 : 10) + (f.control_importance === "critical" ? 0 : 1);
  const seenText = new Set<string>();
  const out: RiskScenario[] = [];
  for (const f of [...gapFindings].sort((a, b) => rank(a) - rank(b))) {
    const de = (f.risk_text ?? "").trim();
    if (!de || seenText.has(de)) continue;
    seenText.add(de);
    out.push({
      control_id: f.control_id,
      control_title: f.control_title,
      control_title_en: f.control_title_en,
      finding_type: f.finding_type,
      text_de: de,
      text_en: (f.risk_text_en ?? "").trim() || de,
    });
  }
  return out;
}

// ── Main Entry Point ──

export interface RiskEngineInput {
  gaps: ConsolidatedGap[];
  findings: Finding[];
  assets: AssetInfo[];
  dependencies: { source_asset_id: string; target_asset_id: string }[];
  config?: RiskMatrixConfig;
}

export function generateRisks(input: RiskEngineInput): RiskAnalysisResult {
  const config = input.config ?? DEFAULT_RISK_CONFIG;
  const dims = config.dimensions ?? { rows: 5, cols: 5 };
  const assetMap = new Map(input.assets.map(a => [a.id, a]));
  const findingMap = new Map(input.findings.map(f => [f.finding_id, f]));
  const seen = new Set<string>();
  const risks: RiskObject[] = [];

  for (const gap of input.gaps) {
    if (seen.has(gap.gap_id)) continue;
    seen.add(gap.gap_id);

    const gapFindings = gap.supporting_finding_ids
      .map(id => findingMap.get(id))
      .filter((f): f is Finding => Boolean(f));

    const asset = gap.asset_id ? assetMap.get(gap.asset_id) : undefined;

    const lResult = calculateLikelihood(gap, gapFindings, dims.cols);
    const iResult = calculateImpact(gap, asset, input.dependencies, dims.rows);

    const likelihood = Math.max(1, lResult.score);
    const impact = Math.max(1, iResult.score);
    const riskScore = calculateRiskScore(likelihood, impact, config);
    const riskLevel = classifyRisk(riskScore, config);

    const missingCount = gapFindings.filter(f => f.finding_type === "missing").length;
    const weakCount = gapFindings.filter(f => f.finding_type === "weak").length;
    const scenarios = buildScenarios(gapFindings);

    const supportingFindings: RiskFindingDetail[] = gapFindings.map(f => ({
      control_id: f.control_id,
      control_title: f.control_title,
      control_title_en: f.control_title_en,
      control_description: f.control_description,
      control_description_en: f.control_description_en,
      finding_type: f.finding_type,
      risk_text: f.risk_text,
      risk_text_en: f.risk_text_en,
      measure_text: f.measure_text,
      measure_text_en: f.measure_text_en,
    }));

    risks.push({
      risk_id: `risk-${gap.gap_id}`,
      related_gap_id: gap.gap_id,
      scope: gap.scope === "organization" ? "organization" : "asset",
      asset_id: gap.asset_id,
      asset_name: gap.asset_name,
      service_id: gap.linked_service_id,
      service_name: gap.linked_service_name,
      capability_tag: gap.capability_tag,
      description: generateRiskDescription(gap, "de", scenarios),
      description_en: generateRiskDescription(gap, "en", scenarios),
      scenarios,
      likelihood,
      likelihood_reasons: lResult.reasons,
      impact,
      impact_reasons: iResult.reasons,
      risk_score: riskScore,
      risk_level: riskLevel,
      inherent_score: riskScore,
      gap_severity: gap.severity,
      gap_title: gap.title,
      gap_title_en: gap.title_en,
      finding_count: gapFindings.length,
      missing_count: missingCount,
      weak_count: weakCount,
      supporting_findings: supportingFindings,
      gap_why_it_matters: gap.why_it_matters,
      gap_why_it_matters_en: gap.why_it_matters_en,
      gap_recommendation: gap.recommendation,
      gap_recommendation_en: gap.recommendation_en,
      catalog_risks: [],
      zok_source_paths_de: [],
      zok_source_paths_en: [],
      catalog_from_isms: gap.scope === "organization",
    });
  }

  risks.sort((a, b) => b.risk_score - a.risk_score);

  const summary: RiskSummary = {
    totalRisks: risks.length,
    bySeverity: {
      critical: risks.filter(r => r.risk_level === "critical").length,
      high: risks.filter(r => r.risk_level === "high").length,
      medium: risks.filter(r => r.risk_level === "medium").length,
      low: risks.filter(r => r.risk_level === "low").length,
    },
    byScope: {
      organization: risks.filter(r => r.scope === "organization").length,
      asset: risks.filter(r => r.scope === "asset").length,
    },
    averageScore: risks.length > 0 ? Math.round(risks.reduce((s, r) => s + r.risk_score, 0) / risks.length * 10) / 10 : 0,
    maxScore: risks.length > 0 ? Math.max(...risks.map(r => r.risk_score)) : 0,
  };

  return { risks, summary, config };
}

// ── ITEM 16: Residual risk + config-gated acceptance gate (additive, pure) ──

const RISK_LEVEL_ORDER: Record<RiskLevel, number> = {
  low: 1, medium: 2, high: 3, critical: 4,
};

/**
 * Structural, framework-independent view of a treatment. Kept local (instead of
 * importing TreatmentObject) to avoid a circular dependency with treatmentEngine.
 * TreatmentObject is structurally assignable to this shape.
 */
export interface ResidualTreatmentInput {
  risk_id: string;
  strategy: string;
  status: string;
  selected_control_ids?: string[];
}

/**
 * applyResidualRisk — pure, deterministic. For each risk, completed ("done")
 * mitigate-treatments assigned to that risk (via treatment.risk_id) lower the
 * likelihood by one step (never below 1); residual score/level are recomputed
 * with the existing formula helpers. Risks without a matching done mitigation
 * keep residual === inherent. Returns a new array; inputs are not mutated.
 */
export function applyResidualRisk(
  risks: RiskObject[],
  treatments: ResidualTreatmentInput[],
  cfg: RiskMatrixConfig = DEFAULT_RISK_CONFIG,
): RiskObject[] {
  const mitigatedRiskIds = new Set<string>();
  for (const t of treatments ?? []) {
    if (t && t.strategy === "mitigate" && t.status === "done") {
      mitigatedRiskIds.add(t.risk_id);
    }
  }

  return risks.map(r => {
    const inherentScore = typeof r.inherent_score === "number" ? r.inherent_score : r.risk_score;
    if (!mitigatedRiskIds.has(r.risk_id)) {
      // No completed mitigation → residual equals inherent.
      return {
        ...r,
        inherent_score: inherentScore,
        residual_score: inherentScore,
        residual_level: r.risk_level,
      };
    }
    const reducedLikelihood = Math.max(1, r.likelihood - 1);
    const residualScore = calculateRiskScore(reducedLikelihood, r.impact, cfg);
    const residualLevel = classifyRisk(residualScore, cfg);
    return {
      ...r,
      inherent_score: inherentScore,
      residual_score: residualScore,
      residual_level: residualLevel,
    };
  });
}

// ── E2: Residual-Risk multiplikativ + Control-Effectiveness ──

/**
 * Herleitung des Residuals je zugeordneter Kontrolle (Report-tauglich).
 */
export interface ResidualFactor {
  control_key: string;
  /** roher eff_c aus computeControlEffectiveness. */
  eff: number;
  /** wirksamer eff nach Dämpfung (Capability-Match 0.8). */
  applied_eff: number;
  dimension: "likelihood" | "impact" | "both";
  damping: number;
  confidence: string;
}

function clampScale(v: number, max: number): number {
  if (max <= 1) return Math.max(1, v);
  return Math.max(1, Math.min(v, max));
}

/**
 * applyResidualRiskV2 — E2.2, pure & deterministisch. Multiplikatives
 * Residualrisiko getrennt nach Wirkrichtung (likelihood / impact):
 *
 *   F_L = Π_{c ∈ C_L} (1 − eff_c)          F_I = Π_{c ∈ C_I} (1 − eff_c)
 *   residual_L = 1 + (inherent_L − 1) · F_L     (kontinuierlich, nicht gerundet)
 *   residual_I = 1 + (inherent_I − 1) · F_I
 *   residual_score = calculateRiskScore(residual_L, residual_I, cfg)
 *   residual_level = classifyRisk(residual_score, cfg)
 *
 * `both`-Kontrollen wirken in beiden Dimensionen mit eff_c/2 (keine
 * Doppelwirkung). Capability-Match-Links werden per `damping` (0.8) abgesenkt.
 *
 * Modell-Wahl über `cfg.residual_model`:
 *   - 'multiplicative' → v2 (diese Formel)
 *   - 'legacy' | undefined → delegiert an das bestehende `applyResidualRisk`
 *     (deep-equal identisch), damit der Default unverändert bleibt.
 *
 * `treatments` ist nur für den Legacy-Pfad nötig; im v2-Pfad ignoriert.
 * Inputs werden nicht mutiert; es wird ein neues Array zurückgegeben.
 */
export function applyResidualRiskV2(
  risks: RiskObject[],
  links: RiskControlLink[],
  effByControl: Map<string, ControlEff>,
  cfg: RiskMatrixConfig & { residual_model?: string } = DEFAULT_RISK_CONFIG,
  treatments?: ResidualTreatmentInput[],
): RiskObject[] {
  // Default / 'legacy' → bestehendes Verhalten, unverändert.
  if (cfg.residual_model !== "multiplicative") {
    return applyResidualRisk(risks, treatments ?? [], cfg);
  }

  const dims = cfg.dimensions ?? { rows: 5, cols: 5 };

  // Links je Risiko gruppieren.
  const linksByRisk = new Map<string, RiskControlLink[]>();
  for (const link of links ?? []) {
    if (!link) continue;
    const arr = linksByRisk.get(link.risk_id);
    if (arr) arr.push(link);
    else linksByRisk.set(link.risk_id, [link]);
  }

  return risks.map(r => {
    const inherentScore = typeof r.inherent_score === "number" ? r.inherent_score : r.risk_score;
    const inherentL = r.likelihood;
    const inherentI = r.impact;

    const riskLinks = linksByRisk.get(r.risk_id) ?? [];

    let fL = 1;
    let fI = 1;
    const residualFactors: ResidualFactor[] = [];

    // De-dupliziere je control_key (stärkster Beitrag gewinnt).
    const seenKeys = new Set<string>();
    for (const link of riskLinks) {
      if (seenKeys.has(link.control_key)) continue;
      seenKeys.add(link.control_key);

      const ce = effByControl.get(link.control_key);
      if (!ce) continue;
      const damping = typeof link.damping === "number" ? link.damping : 1.0;
      const appliedEff = Math.max(0, Math.min(1, ce.eff * damping));
      const dimension = link.dimension ?? "likelihood";

      if (dimension === "likelihood") {
        fL *= (1 - appliedEff);
      } else if (dimension === "impact") {
        fI *= (1 - appliedEff);
      } else {
        // both — halbe Wirkung je Dimension, keine Doppelwirkung.
        const half = appliedEff / 2;
        fL *= (1 - half);
        fI *= (1 - half);
      }

      residualFactors.push({
        control_key: link.control_key,
        eff: ce.eff,
        applied_eff: appliedEff,
        dimension,
        damping,
        confidence: ce.confidence,
      });
    }

    const residualL = clampScale(1 + (inherentL - 1) * fL, dims.cols);
    const residualI = clampScale(1 + (inherentI - 1) * fI, dims.rows);
    const residualScore = calculateRiskScore(residualL, residualI, cfg);
    const residualLevel = classifyRisk(residualScore, cfg);

    return {
      ...r,
      inherent_score: inherentScore,
      residual_likelihood: residualL,
      residual_impact: residualI,
      residual_score: residualScore,
      residual_level: residualLevel,
      residual_factors: residualFactors,
    };
  });
}

/**
 * validateAcceptance — config-gated. Inactive by default: unless the config
 * enables the gate (acceptance_gate or acceptance_max_level), this always
 * returns { ok: true } (today's behavior). When active and the treatment
 * strategy is "accept" for a risk at/above the threshold level, a justification
 * and an owner are mandatory.
 */
export function validateAcceptance(
  risk: Pick<RiskObject, "risk_level">,
  treatment: { strategy: string; justification?: string; owner?: string },
  cfg?: { acceptance_gate?: boolean; acceptance_max_level?: RiskLevel },
): { ok: boolean; reason?: string } {
  const gateActive = Boolean(cfg && (cfg.acceptance_gate || cfg.acceptance_max_level));
  if (!gateActive) return { ok: true };
  if (treatment.strategy !== "accept") return { ok: true };

  // Threshold: explicit level if provided, otherwise "high" when only the flag is set.
  const threshold: RiskLevel = cfg?.acceptance_max_level ?? "high";
  if (RISK_LEVEL_ORDER[risk.risk_level] < RISK_LEVEL_ORDER[threshold]) return { ok: true };

  const hasJustification = Boolean(treatment.justification && treatment.justification.trim());
  const hasOwner = Boolean(treatment.owner && treatment.owner.trim());
  if (hasJustification && hasOwner) return { ok: true };

  const missing: string[] = [];
  if (!hasJustification) missing.push("justification");
  if (!hasOwner) missing.push("owner");
  return {
    ok: false,
    reason: `Acceptance of a ${risk.risk_level} risk requires ${missing.join(" and ")}.`,
  };
}

// ── Display helpers ──

export function riskLevelColor(level: RiskLevel): string {
  switch (level) {
    case "critical": return "bg-red-100 text-red-800 border-red-300";
    case "high": return "bg-orange-100 text-orange-800 border-orange-300";
    case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "low": return "bg-green-100 text-green-800 border-green-300";
  }
}

export function riskLevelLabel(level: RiskLevel, lang: "de" | "en"): string {
  const labels: Record<RiskLevel, { de: string; en: string }> = {
    critical: { de: "Kritisch", en: "Critical" },
    high: { de: "Hoch", en: "High" },
    medium: { de: "Mittel", en: "Medium" },
    low: { de: "Niedrig", en: "Low" },
  };
  return labels[level][lang];
}

export function riskLevelBgClass(level: RiskLevel): string {
  switch (level) {
    case "critical": return "bg-red-500";
    case "high": return "bg-orange-500";
    case "medium": return "bg-yellow-500";
    case "low": return "bg-green-500";
  }
}
