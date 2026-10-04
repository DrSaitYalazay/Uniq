/**
 * riskReportDocx — Word export for Phase 4 Risk Analysis. Feature parity
 * with the PDF: cover, exec summary, KPI table, matrix summary table,
 * Top-10 risk cards, timeline plan.
 */
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, Header, Footer, PageNumber,
} from "docx";
import { saveAs } from "file-saver";
import { getCompanyBrand } from "./companyBrand";
import { getReportBrandName } from "./reportBrand";
import {
  buildExecutiveNarrative, buildTopRiskInsight, buildNextStepsPlan,
} from "./riskReportNarrative";
import {
  riskLevelLabel, themeMatrixPalette, scoreAndLevel,
  type RiskAnalysisResult, type RiskObject, type RiskLevel,
} from "./riskEngine";
import type { BuildRiskReportInput } from "./riskReport";

const FONT = "Arial";
const NAVY = "1A2E41";
const COPPER = "157A50";
const CRIT = "B91C1C";
const MUTED = "6B7280";
const BORDER = "DBE3EF";
const SURFACE = "F5F7FB";

function txt(t: string, o: { bold?: boolean; size?: number; color?: string; italics?: boolean } = {}) {
  return new TextRun({ text: t, font: FONT, bold: o.bold, italics: o.italics, size: o.size ?? 22, color: o.color });
}
function p(text: string, o: { bold?: boolean; size?: number; color?: string; align?: any; heading?: any; spacing?: any } = {}) {
  return new Paragraph({
    heading: o.heading, alignment: o.align, spacing: o.spacing,
    children: [txt(text, { bold: o.bold, size: o.size, color: o.color })],
  });
}
function cell(children: Paragraph[], opts: { fill?: string; width?: number } = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.fill ? { type: "clear" as any, fill: opts.fill, color: "auto" } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
    },
    children,
  });
}

function buildKpiTable(result: RiskAnalysisResult, de: boolean): Table {
  const s = result.summary;
  const kpis: Array<[string, string | number]> = [
    [de ? "Risiken gesamt" : "Total risks", s.totalRisks],
    [de ? "Kritisch" : "Critical", s.bySeverity.critical],
    [de ? "Hoch" : "High", s.bySeverity.high],
    [de ? "Mittel" : "Medium", s.bySeverity.medium],
    [de ? "Niedrig" : "Low", s.bySeverity.low],
    [de ? "Ø Score" : "Avg score", s.averageScore],
  ];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: kpis.map(([lbl]) => cell([p(String(lbl), { bold: true, size: 18, color: NAVY })], { fill: SURFACE })) }),
      new TableRow({ children: kpis.map(([, val]) => cell([p(String(val), { bold: true, size: 26, color: NAVY, align: AlignmentType.CENTER })])) }),
    ],
  });
}

function buildTopRiskParas(result: RiskAnalysisResult, de: boolean): Paragraph[] {
  const top = result.risks.slice(0, 10);
  if (top.length === 0) return [];
  const out: Paragraph[] = [];
  out.push(p(de ? "Top-10 Risiken" : "Top-10 Risks", { heading: HeadingLevel.HEADING_2, color: NAVY, spacing: { before: 240, after: 120 } }));
  top.forEach((r, i) => {
    const ins = buildTopRiskInsight(r, de ? "de" : "en");
    const title = de ? r.gap_title : r.gap_title_en;
    out.push(new Paragraph({
      spacing: { before: 180, after: 40 },
      children: [
        txt(`#${i + 1}  `, { bold: true, color: MUTED, size: 20 }),
        txt(title, { bold: true, color: NAVY, size: 24 }),
        txt(`   [${riskLevelLabel(r.risk_level, de ? "de" : "en").toUpperCase()}  ·  ${de ? "Score" : "Score"} ${r.risk_score}]`, { color: r.risk_level === "critical" || r.risk_level === "high" ? CRIT : COPPER, bold: true, size: 18 }),
      ],
    }));
    const scope = r.scope === "organization" ? (de ? "Organisationsweit" : "Org-wide") : (r.asset_name ?? "—");
    const svc = r.service_name ? ` · ${r.service_name}` : "";
    out.push(p(`${scope}${svc}`, { color: MUTED, size: 18 }));
    // ITEM 16 — inherent → residual line, only when residual has been computed.
    if (typeof r.residual_score === "number") {
      const inh = r.inherent_score ?? r.risk_score;
      out.push(new Paragraph({
        children: [
          txt(de ? "Inhärent → Residual: " : "Inherent → Residual: ", { bold: true, size: 18, color: COPPER }),
          txt(`${inh} → ${r.residual_score}`, { size: 18 }),
        ],
        spacing: { after: 40 },
      }));
    }
    out.push(new Paragraph({ children: [txt(de ? "Warum kritisch: " : "Why critical: ", { bold: true, size: 20 }), txt(ins.whyCritical, { size: 20 })], spacing: { after: 40 } }));
    out.push(new Paragraph({ children: [txt(de ? "Business Impact: " : "Business impact: ", { bold: true, size: 20 }), txt(ins.businessImpact, { size: 20 })], spacing: { after: 40 } }));
    out.push(new Paragraph({ children: [txt(de ? "Sofortmaßnahme: " : "Immediate action: ", { bold: true, size: 20 }), txt(ins.immediateAction, { size: 20 })], spacing: { after: 80 } }));
  });
  return out;
}

/** "#RRGGBB" → "RRGGBB"; docx erwartet die Füllung ohne Raute. */
function bare(hex: string): string {
  return String(hex || "").replace("#", "").trim().toUpperCase() || "FFFFFF";
}

/**
 * Leere Zelle: Farbe Richtung Weiß mischen. Word kennt keine Deckkraft je
 * Zelle, deshalb wird die 45-%-Darstellung des Bildschirms als gemischter
 * Volltonwert nachgebildet.
 */
function mixWhite(hex: string, alpha: number): string {
  const h = bare(hex);
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return "FFFFFF";
  const m = (c: number) => Math.round(c * alpha + 255 * (1 - alpha)).toString(16).padStart(2, "0");
  return (m(r) + m(g) + m(b)).toUpperCase();
}

/**
 * Risikomatrix als Word-Tabelle.
 *
 * Befund Dr. Sait 2026-09-12: Im Word-Bericht fehlte die Matrix vollständig —
 * der Dateikopf versprach eine „matrix summary table", gebaut wurde sie nie.
 * Jetzt dieselbe Aussage wie Bildschirm und PDF: jede Zelle nach ihrer Stufe
 * eingefärbt, Anzahl der Risiken in der Zelle, Achsen beschriftet, Legende
 * darunter. Farben aus derselben Palette.
 */
function buildMatrixTable(inp: BuildRiskReportInput): (Paragraph | Table)[] {
  const { result, de } = inp;
  const dims = result.config.dimensions ?? { rows: 5, cols: 5 };
  const pal = inp.palette ?? themeMatrixPalette();
  const hex: Record<string, string> = {
    critical: bare(pal.critical), high: bare(pal.high), medium: bare(pal.medium), low: bare(pal.low),
  };
  const order: RiskLevel[] = ["critical", "high", "medium", "low"];
  const name = (l: RiskLevel) => de
    ? ({ critical: "Kritisch", high: "Hoch", medium: "Mittel", low: "Niedrig" } as Record<string, string>)[l]
    : ({ critical: "Critical", high: "High", medium: "Medium", low: "Low" } as Record<string, string>)[l];

  const buckets: RiskObject[][][] = Array.from({ length: dims.rows }, () =>
    Array.from({ length: dims.cols }, () => [] as RiskObject[]));
  for (const r of result.risks) {
    const li = Math.min(dims.cols - 1, Math.max(0, r.likelihood - 1));
    const ii = Math.min(dims.rows - 1, Math.max(0, r.impact - 1));
    buckets[dims.rows - 1 - ii][li].push(r);
  }
  const worst = (cells: RiskObject[]): RiskLevel => {
    for (const l of order) if (cells.some(r => r.risk_level === l)) return l;
    return "low";
  };

  const headRow = new TableRow({
    tableHeader: true,
    children: [
      cell([p(de ? "Auswirkung ↓ / Wahrsch. →" : "Impact ↓ / Likelihood →", { size: 16, bold: true, color: NAVY })], { fill: SURFACE }),
      ...Array.from({ length: dims.cols }, (_c, ci) =>
        cell([p(String(ci + 1), { size: 16, bold: true, align: AlignmentType.CENTER, color: NAVY })], { fill: SURFACE })),
    ],
  });

  const bodyRows = buckets.map((row, ri) => new TableRow({
    children: [
      cell([p(String(dims.rows - ri), { size: 16, bold: true, align: AlignmentType.CENTER, color: NAVY })], { fill: SURFACE }),
      ...row.map((cells, ci) => {
        const likelihood = ci + 1, impact = dims.rows - ri;
        const ov = inp.cellOverrides?.[`${likelihood}-${impact}`];
        const lvl: RiskLevel = ov ?? (cells.length > 0
          ? worst(cells)
          : scoreAndLevel(likelihood, impact, result.config).level);
        const fill = (ov || cells.length > 0) ? hex[lvl] : mixWhite(hex[lvl], 0.45);
        return cell(
          [p(cells.length ? String(cells.length) : "", { size: 20, bold: true, align: AlignmentType.CENTER, color: NAVY })],
          { fill },
        );
      }),
    ],
  }));

  const legend = new Paragraph({
    spacing: { before: 100, after: 60 },
    children: order.flatMap(l => [
      new TextRun({ text: "  ■  ", font: FONT, size: 20, color: hex[l] }),
      txt(name(l) ?? l, { size: 16, color: MUTED }),
    ]),
  });

  return [
    p(de ? `Risikomatrix (${dims.rows}×${dims.cols})` : `Risk Matrix (${dims.rows}×${dims.cols})`,
      { heading: HeadingLevel.HEADING_2, color: NAVY, spacing: { before: 240, after: 120 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
        left: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
        right: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: BORDER },
      },
      rows: [headRow, ...bodyRows],
    }),
    legend,
    p(de
      ? "Zahl in Zelle = Anzahl der Risiken; Farbe = Klassifizierung der Zelle. Blasse Felder sind unbesetzt."
      : "Cell number = risk count; colour = cell classification. Pale cells are unoccupied.",
      { size: 16, color: MUTED, spacing: { after: 120 } }),
  ];
}

function buildTimelineParas(result: RiskAnalysisResult, de: boolean): Paragraph[] {
  const plan = buildNextStepsPlan(result, de ? "de" : "en");
  const buckets: Array<{ key: keyof typeof plan; label: string }> = [
    { key: "sofort",        label: de ? "Sofort (0–30 Tage)"          : "Immediate (0–30 days)" },
    { key: "kurzfristig",   label: de ? "Kurzfristig (30–90 Tage)"    : "Short-term (30–90 days)" },
    { key: "mittelfristig", label: de ? "Mittelfristig (90–180 Tage)" : "Mid-term (90–180 days)" },
    { key: "langfristig",   label: de ? "Langfristig (>180 Tage)"     : "Long-term (>180 days)" },
  ];
  const out: Paragraph[] = [];
  // Überschrift nur, wenn es überhaupt Einträge gibt (kein leerer Abschnitt).
  const anyItems = buckets.some(b => (plan[b.key] as unknown[]).length > 0);
  if (!anyItems) return out;
  out.push(p(de ? "Nächste Schritte — Zeitplan" : "Next Steps — Timeline",
    { heading: HeadingLevel.HEADING_2, color: NAVY, spacing: { before: 240, after: 120 } }));
  for (const b of buckets) {
    const items = plan[b.key];
    if (!items.length) continue;
    out.push(p(b.label, { bold: true, color: COPPER, size: 22, spacing: { before: 160, after: 60 } }));
    for (const it of items) {
      out.push(p(`• ${it.text}`, { size: 20 }));
      out.push(p(`   ${it.owner} · ${it.due}`, { color: MUTED, size: 18, spacing: { after: 40 } }));
    }
  }
  return out;
}

export async function exportRiskReportDocx(inp: BuildRiskReportInput): Promise<void> {
  const brand = getCompanyBrand();
  const de = inp.de;
  const dateStr = new Date().toLocaleDateString(de ? "de-DE" : "en-GB",
    { year: "numeric", month: "long", day: "2-digit" });
  const brandName = brand.companyName || getReportBrandName(de ? "de" : "en");
  const narr = buildExecutiveNarrative(inp.result, de ? "de" : "en");
  const stamp = (inp.classification ?? "").trim();

  const children: any[] = [
    p(de ? "Phase 4 · Risiko" : "Phase 4 · Risk", { color: COPPER, bold: true, size: 20 }),
    p(de ? "Risikoanalyse Bericht" : "Risk Analysis Report",
      { heading: HeadingLevel.HEADING_1, color: NAVY }),
    p(`${brandName}${inp.authorName ? "  ·  " + (de ? "Erstellt von" : "Prepared by") + ": " + inp.authorName : ""}  ·  ${dateStr}`,
      { color: MUTED, size: 18, spacing: { after: 200 } }),
    p(de ? "Executive Summary" : "Executive Summary",
      { heading: HeadingLevel.HEADING_2, color: NAVY, spacing: { after: 120 } }),
    buildKpiTable(inp.result, de),
    p("", {}),
  ];
  for (const para of narr.paragraphs) children.push(p(para, { size: 20, spacing: { after: 100 } }));
  children.push(...buildMatrixTable(inp));
  children.push(...buildTopRiskParas(inp.result, de));
  children.push(...buildTimelineParas(inp.result, de));
  if (stamp) children.push(p(stamp, { color: MUTED, size: 18, spacing: { before: 240 } }));

  const doc = new Document({
    creator: brandName, title: de ? "Risikoanalyse" : "Risk Analysis",
    styles: { default: { document: { run: { font: FONT } } } },
    sections: [{
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: brandName, font: FONT, size: 16, color: MUTED })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `${brandName} · ${de ? "Vertraulich" : "Confidential"} · ${de ? "Seite" : "Page"} `, font: FONT, size: 16, color: MUTED }),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: MUTED }),
              new TextRun({ text: " / ", font: FONT, size: 16, color: MUTED }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: MUTED }),
            ],
          })],
        }),
      },
      children,
    }],
  });
  const blob = await Packer.toBlob(doc);
  const slug = (brand.companyName || "risikoanalyse").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  saveAs(blob, `${slug}-risikoanalyse-${new Date().toISOString().slice(0, 10)}.docx`);
}
