/**
 * Report Theme — Single source of truth for ALL PDF/Word/HTML reports.
 *
 * Navy (brand primary) is FIXED. The accent family (formerly copper/gold)
 * and the chart palette derive from the user-selected accent color so that
 * every PDF/Word/HTML export re-themes automatically when the user changes
 * the accent in the sidebar.
 *
 * RT / RGB are exported as live objects: their properties are mutated in
 * place whenever the accent changes. Existing `import { RT, RGB } from ...`
 * call sites keep working — they read the current values at generation time.
 */

import {
  DEFAULT_ACCENT,
  getStoredAccent,
  hslToHex,
  subscribeAccent,
  type AccentHSL,
} from "./accentTheme";
import {
  resolveChartHex,
  subscribeChartPaletteMode,
  getChartPaletteMode,
  type ChartHex,
} from "./chartPalette";

// ─── HSL helpers ────────────────────────────────────────────────────────────
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const shift = (hsl: AccentHSL, dh: number, ds: number, dl: number): AccentHSL => ({
  h: (hsl.h + dh + 360) % 360,
  s: clamp(hsl.s + ds, 0, 100),
  l: clamp(hsl.l + dl, 0, 100),
});

export const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

// ─── Fixed navy + neutrals + severity (never change with accent) ────────────
const FIXED = {
  navy:        "#143264",
  navyDeep:    "#112754",
  navyLight:   "#1A3366",

  ink:         "#1A202C",
  inkSoft:     "#2D3748",
  body:        "#4A5568",
  muted:       "#718096",
  border:      "#DBE3EF",
  surface:     "#F8FAFC",
  surfaceAlt:  "#F5F7FA",
  white:       "#FFFFFF",

  critical:    "#7F1D1D",
  criticalBg:  "#FEE2E2",
  high:        "#9A3412",
  highBg:      "#FFEDD5",
  medium:      "#854D0E",
  mediumBg:    "#FEF9C3",
  low:         "#14532D",
  lowBg:       "#DCFCE7",
  info:        "#1E40AF",
  infoBg:      "#DBEAFE",
  warning:     "#78350F",
  warningBg:   "#FEF3C7",
} as const;

// ─── Accent-derived palette ────────────────────────────────────────────────
function derive(accent: AccentHSL) {
  // Primary accent (replaces copper) — clamp lightness for print legibility
  const copper      = shift(accent, 0, 0, Math.max(0, 45 - accent.l) + (accent.l > 55 ? 55 - accent.l : 0));
  const copperNorm  = { ...accent, l: clamp(accent.l, 35, 55) };
  const copperLight = shift(copperNorm, -10, 0, 8);

  // Chart palette: navy fixed, then a cohesive spread anchored on the accent.
  const chartA = FIXED.navy;
  const chartB = hslToHex(copperNorm);
  const chartC = hslToHex(shift(copperNorm, 40,  -10, 0));
  const chartD = hslToHex(shift(copperNorm, -40, -10, 5));
  const chartE = hslToHex(shift(copperNorm, 80,  -5,  5));
  const chartF = hslToHex(shift(copperNorm, -80, -10, -5));

  return {
    copper:      hslToHex(copperNorm),
    copperLight: hslToHex(copperLight),
    chartA, chartB, chartC, chartD, chartE, chartF,
  };
}

// ─── Live RT (mutated in place on accent change) ────────────────────────────
export const RT = {
  ...FIXED,
  copper:      "",
  copperLight: "",
  chartA:      FIXED.navy,
  chartB:      "",
  chartC:      "",
  chartD:      "",
  chartE:      "",
  chartF:      "",
  // Statusfarben und Themen-Töne — IDENTISCH zum Bildschirm.
  // Dr. Sait 2026-09-12: „ekranda ne görünüyorsa basılan metinde aynısı olsun".
  // Quelle ist `resolveChartHex()` aus chartPalette (gleiche Rampe, gleicher
  // Modus). Im Modus „ampel" sind das rot/gelb/grün, im Modus „mono" die
  // Themenfarbe-Töne — genau wie in der Anwendung.
  stJa:        "", stTeilweise: "", stNein: "", stNa: "", stLeer: "",
  // Açık zeminler (kâğıt için beyazla karıştırılmış): satır vurgusu, bilgi kutusu.
  stJaBg:      "", stTeilweiseBg: "", stNeinBg: "", stNaBg: "", stKritischBg: "",
  stKritisch:  "", stHoch: "", stMittel: "", stNiedrig: "",
  stNow:       "", stNext: "", stLater: "", stBlockiert: "",
  tone1:       "", tone2: "", tone3: "", toneGrey: "",
} as {
  -readonly [K in keyof typeof FIXED]: (typeof FIXED)[K];
} & {
  copper: string; copperLight: string;
  chartA: string; chartB: string; chartC: string;
  chartD: string; chartE: string; chartF: string;
  stJa: string; stTeilweise: string; stNein: string; stNa: string; stLeer: string;
  stJaBg: string; stTeilweiseBg: string; stNeinBg: string; stNaBg: string; stKritischBg: string;
  stKritisch: string; stHoch: string; stMittel: string; stNiedrig: string;
  stNow: string; stNext: string; stLater: string; stBlockiert: string;
  tone1: string; tone2: string; tone3: string; toneGrey: string;
};

// ─── Live RGB (mutated in place on accent change) ───────────────────────────
type RgbTriple = [number, number, number];
export const RGB = {
  navy:        hexToRgb(FIXED.navy),
  navyDeep:    hexToRgb(FIXED.navyDeep),
  copper:      [0, 0, 0] as RgbTriple,
  copperLight: [0, 0, 0] as RgbTriple,
  ink:         hexToRgb(FIXED.ink),
  inkSoft:     hexToRgb(FIXED.inkSoft),
  body:        hexToRgb(FIXED.body),
  muted:       hexToRgb(FIXED.muted),
  border:      hexToRgb(FIXED.border),
  surface:     hexToRgb(FIXED.surface),
  surfaceAlt:  hexToRgb(FIXED.surfaceAlt),
  white:       hexToRgb(FIXED.white),
  critical:    hexToRgb(FIXED.critical),
  criticalBg:  hexToRgb(FIXED.criticalBg),
  high:        hexToRgb(FIXED.high),
  highBg:      hexToRgb(FIXED.highBg),
  medium:      hexToRgb(FIXED.medium),
  mediumBg:    hexToRgb(FIXED.mediumBg),
  low:         hexToRgb(FIXED.low),
  lowBg:       hexToRgb(FIXED.lowBg),
  warning:     hexToRgb(FIXED.warning),
  warningBg:   hexToRgb(FIXED.warningBg),
  // Statusfarben (wie Bildschirm) — für jsPDF/docx, die RGB brauchen.
  stJa:        [0, 0, 0] as RgbTriple,
  stTeilweise: [0, 0, 0] as RgbTriple,
  stNein:      [0, 0, 0] as RgbTriple,
  stNa:        [0, 0, 0] as RgbTriple,
  stLeer:      [0, 0, 0] as RgbTriple,
  tone1:       [0, 0, 0] as RgbTriple,
  tone2:       [0, 0, 0] as RgbTriple,
  tone3:       [0, 0, 0] as RgbTriple,
};

/** HEX'i beyazla karıştır — rapor kâğıdı için açık zemin üretir. */
function mixWhite(hex: string, pct: number): string {
  const [r, g, b] = hexToRgb(hex);
  const m = (c: number) => Math.round(c + (255 - c) * pct);
  const h2 = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h2(m(r))}${h2(m(g))}${h2(m(b))}`.toUpperCase();
}

// ─── Sync function: recomputes RT/RGB from an accent HSL ────────────────────
function syncReportTheme(accent: AccentHSL) {
  const d = derive(accent);
  RT.copper      = d.copper;
  RT.copperLight = d.copperLight;
  RT.chartA      = d.chartA;
  RT.chartB      = d.chartB;
  RT.chartC      = d.chartC;
  RT.chartD      = d.chartD;
  RT.chartE      = d.chartE;
  RT.chartF      = d.chartF;

  RGB.copper      = hexToRgb(d.copper);
  RGB.copperLight = hexToRgb(d.copperLight);

  // Statusfarben/Töne vom Bildschirm übernehmen (Hell-Variante = weißes Papier).
  const ch: ChartHex = resolveChartHex(accent, getChartPaletteMode());
  RT.stJa = ch.ja; RT.stTeilweise = ch.teilweise; RT.stNein = ch.nein;
  RT.stNa = ch.na; RT.stLeer = ch.leer;
  RT.stKritisch = ch.kritisch; RT.stHoch = ch.hoch; RT.stMittel = ch.mittel; RT.stNiedrig = ch.niedrig;
  RT.stNow = ch.now; RT.stNext = ch.next; RT.stLater = ch.later; RT.stBlockiert = ch.blockiert;
  RT.tone1 = ch.t1; RT.tone2 = ch.t2; RT.tone3 = ch.t3; RT.toneGrey = ch.grey;
  RT.stJaBg = mixWhite(ch.ja, 0.90); RT.stTeilweiseBg = mixWhite(ch.teilweise, 0.90);
  RT.stNeinBg = mixWhite(ch.nein, 0.90); RT.stNaBg = mixWhite(ch.na, 0.92);
  RT.stKritischBg = mixWhite(ch.kritisch, 0.88);
  RGB.stJa = hexToRgb(ch.ja); RGB.stTeilweise = hexToRgb(ch.teilweise);
  RGB.stNein = hexToRgb(ch.nein); RGB.stNa = hexToRgb(ch.na); RGB.stLeer = hexToRgb(ch.leer);
  RGB.tone1 = hexToRgb(ch.t1); RGB.tone2 = hexToRgb(ch.t2); RGB.tone3 = hexToRgb(ch.t3);

  // Also keep severityStyle rgb refs current (they reference FIXED — no-op,
  // but leave hook for future accent-tinted severity if requested).
}

// Bootstrap immediately so first report render has correct values.
syncReportTheme(typeof window !== "undefined" ? getStoredAccent() : DEFAULT_ACCENT);

if (typeof window !== "undefined") {
  subscribeAccent(syncReportTheme);
  // Wechselt der Nutzer den Diagramm-Modus (Ampel ↔ Themenfarbe), müssen die
  // Berichte mitgehen — sonst zeigt der Bildschirm Themenfarbe und das PDF Ampel.
  subscribeChartPaletteMode(() => syncReportTheme(getStoredAccent()));
}

// ─── Typography scale (used as guideline for all reports) ───────────────────
export const RT_TYPE = {
  pdf: {
    coverTitle:  28,
    coverSub:    14,
    h1:          18,
    h2:          14,
    h3:          12,
    body:        10,
    small:       9,
    caption:     8,
    micro:       7,
  },
  html: {
    coverTitle:  "34px",
    coverSub:    "18px",
    h1:          "24px",
    h2:          "18px",
    h3:          "15px",
    body:        "13.5px",
    small:       "12.5px",
    caption:     "11.5px",
  },
} as const;

// ─── Layout constants ───────────────────────────────────────────────────────
export const RT_LAYOUT = {
  pageMarginMm: 15,
  contentRadius: 8,
  hairline: 0.4,
  ruleBold: 0.8,
} as const;

// ─── Severity badge style helper (HTML + jsPDF) ─────────────────────────────
export type SeverityKey = "critical" | "high" | "medium" | "low";

export const severityStyle = {
  critical: { fg: FIXED.critical, bg: FIXED.criticalBg, rgb: hexToRgb(FIXED.critical), bgRgb: hexToRgb(FIXED.criticalBg) },
  high:     { fg: FIXED.high,     bg: FIXED.highBg,     rgb: hexToRgb(FIXED.high),     bgRgb: hexToRgb(FIXED.highBg) },
  medium:   { fg: FIXED.medium,   bg: FIXED.mediumBg,   rgb: hexToRgb(FIXED.medium),   bgRgb: hexToRgb(FIXED.mediumBg) },
  low:      { fg: FIXED.low,      bg: FIXED.lowBg,      rgb: hexToRgb(FIXED.low),      bgRgb: hexToRgb(FIXED.lowBg) },
} as const;

// ─── Font family constants ──────────────────────────────────────────────────
export const RT_FONT = {
  pdf: "helvetica" as const,
  word: "Arial" as const,
  html: "Helvetica, Arial, sans-serif",
} as const;
