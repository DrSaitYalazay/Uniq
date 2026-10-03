import { jsPDF } from "jspdf";
import { RT } from "@/lib/reportTheme";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import type { Lang } from "@/contexts/LanguageContext";
import { isNis2Active } from "@/lib/frameworkFlags";
// FEHLTE — der Excel-Export der Roadmap wäre mit „exportBrandedXlsx is not
// defined" abgestürzt (gefunden 12.09.2026 durch check-undefined-imports).
import { exportBrandedXlsx } from "@/lib/reportXlsxKit";

// Spaltenüberschrift der Referenz-Spalte: "NIS2" nur wenn NIS2 aktiv, sonst neutral.
const refColLabel = (de: boolean) => (isNis2Active() ? "NIS2" : (de ? "Referenz" : "Reference"));

export interface RoadmapReportStats {
  totalApplicable: number;
  fullyDone: number;
  completionPct: number;
  nowOpenCount: number;
  nextCount: number;
  laterCount: number;
  overdueCount: number;
  inProgressCount: number;
  bundleCount: number;
  ownerCount: number;
  targetDate?: string;
  daysToTarget?: number;
}

export interface RoadmapTabCapture {
  id: "overview" | "timeline" | "resources";
  title: string;
  info?: string;
  dataUrl: string;
  width: number;
  height: number;
}

export interface RoadmapReportAction {
  id: string;
  phase: "now" | "next" | "later";
  name: string;
  nameEn: string;
  categoryTitle: string;
  categoryTitleEn: string;
  bundleKey: string;
  bundleTitle: string;
  bundleTitleEn: string;
  priority: "high" | "medium" | "low";
  status: "offen" | "laufend" | "fertig" | "blockiert";
  owner: string;
  dueDate: string;
  isOverdue: boolean;
  linkedToHighRisk: boolean;
  implStatus: string;
  effortDays: number;
  isoRef: string | null;
  nis2Ref: string;
}

export interface RoadmapReportBundle {
  phase: "now" | "next" | "later";
  bundleKey: string;
  title: string;
  titleEn: string;
  totalCount: number;
  doneCount: number;
  owner: string;
  dueDate: string;
  totalEffort: number;
  hasHighRisk: boolean;
  hasOverdue: boolean;
  isQuickWin: boolean;
  status: "offen" | "laufend" | "fertig" | "blockiert";
  nis2Ref: string;
}

export interface RoadmapReportOwner {
  name: string;
  total: number;
  completed: number;
  overdue: number;
  open: number;
}

export interface RoadmapReportData {
  stats: RoadmapReportStats;
  actions: RoadmapReportAction[];
  bundles: RoadmapReportBundle[];
  owners: RoadmapReportOwner[];
  tabs?: RoadmapTabCapture[];
}

const PDF = { width: 210, height: 297, margin: 12, footerY: 291 };
const WORD_W = 10466;
const phaseOrder: RoadmapReportAction["phase"][] = ["now", "next", "later"];

const phaseLabels = {
  de: { now: "Jetzt", next: "Nächste", later: "Später" },
  en: { now: "Now", next: "Next", later: "Later" },
};
const statusLabels = {
  de: { offen: "Offen", laufend: "Laufend", fertig: "Fertig", blockiert: "Blockiert" },
  en: { offen: "Open", laufend: "In progress", fertig: "Done", blockiert: "Blocked" },
};
const priorityLabels = {
  de: { high: "Hoch", medium: "Mittel", low: "Niedrig" },
  en: { high: "High", medium: "Medium", low: "Low" },
};
const phaseColors = {
  now: { accent: RT.stNein, soft: RT.stNeinBg },
  next: { accent: RT.stTeilweise, soft: "#FFFBEB" },
  later: { accent: RT.stNa, soft: RT.stNaBg },
};

function clean(v: unknown): string {
  return String(v ?? "").replace(/\s+/g, " ").trim() || "—";
}

function fmtDate(iso: string | undefined, lang: Lang): string {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString(lang === "de" ? "de-DE" : "en-GB") : "—";
}

function actionFlags(a: RoadmapReportAction, lang: Lang): string {
  const t = lang === "de";
  const flags = [
    a.isOverdue ? (t ? "Überfällig" : "Overdue") : "",
    a.linkedToHighRisk ? (t ? "Hohes Risiko" : "High risk") : "",
    a.implStatus === "teilweise" ? (t ? "Teilweise" : "Partial") : "",
  ].filter(Boolean);
  return flags.join(", ") || "—";
}

function bundleFlags(b: RoadmapReportBundle, lang: Lang): string {
  const t = lang === "de";
  const flags = [
    b.hasOverdue ? (t ? "Überfällig" : "Overdue") : "",
    b.hasHighRisk ? (t ? "Hohes Risiko" : "High risk") : "",
    b.isQuickWin ? "Quick Win" : "",
  ].filter(Boolean);
  return flags.join(", ") || "—";
}

function sortActions(actions: RoadmapReportAction[]) {
  const prio = { high: 0, medium: 1, low: 2 } as const;
  const status = { blockiert: 0, laufend: 1, offen: 2, fertig: 3 } as const;
  return [...actions].sort((a, b) => {
    const phaseDiff = phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase);
    if (phaseDiff) return phaseDiff;
    if (a.bundleTitle !== b.bundleTitle) return a.bundleTitle.localeCompare(b.bundleTitle);
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    const p = prio[a.priority] - prio[b.priority];
    if (p) return p;
    return status[a.status] - status[b.status];
  });
}

type PdfCtx = { pdf: jsPDF; y: number; lang: Lang; companyName: string };

function addPageIfNeeded(ctx: PdfCtx, heightNeeded: number) {
  if (ctx.y + heightNeeded <= PDF.height - 16) return;
  ctx.pdf.addPage();
  ctx.y = PDF.margin;
}

function setFont(ctx: PdfCtx, size: number, color = "#1E293B", style: "normal" | "bold" | "italic" = "normal") {
  ctx.pdf.setFont("helvetica", style);
  ctx.pdf.setFontSize(size);
  ctx.pdf.setTextColor(color);
}

function wrappedHeight(ctx: PdfCtx, text: string, width: number, fontSize = 8, lineH = 4): { lines: string[]; height: number } {
  setFont(ctx, fontSize);
  const lines = ctx.pdf.splitTextToSize(clean(text), width) as string[];
  return { lines, height: Math.max(lineH, lines.length * lineH) };
}

function drawText(ctx: PdfCtx, text: string, x: number, width: number, fontSize = 8, color = "#334155", style: "normal" | "bold" | "italic" = "normal", lineH = 4) {
  setFont(ctx, fontSize, color, style);
  const lines = ctx.pdf.splitTextToSize(clean(text), width) as string[];
  ctx.pdf.text(lines, x, ctx.y);
  ctx.y += Math.max(lineH, lines.length * lineH);
}

function drawTitle(ctx: PdfCtx, data: RoadmapReportData) {
  const t = ctx.lang === "de";
  setFont(ctx, 18, "#241A4D", "bold");
  ctx.pdf.text(ctx.lang === "de" ? "Roadmap – Jetzt / Nächste / Später" : "Roadmap – Now / Next / Later", PDF.margin, ctx.y);
  ctx.y += 7;
  setFont(ctx, 8, RT.stNa);
  const target = data.stats.targetDate ? ` | ${t ? "Audit-Zieltermin" : "Audit target"}: ${fmtDate(data.stats.targetDate, ctx.lang)}` : "";
  ctx.pdf.text(`${t ? "Unternehmen" : "Company"}: ${clean(ctx.companyName)} | ${t ? "Erstellt am" : "Generated"}: ${new Date().toLocaleDateString(t ? "de-DE" : "en-GB")}${target}`, PDF.margin, ctx.y);
  ctx.y += 6;
  ctx.pdf.setDrawColor(RT.copper);
  ctx.pdf.setLineWidth(0.6);
  ctx.pdf.line(PDF.margin, ctx.y, PDF.width - PDF.margin, ctx.y);
  ctx.y += 7;
}

function drawSection(ctx: PdfCtx, title: string, color = "#241A4D") {
  addPageIfNeeded(ctx, 12);
  setFont(ctx, 12, color, "bold");
  ctx.pdf.text(title, PDF.margin, ctx.y);
  ctx.y += 3;
  ctx.pdf.setDrawColor(RT.copper);
  ctx.pdf.setLineWidth(0.35);
  ctx.pdf.line(PDF.margin, ctx.y, PDF.width - PDF.margin, ctx.y);
  ctx.y += 6;
}

function drawMetricCards(ctx: PdfCtx, data: RoadmapReportData) {
  const t = ctx.lang === "de";
  const s = data.stats;
  const cards = [
    [`${s.completionPct}%`, t ? "Gesamtfortschritt" : "Overall progress", "#241A4D", "#F8FAFC"],
    [`${s.fullyDone}/${s.totalApplicable}`, t ? "Fertig" : "Done", RT.stJa, RT.stJaBg],
    [`${s.inProgressCount}`, t ? "Laufend" : "In progress", RT.stTeilweise, "#FFFBEB"],
    [`${s.overdueCount}`, t ? "Überfällig" : "Overdue", RT.stNein, RT.stNeinBg],
  ];
  const gap = 4;
  const w = (PDF.width - PDF.margin * 2 - gap * 3) / 4;
  const h = 21;
  addPageIfNeeded(ctx, h + 4);
  cards.forEach(([value, label, color, fill], i) => {
    const x = PDF.margin + i * (w + gap);
    ctx.pdf.setFillColor(fill);
    ctx.pdf.setDrawColor("#E2E8F0");
    ctx.pdf.roundedRect(x, ctx.y, w, h, 2, 2, "FD");
    setFont(ctx, 16, color, "bold");
    ctx.pdf.text(value, x + w / 2, ctx.y + 8, { align: "center" });
    setFont(ctx, 7, RT.stNa);
    ctx.pdf.text(label, x + w / 2, ctx.y + 15, { align: "center" });
  });
  ctx.y += h + 7;
}

function drawPhaseSummary(ctx: PdfCtx, data: RoadmapReportData) {
  const t = ctx.lang === "de";
  const rows = [
    [phaseLabels[ctx.lang].now, data.stats.nowOpenCount, data.bundles.filter(b => b.phase === "now").length, phaseColors.now],
    [phaseLabels[ctx.lang].next, data.stats.nextCount, data.bundles.filter(b => b.phase === "next").length, phaseColors.next],
    [phaseLabels[ctx.lang].later, data.stats.laterCount, data.bundles.filter(b => b.phase === "later").length, phaseColors.later],
  ] as const;
  addPageIfNeeded(ctx, 31);
  const colW = (PDF.width - PDF.margin * 2) / 3;
  rows.forEach(([label, count, bundles, color], i) => {
    const x = PDF.margin + i * colW;
    ctx.pdf.setFillColor(color.soft);
    ctx.pdf.setDrawColor("#E2E8F0");
    ctx.pdf.rect(x, ctx.y, colW, 24, "FD");
    setFont(ctx, 12, color.accent, "bold");
    ctx.pdf.text(String(count), x + 5, ctx.y + 8);
    setFont(ctx, 8, "#334155", "bold");
    ctx.pdf.text(label, x + 5, ctx.y + 15);
    setFont(ctx, 7, RT.stNa);
    ctx.pdf.text(`${bundles} ${t ? "Bündel" : "bundles"}`, x + 5, ctx.y + 20);
  });
  ctx.y += 31;
}

function drawRow(ctx: PdfCtx, values: string[], widths: number[], opts?: { fill?: string; bold?: boolean; size?: number; color?: string; onPageBreak?: () => void }) {
  const size = opts?.size ?? 7;
  const lineH = size <= 6.5 ? 3.1 : 3.6;
  const cellHeights = values.map((v, i) => wrappedHeight(ctx, v, widths[i] - 3, size, lineH).height + 4);
  const rowH = Math.max(7, ...cellHeights);
  if (ctx.y + rowH + 2 > PDF.height - 16) {
    ctx.pdf.addPage();
    ctx.y = PDF.margin;
    opts?.onPageBreak?.();
  }
  let x = PDF.margin;
  values.forEach((value, i) => {
    ctx.pdf.setFillColor(opts?.fill ?? "#FFFFFF");
    ctx.pdf.setDrawColor("#E2E8F0");
    ctx.pdf.rect(x, ctx.y, widths[i], rowH, "FD");
    setFont(ctx, size, opts?.color ?? "#334155", opts?.bold ? "bold" : "normal");
    const lines = ctx.pdf.splitTextToSize(clean(value), widths[i] - 3) as string[];
    ctx.pdf.text(lines, x + 1.5, ctx.y + 4.2);
    x += widths[i];
  });
  ctx.y += rowH;
}

function drawBundleTable(ctx: PdfCtx, bundles: RoadmapReportBundle[]) {
  const t = ctx.lang === "de";
  const widths = [16, 60, 38, 24, 19, 14, 15, 10];
  drawRow(ctx, [t ? "Phase" : "Phase", t ? "Bündel" : "Bundle", refColLabel(t), t ? "Verantwortlich" : "Owner", t ? "Fällig" : "Due", t ? "Fortschr." : "Progress", t ? "Hinweise" : "Flags", t ? "PT" : "PD"], widths, { fill: RT.stNaBg, bold: true, size: 6.6, color: "#1E293B" });
  bundles.forEach((b, index) => {
    drawRow(ctx, [
      phaseLabels[ctx.lang][b.phase],
      ctx.lang === "de" ? b.title : b.titleEn,
      b.nis2Ref,
      b.owner || (t ? "Nicht zugewiesen" : "Unassigned"),
      fmtDate(b.dueDate, ctx.lang),
      `${b.doneCount}/${b.totalCount}`,
      bundleFlags(b, ctx.lang),
      String(b.totalEffort),
    ], widths, { fill: index % 2 ? "#FFFFFF" : "#FBFDFF", size: 6.4 });
  });
  ctx.y += 4;
}

function drawActionRegister(ctx: PdfCtx, actions: RoadmapReportAction[]) {
  const t = ctx.lang === "de";
  const widths = [68, 42, 24, 19, 23, 10];
  const header = () => drawRow(ctx, [t ? "Maßnahme" : "Action", t ? "Bündel" : "Bundle", t ? "Verantwortlich" : "Owner", t ? "Fällig" : "Due", t ? "Status / Priorität / Hinweise" : "Status / Priority / Flags", t ? "PT" : "PD"], widths, { fill: RT.stNaBg, bold: true, size: 6.6, color: "#1E293B" });
  header();
  let lastPhase = "";
  let lastBundle = "";
  sortActions(actions).forEach((a, index) => {
    if (a.phase !== lastPhase) {
      addPageIfNeeded(ctx, 11);
      ctx.pdf.setFillColor(phaseColors[a.phase].soft);
      ctx.pdf.setDrawColor(phaseColors[a.phase].accent);
      ctx.pdf.rect(PDF.margin, ctx.y, PDF.width - PDF.margin * 2, 8, "FD");
      setFont(ctx, 8, phaseColors[a.phase].accent, "bold");
      ctx.pdf.text(phaseLabels[ctx.lang][a.phase], PDF.margin + 2, ctx.y + 5.3);
      ctx.y += 8;
      lastPhase = a.phase;
      lastBundle = "";
    }
    const bundleLabel = ctx.lang === "de" ? a.bundleTitle : a.bundleTitleEn;
    if (bundleLabel !== lastBundle) {
      addPageIfNeeded(ctx, 7);
      setFont(ctx, 7, "#475569", "bold");
      const lines = ctx.pdf.splitTextToSize(bundleLabel, PDF.width - PDF.margin * 2) as string[];
      ctx.pdf.text(lines, PDF.margin, ctx.y + 3.5);
      ctx.y += Math.max(6, lines.length * 3.4 + 2);
      setFont(ctx, 6.4, "#0E7490", "italic");
      const refLines = ctx.pdf.splitTextToSize(a.nis2Ref, PDF.width - PDF.margin * 2) as string[];
      ctx.pdf.text(refLines, PDF.margin, ctx.y + 3);
      ctx.y += Math.max(5, refLines.length * 3 + 1);
      lastBundle = bundleLabel;
    }
    const status = `${statusLabels[ctx.lang][a.status]} / ${priorityLabels[ctx.lang][a.priority]} / ${actionFlags(a, ctx.lang)}`;
    drawRow(ctx, [
      ctx.lang === "de" ? a.name : a.nameEn,
      bundleLabel,
      a.owner || (t ? "Nicht zugewiesen" : "Unassigned"),
      fmtDate(a.dueDate, ctx.lang),
      status,
      String(a.effortDays),
    ], widths, { fill: index % 2 ? "#FFFFFF" : "#FBFDFF", size: 6.4, onPageBreak: header });
  });
}

function drawOwnerSummary(ctx: PdfCtx, owners: RoadmapReportOwner[]) {
  const t = ctx.lang === "de";
  const widths = [74, 28, 28, 28, 28];
  drawRow(ctx, [t ? "Verantwortlich" : "Owner", t ? "Gesamt" : "Total", t ? "Offen" : "Open", t ? "Fertig" : "Done", t ? "Überfällig" : "Overdue"], widths, { fill: RT.stNaBg, bold: true, size: 7, color: "#1E293B" });
  owners.forEach((o, i) => drawRow(ctx, [o.name, String(o.total), String(o.open), String(o.completed), String(o.overdue)], widths, { fill: i % 2 ? "#FFFFFF" : "#FBFDFF", size: 6.8 }));
  ctx.y += 4;
}

function addFooters(pdf: jsPDF, companyName?: string, lang: Lang = "de") {
  const total = pdf.getNumberOfPages();
  const conf = lang === "de" ? "Vertraulich" : "Confidential";
  const left = [companyName?.trim(), conf].filter(Boolean).join(" · ");
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(RT.stNa);
    if (left) pdf.text(left, PDF.margin, PDF.footerY);
    pdf.text(`${i}/${total}`, PDF.width / 2, PDF.footerY, { align: "center" });
  }
}

function slugify(name?: string, fallback = "roadmap"): string {
  return (name || fallback).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || fallback;
}

export async function generateRoadmapPDF(data: RoadmapReportData, lang: Lang, companyName: string) {
  const t = lang === "de";
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const ctx: PdfCtx = { pdf, y: PDF.margin, lang, companyName };
  drawTitle(ctx, data);
  drawMetricCards(ctx, data);
  drawSection(ctx, t ? "Phasenübersicht" : "Phase overview");
  drawPhaseSummary(ctx, data);
  drawText(ctx, t
    ? "Priorisierte Maßnahmen nach Horizont (Jetzt / Nächste / Später) mit Verantwortlichen, Fristen und Aufwand."
    : "Prioritised actions by horizon (Now / Next / Later) with owners, due dates and effort.",
    PDF.margin, PDF.width - PDF.margin * 2, 8, "#475569", "normal", 4.2);
  ctx.y += 3;

  drawSection(ctx, t ? "Bündelübersicht" : "Bundle overview");
  drawBundleTable(ctx, data.bundles);

  drawSection(ctx, t ? "Ressourcenübersicht" : "Resource overview");
  drawOwnerSummary(ctx, data.owners);

  drawSection(ctx, t ? "Maßnahmenregister" : "Action register");
  drawActionRegister(ctx, data.actions);

  addFooters(pdf, companyName, lang);
  pdf.save(`${slugify(companyName)}-roadmap-bericht-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function wordText(text: string, opts?: { bold?: boolean; italics?: boolean; size?: number; color?: string }) {
  return new TextRun({ text: clean(text), bold: opts?.bold, italics: opts?.italics, size: opts?.size ?? 20, font: "Arial", color: opts?.color });
}

function wordPara(text: string, opts?: { bold?: boolean; size?: number; color?: string; heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]; after?: number }) {
  return new Paragraph({
    heading: opts?.heading,
    spacing: { after: opts?.after ?? 80 },
    children: [wordText(text, { bold: opts?.bold, size: opts?.size, color: opts?.color })],
  });
}

function wordCell(children: (Paragraph | Table)[], width: number, fill = "FFFFFF") {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" };
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: { top: border, bottom: border, left: border, right: border },
    shading: { fill, type: ShadingType.CLEAR, color: "auto" },
    margins: { top: 90, bottom: 90, left: 110, right: 110 },
    children,
  });
}

function wordMetricTable(data: RoadmapReportData, lang: Lang) {
  const t = lang === "de";
  const s = data.stats;
  const w = Math.floor(WORD_W / 4);
  const cells = [
    [`${s.completionPct}%`, t ? "Gesamtfortschritt" : "Overall progress", "241A4D", "F8FAFC"],
    [`${s.fullyDone}/${s.totalApplicable}`, t ? "Fertig" : "Done", "16A34A", "F0FDF4"],
    [`${s.inProgressCount}`, t ? "Laufend" : "In progress", "D97706", "FFFBEB"],
    [`${s.overdueCount}`, t ? "Überfällig" : "Overdue", "DC2626", "FEF2F2"],
  ];
  return new Table({
    width: { size: WORD_W, type: WidthType.DXA },
    columnWidths: [w, w, w, WORD_W - w * 3],
    rows: [new TableRow({
      children: cells.map(([value, label, color, fill], i) => wordCell([
        new Paragraph({ alignment: AlignmentType.CENTER, children: [wordText(value, { bold: true, size: 30, color })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [wordText(label, { size: 16, color: "64748B" })] }),
      ], i === 3 ? WORD_W - w * 3 : w, fill)),
    })],
  });
}

function wordBundleTable(data: RoadmapReportData, lang: Lang) {
  const t = lang === "de";
  const widths = [900, 3200, 2400, 1500, 1100, 850, 516];
  const header = new TableRow({ children: [t ? "Phase" : "Phase", t ? "Bündel" : "Bundle", refColLabel(t), t ? "Verantwortlich" : "Owner", t ? "Fällig" : "Due", t ? "Fortschritt" : "Progress", t ? "Hinweise" : "Flags"].map((h, i) => wordCell([wordPara(h, { bold: true, size: 15, after: 0 })], widths[i], "F1F5F9")) });
  const rows = data.bundles.map((b, idx) => new TableRow({ children: [
    phaseLabels[lang][b.phase],
    lang === "de" ? b.title : b.titleEn,
    b.nis2Ref,
    b.owner || (t ? "Nicht zugewiesen" : "Unassigned"),
    fmtDate(b.dueDate, lang),
    `${b.doneCount}/${b.totalCount} | ${b.totalEffort} ${t ? "PT" : "PD"}`,
    bundleFlags(b, lang),
  ].map((v, i) => wordCell([wordPara(v, { size: 14, after: 0 })], widths[i], idx % 2 ? "FFFFFF" : "FBFDFF")) }));
  return new Table({ width: { size: WORD_W, type: WidthType.DXA }, columnWidths: widths, rows: [header, ...rows] });
}

function wordOwnerTable(data: RoadmapReportData, lang: Lang) {
  const t = lang === "de";
  const widths = [WORD_W - 4800, 1200, 1200, 1200, 1200];
  const header = new TableRow({ children: [t ? "Verantwortlich" : "Owner", t ? "Gesamt" : "Total", t ? "Offen" : "Open", t ? "Fertig" : "Done", t ? "Überfällig" : "Overdue"].map((h, i) => wordCell([wordPara(h, { bold: true, size: 16, after: 0 })], widths[i], "F1F5F9")) });
  const rows = data.owners.map((o, idx) => new TableRow({ children: [o.name, String(o.total), String(o.open), String(o.completed), String(o.overdue)].map((v, i) => wordCell([wordPara(v, { size: 15, after: 0 })], widths[i], idx % 2 ? "FFFFFF" : "FBFDFF")) }));
  return new Table({ width: { size: WORD_W, type: WidthType.DXA }, columnWidths: widths, rows: [header, ...rows] });
}

function wordActionCard(action: RoadmapReportAction, lang: Lang, idx: number) {
  const t = lang === "de";
  const title = lang === "de" ? action.name : action.nameEn;
  const bundle = lang === "de" ? action.bundleTitle : action.bundleTitleEn;
  const meta = [
    `${t ? "Phase" : "Phase"}: ${phaseLabels[lang][action.phase]}`,
    `${t ? "Status" : "Status"}: ${statusLabels[lang][action.status]}`,
    `${t ? "Priorität" : "Priority"}: ${priorityLabels[lang][action.priority]}`,
    `${t ? "Verantwortlich" : "Owner"}: ${action.owner || (t ? "Nicht zugewiesen" : "Unassigned")}`,
    `${t ? "Fällig" : "Due"}: ${fmtDate(action.dueDate, lang)}`,
    `${t ? "Aufwand" : "Effort"}: ${action.effortDays} ${t ? "PT" : "PD"}`,
  ].join(" | ");
  return new Table({
    width: { size: WORD_W, type: WidthType.DXA },
    columnWidths: [WORD_W],
    rows: [new TableRow({ children: [wordCell([
      wordPara(`${idx + 1}. ${title}`, { bold: true, size: 18, color: "1E293B", after: 60 }),
      wordPara(`${t ? "Bündel" : "Bundle"}: ${bundle}`, { size: 15, color: "475569", after: 30 }),
      ...(isNis2Active() && action.nis2Ref ? [wordPara(`NIS2: ${action.nis2Ref}`, { size: 14, color: "0E7490", after: 50 })] : []),
      wordPara(meta, { size: 15, color: "334155", after: 50 }),
      wordPara(`${t ? "Hinweise" : "Flags"}: ${actionFlags(action, lang)}`, { size: 15, color: action.isOverdue || action.linkedToHighRisk ? "DC2626" : "64748B", after: 0 }),
    ], WORD_W, idx % 2 ? "FFFFFF" : "FBFDFF")] })],
  });
}

export async function generateRoadmapWord(data: RoadmapReportData, lang: Lang, companyName: string) {
  const t = lang === "de";
  const children: (Paragraph | Table)[] = [];

  children.push(new Paragraph({
    spacing: { after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "241A4D", space: 6 } },
    children: [wordText(lang === "de" ? "Roadmap – Jetzt / Nächste / Später" : "Roadmap – Now / Next / Later", { bold: true, size: 34, color: "241A4D" })],
  }));
  children.push(wordPara(`${t ? "Unternehmen" : "Company"}: ${companyName || "—"} | ${t ? "Erstellt am" : "Generated"}: ${new Date().toLocaleDateString(t ? "de-DE" : "en-GB")}${data.stats.targetDate ? ` | ${t ? "Audit-Zieltermin" : "Audit target"}: ${fmtDate(data.stats.targetDate, lang)}` : ""}`, { size: 18, color: "64748B", after: 180 }));
  children.push(wordMetricTable(data, lang));
  children.push(wordPara(" ", { after: 120 }));

  children.push(wordPara(t ? "Phasenübersicht" : "Phase overview", { heading: HeadingLevel.HEADING_1, bold: true, size: 26, color: "241A4D", after: 120 }));
  children.push(wordPara(t ? "Der Bericht wird aus den Roadmap-Daten als echte Word-Struktur erzeugt. Jede Maßnahme steht einzeln im Maßnahmenregister; Screenshot-only Inhalte werden nicht verwendet." : "The report is generated from Roadmap data as a real Word structure. Every action appears individually in the action register; screenshot-only content is not used.", { size: 18, color: "475569", after: 160 }));
  children.push(wordBundleTable(data, lang));
  children.push(wordPara(" ", { after: 140 }));

  children.push(wordPara(t ? "Ressourcenübersicht" : "Resource overview", { heading: HeadingLevel.HEADING_1, bold: true, size: 26, color: "241A4D", after: 120 }));
  children.push(wordOwnerTable(data, lang));
  children.push(wordPara(" ", { after: 140 }));

  children.push(wordPara(t ? "Maßnahmenregister" : "Action register", { heading: HeadingLevel.HEADING_1, bold: true, size: 26, color: "241A4D", after: 120 }));
  sortActions(data.actions).forEach((action, idx) => {
    children.push(wordActionCard(action, lang, idx));
    children.push(wordPara(" ", { after: 70 }));
  });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 20 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: "241A4D" }, paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 0 } },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children,
    }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${slugify(companyName)}-roadmap-bericht-${new Date().toISOString().slice(0, 10)}.docx`);
}

/** Roadmap als Excel — filterbare Maßnahmenliste je Horizont. */
export const generateRoadmapExcel = async (data: RoadmapReportData, lang: Lang, companyName?: string) => {
  const de = lang === "de";
  const items: any[] = (data as any).items ?? (data as any).roadmapItems ?? [];
  const s2 = (data as any).stats ?? {};
  await exportBrandedXlsx({
    fileBase: de ? "Roadmap" : "Roadmap",
    title: de ? "Umsetzungs-Roadmap" : "Implementation roadmap",
    lang,
    scope: de
      ? `${items.length} Maßnahmen · ${s2.fullyDone ?? 0}/${s2.totalApplicable ?? 0} fertig · ${s2.overdueCount ?? 0} überfällig`
      : `${items.length} actions · ${s2.fullyDone ?? 0}/${s2.totalApplicable ?? 0} done · ${s2.overdueCount ?? 0} overdue`,
    sheets: [{
      name: de ? "Maßnahmen" : "Actions",
      statusKey: "status",
      columns: [
        { header: "ID", key: "id", width: 22 },
        { header: de ? "Maßnahme" : "Action", key: "name", width: 54 },
        { header: de ? "Horizont" : "Horizon", key: "hz", width: 14 },
        { header: de ? "Status" : "Status", key: "status", width: 16 },
        { header: de ? "Verantwortlich" : "Owner", key: "owner", width: 24 },
        { header: de ? "Fällig" : "Due", key: "due", width: 14 },
        { header: de ? "Aufwand (PT)" : "Effort (days)", key: "pt", width: 13, kind: "num" },
        { header: de ? "Referenz" : "Reference", key: "ref", width: 16 },
      ],
      rows: items.map((i: any) => ({
        id: i.id ?? i.control_id ?? i.bundle_key ?? "",
        name: de ? (i.title ?? i.name ?? "") : (i.titleEn ?? i.nameEn ?? i.title ?? i.name ?? ""),
        hz: i.horizon ?? i.hz ?? "",
        status: i.status ?? i.actionStatus ?? "",
        owner: i.owner ?? "",
        due: i.due_date ?? i.dueDate ?? "",
        pt: i.effort_pt ?? i.effortDays ?? "",
        ref: i.isoRef ?? i.ref ?? "",
      })),
    }],
  });
};
