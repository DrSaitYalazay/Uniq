/**
 * UniqSuite — sichtbarer Funktionsumfang (Sadeleştirme, 2026-10-04).
 *
 * UniqSuite ist die einfache Variante von CWS. Der Code aller Funktionen
 * bleibt im Repository; was hier nicht freigegeben ist, ist für Nutzer
 * unsichtbar (kein Menüpunkt, keine Route, keine Verlinkung, keine Auswahl).
 * Wieder einschalten = Eintrag hier ergänzen bzw. Schalter auf true setzen.
 */

/** Werkzeuge außerhalb der PDCA-Phasen, die im Menü erscheinen (Pfad-IDs aus phaseGroups). */
export const VISIBLE_TOOL_IDS = new Set<string>([
  "dashboard",
  "policies",
  "incidents",
  "suppliers",
  "ki-governance",
]);

/** Routen ausgeblendeter Werkzeuge — direkter Aufruf führt zum Dashboard. */
export const HIDDEN_TOOL_PATHS = new Set<string>([
  "/trainings",
  "/documents",
  "/procurement",
  "/tprm",
  "/datenschutz-cockpit",
  "/bcm",
  "/management-review",
  "/control-monitoring",
]);

/** Auswählbare Frameworks (DB-Codes). Alle anderen bleiben im Katalog, sind aber nicht wählbar. */
export const VISIBLE_FRAMEWORKS = ["NIS2", "ISO27001", "CRA", "AIACT", "ISO42001"] as const;
const VISIBLE_FW_SET = new Set<string>(VISIBLE_FRAMEWORKS);

export const isFrameworkVisible = (code: string | null | undefined): boolean =>
  !!code && VISIBLE_FW_SET.has(code);

/** Filtert eine Framework-Code-Liste (z. B. company_profiles.enabled_frameworks) auf das Sichtbare. */
export const visibleFrameworkCodes = <T extends string>(codes: readonly T[] | null | undefined): T[] =>
  (codes ?? []).filter((c) => isFrameworkVisible(c));

/** Einzelne Funktionen innerhalb sichtbarer Seiten. false = ausgeblendet. */
export const FEATURES = {
  /** Risikoanalyse: FAIR / quantitative Risikobewertung */
  fairQuant: false,
  /** SoA & Roadmap: Gantt-Darstellung */
  gantt: false,
  /** Gap-Analyse: Massenbearbeitung mehrerer Kontrollen */
  bulkAssessment: false,
  /** Gap-Analyse: Bewertung je Asset */
  assetAssessment: false,
} as const;

export const isToolPathHidden = (pathname: string): boolean => {
  for (const p of HIDDEN_TOOL_PATHS) if (pathname === p || pathname.startsWith(p + "/")) return true;
  return false;
};
