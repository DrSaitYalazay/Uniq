/**
 * Risk Quantification Engine — FAIR-light (ITEM 21)
 *
 * Optionales, rein additives Overlay zur qualitativen Risiko-Matrix (riskEngine.ts).
 * Setzt eine vereinfachte FAIR-Logik (Factor Analysis of Information Risk) um:
 *
 *   Jährlicher Verlust  =  LEF (Loss Event Frequency, Ereignisse/Jahr)
 *                          × LM  (Loss Magnitude, EUR pro Ereignis)
 *
 * Beide Größen werden als 3-Punkt-Schätzung (min / likely / max) erfasst und
 * über eine PERT-/Dreiecks-Verteilung Monte-Carlo-simuliert. Ergebnis ist ein
 * jährliches Verlust-Band (P10 / P50 / P90 + Mittelwert).
 *
 * WICHTIG:
 *  - Rein funktional, KEINE Seiteneffekte, KEIN DB-/Client-Zugriff, KEIN Netzwerk.
 *  - Deterministisch bei festem Seed (seedbarer PRNG mulberry32) → reproduzierbare Tests.
 *  - Die Verdrahtung (Eingabe-Dialog im Risiko-Detail, €-Band-Spalte im riskReport*)
 *    erfolgt SEPARAT; diese Datei liefert nur die reine Rechenlogik.
 */

// ── Typen ──

export interface FairInput {
  /** Loss Event Frequency (Ereignisse pro Jahr) — untere Schätzung */
  lefMin: number;
  /** Loss Event Frequency — wahrscheinlichster Wert */
  lefLikely: number;
  /** Loss Event Frequency — obere Schätzung */
  lefMax: number;
  /** Loss Magnitude (EUR pro Ereignis) — untere Schätzung */
  lmMin: number;
  /** Loss Magnitude (EUR pro Ereignis) — wahrscheinlichster Wert */
  lmLikely: number;
  /** Loss Magnitude (EUR pro Ereignis) — obere Schätzung */
  lmMax: number;
}

export interface FairResult {
  /** 10. Perzentil des jährlichen Verlusts (EUR) */
  p10: number;
  /** Median / 50. Perzentil des jährlichen Verlusts (EUR) */
  p50: number;
  /** 90. Perzentil des jährlichen Verlusts (EUR) */
  p90: number;
  /** Arithmetischer Mittelwert (Annualized Loss Expectancy, EUR) */
  mean: number;
}

// ── Seedbarer PRNG (mulberry32) ──
//
// Kleiner, schneller 32-bit-PRNG. Gleicher Seed ⇒ identische Zahlenfolge ⇒
// reproduzierbare Simulation für Unit-Tests / Snapshot-Vergleiche.

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── PERT-Verteilung (3-Punkt) ──
//
// Die PERT-Verteilung ist eine reparametrisierte Beta-Verteilung über [min, max]
// mit Modus "likely". Sie ist der klassische FAIR-/Projektschätz-Standard, weil
// sie den wahrscheinlichsten Wert stärker gewichtet als die Dreiecksverteilung.
//
// Umsetzung: Beta(alpha, beta) via zwei Gamma-Draws (Marsaglia-Tsang), dann
// linear auf [min, max] skaliert. lambda=4 ist der Standard-PERT-Formfaktor.

export function sampleGamma(rng: () => number, shape: number): number {
  // Marsaglia & Tsang (2000). Für shape < 1 Boost-Trick.
  if (shape < 1) {
    const u = rng();
    return sampleGamma(rng, shape + 1) * Math.pow(u, 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let x = 0;
    let v = 0;
    do {
      // Box-Muller für Standardnormal
      const u1 = Math.max(rng(), 1e-12);
      const u2 = rng();
      x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

export function sampleBeta(rng: () => number, alpha: number, beta: number): number {
  const g1 = sampleGamma(rng, alpha);
  const g2 = sampleGamma(rng, beta);
  const sum = g1 + g2;
  return sum > 0 ? g1 / sum : 0.5;
}

/**
 * Ein PERT-Draw über [min, max] mit Modus `likely`.
 * Fällt auf eine konstante Rückgabe zurück, wenn das Intervall degeneriert ist
 * (min == max) — verhindert NaN/Division durch Null.
 */
export function samplePert(
  rng: () => number,
  min: number,
  likely: number,
  max: number,
  lambda = 4,
): number {
  if (max <= min) return min;
  // Modus in die Grenzen zwingen (robust gegen fehlerhafte Eingaben):
  const mode = Math.min(Math.max(likely, min), max);
  const range = max - min;
  const alpha = 1 + (lambda * (mode - min)) / range;
  const beta = 1 + (lambda * (max - mode)) / range;
  const x = sampleBeta(rng, alpha, beta);
  return min + x * range;
}

// ── Öffentliche API ──

/**
 * Monte-Carlo-Simulation des jährlichen Verlusts nach FAIR-light.
 *
 * @param input  3-Punkt-Schätzungen für LEF (Ereignisse/Jahr) und LM (EUR/Ereignis).
 * @param draws  Anzahl der Simulationsziehungen (Default 10 000).
 * @param seed   Seed für den PRNG (Default 12345) → deterministische Ergebnisse.
 * @returns      Verlust-Band { p10, p50, p90, mean } in EUR.
 *
 * Reine Funktion: gleiche Argumente ⇒ exakt gleiches Ergebnis, keine Seiteneffekte.
 */
export function simulateAnnualLoss(
  input: FairInput,
  draws = 10000,
  seed = 12345,
): FairResult {
  const n = Math.max(1, Math.floor(draws));
  const rng = mulberry32(seed);
  const losses = new Float64Array(n);
  let total = 0;

  for (let i = 0; i < n; i++) {
    const lef = samplePert(rng, input.lefMin, input.lefLikely, input.lefMax);
    const lm = samplePert(rng, input.lmMin, input.lmLikely, input.lmMax);
    // Negative Werte sind physikalisch sinnlos → auf 0 klemmen.
    const annual = Math.max(0, lef) * Math.max(0, lm);
    losses[i] = annual;
    total += annual;
  }

  const sorted = Array.from(losses).sort((a, b) => a - b);
  return {
    p10: percentile(sorted, 0.1),
    p50: percentile(sorted, 0.5),
    p90: percentile(sorted, 0.9),
    mean: total / n,
  };
}

/**
 * Perzentil über ein bereits AUFSTEIGEND sortiertes Array (lineare Interpolation).
 */
function percentile(sortedAsc: number[], q: number): number {
  const len = sortedAsc.length;
  if (len === 0) return 0;
  if (len === 1) return sortedAsc[0];
  const pos = (len - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sortedAsc[lo];
  const frac = pos - lo;
  return sortedAsc[lo] * (1 - frac) + sortedAsc[hi] * frac;
}

/**
 * Formatiert ein Verlust-Band als lesbares €-Band:
 *   "€X – €Y (Median €Z)"  mit X=p10, Y=p90, Z=p50.
 *
 * Ganzzahlige EUR-Beträge, deutsche Tausenderpunkte (de-DE).
 */
export function formatEuroBand(r: FairResult): string {
  const fmt = (v: number) =>
    "€" + Math.round(v).toLocaleString("de-DE");
  return `${fmt(r.p10)} – ${fmt(r.p90)} (Median ${fmt(r.p50)})`;
}
