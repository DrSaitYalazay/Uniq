/**
 * documentCatalog — kuratierter Katalog gesetzlich/normativ erforderlicher
 * Dokumente für ISMS/Datenschutz. Dient als Vorlagenliste im Werkzeug
 * "Dokumenten-Lebenszyklus": statt eines leeren Eintrags wählt der Nutzer ein
 * konkretes Standarddokument mit Klasse, Rechtsgrundlage und Turnus.
 *
 * Klassen:
 *   einmalig    — Grundsatz-/Konzeptdokumente (stabil, selten geändert)
 *   register    — laufend gepflegte Verzeichnisse
 *   periodisch  — turnusmäßig zu wiederholende Nachweise/Prüfungen
 */

export type DocClass = "einmalig" | "register" | "periodisch";

export interface CatalogDoc {
  key: string;
  de: string;
  en: string;
  docClass: DocClass;
  basis: string;            // Rechts-/Normgrundlage
  intervalMonths?: number;  // empfohlener Turnus (nur periodisch)
  /**
   * Nur anzeigen, wenn eines dieser Frameworks aktiv ist (FrameworkKey).
   * Ohne Angabe: allgemeines ISMS-/Datenschutz-Dokument, immer sichtbar.
   */
  frameworks?: string[];
}

const AI = ["AIACT", "ISO42001"];

export const DOCUMENT_CATALOG: CatalogDoc[] = [
  // ── Einmalige / Grundsatzdokumente ──
  { key: "isms-policy",   docClass: "einmalig", basis: "ISO 27001 5.2",        de: "Informationssicherheitsleitlinie", en: "Information Security Policy" },
  { key: "isms-scope",    docClass: "einmalig", basis: "ISO 27001 4.3",        de: "ISMS-Geltungsbereich (Scope)", en: "ISMS Scope Statement" },
  { key: "soa",           docClass: "einmalig", basis: "ISO 27001 6.1.3 d)",   de: "Erklärung zur Anwendbarkeit (SoA)", en: "Statement of Applicability (SoA)" },
  { key: "risk-method",   docClass: "einmalig", basis: "ISO 27001 6.1.2",      de: "Risikobewertungsmethodik", en: "Risk Assessment Methodology" },
  { key: "risk-treatment",docClass: "einmalig", basis: "ISO 27001 6.1.3",      de: "Risikobehandlungsplan", en: "Risk Treatment Plan" },
  { key: "roles",         docClass: "einmalig", basis: "ISO 27001 5.3",        de: "Rollen & Verantwortlichkeiten (RACI)", en: "Roles & Responsibilities (RACI)" },
  { key: "classification",docClass: "einmalig", basis: "ISO 27001 A.5.12",     de: "Informationsklassifizierungs-Richtlinie", en: "Information Classification Policy" },
  { key: "bcm-manual",    docClass: "einmalig", basis: "ISO 22301 / BSI 200-4",de: "Notfallhandbuch (BCM)", en: "Business Continuity Manual" },
  { key: "crypto-policy", docClass: "einmalig", basis: "ISO 27001 A.8.24",     de: "Kryptografie-/Verschlüsselungskonzept", en: "Cryptography Policy" },

  // ── Lebende Register ──
  { key: "ropa",          docClass: "register", basis: "DSGVO Art. 30",        de: "Verzeichnis von Verarbeitungstätigkeiten (VVT)", en: "Records of Processing Activities (RoPA)" },
  { key: "asset-reg",     docClass: "register", basis: "ISO 27001 A.5.9",      de: "Asset-/Inventarverzeichnis", en: "Asset Inventory" },
  { key: "risk-reg",      docClass: "register", basis: "ISO 27001 6.1.2",      de: "Risikoregister", en: "Risk Register" },
  { key: "supplier-reg",  docClass: "register", basis: "ISO 27001 A.5.19",     de: "Lieferantenverzeichnis", en: "Supplier Register" },
  { key: "tom-reg",       docClass: "register", basis: "DSGVO Art. 32",        de: "Verzeichnis technischer & organisatorischer Maßnahmen (TOM)", en: "Register of Technical & Organizational Measures" },
  { key: "access-matrix", docClass: "register", basis: "ISO 27001 A.5.15",     de: "Berechtigungskonzept / Zugriffsmatrix", en: "Access Control Matrix" },
  { key: "incident-reg",  docClass: "register", basis: "ISO 27001 A.5.24 / NIS2 Art. 23", de: "Vorfallregister", en: "Incident Register" },
  { key: "breach-reg",    docClass: "register", basis: "DSGVO Art. 33 (5)",    de: "Verzeichnis von Datenschutzverletzungen", en: "Data Breach Register" },
  { key: "processor-reg", docClass: "register", basis: "DSGVO Art. 28",        de: "Auftragsverarbeiter-Verzeichnis", en: "Processor Register" },
  { key: "training-rec",  docClass: "register", basis: "ISO 27001 7.2",        de: "Schulungs-/Awareness-Nachweise", en: "Training Records" },
  { key: "vuln-reg",      docClass: "register", basis: "ISO 27001 A.8.8",      de: "Schwachstellen- & Patch-Register", en: "Vulnerability & Patch Register" },
  { key: "software-reg",  docClass: "register", basis: "BSI OPS.1.1.6",        de: "Verzeichnis freigegebener Software", en: "Approved Software Register" },

  // ── Periodisch-wiederkehrend ──
  { key: "internal-audit",docClass: "periodisch", intervalMonths: 12, basis: "ISO 27001 9.2",  de: "Internes ISMS-Audit", en: "Internal ISMS Audit" },
  { key: "mgmt-review",   docClass: "periodisch", intervalMonths: 12, basis: "ISO 27001 9.3",  de: "Management-Review", en: "Management Review" },
  { key: "risk-review",   docClass: "periodisch", intervalMonths: 12, basis: "ISO 27001 8.2",  de: "Wiederholung Risikobewertung", en: "Risk Assessment Review" },
  { key: "policy-review", docClass: "periodisch", intervalMonths: 12, basis: "ISO 27001 A.5.1",de: "Richtlinien-Review", en: "Policy Review" },
  { key: "bcm-exercise",  docClass: "periodisch", intervalMonths: 12, basis: "ISO 22301 8.5",  de: "Notfall-/BCM-Übung", en: "BCM Exercise / Drill" },
  { key: "pentest",       docClass: "periodisch", intervalMonths: 12, basis: "ISO 27001 A.8.8",de: "Penetrationstest", en: "Penetration Test" },
  { key: "awareness",     docClass: "periodisch", intervalMonths: 12, basis: "ISO 27001 7.3 / DSGVO Art. 39", de: "Security-/Datenschutz-Awareness-Schulung", en: "Security & Privacy Awareness Training" },
  { key: "backup-test",   docClass: "periodisch", intervalMonths: 6,  basis: "ISO 27001 A.8.13",de: "Backup-Wiederherstellungstest", en: "Backup Restore Test" },
  { key: "access-recert", docClass: "periodisch", intervalMonths: 6,  basis: "ISO 27001 A.5.18",de: "Rezertifizierung Zugriffsrechte", en: "Access Rights Recertification" },
  { key: "supplier-review",docClass:"periodisch", intervalMonths: 12, basis: "ISO 27001 A.5.22",de: "Lieferantenüberprüfung", en: "Supplier Review" },
  { key: "dpia-review",   docClass: "periodisch", intervalMonths: 12, basis: "DSGVO Art. 35",  de: "Überprüfung Datenschutz-Folgenabschätzung (DSFA)", en: "DPIA Review" },
  { key: "emergency-contacts", docClass: "periodisch", intervalMonths: 6, basis: "BSI 200-4", de: "Aktualisierung Notfallkontakte", en: "Emergency Contacts Update" },

  // ── Künstliche Intelligenz (KI-VO = VO (EU) 2024/1689 i. d. F. VO (EU) 2026/1744; ISO/IEC 42001:2023) ──
  // Einmalig / Grundsatz
  { key: "ki-policy",       docClass: "einmalig", frameworks: ["ISO42001"], basis: "ISO/IEC 42001 5.2, A.2.2",   de: "KI-Politik (AI Policy)", en: "AI Policy" },
  { key: "aims-scope",      docClass: "einmalig", frameworks: ["ISO42001"], basis: "ISO/IEC 42001 4.3",          de: "AIMS-Geltungsbereich", en: "AIMS Scope" },
  { key: "aims-soa",        docClass: "einmalig", frameworks: ["ISO42001"], basis: "ISO/IEC 42001 6.1.3",        de: "Erklärung zur Anwendbarkeit (AIMS, Anhang A)", en: "Statement of Applicability (AIMS, Annex A)" },
  { key: "ki-ziele",        docClass: "einmalig", frameworks: ["ISO42001"], basis: "ISO/IEC 42001 6.2",          de: "KI-Ziele", en: "AI Objectives" },
  { key: "ki-risk-method",  docClass: "einmalig", frameworks: ["ISO42001"], basis: "ISO/IEC 42001 6.1.2, 6.1.3", de: "KI-Risikobeurteilungs- und Behandlungsprozess", en: "AI Risk Assessment and Treatment Process" },
  { key: "ki-tech-doc",     docClass: "einmalig", frameworks: ["AIACT"],    basis: "KI-VO Art. 11, Anhang IV",   de: "Technische Dokumentation Hochrisiko-KI", en: "Technical Documentation (High-Risk AI)" },
  { key: "ki-anweisung",    docClass: "einmalig", frameworks: ["AIACT"],    basis: "KI-VO Art. 13",              de: "Gebrauchsanweisung (KI)", en: "Instructions for Use (AI)" },
  { key: "ki-konformitaet", docClass: "einmalig", frameworks: ["AIACT"],    basis: "KI-VO Art. 43, 47, 48",      de: "Konformitätsbewertung, EU-Konformitätserklärung & CE (KI)", en: "Conformity Assessment, EU Declaration & CE (AI)" },
  { key: "ki-qms",          docClass: "einmalig", frameworks: ["AIACT"],    basis: "KI-VO Art. 17",              de: "Qualitätsmanagementsystem Hochrisiko-KI", en: "Quality Management System (High-Risk AI)" },
  { key: "ki-aufsicht",     docClass: "einmalig", frameworks: ["AIACT"],    basis: "KI-VO Art. 14, 26 Abs. 2",   de: "Konzept menschliche Aufsicht", en: "Human Oversight Concept" },
  { key: "ki-pmm",          docClass: "einmalig", frameworks: ["AIACT"],    basis: "KI-VO Art. 72",              de: "Post-Market-Monitoring-Plan (KI)", en: "Post-Market Monitoring Plan (AI)" },
  { key: "ki-fria",         docClass: "einmalig", frameworks: ["AIACT"],    basis: "KI-VO Art. 27",              de: "Grundrechte-Folgenabschätzung (FRIA)", en: "Fundamental Rights Impact Assessment (FRIA)" },
  { key: "ki-eu-db",        docClass: "einmalig", frameworks: ["AIACT"],    basis: "KI-VO Art. 49, 71",          de: "Registrierung in der EU-Datenbank (KI)", en: "EU Database Registration (AI)" },
  { key: "ki-transparenz",  docClass: "einmalig", frameworks: ["AIACT"],    basis: "KI-VO Art. 50",              de: "Transparenzhinweise & Kennzeichnung KI-generierter Inhalte", en: "Transparency Notices & Marking of AI-Generated Content" },
  { key: "ki-art5",         docClass: "einmalig", frameworks: ["AIACT"],    basis: "KI-VO Art. 5 (Nachweis: interne Praxis)", de: "Prüfung verbotener KI-Praktiken (Art. 5)", en: "Prohibited AI Practices Check (Art. 5)" },
  { key: "ki-einstufung",   docClass: "einmalig", frameworks: ["AIACT"],    basis: "KI-VO Art. 6 Abs. 2–4, Anhang I/III", de: "Einstufungsnachweis Hochrisiko-KI (Art. 6)", en: "High-Risk Classification Record (Art. 6)" },
  { key: "ki-info-betroffene", docClass: "einmalig", frameworks: ["AIACT"], basis: "KI-VO Art. 26 Abs. 7, 11",   de: "Information Beschäftigte & Betroffene (KI)", en: "Information to Workers & Affected Persons (AI)" },

  // Lebende Register
  { key: "ki-register",     docClass: "register", frameworks: AI,           basis: "ISO/IEC 42001 A.4 / KI-VO Art. 6", de: "KI-Systemregister (KI-Inventar)", en: "AI System Register (AI Inventory)" },
  { key: "ki-risikomgmt",   docClass: "register", frameworks: ["AIACT"],    basis: "KI-VO Art. 9",               de: "Risikomanagementsystem Hochrisiko-KI", en: "Risk Management System (High-Risk AI)" },
  { key: "ki-logs",         docClass: "register", frameworks: ["AIACT"],    basis: "KI-VO Art. 12, 19, 26 Abs. 6", de: "Protokolle Hochrisiko-KI (Aufbewahrung mind. 6 Monate)", en: "High-Risk AI Logs (retention at least 6 months)" },
  { key: "ki-vorfaelle",    docClass: "register", frameworks: ["AIACT"],    basis: "KI-VO Art. 73",              de: "Register schwerwiegender KI-Vorfälle", en: "Serious AI Incident Register" },
  { key: "ki-kompetenz",    docClass: "register", frameworks: AI,           basis: "KI-VO Art. 4 / ISO/IEC 42001 7.2", de: "Nachweise KI-Kompetenz", en: "AI Literacy Records" },
  { key: "ki-daten",        docClass: "register", frameworks: AI,           basis: "KI-VO Art. 10 / ISO/IEC 42001 A.7", de: "Daten-Governance & Datensatzdokumentation", en: "Data Governance & Dataset Documentation" },
  { key: "ki-lieferanten",  docClass: "register", frameworks: ["ISO42001"], basis: "ISO/IEC 42001 A.10",         de: "KI-Lieferanten & Drittanbieter (inkl. GPAI-Modelle)", en: "AI Suppliers & Third Parties (incl. GPAI Models)" },

  // Periodisch
  { key: "ki-risk-assess",  docClass: "periodisch", intervalMonths: 12, frameworks: ["ISO42001"], basis: "ISO/IEC 42001 6.1.2, 8.2", de: "KI-Risikobeurteilung", en: "AI Risk Assessment" },
  { key: "ki-impact",       docClass: "periodisch", intervalMonths: 12, frameworks: ["ISO42001"], basis: "ISO/IEC 42001 6.1.4, 8.4", de: "KI-Systemauswirkungsabschätzung", en: "AI System Impact Assessment" },
  { key: "aims-audit",      docClass: "periodisch", intervalMonths: 12, frameworks: ["ISO42001"], basis: "ISO/IEC 42001 9.2",        de: "Internes AIMS-Audit", en: "Internal AIMS Audit" },
  { key: "aims-review",     docClass: "periodisch", intervalMonths: 12, frameworks: ["ISO42001"], basis: "ISO/IEC 42001 9.3",        de: "AIMS-Managementbewertung", en: "AIMS Management Review" },
  { key: "ki-monitoring",   docClass: "periodisch", intervalMonths: 6,  frameworks: AI,           basis: "KI-VO Art. 26 Abs. 5 / ISO/IEC 42001 A.6.2.6", de: "Überwachung von KI-Systemen im Betrieb", en: "Monitoring of AI Systems in Operation" },
];

/** Katalog für die aktiven Frameworks (FrameworkKeys). Leere Auswahl = alles. */
export function catalogForFrameworks(active: string[]): CatalogDoc[] {
  if (active.length === 0) return DOCUMENT_CATALOG;
  return DOCUMENT_CATALOG.filter(c => !c.frameworks || c.frameworks.some(f => active.includes(f)));
}
