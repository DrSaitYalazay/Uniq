#!/usr/bin/env node
// ============================================================
// nodeOnlyProjection.fixture.mjs — Abnahme des node-only Umbaus
// (control_iso-Anker + ISO-Selbstanker aus der Projektion entfernt).
//
// Buendelt die pure Engine (assessmentEngine.ts) via esbuild-Transform und
// prueft, dass projectAnswer / buildAnchorAnswerMap AUSSCHLIESSLICH ueber die
// (vom Aufrufer gelieferte) Knoten-Anker-Map vererben — kein ISO-Selbstanker,
// Singletons unabhaengig, Geschwister-Guard intakt, subset-Deckelung erhalten.
//
// exit 0 = alle Assertionen ok, sonst exit 1 mit Diff.
// Nutzung: node web/src/lib/__fixtures__/nodeOnlyProjection.fixture.mjs
// ============================================================
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const engineTs = join(__dirname, "..", "assessmentEngine.ts");
const esbuild = (await import(
  pathToFileURL(join(__dirname, "..", "..", "..", "node_modules", "esbuild", "lib", "main.js")).href
)).default;

const src = readFileSync(engineTs, "utf8");
const { code } = await esbuild.transform(src, { loader: "ts", format: "esm", target: "es2020" });
const dir = mkdtempSync(join(tmpdir(), "no-fixture-"));
const outFile = join(dir, "assessmentEngine.mjs");
writeFileSync(outFile, code, "utf8");
const E = await import(pathToFileURL(outFile).href);

const failures = [];
let passed = 0;
function eq(label, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) passed++; else failures.push(`  ✗ ${label}\n      erwartet: ${e}\n      erhalten: ${a}`);
}
function ok(label, cond) { if (cond) passed++; else failures.push(`  ✗ ${label}  (Bedingung nicht erfuellt)`); }

const NOW = Date.parse("2026-07-18T12:00:00Z");
const DAY = 86_400_000;
const isoDaysAgo = (d) => new Date(NOW - d * DAY).toISOString();
const mkControl = (framework, id, over = {}) => ({ id, framework, sub_sector: null, req_de: null, req_en: null, muss: null, tags: null, meta: null, ...over });
const mkAnswer = (framework, control_id, antwort, daysAgo, over = {}) => ({
  framework, control_id, antwort, reifegrad: null, evidence: null, note: null,
  updated_at: isoDaysAgo(daysAgo), asset_id: null, ...over,
});

// ===========================================================================
// 1) Singleton erbt NICHT: Kontrolle ohne Knoten-Eintrag → keine Vererbung
// ===========================================================================
{
  const control = mkControl("DORA", "D-1");
  const anchorAns = new Map([["KN-0001", mkAnswer("BSI", "OPS.1.1", "ja", 1)]]); // fremde Antwort am Knoten
  const anchorsBySpoke = new Map(); // D-1 in KEINEM Knoten
  const empty = E.projectAnswer(control, undefined, anchorAns, anchorsBySpoke);
  eq("[1] Singleton ohne eigene Antwort ⇒ origin 'empty'", empty.origin, "empty");
  eq("[1] Singleton ohne eigene Antwort ⇒ status null", empty.status, null);
  const own = E.projectAnswer(control, mkAnswer("DORA", "D-1", "teilweise", 0), anchorAns, anchorsBySpoke);
  eq("[1] Singleton mit eigener Antwort ⇒ origin 'explicit'", own.origin, "explicit");
  eq("[1] Singleton mit eigener Antwort ⇒ status 'teilweise'", own.status, "teilweise");
}

// ===========================================================================
// 2) Knoten-Geschwister erben cross-framework (BSI ← DORA via KN-0001)
// ===========================================================================
{
  const bsi = mkControl("BSI", "OPS.1.1");
  const anchorAns = new Map([["KN-0001", mkAnswer("DORA", "D-2", "ja", 1)]]); // DORA-Antwort am gemeinsamen Knoten
  const anchorsBySpoke = new Map([["BSI::OPS.1.1", [{ anchorId: "KN-0001", relation: "equal" }]]]);
  const p = E.projectAnswer(bsi, undefined, anchorAns, anchorsBySpoke);
  eq("[2] Knoten-Geschwister ⇒ status 'ja'", p.status, "ja");
  eq("[2] Knoten-Geschwister ⇒ origin 'inherited'", p.origin, "inherited");
  eq("[2] Knoten-Geschwister ⇒ inheritedFrom ['KN-0001']", p.inheritedFrom, ["KN-0001"]);
}

// ===========================================================================
// 3) KEIN ISO-Selbstanker mehr: ISO-Kontrolle ohne Knoten erbt nicht vom Alt-Anker
// ===========================================================================
{
  const iso = mkControl("ISO27001", "a5-15");
  // Alt-Pfad haette unter control.id="a5-15" geerbt; node-only ⇒ ignoriert.
  const anchorAns = new Map([["a5-15", mkAnswer("BSI", "OPS.9.9", "ja", 1)]]);
  const anchorsBySpoke = new Map(); // ISO-Kontrolle in KEINEM Knoten
  const empty = E.projectAnswer(iso, undefined, anchorAns, anchorsBySpoke);
  eq("[3] ISO ohne Knoten & ohne eigene Antwort ⇒ origin 'empty' (kein Selbstanker)", empty.origin, "empty");
  eq("[3] ISO ohne Knoten ⇒ status null", empty.status, null);
  const own = E.projectAnswer(iso, mkAnswer("ISO27001", "a5-15", "nein", 0), anchorAns, anchorsBySpoke);
  eq("[3] ISO mit eigener Antwort ⇒ origin 'explicit', eigener Status", own.origin, "explicit");
  eq("[3] ISO eigener Status 'nein'", own.status, "nein");
}

// ===========================================================================
// 4) Intra-Framework-Geschwister-Guard: gleiche fw, andere control_id → skip
// ===========================================================================
{
  const bsiB = mkControl("BSI", "OPS.1.2");
  // Antwort am Knoten stammt aus DEMSELBEN Framework (BSI), andere Kontrolle → muss ge-skippt werden.
  const anchorAns = new Map([["KN-0002", mkAnswer("BSI", "OPS.1.1", "ja", 1)]]);
  const anchorsBySpoke = new Map([["BSI::OPS.1.2", [{ anchorId: "KN-0002", relation: "equal" }]]]);
  const p = E.projectAnswer(bsiB, undefined, anchorAns, anchorsBySpoke);
  eq("[4] Geschwister-Guard (gleiche fw) ⇒ origin 'empty'", p.origin, "empty");
  eq("[4] Geschwister-Guard ⇒ status null", p.status, null);
}

// ===========================================================================
// 5) buildAnchorAnswerMap: leeres anchorsFor ⇒ leere Map; mit Knoten ⇒
//    Weakest-Link je Framework (Kandidatenliste, Fix F-01/CHG-07)
// ===========================================================================
{
  const answers = {
    "a": mkAnswer("BSI", "OPS.1.1", "teilweise", 5),
    "b": mkAnswer("DORA", "D-2", "ja", 1),   // neuer
    "c": mkAnswer("NIS2", "N-3", "nein", 9),
  };
  const emptyMap = E.buildAnchorAnswerMap(answers, () => []);
  eq("[5] buildAnchorAnswerMap mit anchorsFor=[] ⇒ leer", emptyMap.size, 0);

  // Alle drei am selben Knoten KN-0001 ⇒ je Framework der strengste Eintrag,
  // Rückgabe ist eine Kandidatenliste (ein Eintrag je Framework).
  const nodeMap = E.buildAnchorAnswerMap(answers, () => ["KN-0001"]);
  ok("[5] Knoten KN-0001 vorhanden", nodeMap.has("KN-0001"));
  const cands = nodeMap.get("KN-0001") ?? [];
  ok("[5] Kandidatenliste (Array)", Array.isArray(cands));
  eq("[5] drei Framework-Kandidaten", cands.length, 3);
  // Weakest-Link über alle Kandidaten ⇒ strengster Status 'nein' vorhanden.
  const RANK = { nein: 0, teilweise: 1, ja: 2 };
  const strictest = cands.reduce((m, r) => (RANK[r.antwort] < RANK[m.antwort] ? r : m), cands[0]);
  eq("[5] Weakest-Link: strengster Gewinner ⇒ 'nein'", strictest.antwort, "nein");
}

// ===========================================================================
// 5b) Fix F-01: Intra-Framework-Geschwister verdeckt Cross-FW-Antwort NICHT
// ===========================================================================
{
  // Knoten KN-0F01: BSI-A2 = nein (Geschwister), ISO = teilweise. Projiziert für
  // BSI-A1 (leer) ⇒ Geschwister-Guard überspringt BSI-A2, ISO-'teilweise' bleibt.
  const control = mkControl("BSI", "A1");
  const answers = {
    "x": mkAnswer("BSI", "A2", "nein", 3),
    "y": mkAnswer("ISO27001", "a5-1", "teilweise", 2),
  };
  const anchorAns = E.buildAnchorAnswerMap(answers, () => ["KN-0F01"]);
  const anchorsBySpoke = new Map([["BSI::A1", [{ anchorId: "KN-0F01", relation: "equal" }]]]);
  const p = E.projectAnswer(control, undefined, anchorAns, anchorsBySpoke);
  eq("[5b] F-01: Cross-FW 'teilweise' überlebt Geschwister-'nein'", p.status, "teilweise");
}

// ===========================================================================
// 6) subset-of-Deckelung bleibt: geerbtes 'ja' über subset ⇒ 'teilweise'
// ===========================================================================
{
  const control = mkControl("NIS2", "N-9");
  const anchorAns = new Map([["KN-0009", mkAnswer("ISO27001", "a8-1", "ja", 1)]]);
  const anchorsBySpoke = new Map([["NIS2::N-9", [{ anchorId: "KN-0009", relation: "subset-of" }]]]);
  const p = E.projectAnswer(control, undefined, anchorAns, anchorsBySpoke);
  eq("[6] subset-of: geerbtes 'ja' ⇒ gedeckelt 'teilweise'", p.status, "teilweise");
  eq("[6] subset-of: projectionQuality 'partial'", p.projectionQuality, "partial");
}

try { rmSync(dir, { recursive: true, force: true }); } catch {}

if (failures.length > 0) {
  console.error(`\n✗ nodeOnlyProjection.fixture: ${failures.length} Assertion(en) fehlgeschlagen (${passed} ok):\n`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}
console.log(`✓ nodeOnlyProjection.fixture: alle ${passed} Assertionen bestanden.`);
process.exit(0);
