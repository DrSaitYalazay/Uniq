// Bun script: export all catalog risks with their default recommended controls (measures) → English Excel.
import ExcelJS from "exceljs";
import { controlCatalog } from "../src/data/controlCatalog";
import { controlMetadata } from "../src/data/controlMetadata";

type Row = {
  risk_id: string;
  risk_title: string;
  risk_description: string;
  cia: string;
  threat_category: string;
  likelihood: number;
  impact: number;
  risk_score: number;
  control_id: string;
  control_family: string;
  measure_id: string;
  measure_title: string;
  measure_description: string;
  priority: string;
  effort: string;
  iso_ref: string;
  bsi_ref: string;
};

const rows: Row[] = [];
for (const [control_id, entry] of Object.entries(controlCatalog)) {
  const family = controlMetadata[control_id]?.familyId ?? "general";
  for (const r of entry.risks) {
    if (!entry.measures.length) {
      rows.push({
        risk_id: r.id, risk_title: r.title_en, risk_description: r.description_en,
        cia: r.cia.join(","), threat_category: r.threat_category,
        likelihood: r.typical_likelihood, impact: r.typical_impact,
        risk_score: r.typical_likelihood * r.typical_impact,
        control_id, control_family: family,
        measure_id: "", measure_title: "", measure_description: "",
        priority: "", effort: "", iso_ref: "", bsi_ref: "",
      });
      continue;
    }
    for (const m of entry.measures) {
      rows.push({
        risk_id: r.id, risk_title: r.title_en, risk_description: r.description_en,
        cia: r.cia.join(","), threat_category: r.threat_category,
        likelihood: r.typical_likelihood, impact: r.typical_impact,
        risk_score: r.typical_likelihood * r.typical_impact,
        control_id, control_family: family,
        measure_id: m.id, measure_title: m.title_en, measure_description: m.description_en,
        priority: m.priority, effort: m.effort,
        iso_ref: m.iso_ref, bsi_ref: m.bsi_ref,
      });
    }
  }
}

const wb = new ExcelJS.Workbook();
wb.creator = "UniqSuite";
wb.created = new Date();

// Sheet 1: Risk × Control mapping (flat)
const ws = wb.addWorksheet("Risks × Default Controls", { views: [{ state: "frozen", ySplit: 1 }] });
ws.columns = [
  { header: "Risk ID", key: "risk_id", width: 14 },
  { header: "Risk Title", key: "risk_title", width: 50 },
  { header: "Risk Description", key: "risk_description", width: 70 },
  { header: "CIA", key: "cia", width: 8 },
  { header: "Threat Category", key: "threat_category", width: 22 },
  { header: "Likelihood (1-5)", key: "likelihood", width: 12 },
  { header: "Impact (1-5)", key: "impact", width: 12 },
  { header: "Risk Score", key: "risk_score", width: 12 },
  { header: "Control ID", key: "control_id", width: 12 },
  { header: "Control Family", key: "control_family", width: 22 },
  { header: "Measure ID", key: "measure_id", width: 14 },
  { header: "Recommended Control (Measure)", key: "measure_title", width: 55 },
  { header: "Measure Description", key: "measure_description", width: 70 },
  { header: "Priority", key: "priority", width: 10 },
  { header: "Effort", key: "effort", width: 10 },
  { header: "ISO 27002 Ref", key: "iso_ref", width: 14 },
  { header: "BSI Ref", key: "bsi_ref", width: 18 },
];
ws.addRows(rows);

const hdr = ws.getRow(1);
hdr.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
hdr.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3A68" } };
hdr.alignment = { vertical: "middle", wrapText: true };
hdr.height = 30;
ws.eachRow((row, idx) => {
  if (idx === 1) return;
  row.alignment = { vertical: "top", wrapText: true };
  row.font = { name: "Arial", size: 10 };
  if (idx % 2 === 0) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F8FC" } };
});
ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columns.length } };

// Sheet 2: Risk summary (one row per risk, controls concatenated)
const ws2 = wb.addWorksheet("Risk Summary", { views: [{ state: "frozen", ySplit: 1 }] });
ws2.columns = [
  { header: "Risk ID", key: "risk_id", width: 14 },
  { header: "Risk Title", key: "risk_title", width: 50 },
  { header: "CIA", key: "cia", width: 8 },
  { header: "Threat Category", key: "threat_category", width: 22 },
  { header: "Likelihood", key: "l", width: 10 },
  { header: "Impact", key: "i", width: 10 },
  { header: "Score", key: "s", width: 8 },
  { header: "Control ID", key: "control_id", width: 12 },
  { header: "# Recommended Controls", key: "n", width: 14 },
  { header: "Recommended Controls (titles)", key: "titles", width: 90 },
];
const byRisk = new Map<string, Row[]>();
for (const r of rows) {
  if (!byRisk.has(r.risk_id)) byRisk.set(r.risk_id, []);
  byRisk.get(r.risk_id)!.push(r);
}
for (const [, group] of byRisk) {
  const first = group[0];
  ws2.addRow({
    risk_id: first.risk_id, risk_title: first.risk_title,
    cia: first.cia, threat_category: first.threat_category,
    l: first.likelihood, i: first.impact, s: first.risk_score,
    control_id: first.control_id,
    n: group.filter(g => g.measure_id).length,
    titles: group.filter(g => g.measure_id).map(g => `• [${g.priority.toUpperCase()}] ${g.measure_title}`).join("\n"),
  });
}
const h2 = ws2.getRow(1);
h2.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
h2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB8860B" } };
h2.alignment = { vertical: "middle", wrapText: true };
h2.height = 30;
ws2.eachRow((row, idx) => {
  if (idx === 1) return;
  row.alignment = { vertical: "top", wrapText: true };
  row.font = { name: "Arial", size: 10 };
});
ws2.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws2.columns.length } };

const out = "/mnt/documents/UniqSuite-Risks-Default-Controls-EN.xlsx";
await wb.xlsx.writeFile(out);
console.log(`✓ ${out}`);
console.log(`  Rows: ${rows.length}  |  Unique risks: ${byRisk.size}  |  Controls: ${Object.keys(controlCatalog).length}`);
