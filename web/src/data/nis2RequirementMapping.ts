/**
 * NIS2 Requirement Mapping Layer
 *
 * Maps each control to a NIS2 regulatory requirement (Art. 21(2) categories).
 * This is a GROUPING LAYER ONLY — no data duplication.
 * The SoA projection remains the single source of truth.
 */

export type NIS2RequirementId =
  | "risk_management"
  | "incident_management"
  | "business_continuity"
  | "supply_chain"
  | "network_security"
  | "vulnerability_management"
  | "cryptography"
  | "access_control"
  | "asset_management"
  | "governance"
  | "hr_security"
  | "physical_security"
  | "monitoring"
  | "compliance"
  | "data_protection"
  | "secure_development"
  | "cyber_hygiene"
  | "mfa_communication";

export interface NIS2Requirement {
  id: NIS2RequirementId;
  article: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
}

export const nis2Requirements: NIS2Requirement[] = [
  {
    id: "governance",
    article: "Art. 21(2)(a)",
    title: "Konzepte für Risikoanalyse & Sicherheit",
    titleEn: "Risk Analysis & Security Policies",
    description: "Policies on risk analysis and information system security",
    descriptionEn: "Policies on risk analysis and information system security",
  },
  {
    id: "risk_management",
    article: "Art. 21(2)(a)",
    title: "Risikomanagement",
    titleEn: "Risk Management",
    description: "Systematisches Risikomanagement für IT-Systeme",
    descriptionEn: "Systematic risk management for IT systems",
  },
  {
    id: "incident_management",
    article: "Art. 21(2)(b)",
    title: "Bewältigung von Sicherheitsvorfällen",
    titleEn: "Incident Handling",
    description: "Detection, response, and reporting of security incidents",
    descriptionEn: "Detection, response, and reporting of security incidents",
  },
  {
    id: "business_continuity",
    article: "Art. 21(2)(c)",
    title: "Betriebskontinuität & Krisenmanagement",
    titleEn: "Business Continuity & Crisis Management",
    description: "Backup management, disaster recovery, and crisis management",
    descriptionEn: "Backup management, disaster recovery, and crisis management",
  },
  {
    id: "supply_chain",
    article: "Art. 21(2)(d)",
    title: "Sicherheit der Lieferkette",
    titleEn: "Supply Chain Security",
    description: "Security in supplier and service provider relationships",
    descriptionEn: "Security in supplier and service provider relationships",
  },
  {
    id: "network_security",
    article: "Art. 21(2)(e)",
    title: "Netz- und Informationssystemsicherheit",
    titleEn: "Network & Information System Security",
    description: "Security in network and information systems acquisition, development and maintenance",
    descriptionEn: "Security in network and information systems acquisition, development and maintenance",
  },
  {
    id: "vulnerability_management",
    article: "Art. 21(2)(e)",
    title: "Schwachstellenmanagement",
    titleEn: "Vulnerability Management",
    description: "Vulnerability handling and disclosure",
    descriptionEn: "Vulnerability handling and disclosure",
  },
  {
    id: "cryptography",
    article: "Art. 21(2)(h)",
    title: "Kryptographie",
    titleEn: "Cryptography",
    description: "Policies and procedures regarding the use of cryptography and encryption",
    descriptionEn: "Policies and procedures regarding the use of cryptography and encryption",
  },
  {
    id: "access_control",
    article: "Art. 21(2)(i)",
    title: "Zugriffskontrolle",
    titleEn: "Access Control",
    description: "Human resources security, access control policies and asset management",
    descriptionEn: "Human resources security, access control policies and asset management",
  },
  {
    id: "asset_management",
    article: "Art. 21(2)(i)",
    title: "Asset Management",
    titleEn: "Asset Management",
    description: "Asset inventory and classification",
    descriptionEn: "Asset inventory and classification",
  },
  {
    id: "hr_security",
    article: "Art. 21(2)(i)",
    title: "Personalsicherheit & Schulungen",
    titleEn: "HR Security & Training",
    description: "Personnel security and cybersecurity training",
    descriptionEn: "Personnel security and cybersecurity training",
  },
  {
    id: "monitoring",
    article: "Art. 21(2)(f)",
    title: "Bewertung der Wirksamkeit",
    titleEn: "Effectiveness Assessment",
    description: "Policies and procedures to assess the effectiveness of cybersecurity measures",
    descriptionEn: "Policies and procedures to assess the effectiveness of cybersecurity measures",
  },
  {
    id: "compliance",
    article: "Art. 21(2)(f)",
    title: "Compliance & Audit",
    titleEn: "Compliance & Audit",
    description: "Compliance requirements and audit practices",
    descriptionEn: "Compliance requirements and audit practices",
  },
  {
    id: "physical_security",
    article: "Art. 21(2)(i)",
    title: "Physische Sicherheit",
    titleEn: "Physical Security",
    description: "Physical access control and environmental security",
    descriptionEn: "Physical access control and environmental security",
  },
  {
    id: "data_protection",
    article: "Art. 21(2)(e)",
    title: "Datenschutz",
    titleEn: "Data Protection",
    description: "Data protection and privacy controls",
    descriptionEn: "Data protection and privacy controls",
  },
  {
    id: "secure_development",
    article: "Art. 21(2)(e)",
    title: "Sichere Entwicklung",
    titleEn: "Secure Development",
    description: "Secure software development practices",
    descriptionEn: "Secure software development practices",
  },
  {
    id: "cyber_hygiene",
    article: "Art. 21(2)(g)",
    title: "Cyberhygiene & Schulungen",
    titleEn: "Cyber Hygiene & Training",
    description: "Basic cyber hygiene practices and cybersecurity training",
    descriptionEn: "Basic cyber hygiene practices and cybersecurity training",
  },
  {
    id: "mfa_communication",
    article: "Art. 21(2)(j)",
    title: "MFA & gesicherte Kommunikation",
    titleEn: "MFA & Secured Communications",
    description:
      "Use of multi-factor or continuous authentication, secured voice/video/text and emergency communication",
    descriptionEn:
      "Use of multi-factor or continuous authentication, secured voice/video/text and emergency communication",
  },
];

/**
 * Maps familyId → NIS2 requirement ID.
 * This is the bridge between domain-based and regulatory-based views.
 */
const familyToNis2: Record<string, NIS2RequirementId> = {
  governance: "governance",
  risk_mgmt: "risk_management",
  asset_mgmt: "asset_management",
  identity_access_mgmt: "access_control",
  mfa_strong_auth: "mfa_communication",
  supplier_security: "supply_chain",
  incident_mgmt: "incident_management",
  business_continuity: "business_continuity",
  compliance_audit: "compliance",
  personnel_security: "hr_security",
  awareness_training: "cyber_hygiene",
  cryptography: "cryptography",
  endpoint_security: "network_security",
  network_security: "network_security",
  vulnerability_mgmt: "vulnerability_management",
  secure_development: "secure_development",
  monitoring_logging: "monitoring",
  physical_security: "physical_security",
  data_protection: "data_protection",
};

/**
 * Control-ID-level overrides for controls whose NIS2 bucket differs from their family.
 * Used for MFA / secured communication (Art. 21(2)(j)) controls that live in cryptography/
 * network_security/monitoring families but belong regulatorily to (j).
 */
const controlIdToNis2: Record<string, NIS2RequirementId> = {
  "j-01": "mfa_communication",
  "j-02": "mfa_communication",
  "j-03": "mfa_communication",
  "j-04": "mfa_communication",
  "j-05": "mfa_communication",
  "j-06": "mfa_communication",
  "j-07": "mfa_communication",
  "j-08": "mfa_communication",
};

/**
 * Get the NIS2 requirement ID for a given control based on its familyId.
 */
export function getNis2RequirementForFamily(familyId: string): NIS2RequirementId {
  return familyToNis2[familyId] ?? "governance";
}

/**
 * Get the NIS2 requirement ID for a control, applying per-control overrides
 * (e.g. MFA controls reclassified to Art. 21(2)(j)) before falling back to the family map.
 */
export function getNis2RequirementForControl(
  controlId: string,
  familyId: string,
): NIS2RequirementId {
  return controlIdToNis2[controlId] ?? familyToNis2[familyId] ?? "governance";
}

export function getNis2RequirementById(id: NIS2RequirementId): NIS2Requirement | undefined {
  return nis2Requirements.find(r => r.id === id);
}

// ── Article-level (Art. 21(2)(a)–(j)) abstraction ──

export interface NIS2Article {
  article: string;       // e.g. "Art. 21(2)(a)"
  letter: string;        // e.g. "a"
  title: string;         // DE
  titleEn: string;       // EN
  bsig: string;          // NIS2 article reference (kept name `bsig` for backward compatibility)
}

/**
 * Canonical 10 NIS2 Art. 21(2) measures (a–j) — the regulatory abstraction layer.
 * Used as primary grouping for the "NIS2 Ansicht" across Steps 11, 12, 16, 17.
 */
export const nis2Articles: NIS2Article[] = [
  { article: "Art. 21(2)(a)", letter: "a", title: "Risikoanalyse & Sicherheitskonzepte",                titleEn: "Risk analysis & security policies",                   bsig: "NIS2 Art. 21(2)" },
  { article: "Art. 21(2)(b)", letter: "b", title: "Bewältigung von Sicherheitsvorfällen",                titleEn: "Incident handling",                                    bsig: "NIS2 Art. 21(2)" },
  { article: "Art. 21(2)(c)", letter: "c", title: "Betriebskontinuität (Backup, Krisenmgmt., DR)",       titleEn: "Business continuity (backup, crisis mgmt., DR)",       bsig: "NIS2 Art. 21(2)" },
  { article: "Art. 21(2)(d)", letter: "d", title: "Sicherheit der Lieferkette",                          titleEn: "Supply chain security",                                 bsig: "NIS2 Art. 21(2)" },
  { article: "Art. 21(2)(e)", letter: "e", title: "Sicherheit bei Erwerb, Entwicklung & Wartung",       titleEn: "Security in acquisition, development & maintenance",   bsig: "NIS2 Art. 21(2)" },
  { article: "Art. 21(2)(f)", letter: "f", title: "Bewertung der Wirksamkeit",                            titleEn: "Effectiveness assessment",                              bsig: "NIS2 Art. 21(2)" },
  { article: "Art. 21(2)(g)", letter: "g", title: "Cyberhygiene & Schulungen",                            titleEn: "Cyber hygiene & training",                              bsig: "NIS2 Art. 21(2)" },
  { article: "Art. 21(2)(h)", letter: "h", title: "Kryptographie & Verschlüsselung",                     titleEn: "Cryptography & encryption",                             bsig: "NIS2 Art. 21(2)" },
  { article: "Art. 21(2)(i)", letter: "i", title: "Personalsicherheit, Zugriff & Asset-Mgmt.",            titleEn: "HR security, access control & asset mgmt.",            bsig: "NIS2 Art. 21(2)" },
  { article: "Art. 21(2)(j)", letter: "j", title: "MFA & gesicherte Kommunikation",                       titleEn: "MFA & secured communications",                          bsig: "NIS2 Art. 21(2)" },
];

/**
 * Resolve the NIS2 article string ("Art. 21(2)(x)") for a control.
 * Goes via control-level override → family map → requirement record.
 */
export function getNis2ArticleForControl(controlId: string, familyId: string): string {
  const reqId = getNis2RequirementForControl(controlId, familyId);
  const req = getNis2RequirementById(reqId);
  return req?.article ?? "Art. 21(2)(a)";
}

/**
 * Return all sub-requirement records that roll up into a given article.
 * Used for the drill-down panel under each article card.
 */
export function getRequirementsForArticle(article: string): NIS2Requirement[] {
  return nis2Requirements.filter(r => r.article === article);
}

export function getNis2ArticleByString(article: string): NIS2Article | undefined {
  return nis2Articles.find(a => a.article === article);
}
