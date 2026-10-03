#!/usr/bin/env node
// ============================================================
// controlHealth.fixture.mjs — E3 (controlHealthEngine) Abnahme.
//
// Buendelt die pure TS-Engine via esbuild (Transform, loader 'ts' — die Engine
// hat nur Typ-Importe, daher kein --bundle noetig) und asserted die Soll-Werte
// aus ENGINE_ARCHITECTURE_MARKETGRADE.md §E3:
//   - Health-Beispiel 87.5 / confidence high  (E3.3)
//   - reine Selbstauskunft ja => 100 / confidence low
//   - Lattice-Wahrheitstabelle (repraesentative Faelle der 80, E3.2)
//   - Statemachine pass->fail => genau 1 DRIFT-Event (E3.4)
//
// exit 0 wenn alle Assertions passen, sonst exit 1 mit Diff.
//
// Nutzung: node web/src/lib/__fixtures__/controlHealth.fixture.mjs
// ============================================================
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const engineTs = join(__dirname, "..", "controlHealthEngine.ts");

// esbuild aus ./web/node_modules
const esbuild = (await import(
  pathToFileURL(join(__dirname, "..", "..", "..", "node_modules", "esbuild", "lib", "main.js")).href
)).default;

// --- Engine transformieren (loader ts, format esm) + dynamisch laden --------
const src = readFileSync(engineTs, "utf8");
const { code } = await esbuild.transform(src, {
  loader: "ts",
  format: "esm",
  target: "es2020",
});
const dir = mkdtempSync(join(tmpdir(), "ch-fixture-"));
const outFile = join(dir, "controlHealthEngine.mjs");
writeFileSync(outFile, code, "utf8");
const E = await import(pathToFileURL(outFile).href);

// ---------------------------------------------------------------------------
// Mini-Assert-Harness (sammelt Fehler, exit 1 mit Diff)
// ---------------------------------------------------------------------------
const failures = [];
let passed = 0;
function eq(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
  } else {
    failures.push(`  ✗ ${label}\n      erwartet: ${e}\n      erhalten: ${a}`);
  }
}
function approx(label, actual, expected, tol = 1e-9) {
  if (typeof actual === "number" && Math.abs(actual - expected) <= tol) {
    passed++;
  } else {
    failures.push(`  ✗ ${label}\n      erwartet: ${expected} (±${tol})\n      erhalten: ${actual}`);
  }
}

// ---------------------------------------------------------------------------
// Fixture-Fabriken
// ---------------------------------------------------------------------------
const NOW = new Date("2026-07-18T12:00:00Z");
const isoDaysFromNow = (d) => {
  const t = new Date(NOW);
  t.setUTCDate(t.getUTCDate() + d);
  return t.toISOString();
};
const dateDaysFromNow = (d) => isoDaysFromNow(d).slice(0, 10);

let seq = 0;
function mkTest(overrides = {}) {
  seq++;
  return {
    id: `test-${seq}`,
    tenant_id: "T",
    framework: "ISO27001",
    control_id: "A.5.1",
    node_id: null,
    kind: "evidence_present",
    label: `Test ${seq}`,
    schedule: "daily",
    config: {},
    enabled: true,
    interval_hours: 24,
    created_at: isoDaysFromNow(-10),
    ...overrides,
  };
}
function mkResult(status, overrides = {}) {
  seq++;
  return {
    id: `res-${seq}`,
    tenant_id: "T",
    test_id: "test",
    ran_at: isoDaysFromNow(-1), // frisch (innerhalb 2×interval)
    status,
    evidence_id: null,
    detail: {},
    ...overrides,
  };
}
// Test-Paar {test, latest} mit gewuenschtem status
const testPass = () => ({ test: mkTest(), latest: mkResult("pass") });
const testFail = () => ({ test: mkTest(), latest: mkResult("fail") });
const testError = () => ({ test: mkTest(), latest: mkResult("error") });

let evSeq = 0;
function mkEvidence(kind, validUntilDate, overrides = {}) {
  evSeq++;
  return {
    row: {
      id: `ev-${evSeq}`,
      tenant_id: "T",
      title: `Evidence ${evSeq}`,
      kind,
      storage_path: null,
      external_url: null,
      description: null,
      collected_at: isoDaysFromNow(-5),
      valid_until: validUntilDate,
      collected_by: null,
      created_at: isoDaysFromNow(-5),
    },
    inherited: false,
  };
}
const evFresh = () => mkEvidence("document", dateDaysFromNow(300)); // weit gueltig
const evStale = () => mkEvidence("document", dateDaysFromNow(-1)); // abgelaufen
const evExpiring = () => mkEvidence("document", dateDaysFromNow(10)); // <30d

const ans = (status) => ({ status, reifegrad: null, origin: "explicit", note: null, evidence: null });
const opts = { now: NOW };

// ===========================================================================
// 1) Health-Beispiel (E3.3): ja + 2/2 Tests pass + 1/2 Evidence frisch
//    => health 87.5, confidence high
// ===========================================================================
{
  const h = E.deriveControlHealth(
    ans("ja"),
    [testPass(), testPass()],
    [evFresh(), evStale()], // 1 frisch, 1 abgelaufen => freshRate 0.5
    opts,
  );
  approx("[E3.3] health = 87.5", h.health, 87.5, 1e-9);
  eq("[E3.3] confidence = high", h.confidence, "high");
  eq("[E3.3] testState = pass", h.testState, "pass");
}

// ===========================================================================
// 2) Reine Selbstauskunft ja => health 100, confidence low
// ===========================================================================
{
  const h = E.deriveControlHealth(ans("ja"), [], [], opts);
  approx("[E3.3] Selbstauskunft ja => health 100", h.health, 100, 1e-9);
  eq("[E3.3] Selbstauskunft ja => confidence low", h.confidence, "low");
  eq("[E3.3] Selbstauskunft ja => derived ja", h.derived, "ja");
  eq("[E3.3] Selbstauskunft ja => badge attested", h.badge, "attested");
}

// ===========================================================================
// 3) Lattice-Wahrheitstabelle (E3.2) — 12 repraesentative der 80 Faelle.
//    Assert je: derived + badge (soweit spezifiziert).
// ===========================================================================
function derive(answer, tests, evidence) {
  return E.deriveControlHealth(answer, tests, evidence, opts);
}

// L1  ja + fail                 => nein / failing
{
  const h = derive(ans("ja"), [testFail()], []);
  eq("[L1] ja+fail => derived nein", h.derived, "nein");
  eq("[L1] ja+fail => badge failing", h.badge, "failing");
}
// L2  ja + error                => teilweise / unknown
{
  const h = derive(ans("ja"), [testError()], []);
  eq("[L2] ja+error => derived teilweise", h.derived, "teilweise");
  eq("[L2] ja+error => badge unknown", h.badge, "unknown");
}
// L3  ja + pass + stale-Evidence (pflichtig, da Test vorhanden) => teilweise / unverified
{
  const h = derive(ans("ja"), [testPass()], [evStale()]);
  eq("[L3] ja+pass+stale => derived teilweise", h.derived, "teilweise");
  eq("[L3] ja+pass+stale => badge unverified", h.badge, "unverified");
}
// L4  ja + pass + fresh-Evidence => ja / verified
{
  const h = derive(ans("ja"), [testPass()], [evFresh()]);
  eq("[L4] ja+pass+fresh => derived ja", h.derived, "ja");
  eq("[L4] ja+pass+fresh => badge verified", h.badge, "verified");
}
// L5  ja + keine Tests + keine Evidence (nicht pflichtig) => ja / attested
{
  const h = derive(ans("ja"), [], []);
  eq("[L5] ja+none+none => derived ja", h.derived, "ja");
  eq("[L5] ja+none+none => badge attested", h.badge, "attested");
}
// L6  nein bleibt nein
{
  const h = derive(ans("nein"), [testPass()], [evFresh()]);
  eq("[L6] nein bleibt nein (trotz pass+fresh)", h.derived, "nein");
}
// L7  teilweise bleibt teilweise
{
  const h = derive(ans("teilweise"), [testPass()], [evFresh()]);
  eq("[L7] teilweise bleibt teilweise", h.derived, "teilweise");
}
// L8  na bleibt na
{
  const h = derive(ans("na"), [testPass()], [evFresh()]);
  eq("[L8] na bleibt na", h.derived, "na");
}
// L9  ja + keine Tests + frische Evidence (nicht pflichtig) => ja / attested
{
  const h = derive(ans("ja"), [], [evFresh()]);
  eq("[L9] ja+none+fresh(nicht pflichtig) => derived ja", h.derived, "ja");
  eq("[L9] ja+none+fresh => badge attested", h.badge, "attested");
}
// L10 ja + pass + KEINE Evidence (pflichtig, da Test) => teilweise / unverified
{
  const h = derive(ans("ja"), [testPass()], []);
  eq("[L10] ja+pass+none(pflichtig) => derived teilweise", h.derived, "teilweise");
  eq("[L10] ja+pass+none => badge unverified", h.badge, "unverified");
}
// L11 ja + error + fresh => error uebersteuert => teilweise / unknown
{
  const h = derive(ans("ja"), [testError()], [evFresh()]);
  eq("[L11] ja+error+fresh => derived teilweise", h.derived, "teilweise");
  eq("[L11] ja+error+fresh => badge unknown", h.badge, "unknown");
}
// L12 ja + fail + fresh => fail uebersteuert => nein / failing
{
  const h = derive(ans("ja"), [testFail()], [evFresh()]);
  eq("[L12] ja+fail+fresh => derived nein", h.derived, "nein");
  eq("[L12] ja+fail+fresh => badge failing", h.badge, "failing");
}

// Bonus: "verstummter" Test (juengstes Resultat > 2×interval alt) => error
{
  const silent = { test: mkTest({ interval_hours: 24 }), latest: mkResult("pass", { ran_at: isoDaysFromNow(-5) }) };
  const h = derive(ans("ja"), [silent], []);
  eq("[L13] ja+verstummt(pass alt) => testState error", h.testState, "error");
  eq("[L13] ja+verstummt => derived teilweise", h.derived, "teilweise");
}

// ===========================================================================
// 4) Drift-Statemachine (E3.4): pass -> fail erzeugt GENAU 1 DRIFT-Event.
// ===========================================================================
{
  const prev = derive(ans("ja"), [testPass()], [evFresh()]); // testState pass, evidence fresh
  const next = derive(ans("ja"), [testFail()], [evFresh()]); // testState fail, evidence fresh (unveraendert)
  const events = E.computeTransitions(prev, next);
  eq("[E3.4] pass->fail => genau 1 Transition", events.length, 1);
  eq("[E3.4] pass->fail => event DRIFT", events[0]?.event, "DRIFT");
  eq("[E3.4] pass->fail => cause test_fail", events[0]?.cause, "test_fail");
}
// Gegenprobe: fail -> pass => RECOVERED; fresh -> stale => EVIDENCE_DECAY
{
  const prev = derive(ans("ja"), [testFail()], [evFresh()]);
  const next = derive(ans("ja"), [testPass()], [evStale()]);
  const events = E.computeTransitions(prev, next);
  const kinds = events.map((e) => e.event).sort();
  eq("[E3.4] fail->pass & fresh->stale => 2 Events", events.length, 2);
  eq("[E3.4] => {EVIDENCE_DECAY, RECOVERED}", kinds, ["EVIDENCE_DECAY", "RECOVERED"]);
}
// prev = null => keine Transitions (Erstbetrachtung)
{
  const next = derive(ans("ja"), [testPass()], [evFresh()]);
  eq("[E3.4] prev=null => 0 Transitions", E.computeTransitions(null, next).length, 0);
}

// ===========================================================================
// 5) no_data: keine Antwort, keine Tests, keine Evidence => health null
// ===========================================================================
{
  const h = E.deriveControlHealth(undefined, [], [], opts);
  eq("[no_data] health null", h.health, null);
  eq("[no_data] derived null", h.derived, null);
}
// na ohne Tests/Evidence => answerScore nicht gewertet => health null
{
  const h = derive(ans("na"), [], []);
  eq("[no_data] na ohne Tests/Evidence => health null", h.health, null);
}

// ===========================================================================
// 6) frameworkReadiness — kleiner Sanity-Check
// ===========================================================================
{
  const hs = [
    derive(ans("ja"), [], []), // health 100
    derive(ans("nein"), [], []), // health 0
    E.deriveControlHealth(undefined, [], [], opts), // health null -> nicht gewertet
  ];
  const r = E.frameworkReadiness(hs);
  approx("[E8.1] readiness score = 50", r.score, 50, 1e-9);
  approx("[E8.1] readiness coverage = 2/3", r.coverage, 2 / 3, 1e-9);
}

// ---------------------------------------------------------------------------
// Abschluss
// ---------------------------------------------------------------------------
try { rmSync(dir, { recursive: true, force: true }); } catch {}

if (failures.length > 0) {
  console.error(`\n✗ controlHealth.fixture: ${failures.length} Assertion(en) fehlgeschlagen (${passed} ok):\n`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}
console.log(`✓ controlHealth.fixture: alle ${passed} Assertionen bestanden.`);
process.exit(0);
