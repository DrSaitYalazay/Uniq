/**
 * isoAnnexMap — Zuordnung der ISO-27001-Kontroll-IDs (DB `controls`, framework
 * `ISO27001`, 318 IDs des Unified Control Catalogue v6: C…-Nummern und
 * ISO-…-Ergänzungen) zur offiziellen Annex-A-Kontrolle (ISO/IEC 27001:2022)
 * bzw. Managementsystem-Klausel 4–10.
 *
 * STAND 2026-09-12: Der Katalog wurde von 417 Prüffragen auf 318 Kontrollen
 * umgestellt. Die Zuordnung kommt jetzt direkt aus `iso_references` des
 * Katalogs (erste, spezifischste Referenz je Kontrolle) — sie wird generiert,
 * nicht von Hand gepflegt. Die alten 417 Prüffragen-IDs gibt es nicht mehr.
 *
 * Die internen IDs sind FORTLAUFENDE Prüffragen-Nummern, KEINE Annex-Nummern
 * („a5-04" ist die 4. Frage zu A.5.1, nicht A.5.4). Diese Map liefert die
 * Anzeige-Referenz (A.5.1 · Informationssicherheitsrichtlinien) clientseitig —
 * unabhängig davon, ob `db/seeds/iso_meta_annex.sql` schon deployt ist.
 *
 * Quellen (semantisch verifiziert, generiert — nicht von Hand raten):
 *  • 345 IDs: `frameworks/iso27001/controls-map.json` → `description_en` beginnt
 *    mit der exakten Nummer („A.5.7 – …", „Clause 6.1.3 – …"). c4-06 („Clause
 *    4.2/4.3 – Boundaries and applicability of the ISMS") → 4.3 (Scope).
 *  • 72 Zusatzfragen (a5-90…130, a7-38/39, a8-114…142): `control mapping/
 *    kontrol_denetimi/RAPOR_ISO27001.md` Abschnitt 2 + 4, bei Bereichsangaben
 *    (z. B. „A.5.15–5.18", „A.5.19–5.23", „A.5.29/5.30", „A.8.15/8.16") anhand
 *    des Prüffragentextes (req_en in catalog.sql) die spezifischste Kontrolle:
 *    a5-96 → A.5.31 (Meldepflichten-Inventar), a5-97 → A.5.5 (Meldewege Behörden),
 *    a5-98/101 → A.5.15, a5-99/100 → A.5.18, a5-102…104 → A.5.17,
 *    a5-105/106 → A.5.19, a5-107…109 → A.5.20, a5-110/112/113 → A.5.22,
 *    a5-111 → A.5.21 (Unterauftragnehmer), a5-114…116 → A.5.23,
 *    a5-117/118/122…124 → A.5.29, a5-119…121 → A.5.30 (BIA/Wiederanlauf/Übung),
 *    a5-128 → A.5.37, a5-129 → A.5.24 (Kategorien/Prioritäten), a5-130 → A.5.27,
 *    a8-125/126/128/129 → A.8.15, a8-127/130 → A.8.16, a8-132/133/135 → A.8.20,
 *    a8-134 → A.8.22.
 *  • Annex-Titel DE/EN: `iso27001Effort.ts` (ISO_27001_ANNEX_A, 93 Kontrollen).
 *  • Klausel-Titel 4–10: ISO/IEC 27001:2022 Kapitelüberschriften.
 *
 * Vollständigkeit: per Skript gegen `db/seeds/catalog.sql` geprüft —
 * 417/417 DB-IDs abgedeckt, 0 fehlend, 0 überzählig (2026-09-11).
 * Regel MUSS/SOLL: Klauseln 4–10 = MUSS (Pflicht, nicht ausschließbar),
 * Annex A = SOLL (per SoA ausschließbar) — identisch zu iso_meta_annex.sql.
 */

export type IsoAnnexKind = "annex" | "clause";

export interface IsoAnnexEntry {
  /** Offizielle Referenz, z. B. "A.5.1" oder "6.1.3" */
  ref: string;
  titleDe: string;
  titleEn: string;
  kind: IsoAnnexKind;
}

/** Titel je Annex-A-Kontrolle (93) und Klausel (27). */
const TITLES: Record<string, [string, string]> = {
  "A.5.1": ["Informationssicherheitsrichtlinien", "Policies for information security"],
  "A.5.2": ["Rollen und Verantwortlichkeiten", "Information security roles and responsibilities"],
  "A.5.3": ["Aufgabentrennung", "Segregation of duties"],
  "A.5.4": ["Verantwortung der Leitung", "Management responsibilities"],
  "A.5.5": ["Kontakt zu Behörden", "Contact with authorities"],
  "A.5.6": ["Kontakt zu Interessengruppen", "Contact with special interest groups"],
  "A.5.7": ["Threat Intelligence", "Threat intelligence"],
  "A.5.8": ["Sicherheit im Projektmanagement", "Information security in project management"],
  "A.5.9": ["Inventar der Informationen und Assets", "Inventory of information and other assets"],
  "A.5.10": ["Akzeptable Nutzung von Assets", "Acceptable use of information and assets"],
  "A.5.11": ["Rückgabe von Assets", "Return of assets"],
  "A.5.12": ["Klassifizierung von Informationen", "Classification of information"],
  "A.5.13": ["Kennzeichnung von Informationen", "Labelling of information"],
  "A.5.14": ["Informationsübertragung", "Information transfer"],
  "A.5.15": ["Zugriffskontrolle", "Access control"],
  "A.5.16": ["Identitätsmanagement", "Identity management"],
  "A.5.17": ["Authentifizierungsinformationen", "Authentication information"],
  "A.5.18": ["Zugriffsrechte", "Access rights"],
  "A.5.19": ["Informationssicherheit in Lieferantenbeziehungen", "Information security in supplier relationships"],
  "A.5.20": ["Sicherheit in Lieferantenverträgen", "Addressing information security in supplier agreements"],
  "A.5.21": ["ICT-Lieferkettensicherheit", "Managing information security in the ICT supply chain"],
  "A.5.22": ["Überwachung der Lieferantendienste", "Monitoring, review and change management of supplier services"],
  "A.5.23": ["Sicherheit bei Cloud-Diensten", "Information security for use of cloud services"],
  "A.5.24": ["ISMS-Vorfallplanung und -vorbereitung", "Information security incident management planning and preparation"],
  "A.5.25": ["Bewertung und Entscheidung über Vorfälle", "Assessment and decision on information security events"],
  "A.5.26": ["Reaktion auf Sicherheitsvorfälle", "Response to information security incidents"],
  "A.5.27": ["Lernen aus Sicherheitsvorfällen", "Learning from information security incidents"],
  "A.5.28": ["Sammeln von Beweisen", "Collection of evidence"],
  "A.5.29": ["Sicherheit während Störungen", "Information security during disruption"],
  "A.5.30": ["ICT-Bereitschaft für Business Continuity", "ICT readiness for business continuity"],
  "A.5.31": ["Gesetzliche Anforderungen", "Legal, statutory, regulatory and contractual requirements"],
  "A.5.32": ["Geistige Eigentumsrechte", "Intellectual property rights"],
  "A.5.33": ["Schutz von Aufzeichnungen", "Protection of records"],
  "A.5.34": ["Datenschutz und PII-Schutz", "Privacy and protection of PII"],
  "A.5.35": ["Unabhängige Überprüfung der Informationssicherheit", "Independent review of information security"],
  "A.5.36": ["Konformität mit Richtlinien", "Compliance with policies, rules and standards"],
  "A.5.37": ["Dokumentierte Betriebsverfahren", "Documented operating procedures"],
  "A.6.1": ["Sicherheitsüberprüfung", "Screening"],
  "A.6.2": ["Beschäftigungsbedingungen", "Terms and conditions of employment"],
  "A.6.3": ["Sensibilisierung und Schulungen", "Information security awareness, education and training"],
  "A.6.4": ["Disziplinarverfahren", "Disciplinary process"],
  "A.6.5": ["Verantwortung nach Beschäftigungsende", "Responsibilities after termination or change of employment"],
  "A.6.6": ["Vertraulichkeitsvereinbarungen", "Confidentiality or non-disclosure agreements"],
  "A.6.7": ["Telearbeit", "Remote working"],
  "A.6.8": ["Meldung von Sicherheitsereignissen", "Information security event reporting"],
  "A.7.1": ["Physische Sicherheitsperimeter", "Physical security perimeters"],
  "A.7.2": ["Physische Eingangskontrollen", "Physical entry"],
  "A.7.3": ["Sicherung von Büros, Räumen und Einrichtungen", "Securing offices, rooms and facilities"],
  "A.7.4": ["Überwachung der physischen Sicherheit", "Physical security monitoring"],
  "A.7.5": ["Schutz gegen physische und umweltbedingte Bedrohungen", "Protecting against physical and environmental threats"],
  "A.7.6": ["Arbeiten in sicheren Bereichen", "Working in secure areas"],
  "A.7.7": ["Clear Desk und Clear Screen", "Clear desk and clear screen"],
  "A.7.8": ["Standortwahl und Schutz von Geräten", "Equipment siting and protection"],
  "A.7.9": ["Sicherheit von Geräten außerhalb des Standorts", "Security of assets off-premises"],
  "A.7.10": ["Speichermedien", "Storage media"],
  "A.7.11": ["Versorgungseinrichtungen", "Supporting utilities"],
  "A.7.12": ["Verkabelungssicherheit", "Cabling security"],
  "A.7.13": ["Wartung von Geräten", "Equipment maintenance"],
  "A.7.14": ["Sichere Entsorgung oder Wiederverwendung", "Secure disposal or re-use of equipment"],
  "A.8.1": ["Endgeräte der Benutzer", "User end point devices"],
  "A.8.2": ["Privilegierte Zugriffsrechte", "Privileged access rights"],
  "A.8.3": ["Informationszugriffsbeschränkung", "Information access restriction"],
  "A.8.4": ["Zugriff auf Quellcode", "Access to source code"],
  "A.8.5": ["Sichere Authentifizierung", "Secure authentication"],
  "A.8.6": ["Kapazitätsmanagement", "Capacity management"],
  "A.8.7": ["Schutz vor Schadsoftware", "Protection against malware"],
  "A.8.8": ["Management technischer Schwachstellen", "Management of technical vulnerabilities"],
  "A.8.9": ["Konfigurationsmanagement", "Configuration management"],
  "A.8.10": ["Löschung von Informationen", "Information deletion"],
  "A.8.11": ["Datenmaskierung", "Data masking"],
  "A.8.12": ["Verhinderung von Datenabfluss", "Data leakage prevention"],
  "A.8.13": ["Sicherung von Informationen", "Information backup"],
  "A.8.14": ["Redundanz von Informationsverarbeitung", "Redundancy of information processing facilities"],
  "A.8.15": ["Protokollierung", "Logging"],
  "A.8.16": ["Monitoring-Aktivitäten", "Monitoring activities"],
  "A.8.17": ["Uhrensynchronisation", "Clock synchronization"],
  "A.8.18": ["Nutzung privilegierter Dienstprogramme", "Use of privileged utility programs"],
  "A.8.19": ["Software-Installation auf operativen Systemen", "Installation of software on operational systems"],
  "A.8.20": ["Netzwerksicherheit", "Networks security"],
  "A.8.21": ["Sicherheit von Netzwerkdiensten", "Security of network services"],
  "A.8.22": ["Trennung von Netzwerken", "Segregation of networks"],
  "A.8.23": ["Web-Filterung", "Web filtering"],
  "A.8.24": ["Verwendung von Kryptographie", "Use of cryptography"],
  "A.8.25": ["Sicherer Entwicklungslebenszyklus", "Secure development life cycle"],
  "A.8.26": ["Anforderungen an Anwendungssicherheit", "Application security requirements"],
  "A.8.27": ["Sichere Systemarchitektur", "Secure system architecture and engineering principles"],
  "A.8.28": ["Sichere Codierung", "Secure coding"],
  "A.8.29": ["Sicherheitstests in Entwicklung", "Security testing in development and acceptance"],
  "A.8.30": ["Ausgelagerte Entwicklung", "Outsourced development"],
  "A.8.31": ["Trennung von Entwicklungs-, Test- und Produktionsumgebungen", "Separation of development, test and production environments"],
  "A.8.32": ["Änderungsmanagement", "Change management"],
  "A.8.33": ["Testdaten", "Test information"],
  "A.8.34": ["Schutz von Informationssystemen während der Auditierung", "Protection of information systems during audit testing"],
  "4.1": ["Verstehen der Organisation und ihres Kontextes", "Understanding the organization and its context"],
  "4.2": ["Verstehen der Erfordernisse und Erwartungen interessierter Parteien", "Understanding the needs and expectations of interested parties"],
  "4.3": ["Festlegen des Anwendungsbereichs des ISMS", "Determining the scope of the ISMS"],
  "4.4": ["Informationssicherheitsmanagementsystem", "Information security management system"],
  "5.1": ["Führung und Verpflichtung", "Leadership and commitment"],
  "5.2": ["Informationssicherheitspolitik", "Policy"],
  "5.3": ["Rollen, Verantwortlichkeiten und Befugnisse", "Organizational roles, responsibilities and authorities"],
  "6.1.1": ["Maßnahmen zum Umgang mit Risiken und Chancen – Allgemeines", "Actions to address risks and opportunities – General"],
  "6.1.2": ["Informationssicherheitsrisikobeurteilung", "Information security risk assessment"],
  "6.1.3": ["Informationssicherheitsrisikobehandlung", "Information security risk treatment"],
  "6.2": ["Informationssicherheitsziele und Planung zu deren Erreichung", "Information security objectives and planning to achieve them"],
  "6.3": ["Planung von Änderungen", "Planning of changes"],
  "7.1": ["Ressourcen", "Resources"],
  "7.2": ["Kompetenz", "Competence"],
  "7.3": ["Bewusstsein", "Awareness"],
  "7.4": ["Kommunikation", "Communication"],
  "7.5.1": ["Dokumentierte Information – Allgemeines", "Documented information – General"],
  "7.5.2": ["Erstellen und Aktualisieren dokumentierter Information", "Creating and updating documented information"],
  "7.5.3": ["Lenkung dokumentierter Information", "Control of documented information"],
  "8.1": ["Betriebliche Planung und Steuerung", "Operational planning and control"],
  "8.2": ["Informationssicherheitsrisikobeurteilung (Betrieb)", "Information security risk assessment (operation)"],
  "8.3": ["Informationssicherheitsrisikobehandlung (Betrieb)", "Information security risk treatment (operation)"],
  "9.1": ["Überwachung, Messung, Analyse und Bewertung", "Monitoring, measurement, analysis and evaluation"],
  "9.2": ["Internes Audit", "Internal audit"],
  "9.3": ["Managementbewertung", "Management review"],
  "10.1": ["Fortlaufende Verbesserung", "Continual improvement"],
  "10.2": ["Nichtkonformität und Korrekturmaßnahmen", "Nonconformity and corrective action"],
  "9.2.1": ["Internes Audit – Allgemeines", "Internal audit – General"],
  "9.2.2": ["Internes Auditprogramm", "Internal audit programme"],
  "9.3.1": ["Managementbewertung – Allgemeines", "Management review – General"],
  "9.3.2": ["Managementbewertung – Eingaben", "Management review inputs"],
  "9.3.3": ["Managementbewertung – Ergebnisse", "Management review results"],
};

/** Interne DB-ID → offizielle Referenz (417 Einträge, generiert). */
const REF_BY_ID: Record<string, string> = {
  // 4.1
  "iso-context": "4.1", "iso-climate": "4.1",
  // 4.2
  "iso-parties-id": "4.2", "iso-parties-requirements": "4.2",
  // 4.3
  "iso-scope": "4.3",
  // 4.4
  "iso-process-design": "4.4", "iso-process-operation": "4.4",
  // 5.1
  "iso-leadership-alignment": "5.1", "iso-leadership-support": "5.1", "c22.1": "5.1", "c22.2": "5.1",
  "c23.1": "5.1", "c23.2": "5.1",
  // 5.2
  "c29.2": "5.2", "iso-policy-commitments": "5.2", "c29.3": "5.2",
  // 5.3
  "c27.2": "5.3", "c27.4": "5.3", "iso-roles": "5.3",
  // 6.1.1
  "iso-isms-risks-opportunities": "6.1.1", "iso-isms-actions": "6.1.1", "iso-isms-action-effectiveness": "6.1.1",
  // 6.1.2
  "c29.1": "6.1.2", "c30.4": "6.1.2", "c30.1": "6.1.2", "iso-risk-priority": "6.1.2",
  "iso-risk-owner": "6.1.2",
  // 6.1.3
  "c30.2": "6.1.3", "iso-annex-comparison": "6.1.3", "iso-soa-inclusions": "6.1.3", "iso-soa-exclusions": "6.1.3",
  "iso-soa-status": "6.1.3", "c30.5": "6.1.3", "c30.3": "6.1.3", "iso-treatment-plan-approval": "6.1.3",
  "iso-residual-acceptance": "6.1.3",
  // 6.2
  "iso-objectives-defined": "6.2", "iso-objective-plans": "6.2", "iso-objective-review": "6.2",
  // 6.3
  "iso-isms-change-plan": "6.3",
  // 7.2
  "c40.6": "7.2", "iso-competence-actions": "7.2", "trn-07": "7.2", "trn-03": "7.2",
  "trn-05": "7.2", "iso-auditor-selection": "7.2",
  // 7.3
  "trn-04": "7.3", "trn-02": "7.3", "iso-isms-awareness": "7.3",
  // 7.4
  "iso-communication": "7.4",
  // 7.5.1
  "c29.5": "7.5.1", "iso-document-needs": "7.5.1",
  // 7.5.2
  "iso-document-release": "7.5.2",
  // 7.5.3
  "iso-external-documents": "7.5.3", "c40.2": "7.5.3",
  // 8.1
  "iso-isms-unintended-change": "8.1", "c51.5": "8.1", "c53.2": "8.1",
  // 8.2
  "c30.6": "8.2",
  // 9.1
  "rec-metric": "9.1", "c37.1": "9.1", "iso-isms-measurement-design": "9.1", "c37.2": "9.1",
  "iso-isms-performance": "9.1",
  // 9.2.1
  "c37.4": "9.2.1", "iso-audit-plan": "9.2.1", "iso-audit-execution": "9.2.1",
  // 9.2.2
  "iso-audit-reporting": "9.2.2",
  // 9.3.1
  "iso-mr-conduct": "9.3.1",
  // 9.3.2
  "iso-mr-inputs": "9.3.2",
  // 9.3.3
  "iso-mr-decisions": "9.3.3",
  // 10.1
  "iso-mr-follow-up": "10.1", "iso-continual-improvement": "10.1",
  // 10.2
  "c47.1": "10.2", "iso-nc-correction": "10.2", "iso-nc-cause": "10.2", "iso-nc-extent": "10.2",
  "iso-nc-recurrence": "10.2", "iso-nc-effectiveness": "10.2", "c47.2": "10.2",
  // A.5.1
  "c29.4": "A.5.1",
  // A.5.3
  "c27.3": "A.5.3",
  // A.5.5
  "iso-authority-contacts": "A.5.5",
  // A.5.6
  "iso-security-forums": "A.5.6",
  // A.5.7
  "d04-08": "A.5.7", "iso-threat-sources": "A.5.7", "iso-threat-analysis": "A.5.7",
  // A.5.8
  "iso-project-risks": "A.5.8", "iso-project-requirements": "A.5.8", "d04-01": "A.5.8", "d04-03": "A.5.8",
  // A.5.9
  "c42.1": "A.5.9", "iso-information-inventory": "A.5.9", "c42.3": "A.5.9", "c42.4": "A.5.9",
  // A.5.10
  "c42.5": "A.5.10",
  // A.5.11
  "c40.12": "A.5.11", "iso-asset-change": "A.5.11", "c52.8": "A.5.11",
  // A.5.12
  "c42.2": "A.5.12", "info-class": "A.5.12", "iso-information-ia": "A.5.12", "info-class-rev": "A.5.12",
  // A.5.13
  "info-label": "A.5.13",
  // A.5.14
  "c42.6": "A.5.14", "data-outflow": "A.5.14", "c42.9": "A.5.14", "c41.2": "A.5.14",
  "c41.5": "A.5.14",
  // A.5.15
  "iso-access-coordination": "A.5.15", "c46.1": "A.5.15",
  // A.5.16
  "c40.10": "A.5.16", "c40.11": "A.5.16",
  // A.5.17
  "c41.11": "A.5.17", "c41.6": "A.5.17", "c41.7": "A.5.17", "c41.13": "A.5.17",
  "c41.14": "A.5.17", "trn-auth": "A.5.17",
  // A.5.18
  "c40.3": "A.5.18", "access-recert": "A.5.18", "c43.1": "A.5.18", "sup-access-window": "A.5.18",
  // A.5.19
  "c51.1": "A.5.19", "c51.2": "A.5.19", "c51.3": "A.5.19", "c51.4": "A.5.19",
  "c49.4": "A.5.19", "c49.2": "A.5.19", "sup-loc": "A.5.19", "c49.1": "A.5.19",
  "c52.4": "A.5.19",
  // A.5.20
  "sup-resp": "A.5.20", "c52.1": "A.5.20", "c52.3": "A.5.20", "c52.5": "A.5.20",
  // A.5.21
  "d04-10": "A.5.21", "d04-12": "A.5.21", "c52.7": "A.5.21", "sup-auth": "A.5.21",
  // A.5.22
  "c53.1": "A.5.22",
  // A.5.23
  "c39.3": "A.5.23", "iso-cloud-lifecycle": "A.5.23", "sup-exit-test": "A.5.23",
  // A.5.24
  "d02-12": "A.5.24", "ir-time": "A.5.24", "d02-05": "A.5.24", "d02-14": "A.5.24",
  "d02-18": "A.5.24", "d02-19": "A.5.24",
  // A.5.25
  "d02-03": "A.5.25", "d02-04": "A.5.25", "d02-15": "A.5.25",
  // A.5.26
  "d02-16": "A.5.26", "d02-07": "A.5.26", "d02-08": "A.5.26", "d02-09": "A.5.26",
  // A.5.27
  "d02-10": "A.5.27", "d02-11": "A.5.27",
  // A.5.28
  "d02-17": "A.5.28",
  // A.5.29
  "c41.3": "A.5.29", "c32.4": "A.5.29", "c32.7": "A.5.29",
  // A.5.30
  "bc-bia": "A.5.30", "bc-rto": "A.5.30", "c32.1": "A.5.30", "c32.3": "A.5.30",
  "c32.6": "A.5.30", "trn-bcdr": "A.5.30", "c33.4": "A.5.30", "c33.3": "A.5.30",
  "c32.8": "A.5.30",
  // A.5.31
  "iso-legal-requirements": "A.5.31", "iso-legal-compliance": "A.5.31",
  // A.5.32
  "iso-ip-entitlements": "A.5.32", "iso-ip-usage": "A.5.32",
  // A.5.33
  "iso-record-retention": "A.5.33", "iso-record-safeguards": "A.5.33", "iso-record-readability": "A.5.33", "data-delete": "A.5.33",
  // A.5.34
  "iso-privacy-implementation": "A.5.34", "iso-privacy-responsibilities": "A.5.34",
  // A.5.35
  "iso-review-change": "A.5.35",
  // A.5.36
  "c37.3": "A.5.36",
  // A.5.37
  "iso-operating-procedures": "A.5.37", "d04-11": "A.5.37",
  // A.6.1
  "iso-screening-entry": "A.6.1", "iso-screening-ongoing": "A.6.1", "c40.7": "A.6.1",
  // A.6.2
  "c40.1": "A.6.2", "iso-employer-duties": "A.6.2",
  // A.6.3
  "trn-data": "A.6.3", "trn-09": "A.6.3", "trn-06": "A.6.3", "trn-remote": "A.6.3",
  "trn-12": "A.6.3", "trn-phy": "A.6.3",
  // A.6.4
  "c40.9": "A.6.4",
  // A.6.5
  "c40.8": "A.6.5",
  // A.6.6
  "iso-nda-terms": "A.6.6", "iso-nda-coverage": "A.6.6",
  // A.6.7
  "media-unattended": "A.6.7", "asset-offsite": "A.6.7", "c40.5": "A.6.7", "device-lock": "A.6.7",
  // A.6.8
  "d02-13": "A.6.8",
  // A.7.1
  "phy-zone": "A.7.1", "iso-other-area-perimeters": "A.7.1",
  // A.7.2
  "phy-entry-log": "A.7.2", "phy-access-test": "A.7.2",
  // A.7.3
  "phy-siting": "A.7.3", "c46.2": "A.7.3", "iso-other-facility-exposure": "A.7.3", "iso-other-facility-hazards": "A.7.3",
  // A.7.4
  "c46.4": "A.7.4",
  // A.7.5
  "env-risk": "A.7.5", "phy-climate": "A.7.5", "c46.5": "A.7.5",
  // A.7.6
  "phy-work": "A.7.6", "iso-other-secure-area-work": "A.7.6",
  // A.7.7
  "iso-display-clearing": "A.7.7", "c41.9": "A.7.7",
  // A.7.8
  "iso-other-equipment-protection": "A.7.8", "phy-tamper-check": "A.7.8",
  // A.7.10
  "c42.7": "A.7.10", "c42.8": "A.7.10", "c40.4": "A.7.10",
  // A.7.11
  "c46.3": "A.7.11", "c46.6": "A.7.11",
  // A.7.12
  "c46.7": "A.7.12",
  // A.7.13
  "phy-maint": "A.7.13", "phy-return": "A.7.13",
  // A.7.14
  "iso-ip-disposal": "A.7.14",
  // A.8.1
  "c38.3": "A.8.1", "c28.1": "A.8.1",
  // A.8.2
  "c43.2": "A.8.2", "c43.3": "A.8.2", "iso-emergency-authorisation": "A.8.2", "iso-emergency-review": "A.8.2",
  "c43.4": "A.8.2",
  // A.8.3
  "c41.12": "A.8.3",
  // A.8.4
  "d04-16": "A.8.4", "iso-source-read": "A.8.4", "d04-18": "A.8.4",
  // A.8.5
  "c41.1": "A.8.5", "iso-login-attempts": "A.8.5", "c41.10": "A.8.5",
  // A.8.6
  "sys-cap": "A.8.6",
  // A.8.7
  "iso-malware-coverage": "A.8.7",
  // A.8.8
  "d04-13": "A.8.8", "d04-25": "A.8.8", "d04-26": "A.8.8", "d04-27": "A.8.8",
  "d04-28": "A.8.8", "d04-31": "A.8.8", "d04-30": "A.8.8", "d04-32": "A.8.8",
  "d04-35": "A.8.8", "d04-36": "A.8.8", "d04-34": "A.8.8",
  // A.8.9
  "c38.5": "A.8.9", "chg-auth": "A.8.9", "d04-05": "A.8.9",
  // A.8.11
  "data-mask": "A.8.11", "d04-22": "A.8.11",
  // A.8.13
  "bc-rpo": "A.8.13", "c32.2": "A.8.13", "c33.2": "A.8.13", "c32.5": "A.8.13",
  "c33.1": "A.8.13",
  // A.8.14
  "c44.7": "A.8.14",
  // A.8.15
  "log-ret-def": "A.8.15", "c44.1": "A.8.15", "c44.2": "A.8.15", "c44.3": "A.8.15",
  "c44.4": "A.8.15", "log-priv": "A.8.15", "c44.5": "A.8.15",
  // A.8.16
  "mon-risk": "A.8.16", "mon-base": "A.8.16", "d02-01": "A.8.16", "c44.8": "A.8.16",
  "d02-02": "A.8.16",
  // A.8.17
  "c44.6": "A.8.17",
  // A.8.20
  "c38.6": "A.8.20", "c38.9": "A.8.20", "net-filter": "A.8.20", "wifi-auth": "A.8.20",
  "c38.13": "A.8.20",
  // A.8.21
  "iso-network-service-requirements": "A.8.21", "iso-network-service-assurance": "A.8.21",
  // A.8.22
  "c38.4": "A.8.22", "c38.12": "A.8.22", "c38.10": "A.8.22", "c38.11": "A.8.22",
  "wifi-seg": "A.8.22",
  // A.8.23
  "iso-web-rules": "A.8.23", "iso-web-enforcement": "A.8.23",
  // A.8.24
  "c39.1": "A.8.24", "crypto-inv": "A.8.24", "c39.2": "A.8.24", "c39.4": "A.8.24",
  // A.8.25
  "d04-04": "A.8.25", "d04-17": "A.8.25",
  // A.8.26
  "d04-02": "A.8.26",
  // A.8.27
  "d04-14": "A.8.27",
  // A.8.28
  "d04-15": "A.8.28",
  // A.8.29
  "d04-19": "A.8.29",
  // A.8.30
  "d04-23": "A.8.30",
  // A.8.32
  "d04-06": "A.8.32", "chg-rollback": "A.8.32", "d04-07": "A.8.32", "d04-24": "A.8.32",
  // A.8.33
  "d04-20": "A.8.33", "iso-test-selection": "A.8.33", "d04-21": "A.8.33", "iso-test-protection": "A.8.33",
  // A.8.34
  "c37.5": "A.8.34",
};

/** Vollständige Map: interne ID → { ref, titleDe, titleEn, kind }. */
export const ISO_ANNEX: Record<string, IsoAnnexEntry> = Object.fromEntries(
  Object.entries(REF_BY_ID).map(([id, ref]) => {
    const t = TITLES[ref] ?? [ref, ref];
    return [id, { ref, titleDe: t[0], titleEn: t[1], kind: ref.startsWith("A.") ? "annex" : "clause" } as IsoAnnexEntry];
  }),
);

/**
 * Alle ISO-Referenzen je Kontrolle (nicht nur die erste). Eine v6-Kontrolle
 * kann mehrere Annex-A-Kontrollen abdecken; 8 der 93 Annex-A-Kontrollen
 * (A.5.2, A.5.4, A.7.9, A.8.10, A.8.12, A.8.18, A.8.19, A.8.31) kommen NUR
 * als Zweitreferenz vor. Fuer die SoA-Abdeckung (alle 93 adressiert?) muss
 * daher diese Liste benutzt werden, nicht REF_BY_ID.
 */
const REFS_BY_ID: Record<string, string[]> = {
  "iso-context": ["4.1"],
  "iso-parties-id": ["4.2"],
  "iso-parties-requirements": ["4.2"],
  "iso-climate": ["4.1", "4.2"],
  "iso-scope": ["4.3"],
  "iso-legal-requirements": ["A.5.31"],
  "iso-legal-compliance": ["A.5.31", "A.5.36"],
  "iso-authority-contacts": ["A.5.5"],
  "iso-process-design": ["4.4", "8.1"],
  "iso-process-operation": ["4.4", "5.1", "8.1"],
  "iso-leadership-alignment": ["5.1"],
  "iso-leadership-support": ["5.1"],
  "c22.1": ["5.1", "5.2", "A.5.1"],
  "c22.2": ["5.1", "7.1", "A.5.4"],
  "iso-objectives-defined": ["6.2"],
  "iso-objective-plans": ["6.2"],
  "iso-objective-review": ["6.2", "9.1"],
  "c27.3": ["A.5.3"],
  "c27.2": ["5.3"],
  "iso-communication": ["7.4"],
  "c23.1": ["5.1"],
  "c23.2": ["5.1", "A.5.4"],
  "c27.4": ["5.3", "A.5.2"],
  "iso-roles": ["5.3", "A.5.2"],
  "iso-isms-change-plan": ["6.3", "8.1"],
  "iso-isms-unintended-change": ["8.1"],
  "iso-isms-risks-opportunities": ["6.1.1"],
  "iso-isms-actions": ["6.1.1"],
  "iso-isms-action-effectiveness": ["6.1.1"],
  "c29.2": ["5.2", "A.5.1"],
  "iso-policy-commitments": ["5.2"],
  "c29.5": ["7.5.1", "7.5.2", "7.5.3", "A.5.33"],
  "iso-document-needs": ["7.5.1"],
  "iso-document-release": ["7.5.2"],
  "iso-external-documents": ["7.5.3"],
  "c29.3": ["5.2", "7.3", "A.5.1", "A.5.4", "A.5.10"],
  "c29.4": ["A.5.1"],
  "c29.1": ["6.1.2"],
  "c30.4": ["6.1.2"],
  "c30.1": ["6.1.2", "8.2"],
  "iso-risk-priority": ["6.1.2"],
  "iso-risk-owner": ["6.1.2"],
  "c30.2": ["6.1.3", "8.3"],
  "iso-annex-comparison": ["6.1.3"],
  "iso-soa-inclusions": ["6.1.3"],
  "iso-soa-exclusions": ["6.1.3"],
  "iso-soa-status": ["6.1.3"],
  "c30.5": ["6.1.3", "8.3"],
  "c30.3": ["6.1.3"],
  "iso-treatment-plan-approval": ["6.1.3"],
  "iso-residual-acceptance": ["6.1.3"],
  "c30.6": ["8.2"],
  "c42.1": ["A.5.9", "A.8.1"],
  "iso-information-inventory": ["A.5.9"],
  "c42.3": ["A.5.9"],
  "c42.2": ["A.5.12"],
  "c42.4": ["A.5.9"],
  "info-class": ["A.5.12"],
  "iso-information-ia": ["A.5.12"],
  "info-label": ["A.5.13"],
  "info-class-rev": ["A.5.12"],
  "iso-privacy-implementation": ["A.5.34"],
  "iso-privacy-responsibilities": ["A.5.34"],
  "c42.5": ["A.5.10"],
  "c42.6": ["A.5.14"],
  "data-outflow": ["A.5.14", "A.8.12"],
  "data-mask": ["A.8.11"],
  "media-unattended": ["A.6.7", "A.7.7"],
  "iso-display-clearing": ["A.7.7"],
  "asset-offsite": ["A.6.7", "A.7.9", "A.8.1"],
  "c42.7": ["A.7.10"],
  "c42.8": ["A.7.10", "A.8.7"],
  "c42.9": ["A.5.14", "A.7.10"],
  "trn-data": ["A.6.3", "A.7.10"],
  "iso-record-retention": ["A.5.33"],
  "iso-record-safeguards": ["A.5.33", "7.5.3"],
  "iso-record-readability": ["A.5.33", "7.5.3"],
  "data-delete": ["A.5.33", "A.8.10"],
  "c40.12": ["A.5.11"],
  "iso-asset-change": ["A.5.11"],
  "c40.4": ["A.7.10", "A.7.14", "A.8.10"],
  "iso-ip-entitlements": ["A.5.32"],
  "iso-ip-usage": ["A.5.32"],
  "iso-ip-disposal": ["A.7.14"],
  "iso-screening-entry": ["A.6.1"],
  "iso-screening-ongoing": ["A.6.1"],
  "c40.7": ["A.6.1"],
  "c40.6": ["7.2"],
  "iso-competence-actions": ["7.2"],
  "c40.1": ["A.6.2", "A.6.6"],
  "iso-employer-duties": ["A.6.2"],
  "iso-nda-terms": ["A.6.6"],
  "iso-nda-coverage": ["A.6.6"],
  "c40.9": ["A.6.4"],
  "c40.8": ["A.6.5"],
  "trn-07": ["7.2", "A.6.3"],
  "trn-04": ["7.3", "A.6.3", "A.8.7"],
  "trn-02": ["7.3", "A.6.3"],
  "trn-03": ["7.2", "7.3", "A.6.3"],
  "trn-09": ["A.6.3"],
  "trn-05": ["7.2", "A.6.3"],
  "iso-isms-awareness": ["7.3"],
  "trn-06": ["A.6.3"],
  "c40.2": ["7.5.3", "A.5.15", "A.8.1", "A.8.3"],
  "iso-access-coordination": ["A.5.15"],
  "c40.10": ["A.5.16"],
  "c40.3": ["A.5.18", "A.8.3", "A.8.31"],
  "access-recert": ["A.5.18"],
  "c40.11": ["A.5.16"],
  "c43.2": ["A.8.2"],
  "c43.3": ["A.8.2"],
  "c43.1": ["A.5.18", "A.8.2"],
  "iso-emergency-authorisation": ["A.8.2", "A.5.18"],
  "iso-emergency-review": ["A.8.2"],
  "c40.5": ["A.6.7", "A.8.21"],
  "sup-access-window": ["A.5.18", "A.8.21"],
  "c43.4": ["A.8.2", "A.8.18"],
  "c41.1": ["A.8.5"],
  "iso-login-attempts": ["A.8.5"],
  "c41.11": ["A.5.17", "A.8.5"],
  "c41.6": ["A.5.17", "A.8.5"],
  "device-lock": ["A.6.7", "A.7.7", "A.8.1"],
  "c41.9": ["A.7.7", "A.8.5"],
  "c41.7": ["A.5.17", "A.8.5"],
  "c41.10": ["A.8.5"],
  "c41.12": ["A.8.3", "A.8.5"],
  "c41.13": ["A.5.17", "A.8.5"],
  "c41.14": ["A.5.17"],
  "trn-auth": ["A.5.17", "A.6.3"],
  "trn-remote": ["A.6.3", "A.6.7", "A.7.9"],
  "iso-operating-procedures": ["A.5.37"],
  "iso-network-service-requirements": ["A.8.21"],
  "iso-network-service-assurance": ["A.8.21"],
  "c38.5": ["A.8.9", "A.8.20"],
  "c38.3": ["A.8.1", "A.8.9", "A.8.20"],
  "c38.4": ["A.8.22"],
  "c38.12": ["A.8.22"],
  "c38.10": ["A.8.22"],
  "c38.11": ["A.8.22", "A.8.31"],
  "c38.6": ["A.8.20"],
  "c38.9": ["A.8.20"],
  "c28.1": ["A.8.1", "A.8.7", "A.8.19"],
  "iso-malware-coverage": ["A.8.7"],
  "net-filter": ["A.8.20"],
  "iso-web-rules": ["A.8.23"],
  "iso-web-enforcement": ["A.8.23"],
  "wifi-seg": ["A.8.22"],
  "wifi-auth": ["A.8.20"],
  "sys-cap": ["A.8.6"],
  "c38.13": ["A.8.20"],
  "c39.1": ["A.8.24"],
  "crypto-inv": ["A.8.24"],
  "c39.2": ["A.8.24"],
  "c39.3": ["A.5.23", "A.8.24"],
  "c39.4": ["A.8.24"],
  "c41.2": ["A.5.14"],
  "c41.5": ["A.5.14", "A.8.21"],
  "c41.3": ["A.5.29"],
  "iso-project-risks": ["A.5.8"],
  "iso-project-requirements": ["A.5.8"],
  "d04-01": ["A.5.8", "A.8.26"],
  "d04-02": ["A.8.26", "A.8.27"],
  "d04-10": ["A.5.21"],
  "d04-11": ["A.5.37"],
  "d04-12": ["A.5.21"],
  "d04-03": ["A.5.8", "A.8.26", "A.8.29"],
  "d04-13": ["A.8.8"],
  "d04-04": ["A.8.25"],
  "d04-23": ["A.8.30"],
  "d04-14": ["A.8.27"],
  "d04-16": ["A.8.4", "A.8.31"],
  "iso-source-read": ["A.8.4"],
  "d04-18": ["A.8.4", "A.8.28"],
  "d04-15": ["A.8.28"],
  "d04-17": ["A.8.25"],
  "d04-20": ["A.8.33"],
  "iso-test-selection": ["A.8.33"],
  "d04-22": ["A.8.11", "A.8.33"],
  "d04-21": ["A.8.33"],
  "iso-test-protection": ["A.8.33"],
  "d04-19": ["A.8.29", "A.8.30"],
  "d04-06": ["A.8.32"],
  "chg-rollback": ["A.8.32"],
  "d04-07": ["A.8.32"],
  "chg-auth": ["A.8.9", "A.8.19", "A.8.32"],
  "d04-05": ["A.8.9", "A.8.19", "A.8.32"],
  "d04-24": ["A.8.32"],
  "d04-08": ["A.5.7", "A.8.8"],
  "iso-security-forums": ["A.5.6"],
  "iso-threat-sources": ["A.5.7"],
  "iso-threat-analysis": ["A.5.7"],
  "d04-25": ["A.8.8"],
  "d04-26": ["A.8.8"],
  "d04-27": ["A.8.8"],
  "d04-28": ["A.8.8"],
  "d04-31": ["A.8.8"],
  "d04-30": ["A.8.8"],
  "d04-32": ["A.8.8"],
  "d04-35": ["A.8.8"],
  "d04-36": ["A.8.8"],
  "d04-34": ["A.8.8"],
  "mon-risk": ["A.8.16"],
  "mon-base": ["A.8.16"],
  "d02-01": ["A.8.16"],
  "c44.6": ["A.8.17"],
  "log-ret-def": ["A.8.15"],
  "c44.1": ["A.8.15"],
  "c44.2": ["A.8.15"],
  "c44.3": ["A.8.15"],
  "c44.4": ["A.8.15"],
  "log-priv": ["A.8.15", "A.8.18"],
  "c44.5": ["A.8.15", "A.8.16"],
  "c44.7": ["A.8.14"],
  "c44.8": ["A.8.16"],
  "d02-02": ["A.8.16"],
  "d02-12": ["A.5.24"],
  "ir-time": ["A.5.24", "A.5.26"],
  "d02-05": ["A.5.24"],
  "d02-13": ["A.6.8"],
  "d02-14": ["A.5.24", "A.6.3", "A.6.8"],
  "d02-03": ["A.5.25"],
  "d02-04": ["A.5.25"],
  "d02-15": ["A.5.25"],
  "d02-16": ["A.5.26"],
  "d02-17": ["A.5.28"],
  "d02-07": ["A.5.26", "A.8.7"],
  "d02-08": ["A.5.26", "A.8.7"],
  "d02-09": ["A.5.26"],
  "d02-10": ["A.5.27"],
  "d02-11": ["A.5.27"],
  "d02-18": ["A.5.24"],
  "d02-19": ["A.5.24", "A.5.27"],
  "bc-bia": ["A.5.30"],
  "bc-rto": ["A.5.30"],
  "c32.1": ["A.5.30"],
  "c32.3": ["A.5.30"],
  "c32.4": ["A.5.29"],
  "c32.6": ["A.5.30", "A.8.14"],
  "bc-rpo": ["A.8.13"],
  "c32.2": ["A.8.13"],
  "c33.2": ["A.8.13"],
  "c32.7": ["A.5.29"],
  "trn-bcdr": ["A.5.30", "A.6.3"],
  "c32.5": ["A.8.13"],
  "c33.1": ["A.8.13"],
  "c33.4": ["A.5.30", "A.8.14"],
  "c33.3": ["A.5.30"],
  "c32.8": ["A.5.30"],
  "rec-metric": ["9.1"],
  "c51.5": ["8.1", "A.5.19"],
  "iso-cloud-lifecycle": ["A.5.23"],
  "c51.1": ["A.5.19"],
  "sup-resp": ["A.5.20", "A.5.23"],
  "c51.2": ["A.5.19"],
  "c51.3": ["A.5.19"],
  "c51.4": ["A.5.19"],
  "c49.4": ["A.5.19"],
  "c49.2": ["A.5.19", "A.5.21", "A.8.30"],
  "sup-loc": ["A.5.19", "A.5.23"],
  "c49.1": ["A.5.19"],
  "c52.1": ["A.5.20", "A.8.21", "A.8.30"],
  "c52.3": ["A.5.20"],
  "c52.7": ["A.5.21", "A.5.22"],
  "c52.5": ["A.5.20"],
  "c52.4": ["A.5.19"],
  "sup-auth": ["A.5.21"],
  "trn-12": ["A.6.3"],
  "c53.1": ["A.5.22"],
  "c53.2": ["8.1", "A.5.22", "A.8.21", "A.8.30"],
  "sup-exit-test": ["A.5.23"],
  "c52.8": ["A.5.11", "A.5.20", "A.5.23"],
  "env-risk": ["A.7.5"],
  "phy-zone": ["A.7.1"],
  "iso-other-area-perimeters": ["A.7.1"],
  "c46.1": ["A.5.15", "A.7.1", "A.7.2", "A.7.3"],
  "phy-entry-log": ["A.7.2", "A.7.4"],
  "c46.4": ["A.7.4"],
  "phy-work": ["A.7.6"],
  "iso-other-secure-area-work": ["A.7.6"],
  "trn-phy": ["A.6.3", "A.7.6"],
  "phy-access-test": ["A.7.2"],
  "phy-siting": ["A.7.3", "A.7.8"],
  "iso-other-equipment-protection": ["A.7.8"],
  "phy-tamper-check": ["A.7.8"],
  "c46.2": ["A.7.3", "A.7.5", "A.7.8"],
  "iso-other-facility-exposure": ["A.7.3"],
  "iso-other-facility-hazards": ["A.7.3", "A.7.5"],
  "c46.3": ["A.7.11"],
  "phy-climate": ["A.7.5", "A.7.11"],
  "c46.7": ["A.7.12"],
  "c46.6": ["A.7.11"],
  "phy-maint": ["A.7.13"],
  "phy-return": ["A.7.13"],
  "c46.5": ["A.7.5", "A.7.11"],
  "c37.1": ["9.1"],
  "iso-isms-measurement-design": ["9.1"],
  "c37.5": ["A.8.34"],
  "c37.2": ["9.1"],
  "iso-isms-performance": ["9.1"],
  "c37.3": ["A.5.36"],
  "c37.4": ["9.2.1", "A.5.35"],
  "iso-review-change": ["A.5.35"],
  "iso-audit-plan": ["9.2.1", "9.2.2"],
  "iso-auditor-selection": ["7.2", "9.2.2"],
  "iso-audit-execution": ["9.2.1", "9.2.2"],
  "iso-audit-reporting": ["9.2.2"],
  "iso-mr-conduct": ["9.3.1"],
  "iso-mr-inputs": ["9.3.2"],
  "iso-mr-decisions": ["9.3.3"],
  "iso-mr-follow-up": ["10.1", "6.3", "9.3.2"],
  "c47.1": ["10.2", "A.5.36"],
  "iso-nc-correction": ["10.2"],
  "iso-nc-cause": ["10.2"],
  "iso-nc-extent": ["10.2"],
  "iso-nc-recurrence": ["10.2"],
  "iso-nc-effectiveness": ["10.2"],
  "c47.2": ["10.2", "A.5.36"],
  "iso-continual-improvement": ["10.1"],
};

/** Anzahl abgedeckter IDs (318). */
export const ISO_ANNEX_COUNT = Object.keys(ISO_ANNEX).length;

function norm(id: string): string {
  return String(id ?? "").trim().toLowerCase().replace(/^iso27001::?/, "");
}

/** Eintrag zu einer internen ID (tolerant: "A5-17", "ISO27001::a5-17"). */
export function isoEntry(id: string): IsoAnnexEntry | undefined {
  return ISO_ANNEX[norm(id)];
}

/** Offizielle Referenz ("A.5.1", "6.1.3") — Fallback: die ID selbst. */
export function isoRef(id: string): string {
  return isoEntry(id)?.ref ?? id;
}

/** Titel (DE/EN) der zugeordneten Annex-Kontrolle/Klausel. */
export function isoTitle(id: string, lang: "de" | "en" = "de"): string {
  const e = isoEntry(id);
  if (!e) return "";
  return lang === "de" ? e.titleDe : e.titleEn;
}

/** "A.5.1 · Informationssicherheitsrichtlinien" — Fallback: die ID selbst. */
export function isoLabel(id: string, lang: "de" | "en" = "de"): string {
  const e = isoEntry(id);
  if (!e) return id;
  return `${e.ref} · ${lang === "de" ? e.titleDe : e.titleEn}`;
}

/** true = Annex-A-Kontrolle (SoA-relevant, ausschließbar); false = Klausel 4–10 oder unbekannt. */
export function isAnnexA(id: string): boolean {
  return isoEntry(id)?.kind === "annex";
}

/** true = Managementsystem-Klausel 4–10 (MUSS, nicht ausschließbar). */
export function isIsoClause(id: string): boolean {
  return isoEntry(id)?.kind === "clause";
}

/** Gruppierungsschlüssel = offizielle Referenz ("A.5.1", "6.1.3"); unbekannt → ID. */
export function annexGroup(id: string): string {
  return isoRef(id);
}

/** Themen-/Kapitelfamilie: "A.5" | "A.6" | "A.7" | "A.8" | "4" … "10"; unbekannt → "". */
export function annexFamily(id: string): string {
  const r = isoEntry(id)?.ref;
  if (!r) return "";
  return r.startsWith("A.") ? r.split(".").slice(0, 2).join(".") : r.split(".")[0];
}

/** Titel der Themen-/Kapitelfamilien (für Gruppierung in Gap-Analyse/SoA). */
export const ISO_FAMILY_TITLES: Record<string, { de: string; en: string }> = {
  "4":   { de: "4 Kontext der Organisation",     en: "4 Context of the organization" },
  "5":   { de: "5 Führung",                       en: "5 Leadership" },
  "6":   { de: "6 Planung",                       en: "6 Planning" },
  "7":   { de: "7 Unterstützung",                 en: "7 Support" },
  "8":   { de: "8 Betrieb",                       en: "8 Operation" },
  "9":   { de: "9 Bewertung der Leistung",        en: "9 Performance evaluation" },
  "10":  { de: "10 Verbesserung",                 en: "10 Improvement" },
  "A.5": { de: "A.5 Organisatorische Maßnahmen",  en: "A.5 Organizational controls" },
  "A.6": { de: "A.6 Personenbezogene Maßnahmen",  en: "A.6 People controls" },
  "A.7": { de: "A.7 Physische Maßnahmen",         en: "A.7 Physical controls" },
  "A.8": { de: "A.8 Technologische Maßnahmen",    en: "A.8 Technological controls" },
};

/** Lesbarer Familien-Titel ("A.5 Organisatorische Maßnahmen"); unbekannt → Familie selbst. */
export function annexFamilyLabel(family: string, lang: "de" | "en" = "de"): string {
  const t = ISO_FAMILY_TITLES[family];
  return t ? (lang === "de" ? t.de : t.en) : family;
}

/** Numerischer Sortier-Schlüssel für Referenzen ("A.5.10" nach "A.5.9", "10.2" nach "9.3"). */
export function annexSortKey(ref: string): number {
  const parts = ref.replace(/^A\./, "").split(".").map((p) => parseInt(p, 10) || 0);
  const annex = ref.startsWith("A.") ? 1 : 0;
  return annex * 1_000_000 + (parts[0] ?? 0) * 10_000 + (parts[1] ?? 0) * 100 + (parts[2] ?? 0);
}

/** Alle Referenzen in Standard-Reihenfolge (Klauseln 4–10, dann A.5.1 … A.8.34). */
/**
 * ALLE vorkommenden ISO-Referenzen — Erst- UND Zweitreferenzen.
 *
 * Vorher wurde nur `REF_BY_ID` ausgewertet, also die ERSTE Referenz jeder
 * Kontrolle. Damit fehlten Referenzen, die im Katalog ausschliesslich als
 * Zweitreferenz vorkommen: die Pflicht-Klauseln **7.1 (Ressourcen)** und
 * **8.3 (Risikobehandlung im Betrieb)** sowie acht Annex-A-Kontrollen. Eine
 * Vollstaendigkeitsliste, in der zwei Pflicht-Klauseln fehlen, ist fuer
 * ISO/IEC 27001 falsch — Kapitel 4-10 sind samt und sonders Pflicht.
 * Gemessen 12.09.2026: vorher 28 Klauseln, jetzt 30.
 */
export function allIsoRefs(): string[] {
  const all = new Set<string>();
  for (const refs of Object.values(REFS_BY_ID)) for (const r of refs) all.add(r);
  for (const r of Object.values(REF_BY_ID)) all.add(r);
  return Array.from(all).sort((a, b) => annexSortKey(a) - annexSortKey(b));
}


// ===========================================================================
// 93er-Sicht: ISO 27001:2022 Annex A hat 93 Kontrollen. Unser Katalog oeffnet
// sie in 318 pruefbare Kontrollen auf. Fuer SoA, Gap-Bericht und Audit muss die
// Gruppierung auf der Ebene dieser 93 Ueberschriften moeglich sein — sonst
// verliert der Katalog seinen Bezug zur Norm.
// ===========================================================================

/** Die 93 Annex-A-Kontrollen in Normreihenfolge. */
export const ISO_ANNEX_A_93: string[] = [
  "A.5.1",
  "A.5.2",
  "A.5.3",
  "A.5.4",
  "A.5.5",
  "A.5.6",
  "A.5.7",
  "A.5.8",
  "A.5.9",
  "A.5.10",
  "A.5.11",
  "A.5.12",
  "A.5.13",
  "A.5.14",
  "A.5.15",
  "A.5.16",
  "A.5.17",
  "A.5.18",
  "A.5.19",
  "A.5.20",
  "A.5.21",
  "A.5.22",
  "A.5.23",
  "A.5.24",
  "A.5.25",
  "A.5.26",
  "A.5.27",
  "A.5.28",
  "A.5.29",
  "A.5.30",
  "A.5.31",
  "A.5.32",
  "A.5.33",
  "A.5.34",
  "A.5.35",
  "A.5.36",
  "A.5.37",
  "A.6.1",
  "A.6.2",
  "A.6.3",
  "A.6.4",
  "A.6.5",
  "A.6.6",
  "A.6.7",
  "A.6.8",
  "A.7.1",
  "A.7.2",
  "A.7.3",
  "A.7.4",
  "A.7.5",
  "A.7.6",
  "A.7.7",
  "A.7.8",
  "A.7.9",
  "A.7.10",
  "A.7.11",
  "A.7.12",
  "A.7.13",
  "A.7.14",
  "A.8.1",
  "A.8.2",
  "A.8.3",
  "A.8.4",
  "A.8.5",
  "A.8.6",
  "A.8.7",
  "A.8.8",
  "A.8.9",
  "A.8.10",
  "A.8.11",
  "A.8.12",
  "A.8.13",
  "A.8.14",
  "A.8.15",
  "A.8.16",
  "A.8.17",
  "A.8.18",
  "A.8.19",
  "A.8.20",
  "A.8.21",
  "A.8.22",
  "A.8.23",
  "A.8.24",
  "A.8.25",
  "A.8.26",
  "A.8.27",
  "A.8.28",
  "A.8.29",
  "A.8.30",
  "A.8.31",
  "A.8.32",
  "A.8.33",
  "A.8.34",
];

/** Alle ISO-Referenzen einer Kontrolle (erste = spezifischste). */
export function isoRefsAll(id: string): string[] {
  return REFS_BY_ID[norm(id)] ?? [];
}

/** true = die Kontrolle adressiert diese Annex-/Klausel-Referenz (auch als Zweitreferenz). */
export function coversRef(id: string, ref: string): boolean {
  return isoRefsAll(id).includes(ref);
}

/**
 * Pflicht-Klausel-Referenzen einer Kontrolle (ISO/IEC 27001 Kapitel 4-10).
 *
 * Die Klauseln 4-10 sind Anforderungen an das Managementsystem und NICHT
 * ausschliessbar. ISO/IEC 27001 6.1.3 d erlaubt einen begruendeten Ausschluss
 * ausschliesslich fuer die 93 Annex-A-Kontrollen. Wer also eine Annex-A-
 * Ueberschrift auf "nicht anwendbar" setzt, darf damit keine Kontrolle
 * abschalten, die zugleich eine Klausel bedient - z. B. bedient eine
 * Aufzeichnungsschutz-Kontrolle sowohl A.5.33 als auch 7.5.3.
 */
export function isoClauseRefs(id: string): string[] {
  return isoRefsAll(id).filter((r) => !r.startsWith("A."));
}

/** true = die Kontrolle traegt zu mindestens einer Pflicht-Klausel bei (kein Ausschluss moeglich). */
export function isMandatoryClauseControl(id: string): boolean {
  return isoClauseRefs(id).length > 0;
}

/** Kontroll-IDs, die eine Referenz abdecken (Zweitreferenzen eingeschlossen). */
export function controlIdsForRef(ref: string): string[] {
  return Object.keys(REFS_BY_ID).filter((id) => REFS_BY_ID[id].includes(ref));
}

/**
 * Abdeckung der 93 Annex-A-Kontrollen: je Ueberschrift die abdeckenden
 * Kontroll-IDs. `direct` = Kontrollen, deren ERSTE Referenz diese Ueberschrift
 * ist (sie werden in der Bewertung unter ihr gruppiert); `all` schliesst
 * Zweitreferenzen ein und ist die fuer die SoA massgebliche Abdeckung.
 */
export function annexCoverage93(): Array<{
  ref: string;
  titleDe: string;
  titleEn: string;
  direct: string[];
  all: string[];
}> {
  return ISO_ANNEX_A_93.map((ref) => {
    const t = TITLES[ref] ?? [ref, ref];
    return {
      ref,
      titleDe: t[0],
      titleEn: t[1],
      direct: Object.keys(REF_BY_ID).filter((id) => REF_BY_ID[id] === ref),
      all: controlIdsForRef(ref),
    };
  });
}

/** Gruppierungs-Label fuer die Bewertung: "A.5.1 · Informationssicherheitsrichtlinien". */
export function annexBucketLabel(ref: string, lang: "de" | "en" = "de"): string {
  const t = TITLES[ref];
  const title = t ? (lang === "de" ? t[0] : t[1]) : "";
  // Managementsystem-Klauseln 4–10 sind KEINE Annex-A-Kontrollen und gehoeren
  // nicht in die SoA; die Beschriftung macht das sichtbar, damit die 93
  // Annex-A-Ueberschriften eindeutig bleiben.
  const isClause = !ref.startsWith("A.");
  const prefix = isClause ? (lang === "de" ? `Klausel ${ref}` : `Clause ${ref}`) : ref;
  return title ? `${prefix} · ${title}` : prefix;
}

/** DE/EN-Titel einer Referenz ("A.5.1", "6.1.3") — unabhaengig von Kontroll-IDs. */
export function annexRefTitles(ref: string): [string, string] | undefined {
  return TITLES[ref];
}
