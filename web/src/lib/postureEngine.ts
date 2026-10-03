/**
 * postureEngine — E8 · Posture-/Trust-Score + Peer-Benchmark (marktreif).
 *
 * Liefert die eine verkaufbare Zahl (0–100) plus den ehrlichen Peer-Vergleich.
 * Konsumiert vorberechnete Komponenten aus E2 (Residualrisiko), E3 (Control-
 * Health / Evidence-Freshness) und E6 (Maturity) sowie Deadline-Adherence —
 * die Aggregation selbst ist bewusst rein und I/O-frei.
 *
 * Leistungsumfang (siehe ENGINE_ARCHITECTURE_MARKETGRADE.md, Abschnitt E8):
 *   E8.1  computePosture — gewichtete Aggregation von 5 Komponenten ∈ [0,1]:
 *         C1 FrameworkReadiness (E3), C2 EvidenceFreshness (E3-TTL),
 *         C3 MaturityNorm (E6, overall/5), C4 DeadlineAdherence (rollierend 12 M),
 *         C5 RiskPosture (E2: 1 − Σresidual/Σinherent).
 *         no_data ⇒ Komponente entfällt + Gewichte renormalisieren + coverage sinkt.
 *         Gewichte w = [0.30, 0.15, 0.15, 0.15, 0.25].
 *         Posture = 100 · Σ w·C / Σ w − P.
 *         P (gedeckelt 25) = 5·min(3, critical Gaps) + 3·min(3, failing Tests)
 *                          + 1·min(4, überfällige Fristen).
 *         Ausweis IMMER mit coverage (Anteil belegter Gewichte) + confidence
 *         (min der Komponenten-Konfidenzen).
 *   E8.2  peerPercentile — stückweise lineare Interpolation gegen benchmark_stats
 *         (p25/p50/p75). Cold-Start-Doktrin: stats null ODER n < 8 ⇒ null
 *         (NIEMALS erfundene Peer-Werte — no_data-Prinzip).
 *
 * Vertrag: pure, deterministisch, KEIN I/O. Klasse A-SICHER (rein additiv).
 */

// ── Typen ──

export type PostureConfidence = "high" | "medium" | "low";

/** Stabile Komponenten-Schlüssel (C1…C5). */
export type PostureComponentKey = "C1" | "C2" | "C3" | "C4" | "C5";

/**
 * Ein Komponenten-Eingang. `value` ∈ [0,1] oder `null` (⇒ no_data, Komponente
 * entfällt). `confidence` fließt in die Gesamt-Konfidenz (min) ein.
 */
export interface PostureComponentInput {
  /** Normierter Score ∈ [0,1] oder null (no_data). */
  value: number | null;
  /** Konfidenz dieser Komponente (Default: "high"). */
  confidence?: PostureConfidence;
}

/**
 * Eingaben für computePosture. Die 5 Komponenten sind vorberechnet (E2/E3/E6 +
 * Deadline-Adherence) übergeben; die Penalty-Zähler kommen aus GapEngine (E5),
 * dem CCM-Test-Runner (E3) und der DeadlineEngine.
 */
export interface PostureInputs {
  /** C1 FrameworkReadiness = Σ w_c·health_c / Σ w_c (E3, aktivierte Frameworks). */
  frameworkReadiness: PostureComponentInput;
  /** C2 EvidenceFreshness = fresh / Pflicht-Evidence (E3-TTL). */
  evidenceFreshness: PostureComponentInput;
  /** C3 MaturityNorm = OverallMaturity / 5 (E6). */
  maturityNorm: PostureComponentInput;
  /** C4 DeadlineAdherence = fristgerecht erledigte / fällige (rollierend 12 M). */
  deadlineAdherence: PostureComponentInput;
  /** C5 RiskPosture = 1 − Σ residual / Σ inherent (E2). */
  riskPosture: PostureComponentInput;
  /** Offene critical Gaps (Penalty: 5·min(3, …)). */
  criticalGaps?: number;
  /** Failing CCM-Tests (Penalty: 3·min(3, …)). */
  failingTests?: number;
  /** Überfällige compliance_deadlines (Penalty: 1·min(4, …)). */
  overdueDeadlines?: number;
}

/** Ein Komponenten-Ausweis im Ergebnis (Report-tauglich). */
export interface PostureComponent {
  key: PostureComponentKey;
  /** Sprechendes Label. */
  label: string;
  /** Roher Score ∈ [0,1] oder null (no_data). */
  value: number | null;
  /** Original-Gewicht (vor Renormalisierung). */
  weight: number;
  /** Renormalisiertes Gewicht (0 falls no_data). */
  effectiveWeight: number;
  /** Ob die Komponente belegt (in die Aggregation eingeflossen) ist. */
  included: boolean;
  /** Konfidenz (null falls no_data). */
  confidence: PostureConfidence | null;
}

/** Ein Penalty-Posten im Ergebnis. */
export interface PosturePenalty {
  key: "critical_gaps" | "failing_tests" | "overdue_deadlines";
  label: string;
  /** Roher Zähler (vor Deckelung). */
  count: number;
  /** Für die Deckelung wirksamer Zähler (min(cap, count)). */
  cappedCount: number;
  /** Abzug in Punkten (vor Gesamt-Deckelung 25). */
  points: number;
}

export interface PostureResult {
  /** Posture-Score 0–100 (auf 2 Nachkommastellen gerundet). */
  score: number;
  /** Anteil der durch belegte Komponenten abgedeckten Gewichte ∈ [0,1]. */
  coverage: number;
  /** min der Komponenten-Konfidenzen ("low" falls keine Komponente belegt). */
  confidence: PostureConfidence;
  components: PostureComponent[];
  penalties: PosturePenalty[];
}

/**
 * Eine Kohorten-Zeile aus benchmark_stats (GLOBAL, k-anonym: nur n ≥ 8 wird vom
 * Aggregations-Job geschrieben). p25/p50/p75 können fehlen (null).
 */
export interface BenchmarkRow {
  p25: number | null;
  p50: number | null;
  p75: number | null;
  n: number;
}

// ── Konstanten ──

/** Gewichte der 5 Komponenten (Summe = 1). */
const WEIGHTS: Record<PostureComponentKey, number> = {
  C1: 0.3,
  C2: 0.15,
  C3: 0.15,
  C4: 0.15,
  C5: 0.25,
};

const LABELS: Record<PostureComponentKey, string> = {
  C1: "Framework-Reife",
  C2: "Nachweis-Aktualität",
  C3: "Reifegrad",
  C4: "Fristen-Treue",
  C5: "Risiko-Posture",
};

/** Gesamt-Deckel der Abzüge. */
const PENALTY_CAP = 25;

/** k-Anonymitäts-Schwelle für ehrliche Peer-Perzentile. */
const MIN_COHORT_N = 8;

const CONFIDENCE_RANK: Record<PostureConfidence, number> = {
  low: 0,
  medium: 1,
  high: 2,
};
const RANK_CONFIDENCE: PostureConfidence[] = ["low", "medium", "high"];

// ── Helfer ──

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/** value ∈ [0,1] & endlich ⇒ belegt; sonst no_data. */
function isValidComponent(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

// ── E8.1 · Posture-Score ──

/**
 * computePosture — pure & deterministisch. Gewichtete Aggregation der 5
 * Komponenten mit Renormalisierung bei no_data, minus gedeckelter Penalty.
 * Weist coverage (belegte Gewichte) und confidence (min der Konfidenzen) aus.
 */
export function computePosture(inp: PostureInputs): PostureResult {
  const order: {
    key: PostureComponentKey;
    input: PostureComponentInput;
  }[] = [
    { key: "C1", input: inp.frameworkReadiness },
    { key: "C2", input: inp.evidenceFreshness },
    { key: "C3", input: inp.maturityNorm },
    { key: "C4", input: inp.deadlineAdherence },
    { key: "C5", input: inp.riskPosture },
  ];

  // Belegte Komponenten identifizieren; Gewichte der belegten summieren.
  let includedWeight = 0;
  let weightedSum = 0;
  let minConfRank = Infinity;

  const staged = order.map(({ key, input }) => {
    const weight = WEIGHTS[key];
    const raw = input?.value;
    const included = isValidComponent(raw);
    if (included) {
      const clamped = clamp(raw, 0, 1);
      includedWeight += weight;
      weightedSum += weight * clamped;
      const conf: PostureConfidence = input?.confidence ?? "high";
      minConfRank = Math.min(minConfRank, CONFIDENCE_RANK[conf]);
      return { key, weight, value: clamped, included, confidence: conf };
    }
    return {
      key,
      weight,
      value: null as number | null,
      included,
      confidence: null as PostureConfidence | null,
    };
  });

  // Basis-Score aus renormalisierten Gewichten (0 falls nichts belegt).
  const base = includedWeight > 0 ? (100 * weightedSum) / includedWeight : 0;

  // ── Penalty P (gedeckelt 25) ──
  const critical = Math.max(0, Math.trunc(inp.criticalGaps ?? 0));
  const failing = Math.max(0, Math.trunc(inp.failingTests ?? 0));
  const overdue = Math.max(0, Math.trunc(inp.overdueDeadlines ?? 0));

  const pCritical = 5 * Math.min(3, critical);
  const pFailing = 3 * Math.min(3, failing);
  const pOverdue = 1 * Math.min(4, overdue);

  const penalties: PosturePenalty[] = [
    {
      key: "critical_gaps",
      label: "Offene kritische Lücken",
      count: critical,
      cappedCount: Math.min(3, critical),
      points: pCritical,
    },
    {
      key: "failing_tests",
      label: "Fehlgeschlagene Tests",
      count: failing,
      cappedCount: Math.min(3, failing),
      points: pFailing,
    },
    {
      key: "overdue_deadlines",
      label: "Überfällige Fristen",
      count: overdue,
      cappedCount: Math.min(4, overdue),
      points: pOverdue,
    },
  ];

  const penaltyTotal = Math.min(PENALTY_CAP, pCritical + pFailing + pOverdue);

  const score = round2(clamp(base - penaltyTotal, 0, 100));

  // coverage = belegte Gewichte / Summe aller Gewichte (= 1).
  const totalWeight = WEIGHTS.C1 + WEIGHTS.C2 + WEIGHTS.C3 + WEIGHTS.C4 + WEIGHTS.C5;
  const coverage = round2(includedWeight / totalWeight);

  const confidence: PostureConfidence =
    minConfRank === Infinity ? "low" : RANK_CONFIDENCE[minConfRank];

  const components: PostureComponent[] = staged.map(s => ({
    key: s.key,
    label: LABELS[s.key],
    value: s.value,
    weight: s.weight,
    effectiveWeight:
      s.included && includedWeight > 0 ? round2(s.weight / includedWeight) : 0,
    included: s.included,
    confidence: s.confidence,
  }));

  return { score, coverage, confidence, components, penalties };
}

// ── E8.2 · Peer-Benchmark ──

/**
 * peerPercentile — stückweise lineare Interpolation eines Wertes gegen die
 * Kohorten-Quartile p25/p50/p75. Segmente:
 *   value < p25            : 0…25   (linear ab p25 − IQR)
 *   p25 ≤ value < p50      : 25…50
 *   p50 ≤ value < p75      : 50…75
 *   value ≥ p75            : 75…100 (linear bis p75 + IQR)
 * mit IQR = p75 − p25. Ergebnis clamped auf [0,100].
 *
 * Cold-Start-Doktrin (ehrlich): stats null ODER n < 8 ⇒ null. Auch bei
 * fehlenden/degenerierten Quartilen ⇒ null — NIEMALS erfundene Peer-Werte.
 */
export function peerPercentile(value: number, stats: BenchmarkRow | null): number | null {
  if (!stats) return null;
  if (!Number.isFinite(value)) return null;
  if (!Number.isFinite(stats.n) || stats.n < MIN_COHORT_N) return null;

  const { p25, p50, p75 } = stats;
  if (
    p25 == null ||
    p50 == null ||
    p75 == null ||
    !Number.isFinite(p25) ||
    !Number.isFinite(p50) ||
    !Number.isFinite(p75)
  ) {
    return null;
  }
  // Quartile müssen monoton sein, sonst ist die Interpolation nicht definiert.
  if (!(p25 <= p50 && p50 <= p75)) return null;

  const iqr = p75 - p25;

  // Degenerierter Fall (alle gleich): Wert exakt auf dem Median ⇒ 50,
  // sonst nur Über/Unter-Aussage möglich.
  if (iqr <= 0) {
    if (value < p50) return 0;
    if (value > p50) return 100;
    return 50;
  }

  let pct: number;
  if (value < p25) {
    // 0 bei p25 − IQR … 25 bei p25.
    pct = 25 * ((value - (p25 - iqr)) / iqr);
  } else if (value < p50) {
    pct = 25 + 25 * ((value - p25) / (p50 - p25));
  } else if (value < p75) {
    pct = 50 + 25 * ((value - p50) / (p75 - p50));
  } else {
    // 75 bei p75 … 100 bei p75 + IQR.
    pct = 75 + 25 * ((value - p75) / iqr);
  }

  return round2(clamp(pct, 0, 100));
}
