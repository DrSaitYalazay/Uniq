/**
 * gapReportXlsx — Excel export for the Phase 3 Gap Analysis.
 * Feature-parity with the PDF/Word:
 *   - Summary sheet (per-framework KPIs)
 *   - Narrative sheet (Management narrative paragraphs)
 *   - Priority sheet (Top 20 criticality-weighted)
 *   - Timeline sheet (30 / 90 / 180 / 365 next-step buckets)
 *   - One sheet per framework with capability + articles + recommendation
 */

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { severityView, severityShort } from "./severityGrading";
import { getCompanyBrand } from "./companyBrand";
import { getReportBrandName } from "./reportBrand";
import { computeStats, familyOf } from "./assessmentEngine";
import { capabilityFor, humanCap } from "./capabilityMap";
import { scopedArticles, recommendationFor } from "./frameworkArticleMap";
import {
  collectOpenGaps, aggregateGaps, criticalityWeightedPriority,
  buildExecutiveNarrative, buildNextSteps, BUCKET_LABEL,
} from "./narrativeBuilders";
import { buildCriticalityContext, type BuildGapReportInput } from "./gapReport";

const FW_LABELS: Record<string, string> = {
  ISO27001: "ISO/IEC 27001", NIS2: "NIS2", BSI: "BSI IT-Grundschutz",
  BSI200_4: "BSI 200-4 (BCM)", BCM22301: "ISO 22301 (BCM)", KRITIS: "KRITIS",
  DORA: "DORA", TISAX: "TISAX / VDA ISA", GDPR: "DSGVO / GDPR",
  ISO27701: "ISO 27701", AIACT: "EU AI Act", ISO42001: "ISO/IEC 42001",
  NIST_AI_RMF: "NIST AI RMF", MaRisk: "MaRisk", CRA: "Cyber Resilience Act",
};

const NAVY = "FF1A2E41";
const COPPER = "FF157A50";
const CRIT_FG = "FFB91C1C";
const LOW_BG = "FFDCFCE7";
const WARN_BG = "FFFEF3C7";
const CRIT_BG = "FFFEE2E2";
const NA_BG = "FFF1F5F9";
const SOFT_BLUE = "FFEFF6FF";
const HEADER_FONT: Partial<ExcelJS.Font> = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
const CELL_FONT: Partial<ExcelJS.Font> = { name: "Arial", size: 11 };
const MUTED_FONT: Partial<ExcelJS.Font> = { name: "Arial", size: 10, color: { argb: "FF6B7280" } };
const BORDER: Partial<ExcelJS.Border> = { style: "thin", color: { argb: "FFDBE3EF" } };
const ALL_BORDERS: Partial<ExcelJS.Borders> = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function statusText(st: string | null, de: boolean): { text: string; fill: string } {
  if (st === "ja") return { text: de ? "Umgesetzt" : "Implemented", fill: LOW_BG };
  if (st === "teilweise") return { text: de ? "Teilweise" : "Partial", fill: WARN_BG };
  if (st === "nein") return { text: de ? "Nicht umgesetzt" : "Not implemented", fill: CRIT_BG };
  if (st === "na") return { text: "N/A", fill: NA_BG };
  return { text: de ? "Unbeantwortet" : "Unanswered", fill: "FFFFFFFF" };
}

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((c) => {
    c.font = HEADER_FONT;
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    c.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    c.border = ALL_BORDERS;
  });
  row.height = 22;
}

function sanitizeSheetName(base: string, existing: Set<string>): string {
  let name = base.replace(/[\\/*?:[\]]/g, "-").slice(0, 31) || "Sheet";
  if (!existing.has(name)) { existing.add(name); return name; }
  let i = 2;
  while (existing.has(name.slice(0, 28) + "_" + i)) i++;
  const finalName = name.slice(0, 28) + "_" + i;
  existing.add(finalName);
  return finalName;
}

export async function exportGapReportXlsx(inp: BuildGapReportInput): Promise<void> {
  const de = inp.de;
  const brand = getCompanyBrand();
  const brandName = brand.companyName || getReportBrandName(de ? "de" : "en");
  const wb = new ExcelJS.Workbook();
  wb.creator = brandName;
  wb.created = new Date();
  const usedNames = new Set<string>();

  const scopedFwList = inp.frameworks.map(pf => pf.framework);
  const gaps = collectOpenGaps(inp.frameworks);
  const agg = aggregateGaps(gaps);
  const ctx = buildCriticalityContext(inp.inventory);

  // ── Summary sheet ────────────────────────────────────────────────────────
  const s = wb.addWorksheet(sanitizeSheetName(de ? "Zusammenfassung" : "Summary", usedNames), {
    views: [{ state: "frozen", ySplit: 5 }],
  });
  s.addRow([de ? "Gap-Analyse Bericht" : "Gap Analysis Report"]);
  s.getRow(1).font = { name: "Arial", size: 18, bold: true, color: { argb: NAVY } };
  s.addRow([brandName]);
  s.getRow(2).font = { name: "Arial", size: 12, bold: true, color: { argb: NAVY } };
  const dateStr = new Date().toLocaleDateString(de ? "de-DE" : "en-GB", { year: "numeric", month: "long", day: "2-digit" });
  const meta: string[] = [dateStr];
  if (inp.authorName) meta.push((de ? "Bericht erstellt von" : "Report prepared by") + ": " + inp.authorName);
  if ((inp.classification ?? "").trim()) meta.push(inp.classification!.trim());
  s.addRow([meta.join("  ·  ")]);
  s.getRow(3).font = MUTED_FONT;
  s.addRow([]);

  const headers = [
    de ? "Framework" : "Framework",
    de ? "Gesamt" : "Total",
    de ? "Umgesetzt" : "Implemented",
    de ? "Teilweise" : "Partial",
    de ? "Nicht umgesetzt" : "Not implemented",
    "N/A",
    de ? "Kritisch MUSS" : "Critical MUST",
    de ? "Compliance %" : "Compliance %",
    de ? "MUSS, gilt später" : "MUST, applies later",
  ];
  const hdrRow = s.addRow(headers);
  styleHeader(hdrRow);
  s.columns = [
    { width: 34 }, { width: 12 }, { width: 12 }, { width: 12 },
    { width: 15 }, { width: 10 }, { width: 16 }, { width: 16 }, { width: 18 },
  ];

  for (const pf of inp.frameworks) {
    const st = computeStats(pf.controls, pf.effective);
    const label = FW_LABELS[pf.framework] ?? pf.framework;
    const row = s.addRow([label, st.total, st.ja, st.teilweise, st.nein, st.na, st.criticalOpen, st.compliancePct / 100, st.criticalLater ?? 0]);
    row.eachCell((c) => { c.font = CELL_FONT; c.border = ALL_BORDERS; c.alignment = { vertical: "middle" }; });
    row.getCell(1).font = { ...CELL_FONT, bold: true, color: { argb: NAVY } };
    row.getCell(8).numFmt = "0.0%";
    row.getCell(8).font = { ...CELL_FONT, bold: true, color: { argb: COPPER } };
    row.getCell(9).alignment = { vertical: "middle", horizontal: "center" };
    for (let i = 2; i <= 7; i++) row.getCell(i).alignment = { vertical: "middle", horizontal: "center" };
  }

  // Criticality context row-block (below summary table)
  if (ctx.totalServices > 0 || ctx.totalAssets > 0) {
    s.addRow([]);
    const critHead = s.addRow([de ? "Kritikalitätskontext (Phase 2)" : "Criticality Context (Phase 2)"]);
    critHead.getCell(1).font = { name: "Arial", size: 13, bold: true, color: { argb: NAVY } };
    const kpiRow = s.addRow([
      (de ? "Kritische Dienste: " : "Critical services: ") + `${ctx.criticalServiceCount} / ${ctx.totalServices}`,
      (de ? "Hoch-krit. Assets: " : "High-crit. assets: ") + `${ctx.highCriticalityAssetCount} / ${ctx.totalAssets}`,
      (de ? "SPOF: " : "SPOFs: ") + ctx.spofCount,
    ]);
    kpiRow.eachCell((c) => { c.font = { ...CELL_FONT, bold: true, color: { argb: NAVY } }; c.alignment = { vertical: "middle" }; });
  }

  // ── Narrative sheet ──────────────────────────────────────────────────────
  const paras = buildExecutiveNarrative(agg, ctx, scopedFwList, de);
  if (paras.length > 0) {
    const ns = wb.addWorksheet(sanitizeSheetName(de ? "Narrative" : "Narrative", usedNames), { views: [{ state: "frozen", ySplit: 1 }] });
    const nh = ns.addRow([de ? "Management Narrative" : "Management Narrative"]);
    nh.getCell(1).font = { name: "Arial", size: 16, bold: true, color: { argb: NAVY } };
    nh.height = 26;
    ns.addRow([]);
    ns.columns = [{ width: 120 }];
    for (const para of paras) {
      const r = ns.addRow([para]);
      r.getCell(1).font = { name: "Arial", size: 11, color: { argb: "FF2D3748" } };
      r.getCell(1).alignment = { vertical: "top", wrapText: true };
      r.height = Math.min(200, Math.max(40, Math.ceil(para.length / 100) * 16));
    }
  }

  // ── Priority sheet ───────────────────────────────────────────────────────
  const items = criticalityWeightedPriority(gaps, ctx, de, 20);
  if (items.length > 0) {
    const ps = wb.addWorksheet(sanitizeSheetName(de ? "Priorität Top 20" : "Priority Top 20", usedNames), { views: [{ state: "frozen", ySplit: 1 }] });
    const pcols = [
      "#",
      de ? "Framework" : "Framework",
      "ID",
      de ? "Capability" : "Capability",
      de ? "Anforderung" : "Requirement",
      de ? "Treiber" : "Drivers",
      "MUSS",
      "Score",
    ];
    const ph = ps.addRow(pcols);
    styleHeader(ph);
    ps.columns = [
      { width: 6 }, { width: 18 }, { width: 14 }, { width: 22 },
      { width: 60 }, { width: 40 }, { width: 8 }, { width: 10 },
    ];
    ps.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: pcols.length } };
    items.forEach((it, i) => {
      const req = (de ? it.gap.ctrl.req_de : it.gap.ctrl.req_en) || it.gap.ctrl.req_de || it.gap.ctrl.req_en || "";
      const fwLabel = FW_LABELS[it.gap.framework] ?? it.gap.framework;
      const row = ps.addRow([
        i + 1,
        fwLabel,
        it.gap.ctrl.id,
        humanCap(it.gap.cap, de),
        req,
        it.drivers.join(" · "),
        it.gap.muss ? "MUSS" : "",
        it.score,
      ]);
      row.eachCell((c) => { c.font = CELL_FONT; c.border = ALL_BORDERS; c.alignment = { vertical: "top", wrapText: true }; });
      row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
      row.getCell(1).font = { ...CELL_FONT, bold: true, color: { argb: "FF6B7280" } };
      row.getCell(3).font = { ...CELL_FONT, bold: true, color: { argb: NAVY } };
      row.getCell(4).font = { ...CELL_FONT, bold: true, color: { argb: NAVY } };
      if (it.gap.muss) {
        row.getCell(7).font = { ...CELL_FONT, bold: true, color: { argb: CRIT_FG } };
        row.getCell(7).alignment = { vertical: "middle", horizontal: "center" };
      }
      row.getCell(8).numFmt = "0.0";
      row.getCell(8).font = { ...CELL_FONT, bold: true, color: { argb: COPPER } };
      row.getCell(8).alignment = { vertical: "middle", horizontal: "center" };
    });
  }

  // ── Timeline sheet ───────────────────────────────────────────────────────
  const steps = buildNextSteps(agg, scopedFwList, de);
  if (steps.length > 0) {
    const ts = wb.addWorksheet(sanitizeSheetName(de ? "Zeitplan" : "Timeline", usedNames), { views: [{ state: "frozen", ySplit: 1 }] });
    const tcols = [
      de ? "Zeitfenster" : "Timeframe",
      de ? "Capability" : "Capability",
      de ? "Lücken" : "Gaps",
      "MUSS",
      de ? "Verankerung" : "Anchors",
      de ? "Empfehlung" : "Recommendation",
    ];
    const th = ts.addRow(tcols);
    styleHeader(th);
    ts.columns = [
      { width: 26 }, { width: 26 }, { width: 10 }, { width: 8 },
      { width: 34 }, { width: 70 },
    ];
    ts.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: tcols.length } };
    const order: (30 | 90 | 180 | 365)[] = [30, 90, 180, 365];
    for (const b of order) {
      const bucketSteps = steps.filter(x => x.bucket === b);
      if (bucketSteps.length === 0) continue;
      const label = de ? BUCKET_LABEL[b].de : BUCKET_LABEL[b].en;
      for (const st of bucketSteps) {
        const row = ts.addRow([
          label,
          humanCap(st.cap, de),
          st.gapCount,
          st.mustCount > 0 ? st.mustCount : "",
          st.articles.join(", "),
          st.recommendation,
        ]);
        row.eachCell((c) => { c.font = CELL_FONT; c.border = ALL_BORDERS; c.alignment = { vertical: "top", wrapText: true }; });
        row.getCell(1).font = { ...CELL_FONT, bold: true, color: { argb: COPPER } };
        row.getCell(2).font = { ...CELL_FONT, bold: true, color: { argb: NAVY } };
        row.getCell(3).alignment = { vertical: "middle", horizontal: "center" };
        row.getCell(4).alignment = { vertical: "middle", horizontal: "center" };
        if (st.mustCount > 0) row.getCell(4).font = { ...CELL_FONT, bold: true, color: { argb: CRIT_FG } };
      }
    }
  }

  // ── Per-framework sheets ─────────────────────────────────────────────────
  for (const pf of inp.frameworks) {
    const label = FW_LABELS[pf.framework] ?? pf.framework;
    const ws = wb.addWorksheet(sanitizeSheetName(label, usedNames), { views: [{ state: "frozen", ySplit: 1 }] });
    const cols = [
      de ? "Bereich" : "Family",
      "ID",
      de ? "Anforderung" : "Requirement",
      "MUSS",
      "Status",
      de ? "Reifegrad" : "Maturity",
      de ? "Capability" : "Capability",
      de ? "Verankerung" : "Anchors",
      de ? "Empfehlung" : "Recommendation",
      de ? "Herkunft" : "Origin",
      de ? "Vererbt aus" : "Inherited from",
      de ? "Abweichungsgrad" : "Nonconformity grade",
      de ? "Deckung (FW-Übernahme)" : "Coverage (cross-framework)",
      de ? "Notiz" : "Note",
    ];
    const h = ws.addRow(cols);
    styleHeader(h);
    ws.columns = [
      { width: 26 }, { width: 14 }, { width: 55 }, { width: 8 },
      { width: 14 }, { width: 12 }, { width: 22 }, { width: 26 },
      { width: 55 }, { width: 12 }, { width: 22 },
      { width: 22 }, { width: 24 }, { width: 30 },
    ];
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };

    const sorted = [...pf.controls].sort((a, b) => familyOf(a, de).label.localeCompare(familyOf(b, de).label) || a.id.localeCompare(b.id));
    for (const c of sorted) {
      const eff = pf.effective.get(c.id);
      const sl = statusText(eff?.status ?? null, de);
      const req = (de ? c.req_de : c.req_en) || c.req_de || c.req_en || "";
      const cap = capabilityFor(c);
      const st = eff?.status ?? null;
      // Only fill capability/anchor/recommendation for open items — reduces noise.
      const isOpen = st !== "ja" && st !== "na";
      const anchors = isOpen ? scopedArticles(cap, [pf.framework]).join(", ") : "";
      const rec = isOpen ? recommendationFor(cap, de) : "";
      const row = ws.addRow([
        familyOf(c, de).label,
        c.id,
        req,
        c.muss === "true" ? "MUSS" : "",
        sl.text,
        eff?.reifegrad ?? "",
        isOpen ? humanCap(cap, de) : "",
        anchors,
        rec,
        eff?.origin === "inherited" ? (de ? "vererbt" : "inherited") : eff?.origin === "explicit" ? (de ? "direkt" : "direct") : "",
        eff?.origin === "inherited" ? (eff.inheritedFrom ?? []).join(", ") : "",
        // Y7: Abweichungsgrad — Prüferentscheid oder klar gekennzeichneter
        // Katalogvorschlag. NICHT die Risikopriorität; das sind zwei Aussagen.
        (() => {
          const v = severityView(c, eff?.status ?? null, pf.severity?.get(c.id));
          if (!v.value) return "";
          return v.source === "pruefer"
            ? severityShort(v.value, de ? "de" : "en")
            : `${severityShort(v.value, de ? "de" : "en")} (${de ? "Vorschlag" : "suggestion"})`;
        })(),
        // Y8: Deckung bei framework-übergreifender Übernahme.
        eff?.scopeReviewFrom
          ? (eff.scopeReviewPending
              ? (de ? `offen — übernommen aus ${eff.scopeReviewFrom.framework}` : `open — taken from ${eff.scopeReviewFrom.framework}`)
              : (de ? `teilweise — ${eff.scopeReviewFrom.framework}` : `partial — ${eff.scopeReviewFrom.framework}`))
          : "",
        eff?.note ?? "",
      ]);
      row.eachCell((cell) => { cell.font = CELL_FONT; cell.border = ALL_BORDERS; cell.alignment = { vertical: "top", wrapText: true }; });
      row.getCell(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: sl.fill } };
      row.getCell(5).alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      if (isOpen) {
        row.getCell(7).fill = { type: "pattern", pattern: "solid", fgColor: { argb: SOFT_BLUE } };
        row.getCell(7).font = { ...CELL_FONT, bold: true, color: { argb: NAVY } };
      }
      if (c.muss === "true") row.getCell(4).font = { ...CELL_FONT, bold: true, color: { argb: CRIT_FG } };
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  const slug = (brand.companyName || "gap-analyse").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const stampDate = new Date().toISOString().slice(0, 10);
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${slug}-gap-analyse-${stampDate}.xlsx`);
}
