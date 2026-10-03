/**
 * kiGovernance — Fachlogik des Werkzeugs KI-Governance (Register, Einstufung
 * nach KI-VO, Pflichtdokument-Set je Rolle und Klasse). Aus der Seite
 * herausgelöst, damit sie getestet werden kann.
 *
 * Rechtsstand: Verordnung (EU) 2024/1689 in der Fassung der Verordnung (EU)
 * 2026/1744 („Digital Omnibus on AI", ABl. 24.07.2026, in Kraft 27.07.2026).
 * Korrekturen vom 30.09.2026:
 *  - Hochrisiko-Pflichten gelten NICHT seit 02.08.2026. Anhang III: ab
 *    02.12.2027, Anhang I (Produkte): ab 02.08.2028. Die Seite meldete vorher
 *    „fehlende Pflichtdokumente sind jetzt ein Verstoß".
 *  - Die Grundrechte-Folgenabschätzung (Art. 27) ist eine Pflicht bestimmter
 *    BETREIBER (Einrichtungen des öffentlichen Rechts, Private mit öffentlichen
 *    Diensten, Anhang III Nr. 5 b/c) — nicht des Anbieters und nicht jedes
 *    Betreibers. Vorher: jedem Anbieter und jedem Betreiber zugewiesen.
 *  - Art. 4 (KI-Kompetenz) richtet sich an Anbieter und Betreiber, nicht an
 *    Einführer/Händler.
 *  - Art. 5: acht Verbote (vorher sechs, Social Scoring fälschlich nur „durch
 *    Behörden"), dazu das neue Verbot aus VO 2026/1744 (NCII/CSAM-Erzeugung,
 *    anwendbar ab 02.12.2026).
 */

export type Rolle = "anbieter" | "betreiber" | "einfuehrer" | "haendler";
export type Risikoklasse = "unannehmbar" | "hoch" | "begrenzt" | "minimal";
export type LifeStatus = "planung" | "entwicklung" | "betrieb" | "eingestellt";
export type DocStatus = "fehlt" | "entwurf" | "vorhanden";

/** Ein Eintrag im KI-Systemregister (Blob `ki-governance`). */
export interface KiSystem {
  id: string;
  name: string;
  zweck: string;
  rolle: Rolle;
  risikoklasse: Risikoklasse;
  gpai: boolean;
  status: LifeStatus;
  verantwortlicher: string;
  personenbezug: boolean;
  annexIII: string[];      // gewählte Anhang-III-Bereiche
  art5: string[];          // verbotene Praktiken (Art. 5)
  transparenzpflicht: boolean; // Art. 50 (Chatbot/Deepfake)
  /** Betreiber unter Art. 27 (FRIA-Pflicht). Optional → alte Einträge laden. */
  friaPflicht?: boolean;
  docStatus: Record<string, DocStatus>;
  // SoA-Prüfbericht C-5: Angaben je System für die Matrix System × Rolle × Kontrolle.
  /** Sichtbare System-ID (z. B. „KI-003"); leer → KI-001 … nach Reihenfolge. */
  kennung?: string;
  /** Version / Release des Systems, auf das sich die Bewertung bezieht. */
  version?: string;
  /** Datum der letzten Bewertung (YYYY-MM-DD). */
  bewertetAm?: string;
  /** Wer die Bewertung freigegeben hat. */
  freigegebenVon?: string;
  /** Nachweis-Links, eine Zeile je Link. */
  nachweise?: string;
}
export interface KiGovernanceState { systeme: KiSystem[] }
export const KI_TOOL_KEY = "ki-governance";
export const KI_LS_KEY = "cws-ki-governance";

export const ROLLE_META: Record<Rolle, { de: string; en: string }> = {
  anbieter: { de: "Anbieter", en: "Provider" }, betreiber: { de: "Betreiber", en: "Deployer" },
  einfuehrer: { de: "Einführer", en: "Importer" }, haendler: { de: "Händler", en: "Distributor" },
};
export const KLASSE_LABEL: Record<Risikoklasse, { de: string; en: string }> = {
  unannehmbar: { de: "Unannehmbar (verboten)", en: "Unacceptable (prohibited)" },
  hoch: { de: "Hochrisiko", en: "High-risk" },
  begrenzt: { de: "Begrenztes Risiko", en: "Limited risk" },
  minimal: { de: "Minimales Risiko", en: "Minimal risk" },
};
export const STATUS_LABEL: Record<LifeStatus, { de: string; en: string }> = {
  planung: { de: "Planung", en: "Planning" }, entwicklung: { de: "Entwicklung", en: "Development" },
  betrieb: { de: "Betrieb", en: "Operation" }, eingestellt: { de: "Eingestellt", en: "Retired" },
};
export const DOC_STATUS_LABEL: Record<DocStatus, { de: string; en: string }> = {
  fehlt: { de: "fehlt", en: "missing" }, entwurf: { de: "Entwurf", en: "draft" }, vorhanden: { de: "vorhanden", en: "available" },
};

/** Anwendungsbeginn laut Art. 113 KI-VO i. d. F. VO (EU) 2026/1744. */
export const AI_ACT_DATES = {
  verboteUndKompetenz: "2025-02-02",   // Art. 5, Art. 4
  gpai: "2025-08-02",                  // Kapitel V
  transparenz: "2026-08-02",           // Art. 50
  neueVerbote: "2026-12-02",           // Art. 5 neu (NCII/CSAM)
  hochrisikoAnhangIII: "2027-12-02",   // Art. 6 Abs. 2 / Anhang III
  hochrisikoAnhangI: "2028-08-02",     // Art. 6 Abs. 1 / Anhang I
} as const;

// Anhang III — acht Hochrisiko-Bereiche (Kurzform)
export const ANNEX_III: { id: string; de: string; en: string }[] = [
  { id: "biometrie", de: "Biometrie (Fernidentifizierung, Kategorisierung, Emotionserkennung)", en: "Biometrics (remote identification, categorisation, emotion recognition)" },
  { id: "kritis", de: "Kritische Infrastruktur (Sicherheitsbauteile)", en: "Critical infrastructure (safety components)" },
  { id: "bildung", de: "Allgemeine & berufliche Bildung (Zugang/Bewertung)", en: "Education & vocational training (access/assessment)" },
  { id: "beschaeftigung", de: "Beschäftigung, Personalmanagement, Zugang zu Selbstständigkeit", en: "Employment, workers management, access to self-employment" },
  { id: "grundleistungen", de: "Zugang zu wesentlichen privaten/öffentlichen Diensten (Kredit, Sozialleistungen, Versicherung, Notrufe)", en: "Access to essential private/public services (credit, benefits, insurance, emergency calls)" },
  { id: "strafverfolgung", de: "Strafverfolgung", en: "Law enforcement" },
  { id: "migration", de: "Migration, Asyl, Grenzkontrolle", en: "Migration, asylum, border control" },
  { id: "justiz", de: "Rechtspflege und demokratische Prozesse", en: "Administration of justice and democratic processes" },
];

// Art. 5 — verbotene Praktiken
export const ART5: { id: string; de: string; en: string; ab?: string }[] = [
  { id: "manipulation", de: "Unterschwellige/manipulative Techniken mit erheblichem Schaden (Art. 5 Abs. 1 a)", en: "Subliminal/manipulative techniques causing significant harm (Art. 5(1)(a))" },
  { id: "ausnutzung", de: "Ausnutzung von Schutzbedürftigkeit – Alter, Behinderung, soziale/wirtschaftliche Lage (b)", en: "Exploiting vulnerabilities – age, disability, social/economic situation (b)" },
  { id: "social_scoring", de: "Social Scoring mit ungerechtfertigter Benachteiligung (c)", en: "Social scoring leading to unjustified detrimental treatment (c)" },
  { id: "predictive_policing", de: "Vorhersage von Straftaten allein auf Basis von Profiling (d)", en: "Predicting criminal offences based solely on profiling (d)" },
  { id: "scraping", de: "Ungezieltes Auslesen von Gesichtsbildern für Gesichtsdatenbanken (e)", en: "Untargeted scraping of facial images for facial recognition databases (e)" },
  { id: "emotion", de: "Emotionserkennung am Arbeitsplatz / in Bildungseinrichtungen (f)", en: "Emotion recognition in the workplace / education (f)" },
  { id: "biometrische_kategorisierung", de: "Biometrische Kategorisierung nach sensiblen Merkmalen (g)", en: "Biometric categorisation by sensitive attributes (g)" },
  { id: "biometrie_echtzeit", de: "Biometrische Echtzeit-Fernidentifizierung im öffentlichen Raum zur Strafverfolgung (h)", en: "Real-time remote biometric identification in public spaces for law enforcement (h)" },
  { id: "ncii_csam", de: "Erzeugung nicht einvernehmlicher intimer Bilder oder von Darstellungen sexuellen Kindesmissbrauchs (neu, VO 2026/1744)", en: "Generating non-consensual intimate imagery or child sexual abuse material (new, Reg. 2026/1744)", ab: AI_ACT_DATES.neueVerbote },
];

export const DOC_LABELS: Record<string, { de: string; en: string }> = {
  D25: { de: "KI-Systemregister", en: "AI system register" },
  D26: { de: "Grundrechte-Folgenabschätzung (FRIA, Art. 27)", en: "Fundamental rights impact assessment (FRIA, Art. 27)" },
  D27: { de: "Technische Dokumentation (Art. 11, Anhang IV)", en: "Technical documentation (Art. 11, Annex IV)" },
  D28: { de: "Konformitätsbewertung, EU-Konformitätserklärung + CE", en: "Conformity assessment, EU declaration + CE" },
  D29: { de: "Post-Market-Monitoring (Art. 72)", en: "Post-market monitoring (Art. 72)" },
  D60: { de: "Daten-Governance (Art. 10)", en: "Data governance (Art. 10)" },
  D61: { de: "EU-Datenbank-Registrierung (Art. 49)", en: "EU database registration (Art. 49)" },
  D62: { de: "Gebrauchsanweisung (Art. 13)", en: "Instructions for use (Art. 13)" },
  D63: { de: "Menschliche Aufsicht (Art. 14 / 26)", en: "Human oversight (Art. 14 / 26)" },
  D73: { de: "Qualitätsmanagementsystem (Art. 17)", en: "Quality management system (Art. 17)" },
  D21: { de: "Datenschutz-Folgenabschätzung (Art. 35 DSGVO)", en: "Data protection impact assessment (GDPR Art. 35)" },
  SCHULUNG: { de: "KI-Kompetenz-Maßnahmen (Art. 4)", en: "AI literacy measures (Art. 4)" },
  TRANSP: { de: "Transparenz/Kennzeichnung (Art. 50)", en: "Transparency/marking (Art. 50)" },
  INFO: { de: "Information Beschäftigte und Betroffene (Art. 26 Abs. 7, 11)", en: "Informing workers and affected persons (Art. 26(7), (11))" },
};

export function klassifiziere(annexIII: string[], art5: string[], transparenz: boolean): Risikoklasse {
  if (art5.length > 0) return "unannehmbar";
  if (annexIII.length > 0) return "hoch";
  if (transparenz) return "begrenzt";
  return "minimal";
}

export interface PflichtOptionen {
  transparenz: boolean;
  /** Betreiber fällt unter Art. 27 (öffentliche Stelle, öffentliche Dienste oder Anhang III Nr. 5 b/c). */
  friaPflicht?: boolean;
  /** Verarbeitung personenbezogener Daten → DSFA prüfen (Art. 26 Abs. 9 KI-VO, Art. 35 DSGVO). */
  personenbezug?: boolean;
}

/** Pflichtdokument-Set je Rolle und Klasse. */
export function pflichtDocs(rolle: Rolle, klasse: Risikoklasse, opt: PflichtOptionen): string[] {
  if (klasse === "unannehmbar") return ["D25"]; // verboten — nur dokumentieren, dass eingestellt
  const set: string[] = ["D25"];
  const kompetenz = rolle === "anbieter" || rolle === "betreiber"; // Art. 4
  if (klasse === "hoch") {
    if (rolle === "anbieter") set.push("D27", "D28", "D29", "D60", "D61", "D62", "D63", "D73");
    else if (rolle === "betreiber") {
      set.push("D63");
      // Art. 26 Abs. 7 (Beschäftigte/Arbeitnehmervertretung) und Abs. 11 (Betroffene
      // eines Anhang-III-Systems) — Katalogkontrolle AIACT-E-08 (SoA-Prüfbericht 02.10.2026).
      set.push("INFO");
      if (opt.friaPflicht) set.push("D26");
      if (opt.personenbezug) set.push("D21");
    } else set.push("D28", "D62"); // Einführer/Händler: Vorliegen prüfen (Art. 23/24)
  }
  if (kompetenz) set.push("SCHULUNG");
  if (opt.transparenz && (rolle === "anbieter" || rolle === "betreiber")) set.push("TRANSP");
  return set;
}

/** Tage bis zu einem ISO-Datum (negativ = seit). */
export function tageBis(iso: string, jetzt: Date = new Date()): number {
  return Math.ceil((new Date(iso + "T00:00:00Z").getTime() - jetzt.getTime()) / 86400_000);
}

/** Pflichtdokumente eines Registereintrags. */
export function docsForSystem(s: Pick<KiSystem, "rolle" | "risikoklasse" | "transparenzpflicht" | "friaPflicht" | "personenbezug">): string[] {
  return pflichtDocs(s.rolle, s.risikoklasse, { transparenz: s.transparenzpflicht, friaPflicht: !!s.friaPflicht, personenbezug: s.personenbezug });
}
