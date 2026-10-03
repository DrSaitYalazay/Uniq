export type ComplianceStatus = "ja" | "teilweise" | "nein" | "entbehrlich" | null;

export interface ControlQuestion {
  id: string;
  question: string;
  questionEn: string;
  description: string;
  descriptionEn: string;
  status: ComplianceStatus;
  comment?: string;
}

export interface NIS2Category {
  id: string;
  article: string;
  nis2Ref?: string;
  title: string;
  titleEn: string;
  titleDe: string;
  description: string;
  icon: string;
  questions: ControlQuestion[];
}

export interface NIS2Domain {
  id: string;
  title: string;
  titleDe: string;
  description: string;
  descriptionDe: string;
  icon: string;
  categories: NIS2Category[];
}

// =============================================
// DOMAIN 1: ORGANISATORISCHE KONTROLLEN (A.5)
// =============================================

const orgPolicies: NIS2Category = {
  id: "org-policies",
  article: "A.5.1–5.4",
  nis2Ref: "NIS2 Art. 21(2)(a)",
  title: "Sicherheitsrichtlinien & Governance",
  titleEn: "Security Policies & Governance",
  titleDe: "Informationssicherheitsrichtlinien, Rollen und Verantwortlichkeiten",
  description: "Information security policies, roles and responsibilities",
  icon: "shield-check",
  questions: [
    { id: "a-01", question: "Verfügt Ihre Organisation über eine aktuelle, von der Geschäftsleitung freigegebene Informationssicherheitsleitlinie?", questionEn: "Does your organization have an up-to-date information security policy approved by top management?", description: "Eine schriftlich dokumentierte Sicherheitsleitlinie definiert die Sicherheitsziele und das Bekenntnis der Leitungsebene zur IT-Sicherheit.", descriptionEn: "A documented security policy defines the security objectives and top management's commitment to IT security.", status: null },
    { id: "a-13", question: "Ist ein Informationssicherheitsbeauftragter (ISB) bestellt und der Leitungsebene direkt unterstellt?", questionEn: "Has an Information Security Officer (ISO) been appointed and does this person report directly to top management?", description: "Ein dedizierter ISB koordiniert alle Sicherheitsmaßnahmen und berichtet unmittelbar an die Geschäftsleitung.", descriptionEn: "A dedicated ISO coordinates all security measures and reports directly to top management.", status: null },
    { id: "org-01", question: "Sind die Rollen und Verantwortlichkeiten für Informationssicherheit klar definiert und kommuniziert?", questionEn: "Are roles and responsibilities for information security clearly defined and communicated?", description: "Klare Zuweisungen stellen sicher, dass alle Sicherheitsaufgaben verantwortlich wahrgenommen werden.", descriptionEn: "Clear assignments ensure that all security tasks are carried out responsibly.", status: null },
    { id: "org-02", question: "Werden widersprüchliche Aufgaben und Verantwortungsbereiche getrennt (Aufgabentrennung)?", questionEn: "Are conflicting duties and areas of responsibility segregated (segregation of duties)?", description: "Segregation of Duties reduziert das Risiko unbefugter Änderungen oder Missbrauchs.", descriptionEn: "Segregation of duties reduces the risk of unauthorized changes or misuse.", status: null },
    { id: "org-03", question: "Fordert die Geschäftsleitung aktiv die Einhaltung der Sicherheitsrichtlinien von allen Mitarbeitern?", questionEn: "Does top management actively require all employees to comply with security policies?", description: "Management muss Sicherheit aktiv unterstützen und vorleben.", descriptionEn: "Management must actively support and exemplify security.", status: null },
    { id: "org-04", question: "Werden Kontakte zu relevanten Behörden (BSI, CERT-Bund, Aufsichtsbehörden) gepflegt?", questionEn: "Are contacts with relevant authorities (BSI, CERT-Bund, regulatory bodies) maintained?", description: "Kontakte zu Behörden ermöglichen schnelle Reaktion und Informationsaustausch bei Sicherheitsvorfällen.", descriptionEn: "Contacts with authorities enable rapid response and information exchange during security incidents.", status: null },
    { id: "a-14", question: "Werden Risikoakzeptanzen formell von der Leitungsebene genehmigt und dokumentiert?", questionEn: "Are risk acceptances formally approved and documented by top management?", description: "Restrisiken, die nicht mitigiert werden können, müssen von der zuständigen Führungskraft schriftlich akzeptiert werden.", descriptionEn: "Residual risks that cannot be mitigated must be formally accepted in writing by the responsible manager.", status: null },
    { id: "org-06", question: "Werden Betriebsverfahren dokumentiert und den zuständigen Mitarbeitern zugänglich gemacht?", questionEn: "Are operating procedures documented and made available to responsible staff?", description: "Dokumentierte Betriebsverfahren stellen konsistentes und sicheres Arbeiten sicher.", descriptionEn: "Documented operating procedures ensure consistent and secure operations.", status: null },
    { id: "gov-01", question: "Hat die Geschäftsleitung eine NIS2-spezifische Schulung absolviert?", questionEn: "Has top management completed NIS2-specific training?", description: "Art. 20 NIS2 schreibt vor, dass die Geschäftsleitung persönlich für Cybersicherheit haftet und geschult sein muss.", descriptionEn: "Art. 20 NIS2 requires top management to be personally liable for cybersecurity and to be trained.", status: null },
    { id: "gov-02", question: "Wurde ein dediziertes NIS2-Compliance-Budget genehmigt und freigegeben?", questionEn: "Has a dedicated NIS2 compliance budget been approved and allocated?", description: "Ein eigenes Budget für NIS2-Maßnahmen stellt sicher, dass Ressourcen für die Umsetzung zur Verfügung stehen.", descriptionEn: "A dedicated budget for NIS2 measures ensures resources are available for implementation.", status: null },
    { id: "reg-01", question: "Hat sich die Organisation fristgerecht bei der zuständigen Behörde registriert (Registrierungspflicht NIS2 Art. 27)?", questionEn: "Has the organization registered with the competent authority within the statutory deadline (NIS2 Art. 27 registration duty)?", description: "NIS2 Art. 27 verpflichtet wesentliche und wichtige Einrichtungen zur Registrierung bei der zuständigen Behörde innerhalb der gesetzlichen Frist.", descriptionEn: "NIS2 Art. 27 obliges essential and important entities to register with the competent authority within the statutory deadline.", status: null },
    { id: "reg-02", question: "Wurde eine dokumentierte Selbsteinstufung (wesentliche/wichtige Einrichtung) vorgenommen und aktuell gehalten (NIS2 Art. 3)?", questionEn: "Has a documented self-classification (essential/important entity) been performed and kept up to date (NIS2 Art. 3)?", description: "NIS2 Art. 3 verlangt eine nachvollziehbare und aktuelle Selbsteinstufung der Einrichtung als wesentlich oder wichtig.", descriptionEn: "NIS2 Art. 3 requires a traceable and up-to-date self-classification of the entity as essential or important.", status: null },
    { id: "gov-03", question: "Übt die Geschäftsleitung ihre Überwachungspflicht über die Risikomanagementmaßnahmen aktiv und dokumentiert aus (Art. 20 NIS2)?", questionEn: "Does top management actively and demonstrably exercise its supervisory duty over the risk management measures (Art. 20 NIS2)?", description: "Art. 20 NIS2 macht die Leitungsebene persönlich für die Überwachung der Cybersicherheitsmaßnahmen verantwortlich.", descriptionEn: "Art. 20 NIS2 makes top management personally accountable for supervising cybersecurity measures.", status: null },
    { id: "gov-04", question: "Werden Leitungsentscheidungen zur Cybersicherheit (Billigung, Risikoakzeptanz, Ressourcen) protokolliert und nachweisbar dokumentiert?", questionEn: "Are management decisions on cybersecurity (approval, risk acceptance, resources) logged and demonstrably documented?", description: "Nachweisbare Protokollierung der Leitungsentscheidungen ist Voraussetzung für die Erfüllung der Aufsichtspflicht nach Art. 20 NIS2.", descriptionEn: "Demonstrable logging of management decisions is a prerequisite for fulfilling the supervisory duty under Art. 20 NIS2.", status: null },
  ],
};

const orgRisk: NIS2Category = {
  id: "org-risk",
  article: "A.5.7–5.8",
  nis2Ref: "NIS2 Art. 21(2)(a)",
  title: "Risikomanagement & Bedrohungsintelligenz",
  titleEn: "Risk Management & Threat Intelligence",
  titleDe: "Risikoanalyse, Bedrohungsintelligenz und Sicherheit im Projektmanagement",
  description: "Risk analysis, threat intelligence and project security",
  icon: "shield-check",
  questions: [
    { id: "a-02", question: "Wird regelmäßig (mindestens jährlich) eine systematische Risikoanalyse für alle IT-Systeme und Fachverfahren durchgeführt?", questionEn: "Is a systematic risk analysis conducted regularly (at least annually) for all IT systems and business processes?", description: "Eine strukturierte Risikoanalyse bewertet Bedrohungen, Schwachstellen und deren Auswirkungen auf die Geschäftsprozesse.", descriptionEn: "A structured risk analysis assesses threats, vulnerabilities, and their impact on business processes.", status: null },
    { id: "a-07", question: "Existiert ein dokumentierter Datenmanagement-Prozess mit Klassifizierung der Daten nach Schutzbedarf?", questionEn: "Is there a documented data management process with data classification according to protection requirements?", description: "Daten werden nach Vertraulichkeit, Integrität und Verfügbarkeit klassifiziert (z.B. öffentlich, intern, vertraulich, streng vertraulich).", descriptionEn: "Data is classified by confidentiality, integrity, and availability (e.g., public, internal, confidential, strictly confidential).", status: null },
    { id: "org-07", question: "Werden Informationen über Bedrohungen systematisch gesammelt und analysiert (Threat Intelligence)?", questionEn: "Is threat intelligence systematically collected and analyzed?", description: "Ein Threat-Intelligence-Programm identifiziert relevante Bedrohungen und leitet daraus Schutzmaßnahmen ab.", descriptionEn: "A threat intelligence program identifies relevant threats and derives protective measures.", status: null },
    { id: "org-08", question: "Wird Informationssicherheit in das Projektmanagement integriert?", questionEn: "Is information security integrated into project management?", description: "Sicherheitsanforderungen werden von Beginn an in Projekte einbezogen und über den gesamten Lebenszyklus verfolgt.", descriptionEn: "Security requirements are included in projects from the start and tracked throughout the lifecycle.", status: null },
    { id: "a-15", question: "Gibt es ein Verzeichnis aller Datenverarbeitungstätigkeiten mit Bezug zur IT-Sicherheit?", questionEn: "Is there a registry of all data processing activities related to IT security?", description: "Ergänzend zum DSGVO-Verzeichnis werden sicherheitsrelevante Aspekte jeder Datenverarbeitung dokumentiert.", descriptionEn: "In addition to the GDPR registry, security-relevant aspects of each data processing activity are documented.", status: null },
    { id: "risk-01", question: "Werden Risikoszenarien für kritische Geschäftsprozesse modelliert und dokumentiert?", questionEn: "Are risk scenarios modeled and documented for critical business processes?", description: "Risikoszenarien beschreiben mögliche Bedrohungsketten und deren Auswirkungen auf den Geschäftsbetrieb.", descriptionEn: "Risk scenarios describe possible threat chains and their impact on business operations.", status: null },
    { id: "risk-02", question: "Gibt es eine dokumentierte Methodik zur Risikobewertung (z.B. NIST, ISO 27005)?", questionEn: "Is there a documented risk assessment methodology (e.g., NIST, ISO 27005)?", description: "Eine standardisierte Methodik gewährleistet konsistente und nachvollziehbare Risikobewertungen.", descriptionEn: "A standardized methodology ensures consistent and traceable risk assessments.", status: null },
    { id: "risk-03", question: "Existiert ein dokumentierter Risikobehandlungsplan, dessen Maßnahmen mit Verantwortlichen und Fristen nachverfolgt und regelmäßig aktualisiert werden?", questionEn: "Is there a documented risk treatment plan whose measures are tracked with owners and deadlines and regularly updated?", description: "Art. 21(2)(a) NIS2 verlangen einen nachvollziehbaren Risikobehandlungsplan mit Owner, Frist und Status.", descriptionEn: "Art. 21(2)(a) NIS2 require a traceable risk treatment plan with owner, deadline and status.", status: null },
  ],
};

const orgAsset: NIS2Category = {
  id: "org-asset",
  article: "A.5.9–5.14",
  nis2Ref: "NIS2 Art. 21(2)(j)",
  title: "Asset Management & Klassifizierung",
  titleEn: "Asset Management & Classification",
  titleDe: "Inventarisierung, Klassifizierung und Handhabung von Informationen und Assets",
  description: "Asset inventory, classification and handling of information",
  icon: "database-backup",
  questions: [
    { id: "a-03", question: "Existiert ein vollständiges und aktuelles Inventar aller Hardware-Geräte (Server, Clients, Netzwerkgeräte, IoT)?", questionEn: "Does a complete and up-to-date inventory of all hardware devices (servers, clients, network devices, IoT) exist?", description: "Ein detailliertes Asset-Inventar umfasst alle physischen und virtuellen Geräte mit Standort, Verantwortlichem und Kritikalitätsbewertung.", descriptionEn: "A detailed asset inventory covers all physical and virtual devices with location, responsible person, and criticality assessment.", status: null },
    { id: "a-04", question: "Gibt es ein gepflegtes Software-Inventar aller eingesetzten Anwendungen und deren Versionen?", questionEn: "Is there a maintained software inventory of all deployed applications and their versions?", description: "Alle Softwareanwendungen sollten inventarisiert sein, einschließlich Lizenzstatus, Version und Supportzeitraum.", descriptionEn: "All software applications should be inventoried, including license status, version, and support period.", status: null },
    { id: "a-16", question: "Werden Cloud-Dienste im Asset-Inventar erfasst und einer Risikoanalyse unterzogen?", questionEn: "Are cloud services included in the asset inventory and subjected to risk analysis?", description: "Alle genutzten Cloud-Services (IaaS, PaaS, SaaS) sind inventarisiert und hinsichtlich Datenschutz und Sicherheit bewertet.", descriptionEn: "All cloud services used (IaaS, PaaS, SaaS) are inventoried and assessed for privacy and security.", status: null },
    { id: "org-09", question: "Sind Regeln für die akzeptable Nutzung von Informationen und Assets definiert und kommuniziert?", questionEn: "Are rules for the acceptable use of information and assets defined and communicated?", description: "Nutzungsrichtlinien beschreiben erlaubtes und unerlaubtes Verhalten im Umgang mit IT-Ressourcen.", descriptionEn: "Usage policies describe permitted and prohibited behavior when handling IT resources.", status: null },
    { id: "org-10", question: "Werden alle organisationseigenen Assets bei Beendigung des Arbeitsverhältnisses zurückgegeben?", questionEn: "Are all organization-owned assets returned upon termination of employment?", description: "Ein Prozess stellt sicher, dass alle physischen und elektronischen Assets bei Austritt zurückgegeben werden.", descriptionEn: "A process ensures that all physical and electronic assets are returned upon departure.", status: null },
    { id: "org-11", question: "Werden Informationen nach den Sicherheitsbedürfnissen der Organisation klassifiziert?", questionEn: "Is information classified according to the organization's security needs?", description: "Ein Klassifizierungsschema (öffentlich, intern, vertraulich, streng vertraulich) wird definiert und angewendet.", descriptionEn: "A classification scheme (public, internal, confidential, strictly confidential) is defined and applied.", status: null },
    { id: "org-12", question: "Werden Informationen entsprechend ihrer Klassifizierung gekennzeichnet (Labelling)?", questionEn: "Is information labeled according to its classification?", description: "Dokumente und Daten werden mit ihrer Klassifizierungsstufe gekennzeichnet.", descriptionEn: "Documents and data are labeled with their classification level.", status: null },
    { id: "org-13", question: "Gibt es Regeln und Verfahren für den sicheren Transfer von Informationen?", questionEn: "Are there rules and procedures for the secure transfer of information?", description: "Informationsübertragung innerhalb und außerhalb der Organisation ist durch Richtlinien geregelt.", descriptionEn: "Information transfer within and outside the organization is governed by policies.", status: null },
    { id: "a-17", question: "Werden Datenflüsse zwischen Systemen und zu externen Partnern dokumentiert und überwacht?", questionEn: "Are data flows between systems and to external partners documented and monitored?", description: "Datenflussdiagramme zeigen, welche Daten wo verarbeitet, gespeichert und wohin übertragen werden.", descriptionEn: "Data flow diagrams show which data is processed, stored, and transferred where.", status: null },
  ],
};

const orgAccess: NIS2Category = {
  id: "org-access",
  article: "A.5.15–5.18",
  nis2Ref: "NIS2 Art. 21(2)(j)",
  title: "Zugriffskontrolle & Identitätsmanagement",
  titleEn: "Access Control & Identity Management",
  titleDe: "Zugriffssteuerung, Identitätsmanagement und Authentifizierung",
  description: "Access control, identity management and authentication",
  icon: "lock",
  questions: [
    { id: "org-14", question: "Sind Regeln für physischen und logischen Zugriff auf Informationen und Assets etabliert?", questionEn: "Are rules for physical and logical access to information and assets established?", description: "Zugriffsregeln basieren auf geschäftlichen und sicherheitstechnischen Anforderungen.", descriptionEn: "Access rules are based on business and security requirements.", status: null },
    { id: "org-15", question: "Wird der vollständige Lebenszyklus von Identitäten verwaltet (Erstellung, Änderung, Deaktivierung)?", questionEn: "Is the full lifecycle of identities managed (creation, modification, deactivation)?", description: "Identity Management umfasst die Verwaltung von Benutzeridentitäten über den gesamten Lebenszyklus.", descriptionEn: "Identity management covers the administration of user identities throughout the entire lifecycle.", status: null },
    { id: "g-03", question: "Gibt es ein zentrales Identitäts- und Zugriffsmanagement (IAM) mit automatisierten On-/Offboarding-Prozessen?", questionEn: "Is there a centralized identity and access management (IAM) system with automated on-/offboarding processes?", description: "IAM-Systeme verwalten Benutzeridentitäten und stellen sicher, dass Zugriffe zeitnah entzogen werden.", descriptionEn: "IAM systems manage user identities and ensure that access rights are revoked promptly.", status: null },
    { id: "g-04", question: "Ist ein rollenbasiertes Zugriffskonzept (RBAC) implementiert und werden Berechtigungen regelmäßig überprüft?", questionEn: "Is a role-based access control (RBAC) concept implemented and are permissions regularly reviewed?", description: "Das Principle of Least Privilege wird durch rollenbasierte Zugriffssteuerung und regelmäßige Reviews umgesetzt.", descriptionEn: "The principle of least privilege is implemented through role-based access control and regular reviews.", status: null },
    { id: "org-16", question: "Werden Authentifizierungsinformationen (Passwörter, Token) durch definierte Prozesse verwaltet?", questionEn: "Are authentication credentials (passwords, tokens) managed through defined processes?", description: "Vergabe, Änderung und Rücksetzung von Authentifizierungsdaten folgen kontrollierten Verfahren.", descriptionEn: "Issuance, modification, and reset of authentication data follow controlled procedures.", status: null },
    { id: "org-17", question: "Werden Zugriffsrechte bei Rollenwechsel oder Austritt unverzüglich angepasst oder entzogen?", questionEn: "Are access rights promptly adjusted or revoked upon role change or departure?", description: "Zugriffsrechte werden entsprechend der Rolle provisioniert, überprüft und bei Änderungen modifiziert.", descriptionEn: "Access rights are provisioned, reviewed, and modified according to role changes.", status: null },
    { id: "i-09", question: "Werden Zugriffsberechtigungen nach dem Need-to-Know-Prinzip vergeben?", questionEn: "Are access permissions granted on a need-to-know basis?", description: "Mitarbeiter erhalten nur die Zugriffsrechte, die für ihre aktuelle Aufgabe erforderlich sind.", descriptionEn: "Employees receive only the access rights necessary for their current role.", status: null },
    { id: "g-13", question: "Werden Service-Accounts inventarisiert und deren Berechtigungen regelmäßig überprüft?", questionEn: "Are service accounts inventoried and their permissions regularly reviewed?", description: "Technische Accounts für Dienste und Anwendungen müssen wie persönliche Konten verwaltet werden.", descriptionEn: "Technical accounts for services and applications must be managed like personal accounts.", status: null },
  ],
};

const orgSupplier: NIS2Category = {
  id: "org-supplier",
  article: "A.5.19–5.23",
  nis2Ref: "NIS2 Art. 21(2)(d)",
  title: "Lieferkettenmanagement",
  titleEn: "Supply Chain Management",
  titleDe: "Sicherheit der Lieferkette und Dienstleistersteuerung",
  description: "Supply chain security and supplier management",
  icon: "link",
  questions: [
    { id: "d-01", question: "Existiert ein aktuelles Verzeichnis aller IT-Dienstleister und Lieferanten mit Kritikalitätsbewertung?", questionEn: "Does an up-to-date registry of all IT service providers and suppliers with criticality assessment exist?", description: "Alle externen IT-Dienstleister (Rechenzentrum, Software, Cloud, Wartung) sind inventarisiert und nach Bedeutung klassifiziert.", descriptionEn: "All external IT service providers (data center, software, cloud, maintenance) are inventoried and classified by importance.", status: null },
    { id: "d-02", question: "Gibt es eine dokumentierte Richtlinie für das Management von IT-Dienstleistern?", questionEn: "Is there a documented policy for managing IT service providers?", description: "Eine Richtlinie regelt Auswahl, Bewertung, Überwachung und Beendigung von Dienstleisterverhältnissen.", descriptionEn: "A policy governs selection, evaluation, monitoring, and termination of service provider relationships.", status: null },
    { id: "d-03", question: "Werden IT-Dienstleister nach ihrer Kritikalität für die Geschäftsprozesse klassifiziert?", questionEn: "Are IT service providers classified according to their criticality for business processes?", description: "Dienstleister werden in Kategorien eingeteilt (z.B. kritisch, wichtig, unkritisch) basierend auf ihrem Einfluss.", descriptionEn: "Service providers are categorized (e.g., critical, important, non-critical) based on their impact.", status: null },
    { id: "d-04", question: "Enthalten Verträge mit IT-Dienstleistern verbindliche Sicherheitsanforderungen und Audit-Rechte?", questionEn: "Do contracts with IT service providers include binding security requirements and audit rights?", description: "Vertragliche Regelungen zu Datenschutz, Sicherheitsstandards, Meldepflichten und Prüfrechten.", descriptionEn: "Contractual provisions for data protection, security standards, reporting obligations, and audit rights.", status: null },
    { id: "d-05", question: "Werden IT-Dienstleister regelmäßig hinsichtlich ihrer Sicherheitsmaßnahmen überprüft (Audits, Zertifikate)?", questionEn: "Are IT service providers regularly audited regarding their security measures (audits, certifications)?", description: "Regelmäßige Bewertung der Sicherheitslage von Dienstleistern durch Audits, Zertifizierungsnachweise oder Fragebögen.", descriptionEn: "Regular assessment of service providers' security posture through audits, certifications, or questionnaires.", status: null },
    { id: "d-06", question: "Werden die Aktivitäten und Zugriffe von IT-Dienstleistern kontinuierlich überwacht?", questionEn: "Are the activities and access of IT service providers continuously monitored?", description: "Monitoring der Dienstleisterzugriffe auf Unternehmenssysteme und Netzwerke.", descriptionEn: "Monitoring of service provider access to corporate systems and networks.", status: null },
    { id: "d-07", question: "Gibt es einen definierten Prozess für die sichere Beendigung von Dienstleisterverhältnissen?", questionEn: "Is there a defined process for the secure termination of service provider relationships?", description: "Rückgabe von Zugängen, Daten und Geräten sowie sichere Löschung bei Vertragsende.", descriptionEn: "Return of access, data, and devices, and secure deletion at contract end.", status: null },
    { id: "d-09", question: "Werden Sicherheitsanforderungen auch an Unterauftragnehmer (Sub-Dienstleister) weitergegeben?", questionEn: "Are security requirements also passed on to subcontractors (sub-service providers)?", description: "Die Lieferkette wird über direkte Vertragspartner hinaus auf deren Unterauftragnehmer ausgedehnt.", descriptionEn: "The supply chain extends beyond direct contractors to their subcontractors.", status: null },
    { id: "d-10", question: "Gibt es eine Bewertung der geografischen und geopolitischen Risiken bei IT-Dienstleistern?", questionEn: "Is there an assessment of geographic and geopolitical risks with IT service providers?", description: "Standorte und Rechtsordnungen der Dienstleister werden hinsichtlich Datenschutz und Zugriffsmöglichkeiten bewertet.", descriptionEn: "Locations and jurisdictions of service providers are assessed regarding data protection and access possibilities.", status: null },
    { id: "d-11", question: "Werden Open-Source-Komponenten inventarisiert und auf bekannte Schwachstellen geprüft (SBOM)?", questionEn: "Are open-source components inventoried and checked for known vulnerabilities (SBOM)?", description: "Eine Software Bill of Materials erfasst alle Abhängigkeiten und ermöglicht das Tracking von Schwachstellen.", descriptionEn: "A Software Bill of Materials captures all dependencies and enables vulnerability tracking.", status: null },
    { id: "d-12", question: "Gibt es Notfallpläne für den Ausfall eines kritischen IT-Dienstleisters?", questionEn: "Are there contingency plans for the failure of a critical IT service provider?", description: "Contingency-Pläne definieren Maßnahmen, wenn ein wichtiger Lieferant ausfällt oder kompromittiert wird.", descriptionEn: "Contingency plans define actions when a critical supplier fails or is compromised.", status: null },
    { id: "d-13", question: "Werden bei der Beschaffung von IT-Produkten Sicherheitszertifizierungen gefordert (z.B. Common Criteria, BSI-Zulassung)?", questionEn: "Are security certifications required when procuring IT products (e.g., Common Criteria, BSI approval)?", description: "Sicherheitszertifizierungen gewährleisten ein Mindestmaß an geprüfter Sicherheit bei beschafften Produkten.", descriptionEn: "Security certifications ensure a minimum level of verified security in procured products.", status: null },
    { id: "org-18", question: "Gibt es eine dokumentierte Richtlinie für die sichere Nutzung von Cloud-Diensten?", questionEn: "Is there a documented policy for the secure use of cloud services?", description: "Rollen, Verantwortlichkeiten und Sicherheitsanforderungen für Cloud-Services sind definiert.", descriptionEn: "Roles, responsibilities, and security requirements for cloud services are defined.", status: null },
    { id: "d-08", question: "Werden Log-Daten von IT-Dienstleistern gesammelt und in das zentrale Monitoring integriert?", questionEn: "Are log data from IT service providers collected and integrated into central monitoring?", description: "Service-Provider-Logs werden gesammelt, um Transparenz über deren Aktivitäten zu gewährleisten.", descriptionEn: "Service provider logs are collected to ensure transparency over their activities.", status: null },
    { id: "sup-01", question: "Werden auch die Unterauftragnehmer (4th Party) der kritischen Dienstleister bewertet?", questionEn: "Are subcontractors (4th parties) of critical service providers also assessed?", description: "Die Risikobewertung erstreckt sich über direkte Vertragspartner hinaus auf deren Unterauftragnehmer.", descriptionEn: "Risk assessment extends beyond direct contractors to their subcontractors.", status: null },
    { id: "sup-02", question: "Gibt es eine Exit-Strategie für den Wechsel kritischer Cloud- oder IT-Dienstleister?", questionEn: "Is there an exit strategy for switching critical cloud or IT service providers?", description: "Eine Exit-Strategie minimiert Abhängigkeiten und sichert die Datenmigration bei Anbieterwechsel.", descriptionEn: "An exit strategy minimizes dependencies and secures data migration when switching providers.", status: null },
    { id: "sup-03", question: "Wird bewertet, ob kritische Dienstleister selbst unter NIS2 fallen (wesentliche/wichtige Einrichtung)?", questionEn: "Is it assessed whether critical service providers themselves fall under NIS2 (essential/important entity)?", description: "Die Einstufung des Dienstleisters bestimmt dessen eigene Compliance-Pflichten und beeinflusst das Lieferketten-Risiko (Art. 21(2)(d) NIS2).", descriptionEn: "The provider's classification determines their own compliance duties and shapes supply chain risk (Art. 21(2)(d) NIS2).", status: null },
    { id: "sup-04", question: "Ist vertraglich und prozessual sichergestellt, dass Dienstleister erhebliche Sicherheitsvorfälle unverzüglich melden, sodass eigene Meldefristen (24h/72h) eingehalten werden?", questionEn: "Is it contractually and procedurally ensured that service providers report significant incidents without delay so own deadlines (24h/72h) can be met?", description: "Ohne vertragliche Sofortmeldepflicht der Dienstleister können die NIS2-Meldefristen nach Art. 23 nicht eingehalten werden.", descriptionEn: "Without contractual immediate-reporting duties on providers, NIS2 Art. 23 reporting deadlines cannot be met.", status: null },
    { id: "sup-05", question: "Werden die Ergebnisse koordinierter Risikobewertungen kritischer Lieferketten auf Unionsebene (Art. 22 NIS2) berücksichtigt?", questionEn: "Are the results of coordinated Union-level risk assessments of critical supply chains (Art. 22 NIS2) taken into account?", description: "Art. 22 NIS2 sieht koordinierte EU-Risikobewertungen kritischer ICT-Lieferketten vor; deren Ergebnisse sind in die eigene Bewertung zu integrieren.", descriptionEn: "Art. 22 NIS2 provides for coordinated EU risk assessments of critical ICT supply chains; their results must be integrated into the entity's own assessment.", status: null },
    { id: "sup-06", question: "Werden Feststellungen aus Dienstleisterprüfungen nachverfolgt und korrigierende Maßnahmen bis zum Abschluss überwacht?", questionEn: "Are findings from service provider assessments tracked and corrective actions monitored through to closure?", description: "Closure-Tracking von Dienstleisterfeststellungen ist Bestandteil der wirksamen Lieferantensteuerung nach Art. 21(2)(d) NIS2.", descriptionEn: "Closure tracking of provider findings is part of effective supplier governance under Art. 21(2)(d) NIS2.", status: null },
  ],
};

const orgIncident: NIS2Category = {
  id: "org-incident",
  article: "A.5.24–5.28",
  nis2Ref: "NIS2 Art. 21(2)(b), Art. 23",
  title: "Vorfallmanagement & Meldepflichten",
  titleEn: "Incident Management & Reporting Obligations",
  titleDe: "Bewältigung von Sicherheitsvorfällen und NIS2-Meldepflichten",
  description: "Incident handling, response and NIS2 reporting obligations",
  icon: "alert-triangle",
  questions: [
    { id: "b-01", question: "Sind dedizierte Mitarbeiter oder ein CERT/CSIRT für die Behandlung von IT-Sicherheitsvorfällen benannt?", questionEn: "Have dedicated staff or a CERT/CSIRT been designated for handling IT security incidents?", description: "Klare Zuständigkeiten für die Erkennung, Analyse und Reaktion auf Sicherheitsvorfälle müssen festgelegt sein.", descriptionEn: "Clear responsibilities for detection, analysis, and response to security incidents must be established.", status: null },
    { id: "b-02", question: "Existiert eine aktuelle Kontaktliste für die Meldung von Sicherheitsvorfällen an die zuständige nationale Behörde und CSIRT?", questionEn: "Does an up-to-date contact list exist for reporting security incidents to the competent national authority and CSIRT?", description: "Meldeketten und Kontaktdaten für nationale und landesspezifische Meldestellen müssen dokumentiert und aktuell sein.", descriptionEn: "Reporting chains and contact details for national and regional reporting points must be documented and current.", status: null },
    { id: "b-03", question: "Gibt es einen dokumentierten Prozess für die interne Meldung und Eskalation von Sicherheitsvorfällen?", questionEn: "Is there a documented process for internal reporting and escalation of security incidents?", description: "Ein klarer Meldeprozess definiert, wer wann welche Art von Vorfällen an wen meldet (24h-Erstmeldung gemäß NIS2).", descriptionEn: "A clear reporting process defines who reports what type of incidents to whom and when (24h initial report per NIS2).", status: null },
    { id: "b-04", question: "Ist ein Incident-Response-Plan vorhanden, der Rollen, Verantwortlichkeiten und Handlungsanweisungen definiert?", questionEn: "Is an incident response plan in place that defines roles, responsibilities, and action instructions?", description: "Der Plan beschreibt konkrete Schritte für Erkennung, Eindämmung, Beseitigung und Wiederherstellung bei Sicherheitsvorfällen.", descriptionEn: "The plan describes concrete steps for detection, containment, eradication, and recovery during security incidents.", status: null },
    { id: "b-05", question: "Sind Schlüsselrollen und deren Stellvertretungen im Incident-Response-Prozess klar zugewiesen?", questionEn: "Are key roles and their deputies clearly assigned in the incident response process?", description: "Incident Commander, technische Analysten, Kommunikationsverantwortliche und deren Stellvertreter sind benannt.", descriptionEn: "Incident commander, technical analysts, communications officers, and their deputies are designated.", status: null },
    { id: "b-06", question: "Existieren definierte Kommunikationswege und -mechanismen für die Krisenkommunikation bei Vorfällen?", questionEn: "Are defined communication channels and mechanisms in place for crisis communication during incidents?", description: "Alternative Kommunikationskanäle (z.B. verschlüsselte Messenger, Telefon) für den Fall, dass E-Mail kompromittiert ist.", descriptionEn: "Alternative communication channels (e.g., encrypted messengers, phone) in case email is compromised.", status: null },
    { id: "b-07", question: "Werden regelmäßig Incident-Response-Übungen (Planspiele, Tabletop-Exercises) durchgeführt?", questionEn: "Are incident response exercises (tabletop exercises, simulations) conducted regularly?", description: "Mindestens jährliche Übungen testen die Reaktionsfähigkeit der Organisation auf simulierte Cyberangriffe.", descriptionEn: "At least annual exercises test the organization's response capability to simulated cyber attacks.", status: null },
    { id: "b-08", question: "Werden nach Sicherheitsvorfällen systematische Post-Incident-Reviews (Lessons Learned) durchgeführt?", questionEn: "Are systematic post-incident reviews (lessons learned) conducted after security incidents?", description: "Strukturierte Nachbereitung analysiert Ursachen und leitet Verbesserungsmaßnahmen ab.", descriptionEn: "Structured post-analysis examines causes and derives improvement measures.", status: null },
    { id: "b-09", question: "Sind Schwellenwerte für die Klassifizierung von Sicherheitsvorfällen definiert?", questionEn: "Are thresholds for the classification of security incidents defined?", description: "Kriterien zur Unterscheidung von Events, Incidents und Notfällen nach Auswirkung und Dringlichkeit.", descriptionEn: "Criteria for distinguishing events, incidents, and emergencies by impact and urgency.", status: null },
    { id: "b-11", question: "Wird die 24-Stunden-Erstmeldung gemäß NIS2 Art. 23 an die zuständige Behörde sichergestellt?", questionEn: "Is the 24-hour initial notification pursuant to NIS2 Art. 23 to the competent authority ensured?", description: "Der Meldeprozess garantiert die fristgerechte Erstmeldung erheblicher Sicherheitsvorfälle innerhalb von 24 Stunden.", descriptionEn: "The reporting process guarantees timely initial notification of significant security incidents within 24 hours.", status: null },
    { id: "b-12", question: "Wird ein Zwischen- und Abschlussbericht innerhalb der NIS2-Fristen (72h/1 Monat) erstellt?", questionEn: "Are interim and final reports prepared within the NIS2 deadlines (72h/1 month)?", description: "Nach der Erstmeldung folgt ein Zwischenbericht innerhalb von 72 Stunden und ein Abschlussbericht innerhalb eines Monats.", descriptionEn: "After the initial notification, an interim report follows within 72 hours and a final report within one month.", status: null },
    { id: "b-13", question: "Werden forensische Beweise bei Sicherheitsvorfällen gesichert und dokumentiert?", questionEn: "Is forensic evidence preserved and documented during security incidents?", description: "Digitale Beweissicherung (Forensik) wird durchgeführt, um Angriffsursachen zu analysieren und rechtsverwertbare Beweise zu sichern.", descriptionEn: "Digital forensics is performed to analyze attack causes and secure legally admissible evidence.", status: null },
    { id: "b-14", question: "Gibt es Playbooks/Runbooks für häufige Vorfallszenarien (Ransomware, Phishing, DDoS)?", questionEn: "Are there playbooks/runbooks for common incident scenarios (ransomware, phishing, DDoS)?", description: "Vordefinierte Handlungsanleitungen für typische Angriffsszenarien beschleunigen die Reaktion.", descriptionEn: "Predefined action guides for typical attack scenarios accelerate the response.", status: null },
    { id: "inc-01", question: "Gibt es eine automatisierte Erkennung von Sicherheitsvorfällen (z.B. SOAR)?", questionEn: "Is there automated detection of security incidents (e.g., SOAR)?", description: "Security Orchestration, Automation and Response (SOAR) beschleunigt die Erkennung und Reaktion auf Vorfälle.", descriptionEn: "Security Orchestration, Automation and Response (SOAR) accelerates incident detection and response.", status: null },
  ],
};

const orgContinuity: NIS2Category = {
  id: "org-continuity",
  article: "A.5.29–5.30",
  nis2Ref: "NIS2 Art. 21(2)(c)",
  title: "Business Continuity & Krisenmanagement",
  titleEn: "Business Continuity & Crisis Management",
  titleDe: "Aufrechterhaltung des Betriebs, Disaster Recovery und Krisenmanagement",
  description: "Business continuity, disaster recovery and crisis management",
  icon: "database-backup",
  questions: [
    { id: "c-06", question: "Gibt es einen Business-Continuity-Plan (Notfallhandbuch) für den IT-Betrieb der Organisation?", questionEn: "Is there a business continuity plan (emergency manual) for the organization's IT operations?", description: "Ein BCP beschreibt die Aufrechterhaltung kritischer Geschäftsprozesse bei längerfristigen IT-Ausfällen.", descriptionEn: "A BCP describes the maintenance of critical business processes during prolonged IT outages.", status: null },
    { id: "c-07", question: "Sind Recovery Time Objectives (RTO) und Recovery Point Objectives (RPO) für alle kritischen Fachverfahren definiert?", questionEn: "Are Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO) defined for all critical business processes?", description: "Maximale Ausfallzeiten und akzeptabler Datenverlust sind pro Fachverfahren festgelegt.", descriptionEn: "Maximum downtime and acceptable data loss are defined per business process.", status: null },
    { id: "c-08", question: "Wird eine Business-Impact-Analyse (BIA) regelmäßig durchgeführt?", questionEn: "Is a Business Impact Analysis (BIA) conducted regularly?", description: "Die BIA bewertet die Auswirkungen von IT-Ausfällen auf Geschäftsprozesse und priorisiert die Wiederherstellung.", descriptionEn: "The BIA assesses the impact of IT outages on business processes and prioritizes recovery.", status: null },
    { id: "c-09", question: "Existiert ein Krisenmanagement-Team mit definierten Rollen und Entscheidungsbefugnissen?", questionEn: "Does a crisis management team with defined roles and decision-making authority exist?", description: "Ein Krisenstab mit klaren Verantwortlichkeiten koordiniert die Bewältigung von IT-Notfällen.", descriptionEn: "A crisis team with clear responsibilities coordinates the management of IT emergencies.", status: null },
    { id: "c-10", question: "Werden Notfallübungen (inkl. IT-Ausfall-Szenarien) mindestens jährlich durchgeführt?", questionEn: "Are emergency drills (including IT outage scenarios) conducted at least annually?", description: "Regelmäßige Übungen testen die Wirksamkeit des BCP und der Krisenorganisation.", descriptionEn: "Regular drills test the effectiveness of the BCP and crisis organization.", status: null },
    { id: "c-11", question: "Gibt es einen Disaster-Recovery-Plan mit georedundanter Datenhaltung?", questionEn: "Is there a disaster recovery plan with geo-redundant data storage?", description: "Ein DR-Plan beschreibt die Wiederherstellung der IT-Infrastruktur an einem Ausweichstandort.", descriptionEn: "A DR plan describes the recovery of IT infrastructure at an alternate site.", status: null },
    { id: "c-12", question: "Werden kritische IT-Systeme redundant ausgelegt (Hochverfügbarkeit)?", questionEn: "Are critical IT systems designed with redundancy (high availability)?", description: "Kritische Server, Netzwerkkomponenten und Dienste sind redundant aufgebaut, um Einzelausfälle zu vermeiden.", descriptionEn: "Critical servers, network components, and services are built with redundancy to avoid single points of failure.", status: null },
    { id: "c-13", question: "Gibt es Notfallarbeitsplätze oder alternative Arbeitsumgebungen für den Krisenfall?", questionEn: "Are emergency workstations or alternative work environments available for crisis situations?", description: "Im Falle eines Gebäude- oder IT-Ausfalls stehen alternative Arbeitsplätze zur Verfügung.", descriptionEn: "In the event of a building or IT failure, alternative workstations are available.", status: null },
    { id: "org-19", question: "Wird die Informationssicherheit während Störungen aufrechterhalten?", questionEn: "Is information security maintained during disruptions?", description: "Bestehende Sicherheitskontrollen bleiben auch während einer Krisensituation aktiv.", descriptionEn: "Existing security controls remain active even during a crisis situation.", status: null },
    { id: "cont-01", question: "Werden Wiederanlaufpläne für kritische IT-Systeme dokumentiert und getestet?", questionEn: "Are restart plans for critical IT systems documented and tested?", description: "Wiederanlaufpläne beschreiben die Reihenfolge und Abhängigkeiten beim Neustart von Systemen nach einem Ausfall.", descriptionEn: "Restart plans describe the sequence and dependencies when restarting systems after an outage.", status: null },
    { id: "cont-02", question: "Gibt es eine Kommunikationsstrategie für die Benachrichtigung betroffener Kunden bei IT-Ausfällen?", questionEn: "Is there a communication strategy for notifying affected customers during IT outages?", description: "Proaktive Kommunikation mit Kunden und Partnern minimiert Reputationsschäden bei Vorfällen.", descriptionEn: "Proactive communication with customers and partners minimizes reputational damage during incidents.", status: null },
  ],
};

const orgCompliance: NIS2Category = {
  id: "org-compliance",
  article: "A.5.31–5.36",
  nis2Ref: "NIS2 Art. 21(2)(g)",
  title: "Compliance, Recht & Wirksamkeit",
  titleEn: "Compliance, Legal & Effectiveness",
  titleDe: "Gesetzliche Anforderungen, Datenschutz und Wirksamkeitsbewertung",
  description: "Legal compliance, privacy protection and effectiveness assessment",
  icon: "bar-chart",
  questions: [
    { id: "org-20", question: "Werden gesetzliche, regulatorische und vertragliche Anforderungen zur Informationssicherheit identifiziert und eingehalten?", questionEn: "Are legal, regulatory, and contractual requirements for information security identified and complied with?", description: "Compliance-Anforderungen werden systematisch erfasst und deren Einhaltung überwacht.", descriptionEn: "Compliance requirements are systematically captured and their adherence monitored.", status: null },
    { id: "org-22", question: "Werden Aufzeichnungen vor Verlust, Zerstörung und Fälschung geschützt?", questionEn: "Are records protected against loss, destruction, and falsification?", description: "Aufbewahrungspflichten und Schutzmaßnahmen für Geschäftsunterlagen.", descriptionEn: "Retention obligations and protection measures for business records.", status: null },
    { id: "org-24", question: "Wird die Informationssicherheit regelmäßig unabhängig überprüft?", questionEn: "Is information security regularly reviewed independently?", description: "Unabhängige Reviews bewerten die Angemessenheit und Wirksamkeit der Sicherheitsmaßnahmen.", descriptionEn: "Independent reviews assess the adequacy and effectiveness of security measures.", status: null },
    { id: "org-25", question: "Wird die Einhaltung der Sicherheitsrichtlinien und Standards regelmäßig überprüft?", questionEn: "Is compliance with security policies and standards regularly reviewed?", description: "Compliance-Reviews stellen sicher, dass Richtlinien in der Praxis eingehalten werden.", descriptionEn: "Compliance reviews ensure that policies are adhered to in practice.", status: null },
    { id: "f-01", question: "Werden die implementierten Sicherheitsmaßnahmen regelmäßig auf ihre Wirksamkeit überprüft?", questionEn: "Are implemented security measures regularly reviewed for effectiveness?", description: "Regelmäßige Überprüfungen (mindestens jährlich) bewerten, ob die Maßnahmen den identifizierten Risiken angemessen sind.", descriptionEn: "Regular reviews (at least annually) assess whether measures are adequate to identified risks.", status: null },
    { id: "f-03", question: "Gibt es KPIs oder Metriken zur Messung der Informationssicherheit (z.B. Patch-Quote, Vorfallzahlen)?", questionEn: "Are there KPIs or metrics for measuring information security (e.g., patch rate, incident numbers)?", description: "Messbare Kennzahlen ermöglichen die objektive Bewertung des Sicherheitsniveaus und dessen Entwicklung.", descriptionEn: "Measurable indicators enable objective assessment of the security level and its development.", status: null },
    { id: "f-04", question: "Werden externe Audits oder Zertifizierungen (z.B. ISO 27001) angestrebt oder durchgeführt?", questionEn: "Are external audits or certifications (e.g., ISO 27001) pursued or conducted?", description: "Externe Prüfungen durch akkreditierte Stellen validieren das ISMS und schaffen Vertrauen.", descriptionEn: "External audits by accredited bodies validate the ISMS and build trust.", status: null },
    { id: "f-05", question: "Werden interne Audits des ISMS regelmäßig durchgeführt?", questionEn: "Are internal ISMS audits conducted regularly?", description: "Interne Audits prüfen die Einhaltung der Sicherheitsrichtlinien und identifizieren Verbesserungspotenziale.", descriptionEn: "Internal audits check compliance with security policies and identify improvement potential.", status: null },
    { id: "f-06", question: "Gibt es einen kontinuierlichen Verbesserungsprozess (PDCA-Zyklus) für die Informationssicherheit?", questionEn: "Is there a continuous improvement process (PDCA cycle) for information security?", description: "Plan-Do-Check-Act: Sicherheitsmaßnahmen werden systematisch geplant, umgesetzt, überprüft und verbessert.", descriptionEn: "Plan-Do-Check-Act: Security measures are systematically planned, implemented, checked, and improved.", status: null },
    { id: "f-07", question: "Werden Ergebnisse der Wirksamkeitsprüfungen an die Leitungsebene berichtet?", questionEn: "Are effectiveness review results reported to top management?", description: "Management-Reports informieren die Geschäftsleitung über den aktuellen Sicherheitsstatus und Handlungsbedarf.", descriptionEn: "Management reports inform top management about the current security status and required actions.", status: null },
    { id: "f-02", question: "Werden die Ergebnisse der Wiederherstellungstests dokumentiert und ausgewertet?", questionEn: "Are recovery test results documented and evaluated?", description: "Test-Ergebnisse der Disaster-Recovery-Tests werden analysiert und führen zu konkreten Verbesserungen.", descriptionEn: "Disaster recovery test results are analyzed and lead to concrete improvements.", status: null },
  ],
};

// =============================================
// DOMAIN 2: PERSONELLE KONTROLLEN (A.6)
// =============================================

const pplSecurity: NIS2Category = {
  id: "ppl-security",
  article: "A.6.1–6.6",
  nis2Ref: "NIS2 Art. 21(2)(j)",
  title: "Personalsicherheit & Überprüfung",
  titleEn: "Personnel Security & Screening",
  titleDe: "Personalüberprüfung, Arbeitsvertragsbedingungen und Vertraulichkeit",
  description: "Personnel screening, employment terms and confidentiality",
  icon: "users",
  questions: [
    { id: "i-01", question: "Werden Sicherheitsüberprüfungen bei der Einstellung von Mitarbeitern in sicherheitskritischen Positionen durchgeführt?", questionEn: "Are security screenings conducted when hiring employees for security-critical positions?", description: "Background Checks und Sicherheitsüberprüfungen für Mitarbeiter mit Zugang zu sensiblen Systemen.", descriptionEn: "Background checks and security screenings for employees with access to sensitive systems.", status: null },
    { id: "i-02", question: "Gibt es vertragliche Vereinbarungen zur Vertraulichkeit und IT-Sicherheit mit allen Mitarbeitern?", questionEn: "Are there contractual agreements on confidentiality and IT security with all employees?", description: "Geheimhaltungsvereinbarungen und IT-Nutzungsrichtlinien sind Bestandteil des Arbeitsvertrags.", descriptionEn: "Non-disclosure agreements and IT usage policies are part of the employment contract.", status: null },
    { id: "i-03", question: "Werden Zugriffsrechte beim Ausscheiden von Mitarbeitern unverzüglich entzogen?", questionEn: "Are access rights immediately revoked when employees leave?", description: "Automatisierte oder zeitnahe Deaktivierung aller Zugänge beim Offboarding.", descriptionEn: "Automated or timely deactivation of all access during offboarding.", status: null },
    { id: "ppl-01", question: "Gibt es einen Disziplinarprozess für Verstöße gegen die Informationssicherheitsrichtlinien?", questionEn: "Is there a disciplinary process for violations of information security policies?", description: "Formelle Konsequenzen bei Sicherheitsverstößen stellen die Durchsetzung der Richtlinien sicher.", descriptionEn: "Formal consequences for security violations ensure policy enforcement.", status: null },
    { id: "ppl-02", question: "Werden Verantwortlichkeiten für Informationssicherheit bei Beendigung oder Wechsel des Arbeitsverhältnisses geregelt?", questionEn: "Are information security responsibilities addressed upon termination or change of employment?", description: "Fortbestehende Verpflichtungen (z.B. Vertraulichkeit) nach dem Ausscheiden werden kommuniziert.", descriptionEn: "Continuing obligations (e.g., confidentiality) after departure are communicated.", status: null },
    { id: "ppl-03", question: "Bestehen Vertraulichkeits- oder Geheimhaltungsvereinbarungen mit allen relevanten Parteien?", questionEn: "Are confidentiality or non-disclosure agreements in place with all relevant parties?", description: "NDAs werden mit Mitarbeitern, Dienstleistern und Partnern abgeschlossen.", descriptionEn: "NDAs are concluded with employees, service providers, and partners.", status: null },
  ],
};

const pplAwareness: NIS2Category = {
  id: "ppl-awareness",
  article: "A.6.3, A.6.7–6.8",
  nis2Ref: "NIS2 Art. 21(2)(h)",
  title: "Awareness, Schulungen & Cyberhygiene",
  titleEn: "Awareness, Training & Cyber Hygiene",
  titleDe: "Sicherheitsbewusstsein, Schulungen, Remote-Arbeit und Meldung von Ereignissen",
  description: "Security awareness, training, remote work and event reporting",
  icon: "graduation-cap",
  questions: [
    { id: "a-12", question: "Gibt es ein etabliertes Security-Awareness-Programm für alle Mitarbeiter der Organisation?", questionEn: "Is there an established security awareness program for all employees of the organization?", description: "Regelmäßige Schulungen und Sensibilisierungsmaßnahmen zu Phishing, Social Engineering und sicherer IT-Nutzung.", descriptionEn: "Regular training and awareness measures on phishing, social engineering, and secure IT usage.", status: null },
    { id: "g-06", question: "Werden regelmäßige Security-Awareness-Schulungen für alle Mitarbeiter durchgeführt?", questionEn: "Are regular security awareness training sessions conducted for all employees?", description: "Mindestens jährliche Schulungen zu aktuellen Bedrohungen, Phishing-Erkennung und sicherer IT-Nutzung.", descriptionEn: "At least annual training on current threats, phishing detection, and secure IT usage.", status: null },
    { id: "g-07", question: "Werden Phishing-Simulationen regelmäßig durchgeführt und ausgewertet?", questionEn: "Are phishing simulations conducted and evaluated regularly?", description: "Kontrollierte Phishing-Tests messen die Sensibilisierung der Mitarbeiter und identifizieren Schulungsbedarf.", descriptionEn: "Controlled phishing tests measure employee awareness and identify training needs.", status: null },
    { id: "g-08", question: "Gibt es spezifische Schulungen für Mitarbeiter mit erhöhten IT-Rechten (Administratoren)?", questionEn: "Are there specific training programs for employees with elevated IT privileges (administrators)?", description: "Technische Schulungen für IT-Personal zu sicherer Systemadministration und Incident Response.", descriptionEn: "Technical training for IT staff on secure system administration and incident response.", status: null },
    { id: "g-12", question: "Werden neue Mitarbeiter im Rahmen des Onboardings in IT-Sicherheit eingewiesen?", questionEn: "Are new employees briefed on IT security as part of onboarding?", description: "Sicherheitseinweisung als fester Bestandteil des Onboarding-Prozesses für alle neuen Mitarbeiter.", descriptionEn: "Security briefing as an integral part of the onboarding process for all new employees.", status: null },
    { id: "g-01", question: "Gibt es eine Passwort-Richtlinie, die Mindestlänge, Komplexität und Änderungsintervalle definiert?", questionEn: "Is there a password policy that defines minimum length, complexity, and change intervals?", description: "Passwortrichtlinien definieren Anforderungen an sichere Passwörter und deren Verwaltung.", descriptionEn: "Password policies define requirements for secure passwords and their management.", status: null },
    { id: "g-11", question: "Gibt es eine Clean-Desk-Policy und Richtlinien zur physischen Sicherheit von IT-Geräten?", questionEn: "Is there a clean desk policy and guidelines for the physical security of IT devices?", description: "Clean-Desk- und Clear-Screen-Richtlinien schützen vertrauliche Informationen vor unbefugtem Zugriff.", descriptionEn: "Clean desk and clear screen policies protect confidential information from unauthorized access.", status: null },
    { id: "g-10", question: "Werden USB-Geräte und externe Datenträger kontrolliert und eingeschränkt?", questionEn: "Are USB devices and external storage media controlled and restricted?", description: "Richtlinien für den Umgang mit externen Datenträgern verhindern das Einschleusen von Malware.", descriptionEn: "Policies for handling external storage media prevent malware infiltration.", status: null },
    { id: "i-10", question: "Gibt es eine Richtlinie für sicheres Arbeiten im Homeoffice/Remote Work?", questionEn: "Is there a policy for secure remote/home office work?", description: "Remote-Work-Richtlinien definieren Sicherheitsanforderungen für das Arbeiten außerhalb des Unternehmens.", descriptionEn: "Remote work policies define security requirements for working outside the organization.", status: null },
    { id: "i-06", question: "Gibt es eine Richtlinie für die sichere Nutzung privater Geräte (BYOD)?", questionEn: "Is there a policy for the secure use of personal devices (BYOD)?", description: "BYOD-Richtlinien regeln den sicheren Einsatz privater Geräte im Unternehmensnetzwerk.", descriptionEn: "BYOD policies govern the secure use of personal devices on the corporate network.", status: null },
    { id: "ppl-04", question: "Gibt es einen Prozess für Mitarbeiter zur Meldung von beobachteten oder vermuteten Sicherheitsereignissen?", questionEn: "Is there a process for employees to report observed or suspected security events?", description: "Alle Mitarbeiter wissen, wie und an wen sie Sicherheitsereignisse melden können.", descriptionEn: "All employees know how and to whom they can report security events.", status: null },
    { id: "aw-01", question: "Werden Awareness-Maßnahmen auf verschiedene Zielgruppen zugeschnitten (IT, Management, Fachbereiche)?", questionEn: "Are awareness measures tailored to different target groups (IT, management, departments)?", description: "Zielgruppenspezifische Schulungen erhöhen die Wirksamkeit der Sensibilisierung.", descriptionEn: "Target group-specific training increases the effectiveness of awareness.", status: null },
    { id: "aw-02", question: "Wird die Wirksamkeit der Awareness-Maßnahmen gemessen und ausgewertet?", questionEn: "Is the effectiveness of awareness measures measured and evaluated?", description: "KPIs wie Phishing-Klickraten und Schulungsteilnahme messen den Erfolg des Programms.", descriptionEn: "KPIs such as phishing click rates and training participation measure the program's success.", status: null },
  ],
};

// =============================================
// DOMAIN 3: PHYSISCHE KONTROLLEN (A.7)
// =============================================

const phyAccess: NIS2Category = {
  id: "phy-access",
  article: "A.7.1–7.6",
  nis2Ref: "NIS2 Art. 21(2)(j)",
  title: "Physische Zutrittskontrolle & Sicherheitsbereiche",
  titleEn: "Physical Access Control & Secure Areas",
  titleDe: "Physische Sicherheitsperimeter, Zutritt und Arbeiten in Sicherheitsbereichen",
  description: "Physical security perimeters, entry and secure areas",
  icon: "lock",
  questions: [
    { id: "i-04", question: "Gibt es physische Zugangskontrollen zu Serverräumen und kritischer Infrastruktur?", questionEn: "Are there physical access controls to server rooms and critical infrastructure?", description: "Zutrittskontrollsysteme mit Protokollierung für sensible Bereiche.", descriptionEn: "Access control systems with logging for sensitive areas.", status: null },
    { id: "i-05", question: "Werden Besucherzugänge zu IT-Bereichen dokumentiert und kontrolliert?", questionEn: "Are visitor accesses to IT areas documented and controlled?", description: "Besucher in IT-Bereichen werden registriert und von autorisierten Mitarbeitern begleitet.", descriptionEn: "Visitors to IT areas are registered and accompanied by authorized staff.", status: null },
    { id: "phy-01", question: "Sind physische Sicherheitsperimeter definiert und implementiert (Gebäudegrenzen, Sicherheitszonen)?", questionEn: "Are physical security perimeters defined and implemented (building boundaries, security zones)?", description: "Räumliche Grenzen schützen Bereiche mit sensiblen Informationen und Systemen.", descriptionEn: "Physical boundaries protect areas with sensitive information and systems.", status: null },
    { id: "phy-02", question: "Werden Büros, Räume und Einrichtungen mit sensiblen Informationen angemessen gesichert?", questionEn: "Are offices, rooms, and facilities with sensitive information adequately secured?", description: "Zusätzliche Sicherheitsmaßnahmen für Bereiche mit vertraulichen Daten.", descriptionEn: "Additional security measures for areas with confidential data.", status: null },
    { id: "phy-03", question: "Wird eine physische Sicherheitsüberwachung (CCTV, Alarmanlagen) eingesetzt?", questionEn: "Is physical security monitoring (CCTV, alarm systems) in place?", description: "Überwachungssysteme erkennen und protokollieren unbefugten Zutritt.", descriptionEn: "Surveillance systems detect and log unauthorized access.", status: null },
    { id: "phy-04", question: "Gibt es Regeln für das Arbeiten in Sicherheitsbereichen?", questionEn: "Are there rules for working in secure areas?", description: "Verhaltensregeln in Hochsicherheitsbereichen (z.B. keine Mobiltelefone, Vier-Augen-Prinzip).", descriptionEn: "Rules of conduct in high-security areas (e.g., no mobile phones, four-eyes principle).", status: null },
  ],
};

const phyEquipment: NIS2Category = {
  id: "phy-equipment",
  article: "A.7.5, A.7.7–7.14",
  nis2Ref: "NIS2 Art. 21(2)(j)",
  title: "Geräte- & Umgebungssicherheit",
  titleEn: "Equipment & Environmental Security",
  titleDe: "Schutz vor Umweltbedrohungen, Gerätestandort, Speichermedien und Entsorgung",
  description: "Environmental protection, equipment placement, media and disposal",
  icon: "database-backup",
  questions: [
    { id: "phy-05", question: "Werden IT-Anlagen vor physischen und umweltbedingten Bedrohungen geschützt (Feuer, Wasser, Strom)?", questionEn: "Are IT assets protected against physical and environmental threats (fire, water, power)?", description: "Brandschutz, Wassermelder und USV-Anlagen schützen kritische IT-Infrastruktur.", descriptionEn: "Fire protection, water detectors, and UPS systems protect critical IT infrastructure.", status: null },
    { id: "phy-06", question: "Sind IT-Geräte angemessen platziert und vor unbefugtem Zugriff geschützt?", questionEn: "Are IT devices appropriately placed and protected against unauthorized access?", description: "Server und Netzwerkgeräte befinden sich in gesicherten, klimatisierten Räumen.", descriptionEn: "Servers and network devices are located in secured, climate-controlled rooms.", status: null },
    { id: "phy-07", question: "Werden IT-Assets außerhalb des Unternehmens (Laptops, mobile Geräte) geschützt?", questionEn: "Are IT assets outside the organization (laptops, mobile devices) protected?", description: "Sicherheitsmaßnahmen für Geräte, die das Firmengelände verlassen.", descriptionEn: "Security measures for devices that leave the company premises.", status: null },
    { id: "phy-08", question: "Werden Speichermedien über ihren Lebenszyklus sicher verwaltet?", questionEn: "Are storage media securely managed throughout their lifecycle?", description: "Verwaltung, Transport und Löschung von Datenträgern nach definierten Verfahren.", descriptionEn: "Management, transport, and deletion of storage media according to defined procedures.", status: null },
    { id: "phy-09", question: "Sind unterstützende Versorgungseinrichtungen (Strom, Klima, Wasser) gegen Ausfälle geschützt?", questionEn: "Are supporting utilities (power, climate, water) protected against failures?", description: "Redundante Versorgung, USV und Notstromaggregate für kritische Systeme.", descriptionEn: "Redundant supply, UPS, and emergency power generators for critical systems.", status: null },
    { id: "phy-10", question: "Ist die Verkabelung (Strom und Netzwerk) vor Abhören und Beschädigung geschützt?", questionEn: "Is cabling (power and network) protected against interception and damage?", description: "Strukturierte Verkabelung, geschützte Kabelkanäle und Dokumentation.", descriptionEn: "Structured cabling, protected cable ducts, and documentation.", status: null },
    { id: "phy-11", question: "Werden IT-Geräte regelmäßig gewartet, um Verfügbarkeit und Integrität sicherzustellen?", questionEn: "Are IT devices regularly maintained to ensure availability and integrity?", description: "Geplante Wartung und Inspektionszyklen für alle IT-Komponenten.", descriptionEn: "Planned maintenance and inspection cycles for all IT components.", status: null },
    { id: "i-07", question: "Werden Asset-Management-Prozesse für die Verwaltung aller IT-Anlagen durchgeführt?", questionEn: "Are asset management processes in place for managing all IT assets?", description: "Systematische Verwaltung aller IT-Assets über den gesamten Lebenszyklus hinweg.", descriptionEn: "Systematic management of all IT assets throughout the entire lifecycle.", status: null },
    { id: "i-08", question: "Gibt es Verfahren für die sichere Entsorgung oder Wiederverwendung von IT-Geräten?", questionEn: "Are there procedures for the secure disposal or reuse of IT equipment?", description: "Sichere Datenlöschung und physische Zerstörung von Datenträgern bei Außerbetriebnahme.", descriptionEn: "Secure data deletion and physical destruction of storage media upon decommissioning.", status: null },
  ],
};

// =============================================
// DOMAIN 4: TECHNOLOGISCHE KONTROLLEN (A.8)
// =============================================

const techEndpoint: NIS2Category = {
  id: "tech-endpoint",
  article: "A.8.1–8.5",
  nis2Ref: "NIS2 Art. 21(2)(e)",
  title: "Endgeräte & Zugriffssicherheit",
  titleEn: "Endpoints & Access Security",
  titleDe: "Endgerätesicherheit, privilegierter Zugriff und Authentifizierung",
  description: "Endpoint security, privileged access and authentication",
  icon: "lock",
  questions: [
    { id: "g-09", question: "Werden Endgeräte mit aktueller Schutzsoftware (Anti-Malware, EDR) ausgestattet?", questionEn: "Are endpoints equipped with up-to-date protection software (anti-malware, EDR)?", description: "Endpoint Detection and Response (EDR) bietet erweiterten Schutz über traditionellen Virenschutz hinaus.", descriptionEn: "Endpoint Detection and Response (EDR) provides extended protection beyond traditional antivirus.", status: null },
    { id: "e-20", question: "Werden mobile Endgeräte (Smartphones, Tablets) über ein Mobile Device Management (MDM) verwaltet?", questionEn: "Are mobile devices (smartphones, tablets) managed via Mobile Device Management (MDM)?", description: "MDM-Lösungen erzwingen Sicherheitsrichtlinien, ermöglichen Fernlöschung und kontrollieren App-Installationen.", descriptionEn: "MDM solutions enforce security policies, enable remote wipe, and control app installations.", status: null },
    { id: "g-02", question: "Wird Multi-Faktor-Authentifizierung (MFA) für alle externen Zugänge und privilegierten Konten erzwungen?", questionEn: "Is multi-factor authentication (MFA) enforced for all external access and privileged accounts?", description: "MFA schützt vor Credential-Diebstahl durch eine zusätzliche Authentifizierungsebene.", descriptionEn: "MFA protects against credential theft through an additional authentication layer.", status: null },
    { id: "g-05", question: "Werden privilegierte Konten (Admin-Accounts) besonders geschützt und deren Nutzung überwacht?", questionEn: "Are privileged accounts (admin accounts) specially protected and their usage monitored?", description: "Privileged Access Management (PAM) schützt Administrative Zugänge durch zusätzliche Kontrollen.", descriptionEn: "Privileged Access Management (PAM) protects administrative access through additional controls.", status: null },
    { id: "e-03", question: "Werden automatische Session-Sperren auf allen Arbeitsplatzrechnern erzwungen?", questionEn: "Are automatic session locks enforced on all workstations?", description: "Bildschirmsperren nach definierten Inaktivitätszeiträumen (z.B. 10 Minuten) verhindern unbefugten Zugriff.", descriptionEn: "Screen locks after defined inactivity periods (e.g., 10 minutes) prevent unauthorized access.", status: null },
    { id: "e-05", question: "Werden Standard-Konten und Standard-Passwörter auf allen Geräten und Software geändert?", questionEn: "Are default accounts and default passwords changed on all devices and software?", description: "Default Credentials stellen ein häufiges Einfallstor für Angreifer dar und müssen vor Inbetriebnahme geändert werden.", descriptionEn: "Default credentials represent a common entry point for attackers and must be changed before deployment.", status: null },
    { id: "tech-01", question: "Gibt es eine Richtlinie und Bestandsliste für zugelassene Endgeräte (BYOD-Registrierung)?", questionEn: "Is there a policy and inventory list for approved endpoint devices (BYOD registration)?", description: "Alle Endgeräte sind inventarisiert und nach Sicherheitsrichtlinie konfiguriert.", descriptionEn: "All endpoint devices are inventoried and configured according to security policy.", status: null },
    { id: "tech-02", question: "Wird der Zugriff auf Quellcode und Entwicklungswerkzeuge angemessen gesteuert?", questionEn: "Is access to source code and development tools appropriately controlled?", description: "Lese-/Schreibzugriff auf Quellcode wird nach Bedarf vergeben und protokolliert.", descriptionEn: "Read/write access to source code is granted on a need-to-know basis and logged.", status: null },
    { id: "tech-03", question: "Werden sichere Authentifizierungstechnologien eingesetzt (Passwortmaskierung, Verschlüsselung bei Übertragung)?", questionEn: "Are secure authentication technologies used (password masking, encryption during transmission)?", description: "Login-Prozesse zeigen keine vertraulichen Informationen und verwenden sichere Übertragung.", descriptionEn: "Login processes do not display confidential information and use secure transmission.", status: null },
    { id: "ep-01", question: "Werden Endgeräte nach definierten Hardening-Standards konfiguriert (z.B. CIS Benchmarks)?", questionEn: "Are endpoints configured according to defined hardening standards (e.g., CIS Benchmarks)?", description: "Standardisierte Härtung reduziert die Angriffsfläche auf Endgeräten.", descriptionEn: "Standardized hardening reduces the attack surface on endpoints.", status: null },
    { id: "ep-02", question: "Werden Application-Whitelisting-Mechanismen auf Endgeräten eingesetzt?", questionEn: "Are application whitelisting mechanisms used on endpoints?", description: "Nur genehmigte Anwendungen dürfen ausgeführt werden, was die Ausführung von Malware verhindert.", descriptionEn: "Only approved applications may be executed, preventing malware execution.", status: null },
  ],
};

const techNetwork: NIS2Category = {
  id: "tech-network",
  article: "A.8.20–8.23",
  nis2Ref: "NIS2 Art. 21(2)(e)",
  title: "Netzwerk- & Systemsicherheit",
  titleEn: "Network & System Security",
  titleDe: "Netzwerksicherheit, Segmentierung, Firewall und Web-Filterung",
  description: "Network security, segmentation, firewall and web filtering",
  icon: "code",
  questions: [
    { id: "e-01", question: "Werden alle Netzwerkinfrastrukturkomponenten (Router, Switches, Firewalls) sicher konfiguriert und gehärtet?", questionEn: "Are all network infrastructure components (routers, switches, firewalls) securely configured and hardened?", description: "Netzwerkgeräte werden nach BSI-Grundschutz oder CIS-Benchmarks sicher konfiguriert.", descriptionEn: "Network devices are securely configured according to BSI baseline protection or CIS benchmarks.", status: null },
    { id: "e-02", question: "Ist das Netzwerk in Sicherheitszonen segmentiert (z.B. Produktion, Gäste-WLAN, Server, DMZ)?", questionEn: "Is the network segmented into security zones (e.g., production, guest WiFi, server, DMZ)?", description: "Netzwerksegmentierung trennt kritische Bereiche und begrenzt die Ausbreitung bei einem Sicherheitsvorfall.", descriptionEn: "Network segmentation separates critical areas and limits the spread during a security incident.", status: null },
    { id: "e-04", question: "Sind auf allen Servern und Endgeräten Firewalls aktiviert und konfiguriert?", questionEn: "Are firewalls activated and configured on all servers and endpoints?", description: "Host-basierte Firewalls auf Servern und Clients ergänzen die Netzwerk-Firewall.", descriptionEn: "Host-based firewalls on servers and clients complement the network firewall.", status: null },
    { id: "e-06", question: "Werden nicht benötigte Dienste und Ports auf allen Systemen deaktiviert?", questionEn: "Are unnecessary services and ports disabled on all systems?", description: "Die Reduzierung der Angriffsfläche durch Deaktivierung unnötiger Dienste ist eine grundlegende Härtungsmaßnahme.", descriptionEn: "Reducing the attack surface by disabling unnecessary services is a fundamental hardening measure.", status: null },
    { id: "e-12", question: "Werden sichere Netzwerkmanagement- und Kommunikationsprotokolle verwendet (z.B. SNMPv3, SSH statt Telnet)?", questionEn: "Are secure network management and communication protocols used (e.g., SNMPv3, SSH instead of Telnet)?", description: "Unsichere Protokolle wie Telnet, SNMPv1/v2 oder unverschlüsselte Übertragungen müssen ersetzt werden.", descriptionEn: "Insecure protocols such as Telnet, SNMPv1/v2, or unencrypted transmissions must be replaced.", status: null },
    { id: "e-13", question: "Gibt es Intrusion-Detection/Prevention-Systeme (IDS/IPS) im Netzwerk und auf Hosts?", questionEn: "Are there Intrusion Detection/Prevention Systems (IDS/IPS) on the network and hosts?", description: "IDS/IPS-Systeme erkennen und blockieren verdächtige Aktivitäten und Angriffsversuche.", descriptionEn: "IDS/IPS systems detect and block suspicious activities and attack attempts.", status: null },
    { id: "j-05", question: "Werden DNS-Sicherheitsmaßnahmen (DNSSEC, DoH/DoT) eingesetzt?", questionEn: "Are DNS security measures (DNSSEC, DoH/DoT) deployed?", description: "DNS-Sicherheit verhindert DNS-Spoofing und schützt die Namensauflösung.", descriptionEn: "DNS security prevents DNS spoofing and protects name resolution.", status: null },
    { id: "j-06", question: "Gibt es ein Konzept zur Absicherung von IoT-Geräten und deren Kommunikation?", questionEn: "Is there a concept for securing IoT devices and their communication?", description: "IoT-Geräte werden in separaten Netzwerksegmenten betrieben und deren Kommunikation überwacht.", descriptionEn: "IoT devices are operated in separate network segments and their communication is monitored.", status: null },
    { id: "j-07", question: "Werden Zero-Trust-Prinzipien bei der Netzwerkarchitektur berücksichtigt?", questionEn: "Are zero-trust principles considered in network architecture?", description: "Zero Trust: Kein Vertrauen basierend auf Netzwerkstandort – jeder Zugriff wird verifiziert.", descriptionEn: "Zero Trust: No trust based on network location – every access is verified.", status: null },
    { id: "a-08", question: "Gibt es einen dokumentierten Prozess für die sichere Konfiguration aller IT-Systeme (Härtung)?", questionEn: "Is there a documented process for the secure configuration of all IT systems (hardening)?", description: "Sichere Baseline-Konfigurationen (z.B. CIS Benchmarks) werden für alle Systeme definiert und durchgesetzt.", descriptionEn: "Secure baseline configurations (e.g., CIS Benchmarks) are defined and enforced for all systems.", status: null },
    { id: "e-11", question: "Ist die gesamte Netzwerkinfrastruktur auf dem aktuellen Firmware-/Software-Stand?", questionEn: "Is the entire network infrastructure on the current firmware/software version?", description: "Veraltete Firmware auf Netzwerkgeräten enthält oft bekannte Sicherheitslücken.", descriptionEn: "Outdated firmware on network devices often contains known security vulnerabilities.", status: null },
    { id: "tech-04", question: "Werden Web-Filterregeln eingesetzt, um den Zugriff auf riskante Websites zu verhindern?", questionEn: "Are web filtering rules used to prevent access to risky websites?", description: "Web-Filter blockieren bekannt bösartige Websites und Inhalte.", descriptionEn: "Web filters block known malicious websites and content.", status: null },
    { id: "net-01", question: "Werden regelmäßige Netzwerk-Penetrationstests durchgeführt?", questionEn: "Are regular network penetration tests conducted?", description: "Netzwerk-Pentests identifizieren Schwachstellen in der Infrastruktur aus Angreiferperspektive.", descriptionEn: "Network pentests identify infrastructure vulnerabilities from an attacker's perspective.", status: null },
    { id: "net-02", question: "Wird ein Netzwerkzugangs-Kontrollsystem (802.1X) eingesetzt?", questionEn: "Is a network access control system (802.1X) deployed?", description: "802.1X authentifiziert Geräte bevor sie Netzwerkzugang erhalten.", descriptionEn: "802.1X authenticates devices before granting network access.", status: null },
    { id: "net-03", question: "Werden Wireless-Netzwerke mit WPA3 oder höher gesichert?", questionEn: "Are wireless networks secured with WPA3 or higher?", description: "Moderne WLAN-Verschlüsselung schützt drahtlose Kommunikation vor Abhören.", descriptionEn: "Modern WiFi encryption protects wireless communication from eavesdropping.", status: null },
  ],
};

const techCrypto: NIS2Category = {
  id: "tech-crypto",
  article: "A.8.24",
  title: "Kryptographie & sichere Kommunikation",
  titleEn: "Cryptography & Secure Communication",
  titleDe: "Verschlüsselung, Schlüsselmanagement und sichere Kommunikationskanäle",
  description: "Cryptography, key management and secure communication channels",
  icon: "lock",
  questions: [
    { id: "h-01", question: "Gibt es eine dokumentierte Kryptographie-Richtlinie, die Algorithmen, Schlüssellängen und Anwendungsbereiche definiert?", questionEn: "Is there a documented cryptography policy that defines algorithms, key lengths, and areas of application?", description: "Eine Kryptographie-Richtlinie legt fest, welche Verschlüsselungsverfahren in welchen Szenarien eingesetzt werden.", descriptionEn: "A cryptography policy determines which encryption methods are used in which scenarios.", status: null },
    { id: "h-02", question: "Werden alle Daten bei der Übertragung über öffentliche Netze verschlüsselt (TLS 1.2/1.3)?", questionEn: "Is all data encrypted during transmission over public networks (TLS 1.2/1.3)?", description: "Transport Layer Security schützt Daten bei der Übertragung vor Abhören und Manipulation.", descriptionEn: "Transport Layer Security protects data during transmission against eavesdropping and manipulation.", status: null },
    { id: "h-03", question: "Werden sensible Daten im Ruhezustand (at rest) verschlüsselt?", questionEn: "Is sensitive data encrypted at rest?", description: "Festplattenverschlüsselung und Datenbankverschlüsselung schützen Daten bei physischem Zugriff.", descriptionEn: "Disk encryption and database encryption protect data against physical access.", status: null },
    { id: "h-04", question: "Gibt es ein zentrales Schlüsselmanagement mit definierten Prozessen für Erzeugung, Verteilung, Rotation und Vernichtung?", questionEn: "Is there centralized key management with defined processes for generation, distribution, rotation, and destruction?", description: "Key Management umfasst den gesamten Lebenszyklus kryptographischer Schlüssel.", descriptionEn: "Key management covers the entire lifecycle of cryptographic keys.", status: null },
    { id: "h-05", question: "Werden regelmäßig die eingesetzten kryptographischen Verfahren auf Aktualität und Sicherheit überprüft?", questionEn: "Are deployed cryptographic methods regularly reviewed for currency and security?", description: "Kryptographische Algorithmen müssen regelmäßig gegen aktuelle Empfehlungen (z.B. BSI TR-02102) geprüft werden.", descriptionEn: "Cryptographic algorithms must be regularly checked against current recommendations (e.g., BSI TR-02102).", status: null },
    { id: "h-06", question: "Werden E-Mails mit vertraulichen Inhalten verschlüsselt übertragen?", questionEn: "Are emails with confidential content transmitted encrypted?", description: "E-Mail-Verschlüsselung (S/MIME oder PGP) schützt vertrauliche Kommunikation.", descriptionEn: "Email encryption (S/MIME or PGP) protects confidential communication.", status: null },
    { id: "h-07", question: "Werden VPN-Verbindungen für Remote-Zugriffe eingesetzt und sicher konfiguriert?", questionEn: "Are VPN connections used for remote access and securely configured?", description: "VPN-Verbindungen schützen den Datenverkehr bei Fernzugriffen auf das Unternehmensnetzwerk.", descriptionEn: "VPN connections protect data traffic during remote access to the corporate network.", status: null },
    { id: "h-08", question: "Werden Zertifikate zentral verwaltet und rechtzeitig erneuert?", questionEn: "Are certificates centrally managed and renewed in time?", description: "Certificate Lifecycle Management verhindert Ausfälle durch abgelaufene Zertifikate.", descriptionEn: "Certificate lifecycle management prevents outages due to expired certificates.", status: null },
    { id: "h-09", question: "Gibt es Pläne für die Migration zu quantensicherer Kryptographie?", questionEn: "Are there plans for migration to quantum-safe cryptography?", description: "Post-Quantum-Kryptographie-Readiness bereitet auf die Bedrohung durch Quantencomputer vor.", descriptionEn: "Post-quantum cryptography readiness prepares for the threat from quantum computers.", status: null },
    { id: "j-01", question: "Werden gesicherte Kommunikationskanäle für vertrauliche interne Kommunikation verwendet?", questionEn: "Are secure communication channels used for confidential internal communication?", description: "Ende-zu-Ende-verschlüsselte Kommunikationstools für sensible Geschäftskommunikation.", descriptionEn: "End-to-end encrypted communication tools for sensitive business communication.", status: null },
    { id: "j-02", question: "Gibt es gesicherte Notfallkommunikationssysteme, die unabhängig von der regulären IT-Infrastruktur funktionieren?", questionEn: "Are there secure emergency communication systems that function independently of regular IT infrastructure?", description: "Alternative Kommunikationswege für den Fall, dass die primäre Infrastruktur kompromittiert ist.", descriptionEn: "Alternative communication channels in case the primary infrastructure is compromised.", status: null },
    { id: "j-03", question: "Werden Videokonferenz-Systeme sicher konfiguriert und gegen unbefugten Zugriff geschützt?", questionEn: "Are video conferencing systems securely configured and protected against unauthorized access?", description: "Sichere Konfiguration von Videokonferenz-Tools verhindert unbefugtes Mithören.", descriptionEn: "Secure configuration of video conferencing tools prevents unauthorized eavesdropping.", status: null },
    { id: "j-04", question: "Ist ein sicherer Dateitransfer-Mechanismus für den Austausch vertraulicher Dokumente vorhanden?", questionEn: "Is a secure file transfer mechanism available for exchanging confidential documents?", description: "Sichere File-Sharing-Lösungen ersetzen unsichere Übertragungswege wie unverschlüsselte E-Mail-Anhänge.", descriptionEn: "Secure file-sharing solutions replace insecure transfer methods such as unencrypted email attachments.", status: null },
  ],
};

const techVuln: NIS2Category = {
  id: "tech-vuln",
  article: "A.8.7–8.8",
  nis2Ref: "NIS2 Art. 21(2)(f)",
  title: "Schwachstellen- & Patch-Management",
  titleEn: "Vulnerability & Patch Management",
  titleDe: "Schwachstellenmanagement, Patch-Management und Malware-Schutz",
  description: "Vulnerability management, patching and malware protection",
  icon: "alert-triangle",
  questions: [
    { id: "a-09", question: "Wird ein Schwachstellenmanagement-Prozess betrieben, der regelmäßige Scans und zeitnahe Behebung umfasst?", questionEn: "Is a vulnerability management process operated that includes regular scans and timely remediation?", description: "Automatisierte Schwachstellenscanner identifizieren Sicherheitslücken, die nach Risikobewertung priorisiert behoben werden.", descriptionEn: "Automated vulnerability scanners identify security gaps that are remediated based on risk assessment priority.", status: null },
    { id: "e-07", question: "Werden Betriebssystem-Patches automatisiert und zeitnah eingespielt?", questionEn: "Are operating system patches applied automatically and in a timely manner?", description: "Ein automatisiertes Patch-Management stellt sicher, dass kritische Updates innerhalb definierter Fristen installiert werden.", descriptionEn: "Automated patch management ensures that critical updates are installed within defined deadlines.", status: null },
    { id: "e-08", question: "Werden Anwendungs-Updates und -Patches automatisiert verteilt und installiert?", questionEn: "Are application updates and patches automatically distributed and installed?", description: "Nicht nur das OS, sondern auch alle Fachanwendungen und Standardsoftware müssen aktuell gehalten werden.", descriptionEn: "Not only the OS, but all business applications and standard software must be kept up to date.", status: null },
    { id: "e-09", question: "Werden regelmäßig automatisierte Schwachstellenscans sowohl intern als auch extern durchgeführt?", questionEn: "Are automated vulnerability scans conducted regularly both internally and externally?", description: "Interne und externe Scans identifizieren Schwachstellen aus verschiedenen Perspektiven.", descriptionEn: "Internal and external scans identify vulnerabilities from different perspectives.", status: null },
    { id: "e-10", question: "Werden erkannte Schwachstellen nach Risikobewertung priorisiert und zeitnah behoben?", questionEn: "Are identified vulnerabilities prioritized by risk assessment and remediated promptly?", description: "Kritische Schwachstellen müssen innerhalb definierter SLAs (z.B. 72h für kritisch) geschlossen werden.", descriptionEn: "Critical vulnerabilities must be closed within defined SLAs (e.g., 72h for critical).", status: null },
    { id: "a-11", question: "Werden regelmäßig Penetrationstests durch qualifizierte Dritte durchgeführt?", questionEn: "Are penetration tests regularly conducted by qualified third parties?", description: "Externe Penetrationstests überprüfen die Wirksamkeit der Sicherheitsmaßnahmen und identifizieren unbekannte Schwachstellen.", descriptionEn: "External penetration tests verify the effectiveness of security measures and identify unknown vulnerabilities.", status: null },
    { id: "e-19", question: "Gibt es einen Prozess für das Management von Sicherheitswarnungen (Advisories, CVEs)?", questionEn: "Is there a process for managing security advisories (advisories, CVEs)?", description: "Sicherheitswarnungen von BSI, CERT-Bund und Herstellern werden systematisch ausgewertet und umgesetzt.", descriptionEn: "Security advisories from BSI, CERT-Bund, and vendors are systematically evaluated and implemented.", status: null },
    { id: "a-05", question: "Werden unautorisierte Geräte im Netzwerk automatisch erkannt und behandelt?", questionEn: "Are unauthorized devices on the network automatically detected and handled?", description: "Mechanismen wie NAC (Network Access Control) erkennen und blockieren nicht autorisierte Geräte im Unternehmensnetzwerk.", descriptionEn: "Mechanisms such as NAC (Network Access Control) detect and block unauthorized devices on the corporate network.", status: null },
    { id: "a-06", question: "Wird sichergestellt, dass nur unterstützte und aktuelle Software eingesetzt wird (keine End-of-Life-Produkte)?", questionEn: "Is it ensured that only supported and current software is used (no end-of-life products)?", description: "Software, die vom Hersteller nicht mehr mit Sicherheitsupdates versorgt wird, stellt ein erhebliches Risiko dar.", descriptionEn: "Software no longer receiving security updates from the vendor poses a significant risk.", status: null },
    { id: "tech-05", question: "Wird Antimalware-Software auf allen Systemen eingesetzt und regelmäßig aktualisiert?", questionEn: "Is anti-malware software deployed on all systems and regularly updated?", description: "Antivirus/Antimalware mit automatischen Signatur-Updates und regelmäßigen Scans.", descriptionEn: "Antivirus/anti-malware with automatic signature updates and regular scans.", status: null },
    { id: "tech-06", question: "Gibt es einen Prozess zur Erkennung und Blockierung bösartiger Websites?", questionEn: "Is there a process for detecting and blocking malicious websites?", description: "Web-Proxy und E-Mail-Gateway filtern bösartige Inhalte vor Zustellung.", descriptionEn: "Web proxy and email gateway filter malicious content before delivery.", status: null },
  ],
};

const techDev: NIS2Category = {
  id: "tech-dev",
  article: "A.8.25–8.34",
  nis2Ref: "NIS2 Art. 21(2)(e)",
  title: "Sichere Entwicklung & Change Management",
  titleEn: "Secure Development & Change Management",
  titleDe: "Sicherer Entwicklungslebenszyklus, Umgebungstrennung und Änderungsmanagement",
  description: "Secure SDLC, environment separation and change management",
  icon: "code",
  questions: [
    { id: "e-14", question: "Gibt es einen sicheren Softwareentwicklungsprozess (Secure SDLC) für eigenentwickelte Anwendungen?", questionEn: "Is there a secure software development process (Secure SDLC) for internally developed applications?", description: "Sicherheitsanforderungen werden von Anfang an in den Entwicklungsprozess integriert.", descriptionEn: "Security requirements are integrated into the development process from the start.", status: null },
    { id: "e-16", question: "Gibt es getrennte Umgebungen für Entwicklung, Test und Produktion?", questionEn: "Are there separate environments for development, test, and production?", description: "Die Trennung verhindert, dass ungetestete Änderungen produktive Systeme beeinträchtigen.", descriptionEn: "Separation prevents untested changes from affecting production systems.", status: null },
    { id: "e-17", question: "Werden Webanwendungen durch eine Web Application Firewall (WAF) geschützt?", questionEn: "Are web applications protected by a Web Application Firewall (WAF)?", description: "WAFs schützen öffentlich erreichbare Webanwendungen vor gängigen Angriffen (SQL Injection, XSS).", descriptionEn: "WAFs protect publicly accessible web applications against common attacks (SQL injection, XSS).", status: null },
    { id: "e-18", question: "Werden Sicherheitsanforderungen bei der Beschaffung neuer IT-Systeme als Auswahlkriterium berücksichtigt?", questionEn: "Are security requirements considered as selection criteria when procuring new IT systems?", description: "Security-by-Design: Sicherheitsaspekte fließen bereits in die Anforderungsdefinition und Produktauswahl ein.", descriptionEn: "Security by design: Security aspects are included in requirements definition and product selection.", status: null },
    { id: "e-15", question: "Werden regelmäßig externe und interne Penetrationstests durchgeführt und Findings behoben?", questionEn: "Are external and internal penetration tests conducted regularly and findings remediated?", description: "Penetrationstests validieren die Wirksamkeit der Sicherheitsmaßnahmen unter realen Angriffsbedingungen.", descriptionEn: "Penetration tests validate the effectiveness of security measures under real attack conditions.", status: null },
    { id: "a-18", question: "Gibt es einen formellen Change-Management-Prozess für Änderungen an IT-Systemen?", questionEn: "Is there a formal change management process for changes to IT systems?", description: "Alle Änderungen an produktiven Systemen durchlaufen einen dokumentierten Genehmigungs- und Testprozess.", descriptionEn: "All changes to production systems go through a documented approval and testing process.", status: null },
    { id: "tech-07", question: "Werden Secure-Coding-Richtlinien angewendet (z.B. OWASP Top 10)?", questionEn: "Are secure coding guidelines applied (e.g., OWASP Top 10)?", description: "Entwickler folgen sicheren Codierungspraktiken und werden regelmäßig geschult.", descriptionEn: "Developers follow secure coding practices and are regularly trained.", status: null },
    { id: "tech-08", question: "Werden Sicherheitstests (SAST, DAST, Code Review) im Entwicklungsprozess durchgeführt?", questionEn: "Are security tests (SAST, DAST, code review) conducted in the development process?", description: "Statische und dynamische Analyse identifizieren Schwachstellen vor der Produktion.", descriptionEn: "Static and dynamic analysis identify vulnerabilities before production.", status: null },
    { id: "tech-09", question: "Werden ausgelagerte Entwicklungsprojekte hinsichtlich Sicherheit überwacht?", questionEn: "Are outsourced development projects monitored for security?", description: "Vertragliche Sicherheitsanforderungen und Codeprüfungen für externe Entwickler.", descriptionEn: "Contractual security requirements and code reviews for external developers.", status: null },
    { id: "tech-10", question: "Werden Testdaten angemessen geschützt und kontrolliert?", questionEn: "Is test data adequately protected and controlled?", description: "Produktionsdaten in Testumgebungen werden anonymisiert oder durch geeignete Kontrollen geschützt.", descriptionEn: "Production data in test environments is anonymized or protected by appropriate controls.", status: null },
  ],
};

const techMonitoring: NIS2Category = {
  id: "tech-monitoring",
  article: "A.8.6, A.8.15–8.17",
  nis2Ref: "NIS2 Art. 21(2)(g)",
  title: "Überwachung, Logging & Datensicherung",
  titleEn: "Monitoring, Logging & Backup",
  titleDe: "Kapazitätsmanagement, Protokollierung, Überwachung und Backup",
  description: "Capacity management, logging, monitoring and backup",
  icon: "bar-chart",
  questions: [
    { id: "a-10", question: "Existiert ein zentrales Audit-Log-Management mit definierter Aufbewahrungsfrist?", questionEn: "Does a centralized audit log management system with defined retention periods exist?", description: "Alle sicherheitsrelevanten Ereignisse werden zentral protokolliert, überwacht und für mindestens 6 Monate aufbewahrt.", descriptionEn: "All security-relevant events are centrally logged, monitored, and retained for at least 6 months.", status: null },
    { id: "b-10", question: "Werden Sicherheitsereignisse zentral gesammelt und korreliert (SIEM oder vergleichbar)?", questionEn: "Are security events centrally collected and correlated (SIEM or equivalent)?", description: "Ein zentrales System sammelt und korreliert Logs aus verschiedenen Quellen zur Erkennung von Angriffsmustern.", descriptionEn: "A central system collects and correlates logs from various sources to detect attack patterns.", status: null },
    { id: "j-08", question: "Werden regelmäßig Kommunikationsaudits durchgeführt, um unsichere Kanäle zu identifizieren?", questionEn: "Are communication audits regularly conducted to identify insecure channels?", description: "Audits identifizieren unsichere Kommunikationspraktiken und nicht autorisierte Kanäle.", descriptionEn: "Audits identify insecure communication practices and unauthorized channels.", status: null },
    { id: "tech-11", question: "Werden Netzwerke, Systeme und Anwendungen auf anomales Verhalten überwacht?", questionEn: "Are networks, systems, and applications monitored for anomalous behavior?", description: "Baselines für Normalverhalten ermöglichen die Erkennung von Anomalien.", descriptionEn: "Baselines for normal behavior enable the detection of anomalies.", status: null },
    { id: "tech-12", question: "Werden die Uhren aller Systeme mit genehmigten Zeitquellen synchronisiert?", questionEn: "Are the clocks of all systems synchronized with approved time sources?", description: "Zeitsynchronisation (NTP) ist essenziell für die Korrelation von Log-Einträgen.", descriptionEn: "Time synchronization (NTP) is essential for correlating log entries.", status: null },
    { id: "tech-13", question: "Wird die Nutzung von Ressourcen überwacht und an aktuelle Kapazitätsanforderungen angepasst?", questionEn: "Is resource usage monitored and adjusted to current capacity requirements?", description: "Kapazitätsplanung verhindert Ausfälle durch Ressourcenengpässe.", descriptionEn: "Capacity planning prevents outages due to resource bottlenecks.", status: null },
    { id: "c-01", question: "Gibt es einen dokumentierten Prozess für die Datensicherung, der Umfang, Häufigkeit und Aufbewahrung definiert?", questionEn: "Is there a documented data backup process that defines scope, frequency, and retention?", description: "Ein Backup-Konzept legt fest, welche Daten wie oft gesichert werden und wie lange Sicherungen aufbewahrt werden.", descriptionEn: "A backup concept defines which data is backed up, how often, and how long backups are retained.", status: null },
    { id: "c-02", question: "Werden automatisierte Backups aller kritischen Systeme und Daten durchgeführt?", questionEn: "Are automated backups of all critical systems and data performed?", description: "Automatische Datensicherungen stellen sicher, dass keine manuellen Schritte vergessen werden.", descriptionEn: "Automated data backups ensure that no manual steps are forgotten.", status: null },
    { id: "c-03", question: "Werden Backup-Daten vor unbefugtem Zugriff geschützt (Verschlüsselung, Zugriffskontrolle)?", questionEn: "Are backup data protected against unauthorized access (encryption, access control)?", description: "Sicherungsdaten müssen verschlüsselt und vor Manipulation geschützt gespeichert werden.", descriptionEn: "Backup data must be stored encrypted and protected against manipulation.", status: null },
    { id: "c-04", question: "Existiert eine isolierte Kopie der Sicherungsdaten (Air-Gapped oder Offline-Backup)?", questionEn: "Does an isolated copy of backup data exist (air-gapped or offline backup)?", description: "Eine physisch oder logisch isolierte Backup-Kopie schützt vor Ransomware, die auch Netzwerk-Backups verschlüsselt.", descriptionEn: "A physically or logically isolated backup copy protects against ransomware that also encrypts network backups.", status: null },
    { id: "c-05", question: "Werden Wiederherstellungstests regelmäßig durchgeführt und dokumentiert?", questionEn: "Are recovery tests regularly conducted and documented?", description: "Mindestens halbjährliche Tests der Datenwiederherstellung stellen die Funktionsfähigkeit der Backups sicher.", descriptionEn: "At least semi-annual data recovery tests ensure the functionality of backups.", status: null },
  ],
};

const techDataProtection: NIS2Category = {
  id: "tech-data",
  article: "A.8.10–8.14",
  nis2Ref: "NIS2 Art. 21(2)(e)",
  title: "Datensicherheit, Löschung & Backup",
  titleEn: "Data Protection & Deletion",
  titleDe: "Informationslöschung, Datenmaskierung, DLP und Redundanz",
  description: "Data deletion, masking, leakage prevention and redundancy",
  icon: "database-backup",
  questions: [
    { id: "tech-14", question: "Gibt es eine Richtlinie zur sicheren Löschung von Daten und IT-Assets?", questionEn: "Is there a policy for the secure deletion of data and IT assets?", description: "Verfahren zur sicheren Datenlöschung verhindern die Wiederherstellung gelöschter Informationen.", descriptionEn: "Secure data deletion procedures prevent the recovery of deleted information.", status: null },
    { id: "tech-15", question: "Werden Datenmaskierungstechniken eingesetzt, um den Zugriff auf sensible Daten zu minimieren?", questionEn: "Are data masking techniques used to minimize access to sensitive data?", description: "Anonymisierung oder Pseudonymisierung von Daten gemäß regulatorischer Anforderungen.", descriptionEn: "Anonymization or pseudonymization of data according to regulatory requirements.", status: null },
    { id: "tech-16", question: "Sind Maßnahmen zur Verhinderung von Datenlecks (DLP) implementiert?", questionEn: "Are data leakage prevention (DLP) measures implemented?", description: "Data Loss Prevention überwacht E-Mail, Dateitransfer und USB-Geräte auf unberechtigte Datenabflüsse.", descriptionEn: "Data Loss Prevention monitors email, file transfer, and USB devices for unauthorized data outflows.", status: null },
    { id: "tech-17", question: "Werden Informationsverarbeitungsanlagen mit ausreichender Redundanz betrieben?", questionEn: "Are information processing facilities operated with sufficient redundancy?", description: "Redundante Systeme und geografisch verteilte Standorte sichern die Verfügbarkeit.", descriptionEn: "Redundant systems and geographically distributed sites ensure availability.", status: null },
    { id: "tech-18", question: "Werden privilegierte Dienstprogramme kontrolliert und deren Nutzung protokolliert?", questionEn: "Are privileged utility programs controlled and their usage logged?", description: "Utility-Programme mit erhöhten Rechten unterliegen besonderen Zugriffskontrollen.", descriptionEn: "Utility programs with elevated privileges are subject to special access controls.", status: null },
    { id: "tech-19", question: "Gibt es Verfahren für die sichere Installation von Software auf produktiven Systemen?", questionEn: "Are there procedures for the secure installation of software on production systems?", description: "Nur genehmigte Software wird installiert, Änderungen werden dokumentiert.", descriptionEn: "Only approved software is installed, changes are documented.", status: null },
    { id: "tech-20", question: "Werden Audit-Tests und Prüfungen so geplant, dass operative Systeme nicht beeinträchtigt werden?", questionEn: "Are audit tests and reviews planned so that operational systems are not impacted?", description: "Audits operativer Systeme werden koordiniert und minimieren Betriebsstörungen.", descriptionEn: "Audits of operational systems are coordinated and minimize operational disruptions.", status: null },
  ],
};

// =============================================
// v3 — 30 NEW CONTROLS (245 total, 19 families)
// MFA & Strong Authentication is the new (19th) family.
// All other groups slot into existing families via controlMetadata.
// =============================================

const mfaStrongAuth: NIS2Category = {
  id: "mfa-strong-auth",
  article: "A.8.5",
  nis2Ref: "NIS2 Art. 21(2)(j)",
  title: "MFA & Strong Authentication",
  titleEn: "MFA & Strong Authentication",
  titleDe: "Mehr-Faktor-Authentifizierung & starke Authentifizierung",
  description: "Multi-factor and phishing-resistant authentication across privileged, remote and user-facing systems",
  icon: "smartphone",
  questions: [
    { id: "iam-mfa-1", question: "Wird Mehr-Faktor-Authentifizierung (MFA) für alle administrativen und privilegierten Konten erzwungen?", questionEn: "Is multi-factor authentication (MFA) enforced for all administrative and privileged accounts?", description: "Setzt Art. 21(2)(j) NIS2 für die risikoreichsten Identitäten unmittelbar um.", descriptionEn: "Directly implements Art. 21(2)(j) by enforcing MFA on the highest-risk identities.", status: null },
    { id: "iam-mfa-2", question: "Wird MFA für alle Fernzugriffe und VPN-Sitzungen erzwungen?", questionEn: "Is MFA enforced for all remote-access and VPN sessions?", description: "Art. 21(2)(j) verlangt MFA für jeden externen Zugang zu Netz- und Informationssystemen.", descriptionEn: "Mandated under Art. 21(2)(j) for any external/remote access path to network and information systems.", status: null },
    { id: "iam-mfa-3", question: "Wird MFA für E-Mail, Kollaborations- und SSO-/Identity-Provider-Portale erzwungen?", questionEn: "Is MFA enforced on email, collaboration and SSO/identity-provider portals?", description: "Deckt die am haeufigsten angegriffenen Nutzersysteme nach Art. 21(2)(j) ab.", descriptionEn: "Covers the most-targeted user-facing systems referenced under Art. 21(2)(j).", status: null },
    { id: "iam-mfa-4", question: "Werden phishing-resistente MFA-Faktoren (FIDO2, Hardware-Token, zertifikatsbasiert) fuer privilegierte und hochriskante Nutzer eingesetzt?", questionEn: "Are phishing-resistant MFA factors (FIDO2, hardware tokens, certificate-based auth) used for privileged and high-risk users?", description: "Setzt die Qualifikation 'starke Authentifizierung' aus Art. 21(2)(j) nach ENISA-Leitlinien um.", descriptionEn: "Implements the 'strong authentication' qualification of Art. 21(2)(j) per ENISA guidance.", status: null },
    { id: "iam-mfa-5", question: "Sind MFA-Bypass-, Ausnahme- und Wiederherstellungsverfahren dokumentiert, zeitlich begrenzt und auditierbar?", questionEn: "Are MFA bypass, exemption and recovery procedures documented, time-limited and auditable?", description: "Bewahrt die Integritaet der nach Art. 21(2)(j) geforderten MFA-Kontrollen.", descriptionEn: "Maintains the integrity of the MFA controls required by Art. 21(2)(j).", status: null },
    { id: "iam-mfa-6", question: "Werden MFA-Enrolment-, Nutzungs- und Fehlversuchs-Ereignisse zentral protokolliert und ueberwacht?", questionEn: "Are MFA enrolment, usage and failed-attempt events centrally logged and monitored?", description: "Liefert die operative Nachweisgrundlage fuer Art. 21(2)(j).", descriptionEn: "Provides the operational evidence base for Art. 21(2)(j) compliance.", status: null },
  ],
};

const awrPhishing: NIS2Category = {
  id: "awr-phishing-sim",
  article: "A.6.3",
  nis2Ref: "NIS2 Art. 21(2)(g)",
  title: "Phishing-Simulationen",
  titleEn: "Phishing Simulations",
  titleDe: "Phishing-Simulationen mit messbaren KPIs",
  description: "Measurable phishing simulations with follow-up training",
  icon: "graduation-cap",
  questions: [
    { id: "awr-13", question: "Werden Phishing-Simulationen mindestens jaehrlich mit messbaren Klickraten-KPIs und Nachschulung fuer wiederholte Klicker durchgefuehrt?", questionEn: "Are phishing simulations conducted at least annually with measurable click-rate KPIs and follow-up training for repeat clickers?", description: "Operationalisiert die Cyberhygiene- und Schulungspflicht aus Art. 21(2)(g) mit messbaren Ergebnissen.", descriptionEn: "Operationalises the cyber-hygiene and training obligation under Art. 21(2)(g) with measurable outcomes.", status: null },
  ],
};

const incComms: NIS2Category = {
  id: "inc-comms",
  article: "A.5.5",
  nis2Ref: "NIS2 Art. 23",
  title: "Meldepflichten & Behoerdenkommunikation",
  titleEn: "Reporting Obligations & Authority Communications",
  titleDe: "24h-/72h-/1-Monats-Meldungen an die zustaendige Behoerde",
  description: "24h early warning, 72h notification, 1-month final report per Art. 23 NIS2",
  icon: "alert-triangle",
  questions: [
    { id: "inc-comm-1", question: "Ist ein 24-Stunden-Fruehwarnverfahren an die zustaendige Behoerde (BSI) dokumentiert und getestet?", questionEn: "Is a 24-hour early-warning notification procedure to the competent authority (BSI) documented and tested?", description: "Setzt die 24-Stunden-Fruehwarnpflicht nach Art. 23(4)(a) NIS2 und NIS2 Art. 23 um.", descriptionEn: "Implements the 24-hour early-warning duty under Art. 23(4)(a) and NIS2 Art. 23.", status: null },
    { id: "inc-comm-2", question: "Ist ein 72-Stunden-Meldeverfahren (Erstbewertung, IOCs, Auswirkungen) definiert und geuebt?", questionEn: "Is a 72-hour incident notification procedure (initial assessment, IOCs, impact) defined and exercised?", description: "Setzt die 72-Stunden-Meldepflicht nach Art. 23(4)(b) NIS2 und NIS2 Art. 23 um.", descriptionEn: "Implements the 72-hour notification duty under Art. 23(4)(b) and NIS2 Art. 23.", status: null },
    { id: "inc-comm-3", question: "Ist ein Abschlussbericht-Verfahren (innerhalb 1 Monat) inkl. Ursachenanalyse und Stand der Gegenmassnahmen definiert?", questionEn: "Is a final incident report (within 1 month) procedure defined, including root-cause analysis and mitigation status?", description: "Setzt die 1-Monats-Abschlussberichtspflicht nach Art. 23(4)(d) NIS2 und NIS2 Art. 23 um.", descriptionEn: "Implements the one-month final-report duty under Art. 23(4)(d) and NIS2 Art. 23.", status: null },
  ],
};

const incForensics: NIS2Category = {
  id: "inc-forensics",
  article: "A.5.28",
  nis2Ref: "NIS2 Art. 21(2)(b)",
  title: "Forensik-Bereitschaft",
  titleEn: "Forensics Readiness",
  titleDe: "Digitale Forensik & Beweissicherung",
  description: "Digital forensics readiness and chain of custody",
  icon: "search",
  questions: [
    { id: "inc-17", question: "Ist ein Verfahren zur digitalen Forensik-Bereitschaft (Beweissicherung, Beweiskette) dokumentiert und getestet?", questionEn: "Is a digital-forensics readiness procedure (evidence preservation, chain of custody) documented and tested?", description: "Staerkt die Incident-Handling-Faehigkeit aus Art. 21(2)(b).", descriptionEn: "Strengthens the incident-handling capability mandated by Art. 21(2)(b).", status: null },
  ],
};

const cryptoModern: NIS2Category = {
  id: "crypto-modern",
  article: "A.8.24",
  nis2Ref: "NIS2 Art. 21(2)(h)",
  title: "Crypto-Agility & Ende-zu-Ende-Verschluesselung",
  titleEn: "Crypto Agility & End-to-End Encryption",
  titleDe: "Post-Quantum-Bereitschaft und durchgehende Verschluesselung",
  description: "Crypto agility, post-quantum readiness and end-to-end encryption",
  icon: "lock",
  questions: [
    { id: "cry-pq-1", question: "Ist ein Crypto-Agility-/Post-Quantum-Bereitschaftsplan inkl. Inventar der asymmetrischen Algorithmen dokumentiert?", questionEn: "Is a crypto-agility / post-quantum readiness plan documented, including inventory of asymmetric algorithms in use?", description: "Zukunftsgerichtete Compliance mit Art. 21(2)(h) und ENISA-Crypto-Guidance zur PQ-Migration.", descriptionEn: "Forward-looking compliance with Art. 21(2)(h) and ENISA crypto guidance on PQ migration.", status: null },
    { id: "cry-pq-2", question: "Wird Ende-zu-Ende-Verschluesselung fuer sensible Daten im Transit zwischen Standorten, Cloud-Regionen und Dritten angewendet?", questionEn: "Is end-to-end encryption applied to sensitive data in transit between sites, cloud regions and third parties?", description: "Setzt die Transportverschluesselungspflicht aus Art. 21(2)(h) um.", descriptionEn: "Implements the encryption-in-transit obligation under Art. 21(2)(h).", status: null },
  ],
};

const otIcsControls: NIS2Category = {
  id: "ot-ics-controls",
  article: "A.8.22",
  nis2Ref: "NIS2 Art. 21(2)(e)",
  title: "OT/ICS-Sicherheit (IEC 62443)",
  titleEn: "OT/ICS Security (IEC 62443)",
  titleDe: "Segmentierung, Fernwartung, Inventar und Safety-Trennung fuer OT/ICS",
  description: "OT/ICS segmentation, remote access, inventory and SIS separation per IEC 62443",
  icon: "factory",
  questions: [
    { id: "ot-1", question: "Ist das OT/ICS-Netz vom IT-Netz segmentiert (Purdue-Modell/iDMZ) mit dokumentierten Datenfluss-Regeln?", questionEn: "Is the OT/ICS network segmented from IT (Purdue model / iDMZ) with documented data-flow rules?", description: "Setzt die Segmentierungsanforderung aus Art. 21(2)(e) fuer OT-Umgebungen nach IEC 62443 um.", descriptionEn: "Implements the segmentation requirement of Art. 21(2)(e) for OT environments per IEC 62443.", status: null },
    { id: "ot-2", question: "Ist Fernzugriff auf OT/ICS (Hersteller-Wartung, Jump-Hosts) kontrolliert, MFA-geschuetzt, zeitlich begrenzt und protokolliert?", questionEn: "Is remote access to OT/ICS (vendor maintenance, jump hosts) controlled, MFA-protected, time-limited and logged?", description: "Schliesst den haeufigsten OT-Angriffspfad nach Art. 21(2)(e) und Art. 21(2)(j).", descriptionEn: "Closes the most common OT attack path under Art. 21(2)(e) and Art. 21(2)(j).", status: null },
    { id: "ot-3", question: "Wird ein aktuelles OT/ICS-Asset-Inventar (SPS/PLC, SCADA, Sensoren, Safety-Systeme) inkl. Firmware-Versionen gepflegt?", questionEn: "Is a current OT/ICS asset inventory (SPS/PLC, SCADA, sensors, safety systems) maintained with firmware versions?", description: "Grundlage fuer Schwachstellenmanagement und Beschaffungskontrollen nach Art. 21(2)(e).", descriptionEn: "Underpins vulnerability management and acquisition controls under Art. 21(2)(e).", status: null },
    { id: "ot-4", question: "Sind Safety Instrumented Systems (SIS) logisch und physisch von den Prozessleitsystemen getrennt?", questionEn: "Are Safety Instrumented Systems (SIS) logically and physically separated from process-control systems?", description: "Setzt das Safety-/Security-Trennprinzip aus IEC 62443 und Art. 21(2)(e) um.", descriptionEn: "Implements the safety/security separation principle required by IEC 62443 and Art. 21(2)(e).", status: null },
  ],
};

const supplierExt: NIS2Category = {
  id: "supplier-ext",
  article: "A.5.21",
  nis2Ref: "NIS2 Art. 21(2)(d)",
  title: "Erweiterte Lieferantensicherheit",
  titleEn: "Extended Supplier Security",
  titleDe: "Tiered-Klassifizierung, NIS2-Klauseln und SBOM",
  description: "Tiered supplier classification, contractual NIS2 clauses and SBOM intake",
  icon: "link",
  questions: [
    { id: "sup-7", question: "Wird eine gestufte Kritikalitaetsklassifizierung der Lieferanten (kritisch/wichtig/standard) gepflegt und jaehrlich ueberprueft?", questionEn: "Is a tiered criticality classification of suppliers (critical / important / standard) maintained and reviewed annually?", description: "Setzt die risikobasierte Lieferketten-Bewertung nach Art. 21(2)(d) um.", descriptionEn: "Implements the risk-based supply-chain assessment required by Art. 21(2)(d).", status: null },
    { id: "sup-8", question: "Enthalten Vertraege mit kritischen Lieferanten explizite NIS2-Kooperations-, Vorfallmelde- und Audit-Klauseln?", questionEn: "Do contracts with critical suppliers contain explicit NIS2 cooperation, incident-notification and audit clauses?", description: "Operationalisiert die vertragliche Dimension aus Art. 21(2)(d).", descriptionEn: "Operationalises the contractual dimension of Art. 21(2)(d).", status: null },
    { id: "sup-9", question: "Wird fuer kritische Software-/SaaS-Lieferanten ein Software Bill of Materials (SBOM) angefordert und im Schwachstellen-Triage genutzt?", questionEn: "Is a software bill of materials (SBOM) requested for critical software/SaaS suppliers and used in vulnerability triage?", description: "Setzt Lieferketten-Transparenz nach Art. 21(2)(d) gemaess ENISA-SBOM-Leitlinien um.", descriptionEn: "Implements supply-chain transparency under Art. 21(2)(d) consistent with ENISA SBOM guidance.", status: null },
  ],
};

const vulnExt: NIS2Category = {
  id: "vuln-ext",
  article: "A.8.8",
  nis2Ref: "NIS2 Art. 21(2)(e)",
  title: "Erweitertes Schwachstellenmanagement",
  titleEn: "Extended Vulnerability Management",
  titleDe: "EASM, CVD, Patch-SLAs und Threat-Intelligence",
  description: "External attack surface scanning, coordinated vulnerability disclosure, patch SLAs and threat intelligence",
  icon: "alert-triangle",
  questions: [
    { id: "vul-7", question: "Werden externe Angriffsflaechen-Scans (EASM) mindestens monatlich mit dokumentierten Remediation-SLAs durchgefuehrt?", questionEn: "Are external attack-surface (EASM) scans conducted at least monthly with documented remediation SLAs?", description: "Kontinuierliche Erkennung internet-exponierter Schwachstellen nach Art. 21(2)(e).", descriptionEn: "Continuous discovery of internet-exposed weaknesses required by Art. 21(2)(e).", status: null },
    { id: "vul-8", question: "Ist eine Coordinated-Vulnerability-Disclosure-Richtlinie (CVD) mit security.txt-Kontakt veroeffentlicht?", questionEn: "Is a coordinated vulnerability disclosure (CVD) policy published with a security.txt contact?", description: "Im Einklang mit ENISA-CVD-Leitlinien und Art. 21(2)(e).", descriptionEn: "Aligns with ENISA CVD guidance and supports Art. 21(2)(e).", status: null },
    { id: "vul-9", question: "Sind Patch-Deployment-SLAs je Schweregrad (kritisch/hoch/mittel) definiert und gemessen?", questionEn: "Are patch-deployment SLAs defined per severity (critical/high/medium) and measured?", description: "Operationalisiert die zeitnahe Remediation nach Art. 21(2)(e).", descriptionEn: "Operationalises timely remediation under Art. 21(2)(e).", status: null },
    { id: "vul-10", question: "Wird Threat-Intelligence (CVE-Feeds, BSI CERT-Bund, Branchen-CERT) in das Schwachstellen-Triage integriert?", questionEn: "Is threat-intelligence (CVE feeds, BSI CERT-Bund, sector-CERT) integrated into vulnerability triage?", description: "Setzt das bedrohungs-bewusste Schwachstellenmanagement aus Art. 21(2)(e) um.", descriptionEn: "Implements the threat-aware vulnerability management aspect of Art. 21(2)(e).", status: null },
  ],
};

const devExt: NIS2Category = {
  id: "dev-ext",
  article: "A.8.28",
  nis2Ref: "NIS2 Art. 21(2)(e)",
  title: "Secure-SDLC",
  titleEn: "Secure SDLC",
  titleDe: "Secure SDLC mit SAST/SCA/DAST und Threat Modelling",
  description: "Secure SDLC with mandatory SAST/SCA/DAST and threat modelling",
  icon: "code",
  questions: [
    { id: "dev-12", question: "Ist ein Secure-SDLC mit verpflichtenden SAST/SCA/DAST-Gates und Threat Modelling fuer High-Risk-Releases umgesetzt?", questionEn: "Is a Secure-SDLC with mandatory SAST/SCA/DAST gates and threat modelling for high-risk releases implemented?", description: "Setzt die Secure-Development-Anforderung aus Art. 21(2)(e) um.", descriptionEn: "Implements the secure-development requirement of Art. 21(2)(e).", status: null },
  ],
};

const aiGov: NIS2Category = {
  id: "ai-governance",
  article: "A.5.1",
  nis2Ref: "NIS2 Art. 21(2)(a)",
  title: "AI/ML Governance & Sicherheit",
  titleEn: "AI/ML Governance & Security",
  titleDe: "AI-Richtlinien, Datenklassen, Modell-Sicherheit, AI-Lieferanten, AI-Incidents",
  description: "AI/ML governance, data rules, model security, AI suppliers and AI incident response",
  icon: "shield-check",
  questions: [
    { id: "ai-1", question: "Ist eine AI/ML-Governance-Richtlinie mit akzeptabler Nutzung, Risikoklassifizierung und Genehmigungsworkflow vorhanden?", questionEn: "Is an AI/ML governance policy in place covering acceptable use, risk classification and approval workflow?", description: "Erweitert den Governance-Rahmen aus Art. 21(2)(a) auf AI-spezifische Risiken im Einklang mit dem EU AI Act.", descriptionEn: "Extends the Art. 21(2)(a) governance framework to AI-specific risks, consistent with EU AI Act alignment.", status: null },
    { id: "ai-3", question: "Werden AI/ML-Komponenten Modell-Sicherheitstests (Prompt Injection, Data Poisoning, Model Theft) unterzogen?", questionEn: "Are AI/ML components subjected to model-security testing (prompt injection, data poisoning, model theft)?", description: "Erweitert die Secure-Development-Anforderung aus Art. 21(2)(e) auf ML/AI-Systeme.", descriptionEn: "Extends the secure-development requirement of Art. 21(2)(e) to ML/AI systems.", status: null },
    { id: "ai-4", question: "Werden AI/ML-SaaS-Anbieter hinsichtlich Datenresidenz, Trainingsdaten-Nutzung und Vorfallmeldungen bewertet?", questionEn: "Are AI/ML SaaS providers assessed for data residency, training-data usage and incident-notification commitments?", description: "Setzt die Lieferketten-Kontrollen aus Art. 21(2)(d) fuer AI-Dienstleister um.", descriptionEn: "Implements Art. 21(2)(d) supply-chain controls for AI service providers.", status: null },
    { id: "ai-5", question: "Ist ein AI-Incident-Response-Playbook (Modellfehler, Halluzinations-Schaden, Prompt-Injection-Missbrauch) definiert?", questionEn: "Is an AI-incident response playbook (model failure, hallucination harm, prompt-injection abuse) defined?", description: "Passt die Incident-Handhabung aus Art. 21(2)(b) an AI-spezifische Fehlerarten an.", descriptionEn: "Adapts Art. 21(2)(b) incident handling to AI-specific failure modes.", status: null },
  ],
};

// =============================================
// NIS2 ART. 21(2) — 10 KATEGORIEN (a–j)
// Inhaltliche Bündelung aller Kontrollen nach den
// 10 Buchstaben des Art. 21 Abs. 2 NIS2-Richtlinie.
// Reihenfolge in der UI = Reihenfolge der Buchstaben.
// =============================================

const buildCategory = (
  id: string,
  nis2Ref: string,
  title: string,
  titleEn: string,
  titleDe: string,
  description: string,
  icon: string,
  sources: NIS2Category[],
): NIS2Category => ({
  id,
  article: "",
  nis2Ref,
  title,
  titleEn,
  titleDe,
  description,
  icon,
  questions: sources.flatMap(s => s.questions),
});

const nis2_a = buildCategory(
  "nis2-a",
  "NIS2 Art. 21(2)(a)",
  "Risikomanagement & Sicherheitsrichtlinien",
  "Risk Management & Security Policies",
  "Konzepte für die Risikoanalyse und Sicherheit für Informationssysteme",
  "Policies on risk analysis and information system security",
  "shield-check",
  [orgPolicies, orgRisk, aiGov],
);

const nis2_b = buildCategory(
  "nis2-b",
  "NIS2 Art. 21(2)(b)",
  "Bewältigung von Sicherheitsvorfällen",
  "Incident Handling",
  "Vorfallbehandlung und Meldepflichten nach Art. 23",
  "Incident handling and reporting obligations under Art. 23",
  "alert-triangle",
  [orgIncident, incComms, incForensics],
);

const nis2_c = buildCategory(
  "nis2-c",
  "NIS2 Art. 21(2)(c)",
  "Aufrechterhaltung des Betriebs & Krisenmanagement",
  "Business Continuity & Crisis Management",
  "Backup-Management, Wiederherstellung und Krisenmanagement",
  "Backup management, disaster recovery and crisis management",
  "refresh-cw",
  [orgContinuity],
);

const nis2_d = buildCategory(
  "nis2-d",
  "NIS2 Art. 21(2)(d)",
  "Sicherheit der Lieferkette",
  "Supply Chain Security",
  "Sicherheit der Lieferkette einschließlich Anbieter- und Dienstleisterbeziehungen",
  "Supply chain security including supplier and service provider relationships",
  "link",
  [orgSupplier, supplierExt],
);

const nis2_e = buildCategory(
  "nis2-e",
  "NIS2 Art. 21(2)(e)",
  "Sicherheit in Beschaffung, Entwicklung & Wartung",
  "Security in Acquisition, Development & Maintenance",
  "Sicherheit in der Beschaffung, Entwicklung und Wartung von IKT-Produkten und -Diensten",
  "Security in acquisition, development and maintenance of ICT products and services",
  "code",
  [techDev, devExt, otIcsControls],
);

const nis2_f = buildCategory(
  "nis2-f",
  "NIS2 Art. 21(2)(f)",
  "Wirksamkeitsbewertung der Cybersicherheits­maßnahmen",
  "Effectiveness Assessment of Cybersecurity Measures",
  "Bewertung der Wirksamkeit von Maßnahmen, Schwachstellen- und Patch-Management",
  "Effectiveness assessment of measures, vulnerability and patch management",
  "search",
  [techVuln, vulnExt, orgCompliance],
);

const nis2_g = buildCategory(
  "nis2-g",
  "NIS2 Art. 21(2)(g)",
  "Cyberhygiene & Schulungen",
  "Cyber Hygiene & Training",
  "Grundlegende Cyberhygiene-Praktiken, Sensibilisierung und Schulungen sowie Monitoring/Logging als Basis-Praxis",
  "Basic cyber hygiene practices, awareness, training and monitoring/logging as foundational practice",
  "graduation-cap",
  [pplAwareness, awrPhishing, techMonitoring],
);

const nis2_h = buildCategory(
  "nis2-h",
  "NIS2 Art. 21(2)(h)",
  "Kryptographie & Verschlüsselung",
  "Cryptography & Encryption",
  "Konzepte und Verfahren für Kryptographie, Verschlüsselung und sichere Datenhaltung",
  "Policies and procedures for cryptography, encryption and secure data handling",
  "lock",
  [techCrypto, cryptoModern, techDataProtection],
);

const nis2_i = buildCategory(
  "nis2-i",
  "NIS2 Art. 21(2)(i)",
  "Personalsicherheit, Zugriffskontrolle & Asset Management",
  "Personnel Security, Access Control & Asset Management",
  "Personalsicherheit, Konzepte für die Zugriffskontrolle, Identitätsmanagement und Verwaltung von Anlagen",
  "Personnel security, access control policies, identity management and asset management",
  "users",
  [pplSecurity, orgAsset, orgAccess, phyAccess, phyEquipment],
);

const nis2_j = buildCategory(
  "nis2-j",
  "NIS2 Art. 21(2)(j)",
  "MFA, Authentifizierung & gesicherte Kommunikation",
  "MFA, Authentication & Secured Communications",
  "Mehr-Faktor-Authentifizierung, kontinuierliche Authentifizierung und gesicherte Sprach-/Video-/Text-Kommunikation sowie Notfallkommunikation",
  "Multi-factor authentication, continuous authentication and secured voice/video/text and emergency communications",
  "smartphone",
  [mfaStrongAuth, techEndpoint, techNetwork],
);

// =============================================
// DOMAIN (single, organised by NIS2 Art. 21(2) letters)
// =============================================

export const nis2Domains: NIS2Domain[] = [
  {
    id: "nis2-art21",
    title: "NIS2 Art. 21(2) Controls",
    titleDe: "NIS2 Art. 21(2) Kontrollen",
    description: "All controls organised by the 10 risk management measures of NIS2 Art. 21(2) lit. (a)–(j).",
    descriptionDe: "Alle Kontrollen geordnet nach den 10 Risikomanagement­maßnahmen aus NIS2 Art. 21(2) lit. (a)–(j).",
    icon: "shield-check",
    categories: [nis2_a, nis2_b, nis2_c, nis2_d, nis2_e, nis2_f, nis2_g, nis2_h, nis2_i, nis2_j],
  },
];

// Backward-compatible flat list
export const nis2Categories: NIS2Category[] = nis2Domains.flatMap(d => d.categories);


// Helper functions
export const getAllQuestions = (categories: NIS2Category[]) => categories.flatMap(c => c.questions);

export const getReifegradScore = (categories: NIS2Category[]): number => {
  const allQ = getAllQuestions(categories);
  const applicable = allQ.filter(q => q.status !== "entbehrlich");
  if (applicable.length === 0) return 0;
  const points = applicable.reduce((sum, q) => {
    if (q.status === "ja") return sum + 1;
    if (q.status === "teilweise") return sum + 0.5;
    return sum;
  }, 0);
  return Math.round((points / applicable.length) * 100);
};

export const getReifegradLevel = (score: number): { level: number; label: string; color: string } => {
  if (score >= 80) return { level: 5, label: "Optimiert", color: "text-success" };
  if (score >= 60) return { level: 4, label: "Gesteuert", color: "text-success" };
  if (score >= 40) return { level: 3, label: "Definiert", color: "text-partial" };
  if (score >= 20) return { level: 2, label: "Wiederholbar", color: "text-partial" };
  return { level: 1, label: "Initial", color: "text-destructive" };
};

export const getDomainScore = (domain: NIS2Domain): number => {
  return getReifegradScore(domain.categories);
};
