/**
 * Role-based effort allocation (PT-Verteilung nach Rolle).
 *
 * Problem: A single PT number per measure hides WHICH role bears the load.
 * A Firewall-Härtung (5 PT IT) and an ISMS policy approval (0.5 PT MGMT)
 * cannot be planned with the same capacity bucket.
 *
 * Solution: every measure's effort is split into a 4-role vector based on
 * its ISO 27001 Annex A theme (with per-control overrides for outliers).
 * Sum of all roles = totalEffortDays.
 *
 * Roles:
 *   - IT   : Operations, engineering, infrastructure (admins, ops)
 *   - ISB  : Information security officer, compliance, documentation
 *   - MGMT : Leadership, approvals, governance, budget decisions
 *   - FACH : Business / process owners (HR, procurement, legal, ops mgmt)
 */
import type { IsoTheme } from "./iso27001Effort";

export type EffortRole = "it" | "isb" | "mgmt" | "fach";

export interface EffortVector {
  it: number;
  isb: number;
  mgmt: number;
  fach: number;
}

export const EFFORT_ROLES: EffortRole[] = ["it", "isb", "mgmt", "fach"];

export const ROLE_LABEL: Record<EffortRole, { de: string; en: string }> = {
  it:   { de: "IT-Betrieb",         en: "IT Operations" },
  isb:  { de: "ISB / Compliance",   en: "ISO / Compliance" },
  mgmt: { de: "Leitung",            en: "Management" },
  fach: { de: "Fachbereich",        en: "Business Unit" },
};

/** Stable theme colors (HSL-friendly tailwind classes for swatches). */
export const ROLE_COLOR: Record<EffortRole, { bg: string; text: string; hex: string }> = {
  it:   { bg: "bg-primary",       text: "text-primary-foreground",       hex: "hsl(220 100% 50%)" },
  isb:  { bg: "bg-secondary",     text: "text-secondary-foreground",     hex: "hsl(45 93% 47%)" },
  mgmt: { bg: "bg-destructive",   text: "text-destructive-foreground",   hex: "hsl(0 84% 60%)" },
  fach: { bg: "bg-muted-foreground", text: "text-background",            hex: "hsl(220 9% 46%)" },
};

type Weights = EffortVector; // each ∈ [0,1], sum = 1

/** Default split per ISO theme (must sum to 1.0). */
const THEME_PROFILE: Record<IsoTheme, Weights> = {
  // A.5 Organizational: policy-heavy → ISB lead, MGMT approvals, light IT
  "A.5": { it: 0.15, isb: 0.55, mgmt: 0.20, fach: 0.10 },
  // A.6 People: HR-driven → FACH (HR) heavy, ISB awareness
  "A.6": { it: 0.10, isb: 0.35, mgmt: 0.15, fach: 0.40 },
  // A.7 Physical: facilities / on-site → IT + facility ops
  "A.7": { it: 0.50, isb: 0.25, mgmt: 0.10, fach: 0.15 },
  // A.8 Technological: IT-dominant
  "A.8": { it: 0.75, isb: 0.20, mgmt: 0.03, fach: 0.02 },
};

/**
 * Per-control overrides for outliers where the theme default is misleading.
 * Use sparingly — only when a control's role mix differs substantially.
 */
const CONTROL_OVERRIDE: Record<string, Weights> = {
  // A.5 outliers
  "A.5.1":  { it: 0.05, isb: 0.60, mgmt: 0.30, fach: 0.05 }, // Policies → MGMT freigabe
  "A.5.2":  { it: 0.05, isb: 0.40, mgmt: 0.50, fach: 0.05 }, // Roles & responsibilities
  "A.5.4":  { it: 0.00, isb: 0.20, mgmt: 0.80, fach: 0.00 }, // Management responsibilities
  "A.5.5":  { it: 0.05, isb: 0.55, mgmt: 0.40, fach: 0.00 }, // Contact with authorities
  "A.5.19": { it: 0.20, isb: 0.30, mgmt: 0.15, fach: 0.35 }, // Supplier relationships
  "A.5.20": { it: 0.10, isb: 0.30, mgmt: 0.20, fach: 0.40 }, // Supplier agreements (procurement)
  "A.5.21": { it: 0.25, isb: 0.35, mgmt: 0.10, fach: 0.30 }, // ICT supply chain
  "A.5.22": { it: 0.25, isb: 0.40, mgmt: 0.05, fach: 0.30 }, // Supplier monitoring
  "A.5.23": { it: 0.55, isb: 0.30, mgmt: 0.05, fach: 0.10 }, // Cloud services
  "A.5.24": { it: 0.50, isb: 0.30, mgmt: 0.15, fach: 0.05 }, // Incident planning
  "A.5.25": { it: 0.45, isb: 0.35, mgmt: 0.10, fach: 0.10 },
  "A.5.26": { it: 0.55, isb: 0.30, mgmt: 0.10, fach: 0.05 },
  "A.5.27": { it: 0.25, isb: 0.50, mgmt: 0.15, fach: 0.10 },
  "A.5.29": { it: 0.40, isb: 0.25, mgmt: 0.20, fach: 0.15 }, // Disruption
  "A.5.30": { it: 0.35, isb: 0.20, mgmt: 0.20, fach: 0.25 }, // BCM/ICT readiness
  "A.5.31": { it: 0.05, isb: 0.50, mgmt: 0.20, fach: 0.25 }, // Legal requirements
  "A.5.34": { it: 0.15, isb: 0.50, mgmt: 0.05, fach: 0.30 }, // Privacy / PII
  // A.6 outliers
  "A.6.1":  { it: 0.00, isb: 0.20, mgmt: 0.10, fach: 0.70 }, // Screening → HR
  "A.6.2":  { it: 0.00, isb: 0.20, mgmt: 0.20, fach: 0.60 }, // Terms of employment
  "A.6.3":  { it: 0.10, isb: 0.50, mgmt: 0.10, fach: 0.30 }, // Awareness
  "A.6.4":  { it: 0.00, isb: 0.10, mgmt: 0.50, fach: 0.40 }, // Disciplinary → MGMT/HR
  "A.6.7":  { it: 0.55, isb: 0.25, mgmt: 0.05, fach: 0.15 }, // Remote working
  // A.8 outliers
  "A.8.32": { it: 0.70, isb: 0.20, mgmt: 0.05, fach: 0.05 }, // Change management
  "A.8.34": { it: 0.30, isb: 0.55, mgmt: 0.10, fach: 0.05 }, // Audit protection → ISB
};

/** Fallback for unmapped NIS2-only controls (no ISO ref, no theme). */
const UNMAPPED_DEFAULT: Weights = { it: 0.40, isb: 0.40, mgmt: 0.10, fach: 0.10 };

export function getRoleWeights(isoRef: string | null, isoTheme: IsoTheme | null): Weights {
  if (isoRef && CONTROL_OVERRIDE[isoRef]) return CONTROL_OVERRIDE[isoRef];
  if (isoTheme) return THEME_PROFILE[isoTheme];
  return UNMAPPED_DEFAULT;
}

/**
 * Split a total PT figure into a per-role vector.
 * Returns 0.1-PT precision (one decimal) — small enough to sum cleanly,
 * granular enough to show meaningful share differences.
 */
export function splitEffort(
  totalDays: number,
  isoRef: string | null,
  isoTheme: IsoTheme | null,
): EffortVector {
  const w = getRoleWeights(isoRef, isoTheme);
  const round = (n: number) => Math.round(n * 10) / 10;
  return {
    it:   round(totalDays * w.it),
    isb:  round(totalDays * w.isb),
    mgmt: round(totalDays * w.mgmt),
    fach: round(totalDays * w.fach),
  };
}

/** Sum two effort vectors element-wise. */
export function addEffort(a: EffortVector, b: EffortVector): EffortVector {
  return {
    it:   Math.round((a.it + b.it) * 10) / 10,
    isb:  Math.round((a.isb + b.isb) * 10) / 10,
    mgmt: Math.round((a.mgmt + b.mgmt) * 10) / 10,
    fach: Math.round((a.fach + b.fach) * 10) / 10,
  };
}

export const EMPTY_EFFORT: EffortVector = { it: 0, isb: 0, mgmt: 0, fach: 0 };

export function sumEffort(v: EffortVector): number {
  return Math.round((v.it + v.isb + v.mgmt + v.fach) * 10) / 10;
}
