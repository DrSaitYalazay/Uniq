/**
 * isoAuditCriteria — die 123 zusaetzlichen Pruefkriterien des Katalogs.
 *
 * Quelle: Unified_Control_Catalogue.json, Abschnitt `requirements` (123 ISO/IEC
 * 27001:2022-Referenzen: Klauseln 4-10 + 93 Annex-A-Kontrollen). Die Datei ist
 * GENERIERT - nicht von Hand aendern, sondern aus dem Katalog neu erzeugen.
 *
 * Warum getrennt von `isoAnnexMap`: dort stehen Nummer und Titel einer
 * Referenz, hier die Pruefanleitung dazu. Beide sind je Referenz verschluesselt,
 * nicht je Kontrolle - der Katalog vergibt die Kriterien bewusst auf Normebene,
 * damit eine Kontrolle, die zu mehreren Referenzen beitraegt, die Kriterien
 * jeder dieser Referenzen sieht.
 *
 * Sprache: Originalwortlaut des Katalogs (englisch) - wie die Kontrolltexte der
 * ISO-Ansicht selbst. Eine deutsche Fassung entsteht gemeinsam mit der
 * Uebersetzung des Gesamtkatalogs, damit keine halbdeutsche Mischung entsteht.
 *
 * `mappingType` ist fuer alle 123 Referenzen `contributes_to_requirement`:
 * eine Kontrolle traegt zu einer Anforderung BEI, sie ist nicht mit ihr
 * gleichgesetzt. Deshalb darf aus einer erfuellten Kontrolle nie automatisch
 * eine erfuellte Anforderung werden (Katalog-Vertrag `no_automatic_pass`).
 */

import { isoRefsAll } from "./isoAnnexMap";

export interface IsoAuditCriterion {
  /** ISO-Referenz, z. B. "8.2" oder "A.5.23". */
  ref: string;
  /** Zusaetzliche Pruefkriterien im Originalwortlaut. */
  criteria: string;
  /** Kontroll-IDs, die der Katalog dieser Anforderung zuordnet. */
  controlIds: string[];
  /** Beitragsart - derzeit durchgaengig "contributes_to_requirement". */
  mappingType: string;
}

/**
 * Bindungsregel fuer den Geltungsbereich - im Katalog fuer alle 123
 * Referenzen identisch, deshalb einmal als Konstante statt 123-mal wiederholt.
 */
export const ISO_SCOPE_RULE = "Bind the control to the actual ISMS scope; do not reuse a narrower NIS2 result without evidence coverage.";

/** Vertragstext: eine Zuordnung ist kein Pruefergebnis (assessment_contract.no_automatic_pass). */
export const ISO_NO_AUTOMATIC_PASS = "A mapping is not an assessment result. All statuses start not_assessed. Missing scope/criteria evidence blocks conformity.";

/** Vertragstext: Major/Minor sind Vorschlaege, keine Bewertung (assessment_contract.severity). */
export const ISO_SEVERITY_RULE = "Absent/Partial values are starting suggestions only. Unknown or non-applicable scope yields no grade. Systemic failure or serious doubt about intended results requires escalation even when Partial is selected.";

/**
 * Vertragstext: Auswahlbegruendung VOR der Bewertung
 * (assessment_contract.control_selection_record).
 *
 * K1: Bei einer aus Annex A abgeleiteten Umsetzung ist zuerst festzuhalten,
 * WARUM sie gewaehlt wurde, welche Pflichten gelten und ob eine gleichwertige
 * Alternative vorliegt. Eine technische Vorgabe aus dem NIS2-Durchfuehrungsakt
 * wird durch eine ISO-Zuordnung nicht allgemeinverbindlich.
 */
export const ISO_CONTROL_SELECTION_RULE = "Before grading an Annex-derived implementation, record its selection rationale, applicable obligations and any equivalent alternative. A CIR-derived technical prescription is not made universal by an ISO mapping. Evaluate the standard requirement separately without falsifying the literal control implementation answer.";

/** Vertragstext: Annex A wird ueber Risikobehandlung, Pflichten und SoA bewertet (assessment_contract.annex_selection). */
export const ISO_ANNEX_SELECTION_RULE = "Annex A is evaluated through risk treatment, applicable obligations and the SoA. Alternative necessary controls are allowed and recorded. No automatic failure for not using a particular product.";

/** Vertragstext: fehlendes Ereignis hebt Vorbereitungspflichten nicht auf (assessment_contract.no_event_readiness). */
export const ISO_NO_EVENT_READINESS = "Absence of an event does not exclude an applicable readiness outcome or mandatory ISMS requirement. Keep actual execution/effectiveness observation separate; reuse verified coverage without duplicate assessment and without automatic conformity.";

const CRITERIA: Record<string, { criteria: string; controlIds: string[]; mappingType: string }> = {
  "4.1": { criteria: "Consider issues affecting ISMS results, not only technical threats or a physical-site assessment.", controlIds: ["ISO-CONTEXT", "ISO-CLIMATE"], mappingType: "contributes_to_requirement" },
  "4.2": { criteria: "Determine relevant parties, requirements and which requirements are addressed through the ISMS.", controlIds: ["ISO-PARTIES-ID", "ISO-PARTIES-REQUIREMENTS", "ISO-CLIMATE"], mappingType: "contributes_to_requirement" },
  "4.3": { criteria: "A NIS2 entity classification is not an ISMS scope statement.", controlIds: ["ISO-SCOPE"], mappingType: "contributes_to_requirement" },
  "4.4": { criteria: "Demonstrate an established, maintained and improving system of interacting processes.", controlIds: ["ISO-PROCESS-DESIGN", "ISO-PROCESS-OPERATION"], mappingType: "contributes_to_requirement" },
  "5.1": { criteria: "Confirm top-management commitment, strategic compatibility, integration, support and intended results across the ISMS. Use existing oversight reports; do not require duplicate reports.", controlIds: ["C22.1", "C22.2", "C23.1", "C23.2", "ISO-PROCESS-OPERATION", "ISO-LEADERSHIP-ALIGNMENT", "ISO-LEADERSHIP-SUPPORT"], mappingType: "contributes_to_requirement" },
  "5.2": { criteria: "Check policy suitability, objective framework and commitments to applicable requirements and continual improvement; check documentation, communication and appropriate availability.", controlIds: ["C29.2", "C29.3", "C22.1", "ISO-POLICY-COMMITMENTS"], mappingType: "contributes_to_requirement" },
  "5.3": { criteria: "Identify authority for ISMS conformity and performance reporting, not merely NIS2 legal representation.", controlIds: ["C27.2", "C27.4", "ISO-ROLES"], mappingType: "contributes_to_requirement" },
  "6.1.1": { criteria: "Address management-system risks and opportunities without duplicating the operational risk register.", controlIds: ["ISO-ISMS-RISKS-OPPORTUNITIES", "ISO-ISMS-ACTIONS", "ISO-ISMS-ACTION-EFFECTIVENESS"], mappingType: "contributes_to_requirement" },
  "6.1.2": { criteria: "Verify consistent valid comparable assessments, risk criteria, owners, CIA impacts, realistic likelihood and prioritisation; retain method records.", controlIds: ["C29.1", "C30.4", "C30.1", "ISO-RISK-PRIORITY", "ISO-RISK-OWNER"], mappingType: "contributes_to_requirement" },
  "6.1.3": { criteria: "Verify chosen treatment, all necessary controls, comparison with Annex A, SoA, treatment plan and risk-owner approvals; management-only acceptance is insufficient if it omits the accountable risk owner.", controlIds: ["C30.2", "C30.3", "C30.5", "ISO-ANNEX-COMPARISON", "ISO-SOA-INCLUSIONS", "ISO-SOA-EXCLUSIONS", "ISO-SOA-STATUS", "ISO-TREATMENT-PLAN-APPROVAL", "ISO-RESIDUAL-ACCEPTANCE"], mappingType: "contributes_to_requirement" },
  "6.2": { criteria: "Check relevant objectives, monitoring, communication, updates and plans stating actions, resources, responsibility, timing and evaluation.", controlIds: ["ISO-OBJECTIVES-DEFINED", "ISO-OBJECTIVE-PLANS", "ISO-OBJECTIVE-REVIEW"], mappingType: "contributes_to_requirement" },
  "6.3": { criteria: "Planned changes concern the ISMS itself; technical change tickets alone are insufficient.", controlIds: ["ISO-ISMS-CHANGE-PLAN", "ISO-MR-FOLLOW-UP"], mappingType: "contributes_to_requirement" },
  "7.1": { criteria: "Check resources for the complete ISMS scope, not only operational IT safeguards.", controlIds: ["C22.2"], mappingType: "contributes_to_requirement" },
  "7.2": { criteria: "Assess all people whose work affects information security performance. C40.6 and TRN-07 supply competence needs; ISO-COMPETENCE-ACTIONS covers acquisition and effectiveness beyond training; retain competence evidence.", controlIds: ["C40.6", "TRN-07", "TRN-03", "TRN-05", "ISO-COMPETENCE-ACTIONS", "ISO-AUDITOR-SELECTION"], mappingType: "contributes_to_requirement" },
  "7.3": { criteria: "Personnel understand relevant policy, their contribution and implications of nonconformity; training attendance alone does not prove awareness.", controlIds: ["C29.3", "TRN-04", "TRN-02", "TRN-03", "ISO-ISMS-AWARENESS"], mappingType: "contributes_to_requirement" },
  "7.4": { criteria: "Define communication topics, timing, recipients and methods.", controlIds: ["ISO-COMMUNICATION"], mappingType: "contributes_to_requirement" },
  "7.5.1": { criteria: "Identify required and necessary documented information; format and amount depend on the organisation.", controlIds: ["C29.5", "ISO-DOCUMENT-NEEDS"], mappingType: "contributes_to_requirement" },
  "7.5.2": { criteria: "Check identification, description, format, media and suitability/adequacy review and approval.", controlIds: ["C29.5", "ISO-DOCUMENT-RELEASE"], mappingType: "contributes_to_requirement" },
  "7.5.3": { criteria: "Check availability, protection, distribution, access, retrieval, storage, legibility, change control, retention and disposition as applicable. C40.2 contributes only permission rules for documented information; verify document-specific scope and actual permissions. It does not independently establish distribution, preservation, version control or disposition. Use sampled document updates and relevant controlled points of use to verify that intended users can obtain the current approved information and that superseded controlled copies are withdrawn or otherwise protected against unintended operational use. Preserve required historical records with their status identifiable. Reuse C29.5, C40.2 and the document-control evidence; do not require a separate distribution register or deletion of every retained old version.", controlIds: ["C29.5", "C40.2", "ISO-EXTERNAL-DOCUMENTS", "ISO-RECORD-SAFEGUARDS", "ISO-RECORD-READABILITY"], mappingType: "contributes_to_requirement" },
  "8.1": { criteria: "Operating criteria and controls are implemented; retain evidence and control relevant externally provided processes, products and services.", controlIds: ["C51.5", "C53.2", "ISO-PROCESS-DESIGN", "ISO-PROCESS-OPERATION", "ISO-ISMS-CHANGE-PLAN", "ISO-ISMS-UNINTENDED-CHANGE"], mappingType: "contributes_to_requirement" },
  "8.2": { criteria: "Risk assessment actually occurs at planned intervals and when significant changes are proposed or occur, with retained results. Include proposed changes before implementation, not only reviews of changes that have already occurred. Reuse existing assessments, for example a proposed cloud-service introduction or critical architecture change, where they demonstrate the relevant ISMS scope, risk criteria, assessment timing and results. If no significant change was proposed or occurred in the period, assess the trigger arrangements and planned-interval assessments; do not invent a change case. C30.1/C30.6 contribute without changing their frozen NIS2 wording.", controlIds: ["C30.1", "C30.6"], mappingType: "contributes_to_requirement" },
  "8.3": { criteria: "Retain C30.5: its Evidence already requires implemented completion, not only dates or progress. Together with C30.2, verify actual plan implementation and retained treatment results over the full ISMS scope; a progress spreadsheet alone is insufficient.", controlIds: ["C30.5", "C30.2"], mappingType: "contributes_to_requirement" },
  "9.1": { criteria: "C37.1 covers security-measure assessment design; ISO-ISMS-MEASUREMENT-DESIGN covers additional ISMS process measurements. C37.2 and ISO-ISMS-PERFORMANCE test performance and conclusions. REC-METRIC is a selected metric, not a universal mandatory MTTR target.", controlIds: ["C37.1", "C37.2", "REC-METRIC", "ISO-OBJECTIVE-REVIEW", "ISO-ISMS-PERFORMANCE", "ISO-ISMS-MEASUREMENT-DESIGN"], mappingType: "contributes_to_requirement" },
  "9.2.1": { criteria: "Audit both organisational requirements and ISO 27001; include management-system requirements, not just Annex A.", controlIds: ["C37.4", "ISO-AUDIT-PLAN", "ISO-AUDIT-EXECUTION"], mappingType: "contributes_to_requirement" },
  "9.2.2": { criteria: "Programme considers process importance and previous audits; define criteria/scope, impartial auditors, reporting and retained records.", controlIds: ["ISO-AUDIT-PLAN", "ISO-AUDITOR-SELECTION", "ISO-AUDIT-EXECUTION", "ISO-AUDIT-REPORTING"], mappingType: "contributes_to_requirement" },
  "9.3.1": { criteria: "Top management performs planned reviews of suitability, adequacy and effectiveness.", controlIds: ["ISO-MR-CONDUCT"], mappingType: "contributes_to_requirement" },
  "9.3.2": { criteria: "Check all required input categories including previous actions, changes, performance trends, feedback, risks/treatment and improvements.", controlIds: ["ISO-MR-INPUTS", "ISO-MR-FOLLOW-UP"], mappingType: "contributes_to_requirement" },
  "9.3.3": { criteria: "Retain decisions on improvements and necessary ISMS changes.", controlIds: ["ISO-MR-DECISIONS"], mappingType: "contributes_to_requirement" },
  "10.1": { criteria: "Improvement is broader than closure of individual nonconformities.", controlIds: ["ISO-MR-FOLLOW-UP", "ISO-CONTINUAL-IMPROVEMENT"], mappingType: "contributes_to_requirement" },
  "10.2": { criteria: "For security-measure deficiencies reuse C47.1/C47.2. For other ISMS process nonconformities assess ISO-NC-CORRECTION and ISO-NC-EFFECTIVENESS, reusing an existing assessment where it already covers the same outcome, scope and period. For both populations, verify control and correction as applicable and dealing with actual consequences where consequences exist; fixing the underlying weakness alone does not demonstrate that its consequences were addressed. Reuse nonconformity, incident, recovery or corrective-action records where they demonstrate the response and result; assess only missing coverage, without inventing harm or requiring a separate document for every case. Cause, extent and recurrence-prevention outcomes apply without duplicating one underlying case. Where no relevant case occurred, assess response readiness; where no effectiveness result can yet be observed, record that limitation and any due follow-up without excluding clause 10.2 or automatically claiming effectiveness.", controlIds: ["C47.1", "C47.2", "ISO-NC-CAUSE", "ISO-NC-EXTENT", "ISO-NC-RECURRENCE", "ISO-NC-CORRECTION", "ISO-NC-EFFECTIVENESS"], mappingType: "contributes_to_requirement" },
  "A.5.1": { criteria: "Policy and appropriate topic policies are approved, published/communicated, acknowledged and reviewed; ISO does not impose one annual frequency for all policies.", controlIds: ["C29.2", "C22.1", "C29.3", "C29.4"], mappingType: "contributes_to_requirement" },
  "A.5.2": { criteria: "Allocate information security roles according to organisational needs.", controlIds: ["C27.4", "ISO-ROLES"], mappingType: "contributes_to_requirement" },
  "A.5.3": { criteria: "Separate conflicting duties and consider effective alternatives in small teams.", controlIds: ["C27.3"], mappingType: "contributes_to_requirement" },
  "A.5.4": { criteria: "Management requires and supports application of security policies and procedures by personnel.", controlIds: ["C23.2", "C29.3", "C22.2"], mappingType: "contributes_to_requirement" },
  "A.5.5": { criteria: "Maintain relevant contacts; NIS2 reporting can satisfy part of this where applicable.", controlIds: ["ISO-AUTHORITY-CONTACTS"], mappingType: "contributes_to_requirement" },
  "A.5.6": { criteria: "Maintain relevant specialist contacts; no universal paid membership requirement.", controlIds: ["ISO-SECURITY-FORUMS"], mappingType: "contributes_to_requirement" },
  "A.5.7": { criteria: "Collection supports, but does not replace, contextual analysis and actionable intelligence.", controlIds: ["D04-08", "ISO-THREAT-SOURCES", "ISO-THREAT-ANALYSIS"], mappingType: "contributes_to_requirement" },
  "A.5.8": { criteria: "Include relevant non-development projects; reuse acquisition/development records.", controlIds: ["D04-01", "D04-03", "ISO-PROJECT-RISKS", "ISO-PROJECT-REQUIREMENTS"], mappingType: "contributes_to_requirement" },
  "A.5.9": { criteria: "Use the shared service/asset inventory and ISO-INFORMATION-INVENTORY for information and associated non-ICT assets; identify owners and maintain relevant entries.", controlIds: ["C42.1", "C42.3", "C42.4", "ISO-INFORMATION-INVENTORY"], mappingType: "contributes_to_requirement" },
  "A.5.10": { criteria: "Document and apply acceptable-use and handling rules; do not mistake an asset register for a handling process.", controlIds: ["C42.5", "C29.3"], mappingType: "contributes_to_requirement" },
  "A.5.11": { criteria: "C40.12 and C52.8 cover termination; ISO-ASSET-CHANGE covers changed roles, employment, contracts and agreements that continue. Reuse inventory and access records; do not duplicate termination answers.", controlIds: ["C40.12", "C52.8", "ISO-ASSET-CHANGE"], mappingType: "contributes_to_requirement" },
  "A.5.12": { criteria: "INFO-CLASS supplies confidentiality; ISO-INFORMATION-IA supplies information integrity and availability; C42.2 supplies related asset protection needs. Reuse records only for the dimensions they actually establish.", controlIds: ["C42.2", "INFO-CLASS", "INFO-CLASS-REV", "ISO-INFORMATION-IA"], mappingType: "contributes_to_requirement" },
  "A.5.13": { criteria: "Labels follow the classification scheme; a specific label format is not universal.", controlIds: ["INFO-LABEL"], mappingType: "contributes_to_requirement" },
  "A.5.14": { criteria: "Protect relevant electronic, physical and verbal transfer; rules/procedures/agreements are tailored to transfer type.", controlIds: ["C42.6", "C42.9", "C41.2", "C41.5", "DATA-OUTFLOW"], mappingType: "contributes_to_requirement" },
  "A.5.15": { criteria: "Logical and physical access rules reflect business and information security needs. Assess security-relevant coordination between the access arrangements present in scope under ISO-ACCESS-COORDINATION. Different rights may be justified; neither all three access layers nor one combined policy is required. Reuse established interface evidence rather than rescore the individual access decisions.", controlIds: ["C40.2", "C46.1", "ISO-ACCESS-COORDINATION"], mappingType: "contributes_to_requirement" },
  "A.5.16": { criteria: "Cover human and non-human identity lifecycle; shared identities require justified accountability safeguards.", controlIds: ["C40.10", "C40.11"], mappingType: "contributes_to_requirement" },
  "A.5.17": { criteria: "Control allocation, delivery, use and compromise handling of authentication information; no universal calendar password-change rule is inferred from ISO. A password manager is a risk-selected implementation, not a universally prescribed product.", controlIds: ["C41.6", "C41.11", "C41.13", "C41.7", "C41.14", "TRN-AUTH"], mappingType: "contributes_to_requirement" },
  "A.5.18": { criteria: "Provision, review, modify and remove access rights. ACCESS-RECERT is reused for ordinary and service-account reviews; C43.1 handles privileged reviews. SUP-ACCESS-WINDOW is a risk-selected provider-connection safeguard, not a universal ISO connection duration.", controlIds: ["C40.3", "C43.1", "ACCESS-RECERT", "SUP-ACCESS-WINDOW", "ISO-EMERGENCY-AUTHORISATION"], mappingType: "contributes_to_requirement" },
  "A.5.19": { criteria: "Identify and manage risks from supplier products and services; this is not limited to outsourced IT. Verify relevant supplier-personnel competence where security responsibilities require it.", controlIds: ["C51.5", "C51.1", "C51.2", "C51.3", "C51.4", "C49.4", "C49.2", "C49.1", "SUP-LOC", "C52.4"], mappingType: "contributes_to_requirement" },
  "A.5.20": { criteria: "Agreements address relevant information security needs for each relationship, including relevant legal and exit terms. Supplier screening is assessed only where lawful, justified requirements apply.", controlIds: ["C52.1", "SUP-RESP", "C52.3", "C52.8", "C52.5"], mappingType: "contributes_to_requirement" },
  "A.5.21": { criteria: "Manage ICT supply-chain risks and relevant downstream dependencies, not only the direct supplier certificate.", controlIds: ["C49.2", "C52.7", "SUP-AUTH", "D04-10", "D04-12"], mappingType: "contributes_to_requirement" },
  "A.5.22": { criteria: "C53.2 already requires reassessment for significant changes, changed-risk evaluation and tracked safeguards. C53.1 validates assurance; C52.7 covers subcontracting conditions. Examine actual changed-service decisions rather than requiring a duplicate supplier review.", controlIds: ["C53.1", "C53.2", "C52.7"], mappingType: "contributes_to_requirement" },
  "A.5.23": { criteria: "Applies to use of cloud services, including SaaS; cloud customer status is different from NIS2 CIR provider scope.", controlIds: ["SUP-RESP", "SUP-LOC", "C39.3", "C52.8", "SUP-EXIT-TEST", "ISO-CLOUD-LIFECYCLE"], mappingType: "contributes_to_requirement" },
  "A.5.24": { criteria: "Define and communicate incident processes, responsibilities and readiness.", controlIds: ["D02-12", "D02-05", "D02-18", "D02-19", "D02-14", "IR-TIME"], mappingType: "contributes_to_requirement" },
  "A.5.25": { criteria: "Assess events and determine incident categorisation and priority as facts develop.", controlIds: ["D02-03", "D02-04", "D02-15"], mappingType: "contributes_to_requirement" },
  "A.5.26": { criteria: "Respond using documented procedures, including controlled recovery; not the statutory NIS2 notification clock.", controlIds: ["D02-07", "D02-08", "D02-09", "D02-16", "IR-TIME"], mappingType: "contributes_to_requirement" },
  "A.5.27": { criteria: "Use lessons to implement improvements, not merely write a post-incident report.", controlIds: ["D02-10", "D02-11", "D02-19"], mappingType: "contributes_to_requirement" },
  "A.5.28": { criteria: "Preserve identifiable, traceable and protected evidence through collection and handling.", controlIds: ["D02-17"], mappingType: "contributes_to_requirement" },
  "A.5.29": { criteria: "Maintain appropriate information security during disruption, including emergency workarounds. Reuse crisis decisions and secure emergency communication where these support the selected disruption arrangements.", controlIds: ["C32.7", "C32.4", "C41.3"], mappingType: "contributes_to_requirement" },
  "A.5.30": { criteria: "Plan, implement, maintain and test ICT readiness against business continuity needs; backup success alone is insufficient. Crisis exercises contribute where they test the relevant ICT readiness and decisions, not every non-security crisis scenario.", controlIds: ["BC-BIA", "BC-RTO", "C32.1", "C32.3", "C32.6", "C33.3", "C33.4", "C32.8", "TRN-BCDR"], mappingType: "contributes_to_requirement" },
  "A.5.31": { criteria: "Identify all relevant information security obligations, not only NIS2.", controlIds: ["ISO-LEGAL-REQUIREMENTS", "ISO-LEGAL-COMPLIANCE"], mappingType: "contributes_to_requirement" },
  "A.5.32": { criteria: "Licensing and rights are distinct from software security approval.", controlIds: ["ISO-IP-ENTITLEMENTS", "ISO-IP-USAGE"], mappingType: "contributes_to_requirement" },
  "A.5.33": { criteria: "Protect records throughout retention, preservation and authorised disposal.", controlIds: ["C29.5", "DATA-DELETE", "ISO-RECORD-RETENTION", "ISO-RECORD-SAFEGUARDS", "ISO-RECORD-READABILITY"], mappingType: "contributes_to_requirement" },
  "A.5.34": { criteria: "Assess applicable PII requirements for the ISMS processing scope; NIS2-purpose processing is only a subset.", controlIds: ["ISO-PRIVACY-IMPLEMENTATION", "ISO-PRIVACY-RESPONSIBILITIES"], mappingType: "contributes_to_requirement" },
  "A.5.35": { criteria: "C37.4 supplies planned independent reviews; ISO-REVIEW-CHANGE makes significant-change review explicit outside CIR-only timing. Reuse the same review when its scope and timing meet both outcomes.", controlIds: ["C37.4", "ISO-REVIEW-CHANGE"], mappingType: "contributes_to_requirement" },
  "A.5.36": { criteria: "Regularly review policy/rule compliance and act on deviations.", controlIds: ["C37.3", "C47.1", "C47.2", "ISO-LEGAL-COMPLIANCE"], mappingType: "contributes_to_requirement" },
  "A.5.37": { criteria: "Usable operating instructions must reach those who need them; reuse existing runbooks and supplier security-configuration instructions.", controlIds: ["D04-11", "ISO-OPERATING-PROCEDURES"], mappingType: "contributes_to_requirement" },
  "A.6.1": { criteria: "C40.7 supplies sensitive-role checks; ISO-SCREENING-ENTRY, ISO-SCREENING-ONGOING explicitly covers the remaining recruitment population and ongoing proportionate verification.", controlIds: ["C40.7", "ISO-SCREENING-ENTRY", "ISO-SCREENING-ONGOING"], mappingType: "contributes_to_requirement" },
  "A.6.2": { criteria: "C40.1 tests personnel commitments; ISO-EMPLOYER-DUTIES adds the organisation's responsibilities in employment terms.", controlIds: ["C40.1", "ISO-EMPLOYER-DUTIES"], mappingType: "contributes_to_requirement" },
  "A.6.3": { criteria: "Relevant personnel and interested parties receive appropriate awareness/training and updates; topic courses reuse the same records.", controlIds: ["TRN-07", "TRN-04", "TRN-02", "TRN-03", "TRN-09", "TRN-05", "TRN-06", "TRN-DATA", "TRN-AUTH", "TRN-REMOTE", "D02-14", "TRN-BCDR", "TRN-12", "TRN-PHY"], mappingType: "contributes_to_requirement" },
  "A.6.4": { criteria: "Communicate and operate a fair, formalised disciplinary process.", controlIds: ["C40.9"], mappingType: "contributes_to_requirement" },
  "A.6.5": { criteria: "Continuing duties after a role or employment change are defined and communicated.", controlIds: ["C40.8"], mappingType: "contributes_to_requirement" },
  "A.6.6": { criteria: "Suitable documented signed confidentiality terms cover relevant personnel and parties and are reviewed.", controlIds: ["C40.1", "ISO-NDA-TERMS", "ISO-NDA-COVERAGE"], mappingType: "contributes_to_requirement" },
  "A.6.7": { criteria: "Remote work includes physical surroundings, information handling and device protection, not just a VPN.", controlIds: ["ASSET-OFFSITE", "C40.5", "TRN-REMOTE", "MEDIA-UNATTENDED", "DEVICE-LOCK"], mappingType: "contributes_to_requirement" },
  "A.6.8": { criteria: "Staff can report observed or suspected events promptly through suitable internal routes.", controlIds: ["D02-13", "D02-14"], mappingType: "contributes_to_requirement" },
  "A.7.1": { criteria: "Use PHY-ZONE for equipment areas and ISO-OTHER-AREA-PERIMETERS for other sensitive areas; C46.1 covers entry permissions.", controlIds: ["PHY-ZONE", "C46.1", "ISO-OTHER-AREA-PERIMETERS"], mappingType: "contributes_to_requirement" },
  "A.7.2": { criteria: "Include visitors and relevant delivery/access points; biometrics and cameras are not universal prerequisites. Entry-control tests verify operation, not a second access-permission approval.", controlIds: ["C46.1", "PHY-ENTRY-LOG", "PHY-ACCESS-TEST"], mappingType: "contributes_to_requirement" },
  "A.7.3": { criteria: "Use existing equipment-area safeguards and ISO-OTHER-FACILITY-EXPOSURE, ISO-OTHER-FACILITY-HAZARDS for other relevant offices and facilities.", controlIds: ["PHY-SITING", "C46.1", "C46.2", "ISO-OTHER-FACILITY-EXPOSURE", "ISO-OTHER-FACILITY-HAZARDS"], mappingType: "contributes_to_requirement" },
  "A.7.4": { criteria: "C46.4 already addresses relevant premises, including access detection and response outside working hours. Assess continuous risk-appropriate coverage within the ISMS scope; do not add a duplicate monitoring control or require cameras everywhere.", controlIds: ["C46.4", "PHY-ENTRY-LOG"], mappingType: "contributes_to_requirement" },
  "A.7.5": { criteria: "Design and implement protection against relevant physical and environmental threats.", controlIds: ["ENV-RISK", "C46.2", "PHY-CLIMATE", "C46.5", "ISO-OTHER-FACILITY-HAZARDS"], mappingType: "contributes_to_requirement" },
  "A.7.6": { criteria: "Use PHY-WORK for equipment areas and ISO-OTHER-SECURE-AREA-WORK for other secure areas; training records can be shared.", controlIds: ["PHY-WORK", "TRN-PHY", "ISO-OTHER-SECURE-AREA-WORK"], mappingType: "contributes_to_requirement" },
  "A.7.7": { criteria: "Cover papers, media and screens; include sensitive printed/displayed information and unattended equipment as relevant.", controlIds: ["MEDIA-UNATTENDED", "DEVICE-LOCK", "C41.9", "ISO-DISPLAY-CLEARING"], mappingType: "contributes_to_requirement" },
  "A.7.8": { criteria: "Use PHY-SITING for ICT installations and ISO-OTHER-EQUIPMENT-PROTECTION for other relevant information-related equipment; do not duplicate a physical inspection.", controlIds: ["PHY-SITING", "C46.2", "PHY-TAMPER-CHECK", "ISO-OTHER-EQUIPMENT-PROTECTION"], mappingType: "contributes_to_requirement" },
  "A.7.9": { criteria: "Apply suitable off-premises protection; location tracking is not universal.", controlIds: ["ASSET-OFFSITE", "TRN-REMOTE"], mappingType: "contributes_to_requirement" },
  "A.7.10": { criteria: "Manage storage media from acquisition to use, transport and disposal according to classification.", controlIds: ["C42.7", "C42.8", "C42.9", "C40.4", "TRN-DATA"], mappingType: "contributes_to_requirement" },
  "A.7.11": { criteria: "Protect against supporting-utility disruption using appropriate capacity, maintenance and alerting.", controlIds: ["C46.3", "C46.6", "C46.5", "PHY-CLIMATE"], mappingType: "contributes_to_requirement" },
  "A.7.12": { criteria: "Protect relevant power and communications cables from interception, interference and damage.", controlIds: ["C46.7"], mappingType: "contributes_to_requirement" },
  "A.7.13": { criteria: "Preserve confidentiality, integrity and availability through authorised equipment maintenance.", controlIds: ["PHY-MAINT", "PHY-RETURN"], mappingType: "contributes_to_requirement" },
  "A.7.14": { criteria: "C40.4 tests sensitive-data removal; ISO-IP-DISPOSAL tests licensed-software removal or secure overwrite before disposal or reuse. Licence entitlement and usage checks are separate A.5.32 outcomes.", controlIds: ["C40.4", "ISO-IP-DISPOSAL"], mappingType: "contributes_to_requirement" },
  "A.8.1": { criteria: "Protect all relevant user endpoints, both on-site and remote; technical detail is risk-selected.", controlIds: ["C42.1", "C38.3", "C28.1", "C40.2", "DEVICE-LOCK", "ASSET-OFFSITE"], mappingType: "contributes_to_requirement" },
  "A.8.2": { criteria: "Allocate and restrict privileged access; check actual use and temporary exceptions.", controlIds: ["C43.1", "C43.2", "C43.3", "C43.4", "ISO-EMERGENCY-AUTHORISATION", "ISO-EMERGENCY-REVIEW"], mappingType: "contributes_to_requirement" },
  "A.8.3": { criteria: "Enforce information-access restrictions beyond the login screen.", controlIds: ["C40.2", "C40.3", "C41.12"], mappingType: "contributes_to_requirement" },
  "A.8.4": { criteria: "Control reading and modification of source and development resources; code-write protection alone is insufficient.", controlIds: ["D04-16", "D04-18", "ISO-SOURCE-READ"], mappingType: "contributes_to_requirement" },
  "A.8.5": { criteria: "Select secure authentication appropriate to access restrictions; CIR-specific blocking/reset requirements are not automatically ISO requirements.", controlIds: ["C41.1", "C41.6", "C41.11", "C41.9", "C41.7", "C41.13", "C41.10", "C41.12", "ISO-LOGIN-ATTEMPTS"], mappingType: "contributes_to_requirement" },
  "A.8.6": { criteria: "Monitor and adjust capacity for present and expected needs.", controlIds: ["SYS-CAP"], mappingType: "contributes_to_requirement" },
  "A.8.7": { criteria: "Maintain appropriate malware protection and user awareness; not every system can run the same anti-malware product.", controlIds: ["C28.1", "C42.8", "TRN-04", "D02-07", "D02-08", "ISO-MALWARE-COVERAGE"], mappingType: "contributes_to_requirement" },
  "A.8.8": { criteria: "Obtain vulnerability information, assess exposure and take appropriate timely action. Unsupported systems require a justified implemented treatment, not an assumed automatic replacement of every asset.", controlIds: ["D04-08", "D04-25", "D04-26", "D04-27", "D04-28", "D04-31", "D04-30", "D04-32", "D04-35", "D04-36", "D04-34", "D04-13"], mappingType: "contributes_to_requirement" },
  "A.8.9": { criteria: "Establish, document, implement, monitor and review configurations, including justified deviations.", controlIds: ["C38.3", "D04-05", "CHG-AUTH", "C38.5"], mappingType: "contributes_to_requirement" },
  "A.8.10": { criteria: "Delete information when no longer required, subject to legitimate retention/preservation requirements.", controlIds: ["DATA-DELETE", "C40.4"], mappingType: "contributes_to_requirement" },
  "A.8.11": { criteria: "Use appropriate masking consistent with access needs and applicable requirements; masking is not automatically anonymisation.", controlIds: ["DATA-MASK", "D04-22"], mappingType: "contributes_to_requirement" },
  "A.8.12": { criteria: "Apply justified leakage prevention across relevant channels; no named DLP product is mandated.", controlIds: ["DATA-OUTFLOW"], mappingType: "contributes_to_requirement" },
  "A.8.13": { criteria: "Maintain backups and test restoration against recovery needs.", controlIds: ["BC-RPO", "C32.2", "C33.2", "C32.5", "C33.1"], mappingType: "contributes_to_requirement" },
  "A.8.14": { criteria: "Implement sufficient redundancy for availability needs; not universal duplication of every system. Logging redundancy is an implementation candidate where availability needs justify it, not a universal ISO prescription.", controlIds: ["C32.6", "C33.4", "C44.7"], mappingType: "contributes_to_requirement" },
  "A.8.15": { criteria: "Generate, store, protect and analyse relevant records; a stated retention period alone is not implementation.", controlIds: ["LOG-RET-DEF", "C44.1", "C44.2", "C44.3", "C44.4", "LOG-PRIV", "C44.5"], mappingType: "contributes_to_requirement" },
  "A.8.16": { criteria: "Operate risk-appropriate anomaly detection and response; SIEM/IDS/IPS products are examples, not universal requirements. Independent monitoring availability checks are risk-selected supporting implementation.", controlIds: ["MON-RISK", "MON-BASE", "D02-01", "D02-02", "C44.5", "C44.8"], mappingType: "contributes_to_requirement" },
  "A.8.17": { criteria: "Synchronise relevant clocks to approved sources; no mandatory in-house NTP server.", controlIds: ["C44.6"], mappingType: "contributes_to_requirement" },
  "A.8.18": { criteria: "Restrict and control utilities capable of overriding system/application safeguards.", controlIds: ["C43.4", "LOG-PRIV"], mappingType: "contributes_to_requirement" },
  "A.8.19": { criteria: "Manage operational software installation securely, including authorisation and traceability.", controlIds: ["C28.1", "CHG-AUTH", "D04-05"], mappingType: "contributes_to_requirement" },
  "A.8.20": { criteria: "Protect and manage networks/devices with risk-appropriate controls; not a requirement for a particular firewall brand.", controlIds: ["C38.5", "C38.3", "NET-FILTER", "C38.6", "WIFI-AUTH", "C38.13", "C38.9"], mappingType: "contributes_to_requirement" },
  "A.8.21": { criteria: "Identify, implement and monitor network-service security mechanisms, levels and management requirements, including internally provided services.", controlIds: ["C52.1", "C53.2", "C40.5", "C41.5", "SUP-ACCESS-WINDOW", "ISO-NETWORK-SERVICE-REQUIREMENTS", "ISO-NETWORK-SERVICE-ASSURANCE"], mappingType: "contributes_to_requirement" },
  "A.8.22": { criteria: "Segregate service/user/system groups according to security needs and validate permitted cross-zone flows. A DMZ is a risk-selected design option, not required for every ISO scope.", controlIds: ["C38.4", "C38.10", "C38.11", "WIFI-SEG", "C38.12"], mappingType: "contributes_to_requirement" },
  "A.8.23": { criteria: "Manage external website access to reduce malicious content; network port filtering alone is not sufficient evidence.", controlIds: ["ISO-WEB-RULES", "ISO-WEB-ENFORCEMENT"], mappingType: "contributes_to_requirement" },
  "A.8.24": { criteria: "Define and implement appropriate cryptography and key management.", controlIds: ["C39.1", "CRYPTO-INV", "C39.3", "C39.2", "C39.4"], mappingType: "contributes_to_requirement" },
  "A.8.25": { criteria: "Secure development rules cover the lifecycle and are applied; development outsourcing does not remove responsibility.", controlIds: ["D04-04", "D04-17"], mappingType: "contributes_to_requirement" },
  "A.8.26": { criteria: "Define and approve security requirements for development or acquisition, including applicable legal and business needs.", controlIds: ["D04-01", "D04-02", "D04-03"], mappingType: "contributes_to_requirement" },
  "A.8.27": { criteria: "Apply documented secure-engineering principles to system development.", controlIds: ["D04-14", "D04-02"], mappingType: "contributes_to_requirement" },
  "A.8.28": { criteria: "Apply secure coding and protect build/development secrets; method choice is risk-based.", controlIds: ["D04-15", "D04-18"], mappingType: "contributes_to_requirement" },
  "A.8.29": { criteria: "Perform development/acceptance security testing and evaluate results before release.", controlIds: ["D04-19", "D04-03"], mappingType: "contributes_to_requirement" },
  "A.8.30": { criteria: "Direct, monitor and review outsourced development; escrow is not universally required. For outsourced development deliveries, reuse the delivered-version security acceptance decision and supporting evidence under D04-03, together with applicable D04-19 tests and D04-23 supplier requirements. Assess component and release information under the existing controls where relevant to the agreed requirements and risks. Supplier assessment or a signed contract alone is not delivery acceptance; no universal full-source-code review or particular testing technique is imposed.", controlIds: ["D04-23", "D04-19", "C49.2", "C52.1", "C53.2"], mappingType: "contributes_to_requirement" },
  "A.8.31": { criteria: "Separate and secure development, test and production, with appropriate access controls. Where production information is used in testing, assess the authorised purpose and relevant transfer and access permissions, together with the test-data selection, sanitisation and lifecycle safeguards in D04-20, D04-21 and D04-22. For non-development tests, use ISO-TEST-SELECTION and ISO-TEST-PROTECTION. Reuse the same dataset and transfer evidence; environment separation alone does not establish test-data protection, and identical production and test permissions are not required.", controlIds: ["C38.11", "D04-16", "C40.3"], mappingType: "contributes_to_requirement" },
  "A.8.32": { criteria: "Assess, authorise, test, record and review changes, including controlled emergencies.", controlIds: ["D04-06", "CHG-ROLLBACK", "D04-07", "CHG-AUTH", "D04-05", "D04-24"], mappingType: "contributes_to_requirement" },
  "A.8.33": { criteria: "Development testing uses D04-20/21/22; ISO-TEST-SELECTION and ISO-TEST-PROTECTION cover testing outside that gate. Identical test and production permissions are not required.", controlIds: ["D04-20", "D04-21", "D04-22", "ISO-TEST-SELECTION", "ISO-TEST-PROTECTION"], mappingType: "contributes_to_requirement" },
  "A.8.34": { criteria: "Agree scope, access, timing and protective arrangements for tests on operational systems; an audit calendar alone is insufficient. Apply these protective arrangements to relevant audit tests and other assurance activities involving operational systems, not only technical security testing. Check agreed responsibilities, necessary access, timing and measures appropriate to protect operations and information. Use C37.5 evidence for the technical-test population it covers; do not treat it as proof for an unrelated assurance activity. A calendar or generic audit plan alone is insufficient.", controlIds: ["C37.5"], mappingType: "contributes_to_requirement" },
};

/** Anzahl der Anforderungen mit Pruefkriterien - Sollwert 123. */
export const ISO_AUDIT_CRITERIA_COUNT = Object.keys(CRITERIA).length;

/** Pruefkriterien einer Referenz ("8.2", "A.5.23"); undefined = keine hinterlegt. */
export function isoAuditCriterion(ref: string): IsoAuditCriterion | undefined {
  const e = CRITERIA[ref];
  return e ? { ref, ...e } : undefined;
}

/** Alle Referenzen mit Pruefkriterien, in Katalogreihenfolge. */
export function isoAuditCriteriaRefs(): string[] {
  return Object.keys(CRITERIA);
}

/**
 * Pruefkriterien ALLER Referenzen, zu denen eine Kontrolle beitraegt.
 *
 * Eine Kontrolle kann mehrere Anforderungen bedienen (z. B. c29.5 → 7.5.1,
 * 7.5.2, 7.5.3, A.5.33). Der Pruefer muss die Kriterien jeder dieser
 * Anforderungen sehen, sonst bewertet er die Kontrolle nur gegen eine davon.
 */
export function isoAuditCriteriaForControl(id: string): IsoAuditCriterion[] {
  const out: IsoAuditCriterion[] = [];
  for (const ref of isoRefsAll(id)) {
    const c = isoAuditCriterion(ref);
    if (c) out.push(c);
  }
  return out;
}
