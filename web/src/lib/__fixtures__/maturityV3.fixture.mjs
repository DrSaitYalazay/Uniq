/**
 * maturityV3.fixture.mjs — E6 Verifikations-Fixture (kein Framework/DB nötig).
 *
 * Prüft:
 *   1) Gewichtete Familie r=[3(w2), 5(w1)] ⇒ ist_raw = (3·2+5·1)/(2+1) = 3.6667
 *      (round2 = 3.67, gespeichert round1 = 3.7 — konsistent mit V2 „eine Nachkommastelle").
 *   2) IDENTITÄT zu V2: computeFrameworkMaturityV3 mit weights=undefined (⇒ w_c=1),
 *      domainWeights={} (⇒ 1) und derivedCap=5 ⇒ deep-equal computeFrameworkMaturity (V2)
 *      für usesMaturity=true UND usesMaturity=false. Die additiven Group-Felder
 *      coverage/confidence werden für den Vergleich projiziert (weggeschnitten).
 *      (Overall-Identität: Fixture nutzt gleich große Familien ⇒ W_f konstant ⇒
 *       gewichteter Overall == Familien-Mittel wie V2.)
 *   3) Trend: 4 Punkte auf perfekter Geraden (Werte 1,2,3,4 im Wochentakt) ⇒
 *      slope = 1 Level/Woche, stderr ≈ 0, forecast(target 6) exakt (letztes + 14 Tage).
 *
 * Ausführung:  node web/src/lib/__fixtures__/maturityV3.fixture.mjs
 * Kompiliert maturityV2.ts mit dem repo-lokalen esbuild (type-only Importe werden
 * erased ⇒ keine Alias-Auflösung, keine Runtime-Deps).
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
const tmp = mkdtempSync(join(tmpdir(), "e6-maturity-"));

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

// Kontroll-Helfer: minimaler ControlRow mit meta.family (steuert Familien-Bucket).
const ctrl = (id, family) => ({
  id,
  framework: "TEST",
  sub_sector: null,
  req_de: null,
  req_en: null,
  muss: null,
  tags: null,
  meta: { family, family_label: family },
});
const ans = (over) => ({ status: null, reifegrad: null, origin: "explicit", note: null, evidence: null, ...over });

// Projektion: V3-Gruppen auf die V2-Form reduzieren (coverage/confidence entfernen).
function stripV3(res) {
  return {
    overall: res.overall,
    derived: res.derived,
    groups: res.groups.map(({ coverage, confidence, ...g }) => g),
  };
}

try {
  const url = bundle("maturityV2.ts", "maturityV2.mjs");
  const { computeFrameworkMaturity, computeFrameworkMaturityV3, maturityTrend } = await import(url);

  // ── 1) Gewichtete Familie r=[3(w2), 5(w1)] ─────────────────────────────
  console.log("E6.1 · Gewichteter Familien-Rollup");
  const wControls = [ctrl("W1", "Fam"), ctrl("W2", "Fam")];
  const wEff = new Map([
    ["W1", ans({ reifegrad: 3 })],
    ["W2", ans({ reifegrad: 5 })],
  ]);
  const wWeights = new Map([["W1", 2], ["W2", 1]]);
  const wRes = computeFrameworkMaturityV3({
    framework: "TEST",
    usesMaturity: true,
    controls: wControls,
    effective: wEff,
    weights: wWeights,
  });
  const g0 = wRes.groups[0];
  const istRaw = (3 * 2 + 5 * 1) / (2 + 1); // 3.6667
  check("ist_raw = 3.67 (round2)", round2(istRaw) === 3.67, `got ${round2(istRaw)}`);
  check("gespeicherte ist = 3.7 (round1, wie V2)", g0.ist === 3.7, `got ${g0.ist}`);
  check("coverage = 1 (alle erfasst)", g0.coverage === 1, `got ${g0.coverage}`);
  check("confidence = high", g0.confidence === "high", g0.confidence);
  // Unweighted-Kontrast: einfaches Mittel (3+5)/2 = 4.0 wäre falsch für die Gewichtung.
  check("Gewichtung wirkt (≠ ungewichtetes 4.0)", g0.ist !== 4.0, `got ${g0.ist}`);

  // ── 2a) IDENTITÄT zu V2 — usesMaturity=true ────────────────────────────
  console.log("Identität · usesMaturity=true (weights aus, derivedCap 5)");
  // Zwei GLEICH GROSSE Familien (je 2 Kontrollen) ⇒ W_f konstant ⇒ Overall == Familien-Mittel.
  const mControls = [
    ctrl("A1", "Alpha"), ctrl("A2", "Alpha"),
    ctrl("B1", "Beta"),  ctrl("B2", "Beta"),
  ];
  const mEff = new Map([
    ["A1", ans({ reifegrad: 2 })],
    ["A2", ans({ reifegrad: 4 })],
    ["B1", ans({ reifegrad: 5 })],
    // B2 nicht erfasst (reifegrad null) — testet Teil-Coverage im V3, V2 ignoriert es ebenso.
  ]);
  const mInput = { framework: "TEST", usesMaturity: true, controls: mControls, effective: mEff, targets: { "": 4 } };
  const v2m = computeFrameworkMaturity(mInput);
  const v3m = computeFrameworkMaturityV3({ ...mInput, derivedCap: 5 });
  let okM = true;
  try { assert.deepStrictEqual(stripV3(v3m), v2m); } catch (e) { okM = false; console.error(e.message); }
  check("V3 (maturity) deep-equal V2", okM);

  // ── 2b) IDENTITÄT zu V2 — usesMaturity=false (derived, cap 5) ──────────
  console.log("Identität · usesMaturity=false (derived, derivedCap 5 ⇒ ja=5/teilweise=2.5)");
  const dControls = [
    ctrl("C1", "Gamma"), ctrl("C2", "Gamma"),
    ctrl("D1", "Delta"), ctrl("D2", "Delta"),
  ];
  const dEff = new Map([
    ["C1", ans({ status: "ja" })],
    ["C2", ans({ status: "teilweise" })],
    ["D1", ans({ status: "nein" })],
    ["D2", ans({ status: "na" })], // na wird ignoriert (beide Engines)
  ]);
  const dInput = { framework: "TEST", usesMaturity: false, controls: dControls, effective: dEff };
  const v2d = computeFrameworkMaturity(dInput);
  const v3d = computeFrameworkMaturityV3({ ...dInput, derivedCap: 5 });
  let okD = true;
  try { assert.deepStrictEqual(stripV3(v3d), v2d); } catch (e) { okD = false; console.error(e.message); }
  check("V3 (derived, cap 5) deep-equal V2", okD);

  // ── 3) Trend — perfekte Gerade ─────────────────────────────────────────
  console.log("E6-Trend · perfekte Gerade 1,2,3,4 (Wochentakt)");
  const trendPts = [
    { at: "2026-01-05", value: 1 },
    { at: "2026-01-12", value: 2 },
    { at: "2026-01-19", value: 3 },
    { at: "2026-01-26", value: 4 },
  ];
  const tr = maturityTrend(trendPts, 6);
  check("slope = 1 Level/Woche", Math.abs(tr.slope - 1) < 1e-9, `got ${tr.slope}`);
  check("stderr ≈ 0", Math.abs(tr.stderr) < 1e-9, `got ${tr.stderr}`);
  // letzter Punkt 2026-01-26, Wert 4; target 6 ⇒ 2 Wochen ⇒ +14 Tage = 2026-02-09.
  check("forecast = 2026-02-09 (exakt)", tr.forecastDate === "2026-02-09", `got ${tr.forecastDate}`);

  // Trend ohne belastbaren Anstieg ⇒ kein forecast.
  const flat = maturityTrend(
    [{ at: "2026-01-05", value: 3 }, { at: "2026-01-12", value: 3 }, { at: "2026-01-19", value: 3 }],
    5,
  );
  check("flacher Trend (slope 0) ⇒ forecast null", flat.forecastDate === null, `got ${flat.forecastDate}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failed) {
  console.error("\nFIXTURE FAILED");
  process.exit(1);
}
console.log("\nFIXTURE OK — Gewichtung, V2-Identität (maturity+derived) & Trend bestätigt");
process.exit(0);
