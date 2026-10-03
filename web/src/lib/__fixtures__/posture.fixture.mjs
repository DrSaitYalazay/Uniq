/**
 * posture.fixture.mjs — E8 Verifikations-Fixture (kein Framework nötig).
 *
 * Prüft die Posture-/Trust-Engine (postureEngine.ts) gegen die harten Sollwerte
 * aus ENGINE_ARCHITECTURE_MARKETGRADE.md, Abschnitt E8:
 *   1) C=[0.9,0.8,0.6,1.0,0.7] ⇒ 100·(0.30·0.9+0.15·0.8+0.15·0.6+0.15·1.0+0.25·0.7)
 *      = 80.5.  coverage 1.0.
 *   2) + 1 critical Gap + 2 failing Tests (P = 5·1 + 3·2 = 11) ⇒ 80.5 − 11 = 69.5.
 *   3) no_data: nur C1 = 0.9 belegt ⇒ score 90, coverage 0.30.
 *   4) peerPercentile: value = p50 ⇒ 50 · value = p25 ⇒ 25 · n < 8 ⇒ null (Cold-Start).
 *
 * Ausführung:  node web/src/lib/__fixtures__/posture.fixture.mjs   (exit 0/1)
 * Kompiliert postureEngine.ts mit dem repo-lokalen esbuild (--bundle); type-only
 * Importe werden erased ⇒ keine Runtime-Deps.
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
const tmp = mkdtempSync(join(tmpdir(), "e8-posture-"));

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
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

try {
  const url = bundle("postureEngine.ts", "posture.mjs");
  const { computePosture, peerPercentile } = await import(url);

  const comp = (value) => ({ value });

  // ── (1) Reiner Score C=[0.9,0.8,0.6,1.0,0.7] ⇒ 80.5 ──
  console.log("E8.1 · Posture C=[0.9,0.8,0.6,1.0,0.7]");
  const r1 = computePosture({
    frameworkReadiness: comp(0.9),
    evidenceFreshness: comp(0.8),
    maturityNorm: comp(0.6),
    deadlineAdherence: comp(1.0),
    riskPosture: comp(0.7),
  });
  check("score = 80.5", near(r1.score, 80.5), `got ${r1.score}`);
  check("coverage = 1.0", near(r1.coverage, 1.0), `got ${r1.coverage}`);
  check("alle 5 Komponenten belegt", r1.components.filter(c => c.included).length === 5,
    JSON.stringify(r1.components.map(c => c.included)));
  check("keine Penalty", r1.penalties.every(p => p.points === 0), JSON.stringify(r1.penalties));

  // ── (2) Penalty: 1 critical Gap + 2 failing Tests ⇒ P=11 ⇒ 69.5 ──
  console.log("E8.1 · Penalty 1 critical Gap + 2 failing Tests (P=11)");
  const r2 = computePosture({
    frameworkReadiness: comp(0.9),
    evidenceFreshness: comp(0.8),
    maturityNorm: comp(0.6),
    deadlineAdherence: comp(1.0),
    riskPosture: comp(0.7),
    criticalGaps: 1,
    failingTests: 2,
  });
  check("score = 69.5", near(r2.score, 69.5), `got ${r2.score}`);
  const pSum = r2.penalties.reduce((s, p) => s + p.points, 0);
  check("Penalty-Summe = 11", pSum === 11, `got ${pSum}`);

  // ── (3) no_data: nur C1=0.9 ⇒ score 90, coverage 0.30 ──
  console.log("E8.1 · no_data (nur C1=0.9)");
  const r3 = computePosture({
    frameworkReadiness: comp(0.9),
    evidenceFreshness: { value: null },
    maturityNorm: { value: null },
    deadlineAdherence: { value: null },
    riskPosture: { value: null },
  });
  check("score = 90", near(r3.score, 90), `got ${r3.score}`);
  check("coverage = 0.30", near(r3.coverage, 0.3), `got ${r3.coverage}`);
  check("nur C1 belegt", r3.components.filter(c => c.included).map(c => c.key).join(",") === "C1",
    JSON.stringify(r3.components.filter(c => c.included).map(c => c.key)));
  check("C1 effectiveWeight = 1.0 (renormalisiert)",
    near(r3.components.find(c => c.key === "C1").effectiveWeight, 1.0),
    `got ${r3.components.find(c => c.key === "C1").effectiveWeight}`);

  // ── (4) peerPercentile ──
  console.log("E8.2 · peerPercentile (p25=40, p50=60, p75=80, n=12)");
  const stats = { p25: 40, p50: 60, p75: 80, n: 12 };
  check("value = p50 ⇒ 50", near(peerPercentile(60, stats), 50), `got ${peerPercentile(60, stats)}`);
  check("value = p25 ⇒ 25", near(peerPercentile(40, stats), 25), `got ${peerPercentile(40, stats)}`);
  check("value = p75 ⇒ 75", near(peerPercentile(80, stats), 75), `got ${peerPercentile(80, stats)}`);
  // Cold-Start: n < 8 ⇒ null.
  check("n < 8 ⇒ null (Cold-Start)", peerPercentile(60, { p25: 40, p50: 60, p75: 80, n: 5 }) === null,
    `got ${peerPercentile(60, { p25: 40, p50: 60, p75: 80, n: 5 })}`);
  check("stats null ⇒ null", peerPercentile(60, null) === null, `got ${peerPercentile(60, null)}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failed) {
  console.error("\nE8 FIXTURE FAILED");
  process.exit(1);
}
console.log("\nE8 FIXTURE OK — Posture 80.5 · Penalty 69.5 · no_data 90/0.30 · peerPercentile 50/25/null");
process.exit(0);
