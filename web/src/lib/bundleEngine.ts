/**
 * bundleEngine — maps risks / controls / measures to one of the 59 ISO 27001:2022
 * Annex A controls ("Bundles"). Used by Step 8 (Risk), Step 9 (Decisions),
 * and Step 15 (Roadmap) so that the same ISO bundle id surfaces consistently
 * with shared owner overrides via useBundleOwners.
 */

import { controlCatalog } from "@/data/controlCatalog";
import { ISO_CONTROL_MAP, extractIsoRef, type IsoControl } from "@/data/iso27001Effort";
import type { RiskObject } from "@/lib/riskEngine";

export interface BundleMeta {
  id: string;            // ISO ref like "A.5.15"
  title: string;         // DE title
  titleEn: string;       // EN title
  iso?: IsoControl;
}

/** Standalone bucket key for items without an ISO mapping. */
export const STANDALONE_BUNDLE_KEY = "__no_iso__";

/** Resolve the dominant ISO Annex A ref for a control id by inspecting the
 *  iso_ref of its mapped measures. Returns null if none found.
 *
 *  Optional Knoten-Brücke: wenn `isoRefByControlId` übergeben wird UND einen
 *  Treffer für `controlId` enthält, gewinnt dieser (bereits normalisierte)
 *  ISO-Ref. So können fremde (Nicht-NIS2-)control_ids über den Kontroll-Knoten
 *  auf ein ISO-Mitglied des Knotens abgebildet werden, ohne den statischen
 *  controlCatalog-Pfad zu verändern. Parameter ist rein additiv/optional —
 *  ohne Map ist das Verhalten byte-identisch zum bisherigen. */
export function getIsoRefForControl(
  controlId: string | null | undefined,
  isoRefByControlId?: ReadonlyMap<string, string>,
): string | null {
  if (!controlId) return null;
  if (isoRefByControlId) {
    const bridged = isoRefByControlId.get(controlId);
    if (bridged) return bridged;
  }
  const entry = (controlCatalog as Record<string, any>)[controlId];
  if (!entry) return null;
  const measures: Array<{ iso_ref?: string }> = Array.isArray(entry.measures) ? entry.measures : [];
  if (measures.length === 0) return null;
  const counts = new Map<string, number>();
  for (const m of measures) {
    const ref = extractIsoRef(m.iso_ref);
    if (!ref) continue;
    counts.set(ref, (counts.get(ref) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  let best: string | null = null;
  let bestN = 0;
  for (const [ref, n] of counts) {
    if (n > bestN) { best = ref; bestN = n; }
  }
  return best;
}

/** Resolve the ISO bundle key for a risk. Uses the first supporting finding's
 *  control_id (or the related_gap_id prefix) to look up the dominant ISO ref.
 *
 *  `isoRefByControlId` wird — falls übergeben — additiv an
 *  getIsoRefForControl durchgereicht (Knoten-Brücke). Ohne Map byte-identisch. */
export function getIsoRefForRisk(
  risk: RiskObject,
  isoRefByControlId?: ReadonlyMap<string, string>,
): string | null {
  // Prefer the supporting findings (they carry the control_id directly).
  const findings = (risk as any).supporting_findings as Array<{ control_id: string }> | undefined;
  if (findings && findings.length > 0) {
    // Majority vote across all supporting findings.
    const counts = new Map<string, number>();
    for (const f of findings) {
      const ref = getIsoRefForControl(f.control_id, isoRefByControlId);
      if (!ref) continue;
      counts.set(ref, (counts.get(ref) ?? 0) + 1);
    }
    if (counts.size > 0) {
      let best: string | null = null;
      let bestN = 0;
      for (const [ref, n] of counts) {
        if (n > bestN) { best = ref; bestN = n; }
      }
      if (best) return best;
    }
  }
  // Fallback: derive from related_gap_id which typically starts with a control id.
  const gapId: string = (risk as any).related_gap_id ?? "";
  const m = gapId.match(/^([a-z]-\d+)/i);
  if (m) {
    const ref = getIsoRefForControl(m[1].toLowerCase(), isoRefByControlId);
    if (ref) return ref;
  }
  return null;
}

/** Lookup human-readable meta for a bundle key. */
export function getBundleMeta(bundleKey: string): BundleMeta {
  if (bundleKey === STANDALONE_BUNDLE_KEY) {
    return { id: STANDALONE_BUNDLE_KEY, title: "Sonstige Maßnahmen", titleEn: "Other measures" };
  }
  const iso = ISO_CONTROL_MAP[bundleKey];
  if (iso) {
    return { id: bundleKey, title: iso.title, titleEn: iso.titleEn, iso };
  }
  return { id: bundleKey, title: bundleKey, titleEn: bundleKey };
}

/** Group an array of items by a derived bundle key. Items returning null map
 *  to STANDALONE_BUNDLE_KEY. */
export function groupByBundle<T>(
  items: T[],
  getKey: (item: T) => string | null,
): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const it of items) {
    const k = getKey(it) ?? STANDALONE_BUNDLE_KEY;
    const arr = out.get(k) ?? [];
    arr.push(it);
    out.set(k, arr);
  }
  return out;
}

/** Stable sort order for bundle keys: ISO refs ascending (A.5.x before A.6.x),
 *  standalone bucket last. */
export function sortBundleKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    if (a === STANDALONE_BUNDLE_KEY) return 1;
    if (b === STANDALONE_BUNDLE_KEY) return -1;
    // Natural sort by section + number
    const pa = a.split(".").map(s => parseInt(s.replace(/[^\d]/g, ""), 10) || 0);
    const pb = b.split(".").map(s => parseInt(s.replace(/[^\d]/g, ""), 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const da = pa[i] ?? 0;
      const db = pb[i] ?? 0;
      if (da !== db) return da - db;
    }
    return a.localeCompare(b);
  });
}
