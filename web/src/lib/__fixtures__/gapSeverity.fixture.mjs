/**
 * gapSeverity.fixture.mjs — E5 Verifikations-Fixture (kein Framework nötig).
 *
 * Prüft die kontext-/risikobasierte Gap-Severity (gapEngine.ts, computeGapSeverity)
 * gegen die harten Sollwerte aus ENGINE_ARCHITECTURE_MARKETGRADE.md, Abschnitt E5:
 *
 *   1) IDENTITÄT (B-KERN): ohne ctx liefert computeGapSeverity für alle 4
 *      Gap-Kombinationen (muss×{nein,teilweise}, kann×{nein,teilweise}) EXAKT
 *      dasselbe Level wie die heutige severityFor(muss, answer) — beide Funktionen
 *      werden direkt verglichen.
 *   2) KEIN GAP: ja/na ⇒ score 0, level low, 0 Faktoren.
 *   3) KONTEXT-Beispiel: muss+teilweise (B=5) × W 1.16 × A 1.4 × X 1.2 × T 1.3
 *      × K 1.0 = 12.6672 ⇒ critical, genau 4 Faktoren im Ausweis.
 *
 * Ausführung:  node web/src/lib/__fixtures__/gapSeverity.fixture.mjs   (exit 0/1)
 * Bundelt gapEngine.ts mit dem repo-lokalen esbuild (JS-API, Alias @ → ./src);
 * type-only Importe werden erased, die @/-Value-Deps werden mitgebündelt.
 */

import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve, join } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, "..", "..", ".."); // web/
const srcRoot = resolve(webRoot, "src");
const require = createRequire(pathToFileURL(join(webRoot, "package.json")).href);
const esbuild = require("esbuild");

const tmp = mkdtempSync(join(tmpdir(), "e5-gapsev-"));

let failed = false;
function check(name, cond, detail) {
  if (cond) {
    console.log(`  ok   ${name}`);
  } else {
    failed = true;
    console.error(`  FAIL ${name}${detail ? " — " + detail : ""}`);
  }
}

// 2 Nachkommastellen wie in der Spezifikation dokumentiert (12.66).
const trunc2 = (x) => Math.trunc(x * 100) / 100;

try {
  const out = join(tmp, "gapEngine.mjs");
  await esbuild.build({
    entryPoints: [join(srcRoot, "lib", "gapEngine.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: out,
    alias: { "@": srcRoot },
    logLevel: "silent",
  });
  const { computeGapSeverity, severityFor } = await import(pathToFileURL(out).href);

  // ── (1) IDENTITÄT — alle 4 Gap-Kombinationen ohne ctx ──
  console.log("E5 · Identität computeGapSeverity(ohne ctx) == severityFor");
  const combos = [
    { muss: true, answer: "nein" },       // 8 ⇒ critical
    { muss: true, answer: "teilweise" },  // 5 ⇒ high
    { muss: false, answer: "nein" },      // 5 ⇒ high
    { muss: false, answer: "teilweise" }, // 3 ⇒ medium
  ];
  for (const { muss, answer } of combos) {
    const legacy = severityFor(muss, answer);
    const { level, score, factors } = computeGapSeverity(muss, answer);
    check(
      `${muss ? "muss" : "kann"}+${answer}: level == severityFor (${legacy})`,
      level === legacy,
      `computeGapSeverity=${level} (score=${score}) vs severityFor=${legacy}`,
    );
    check(
      `${muss ? "muss" : "kann"}+${answer}: ohne ctx keine Faktoren`,
      factors.length === 0,
      `factors=${factors.length}`,
    );
  }
  // Explizite Basiswerte gegenchecken
  check("Basiswert muss+nein == 8", computeGapSeverity(true, "nein").score === 8);
  check("Basiswert muss+teilweise == 5", computeGapSeverity(true, "teilweise").score === 5);
  check("Basiswert kann+nein == 5", computeGapSeverity(false, "nein").score === 5);
  check("Basiswert kann+teilweise == 3", computeGapSeverity(false, "teilweise").score === 3);

  // ── (2) KEIN GAP (ja/na) ──
  console.log("E5 · ja/na ⇒ kein Gap");
  for (const answer of ["ja", "na"]) {
    const r = computeGapSeverity(true, answer);
    check(`${answer}: score 0 / low / 0 Faktoren`, r.score === 0 && r.level === "low" && r.factors.length === 0,
      JSON.stringify(r));
  }

  // ── (3) KONTEXT-Beispiel: 5 × 1.16 × 1.4 × 1.2 × 1.3 × 1.0 = 12.6672 ──
  console.log("E5 · Kontext-Beispiel (muss+teilweise × W1.16 × A1.4 × X1.2 × T1.3)");
  const ctx = {
    controlEff: 0.7,               // W = 0.6 + 0.8·0.7 = 1.16
    assetCritLevel: "Critical",    // A = 1.4
    spof: true,                    // X = 1.0 + 0.2 = 1.2
    capabilityTag: "identity_access_mgmt", // T = 1.3
    // compensationRatio absichtlich weg ⇒ K = 1.0 (kein 5. Faktor)
  };
  const res = computeGapSeverity(true, "teilweise", ctx);
  check("Score ≈ 12.6672", Math.abs(res.score - 12.6672) < 1e-9, `got ${res.score}`);
  check("Score (2 Nachkommastellen) == 12.66", trunc2(res.score) === 12.66, `got ${trunc2(res.score)}`);
  check("Level == critical", res.level === "critical", `got ${res.level}`);
  check("genau 4 Faktoren im Ausweis", res.factors.length === 4,
    res.factors.map((f) => `${f.label}×${f.factor}`).join(", "));
  const byLabel = Object.fromEntries(res.factors.map((f) => [f.label, f.factor]));
  check("Faktor W == 1.16", Math.abs(byLabel["Kontroll-Wirksamkeit"] - 1.16) < 1e-9, `${byLabel["Kontroll-Wirksamkeit"]}`);
  check("Faktor A == 1.4", byLabel["Asset-Kritikalität"] === 1.4, `${byLabel["Asset-Kritikalität"]}`);
  check("Faktor X == 1.2", Math.abs(byLabel["Exposition"] - 1.2) < 1e-9, `${byLabel["Exposition"]}`);
  check("Faktor T == 1.3", byLabel["Bedrohungslage"] === 1.3, `${byLabel["Bedrohungslage"]}`);
  check("K nicht ausgewiesen (== 1.0)", byLabel["Kompensation"] === undefined);
  console.log(`     → ${res.factors.map((f) => `${f.label} ×${f.factor}`).join("  ·  ")}`);

  // Gegenprobe: K < 1.0 senkt Score, erscheint als 5. Faktor
  const withComp = computeGapSeverity(true, "teilweise", { ...ctx, compensationRatio: 1.0 });
  check("Kompensation greift (5 Faktoren, K=0.7)", withComp.factors.length === 5
    && Math.abs(withComp.score - 12.6672 * 0.7) < 1e-9, `factors=${withComp.factors.length} score=${withComp.score}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failed) {
  console.error("\nGAP-SEVERITY FIXTURE FAILED");
  process.exit(1);
}
console.log("\nGAP-SEVERITY FIXTURE OK — Identität (2×2) + kein-Gap + Kontext-Beispiel (12.66/critical, 4 Faktoren) bestätigt");
process.exit(0);
