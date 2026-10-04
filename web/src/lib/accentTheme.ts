/**
 * accentTheme — user-configurable accent color.
 *
 * Navy primary and neutral surfaces stay locked; only the accent /
 * turquoise-green highlight and the "gold-gradient" derive from this value.
 * We overwrite CSS variables at runtime on <html>, so every component that
 * already reads `--accent`, `--sidebar-primary`, `--gold-gradient`,
 * `--gold-gradient-text`, etc. picks up the change with zero re-render.
 */

import { applyChartVars } from "@/lib/chartPalette";

const LS_KEY = "uniq.accent.hsl.v2"; // v2: neuer Default Grün — alte Auswahl (Test) verwerfen

export interface AccentHSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/**
 * Default = MARKENFARBE (NIS2Suite-Bakır #CC7733) — identisch zu index.css
 * (`--accent-h:25; --accent-s:80%`) und zur Website cyberwerksuite.com.
 * Vorher stand hier Teal; da `applyAccent` die Werte als Inline-Style auf
 * <html> schreibt, hat das die Markenfarbe aus dem Stylesheet immer überstimmt.
 * Nutzer können den Akzent weiterhin frei wählen (AccentColorPicker) und mit
 * `resetAccent()` auf genau diesen Markenwert zurücksetzen.
 */
// NIS2Suite-Palette (2026-09-10): Bakır/Gold hsl(25 80% 50%) #CC7733.
// UniqSuite-Marke (2026-10-04): Navy + Weiß + Grün + Grau; Akzent = Grün hsl(152 62% 36%).
export const DEFAULT_ACCENT: AccentHSL = { h: 152, s: 62, l: 36 };

export const ACCENT_PRESETS: { label: string; hsl: AccentHSL }[] = [
  { label: "Grün (Marke)",   hsl: { h: 152, s: 62, l: 36 } },
  { label: "Bakır/Gold",     hsl: { h: 25, s: 80, l: 50 } },
  { label: "Azur #1463FF",   hsl: { h: 220, s: 100, l: 54 } }, // Dr. Sait 2026-09-10: künftiger Default-Kandidat
  { label: "Gold hell",      hsl: { h: 36,  s: 84, l: 50 } },
  { label: "Teal",           hsl: { h: 174, s: 72, l: 40 } },
  { label: "Forest",         hsl: { h: 145, s: 55, l: 30 } },
  { label: "Royal Blue",     hsl: { h: 220, s: 75, l: 45 } },
  { label: "Indigo",         hsl: { h: 245, s: 62, l: 50 } },
  { label: "Violet",         hsl: { h: 265, s: 60, l: 50 } },
  { label: "Magenta",        hsl: { h: 320, s: 65, l: 48 } },
  { label: "Rose",           hsl: { h: 350, s: 72, l: 50 } },
  { label: "Amber",          hsl: { h: 38,  s: 88, l: 48 } },
  { label: "Gold",           hsl: { h: 45,  s: 72, l: 48 } },
  { label: "Coral",          hsl: { h: 12,  s: 78, l: 52 } },
  { label: "Slate",          hsl: { h: 210, s: 20, l: 40 } },
];

const listeners = new Set<(hsl: AccentHSL) => void>();

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Hex ("#rgb", "#rrggbb", or without "#") → HSL. Returns null if invalid. */
export function hexToHsl(hex: string): AccentHSL | null {
  const raw = hex.trim().replace(/^#/, "");
  let full: string | null = null;
  if (/^[0-9a-f]{6}$/i.test(raw)) full = raw;
  else if (/^[0-9a-f]{3}$/i.test(raw)) full = raw.split("").map(c => c + c).join("");
  if (!full) return null;
  const m: RegExpMatchArray = [full, full] as unknown as RegExpMatchArray;
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/** HSL → "#rrggbb". */
export function hslToHex({ h, s, l }: AccentHSL): string {
  const S = s / 100;
  const L = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = S * Math.min(L, 1 - L);
  const f = (n: number) => {
    const c = L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function shift(hsl: AccentHSL, dh: number, ds: number, dl: number): AccentHSL {
  return {
    h: (hsl.h + dh + 360) % 360,
    s: clamp(hsl.s + ds, 0, 100),
    l: clamp(hsl.l + dl, 0, 100),
  };
}

function toVar({ h, s, l }: AccentHSL) {
  return `${h} ${s}% ${l}%`;
}

/** Apply the given accent to CSS variables on <html>. */
export function applyAccent(hsl: AccentHSL) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Core hue/saturation channels — index.css reads these in every rule that
  // used to hard-code the turquoise. Overwriting them repaints gradients,
  // shadows, upload zones, card frames, sidebar glow, etc.
  root.style.setProperty("--accent-h", String(hsl.h));
  root.style.setProperty("--accent-s", `${hsl.s}%`);
  // accent-2 = heller Gold-STARTSTOPP des Verlaufs (NIS2Suite: 40 90% 55%
  // → 25 80% 50%). Der Verlauf läuft also helles Gold → Akzent (Bakır).
  const c = shift(hsl, 15, 10, 5);
  root.style.setProperty("--accent-2-h", String(c.h));
  root.style.setProperty("--accent-2-s", `${c.s}%`);

  // Primary accent surface + text-on-accent stays white for contrast.
  root.style.setProperty("--accent", toVar(hsl));
  root.style.setProperty("--accent-foreground", "0 0% 100%");

  // Sidebar accent uses a slightly lighter tone.
  root.style.setProperty("--sidebar-primary", toVar(shift(hsl, 0, 0, 5)));
  root.style.setProperty("--sidebar-ring", toVar(hsl));

  // Secondary readable text (chart labels, chips). Im Dunkelmodus heller,
  // sonst wäre der abgedunkelte Ton auf Navy unlesbar (Inline-Style schlägt
  // die .dark-Regel in index.css).
  const dark = root.classList.contains("dark");
  root.style.setProperty("--secondary-readable", toVar(dark ? shift(hsl, 0, -10, 12) : shift(hsl, -5, -10, -8)));

  // "Gold" gradient (used across buttons, badges, sidebar frame, brand text).
  // ACHTUNG: Dieser Inline-Wert überstimmt --gold-gradient aus index.css —
  // beide MÜSSEN dieselbe Regel abbilden (NIS2Suite: helles Gold → Bakır).
  const start = c;                        // 40 90% 55% helles Gold
  const end = hsl;                        // 25 80% 50% Bakır (= Akzent)
  root.style.setProperty(
    "--gold-gradient",
    `linear-gradient(135deg, hsl(${toVar(start)}), hsl(${toVar(end)}))`,
  );

  // Diagramm-Variablen (--ch-*) folgen Akzent + Modus (siehe chartPalette.ts).
  try { applyChartVars(hsl, dark); } catch { /* ignore */ }

  for (const l of Array.from(listeners)) {
    try { l(hsl); } catch { /* ignore */ }
  }
}

/**
 * Frühere Marken-Defaults. Wer einen davon gespeichert hat, hat KEINE eigene
 * Wahl getroffen (z. B. „Zurücksetzen" geklickt oder den damaligen Default
 * angeklickt) → folgt automatisch dem aktuellen Marken-Default. Ohne diese
 * Liste blieb der Browser nach jedem Marken-Wechsel auf der alten Farbe hängen
 * (live gemessen 2026-09-10: LS hatte 36/84/50 → Gold statt Bakır).
 */
const LEGACY_BRAND_DEFAULTS: AccentHSL[] = [
  { h: 36, s: 84, l: 50 },  // Gold (09-05 … 09-10)
  { h: 28, s: 62, l: 45 },  // Copper #BA6E2C
  { h: 174, s: 72, l: 40 }, // Teal (Ur-Default)
];
const sameHsl = (a: AccentHSL, b: AccentHSL) => a.h === b.h && a.s === b.s && a.l === b.l;
/** Versionsstempel für bewusste Nutzerwahl (siehe getStoredAccent). */
const STORE_VERSION = 2;

export function getStoredAccent(): AccentHSL {
  if (typeof window === "undefined") return DEFAULT_ACCENT;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_ACCENT;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.h === "number" &&
      typeof parsed?.s === "number" &&
      typeof parsed?.l === "number"
    ) {
      const v = { h: parsed.h, s: parsed.s, l: parsed.l };
      // v2-Einträge stammen aus einer bewussten Nutzerwahl (Picker) und
      // werden IMMER respektiert — auch wenn die Farbe zufällig ein früherer
      // Marken-Default ist. Nur ALTE Einträge ohne Version werden einmalig
      // migriert: entsprachen sie einem früheren Default, war es keine Wahl.
      if (parsed.v === STORE_VERSION) return v;
      if (sameHsl(v, DEFAULT_ACCENT) || LEGACY_BRAND_DEFAULTS.some(d => sameHsl(d, v))) {
        try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
        return DEFAULT_ACCENT;
      }
      // Individuelle Altwahl → als v2 übernehmen (einmalig).
      try { localStorage.setItem(LS_KEY, JSON.stringify({ ...v, v: STORE_VERSION })); } catch { /* ignore */ }
      return v;
    }
  } catch { /* fall through */ }
  return DEFAULT_ACCENT;
}

export function setStoredAccent(hsl: AccentHSL) {
  if (typeof window !== "undefined") {
    // Bewusste Wahl → versioniert speichern; bleibt bis „Zurücksetzen" bestehen,
    // unabhängig von Hell/Dunkel-Wechseln oder künftigen Marken-Defaults.
    try { localStorage.setItem(LS_KEY, JSON.stringify({ h: hsl.h, s: hsl.s, l: hsl.l, v: STORE_VERSION })); } catch { /* ignore */ }
  }
  applyAccent(hsl);
}

export function resetAccent() {
  // Nicht den Default SPEICHERN, sondern die Wahl löschen — so folgt der
  // Browser auch künftigen Marken-Änderungen automatisch.
  if (typeof window !== "undefined") {
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
  }
  applyAccent(DEFAULT_ACCENT);
}

export function subscribeAccent(cb: (hsl: AccentHSL) => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** Call once at boot to apply the stored accent before first paint. */
export function bootstrapAccent() {
  applyAccent(getStoredAccent());
}

// Bei Hell/Dunkel-Wechsel (themeMode) die modusabhängigen Ableitungen neu
// setzen. Über ein DOM-Event, damit kein Import-Zyklus entsteht.
if (typeof window !== "undefined") {
  window.addEventListener("cws:thememode", () => applyAccent(getStoredAccent()));
}

/** Aktueller Akzent + heller Verlaufsstart als Hex (für Berichte/SVG ohne CSS-Variablen). */
export function currentAccentHexPair(): { accent: string; accent2: string } {
  const a = getStoredAccent();
  return { accent: hslToHex(a), accent2: hslToHex(shift(a, 15, 10, 5)) };
}
