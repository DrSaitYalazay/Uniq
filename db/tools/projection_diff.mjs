#!/usr/bin/env node
// ============================================================
// projection_diff.mjs — Item 07 Vorbereitung.
// Vergleicht die effektive Antwort-Projektion je Kontrolle:
//   ALT  = ueber control_iso (Legacy-Hub: alle Kontrollen mit gleicher iso_id teilen Anker)
//   NEU  = ueber control_node_member (+ control_mapping, relation='equal')
// Ziel: vor dem Abschalten des control_iso-Fallbacks je Framework sicherstellen,
// dass sich fuer equal-only-Bestand NICHTS aendert (Abweichungen = dokumentierte
// "teilweise"-Deckelungen aus partiellen control_mapping-Zeilen).
//
// Nutzung:
//   node db/tools/projection_diff.mjs <dump.json> [framework]
// dump.json (aus DB exportiert), Form:
//   {
//     "control_iso":         [{ "framework":"BSI","control_id":"OPS.1.1","iso_id":"A.5.1" }, ...],
//     "control_node_member": [{ "node_id":"KN-00001","framework":"BSI","control_id":"OPS.1.1" }, ...],
//     "control_mapping":     [{ "source_framework":"BSI","source_control_id":"X",
//                              "target_node_id":"KN-1","relation":"equal" }, ...]  // optional
//   }
// Ausgabe: je Framework Anzahl Kontrollen, deren Anker-Menge (ALT vs NEU) abweicht,
// plus die ersten Beispiele. Exit 0 immer (Report-Tool).
// ============================================================
import { readFileSync } from "node:fs";

const [, , dumpPath, onlyFw] = process.argv;
if (!dumpPath) {
  console.error("Nutzung: node db/tools/projection_diff.mjs <dump.json> [framework]");
  process.exit(2);
}

const key = (fw, id) => `${fw}::${id}`;
const dump = JSON.parse(readFileSync(dumpPath, "utf8"));
const iso = dump.control_iso || [];
const members = dump.control_node_member || [];
const mappings = (dump.control_mapping || []).filter((m) => m.relation === "equal");

// ALT: Anker-Menge je Kontrolle = alle Kontrollen mit derselben iso_id.
const byIso = new Map();
for (const r of iso) {
  if (!r.iso_id) continue;
  (byIso.get(r.iso_id) || byIso.set(r.iso_id, []).get(r.iso_id)).push(key(r.framework, r.control_id));
}
const isoOfControl = new Map(iso.map((r) => [key(r.framework, r.control_id), r.iso_id]));
const oldAnchors = (k) => {
  const isoId = isoOfControl.get(k);
  return isoId ? new Set(byIso.get(isoId)) : new Set([k]);
};

// NEU: Anker-Menge = alle Ko-Mitglieder desselben Knotens (+ equal-Mappings).
const nodeOfControl = new Map();
const membersOfNode = new Map();
for (const m of members) {
  const k = key(m.framework, m.control_id);
  nodeOfControl.set(k, m.node_id);
  (membersOfNode.get(m.node_id) || membersOfNode.set(m.node_id, []).get(m.node_id)).push(k);
}
for (const m of mappings) {
  if (!m.target_node_id) continue;
  const k = key(m.source_framework, m.source_control_id);
  nodeOfControl.set(k, m.target_node_id);
  (membersOfNode.get(m.target_node_id) || membersOfNode.set(m.target_node_id, []).get(m.target_node_id)).push(k);
}
const newAnchors = (k) => {
  const n = nodeOfControl.get(k);
  return n ? new Set(membersOfNode.get(n)) : new Set([k]);
};

const eqSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));

const allControls = new Set([...isoOfControl.keys(), ...nodeOfControl.keys()]);
const perFw = new Map();
const examples = new Map();
for (const k of allControls) {
  const fw = k.split("::")[0];
  if (onlyFw && fw !== onlyFw) continue;
  const same = eqSet(oldAnchors(k), newAnchors(k));
  const rec = perFw.get(fw) || { total: 0, diff: 0 };
  rec.total++;
  if (!same) {
    rec.diff++;
    const ex = examples.get(fw) || [];
    if (ex.length < 5) {
      ex.push({ control: k, alt: [...oldAnchors(k)], neu: [...newAnchors(k)] });
      examples.set(fw, ex);
    }
  }
  perFw.set(fw, rec);
}

console.log("Framework        Kontrollen  Abweichungen(ALT!=NEU)");
for (const [fw, r] of [...perFw].sort()) {
  console.log(`${fw.padEnd(16)}${String(r.total).padStart(10)}${String(r.diff).padStart(12)}`);
}
console.log("\n-- Beispiele (erste 5 je FW) --");
for (const [fw, ex] of examples) {
  console.log(`\n[${fw}]`);
  for (const e of ex) console.log(`  ${e.control}\n     ALT: ${e.alt.join(", ")}\n     NEU: ${e.neu.join(", ")}`);
}
