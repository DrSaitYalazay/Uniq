/**
 * Framework activation flags for non-React contexts (report generators,
 * PDF builders, etc.) that cannot use the FrameworkContext hook.
 *
 * Reads from the same localStorage key the FrameworkContext writes to.
 * If NIS2 is not in the active list, all report generators MUST omit
 * NIS2-specific citations, chart sections, and narrative text.
 */

const STORAGE_ACTIVE = "cws.framework.active";

export function getActiveFrameworkKeys(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function isFrameworkActive(key: string): boolean {
  return getActiveFrameworkKeys().includes(key);
}

export function isNis2Active(): boolean {
  return isFrameworkActive("NIS2");
}

/**
 * Strips or neutralizes NIS2-specific citations from an arbitrary text when
 * NIS2 is not among the active frameworks. Used by report generators that
 * embed hardcoded NIS2 references in narrative strings.
 */
export function neutralizeNis2Text(text: string): string {
  if (isNis2Active()) return text;
  return text
    // Specific article citations first (longest match wins)
    .replace(/NIS2\s*Art\.\s*21\s*Abs\.\s*2\s*lit\.\s*[a-j]/gi, "regulatorische Anforderungen")
    .replace(/NIS2\s*Art\.\s*21\(2\)\([a-j]\)/gi, "regulatory requirements")
    .replace(/NIS2\s*Art\.\s*23/gi, "regulatorische Meldepflicht")
    .replace(/NIS2\s*Art\.\s*\d+(\s*Abs\.\s*\d+)?/gi, "regulatorische Anforderungen")
    .replace(/Art\.\s*21\s*Abs\.\s*\d+\s*lit\.\s*[a-j]\s*NIS2/gi, "regulatorische Anforderungen")
    // Compound German nouns
    .replace(/NIS2-Klauseln/gi, "regulatorische Klauseln")
    .replace(/NIS2-Schwerpunkt/gi, "regulatorischer Schwerpunkt")
    .replace(/NIS2-Richtlinie\s*\(EU\s*2022\/2555\)/gi, "regulatorische Vorgaben")
    .replace(/NIS2-Richtlinie/gi, "regulatorische Vorgaben")
    .replace(/NIS2\s*Directive\s*\(EU\s*2022\/2555\)/gi, "regulatory requirements")
    .replace(/NIS2\s*Directive/gi, "regulatory requirements")
    // Bare mentions
    .replace(/\bNIS2\s*und\s*/gi, "")
    .replace(/\s*und\s*NIS2\b/gi, "")
    .replace(/\bNIS2\s*and\s*/gi, "")
    .replace(/\s*and\s*NIS2\b/gi, "")
    .replace(/\bunter\s*NIS2\b/gi, "unter regulatorischen Anforderungen")
    .replace(/\bunder\s*NIS2\b/gi, "under regulatory requirements")
    .replace(/\bNIS2\b/g, "")
    // Cleanup double spaces / stray punctuation
    .replace(/\s{2,}/g, " ")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}
