/**
 * Custom Data Sensitivity Levels (Step 4)
 *
 * Lets users define their own sensitivity labels alongside the BSI/ISO defaults.
 * Each level carries a numeric tier (1=lowest … 4=highest) so all downstream
 * logic (control filtering, reporting, criticality narrative) can compare by
 * tier instead of relying on hard-coded English strings.
 *
 * Storage: per-tenant in localStorage. No DB migration needed — labels are
 * UI/config concerns; the asset row keeps the chosen *label* in `data_sensitivity`.
 */

export interface SensitivityLevel {
  /** Display label shown in selects, badges, reports. */
  label: string;
  /** 1 (lowest) … 4 (highest). Drives all comparison logic. */
  tier: 1 | 2 | 3 | 4;
  /** Optional short description for the manage dialog. */
  description?: string;
  /** True for the 4 system defaults (Public/Normal/Confidential/Highly Confidential). */
  builtin?: boolean;
}

export const DEFAULT_SENSITIVITY_LEVELS: SensitivityLevel[] = [
  { label: "Public",               tier: 1, builtin: true },
  { label: "Normal",               tier: 2, builtin: true },
  { label: "Confidential",         tier: 3, builtin: true },
  { label: "Highly Confidential",  tier: 4, builtin: true },
];

/** German display labels for the 4 builtin defaults. Custom labels are shown as-is. */
const BUILTIN_DE: Record<string, string> = {
  "Public": "Öffentlich",
  "Normal": "Normal",
  "Confidential": "Vertraulich",
  "Highly Confidential": "Streng vertraulich",
};

/** Localized display label. Falls back to the raw label for custom user entries. */
export function displayLabel(level: SensitivityLevel | string, lang: "de" | "en"): string {
  const raw = typeof level === "string" ? level : level.label;
  if (lang === "de" && BUILTIN_DE[raw]) return BUILTIN_DE[raw];
  return raw;
}

const KEY = (tenantId: string) => `nis2:sensitivity-levels:${tenantId}`;

export function loadSensitivityLevels(tenantId: string | null | undefined): SensitivityLevel[] {
  if (!tenantId) return [...DEFAULT_SENSITIVITY_LEVELS];
  try {
    const raw = localStorage.getItem(KEY(tenantId));
    if (!raw) return [...DEFAULT_SENSITIVITY_LEVELS];
    const parsed = JSON.parse(raw) as SensitivityLevel[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_SENSITIVITY_LEVELS];
    // Sanitize tiers
    return parsed
      .filter(l => l && typeof l.label === "string" && l.label.trim())
      .map(l => ({ ...l, tier: (Math.max(1, Math.min(4, Number(l.tier) || 2)) as 1 | 2 | 3 | 4) }));
  } catch {
    return [...DEFAULT_SENSITIVITY_LEVELS];
  }
}

export function saveSensitivityLevels(tenantId: string, levels: SensitivityLevel[]): void {
  localStorage.setItem(KEY(tenantId), JSON.stringify(levels));
}

export function resetSensitivityLevels(tenantId: string): void {
  localStorage.removeItem(KEY(tenantId));
}

/** Resolve a label (custom or default) to its tier. Falls back to 2 (Normal). */
export function tierFor(label: string | undefined | null, levels: SensitivityLevel[]): number {
  if (!label) return 2;
  const hit = levels.find(l => l.label.toLowerCase() === String(label).toLowerCase());
  if (hit) return hit.tier;
  // Legacy German seed fallbacks
  const lower = String(label).toLowerCase();
  if (["öffentlich", "public"].includes(lower)) return 1;
  if (["normal", "intern", "internal"].includes(lower)) return 2;
  if (["vertraulich", "confidential", "hoch", "high"].includes(lower)) return 3;
  if (["streng vertraulich", "highly confidential", "sehr hoch"].includes(lower)) return 4;
  return 2;
}
