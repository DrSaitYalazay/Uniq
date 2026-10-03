import { controlCatalog } from "../src/data/controlCatalog";
import { reviewCrossMapAdditions, reviewMeasureUnmappings, reviewRemovedControlIds, reviewRemovedRiskIds, reviewRevisedRiskMap } from "../src/data/controlCatalogReview";
const ids = Object.keys(controlCatalog);
let risks = 0; for (const c of Object.values(controlCatalog)) risks += c.risks.length;
console.log("controls:", ids.length, "(expected 236)");
console.log("risks:", risks, "(expected 711)");
console.log("removed controls applied:", [...reviewRemovedControlIds].every(id => !controlCatalog[id]));
let revOk = 0;
for (const c of Object.values(controlCatalog)) for (const r of c.risks)
  if (reviewRevisedRiskMap.has(r.id)) revOk++;
console.log("revised risks present:", revOk, "of", reviewRevisedRiskMap.size);
console.log("cross-additions:", reviewCrossMapAdditions.length, "(283)");
console.log("unmappings:", reviewMeasureUnmappings.length, "(82)");
