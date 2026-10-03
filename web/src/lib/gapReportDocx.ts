/**
 * gapReportDocx — Word export for the Phase 3 Gap Analysis.
 * Feature-parity with the PDF: cover + executive summary + criticality
 * context + management narrative + Top-20 priority + 30/90/180 timeline +
 * per-framework sections with capability + article + recommendation.
 */

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  PageOrientation, Header, Footer, PageNumber,
} from "docx";
import { saveAs } from "file-saver";
import { getCompanyBrand } from "./companyBrand";
import { getReportBrandName } from "./reportBrand";
import {
  computeStats, familyOf,
  type ControlRow, type EffectiveAnswer,
} from "./assessmentEngine";
import { capabilityFor, humanCap } from "./capabilityMap";
import { scopedArticles, recommendationFor } from "./frameworkArticleMap";
import {
  collectOpenGaps, aggregateGaps, criticalityWeightedPriority,
  buildExecutiveNarrative, buildNextSteps, BUCKET_LABEL,
} from "./narrativeBuilders";
import { buildCriticalityContext, type BuildGapReportInput } from "./gapReport";
import { RT } from "./reportTheme";

const FW_LABELS: Record<string, string> = {
  ISO27001: "ISO/IEC 27001", NIS2: "NIS2", BSI: "BSI IT-Grundschutz",
  BSI200_4: "BSI 200-4 (BCM)", BCM22301: "ISO 22301 (BCM)", KRITIS: "KRITIS",
  DORA: "DORA", TISAX: "TISAX / VDA ISA", GDPR: "DSGVO / GDPR",
  ISO27701: "ISO 27701", AIACT: "EU AI Act", ISO42001: "ISO/IEC 42001",
  NIST_AI_RMF: "NIST AI RMF", MaRisk: "MaRisk", CRA: "Cyber Resilience Act",
};

// CWS-Markenfarben aus reportTheme (RT). Navy fix, Copper = App-Akzent.
// docx erwartet Hex OHNE '#'.
const hx = (h: string) => h.replace("#", "");
const FONT = "Arial";
const NAVY = hx(RT.navy);
const COPPER = hx(RT.copper);
const CRIT = hx(RT.critical);
const WARN = hx(RT.medium);
const LOW = hx(RT.low);
const MUTED = hx(RT.muted);
const BORDER = hx(RT.border);
const SURFACE = hx(RT.surfaceAlt);
const SOFT_BLUE = hx(RT.infoBg);

function txt(t: string, opts: { bold?: boolean; size?: number; color?: string; italics?: boolean } = {}) {
  return new TextRun({ text: t, font: FONT, bold: opts.bold, italics: opts.italics, size: opts.size ?? 22, color: opts.color });
}

function p(text: string, opts: { bold?: boolean; size?: number; color?: string; italics?: boolean; align?: any; spacing?: any; heading?: any } = {}) {
  return new Paragraph({
    heading: opts.heading, alignment: opts.align, spacing: opts.spacing,
    children: [txt(text, { bold: opts.bold, size: opts.size, color: opts.color, italics: opts.italics })],
  });
}

function cell(children: Paragraph[], opts: { width?: number; fill?: string; bold?: boolean } = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children,
  });
}

const border = { style: BorderStyle.SINGLE, size: 4, color: BORDER };

function statusLabel(status: string | null, de: boolean): { text: string; color: string } {
  if (status === "ja") return { text: de ? "Umgesetzt" : "Implemented", color: LOW };
  if (status === "teilweise") return { text: de ? "Teilweise" : "Partial", color: WARN };
  if (status === "nein") return { text: de ? "Nicht umgesetzt" : "Not implemented", color: CRIT };
  if (status === "na") return { text: "N/A", color: MUTED };
  return { text: de ? "Unbeantwortet" : "Unanswered", color: MUTED };
}

function summaryTable(inp: BuildGapReportInput, de: boolean): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      cell([p(de ? "Framework" : "Framework", { bold: true, size: 20, color: "FFFFFF" })], { fill: NAVY }),
      cell([p(de ? "Gesamt" : "Total", { bold: true, size: 20, color: "FFFFFF" })], { fill: NAVY }),
      cell([p(de ? "Umgesetzt" : "Implemented", { bold: true, size: 20, color: "FFFFFF" })], { fill: NAVY }),
      cell([p(de ? "Teilweise" : "Partial", { bold: true, size: 20, color: "FFFFFF" })], { fill: NAVY }),
      cell([p(de ? "Nicht umgesetzt" : "Not implemented", { bold: true, size: 20, color: "FFFFFF" })], { fill: NAVY }),
      cell([p("N/A", { bold: true, size: 20, color: "FFFFFF" })], { fill: NAVY }),
      cell([p("Compliance", { bold: true, size: 20, color: "FFFFFF" })], { fill: NAVY }),
    ],
  });
  const rows = inp.frameworks.map((pf) => {
    const s = computeStats(pf.controls, pf.effective);
    const label = FW_LABELS[pf.framework] ?? pf.framework;
    return new TableRow({
      children: [
        cell([p(label, { bold: true, size: 22 })]),
        cell([p(String(s.total), { align: AlignmentType.CENTER, size: 22 })]),
        cell([p(String(s.ja), { align: AlignmentType.CENTER, size: 22, color: LOW, bold: true })]),
        cell([p(String(s.teilweise), { align: AlignmentType.CENTER, size: 22, color: WARN, bold: true })]),
        cell([p(String(s.nein), { align: AlignmentType.CENTER, size: 22, color: CRIT, bold: true })]),
        cell([p(String(s.na), { align: AlignmentType.CENTER, size: 22, color: MUTED })]),
        cell([p(s.compliancePct + "%", { align: AlignmentType.CENTER, size: 22, color: COPPER, bold: true })]),
      ],
    });
  });
  const widths = [2600, 900, 900, 1050, 1200, 800, 1200];
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    borders: {
      top: border, bottom: border, left: border, right: border,
      insideHorizontal: border, insideVertical: border,
    },
    rows: [headerRow, ...rows],
  });
}

function criticalityBlock(inp: BuildGapReportInput, de: boolean): (Paragraph | Table)[] {
  const ctx = buildCriticalityContext(inp.inventory);
  if (ctx.totalServices === 0 && ctx.totalAssets === 0) return [];
  const out: (Paragraph | Table)[] = [];
  out.push(p(de ? "Kritikalitätskontext (aus Phase 2)" : "Criticality Context (from Phase 2)",
    { heading: HeadingLevel.HEADING_1, bold: true, size: 28, color: NAVY, spacing: { before: 300, after: 120 } }));

  const kpis: Array<{ label: string; value: string; color: string }> = [
    { label: de ? "Kritische Dienste" : "Critical services",
      value: `${ctx.criticalServiceCount} / ${ctx.totalServices}`,
      color: ctx.criticalServiceCount > 0 ? CRIT : NAVY },
    { label: de ? "Hoch-krit. Assets" : "High-criticality assets",
      value: `${ctx.highCriticalityAssetCount} / ${ctx.totalAssets}`,
      color: ctx.highCriticalityAssetCount > 0 ? COPPER : NAVY },
    { label: de ? "SPOF in Abhängigkeiten" : "SPOFs in dependencies",
      value: String(ctx.spofCount),
      color: ctx.spofCount > 0 ? CRIT : NAVY },
  ];
  const headerRow = new TableRow({
    children: kpis.map(k => cell([p(k.label, { bold: true, size: 18, color: "FFFFFF" })], { fill: NAVY })),
  });
  const valueRow = new TableRow({
    children: kpis.map(k => cell([p(k.value, { bold: true, size: 32, color: k.color, align: AlignmentType.CENTER })], { fill: SURFACE })),
  });
  const widths = [3120, 3120, 3120];
  out.push(new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: [headerRow, valueRow],
  }));
  out.push(p(
    de
      ? "Die folgende Priorisierung gewichtet jede offene Lücke mit der Anzahl betroffener kritischer Dienste und identifizierter Single-Points-of-Failure."
      : "The priority list below weights each open gap by the number of critical services affected and identified single points of failure.",
    { size: 20, color: MUTED, italics: true, spacing: { before: 120, after: 120 } }));
  return out;
}

function narrativeBlock(inp: BuildGapReportInput, de: boolean): Paragraph[] {
  const gaps = collectOpenGaps(inp.frameworks);
  const agg = aggregateGaps(gaps);
  const ctx = buildCriticalityContext(inp.inventory);
  const paras = buildExecutiveNarrative(agg, ctx, inp.frameworks.map(pf => pf.framework), de);
  if (paras.length === 0) return [];
  const out: Paragraph[] = [];
  out.push(p(de ? "Management Narrative" : "Management Narrative",
    { heading: HeadingLevel.HEADING_1, bold: true, size: 28, color: NAVY, spacing: { before: 300, after: 120 } }));
  for (const para of paras) {
    out.push(new Paragraph({
      spacing: { after: 140, line: 320 },
      children: [txt(para, { size: 22, color: "2D3748" })],
    }));
  }
  return out;
}

function priorityBlock(inp: BuildGapReportInput, de: boolean): (Paragraph | Table)[] {
  const gaps = collectOpenGaps(inp.frameworks);
  const ctx = buildCriticalityContext(inp.inventory);
  const items = criticalityWeightedPriority(gaps, ctx, de, 20);
  if (items.length === 0) return [];
  const out: (Paragraph | Table)[] = [];
  out.push(p(de ? "Kritikalitäts-gewichtete Priorität (Top 20)" : "Criticality-Weighted Priority (Top 20)",
    { heading: HeadingLevel.HEADING_1, bold: true, size: 28, color: NAVY, spacing: { before: 300, after: 120 } }));
  const header = new TableRow({
    tableHeader: true,
    children: [
      cell([p("#", { bold: true, size: 18, color: "FFFFFF", align: AlignmentType.CENTER })], { fill: NAVY }),
      cell([p("ID", { bold: true, size: 18, color: "FFFFFF" })], { fill: NAVY }),
      cell([p(de ? "Capability" : "Capability", { bold: true, size: 18, color: "FFFFFF" })], { fill: NAVY }),
      cell([p(de ? "Anforderung / Treiber" : "Requirement / Drivers", { bold: true, size: 18, color: "FFFFFF" })], { fill: NAVY }),
      cell([p("Score", { bold: true, size: 18, color: "FFFFFF", align: AlignmentType.CENTER })], { fill: NAVY }),
    ],
  });
  const rows = items.map((it, i) => {
    const req = (de ? it.gap.ctrl.req_de : it.gap.ctrl.req_en) || it.gap.ctrl.req_de || it.gap.ctrl.req_en || "";
    const trimmed = req.length > 200 ? req.slice(0, 197) + "…" : req;
    const reqParas: Paragraph[] = [
      new Paragraph({
        children: [
          txt(trimmed, { size: 20 }),
          ...(it.gap.muss ? [txt("  MUSS", { size: 16, bold: true, color: CRIT })] : []),
        ],
      }),
    ];
    if (it.drivers.length > 0) {
      reqParas.push(new Paragraph({
        spacing: { before: 40 },
        children: [txt(it.drivers.join(" · "), { size: 16, italics: true, color: MUTED })],
      }));
    }
    return new TableRow({
      children: [
        cell([p(String(i + 1), { size: 20, bold: true, color: MUTED, align: AlignmentType.CENTER })]),
        cell([p(it.gap.ctrl.id, { size: 18, bold: true, color: NAVY })], { fill: SURFACE }),
        cell([p(humanCap(it.gap.cap, de), { size: 18, bold: true, color: NAVY })]),
        cell(reqParas),
        cell([p(it.score.toFixed(1), { size: 22, bold: true, color: COPPER, align: AlignmentType.CENTER })]),
      ],
    });
  });
  const widths = [500, 1300, 1800, 5100, 900];
  out.push(new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: [header, ...rows],
  }));
  return out;
}

function timelineBlock(inp: BuildGapReportInput, de: boolean): (Paragraph | Table)[] {
  const gaps = collectOpenGaps(inp.frameworks);
  const agg = aggregateGaps(gaps);
  const steps = buildNextSteps(agg, inp.frameworks.map(pf => pf.framework), de);
  if (steps.length === 0) return [];
  const buckets: Record<number, typeof steps> = { 30: [], 90: [], 180: [], 365: [] };
  for (const s of steps) buckets[s.bucket].push(s);

  const out: (Paragraph | Table)[] = [];
  out.push(p(de ? "Nächste Schritte — Zeitplan" : "Next Steps — Timeline",
    { heading: HeadingLevel.HEADING_1, bold: true, size: 28, color: NAVY, spacing: { before: 300, after: 120 } }));

  for (const b of [30, 90, 180, 365] as const) {
    if (buckets[b].length === 0) continue;
    const label = de ? BUCKET_LABEL[b].de : BUCKET_LABEL[b].en;
    out.push(p(label, { heading: HeadingLevel.HEADING_2, bold: true, size: 22, color: COPPER, spacing: { before: 200, after: 80 } }));
    for (const s of buckets[b]) {
      out.push(new Paragraph({
        spacing: { before: 60 },
        children: [
          txt(humanCap(s.cap, de), { size: 22, bold: true, color: NAVY }),
          txt(`   ${s.gapCount} ${de ? "Lücken" : "gaps"}${s.mustCount > 0 ? ` · ${s.mustCount} MUSS` : ""}`, { size: 18, color: MUTED }),
          ...(s.articles.length > 0
            ? [txt(`   [${s.articles.slice(0, 3).join(", ")}]`, { size: 16, color: NAVY, italics: true })]
            : []),
        ],
      }));
      out.push(new Paragraph({
        spacing: { after: 100, line: 300 },
        children: [txt(s.recommendation, { size: 20, color: "2D3748" })],
      }));
    }
  }
  return out;
}

function frameworkSection(pf: BuildGapReportInput["frameworks"][number], de: boolean): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  const label = FW_LABELS[pf.framework] ?? pf.framework;
  const s = computeStats(pf.controls, pf.effective);
  const scopedFwList = [pf.framework];

  out.push(p(label, { heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 120 }, color: NAVY, bold: true, size: 30 }));
  out.push(new Paragraph({
    spacing: { after: 160 },
    children: [
      txt(`${de ? "Compliance" : "Compliance"}: `, { size: 22, color: MUTED }),
      txt(s.compliancePct + "%   ", { size: 22, bold: true, color: COPPER }),
      txt(`${s.total} ${de ? "Kontrollen" : "controls"}  ·  `, { size: 22, color: MUTED }),
      txt(`${s.ja} ${de ? "erfüllt" : "met"}  ·  `, { size: 22, color: LOW }),
      txt(`${s.teilweise} ${de ? "teilweise" : "partial"}  ·  `, { size: 22, color: WARN }),
      txt(`${s.nein} ${de ? "nicht erfüllt" : "not met"}  ·  `, { size: 22, color: CRIT }),
      txt(`${s.na} N/A`, { size: 22, color: MUTED }),
    ],
  }));

  const gaps: { fam: { id: string; label: string }; ctrl: ControlRow; eff: EffectiveAnswer | undefined }[] = [];
  for (const c of pf.controls) {
    const e = pf.effective.get(c.id);
    const st = e?.status ?? null;
    if (st === "ja" || st === "na") continue;
    gaps.push({ fam: familyOf(c, de), ctrl: c, eff: e });
  }
  const rank = (st: string | null) => st === "nein" ? 0 : st === "teilweise" ? 1 : 2;
  gaps.sort((a, b) => {
    const ra = rank(a.eff?.status ?? null), rb = rank(b.eff?.status ?? null);
    if (ra !== rb) return ra - rb;
    const ma = a.ctrl.muss === "true" ? 0 : 1, mb = b.ctrl.muss === "true" ? 0 : 1;
    if (ma !== mb) return ma - mb;
    return a.fam.label.localeCompare(b.fam.label);
  });

  if (gaps.length === 0) {
    out.push(p(de ? "Keine offenen Lücken – alle Kontrollen sind erfüllt oder als N/A markiert." : "No open gaps – all controls are met or marked N/A.", { size: 22, italics: true, color: MUTED, spacing: { after: 200 } }));
    return out;
  }

  const groups = new Map<string, typeof gaps>();
  for (const g of gaps) {
    if (!groups.has(g.fam.id)) groups.set(g.fam.id, []);
    groups.get(g.fam.id)!.push(g);
  }

  out.push(p(de ? "Offene Punkte" : "Open items", { heading: HeadingLevel.HEADING_2, size: 26, color: NAVY, bold: true, spacing: { before: 200, after: 100 } }));

  for (const [, items] of groups) {
    out.push(p(items[0].fam.label + `  (${items.length})`, { heading: HeadingLevel.HEADING_3, size: 24, color: NAVY, bold: true, spacing: { before: 200, after: 80 } }));

    const header = new TableRow({
      tableHeader: true,
      children: [
        cell([p("ID", { bold: true, size: 18, color: "FFFFFF" })], { fill: NAVY }),
        cell([p(de ? "Anforderung" : "Requirement", { bold: true, size: 18, color: "FFFFFF" })], { fill: NAVY }),
        cell([p(de ? "Capability / Anker" : "Capability / anchor", { bold: true, size: 18, color: "FFFFFF" })], { fill: NAVY }),
        cell([p("Status", { bold: true, size: 18, color: "FFFFFF", align: AlignmentType.CENTER })], { fill: NAVY }),
      ],
    });
    const rows = items.slice(0, 80).map((it) => {
      const sl = statusLabel(it.eff?.status ?? null, de);
      const req = (de ? it.ctrl.req_de : it.ctrl.req_en) || it.ctrl.req_de || it.ctrl.req_en || "";
      const cap = capabilityFor(it.ctrl);
      const articles = scopedArticles(cap, scopedFwList);

      const reqParas: Paragraph[] = [
        new Paragraph({
          children: [
            txt(req, { size: 20 }),
            ...(it.ctrl.muss === "true" ? [txt("  MUSS", { size: 16, bold: true, color: CRIT })] : []),
          ],
        }),
        new Paragraph({
          spacing: { before: 60 },
          children: [
            txt(`${de ? "Empfehlung" : "Recommendation"}: `, { size: 18, bold: true, color: NAVY }),
            txt(recommendationFor(cap, de), { size: 18, color: "2D3748" }),
          ],
        }),
      ];
      if (it.eff?.note) reqParas.push(new Paragraph({ spacing: { before: 40 }, children: [txt((de ? "Notiz: " : "Note: "), { bold: true, size: 18, color: MUTED }), txt(it.eff.note, { size: 18, color: MUTED })] }));
      if (it.eff?.origin === "inherited") reqParas.push(new Paragraph({ spacing: { before: 40 }, children: [txt((de ? "abgeleitet aus Kontroll-Knoten: " : "inherited from control node: ") + (it.eff.inheritedFrom ?? []).slice(0, 3).join(", "), { size: 16, italics: true, color: MUTED })] }));

      const capParas: Paragraph[] = [
        p(humanCap(cap, de), { size: 18, bold: true, color: NAVY }),
      ];
      if (articles.length > 0) {
        capParas.push(new Paragraph({
          spacing: { before: 40 },
          children: [txt(articles.join(", "), { size: 16, color: NAVY })],
        }));
      }

      return new TableRow({
        children: [
          cell([p(it.ctrl.id, { size: 18, bold: true, color: NAVY })], { fill: SURFACE }),
          cell(reqParas),
          cell(capParas, { fill: SOFT_BLUE }),
          cell([p(sl.text, { size: 18, bold: true, color: sl.color, align: AlignmentType.CENTER })]),
        ],
      });
    });
    const widths = [1200, 5400, 2000, 1000];
    out.push(new Table({
      width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
      columnWidths: widths,
      borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
      rows: [header, ...rows],
    }));
    if (items.length > 80) {
      out.push(p(`… ${items.length - 80} ${de ? "weitere in dieser Gruppe" : "more in this group"}`, { size: 18, italics: true, color: MUTED, spacing: { before: 80, after: 100 } }));
    }
  }
  return out;
}

export async function exportGapReportDocx(inp: BuildGapReportInput): Promise<void> {
  const de = inp.de;
  const brand = getCompanyBrand();
  const brandName = brand.companyName || getReportBrandName(de ? "de" : "en");
  const dateStr = new Date().toLocaleDateString(de ? "de-DE" : "en-GB", { year: "numeric", month: "long", day: "2-digit" });

  const children: (Paragraph | Table)[] = [];

  // Cover
  children.push(new Paragraph({
    alignment: AlignmentType.LEFT, spacing: { after: 60 },
    children: [txt(de ? "BEWERTUNG · GAP ANALYSE" : "ASSESSMENT · GAP ANALYSIS", { bold: true, size: 20, color: COPPER })],
  }));
  children.push(p(de ? "Gap-Analyse Bericht" : "Gap Analysis Report", { bold: true, size: 44, color: NAVY, spacing: { after: 80 } }));
  children.push(p(brandName, { bold: true, size: 28, color: NAVY, spacing: { after: 40 } }));
  children.push(new Paragraph({
    spacing: { after: 300 },
    children: [
      txt(dateStr + "   ·   ", { size: 22, color: MUTED }),
      txt(`${inp.frameworks.length} ${inp.frameworks.length === 1 ? "Framework" : "Frameworks"}`, { size: 22, color: MUTED }),
      ...(inp.authorName ? [txt("   ·   " + (de ? "Bericht erstellt von" : "Report prepared by") + ": " + inp.authorName, { size: 22, color: MUTED })] : []),
    ],
  }));

  // Executive summary
  children.push(p(de ? "Zusammenfassung" : "Executive Summary", { heading: HeadingLevel.HEADING_1, bold: true, size: 30, color: NAVY, spacing: { before: 100, after: 160 } }));
  children.push(summaryTable(inp, de));

  // Enriched blocks (parity with PDF)
  children.push(...criticalityBlock(inp, de));
  children.push(...narrativeBlock(inp, de));
  children.push(...priorityBlock(inp, de));
  children.push(...timelineBlock(inp, de));

  // Per-framework detail
  for (const pf of inp.frameworks) {
    children.push(...frameworkSection(pf, de));
  }

  // Classification footer (once, at end)
  const stamp = (inp.classification ?? "").trim();
  if (stamp) {
    children.push(new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 400 },
      children: [txt(stamp, { size: 18, italics: true, color: MUTED })],
    }));
  }

  const doc = new Document({
    creator: brandName,
    title: (de ? "Gap-Analyse – " : "Gap Analysis – ") + brandName,
    styles: {
      default: { document: { run: { font: FONT, size: 22 } } },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [txt(brandName, { size: 16, color: MUTED })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              txt(`${brandName} · ${de ? "Vertraulich" : "Confidential"} · ${de ? "Seite" : "Page"} `, { size: 16, color: MUTED }),
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

  const buf = await Packer.toBlob(doc);
  const slug = (brand.companyName || "gap-analyse").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const stampDate = new Date().toISOString().slice(0, 10);
  saveAs(buf, `${slug}-gap-analyse-${stampDate}.docx`);
}
