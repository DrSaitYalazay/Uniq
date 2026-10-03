/**
 * riskReportXlsx — Excel export for Phase 4 Risk Analysis. Sheets:
 *   1. Summary — KPIs + criticality context.
 *   2. Narrative — executive narrative paragraphs.
 *   3. Risks — every risk row with score, level, scope, capability.
 *   4. Heatmap — 5×5 matrix (impact × likelihood counts).
 *   5. Timeline — 30/90/180/365 buckets with owner + due date.
 */
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getCompanyBrand } from "./companyBrand";
import {
  buildExecutiveNarrative, buildTopRiskInsight, buildNextStepsPlan,
} from "./riskReportNarrative";
import { riskLevelLabel } from "./riskEngine";
import type { BuildRiskReportInput } from "./riskReport";
import { RT } from "./reportTheme";

// CWS-Markenfarben aus reportTheme (RT). ExcelJS erwartet ARGB ("FF" + Hex).
const argb = (h: string) => "FF" + h.replace("#", "");
const NAVY = argb(RT.navy);
const SURFACE = argb(RT.surfaceAlt);
const CRIT = argb(RT.critical);
const HIGH = argb(RT.high);
const MEDIUM = argb(RT.medium);
const LOW = argb(RT.low);

function levelFill(l: string) {
  return l === "critical" ? CRIT : l === "high" ? HIGH : l === "medium" ? MEDIUM : LOW;
}

function header(ws: ExcelJS.Worksheet, cols: string[]) {
  ws.addRow(cols);
  const row = ws.getRow(ws.rowCount);
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  row.alignment = { vertical: "middle" };
}

export async function exportRiskReportXlsx(inp: BuildRiskReportInput): Promise<void> {
  const { result, de } = inp;
  const wb = new ExcelJS.Workbook();
  wb.creator = getCompanyBrand().companyName || (de ? "Ihr Unternehmen" : "Your organisation");

  // ── Summary
  const sum = wb.addWorksheet(de ? "Zusammenfassung" : "Summary");
  sum.columns = [{ width: 34 }, { width: 18 }];
  sum.addRow([de ? "Risikoanalyse Bericht" : "Risk Analysis Report"]).font = { bold: true, size: 16, color: { argb: NAVY } };
  sum.addRow([getCompanyBrand().companyName || "", new Date().toLocaleDateString(de ? "de-DE" : "en-GB")]);
  if (inp.authorName) sum.addRow([de ? "Erstellt von" : "Prepared by", inp.authorName]);
  if ((inp.classification ?? "").trim()) sum.addRow([de ? "Vertraulichkeit" : "Confidentiality", inp.classification]);
  sum.addRow([]);
  const s = result.summary;
  const kpis: Array<[string, number | string]> = [
    [de ? "Risiken gesamt" : "Total risks", s.totalRisks],
    [de ? "Kritisch" : "Critical", s.bySeverity.critical],
    [de ? "Hoch" : "High", s.bySeverity.high],
    [de ? "Mittel" : "Medium", s.bySeverity.medium],
    [de ? "Niedrig" : "Low", s.bySeverity.low],
    [de ? "Ø Score" : "Avg score", s.averageScore],
    [de ? "Max Score" : "Max score", s.maxScore],
    [de ? "Org-weit" : "Org-wide", s.byScope.organization],
    [de ? "Asset-bezogen" : "Asset-scoped", s.byScope.asset],
  ];
  for (const [k, v] of kpis) {
    const r = sum.addRow([k, v]);
    r.getCell(1).font = { bold: true, color: { argb: NAVY } };
    r.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: SURFACE } };
  }

  // ── Narrative
  const narr = buildExecutiveNarrative(result, de ? "de" : "en");
  const nSheet = wb.addWorksheet(de ? "Narrative" : "Narrative");
  nSheet.columns = [{ width: 110 }];
  nSheet.addRow([de ? "Executive Summary" : "Executive Summary"]).font = { bold: true, size: 14, color: { argb: NAVY } };
  nSheet.addRow([]);
  for (const p of narr.paragraphs) {
    const r = nSheet.addRow([p]);
    r.alignment = { wrapText: true, vertical: "top" };
    r.height = Math.min(120, Math.max(40, Math.ceil(p.length / 90) * 16));
  }

  // ── Risks
  // ITEM 16 — inherent/residual columns only appear once residual has been computed.
  const hasResidual = result.risks.some(r => typeof r.residual_score === "number");
  const rs = wb.addWorksheet(de ? "Risiken" : "Risks");
  rs.columns = [
    { width: 6 }, { width: 42 }, { width: 12 }, { width: 8 }, { width: 12 },
    { width: 24 }, { width: 22 }, { width: 22 }, { width: 60 }, { width: 60 }, { width: 60 },
    ...(hasResidual ? [{ width: 12 }, { width: 12 }] : []),
  ];
  header(rs, ["#",
    de ? "Titel" : "Title",
    de ? "Level" : "Level",
    de ? "Score" : "Score",
    "L × I",
    de ? "Scope" : "Scope",
    de ? "Asset" : "Asset",
    de ? "Service" : "Service",
    de ? "Warum kritisch" : "Why critical",
    de ? "Business Impact" : "Business impact",
    de ? "Sofortmaßnahme" : "Immediate action",
    ...(hasResidual ? [de ? "Inhärent" : "Inherent", de ? "Residual" : "Residual"] : []),
  ]);
  result.risks.forEach((r, i) => {
    const ins = buildTopRiskInsight(r, de ? "de" : "en");
    const row = rs.addRow([
      i + 1,
      de ? r.gap_title : r.gap_title_en,
      riskLevelLabel(r.risk_level, de ? "de" : "en").toUpperCase(),
      r.risk_score,
      `${r.likelihood} × ${r.impact}`,
      r.scope === "organization" ? (de ? "Organisationsweit" : "Org-wide") : (de ? "Asset" : "Asset"),
      r.asset_name ?? "",
      r.service_name ?? "",
      ins.whyCritical,
      ins.businessImpact,
      ins.immediateAction,
      ...(hasResidual ? [r.inherent_score ?? r.risk_score, r.residual_score ?? ""] : []),
    ]);
    row.alignment = { wrapText: true, vertical: "top" };
    row.getCell(3).font = { bold: true, color: { argb: "FFFFFFFF" } };
    row.getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: levelFill(r.risk_level) } };
    row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
    row.height = 60;
  });

  // ── Heatmap
  const dims = result.config.dimensions ?? { rows: 5, cols: 5 };
  const hm = wb.addWorksheet(de ? "Heatmap" : "Heatmap");
  hm.columns = Array.from({ length: dims.cols + 1 }, () => ({ width: 10 }));
  hm.addRow([de ? "Impact ↓ / Likelihood →" : "Impact ↓ / Likelihood →", ...Array.from({ length: dims.cols }, (_, i) => `L${i + 1}`)]);
  hm.getRow(1).font = { bold: true, color: { argb: NAVY } };
  const buckets: number[][] = Array.from({ length: dims.rows }, () => Array(dims.cols).fill(0));
  const lvlMap: string[][] = Array.from({ length: dims.rows }, () => Array(dims.cols).fill("empty"));
  const sev = { critical: 4, high: 3, medium: 2, low: 1, empty: 0 } as any;
  for (const r of result.risks) {
    const li = Math.min(dims.cols - 1, Math.max(0, r.likelihood - 1));
    const ii = Math.min(dims.rows - 1, Math.max(0, r.impact - 1));
    const row = dims.rows - 1 - ii;
    buckets[row][li]++;
    if (sev[r.risk_level] > sev[lvlMap[row][li]]) lvlMap[row][li] = r.risk_level;
  }
  for (let ri = 0; ri < dims.rows; ri++) {
    const r = hm.addRow([`I${dims.rows - ri}`, ...buckets[ri]]);
    r.getCell(1).font = { bold: true };
    for (let ci = 0; ci < dims.cols; ci++) {
      const c = r.getCell(ci + 2);
      const lvl = lvlMap[ri][ci];
      if (lvl !== "empty") {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: levelFill(lvl) } };
        c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      }
      c.alignment = { horizontal: "center", vertical: "middle" };
    }
  }

  // ── Timeline
  const plan = buildNextStepsPlan(result, de ? "de" : "en");
  const tl = wb.addWorksheet(de ? "Zeitplan" : "Timeline");
  tl.columns = [{ width: 22 }, { width: 70 }, { width: 30 }, { width: 18 }];
  header(tl, [
    de ? "Zeitfenster" : "Window",
    de ? "Aktion" : "Action",
    de ? "Verantwortlich" : "Owner",
    de ? "Fällig" : "Due",
  ]);
  const buckets2: Array<{ label: string; items: typeof plan.sofort }> = [
    { label: de ? "Sofort (0–30 Tage)"          : "Immediate (0–30 days)",     items: plan.sofort },
    { label: de ? "Kurzfristig (30–90 Tage)"    : "Short-term (30–90 days)",   items: plan.kurzfristig },
    { label: de ? "Mittelfristig (90–180 Tage)" : "Mid-term (90–180 days)",    items: plan.mittelfristig },
    { label: de ? "Langfristig (>180 Tage)"     : "Long-term (>180 days)",     items: plan.langfristig },
  ];
  for (const b of buckets2) {
    for (const it of b.items) {
      const r = tl.addRow([b.label, it.text, it.owner, it.due]);
      r.alignment = { wrapText: true, vertical: "top" };
    }
  }

  const brand = getCompanyBrand();
  const slug = (brand.companyName || "risikoanalyse").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${slug}-risikoanalyse-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
