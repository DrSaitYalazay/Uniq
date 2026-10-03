/**
 * domainLabels — human-readable descriptions for radar-axis grouping keys.
 *
 * The dashboard radar groups controls into "domains" (Annex, Chapter, Function…)
 * per framework. The axis stays compact (code) but the manager sees the full
 * description on hover and in the legend/report.
 *
 * `groupKeyForControl` derives the group code from a raw control id in a
 * framework-aware way — because a naive prefix split (`MR-001` → "MR") is
 * useless. `describeDomain` returns the DE/EN long form for a known code.
 */

import { catalogTopicTitle, isCatalogTopic } from "@/data/catalogTopics";

export interface DomainDescription {
  de: string;
  en: string;
}

/** Domain descriptions per framework, keyed by the group code we compute. */
const DOMAIN_LABELS: Record<string, Record<string, DomainDescription>> = {
  ISO27001: {
    // Managementklauseln (Kapitel 4-10 der Norm)
    "Kap.4":  { de: "Kontext der Organisation", en: "Context of the organization" },
    "Kap.5":  { de: "Führung",                 en: "Leadership" },
    "Kap.6":  { de: "Planung",                  en: "Planning" },
    "Kap.7":  { de: "Unterstützung",           en: "Support" },
    "Kap.8":  { de: "Betrieb",                  en: "Operation" },
    "Kap.9":  { de: "Bewertung der Leistung",   en: "Performance evaluation" },
    "Kap.10": { de: "Verbesserung",            en: "Improvement" },
    // Anhang A — Maßnahmenkatalog (ISO 27001:2022)
    "A.5": { de: "Organisatorische Maßnahmen", en: "Organizational controls" },
    "A.6": { de: "Personelle Maßnahmen",       en: "People controls" },
    "A.7": { de: "Physische Maßnahmen",        en: "Physical controls" },
    "A.8": { de: "Technische Maßnahmen",       en: "Technological controls" },
  },
  // BSI IT-Grundschutz++ (modernisierte Domänen, wie im Katalog geführt).
  // Codes stammen aus den nativen Kontroll-IDs (z. B. „KONF.1.3" → „KONF").
  BSI: {
    STM:  { de: "Geltungsbereich (Informationsverbund)", en: "Scope (information domain)" },
    GC:   { de: "Governance & ISMS",                    en: "Governance & ISMS" },
    RISK: { de: "Risikomanagement",                   en: "Risk management" },
    ARCH: { de: "Architektur & Netzsegmentierung",    en: "Architecture & network segmentation" },
    ASST: { de: "Asset- & Inventarverwaltung",        en: "Asset & inventory management" },
    BER:  { de: "Identitäten & Berechtigungen",        en: "Identity & access management" },
    KONF: { de: "Konfiguration & Härtung",            en: "Configuration & hardening" },
    GEB:  { de: "Gebäude & physische Sicherheit",      en: "Buildings & physical security" },
    DEV:  { de: "Sichere Entwicklung",                 en: "Secure development" },
    TEST: { de: "Test & Änderungsmanagement",         en: "Testing & change management" },
    DLS:  { de: "Datenübertragung & Verschlüsselung",  en: "Data transmission & encryption" },
    DET:  { de: "Detektion & Überwachung",             en: "Detection & monitoring" },
    REA:  { de: "Reaktion auf Vorfälle",               en: "Incident response" },
    NOT:  { de: "Notfall & Kontinuität (BCM)",         en: "Emergency & continuity (BCM)" },
    BES:  { de: "Beschaffung & Outsourcing",           en: "Procurement & outsourcing" },
    PERS: { de: "Personal & Rollen",                  en: "Personnel & roles" },
    SENS: { de: "Sensibilisierung & Schulung",        en: "Awareness & training" },
    PERF: { de: "Überwachung, Audit & Wirksamkeit",   en: "Monitoring, audit & effectiveness" },
    UMS:  { de: "Umsetzung(sstatus)",                  en: "Implementation status" },
    VRB:  { de: "Kontinuierliche Verbesserung",        en: "Continual improvement" },
  },
  BSI200_4: {
    "01": { de: "Einleitung und Rahmen",            en: "Introduction and scope" },
    "02": { de: "Initiierung des BCM",              en: "BCM initiation" },
    "03": { de: "Konzeption",                        en: "Design" },
    "04": { de: "Umsetzung",                         en: "Implementation" },
    "05": { de: "Aufrechterhaltung und Uebung",     en: "Maintenance and exercise" },
    "06": { de: "Notfallbewaeltigung",              en: "Emergency response" },
    "07": { de: "Kontinuierliche Verbesserung",     en: "Continuous improvement" },
    "08": { de: "Business-Impact-Analyse (Abhängigkeiten)", en: "Business impact analysis" },
    "09": { de: "BCM-Risikoanalyse",                  en: "BCM risk analysis" },
    "10": { de: "BC-Strategien (Vorsorge/Ausweich)",  en: "BC strategies" },
    "11": { de: "Bewertung von Strategien (Kosten/Nutzen)", en: "Strategy evaluation" },
    "12": { de: "Geschäftsfortführungspläne (Notbetrieb)", en: "Business continuity plans" },
    "13": { de: "Sofortmaßnahmen & Soforthilfe",      en: "Immediate response measures" },
    "14": { de: "Krisenstab & Krisenmanagement",      en: "Crisis team & management" },
    "15": { de: "Alarmierung & Erreichbarkeit (24/7)", en: "Alerting & reachability" },
    "16": { de: "Wiederanlaufpläne",                  en: "Recovery plans" },
    "17": { de: "Ausweichstandorte",                  en: "Alternate sites" },
    "18": { de: "Übungs- & Testprogramm",             en: "Exercise & test programme" },
    "19": { de: "Auswertung von Übungen",             en: "Exercise evaluation" },
    "20": { de: "BCM-Kennzahlen & Wirksamkeit",       en: "BCM metrics & effectiveness" },
    "21": { de: "Interne Audits & Reviews",           en: "Internal audits & reviews" },
    "22": { de: "Korrektur- & Verbesserungsmaßnahmen", en: "Corrective & improvement actions" },
    "23": { de: "Gelenkte BCM-Dokumentation",         en: "Controlled BCM documentation" },
    "24": { de: "Aufrechterhaltung des BCMS",         en: "BCMS maintenance" },
    "25": { de: "Änderungsmanagement im BCMS",        en: "BCMS change management" },
  },
  BCM22301: {
    "4":  { de: "Kontext der Organisation", en: "Context of the organization" },
    "5":  { de: "Fuehrung",                  en: "Leadership" },
    "6":  { de: "Planung",                   en: "Planning" },
    "7":  { de: "Unterstuetzung",            en: "Support" },
    "8":  { de: "Betrieb (BCM-Programm)",    en: "Operation (BCM programme)" },
    "9":  { de: "Bewertung der Leistung",    en: "Performance evaluation" },
    "10": { de: "Verbesserung",             en: "Improvement" },
  },
  NIST_CSF: {
    GV: { de: "Govern (Steuerung)",     en: "Govern" },
    ID: { de: "Identify (Identifizieren)", en: "Identify" },
    PR: { de: "Protect (Schuetzen)",    en: "Protect" },
    DE: { de: "Detect (Erkennen)",       en: "Detect" },
    RS: { de: "Respond (Reagieren)",     en: "Respond" },
    RC: { de: "Recover (Wiederherstellen)", en: "Recover" },
  },
  NIST_AI_RMF: {
    G: { de: "KI-Governance",    en: "AI governance" },
    M: { de: "Kontext & Risiken erfassen", en: "Context & risks" },
    P: { de: "Messung & Test",   en: "Measurement & testing" },
    A: { de: "Steuerung & Response", en: "Response & handling" },
  },
  SOC2: {
    CC1: { de: "Kontrollumfeld",              en: "Control environment" },
    CC2: { de: "Kommunikation & Information",  en: "Communication & information" },
    CC3: { de: "Risikobewertung",             en: "Risk assessment" },
    CC4: { de: "Überwachung der Kontrollen",  en: "Monitoring of controls" },
    CC5: { de: "Kontrollaktivitäten",         en: "Control activities" },
    CC6: { de: "Logischer & physischer Zugriff", en: "Logical & physical access" },
    CC7: { de: "Systembetrieb",               en: "System operations" },
    CC8: { de: "Änderungsmanagement",         en: "Change management" },
    CC9: { de: "Risikominderung",             en: "Risk mitigation" },
    A:   { de: "Verfügbarkeit",                 en: "Availability" },
    C:   { de: "Vertraulichkeit",               en: "Confidentiality" },
    PI:  { de: "Verarbeitungsintegrität",      en: "Processing integrity" },
    P:   { de: "Datenschutz (Privacy)",         en: "Privacy" },
  },
  DORA: {
    "II":  { de: "ICT-Risikomanagement",             en: "ICT risk management" },
    "III": { de: "Vorfallmeldung",                    en: "Incident reporting" },
    "IV":  { de: "Digitale operationale Resilienz-Tests", en: "Digital operational resilience testing" },
    "V":   { de: "Drittparteien-Risiko (ICT-TPP)",     en: "Third-party risk (ICT TPP)" },
    "VI":  { de: "Informationsaustausch",             en: "Information sharing" },
  },
  NIS2: {
    "Art.20": { de: "Governance & Verantwortung", en: "Governance & accountability" },
    "Art.21": { de: "Risiko- und Sicherheitsmassnahmen", en: "Risk & security measures" },
    "Art.23": { de: "Meldepflichten (24h/72h/1M)", en: "Reporting duties (24h/72h/1M)" },
  },
  GDPR: {
    "Art.5-11":  { de: "Grundsätze der Verarbeitung",        en: "Principles of processing" },
    "Art.12-23": { de: "Betroffenenrechte",                  en: "Data subject rights" },
    "Art.24-31": { de: "Verantwortlicher & Auftragsverarbeiter", en: "Controller & processor" },
    "Art.32-34": { de: "Sicherheit & Meldung von Verletzungen", en: "Security & breach notification" },
    "Art.35-39": { de: "DSFA & Datenschutzbeauftragter",     en: "DPIA & data protection officer" },
    "Art.44-49": { de: "Übermittlung an Drittländer",        en: "Transfers to third countries" },
  },
  MaRisk: {
    AT:  { de: "Allgemeiner Teil",                          en: "General part" },
    BT:  { de: "Besonderer Teil (Geschaeftsprozesse)",      en: "Special part (processes)" },
    BTO: { de: "Anforderungen an die Aufbau- und Ablauforganisation", en: "Organization & workflow" },
    BTR: { de: "Anforderungen an die Risikosteuerung",     en: "Risk steering" },
    BAIT:{ de: "Bankaufsichtliche Anforderungen an die IT", en: "Supervisory IT requirements" },
  },
  CRA: {
    "AnnexI-1": { de: "Sicherheitsanforderungen an Produkte", en: "Product security requirements" },
    "AnnexI-2": { de: "Umgang mit Schwachstellen",             en: "Vulnerability handling" },
    "AnnexII":  { de: "Informationspflichten des Herstellers",   en: "Manufacturer information" },
    "Melde":    { de: "Meldepflichten (Art. 14)",                             en: "Reporting duties (Art. 14)" },
  },
  AIACT: {
    A: { de: "Verbotene Praktiken",                    en: "Prohibited practices" },
    B: { de: "Hochrisiko-KI",                          en: "High-risk AI" },
    C: { de: "Transparenzpflichten",                   en: "Transparency duties" },
    D: { de: "Foundation / GPAI",                      en: "Foundation / GPAI" },
    E: { de: "Governance & Ueberwachung",              en: "Governance & oversight" },
  },
  ISO42001: {
    "4":  { de: "Kontext",             en: "Context" },
    "5":  { de: "Fuehrung",            en: "Leadership" },
    "6":  { de: "Planung",             en: "Planning" },
    "7":  { de: "Unterstuetzung",      en: "Support" },
    "8":  { de: "Betrieb",              en: "Operation" },
    "9":  { de: "Bewertung",            en: "Performance evaluation" },
    "10": { de: "Verbesserung",        en: "Improvement" },
    A:    { de: "KI-Massnahmen",  en: "AI controls" },
  },
  ISO27017: {
    CLD:  { de: "Cloud-spezifische Ergaenzungen", en: "Cloud-specific extensions" },
  },
  ISO27018: {
    A: { de: "Schutz von PII in der Cloud", en: "Protection of PII in the cloud" },
  },
  ISO27701: {
    Kern: { de: "PIMS-Anforderungen (Kap. 5-8)", en: "PIMS requirements (cl. 5-8)" },
    A7: { de: "Zusaetzliche Massnahmen fuer Verantwortliche", en: "Additional controls for controllers" },
    A8: { de: "Zusaetzliche Massnahmen fuer Auftragsverarbeiter", en: "Additional controls for processors" },
  },
  TR03183: {
    "2": { de: "SBOM-Anforderungen",              en: "SBOM requirements" },
    "3": { de: "Schwachstellenkommunikation",     en: "Vulnerability disclosure" },
    "4": { de: "Update- und Support-Pflichten",   en: "Update & support duties" },
  },
  TISAX: {
    "1": { de: "IS-Richtlinien & Organisation",       en: "IS policies & organization" },
    "2": { de: "Personal & Awareness",                en: "Human resources & awareness" },
    "3": { de: "Physische Sicherheit & Betriebsmittel", en: "Physical security & assets" },
    "4": { de: "Identitäts- & Zugangsmanagement",     en: "Identity & access management" },
    "5": { de: "Kryptographie & Betrieb",             en: "Cryptography & operations" },
    "6": { de: "Lieferanten & Zusammenarbeit",        en: "Suppliers & collaboration" },
    "7": { de: "Compliance & rechtliche Anforderungen", en: "Compliance & legal" },
    "8": { de: "Physischer Perimeter- & Gebäudeschutz", en: "Perimeter & building security" },
    "9": { de: "Datenschutz",                         en: "Data protection" },
  },
  KRITIS: {
    ABF:  { de: "Abfall (Sub-Sektor)",            en: "Waste (sub-sector)" },
    ENR:  { de: "Energie",                        en: "Energy" },
    FIN:  { de: "Finanz- und Versicherungswesen", en: "Finance & insurance" },
    GES:  { de: "Gesundheit",                     en: "Health" },
    IT:   { de: "Informationstechnik & Telekom", en: "IT & telecom" },
    MED:  { de: "Medien und Kultur",              en: "Media & culture" },
    STA:  { de: "Staat und Verwaltung",           en: "State & administration" },
    TRA:  { de: "Transport und Verkehr",          en: "Transport & traffic" },
    WAS:  { de: "Wasser",                          en: "Water" },
    ERN:  { de: "Ernaehrung",                      en: "Food" },
    BDEW: { de: "Whitepaper Sichere Systeme (Energie/Wasser)", en: "Secure systems whitepaper (energy/water)" },
    ENE:  { de: "Energie (IT-Sicherheitskatalog EnWG §11.1a)", en: "Energy (EnWG IT security catalogue)" },
    ITK:  { de: "IT-/TK-Sicherheitskatalog (Telekommunikation)", en: "IT/telecom security catalogue" },
    SZA:  { de: "Systeme zur Angriffserkennung (SIEM/IDS)", en: "Attack detection systems (SIEM/IDS)" },
    KRN:  { de: "Kernpflichten & Schwellenwerte (BSI-KritisV)", en: "Core duties & thresholds" },
    FDH:  { de: "Handel & Distribution (POS/Warenwirtschaft)", en: "Retail & distribution (POS/ERP)" },
    FDP:  { de: "Produktion & Prozessleittechnik (SCADA)", en: "Production & process control (SCADA)" },
  },
};

/**
 * Compute a stable, meaningful group code for a control id, framework-aware.
 * The result is what appears on the radar axis; describeDomain resolves it
 * to the human-readable long form.
 */
export function groupKeyForControl(framework: string, id: string, meta?: unknown): string {
  const fw = framework.toUpperCase();
  const m0 = (meta ?? {}) as Record<string, unknown>;

  // Unified Catalogue v7 zuerst: ISO-Controls tragen ihre Annex-/Kapitel-Referenz
  // in `meta.annex` ("A.5.31", "4.1"). Die v7-IDs ("ISO-LEGAL-REQUIREMENTS",
  // "C29.4") passen in kein Präfix-Schema mehr — ohne diesen Zweig fiel "C29.4"
  // auf "Kap.29" (existiert nicht) und ISO-* in den Rohtoken.
  if (fw === "ISO27001" && typeof m0.annex === "string" && m0.annex.trim()) {
    const a = m0.annex.trim();
    const annexM = a.match(/^A\.(\d+)/i);
    if (annexM) return `A.${annexM[1]}`;
    const clauseM = a.match(/^(\d+)/);
    if (clauseM) return `Kap.${clauseM[1]}`;
  }

  // Danach das framework-neutrale Katalog-Thema T01–T18 (`meta.topic`). Das ist
  // der Grund, warum NIS2 vorher "Zu wenige Domänen für Radar" zeigte: die
  // Bündelung unten kennt nur das Alt-Schema und lieferte praktisch nur "Art.21".
  if (isCatalogTopic(m0.topic)) return m0.topic;

  // ISO27001: "a5-01" → "A.5"
  if (fw === "ISO27001") {
    const m = id.match(/^a(\d+)/i);
    if (m) return `A.${m[1]}`;
    const c = id.match(/^c(\d+)/i);        // Managementklauseln c4..c10
    if (c) return `Kap.${c[1]}`;
  }

  // BSI IT-Grundschutz: "ARCH.1.1" → "ARCH"
  if (fw === "BSI") {
    const m = id.match(/^([A-Z]+)/);
    if (m) return m[1];
  }

  // BSI 200-4: "BSI2004-01.1" → "01"
  if (fw === "BSI200_4") {
    const m = id.match(/BSI2004-(\d{2})/i);
    if (m) return m[1];
  }

  // BCM ISO 22301: "BCM22301-4.1" → "4"
  if (fw === "BCM22301") {
    const m = id.match(/BCM22301-(\d+)/i);
    if (m) return m[1];
  }

  // NIST CSF 2.0: "NIST-DE.AE-02" → "DE"
  if (fw === "NIST_CSF") {
    const m = id.match(/NIST-([A-Z]{2})/i);
    if (m) return m[1].toUpperCase();
  }

  // NIST AI RMF: "NAIRMF-G1.1" → "G"
  if (fw === "NIST_AI_RMF") {
    const m = id.match(/NAIRMF-([A-Z])/i);
    if (m) return m[1].toUpperCase();
  }

  // SOC 2: nach Trust-Services-Kategorie bündeln (CC1-CC9 + A/C/PI/P)
  if (fw === "SOC2") {
    const cc = id.match(/SOC2-(CC\d)/i);
    if (cc) return cc[1].toUpperCase();
    const o = id.match(/SOC2-(PI|A|C|P)\d/i);
    if (o) return o[1].toUpperCase();
  }

  // KRITIS: "ABF-A-5.12" → "ABF"
  if (fw === "KRITIS") {
    const m = id.match(/^([A-Z]+)-/);
    if (m) return m[1];
  }

  // DORA: bucket by chapter using id ranges
  if (fw === "DORA") {
    const m = id.match(/DORA-(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n <= 60) return "II";
      if (n <= 100) return "III";
      if (n <= 140) return "IV";
      if (n <= 220) return "V";
      return "VI";
    }
  }

  // NIS2: auf die drei Kern-Artikel bündeln (management-tauglich).
  // Alt-Schema a-01..a-NN + Fähigkeits-Codes (gov/org/risk/iam/...) → Art. 20/21/23.
  if (fw === "NIS2") {
    const t = id.toLowerCase();
    const m = t.match(/^a-?(\d+)/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n <= 4) return "Art.20";
      if (n <= 30) return "Art.21";
      return "Art.23";
    }
    if (/^(gov|org|nis2)/.test(t)) return "Art.20";   // Governance & Leitungsverantwortung
    if (/^reg/.test(t)) return "Art.23";              // Registrierung/Meldung
    return "Art.21";                                   // alle Sicherheitsmaßnahmen (a-j)
  }

  // GDPR: bucket by article
  if (fw === "GDPR") {
    const m = id.match(/GDPR-(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n <= 11) return "Art.5-11";
      if (n <= 23) return "Art.12-23";
      if (n <= 31) return "Art.24-31";
      if (n <= 34) return "Art.32-34";
      if (n <= 39) return "Art.35-39";
      return "Art.44-49";
    }
  }

  // MaRisk: try BAIT first, then AT/BT/BTO/BTR
  if (fw === "MaRisk".toUpperCase()) {
    if (/BAIT/i.test(id)) return "BAIT";
    if (/MR-BTO/i.test(id)) return "BTO";
    if (/MR-BTR/i.test(id)) return "BTR";
    if (/MR-BT/i.test(id))  return "BT";
    if (/MR-AT/i.test(id))  return "AT";
    // Numeric ids: MR-001..MR-158 → bucket by hundreds
    const m = id.match(/MR-(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n <= 60)  return "AT";
      if (n <= 100) return "BTO";
      if (n <= 140) return "BTR";
      return "BAIT";
    }
  }

  // CRA: "CRA-01.1" → 01/02 → Annex I §1, others §2 etc.
  if (fw === "CRA") {
    const m = id.match(/CRA-(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n <= 40) return "AnnexI-1";
      if (n <= 60) return "AnnexI-2";
      if (n <= 69) return "AnnexII";
      return "Melde";
    }
  }

  // AIACT: "AIACT-A-01.1" → "A"
  if (fw === "AIACT") {
    const m = id.match(/AIACT-([A-Z])/i);
    if (m) return m[1].toUpperCase();
  }

  // ISO42001: "ISO42001-5.2" → "5"; "ISO42001-A.10.2" → "A"
  if (fw === "ISO42001") {
    const m = id.match(/ISO42001-([A-Z]|\d+)/i);
    if (m) return m[1].toUpperCase();
  }

  // ISO27017: "ISO27017-CLD.10.1.1" → "CLD"
  if (fw === "ISO27017") return "CLD";

  // ISO27018: → "A"
  if (fw === "ISO27018") return "A";

  // ISO27701: "P27701-A7.2.1" → "A7"; "P27701-01" → "Kernklauseln"
  if (fw === "ISO27701") {
    const m = id.match(/P27701-(A\d)/i);
    if (m) return m[1].toUpperCase();
    return "Kern";
  }

  // TR03183: "TR03183-2.1" → "2"
  if (fw === "TR03183") {
    const m = id.match(/TR03183-(\d+)/i);
    if (m) return m[1];
  }

  // TISAX: "1.1.1" → "1"
  if (fw === "TISAX") {
    const m = id.match(/^(\d+)/);
    if (m) return m[1];
  }

  // Fallback: token before first "-" or "."
  const m = id.match(/^([A-Za-z0-9]+)/);
  return m ? m[1] : id;
}

/** Human-readable long form for a group key; null if unknown. */
export function describeDomain(framework: string, key: string, de: boolean): string | null {
  // Katalog-Themen sind framework-neutral und stehen in keiner DOMAIN_LABELS-Tabelle.
  if (isCatalogTopic(key)) return catalogTopicTitle(key, de);
  const fw = framework.toUpperCase();
  const bucket = DOMAIN_LABELS[fw];
  if (!bucket) return null;
  const entry = bucket[key];
  if (!entry) return null;
  return de ? entry.de : entry.en;
}
