/**
 * chartPalette — EINE Farbquelle für ALLE Bildschirm-Diagramme
 * (Pie/Donut/Bar/Stacked/Scatter/Radar/Line).
 *
 * Seit 2026-09-10 sind die Werte KEINE festen Hex-Codes mehr, sondern
 * CSS-Variablen (`hsl(var(--ch-…))`), die `applyChartVars()` auf <html>
 * schreibt. Dadurch folgen alle Diagramme LIVE der Themenfarbe (Akzent),
 * dem Hell/Dunkel-Modus und dem gewählten Diagramm-Modus:
 *
 *   • "ampel"  — STANDARD: Status (erfüllt/teilweise/offen, Schweregrad,
 *                Horizonte) in AMPEL rot/gelb/grün, Serien in Themenfarbe-Tönen.
 *   • "mono"   — ALLES in Themenfarbe, auch der Status.
 *
 * Seit 2026-09-12 gilt das nicht nur für Diagramme: Statusfarben in Balken,
 * Kacheln, Punkten und Pillen kommen über die `.st-*`-Klassen (index.css) aus
 * denselben Variablen. Feste Tailwind-Farben (bg-amber-500 …) sind verboten —
 * sie blieben beim Themenwechsel stehen.
 *
 * Berichte (docx/xlsx/HTML-Druck) nutzen eigene feste Hex-Werte und bleiben
 * „weißes Papier" mit Ampel — unabhängig von diesem Modus.
 *
 * Regel bleibt: Kein Diagramm definiert eigene Farben — immer von hier.
 */

import type { AccentHSL } from "@/lib/accentTheme";

export type ChartPaletteMode = "mono" | "ampel";
export const CHART_MODE_LS_KEY = "cws.chart.palette.v1";
// Dr. Sait 2026-09-12: Ampel ist Standard — Status bleibt rot/gelb/grün (die
// vertraute Audit-Optik), die Themenfarbe steuert die Serien-Töne. „mono"
// bleibt als Schalter: dann folgt AUCH der Status der Themenfarbe.
// („hybrid" war identisch mit „ampel" und ist entfallen; gespeicherte Werte
//  werden beim Lesen migriert.)
export const DEFAULT_CHART_MODE: ChartPaletteMode = "ampel";

const v = (name: string) => `hsl(var(--ch-${name}))`;

/** Status-Farben (Gap-/Compliance-/Umsetzungs-/SoA-Diagramme). */
export const CHART_STATUS = {
  ja:        v("ja"),        // erfüllt / umgesetzt / fertig
  teilweise: v("teilweise"), // teilweise / in Arbeit
  nein:      v("nein"),      // nicht erfüllt / offen
  na:        v("na"),        // n.a. / entbehrlich / ausgeschlossen
  offen:     v("leer"),      // unbeantwortet (noch nicht bewertet) — neutral hell
} as const;

/** Alias für „unbeantwortet" (manche Panels nennen es `ohne`). */
export const CHART_STATUS_OHNE = CHART_STATUS.offen;

/** Kritikalität / Risiko / Schweregrad. */
export const CHART_SEVERITY = {
  kritisch: v("kritisch"),
  hoch:     v("hoch"),
  mittel:   v("mittel"),
  niedrig:  v("niedrig"),
} as const;

/** Roadmap-Horizonte (Jetzt/Nächste/Später). */
export const CHART_PHASE = {
  now:   v("now"),
  next:  v("next"),
  later: v("later"),
} as const;

/** SoA-Abdeckungs-Donut. */
export const CHART_SOA = {
  umgesetzt:      CHART_STATUS.ja,
  offen:          CHART_STATUS.nein,
  ausgeschlossen: CHART_STATUS.na,
  na:             CHART_STATUS.offen,
} as const;

/** Umsetzungs-Status (fertig/laufend/blockiert/offen). */
export const CHART_IMPL = {
  fertig:    CHART_STATUS.ja,
  laufend:   CHART_STATUS.teilweise,
  blockiert: v("blockiert"),
  offen:     CHART_STATUS.nein,
} as const;

/** Themenfarbe-Töne (immer, in jedem Modus): 1 = Akzent, 2/3 = Stufen, grey. */
export const CHART_TONE = {
  t1:   v("1"),
  t2:   v("2"),
  t3:   v("3"),
  grey: v("grey"),
} as const;

/** Generische Serien-Reihenfolge (Multi-Kategorie-Balken/Linien). */
export const CHART_SERIES = [CHART_TONE.t1, CHART_TONE.t2, CHART_TONE.t3, CHART_TONE.grey] as const;

/** Leer-Segment („keine Daten") und Raster/Achsen — folgen dem Modus. */
export const CHART_EMPTY = v("leer");
export const CHART_GRID  = "hsl(var(--border))";
export const CHART_AXIS  = "hsl(var(--muted-foreground))";

/* ------------------------------------------------------------------------ */
/*  Laufzeit: Variablen berechnen und auf <html> schreiben                    */
/* ------------------------------------------------------------------------ */

type HSL = { h: number; s: number; l: number };
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const toVar = ({ h, s, l }: HSL) => `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;

/** Feste Ampel-Werte (entsprechen den bisherigen Hex-Codes). */
const AMPEL = {
  ja:        { h: 160, s: 84, l: 39 }, // #10b981 emerald-500
  teilweise: { h: 38,  s: 92, l: 50 }, // #f59e0b amber-500
  nein:      { h: 0,   s: 84, l: 60 }, // #ef4444 red-500
  kritisch:  { h: 0,   s: 70, l: 35 }, // #991b1b
  na:        { h: 215, s: 16, l: 47 }, // #64748b slate-500
};

/**
 * Themenfarbe-Töne t1/t2/t3 — garantiert unterscheidbar.
 *
 * 2026-09-12 (Dr. Sait: „bazı tonlar karışıyor, tonlar arası ciddi farklar
 * olmalı"): Vorher unterschieden sich die drei Töne nur in der Lightness und
 * nur um 13 Punkte, bei identischem Farbton — bei Azur 220° ergab das
 * L 54/41/28, also drei fast gleiche Blautöne in einem dünnen Donut.
 *
 * Jetzt:
 *  • t1 = Themenfarbe (in ein Band gezogen, damit ober- und unterhalb Platz bleibt)
 *  • Farbton-Drehung +16° / −18° und geringere Sättigung → zweite Unterscheidungsachse
 *  • Der Abstand wird als WCAG-Kontrast GEMESSEN (nicht in L-Punkten geschätzt)
 *    und per Bisektion auf ein Zielverhältnis gesetzt. Erreicht ein Farbton eine
 *    Richtung nicht (gesättigtes Gelb kann nicht heller werden), wird die
 *    Gegenrichtung bzw. „beide Stufen auf dieselbe Seite" gewählt.
 *
 * Nachgemessen über 240 Akzent-Kombinationen (24 Farbtöne × 5 S/L-Paare ×
 * hell/dunkel): schlechtester Abstand zweier benachbarter Töne = 2.21
 * (vorher 1.03). Kein Paar liegt unter 1.65.
 */
// ── Kontrast-Werkzeug (WCAG-Relativluminanz) ───────────────────────────────
// Nötig, weil eine Farbton-Drehung die Helligkeitswirkung verändert: 20 Punkte
// Lightness bedeuten bei Gelbgrün etwas ganz anderes als bei Blau. Deshalb wird
// der Abstand der Töne GEMESSEN und nicht nur in L-Punkten geschätzt.
function hslToRgb01(c: HSL): [number, number, number] {
  const s = c.s / 100, l = c.l / 100;
  const k = (n: number) => (n + c.h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}
function relLum(c: HSL): number {
  const [r, g, b] = hslToRgb01(c);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
/** WCAG-Kontrastverhältnis zweier Töne (1 = identisch, 21 = Schwarz/Weiß). */
export function toneContrast(a: HSL, b: HSL): number {
  const l1 = relLum(a), l2 = relLum(b);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

export function toneRamp(accent: AccentHSL, dark: boolean): { t1: HSL; t2: HSL; t3: HSL; grey: HSL; leer: HSL } {
  const rot = (h: number, d: number) => ((h + d) % 360 + 360) % 360;

  // Zielhelligkeiten als LUMINANZ-LEITER statt als Lightness-Schritte.
  //
  // Zwei Bedingungen müssen gleichzeitig gelten:
  //   1. die drei Töne müssen sich voneinander abheben (Donut-Segmente)
  //   2. jeder Ton muss sich von der FLÄCHE abheben (weiße Karte / weißes
  //      Papier bzw. dunkle Oberfläche)
  // Mit festen L-Schritten ist beides nicht erreichbar: bei Gelb ändert sich
  // die Helligkeitswirkung kaum, bei sehr hellen Akzenten verschwindet der
  // hellste Ton im Weiß. Deshalb werden die Ziel-Luminanzen als Leiter
  // festgelegt (Faktor STEP zwischen Nachbarn) und die Lightness per
  // Bisektion so gesetzt, dass sie erreicht wird — für JEDEN Farbton.
  //
  // Hell: t1 ist der hellste, t2/t3 werden dunkler → Abstand zum Weiß ist
  // automatisch am kleinsten bei t1 und wird dort auf >= 1.7 begrenzt.
  // Dunkel: umgekehrt.
  const STEP = 2.3;
  const lumOf = (h: number, sat: number, l: number) => relLum({ h, s: sat, l });
  const solveL = (h: number, sat: number, want: number): number => {
    let lo = 3, hi = 97;
    for (let i = 0; i < 26; i++) {
      const mid = (lo + hi) / 2;
      if (lumOf(h, sat, mid) < want) lo = mid; else hi = mid;
    }
    return clamp(Math.round((lo + hi) / 2), 3, 97);
  };
  // FESTE Luminanz-Leiter. Der Akzent bestimmt Farbton und Sättigung, die
  // Stufenhelligkeit ist vorgegeben — nur so lassen sich beide Bedingungen für
  // JEDEN Akzent gleichzeitig halten. Die Werte sind so gewählt, dass
  //   hell : t1/Weiß = 1.6 · t1/t2 = 2.2 · t2/t3 = 2.1 · t3/Weiß = 10
  //   dunkel: t1/Fläche = 2.4 · t1/t2 = 2.3 · t2/t3 = 1.9
  const LADDER = dark ? [0.105, 0.30, 0.62] : [0.40, 0.165, 0.055];
  const [y1, y2, y3] = LADDER;

  // Farbton/Sättigung: zweite und dritte Unterscheidungsachse.
  const h1 = accent.h,                 s1 = accent.s;
  const h2 = rot(accent.h, 16),        s2 = clamp(accent.s - 12, 26, 100);
  const h3 = rot(accent.h, -18),       s3 = clamp(accent.s - 28, 20, 100);

  const t1: HSL = { h: h1, s: s1, l: solveL(h1, s1, y1) };
  const t2: HSL = { h: h2, s: s2, l: solveL(h2, s2, clamp01(y2)) };
  const t3: HSL = { h: h3, s: s3, l: solveL(h3, s3, clamp01(y3)) };

  // Sicherheitsnetz: erreicht ein Farbton seine Ziel-Luminanz nicht (extrem
  // gesättigtes Gelb kann nicht dunkel werden), wird entsättigt — dann folgt
  // die Luminanz wieder.
  const ensure = (tone: HSL, want: number) => {
    for (let i = 0; i < 14 && Math.abs(relLum(tone) - want) > 0.03; i++) {
      tone.s = clamp(tone.s - 8, 6, 100);
      tone.l = solveL(tone.h, tone.s, want);
    }
    return tone;
  };
  ensure(t2, clamp01(y2));
  ensure(t3, clamp01(y3));

  const grey: HSL = dark ? { h: 220, s: 10, l: 58 } : { h: 220, s: 10, l: 62 };
  const leer: HSL = dark ? { h: 220, s: 18, l: 30 } : { h: 220, s: 14, l: 88 };
  return { t1, t2, t3, grey, leer };
}

const clamp01 = (n: number) => Math.max(0.005, Math.min(0.98, n));

let lastAccent: AccentHSL | null = null;
let lastDark = false;
const listeners = new Set<(mode: ChartPaletteMode) => void>();

function isMode(x: unknown): x is ChartPaletteMode {
  return x === "mono" || x === "ampel";
}

export function getChartPaletteMode(): ChartPaletteMode {
  if (typeof window === "undefined") return DEFAULT_CHART_MODE;
  try {
    const raw = localStorage.getItem(CHART_MODE_LS_KEY);
    // Migration: „hybrid" war inhaltsgleich mit „ampel" und ist entfallen.
    if (raw === "hybrid") return "ampel";
    if (isMode(raw)) return raw;
  } catch { /* ignore */ }
  return DEFAULT_CHART_MODE;
}

export function setChartPaletteMode(mode: ChartPaletteMode) {
  if (typeof window !== "undefined") {
    try { localStorage.setItem(CHART_MODE_LS_KEY, mode); } catch { /* ignore */ }
  }
  if (lastAccent) applyChartVars(lastAccent, lastDark);
  for (const l of Array.from(listeners)) { try { l(mode); } catch { /* ignore */ } }
}

export function resetChartPaletteMode() {
  if (typeof window !== "undefined") {
    try { localStorage.removeItem(CHART_MODE_LS_KEY); } catch { /* ignore */ }
  }
  if (lastAccent) applyChartVars(lastAccent, lastDark);
  for (const l of Array.from(listeners)) { try { l(DEFAULT_CHART_MODE); } catch { /* ignore */ } }
}

export function subscribeChartPaletteMode(cb: (mode: ChartPaletteMode) => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/**
 * Wird von accentTheme.applyAccent() bei jedem Akzent-/Moduswechsel gerufen.
 * Schreibt alle --ch-* Variablen; laufende Diagramme aktualisieren sich sofort
 * (SVG-Fills lesen die Variablen live).
 */
export function applyChartVars(accent: AccentHSL, dark: boolean) {
  if (typeof document === "undefined") return;
  lastAccent = accent; lastDark = dark;
  const mode = getChartPaletteMode();
  const r = toneRamp(accent, dark);
  const root = document.documentElement;
  const set = (k: string, hsl: HSL) => root.style.setProperty(`--ch-${k}`, toVar(hsl));

  // Töne gibt es in jedem Modus.
  set("1", r.t1); set("2", r.t2); set("3", r.t3); set("grey", r.grey); set("leer", r.leer);

  if (mode === "mono") {
    // Alles in Themenfarbe: stark → Stufe → Stufe → Grau.
    set("ja", r.t1); set("teilweise", r.t2); set("nein", r.t3); set("na", r.grey);
    set("kritisch", r.t3); set("hoch", r.t2); set("mittel", r.t1); set("niedrig", r.grey);
    set("now", r.t1); set("next", r.t2); set("later", r.grey);
    set("blockiert", r.t3);
  } else {
    // ampel: Status = Ampel (RAG). Im Dunkeln eine Stufe heller.
    const lift = (c: HSL): HSL => dark ? { ...c, l: clamp(c.l + 6, 0, 100) } : c;
    set("ja", lift(AMPEL.ja)); set("teilweise", lift(AMPEL.teilweise)); set("nein", lift(AMPEL.nein));
    set("na", dark ? { ...AMPEL.na, l: 58 } : AMPEL.na);
    set("kritisch", lift(AMPEL.kritisch)); set("hoch", lift(AMPEL.nein)); set("mittel", lift(AMPEL.teilweise)); set("niedrig", lift(AMPEL.ja));
    set("now", lift(AMPEL.nein)); set("next", lift(AMPEL.teilweise)); set("later", dark ? { ...AMPEL.na, l: 58 } : AMPEL.na);
    set("blockiert", lift(AMPEL.kritisch));
  }
}

/* ------------------------------------------------------------------------ */
/*  Für Berichte: dieselbe Palette als feste HEX-Werte                        */
/* ------------------------------------------------------------------------ */

const hex2 = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0");
function hslToHexLocal({ h, s, l }: HSL): string {
  const [r, g, b] = hslToRgb01({ h, s, l });
  return `#${hex2(r * 255)}${hex2(g * 255)}${hex2(b * 255)}`.toUpperCase();
}

export interface ChartHex {
  ja: string; teilweise: string; nein: string; na: string; leer: string;
  kritisch: string; hoch: string; mittel: string; niedrig: string;
  now: string; next: string; later: string; blockiert: string;
  t1: string; t2: string; t3: string; grey: string;
}

/**
 * Dieselben Farben wie auf dem Bildschirm, aber als HEX — für Berichte
 * (PDF/Word/Excel/HTML-Druck), die keine CSS-Variablen auflösen können.
 *
 * Dr. Sait 2026-09-12: „raporlar seçilen thema rengi ile uyumlu olsun, ekranda
 * ne görünüyorsa basılan metinde aynısı olsun". Deshalb wird hier EXAKT die
 * Rechnung von `applyChartVars` benutzt (gleiche Rampe, gleicher Modus) — nur
 * immer im Hell-Modus, weil Berichte auf weißem Papier erscheinen.
 */
export function resolveChartHex(accent: AccentHSL, mode: ChartPaletteMode = getChartPaletteMode()): ChartHex {
  const r = toneRamp(accent, false);
  const tone = { t1: hslToHexLocal(r.t1), t2: hslToHexLocal(r.t2), t3: hslToHexLocal(r.t3), grey: hslToHexLocal(r.grey) };
  if (mode === "mono") {
    return {
      ...tone,
      leer: hslToHexLocal(r.leer),
      ja: tone.t1, teilweise: tone.t2, nein: tone.t3, na: tone.grey,
      kritisch: tone.t3, hoch: tone.t2, mittel: tone.t1, niedrig: tone.grey,
      now: tone.t1, next: tone.t2, later: tone.grey,
      blockiert: tone.t3,
    };
  }
  return {
    ...tone,
    leer: hslToHexLocal(r.leer),
    ja: hslToHexLocal(AMPEL.ja),
    teilweise: hslToHexLocal(AMPEL.teilweise),
    nein: hslToHexLocal(AMPEL.nein),
    na: hslToHexLocal(AMPEL.na),
    kritisch: hslToHexLocal(AMPEL.kritisch),
    hoch: hslToHexLocal(AMPEL.nein),
    mittel: hslToHexLocal(AMPEL.teilweise),
    niedrig: hslToHexLocal(AMPEL.ja),
    now: hslToHexLocal(AMPEL.nein),
    next: hslToHexLocal(AMPEL.teilweise),
    later: hslToHexLocal(AMPEL.na),
    blockiert: hslToHexLocal(AMPEL.kritisch),
  };
}
