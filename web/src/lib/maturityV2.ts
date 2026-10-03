/**
 * maturityV2 — Reifegrad-SSOT + Ziel-Overlay (Spec-ITEM 11).
 *
 * Rein funktional, deterministisch, ohne Seiteneffekte. Additiv: berührt KEINE
 * bestehende Compliance-/Assessment-Zahl. Zwei Modi je Framework:
 *
 *  • usesMaturity=true  → IST je Familie = Mittelwert der ERFASSTEN reifegrad-Werte
 *    (nur EffectiveAnswer.reifegrad != null). KEINE „ja = 5"-Fiktion. derived=false.
 *  • usesMaturity=false → Pseudo-Score aus dem Konformitätsstatus (ja = 5,
 *    teilweise = 2.5, sonst 0), gemittelt über anwendbare Kontrollen (ohne „na").
 *    Das ist die heutige Formel aus maturityEngine.computeMaturityScore. derived=true.
 *
 * Ziel/Gap: target stammt aus public.maturity_targets (family_id → target, "" =
 * framework-weit). gap = target − ist, nur wenn ein target vorhanden ist.
 */

import { familiesOf, type ControlRow, type EffectiveAnswer } from "./assessmentEngine";

export interface FrameworkMaturityInput {
  framework: string;
  usesMaturity: boolean;
  controls: ControlRow[];
  effective: Map<string, EffectiveAnswer>;
  /** family_id → Ziel-Reifegrad (0–5). Schlüssel "" = framework-weites Ziel. */
  targets?: Record<string, number>;
}

export interface MaturityGroup {
  /** Lesbares Familien-Label (familiesOf(...).label). */
  family: string;
  /** IST-Reifegrad 0–5, eine Nachkommastelle. */
  ist: number;
  /** Ziel-Reifegrad oder null, wenn keins hinterlegt. */
  target: number | null;
  /** target − ist (eine Nachkommastelle) oder null. */
  gap: number | null;
  /** true = Pseudo-Score aus Konformität; false = echte erfasste Reifegrade. */
  derived: boolean;
  /** Anzahl (gefilterter) Kontrollen in dieser Familie. */
  count: number;
}

export interface FrameworkMaturityResult {
  groups: MaturityGroup[];
  overall: number;
  derived: boolean;
}

const round1 = (x: number): number => Math.round(x * 10) / 10;

/** Kontrollen wie in der Compliance-Bewertung filtern: keine Sub-Controls,
 *  kein meta.scored === false. Idempotent — auch wenn der Aufrufer schon filtert. */
function scoredControls(controls: ControlRow[]): ControlRow[] {
  return controls.filter((c) => {
    if (c.tags?.includes("sub")) return false;
    if ((c.meta as any)?.scored === false) return false;
    return true;
  });
}

function resolveTarget(
  targets: Record<string, number> | undefined,
  familyId: string,
): number | null {
  if (!targets) return null;
  if (familyId in targets) return targets[familyId];
  if ("" in targets) return targets[""];
  return null;
}

/**
 * Berechnet den Reifegrad je Familie + Gesamt für EIN Framework.
 * Deterministisch: gleiche Eingabe → byte-gleiche Ausgabe, keine I/O.
 */
export function computeFrameworkMaturity(
  input: FrameworkMaturityInput,
): FrameworkMaturityResult {
  const { usesMaturity, effective, targets } = input;
  const controls = scoredControls(input.controls);

  // Nach familiesOf gruppieren (id = Bucket, label = Anzeige): jede ISO-Referenz
  // zaehlt, damit Reifegrad und Gap-Akkordeon dieselbe Grundgesamtheit nutzen.
  const buckets = new Map<
    string,
    { label: string; controls: ControlRow[] }
  >();
  for (const c of controls) {
    for (const f of familiesOf(c, true)) {
      if (!buckets.has(f.id)) buckets.set(f.id, { label: f.label, controls: [] });
      buckets.get(f.id)!.controls.push(c);
    }
  }

  const groups: MaturityGroup[] = [];
  for (const [familyId, b] of buckets) {
    let ist: number;

    if (usesMaturity) {
      // Nur erfasste Reifegrade — keine ja=5-Fiktion.
      const captured: number[] = [];
      for (const c of b.controls) {
        const r = effective.get(c.id)?.reifegrad;
        if (r != null) captured.push(r);
      }
      ist = captured.length > 0
        ? round1(captured.reduce((s, v) => s + v, 0) / captured.length)
        : 0;
    } else {
      // Pseudo-Score aus Konformität (heutige Formel), ohne „na".
      let points = 0;
      let applicable = 0;
      for (const c of b.controls) {
        const s = effective.get(c.id)?.status ?? null;
        if (s === "na") continue;
        applicable++;
        if (s === "ja") points += 5;
        else if (s === "teilweise") points += 2.5;
      }
      ist = applicable > 0 ? round1(points / applicable) : 0;
    }

    const target = resolveTarget(targets, familyId);
    const gap = target != null ? round1(target - ist) : null;

    groups.push({
      family: b.label,
      ist,
      target,
      gap,
      derived: !usesMaturity,
      count: b.controls.length,
    });
  }

  // Deterministische Reihenfolge nach Label (numerisch-bewusst).
  groups.sort((a, b) =>
    a.family.localeCompare(b.family, undefined, { numeric: true }),
  );

  const overall = groups.length > 0
    ? round1(groups.reduce((s, g) => s + g.ist, 0) / groups.length)
    : 0;

  return { groups, overall, derived: !usesMaturity };
}

/* ────────────────────────────────────────────────────────────────────────
 * E6 · Reifegrad V3 — gewichteter Rollup + Trend (additiv, B-KERN).
 *
 * `computeFrameworkMaturityV3` erweitert V2 rein additiv:
 *
 *   • Kontroll-Gewicht w_c: der Aufrufer liefert eine `weights`-Map
 *     (controlId → w_c). Empfohlene Formel (analog E5 W_ctrl):
 *         w_c = muss_weight(muss ? 1.0 : 0.5) · (0.6 + 0.8·base_eff_c)
 *     Fehlt die Map (oder ein Eintrag), gilt w_c = 1 ⇒ ungewichtet wie V2.
 *   • Familie:   ist_f      = Σ_erfasst (w_c·r_c) / Σ_erfasst w_c
 *                coverage_f = Σ_erfasst w_c / Σ_alle w_c   (GEWICHTETE Erfassungsquote)
 *                confidence = coverage ≥ 0.7 'high' · ≥ 0.3 'medium' · sonst 'low'
 *   • Overall:   O = Σ_f (W_f·ist_f) / Σ_f W_f   mit  W_f = (Σ_{c∈f} w_c)·domain_weight_f
 *                domainWeights (family_id → Gewicht, Default 1); große Familien
 *                zählen automatisch mehr (behebt gleichgewichtetes Familien-Mittel).
 *   • derived-Modus (usesMaturity=false): Konformität belegt maximal `derivedCap`
 *     (Default 3 = 'Etabliert'): ja → cap · teilweise → cap/2 · nein → 0.
 *     KEINE ja=5-Fiktion mehr — klar als derived+capped gelabelt.
 *
 * IDENTITÄTS-BEWEIS zu V2 (siehe Fixture):
 *   Ohne `weights` (⇒ w_c=1), `domainWeights` = {} (⇒ domain_weight=1) und
 *   `derivedCap = 5` ergibt V3 dieselben Zahlen wie V2:
 *     – Familie ist_f  = einfacher Mittelwert (w_c=1)              ✔
 *     – derived ist_f  = ja=5 / teilweise=2.5 / nein=0 (cap=5)     ✔ (V2-Formel)
 *     – Overall        = Familien-Mittel, sofern alle Familien gleich viele
 *                        Kontrollen haben (dann W_f konstant ⇒ Gewichtung = Mittel).
 *   Die additiven Felder `coverage`/`confidence` werden für den Vergleich
 *   projiziert (weggeschnitten) — sie berühren keine V2-Zahl.
 * ──────────────────────────────────────────────────────────────────────── */

export interface FrameworkMaturityV3Options {
  /** controlId → Kontroll-Gewicht w_c. Fehlt Map/Eintrag ⇒ w_c = 1. */
  weights?: Map<string, number>;
  /** family_id → Domänengewicht W_f-Faktor. Default 1. */
  domainWeights?: Record<string, number>;
  /** Deckel für den derived-Pseudo-Score (usesMaturity=false). Default 3. */
  derivedCap?: number;
}

export interface MaturityGroupV3 extends MaturityGroup {
  /** Gewichtete Erfassungsquote 0–1 (Σ_erfasst w_c / Σ_alle w_c). */
  coverage: number;
  /** Vertrauensstufe aus coverage (≥0.7 high · ≥0.3 medium · sonst low). */
  confidence: "high" | "medium" | "low";
}

export interface FrameworkMaturityResultV3 {
  groups: MaturityGroupV3[];
  overall: number;
  derived: boolean;
}

const round3 = (x: number): number => Math.round(x * 1000) / 1000;

function confidenceOf(coverage: number): "high" | "medium" | "low" {
  if (coverage >= 0.7) return "high";
  if (coverage >= 0.3) return "medium";
  return "low";
}

/**
 * V3: gewichteter Reifegrad-Rollup je Familie + gewichteter Overall.
 * Deterministisch, ohne I/O. Additiv — V2 bleibt unberührt.
 */
export function computeFrameworkMaturityV3(
  input: FrameworkMaturityInput & FrameworkMaturityV3Options,
): FrameworkMaturityResultV3 {
  const { usesMaturity, effective, targets } = input;
  const weights = input.weights;
  const domainWeights = input.domainWeights ?? {};
  const derivedCap = input.derivedCap ?? 3;
  const controls = scoredControls(input.controls);

  const wOf = (id: string): number => {
    if (!weights) return 1;
    const w = weights.get(id);
    return w == null ? 1 : w;
  };

  // Gruppierung wie im Gap-Akkordeon: JEDE Referenz zählt, nicht nur die
  // primäre. Sonst nennt derselbe Bildschirm zwei Grundgesamtheiten für
  // dieselbe Familie (A.5: 106 hier, 121 im Akkordeon) und die 8 nur als
  // Zweitreferenz belegten Annex-Familien hätten überhaupt keinen Reifegrad.
  const buckets = new Map<string, { label: string; controls: ControlRow[] }>();
  for (const c of controls) {
    for (const f of familiesOf(c, true)) {
      if (!buckets.has(f.id)) buckets.set(f.id, { label: f.label, controls: [] });
      buckets.get(f.id)!.controls.push(c);
    }
  }

  type Row = { group: MaturityGroupV3; ist: number; totalW: number; familyId: string };
  const rows: Row[] = [];

  for (const [familyId, b] of buckets) {
    let ist: number;
    let totalW = 0; // Σ_alle w_c
    let capturedW = 0; // Σ_erfasst w_c (bzw. Σ_applicable im derived-Modus)

    if (usesMaturity) {
      let num = 0; // Σ_erfasst w_c·r_c
      for (const c of b.controls) {
        const w = wOf(c.id);
        totalW += w;
        const r = effective.get(c.id)?.reifegrad;
        if (r != null) {
          capturedW += w;
          num += w * r;
        }
      }
      ist = capturedW > 0 ? round1(num / capturedW) : 0;
    } else {
      // derived: Konformität, gedeckelt auf derivedCap (ja=cap · teilweise=cap/2 · nein=0).
      let num = 0;
      for (const c of b.controls) {
        const w = wOf(c.id);
        totalW += w;
        const s = effective.get(c.id)?.status ?? null;
        if (s === "na") continue;
        capturedW += w;
        if (s === "ja") num += w * derivedCap;
        else if (s === "teilweise") num += w * (derivedCap / 2);
      }
      ist = capturedW > 0 ? round1(num / capturedW) : 0;
    }

    const coverage = totalW > 0 ? capturedW / totalW : 0;
    const target = resolveTarget(targets, familyId);
    const gap = target != null ? round1(target - ist) : null;

    rows.push({
      familyId,
      ist,
      totalW,
      capturedW,
      group: {
        family: b.label,
        ist,
        target,
        gap,
        derived: !usesMaturity,
        count: b.controls.length,
        coverage: round3(coverage),
        confidence: confidenceOf(coverage),
      },
    });
  }

  // Deterministische Reihenfolge nach Label (wie V2).
  rows.sort((a, b) =>
    a.group.family.localeCompare(b.group.family, undefined, { numeric: true }),
  );

  // Overall: O = Σ (W_f·ist_f) / Σ W_f,  W_f = totalW_f · domain_weight_f.
  // no_data ≠ 0: Familien OHNE jede Erfassung (capturedW = 0, ist=0-Fiktion)
  // fallen aus dem Overall, statt ihn nach unten zu ziehen. Teilweise erfasste
  // Familien behalten ihr volles Gewicht (ist ist bereits nur über die erfassten
  // Kontrollen gemittelt) — so bleibt die V2≡V3-Identität erhalten.
  let wSum = 0;
  let wIst = 0;
  for (const r of rows) {
    if (r.capturedW <= 0) continue;
    const dw = domainWeights[r.familyId] ?? 1;
    const Wf = r.totalW * dw;
    wSum += Wf;
    wIst += Wf * r.ist;
  }
  const overall = wSum > 0 ? round1(wIst / wSum) : 0;

  return { groups: rows.map((r) => r.group), overall, derived: !usesMaturity };
}

/**
 * Reifegrad-Trend: kleinste-Quadrate-Gerade über die letzten ≤12 Punkte.
 *
 * x-Achse in Wochen seit dem ersten (berücksichtigten) Punkt ⇒ slope in
 * [Level/Woche]. `stderr` = Standardfehler der Steigung. `forecastDate` liefert
 * nur bei belastbarem Trend (slope > 2·stderr) das Datum, an dem `target`
 * erreicht wird (letztes Datum + (target − letzter Wert)/slope Wochen), sonst null.
 */
export function maturityTrend(
  points: { at: string; value: number }[],
  target?: number,
): { slope: number; stderr: number; forecastDate: string | null } {
  const pts = points
    .filter((p) => p && p.at != null && Number.isFinite(p.value))
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at)) // B-18: erst chronologisch sortieren
    .slice(-12);
  const n = pts.length;
  if (n < 2) return { slope: 0, stderr: 0, forecastDate: null };

  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const t0 = new Date(pts[0].at).getTime();
  const xs = pts.map((p) => (new Date(p.at).getTime() - t0) / WEEK_MS);
  const ys = pts.map((p) => p.value);

  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;

  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - mx) * (xs[i] - mx);
    sxy += (xs[i] - mx) * (ys[i] - my);
  }
  if (sxx === 0) return { slope: 0, stderr: 0, forecastDate: null };

  const slope = sxy / sxx;
  const intercept = my - slope * mx;

  // Reststreuung → Standardfehler der Steigung.
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const pred = intercept + slope * xs[i];
    sse += (ys[i] - pred) * (ys[i] - pred);
  }
  const stderr = n > 2 ? Math.sqrt(sse / (n - 2) / sxx) : 0;

  let forecastDate: string | null = null;
  if (target != null && slope > 2 * stderr && slope > 0) {
    const lastY = ys[n - 1];
    const lastDate = pts[n - 1].at.slice(0, 10);
    if (lastY >= target) {
      // Ziel bereits erreicht → kein Datum in der Vergangenheit extrapolieren.
      forecastDate = lastDate;
    } else {
      const weeksNeeded = (target - lastY) / slope;
      if (Number.isFinite(weeksNeeded) && weeksNeeded >= 0) {
        const lastT = new Date(pts[n - 1].at).getTime();
        forecastDate = new Date(lastT + weeksNeeded * WEEK_MS).toISOString().slice(0, 10);
      }
    }
  }

  return { slope, stderr, forecastDate };
}
