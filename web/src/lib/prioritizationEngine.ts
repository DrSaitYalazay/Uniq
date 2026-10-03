/**
 * prioritizationEngine — E7 · Risikobasierte Priorisierung (marktreif).
 *
 * Macht aus E1 (FAIR / Δ-ALE) + E2 (multiplikatives Residualrisiko) das
 * ROI-Verkaufsargument: „Plan A senkt ALE um 240 k€ bei 60 PT, ROSI 3.0".
 *
 * Leistungsumfang (siehe ENGINE_ARCHITECTURE_MARKETGRADE.md, Abschnitt E7):
 *   E7.1  Maßnahmen-Scoring
 *         - ordinal  ΔR_m = Σ_risks [ residual(ohne m) − residual(mit m) ]  (via applyResidualRiskV2)
 *                    „mit m" setzt impl_c der Controls von m auf 1.0
 *         - monetär  ΔALE_m via zwei simulateScenario-Läufe mit GLEICHEM Seed
 *                    (Common Random Numbers ⇒ Δ varianzarm & deterministisch):
 *                    vulnAfter = vuln × Π(1−eff_c)  für likelihood-Controls,
 *                    lmAfter   = lm   × Π(1−eff_c)  für impact-Controls
 *         - PriorityScore = (ΔALE falls vorhanden, sonst ΔR·scale) / max(effort_pt, 0.5)
 *         - ROSI          = (ΔALE − annual_cost) / annual_cost   (nur mit Kostenangabe)
 *   E7.2  Quick-Win-Knapsack: 0/1-Knapsack-DP (0.5-PT-Raster) maximiert ΔΣ unter Budget,
 *         Greedy-Fallback bei Kapazität > 2000 Einheiten; depends_on-Sperren (max 3 Runden).
 *   E7.3  computePhaseV2 (now = Knapsack(Q), next = Knapsack(Rest, Q), later = Rest;
 *         phase_override + Deadline-Overdue behalten Vorrang). Die alte
 *         roadmapEngine.computePhase bleibt unangetastet.
 *
 * Vertrag: pure, deterministisch, KEIN I/O. Klasse A-SICHER (rein additiv).
 */

import {
  simulateScenario,
  type FairFullInput,
  type FairInput,
} from "./fairEngine";
import {
  applyResidualRiskV2,
  type RiskObject,
  type RiskMatrixConfig,
} from "./riskEngine";
import type { ControlEff, RiskControlLink } from "./controlEffectivenessEngine";
import {
  computePhase,
  type RoadmapPhase,
  type RoadmapRow,
} from "./roadmapEngine";

// ── Konstanten ──

/** Standard-Ziehungszahl der Monte-Carlo-Läufe (identisch zu simulateScenario). */
const DEFAULT_DRAWS = 20000;
/** Standard-Seed (Common Random Numbers) für beide ΔALE-Läufe. */
const DEFAULT_SEED = 12345;
/** Ordinal→„Wert"-Skalierung, falls keine monetären Daten vorliegen. Über cfg.ordinal_scale übersteuerbar. */
const DEFAULT_ORDINAL_SCALE = 1;
/** DP-Obergrenze: darüber Greedy-Fallback (0.5-PT-Raster ⇒ Einheiten = 2·PT). */
const DP_MAX_CAPACITY_UNITS = 2000;

// Default-Effektivität eines Controls, das noch nicht bewertet wurde, wenn eine
// Maßnahme es voll umsetzt (impl = 1.0): base 0.5 × maturity 0.8 × verify 0.85.
const DEFAULT_FULL_IMPL_EFF: ControlEff = {
  eff: 0.5 * 1.0 * 0.8 * 0.85,
  factors: { base: 0.5, impl: 1.0, maturity: 0.8, verify: 0.85 },
  confidence: "attested",
};

// ── Typen ──

/**
 * Strukturelle Sicht auf eine Maßnahme (RoadmapItem / Treatment mit
 * selected_control_ids[]). Bewusst lokal gehalten, damit E7 keine Kopplung an
 * roadmapEngine/treatmentEngine erzeugt; RoadmapItem/TreatmentObject sind
 * strukturell zuweisbar.
 */
export interface Measure {
  /** Stabile ID (roadmap_items.id oder treatment.id). */
  id: string;
  /** control_keys ("framework::id") der von der Maßnahme umgesetzten Controls. */
  selected_control_ids: string[];
  /** Aufwand in Personentagen (roadmap_items.effort_pt). */
  effort_pt?: number | null;
  /** Jährliche Kosten in EUR (roadmap_items.cost_eur) — für ROSI. */
  cost_eur?: number | null;
  /** Vorgänger-Maßnahmen (meta.depends_on) — für Knapsack-Sperren. */
  depends_on?: string[];
}

export interface MeasureScore {
  measureId: string;
  /** Σ residual(ohne m) − residual(mit m) über betroffene Risiken (ordinal). */
  deltaOrdinal: number;
  /** Σ mean(ALE heute) − mean(ALE mit m) über quantifizierte Risiken (EUR) oder null. */
  deltaAleEur: number | null;
  effortPt: number;
  /** (ΔALE ?? ΔR·scale) / max(effort_pt, 0.5). */
  priority: number;
  /** (ΔALE − annual_cost) / annual_cost — nur mit Kostenangabe & ΔALE. */
  rosi: number | null;
  /** Herleitung je betroffenem Risiko (Report-tauglich). */
  perRisk: { riskId: string; before: number; after: number }[];
  /** Vorgänger (meta.depends_on) — vom Knapsack für Sperren genutzt. */
  dependsOn?: string[];
}

export interface QuickWinResult {
  selected: string[];
  totalDelta: number;
  totalEffort: number;
  method: "dp" | "greedy";
}

// ── Helfer ──

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** ControlEff-Kopie mit impl = 1.0 (Maßnahme setzt das Control voll um). */
function withFullImpl(ce: ControlEff): ControlEff {
  const f = ce.factors;
  return {
    eff: f.base * 1.0 * f.maturity * f.verify,
    factors: { ...f, impl: 1.0 },
    confidence: ce.confidence,
  };
}

/** eff-Map „mit m": Basiszustand plus die Controls von m auf impl = 1.0 angehoben. */
function effWithMeasure(
  base: Map<string, ControlEff>,
  controlKeys: Iterable<string>,
): Map<string, ControlEff> {
  const out = new Map(base);
  for (const key of controlKeys) {
    const cur = base.get(key);
    out.set(key, cur ? withFullImpl(cur) : DEFAULT_FULL_IMPL_EFF);
  }
  return out;
}

function isLight(input: FairFullInput | FairInput): input is FairInput {
  return "lefMin" in input;
}

type Pert3Like = { min: number; likely: number; max: number; conf?: unknown };

function scalePert<T extends Pert3Like>(p: T, f: number): T {
  return { ...p, min: p.min * f, likely: p.likely * f, max: p.max * f };
}

/**
 * FAIR-Kopplung: likelihood-Controls skalieren die Vulnerability (bzw. bei
 * fehlendem vuln die TEF/CF — LEF = TEF×Vuln, also wirkungsgleich), impact-
 * Controls skalieren alle Verlustformen (Loss Magnitude).
 */
function scaleScenario(
  input: FairFullInput | FairInput,
  fVuln: number,
  fLm: number,
): FairFullInput | FairInput {
  if (isLight(input)) {
    return {
      ...input,
      lefMin: input.lefMin * fVuln,
      lefLikely: input.lefLikely * fVuln,
      lefMax: input.lefMax * fVuln,
      lmMin: input.lmMin * fLm,
      lmLikely: input.lmLikely * fLm,
      lmMax: input.lmMax * fLm,
    };
  }
  const out: FairFullInput = { ...input };
  if (fVuln !== 1) {
    if (input.vuln) out.vuln = scalePert(input.vuln, fVuln);
    else if (input.tef) out.tef = scalePert(input.tef, fVuln);
    else if (input.cf) out.cf = scalePert(input.cf, fVuln);
  }
  if (fLm !== 1) {
    if (input.primary) {
      const prim: FairFullInput["primary"] = {};
      for (const k of Object.keys(input.primary) as (keyof FairFullInput["primary"])[]) {
        const p = input.primary[k];
        if (p) prim[k] = scalePert(p, fLm);
      }
      out.primary = prim;
    }
    if (input.secondary) {
      const sec: NonNullable<FairFullInput["secondary"]> = {};
      for (const k of Object.keys(input.secondary) as (keyof NonNullable<FairFullInput["secondary"]>)[]) {
        const p = input.secondary[k];
        if (p) sec[k] = scalePert(p, fLm);
      }
      out.secondary = sec;
    }
  }
  return out;
}

// ── E7.1 · Maßnahmen-Scoring ──

/**
 * scoreMeasures — pure & deterministisch. Bewertet jede Maßnahme mit ordinaler
 * Risikoreduktion (via applyResidualRiskV2, multiplikatives Modell erzwungen),
 * optional monetärer Δ-ALE (Common Random Numbers), PriorityScore und ROSI.
 */
export function scoreMeasures(
  measures: Measure[],
  risks: RiskObject[],
  links: RiskControlLink[],
  effByControl: Map<string, ControlEff>,
  cfg: RiskMatrixConfig,
  quant?: Map<string, FairFullInput | FairInput>,
  seed?: number,
): MeasureScore[] {
  const cfgMul: RiskMatrixConfig & { residual_model?: string } = {
    ...cfg,
    residual_model: "multiplicative",
  };
  const scale =
    typeof (cfg as { ordinal_scale?: number }).ordinal_scale === "number"
      ? (cfg as { ordinal_scale?: number }).ordinal_scale!
      : DEFAULT_ORDINAL_SCALE;
  const useSeed = seed ?? DEFAULT_SEED;

  // Links je Risiko (für die FAIR-Kopplung schnell nachschlagbar).
  const linksByRisk = new Map<string, RiskControlLink[]>();
  for (const link of links ?? []) {
    if (!link) continue;
    const arr = linksByRisk.get(link.risk_id);
    if (arr) arr.push(link);
    else linksByRisk.set(link.risk_id, [link]);
  }

  // Basis-Residual (ohne jegliche Maßnahme) einmal berechnen.
  const baseResidual = applyResidualRiskV2(risks, links, effByControl, cfgMul);
  const baseById = new Map(baseResidual.map(r => [r.risk_id, r]));

  return measures.map(m => {
    const controlSet = new Set(m.selected_control_ids ?? []);

    // Betroffene Risiken = Risiken mit einem Link auf ein Control von m.
    const affectedRiskIds = new Set<string>();
    for (const link of links ?? []) {
      if (link && controlSet.has(link.control_key)) affectedRiskIds.add(link.risk_id);
    }

    // „mit m": impl der Controls von m auf 1.0.
    const effMit = effWithMeasure(effByControl, controlSet);
    const withResidual = applyResidualRiskV2(risks, links, effMit, cfgMul);
    const mitById = new Map(withResidual.map(r => [r.risk_id, r]));

    // ── ordinal ΔR ──
    let deltaOrdinal = 0;
    const perRisk: { riskId: string; before: number; after: number }[] = [];
    for (const rid of affectedRiskIds) {
      const before = baseById.get(rid)?.residual_score ?? 0;
      const after = mitById.get(rid)?.residual_score ?? 0;
      deltaOrdinal += before - after;
      perRisk.push({ riskId: rid, before, after });
    }

    // ── monetär ΔALE (Common Random Numbers) ──
    let deltaAleEur: number | null = null;
    if (quant && quant.size > 0) {
      let sum = 0;
      let any = false;
      for (const rid of affectedRiskIds) {
        const scen = quant.get(rid);
        if (!scen) continue;
        any = true;

        // Kopplungsfaktoren je Dimension aus den Controls von m an diesem Risiko.
        let fVuln = 1;
        let fLm = 1;
        const seenKeys = new Set<string>();
        for (const link of linksByRisk.get(rid) ?? []) {
          if (!controlSet.has(link.control_key)) continue;
          if (seenKeys.has(link.control_key)) continue;
          seenKeys.add(link.control_key);
          const ce = effMit.get(link.control_key);
          if (!ce) continue;
          const damping = typeof link.damping === "number" ? link.damping : 1.0;
          const eff = clamp01(ce.eff * damping);
          const dim = link.dimension ?? "likelihood";
          if (dim === "impact") {
            fLm *= 1 - eff;
          } else if (dim === "both") {
            const half = eff / 2;
            fVuln *= 1 - half;
            fLm *= 1 - half;
          } else {
            fVuln *= 1 - eff;
          }
        }

        // Zwei Läufe, GLEICHER Seed ⇒ varianzarme, deterministische Differenz.
        const before = simulateScenario(scen, DEFAULT_DRAWS, useSeed).stats.mean;
        const after = simulateScenario(
          scaleScenario(scen, fVuln, fLm),
          DEFAULT_DRAWS,
          useSeed,
        ).stats.mean;
        sum += before - after;
      }
      if (any) deltaAleEur = sum;
    }

    const effortPt = typeof m.effort_pt === "number" ? m.effort_pt : 0;
    const benefit = deltaAleEur != null ? deltaAleEur : deltaOrdinal * scale;
    const priority = benefit / Math.max(effortPt, 0.5);

    const cost = typeof m.cost_eur === "number" ? m.cost_eur : null;
    const rosi =
      deltaAleEur != null && cost != null && cost > 0
        ? (deltaAleEur - cost) / cost
        : null;

    return {
      measureId: m.id,
      deltaOrdinal,
      deltaAleEur,
      effortPt,
      priority,
      rosi,
      perRisk,
      dependsOn: m.depends_on,
    };
  });
}

// ── E7.2 · Quick-Win-Knapsack ──

/** „Wert" einer Maßnahme für den Knapsack: monetär falls vorhanden, sonst ordinal. */
function valueOf(s: MeasureScore): number {
  return s.deltaAleEur != null ? s.deltaAleEur : s.deltaOrdinal;
}

/** Aufwand in 0.5-PT-RasterEinheiten (Einheit = 2·PT, gerundet). */
function unitsOf(effortPt: number): number {
  return Math.max(0, Math.round(effortPt * 2));
}

interface KnapsackPick {
  selected: string[];
  totalValue: number;
  totalUnits: number;
}

/** 0/1-Knapsack-DP: maximiert Σ Wert unter Kapazität (Einheiten). */
function knapsackDp(items: MeasureScore[], capacityUnits: number): KnapsackPick {
  const n = items.length;
  const weights = items.map(s => unitsOf(s.effortPt));
  const values = items.map(valueOf);

  // dp[c] = bester Wert bei Kapazität ≤ c; keep[i][c] = Item i bei c gewählt.
  const dp = new Float64Array(capacityUnits + 1);
  const keep: Uint8Array[] = [];
  for (let i = 0; i < n; i++) {
    keep.push(new Uint8Array(capacityUnits + 1));
    const w = weights[i];
    const v = values[i];
    if (v <= 0) continue; // negative/0-Nutzen niemals wählen
    for (let c = capacityUnits; c >= w; c--) {
      const cand = dp[c - w] + v;
      if (cand > dp[c]) {
        dp[c] = cand;
        keep[i][c] = 1;
      }
    }
  }

  // Rückverfolgung.
  const selected: string[] = [];
  let c = capacityUnits;
  let totalUnits = 0;
  for (let i = n - 1; i >= 0; i--) {
    if (keep[i][c]) {
      selected.push(items[i].measureId);
      totalUnits += weights[i];
      c -= weights[i];
    }
  }
  selected.reverse();
  return { selected, totalValue: dp[capacityUnits], totalUnits };
}

/** Greedy nach PriorityScore (Wert/Aufwand) als Fallback bei zu großer Kapazität. */
function knapsackGreedy(items: MeasureScore[], capacityUnits: number): KnapsackPick {
  const order = [...items]
    .filter(s => valueOf(s) > 0)
    .sort((a, b) => b.priority - a.priority);
  const selected: string[] = [];
  let totalUnits = 0;
  let totalValue = 0;
  for (const s of order) {
    const w = unitsOf(s.effortPt);
    if (totalUnits + w <= capacityUnits) {
      selected.push(s.measureId);
      totalUnits += w;
      totalValue += valueOf(s);
    }
  }
  return { selected, totalValue, totalUnits };
}

/**
 * selectQuickWins — E7.2. 0/1-Knapsack (DP über 0.5-PT-Raster) maximiert ΔΣ
 * unter Budget; Greedy-Fallback bei Kapazität > 2000 Einheiten. depends_on:
 * ist ein Vorgänger nicht gewählt, wird der Nachfolger gesperrt und die DP
 * wiederholt (max 3 Runden).
 */
export function selectQuickWins(scored: MeasureScore[], budgetPt: number): QuickWinResult {
  const capacityUnits = Math.max(0, Math.round(budgetPt * 2));
  const method: "dp" | "greedy" = capacityUnits > DP_MAX_CAPACITY_UNITS ? "greedy" : "dp";
  const solve = method === "greedy" ? knapsackGreedy : knapsackDp;

  let pool = [...scored];
  let pick = solve(pool, capacityUnits);

  // depends_on-Sperren: Nachfolger ohne gewählten Vorgänger entfernen, neu lösen.
  for (let round = 0; round < 3; round++) {
    const selectedSet = new Set(pick.selected);
    const locked = new Set<string>();
    for (const s of pool) {
      if (!selectedSet.has(s.measureId)) continue;
      const deps = s.dependsOn ?? [];
      if (deps.some(d => !selectedSet.has(d))) locked.add(s.measureId);
    }
    if (locked.size === 0) break;
    pool = pool.filter(s => !locked.has(s.measureId));
    pick = solve(pool, capacityUnits);
  }

  // totalEffort in echten PT (nicht Rastereinheiten) aus der finalen Auswahl.
  const byId = new Map(scored.map(s => [s.measureId, s]));
  let totalEffort = 0;
  let totalDelta = 0;
  for (const id of pick.selected) {
    const s = byId.get(id);
    if (!s) continue;
    totalEffort += s.effortPt;
    totalDelta += valueOf(s);
  }

  return { selected: pick.selected, totalDelta, totalEffort, method };
}

// ── E7.3 · Roadmap-Phasen v2 ──

/**
 * computePhaseV2 — Budget-bewusste Now/Next/Later-Phasen. now = Knapsack(Budget_q),
 * next = Knapsack(Rest, Budget_q), later = Rest. phase_override und
 * Deadline-Overdue behalten Vorrang (wie in der alten computePhase). Zeilen ohne
 * passenden Score fallen auf die bestehende computePhase zurück (kein Regressions-
 * risiko). Rückgabe: Map row.key → Phase. Die alte computePhase bleibt unberührt.
 */
export function computePhaseV2(
  rows: RoadmapRow[],
  budgetPtPerQuarter: number,
  scored: MeasureScore[],
): Map<string, RoadmapPhase> {
  const scoreById = new Map(scored.map(s => [s.measureId, s]));
  const result = new Map<string, RoadmapPhase>();

  // Zeilen mit Vorrang (override / überfällig) sofort setzen und aus dem
  // Budget-Pool nehmen; Rest ist „eligible".
  const eligible: { row: RoadmapRow; score: MeasureScore }[] = [];
  for (const row of rows) {
    const override = row.item?.phase_override ?? null;
    if (override) {
      result.set(row.key, override);
      continue;
    }
    if (row.is_overdue) {
      result.set(row.key, "now");
      continue;
    }
    const score = row.item ? scoreById.get(row.item.id) : undefined;
    if (!score) {
      // Kein Score → bestehende Heuristik (Verhalten unverändert).
      result.set(row.key, computePhase(row.risk, row.item));
      continue;
    }
    eligible.push({ row, score });
  }

  const eligibleScores = eligible.map(e => e.score);

  // now = Knapsack(Budget_q).
  const nowSel = new Set(selectQuickWins(eligibleScores, budgetPtPerQuarter).selected);
  const restScores = eligibleScores.filter(s => !nowSel.has(s.measureId));
  // next = Knapsack(Rest, Budget_q).
  const nextSel = new Set(selectQuickWins(restScores, budgetPtPerQuarter).selected);

  for (const { row, score } of eligible) {
    if (nowSel.has(score.measureId)) result.set(row.key, "now");
    else if (nextSel.has(score.measureId)) result.set(row.key, "next");
    else result.set(row.key, "later");
  }

  return result;
}
