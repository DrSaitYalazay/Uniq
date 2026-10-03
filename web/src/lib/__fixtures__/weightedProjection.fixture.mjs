#!/usr/bin/env node
// ============================================================
// weightedProjection.fixture.mjs — E4 (assessmentEngine, weighted projection)
// Abnahme.
//
// Buendelt die pure TS-Engine via esbuild (Transform, loader 'ts' — die Engine
// hat nur Typ-Importe, kein --bundle noetig) und asserted die Soll-Werte aus
// ENGINE_ARCHITECTURE_MARKETGRADE.md §E4:
//
//   1) IDENTITAET (B-KERN-Beweis): >=200 synthetische
//      (control, spokeAnswer, anchorAnswers, anchorsBySpoke)-Kombinationen.
//      projectAnswer(...,{mode:'lww'})  deep-equal  projectAnswer(...) OHNE opts.
//      MUSS 100% gleich sein — der 'lww'-Pfad ist byte-identisch zum Bestand.
//
//   2) WEIGHTED (E4.2): frischer schwacher Anker (subset, strength4, gestern,
//      conf 0.5·0.4·1·~1 ≈ 0.2) vs. alter starker (equal, curated, 90 Tage,
//      conf 1.0·1.0·1.0·0.84 ≈ 0.84) ⇒ der equal-Anker gewinnt.
//
//   3) KONFLIKT (E4.3): ja(conf≈0.9) vs nein(conf≈0.7) ⇒ conflict gesetzt,
//      weighted-Gewinner 'ja'.
//
// exit 0 wenn alle Assertions passen, sonst exit 1 mit Diff.
//
// Nutzung: node web/src/lib/__fixtures__/weightedProjection.fixture.mjs
// ============================================================
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const engineTs = join(__dirname, "..", "assessmentEngine.ts");

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
const dir = mkdtempSync(join(tmpdir(), "wp-fixture-"));
const outFile = join(dir, "assessmentEngine.mjs");
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
  if (a === e) { passed++; }
  else failures.push(`  ✗ ${label}\n      erwartet: ${e}\n      erhalten: ${a}`);
}
function ok(label, cond) {
  if (cond) { passed++; }
  else failures.push(`  ✗ ${label}  (Bedingung nicht erfuellt)`);
}
function approx(label, actual, expected, tol = 1e-3) {
  if (typeof actual === "number" && Math.abs(actual - expected) <= tol) { passed++; }
  else failures.push(`  ✗ ${label}\n      erwartet: ${expected} (±${tol})\n      erhalten: ${actual}`);
}

// ---------------------------------------------------------------------------
// Zeit-/Fabrik-Helfer
// ---------------------------------------------------------------------------
const NOW = Date.parse("2026-07-18T12:00:00Z");
const DAY = 86_400_000;
const isoDaysAgo = (d) => new Date(NOW - d * DAY).toISOString();

function mkControl(framework, id, over = {}) {
  return { id, framework, sub_sector: null, req_de: null, req_en: null, muss: null, tags: null, meta: null, ...over };
}
function mkAnswer(framework, control_id, antwort, daysAgo, over = {}) {
  return {
    framework, control_id, antwort,
    reifegrad: null, evidence: null, note: null,
    updated_at: isoDaysAgo(daysAgo), asset_id: null, ...over,
  };
}

// ===========================================================================
// 1) IDENTITAET — 'lww' deep-equal zum Bestandsverhalten (KEINE opts)
// ===========================================================================
{
  const frameworks = ["ISO27001", "BSI", "NIS2", "DORA"];
  const relations = ["equal", "subset-of", "superset-of", "intersects-with"];
  const spokeStates = [null, "ja", "teilweise", "nein", "na"];
  const anchorStates = [null, "ja", "teilweise", "nein", "na"];
  const tsVariants = [
    // [spokeDaysAgo, anchorDaysAgo] — mal Spoke neuer, mal Anker neuer
    [1, 10], [10, 1], [5, 5],
  ];

  let count = 0;
  let identical = 0;
  const localFails = [];

  for (const fw of frameworks) {
    for (const [si, spokeState] of spokeStates.entries()) {
      for (const rel of relations) {
        for (const [ai, anchorState] of anchorStates.entries()) {
          for (const [tvi, [sDays, aDays]] of tsVariants.entries()) {
            const cid = `${fw}-C${si}${ai}`;
            const control = mkControl(fw, cid);

            const spokeAnswer = spokeState
              ? mkAnswer(fw, cid, spokeState, sDays, { note: `n${si}`, evidence: `e${si}` })
              : undefined;

            // Cross-Framework-Anker (anderes Framework ⇒ kein Geschwister-Skip),
            // strength/source variiert, damit der Bestandspfad diese Felder ignoriert.
            const anchorId = `anch-${fw}-${ai}`;
            const anchorFw = fw === "ISO27001" ? "BSI" : "ISO27001";
            const isoAnswerByControl = new Map();
            if (anchorState) {
              isoAnswerByControl.set(anchorId, mkAnswer(anchorFw, anchorId, anchorState, aDays, {
                note: `an${ai}`, evidence: `ae${ai}`,
              }));
            }
            const isoAnchorsBySpokeControl = new Map();
            // Abwechselnd mit/ohne expliziten Anker-Eintrag. Ohne Eintrag ⇒ node-only:
            // leere Anker (kein ISO-Selbstanker mehr) ⇒ Kontrolle unabhaengig. Der
            // Identitaetstest vergleicht Engine-Pfade gegeneinander, bleibt gueltig.
            const useMapping = !(fw === "ISO27001" && tvi % 2 === 0 && ai === 0);
            if (useMapping) {
              isoAnchorsBySpokeControl.set(`${fw}::${cid}`, [
                { anchorId, relation: rel, strength: 4, source: "tfidf_opus" },
              ]);
            }

            // Zusaetzlicher Geschwister-Anker aus DEMSELBEN Framework, andere Control
            // ⇒ muss in beiden Pfaden identisch uebersprungen werden.
            if (tvi === 2 && anchorState) {
              const sibId = `sib-${fw}-${ai}`;
              isoAnswerByControl.set(sibId, mkAnswer(fw, `${cid}-OTHER`, anchorState, 0));
              const cur = isoAnchorsBySpokeControl.get(`${fw}::${cid}`) ?? [];
              cur.push({ anchorId: sibId, relation: "equal" });
              isoAnchorsBySpokeControl.set(`${fw}::${cid}`, cur);
            }

            const baseline = E.projectAnswer(control, spokeAnswer, isoAnswerByControl, isoAnchorsBySpokeControl);
            const lww = E.projectAnswer(control, spokeAnswer, isoAnswerByControl, isoAnchorsBySpokeControl, { mode: "lww" });
            const lwwNow = E.projectAnswer(control, spokeAnswer, isoAnswerByControl, isoAnchorsBySpokeControl, { mode: "lww", now: NOW });

            count++;
            const a = JSON.stringify(baseline);
            if (a === JSON.stringify(lww) && a === JSON.stringify(lwwNow)) identical++;
            else if (localFails.length < 5) {
              localFails.push(`  ✗ Identitaet ${fw}/${cid}/${rel}/s=${spokeState}/a=${anchorState}\n      base: ${a}\n      lww : ${JSON.stringify(lww)}`);
            }
          }
        }
      }
    }
  }

  ok(`[E4.1] Identitaet: >=200 Kombinationen erzeugt (${count})`, count >= 200);
  eq(`[E4.1] Identitaet: 100% deep-equal (${identical}/${count})`, identical, count);
  for (const f of localFails) failures.push(f);
}

// ===========================================================================
// 2) WEIGHTED — starker alter equal-Anker schlaegt frischen schwachen subset
// ===========================================================================
{
  const control = mkControl("BSI", "OPS.1.1");
  const isoAnswerByControl = new Map([
    // stark: equal, curated (default), strength 10 (default), 90 Tage alt, "ja"
    ["iso-A", mkAnswer("ISO27001", "iso-A", "ja", 90)],
    // schwach: subset, strength 4, gestern, "nein"
    ["iso-B", mkAnswer("NIS2", "iso-B", "nein", 1)],
  ]);
  const isoAnchorsBySpokeControl = new Map([
    ["BSI::OPS.1.1", [
      { anchorId: "iso-A", relation: "equal" },                       // strength/source fehlen ⇒ 10/curated
      { anchorId: "iso-B", relation: "subset-of", strength: 4 },
    ]],
  ]);

  const w = E.projectAnswer(control, undefined, isoAnswerByControl, isoAnchorsBySpokeControl, { mode: "weighted", now: NOW });

  eq("[E4.2] weighted: equal-Anker gewinnt ⇒ status 'ja'", w.status, "ja");
  eq("[E4.2] weighted: origin inherited", w.origin, "inherited");
  approx("[E4.2] weighted: confidence ≈ 0.843 (2^-90/365)", w.confidence, 0.8429, 2e-3);
  eq("[E4.2] weighted: projectionQuality full (equal)", w.projectionQuality, "full");
  eq("[E4.2] weighted: inheritedVia = equal/iso-A", w.inheritedVia, [{ anchorId: "iso-A", relation: "equal" }]);
  ok("[E4.2] weighted: kein Konflikt (nur 1 Kandidat conf≥0.6)", w.conflict == null);

  // Gegenprobe LWW: hier gewinnt der NEUERE (gestern) ⇒ subset 'nein', gedeckelt bleibt 'nein'
  const l = E.projectAnswer(control, undefined, isoAnswerByControl, isoAnchorsBySpokeControl);
  eq("[E4.2] LWW-Gegenprobe: neuerer subset-Anker ⇒ status 'nein'", l.status, "nein");
  ok("[E4.2] LWW: keine confidence gesetzt", l.confidence === undefined);
}

// ===========================================================================
// 3) KONFLIKT — ja(conf≈0.9) vs nein(conf≈0.7) ⇒ conflict + Gewinner 'ja'
// ===========================================================================
{
  const control = mkControl("BSI", "OPS.2.2");
  const isoAnswerByControl = new Map([
    // ja: superset-of (0.9) × strength10 × curated × decay~1 (frisch) = 0.9
    ["iso-J", mkAnswer("ISO27001", "iso-J", "ja", 0)],
    // nein: equal (1.0) × strength7 (0.7) × curated × decay~1 (frisch) = 0.7
    ["iso-N", mkAnswer("NIS2", "iso-N", "nein", 0)],
  ]);
  const isoAnchorsBySpokeControl = new Map([
    ["BSI::OPS.2.2", [
      { anchorId: "iso-J", relation: "superset-of" },            // strength/source default ⇒ 0.9
      { anchorId: "iso-N", relation: "equal", strength: 7 },     // 0.7
    ]],
  ]);

  const w = E.projectAnswer(control, undefined, isoAnswerByControl, isoAnchorsBySpokeControl, { mode: "weighted", now: NOW });

  eq("[E4.3] konflikt: weighted-Gewinner 'ja'", w.status, "ja");
  approx("[E4.3] konflikt: confidence ≈ 0.9", w.confidence, 0.9, 2e-3);
  ok("[E4.3] konflikt: conflict gesetzt", w.conflict != null);
  eq("[E4.3] konflikt: resolution 'weighted'", w.conflict?.resolution, "weighted");
  eq("[E4.3] konflikt: 2 Anker gelistet", w.conflict?.anchors?.length, 2);
  {
    const statuses = (w.conflict?.anchors ?? []).map((a) => a.status).sort();
    eq("[E4.3] konflikt: Anker-Status {ja, nein}", statuses, ["ja", "nein"]);
    const allStrong = (w.conflict?.anchors ?? []).every((a) => a.conf >= 0.6);
    ok("[E4.3] konflikt: beide Anker conf ≥ 0.6", allStrong);
  }

  // Kontrast: kein Konflikt, wenn der Gegen-Anker unter 0.6 faellt (strength 5 ⇒ 0.5)
  const noConf = new Map([
    ["BSI::OPS.2.2", [
      { anchorId: "iso-J", relation: "superset-of" },
      { anchorId: "iso-N", relation: "equal", strength: 5 },     // 0.5 < 0.6
    ]],
  ]);
  const w2 = E.projectAnswer(control, undefined, isoAnswerByControl, noConf, { mode: "weighted", now: NOW });
  ok("[E4.3] kein Konflikt, wenn Gegen-Anker conf<0.6", w2.conflict == null);
  eq("[E4.3] Gewinner bleibt 'ja'", w2.status, "ja");
}

// ---------------------------------------------------------------------------
// Abschluss
// ---------------------------------------------------------------------------
try { rmSync(dir, { recursive: true, force: true }); } catch {}

if (failures.length > 0) {
  console.error(`\n✗ weightedProjection.fixture: ${failures.length} Assertion(en) fehlgeschlagen (${passed} ok):\n`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}
console.log(`✓ weightedProjection.fixture: alle ${passed} Assertionen bestanden.`);
process.exit(0);
