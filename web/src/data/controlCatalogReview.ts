/**
 * Control Catalog Review Overlay — generated from
 * UniqSuite-Risk-Control-Review-FINAL-v2.xlsx (review date 2026-06-12).
 *
 * 3-pass verified scope decision. Consumed by controlCatalog.ts at module
 * load time to:
 *   - remove out-of-scope controls (and their risks)
 *   - remove duplicate / non-infosec risks
 *   - revise risk text where the review supplied new wording
 *
 * Cross-control additions and measure un-mappings are exported separately
 * for engines that need explainable per-risk mitigation graphs without
 * mutating the base catalog shape.
 *
 * DO NOT EDIT BY HAND — regenerate via scripts/apply_catalog_review.ts.
 */

export interface RevisedRisk {
  risk_id: string;
  new_title_en?: string | null;
  new_description_en?: string | null;
  new_title_de?: string | null;
  new_description_de?: string | null;
  note: string;
}

export interface CrossMapAddition {
  risk_id: string;
  control_id: string;
  rationale: string;
}

export interface MeasureUnmapping {
  risk_id: string;
  measure_id: string;
  rationale: string;
}
export const reviewRemovedControls: { control_id: string; reason: string }[] = [
];
export const reviewRemovedRisks: { risk_id: string; reason: string }[] = [
  {
    "risk_id": "org-03-r3",
    "reason": "Remove org-03-r3 from the catalog — Pass-3 consistency ruling: impact restatement of org-03-r2 (same cause, adds fines/reputation only)."
  },
  {
    "risk_id": "gov-01-r3",
    "reason": "Remove gov-01-r3 from the catalog — Pass-3 consistency ruling: impact restatement of gov-01-r1 sibling (reputational consequence of same cause)."
  },
  {
    "risk_id": "a-07-r2",
    "reason": "Remove a-07-r2 from the catalog — Primarily an efficiency/cost risk (over-classification); recognized in classification practice. CIA 'A' link is indirect (slowed processes);"
  },
  {
    "risk_id": "org-08-r2",
    "reason": "Remove org-08-r2 from the catalog — Primarily a project cost/schedule risk, security-relevant via late security integration; consequence articulated. CIA 'A' tag is a stretch; "
  },
  {
    "risk_id": "org-10-r2",
    "reason": "Remove org-10-r2 from the catalog — Coherent but primarily a financial/asset-loss risk; information-security relevance and CIA 'A' tag are thin. Acceptable within product desig"
  },
  {
    "risk_id": "g-04-r2",
    "reason": "Remove g-04-r2 from the catalog — Pass-3 consistency ruling: exact-title cross-control duplicate of i-03-r1 (same scenario and abstraction); retain the ri Keep i-03-r1 instead."
  },
  {
    "risk_id": "d-02-r1",
    "reason": "Remove d-02-r1 from the catalog — Pass-3 consistency ruling: exact-title cross-control duplicate of d-05-r1 (same scenario and abstraction); retain the ri Keep d-05-r1 instead."
  },
  {
    "risk_id": "d-05-r3",
    "reason": "Remove d-05-r3 from the catalog — Pass-3 consistency ruling: exact-title cross-control duplicate of d-02-r3 (same scenario and abstraction); retain the ri Keep d-02-r3 instead."
  },
  {
    "risk_id": "d-12-r3",
    "reason": "Remove d-12-r3 from the catalog — Pass-3 consistency ruling: impact restatement of d-12-r1 (crisis-communication consequence of same outage cause)."
  },
  {
    "risk_id": "d-13-r3",
    "reason": "Remove this risk and fold the cost/operational consequence into d-13-r1's impact rationale; the identical measure set confirms there is no separate mitigation need."
  },
  {
    "risk_id": "b-01-r2",
    "reason": "Remove b-01-r2 from the catalog — Pass-3 consistency ruling: exact-title cross-control duplicate of b-03-r2 (same scenario and abstraction); retain the ri Keep b-03-r2 instead."
  },
  {
    "risk_id": "b-08-r3",
    "reason": "Remove this risk and fold the reputational dimension into b-08-r1's impact rating; the b-08 measures themselves are appropriate for r1/r2."
  },
  {
    "risk_id": "c-06-r2",
    "reason": "Remove c-06-r2 from the catalog — Pass-3 consistency ruling: impact restatement of c-06-r1 sibling (same cause, cost/duration impact)."
  },
  {
    "risk_id": "c-07-r3",
    "reason": "Remove c-07-r3 from the catalog — Pass-3 consistency ruling: impact restatement of c-07-r1 (reputational consequence of same recovery failure)."
  },
  {
    "risk_id": "a-12-r1",
    "reason": "Remove a-12-r1 from the catalog — Pass-3 consistency ruling: exact-title cross-control duplicate of g-06-r1 (same scenario and abstraction); retain the ri Keep g-06-r1 instead."
  },
  {
    "risk_id": "ppl-03-r3",
    "reason": "Remove ppl-03-r3 from the catalog — Acceptable legal-enforceability risk with articulated consequence (uncompensated losses); borderline pure-legal but fits product design. 2x3"
  },
  {
    "risk_id": "g-07-r3",
    "reason": "Remove this risk and fold reputational impact into g-07-r1's impact rating; the measure mapping itself fits the underlying phishing cause."
  },
  {
    "risk_id": "aw-02-r2",
    "reason": "Remove the risk; if retained, the aw-02 measurement measures would address it, no mapping change needed."
  },
  {
    "risk_id": "phy-09-r3",
    "reason": "Remove phy-09-r3 from the catalog — Pass-3 consistency ruling: exact-title cross-control duplicate of phy-05-r4 (same scenario and abstraction); retain the  Keep phy-05-r4 instead."
  },
  {
    "risk_id": "i-08-r3",
    "reason": "Remove this risk and fold reputational impact into i-08-r1; mapping itself is fine but redundant."
  },
  {
    "risk_id": "h-06-r3",
    "reason": "Remove h-06-r3 from the catalog — Acceptable compliance risk, but it largely restates h-06-r1's legal impact; identical 4x5 scoring suggests duplicated assessment rather than"
  },
  {
    "risk_id": "e-09-r3",
    "reason": "Remove e-09-r3 from the catalog — Pass-3 consistency ruling: impact restatement of e-09-r1 (cost consequence of same vulnerability-handling gap)."
  },
  {
    "risk_id": "a-11-r2",
    "reason": "Remove and merge into a-11-r1; if retained, the existing measures map identically, so no mapping change is needed."
  },
  {
    "risk_id": "e-15-r3",
    "reason": "Remove this risk and merge its data-breach impact into e-15-r1; no separate mapping needed."
  },
  {
    "risk_id": "e-15-r4",
    "reason": "Remove; record reputation/customer-trust loss as an impact dimension of e-15-r1 instead of a standalone risk."
  },
  {
    "risk_id": "tech-13-r3",
    "reason": "Remove this risk; the capacity measures remain justified via tech-13-r1 and tech-13-r2."
  },
  {
    "risk_id": "tech-08-r2",
    "reason": "Remove this risk; its cause and mitigations are fully covered by tech-08-r1 with the same measure set. No mapping change needed elsewhere."
  },
  {
    "risk_id": "tech-08-r3",
    "reason": "Remove tech-08-r3 from the catalog — Pass-3 consistency ruling: impact restatement of tech-08-r1 (exposure-window consequence of same cause)."
  },
  {
    "risk_id": "c-05-r1",
    "reason": "Remove c-05-r1 from the catalog — Pass-3 consistency ruling: exact-title cross-control duplicate of c-02-r1 (same scenario and abstraction); retain the ri Keep c-02-r1 instead."
  },
  {
    "risk_id": "iam-mfa-3-r3",
    "reason": "Remove iam-mfa-3-r3 from the catalog — Pass-3 consistency ruling: impact restatement of iam-mfa-3-r1 (same credential-compromise cause)."
  },
  {
    "risk_id": "vul-8-r2",
    "reason": "Remove vul-8-r2 from the catalog — Pass-3 consistency ruling: impact restatement of vul-8-r1 (reputational consequence of same unpatched-vuln cause)."
  },
  {
    "risk_id": "sup-05-r3",
    "reason": "Remove the risk; market positioning is out of ISMS scope. If retained against advice, the existing measures are the relevant ones."
  },
  {
    "risk_id": "reg-01-r3",
    "reason": "Remove reg-01-r3 from the catalog — Acceptable but is a consequence-variant of reg-01-r1 (same root cause, reputational/liability impact). Tolerable under product design; consi"
  }
];
export const reviewRevisedRisks: RevisedRisk[] = [
  {
    "risk_id": "gov-02-r3",
    "new_title_en": null,
    "new_description_en": "Lack of transparency over security spending prevents the management body from steering and evidencing adequate NIS2 resource allocation (Art.20), leading to under-resourced security measures.",
    "new_title_de": null,
    "new_description_de": "Fehlende Transparenz über Sicherheitsausgaben verhindert, dass die Geschäftsleitung eine angemessene NIS2-Ressourcenzuweisung (Art. 20) steuern und nachweisen kann, was zu unzureichend ausgestatteten Sicherheitsmaßnahmen führt.",
    "note": "EN+DE revised description."
  },
  {
    "risk_id": "a-14-r3",
    "new_title_en": null,
    "new_description_en": "Undocumented/unmanaged risk acceptances leave management unaware of accumulated residual risk, causing uninformed decisions and audit findings on Art.21(2)(a) risk management.",
    "new_title_de": null,
    "new_description_de": "Nicht dokumentierte oder ungesteuerte Risikoakzeptanzen führen dazu, dass die Geschäftsleitung das kumulierte Restrisiko nicht kennt; dies führt zu uninformierten Entscheidungen und Auditfeststellungen zu Art. 21 Abs. 2 lit. a Risikomanagement.",
    "note": "EN+DE revised description."
  },
  {
    "risk_id": "org-15-r3",
    "new_title_en": "Erroneous Access Rights due to Manual Identity Processes",
    "new_description_en": "Manual, inconsistent identity and access management processes cause erroneous or delayed permission assignment and revocation, creating windows of unauthorized or missing access alongside avoidable administrative cost.",
    "new_title_de": "Fehlerhafte Zugriffsrechte durch manuelle Identitätsprozesse",
    "new_description_de": "Manuelle, inkonsistente Identitäts- und Zugriffsverwaltungsprozesse führen zu fehlerhafter oder verzögerter Vergabe und Entziehung von Berechtigungen und damit zu Phasen unberechtigter oder fehlender Zugriffe sowie vermeidbarem Verwaltungsaufwand.",
    "note": "EN+DE revised title and description."
  },
  {
    "risk_id": "g-03-r2",
    "new_title_en": "Access Rights Errors from Manual On-/Offboarding",
    "new_description_en": "Manual on-/offboarding causes erroneous rights assignment and delayed revocation, creating unauthorized-access windows and provisioning failures, in addition to administrative cost.",
    "new_title_de": "Fehlerhafte Zugriffsrechte durch manuelles On-/Offboarding",
    "new_description_de": "Manuelles On-/Offboarding führt zu fehlerhafter Rechtevergabe und verzögerter Entziehung und erzeugt Phasen unberechtigter Zugriffe sowie Bereitstellungsfehler — zusätzlich zum Verwaltungsaufwand.",
    "note": "EN+DE revised title and description."
  },
  {
    "risk_id": "b-09-r3",
    "new_title_en": "Under- or over-prioritization of security events due to missing thresholds",
    "new_description_en": "Without classification thresholds, severe incidents may receive insufficient resources and attention, prolonging containment and recovery, while trivial events consume IRT capacity.",
    "new_title_de": "Unter- oder Überpriorisierung von Sicherheitsereignissen durch fehlende Schwellenwerte",
    "new_description_de": "Ohne Klassifizierungs-Schwellenwerte erhalten schwerwiegende Vorfälle möglicherweise zu wenig Ressourcen und Aufmerksamkeit, was Eindämmung und Wiederherstellung verlängert, während triviale Ereignisse die Kapazität des Notfallteams binden.",
    "note": "EN+DE revised title and description."
  },
  {
    "risk_id": "c-07-r2",
    "new_title_en": "Untimely Restoration of Critical Processes",
    "new_description_en": null,
    "new_title_de": "Nicht rechtzeitige Wiederherstellung kritischer Prozesse",
    "new_description_de": null,
    "note": "EN+DE revised title."
  },
  {
    "risk_id": "c-08-r3",
    "new_title_en": "Misallocation of Continuity Investments",
    "new_description_en": null,
    "new_title_de": "Fehlallokation von Investitionen in die Geschäftsfortführung",
    "new_description_de": null,
    "note": "EN+DE revised title."
  },
  {
    "risk_id": "c-09-r2",
    "new_title_en": null,
    "new_description_en": "Missing or inadequate crisis communication strategies lead to uncoordinated internal and external communication during a security incident, delaying response decisions and breaching NIS2 crisis-management and notification obligations, thereby prolonging and amplifying incident impact.",
    "new_title_de": null,
    "new_description_de": "Fehlende oder unzureichende Krisenkommunikationsstrategien führen während eines Sicherheitsvorfalls zu unkoordinierter interner und externer Kommunikation, verzögern Reaktionsentscheidungen und verstoßen gegen NIS2-Krisenmanagement- und Meldepflichten, wodurch die Auswirkungen des Vorfalls verlängert und verstärkt werden.",
    "note": "EN+DE revised description."
  },
  {
    "risk_id": "c-10-r3",
    "new_title_en": "Contract Losses after Poorly Handled Major Outage",
    "new_description_en": null,
    "new_title_de": "Vertragsverluste nach unzureichend bewältigter Großstörung",
    "new_description_de": null,
    "note": "EN+DE revised title."
  },
  {
    "risk_id": "cont-02-r1",
    "new_title_en": null,
    "new_description_en": "During an IT outage, missing or delayed customer communication breaches incident-transparency obligations (e.g., NIS2 Art. 23 notification of affected service recipients) and prevents customers from taking protective measures, amplifying the operational impact of the incident.",
    "new_title_de": null,
    "new_description_de": "Während eines IT-Ausfalls verstoßen fehlende oder verzögerte Kundenmitteilungen gegen Transparenzpflichten bei Vorfällen (z. B. NIS2 Art. 23 Benachrichtigung betroffener Diensteempfänger) und hindern Kunden daran, Schutzmaßnahmen zu ergreifen, wodurch die betrieblichen Auswirkungen des Vorfalls verstärkt werden.",
    "note": "EN+DE revised description."
  },
  {
    "risk_id": "org-25-r3",
    "new_title_en": "Ineffective security measures persist undetected",
    "new_description_en": "Without compliance reviews, controls that fail in practice remain in place unnoticed, leaving the underlying risks untreated (residual exposure) while resources are misallocated.",
    "new_title_de": "Unwirksame Sicherheitsmaßnahmen bleiben unentdeckt bestehen",
    "new_description_de": "Ohne Compliance-Überprüfungen bleiben in der Praxis versagende Kontrollen unbemerkt bestehen, sodass die zugrunde liegenden Risiken unbehandelt bleiben (Restexposition), während Ressourcen falsch zugewiesen werden.",
    "note": "EN+DE revised title and description."
  },
  {
    "risk_id": "f-05-r3",
    "new_title_en": "Misallocated security resources leave critical assets under-protected",
    "new_description_en": null,
    "new_title_de": "Fehlallokation von Sicherheitsressourcen lässt kritische Werte unzureichend geschützt",
    "new_description_de": null,
    "note": "EN+DE revised title."
  },
  {
    "risk_id": "f-04-r3",
    "new_title_en": "Loss of stakeholder trust due to missing independent assurance",
    "new_description_en": null,
    "new_title_de": "Vertrauensverlust bei Stakeholdern durch fehlende unabhängige Prüfung",
    "new_description_de": null,
    "note": "EN+DE revised title."
  },
  {
    "risk_id": "org-24-r4",
    "new_title_en": "Loss of stakeholder trust due to absent independent assurance",
    "new_description_en": null,
    "new_title_de": "Vertrauensverlust bei Stakeholdern mangels unabhängiger Prüfung",
    "new_description_de": null,
    "note": "EN+DE revised title."
  },
  {
    "risk_id": "f-06-r3",
    "new_title_en": "Unreviewed security spending leaves critical areas under-protected",
    "new_description_en": null,
    "new_title_de": "Nicht überprüfte Sicherheitsausgaben lassen kritische Bereiche unzureichend geschützt",
    "new_description_de": null,
    "note": "EN+DE revised title."
  },
  {
    "risk_id": "i-01-r3",
    "new_title_en": "Screening delays leave security-critical positions unfilled",
    "new_description_en": null,
    "new_title_de": "Verzögerungen beim Screening lassen sicherheitskritische Stellen unbesetzt",
    "new_description_de": null,
    "note": "EN+DE revised title."
  },
  {
    "risk_id": "f-02-r2",
    "new_title_en": "Recovery plans not updated after test findings",
    "new_description_en": null,
    "new_title_de": "Wiederherstellungspläne werden nach Testergebnissen nicht aktualisiert",
    "new_description_de": null,
    "note": "EN+DE revised title."
  },
  {
    "risk_id": "ppl-01-r2",
    "new_title_en": "Inconsistent enforcement undermines security policy effectiveness",
    "new_description_en": null,
    "new_title_de": "Inkonsistente Durchsetzung untergräbt die Wirksamkeit der Sicherheitsrichtlinien",
    "new_description_de": null,
    "note": "EN+DE revised title."
  },
  {
    "risk_id": "g-09-r4",
    "new_title_en": "Regulatory sanctions following endpoint security incidents",
    "new_description_en": "Inadequate endpoint protection increases the frequency of reportable security incidents; failure to detect them in time jeopardizes NIS2 Art.23 notification deadlines, risking fines, loss of customer trust, and reputational damage.",
    "new_title_de": "Aufsichtsrechtliche Sanktionen nach Endpoint-Sicherheitsvorfällen",
    "new_description_de": "Unzureichender Endpoint-Schutz erhöht die Häufigkeit meldepflichtiger Sicherheitsvorfälle; werden diese nicht rechtzeitig erkannt, sind die Meldefristen nach NIS2 Art. 23 gefährdet, was Bußgelder, Verlust von Kundenvertrauen und Reputationsschäden riskiert.",
    "note": "EN+DE revised title and description."
  },
  {
    "risk_id": "i-07-r4",
    "new_title_en": "Prolonged outages due to poor asset visibility",
    "new_description_en": null,
    "new_title_de": "Verlängerte Ausfälle durch mangelnde Asset-Transparenz",
    "new_description_de": null,
    "note": "EN+DE revised title."
  },
  {
    "risk_id": "e-02-r3",
    "new_title_en": "Delayed incident containment due to flat network",
    "new_description_en": "A non-segmented network prevents isolation of compromised zones during an incident, prolonging containment, recovery time and cost.",
    "new_title_de": "Verzögerte Vorfalls-Eindämmung durch flaches Netzwerk",
    "new_description_de": "Ein nicht segmentiertes Netzwerk verhindert die Isolation kompromittierter Zonen während eines Vorfalls und verlängert Eindämmung, Wiederherstellungszeit und -kosten.",
    "note": "EN+DE revised title and description."
  },
  {
    "risk_id": "a-06-r3",
    "new_title_en": "System instability and outages due to incompatible EoL software",
    "new_description_en": "Outdated software without vendor support is incompatible with current hardware/software and cannot be reliably maintained, causing system instability, outages and degraded functionality (availability impact); increased operating cost is a secondary business consequence.",
    "new_title_de": "Systeminstabilität und Ausfälle durch inkompatible End-of-Life-Software",
    "new_description_de": "Veraltete Software ohne Herstellersupport ist mit aktueller Hardware/Software inkompatibel und kann nicht zuverlässig gewartet werden, was zu Systeminstabilität, Ausfällen und beeinträchtigter Funktionalität führt (Verfügbarkeitswirkung); erhöhte Betriebskosten sind eine sekundäre geschäftliche Folge.",
    "note": "EN+DE revised title and description."
  },
  {
    "risk_id": "a-18-r2",
    "new_title_en": null,
    "new_description_en": "Uncoordinated, untested changes cause recurring production faults and emergency rollbacks, degrading the availability and integrity of critical services.",
    "new_title_de": null,
    "new_description_de": "Unkoordinierte, ungetestete Änderungen verursachen wiederkehrende Produktionsfehler und Notfall-Rollbacks und beeinträchtigen die Verfügbarkeit und Integrität kritischer Dienste.",
    "note": "EN+DE revised description."
  },
  {
    "risk_id": "c-04-r3",
    "new_title_en": "Inability to resume operations after a catastrophic event",
    "new_description_en": null,
    "new_title_de": "Unfähigkeit zur Wiederaufnahme des Betriebs nach einem katastrophalen Ereignis",
    "new_description_de": null,
    "note": "EN+DE revised title."
  },
  {
    "risk_id": "tech-17-r2",
    "new_title_en": null,
    "new_description_en": "Without sufficient redundancy, replication and backups, a system failure can lead to data loss or inconsistencies, compromising data integrity and availability and making recovery difficult or impossible.",
    "new_title_de": null,
    "new_description_de": "Ohne ausreichende Redundanz, Replikation und Backups kann ein Systemausfall zu Datenverlust oder Inkonsistenzen führen, was die Datenintegrität und -verfügbarkeit beeinträchtigt und eine Wiederherstellung erschwert oder unmöglich macht.",
    "note": "EN+DE revised description (CIA should be I,A)."
  }
];

export const reviewCrossMapAdditions: CrossMapAddition[] = [
  {
    "risk_id": "a-01-r2",
    "control_id": "org-20",
    "rationale": "Identifies legal/NIS2 requirements and audits compliance, directly reducing fine exposure."
  },
  {
    "risk_id": "a-01-r3",
    "control_id": "a-12",
    "rationale": "Structured training, phishing simulations and onboarding directly raise awareness and cut human error."
  },
  {
    "risk_id": "a-13-r2",
    "control_id": "b-03",
    "rationale": "Defined escalation levels, channels and responsibilities directly shorten incident escalation time."
  },
  {
    "risk_id": "org-01-r1",
    "control_id": "b-01",
    "rationale": "Designated IRT with defined roles removes responsibility ambiguity during incidents."
  },
  {
    "risk_id": "org-03-r2",
    "control_id": "a-12",
    "rationale": "Training and phishing simulations directly reduce negligent employee behavior, the stated likelihood driver."
  },
  {
    "risk_id": "org-02-r3",
    "control_id": "a-18",
    "rationale": "CAB approval and mandatory independent testing before production directly catch erroneous/malicious changes.; ADD e-05: Monitoring and auditing of configuration changes detects undetected erroneous configurations."
  },
  {
    "risk_id": "org-04-r1",
    "control_id": "b-12",
    "rationale": "Reporting workflow with templates and automated deadline monitoring directly prevents missed 24h/72h deadlines."
  },
  {
    "risk_id": "a-02-r1",
    "control_id": "e-10",
    "rationale": "Technical vulnerability management detects undetected vulnerabilities directly, independent of risk-analysis cadence."
  },
  {
    "risk_id": "a-02-r3",
    "control_id": "org-20",
    "rationale": "Identifying and mapping legal requirements to controls directly reduces likelihood of NIS2 breach."
  },
  {
    "risk_id": "org-06-r1",
    "control_id": "a-08",
    "rationale": "Automated configuration verification/enforcement catches misconfigurations regardless of procedure currency."
  },
  {
    "risk_id": "org-06-r2",
    "control_id": "a-18",
    "rationale": "Formal change management (CAB, workflows, mandatory testing) is the primary control against unauthorized changes.; ADD g-04: RBAC restricts who can change systems and data, limiting ad-hoc unauthorized changes."
  },
  {
    "risk_id": "org-06-r3",
    "control_id": "b-04",
    "rationale": "A tested Incident Response Plan directly reduces delayed/ineffective incident response."
  },
  {
    "risk_id": "org-06-r4",
    "control_id": "org-20",
    "rationale": "Systematic identification/mapping of legal requirements reduces likelihood of regulatory violations."
  },
  {
    "risk_id": "gov-01-r2",
    "control_id": "gov-02",
    "rationale": "Formal NIS2 budget request/approval directly secures the resources whose absence is this risk."
  },
  {
    "risk_id": "gov-01-r4",
    "control_id": "org-20",
    "rationale": "Compliance-requirements identification and control mapping directly reduces likelihood of unmet NIS2 obligations."
  },
  {
    "risk_id": "org-07-r2",
    "control_id": "b-04",
    "rationale": "Incident Response Plan and exercises are the primary mitigant for slow/inefficient incident response."
  },
  {
    "risk_id": "org-07-r3",
    "control_id": "a-02",
    "rationale": "Risk management framework converts threat intelligence into prioritized, strategic security planning."
  },
  {
    "risk_id": "a-15-r2",
    "control_id": "f-05",
    "rationale": "Internal audit program detects documentation/compliance gaps before external audits, directly reducing this audit-transparency risk."
  },
  {
    "risk_id": "a-15-r3",
    "control_id": "b-04",
    "rationale": "Incident Response Plan with defined roles directly reduces slow/ineffective response, beyond register accuracy."
  },
  {
    "risk_id": "a-07-r1",
    "control_id": "h-03",
    "rationale": "Encryption at rest protects sensitive data even when classification fails or lags.; ADD tech-16: DLP detects and blocks exfiltration/disclosure of sensitive data, reducing breach impact."
  },
  {
    "risk_id": "risk-02-r3",
    "control_id": "org-07",
    "rationale": "Threat intelligence materially improves identification of new/emerging risks beyond methodology alone.; ADD e-10: Vulnerability management identifies technical weaknesses independently of risk-assessment completeness."
  },
  {
    "risk_id": "org-08-r1",
    "control_id": "e-14",
    "rationale": "Secure SDLC with SAST/DAST prevents vulnerabilities in newly developed systems at source.; ADD e-09: Automated vulnerability scanning integrated into the SDLC detects flaws before and after go-live."
  },
  {
    "risk_id": "org-08-r3",
    "control_id": "org-20",
    "rationale": "Identifying applicable legal requirements feeds them into project security requirements, reducing non-compliance likelihood."
  },
  {
    "risk_id": "risk-01-r2",
    "control_id": "org-07",
    "rationale": "Threat intelligence feeds keep risk scenarios aligned with current threat landscape."
  },
  {
    "risk_id": "risk-01-r3",
    "control_id": "gov-03",
    "rationale": "Quarterly management review with escalation thresholds forces risk results into management decisions."
  },
  {
    "risk_id": "a-03-r1",
    "control_id": "a-05",
    "rationale": "NAC and automated device scanning detect and block unknown devices joining the network."
  },
  {
    "risk_id": "a-03-r3",
    "control_id": "phy-07",
    "rationale": "Mobile device/data-carrier encryption neutralizes data exposure from lost or stolen devices.; ADD e-20: MDM remote wipe and locking directly reduce impact of unreturned/lost devices."
  },
  {
    "risk_id": "a-04-r1",
    "control_id": "a-09",
    "rationale": "Regular vulnerability scanning actually discovers vulnerabilities the inventory link only enables."
  },
  {
    "risk_id": "a-04-r3",
    "control_id": "a-06",
    "rationale": "Dedicated EoL monitoring and EoL-handling policy directly drive replacement of unsupported software."
  },
  {
    "risk_id": "a-04-r4",
    "control_id": "e-07",
    "rationale": "Centralized patch management is the direct control for timely, complete patching."
  },
  {
    "risk_id": "org-11-r3",
    "control_id": "org-20",
    "rationale": "Systematic identification and mapping of legal/regulatory requirements keeps the scheme compliant."
  },
  {
    "risk_id": "org-10-r1",
    "control_id": "i-03",
    "rationale": "Automated account deactivation at offboarding removes the access the unreturned device provides.; ADD e-20: MDM remote wipe/lock directly neutralizes data on unreturned devices."
  },
  {
    "risk_id": "a-16-r2",
    "control_id": "org-18",
    "rationale": "A secure cloud usage policy defines authorized services, directly curbing shadow IT.; ADD tech-04: Web filtering technically blocks/detects access to unsanctioned cloud services."
  },
  {
    "risk_id": "a-16-r3",
    "control_id": "d-12",
    "rationale": "Contingency plans and fallback strategies for critical providers directly reduce outage impact."
  },
  {
    "risk_id": "org-13-r1",
    "control_id": "tech-16",
    "rationale": "Endpoint/gateway DLP directly blocks sensitive data leaving via unauthorized channels."
  },
  {
    "risk_id": "org-13-r3",
    "control_id": "a-10",
    "rationale": "Central log management with retention and integrity provides the audit-proof transfer evidence."
  },
  {
    "risk_id": "org-14-r2",
    "control_id": "g-05",
    "rationale": "PAM, least privilege and privileged-activity auditing deter and detect misuse of legitimate rights."
  },
  {
    "risk_id": "org-14-r3",
    "control_id": "g-07",
    "rationale": "Phishing simulations directly reduce likelihood of credential compromise.; ADD g-09: EDR detects/blocks credential-stealing malware on endpoints."
  },
  {
    "risk_id": "a-17-r2",
    "control_id": "org-13",
    "rationale": "Encryption in transit and secure transfer protocols prevent in-flight manipulation, not just detect it."
  },
  {
    "risk_id": "org-09-r2",
    "control_id": "ep-02",
    "rationale": "Application whitelisting technically prevents execution of unauthorized software.; ADD a-04: Software inventory detects unauthorized installations for remediation."
  },
  {
    "risk_id": "org-16-r3",
    "control_id": "g-05",
    "rationale": "PAM, least privilege and privileged-session auditing detect and constrain insider misuse."
  },
  {
    "risk_id": "g-04-r3",
    "control_id": "g-05",
    "rationale": "PAM with MFA for privileged accounts and session auditing is the primary mitigant for admin compromise."
  },
  {
    "risk_id": "i-09-r2",
    "control_id": "g-02",
    "rationale": "MFA directly reduces likelihood of the account compromise itself.; ADD g-05: PAM and least-privilege enforcement cap blast radius of compromised privileged accounts."
  },
  {
    "risk_id": "d-03-r2",
    "control_id": "d-04",
    "rationale": "Standard contractual security clauses and reporting obligations directly remedy missing requirements/SLAs."
  },
  {
    "risk_id": "d-04-r1",
    "control_id": "d-05",
    "rationale": "Independent audits and certification evidence verify provider security beyond paper contractual clauses."
  },
  {
    "risk_id": "d-04-r3",
    "control_id": "sup-04",
    "rationale": "Notification clauses, escalation matrix and joint tabletop exercises directly speed provider incident response.; ADD d-02: Provider-specific incident response plan (d-02-m5) enables timely own-side reaction."
  },
  {
    "risk_id": "d-02-r2",
    "control_id": "d-12",
    "rationale": "Provider contingency plans, fallback strategies and alternative providers directly reduce outage impact."
  },
  {
    "risk_id": "d-05-r1",
    "control_id": "d-04",
    "rationale": "Contractual security clauses make audited requirements enforceable; audits alone lack legal teeth."
  },
  {
    "risk_id": "d-05-r2",
    "control_id": "d-12",
    "rationale": "Contingency plans and alternative providers directly reduce business-interruption impact of provider outage."
  },
  {
    "risk_id": "d-01-r2",
    "control_id": "b-02",
    "rationale": "Maintained emergency contact list with emergency access directly cuts response delay.; ADD d-02: Provider incident response plan (d-02-m5) defines escalation paths and responsibilities."
  },
  {
    "risk_id": "d-09-r2",
    "control_id": "sup-01",
    "rationale": "Contractual subcontractor disclosure and regular list reviews directly create the missing transparency."
  },
  {
    "risk_id": "d-07-r1",
    "control_id": "d-06",
    "rationale": "Monitoring/PAM of service provider access detects and limits residual access post-termination."
  },
  {
    "risk_id": "d-10-r1",
    "control_id": "h-03",
    "rationale": "Encryption with customer-controlled keys directly reduces impact of compelled disclosure."
  },
  {
    "risk_id": "d-10-r4",
    "control_id": "d-04",
    "rationale": "Contractually anchored audit and inspection rights enable cross-jurisdiction audits and compliance evidence."
  },
  {
    "risk_id": "d-12-r2",
    "control_id": "sup-04",
    "rationale": "Contractual incident notification and escalation matrix speed containment of provider compromise.; ADD c-01: Own backups of provider-processed data directly reduce data-loss impact."
  },
  {
    "risk_id": "org-18-r1",
    "control_id": "a-16",
    "rationale": "Central cloud inventory, risk analysis and provider compliance verification add control beyond policy paper."
  },
  {
    "risk_id": "org-18-r3",
    "control_id": "a-16",
    "rationale": "Centralized cloud service inventory discovers unapproved/shadow cloud usage.; ADD tech-04: Central web filtering blocks and detects access to unapproved cloud services."
  },
  {
    "risk_id": "sup-01-r2",
    "control_id": "d-12",
    "rationale": "Contingency plans and fallback providers reduce outage impact when a subcontractor fails."
  },
  {
    "risk_id": "b-02-r3",
    "control_id": "b-06",
    "rationale": "Alternative IT-independent communication channels are needed to actually transmit reports when infrastructure is down."
  },
  {
    "risk_id": "b-03-r2",
    "control_id": "b-12",
    "rationale": "Automated deadline monitoring and reporting templates directly prevent missed regulatory deadlines."
  },
  {
    "risk_id": "d-06-r1",
    "control_id": "g-02",
    "rationale": "MFA on (provider) access directly reduces likelihood that stolen credentials are usable.; ADD tech-16: DLP on endpoints/gateways directly detects and blocks the exfiltration itself."
  },
  {
    "risk_id": "d-06-r2",
    "control_id": "a-18",
    "rationale": "Formal change management (CAB, workflows) directly reduces likelihood of faulty provider configuration changes."
  },
  {
    "risk_id": "b-06-r3",
    "control_id": "j-01",
    "rationale": "Secure communication policy and hardened, approved tools directly secure the alternative channels."
  },
  {
    "risk_id": "b-07-r2",
    "control_id": "inc-comm-1",
    "rationale": "Documented, tested 24h early-warning procedure and BSI portal access directly reduce missed deadlines."
  },
  {
    "risk_id": "b-07-r3",
    "control_id": "b-02",
    "rationale": "Maintained central contact list enables rapid reach of external parties during incidents.; ADD sup-04: Contractual incident notification, escalation matrix and joint tabletops directly improve partner coordination."
  },
  {
    "risk_id": "b-11-r1",
    "control_id": "inc-comm-1",
    "rationale": "Dedicated 24h early-warning procedure, tested BSI portal access and notification tabletop directly target this risk."
  },
  {
    "risk_id": "b-11-r2",
    "control_id": "inc-comm-1",
    "rationale": "Documented 24h procedure standardizes required notification content, reducing incorrect or incomplete submissions."
  },
  {
    "risk_id": "b-11-r3",
    "control_id": "inc-01",
    "rationale": "SOAR automation of triage and playbooks materially reduces manual IRT workload during incident surges.; ADD b-05: Deputy arrangements and communication matrix provide surge capacity and continuity for the IRT."
  },
  {
    "risk_id": "b-12-r1",
    "control_id": "inc-comm-2",
    "rationale": "72h reporting template, single point of communication and 72h exercises directly reduce deadline misses.; ADD inc-comm-3: Final report template and established RCA method directly support the 1-month deadline."
  },
  {
    "risk_id": "b-12-r2",
    "control_id": "inc-comm-3",
    "rationale": "Final-report template and established root-cause method directly improve report completeness and accuracy."
  },
  {
    "risk_id": "b-12-r3",
    "control_id": "b-03",
    "rationale": "Documented internal reporting channels and tools directly reduce internal communication delays.; ADD b-04: IRP with defined roles and communication plan is the primary mitigation for response delay."
  },
  {
    "risk_id": "b-04-r2",
    "control_id": "inc-comm-1",
    "rationale": "Documented and tested 24h early-warning procedure directly reduces missed statutory notifications."
  },
  {
    "risk_id": "b-04-r3",
    "control_id": "b-05",
    "rationale": "Defined roles, deputy arrangements and communication matrix directly prevent coordination chaos."
  },
  {
    "risk_id": "b-13-r1",
    "control_id": "a-10",
    "rationale": "Centralized log management with integrity assurance preserves digital evidence against loss or tampering."
  },
  {
    "risk_id": "b-13-r2",
    "control_id": "b-08",
    "rationale": "Formal post-incident review and lessons-learned tracking directly ensure root causes are identified and remediated."
  },
  {
    "risk_id": "b-14-r1",
    "control_id": "c-04",
    "rationale": "Air-gapped/immutable backups are the primary impact reducer for ransomware data loss and downtime.; ADD g-09: Central EDR materially reduces likelihood and enables early containment of ransomware."
  },
  {
    "risk_id": "b-14-r2",
    "control_id": "tech-06",
    "rationale": "Email gateway with ATP blocks and removes phishing mails, directly reducing containment delay."
  },
  {
    "risk_id": "inc-01-r1",
    "control_id": "b-10",
    "rationale": "SIEM with defined log sources and correlation rules is the primary detection capability SOAR presupposes.; ADD e-13: Network/host IDS/IPS directly detects intrusions, reducing missed or delayed detection."
  },
  {
    "risk_id": "c-10-r3",
    "control_id": "cont-02",
    "rationale": "Customer outage communication directly limits trust and contract loss during interruptions."
  },
  {
    "risk_id": "c-12-r1",
    "control_id": "phy-11",
    "rationale": "Preventive maintenance and spare-parts management reduce hardware-defect likelihood."
  },
  {
    "risk_id": "c-12-r2",
    "control_id": "a-18",
    "rationale": "Change management with mandatory pre-production testing prevents bugs/misconfigurations reaching production."
  },
  {
    "risk_id": "c-11-r3",
    "control_id": "c-02",
    "rationale": "Regular backup integrity verification directly detects inconsistent or corrupt recovery data."
  },
  {
    "risk_id": "cont-01-r2",
    "control_id": "c-01",
    "rationale": "Tested backups are the primary recovery path for data lost in a faulty restart.; ADD c-02: Backup integrity verification directly prevents restoring corrupt or inconsistent data."
  },
  {
    "risk_id": "org-19-r3",
    "control_id": "phy-09",
    "rationale": "Redundant power, UPS and tested generators directly mitigate power-supply failure.; ADD c-12: Hardware/network redundancy prevents complete operational shutdown from single infrastructure failure."
  },
  {
    "risk_id": "org-20-r3",
    "control_id": "f-06",
    "rationale": "Corrective action management directly ensures audit findings are remediated and tracked to closure."
  },
  {
    "risk_id": "org-25-r2",
    "control_id": "a-09",
    "rationale": "Regular vulnerability scans directly detect the open ports and outdated software this risk describes."
  },
  {
    "risk_id": "f-05-r2",
    "control_id": "org-20",
    "rationale": "Identifies and maps legal/regulatory requirements, preventing non-compliance audits can only detect."
  },
  {
    "risk_id": "org-22-r2",
    "control_id": "a-10",
    "rationale": "Centralized audit logging/monitoring detects covert record alterations the DMS alone may miss."
  },
  {
    "risk_id": "org-22-r3",
    "control_id": "c-12",
    "rationale": "Hardware/software/network redundancy reduces record loss and downtime from technical failures."
  },
  {
    "risk_id": "org-22-r4",
    "control_id": "org-20",
    "rationale": "Identifying applicable retention laws is the prerequisite for compliant archiving periods."
  },
  {
    "risk_id": "f-04-r1",
    "control_id": "f-05",
    "rationale": "Internal audits find and fix nonconformities before certification audits; required by ISO 27001."
  },
  {
    "risk_id": "org-24-r1",
    "control_id": "a-09",
    "rationale": "Continuous vulnerability scanning and remediation; annual pentests alone leave year-long detection gaps."
  },
  {
    "risk_id": "org-24-r2",
    "control_id": "org-20",
    "rationale": "Systematic identification and mapping of changing legal requirements directly prevents overlooking them."
  },
  {
    "risk_id": "f-06-r2",
    "control_id": "org-20",
    "rationale": "Systematic legal-requirements identification and mapping directly addresses 'not systematically reviewed' compliance gap."
  },
  {
    "risk_id": "f-07-r2",
    "control_id": "org-20",
    "rationale": "Compliance requirement identification and auditing directly surface the gaps management reporting must escalate."
  },
  {
    "risk_id": "f-07-r3",
    "control_id": "b-09",
    "rationale": "Incident classification thresholds and SIEM-integrated escalation directly drive timely management notification."
  },
  {
    "risk_id": "f-02-r1",
    "control_id": "c-05",
    "rationale": "Recovery tests must actually be defined, conducted and documented; f-02 only evaluates results."
  },
  {
    "risk_id": "f-02-r2",
    "control_id": "c-11",
    "rationale": "DRP maintenance/revision is where corrections must land; directly reduces failed-recovery impact."
  },
  {
    "risk_id": "i-02-r1",
    "control_id": "tech-16",
    "rationale": "DLP on endpoints/email/web directly blocks or detects unintentional disclosure of sensitive data."
  },
  {
    "risk_id": "i-02-r2",
    "control_id": "org-09",
    "rationale": "Acceptable-use policy for information/assets directly addresses the stated policy gap enabling misuse."
  },
  {
    "risk_id": "i-03-r3",
    "control_id": "g-02",
    "rationale": "MFA blocks credential-based takeover of overlooked dormant accounts by external attackers."
  },
  {
    "risk_id": "ppl-01-r3",
    "control_id": "b-03",
    "rationale": "Dedicated internal reporting process, channels and training directly increase incident reporting rates."
  },
  {
    "risk_id": "a-12-r2",
    "control_id": "tech-16",
    "rationale": "DLP directly prevents storing/sending sensitive data via insecure systems and channels.; ADD h-03: Full-disk/device encryption neutralizes data loss from lost devices, explicitly named in the risk."
  },
  {
    "risk_id": "a-12-r3",
    "control_id": "g-02",
    "rationale": "MFA limits damage when credentials are socially engineered out of employees."
  },
  {
    "risk_id": "ppl-02-r1",
    "control_id": "g-03",
    "rationale": "Automated IAM offboarding closes the manual-deactivation gap that lets access persist."
  },
  {
    "risk_id": "ppl-02-r2",
    "control_id": "org-10",
    "rationale": "Dedicated asset-return process and checklist directly ensure property is returned at departure."
  },
  {
    "risk_id": "ppl-03-r2",
    "control_id": "d-04",
    "rationale": "Contractual security clauses and audit rights for providers go beyond NDAs and bind handling of data."
  },
  {
    "risk_id": "g-06-r1",
    "control_id": "tech-06",
    "rationale": "Email gateway ATP/web filtering blocks phishing payloads regardless of user behavior.; ADD g-02: MFA limits account compromise when credentials are phished."
  },
  {
    "risk_id": "g-06-r2",
    "control_id": "tech-16",
    "rationale": "DLP on endpoints/email/web directly blocks shadow-cloud uploads and insecure sharing."
  },
  {
    "risk_id": "g-06-r3",
    "control_id": "g-10",
    "rationale": "Device control and external-media policy technically block the named USB infection vector.; ADD tech-05: Central anti-malware with automated updates directly stops infections training cannot prevent."
  },
  {
    "risk_id": "g-07-r1",
    "control_id": "tech-06",
    "rationale": "Email ATP/URL filtering reduces phishing exposure independently of simulation outcomes.; ADD g-02: MFA caps damage from phished credentials."
  },
  {
    "risk_id": "g-07-r2",
    "control_id": "b-03",
    "rationale": "Documented reporting process, channels and tools directly shorten time-to-report."
  },
  {
    "risk_id": "g-08-r1",
    "control_id": "ep-01",
    "rationale": "Hardening standards plus automated configuration management catch misconfigurations independent of training quality."
  },
  {
    "risk_id": "g-08-r2",
    "control_id": "b-04",
    "rationale": "A tested incident response plan with exercises directly reduces delayed/ineffective response."
  },
  {
    "risk_id": "g-08-r3",
    "control_id": "g-07",
    "rationale": "Phishing simulations with automated retraining target exactly this attack vector.; ADD g-05: PAM, least privilege and MFA on privileged accounts limit damage from a compromised admin."
  },
  {
    "risk_id": "g-12-r1",
    "control_id": "a-17",
    "rationale": "DLP systems detect and block accidental sharing of sensitive data via insecure channels.; ADD org-13: Secure transfer policy, encryption in transit and approved channels directly reduce insecure-channel disclosure."
  },
  {
    "risk_id": "g-12-r2",
    "control_id": "g-07",
    "rationale": "Phishing simulations with retraining measurably reduce click rates of new employees.; ADD g-09: EDR detects and contains malware after a click, reducing impact."
  },
  {
    "risk_id": "g-01-r2",
    "control_id": "g-07",
    "rationale": "Regular phishing simulations directly reduce the likelihood employees surrender credentials."
  },
  {
    "risk_id": "g-11-r1",
    "control_id": "e-03",
    "rationale": "Centrally enforced automatic screen lock technically prevents unattended-session exposure.; ADD i-05: Visitor management and escorting reduce unauthorized third parties near workstations."
  },
  {
    "risk_id": "g-11-r2",
    "control_id": "h-03",
    "rationale": "Full disk encryption renders data on stolen devices unreadable, cutting impact.; ADD i-04: Electronic access control and surveillance deter and detect office device theft."
  },
  {
    "risk_id": "i-10-r3",
    "control_id": "g-07",
    "rationale": "Phishing simulations with automated retraining directly reduce phishing success among remote staff."
  },
  {
    "risk_id": "g-10-r2",
    "control_id": "a-17",
    "rationale": "DLP detects and blocks copying of sensitive data to external media."
  },
  {
    "risk_id": "g-10-r3",
    "control_id": "c-01",
    "rationale": "Backup concept eliminates sole-copy availability loss when media is lost.; ADD phy-07: Mandatory encryption of mobile data carriers removes confidentiality impact of lost sticks."
  },
  {
    "risk_id": "g-10-r4",
    "control_id": "ep-01",
    "rationale": "Hardening standards (BIOS/UEFI passwords, boot order, Secure Boot) directly prevent external-media boot.; ADD h-03: Full disk encryption blocks offline extraction of passwords and data after USB boot."
  },
  {
    "risk_id": "i-06-r2",
    "control_id": "net-02",
    "rationale": "802.1X NAC blocks or quarantines non-compliant personal devices before network connection."
  },
  {
    "risk_id": "ppl-04-r1",
    "control_id": "b-11",
    "rationale": "Technical monitoring and detection systems catch incidents employees fail to report."
  },
  {
    "risk_id": "ppl-04-r2",
    "control_id": "b-11",
    "rationale": "Monitoring and detection systems catch unreported threats before escalation, independent of human reporting."
  },
  {
    "risk_id": "ppl-04-r3",
    "control_id": "b-12",
    "rationale": "Regulatory reporting workflow with templates and automated deadline monitoring directly prevents late notification."
  },
  {
    "risk_id": "aw-01-r1",
    "control_id": "tech-06",
    "rationale": "Email gateway ATP / web filtering technically blocks phishing reaching users; ADD g-02: MFA materially limits impact of phished credentials"
  },
  {
    "risk_id": "aw-01-r2",
    "control_id": "gov-01",
    "rationale": "NIS2 top-management training directly targets management underestimation (Art.20); ADD gov-03: Quarterly management review institutionalizes security prioritization and budget escalation"
  },
  {
    "risk_id": "aw-01-r3",
    "control_id": "a-07",
    "rationale": "Data classification policy/tools tell departments how to handle sensitive data; ADD tech-16: DLP technically prevents unintended disclosure by employees"
  },
  {
    "risk_id": "i-05-r2",
    "control_id": "g-10",
    "rationale": "Central device control blocks unauthorized USB/external media at endpoints; ADD tech-05: Anti-malware detects and stops introduced malicious software"
  },
  {
    "risk_id": "i-04-r2",
    "control_id": "i-01",
    "rationale": "Screening of security-critical positions reduces insider-misuse likelihood"
  },
  {
    "risk_id": "i-04-r4",
    "control_id": "a-10",
    "rationale": "Central log management ensures retention, protection and review of access logs"
  },
  {
    "risk_id": "phy-01-r2",
    "control_id": "g-11",
    "rationale": "Clean desk/clear screen reduces documents and media exposed to intruders; ADD phy-07: Encrypted mobile data carriers neutralize breach impact of stolen media"
  },
  {
    "risk_id": "phy-01-r3",
    "control_id": "c-12",
    "rationale": "Hardware/network redundancy materially limits availability impact of destroyed components"
  },
  {
    "risk_id": "phy-02-r2",
    "control_id": "c-12",
    "rationale": "Redundancy limits operational-disruption impact of damaged hardware"
  },
  {
    "risk_id": "phy-02-r3",
    "control_id": "g-11",
    "rationale": "Clean desk policy removes unattended sensitive documents/media from offices; ADD phy-07: Encryption of mobile data carriers neutralizes breach impact of stolen media."
  },
  {
    "risk_id": "phy-03-r2",
    "control_id": "phy-09",
    "rationale": "UPS/redundant power directly addresses the stated power-outage failure cause"
  },
  {
    "risk_id": "phy-04-r2",
    "control_id": "i-05",
    "rationale": "Visitor registration/escorting directly controls external providers in sensitive areas"
  },
  {
    "risk_id": "phy-06-r2",
    "control_id": "phy-05",
    "rationale": "Dedicated fire suppression, water-leak detection and HVAC maintenance directly reduce environmental damage."
  },
  {
    "risk_id": "phy-06-r3",
    "control_id": "i-01",
    "rationale": "Screening of security-critical personnel reduces likelihood of malicious insiders with physical access."
  },
  {
    "risk_id": "phy-05-r1",
    "control_id": "c-01",
    "rationale": "Backups directly reduce data-loss impact of fire destruction.; ADD c-11: DRP with geo-redundant storage reduces outage impact of site fire."
  },
  {
    "risk_id": "phy-05-r2",
    "control_id": "c-01",
    "rationale": "Backups reduce data-loss impact of water-destroyed storage."
  },
  {
    "risk_id": "phy-05-r3",
    "control_id": "phy-09",
    "rationale": "Redundant A/B power feeds and utility monitoring directly reduce outage likelihood/impact."
  },
  {
    "risk_id": "phy-05-r4",
    "control_id": "phy-09",
    "rationale": "24/7 climate monitoring/alerting enables rapid response to AC failure before overheating."
  },
  {
    "risk_id": "phy-07-r2",
    "control_id": "g-02",
    "rationale": "MFA materially limits impact of credentials disclosed from compromised devices."
  },
  {
    "risk_id": "phy-08-r1",
    "control_id": "h-03",
    "rationale": "Full disk/device encryption neutralizes data exposure when media are lost - the stated root cause.; ADD g-10: Device control and external media policy reduce sensitive data placed on removable media."
  },
  {
    "risk_id": "phy-08-r3",
    "control_id": "c-01",
    "rationale": "Backups ensure transported data is recoverable, directly reducing data-loss impact."
  },
  {
    "risk_id": "phy-11-r2",
    "control_id": "e-07",
    "rationale": "Centralized patch management with compliance targets directly closes the unpatched-software gap.; ADD a-09: Regular vulnerability scanning detects outdated software/firmware before exploitation."
  },
  {
    "risk_id": "phy-11-r3",
    "control_id": "c-01",
    "rationale": "Tested backups directly prevent data loss from failing storage hardware."
  },
  {
    "risk_id": "g-09-r2",
    "control_id": "tech-16",
    "rationale": "DLP on endpoints, email and web gateways directly detects/blocks data exfiltration."
  },
  {
    "risk_id": "g-09-r3",
    "control_id": "c-04",
    "rationale": "Air-gapped/immutable backups are the decisive impact control against ransomware encryption.; ADD b-14: Ransomware playbook materially shortens containment and recovery, limiting outage spread."
  },
  {
    "risk_id": "g-09-r4",
    "control_id": "b-12",
    "rationale": "Incident reporting workflow with automated deadline monitoring directly mitigates missing NIS2 notification deadlines."
  },
  {
    "risk_id": "phy-10-r1",
    "control_id": "cry-pq-2",
    "rationale": "End-to-end encryption of data flows renders tapped cable traffic unreadable, directly cutting impact."
  },
  {
    "risk_id": "phy-10-r2",
    "control_id": "c-12",
    "rationale": "Network/hardware redundancy materially reduces outage impact when cabling is damaged."
  },
  {
    "risk_id": "phy-10-r3",
    "control_id": "net-02",
    "rationale": "802.1X port-based NAC directly blocks unauthorized devices connecting via open ports."
  },
  {
    "risk_id": "i-07-r2",
    "control_id": "h-03",
    "rationale": "Full-disk encryption materially reduces data-exposure impact when tracked devices are lost."
  },
  {
    "risk_id": "e-03-r2",
    "control_id": "g-09",
    "rationale": "EDR detects/blocks malware installed via physical access, reducing impact if screen lock fails."
  },
  {
    "risk_id": "e-05-r2",
    "control_id": "g-09",
    "rationale": "EDR detects and contains malware deployed after credential-based intrusion, reducing impact."
  },
  {
    "risk_id": "tech-01-r1",
    "control_id": "net-02",
    "rationale": "802.1X NAC technically blocks uninventoried/non-compliant devices from connecting — inventory alone cannot."
  },
  {
    "risk_id": "tech-01-r2",
    "control_id": "h-03",
    "rationale": "Full-disk encryption is the substantive control whose enforcement tech-01 only verifies; directly cuts loss impact."
  },
  {
    "risk_id": "tech-01-r3",
    "control_id": "g-09",
    "rationale": "Central EDR is the direct detection/containment control for endpoint malware; tech-01 has none.; ADD e-02: Network segmentation materially limits malware propagation across the corporate network."
  },
  {
    "risk_id": "tech-02-r2",
    "control_id": "tech-08",
    "rationale": "Mandatory peer code reviews and SAST/DAST detect covert malicious code changes by authorized users."
  },
  {
    "risk_id": "tech-02-r3",
    "control_id": "c-01",
    "rationale": "Backup and tested recoverability of repositories/tooling directly reduces outage impact."
  },
  {
    "risk_id": "tech-02-r4",
    "control_id": "a-10",
    "rationale": "Central log management with enforced retention directly remediates insufficient logging and traceability."
  },
  {
    "risk_id": "ep-01-r2",
    "control_id": "a-06",
    "rationale": "EoL monitoring addresses unsupported software that patching alone cannot remediate."
  },
  {
    "risk_id": "e-01-r2",
    "control_id": "b-14",
    "rationale": "DDoS mitigation playbook materially reduces outage duration/impact when attacks occur."
  },
  {
    "risk_id": "e-01-r3",
    "control_id": "e-02",
    "rationale": "Dedicated segmentation control adds inter-segment ACLs and boundary traffic monitoring."
  },
  {
    "risk_id": "ep-02-r1",
    "control_id": "g-09",
    "rationale": "EDR detects and contains malware that evades whitelisting (defense-in-depth).; ADD e-08: Application patching closes vulnerabilities in approved apps exploited for bypass."
  },
  {
    "risk_id": "e-02-r1",
    "control_id": "e-04",
    "rationale": "Host firewalls add host-level segmentation directly limiting lateral malware movement.; ADD g-09: EDR detects and isolates infected endpoints, stopping propagation early."
  },
  {
    "risk_id": "e-02-r3",
    "control_id": "b-04",
    "rationale": "Incident response plan and exercises directly shorten containment time in flat networks."
  },
  {
    "risk_id": "e-04-r3",
    "control_id": "e-02",
    "rationale": "Network segmentation complements host firewalls in blocking malware lateral movement."
  },
  {
    "risk_id": "e-12-r3",
    "control_id": "a-08",
    "rationale": "Automated configuration verification detects and reverts unauthorized network configuration changes."
  },
  {
    "risk_id": "e-06-r3",
    "control_id": "org-25",
    "rationale": "Internal compliance audits detect hardening non-compliance before external audits and regulators do."
  },
  {
    "risk_id": "e-13-r2",
    "control_id": "a-18",
    "rationale": "Change management with mandatory testing prevents deployment of faulty IPS rules into production."
  },
  {
    "risk_id": "e-13-r3",
    "control_id": "tech-11",
    "rationale": "UEBA/NTA anomaly detection catches evasive attackers that signature-based IDS/IPS misses.; ADD g-09: EDR detects post-bypass host activity independently of network signatures."
  },
  {
    "risk_id": "j-05-r2",
    "control_id": "tech-11",
    "rationale": "NTA/SIEM anomaly detection identifies tunneling traffic patterns (query volume, entropy, size)."
  },
  {
    "risk_id": "j-05-r3",
    "control_id": "c-12",
    "rationale": "Redundant network/server infrastructure (secondary/anycast DNS) maintains resolution under attack.; ADD tech-13: Capacity monitoring, thresholds and load tests help absorb and detect traffic spikes.; ADD b-14: DDoS mitigation playbook reduces response time and outage duration."
  },
  {
    "risk_id": "j-06-r3",
    "control_id": "cry-pq-2",
    "rationale": "Enforces TLS/mTLS and end-to-end encryption of data flows, the direct fix for unencrypted IoT communication."
  },
  {
    "risk_id": "j-06-r4",
    "control_id": "ot-1",
    "rationale": "IEC 62443 zones/conduits, iDMZ and unidirectional gateways isolate physical process control from attackers.; ADD ot-4: OT playbooks and offline engineering backups limit impact on physical processes."
  },
  {
    "risk_id": "a-08-r2",
    "control_id": "a-18",
    "rationale": "Change management with mandatory pre-production testing prevents breaking hardening changes reaching production."
  },
  {
    "risk_id": "a-08-r3",
    "control_id": "org-25",
    "rationale": "Internal compliance audits and configuration-standard monitoring surface hardening gaps before regulators/auditors do."
  },
  {
    "risk_id": "j-07-r3",
    "control_id": "tech-16",
    "rationale": "DLP on endpoints/gateways directly detects and blocks sensitive data exfiltration.; ADD g-05: PAM with privileged session auditing constrains and records the privileged insider's access."
  },
  {
    "risk_id": "j-07-r4",
    "control_id": "j-06",
    "rationale": "Dedicated IoT controls (segments, NAC, inventory, IoT-specific monitoring) directly target this device class.; ADD ot-3: Passive OT discovery provides device visibility without disrupting fragile OT operations."
  },
  {
    "risk_id": "tech-04-r1",
    "control_id": "tech-05",
    "rationale": "Endpoint anti-malware stops payloads from sites that bypass URL/reputation filtering."
  },
  {
    "risk_id": "tech-04-r2",
    "control_id": "tech-06",
    "rationale": "Email gateway with ATP blocks the dominant phishing delivery channel before users click.; ADD tech-16: DLP on web/email egress detects and blocks data exfiltration to external sites."
  },
  {
    "risk_id": "e-11-r2",
    "control_id": "a-18",
    "rationale": "Change management with mandatory testing catches firmware incompatibilities before production rollout."
  },
  {
    "risk_id": "e-11-r3",
    "control_id": "a-06",
    "rationale": "End-of-life monitoring and an EoL handling policy directly target unsupported firmware/devices."
  },
  {
    "risk_id": "net-01-r2",
    "control_id": "e-02",
    "rationale": "Implements and enforces network segmentation, directly blocking lateral movement; net-01 only reviews it.; ADD e-13: IDS/IPS detects lateral movement inside the network, reducing dwell time and impact."
  },
  {
    "risk_id": "h-01-r1",
    "control_id": "h-05",
    "rationale": "Annual algorithm review against BSI/NIST plus automated weak-crypto scanning directly detects insecure algorithms in use."
  },
  {
    "risk_id": "h-07-r2",
    "control_id": "e-11",
    "rationale": "Network-device vulnerability/patch management remediates VPN gateway software flaws faster than semi-annual reviews."
  },
  {
    "risk_id": "j-01-r2",
    "control_id": "g-02",
    "rationale": "MFA directly neutralizes stolen passwords for communication platforms — the primary mitigation for this risk."
  },
  {
    "risk_id": "a-09-r3",
    "control_id": "a-03",
    "rationale": "Complete hardware inventory defines scan scope; unknown devices are the main cause of coverage gaps.; ADD a-04: Software inventory ensures applications are included in scan coverage."
  },
  {
    "risk_id": "e-07-r2",
    "control_id": "a-18",
    "rationale": "Change management with mandatory testing phases and post-implementation reviews reduces faulty-patch disruptions."
  },
  {
    "risk_id": "j-03-r3",
    "control_id": "b-14",
    "rationale": "Dedicated DDoS mitigation playbook directly reduces impact and recovery time of DoS attacks."
  },
  {
    "risk_id": "a-11-r1",
    "control_id": "e-09",
    "rationale": "Continuous automated scanning materially closes the exposure window between annual penetration tests."
  },
  {
    "risk_id": "tech-05-r3",
    "control_id": "g-09",
    "rationale": "EDR behavioral detection catches malware that evades signature-based scanning.; ADD tech-11: UEBA/NTA anomaly detection reveals long-running APT exfiltration activity.; ADD tech-16: DLP on endpoints and gateways blocks or alerts on data exfiltration."
  },
  {
    "risk_id": "a-05-r2",
    "control_id": "tech-05",
    "rationale": "Central anti-malware blocks/contains malware from infected devices that NAC legitimately admits."
  },
  {
    "risk_id": "a-05-r3",
    "control_id": "tech-13",
    "rationale": "Capacity monitoring/thresholds detect and alert on network overload regardless of source."
  },
  {
    "risk_id": "a-06-r1",
    "control_id": "e-02",
    "rationale": "Segmentation isolates unpatchable EoL systems, the standard compensating control.; ADD e-09: Vulnerability scanning detects exploitable known CVEs on EoL software."
  },
  {
    "risk_id": "a-06-r2",
    "control_id": "org-20",
    "rationale": "Systematic identification/mapping of legal requirements directly reduces non-compliance likelihood."
  },
  {
    "risk_id": "tech-06-r1",
    "control_id": "tech-05",
    "rationale": "Endpoint anti-malware blocks payloads that bypass the proxy, the stated scenario.; ADD g-09: EDR detects and contains endpoint infections post-bypass."
  },
  {
    "risk_id": "tech-06-r2",
    "control_id": "g-02",
    "rationale": "MFA neutralizes most use of phished credentials, directly cutting impact."
  },
  {
    "risk_id": "tech-06-r3",
    "control_id": "g-09",
    "rationale": "EDR/behavioral detection catches post-exploitation activity signatures miss."
  },
  {
    "risk_id": "e-14-r2",
    "control_id": "d-11",
    "rationale": "SBOM plus OSS vulnerability scanning/patching directly targets vulnerable libraries."
  },
  {
    "risk_id": "e-14-r3",
    "control_id": "f-01",
    "rationale": "Internal audits/pentest reviews generate the compliance evidence this risk lacks."
  },
  {
    "risk_id": "e-18-r1",
    "control_id": "e-09",
    "rationale": "Post-deployment vulnerability scanning finds flaws procurement review missed."
  },
  {
    "risk_id": "e-18-r3",
    "control_id": "sup-02",
    "rationale": "Documented, tested exit strategy with alternatives directly mitigates lock-in."
  },
  {
    "risk_id": "e-16-r1",
    "control_id": "a-18",
    "rationale": "Change management with mandatory testing/approval before production directly prevents faulty deployments."
  },
  {
    "risk_id": "e-16-r3",
    "control_id": "a-18",
    "rationale": "Mandatory testing phases and CAB approval before production changes are the direct mitigation."
  },
  {
    "risk_id": "e-17-r1",
    "control_id": "tech-08",
    "rationale": "SAST/DAST and code review remediate the SQLi/XSS root cause the WAF only shields."
  },
  {
    "risk_id": "e-17-r4",
    "control_id": "b-10",
    "rationale": "SIEM with WAF log sources and correlation/alerting operationalizes continuous detection."
  },
  {
    "risk_id": "tech-07-r2",
    "control_id": "c-01",
    "rationale": "Tested backups/restore directly reduce impact of data deletion or corruption."
  },
  {
    "risk_id": "e-15-r1",
    "control_id": "e-09",
    "rationale": "Continuous automated vulnerability scanning closes the 12-month gap between annual penetration tests."
  },
  {
    "risk_id": "a-18-r1",
    "control_id": "e-16",
    "rationale": "Environment separation, strict access controls and CI/CD gates technically prevent unauthorized production changes."
  },
  {
    "risk_id": "tech-09-r3",
    "control_id": "d-05",
    "rationale": "Independent security audits/certifications of critical providers verify the provider environment's actual security posture."
  },
  {
    "risk_id": "b-10-r2",
    "control_id": "b-01",
    "rationale": "An incident response team and plan directly cut the detection-to-response time this risk describes."
  },
  {
    "risk_id": "b-10-r3",
    "control_id": "a-10",
    "rationale": "Centralized log management with retention periods and integrity controls provides the audit-proof storage demanded."
  },
  {
    "risk_id": "j-08-r1",
    "control_id": "tech-16",
    "rationale": "DLP on endpoints, email and web gateways detects and blocks sensitive data leaving via unauthorized channels.; ADD j-01: Providing approved secure communication tools removes the incentive to use insecure channels."
  },
  {
    "risk_id": "j-08-r2",
    "control_id": "tech-05",
    "rationale": "Central anti-malware blocks payloads delivered over communication channels.; ADD tech-06: Web proxy and email gateway with ATP filter malicious content at the channel entry point."
  },
  {
    "risk_id": "tech-11-r2",
    "control_id": "b-14",
    "rationale": "DDoS and ransomware playbooks turn early detection into rapid mitigation, limiting outage duration."
  },
  {
    "risk_id": "tech-13-r1",
    "control_id": "c-12",
    "rationale": "Hardware/software/network redundancy prevents a single resource overload becoming a complete outage.; ADD b-14: DDoS mitigation playbook addresses the attack-driven overload scenario capacity planning cannot."
  },
  {
    "risk_id": "tech-12-r2",
    "control_id": "inc-17",
    "rationale": "Forensic readiness and chain-of-custody procedures materially reduce impact on evidence admissibility."
  },
  {
    "risk_id": "tech-12-r4",
    "control_id": "a-10",
    "rationale": "Tamper-proof central logging (WORM, hashes) limits attackers covering tracks via timestamp manipulation."
  },
  {
    "risk_id": "c-01-r2",
    "control_id": "c-11",
    "rationale": "Documented, tested disaster recovery plan with geo-redundancy materially reduces recovery delay in disasters."
  },
  {
    "risk_id": "c-04-r3",
    "control_id": "c-06",
    "rationale": "Business continuity plan with RTO/RPO and emergency operations materially reduces impact of recovery incapability."
  },
  {
    "risk_id": "tech-08-r1",
    "control_id": "e-17",
    "rationale": "WAF blocks exploitation attempts (SQLi/XSS) against residual vulnerabilities in production applications."
  },
  {
    "risk_id": "c-05-r2",
    "control_id": "c-07",
    "rationale": "Defined RTO/RPO targets make recovery-time shortfalls measurable and drive remediation of slow processes."
  },
  {
    "risk_id": "c-05-r3",
    "control_id": "f-02",
    "rationale": "Standardized test protocols, tracking and management reporting produce the audit-proof effectiveness evidence this risk concerns."
  },
  {
    "risk_id": "c-02-r2",
    "control_id": "c-11",
    "rationale": "DRP with geo-redundant data storage directly mitigates total loss from a local disaster."
  },
  {
    "risk_id": "c-02-r3",
    "control_id": "c-03",
    "rationale": "Access controls, access-right audits and physical protection of backup systems directly reduce unauthorized access."
  },
  {
    "risk_id": "c-03-r2",
    "control_id": "c-04",
    "rationale": "Immutable/air-gapped backups directly prevent tampering with backup data.; ADD c-02: Regular backup integrity verification detects manipulated backups before restore."
  },
  {
    "risk_id": "c-03-r3",
    "control_id": "h-04",
    "rationale": "Centralized KMS with documented processes, rotation and escrow directly prevents key loss."
  },
  {
    "risk_id": "tech-15-r1",
    "control_id": "tech-10",
    "rationale": "Test data management with strict access controls for test environments limits exposure when masking fails."
  },
  {
    "risk_id": "tech-18-r1",
    "control_id": "g-05",
    "rationale": "PAM with least privilege and MFA directly constrains who can run privileged utilities."
  },
  {
    "risk_id": "tech-17-r1",
    "control_id": "phy-11",
    "rationale": "Preventive maintenance and spare-parts management materially reduce hardware failure likelihood."
  },
  {
    "risk_id": "tech-17-r2",
    "control_id": "c-01",
    "rationale": "Tested backups are the primary mitigation of data-loss impact from system failure.; ADD c-02: Backup integrity verification and 3-2-1 strategy directly address inconsistency/recoverability."
  },
  {
    "risk_id": "tech-17-r3",
    "control_id": "c-11",
    "rationale": "Disaster recovery plan with geo-redundant storage directly reduces regional-disaster downtime."
  },
  {
    "risk_id": "tech-16-r3",
    "control_id": "g-09",
    "rationale": "EDR detects/blocks the malware that bypasses DLP controls.; ADD e-13: Network IDS/IPS detects covert exfiltration traffic DLP misses."
  },
  {
    "risk_id": "tech-19-r1",
    "control_id": "ep-02",
    "rationale": "Application whitelisting technically blocks execution/installation of unauthorized software."
  },
  {
    "risk_id": "tech-19-r3",
    "control_id": "a-18",
    "rationale": "Change management with mandatory pre-production testing catches configuration errors before deployment."
  },
  {
    "risk_id": "tech-20-r3",
    "control_id": "e-05",
    "rationale": "Configuration-change monitoring and default-credential scans detect leftover audit artifacts."
  },
  {
    "risk_id": "iam-mfa-1-r1",
    "control_id": "g-05",
    "rationale": "PAM and least privilege limit blast radius and add MFA enforcement for privileged accounts."
  },
  {
    "risk_id": "iam-mfa-1-r2",
    "control_id": "e-02",
    "rationale": "Network segmentation directly contains lateral movement that MFA alone cannot stop."
  },
  {
    "risk_id": "iam-mfa-5-r2",
    "control_id": "g-13",
    "rationale": "Service-account inventory, permission reviews and PAM directly reduce over-privilege, which the mapped measures do not address."
  },
  {
    "risk_id": "ot-1-r2",
    "control_id": "ot-4",
    "rationale": "OT playbooks and offline engineering backups materially cut outage duration after malware hits.; ADD ep-02: Application whitelisting on OT endpoints blocks malware execution where patching/EDR is infeasible."
  },
  {
    "risk_id": "ot-1-r3",
    "control_id": "ot-2",
    "rationale": "Jump host, JIT access and MFA/ticket binding directly control who can reach SIS/controllers."
  },
  {
    "risk_id": "ot-2-r2",
    "control_id": "d-05",
    "rationale": "Supplier security audits/certifications reduce likelihood the maintenance provider is compromised at all.; ADD ot-1: Zone/conduit segmentation and iDMZ limit lateral movement from a compromised supplier entry point."
  },
  {
    "risk_id": "ot-2-r3",
    "control_id": "a-10",
    "rationale": "Central log management with retention and integrity protection makes recorded sessions usable audit evidence."
  },
  {
    "risk_id": "ot-4-r2",
    "control_id": "c-05",
    "rationale": "Regular restore tests verify engineering backups are actually recoverable, directly reducing impact."
  },
  {
    "risk_id": "ot-4-r3",
    "control_id": "inc-comm-1",
    "rationale": "Documented 24h early-warning procedure and tested BSI portal access directly prevent late notification.; ADD b-12: Reporting workflow with automated deadline monitoring directly enforces the 24h/72h clocks."
  },
  {
    "risk_id": "ai-1-r1",
    "control_id": "tech-16",
    "rationale": "Endpoint/web DLP technically blocks confidential data leaving to unapproved AI services.; ADD tech-04: Web filtering enforces the approved-tool whitelist by blocking unapproved AI sites."
  },
  {
    "risk_id": "ai-1-r2",
    "control_id": "org-20",
    "rationale": "Systematic identification and mapping of legal requirements operationalizes AI Act compliance tracking."
  },
  {
    "risk_id": "ai-1-r3",
    "control_id": "ai-3",
    "rationale": "AI red teaming explicitly tests for bias, directly detecting discriminatory model behaviour before harm."
  },
  {
    "risk_id": "ai-3-r2",
    "control_id": "tech-02",
    "rationale": "RBAC, MFA and logging on repositories/dev tools directly close the missing access-control gap."
  },
  {
    "risk_id": "ai-4-r2",
    "control_id": "d-12",
    "rationale": "Contingency plans and fallback strategies for critical providers directly reduce outage impact."
  },
  {
    "risk_id": "ai-5-r1",
    "control_id": "ai-3",
    "rationale": "Red teaming reduces injection likelihood; ai-5 measures only handle the aftermath."
  },
  {
    "risk_id": "ai-5-r3",
    "control_id": "inc-17",
    "rationale": "Forensic readiness plan, toolkit and chain of custody make AI logs usable in investigations."
  },
  {
    "risk_id": "vul-7-r3",
    "control_id": "vul-9",
    "rationale": "Patch SLA matrix, automated deployment and monthly KPI reporting directly enforce remediation deadlines."
  },
  {
    "risk_id": "vul-9-r2",
    "control_id": "ot-3",
    "rationale": "OT-aware discovery, CVE triage and maintenance windows close the OT patching gap named."
  },
  {
    "risk_id": "sup-03-r2",
    "control_id": "d-12",
    "rationale": "Contingency plans and fallback providers directly limit cascading outage impact.; ADD sup-04: Supplier incident notification and escalation enable rapid containment."
  },
  {
    "risk_id": "sup-04-r1",
    "control_id": "inc-comm-1",
    "rationale": "Own 24h early-warning procedure and tested BSI portal access protect the deadline."
  },
  {
    "risk_id": "sup-04-r3",
    "control_id": "d-08",
    "rationale": "Contractual log provision and integrity verification preserve supplier-side evidence.; ADD inc-17: Forensic readiness and chain-of-custody documentation keep evidence usable."
  },
  {
    "risk_id": "sup-05-r1",
    "control_id": "d-10",
    "rationale": "Embeds geopolitical risk assessment directly in supplier evaluation and procurement."
  },
  {
    "risk_id": "sup-7-r3",
    "control_id": "d-12",
    "rationale": "Fallback strategies and alternative providers reduce impact of concentrated supplier failure."
  },
  {
    "risk_id": "sup-8-r2",
    "control_id": "d-08",
    "rationale": "Contractually anchored log provision compels forensic data sharing.; ADD sup-04: Named escalation contacts and joint exercises operationalise crisis cooperation."
  },
  {
    "risk_id": "sup-8-r3",
    "control_id": "sup-01",
    "rationale": "Subcontractor disclosure duty, list reviews and audits enforce requirement flow-down."
  },
  {
    "risk_id": "sup-9-r1",
    "control_id": "d-11",
    "rationale": "Automated SBOM tooling and OSS vulnerability scanning operationalise component visibility beyond contracts."
  },
  {
    "risk_id": "cry-pq-2-r3",
    "control_id": "org-13",
    "rationale": "Secure transfer policy, protocols and monitoring directly govern third-party data exchanges."
  },
  {
    "risk_id": "reg-01-r2",
    "control_id": "e-19",
    "rationale": "Central advisory intake and escalation ensures vulnerability warnings reach the organisation regardless of channel."
  },
  {
    "risk_id": "awr-13-r1",
    "control_id": "tech-06",
    "rationale": "Email gateway ATP and URL filtering block phishing before user interaction.; ADD iam-mfa-4: Phishing-resistant FIDO2/anti-AiTM MFA limits impact of stolen credentials."
  },
  {
    "risk_id": "inc-comm-1-r1",
    "control_id": "b-12",
    "rationale": "Reporting workflow with automated deadline monitoring directly prevents missing 24h deadline.; ADD b-09: Classification thresholds trigger timely recognition that the 24h clock has started."
  },
  {
    "risk_id": "inc-comm-1-r2",
    "control_id": "org-04",
    "rationale": "Central, maintained authority contact list directly prevents addressing the wrong authority."
  },
  {
    "risk_id": "inc-comm-1-r3",
    "control_id": "b-02",
    "rationale": "Central contact list with emergency access and training directly fixes unknown contacts/channels."
  },
  {
    "risk_id": "inc-comm-2-r1",
    "control_id": "b-12",
    "rationale": "Automated deadline monitoring in the reporting workflow directly prevents missing the 72h deadline."
  },
  {
    "risk_id": "inc-comm-3-r1",
    "control_id": "b-12",
    "rationale": "Automated deadline monitoring covers the one-month final-report deadline."
  },
  {
    "risk_id": "inc-comm-3-r3",
    "control_id": "risk-03",
    "rationale": "Risk treatment plan with explicit effectiveness measurement of actions directly closes this gap."
  },
  {
    "risk_id": "inc-17-r1",
    "control_id": "a-10",
    "rationale": "Central log management with retention and integrity protection preserves log evidence from overwrite."
  },
  {
    "risk_id": "inc-17-r3",
    "control_id": "b-13",
    "rationale": "Provides regular forensic training and exercises for the IRT, covering the unmitigated 'untrained' half."
  },
  {
    "risk_id": "dev-12-r1",
    "control_id": "tech-08",
    "rationale": "Mandatory security-focused peer code reviews catch flaws automated SAST/DAST gates miss."
  },
  {
    "risk_id": "dev-12-r2",
    "control_id": "d-11",
    "rationale": "SBOM tooling, continuous OSS scanning and patch process cover detection and remediation beyond build-time SCA."
  },
  {
    "risk_id": "dev-12-r3",
    "control_id": "e-14",
    "rationale": "Security requirements integrated into every SDLC phase address insecure design before implementation."
  }
];
export const reviewMeasureUnmappings: MeasureUnmapping[] = [
  {
    "risk_id": "a-04-r2",
    "measure_id": "a-04-m4",
    "rationale": "Vulnerability-management integration does not mitigate licensing/compliance exposure."
  },
  {
    "risk_id": "org-14-r2",
    "measure_id": "org-14-m4",
    "rationale": "MFA does not mitigate misuse by an already-authenticated, authorized insider."
  },
  {
    "risk_id": "a-17-r4",
    "measure_id": "a-17-m5",
    "rationale": "DLP prevents exfiltration; it does not mitigate overload/availability disruption."
  },
  {
    "risk_id": "g-13-r3",
    "measure_id": "g-13-m2",
    "rationale": "Permission reviews address excess rights, not expiry-driven outages."
  },
  {
    "risk_id": "b-12-r3",
    "measure_id": "b-12-m3",
    "rationale": "Authority report templates do not speed internal incident response or limit damage spread.; UNMAP b-12-m4: Regulatory deadline alerts do not reduce containment or recovery time."
  },
  {
    "risk_id": "b-14-r1",
    "measure_id": "b-14-m3",
    "rationale": "DDoS mitigation playbook does not mitigate ransomware likelihood or impact."
  },
  {
    "risk_id": "b-14-r2",
    "measure_id": "b-14-m1",
    "rationale": "Ransomware playbook does not mitigate phishing containment speed.; UNMAP b-14-m3: DDoS playbook is unrelated to phishing incidents."
  },
  {
    "risk_id": "b-14-r3",
    "measure_id": "b-14-m1",
    "rationale": "Ransomware playbook does not mitigate DDoS attacks.; UNMAP b-14-m2: Phishing runbook is unrelated to DDoS mitigation."
  },
  {
    "risk_id": "c-12-r2",
    "measure_id": "c-12-m1",
    "rationale": "Hardware redundancy does not mitigate software bugs or configuration errors.; UNMAP c-12-m3: Network redundancy is irrelevant to application-level software faults."
  },
  {
    "risk_id": "c-13-r2",
    "measure_id": "c-13-m4",
    "rationale": "Usage training does not affect data currency or completeness at emergency workstations."
  },
  {
    "risk_id": "c-13-r3",
    "measure_id": "c-13-m2",
    "rationale": "Provisioning workstations does not improve employee familiarity with procedures.; UNMAP c-13-m5: Data availability mechanisms do not address lack of user familiarity."
  },
  {
    "risk_id": "org-22-r1",
    "measure_id": "org-22-m5",
    "rationale": "Encryption does not reduce likelihood or impact of accidental deletion/overwrite."
  },
  {
    "risk_id": "org-22-r3",
    "measure_id": "org-22-m3",
    "rationale": "Access control does not mitigate hardware defects or software errors.; UNMAP org-22-m5: Encryption does not reduce loss from technical system failure."
  },
  {
    "risk_id": "org-22-r4",
    "measure_id": "org-22-m5",
    "rationale": "Encryption does not affect retention-period compliance or findability of records."
  },
  {
    "risk_id": "org-24-r1",
    "measure_id": "org-24-m4",
    "rationale": "Legal compliance review does not detect technical vulnerabilities or misconfigurations."
  },
  {
    "risk_id": "org-24-r2",
    "measure_id": "org-24-m3",
    "rationale": "Penetration tests do not detect gaps in tracking legal/regulatory changes."
  },
  {
    "risk_id": "f-07-r3",
    "measure_id": "f-07-m1",
    "rationale": "Annual review cadence cannot mitigate a real-time incident-escalation failure.; UNMAP f-07-m5: Strategic planning integration does not affect timeliness of incident reporting."
  },
  {
    "risk_id": "a-12-r2",
    "measure_id": "a-12-m2",
    "rationale": "Phishing simulations do not mitigate insecure data storage or device loss."
  },
  {
    "risk_id": "ppl-02-r2",
    "measure_id": "ppl-02-m3",
    "rationale": "Adjusting rights on internal role changes does not mitigate non-return of assets at departure."
  },
  {
    "risk_id": "ppl-03-r2",
    "measure_id": "ppl-03-m1",
    "rationale": "Employee NDA template does not mitigate a risk about external service providers."
  },
  {
    "risk_id": "g-06-r2",
    "measure_id": "g-06-m2",
    "rationale": "Phishing simulations do not mitigate insecure storage, sharing or disposal of data."
  },
  {
    "risk_id": "g-08-r1",
    "measure_id": "g-08-m4",
    "rationale": "Social engineering awareness does not reduce misconfiguration likelihood or impact."
  },
  {
    "risk_id": "g-08-r2",
    "measure_id": "g-08-m3",
    "rationale": "DevSecOps training does not affect incident response speed or effectiveness.; UNMAP g-08-m4: Social engineering awareness does not mitigate slow or ineffective incident response."
  },
  {
    "risk_id": "g-08-r3",
    "measure_id": "g-08-m3",
    "rationale": "DevSecOps training has no causal link to social engineering resistance."
  },
  {
    "risk_id": "g-10-r2",
    "measure_id": "g-10-m4",
    "rationale": "Malware scanning of USB devices does not prevent outbound data exfiltration."
  },
  {
    "risk_id": "aw-01-r2",
    "measure_id": "aw-01-m2",
    "rationale": "IT staff training does not change management investment behavior; UNMAP aw-01-m4: Department awareness materials do not address management prioritization; UNMAP aw-01-m5: Phishing simulations irrelevant to management budget decisions; UNMAP aw-01-m6: New-hire onboarding training does not reach existing management"
  },
  {
    "risk_id": "aw-01-r3",
    "measure_id": "aw-01-m5",
    "rationale": "Phishing simulations do not address data-handling errors; UNMAP aw-01-m2: IT-staff technical training does not mitigate departmental data mishandling."
  },
  {
    "risk_id": "i-04-r2",
    "measure_id": "i-04-m4",
    "rationale": "Visitor escorting policy does not mitigate misuse by authorized insiders"
  },
  {
    "risk_id": "i-04-r3",
    "measure_id": "i-04-m2",
    "rationale": "Permission reviews do not prevent technical failure or tampering of the ACS; UNMAP i-04-m4: Visitor policy irrelevant to ACS failure/manipulation"
  },
  {
    "risk_id": "i-04-r4",
    "measure_id": "i-04-m2",
    "rationale": "Permission reviews do not improve event logging; UNMAP i-04-m4: Visitor escorting does not improve event logging"
  },
  {
    "risk_id": "phy-04-r2",
    "measure_id": "phy-04-m5",
    "rationale": "Mobile-phone/camera prohibition does not prevent manipulation of systems"
  },
  {
    "risk_id": "phy-04-r3",
    "measure_id": "phy-04-m5",
    "rationale": "Recording-device ban does not prevent physical theft of equipment"
  },
  {
    "risk_id": "phy-06-r1",
    "measure_id": "phy-06-m3",
    "rationale": "Environmental monitoring does not mitigate unauthorized human access."
  },
  {
    "risk_id": "phy-06-r2",
    "measure_id": "phy-06-m1",
    "rationale": "Access control systems do not mitigate fire/water/HVAC failures.; UNMAP phy-06-m2: Video surveillance/intrusion detection irrelevant to environmental damage."
  },
  {
    "risk_id": "phy-06-r3",
    "measure_id": "phy-06-m3",
    "rationale": "Environmental monitoring does not deter or detect deliberate sabotage."
  },
  {
    "risk_id": "phy-05-r1",
    "measure_id": "phy-05-m2",
    "rationale": "Water-leak sensors do not mitigate fire.; UNMAP phy-05-m3: UPS does not reduce fire likelihood or impact.; UNMAP phy-05-m4: Emergency generator irrelevant to fire risk."
  },
  {
    "risk_id": "phy-05-r2",
    "measure_id": "phy-05-m1",
    "rationale": "Fire detection/suppression does not mitigate water ingress.; UNMAP phy-05-m3: UPS irrelevant to water damage.; UNMAP phy-05-m4: Emergency generator irrelevant to water damage."
  },
  {
    "risk_id": "phy-05-r3",
    "measure_id": "phy-05-m1",
    "rationale": "Fire systems do not mitigate power outage or surge.; UNMAP phy-05-m2: Water-leak sensors irrelevant to power events.; UNMAP phy-05-m5: AC maintenance does not mitigate power outage/surge."
  },
  {
    "risk_id": "phy-05-r4",
    "measure_id": "phy-05-m1",
    "rationale": "Fire systems do not mitigate AC failure.; UNMAP phy-05-m3: UPS does not prevent or detect cooling failure.; UNMAP phy-05-m4: Generator does not prevent or detect cooling failure."
  },
  {
    "risk_id": "phy-07-r2",
    "measure_id": "phy-07-m1",
    "rationale": "At-rest encryption does not mitigate malware/phishing credential theft.; UNMAP phy-07-m4: Physical handling instructions irrelevant to malware compromise."
  },
  {
    "risk_id": "phy-09-r1",
    "measure_id": "phy-09-m5",
    "rationale": "AC maintenance plans do not mitigate power supply failure."
  },
  {
    "risk_id": "phy-09-r2",
    "measure_id": "phy-09-m5",
    "rationale": "AC maintenance irrelevant to UPS/generator failure."
  },
  {
    "risk_id": "phy-08-r1",
    "measure_id": "phy-08-m3",
    "rationale": "Disposal/deletion procedures do not mitigate loss of in-use media."
  },
  {
    "risk_id": "phy-08-r3",
    "measure_id": "phy-08-m3",
    "rationale": "Deletion/disposal procedures do not mitigate transport damage."
  },
  {
    "risk_id": "phy-11-r2",
    "measure_id": "phy-11-m4",
    "rationale": "Spare parts management does not mitigate software vulnerabilities.; UNMAP phy-11-m5: Environmental condition review irrelevant to outdated software."
  },
  {
    "risk_id": "tech-02-r4",
    "measure_id": "tech-02-m1",
    "rationale": "RBAC does not mitigate a logging deficiency.; UNMAP tech-02-m3: Access recertification does not improve logging or traceability.; UNMAP tech-02-m4: MFA does not mitigate missing or insufficient logging."
  },
  {
    "risk_id": "tech-03-r2",
    "measure_id": "tech-03-m4",
    "rationale": "Account lockout does not mitigate interception of credentials in transit.; UNMAP tech-03-m2: Password strength does not reduce interception of credentials in transit."
  },
  {
    "risk_id": "tech-03-r3",
    "measure_id": "tech-03-m3",
    "rationale": "Transport encryption does not reduce brute-force guessing likelihood or impact."
  },
  {
    "risk_id": "e-13-r2",
    "measure_id": "e-13-m1",
    "rationale": "Deploying NIDS/NIPS does not mitigate false-positive blocking; it is the risk source.; UNMAP e-13-m2: Deploying HIDS/HIPS likewise creates rather than mitigates this risk."
  },
  {
    "risk_id": "j-05-r2",
    "measure_id": "j-05-m1",
    "rationale": "DNSSEC authenticates responses; it neither prevents nor detects tunneling over legitimate DNS."
  },
  {
    "risk_id": "j-05-r3",
    "measure_id": "j-05-m1",
    "rationale": "DNSSEC does not mitigate DDoS; larger signed responses can worsen amplification.; UNMAP j-05-m2: Client-side encrypted DNS is irrelevant to server overload.; UNMAP j-05-m4: Domain blocklists do not stop volumetric attacks against DNS servers.; UNMAP j-05-m5: Awareness training cannot mitigate a volumetric DDoS attack."
  },
  {
    "risk_id": "j-05-r4",
    "measure_id": "j-05-m1",
    "rationale": "DNSSEC provides integrity/authenticity, not confidentiality; queries remain plaintext.; UNMAP j-05-m4: DNS filtering does not prevent eavesdropping on query traffic."
  },
  {
    "risk_id": "a-08-r2",
    "measure_id": "a-08-m3",
    "rationale": "Pentests find vulnerabilities, not application incompatibilities caused by hardening."
  },
  {
    "risk_id": "j-07-r3",
    "measure_id": "j-07-m1",
    "rationale": "MFA does not mitigate misuse by an already-authenticated, legitimate privileged insider."
  },
  {
    "risk_id": "h-02-r3",
    "measure_id": "h-02-m5",
    "rationale": "HSTS does not reduce outage risk; it can prolong outages when TLS is broken."
  },
  {
    "risk_id": "h-03-r2",
    "measure_id": "h-03-m1",
    "rationale": "FDE is transparent to logical database access; offers no mitigation for this attack path."
  },
  {
    "risk_id": "j-01-r2",
    "measure_id": "j-01-m5",
    "rationale": "Cryptography standards review has no causal link to credential theft via phishing/malware."
  },
  {
    "risk_id": "e-07-r2",
    "measure_id": "e-07-m2",
    "rationale": "Patch-speed compliance targets do not mitigate faulty-patch disruption; they push faster rollout.; UNMAP e-07-m4: Emergency patching accelerates deployment; does not reduce risk of defective patches."
  },
  {
    "risk_id": "e-08-r2",
    "measure_id": "e-08-m2",
    "rationale": "Vulnerability scanning does not reduce likelihood or impact of faulty-patch disruptions."
  },
  {
    "risk_id": "j-03-r3",
    "measure_id": "j-03-m3",
    "rationale": "MFA does not reduce likelihood or impact of denial-of-service attacks.; UNMAP j-03-m4: User awareness training does not mitigate DoS against the platform."
  },
  {
    "risk_id": "e-16-r1",
    "measure_id": "e-16-m5",
    "rationale": "Data masking in non-prod protects confidentiality; irrelevant to faulty-code outages."
  },
  {
    "risk_id": "e-16-r3",
    "measure_id": "e-16-m5",
    "rationale": "Masking non-prod data does not reduce risk of untested configurations in production."
  },
  {
    "risk_id": "e-17-r3",
    "measure_id": "e-17-m1",
    "rationale": "Deploying the WAF in blocking mode is the risk source, not a mitigation.; UNMAP e-17-m5: Pentests probe attack paths; they do not detect blocking of legitimate traffic."
  },
  {
    "risk_id": "tech-10-r3",
    "measure_id": "tech-10-m3",
    "rationale": "Irreversible masking protects confidentiality; it does not prevent corruption or manipulation of test data."
  },
  {
    "risk_id": "b-10-r3",
    "measure_id": "b-10-m5",
    "rationale": "Automated response (SOAR) contributes nothing to traceability or compliance evidence."
  },
  {
    "risk_id": "c-01-r3",
    "measure_id": "c-01-m2",
    "rationale": "Backup automation reduces human error, not compromise/theft of backup data."
  },
  {
    "risk_id": "a-10-r2",
    "measure_id": "a-10-m3",
    "rationale": "Log analysis/alerting does not affect retention-period or audit-proof-storage compliance."
  },
  {
    "risk_id": "c-02-r1",
    "measure_id": "c-02-m3",
    "rationale": "Encryption protects confidentiality; it does not reduce backup failure or restorability risk."
  },
  {
    "risk_id": "c-02-r2",
    "measure_id": "c-02-m3",
    "rationale": "Encryption does not reduce data loss from physical destruction of all local copies."
  },
  {
    "risk_id": "c-02-r3",
    "measure_id": "c-02-m1",
    "rationale": "Restore/integrity tests do not protect backup confidentiality.; UNMAP c-02-m2: More copies on more media do not reduce, and may increase, disclosure exposure.; UNMAP c-02-m4: Backup-failure alerts are unrelated to theft or unauthorized access."
  },
  {
    "risk_id": "c-03-r2",
    "measure_id": "c-03-m5",
    "rationale": "DLP prevents exfiltration (confidentiality), not manipulation of backup content."
  },
  {
    "risk_id": "c-03-r3",
    "measure_id": "c-03-m4",
    "rationale": "Physical security of backup media does not mitigate loss of encryption keys.; UNMAP c-03-m5: DLP is irrelevant to key availability."
  },
  {
    "risk_id": "ot-3-r2",
    "measure_id": "ot-3-m2",
    "rationale": "CVE prioritization does not reduce likelihood or impact of scanner-induced device crashes."
  },
  {
    "risk_id": "ot-4-r3",
    "measure_id": "ot-4-m2",
    "rationale": "Engineering backups do not speed up or secure authority notification."
  },
  {
    "risk_id": "ai-4-r1",
    "measure_id": "ai-4-m2",
    "rationale": "Multi-provider abstraction mitigates availability/lock-in, not GDPR transfer risk."
  },
  {
    "risk_id": "ai-4-r2",
    "measure_id": "ai-4-m1",
    "rationale": "DPA/residency/opt-out configuration does nothing against provider outage.; UNMAP ai-4-m3: Model cards and bias assessment do not mitigate availability loss."
  },
  {
    "risk_id": "ai-4-r3",
    "measure_id": "ai-4-m2",
    "rationale": "Provider abstraction layer does not change data-use/training settings at any provider."
  },
  {
    "risk_id": "ai-5-r3",
    "measure_id": "ai-5-m3",
    "rationale": "Kill switch/throttling does not create or preserve forensic evidence."
  },
  {
    "risk_id": "vul-7-r3",
    "measure_id": "vul-7-m3",
    "rationale": "DNS record hygiene has no effect on remediation SLA adherence."
  },
  {
    "risk_id": "vul-9-r3",
    "measure_id": "vul-9-m2",
    "rationale": "Patch automation does not create management visibility or escalation."
  },
  {
    "risk_id": "sup-9-r3",
    "measure_id": "sup-9-m2",
    "rationale": "CVE/KEV triage addresses security vulnerabilities, not license or export compliance."
  },
  {
    "risk_id": "dev-12-r2",
    "measure_id": "dev-12-m2",
    "rationale": "Threat modelling does not detect or remediate CVEs in third-party dependencies."
  }
];

export const reviewRemovedControlIds: ReadonlySet<string> = new Set(
  reviewRemovedControls.map(r => r.control_id),
);

export const reviewRemovedRiskIds: ReadonlySet<string> = new Set(
  reviewRemovedRisks.map(r => r.risk_id),
);

export const reviewRevisedRiskMap: ReadonlyMap<string, RevisedRisk> = new Map(
  reviewRevisedRisks.map(r => [r.risk_id, r]),
);

/** risk_id -> additional control_ids recommended by the review. */
export const reviewAdditionsByRisk: ReadonlyMap<string, CrossMapAddition[]> = (() => {
  const m = new Map<string, CrossMapAddition[]>();
  for (const a of reviewCrossMapAdditions) {
    const arr = m.get(a.risk_id) ?? [];
    arr.push(a);
    m.set(a.risk_id, arr);
  }
  return m;
})();

/** risk_id -> measure_ids the review judged as not mitigating that risk. */
export const reviewUnmappingsByRisk: ReadonlyMap<string, ReadonlySet<string>> = (() => {
  const m = new Map<string, Set<string>>();
  for (const u of reviewMeasureUnmappings) {
    const set = m.get(u.risk_id) ?? new Set<string>();
    set.add(u.measure_id);
    m.set(u.risk_id, set);
  }
  return m as ReadonlyMap<string, ReadonlySet<string>>;
})();
