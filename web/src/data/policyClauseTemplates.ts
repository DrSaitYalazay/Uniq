/**
 * Policy Clause Templates — Best-practice clauses per policy
 * Based on ISO 27001:2022, BSI IT-Grundschutz, NIST CSF 2.0, NIS2 Art.21
 * Language: "Organisation" (not "Firma") — suitable for public & private sector
 */

export interface PolicyClause {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  reason: string;
  reasonEn: string;
  whenRequired: string;
  whenRequiredEn: string;
  sources: string[];
}

export type PolicyClauseMap = Record<string, PolicyClause[]>;

const CLAUSE_TEMPLATES: PolicyClauseMap = {};

// Merge clause files from category modules
import { governanceClauses } from "./clauses/governance";
import { clauseExport as assetData } from "./clauses/assetManagement";
import { clauseData as criticalData } from "./clauses/criticalServices";
import { accessControlClauses } from "./clauses/accessControl";
import { networkSecurityClauses } from "./clauses/networkSecurity";
import { deviceMediaClauses } from "./clauses/deviceMedia";
import { monitoringDetectionClauses } from "./clauses/monitoringDetection";
import { incidentManagementClauses } from "./clauses/incidentManagement";
import { businessContinuityClauses } from "./clauses/businessContinuity";
import { dataProtectionClauses } from "./clauses/dataProtection";
import { supplierSecurityClauses } from "./clauses/supplierSecurity";
import { peopleAwarenessClauses } from "./clauses/peopleAwareness";
import { devChangePhysicalAIClauses } from "./clauses/devChangePhysicalAI";
import { otIcsSecurityClauses } from "./clauses/otIcsSecurity";

const MERGED: PolicyClauseMap = { ...CLAUSE_TEMPLATES };
const modules = [
  governanceClauses, assetData, criticalData, accessControlClauses,
  networkSecurityClauses, deviceMediaClauses, monitoringDetectionClauses,
  incidentManagementClauses, businessContinuityClauses,
  dataProtectionClauses, supplierSecurityClauses, peopleAwarenessClauses,
  devChangePhysicalAIClauses, otIcsSecurityClauses,
];
for (const mod of modules) {
  for (const [k, v] of Object.entries(mod)) { MERGED[k] = v as PolicyClause[]; }
}

// 72 Framework-Delta-Dokumente (320 Klauseln) — Framework-Tags in sources[] eingebettet.
import { DELTA_CLAUSES } from "./deltaDocuments";
for (const [k, v] of Object.entries(DELTA_CLAUSES)) { MERGED[k] = v as PolicyClause[]; }

// Fable5-Revision der 59 Basis-Policies (Katalog v2) — ZULETZT gemergt, gewinnt.
// Grammatik-Fixes (sie→uns, sich→uns, ihre→unsere), Modal-Anpassungen (müssen↔sollten),
// Inhalts-Revisionen + neue Klauseln (p52+/p53+ …). Quelle: UniqSuite-Richtlinien-Katalog_v2.md
import { catalogV2Clauses } from "./clauses/catalogV2";
for (const [k, v] of Object.entries(catalogV2Clauses)) { MERGED[k] = v as PolicyClause[]; }

export default MERGED;
