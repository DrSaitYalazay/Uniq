/**
 * Treatment "Quick Wins" — Step 9 Action-Plan helpers.
 *
 * Pure helpers, no side effects. Used by Decisions.tsx and the
 * treatment report generators to:
 *  1. Group duplicate risks (same gap_title + capability + scope) into
 *     one display row that lists all affected assets.
 *  2. Replace internal "risk-gap-…" IDs with human-readable labels in
 *     fallback rendering paths (PDF/Word).
 *  3. Suggest an owner role and a due-date based on capability + risk level
 *     (advisory only — never auto-assigns).
 *  4. Suggest a more realistic treatment strategy when "mitigate" is not
 *     the most plausible response.
 */

import type { RiskObject, RiskLevel } from "@/lib/riskEngine";
import type { TreatmentObject, TreatmentStrategy } from "@/lib/treatmentEngine";

// ── 1. Friendly label ─────────────────────────────────────────────

const INTERNAL_ID_RE = /^(risk-gap-|gap-|risk-)/i;

/** Returns a clean human title for a risk, never an internal id. */
export function friendlyRiskLabel(risk: RiskObject, lang: "de" | "en"): string {
  const t = lang === "de" ? risk.gap_title : risk.gap_title_en;
  if (t && !INTERNAL_ID_RE.test(t)) return t;
  // Fallback: build from capability + asset/scope
  const cap = prettifyToken(risk.capability_tag);
  const ctx = risk.asset_name
    ? ` (${risk.asset_name})`
    : risk.scope === "organization"
      ? lang === "de" ? " (organisationsweit)" : " (organization-wide)"
      : "";
  return lang === "de" ? `${cap} – Schwäche${ctx}` : `${cap} – Weakness${ctx}`;
}

/** Resolve a risk_id to a friendly label using the registry, or prettify it. */
export function friendlyRiskIdLabel(
  riskId: string | null | undefined,
  riskMap: Map<string, RiskObject>,
  lang: "de" | "en",
): string {
  if (!riskId) return lang === "de" ? "Unbekanntes Risiko" : "Unknown risk";
  const r = riskMap.get(riskId);
  if (r) return friendlyRiskLabel(r, lang);
  // Strip prefixes and the trailing UUID, then prettify
  const stripped = String(riskId).replace(INTERNAL_ID_RE, "").replace(/-(asset|org)-.*$/i, "");
  return prettifyToken(stripped) || (lang === "de" ? "Unbekanntes Risiko" : "Unknown risk");
}

function prettifyToken(s: string): string {
  if (!s) return "";
  return s
    .split(/[_\\-]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// ── 2. Duplicate grouping ─────────────────────────────────────────

export interface RiskGroup {
  /** Stable key shared across all members. */
  key: string;
  /** Representative risk (first/highest-priority member). */
  primary: RiskObject;
  /** All risks in this group (length >= 1). */
  members: RiskObject[];
  /** Distinct asset names in this group, in insertion order. */
  affectedAssets: string[];
}

/**
 * Group risks by (gap_title + capability_tag + scope). Members of the same
 * group share the same root cause and should produce ONE treatment row,
 * with an "Affected Assets" badge listing the distinct assets.
 *
 * Order is preserved: groups appear in the order their primary risk first
 * appears in the input.
 */
export function groupRisks(risks: RiskObject[]): RiskGroup[] {
  const map = new Map<string, RiskGroup>();
  for (const r of risks) {
    const key = `${(r.gap_title || "").trim()}|${r.capability_tag}|${r.scope}`;
    const existing = map.get(key);
    if (existing) {
      existing.members.push(r);
      const name = r.asset_name?.trim();
      if (name && !existing.affectedAssets.includes(name)) {
        existing.affectedAssets.push(name);
      }
      // Keep highest-severity / highest-score risk as primary
      if (compareSeverity(r, existing.primary) > 0) existing.primary = r;
    } else {
      const group: RiskGroup = {
        key,
        primary: r,
        members: [r],
        affectedAssets: r.asset_name ? [r.asset_name] : [],
      };
      map.set(key, group);
    }
  }
  return [...map.values()];
}

function severityRank(level: RiskLevel): number {
  return level === "critical" ? 4 : level === "high" ? 3 : level === "medium" ? 2 : 1;
}

function compareSeverity(a: RiskObject, b: RiskObject): number {
  const d = severityRank(a.risk_level) - severityRank(b.risk_level);
  return d !== 0 ? d : a.risk_score - b.risk_score;
}

// ── 3. Owner role suggestion (advisory) ───────────────────────────

/**
 * Capability → suggested responsible role. Used as a hint badge next to the
 * Owner picker; never auto-assigned. Roles are deliberately generic so they
 * map to most org structures.
 */
const OWNER_ROLE_BY_CAPABILITY: Record<string, { de: string; en: string }> = {
  governance: { de: "Geschäftsleitung / CISO", en: "Management / CISO" },
  risk_mgmt: { de: "CISO / Risikomanager", en: "CISO / Risk Manager" },
  asset_mgmt: { de: "IT-Leitung", en: "IT Lead" },
  identity_access_mgmt: { de: "IT-Leitung / IAM-Verantwortlicher", en: "IT Lead / IAM Owner" },
  supplier_security: { de: "Einkauf + CISO", en: "Procurement + CISO" },
  incident_mgmt: { de: "CISO / Incident Response", en: "CISO / Incident Response" },
  business_continuity: { de: "BCM-Beauftragter / IT-Leitung", en: "BCM Officer / IT Lead" },
  compliance_audit: { de: "Compliance / Datenschutzbeauftragter", en: "Compliance / DPO" },
  personnel_security: { de: "HR + CISO", en: "HR + CISO" },
  awareness_training: { de: "HR / CISO", en: "HR / CISO" },
  cryptography: { de: "IT-Sicherheit", en: "IT Security" },
  endpoint_security: { de: "IT-Betrieb", en: "IT Operations" },
  network_security: { de: "Netzwerk-Team", en: "Network Team" },
  vulnerability_mgmt: { de: "IT-Sicherheit", en: "IT Security" },
  secure_development: { de: "Entwicklungsleitung", en: "Engineering Lead" },
  monitoring_logging: { de: "SOC / IT-Betrieb", en: "SOC / IT Operations" },
  physical_security: { de: "Facility Management", en: "Facility Management" },
  data_protection: { de: "Datenschutzbeauftragter", en: "DPO" },
};

const DEFAULT_OWNER_ROLE = { de: "IT-Leitung", en: "IT Lead" };

export function suggestOwnerRole(risk: RiskObject, lang: "de" | "en"): string {
  const role = OWNER_ROLE_BY_CAPABILITY[risk.capability_tag] ?? DEFAULT_OWNER_ROLE;
  return role[lang];
}

// ── 4. Deadline suggestion (advisory) ─────────────────────────────

/** Aggressive defaults — the user explicitly requested 14/30/60/120. */
export const RECOMMENDED_DEADLINE_DAYS: Record<RiskLevel, number> = {
  critical: 14,
  high: 30,
  medium: 60,
  low: 120,
};

/** ISO yyyy-mm-dd suggested due-date for the given risk. */
export function suggestDueDate(risk: RiskObject, today: Date = new Date()): string {
  const days = RECOMMENDED_DEADLINE_DAYS[risk.risk_level] ?? 60;
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── 5. Strategy diversity hint ────────────────────────────────────

/**
 * Heuristic strategy suggestion. Returns null when "mitigate" is the
 * obvious answer. Used to surface a hint when the auto-default looks wrong.
 */
export function suggestStrategy(risk: RiskObject): TreatmentStrategy | null {
  // Low residual risk + low impact → often acceptable
  if (risk.risk_level === "low" && risk.impact <= 2) return "accept";

  // Supplier / 3rd-party concentration → typically transferred (contracts/insurance)
  if (
    (risk.capability_tag === "supplier_security" || risk.capability_tag === "business_continuity")
    && risk.risk_level !== "low"
  ) {
    return "transfer";
  }

  // Cryptography / data-protection at high impact → mitigate stays valid; no hint
  // No strong signal otherwise
  return null;
}

/**
 * Aggregated diversity check across all treatments. Returns true when a
 * single strategy dominates (>= 90 %) on a non-trivial dataset.
 */
export function strategyTooMonolithic(
  treatments: TreatmentObject[],
  threshold = 0.9,
  minTotal = 5,
): { dominant: TreatmentStrategy; share: number } | null {
  if (treatments.length < minTotal) return null;
  const counts = new Map<TreatmentStrategy, number>();
  for (const t of treatments) {
    counts.set(t.strategy, (counts.get(t.strategy) ?? 0) + 1);
  }
  let dominant: TreatmentStrategy = "mitigate";
  let max = 0;
  for (const [k, v] of counts) {
    if (v > max) { max = v; dominant = k; }
  }
  const share = max / treatments.length;
  return share >= threshold ? { dominant, share } : null;
}
