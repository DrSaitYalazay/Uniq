/**
 * Training Report — Step 14 (Schulung tab)
 * Premium Navy & Copper theme. PDF (HTML→PDF render) + Word (docx).
 * Includes: cover, KPI grid, Pie + Radar (inline SVG for HTML/PDF),
 * category-level completion table.
 * Supports excludedTopicIds — affects both charts and tables.
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  HeadingLevel, PageNumber,
} from "docx";
import { RT, RT_FONT } from "./reportTheme";
import { exportBrandedXlsx } from "@/lib/reportXlsxKit";
import { reportGlobalCss, buildCoverHtml, buildKpiGrid, esc, renderHtmlToPdf } from "./reportHtmlLayout";
import { getReportBrandName, getReportBrandSlug } from "@/lib/reportBrand";

interface TrainingTopic {
  id: string;
  titleDe: string;
  titleEn: string;
  mandatory: boolean;
}
interface TrainingCategory {
  id: string;
  titleDe: string;
  titleEn: string;
  topics: TrainingTopic[];
}
type Completions = Record<string, { completed: boolean; completionDate?: string }>;
type Lang = "de" | "en";

interface Aggregated {
  totalTopics: number;
  completed: number;
  mandatoryTotal: number;
  mandatoryDone: number;
  optionalTotal: number;
  optionalDone: number;
  progress: number;
  byCategory: { name: string; total: number; done: number; mandatory: number; mandatoryDone: number; pct: number }[];
}

function aggregate(categories: TrainingCategory[], completions: Completions, excluded: Set<string>, lang: Lang): Aggregated {
  const de = lang === "de";
  let totalTopics = 0, completed = 0, mandatoryTotal = 0, mandatoryDone = 0;
  const byCategory: Aggregated["byCategory"] = [];

  for (const cat of categories) {
    const incl = cat.topics.filter(t => !excluded.has(t.id));
    if (incl.length === 0) continue;
    let done = 0, mand = 0, mandDone = 0;
    for (const t of incl) {
      totalTopics++;
      const isDone = !!completions[t.id]?.completed;
      if (isDone) { completed++; done++; }
      if (t.mandatory) {
        mandatoryTotal++;
        mand++;
        if (isDone) { mandatoryDone++; mandDone++; }
      }
    }
    byCategory.push({
      name: de ? cat.titleDe : cat.titleEn,
      total: incl.length, done, mandatory: mand, mandatoryDone: mandDone,
      pct: incl.length ? Math.round((done / incl.length) * 100) : 0,
    });
  }

  const optionalTotal = totalTopics - mandatoryTotal;
  const optionalDone = completed - mandatoryDone;
  const progress = totalTopics ? Math.round((completed / totalTopics) * 100) : 0;

  return { totalTopics, completed, mandatoryTotal, mandatoryDone, optionalTotal, optionalDone, progress, byCategory };
}

// ── SVG charts ──

function svgPie(data: { label: string; value: number; color: string }[], size = 220, lang: Lang = "de"): string {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border:1px dashed ${RT.border};border-radius:50%;color:${RT.muted};font-size:11px;">${lang === "de" ? "Keine Daten" : "No data"}</div>`;
  }
  const cx = size / 2, cy = size / 2;
  const rOuter = size * 0.45;
  const rInner = size * 0.27;
  let acc = 0;
  const paths = data.map(d => {
    const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += d.value;
    const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = cx + rOuter * Math.cos(start), y1 = cy + rOuter * Math.sin(start);
    const x2 = cx + rOuter * Math.cos(end),   y2 = cy + rOuter * Math.sin(end);
    const x3 = cx + rInner * Math.cos(end),   y3 = cy + rInner * Math.sin(end);
    const x4 = cx + rInner * Math.cos(start), y4 = cy + rInner * Math.sin(start);
    return `<path d="M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z" fill="${d.color}" />`;
  }).join("");
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
}

function svgRadar(data: { label: string; pct: number }[], size = 320, lang: Lang = "de"): string {
  if (data.length < 3) {
    return `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size * 0.7}px;border:1px dashed ${RT.border};border-radius:8px;color:${RT.muted};font-size:11px;">${lang === "de" ? "Mindestens 3 Kategorien für Radar" : "Min. 3 categories for radar"}</div>`;
  }
  const cx = size / 2, cy = size / 2;
  const r = size * 0.36;
  const n = data.length;
  const angle = (i: number) => (i / n) * Math.PI * 2 - Math.PI / 2;

  const grid = [0.25, 0.5, 0.75, 1].map(g => {
    const pts = Array.from({ length: n }, (_, i) => {
      const a = angle(i);
      return `${cx + r * g * Math.cos(a)},${cy + r * g * Math.sin(a)}`;
    }).join(" ");
    return `<polygon points="${pts}" fill="none" stroke="${RT.border}" stroke-width="0.8" />`;
  }).join("");

  const axes = data.map((_, i) => {
    const a = angle(i);
    return `<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(a)}" y2="${cy + r * Math.sin(a)}" stroke="${RT.border}" stroke-width="0.5" stroke-dasharray="2,2" />`;
  }).join("");

  const dataPts = data.map((d, i) => {
    const a = angle(i);
    const v = Math.max(0, Math.min(100, d.pct)) / 100;
    return `${cx + r * v * Math.cos(a)},${cy + r * v * Math.sin(a)}`;
  }).join(" ");

  const labels = data.map((d, i) => {
    const a = angle(i);
    const lr = r + 14;
    const x = cx + lr * Math.cos(a);
    const y = cy + lr * Math.sin(a);
    const anchor = Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
    const short = d.label.length > 18 ? d.label.slice(0, 17) + "…" : d.label;
    return `<text x="${x}" y="${y}" font-size="10" fill="${RT.body}" text-anchor="${anchor}" dominant-baseline="middle" font-weight="600">${esc(short)} ${d.pct}%</text>`;
  }).join("");

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    ${grid}${axes}
    <polygon points="${dataPts}" fill="${RT.navy}" fill-opacity="0.22" stroke="${RT.navy}" stroke-width="2" />
    ${labels}
  </svg>`;
}

function buildHtmlBody(agg: Aggregated, excludedCount: number, lang: Lang, companyName: string): string {
  const de = lang === "de";
  const dateStr = new Date().toLocaleDateString(de ? "de-DE" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric" });

  const pieData = [
    { label: de ? "Pflicht abgeschlossen" : "Mandatory done", value: agg.mandatoryDone, color: RT.low },
    { label: de ? "Pflicht offen" : "Mandatory open", value: agg.mandatoryTotal - agg.mandatoryDone, color: RT.critical },
    { label: de ? "Optional abgeschlossen" : "Optional done", value: agg.optionalDone, color: RT.copper },
    { label: de ? "Optional offen" : "Optional open", value: Math.max(0, agg.optionalTotal - agg.optionalDone), color: RT.muted },
  ].filter(d => d.value > 0);

  const radarData = agg.byCategory.map(c => ({ label: c.name, pct: c.pct }));

  const cover = buildCoverHtml({
    badge: de ? "Schulung" : "Training",
    title: de ? "Schulungs-Statusbericht" : "Training Status Report",
    subtitle: de ? "Fortschritt, Pflichtschulungen und Abdeckung nach Kategorie" : "Progress, mandatory trainings and coverage per category",
    companyName, authorName: "", dateStr,
  });

  const kpis = buildKpiGrid([
    { label: de ? "Themen" : "Topics", value: agg.totalTopics },
    { label: de ? "Abgeschlossen" : "Completed", value: agg.completed, variant: "accent" },
    { label: de ? "Pflicht" : "Mandatory", value: `${agg.mandatoryDone}/${agg.mandatoryTotal}` },
    { label: de ? "Fortschritt" : "Progress", value: `${agg.progress}%`, variant: "accent" },
  ]);

  const exclNote = excludedCount > 0
    ? `<div class="rt-note"><strong>${de ? "Hinweis" : "Note"}</strong><p>${de
        ? `${excludedCount} Themen wurden vom Bericht ausgeschlossen. Kennzahlen, Diagramme und Tabellen beziehen sich nur auf die einbezogenen Themen.`
        : `${excludedCount} topics were excluded from this report. Metrics, charts and tables reflect only included topics.`}</p></div>`
    : "";

  const charts = `
    <div style="display:flex;gap:24px;align-items:center;justify-content:space-between;margin:18px 0;flex-wrap:wrap;">
      <div style="flex:0 0 240px;text-align:center;">
        <div style="position:relative;display:inline-block;">
          ${svgPie(pieData, 220, lang)}
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <div style="font-size:26px;font-weight:700;color:${RT.navy};line-height:1;">${agg.progress}%</div>
            <div style="font-size:9px;color:${RT.muted};letter-spacing:1px;text-transform:uppercase;margin-top:2px;">${de ? "Fortschritt" : "Progress"}</div>
          </div>
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          ${pieData.map(d => `<span style="font-size:9px;color:${RT.body};display:inline-flex;align-items:center;gap:4px;"><span style="display:inline-block;width:9px;height:9px;background:${d.color};border-radius:2px;"></span>${esc(d.label)}: <strong>${d.value}</strong></span>`).join("")}
        </div>
      </div>
      <div style="flex:1;min-width:340px;text-align:center;">
        ${svgRadar(radarData, 340, lang)}
      </div>
    </div>
  `;

  const catRows = agg.byCategory.map(c => {
    const color = c.pct >= 70 ? RT.low : c.pct >= 40 ? RT.medium : RT.critical;
    return `<tr>
      <td>${esc(c.name)}</td>
      <td style="text-align:center;">${c.total}</td>
      <td style="text-align:center;color:${RT.low};font-weight:600;">${c.done}</td>
      <td style="text-align:center;">${c.mandatoryDone}/${c.mandatory}</td>
      <td style="text-align:right;color:${color};font-weight:700;">${c.pct}%</td>
    </tr>`;
  }).join("");

  return `
    ${cover}
    ${exclNote}
    <h2>${de ? "Kennzahlen" : "Key Metrics"}</h2>
    ${kpis}

    <h2>${de ? "Status & Abdeckung" : "Status & Coverage"}</h2>
    ${charts}

    <h2>${de ? "Abdeckung nach Kategorie" : "Coverage by Category"}</h2>
    <table>
      <thead><tr>
        <th>${de ? "Kategorie" : "Category"}</th>
        <th style="text-align:center;">${de ? "Gesamt" : "Total"}</th>
        <th style="text-align:center;">${de ? "Abgeschlossen" : "Completed"}</th>
        <th style="text-align:center;">${de ? "Pflicht" : "Mandatory"}</th>
        <th style="text-align:right;">${de ? "Abschluss" : "Completion"}</th>
      </tr></thead>
      <tbody>${catRows}</tbody>
    </table>
  `;
}

export async function generateTrainingPDF(
  categories: TrainingCategory[],
  completions: Completions,
  excluded: string[],
  lang: Lang,
  companyName: string,
): Promise<void> {
  const exclSet = new Set(excluded);
  const agg = aggregate(categories, completions, exclSet, lang);
  const body = buildHtmlBody(agg, exclSet.size, lang, companyName);
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>Training Report</title>${reportGlobalCss}</head><body>${body}</body></html>`;
  const filename = `${(companyName || "Ihr Unternehmen").replace(/\s+/g, "_")}_Training_${new Date().toISOString().slice(0, 10)}.pdf`;
  await renderHtmlToPdf(html, filename);
}

// ── Word ──

const cellPad = { top: 80, bottom: 80, left: 120, right: 120 };
const navyHex = RT.navy.replace("#", "");
const copperHex = RT.copper.replace("#", "");
const borderHex = RT.border.replace("#", "");
const surfaceHex = RT.surfaceAlt.replace("#", "");

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: borderHex };
const allBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function headerRow(cells: string[], widths: number[]): TableRow {
  return new TableRow({
    tableHeader: true,
    children: cells.map((t, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: navyHex, type: ShadingType.CLEAR, color: "auto" },
      borders: allBorders,
      margins: cellPad,
      children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: "FFFFFF", size: 18 })] })],
    })),
  });
}

export async function generateTrainingWord(
  categories: TrainingCategory[],
  completions: Completions,
  excluded: string[],
  lang: Lang,
  companyName: string,
): Promise<void> {
  const de = lang === "de";
  const exclSet = new Set(excluded);
  const agg = aggregate(categories, completions, exclSet, lang);
  const dateStr = new Date().toLocaleDateString(de ? "de-DE" : "en-US");

  const kpiTable = new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [2256, 2256, 2256, 2258],
    rows: [
      new TableRow({
        children: [
          { l: de ? "Themen" : "Topics", v: String(agg.totalTopics) },
          { l: de ? "Abgeschlossen" : "Completed", v: String(agg.completed) },
          { l: de ? "Pflicht" : "Mandatory", v: `${agg.mandatoryDone}/${agg.mandatoryTotal}` },
          { l: de ? "Fortschritt" : "Progress", v: `${agg.progress}%` },
        ].map((k, i) => new TableCell({
          width: { size: i === 3 ? 2258 : 2256, type: WidthType.DXA },
          shading: { fill: surfaceHex, type: ShadingType.CLEAR, color: "auto" },
          borders: allBorders,
          margins: cellPad,
          children: [
            new Paragraph({ children: [new TextRun({ text: k.v, bold: true, size: 36, color: navyHex })] }),
            new Paragraph({ children: [new TextRun({ text: k.l, size: 16, color: "718096" })] }),
          ],
        })),
      }),
    ],
  });

  // Status bars (pseudo pie)
  const distRows: TableRow[] = [
    headerRow([de ? "Status" : "Status", de ? "Anzahl" : "Count", de ? "Anteil" : "Share", ""], [2200, 1200, 1200, 4426]),
  ];
  const items = [
    { label: de ? "Pflicht abgeschlossen" : "Mandatory done", value: agg.mandatoryDone, color: RT.low.replace("#", "") },
    { label: de ? "Pflicht offen" : "Mandatory open", value: agg.mandatoryTotal - agg.mandatoryDone, color: RT.critical.replace("#", "") },
    { label: de ? "Optional abgeschlossen" : "Optional done", value: agg.optionalDone, color: copperHex },
    { label: de ? "Optional offen" : "Optional open", value: Math.max(0, agg.optionalTotal - agg.optionalDone), color: "718096" },
  ];
  for (const s of items) {
    const pct = agg.totalTopics ? Math.round((s.value / agg.totalTopics) * 100) : 0;
    const filled = Math.round(pct / 5);
    const bar = "█".repeat(filled) + "░".repeat(20 - filled);
    distRows.push(new TableRow({
      children: [
        new TableCell({ width: { size: 2200, type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ children: [new TextRun({ text: s.label, bold: true, size: 16, color: s.color })] })] }),
        new TableCell({ width: { size: 1200, type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(s.value), size: 18 })] })] }),
        new TableCell({ width: { size: 1200, type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${pct}%`, size: 18, bold: true })] })] }),
        new TableCell({ width: { size: 4426, type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ children: [new TextRun({ text: bar, size: 16, font: "Consolas", color: s.color })] })] }),
      ],
    }));
  }
  const distTable = new Table({ width: { size: 9026, type: WidthType.DXA }, columnWidths: [2200, 1200, 1200, 4426], rows: distRows });

  // Category table
  const catWidths = [3500, 1200, 1500, 1500, 1326];
  const catRows: TableRow[] = [
    headerRow([
      de ? "Kategorie" : "Category",
      de ? "Gesamt" : "Total",
      de ? "Abgeschlossen" : "Completed",
      de ? "Pflicht" : "Mandatory",
      de ? "Abschluss" : "Completion",
    ], catWidths),
  ];
  for (const c of agg.byCategory) {
    const color = c.pct >= 70 ? RT.low.replace("#", "") : c.pct >= 40 ? RT.medium.replace("#", "") : RT.critical.replace("#", "");
    catRows.push(new TableRow({
      children: [
        new TableCell({ width: { size: catWidths[0], type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ children: [new TextRun({ text: c.name, size: 18 })] })] }),
        new TableCell({ width: { size: catWidths[1], type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(c.total), size: 18 })] })] }),
        new TableCell({ width: { size: catWidths[2], type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(c.done), size: 18, bold: true, color: RT.low.replace("#", "") })] })] }),
        new TableCell({ width: { size: catWidths[3], type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${c.mandatoryDone}/${c.mandatory}`, size: 18 })] })] }),
        new TableCell({ width: { size: catWidths[4], type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${c.pct}%`, size: 18, bold: true, color })] })] }),
      ],
    }));
  }
  const catTable = new Table({ width: { size: 9026, type: WidthType.DXA }, columnWidths: catWidths, rows: catRows });

  const exclNote = exclSet.size > 0
    ? new Paragraph({
        spacing: { before: 100, after: 200 },
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: copperHex, space: 8 } },
        children: [new TextRun({
          text: de
            ? `Hinweis: ${exclSet.size} Themen wurden vom Bericht ausgeschlossen. Kennzahlen, Diagramme und Tabellen beziehen sich nur auf die einbezogenen Themen.`
            : `Note: ${exclSet.size} topics were excluded from this report. Metrics, charts and tables reflect only included topics.`,
          italics: true, size: 18, color: "92400E",
        })],
      })
    : null;

  const doc = new Document({
    creator: getReportBrandName(de),
    title: de ? "Schulungs-Statusbericht" : "Training Status Report",
    styles: {
      default: { document: { run: { font: RT_FONT.word, size: 20 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 36, bold: true, color: navyHex, font: RT_FONT.word },
          paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, color: navyHex, font: RT_FONT.word },
          paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
      ],
    },
    sections: [{
      properties: { page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
      headers: {
        default: new Header({ children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: companyName ? `${companyName} · ${de ? "Schulung" : "Training"}` : (de ? "Schulungs-Bericht" : "Training Report"), size: 16, color: "718096" })],
        })] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: `${getReportBrandName(de)} ·  `, size: 14, color: "718096" }),
            new TextRun({ text: dateStr, size: 14, color: "718096" }),
            new TextRun({ text: " · ", size: 14, color: "718096" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "718096" }),
            new TextRun({ text: " / ", size: 14, color: "718096" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: "718096" }),
          ],
        })] }),
      },
      children: [
        new Paragraph({ spacing: { after: 60 },
          children: [new TextRun({ text: de ? "SCHRITT 14 — SCHULUNG" : "STEP 14 — TRAINING", bold: true, color: copperHex, size: 18 })] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: de ? "Schulungs-Statusbericht" : "Training Status Report", bold: true, color: navyHex, size: 44 })] }),
        new Paragraph({ spacing: { after: 200 },
          children: [new TextRun({ text: de ? "Fortschritt, Pflichtschulungen und Abdeckung nach Kategorie." : "Progress, mandatory trainings and coverage per category.", size: 22, color: "4A5568" })] }),
        new Paragraph({ spacing: { after: 200 },
          children: [
            ...(companyName ? [new TextRun({ text: companyName, bold: true, size: 20 }), new TextRun({ text: "  ·  ", size: 18, color: "718096" })] : []),
            new TextRun({ text: dateStr, size: 18, color: "718096" }),
          ],
        }),
        ...(exclNote ? [exclNote] : []),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: de ? "Kennzahlen" : "Key Metrics", bold: true })] }),
        kpiTable,

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: de ? "Status-Verteilung" : "Status Distribution", bold: true })] }),
        distTable,

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: de ? "Abdeckung nach Kategorie" : "Coverage by Category", bold: true })] }),
        catTable,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(companyName || "Ihr Unternehmen").replace(/\s+/g, "_")}_Training_${new Date().toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Schulungen als Excel — Teilnahme- und Abschlussliste, filterbar. */
export async function generateTrainingExcel(input: any, lang: Lang = "de") {
  const de = lang === "de";
  const topics: any[] = input?.topics ?? input?.themes ?? [];
  const people: any[] = input?.participants ?? input?.people ?? [];
  await exportBrandedXlsx({
    fileBase: de ? "Schulungen" : "Trainings",
    title: de ? "Schulungs- und Sensibilisierungsnachweis" : "Training and awareness record",
    lang,
    scope: de ? `${topics.length} Themen · ${people.length} Personen` : `${topics.length} topics · ${people.length} people`,
    sheets: [
      {
        name: de ? "Themen" : "Topics",
        statusKey: "status",
        columns: [
          { header: "ID", key: "id", width: 16 },
          { header: de ? "Thema" : "Topic", key: "t", width: 48 },
          { header: de ? "Pflicht" : "Mandatory", key: "m", width: 12 },
          { header: de ? "Turnus" : "Cycle", key: "c", width: 16 },
          { header: de ? "Abschlussquote" : "Completion rate", key: "q", width: 16, kind: "num" },
          { header: de ? "Status" : "Status", key: "status", width: 16 },
        ],
        rows: topics.map((t: any) => ({
          id: t.id ?? t.key ?? "",
          t: de ? (t.title ?? t.name ?? "") : (t.titleEn ?? t.title ?? t.name ?? ""),
          m: t.mandatory ? (de ? "Ja" : "Yes") : "",
          c: t.cycle ?? t.turnus ?? "",
          q: t.completionRate ?? t.quote ?? "",
          status: t.status ?? "",
        })),
      },
      {
        name: de ? "Personen" : "People",
        statusKey: "status",
        columns: [
          { header: de ? "Person" : "Person", key: "p", width: 28 },
          { header: de ? "Rolle" : "Role", key: "r", width: 24 },
          { header: de ? "Thema" : "Topic", key: "t", width: 40 },
          { header: de ? "Abgeschlossen am" : "Completed on", key: "d", width: 16 },
          { header: de ? "Status" : "Status", key: "status", width: 16 },
        ],
        rows: people.flatMap((pp: any) => (pp.topics ?? [{}]).map((tt: any) => ({
          p: pp.name ?? "", r: pp.role ?? "",
          t: tt.title ?? tt.topic ?? "",
          d: tt.completedAt ?? tt.date ?? "",
          status: tt.status ?? (tt.completedAt ? (de ? "Abgeschlossen" : "Completed") : (de ? "Offen" : "Open")),
        }))),
      },
    ],
  });
}
