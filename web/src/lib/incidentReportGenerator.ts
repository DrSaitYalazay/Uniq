import jsPDF from "jspdf";
import { exportBrandedXlsx } from "@/lib/reportXlsxKit";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  HeadingLevel, PageNumber, PageBreak,
} from "docx";
import { saveAs } from "file-saver";
import { getNationalLaw, registerSubtitle } from "./nationalLawRegistry";
import { getReportBrandName, getReportBrandSlug } from "@/lib/reportBrand";
import { isNis2Active } from "@/lib/frameworkFlags";

// ── Types ──
export interface IncidentExport {
  id: string;
  title: string;
  description: string;
  incident_type: string;
  severity: string;
  status: string;
  occurred_at: string | null;
  detected_at: string;
  closed_at: string | null;
  reportable: boolean;
  authority_notified: boolean;
  authority_name: string;
  cross_border_impact: boolean;
  affected_member_states: string[];
  measures_taken: string;
  measures_planned: string;
  impact_description: string;
  service_recipients_affected: boolean;
  awareness_confidence: string;
  recipient_notification_status: string;
  recipient_notification_sent_at: string | null;
  recipient_notification_channel: string;
  recipient_notification_scope: string;
  recipient_notification_proof: string;
  root_cause: string;
  lessons_learned: string;
}

export interface ChecklistExport {
  id: string;
  incident_id: string;
  phase: string;
  label: string;
  status: string;
  responsible: string;
  evidence: string;
  completed_at: string | null;
  sort_order: number;
}

type Lang = "de" | "en";
const t = (de: string, en: string, lang: Lang) => (lang === "en" ? en : de);

// ── Brand palette (HSL converted to RGB) ──
const BRAND = {
  primary: [20, 40, 80] as [number, number, number],        // deep navy
  primarySoft: [232, 238, 248] as [number, number, number], // pale blue
  accent: [201, 168, 76] as [number, number, number],       // gold
  text: [25, 32, 48] as [number, number, number],
  muted: [110, 118, 135] as [number, number, number],
  rule: [220, 226, 236] as [number, number, number],
  surface: [248, 250, 253] as [number, number, number],
  ok: [34, 134, 75] as [number, number, number],
  warn: [196, 142, 24] as [number, number, number],
  na: [150, 156, 168] as [number, number, number],
  open: [180, 60, 60] as [number, number, number],
};

const phaseLabel: Record<string, { de: string; en: string }> = {
  early_warning_24h: { de: "Frühwarnung (24h)", en: "Early Warning (24h)" },
  follow_up_72h: { de: "Folgemeldung (72h)", en: "Follow-up (72h)" },
  intermediate: { de: "Zwischenmeldung", en: "Intermediate Update" },
  final_report_1m: { de: "Abschlussmeldung (1 Monat)", en: "Final Notification (1 month)" },
  stakeholder: { de: "Stakeholder-Kommunikation", en: "Stakeholder Communication" },
  internal_response: { de: "Interne Response", en: "Internal Response" },
  insurance: { de: "Cyber-Versicherung", en: "Cyber Insurance" },
};

const statusLabel = (s: string, lang: Lang) => {
  switch (s) {
    case "done": return t("Erledigt", "Done", lang);
    case "in_progress": return t("In Bearbeitung", "In Progress", lang);
    case "na": return t("N/A", "N/A", lang);
    default: return t("Offen", "Open", lang);
  }
};

const fmtDate = (iso: string | null, lang: Lang) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(lang === "en" ? "en-GB" : "de-DE", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
};

// ── Legal reference labels — country-aware ──
// NIS2 is the sole reference (national transpositions are not cited)
// is appended only when the country has an entry in nationalLawRegistry.
const buildRefs = (lang: Lang, country: string | null | undefined) => {
  const nat = getNationalLaw(country);
  const natMandatory = nat?.mandatoryContentRef ?? "";
  const natRecipient = nat?.recipientNotificationRef ?? "";
  const suffix = (cite: string) =>
    cite ? (lang === "en" ? ` (national: ${cite})` : ` (national: ${cite})`) : "";
  const nis2 = isNis2Active();
  const mand = nis2 ? "NIS2 Art. 23(4) — " : "";
  const recip = nis2 ? "NIS2 Art. 23(2) — " : "";
  return {
    mandatoryContent: t(
      `${mand}Pflichtinhalte${suffix(natMandatory)}`,
      `${mand}Mandatory content${suffix(natMandatory)}`,
      lang,
    ),
    recipientNotification: t(
      `${recip}Benachrichtigung der Dienstempfänger${suffix(natRecipient)}`,
      `${recip}Notification of service recipients${suffix(natRecipient)}`,
      lang,
    ),
    registerSubtitle: registerSubtitle(country, lang),
  };
};
type Refs = ReturnType<typeof buildRefs>;

// ════════════════════════════════════════════════
//  PDF GENERATION
// ════════════════════════════════════════════════
type Ctx = {
  doc: jsPDF;
  pageW: number;
  pageH: number;
  margin: number;
  contentW: number;
  y: number;
  lang: Lang;
  refs: Refs;
};

const setColor = (doc: jsPDF, c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
const setFill = (doc: jsPDF, c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
const setDraw = (doc: jsPDF, c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);

const ensure = (ctx: Ctx, need: number) => {
  if (ctx.y + need > ctx.pageH - 70) {
    ctx.doc.addPage();
    drawPageChrome(ctx);
    ctx.y = 90;
  }
};

function drawPageChrome(ctx: Ctx) {
  const { doc, pageW } = ctx;
  // Top brand bar
  setFill(doc, BRAND.primary);
  doc.rect(0, 0, pageW, 54, "F");
  // Gold accent strip
  setFill(doc, BRAND.accent);
  doc.rect(0, 54, pageW, 2, "F");
  // Brand text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(getReportBrandName(ctx.lang), ctx.margin, 34);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(210, 220, 240);
  doc.text(t("Vorfall-Dokumentation", "Incident Documentation", ctx.lang), ctx.margin, 46);
  // Right-side legal ref
  doc.setFontSize(8);
  doc.setTextColor(210, 220, 240);
  if (isNis2Active()) {
    doc.text("NIS2 Art. 23", pageW - ctx.margin, 34, { align: "right" });
    doc.setTextColor(180, 195, 220);
    doc.text(t("EU-Richtlinie 2022/2555", "EU Directive 2022/2555", ctx.lang), pageW - ctx.margin, 46, { align: "right" });
  } else {
    doc.text(t("Vorfall-Register", "Incident Register", ctx.lang), pageW - ctx.margin, 34, { align: "right" });
  }
}

function drawFooters(doc: jsPDF, lang: Lang) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    // Footer rule
    setDraw(doc, BRAND.rule);
    doc.setLineWidth(0.5);
    doc.line(40, pageH - 38, pageW - 40, pageH - 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(doc, BRAND.muted);
    doc.text(
      t(`${getReportBrandName("de")} · Vertraulich`, `${getReportBrandName("en")} · Confidential`, lang),
      40, pageH - 22,
    );
    doc.text(new Date().toLocaleDateString(lang === "en" ? "en-GB" : "de-DE"), pageW / 2, pageH - 22, { align: "center" });
    doc.text(`${t("Seite", "Page", lang)} ${i} / ${total}`, pageW - 40, pageH - 22, { align: "right" });
  }
}

function sectionHeading(ctx: Ctx, num: string, text: string) {
  ensure(ctx, 36);
  const { doc, margin } = ctx;
  // Number badge
  setFill(doc, BRAND.primary);
  doc.roundedRect(margin, ctx.y - 10, 22, 22, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(num, margin + 11, ctx.y + 4, { align: "center" });
  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setColor(doc, BRAND.primary);
  doc.text(text, margin + 30, ctx.y + 4);
  ctx.y += 18;
  // Rule
  setDraw(doc, BRAND.rule);
  doc.setLineWidth(0.4);
  doc.line(margin, ctx.y, ctx.pageW - margin, ctx.y);
  ctx.y += 14;
}

function field(ctx: Ctx, label: string, value: string, full = false) {
  const { doc, margin, contentW } = ctx;
  const v = (value || "").trim() || "—";
  const labelW = 130;
  const valueW = contentW - labelW - 10;
  const lines = doc.splitTextToSize(v, valueW);
  const blockH = Math.max(16, lines.length * 12 + 4);
  ensure(ctx, blockH + 4);

  // Subtle row background on alternating
  // (use plain — keep neutral)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setColor(doc, BRAND.muted);
  doc.text(label.toUpperCase(), margin, ctx.y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setColor(doc, BRAND.text);
  doc.text(lines, margin + labelW, ctx.y);
  ctx.y += blockH;
  // Soft separator
  setDraw(doc, BRAND.rule);
  doc.setLineWidth(0.2);
  doc.line(margin, ctx.y - 2, ctx.pageW - margin, ctx.y - 2);
  ctx.y += 6;
}

function paragraph(ctx: Ctx, text: string) {
  const { doc, margin, contentW } = ctx;
  const v = (text || "").trim() || "—";
  const lines = doc.splitTextToSize(v, contentW);
  ensure(ctx, lines.length * 12 + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setColor(doc, BRAND.text);
  doc.text(lines, margin, ctx.y);
  ctx.y += lines.length * 12 + 6;
}

function infoCard(ctx: Ctx, title: string, text: string) {
  const { doc, margin, contentW } = ctx;
  const v = (text || "").trim() || "—";
  const lines = doc.splitTextToSize(v, contentW - 20);
  const h = 28 + lines.length * 12;
  ensure(ctx, h + 6);
  setFill(doc, BRAND.surface);
  doc.roundedRect(margin, ctx.y - 4, contentW, h, 4, 4, "F");
  // Accent stripe
  setFill(doc, BRAND.accent);
  doc.rect(margin, ctx.y - 4, 3, h, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setColor(doc, BRAND.primary);
  doc.text(title.toUpperCase(), margin + 12, ctx.y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setColor(doc, BRAND.text);
  doc.text(lines, margin + 12, ctx.y + 22);
  ctx.y += h + 6;
}

function severityChip(ctx: Ctx, x: number, y: number, severity: string): number {
  const { doc } = ctx;
  const map: Record<string, [number, number, number]> = {
    critical: [180, 40, 40], high: [210, 110, 30], medium: [196, 142, 24], low: [60, 130, 90],
  };
  const c = map[severity?.toLowerCase()] || BRAND.muted;
  const txt = severity?.toUpperCase() || "—";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const w = doc.getTextWidth(txt) + 14;
  setFill(doc, c);
  doc.roundedRect(x, y - 10, w, 14, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(txt, x + w / 2, y, { align: "center" });
  return w;
}

function statusDot(ctx: Ctx, x: number, y: number, status: string) {
  const c = status === "done" ? BRAND.ok : status === "in_progress" ? BRAND.warn : status === "na" ? BRAND.na : BRAND.open;
  setFill(ctx.doc, c);
  ctx.doc.circle(x, y - 3, 3, "F");
}

function checklistItem(ctx: Ctx, item: ChecklistExport) {
  const { doc, margin, contentW, lang } = ctx;
  const muted = item.status === "na";
  const labelLines = doc.splitTextToSize(item.label, contentW - 30);
  const metaParts = [
    item.responsible && `${t("Verantw.", "Resp.", lang)}: ${item.responsible}`,
    item.evidence && `${t("Nachweis", "Evidence", lang)}: ${item.evidence}`,
    item.completed_at && `${t("Erledigt", "Done", lang)}: ${fmtDate(item.completed_at, lang)}`,
  ].filter(Boolean) as string[];
  const metaH = metaParts.length ? 11 : 0;
  const h = labelLines.length * 11 + metaH + 8;
  ensure(ctx, h);

  statusDot(ctx, margin + 6, ctx.y + 2, item.status);

  doc.setFont("helvetica", muted ? "normal" : "normal");
  doc.setFontSize(9.5);
  setColor(doc, muted ? BRAND.muted : BRAND.text);
  doc.text(labelLines, margin + 18, ctx.y + 4);

  // Status label right-aligned
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setColor(doc, muted ? BRAND.muted : item.status === "done" ? BRAND.ok : item.status === "in_progress" ? BRAND.warn : BRAND.open);
  doc.text(statusLabel(item.status, lang).toUpperCase(), ctx.pageW - margin, ctx.y + 4, { align: "right" });

  if (metaParts.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(doc, BRAND.muted);
    doc.text(metaParts.join("  ·  "), margin + 18, ctx.y + 4 + labelLines.length * 11);
  }
  ctx.y += h;
}

function drawIncidentBody(ctx: Ctx, inc: IncidentExport, checklist: ChecklistExport[]) {
  const { doc, margin, contentW, lang } = ctx;

  // Title block
  ensure(ctx, 70);
  setFill(doc, BRAND.primarySoft);
  doc.roundedRect(margin, ctx.y, contentW, 56, 6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  setColor(doc, BRAND.primary);
  const titleLines = doc.splitTextToSize(inc.title, contentW - 24);
  doc.text(titleLines[0], margin + 14, ctx.y + 22);
  // Sub line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(doc, BRAND.muted);
  doc.text(
    `${t("Typ", "Type", lang)}: ${inc.incident_type || "—"}  ·  ${t("Status", "Status", lang)}: ${inc.status}  ·  ${t("Erkannt", "Detected", lang)}: ${fmtDate(inc.detected_at, lang)}`,
    margin + 14, ctx.y + 38,
  );
  // Severity chip top-right
  severityChip(ctx, margin + contentW - 70, ctx.y + 22, inc.severity);
  ctx.y += 72;

  // 1. Incident data
  sectionHeading(ctx, "1", t("Vorfalldaten", "Incident data", lang));
  field(ctx, t("Typ", "Type", lang), inc.incident_type);
  field(ctx, t("Aufgetreten am", "Occurred at", lang), fmtDate(inc.occurred_at, lang));
  field(ctx, t("Erkannt am", "Detected at", lang), fmtDate(inc.detected_at, lang));
  field(ctx, t("Geschlossen am", "Closed at", lang), fmtDate(inc.closed_at, lang));
  field(ctx, t("Meldepflichtig", "Reportable", lang), inc.reportable ? t("Ja", "Yes", lang) : t("Nein", "No", lang));
  field(ctx, t("Behörde / CSIRT informiert", "Authority / CSIRT notified", lang),
    inc.authority_notified ? `${t("Ja", "Yes", lang)}${inc.authority_name ? ` — ${inc.authority_name}` : ""}` : t("Nein", "No", lang));
  field(ctx, t("Kenntnisgrad", "Awareness", lang), inc.awareness_confidence);

  // 2. Description
  sectionHeading(ctx, "2", t("Beschreibung", "Description", lang));
  infoCard(ctx, t("Sachverhalt", "Summary", lang), inc.description);

  // 3. NIS2 Art.23(4) mandatory
  sectionHeading(ctx, "3", ctx.refs.mandatoryContent);
  infoCard(ctx, t("Auswirkungen", "Impact", lang), inc.impact_description);
  infoCard(ctx, t("Ergriffene Maßnahmen", "Measures taken", lang), inc.measures_taken);
  infoCard(ctx, t("Geplante Maßnahmen", "Measures planned", lang), inc.measures_planned);
  field(ctx, t("Grenzüberschreitend", "Cross-border", lang),
    inc.cross_border_impact ? `${t("Ja", "Yes", lang)} — ${inc.affected_member_states.join(", ") || "—"}` : t("Nein", "No", lang));

  // 4. Recipient notification
  sectionHeading(ctx, "4", ctx.refs.recipientNotification);
  field(ctx, t("Empfänger betroffen", "Recipients affected", lang),
    inc.service_recipients_affected ? t("Ja", "Yes", lang) : t("Nein", "No", lang));
  if (inc.service_recipients_affected) {
    field(ctx, t("Status", "Status", lang), inc.recipient_notification_status);
    field(ctx, t("Versendet am", "Sent at", lang), fmtDate(inc.recipient_notification_sent_at, lang));
    field(ctx, t("Kanal", "Channel", lang), inc.recipient_notification_channel);
    infoCard(ctx, t("Empfängerkreis", "Recipient scope", lang), inc.recipient_notification_scope);
    infoCard(ctx, t("Nachweis", "Proof", lang), inc.recipient_notification_proof);
  }

  // 5. Root cause
  sectionHeading(ctx, "5", t("Ursache & Lessons Learned", "Root cause & lessons learned", lang));
  infoCard(ctx, t("Ursache", "Root cause", lang), inc.root_cause);
  infoCard(ctx, t("Lessons Learned", "Lessons learned", lang), inc.lessons_learned);

  // 6. Checklist
  const items = checklist.filter(c => c.incident_id === inc.id).sort((a, b) => a.sort_order - b.sort_order);
  if (items.length) {
    sectionHeading(ctx, "6", t("Meldepflicht-Checkliste", "Reporting checklist", lang));
    const grouped: Record<string, ChecklistExport[]> = {};
    items.forEach(it => { (grouped[it.phase] ??= []).push(it); });
    Object.entries(grouped).forEach(([phase, list]) => {
      ensure(ctx, 28);
      // Phase header band
      setFill(doc, BRAND.primarySoft);
      doc.roundedRect(margin, ctx.y - 2, contentW, 18, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      setColor(doc, BRAND.primary);
      doc.text(phaseLabel[phase]?.[lang] || phase, margin + 8, ctx.y + 10);
      // Phase progress
      const done = list.filter(i => i.status === "done").length;
      const total = list.filter(i => i.status !== "na").length;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setColor(doc, BRAND.muted);
      doc.text(`${done} / ${total || 0}`, ctx.pageW - margin - 8, ctx.y + 10, { align: "right" });
      ctx.y += 22;
      list.forEach(it => checklistItem(ctx, it));
      ctx.y += 4;
    });
  }
}

function createDoc(): jsPDF {
  return new jsPDF({ unit: "pt", format: "a4" });
}

function makeCtx(doc: jsPDF, lang: Lang, country: string | null | undefined): Ctx {
  const margin = 48;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  return { doc, pageW, pageH, margin, contentW: pageW - 2 * margin, y: 90, lang, refs: buildRefs(lang, country) };
}

export function generateIncidentPdf(inc: IncidentExport, checklist: ChecklistExport[], lang: Lang, country?: string | null) {
  const doc = createDoc();
  const ctx = makeCtx(doc, lang, country);
  drawPageChrome(ctx);
  drawIncidentBody(ctx, inc, checklist);
  drawFooters(doc, lang);
  doc.save(`incident-${slug(inc.title)}-${stamp()}.pdf`);
}

function drawCover(ctx: Ctx, incidents: IncidentExport[]) {
  const { doc, pageW, pageH, margin, lang } = ctx;
  // Full-bleed dark hero
  setFill(doc, BRAND.primary);
  doc.rect(0, 0, pageW, 280, "F");
  // Gold strip
  setFill(doc, BRAND.accent);
  doc.rect(0, 280, pageW, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(200, 215, 240);
  doc.text(getReportBrandName(lang).toUpperCase(), margin, 80);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(255, 255, 255);
  doc.text(t("Vorfallregister", "Incident Register", lang), margin, 140);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(210, 222, 245);
  const sub = doc.splitTextToSize(ctx.refs.registerSubtitle, pageW - 2 * margin);
  doc.text(sub, margin, 175);

  doc.setFontSize(9);
  doc.setTextColor(180, 195, 220);
  doc.text(
    `${t("Erstellt am", "Generated", lang)}: ${new Date().toLocaleString(lang === "en" ? "en-GB" : "de-DE")}`,
    margin, 245,
  );

  // Stats cards
  const stats = [
    { label: t("Gesamt", "Total", lang), value: incidents.length, color: BRAND.primary },
    { label: t("Offen", "Open", lang), value: incidents.filter(i => i.status !== "closed").length, color: BRAND.open },
    { label: t("Geschlossen", "Closed", lang), value: incidents.filter(i => i.status === "closed").length, color: BRAND.ok },
    { label: t("Meldepflichtig", "Reportable", lang), value: incidents.filter(i => i.reportable).length, color: BRAND.accent },
  ];
  const cardW = (pageW - 2 * margin - 30) / 4;
  const cardH = 90;
  const cardY = 320;
  stats.forEach((s, i) => {
    const x = margin + i * (cardW + 10);
    setFill(doc, BRAND.surface);
    doc.roundedRect(x, cardY, cardW, cardH, 6, 6, "F");
    setFill(doc, s.color);
    doc.rect(x, cardY, cardW, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    setColor(doc, BRAND.primary);
    doc.text(String(s.value), x + cardW / 2, cardY + 48, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setColor(doc, BRAND.muted);
    doc.text(s.label, x + cardW / 2, cardY + 70, { align: "center" });
  });

  // Index
  let y = cardY + cardH + 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setColor(doc, BRAND.primary);
  doc.text(t("Inhaltsverzeichnis", "Table of contents", lang), margin, y);
  y += 8;
  setDraw(doc, BRAND.rule);
  doc.line(margin, y, pageW - margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  incidents.slice(0, 18).forEach((inc, i) => {
    if (y > pageH - 80) return;
    setColor(doc, BRAND.text);
    doc.text(`${String(i + 1).padStart(2, "0")}.`, margin, y);
    const title = doc.splitTextToSize(inc.title, pageW - 2 * margin - 120)[0];
    doc.text(title, margin + 28, y);
    setColor(doc, BRAND.muted);
    doc.setFontSize(9);
    doc.text(inc.severity?.toUpperCase() || "—", pageW - margin, y, { align: "right" });
    doc.setFontSize(10);
    y += 18;
  });
  if (incidents.length > 18) {
    setColor(doc, BRAND.muted);
    doc.setFontSize(9);
    doc.text(`… +${incidents.length - 18} ${t("weitere", "more", ctx.lang)}`, margin, y);
  }
}

export function generateRegisterPdf(incidents: IncidentExport[], checklist: ChecklistExport[], lang: Lang, country?: string | null) {
  const doc = createDoc();
  const ctx = makeCtx(doc, lang, country);
  drawCover(ctx, incidents);
  incidents.forEach((inc) => {
    doc.addPage();
    ctx.y = 90;
    drawPageChrome(ctx);
    drawIncidentBody(ctx, inc, checklist);
  });
  drawFooters(doc, lang);
  doc.save(`incident-register-${stamp()}.pdf`);
}

// ════════════════════════════════════════════════
//  WORD GENERATION
// ════════════════════════════════════════════════
const COLOR = {
  primary: "14284C",
  primarySoft: "E8EEF8",
  accent: "C9A84C",
  muted: "6E7687",
  text: "192030",
  ok: "22864B",
  warn: "C48E18",
  open: "B43C3C",
  na: "969CA8",
  rule: "DCE2EC",
  surface: "F8FAFD",
};

const RUN = (text: string, opts: Partial<{ bold: boolean; size: number; color: string; italics: boolean }> = {}) =>
  new TextRun({
    text: text || "",
    font: "Calibri",
    size: opts.size ?? 20,
    bold: opts.bold,
    italics: opts.italics,
    color: opts.color ?? COLOR.text,
  });

const P = (children: TextRun[], opts: { before?: number; after?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) =>
  new Paragraph({
    alignment: opts.align,
    children,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 80, line: 300 },
  });

const H1 = (text: string) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160, line: 320 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR.accent, space: 6 } },
    children: [new TextRun({ text, font: "Calibri", size: 32, bold: true, color: COLOR.primary })],
  });

const H2 = (num: string, text: string) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120, line: 300 },
    children: [
      new TextRun({ text: `${num}  `, font: "Calibri", size: 24, bold: true, color: COLOR.accent }),
      new TextRun({ text, font: "Calibri", size: 24, bold: true, color: COLOR.primary }),
    ],
  });

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: COLOR.rule };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

const fieldRow = (label: string, value: string): TableRow =>
  new TableRow({
    children: [
      new TableCell({
        borders, width: { size: 2800, type: WidthType.DXA },
        shading: { fill: COLOR.primarySoft, type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 100, bottom: 100, left: 160, right: 120 },
        children: [P([RUN(label, { bold: true, size: 18, color: COLOR.primary })])],
      }),
      new TableCell({
        borders, width: { size: 6560, type: WidthType.DXA },
        margins: { top: 100, bottom: 100, left: 160, right: 160 },
        children: [P([RUN(value || "—", { size: 20 })])],
      }),
    ],
  });

const dataTable = (rows: TableRow[]) =>
  new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [2800, 6560], rows });

const callout = (title: string, body: string): Table => {
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const accentBorder = { style: BorderStyle.SINGLE, size: 18, color: COLOR.accent };
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { top: noBorder, bottom: noBorder, right: noBorder, left: accentBorder },
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: COLOR.surface, type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 160, bottom: 160, left: 240, right: 200 },
            children: [
              P([RUN(title.toUpperCase(), { bold: true, size: 16, color: COLOR.primary })], { after: 60 }),
              P([RUN(body || "—", { size: 20 })]),
            ],
          }),
        ],
      }),
    ],
  });
};

const statusColor = (s: string) =>
  s === "done" ? COLOR.ok : s === "in_progress" ? COLOR.warn : s === "na" ? COLOR.na : COLOR.open;

const checklistRow = (item: ChecklistExport, lang: Lang): TableRow => {
  const muted = item.status === "na";
  const color = statusColor(item.status);
  return new TableRow({
    children: [
      new TableCell({
        borders, width: { size: 400, type: WidthType.DXA },
        shading: { fill: color, type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 80, bottom: 80, left: 80, right: 80 },
        children: [P([RUN(" ", { size: 16 })])],
      }),
      new TableCell({
        borders, width: { size: 7160, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 140, right: 140 },
        children: [
          P([RUN(item.label, { size: 20, color: muted ? COLOR.muted : COLOR.text })], { after: 40 }),
          ...((item.responsible || item.evidence || item.completed_at)
            ? [P([
                RUN(
                  [
                    item.responsible && `Resp.: ${item.responsible}`,
                    item.evidence && `Evid.: ${item.evidence}`,
                    item.completed_at && `${item.status === "done" ? "Done" : ""}: ${fmtDate(item.completed_at, lang)}`,
                  ].filter(Boolean).join("  ·  "),
                  { size: 16, color: COLOR.muted, italics: true },
                ),
              ])]
            : []),
        ],
      }),
      new TableCell({
        borders, width: { size: 1800, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [P([RUN(statusLabel(item.status, lang).toUpperCase(), { bold: true, size: 16, color })], { align: AlignmentType.RIGHT })],
      }),
    ],
  });
};

function incidentSections(inc: IncidentExport, checklist: ChecklistExport[], lang: Lang, refs: Refs): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(H1(inc.title));
  out.push(P([
    RUN(`${t("Schweregrad", "Severity", lang)}: `, { size: 18, color: COLOR.muted }),
    RUN(`${inc.severity?.toUpperCase() || "—"}`, { size: 18, bold: true, color: COLOR.primary }),
    RUN(`    ·    ${t("Status", "Status", lang)}: `, { size: 18, color: COLOR.muted }),
    RUN(inc.status, { size: 18, bold: true }),
    RUN(`    ·    ${t("Erkannt", "Detected", lang)}: `, { size: 18, color: COLOR.muted }),
    RUN(fmtDate(inc.detected_at, lang), { size: 18 }),
  ], { after: 200 }));

  out.push(H2("1.", t("Vorfalldaten", "Incident data", lang)));
  out.push(dataTable([
    fieldRow(t("Typ", "Type", lang), inc.incident_type),
    fieldRow(t("Aufgetreten am", "Occurred at", lang), fmtDate(inc.occurred_at, lang)),
    fieldRow(t("Erkannt am", "Detected at", lang), fmtDate(inc.detected_at, lang)),
    fieldRow(t("Geschlossen am", "Closed at", lang), fmtDate(inc.closed_at, lang)),
    fieldRow(t("Meldepflichtig", "Reportable", lang), inc.reportable ? t("Ja", "Yes", lang) : t("Nein", "No", lang)),
    fieldRow(t("Behörde / CSIRT informiert", "Authority / CSIRT notified", lang),
      inc.authority_notified ? `${t("Ja", "Yes", lang)}${inc.authority_name ? ` — ${inc.authority_name}` : ""}` : t("Nein", "No", lang)),
    fieldRow(t("Kenntnisgrad", "Awareness", lang), inc.awareness_confidence),
  ]));

  out.push(H2("2.", t("Beschreibung", "Description", lang)));
  out.push(callout(t("Sachverhalt", "Summary", lang), inc.description));

  out.push(H2("3.", refs.mandatoryContent));
  out.push(callout(t("Auswirkungen", "Impact", lang), inc.impact_description));
  out.push(P([RUN(" ", { size: 8 })], { after: 0 }));
  out.push(callout(t("Ergriffene Maßnahmen", "Measures taken", lang), inc.measures_taken));
  out.push(P([RUN(" ", { size: 8 })], { after: 0 }));
  out.push(callout(t("Geplante Maßnahmen", "Measures planned", lang), inc.measures_planned));
  out.push(P([RUN(" ", { size: 8 })], { after: 80 }));
  out.push(dataTable([
    fieldRow(t("Grenzüberschreitend", "Cross-border", lang),
      inc.cross_border_impact ? `${t("Ja", "Yes", lang)} — ${inc.affected_member_states.join(", ") || "—"}` : t("Nein", "No", lang)),
  ]));

  out.push(H2("4.", refs.recipientNotification));
  const recipientRows: TableRow[] = [
    fieldRow(t("Empfänger betroffen", "Recipients affected", lang),
      inc.service_recipients_affected ? t("Ja", "Yes", lang) : t("Nein", "No", lang)),
  ];
  if (inc.service_recipients_affected) {
    recipientRows.push(fieldRow(t("Status", "Status", lang), inc.recipient_notification_status));
    recipientRows.push(fieldRow(t("Versendet am", "Sent at", lang), fmtDate(inc.recipient_notification_sent_at, lang)));
    recipientRows.push(fieldRow(t("Kanal", "Channel", lang), inc.recipient_notification_channel));
  }
  out.push(dataTable(recipientRows));
  if (inc.service_recipients_affected) {
    out.push(P([RUN(" ", { size: 8 })], { after: 0 }));
    out.push(callout(t("Empfängerkreis", "Recipient scope", lang), inc.recipient_notification_scope));
    out.push(P([RUN(" ", { size: 8 })], { after: 0 }));
    out.push(callout(t("Nachweis", "Proof", lang), inc.recipient_notification_proof));
  }

  out.push(H2("5.", t("Ursache & Lessons Learned", "Root cause & lessons learned", lang)));
  out.push(callout(t("Ursache", "Root cause", lang), inc.root_cause));
  out.push(P([RUN(" ", { size: 8 })], { after: 0 }));
  out.push(callout(t("Lessons Learned", "Lessons learned", lang), inc.lessons_learned));

  const items = checklist.filter(c => c.incident_id === inc.id).sort((a, b) => a.sort_order - b.sort_order);
  if (items.length) {
    out.push(H2("6.", t("Meldepflicht-Checkliste", "Reporting checklist", lang)));
    const grouped: Record<string, ChecklistExport[]> = {};
    items.forEach(it => { (grouped[it.phase] ??= []).push(it); });
    Object.entries(grouped).forEach(([phase, list]) => {
      const done = list.filter(i => i.status === "done").length;
      const total = list.filter(i => i.status !== "na").length;
      out.push(P([
        RUN(phaseLabel[phase]?.[lang] || phase, { bold: true, size: 22, color: COLOR.primary }),
        RUN(`    ${done} / ${total || 0}`, { size: 18, color: COLOR.muted }),
      ], { before: 160, after: 80 }));
      out.push(new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [400, 7160, 1800],
        rows: list.map(it => checklistRow(it, lang)),
      }));
    });
  }

  return out;
}

const docHeader = (lang: Lang, title: string) =>
  new Header({
    children: [
      new Paragraph({
        spacing: { after: 60 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR.accent, space: 4 } },
        children: [
          new TextRun({ text: getReportBrandName(lang), bold: true, font: "Calibri", size: 18, color: COLOR.primary }),
          new TextRun({ text: "    ·    ", font: "Calibri", size: 16, color: COLOR.muted }),
          new TextRun({ text: title, font: "Calibri", size: 16, color: COLOR.muted }),
          ...(isNis2Active() ? [
            new TextRun({ text: "    ·    ", font: "Calibri", size: 16, color: COLOR.muted }),
            new TextRun({ text: t("NIS2-Richtlinie (EU) 2022/2555", "NIS2 Directive (EU) 2022/2555", lang), font: "Calibri", size: 16, color: COLOR.muted, italics: true }),
          ] : []),
        ],
      }),
    ],
  });

const docFooter = (lang: Lang) =>
  new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: COLOR.rule, space: 4 } },
        children: [
          new TextRun({ text: t("Vertraulich  ·  ", "Confidential  ·  ", lang), font: "Calibri", size: 16, color: COLOR.muted }),
          new TextRun({ text: t("Seite ", "Page ", lang), font: "Calibri", size: 16, color: COLOR.muted }),
          new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 16, color: COLOR.muted }),
          new TextRun({ text: " / ", font: "Calibri", size: 16, color: COLOR.muted }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Calibri", size: 16, color: COLOR.muted }),
        ],
      }),
    ],
  });

const documentStyles = {
  default: { document: { run: { font: "Calibri", size: 20, color: COLOR.text } } },
  paragraphStyles: [
    {
      id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 32, bold: true, font: "Calibri", color: COLOR.primary },
      paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 },
    },
    {
      id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 24, bold: true, font: "Calibri", color: COLOR.primary },
      paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 },
    },
  ],
};

export async function generateIncidentWord(inc: IncidentExport, checklist: ChecklistExport[], lang: Lang, country?: string | null) {
  const refs = buildRefs(lang, country);
  const doc = new Document({
    styles: documentStyles,
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1200, right: 1080, bottom: 1200, left: 1080 } } },
      headers: { default: docHeader(lang, t("Vorfall-Dokumentation", "Incident Documentation", lang)) },
      footers: { default: docFooter(lang) },
      children: incidentSections(inc, checklist, lang, refs),
    }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `incident-${slug(inc.title)}-${stamp()}.docx`);
}

function wordCover(incidents: IncidentExport[], lang: Lang, refs: Refs): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(P([RUN(getReportBrandName(lang), { bold: true, size: 18, color: COLOR.accent })], { after: 80 }));
  out.push(new Paragraph({
    spacing: { before: 0, after: 120 },
    children: [new TextRun({ text: t("Vorfallregister", "Incident Register", lang), font: "Calibri", size: 56, bold: true, color: COLOR.primary })],
  }));
  out.push(P([RUN(refs.registerSubtitle, { size: 20, color: COLOR.muted, italics: true })], { after: 80 }));
  out.push(P([RUN(`${t("Erstellt am", "Generated", lang)}: ${new Date().toLocaleString(lang === "en" ? "en-GB" : "de-DE")}`, { size: 18, color: COLOR.muted })], { after: 360 }));

  // Stats as 4-column table
  const stat = (label: string, value: number, color: string): TableCell =>
    new TableCell({
      borders: { top: { style: BorderStyle.SINGLE, size: 24, color }, bottom: cellBorder, left: cellBorder, right: cellBorder },
      width: { size: 2340, type: WidthType.DXA },
      shading: { fill: COLOR.surface, type: ShadingType.CLEAR, color: "auto" },
      margins: { top: 240, bottom: 240, left: 160, right: 160 },
      children: [
        P([RUN(String(value), { bold: true, size: 48, color: COLOR.primary })], { align: AlignmentType.CENTER, after: 40 }),
        P([RUN(label, { size: 18, color: COLOR.muted })], { align: AlignmentType.CENTER }),
      ],
    });

  out.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2340, 2340, 2340, 2340],
    rows: [new TableRow({
      children: [
        stat(t("Gesamt", "Total", lang), incidents.length, COLOR.primary),
        stat(t("Offen", "Open", lang), incidents.filter(i => i.status !== "closed").length, COLOR.open),
        stat(t("Geschlossen", "Closed", lang), incidents.filter(i => i.status === "closed").length, COLOR.ok),
        stat(t("Meldepflichtig", "Reportable", lang), incidents.filter(i => i.reportable).length, COLOR.accent),
      ],
    })],
  }));

  out.push(P([RUN(" ", { size: 8 })], { before: 200 }));
  out.push(H1(t("Inhaltsverzeichnis", "Table of contents", lang)));
  incidents.forEach((inc, i) => {
    out.push(P([
      RUN(`${String(i + 1).padStart(2, "0")}.  `, { bold: true, color: COLOR.accent }),
      RUN(inc.title, { color: COLOR.text }),
      RUN(`    ·    ${inc.severity?.toUpperCase() || "—"}`, { size: 16, color: COLOR.muted }),
    ], { after: 60 }));
  });
  return out;
}

export async function generateRegisterWord(incidents: IncidentExport[], checklist: ChecklistExport[], lang: Lang, country?: string | null) {
  const refs = buildRefs(lang, country);
  const children: (Paragraph | Table)[] = [...wordCover(incidents, lang, refs)];
  incidents.forEach(inc => {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    incidentSections(inc, checklist, lang, refs).forEach(el => children.push(el));
  });

  const doc = new Document({
    styles: documentStyles,
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1200, right: 1080, bottom: 1200, left: 1080 } } },
      headers: { default: docHeader(lang, t("Vorfallregister", "Incident Register", lang)) },
      footers: { default: docFooter(lang) },
      children,
    }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `incident-register-${stamp()}.docx`);
}

// ── helpers ──
const stamp = () => new Date().toISOString().slice(0, 10);
const slug = (s: string) => (s || "incident").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

/** Vorfallregister als Excel — Meldefristen und Status filterbar. */
export async function generateRegisterExcel(incidents: any[], lang: Lang = "de") {
  const de = lang === "de";
  await exportBrandedXlsx({
    fileBase: de ? "Vorfallregister" : "Incident-register",
    title: de ? "Vorfallregister" : "Incident register",
    lang,
    scope: de ? `${incidents.length} Vorfälle` : `${incidents.length} incidents`,
    sheets: [{
      name: de ? "Vorfälle" : "Incidents",
      note: de
        ? "NIS2 Art. 23: Fruehwarnung binnen 24 h, Meldung binnen 72 h, Abschlussbericht binnen eines Monats."
        : "NIS2 Art. 23: early warning within 24 h, notification within 72 h, final report within one month.",
      statusKey: "status",
      columns: [
        { header: "ID", key: "id", width: 16 },
        { header: de ? "Titel" : "Title", key: "t", width: 48 },
        { header: de ? "Erkannt am" : "Detected", key: "d", width: 18 },
        { header: de ? "Schweregrad" : "Severity", key: "sv", width: 14 },
        { header: de ? "Meldepflichtig" : "Notifiable", key: "np", width: 14 },
        { header: de ? "Frühwarnung (24 h)" : "Early warning (24 h)", key: "w24", width: 18 },
        { header: de ? "Meldung (72 h)" : "Notification (72 h)", key: "w72", width: 18 },
        { header: de ? "Abschlussbericht" : "Final report", key: "fin", width: 18 },
        { header: de ? "Status" : "Status", key: "status", width: 16 },
        { header: de ? "Verantwortlich" : "Owner", key: "o", width: 24 },
      ],
      rows: (incidents ?? []).map((i: any) => ({
        id: i.id ?? "", t: i.title ?? i.name ?? "",
        d: i.detected_at ?? i.detectedAt ?? "",
        sv: i.severity ?? "", np: i.notifiable ? (de ? "Ja" : "Yes") : "",
        w24: i.early_warning_at ?? i.earlyWarningAt ?? "",
        w72: i.notification_at ?? i.notificationAt ?? "",
        fin: i.final_report_at ?? i.finalReportAt ?? "",
        status: i.status ?? "", o: i.owner ?? "",
      })),
    }],
  });
}
