/**
 * kpiV4.fixture.mjs — E9 Verifikations-Fixture (kein Framework nötig).
 *
 * Prüft additiv die neuen kpiEngine-v4-Funktionen:
 *   1) resolveThresholds — Prioritätskette: override > benchmark(n≥8) > default;
 *      n=5-Benchmark wird ignoriert (⇒ default); source korrekt ausgewiesen.
 *   2) IDENTITÄT: resolveThresholds ohne override + ohne bench ⇒ EXAKT die
 *      heutigen static defaults (STATIC_KPI_THRESHOLDS).
 *   3) overallScoreContinuous: 2 KPIs mit score 0.94/0.81 (gleiche Gewichte)
 *      ⇒ ~87.5 (nicht mehr 50).
 *   4) trendFromSeries: perfekt steigende Reihe ⇒ 'up' & confident;
 *      flache Reihe ⇒ 'flat' & nicht confident.
 *
 * Ausführung:  node web/src/lib/__fixtures__/kpiV4.fixture.mjs
 * Kompiliert kpiEngine.ts mit dem repo-lokalen esbuild (type-only Importe
 * werden erased ⇒ keine Alias-Auflösung, keine Runtime-Deps).
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

const tmp = mkdtempSync(join(tmpdir(), "e9-kpiv4-"));

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

const approx = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

try {
  const url = bundle("kpiEngine.ts", "kpiEngine.mjs");
  const {
    resolveThresholds,
    overallScoreContinuous,
    trendFromSeries,
    STATIC_KPI_THRESHOLDS,
  } = await import(url);

  // ── 1) Resolver-Kette ──────────────────────────────────────────────
  console.log("E9.1 · Schwellen-Resolver (Prioritätskette)");

  const defImpl = STATIC_KPI_THRESHOLDS["control_implementation"]; // higher_better 95/80
  const defRisk = STATIC_KPI_THRESHOLDS["open_high_risks"];        // lower_better  2/5

  const benchImpl8 = { kpi_id: "control_implementation", n: 8, p25: 60, p50: 75, p75: 90 };
  const benchImpl5 = { kpi_id: "control_implementation", n: 5, p25: 60, p50: 75, p75: 90 };
  const benchRisk8 = { kpi_id: "open_high_risks", n: 12, p25: 1, p50: 3, p75: 6 };

  // (a) override schlägt benchmark schlägt default
  const rOverride = resolveThresholds(
    "control_implementation",
    { control_implementation: 90 },
    benchImpl8,
    defImpl,
  );
  check("override → source='override'", rOverride.source === "override", rOverride.source);
  check("override setzt healthy = 90", rOverride.healthy === 90, `got ${rOverride.healthy}`);
  check("override warning = 90·0.8 = 72 (higher_better)", approx(rOverride.warning, 72), `got ${rOverride.warning}`);

  // (b) benchmark n≥8 (higher_better: healthy=p75, warning=p50)
  const rBench = resolveThresholds("control_implementation", null, benchImpl8, defImpl);
  check("benchmark n≥8 → source='benchmark'", rBench.source === "benchmark", rBench.source);
  check("benchmark higher_better healthy = p75 (90)", rBench.healthy === 90, `got ${rBench.healthy}`);
  check("benchmark higher_better warning = p50 (75)", rBench.warning === 75, `got ${rBench.warning}`);

  // (b') benchmark lower_better: healthy=p25, warning=p50
  const rBenchLow = resolveThresholds("open_high_risks", null, benchRisk8, defRisk);
  check("benchmark lower_better healthy = p25 (1)", rBenchLow.healthy === 1, `got ${rBenchLow.healthy}`);
  check("benchmark lower_better warning = p50 (3)", rBenchLow.warning === 3, `got ${rBenchLow.warning}`);

  // (c) n=5-Benchmark wird ignoriert ⇒ fällt auf default
  const rBench5 = resolveThresholds("control_implementation", null, benchImpl5, defImpl);
  check("n=5-Benchmark ignoriert → source='default'", rBench5.source === "default", rBench5.source);
  check("n=5 fällt auf default healthy = 95", rBench5.healthy === 95, `got ${rBench5.healthy}`);

  // ── 2) IDENTITÄT: ohne override + ohne bench ⇒ exakt static defaults ──
  console.log("E9.1 · Identität (ohne Override/Benchmark = heutige Konstanten)");
  let identityOk = true;
  for (const id of Object.keys(STATIC_KPI_THRESHOLDS)) {
    const d = STATIC_KPI_THRESHOLDS[id];
    const r = resolveThresholds(id, null, null, d);
    try {
      assert.deepStrictEqual(r, { ...d, source: "default" });
    } catch {
      identityOk = false;
      console.error(`    diff bei ${id}: ${JSON.stringify(r)} != ${JSON.stringify({ ...d, source: "default" })}`);
    }
  }
  check("resolveThresholds(null,null) === {...defaults, source:'default'} für ALLE KPIs", identityOk);
  // Auch mit leerem Override-Objekt (kein Eintrag für die id) ⇒ default.
  const rEmptyOv = resolveThresholds("control_implementation", {}, null, defImpl);
  check("leeres Override-Objekt ⇒ source='default'", rEmptyOv.source === "default", rEmptyOv.source);

  // ── 3) overallScoreContinuous ──────────────────────────────────────
  console.log("E9.2 · overallScoreContinuous (kontinuierlich, nicht 100/50/0)");
  const th = { healthy: 100, warning: 80, critical: 0, direction: "higher_better" };
  // (94-0)/(100-0)=0.94 ; (81-0)/(100-0)=0.81 ; gleiche Gewichte ⇒ 87.5
  const overall = overallScoreContinuous([
    { value: 94, threshold: th },
    { value: 81, threshold: th },
  ]);
  check("2 KPIs (0.94 / 0.81) gleiche Gewichte ⇒ 87.5", approx(overall, 87.5, 1e-9), `got ${overall}`);
  check("87.5 ≠ 50 (94% und 81% nicht mehr gleich)", Math.abs(overall - 50) > 1, `got ${overall}`);

  // lower_better funktioniert mit derselben Formel (healthy<critical)
  const thLow = { healthy: 0, warning: 2, critical: 10, direction: "lower_better" };
  // value=0 ⇒ (0-10)/(0-10)=1 ⇒ 100
  const lowBest = overallScoreContinuous([{ value: 0, threshold: thLow }]);
  check("lower_better bester Wert ⇒ 100", approx(lowBest, 100), `got ${lowBest}`);
  const lowWorst = overallScoreContinuous([{ value: 10, threshold: thLow }]);
  check("lower_better critical-Wert ⇒ 0", approx(lowWorst, 0), `got ${lowWorst}`);
  // hasData:false wird ausgelassen
  const skip = overallScoreContinuous([{ value: 94, threshold: th }, { value: 0, threshold: th, hasData: false }]);
  check("hasData=false wird ausgelassen ⇒ 94", approx(skip, 94), `got ${skip}`);

  // ── 4) trendFromSeries ─────────────────────────────────────────────
  console.log("E9.2 · trendFromSeries (EWMA + Slope, kein Flapping)");
  const rising = trendFromSeries([
    { at: "2026-01-01", value: 10 },
    { at: "2026-01-08", value: 20 },
    { at: "2026-01-15", value: 30 },
    { at: "2026-01-22", value: 40 },
    { at: "2026-01-29", value: 50 },
  ]);
  check("perfekt steigend ⇒ direction 'up'", rising.direction === "up", rising.direction);
  check("perfekt steigend ⇒ slope > 0", rising.slope > 0, `slope ${rising.slope}`);
  check("perfekt steigend ⇒ confident=true", rising.confident === true, `stderr ${rising.stderr}`);

  const flat = trendFromSeries([
    { at: "2026-01-01", value: 42 },
    { at: "2026-01-08", value: 42 },
    { at: "2026-01-15", value: 42 },
    { at: "2026-01-22", value: 42 },
  ]);
  check("flache Reihe ⇒ direction 'flat'", flat.direction === "flat", flat.direction);
  check("flache Reihe ⇒ confident=false", flat.confident === false, `slope ${flat.slope}`);

  // fallendes Signal ⇒ 'down'
  const falling = trendFromSeries([
    { at: "2026-01-01", value: 90 },
    { at: "2026-01-08", value: 70 },
    { at: "2026-01-15", value: 50 },
    { at: "2026-01-22", value: 30 },
    { at: "2026-01-29", value: 10 },
  ]);
  check("perfekt fallend ⇒ direction 'down' & confident", falling.direction === "down" && falling.confident, `${falling.direction}/${falling.confident}`);

  // <2 Punkte ⇒ flat/nicht confident
  const single = trendFromSeries([{ at: "2026-01-01", value: 5 }]);
  check("1 Punkt ⇒ flat & nicht confident", single.direction === "flat" && !single.confident);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failed) {
  console.error("\nFIXTURE FAILED");
  process.exit(1);
}
console.log("\nFIXTURE OK — E9 Resolver-Kette, Identität, Overall 87.5 & Trend bestätigt");
process.exit(0);
