// Fixture: H1 — gewichteter Reifegrad (V3) vs. ungewichtet (V2).
// Ausführen: esbuild-Bundle von maturityV2.ts erzeugen, dann mit node importieren:
//   esbuild src/lib/maturityV2.ts --bundle --format=esm --platform=node --outfile=/tmp/mat.mjs
//   node src/lib/__fixtures__/maturityWeighted.fixture.mjs   (mat.mjs-Pfad ggf. anpassen)
//
// Zweck: belegt, dass wichtige (MUSS-)Kontrollen im gewichteten Rollup stärker
// zählen. Bei schlecht umgesetzten MUSS (Reifegrad 2) und gut umgesetzten
// KANN (Reifegrad 5) liegt der gewichtete Overall UNTER dem ungewichteten.
import { computeFrameworkMaturity, computeFrameworkMaturityV3 } from "/tmp/mat.mjs";

const controls = [
  { id: "a", framework: "ISO27001", muss: "true",  meta: { family: "F1", family_label: "Familie 1" } },
  { id: "b", framework: "ISO27001", muss: "true",  meta: { family: "F1", family_label: "Familie 1" } },
  { id: "c", framework: "ISO27001", muss: "false", meta: { family: "F1", family_label: "Familie 1" } },
  { id: "d", framework: "ISO27001", muss: "false", meta: { family: "F1", family_label: "Familie 1" } },
  { id: "e", framework: "ISO27001", muss: "false", meta: { family: "F1", family_label: "Familie 1" } },
];
const eff = new Map([["a",{reifegrad:2}],["b",{reifegrad:2}],["c",{reifegrad:5}],["d",{reifegrad:5}],["e",{reifegrad:5}]]);
const base = { framework: "ISO27001", usesMaturity: true, controls, effective: eff, targets: undefined };

const v2 = computeFrameworkMaturity(base);
const weights = new Map(controls.map(c => [c.id, c.muss === "true" ? 1.0 : 0.5]));
const v3 = computeFrameworkMaturityV3({ ...base, weights, derivedCap: 5 });

const ok = v2.overall === 3.8 && v3.overall === 3.3 && v3.overall < v2.overall && v3.groups[0].confidence === "high";
console.log("V2 ungewichtet:", v2.overall, "| V3 gewichtet:", v3.overall, "| coverage:", v3.groups[0].coverage);
console.log(ok ? "✅ PASS — gewichtet < ungewichtet (MUSS dominiert)" : "❌ FAIL");
if (!ok) process.exit(1);
