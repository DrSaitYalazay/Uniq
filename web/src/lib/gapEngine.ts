/**
 * Gap Analysis Engine — Multi-Layer Interpretation System
 *
 * Transforms assessment results into meaningful, non-duplicative,
 * decision-ready compliance deficiencies.
 *
 * Pipeline: Assessment Answers → Findings → Consolidation → Gaps
 */

import { controlMetadata, type ControlScope } from "@/data/controlMetadata";
import { controlFamilies, type ControlFamilyId, assetClasses, subClasses, resolveAssetSubClass } from "@/data/controlEngine";
import { getZok } from "@/data/zielobjektkategorien";
import { nis2Domains, type ControlQuestion } from "@/data/nis2Controls";
import type { ControlRow, AnswerStatus } from "@/lib/assessmentEngine";
import { capabilityFor, humanCap, type CapabilityTag } from "@/lib/capabilityMap";
import { isNis2Active } from "@/lib/frameworkFlags";

// ── Types ──

export type FindingType = "weak" | "missing";
export type GapCategory = "technical" | "governance";
export type Severity = "critical" | "high" | "medium" | "low";

export type ControlImportance = "critical" | "high" | "medium" | "low";

export interface Finding {
  finding_id: string;
  control_id: string;
  scope: ControlScope;
  asset_id: string | null;
  asset_name: string | null;
  /** ZOK root (BSI Grundschutz++ Level-1 asset class). Only set for scope="asset". */
  asset_class: AssetClassIdLocal | null;
  answer: "teilweise" | "nein";
  finding_type: FindingType;
  control_title: string;
  control_title_en: string;
  control_description: string;
  control_description_en: string;
  control_family: string;
  capability_tag: string;
  control_importance: ControlImportance;
  risk_text: string;
  risk_text_en: string;
  measure_text: string;
  measure_text_en: string;
  user_comment: string | null;
}

// Local re-export alias to avoid touching every existing import site.
type AssetClassIdLocal =
  | "standorte" | "nutzende" | "netze" | "it_systeme" | "ics_ot"
  | "iot" | "prozesse" | "lieferanten" | "informationen" | "anwendungen";
export type FindingAssetClass = AssetClassIdLocal;

export interface ConsolidatedGap {
  gap_id: string;
  scope: ControlScope;
  gap_category: GapCategory;
  asset_id: string | null;
  asset_name: string | null;
  linked_service_id: string | null;
  linked_service_name: string | null;
  capability_tag: string;
  capability_label: string;
  capability_label_en: string;
  title: string;
  title_en: string;
  description: string;
  description_en: string;
  why_it_matters: string;
  why_it_matters_en: string;
  recommendation: string;
  recommendation_en: string;
  severity: Severity;
  severity_reason: string;
  supporting_finding_ids: string[];
}

export interface AssetInfo {
  id: string;
  asset_name: string;
  asset_type: string;
  /** BSI Grundschutz++ Zielobjektkategorien assigned to this asset */
  zok_ids?: string[];
  service_id: string;
  service_name?: string;
  inherited_criticality: boolean;
  criticality_classification?: string;
  dependency_count?: number;
  is_single_point_of_failure?: boolean;
  supports_critical_service?: boolean;
}

export interface AssessmentAnswer {
  control_id: string;
  status: string;
  asset_id?: string;
  comment?: string | null;
}

export interface GapAnalysisInput {
  orgAnswers: AssessmentAnswer[];
  assetAnswers: AssessmentAnswer[];
  assets: AssetInfo[];
  dependencies: { source_asset_id: string; target_asset_id: string }[];
}

export interface GapAnalysisResult {
  findings: Finding[];
  gaps: ConsolidatedGap[];
  summary: GapSummary;
}

export interface GapSummary {
  totalFindings: number;
  totalGaps: number;
  highSeverityGaps: number;
  governanceGaps: number;
  technicalGaps: number;
  weakFindings: number;
  missingFindings: number;
  bySeverity: Record<Severity, number>;
  byCapability: Record<string, number>;
  /** Control processing stats */
  totalControls: number;
  processedControls: number;
  unprocessedControls: number;
  processedWithGap: number;
  processedWithoutGap: number;
  /** Gaps by asset class for radar chart */
  byAssetClass: Record<string, { total: number; withGap: number; processed: number }>;
  /**
   * Phase 2 drill-down (currently only `ics_ot`): per-root map of
   * sub-class id → counters. Empty when no assets are tagged at sub-class level.
   * Shape: { ics_ot: { scada_leitsystem: {total,withGap,processed}, ... } }
   */
  byAssetSubClass: Record<string, Record<string, { total: number; withGap: number; processed: number }>>;
}

// ── Control lookup ──

const _controlMap = new Map<string, ControlQuestion>();
for (const domain of nis2Domains) {
  for (const cat of domain.categories) {
    for (const q of cat.questions) {
      _controlMap.set(q.id, q);
    }
  }
}

// ── Capability tag labels ──

const CAPABILITY_LABELS: Record<string, { de: string; en: string }> = {
  governance: { de: "Governance & Richtlinien", en: "Governance & Policies" },
  risk_mgmt: { de: "Risikomanagement", en: "Risk Management" },
  asset_mgmt: { de: "Asset Management", en: "Asset Management" },
  identity_access_mgmt: { de: "Identitäts- & Zugriffskontrolle", en: "Identity & Access Control" },
  supplier_security: { de: "Lieferantensicherheit", en: "Supplier Security" },
  incident_mgmt: { de: "Vorfallmanagement", en: "Incident Management" },
  business_continuity: { de: "Business Continuity", en: "Business Continuity" },
  compliance_audit: { de: "Compliance & Audit", en: "Compliance & Audit" },
  personnel_security: { de: "Personalsicherheit", en: "Personnel Security" },
  awareness_training: { de: "Awareness & Schulung", en: "Awareness & Training" },
  physical_security: { de: "Physische Sicherheit", en: "Physical Security" },
  endpoint_security: { de: "Endgerätesicherheit", en: "Endpoint Security" },
  network_security: { de: "Netzwerksicherheit", en: "Network Security" },
  cryptography: { de: "Kryptographie", en: "Cryptography" },
  vulnerability_mgmt: { de: "Schwachstellenmanagement", en: "Vulnerability Management" },
  secure_development: { de: "Sichere Entwicklung", en: "Secure Development" },
  monitoring_logging: { de: "Überwachung & Logging", en: "Monitoring & Logging" },
  data_protection: { de: "Datenschutz", en: "Data Protection" },
};

// ── Importance mapping by family ──

const FAMILY_IMPORTANCE: Record<string, ControlImportance> = {
  governance: "critical",
  risk_mgmt: "critical",
  incident_mgmt: "critical",
  business_continuity: "high",
  identity_access_mgmt: "high",
  supplier_security: "high",
  network_security: "high",
  cryptography: "high",
  vulnerability_mgmt: "high",
  monitoring_logging: "high",
  data_protection: "high",
  endpoint_security: "medium",
  secure_development: "medium",
  physical_security: "medium",
  compliance_audit: "medium",
  personnel_security: "medium",
  awareness_training: "low",
  asset_mgmt: "low",
};

// ── Governance families ──

const GOVERNANCE_FAMILIES = new Set([
  "governance", "risk_mgmt", "compliance_audit", "personnel_security",
  "awareness_training", "supplier_security",
]);

// ── Risk & Measure text generators ──

function generateRiskText(q: ControlQuestion, answer: "teilweise" | "nein", lang: "de" | "en"): string {
  const desc = lang === "en" ? q.descriptionEn : q.description;
  if (answer === "nein") {
    return lang === "de"
      ? `Ohne Umsetzung dieser Maßnahme besteht ein erhöhtes Risiko für Sicherheitsvorfälle, Datenverlust oder Verstöße gegen die NIS2-Richtlinie (EU 2022/2555). Diese Kontrolle ist vollständig nicht implementiert. Konkret: ${desc}. Bei einem Audit oder Sicherheitsvorfall kann das Fehlen dieser Kontrolle zu erheblichen regulatorischen Konsequenzen, Bußgeldern bis zu 10 Mio. EUR oder 2% des weltweiten Jahresumsatzes sowie Haftung der Geschäftsleitung führen.`
      : `Without implementing this measure, there is a significantly increased risk of security incidents, data loss, or violations of the NIS2 Directive (EU 2022/2555). This control is completely unimplemented. Specifically: ${desc}. In the event of an audit or security incident, the absence of this control may lead to substantial regulatory consequences, fines up to €10M or 2% of global annual turnover, and personal liability for management.`;
  }
  return lang === "de"
    ? `Diese Maßnahme ist nur teilweise umgesetzt, was eine Restlücke in der Sicherheitsarchitektur hinterlässt. Konkret: ${desc}. Teilweise Umsetzung kann bei Audits als unzureichend bewertet werden und bietet keinen vollständigen Schutz gegen die identifizierten Bedrohungen. Die verbleibenden Lücken müssen dokumentiert und zeitnah geschlossen werden.`
    : `This measure is only partially implemented, leaving a residual gap in the security architecture. Specifically: ${desc}. Partial implementation may be assessed as insufficient during audits and does not provide full protection against identified threats. The remaining gaps must be documented and closed promptly.`;
}

function generateMeasureText(q: ControlQuestion, answer: "teilweise" | "nein", lang: "de" | "en"): string {
  const desc = lang === "en" ? q.descriptionEn : q.description;
  if (answer === "nein") {
    return lang === "de"
      ? `Kontrolle implementieren: ${desc}. Verantwortlichen benennen, verbindlichen Prozess oder technische Kontrolle einführen, Freigabe dokumentieren und Wirksamkeitsnachweis archivieren.`
      : `Implement the control: ${desc}. Assign an owner, introduce the binding process or technical control, document approval, and archive effectiveness evidence.`;
  }
  return lang === "de"
    ? `Kontrolle verbindlich schließen: ${desc}. Bestehende Umsetzung in einen vollständigen Soll-Prozess überführen, fehlende Nachweise ergänzen, Verantwortlichen festlegen und regelmäßige Wirksamkeitsprüfung terminieren.`
    : `Close the control gap: ${desc}. Turn the current partial implementation into a complete target process, add missing evidence, assign an owner, and schedule recurring effectiveness checks.`;
}

// ══════════════════════════════════════
// STEP 1 — FINDINGS LAYER
// ══════════════════════════════════════

function buildFindings(input: GapAnalysisInput): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<string>();
  const assetMap = new Map(input.assets.map(a => [a.id, a]));

  // Org-level answers
  for (const ans of input.orgAnswers) {
    if (ans.status !== "nein" && ans.status !== "teilweise") continue;
    const key = `${ans.control_id}|organization|null`;
    if (seen.has(key)) continue;
    seen.add(key);

    const meta = controlMetadata[ans.control_id];
    const q = _controlMap.get(ans.control_id);
    if (!meta || !q) continue;

    const familyId = meta.familyId;
    const answer = ans.status as "teilweise" | "nein";

    findings.push({
      finding_id: `f-org-${ans.control_id}`,
      control_id: ans.control_id,
      scope: "organization",
      asset_id: null,
      asset_name: null,
      asset_class: null,
      answer,
      finding_type: answer === "nein" ? "missing" : "weak",
      control_title: q.question,
      control_title_en: q.questionEn,
      control_description: q.description,
      control_description_en: q.descriptionEn,
      control_family: familyId,
      capability_tag: familyId,
      control_importance: FAMILY_IMPORTANCE[familyId] ?? "medium",
      risk_text: generateRiskText(q, answer, "de"),
      risk_text_en: generateRiskText(q, answer, "en"),
      measure_text: generateMeasureText(q, answer, "de"),
      measure_text_en: generateMeasureText(q, answer, "en"),
      user_comment: ans.comment || null,
    });
  }

  // Asset-level answers
  for (const ans of input.assetAnswers) {
    if (ans.status !== "nein" && ans.status !== "teilweise") continue;
    if (!ans.asset_id) continue;

    const key = `${ans.control_id}|asset|${ans.asset_id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const meta = controlMetadata[ans.control_id];
    const q = _controlMap.get(ans.control_id);
    if (!meta || !q) continue;
    if (meta.scope === "organization") continue;

    const asset = assetMap.get(ans.asset_id);
    const familyId = meta.familyId;
    const answer = ans.status as "teilweise" | "nein";

    findings.push({
      finding_id: `f-asset-${ans.control_id}-${ans.asset_id}`,
      control_id: ans.control_id,
      scope: "asset",
      asset_id: ans.asset_id,
      asset_name: asset?.asset_name ?? null,
      asset_class: ((asset?.zok_ids?.[0] ?? null) as AssetClassIdLocal | null),
      answer,
      finding_type: answer === "nein" ? "missing" : "weak",
      control_title: q.question,
      control_title_en: q.questionEn,
      control_description: q.description,
      control_description_en: q.descriptionEn,
      control_family: familyId,
      capability_tag: familyId,
      control_importance: FAMILY_IMPORTANCE[familyId] ?? "medium",
      risk_text: generateRiskText(q, answer, "de"),
      risk_text_en: generateRiskText(q, answer, "en"),
      measure_text: generateMeasureText(q, answer, "de"),
      measure_text_en: generateMeasureText(q, answer, "en"),
      user_comment: ans.comment || null,
    });
  }

  return findings;
}

// ══════════════════════════════════════
// STEP 2+3 — CONSOLIDATION + DEDUP
// ══════════════════════════════════════

function consolidateFindings(
  findings: Finding[],
  assets: AssetInfo[],
  dependencies: { source_asset_id: string; target_asset_id: string }[],
): ConsolidatedGap[] {
  const assetMap = new Map(assets.map(a => [a.id, a]));

  const groups = new Map<string, Finding[]>();
  for (const f of findings) {
    const key = `${f.capability_tag}|${f.scope}|${f.asset_id ?? "org"}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }

  const gaps: ConsolidatedGap[] = [];

  for (const [, groupFindings] of groups) {
    const first = groupFindings[0];
    const cap = first.capability_tag;
    const scope = first.scope;
    const assetId = first.asset_id;
    const asset = assetId ? assetMap.get(assetId) : null;

    const capLabel = CAPABILITY_LABELS[cap] ?? { de: cap, en: cap };
    const isGov = GOVERNANCE_FAMILIES.has(cap) || scope === "organization";

    const severity = calculateSeverity(groupFindings, asset, dependencies);

    const missingCount = groupFindings.filter(f => f.finding_type === "missing").length;
    const weakCount = groupFindings.filter(f => f.finding_type === "weak").length;

    const assetContext = asset ? ` (${asset.asset_name})` : "";

    const title = scope === "organization"
      ? `${capLabel.de} – Governance-Lücke`
      : `${capLabel.de} – Schwäche${assetContext}`;
    const titleEn = scope === "organization"
      ? `${capLabel.en} – Governance Gap`
      : `${capLabel.en} – Weakness${assetContext}`;

    const desc = buildDescription(groupFindings, "de");
    const descEn = buildDescription(groupFindings, "en");

    gaps.push({
      gap_id: `gap-${cap}-${scope}-${assetId ?? "org"}`,
      scope,
      gap_category: isGov ? "governance" : "technical",
      asset_id: assetId,
      asset_name: asset?.asset_name ?? null,
      linked_service_id: asset?.service_id ?? null,
      linked_service_name: asset?.service_name ?? null,
      capability_tag: cap,
      capability_label: capLabel.de,
      capability_label_en: capLabel.en,
      title,
      title_en: titleEn,
      description: desc,
      description_en: descEn,
      why_it_matters: buildWhyItMatters(cap, scope, asset, "de"),
      why_it_matters_en: buildWhyItMatters(cap, scope, asset, "en"),
      recommendation: buildRecommendation(missingCount, weakCount, cap, "de"),
      recommendation_en: buildRecommendation(missingCount, weakCount, cap, "en"),
      severity: severity.level,
      severity_reason: severity.reason,
      supporting_finding_ids: groupFindings.map(f => f.finding_id),
    });
  }

  const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  gaps.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return gaps;
}

// ══════════════════════════════════════
// STEP 5 — SEVERITY LOGIC
// ══════════════════════════════════════

function calculateSeverity(
  findings: Finding[],
  asset: AssetInfo | null | undefined,
  dependencies: { source_asset_id: string; target_asset_id: string }[],
): { level: Severity; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  const maxImportance = findings.reduce((max, f) => {
    const order: Record<ControlImportance, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return Math.max(max, order[f.control_importance]);
  }, 0);
  score += maxImportance * 2;
  if (maxImportance >= 3) reasons.push("high-importance controls affected");

  const hasMissing = findings.some(f => f.finding_type === "missing");
  if (hasMissing) { score += 3; reasons.push("missing controls present"); }
  else { score += 1; reasons.push("partially implemented controls"); }

  if (findings.length >= 3) { score += 2; reasons.push(`${findings.length} findings in capability`); }

  if (asset) {
    const crit = asset.criticality_classification;
    if (crit === "Critical") { score += 4; reasons.push("critical asset"); }
    else if (crit === "High") { score += 3; reasons.push("high-criticality asset"); }
    else if (crit === "Medium") { score += 1; }

    if (asset.id) {
      const depCount = dependencies.filter(
        d => d.source_asset_id === asset.id || d.target_asset_id === asset.id
      ).length;
      if (depCount >= 5) { score += 2; reasons.push("highly connected asset"); }
      else if (depCount >= 2) { score += 1; }

      if (asset.is_single_point_of_failure) { score += 3; reasons.push("single point of failure"); }
      if (asset.supports_critical_service) { score += 2; reasons.push("supports critical service"); }
    }
  }

  let level: Severity;
  if (score >= 12) level = "critical";
  else if (score >= 8) level = "high";
  else if (score >= 5) level = "medium";
  else level = "low";

  // Severity ↔ Business-Impact consistency floor:
  // If the cluster touches a critical asset, a SPOF, or a critical-service-
  // supporting asset, it must not collapse to "low" — the downstream business
  // impact text would otherwise contradict the severity badge ("kritische
  // Systeme ungeschützt" + Severity Niedrig is a logic break).
  const hasCriticalContext =
    asset?.criticality_classification === "Critical" ||
    asset?.is_single_point_of_failure === true ||
    asset?.supports_critical_service === true ||
    findings.some(f => f.control_importance === "critical");
  if (hasCriticalContext && level === "low") {
    level = "medium";
    reasons.push("severity floor: critical business context");
  }
  if (hasCriticalContext && level === "medium" && asset?.criticality_classification === "Critical" && asset?.is_single_point_of_failure) {
    level = "high";
    reasons.push("severity floor: critical SPOF asset");
  }
  // Asset-Inventar self-contradiction guard:
  // Business-impact text ("Audit-Befund: kein vollständiges Inventar",
  // "Schatten-IT bleibt unbehandelt") is dramatic by definition. As soon as
  // there is *any* missing finding the cluster must not display "Niedrig" —
  // it produces a visible contradiction with the BI bullets on page 9.
  const cap = findings[0]?.capability_tag;
  if (cap === "asset_mgmt" && level === "low" && findings.some(f => f.finding_type === "missing")) {
    level = "medium";
    reasons.push("severity floor: asset_mgmt missing inventory entries");
  }

  return { level, reason: reasons.join("; ") };
}

// ── Helper builders ──

function buildDescription(findings: Finding[], lang: "de" | "en"): string {
  const missing = findings.filter(f => f.finding_type === "missing");
  const weak = findings.filter(f => f.finding_type === "weak");
  const parts: string[] = [];
  if (missing.length > 0) {
    parts.push(lang === "de"
      ? `${missing.length} fehlende Kontrolle(n): ${missing.map(f => f.control_id).join(", ")}`
      : `${missing.length} missing control(s): ${missing.map(f => f.control_id).join(", ")}`);
  }
  if (weak.length > 0) {
    parts.push(lang === "de"
      ? `${weak.length} teilweise umgesetzte Kontrolle(n): ${weak.map(f => f.control_id).join(", ")}`
      : `${weak.length} partially implemented control(s): ${weak.map(f => f.control_id).join(", ")}`);
  }
  return parts.join(". ");
}

function buildWhyItMatters(cap: string, scope: ControlScope, asset: AssetInfo | null | undefined, lang: "de" | "en"): string {
  const label = CAPABILITY_LABELS[cap]?.[lang] ?? cap;
  if (scope === "organization") {
    return lang === "de"
      ? `Schwächen in ${label} auf Organisationsebene betreffen alle Geschäftsprozesse und Systeme. Ohne klare Governance-Grundlage fehlt die Basis für technische Maßnahmen.`
      : `Weaknesses in ${label} at the organization level affect all business processes and systems. Without a clear governance foundation, technical measures lack a solid basis.`;
  }
  const assetName = asset?.asset_name ?? "this asset";
  return lang === "de"
    ? `Unzureichende ${label} bei ${assetName} erhöht das Risiko von Sicherheitsvorfällen und kann die Einhaltung der NIS2-Richtlinie gefährden.`
    : `Insufficient ${label} on ${assetName} increases the risk of security incidents and may jeopardize NIS2 compliance.`;
}

function buildRecommendation(missingCount: number, weakCount: number, cap: string, lang: "de" | "en"): string {
  const label = CAPABILITY_LABELS[cap]?.[lang] ?? cap;
  const de = lang === "de";
  // Singular/plural-aware noun phrases (avoids "1 fehlende Kontrollen" template bug).
  const missingPhrase = de
    ? `${missingCount} ${missingCount === 1 ? "fehlende Kontrolle" : "fehlende Kontrollen"}`
    : `${missingCount} ${missingCount === 1 ? "missing control" : "missing controls"}`;
  const weakPhrase = de
    ? `${weakCount} ${weakCount === 1 ? "teilweise umgesetzte Kontrolle" : "teilweise umgesetzte Kontrollen"}`
    : `${weakCount} ${weakCount === 1 ? "partially implemented control" : "partially implemented controls"}`;
  const verbMissing = de
    ? (missingCount === 1 ? "muss" : "müssen")
    : "must";
  const verbWeak = de
    ? (weakCount === 1 ? "ist" : "sind")
    : (weakCount === 1 ? "is" : "are");
  if (missingCount > 0 && weakCount > 0) {
    return de
      ? `Priorität: ${missingPhrase} im Bereich ${label} sofort implementieren. ${weakPhrase} zeitnah vervollständigen.`
      : `Priority: Immediately implement ${missingPhrase} in ${label}. Complete ${weakPhrase} promptly.`;
  }
  if (missingCount > 0) {
    return de
      ? `${missingPhrase} im Bereich ${label} ${verbMissing} umgehend implementiert werden.`
      : `${missingPhrase} in ${label} ${verbMissing} be implemented immediately.`;
  }
  return de
    ? `${weakPhrase} im Bereich ${label} vervollständigen und dokumentieren.`
    : `Complete and document ${weakPhrase} in ${label}.`;
}

// ══════════════════════════════════════
// MAIN ENTRY POINT
// ══════════════════════════════════════

export function runGapAnalysis(input: GapAnalysisInput): GapAnalysisResult {
  const findings = buildFindings(input);
  const gaps = consolidateFindings(findings, input.assets, input.dependencies);

  // Control processing stats
  const allControlIds = Object.keys(controlMetadata);
  const totalControls = allControlIds.length;

  const answeredOrgIds = new Set(input.orgAnswers.map(a => a.control_id));
  const answeredAssetIds = new Set(input.assetAnswers.map(a => a.control_id));
  const processedControlIds = new Set([...answeredOrgIds, ...answeredAssetIds]);
  const processedControls = processedControlIds.size;
  const unprocessedControls = totalControls - processedControls;

  const findingControlIds = new Set(findings.map(f => f.control_id));
  const processedWithGap = [...processedControlIds].filter(id => findingControlIds.has(id)).length;
  const processedWithoutGap = processedControls - processedWithGap;

  // By asset class for radar chart
  const byAssetClass: Record<string, { total: number; withGap: number; processed: number }> = {};
  // Add "Organization" as a pseudo-class
  const orgControlIds = allControlIds.filter(id => controlMetadata[id].scope === "organization");
  const orgGapIds = orgControlIds.filter(id => findingControlIds.has(id));
  const orgProcessed = orgControlIds.filter(id => processedControlIds.has(id)).length;
  byAssetClass["organization"] = { total: orgControlIds.length, withGap: orgGapIds.length, processed: orgProcessed };

  for (const ac of assetClasses) {
    const classControlIds = allControlIds.filter(id => {
      const meta = controlMetadata[id];
      if (meta.scope === "organization") return false;
      if (meta.applicable_to.length === 0) return true; // applies to all
      return meta.applicable_to.includes(ac.id);
    });
    const classGapIds = classControlIds.filter(id => findingControlIds.has(id));
    const classProcessed = classControlIds.filter(id => processedControlIds.has(id)).length;
    byAssetClass[ac.id] = { total: classControlIds.length, withGap: classGapIds.length, processed: classProcessed };
  }

  // ── Sub-class drill-down (Phase 2: ics_ot pilot) ──
  const byAssetSubClass: Record<string, Record<string, { total: number; withGap: number; processed: number }>> = {};
  for (const [rootId, subs] of Object.entries(subClasses)) {
    if (!subs || subs.length === 0) continue;
    // Total controls applicable to this root (denominator)
    const rootControlIds = allControlIds.filter(id => {
      const meta = controlMetadata[id];
      if (meta.scope === "organization") return false;
      if (meta.applicable_to.length === 0) return true;
      return meta.applicable_to.includes(rootId as typeof assetClasses[number]["id"]);
    });

    const subBuckets: Record<string, { total: number; withGap: number; processed: number }> = {};
    for (const subId of subs) {
      // Collect asset_ids tagged to this leaf
      const leafAssetIds = new Set(
        input.assets
          .filter(a => resolveAssetSubClass({ asset_type: a.asset_type, zok_ids: a.zok_ids ?? null }) === subId)
          .map(a => a.id)
      );
      if (leafAssetIds.size === 0) continue;

      const leafProcessed = new Set<string>();
      const leafGaps = new Set<string>();
      for (const ans of input.assetAnswers) {
        if (!ans.asset_id || !leafAssetIds.has(ans.asset_id)) continue;
        leafProcessed.add(ans.control_id);
      }
      for (const f of findings) {
        if (!f.asset_id || !leafAssetIds.has(f.asset_id)) continue;
        leafGaps.add(f.control_id);
      }
      // Apply optional applicable_to_sub filter to denominator
      const leafApplicableIds = rootControlIds.filter(cid => {
        const meta = controlMetadata[cid];
        const sub = meta.applicable_to_sub;
        if (!sub || sub.length === 0) return true;
        return sub.includes(subId);
      });
      subBuckets[subId] = {
        total: leafApplicableIds.length,
        processed: [...leafProcessed].filter(cid => leafApplicableIds.includes(cid)).length,
        withGap: [...leafGaps].filter(cid => leafApplicableIds.includes(cid)).length,
      };
    }
    if (Object.keys(subBuckets).length > 0) {
      byAssetSubClass[rootId] = subBuckets;
    }
  }

  const summary: GapSummary = {
    totalFindings: findings.length,
    totalGaps: gaps.length,
    highSeverityGaps: gaps.filter(g => g.severity === "critical" || g.severity === "high").length,
    governanceGaps: gaps.filter(g => g.gap_category === "governance").length,
    technicalGaps: gaps.filter(g => g.gap_category === "technical").length,
    weakFindings: findings.filter(f => f.finding_type === "weak").length,
    missingFindings: findings.filter(f => f.finding_type === "missing").length,
    bySeverity: {
      critical: gaps.filter(g => g.severity === "critical").length,
      high: gaps.filter(g => g.severity === "high").length,
      medium: gaps.filter(g => g.severity === "medium").length,
      low: gaps.filter(g => g.severity === "low").length,
    },
    byCapability: gaps.reduce((acc, g) => {
      acc[g.capability_tag] = (acc[g.capability_tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    totalControls,
    processedControls,
    unprocessedControls,
    processedWithGap,
    processedWithoutGap,
    byAssetClass,
    byAssetSubClass,
  };

  return { findings, gaps, summary };
}

// Export asset class label helper for UI
export function getAssetClassLabel(id: string, lang: "de" | "en"): string {
  if (id === "organization") return lang === "de" ? "Organisation" : "Organization";
  const ac = assetClasses.find(a => a.id === id);
  return ac ? (lang === "de" ? ac.label : ac.labelEn) : id;
}

/** Localised label for a ZOK Level-2 sub-class id (e.g. "scada_leitsystem"). */
export function getAssetSubClassLabel(id: string, lang: "de" | "en"): string {
  const node = getZok(id as Parameters<typeof getZok>[0]);
  if (!node) return id;
  return lang === "de" ? node.label_de : node.label_en;
}

// ── Display helpers ──

export function severityColor(s: Severity): string {
  switch (s) {
    case "critical": return "bg-red-100 text-red-800 border-red-300";
    case "high": return "bg-orange-100 text-orange-800 border-orange-300";
    case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "low": return "bg-green-100 text-green-800 border-green-300";
  }
}

export function severityLabel(s: Severity, lang: "de" | "en"): string {
  const labels: Record<Severity, { de: string; en: string }> = {
    critical: { de: "Kritisch", en: "Critical" },
    high: { de: "Hoch", en: "High" },
    medium: { de: "Mittel", en: "Medium" },
    low: { de: "Niedrig", en: "Low" },
  };
  return labels[s][lang];
}

export function getCapabilityLabel(tag: string, lang: "de" | "en"): string {
  return CAPABILITY_LABELS[tag]?.[lang] ?? tag;
}

// ===== LIVE GAP PIPELINE (katalog-agnostisch) =====

interface ServiceRow {
  id: string;
  name: string;
  criticality: number | null;
  category: string | null;
}

interface AssetRow {
  id: string;
  service_id: string | null;
  asset_name: string;
  asset_type: string | null;
  environment: string | null;
  inherited_criticality: boolean | null;
  user_override_criticality: boolean | null;
}

interface AnswerRow {
  framework: string;
  control_id: string;
  asset_id: string | null;
  antwort: AnswerStatus | null;
  reifegrad: number | null;
  note: string | null;
  updated_at?: string | null;   // für LWW-Projektion (projectAnswer)
}

/**
 * ── E5 · Kontext-/risikobasierte Gap-Severity (gapEngine v2) ──────────────
 *
 * Klasse B-KERN: OHNE Kontext (alle Faktoren 1.0) liefert `computeGapSeverity`
 * EXAKT dieselben Levels wie die heutige 2×2-Tabelle `severityFor(muss, answer)`.
 * Der Beweis steckt in den Schwellen 7.5 / 5 / 3 gegen die Basiswerte 8/5/5/3.
 *
 * Formel:  S = B × W_ctrl × A_crit × X_exp × T_threat × K_comp
 *   B      Basis aus (muss, answer): muss+nein 8 · muss+teilweise 5 ·
 *          kann+nein 5 · kann+teilweise 3   (bildet die heutige 2×2-Ordnung ab)
 *   W_ctrl 0.6 + 0.8·base_eff (control_effect, E2) — wirksame Kontrollen fehlen
 *          schwerer                                                ∈ [0.6, 1.4]
 *   A_crit max. Asset-Kritikalität: Critical 1.4 · High 1.2 · Medium 1.0 ·
 *          Low 0.85 · kein Asset 1.0
 *   X_exp  SPOF +0.2 · internet-exposed +0.2  (additiv auf 1.0, max 1.4)
 *   T_threat  Bedrohungsgewicht je capability_tag (ENISA-Seed, s. THREAT_WEIGHTS)
 *   K_comp 1 − 0.3·compensationRatio  (kompensierte Geschwister)   ∈ [0.7, 1.0]
 *
 * Schwellen: S ≥ 7.5 critical · ≥ 5 high · ≥ 3 medium · sonst low.
 */

/** Asset-Kritikalitätslevel (criticalityEngine `classification`). */
export type CritLevel = "Low" | "Medium" | "High" | "Critical";

/** Ein einzelner nachvollziehbarer Multiplikator im Severity-Ausweis. */
export interface SeverityFactor {
  /** Kurzlabel des Faktors, z. B. "Asset-Kritikalität". */
  label: string;
  /** Multiplikator (nur Faktoren ≠ 1.0 werden ausgewiesen). */
  factor: number;
  /** Auditor-taugliche Begründung des Faktors. */
  reason: string;
}

/** Kontext-Eingaben für die kontextbasierte Severity (alle optional ⇒ Faktor 1.0). */
export interface SeverityContext {
  /** Wirksamkeit der Kontrolle 0..1 (base_eff aus control_effect, E2). */
  controlEff?: number;
  /** Max. Kritikalität der verknüpften Assets (criticalityEngine-Level). */
  assetCritLevel?: CritLevel | null;
  /** Betrifft ein Single-Point-of-Failure-Asset. */
  spof?: boolean;
  /** Betrifft ein internet-exponiertes Asset/Tag. */
  internetExposed?: boolean;
  /** capability_tag zur Bedrohungsgewichtung (THREAT_WEIGHTS). */
  capabilityTag?: string | null;
  /** Anteil kompensierender Geschwister-Knoten mit derived 'ja' (0..1). */
  compensationRatio?: number;
  /** Tenant-Override der Bedrohungsgewichte (aus risk_config.threat_weights). */
  threatOverride?: Record<string, number>;
}

/**
 * Bedrohungsgewichte je capability_tag — globale Seed-Map (jährlich mit dem
 * ENISA Threat-Landscape-Report gepflegt; Tenant-Override via
 * `SeverityContext.threatOverride` bzw. `risk_config.threat_weights jsonb`).
 * Konzeptzuordnung: identity/patching/backup/logging 1.3 · phishing/mfa 1.2 ·
 * physical 0.9 · Default 1.0.
 */
export const THREAT_WEIGHTS: Readonly<Record<string, number>> = Object.freeze({
  // 1.3 — ENISA-Top-Vektoren (Credential-Diebstahl, Exploits, Ransomware, Blindflug)
  identity_access_mgmt: 1.3, // identity / credential theft
  vulnerability_mgmt: 1.3,   // patching / exploited vulnerabilities
  business_continuity: 1.3,  // backup / ransomware recovery
  monitoring_logging: 1.3,   // logging / detection blind spots
  // Konzept-Aliasse (falls Aufrufer abstrakte Tags übergibt)
  identity: 1.3,
  patching: 1.3,
  backup: 1.3,
  logging: 1.3,
  // 1.2 — Social Engineering / Authentisierung
  awareness_training: 1.2,   // phishing / social engineering
  phishing: 1.2,
  mfa: 1.2,
  // 0.9 — geringere aktuelle Bedrohungsintensität
  physical_security: 0.9,
  physical: 0.9,
});

const _clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

const _A_CRIT: Record<CritLevel, number> = {
  Critical: 1.4,
  High: 1.2,
  Medium: 1.0,
  Low: 0.85,
};

/** Basiswert B(muss, answer). 0 ⇒ kein Gap (ja/na). */
function baseSeverity(muss: boolean, answer: AnswerStatus): number {
  if (answer === "nein") return muss ? 8 : 5;
  if (answer === "teilweise") return muss ? 5 : 3;
  return 0; // ja / na ⇒ kein Gap
}

/**
 * Kontext-/risikobasierte Gap-Severity. Ohne `ctx` (alle Faktoren 1.0) ist das
 * Level EXAKT identisch zur heutigen `severityFor(muss, answer)`.
 */
export function computeGapSeverity(
  muss: boolean,
  answer: AnswerStatus,
  ctx?: SeverityContext,
): { score: number; level: Severity; factors: SeverityFactor[] } {
  const B = baseSeverity(muss, answer);
  if (B === 0) {
    return { score: 0, level: "low", factors: [] };
  }

  const factors: SeverityFactor[] = [];
  const c = ctx ?? {};

  // W_ctrl — Kontroll-Wirksamkeit (nur wenn base_eff bekannt)
  let W = 1.0;
  if (typeof c.controlEff === "number" && Number.isFinite(c.controlEff)) {
    W = _clamp(0.6 + 0.8 * c.controlEff, 0.6, 1.4);
    if (W !== 1.0) {
      factors.push({
        label: "Kontroll-Wirksamkeit",
        factor: W,
        reason: W > 1.0
          ? `wirksame Kontrolle (Wirksamkeit ${(c.controlEff * 100).toFixed(0)}%) — ihr Fehlen wiegt schwerer`
          : `wenig wirksame Kontrolle (Wirksamkeit ${(c.controlEff * 100).toFixed(0)}%) — geringerer Zusatzeffekt`,
      });
    }
  }

  // A_crit — Asset-Kritikalität
  let A = 1.0;
  if (c.assetCritLevel) {
    A = _A_CRIT[c.assetCritLevel] ?? 1.0;
    if (A !== 1.0) {
      factors.push({
        label: "Asset-Kritikalität",
        factor: A,
        reason: A > 1.0
          ? `betrifft als ${c.assetCritLevel} eingestuftes Asset`
          : `betrifft nur gering kritisches Asset (${c.assetCritLevel})`,
      });
    }
  }

  // X_exp — Exposition (SPOF + internet-exposed, additiv, gedeckelt 1.4)
  let X = 1.0;
  const expReasons: string[] = [];
  if (c.spof) { X += 0.2; expReasons.push("Single Point of Failure"); }
  if (c.internetExposed) { X += 0.2; expReasons.push("internet-exponiert"); }
  X = _clamp(X, 1.0, 1.4);
  if (X !== 1.0) {
    factors.push({
      label: "Exposition",
      factor: X,
      reason: `erhöhte Angriffsfläche: ${expReasons.join(" + ")}`,
    });
  }

  // T_threat — Bedrohungsgewicht je capability_tag
  let T = 1.0;
  if (c.capabilityTag) {
    const weights = c.threatOverride
      ? { ...THREAT_WEIGHTS, ...c.threatOverride }
      : THREAT_WEIGHTS;
    T = weights[c.capabilityTag] ?? 1.0;
    if (T !== 1.0) {
      factors.push({
        label: "Bedrohungslage",
        factor: T,
        reason: T > 1.0
          ? `aktuell erhöhte Bedrohungsintensität (${c.capabilityTag}, ENISA)`
          : `aktuell geringere Bedrohungsintensität (${c.capabilityTag}, ENISA)`,
      });
    }
  }

  // K_comp — Kompensation durch Geschwister-Knoten
  let K = 1.0;
  if (typeof c.compensationRatio === "number" && Number.isFinite(c.compensationRatio)) {
    K = _clamp(1 - 0.3 * c.compensationRatio, 0.7, 1.0);
    if (K !== 1.0) {
      factors.push({
        label: "Kompensation",
        factor: K,
        reason: `${(c.compensationRatio * 100).toFixed(0)}% der Geschwister-Kontrollen kompensieren teilweise`,
      });
    }
  }

  const score = B * W * A * X * T * K;

  let level: Severity;
  if (score >= 7.5) level = "critical";
  else if (score >= 5) level = "high";
  else if (score >= 3) level = "medium";
  else level = "low";

  return { score, level, factors };
}

export function severityFor(muss: boolean, answer: "nein" | "teilweise"): Severity {
  if (muss && answer === "nein") return "critical";
  if (muss && answer === "teilweise") return "high";
  if (!muss && answer === "nein") return "high";
  return "medium";
}

function firstText(a?: string | null, b?: string | null): string {
  return (a ?? "").trim() || (b ?? "").trim();
}

/**
 * Optionaler Severity-Provider (E5). Ersetzt — je Finding — die 2×2-Tabelle
 * `severityFor(muss, answer)` durch eine kontext-/risikobasierte Bewertung
 * (z. B. `computeGapSeverity`). Wird KEIN Provider übergeben, greift exakt das
 * bisherige `severityFor` → Ergebnis byte-identisch zum heutigen Verhalten.
 */
export type GapSeverityProvider = (args: {
  muss: boolean;
  answer: "nein" | "teilweise";
  control: ControlRow | undefined;
  finding: Finding;
}) => Severity;

/** Generischer Risikosatz, wenn im Katalog kein Text hinterlegt ist. */
function genericRiskText(ctrl: ControlRow, answer: "nein" | "teilweise", lang: "de" | "en"): string {
  const raw = (lang === "de" ? ctrl.req_de : ctrl.req_en) ?? ctrl.req_de ?? ctrl.id;
  // Prüffrage → Anforderung: „Werden Identitäten umgehend entfernt…?" → „Identitäten umgehend entfernt…"
  const title = raw.replace(/\?\s*$/, "").replace(/^(Existieren|Gibt es|Werden|Wird|Ist|Sind|Hat|Haben|Do|Does|Is|Are|Has|Have)\s+/i, "");
  if (lang === "de") {
    return answer === "nein"
      ? `Die Anforderung „${title}" ist nicht umgesetzt. Ohne diese Kontrolle fehlt der Schutz gegen die damit adressierte Bedrohung; ein Vorfall kann unerkannt bleiben oder sich ungehindert ausbreiten.`
      : `Die Anforderung „${title}" ist nur teilweise umgesetzt. Die verbleibende Lücke kann von Angreifern ausgenutzt werden und wird im Audit als Abweichung gewertet.`;
  }
  return answer === "nein"
    ? `The requirement "${title}" is not implemented. Without this control there is no protection against the threat it addresses; an incident may go unnoticed or spread unchecked.`
    : `The requirement "${title}" is only partially implemented. The remaining gap can be exploited and will be treated as a deviation in an audit.`;
}

export function buildFindingsAndGaps(
  controls: ControlRow[],
  answers: AnswerRow[],
  assets: AssetRow[],
  services: ServiceRow[],
  opts?: {
    severityProvider?: GapSeverityProvider;
    /**
     * Risikotext-Katalog (Tabelle `risks` via `control_risk`): liefert für eine
     * Kontrolle den konkreten Risikotext (Bedrohung → Folge → Rechtsfolge).
     * Ohne Provider bleibt nur der generische Fallback-Satz.
     */
    riskTextFor?: (framework: string, controlId: string) => { de: string; en: string } | null;
  },
): { findings: Finding[]; gaps: ConsolidatedGap[] } {
  const controlMap = new Map(controls.map(c => [c.id, c]));
  const assetMap = new Map(assets.map(a => [a.id, a]));
  const serviceMap = new Map(services.map(s => [s.id, s]));

  const findings: Finding[] = [];

  for (const a of answers) {
    if (a.antwort !== "nein" && a.antwort !== "teilweise") continue;
    const ctrl = controlMap.get(a.control_id);
    if (!ctrl) continue;
    // B-09: Antwort verweist auf ein Asset, das es nicht (mehr) gibt → überspringen,
    // sonst wird sie zu einem Organisations-Finding und doppelt gezählt.
    if (a.asset_id && !assetMap.has(a.asset_id)) continue;

    const cap = capabilityFor(ctrl);
    const asset = a.asset_id ? assetMap.get(a.asset_id) : undefined;
    const findingType = a.antwort === "nein" ? "missing" : "weak";
    const fid = `f-${a.control_id}-${a.asset_id ?? "org"}`;
    const catalogRisk = opts?.riskTextFor?.(ctrl.framework, ctrl.id) ?? null;

    findings.push({
      finding_id: fid,
      control_id: a.control_id,
      scope: asset ? "asset" : "organization",
      asset_id: asset?.id ?? null,
      asset_name: asset?.asset_name ?? null,
      asset_class: null,
      answer: a.antwort as "nein" | "teilweise",
      finding_type: findingType,
      control_title: firstText(ctrl.req_de, ctrl.req_en),
      control_title_en: firstText(ctrl.req_en, ctrl.req_de),
      control_description: firstText(ctrl.req_de, ctrl.req_en),
      control_description_en: firstText(ctrl.req_en, ctrl.req_de),
      control_family: cap,
      capability_tag: cap,
      control_importance: ctrl.muss === "true" ? "critical" : "medium",
      // Konkreter Risikotext aus dem Katalog; sonst generischer Fallback.
      risk_text: catalogRisk?.de || genericRiskText(ctrl, a.antwort as "nein" | "teilweise", "de"),
      risk_text_en: catalogRisk?.en || genericRiskText(ctrl, a.antwort as "nein" | "teilweise", "en"),
      measure_text: "",
      measure_text_en: "",
      user_comment: a.note ?? null,
    });
  }

  // Consolidate by (scope, asset_id, capability_tag) so one card per
  // capability per asset (or org-wide) rather than one per control.
  const groups = new Map<string, Finding[]>();
  for (const f of findings) {
    const key = `${f.scope}::${f.asset_id ?? "org"}::${f.capability_tag}`;
    const cur = groups.get(key);
    if (cur) cur.push(f);
    else groups.set(key, [f]);
  }

  const gaps: ConsolidatedGap[] = [];
  for (const [key, group] of groups) {
    const first = group[0];
    const asset = first.asset_id ? assetMap.get(first.asset_id) : undefined;
    const svc = asset?.service_id ? serviceMap.get(asset.service_id) : undefined;
    const missing = group.filter(g => g.finding_type === "missing").length;
    const weak = group.filter(g => g.finding_type === "weak").length;

    // Highest severity in group wins. Startwert "low", damit ein Provider-
    // Ergebnis "low" (z. B. gering kritisches Asset) auch durchkommt; ohne
    // Provider liefert severityFor nie "low", die 2×2-Identität bleibt erhalten.
    const sevScore = (s: Severity) => ({ critical: 4, high: 3, medium: 2, low: 1 })[s];
    let sev: Severity = "low";
    for (const f of group) {
      const ctrl = controlMap.get(f.control_id);
      // Default (kein Provider) = bisheriges severityFor → byte-identisch.
      const s = opts?.severityProvider
        ? opts.severityProvider({ muss: ctrl?.muss === "true", answer: f.answer, control: ctrl, finding: f })
        : severityFor(ctrl?.muss === "true", f.answer);
      if (sevScore(s) > sevScore(sev)) sev = s;
    }

    const capLabelDe = humanCap(first.capability_tag as CapabilityTag, true);
    const capLabelEn = humanCap(first.capability_tag as CapabilityTag, false);
    const scopeTxtDe = first.scope === "organization" ? "organisationsweit" : `am Asset „${asset?.asset_name ?? "—"}"`;
    const scopeTxtEn = first.scope === "organization" ? "organization-wide" : `on asset "${asset?.asset_name ?? "—"}"`;

    gaps.push({
      gap_id: `gap-${key}`,
      scope: first.scope,
      gap_category: first.capability_tag === "governance" || first.capability_tag === "risk_mgmt" || first.capability_tag === "compliance_audit"
        ? "governance"
        : "technical",
      asset_id: first.asset_id,
      asset_name: first.asset_name,
      linked_service_id: svc?.id ?? null,
      linked_service_name: svc?.name ?? null,
      capability_tag: first.capability_tag,
      capability_label: capLabelDe,
      capability_label_en: capLabelEn,
      title: `${capLabelDe} — ${missing + weak} ${missing + weak === 1 ? "Lücke" : "Lücken"} ${scopeTxtDe}`,
      title_en: `${capLabelEn} — ${missing + weak} gap${missing + weak === 1 ? "" : "s"} ${scopeTxtEn}`,
      description: `${missing} fehlende und ${weak} teilweise umgesetzte Kontrolle(n) im Bereich ${capLabelDe}.`,
      description_en: `${missing} missing and ${weak} partially implemented control(s) in ${capLabelEn}.`,
      why_it_matters: `Schwächen im Bereich ${capLabelDe} ${scopeTxtDe} erhöhen das Risiko von Sicherheitsvorfällen und können ${isNis2Active() ? "NIS2-Konformität" : "die regulatorische Konformität"} gefährden.`,
      why_it_matters_en: `Weaknesses in ${capLabelEn} ${scopeTxtEn} increase the risk of security incidents and can jeopardize ${isNis2Active() ? "NIS2 compliance" : "regulatory compliance"}.`,
      recommendation: missing > 0
        ? `Priorität: ${missing} fehlende Kontrolle(n) in ${capLabelDe} umgehend einführen${weak > 0 ? `, ${weak} teilweise Umsetzung(en) vervollständigen` : ""}.`
        : `${weak} teilweise umgesetzte Kontrolle(n) in ${capLabelDe} vervollständigen und dokumentieren.`,
      recommendation_en: missing > 0
        ? `Priority: implement ${missing} missing control(s) in ${capLabelEn} immediately${weak > 0 ? `, complete ${weak} partial implementation(s)` : ""}.`
        : `Complete and document ${weak} partially implemented control(s) in ${capLabelEn}.`,
      severity: sev,
      severity_reason: sev,
      supporting_finding_ids: group.map(f => f.finding_id),
    });
  }

  return { findings, gaps };
}
