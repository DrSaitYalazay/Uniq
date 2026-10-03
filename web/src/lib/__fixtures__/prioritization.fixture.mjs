/**
 * prioritization.fixture.mjs — E7 Verifikations-Fixture (kein Framework nötig).
 *
 * Prüft die marktreife Priorisierungs-Engine (prioritizationEngine.ts) gegen die
 * harten Sollwerte aus ENGINE_ARCHITECTURE_MARKETGRADE.md, Abschnitt E7:
 *   1) Knapsack: 3 Maßnahmen Δ=10/PT2, Δ=9/PT9, Δ=4/PT1, Budget 3 ⇒ DP wählt
 *      {M1,M3} (ΣΔ 14) NICHT die Greedy-Falle {M2}; method 'dp'.
 *   2) Δ-ALE zweimal mit gleichem Seed ⇒ byte-identisch (Common Random Numbers).
 *   3) ROSI: ΔALE 240 000, Kosten 60 000 ⇒ 3.0.
 *   4) depends_on-Sperre: Nachfolger ohne gewählten Vorgänger wird gesperrt.
 *
 * Ausführung:  node web/src/lib/__fixtures__/prioritization.fixture.mjs   (exit 0/1)
 * Kompiliert prioritizationEngine.ts (+ transitiv fair/risk/…) mit dem repo-lokalen
 * esbuild (--bundle); type-only Importe werden erased ⇒ keine Runtime-Deps.
 */

import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve, join } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, "..", "..", ".."); // web/
const esbuild = join(webRoot, "node_modules", "esbuild", "bin", "esbuild");
const libDir = resolve(__dirname, "..");
const tmp = mkdtempSync(join(tmpdir(), "e7-prio-"));

function bundle(tsRel, outName) {
  const src = join(libDir, tsRel);
  const out = join(tmp, outName);
  execFileSync(esbuild, [src, "--bundle", "--format=esm", "--platform=node", `--outfile=${out}`], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  return pathToFileURL(out).href;
}

let failed = false;
function check(name, cond, detail) {
  if (cond) {
    console.log(`  ok   ${name}`);
  } else {
    failed = true;
    console.error(`  FAIL ${name}${detail ? " — " + detail : ""}`);
  }
}

const sameSet = (a, b) => a.length === b.length && [...a].sort().join(",") === [...b].sort().join(",");

try {
  const url = bundle("prioritizationEngine.ts", "prio.mjs");
  const { scoreMeasures, selectQuickWins } = await import(url);

  // ── (1) Knapsack: DP schlägt die Greedy-Falle ──
  console.log("E7.2 · Knapsack (Δ=10/PT2, Δ=9/PT9, Δ=4/PT1, Budget 3)");
  const scored = [
    { measureId: "M1", deltaOrdinal: 10, deltaAleEur: null, effortPt: 2, priority: 5, rosi: null, perRisk: [] },
    { measureId: "M2", deltaOrdinal: 9, deltaAleEur: null, effortPt: 9, priority: 1, rosi: null, perRisk: [] },
    { measureId: "M3", deltaOrdinal: 4, deltaAleEur: null, effortPt: 1, priority: 4, rosi: null, perRisk: [] },
  ];
  const qw = selectQuickWins(scored, 3);
  check("DP wählt {M1,M3}", sameSet(qw.selected, ["M1", "M3"]), JSON.stringify(qw.selected));
  check("nicht die Greedy-Falle {M2}", !qw.selected.includes("M2"), JSON.stringify(qw.selected));
  check("ΣΔ = 14", qw.totalDelta === 14, `got ${qw.totalDelta}`);
  check("totalEffort = 3 PT", qw.totalEffort === 3, `got ${qw.totalEffort}`);
  check("method = 'dp'", qw.method === "dp", qw.method);

  // ── (2) Δ-ALE deterministisch (Common Random Numbers) ──
  console.log("E7.1 · Δ-ALE deterministisch (gleicher Seed)");
  const risk = {
    risk_id: "risk-1",
    related_gap_id: "gap-1",
    scope: "asset",
    asset_id: "a1",
    asset_name: "Fachverfahren",
    service_id: null,
    service_name: null,
    capability_tag: "identity",
    description: "",
    description_en: "",
    likelihood: 4,
    likelihood_reasons: [],
    impact: 4,
    impact_reasons: [],
    risk_score: 16,
    risk_level: "critical",
    inherent_score: 16,
    gap_severity: "critical",
    gap_title: "",
    gap_title_en: "",
    finding_count: 1,
    missing_count: 1,
    weak_count: 0,
    supporting_findings: [],
    gap_why_it_matters: "",
    gap_why_it_matters_en: "",
    gap_recommendation: "",
    gap_recommendation_en: "",
    catalog_risks: [],
    zok_source_paths_de: [],
    zok_source_paths_en: [],
    catalog_from_isms: false,
  };
  const cfg = {
    likelihoodScale: [],
    impactScale: [],
    thresholds: { low_max: 3, medium_max: 6, high_max: 12 },
    formula: "multiply",
    dimensions: { rows: 4, cols: 4 },
  };
  // Control noch nicht umgesetzt (impl 0 ⇒ eff 0), Maßnahme setzt es voll um.
  const effByControl = new Map([
    ["iso27001::A.5.17", { eff: 0, factors: { base: 0.8, impl: 0, maturity: 0.8, verify: 0.85 }, confidence: "attested" }],
  ]);
  const links = [{ risk_id: "risk-1", control_key: "iso27001::A.5.17", dimension: "likelihood" }];
  const measures = [
    { id: "MA", selected_control_ids: ["iso27001::A.5.17"], effort_pt: 5, cost_eur: null },
  ];
  const quant = new Map([
    ["risk-1", { lefMin: 1, lefLikely: 2, lefMax: 4, lmMin: 10000, lmLikely: 50000, lmMax: 200000 }],
  ]);

  const runA = scoreMeasures(measures, [risk], links, effByControl, cfg, quant, 777);
  const runB = scoreMeasures(measures, [risk], links, effByControl, cfg, quant, 777);
  check("ΔALE vorhanden (nicht null)", runA[0].deltaAleEur != null, `got ${runA[0].deltaAleEur}`);
  check("ΔALE > 0 (Reduktion)", runA[0].deltaAleEur > 0, `got ${runA[0].deltaAleEur}`);
  check("ΔALE deterministisch (Lauf A == Lauf B)", runA[0].deltaAleEur === runB[0].deltaAleEur,
    `${runA[0].deltaAleEur} vs ${runB[0].deltaAleEur}`);
  check("ordinal ΔR > 0", runA[0].deltaOrdinal > 0, `got ${runA[0].deltaOrdinal}`);
  check("perRisk-Herleitung vorhanden", runA[0].perRisk.length === 1 && runA[0].perRisk[0].before > runA[0].perRisk[0].after,
    JSON.stringify(runA[0].perRisk));

  // Gegenprobe: unterschiedlicher Seed ⇒ (i.d.R.) unterschiedliches ΔALE,
  // aber wieder in sich deterministisch.
  const runC = scoreMeasures(measures, [risk], links, effByControl, cfg, quant, 12345);
  const runD = scoreMeasures(measures, [risk], links, effByControl, cfg, quant, 12345);
  check("Seed 12345 in sich deterministisch", runC[0].deltaAleEur === runD[0].deltaAleEur,
    `${runC[0].deltaAleEur} vs ${runD[0].deltaAleEur}`);

  // ── (3) ROSI: ΔALE 240k / Kosten 60k ⇒ 3.0 ──
  console.log("E7.1 · ROSI (ΔALE 240 000, Kosten 60 000)");
  // Szenario so wählen, dass mean(ALE heute) − mean(mit m) = 240 000 nicht
  // exakt trivial ist; ROSI-Formel direkt am kontrollierten Fall prüfen:
  // ein Control mit eff=1.0 ⇒ fVuln=0 ⇒ ALE_after=0 ⇒ ΔALE = ALE_heute.
  // Wir eichen ALE_heute über LEF/LM auf 240 000 (LEF=2 · LM=120 000).
  const rosiRisk = { ...risk, risk_id: "risk-2" };
  const rosiEff = new Map([
    ["iso27001::FULL", { eff: 1.0, factors: { base: 1, impl: 1, maturity: 1, verify: 1 }, confidence: "verified" }],
  ]);
  const rosiLinks = [{ risk_id: "risk-2", control_key: "iso27001::FULL", dimension: "likelihood" }];
  const rosiMeasures = [
    { id: "MR", selected_control_ids: ["iso27001::FULL"], effort_pt: 10, cost_eur: 60000 },
  ];
  // Deterministisches LM (min=likely=max) und LEF (min=likely=max=2) ⇒ ALE ≡ 240 000.
  const rosiQuant = new Map([
    ["risk-2", { lefMin: 2, lefLikely: 2, lefMax: 2, lmMin: 120000, lmLikely: 120000, lmMax: 120000 }],
  ]);
  const rosiScore = scoreMeasures(rosiMeasures, [rosiRisk], rosiLinks, rosiEff, cfg, rosiQuant, 999)[0];
  check("ΔALE = 240 000", Math.round(rosiScore.deltaAleEur) === 240000, `got ${rosiScore.deltaAleEur}`);
  check("ROSI = 3.0", Math.abs(rosiScore.rosi - 3.0) < 1e-9, `got ${rosiScore.rosi}`);

  // ── (4) depends_on-Sperre ──
  console.log("E7.2 · depends_on-Sperre");
  const depScored = [
    // M_pre teuer (passt nicht ins Budget 2), M_post hängt von M_pre ab.
    { measureId: "PRE", deltaOrdinal: 5, deltaAleEur: null, effortPt: 5, priority: 1, rosi: null, perRisk: [] },
    { measureId: "POST", deltaOrdinal: 8, deltaAleEur: null, effortPt: 1, priority: 8, rosi: null, perRisk: [], dependsOn: ["PRE"] },
    { measureId: "FREE", deltaOrdinal: 3, deltaAleEur: null, effortPt: 1, priority: 3, rosi: null, perRisk: [] },
  ];
  const dep = selectQuickWins(depScored, 2);
  check("POST gesperrt (Vorgänger PRE nicht wählbar)", !dep.selected.includes("POST"), JSON.stringify(dep.selected));
  check("FREE stattdessen gewählt", dep.selected.includes("FREE"), JSON.stringify(dep.selected));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failed) {
  console.error("\nE7 FIXTURE FAILED");
  process.exit(1);
}
console.log("\nE7 FIXTURE OK — DP {M1,M3} · CRN-deterministisch · ROSI 3.0 · depends_on bestätigt");
process.exit(0);
