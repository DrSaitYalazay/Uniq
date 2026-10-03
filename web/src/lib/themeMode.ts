/**
 * themeMode — Hell/Dunkel-Modus (analog zu accentTheme).
 *
 * Tailwind läuft mit `darkMode: ["class"]`; index.css definiert `.dark { … }`.
 * Hier wird die Klasse auf <html> gesetzt, der Wunsch des Nutzers in
 * localStorage gehalten und bei „system" die OS-Einstellung live verfolgt.
 *
 * Default = "light" (Markenoptik wie cyberwerksuite.com). Nutzer können
 * dunkel oder „system" wählen und mit resetThemeMode() zurück.
 *
 * index.html enthält ein kleines Pre-Paint-Skript mit derselben Logik
 * (gleicher LS_KEY!), damit die Seite nicht erst hell aufblitzt.
 */

export type ThemeMode = "light" | "dark" | "system";

export const THEME_LS_KEY = "cws.theme.mode.v1";
export const DEFAULT_THEME_MODE: ThemeMode = "light";

const listeners = new Set<(mode: ThemeMode, dark: boolean) => void>();
let mql: MediaQueryList | null = null;
let mqlHandler: ((e: MediaQueryListEvent) => void) | null = null;

function isMode(v: unknown): v is ThemeMode {
  return v === "light" || v === "dark" || v === "system";
}

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_THEME_MODE;
  try {
    const raw = localStorage.getItem(THEME_LS_KEY);
    if (isMode(raw)) return raw;
  } catch { /* ignore */ }
  return DEFAULT_THEME_MODE;
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  try { return window.matchMedia("(prefers-color-scheme: dark)").matches; } catch { return false; }
}

/** Effektiv dunkel? (löst „system" auf) */
export function resolveDark(mode: ThemeMode): boolean {
  return mode === "dark" || (mode === "system" && systemPrefersDark());
}

export function isDarkActive(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function paint(dark: boolean) {
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  // Native Controls (Scrollbar, <select>, Datepicker) folgen mit.
  root.style.colorScheme = dark ? "dark" : "light";
}

/** Modus anwenden (ohne zu speichern). */
export function applyThemeMode(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const dark = resolveDark(mode);
  paint(dark);

  // OS-Wechsel nur im Modus „system" verfolgen.
  if (mql && mqlHandler) { try { mql.removeEventListener("change", mqlHandler); } catch { /* ignore */ } }
  mql = null; mqlHandler = null;
  if (mode === "system" && window.matchMedia) {
    try {
      mql = window.matchMedia("(prefers-color-scheme: dark)");
      mqlHandler = (e) => { paint(e.matches); emit("system", e.matches); };
      mql.addEventListener("change", mqlHandler);
    } catch { /* ignore */ }
  }
  emit(mode, dark);
}

function emit(mode: ThemeMode, dark: boolean) {
  for (const l of Array.from(listeners)) {
    try { l(mode, dark); } catch { /* ignore */ }
  }
  // accentTheme hört hierauf und rechnet modusabhängige Ableitungen neu.
  try { window.dispatchEvent(new CustomEvent("cws:thememode", { detail: { mode, dark } })); } catch { /* ignore */ }
}

export function setStoredThemeMode(mode: ThemeMode) {
  if (typeof window !== "undefined") {
    try { localStorage.setItem(THEME_LS_KEY, mode); } catch { /* ignore */ }
  }
  applyThemeMode(mode);
}

export function resetThemeMode() {
  setStoredThemeMode(DEFAULT_THEME_MODE);
}

/** Schnellumschalter (Header): hell ⇄ dunkel. Aus „system" heraus wird das
 *  Gegenteil des aktuell sichtbaren Zustands gewählt. */
export function toggleThemeMode() {
  setStoredThemeMode(isDarkActive() ? "light" : "dark");
}

export function subscribeThemeMode(cb: (mode: ThemeMode, dark: boolean) => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** Einmal beim Start (vor dem ersten Paint) aufrufen. */
export function bootstrapThemeMode() {
  applyThemeMode(getStoredThemeMode());
}

/**
 * Berichte/Exports werden immer in HELLER Optik erzeugt (weißes Papier).
 * Führt `fn` vorübergehend ohne `.dark` aus und stellt den Zustand danach
 * exakt wieder her. getComputedStyle ist synchron → keine Flackerphase.
 */
export function withLightTheme<T>(fn: () => T): T {
  if (typeof document === "undefined") return fn();
  const root = document.documentElement;
  const wasDark = root.classList.contains("dark");
  const prevScheme = root.style.colorScheme;
  if (wasDark) { root.classList.remove("dark"); root.style.colorScheme = "light"; }
  try {
    return fn();
  } finally {
    if (wasDark) { root.classList.add("dark"); root.style.colorScheme = prevScheme || "dark"; }
  }
}

/**
 * Asynchrone Variante — hält den hellen Modus, BIS die Zusage erfüllt ist.
 *
 * Warum nötig: `withLightTheme` stellt den Dunkelmodus im `finally` sofort
 * wieder her. Eine asynchrone Aufnahme (html2canvas) läuft danach weiter und
 * fotografiert dann doch den dunklen Bildschirm — im Bericht landen dunkle
 * Kacheln auf weißem Papier. Diese Fassung wartet ab.
 */
export async function withLightThemeAsync<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof document === "undefined") return fn();
  const root = document.documentElement;
  const wasDark = root.classList.contains("dark");
  const prevScheme = root.style.colorScheme;
  if (wasDark) { root.classList.remove("dark"); root.style.colorScheme = "light"; }
  try {
    return await fn();
  } finally {
    if (wasDark) { root.classList.add("dark"); root.style.colorScheme = prevScheme || "dark"; }
  }
}
