/**
 * Personnel registry — central list of responsible persons.
 *
 * Stored via useToolData (org-aware via shared row).
 * Owner fields across the pipeline (Steps 4, 9, 12, 17) accept multi-person
 * assignments serialized as a single string for backward compatibility:
 *
 *   "PrimaryName (Title) [+ContribName1, ContribName2]"
 *
 * - Primary = the single accountable owner (RACI "A").
 * - Contributors (optional) = additional responsible parties (RACI "R").
 */

export interface Person {
  id: string;
  name: string;
  title: string;       // role / position, e.g. "CISO"
  department?: string; // e.g. "IT", "Legal"
  email?: string;      // contact e-mail for Frist-Benachrichtigungen
}

export interface PersonnelRegistry {
  people: Person[];
}

export const DEFAULT_PERSONNEL: PersonnelRegistry = { people: [] };
export const PERSONNEL_TOOL_KEY = "nis2-personnel";
export const PERSONNEL_LS_KEY = "nis2-personnel";

// ── Serialization (string ↔ assignment) ──

export interface OwnerAssignment {
  primary: string;       // "Name (Title)" — empty string if none
  contributors: string[];// ["Name (Title)", ...]
}

export function formatPerson(p: Person): string {
  const title = p.title?.trim();
  return title ? `${p.name} (${title})` : p.name;
}

/** Serialize assignment back to the legacy single-string owner field. */
export function stringifyAssignment(a: OwnerAssignment): string {
  const primary = a.primary.trim();
  const contribs = a.contributors.map(c => c.trim()).filter(Boolean);
  if (!primary && contribs.length === 0) return "";
  if (contribs.length === 0) return primary;
  return `${primary} [+${contribs.join(", ")}]`;
}

/** Parse the legacy owner string back into an assignment. Tolerant of free text. */
export function parseAssignment(value: string | null | undefined): OwnerAssignment {
  if (!value) return { primary: "", contributors: [] };
  const trimmed = value.trim();
  const m = trimmed.match(/^(.*?)\s*\[\+(.+)\]\s*$/);
  if (m) {
    const primary = m[1].trim();
    const contributors = m[2].split(",").map(s => s.trim()).filter(Boolean);
    return { primary, contributors };
  }
  return { primary: trimmed, contributors: [] };
}
