import { nis2Domains } from "../src/data/nis2Controls";
import { controlMetadata } from "../src/data/controlMetadata";
const ids = new Set<string>();
const dups: string[] = [];
for (const d of nis2Domains) for (const c of d.categories) for (const q of c.questions) {
  if (ids.has(q.id)) dups.push(q.id); else ids.add(q.id);
}
console.log("nis2Domains unique ids:", ids.size, "dupes:", dups.length, dups);
console.log("controlMetadata keys:", Object.keys(controlMetadata).length);
const meta = new Set(Object.keys(controlMetadata));
console.log("Only in domains:", [...ids].filter(x => !meta.has(x)));
console.log("Only in metadata:", [...meta].filter(x => !ids.has(x)));
