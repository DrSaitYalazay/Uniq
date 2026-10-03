// Criticality scoring engine

export interface CriticalityInputs {
  operational_impact: number;    // 1-4
  affected_users: number;        // 1-5
  data_sensitivity: number;      // 1-5
  dependency_importance: number;  // 1-4
  legal_exposure: number;        // 1-4
  third_party_exposure: number;  // 1-4
  availability_requirement: number; // 1-4
}

export interface FormulaWeights {
  operational_impact: number;
  affected_users: number;
  data_sensitivity: number;
  dependency_importance: number;
  legal_exposure: number;
  third_party_exposure: number;
  availability_requirement: number;
}

export interface FormulaThresholds {
  low_max: number;
  medium_max: number;
  high_max: number;
}

export interface ScoreBreakdownItem {
  factor: string;
  rawScore: number;
  maxScore: number;
  weight: number;
  normalizedScore: number;
  weightedScore: number;
}

export interface CriticalityResult {
  score: number;
  classification: "Low" | "Medium" | "High" | "Critical";
  breakdown: ScoreBreakdownItem[];
  explanation: string;
}

export const DEFAULT_WEIGHTS: FormulaWeights = {
  operational_impact: 0.30,
  affected_users: 0.15,
  data_sensitivity: 0.15,
  dependency_importance: 0.15,
  legal_exposure: 0.10,
  third_party_exposure: 0.05,
  availability_requirement: 0.10,
};

export const DEFAULT_THRESHOLDS: FormulaThresholds = {
  low_max: 1.99,
  medium_max: 2.99,
  high_max: 3.49,
};

const FACTOR_MAX_SCORES: Record<keyof CriticalityInputs, number> = {
  operational_impact: 4,
  affected_users: 5,
  data_sensitivity: 5,
  dependency_importance: 4,
  legal_exposure: 4,
  third_party_exposure: 4,
  availability_requirement: 4,
};

const FACTOR_LABELS: Record<keyof CriticalityInputs, { de: string; en: string }> = {
  operational_impact: { de: "Betriebliche Auswirkung", en: "Operational Impact" },
  affected_users: { de: "Betroffene Nutzer", en: "Affected Users" },
  data_sensitivity: { de: "Datensensibilität", en: "Data Sensitivity" },
  dependency_importance: { de: "Abhängigkeitsbedeutung", en: "Dependency Importance" },
  legal_exposure: { de: "Regulatorische Exposition", en: "Legal/Regulatory Exposure" },
  third_party_exposure: { de: "Drittanbieter-Exposition", en: "Third-Party Exposure" },
  availability_requirement: { de: "Verfügbarkeitsanforderung", en: "Availability Requirement" },
};

export function getFactorLabel(factor: keyof CriticalityInputs, lang: "de" | "en"): string {
  return FACTOR_LABELS[factor][lang];
}

export function calculateCriticality(
  inputs: CriticalityInputs,
  weights: FormulaWeights = DEFAULT_WEIGHTS,
  thresholds: FormulaThresholds = DEFAULT_THRESHOLDS,
  lang: "de" | "en" = "en"
): CriticalityResult {
  const factors = Object.keys(weights) as (keyof CriticalityInputs)[];

  const breakdown: ScoreBreakdownItem[] = factors.map(factor => {
    const rawScoreRaw = inputs[factor];
    // Unvollständige/ungültige Eingabe (NaN/undefined) darf NICHT über alle
    // <=-Vergleiche zu „Critical" führen — fehlender Faktor zählt als 0.
    const rawScore = Number.isFinite(rawScoreRaw) ? rawScoreRaw : 0;
    const maxScore = FACTOR_MAX_SCORES[factor];
    // Normalize to 0-4 scale for consistent scoring
    const normalizedScore = maxScore > 0 ? (rawScore / maxScore) * 4 : 0;
    const weight = weights[factor];
    const weightedScore = normalizedScore * weight;
    
    return {
      factor: getFactorLabel(factor, lang),
      rawScore,
      maxScore,
      weight,
      normalizedScore: Math.round(normalizedScore * 100) / 100,
      weightedScore: Math.round(weightedScore * 100) / 100,
    };
  });

  // B-25: aus den ROHEN (ungerundeten) gewichteten Scores summieren, erst dann
  // runden — sonst driftet die Summe (bis ±0.035) und kippt Grenzfälle an den
  // Schwellen 1.99/2.99/3.49.
  const score = Math.round(factors.reduce((sum, f) => {
    const rs = Number.isFinite(inputs[f]) ? inputs[f] : 0;
    const mx = FACTOR_MAX_SCORES[f];
    const ns = mx > 0 ? (rs / mx) * 4 : 0;
    return sum + ns * weights[f];
  }, 0) * 100) / 100;
  
  let classification: CriticalityResult["classification"];
  if (score <= thresholds.low_max) classification = "Low";
  else if (score <= thresholds.medium_max) classification = "Medium";
  else if (score <= thresholds.high_max) classification = "High";
  else classification = "Critical";

  // Build explanation from top contributing factors
  const sorted = [...breakdown].sort((a, b) => b.weightedScore - a.weightedScore);
  const topFactors = sorted.slice(0, 3).map(b => b.factor.toLowerCase());
  
  const explanation = lang === "de"
    ? `Berechnet als ${classification} hauptsächlich aufgrund von ${topFactors.join(", ")}.`
    : `Calculated as ${classification} mainly due to ${topFactors.join(", ")}.`;

  return { score, classification, breakdown, explanation };
}

export function classificationColor(c: string): string {
  switch (c) {
    case "Critical": return "text-red-600 bg-red-50 border-red-200";
    case "High": return "text-orange-600 bg-orange-50 border-orange-200";
    case "Medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "Low": return "text-green-600 bg-green-50 border-green-200";
    default: return "text-muted-foreground bg-muted";
  }
}

export function classificationBadgeColor(c: string): string {
  switch (c) {
    case "Critical": return "bg-red-100 text-red-800 border-red-300";
    case "High": return "bg-orange-100 text-orange-800 border-orange-300";
    case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "Low": return "bg-green-100 text-green-800 border-green-300";
    default: return "bg-muted text-muted-foreground";
  }
}
