/**
 * ISO/IEC 27001:2022 — MASTER catalogue.
 *
 * Hydrated from the ISMSSuite single-source-of-truth:
 *   src/data/frameworks/iso27001/controls-map.json   (345 controls)
 *   src/data/frameworks/iso27001/structure.json      (domain/category tree)
 *
 * Control IDs are lower-cased ("a5-01", "c4-01") to match the legacy
 * storage keys used across the app.
 */
import type { FrameworkCatalog, ControlDef } from "./types";
import controlsMap from "./iso27001/controls-map.json";
import structureJson from "./iso27001/structure.json";

interface MapEntry {
  control_id: string;
  clause: string;
  question: string;
  question_de?: string;
  description_en?: string;
  description_de?: string;
  domain_id?: string;
  category_id?: string;
}
interface Structure {
  domains: { id: string; title: string; titleDe: string; icon: string; categoryIds: string[] }[];
  categories: { id: string; clause: string; title: string; titleDe: string; description: string; icon: string }[];
}

const map = controlsMap as MapEntry[];
const structure = structureJson as Structure;

const categoryById = new Map(structure.categories.map((c) => [c.id, c]));
// domain lookup for control -> theme
const domainByCategory = new Map<string, { id: string; title: string; titleDe: string }>();
for (const d of structure.domains) {
  for (const cid of d.categoryIds) {
    domainByCategory.set(cid, { id: d.id, title: d.title, titleDe: d.titleDe });
  }
}

const controls: ControlDef[] = map.map((e) => {
  const cat = e.category_id ? categoryById.get(e.category_id) : undefined;
  const dom = e.category_id ? domainByCategory.get(e.category_id) : undefined;
  return {
    id: e.control_id.toLowerCase(),
    framework: "iso27001",
    theme: dom?.titleDe ?? cat?.titleDe ?? e.clause,
    titleDe: e.question_de ?? e.question,
    titleEn: e.question,
    descriptionDe: e.description_de,
    descriptionEn: e.description_en,
    reference: cat?.clause,
  };
});

export const ISO27001_CATALOG: FrameworkCatalog = {
  id: "iso27001",
  version: "2022",
  labelDe: "ISO/IEC 27001:2022 + ISMS-Klauseln",
  labelEn: "ISO/IEC 27001:2022 + ISMS clauses",
  isMaster: true,
  controls,
};

export const ISO27001_BY_ID: Record<string, ControlDef> = Object.fromEntries(
  controls.map((x) => [x.id, x]),
);

/** Categories exposed so mapping UI can group. */
export const ISO27001_CATEGORIES = structure.categories;
export const ISO27001_DOMAINS = structure.domains;

/** Sanity: 345 controls in the ISMSSuite catalogue. */
export const ISO27001_COUNT = controls.length;

/** Controls grouped by category id (e.g. "a5-policies"). */
export const ISO27001_BY_CATEGORY: Record<string, ControlDef[]> = (() => {
  const grouped: Record<string, ControlDef[]> = {};
  for (const e of map) {
    const cid = e.category_id ?? "unknown";
    (grouped[cid] ??= []).push(ISO27001_BY_ID[e.control_id.toLowerCase()]);
  }
  return grouped;
})();
