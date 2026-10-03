/**
 * FAIR-Engine (voll) — E1 · `fairEngine.ts`
 *
 * Marktreife quantitative Risiko-Engine (RiskLens/SAFE-Klasse). Aufbauend auf dem
 * seedbaren PERT/Beta-Sampling aus `riskQuantEngine.ts` (FAIR-light). Diese Datei ist
 * rein additiv (Klasse A-SICHER): riskQuantEngine bleibt der Schnellpfad, der
 * light-Modus hier delegiert 1:1 an `simulateAnnualLoss` (Identitätsbeweis).
 *
 * Leistungsumfang (siehe ENGINE_ARCHITECTURE_MARKETGRADE.md, Abschnitt E1):
 *  - Rechenbaum TEF×Vuln, 6 Verlustformen primär/sekundär, BetaPERT mit Konfidenz-λ
 *  - Loss-Exceedance-Kurve (LEC, komplementäre CDF, log-spaced, binäre Suche)
 *  - Portfolio-Aggregation mit Korrelation via Iman-Conover-Rang-Reordering
 *  - Risk-Appetite-Kurve (log-linear interpoliert) mit Breach-Segmenten
 *
 * Vertrag: pure, seedbar, deterministisch, KEIN I/O (Laden/Speichern macht der Hook).
 */

import {
  mulberry32,
  samplePert,
  simulateAnnualLoss,
  type FairInput,
} from "./riskQuantEngine";

// Re-Export der Basisbausteine (Fixtures/Consumer nutzen dieselben Sampler)
export {
  mulberry32,
  samplePert,
  sampleGamma,
  sampleBeta,
  simulateAnnualLoss,
} from "./riskQuantEngine";
export type { FairInput, FairResult } from "./riskQuantEngine";

// ── Typen ──

export type Confidence = "low" | "medium" | "high";

/** 3-Punkt-Schätzung (min/likely/max) mit optionaler Konfidenz (→ BetaPERT-λ). */
export interface Pert3 {
  min: number;
  likely: number;
  max: number;
  conf?: Confidence;
}

export type LossForm =
  | "productivity"
  | "response"
  | "replacement"
  | "fines"
  | "competitive"
  | "reputation";

const LOSS_FORMS: LossForm[] = [
  "productivity",
  "response",
  "replacement",
  "fines",
  "competitive",
  "reputation",
];

/** Voll zerlegtes FAIR-Szenario (E1.2). `tef` ODER `cf`+`poa`; `vuln` ODER `tcap`+`rs`. */
export interface FairFullInput {
  tef?: Pert3;
  cf?: Pert3;
  poa?: Pert3;
  vuln?: Pert3;
  tcap?: Pert3;
  rs?: Pert3;
  primary: Partial<Record<LossForm, Pert3>>;
  slef?: Pert3;
  secondary?: Partial<Record<LossForm, Pert3>>;
}

export interface FairStats {
  min: number;
  mean: number;
  p10: number;
  p50: number;
  p90: number;
  max: number;
}

export interface LecPoint {
  /** Verlustschwelle (EUR) */
  x: number;
  /** P(jährlicher Verlust > x) — komplementäre CDF */
  p: number;
}

export interface ScenarioResult {
  samples: Float64Array;
  stats: FairStats;
  lec: LecPoint[];
}

export interface AppetitePoint {
  loss_eur: number;
  max_annual_prob: number;
}

export interface AppetiteBreach {
  from: number;
  to: number;
  lec_p: number;
  appetite_p: number;
}

export interface PortfolioGroup {
  id: string;
  exposure: number;
  share: number;
}

export interface PortfolioResult {
  stats: FairStats;
  lec: LecPoint[];
  groups: PortfolioGroup[];
}

// ── interne Helfer ──

/** BetaPERT-Formfaktor λ aus der Konfidenz. medium=4 = heutiges samplePert-Verhalten. */
function lambdaFor(conf?: Confidence): number {
  if (conf === "low") return 2;
  if (conf === "high") return 8;
  return 4; // medium / Default
}

function drawPert(rng: () => number, p: Pert3): number {
  return samplePert(rng, p.min, p.likely, p.max, lambdaFor(p.conf));
}

/** Standardnormal via Box-Muller (verbraucht 2 Uniforms). */
function sampleNormal(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Perzentil über ein AUFSTEIGEND sortiertes Array (lineare Interpolation). */
function percentileSorted(sorted: ArrayLike<number>, q: number): number {
  const len = sorted.length;
  if (len === 0) return 0;
  if (len === 1) return sorted[0];
  const pos = (len - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  const frac = pos - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

/** Anzahl der Elemente strikt > x im aufsteigend sortierten Array (binäre Suche). */
function countGreater(sorted: ArrayLike<number>, x: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sorted[mid] <= x) lo = mid + 1;
    else hi = mid;
  }
  return sorted.length - lo;
}

/**
 * Ränge (0-basiert) der Werte: rank[i] = Position von arr[i] in aufsteigender Ordnung.
 * Stabile Zuordnung über argsort.
 */
function ranksOf(arr: Float64Array): Int32Array {
  const n = arr.length;
  const idx = new Array<number>(n);
  for (let i = 0; i < n; i++) idx[i] = i;
  idx.sort((a, b) => arr[a] - arr[b]);
  const rank = new Int32Array(n);
  for (let k = 0; k < n; k++) rank[idx[k]] = k;
  return rank;
}

function sortedCopy(a: Float64Array): Float64Array {
  // TypedArray.prototype.sort ist numerisch (nicht lexikografisch) — genau gewollt.
  return Float64Array.from(a).sort();
}

function statsFromSorted(sorted: Float64Array, mean: number): FairStats {
  const n = sorted.length;
  return {
    min: n ? sorted[0] : 0,
    mean,
    p10: percentileSorted(sorted, 0.1),
    p50: percentileSorted(sorted, 0.5),
    p90: percentileSorted(sorted, 0.9),
    max: n ? sorted[n - 1] : 0,
  };
}

// ── Simulation ──

function simulateLight(input: FairInput, n: number, seed: number): Float64Array {
  const rng = mulberry32(seed >>> 0);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    // Identische Zieh-Reihenfolge wie simulateAnnualLoss (Default-λ=4) ⇒ byte-gleiche Samples.
    const lef = samplePert(rng, input.lefMin, input.lefLikely, input.lefMax);
    const lm = samplePert(rng, input.lmMin, input.lmLikely, input.lmMax);
    out[i] = Math.max(0, lef) * Math.max(0, lm);
  }
  return out;
}

function simulateFull(input: FairFullInput, n: number, seed: number): Float64Array {
  const rng = mulberry32(seed >>> 0);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    // TEF = CF×PoA oder direkt
    let tef: number;
    if (input.tef) {
      tef = drawPert(rng, input.tef);
    } else {
      const cf = input.cf ? drawPert(rng, input.cf) : 0;
      const poa = input.poa ? drawPert(rng, input.poa) : 0;
      tef = cf * poa;
    }
    // Vuln = direkt oder 1{TCap > RS}
    let vuln: number;
    if (input.vuln) {
      vuln = drawPert(rng, input.vuln);
    } else if (input.tcap && input.rs) {
      const tcap = drawPert(rng, input.tcap);
      const rs = drawPert(rng, input.rs);
      vuln = tcap > rs ? 1 : 0;
    } else {
      vuln = 1;
    }
    const lef = tef * vuln;

    // Primärverlust = Σ 6 Formen
    let pl = 0;
    for (const f of LOSS_FORMS) {
      const p = input.primary?.[f];
      if (p) pl += drawPert(rng, p);
    }
    // Sekundärverlust bedingt: LM = PL + SLEF·Σ secondary
    let slm = 0;
    if (input.secondary) {
      for (const f of LOSS_FORMS) {
        const p = input.secondary[f];
        if (p) slm += drawPert(rng, p);
      }
    }
    const slef = input.slef ? Math.min(1, Math.max(0, drawPert(rng, input.slef))) : 0;
    const lm = pl + slef * slm;

    out[i] = Math.max(0, lef * lm); // ALE ≥ 0
  }
  return out;
}

function isLight(input: FairFullInput | FairInput): input is FairInput {
  return "lefMin" in input;
}

/**
 * Monte-Carlo-Simulation eines FAIR-Szenarios (light ODER voll).
 * light-Modus delegiert die Perzentile/Mean 1:1 an `simulateAnnualLoss` (Identität).
 */
export function simulateScenario(
  input: FairFullInput | FairInput,
  draws = 20000,
  seed = 12345,
): ScenarioResult {
  const n = Math.max(1, Math.floor(draws));

  if (isLight(input)) {
    const samples = simulateLight(input, n, seed);
    const sorted = sortedCopy(samples);
    // Identität: mean/p10/p50/p90 exakt aus simulateAnnualLoss übernehmen.
    const res = simulateAnnualLoss(input, n, seed);
    const stats: FairStats = {
      min: sorted[0],
      mean: res.mean,
      p10: res.p10,
      p50: res.p50,
      p90: res.p90,
      max: sorted[n - 1],
    };
    return { samples, stats, lec: buildLec(sorted, 60) };
  }

  const samples = simulateFull(input, n, seed);
  const sorted = sortedCopy(samples);
  let total = 0;
  for (let i = 0; i < n; i++) total += samples[i];
  const stats = statsFromSorted(sorted, total / n);
  return { samples, stats, lec: buildLec(sorted, 60) };
}

// ── Loss-Exceedance-Kurve ──

/** P(Verlust > x) aus aufsteigend sortierten Samples (komplementäre CDF). */
export function exceedanceProbability(sortedSamples: ArrayLike<number>, x: number): number {
  const n = sortedSamples.length;
  if (n === 0) return 0;
  return countGreater(sortedSamples, x) / n;
}

/**
 * LEC aus N aufsteigend sortierten ALE-Samples: 60 log-spaced Punkte von
 * max(1, P01) bis Max, LEC(x) = #{ALE_i > x}/N. Monoton fallend.
 */
export function buildLec(sortedSamples: Float64Array, points = 60): LecPoint[] {
  const n = sortedSamples.length;
  const out: LecPoint[] = [];
  if (n === 0 || points <= 0) return out;

  const max = sortedSamples[n - 1];
  const p01 = percentileSorted(sortedSamples, 0.01);
  const lo = Math.max(1, p01);
  const hi = max;

  if (!(hi > lo) || !isFinite(hi)) {
    // Degeneriert (alle Samples ~gleich): flache Kurve am einzigen Punkt.
    for (let k = 0; k < points; k++) {
      out.push({ x: lo, p: exceedanceProbability(sortedSamples, lo) });
    }
    return out;
  }

  const logLo = Math.log(lo);
  const logHi = Math.log(hi);
  for (let k = 0; k < points; k++) {
    const t = points === 1 ? 0 : k / (points - 1);
    const x = Math.exp(logLo + t * (logHi - logLo));
    out.push({ x, p: exceedanceProbability(sortedSamples, x) });
  }
  return out;
}

// ── Portfolio-Aggregation (Iman-Conover) ──

/**
 * Portfolio-Aggregation mit Korrelation über gemeinsame Treiber (Iman-Conover).
 * Szenarien derselben `group` teilen einen gemeinsamen Normal-Vektor Z_g und werden
 * paarweise auf ρ korreliert; `group == null` ⇒ eigenes (unkorreliertes) Solo-Bündel.
 * Reordering ändert nur Ränge, nicht Werte ⇒ Portfolio-Mean ist ρ-invariant, die
 * Tails wachsen mit ρ (korrelierte Szenarien teilen ihre schlechten Iterationen).
 */
export function aggregatePortfolio(
  scenarios: { id: string; samples: Float64Array; group?: string | null }[],
  rho = 0.6,
  seed = 12345,
): PortfolioResult {
  const S = scenarios.length;
  if (S === 0) {
    return { stats: { min: 0, mean: 0, p10: 0, p50: 0, p90: 0, max: 0 }, lec: [], groups: [] };
  }
  // Kürzestes Szenario bestimmt N — sonst liefert vals[rank[i]] bei ungleicher
  // Sample-Länge undefined ⇒ NaN im Portfolio-Mittel.
  const N = Math.min(...scenarios.map(s => s.samples.length));
  if (!Number.isFinite(N) || N <= 0) {
    return { stats: { min: 0, mean: 0, p10: 0, p50: 0, p90: 0, max: 0 }, lec: [], groups: [] };
  }
  const rng = mulberry32(seed >>> 0);
  const r = Math.min(1, Math.max(0, rho));
  const sr = Math.sqrt(r);
  const sr1 = Math.sqrt(1 - r);

  // Gruppierung: definierte Gruppe teilt Z_g; null ⇒ eigenes Solo-Bündel.
  const groupMembers = new Map<string, number[]>();
  let auto = 0;
  for (let s = 0; s < S; s++) {
    const g = scenarios[s].group ?? `__solo_${auto++}`;
    if (!groupMembers.has(g)) groupMembers.set(g, []);
    groupMembers.get(g)!.push(s);
  }

  const reordered: Float64Array[] = new Array(S);
  for (const [, members] of groupMembers) {
    // Gemeinsamer Normal-Vektor Z_g für die Gruppe.
    const Z = new Float64Array(N);
    for (let i = 0; i < N; i++) Z[i] = sampleNormal(rng);
    for (const s of members) {
      const y = new Float64Array(N);
      for (let i = 0; i < N; i++) {
        const eps = sampleNormal(rng);
        y[i] = sr * Z[i] + sr1 * eps;
      }
      const rank = ranksOf(y);
      const vals = sortedCopy(scenarios[s].samples);
      const outArr = new Float64Array(N);
      for (let i = 0; i < N; i++) outArr[i] = vals[rank[i]];
      reordered[s] = outArr;
    }
  }

  // Portfolio_i = Σ_s reordered_s[i]
  const port = new Float64Array(N);
  let total = 0;
  for (let i = 0; i < N; i++) {
    let sum = 0;
    for (let s = 0; s < S; s++) sum += reordered[s][i];
    port[i] = sum;
    total += sum;
  }
  const mean = total / N;
  const sortedPort = sortedCopy(port);
  const stats = statsFromSorted(sortedPort, mean);
  const lec = buildLec(sortedPort, 60);

  // Konzentrations-Report je Gruppe.
  const groups: PortfolioGroup[] = [];
  for (const [g, members] of groupMembers) {
    let acc = 0;
    for (let i = 0; i < N; i++) {
      for (const s of members) acc += reordered[s][i];
    }
    const exposure = acc / N;
    const id = g.startsWith("__solo_") ? scenarios[members[0]].id : g;
    groups.push({ id, exposure, share: mean !== 0 ? exposure / mean : 0 });
  }
  groups.sort((a, b) => b.exposure - a.exposure);

  return { stats, lec, groups };
}

// ── Risk-Appetite ──

/**
 * Risk-Appetite-Kurve über der LEC. Stützpunkte werden log-linear interpoliert
 * (log in Verlust UND in Wahrscheinlichkeit ⇒ Potenzgesetz); Breach-Segmente =
 * zusammenhängende Bereiche, in denen LEC(x) > appetite(x).
 */
export function evaluateAppetite(
  lec: LecPoint[],
  appetite: AppetitePoint[],
): { ok: boolean; breaches: AppetiteBreach[] } {
  const breaches: AppetiteBreach[] = [];
  if (!appetite || appetite.length === 0) return { ok: true, breaches };

  const pts = [...appetite].sort((a, b) => a.loss_eur - b.loss_eur);
  const first = pts[0];
  const last = pts[pts.length - 1];

  const appAt = (x: number): number => {
    if (x <= first.loss_eur) return first.max_annual_prob;
    if (x >= last.loss_eur) return last.max_annual_prob;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (x >= a.loss_eur && x <= b.loss_eur) {
        // log(0) = −∞ ⇒ t = NaN ⇒ Verletzung würde still übersehen. Werte auf
        // ≥1 klemmen; bei identischen Stützpunkten strengere (kleinere) Prob.
        const la = Math.log(Math.max(1, a.loss_eur));
        const lb = Math.log(Math.max(1, b.loss_eur));
        const pa = Math.max(a.max_annual_prob, 1e-12);
        const pb = Math.max(b.max_annual_prob, 1e-12);
        if (lb === la) return Math.min(pa, pb);
        const t = (Math.log(Math.max(1, x)) - la) / (lb - la);
        return pa * Math.pow(pb / pa, t); // log-linear (geometrisch) auf der Wahrscheinlichkeit
      }
    }
    return last.max_annual_prob;
  };

  let seg: AppetiteBreach | null = null;
  for (const point of lec) {
    const ap = appAt(point.x);
    if (point.p > ap) {
      if (!seg) {
        seg = { from: point.x, to: point.x, lec_p: point.p, appetite_p: ap };
      } else {
        seg.to = point.x;
        // repräsentativ: der Punkt der stärksten Überschreitung
        if (point.p - ap > seg.lec_p - seg.appetite_p) {
          seg.lec_p = point.p;
          seg.appetite_p = ap;
        }
      }
    } else if (seg) {
      breaches.push(seg);
      seg = null;
    }
  }
  if (seg) breaches.push(seg);

  return { ok: breaches.length === 0, breaches };
}

/** Δ-ALE (Reduktion) für E7: mean(vorher) − mean(nachher). Positiv = Verbesserung. */
export function deltaAle(before: FairStats, after: FairStats): number {
  return before.mean - after.mean;
}
