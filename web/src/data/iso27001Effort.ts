/**
 * ISO 27001:2022 Annex A — full catalog with realistic effort estimates.
 *
 * Effort = person-days to fully implement a control from scratch in a
 * medium-sized organisation (100-500 employees), based on BSI Grundschutz
 * baseline figures and practitioner experience.
 *
 * Used by Roadmap (Step 15) for bundle grouping and PT estimation.
 */

export type IsoTheme = "A.5" | "A.6" | "A.7" | "A.8";

export interface IsoControl {
  id: string;          // e.g. "A.5.15"
  title: string;       // German title
  titleEn: string;
  theme: IsoTheme;
  effortDays: number;  // realistic PT to implement from scratch
}

export const ISO_27001_ANNEX_A: IsoControl[] = [
  // ===== A.5 Organizational (37 controls) =====
  { id: "A.5.1",  theme: "A.5", title: "Informationssicherheitsrichtlinien",            titleEn: "Policies for information security",                          effortDays: 12 },
  { id: "A.5.2",  theme: "A.5", title: "Rollen und Verantwortlichkeiten",               titleEn: "Information security roles and responsibilities",            effortDays: 5 },
  { id: "A.5.3",  theme: "A.5", title: "Aufgabentrennung",                              titleEn: "Segregation of duties",                                      effortDays: 4 },
  { id: "A.5.4",  theme: "A.5", title: "Verantwortung der Leitung",                     titleEn: "Management responsibilities",                                effortDays: 3 },
  { id: "A.5.5",  theme: "A.5", title: "Kontakt zu Behörden",                           titleEn: "Contact with authorities",                                   effortDays: 2 },
  { id: "A.5.6",  theme: "A.5", title: "Kontakt zu Interessengruppen",                  titleEn: "Contact with special interest groups",                       effortDays: 2 },
  { id: "A.5.7",  theme: "A.5", title: "Threat Intelligence",                           titleEn: "Threat intelligence",                                        effortDays: 10 },
  { id: "A.5.8",  theme: "A.5", title: "Sicherheit im Projektmanagement",               titleEn: "Information security in project management",                 effortDays: 6 },
  { id: "A.5.9",  theme: "A.5", title: "Inventar der Informationen und Assets",         titleEn: "Inventory of information and other assets",                  effortDays: 15 },
  { id: "A.5.10", theme: "A.5", title: "Akzeptable Nutzung von Assets",                 titleEn: "Acceptable use of information and assets",                   effortDays: 4 },
  { id: "A.5.11", theme: "A.5", title: "Rückgabe von Assets",                           titleEn: "Return of assets",                                           effortDays: 3 },
  { id: "A.5.12", theme: "A.5", title: "Klassifizierung von Informationen",             titleEn: "Classification of information",                              effortDays: 8 },
  { id: "A.5.13", theme: "A.5", title: "Kennzeichnung von Informationen",               titleEn: "Labelling of information",                                   effortDays: 5 },
  { id: "A.5.14", theme: "A.5", title: "Informationsübertragung",                       titleEn: "Information transfer",                                       effortDays: 6 },
  { id: "A.5.15", theme: "A.5", title: "Zugriffskontrolle",                             titleEn: "Access control",                                             effortDays: 8 },
  { id: "A.5.16", theme: "A.5", title: "Identitätsmanagement",                          titleEn: "Identity management",                                        effortDays: 10 },
  { id: "A.5.17", theme: "A.5", title: "Authentifizierungsinformationen",               titleEn: "Authentication information",                                 effortDays: 6 },
  { id: "A.5.18", theme: "A.5", title: "Zugriffsrechte",                                titleEn: "Access rights",                                              effortDays: 7 },
  { id: "A.5.19", theme: "A.5", title: "Informationssicherheit in Lieferantenbeziehungen", titleEn: "Information security in supplier relationships",          effortDays: 10 },
  { id: "A.5.20", theme: "A.5", title: "Sicherheit in Lieferantenverträgen",            titleEn: "Addressing information security in supplier agreements",     effortDays: 6 },
  { id: "A.5.21", theme: "A.5", title: "ICT-Lieferkettensicherheit",                    titleEn: "Managing information security in the ICT supply chain",      effortDays: 8 },
  { id: "A.5.22", theme: "A.5", title: "Überwachung der Lieferantendienste",            titleEn: "Monitoring, review and change management of supplier services", effortDays: 5 },
  { id: "A.5.23", theme: "A.5", title: "Sicherheit bei Cloud-Diensten",                 titleEn: "Information security for use of cloud services",             effortDays: 8 },
  { id: "A.5.24", theme: "A.5", title: "ISMS-Vorfallplanung und -vorbereitung",         titleEn: "Information security incident management planning and preparation", effortDays: 10 },
  { id: "A.5.25", theme: "A.5", title: "Bewertung und Entscheidung über Vorfälle",      titleEn: "Assessment and decision on information security events",     effortDays: 4 },
  { id: "A.5.26", theme: "A.5", title: "Reaktion auf Sicherheitsvorfälle",              titleEn: "Response to information security incidents",                 effortDays: 8 },
  { id: "A.5.27", theme: "A.5", title: "Lernen aus Sicherheitsvorfällen",               titleEn: "Learning from information security incidents",               effortDays: 3 },
  { id: "A.5.28", theme: "A.5", title: "Sammeln von Beweisen",                          titleEn: "Collection of evidence",                                     effortDays: 5 },
  { id: "A.5.29", theme: "A.5", title: "Sicherheit während Störungen",                  titleEn: "Information security during disruption",                     effortDays: 6 },
  { id: "A.5.30", theme: "A.5", title: "ICT-Bereitschaft für Business Continuity",      titleEn: "ICT readiness for business continuity",                      effortDays: 15 },
  { id: "A.5.31", theme: "A.5", title: "Gesetzliche Anforderungen",                     titleEn: "Legal, statutory, regulatory and contractual requirements",  effortDays: 6 },
  { id: "A.5.32", theme: "A.5", title: "Geistige Eigentumsrechte",                      titleEn: "Intellectual property rights",                               effortDays: 3 },
  { id: "A.5.33", theme: "A.5", title: "Schutz von Aufzeichnungen",                     titleEn: "Protection of records",                                      effortDays: 5 },
  { id: "A.5.34", theme: "A.5", title: "Datenschutz und PII-Schutz",                    titleEn: "Privacy and protection of PII",                              effortDays: 10 },
  { id: "A.5.35", theme: "A.5", title: "Unabhängige Überprüfung der Informationssicherheit", titleEn: "Independent review of information security",            effortDays: 5 },
  { id: "A.5.36", theme: "A.5", title: "Konformität mit Richtlinien",                   titleEn: "Compliance with policies, rules and standards",              effortDays: 4 },
  { id: "A.5.37", theme: "A.5", title: "Dokumentierte Betriebsverfahren",               titleEn: "Documented operating procedures",                            effortDays: 8 },
  // ===== A.6 People (8 controls) =====
  { id: "A.6.1",  theme: "A.6", title: "Sicherheitsüberprüfung",                        titleEn: "Screening",                                                  effortDays: 4 },
  { id: "A.6.2",  theme: "A.6", title: "Beschäftigungsbedingungen",                     titleEn: "Terms and conditions of employment",                         effortDays: 3 },
  { id: "A.6.3",  theme: "A.6", title: "Sensibilisierung und Schulungen",               titleEn: "Information security awareness, education and training",     effortDays: 10 },
  { id: "A.6.4",  theme: "A.6", title: "Disziplinarverfahren",                          titleEn: "Disciplinary process",                                       effortDays: 3 },
  { id: "A.6.5",  theme: "A.6", title: "Verantwortung nach Beschäftigungsende",         titleEn: "Responsibilities after termination or change of employment", effortDays: 2 },
  { id: "A.6.6",  theme: "A.6", title: "Vertraulichkeitsvereinbarungen",                titleEn: "Confidentiality or non-disclosure agreements",               effortDays: 3 },
  { id: "A.6.7",  theme: "A.6", title: "Telearbeit",                                    titleEn: "Remote working",                                             effortDays: 6 },
  { id: "A.6.8",  theme: "A.6", title: "Meldung von Sicherheitsereignissen",            titleEn: "Information security event reporting",                       effortDays: 4 },
  // ===== A.7 Physical (14 controls) =====
  { id: "A.7.1",  theme: "A.7", title: "Physische Sicherheitsperimeter",                titleEn: "Physical security perimeters",                               effortDays: 8 },
  { id: "A.7.2",  theme: "A.7", title: "Physische Eingangskontrollen",                  titleEn: "Physical entry",                                             effortDays: 6 },
  { id: "A.7.3",  theme: "A.7", title: "Sicherung von Büros, Räumen und Einrichtungen", titleEn: "Securing offices, rooms and facilities",                     effortDays: 5 },
  { id: "A.7.4",  theme: "A.7", title: "Überwachung der physischen Sicherheit",         titleEn: "Physical security monitoring",                               effortDays: 7 },
  { id: "A.7.5",  theme: "A.7", title: "Schutz gegen physische und umweltbedingte Bedrohungen", titleEn: "Protecting against physical and environmental threats", effortDays: 6 },
  { id: "A.7.6",  theme: "A.7", title: "Arbeiten in sicheren Bereichen",                titleEn: "Working in secure areas",                                    effortDays: 3 },
  { id: "A.7.7",  theme: "A.7", title: "Clear Desk und Clear Screen",                   titleEn: "Clear desk and clear screen",                                effortDays: 3 },
  { id: "A.7.8",  theme: "A.7", title: "Standortwahl und Schutz von Geräten",           titleEn: "Equipment siting and protection",                            effortDays: 4 },
  { id: "A.7.9",  theme: "A.7", title: "Sicherheit von Geräten außerhalb des Standorts", titleEn: "Security of assets off-premises",                           effortDays: 5 },
  { id: "A.7.10", theme: "A.7", title: "Speichermedien",                                titleEn: "Storage media",                                              effortDays: 5 },
  { id: "A.7.11", theme: "A.7", title: "Versorgungseinrichtungen",                      titleEn: "Supporting utilities",                                       effortDays: 6 },
  { id: "A.7.12", theme: "A.7", title: "Verkabelungssicherheit",                        titleEn: "Cabling security",                                           effortDays: 4 },
  { id: "A.7.13", theme: "A.7", title: "Wartung von Geräten",                           titleEn: "Equipment maintenance",                                      effortDays: 4 },
  { id: "A.7.14", theme: "A.7", title: "Sichere Entsorgung oder Wiederverwendung",      titleEn: "Secure disposal or re-use of equipment",                     effortDays: 3 },
  // ===== A.8 Technological (34 controls) =====
  { id: "A.8.1",  theme: "A.8", title: "Endgeräte der Benutzer",                        titleEn: "User end point devices",                                     effortDays: 10 },
  { id: "A.8.2",  theme: "A.8", title: "Privilegierte Zugriffsrechte",                  titleEn: "Privileged access rights",                                   effortDays: 10 },
  { id: "A.8.3",  theme: "A.8", title: "Informationszugriffsbeschränkung",              titleEn: "Information access restriction",                             effortDays: 6 },
  { id: "A.8.4",  theme: "A.8", title: "Zugriff auf Quellcode",                         titleEn: "Access to source code",                                      effortDays: 5 },
  { id: "A.8.5",  theme: "A.8", title: "Sichere Authentifizierung",                     titleEn: "Secure authentication",                                      effortDays: 12 },
  { id: "A.8.6",  theme: "A.8", title: "Kapazitätsmanagement",                          titleEn: "Capacity management",                                        effortDays: 5 },
  { id: "A.8.7",  theme: "A.8", title: "Schutz vor Schadsoftware",                      titleEn: "Protection against malware",                                 effortDays: 10 },
  { id: "A.8.8",  theme: "A.8", title: "Management technischer Schwachstellen",         titleEn: "Management of technical vulnerabilities",                    effortDays: 15 },
  { id: "A.8.9",  theme: "A.8", title: "Konfigurationsmanagement",                      titleEn: "Configuration management",                                   effortDays: 12 },
  { id: "A.8.10", theme: "A.8", title: "Löschung von Informationen",                    titleEn: "Information deletion",                                       effortDays: 5 },
  { id: "A.8.11", theme: "A.8", title: "Datenmaskierung",                               titleEn: "Data masking",                                               effortDays: 8 },
  { id: "A.8.12", theme: "A.8", title: "Verhinderung von Datenabfluss",                 titleEn: "Data leakage prevention",                                    effortDays: 15 },
  { id: "A.8.13", theme: "A.8", title: "Sicherung von Informationen",                   titleEn: "Information backup",                                         effortDays: 12 },
  { id: "A.8.14", theme: "A.8", title: "Redundanz von Informationsverarbeitung",        titleEn: "Redundancy of information processing facilities",            effortDays: 15 },
  { id: "A.8.15", theme: "A.8", title: "Protokollierung",                               titleEn: "Logging",                                                    effortDays: 10 },
  { id: "A.8.16", theme: "A.8", title: "Monitoring-Aktivitäten",                        titleEn: "Monitoring activities",                                      effortDays: 15 },
  { id: "A.8.17", theme: "A.8", title: "Uhrensynchronisation",                          titleEn: "Clock synchronization",                                      effortDays: 2 },
  { id: "A.8.18", theme: "A.8", title: "Nutzung privilegierter Dienstprogramme",        titleEn: "Use of privileged utility programs",                         effortDays: 4 },
  { id: "A.8.19", theme: "A.8", title: "Software-Installation auf operativen Systemen", titleEn: "Installation of software on operational systems",            effortDays: 6 },
  { id: "A.8.20", theme: "A.8", title: "Netzwerksicherheit",                            titleEn: "Networks security",                                          effortDays: 12 },
  { id: "A.8.21", theme: "A.8", title: "Sicherheit von Netzwerkdiensten",               titleEn: "Security of network services",                               effortDays: 8 },
  { id: "A.8.22", theme: "A.8", title: "Trennung von Netzwerken",                       titleEn: "Segregation of networks",                                    effortDays: 15 },
  { id: "A.8.23", theme: "A.8", title: "Web-Filterung",                                 titleEn: "Web filtering",                                              effortDays: 6 },
  { id: "A.8.24", theme: "A.8", title: "Verwendung von Kryptographie",                  titleEn: "Use of cryptography",                                        effortDays: 10 },
  { id: "A.8.25", theme: "A.8", title: "Sicherer Entwicklungslebenszyklus",             titleEn: "Secure development life cycle",                              effortDays: 15 },
  { id: "A.8.26", theme: "A.8", title: "Anforderungen an Anwendungssicherheit",         titleEn: "Application security requirements",                          effortDays: 10 },
  { id: "A.8.27", theme: "A.8", title: "Sichere Systemarchitektur",                     titleEn: "Secure system architecture and engineering principles",      effortDays: 10 },
  { id: "A.8.28", theme: "A.8", title: "Sichere Codierung",                             titleEn: "Secure coding",                                              effortDays: 10 },
  { id: "A.8.29", theme: "A.8", title: "Sicherheitstests in Entwicklung",               titleEn: "Security testing in development and acceptance",             effortDays: 12 },
  { id: "A.8.30", theme: "A.8", title: "Ausgelagerte Entwicklung",                      titleEn: "Outsourced development",                                     effortDays: 5 },
  { id: "A.8.31", theme: "A.8", title: "Trennung von Entwicklungs-, Test- und Produktionsumgebungen", titleEn: "Separation of development, test and production environments", effortDays: 8 },
  { id: "A.8.32", theme: "A.8", title: "Änderungsmanagement",                           titleEn: "Change management",                                          effortDays: 10 },
  { id: "A.8.33", theme: "A.8", title: "Testdaten",                                     titleEn: "Test information",                                           effortDays: 4 },
  { id: "A.8.34", theme: "A.8", title: "Schutz von Informationssystemen während der Auditierung", titleEn: "Protection of information systems during audit testing", effortDays: 3 },
];

export const ISO_CONTROL_MAP: Record<string, IsoControl> = Object.fromEntries(
  ISO_27001_ANNEX_A.map(c => [c.id, c])
);

/** Theme-level fallback effort (per-control averages) for NIS2-only items without ISO mapping. */
export const ISO_THEME_FALLBACK_PD: Record<IsoTheme, number> = {
  "A.5": 7,
  "A.6": 4,
  "A.7": 5,
  "A.8": 9,
};

/** Extract ISO Annex A reference from a control description string. */
export function extractIsoRef(description?: string): string | null {
  if (!description) return null;
  const m = description.match(/A\.\d+\.\d+/);
  return m ? m[0] : null;
}
