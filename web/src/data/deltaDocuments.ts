// AUTOMATISCH ERZEUGT — Quelle: CWS_Policy_Review_2026-09-12/CWS_Document_Library_Corrected.json
// Stand 2026-09-13. 93 Framework-Dokumente, 386 Klauseln.
// Nicht von Hand ändern, sondern aus der geprüften Bibliothek neu erzeugen.
import type { PolicyTemplate } from "./policyTemplates";
import type { PolicyClause, PolicyClauseMap } from "./policyClauseTemplates";

export const DELTA_TEMPLATES: PolicyTemplate[] = [
  {
      "id": "D01",
      "name": "Erklärung zur Anwendbarkeit (SoA)",
      "nameEn": "Statement of Applicability",
      "category": "ISMS-Grundlagendokumente",
      "categoryEn": "ISMS Foundation Documents",
      "description": "Notwendige Kontrollen, begründete Auswahl und Umsetzungsstand.",
      "descriptionEn": "Necessary controls, justified selection and implementation status.",
      "purpose": "Notwendige Kontrollen, begründete Auswahl und Umsetzungsstand. Die Vorlage unterstützt ISO 27001. Gleichartige Nachweise können wiederverwendet werden; eine NIS2-Pflicht zu einem Dokument dieses Namens wird nicht behauptet.",
      "purposeEn": "Necessary controls, justified selection and implementation status. This template supports ISO 27001. Equivalent evidence may be reused; it does not assert a NIS2 duty to produce a document with this name.",
      "defaultRules": [
        "Zweck und Rolle der SoA",
        "Vollständigkeit des Kontrollsatzes",
        "Anwendbarkeit je Kontrolle",
        "Begründung der Aufnahme",
        "Begründung des Ausschlusses",
        "Umsetzungsstatus",
        "Verknüpfung mit Risiken und RTP",
        "Verknüpfung mit Richtlinien und Nachweisen",
        "Prüfung und Freigabe der SoA",
        "Versionierung und Pflege",
        "Review im Management-Review"
      ],
      "defaultRulesEn": [
        "Purpose and Role of the SoA",
        "Completeness of the Control Set",
        "Applicability per Control",
        "Justification for Inclusion",
        "Justification for Exclusion",
        "Implementation Status",
        "Link to Risks and RTP",
        "Link to Policies and Evidence",
        "SoA Review and Approval",
        "Versioning and Maintenance",
        "Review in Management Review"
      ]
    },
  {
      "id": "D02",
      "name": "Risikobehandlungsplan (RTP)",
      "nameEn": "Risk Treatment Plan",
      "category": "Risikomanagement-Nachweise",
      "categoryEn": "Risk Management Records",
      "description": "Plan für Behandlung, Zuständigkeiten, Wirksamkeitsprüfung und Risikoakzeptanz.",
      "descriptionEn": "Plan for treatment, ownership, effectiveness checks and risk acceptance.",
      "purpose": "Plan für Behandlung, Zuständigkeiten, Wirksamkeitsprüfung und Risikoakzeptanz. Derselbe Nachweis kann ISO 27001 und NIS2 unterstützen. Die erforderlichen Inhalte müssen vorliegen; ein separates Dokument je Framework wird hier nicht behauptet.",
      "purposeEn": "Plan for treatment, ownership, effectiveness checks and risk acceptance. The same evidence can support ISO 27001 and NIS2. Required content must be available; this template does not assert that each framework needs a separate document.",
      "defaultRules": [
        "Zweck und Geltungsbereich",
        "Behandlungsoptionen",
        "Zugeordnete Kontrollen",
        "Verantwortliche und Termine",
        "Restrisiko-Bewertung",
        "Planfreigabe und Risikoakzeptanz",
        "Akzeptierte Risiken",
        "Priorisierung",
        "Fortschrittsverfolgung",
        "Freigabe und Pflege"
      ],
      "defaultRulesEn": [
        "Purpose and Scope",
        "Treatment Options",
        "Assigned Controls",
        "Owners and Deadlines",
        "Residual Risk Assessment",
        "Plan Approval and Risk Acceptance",
        "Accepted Risks",
        "Prioritisation",
        "Progress Tracking",
        "Approval and Maintenance"
      ]
    },
  {
      "id": "D03",
      "name": "ISMS-Geltungsbereich (Scope)",
      "nameEn": "ISMS Scope Statement",
      "category": "ISMS-Grundlagendokumente",
      "categoryEn": "ISMS Foundation Documents",
      "description": "Grenzen, Anwendbarkeit und Schnittstellen des ISMS.",
      "descriptionEn": "ISMS boundaries, applicability and interfaces.",
      "purpose": "Grenzen, Anwendbarkeit und Schnittstellen des ISMS. Die Vorlage unterstützt ISO 27001. Gleichartige Nachweise können wiederverwendet werden; eine NIS2-Pflicht zu einem Dokument dieses Namens wird nicht behauptet.",
      "purposeEn": "ISMS boundaries, applicability and interfaces. This template supports ISO 27001. Equivalent evidence may be reused; it does not assert a NIS2 duty to produce a document with this name.",
      "defaultRules": [
        "Kontext und interessierte Parteien",
        "Zweck des Geltungsbereichs",
        "Organisationseinheiten und Standorte",
        "Prozesse und Dienste",
        "Informationswerte und Systeme",
        "Schnittstellen und Abhängigkeiten",
        "Begründete Ausschlüsse",
        "Freigabe und Pflege"
      ],
      "defaultRulesEn": [
        "Context and Interested Parties",
        "Purpose of the Scope",
        "Organisational Units and Sites",
        "Processes and Services",
        "Information Assets and Systems",
        "Interfaces and Dependencies",
        "Justified Exclusions",
        "Approval and Maintenance"
      ]
    },
  {
      "id": "D04",
      "name": "Management-Review-Protokoll",
      "nameEn": "Management Review Minutes",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Leitungsbewertung mit vollständigen Eingaben, Entscheidungen und Nachverfolgung.",
      "descriptionEn": "Management review with complete inputs, decisions and follow-up.",
      "purpose": "Leitungsbewertung mit vollständigen Eingaben, Entscheidungen und Nachverfolgung.",
      "purposeEn": "Management review with complete inputs, decisions and follow-up.",
      "defaultRules": [
        "Zweck und Frequenz",
        "Status früherer Maßnahmen",
        "Änderungen im Umfeld",
        "Kennzahlen und Wirksamkeit",
        "Vorfälle und Rückmeldungen",
        "Risiken und Chancen",
        "Entscheidungen und Ressourcen",
        "Protokoll und Nachverfolgung"
      ],
      "defaultRulesEn": [
        "Purpose and Frequency",
        "Status of Previous Actions",
        "Changes in Context",
        "Metrics and Effectiveness",
        "Incidents and Feedback",
        "Risks and Opportunities",
        "Decisions and Resources",
        "Minutes and Follow-up"
      ]
    },
  {
      "id": "D05",
      "name": "Verfahren für Korrektur- & Verbesserungsmaßnahmen",
      "nameEn": "Corrective Action & Improvement Procedure",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Verfahren zur angemessenen Bearbeitung von Nichtkonformitäten und Verbesserungen.",
      "descriptionEn": "Procedure for proportionate handling of nonconformities and improvements.",
      "purpose": "Verfahren zur angemessenen Bearbeitung von Nichtkonformitäten und Verbesserungen.",
      "purposeEn": "Procedure for proportionate handling of nonconformities and improvements.",
      "defaultRules": [
        "Erfassung von Nichtkonformitäten",
        "Sofortmaßnahmen",
        "Ursachenanalyse",
        "Korrekturmaßnahmen",
        "Wirksamkeitsprüfung",
        "Aktualisierung von Risiken/Kontrollen",
        "Register der Maßnahmen",
        "Kontinuierliche Verbesserung (KVP)"
      ],
      "defaultRulesEn": [
        "Recording Nonconformities",
        "Immediate Actions",
        "Root Cause Analysis",
        "Corrective Actions",
        "Effectiveness Verification",
        "Updating Risks/Controls",
        "Register of Actions",
        "Continual Improvement"
      ]
    },
  {
      "id": "D06",
      "name": "Sicherheitsleitlinie (BSI)",
      "nameEn": "Information Security Guideline (BSI)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Arbeitsgrundlage für die ausdrücklich gewählte IT-Grundschutz-Vorgehensweise. Sie ist nicht allein aufgrund einer ISO-, NIS2- oder KRITIS-Einstufung als zusätzliche separate Datei vorgeschrieben. Gemeinsame ISMS-Nachweise können wiederverwendet werden.",
      "descriptionEn": "Working record for the expressly selected IT-Grundschutz approach. ISO, NIS2 or critical-infrastructure status alone does not mandate an additional separate file of this name. Shared ISMS records may be reused.",
      "purpose": "Arbeitsgrundlage für die ausdrücklich gewählte IT-Grundschutz-Vorgehensweise. Sie ist nicht allein aufgrund einer ISO-, NIS2- oder KRITIS-Einstufung als zusätzliche separate Datei vorgeschrieben. Gemeinsame ISMS-Nachweise können wiederverwendet werden.",
      "purposeEn": "Working record for the expressly selected IT-Grundschutz approach. ISO, NIS2 or critical-infrastructure status alone does not mandate an additional separate file of this name. Shared ISMS records may be reused.",
      "defaultRules": [
        "Bekenntnis der Leitung",
        "Stellenwert und Ziele",
        "Geltungsbereich",
        "Sicherheitsorganisation",
        "Verbindlichkeit und Kommunikation",
        "Fortschreibung"
      ],
      "defaultRulesEn": [
        "Management Commitment",
        "Significance and Objectives",
        "Scope",
        "Security Organisation",
        "Bindingness and Communication",
        "Maintenance"
      ]
    },
  {
      "id": "D07",
      "name": "Strukturanalyse",
      "nameEn": "Structure Analysis",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Arbeitsgrundlage für die ausdrücklich gewählte IT-Grundschutz-Vorgehensweise. Sie ist nicht allein aufgrund einer ISO-, NIS2- oder KRITIS-Einstufung als zusätzliche separate Datei vorgeschrieben. Gemeinsame ISMS-Nachweise können wiederverwendet werden.",
      "descriptionEn": "Working record for the expressly selected IT-Grundschutz approach. ISO, NIS2 or critical-infrastructure status alone does not mandate an additional separate file of this name. Shared ISMS records may be reused.",
      "purpose": "Arbeitsgrundlage für die ausdrücklich gewählte IT-Grundschutz-Vorgehensweise. Sie ist nicht allein aufgrund einer ISO-, NIS2- oder KRITIS-Einstufung als zusätzliche separate Datei vorgeschrieben. Gemeinsame ISMS-Nachweise können wiederverwendet werden.",
      "purposeEn": "Working record for the expressly selected IT-Grundschutz approach. ISO, NIS2 or critical-infrastructure status alone does not mandate an additional separate file of this name. Shared ISMS records may be reused.",
      "defaultRules": [
        "Geschäftsprozesse und Anwendungen",
        "IT-Systeme, ICS/OT und Netze",
        "Räume und Standorte",
        "Gruppierung und Bereinigung",
        "Aktualität"
      ],
      "defaultRulesEn": [
        "Business Processes and Applications",
        "IT Systems, ICS/OT and Networks",
        "Rooms and Sites",
        "Grouping and Consolidation",
        "Currency"
      ]
    },
  {
      "id": "D08",
      "name": "Schutzbedarfsfeststellung",
      "nameEn": "Protection Requirements Analysis",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Arbeitsgrundlage für die ausdrücklich gewählte IT-Grundschutz-Vorgehensweise. Sie ist nicht allein aufgrund einer ISO-, NIS2- oder KRITIS-Einstufung als zusätzliche separate Datei vorgeschrieben. Gemeinsame ISMS-Nachweise können wiederverwendet werden.",
      "descriptionEn": "Working record for the expressly selected IT-Grundschutz approach. ISO, NIS2 or critical-infrastructure status alone does not mandate an additional separate file of this name. Shared ISMS records may be reused.",
      "purpose": "Arbeitsgrundlage für die ausdrücklich gewählte IT-Grundschutz-Vorgehensweise. Sie ist nicht allein aufgrund einer ISO-, NIS2- oder KRITIS-Einstufung als zusätzliche separate Datei vorgeschrieben. Gemeinsame ISMS-Nachweise können wiederverwendet werden.",
      "purposeEn": "Working record for the expressly selected IT-Grundschutz approach. ISO, NIS2 or critical-infrastructure status alone does not mandate an additional separate file of this name. Shared ISMS records may be reused.",
      "defaultRules": [
        "Schadensszenarien und Kategorien",
        "VIV-Grundwerte",
        "Vererbung und Kumulation",
        "Begründung und Fortschreibung"
      ],
      "defaultRulesEn": [
        "Damage Scenarios and Categories",
        "CIA Objectives",
        "Inheritance and Cumulation",
        "Justification and Maintenance"
      ]
    },
  {
      "id": "D09",
      "name": "Modellierung & IT-Grundschutz-Check",
      "nameEn": "Modelling & Baseline Security Check",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Arbeitsgrundlage für die ausdrücklich gewählte IT-Grundschutz-Vorgehensweise. Sie ist nicht allein aufgrund einer ISO-, NIS2- oder KRITIS-Einstufung als zusätzliche separate Datei vorgeschrieben. Gemeinsame ISMS-Nachweise können wiederverwendet werden.",
      "descriptionEn": "Working record for the expressly selected IT-Grundschutz approach. ISO, NIS2 or critical-infrastructure status alone does not mandate an additional separate file of this name. Shared ISMS records may be reused.",
      "purpose": "Arbeitsgrundlage für die ausdrücklich gewählte IT-Grundschutz-Vorgehensweise. Sie ist nicht allein aufgrund einer ISO-, NIS2- oder KRITIS-Einstufung als zusätzliche separate Datei vorgeschrieben. Gemeinsame ISMS-Nachweise können wiederverwendet werden.",
      "purposeEn": "Working record for the expressly selected IT-Grundschutz approach. ISO, NIS2 or critical-infrastructure status alone does not mandate an additional separate file of this name. Shared ISMS records may be reused.",
      "defaultRules": [
        "Bausteinzuordnung",
        "Soll-Ist-Vergleich",
        "Basis-, Standard- und Kernabsicherung",
        "Dokumentation und Aktualität"
      ],
      "defaultRulesEn": [
        "Module Assignment",
        "Target-Actual Comparison",
        "Basic, Standard and Core Security",
        "Documentation and Currency"
      ]
    },
  {
      "id": "D10",
      "name": "Realisierungsplan",
      "nameEn": "Implementation Plan",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Arbeitsgrundlage für die ausdrücklich gewählte IT-Grundschutz-Vorgehensweise. Sie ist nicht allein aufgrund einer ISO-, NIS2- oder KRITIS-Einstufung als zusätzliche separate Datei vorgeschrieben. Gemeinsame ISMS-Nachweise können wiederverwendet werden.",
      "descriptionEn": "Working record for the expressly selected IT-Grundschutz approach. ISO, NIS2 or critical-infrastructure status alone does not mandate an additional separate file of this name. Shared ISMS records may be reused.",
      "purpose": "Arbeitsgrundlage für die ausdrücklich gewählte IT-Grundschutz-Vorgehensweise. Sie ist nicht allein aufgrund einer ISO-, NIS2- oder KRITIS-Einstufung als zusätzliche separate Datei vorgeschrieben. Gemeinsame ISMS-Nachweise können wiederverwendet werden.",
      "purposeEn": "Working record for the expressly selected IT-Grundschutz approach. ISO, NIS2 or critical-infrastructure status alone does not mandate an additional separate file of this name. Shared ISMS records may be reused.",
      "defaultRules": [
        "Priorisierung der Maßnahmen",
        "Verantwortliche, Termine, Kosten",
        "Verknüpfung mit Risikoanalyse",
        "Fortschrittsverfolgung"
      ],
      "defaultRulesEn": [
        "Prioritisation of Measures",
        "Owners, Deadlines, Costs",
        "Link to Risk Analysis",
        "Progress Tracking"
      ]
    },
  {
      "id": "D11",
      "name": "Registrierung bei der zuständigen Behörde",
      "nameEn": "Registration with Competent Authority",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Nachweis der tatsächlich erforderlichen Registrierung und Aktualisierung bei der zuständigen Stelle.",
      "descriptionEn": "Evidence of required registration and updates to the competent body.",
      "purpose": "Nachweis der tatsächlich erforderlichen Registrierung und Aktualisierung bei der zuständigen Stelle.",
      "purposeEn": "Evidence of required registration and updates to the competent body.",
      "defaultRules": [
        "Registrierungspflicht und Frist",
        "Zu übermittelnde Angaben",
        "Aktualisierung"
      ],
      "defaultRulesEn": [
        "Registration Obligation and Deadline",
        "Data to be Submitted",
        "Update"
      ]
    },
  {
      "id": "D12",
      "name": "Selbsteinstufung wesentlich/wichtig",
      "nameEn": "Self-Classification Essential/Important",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Nachvollziehbare Anwendbarkeits- und Einstufungsentscheidung; keine behördliche Anerkennung durch bloße Selbsterklärung.",
      "descriptionEn": "Traceable applicability and classification decision; a self-assessment is not authority recognition.",
      "purpose": "Nachvollziehbare Anwendbarkeits- und Einstufungsentscheidung; keine behördliche Anerkennung durch bloße Selbsterklärung.",
      "purposeEn": "Traceable applicability and classification decision; a self-assessment is not authority recognition.",
      "defaultRules": [
        "Einstufungsanalyse",
        "Dokumentation und Fortschreibung"
      ],
      "defaultRulesEn": [
        "Classification Analysis",
        "Documentation and Update"
      ]
    },
  {
      "id": "D13",
      "name": "Nachweis Geschäftsleitungs-Schulung",
      "nameEn": "Board Training Attestation",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Schulung und Kenntnisse der Leitung nachvollziehbar belegen und verbleibenden Lernbedarf verfolgen.",
      "descriptionEn": "Evidence management training and knowledge and track remaining learning needs.",
      "purpose": "Schulung und Kenntnisse der Leitung nachvollziehbar belegen und verbleibenden Lernbedarf verfolgen.",
      "purposeEn": "Evidence management training and knowledge and track remaining learning needs.",
      "defaultRules": [
        "Schulungspflicht der Leitung",
        "Inhalte und Nachweis"
      ],
      "defaultRulesEn": [
        "Management Training Obligation",
        "Content and Evidence"
      ]
    },
  {
      "id": "D14",
      "name": "Meldeverfahren an die Behörde (NIS2 Artikel 23)",
      "nameEn": "Authority Incident Reporting Procedure (NIS2 Article 23)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "NIS2-Meldekette mit richtigen Auslösern, Empfängern, Inhalten und Übermittlungsnachweisen; „Vorfallmeldungs-Richtlinie“ bleibt das übergreifende Verfahren.",
      "descriptionEn": "NIS2 reporting chain with correct triggers, recipients, content and delivery evidence; “Incident Reporting Policy” remains the overarching procedure.",
      "purpose": "NIS2-Meldekette mit richtigen Auslösern, Empfängern, Inhalten und Übermittlungsnachweisen; „Vorfallmeldungs-Richtlinie“ bleibt das übergreifende Verfahren.",
      "purposeEn": "NIS2 reporting chain with correct triggers, recipients, content and delivery evidence; “Incident Reporting Policy” remains the overarching procedure.",
      "defaultRules": [
        "Frühwarnung (24h)",
        "Meldung (72h)",
        "Abschlussbericht (1 Monat)",
        "Erheblichkeitskriterien",
        "Unterrichtung der Diensteempfänger"
      ],
      "defaultRulesEn": [
        "Early Warning (24h)",
        "Notification (72h)",
        "Final Report (1 Month)",
        "Significance Criteria",
        "Informing Service Recipients"
      ]
    },
  {
      "id": "D15",
      "name": "IKT-Risikomanagementrahmen",
      "nameEn": "ICT Risk Management Framework",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Den anwendbaren IKT-Risikomanagementrahmen und seine Umsetzung dokumentieren.",
      "descriptionEn": "Document the applicable ICT risk management framework and its operation.",
      "purpose": "Den anwendbaren IKT-Risikomanagementrahmen und seine Umsetzung dokumentieren.",
      "purposeEn": "Document the applicable ICT risk management framework and its operation.",
      "defaultRules": [
        "Zweck und Geltungsbereich",
        "Verantwortung des Leitungsorgans",
        "IKT-Strategie für digitale Resilienz",
        "IKT-Asset- und Abhängigkeitskarte",
        "Schutz- und Präventionsmaßnahmen",
        "Erkennung",
        "Lernen und Weiterentwicklung",
        "Überprüfung und Vorlage an die Aufsicht"
      ],
      "defaultRulesEn": [
        "Purpose and Scope",
        "Management Body Responsibility",
        "Digital Resilience Strategy",
        "ICT Asset and Dependency Map",
        "Protection and Prevention",
        "Detection",
        "Learning and Evolving",
        "Review and Supervisory Submission"
      ]
    },
  {
      "id": "D16",
      "name": "Informationsregister ICT-Drittparteien",
      "nameEn": "Register of Information (ICT Third Parties)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Das DORA-Informationsregister mit nachvollziehbaren Vertrags- und Dienstleistungsdaten führen.",
      "descriptionEn": "Maintain the DORA register of information with traceable contractual and service data.",
      "purpose": "Das DORA-Informationsregister mit nachvollziehbaren Vertrags- und Dienstleistungsdaten führen.",
      "purposeEn": "Maintain the DORA register of information with traceable contractual and service data.",
      "defaultRules": [
        "Registerpflicht und Umfang",
        "Pflichtfelder",
        "Kennzeichnung kritischer/wichtiger Funktionen",
        "Sub-Outsourcing",
        "Jährliche Meldung",
        "Pflege und Qualitätssicherung"
      ],
      "defaultRulesEn": [
        "Register Obligation and Scope",
        "Mandatory Fields",
        "Flagging Critical/Important Functions",
        "Sub-Outsourcing",
        "Annual Reporting",
        "Maintenance and Quality Assurance"
      ]
    },
  {
      "id": "D17",
      "name": "TLPT-Programm",
      "nameEn": "Threat-Led Penetration Testing Programme",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Ein behördlich erforderliches TLPT risikokontrolliert planen und nachweisen.",
      "descriptionEn": "Plan and evidence authority-required TLPT with controlled testing risk.",
      "purpose": "Ein behördlich erforderliches TLPT risikokontrolliert planen und nachweisen.",
      "purposeEn": "Plan and evidence authority-required TLPT with controlled testing risk.",
      "defaultRules": [
        "Anwendbarkeit",
        "Umfang und Scoping",
        "Bedrohungsorientierung (Threat Intelligence)",
        "Tester-Anforderungen",
        "Frequenz und Nachweis",
        "Behebung und Lessons Learned"
      ],
      "defaultRulesEn": [
        "Applicability",
        "Scope and Scoping",
        "Threat-Led Approach",
        "Tester Requirements",
        "Frequency and Attestation",
        "Remediation and Lessons Learned"
      ]
    },
  {
      "id": "D18",
      "name": "Ausstiegsstrategien für kritische IKT-Dienste",
      "nameEn": "Exit Strategies for Critical ICT Services",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Den geordneten und gestörten Ausstieg aus kritischen IKT-Dienstleistungen vorbereiten.",
      "descriptionEn": "Prepare orderly and stressed exit from ICT services supporting critical or important functions.",
      "purpose": "Den geordneten und gestörten Ausstieg aus kritischen IKT-Dienstleistungen vorbereiten.",
      "purposeEn": "Prepare orderly and stressed exit from ICT services supporting critical or important functions.",
      "defaultRules": [
        "Exit-Strategie je kritischem Dienst",
        "Übergangsplan",
        "Datenrückführung und -löschung",
        "Alternativen und Testbarkeit"
      ],
      "defaultRulesEn": [
        "Exit Strategy per Critical Service",
        "Transition Plan",
        "Data Return and Deletion",
        "Alternatives and Testability"
      ]
    },
  {
      "id": "D19",
      "name": "Strategie für digitale operationale Resilienz-Tests",
      "nameEn": "Digital Operational Resilience Testing Strategy",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Risikogerechte digitale Resilienztests und die Beseitigung ihrer Feststellungen nachweisen.",
      "descriptionEn": "Evidence risk-based digital resilience tests and remediation of findings.",
      "purpose": "Risikogerechte digitale Resilienztests und die Beseitigung ihrer Feststellungen nachweisen.",
      "purposeEn": "Evidence risk-based digital resilience tests and remediation of findings.",
      "defaultRules": [
        "Testprogramm",
        "Testarten",
        "Behebung von Feststellungen"
      ],
      "defaultRulesEn": [
        "Testing Programme",
        "Types of Tests",
        "Remediation of Findings"
      ]
    },
  {
      "id": "D20",
      "name": "Verzeichnis von Verarbeitungstätigkeiten (VVT)",
      "nameEn": "Records of Processing Activities (RoPA)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Rollengetrenntes Verarbeitungsverzeichnis mit verknüpften Rechtsgrundlagen-, Transfer-, Lösch- und Sicherheitsnachweisen.",
      "descriptionEn": "Role-specific processing records linked to lawfulness, transfer, erasure and security evidence.",
      "purpose": "Rollengetrenntes Verarbeitungsverzeichnis mit verknüpften Rechtsgrundlagen-, Transfer-, Lösch- und Sicherheitsnachweisen.",
      "purposeEn": "Role-specific processing records linked to lawfulness, transfer, erasure and security evidence.",
      "defaultRules": [
        "Pflicht und Rolle",
        "Zwecke und Rechtsgrundlagen",
        "Kategorien Betroffener und Daten",
        "Empfänger und Drittländer",
        "Löschfristen",
        "TOM-Beschreibung",
        "Pflege und Aktualität"
      ],
      "defaultRulesEn": [
        "Obligation and Role",
        "Purposes and Legal Bases",
        "Categories of Data Subjects and Data",
        "Recipients and Third Countries",
        "Deletion Periods",
        "TOM Description",
        "Maintenance and Currency"
      ]
    },
  {
      "id": "D21",
      "name": "Datenschutz-Folgenabschätzung (DSFA)",
      "nameEn": "Data Protection Impact Assessment",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Erforderlichkeit einer DSFA entscheiden und bei Bedarf Personenrisiken vor Verarbeitung systematisch beurteilen und behandeln.",
      "descriptionEn": "Determine whether a DPIA is required and, where needed, systematically assess and treat risks to people before processing.",
      "purpose": "Erforderlichkeit einer DSFA entscheiden und bei Bedarf Personenrisiken vor Verarbeitung systematisch beurteilen und behandeln.",
      "purposeEn": "Determine whether a DPIA is required and, where needed, systematically assess and treat risks to people before processing.",
      "defaultRules": [
        "Schwellenwertprüfung",
        "Systematische Beschreibung",
        "Notwendigkeit und Verhältnismäßigkeit",
        "Risiken für Betroffene",
        "Abhilfemaßnahmen",
        "Konsultation der Aufsicht"
      ],
      "defaultRulesEn": [
        "Threshold Assessment",
        "Systematic Description",
        "Necessity and Proportionality",
        "Risks to Data Subjects",
        "Mitigation Measures",
        "Prior Consultation"
      ]
    },
  {
      "id": "D22",
      "name": "Auftragsverarbeitungsvertrag (AVV/DPA)",
      "nameEn": "Data Processing Agreement",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Bearbeitbare Vertragsklauseln für Auftragsverarbeitung mit auszufüllendem Leistungs- und Sicherheitsanhang. Vor Unterzeichnung Rollen, Dienste und ergänzende Vertragsbedingungen prüfen.",
      "descriptionEn": "Editable processor contract clauses with a service and security schedule to complete. Review roles, services and supplementary contract terms before signature.",
      "purpose": "Bearbeitbare Vertragsklauseln für Auftragsverarbeitung mit auszufüllendem Leistungs- und Sicherheitsanhang. Vor Unterzeichnung Rollen, Dienste und ergänzende Vertragsbedingungen prüfen.",
      "purposeEn": "Editable processor contract clauses with a service and security schedule to complete. Review roles, services and supplementary contract terms before signature.",
      "defaultRules": [
        "Gegenstand und Dauer",
        "Weisungsbindung",
        "Vertraulichkeit und TOM",
        "Unterauftragnehmer",
        "Unterstützung und Löschung",
        "Kontroll- und Auditrechte"
      ],
      "defaultRulesEn": [
        "Subject and Duration",
        "Instruction-Binding",
        "Confidentiality and TOM",
        "Sub-Processors",
        "Assistance and Deletion",
        "Audit Rights"
      ]
    },
  {
      "id": "D23",
      "name": "Betroffenenrechte-Verfahren",
      "nameEn": "Data Subject Rights Procedure",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Betroffenenrechte verständlich, fristgerecht und nachweisbar bearbeiten, ohne übermäßige Identitätshürden oder pauschale Ausnahmen.",
      "descriptionEn": "Handle individual rights clearly, on time and traceably without excessive identity barriers or blanket exceptions.",
      "purpose": "Betroffenenrechte verständlich, fristgerecht und nachweisbar bearbeiten, ohne übermäßige Identitätshürden oder pauschale Ausnahmen.",
      "purposeEn": "Handle individual rights clearly, on time and traceably without excessive identity barriers or blanket exceptions.",
      "defaultRules": [
        "Identitätsprüfung",
        "Abgedeckte Rechte",
        "Fristen",
        "Weitergabe an Dritte",
        "Dokumentation"
      ],
      "defaultRulesEn": [
        "Identity Verification",
        "Covered Rights",
        "Deadlines",
        "Notification to Third Parties",
        "Documentation"
      ]
    },
  {
      "id": "D24",
      "name": "Datenpannen-Meldeverfahren (Artikel 33/34 DSGVO)",
      "nameEn": "Personal Data Breach Notification Procedure (GDPR Articles 33/34)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Datenschutzverletzungen rollenbezogen beurteilen, melden und dokumentieren; gemeinsame Vorfallsdaten ohne Vermischung gesetzlicher Fristen nutzen.",
      "descriptionEn": "Assess, notify and document personal data breaches by role; reuse incident facts without conflating statutory deadlines.",
      "purpose": "Datenschutzverletzungen rollenbezogen beurteilen, melden und dokumentieren; gemeinsame Vorfallsdaten ohne Vermischung gesetzlicher Fristen nutzen.",
      "purposeEn": "Assess, notify and document personal data breaches by role; reuse incident facts without conflating statutory deadlines.",
      "defaultRules": [
        "Erkennung und Bewertung",
        "Meldung an die Aufsicht (72h)",
        "Benachrichtigung der Betroffenen",
        "Internes Verletzungsregister",
        "Abstimmung mit NIS2/DORA"
      ],
      "defaultRulesEn": [
        "Detection and Assessment",
        "Notification to Authority (72h)",
        "Communication to Data Subjects",
        "Internal Breach Register",
        "Coordination with NIS2/DORA"
      ]
    },
  {
      "id": "D25",
      "name": "KI-Systemregister",
      "nameEn": "AI System Inventory",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "KI-Systeme, Einsatzweisen und daraus folgende Pflichten intern nachvollziehbar erfassen.",
      "descriptionEn": "Maintain an internal record of AI systems, uses and resulting duties.",
      "purpose": "KI-Systeme, Einsatzweisen und daraus folgende Pflichten intern nachvollziehbar erfassen.",
      "purposeEn": "Maintain an internal record of AI systems, uses and resulting duties.",
      "defaultRules": [
        "Vollständiges Inventar",
        "Zweck und Risikoklasse",
        "Daten und Modell",
        "Rollen und Verantwortliche",
        "Aktualisierung"
      ],
      "defaultRulesEn": [
        "Complete Inventory",
        "Purpose and Risk Class",
        "Data and Model",
        "Roles and Owners",
        "Update"
      ]
    },
  {
      "id": "D26",
      "name": "KI-Auswirkungsabschätzung / FRIA",
      "nameEn": "AI Impact Assessment / FRIA",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Eine erforderliche Grundrechte-Folgenabschätzung durchführen und von anderen Folgenabschätzungen unterscheiden.",
      "descriptionEn": "Perform a required fundamental rights impact assessment and distinguish other impact assessments.",
      "purpose": "Eine erforderliche Grundrechte-Folgenabschätzung durchführen und von anderen Folgenabschätzungen unterscheiden.",
      "purposeEn": "Perform a required fundamental rights impact assessment and distinguish other impact assessments.",
      "defaultRules": [
        "Auslöser",
        "Betroffene und Kontext",
        "Risiken für Grundrechte",
        "Maßnahmen und Aufsicht",
        "Verknüpfung mit DSFA"
      ],
      "defaultRulesEn": [
        "Triggers",
        "Affected Persons and Context",
        "Risks to Fundamental Rights",
        "Measures and Oversight",
        "Link to DPIA"
      ]
    },
  {
      "id": "D27",
      "name": "Technische Dokumentation Anhang IV",
      "nameEn": "Technical Documentation (Annex IV)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Die technische Dokumentation eines erfassten Hochrisiko-KI-Systems aufbauen.",
      "descriptionEn": "Build the technical documentation of an in-scope high-risk AI system.",
      "purpose": "Die technische Dokumentation eines erfassten Hochrisiko-KI-Systems aufbauen.",
      "purposeEn": "Build the technical documentation of an in-scope high-risk AI system.",
      "defaultRules": [
        "Systembeschreibung",
        "Entwicklung und Daten",
        "Leistung und Grenzen",
        "Risikomanagement und Aufsicht",
        "Aktualität"
      ],
      "defaultRulesEn": [
        "System Description",
        "Development and Data",
        "Performance and Limitations",
        "Risk Management and Oversight",
        "Currency"
      ]
    },
  {
      "id": "D28",
      "name": "EU-Konformitätserklärung & CE (KI)",
      "nameEn": "EU Declaration of Conformity & CE (AI)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Konformitätsbewertung, Erklärung und Kennzeichnung für das konkrete KI-System vorbereiten.",
      "descriptionEn": "Prepare conformity assessment, declaration and marking for the specific AI system.",
      "purpose": "Konformitätsbewertung, Erklärung und Kennzeichnung für das konkrete KI-System vorbereiten.",
      "purposeEn": "Prepare conformity assessment, declaration and marking for the specific AI system.",
      "defaultRules": [
        "Konformitätsbewertungsverfahren",
        "EU-Konformitätserklärung",
        "CE-Kennzeichnung"
      ],
      "defaultRulesEn": [
        "Conformity Assessment Procedure",
        "EU Declaration of Conformity",
        "CE Marking"
      ]
    },
  {
      "id": "D29",
      "name": "Post-Market-Monitoring-Plan (KI)",
      "nameEn": "Post-Market Monitoring Plan (AI)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Leistung, Vorfälle und Konformität nach Bereitstellung des KI-Systems überwachen.",
      "descriptionEn": "Monitor AI performance, incidents and conformity after supply.",
      "purpose": "Leistung, Vorfälle und Konformität nach Bereitstellung des KI-Systems überwachen.",
      "purposeEn": "Monitor AI performance, incidents and conformity after supply.",
      "defaultRules": [
        "Überwachungssystem",
        "Meldung schwerwiegender Vorfälle",
        "Korrekturmaßnahmen"
      ],
      "defaultRulesEn": [
        "Monitoring System",
        "Reporting of Serious Incidents",
        "Corrective Actions"
      ]
    },
  {
      "id": "D30",
      "name": "Technische Dokumentation & EU-Konformitätserklärung (CRA)",
      "nameEn": "Technical Documentation & DoC (CRA)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Produktbezogene CRA-Konformitätsnachweise zusammenführen.",
      "descriptionEn": "Assemble product-specific CRA conformity evidence.",
      "purpose": "Produktbezogene CRA-Konformitätsnachweise zusammenführen.",
      "purposeEn": "Assemble product-specific CRA conformity evidence.",
      "defaultRules": [
        "Produktbeschreibung",
        "Erfüllung der Grundanforderungen",
        "Konformitätsbewertung",
        "EU-Konformitätserklärung & CE"
      ],
      "defaultRulesEn": [
        "Product Description",
        "Fulfilment of Essential Requirements",
        "Conformity Assessment",
        "EU DoC & CE"
      ]
    },
  {
      "id": "D31",
      "name": "Schwachstellen-Offenlegung (CVD) & SBOM",
      "nameEn": "Coordinated Vulnerability Disclosure & SBOM",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Produkt-Schwachstellen koordiniert bearbeiten und gesetzliche Meldungen getrennt führen.",
      "descriptionEn": "Coordinate product vulnerability handling and maintain separate statutory notifications.",
      "purpose": "Produkt-Schwachstellen koordiniert bearbeiten und gesetzliche Meldungen getrennt führen.",
      "purposeEn": "Coordinate product vulnerability handling and maintain separate statutory notifications.",
      "defaultRules": [
        "CVD-Prozess",
        "SBOM",
        "Meldung an ENISA"
      ],
      "defaultRulesEn": [
        "CVD Process",
        "Software Bill of Materials",
        "Reporting to ENISA"
      ]
    },
  {
      "id": "D32",
      "name": "Prototypenschutz-Konzept",
      "nameEn": "Prototype Protection Concept",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Schutzmaßnahmen für tatsächlich bearbeitete Prototypen, Aufnahmen, Transporte und Erprobungen festlegen. Das Konzept folgt dem vereinbarten TISAX-Prüfumfang und den Kundenanforderungen.",
      "descriptionEn": "Define safeguards for prototypes actually handled, recordings, transport and testing. The concept follows the agreed TISAX assessment scope and customer requirements.",
      "purpose": "Schutzmaßnahmen für tatsächlich bearbeitete Prototypen, Aufnahmen, Transporte und Erprobungen festlegen. Das Konzept folgt dem vereinbarten TISAX-Prüfumfang und den Kundenanforderungen.",
      "purposeEn": "Define safeguards for prototypes actually handled, recordings, transport and testing. The concept follows the agreed TISAX assessment scope and customer requirements.",
      "defaultRules": [
        "Physischer Schutz",
        "Foto-/Filmaufnahmen",
        "Transport und Erprobung",
        "Geheimhaltung und Dritte"
      ],
      "defaultRulesEn": [
        "Physical Protection",
        "Photo/Film Recordings",
        "Transport and Testing",
        "Confidentiality and Third Parties"
      ]
    },
  {
      "id": "D33",
      "name": "Auslagerungsregister & -konzept",
      "nameEn": "Outsourcing Register & Concept",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Auslagerungen vollständig erfassen, ihre Wesentlichkeit begründen und die laufende Steuerung dokumentieren. Das DORA-Informationsregister ist ein anderer Datensatz mit teilweise gemeinsamen Stammdaten.",
      "descriptionEn": "Record outsourcing arrangements, justify materiality and document ongoing oversight. The DORA information register is a different dataset that can reuse common master data.",
      "purpose": "Auslagerungen vollständig erfassen, ihre Wesentlichkeit begründen und die laufende Steuerung dokumentieren. Das DORA-Informationsregister ist ein anderer Datensatz mit teilweise gemeinsamen Stammdaten.",
      "purposeEn": "Record outsourcing arrangements, justify materiality and document ongoing oversight. The DORA information register is a different dataset that can reuse common master data.",
      "defaultRules": [
        "Register wesentlicher Auslagerungen",
        "Wesentlichkeitsanalyse",
        "Zentraler Auslagerungsbeauftragter",
        "Weiterverlagerung und Exit"
      ],
      "defaultRulesEn": [
        "Register of Material Outsourcings",
        "Materiality Analysis",
        "Central Outsourcing Officer",
        "Sub-Outsourcing and Exit"
      ]
    },
  {
      "id": "D34",
      "name": "Business-Impact-Analyse (BIA)",
      "nameEn": "Business Impact Analysis",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Diese Vorlage dokumentiert die Business-Impact-Analyse und ihre bestätigten Kontinuitätsanforderungen. Gemeinsame Ergebnisse können mehrere anwendbare Rahmenwerke unterstützen; es ist keine getrennte Analyse pro Framework erforderlich.",
      "descriptionEn": "This template records business impact analysis and confirmed continuity requirements. Shared results can support several applicable frameworks; a separate analysis per framework is not required.",
      "purpose": "Diese Vorlage dokumentiert die Business-Impact-Analyse und ihre bestätigten Kontinuitätsanforderungen. Gemeinsame Ergebnisse können mehrere anwendbare Rahmenwerke unterstützen; es ist keine getrennte Analyse pro Framework erforderlich.",
      "purposeEn": "This template records business impact analysis and confirmed continuity requirements. Shared results can support several applicable frameworks; a separate analysis per framework is not required.",
      "defaultRules": [
        "Identifikation kritischer Prozesse",
        "Auswirkungen über Zeit",
        "MTPD, RTO, RPO",
        "Abhängigkeiten",
        "Aktualisierung"
      ],
      "defaultRulesEn": [
        "Identification of Critical Processes",
        "Impact over Time",
        "MTPD, RTO, RPO",
        "Dependencies",
        "Update"
      ]
    },
  {
      "id": "D35",
      "name": "Notfallhandbuch & Wiederanlaufpläne",
      "nameEn": "Emergency Manual & Recovery Plans",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Ausfüllbares Notfallhandbuch für tatsächliche Aktivierung, Fortführung und Wiederanlauf. Organisatorische Angaben müssen vor Verwendung ergänzt, erprobt und freigegeben werden; „Business Continuity-Richtlinie“ liefert die Richtlinie.",
      "descriptionEn": "Fillable emergency manual for actual activation, continuity and recovery. Organisational details must be completed, exercised and approved before use; “Business Continuity Policy” supplies the policy.",
      "purpose": "Ausfüllbares Notfallhandbuch für tatsächliche Aktivierung, Fortführung und Wiederanlauf. Organisatorische Angaben müssen vor Verwendung ergänzt, erprobt und freigegeben werden; „Business Continuity-Richtlinie“ liefert die Richtlinie.",
      "purposeEn": "Fillable emergency manual for actual activation, continuity and recovery. Organisational details must be completed, exercised and approved before use; “Business Continuity Policy” supplies the policy.",
      "defaultRules": [
        "Sofortmaßnahmen und Alarmierung",
        "Krisenstab und Rollen",
        "Wiederanlaufpläne",
        "Zugänglichkeit"
      ],
      "defaultRulesEn": [
        "Immediate Actions and Alerting",
        "Crisis Team and Roles",
        "Recovery Plans",
        "Accessibility"
      ]
    },
  {
      "id": "D36",
      "name": "Übungs- & Testkonzept (BCM)",
      "nameEn": "Exercise & Testing Concept (BCM)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Planungs- und Ergebnisvorlage für Kontinuitätsübungen und Wiederherstellungstests. Das Programm verknüpft Ziele, Abdeckung, reale Ergebnisse und nachverfolgte Verbesserungen; eine Freigabe wird nicht vorweggenommen.",
      "descriptionEn": "Planning and result template for continuity exercises and recovery tests. The programme links objectives, coverage, actual outcomes and tracked improvements without pre-empting approval.",
      "purpose": "Planungs- und Ergebnisvorlage für Kontinuitätsübungen und Wiederherstellungstests. Das Programm verknüpft Ziele, Abdeckung, reale Ergebnisse und nachverfolgte Verbesserungen; eine Freigabe wird nicht vorweggenommen.",
      "purposeEn": "Planning and result template for continuity exercises and recovery tests. The programme links objectives, coverage, actual outcomes and tracked improvements without pre-empting approval.",
      "defaultRules": [
        "Übungsarten und Frequenz",
        "Szenarien",
        "Auswertung und Verbesserung"
      ],
      "defaultRulesEn": [
        "Exercise Types and Frequency",
        "Scenarios",
        "Evaluation and Improvement"
      ]
    },
  {
      "id": "D37",
      "name": "Systembeschreibung (SOC 2)",
      "nameEn": "System Description",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Eine sachlich zutreffende SOC-2-Systembeschreibung für den vereinbarten Prüfungsumfang vorbereiten. Sie beschreibt den tatsächlichen Dienst, nicht einen gewünschten Soll-Zustand.",
      "descriptionEn": "Prepare a factually accurate SOC 2 system description for the agreed examination scope. It describes the actual service, not an intended future state.",
      "purpose": "Eine sachlich zutreffende SOC-2-Systembeschreibung für den vereinbarten Prüfungsumfang vorbereiten. Sie beschreibt den tatsächlichen Dienst, nicht einen gewünschten Soll-Zustand.",
      "purposeEn": "Prepare a factually accurate SOC 2 system description for the agreed examination scope. It describes the actual service, not an intended future state.",
      "defaultRules": [
        "Dienstleistung und Infrastruktur",
        "Kontrollen und TSC-Bezug",
        "Subservice-Organisationen",
        "Zeitraum und Änderungen"
      ],
      "defaultRulesEn": [
        "Service and Infrastructure",
        "Controls and TSC Mapping",
        "Subservice Organisations",
        "Period and Changes"
      ]
    },
  {
      "id": "D38",
      "name": "Informationssicherheitsziele",
      "nameEn": "Information Security Objectives",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Dokumentierte Informationssicherheitsziele mit Umsetzungs- und Bewertungsplanung.",
      "descriptionEn": "Documented information security objectives with implementation and evaluation planning.",
      "purpose": "Dokumentierte Informationssicherheitsziele mit Umsetzungs- und Bewertungsplanung.",
      "purposeEn": "Documented information security objectives with implementation and evaluation planning.",
      "defaultRules": [
        "Ableitung der Ziele",
        "Messbarkeit",
        "Verantwortliche und Ressourcen",
        "Kommunikation",
        "Fortschrittsmessung",
        "Überprüfung und Anpassung"
      ],
      "defaultRulesEn": [
        "Derivation of Objectives",
        "Measurability",
        "Owners and Resources",
        "Communication",
        "Progress Measurement",
        "Review and Adjustment"
      ]
    },
  {
      "id": "D39",
      "name": "Risikobewertungsbericht",
      "nameEn": "Risk Assessment Report",
      "category": "Risikomanagement-Nachweise",
      "categoryEn": "Risk Management Records",
      "description": "Nachvollziehbarer Bericht über Umfang, Methode, Risiken, Ergebnisse und Entscheidungen.",
      "descriptionEn": "Traceable report of scope, method, risks, results and decisions.",
      "purpose": "Nachvollziehbarer Bericht über Umfang, Methode, Risiken, Ergebnisse und Entscheidungen. Derselbe Nachweis kann ISO 27001 und NIS2 unterstützen. Die erforderlichen Inhalte müssen vorliegen; ein separates Dokument je Framework wird hier nicht behauptet.",
      "purposeEn": "Traceable report of scope, method, risks, results and decisions. The same evidence can support ISO 27001 and NIS2. Required content must be available; this template does not assert that each framework needs a separate document.",
      "defaultRules": [
        "Methodik",
        "Identifizierte Risiken",
        "Eintrittswahrscheinlichkeit und Auswirkung",
        "Risikoniveau und Priorisierung",
        "Abgleich mit Akzeptanzkriterien",
        "Ergebnis und Freigabe"
      ],
      "defaultRulesEn": [
        "Methodology",
        "Identified Risks",
        "Likelihood and Impact",
        "Risk Level and Prioritisation",
        "Comparison with Acceptance Criteria",
        "Result and Approval"
      ]
    },
  {
      "id": "D40",
      "name": "Kompetenznachweis-Register",
      "nameEn": "Competence Records",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Aufgabenbezogene Kompetenzanforderungen, Nachweise und Lückenbehandlung.",
      "descriptionEn": "Task-related competence requirements, evidence and gap handling.",
      "purpose": "Aufgabenbezogene Kompetenzanforderungen, Nachweise und Lückenbehandlung.",
      "purposeEn": "Task-related competence requirements, evidence and gap handling.",
      "defaultRules": [
        "Kompetenzanforderungen je Rolle",
        "Nachweis der Kompetenz",
        "Maßnahmen bei Lücken",
        "Pflege des Registers"
      ],
      "defaultRulesEn": [
        "Competence Requirements per Role",
        "Evidence of Competence",
        "Actions on Gaps",
        "Maintenance of the Register"
      ]
    },
  {
      "id": "D41",
      "name": "Internes Audit-Programm & Auditbericht",
      "nameEn": "Internal Audit Programme & Report",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Geplantes internes ISMS-Audit und nachvollziehbare Ergebnisaufzeichnungen.",
      "descriptionEn": "Planned internal ISMS audits and traceable results records.",
      "purpose": "Geplantes internes ISMS-Audit und nachvollziehbare Ergebnisaufzeichnungen.",
      "purposeEn": "Planned internal ISMS audits and traceable results records.",
      "defaultRules": [
        "Auditprogramm",
        "Unabhängigkeit der Auditoren",
        "Durchführung",
        "Auditbericht",
        "Verknüpfung mit Korrekturmaßnahmen",
        "Berichterstattung an die Leitung"
      ],
      "defaultRulesEn": [
        "Audit Programme",
        "Auditor Independence",
        "Conduct",
        "Audit Report",
        "Link to Corrective Actions",
        "Reporting to Management"
      ]
    },
  {
      "id": "D42",
      "name": "Überwachungs- & Messergebnisse",
      "nameEn": "Monitoring & Measurement Results",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Auswertbare Ergebnisse zur Informationssicherheitsleistung und ISMS-Wirksamkeit.",
      "descriptionEn": "Evaluable results on information security performance and ISMS effectiveness.",
      "purpose": "Auswertbare Ergebnisse zur Informationssicherheitsleistung und ISMS-Wirksamkeit.",
      "purposeEn": "Evaluable results on information security performance and ISMS effectiveness.",
      "defaultRules": [
        "Messgegenstand",
        "Methoden und Zeitpunkte",
        "Kennzahlen (KPI/KRI)",
        "Auswertung und Bericht",
        "Eingang in Review und Verbesserung"
      ],
      "defaultRulesEn": [
        "What is Measured",
        "Methods and Timing",
        "Metrics (KPI/KRI)",
        "Evaluation and Report",
        "Input to Review and Improvement"
      ]
    },
  {
      "id": "D43",
      "name": "Beschluss des Leitungsorgans (Billigung der Maßnahmen)",
      "nameEn": "Board Resolution (Approval of Measures)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Billigung und wirksame Aufsicht der Leitung belegen, ohne pauschale Haftungserklärungen zu erzeugen.",
      "descriptionEn": "Evidence management approval and effective oversight without generating blanket liability declarations.",
      "purpose": "Billigung und wirksame Aufsicht der Leitung belegen, ohne pauschale Haftungserklärungen zu erzeugen.",
      "purposeEn": "Evidence management approval and effective oversight without generating blanket liability declarations.",
      "defaultRules": [
        "Förmliche Billigung",
        "Überwachungspflicht",
        "Persönliche Verantwortung"
      ],
      "defaultRulesEn": [
        "Formal Approval",
        "Oversight Obligation",
        "Personal Accountability"
      ]
    },
  {
      "id": "D44",
      "name": "IKT-Geschäftsfortführungsleitlinie",
      "nameEn": "ICT Business Continuity Policy",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "IKT-Kontinuität als Bestandteil der gesamten Geschäftskontinuität regeln.",
      "descriptionEn": "Govern ICT continuity as part of overall business continuity.",
      "purpose": "IKT-Kontinuität als Bestandteil der gesamten Geschäftskontinuität regeln.",
      "purposeEn": "Govern ICT continuity as part of overall business continuity.",
      "defaultRules": [
        "Ziele und Geltungsbereich",
        "Reaktions- und Wiederherstellungspläne",
        "Auswirkungsabschätzung",
        "Kommunikation und Krisenmanagement",
        "Test der Kontinuitätspläne"
      ],
      "defaultRulesEn": [
        "Objectives and Scope",
        "Response and Recovery Plans",
        "Impact Estimation",
        "Communication and Crisis Management",
        "Testing of Continuity Plans"
      ]
    },
  {
      "id": "D45",
      "name": "IKT-Backup- & Wiederherstellungsverfahren",
      "nameEn": "ICT Backup & Restoration Procedures",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Wiederherstellbare Backups und überprüfte Wiederanlaufverfahren festlegen.",
      "descriptionEn": "Define recoverable backups and verified restoration procedures.",
      "purpose": "Wiederherstellbare Backups und überprüfte Wiederanlaufverfahren festlegen.",
      "purposeEn": "Define recoverable backups and verified restoration procedures.",
      "defaultRules": [
        "Backup-Konzept",
        "Integrität und Trennung",
        "Wiederherstellung und Abgleich",
        "Getrennte Wiederherstellungsumgebung",
        "Restore-Tests"
      ],
      "defaultRulesEn": [
        "Backup Concept",
        "Integrity and Separation",
        "Restoration and Reconciliation",
        "Separate Recovery Environment",
        "Restore Tests"
      ]
    },
  {
      "id": "D46",
      "name": "Vertragsklauseln-Rahmen für IKT-Drittparteien",
      "nameEn": "Contractual Arrangements Policy (ICT Third Parties)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "IKT-Verträge vor Abschluss auf die tatsächlich geltenden DORA-Klauseln prüfen.",
      "descriptionEn": "Review ICT contracts before signature against applicable DORA provisions.",
      "purpose": "IKT-Verträge vor Abschluss auf die tatsächlich geltenden DORA-Klauseln prüfen.",
      "purposeEn": "Review ICT contracts before signature against applicable DORA provisions.",
      "defaultRules": [
        "Pflichtklauseln",
        "Zusatzklauseln für kritische Funktionen",
        "Kündigungsrechte",
        "Vor-Vertrags-Due-Diligence"
      ],
      "defaultRulesEn": [
        "Mandatory Clauses",
        "Additional Clauses for Critical Functions",
        "Termination Rights",
        "Pre-Contract Due Diligence"
      ]
    },
  {
      "id": "D47",
      "name": "Konzentrationsrisiko-Bewertung",
      "nameEn": "Concentration Risk Assessment",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Gemeinsame und schwer ersetzbare IKT-Abhängigkeiten vor und während der Beauftragung bewerten.",
      "descriptionEn": "Assess shared and hard-to-replace ICT dependencies before and during engagement.",
      "purpose": "Gemeinsame und schwer ersetzbare IKT-Abhängigkeiten vor und während der Beauftragung bewerten.",
      "purposeEn": "Assess shared and hard-to-replace ICT dependencies before and during engagement.",
      "defaultRules": [
        "Identifikation von Konzentrationen",
        "Bewertung der Auswirkungen",
        "Steuerungsmaßnahmen"
      ],
      "defaultRulesEn": [
        "Identification of Concentrations",
        "Impact Assessment",
        "Mitigation Measures"
      ]
    },
  {
      "id": "D48",
      "name": "Vorfallklassifizierung & Meldebericht an Aufsicht",
      "nameEn": "Incident Classification & Supervisory Report",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "DORA-Vorfälle klassifizieren und mit den richtigen Fristauslösern melden.",
      "descriptionEn": "Classify DORA incidents and report using the correct deadline triggers.",
      "purpose": "DORA-Vorfälle klassifizieren und mit den richtigen Fristauslösern melden.",
      "purposeEn": "Classify DORA incidents and report using the correct deadline triggers.",
      "defaultRules": [
        "Klassifizierungskriterien",
        "Meldefristen",
        "Meldeinhalte und -wege",
        "Freiwillige Meldung erheblicher Cyberbedrohungen"
      ],
      "defaultRulesEn": [
        "Classification Criteria",
        "Reporting Deadlines",
        "Report Content and Channels",
        "Voluntary Reporting of Significant Cyber Threats"
      ]
    },
  {
      "id": "D49",
      "name": "Post-Incident-Review",
      "nameEn": "Post-Incident Review",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Erkenntnisse aus Vorfällen in überprüfte Verbesserungen überführen und bestehende Vorfalldaten wiederverwenden.",
      "descriptionEn": "Turn incident lessons into verified improvements while reusing existing incident records.",
      "purpose": "Erkenntnisse aus Vorfällen in überprüfte Verbesserungen überführen und bestehende Vorfalldaten wiederverwenden.",
      "purposeEn": "Turn incident lessons into verified improvements while reusing existing incident records.",
      "defaultRules": [
        "Durchführung der Nachbereitung",
        "Ursachen und Wirksamkeit",
        "Anpassung von Rahmen/Verträgen"
      ],
      "defaultRulesEn": [
        "Conduct of Post-Mortem",
        "Causes and Effectiveness",
        "Adjustment of Framework/Contracts"
      ]
    },
  {
      "id": "D50",
      "name": "Datenschutzerklärung / Transparenzinformationen",
      "nameEn": "Privacy Notice / Transparency Information",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Ausfüllbarer Datenschutzhinweis mit klarer Trennung direkter und indirekter Datenerhebung.",
      "descriptionEn": "Privacy-notice schedule distinguishing direct and indirect collection.",
      "purpose": "Ausfüllbarer Datenschutzhinweis mit klarer Trennung direkter und indirekter Datenerhebung.",
      "purposeEn": "Privacy-notice schedule distinguishing direct and indirect collection.",
      "defaultRules": [
        "Pflichtinhalte",
        "Erhebung bei Betroffenen vs. Dritten",
        "Verständlichkeit",
        "Aktualität"
      ],
      "defaultRulesEn": [
        "Mandatory Content",
        "Collection from Subjects vs. Third Parties",
        "Intelligibility",
        "Currency"
      ]
    },
  {
      "id": "D51",
      "name": "TOM-Dokumentation (Art. 32)",
      "nameEn": "Technical & Organisational Measures Documentation",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Verarbeitungsbezogene Sicherheitsmaßnahmen mit Umsetzung, Belegen und Wirksamkeitsprüfung dokumentieren.",
      "descriptionEn": "Document processing-specific safeguards with implementation, evidence and effectiveness review.",
      "purpose": "Verarbeitungsbezogene Sicherheitsmaßnahmen mit Umsetzung, Belegen und Wirksamkeitsprüfung dokumentieren.",
      "purposeEn": "Document processing-specific safeguards with implementation, evidence and effectiveness review.",
      "defaultRules": [
        "Sicherheit der Verarbeitung",
        "Risikoangemessenheit",
        "Wiederherstellbarkeit",
        "Überprüfung der Wirksamkeit"
      ],
      "defaultRulesEn": [
        "Security of Processing",
        "Risk Appropriateness",
        "Restorability",
        "Effectiveness Review"
      ]
    },
  {
      "id": "D52",
      "name": "Drittland-Transfer-Verzeichnis & Garantien (SCC)",
      "nameEn": "Third-Country Transfer Register & Safeguards",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Drittlandübermittlungen und ihre Voraussetzungen nachvollziehbar bewerten; „Verzeichnis von Verarbeitungstätigkeiten (VVT)“ kann denselben Datensatz verknüpfen.",
      "descriptionEn": "Assess international transfers and their conditions traceably; “Records of Processing Activities (RoPA)” can link the same record.",
      "purpose": "Drittlandübermittlungen und ihre Voraussetzungen nachvollziehbar bewerten; „Verzeichnis von Verarbeitungstätigkeiten (VVT)“ kann denselben Datensatz verknüpfen.",
      "purposeEn": "Assess international transfers and their conditions traceably; “Records of Processing Activities (RoPA)” can link the same record.",
      "defaultRules": [
        "Erfassung der Übermittlungen",
        "Rechtsgrundlage der Übermittlung",
        "Transfer-Impact-Assessment (TIA)",
        "Ergänzende Maßnahmen"
      ],
      "defaultRulesEn": [
        "Recording of Transfers",
        "Legal Basis of Transfer",
        "Transfer Impact Assessment",
        "Supplementary Measures"
      ]
    },
  {
      "id": "D53",
      "name": "Bestellung & Meldung Datenschutzbeauftragter",
      "nameEn": "Appointment & Notification of DPO",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Benennungspflicht, Eignung, Unabhängigkeit und öffentliche beziehungsweise behördliche Erreichbarkeit des Datenschutzbeauftragten belegen.",
      "descriptionEn": "Evidence the DPO designation duty, suitability, independence and public and supervisory contactability.",
      "purpose": "Benennungspflicht, Eignung, Unabhängigkeit und öffentliche beziehungsweise behördliche Erreichbarkeit des Datenschutzbeauftragten belegen.",
      "purposeEn": "Evidence the DPO designation duty, suitability, independence and public and supervisory contactability.",
      "defaultRules": [
        "Prüfung der Bestellpflicht",
        "Stellung und Unabhängigkeit",
        "Meldung an die Aufsicht"
      ],
      "defaultRulesEn": [
        "Assessment of Obligation",
        "Position and Independence",
        "Notification to Authority"
      ]
    },
  {
      "id": "D54",
      "name": "Einwilligungsmanagement / Consent-Records",
      "nameEn": "Consent Management / Records",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Einwilligungen und Widerrufe zweck- und versionsbezogen nachweisen und wirksam umsetzen.",
      "descriptionEn": "Evidence and implement purpose- and version-specific consent and withdrawal.",
      "purpose": "Einwilligungen und Widerrufe zweck- und versionsbezogen nachweisen und wirksam umsetzen.",
      "purposeEn": "Evidence and implement purpose- and version-specific consent and withdrawal.",
      "defaultRules": [
        "Nachweis der Einwilligung",
        "Bedingungen wirksamer Einwilligung",
        "Widerruf"
      ],
      "defaultRulesEn": [
        "Evidence of Consent",
        "Conditions of Valid Consent",
        "Withdrawal"
      ]
    },
  {
      "id": "D55",
      "name": "KRITIS-Nachweis nach § 39 BSIG",
      "nameEn": "KRITIS Evidence under Section 39 BSIG",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Den aktuellen KRITIS-Nachweis nach § 39 BSIG vollständig vorbereiten.",
      "descriptionEn": "Prepare complete current KRITIS evidence under section 39 BSIG.",
      "purpose": "Den aktuellen KRITIS-Nachweis nach § 39 BSIG vollständig vorbereiten.",
      "purposeEn": "Prepare complete current KRITIS evidence under section 39 BSIG.",
      "defaultRules": [
        "Nachweispflicht und Turnus",
        "Prüfung durch geeignete Stelle",
        "Prüfumfang und Geltungsbereich",
        "Mängelliste und Behebung",
        "Einbezug der Angriffserkennung",
        "Übermittlung an das BSI"
      ],
      "defaultRulesEn": [
        "Obligation and Cycle",
        "Audit by Qualified Body",
        "Audit Scope",
        "Deficiency List and Remediation",
        "Inclusion of Intrusion Detection",
        "Submission to the BSI"
      ]
    },
  {
      "id": "D56",
      "name": "Nachweis Systeme zur Angriffserkennung (SzA)",
      "nameEn": "Intrusion Detection Systems Evidence",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Den wirksamen Betrieb der erforderlichen Angriffserkennung nachweisen.",
      "descriptionEn": "Evidence effective operation of required intrusion detection.",
      "purpose": "Den wirksamen Betrieb der erforderlichen Angriffserkennung nachweisen.",
      "purposeEn": "Evidence effective operation of required intrusion detection.",
      "defaultRules": [
        "Pflicht zur Angriffserkennung",
        "Protokollierung",
        "Detektion",
        "Reaktion",
        "Umsetzungsgrad und Reifegrad"
      ],
      "defaultRulesEn": [
        "Obligation for Intrusion Detection",
        "Logging",
        "Detection",
        "Response",
        "Implementation and Maturity Level"
      ]
    },
  {
      "id": "D57",
      "name": "KRITIS-Registrierung & Kontaktstelle (§ 33 BSIG)",
      "nameEn": "KRITIS Registration & Contact Point (section 33 BSIG)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "KRITIS-Registrierung und erreichbare Kontaktwege auf aktueller Rechtsgrundlage führen.",
      "descriptionEn": "Maintain KRITIS registration and reachable contacts under current law.",
      "purpose": "KRITIS-Registrierung und erreichbare Kontaktwege auf aktueller Rechtsgrundlage führen.",
      "purposeEn": "Maintain KRITIS registration and reachable contacts under current law.",
      "defaultRules": [
        "Registrierungspflicht",
        "Ständig erreichbare Kontaktstelle",
        "Aktualisierung der Angaben"
      ],
      "defaultRulesEn": [
        "Registration Obligation",
        "24/7 Contact Point",
        "Updating of Details"
      ]
    },
  {
      "id": "D58",
      "name": "Störungsmeldung an das BSI (KRITIS)",
      "nameEn": "Disruption Report to BSI (KRITIS)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Erhebliche Sicherheitsvorfälle mit den KRITIS-Zusatzangaben melden.",
      "descriptionEn": "Report significant security incidents with the additional KRITIS information.",
      "purpose": "Erhebliche Sicherheitsvorfälle mit den KRITIS-Zusatzangaben melden.",
      "purposeEn": "Report significant security incidents with the additional KRITIS information.",
      "defaultRules": [
        "Meldepflichtige Störungen",
        "Meldeinhalte",
        "Fristen und Meldewege",
        "Abgrenzung zu NIS2/DSGVO"
      ],
      "defaultRulesEn": [
        "Reportable Disruptions",
        "Report Content",
        "Deadlines and Channels",
        "Delimitation to NIS2/GDPR"
      ]
    },
  {
      "id": "D59",
      "name": "B3S-Umsetzungsnachweis",
      "nameEn": "B3S Implementation Evidence",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Die Eignung und tatsächliche Umsetzung eines gewählten B3S nachvollziehbar machen.",
      "descriptionEn": "Evidence suitability and actual implementation of a selected B3S.",
      "purpose": "Die Eignung und tatsächliche Umsetzung eines gewählten B3S nachvollziehbar machen.",
      "purposeEn": "Evidence suitability and actual implementation of a selected B3S.",
      "defaultRules": [
        "Anwendung eines B3S",
        "Eignungsfeststellung",
        "Abdeckung der SzA-Anforderungen"
      ],
      "defaultRulesEn": [
        "Application of a B3S",
        "Suitability Determination",
        "Coverage of Intrusion-Detection Requirements"
      ]
    },
  {
      "id": "D60",
      "name": "Daten-Governance-Nachweis (Trainingsdaten)",
      "nameEn": "Data Governance Evidence (Training Data)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Datenqualität und rechtmäßige Datennutzung für erfasste KI-Entwicklung belegen.",
      "descriptionEn": "Evidence data quality and lawful data use in applicable AI development.",
      "purpose": "Datenqualität und rechtmäßige Datennutzung für erfasste KI-Entwicklung belegen.",
      "purposeEn": "Evidence data quality and lawful data use in applicable AI development.",
      "defaultRules": [
        "Datenherkunft und Eignung",
        "Bias- und Repräsentativitätsprüfung",
        "Qualität und Vorverarbeitung"
      ],
      "defaultRulesEn": [
        "Data Provenance and Suitability",
        "Bias and Representativeness Check",
        "Quality and Preprocessing"
      ]
    },
  {
      "id": "D61",
      "name": "EU-Datenbank-Registrierung (KI)",
      "nameEn": "EU Database Registration (AI)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Die für Rolle und System erforderliche KI-Registrierung nachweisen.",
      "descriptionEn": "Evidence AI registration required for the role and system.",
      "purpose": "Die für Rolle und System erforderliche KI-Registrierung nachweisen.",
      "purposeEn": "Evidence AI registration required for the role and system.",
      "defaultRules": [
        "Registrierung Hochrisiko-KI",
        "Pflichtangaben"
      ],
      "defaultRulesEn": [
        "Registration of High-Risk AI",
        "Mandatory Data"
      ]
    },
  {
      "id": "D62",
      "name": "Gebrauchsanweisung (KI)",
      "nameEn": "Instructions for Use (AI)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Betreibern verständliche, zur konkreten KI-Version passende Gebrauchsanweisungen bereitstellen.",
      "descriptionEn": "Provide understandable instructions aligned with the actual AI version.",
      "purpose": "Betreibern verständliche, zur konkreten KI-Version passende Gebrauchsanweisungen bereitstellen.",
      "purposeEn": "Provide understandable instructions aligned with the actual AI version.",
      "defaultRules": [
        "Inhalte der Gebrauchsanweisung",
        "Menschliche Aufsicht",
        "Aktualisierung"
      ],
      "defaultRulesEn": [
        "Content of Instructions",
        "Human Oversight",
        "Update"
      ]
    },
  {
      "id": "D63",
      "name": "Konzept menschliche Aufsicht (KI)",
      "nameEn": "Human Oversight Concept (AI)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Wirksame menschliche Aufsicht mit tatsächlicher Eingriffsbefugnis organisieren.",
      "descriptionEn": "Organise effective human oversight with actual intervention authority.",
      "purpose": "Wirksame menschliche Aufsicht mit tatsächlicher Eingriffsbefugnis organisieren.",
      "purposeEn": "Organise effective human oversight with actual intervention authority.",
      "defaultRules": [
        "Aufsichtsmaßnahmen",
        "Automation Bias",
        "Kompetenz der Aufsichtspersonen"
      ],
      "defaultRulesEn": [
        "Oversight Measures",
        "Automation Bias",
        "Competence of Oversight Personnel"
      ]
    },
  {
      "id": "D64",
      "name": "Produkt-Cybersicherheits-Risikobewertung (CRA)",
      "nameEn": "Product Cybersecurity Risk Assessment",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Cybersicherheitsrisiken des konkreten Produkts über dessen Lebenszyklus beurteilen.",
      "descriptionEn": "Assess cybersecurity risks of the actual product throughout its lifecycle.",
      "purpose": "Cybersicherheitsrisiken des konkreten Produkts über dessen Lebenszyklus beurteilen.",
      "purposeEn": "Assess cybersecurity risks of the actual product throughout its lifecycle.",
      "defaultRules": [
        "Risikobewertung des Produkts",
        "Security by Design",
        "Fortschreibung über den Lebenszyklus"
      ],
      "defaultRulesEn": [
        "Product Risk Assessment",
        "Security by Design",
        "Update over the Lifecycle"
      ]
    },
  {
      "id": "D65",
      "name": "Schwachstellenbehandlung & Support-Zeitraum (CRA)",
      "nameEn": "Vulnerability Handling & Support Period",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Schwachstellenbehebung und Supportzusagen eines Produkts verbindlich organisieren.",
      "descriptionEn": "Organise product vulnerability remediation and support commitments.",
      "purpose": "Schwachstellenbehebung und Supportzusagen eines Produkts verbindlich organisieren.",
      "purposeEn": "Organise product vulnerability remediation and support commitments.",
      "defaultRules": [
        "Vulnerability Handling",
        "Sicherheitsupdates",
        "Support-Zeitraum"
      ],
      "defaultRulesEn": [
        "Vulnerability Handling",
        "Security Updates",
        "Support Period"
      ]
    },
  {
      "id": "D66",
      "name": "IT-Strategie",
      "nameEn": "IT Strategy",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Eine beschlossene IT-Strategie mit Geschäfts- und Risikostrategie verbinden, ohne überholte BAIT-Pflichten auf DORA-Institute zu übertragen.",
      "descriptionEn": "Connect the approved IT strategy to business and risk strategy without imposing superseded BAIT duties on DORA institutions.",
      "purpose": "Eine beschlossene IT-Strategie mit Geschäfts- und Risikostrategie verbinden, ohne überholte BAIT-Pflichten auf DORA-Institute zu übertragen.",
      "purposeEn": "Connect the approved IT strategy to business and risk strategy without imposing superseded BAIT duties on DORA institutions.",
      "defaultRules": [
        "Konsistenz mit Geschäftsstrategie",
        "Inhalte",
        "Überprüfung"
      ],
      "defaultRulesEn": [
        "Consistency with Business Strategy",
        "Content",
        "Review"
      ]
    },
  {
      "id": "D67",
      "name": "Notfallkonzept (MaRisk)",
      "nameEn": "Contingency Concept (MaRisk)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Die institutsspezifische Notfallvorsorge mit den bestehenden BIA-, Fortführungs- und Wiederherstellungsunterlagen verbinden.",
      "descriptionEn": "Link institution-specific emergency preparedness to existing BIA, continuity and recovery records.",
      "purpose": "Die institutsspezifische Notfallvorsorge mit den bestehenden BIA-, Fortführungs- und Wiederherstellungsunterlagen verbinden.",
      "purposeEn": "Link institution-specific emergency preparedness to existing BIA, continuity and recovery records.",
      "defaultRules": [
        "Ziele des Notfallmanagements",
        "Geschäftsfortführungspläne",
        "Wiederanlaufpläne",
        "Tests"
      ],
      "defaultRulesEn": [
        "Objectives of Contingency Management",
        "Business Continuity Plans",
        "Recovery Plans",
        "Tests"
      ]
    },
  {
      "id": "D68",
      "name": "Berechtigungskonzept",
      "nameEn": "Authorisation Concept",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Berechtigungsregeln und ihre Durchführung im zutreffenden Finanzaufsichtsrahmen nachweisen; vorhandene Zugriffsunterlagen weiterverwenden.",
      "descriptionEn": "Demonstrate access rules and their operation under the applicable financial supervisory regime; reuse existing access records.",
      "purpose": "Berechtigungsregeln und ihre Durchführung im zutreffenden Finanzaufsichtsrahmen nachweisen; vorhandene Zugriffsunterlagen weiterverwenden.",
      "purposeEn": "Demonstrate access rules and their operation under the applicable financial supervisory regime; reuse existing access records.",
      "defaultRules": [
        "Schriftliches Konzept",
        "Funktionstrennung",
        "Rezertifizierung"
      ],
      "defaultRulesEn": [
        "Written Concept",
        "Segregation of Duties",
        "Recertification"
      ]
    },
  {
      "id": "D69",
      "name": "Informationsrisikomanagement-Konzept",
      "nameEn": "Information Risk Management Concept",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Informationsrisiken aus nachvollziehbaren Schutzbedarfen ableiten und die Wirksamkeit der Behandlung im Betrieb verfolgen.",
      "descriptionEn": "Derive information risks from justified protection needs and track the operational effectiveness of treatment.",
      "purpose": "Informationsrisiken aus nachvollziehbaren Schutzbedarfen ableiten und die Wirksamkeit der Behandlung im Betrieb verfolgen.",
      "purposeEn": "Derive information risks from justified protection needs and track the operational effectiveness of treatment.",
      "defaultRules": [
        "Schutzbedarf und Risiken",
        "Steuerung und Überwachung",
        "Berichterstattung"
      ],
      "defaultRulesEn": [
        "Protection Needs and Risks",
        "Management and Monitoring",
        "Reporting"
      ]
    },
  {
      "id": "D70",
      "name": "IDV-Richtlinie (Individuelle Datenverarbeitung)",
      "nameEn": "End-User Computing (EUC) Policy",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Geschäftskritische Fachbereichsanwendungen erfassen und angemessen sichern, auch wenn sie außerhalb zentraler IT-Entwicklung entstehen.",
      "descriptionEn": "Inventory and protect significant business-developed applications, including those created outside central IT development.",
      "purpose": "Geschäftskritische Fachbereichsanwendungen erfassen und angemessen sichern, auch wenn sie außerhalb zentraler IT-Entwicklung entstehen.",
      "purposeEn": "Inventory and protect significant business-developed applications, including those created outside central IT development.",
      "defaultRules": [
        "Register der IDV-Anwendungen",
        "Kontrollen"
      ],
      "defaultRulesEn": [
        "Register of EUC Applications",
        "Controls"
      ]
    },
  {
      "id": "D71",
      "name": "Business-Continuity-Strategie",
      "nameEn": "Business Continuity Strategy",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Aus BIA und Risikoanalyse umsetzbare Fortführungs- und Wiederherstellungslösungen auswählen. Die Strategieentscheidung wird mit den operativen Plänen verknüpft.",
      "descriptionEn": "Select feasible continuity and recovery solutions from the BIA and risk assessment. Link strategic decisions to operational plans.",
      "purpose": "Aus BIA und Risikoanalyse umsetzbare Fortführungs- und Wiederherstellungslösungen auswählen. Die Strategieentscheidung wird mit den operativen Plänen verknüpft.",
      "purposeEn": "Select feasible continuity and recovery solutions from the BIA and risk assessment. Link strategic decisions to operational plans.",
      "defaultRules": [
        "Lösungsoptionen",
        "Ressourcen und Priorisierung",
        "Freigabe"
      ],
      "defaultRulesEn": [
        "Solution Options",
        "Resources and Prioritisation",
        "Approval"
      ]
    },
  {
      "id": "D72",
      "name": "Krisenkommunikationsplan",
      "nameEn": "Crisis Communication Plan",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Krisenkommunikation mit erreichbaren Kontakten, sicheren Ersatzkanälen und abgestimmten Aussagen vorbereiten. Gesetzliche Meldungen bleiben eigenständige Abläufe mit eigenen Fristen.",
      "descriptionEn": "Prepare crisis communication with reachable contacts, secure fallback channels and consistent statements. Statutory notifications remain distinct workflows with their own deadlines.",
      "purpose": "Krisenkommunikation mit erreichbaren Kontakten, sicheren Ersatzkanälen und abgestimmten Aussagen vorbereiten. Gesetzliche Meldungen bleiben eigenständige Abläufe mit eigenen Fristen.",
      "purposeEn": "Prepare crisis communication with reachable contacts, secure fallback channels and consistent statements. Statutory notifications remain distinct workflows with their own deadlines.",
      "defaultRules": [
        "Zielgruppen und Sprecher",
        "Kanäle und Vorlagen",
        "Abstimmung mit Meldepflichten",
        "Übung"
      ],
      "defaultRulesEn": [
        "Audiences and Spokespersons",
        "Channels and Templates",
        "Alignment with Reporting Duties",
        "Exercise"
      ]
    },
  {
      "id": "D73",
      "name": "Qualitätsmanagementsystem für Hochrisiko-KI (Art. 17)",
      "nameEn": "Quality Management System for High-Risk AI (Art. 17)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Ein für Hochrisiko-KI erforderliches Qualitätsmanagementsystem integrieren und nachweisen.",
      "descriptionEn": "Integrate and evidence a required quality management system for high-risk AI.",
      "purpose": "Ein für Hochrisiko-KI erforderliches Qualitätsmanagementsystem integrieren und nachweisen.",
      "purposeEn": "Integrate and evidence a required quality management system for high-risk AI.",
      "defaultRules": [
        "Aufbau und Umfang des QMS",
        "Verhältnismäßigkeit und Integration",
        "Dokumentation und Aufbewahrung"
      ],
      "defaultRulesEn": [
        "Structure and Scope of the QMS",
        "Proportionality and Integration",
        "Documentation and Retention"
      ]
    },
  {
      "id": "D74",
      "name": "Datenpannen-Register (Art. 33 Abs. 5)",
      "nameEn": "Personal Data Breach Register (Art. 33(5))",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Registeransicht aller Datenschutzverletzungen mit dokumentierter Entscheidung und Abhilfe; gemeinsamer Datenbestand ist zulässig.",
      "descriptionEn": "Register view of all personal data breaches with decisions and remediation; a shared underlying record is permissible.",
      "purpose": "Registeransicht aller Datenschutzverletzungen mit dokumentierter Entscheidung und Abhilfe; gemeinsamer Datenbestand ist zulässig.",
      "purposeEn": "Register view of all personal data breaches with decisions and remediation; a shared underlying record is permissible.",
      "defaultRules": [
        "Registerpflicht für alle Verletzungen",
        "Inhalt und Nachweisfunktion"
      ],
      "defaultRulesEn": [
        "Obligation to Record All Breaches",
        "Content and Evidence Function"
      ]
    },
  {
      "id": "D75",
      "name": "Management Assertion (SOC 2)",
      "nameEn": "Management Assertion (SOC 2)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Die Erklärung der Geschäftsleitung zur SOC-2-Prüfung auf belastbare Nachweise stützen und mit dem tatsächlichen Berichtsumfang abstimmen.",
      "descriptionEn": "Support management’s SOC 2 assertion with reliable evidence and align it with the actual reporting scope.",
      "purpose": "Die Erklärung der Geschäftsleitung zur SOC-2-Prüfung auf belastbare Nachweise stützen und mit dem tatsächlichen Berichtsumfang abstimmen.",
      "purposeEn": "Support management’s SOC 2 assertion with reliable evidence and align it with the actual reporting scope.",
      "defaultRules": [
        "Zweck und Inhalt der Assertion",
        "Verantwortung und Grundlagen"
      ],
      "defaultRulesEn": [
        "Purpose and Content of the Assertion",
        "Responsibility and Basis"
      ]
    },
  {
      "id": "D76",
      "name": "Nutzerinformationen & Anleitung (CRA Anhang II)",
      "nameEn": "Information and Instructions to the User (CRA Annex II)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Nutzern die erforderlichen produktspezifischen Sicherheitsinformationen bereitstellen.",
      "descriptionEn": "Supply required product-specific security information to users.",
      "purpose": "Nutzern die erforderlichen produktspezifischen Sicherheitsinformationen bereitstellen.",
      "purposeEn": "Supply required product-specific security information to users.",
      "defaultRules": [
        "Pflichtangaben an Nutzer",
        "Form und Verfügbarkeit"
      ],
      "defaultRulesEn": [
        "Mandatory User Information",
        "Form and Availability"
      ]
    },
  {
      "id": "D77",
      "name": "Risikostrategie (MaRisk AT 4.2)",
      "nameEn": "Risk Strategy (MaRisk AT 4.2)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Die Risikostrategie auf das gesamte Institut beziehen und mit dessen Geschäftsmodell und Risikotragfähigkeit abstimmen.",
      "descriptionEn": "Apply risk strategy to the whole institution and align it with the business model and risk-bearing capacity.",
      "purpose": "Die Risikostrategie auf das gesamte Institut beziehen und mit dessen Geschäftsmodell und Risikotragfähigkeit abstimmen.",
      "purposeEn": "Apply risk strategy to the whole institution and align it with the business model and risk-bearing capacity.",
      "defaultRules": [
        "Ableitung aus der Geschäftsstrategie",
        "Überprüfung, Kommunikation und Erörterung"
      ],
      "defaultRulesEn": [
        "Derivation from the Business Strategy",
        "Review, Communication and Discussion"
      ]
    },
  {
      "id": "D78",
      "name": "Vereinbarung über gemeinsame Verantwortlichkeit (Art. 26)",
      "nameEn": "Joint Controllership Agreement (Art. 26)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Vereinbarungsentwurf mit auszufüllender Aufgabenverteilung für tatsächlich gemeinsame Verantwortlichkeit; rechtlich vor Unterzeichnung prüfen.",
      "descriptionEn": "Draft arrangement with an allocation schedule for actual joint controllership; obtain legal review before signature.",
      "purpose": "Vereinbarungsentwurf mit auszufüllender Aufgabenverteilung für tatsächlich gemeinsame Verantwortlichkeit; rechtlich vor Unterzeichnung prüfen.",
      "purposeEn": "Draft arrangement with an allocation schedule for actual joint controllership; obtain legal review before signature.",
      "defaultRules": [
        "Pflicht und Inhalt der Vereinbarung",
        "Abgrenzungsprüfung"
      ],
      "defaultRulesEn": [
        "Obligation and Content of the Arrangement",
        "Assessment of Controllership Roles"
      ]
    },
  {
      "id": "D79",
      "name": "NIST-CSF-Organisationsprofil & Aktionsplan",
      "nameEn": "NIST CSF Organizational Profile & Action Plan",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Das NIST-CSF-2.0-Profil als nachvollziehbare Entscheidungs- und Verbesserungsgrundlage nutzen, nicht als Zertifikat oder starre Reifegradpflicht.",
      "descriptionEn": "Use a NIST CSF 2.0 profile as a traceable basis for decisions and improvement, not as a certificate or rigid maturity requirement.",
      "purpose": "Das NIST-CSF-2.0-Profil als nachvollziehbare Entscheidungs- und Verbesserungsgrundlage nutzen, nicht als Zertifikat oder starre Reifegradpflicht.",
      "purposeEn": "Use a NIST CSF 2.0 profile as a traceable basis for decisions and improvement, not as a certificate or rigid maturity requirement.",
      "defaultRules": [
        "Current- und Target-Profil",
        "Gap-Analyse und priorisierter Aktionsplan"
      ],
      "defaultRulesEn": [
        "Current and Target Profile",
        "Gap Analysis and Prioritised Action Plan"
      ]
    },
  {
      "id": "D80",
      "name": "Registrierung Betreiber kritischer Anlagen (KRITIS-DachG)",
      "nameEn": "Operator Registration (German CER Act)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Die Registrierung einer kritischen Anlage und die daraus folgenden Termine dokumentieren.",
      "descriptionEn": "Record critical-facility registration and the resulting deadlines.",
      "purpose": "Die Registrierung einer kritischen Anlage und die daraus folgenden Termine dokumentieren.",
      "purposeEn": "Record critical-facility registration and the resulting deadlines.",
      "defaultRules": [
        "Registrierungspflicht und Kontaktstelle"
      ],
      "defaultRulesEn": [
        "Registration Obligation and Contact Point"
      ]
    },
  {
      "id": "D81",
      "name": "Risikoanalyse & -bewertung physische Resilienz (KRITIS-DachG)",
      "nameEn": "All-Hazards Risk Assessment (German CER Act)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Gefahrenübergreifende Risiken der kritischen Anlage und ihrer Abhängigkeiten bewerten.",
      "descriptionEn": "Assess all-hazards risk to the critical facility and its dependencies.",
      "purpose": "Gefahrenübergreifende Risiken der kritischen Anlage und ihrer Abhängigkeiten bewerten.",
      "purposeEn": "Assess all-hazards risk to the critical facility and its dependencies.",
      "defaultRules": [
        "All-Gefahren-Ansatz",
        "Berücksichtigung staatlicher Risikobewertungen"
      ],
      "defaultRulesEn": [
        "All-Hazards Approach",
        "Consideration of State Risk Assessments"
      ]
    },
  {
      "id": "D82",
      "name": "Resilienzplan (KRITIS-DachG)",
      "nameEn": "Resilience Plan (German CER Act)",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Den risikobasierten Resilienzplan einer kritischen Anlage umsetzen und fortschreiben.",
      "descriptionEn": "Implement and maintain the risk-based resilience plan for a critical facility.",
      "purpose": "Den risikobasierten Resilienzplan einer kritischen Anlage umsetzen und fortschreiben.",
      "purposeEn": "Implement and maintain the risk-based resilience plan for a critical facility.",
      "defaultRules": [
        "Inhalt des Resilienzplans",
        "Nachweis, Übung und Fortschreibung"
      ],
      "defaultRulesEn": [
        "Content of the Resilience Plan",
        "Evidence, Exercises and Updates"
      ]
    },
  {
      "id": "D83",
      "name": "Vorfall- & Meldungsregister (Incident Register)",
      "nameEn": "Incident & Notification Register",
      "category": "Framework-Delta-Dokumente",
      "categoryEn": "Framework Delta Documents",
      "description": "Vorfälle, Entscheidungen und Meldungen in einem gemeinsamen, zugriffsgeschützten Register nachverfolgen. Unterschiedliche Meldefristen erhalten getrennte Auslöser und Belege.",
      "descriptionEn": "Track incidents, decisions and notifications in a shared access-controlled register. Different notification deadlines have separate trigger events and evidence.",
      "purpose": "Vorfälle, Entscheidungen und Meldungen in einem gemeinsamen, zugriffsgeschützten Register nachverfolgen. Unterschiedliche Meldefristen erhalten getrennte Auslöser und Belege.",
      "purposeEn": "Track incidents, decisions and notifications in a shared access-controlled register. Different notification deadlines have separate trigger events and evidence.",
      "defaultRules": [
        "Registerpflicht und Inhalt",
        "Melde-Tracking und Fristennachweis",
        "Auswertung und Lessons Learned"
      ],
      "defaultRulesEn": [
        "Register Obligation and Content",
        "Notification Tracking and Deadline Evidence",
        "Analysis and Lessons Learned"
      ]
    },
  {
      "id": "D84",
      "name": "Verfahren zur Lenkung dokumentierter Informationen",
      "nameEn": "Documented Information Control Procedure",
      "category": "Ergänzende Richtlinien und Nachweise",
      "categoryEn": "Additional Policies and Records",
      "description": "Gültige Richtlinien und belastbare Aufzeichnungen auffindbar, geschützt und nachvollziehbar halten.",
      "descriptionEn": "Keep valid policies and reliable records findable, protected and traceable.",
      "purpose": "Gültige Richtlinien und belastbare Aufzeichnungen auffindbar, geschützt und nachvollziehbar halten.",
      "purposeEn": "Keep valid policies and reliable records findable, protected and traceable.",
      "defaultRules": [
        "Dokumentenbestand und Zuständigkeit",
        "Erstellen und Freigeben",
        "Verteilen und Zugreifen",
        "Änderungen und veraltete Fassungen",
        "Aufbewahrung und Aussonderung"
      ],
      "defaultRulesEn": [
        "Document Inventory and Ownership",
        "Creation and Approval",
        "Distribution and Access",
        "Changes and Obsolete Versions",
        "Retention and Disposition"
      ]
    },
  {
      "id": "D85",
      "name": "Kontext- und Interessengruppenbewertung des ISMS",
      "nameEn": "ISMS Context and Interested Parties Assessment",
      "category": "Ergänzende Richtlinien und Nachweise",
      "categoryEn": "Additional Policies and Records",
      "description": "Die Annahmen hinter Geltungsbereich, Anforderungen und Risiken nachvollziehbar festhalten.",
      "descriptionEn": "Record the assumptions behind scope, requirements and risks in a traceable form.",
      "purpose": "Die Annahmen hinter Geltungsbereich, Anforderungen und Risiken nachvollziehbar festhalten.",
      "purposeEn": "Record the assumptions behind scope, requirements and risks in a traceable form.",
      "defaultRules": [
        "Interne und externe Themen",
        "Interessierte Parteien und Anforderungen",
        "Relevanz des Klimawandels",
        "Folgen und Neubewertung"
      ],
      "defaultRulesEn": [
        "Internal and External Issues",
        "Interested Parties and Requirements",
        "Climate Change Relevance",
        "Consequences and Reassessment"
      ]
    },
  {
      "id": "D86",
      "name": "Kommunikationsplan für Informationssicherheit",
      "nameEn": "Information Security Communication Plan",
      "category": "Ergänzende Richtlinien und Nachweise",
      "categoryEn": "Additional Policies and Records",
      "description": "Regelmäßige und anlassbezogene Sicherheitskommunikation adressatengerecht organisieren.",
      "descriptionEn": "Organise routine and event-driven security communication for its intended recipients.",
      "purpose": "Regelmäßige und anlassbezogene Sicherheitskommunikation adressatengerecht organisieren.",
      "purposeEn": "Organise routine and event-driven security communication for its intended recipients.",
      "defaultRules": [
        "Kommunikationsbedarf",
        "Empfänger, Zeitpunkt und Methode",
        "Freigabe und Rückfragen",
        "Durchführung und Pflege"
      ],
      "defaultRulesEn": [
        "Communication Needs",
        "Recipients, Timing and Method",
        "Approval and Feedback",
        "Delivery and Maintenance"
      ]
    },
  {
      "id": "D87",
      "name": "Plan für Änderungen am ISMS",
      "nameEn": "ISMS Change Plan",
      "category": "Ergänzende Richtlinien und Nachweise",
      "categoryEn": "Additional Policies and Records",
      "description": "Änderungen des Managementsystems geplant und mit überprüfbaren Ergebnissen umsetzen.",
      "descriptionEn": "Implement management-system changes in a planned manner with verifiable outcomes.",
      "purpose": "Änderungen des Managementsystems geplant und mit überprüfbaren Ergebnissen umsetzen.",
      "purposeEn": "Implement management-system changes in a planned manner with verifiable outcomes.",
      "defaultRules": [
        "Ziel und Auslöser",
        "Auswirkung und Umsetzung",
        "Freigabe und Übergang",
        "Ergebnisprüfung"
      ],
      "defaultRulesEn": [
        "Objective and Trigger",
        "Impact and Implementation",
        "Approval and Transition",
        "Outcome Verification"
      ]
    },
  {
      "id": "D88",
      "name": "Vereinbarung zur sicheren Informationsübertragung",
      "nameEn": "Secure Information Transfer Arrangement",
      "category": "Ergänzende Richtlinien und Nachweise",
      "categoryEn": "Additional Policies and Records",
      "description": "Schutz und Verantwortlichkeiten für eine konkrete Informationsübertragung festlegen.",
      "descriptionEn": "Define safeguards and responsibilities for a particular information transfer.",
      "purpose": "Schutz und Verantwortlichkeiten für eine konkrete Informationsübertragung festlegen.",
      "purposeEn": "Define safeguards and responsibilities for a particular information transfer.",
      "defaultRules": [
        "Gegenstand und berechtigte Parteien",
        "Übertragungsweg und Schutz",
        "Empfang und Weitergabe",
        "Fehlübertragung und Beendigung"
      ],
      "defaultRulesEn": [
        "Subject and Authorised Parties",
        "Transfer Method and Protection",
        "Receipt and Onward Sharing",
        "Misdirection and Termination"
      ]
    },
  {
      "id": "D89",
      "name": "Verfahren für Domänenregistrierungsdaten",
      "nameEn": "Domain Registration Data Procedure",
      "category": "Ergänzende Richtlinien und Nachweise",
      "categoryEn": "Additional Policies and Records",
      "description": "Richtigkeit, Veröffentlichung und rechtmäßige Auskunft über Domänenregistrierungsdaten steuern.",
      "descriptionEn": "Govern accuracy, publication and lawful disclosure of domain registration data.",
      "purpose": "Richtigkeit, Veröffentlichung und rechtmäßige Auskunft über Domänenregistrierungsdaten steuern.",
      "purposeEn": "Govern accuracy, publication and lawful disclosure of domain registration data.",
      "defaultRules": [
        "Erhebung und Zuständigkeit",
        "Überprüfung und Berichtigung",
        "Öffentliche Angaben und Verfahren",
        "Auskunftsanträge",
        "Betrieb und Nachweis"
      ],
      "defaultRulesEn": [
        "Collection and Ownership",
        "Verification and Correction",
        "Public Data and Procedures",
        "Disclosure Requests",
        "Operation and Evidence"
      ]
    },
  {
      "id": "D90",
      "name": "Benennung eines NIS2-Vertreters in der Union",
      "nameEn": "Designation of a NIS2 Representative in the Union",
      "category": "Ergänzende Richtlinien und Nachweise",
      "categoryEn": "Additional Policies and Records",
      "description": "Die Vertretung eines erfassten Nicht-EU-Anbieters wirksam und erreichbar organisieren.",
      "descriptionEn": "Establish effective, reachable representation for a covered non-EU provider.",
      "purpose": "Die Vertretung eines erfassten Nicht-EU-Anbieters wirksam und erreichbar organisieren.",
      "purposeEn": "Establish effective, reachable representation for a covered non-EU provider.",
      "defaultRules": [
        "Anwendbarkeit und Sitz",
        "Benennung und Befugnis",
        "Kontakt und Registrierung",
        "Änderung und Übergang"
      ],
      "defaultRulesEn": [
        "Applicability and Establishment",
        "Designation and Authority",
        "Contact and Registration",
        "Change and Handover"
      ]
    },
  {
      "id": "D91",
      "name": "Teilnahme und Schutzregeln für Cybersicherheits-Informationsaustausch",
      "nameEn": "Cybersecurity Information-Sharing Participation and Safeguards",
      "category": "Ergänzende Richtlinien und Nachweise",
      "categoryEn": "Additional Policies and Records",
      "description": "Eine freiwillig gewählte Austauschvereinbarung mit klaren Schutz-, Teilnahme- und Meldeentscheidungen betreiben.",
      "descriptionEn": "Operate a voluntarily chosen sharing arrangement with clear safeguards, participation and notification decisions.",
      "purpose": "Eine freiwillig gewählte Austauschvereinbarung mit klaren Schutz-, Teilnahme- und Meldeentscheidungen betreiben.",
      "purposeEn": "Operate a voluntarily chosen sharing arrangement with clear safeguards, participation and notification decisions.",
      "defaultRules": [
        "Teilnahmeentscheidung",
        "Zulässige Informationen",
        "Teilnahme- und Austrittsmeldung",
        "Nutzung und Überprüfung"
      ],
      "defaultRulesEn": [
        "Participation Decision",
        "Permitted Information",
        "Joining and Withdrawal Notification",
        "Use and Review"
      ]
    },
  {
      "id": "D92",
      "name": "Bearbeitung behördlicher Sicherheitsanfragen und Anordnungen",
      "nameEn": "Handling Supervisory Security Requests and Orders",
      "category": "Ergänzende Richtlinien und Nachweise",
      "categoryEn": "Additional Policies and Records",
      "description": "Behördliche Anliegen fristgerecht, nachvollziehbar und im richtigen Umfang bearbeiten.",
      "descriptionEn": "Handle supervisory matters on time, traceably and within their proper scope.",
      "purpose": "Behördliche Anliegen fristgerecht, nachvollziehbar und im richtigen Umfang bearbeiten.",
      "purposeEn": "Handle supervisory matters on time, traceably and within their proper scope.",
      "defaultRules": [
        "Eingang und Zuständigkeit",
        "Sicherung und Zusammenstellung",
        "Antwort und Zugriff",
        "Anordnungen und Abschluss"
      ],
      "defaultRulesEn": [
        "Receipt and Competence",
        "Preservation and Assembly",
        "Response and Access",
        "Orders and Closure"
      ]
    },
  {
      "id": "D93",
      "name": "Sicherheitsplan für Projekte und Systembeschaffung",
      "nameEn": "Project and System Acquisition Security Plan",
      "category": "Ergänzende Richtlinien und Nachweise",
      "categoryEn": "Additional Policies and Records",
      "description": "Sicherheitsanforderungen früh in Projekte und Beschaffungen einbringen und ihre Erfüllung vor Übergabe prüfen.",
      "descriptionEn": "Introduce security requirements early into projects and acquisitions and verify them before handover.",
      "purpose": "Sicherheitsanforderungen früh in Projekte und Beschaffungen einbringen und ihre Erfüllung vor Übergabe prüfen.",
      "purposeEn": "Introduce security requirements early into projects and acquisitions and verify them before handover.",
      "defaultRules": [
        "Projektumfang und Verantwortung",
        "Prüfbare Sicherheitsanforderungen",
        "Lieferanten und Änderungen",
        "Abnahme und offene Risiken",
        "Übergabe in den Betrieb"
      ],
      "defaultRulesEn": [
        "Project Scope and Responsibility",
        "Testable Security Requirements",
        "Suppliers and Changes",
        "Acceptance and Open Risks",
        "Operational Handover"
      ]
    }
];

export const DELTA_CLAUSES: PolicyClauseMap = {
  "D01": [
    {
      "id": "d01-c01",
      "title": "Zweck und Rolle der SoA",
      "titleEn": "Purpose and Role of the SoA",
      "description": "Die Erklärung zur Anwendbarkeit (SoA) dokumentiert die für den festgelegten ISMS-Geltungsbereich notwendigen Kontrollen, ihre Aufnahmegründe und ihren Umsetzungsstand. Sie enthält auch die Begründung für ausgeschlossene Kontrollen aus Anhang A. Notwendige eigene Kontrollen und Kontrollen aus anderen Quellen werden ebenfalls berücksichtigt. Die SoA wird als gelenkte dokumentierte Information bereitgehalten; sie ist nicht lediglich eine ausgefüllte Annex-A-Checkliste.",
      "descriptionEn": "The Statement of Applicability (SoA) records controls necessary for the defined ISMS scope, the reasons for including them and their implementation status. It also contains justification for excluded Annex A controls. Necessary custom controls and controls from other sources are included. The SoA is maintained as controlled documented information; it is not merely a completed Annex A checklist.",
      "reason": "Eine auf Anhang A begrenzte Liste kann notwendige organisationsspezifische Kontrollen übersehen.",
      "reasonEn": "A list limited to Annex A can overlook necessary organisation-specific controls.",
      "whenRequired": "Bei Erstellung sowie zu festgelegten Prüfterminen und bei relevanten Änderungen. Keine allgemeine jährliche Frist wird aus dieser Klausel abgeleitet.",
      "whenRequiredEn": "On preparation, at defined review intervals and following relevant changes. No universal annual deadline is inferred from this clause.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.3(b)-(d); 7.5"
      ]
    },
    {
      "id": "d01-c02",
      "title": "Vollständigkeit des Kontrollsatzes",
      "titleEn": "Completeness of the Control Set",
      "description": "Die Organisation ermittelt zunächst ihre notwendigen Kontrollen und gleicht sie mit allen 93 Referenzkontrollen aus Anhang A der Ausgabe 2022 ab. Nicht abgedeckte Referenzkontrollen werden geprüft, damit keine notwendige Maßnahme übersehen wird. Zusätzliche notwendige Kontrollen bleiben im Kontrollsatz enthalten. Die Zuordnung muss nachvollziehbar sein; eine Tabelle mit genau einer Zeile je Annex-A-Kontrolle ist eine mögliche Darstellung, nicht die einzig zulässige Struktur.",
      "descriptionEn": "The organisation first identifies its necessary controls and compares them with all 93 reference controls in Annex A of the 2022 edition. Unmapped reference controls are examined to avoid overlooking a necessary safeguard. Additional necessary controls remain in the control set. Mapping must be traceable; a table with exactly one row per Annex A control is one possible presentation, not the only permitted structure.",
      "reason": "Die Auswahl eines anderen Kontrollkatalogs ersetzt nicht den Abgleich mit Anhang A.",
      "reasonEn": "Choosing another control catalogue does not replace comparison with Annex A.",
      "whenRequired": "Bei Erstellung sowie zu festgelegten Prüfterminen und bei relevanten Änderungen. Keine allgemeine jährliche Frist wird aus dieser Klausel abgeleitet.",
      "whenRequiredEn": "On preparation, at defined review intervals and following relevant changes. No universal annual deadline is inferred from this clause.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.3(b)-(d); Annex A"
      ]
    },
    {
      "id": "d01-c03",
      "title": "Anwendbarkeit je Kontrolle",
      "titleEn": "Applicability per Control",
      "description": "Für jede betrachtete Kontrolle wird dokumentiert, ob sie für den Geltungsbereich notwendig ist. Diese Entscheidung wird vom Umsetzungsstand getrennt geführt: Eine noch nicht umgesetzte notwendige Kontrolle bleibt anwendbar. Bei mehreren internen Prüfpunkten zu einer Referenzkontrolle wird die Entscheidung auf Referenzebene begründet; ein nicht zutreffender einzelner Prüfpunkt schließt nicht automatisch die gesamte Referenzkontrolle aus.",
      "descriptionEn": "For each control considered, record whether it is necessary for the scope. Keep this decision separate from implementation status: a necessary control that has not yet been implemented remains applicable. Where several internal assessment points map to a reference control, justify the decision at reference level; one inapplicable assessment point does not automatically exclude the whole reference control.",
      "reason": "Die Vermischung von Anwendbarkeit und Umsetzung kann offene Lücken als Ausschlüsse verbergen.",
      "reasonEn": "Mixing applicability with implementation can disguise open gaps as exclusions.",
      "whenRequired": "Bei Erstellung sowie zu festgelegten Prüfterminen und bei relevanten Änderungen. Keine allgemeine jährliche Frist wird aus dieser Klausel abgeleitet.",
      "whenRequiredEn": "On preparation, at defined review intervals and following relevant changes. No universal annual deadline is inferred from this clause.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.3(c)-(d)"
      ]
    },
    {
      "id": "d01-c04",
      "title": "Begründung der Aufnahme",
      "titleEn": "Justification for Inclusion",
      "description": "Die Aufnahmebegründung benennt, welche Risiken, rechtlichen oder vertraglichen Anforderungen oder begründeten Geschäftsanforderungen die Kontrolle notwendig machen. Auf maßgebliche Bewertungen oder Register darf eindeutig verwiesen werden. Die bloße Aussage, dass die Kontrolle in Anhang A steht, genügt als Begründung nicht. Eine allgemeine Risikoreferenz ohne erkennbaren Zusammenhang wird vermieden.",
      "descriptionEn": "The inclusion rationale identifies risks, legal or contractual duties, or justified business requirements that make the control necessary. Relevant assessments or registers may be referenced unambiguously. Merely stating that the control appears in Annex A is not sufficient justification. Avoid generic risk references without a discernible connection.",
      "reason": "Ein konkreter Aufnahmegrund macht spätere Änderungen an der Kontrollauswahl nachvollziehbar.",
      "reasonEn": "A specific inclusion reason makes later changes to control selection traceable.",
      "whenRequired": "Bei Erstellung sowie zu festgelegten Prüfterminen und bei relevanten Änderungen. Keine allgemeine jährliche Frist wird aus dieser Klausel abgeleitet.",
      "whenRequiredEn": "On preparation, at defined review intervals and following relevant changes. No universal annual deadline is inferred from this clause.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.3(b)-(d)"
      ]
    },
    {
      "id": "d01-c05",
      "title": "Begründung des Ausschlusses",
      "titleEn": "Justification for Exclusion",
      "description": "Für eine ausgeschlossene Annex-A-Kontrolle wird erklärt, weshalb sie für den definierten Geltungsbereich nicht notwendig ist. Die Begründung berücksichtigt Risiken, Abhängigkeiten und bindende Anforderungen. Fehlende Umsetzung, fehlendes Budget oder die Durchführung durch einen Dienstleister sind allein keine Ausschlussgründe. Wird ein Schutzziel durch eine anders formulierte notwendige Kontrolle erreicht, wird die Zuordnung beschrieben. Ausschlüsse dürfen keine erforderlichen Maßnahmen entfallen lassen.",
      "descriptionEn": "For an excluded Annex A control, explain why it is unnecessary for the defined scope, considering risks, dependencies and binding requirements. Missing implementation, lack of budget or delivery by a service provider are not, alone, reasons for exclusion. Where a protection objective is met by a differently formulated necessary control, describe the mapping. Exclusion must not remove necessary safeguards.",
      "reason": "Eine unbegründete Ausnahme kann eine tatsächlich bestehende Verpflichtung verdecken.",
      "reasonEn": "An unsupported exclusion can conceal an actual obligation.",
      "whenRequired": "Bei Ausschluss einer Annex-A-Referenzkontrolle.",
      "whenRequiredEn": "When an Annex A reference control is excluded.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.3(c)-(d)"
      ]
    },
    {
      "id": "d01-c06",
      "title": "Umsetzungsstatus",
      "titleEn": "Implementation Status",
      "description": "Für notwendige Kontrollen wird festgehalten, ob sie umgesetzt sind. Zusätzliche Arbeitsstatus wie geplant oder teilweise umgesetzt dürfen verwendet werden, wenn ihre Bedeutung eindeutig ist und Restlücken sichtbar bleiben. Nicht anwendbar ist eine separate begründete Entscheidung, kein Ersatz für fehlende Umsetzung. Statusänderungen werden anhand aktueller Nachweise überprüft; ein freigegebenes Richtliniendokument allein belegt nicht die praktische Umsetzung.",
      "descriptionEn": "For necessary controls, record whether they are implemented. Additional working statuses such as planned or partially implemented may be used if their meaning is clear and remaining gaps stay visible. Not applicable is a separate justified decision, not a substitute for missing implementation. Status changes are checked against current evidence; an approved policy alone does not demonstrate operational implementation.",
      "reason": "Ein optimistischer Status ohne Nachweis lässt den tatsächlichen Handlungsbedarf verschwinden.",
      "reasonEn": "An optimistic status without evidence hides the actual need for action.",
      "whenRequired": "Bei Erstellung sowie zu festgelegten Prüfterminen und bei relevanten Änderungen. Keine allgemeine jährliche Frist wird aus dieser Klausel abgeleitet.",
      "whenRequiredEn": "On preparation, at defined review intervals and following relevant changes. No universal annual deadline is inferred from this clause.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.3(d); 8.3"
      ]
    },
    {
      "id": "d01-c07",
      "title": "Verknüpfung mit Risiken und RTP",
      "titleEn": "Link to Risks and RTP",
      "description": "Kontrollen werden mit den maßgeblichen Aufnahmegründen und, soweit relevant, Risiken und Maßnahmen des Risikobehandlungsplans verknüpft. Rechtlich oder vertraglich begründete Kontrollen erhalten den entsprechenden Anforderungsbezug; es wird kein künstlicher Einzelrisikodatensatz erzwungen. Die Verknüpfung zeigt den Entscheidungsweg. Ob eine Kontrolle wirksam ist, muss anhand geeigneter Prüfungen und Ergebnisse beurteilt werden, nicht anhand des Links allein.",
      "descriptionEn": "Controls link to their inclusion reasons and, where relevant, risks and actions in the risk treatment plan. Controls justified by legal or contractual duties receive the corresponding requirement reference; an artificial individual risk record is not required. The link shows the decision path. Control effectiveness must be assessed using suitable checks and results, not the link alone.",
      "reason": "Rückverfolgbarkeit und Wirksamkeitsnachweis erfüllen unterschiedliche Zwecke.",
      "reasonEn": "Traceability and evidence of effectiveness serve different purposes.",
      "whenRequired": "Bei Erstellung sowie zu festgelegten Prüfterminen und bei relevanten Änderungen. Keine allgemeine jährliche Frist wird aus dieser Klausel abgeleitet.",
      "whenRequiredEn": "On preparation, at defined review intervals and following relevant changes. No universal annual deadline is inferred from this clause.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.3(b)-(f); 8.3; 9.1"
      ]
    },
    {
      "id": "d01-c08",
      "title": "Verknüpfung mit Richtlinien und Nachweisen",
      "titleEn": "Link to Policies and Evidence",
      "description": "Zur Unterstützung der Prüfung werden einschlägige Richtlinien, Verfahren, operative Aufzeichnungen und Prüfergebnisse eindeutig referenziert. Ein eigenes Dokument je Kontrolle ist nicht erforderlich; dieselbe Aufzeichnung darf mehrere Kontrollen unterstützen. Verweise bleiben aktuell und für berechtigte Prüfende zugänglich. Fehlende Nachweise werden als Lücke ausgewiesen statt durch Platzhalter als vorhanden dargestellt.",
      "descriptionEn": "To support review, reference relevant policies, procedures, operational records and test results unambiguously. A separate document for each control is not required; one record may support several controls. References remain current and accessible to authorised reviewers. Missing evidence is identified as a gap rather than represented as available by a placeholder.",
      "reason": "Veraltete oder nicht zugängliche Verweise verhindern die Überprüfung des behaupteten Zustands.",
      "reasonEn": "Obsolete or inaccessible references prevent checking the claimed state.",
      "whenRequired": "Bei Erstellung sowie zu festgelegten Prüfterminen und bei relevanten Änderungen. Keine allgemeine jährliche Frist wird aus dieser Klausel abgeleitet.",
      "whenRequiredEn": "On preparation, at defined review intervals and following relevant changes. No universal annual deadline is inferred from this clause.",
      "sources": [
        "ISO/IEC 27001:2022 7.5; 8.1; 8.3, supporting evidence organisation"
      ]
    },
    {
      "id": "d01-c09",
      "title": "Prüfung und Freigabe der SoA",
      "titleEn": "SoA Review and Approval",
      "description": "Die SoA wird vor Freigabe auf Eignung und Angemessenheit geprüft und durch die dafür befugte Rolle genehmigt. Genehmiger, Datum und Version werden festgehalten. Die Organisation kann die oberste Leitung als Genehmiger bestimmen; ISO 27001 schreibt in 6.1.3(d) jedoch keine eigene Unterschrift der obersten Leitung auf der SoA vor. Die Genehmigung des Risikobehandlungsplans und Akzeptanz der Restrisiken durch Risikoeigentümer bleiben davon getrennte Anforderungen.",
      "descriptionEn": "Before release, the SoA is reviewed for suitability and adequacy and approved by the authorised role. Approver, date and version are recorded. The organisation may designate top management as approver, but ISO 27001 clause 6.1.3(d) does not prescribe a separate top-management signature on the SoA. Risk owners' approval of the risk treatment plan and acceptance of residual risks remain distinct requirements.",
      "reason": "Eine Unterschrift darf nicht mit anderen notwendigen Risikoentscheidungen verwechselt werden.",
      "reasonEn": "A signature must not be confused with other required risk decisions.",
      "whenRequired": "Bei Erstellung sowie zu festgelegten Prüfterminen und bei relevanten Änderungen. Keine allgemeine jährliche Frist wird aus dieser Klausel abgeleitet.",
      "whenRequiredEn": "On preparation, at defined review intervals and following relevant changes. No universal annual deadline is inferred from this clause.",
      "sources": [
        "ISO/IEC 27001:2022 7.5.2(c); 6.1.3(d), (f)"
      ]
    },
    {
      "id": "d01-c10",
      "title": "Versionierung und Pflege",
      "titleEn": "Versioning and Maintenance",
      "description": "Die SoA wird versioniert und bei relevanten Änderungen an Geltungsbereich, Anforderungen, Risiken, Kontrollauswahl oder Umsetzung überprüft und erforderlichenfalls aktualisiert. Änderungsgrund, betroffene Entscheidungen und freigegebener Stand bleiben nachvollziehbar. Die Organisation bestimmt geplante Prüfintervalle; eine allgemeine jährliche SoA-Frist wird hier nicht als ISO-Vorgabe behauptet.",
      "descriptionEn": "The SoA is version-controlled and reviewed following relevant changes to scope, requirements, risks, control selection or implementation, with updates where necessary. Reasons for change, affected decisions and the approved baseline remain traceable. The organisation defines planned review intervals; this template does not present an annual SoA deadline as a universal ISO requirement.",
      "reason": "Eine alte SoA kann Entscheidungen wiedergeben, die nicht mehr zur aktuellen Umgebung passen.",
      "reasonEn": "An old SoA can retain decisions that no longer fit the current environment.",
      "whenRequired": "Bei Erstellung sowie zu festgelegten Prüfterminen und bei relevanten Änderungen. Keine allgemeine jährliche Frist wird aus dieser Klausel abgeleitet.",
      "whenRequiredEn": "On preparation, at defined review intervals and following relevant changes. No universal annual deadline is inferred from this clause.",
      "sources": [
        "ISO/IEC 27001:2022 7.5.3; 6.1.3; 8.1"
      ]
    },
    {
      "id": "d01-c11",
      "title": "Review im Management-Review",
      "titleEn": "Review in Management Review",
      "description": "Wesentliche Änderungen der Kontrollauswahl, Umsetzungsdefizite und daraus entstehender Entscheidungsbedarf werden in geeigneter Form in die Managementbewertung eingebracht. Die SoA kann diese Informationen zusammenführen. Eine vollständige erneute Prüfung jeder SoA-Zeile in jeder Managementbewertung ist nicht pauschal erforderlich. Managementbewertungen finden zu geplanten Intervallen statt; Beschlüsse zu Änderungen, Ressourcen und Verbesserungen werden dokumentiert.",
      "descriptionEn": "Significant changes to control selection, implementation gaps and resulting decision needs are brought into management review in a suitable form. The SoA may consolidate this information. A complete re-examination of every SoA row at every management review is not universally required. Management reviews occur at planned intervals; decisions on changes, resources and improvement are recorded.",
      "reason": "Relevante Lücken müssen entscheidungsfähig berichtet werden, nicht nur als umfangreicher Anhang.",
      "reasonEn": "Relevant gaps must be reported in a form that supports decisions, not merely as a lengthy appendix.",
      "whenRequired": "Bei Erstellung sowie zu festgelegten Prüfterminen und bei relevanten Änderungen. Keine allgemeine jährliche Frist wird aus dieser Klausel abgeleitet.",
      "whenRequiredEn": "On preparation, at defined review intervals and following relevant changes. No universal annual deadline is inferred from this clause.",
      "sources": [
        "ISO/IEC 27001:2022 9.3; 6.1.3, SoA as supporting review input"
      ]
    }
  ],
  "D02": [
    {
      "id": "d02-c01",
      "title": "Zweck und Geltungsbereich",
      "titleEn": "Purpose and Scope",
      "description": "Dieser Plan legt fest, wie die Organisation die aus der referenzierten Bewertung hervorgehenden Risiken behandelt. Er benennt Geltungsbereich, Bewertungsstand, Risikoeigentümer und verknüpfte Entscheidungen. Offene verbindliche Anforderungen werden gesondert kenntlich gemacht; eine Risikoakzeptanz kann sie nicht aufheben. Ein gemeinsamer Plan darf mehrere Frameworks unterstützen, wenn deren Anforderungen und Zuständigkeiten nachvollziehbar bleiben.",
      "descriptionEn": "This plan defines how the organisation treats risks arising from the referenced assessment. It identifies scope, assessment baseline, risk owners and linked decisions. Outstanding binding requirements are identified separately; risk acceptance cannot cancel them. One plan may support several frameworks where their requirements and responsibilities remain traceable.",
      "reason": "Ohne Bewertungsbezug kann der Plan an einer überholten Risikolage ausgerichtet sein.",
      "reasonEn": "Without a linked assessment, the plan may address an outdated risk situation.",
      "whenRequired": "Für den festgelegten ISMS- und Sicherheitsgeltungsbereich. CIR-spezifische Aussagen gelten nur im Anwendungsbereich dieser Verordnung; ein eigenes Dokument je Klausel ist nicht erforderlich.",
      "whenRequiredEn": "For the defined ISMS and security scope. CIR-specific provisions apply only within that regulation's entity scope; a separate document for each clause is not required.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.3(e); 8.3",
        "NIS2 Article 21(1), 21(2)(a)",
        "CIR 2024/2690 Annex 2.1, only within its entity scope"
      ]
    },
    {
      "id": "d02-c02",
      "title": "Behandlungsoptionen",
      "titleEn": "Treatment Options",
      "description": "Je Risiko werden die gewählten Behandlungsoptionen und ihre Begründung eingetragen. Optionen können kombiniert werden. Die Begründung berücksichtigt erwartete Wirksamkeit, Umsetzbarkeit, Kosten und Nutzen sowie verbindliche Vorgaben. Bei Risikoteilung werden verbleibende eigene Aufgaben ausdrücklich benannt; Versicherung oder Auslagerung ersetzt keine erforderliche Sicherheitsmaßnahme.",
      "descriptionEn": "For each risk, record selected treatment options and their rationale. Options may be combined. The rationale considers expected effectiveness, feasibility, costs and benefits, and binding requirements. Risk sharing explicitly identifies responsibilities retained by the organisation; insurance or outsourcing does not replace required security measures.",
      "reason": "Eine Behandlungsentscheidung muss erklären, warum die gewählte Kombination das Risiko angemessen adressiert.",
      "reasonEn": "A treatment decision must explain why the selected combination addresses the risk appropriately.",
      "whenRequired": "Für den festgelegten ISMS- und Sicherheitsgeltungsbereich. CIR-spezifische Aussagen gelten nur im Anwendungsbereich dieser Verordnung; ein eigenes Dokument je Klausel ist nicht erforderlich.",
      "whenRequiredEn": "For the defined ISMS and security scope. CIR-specific provisions apply only within that regulation's entity scope; a separate document for each clause is not required.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.3(a)-(b)",
        "CIR 2024/2690 Annex 2.1.2(g); 2.1.3, where applicable"
      ]
    },
    {
      "id": "d02-c03",
      "title": "Zugeordnete Kontrollen",
      "titleEn": "Assigned Controls",
      "description": "Jede Maßnahme wird mit einem eindeutigen Kontroll- oder Maßnahmenbezug, dem betroffenen Risiko und dem angestrebten Ergebnis verbunden. Die notwendigen Kontrollen werden mit ISO-Anhang A abgeglichen, damit keine erforderliche Kontrolle übersehen wird; sie sind nicht auf Anhang A beschränkt. Änderungen werden in der Erklärung zur Anwendbarkeit und weiteren betroffenen Nachweisen konsistent nachgeführt.",
      "descriptionEn": "Each action links a unique control or action reference to the affected risk and intended outcome. Necessary controls are checked against ISO Annex A to avoid overlooking required controls; they are not limited to Annex A. Changes are reflected consistently in the Statement of Applicability and other affected evidence.",
      "reason": "Eine reine Liste von Normnummern zeigt nicht, welche Maßnahme welches Risiko behandelt.",
      "reasonEn": "A list of standard references alone does not show which action treats which risk.",
      "whenRequired": "Für den festgelegten ISMS- und Sicherheitsgeltungsbereich. CIR-spezifische Aussagen gelten nur im Anwendungsbereich dieser Verordnung; ein eigenes Dokument je Klausel ist nicht erforderlich.",
      "whenRequiredEn": "For the defined ISMS and security scope. CIR-specific provisions apply only within that regulation's entity scope; a separate document for each clause is not required.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.3(b)-(d)",
        "CIR 2024/2690 Annex 2.1.2(j), where applicable"
      ]
    },
    {
      "id": "d02-c04",
      "title": "Verantwortliche und Termine",
      "titleEn": "Owners and Deadlines",
      "description": "Für jede Maßnahme werden Umsetzungsverantwortlicher, benötigte Mittel, Zieltermin, Abhängigkeiten und prüfbare Abschlusskriterien festgelegt. Der Risikoeigentümer überwacht die Gesamtentscheidung; der Maßnahmenverantwortliche liefert den Umsetzungsnachweis. Unzureichende Ressourcen, Verzögerungen und blockierende Abhängigkeiten werden mit Entscheidung und Folgetermin eskaliert.",
      "descriptionEn": "Each action identifies its implementation owner, required resources, due date, dependencies and testable completion criteria. The risk owner oversees the overall decision; the action owner supplies implementation evidence. Insufficient resources, delays and blocking dependencies are escalated with a recorded decision and follow-up date.",
      "reason": "Ein Termin ohne Zuständigkeit und Abschlusskriterium lässt sich nicht verlässlich verfolgen.",
      "reasonEn": "A deadline without ownership and completion criteria cannot be tracked reliably.",
      "whenRequired": "Für den festgelegten ISMS- und Sicherheitsgeltungsbereich. CIR-spezifische Aussagen gelten nur im Anwendungsbereich dieser Verordnung; ein eigenes Dokument je Klausel ist nicht erforderlich.",
      "whenRequiredEn": "For the defined ISMS and security scope. CIR-specific provisions apply only within that regulation's entity scope; a separate document for each clause is not required.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.3(e); 8.3",
        "CIR 2024/2690 Annex 2.1.2(h)-(i), where applicable"
      ]
    },
    {
      "id": "d02-c05",
      "title": "Restrisiko-Bewertung",
      "titleEn": "Residual Risk Assessment",
      "description": "Vor Freigabe wird das erwartete Restrisiko mit seinen Annahmen dokumentiert. Nach Umsetzung werden die tatsächlich wirksamen Maßnahmen geprüft und das verbleibende Risiko erneut bewertet. Datum, Methodikversion und Nachweise werden erfasst. Weicht das Ergebnis von der Prognose ab, werden zusätzliche Behandlung oder eine befugte Akzeptanzentscheidung veranlasst; die Prognose wird nicht als Testergebnis ausgegeben.",
      "descriptionEn": "Before approval, the expected residual risk and its assumptions are documented. After implementation, the safeguards actually operating are verified and the remaining risk is reassessed. The date, methodology version and evidence are recorded. Where results differ from the forecast, further treatment or an authorised acceptance decision is initiated; the forecast is not presented as a test result.",
      "reason": "Eine abgeschlossene Aufgabe kann ihr Schutzziel trotzdem verfehlen.",
      "reasonEn": "A completed action can still fail to achieve its protection objective.",
      "whenRequired": "Für den festgelegten ISMS- und Sicherheitsgeltungsbereich. CIR-spezifische Aussagen gelten nur im Anwendungsbereich dieser Verordnung; ein eigenes Dokument je Klausel ist nicht erforderlich.",
      "whenRequiredEn": "For the defined ISMS and security scope. CIR-specific provisions apply only within that regulation's entity scope; a separate document for each clause is not required.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.3(f); 8.3",
        "CIR 2024/2690 Annex 2.1.2(h)-(j), where applicable"
      ]
    },
    {
      "id": "d02-c06",
      "title": "Planfreigabe und Risikoakzeptanz",
      "titleEn": "Plan Approval and Risk Acceptance",
      "description": "Die zuständigen Risikoeigentümer genehmigen den Behandlungsplan und akzeptieren die verbleibenden Informationssicherheitsrisiken im Rahmen ihrer Befugnisse. Entscheidung, Begründung, Bedingungen und Datum werden aufgezeichnet. Im CIR-Anwendungsbereich werden Bewertungsergebnisse und Restrisiken durch das Leitungsorgan oder befugte, rechenschaftspflichtige Personen mit angemessener Berichterstattung an das Leitungsorgan akzeptiert. Unzulässige Abweichungen von verbindlichen Anforderungen werden nicht durch Unterschrift legitimiert.",
      "descriptionEn": "Responsible risk owners approve the treatment plan and accept residual information security risks within their authority. The decision, rationale, conditions and date are recorded. Within CIR scope, assessment results and residual risks are accepted by management bodies or authorised accountable persons with adequate reporting to management bodies. Signing does not legitimise impermissible departures from binding requirements.",
      "reason": "Eine Freigabe ohne passende Befugnis ist keine tragfähige Risikoakzeptanz.",
      "reasonEn": "Approval without the appropriate authority is not a sound risk acceptance.",
      "whenRequired": "Für den festgelegten ISMS- und Sicherheitsgeltungsbereich. CIR-spezifische Aussagen gelten nur im Anwendungsbereich dieser Verordnung; ein eigenes Dokument je Klausel ist nicht erforderlich.",
      "whenRequiredEn": "For the defined ISMS and security scope. CIR-specific provisions apply only within that regulation's entity scope; a separate document for each clause is not required.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.3(f)",
        "CIR 2024/2690 Annex 2.1.1, where applicable"
      ]
    },
    {
      "id": "d02-c07",
      "title": "Akzeptierte Risiken",
      "titleEn": "Accepted Risks",
      "description": "Wird ein Risiko ohne weitere Maßnahme beibehalten, nennt der Eintrag die angewandten Kriterien, Begründung, aktuellen Schutzmaßnahmen und verbleibenden Folgen. Entscheider, Entscheidungsdatum, Bedingungen, nächster Prüftermin und Ereignisse für eine vorzeitige Neubewertung werden festgehalten. Eine leere Maßnahmenliste allein gilt nicht als dokumentierte Akzeptanz.",
      "descriptionEn": "Where a risk is retained without further action, the entry states the criteria applied, rationale, current safeguards and remaining consequences. It records the decision-maker, decision date, conditions, next review date and events requiring earlier reassessment. An empty action list alone is not documented acceptance.",
      "reason": "Stillschweigende Akzeptanz lässt Verantwortlichkeit und zeitliche Gültigkeit offen.",
      "reasonEn": "Implicit acceptance leaves accountability and validity unresolved.",
      "whenRequired": "Für den festgelegten ISMS- und Sicherheitsgeltungsbereich. CIR-spezifische Aussagen gelten nur im Anwendungsbereich dieser Verordnung; ein eigenes Dokument je Klausel ist nicht erforderlich.",
      "whenRequiredEn": "For the defined ISMS and security scope. CIR-specific provisions apply only within that regulation's entity scope; a separate document for each clause is not required.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.2(a); 6.1.3(f)",
        "CIR 2024/2690 Annex 2.1.2(j), where applicable"
      ]
    },
    {
      "id": "d02-c08",
      "title": "Priorisierung",
      "titleEn": "Prioritisation",
      "description": "Die Reihenfolge der Maßnahmen berücksichtigt Risikobedeutung, verbindliche Fristen, Abhängigkeiten und Wirksamkeit im Verhältnis zum Aufwand. Einfache Maßnahmen können früh umgesetzt werden, dürfen aber dringliche Pflichten oder kritische Risiken nicht verdrängen. Die priorisierte Reihenfolge und begründete Abweichungen werden mit den zuständigen Risikoeigentümern abgestimmt.",
      "descriptionEn": "Action sequencing considers risk significance, binding deadlines, dependencies and effectiveness relative to effort. Simple actions may be implemented early but must not displace urgent duties or critical risks. The prioritised sequence and justified deviations are agreed with responsible risk owners.",
      "reason": "Eine ausschließlich nach Aufwand sortierte Liste kann die wichtigsten Risiken unbearbeitet lassen.",
      "reasonEn": "A list ordered only by effort can leave the most important risks untreated.",
      "whenRequired": "Für den festgelegten ISMS- und Sicherheitsgeltungsbereich. CIR-spezifische Aussagen gelten nur im Anwendungsbereich dieser Verordnung; ein eigenes Dokument je Klausel ist nicht erforderlich.",
      "whenRequiredEn": "For the defined ISMS and security scope. CIR-specific provisions apply only within that regulation's entity scope; a separate document for each clause is not required.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.2(e); 6.1.3",
        "CIR 2024/2690 Annex 2.1.2(g); 2.1.3, where applicable"
      ]
    },
    {
      "id": "d02-c09",
      "title": "Fortschrittsverfolgung",
      "titleEn": "Progress Tracking",
      "description": "Die Maßnahmenverantwortlichen pflegen Status, letzte Aktualisierung, Nachweise und Hindernisse. Der Risikoeigentümer prüft die Umsetzung laufend und veranlasst erforderliche Entscheidungen. Abschluss wird erst vermerkt, wenn das festgelegte Ergebnis nachgewiesen ist; fehlgeschlagene Prüfungen führen zu Nacharbeit oder erneuter Entscheidung. Die Nachweise bleiben mit dem Plan verknüpft.",
      "descriptionEn": "Action owners maintain status, last update, evidence and obstacles. The risk owner monitors implementation on an ongoing basis and initiates necessary decisions. Completion is recorded only when the defined outcome is evidenced; failed checks lead to rework or a new decision. Evidence remains linked to the plan.",
      "reason": "Eine Statusmarkierung ohne Nachweis kann einen fortbestehenden Mangel verdecken.",
      "reasonEn": "A status label without evidence can conceal a continuing weakness.",
      "whenRequired": "Für den festgelegten ISMS- und Sicherheitsgeltungsbereich. CIR-spezifische Aussagen gelten nur im Anwendungsbereich dieser Verordnung; ein eigenes Dokument je Klausel ist nicht erforderlich.",
      "whenRequiredEn": "For the defined ISMS and security scope. CIR-specific provisions apply only within that regulation's entity scope; a separate document for each clause is not required.",
      "sources": [
        "ISO/IEC 27001:2022 8.3",
        "CIR 2024/2690 Annex 2.1.2(h), where applicable"
      ]
    },
    {
      "id": "d02-c10",
      "title": "Freigabe und Pflege",
      "titleEn": "Approval and Maintenance",
      "description": "Der Plan wird versioniert und entsprechend den zugewiesenen Befugnissen freigegeben. Geänderte Risiken, neue Erkenntnisse und wesentliche Planänderungen lösen eine Prüfung der Maßnahmen und Akzeptanzentscheidungen aus. Im CIR-Anwendungsbereich erfolgt die Überprüfung mindestens jährlich sowie bei wesentlichen Änderungen der Geschäftstätigkeit oder Risiken und erheblichen Vorfällen; Aktualisierungen erfolgen erforderlichenfalls. Frühere Entscheidungen und der aktuelle Stand bleiben nachvollziehbar.",
      "descriptionEn": "The plan is versioned and approved under assigned authority. Changed risks, new findings and significant plan changes trigger review of actions and acceptance decisions. Within CIR scope, review occurs at least annually and after significant changes to operations or risks and significant incidents; updates are made where appropriate. Previous decisions and current status remain traceable.",
      "reason": "Ein überholter Plan kann bereits entfallene Annahmen weiterhin als Entscheidungsgrundlage verwenden.",
      "reasonEn": "An obsolete plan can continue using invalid assumptions as a basis for decisions.",
      "whenRequired": "Für den festgelegten ISMS- und Sicherheitsgeltungsbereich. CIR-spezifische Aussagen gelten nur im Anwendungsbereich dieser Verordnung; ein eigenes Dokument je Klausel ist nicht erforderlich.",
      "whenRequiredEn": "For the defined ISMS and security scope. CIR-specific provisions apply only within that regulation's entity scope; a separate document for each clause is not required.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.3(f); 7.5; 8.3",
        "CIR 2024/2690 Annex 2.1.4, where applicable"
      ]
    }
  ],
  "D03": [
    {
      "id": "d03-c07",
      "title": "Kontext und interessierte Parteien",
      "titleEn": "Context and Interested Parties",
      "description": "Die Scope-Festlegung berücksichtigt relevante interne und externe Themen, interessierte Parteien und deren maßgebliche Anforderungen. Es wird bestimmt, welche dieser Anforderungen im ISMS zu behandeln sind. Die Organisation bestimmt außerdem, ob der Klimawandel für das ISMS relevant ist, und berücksichtigt einschlägige Anforderungen interessierter Parteien dazu. Kontextannahmen und wesentliche Änderungen werden nachvollziehbar mit der Abgrenzung verknüpft.",
      "descriptionEn": "Scope definition considers relevant internal and external issues, interested parties and their pertinent requirements. Determine which requirements are to be addressed through the ISMS. The organisation also determines whether climate change is relevant to the ISMS and considers related requirements of interested parties. Context assumptions and significant changes are linked traceably to the boundary decision.",
      "reason": "Übersehene Anforderungen können einen formal klaren Scope inhaltlich unzureichend machen.",
      "reasonEn": "Overlooked requirements can make a formally clear scope substantively inadequate.",
      "whenRequired": "Bei Erstellung sowie zu festgelegten Prüfterminen und bei relevanten Änderungen. Keine allgemeine jährliche Frist wird aus dieser Klausel abgeleitet.",
      "whenRequiredEn": "On preparation, at defined review intervals and following relevant changes. No universal annual deadline is inferred from this clause.",
      "sources": [
        "ISO/IEC 27001:2022 4.1-4.3; Amd 1:2024"
      ]
    },
    {
      "id": "d03-c01",
      "title": "Zweck des Geltungsbereichs",
      "titleEn": "Purpose of the Scope",
      "description": "Der dokumentierte Geltungsbereich beschreibt die Grenzen und Anwendbarkeit des ISMS. Er benennt, welche Organisation und welche Leistungen erfasst sind, und verweist auf nachvollziehbare Detailabgrenzungen. Der gewählte Zertifizierungsumfang ist nicht automatisch identisch mit dem Anwendungsbereich gesetzlicher Pflichten. Diese werden unabhängig geprüft und durch die Scope-Formulierung nicht eingeschränkt.",
      "descriptionEn": "The documented scope defines the boundaries and applicability of the ISMS. It identifies the organisation and services covered and references traceable boundary details. The chosen certification scope is not automatically identical to the scope of legal duties. Those duties are assessed separately and are not narrowed by the wording of this statement.",
      "reason": "Ein Zertifizierungsumfang ist keine rechtliche Ausnahmeentscheidung.",
      "reasonEn": "A certification scope is not a decision granting a legal exemption.",
      "whenRequired": "Bei Erstellung sowie zu festgelegten Prüfterminen und bei relevanten Änderungen. Keine allgemeine jährliche Frist wird aus dieser Klausel abgeleitet.",
      "whenRequiredEn": "On preparation, at defined review intervals and following relevant changes. No universal annual deadline is inferred from this clause.",
      "sources": [
        "ISO/IEC 27001:2022 4.3"
      ]
    },
    {
      "id": "d03-c02",
      "title": "Organisationseinheiten und Standorte",
      "titleEn": "Organisational Units and Sites",
      "description": "Die einbezogenen Rechtseinheiten, Organisationseinheiten und Standorte werden eindeutig bezeichnet. Mobile Arbeit, gemeinsam genutzte Standorte und externe Betriebsorte werden entsprechend ihrer Bedeutung für die erfassten Leistungen beschrieben. Die Abgrenzung muss erkennen lassen, welche Tätigkeiten erfasst sind; ein Firmenname allein genügt bei einem Teilumfang nicht.",
      "descriptionEn": "Included legal entities, organisational units and sites are identified unambiguously. Remote working, shared sites and externally operated locations are described according to their relevance to covered services. The boundary must show which activities are included; a company name alone is insufficient for a partial scope.",
      "reason": "Unklare Standort- oder Einheitengrenzen lassen Zuständigkeiten offen.",
      "reasonEn": "Unclear site or organisational boundaries leave responsibilities unresolved.",
      "whenRequired": "Bei Erstellung sowie zu festgelegten Prüfterminen und bei relevanten Änderungen. Keine allgemeine jährliche Frist wird aus dieser Klausel abgeleitet.",
      "whenRequiredEn": "On preparation, at defined review intervals and following relevant changes. No universal annual deadline is inferred from this clause.",
      "sources": [
        "ISO/IEC 27001:2022 4.3"
      ]
    },
    {
      "id": "d03-c03",
      "title": "Prozesse und Dienste",
      "titleEn": "Processes and Services",
      "description": "Die erfassten Geschäftsprozesse, Produkte und Dienstleistungen werden so beschrieben, dass ihre wesentlichen Schritte und unterstützenden Funktionen erkennbar sind. Es wird geklärt, welche Entwicklung, Bereitstellung, Betrieb und Unterstützung dazugehören. Relevante ausgelagerte Tätigkeiten werden als Schnittstellen und Abhängigkeiten berücksichtigt, auch wenn der Anbieter selbst nicht Teil des zertifizierten Unternehmens ist.",
      "descriptionEn": "Covered business processes, products and services are described so that their key activities and supporting functions are identifiable. Clarify which development, delivery, operation and support activities are included. Relevant outsourced activities are considered as interfaces and dependencies even where the provider is not part of the certified organisation.",
      "reason": "Ein Dienstname ohne unterstützende Tätigkeiten kann wesentliche Sicherheitsabhängigkeiten verdecken.",
      "reasonEn": "A service name without supporting activities can conceal significant security dependencies.",
      "whenRequired": "Bei Erstellung sowie zu festgelegten Prüfterminen und bei relevanten Änderungen. Keine allgemeine jährliche Frist wird aus dieser Klausel abgeleitet.",
      "whenRequiredEn": "On preparation, at defined review intervals and following relevant changes. No universal annual deadline is inferred from this clause.",
      "sources": [
        "ISO/IEC 27001:2022 4.3; 8.1"
      ]
    },
    {
      "id": "d03-c04",
      "title": "Informationswerte und Systeme",
      "titleEn": "Information Assets and Systems",
      "description": "Die Informationen, wesentlichen Systeme und Infrastrukturarten, auf die sich der Geltungsbereich stützt, werden abgegrenzt. Zur Detailpflege kann auf ein gelenktes Inventar mit erkennbarem Stand verwiesen werden. Datenflüsse und gemeinsam genutzte Systeme werden berücksichtigt. Nicht jedes Gerät muss im Scope-Text selbst aufgelistet sein; die Zuordnung zum Geltungsbereich muss jedoch überprüfbar bleiben.",
      "descriptionEn": "Delineate the information, significant systems and infrastructure types supporting the scope. Detailed records may be maintained in a controlled inventory with an identifiable baseline. Consider data flows and shared systems. Every device need not be listed in the scope statement itself, but its relationship to the scope must remain assessable.",
      "reason": "Ein nachvollziehbarer Inventarbezug verhindert widersprüchliche parallele Listen.",
      "reasonEn": "A traceable inventory reference prevents conflicting parallel lists.",
      "whenRequired": "Bei Erstellung sowie zu festgelegten Prüfterminen und bei relevanten Änderungen. Keine allgemeine jährliche Frist wird aus dieser Klausel abgeleitet.",
      "whenRequiredEn": "On preparation, at defined review intervals and following relevant changes. No universal annual deadline is inferred from this clause.",
      "sources": [
        "ISO/IEC 27001:2022 4.3; A.5.9, inventory as supporting detail"
      ]
    },
    {
      "id": "d03-c05",
      "title": "Schnittstellen und Abhängigkeiten",
      "titleEn": "Interfaces and Dependencies",
      "description": "Schnittstellen zu nicht einbezogenen Bereichen, Konzerndiensten und externen Anbietern werden mit ihren relevanten Informationen, Leistungen und Verantwortlichkeiten beschrieben. Abhängigkeiten wie Identitätsdienste, Personalverwaltung, Stromversorgung oder Cloud-Betrieb werden auf ihren Einfluss auf das ISMS geprüft. Vereinbarungen und Nachweise für die Steuerung relevanter externer Leistungen werden referenziert.",
      "descriptionEn": "Describe interfaces with excluded areas, group services and external suppliers, including relevant information, services and responsibilities. Examine dependencies such as identity services, human resources, power supply or cloud operation for their effect on the ISMS. Reference arrangements and evidence for controlling relevant externally provided services.",
      "reason": "Eine außerhalb der Zertifizierungsgrenze erbrachte Leistung kann innerhalb der Grenze entscheidend sein.",
      "reasonEn": "A service delivered outside the certification boundary can be critical inside it.",
      "whenRequired": "Bei Erstellung sowie zu festgelegten Prüfterminen und bei relevanten Änderungen. Keine allgemeine jährliche Frist wird aus dieser Klausel abgeleitet.",
      "whenRequiredEn": "On preparation, at defined review intervals and following relevant changes. No universal annual deadline is inferred from this clause.",
      "sources": [
        "ISO/IEC 27001:2022 4.3(c); 8.1"
      ]
    },
    {
      "id": "d03-c06",
      "title": "Begründete Ausschlüsse",
      "titleEn": "Justified Exclusions",
      "description": "Nicht einbezogene Tätigkeiten oder Bereiche werden mit einer verständlichen Grenzbeschreibung und Begründung dargestellt. Ihre Schnittstellen und Auswirkungen auf den einbezogenen Bereich bleiben zu berücksichtigen. Die Festlegung eines Teilumfangs erlaubt nicht, Anforderungen der ISO-27001-Klauseln 4 bis 10 innerhalb dieses ISMS auszuschließen. Ausschlüsse von Annex-A-Kontrollen werden gesondert im Risikobehandlungsprozess und in der SoA begründet.",
      "descriptionEn": "Activities or areas not included are described with understandable boundaries and rationale. Their interfaces and effects on included operations must still be considered. Defining a partial scope does not permit requirements in ISO 27001 clauses 4 to 10 to be excluded within that ISMS. Exclusions of Annex A controls are justified separately through risk treatment and the SoA.",
      "reason": "Organisatorische Grenzen und Kontrollausschlüsse sind unterschiedliche Entscheidungen.",
      "reasonEn": "Organisational boundaries and control exclusions are different decisions.",
      "whenRequired": "Bei Erstellung sowie zu festgelegten Prüfterminen und bei relevanten Änderungen. Keine allgemeine jährliche Frist wird aus dieser Klausel abgeleitet.",
      "whenRequiredEn": "On preparation, at defined review intervals and following relevant changes. No universal annual deadline is inferred from this clause.",
      "sources": [
        "ISO/IEC 27001:2022 1; 4.3; 6.1.3(d)"
      ]
    },
    {
      "id": "d03-c08",
      "title": "Freigabe und Pflege",
      "titleEn": "Approval and Maintenance",
      "description": "Die befugte Rolle prüft und genehmigt den Geltungsbereich als dokumentierte Information. Verantwortlicher, Datum, Version und zugänglicher Ablageort werden festgehalten. Geplante Prüfungen sowie relevante organisatorische, technische oder anforderungsbezogene Änderungen lösen eine Überprüfung aus. Eine allgemeine jährliche Scope-Frist wird nicht behauptet. Bei Änderungen werden abhängige Bewertungen, Inventare, SoA und Zertifizierungsaussagen auf Anpassungsbedarf geprüft.",
      "descriptionEn": "The authorised role reviews and approves the scope as documented information. Its owner, date, version and accessible location are recorded. Planned reviews and relevant organisational, technical or requirement changes trigger re-examination. No universal annual scope deadline is asserted. Changes prompt checks of dependent assessments, inventories, the SoA and certification claims for necessary updates.",
      "reason": "Eine Scope-Änderung ohne Anpassung der verknüpften Unterlagen erzeugt widersprüchliche Aussagen.",
      "reasonEn": "Changing scope without updating linked records creates conflicting claims.",
      "whenRequired": "Bei Erstellung sowie zu festgelegten Prüfterminen und bei relevanten Änderungen. Keine allgemeine jährliche Frist wird aus dieser Klausel abgeleitet.",
      "whenRequiredEn": "On preparation, at defined review intervals and following relevant changes. No universal annual deadline is inferred from this clause.",
      "sources": [
        "ISO/IEC 27001:2022 4.3; 7.5.2-7.5.3; 8.1"
      ]
    }
  ],
  "D04": [
    {
      "id": "d04-c01",
      "title": "Zweck und Frequenz",
      "titleEn": "Purpose and Frequency",
      "description": "Die oberste Leitung bewertet zu geplanten Intervallen, ob das ISMS weiterhin geeignet, angemessen und wirksam ist. Die Bewertung kann in einer oder mehreren abgestimmten Sitzungen erfolgen, sofern alle erforderlichen Eingaben und Ergebnisse nachvollziehbar abgedeckt werden. Termine, Beteiligte, betrachteter Zeitraum und Unterlagen werden festgehalten. Eine allgemeine jährliche Mindestfrequenz wird nicht als ISO-Vorgabe behauptet.",
      "descriptionEn": "Top management reviews at planned intervals whether the ISMS remains suitable, adequate and effective. Review may take place in one or several coordinated sessions if all required inputs and results are traceably covered. Dates, participants, the period reviewed and supporting information are recorded. No universal annual minimum frequency is presented as an ISO requirement.",
      "reason": "Mehrere Sitzungen können eine Bewertung bilden, benötigen aber eine nachvollziehbare Gesamtabdeckung.",
      "reasonEn": "Several sessions can constitute a review, but require traceable overall coverage.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 9.3.1-9.3.3"
      ]
    },
    {
      "id": "d04-c02",
      "title": "Status früherer Maßnahmen",
      "titleEn": "Status of Previous Actions",
      "description": "Frühere Beschlüsse werden anhand ihres Umsetzungsstands und vorhandener Nachweise überprüft. Überfällige oder unwirksame Maßnahmen erhalten eine Entscheidung zu weiterer Bearbeitung, Ressourcen und Termin. Eine bloße Übernahme der alten Maßnahmenliste ohne Bewertung gilt nicht als Nachverfolgung.",
      "descriptionEn": "Previous decisions are reviewed against implementation status and available evidence. Overdue or ineffective actions receive a decision on further work, resources and timing. Merely copying the previous action list without evaluation is not follow-up.",
      "reason": "Unerledigte Beschlüsse verlieren sonst ihre Wirkung.",
      "reasonEn": "Unresolved decisions otherwise lose their effect.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 9.3.2(a)"
      ]
    },
    {
      "id": "d04-c03",
      "title": "Änderungen im Umfeld",
      "titleEn": "Changes in Context",
      "description": "Die Leitung betrachtet Änderungen relevanter interner und externer Themen sowie der Anforderungen interessierter Parteien. Dazu gehören wesentliche Änderungen an Leistungen, Organisation, Abhängigkeiten und verbindlichen Anforderungen. Die Relevanz des Klimawandels und einschlägige Anforderungen werden bei veränderten Umständen erneut betrachtet. Die Auswirkungen auf das ISMS werden festgehalten.",
      "descriptionEn": "Management considers changes to relevant internal and external issues and interested-party requirements. This includes significant changes to services, organisation, dependencies and binding duties. Climate-change relevance and pertinent requirements are reconsidered when circumstances change. Effects on the ISMS are recorded.",
      "reason": "Kontextänderungen können bisher angemessene Schutzentscheidungen überholen.",
      "reasonEn": "Context changes can invalidate previously appropriate protection decisions.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 9.3.2(b)-(c); 4.1-4.2; Amd 1:2024"
      ]
    },
    {
      "id": "d04-c04",
      "title": "Kennzahlen und Wirksamkeit",
      "titleEn": "Metrics and Effectiveness",
      "description": "Die Bewertung umfasst Entwicklungen bei Nichtkonformitäten und Korrekturmaßnahmen, Überwachungs- und Messergebnissen, Auditergebnissen sowie der Erreichung der Informationssicherheitsziele. Ergebnisse werden mit ihrer Datenbasis und wesentlichen Einschränkungen dargestellt. Eine einzelne Kennzahl oder ein Dashboard ersetzt nicht die Bewertung dieser Themen und ihrer Bedeutung.",
      "descriptionEn": "Review includes trends in nonconformities and corrective actions, monitoring and measurement results, audit results and achievement of information security objectives. Results state their data basis and significant limitations. A single metric or dashboard does not replace evaluation of these topics and their significance.",
      "reason": "Fehlende Trend- oder Zielinformationen können eine Verschlechterung verbergen.",
      "reasonEn": "Missing trend or objective information can conceal deterioration.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 9.3.2(d); 9.1"
      ]
    },
    {
      "id": "d04-c05",
      "title": "Vorfälle und Rückmeldungen",
      "titleEn": "Incidents and Feedback",
      "description": "Rückmeldungen interessierter Parteien werden auf Bedeutung und Handlungsbedarf geprüft. Relevante Sicherheitsvorfälle und Beschwerden fließen mit Ursachen, Folgen und Erkenntnissen ein. Nicht jeder Vorfall ist automatisch eine Nichtkonformität; ein Verstoß gegen eine konkrete Anforderung wird gesondert bewertet. Erforderliche dringliche Maßnahmen warten nicht auf die nächste Managementbewertung.",
      "descriptionEn": "Feedback from interested parties is assessed for significance and required action. Relevant security incidents and complaints contribute causes, consequences and lessons. Not every incident is automatically a nonconformity; failure to fulfil a specific requirement is assessed separately. Necessary urgent action does not wait for the next management review.",
      "reason": "Ein Vorfall und ein Normverstoß können zusammenfallen, sind aber nicht gleichbedeutend.",
      "reasonEn": "An incident and a conformity failure may coincide but are not synonymous.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 9.3.2(e); 10.2; A.5.27"
      ]
    },
    {
      "id": "d04-c06",
      "title": "Risiken und Chancen",
      "titleEn": "Risks and Opportunities",
      "description": "Die Leitung betrachtet Ergebnisse der Risikobewertung und den Status des Risikobehandlungsplans. Sie prüft neue oder veränderte Risiken, wesentliche Restrisiken, offene Entscheidungen und Verbesserungsmöglichkeiten. Chancen zur Verbesserung werden auch ohne vorherige Nichtkonformität betrachtet. Entscheidungsbedarf und zugehörige Verantwortlichkeiten werden konkret benannt.",
      "descriptionEn": "Management considers risk assessment results and the status of the risk treatment plan. It examines new or changed risks, significant residual risks, outstanding decisions and improvement opportunities. Opportunities are considered even without a preceding nonconformity. Decision needs and associated responsibilities are identified specifically.",
      "reason": "Ohne aktuelle Risikoinformationen können Ressourcen am Bedarf vorbeigeplant werden.",
      "reasonEn": "Without current risk information, resources may be allocated away from actual needs.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 9.3.2(f)-(g); 6.1"
      ]
    },
    {
      "id": "d04-c07",
      "title": "Entscheidungen und Ressourcen",
      "titleEn": "Decisions and Resources",
      "description": "Die Ergebnisse enthalten Entscheidungen über Verbesserungsmöglichkeiten und erforderliche Änderungen am ISMS. Soweit nötig werden Ressourcen, Verantwortliche, Zieltermine und Erfolgskriterien zugewiesen. Auch eine begründete Entscheidung gegen eine vorgeschlagene Maßnahme wird festgehalten. Das Protokoll darf aus einer Diskussion keinen bereits gefassten Beschluss erfinden.",
      "descriptionEn": "Results include decisions on improvement opportunities and necessary changes to the ISMS. Where needed, allocate resources, owners, due dates and success criteria. Also record justified decisions not to proceed with proposed actions. Minutes must not turn a discussion into an approval that was never given.",
      "reason": "Verbindliche Entscheidungen benötigen mehr als eine Zusammenfassung der Diskussion.",
      "reasonEn": "Actionable decisions require more than a summary of discussion.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 9.3.3; 10.1"
      ]
    },
    {
      "id": "d04-c08",
      "title": "Protokoll und Nachverfolgung",
      "titleEn": "Minutes and Follow-up",
      "description": "Die Ergebnisse werden als gelenkte dokumentierte Information aufbewahrt. Der Nachweis nennt bewertete Themen, maßgebliche Unterlagen, Schlussfolgerungen und Beschlüsse; Maßnahmen werden mit Verantwortlichen und Terminen verknüpft. Ein Sitzungsprotokoll ist eine geeignete Form, aber nicht die einzige. Ein ausgefülltes Formular belegt nur tatsächlich durchgeführte Bewertungen und getroffene Entscheidungen.",
      "descriptionEn": "Results are retained as controlled documented information. Evidence identifies topics reviewed, relevant records, conclusions and decisions; actions link to owners and deadlines. Meeting minutes are a suitable form, but not the only one. A completed form records only reviews actually performed and decisions actually made.",
      "reason": "Ein Protokoll ohne nachvollziehbare Eingaben belegt die Bewertung nur unvollständig.",
      "reasonEn": "Minutes without traceable inputs provide incomplete evidence of review.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 9.3.3; 7.5"
      ]
    }
  ],
  "D05": [
    {
      "id": "d05-c01",
      "title": "Erfassung von Nichtkonformitäten",
      "titleEn": "Recording Nonconformities",
      "description": "Eine festgestellte Nichterfüllung einer Anforderung wird mit Kennung, betroffener Anforderung, Sachverhalt und objektivem Nachweis erfasst. Quelle, Datum, betroffener Bereich und Zuständigkeit werden festgehalten. Verbesserungsvorschläge und Ereignisse ohne nachgewiesene Anforderungsverletzung werden kenntlich davon getrennt, können aber weitere Prüfung auslösen.",
      "descriptionEn": "A failure to fulfil a requirement is recorded with an identifier, the requirement concerned, the facts and objective evidence. Record source, date, affected area and ownership. Improvement suggestions and events without an established requirement failure are identified separately but may trigger further investigation.",
      "reason": "Nicht jede Beobachtung rechtfertigt die Einstufung als Nichtkonformität.",
      "reasonEn": "Not every observation justifies classification as a nonconformity.",
      "whenRequired": "Bei einer festgestellten Nichtkonformität.",
      "whenRequiredEn": "When a nonconformity is identified.",
      "sources": [
        "ISO/IEC 27001:2022 10.2"
      ]
    },
    {
      "id": "d05-c02",
      "title": "Sofortmaßnahmen",
      "titleEn": "Immediate Actions",
      "description": "Die verantwortliche Funktion reagiert auf die Nichtkonformität, kontrolliert und korrigiert sie soweit anwendbar und behandelt ihre Folgen. Erforderliche Sofortmaßnahmen werden umgesetzt und dokumentiert. Zuständigkeit, Zeitpunkt und Ergebnis werden festgehalten. Eine Korrektur des unmittelbaren Fehlers ist von einer Maßnahme zur Verhinderung des Wiederauftretens zu unterscheiden.",
      "descriptionEn": "The responsible function responds to the nonconformity, controls and corrects it where applicable, and deals with its consequences. Necessary immediate actions are implemented and documented. Record ownership, timing and results. Correcting the immediate fault is distinct from action to prevent recurrence.",
      "reason": "Die Beseitigung eines Symptoms kann die zugrunde liegende Ursache bestehen lassen.",
      "reasonEn": "Removing a symptom can leave its underlying cause intact.",
      "whenRequired": "Bei Feststellung, entsprechend den Auswirkungen.",
      "whenRequiredEn": "On identification, according to its effects.",
      "sources": [
        "ISO/IEC 27001:2022 10.2(a)"
      ]
    },
    {
      "id": "d05-c03",
      "title": "Ursachenanalyse",
      "titleEn": "Root Cause Analysis",
      "description": "Die Nichtkonformität wird analysiert und ihre Ursachen werden bestimmt. Es wird geprüft, ob ähnliche Nichtkonformitäten bestehen oder an anderer Stelle auftreten könnten. Umfang und Vorgehen richten sich nach Bedeutung und Komplexität; eine bestimmte Methode wie Five Whys ist nicht zwingend. Ergebnis und Bedarf für ursachenbezogene Maßnahmen werden nachvollziehbar dokumentiert.",
      "descriptionEn": "Analyse the nonconformity and determine its causes. Check whether similar nonconformities exist or could occur elsewhere. Depth and approach reflect significance and complexity; no particular method such as Five Whys is mandatory. Record conclusions and the need for cause-related action traceably.",
      "reason": "Eine lokale Korrektur kann denselben Fehler in anderen Bereichen unentdeckt lassen.",
      "reasonEn": "A local correction can leave the same failure undetected elsewhere.",
      "whenRequired": "Bei Bewertung einer Nichtkonformität.",
      "whenRequiredEn": "When evaluating a nonconformity.",
      "sources": [
        "ISO/IEC 27001:2022 10.2(b)"
      ]
    },
    {
      "id": "d05-c04",
      "title": "Korrekturmaßnahmen",
      "titleEn": "Corrective Actions",
      "description": "Aus der Ursachenbewertung werden notwendige Korrekturmaßnahmen abgeleitet und umgesetzt. Jede Maßnahme benennt Ursache, angestrebtes Ergebnis, Verantwortlichen und Termin; ihr Umfang ist den Auswirkungen angemessen. Wird keine zusätzliche ursachenbezogene Maßnahme für notwendig gehalten, wird diese Schlussfolgerung begründet. Erforderliche Korrekturen und verbindliche Pflichten bleiben bestehen.",
      "descriptionEn": "Necessary corrective actions are derived from the cause evaluation and implemented. Each action identifies the cause, intended outcome, owner and deadline, with scope proportionate to the effects. Where no additional cause-related action is considered necessary, justify that conclusion. Required corrections and binding duties remain in force.",
      "reason": "Maßnahmen ohne Ursachenbezug können Aufwand erzeugen, ohne Wiederholung zu verhindern.",
      "reasonEn": "Actions unrelated to the cause can consume effort without preventing recurrence.",
      "whenRequired": "Nach Bewertung des Maßnahmenbedarfs.",
      "whenRequiredEn": "After evaluating the need for action.",
      "sources": [
        "ISO/IEC 27001:2022 10.2(b)-(c)"
      ]
    },
    {
      "id": "d05-c05",
      "title": "Wirksamkeitsprüfung",
      "titleEn": "Effectiveness Verification",
      "description": "Nach Umsetzung wird geprüft, ob die Korrekturmaßnahme die beabsichtigte Wirkung erzielt. Methode, Zeitpunkt, Prüfer und Ergebnis werden dokumentiert. Die Prüfung berücksichtigt einen geeigneten Beobachtungszeitraum. Ein Arbeitsticket mit Status erledigt genügt nicht als Wirksamkeitsnachweis; unwirksame Maßnahmen führen zur erneuten Bewertung und Nacharbeit.",
      "descriptionEn": "After implementation, check whether corrective action achieves its intended effect. Record method, timing, reviewer and results. Allow an appropriate observation period. A work ticket marked done is not sufficient evidence of effectiveness; ineffective action leads to reassessment and rework.",
      "reason": "Der Abschluss einer Aufgabe beweist keine nachhaltige Fehlerbeseitigung.",
      "reasonEn": "Completion of a task does not prove lasting elimination of a failure.",
      "whenRequired": "Nach Umsetzung zu einem geeigneten Prüfzeitpunkt.",
      "whenRequiredEn": "At an appropriate verification point after implementation.",
      "sources": [
        "ISO/IEC 27001:2022 10.2(d), (g)"
      ]
    },
    {
      "id": "d05-c06",
      "title": "Aktualisierung von Risiken/Kontrollen",
      "titleEn": "Updating Risks/Controls",
      "description": "Die Organisation prüft, ob Änderungen am ISMS erforderlich sind, und setzt sie gegebenenfalls um. Betroffene Risikobewertungen, Kontrollen, SoA, Verfahren und Kompetenzanforderungen werden konsistent angepasst. Änderungen und ihre Auswirkungen werden nachvollziehbar dokumentiert; eine Aktualisierung aller Unterlagen ohne tatsächlichen Änderungsbedarf ist nicht gefordert.",
      "descriptionEn": "The organisation determines whether changes to the ISMS are needed and makes them where necessary. Affected risk assessments, controls, the SoA, procedures and competence requirements are updated consistently. Changes and effects are documented traceably; all records need not be rewritten where no change is needed.",
      "reason": "Neue Erkenntnisse müssen die tatsächlich betroffenen Regelungen erreichen.",
      "reasonEn": "New findings must reach the arrangements actually affected.",
      "whenRequired": "Wenn die Bearbeitung Änderungsbedarf ergibt.",
      "whenRequiredEn": "Where handling identifies a need for change.",
      "sources": [
        "ISO/IEC 27001:2022 10.2(e)"
      ]
    },
    {
      "id": "d05-c07",
      "title": "Register der Maßnahmen",
      "titleEn": "Register of Actions",
      "description": "Aufzeichnungen zeigen Art der Nichtkonformität, nachfolgende Maßnahmen und Ergebnisse der Korrekturmaßnahmen. Ein gelenktes Register kann diese Nachweise verbinden; auch geeignete bestehende Systeme sind zulässig. Status, Termine, Verantwortliche und Belegverweise bleiben aktuell. Separate Register je Framework oder ein bestimmtes CAPA-Produkt sind nicht vorgeschrieben.",
      "descriptionEn": "Records show the nature of the nonconformity, subsequent actions and results of corrective action. A controlled register can connect this evidence; suitable existing systems are also acceptable. Status, dates, owners and evidence references remain current. Separate registers per framework or a particular CAPA product are not required.",
      "reason": "Ein Statusregister ohne Maßnahmen- und Ergebnisnachweise bleibt unvollständig.",
      "reasonEn": "A status register without action and result evidence remains incomplete.",
      "whenRequired": "Während Bearbeitung und nach Abschluss aufbewahren.",
      "whenRequiredEn": "Maintain during handling and retain after closure.",
      "sources": [
        "ISO/IEC 27001:2022 10.2(f)-(g); 7.5"
      ]
    },
    {
      "id": "d05-c08",
      "title": "Kontinuierliche Verbesserung (KVP)",
      "titleEn": "Continual Improvement",
      "description": "Verbesserungsmöglichkeiten werden aus Bewertungen, Messungen, Audits, Erfahrungen und Vorschlägen ermittelt. Geeignete Verbesserungen werden priorisiert, mit Verantwortlichen umgesetzt und auf ihren Beitrag zur Eignung, Angemessenheit und Wirksamkeit des ISMS geprüft. Verbesserung setzt keine vorherige Nichtkonformität voraus. Nicht umgesetzte Ideen werden nicht als abgeschlossene Verbesserung ausgewiesen.",
      "descriptionEn": "Improvement opportunities are identified from reviews, measurement, audits, experience and suggestions. Suitable improvements are prioritised, implemented with assigned owners and assessed for their contribution to ISMS suitability, adequacy and effectiveness. Improvement does not require a preceding nonconformity. Unimplemented ideas are not reported as completed improvements.",
      "reason": "Fehlerkorrektur allein schöpft mögliche Verbesserungen nicht aus.",
      "reasonEn": "Correcting failures alone does not capture all improvement opportunities.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 10.1; 9.3.3"
      ]
    }
  ],
  "D06": [
    {
      "id": "d06-c01",
      "title": "Bekenntnis der Leitung",
      "titleEn": "Management Commitment",
      "description": "Die Leitung bestätigt die Sicherheitsleitlinie, ihre strategische Ausrichtung und die Verantwortung für deren Umsetzung. Freigabedatum und verantwortliche Leitung werden dokumentiert. Eine bestehende Informationssicherheitspolitik (p01) kann dieselbe Funktion erfüllen, wenn die erforderlichen Inhalte vorhanden sind.",
      "descriptionEn": "Management approves the security policy, its strategic direction and responsibility for implementation. The approval date and accountable management are recorded. An existing information security policy (p01) may fulfil the same function when it contains the necessary material.",
      "reason": "Eine BSI-Bezeichnung allein macht keine zusätzliche rechtlich eigenständige Datei erforderlich.",
      "reasonEn": "A BSI-specific label alone does not require a separate legally distinct file.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 3.4.1–3.4.3"
      ]
    },
    {
      "id": "d06-c02",
      "title": "Stellenwert und Ziele",
      "titleEn": "Significance and Objectives",
      "description": "Die Leitlinie erläutert verständlich, welche Geschäftsaufgaben und Informationen geschützt werden, welche übergeordneten Ziele gelten und wie die Sicherheitsstrategie diese unterstützt. Aussagen zur Erfolgskontrolle und Durchsetzung werden aufgenommen; konkrete messbare Ziele können im gemeinsamen Zielregister D38 stehen.",
      "descriptionEn": "The policy explains which business activities and information are protected, the overarching objectives and how the security strategy supports them. It includes commitments to enforcement and evaluation; specific measurable objectives may reside in the shared D38 objectives register.",
      "reason": "Allgemeine Schutzversprechen ohne Geschäftsbezug geben keine brauchbare Richtung vor.",
      "reasonEn": "Generic promises without business context provide little usable direction.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 3.4.3"
      ]
    },
    {
      "id": "d06-c03",
      "title": "Geltungsbereich",
      "titleEn": "Scope",
      "description": "Der Geltungsbereich benennt die erfassten Organisationsteile und den Informationsverbund. Die darin betrachteten Geschäftsaufgaben und Prozesse werden vollständig einschließlich relevanter Schnittstellen berücksichtigt. Eine Abgrenzung wird mit D03 und der Strukturanalyse abgestimmt; eine organisatorische Teilgrenze darf abhängige Leistungen nicht unsichtbar machen.",
      "descriptionEn": "The scope identifies the organisational units and information domain covered. The business activities and processes within that scope are considered in full, including relevant interfaces. Boundaries are reconciled with D03 and the structure analysis; an organisational boundary must not hide dependent services.",
      "reason": "Unklare Grenzen können Verantwortungs- und Schutzlücken erzeugen.",
      "reasonEn": "Unclear boundaries can create gaps in accountability and protection.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 3.3.4, 3.4.3"
      ]
    },
    {
      "id": "d06-c04",
      "title": "Sicherheitsorganisation",
      "titleEn": "Security Organisation",
      "description": "Die Leitlinie beschreibt die Sicherheitsorganisation mit Zuständigkeiten, Befugnissen, Ressourcen und erreichbaren Ansprechpartnern. Die Rolle des Informationssicherheitsbeauftragten wird benannt und mit der Leitung sowie Fach- und Betriebsverantwortlichen verbunden. Detaillierte Aufgaben können in verknüpften Rollenbeschreibungen stehen.",
      "descriptionEn": "The policy describes the security organisation, responsibilities, authority, resources and accessible contacts. It identifies the Information Security Officer and their relationship with management, business owners and operations. Detailed duties may be held in linked role descriptions.",
      "reason": "Ein Rollenname ohne Befugnisse und verfügbare Mittel bleibt wirkungslos.",
      "reasonEn": "A role name without authority and available resources is ineffective.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 3.4.3, 4.2–4.4"
      ]
    },
    {
      "id": "d06-c05",
      "title": "Verbindlichkeit und Kommunikation",
      "titleEn": "Bindingness and Communication",
      "description": "Nach Freigabe werden Geltung, Erwartungen und Zugangsweg zur aktuellen Leitlinie bekannt gemacht. Neue Beschäftigte erhalten die erforderliche Erläuterung vor Zugang zur Informationsverarbeitung. Vertrauliche operative Einzelheiten werden in geschützt zugängliche Anlagen ausgelagert, ohne die allgemeinen Erwartungen unzugänglich zu machen.",
      "descriptionEn": "After approval, applicability, expectations and access to the current policy are communicated. New personnel receive the necessary explanation before access to information processing. Confidential operational details are placed in protected annexes without making the general expectations inaccessible.",
      "reason": "Nur gespeicherte, aber unbekannte Regeln können das Verhalten nicht steuern.",
      "reasonEn": "Rules that are stored but unknown cannot guide behaviour.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 3.4.4"
      ]
    },
    {
      "id": "d06-c06",
      "title": "Fortschreibung",
      "titleEn": "Maintenance",
      "description": "Der Dokumentverantwortliche prüft die Leitlinie in festgelegten Abständen und bei wesentlichen Änderungen von Aufgaben, Organisation, Systemen oder Sicherheitslage. BSI 200-2 empfiehlt spätestens alle zwei Jahre eine erneute Betrachtung; dies ist keine allgemeine gesetzliche Frist. Strengere tatsächlich geltende Vorgaben, insbesondere die jährliche Überprüfung der übergreifenden Politik nach CIR bei erfassten Einrichtungen, bleiben maßgeblich.",
      "descriptionEn": "The document owner reviews the policy at defined intervals and after material changes to activities, organisation, systems or the security situation. BSI 200-2 recommends reconsideration at least every two years; this is not a universal statutory deadline. Stricter applicable requirements, including the CIR annual review of the overarching policy for covered entities, remain controlling.",
      "reason": "Unterschiedliche Prüfintervalle müssen abgestimmt werden, statt einander stillschweigend zu ersetzen.",
      "reasonEn": "Different review intervals must be reconciled rather than silently replacing one another.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 3.4.5",
        "Implementing Regulation (EU) 2024/2690 Annex 1.1.2, where applicable"
      ]
    }
  ],
  "D07": [
    {
      "id": "d07-c01",
      "title": "Geschäftsprozesse und Anwendungen",
      "titleEn": "Business Processes and Applications",
      "description": "Die Strukturanalyse erfasst die zum Informationsverbund gehörenden wesentlichen Geschäftsprozesse, Aufgaben, Informationen und unterstützenden Anwendungen. Kennung, Beschreibung, Verantwortliche und Abhängigkeiten werden dokumentiert. Neben Kernprozessen werden notwendige unterstützende Prozesse einbezogen; bereits vorhandene Prozess- und Inventardaten werden nach Qualitätsprüfung wiederverwendet.",
      "descriptionEn": "The structure analysis records the significant business processes, activities, information and supporting applications within the information domain. It documents identifiers, descriptions, owners and dependencies. Necessary supporting processes are included alongside core activities; existing process and inventory data are reused after checking quality.",
      "reason": "Eine reine Liste besonders kritischer Anwendungen lässt wichtige Abhängigkeiten aus.",
      "reasonEn": "A list limited to particularly critical applications omits important dependencies.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 8.1.2–8.1.3"
      ]
    },
    {
      "id": "d07-c02",
      "title": "IT-Systeme, ICS/OT und Netze",
      "titleEn": "IT Systems, ICS/OT and Networks",
      "description": "Die zugehörigen IT-Systeme, industriellen Steuerungssysteme, sonstigen informationsverarbeitenden Geräte sowie Netze und Verbindungen werden erfasst. Der Netzplan zeigt relevante interne und externe Schnittstellen und wird mit Anwendungen und Verantwortlichkeiten verknüpft. Ausgelagerte oder virtuelle Komponenten werden entsprechend der tatsächlichen Leistung und Zuständigkeit berücksichtigt.",
      "descriptionEn": "Associated IT systems, industrial control systems, other information-processing devices, networks and connections are recorded. The network model shows relevant internal and external interfaces and links them to applications and responsibilities. Outsourced or virtual components are considered according to the actual service and allocation of responsibility.",
      "reason": "Physischer Besitz ist keine vollständige Abgrenzung der technischen Abhängigkeiten.",
      "reasonEn": "Physical ownership does not fully define technical dependencies.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 8.1.4–8.1.7, 8.3.5"
      ]
    },
    {
      "id": "d07-c03",
      "title": "Räume und Standorte",
      "titleEn": "Rooms and Sites",
      "description": "Standorte, Gebäude und Räume werden mit den dort verarbeiteten Informationen oder betriebenen Systemen verknüpft. Auch Bereiche mit Papierunterlagen oder relevanten Infrastrukturabhängigkeiten werden betrachtet. Bei extern betriebenen Standorten werden verfügbare Informationen und die Grenze eigener Zuständigkeit festgehalten.",
      "descriptionEn": "Sites, buildings and rooms are linked to the information processed or systems operated there. Areas holding paper records or relevant infrastructure dependencies are also considered. For externally operated sites, available information and the boundaries of the organisation’s responsibility are recorded.",
      "reason": "Eine reine Serverraumliste übersieht andere Orte schutzbedürftiger Verarbeitung.",
      "reasonEn": "A server-room-only list overlooks other locations of sensitive processing.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 8.1.8"
      ]
    },
    {
      "id": "d07-c04",
      "title": "Gruppierung und Bereinigung",
      "titleEn": "Grouping and Consolidation",
      "description": "Objekte werden sinnvoll zusammengefasst, wenn Typ, Aufgaben, Rahmenbedingungen und Schutzbedarf ausreichend übereinstimmen. Bei technischen Gruppen werden Konfiguration und Einbindung berücksichtigt. Gruppenmitglieder, Anzahl, Kriterien und Ausnahmen bleiben nachvollziehbar; abweichende Schutzanforderungen dürfen durch die Gruppierung nicht verschwinden.",
      "descriptionEn": "Objects are grouped sensibly where type, function, operating conditions and protection needs sufficiently align. Technical grouping considers configuration and connectivity. Members, count, criteria and exceptions remain traceable; grouping must not erase differing protection requirements.",
      "reason": "Optisch ähnliche Geräte können unterschiedliche Schutzbedarfe und Angriffsflächen haben.",
      "reasonEn": "Visually similar devices may have different protection needs and attack surfaces.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 8.1.1"
      ]
    },
    {
      "id": "d07-c05",
      "title": "Aktualität",
      "titleEn": "Currency",
      "description": "Verantwortliche aktualisieren die Strukturanalyse bei relevanten Änderungen und überprüfen sie in festgelegten Abständen gegen die tatsächliche Umgebung. Neue, geänderte oder entfernte Objekte sowie veränderte Abhängigkeiten werden in Schutzbedarf, Modellierung und Maßnahmenplanung übernommen. Historische Stände bleiben soweit erforderlich nachvollziehbar.",
      "descriptionEn": "Owners update the structure analysis after relevant changes and reconcile it with the actual environment at defined intervals. New, changed or removed objects and dependencies feed into protection needs, modelling and action planning. Historical states remain traceable where necessary.",
      "reason": "Aktuelle Einzelinventare reichen nicht aus, wenn ihre Beziehungen veraltet bleiben.",
      "reasonEn": "Current individual inventories are insufficient if relationships remain outdated.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 8.1, 10"
      ]
    }
  ],
  "D08": [
    {
      "id": "d08-c01",
      "title": "Schadensszenarien und Kategorien",
      "titleEn": "Damage Scenarios and Categories",
      "description": "Die Organisation definiert nachvollziehbare Schadensschwellen für die Kategorien normal, hoch und sehr hoch oder eine begründet angepasste Skala. Bei abweichenden Kategorien wird die Zuordnung zu hohem und sehr hohem Schutzbedarf dokumentiert. Auswirkungen auf Rechte, Personen, Aufgaben, Reputation, Finanzen und weitere relevante Bereiche werden berücksichtigt.",
      "descriptionEn": "The organisation defines understandable impact thresholds for normal, high and very high protection needs or a justified adapted scale. Where categories differ, their relationship to high and very high protection needs is recorded. Effects on rights, people, business activities, reputation, finances and other relevant areas are considered.",
      "reason": "Ohne organisationsbezogene Schwellen werden identische Schäden uneinheitlich bewertet.",
      "reasonEn": "Without organisation-specific thresholds, identical harm may receive inconsistent ratings.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 8.2.1"
      ]
    },
    {
      "id": "d08-c02",
      "title": "VIV-Grundwerte",
      "titleEn": "CIA Objectives",
      "description": "Schutzbedarfe werden getrennt für Vertraulichkeit, Integrität und Verfügbarkeit mit den Fachverantwortlichen bestimmt. Bewertet werden die möglichen Schäden einer Beeinträchtigung, nicht nur vorhandene Kontrollen oder Eintrittswahrscheinlichkeiten. Bei Verfügbarkeit werden erforderliche zeitliche Grenzen erläutert. Eine einzige Gesamtstufe darf die Einzelwerte nicht ersetzen.",
      "descriptionEn": "Business owners determine protection needs separately for confidentiality, integrity and availability. Assessment considers potential harm from impairment, not merely existing controls or likelihood. Availability assessment explains relevant time constraints. A single aggregate rating must not replace the individual ratings.",
      "reason": "Schutzbedarf und die Bewertung eines konkreten Risikos beantworten unterschiedliche Fragen.",
      "reasonEn": "Protection needs and assessment of a specific risk answer different questions.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 8.2.1–8.2.3"
      ]
    },
    {
      "id": "d08-c03",
      "title": "Vererbung und Kumulation",
      "titleEn": "Inheritance and Cumulation",
      "description": "Der Schutzbedarf wird über nachvollziehbare Abhängigkeiten von Prozessen und Informationen auf unterstützende Objekte übertragen. Das Maximumprinzip, mögliche kumulierte Schäden und begründete Verteilungseffekte werden je Grundwert geprüft. Eine Redundanz darf nur dann zu einer abweichenden Einstufung führen, wenn die angenommene Ausweichwirkung und gemeinsame Abhängigkeiten untersucht wurden.",
      "descriptionEn": "Protection needs are inherited through traceable dependencies from processes and information to supporting objects. The maximum principle, potential cumulative harm and justified distribution effects are examined for each security objective. Redundancy supports a different rating only where the assumed fallback effect and shared dependencies have been assessed.",
      "reason": "Mehrere gering eingestufte Dienste können gemeinsam einen hohen Ausfallschaden erzeugen.",
      "reasonEn": "Several individually lower-rated services can together create high outage impact.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 8.2.2"
      ]
    },
    {
      "id": "d08-c04",
      "title": "Begründung und Fortschreibung",
      "titleEn": "Justification and Maintenance",
      "description": "Jede Einstufung enthält betroffene Objekte, Schadensannahmen, Begründung, fachlich verantwortliche Person, Datum und relevante Abhängigkeiten. Änderungen von Nutzung, Daten, Diensten oder Auswirkungsannahmen lösen eine Neubewertung aus. Ergebnisse werden mit D07, D09 und der Risikoanalyse abgestimmt, ohne frühere Begründungen unkenntlich zu überschreiben.",
      "descriptionEn": "Each rating records affected objects, harm assumptions, rationale, accountable business owner, date and relevant dependencies. Changes in use, data, services or impact assumptions trigger reassessment. Results are reconciled with D07, D09 and risk assessment without obscuring earlier rationale.",
      "reason": "Ein Zahlen- oder Kategorienwert allein lässt sich nicht fachlich prüfen.",
      "reasonEn": "A number or category alone cannot be substantively reviewed.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 8.2, 10"
      ]
    }
  ],
  "D09": [
    {
      "id": "d09-c01",
      "title": "Bausteinzuordnung",
      "titleEn": "Module Assignment",
      "description": "Für jedes relevante Zielobjekt oder jede geeignete Objektgruppe werden die passenden Bausteine und deren Fassung zugeordnet. Relevanz, Zuordnungsbegründung und abgedeckter Umfang bleiben sichtbar. Auslagerungen und geteilte Zuständigkeiten werden modelliert; fehlende geeignete Bausteine lösen eine ergänzende Risikobetrachtung aus.",
      "descriptionEn": "Relevant target objects or suitable groups are mapped to appropriate modules and versions. Relevance, mapping rationale and covered scope remain visible. Outsourcing and shared responsibility are modelled; missing suitable modules trigger supplementary risk assessment.",
      "reason": "Ein Mapping ohne Version und Zielobjekt belegt keine vollständige Abdeckung.",
      "reasonEn": "A mapping without a version and target object does not demonstrate complete coverage.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 8.3.2–8.3.7"
      ]
    },
    {
      "id": "d09-c02",
      "title": "Soll-Ist-Vergleich",
      "titleEn": "Target-Actual Comparison",
      "description": "Je Anforderung werden tatsächliche Umsetzung, geeignete Nachweise und offene Teile erfasst. Der Status entbehrlich wird konkret begründet; alternative Maßnahmen müssen die maßgeblichen Gefährdungen angemessen behandeln. Ein nicht umgesetztes Erfordernis wird nicht durch bloße Risikoakzeptanz entbehrlich. Vollständige Erfüllung wird erst bei geeigneter, wirksamer und angemessener Umsetzung angegeben.",
      "descriptionEn": "Each requirement records actual implementation, suitable evidence and outstanding elements. A dispensable status requires a specific rationale; alternative safeguards must appropriately address the relevant threats. An unmet requirement does not become dispensable merely through risk acceptance. Fulfilment is recorded only where implementation is suitable, effective and appropriate.",
      "reason": "Entbehrlichkeit und fehlende Umsetzung sind keine austauschbaren Zustände.",
      "reasonEn": "Dispensability and missing implementation are not interchangeable states.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 8.4.2"
      ]
    },
    {
      "id": "d09-c03",
      "title": "Basis-, Standard- und Kernabsicherung",
      "titleEn": "Basic, Standard and Core Security",
      "description": "Die gewählte Vorgehensweise und ihr Geltungsbereich werden vor der Bewertung festgelegt. Basis-, Kern- und Standard-Absicherung unterscheiden sich im Vorgehen und Umfang; sie sind keine frei austauschbaren Bewertungsetiketten. Basis-Absicherung allein wird nicht als vollständige ISO-27001-Zertifizierungsgrundlage dargestellt. Für Kern-Absicherung werden die ausgewählten kritischen Bereiche einschließlich notwendiger Abhängigkeiten erfasst.",
      "descriptionEn": "The selected approach and its scope are established before assessment. Basic, core and standard security approaches differ in method and coverage; they are not interchangeable grading labels. Basic security alone is not presented as a complete basis for ISO 27001 certification. Core security includes selected critical areas and their necessary dependencies.",
      "reason": "Eine reduzierte Erstabsicherung darf nicht als vollständiges Sicherheitskonzept ausgegeben werden.",
      "reasonEn": "Reduced initial protection must not be presented as a complete security concept.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 3.3, Chapters 6–8"
      ]
    },
    {
      "id": "d09-c04",
      "title": "Dokumentation und Aktualität",
      "titleEn": "Documentation and Currency",
      "description": "Prüfdatum, Prüfer, Ansprechpartner, Objekt, Bausteinfassung, Ergebnis, Begründung und Nachweis werden aufgezeichnet. Offene Anforderungen erhalten Verknüpfungen zum Realisierungsplan. Relevante Änderungen an Umgebung oder Anforderungen lösen die Aktualisierung aus; regelmäßige Wiederholungen werden geplant. Ein früheres Ergebnis wird nicht ungeprüft auf neue Fassungen übertragen.",
      "descriptionEn": "Records identify the assessment date, assessor, contacts, object, module version, result, rationale and evidence. Open requirements link to the implementation plan. Relevant changes to the environment or requirements trigger updates, with repeat assessments planned. Earlier results are not transferred to new versions without review.",
      "reason": "Veraltete Zuordnungen können trotz unverändertem grünen Status neue Anforderungen verdecken.",
      "reasonEn": "Outdated mappings can hide new requirements behind an unchanged green status.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 8.4.3, 10"
      ]
    }
  ],
  "D10": [
    {
      "id": "d10-c01",
      "title": "Priorisierung der Maßnahmen",
      "titleEn": "Prioritisation of Measures",
      "description": "Offene Anforderungen aus Grundschutz-Check und Risikoanalyse werden in einer gemeinsamen Maßnahmenplanung priorisiert. Schutzbedarf, Risiko, verbindliche Fristen, Voraussetzungen und erwartete Schutzwirkung werden berücksichtigt. Die Grundschutz-Priorität elementarer Basis-Anforderungen wird beachtet; notwendige technische Reihenfolgen und begründete Abweichungen werden dokumentiert.",
      "descriptionEn": "Open requirements from the baseline check and risk assessment are prioritised in a shared action plan. Protection needs, risk, binding deadlines, prerequisites and expected protection are considered. The priority of elementary basic requirements is respected; necessary technical sequencing and justified departures are recorded.",
      "reason": "Dringlichkeit allein ersetzt keine Prüfung, ob eine Maßnahme technisch von einer anderen abhängt.",
      "reasonEn": "Urgency alone does not establish whether a measure technically depends on another.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 9.1, 9.3"
      ]
    },
    {
      "id": "d10-c02",
      "title": "Verantwortliche, Termine, Kosten",
      "titleEn": "Owners, Deadlines, Costs",
      "description": "Jede Maßnahme benennt Ziel, betroffene Anforderung, verantwortliche Person, benötigte Ressourcen, einmaligen und laufenden Aufwand, Termin und Abhängigkeiten. Zuständige Entscheidungsträger bestätigen Ressourcen und Reihenfolge. Bereits vorhandene Einträge im Risikobehandlungsplan D02 werden verknüpft statt als zweiter Auftrag dupliziert.",
      "descriptionEn": "Each action identifies its objective, affected requirement, owner, resources, one-off and recurring effort, deadline and dependencies. Authorised decision-makers confirm resources and sequencing. Existing D02 risk-treatment entries are linked rather than duplicated as a second assignment.",
      "reason": "Ein Termin ohne verfügbare Ressourcen ist keine belastbare Umsetzungsplanung.",
      "reasonEn": "A deadline without available resources is not a credible implementation plan.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 9.2–9.4"
      ]
    },
    {
      "id": "d10-c03",
      "title": "Verknüpfung mit Risikoanalyse",
      "titleEn": "Link to Risk Analysis",
      "description": "Ergänzende Risikoanalysen werden nicht nur bei hohem oder sehr hohem Schutzbedarf einbezogen. Auch Zielobjekte ohne geeignete Bausteinabdeckung oder mit atypischen Einsatzbedingungen werden untersucht. Zusätzliche Maßnahmen und verbleibende Risiken werden in das gemeinsame Sicherheitskonzept übernommen; verwendete Annahmen unterscheiden geplante von bereits wirksamen Maßnahmen.",
      "descriptionEn": "Supplementary risk assessment is not limited to high or very high protection needs. Objects lacking suitable module coverage or operating under atypical conditions are also examined. Additional safeguards and residual risks are incorporated into the shared security concept; assumptions distinguish planned measures from measures already effective.",
      "reason": "Normaler Schutzbedarf beweist nicht, dass ein unpassendes Standardmodell ausreicht.",
      "reasonEn": "Normal protection needs do not prove that an unsuitable standard model is sufficient.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 8.5",
        "BSI Standard 200-3 1.2–1.4, Chapter 7"
      ]
    },
    {
      "id": "d10-c04",
      "title": "Fortschrittsverfolgung",
      "titleEn": "Progress Tracking",
      "description": "Der Umsetzungsverantwortliche verfolgt Fortschritt, Verzögerungen und erreichte Ergebnisse anhand von Nachweisen. Abweichungen mit wesentlichen Auswirkungen werden an die entscheidungsbefugte Rolle berichtet. Eine Maßnahme wird erst nach Prüfung des vereinbarten Ergebnisses abgeschlossen; verbleibende Risiken und erforderliche Nachprüfungen bleiben sichtbar.",
      "descriptionEn": "The implementation owner tracks progress, delays and achieved outcomes using evidence. Deviations with material impact are reported to the authorised decision-maker. Actions close only after verifying the agreed result; residual risks and necessary follow-up remain visible.",
      "reason": "Statusänderungen ohne Abnahme verdecken unvollständige oder unwirksame Umsetzung.",
      "reasonEn": "Status changes without acceptance conceal incomplete or ineffective implementation.",
      "whenRequired": "Bei Anwendung der beschriebenen IT-Grundschutz-Vorgehensweise; vorhandene gleichwertige Aufzeichnungen können genutzt werden.",
      "whenRequiredEn": "When applying the described IT-Grundschutz approach; existing equivalent records may be reused.",
      "sources": [
        "BSI Standard 200-2 9.4–9.5, 10"
      ]
    }
  ],
  "D11": [
    {
      "id": "d11-c01",
      "title": "Registrierungspflicht und Frist",
      "titleEn": "Registration Obligation and Deadline",
      "description": "Für die betroffene Rechtsperson werden zuständige Behörde, einschlägiger nationaler Melde- oder Registrierungsweg und Frist ermittelt. Artikel 3 Absatz 4 betrifft die Angaben für die nationale Liste; Artikel 27 betrifft zusätzlich die dort genannten Anbieterarten. Das Unternehmen meldet an die zuständige Stelle, nicht unmittelbar an ENISA zur Pflege ihres Registers. Nachweis von Übermittlung und Empfang wird aufbewahrt.",
      "descriptionEn": "For the legal entity, identify the competent authority, applicable national submission or registration route and deadline. Article 3(4) concerns information for the national list; Article 27 additionally concerns its specified provider types. The company submits to the competent body, not directly to ENISA to maintain its registry. Preserve submission and receipt evidence.",
      "reason": "Ein intern ausgefülltes Formular ist noch keine erfolgte Behördenmeldung.",
      "reasonEn": "An internally completed form is not yet a completed authority submission.",
      "whenRequired": "Bei erstmaliger Betroffenheit und einschlägigen Registrierungsanlässen.",
      "whenRequiredEn": "On first becoming in scope and relevant registration triggers.",
      "sources": [
        "Directive (EU) 2022/2555 3(3)–(4),27(1)–(2)"
      ]
    },
    {
      "id": "d11-c02",
      "title": "Zu übermittelnde Angaben",
      "titleEn": "Data to be Submitted",
      "description": "Die Meldung enthält mindestens Namen, Anschrift und aktuelle Kontaktangaben einschließlich E-Mail, Telefonnummern und IP-Bereichen sowie gegebenenfalls Sektor, Teilsektor und Mitgliedstaaten der erfassten Dienstleistungen nach Artikel 3 Absatz 4. Für Anbieter nach Artikel 27 werden zusätzlich die dort verlangten Angaben zu Art der Einrichtung, Haupt- und weiteren EU-Niederlassungen beziehungsweise zum Vertreter sowie dessen Kontakten erfasst. Die tatsächlich verlangten Felder des zuständigen Verfahrens werden vollständig ausgefüllt.",
      "descriptionEn": "The submission includes at least name, address and current contacts including email, telephone numbers and IP ranges, plus relevant sector, subsector and Member States of covered services under Article 3(4). For Article 27 providers, also capture its required entity type, main and other EU establishments or representative and representative contacts. Complete the actual fields required by the competent procedure.",
      "reason": "Nur Artikel 27 zu nennen würde die allgemeine Informationspflicht und deren anderen Anwendungsbereich verschleiern.",
      "reasonEn": "Citing only Article 27 would obscure the general information duty and its different scope.",
      "whenRequired": "Bei Erstmeldung und Aktualisierung.",
      "whenRequiredEn": "For initial submission and updates.",
      "sources": [
        "Directive (EU) 2022/2555 3(4),27(2)"
      ]
    },
    {
      "id": "d11-c03",
      "title": "Aktualisierung",
      "titleEn": "Update",
      "description": "Änderungen werden erkannt, zuständig zugeordnet und fristgerecht übermittelt. Artikel 3 Absatz 4 verlangt unverzügliche Aktualisierung, spätestens zwei Wochen nach Änderung; Artikel 27 Absatz 3 verlangt für seine Anbieter unverzügliche Aktualisierung, spätestens drei Monate nach Änderung. Parallel anwendbare Vorgaben und nationale Fristen werden getrennt bestimmt; die längere Frist setzt die kürzere nicht außer Kraft. Änderungsdatum, Fälligkeit und Empfangsnachweis werden erfasst.",
      "descriptionEn": "Changes are detected, assigned and submitted on time. Article 3(4) requires updates without delay and no later than two weeks after change; Article 27(3) requires its providers to update without delay and no later than three months after change. Concurrent obligations and national deadlines are identified separately; the longer limit does not displace the shorter one. Record change date, due date and receipt evidence.",
      "reason": "Ein gemeinsames Portal kann mehrere Pflichten erfüllen, ändert aber nicht deren Fristen.",
      "reasonEn": "A common portal can fulfil several duties without changing their deadlines.",
      "whenRequired": "Bei Änderung übermittelter Angaben.",
      "whenRequiredEn": "When submitted details change.",
      "sources": [
        "Directive (EU) 2022/2555 3(4),27(3)"
      ]
    }
  ],
  "D12": [
    {
      "id": "d12-c01",
      "title": "Einstufungsanalyse",
      "titleEn": "Classification Analysis",
      "description": "Die konkrete Rechtsperson wird anhand von Tätigkeit, Sektor, Niederlassung, Größe, Sondertatbeständen und Ausnahmen nach den Artikeln 2–4 bewertet. Bei der Größenprüfung werden Jahresarbeitseinheiten, Umsatz, Bilanzsumme sowie Partner- und verbundene Unternehmen nach der einschlägigen Definition berücksichtigt. Die KMU-Obergrenze ist eingehalten, wenn weniger als 250 Beschäftigte vorliegen und zugleich entweder der Umsatz höchstens 50 Mio. EUR oder die Bilanzsumme höchstens 43 Mio. EUR beträgt. Überschritten ist sie bei mindestens 250 Beschäftigten oder bei Überschreitung beider finanziellen Grenzen. Die Einstufung als wesentliche oder wichtige Einrichtung folgt anschließend Artikel 3; ein großes Unternehmen ist nicht in jedem Sektor automatisch eine wesentliche Einrichtung.",
      "descriptionEn": "The specific legal entity is assessed against activity, sector, establishment, size, special cases and exclusions under Articles 2–4. Size assessment uses annual work units, turnover, balance-sheet total and partner or linked enterprises under the relevant definition. The SME ceiling is met where the entity has fewer than 250 staff and either turnover not exceeding EUR 50 million or a balance sheet not exceeding EUR 43 million. It is exceeded by at least 250 staff or by exceeding both financial ceilings. Classification as an essential or important entity then follows Article 3; a large enterprise is not automatically an essential entity in every sector.",
      "reason": "Ein hoher Umsatz allein genügt bei weniger als 250 Beschäftigten nicht zur Überschreitung der KMU-Obergrenze.",
      "reasonEn": "High turnover alone does not exceed the SME ceiling with fewer than 250 staff.",
      "whenRequired": "Bei Anwendbarkeitsprüfung einschließlich besonderer größenunabhängiger Fälle.",
      "whenRequiredEn": "During applicability assessment, including special size-independent cases.",
      "sources": [
        "Directive (EU) 2022/2555 2–4",
        "Recommendation 2003/361/EC Annex Articles 2–6"
      ]
    },
    {
      "id": "d12-c02",
      "title": "Dokumentation und Fortschreibung",
      "titleEn": "Documentation and Update",
      "description": "Entscheidung, Datenstand, Quellen, Berechnung, besondere Tatbestände und verbleibende Unsicherheiten werden festgehalten. Relevante Tätigkeits-, Eigentums-, Größen- oder Rechtsänderungen lösen eine erneute Prüfung aus. Mehrjahresregeln der Größenbestimmung werden, soweit anwendbar, berücksichtigt; einzelne ungeprüfte Stichtagswerte ersetzen diese nicht. Zuständige Stellen klären offene Rechtsfragen, und notwendige Registrierung nach D11 wird veranlasst.",
      "descriptionEn": "Record the decision, data date, sources, calculation, special cases and remaining uncertainties. Relevant changes in activity, ownership, size or law trigger reassessment. Multi-year rules for size determination are considered where applicable rather than replaced by unexamined point-in-time figures. Responsible functions resolve open legal questions and initiate required registration under D11.",
      "reason": "Eine begründete alte Einstufung kann nach einer Übernahme oder neuen Tätigkeit nicht mehr tragen.",
      "reasonEn": "A previously justified classification may cease to hold after acquisition or a new activity.",
      "whenRequired": "Bei Erstentscheidung und relevanten Änderungen.",
      "whenRequiredEn": "For initial decisions and relevant changes.",
      "sources": [
        "Directive (EU) 2022/2555 2–4",
        "Recommendation 2003/361/EC Annex Articles 3–6"
      ]
    }
  ],
  "D13": [
    {
      "id": "d13-c01",
      "title": "Schulungspflicht der Leitung",
      "titleEn": "Management Training Obligation",
      "description": "Mitglieder des Leitungsorgans erfasster Einrichtungen absolvieren geeignete Schulungen, um Risiken zu erkennen sowie Risikomanagementpraktiken und deren Auswirkungen auf Dienstleistungen bewerten zu können. Bedarf und Wiederholung werden anhand Aufgaben, Änderungen und geltender nationaler Anforderungen festgelegt. Artikel 20 Absatz 2 selbst setzt keine pauschale jährliche Stundenzahl oder Prüfungsnote fest.",
      "descriptionEn": "Management-body members of covered entities undergo suitable training to recognise risks and assess risk-management practices and their impact on services. Needs and repetition follow responsibilities, changes and applicable national requirements. Article 20(2) itself sets no universal annual number of hours or examination grade.",
      "reason": "Die Freigabe eines Budgets ersetzt nicht die Fähigkeit zur sachkundigen Aufsicht.",
      "reasonEn": "Approving a budget does not replace the ability to exercise informed oversight.",
      "whenRequired": "Für Mitglieder der erfassten Leitungsorgane.",
      "whenRequiredEn": "For members of covered management bodies.",
      "sources": [
        "Directive (EU) 2022/2555 20(2)"
      ]
    },
    {
      "id": "d13-c02",
      "title": "Inhalte und Nachweis",
      "titleEn": "Content and Evidence",
      "description": "Nachweise nennen Teilnehmer und Funktion, Datum, Inhalte, Anbieter oder interne Schulungsstelle sowie verwendete Lern- oder Verständnisnachweise. Fehlende Teilnahme und weiterer Bedarf werden nachverfolgt. Bestehende Kompetenznachweise nach D40 können genutzt werden; ein separat gekauftes Zertifikat oder ein bestimmter Schulungsanbieter ist nicht vorgeschrieben.",
      "descriptionEn": "Records identify attendees and roles, date, content, provider or internal trainer and any learning or understanding evidence used. Missing attendance and further needs are followed up. Existing competence evidence under D40 can be reused; no separately purchased certificate or particular training provider is prescribed.",
      "reason": "Eine Teilnehmerliste ohne Inhalt zeigt nicht, ob die gesetzlich relevante Kompetenz adressiert wurde.",
      "reasonEn": "An attendance list without content does not show whether the relevant competence was addressed.",
      "whenRequired": "Je Schulung und bei Nachverfolgung.",
      "whenRequiredEn": "For each training activity and follow-up.",
      "sources": [
        "Directive (EU) 2022/2555 20(2)",
        "ISO/IEC 27001:2022 7.2–7.3, supporting evidence"
      ]
    }
  ],
  "D14": [
    {
      "id": "d14-c01",
      "title": "Frühwarnung (24h)",
      "titleEn": "Early Warning (24h)",
      "description": "Bei Kenntnis eines erheblichen Vorfalls wird die Frühwarnung unverzüglich, spätestens innerhalb von 24 Stunden, an das zuständige CSIRT oder die zuständige Behörde nach geltendem Verfahren übermittelt. Sie gibt gegebenenfalls an, ob rechtswidrige oder böswillige Ursachen oder grenzüberschreitende Auswirkungen vermutet werden. Kenntniszeitpunkt, Absender, Empfänger und Übermittlung werden dokumentiert.",
      "descriptionEn": "On awareness of a significant incident, the early warning is sent without undue delay and within 24 hours to the competent CSIRT or authority under the applicable procedure. Where applicable, it indicates suspected unlawful or malicious causes and possible cross-border effects. Awareness time, sender, recipient and transmission are recorded.",
      "reason": "Die Höchstfrist ist keine Erlaubnis, eine mögliche Frühwarnung absichtlich aufzuschieben.",
      "reasonEn": "The maximum period is not permission to deliberately postpone a feasible early warning.",
      "whenRequired": "Ab Kenntnis eines erheblichen Vorfalls.",
      "whenRequiredEn": "From awareness of a significant incident.",
      "sources": [
        "Directive (EU) 2022/2555 23(4)(a)"
      ]
    },
    {
      "id": "d14-c02",
      "title": "Meldung (72h)",
      "titleEn": "Notification (72h)",
      "description": "Die Vorfallmeldung folgt unverzüglich, spätestens innerhalb von 72 Stunden ab Kenntnis, mit aktualisierter Frühwarnung, erster Bewertung von Schwere und Auswirkungen sowie verfügbaren Kompromittierungsindikatoren. Vertrauensdiensteanbieter melden erhebliche Vorfälle mit Auswirkungen auf ihre Vertrauensdienste spätestens innerhalb von 24 Stunden ab Kenntnis. Unbekannte Angaben werden gekennzeichnet und nachgeführt statt erfunden; angeforderte Zwischenberichte werden bereitgestellt.",
      "descriptionEn": "Send the incident notification without undue delay and within 72 hours of awareness, updating the early warning and providing initial severity and impact assessment and available indicators of compromise. Trust service providers notify significant incidents affecting their trust services within 24 hours of awareness. Mark and update unknown information rather than invent it; provide intermediate reports when requested.",
      "reason": "Die 72 Stunden beginnen nicht erst nach Versand der Frühwarnung.",
      "reasonEn": "The 72 hours do not start only after the early warning is sent.",
      "whenRequired": "Für erhebliche Vorfälle und angeforderte Zwischenstände.",
      "whenRequiredEn": "For significant incidents and requested updates.",
      "sources": [
        "Directive (EU) 2022/2555 23(4)(b)–(c), final subparagraph"
      ]
    },
    {
      "id": "d14-c03",
      "title": "Abschlussbericht (1 Monat)",
      "titleEn": "Final Report (1 Month)",
      "description": "Spätestens einen Monat nach der Vorfallmeldung wird der Abschlussbericht mit Schwere, Auswirkungen, wahrscheinlicher Bedrohungsart oder Ursache, Maßnahmen und gegebenenfalls grenzüberschreitenden Auswirkungen übermittelt. Dauert der Vorfall dann an, wird stattdessen ein Fortschrittsbericht und anschließend innerhalb eines Monats nach Bewältigung der Abschlussbericht vorgelegt. Die beiden Fristauslöser werden getrennt erfasst.",
      "descriptionEn": "Within one month after the incident notification, submit the final report describing severity, impact, likely threat type or cause, mitigation and relevant cross-border effects. If the incident is still ongoing then, submit a progress report instead and the final report within one month after handling the incident. Track the two starting events separately.",
      "reason": "Ein Monat ab Kenntnis wäre für den regulären Abschlussbericht der falsche Ausgangspunkt.",
      "reasonEn": "One month from awareness would be the wrong starting point for the ordinary final report.",
      "whenRequired": "Bei Abschluss oder Fortdauer zum Berichtstermin.",
      "whenRequiredEn": "At closure or where the incident continues at the reporting date.",
      "sources": [
        "Directive (EU) 2022/2555 23(4)(d)–(e)"
      ]
    },
    {
      "id": "d14-c04",
      "title": "Erheblichkeitskriterien",
      "titleEn": "Significance Criteria",
      "description": "Erheblichkeit wird nach tatsächlichen oder möglichen schweren Betriebsstörungen beziehungsweise finanziellen Verlusten oder beträchtlichen materiellen oder immateriellen Schäden für andere beurteilt. Für erfasste Anbieter kommen die konkreten CIR-Kriterien hinzu; für andere werden sie nicht pauschal als bindend behandelt. Die Entscheidung und Neubewertung folgen p33 einschließlich des dort ergänzten Schwellenregisters. Nationale Anforderungen und parallele Datenschutzpflichten werden geprüft.",
      "descriptionEn": "Significance is assessed using actual or potential severe operational disruption or financial loss, or considerable material or non-material harm to others. Covered providers additionally apply the specific CIR criteria; these are not universally binding on others. Decisions and reassessment follow p33 and its added threshold reference. Assess national requirements and parallel privacy duties.",
      "reason": "Interne Priorität und gesetzliche Meldepflicht sind getrennte Entscheidungen.",
      "reasonEn": "Internal priority and statutory reportability are separate decisions.",
      "whenRequired": "Bei Ersteinschätzung und neuen wesentlichen Erkenntnissen.",
      "whenRequiredEn": "At initial assessment and material new findings.",
      "sources": [
        "Directive (EU) 2022/2555 23(3)",
        "Implementing Regulation (EU) 2024/2690 Articles 3–14, within scope"
      ]
    },
    {
      "id": "d14-c05",
      "title": "Unterrichtung der Diensteempfänger",
      "titleEn": "Informing Service Recipients",
      "description": "Gegebenenfalls werden Diensteempfänger unverzüglich über erhebliche Vorfälle informiert, die ihre Dienstleistungen voraussichtlich beeinträchtigen. Bei einer erheblichen Cyberbedrohung erhalten potenziell betroffene Empfänger unverzüglich Hinweise auf mögliche Schutzmaßnahmen oder Abhilfe; soweit angemessen auch Informationen über die Bedrohung selbst. Empfängerkreis, Inhalt, Freigabe und Versand werden dokumentiert. Eine Behördenmeldung ersetzt diese Kommunikation nicht.",
      "descriptionEn": "Where appropriate, promptly inform service recipients about significant incidents likely to adversely affect their services. For a significant cyber threat, promptly give potentially affected recipients information on protective measures or remedies they can take and, where appropriate, on the threat itself. Record audience, content, approval and delivery. Authority reporting does not replace this communication.",
      "reason": "Empfänger benötigen handlungsfähige Hinweise, nicht lediglich die Information, dass eine Behörde kontaktiert wurde.",
      "reasonEn": "Recipients need actionable guidance, not merely a statement that an authority was contacted.",
      "whenRequired": "Bei den jeweils einschlägigen Vorfall- oder Bedrohungsvoraussetzungen.",
      "whenRequiredEn": "Where the respective incident or threat conditions apply.",
      "sources": [
        "Directive (EU) 2022/2555 23(1)–(2)"
      ]
    }
  ],
  "D15": [
    {
      "id": "d15-c01",
      "title": "Zweck und Geltungsbereich",
      "titleEn": "Purpose and Scope",
      "description": "Der Rahmen ist in das gesamte Risikomanagement eingebettet. Er benennt Strategien, Richtlinien, Verfahren, Protokolle und Werkzeuge zum Schutz aller Informations- und IKT-Assets sowie relevanter physischer Komponenten. Für Artikel-16-Unternehmen wird der vereinfachte Rahmen ausdrücklich ausgewiesen.",
      "descriptionEn": "Embed the framework in overall risk management and identify the strategies, policies, procedures, protocols and tools protecting information and ICT assets and relevant physical components. Identify the simplified framework explicitly for Article 16 entities.",
      "reason": "Der vollständige Rahmen darf Unternehmen, die unter Artikel 16 fallen, nicht auferlegt werden.",
      "reasonEn": "The full framework must not be imposed on entities subject to Article 16.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Arts. 6(1)–(3), 16"
      ]
    },
    {
      "id": "d15-c02",
      "title": "Verantwortung des Leitungsorgans",
      "titleEn": "Management Body Responsibility",
      "description": "Das Leitungsorgan genehmigt den Rahmen, legt Verantwortlichkeiten fest, stellt angemessene Ressourcen bereit und überwacht die Umsetzung. Nicht-Kleinstunternehmen weisen eine ausreichend unabhängige IKT-Kontrollfunktion aus; Interessenkonflikte und die Trennung von Risikomanagement, Kontrolle und interner Revision sind geregelt.",
      "descriptionEn": "Record management approval, responsibilities, adequate resources and oversight. Non-microenterprises identify an appropriately independent ICT control function; address conflicts and segregation of risk management, control and internal audit.",
      "reason": "Die Verantwortung des Leitungsorgans begründet für sich genommen keine automatische persönliche Schadensersatzhaftung.",
      "reasonEn": "Management responsibility does not itself establish automatic personal damages liability.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Arts. 5, 6(4)"
      ]
    },
    {
      "id": "d15-c03",
      "title": "IKT-Strategie für digitale Resilienz",
      "titleEn": "Digital Resilience Strategy",
      "description": "Die Resilienzstrategie verknüpft Geschäftsziele, IKT-Risikotoleranz und Auswirkungstoleranz mit Sicherheitszielen, Kennzahlen, Referenzarchitektur, Erkennung und Schutz, aktuellem Resilienzniveau, Tests und Krisenkommunikation. Freigabe und Änderungen werden nachvollziehbar dokumentiert.",
      "descriptionEn": "Connect business objectives, ICT risk tolerance and disruption impact tolerance with security objectives, metrics, reference architecture, detection and protection, current resilience, testing and incident communications. Record approval and changes.",
      "reason": "Eine Strategie erfordert die in Artikel 6 Absatz 8 genannten Bestandteile und nicht allein eine Aussage zur Risikobereitschaft.",
      "reasonEn": "A strategy needs the Article 6(8) components, not just a statement of risk appetite.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Art. 6(8)"
      ]
    },
    {
      "id": "d15-c04",
      "title": "IKT-Asset- und Abhängigkeitskarte",
      "titleEn": "ICT Asset and Dependency Map",
      "description": "Geschäftsfunktionen, Assets, Rollen, Konfigurationen, Abhängigkeiten und Dienstleisterbeziehungen werden identifiziert und klassifiziert. Die Angemessenheit wird mindestens jährlich und bei relevanten Änderungen überprüft; Inventare werden entsprechend aktualisiert. Besondere Pflichten für wesentliche Änderungen und Altsysteme gelten nach Artikel 8 unter Beachtung der Kleinstunternehmensausnahmen.",
      "descriptionEn": "Identify and classify functions, assets, roles, configurations, dependencies and provider relationships. Review adequacy at least annually and on relevant changes and update inventories. Apply the specific major-change and legacy-system assessments under Article 8 with its microenterprise exceptions.",
      "reason": "Ein statisches Inventar belegt keine fortlaufende Ermittlung der IKT-Risiken.",
      "reasonEn": "A static asset list does not establish ongoing identification of ICT risk.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Art. 8"
      ]
    },
    {
      "id": "d15-c05",
      "title": "Schutz- und Präventionsmaßnahmen",
      "titleEn": "Protection and Prevention",
      "description": "Die Schutzmaßnahmen werden aus den ermittelten Risiken abgeleitet. Zugangsrechte, Identitäten, Kryptografie, Netzschutz und Änderungen werden auf konkrete Systeme und Verantwortliche bezogen; die zugehörigen Verfahren und Umsetzungsnachweise werden verlinkt.",
      "descriptionEn": "Derive safeguards from identified risks. Relate access rights, identities, cryptography, network protection and changes to actual systems and owners and link their procedures and implementation evidence.",
      "reason": "Allgemein gehaltene Richtlinienüberschriften belegen noch keine auf konkrete Systeme bezogene Umsetzung.",
      "reasonEn": "Generic policy titles do not demonstrate implemented protection.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Art. 9"
      ]
    },
    {
      "id": "d15-c06",
      "title": "Erkennung",
      "titleEn": "Detection",
      "description": "Erkennungsmechanismen erfassen anomale Aktivitäten, Leistungsprobleme und IKT-Vorfälle rechtzeitig. Schwellenwerte, Alarmwege, zuständige Personen, Reaktionsschritte und Tests werden dokumentiert; die Wirksamkeit wird gemäß Artikel 10 regelmäßig geprüft.",
      "descriptionEn": "Document timely detection of anomalous activity, performance problems and ICT incidents, including thresholds, alert routes, owners, response steps and tests. Regularly test effectiveness under Article 10.",
      "reason": "Erkennung setzt einen funktionierenden Reaktionsweg voraus und erschöpft sich nicht im Sammeln von Protokolldaten.",
      "reasonEn": "Detection requires a functioning response path, not merely collection of logs.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Art. 10"
      ]
    },
    {
      "id": "d15-c07",
      "title": "Lernen und Weiterentwicklung",
      "titleEn": "Learning and Evolving",
      "description": "Erkenntnisse aus Vorfällen, Tests, Wiederanlauf, Überwachung und Aufsicht werden in Maßnahmen mit Zuständigkeit, Frist und Wirksamkeitsnachweis überführt. Der Rahmen und die betroffenen Pläne werden anhand dieser Erkenntnisse fortlaufend verbessert.",
      "descriptionEn": "Convert lessons from incidents, tests, recovery, monitoring and supervision into actions with owners, deadlines and effectiveness evidence, and continuously improve the framework and affected plans.",
      "reason": "Aus Erkenntnissen müssen nachvollziehbare Änderungen folgen oder eine begründete Entscheidung, dass keine Änderung erforderlich ist.",
      "reasonEn": "Lessons learned need traceable changes or a reasoned decision that no change is necessary.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Art. 13"
      ]
    },
    {
      "id": "d15-c08",
      "title": "Überprüfung und Vorlage an die Aufsicht",
      "titleEn": "Review and Supervisory Submission",
      "description": "Der Rahmen wird mindestens jährlich, bei Kleinstunternehmen periodisch, sowie nach bedeutenden IKT-Vorfällen, aufsichtsrechtlichen Anweisungen oder relevanten Test- und Prüfungsergebnissen überprüft. Der Bericht wird der Behörde auf Anfrage vorgelegt. Nicht-Kleinstunternehmen planen risikogerechte unabhängige interne IKT-Prüfungen; kritische Feststellungen erhalten eine zeitnahe Nachverfolgung.",
      "descriptionEn": "Review the framework at least annually, periodically for microenterprises, and following major ICT incidents, supervisory instructions or relevant testing and audit conclusions. Provide the report to the authority on request. Non-microenterprises plan risk-based independent internal ICT audits and timely follow-up of critical findings.",
      "reason": "Jährliche Überprüfung, interne Revision und Vorlage an die Behörde unterliegen jeweils eigenen Voraussetzungen.",
      "reasonEn": "Annual review, internal audit and authority submission have different conditions.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Art. 6(5)–(7)"
      ]
    }
  ],
  "D16": [
    {
      "id": "d16-c01",
      "title": "Registerpflicht und Umfang",
      "titleEn": "Register Obligation and Scope",
      "description": "Alle vertraglichen Vereinbarungen über die Nutzung von IKT-Dienstleistungen werden im Informationsregister erfasst, nicht nur Auslagerungen kritischer Funktionen. Die erforderlichen Einzel-, teilkonsolidierten und konsolidierten Ebenen werden anhand der tatsächlichen Gruppenstruktur festgelegt.",
      "descriptionEn": "Include all contractual arrangements for ICT services, not only outsourcing of critical functions. Determine the required entity, sub-consolidated and consolidated levels from the actual group structure.",
      "reason": "Beschränkt sich die Erfassung auf die Auslagerung kritischer Funktionen, bleibt ein großer Teil der IKT-Vertragsbeziehungen unsichtbar.",
      "reasonEn": "Register scope is broader than critical outsourcing.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Art. 28(3)"
      ]
    },
    {
      "id": "d16-c02",
      "title": "Pflichtfelder",
      "titleEn": "Mandatory Fields",
      "description": "Die Datensätze werden nach den einschlägigen Vorlagen und Ausfüllanweisungen der Durchführungsverordnung 2024/2956 geführt. Vertrags-, Unternehmens-, Dienstleister-, Funktions- und Dienstleistungskennungen werden mit den zugrunde liegenden Verträgen abgeglichen.",
      "descriptionEn": "Maintain records using the applicable templates and instructions of Implementing Regulation 2024/2956. Reconcile contract, entity, provider, function and service identifiers with underlying arrangements.",
      "reason": "Maßgeblich für die Registervorlagen ist die Durchführungsverordnung 2024/2956; die Verordnung 2024/1774 regelt andere Anforderungen und ersetzt sie nicht.",
      "reasonEn": "Regulation 2024/1774 is not the register template ITS.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Art. 28(9); Implementing Regulation (EU) 2024/2956"
      ]
    },
    {
      "id": "d16-c03",
      "title": "Kennzeichnung kritischer/wichtiger Funktionen",
      "titleEn": "Flagging Critical/Important Functions",
      "description": "Für jeden erfassten Dienst wird festgehalten, ob er eine kritische oder wichtige Funktion unterstützt. Die Begründung, verantwortliche Funktion und Änderungen dieser Bewertung werden dokumentiert; die Kennzeichnung allein löst keine allgemeine TLPT-Pflicht aus.",
      "descriptionEn": "Record whether each service supports a critical or important function, its rationale, responsible function and changes. This flag alone does not create a universal TLPT obligation.",
      "reason": "Die Kennzeichnung im Register und die behördliche Auswahl für TLPT sind getrennte Entscheidungen und bedingen einander nicht.",
      "reasonEn": "Register classification and authority selection for TLPT are separate decisions.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Arts. 3(22), 26(1), 28(3)"
      ]
    },
    {
      "id": "d16-c04",
      "title": "Sub-Outsourcing",
      "titleEn": "Sub-Outsourcing",
      "description": "Relevante Unterauftragnehmer und Lieferkettenbeziehungen werden nach dem Umfang der ITS-Vorlagen erfasst. Rang, zugehöriger Dienst und Abhängigkeit müssen nachvollziehbar sein. Unbekannte Angaben werden als Klärungsbedarf geführt und nicht durch erfundene Kennungen ersetzt.",
      "descriptionEn": "Record relevant subcontractors and supply-chain relationships within the scope of the ITS templates, including traceable rank, related service and dependency. Track unknown information for resolution rather than inventing identifiers.",
      "reason": "Eine bloße Liste direkter Dienstleister bildet die geforderten Lieferkettenbeziehungen nicht ab.",
      "reasonEn": "A direct-provider list alone cannot represent the required supply-chain relationships.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "Implementing Regulation (EU) 2024/2956, Annexes I–IV"
      ]
    },
    {
      "id": "d16-c05",
      "title": "Jährliche Meldung",
      "titleEn": "Annual Reporting",
      "description": "Mindestens jährlich wird über Anzahl neuer Vereinbarungen, Dienstleisterkategorien, Vertragsarten sowie Dienste und Funktionen berichtet. Das vollständige Register oder angeforderte Teile werden auf behördliche Anfrage bereitgestellt. Geplante Vereinbarungen für kritische oder wichtige Funktionen und deren neue Einstufung werden der Behörde rechtzeitig mitgeteilt; konkrete Einreichungsvorgaben werden gesondert dokumentiert.",
      "descriptionEn": "Report at least yearly on new arrangements, provider categories, arrangement types, services and functions. Supply the full register or requested parts on authority request. Inform the authority in a timely manner about planned arrangements supporting critical or important functions and when a function becomes critical or important; separately record applicable submission instructions.",
      "reason": "Die jährliche Berichtspflicht betrifft bestimmte Angaben und nicht die automatische Übermittlung des vollständigen Registers.",
      "reasonEn": "The annual reporting duty is not worded as automatic annual submission of the entire register.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Art. 28(3)"
      ]
    },
    {
      "id": "d16-c06",
      "title": "Pflege und Qualitätssicherung",
      "titleEn": "Maintenance and Quality Assurance",
      "description": "Vertragsänderungen, neue oder beendete Dienste und geänderte Lieferketten werden zeitnah eingepflegt. Vor Abgabe werden Vollständigkeit, eindeutige Kennungen, Verknüpfungen und Pflichtfelder geprüft; Freigabe, Fehlerkorrekturen und übermittelte Version bleiben nachvollziehbar.",
      "descriptionEn": "Update changes, new or terminated services and changed supply chains promptly. Before submission, check completeness, unique identifiers, relationships and required fields; retain traceability of approval, corrections and the submitted version.",
      "reason": "Ausgefüllte Felder genügen nicht, solange Kennungen und Verknüpfungen zwischen den Vorlagen nicht widerspruchsfrei zusammenpassen.",
      "reasonEn": "Template completion requires referential integrity, not just filled cells.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Art. 28(3); Implementing Regulation (EU) 2024/2956"
      ]
    }
  ],
  "D17": [
    {
      "id": "d17-c01",
      "title": "Anwendbarkeit",
      "titleEn": "Applicability",
      "description": "Die Anwendbarkeit wird anhand von Artikel 26 und der behördlichen Identifizierung dokumentiert. Unternehmen nach Artikel 16 Absatz 1 und Kleinstunternehmen sind vom dortigen TLPT-Pflichtenkreis ausgenommen. Ein gewöhnlicher Penetrationstest ist kein TLPT-Nachweis.",
      "descriptionEn": "Document applicability under Article 26 and authority identification. Article 16(1) entities and microenterprises are excluded from that mandatory TLPT population. An ordinary penetration test does not evidence TLPT.",
      "reason": "Nicht jedes Finanzunternehmen und nicht jeder kritische Dienstleister unterliegt der TLPT-Pflicht nach Artikel 26.",
      "reasonEn": "TLPT is not compulsory for every financial entity or critical supplier.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Art. 26(1), (8)"
      ]
    },
    {
      "id": "d17-c02",
      "title": "Umfang und Scoping",
      "titleEn": "Scope and Scoping",
      "description": "Mehrere oder alle kritischen oder wichtigen Funktionen werden mit den unterstützenden Produktivsystemen, Prozessen, Technologien und relevanten Dienstleistern erfasst. Der präzise Umfang wird von der Behörde validiert. Testfreigaben, Schutzmaßnahmen und Abbruchwege begrenzen Schäden und Betriebsunterbrechungen; gemeinsame Tests werden nur unter den Voraussetzungen von Artikel 26 Absatz 4 genutzt.",
      "descriptionEn": "Cover several or all critical or important functions and supporting live systems, processes, technologies and relevant providers. Obtain authority validation of the precise scope. Use authorisations, safeguards and stop procedures to limit damage and disruption; use pooled tests only under Article 26(4).",
      "reason": "Tests an Produktivsystemen verlangen ausdrückliche Schutzvorkehrungen; ein nicht validierter Standardumfang tritt nicht an deren Stelle.",
      "reasonEn": "Live testing requires explicit safety controls and cannot be replaced by an unapproved generic scope.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Art. 26(2)–(5)"
      ]
    },
    {
      "id": "d17-c03",
      "title": "Bedrohungsorientierung (Threat Intelligence)",
      "titleEn": "Threat-Led Approach",
      "description": "Bedrohungsinformationen werden auf die tatsächlich betroffene Organisation und ihren freigegebenen Testumfang bezogen. Szenarien und Red-Team-Aktivitäten folgen den anwendbaren Phasen der Delegierten Verordnung 2025/1190; das gewählte TIBER-Verfahren ersetzt diese Anforderungen nicht.",
      "descriptionEn": "Tailor threat intelligence to the entity and approved scope. Scenarios and red-team activities follow the applicable phases of Delegated Regulation 2025/1190; a chosen TIBER procedure does not replace these requirements.",
      "reason": "Ohne unternehmensspezifische Szenarien und die vorgeschriebene Methodik bleibt ein Test nicht wirklich bedrohungsorientiert.",
      "reasonEn": "Threat-led testing needs entity-specific scenarios and the applicable regulatory methodology.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Art. 26; Delegated Regulation (EU) 2025/1190"
      ]
    },
    {
      "id": "d17-c04",
      "title": "Tester-Anforderungen",
      "titleEn": "Tester Requirements",
      "description": "Die Eignung, Fachkunde, Unabhängigkeit, Risikoabsicherung und Berufshaftpflicht der Tester werden geprüft. Interne Tester benötigen behördliche Genehmigung, ausreichende Ressourcen, vermiedene Interessenkonflikte und externe Threat Intelligence. Bei Nutzung interner Tester erfolgt jeder dritte Test extern; bedeutende Kreditinstitute im Sinne von Artikel 26 Absatz 8 setzen ausschließlich externe Tester ein.",
      "descriptionEn": "Check tester suitability, expertise, independence, risk assurance and professional indemnity cover. Internal testers require authority approval, sufficient resources, avoided conflicts and external threat intelligence. Every third test is external when internal testers are used; significant credit institutions within Article 26(8) use external testers only.",
      "reason": "An den Einsatz interner Tester knüpfen sich zusätzliche Bedingungen, weshalb er externe Tester nicht beliebig ersetzt.",
      "reasonEn": "Internal testing has specific additional conditions and is not a freely interchangeable option.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Arts. 26(8), 27"
      ]
    },
    {
      "id": "d17-c05",
      "title": "Frequenz und Nachweis",
      "titleEn": "Frequency and Attestation",
      "description": "TLPT erfolgt grundsätzlich mindestens alle drei Jahre; eine behördlich angeordnete Verringerung oder Erhöhung der Frequenz wird berücksichtigt. Nach Abschluss werden die erforderlichen Ergebniszusammenfassungen, Maßnahmenpläne und Durchführungsnachweise eingereicht. Die behördliche Bescheinigung dient der Anerkennung des Tests, nicht einer allgemeinen Compliance-Garantie.",
      "descriptionEn": "Perform TLPT at least every three years, subject to authority-required lower or higher frequency. Submit required findings summaries, remediation plans and evidence of compliant conduct. The authority attestation supports recognition of the test, not a general compliance guarantee.",
      "reason": "Frequenz und behördliche Bescheinigung verfolgen unterschiedliche aufsichtliche Zwecke und dürfen nicht gleichgesetzt werden.",
      "reasonEn": "Frequency and attestation serve different regulatory purposes.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Art. 26(1), (6)–(7)"
      ]
    },
    {
      "id": "d17-c06",
      "title": "Behebung und Lessons Learned",
      "titleEn": "Remediation and Lessons Learned",
      "description": "Feststellungen werden in abgestimmte Maßnahmen mit Verantwortlichen, Terminen und Nachprüfungen überführt. Abschluss-, Ergebnis- und Nachverfolgungsunterlagen werden geschützt aufbewahrt und nach den Vorgaben der Delegierten Verordnung 2025/1190 sowie der zuständigen Behörde behandelt.",
      "descriptionEn": "Translate findings into agreed actions with owners, deadlines and verification. Protect closure, results and follow-up records and handle them under Delegated Regulation 2025/1190 and competent-authority requirements.",
      "reason": "Ein abgeschlossener Test belegt noch nicht, dass die festgestellten Schwachstellen tatsächlich behoben wurden.",
      "reasonEn": "A completed test is not evidence that identified weaknesses have been remedied.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Arts. 24(5), 26(6); Delegated Regulation (EU) 2025/1190"
      ]
    }
  ],
  "D18": [
    {
      "id": "d18-c01",
      "title": "Exit-Strategie je kritischem Dienst",
      "titleEn": "Exit Strategy per Critical Service",
      "description": "Für IKT-Dienstleistungen, die kritische oder wichtige Funktionen unterstützen, werden dokumentierte Ausstiegsstrategien erstellt. Sie behandeln Anbieter-Ausfall, Qualitätsverschlechterung, Betriebsstörung, wesentliche Risiken und vertragliche Beendigung; eine enge nationale Auslagerungsdefinition begrenzt diesen Umfang nicht.",
      "descriptionEn": "Document exit strategies for ICT services supporting critical or important functions, addressing provider failure, deterioration, disruption, material risk and termination. A narrower national outsourcing definition does not limit this scope.",
      "reason": "Die Pflicht knüpft nach DORA an die unterstützte Funktion und die betreffende IKT-Dienstleistung an.",
      "reasonEn": "DORA attaches the duty to the supported function and ICT service.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Art. 28(8)"
      ]
    },
    {
      "id": "d18-c02",
      "title": "Übergangsplan",
      "titleEn": "Transition Plan",
      "description": "Übergangspläne benennen Alternativen, Verantwortliche, Ressourcen, Kosten, Abhängigkeiten und Auslöser. Sie zeigen, wie Geschäftsaktivitäten, regulatorische Pflichten sowie Kontinuität und Qualität der Kundendienste während des Übergangs gewahrt werden; Notmaßnahmen decken einen ungeplanten Ausfall ab.",
      "descriptionEn": "Identify alternatives, owners, resources, costs, dependencies and triggers. Show how operations, regulatory compliance and continuity and quality of client services are maintained during transition, with contingencies for unplanned failure.",
      "reason": "Eine vereinbarte Kündigungsfrist beschreibt noch keinen ausführbaren Ausstieg mit Alternativen, Ressourcen und Auslösern.",
      "reasonEn": "A notice period alone is not an executable exit plan.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Art. 28(8)"
      ]
    },
    {
      "id": "d18-c03",
      "title": "Datenrückführung und -löschung",
      "titleEn": "Data Return and Deletion",
      "description": "Die Übertragung umfasst Dienste, relevante Daten, benötigte Metadaten, Formate, Schlüssel und Zugriffsrechte. Integrität und Nutzbarkeit werden beim Ziel überprüft. Rückgabe, Aufbewahrung und Löschung beim bisherigen Anbieter folgen Vertrag und Recht; erforderliche Nachweise bleiben erhalten.",
      "descriptionEn": "Transfer services, relevant data, required metadata, formats, keys and access rights, and verify integrity and usability at the destination. Return, retention and deletion at the former provider follow contract and law, with necessary evidence retained.",
      "reason": "Erst die geprüfte Nutzbarkeit beim Zielanbieter zeigt, dass der Dienstübergang gelungen ist; eine Exportdatei genügt dafür nicht.",
      "reasonEn": "An export file does not by itself establish successful service transition.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Arts. 28(8), 30(2)(d), 30(3)(f)"
      ]
    },
    {
      "id": "d18-c04",
      "title": "Alternativen und Testbarkeit",
      "titleEn": "Alternatives and Testability",
      "description": "Die Pläne werden proportional zum Risiko ausreichend getestet und periodisch überprüft. Testumfang, Annahmen, Ergebnisse und offene Abhängigkeiten werden festgehalten; die gewählte Testtiefe muss die Ausführbarkeit belegen, ohne einen vollständigen produktiven Anbieterwechsel in jedem Test zu verlangen.",
      "descriptionEn": "Test plans sufficiently in proportion to risk and review periodically. Record scope, assumptions, results and unresolved dependencies; test depth must demonstrate feasibility without requiring a complete live provider migration on every test.",
      "reason": "Verlangt wird der dokumentierte Nachweis der Durchführbarkeit, nicht ausnahmslos ein vollständiger produktiver Anbieterwechsel.",
      "reasonEn": "Documented feasibility is required; a universal full migration exercise is not.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Art. 28(8)"
      ]
    }
  ],
  "D19": [
    {
      "id": "d19-c01",
      "title": "Testprogramm",
      "titleEn": "Testing Programme",
      "description": "Nicht-Kleinstunternehmen unter dem vollständigen DORA-Rahmen führen ein risikogerechtes Testprogramm als Bestandteil des IKT-Risikomanagements. Testobjekte, Methoden, Ressourcen, Verantwortliche und unabhängige Tester werden festgelegt. Für Artikel-16-Unternehmen und Kleinstunternehmen werden die jeweils tatsächlich geltenden Testanforderungen gesondert bestimmt.",
      "descriptionEn": "Non-microenterprises under the full DORA framework maintain a risk-based testing programme within ICT risk management, specifying objects, methods, resources, owners and independent testers. Determine the actual applicable testing requirements separately for Article 16 entities and microenterprises.",
      "reason": "Vor Anwendung des vollständigen Programms sind Verhältnismäßigkeit und geltende Ausnahmen zu prüfen.",
      "reasonEn": "Proportionality and exceptions must be considered before applying the full programme.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Arts. 16, 24(1)–(4), 25(3)"
      ]
    },
    {
      "id": "d19-c02",
      "title": "Testarten",
      "titleEn": "Types of Tests",
      "description": "Das Programm wählt geeignete Verfahren aus Artikel 25, etwa Schwachstellen-, Netz-, Quellcode-, Szenario-, Kompatibilitäts-, Leistungs- und Ende-zu-Ende-Tests. Nicht-Kleinstunternehmen testen mindestens jährlich angemessen alle IKT-Systeme und Anwendungen zur Unterstützung kritischer oder wichtiger Funktionen. TLPT wird nur bei entsprechender Anwendbarkeit nach D17 ergänzt.",
      "descriptionEn": "Select appropriate Article 25 methods, such as vulnerability, network, source-code, scenario, compatibility, performance and end-to-end tests. Non-microenterprises appropriately test all ICT systems and applications supporting critical or important functions at least yearly. Add TLPT under D17 only where applicable.",
      "reason": "Die jährliche Pflicht zielt auf die tatsächliche Abdeckung der einschlägigen Systeme, nicht auf einen freigegebenen Testkalender.",
      "reasonEn": "The annual duty concerns actual coverage of relevant systems, not merely approval of a testing calendar.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Arts. 24(6), 25, 26"
      ]
    },
    {
      "id": "d19-c03",
      "title": "Behebung von Feststellungen",
      "titleEn": "Remediation of Findings",
      "description": "Alle im Test festgestellten Probleme werden priorisiert, klassifiziert und mit Zuständigkeit und Frist zur Behebung verfolgt. Eine interne Validierung stellt sicher, dass festgestellte Schwächen vollständig behandelt sind; offene Punkte, Nachtests und Eskalationen bleiben bis zum belegten Abschluss sichtbar.",
      "descriptionEn": "Prioritise, classify and track all issues identified by testing with remediation owners and deadlines. Internal validation establishes that weaknesses have been fully addressed; open issues, retests and escalations remain visible until evidenced closure.",
      "reason": "Ein Testbericht oder ein ungeprüfter Akzeptanzvermerk belegt noch keine Behebung der Feststellung.",
      "reasonEn": "A test report or unverified acceptance entry does not demonstrate remediation.",
      "whenRequired": "Bei Anwendbarkeit der genannten DORA-Bestimmung.",
      "whenRequiredEn": "Where the cited DORA provision applies.",
      "sources": [
        "DORA Art. 24(5)"
      ]
    }
  ],
  "D20": [
    {
      "id": "d20-c01",
      "title": "Pflicht und Rolle",
      "titleEn": "Obligation and Role",
      "description": "Soweit Artikel 30 einschlägig ist, werden Verantwortlichen- und Auftragsverarbeiterverzeichnisse nach ihrer jeweiligen Rolle geführt. Name und Kontaktdaten der verantwortlichen Organisationen sowie gegebenenfalls gemeinsam Verantwortlicher, Vertreter und Datenschutzbeauftragter werden erfasst. Die Ausnahme für weniger als 250 Beschäftigte greift nicht bei risikobehafteter, nicht nur gelegentlicher oder Artikel 9/10 betreffender Verarbeitung. Für Auftragsverarbeiter sind die Auftragsgeber und Verarbeitungskategorien je Auftragsgeber zu unterscheiden.",
      "descriptionEn": "Where Article 30 applies, maintain controller and processor records according to the respective role. Capture names and contacts of responsible organisations and, where relevant, joint controllers, representatives and DPOs. The under-250-staff exception does not cover risky, non-occasional or Article 9/10 processing. Processor records distinguish the controllers served and processing categories for each.",
      "reason": "Rollen bestimmen unterschiedliche Pflichtfelder; Beschäftigtenzahl allein befreit nicht.",
      "reasonEn": "Roles determine different mandatory fields; staff count alone does not exempt an organisation.",
      "whenRequired": "Bei Pflicht nach Artikel 30; freiwillige Führung bleibt möglich.",
      "whenRequiredEn": "Where Article 30 requires a record; voluntary maintenance remains possible.",
      "sources": [
        "Regulation (EU) 2016/679 30(1)–(2),(5)"
      ]
    },
    {
      "id": "d20-c02",
      "title": "Zwecke und Rechtsgrundlagen",
      "titleEn": "Purposes and Legal Bases",
      "description": "Im Verantwortlichenverzeichnis wird der konkrete Verarbeitungszweck erfasst. Rechtsgrundlagen nach Artikel 6 sowie erforderliche zusätzliche Bedingungen nach Artikeln 9 oder 10 werden als verknüpfte Rechtmäßigkeitsprüfung dokumentiert. Sie sind sinnvoll, aber nicht ausdrücklich als eigenes Feld in Artikel 30 Absatz 1 genannt. Im Auftragsverarbeiterverzeichnis werden die Kategorien der Tätigkeiten je Verantwortlichem beschrieben, nicht eigenständig dessen Rechtsgrundlagen erfunden.",
      "descriptionEn": "Record the actual processing purpose in the controller record. Article 6 bases and necessary additional Article 9 or 10 conditions are documented as a linked lawfulness assessment. This is useful but not expressly listed as a separate Article 30(1) field. The processor record describes activity categories for each controller rather than inventing the controller's legal bases.",
      "reason": "Ein Verarbeitungsverzeichnis legalisiert keine unzulässige Tätigkeit.",
      "reasonEn": "A processing record does not legalise an unlawful activity.",
      "whenRequired": "Bei Beschreibung und rechtlicher Einordnung.",
      "whenRequiredEn": "When describing and legally assessing processing.",
      "sources": [
        "Regulation (EU) 2016/679 5–6,9–10,30(1)(b),30(2)(b)"
      ]
    },
    {
      "id": "d20-c03",
      "title": "Kategorien Betroffener und Daten",
      "titleEn": "Categories of Data Subjects and Data",
      "description": "Für das Verantwortlichenverzeichnis werden Personengruppen und Datenkategorien verständlich beschrieben, einschließlich besonders geschützter Inhalte und Daten über Straftaten, soweit vorhanden. Kategorien werden nicht durch vollständige Datensätze oder Namenslisten ersetzt. Verarbeitungsumfang und besonders verletzliche Gruppen werden für die Risikobewertung ergänzt.",
      "descriptionEn": "Describe groups of people and data categories clearly in the controller record, including specially protected content and offence data where present. Categories are not replaced by complete datasets or name lists. Add processing scale and particularly vulnerable groups for risk assessment.",
      "reason": "Das Verzeichnis soll Verarbeitung erklären, nicht unnötig personenbezogene Inhalte duplizieren.",
      "reasonEn": "The record should explain processing rather than unnecessarily duplicate personal content.",
      "whenRequired": "Bei Aufnahme einer Verarbeitung.",
      "whenRequiredEn": "When registering an activity.",
      "sources": [
        "Regulation (EU) 2016/679 30(1)(c),5(1)(c)"
      ]
    },
    {
      "id": "d20-c04",
      "title": "Empfänger und Drittländer",
      "titleEn": "Recipients and Third Countries",
      "description": "Empfängerkategorien und relevante Drittlandübermittlungen werden nachvollziehbar erfasst. Drittland oder internationale Organisation und anwendbarer Übermittlungsmechanismus werden identifiziert; D52 kann verknüpft werden. Die in Artikel 30 ausdrücklich genannte Dokumentation geeigneter Garantien für den Sonderfall des Artikels 49(1) Unterabsatz 2 wird nicht mit einem allgemeinen Standardvertragsklauselzwang verwechselt.",
      "descriptionEn": "Record recipient categories and relevant third-country transfers traceably. Identify the country or international organisation and applicable transfer mechanism; D52 may be linked. Article 30's express documentation of suitable safeguards for the particular second-subparagraph Article 49(1) case is not confused with a universal standard-contractual-clause obligation.",
      "reason": "Ein EU-Vertragspartner schließt Zugriff aus einem Drittland nicht automatisch aus.",
      "reasonEn": "An EU contracting party does not automatically exclude third-country access.",
      "whenRequired": "Bei Empfängern und internationalen Datenflüssen.",
      "whenRequiredEn": "For recipients and international flows.",
      "sources": [
        "Regulation (EU) 2016/679 30(1)(d)–(e),30(2)(c),44–49"
      ]
    },
    {
      "id": "d20-c05",
      "title": "Löschfristen",
      "titleEn": "Deletion Periods",
      "description": "Soweit möglich werden die vorgesehenen Löschfristen für die Datenkategorien im Verantwortlichenverzeichnis angegeben oder durch einen eindeutigen Bezug auf p39/p54 erschlossen. Fristbeginn, gesetzliche Erhaltung und technische Umsetzung sind unterscheidbar. Fehlende Bestimmbarkeit wird begründet und bearbeitet, nicht als unbegrenzte Aufbewahrung behandelt.",
      "descriptionEn": "Where possible, specify envisaged category-level erasure periods in the controller record or link them unambiguously to p39/p54. Distinguish the starting event, legal preservation and technical execution. Explain and address inability to determine a period rather than treating it as unlimited retention.",
      "reason": "Eine Frist ohne Anfangsereignis ist operativ nicht zuverlässig anwendbar.",
      "reasonEn": "A period without its starting event cannot be reliably applied.",
      "whenRequired": "Bei Festlegung von Aufbewahrung und Löschung.",
      "whenRequiredEn": "When defining retention and erasure.",
      "sources": [
        "Regulation (EU) 2016/679 30(1)(f),5(1)(e)"
      ]
    },
    {
      "id": "d20-c06",
      "title": "TOM-Beschreibung",
      "titleEn": "TOM Description",
      "description": "Soweit möglich enthält das jeweilige Verzeichnis eine allgemeine Beschreibung der Sicherheitsmaßnahmen oder einen eindeutigen Verweis auf passende aktuelle TOM-Nachweise nach D51. Angaben beziehen sich auf die konkrete Verarbeitung und ihre Risiken. Geheimnisse, genaue Zugangsdaten oder unnötig sensible Architekturdetails werden nicht aufgenommen.",
      "descriptionEn": "Where possible, include a general description of security measures or an unambiguous link to appropriate current D51 evidence. Information relates to the actual processing and risks. Do not include secrets, credentials or unnecessarily sensitive architecture details.",
      "reason": "Ein generischer Satz zu Verschlüsselung zeigt nicht, welche Verarbeitung geschützt wird.",
      "reasonEn": "A generic encryption statement does not show which processing is protected.",
      "whenRequired": "Für beide Rollenverzeichnisse nach ihren Anforderungen.",
      "whenRequiredEn": "For both role-specific records under their requirements.",
      "sources": [
        "Regulation (EU) 2016/679 30(1)(g),30(2)(d),32"
      ]
    },
    {
      "id": "d20-c07",
      "title": "Pflege und Aktualität",
      "titleEn": "Maintenance and Currency",
      "description": "Verantwortliche Stellen halten das Verzeichnis schriftlich, einschließlich elektronischer Form, aktuell. Neue, geänderte oder beendete Tätigkeiten werden erfasst; Version, Zuständigkeit und Änderungsdatum bleiben nachvollziehbar. Das Verzeichnis wird der Aufsichtsbehörde auf Anfrage bereitgestellt. Ein öffentlich zugängliches Register wird dadurch nicht verlangt.",
      "descriptionEn": "Responsible functions maintain current written records, including electronic form. New, changed or ended activities are reflected with traceable version, ownership and change date. Records are made available to the supervisory authority on request. This does not require a publicly accessible register.",
      "reason": "Veraltete Angaben können Risiken und tatsächliche Empfänger verschleiern.",
      "reasonEn": "Outdated records can obscure risks and actual recipients.",
      "whenRequired": "Laufend bei relevanten Änderungen und Behördenanfragen.",
      "whenRequiredEn": "On relevant changes and authority requests.",
      "sources": [
        "Regulation (EU) 2016/679 30(3)–(4),5(2)"
      ]
    }
  ],
  "D21": [
    {
      "id": "d21-c01",
      "title": "Schwellenwertprüfung",
      "titleEn": "Threshold Assessment",
      "description": "Vor Beginn wird dokumentiert geprüft, ob die geplante Verarbeitung voraussichtlich hohes Risiko für Personen verursacht. Artikel 35 Absatz 3, einschlägige Aufsichtslisten und Kontext werden berücksichtigt. Eine neue Technologie oder KI-Nutzung allein erzeugt nicht automatisch eine DSFA-Pflicht. Soweit eine DSFA erforderlich ist, wird sie vor Beginn durchgeführt; ähnliche Vorgänge können gemeinsam bewertet werden.",
      "descriptionEn": "Before starting, document whether planned processing is likely to create high risk for people. Consider Article 35(3), relevant authority lists and context. New technology or AI use alone does not automatically trigger a DPIA. Where required, perform it before processing begins; similar operations may be assessed together.",
      "reason": "Die Einschätzung betrifft Personenrisiken und nicht nur Unternehmensverluste.",
      "reasonEn": "Assessment concerns risks to people, not merely business losses.",
      "whenRequired": "Vor neuer oder wesentlich geänderter Verarbeitung.",
      "whenRequiredEn": "Before new or materially changed processing.",
      "sources": [
        "Regulation (EU) 2016/679 35(1)–(4)"
      ]
    },
    {
      "id": "d21-c02",
      "title": "Systematische Beschreibung",
      "titleEn": "Systematic Description",
      "description": "Beschreibung umfasst Zwecke, Abläufe, Daten, Beteiligte, Empfänger, Systeme, Umfang und Aufbewahrung sowie gegebenenfalls berechtigte Interessen. Informationsquellen, Annahmen und Abhängigkeiten werden benannt. Die Beschreibung wird auf die tatsächlich geplante Konfiguration bezogen und bei wesentlichen Änderungen nachgeführt.",
      "descriptionEn": "Describe purposes, flows, data, parties, recipients, systems, scale and retention, including legitimate interests where relevant. Identify sources, assumptions and dependencies. Base the description on the actual planned configuration and update it for material change.",
      "reason": "Unklare Datenflüsse machen die Risikobewertung unvollständig.",
      "reasonEn": "Unclear flows leave risk assessment incomplete.",
      "whenRequired": "Bei Erstellung und Änderung der DSFA.",
      "whenRequiredEn": "When preparing and updating the DPIA.",
      "sources": [
        "Regulation (EU) 2016/679 35(7)(a)"
      ]
    },
    {
      "id": "d21-c03",
      "title": "Notwendigkeit und Verhältnismäßigkeit",
      "titleEn": "Necessity and Proportionality",
      "description": "Erforderlichkeit, Verhältnismäßigkeit und zulässiger Zweck werden gegenüber weniger eingriffsintensiven Alternativen beurteilt. Rechtsgrundlage, Datenminimierung, Aufbewahrung, Transparenz und Ausübung der Rechte werden geprüft. Ein wirtschaftlicher Vorteil allein rechtfertigt keine unnötige Erhebung.",
      "descriptionEn": "Assess necessity, proportionality and lawful purpose against less intrusive alternatives. Examine legal basis, minimisation, retention, transparency and exercise of rights. Economic benefit alone does not justify unnecessary collection.",
      "reason": "Technisch möglicher Umfang kann über den erforderlichen Umfang hinausgehen.",
      "reasonEn": "Technically possible scope can exceed what is necessary.",
      "whenRequired": "Bei DSFA-Bewertung.",
      "whenRequiredEn": "During DPIA assessment.",
      "sources": [
        "Regulation (EU) 2016/679 35(7)(b),5–6"
      ]
    },
    {
      "id": "d21-c04",
      "title": "Risiken für Betroffene",
      "titleEn": "Risks to Data Subjects",
      "description": "Konkrete Schadensszenarien für Personen werden nach Schwere und Eintrittswahrscheinlichkeit bewertet, etwa Diskriminierung, Identitätsmissbrauch, Vertraulichkeitsverlust oder Einschränkung von Rechten. Verletzliche Gruppen und Risiken durch Zusammenführung werden berücksichtigt. Ein allgemeiner CIA-Score oder Unternehmensrisiko ersetzt diese Betrachtung nicht.",
      "descriptionEn": "Assess concrete harms to people by severity and likelihood, such as discrimination, identity misuse, loss of confidentiality or restriction of rights. Consider vulnerable groups and linkage risks. A generic confidentiality-integrity-availability score or business-risk rating does not replace this assessment.",
      "reason": "Eine wirtschaftlich kleine Panne kann für einzelne Betroffene gravierende Folgen haben.",
      "reasonEn": "A financially small breach can have severe consequences for particular individuals.",
      "whenRequired": "Für relevante Verarbeitungsszenarien.",
      "whenRequiredEn": "For relevant processing scenarios.",
      "sources": [
        "Regulation (EU) 2016/679 35(7)(c)"
      ]
    },
    {
      "id": "d21-c05",
      "title": "Abhilfemaßnahmen",
      "titleEn": "Mitigation Measures",
      "description": "Maßnahmen, Verantwortliche, Fristen und Wirksamkeitsnachweise werden dokumentiert; danach wird das verbleibende Personenrisiko bewertet. Der Datenschutzbeauftragte wird, soweit benannt, um Rat ersucht. Soweit angemessen werden Betroffene oder ihre Vertreter einbezogen, ohne Sicherheits- oder Geschäftsinteressen unangemessen zu beeinträchtigen. Relevante Änderungen lösen eine erneute Prüfung aus.",
      "descriptionEn": "Record safeguards, owners, deadlines and effectiveness evidence, then assess residual risk to people. Seek advice from the DPO where designated. Where appropriate, seek views of people or their representatives without improperly compromising security or commercial interests. Relevant changes trigger review.",
      "reason": "Eine bloß geplante Maßnahme reduziert das tatsächliche Risiko noch nicht.",
      "reasonEn": "A merely planned safeguard has not yet reduced actual risk.",
      "whenRequired": "Vor Freigabe und bei geänderten Risiken.",
      "whenRequiredEn": "Before approval and when risks change.",
      "sources": [
        "Regulation (EU) 2016/679 35(2),(7)(d),(9),(11)"
      ]
    },
    {
      "id": "d21-c06",
      "title": "Konsultation der Aufsicht",
      "titleEn": "Prior Consultation",
      "description": "Bleibt ein hohes Risiko ohne ausreichende risikomindernde Maßnahmen, konsultiert der Verantwortliche die Aufsichtsbehörde vor der Verarbeitung nach Artikel 36. Er übermittelt Zuständigkeiten, Zwecke und Mittel, Maßnahmen, Datenschutzkontakt, DSFA und weitere angeforderte Informationen. Interne Risikoakzeptanz ersetzt diese Pflicht nicht. Beratung, Bedingungen und Folgemaßnahmen werden dokumentiert.",
      "descriptionEn": "Where high risk remains without sufficient mitigating measures, the controller consults the supervisory authority before processing under Article 36. Provide responsibilities, purposes and means, safeguards, privacy contact, DPIA and other requested information. Internal risk acceptance does not replace this duty. Record advice, conditions and follow-up actions.",
      "reason": "Managementfreigabe kann gesetzliche Vorabkonsultation nicht aufheben.",
      "reasonEn": "Management approval cannot waive statutory prior consultation.",
      "whenRequired": "Bei einschlägigem hohen Restrisiko.",
      "whenRequiredEn": "For relevant residual high risk.",
      "sources": [
        "Regulation (EU) 2016/679 36(1),(3)"
      ]
    }
  ],
  "D22": [
    {
      "id": "d22-c01",
      "title": "Gegenstand und Dauer",
      "titleEn": "Subject and Duration",
      "description": "Verantwortlicher und Auftragsverarbeiter vereinbaren die im ausgefüllten Arbeitsanhang benannten Parteien, Gegenstand, Dauer, Art und Zweck der Verarbeitung sowie Datenarten und Personenkategorien. Der Verantwortliche bestimmt zulässige Zwecke und Weisungen und behält seine gesetzlichen Rechte und Pflichten. Die Vereinbarung bindet den Auftragsverarbeiter in schriftlicher oder elektronischer Form; ein zulässiger anderer Rechtsakt kann an ihre Stelle treten. Vor Verwendung sind Anhänge, Dienste und Rollen konkret auszufüllen und rechtlich zu prüfen.",
      "descriptionEn": "The controller and processor agree the parties, subject, duration, nature and purpose of processing and data and person categories identified in the completed working schedule. The controller determines lawful purposes and instructions and retains its statutory rights and duties. This arrangement binds the processor in written or electronic form; a permissible other legal act may serve instead. Complete the schedules, services and roles and obtain appropriate legal review before use.",
      "reason": "Ein leerer Vertragsanhang begrenzt die tatsächliche Verarbeitung nicht ausreichend.",
      "reasonEn": "An empty contract schedule does not adequately delimit actual processing.",
      "whenRequired": "Vor Verarbeitung im Auftrag.",
      "whenRequiredEn": "Before processing on behalf of the controller.",
      "sources": [
        "Regulation (EU) 2016/679 28(3),(9)"
      ]
    },
    {
      "id": "d22-c02",
      "title": "Weisungsbindung",
      "titleEn": "Instruction-Binding",
      "description": "Der Auftragsverarbeiter verarbeitet personenbezogene Daten nur auf dokumentierte Weisung des Verantwortlichen, einschließlich Drittlandübermittlungen. Gesetzlich verpflichtende Verarbeitung nach Unions- oder Mitgliedstaatenrecht bleibt vorbehalten; der Auftragsverarbeiter informiert vorab darüber, soweit das betreffende Recht dies nicht aus wichtigen öffentlichen Interessen untersagt. Hält er eine Weisung für datenschutzrechtswidrig, informiert er den Verantwortlichen unverzüglich. Eigene Zwecke sind von diesem Auftrag nicht gedeckt.",
      "descriptionEn": "The processor processes personal data only on documented controller instructions, including third-country transfers. Processing required by Union or Member State law remains reserved; the processor informs the controller beforehand unless that law prohibits this on important public-interest grounds. If the processor considers an instruction to infringe data-protection law, it informs the controller immediately. Independent purposes are not covered by this engagement.",
      "reason": "Eine Weisung entbindet den Auftragsverarbeiter nicht von seinen eigenen gesetzlichen Pflichten.",
      "reasonEn": "An instruction does not release the processor from its own statutory duties.",
      "whenRequired": "Während der Auftragsverarbeitung.",
      "whenRequiredEn": "Throughout the processing engagement.",
      "sources": [
        "Regulation (EU) 2016/679 28(3)(a),(h),29"
      ]
    },
    {
      "id": "d22-c03",
      "title": "Vertraulichkeit und TOM",
      "titleEn": "Confidentiality and TOM",
      "description": "Der Auftragsverarbeiter stellt sicher, dass zur Verarbeitung befugte Personen zur Vertraulichkeit verpflichtet sind oder einer geeigneten gesetzlichen Verschwiegenheitspflicht unterliegen. Er trifft die nach Artikel 32 erforderlichen Maßnahmen und beschreibt deren auftragsbezogene Umsetzung im Sicherheitsanhang. Veränderungen dürfen die erforderliche Sicherheit nicht unterlaufen; relevante Änderungen und vereinbarte Nachweise werden dem Verantwortlichen zugänglich gemacht.",
      "descriptionEn": "The processor ensures that authorised personnel are committed to confidentiality or subject to an appropriate statutory duty. It implements measures required by Article 32 and describes their engagement-specific operation in the security schedule. Changes must not undermine required security; relevant changes and agreed evidence are made available to the controller.",
      "reason": "Ein Vertraulichkeitsversprechen allein ersetzt keine wirksame technische Absicherung.",
      "reasonEn": "A confidentiality promise alone does not replace effective technical safeguards.",
      "whenRequired": "Für befugte Personen und eingesetzte Systeme.",
      "whenRequiredEn": "For authorised personnel and systems used.",
      "sources": [
        "Regulation (EU) 2016/679 28(3)(b)–(c),32"
      ]
    },
    {
      "id": "d22-c04",
      "title": "Unterauftragnehmer",
      "titleEn": "Sub-Processors",
      "description": "Weitere Auftragsverarbeiter werden nur nach vorheriger gesonderter oder allgemeiner schriftlicher Genehmigung eingesetzt. Bei allgemeiner Genehmigung informiert der Auftragsverarbeiter über beabsichtigte Hinzuziehung oder Ersetzung und ermöglicht dem Verantwortlichen den Widerspruch. Den weiteren Auftragsverarbeitern werden dieselben Datenschutzpflichten verbindlich auferlegt. Der erste Auftragsverarbeiter bleibt gegenüber dem Verantwortlichen für die Pflichterfüllung des weiteren Auftragsverarbeiters voll verantwortlich. Das gewählte Genehmigungs- und Benachrichtigungsverfahren wird im Anhang konkretisiert.",
      "descriptionEn": "Subprocessors are engaged only with prior specific or general written authorisation. Under general authorisation, the processor informs the controller of intended additions or replacements and permits objection. The same data-protection obligations are binding on subprocessors. The initial processor remains fully liable to the controller for the subprocessor's performance of those obligations. Specify the selected authorisation and notice procedure in the schedule.",
      "reason": "Eine Untervergabe beendet die vertragliche Verantwortung der ersten Stelle nicht.",
      "reasonEn": "Subcontracting does not end the initial party's contractual responsibility.",
      "whenRequired": "Vor Untervergabe und bei Änderungen.",
      "whenRequiredEn": "Before subcontracting and on changes.",
      "sources": [
        "Regulation (EU) 2016/679 28(2),(4)"
      ]
    },
    {
      "id": "d22-c05",
      "title": "Unterstützung und Löschung",
      "titleEn": "Assistance and Deletion",
      "description": "Der Auftragsverarbeiter unterstützt den Verantwortlichen soweit möglich durch geeignete Maßnahmen bei Betroffenenrechten und unter Berücksichtigung der Verarbeitung und verfügbaren Informationen bei Artikeln 32–36. Er meldet bekannt gewordene Datenschutzverletzungen unverzüglich an den Verantwortlichen. Nach Ende der Leistungen löscht er nach Wahl des Verantwortlichen alle personenbezogenen Daten oder gibt sie zurück und löscht vorhandene Kopien, soweit Unions- oder Mitgliedstaatenrecht keine Speicherung verlangt. Ausführung und zulässige Restaufbewahrung werden nachgewiesen.",
      "descriptionEn": "The processor assists the controller as far as possible through suitable measures with individual rights and, considering processing and available information, with Articles 32–36. It notifies the controller without undue delay upon awareness of personal data breaches. After services end, at the controller's choice it deletes or returns all personal data and deletes existing copies unless Union or Member State law requires storage. Evidence execution and permissible remaining retention.",
      "reason": "Der Auftragsverarbeiter erhält keine eigene allgemeine 72-Stunden-Wartefrist.",
      "reasonEn": "The processor has no independent general 72-hour waiting period.",
      "whenRequired": "Bei Unterstützungsanlässen, Vorfällen und Vertragsende.",
      "whenRequiredEn": "For assistance requests, incidents and service termination.",
      "sources": [
        "Regulation (EU) 2016/679 28(3)(e)–(g),33(2)"
      ]
    },
    {
      "id": "d22-c06",
      "title": "Kontroll- und Auditrechte",
      "titleEn": "Audit Rights",
      "description": "Der Auftragsverarbeiter stellt alle zur Darlegung der Einhaltung von Artikel 28 erforderlichen Informationen zur Verfügung und ermöglicht sowie unterstützt Prüfungen einschließlich Inspektionen durch den Verantwortlichen oder dessen beauftragten Prüfer. Praktische Vereinbarungen zu Vertraulichkeit und Ablauf dürfen dieses Recht nicht aushöhlen. Eine Zertifizierung kann Nachweise ergänzen, ersetzt aber nicht pauschal das vertragliche Prüfungsrecht.",
      "descriptionEn": "The processor makes available all information necessary to demonstrate Article 28 compliance and allows and contributes to audits, including inspections, by the controller or its mandated auditor. Practical confidentiality and scheduling arrangements must not frustrate this right. Certification can supplement evidence but does not categorically replace the contractual audit right.",
      "reason": "Ein Recht nur auf einen Marketingbericht genügt nicht als uneingeschränktes Ersatzrecht.",
      "reasonEn": "Access only to a marketing report is not an adequate blanket substitute.",
      "whenRequired": "Während der vertraglichen Nachweis- und Prüfpflichten.",
      "whenRequiredEn": "Throughout contractual assurance and audit duties.",
      "sources": [
        "Regulation (EU) 2016/679 28(3)(h)"
      ]
    }
  ],
  "D23": [
    {
      "id": "d23-c01",
      "title": "Identitätsprüfung",
      "titleEn": "Identity Verification",
      "description": "Anträge werden über erreichbare Wege angenommen und zeitnah der zuständigen Stelle zugeordnet. Die Identität wird angemessen abgesichert; zusätzliche Informationen nach Artikel 12 Absatz 6 werden nur bei begründeten Zweifeln und im erforderlichen Umfang verlangt. Eine Ausweiskopie ist kein pauschales Pflichtdokument. Sichere Übermittlung der Antwort wird gewährleistet.",
      "descriptionEn": "Accept requests through accessible channels and promptly route them to the responsible function. Establish identity appropriately; request additional Article 12(6) information only where reasonable doubts exist and to the necessary extent. An identity-document copy is not universally mandatory. Ensure secure delivery of the response.",
      "reason": "Übermäßige Identitätsanforderungen können die Ausübung von Rechten behindern.",
      "reasonEn": "Excessive identity demands can obstruct exercise of rights.",
      "whenRequired": "Bei Eingang eines Antrags.",
      "whenRequiredEn": "On receipt of a request.",
      "sources": [
        "Regulation (EU) 2016/679 12(2),(6)"
      ]
    },
    {
      "id": "d23-c02",
      "title": "Abgedeckte Rechte",
      "titleEn": "Covered Rights",
      "description": "Das Verfahren unterstützt Auskunft, Berichtigung, Löschung, Einschränkung, Übertragbarkeit und Widerspruch nach den jeweiligen Voraussetzungen sowie Rechte bei einschlägigen automatisierten Einzelentscheidungen. Widerruf von Einwilligungen ist nach D54 möglich. Nicht jedes Recht gilt uneingeschränkt für jede Rechtsgrundlage; Ausnahmen und Rechte anderer werden konkret geprüft statt pauschal behauptet.",
      "descriptionEn": "The process supports access, rectification, erasure, restriction, portability and objection under their respective conditions, plus rights concerning relevant automated individual decisions. Consent withdrawal is available under D54. Not every right applies without limits to every legal basis; exceptions and others' rights are assessed specifically rather than asserted categorically.",
      "reason": "Datenübertragbarkeit und Löschung haben unterschiedliche Voraussetzungen.",
      "reasonEn": "Portability and erasure have different conditions.",
      "whenRequired": "Bei Einordnung und Bearbeitung von Anträgen.",
      "whenRequiredEn": "When classifying and handling requests.",
      "sources": [
        "Regulation (EU) 2016/679 7(3),15–22"
      ]
    },
    {
      "id": "d23-c03",
      "title": "Fristen",
      "titleEn": "Deadlines",
      "description": "Anfragen werden unverzüglich und grundsätzlich spätestens einen Monat nach Eingang beantwortet. Bei erforderlicher Verlängerung um höchstens zwei weitere Monate wegen Komplexität oder Anzahl wird innerhalb des ersten Monats über Gründe informiert. Bei Nichttätigwerden werden Gründe sowie Beschwerde- und Rechtsschutzmöglichkeiten spätestens innerhalb eines Monats mitgeteilt. Verspätung wird nicht durch interne Weiterleitung verdeckt.",
      "descriptionEn": "Respond without undue delay and normally within one month of receipt. Where complexity or number makes an extension of up to two further months necessary, inform the individual of the reasons within the first month. If not acting, communicate reasons and complaint and judicial-remedy options within one month. Internal forwarding must not conceal delay.",
      "reason": "Eine Verlängerung ist eine begründete Ausnahme, kein automatischer Standard.",
      "reasonEn": "An extension is a justified exception, not an automatic default.",
      "whenRequired": "Bei jedem Antrag.",
      "whenRequiredEn": "For every request.",
      "sources": [
        "Regulation (EU) 2016/679 12(3)–(4)"
      ]
    },
    {
      "id": "d23-c04",
      "title": "Weitergabe an Dritte",
      "titleEn": "Notification to Third Parties",
      "description": "Erfolgte Berichtigung, Löschung oder Einschränkung wird den Empfängern nach Artikel 19 mitgeteilt, soweit dies nicht unmöglich oder unverhältnismäßig aufwendig ist. Eine Ausnahme wird begründet; auf Verlangen wird die betroffene Person über die Empfänger unterrichtet. Technische Dienstleister werden zur tatsächlichen Umsetzung einbezogen.",
      "descriptionEn": "Communicate rectification, erasure or restriction to recipients under Article 19 unless impossible or involving disproportionate effort. Justify an exception; inform the individual about recipients on request. Involve technical providers in actual implementation.",
      "reason": "Eine Korrektur im führenden System erreicht nicht zwangsläufig bereits übermittelte Kopien.",
      "reasonEn": "Correcting the primary system does not necessarily reach copies already disclosed.",
      "whenRequired": "Bei einschlägigen Änderungen und Weitergaben.",
      "whenRequiredEn": "For relevant changes and disclosures.",
      "sources": [
        "Regulation (EU) 2016/679 19"
      ]
    },
    {
      "id": "d23-c05",
      "title": "Dokumentation",
      "titleEn": "Documentation",
      "description": "Eingang, Identitätsprüfung soweit erforderlich, betroffene Systeme, Entscheidung, Umsetzung, Antwort und Fristen werden datensparsam dokumentiert. Kosten oder Ablehnung wegen offensichtlich unbegründeter oder exzessiver Anträge werden nur nach den gesetzlichen Voraussetzungen und mit Nachweis angewandt. Aufbewahrung und Zugriff auf Antragsakten sind begrenzt.",
      "descriptionEn": "Document receipt, identity checks where necessary, affected systems, decision, execution, response and deadlines with minimisation. Fees or refusal for manifestly unfounded or excessive requests are used only under statutory conditions with supporting evidence. Limit retention and access to request files.",
      "reason": "Der Nachweis soll Rechte sichern, nicht neue unnötige Datensammlungen schaffen.",
      "reasonEn": "Evidence should safeguard rights rather than create unnecessary new collections.",
      "whenRequired": "Während Bearbeitung und erforderlicher Nachweisführung.",
      "whenRequiredEn": "During handling and necessary accountability.",
      "sources": [
        "Regulation (EU) 2016/679 5(2),12(5)"
      ]
    }
  ],
  "D24": [
    {
      "id": "d24-c01",
      "title": "Erkennung und Bewertung",
      "titleEn": "Detection and Assessment",
      "description": "Mögliche Verletzungen der Vertraulichkeit, Integrität oder Verfügbarkeit personenbezogener Daten werden umgehend intern gemeldet und bewertet. Ob eine Datenschutzverletzung nach Artikel 4 Absatz 12 vorliegt und ob Personenrisiken bestehen, wird nachvollziehbar entschieden. Kenntniszeitpunkt und neue Erkenntnisse werden erfasst; fehlende vollständige Forensik verzögert erforderliche Schutzmaßnahmen nicht.",
      "descriptionEn": "Promptly report and assess possible confidentiality, integrity or availability breaches involving personal data internally. Determine traceably whether an Article 4(12) breach occurred and whether risks to people arise. Record awareness time and new findings; incomplete forensics does not delay necessary safeguards.",
      "reason": "Auch Verlust oder unzulässige Änderung kann eine Datenschutzverletzung sein, nicht nur Abfluss.",
      "reasonEn": "Loss or unauthorised alteration can also be a personal data breach, not only leakage.",
      "whenRequired": "Bei Verdacht oder Kenntnis.",
      "whenRequiredEn": "On suspicion or awareness.",
      "sources": [
        "Regulation (EU) 2016/679 4(12),33"
      ]
    },
    {
      "id": "d24-c02",
      "title": "Meldung an die Aufsicht (72h)",
      "titleEn": "Notification to Authority (72h)",
      "description": "Der Verantwortliche meldet der zuständigen Aufsichtsbehörde unverzüglich und möglichst binnen 72 Stunden nach Kenntnis, sofern ein Risiko für Rechte und Freiheiten nicht unwahrscheinlich ist. Eine spätere Meldung enthält die Verzögerungsgründe; fehlende Angaben können ohne unangemessene weitere Verzögerung schrittweise folgen. Der Inhalt umfasst die Art und den ungefähren Umfang der Verletzung, eine Kontaktstelle, die wahrscheinlichen Folgen sowie die ergriffenen Maßnahmen. Auftragsverarbeiter melden dem Verantwortlichen unverzüglich nach Kenntnis und schöpfen keine eigene 72-Stunden-Frist aus.",
      "descriptionEn": "The controller notifies the competent supervisory authority without undue delay and where feasible within 72 hours of awareness unless risk to rights and freedoms is unlikely. Late notification includes reasons; missing information may follow in phases without undue further delay. Content includes nature and approximate scope, contact, likely consequences and measures. Processors notify the controller without undue delay upon awareness rather than waiting their own 72 hours.",
      "reason": "Behördenmeldung und Auftragsverarbeitermeldung haben unterschiedliche Adressaten und Fristen.",
      "reasonEn": "Authority and processor notifications have different recipients and timing.",
      "whenRequired": "Bei der jeweiligen meldepflichtigen Rolle und Schwelle.",
      "whenRequiredEn": "For the respective reporting role and threshold.",
      "sources": [
        "Regulation (EU) 2016/679 33(1)–(4)"
      ]
    },
    {
      "id": "d24-c03",
      "title": "Benachrichtigung der Betroffenen",
      "titleEn": "Communication to Data Subjects",
      "description": "Bei voraussichtlich hohem Risiko informiert der Verantwortliche Betroffene unverzüglich in klarer Sprache über Art der Verletzung, Kontakt, wahrscheinliche Folgen und Maßnahmen. Ausnahmen nach Artikel 34 Absatz 3, etwa wirksamer Schutz der betroffenen Daten oder nachträgliche Beseitigung des hohen Risikos, werden konkret geprüft. Unverhältnismäßiger Aufwand kann eine gleich wirksame öffentliche Information erfordern und ist kein generelles Schweigerecht.",
      "descriptionEn": "Where high risk is likely, the controller informs affected people without undue delay in clear language about the breach, contact, likely consequences and measures. Assess Article 34(3) exceptions specifically, such as effective protection of affected data or subsequent removal of high risk. Disproportionate effort can require equally effective public communication rather than create a general right to remain silent.",
      "reason": "Die Information muss den Personen ermöglichen, sich vor Folgen zu schützen.",
      "reasonEn": "Information must enable people to protect themselves against consequences.",
      "whenRequired": "Bei hohem Personenrisiko nach geltenden Voraussetzungen.",
      "whenRequiredEn": "Where high risk to people meets applicable conditions.",
      "sources": [
        "Regulation (EU) 2016/679 34"
      ]
    },
    {
      "id": "d24-c04",
      "title": "Internes Verletzungsregister",
      "titleEn": "Internal Breach Register",
      "description": "Alle Datenschutzverletzungen werden einschließlich Fakten, Auswirkungen und Abhilfemaßnahmen dokumentiert. Auch die begründete Nichtmeldung und spätere Neubewertung werden nachvollziehbar dokumentiert. D74 stellt die Registeransicht bereit; vorhandene Vorfallsdaten aus D83 können verknüpft werden. Nicht jede Sicherheitswarnung wird automatisch als bestätigte Datenschutzverletzung gezählt.",
      "descriptionEn": "Document every personal data breach, including facts, effects and remedial action. Make reasoned non-notification and subsequent reassessment traceable. D74 supplies the register view; existing D83 incident information can be linked. Not every security alert is automatically counted as a confirmed personal data breach.",
      "reason": "Nicht meldepflichtig bedeutet nicht dokumentationsfrei.",
      "reasonEn": "Not reportable does not mean exempt from documentation.",
      "whenRequired": "Für jede Datenschutzverletzung.",
      "whenRequiredEn": "For every personal data breach.",
      "sources": [
        "Regulation (EU) 2016/679 33(5)"
      ]
    },
    {
      "id": "d24-c05",
      "title": "Abstimmung mit NIS2/DORA",
      "titleEn": "Coordination with NIS2/DORA",
      "description": "Für denselben Vorfall werden Datenschutz-, NIS2- und gegebenenfalls DORA-Pflichten getrennt nach Rolle, Schwelle, Empfänger und Frist ermittelt. Ein gemeinsamer Sachverhalt wird konsistent verwendet, aber Übermittlungen gelten nur bei tatsächlich erfülltem zuständigem Verfahren als erledigt. Vorrangregeln zwischen DORA und NIS2 werden berücksichtigt; sie beseitigen nicht automatisch die DSGVO-Pflichten.",
      "descriptionEn": "For the same incident, determine privacy, NIS2 and relevant DORA duties separately by role, threshold, recipient and deadline. Reuse a consistent factual record, but treat a submission as complete only when the competent procedure is actually satisfied. Account for DORA/NIS2 precedence rules; they do not automatically remove GDPR duties.",
      "reason": "Eine Meldung an eine Finanzaufsicht ist nicht automatisch eine Meldung an die Datenschutzaufsicht.",
      "reasonEn": "Notification to a financial supervisor is not automatically notification to the privacy authority.",
      "whenRequired": "Bei mehreren potenziell anwendbaren Meldewegen.",
      "whenRequiredEn": "Where several reporting routes may apply.",
      "sources": [
        "Regulation (EU) 2016/679 33–34; also Directive (EU) 2022/2555 Articles 4,23 and Regulation (EU) 2022/2554 Article 19 within scope"
      ]
    }
  ],
  "D25": [
    {
      "id": "d25-c01",
      "title": "Vollständiges Inventar",
      "titleEn": "Complete Inventory",
      "description": "Das interne Inventar erfasst selbst entwickelte, eingekaufte und eingebettete KI im festgelegten Organisationsumfang mit eindeutiger Kennung. Es ist eine Steuerungsmaßnahme; Artikel 49 verlangt nicht die öffentliche Registrierung jedes KI-Systems.",
      "descriptionEn": "Record internally developed, procured and embedded AI within the organisational scope using unique identifiers. This is a governance measure; Article 49 does not require public registration of every AI system.",
      "reason": "Das interne Inventar und die gesetzliche EU-Datenbank sind zwei verschiedene Verzeichnisse mit unterschiedlichem Zweck.",
      "reasonEn": "An internal inventory and the statutory EU database are different records.",
      "whenRequired": "Als interne Steuerungsregel für KI im festgelegten Geltungsbereich.",
      "whenRequiredEn": "As an internal governance rule for AI within the defined scope.",
      "sources": [
        "AI Act Arts. 3, 49; internal governance practice",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d25-c02",
      "title": "Zweck und Risikoklasse",
      "titleEn": "Purpose and Risk Class",
      "description": "Zweck, tatsächlich vorgesehene Nutzung und betroffene Personen werden beschrieben. Verbote nach Artikel 5, Hochrisikoeinstufung nach Artikel 6, Transparenzpflichten und gegebenenfalls GPAI-Pflichten werden getrennt bewertet. Eine Entscheidung nach Artikel 6 Absatz 3 wird begründet; die vereinfachenden Kategorien begrenztes oder minimales Risiko ersetzen keine Einzelprüfung.",
      "descriptionEn": "Describe purpose, actual intended use and affected people. Assess Article 5 prohibitions, Article 6 high-risk status, transparency and any GPAI duties separately. Justify an Article 6(3) conclusion; simplified limited/minimal risk labels do not replace assessment.",
      "reason": "Die Verordnung ordnet nicht jedes System genau einer von vier einander ausschließenden Risikostufen zu.",
      "reasonEn": "The Act is not a single mutually exclusive four-label decision tree.",
      "whenRequired": "Als interne Steuerungsregel für KI im festgelegten Geltungsbereich.",
      "whenRequiredEn": "As an internal governance rule for AI within the defined scope.",
      "sources": [
        "AI Act Arts. 5, 6, 50–55",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d25-c03",
      "title": "Daten und Modell",
      "titleEn": "Data and Model",
      "description": "Modell und System werden unterschieden. Anbieter, Version, Datenquellen, Schnittstellen, bekannte Einschränkungen und Nachweise werden verlinkt; unbekannte Lieferantendaten sind als offene Punkte gekennzeichnet. Personenbezogene Trainingsdaten werden nicht unnötig in das Inventar kopiert.",
      "descriptionEn": "Distinguish model from system. Link provider, version, data sources, interfaces, known limitations and evidence, marking unknown supplier information as unresolved. Do not unnecessarily copy personal training data into the inventory.",
      "reason": "Nachvollziehbarkeit verlangt Verweise auf die Datenquellen, nicht einen zweiten Bestand personenbezogener Trainingsdaten.",
      "reasonEn": "Traceability does not require a second store of training data.",
      "whenRequired": "Als interne Steuerungsregel für KI im festgelegten Geltungsbereich.",
      "whenRequiredEn": "As an internal governance rule for AI within the defined scope.",
      "sources": [
        "AI Act Arts. 3, 11, 13; internal governance practice",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d25-c04",
      "title": "Rollen und Verantwortliche",
      "titleEn": "Roles and Owners",
      "description": "Anbieter, Betreiber, Einführer, Händler und Bevollmächtigter werden nach tatsächlicher Tätigkeit bestimmt. Namensänderung, wesentliche Veränderung oder Zweckänderung werden auf einen Rollenwechsel nach Artikel 25 geprüft. Fachlicher Eigentümer und verantwortliche Freigabestelle sind benannt.",
      "descriptionEn": "Determine provider, deployer, importer, distributor and representative roles from actual activity. Assess rebranding, substantial modification or purpose change for a role change under Article 25. Name the business owner and approval authority.",
      "reason": "Mit dem Einkauf eines Produkts steht die eigene Rolle für spätere Veränderungen noch nicht fest.",
      "reasonEn": "Purchasing a product does not settle the organisation’s role for every later modification.",
      "whenRequired": "Als interne Steuerungsregel für KI im festgelegten Geltungsbereich.",
      "whenRequiredEn": "As an internal governance rule for AI within the defined scope.",
      "sources": [
        "AI Act Arts. 3, 25",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d25-c05",
      "title": "Aktualisierung",
      "titleEn": "Update",
      "description": "Neue Einsätze, Änderungen, Vorfälle und Außerbetriebnahmen aktualisieren den Datensatz mit Datum und Entscheidung. Der Status unterscheidet Erprobung, Freigabe, Betrieb, Aussetzung und Stilllegung; fällige gesetzliche Schritte und ihre Termine bleiben sichtbar.",
      "descriptionEn": "Update records for new uses, changes, incidents and retirement with dates and decisions. Distinguish trial, approval, operation, suspension and retirement, retaining visibility of applicable legal actions and due dates.",
      "reason": "Eine bloße Liste von Produktnamen trägt die Steuerung über den gesamten Lebenszyklus nicht.",
      "reasonEn": "A list of product names cannot support lifecycle governance.",
      "whenRequired": "Als interne Steuerungsregel für KI im festgelegten Geltungsbereich.",
      "whenRequiredEn": "As an internal governance rule for AI within the defined scope.",
      "sources": [
        "AI Act Arts. 6, 25, 49; internal governance practice",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    }
  ],
  "D26": [
    {
      "id": "d26-c01",
      "title": "Auslöser",
      "titleEn": "Triggers",
      "description": "Die FRIA-Pflicht nach Artikel 27 wird für Betreiber des öffentlichen Rechts, private Erbringer öffentlicher Dienste und Betreiber der Systeme aus Anhang III Nummer 5 Buchstaben b und c geprüft. Sie betrifft Artikel-6-Absatz-2-Systeme, ausgenommen Anhang III Nummer 2. Eine allgemeine KI-Auswirkungsanalyse kann darüber hinaus sinnvoll sein, ist aber nicht automatisch eine gesetzliche FRIA.",
      "descriptionEn": "Assess Article 27 FRIA applicability for public-law bodies, private providers of public services and deployers of Annex III 5(b) and (c) systems. It concerns Article 6(2) systems except Annex III point 2. A broader AI impact assessment can be useful without automatically being a statutory FRIA.",
      "reason": "Allein die Einstufung als Hochrisikosystem verpflichtet nicht jeden privaten Betreiber zur Grundrechte-Folgenabschätzung nach Artikel 27.",
      "reasonEn": "High-risk status alone does not require every private deployer to perform Article 27 FRIA.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Art. 27(1)",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d26-c02",
      "title": "Betroffene und Kontext",
      "titleEn": "Affected Persons and Context",
      "description": "Vor der ersten Nutzung werden betroffene Prozesse, Verwendungszweck, Einsatzzeitraum und Häufigkeit sowie voraussichtlich betroffene Personen und Gruppen beschrieben. Lieferanteninformationen werden auf den konkreten Einsatz übertragen und nicht ungeprüft übernommen.",
      "descriptionEn": "Before first use, describe processes, intended purpose, duration, frequency and likely affected individuals and groups. Apply provider information to the actual use rather than copying it without assessment.",
      "reason": "Erst der konkrete Einsatzkontext des Betreibers macht die Abschätzung aussagekräftig; Lieferantenangaben allein genügen dafür nicht.",
      "reasonEn": "The deployer’s context is essential to the assessment.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Art. 27(1)(a)–(c), (2)",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d26-c03",
      "title": "Risiken für Grundrechte",
      "titleEn": "Risks to Fundamental Rights",
      "description": "Mögliche Schäden für die betroffenen Personen und Gruppen werden konkret nach Eintrittsbedingungen, Schwere und verfügbaren Schutzmaßnahmen bewertet. Diskriminierung, Beeinträchtigung der Privatsphäre und ungerechtfertigte Einschränkung von Rechten werden berücksichtigt; bloße Unternehmensschäden reichen nicht aus.",
      "descriptionEn": "Assess potential harm to affected individuals and groups through concrete conditions, severity and safeguards, including discrimination, privacy harm and unjustified restrictions of rights. Corporate losses alone are insufficient.",
      "reason": "Eine rein sicherheitstechnische Schadensbewertung erfasst gerade jene Beeinträchtigungen der Grundrechte nicht, um die es hier geht.",
      "reasonEn": "A cybersecurity-only impact score misses the FRIA purpose.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Art. 27(1)(d)",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d26-c04",
      "title": "Maßnahmen und Aufsicht",
      "titleEn": "Measures and Oversight",
      "description": "Menschliche Aufsicht gemäß Gebrauchsanweisung sowie Maßnahmen bei Eintritt der Risiken werden festgelegt. Interne Zuständigkeiten, Beschwerdewege, Eskalation und Abhilfe werden beschrieben. Ergebnisse werden der Marktüberwachungsbehörde nach Artikel 27 Absatz 3 mitgeteilt; Änderungen lösen eine Aktualisierung aus.",
      "descriptionEn": "Define human oversight under the instructions and measures if risks materialise, including internal ownership, complaints, escalation and remedies. Notify results to the market surveillance authority under Article 27(3) and update when relevant elements change.",
      "reason": "Eine Abschätzung ohne festgelegte Zuständigkeiten und ohne die vorgesehene Mitteilung an die Marktüberwachungsbehörde bleibt unvollständig.",
      "reasonEn": "Writing an assessment without governance or the applicable notification is incomplete.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Art. 27(1)(e)–(f), (2)–(3)",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d26-c05",
      "title": "Verknüpfung mit DSFA",
      "titleEn": "Link to DPIA",
      "description": "Eine DSFA wird nur bei entsprechendem datenschutzrechtlichem Auslöser durchgeführt. Decken vorhandene DSFA- oder andere zulässige Folgenabschätzungen einzelne FRIA-Anforderungen ab, werden diese verlinkt und fehlende Grundrechtsaspekte ergänzt; personenbezogene Daten allein lösen nicht jede DSFA aus.",
      "descriptionEn": "Perform a DPIA only where its data-protection trigger is met. Link parts already covered by a DPIA or other permissible assessment and add missing fundamental-rights aspects; personal data alone does not trigger every DPIA.",
      "reason": "Die Mitnutzung vorhandener Folgenabschätzungen erspart Doppelarbeit, solange die beiden Anwendbarkeitsprüfungen sauber getrennt bleiben.",
      "reasonEn": "Reuse avoids duplication without confusing the two applicability tests.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Art. 27(2), (4); GDPR Art. 35",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    }
  ],
  "D27": [
    {
      "id": "d27-c01",
      "title": "Systembeschreibung",
      "titleEn": "System Description",
      "description": "System, Anbieter, Version, Verwendungszweck, Interaktionen mit Hard- und Software, Bereitstellungsform und notwendige Betriebsumgebung werden nach Anhang IV beschrieben. Die Dokumentation bezieht sich auf die tatsächlich bewertete Version.",
      "descriptionEn": "Describe system, provider, version, intended purpose, hardware and software interactions, supply form and required operating environment under Annex IV. Tie documentation to the version actually assessed.",
      "reason": "Eine allgemeine Architekturübersicht lässt offen, welches Produkt in welcher Version tatsächlich bewertet wurde.",
      "reasonEn": "A generic architecture slide does not identify the assessed product.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Art. 11; Annex IV(1)",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d27-c02",
      "title": "Entwicklung und Daten",
      "titleEn": "Development and Data",
      "description": "Entwurf, Entwicklungsverfahren, Systemlogik und wesentliche Entscheidungen werden nachvollziehbar dokumentiert. Datenherkunft, Aufbereitung, Trainings-, Validierungs- und Testverfahren sowie relevante vorab bestimmte Änderungen werden mit D60 und den technischen Nachweisen verknüpft.",
      "descriptionEn": "Document design, development, system logic and significant decisions, linking data provenance, preparation, training, validation, testing and relevant predetermined changes to D60 and technical evidence.",
      "reason": "Modellnamen allein erlauben keine Überprüfung; nachvollziehbar müssen Entwurf, Systemlogik und Datenherkunft sein.",
      "reasonEn": "Documentation must support verification rather than only list model names.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Annex IV(2)",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d27-c03",
      "title": "Leistung und Grenzen",
      "titleEn": "Performance and Limitations",
      "description": "Leistungsgrenzen, Genauigkeit, Robustheit und Cybersicherheit werden mit geeigneten Metriken, Testbedingungen, Ergebnissen und relevanten Personengruppen belegt. Eingabebedingungen und vorhersehbarer Fehlgebrauch werden berücksichtigt; Ergebnisse werden nicht über den geprüften Einsatzkontext hinaus verallgemeinert.",
      "descriptionEn": "Evidence performance limits, accuracy, robustness and cybersecurity through appropriate metrics, test conditions, results and relevant groups. Address input conditions and foreseeable misuse without generalising results beyond tested use.",
      "reason": "Was eine Leistungsaussage trägt, ergibt sich aus den Bedingungen, unter denen sie gemessen wurde.",
      "reasonEn": "Test context determines what a performance claim supports.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Arts. 13, 15; Annex IV(2)–(3)",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d27-c04",
      "title": "Risikomanagement und Aufsicht",
      "titleEn": "Risk Management and Oversight",
      "description": "Die Dokumentation umfasst Aufsicht und Überwachung, das Risikomanagement nach Artikel 9, relevante Lebenszyklusänderungen, verwendete Normen oder gleichwertige Lösungen, die EU-Konformitätserklärung und den Post-Market-Monitoring-Plan. Jeder Bestandteil erhält eine konkrete Fundstelle oder eine begründete Nichtanwendbarkeit.",
      "descriptionEn": "Include oversight and monitoring, Article 9 risk management, relevant lifecycle changes, standards or equivalent solutions, the EU declaration of conformity and the post-market monitoring plan. Give each element an actual evidence location or justified non-applicability.",
      "reason": "Anhang IV verlangt mehrere eigenständige Bestandteile; fehlt einer davon, bleibt die technische Dokumentation unvollständig.",
      "reasonEn": "The original clause omitted several distinct Annex IV components.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Annex IV(3)–(9)",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d27-c05",
      "title": "Aktualität",
      "titleEn": "Currency",
      "description": "Vor Inverkehrbringen oder Inbetriebnahme liegt die erforderliche Dokumentation vor. Änderungen werden versioniert; Freigaben, Konformitätsentscheidungen und Aufbewahrung nach Artikel 18 bleiben nachvollziehbar. Vereinfachte zulässige Dokumentationswege ersetzen nicht die inhaltliche Konformität.",
      "descriptionEn": "Prepare required documentation before placing on the market or putting into service. Version changes and preserve approvals, conformity decisions and Article 18 retention. Permitted simplified documentation does not remove substantive conformity.",
      "reason": "Die jeweils aktuelle Fassung und die aufbewahrten früheren Nachweise erfüllen unterschiedliche Zwecke und ersetzen einander nicht.",
      "reasonEn": "A current file and retained historical evidence serve different purposes.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Arts. 11, 18",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    }
  ],
  "D28": [
    {
      "id": "d28-c01",
      "title": "Konformitätsbewertungsverfahren",
      "titleEn": "Conformity Assessment Procedure",
      "description": "Das Verfahren wird aus Systemart, Artikel 43, einschlägigem Produktrecht und anwendbaren Normen bestimmt. Die erforderliche Beteiligung einer notifizierten Stelle wird begründet; nicht jedes Hochrisiko-System verlangt eine externe Zertifizierung. Bewertung und relevante Änderungen werden dokumentiert.",
      "descriptionEn": "Determine the procedure from system type, Article 43, relevant product legislation and standards. Justify any notified-body involvement; not every high-risk system requires external certification. Document assessment and relevant modifications.",
      "reason": "Ohne zuvor bestimmtes Bewertungsverfahren fehlt der späteren Konformitätserklärung die tragfähige Grundlage.",
      "reasonEn": "Conformity route selection precedes a conformity declaration.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Art. 43",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d28-c02",
      "title": "EU-Konformitätserklärung",
      "titleEn": "EU Declaration of Conformity",
      "description": "Die verantwortliche Person erstellt und unterzeichnet die Erklärung nach Anhang V: Systemidentifikation, Anbieteranschrift und gegebenenfalls Bevollmächtigter, alleinige Verantwortung, Konformität, einschlägige Normen oder Spezifikationen, gegebenenfalls notifizierte Stelle und Zertifikat sowie Ort, Datum, Name und Funktion. Weitere einschlägige Harmonisierungsrechtsakte werden in einer gemeinsamen Erklärung berücksichtigt; Aufbewahrung und Aktualisierung folgen Artikel 47.",
      "descriptionEn": "The responsible person prepares and signs the Annex V declaration identifying the system, provider address and representative where applicable, sole responsibility, conformity, standards or specifications, any notified body and certificate, and place, date, name and function. Address other applicable harmonisation acts in a single declaration and apply Article 47 retention and updates.",
      "reason": "Eine Vorlage ist weder eine unterzeichnete Erklärung noch ein Beleg für die abgeschlossene Konformitätsbewertung.",
      "reasonEn": "A template is not a signed declaration or proof of completed conformity assessment.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Art. 47; Annex V",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d28-c03",
      "title": "CE-Kennzeichnung",
      "titleEn": "CE Marking",
      "description": "Die CE-Kennzeichnung wird nach Artikel 48 sichtbar, lesbar und dauerhaft angebracht. Bei digital bereitgestellten Systemen ist eine leicht zugängliche digitale Kennzeichnung möglich; gegebenenfalls sind Verpackung oder Begleitunterlagen und die Kennnummer der notifizierten Stelle zu berücksichtigen. Die Kennzeichnung erfolgt erst nach Erfüllung der einschlägigen Voraussetzungen.",
      "descriptionEn": "Affix CE marking visibly, legibly and indelibly under Article 48. Digitally supplied systems may use easily accessible digital marking; use packaging or accompanying documentation and a notified-body identifier where applicable. Mark only after applicable prerequisites are fulfilled.",
      "reason": "Das CE-Zeichen ist kein allgemeines Gütesiegel für beliebige KI-Anwendungen.",
      "reasonEn": "CE is not a generic label for every AI application.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Art. 48",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    }
  ],
  "D29": [
    {
      "id": "d29-c01",
      "title": "Überwachungssystem",
      "titleEn": "Monitoring System",
      "description": "Der Anbieter legt im technischen Dossier einen risikogerechten Überwachungsplan fest: Datenquellen, Betreiber-Rückmeldungen, Metriken, Zuständigkeiten, Auswertung und Auslöser für Maßnahmen. Relevante Wechselwirkungen mit anderer KI werden einbezogen. Die Kommissionsvorlage ist nicht als bereits verfügbar zu behaupten; Artikel 72 Absatz 3 nennt für die Leitlinien den 2. September 2027.",
      "descriptionEn": "The provider includes a risk-based monitoring plan in the technical file covering sources, deployer feedback, metrics, owners, analysis and action triggers, including relevant interactions with other AI. Do not claim the Commission template is already available; Article 72(3) sets 2 September 2027 for guidance.",
      "reason": "Die Beobachtung nach dem Inverkehrbringen ist ein aktiver Prozess und kein bloßes Postfach für Meldungen.",
      "reasonEn": "Post-market monitoring is an active process, not merely an incident inbox.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Art. 72",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d29-c02",
      "title": "Meldung schwerwiegender Vorfälle",
      "titleEn": "Reporting of Serious Incidents",
      "description": "Schwerwiegende Vorfälle werden nach Artikel 73 unverzüglich nach festgestelltem oder hinreichend wahrscheinlichem Kausalzusammenhang und spätestens 15 Tage nach Kenntnis gemeldet. Bei weitverbreitetem Verstoß oder Artikel 3 Nummer 49 Buchstabe b gelten unverzüglich und höchstens zwei Tage; bei Tod gelten der besondere Kausalitätsauslöser und höchstens zehn Tage. Empfänger, sektorale Sonderregeln und gegebenenfalls die Zuständigkeit des KI-Büros nach Artikel 75 werden geprüft. Fehlfunktionen ohne gesetzlichen Vorfalltatbestand sind nicht automatisch meldepflichtig.",
      "descriptionEn": "Report serious incidents under Article 73 immediately on an established or reasonably likely causal link and no later than 15 days after awareness. Widespread infringement or Article 3(49)(b) incidents require immediate reporting within two days; death has the specific causal trigger and a ten-day maximum. Check recipients, sector-specific provisions and any AI Office competence under Article 75. Malfunctions without the statutory incident conditions are not automatically reportable.",
      "reason": "Für die einzelnen Vorfallkategorien gelten unterschiedliche Höchstfristen, und auch eine zunächst unvollständige Erstmeldung kann die Fristwahrung sichern.",
      "reasonEn": "Different incident categories have different outer limits; incomplete initial reports can support timely reporting.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Arts. 73, 75(1a)",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d29-c03",
      "title": "Korrekturmaßnahmen",
      "titleEn": "Corrective Actions",
      "description": "Bei begründetem Verdacht auf Nichtkonformität veranlasst der Anbieter unverzüglich angemessene Korrektur, Deaktivierung, Rücknahme oder Rückruf und informiert die relevanten Beteiligten. Bei Risiken werden Ursachen untersucht und zuständige Stellen informiert. Untersuchungen dürfen spätere Ursachenbewertungen nicht durch unangekündigte Veränderungen beeinträchtigen.",
      "descriptionEn": "On reasoned suspected nonconformity, the provider immediately takes appropriate correction, disabling, withdrawal or recall action and informs relevant parties. Investigate risks and notify competent bodies. Investigations must not impair later cause assessment through unnotified alterations.",
      "reason": "Nicht jeder Mangel führt zum Rückruf, doch eine ausgelöste Korrekturpflicht duldet keinen Aufschub bis zur nächsten Überprüfung.",
      "reasonEn": "Not every defect requires recall, but an applicable corrective duty cannot await the next review.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Arts. 20, 73(6)",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    }
  ],
  "D30": [
    {
      "id": "d30-c01",
      "title": "Produktbeschreibung",
      "titleEn": "Product Description",
      "description": "Produktidentität, Zweck, Softwareversionen, Hardwareaufbau, Schnittstellen und Nutzerinformationen werden nach Anhang VII beschrieben. Die CRA-Einstufung und etwaige Ausnahmen beziehen sich auf das tatsächliche Produkt einschließlich relevanter integrierter Fernverarbeitung.",
      "descriptionEn": "Describe product identity, purpose, software versions, hardware, interfaces and user information under Annex VII. Base CRA classification and exceptions on the actual product, including relevant integrated remote processing.",
      "reason": "Eine unternehmensweite Sicherheitsrichtlinie ist keine technische Dokumentation für ein einzelnes Produkt.",
      "reasonEn": "An enterprise security policy is not a product technical file.",
      "whenRequired": "Für erfasste Produkte und Rollen ab dem jeweiligen gesetzlichen Anwendungsdatum.",
      "whenRequiredEn": "For covered products and roles from the applicable statutory commencement date.",
      "sources": [
        "CRA Arts. 2, 31; Annex VII(1)",
        "CRA Arts. 69, 71"
      ]
    },
    {
      "id": "d30-c02",
      "title": "Erfüllung der Grundanforderungen",
      "titleEn": "Fulfilment of Essential Requirements",
      "description": "Eine Anforderungsmatrix ordnet jede einschlägige Anforderung aus Anhang I dem Design, Prüfresultat und Nachweis zu. Nichtanwendbarkeit wird aus der Produktrisikobewertung begründet. Das Dossier umfasst Entwicklung, Produktion, Schwachstellenbehandlung, SBOM, sichere Updates, Support-Begründung, Testberichte, Normen oder alternative Lösungen und die Erklärung.",
      "descriptionEn": "Map each applicable Annex I requirement to design, test result and evidence. Justify non-applicability from product risk assessment. Include development, production, vulnerability handling, SBOM, secure updates, support rationale, test reports, standards or alternatives and the declaration.",
      "reason": "Die Abdeckung ist je Anforderung einzeln nachzuweisen und nicht pauschal zu behaupten.",
      "reasonEn": "Coverage must be evidenced requirement by requirement rather than asserted globally.",
      "whenRequired": "Für erfasste Produkte und Rollen ab dem jeweiligen gesetzlichen Anwendungsdatum.",
      "whenRequiredEn": "For covered products and roles from the applicable statutory commencement date.",
      "sources": [
        "CRA Arts. 13, 31; Annexes I, VII",
        "CRA Arts. 69, 71"
      ]
    },
    {
      "id": "d30-c03",
      "title": "Konformitätsbewertung",
      "titleEn": "Conformity Assessment",
      "description": "Das Verfahren nach Artikel 32 wird aus Produktkategorie und den zulässigen Nachweiswegen bestimmt. Erforderliche externe Bewertungen werden vor Freigabe abgeschlossen; interne Kontrolle ist nicht für jede Produktklasse frei wählbar. Änderungen werden auf erneute Bewertung geprüft.",
      "descriptionEn": "Select the Article 32 route from product category and permitted assurance paths. Complete required external assessments before release; internal control is not freely available to every product class. Assess changes for reassessment.",
      "reason": "Über den Bewertungsweg entscheidet die Produkteinstufung, nicht das verfügbare Budget oder ein vorhandenes Zertifikat.",
      "reasonEn": "Classification determines the conformity route, not a preferred budget or existing certificate.",
      "whenRequired": "Für erfasste Produkte und Rollen ab dem jeweiligen gesetzlichen Anwendungsdatum.",
      "whenRequiredEn": "For covered products and roles from the applicable statutory commencement date.",
      "sources": [
        "CRA Arts. 7–8, 32",
        "CRA Arts. 69, 71"
      ]
    },
    {
      "id": "d30-c04",
      "title": "EU-Konformitätserklärung & CE",
      "titleEn": "EU DoC & CE",
      "description": "Die Erklärung nach Artikel 28 und Anhang V identifiziert Produkt, Hersteller, Verantwortung, Konformität, einschlägige Normen oder Spezifikationen, gegebenenfalls notifizierte Stelle sowie Unterzeichnung. CE-Kennzeichnung folgt Artikeln 29–30. Vollständige oder vereinfachte Erklärung wird mitgeliefert; technische Dokumentation und Erklärung bleiben mindestens zehn Jahre ab Inverkehrbringen oder für die längere Supportdauer verfügbar.",
      "descriptionEn": "The Article 28 and Annex V declaration identifies product, manufacturer, responsibility, conformity, standards or specifications, any notified body and signatory. Apply CE rules in Articles 29–30 and supply the full or simplified declaration. Retain the technical file and declaration for at least ten years after placing on the market or the longer support period.",
      "reason": "Eine nicht unterzeichnete Vorlage stellt keine ausgefertigte Konformitätserklärung dar.",
      "reasonEn": "An unsigned template is not a completed declaration.",
      "whenRequired": "Für erfasste Produkte und Rollen ab dem jeweiligen gesetzlichen Anwendungsdatum.",
      "whenRequiredEn": "For covered products and roles from the applicable statutory commencement date.",
      "sources": [
        "CRA Arts. 13(13), (20), 28–30; Annexes V–VI",
        "CRA Arts. 69, 71"
      ]
    }
  ],
  "D31": [
    {
      "id": "d31-c01",
      "title": "CVD-Prozess",
      "titleEn": "CVD Process",
      "description": "Die veröffentlichte CVD-Regelung beschreibt erreichbare Kontaktstelle, sichere Übermittlung, Eingangsbestätigung, Bewertung, Abhilfe und abgestimmte Offenlegung. Die Kontaktstelle bietet auch einen nicht ausschließlich automatisierten Kommunikationsweg. Gesetzliche Meldefristen dürfen nicht von einer abgestimmten Veröffentlichungsfrist abhängig gemacht werden.",
      "descriptionEn": "The published CVD policy describes a reachable contact, secure submission, acknowledgement, assessment, remediation and coordinated disclosure. Provide a communication route that is not exclusively automated. Statutory reporting deadlines must not depend on an agreed public-disclosure date.",
      "reason": "Die Abstimmung mit Meldenden und die gesetzliche Meldung an die Behörden verlaufen unabhängig voneinander.",
      "reasonEn": "CVD communication and mandatory authority reporting are separate processes.",
      "whenRequired": "Für erfasste Produkte und Rollen ab dem jeweiligen gesetzlichen Anwendungsdatum.",
      "whenRequiredEn": "For covered products and roles from the applicable statutory commencement date.",
      "sources": [
        "CRA Art. 13(8), (17); Annex I Part II(5)–(6)",
        "CRA Arts. 69, 71"
      ]
    },
    {
      "id": "d31-c02",
      "title": "SBOM",
      "titleEn": "Software Bill of Materials",
      "description": "Eine gängige maschinenlesbare SBOM dokumentiert mindestens die obersten Abhängigkeiten des Produkts und wird mit Produktversion und Schwachstellenzuordnung gepflegt. Behördenzugriff und Schutz vertraulicher Bestandteile werden geregelt. Die SBOM muss nicht pauschal öffentlich veröffentlicht werden; bei gewählter Bereitstellung an Nutzer wird der Zugang erläutert.",
      "descriptionEn": "Maintain a commonly used machine-readable SBOM covering at least top-level product dependencies, linked to versions and vulnerability analysis. Govern authority access and protection of confidential components. Universal public publication is not required; explain access if supplying it to users.",
      "reason": "Der CRA verlangt eine maschinenlesbare SBOM, nicht deren allgemeine Veröffentlichung.",
      "reasonEn": "The CRA distinguishes creating an SBOM from making it publicly available.",
      "whenRequired": "Für erfasste Produkte und Rollen ab dem jeweiligen gesetzlichen Anwendungsdatum.",
      "whenRequiredEn": "For covered products and roles from the applicable statutory commencement date.",
      "sources": [
        "CRA Annex I Part II(1); Annex II(9); Art. 13(25)",
        "CRA Arts. 69, 71"
      ]
    },
    {
      "id": "d31-c03",
      "title": "Meldung an ENISA",
      "titleEn": "Reporting to ENISA",
      "description": "Der Hersteller meldet aktiv ausgenutzte Produktschwachstellen und schwere Produktsicherheitsvorfälle gleichzeitig an das koordinierende CSIRT und ENISA über die gemeinsame Plattform. Beide beginnen mit unverzüglich, spätestens 24 Stunden nach Kenntnis, und ergänzender Meldung spätestens 72 Stunden nach Kenntnis. Schwachstellen-Abschluss: spätestens 14 Tage nach verfügbarer Korrektur oder Minderung; Vorfalls-Abschluss: binnen eines Monats nach der 72-Stunden-Meldung. Angeforderte Zwischenberichte und die erforderliche Nutzerinformation werden dokumentiert.",
      "descriptionEn": "The manufacturer reports actively exploited product vulnerabilities and severe product-security incidents simultaneously to the coordinating CSIRT and ENISA through the single platform. Both begin without undue delay within 24 hours of awareness, with further notification within 72 hours of awareness. Vulnerability final report: within 14 days of available correction or mitigation; incident final report: within one month of the 72-hour notification. Record requested intermediate reports and required user information.",
      "reason": "Schwachstellen und schwere Vorfälle folgen je eigenen Meldestufen, deren Abschlussmeldungen an unterschiedliche Auslöser gebunden sind.",
      "reasonEn": "The original single 24-hour instruction omitted both reporting sequences and different final-report triggers.",
      "whenRequired": "Für erfasste Produkte und Rollen ab dem jeweiligen gesetzlichen Anwendungsdatum.",
      "whenRequiredEn": "For covered products and roles from the applicable statutory commencement date.",
      "sources": [
        "CRA Art. 14(1)–(6), (8), Art. 16",
        "CRA Arts. 69, 71"
      ]
    }
  ],
  "D32": [
    {
      "id": "d32-c01",
      "title": "Physischer Schutz",
      "titleEn": "Physical Protection",
      "description": "Der Verantwortliche erfasst Prototypenarten, Schutzbedarf, Standorte und zugelassene Tätigkeiten. Sichtschutz, Zutrittszonen, Aufbewahrung und Besucherbegleitung werden nach Kundenanforderungen umgesetzt; die Wirksamkeit wird am tatsächlichen Standort überprüft. Schutz vor Einblick von außen wird ebenso betrachtet wie unbefugter Zutritt.",
      "descriptionEn": "The owner records prototype types, protection needs, sites and permitted activities. Implement screening from view, access zones, storage and visitor escort according to customer requirements, and verify effectiveness at the actual site. Address observation from outside as well as unauthorised entry.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "Applicable VDA ISA prototype-protection catalogue; agreed customer requirements"
      ]
    },
    {
      "id": "d32-c02",
      "title": "Foto-/Filmaufnahmen",
      "titleEn": "Photo/Film Recordings",
      "description": "Foto-, Video- und sonstige Aufnahmen von Prototypen benötigen eine befugte Freigabe für Zweck, Motiv, Person und Gerät. Übertragung, Kennzeichnung, Aufbewahrung und Veröffentlichung werden geregelt. Nicht freigegebene Aufnahmen und private Geräte werden entsprechend dem Standortkonzept verhindert; eine Aufnahmegenehmigung ist keine Veröffentlichungsgenehmigung.",
      "descriptionEn": "Photographs, videos and other prototype recordings require authorised approval of purpose, subject, person and device. Govern transfer, labelling, storage and publication. Prevent unauthorised recordings and private-device use according to the site concept; permission to capture is not permission to publish.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "Applicable VDA ISA prototype-protection catalogue; agreed customer requirements"
      ]
    },
    {
      "id": "d32-c03",
      "title": "Transport und Erprobung",
      "titleEn": "Transport and Testing",
      "description": "Vor Transporten, Erprobungen oder Veranstaltungen legt der Verantwortliche Verpackung und Abdeckung, Übergaben, Abstellmöglichkeiten, Strecken- bzw. Veranstaltungsbedingungen und Störungsmaßnahmen fest. Beauftragte Fahrer und Dienstleister erhalten die erforderlichen Anweisungen; Rückgabe und Abweichungen werden dokumentiert. Nicht ausgeübte Tätigkeiten werden begründet ausgeschlossen.",
      "descriptionEn": "Before transport, testing or events, the owner defines packaging and concealment, handovers, parking arrangements, route or event conditions and disruption responses. Assigned drivers and providers receive the necessary instructions; record returns and deviations. Justify exclusion of activities not performed.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "Applicable VDA ISA prototype-protection catalogue; agreed customer requirements"
      ]
    },
    {
      "id": "d32-c04",
      "title": "Geheimhaltung und Dritte",
      "titleEn": "Confidentiality and Third Parties",
      "description": "Vertraulichkeitsanforderungen werden vor dem Zugang an Beschäftigte, Besucher und Dienstleister vermittelt und, soweit erforderlich, vertraglich vereinbart. Der Verantwortliche prüft die Weitergabe an Unterauftragnehmer und hält Zutrittsfreigaben und Verpflichtungen nachvollziehbar fest. Ein unterschriebenes NDA ersetzt weder die technische noch die physische Zugangsbeschränkung.",
      "descriptionEn": "Communicate confidentiality requirements to personnel, visitors and providers before access and establish contractual commitments where required. The owner checks onward sharing with subcontractors and records access approvals and commitments. A signed NDA replaces neither technical nor physical access restrictions.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "Applicable VDA ISA prototype-protection catalogue; agreed customer requirements"
      ]
    }
  ],
  "D33": [
    {
      "id": "d33-c01",
      "title": "Register wesentlicher Auslagerungen",
      "titleEn": "Register of Material Outsourcings",
      "description": "Das Auslagerungsmanagement führt ein aktuelles Register aller Auslagerungsvereinbarungen, einschließlich nicht wesentlicher und gruppeninterner Vereinbarungen. Je Eintrag werden Leistung, Vertragspartner, verantwortlicher Fachbereich, Laufzeit, Standorte und die begründete Wesentlichkeit erfasst; für wesentliche Auslagerungen werden die zusätzlichen Registerangaben ergänzt. Reiner Fremdbezug wird nach dokumentierter Prüfung getrennt behandelt.",
      "descriptionEn": "Outsourcing management maintains a current register of all outsourcing arrangements, including non-material and intra-group arrangements. Each entry identifies the service, contracting party, business owner, term, locations and justified materiality; material arrangements receive the additional register fields. Ordinary external procurement is distinguished through a recorded assessment.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "MaRisk AT 9(14); EBA/GL/2019/02 paragraphs 54-55",
        "DORA Article 28(3), where applicable"
      ]
    },
    {
      "id": "d33-c02",
      "title": "Wesentlichkeitsanalyse",
      "titleEn": "Materiality Analysis",
      "description": "Vor einer Auslagerung und bei wesentlichen Änderungen bewertet der zuständige Bereich die Risiken der Leistung, des Anbieters und möglicher Weiterverlagerungen. Die Beurteilung berücksichtigt Abhängigkeiten, Konzentrationen, Kontrollierbarkeit und Auswirkungen eines Ausfalls. Entscheidung, Beteiligung der Kontrollfunktionen, Auflagen und nächste Überprüfung werden festgehalten.",
      "descriptionEn": "Before outsourcing and following material changes, the responsible function assesses risks of the service, provider and potential sub-outsourcing. It considers dependencies, concentration, controllability and consequences of failure. Record the decision, control-function involvement, conditions and next review.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "MaRisk AT 9(2)"
      ]
    },
    {
      "id": "d33-c03",
      "title": "Zentraler Auslagerungsbeauftragter",
      "titleEn": "Central Outsourcing Officer",
      "description": "Die Geschäftsleitung weist die Verantwortung für das Auslagerungsmanagement ausdrücklich zu und stellt eine zur Komplexität passende Organisation bereit. Das zuständige Management berichtet mindestens jährlich und anlassbezogen über wesentliche Auslagerungen, Vertragsleistung, Überwachbarkeit und erforderliche Maßnahmen; zulässige proportionale Erleichterungen werden begründet.",
      "descriptionEn": "Management explicitly allocates outsourcing oversight and provides an organisation proportionate to complexity. The responsible management reports at least annually and when events require on material outsourcing, contractual performance, monitorability and necessary action; any permitted proportional simplifications are justified.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "MaRisk AT 9(12)-(13)"
      ]
    },
    {
      "id": "d33-c04",
      "title": "Weiterverlagerung und Exit",
      "titleEn": "Sub-Outsourcing and Exit",
      "description": "Verträge und Überwachung regeln zulässige Weiterverlagerungen sowie die Fortführung, Rückübertragung oder Übertragung der Leistung bei Beendigung oder Störung. Für wesentliche Auslagerungen werden realistische Handlungsoptionen, Datenübergabe, Ressourcen und Abhängigkeiten beschrieben. Bei IKT-Dienstleistungen wird zusätzlich die einschlägige DORA-Vertrags- und Ausstiegsregelung geprüft; identische Nachweise werden verknüpft statt doppelt geführt.",
      "descriptionEn": "Contracts and oversight address permitted sub-outsourcing and service continuation, reintegration or transfer upon termination or disruption. For material outsourcing, document realistic options, data handover, resources and dependencies. For ICT services, also assess the applicable DORA contract and exit requirements; link identical evidence instead of maintaining duplicate records.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "MaRisk AT 9",
        "DORA Articles 28-30, where applicable"
      ]
    }
  ],
  "D34": [
    {
      "id": "d34-c01",
      "title": "Identifikation kritischer Prozesse",
      "titleEn": "Identification of Critical Processes",
      "description": "Die Analyse erfasst Produkte, Dienste und unterstützende Tätigkeiten im festgelegten Geltungsbereich. Verantwortliche bestimmen anhand vereinbarter Auswirkungskriterien, welche Tätigkeiten zeitlich priorisiert werden müssen. Personal, Informationen, Technik, Versorgung, Standorte und benötigte Lieferanten werden zugeordnet. Die Auswahl wird begründet und bestätigt; ein vorhandenes IT-Kritikalitätskennzeichen ersetzt diese Analyse nicht.",
      "descriptionEn": "The analysis identifies products, services and supporting activities within scope. Owners use agreed impact criteria to determine which activities require time-based priority. Personnel, information, technology, utilities, premises and necessary suppliers are linked. Selection is justified and confirmed; an existing IT criticality label does not replace this analysis.",
      "reason": "Prioritäten sollen aus Ausfallfolgen entstehen, nicht aus der Lautstärke einzelner Anforderungen.",
      "reasonEn": "Priorities should follow disruption effects, not the prominence of individual requests.",
      "whenRequired": "Für die Kontinuitätsanalyse; ausdrücklich erforderlich für CIR-erfasste Einrichtungen und bei Anwendbarkeit des DORA Artikels 11.5.",
      "whenRequiredEn": "For continuity analysis; expressly required for CIR-covered entities and where DORA Article 11(5) applies.",
      "sources": [
        "ISO/IEC 27001:2022 A.5.30",
        "ISO 22301:2019 8.2.2(a)–(b),(f)–(h)",
        "Implementing Regulation (EU) 2024/2690 Annex 4.1.3, where applicable",
        "Regulation (EU) 2022/2554 Article 11(5), where applicable"
      ]
    },
    {
      "id": "d34-c02",
      "title": "Auswirkungen über Zeit",
      "titleEn": "Impact over Time",
      "description": "Für jede betrachtete Tätigkeit werden Auswirkungen einer Unterbrechung über begründete Zeitintervalle und relevante Spitzenzeiten beurteilt. Kriterien erfassen etwa Sicherheit von Menschen, rechtliche und vertragliche Folgen, Leistungserbringung, finanzielle Verluste und andere wesentliche Schäden. Qualitative und quantitative Angaben erhalten Quellen und Annahmen. Der Zeitpunkt untragbarer Folgen wird begründet; Eintrittswahrscheinlichkeit wird getrennt in der Risikobewertung behandelt.",
      "descriptionEn": "Each assessed activity records disruption effects over justified intervals and relevant peak periods. Criteria cover matters such as human safety, legal and contractual consequences, delivery, financial loss and other material harm. Qualitative and quantitative values identify sources and assumptions. The point of unacceptable impact is justified; likelihood is addressed separately in risk assessment.",
      "reason": "Schaden über Zeit und Eintrittswahrscheinlichkeit beantworten unterschiedliche Fragen.",
      "reasonEn": "Impact over time and likelihood answer different questions.",
      "whenRequired": "Bei der Bewertung der Auswirkungen priorisierungsrelevanter Unterbrechungen.",
      "whenRequiredEn": "When assessing disruption impacts relevant to prioritisation.",
      "sources": [
        "ISO 22301:2019 8.2.2(a),(c)–(d), 8.2.3",
        "Implementing Regulation (EU) 2024/2690 Annex 4.1.3, where applicable"
      ]
    },
    {
      "id": "d34-c03",
      "title": "MTPD, RTO, RPO",
      "titleEn": "MTPD, RTO, RPO",
      "description": "Es werden der Zeitraum bis zu untragbaren Folgen (Maximum Tolerable Period of Disruption, MTPD) und eine davor liegende Wiederherstellungszeit für festgelegte Mindestleistung (Recovery Time Objective, RTO) begründet. Wo Datenverlust relevant ist, wird ein gesondertes Wiederherstellungspunktziel (Recovery Point Objective, RPO) festgelegt und mit Sicherung und Wiederherstellung abgestimmt. Diese Ziele sind Anforderungen, keine bereits erreichten Testergebnisse. Abweichungen der vorhandenen Fähigkeiten erhalten Maßnahmen.",
      "descriptionEn": "The period until impact becomes unacceptable (Maximum Tolerable Period of Disruption, MTPD) and a preceding recovery target for a specified minimum capacity (Recovery Time Objective, RTO) are justified. Where data loss matters, a separate Recovery Point Objective (RPO) is defined and aligned with backup and restoration. These targets are requirements, not already achieved test results. Gaps in existing capabilities receive actions.",
      "reason": "Eine vorhandene tägliche Sicherung darf nicht ohne Prüfung den tolerierbaren Datenverlust bestimmen.",
      "reasonEn": "An existing daily backup must not determine acceptable data loss without assessment.",
      "whenRequired": "Bei Festlegung von Kontinuitätsanforderungen und relevanter Datenverlusttoleranz.",
      "whenRequiredEn": "When defining continuity requirements and relevant data-loss tolerance.",
      "sources": [
        "ISO 22301:2019 8.2.2(d)–(e): MTPD/RTO",
        "ISO/IEC 27001:2022 A.5.30",
        "Implementing Regulation (EU) 2024/2690 Annex 4.1.2(f), 4.1.3, 4.2.2, where applicable",
        "Regulation (EU) 2022/2554 Article 12(6), where applicable"
      ]
    },
    {
      "id": "d34-c04",
      "title": "Abhängigkeiten",
      "titleEn": "Dependencies",
      "description": "Abhängigkeiten und Wechselwirkungen werden mit Art, Richtung, benötigter Kapazität und Verfügbarkeit der Ressource erfasst. Gemeinsame Ausfallpunkte, konkurrierende Ressourcenbedarfe und erforderliche Anlaufreihenfolgen werden bewertet. Bestätigungen von Lieferanten und internen Verantwortlichen werden verknüpft. Unbekannte Annahmen werden nicht als zugesicherte Kapazität behandelt.",
      "descriptionEn": "Dependencies and interdependencies identify their nature, direction, required capacity and resource availability. Common failure points, competing resource demands and necessary start-up sequences are assessed. Supplier and internal owner confirmations are linked. Unknown assumptions are not treated as committed capacity.",
      "reason": "Ein Dienstziel kann trotz ausreichender eigener Ressourcen an vorgelagerten Leistungen scheitern.",
      "reasonEn": "A service target can fail through upstream dependencies despite adequate local resources.",
      "whenRequired": "Bei der Ermittlung benötigter Ressourcen und Wiederherstellungsfähigkeit.",
      "whenRequiredEn": "When determining necessary resources and recovery capability.",
      "sources": [
        "ISO 22301:2019 8.2.2(g)–(h)",
        "ISO/IEC 27001:2022 A.5.30",
        "Implementing Regulation (EU) 2024/2690 Annex 4.1.2(g), 4.1.3, where applicable"
      ]
    },
    {
      "id": "d34-c05",
      "title": "Aktualisierung",
      "titleEn": "Update",
      "description": "Die Analyse wird in geplanten Abständen und bei wesentlichen Veränderungen des Kontexts, der Dienste oder der Abhängigkeiten überprüft. Ergebnisse aus Vorfällen, Übungen und nicht erfüllten Zielen werden berücksichtigt. Verantwortliche bestätigen die überarbeiteten Prioritäten; Änderungen werden in Strategie, Pläne, Ressourcenentscheidungen und Wiederherstellungstests übernommen. Besondere verbindliche Intervalle werden dokumentiert, nicht pauschal für jedes Framework angenommen.",
      "descriptionEn": "The analysis is reviewed at planned intervals and significant changes to context, services or dependencies. Incidents, exercises and unmet objectives inform revisions. Owners confirm revised priorities; changes feed into strategies, plans, resource decisions and recovery tests. Specific binding intervals are documented, not assumed universally for every framework.",
      "reason": "Eine aktualisierte Tabelle ohne angepasste Pläne ändert die tatsächliche Wiederherstellungsfähigkeit nicht.",
      "reasonEn": "An updated table without revised plans does not change actual recoverability.",
      "whenRequired": "Nach dem festgelegten Überprüfungszyklus und wesentlichen Änderungen.",
      "whenRequiredEn": "Under the defined review cycle and significant changes.",
      "sources": [
        "ISO 22301:2019 8.2.1",
        "ISO/IEC 27001:2022 A.5.30",
        "Implementing Regulation (EU) 2024/2690 Annex 4.1.3–4.1.4, where applicable"
      ]
    }
  ],
  "D35": [
    {
      "id": "d35-c01",
      "title": "Sofortmaßnahmen und Alarmierung",
      "titleEn": "Immediate Actions and Alerting",
      "description": "Das Handbuch nennt Zweck, Umfang, Zielgruppe und beobachtbare Aktivierungskriterien. Es legt fest, wer alarmiert, wer entscheidet und welche sofortigen Schutz- und Fortführungsmaßnahmen in welcher Reihenfolge auszuführen sind. Personensicherheit hat Vorrang. Kontakte, Ersatzkanäle und Verweise auf Vorfallmeldungen werden direkt nutzbar hinterlegt.",
      "descriptionEn": "The manual states purpose, scope, audience and observable activation criteria. It specifies who alerts, who decides and which immediate safeguards and continuity actions are performed in what order. Human safety takes priority. Contacts, fallback channels and links to incident reporting are provided in directly usable form.",
      "reason": "Eine Überschrift „Alarmierung“ enthält noch keinen ausführbaren Ablauf.",
      "reasonEn": "A heading named “alerting” does not yet provide executable steps.",
      "whenRequired": "Für die gewählten Kontinuitäts- und Reaktionslösungen.",
      "whenRequiredEn": "For selected continuity and response solutions.",
      "sources": [
        "ISO 22301:2019 8.4.2–8.4.4",
        "ISO/IEC 27001:2022 A.5.29–A.5.30",
        "Implementing Regulation (EU) 2024/2690 Annex 4.1.2(a)–(d), where applicable"
      ]
    },
    {
      "id": "d35-c02",
      "title": "Krisenstab und Rollen",
      "titleEn": "Crisis Team and Roles",
      "description": "Rollenblatt benennt Leitung, Fach- und Technikverantwortliche, Vertretungen, Befugnisse und Übergaben. Rollen dürfen passend kombiniert werden. Informationswege zu Mitarbeitenden, Partnern und Behörden werden festgelegt; erhaltene Warnungen und Empfehlungen werden bewertet. Entscheidungen, Lageänderungen und offene Aufgaben werden während des Einsatzes nachvollziehbar protokolliert.",
      "descriptionEn": "A role sheet identifies leadership, business and technical owners, deputies, authority and handovers. Roles may be combined appropriately. Information routes to staff, partners and authorities are defined, and received warnings and advice assessed. Decisions, situation changes and open actions are recorded traceably during activation.",
      "reason": "Eine erreichbare Vertretung benötigt auch Entscheidungskompetenz und Zugriff auf den Plan.",
      "reasonEn": "An available deputy also needs authority and access to the plan.",
      "whenRequired": "Bei Vorbereitung und Nutzung der Reaktionsstruktur.",
      "whenRequiredEn": "When preparing and using the response structure.",
      "sources": [
        "ISO 22301:2019 8.4.2–8.4.3",
        "Implementing Regulation (EU) 2024/2690 Annex 4.3.2–4.3.3, where applicable",
        "Regulation (EU) 2022/2554 Article 11(7)–(8), subject to Article 16 and microenterprise qualification"
      ]
    },
    {
      "id": "d35-c03",
      "title": "Wiederanlaufpläne",
      "titleEn": "Recovery Plans",
      "description": "Je abgedeckter Aktivität wird ein Arbeitsablauf mit BIA-Verweis, Mindestkapazität, RTO, Datenanforderungen, Abhängigkeiten und Ressourcen ausgefüllt. Jeder Schritt nennt Verantwortliche, Voraussetzungen, Aktion, erwartetes Ergebnis und Nachweis. Technische Anleitungen p35/p36 werden verknüpft. Freigabe, Datenabgleich, Rückstände und Beendigung des Ersatzbetriebs sind festgelegt.",
      "descriptionEn": "For each covered activity, complete a runbook with BIA reference, minimum capacity, RTO, data requirements, dependencies and resources. Each step identifies owner, prerequisites, action, expected result and evidence. Technical p35/p36 instructions are linked. Approval, data reconciliation, backlogs and stand-down of temporary operation are defined.",
      "reason": "Ein nur technisch erreichbares System kann fachlich noch falsche oder unvollständige Daten liefern.",
      "reasonEn": "A technically reachable system may still deliver incorrect or incomplete business data.",
      "whenRequired": "Für priorisierte Aktivitäten und erforderliche Wiederherstellung.",
      "whenRequiredEn": "For prioritised activities and necessary recovery.",
      "sources": [
        "ISO 22301:2019 8.4.4–8.4.5",
        "ISO/IEC 27001:2022 A.5.30",
        "Implementing Regulation (EU) 2024/2690 Annex 4.1.2(e)–(h), where applicable",
        "Regulation (EU) 2022/2554 Article 11(1)–(5), where applicable"
      ]
    },
    {
      "id": "d35-c04",
      "title": "Zugänglichkeit",
      "titleEn": "Accessibility",
      "description": "Verantwortliche halten freigegebene Fassungen und Kontakte am benötigten Ort verfügbar, auch bei Ausfall von Netz, Identitätsdienst oder Endgerät. Unabhängige digitale Kopien oder gesicherte Papierfassungen sind mögliche Lösungen. Zugriff, Lesbarkeit und Aktualität werden erprobt; alte Kopien werden zurückgezogen. Ein gemeinsames Handbuch kann mehrere Frameworks bedienen.",
      "descriptionEn": "Owners keep approved versions and contacts available where needed, including loss of network, identity service or device. Independent digital copies or protected paper versions are possible solutions. Access, readability and currency are exercised, with old copies withdrawn. A shared manual can serve several frameworks.",
      "reason": "Ein Offline-Dokument mit nur online auflösbaren Verweisen ist im Ausfall nicht vollständig nutzbar.",
      "reasonEn": "An offline document with references available only online is not fully usable during an outage.",
      "whenRequired": "Bei Veröffentlichung, Änderung und Übungen.",
      "whenRequiredEn": "At publication, changes and exercises.",
      "sources": [
        "ISO 22301:2019 7.5, 8.4.4.3",
        "Implementing Regulation (EU) 2024/2690 Annex 4.1.4, where applicable"
      ]
    }
  ],
  "D36": [
    {
      "id": "d36-c01",
      "title": "Übungsarten und Frequenz",
      "titleEn": "Exercise Types and Frequency",
      "description": "Das Programm legt aus Risiken und Kontinuitätszielen geeignete Testarten, Abdeckung, Zuständigkeit und Intervalle fest. CIR-Pläne werden planmäßig sowie nach erheblichen Vorfällen oder wesentlichen Änderungen getestet. Soweit DORA Artikel 11 Absatz 6 anwendbar ist, gelten mindestens jährliche Tests der IKT-Kontinuitäts- und Reaktions-/Wiederherstellungspläne sowie Tests bei wesentlichen Änderungen an IKT für kritische oder wichtige Funktionen. Das vereinfachte Regime nach Artikel 16 wird gesondert bestimmt.",
      "descriptionEn": "The programme derives test types, coverage, owners and intervals from risks and continuity objectives. CIR plans are tested at planned intervals and after significant incidents or significant changes. Where DORA Article 11(6) applies, ICT continuity and response/recovery plans are tested at least yearly and following substantive changes to ICT supporting critical or important functions. The simplified Article 16 regime is determined separately.",
      "reason": "Ein freiwilliges Testintervall darf ein tatsächlich verbindliches Mindestintervall nicht unterschreiten.",
      "reasonEn": "A discretionary test interval must not undercut an actually binding minimum.",
      "whenRequired": "Planmäßig und bei relevanten Auslösern; besondere Mindestintervalle nur im anwendbaren Regime.",
      "whenRequiredEn": "At planned intervals and relevant triggers; specific minimum intervals only under the applicable regime.",
      "sources": [
        "ISO 22301:2019 8.5",
        "ISO/IEC 27001:2022 A.5.30",
        "Implementing Regulation (EU) 2024/2690 Annex 4.1.4, 4.2.6, where applicable",
        "Regulation (EU) 2022/2554 Articles 11(6), 16"
      ]
    },
    {
      "id": "d36-c02",
      "title": "Szenarien",
      "titleEn": "Scenarios",
      "description": "Jede Übung erhält Ziel, Szenario, Beteiligte, Voraussetzungen, Sicherheitsgrenzen, Abbruchregeln und messbare Erfolgskriterien. Szenarien decken relevante Ausfälle und gemeinsame Abhängigkeiten über die Zeit ab. Technische Wiederherstellung, Ersatzbetrieb und Kommunikation werden angemessen geprüft. DORA Artikel 11 Absatz 6 verlangt für erfasste Nicht-Kleinstunternehmen auch Cyberangriffs- und Umschaltszenarien; Krisenkommunikation ist ebenfalls zu testen.",
      "descriptionEn": "Each exercise has objectives, scenario, participants, prerequisites, safety limits, stop rules and measurable success criteria. Scenarios cover relevant failures and shared dependencies over time. Technical recovery, temporary operation and communications are tested appropriately. DORA Article 11(6) also requires cyberattack and switchover scenarios for covered non-microenterprises; crisis communications must also be tested.",
      "reason": "Eine reine Gesprächsübung kann tatsächliche Rücksicherungsdauer nicht messen.",
      "reasonEn": "A discussion-only exercise cannot measure actual restore duration.",
      "whenRequired": "Für jeden geplanten Test entsprechend seinem Zweck.",
      "whenRequiredEn": "For each planned test according to its purpose.",
      "sources": [
        "ISO 22301:2019 8.5",
        "Implementing Regulation (EU) 2024/2690 Annex 4.1.4, 4.2.6, 4.3.4, where applicable",
        "Regulation (EU) 2022/2554 Article 11(6), where applicable"
      ]
    },
    {
      "id": "d36-c03",
      "title": "Auswertung und Verbesserung",
      "titleEn": "Evaluation and Improvement",
      "description": "Ergebnisbericht vergleicht Beobachtungen und gemessene Zeiten mit den vorher festgelegten Kriterien. Einschränkungen und nicht getestete Teile bleiben sichtbar. Mängel erhalten Priorität, Verantwortliche, Frist und Nachprüfung. BIA, Risiken, Pläne und Training werden bei Bedarf angepasst; Abschluss wird erst nach überprüfter Umsetzung dokumentiert.",
      "descriptionEn": "The result report compares observations and measured times with predetermined criteria. Limitations and untested elements remain visible. Deficiencies have priorities, owners, deadlines and retests. BIA, risks, plans and training are updated where needed; completion is recorded only after implementation has been checked.",
      "reason": "Ein bestandener Teiltest ist kein Nachweis für das gesamte Kontinuitätskonzept.",
      "reasonEn": "Passing a partial test does not demonstrate the whole continuity capability.",
      "whenRequired": "Nach jeder Übung und für deren Folgeaufgaben.",
      "whenRequiredEn": "After each exercise and for its follow-up actions.",
      "sources": [
        "ISO 22301:2019 8.5–8.6",
        "ISO/IEC 27001:2022 10.2",
        "Implementing Regulation (EU) 2024/2690 Annex 4.1.4, 4.2.6, where applicable",
        "Regulation (EU) 2022/2554 Article 11(6), where applicable"
      ]
    }
  ],
  "D37": [
    {
      "id": "d37-c01",
      "title": "Dienstleistung und Infrastruktur",
      "titleEn": "Service and Infrastructure",
      "description": "Die Beschreibung nennt Dienstleistung und Systemgrenzen sowie relevante Infrastruktur, Software, Personen, Verfahren und Daten. Wesentliche Leistungszusagen und Systemanforderungen werden erklärt und auf den Prüfungsumfang bezogen. Einbezogene Standorte, Schnittstellen und ausgeschlossene Leistungen müssen für einen Leser eindeutig erkennbar sein.",
      "descriptionEn": "Describe the service and system boundaries, including relevant infrastructure, software, people, procedures and data. Explain principal service commitments and system requirements in relation to the examination scope. Make included locations, interfaces and excluded services clear to a reader.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "AICPA DC Section 200, 2018 with revised implementation guidance 2022"
      ]
    },
    {
      "id": "d37-c02",
      "title": "Kontrollen und TSC-Bezug",
      "titleEn": "Controls and TSC Mapping",
      "description": "Die Beschreibung erläutert die tatsächlich eingerichteten Kontrollen zur Erreichung der relevanten Leistungszusagen und Systemanforderungen anhand der ausgewählten Trust Services Criteria. Kontrollverantwortliche, Durchführung und Abhängigkeiten werden konsistent mit dem Kontrollinventar dargestellt; geplante Kontrollen dürfen nicht als bereits betrieben erscheinen.",
      "descriptionEn": "Explain controls actually established to meet relevant service commitments and system requirements against the selected Trust Services Criteria. Describe owners, operation and dependencies consistently with the control inventory; planned controls must not appear as already operating.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "AICPA Trust Services Criteria 2017, revised points of focus 2022; DC Section 200"
      ]
    },
    {
      "id": "d37-c03",
      "title": "Subservice-Organisationen",
      "titleEn": "Subservice Organisations",
      "description": "Subservice-Organisationen werden mit Leistung, Abhängigkeit und angewandter Einbeziehungs- oder Carve-out-Methode beschrieben. Erforderliche komplementäre Kontrollen bei Nutzerorganisationen (CUECs) werden von solchen bei Subservice-Organisationen (CSOCs) getrennt. Überwachung und verbleibende Verantwortung der eigenen Organisation werden auch beim Carve-out erläutert.",
      "descriptionEn": "Describe subservice organisations, their services and dependencies, and whether the inclusive or carve-out method is used. Distinguish complementary user entity controls (CUECs) from complementary subservice organisation controls (CSOCs). Explain the organisation’s own monitoring and retained responsibilities even under carve-out.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "AICPA DC Section 200"
      ]
    },
    {
      "id": "d37-c04",
      "title": "Zeitraum und Änderungen",
      "titleEn": "Period and Changes",
      "description": "Für Type 1 wird der maßgebliche Stichtag, für Type 2 der Prüfungszeitraum angegeben. Wesentliche Systemänderungen und relevante Systemvorfälle werden entsprechend den Description Criteria sachlich offengelegt. Beschreibung, Assertion und Prüfungsunterlagen müssen denselben Umfang und dieselben Zeitgrenzen verwenden.",
      "descriptionEn": "State the relevant date for Type 1 or examination period for Type 2. Disclose significant system changes and relevant system incidents factually in accordance with the Description Criteria. Description, assertion and examination records must use the same scope and time boundaries.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "AICPA DC Section 200; SOC 2 examination guidance"
      ]
    }
  ],
  "D38": [
    {
      "id": "d38-c01",
      "title": "Ableitung der Ziele",
      "titleEn": "Derivation of Objectives",
      "description": "Informationssicherheitsziele werden für relevante Funktionen und Ebenen festgelegt. Sie sind mit der Informationssicherheitspolitik vereinbar und berücksichtigen anwendbare Anforderungen sowie Ergebnisse der Risikobewertung und Behandlung. Jedes Ziel beschreibt den angestrebten Zustand und seinen Zweck; ein bloßer Maßnahmenname ohne erkennbares Ergebnis genügt nicht.",
      "descriptionEn": "Information security objectives are established for relevant functions and levels. They are consistent with the information security policy and consider applicable requirements and risk assessment and treatment results. Each objective describes the intended state and its purpose; an action name without an identifiable outcome is insufficient.",
      "reason": "Ziele ohne Bezug zu Anforderungen und Risiken können am Sicherheitsbedarf vorbeigehen.",
      "reasonEn": "Objectives disconnected from requirements and risks can miss security needs.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 6.2"
      ]
    },
    {
      "id": "d38-c02",
      "title": "Messbarkeit",
      "titleEn": "Measurability",
      "description": "Ziele werden messbar formuliert, soweit praktikabel. Bei quantitativen Zielen werden Bezugsgröße, Datenquelle und Zielwert festgelegt. Ist eine Zahl nicht sinnvoll, werden dennoch prüfbare Kriterien für die Zielerreichung bestimmt. SMART ist eine mögliche Formulierungshilfe, keine gesonderte ISO-Pflicht. Die Bewertung darf nicht auf einen nicht interpretierbaren Zahlenwert reduziert werden.",
      "descriptionEn": "Objectives are measurable where practicable. Quantitative objectives define the measure, data source and target value. Where a number is not meaningful, establish assessable achievement criteria nevertheless. SMART is a possible drafting aid, not a separate ISO duty. Evaluation must not be reduced to an uninterpretable number.",
      "reason": "Messbarkeit erfordert eine passende Bedeutung, nicht nur eine Zahl.",
      "reasonEn": "Measurability requires meaningful criteria, not merely a number.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 6.2(b)"
      ]
    },
    {
      "id": "d38-c03",
      "title": "Verantwortliche und Ressourcen",
      "titleEn": "Owners and Resources",
      "description": "Für jedes Ziel wird geplant, was getan wird, welche Ressourcen benötigt werden, wer verantwortlich ist, wann die Umsetzung abgeschlossen sein soll und wie die Ergebnisse bewertet werden. Bei länger laufenden Zielen können Meilensteine helfen. Fehlende Ressourcen oder Zuständigkeiten werden als offene Planungsentscheidung ausgewiesen, nicht als bereits gelöst.",
      "descriptionEn": "For each objective, plan what will be done, required resources, responsibility, completion timing and how results will be evaluated. Milestones may help for longer-running objectives. Missing resources or ownership are shown as open planning decisions rather than already resolved.",
      "reason": "Ein Ziel ohne Umsetzungsplanung bleibt eine Absicht.",
      "reasonEn": "An objective without implementation planning remains an intention.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 6.2"
      ]
    },
    {
      "id": "d38-c04",
      "title": "Kommunikation",
      "titleEn": "Communication",
      "description": "Die Ziele und maßgeblichen Änderungen werden den relevanten Funktionen und Ebenen verständlich mitgeteilt. Zuständige Personen kennen ihren Beitrag, Termine und Bewertungskriterien. Kommunikationsweg und Empfänger werden passend festgelegt; vertrauliche Details werden geschützt. Die bloße Ablage in einem unbekannten Verzeichnis genügt nicht als wirksame Kommunikation.",
      "descriptionEn": "Objectives and relevant changes are communicated understandably to relevant functions and levels. Responsible people know their contribution, deadlines and evaluation criteria. Select suitable communication routes and recipients while protecting sensitive details. Merely placing a file in an unfamiliar folder is not effective communication.",
      "reason": "Nicht bekannte Ziele können die tägliche Arbeit nicht steuern.",
      "reasonEn": "Unknown objectives cannot guide daily work.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 6.2(e); 7.4"
      ]
    },
    {
      "id": "d38-c05",
      "title": "Fortschrittsmessung",
      "titleEn": "Progress Measurement",
      "description": "Fortschritt und Zielerreichung werden nach der geplanten Methode überwacht. Beobachtungsdatum, Datenbasis, Ergebnis und Abweichungen werden aufgezeichnet. Verantwortliche bewerten Hindernisse und Handlungsbedarf. Eine noch nicht fällige Maßnahme ist nicht automatisch gescheitert; fehlende Daten dürfen aber nicht als Zielerreichung ausgegeben werden.",
      "descriptionEn": "Progress and achievement are monitored using the planned method. Record observation date, data basis, result and deviations. Owners assess obstacles and required action. An action not yet due is not automatically failed, but missing data must not be presented as achievement.",
      "reason": "Die Unterscheidung von nicht gemessen und nicht erreicht verhindert falsche Berichte.",
      "reasonEn": "Distinguishing not measured from not achieved prevents misleading reports.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 6.2(d); 9.1"
      ]
    },
    {
      "id": "d38-c06",
      "title": "Überprüfung und Anpassung",
      "titleEn": "Review and Adjustment",
      "description": "Die Zielerreichung wird in der Managementbewertung berücksichtigt. Ziele werden bei Bedarf aktualisiert, etwa bei veränderten Anforderungen, Risiken oder Leistungen. Änderungen erhalten eine Begründung und einen nachvollziehbaren Versionsstand; ein verfehltes Ziel wird nicht rückwirkend durch Absenken des Zielwerts als erreicht dargestellt.",
      "descriptionEn": "Achievement is considered in management review. Objectives are updated as necessary, for example after changes to requirements, risks or services. Changes receive a rationale and traceable version; a missed objective is not retrospectively made successful by lowering its target.",
      "reason": "Nachträgliche Zielverschiebung kann tatsächliche Leistungsmängel verbergen.",
      "reasonEn": "Retrospective target changes can hide actual performance gaps.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 6.2(f); 9.3.2(d)"
      ]
    }
  ],
  "D39": [
    {
      "id": "d39-c01",
      "title": "Methodik",
      "titleEn": "Methodology",
      "description": "Der Bericht bezeichnet Geltungsbereich, Bewertungszeitraum, Beteiligte und verwendete Methodikversion. Kriterien, Datenquellen, Annahmen und Einschränkungen werden dokumentiert oder eindeutig referenziert. Die gewählte Methode muss das betrachtete Umfeld angemessen erfassen; Unsicherheiten und begrenzte Abdeckung werden sichtbar benannt.",
      "descriptionEn": "The report identifies scope, assessment period, participants and methodology version. Criteria, data sources, assumptions and limitations are documented or unambiguously referenced. The selected method must adequately cover the assessed environment; uncertainty and limited coverage are explicitly identified.",
      "reason": "Ohne Methodenstand können frühere Ergebnisse falsch mit aktuellen Bewertungen verglichen werden.",
      "reasonEn": "Without a methodology baseline, previous results may be compared incorrectly with current assessments.",
      "whenRequired": "Für den festgelegten ISMS- und Sicherheitsgeltungsbereich. CIR-spezifische Aussagen gelten nur im Anwendungsbereich dieser Verordnung; ein eigenes Dokument je Klausel ist nicht erforderlich.",
      "whenRequiredEn": "For the defined ISMS and security scope. CIR-specific provisions apply only within that regulation's entity scope; a separate document for each clause is not required.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.2; 8.2",
        "NIS2 Article 21(1), 21(2)(a)",
        "CIR 2024/2690 Annex 2.1, only within its entity scope"
      ]
    },
    {
      "id": "d39-c02",
      "title": "Identifizierte Risiken",
      "titleEn": "Identified Risks",
      "description": "Jedes identifizierte Risiko erhält Kennung, verständliches Szenario, betroffene Informationen oder Dienste und einen Risikoeigentümer. Relevante Ursachen, Bedrohungen, Schwachstellen und Abhängigkeiten werden beschrieben. Bestehende Schutzmaßnahmen und Nachweise sind verknüpft. Die Darstellung darf auf ein gepflegtes Register verweisen, sofern dessen maßgeblicher Stand eindeutig feststeht.",
      "descriptionEn": "Each identified risk has an identifier, understandable scenario, affected information or services and a risk owner. Relevant causes, threats, vulnerabilities and dependencies are described. Existing safeguards and evidence are linked. The report may reference a maintained register provided its relevant baseline is unambiguous.",
      "reason": "Ein nicht versionierter Verweis kann nachträglich andere Risiken zeigen als ursprünglich bewertet.",
      "reasonEn": "An unversioned reference can later show risks different from those originally assessed.",
      "whenRequired": "Für den festgelegten ISMS- und Sicherheitsgeltungsbereich. CIR-spezifische Aussagen gelten nur im Anwendungsbereich dieser Verordnung; ein eigenes Dokument je Klausel ist nicht erforderlich.",
      "whenRequiredEn": "For the defined ISMS and security scope. CIR-specific provisions apply only within that regulation's entity scope; a separate document for each clause is not required.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.2(c); 8.2",
        "CIR 2024/2690 Annex 2.1.2(d), where applicable"
      ]
    },
    {
      "id": "d39-c03",
      "title": "Eintrittswahrscheinlichkeit und Auswirkung",
      "titleEn": "Likelihood and Impact",
      "description": "Eintrittswahrscheinlichkeit und Folgen werden nach der referenzierten Methodik bewertet und begründet. Der Bericht zeigt den Zeithorizont, bewertete Auswirkungen, berücksichtigte wirksame Maßnahmen und wesentliche Unsicherheiten. Erwartete Wirkungen noch geplanter Maßnahmen werden getrennt von der aktuellen Bewertung dargestellt.",
      "descriptionEn": "Likelihood and consequences are assessed and justified using the referenced method. The report states the time horizon, assessed impacts, effective safeguards credited and significant uncertainty. Expected effects of actions still being planned are shown separately from the current assessment.",
      "reason": "Eine bereits angerechnete, aber noch nicht umgesetzte Maßnahme unterschätzt das aktuelle Risiko.",
      "reasonEn": "Crediting a safeguard before it is implemented understates current risk.",
      "whenRequired": "Für den festgelegten ISMS- und Sicherheitsgeltungsbereich. CIR-spezifische Aussagen gelten nur im Anwendungsbereich dieser Verordnung; ein eigenes Dokument je Klausel ist nicht erforderlich.",
      "whenRequiredEn": "For the defined ISMS and security scope. CIR-specific provisions apply only within that regulation's entity scope; a separate document for each clause is not required.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.2(d)",
        "CIR 2024/2690 Annex 2.1.2(e), where applicable"
      ]
    },
    {
      "id": "d39-c04",
      "title": "Risikoniveau und Priorisierung",
      "titleEn": "Risk Level and Prioritisation",
      "description": "Aus den Bewertungen wird das Risikoniveau nach der festgelegten Regel ermittelt. Ergebnis und Begründung werden gegen die Risikokriterien geprüft. Die Priorisierung berücksichtigt zusätzlich verbindliche Vorgaben, Abhängigkeiten und Unsicherheiten. Der Bericht zeigt, welche Risiken Behandlung oder eine Entscheidung benötigen, anstatt nur farbige Werte darzustellen.",
      "descriptionEn": "Risk level is derived from the assessments using the defined rule. Results and rationale are evaluated against risk criteria. Prioritisation also considers binding requirements, dependencies and uncertainty. The report identifies risks requiring treatment or a decision instead of displaying only coloured scores.",
      "reason": "Ein Risikobericht soll Entscheidungen ermöglichen, nicht nur Einstufungen wiedergeben.",
      "reasonEn": "A risk report should enable decisions rather than merely reproduce ratings.",
      "whenRequired": "Für den festgelegten ISMS- und Sicherheitsgeltungsbereich. CIR-spezifische Aussagen gelten nur im Anwendungsbereich dieser Verordnung; ein eigenes Dokument je Klausel ist nicht erforderlich.",
      "whenRequiredEn": "For the defined ISMS and security scope. CIR-specific provisions apply only within that regulation's entity scope; a separate document for each clause is not required.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.2(d)-(e)",
        "CIR 2024/2690 Annex 2.1.2(e)-(g), where applicable"
      ]
    },
    {
      "id": "d39-c05",
      "title": "Abgleich mit Akzeptanzkriterien",
      "titleEn": "Comparison with Acceptance Criteria",
      "description": "Für jedes Risiko wird der Abgleich mit den freigegebenen Akzeptanzkriterien festgehalten. Erforderliche Behandlung, Eskalation oder begründete Beibehaltung werden benannt. Offene verbindliche Anforderungen bleiben unabhängig von der Risikoeinstufung sichtbar. Wo eine befugte Entscheidung fehlt, wird der Status nicht als akzeptiert dargestellt.",
      "descriptionEn": "For each risk, record comparison with approved acceptance criteria. Identify required treatment, escalation or justified retention. Outstanding binding requirements remain visible regardless of risk rating. Where an authorised decision is missing, the status is not shown as accepted.",
      "reason": "Ein niedriger Wert beweist weder Rechtskonformität noch eine wirksame Akzeptanzentscheidung.",
      "reasonEn": "A low score establishes neither legal compliance nor a valid acceptance decision.",
      "whenRequired": "Für den festgelegten ISMS- und Sicherheitsgeltungsbereich. CIR-spezifische Aussagen gelten nur im Anwendungsbereich dieser Verordnung; ein eigenes Dokument je Klausel ist nicht erforderlich.",
      "whenRequiredEn": "For the defined ISMS and security scope. CIR-specific provisions apply only within that regulation's entity scope; a separate document for each clause is not required.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.2(a); 6.1.3(f)",
        "CIR 2024/2690 Annex 2.1.1; 2.1.2(f), where applicable"
      ]
    },
    {
      "id": "d39-c06",
      "title": "Ergebnis und Freigabe",
      "titleEn": "Result and Approval",
      "description": "Der Bericht fasst wesentliche Ergebnisse, Abdeckungslücken, Entscheidungen und Folgeaktionen zusammen und verweist auf den Behandlungsplan. Prüfung und Freigabe erfolgen nach den festgelegten Zuständigkeiten. Für ISO 27001 werden die Genehmigung des Behandlungsplans und die Akzeptanz der Restrisiken durch Risikoeigentümer nachgewiesen. Im CIR-Anwendungsbereich gilt zusätzlich die Annahme der Bewertungsergebnisse und Restrisiken nach Anhang 2.1.1. Unterschriftenfelder bleiben bis zur tatsächlichen Entscheidung leer.",
      "descriptionEn": "The report summarises significant results, coverage gaps, decisions and follow-up actions and references the treatment plan. Review and approval follow assigned responsibilities. For ISO 27001, evidence establishes risk owners' approval of the treatment plan and acceptance of residual risks. Within CIR scope, acceptance of assessment results and residual risks under Annex 2.1.1 also applies. Signature fields remain blank until an actual decision is made.",
      "reason": "Ein freigegebener Bericht allein ersetzt keine dokumentierten Risiko- und Maßnahmenentscheidungen.",
      "reasonEn": "An approved report alone does not replace documented risk and treatment decisions.",
      "whenRequired": "Für den festgelegten ISMS- und Sicherheitsgeltungsbereich. CIR-spezifische Aussagen gelten nur im Anwendungsbereich dieser Verordnung; ein eigenes Dokument je Klausel ist nicht erforderlich.",
      "whenRequiredEn": "For the defined ISMS and security scope. CIR-specific provisions apply only within that regulation's entity scope; a separate document for each clause is not required.",
      "sources": [
        "ISO/IEC 27001:2022 6.1.3(f); 8.2; 8.3",
        "CIR 2024/2690 Annex 2.1.1, where applicable"
      ]
    }
  ],
  "D40": [
    {
      "id": "d40-c01",
      "title": "Kompetenzanforderungen je Rolle",
      "titleEn": "Competence Requirements per Role",
      "description": "Die Organisation bestimmt die erforderliche Kompetenz von Personen, deren Arbeit unter ihrer Kontrolle die Informationssicherheitsleistung beeinflusst. Anforderungen werden passend zu Aufgaben und Verantwortung beschrieben; ähnliche Rollen dürfen gruppiert werden. Relevante externe Personen werden einbezogen. Die Bezeichnung als Sicherheitsrolle allein entscheidet nicht über den Kompetenzbedarf.",
      "descriptionEn": "The organisation determines the competence needed by people working under its control whose work affects information security performance. Requirements reflect tasks and responsibility; similar roles may be grouped. Relevant external personnel are included. A security job title alone does not determine competence needs.",
      "reason": "Auch außerhalb des Sicherheitsteams können Aufgaben sicherheitskritisch sein.",
      "reasonEn": "Tasks outside the security team can also be security-critical.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 7.2(a)"
      ]
    },
    {
      "id": "d40-c02",
      "title": "Nachweis der Kompetenz",
      "titleEn": "Evidence of Competence",
      "description": "Vorhandene Kompetenz wird anhand geeigneter Ausbildung, Schulung oder Erfahrung gegen die Aufgabenanforderungen bewertet. Nachweise können praktische Ergebnisse, beobachtete Aufgabenerfüllung oder relevante Qualifikationen einschließen. Ein Teilnahmebeleg oder Zertifikat allein beweist nicht automatisch die erforderliche Fähigkeit. Die Bewertung und angemessene Belege werden aufbewahrt.",
      "descriptionEn": "Existing competence is assessed against task requirements using appropriate education, training or experience. Evidence may include practical results, observed task performance or relevant qualifications. Attendance or a certificate alone does not automatically prove the required ability. Retain the assessment and appropriate evidence.",
      "reason": "Teilnahme und tatsächliche Befähigung sind nicht gleichbedeutend.",
      "reasonEn": "Attendance and actual ability are not equivalent.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 7.2(b), (d)"
      ]
    },
    {
      "id": "d40-c03",
      "title": "Maßnahmen bei Lücken",
      "titleEn": "Actions on Gaps",
      "description": "Erkannte Kompetenzlücken erhalten geeignete Maßnahmen, Verantwortliche und Termine. Maßnahmen können Schulung, Begleitung, praktische Übung, Beauftragung qualifizierter Personen oder geänderte Aufgaben umfassen. Die Wirksamkeit der ergriffenen Maßnahmen wird bewertet. Bis notwendige Kompetenz vorliegt, werden sicherheitskritische Aufgaben angemessen beaufsichtigt oder anders zugewiesen.",
      "descriptionEn": "Identified competence gaps receive suitable actions, owners and deadlines. Actions may include training, mentoring, practice, use of qualified personnel or changed tasks. Evaluate the effectiveness of actions taken. Until necessary competence is available, safety- or security-critical work is appropriately supervised or reassigned.",
      "reason": "Eine geplante Schulung beseitigt eine aktuelle Kompetenzlücke noch nicht.",
      "reasonEn": "Planned training does not yet close a current competence gap.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 7.2(c)-(d)"
      ]
    },
    {
      "id": "d40-c04",
      "title": "Pflege des Registers",
      "titleEn": "Maintenance of the Register",
      "description": "Kompetenzaufzeichnungen werden bei Aufgaben-, Personal- und Anforderungsänderungen aktualisiert. Abgelaufene Nachweise werden auf ihre tatsächliche Bedeutung geprüft; ein abgelaufenes Zertifikat bedeutet nicht automatisch Kompetenzverlust, sofern keine verbindliche Gültigkeitsanforderung besteht. Zugriff und Aufbewahrung richten sich nach Zweck, Schutzbedarf und geltenden Anforderungen.",
      "descriptionEn": "Competence records are updated after changes to tasks, personnel and requirements. Expired credentials are evaluated for actual significance; certificate expiry does not automatically mean loss of competence unless a binding validity requirement applies. Access and retention reflect purpose, protection needs and applicable requirements.",
      "reason": "Personalbezogene Nachweise müssen aussagekräftig und angemessen geschützt bleiben.",
      "reasonEn": "Personnel evidence must remain meaningful and appropriately protected.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 7.2(d); 7.5"
      ]
    }
  ],
  "D41": [
    {
      "id": "d41-c01",
      "title": "Auditprogramm",
      "titleEn": "Audit Programme",
      "description": "Das Auditprogramm legt Frequenz, Methoden, Verantwortlichkeiten, Planung und Berichterstattung fest. Es berücksichtigt die Bedeutung der betroffenen Prozesse und Ergebnisse früherer Audits. Für jedes Audit werden Kriterien und Umfang bestimmt. Das Programm prüft sowohl eigene ISMS-Anforderungen und ISO-Anforderungen als auch wirksame Umsetzung und Aufrechterhaltung. Geplante Intervalle werden begründet; eine allgemeine jährliche Vollprüfung ist nicht vorgegeben.",
      "descriptionEn": "The audit programme defines frequency, methods, responsibilities, planning and reporting. It considers the importance of the processes concerned and previous audit results. Criteria and scope are defined for each audit. The programme examines conformity with the organisation's ISMS requirements and ISO requirements as well as effective implementation and maintenance. Planned intervals are justified; a universal annual full audit is not prescribed.",
      "reason": "Ein Programm nur für Annex-A-Kontrollen übersieht Anforderungen des Managementsystems.",
      "reasonEn": "A programme limited to Annex A controls misses management-system requirements.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 9.2.1-9.2.2"
      ]
    },
    {
      "id": "d41-c02",
      "title": "Unabhängigkeit der Auditoren",
      "titleEn": "Auditor Independence",
      "description": "Auditoren verfügen über geeignete Kompetenz; Auswahl und Durchführung sichern Objektivität und Unparteilichkeit. Interessenkonflikte und die Prüfung eigener Arbeit werden vermieden oder wirksam beherrscht. Bei CIR-Anwendbarkeit werden unabhängige Prüfungen nach Anhang 2.3 organisiert; falls die Organisationsgröße die dort vorgesehene Trennung nicht erlaubt, sind wirksame alternative Vorkehrungen zur Unparteilichkeit erforderlich. Ein externer Dienstleister ist nicht pauschal vorgeschrieben.",
      "descriptionEn": "Auditors have suitable competence; selection and conduct ensure objectivity and impartiality. Conflicts of interest and review of one's own work are avoided or effectively controlled. Within CIR scope, independent reviews follow Annex 2.3; where organisational size prevents its prescribed separation, effective alternative safeguards for impartiality are required. An external provider is not universally mandatory.",
      "reason": "Ein formaler Auftrag beseitigt keinen Interessenkonflikt.",
      "reasonEn": "A formal appointment does not remove a conflict of interest.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 7.2; 9.2.2",
        "CIR 2024/2690 Annex 2.3.1-2.3.2, where applicable"
      ]
    },
    {
      "id": "d41-c03",
      "title": "Durchführung",
      "titleEn": "Conduct",
      "description": "Audits werden nach dem festgelegten Umfang und den Kriterien durchgeführt. Geeignete Methoden können Dokumentenprüfung, Interviews, Beobachtung und technische Nachweise kombinieren. Feststellungen verbinden eine konkrete Anforderung mit überprüfbaren Tatsachen. Stichprobenumfang und Einschränkungen werden dokumentiert; eine Stichprobe wird nicht als Prüfung aller Fälle ausgegeben.",
      "descriptionEn": "Audits follow defined scope and criteria. Suitable methods may combine document review, interviews, observation and technical evidence. Findings connect a specific requirement to verifiable facts. Sampling coverage and limitations are recorded; a sample is not presented as examination of every case.",
      "reason": "Ohne Nachweis und Prüfkriterium ist eine Feststellung nicht belastbar.",
      "reasonEn": "Without evidence and an audit criterion, a finding is not defensible.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 9.2.1-9.2.2"
      ]
    },
    {
      "id": "d41-c04",
      "title": "Auditbericht",
      "titleEn": "Audit Report",
      "description": "Der Ergebnisnachweis nennt Auditdatum, Prüfer, Umfang, Kriterien, Methoden, geprüfte Nachweise und Schlussfolgerungen. Nichtkonformitäten werden von Empfehlungen getrennt. Nicht geprüfte Bereiche und Einschränkungen bleiben sichtbar. Einstufungen werden begründet; weder ein Normverweis noch ein Tool-Standardwert macht eine Feststellung automatisch schwerwiegend.",
      "descriptionEn": "The results record identifies audit date, auditors, scope, criteria, methods, evidence examined and conclusions. Nonconformities are separated from recommendations. Unexamined areas and limitations remain visible. Grades are justified; neither a standard reference nor a tool default automatically makes a finding major.",
      "reason": "Unbegründete Grade verzerren die Priorisierung von Korrekturen.",
      "reasonEn": "Unsupported grades distort corrective-action priorities.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 9.2.2; 10.2"
      ]
    },
    {
      "id": "d41-c05",
      "title": "Verknüpfung mit Korrekturmaßnahmen",
      "titleEn": "Link to Corrective Actions",
      "description": "Bestätigte Nichtkonformitäten werden mit eindeutiger Kennung in die Bearbeitung nach dem Korrekturmaßnahmenverfahren überführt. Zuständigkeit, Fristen, Ursachenbewertung, erforderliche Maßnahmen und Wirksamkeitsprüfung bleiben mit der Auditfeststellung verknüpft. Eine bloße Zusage des geprüften Bereichs schließt die Feststellung nicht. Empfehlungen werden entsprechend ihrer eigenen Entscheidung verfolgt.",
      "descriptionEn": "Confirmed nonconformities enter the corrective-action process with a unique identifier. Ownership, dates, cause evaluation, necessary actions and effectiveness checks remain linked to the audit finding. A promise from the audited function alone does not close the finding. Recommendations are tracked according to their own decision.",
      "reason": "Ein Bericht ohne Nachverfolgung kann bekannte Mängel bestehen lassen.",
      "reasonEn": "A report without follow-up can leave known weaknesses unresolved.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 10.2; 9.2.2"
      ]
    },
    {
      "id": "d41-c06",
      "title": "Berichterstattung an die Leitung",
      "titleEn": "Reporting to Management",
      "description": "Auditergebnisse werden der relevanten Leitung nach dem festgelegten Berichtsweg mitgeteilt. Dringliche Feststellungen werden zeitnah eskaliert und nicht bis zu einem jährlichen Termin zurückgehalten. Ergebnisse und Fortschritt der Bearbeitung fließen in die Managementbewertung ein. Im CIR-Anwendungsbereich werden unabhängige Prüfergebnisse dem Leitungsorgan berichtet.",
      "descriptionEn": "Audit results are reported to relevant management through the defined route. Urgent findings are escalated promptly rather than held for an annual date. Results and action progress inform management review. Within CIR scope, independent review results are reported to the management body.",
      "reason": "Verspätete Berichte können notwendige Ressourcenentscheidungen verhindern.",
      "reasonEn": "Delayed reports can prevent necessary resource decisions.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 9.2.2; 9.3.2(d)",
        "CIR 2024/2690 Annex 2.3.3, where applicable"
      ]
    }
  ],
  "D42": [
    {
      "id": "d42-c01",
      "title": "Messgegenstand",
      "titleEn": "What is Measured",
      "description": "Die Organisation bestimmt, welche Aspekte der Informationssicherheitsleistung und ISMS-Wirksamkeit überwacht und gemessen werden müssen. Auswahl und Zweck beziehen sich auf relevante Prozesse, Kontrollen und Ziele. Dies ist Leistungsbewertung des ISMS und nicht allein technische Ereignisüberwachung durch ein Sicherheitssystem. Beides kann gemeinsame Daten nutzen.",
      "descriptionEn": "The organisation determines which aspects of information security performance and ISMS effectiveness need monitoring and measurement. Selection and purpose relate to relevant processes, controls and objectives. This is ISMS performance evaluation, not merely technical event monitoring by a security system. Both may use shared data.",
      "reason": "Technische Alarmzahlen allein zeigen nicht die Wirksamkeit des gesamten ISMS.",
      "reasonEn": "Technical alert counts alone do not show the effectiveness of the whole ISMS.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 9.1"
      ]
    },
    {
      "id": "d42-c02",
      "title": "Methoden und Zeitpunkte",
      "titleEn": "Methods and Timing",
      "description": "Für Überwachung, Messung, Analyse und Bewertung werden geeignete Methoden festgelegt, die valide Ergebnisse ermöglichen. Es wird bestimmt, wann und durch wen erhoben sowie wann und durch wen analysiert und bewertet wird. Datenquelle, Bezugszeitraum und Regeln für fehlende oder fehlerhafte Daten werden dokumentiert.",
      "descriptionEn": "Define suitable methods for monitoring, measurement, analysis and evaluation that support valid results. Specify when and by whom data is collected, and when and by whom it is analysed and evaluated. Document data source, reference period and rules for missing or erroneous data.",
      "reason": "Messung und Bewertung können unterschiedliche Termine und Verantwortliche benötigen.",
      "reasonEn": "Measurement and evaluation may require different timing and responsibilities.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 9.1"
      ]
    },
    {
      "id": "d42-c03",
      "title": "Kennzahlen (KPI/KRI)",
      "titleEn": "Metrics (KPI/KRI)",
      "description": "Geeignete Kennzahlen oder andere nachvollziehbare Bewertungen werden anhand ihres Zwecks ausgewählt. Bei Key Performance Indicators (KPI) und Key Risk Indicators (KRI) werden Definition, Berechnung, Grundgesamtheit, Schwellenwert und Interpretation festgelegt. Ein fehlender Messwert ist nicht automatisch null oder Erfolg. Änderungen an Definitionen werden bei Zeitvergleichen berücksichtigt.",
      "descriptionEn": "Select suitable metrics or other traceable evaluations according to purpose. For Key Performance Indicators (KPIs) and Key Risk Indicators (KRIs), define meaning, calculation, population, threshold and interpretation. A missing measurement is not automatically zero or success. Changes to definitions are considered when comparing periods.",
      "reason": "Ein Prozentwert ohne Nenner und Zeitraum kann irreführend sein.",
      "reasonEn": "A percentage without a denominator and period can be misleading.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 9.1"
      ]
    },
    {
      "id": "d42-c04",
      "title": "Auswertung und Bericht",
      "titleEn": "Evaluation and Report",
      "description": "Ergebnisse werden auf Leistung, Wirksamkeit, Trends und Abweichungen untersucht. Datenlücken und Unsicherheit werden offengelegt. Aussagefähige Ergebnisse werden mit Datum, zuständiger Person und Datenbasis aufbewahrt und den vorgesehenen Empfängern berichtet. Grenzwertüberschreitungen lösen die festgelegte Reaktion aus; ein Diagramm allein ist keine Bewertung.",
      "descriptionEn": "Results are examined for performance, effectiveness, trends and deviations. Data gaps and uncertainty are disclosed. Meaningful results are retained with date, responsible person and data basis and reported to intended recipients. Threshold breaches trigger the defined response; a chart alone is not an evaluation.",
      "reason": "Erst die Interpretation verbindet Messwerte mit einer Sicherheitsentscheidung.",
      "reasonEn": "Interpretation connects measurements to a security decision.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 9.1; 7.5"
      ]
    },
    {
      "id": "d42-c05",
      "title": "Eingang in Review und Verbesserung",
      "titleEn": "Input to Review and Improvement",
      "description": "Bewertete Ergebnisse fließen in Managementbewertung, Risikoentscheidungen und erforderliche Verbesserungen ein. Jede Folgeaktion benennt Zuständigkeit, Termin und erwartetes Ergebnis. Dringliche Abweichungen werden zeitnah bearbeitet. Der weitere Erfolg wird überprüft; eine allgemeine Jahresfrist für diese Rückkopplung wird nicht vorgegeben.",
      "descriptionEn": "Evaluated results feed management review, risk decisions and necessary improvements. Each follow-up action identifies an owner, deadline and expected result. Urgent deviations are addressed promptly. Subsequent results are checked; no universal annual deadline is imposed for this feedback.",
      "reason": "Berichtete Abweichungen ohne Folgeentscheidung verändern den Zustand nicht.",
      "reasonEn": "Reported deviations without follow-up decisions do not change the situation.",
      "whenRequired": "Zu festgelegten Zeitpunkten und bei relevanten Änderungen; keine allgemeine Jahresfrist.",
      "whenRequiredEn": "At defined times and following relevant changes; no universal annual deadline.",
      "sources": [
        "ISO/IEC 27001:2022 9.3; 10.1-10.2"
      ]
    }
  ],
  "D43": [
    {
      "id": "d43-c01",
      "title": "Förmliche Billigung",
      "titleEn": "Formal Approval",
      "description": "Das Leitungsorgan billigt die erforderlichen Cybersicherheits-Risikomanagementmaßnahmen und hält Umfang, Entscheidung, Datum und Bedingungen fest. Vorlagen müssen Risiken, Alternativen, Ressourcen und Verantwortlichkeiten verständlich darstellen. Eine bestehende Sitzungsniederschrift kann den Beschluss belegen; eine zusätzliche Datei mit eigenem Titel ist nicht vorgeschrieben. Für DORA werden die eigenständigen Aufgaben aus Artikel 5 berücksichtigt.",
      "descriptionEn": "The management body approves required cybersecurity risk-management measures and records scope, decision, date and conditions. Proposals clearly present risks, alternatives, resources and responsibilities. Existing meeting minutes can evidence approval; an additional separately titled file is not prescribed. For DORA, account for the distinct duties under Article 5.",
      "reason": "Eine technische Freigabe durch Administratoren ersetzt die erforderliche Leitungsgenehmigung nicht.",
      "reasonEn": "Technical sign-off by administrators does not replace required management approval.",
      "whenRequired": "Bei erforderlicher Billigung und wesentlichen Änderungen.",
      "whenRequiredEn": "For required approval and material changes.",
      "sources": [
        "Directive (EU) 2022/2555 20(1)",
        "Regulation (EU) 2022/2554 5(2), where applicable"
      ]
    },
    {
      "id": "d43-c02",
      "title": "Überwachungspflicht",
      "titleEn": "Oversight Obligation",
      "description": "Die Leitung verfolgt Umsetzung, wesentliche Abweichungen, Restrestrisiken und Wirksamkeit. Berichtswege, Prüfrhythmus und Eskalation werden festgelegt; Entscheidungen und Nachverfolgung bleiben nachvollziehbar. Delegation operativer Aufgaben beendet die erforderliche Überwachung nicht.",
      "descriptionEn": "Management follows implementation, material deviations, residual risks and effectiveness. Reporting, review cycles and escalation are established; decisions and follow-up remain traceable. Delegating operational tasks does not end required oversight.",
      "reason": "Eine einmalige Billigung zeigt nicht, ob die Maßnahmen tatsächlich eingeführt wurden.",
      "reasonEn": "One-time approval does not show whether safeguards were actually implemented.",
      "whenRequired": "Während Umsetzung und Betrieb.",
      "whenRequiredEn": "During implementation and operation.",
      "sources": [
        "Directive (EU) 2022/2555 20(1)",
        "Regulation (EU) 2022/2554 5(2), where applicable"
      ]
    },
    {
      "id": "d43-c03",
      "title": "Persönliche Verantwortung",
      "titleEn": "Personal Accountability",
      "description": "Verantwortlichkeiten und Entscheidungsbefugnisse werden rechtssicher zugeordnet. Das Leitungsorgan wird über anwendbare nationale Verantwortungs- und Haftungsregeln informiert. NIS2 Artikel 20 verlangt nationale Haftungsregelungen, legt aber nicht selbst für jede Person automatisch einen individuellen Schadenersatzanspruch fest. Eine pauschale Erklärung zur persönlichen Haftung ersetzt weder Maßnahmen noch Aufsicht.",
      "descriptionEn": "Responsibilities and decision authority are assigned consistently with law. Management is informed of applicable national accountability and liability rules. NIS2 Article 20 requires national liability arrangements but does not itself automatically establish an individual damages claim against every person. A blanket personal-liability statement replaces neither safeguards nor oversight.",
      "reason": "Haftung hängt von geltendem Recht und den konkreten Voraussetzungen ab.",
      "reasonEn": "Liability depends on applicable law and the specific conditions.",
      "whenRequired": "Bei Rollenübernahme und relevanter Rechtsänderung.",
      "whenRequiredEn": "When taking a role and upon relevant legal change.",
      "sources": [
        "Directive (EU) 2022/2555 20(1)",
        "Regulation (EU) 2022/2554 5, where applicable"
      ]
    }
  ],
  "D44": [
    {
      "id": "d44-c01",
      "title": "Ziele und Geltungsbereich",
      "titleEn": "Objectives and Scope",
      "description": "Die IKT-Geschäftsfortführungsleitlinie schützt kritische oder wichtige Funktionen und wird mit der allgemeinen Kontinuitätsregelung und der BIA nach D34 abgestimmt. Sie kann integriert geführt werden; eine rechtlich eigenständige Datei ist nicht zwingend.",
      "descriptionEn": "Align the ICT continuity policy with overall continuity and the BIA in D34, protecting critical or important functions. It may be integrated; a legally separate file is not mandatory.",
      "reason": "Artikel 11 lässt eine integrierte Führung zu und verlangt kein eigenständiges Dokument.",
      "reasonEn": "Article 11 permits integration rather than demanding a stand-alone document.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Art. 11(1), (5)"
      ]
    },
    {
      "id": "d44-c02",
      "title": "Reaktions- und Wiederherstellungspläne",
      "titleEn": "Response and Recovery Plans",
      "description": "Die zuständigen Rollen aktivieren ohne Verzögerung passende Eindämmungs-, Reaktions- und Wiederherstellungspläne. Auslöser, Prioritäten, Abhängigkeiten, Eskalation, Rückkehr zum Normalbetrieb und zugängliche Tätigkeitsaufzeichnungen sind festgelegt. Nicht-Kleinstunternehmen unterziehen die zugehörigen Pläne einer unabhängigen internen Prüfung.",
      "descriptionEn": "Responsible roles activate suitable containment, response and recovery plans without delay. Define triggers, priorities, dependencies, escalation, return to normal operations and accessible activity records. Non-microenterprises subject associated plans to independent internal audit review.",
      "reason": "Erst operative Pläne und Nachweise der Aktivierung machen die Leitlinie im Ernstfall handhabbar.",
      "reasonEn": "Operational plans and activation evidence make the policy executable.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Art. 11(2)–(4), (8)"
      ]
    },
    {
      "id": "d44-c03",
      "title": "Auswirkungsabschätzung",
      "titleEn": "Impact Estimation",
      "description": "Vorläufige Auswirkungen, Schäden und Verluste werden mit Zeitpunkt, Datenquelle, Unsicherheiten und Aktualisierungen geschätzt. Die BIA liefert Planungsvorgaben; die konkrete Vorfallschätzung ersetzt sie nicht. Nicht-Kleinstunternehmen können der Behörde auf Anfrage aggregierte jährliche Kosten und Verluste bedeutender IKT-Vorfälle vorlegen.",
      "descriptionEn": "Estimate preliminary impacts, damage and losses with timestamps, sources, uncertainty and updates. The BIA provides planning inputs and is not replaced by an incident estimate. Non-microenterprises can provide aggregated annual costs and losses from major ICT incidents on authority request.",
      "reason": "Die planerische Analyse und die Verlustschätzung zu einem konkreten Vorfall sind voneinander getrennte Aufzeichnungen.",
      "reasonEn": "Planning analysis and actual incident loss assessment are different records.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Art. 11(2)(d), (5), (10)"
      ]
    },
    {
      "id": "d44-c04",
      "title": "Kommunikation und Krisenmanagement",
      "titleEn": "Communication and Crisis Management",
      "description": "Interne und externe Kommunikationswege, Vertretungen, Freigaben und erreichbare Kontakte werden vorab festgelegt und getestet. Nicht-Kleinstunternehmen benennen eine Krisenmanagementfunktion. Kunden- und Behördeninformationen folgen den jeweiligen gesetzlichen Auslösern; vertrauliche technische Details werden geschützt.",
      "descriptionEn": "Define and test internal and external communication routes, deputies, approvals and reachable contacts. Non-microenterprises designate a crisis management function. Client and authority communications follow their respective legal triggers and protect confidential technical details.",
      "reason": "Ein allgemeiner Pressekontakt ersetzt keine vorbereitete Krisenkommunikation mit festgelegten Wegen und Vertretungen.",
      "reasonEn": "A generic press contact is not a crisis communication arrangement.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Arts. 11(2)(e), (6)(b), (7), 14, 19"
      ]
    },
    {
      "id": "d44-c05",
      "title": "Test der Kontinuitätspläne",
      "titleEn": "Testing of Continuity Plans",
      "description": "IKT-Kontinuitäts-, Reaktions- und Wiederherstellungspläne werden für IKT-Systeme aller Funktionen mindestens jährlich und bei wesentlichen Änderungen an Systemen kritischer oder wichtiger Funktionen getestet. Nicht-Kleinstunternehmen berücksichtigen Cyberangriffe und Umschaltungen auf redundante Kapazitäten, Backups und Einrichtungen. Erkenntnisse fließen in die Pläne ein.",
      "descriptionEn": "Test ICT continuity, response and recovery plans for systems supporting all functions at least yearly and on substantive changes to systems supporting critical or important functions. Non-microenterprises include cyberattacks and switchovers to redundant capacity, backups and facilities. Feed results into plan updates.",
      "reason": "Der jährliche Test umfasst alle Funktionen, während für Umschaltszenarien eine Ausnahme für Kleinstunternehmen besteht.",
      "reasonEn": "The annual scope is all functions; specific switchover scenarios have a microenterprise exception.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Art. 11(6)"
      ]
    }
  ],
  "D45": [
    {
      "id": "d45-c01",
      "title": "Backup-Konzept",
      "titleEn": "Backup Concept",
      "description": "Datenumfang und Mindesthäufigkeit der Sicherungen werden nach Kritikalität und Vertraulichkeit festgelegt. Je Funktion werden Recovery Time Objective (RTO) und Recovery Point Objective (RPO) unter Berücksichtigung ihrer Bedeutung und möglicher Marktauswirkungen bestimmt; Aufbewahrung und Zugriffsrechte werden zusätzlich begründet.",
      "descriptionEn": "Define backup scope and minimum frequency from criticality and confidentiality. Set Recovery Time Objective (RTO) and Recovery Point Objective (RPO) for each function considering its importance and potential market impact, and justify retention and access separately.",
      "reason": "Wie oft gesichert wird und wie viel Datenverlust im Ernstfall hinnehmbar ist, sind zwei verschiedene Festlegungen.",
      "reasonEn": "Backup frequency and recoverable data loss are related but not identical.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Art. 12(1), (6)"
      ]
    },
    {
      "id": "d45-c02",
      "title": "Integrität und Trennung",
      "titleEn": "Integrity and Separation",
      "description": "Sicherungsbetrieb und Aktivierung dürfen Netz- und Informationssicherheit sowie Verfügbarkeit, Authentizität, Integrität und Vertraulichkeit nicht gefährden. Schutz gegen gemeinsame Fehler, unbefugte Änderung und Verlust der Wiederherstellungsschlüssel wird nachgewiesen; Air-Gap ist eine mögliche Maßnahme, kein pauschales Produktgebot.",
      "descriptionEn": "Backup operation and activation must not jeopardise network and information security or availability, authenticity, integrity and confidentiality. Evidence protection against common failures, unauthorised modification and loss of recovery keys; air-gapping is an option, not a universal product mandate.",
      "reason": "Sicherungen schützen nur dann, wenn die Maßnahmen an den tatsächlichen Bedrohungen der Wiederherstellung ausgerichtet sind.",
      "reasonEn": "Backup protection must address actual recovery threats.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Art. 12(2)–(3)"
      ]
    },
    {
      "id": "d45-c03",
      "title": "Wiederherstellung und Abgleich",
      "titleEn": "Restoration and Reconciliation",
      "description": "Nach Wiederherstellung werden Datenintegrität und systemübergreifende Konsistenz durch geeignete Prüfungen und Abgleiche bestätigt, auch bei Rekonstruktion aus Daten externer Beteiligter. Fachliche Freigabe und erreichte Wiederanlaufziele werden protokolliert.",
      "descriptionEn": "After recovery, verify data integrity and cross-system consistency through appropriate checks and reconciliation, including reconstruction from external-party data. Record business acceptance and achieved recovery objectives.",
      "reason": "Die Pflicht zum Abgleich nach der Wiederherstellung folgt aus Artikel 12 Absatz 7, nicht aus Artikel 12 Absatz 2.",
      "reasonEn": "The correct reconciliation requirement is Article 12(7), not 12(2).",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Art. 12(7)"
      ]
    },
    {
      "id": "d45-c04",
      "title": "Getrennte Wiederherstellungsumgebung",
      "titleEn": "Separate Recovery Environment",
      "description": "Bei Wiederherstellung von Backupdaten auf eigenen Systemen sind die verwendeten IKT-Systeme physisch und logisch vom Quellsystem getrennt und gegen unbefugten Zugriff und Beschädigung geschützt. Nicht-Kleinstunternehmen halten angemessene redundante Kapazitäten vor; Kleinstunternehmen bewerten deren Bedarf. Zusätzliche sektorbezogene Anforderungen werden gesondert festgehalten.",
      "descriptionEn": "When restoring backup data using own systems, use ICT systems physically and logically segregated from the source and protected against unauthorised access and corruption. Non-microenterprises maintain adequate redundant capacity; microenterprises assess the need. Record additional sector-specific requirements separately.",
      "reason": "Die Trennungspflicht knüpft an die Wiederherstellung auf eigenen Systemen an, nicht an die Kritikalität der betroffenen Funktion.",
      "reasonEn": "The source restriction to critical functions omitted the actual own-system restoration condition.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Art. 12(3)–(5)"
      ]
    },
    {
      "id": "d45-c05",
      "title": "Restore-Tests",
      "titleEn": "Restore Tests",
      "description": "Backup-, Wiederherstellungs- und Wiederanlaufverfahren werden periodisch getestet. Die Auswahl umfasst relevante Daten, Konfigurationen, Schlüssel, Personal und Abhängigkeiten; Integrität, Nutzbarkeit und gemessene Zeiten werden dokumentiert. Offene Testfehler erhalten Maßnahmen und Nachtests.",
      "descriptionEn": "Periodically test backup, restoration and recovery procedures, covering relevant data, configuration, keys, people and dependencies. Record integrity, usability and measured times and assign corrective actions and retests to failures.",
      "reason": "Ein fehlerfrei abgeschlossener Sicherungslauf belegt noch nicht, dass sich die Daten im Ernstfall zurückspielen lassen.",
      "reasonEn": "A successful backup job does not prove successful restoration.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Art. 12(2)"
      ]
    }
  ],
  "D46": [
    {
      "id": "d46-c01",
      "title": "Pflichtklauseln",
      "titleEn": "Mandatory Clauses",
      "description": "Der Vertrag einschließlich Service-Level wird in einem schriftlichen, dauerhaft zugänglichen Dokument festgehalten. Er regelt Leistungen und zulässige Unterbeauftragung, Leistungs- und Datenstandorte samt Vorabinformation über Änderungen, Datensicherheit, Datenzugang und Rückgabe bei Beendigung oder Insolvenz, Service-Level, Vorfallunterstützung ohne Zusatzkosten oder zu vorab festgelegten Kosten, Behördenkooperation, Kündigung und Schulungsteilnahmebedingungen.",
      "descriptionEn": "Record the contract and service levels in a written, durably accessible document. Cover services and permitted subcontracting, service and data locations with advance notice of changes, data security, access and return on termination or insolvency, service levels, incident assistance at no extra or predetermined cost, authority cooperation, termination and training participation conditions.",
      "reason": "Uneingeschränkte Prüfrechte gehören zu den Zusatzklauseln für kritische Funktionen, nicht zum allgemeinen Pflichtkatalog nach Artikel 30 Absatz 2.",
      "reasonEn": "Unrestricted customer audit rights are an additional critical-function clause, not the same universal Article 30(2) item.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Art. 30(1)–(2)"
      ]
    },
    {
      "id": "d46-c02",
      "title": "Zusatzklauseln für kritische Funktionen",
      "titleEn": "Additional Clauses for Critical Functions",
      "description": "Bei Unterstützung kritischer oder wichtiger Funktionen ergänzt der Vertrag messbare qualitative und quantitative Service-Level, relevante Mitteilungen und Fristen, getestete Notfallvorkehrungen und Sicherheitsmaßnahmen, erforderliche TLPT-Kooperation, wirksame fortlaufende Zugangs-, Inspektions- und Prüfungsrechte sowie eine angemessene verbindliche Übergangsfrist für den Ausstieg. Grenzen oder alternative Nachweise dürfen die gesetzlich erforderliche Überwachung nicht vereiteln.",
      "descriptionEn": "For critical or important functions, add measurable qualitative and quantitative service levels, relevant notices and deadlines, tested contingency and security arrangements, required TLPT cooperation, effective ongoing access, inspection and audit rights, and an adequate mandatory transition period for exit. Limitations or alternative assurance must not frustrate required monitoring.",
      "reason": "Der Verweis auf eine Zertifizierung deckt die besonderen Vertragspflichten für kritische Funktionen nicht ab.",
      "reasonEn": "A general certification clause cannot replace the full critical-function contractual requirements.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Art. 30(3)"
      ]
    },
    {
      "id": "d46-c03",
      "title": "Kündigungsrechte",
      "titleEn": "Termination Rights",
      "description": "Kündigung ist insbesondere bei erheblichen Rechts- oder Vertragsverstößen, risikorelevanten Leistungsänderungen, nachgewiesenen Schwächen des IKT-Risikomanagements sowie beeinträchtigter wirksamer Aufsicht möglich. Kündigungsfristen berücksichtigen Behördenanforderungen; Kontinuität und geordneter Übergang werden mit D18 abgestimmt.",
      "descriptionEn": "Allow termination for significant legal or contractual breaches, risk-relevant performance changes, evidenced ICT risk-management weaknesses and impairment of effective supervision. Notice periods address authority requirements and align continuity and orderly transition with D18.",
      "reason": "Kündigungsgründe und operative Ausstiegsunterstützung müssen beide vertraglich geregelt sein, damit eine Beendigung praktisch gelingt.",
      "reasonEn": "Termination grounds and operational exit support both need coverage.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Arts. 28(7), 30(2)(h)"
      ]
    },
    {
      "id": "d46-c04",
      "title": "Vor-Vertrags-Due-Diligence",
      "titleEn": "Pre-Contract Due Diligence",
      "description": "Vor Vertragsschluss werden Funktionskritikalität, aufsichtsrechtliche Voraussetzungen, sämtliche relevanten Risiken einschließlich Konzentration, Anbieter-Eignung und Interessenkonflikte bewertet. Sicherheitsstandards, Prüfkompetenz und relevante Unterauftragnehmer werden risikogerecht berücksichtigt. Offene Punkte und Vertragsabweichungen werden vor Freigabe entschieden.",
      "descriptionEn": "Before contracting, assess function criticality, supervisory conditions, all relevant risks including concentration, provider suitability and conflicts of interest. Consider security standards, audit competence and relevant subcontractors proportionately and resolve open issues and deviations before approval.",
      "reason": "Die Sorgfaltsprüfung entscheidet vor der vertraglichen Bindung; ein nachträglicher Fragebogen an den Anbieter leistet das nicht.",
      "reasonEn": "Due diligence is a decision before commitment, not a retrospective vendor questionnaire.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Art. 28(4)–(6), Art. 29"
      ]
    }
  ],
  "D47": [
    {
      "id": "d47-c01",
      "title": "Identifikation von Konzentrationen",
      "titleEn": "Identification of Concentrations",
      "description": "Vor Vertragsschluss werden schwer ersetzbare Anbieter, mehrere Verträge mit demselben oder eng verbundenen Anbietern sowie gemeinsame Unterlieferanten und Infrastrukturabhängigkeiten ermittelt. Die Bewertung wird mit D16 und D18 verknüpft und bei relevanten Änderungen aktualisiert.",
      "descriptionEn": "Before contracting, identify hard-to-replace providers, multiple arrangements with the same or closely connected providers, and shared subcontractor and infrastructure dependencies. Link the assessment to D16 and D18 and update on relevant changes.",
      "reason": "Verschiedene Anbietermarken stehen nicht zwangsläufig für voneinander unabhängige Resilienz.",
      "reasonEn": "Different commercial brands do not necessarily provide independent resilience.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Arts. 28(4)(c), 29(1)"
      ]
    },
    {
      "id": "d47-c02",
      "title": "Bewertung der Auswirkungen",
      "titleEn": "Impact Assessment",
      "description": "Bewertet werden betroffene kritische oder wichtige Funktionen, Ausfallfolgen, Substituierbarkeit und Übergangshürden. Bei Unterbeauftragung und Drittstaaten werden Lieferkettenkomplexität, Überwachbarkeit, Insolvenzrecht, dringende Datenrückgewinnung, Datenschutz und Durchsetzbarkeit berücksichtigt.",
      "descriptionEn": "Assess affected critical or important functions, failure impact, substitutability and transition barriers. For subcontracting and third countries consider chain complexity, monitoring, insolvency law, urgent data recovery, data protection and enforceability.",
      "reason": "Das Konzentrationsrisiko ergibt sich nicht aus der Zahl der Anbieter, sondern aus Ausfallfolgen, Ersetzbarkeit und Übergangshürden.",
      "reasonEn": "Concentration assessment extends beyond counting providers.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Art. 29"
      ]
    },
    {
      "id": "d47-c03",
      "title": "Steuerungsmaßnahmen",
      "titleEn": "Mitigation Measures",
      "description": "Nutzen und Kosten geeigneter Alternativen werden gegen Geschäftsbedarf und Resilienzstrategie abgewogen. Gewählte Maßnahmen, etwa Diversifizierung, verifizierte Ausweichfähigkeit oder verstärkte Überwachung, erhalten Verantwortliche und Wirksamkeitsnachweise. Mehranbieterbetrieb ist nicht ausnahmslos vorgeschrieben und beseitigt gemeinsame Abhängigkeiten nicht automatisch.",
      "descriptionEn": "Weigh benefits and costs of suitable alternatives against business needs and resilience strategy. Assign owners and effectiveness evidence to chosen measures, such as diversification, verified fallback or stronger monitoring. Multi-provider operation is not invariably mandatory and does not automatically remove shared dependencies.",
      "reason": "Gefordert ist eine begründete Abwägung, nicht der automatische Bezug mehrerer Cloud-Anbieter.",
      "reasonEn": "The regulation requires a reasoned assessment, not automatic multi-cloud procurement.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Art. 29(1)–(2)"
      ]
    }
  ],
  "D48": [
    {
      "id": "d48-c01",
      "title": "Klassifizierungskriterien",
      "titleEn": "Classification Criteria",
      "description": "Die Bewertung folgt Artikel 18 und der Delegierten Verordnung 2024/1772. Voraussetzung ist, dass kritische Dienste betroffen sind und dass entweder das Kriterium nach Artikel 9 Absatz 5 Buchstabe b oder mindestens zwei andere Wesentlichkeitsschwellen erfüllt sind. Kunden, Gegenparteien, Transaktionen, Reputation, Dauer, geografische Ausbreitung, Datenverluste und wirtschaftliche Folgen werden mit belegten Werten oder begründeten Schätzungen geprüft. Wiederholte Vorfälle werden nach Artikel 8 Absatz 2 monatlich bewertet, soweit dessen Ausnahmen nicht greifen.",
      "descriptionEn": "Apply Article 18 and Delegated Regulation 2024/1772. Critical services must be affected and either Article 9(5)(b) or at least two other materiality thresholds met. Assess clients, counterparties, transactions, reputation, duration, geographical spread, data losses and economic effects using evidenced values or reasoned estimates. Assess recurring incidents monthly under Article 8(2), subject to its exceptions.",
      "reason": "Eine selbst entworfene Schweregradskala ersetzt die aufsichtsrechtlich vorgegebene Einstufungslogik nicht.",
      "reasonEn": "A locally invented severity score cannot substitute for the regulatory classification logic.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Art. 18; Delegated Regulation (EU) 2024/1772, Arts. 1–9"
      ]
    },
    {
      "id": "d48-c02",
      "title": "Meldefristen",
      "titleEn": "Reporting Deadlines",
      "description": "Erstmeldung: so früh wie möglich, höchstens vier Stunden nach Einstufung als schwerwiegend und grundsätzlich höchstens 24 Stunden nach Kenntnis; erfolgt die Einstufung erst später, gelten vier Stunden ab Einstufung. Zwischenbericht: spätestens 72 Stunden nach Erstmeldung, auch ohne Änderung; aktualisiert ohne unangemessene Verzögerung und jedenfalls bei Wiederherstellung des Regelbetriebs. Abschluss: spätestens einen Monat nach Zwischenbericht oder letztem aktualisiertem Zwischenbericht. Drohende Verspätung wird spätestens zur jeweiligen Frist begründet angezeigt. Wochenend- und Feiertagsregeln samt Ausnahmen werden nach Artikel 5 Absätze 4–6 gesondert angewendet.",
      "descriptionEn": "Initial notification: as early as possible, within four hours of classification as major and normally no later than 24 hours after awareness; where classification occurs later, within four hours of classification. Intermediate report: within 72 hours of initial submission even without change; update without undue delay and in any event on recovery of regular activities. Final report: within one month of the intermediate or latest updated intermediate report. Explain inability to meet a deadline to the authority no later than that deadline. Apply weekend and holiday rules and exceptions separately under Article 5(4)–(6).",
      "reason": "Diese Fristen weichen inhaltlich von NIS2 ab; dessen Zeitschema darf hier nicht übernommen werden.",
      "reasonEn": "These clocks differ materially from NIS2 and must not reuse its timing formula.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "Delegated Regulation (EU) 2025/301, Art. 5"
      ]
    },
    {
      "id": "d48-c03",
      "title": "Meldeinhalte und -wege",
      "titleEn": "Report Content and Channels",
      "description": "Zuständige Behörde, Meldekanal, Vertretung und Empfangsnachweis sind festgelegt. Die Vorlagen der Durchführungsverordnung 2025/302 werden mit den Inhalten der Verordnung 2025/301 je Meldestufe ausgefüllt; vorläufige Zahlen werden als Schätzungen kenntlich gemacht und aktualisiert. Betroffene Kunden werden ohne unangemessene Verzögerung informiert, wenn der Vorfall ihre finanziellen Interessen betrifft; weitere Veröffentlichungen richten sich nach der konkreten Pflicht.",
      "descriptionEn": "Define the competent authority, reporting channel, deputy and receipt evidence. Complete the templates in Implementing Regulation 2025/302 with the stage-specific information in Regulation 2025/301, marking and updating estimates. Inform affected clients without undue delay where the incident affects their financial interests; other disclosures follow their specific requirements.",
      "reason": "Bei der Kundeninformation entscheiden andere Auslöser und andere Empfänger als bei der Meldung an die Aufsicht.",
      "reasonEn": "Supervisory reporting and client information have different recipients and triggers.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Arts. 19(1), (3)–(5), 20; Regulations (EU) 2025/301 and 2025/302"
      ]
    },
    {
      "id": "d48-c04",
      "title": "Freiwillige Meldung erheblicher Cyberbedrohungen",
      "titleEn": "Voluntary Reporting of Significant Cyber Threats",
      "description": "Eine erhebliche Cyberbedrohung kann freiwillig der zuständigen Behörde gemeldet werden, wenn sie für Finanzsystem, Nutzer oder Kunden relevant erscheint. Entscheidung, Inhalt und Übermittlung werden dokumentiert. Unabhängig davon werden potenziell betroffene Kunden bei erheblichen Cyberbedrohungen gegebenenfalls über geeignete Schutzmaßnahmen informiert.",
      "descriptionEn": "A significant cyber threat may be voluntarily notified to the competent authority where relevant to the financial system, users or clients. Record the decision, content and submission. Independently, where applicable inform potentially affected clients of suitable protective measures in relation to significant cyber threats.",
      "reason": "Die freiwillige Meldung an die Behörde darf nicht als verpflichtend dargestellt werden, während die gesonderte Kundeninformation davon unberührt bleibt.",
      "reasonEn": "Voluntary authority notification must not be labelled as mandatory, while the separate applicable client duty remains.",
      "whenRequired": "Bei Anwendbarkeit der genannten Vorschrift.",
      "whenRequiredEn": "Where the cited provision applies.",
      "sources": [
        "DORA Art. 19(2)–(3); Delegated Regulation (EU) 2025/301, Art. 6"
      ]
    }
  ],
  "D49": [
    {
      "id": "d49-c01",
      "title": "Durchführung der Nachbereitung",
      "titleEn": "Conduct of Post-Mortem",
      "description": "Nach relevanten Vorfällen wird eine angemessene Nachbereitung durchgeführt. DORA Artikel 13 Absatz 2 verlangt sie nach einem schwerwiegenden IKT-Vorfall, der Kerntätigkeiten beeinträchtigt; das vereinfachte Rahmenwerk nach Artikel 16 ist gesondert zu berücksichtigen. Für CIR gilt Anhang 3.6 nach dessen Voraussetzungen. Interne kleinere Vorfälle werden nach ihrem Lernpotenzial behandelt. Die Nachbereitung ersetzt keine fristgerechte Meldung.",
      "descriptionEn": "Conduct an appropriate review after relevant incidents. DORA Article 13(2) requires it after a major ICT-related incident disrupts core activities; the simplified Article 16 framework is considered separately. CIR Annex 3.6 applies within its conditions. Smaller internal incidents are reviewed according to learning value. Review does not replace timely reporting.",
      "reason": "Reaktion und Lernprozess haben unterschiedliche Ziele und Zeitabläufe.",
      "reasonEn": "Response and learning have different objectives and timelines.",
      "whenRequired": "Nach dem jeweiligen Auslöser, abgestimmt auf Bedeutung.",
      "whenRequiredEn": "After the relevant trigger, proportionate to significance.",
      "sources": [
        "Regulation (EU) 2022/2554 13(2),16",
        "Implementing Regulation (EU) 2024/2690 Annex 3.6, where applicable",
        "ISO/IEC 27001:2022 A.5.27"
      ]
    },
    {
      "id": "d49-c02",
      "title": "Ursachen und Wirksamkeit",
      "titleEn": "Causes and Effectiveness",
      "description": "Der Bericht trennt gesicherte Tatsachen, plausible Ursachen und offene Fragen. Er bewertet Alarmreaktion, Schadenseinschätzung, gegebenenfalls Forensik, Eskalation sowie interne und externe Kommunikation. Abweichungen von Verfahren und Schutzlücken werden mit Belegen erfasst; unbekannte Ursachen werden nicht als geklärt dargestellt.",
      "descriptionEn": "The report separates established facts, plausible causes and unresolved questions. It assesses alert response, impact assessment, forensics where appropriate, escalation and internal and external communications. Procedure deviations and safeguard gaps are evidenced; unknown causes are not presented as resolved.",
      "reason": "Eine unbelegte Ursache kann zu unwirksamen Korrekturen führen.",
      "reasonEn": "An unsupported cause can lead to ineffective corrections.",
      "whenRequired": "Im Rahmen jeder durchgeführten Nachbereitung.",
      "whenRequiredEn": "Within each review that is performed.",
      "sources": [
        "Regulation (EU) 2022/2554 13(2)",
        "Implementing Regulation (EU) 2024/2690 Annex 3.6, where applicable",
        "ISO/IEC 27001:2022 A.5.27"
      ]
    },
    {
      "id": "d49-c03",
      "title": "Anpassung von Rahmen/Verträgen",
      "titleEn": "Adjustment of Framework/Contracts",
      "description": "Verbesserungen erhalten Verantwortliche, Fristen und Wirksamkeitsprüfung. Risikobewertung, Pläne, technische Maßnahmen und betroffene Lieferantenvereinbarungen werden gezielt aktualisiert, soweit die Erkenntnisse dies erfordern. Nicht jede Nachbereitung verlangt neue Verträge oder einen neuen Ausstiegsplan. Anwendbare behördliche Auskunftspflichten und Managementinformation werden erfüllt.",
      "descriptionEn": "Improvements receive owners, deadlines and effectiveness checks. Risk assessments, plans, technical safeguards and affected supplier arrangements are updated where findings require it. Not every review requires new contracts or a new exit plan. Applicable authority-information duties and management reporting are fulfilled.",
      "reason": "Ein geschlossener Maßnahmenpunkt ist erst mit überprüfter Wirkung belastbar.",
      "reasonEn": "A closed action becomes reliable only when its effect has been checked.",
      "whenRequired": "Bei Ableitung und Umsetzung von Verbesserungen.",
      "whenRequiredEn": "When deriving and implementing improvements.",
      "sources": [
        "Regulation (EU) 2022/2554 13(2)–(3)",
        "Implementing Regulation (EU) 2024/2690 Annex 3.6, where applicable",
        "ISO/IEC 27001:2022 10.2, A.5.27"
      ]
    }
  ],
  "D50": [
    {
      "id": "d50-c01",
      "title": "Pflichtinhalte",
      "titleEn": "Mandatory Content",
      "description": "Die auszufüllende Datenschutzhinweis-Vorlage benennt Verantwortlichen und gegebenenfalls Vertreter und Datenschutzkontakt, Zwecke und Rechtsgrundlagen, gegebenenfalls berechtigte Interessen, Empfänger, Drittlandübermittlungen einschließlich Mechanismus und Zugang zu Garantien, Aufbewahrung oder Bestimmungskriterien sowie anwendbare Rechte, Widerruf und Beschwerde. Bei einschlägigen automatisierten Entscheidungen werden deren Existenz, aussagekräftige Informationen über die Logik und erwartete Folgen erklärt. Nicht zutreffende Angaben werden begründet weggelassen, nicht mit erfundenen Standardwerten gefüllt.",
      "descriptionEn": "The notice schedule identifies the controller and relevant representative and privacy contact, purposes and legal bases, legitimate interests where relevant, recipients, international transfers with mechanism and access to safeguards, retention or criteria, applicable rights, withdrawal and complaints. For relevant automated decisions, explain their existence, meaningful information about the logic and expected consequences. Omit inapplicable items with justification rather than filling them with invented defaults.",
      "reason": "Allgemeine Schlagworte liefern nicht die tatsächlich erforderliche Information.",
      "reasonEn": "Generic labels do not provide the information actually required.",
      "whenRequired": "Bei Erstellung für die konkrete Verarbeitung.",
      "whenRequiredEn": "When preparing a notice for actual processing.",
      "sources": [
        "Regulation (EU) 2016/679 13(1)–(2),14(1)–(2)"
      ]
    },
    {
      "id": "d50-c02",
      "title": "Erhebung bei Betroffenen vs. Dritten",
      "titleEn": "Collection from Subjects vs. Third Parties",
      "description": "Bei Direkterhebung wird grundsätzlich zum Erhebungszeitpunkt informiert; außerdem wird erläutert, ob die Bereitstellung gesetzlich oder vertraglich vorgeschrieben oder für einen Vertrag erforderlich ist und welche Folgen Nichtbereitstellung hat. Bei Fremderhebung werden Datenkategorien und Quelle einschließlich öffentlicher Herkunft angegeben; Information erfolgt binnen angemessener Frist, spätestens einem Monat, gegebenenfalls früher bei erster Kommunikation oder Offenlegung. Gesetzliche Ausnahmen werden einzeln geprüft.",
      "descriptionEn": "For direct collection, normally inform at collection and explain whether providing data is legally or contractually required or necessary for a contract and the consequences of not providing it. For indirect collection, identify data categories and source, including public origin; inform within a reasonable period, at most one month, or earlier at first communication or disclosure where applicable. Assess statutory exceptions individually.",
      "reason": "Die Herkunft bestimmt zusätzliche Angaben und unterschiedliche Zeitpunkte.",
      "reasonEn": "The source determines additional information and different timing.",
      "whenRequired": "Bei direkter oder indirekter Erhebung.",
      "whenRequiredEn": "At direct or indirect collection.",
      "sources": [
        "Regulation (EU) 2016/679 13(2)(e),(4),14(2)(f),(3),(5)"
      ]
    },
    {
      "id": "d50-c03",
      "title": "Verständlichkeit",
      "titleEn": "Intelligibility",
      "description": "Hinweise sind klar, knapp und leicht erreichbar, mit auf die Zielgruppe abgestimmter Sprache. Mehrstufige Darstellung ist möglich, solange Pflichtangaben zuverlässig auffindbar bleiben. Hinweise werden nicht als Einwilligung ausgegeben; eine Bestätigung des Lesens ersetzt keine Rechtsgrundlage. Kinderbezogene Informationen werden besonders verständlich gestaltet.",
      "descriptionEn": "Notices are clear, concise and easily accessible in language appropriate to the audience. Layered presentation is possible if required information remains reliably accessible. Notices are not presented as consent; acknowledging reading does not provide a legal basis. Information addressed to children is particularly understandable.",
      "reason": "Transparenz und Einwilligung sind unterschiedliche Aufgaben.",
      "reasonEn": "Transparency and consent serve different purposes.",
      "whenRequired": "Bei Veröffentlichung und Bereitstellung.",
      "whenRequiredEn": "When publishing and providing notices.",
      "sources": [
        "Regulation (EU) 2016/679 12(1),13–14"
      ]
    },
    {
      "id": "d50-c04",
      "title": "Aktualität",
      "titleEn": "Currency",
      "description": "Verantwortliche und Version werden festgehalten; Hinweise werden bei relevanten Änderungen überprüft. Vor Weiterverarbeitung zu einem anderen Zweck werden die dafür erforderlichen Informationen bereitgestellt. Nachweise zeigen, welche Fassung wann und über welchen Weg bereitgestellt wurde. Eine bloß im Hintergrund geänderte Webseite erfüllt nicht automatisch jede erneute Informationspflicht.",
      "descriptionEn": "Record owner and version and review notices on relevant change. Provide required information before further processing for a different purpose. Evidence identifies which version was provided, when and through which route. A silently updated webpage does not automatically satisfy every renewed information duty.",
      "reason": "Betroffene können eine neue Verwendung ohne gezielte Information übersehen.",
      "reasonEn": "People may miss a new use without directed information.",
      "whenRequired": "Bei Änderungen und Zweckänderung vor neuer Verarbeitung.",
      "whenRequiredEn": "On change and before processing for a new purpose.",
      "sources": [
        "Regulation (EU) 2016/679 13(3),14(4),5(2)"
      ]
    }
  ],
  "D51": [
    {
      "id": "d51-c01",
      "title": "Sicherheit der Verarbeitung",
      "titleEn": "Security of Processing",
      "description": "Für die konkrete Verarbeitung werden tatsächlich umgesetzte technische und organisatorische Maßnahmen beschrieben und belegt. Vertraulichkeit, Integrität, Verfügbarkeit und Belastbarkeit sowie gegebenenfalls Pseudonymisierung und Verschlüsselung werden berücksichtigt. Artikel 32 schreibt nicht jede genannte Technik für jeden Vorgang gleichermaßen vor. Geplante und umgesetzte Maßnahmen bleiben unterscheidbar; Zugriffsberechtigte verarbeiten nur im zulässigen Weisungsrahmen.",
      "descriptionEn": "Describe and evidence safeguards actually implemented for the processing. Consider confidentiality, integrity, availability and resilience and, where appropriate, pseudonymisation and encryption. Article 32 does not require every listed technique identically for every activity. Distinguish planned from implemented safeguards; authorised people process within permissible instructions.",
      "reason": "Eine Vorlage mit angekreuzten Standards beweist keine tatsächliche Absicherung.",
      "reasonEn": "A template with checked standards does not prove actual safeguards.",
      "whenRequired": "Für erforderliche Sicherheitsnachweise.",
      "whenRequiredEn": "For necessary security evidence.",
      "sources": [
        "Regulation (EU) 2016/679 32(1),(4)"
      ]
    },
    {
      "id": "d51-c02",
      "title": "Risikoangemessenheit",
      "titleEn": "Risk Appropriateness",
      "description": "Auswahl und Umfang folgen Stand der Technik, Umsetzungskosten, Art, Umfang, Umständen und Zweck sowie Wahrscheinlichkeit und Schwere der Risiken für Personen. Verlust, Veränderung und unbefugte Offenlegung oder Zugriff werden konkret bewertet. Kostengründe allein rechtfertigen kein unangemessenes Sicherheitsniveau. DSFA und Risikobewertung werden bei Bedarf verknüpft.",
      "descriptionEn": "Selection and extent follow state of the art, implementation costs, nature, scope, context and purposes and likelihood and severity of risks to people. Assess loss, alteration and unauthorised disclosure or access specifically. Cost alone does not justify inadequate security. Link DPIA and risk assessment where relevant.",
      "reason": "Schutz muss zu den tatsächlichen Verarbeitungsszenarien passen.",
      "reasonEn": "Protection must fit actual processing scenarios.",
      "whenRequired": "Bei Auswahl und relevanten Änderungen.",
      "whenRequiredEn": "During selection and relevant change.",
      "sources": [
        "Regulation (EU) 2016/679 32(1)–(2)"
      ]
    },
    {
      "id": "d51-c03",
      "title": "Wiederherstellbarkeit",
      "titleEn": "Restorability",
      "description": "Fähigkeit zur zeitnahen Wiederherstellung von Verfügbarkeit und Zugang nach physischen oder technischen Zwischenfällen wird entsprechend dem Risiko eingerichtet und geprüft. Benötigte Daten, Schlüssel, Systeme und Verantwortliche werden einbezogen. Nachweise aus p35/p36 oder D45 können wiederverwendet werden; ein erfolgreicher Backup-Lauf ist kein Wiederherstellungstest.",
      "descriptionEn": "Establish and test the ability to restore availability and access in a timely manner after physical or technical incidents according to risk. Include necessary data, keys, systems and owners. Reuse evidence from p35/p36 or D45; a successful backup job is not a recovery test.",
      "reason": "Gesicherte Daten bleiben ohne Schlüssel oder Wiederherstellungswerkzeug möglicherweise unbrauchbar.",
      "reasonEn": "Backed-up data can remain unusable without keys or restoration tools.",
      "whenRequired": "Bei wiederherstellungsrelevanter Verarbeitung.",
      "whenRequiredEn": "For processing with restoration requirements.",
      "sources": [
        "Regulation (EU) 2016/679 32(1)(c)"
      ]
    },
    {
      "id": "d51-c04",
      "title": "Überprüfung der Wirksamkeit",
      "titleEn": "Effectiveness Review",
      "description": "Ein angemessenes Verfahren testet, bewertet und evaluiert die Wirksamkeit regelmäßig. Prüfgegenstand, Methode, Verantwortlicher, Intervall, Ergebnis und Maßnahmen werden dokumentiert. Relevante Änderungen oder Vorfälle lösen Neubewertung aus. Keine allgemeine jährliche Zertifizierung wird als DSGVO-Vorgabe angenommen.",
      "descriptionEn": "An appropriate process regularly tests, assesses and evaluates effectiveness. Record subject, method, owner, interval, outcome and actions. Relevant changes or incidents trigger reassessment. No general annual certification is presumed to be a GDPR requirement.",
      "reason": "Eine unveränderte Maßnahmenliste zeigt nicht, ob Schutz weiterhin funktioniert.",
      "reasonEn": "An unchanged safeguards list does not show whether protection still works.",
      "whenRequired": "Regelmäßig und bei relevanten Anlässen.",
      "whenRequiredEn": "Regularly and following relevant triggers.",
      "sources": [
        "Regulation (EU) 2016/679 32(1)(d),24"
      ]
    }
  ],
  "D52": [
    {
      "id": "d52-c01",
      "title": "Erfassung der Übermittlungen",
      "titleEn": "Recording of Transfers",
      "description": "Ausführer, Empfänger, Rollen, Daten, Zwecke und tatsächliche Zugriffe werden erfasst. Es wird geprüft, ob eine Übermittlung im Sinne von Kapitel V an eine andere Stelle in einem Drittland oder eine internationale Organisation vorliegt. Ein Mitarbeiter derselben Organisation auf Auslandsreise ist nicht allein deshalb ein gesonderter Datenimporteur; die Sicherheit seines Zugriffs bleibt zu bewerten. Weiterübermittlungen werden einbezogen.",
      "descriptionEn": "Record exporter, recipient, roles, data, purposes and actual access. Assess whether a Chapter V transfer to another entity in a third country or an international organisation occurs. An employee of the same organisation travelling abroad is not solely for that reason a separate data importer; access security still needs assessment. Include onward transfers.",
      "reason": "Standort und datenschutzrechtliche Empfängerrolle sind nicht identisch.",
      "reasonEn": "Location and the privacy recipient role are not identical.",
      "whenRequired": "Vor relevanten Datenflüssen und Änderungen.",
      "whenRequiredEn": "Before relevant flows and changes.",
      "sources": [
        "Regulation (EU) 2016/679 44–49; EDPB Guidelines 05/2021, Example 8"
      ]
    },
    {
      "id": "d52-c02",
      "title": "Rechtsgrundlage der Übermittlung",
      "titleEn": "Legal Basis of Transfer",
      "description": "Der verwendete Mechanismus wird einschließlich Reichweite und Gültigkeit dokumentiert: einschlägiger Angemessenheitsbeschluss, geeignete Garantien wie passende Standardvertragsklauseln oder verbindliche interne Datenschutzvorschriften, beziehungsweise eng begründete Ausnahme. Artikel 49 ist kein allgemeiner Ersatz für dauerhafte strukturelle Übermittlungen. Die allgemeine Verarbeitungsrechtsgrundlage wird unabhängig geprüft.",
      "descriptionEn": "Document the mechanism, scope and validity: relevant adequacy decision, appropriate safeguards such as suitable standard contractual clauses or binding corporate rules, or a narrowly justified derogation. Article 49 is not a general substitute for ongoing structural transfers. Assess the general processing legal basis separately.",
      "reason": "Ein Übermittlungsmechanismus legitimiert keine unzulässige ursprüngliche Verarbeitung.",
      "reasonEn": "A transfer mechanism does not legitimise unlawful underlying processing.",
      "whenRequired": "Für jeden einschlägigen Transferweg.",
      "whenRequiredEn": "For each relevant transfer route.",
      "sources": [
        "Regulation (EU) 2016/679 6,44–49"
      ]
    },
    {
      "id": "d52-c03",
      "title": "Transfer-Impact-Assessment (TIA)",
      "titleEn": "Transfer Impact Assessment",
      "description": "Bei erforderlicher Transferbewertung werden einschlägige Rechtslage und Praxis, Zugriffsmöglichkeiten öffentlicher Stellen, Art und Zweck der Daten sowie technische und vertragliche Schutzbedingungen beurteilt. Für Standardvertragsklauseln wird die passende Modul- und Anwendungswahl sowie deren Pflichterfüllung geprüft. Bewertung, Belege und Überprüfungsauslöser werden dokumentiert. Ein unterschriebener Klauseltext allein löst erkennbare Schutzprobleme nicht.",
      "descriptionEn": "Where transfer assessment is required, examine relevant law and practice, public-authority access, data nature and purpose and technical and contractual conditions. For standard contractual clauses, check suitable module and scope selection and fulfilment of their obligations. Record assessment, evidence and review triggers. Signed clauses alone do not resolve identifiable protection problems.",
      "reason": "Ein Schutzversprechen kann unwirksam sein, wenn der Empfänger es rechtlich oder tatsächlich nicht erfüllen kann.",
      "reasonEn": "A protection promise can fail where the recipient cannot legally or practically fulfil it.",
      "whenRequired": "Bei entsprechendem Übermittlungsmechanismus und relevanten Änderungen.",
      "whenRequiredEn": "For the relevant transfer mechanism and material changes.",
      "sources": [
        "Regulation (EU) 2016/679 46; Implementing Decision (EU) 2021/914 Annex clause 14"
      ]
    },
    {
      "id": "d52-c04",
      "title": "Ergänzende Maßnahmen",
      "titleEn": "Supplementary Measures",
      "description": "Zusätzliche Maßnahmen werden nach festgestellter Schutzlücke ausgewählt und auf Wirksamkeit geprüft. Verschlüsselung hilft gegen bestimmte Zugriffe nur, wenn Schlüssel- und Klartextzugang entsprechend beschränkt sind; notwendige Klartextverarbeitung beim Empfänger bleibt zu berücksichtigen. Kann das erforderliche Schutzniveau nicht gewährleistet werden, wird der Transfer nicht begonnen oder ausgesetzt und sicher beendet, soweit erforderlich.",
      "descriptionEn": "Select supplementary measures against identified protection gaps and test their effectiveness. Encryption helps against particular access only if keys and plaintext access are suitably restricted; necessary recipient-side plaintext processing remains relevant. If the required protection cannot be ensured, do not start the transfer or suspend and safely end it where required.",
      "reason": "Transportverschlüsselung schützt nicht vor Zugriff auf entschlüsselte Daten beim Empfänger.",
      "reasonEn": "Transport encryption does not prevent access to decrypted recipient-side data.",
      "whenRequired": "Bei festgestellten Transferlücken.",
      "whenRequiredEn": "For identified transfer gaps.",
      "sources": [
        "Regulation (EU) 2016/679 46; Implementing Decision (EU) 2021/914 Annex clauses 14–16"
      ]
    }
  ],
  "D53": [
    {
      "id": "d53-c01",
      "title": "Prüfung der Bestellpflicht",
      "titleEn": "Assessment of Obligation",
      "description": "Eine Benennungspflicht wird anhand Artikel 37 geprüft: öffentliche Stelle mit gesetzlicher Ausnahme, umfangreiche regelmäßige systematische Beobachtung als Kerntätigkeit oder umfangreiche Verarbeitung besonderer Daten beziehungsweise Straftatendaten als Kerntätigkeit. Zusätzliche nationale Anforderungen werden berücksichtigt, in Deutschland insbesondere § 38 BDSG. Eignung, Fachkunde und tatsächliche Verfügbarkeit der benannten Person werden nachgewiesen.",
      "descriptionEn": "Assess designation duties under Article 37: public bodies subject to its exception, large-scale regular systematic monitoring as a core activity, or large-scale special-category or offence-data processing as a core activity. Consider additional national requirements, including section 38 BDSG in Germany. Evidence suitability, expertise and actual availability of the designated person.",
      "reason": "Eine reine Beschäftigtenzahlprüfung übersieht eigenständige Verarbeitungsmerkmale.",
      "reasonEn": "A staff-count-only check misses independent processing criteria.",
      "whenRequired": "Bei Einrichtung, Änderungen und Benennung.",
      "whenRequiredEn": "On establishment, change and designation.",
      "sources": [
        "Regulation (EU) 2016/679 37; Germany BDSG §38 where applicable"
      ]
    },
    {
      "id": "d53-c02",
      "title": "Stellung und Unabhängigkeit",
      "titleEn": "Position and Independence",
      "description": "Die benannte Person wird rechtzeitig einbezogen, erhält notwendige Ressourcen, Zugang und Fortbildung und berichtet unmittelbar an die höchste Leitung. Ihre Datenschutzaufgaben werden weisungsfrei ausgeübt; Benachteiligung wegen dieser Aufgaben ist unzulässig. Andere Aufgaben dürfen keine Interessenkonflikte erzeugen. Beratung und Überwachung werden von der Verantwortung des Unternehmens für rechtmäßige Verarbeitung getrennt.",
      "descriptionEn": "Involve the designated person in time, provide necessary resources, access and ongoing expertise and ensure direct reporting to top management. Privacy duties are performed without instructions and without penalisation for performing them. Other tasks must not create conflicts. Advice and monitoring remain distinct from the organisation's responsibility for lawful processing.",
      "reason": "Ein für Verarbeitungszwecke verantwortlicher Leiter kann nicht unkritisch seine eigenen Entscheidungen überwachen.",
      "reasonEn": "A manager determining processing purposes cannot uncritically monitor their own decisions.",
      "whenRequired": "Während der Benennung.",
      "whenRequiredEn": "Throughout designation.",
      "sources": [
        "Regulation (EU) 2016/679 38–39"
      ]
    },
    {
      "id": "d53-c03",
      "title": "Meldung an die Aufsicht",
      "titleEn": "Notification to Authority",
      "description": "Kontaktdaten werden veröffentlicht und der zuständigen Aufsichtsbehörde mitgeteilt. Erreichbarkeit und Aktualität werden überprüft; Wechsel werden nachvollziehbar nachgeführt. Die Mitteilung wird belegt. Die DSGVO verlangt die Veröffentlichung von Kontaktdaten, nicht pauschal eine öffentliche Privatanschrift oder private Kontaktdaten der Person.",
      "descriptionEn": "Publish contact details and communicate them to the competent supervisory authority. Check reachability and currency and track changes. Preserve submission evidence. GDPR requires publication of contact details, not indiscriminate disclosure of the individual's private address or personal contact information.",
      "reason": "Ein nicht erreichbares Funktionspostfach erfüllt den Zweck der Kontaktmöglichkeit nicht.",
      "reasonEn": "An unreachable functional mailbox does not serve the purpose of contactability.",
      "whenRequired": "Bei Benennung und Kontaktänderungen.",
      "whenRequiredEn": "On designation and contact change.",
      "sources": [
        "Regulation (EU) 2016/679 37(7)"
      ]
    }
  ],
  "D54": [
    {
      "id": "d54-c01",
      "title": "Nachweis der Einwilligung",
      "titleEn": "Evidence of Consent",
      "description": "Soweit Einwilligung die gewählte Rechtsgrundlage ist, wird nachgewiesen, wer wann durch welche aktive Handlung welchen konkreten Zwecken nach welcher Informationsfassung zugestimmt hat. Ablehnung, Widerruf und spätere Änderungen bleiben nachvollziehbar. Keine nachträglich erfundene Einwilligung wird aus bloßer Nutzung abgeleitet. Der Nachweis enthält nicht mehr personenbezogene Daten als erforderlich.",
      "descriptionEn": "Where consent is the chosen legal basis, evidence who agreed when, through which affirmative action, to which specific purposes and information version. Refusal, withdrawal and later changes remain traceable. Do not fabricate retrospective consent from mere use. Evidence contains no more personal data than necessary.",
      "reason": "Ohne Informationsfassung ist die Reichweite einer alten Zustimmung oft nicht mehr nachweisbar.",
      "reasonEn": "Without the information version, the scope of previous consent may not be demonstrable.",
      "whenRequired": "Bei einwilligungsbasierter Verarbeitung.",
      "whenRequiredEn": "For consent-based processing.",
      "sources": [
        "Regulation (EU) 2016/679 7(1),5(1)(c)"
      ]
    },
    {
      "id": "d54-c02",
      "title": "Bedingungen wirksamer Einwilligung",
      "titleEn": "Conditions of Valid Consent",
      "description": "Einwilligung wird freiwillig, informiert, für bestimmte Zwecke und eindeutig eingeholt; vorausgewählte Kästchen oder Schweigen genügen nicht. Unterschiedliche Zwecke werden angemessen getrennt, unnötige Kopplung und Machtungleichgewicht werden berücksichtigt. Wo das Gesetz ausdrückliche Einwilligung verlangt, muss diese zusätzliche Anforderung erfüllt sein. Besondere Regeln für Kinder oder nationale Vorschriften sind gesondert zu prüfen.",
      "descriptionEn": "Obtain freely given, informed, specific and unambiguous consent; preselected boxes or silence are insufficient. Appropriately separate purposes and consider unnecessary tying and power imbalance. Where law requires explicit consent, meet that additional condition. Assess special child-related or national rules separately.",
      "reason": "Eine Unterschrift kann eine unfreiwillige Entscheidung nicht automatisch wirksam machen.",
      "reasonEn": "A signature does not automatically validate an involuntary decision.",
      "whenRequired": "Vor Einholung und Änderung von Zwecken.",
      "whenRequiredEn": "Before obtaining consent and changing purposes.",
      "sources": [
        "Regulation (EU) 2016/679 4(11),7–9"
      ]
    },
    {
      "id": "d54-c03",
      "title": "Widerruf",
      "titleEn": "Withdrawal",
      "description": "Widerruf ist jederzeit und so einfach wie Erteilung möglich; darüber wird vorab informiert. Nach Widerruf endet die darauf gestützte Verarbeitung für die Zukunft. Frühere Rechtmäßigkeit wird nicht rückwirkend aufgehoben. Eine andere Rechtsgrundlage wird nicht bloß zur Umgehung des Widerrufs nachgeschoben; echte unabhängige Pflichten und erforderliche begrenzte Nachweise werden gesondert beurteilt.",
      "descriptionEn": "Withdrawal is possible at any time and as easily as giving consent; inform people beforehand. Processing based on that consent stops prospectively after withdrawal. Previous lawfulness is not retroactively removed. Do not introduce another basis merely to evade withdrawal; assess genuinely independent obligations and necessary limited evidence separately.",
      "reason": "Ein funktionsloser Widerrufsknopf genügt nicht als Rechtsschutz.",
      "reasonEn": "A non-functional withdrawal button does not safeguard the right.",
      "whenRequired": "Bei Bereitstellung des Widerrufswegs und jedem Widerruf.",
      "whenRequiredEn": "When providing withdrawal routes and for each withdrawal.",
      "sources": [
        "Regulation (EU) 2016/679 7(3),17"
      ]
    }
  ],
  "D55": [
    {
      "id": "d55-c01",
      "title": "Nachweispflicht und Turnus",
      "titleEn": "Obligation and Cycle",
      "description": "Die konkrete BSI-Nachweisfrist wird festgehalten. Nach § 39 Absatz 1 folgt auf den behördlich festgelegten Ersttermin grundsätzlich ein dreijähriger Turnus; Erst- und Wiederaufnahme sowie Altbetreiber-Übergänge nach Absatz 3 werden getrennt geprüft. Die Ausnahme nach Absatz 4 für nach § 5 Absatz 7 KRITISDachG bestimmte Betreiber wird berücksichtigt.",
      "descriptionEn": "Record the actual BSI evidence deadline. Section 39(1) generally requires three-yearly evidence after the authority-set initial date; distinguish first qualification, requalification and legacy transitions under subsection 3. Apply subsection 4’s exception for operators designated under KRITISDachG section 5(7).",
      "reason": "Ein pauschaler Zweijahresturnus ist überholt, und der Ersttermin berechnet sich nicht für jeden Betreiber gleich.",
      "reasonEn": "The source’s blanket two-year cycle is obsolete and first deadlines are not calculated identically for every operator.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG § 39(1), (3)–(4)"
      ]
    },
    {
      "id": "d55-c02",
      "title": "Prüfung durch geeignete Stelle",
      "titleEn": "Audit by Qualified Body",
      "description": "Die prüfende Stelle erfüllt die für das konkrete Verfahren geltenden fachlichen, organisatorischen und Unabhängigkeitsanforderungen. Kompetenznachweise und Interessenkonfliktprüfung werden dokumentiert. Historische BSI-Orientierungshilfen werden nur im zutreffenden Übergangs- und Verfahrenskontext verwendet.",
      "descriptionEn": "Use an auditing body meeting the professional, organisational and independence requirements of the actual procedure. Record competence and conflict checks. Use historical BSI guidance only in the applicable transitional and procedural context.",
      "reason": "Allgemeine Prüferzertifikate belegen für dieses besondere Nachweisverfahren noch keine fachliche und unabhängige Eignung.",
      "reasonEn": "A generic auditor certificate alone does not establish suitability for this evidence procedure.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG § 39(2); applicable published BSI procedural requirements"
      ]
    },
    {
      "id": "d55-c03",
      "title": "Prüfumfang und Geltungsbereich",
      "titleEn": "Audit Scope",
      "description": "Kritische Anlage, Dienstleistung und die für ihre Funktionsfähigkeit maßgeblichen Systeme, Komponenten und Prozesse werden mit Standorten und Abhängigkeiten abgegrenzt. Ausgelagerte Teile werden nicht allein wegen Fremdbetriebs ausgeschlossen. Die Prüfung ordnet den Umfang den Anforderungen aus §§ 30 und 31 zu.",
      "descriptionEn": "Delineate the critical facility, service and systems, components and processes essential to its functioning, including locations and dependencies. Do not exclude outsourced parts merely because another party operates them. Map scope to sections 30 and 31.",
      "reason": "Ein ISO-Zertifikat mit abweichendem Geltungsbereich kann die vollständige Abdeckung der kritischen Anlage nicht belegen.",
      "reasonEn": "An ISO certificate with a different scope cannot establish complete KRITIS coverage.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG §§ 30, 31, 39(1)"
      ]
    },
    {
      "id": "d55-c04",
      "title": "Mängelliste und Behebung",
      "titleEn": "Deficiency List and Remediation",
      "description": "Prüfergebnisse enthalten die aufgedeckten Sicherheitsmängel. Für die interne Nachverfolgung werden Maßnahmen, Verantwortliche, Fristen und Wirksamkeitsnachweise geführt. Ein vom BSI verlangter Mängelbeseitigungsplan und angeforderte Behebungsnachweise werden fristgerecht vorgelegt.",
      "descriptionEn": "Results include identified security deficiencies. Track actions, owners, deadlines and effectiveness internally, and provide a remediation plan or remediation evidence requested by BSI within the applicable deadline.",
      "reason": "Das Gesetz trennt die Übermittlung der Prüfergebnisse von den zusätzlich angeforderten Plänen und Behebungsnachweisen.",
      "reasonEn": "The law distinguishes submission of findings from further plans or evidence requested by the authority.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG § 39(1)"
      ]
    },
    {
      "id": "d55-c05",
      "title": "Einbezug der Angriffserkennung",
      "titleEn": "Inclusion of Intrusion Detection",
      "description": "Der Nachweis umfasst die anwendbare Angriffserkennung nach § 31 Absatz 2. D56 liefert Systemabdeckung, laufenden Betrieb, Auswertung und Reaktion; ein Einkauf oder eine Installationsbestätigung allein reicht nicht.",
      "descriptionEn": "Include applicable intrusion detection under section 31(2), using D56 for coverage, operation, analysis and response. Purchase or installation evidence alone is insufficient.",
      "reason": "Maßgeblich ist heute § 31 Absatz 2, nicht mehr der frühere § 8a Absatz 1a.",
      "reasonEn": "The current statutory link is section 31(2), not former section 8a(1a).",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG §§ 31(2), 39(1)"
      ]
    },
    {
      "id": "d55-c06",
      "title": "Übermittlung an das BSI",
      "titleEn": "Submission to the BSI",
      "description": "Die für das aktuelle Verfahren erforderlichen Ergebnisse und Angaben zu Mängeln werden über den vorgegebenen Kanal fristgerecht übermittelt. Eingangsbeleg und übermittelte Version bleiben erhalten; zugrunde liegende Dokumentation wird auf Verlangen verfügbar gemacht. Die interne vollständige Prüfakte wird nicht automatisch mit dem stets einzureichenden Umfang gleichgesetzt.",
      "descriptionEn": "Submit results and deficiency information required by the current procedure through the prescribed channel on time. Retain receipt and submitted version and make underlying documentation available on request. Do not equate the complete internal audit file with the information always required for submission.",
      "reason": "Was einzureichen ist, gibt das Verfahren vor; es kann weniger umfassen als die vollständige Prüfakte.",
      "reasonEn": "Submission scope is prescribed by the procedure and may be narrower than the full working file.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG § 39(1)–(2)"
      ]
    }
  ],
  "D56": [
    {
      "id": "d56-c01",
      "title": "Pflicht zur Angriffserkennung",
      "titleEn": "Obligation for Intrusion Detection",
      "description": "Für die maßgeblichen Systeme, Komponenten und Prozesse der kritischen Anlage werden technische Werkzeuge und organisatorisch eingebundene Erkennungsprozesse betrieben. Geeignete Parameter und Merkmale werden kontinuierlich und automatisch erfasst und ausgewertet; Stand der Technik und Verhältnismäßigkeit werden nach § 31 Absatz 2 berücksichtigt.",
      "descriptionEn": "Operate technical tools and organisationally integrated detection processes for systems, components and processes essential to the critical facility. Continuously and automatically collect and analyse suitable parameters and characteristics, addressing state of the art and proportionality under section 31(2).",
      "reason": "Die KRITIS-Pflicht nach § 31 Absatz 2 ist enger gefasst als die Behauptung, NIS2 schreibe ein bestimmtes SIEM-Produkt vor.",
      "reasonEn": "This German KRITIS requirement is more specific than a universal claim that NIS2 requires a named SIEM product.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG §§ 2 Nr. 41, 31(2)"
      ]
    },
    {
      "id": "d56-c02",
      "title": "Protokollierung",
      "titleEn": "Logging",
      "description": "Relevante Datenquellen und Erfassungslücken werden dokumentiert. Protokolle und Verarbeitung werden gegen unbefugte Veränderung, Ausfall und Zugriff geschützt; Aufbewahrung, Zeitbezug und Überwachung der Erfassung werden festgelegt. Absolute Manipulationssicherheit wird nicht behauptet.",
      "descriptionEn": "Document relevant sources and collection gaps. Protect records and processing against unauthorised alteration, failure and access, and define retention, time reference and collection health monitoring. Do not claim absolute tamper-proofness.",
      "reason": "Brauchbare Erkennung beruht auf verlässlich ausgewählten Datenquellen, nicht auf dem unbegrenzten Sammeln sämtlicher Daten.",
      "reasonEn": "Useful detection requires reliable selected data, not unlimited collection of everything.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG § 31(2); BSI guidance on intrusion detection"
      ]
    },
    {
      "id": "d56-c03",
      "title": "Detektion",
      "titleEn": "Detection",
      "description": "Signatur-, Muster- und Anomalieauswertung werden passend zur Bedrohung und zur Anlage eingesetzt. Regeln, Schwellenwerte, Aktualisierung, Fehlalarmbehandlung und praktische Detektionstests werden belegt. Nichterkannte Testfälle lösen nachvollziehbare Verbesserungen aus.",
      "descriptionEn": "Apply signature, pattern and anomaly analysis appropriate to threats and the facility. Evidence rules, thresholds, updates, false-positive handling and practical detection tests, with improvements for missed cases.",
      "reason": "Dass ein Sensor läuft, sagt nichts darüber aus, ob einschlägige Angriffe tatsächlich erkannt werden.",
      "reasonEn": "A running sensor does not prove that relevant attacks are detected.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG § 31(2); BSI guidance on intrusion detection"
      ]
    },
    {
      "id": "d56-c04",
      "title": "Reaktion",
      "titleEn": "Response",
      "description": "Alarme erreichen zuständige und vertretende Personen. Bewertung, Eskalation, Eindämmung und Beseitigung werden mit sicheren Freigaben und dokumentierten Reaktionswegen geübt. Maßnahmen in sicherheitskritischen Betriebsanlagen berücksichtigen die Betriebssicherheit.",
      "descriptionEn": "Route alerts to responsible and backup personnel. Exercise assessment, escalation, containment and remediation with safe authorisations and documented response paths, considering operational safety in critical plant.",
      "reason": "Alarme, die niemand aufgreift, führen zu keiner wirksamen Reaktion der Organisation.",
      "reasonEn": "Unattended alerts cannot deliver an effective organisational response.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG § 31(2)"
      ]
    },
    {
      "id": "d56-c05",
      "title": "Umsetzungsgrad und Reifegrad",
      "titleEn": "Implementation and Maturity Level",
      "description": "Die Bewertung verwendet die für das Verfahren geltende BSI-Fassung und trennt Umsetzungsgrad, Wirksamkeit und offene Mängel. Ergebnisse werden mit D55 verknüpft; ein hoher interner Reifegrad ersetzt weder den gesetzlichen Nachweis noch eine unabhängige Prüfung.",
      "descriptionEn": "Use the BSI edition applicable to the procedure and distinguish implementation, effectiveness and deficiencies. Link results to D55; a high internal maturity score replaces neither statutory evidence nor independent review.",
      "reason": "Der Reifegrad ist ein Bewertungsinstrument und begründet für sich genommen keine Erfüllung der gesetzlichen Pflichten.",
      "reasonEn": "Maturity is an assessment instrument, not automatic statutory compliance.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG § 39; applicable BSI implementation and maturity guidance"
      ]
    }
  ],
  "D57": [
    {
      "id": "d57-c01",
      "title": "Registrierungspflicht",
      "titleEn": "Registration Obligation",
      "description": "Betreiber- und Anlagenregistrierung werden unterschieden. Für die kritische Anlage verweist § 33 Absatz 2 BSIG auf § 8 KRITISDachG; D80 führt die zugehörigen Angaben. Weitere Registrierungspflichten nach §§ 33 und 34 BSIG werden gesondert geprüft. Zeitpunkt der Einstufung, zuständige Stelle, Verfahren und fristgerechte Übermittlung werden belegt.",
      "descriptionEn": "Distinguish entity and facility registration. BSIG section 33(2) refers critical-facility registration to KRITISDachG section 8, with D80 holding the relevant data. Assess any additional sections 33 and 34 duties separately and evidence qualification date, authority, procedure and timely submission.",
      "reason": "Der frühere Verweis auf § 8b BSIG beschreibt den heutigen Registrierungsrahmen nicht mehr.",
      "reasonEn": "The former section 8b reference no longer describes the current registration framework.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG §§ 33–34; KRITISDachG § 8"
      ]
    },
    {
      "id": "d57-c02",
      "title": "Ständig erreichbare Kontaktstelle",
      "titleEn": "24/7 Contact Point",
      "description": "Die registrierte Kontaktstelle gewährleistet in Bezug auf Maßnahmen nach dem BSIG jederzeitige Erreichbarkeit. Rufbereitschaft, Vertretung, Eskalation und funktionsfähige Kontaktkanäle werden festgelegt und geprüft; eine persönliche E-Mail-Adresse ohne Vertretung genügt nicht.",
      "descriptionEn": "The registered contact point ensures reachability at all times for BSIG measures. Define and test on-call cover, deputies, escalation and functioning channels; a personal email address without cover is insufficient.",
      "reason": "Erreichbarkeit muss organisatorisch getragen sein; eine benannte Person allein stellt sie rund um die Uhr nicht sicher.",
      "reasonEn": "The contact duty requires operational availability, not only a named person.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "KRITISDachG § 8(1) Nr. 7"
      ]
    },
    {
      "id": "d57-c03",
      "title": "Aktualisierung der Angaben",
      "titleEn": "Updating of Details",
      "description": "Änderungen werden nach dem jeweils einschlägigen Registrierungstatbestand gemeldet. Nach § 8 Absatz 6 KRITISDachG werden Versorgungsgradwerte jährlich und andere Angaben unverzüglich, spätestens binnen zwei Wochen nach Kenntnis, aktualisiert. § 33 Absatz 5 BSIG gilt für die dort erfassten Angaben. Eingang und Datenstand werden dokumentiert.",
      "descriptionEn": "Notify changes under the relevant registration provision. Under KRITISDachG section 8(6), update service coverage values yearly and other details without delay within two weeks of awareness. BSIG section 33(5) applies to its respective information. Record receipt and data version.",
      "reason": "Nicht alle Registrierungsangaben unterliegen derselben Frist; jährliche und unverzügliche Aktualisierungspflichten fallen auseinander.",
      "reasonEn": "Not all registration fields share the same update frequency.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "KRITISDachG § 8(6); BSIG § 33(5)"
      ]
    }
  ],
  "D58": [
    {
      "id": "d58-c01",
      "title": "Meldepflichtige Störungen",
      "titleEn": "Reportable Disruptions",
      "description": "Der Vorfall wird anhand des geltenden BSIG-Erheblichkeitsbegriffs und einschlägiger Konkretisierungen bewertet. Bei Auswirkungen oder möglichen Auswirkungen auf eine kritische Anlage werden zusätzlich die Anforderungen aus § 32 Absatz 3 angewendet. Der historische § 8b-Meldetatbestand wird nicht als parallele aktuelle Pflicht fortgeschrieben.",
      "descriptionEn": "Assess the incident against the current BSIG significance definition and applicable specifications. Apply section 32(3) additions where a critical facility is or could be affected. Do not preserve former section 8b reporting as a separate current duty.",
      "reason": "Die Meldung von KRITIS-Störungen ist im geltenden BSIG-Meldesystem aufgegangen und wird nicht mehr nach dem früheren Tatbestand beurteilt.",
      "reasonEn": "KRITIS incident information is integrated into the current BSIG reporting framework.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG §§ 2, 32(1), (3)"
      ]
    },
    {
      "id": "d58-c02",
      "title": "Meldeinhalte",
      "titleEn": "Report Content",
      "description": "Meldungen enthalten die je Meldestufe geforderten Informationen, darunter erste Schwere- und Auswirkungsbewertung, gegebenenfalls Kompromittierungsindikatoren und grenzüberschreitende Effekte. Für KRITIS werden Art der Anlage, kritische Dienstleistung und deren tatsächliche oder mögliche Beeinträchtigung ergänzt. Unbekannte Angaben werden gekennzeichnet und aktualisiert.",
      "descriptionEn": "Provide stage-specific information, including initial severity and impact, available indicators of compromise and cross-border effects. Add facility type, critical service and actual or potential service impact for KRITIS. Mark and update unknown information.",
      "reason": "Ohne Angabe, wie die kritische Dienstleistung betroffen ist, bleibt eine technisch detaillierte Meldung unvollständig.",
      "reasonEn": "Technical detail without the effect on the critical service is incomplete.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG § 32(1), (3)"
      ]
    },
    {
      "id": "d58-c03",
      "title": "Fristen und Meldewege",
      "titleEn": "Deadlines and Channels",
      "description": "Frühe Erstmeldung: unverzüglich, spätestens 24 Stunden nach Kenntnis; Vorfallmeldung: unverzüglich, spätestens 72 Stunden nach Kenntnis. Zwischenmeldungen erfolgen auf Ersuchen. Abschlussmeldung folgt spätestens einen Monat nach Vorfallmeldung; bei andauerndem Vorfall wird stattdessen eine Fortschrittsmeldung und nach abschließender Bearbeitung die Abschlussmeldung vorgelegt. Aktuelle BSI-Verfahrensvorgaben, Meldeweg und tatsächliche Fristen werden dokumentiert.",
      "descriptionEn": "Early notification is without delay within 24 hours of awareness; incident notification is without delay within 72 hours of awareness. Intermediate reports follow requests. Submit the final report within one month of incident notification, or a progress report if ongoing, followed by the final report after handling is complete. Document current BSI procedural instructions, channel and actual deadlines.",
      "reason": "Das geltende BSIG sieht ein gestuftes Meldeverfahren mit eigenen Fristen vor, das eine pauschale Unverzüglichkeitsvorgabe nicht abbildet.",
      "reasonEn": "The current national text and its procedures must not be replaced by an obsolete single without-delay instruction.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG § 32(1)–(4)"
      ]
    },
    {
      "id": "d58-c04",
      "title": "Abgrenzung zu NIS2/DSGVO",
      "titleEn": "Delimitation to NIS2/GDPR",
      "description": "Ein gemeinsamer Vorfalldatensatz kann BSIG-, Datenschutz- und weitere Meldungen unterstützen. Für jede Pflicht werden Verantwortlicher, Empfänger, Schwelle, Fristauslöser und Übermittlung getrennt nachgewiesen. Eine BSIG-Meldung erfüllt nicht automatisch die DSGVO-Pflichten; das physische KRITIS-Meldewesen wird nach seinem eigenen Anwendungsbereich beurteilt.",
      "descriptionEn": "One incident record may support BSIG, privacy and other reports, but evidence each duty’s owner, recipient, threshold, deadline trigger and submission separately. A BSIG notification does not automatically fulfil GDPR, and physical KRITIS reporting has its own scope.",
      "reason": "Derselbe Sachverhalt kann mehrere Meldungen speisen, verschmilzt die rechtlich eigenständigen Pflichten aber nicht.",
      "reasonEn": "Shared facts reduce duplicate entry without merging distinct legal notifications.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG § 32; GDPR Arts. 33–34; KRITISDachG § 18"
      ]
    }
  ],
  "D59": [
    {
      "id": "d59-c01",
      "title": "Anwendung eines B3S",
      "titleEn": "Application of a B3S",
      "description": "Wird ein branchenspezifischer Sicherheitsstandard verwendet, werden Branche, Fassung, Anwendungsbereich und Zuordnung zu den gesetzlichen Anforderungen dokumentiert. Ein B3S ist ein möglicher Nachweisweg, keine universelle Pflicht zur Einführung eines bestimmten Branchenstandards.",
      "descriptionEn": "Where using a sector-specific security standard, record sector, edition, scope and mapping to legal requirements. A B3S is a possible assurance approach, not a universal duty to adopt a particular sector standard.",
      "reason": "Der Rückgriff auf einen Branchenstandard steht offen, ist aber keine für alle Betreiber geltende Vorgabe.",
      "reasonEn": "Conditional use must not be labelled as universally mandatory.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG § 30(8)–(9)"
      ]
    },
    {
      "id": "d59-c02",
      "title": "Eignungsfeststellung",
      "titleEn": "Suitability Determination",
      "description": "Wird die BSI-Eignungsfeststellung beansprucht, werden die konkrete veröffentlichte Feststellung, Fassung, Bedingungen und zeitliche Gültigkeit geprüft. Ein pauschaler Zweijahresturnus wird nicht unterstellt; fehlende oder veraltete Eignungsfeststellung wird offengelegt.",
      "descriptionEn": "If relying on BSI suitability determination, check the actual published determination, edition, conditions and validity period. Do not assume a universal two-year cycle; disclose absent or outdated determination.",
      "reason": "Die Geltungsdauer der Eignungsfeststellung und der Nachweiszyklus des Betreibers sind zwei verschiedene Fristen.",
      "reasonEn": "The standard’s recognition period and the operator’s evidence cycle are not interchangeable.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG § 30(8)–(9)"
      ]
    },
    {
      "id": "d59-c03",
      "title": "Abdeckung der SzA-Anforderungen",
      "titleEn": "Coverage of Intrusion-Detection Requirements",
      "description": "Die Abdeckungsmatrix prüft auch Angriffserkennung und gegebenenfalls vorrangige EU-Durchführungsanforderungen. Fehlende oder unzureichende B3S-Teile werden mit ergänzenden Maßnahmen und Nachweisen geschlossen. Die Anwendung des Standards allein bestätigt nicht die Wirksamkeit seiner Umsetzung.",
      "descriptionEn": "The coverage matrix includes intrusion detection and any prevailing EU implementing requirements. Close missing or insufficient B3S elements through additional safeguards and evidence. Applying the standard alone does not establish operational effectiveness.",
      "reason": "Ein branchenspezifischer Sicherheitsstandard darf hinter den anwendbaren Durchführungsanforderungen nicht zurückbleiben.",
      "reasonEn": "A B3S cannot undercut applicable implementing requirements.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "BSIG §§ 30(3), (8)–(9), 31(2)"
      ]
    }
  ],
  "D60": [
    {
      "id": "d60-c01",
      "title": "Datenherkunft und Eignung",
      "titleEn": "Data Provenance and Suitability",
      "description": "Für trainingsbasierte Hochrisiko-Systeme werden Herkunft, Erhebung, ursprünglicher Zweck, Nutzungsrechte und Eignung der Trainings-, Validierungs- und Testdaten dokumentiert. Bei nicht trainingsbasierten Systemen wird die angepasste Anwendung auf Testdaten nach Artikel 10 Absatz 6 berücksichtigt.",
      "descriptionEn": "For training-based high-risk systems document provenance, collection, original purpose, use rights and suitability of training, validation and test data. For systems not based on training apply the Article 10(6) adaptation to testing data.",
      "reason": "Welche Datenanforderungen greifen, hängt von der Entwicklungstechnik und dem Verwendungszweck des Systems ab.",
      "reasonEn": "The legal data requirement depends on the development technique and intended purpose.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Art. 10(1)–(2), (6)",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d60-c02",
      "title": "Bias- und Repräsentativitätsprüfung",
      "titleEn": "Bias and Representativeness Check",
      "description": "Daten werden auf relevante Verzerrungen und angemessene Repräsentativität für Einsatzkontext und betroffene Gruppen geprüft. Festgestellte Lücken und Maßnahmen werden dokumentiert. Besondere Kategorien personenbezogener Daten werden nicht pauschal für Fairnessanalysen freigegeben; jede Nutzung benötigt eine tragfähige Rechtsgrundlage und gegebenenfalls sämtliche engen Voraussetzungen von Artikel 4a.",
      "descriptionEn": "Assess relevant biases and appropriate representativeness for the use and affected groups, recording gaps and measures. Do not generally authorise special-category personal data for fairness analysis; each use needs a valid basis and, where relied upon, all narrow Article 4a conditions.",
      "reason": "Eine Verzerrungsprüfung begründet für sich genommen keine Befugnis, besondere Kategorien personenbezogener Daten zu verarbeiten.",
      "reasonEn": "Bias testing is not an unrestricted permission to process sensitive data.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Arts. 10(2)(f)–(g), 4a; GDPR Arts. 5, 6, 9",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d60-c03",
      "title": "Qualität und Vorverarbeitung",
      "titleEn": "Quality and Preprocessing",
      "description": "Qualitätsziele, Kennzeichnung, Bereinigung, Anreicherung und Vorverarbeitung werden versioniert. Relevanz, ausreichende Repräsentativität sowie bestmögliche Fehlerfreiheit und Vollständigkeit werden für den Zweck bewertet; bekannte Grenzen, Annahmen und Freigaben bleiben nachvollziehbar.",
      "descriptionEn": "Version quality targets, labelling, cleaning, enrichment and preprocessing. Assess relevance, sufficient representativeness and, to the best extent possible, freedom from errors and completeness for the purpose, retaining limitations, assumptions and approvals.",
      "reason": "Gefordert ist Datenqualität gemessen am Verwendungszweck, nicht die absolute Zusicherung fehlerfreier Datensätze.",
      "reasonEn": "The requirement is purpose-sensitive, not an absolute guarantee of perfect data.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Art. 10(2)–(4)",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    }
  ],
  "D61": [
    {
      "id": "d61-c01",
      "title": "Registrierung Hochrisiko-KI",
      "titleEn": "Registration of High-Risk AI",
      "description": "Anbieter oder gegebenenfalls Bevollmächtigte registrieren die erfassten Anhang-III-Systeme und sich selbst vor Bereitstellung; auch Entscheidungen nach Artikel 6 Absatz 3 fallen unter Artikel 49 Absatz 2. Öffentliche Betreiber registrieren die erfasste Nutzung. Anhang III Nummer 2 wird national registriert; bestimmte Strafverfolgungs-, Migrations-, Asyl- und Grenzsysteme gehören in den gesicherten nicht öffentlichen Bereich. Anhang-I-Systeme sind nicht allein wegen Hochrisikostatus generell EU-registerpflichtig.",
      "descriptionEn": "Providers or representatives register covered Annex III systems and themselves before supply; Article 6(3) conclusions fall under Article 49(2). Public deployers register covered use. Annex III point 2 uses national registration, and specified law-enforcement, migration, asylum and border systems use the secure non-public section. Annex I systems are not generally EU-registerable merely because they are high-risk.",
      "reason": "Nicht jede Registrierung eines Hochrisiko-Systems erfolgt öffentlich in der EU-Datenbank.",
      "reasonEn": "The source incorrectly described every high-risk registration as public EU registration.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Arts. 49, 71",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d61-c02",
      "title": "Pflichtangaben",
      "titleEn": "Mandatory Data",
      "description": "Die Angaben des jeweils einschlägigen Abschnitts von Anhang VIII werden mit System, Anbieterrolle, Zweck und erforderlichen Nachweisen abgeglichen. Registerkennung, Einreichung, Aktualisierung und Berechtigung der einreichenden Person werden protokolliert; vertrauliche Angaben werden nur im vorgesehenen Bereich eingestellt.",
      "descriptionEn": "Reconcile the applicable Annex VIII section with system, provider role, purpose and required evidence. Record registry identifier, submission, updates and submitter authority, using the designated area for restricted information.",
      "reason": "Je nach Registrierungsrolle gelten andere Pflichtfelder und andere Zugriffsbedingungen.",
      "reasonEn": "Different registration roles require different fields and access conditions.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Arts. 49, 71; Annex VIII",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    }
  ],
  "D62": [
    {
      "id": "d62-c01",
      "title": "Inhalte der Gebrauchsanweisung",
      "titleEn": "Content of Instructions",
      "description": "Die Anleitung nennt Anbieter und Kontakte, Zweck, Fähigkeiten, Grenzen, Genauigkeits- und Sicherheitsbedingungen, relevante betroffene Gruppen, bekannte Risiken und vorhersehbaren Fehlgebrauch. Sie beschreibt notwendige Eingaben, Ressourcen, Nutzungsdauer, Wartung und Updates sowie gegebenenfalls das Erfassen und Interpretieren von Protokollen.",
      "descriptionEn": "Identify provider and contacts, purpose, capabilities, limitations, accuracy and security conditions, relevant affected groups, known risks and foreseeable misuse. Describe required inputs, resources, lifetime, maintenance and updates and, where applicable, collection and interpretation of logs.",
      "reason": "Eine werbliche Funktionsübersicht genügt den Angaben nach Artikel 13 nicht.",
      "reasonEn": "A marketing feature list is not an Article 13 instruction set.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Art. 13",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d62-c02",
      "title": "Menschliche Aufsicht",
      "titleEn": "Human Oversight",
      "description": "Die Anleitung erklärt, wie Ergebnisse interpretiert, Grenzen erkannt, Entscheidungen überprüft und Ausgaben übergangen oder rückgängig gemacht werden. Sie beschreibt verfügbare Eingriffs- und sichere Stoppmöglichkeiten sowie notwendige Kompetenzen und verweist auf D63.",
      "descriptionEn": "Explain interpretation of outputs, recognition of limitations, review of decisions and how to disregard or reverse outputs. Describe intervention and safe-stop facilities and required competence, linking D63.",
      "reason": "Menschliche Aufsicht wirkt nur, wenn sie im tatsächlichen Arbeitsablauf des Betreibers auch ausgeübt werden kann.",
      "reasonEn": "Human oversight must be usable in the deployed workflow.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Arts. 13(3)(d), 14",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d62-c03",
      "title": "Aktualisierung",
      "titleEn": "Update",
      "description": "Anleitung, Systemversion und Änderungen werden gemeinsam verwaltet. Betroffene Betreiber erhalten relevante aktualisierte Anweisungen rechtzeitig; Sprache und Format sind zugänglich und verständlich. Frühere Versionen bleiben als Nachweis des damaligen Informationsstands erhalten.",
      "descriptionEn": "Manage instructions, system version and changes together. Provide affected deployers with relevant updates in time and use accessible, understandable language and format. Preserve earlier versions as evidence of the information supplied at the time.",
      "reason": "Eine überarbeitete Fassung, die betroffene Betreiber nicht erreicht, bleibt wirkungslos.",
      "reasonEn": "A revised file without delivery to affected deployers is insufficient.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Arts. 11, 13",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    }
  ],
  "D63": [
    {
      "id": "d63-c01",
      "title": "Aufsichtsmaßnahmen",
      "titleEn": "Oversight Measures",
      "description": "Anbietermaßnahmen und Betreiberaufgaben werden getrennt beschrieben. Die Aufsicht kann Fähigkeiten und Grenzen verstehen, Auffälligkeiten erkennen, Ausgaben sachgerecht interpretieren, die Nutzung unterlassen, Ergebnisse übergehen oder rückgängig machen und das System sicher unterbrechen, soweit nach Artikel 14 erforderlich. Eingriffe werden praktisch getestet.",
      "descriptionEn": "Distinguish provider design measures from deployer responsibilities. Enable oversight to understand capabilities and limits, detect anomalies, interpret outputs, decide not to use, disregard or reverse outputs and safely interrupt operation as required by Article 14. Test interventions in practice.",
      "reason": "Wer beaufsichtigen soll, muss den Betrieb tatsächlich unterbrechen und Ergebnisse verwerfen können.",
      "reasonEn": "A named reviewer without usable controls is not effective oversight.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Arts. 14(3)–(4), 26(2)",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d63-c02",
      "title": "Automation Bias",
      "titleEn": "Automation Bias",
      "description": "Arbeitsabläufe und Schulung machen das Risiko automatischen Vertrauens in KI-Ausgaben bewusst. Für folgenreiche Entscheidungen werden geeignete unabhängige Informationsquellen, Prüfzeit und Eskalation vorgesehen; eine bloße Bestätigungsschaltfläche ist keine inhaltliche Kontrolle.",
      "descriptionEn": "Workflows and training make over-reliance on AI outputs explicit. Provide suitable independent information, review time and escalation for consequential decisions; a confirmation button alone is not substantive oversight.",
      "reason": "Gefordert ist der bewusste und wirksame Umgang mit automatischem Vertrauen, nicht dessen vollständige Beseitigung.",
      "reasonEn": "The requirement concerns awareness and effective handling of automation bias, not a claim that all bias can be eliminated.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Art. 14(4)(b)",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d63-c03",
      "title": "Kompetenz der Aufsichtspersonen",
      "titleEn": "Competence of Oversight Personnel",
      "description": "Aufsichtspersonen besitzen für die Aufgabe erforderliche Kompetenz, Schulung, Befugnis und Unterstützung. Vertretung, Erreichbarkeit, Kenntnis der Systemgrenzen und die Befugnis zur Unterbrechung werden nachgewiesen; allgemeine KI-Grundlagen allein ersetzen diese rollenspezifische Befähigung nicht.",
      "descriptionEn": "Oversight personnel have the necessary competence, training, authority and support. Evidence deputies, availability, knowledge of limitations and power to intervene; general AI literacy alone does not establish role-specific capability.",
      "reason": "Artikel 26 Absatz 2 richtet diese Kompetenzpflicht ausdrücklich an den Betreiber.",
      "reasonEn": "The deployer obligation is specifically stated in Article 26(2).",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Art. 26(2)",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    }
  ],
  "D64": [
    {
      "id": "d64-c01",
      "title": "Risikobewertung des Produkts",
      "titleEn": "Product Risk Assessment",
      "description": "Die Bewertung berücksichtigt Zweck, vorhersehbare Nutzung und Fehlanwendung, Betriebsbedingungen, zu schützende Daten und Funktionen, Schnittstellen und Produktabhängigkeiten. Sie bestimmt die Anwendbarkeit der Anforderungen aus Anhang I und wird im technischen Dossier begründet.",
      "descriptionEn": "Assess intended and foreseeable use and misuse, operating conditions, data and functions to protect, interfaces and dependencies. Determine Annex I applicability with justification in the technical file.",
      "reason": "Produktspezifische Risiken lassen sich aus einem allgemeinen Unternehmensrisikoregister nicht ableiten.",
      "reasonEn": "A generic corporate risk register does not replace product-specific assessment.",
      "whenRequired": "Für erfasste Produkte und Rollen ab dem jeweiligen gesetzlichen Anwendungsdatum.",
      "whenRequiredEn": "For covered products and roles from the applicable statutory commencement date.",
      "sources": [
        "CRA Art. 13(2)–(3); Annex I Part I",
        "CRA Arts. 69, 71"
      ]
    },
    {
      "id": "d64-c02",
      "title": "Security by Design",
      "titleEn": "Security by Design",
      "description": "Ermittelte Risiken werden in verifizierbare Designanforderungen übersetzt: sichere Standardkonfiguration, begrenzte Angriffsfläche, angemessener Zugriffsschutz, Vertraulichkeit und Integrität, Verfügbarkeit, Minimierung verarbeiteter Daten sowie sichere Aktualisierung und Entfernung. Tests belegen die Umsetzung der für das Produkt anwendbaren Anforderungen.",
      "descriptionEn": "Translate risks into verifiable design requirements: secure defaults, limited attack surface, appropriate access protection, confidentiality and integrity, availability, data minimisation, secure updates and removal. Test implementation of requirements applicable to the product.",
      "reason": "Sichere Gestaltung muss sich an überprüfbaren Ergebnissen messen lassen und bleibt sonst ein Schlagwort.",
      "reasonEn": "Security by design needs demonstrable outcomes, not only a slogan.",
      "whenRequired": "Für erfasste Produkte und Rollen ab dem jeweiligen gesetzlichen Anwendungsdatum.",
      "whenRequiredEn": "For covered products and roles from the applicable statutory commencement date.",
      "sources": [
        "CRA Annex I Part I(1)–(2)",
        "CRA Arts. 69, 71"
      ]
    },
    {
      "id": "d64-c03",
      "title": "Fortschreibung über den Lebenszyklus",
      "titleEn": "Update over the Lifecycle",
      "description": "Risiken werden während Planung, Entwicklung, Produktion, Bereitstellung und Wartung berücksichtigt und über den Supportzeitraum bei relevanten Änderungen oder neuen Erkenntnissen aktualisiert. Betroffene Produktversionen, Entscheidungen, verbleibende Risiken und erforderliche Korrekturen bleiben nachvollziehbar.",
      "descriptionEn": "Consider risks during planning, development, production, supply and maintenance, updating over the support period for relevant changes or new information. Trace affected versions, decisions, residual risks and required corrections.",
      "reason": "Die Bewertung folgt den Änderungen am Produkt und endet nicht mit der Markteinführung.",
      "reasonEn": "The assessment must follow product changes, not stop at launch.",
      "whenRequired": "Für erfasste Produkte und Rollen ab dem jeweiligen gesetzlichen Anwendungsdatum.",
      "whenRequiredEn": "For covered products and roles from the applicable statutory commencement date.",
      "sources": [
        "CRA Art. 13(2)–(3), (8), (14)",
        "CRA Arts. 69, 71"
      ]
    }
  ],
  "D65": [
    {
      "id": "d65-c01",
      "title": "Vulnerability Handling",
      "titleEn": "Vulnerability Handling",
      "description": "Der Hersteller erfasst und analysiert Schwachstellen aus internen Prüfungen und externen Meldungen, behebt sie ohne Verzögerung und verfolgt betroffene Komponenten und Versionen. Regelmäßige Sicherheitsprüfungen, abgestimmte Offenlegung und gegebenenfalls Meldungen nach D31 werden verknüpft; Abschluss erfordert belegte Abhilfe oder Minderung.",
      "descriptionEn": "The manufacturer identifies and analyses vulnerabilities from internal tests and external reports, remedies them without delay and tracks affected components and versions. Link regular security tests, coordinated disclosure and applicable D31 reports; closure requires evidenced remedy or mitigation.",
      "reason": "Ein als erledigt markiertes Ticket belegt nicht, dass die betroffenen Produktversionen tatsächlich geschützt sind.",
      "reasonEn": "A ticket labelled closed does not establish that affected products are protected.",
      "whenRequired": "Für erfasste Produkte und Rollen ab dem jeweiligen gesetzlichen Anwendungsdatum.",
      "whenRequiredEn": "For covered products and roles from the applicable statutory commencement date.",
      "sources": [
        "CRA Art. 13(8); Annex I Part II(1)–(6)",
        "CRA Arts. 69, 71"
      ]
    },
    {
      "id": "d65-c02",
      "title": "Sicherheitsupdates",
      "titleEn": "Security Updates",
      "description": "Updates werden über geschützte Mechanismen verteilt, soweit erforderlich getrennt von Funktionsupdates und mit verständlichen Hinweisen. Verfügbare Sicherheitsupdates werden ohne Verzögerung und grundsätzlich kostenlos bereitgestellt; die eng begrenzte vertragliche Ausnahme für maßgeschneiderte Produkte eines Geschäftskunden wird nicht verallgemeinert. Jedes im Supportzeitraum veröffentlichte Sicherheitsupdate bleibt ab Veröffentlichung mindestens zehn Jahre oder für die längere verbleibende Supportzeit verfügbar.",
      "descriptionEn": "Distribute updates securely, separately from functionality updates where technically feasible, with clear advisories. Supply available security updates without delay and normally free of charge; do not generalise the narrow contractual exception for tailor-made business products. Keep every security update issued during support available for at least ten years from issue or the longer remaining support period.",
      "reason": "Wie lange ein veröffentlichtes Update abrufbar bleibt, ist etwas anderes als der Zeitraum, in dem neue Korrekturen entstehen.",
      "reasonEn": "Update availability after publication is distinct from the period for developing new fixes.",
      "whenRequired": "Für erfasste Produkte und Rollen ab dem jeweiligen gesetzlichen Anwendungsdatum.",
      "whenRequiredEn": "For covered products and roles from the applicable statutory commencement date.",
      "sources": [
        "CRA Art. 13(9); Annex I Part II(2), (7)–(8)",
        "CRA Arts. 69, 71"
      ]
    },
    {
      "id": "d65-c03",
      "title": "Support-Zeitraum",
      "titleEn": "Support Period",
      "description": "Die Supportdauer wird aus erwarteter Nutzungszeit, Produktart, Nutzererwartungen und relevanten Abhängigkeiten begründet. Sie beträgt mindestens fünf Jahre, sofern die erwartete Nutzung nicht kürzer ist; dann entspricht sie dieser Nutzungszeit. Eine längere erwartete Nutzung wird angemessen berücksichtigt. Endmonat und Endjahr werden beim Kauf leicht zugänglich angegeben; ein technisch möglicher Endhinweis wird vorgesehen.",
      "descriptionEn": "Justify support from expected use time, product type, user expectations and relevant dependencies. It is at least five years unless expected use is shorter, in which case it matches that period; appropriately account for longer expected use. Make the end month and year easily accessible at purchase and provide an end-of-support notice where technically feasible.",
      "reason": "Fünf Jahre bilden eine Untergrenze und keine Obergrenze; eine längere erwartete Nutzungsdauer muss angemessen berücksichtigt werden.",
      "reasonEn": "Five years is not a universal maximum or permission to ignore a longer expected life.",
      "whenRequired": "Für erfasste Produkte und Rollen ab dem jeweiligen gesetzlichen Anwendungsdatum.",
      "whenRequiredEn": "For covered products and roles from the applicable statutory commencement date.",
      "sources": [
        "CRA Art. 13(8), (19)",
        "CRA Arts. 69, 71"
      ]
    }
  ],
  "D66": [
    {
      "id": "d66-c01",
      "title": "Konsistenz mit Geschäftsstrategie",
      "titleEn": "Consistency with Business Strategy",
      "description": "Die Geschäftsleitung legt fest, wie IT die Geschäftsziele unterstützt und welche Risiken, Ressourcen und Abhängigkeiten damit verbunden sind. Die Strategie benennt ihren geltenden Aufsichtsrahmen. Bei DORA-Instituten wird sie mit der Strategie zur digitalen operationalen Resilienz nach Artikel 6 Absatz 8 bzw. dem einschlägigen vereinfachten Rahmen abgestimmt.",
      "descriptionEn": "Management defines how IT supports business objectives and the resulting risks, resources and dependencies. The strategy identifies its applicable supervisory regime. For DORA institutions it is aligned with the digital operational resilience strategy under Article 6(8), or the applicable simplified framework.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "MaRisk AT 4.2",
        "BAIT chapter 1, only while applicable",
        "DORA Articles 6(8), 16"
      ]
    },
    {
      "id": "d66-c02",
      "title": "Inhalte",
      "titleEn": "Content",
      "description": "Die Strategie beschreibt die Ausgangslage, angestrebte Architektur, Eigenleistung und Fremdbezug, Sicherheits- und Fortführungsanforderungen sowie priorisierte Veränderungen. Für jede wesentliche Initiative werden Ergebnis, Zuständigkeit, Abhängigkeiten, Finanzierung und nachvollziehbare Zielkriterien festgelegt; Produktnamen allein bilden keine Strategie.",
      "descriptionEn": "The strategy describes the current state, target architecture, internal and external provision, security and continuity needs and prioritised changes. Each material initiative has an outcome, owner, dependencies, funding and assessable objectives; product names alone do not constitute a strategy.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "BAIT chapter 1, only while applicable",
        "DORA Article 6(8), where applicable"
      ]
    },
    {
      "id": "d66-c03",
      "title": "Überprüfung",
      "titleEn": "Review",
      "description": "Der Strategieprozess verfolgt Umsetzung und Zielabweichungen und veranlasst Änderungen bei neuen Risiken, Geschäftsvorhaben oder Abhängigkeiten. Beschlüsse und Kommunikation werden versioniert. Eine organisationsintern festgelegte jährliche Strategiesitzung ersetzt keine anlassbezogene Neubewertung und wird nicht als allgemeine DORA-Frist ausgegeben.",
      "descriptionEn": "The strategy process tracks delivery and deviations and initiates changes for new risks, business initiatives or dependencies. Decisions and communication are versioned. An internally chosen annual strategy meeting does not replace event-driven reassessment and is not presented as a universal DORA deadline.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "MaRisk AT 4.2(4)-(7)",
        "BAIT chapter 1, only while applicable"
      ]
    }
  ],
  "D67": [
    {
      "id": "d67-c01",
      "title": "Ziele des Notfallmanagements",
      "titleEn": "Objectives of Contingency Management",
      "description": "Das Institut bestimmt anhand seiner Prozessübersicht sowie Auswirkungs- und Risikoanalysen zeitkritische Aktivitäten, Abhängigkeiten und Notfallszenarien. Daraus werden Ziele, Auslösekriterien, Zuständigkeiten und ein Notfallkonzept abgeleitet. Im Anwendungsbereich von AT 7.3 wird dessen Aktualität jährlich und anlassbezogen geprüft; die Geschäftsleitung erhält mindestens quartalsweise und anlassbezogen einen schriftlichen Statusbericht.",
      "descriptionEn": "Using its process inventory and impact and risk assessments, the institution identifies time-critical activities, dependencies and emergency scenarios. It derives objectives, activation criteria, responsibilities and its emergency framework. Within AT 7.3 scope, currency is reviewed annually and on relevant events; management receives a written status report at least quarterly and when events require.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "MaRisk AT 7.3(1)"
      ]
    },
    {
      "id": "d67-c02",
      "title": "Geschäftsfortführungspläne",
      "titleEn": "Business Continuity Plans",
      "description": "Die Geschäftsfortführungspläne legen fest, wie Ersatzlösungen für zeitkritische Aktivitäten aktiviert werden, wer Entscheidungen trifft und welche Personen, Lieferanten, Daten, Standorte und Kommunikationswege benötigt werden. Für ausgelagerte zeitkritische Prozesse werden die Pläne mit den Anbietern abgestimmt und erreichbare Kontaktwege hinterlegt.",
      "descriptionEn": "Continuity plans specify how substitute arrangements for time-critical activities are activated, who decides and which people, suppliers, data, sites and communications are required. Plans for outsourced time-critical processes are aligned with providers and include usable contact routes.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "MaRisk AT 7.3(2)"
      ]
    },
    {
      "id": "d67-c03",
      "title": "Wiederanlaufpläne",
      "titleEn": "Recovery Plans",
      "description": "Wiederherstellungspläne beschreiben Abhängigkeiten, Rückkehr zum Normalbetrieb, Datenabgleich, Freigabekriterien und die sichere Beendigung von Ersatzverfahren. Technische Wiederanläufe werden an den in der BIA begründeten Zeit- und Datenzielen geprüft; ein Systemstart allein gilt nicht als Wiederherstellung der Geschäftsleistung.",
      "descriptionEn": "Recovery plans describe dependencies, return to normal operations, data reconciliation, release criteria and safe termination of substitute procedures. Technical recovery is assessed against BIA-derived time and data objectives; starting a system alone does not demonstrate restored business service.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "MaRisk AT 7.3(2)",
        "DORA Articles 11-12, where applicable"
      ]
    },
    {
      "id": "d67-c04",
      "title": "Tests",
      "titleEn": "Tests",
      "description": "Für zeitkritische Aktivitäten und Prozesse wird die Wirksamkeit des Notfallkonzepts für alle relevanten Szenarien mindestens jährlich und anlassbezogen nachgewiesen. Übungen und Tests dokumentieren tatsächliche Ergebnisse, Abweichungen, Verantwortliche und Maßnahmen mit Nachprüfung. DORA-Testpflichten werden bei Anwendbarkeit zusätzlich zugeordnet, ohne identische Tests zweimal zu verlangen.",
      "descriptionEn": "For time-critical activities and processes, effectiveness of the emergency framework is demonstrated for all relevant scenarios at least annually and when events require. Exercises and tests record actual outcomes, deviations, owners and actions with follow-up. Applicable DORA testing duties are mapped without requiring identical tests twice.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "MaRisk AT 7.3(3)",
        "DORA Article 11(6), where applicable"
      ]
    }
  ],
  "D68": [
    {
      "id": "d68-c01",
      "title": "Schriftliches Konzept",
      "titleEn": "Written Concept",
      "description": "Für Anwendungen und Daten werden geschäftlich begründete Zugriffsrollen, Verantwortliche, Genehmigung und technische Umsetzung festgelegt. Der Nachweis verknüpft das Berechtigungskonzept mit tatsächlich eingerichteten Konten und Rechten. Die Rechtsgrundlage richtet sich nach dem festgestellten BAIT- oder DORA-Anwendungsbereich.",
      "descriptionEn": "For applications and data, define business-justified access roles, owners, approval and implementation. Evidence links the access model to accounts and permissions actually configured. The regulatory basis follows the established BAIT or DORA scope.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "BAIT chapter 6, only while applicable",
        "DORA Article 9(4)(c)"
      ]
    },
    {
      "id": "d68-c02",
      "title": "Funktionstrennung",
      "titleEn": "Segregation of Duties",
      "description": "Unvereinbare Tätigkeiten und privilegierte Berechtigungen werden vor der Freigabe geprüft. Nicht vermeidbare Konflikte erhalten begründete, befristete Ausnahmen und unabhängige Kontrollen. Genehmigung, Ausführung und Kontrolle dürfen nicht unbemerkt in derselben Person zusammenfallen.",
      "descriptionEn": "Conflicting duties and privileged permissions are checked before approval. Unavoidable conflicts receive justified, time-limited exceptions and independent safeguards. Approval, execution and checking must not silently converge in one person.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "MaRisk AT 4.3.1(1)",
        "BAIT chapter 6, only while applicable",
        "DORA Article 9(4)(c)"
      ]
    },
    {
      "id": "d68-c03",
      "title": "Rezertifizierung",
      "titleEn": "Recertification",
      "description": "Fachverantwortliche prüfen tatsächliche Berechtigungen in begründeten Intervallen und bei Rollenwechseln, Austritten oder auffälliger Nutzung. Jede Bestätigung benennt Prüfumfang und Datum; unberechtigte Rechte werden entfernt und deren Entfernung nachgewiesen. Ein versandter Prüfauftrag ohne bearbeitetes Ergebnis ist keine Rezertifizierung.",
      "descriptionEn": "Business owners review actual permissions at justified intervals and following role changes, departures or suspicious use. Each confirmation identifies scope and date; unauthorised rights are removed and removal is evidenced. Sending a review request without a completed result is not recertification.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "BAIT chapter 6, only while applicable",
        "DORA Article 9(4)(c); Delegated Regulation (EU) 2024/1774 Article 21, within scope"
      ]
    }
  ],
  "D69": [
    {
      "id": "d69-c01",
      "title": "Schutzbedarf und Risiken",
      "titleEn": "Protection Needs and Risks",
      "description": "Der Informationsverbund wird mit Geschäftsprozessen, Informationen, Anwendungen, Infrastruktur und Abhängigkeiten erfasst. Fachverantwortliche begründen Schutzbedarf und Schadensfolgen; daraus werden konkrete Bedrohungs- und Schwachstellenszenarien abgeleitet. Klassifikationsbezeichnungen allein ersetzen keine Risikoanalyse.",
      "descriptionEn": "Record the information environment with business processes, information, applications, infrastructure and dependencies. Business owners justify protection needs and consequences of harm; derive concrete threat and vulnerability scenarios. Classification labels alone do not replace risk assessment.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "BAIT chapter 3, only while applicable",
        "DORA Article 8, or Article 16 framework where applicable"
      ]
    },
    {
      "id": "d69-c02",
      "title": "Steuerung und Überwachung",
      "titleEn": "Management and Monitoring",
      "description": "Für bewertete Risiken werden Maßnahmen, Verantwortliche, Ressourcen und Termine festgelegt. Wirksamkeit wird anhand geeigneter Tests oder Betriebsdaten beurteilt; Restrisiken werden von befugten Verantwortlichen entschieden. Planstatus, Implementierung und tatsächliche Risikominderung bleiben getrennte Angaben.",
      "descriptionEn": "For assessed risks, define actions, owners, resources and dates. Evaluate effectiveness using suitable tests or operational data; authorised owners decide on residual risk. Planned status, implementation and actual risk reduction remain separate fields.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "MaRisk AT 4.3.2",
        "BAIT chapter 3, only while applicable",
        "DORA Article 6, within scope"
      ]
    },
    {
      "id": "d69-c03",
      "title": "Berichterstattung",
      "titleEn": "Reporting",
      "description": "Das Risikoberichtswesen zeigt wesentliche Informationsrisiken, Veränderungen, Abhängigkeiten, überfällige Maßnahmen und notwendige Entscheidungen. Berichtsturnus und Ad-hoc-Auslöser werden aus dem geltenden Aufsichtsrahmen abgeleitet. Die Unterlage verknüpft die Originalrisiken und Maßnahmen, statt einen widersprüchlichen Parallelbestand zu erzeugen.",
      "descriptionEn": "Risk reporting shows material information risks, changes, dependencies, overdue actions and decisions required. Reporting frequency and escalation triggers are derived from the applicable supervisory regime. Link original risks and actions rather than creating a contradictory parallel inventory.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "MaRisk BT 3",
        "BAIT chapter 3, only while applicable",
        "DORA Article 6, within scope"
      ]
    }
  ],
  "D70": [
    {
      "id": "d70-c01",
      "title": "Register der IDV-Anwendungen",
      "titleEn": "Register of EUC Applications",
      "description": "Fachbereiche melden selbst entwickelte oder selbst betriebene Anwendungen, einschließlich relevanter Tabellen, Makros, Skripte und Low-Code-Lösungen. Das Register benennt Eigentümer, Zweck, Daten, Abhängigkeiten und Kritikalität. Die Einordnung richtet sich nach Auswirkung und Nutzung, nicht nach der Dateiendung.",
      "descriptionEn": "Business functions register applications they develop or operate, including relevant spreadsheets, macros, scripts and low-code solutions. Record owner, purpose, data, dependencies and criticality. Classification depends on impact and use, not filename extension.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "MaRisk AT 7.2(5), only where still applicable",
        "BAIT chapter 7, only while applicable",
        "DORA Article 8, within scope"
      ]
    },
    {
      "id": "d70-c02",
      "title": "Kontrollen",
      "titleEn": "Controls",
      "description": "Für die erfassten Anwendungen werden risikogerecht Versionsführung, fachliche Tests, Freigabe, Zugriffsrechte, Datensicherung und Vertretung festgelegt. Wesentliche Formeln und Schnittstellen werden nachvollziehbar dokumentiert. Änderungen dürfen nicht unbemerkt produktive Ergebnisse verfälschen; Stilllegung und Datenübernahme werden geplant.",
      "descriptionEn": "For registered applications, define risk-appropriate version control, business testing, approval, access, backup and cover arrangements. Document significant formulas and interfaces sufficiently for review. Changes must not silently corrupt production results; plan retirement and data transfer.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "MaRisk AT 7.2(3)-(5), only where still applicable",
        "BAIT chapter 7, only while applicable",
        "DORA Article 9, within scope"
      ]
    }
  ],
  "D71": [
    {
      "id": "d71-c01",
      "title": "Lösungsoptionen",
      "titleEn": "Solution Options",
      "description": "Für priorisierte Aktivitäten werden mögliche Fortführungs- und Wiederherstellungslösungen anhand der BIA, Risiken und Abhängigkeiten verglichen. Der Vergleich berücksichtigt erforderliche Mindestleistung, Wiederanlaufzeit (RTO), maximal tolerierbare Unterbrechung und, soweit datenbezogen relevant, den Wiederherstellungspunkt (RPO). Kosten, Machbarkeit, Konzentrationsrisiken und Ausfallszenarien fließen in die begründete Auswahl ein.",
      "descriptionEn": "Compare candidate continuity and recovery solutions for prioritised activities against BIA findings, risks and dependencies. Consider minimum acceptable capacity, recovery time objective (RTO), maximum tolerable disruption and, where data recovery is relevant, recovery point objective (RPO). Include cost, feasibility, concentration risks and failure scenarios in the justified selection.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "ISO 22301:2019 clauses 8.2-8.3",
        "ISO 27001:2022 Annex A.5.29-A.5.30",
        "NIS2 Article 21(2)(c); CIR Annex 4.1, within scope"
      ]
    },
    {
      "id": "d71-c02",
      "title": "Ressourcen und Priorisierung",
      "titleEn": "Resources and Prioritisation",
      "description": "Die ausgewählten Lösungen erhalten konkrete Anforderungen an Personal und Vertretung, Informationen, Gebäude, Betriebsmittel, IT, Kommunikation, Lieferanten und Finanzierung. Wiederherstellungsreihenfolge und gemeinsame Engpässe werden aufeinander abgestimmt. Verfügbarkeit zugesagter Ressourcen wird überprüft; eine unverbindliche Lieferantenzusage genügt nicht als gesicherte Kapazität.",
      "descriptionEn": "Define concrete requirements for people and cover, information, premises, equipment, IT, communication, suppliers and funding for the chosen solutions. Align recovery order and shared bottlenecks. Verify availability of committed resources; a non-binding supplier promise does not establish assured capacity.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "ISO 22301:2019 clauses 8.3.3-8.3.5",
        "DORA Articles 11-12, where applicable"
      ]
    },
    {
      "id": "d71-c03",
      "title": "Freigabe",
      "titleEn": "Approval",
      "description": "Die zuständige Leitung bestätigt ausgewählte Lösungen, Ressourcen, Zuständigkeiten und verbleibende Risiken. Nach der Freigabe werden Lösungen eingerichtet, in D35/D36 oder gleichwertige Pläne überführt und durch geeignete Übungen und Tests bewertet. Eine reine Freigabe ohne Umsetzung beendet die Strategiearbeit nicht.",
      "descriptionEn": "Responsible management confirms selected solutions, resources, responsibilities and residual risks. After approval, implement the solutions, translate them into D35/D36 or equivalent plans and evaluate them through suitable exercises and tests. Approval without implementation does not complete the strategy work.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "ISO 22301:2019 clauses 5.1, 8.3.5, 8.5"
      ]
    }
  ],
  "D72": [
    {
      "id": "d72-c01",
      "title": "Zielgruppen und Sprecher",
      "titleEn": "Audiences and Spokespersons",
      "description": "Der Krisenstab bestimmt Ansprechpartner und Stellvertretungen für Beschäftigte, Kunden, Lieferanten, Behörden und erforderlichenfalls Öffentlichkeit und Medien. Freigabebefugnisse, Lageabgleich und Eskalation werden festgelegt. Die Sprecherfunktion wird von der Verantwortung für gesetzliche Meldungen unterschieden, auch wenn dieselbe Person beides übernimmt.",
      "descriptionEn": "The crisis team assigns contacts and deputies for personnel, customers, suppliers, authorities and, where necessary, the public and media. Define approval authority, situational alignment and escalation. Distinguish the spokesperson role from responsibility for statutory notifications, even where one person performs both.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "ISO 22301:2019 clause 8.4.3",
        "CIR Annex 4.3.1-4.3.2",
        "DORA Article 14"
      ]
    },
    {
      "id": "d72-c02",
      "title": "Kanäle und Vorlagen",
      "titleEn": "Channels and Templates",
      "description": "Der Plan enthält aktuelle Kontaktwege, sichere Ersatzkommunikation bei Ausfall der normalen IT und kurze Vorlagen für Erstinformation, Lageänderung und Entwarnung. Vorlagen unterscheiden bestätigte Tatsachen von offenen Fragen und enthalten nächste Informationszeitpunkte. Kontaktlisten und Vorlagen bleiben auch bei einem Ausfall erreichbar und werden zugriffsgeschützt gehalten.",
      "descriptionEn": "The plan provides current contact routes, secure fallback communication if normal IT fails and concise templates for initial information, updates and closure. Templates distinguish confirmed facts from unknowns and state the next update time. Contact lists and templates remain accessible during outages and are access-protected.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "ISO 22301:2019 clause 8.4.3",
        "CIR Annex 4.3.2"
      ]
    },
    {
      "id": "d72-c03",
      "title": "Abstimmung mit Meldepflichten",
      "titleEn": "Alignment with Reporting Duties",
      "description": "Bei jedem Ereignis werden die einschlägigen Meldungen und Empfänger anhand der geltenden Rollen und Schwellen bestimmt. Fristberechnung und Versandnachweise werden in D83 geführt und mit D14, D24 oder D48 verknüpft. Öffentlichkeitsarbeit darf eine Pflichtmeldung nicht verzögern; eine Pressemitteilung ersetzt weder die Meldung an die zuständige Stelle noch eine erforderliche Benachrichtigung Betroffener.",
      "descriptionEn": "For each event, determine applicable notifications and recipients from the relevant roles and thresholds. Track deadline calculations and submission evidence in D83, linked to D14, D24 or D48. Public relations must not delay a mandatory notification; a press release replaces neither reporting to the competent body nor a required notification to affected persons.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "NIS2 Article 23",
        "GDPR Articles 33-34",
        "DORA Articles 19, 14, where applicable"
      ]
    },
    {
      "id": "d72-c04",
      "title": "Übung",
      "titleEn": "Exercise",
      "description": "Übungen prüfen Kontaktierbarkeit, Stellvertretung, Freigabe, Ersatzkanäle und konsistente Lageinformationen unter realistischen Störungen. Ergebnisse und Korrekturen werden dokumentiert. Der Turnus richtet sich nach dem einschlägigen Rahmen; DORA-Institute beachten die einschlägige jährliche Prüfung der Krisenkommunikationspläne, CIR-Einrichtungen regelmäßige Tests bzw. wesentliche Änderungen nach Anhang 4.3.4.",
      "descriptionEn": "Exercises test reachability, cover arrangements, approval, fallback channels and consistent situational information under realistic disruption. Record results and corrections. Frequency follows the applicable framework; DORA institutions observe the applicable annual testing of crisis communication plans, and CIR entities follow regular testing or significant changes under Annex 4.3.4.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "ISO 22301:2019 clause 8.5",
        "DORA Article 11(6)(b)",
        "CIR Annex 4.3.4"
      ]
    }
  ],
  "D73": [
    {
      "id": "d73-c01",
      "title": "Aufbau und Umfang des QMS",
      "titleEn": "Structure and Scope of the QMS",
      "description": "Der Anbieter dokumentiert die Artikel-17-Bestandteile: Compliance- und Änderungsstrategie, Entwurf, Entwicklung und Qualitätssicherung, Prüfverfahren, Spezifikationen, Datenmanagement, Risikomanagement, Marktbeobachtung, Vorfallmeldung, Kommunikation, Aufzeichnungen, Ressourcen und Verantwortlichkeiten. Für jeden Bestandteil wird der tatsächliche Prozess samt Nachweis verlinkt. Der frühere pauschale Beginn am 2. August 2026 wird durch die konkrete Prüfung von Artikel 113 Buchstabe c ersetzt.",
      "descriptionEn": "Document the Article 17 components: compliance and change strategy, design, development and quality assurance, testing, specifications, data, risk management, post-market monitoring, incident reporting, communications, records, resources and accountability. Link an actual process and evidence for each. Replace the former blanket 2 August 2026 start with the specific Article 113(c) assessment.",
      "reason": "Weil die Geltungstermine für Hochrisikosysteme geändert wurden, führt ein pauschal genanntes altes Startdatum in die Irre.",
      "reasonEn": "The amended high-risk commencement dates make the old date materially misleading.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Arts. 17(1), 113(c)",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d73-c02",
      "title": "Verhältnismäßigkeit und Integration",
      "titleEn": "Proportionality and Integration",
      "description": "Vorhandene Managementsysteme können integriert genutzt werden, wenn alle erforderlichen Aspekte tatsächlich abgedeckt sind. Verhältnismäßigkeit verringert nicht das erforderliche Schutzniveau. Die Sonderregel für bestimmte Finanzinstitute nimmt Artikel 17 Absatz 1 Buchstaben g, h und i ausdrücklich aus der Erfüllungsfiktion aus.",
      "descriptionEn": "Reuse existing management systems where all required aspects are actually covered. Proportionality does not reduce the required protection level. The special rule for certain financial institutions expressly excludes Article 17(1)(g), (h) and (i) from deemed fulfilment.",
      "reason": "Weder ein ISO-Zertifikat noch die aufsichtsrechtliche Steuerung im Finanzsektor deckt das Qualitätsmanagementsystem nach Artikel 17 vollständig ab.",
      "reasonEn": "An ISO certificate or financial-sector governance is not a blanket substitute for the AI QMS.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Art. 17(2)–(4)",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    },
    {
      "id": "d73-c03",
      "title": "Dokumentation und Aufbewahrung",
      "titleEn": "Documentation and Retention",
      "description": "Geordnete schriftliche Grundsätze, Verfahren, Anweisungen und Umsetzungsnachweise werden kontrolliert geführt. Die in Artikel 18 genannten Unterlagen einschließlich QMS- und technischer Dokumentation werden für den dortigen Zehnjahreszeitraum verfügbar gehalten; automatisch erzeugte Logs folgen ihrer gesonderten Regelung.",
      "descriptionEn": "Maintain controlled written policies, procedures, instructions and implementation records. Keep Article 18 documents, including QMS and technical documentation, available for its ten-year period; automatically generated logs follow their separate rule.",
      "reason": "Die zehnjährige Aufbewahrung gilt den Unterlagen nach Artikel 18 und lässt sich nicht unbesehen auf jedes Betriebsprotokoll übertragen.",
      "reasonEn": "The ten-year document duty should not be copied indiscriminately to every runtime log.",
      "whenRequired": "Für die genannte Rolle und Systemart, sobald die konkrete Vorschrift nach Artikeln 111 und 113 anwendbar ist.",
      "whenRequiredEn": "For the specified role and system type when the particular provision applies under Articles 111 and 113.",
      "sources": [
        "AI Act Arts. 17(1), 18, 19",
        "AI Act Arts. 111, 113 (consolidated 27 July 2026)"
      ]
    }
  ],
  "D74": [
    {
      "id": "d74-c01",
      "title": "Registerpflicht für alle Verletzungen",
      "titleEn": "Obligation to Record All Breaches",
      "description": "Der Verantwortliche dokumentiert jede festgestellte Datenschutzverletzung mit Tatsachen, Auswirkungen und ergriffener Abhilfe, unabhängig von Behörden- oder Betroffenenbenachrichtigung. Das Register kann eine gefilterte Ansicht des gemeinsamen Vorfallbestands D83 sein, sofern die erforderlichen Inhalte vollständig und zugänglich bleiben. Eine zweite manuell gepflegte Kopie ist nicht vorgeschrieben.",
      "descriptionEn": "The controller documents every established personal data breach with facts, effects and remediation, irrespective of authority or individual notification. The register may be a filtered view of the shared D83 incident record if required content remains complete and accessible. A second manually maintained copy is not prescribed.",
      "reason": "Dokumentationspflicht und Meldepflicht sind verschiedene Anforderungen.",
      "reasonEn": "Documentation and notification are different requirements.",
      "whenRequired": "Bei jeder Datenschutzverletzung.",
      "whenRequiredEn": "For each personal data breach.",
      "sources": [
        "Regulation (EU) 2016/679 33(5)"
      ]
    },
    {
      "id": "d74-c02",
      "title": "Inhalt und Nachweisfunktion",
      "titleEn": "Content and Evidence Function",
      "description": "Der Eintrag enthält Kennung, Zeitverlauf, Kenntnis, betroffene Daten und Personen soweit bekannt, Auswirkungen, Maßnahmen und begründete Meldeentscheidungen. Unbekannte Mengen werden als Schätzung oder offen markiert und nachgeführt. Meldungen nach D24, Belege und Verbesserungen sind verknüpft. Zugriff und Aufbewahrung werden festgelegt; die Aufsicht muss die Einhaltung anhand des Nachweises prüfen können.",
      "descriptionEn": "The entry includes identifier, timeline, awareness, affected data and people as known, effects, actions and reasoned notification decisions. Mark unknown quantities as estimates or unresolved and update them. Link D24 submissions, evidence and improvements. Define access and retention; the record must allow the authority to assess compliance.",
      "reason": "Eine unbegründete Nichtmeldung lässt die Schwellenentscheidung nicht überprüfen.",
      "reasonEn": "An unexplained decision not to notify prevents review of the threshold assessment.",
      "whenRequired": "Bei Erfassung und Fortschreibung.",
      "whenRequiredEn": "When recording and updating entries.",
      "sources": [
        "Regulation (EU) 2016/679 33(5)"
      ]
    }
  ],
  "D75": [
    {
      "id": "d75-c01",
      "title": "Zweck und Inhalt der Assertion",
      "titleEn": "Purpose and Content of the Assertion",
      "description": "Die Geschäftsleitung bereitet eine schriftliche Assertion für das in D37 beschriebene System und den vereinbarten Stichtag oder Zeitraum vor. Sie beurteilt die Darstellung anhand der Description Criteria sowie die Eignung des Kontrolldesigns; bei Type 2 umfasst die Beurteilung auch die Wirksamkeit des Betriebs im Prüfungszeitraum. Bekannte Abweichungen dürfen nicht durch eine vorformulierte positive Erklärung verdeckt werden.",
      "descriptionEn": "Management prepares a written assertion for the system described in D37 and the agreed date or period. It evaluates presentation against the Description Criteria and suitability of control design; for Type 2 it also evaluates operating effectiveness throughout the examination period. Known exceptions must not be concealed by a prewritten positive assertion.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "AICPA AT-C 205; SOC 2 guidance; DC Section 200"
      ]
    },
    {
      "id": "d75-c02",
      "title": "Verantwortung und Grundlagen",
      "titleEn": "Responsibility and Basis",
      "description": "Vor Unterzeichnung prüft die Geschäftsleitung, ob Kontrollinventar, Risikobeurteilung, Betriebsnachweise und bekannte Ausnahmen ihre Erklärung tragen. Systemgrenze, Subservice-Methode und komplementäre Kontrollen müssen mit D37 übereinstimmen. Die verantwortlichen Unterzeichner dokumentieren Datum, geprüfte Fassung und Entscheidungsgrundlage; die unabhängige Prüfungsmeinung bleibt Sache des Service Auditors.",
      "descriptionEn": "Before signing, management checks whether the control inventory, risk assessment, operating evidence and known exceptions support its assertion. System boundary, subservice method and complementary controls must match D37. Responsible signatories record date, reviewed version and decision basis; the independent examination opinion remains the service auditor’s responsibility.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "AICPA AT-C 205; DC Section 200"
      ]
    }
  ],
  "D76": [
    {
      "id": "d76-c01",
      "title": "Pflichtangaben an Nutzer",
      "titleEn": "Mandatory User Information",
      "description": "Die Information benennt Hersteller, Produktkennung, direkte Schwachstellenkontaktstelle und CVD-Regelung, Zweck, Sicherheitsumgebung und -eigenschaften, bekannte oder vorhersehbare erhebliche Risiken, gegebenenfalls den Link zur Konformitätserklärung sowie Art und Ende des Supports. Anleitungen erklären sichere Inbetriebnahme, Nutzung, relevante Konfigurationsänderungen, Updates einschließlich automatischer Updates, sichere Außerbetriebnahme und Datenlöschung. Bei bereitgestellter SBOM wird deren Zugang beschrieben.",
      "descriptionEn": "Identify manufacturer, product, direct vulnerability contact and CVD policy, purpose, security environment and properties, known or foreseeable significant risks, any declaration link, and support type and end date. Explain secure commissioning, use, relevant configuration changes, updates including automatic updates, secure retirement and data deletion. Explain access to an SBOM where supplied.",
      "reason": "Fehlen der Zugang zur Konformitätserklärung und die Angaben zum sicheren Betrieb, kann der Nutzer das Produkt nicht bestimmungsgemäß absichern.",
      "reasonEn": "The source omitted explicit declaration access and details of secure operation.",
      "whenRequired": "Für erfasste Produkte und Rollen ab dem jeweiligen gesetzlichen Anwendungsdatum.",
      "whenRequiredEn": "For covered products and roles from the applicable statutory commencement date.",
      "sources": [
        "CRA Art. 13(16)–(20); Annex II",
        "CRA Arts. 69, 71"
      ]
    },
    {
      "id": "d76-c02",
      "title": "Form und Verfügbarkeit",
      "titleEn": "Form and Availability",
      "description": "Die Angaben sind klar, lesbar und für Nutzer und Marktüberwachung sprachlich verständlich, in Papier- oder elektronischer Form bereitzustellen. Sie bleiben mindestens zehn Jahre nach Inverkehrbringen oder für die längere Supportdauer verfügbar; online bereitgestellte Anleitungen bleiben ebenso lange zugänglich und nutzerfreundlich. Versionen und ausgelieferte Produktstände werden zugeordnet.",
      "descriptionEn": "Provide clear, legible information understandable to users and market surveillance in paper or electronic form. Keep it available for at least ten years after placing on the market or the longer support period; online instructions remain accessible and user-friendly for the same period. Associate versions with supplied products.",
      "reason": "Die Pflicht zur Bereithaltung der Informationen kann über die zugesagte Supportdauer hinausreichen.",
      "reasonEn": "The availability obligation can extend beyond the support period.",
      "whenRequired": "Für erfasste Produkte und Rollen ab dem jeweiligen gesetzlichen Anwendungsdatum.",
      "whenRequiredEn": "For covered products and roles from the applicable statutory commencement date.",
      "sources": [
        "CRA Art. 13(18)–(19)",
        "CRA Arts. 69, 71"
      ]
    }
  ],
  "D77": [
    {
      "id": "d77-c01",
      "title": "Ableitung aus der Geschäftsstrategie",
      "titleEn": "Derivation from the Business Strategy",
      "description": "Die Geschäftsleitung legt eine mit der Geschäftsstrategie konsistente Risikostrategie für alle wesentlichen Risiken fest. Risikoappetit, Konzentrationen und verfügbare Risikodeckung werden nachvollziehbar berücksichtigt; erforderliche Teilstrategien konkretisieren die Vorgaben. Eine IT-Risikostrategie allein deckt nicht das gesamte Institut ab.",
      "descriptionEn": "Management establishes a risk strategy consistent with business strategy and covering all material risks. Risk appetite, concentrations and available risk-bearing capacity are addressed explicitly; sub-strategies translate the requirements where needed. An IT risk strategy alone does not cover the whole institution.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "MaRisk AT 4.1; AT 4.2(2), (4)"
      ]
    },
    {
      "id": "d77-c02",
      "title": "Überprüfung, Kommunikation und Erörterung",
      "titleEn": "Review, Communication and Discussion",
      "description": "Der Strategieprozess umfasst Planung, Umsetzung, Beurteilung der Zielerreichung und Anpassung. Abweichungen werden analysiert und notwendige Änderungen von der Geschäftsleitung beschlossen; Strategien und Änderungen werden dem Aufsichtsorgan zur Kenntnis gegeben, erörtert und im Institut geeignet kommuniziert. Interne Überprüfungstermine werden dokumentiert, ohne sie als pauschale gesetzliche Jahresfrist auszugeben.",
      "descriptionEn": "The strategy process covers planning, implementation, evaluation of objectives and adjustment. Analyse deviations and obtain management decisions on necessary changes; provide and discuss strategies and changes with the supervisory body and communicate them appropriately within the institution. Document internal review dates without presenting them as a universal statutory annual deadline.",
      "reason": "Die fachliche Entscheidung muss anhand des tatsächlichen Betriebs nachvollziehbar sein.",
      "reasonEn": "The decision must be traceable to actual operations.",
      "whenRequired": "Nur im festgestellten aufsichtsrechtlichen Anwendungsbereich; außerhalb davon als freiwillige Arbeitshilfe.",
      "whenRequiredEn": "Only within the established supervisory scope; otherwise an optional working aid.",
      "sources": [
        "MaRisk AT 4.2(4)-(7)"
      ]
    }
  ],
  "D78": [
    {
      "id": "d78-c01",
      "title": "Pflicht und Inhalt der Vereinbarung",
      "titleEn": "Obligation and Content of the Arrangement",
      "description": "Die im Arbeitsanhang benannten gemeinsam Verantwortlichen regeln ihre jeweiligen Aufgaben transparent, soweit Unions- oder Mitgliedstaatenrecht diese nicht bereits festlegt. Der Anhang ordnet insbesondere Informationen nach Artikeln 13/14, Betroffenenrechte, Sicherheitsmaßnahmen, Vorfallkoordination und Kontakte zu und wird verbindlich vereinbart. Das Wesentliche der Vereinbarung wird Betroffenen bereitgestellt. Unabhängig von interner Zuständigkeit können Personen ihre Rechte gegenüber jedem Verantwortlichen ausüben. Haftung folgt Artikel 82 und den tatsächlichen Voraussetzungen; die Vereinbarung beseitigt sie nicht pauschal.",
      "descriptionEn": "The joint controllers identified in the working schedule transparently allocate their tasks insofar as Union or Member State law has not already done so. The binding schedule assigns, in particular, Articles 13/14 information, individual rights, safeguards, incident coordination and contacts. Make the essence available to people. Regardless of internal allocation, individuals may exercise rights against each controller. Liability follows Article 82 and its actual conditions; the arrangement does not categorically remove it.",
      "reason": "Interne Aufteilung darf die Rechte der Betroffenen nicht beschränken.",
      "reasonEn": "Internal allocation must not restrict individual rights.",
      "whenRequired": "Bei festgestellter gemeinsamer Verantwortlichkeit.",
      "whenRequiredEn": "Where joint controllership is established.",
      "sources": [
        "Regulation (EU) 2016/679 26,82"
      ]
    },
    {
      "id": "d78-c02",
      "title": "Abgrenzungsprüfung",
      "titleEn": "Assessment of Controllership Roles",
      "description": "Vor Unterzeichnung werden gemeinsame und getrennte Verarbeitungsphasen, Zweck- und Mittelentscheidungen sowie tatsächliche Einflussmöglichkeiten beschrieben. Getrennte Verantwortlichkeit und Auftragsverarbeitung werden nicht allein aus Vertragsüberschriften abgeleitet. Für echte Auftragsverarbeitung gilt D22; eine Kooperation kann je Verarbeitung unterschiedliche Rollen enthalten. Änderungen lösen eine neue Bewertung und gegebenenfalls Vertragsanpassung aus.",
      "descriptionEn": "Before signature, describe joint and separate processing phases, purpose and means decisions and actual influence. Do not infer separate controllership or processing on behalf merely from contract headings. D22 applies to genuine processor activity; a cooperation may involve different roles for different processing. Changes trigger reassessment and appropriate amendment.",
      "reason": "Ein gemeinsames Projekt bedeutet nicht automatisch gemeinsame Verantwortung für jede Tätigkeit.",
      "reasonEn": "A joint project does not automatically mean joint responsibility for every activity.",
      "whenRequired": "Bei Kooperation und relevanten Änderungen.",
      "whenRequiredEn": "When cooperating and on relevant changes.",
      "sources": [
        "Regulation (EU) 2016/679 4(7)–(8),26,28"
      ]
    }
  ],
  "D79": [
    {
      "id": "d79-c01",
      "title": "Current- und Target-Profil",
      "titleEn": "Current and Target Profile",
      "description": "Der Profilverantwortliche definiert den betrachteten Organisationsbereich und beschreibt aktuelle und angestrebte Ergebnisse anhand der sechs Funktionen Govern, Identify, Protect, Detect, Respond und Recover. Zielergebnisse berücksichtigen Auftrag, Risiken und externe Anforderungen. Verwendete Tiers charakterisieren die Ausprägung von Risiko-Governance und Risikomanagement; sie sind kein automatischer Mittelwert einzelner Kontrollen und keine Zertifizierungsstufen.",
      "descriptionEn": "The profile owner defines the organisational scope and describes current and target outcomes using the six functions Govern, Identify, Protect, Detect, Respond and Recover. Target outcomes reflect mission, risk and external requirements. Tiers, where used, characterise the rigour of risk governance and management; they are not an automatic average of individual controls or certification levels.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "NIST CSF 2.0 sections 3-4; NIST SP 1301; NIST SP 1302"
      ]
    },
    {
      "id": "d79-c02",
      "title": "Gap-Analyse und priorisierter Aktionsplan",
      "titleEn": "Gap Analysis and Prioritised Action Plan",
      "description": "Abweichungen zwischen aktuellem und angestrebtem Profil werden nach Risiko und Geschäftsauswirkung priorisiert. Der Aktionsplan benennt Maßnahmen, Verantwortliche, Mittel, Termine und Nachweise für das angestrebte Ergebnis. Aktualisierungen erfolgen bei wesentlichen Änderungen und zu intern festgelegten Terminen; Fortschritt wird an Ergebnissen statt allein an erledigten Aufgaben beurteilt.",
      "descriptionEn": "Prioritise differences between current and target profiles by risk and business impact. The action plan identifies actions, owners, resources, dates and evidence for the target outcome. Update for material changes and at internally chosen intervals; assess progress by outcomes rather than completed tasks alone.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "NIST CSF 2.0 section 3; NIST SP 1301"
      ]
    }
  ],
  "D80": [
    {
      "id": "d80-c01",
      "title": "Registrierungspflicht und Kontaktstelle",
      "titleEn": "Registration Obligation and Contact Point",
      "description": "Die Einstufung nach aktuellem KRITISDachG, Verordnung oder Bescheid wird belegt. Spätestens drei Monate nach Geltung als kritische Anlage werden die nach § 8 Absatz 1 erforderlichen Betreiber-, Standort-, Dienstleistungs-, Versorgungsgrad-, Kontakt- und Komponentenangaben über das gemeinsame Verfahren an das BBK übermittelt. Die aktuelle Verfahrensbekanntmachung wird geprüft; die alte pauschale Startangabe 17. Juli 2026 wird nicht fortgeschrieben. Registrierung, Behördenmitteilung, neunmonatige Risikoanalysefrist und zehnmonatige Fristen nach § 8 Absatz 7 werden verknüpft.",
      "descriptionEn": "Evidence classification under current KRITISDachG, regulation or determination. Within three months after becoming a critical facility, submit the section 8(1) entity, location, service, coverage, contact and component information to BBK through the joint procedure. Check the current procedural notice rather than carrying forward the old blanket 17 July 2026 start. Link registration, authority confirmation, the nine-month risk-assessment deadline and the ten-month duties under section 8(7).",
      "reason": "Die konsolidierte Fassung der Registrierungsvorschrift weicht vom Ursprungstext und von älteren abgerufenen Fassungen ab.",
      "reasonEn": "The current consolidated registration text differs from the original and older downloadable versions.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "KRITISDachG §§ 4–5, 8"
      ]
    }
  ],
  "D81": [
    {
      "id": "d81-c01",
      "title": "All-Gefahren-Ansatz",
      "titleEn": "All-Hazards Approach",
      "description": "Die Analyse umfasst relevante natürliche, technische und menschlich verursachte Risiken einschließlich Extremwetter, Unfällen, gesundheitlicher Notlagen, Sabotage und hybriden Bedrohungen. Abhängigkeiten von anderen Sektoren, Nachbarstaaten und Drittstaaten sowie Auswirkungen auf abhängige Dienste werden bewertet; maritime Besonderheiten werden berücksichtigt. Erstprüfung erfolgt nach § 8 Absatz 7 neun Monate nach Registrierung, danach bei Bedarf und mindestens alle vier Jahre.",
      "descriptionEn": "Assess relevant natural, technical and human-caused risks, including extreme weather, accidents, health emergencies, sabotage and hybrid threats. Address dependencies across sectors, neighbouring states and third countries and effects on dependent services, including maritime specifics. First assessment is due nine months after registration under section 8(7), then when needed and at least every four years.",
      "reason": "Ein rein IT-bezogener Gefährdungskatalog deckt physische Gefahren wie Extremwetter, Unfälle oder Sabotage nicht ab.",
      "reasonEn": "An IT-only threat catalogue cannot establish physical all-hazards coverage.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "KRITISDachG §§ 8(7), 11(2), 12"
      ]
    },
    {
      "id": "d81-c02",
      "title": "Berücksichtigung staatlicher Risikobewertungen",
      "titleEn": "Consideration of State Risk Assessments",
      "description": "Nationale Risikobewertungen und andere vertrauenswürdige Quellen werden mit Datum und Bezug zur Anlage ausgewertet. Methodik, Annahmen, Unsicherheiten, Prioritäten und Maßnahmenentscheidungen werden dokumentiert. Fehlende staatliche Detailinformationen rechtfertigen nicht das Erfinden von Gefahrenwerten; offene Punkte werden kenntlich gemacht.",
      "descriptionEn": "Assess national risk assessments and other trustworthy sources with dates and facility relevance. Record method, assumptions, uncertainty, priorities and treatment decisions. Missing official detail does not justify invented threat values; mark unresolved points.",
      "reason": "Staatliche Risikobewertungen entfalten erst Nutzen, wenn der Betreiber sie auf die eigene Anlage überträgt.",
      "reasonEn": "The operator must translate source information into a facility-specific assessment.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "KRITISDachG § 12(1)–(3)"
      ]
    }
  ],
  "D82": [
    {
      "id": "d82-c01",
      "title": "Inhalt des Resilienzplans",
      "titleEn": "Content of the Resilience Plan",
      "description": "Der Plan begründet aus D81 verhältnismäßige Maßnahmen für Prävention, physischen Schutz, Reaktion, Schadensbegrenzung und zügige Wiederherstellung. Passende Vorkehrungen können Objektschutz, Zugang, Detektion, Notstrom, alternative Lieferketten, Personalsicherheit und Einweisung umfassen. Die Beispiele sind keine pauschale Pflicht zu jeder genannten Technik oder jeder Zuverlässigkeitsprüfung. Plan und Umsetzung folgen der Zehnmonatsfrist nach § 8 Absatz 7.",
      "descriptionEn": "Use D81 to justify proportionate prevention, physical protection, response, impact limitation and rapid restoration measures. Suitable arrangements may include site protection, access, detection, emergency power, alternative supply chains, personnel security and instruction. Examples do not mandate every technology or background check. Apply the ten-month deadline in section 8(7) to plan and implementation.",
      "reason": "Die nationale Regelung verlangt verhältnismäßige Maßnahmen und nennt Beispiele, keine unbedingt abzuarbeitende Ausstattungsliste.",
      "reasonEn": "The national provision uses proportionate measures and examples, not an unconditional equipment checklist.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "KRITISDachG §§ 8(7), 13(1)–(4)"
      ]
    },
    {
      "id": "d82-c02",
      "title": "Nachweis, Übung und Fortschreibung",
      "titleEn": "Evidence, Exercises and Updates",
      "description": "Verantwortliche, Ressourcen und Umsetzungsnachweise werden geführt. Personal wird mit den vorgesehenen Maßnahmen durch geeignete Information, Schulung und Übungen vertraut gemacht. Der Plan wird bei Bedarf und nach jeder Risikoanalyse aktualisiert; behördliche Nachweisanforderungen und anwendbare Vorfallmeldungen werden mit Fristen und Empfangsbelegen dokumentiert.",
      "descriptionEn": "Maintain owners, resources and implementation evidence. Familiarise personnel with planned measures through appropriate information, training and exercises. Update the plan when needed and after each risk assessment, and document authority evidence requests and applicable incident notifications with deadlines and receipts.",
      "reason": "Ein internes Übungsprotokoll ersetzt für sich genommen weder einen behördlich geforderten Nachweis noch eine Vorfallmeldung.",
      "reasonEn": "An internal exercise record does not itself replace an authority-required proof or incident report.",
      "whenRequired": "Bei Anwendbarkeit der genannten nationalen Vorschrift; konkrete Frist und behördliche Vorgaben dokumentieren.",
      "whenRequiredEn": "Where the cited national provision applies; document the actual deadline and authority instructions.",
      "sources": [
        "KRITISDachG §§ 13(3)–(4), 16, 18"
      ]
    }
  ],
  "D83": [
    {
      "id": "d83-c01",
      "title": "Registerpflicht und Inhalt",
      "titleEn": "Register Obligation and Content",
      "description": "Je erfasstem Vorfall werden eine eindeutige ID, betroffene Dienste und Informationen, Eintritt soweit bekannt, Erkennung, Kenntniserlangung, Klassifizierung, Zuständigkeit, Maßnahmen und Status geführt. Unbekannte Ursachen werden als offen gekennzeichnet und nicht erfunden. DORA-Einrichtungen erfassen alle IKT-bezogenen Vorfälle und erheblichen Cyberbedrohungen gemäß Artikel 17 Absatz 2. Datenschutzinformationen werden nur berechtigten Personen zugänglich gemacht.",
      "descriptionEn": "For each recorded incident, maintain a unique ID, affected services and information, occurrence where known, detection, awareness, classification, ownership, actions and status. Mark unknown causes as unresolved rather than inventing them. DORA entities record all ICT-related incidents and significant cyber threats under Article 17(2). Restrict privacy-related details to authorised persons.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "DORA Article 17(2)",
        "NIS2 Article 21(2)(b)",
        "ISO 27001:2022 Annex A.5.24-A.5.28",
        "GDPR Article 33(5)"
      ]
    },
    {
      "id": "d83-c02",
      "title": "Melde-Tracking und Fristennachweis",
      "titleEn": "Notification Tracking and Deadline Evidence",
      "description": "Jede Meldeentscheidung hält Rechtsgrundlage, Rolle, Schwelle, Empfänger und Begründung fest. Je Meldestufe werden auslösendes Ereignis, dessen Zeitpunkt, berechnete Frist, Versand und Empfangsbeleg getrennt erfasst. Für NIS2 laufen Frühwarnung und Vorfallsmeldung grundsätzlich ab Kenntnis, der Abschlussbericht ab der Vorfallsmeldung; Sonderfälle und laufende Vorfälle folgen D14. DORA-, Datenschutz- und Produktmeldungen werden nach D48, D24 bzw. D31 getrennt berechnet. Nichtmeldeentscheidungen werden bei neuen Tatsachen erneut geprüft.",
      "descriptionEn": "Each notification decision records the legal basis, role, threshold, recipient and reasoning. For every reporting stage, separately record the trigger event and its timestamp, calculated deadline, submission and acknowledgement. Under NIS2, early warning and incident notification generally run from awareness, while the final report runs from the incident notification; special cases and ongoing incidents follow D14. Calculate DORA, privacy and product reports separately under D48, D24 and D31. Reassess non-notification decisions when new facts emerge.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "NIS2 Article 23(4)",
        "DORA Article 19; Delegated Regulation (EU) 2025/301 Article 5",
        "GDPR Article 33",
        "CRA Article 14"
      ]
    },
    {
      "id": "d83-c03",
      "title": "Auswertung und Lessons Learned",
      "titleEn": "Analysis and Lessons Learned",
      "description": "Die Auswertung betrachtet wiederkehrende Ursachen, Häufungen, Auswirkungen und Wirksamkeit der Reaktion. Kennzahlen definieren ihre Start- und Endereignisse; mittlere Wiederherstellungszeiten ersetzen keine Einzelfristen. Feststellungen führen zu verantworteten Maßnahmen und Nachprüfung. Für CIR-Einrichtungen werden Wiederholungsprüfungen nach Anhang 3.4.2(b) mindestens vierteljährlich durchgeführt; weitere Melde-Aggregationen und DORA-Prüfungen behalten ihre eigenen Regeln.",
      "descriptionEn": "Analysis considers recurring causes, clusters, impacts and response effectiveness. Metrics define their start and end events; mean recovery times do not replace individual deadlines. Findings lead to owned actions and follow-up. CIR entities review recurrence at least quarterly under Annex 3.4.2(b); other notification aggregation and DORA review requirements retain their own rules.",
      "reason": "Ein ausgefüllter, geprüfter Nachweis muss die beschriebene Entscheidung oder Tätigkeit belegen.",
      "reasonEn": "A completed and checked record must substantiate the decision or activity described.",
      "whenRequired": "Bei Nutzung dieses Dokuments im festgelegten Geltungsbereich.",
      "whenRequiredEn": "When using this document within the established scope.",
      "sources": [
        "ISO 27001:2022 Annex A.5.27",
        "Implementing Regulation (EU) 2024/2690 Article 4; Annex 3.4.2(b), where applicable",
        "DORA Article 13; Delegated Regulation (EU) 2024/1772 Article 8(2)"
      ]
    }
  ],
  "D84": [
    {
      "id": "d84-c01",
      "title": "Dokumentenbestand und Zuständigkeit",
      "titleEn": "Document Inventory and Ownership",
      "description": "Der Dokumentenverantwortliche führt ein Verzeichnis der erforderlichen Richtlinien, Verfahren und Nachweisarten. Jeder Eintrag enthält ID, Zweck, Eigentümer, Ablage, Schutzbedarf und Freigabestatus. Externe Normen, Gesetze, Herstelleranweisungen und Vertragsvorgaben werden aufgenommen, soweit sie für Planung und Betrieb des ISMS benötigt werden.",
      "descriptionEn": "The document controller maintains an inventory of required policies, procedures and record types. Each entry has an ID, purpose, owner, location, protection needs and approval status. Include external standards, laws, supplier instructions and contractual requirements needed for ISMS planning and operation.",
      "reason": "Gültige Richtlinien und belastbare Aufzeichnungen auffindbar, geschützt und nachvollziehbar halten.",
      "reasonEn": "Keep valid policies and reliable records findable, protected and traceable.",
      "whenRequired": "ISO-Dokumentenlenkung für das ISMS; für NIS2 als unterstützende Nachweisorganisation. Kein gesondertes Dateiformat vorgeschrieben.",
      "whenRequiredEn": "ISMS documented-information control for ISO; supporting evidence organisation for NIS2. No separate file format is prescribed.",
      "sources": [
        "ISO 27001:2022 7.5.1, 7.5.3"
      ]
    },
    {
      "id": "d84-c02",
      "title": "Erstellen und Freigeben",
      "titleEn": "Creation and Approval",
      "description": "Neue oder geänderte Dokumente tragen Titel, Version, Datum und verantwortliche Person sowie ein geeignetes Format. Fachlich befugte Personen prüfen Eignung und Angemessenheit vor der Freigabe. Entwürfe sind als solche erkennbar und dürfen nicht unbemerkt eine geltende Arbeitsanweisung ersetzen.",
      "descriptionEn": "New or changed documents have a title, version, date, responsible person and suitable format. Competent authorised persons review suitability and adequacy before approval. Drafts are visibly identified and must not silently replace a current working instruction.",
      "reason": "Gültige Richtlinien und belastbare Aufzeichnungen auffindbar, geschützt und nachvollziehbar halten.",
      "reasonEn": "Keep valid policies and reliable records findable, protected and traceable.",
      "whenRequired": "ISO-Dokumentenlenkung für das ISMS; für NIS2 als unterstützende Nachweisorganisation. Kein gesondertes Dateiformat vorgeschrieben.",
      "whenRequiredEn": "ISMS documented-information control for ISO; supporting evidence organisation for NIS2. No separate file format is prescribed.",
      "sources": [
        "ISO 27001:2022 7.5.2"
      ]
    },
    {
      "id": "d84-c03",
      "title": "Verteilen und Zugreifen",
      "titleEn": "Distribution and Access",
      "description": "Gültige Unterlagen sind am Ort ihrer Verwendung auffindbar und lesbar. Leserechte, Änderungsrechte und Weitergabe werden nach Aufgabe und Schutzbedarf vergeben. Änderungen werden betroffenen Anwendern vermittelt; erforderliche Kenntnisnahmen werden belegt. Ausdrucke und Offline-Kopien erhalten einen kontrollierten Aktualisierungsweg.",
      "descriptionEn": "Current documents are findable and readable where used. Reading, modification and sharing rights reflect tasks and protection needs. Communicate changes to affected users and evidence acknowledgements where required. Printed and offline copies have a controlled update route.",
      "reason": "Gültige Richtlinien und belastbare Aufzeichnungen auffindbar, geschützt und nachvollziehbar halten.",
      "reasonEn": "Keep valid policies and reliable records findable, protected and traceable.",
      "whenRequired": "ISO-Dokumentenlenkung für das ISMS; für NIS2 als unterstützende Nachweisorganisation. Kein gesondertes Dateiformat vorgeschrieben.",
      "whenRequiredEn": "ISMS documented-information control for ISO; supporting evidence organisation for NIS2. No separate file format is prescribed.",
      "sources": [
        "ISO 27001:2022 7.5.3; CIR Annex 1.1.1(h), within scope"
      ]
    },
    {
      "id": "d84-c04",
      "title": "Änderungen und veraltete Fassungen",
      "titleEn": "Changes and Obsolete Versions",
      "description": "Das Verzeichnis zeigt die freigegebene Fassung und den Änderungsverlauf. Ersetzte Fassungen werden aus aktiven Arbeitsablagen entfernt oder eindeutig gesperrt, ohne erforderliche historische Nachweise zu vernichten. Für externe Dokumente wird eine verantwortliche Stelle benannt, die neue Fassungen und ihre Auswirkungen bewertet.",
      "descriptionEn": "The inventory identifies the approved version and change history. Remove superseded versions from active working locations or clearly block their use without destroying necessary historical evidence. Assign an owner to assess new versions of external documents and their effects.",
      "reason": "Gültige Richtlinien und belastbare Aufzeichnungen auffindbar, geschützt und nachvollziehbar halten.",
      "reasonEn": "Keep valid policies and reliable records findable, protected and traceable.",
      "whenRequired": "ISO-Dokumentenlenkung für das ISMS; für NIS2 als unterstützende Nachweisorganisation. Kein gesondertes Dateiformat vorgeschrieben.",
      "whenRequiredEn": "ISMS documented-information control for ISO; supporting evidence organisation for NIS2. No separate file format is prescribed.",
      "sources": [
        "ISO 27001:2022 7.5.3"
      ]
    },
    {
      "id": "d84-c05",
      "title": "Aufbewahrung und Aussonderung",
      "titleEn": "Retention and Disposition",
      "description": "Aufzeichnungen werden gegen unbefugte Änderung, Verlust und Offenlegung geschützt. Aufbewahrungszweck, Frist oder Löschkriterium und zulässige Sperren folgen p39/p40; sichere Aussonderung folgt p54. Elektronische Nachweise bleiben während der benötigten Dauer lesbar und wiederauffindbar. Abgelaufene Fristen werden nicht ohne begründeten Anlass pauschal verlängert.",
      "descriptionEn": "Protect records against unauthorised change, loss and disclosure. Retention purpose, period or deletion criteria and permissible holds follow p39/p40; secure disposition follows p54. Electronic evidence remains readable and retrievable for the required duration. Do not extend expired periods indiscriminately without a justified purpose.",
      "reason": "Gültige Richtlinien und belastbare Aufzeichnungen auffindbar, geschützt und nachvollziehbar halten.",
      "reasonEn": "Keep valid policies and reliable records findable, protected and traceable.",
      "whenRequired": "ISO-Dokumentenlenkung für das ISMS; für NIS2 als unterstützende Nachweisorganisation. Kein gesondertes Dateiformat vorgeschrieben.",
      "whenRequiredEn": "ISMS documented-information control for ISO; supporting evidence organisation for NIS2. No separate file format is prescribed.",
      "sources": [
        "ISO 27001:2022 7.5.3; A.5.33"
      ]
    }
  ],
  "D85": [
    {
      "id": "d85-c01",
      "title": "Interne und externe Themen",
      "titleEn": "Internal and External Issues",
      "description": "Der ISMS-Verantwortliche erfasst relevante geschäftliche, technische, organisatorische, gesellschaftliche und rechtliche Rahmenbedingungen. Für jedes Thema werden seine Bedeutung für die beabsichtigten ISMS-Ergebnisse, Faktenbasis, Unsicherheit und zuständige Person beschrieben; allgemeine Schlagworte ohne Bezug zum Unternehmen genügen nicht.",
      "descriptionEn": "The ISMS owner records relevant business, technical, organisational, social and legal circumstances. For each issue describe its significance for intended ISMS outcomes, supporting facts, uncertainty and owner; generic headings without organisational relevance are insufficient.",
      "reason": "Die Annahmen hinter Geltungsbereich, Anforderungen und Risiken nachvollziehbar festhalten.",
      "reasonEn": "Record the assumptions behind scope, requirements and risks in a traceable form.",
      "whenRequired": "Für die Kontextbestimmung des ISO-ISMS. Dieses Arbeitsblatt ist eine mögliche Dokumentation, keine zusätzlich vorgeschriebene Normdatei.",
      "whenRequiredEn": "For determining the ISO ISMS context. This worksheet is an optional recording method, not an additional prescribed standard document.",
      "sources": [
        "ISO 27001:2022 4.1"
      ]
    },
    {
      "id": "d85-c02",
      "title": "Interessierte Parteien und Anforderungen",
      "titleEn": "Interested Parties and Requirements",
      "description": "Relevante Parteien wie Kunden, Beschäftigte, Behörden, Eigentümer und Dienstleister werden mit ihren einschlägigen Anforderungen erfasst. Die Organisation entscheidet, welche Anforderungen durch das ISMS behandelt werden. Rechtliche und vertragliche Details werden im bestehenden Register p04 verknüpft statt erneut widersprüchlich geführt.",
      "descriptionEn": "Identify relevant parties such as customers, personnel, authorities, owners and providers with their pertinent requirements. Decide which requirements will be addressed through the ISMS. Link legal and contractual details to the existing p04 register rather than maintaining contradictory duplicates.",
      "reason": "Die Annahmen hinter Geltungsbereich, Anforderungen und Risiken nachvollziehbar festhalten.",
      "reasonEn": "Record the assumptions behind scope, requirements and risks in a traceable form.",
      "whenRequired": "Für die Kontextbestimmung des ISO-ISMS. Dieses Arbeitsblatt ist eine mögliche Dokumentation, keine zusätzlich vorgeschriebene Normdatei.",
      "whenRequiredEn": "For determining the ISO ISMS context. This worksheet is an optional recording method, not an additional prescribed standard document.",
      "sources": [
        "ISO 27001:2022 4.2"
      ]
    },
    {
      "id": "d85-c03",
      "title": "Relevanz des Klimawandels",
      "titleEn": "Climate Change Relevance",
      "description": "Die Organisation beurteilt ausdrücklich, ob der Klimawandel für das ISMS relevant ist. Sie betrachtet beispielsweise Standortgefahren, Versorgung und Lieferketten sowie entsprechende Anforderungen interessierter Parteien. Relevanz oder Nichtrelevanz erhält eine nachvollziehbare Begründung; eine allgemeine Pflicht zur Emissionsbilanz wird daraus nicht abgeleitet.",
      "descriptionEn": "Explicitly determine whether climate change is relevant to the ISMS. Consider, for example, site hazards, utilities and supply chains, together with related interested-party requirements. Justify relevance or non-relevance; this does not create a general obligation to prepare an emissions inventory.",
      "reason": "Die Annahmen hinter Geltungsbereich, Anforderungen und Risiken nachvollziehbar festhalten.",
      "reasonEn": "Record the assumptions behind scope, requirements and risks in a traceable form.",
      "whenRequired": "Für die Kontextbestimmung des ISO-ISMS. Dieses Arbeitsblatt ist eine mögliche Dokumentation, keine zusätzlich vorgeschriebene Normdatei.",
      "whenRequiredEn": "For determining the ISO ISMS context. This worksheet is an optional recording method, not an additional prescribed standard document.",
      "sources": [
        "ISO 27001:2022/Amd 1:2024 4.1-4.2"
      ]
    },
    {
      "id": "d85-c04",
      "title": "Folgen und Neubewertung",
      "titleEn": "Consequences and Reassessment",
      "description": "Ergebnisse fließen in D03, D39, D38 und notwendige Maßnahmen ein. Bedeutende Änderungen, neue Anforderungen oder widerlegte Annahmen lösen eine Neubewertung aus. Im Management-Review werden relevante Veränderungen behandelt; die Unterlage zeigt Datum, Entscheidung und betroffene Folgeunterlagen.",
      "descriptionEn": "Feed results into D03, D39, D38 and necessary actions. Significant changes, new requirements or disproved assumptions trigger reassessment. Relevant changes are considered in management review; record date, decision and affected downstream records.",
      "reason": "Die Annahmen hinter Geltungsbereich, Anforderungen und Risiken nachvollziehbar festhalten.",
      "reasonEn": "Record the assumptions behind scope, requirements and risks in a traceable form.",
      "whenRequired": "Für die Kontextbestimmung des ISO-ISMS. Dieses Arbeitsblatt ist eine mögliche Dokumentation, keine zusätzlich vorgeschriebene Normdatei.",
      "whenRequiredEn": "For determining the ISO ISMS context. This worksheet is an optional recording method, not an additional prescribed standard document.",
      "sources": [
        "ISO 27001:2022 4.1-4.3, 9.3.2"
      ]
    }
  ],
  "D86": [
    {
      "id": "d86-c01",
      "title": "Kommunikationsbedarf",
      "titleEn": "Communication Needs",
      "description": "Der Verantwortliche bestimmt erforderliche interne und externe Kommunikation: Richtlinienänderungen, Ziele, Risiken, Aufgaben, Prüfergebnisse und relevante Sicherheitsinformationen. Für jeden Gegenstand werden Zweck und die erwartete Handlung oder Kenntnis des Empfängers benannt.",
      "descriptionEn": "Determine necessary internal and external communication, including policy changes, objectives, risks, responsibilities, review results and relevant security information. For each subject identify the purpose and the action or understanding expected from the recipient.",
      "reason": "Regelmäßige und anlassbezogene Sicherheitskommunikation adressatengerecht organisieren.",
      "reasonEn": "Organise routine and event-driven security communication for its intended recipients.",
      "whenRequired": "Unterstützt die ISMS-Kommunikation; gesetzliche Ereignismeldungen verbleiben in D14/D24/D48. Ein gemeinsamer Kommunikationsplan ist zulässig.",
      "whenRequiredEn": "Supports ISMS communication; statutory incident notifications remain in D14/D24/D48. A shared communication plan is permitted.",
      "sources": [
        "ISO 27001:2022 7.4"
      ]
    },
    {
      "id": "d86-c02",
      "title": "Empfänger, Zeitpunkt und Methode",
      "titleEn": "Recipients, Timing and Method",
      "description": "Der Plan benennt Zielgruppe, Termin oder Auslöser, verantwortlichen Absender und geeignete Methode. Sprache und Detailgrad passen zur Aufgabe; vertrauliche Inhalte werden nur berechtigten Empfängern mitgeteilt. Dringliche Informationen warten nicht auf einen routinemäßigen Newsletter.",
      "descriptionEn": "The plan identifies audience, date or trigger, responsible sender and suitable method. Language and detail fit the task; sensitive content goes only to authorised recipients. Urgent information does not wait for a routine newsletter.",
      "reason": "Regelmäßige und anlassbezogene Sicherheitskommunikation adressatengerecht organisieren.",
      "reasonEn": "Organise routine and event-driven security communication for its intended recipients.",
      "whenRequired": "Unterstützt die ISMS-Kommunikation; gesetzliche Ereignismeldungen verbleiben in D14/D24/D48. Ein gemeinsamer Kommunikationsplan ist zulässig.",
      "whenRequiredEn": "Supports ISMS communication; statutory incident notifications remain in D14/D24/D48. A shared communication plan is permitted.",
      "sources": [
        "ISO 27001:2022 7.4; NIS2 Articles 20(1), 21(2)(g)"
      ]
    },
    {
      "id": "d86-c03",
      "title": "Freigabe und Rückfragen",
      "titleEn": "Approval and Feedback",
      "description": "Für externe oder besonders sensible Aussagen wird die erforderliche Freigabe festgelegt. Empfänger erhalten einen Rückfrageweg. Wo Verständnis oder Kenntnisnahme für die Tätigkeit erforderlich ist, wird dies geeignet überprüft; bloße Versandbestätigung ersetzt keine Kompetenzbewertung.",
      "descriptionEn": "Define required approval for external or particularly sensitive statements. Provide a route for questions. Where understanding or acknowledgement is needed for the task, check it appropriately; delivery confirmation does not replace competence assessment.",
      "reason": "Regelmäßige und anlassbezogene Sicherheitskommunikation adressatengerecht organisieren.",
      "reasonEn": "Organise routine and event-driven security communication for its intended recipients.",
      "whenRequired": "Unterstützt die ISMS-Kommunikation; gesetzliche Ereignismeldungen verbleiben in D14/D24/D48. Ein gemeinsamer Kommunikationsplan ist zulässig.",
      "whenRequiredEn": "Supports ISMS communication; statutory incident notifications remain in D14/D24/D48. A shared communication plan is permitted.",
      "sources": [
        "ISO 27001:2022 7.2-7.4"
      ]
    },
    {
      "id": "d86-c04",
      "title": "Durchführung und Pflege",
      "titleEn": "Delivery and Maintenance",
      "description": "Durchführung, Abweichungen und erforderliche Nachverfolgung werden dokumentiert. Änderungen von Aufgaben, Parteien und Kommunikationswegen aktualisieren den Plan. Krisenkommunikation und gesetzliche Meldungen werden verknüpft, aber ihre abweichenden Empfänger und Fristen nicht überschrieben.",
      "descriptionEn": "Record delivery, deviations and necessary follow-up. Update the plan when roles, parties or communication routes change. Link crisis communication and statutory notifications without overriding their different recipients or deadlines.",
      "reason": "Regelmäßige und anlassbezogene Sicherheitskommunikation adressatengerecht organisieren.",
      "reasonEn": "Organise routine and event-driven security communication for its intended recipients.",
      "whenRequired": "Unterstützt die ISMS-Kommunikation; gesetzliche Ereignismeldungen verbleiben in D14/D24/D48. Ein gemeinsamer Kommunikationsplan ist zulässig.",
      "whenRequiredEn": "Supports ISMS communication; statutory incident notifications remain in D14/D24/D48. A shared communication plan is permitted.",
      "sources": [
        "ISO 27001:2022 7.4, 7.5"
      ]
    }
  ],
  "D87": [
    {
      "id": "d87-c01",
      "title": "Ziel und Auslöser",
      "titleEn": "Objective and Trigger",
      "description": "Der Antragsteller beschreibt Änderung, Anlass und beabsichtigtes Ergebnis, beispielsweise eine neue Scope-Grenze, Risikomethodik oder Zuständigkeitsverteilung. Betroffene Prozesse, Dokumente, Personen und externe Schnittstellen werden identifiziert.",
      "descriptionEn": "The requester describes the change, trigger and intended outcome, such as a new scope boundary, risk method or allocation of responsibilities. Identify affected processes, documents, people and external interfaces.",
      "reason": "Änderungen des Managementsystems geplant und mit überprüfbaren Ergebnissen umsetzen.",
      "reasonEn": "Implement management-system changes in a planned manner with verifiable outcomes.",
      "whenRequired": "Für Änderungen des ISMS, nicht als doppelte technische Change-Freigabe. Die konkrete Planstruktur ist eine Umsetzungshilfe.",
      "whenRequiredEn": "For ISMS changes, not duplicate technical change approval. The particular planning structure is an implementation aid.",
      "sources": [
        "ISO 27001:2022 6.3"
      ]
    },
    {
      "id": "d87-c02",
      "title": "Auswirkung und Umsetzung",
      "titleEn": "Impact and Implementation",
      "description": "Vor Umsetzung werden Risiken, Ressourcen, Kompetenz, Abhängigkeiten und die Aufrechterhaltung bestehender Kontrollen betrachtet. Aufgaben erhalten Verantwortliche und Termine. Erforderliche technische Änderungen werden über p48 verknüpft; eine ISMS-Freigabe ersetzt keine technische Sicherheitsprüfung.",
      "descriptionEn": "Before implementation consider risks, resources, competence, dependencies and continuity of existing controls. Assign owners and dates to tasks. Link required technical changes through p48; ISMS approval does not replace technical security verification.",
      "reason": "Änderungen des Managementsystems geplant und mit überprüfbaren Ergebnissen umsetzen.",
      "reasonEn": "Implement management-system changes in a planned manner with verifiable outcomes.",
      "whenRequired": "Für Änderungen des ISMS, nicht als doppelte technische Change-Freigabe. Die konkrete Planstruktur ist eine Umsetzungshilfe.",
      "whenRequiredEn": "For ISMS changes, not duplicate technical change approval. The particular planning structure is an implementation aid.",
      "sources": [
        "ISO 27001:2022 6.3, 8.1"
      ]
    },
    {
      "id": "d87-c03",
      "title": "Freigabe und Übergang",
      "titleEn": "Approval and Transition",
      "description": "Die befugte Rolle genehmigt den Plan und verbleibende offene Punkte. Betroffene Personen erhalten neue Aufgaben, Anweisungen und nötige Einweisung rechtzeitig. Übergangsregeln, Eskalation und gegebenenfalls Rücknahme werden festgelegt, damit keine Verantwortungs- oder Kontrolllücke entsteht.",
      "descriptionEn": "The authorised role approves the plan and remaining open issues. Affected people receive new responsibilities, instructions and necessary instruction in time. Define transition arrangements, escalation and reversal where appropriate so that responsibility or control gaps do not arise.",
      "reason": "Änderungen des Managementsystems geplant und mit überprüfbaren Ergebnissen umsetzen.",
      "reasonEn": "Implement management-system changes in a planned manner with verifiable outcomes.",
      "whenRequired": "Für Änderungen des ISMS, nicht als doppelte technische Change-Freigabe. Die konkrete Planstruktur ist eine Umsetzungshilfe.",
      "whenRequiredEn": "For ISMS changes, not duplicate technical change approval. The particular planning structure is an implementation aid.",
      "sources": [
        "ISO 27001:2022 5.3, 6.3, 7.2-7.4"
      ]
    },
    {
      "id": "d87-c04",
      "title": "Ergebnisprüfung",
      "titleEn": "Outcome Verification",
      "description": "Nach Umsetzung wird geprüft, ob das Ziel erreicht wurde und unerwünschte Auswirkungen bestehen. Scope, SoA, Risiken, Ziele und Dokumentenverzeichnis werden bei Bedarf aktualisiert. Die Abschlussentscheidung verweist auf tatsächliche Nachweise und offene Folgeaktionen.",
      "descriptionEn": "After implementation verify achievement of the objective and check for unintended effects. Update scope, SoA, risks, objectives and the document inventory where needed. The closure decision references actual evidence and open follow-up actions.",
      "reason": "Änderungen des Managementsystems geplant und mit überprüfbaren Ergebnissen umsetzen.",
      "reasonEn": "Implement management-system changes in a planned manner with verifiable outcomes.",
      "whenRequired": "Für Änderungen des ISMS, nicht als doppelte technische Change-Freigabe. Die konkrete Planstruktur ist eine Umsetzungshilfe.",
      "whenRequiredEn": "For ISMS changes, not duplicate technical change approval. The particular planning structure is an implementation aid.",
      "sources": [
        "ISO 27001:2022 6.3, 8.1, 9.1; NIS2 Article 21(4)"
      ]
    }
  ],
  "D88": [
    {
      "id": "d88-c01",
      "title": "Gegenstand und berechtigte Parteien",
      "titleEn": "Subject and Authorised Parties",
      "description": "Die Beteiligten bestimmen Zweck, Informationskategorien, Klassifikation, erlaubte Empfänger und verantwortliche Ansprechpartner. Der Absender prüft vor der Übertragung seine Berechtigung und notwendige rechtliche oder vertragliche Voraussetzungen. Nicht benötigte Informationen werden nicht allein aus Bequemlichkeit mitgeliefert.",
      "descriptionEn": "The parties identify purpose, information categories, classification, permitted recipients and responsible contacts. Before transfer the sender checks authority and necessary legal or contractual conditions. Do not include unnecessary information merely for convenience.",
      "reason": "Schutz und Verantwortlichkeiten für eine konkrete Informationsübertragung festlegen.",
      "reasonEn": "Define safeguards and responsibilities for a particular information transfer.",
      "whenRequired": "Risikobasierte Übertragungsvereinbarung; kein Ersatz für Datenschutzvereinbarung, Übermittlungsgrundlage oder spezielle gesetzliche Formvorgaben.",
      "whenRequiredEn": "Risk-based transfer arrangement; not a substitute for a data-processing agreement, lawful transfer basis or specific legal formalities.",
      "sources": [
        "ISO 27001:2022 A.5.14; A.5.12"
      ]
    },
    {
      "id": "d88-c02",
      "title": "Übertragungsweg und Schutz",
      "titleEn": "Transfer Method and Protection",
      "description": "Die Vereinbarung legt den zugelassenen elektronischen, physischen oder mündlichen Übertragungsweg fest. Authentisierung, Empfängerprüfung, Vertraulichkeits- und Integritätsschutz entsprechen dem Schutzbedarf. Schlüssel oder Zugangsdaten werden nicht zusammen mit ungeschützt übertragenen Inhalten offengelegt.",
      "descriptionEn": "Specify the approved electronic, physical or verbal transfer method. Authentication, recipient checking, confidentiality and integrity safeguards match protection needs. Do not expose keys or access credentials alongside unprotected transferred content.",
      "reason": "Schutz und Verantwortlichkeiten für eine konkrete Informationsübertragung festlegen.",
      "reasonEn": "Define safeguards and responsibilities for a particular information transfer.",
      "whenRequired": "Risikobasierte Übertragungsvereinbarung; kein Ersatz für Datenschutzvereinbarung, Übermittlungsgrundlage oder spezielle gesetzliche Formvorgaben.",
      "whenRequiredEn": "Risk-based transfer arrangement; not a substitute for a data-processing agreement, lawful transfer basis or specific legal formalities.",
      "sources": [
        "ISO 27001:2022 A.5.14; A.8.24; NIS2 Article 21(2)(h)"
      ]
    },
    {
      "id": "d88-c03",
      "title": "Empfang und Weitergabe",
      "titleEn": "Receipt and Onward Sharing",
      "description": "Die Parteien vereinbaren notwendige Empfangsbestätigung, Vollständigkeitsprüfung, berechtigte Weitergabe und Aufbewahrung. Bei wechselnden Ansprechpartnern oder Kanälen wird die Identität über einen vertrauenswürdigen Weg bestätigt. Nutzung, Rückgabe und Löschung richten sich nach Zweck und bindenden Anforderungen.",
      "descriptionEn": "Agree necessary receipt confirmation, completeness checks, permitted onward sharing and retention. When contacts or channels change, verify identity through a trusted route. Use, return and deletion follow the purpose and binding requirements.",
      "reason": "Schutz und Verantwortlichkeiten für eine konkrete Informationsübertragung festlegen.",
      "reasonEn": "Define safeguards and responsibilities for a particular information transfer.",
      "whenRequired": "Risikobasierte Übertragungsvereinbarung; kein Ersatz für Datenschutzvereinbarung, Übermittlungsgrundlage oder spezielle gesetzliche Formvorgaben.",
      "whenRequiredEn": "Risk-based transfer arrangement; not a substitute for a data-processing agreement, lawful transfer basis or specific legal formalities.",
      "sources": [
        "ISO 27001:2022 A.5.14; A.5.33"
      ]
    },
    {
      "id": "d88-c04",
      "title": "Fehlübertragung und Beendigung",
      "titleEn": "Misdirection and Termination",
      "description": "Verlust, falsche Empfänger, Manipulationsverdacht und ausgebliebene Bestätigung werden an die benannten Kontakte eskaliert. Schutzmaßnahmen wie Sperren oder Rückruf werden nachvollziehbar durchgeführt; gesetzliche Meldungen werden separat bewertet. Die Vereinbarung nennt Gültigkeit, Änderung, Beendigung und zuständige Freigaben.",
      "descriptionEn": "Escalate loss, incorrect recipients, suspected tampering and missing acknowledgement to the named contacts. Record safeguards such as access blocking or recall; assess statutory notification separately. State validity, amendment, termination and authorised approvals.",
      "reason": "Schutz und Verantwortlichkeiten für eine konkrete Informationsübertragung festlegen.",
      "reasonEn": "Define safeguards and responsibilities for a particular information transfer.",
      "whenRequired": "Risikobasierte Übertragungsvereinbarung; kein Ersatz für Datenschutzvereinbarung, Übermittlungsgrundlage oder spezielle gesetzliche Formvorgaben.",
      "whenRequiredEn": "Risk-based transfer arrangement; not a substitute for a data-processing agreement, lawful transfer basis or specific legal formalities.",
      "sources": [
        "ISO 27001:2022 A.5.14; A.5.24-A.5.26"
      ]
    }
  ],
  "D89": [
    {
      "id": "d89-c01",
      "title": "Erhebung und Zuständigkeit",
      "titleEn": "Collection and Ownership",
      "description": "Der Datenverantwortliche führt die erforderlichen Registrierungsdaten vollständig und aktuell: Domänenname, Registrierungsdatum, Name, E-Mail und Telefonnummer des Registranten sowie abweichende Verwaltungs-Kontaktdaten. Zuständigkeit und Datenaustausch mit beteiligten Registrierungsstellen werden so vereinbart, dass keine unnötige Doppelerhebung entsteht.",
      "descriptionEn": "The data owner maintains complete, current registration details: domain, registration date, registrant name, email and telephone, and differing administrative contact details. Agree responsibilities and exchange with registration partners to prevent unnecessary duplicate collection.",
      "reason": "Richtigkeit, Veröffentlichung und rechtmäßige Auskunft über Domänenregistrierungsdaten steuern.",
      "reasonEn": "Govern accuracy, publication and lawful disclosure of domain registration data.",
      "whenRequired": "Nur für TLD-Registries und Erbringer von Domänennamen-Registrierungsdiensten nach dem anwendbaren NIS2-Umsetzungsrecht; nicht für jede Organisation mit eigener Website.",
      "whenRequiredEn": "Only for TLD name registries and entities providing domain name registration services under applicable NIS2 implementing law; not every organisation with its own website.",
      "sources": [
        "NIS2 Article 28(1),(2),(6)"
      ]
    },
    {
      "id": "d89-c02",
      "title": "Überprüfung und Berichtigung",
      "titleEn": "Verification and Correction",
      "description": "Das Verfahren bestimmt angemessene Überprüfungen für neue und geänderte Daten, den Umgang mit fehlenden oder widersprüchlichen Angaben und die Nachverfolgung von Berichtigungen. Methoden werden nach Risiko gewählt und dokumentiert; pauschale Ausweiskopien sind nicht allein durch Artikel 28 vorgeschrieben.",
      "descriptionEn": "Define appropriate checks for new and changed data, handling of missing or inconsistent details and follow-up of corrections. Select and document methods according to risk; Article 28 alone does not prescribe blanket collection of identity-document copies.",
      "reason": "Richtigkeit, Veröffentlichung und rechtmäßige Auskunft über Domänenregistrierungsdaten steuern.",
      "reasonEn": "Govern accuracy, publication and lawful disclosure of domain registration data.",
      "whenRequired": "Nur für TLD-Registries und Erbringer von Domänennamen-Registrierungsdiensten nach dem anwendbaren NIS2-Umsetzungsrecht; nicht für jede Organisation mit eigener Website.",
      "whenRequiredEn": "Only for TLD name registries and entities providing domain name registration services under applicable NIS2 implementing law; not every organisation with its own website.",
      "sources": [
        "NIS2 Article 28(3); GDPR Article 5"
      ]
    },
    {
      "id": "d89-c03",
      "title": "Öffentliche Angaben und Verfahren",
      "titleEn": "Public Data and Procedures",
      "description": "Richtlinien und Verfahren zur Datenqualität und Auskunft werden öffentlich bereitgestellt. Nach Registrierung werden nicht personenbezogene Registrierungsdaten ohne unangemessene Verzögerung veröffentlicht. Vor Veröffentlichung wird geprüft, welche Felder personenbezogen sind; die gesamte Datenbank wird nicht automatisch öffentlich. In Deutschland waren beide Verfahren — Datenqualität und Auskunft — bis zum 6. März 2026 öffentlich zugänglich zu machen (§ 49 Absatz 3 und § 50 Absatz 2 BSIG). Diese Frist ist verstrichen; eine noch fehlende Veröffentlichung ist daher unverzüglich nachzuholen.",
      "descriptionEn": "Publish the data-quality and disclosure policies and procedures. Make non-personal registration data public without undue delay after registration. Assess which fields are personal before publication; do not make the entire database public automatically. In Germany, both procedures — data quality and disclosure — had to be made publicly available by 6 March 2026 (sections 49(3) and 50(2) BSIG). That deadline has passed, so any publication still missing is already overdue and must be completed without delay.",
      "reason": "Richtigkeit, Veröffentlichung und rechtmäßige Auskunft über Domänenregistrierungsdaten steuern.",
      "reasonEn": "Govern accuracy, publication and lawful disclosure of domain registration data.",
      "whenRequired": "Nur für TLD-Registries und Erbringer von Domänennamen-Registrierungsdiensten nach dem anwendbaren NIS2-Umsetzungsrecht; nicht für jede Organisation mit eigener Website.",
      "whenRequiredEn": "Only for TLD name registries and entities providing domain name registration services under applicable NIS2 implementing law; not every organisation with its own website.",
      "sources": [
        "NIS2 Article 28(3)-(5)",
        "BSIG §§ 49 Absatz 3, 50 Absatz 2 (Deutschland)"
      ]
    },
    {
      "id": "d89-c04",
      "title": "Auskunftsanträge",
      "titleEn": "Disclosure Requests",
      "description": "Anträge werden mit Eingang, Antragsteller, konkreten Daten, Rechtsgrund und Begründung erfasst. Berechtigung und Datenschutz werden vor einer gezielten Herausgabe geprüft. Die Antwort erfolgt unverzüglich, spätestens 72 Stunden nach Antragseingang. Eine automatische Empfangsbestätigung ersetzt keine inhaltliche Antwort; Ablehnung oder begrenzte Auskunft wird begründet dokumentiert. Liegt die verlangte Information nicht vor, wird dies dem Antragsteller in Deutschland innerhalb von 24 Stunden nach Antragseingang mitgeteilt (§ 50 Absatz 1 Satz 2 BSIG); diese Mitteilung tritt neben die 72-Stunden-Antwort und ersetzt sie nicht.",
      "descriptionEn": "Log receipt, requester, specified data, legal basis and justification. Check entitlement and data protection before targeted disclosure. Respond without undue delay and within 72 hours of receipt. An automated acknowledgement is not a substantive response; record reasons for refusal or limited disclosure. In Germany, where the requested information is not held, the requester is informed within 24 hours of receipt (section 50(1) sentence 2 BSIG); that notice sits alongside the 72-hour response and does not replace it.",
      "reason": "Richtigkeit, Veröffentlichung und rechtmäßige Auskunft über Domänenregistrierungsdaten steuern.",
      "reasonEn": "Govern accuracy, publication and lawful disclosure of domain registration data.",
      "whenRequired": "Nur für TLD-Registries und Erbringer von Domänennamen-Registrierungsdiensten nach dem anwendbaren NIS2-Umsetzungsrecht; nicht für jede Organisation mit eigener Website.",
      "whenRequiredEn": "Only for TLD name registries and entities providing domain name registration services under applicable NIS2 implementing law; not every organisation with its own website.",
      "sources": [
        "NIS2 Article 28(5)",
        "BSIG § 50 Absatz 1 Satz 2 (Deutschland)"
      ]
    },
    {
      "id": "d89-c05",
      "title": "Betrieb und Nachweis",
      "titleEn": "Operation and Evidence",
      "description": "Zugriffe auf personenbezogene Angaben sind beschränkt und Auskünfte nachvollziehbar. Aufbewahrung, Berichtigung und Löschung folgen den geltenden Zwecken und Fristen. Der Eigentümer prüft Stichproben der Datenqualität und fristgerechte Bearbeitung; Mängel erhalten Korrektur und Nachprüfung.",
      "descriptionEn": "Restrict access to personal details and make disclosures traceable. Retention, correction and deletion follow applicable purposes and periods. The owner checks data-quality samples and timely request handling; deficiencies receive correction and follow-up.",
      "reason": "Richtigkeit, Veröffentlichung und rechtmäßige Auskunft über Domänenregistrierungsdaten steuern.",
      "reasonEn": "Govern accuracy, publication and lawful disclosure of domain registration data.",
      "whenRequired": "Nur für TLD-Registries und Erbringer von Domänennamen-Registrierungsdiensten nach dem anwendbaren NIS2-Umsetzungsrecht; nicht für jede Organisation mit eigener Website.",
      "whenRequiredEn": "Only for TLD name registries and entities providing domain name registration services under applicable NIS2 implementing law; not every organisation with its own website.",
      "sources": [
        "NIS2 Article 28(1),(3),(5); GDPR Articles 5,32"
      ]
    }
  ],
  "D90": [
    {
      "id": "d90-c01",
      "title": "Anwendbarkeit und Sitz",
      "titleEn": "Applicability and Establishment",
      "description": "Die Organisation dokumentiert ihren Diensttyp nach Artikel 26 Absatz 1 Buchstabe b, fehlende EU-Niederlassung und die Mitgliedstaaten des Angebots. Der Vertreter muss in einem Mitgliedstaat niedergelassen sein, in dem Dienste angeboten werden. Die bloße Erreichbarkeit einer Website wird nicht ohne weitere Prüfung als gezieltes Angebot bewertet.",
      "descriptionEn": "Document the service type under Article 26(1)(b), absence of an EU establishment and Member States where services are offered. The representative must be established in a Member State where services are offered. Do not treat mere website accessibility as a targeted offer without further assessment.",
      "reason": "Die Vertretung eines erfassten Nicht-EU-Anbieters wirksam und erreichbar organisieren.",
      "reasonEn": "Establish effective, reachable representation for a covered non-EU provider.",
      "whenRequired": "Nur für Anbieterarten nach Artikel 26 Absatz 1 Buchstabe b ohne Niederlassung in der Union, die Dienste in der Union anbieten. Kein allgemeiner Vertreterzwang für alle Nicht-EU-Unternehmen.",
      "whenRequiredEn": "Only for entity types in Article 26(1)(b) without an EU establishment that offer services in the Union. Not a general representative duty for every non-EU business.",
      "sources": [
        "NIS2 Article 26(1)(b),(3); recital 116"
      ]
    },
    {
      "id": "d90-c02",
      "title": "Benennung und Befugnis",
      "titleEn": "Designation and Authority",
      "description": "Die vertretungsberechtigte Leitung benennt den Vertreter mit eindeutigem Auftrag und akzeptierter Zuständigkeit. Der Auftrag ermöglicht zuständigen Behörden und CSIRTs, den Vertreter in NIS2-Angelegenheiten anzusprechen. Die genaue interne Vollmacht und vertragliche Ausgestaltung werden rechtlich geprüft; das Unternehmen bleibt für seine Pflichten verantwortlich.",
      "descriptionEn": "Authorised management designates the representative with a clear mandate and accepted responsibilities. The mandate enables competent authorities and CSIRTs to address the representative on NIS2 matters. Review the precise internal authority and contractual terms legally; the entity remains responsible for its obligations.",
      "reason": "Die Vertretung eines erfassten Nicht-EU-Anbieters wirksam und erreichbar organisieren.",
      "reasonEn": "Establish effective, reachable representation for a covered non-EU provider.",
      "whenRequired": "Nur für Anbieterarten nach Artikel 26 Absatz 1 Buchstabe b ohne Niederlassung in der Union, die Dienste in der Union anbieten. Kein allgemeiner Vertreterzwang für alle Nicht-EU-Unternehmen.",
      "whenRequiredEn": "Only for entity types in Article 26(1)(b) without an EU establishment that offer services in the Union. Not a general representative duty for every non-EU business.",
      "sources": [
        "NIS2 Article 26(3)-(4); recital 116"
      ]
    },
    {
      "id": "d90-c03",
      "title": "Kontakt und Registrierung",
      "titleEn": "Contact and Registration",
      "description": "Aktuelle Vertreter- und Unternehmenskontakte werden über D11 an die zuständige Stelle übermittelt, soweit vorgeschrieben. Der Vertreter erhält sichere Wege zu entscheidungsbefugten Personen und die notwendigen Informationen. Diese Benennung ersetzt weder eine gegebenenfalls erforderliche Datenschutzvertretung noch einen Datenschutzbeauftragten.",
      "descriptionEn": "Provide current representative and entity contacts to the competent body through D11 where required. Give the representative secure routes to authorised decision-makers and necessary information. This designation replaces neither any required data-protection representative nor a data protection officer.",
      "reason": "Die Vertretung eines erfassten Nicht-EU-Anbieters wirksam und erreichbar organisieren.",
      "reasonEn": "Establish effective, reachable representation for a covered non-EU provider.",
      "whenRequired": "Nur für Anbieterarten nach Artikel 26 Absatz 1 Buchstabe b ohne Niederlassung in der Union, die Dienste in der Union anbieten. Kein allgemeiner Vertreterzwang für alle Nicht-EU-Unternehmen.",
      "whenRequiredEn": "Only for entity types in Article 26(1)(b) without an EU establishment that offer services in the Union. Not a general representative duty for every non-EU business.",
      "sources": [
        "NIS2 Article 27(2)-(3)"
      ]
    },
    {
      "id": "d90-c04",
      "title": "Änderung und Übergang",
      "titleEn": "Change and Handover",
      "description": "Änderungen von Sitz, Angebot, Vertretung oder Kontakten werden auf die Zuständigkeit und Meldepflichten geprüft. Ein Wechsel wird mit Übergabe offener Vorgänge und gesicherter Erreichbarkeit organisiert. Ein beendeter Auftrag darf nicht weiterhin als wirksame Vertretung im Register erscheinen.",
      "descriptionEn": "Assess changes to establishment, services, representation or contacts for jurisdiction and notification duties. Arrange replacement with handover of open matters and maintained reachability. An ended mandate must not remain listed as effective representation.",
      "reason": "Die Vertretung eines erfassten Nicht-EU-Anbieters wirksam und erreichbar organisieren.",
      "reasonEn": "Establish effective, reachable representation for a covered non-EU provider.",
      "whenRequired": "Nur für Anbieterarten nach Artikel 26 Absatz 1 Buchstabe b ohne Niederlassung in der Union, die Dienste in der Union anbieten. Kein allgemeiner Vertreterzwang für alle Nicht-EU-Unternehmen.",
      "whenRequiredEn": "Only for entity types in Article 26(1)(b) without an EU establishment that offer services in the Union. Not a general representative duty for every non-EU business.",
      "sources": [
        "NIS2 Articles 26-27"
      ]
    }
  ],
  "D91": [
    {
      "id": "d91-c01",
      "title": "Teilnahmeentscheidung",
      "titleEn": "Participation Decision",
      "description": "Der Verantwortliche bewertet Nutzen, Partner, Themen, Schutzbedarf und Teilnahmebedingungen der Gemeinschaft. Die Organisation entscheidet freiwillig über Teilnahme, Umfang und befugte Personen. Bloßer Bezug eines Warn-Newsletters wird nicht ohne Prüfung mit einer Austauschvereinbarung nach Artikel 29 gleichgesetzt.",
      "descriptionEn": "Assess the community’s benefits, partners, subjects, sensitivity and participation terms. The organisation voluntarily decides participation, scope and authorised people. Do not automatically equate subscribing to an alert newsletter with an Article 29 sharing arrangement.",
      "reason": "Eine freiwillig gewählte Austauschvereinbarung mit klaren Schutz-, Teilnahme- und Meldeentscheidungen betreiben.",
      "reasonEn": "Operate a voluntarily chosen sharing arrangement with clear safeguards, participation and notification decisions.",
      "whenRequired": "Nur bei gewählter Teilnahme. Artikel 29 verlangt keine Mitgliedschaft; die Teilnahme- und Austrittsmeldung nach Absatz 4 ist für teilnehmende wesentliche/wichtige Einrichtungen zu beachten.",
      "whenRequiredEn": "Only when participation is chosen. Article 29 does not require membership; participating essential/important entities must observe the joining and withdrawal notification under paragraph 4.",
      "sources": [
        "NIS2 Article 29(1)-(3)"
      ]
    },
    {
      "id": "d91-c02",
      "title": "Zulässige Informationen",
      "titleEn": "Permitted Information",
      "description": "Vor Weitergabe werden Zweck, Empfänger, Vertraulichkeit, Rechte Dritter und gegebenenfalls Datenschutz geprüft. Daten werden auf das Erforderliche begrenzt; technische Indikatoren werden nach Möglichkeit ohne unnötigen Personenbezug geteilt. Kennzeichnungen und Weitergabebeschränkungen werden vereinbart und eingehalten.",
      "descriptionEn": "Before sharing, check purpose, recipients, confidentiality, third-party rights and data protection where relevant. Limit data to what is needed; share technical indicators without unnecessary personal information where possible. Agree and respect markings and onward-sharing restrictions.",
      "reason": "Eine freiwillig gewählte Austauschvereinbarung mit klaren Schutz-, Teilnahme- und Meldeentscheidungen betreiben.",
      "reasonEn": "Operate a voluntarily chosen sharing arrangement with clear safeguards, participation and notification decisions.",
      "whenRequired": "Nur bei gewählter Teilnahme. Artikel 29 verlangt keine Mitgliedschaft; die Teilnahme- und Austrittsmeldung nach Absatz 4 ist für teilnehmende wesentliche/wichtige Einrichtungen zu beachten.",
      "whenRequiredEn": "Only when participation is chosen. Article 29 does not require membership; participating essential/important entities must observe the joining and withdrawal notification under paragraph 4.",
      "sources": [
        "NIS2 Article 29(1)-(2); GDPR Articles 5-6"
      ]
    },
    {
      "id": "d91-c03",
      "title": "Teilnahme- und Austrittsmeldung",
      "titleEn": "Joining and Withdrawal Notification",
      "description": "Handelt es sich bei der teilnehmenden Organisation um eine wesentliche oder wichtige Einrichtung, meldet die zuständige Rolle den Beitritt an die zuständige Behörde und gegebenenfalls das Wirksamwerden des Austritts. Zuständiger Empfänger, Verfahren und Versandnachweis werden festgehalten. Diese Mitteilung ist keine Vorfallsmeldung nach Artikel 23.",
      "descriptionEn": "If the participating organisation is essential or important, the assigned role notifies the competent authority upon joining and, where applicable, when withdrawal takes effect. Record the recipient, route and submission evidence. This notice is not an Article 23 incident report.",
      "reason": "Eine freiwillig gewählte Austauschvereinbarung mit klaren Schutz-, Teilnahme- und Meldeentscheidungen betreiben.",
      "reasonEn": "Operate a voluntarily chosen sharing arrangement with clear safeguards, participation and notification decisions.",
      "whenRequired": "Nur bei gewählter Teilnahme. Artikel 29 verlangt keine Mitgliedschaft; die Teilnahme- und Austrittsmeldung nach Absatz 4 ist für teilnehmende wesentliche/wichtige Einrichtungen zu beachten.",
      "whenRequiredEn": "Only when participation is chosen. Article 29 does not require membership; participating essential/important entities must observe the joining and withdrawal notification under paragraph 4.",
      "sources": [
        "NIS2 Article 29(4)"
      ]
    },
    {
      "id": "d91-c04",
      "title": "Nutzung und Überprüfung",
      "titleEn": "Use and Review",
      "description": "Erhaltene Informationen werden auf Qualität, Relevanz und erforderliche Maßnahmen geprüft. Sie werden nicht ungeprüft in produktive Sperrregeln übernommen. Teilnahmeberechtigungen und Partnerbedingungen werden aktuell gehalten; Fehlweitergaben werden über den Vorfallsprozess behandelt. Freiwilliger Austausch ersetzt keine bestehende Pflichtmeldung.",
      "descriptionEn": "Evaluate received information for quality, relevance and necessary action. Do not apply it uncritically as production blocking rules. Keep participant permissions and partner terms current; handle misdisclosures through the incident process. Voluntary sharing does not replace an existing mandatory notification.",
      "reason": "Eine freiwillig gewählte Austauschvereinbarung mit klaren Schutz-, Teilnahme- und Meldeentscheidungen betreiben.",
      "reasonEn": "Operate a voluntarily chosen sharing arrangement with clear safeguards, participation and notification decisions.",
      "whenRequired": "Nur bei gewählter Teilnahme. Artikel 29 verlangt keine Mitgliedschaft; die Teilnahme- und Austrittsmeldung nach Absatz 4 ist für teilnehmende wesentliche/wichtige Einrichtungen zu beachten.",
      "whenRequiredEn": "Only when participation is chosen. Article 29 does not require membership; participating essential/important entities must observe the joining and withdrawal notification under paragraph 4.",
      "sources": [
        "NIS2 Articles 23,29-30"
      ]
    }
  ],
  "D92": [
    {
      "id": "d92-c01",
      "title": "Eingang und Zuständigkeit",
      "titleEn": "Receipt and Competence",
      "description": "Die zuständige Rolle erfasst Absender, Echtheit, Rechtsgrundlage, Zweck, Umfang und Frist des behördlichen Anliegens. Unklare oder überschießende Anforderungen werden rechtzeitig über den zulässigen Rechts- und Kommunikationsweg geklärt. Eine Rückfrage oder ein Rechtsbehelf wird nicht automatisch als Fristverlängerung behandelt.",
      "descriptionEn": "The assigned role records sender, authenticity, legal basis, purpose, scope and deadline. Clarify unclear or excessive requests promptly through permitted legal and communication routes. Do not treat a question or legal challenge as an automatic deadline extension.",
      "reason": "Behördliche Anliegen fristgerecht, nachvollziehbar und im richtigen Umfang bearbeiten.",
      "reasonEn": "Handle supervisory matters on time, traceably and within their proper scope.",
      "whenRequired": "Bei einer zuständigen behördlichen Anfrage oder verbindlichen Anordnung. Wesentliche und wichtige Einrichtungen haben unterschiedliche Aufsichtsregime; aus Artikel 32 folgt keine allgemeine Pflicht aller Unternehmen, selbst jährliche externe Audits zu beauftragen.",
      "whenRequiredEn": "When a competent authority issues a request or binding order. Essential and important entities have different supervisory regimes; Article 32 does not create a general duty for all companies to commission annual external audits.",
      "sources": [
        "NIS2 Articles 32(2)-(3),33(2)-(3); applicable national procedure"
      ]
    },
    {
      "id": "d92-c02",
      "title": "Sicherung und Zusammenstellung",
      "titleEn": "Preservation and Assembly",
      "description": "Ein Verantwortlicher sammelt die angeforderten gültigen Richtlinien und tatsächlichen Umsetzungsnachweise. Herkunft, Version, Prüfzeitraum und bekannte Lücken bleiben sichtbar. Relevante Originalnachweise werden vor versehentlicher Löschung geschützt; Belege dürfen nicht nachträglich erfunden oder ohne Kennzeichnung korrigiert werden.",
      "descriptionEn": "An owner assembles the requested current policies and actual implementation evidence. Preserve provenance, version, review period and known gaps. Protect relevant original evidence against accidental deletion; never fabricate records or make undisclosed retrospective corrections.",
      "reason": "Behördliche Anliegen fristgerecht, nachvollziehbar und im richtigen Umfang bearbeiten.",
      "reasonEn": "Handle supervisory matters on time, traceably and within their proper scope.",
      "whenRequired": "Bei einer zuständigen behördlichen Anfrage oder verbindlichen Anordnung. Wesentliche und wichtige Einrichtungen haben unterschiedliche Aufsichtsregime; aus Artikel 32 folgt keine allgemeine Pflicht aller Unternehmen, selbst jährliche externe Audits zu beauftragen.",
      "whenRequiredEn": "When a competent authority issues a request or binding order. Essential and important entities have different supervisory regimes; Article 32 does not create a general duty for all companies to commission annual external audits.",
      "sources": [
        "NIS2 Articles 32(2)(e)-(g),33(2)(d)-(f); ISO 27001:2022 A.5.33"
      ]
    },
    {
      "id": "d92-c03",
      "title": "Antwort und Zugriff",
      "titleEn": "Response and Access",
      "description": "Fachlich und rechtlich geprüfte Antworten werden über den bestätigten sicheren Kanal im angeforderten Umfang übermittelt. Bei Systemzugriffen werden Zuständigkeit, Zweck, Umfang und Schutzmaßnahmen abgestimmt, ohne rechtmäßige Aufsicht zu behindern. Versand, Anlagen und Empfang werden nachvollziehbar dokumentiert.",
      "descriptionEn": "Send technically and legally checked responses through the confirmed secure channel within the requested scope. For system access, agree authority, purpose, scope and safeguards without obstructing lawful supervision. Record submission, attachments and receipt traceably.",
      "reason": "Behördliche Anliegen fristgerecht, nachvollziehbar und im richtigen Umfang bearbeiten.",
      "reasonEn": "Handle supervisory matters on time, traceably and within their proper scope.",
      "whenRequired": "Bei einer zuständigen behördlichen Anfrage oder verbindlichen Anordnung. Wesentliche und wichtige Einrichtungen haben unterschiedliche Aufsichtsregime; aus Artikel 32 folgt keine allgemeine Pflicht aller Unternehmen, selbst jährliche externe Audits zu beauftragen.",
      "whenRequiredEn": "When a competent authority issues a request or binding order. Essential and important entities have different supervisory regimes; Article 32 does not create a general duty for all companies to commission annual external audits.",
      "sources": [
        "NIS2 Articles 32-33; ISO 27001:2022 A.5.5"
      ]
    },
    {
      "id": "d92-c04",
      "title": "Anordnungen und Abschluss",
      "titleEn": "Orders and Closure",
      "description": "Verbindliche Anordnungen erhalten verantwortliche Personen, verbindliche Termine und überprüfbare Maßnahmen in D05. Die Leitung wird über Risiken und drohende Fristverletzungen informiert. Abschluss wird erst nach nachgewiesener Umsetzung und erforderlicher Berichterstattung dokumentiert; eine intern geschlossene Aufgabe beweist keine behördliche Erledigung.",
      "descriptionEn": "Assign owners, binding dates and verifiable actions in D05 for binding orders. Inform management of risks and impending missed deadlines. Record closure only after evidenced implementation and required reporting; an internally closed task does not prove that the authority has closed the matter.",
      "reason": "Behördliche Anliegen fristgerecht, nachvollziehbar und im richtigen Umfang bearbeiten.",
      "reasonEn": "Handle supervisory matters on time, traceably and within their proper scope.",
      "whenRequired": "Bei einer zuständigen behördlichen Anfrage oder verbindlichen Anordnung. Wesentliche und wichtige Einrichtungen haben unterschiedliche Aufsichtsregime; aus Artikel 32 folgt keine allgemeine Pflicht aller Unternehmen, selbst jährliche externe Audits zu beauftragen.",
      "whenRequiredEn": "When a competent authority issues a request or binding order. Essential and important entities have different supervisory regimes; Article 32 does not create a general duty for all companies to commission annual external audits.",
      "sources": [
        "NIS2 Articles 32(4),33(4); Article 21(4)"
      ]
    }
  ],
  "D93": [
    {
      "id": "d93-c01",
      "title": "Projektumfang und Verantwortung",
      "titleEn": "Project Scope and Responsibility",
      "description": "Der Projektverantwortliche ermittelt betroffene Informationen, Geschäftsprozesse, Standorte, Systeme und externe Parteien. Sicherheitsverantwortliche werden früh beteiligt; Rollen, Entscheidungspunkte und notwendige Ressourcen werden im Projektplan verankert. Auch ein Umzug oder eine Prozessauslagerung wird bewertet, nicht nur Softwareentwicklung.",
      "descriptionEn": "The project owner identifies affected information, business processes, sites, systems and external parties. Involve security owners early and establish responsibilities, decision points and necessary resources in the project plan. Assess an office move or process outsourcing as well as software development.",
      "reason": "Sicherheitsanforderungen früh in Projekte und Beschaffungen einbringen und ihre Erfüllung vor Übergabe prüfen.",
      "reasonEn": "Introduce security requirements early into projects and acquisitions and verify them before handover.",
      "whenRequired": "Für informationssicherheitsrelevante Projekte einschließlich Nicht-IT-Projekten sowie Systembeschaffung. Entwicklungsvorgaben gelten nur bei tatsächlicher Entwicklung. CIR-Beschaffungsdetails gelten nur innerhalb des CIR-Anwendungsbereichs.",
      "whenRequiredEn": "For information-security-relevant projects, including non-IT projects, and system acquisition. Development rules apply only where development occurs. CIR acquisition details apply only within CIR scope.",
      "sources": [
        "ISO 27001:2022 A.5.8"
      ]
    },
    {
      "id": "d93-c02",
      "title": "Prüfbare Sicherheitsanforderungen",
      "titleEn": "Testable Security Requirements",
      "description": "Risiken und bindende Anforderungen werden vor Auswahl oder Entwurf in überprüfbare Anforderungen übersetzt. Dazu gehören geeignete Zugriffs-, Daten-, Protokollierungs-, Kapazitäts-, Wiederherstellungs- und Betriebsanforderungen. Für relevante Systembeschaffungen werden Sicherheitskomponenten, Konfiguration, Updates während der Lebensdauer oder Ersatz nach Supportende und erforderliche Prüfnachweise vereinbart.",
      "descriptionEn": "Translate risks and binding requirements into verifiable requirements before selection or design. Include suitable access, data, logging, capacity, recovery and operational needs. For relevant system acquisitions, agree security components, configuration, updates over the lifetime or replacement after support ends, and required verification evidence.",
      "reason": "Sicherheitsanforderungen früh in Projekte und Beschaffungen einbringen und ihre Erfüllung vor Übergabe prüfen.",
      "reasonEn": "Introduce security requirements early into projects and acquisitions and verify them before handover.",
      "whenRequired": "Für informationssicherheitsrelevante Projekte einschließlich Nicht-IT-Projekten sowie Systembeschaffung. Entwicklungsvorgaben gelten nur bei tatsächlicher Entwicklung. CIR-Beschaffungsdetails gelten nur innerhalb des CIR-Anwendungsbereichs.",
      "whenRequiredEn": "For information-security-relevant projects, including non-IT projects, and system acquisition. Development rules apply only where development occurs. CIR acquisition details apply only within CIR scope.",
      "sources": [
        "ISO 27001:2022 A.5.8, A.8.26; CIR Annex 6.1.2, within scope"
      ]
    },
    {
      "id": "d93-c03",
      "title": "Lieferanten und Änderungen",
      "titleEn": "Suppliers and Changes",
      "description": "Angebote und Zusagen werden gegen Anforderungen geprüft; Lieferantenrisiken und Vertragslücken folgen p42. Änderungen von Umfang, Daten, Architektur oder Lieferanten lösen eine angemessene Neubewertung aus. Eine Produktzertifizierung ersetzt nicht den Nachweis, dass das gelieferte und konfigurierte System die eigenen Anforderungen erfüllt.",
      "descriptionEn": "Assess offers and commitments against requirements; supplier risks and contractual gaps follow p42. Changes to scope, data, architecture or suppliers trigger suitable reassessment. Product certification does not replace evidence that the delivered and configured system meets the organisation’s requirements.",
      "reason": "Sicherheitsanforderungen früh in Projekte und Beschaffungen einbringen und ihre Erfüllung vor Übergabe prüfen.",
      "reasonEn": "Introduce security requirements early into projects and acquisitions and verify them before handover.",
      "whenRequired": "Für informationssicherheitsrelevante Projekte einschließlich Nicht-IT-Projekten sowie Systembeschaffung. Entwicklungsvorgaben gelten nur bei tatsächlicher Entwicklung. CIR-Beschaffungsdetails gelten nur innerhalb des CIR-Anwendungsbereichs.",
      "whenRequiredEn": "For information-security-relevant projects, including non-IT projects, and system acquisition. Development rules apply only where development occurs. CIR acquisition details apply only within CIR scope.",
      "sources": [
        "ISO 27001:2022 A.5.8, A.5.20; CIR Annex 6.1.2(c)-(f), within scope"
      ]
    },
    {
      "id": "d93-c04",
      "title": "Abnahme und offene Risiken",
      "titleEn": "Acceptance and Open Risks",
      "description": "Vor der Übergabe wird jede relevante Sicherheitsanforderung mit geeigneter Prüfung oder verlässlichem Nachweis bewertet. Version, Testumfang, tatsächliches Ergebnis und Einschränkungen werden dokumentiert. Offene Mängel erhalten Behandlung und befugte Entscheidung; ein nicht durchgeführter Test darf nicht als bestanden gelten. Gesetzliche Pflichten können nicht durch Projektfreigabe abbedungen werden.",
      "descriptionEn": "Before handover, assess each relevant security requirement through appropriate testing or reliable evidence. Record version, test scope, actual outcome and limitations. Open defects receive treatment and an authorised decision; a test not performed must not be marked passed. Project approval cannot waive legal obligations.",
      "reason": "Sicherheitsanforderungen früh in Projekte und Beschaffungen einbringen und ihre Erfüllung vor Übergabe prüfen.",
      "reasonEn": "Introduce security requirements early into projects and acquisitions and verify them before handover.",
      "whenRequired": "Für informationssicherheitsrelevante Projekte einschließlich Nicht-IT-Projekten sowie Systembeschaffung. Entwicklungsvorgaben gelten nur bei tatsächlicher Entwicklung. CIR-Beschaffungsdetails gelten nur innerhalb des CIR-Anwendungsbereichs.",
      "whenRequiredEn": "For information-security-relevant projects, including non-IT projects, and system acquisition. Development rules apply only where development occurs. CIR acquisition details apply only within CIR scope.",
      "sources": [
        "ISO 27001:2022 A.8.29; CIR Annex 6.1.2(f), within scope"
      ]
    },
    {
      "id": "d93-c05",
      "title": "Übergabe in den Betrieb",
      "titleEn": "Operational Handover",
      "description": "Der Betrieb erhält aktuelle Inventar-, Konfigurations-, Zugriffs-, Support-, Sicherungs- und Verfahrensinformationen sowie erforderliche Einweisung. Eigentümer bestätigen die übernommenen Aufgaben und offenen Maßnahmen. Projekterfahrungen fließen in neue Projekte und die Überprüfung des Beschaffungsprozesses ein.",
      "descriptionEn": "Operations receives current inventory, configuration, access, support, backup and procedure information with necessary instruction. Owners confirm transferred responsibilities and open actions. Lessons inform future projects and review of the acquisition process.",
      "reason": "Sicherheitsanforderungen früh in Projekte und Beschaffungen einbringen und ihre Erfüllung vor Übergabe prüfen.",
      "reasonEn": "Introduce security requirements early into projects and acquisitions and verify them before handover.",
      "whenRequired": "Für informationssicherheitsrelevante Projekte einschließlich Nicht-IT-Projekten sowie Systembeschaffung. Entwicklungsvorgaben gelten nur bei tatsächlicher Entwicklung. CIR-Beschaffungsdetails gelten nur innerhalb des CIR-Anwendungsbereichs.",
      "whenRequiredEn": "For information-security-relevant projects, including non-IT projects, and system acquisition. Development rules apply only where development occurs. CIR acquisition details apply only within CIR scope.",
      "sources": [
        "ISO 27001:2022 A.5.8; CIR Annex 6.1.3, within scope"
      ]
    }
  ]
} as PolicyClauseMap;

export default DELTA_TEMPLATES;
