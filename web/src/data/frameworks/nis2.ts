/**
 * NIS2 catalogue — 236 questions across 29 categories.
 *
 * Hydrated from the NIS2Suite single-source-of-truth:
 *   src/data/frameworks/nis2ControlsSource.ts
 *
 * The source file already exports `nis2Categories` (list of `NIS2Category`
 * with nested question arrays). We flatten it into the generic
 * `ControlDef` shape used by the mapping engine.
 */
import type { FrameworkCatalog, ControlDef } from "./types";
import { nis2Categories, type NIS2Category, type ControlQuestion } from "./nis2ControlsSource";

const controls: ControlDef[] = [];
const catByQuestion: Record<string, string> = {};

for (const cat of nis2Categories as NIS2Category[]) {
  for (const q of cat.questions as ControlQuestion[]) {
    controls.push({
      id: q.id,
      framework: "nis2",
      theme: cat.titleDe,
      titleDe: q.question,
      titleEn: q.questionEn,
      descriptionDe: q.description,
      descriptionEn: q.descriptionEn,
      reference: cat.nis2Ref ?? cat.article,
    });
    catByQuestion[q.id] = cat.id;
  }
}

export const NIS2_CATALOG: FrameworkCatalog = {
  id: "nis2",
  version: "2022/2555",
  labelDe: "NIS2 (EU) 2022/2555",
  labelEn: "NIS2 Directive (EU) 2022/2555",
  isMaster: false,
  controls,
};

export const NIS2_BY_ID: Record<string, ControlDef> = Object.fromEntries(
  controls.map((x) => [x.id, x]),
);

/** Category (as declared in the source file) each question belongs to. */
export const NIS2_QUESTION_CATEGORY: Record<string, string> = catByQuestion;

/** All 29 categories re-exported for the framework switcher UI. */
export const NIS2_CATEGORIES = nis2Categories;

export const NIS2_COUNT = controls.length; // 236
