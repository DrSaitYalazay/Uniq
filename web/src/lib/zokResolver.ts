/**
 * ZOK Resolver — bridges asset.zok_ids → concrete measures + risks.
 *
 * Given an asset's assigned ZOK ids, this expands to all ancestor ZOKs
 * (vererbung along the BSI Grundschutz++ hierarchy), then unions the
 * deduplicated catalog entries from `zokCatalog`.
 *
 * For organization-wide gaps (no asset / scope === "organization"),
 * the special `__isms__` bucket is used.
 */

import { zokCatalog } from "@/data/zokCatalog";
import { zokSpecialtySeed } from "@/data/zokSpecialtySeed";
import { getEffectiveZokIds, getZok, type ZokId } from "@/data/zielobjektkategorien";
import { controlCatalog, type CatalogMeasure, type CatalogRisk } from "@/data/controlCatalog";
import { controlMetadata } from "@/data/controlMetadata";

/**
 * Index: catalog risk-id / measure-id → familyId of its source control.
 * Used to filter the verbundweite ISMS bucket to a single capability so an
 * org-wide gap (e.g. Supplier Security) does not surface 276 unrelated risks.
 */
const _riskIdToFamily = new Map<string, string>();
const _measureIdToFamily = new Map<string, string>();
for (const [cid, entry] of Object.entries(controlCatalog)) {
  const fam = controlMetadata[cid]?.familyId;
  if (!fam) continue;
  for (const r of entry.risks) if (!_riskIdToFamily.has(r.id)) _riskIdToFamily.set(r.id, fam);
  for (const m of entry.measures) if (!_measureIdToFamily.has(m.id)) _measureIdToFamily.set(m.id, fam);
}

/** Returns measures+risks for a single ZOK, base catalog plus specialty seed. */
function bucketFor(id: ZokId): { measures: CatalogMeasure[]; risks: CatalogRisk[] } {
  const base = zokCatalog[id];
  const seed = zokSpecialtySeed[id];
  return {
    measures: [...(base?.measures ?? []), ...(seed?.measures ?? [])],
    risks: [...(base?.risks ?? []), ...(seed?.risks ?? [])],
  };
}

export interface ResolvedZokCatalog {
  measures: CatalogMeasure[];
  risks: CatalogRisk[];
  /** ZOK ids actually contributing (assigned + ancestors), in display order */
  effective_zok_ids: ZokId[];
  /** Localized hierarchical labels for explainability (e.g. "IT-Systeme › Endgeräte") */
  source_paths_de: string[];
  source_paths_en: string[];
  /** True if entries come from the verbundweite ISMS bucket */
  from_isms: boolean;
}

const EMPTY: ResolvedZokCatalog = {
  measures: [],
  risks: [],
  effective_zok_ids: [],
  source_paths_de: [],
  source_paths_en: [],
  from_isms: false,
};

function unionByMeasureId(arrs: CatalogMeasure[][]): CatalogMeasure[] {
  const seen = new Set<string>();
  const out: CatalogMeasure[] = [];
  for (const arr of arrs) {
    for (const m of arr) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      out.push(m);
    }
  }
  return out;
}

function unionByRiskId(arrs: CatalogRisk[][]): CatalogRisk[] {
  const seen = new Set<string>();
  const out: CatalogRisk[] = [];
  for (const arr of arrs) {
    for (const r of arr) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
    }
  }
  return out;
}

/**
 * Resolves catalog entries for a specific asset's ZOK assignment.
 * Falls back to ISMS bucket when asset has no ZOK ids.
 */
export function resolveAssetCatalog(zokIds: ZokId[] | null | undefined): ResolvedZokCatalog {
  const ids = (zokIds ?? []).filter((id): id is ZokId => !!getZok(id));
  if (ids.length === 0) {
    return resolveOrgCatalog();
  }
  const effective = getEffectiveZokIds(ids);
  const measures = unionByMeasureId(effective.map(id => bucketFor(id).measures));
  const risks = unionByRiskId(effective.map(id => bucketFor(id).risks));
  return {
    measures,
    risks,
    effective_zok_ids: effective,
    source_paths_de: effective.map(id => labelChain(id, "de")),
    source_paths_en: effective.map(id => labelChain(id, "en")),
    from_isms: false,
  };
}

/**
 * Returns the verbundweite ISMS bucket (for organization-wide gaps).
 * When `capability_tag` is provided, the bucket is filtered down to risks
 * and measures whose source control belongs to that capability — preventing
 * a single org-wide gap (e.g. Supplier Security) from surfacing all 276
 * generic ISMS risks.
 */
export function resolveOrgCatalog(capability_tag?: string | null): ResolvedZokCatalog {
  const entry = zokCatalog["__isms__"];
  if (!entry) return EMPTY;
  const cap = capability_tag ?? null;
  const risks = cap
    ? entry.risks.filter(r => _riskIdToFamily.get(r.id) === cap)
    : entry.risks;
  const measures = cap
    ? entry.measures.filter(m => _measureIdToFamily.get(m.id) === cap)
    : entry.measures;
  // Fallback: if the capability filter eliminates everything (e.g. a
  // capability with no ISMS-bucket coverage), fall back to the unfiltered
  // bucket so the user still sees something rather than an empty list.
  const useFiltered = cap !== null && (risks.length > 0 || measures.length > 0);
  return {
    measures: useFiltered ? measures : entry.measures,
    risks: useFiltered ? risks : entry.risks,
    effective_zok_ids: [],
    source_paths_de: [useFiltered ? `ISMS (verbundweit, gefiltert auf Capability)` : "ISMS (verbundweit)"],
    source_paths_en: [useFiltered ? `ISMS (organization-wide, filtered by capability)` : "ISMS (organization-wide)"],
    from_isms: true,
  };
}

function labelChain(id: ZokId, lang: "de" | "en"): string {
  const node = getZok(id);
  if (!node) return id;
  return lang === "de" ? node.label_de : node.label_en;
}

/**
 * Helper for engines: resolve based on scope + asset zok_ids + (optional)
 * capability tag. Returns a deduplicated, ordered catalog plus
 * explainability metadata. `capability_tag` is only consulted for
 * organization-wide gaps to filter the ISMS bucket.
 */
export function resolveCatalogForGap(opts: {
  scope: "asset" | "organization";
  asset_zok_ids?: ZokId[] | null;
  capability_tag?: string | null;
}): ResolvedZokCatalog {
  if (opts.scope === "organization") return resolveOrgCatalog(opts.capability_tag ?? null);
  return resolveAssetCatalog(opts.asset_zok_ids ?? []);
}
