/**
 * residual.fixture.mjs — E2 Verifikations-Fixture (kein Framework nötig).
 *
 * Prüft:
 *   1) computeControlEffectiveness (E2.1) für MFA (=0.64) und Notfallplan (=0.12)
 *   2) applyResidualRiskV2 (E2.2) — das Zahlenbeispiel aus der Spezifikation:
 *      inherent L4/I4 → F_L=0.36, F_I=0.88 → residual_L=2.08, residual_I=3.64,
 *      residual_score=7.57 (high statt critical)
 *   3) Identität: residual_model 'legacy' ⇒ deep-equal zu applyResidualRisk (alt)
 *
 * Ausführung:  node web/src/lib/__fixtures__/residual.fixture.mjs
 * Kompiliert die beiden .ts-Engines mit dem repo-lokalen esbuild (type-only
 * Importe werden erased ⇒ keine Alias-Auflösung, keine Runtime-Deps).
 */

import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve, join } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, "..", "..", ".."); // web/
const esbuild = join(webRoot, "node_modules", "esbuild", "bin", "esbuild");
const libDir = resolve(__dirname, "..");

const tmp = mkdtempSync(join(tmpdir(), "e2-residual-"));

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

const round2 = (v) => Math.round(v * 100) / 100;

try {
  const ceeUrl = bundle("controlEffectivenessEngine.ts", "cee.mjs");
  const riskUrl = bundle("riskEngine.ts", "risk.mjs");

  const { computeControlEffectiveness } = await import(ceeUrl);
  const { applyResidualRiskV2, applyResidualRisk } = await import(riskUrl);

  // Fixture-Config: 4×4-Matrix, Score 16 = critical, 7.57 = high.
  const cfg = {
    likelihoodScale: [],
    impactScale: [],
    thresholds: { low_max: 3, medium_max: 6, high_max: 12 },
    formula: "multiply",
    dimensions: { rows: 4, cols: 4 },
  };

  // ── E2.1: Control-Effectiveness ──
  const mfa = computeControlEffectiveness(
    { framework: "iso27001", control_id: "A.5.17", dimension: "likelihood", kind: "preventive", base_eff: 0.8 },
    { status: "ja", reifegrad: 3, origin: "explicit", note: null, evidence: null },
    { verify: "verified" },
  );
  const notfall = computeControlEffectiveness(
    { framework: "iso27001", control_id: "A.5.29", dimension: "impact", kind: "corrective", base_eff: 0.5 },
    { status: "teilweise", reifegrad: null, origin: "explicit", note: null, evidence: null },
    { verify: "unverified" },
  );

  console.log("E2.1 · Control-Effectiveness");
  check("MFA eff = 0.64", round2(mfa.eff) === 0.64, `got ${mfa.eff}`);
  check("MFA confidence = verified", mfa.confidence === "verified", mfa.confidence);
  check("Notfallplan eff = 0.12", round2(notfall.eff) === 0.12, `got ${notfall.eff}`);
  check("Notfallplan confidence = unverified", notfall.confidence === "unverified", notfall.confidence);

  // ── E2.2: Residual multiplikativ ──
  const inherentRisk = {
    risk_id: "risk-1",
    related_gap_id: "gap-1",
    scope: "asset",
    asset_id: "a1",
    asset_name: "Fachverfahren",
    service_id: null,
    service_name: null,
    capability_tag: "identity",
    description: "Kompromittierung ohne MFA",
    description_en: "Compromise without MFA",
    likelihood: 4,
    likelihood_reasons: [],
    impact: 4,
    impact_reasons: [],
    risk_score: 16,
    risk_level: "critical",
    inherent_score: 16,
    gap_severity: "critical",
    gap_title: "MFA fehlt",
    gap_title_en: "MFA missing",
    finding_count: 2,
    missing_count: 1,
    weak_count: 1,
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

  const effByControl = new Map([
    ["iso27001::A.5.17", mfa],
    ["iso27001::A.5.29", notfall],
  ]);
  const links = [
    { risk_id: "risk-1", control_key: "iso27001::A.5.17", dimension: "likelihood" },
    { risk_id: "risk-1", control_key: "iso27001::A.5.29", dimension: "impact" },
  ];

  const [res] = applyResidualRiskV2(
    [inherentRisk],
    links,
    effByControl,
    { ...cfg, residual_model: "multiplicative" },
  );

  console.log("E2.2 · Residual multiplikativ");
  check("residual_L = 2.08", round2(res.residual_likelihood) === 2.08, `got ${res.residual_likelihood}`);
  check("residual_I = 3.64", round2(res.residual_impact) === 3.64, `got ${res.residual_impact}`);
  check("residual_score = 7.57", round2(res.residual_score) === 7.57, `got ${res.residual_score}`);
  check("residual_level = high", res.residual_level === "high", res.residual_level);
  check("inherent_score preserved = 16", res.inherent_score === 16, `got ${res.inherent_score}`);
  check("residual_factors present (2)", Array.isArray(res.residual_factors) && res.residual_factors.length === 2,
    `got ${res.residual_factors?.length}`);

  // ── Identität: legacy ⇒ deep-equal alt ──
  const legacyRisks = [
    { ...inherentRisk, risk_id: "risk-A" },
    { ...inherentRisk, risk_id: "risk-B", likelihood: 3, impact: 2, risk_score: 6, risk_level: "medium", inherent_score: 6 },
  ];
  const treatments = [
    { risk_id: "risk-A", strategy: "mitigate", status: "done", selected_control_ids: [] },
  ];

  const legacyExpected = applyResidualRisk(legacyRisks, treatments, cfg);
  const v2Legacy = applyResidualRiskV2(legacyRisks, [], new Map(), { ...cfg, residual_model: "legacy" }, treatments);
  const v2Undefined = applyResidualRiskV2(legacyRisks, [], new Map(), cfg, treatments);

  console.log("Identität · legacy ⇒ applyResidualRisk (alt)");
  let deepOk = true;
  try { assert.deepStrictEqual(v2Legacy, legacyExpected); } catch { deepOk = false; }
  check("residual_model 'legacy' deep-equal alt", deepOk);

  let deepOk2 = true;
  try { assert.deepStrictEqual(v2Undefined, legacyExpected); } catch { deepOk2 = false; }
  check("residual_model undefined deep-equal alt", deepOk2);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failed) {
  console.error("\nFIXTURE FAILED");
  process.exit(1);
}
console.log("\nFIXTURE OK — 7.57 & Identität bestätigt");
process.exit(0);
