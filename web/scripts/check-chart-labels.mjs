#!/usr/bin/env node
/**
 * Deploy-Gate: Beschriftungen in Ring-/Tortendiagrammen.
 *
 * REGEL (Befund Dr. Sait, 13.09.2026 — „Laufend: 84" lag quer auf der Legende):
 *
 *   R1  Ein <Pie> mit `label=` MUSS `insideSliceLabel()` aus @/lib/chartLabels
 *       benutzen. Freihand-Labels landen bei Recharts AUSSERHALB des Rings und
 *       kollidieren mit Nachbarbeschriftungen und mit allem darunter.
 *   R2  Ein <PieChart> darf KEINE Recharts-<Legend> enthalten. Die Legende
 *       gehoert als HTML neben/unter das Diagramm (Hausmuster: Farbfeld + Name
 *       + Wert). Recharts-Legenden teilen sich die Zeichenflaeche mit den
 *       Labels und ueberlappen in flachen Containern.
 *   R3  Ein <Pie> mit `label=` MUSS `labelLine={false}` setzen — Fuehrungs-
 *       linien zeigen nach aussen und ziehen den Text mit sich.
 *
 * Laeuft im Deploy neben check-undefined-imports.mjs.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = join(fileURLToPath(new URL(".", import.meta.url)), "..", "src");

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(e.name)) out.push(p);
  }
  return out;
}

/** Findet das Ende eines JSX-Opening-Tags und respektiert {…}-Ausdruecke. */
function tagEnd(src, from) {
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (ch === ">" && depth === 0) return i;
  }
  return -1;
}

const verstoesse = [];
let gepruefte = 0;

for (const file of walk(SRC)) {
  const src = readFileSync(file, "utf8");
  if (!src.includes("<Pie")) continue;
  const rel = relative(join(SRC, ".."), file);

  // ── R2: Legend innerhalb eines PieChart ──
  let pc = -1;
  while ((pc = src.indexOf("<PieChart", pc + 1)) !== -1) {
    const ende = src.indexOf("</PieChart>", pc);
    if (ende === -1) continue;
    const blok = src.slice(pc, ende);
    if (/<Legend\b/.test(blok)) {
      verstoesse.push({
        datei: rel,
        zeile: src.slice(0, pc).split("\n").length,
        regel: "R2",
        text: "<Legend> in einem <PieChart> — Legende als HTML danebenstellen",
      });
    }
  }

  // ── R1 + R3: Pie-Labels ──
  let pi = -1;
  while ((pi = src.indexOf("<Pie", pi + 1)) !== -1) {
    if (/[A-Za-z]/.test(src[pi + 4] || "")) continue;   // <PieChart> ueberspringen
    const ende = tagEnd(src, pi);
    if (ende === -1) continue;
    const tag = src.slice(pi, ende + 1);
    const zeile = src.slice(0, pi).split("\n").length;
    gepruefte++;
    if (!/\blabel=/.test(tag)) continue;                // kein Label → in Ordnung

    if (!/insideSliceLabel\s*\(/.test(tag)) {
      verstoesse.push({
        datei: rel, zeile, regel: "R1",
        text: "Freihand-`label=` an <Pie> — insideSliceLabel() aus @/lib/chartLabels benutzen",
      });
    }
    if (!/labelLine=\{false\}/.test(tag)) {
      verstoesse.push({
        datei: rel, zeile, regel: "R3",
        text: "`label=` ohne `labelLine={false}` — Fuehrungslinie zieht den Text nach aussen",
      });
    }
  }
}

if (verstoesse.length === 0) {
  console.log(`check-chart-labels: OK (${gepruefte} <Pie> geprueft, keine Ueberlappungsrisiken)`);
  process.exit(0);
}

console.error("check-chart-labels: REGELVERSTOSS\n");
for (const v of verstoesse) {
  console.error(`::error file=web/${v.datei},line=${v.zeile}::[${v.regel}] ${v.text}`);
  console.error(`  ${v.datei}:${v.zeile}  [${v.regel}] ${v.text}`);
}
console.error(`\n${verstoesse.length} Verstoss(e). Regel: web/src/lib/chartLabels.tsx`);
process.exit(1);
