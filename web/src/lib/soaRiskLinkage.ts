/**
 * SoA Risk Linkage Engine
 *
 * Maps controls → linked risks using treatment decision data.
 * Supports: standard controls, manual controls, excluded controls.
 *
 * Input: treatment state + risk objects
 * Output: control → { linked_risk_ids, linked_to_high_risk }
 */

import type { RiskObject, RiskLevel } from "@/lib/riskEngine";
import { parseControlSelectionId, type TreatmentObject } from "@/lib/treatmentEngine";

export interface ControlRiskLink {
  risk_id: string;
  risk_level: RiskLevel;
  risk_score: number;
  description: string;
  description_en: string;
}

export interface ControlLinkageEntry {
  control_id: string;
  linked_risks: ControlRiskLink[];
  linked_to_high_risk: boolean; // true if any linked risk is critical or high
}

export interface RiskLinkageMap {
  /** control_id → linkage entry */
  byControl: Map<string, ControlLinkageEntry>;
  /** risk_id → control_ids that mitigate it */
  byRisk: Map<string, string[]>;
  /** All unique risk IDs that appear in linkages */
  allLinkedRiskIds: string[];
}

interface CustomControlInput {
  id: string;
  linked_risk_id?: string;
}

interface ExcludedControlInput {
  control_id: string;
  risk_id: string;
}

export function buildRiskLinkageMap(
  treatments: TreatmentObject[],
  risks: RiskObject[] | null | undefined,
  customControls: CustomControlInput[],
  excludedControls: ExcludedControlInput[],
): RiskLinkageMap {
  // Prefer the live risk register (used by Step 8/10). When callers do not have
  // the register loaded (Step 15 / KPI), fall back to the risk_level persisted
  // on each treatment during generation — the single source of truth.
  const riskMap = new Map<string, RiskObject>();
  if (risks && risks.length) {
    for (const r of risks) riskMap.set(r.risk_id, r);
  }
  const treatmentLevelMap = new Map<string, RiskLevel>();
  for (const t of treatments) {
    if (t.risk_level) treatmentLevelMap.set(t.risk_id, t.risk_level);
  }
  const resolveLevel = (riskId: string): RiskLevel =>
    riskMap.get(riskId)?.risk_level ?? treatmentLevelMap.get(riskId) ?? "low";

  const controlToRiskIds = new Map<string, Set<string>>();
  const riskToControlIds = new Map<string, Set<string>>();

  const addLink = (controlId: string, riskId: string) => {
    const parsed = parseControlSelectionId(controlId);
    const ids = parsed.framework ? [controlId, parsed.controlId] : [controlId];
    for (const id of ids) {
      if (!controlToRiskIds.has(id)) controlToRiskIds.set(id, new Set());
      controlToRiskIds.get(id)!.add(riskId);
    }
    if (!controlToRiskIds.has(controlId)) controlToRiskIds.set(controlId, new Set());
    if (!riskToControlIds.has(riskId)) riskToControlIds.set(riskId, new Set());
    riskToControlIds.get(riskId)!.add(controlId);
  };

  // 1. From treatment decisions: each treatment's selected controls → its risk
  for (const t of treatments) {
    for (const cid of t.selected_control_ids) {
      addLink(cid, t.risk_id);
    }
  }

  // 2. From excluded controls: still linked to the risk they were excluded from
  for (const ex of excludedControls) {
    addLink(ex.control_id, ex.risk_id);
  }

  // 3. From custom controls: linked_risk_id if present
  for (const cc of customControls) {
    if (cc.linked_risk_id) {
      addLink(cc.id, cc.linked_risk_id);
    }
  }

  // Build final map
  const byControl = new Map<string, ControlLinkageEntry>();
  Array.from(controlToRiskIds.entries()).forEach(([controlId, riskIds]) => {
    const linked_risks: ControlRiskLink[] = [];
    let linked_to_high_risk = false;

    Array.from(riskIds).forEach(riskId => {
      const risk = riskMap.get(riskId);
      const level: RiskLevel = resolveLevel(riskId);
      // High-risk push: critical OR high — both drive Now-phase priority in Roadmap.
      if (level === "critical" || level === "high") {
        linked_to_high_risk = true;
      }
      if (risk) {
        linked_risks.push({
          risk_id: risk.risk_id,
          risk_level: risk.risk_level,
          risk_score: risk.risk_score,
          description: risk.description,
          description_en: risk.description_en,
        });
      } else {
        linked_risks.push({
          risk_id: riskId,
          risk_level: level,
          risk_score: 0,
          description: riskId,
          description_en: riskId,
        });
      }
    });

    // Sort by risk_score descending
    linked_risks.sort((a, b) => b.risk_score - a.risk_score);

    byControl.set(controlId, { control_id: controlId, linked_risks, linked_to_high_risk });
  });

  const byRisk = new Map<string, string[]>();
  Array.from(riskToControlIds.entries()).forEach(([riskId, controlIds]) => {
    byRisk.set(riskId, Array.from(controlIds));
  });

  const allLinkedRiskIds = Array.from(riskToControlIds.keys()).sort();

  return { byControl, byRisk, allLinkedRiskIds };
}

/** Risk level color helpers for badges */
export function riskLevelBadgeColor(level: RiskLevel): string {
  switch (level) {
    case "critical": return "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800";
    case "high": return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800";
    case "medium": return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800";
    case "low": return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
  }
}
