/**
 * Policy Overview Report — Step 14 (Policies tab)
 * Premium Navy & Copper theme. PDF (HTML→PDF render) + Word (docx).
 * Includes: cover, KPI grid, Pie + Radar (inline SVG for HTML/PDF),
 * category coverage table, full policy list table.
 * Supports excludedPolicyIds — excluded items affect both charts and tables.
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  HeadingLevel, PageNumber,
} from "docx";
import { RT, RT_FONT } from "./reportTheme";
import { reportGlobalCss, buildCoverHtml, buildKpiGrid, esc, renderHtmlToPdf } from "./reportHtmlLayout";
import POLICY_TEMPLATES, { type PolicyTemplate } from "@/data/policyTemplates";
import { getReportBrandName, getReportBrandSlug } from "@/lib/reportBrand";

interface PolicyState {
  implementationStatus: "implemented" | "partially_implemented" | "not_implemented" | "draft" | "entbehrlich";
  policyOwner?: string;
  responsibleRoles?: string;
  reviewFrequency?: string;
  nextReviewDate?: string;
  version?: string;
  lastUpdated?: string;
}

type PolicyMap = Record<string, PolicyState>;
type Lang = "de" | "en";

interface Aggregated {
  total: number;
  impl: number;
  partial: number;
  notImpl: number;
  entbehrlich: number;
  maturityPct: number;
  byCategory: { name: string; total: number; impl: number; partial: number; pct: number }[];
  rows: { id: string; name: string; cat: string; status: string; statusKey: string; owner: string; nextReview: string; version: string }[];
}

const STATUS_LABEL: Record<string, { de: string; en: string }> = {
  implemented: { de: "Umgesetzt", en: "Implemented" },
  partially_implemented: { de: "Teilweise", en: "Partial" },
  not_implemented: { de: "Nicht umgesetzt", en: "Not Implemented" },
  entbehrlich: { de: "Entbehrlich", en: "Not Applicable" },
};

const STATUS_COLOR: Record<string, string> = {
  implemented: RT.low,
  partially_implemented: RT.medium,
  not_implemented: RT.critical,
  entbehrlich: "#9ca3af",
};

function aggregate(policies: PolicyMap, excluded: Set<string>, lang: Lang): Aggregated {
  const de = lang === "de";
  const included = POLICY_TEMPLATES.filter(t => !excluded.has(t.id));
  let impl = 0, partial = 0, notImpl = 0, entbehrlich = 0;
  const catMap = new Map<string, { total: number; impl: number; partial: number }>();
  const rows: Aggregated["rows"] = [];

  for (const t of included) {
    const p = policies[t.id];
    const rawStatus = p?.implementationStatus;
    const statusKey: "implemented" | "partially_implemented" | "not_implemented" | "entbehrlich" =
      rawStatus === "implemented" || rawStatus === "partially_implemented" || rawStatus === "not_implemented" || rawStatus === "entbehrlich"
        ? rawStatus
        : "not_implemented";

    const cat = de ? t.category : t.categoryEn;

    if (statusKey === "entbehrlich") {
      entbehrlich++;
      // skip from category compliance math
      rows.push({
        id: t.id,
        name: de ? t.name : t.nameEn,
        cat,
        statusKey,
        status: STATUS_LABEL[statusKey][de ? "de" : "en"],
        owner: p?.policyOwner || "-",
        nextReview: p?.nextReviewDate || "-",
        version: p?.version || "1.0",
      });
      continue;
    }

    if (statusKey === "implemented") impl++;
    else if (statusKey === "partially_implemented") partial++;
    else notImpl++;

    const c = catMap.get(cat) || { total: 0, impl: 0, partial: 0 };
    c.total += 1;
    if (statusKey === "implemented") c.impl += 1;
    else if (statusKey === "partially_implemented") c.partial += 1;
    catMap.set(cat, c);

    rows.push({
      id: t.id,
      name: de ? t.name : t.nameEn,
      cat,
      statusKey,
      status: STATUS_LABEL[statusKey][de ? "de" : "en"],
      owner: p?.policyOwner || "-",
      nextReview: p?.nextReviewDate || "-",
      version: p?.version || "1.0",
    });
  }

  const total = impl + partial + notImpl; // applicable only
  const maturityPct = total ? Math.round(((impl + partial * 0.5) / total) * 100) : 0;

  const byCategory = Array.from(catMap.entries()).map(([name, v]) => ({
    name, total: v.total, impl: v.impl, partial: v.partial,
    pct: v.total ? Math.round(((v.impl + v.partial * 0.5) / v.total) * 100) : 0,
  })).sort((a, b) => b.pct - a.pct);

  return { total, impl, partial, notImpl, entbehrlich, maturityPct, byCategory, rows };
}

// ── SVG charts (inline, render-friendly for html2canvas) ──

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
  // Use a wider viewBox than the rendered width so long labels on the left/right
  // axes don't get clipped, and wrap long labels onto two lines.
  const padX = Math.round(size * 0.35);
  const vbW = size + padX * 2;
  const cx = vbW / 2, cy = size / 2;
  const r = size * 0.32;
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

  // Wrap a label into up to 2 lines without breaking words mid-character.
  const wrap = (txt: string, maxChars = 18): string[] => {
    const words = txt.split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length <= maxChars) cur = (cur + " " + w).trim();
      else { if (cur) lines.push(cur); cur = w.length > maxChars ? w.slice(0, maxChars - 1) + "…" : w; }
    }
    if (cur) lines.push(cur);
    if (lines.length > 2) {
      const tail = lines.slice(1).join(" ");
      lines.length = 2;
      lines[1] = tail.length > maxChars ? tail.slice(0, maxChars - 1) + "…" : tail;
    }
    return lines;
  };

  const labels = data.map((d, i) => {
    const a = angle(i);
    const lr = r + 12;
    const x = cx + lr * Math.cos(a);
    const y = cy + lr * Math.sin(a);
    const anchor = Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
    const lines = wrap(`${d.label} ${d.pct}%`, 18);
    const dyStart = lines.length > 1 ? -4 : 0;
    const tspans = lines.map((ln, idx) => `<tspan x="${x}" dy="${idx === 0 ? dyStart : 11}">${esc(ln)}</tspan>`).join("");
    return `<text x="${x}" y="${y}" font-size="9.5" fill="${RT.body}" text-anchor="${anchor}" dominant-baseline="middle" font-weight="600">${tspans}</text>`;
  }).join("");

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${vbW} ${size}" preserveAspectRatio="xMidYMid meet" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">
    ${grid}${axes}
    <polygon points="${dataPts}" fill="${RT.navy}" fill-opacity="0.22" stroke="${RT.navy}" stroke-width="2" />
    ${labels}
  </svg>`;
}

// ── HTML body ──

function buildHtmlBody(agg: Aggregated, excludedCount: number, lang: Lang, companyName: string): string {
  const de = lang === "de";
  const dateStr = new Date().toLocaleDateString(de ? "de-DE" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric" });

  const pieData = [
    { label: de ? "Umgesetzt" : "Implemented", value: agg.impl, color: RT.low },
    { label: de ? "Teilweise" : "Partial", value: agg.partial, color: RT.medium },
    { label: de ? "Nicht umgesetzt" : "Not Implemented", value: agg.notImpl, color: RT.critical },
  ];
  const radarData = agg.byCategory.map(c => ({ label: c.name, pct: c.pct }));

  const cover = buildCoverHtml({
    badge: de ? "Richtlinien" : "Policies",
    title: de ? "Richtlinien-Übersichtsbericht" : "Policy Overview Report",
    subtitle: de ? "Status, Reife und Abdeckung Ihrer Sicherheitsrichtlinien" : "Status, maturity and coverage of your security policies",
    companyName, authorName: "", dateStr,
  });

  const kpis = buildKpiGrid([
    { label: de ? "Richtlinien gesamt" : "Total policies", value: agg.total },
    { label: de ? "Umgesetzt" : "Implemented", value: agg.impl, variant: "accent" },
    { label: de ? "Teilweise" : "Partial", value: agg.partial },
    { label: de ? "Reifegrad" : "Maturity", value: `${agg.maturityPct}%`, variant: "accent" },
  ]);

  const exclNote = excludedCount > 0
    ? `<div class="rt-note"><strong>${de ? "Hinweis" : "Note"}</strong><p>${de
        ? `${excludedCount} Richtlinien wurden vom Bericht ausgeschlossen. Kennzahlen, Diagramme und Tabellen beziehen sich nur auf die einbezogenen Richtlinien.`
        : `${excludedCount} policies were excluded from this report. Metrics, charts and tables reflect only included policies.`}</p></div>`
    : "";

  const charts = `
    <div style="display:flex;gap:24px;align-items:center;justify-content:space-between;margin:18px 0;flex-wrap:wrap;">
      <div style="flex:0 0 240px;text-align:center;">
        <div style="position:relative;display:inline-block;">
          ${svgPie(pieData, 220, lang)}
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <div style="font-size:26px;font-weight:700;color:${RT.navy};line-height:1;">${agg.maturityPct}%</div>
            <div style="font-size:9px;color:${RT.muted};letter-spacing:1px;text-transform:uppercase;margin-top:2px;">${de ? "Reife" : "Maturity"}</div>
          </div>
        </div>
        <div style="margin-top:10px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          ${pieData.map(d => `<span style="font-size:10px;color:${RT.body};display:inline-flex;align-items:center;gap:4px;"><span style="display:inline-block;width:9px;height:9px;background:${d.color};border-radius:2px;"></span>${esc(d.label)}: <strong>${d.value}</strong></span>`).join("")}
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
      <td style="text-align:center;color:${RT.low};font-weight:600;">${c.impl}</td>
      <td style="text-align:center;color:${RT.medium};font-weight:600;">${c.partial}</td>
      <td style="text-align:right;color:${color};font-weight:700;">${c.pct}%</td>
    </tr>`;
  }).join("");

  const policyRows = agg.rows.map(r => `<tr>
    <td style="font-family:monospace;color:${RT.muted};font-size:10px;">${esc(r.id)}</td>
    <td>${esc(r.name)}</td>
    <td style="color:${RT.muted};">${esc(r.cat)}</td>
    <td><span class="rt-badge" style="background:${STATUS_COLOR[r.statusKey]}22;color:${STATUS_COLOR[r.statusKey]};">${esc(r.status)}</span></td>
    <td>${esc(r.owner)}</td>
    <td>${esc(r.nextReview)}</td>
  </tr>`).join("");

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
        <th style="text-align:center;">${de ? "Umgesetzt" : "Implemented"}</th>
        <th style="text-align:center;">${de ? "Teilweise" : "Partial"}</th>
        <th style="text-align:right;">${de ? "Reife" : "Maturity"}</th>
      </tr></thead>
      <tbody>${catRows}</tbody>
    </table>

    <h2>${de ? "Richtlinien-Liste" : "Policy List"}</h2>
    <table>
      <thead><tr>
        <th style="width:60px;">ID</th>
        <th>${de ? "Richtlinie" : "Policy"}</th>
        <th>${de ? "Kategorie" : "Category"}</th>
        <th>${de ? "Status" : "Status"}</th>
        <th>${de ? "Eigentümer" : "Owner"}</th>
        <th>${de ? "Nächste Prüfung" : "Next Review"}</th>
      </tr></thead>
      <tbody>${policyRows}</tbody>
    </table>
  `;
}

// ── Public API: PDF ──

export async function generatePolicyOverviewPDF(
  policies: PolicyMap,
  excluded: string[],
  lang: Lang,
  companyName: string,
): Promise<void> {
  const exclSet = new Set(excluded);
  const agg = aggregate(policies, exclSet, lang);
  const body = buildHtmlBody(agg, exclSet.size, lang, companyName);
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>Policy Overview</title>${reportGlobalCss}</head><body>${body}</body></html>`;
  const filename = `${(companyName || "Ihr Unternehmen").replace(/\s+/g, "_")}_Policies_${new Date().toISOString().slice(0, 10)}.pdf`;
  await renderHtmlToPdf(html, filename);
}

// ── Public API: Word ──

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

function dataRow(cells: string[], widths: number[], opts: { bold?: number[]; color?: Record<number, string> } = {}): TableRow {
  return new TableRow({
    children: cells.map((t, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      borders: allBorders,
      margins: cellPad,
      children: [new Paragraph({ children: [new TextRun({
        text: t, size: 18,
        bold: opts.bold?.includes(i),
        color: opts.color?.[i],
      })] })],
    })),
  });
}

export async function generatePolicyOverviewWord(
  policies: PolicyMap,
  excluded: string[],
  lang: Lang,
  companyName: string,
): Promise<void> {
  const de = lang === "de";
  const exclSet = new Set(excluded);
  const agg = aggregate(policies, exclSet, lang);
  const dateStr = new Date().toLocaleDateString(de ? "de-DE" : "en-US");

  // KPI table (1 row, 4 cells)
  const kpiTable = new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [2256, 2256, 2256, 2258],
    rows: [
      new TableRow({
        children: [
          { l: de ? "Richtlinien gesamt" : "Total policies", v: String(agg.total) },
          { l: de ? "Umgesetzt" : "Implemented", v: String(agg.impl) },
          { l: de ? "Teilweise" : "Partial", v: String(agg.partial) },
          { l: de ? "Reifegrad" : "Maturity", v: `${agg.maturityPct}%` },
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

  // Status distribution (text bars instead of pie)
  const distRows: TableRow[] = [
    headerRow([de ? "Status" : "Status", de ? "Anzahl" : "Count", de ? "Anteil" : "Share", ""], [2200, 1200, 1200, 4426]),
  ];
  const statusItems = [
    { label: de ? "Umgesetzt" : "Implemented", value: agg.impl, color: RT.low.replace("#", "") },
    { label: de ? "Teilweise" : "Partial", value: agg.partial, color: RT.medium.replace("#", "") },
    { label: de ? "Nicht umgesetzt" : "Not Implemented", value: agg.notImpl, color: RT.critical.replace("#", "") },
  ];
  for (const s of statusItems) {
    const pct = agg.total ? Math.round((s.value / agg.total) * 100) : 0;
    const barFilled = Math.round(pct / 5);
    const bar = "█".repeat(barFilled) + "░".repeat(20 - barFilled);
    distRows.push(new TableRow({
      children: [
        new TableCell({ width: { size: 2200, type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ children: [new TextRun({ text: s.label, bold: true, size: 18, color: s.color })] })] }),
        new TableCell({ width: { size: 1200, type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(s.value), size: 18 })] })] }),
        new TableCell({ width: { size: 1200, type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${pct}%`, size: 18, bold: true })] })] }),
        new TableCell({ width: { size: 4426, type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ children: [new TextRun({ text: bar, size: 16, font: "Consolas", color: s.color })] })] }),
      ],
    }));
  }
  const distTable = new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [2200, 1200, 1200, 4426],
    rows: distRows,
  });

  // Category coverage table
  const catWidths = [3500, 1200, 1500, 1500, 1326];
  const catRows: TableRow[] = [
    headerRow([
      de ? "Kategorie" : "Category",
      de ? "Gesamt" : "Total",
      de ? "Umgesetzt" : "Implemented",
      de ? "Teilweise" : "Partial",
      de ? "Reife" : "Maturity",
    ], catWidths),
  ];
  for (const c of agg.byCategory) {
    const color = c.pct >= 70 ? RT.low.replace("#", "") : c.pct >= 40 ? RT.medium.replace("#", "") : RT.critical.replace("#", "");
    catRows.push(dataRow(
      [c.name, String(c.total), String(c.impl), String(c.partial), `${c.pct}%`],
      catWidths,
      { color: { 4: color }, bold: [4] },
    ));
  }
  const catTable = new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: catWidths,
    rows: catRows,
  });

  // Policy list table
  const polWidths = [800, 3000, 2000, 1400, 1226, 600];
  const polRows: TableRow[] = [
    headerRow([
      "ID",
      de ? "Richtlinie" : "Policy",
      de ? "Kategorie" : "Category",
      "Status",
      de ? "Eigentümer" : "Owner",
      de ? "Version" : "Version",
    ], polWidths),
  ];
  for (const r of agg.rows) {
    const color = STATUS_COLOR[r.statusKey].replace("#", "");
    polRows.push(new TableRow({
      children: [
        new TableCell({ width: { size: 800, type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ children: [new TextRun({ text: r.id, size: 16, font: "Consolas", color: "718096" })] })] }),
        new TableCell({ width: { size: 3000, type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ children: [new TextRun({ text: r.name, size: 18 })] })] }),
        new TableCell({ width: { size: 2000, type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ children: [new TextRun({ text: r.cat, size: 16, color: "718096" })] })] }),
        new TableCell({ width: { size: 1400, type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ children: [new TextRun({ text: r.status, size: 16, bold: true, color })] })] }),
        new TableCell({ width: { size: 1226, type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ children: [new TextRun({ text: r.owner, size: 16 })] })] }),
        new TableCell({ width: { size: 600, type: WidthType.DXA }, borders: allBorders, margins: cellPad,
          children: [new Paragraph({ children: [new TextRun({ text: r.version, size: 16 })] })] }),
      ],
    }));
  }
  const polTable = new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: polWidths,
    rows: polRows,
  });

  const exclNote = exclSet.size > 0
    ? new Paragraph({
        spacing: { before: 100, after: 200 },
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: copperHex, space: 8 } },
        children: [new TextRun({
          text: de
            ? `Hinweis: ${exclSet.size} Richtlinien wurden vom Bericht ausgeschlossen. Kennzahlen, Diagramme und Tabellen beziehen sich nur auf die einbezogenen Richtlinien.`
            : `Note: ${exclSet.size} policies were excluded from this report. Metrics, charts and tables reflect only included policies.`,
          italics: true, size: 18, color: "92400E",
        })],
      })
    : null;

  const doc = new Document({
    creator: getReportBrandName(de),
    title: de ? "Richtlinien-Übersichtsbericht" : "Policy Overview Report",
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
          children: [new TextRun({ text: companyName ? `${companyName} · ${de ? "Richtlinien" : "Policies"}` : (de ? "Richtlinien-Bericht" : "Policy Report"), size: 16, color: "718096" })],
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
        // Cover
        new Paragraph({ spacing: { after: 60 },
          children: [new TextRun({ text: de ? "SCHRITT 14 — RICHTLINIEN" : "STEP 14 — POLICIES", bold: true, color: copperHex, size: 18 })] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: de ? "Richtlinien-Übersichtsbericht" : "Policy Overview Report", bold: true, color: navyHex, size: 44 })] }),
        new Paragraph({ spacing: { after: 200 },
          children: [new TextRun({ text: de ? "Status, Reife und Abdeckung Ihrer Sicherheitsrichtlinien." : "Status, maturity and coverage of your security policies.", size: 22, color: "4A5568" })] }),
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

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: de ? "Richtlinien-Liste" : "Policy List", bold: true })] }),
        polTable,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(companyName || "Ihr Unternehmen").replace(/\s+/g, "_")}_Policies_${new Date().toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
