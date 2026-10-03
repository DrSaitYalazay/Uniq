/**
 * Roadmap Engine — Now / Next / Later sequencing.
 *
 * Pure functions. Inputs are RoadmapItem rows + linked RiskObject data.
 * A `phase_override` on the item always wins; otherwise we compute a
 * phase from risk level, SPOF signal and due-date proximity.
 */
import type { RiskObject } from "@/lib/riskEngine";

export type RoadmapPhase = "now" | "next" | "later";

export interface RoadmapItem {
  id: string;
  risk_id: string;
  control_id: string;
  owner_id: string | null;
  start_date: string | null;
  due_date: string | null;
  effort_pt: number | null;
  phase_override: RoadmapPhase | null;
  notes: string | null;
}

export interface RoadmapRow {
  key: string;
  item: RoadmapItem | null;
  risk: RiskObject;
  control_id: string;
  effective_phase: RoadmapPhase;
  is_overdue: boolean;
  days_until_due: number | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysUntil(dateIso: string | null): number | null {
  if (!dateIso) return null;
  const dt = new Date(dateIso);
  if (Number.isNaN(dt.getTime())) return null;
  const now = new Date();
  const a = Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / DAY_MS);
}

export function computePhase(risk: RiskObject, item: RoadmapItem | null): RoadmapPhase {
  if (item?.phase_override) return item.phase_override;

  const dtu = daysUntil(item?.due_date ?? null);
  const overdue = dtu !== null && dtu < 0;

  // Kritisch → immer Sofort (Now), auch ohne gesetzten Termin.
  if (risk.risk_level === "critical") return "now";
  if (risk.risk_level === "high") {
    if (overdue || (dtu !== null && dtu <= 30)) return "now";
    return "next";
  }
  if (risk.risk_level === "medium") {
    if (overdue) return "next";
    return "later";
  }
  return "later";
}

export function toRoadmapRow(
  risk: RiskObject,
  control_id: string,
  item: RoadmapItem | null,
): RoadmapRow {
  const dtu = daysUntil(item?.due_date ?? null);
  return {
    key: `${risk.risk_id}::${control_id}`,
    item,
    risk,
    control_id,
    effective_phase: computePhase(risk, item),
    is_overdue: dtu !== null && dtu < 0,
    days_until_due: dtu,
  };
}

export const PHASE_LABEL: Record<RoadmapPhase, { de: string; en: string }> = {
  now:   { de: "Sofort (0–3 Monate)",     en: "Now (0–3 months)" },
  next:  { de: "Als Nächstes (3–9 Monate)", en: "Next (3–9 months)" },
  later: { de: "Später (>9 Monate)",       en: "Later (>9 months)" },
};

export const PHASE_ORDER: RoadmapPhase[] = ["now", "next", "later"];
