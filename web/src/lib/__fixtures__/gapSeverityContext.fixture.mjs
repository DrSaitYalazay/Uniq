// Fixture: G1 — kontext-/risikobasierte Gap-Severity (computeGapSeverity) vs. 2×2.
// Bundle: esbuild src/lib/gapEngine.ts --bundle --format=esm --platform=node --outfile=/tmp/gap.mjs
// Run:    node src/lib/__fixtures__/gapSeverityContext.fixture.mjs
//
// Belegt: die flache 2×2-Tabelle (severityFor) liefert für MUSS+nein IMMER
// "critical". Der Kontext-Provider (computeGapSeverity, in Settings über
// „gap_context" aktivierbar) differenziert nach Asset-Kritikalität, SPOF und
// Kontroll-Wirksamkeit UND liefert eine auditor-taugliche Faktor-Herleitung.
import { severityFor, computeGapSeverity } from "/tmp/gap.mjs";

const flat = severityFor(true, "nein");                                  // immer "critical"
const low  = computeGapSeverity(true, "nein", { assetCritLevel: "Low" });
const crit = computeGapSeverity(true, "nein", { assetCritLevel: "Critical", spof: true, controlEff: 0.9 });

const ok =
  flat === "critical" &&
  low.level === "high" &&                 // niedriges Asset -> herabgestuft
  crit.level === "critical" &&            // kritisches Asset + SPOF -> bleibt kritisch
  crit.score > low.score &&               // Kontext erhöht den Score
  crit.factors.length >= 3;               // nachvollziehbare Herleitung

console.log("2x2:", flat, "| Kontext Low:", low.level, low.score, "| Kontext Critical+SPOF:", crit.level, crit.score, "| Faktoren:", crit.factors.length);
console.log(ok ? "✅ PASS — Kontext differenziert Severity + liefert Herleitung" : "❌ FAIL");
if (!ok) process.exit(1);
