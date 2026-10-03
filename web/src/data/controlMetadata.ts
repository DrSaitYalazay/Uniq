/**
 * Control Metadata — Dual-Layer Classification
 * 
 * Every control is assigned:
 *   scope: "asset" | "organization"
 *   applicable_to: AssetClassId[] (only for scope="asset"; empty → all asset classes)
 *   conditions?: { field: string; value: string | boolean }[] (optional asset-field filters)
 * 
 * Organization-scoped controls run ONCE per org (governance, policy, process).
 * Asset-scoped controls run PER ASSET, filtered by class + conditions.
 */

import type { AssetClassId } from "./controlEngine";

export type ControlScope = "asset" | "organization";

export interface ControlMeta {
  scope: ControlScope;
  /** For asset-scoped: which asset classes this control applies to. Empty array = ALL classes. */
  applicable_to: AssetClassId[];
  /**
   * Optional ZOK Level-2 sub-class restriction (Phase 2 drill-down).
   *
   * Curation rules:
   *  - Empty/undefined = applies to ALL Level-2 leaves of the root (default,
   *    backwards compatible). Most controls should leave this undefined.
   *  - Set ONLY when a control is genuinely inappropriate for some leaves
   *    of an otherwise-applicable root (e.g. a remote-access control that
   *    only makes sense for `fernwartung_ot`, not for `sensoren_aktoren`).
   *  - Assets tagged at root level (no Level-2 leaf) always receive the
   *    control regardless of this field.
   *  - Restricting too aggressively SHRINKS the compliance denominator and
   *    can distort scoring — only annotate when the BSI Grundschutz++ /
   *    NIS2 mapping clearly justifies it.
   *
   * Example: ["scada_leitsystem", "safety_systems"]
   */
  applicable_to_sub?: string[];
  /** Optional conditions on asset fields (e.g. external_exposure, environment, data_sensitivity) */
  conditions?: { field: string; value: string | boolean }[];
  /** Which control family this belongs to (for UI grouping only) */
  familyId: string;
  /**
   * Optional link to a related organization-level control.
   * RULES:
   *  - Only valid on asset-scoped controls (scope === "asset").
   *  - The referenced control MUST have scope === "organization".
   *  - If set AND the org control has been answered, a read-only reference
   *    is shown in the asset assessment ("Related org control: [status]").
   *  - The org control is NEVER editable from the asset assessment.
   *  - If the org control has NOT been answered, no reference is shown.
   */
  related_org_control_id?: string;
}

/**
 * Master metadata map — one entry per control ID.
 * 236 controls total.
 */
export const controlMetadata: Record<string, ControlMeta> = {

  // ═══════════════════════════════════════════════════
  // ORGANIZATION-SCOPE CONTROLS (~102)
  // ═══════════════════════════════════════════════════

  // --- Governance (orgPolicies) ---
  "a-01":    { scope: "organization", applicable_to: [], familyId: "governance" },
  "a-13":    { scope: "organization", applicable_to: [], familyId: "governance" },
  "org-01":  { scope: "organization", applicable_to: [], familyId: "governance" },
  "org-02":  { scope: "organization", applicable_to: [], familyId: "governance" },
  "org-03":  { scope: "organization", applicable_to: [], familyId: "governance" },
  "org-04":  { scope: "organization", applicable_to: [], familyId: "governance" },
  "a-14":    { scope: "organization", applicable_to: [], familyId: "governance" },
  "org-06":  { scope: "organization", applicable_to: [], familyId: "governance" },
  "gov-01":  { scope: "organization", applicable_to: [], familyId: "governance" },
  "gov-02":  { scope: "organization", applicable_to: [], familyId: "governance" },
  "reg-01":  { scope: "organization", applicable_to: [], familyId: "governance" },
  "reg-02":  { scope: "organization", applicable_to: [], familyId: "governance" },
  "gov-03":  { scope: "organization", applicable_to: [], familyId: "governance" },
  "gov-04":  { scope: "organization", applicable_to: [], familyId: "governance" },

  // --- Risk Management (orgRisk) ---
  "a-02":    { scope: "organization", applicable_to: [], familyId: "risk_mgmt" },
  // a-07 (Datenklassifizierung) — moved from risk_mgmt to data_protection
  // (information-asset / data-governance discipline, not risk mgmt).
  "a-07":    { scope: "organization", applicable_to: [], familyId: "data_protection" },
  "org-07":  { scope: "organization", applicable_to: [], familyId: "risk_mgmt" },
  "org-08":  { scope: "organization", applicable_to: [], familyId: "risk_mgmt" },
  "a-15":    { scope: "organization", applicable_to: [], familyId: "risk_mgmt" },
  "risk-01": { scope: "organization", applicable_to: [], familyId: "risk_mgmt" },
  "risk-02": { scope: "organization", applicable_to: [], familyId: "risk_mgmt" },
  "risk-03": { scope: "organization", applicable_to: [], familyId: "risk_mgmt" },

  // --- Asset Management Policies ---
  "org-09":  { scope: "organization", applicable_to: [], familyId: "asset_mgmt" },
  "org-10":  { scope: "organization", applicable_to: [], familyId: "asset_mgmt" },
  "org-11":  { scope: "organization", applicable_to: [], familyId: "asset_mgmt" },
  "org-12":  { scope: "organization", applicable_to: [], familyId: "asset_mgmt" },
  "org-13":  { scope: "organization", applicable_to: [], familyId: "asset_mgmt" },

  // --- Access Control Policies ---
  "org-14":  { scope: "organization", applicable_to: [], familyId: "identity_access_mgmt" },
  "org-15":  { scope: "organization", applicable_to: [], familyId: "identity_access_mgmt" },
  "org-16":  { scope: "organization", applicable_to: [], familyId: "identity_access_mgmt" },
  "org-17":  { scope: "organization", applicable_to: [], familyId: "identity_access_mgmt" },

  // --- Supplier Security (ALL organization) ---
  "d-01":    { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "d-02":    { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "d-03":    { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "d-04":    { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "d-05":    { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "d-06":    { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "d-07":    { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "d-08":    { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "d-09":    { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "d-10":    { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "d-11":    { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "d-12":    { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "d-13":    { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "org-18":  { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "sup-01":  { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "sup-02":  { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "sup-03":  { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "sup-04":  { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "sup-05":  { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "sup-06":  { scope: "organization", applicable_to: [], familyId: "supplier_security" },

  // --- Incident Management (ALL organization) ---
  "b-01":    { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },
  "b-02":    { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },
  "b-03":    { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },
  "b-04":    { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },
  "b-05":    { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },
  "b-06":    { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },
  "b-07":    { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },
  "b-08":    { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },
  "b-09":    { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },
  "b-11":    { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },
  "b-12":    { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },
  "b-13":    { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },
  "b-14":    { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },
  "inc-01":  { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },

  // --- Business Continuity (process-level) ---
  "c-06":    { scope: "organization", applicable_to: [], familyId: "business_continuity" },
  "c-07":    { scope: "organization", applicable_to: [], familyId: "business_continuity" },
  "c-08":    { scope: "organization", applicable_to: [], familyId: "business_continuity" },
  "c-09":    { scope: "organization", applicable_to: [], familyId: "business_continuity" },
  "c-10":    { scope: "organization", applicable_to: [], familyId: "business_continuity" },
  "c-13":    { scope: "organization", applicable_to: [], familyId: "business_continuity" },
  "org-19":  { scope: "organization", applicable_to: [], familyId: "business_continuity" },
  "cont-01": { scope: "organization", applicable_to: [], familyId: "business_continuity" },
  "cont-02": { scope: "organization", applicable_to: [], familyId: "business_continuity" },

  // --- Compliance & Audit (ALL organization) ---
  "org-20":  { scope: "organization", applicable_to: [], familyId: "compliance_audit" },
  "org-22":  { scope: "organization", applicable_to: [], familyId: "compliance_audit" },
  "org-24":  { scope: "organization", applicable_to: [], familyId: "compliance_audit" },
  "org-25":  { scope: "organization", applicable_to: [], familyId: "compliance_audit" },
  "f-01":    { scope: "organization", applicable_to: [], familyId: "compliance_audit" },
  "f-02":    { scope: "organization", applicable_to: [], familyId: "compliance_audit" },
  "f-03":    { scope: "organization", applicable_to: [], familyId: "compliance_audit" },
  "f-04":    { scope: "organization", applicable_to: [], familyId: "compliance_audit" },
  "f-05":    { scope: "organization", applicable_to: [], familyId: "compliance_audit" },
  "f-06":    { scope: "organization", applicable_to: [], familyId: "compliance_audit" },
  "f-07":    { scope: "organization", applicable_to: [], familyId: "compliance_audit" },
  // --- Personnel Security (ALL organization) ---
  "i-01":    { scope: "organization", applicable_to: [], familyId: "personnel_security" },
  "i-02":    { scope: "organization", applicable_to: [], familyId: "personnel_security" },
  "i-03":    { scope: "organization", applicable_to: [], familyId: "personnel_security" },
  "ppl-01":  { scope: "organization", applicable_to: [], familyId: "personnel_security" },
  "ppl-02":  { scope: "organization", applicable_to: [], familyId: "personnel_security" },
  "ppl-03":  { scope: "organization", applicable_to: [], familyId: "personnel_security" },

  // --- Awareness & Training (ALL organization) ---
  "a-12":    { scope: "organization", applicable_to: [], familyId: "awareness_training" },
  "g-06":    { scope: "organization", applicable_to: [], familyId: "awareness_training" },
  "g-07":    { scope: "organization", applicable_to: [], familyId: "awareness_training" },
  "g-08":    { scope: "organization", applicable_to: [], familyId: "awareness_training" },
  "g-12":    { scope: "organization", applicable_to: [], familyId: "awareness_training" },
  "g-01":    { scope: "organization", applicable_to: [], familyId: "identity_access_mgmt" },
  "g-11":    { scope: "organization", applicable_to: [], familyId: "awareness_training" },
  "g-10":    { scope: "organization", applicable_to: [], familyId: "awareness_training" },
  "i-10":    { scope: "organization", applicable_to: [], familyId: "awareness_training" },
  "i-06":    { scope: "organization", applicable_to: [], familyId: "awareness_training" },
  "ppl-04":  { scope: "organization", applicable_to: [], familyId: "awareness_training" },
  "aw-01":   { scope: "organization", applicable_to: [], familyId: "awareness_training" },
  "aw-02":   { scope: "organization", applicable_to: [], familyId: "awareness_training" },

  // --- Crypto Policy (organization-level) ---
  "h-01":    { scope: "organization", applicable_to: [], familyId: "cryptography" },

  // --- Change Management (organization-level) ---
  "a-18":    { scope: "organization", applicable_to: [], familyId: "secure_development" },

  // ═══════════════════════════════════════════════════
  // ASSET-SCOPE CONTROLS (~104)
  // ═══════════════════════════════════════════════════

  // --- Asset Inventory (per asset) ---
  "a-03":  {
    // Hardware inventory — only physical/technical asset classes.
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "ics_ot", "iot"],
    familyId: "asset_mgmt",
  },
  "a-04":  {
    // Software inventory — applications only.
    scope: "asset", applicable_to: ["anwendungen"], familyId: "asset_mgmt",
  },
  "a-16":  {
    scope: "asset", applicable_to: ["anwendungen", "lieferanten"],
    familyId: "asset_mgmt",
  },
  "a-17":  {
    // Data flows — between information, applications and systems.
    scope: "asset",
    applicable_to: ["informationen", "anwendungen", "it_systeme"],
    familyId: "asset_mgmt",
  },

  // --- IAM (asset-level technical) ---
  // Paket B hygiene: user-lifecycle / authentication controls bind to systems
  // that grant access (anwendungen, it_systeme, nutzende). Pure data assets
  // ("informationen") are governed via access-review (i-09) and crypto/KMS
  // controls — applying user-lifecycle questions to a database row is a
  // category mismatch.
  "g-03":  {
    scope: "asset",
    applicable_to: ["nutzende", "anwendungen", "it_systeme"],
    familyId: "identity_access_mgmt",
    related_org_control_id: "org-14",
  },
  "g-04":  {
    scope: "asset",
    applicable_to: ["nutzende", "anwendungen", "it_systeme"],
    familyId: "identity_access_mgmt",
    related_org_control_id: "org-15",
  },
  "i-09":  {
    scope: "asset",
    applicable_to: ["nutzende", "anwendungen", "informationen"],
    familyId: "identity_access_mgmt",
    related_org_control_id: "org-16",
  },
  "g-13":  {
    scope: "asset",
    applicable_to: ["nutzende", "anwendungen", "it_systeme"],
    familyId: "identity_access_mgmt",
    related_org_control_id: "org-17",
  },

  // --- Business Continuity (asset-level: redundancy, DR) ---
  "c-11":  {
    scope: "asset",
    applicable_to: ["it_systeme", "informationen", "anwendungen"],
    familyId: "business_continuity",
    related_org_control_id: "c-06",
  },
  "c-12":  {
    scope: "asset",
    applicable_to: ["it_systeme", "informationen", "anwendungen", "netze"],
    familyId: "business_continuity",
    related_org_control_id: "c-07",
  },

  // --- Physical Access (asset-level) ---
  "i-04":  {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "ics_ot", "standorte"],
    familyId: "physical_security",
  },
  "i-05":  {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "ics_ot", "standorte"],
    familyId: "physical_security",
  },
  "phy-01": {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "ics_ot", "standorte"],
    familyId: "physical_security",
  },
  "phy-02": {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "standorte"],
    familyId: "physical_security",
  },
  "phy-03": {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "ics_ot", "standorte"],
    familyId: "physical_security",
  },
  "phy-04": {
    scope: "asset",
    applicable_to: ["it_systeme", "ics_ot", "standorte"],
    familyId: "physical_security",
  },

  // --- Equipment & Environmental Security ---
  "phy-05": {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "ics_ot", "standorte"],
    familyId: "physical_security",
  },
  "phy-06": {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "standorte"],
    familyId: "physical_security",
  },
  "phy-07": {
    scope: "asset",
    applicable_to: ["it_systeme"],
    familyId: "physical_security",
  },
  "phy-08": {
    scope: "asset",
    applicable_to: ["it_systeme", "informationen"],
    familyId: "physical_security",
  },
  "phy-09": {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "standorte"],
    familyId: "physical_security",
  },
  "phy-10": {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "ics_ot", "standorte"],
    familyId: "physical_security",
  },
  "phy-11": {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "ics_ot", "standorte"],
    familyId: "physical_security",
  },
  "i-07":  {
    scope: "asset", applicable_to: [], familyId: "asset_mgmt",
  },
  "i-08":  {
    scope: "asset",
    applicable_to: ["it_systeme", "informationen"],
    familyId: "physical_security",
  },

  // --- Endpoint Security ---
  "g-09":  {
    scope: "asset",
    applicable_to: ["it_systeme"],
    familyId: "endpoint_security",
  },
  "e-20":  {
    scope: "asset",
    applicable_to: ["it_systeme"],
    familyId: "endpoint_security",
  },
  "g-02":  {
    scope: "asset",
    applicable_to: ["it_systeme", "anwendungen", "netze", "nutzende", "ics_ot"],
    familyId: "identity_access_mgmt",
  },
  "g-05":  {
    // Privileged Access Management (PAM) — belongs to IAM, not endpoint.
    scope: "asset",
    applicable_to: ["nutzende", "anwendungen", "it_systeme"],
    familyId: "identity_access_mgmt",
  },
  "e-03":  {
    scope: "asset",
    applicable_to: ["it_systeme"],
    familyId: "endpoint_security",
  },
  "e-05":  {
    // Default-credential / patch hygiene. ICS/OT excluded: blanket
    // patching/credential rotation against PLCs / safety systems requires
    // an OT-specific change window and is covered separately by
    // OT-network-monitoring controls (j-06, e-06).
    scope: "asset",
    applicable_to: ["it_systeme", "netze"],
    familyId: "endpoint_security",
  },
  "tech-01": {
    scope: "asset",
    applicable_to: ["it_systeme"],
    familyId: "endpoint_security",
  },
  "tech-02": {
    scope: "asset",
    applicable_to: ["anwendungen"],
    familyId: "secure_development",
  },
  "tech-03": {
    // Secure authentication technologies (password masking, encryption in
    // transit for credentials) — belongs to IAM, not endpoint.
    scope: "asset",
    applicable_to: ["nutzende", "anwendungen", "it_systeme"],
    familyId: "identity_access_mgmt",
  },
  "ep-01": {
    scope: "asset",
    applicable_to: ["it_systeme"],
    familyId: "endpoint_security",
  },
  "ep-02": {
    scope: "asset",
    applicable_to: ["it_systeme"],
    familyId: "endpoint_security",
  },

  // --- Network Security ---
  "e-01":  {
    scope: "asset",
    applicable_to: ["netze", "it_systeme", "ics_ot"],
    familyId: "network_security",
  },
  "e-02":  {
    scope: "asset",
    applicable_to: ["netze", "it_systeme", "ics_ot"],
    familyId: "network_security",
  },
  "e-04":  {
    scope: "asset",
    applicable_to: ["it_systeme", "netze"],
    familyId: "network_security",
  },
  "e-06":  {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "ics_ot"],
    familyId: "network_security",
  },
  "e-12":  {
    scope: "asset",
    applicable_to: ["netze", "it_systeme"],
    familyId: "network_security",
  },
  "e-13":  {
    scope: "asset",
    applicable_to: ["netze", "it_systeme", "anwendungen"],
    familyId: "network_security",
  },
  "j-05":  {
    scope: "asset",
    applicable_to: ["netze", "it_systeme"],
    familyId: "network_security",
  },
  "j-06":  {
    scope: "asset",
    applicable_to: ["ics_ot", "iot", "netze"],
    familyId: "network_security",
  },
  "j-07":  {
    scope: "asset",
    applicable_to: ["netze", "anwendungen", "it_systeme"],
    familyId: "network_security",
  },
  "a-08":  {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "ics_ot"],
    familyId: "network_security",
  },
  "e-11":  {
    scope: "asset",
    applicable_to: ["netze", "it_systeme"],
    familyId: "network_security",
  },
  "tech-04": {
    scope: "asset",
    applicable_to: ["netze", "it_systeme"],
    conditions: [{ field: "external_exposure", value: true }],
    familyId: "network_security",
  },
  // net-01 (Pen-Test) — moved from network_security to vulnerability_mgmt.
  // Excluded from OT/ICS assets: active pen-tests carry production-impact
  // risk on OT systems and require non-intrusive OT-specific validation.
  "net-01": {
    scope: "asset",
    applicable_to: ["netze", "it_systeme", "anwendungen"],
    conditions: [{ field: "external_exposure", value: true }],
    familyId: "vulnerability_mgmt",
  },
  "net-02": {
    scope: "asset",
    applicable_to: ["netze", "it_systeme"],
    familyId: "network_security",
  },
  "net-03": {
    scope: "asset",
    applicable_to: ["netze"],
    familyId: "network_security",
  },

  // --- Cryptography (asset-level technical) ---
  "h-02":  {
    // Crypto-in-transit / at-rest applies to data carriers and apps,
    // not to user identities themselves.
    scope: "asset",
    applicable_to: ["anwendungen", "informationen"],
    familyId: "cryptography",
    related_org_control_id: "h-01",
  },
  "h-03":  {
    scope: "asset",
    applicable_to: ["informationen", "anwendungen", "it_systeme"],
    familyId: "cryptography",
  },
  "h-04":  {
    // Key management — applies to crypto-bearing systems, not "user" assets.
    scope: "asset",
    applicable_to: ["anwendungen", "it_systeme", "informationen"],
    familyId: "cryptography",
  },
  "h-05":  {
    scope: "asset",
    applicable_to: ["anwendungen", "it_systeme"],
    familyId: "cryptography",
  },
  "h-06":  {
    scope: "asset",
    applicable_to: ["anwendungen"],
    familyId: "cryptography",
  },
  "h-07":  {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "anwendungen"],
    familyId: "cryptography",
  },
  "h-08":  {
    scope: "asset",
    applicable_to: ["it_systeme", "anwendungen"],
    familyId: "cryptography",
  },
  "h-09":  {
    scope: "asset",
    applicable_to: ["it_systeme", "anwendungen"],
    familyId: "cryptography",
  },
  "j-01":  {
    scope: "asset",
    applicable_to: ["anwendungen"],
    familyId: "cryptography",
  },
  "j-02":  {
    scope: "asset",
    applicable_to: ["anwendungen", "it_systeme"],
    familyId: "cryptography",
  },
  "j-03":  {
    scope: "asset",
    applicable_to: ["anwendungen"],
    familyId: "cryptography",
  },
  "j-04":  {
    scope: "asset",
    applicable_to: ["anwendungen"],
    familyId: "cryptography",
  },

  // --- Vulnerability & Patch Management ---
  "a-09":  {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "anwendungen", "ics_ot"],
    familyId: "vulnerability_mgmt",
    related_org_control_id: "a-02",
  },
  "e-07":  {
    scope: "asset",
    applicable_to: ["it_systeme", "anwendungen"],
    familyId: "vulnerability_mgmt",
  },
  "e-08":  {
    scope: "asset",
    applicable_to: ["anwendungen", "it_systeme"],
    familyId: "vulnerability_mgmt",
  },
  "e-09":  {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "anwendungen"],
    familyId: "vulnerability_mgmt",
  },
  "e-10":  {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "anwendungen"],
    familyId: "vulnerability_mgmt",
  },
  "a-11":  {
    scope: "asset",
    applicable_to: ["anwendungen", "it_systeme", "netze"],
    conditions: [{ field: "external_exposure", value: true }],
    familyId: "vulnerability_mgmt",
  },
  "e-19":  {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "anwendungen"],
    familyId: "vulnerability_mgmt",
  },
  "a-05":  {
    scope: "asset",
    applicable_to: ["netze", "it_systeme"],
    familyId: "vulnerability_mgmt",
  },
  "a-06":  {
    scope: "asset",
    applicable_to: ["it_systeme", "anwendungen", "netze", "ics_ot", "iot"],
    familyId: "vulnerability_mgmt",
  },
  "tech-05": {
    scope: "asset",
    applicable_to: ["it_systeme", "anwendungen"],
    familyId: "vulnerability_mgmt",
  },
  "tech-06": {
    scope: "asset",
    applicable_to: ["it_systeme", "netze"],
    conditions: [{ field: "external_exposure", value: true }],
    familyId: "vulnerability_mgmt",
  },

  // --- Secure Development ---
  "e-14":  {
    scope: "asset",
    applicable_to: ["anwendungen"],
    familyId: "secure_development",
  },
  "e-16":  {
    scope: "asset",
    applicable_to: ["anwendungen", "it_systeme"],
    familyId: "secure_development",
  },
  "e-17":  {
    scope: "asset",
    applicable_to: ["anwendungen"],
    conditions: [{ field: "external_exposure", value: true }],
    familyId: "secure_development",
  },
  "e-18":  {
    scope: "asset",
    applicable_to: ["anwendungen", "it_systeme"],
    familyId: "asset_mgmt",
  },
  "e-15":  {
    scope: "asset",
    applicable_to: ["anwendungen", "it_systeme"],
    conditions: [{ field: "external_exposure", value: true }],
    familyId: "secure_development",
  },
  "tech-07": {
    scope: "asset",
    applicable_to: ["anwendungen"],
    familyId: "secure_development",
  },
  "tech-08": {
    scope: "asset",
    applicable_to: ["anwendungen"],
    familyId: "secure_development",
  },
  "tech-09": {
    scope: "asset",
    applicable_to: ["anwendungen"],
    familyId: "secure_development",
  },
  "tech-10": {
    scope: "asset",
    applicable_to: ["anwendungen"],
    familyId: "secure_development",
  },

  // --- Monitoring & Logging ---
  "a-10":  {
    scope: "asset",
    applicable_to: ["it_systeme", "nutzende", "anwendungen", "informationen"],
    familyId: "monitoring_logging",
    related_org_control_id: "org-20",
  },
  "b-10":  {
    scope: "asset",
    applicable_to: ["it_systeme", "anwendungen", "netze", "ics_ot"],
    familyId: "monitoring_logging",
  },
  "j-08":  {
    scope: "asset",
    applicable_to: ["anwendungen", "netze"],
    familyId: "monitoring_logging",
  },
  "tech-11": {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "anwendungen", "ics_ot"],
    familyId: "monitoring_logging",
  },
  "tech-12": {
    scope: "asset",
    applicable_to: ["it_systeme", "netze", "anwendungen", "ics_ot"],
    familyId: "monitoring_logging",
  },
  "tech-13": {
    scope: "asset",
    applicable_to: ["it_systeme", "anwendungen", "informationen"],
    familyId: "monitoring_logging",
  },

  // --- Backup & Recovery (asset-level) ---
  "c-01":  {
    scope: "asset",
    applicable_to: ["informationen", "anwendungen", "it_systeme"],
    familyId: "business_continuity",
    related_org_control_id: "c-08",
  },
  "c-02":  {
    scope: "asset",
    applicable_to: ["informationen", "anwendungen", "it_systeme"],
    familyId: "business_continuity",
  },
  "c-03":  {
    scope: "asset",
    applicable_to: ["it_systeme", "informationen", "anwendungen"],
    familyId: "business_continuity",
  },
  "c-04":  {
    scope: "asset",
    applicable_to: ["it_systeme", "informationen", "anwendungen"],
    familyId: "business_continuity",
  },
  "c-05":  {
    scope: "asset",
    applicable_to: ["it_systeme", "informationen", "anwendungen"],
    familyId: "business_continuity",
  },

  // --- Data Protection (asset-level) ---
  "tech-14": {
    scope: "asset",
    applicable_to: ["informationen", "anwendungen", "it_systeme"],
    familyId: "data_protection",
  },
  "tech-15": {
    scope: "asset",
    applicable_to: ["informationen", "anwendungen"],
    conditions: [{ field: "data_sensitivity", value: "Confidential" }],
    familyId: "data_protection",
  },
  "tech-16": {
    scope: "asset",
    applicable_to: ["it_systeme", "anwendungen", "informationen"],
    familyId: "data_protection",
  },
  "tech-17": {
    scope: "asset",
    applicable_to: ["it_systeme", "informationen", "anwendungen"],
    familyId: "business_continuity",
  },
  "tech-18": {
    scope: "asset",
    applicable_to: ["it_systeme", "informationen", "anwendungen"],
    familyId: "identity_access_mgmt",
  },
  "tech-19": {
    scope: "asset",
    applicable_to: ["it_systeme", "anwendungen"],
    familyId: "endpoint_security",
  },
  "tech-20": {
    scope: "asset",
    applicable_to: ["it_systeme", "informationen", "anwendungen"],
    familyId: "compliance_audit",
  },

  // ═══════════════════════════════════════════════════
  // v3 — 30 NEW CONTROLS (245 total, 19 families)
  // ═══════════════════════════════════════════════════

  // --- MFA & Strong Authentication (new 19th family) ---
  "iam-mfa-1": { scope: "organization", applicable_to: [], familyId: "mfa_strong_auth" },
  "iam-mfa-2": { scope: "organization", applicable_to: [], familyId: "mfa_strong_auth" },
  "iam-mfa-3": { scope: "organization", applicable_to: [], familyId: "mfa_strong_auth" },
  "iam-mfa-4": { scope: "organization", applicable_to: [], familyId: "mfa_strong_auth" },
  "iam-mfa-5": { scope: "organization", applicable_to: [], familyId: "mfa_strong_auth" },
  "iam-mfa-6": { scope: "organization", applicable_to: [], familyId: "mfa_strong_auth" },

  // --- Awareness & Training ---
  "awr-13":    { scope: "organization", applicable_to: [], familyId: "awareness_training" },

  // --- Incident Management — Reporting & Forensics ---
  "inc-comm-1": { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },
  "inc-comm-2": { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },
  "inc-comm-3": { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },
  "inc-17":     { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },

  // --- Cryptography — Crypto agility & E2EE ---
  "cry-pq-1": { scope: "organization", applicable_to: [], familyId: "cryptography" },
  "cry-pq-2": { scope: "organization", applicable_to: [], familyId: "cryptography" },

  // --- OT/ICS — asset-scoped, per-OT-asset (Art. 21(2)(e), IEC 62443) ---
  "ot-1": { scope: "asset", applicable_to: ["ics_ot"], familyId: "network_security" },
  "ot-2": { scope: "asset", applicable_to: ["ics_ot"], familyId: "network_security" },
  "ot-3": { scope: "asset", applicable_to: ["ics_ot"], familyId: "network_security" },
  "ot-4": { scope: "asset", applicable_to: ["ics_ot"], familyId: "network_security" },

  // --- Supplier — extended supply chain ---
  "sup-7": { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "sup-8": { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "sup-9": { scope: "organization", applicable_to: [], familyId: "supplier_security" },

  // --- Vulnerability Management — EASM / CVD / SLA / TI ---
  "vul-7":  { scope: "organization", applicable_to: [], familyId: "vulnerability_mgmt" },
  "vul-8":  { scope: "organization", applicable_to: [], familyId: "vulnerability_mgmt" },
  "vul-9":  { scope: "organization", applicable_to: [], familyId: "vulnerability_mgmt" },
  "vul-10": { scope: "organization", applicable_to: [], familyId: "vulnerability_mgmt" },

  // --- Secure Development — Secure SDLC ---
  "dev-12": { scope: "organization", applicable_to: [], familyId: "secure_development" },

  // --- AI/ML Governance (distributed across families) ---
  "ai-1": { scope: "organization", applicable_to: [], familyId: "governance" },
  "ai-3": { scope: "organization", applicable_to: [], familyId: "secure_development" },
  "ai-4": { scope: "organization", applicable_to: [], familyId: "supplier_security" },
  "ai-5": { scope: "organization", applicable_to: [], familyId: "incident_mgmt" },
};
