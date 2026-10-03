import { writeFileSync } from "fs";
import { nis2Domains } from "../src/data/nis2Controls";
import { controlMetadata } from "../src/data/controlMetadata";
import { nis2Requirements, getNis2RequirementForControl, getNis2RequirementById } from "../src/data/nis2RequirementMapping";

const rows: any[] = [];
for (const d of nis2Domains) {
  for (const cat of d.categories) {
    for (const q of cat.questions) {
      const meta = controlMetadata[q.id];
      const familyId = meta?.familyId ?? "governance";
      const nis2Id = getNis2RequirementForControl(q.id, familyId);
      const req = getNis2RequirementById(nis2Id)!;
      rows.push({
        control_id: q.id,
        control_de: q.question,
        control_en: q.questionEn,
        description_de: q.description,
        description_en: q.descriptionEn,
        scope: meta?.scope ?? "unknown",
        family: familyId,
        domain_de: d.titleDe,
        domain_en: d.title,
        category_de: cat.titleDe,
        category_en: cat.title,
        nis2_article: req.article,
        nis2_title_de: req.title,
        nis2_title_en: req.titleEn,
      });
    }
  }
}
writeFileSync("/tmp/nis2_mapping.json", JSON.stringify(rows, null, 2));
console.log(`Exported ${rows.length} controls`);
