import { jsPDF } from "jspdf";
import { RT } from "@/lib/reportTheme";
import { exportBrandedXlsx } from "@/lib/reportXlsxKit";
import { isoEntry } from "@/data/isoAnnexMap";
import html2canvas from "html2canvas";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, ShadingType, BorderStyle, Header, Footer, PageNumber } from "docx";
import { saveAs } from "file-saver";
import type { Lang } from "@/contexts/LanguageContext";
import type { SoAProjection, SoAProjectedControl, SoAProjectedCategory } from "@/lib/soaProjection";
import { soaStatusClass, validateSoAStats, SOA_REASON_LABEL } from "@/lib/soaProjection";
import type { GapSummary } from "@/lib/gapEngine";
import { getReportBrandName, getReportBrandSlug } from "@/lib/reportBrand";
import { addCanvasPaged, domCutEdges } from "@/lib/reportPaginate";
import type { KiSystem } from "@/lib/kiGovernance";
import { ROLLE_META, KLASSE_LABEL } from "@/lib/kiGovernance";
import { activeSystems, buildAiActMatrix, summarizeMatrix, matrixConsistency, type MatrixRow, type SystemSummary, type ConsistencyIssue } from "@/lib/aiActMatrix";

// ── Zeilenstatus — EINE Klassifikation für Zeilen und Kacheln (soaStatusClass) ──
const fmtDay = (iso: string | undefined, lang: Lang) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso ?? "";
  const [y, m, d] = iso.split("-");
  return lang === "de" ? `${d}.${m}.${y}` : `${y}-${m}-${d}`;
};
const statusLabel = (c: SoAProjectedControl, lang: Lang): string => {
  const de = lang === "de";
  switch (soaStatusClass(c)) {
    case "na": return de ? "Nicht anwendbar" : "Not Applicable";
    case "spaeter": return de ? `Gilt ab ${fmtDay(c.catalog?.appliesFrom, lang)}` : `Applies from ${fmtDay(c.catalog?.appliesFrom, lang)}`;
    case "ja": return de ? "Umgesetzt" : "Implemented";
    case "teilweise": return de ? "Teilweise umgesetzt" : "Partially Implemented";
    case "nein": return de ? "Nicht umgesetzt" : "Not Implemented";
    default: return de ? "Nicht bewertet" : "Not Assessed";
  }
};
const statusColor = (c: SoAProjectedControl): string => {
  const k = soaStatusClass(c);
  if (k === "na") return "#6b7280";
  if (k === "ja") return RT.stJa;
  if (k === "teilweise") return RT.stTeilweise;
  if (k === "nein") return RT.stNein;
  if (k === "spaeter") return "#1d4ed8";
  return "#9ca3af";
};
const statusBg = (c: SoAProjectedControl): string => {
  const k = soaStatusClass(c);
  if (k === "na") return "#f3f4f6";
  if (k === "ja") return RT.stJaBg;
  if (k === "teilweise") return "#fef3c7";
  if (k === "nein") return RT.stNeinBg;
  if (k === "spaeter") return "#dbeafe";
  return "#f9fafb";
};

const ROLE_LABEL: Record<string, { de: string; en: string }> = {
  anbieter: { de: "Anbieter", en: "Provider" }, betreiber: { de: "Betreiber", en: "Deployer" },
  einfuehrer: { de: "Einführer", en: "Importer" }, haendler: { de: "Händler", en: "Distributor" },
  gpai_anbieter: { de: "GPAI-Anbieter", en: "GPAI provider" },
};
const POLICY_LABEL: Record<string, { de: string; en: string }> = {
  interne_praxis: { de: "Interne gute Praxis (keine gesetzliche Formvorgabe)", en: "Internal good practice (no statutory form requirement)" },
  interne_vorgabe: { de: "Interne Vorgabe", en: "Internal target" },
};

/**
 * Begründungsspalte (Befunde C-2/C-3): „nicht anwendbar" braucht Begründung und
 * Begründungsart; „anwendbar" nennt die Einbeziehungsgrundlage (Rechtspflicht bzw.
 * interne Vorgabe) statt „—".
 */
export function soaJustificationText(c: SoAProjectedControl, lang: Lang): { text: string; missing: boolean } {
  const de = lang === "de";
  const applicable = c.applicable && !c.isExcluded;
  if (!applicable) {
    if (c.isExcluded && c.exclusionReason) return { text: c.exclusionReason, missing: false };
    if (!c.justification) return { text: de ? "Begründung fehlt — vor Freigabe ergänzen" : "Justification missing — add before approval", missing: true };
    const rt = c.reasonType ? SOA_REASON_LABEL[c.reasonType]?.[de ? "de" : "en"] : "";
    return { text: rt ? `[${rt}] ${c.justification}` : c.justification, missing: false };
  }
  if (c.justification) return { text: c.justification, missing: false };
  const flag = c.catalog?.policyFlag ? POLICY_LABEL[c.catalog.policyFlag]?.[de ? "de" : "en"] : "";
  const basis = c.catalog?.legalRef;
  if (flag && basis) return { text: `${flag}; ${de ? "Bezug" : "anchor"}: ${basis}`, missing: false };
  if (basis) return { text: `${de ? "Rechtspflicht" : "Legal duty"}: ${basis}`, missing: false };
  if (flag) return { text: flag, missing: false };
  return { text: c.linkedRisks.length ? (de ? "Risikobehandlung (Phase 04)" : "Risk treatment (phase 04)") : "—", missing: false };
}

/** Zusatzzeilen unter dem Kontrolltext: Rolle, Geltungsbeginn, gesetzlicher Auslöser, Übersicht. */
function catalogLines(c: SoAProjectedControl, lang: Lang): string[] {
  const de = lang === "de";
  const out: string[] = [];
  const cat = c.catalog;
  if (c.isRollup) out.push(de ? "Übersicht — Status aus den Einzelkontrollen abgeleitet, nicht gezählt" : "Overview — status derived from the individual controls, not counted");
  if (cat?.role?.length) out.push(`${de ? "Rolle" : "Role"}: ${cat.role.map(r => ROLE_LABEL[r]?.[de ? "de" : "en"] ?? r).join(", ")}`);
  if (cat?.appliesFrom) out.push(`${de ? "Gilt ab" : "Applies from"} ${fmtDay(cat.appliesFrom, lang)}${cat.appliesFromNote ? ` — ${cat.appliesFromNote}` : ""}`);
  if (cat?.statutoryTrigger) out.push(`${de ? "Gesetzlicher Auslöser" : "Statutory trigger"}: ${cat.statutoryTrigger}${cat.internalTarget ? ` · ${de ? "interne Vorgabe" : "internal target"}: ${cat.internalTarget}` : ""}`);
  return out;
}

/** Rechtsstand je Framework (Befund C-11). */
const LEGAL_BASELINE: Record<string, { de: string; en: string }> = {
  AIACT: {
    de: "Rechtsstand: VO (EU) 2024/1689 (AI Act) i. d. F. der VO (EU) 2026/1744, konsolidiert 27.07.2026; Leitlinien zu Art. 50, C(2026) 5054 vom 20.07.2026.",
    en: "Legal baseline: Regulation (EU) 2024/1689 (AI Act) as amended by Regulation (EU) 2026/1744, consolidated 27 July 2026; Article 50 Guidelines C(2026) 5054 of 20 July 2026.",
  },
};

export interface SoAReportContext {
  /** FrameworkKey des exportierten Katalogs (z. B. "ISO27001", "AIACT"). */
  frameworkKey?: string;
  frameworkLabel?: string;
  /** AI Act: Systeme aus dem KI-Register → Matrix System × Rolle × Kontrolle (C-5/C-7). */
  aiSystems?: KiSystem[];
}

interface AiMatrixData { rows: MatrixRow[]; summary: SystemSummary[]; issues: ConsistencyIssue[] }
/** Matrix nur für den AI-Act-Katalog und nur mit aktiven Systemen. */
function aiMatrixData(projection: SoAProjection, ctx: SoAReportContext | undefined): AiMatrixData | null {
  if (ctx?.frameworkKey !== "AIACT" || !activeSystems(ctx.aiSystems).length) return null;
  const rows = buildAiActMatrix(projection.systemControls, ctx.aiSystems!);
  return { rows, summary: summarizeMatrix(rows), issues: matrixConsistency(projection.systemControls, ctx.aiSystems!) };
}
const MATRIX_STATUS: Record<string, { de: string; en: string }> = {
  ja: { de: "Umgesetzt", en: "Implemented" }, teilweise: { de: "Teilweise", en: "Partial" },
  nein: { de: "Nicht umgesetzt", en: "Not implemented" }, spaeter: { de: "Gilt später", en: "Applies later" },
  offen: { de: "Nicht bewertet", en: "Not assessed" }, na: { de: "Nicht anwendbar", en: "Not applicable" },
};
const ISSUE_LABEL: Record<string, { de: string; en: string }> = {
  konflikt: { de: "Konflikt", en: "Conflict" }, pruefen: { de: "Prüfen", en: "Check" }, angaben: { de: "Angaben fehlen", en: "Details missing" },
};
const MATRIX_NOTE = {
  de: "Je KI-System aus dem KI-Register: welche Kontrollen in seiner Rolle und Risikoklasse greifen. Der Umsetzungsstatus stammt aus der Gap-Analyse und gilt je Kontrolle für die Organisation. Die Rolle „GPAI-Modellanbieter“ ist im Register nicht erfasst; Kapitel V wird daher keinem System zugeordnet.",
  en: "Per AI system from the AI register: which controls apply in its role and risk class. Implementation status comes from the gap analysis and applies per control for the organisation. The role \"GPAI model provider\" is not recorded in the register; Chapter V is therefore not assigned to any system.",
};

/** Titel (Befund C-8): nur der ISO-27001-Katalog IST die SoA; alle anderen sind Anhänge dazu. */
function reportTitles(ctx: SoAReportContext | undefined, lang: Lang): { title: string; subtitle: string; note: string } {
  const de = lang === "de";
  const iso = !ctx?.frameworkKey || ctx.frameworkKey === "ISO27001";
  if (iso) return {
    title: de ? "Anwendbarkeitserklärung (SoA)" : "Statement of Applicability (SoA)",
    subtitle: de ? "Erklärung zur Anwendbarkeit (ISO/IEC 27001 Kap. 6.1.3 d)" : "Statement of Applicability (ISO/IEC 27001 cl. 6.1.3 d)",
    note: "",
  };
  const label = ctx?.frameworkLabel || ctx?.frameworkKey || "";
  return {
    title: de ? `Kontrollkatalog ${label} — Anhang zur Anwendbarkeitserklärung` : `${label} control annex to the Statement of Applicability`,
    subtitle: de ? "Anhang zur Erklärung zur Anwendbarkeit nach ISO/IEC 27001 Kap. 6.1.3 d" : "Annex to the Statement of Applicability under ISO/IEC 27001 cl. 6.1.3 d",
    note: de
      ? "Dieser Anhang ergänzt die Anwendbarkeitserklärung zu ISO/IEC 27001 Anhang A. Bezug: Risikoregister und Risikobehandlung (Phase 04), Abgleich mit Anhang A in der ISO-27001-SoA."
      : "This annex supplements the Statement of Applicability for ISO/IEC 27001 Annex A. References: risk register and risk treatment (phase 04), Annex A comparison in the ISO 27001 SoA.",
  };
}

/** Export nur, wenn Kacheln und Zeilen übereinstimmen (Befund C-1). */
function assertSoAConsistent(projection: SoAProjection, lang: Lang): void {
  const v = validateSoAStats(projection);
  if (v.ok) return;
  const bad = v.checks.filter(c => !c.ok).map(c => `${c.label[lang === "de" ? "de" : "en"]}: ${c.detail}`).join("; ");
  throw new Error((lang === "de" ? "SoA-Export abgebrochen — Zählung inkonsistent: " : "SoA export aborted — inconsistent counts: ") + bad);
}

/** Legende (Befund C-4): Statusbedeutungen, „Ausgeschlossen" vs. „Nicht anwendbar". */
function legendItems(lang: Lang): Array<[string, string]> {
  const de = lang === "de";
  return de ? [
    ["Nicht anwendbar", "Die Kontrolle wird für diese Organisation, dieses System oder diese Rolle nicht ausgelöst — mit Begründung und Begründungsart."],
    ["Ausgeschlossen", "In der Risikobehandlung (Phase 04) durch Leitungsentscheidung bewusst abgelehnt; erscheint gesondert unter „Abgelehnte Kontrollen“."],
    ["Gilt ab …", "Anwendbar, die gesetzliche Pflicht beginnt aber erst zum genannten Datum; bis dahin kein „Nicht umgesetzt“."],
    ["Nicht bewertet", "Anwendbar, aber in der Gap-Analyse noch ohne Umsetzungsstatus."],
    ["Übersicht", "Nicht bewertete Sammelzeile; ihr Status wird aus den Einzelkontrollen abgeleitet und nicht mitgezählt."],
  ] : [
    ["Not applicable", "The control is not triggered for this organisation, system or role — with justification and reason type."],
    ["Excluded", "Deliberately rejected in risk treatment (phase 04) by management decision; listed separately under “Rejected controls”."],
    ["Applies from …", "Applicable, but the statutory duty only starts on the date shown; no “Not implemented” before then."],
    ["Not assessed", "Applicable, but no implementation status in the gap analysis yet."],
    ["Overview", "Non-scored roll-up row; its status is derived from the individual controls and not counted."],
  ];
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const PAGE = { width: 210, height: 297, margin: 12, gap: 4, footerH: 10 };

function sectionShell(title: string, content: string, subtitle?: string) {
  return `
    <section data-pdf-section style="box-sizing:border-box;width:770px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px 26px;margin:0 0 14px;box-shadow:0 10px 30px rgba(15,23,42,0.05);overflow:visible;">
      <div style="margin:0 0 14px;padding-bottom:8px;border-bottom:2px solid ${RT.copper};">
        <div style="font-family:Arial,sans-serif;font-size:18px;font-weight:800;color:#1A2E41;letter-spacing:-0.2px;">${escapeHtml(title)}</div>
        ${subtitle ? `<div style="margin-top:4px;font-family:Arial,sans-serif;font-size:10px;line-height:1.5;color:${RT.stNa};">${escapeHtml(subtitle)}</div>` : ""}
      </div>
      ${content}
    </section>
  `;
}

async function renderSectionsToPdf(sections: string[], filename: string) {
  const { pdfProgress } = await import("@/lib/pdfProgress");
  const wasActive = pdfProgress.getState().active;
  if (!wasActive) pdfProgress.start(filename.replace(/\.pdf$/i, ""));
  pdfProgress.update(0, 1, "prepare");
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-99999px;top:0;width:794px;padding:0;background:#ffffff;z-index:-1;";
  container.innerHTML = sections.join("");
  document.body.appendChild(container);
  try {
    if ("fonts" in document) await (document as any).fonts?.ready;
    await new Promise(r => setTimeout(r, 120));
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const contentWidth = PAGE.width - PAGE.margin * 2;
    const contentHeight = PAGE.height - PAGE.margin * 2;
    let currentY = PAGE.margin;
    const nodes = Array.from(container.querySelectorAll("[data-pdf-section]")) as HTMLElement[];
    pdfProgress.setTotal(nodes.length, "render");
    let _i = 0;
    for (const node of nodes) {
      const canvas = await html2canvas(node, { scale: 1.5, useCORS: true, backgroundColor: "#ffffff", logging: false, windowWidth: 794 });
      // Nur an echten Blockkanten schneiden (Tabellenzeile, Karte, Absatz) —
      // sonst trennt ein Streifen mitten durch eine Zeile.
      const edges = domCutEdges(node, canvas.height);
      // Gemeinsamer Seitenumbruch an Lücken: Inhalte werden nicht mittendrin geschnitten.
      currentY = addCanvasPaged(pdf, canvas, { pageW: PAGE.width, pageH: PAGE.height, margin: PAGE.margin, gap: PAGE.gap }, currentY, 0.90, edges);
      _i++;
      pdfProgress.update(_i);
      await new Promise(r => setTimeout(r, 0));
    }
    pdfProgress.finalize();
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`${i}/${totalPages}`, PAGE.width / 2, PAGE.height - 5, { align: "center" });
    }
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
    if (!wasActive) pdfProgress.end();
  }
}

// ── Shared row renderer ──

function controlRowHtml(ctrl: SoAProjectedControl, lang: Lang): string {
  const de = lang === "de";
  // B-38: Ausgeschlossene Kontrollen sind NICHT „anwendbar" (sie stehen unter
  // „Abgelehnte Kontrollen") — sonst widerspricht die Kategorietabelle sich selbst.
  const app = ctrl.applicable && !ctrl.isExcluded;
  const bg = statusBg(ctrl);
  const color = statusColor(ctrl);
  const applicableText = app ? (de ? "Anwendbar" : "Applicable") : (de ? "Nicht anwendbar" : "Not Applicable");
  const j = soaJustificationText(ctrl, lang);
  const justification = j.missing ? `<span style="color:${RT.stNein};font-weight:600;">${escapeHtml(j.text)}</span>` : escapeHtml(j.text);
  const name = de ? ctrl.name : ctrl.nameEn;
  const extra = catalogLines(ctrl, lang).map(l => `<div style="margin-top:1px;font-size:9px;color:${RT.stNa};">${escapeHtml(l)}</div>`).join("");
  const riskBadges = ctrl.linkedRisks.length > 0
    ? `<div style="margin-top:2px;font-size:9px;color:#6366f1;">${ctrl.linkedRisks.map(r => escapeHtml(r.risk_id.replace("risk-", "R-").toUpperCase().slice(0, 12))).join(", ")}</div>`
    : "";
  const ownerLine = ctrl.owner ? `<div style="margin-top:1px;font-size:9px;color:${RT.stNa};">${escapeHtml((de ? "Verantw.: " : "Owner: ") + ctrl.owner)}</div>` : "";

  return `<tr>
    <td style="padding:6px 8px;font-weight:600;white-space:nowrap;font-size:11px;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;">${escapeHtml(ctrl.id.toUpperCase())}</td>
    <td style="padding:6px 8px;font-size:11px;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;line-height:1.4;">${escapeHtml(name)}${ownerLine}${extra}${riskBadges}</td>
    <td style="padding:6px 8px;text-align:center;font-size:11px;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;">${applicableText}</td>
    <td style="padding:6px 8px;text-align:center;border-bottom:1px solid #e2e8f0;"><span style="background:${bg};color:${color};padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;font-family:Arial,sans-serif;white-space:nowrap;">${escapeHtml(statusLabel(ctrl, lang))}</span></td>
    <td style="padding:6px 8px;font-size:10px;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;color:#475569;line-height:1.4;">${justification}</td>
  </tr>`;
}

function tableHeader(lang: Lang): string {
  const de = lang === "de";
  return `<thead><tr style="background:#1A2E41;">
    <th style="padding:8px;color:white;font-size:10px;text-align:left;font-family:Arial,sans-serif;font-weight:600;">ID</th>
    <th style="padding:8px;color:white;font-size:10px;text-align:left;font-family:Arial,sans-serif;font-weight:600;">${de ? "Kontrolle" : "Control"}</th>
    <th style="padding:8px;color:white;font-size:10px;text-align:center;font-family:Arial,sans-serif;font-weight:600;">${de ? "Anwendbar" : "Applicable"}</th>
    <th style="padding:8px;color:white;font-size:10px;text-align:center;font-family:Arial,sans-serif;font-weight:600;">Status</th>
    <th style="padding:8px;color:white;font-size:10px;text-align:left;font-family:Arial,sans-serif;font-weight:600;">${de ? "Begründung" : "Justification"}</th>
  </tr></thead>`;
}

// ── PDF Generator ──

export const generateSoAPDF = async (projection: SoAProjection, lang: Lang, gapSummary?: GapSummary | null, ctx?: SoAReportContext) => {
  const de = lang === "de";
  assertSoAConsistent(projection, lang);
  const dateStr = new Date().toLocaleDateString(de ? "de-DE" : "en-US");
  const s = projection.stats;
  const T = reportTitles(ctx, lang);
  const baseline = ctx?.frameworkKey ? LEGAL_BASELINE[ctx.frameworkKey]?.[de ? "de" : "en"] : undefined;

  // Hero section
  const heroSection = `
    <section data-pdf-section style="box-sizing:border-box;width:770px;background:linear-gradient(135deg,#1A2E41 0%,#28488A 100%);border-radius:16px;padding:28px 32px;margin:0 0 14px;color:white;overflow:visible;">
      <div style="font-family:Arial,sans-serif;font-size:24px;font-weight:800;margin-bottom:6px;">${getReportBrandName(lang)}</div>
      <div style="font-family:Arial,sans-serif;font-size:16px;font-weight:600;margin-bottom:4px;opacity:0.95;">
        ${escapeHtml(T.title)}
      </div>
      <div style="font-family:Arial,sans-serif;font-size:11px;opacity:0.8;">
        ${escapeHtml(T.subtitle)} · ${escapeHtml(dateStr)}
      </div>
      ${baseline ? `<div style="font-family:Arial,sans-serif;font-size:10px;opacity:0.85;margin-top:6px;">${escapeHtml(baseline)}</div>` : ""}
      ${T.note ? `<div style="font-family:Arial,sans-serif;font-size:10px;opacity:0.85;margin-top:4px;">${escapeHtml(T.note)}</div>` : ""}
    </section>
  `;

  // Stats section
  const statBox = (label: string, value: number, color: string) => `
    <div style="flex:1;text-align:center;padding:12px 6px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
      <div style="font-family:Arial,sans-serif;font-size:22px;font-weight:800;color:${color};">${value}</div>
      <div style="margin-top:3px;font-family:Arial,sans-serif;font-size:9px;color:${RT.stNa};">${escapeHtml(label)}</div>
    </div>
  `;

  // SoA stats section (prominent, first)
  const statsContent = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      ${statBox(de ? "Gesamt" : "Total", s.total, "#1A2E41")}
      ${statBox(de ? "Anwendbar" : "Applicable", s.applicable, RT.stJa)}
      ${statBox(de ? "Manuell hinzugef." : "Manual Added", s.manualCount, RT.stTeilweise)}
      ${statBox(de ? "Umgesetzt" : "Implemented", s.implemented, RT.stJa)}
      ${statBox(de ? "Teilweise" : "Partial", s.partial, RT.stTeilweise)}
      ${statBox(de ? "Nicht umg." : "Not Impl.", s.notImplemented, RT.stNein)}
      ${statBox(de ? "Nicht bew." : "Not Assessed", s.notAssessed, "#9ca3af")}
      ${s.notYetApplicable ? statBox(de ? "Gilt später" : "Applies later", s.notYetApplicable, "#1d4ed8") : ""}
      ${statBox(de ? "Nicht anw." : "Not Applic.", s.notApplicable, "#6b7280")}
      ${statBox(de ? "Ausgeschl." : "Excluded", s.excludedCount, "#991b1b")}
    </div>
    <div style="margin-top:10px;font-family:Arial,sans-serif;font-size:9.5px;line-height:1.5;color:#475569;">
      ${legendItems(lang).map(([k, v]) => `<div><b>${escapeHtml(k)}:</b> ${escapeHtml(v)}</div>`).join("")}
    </div>
  `;
  const statsSection = sectionShell(de ? "SoA Übersicht" : "SoA Overview", statsContent);

  // Gap Analysis summary section (subdued, below SoA)
  let gapSection = "";
  if (gapSummary) {
    const gapStatBox = (label: string, value: number, color: string) => `
      <div style="flex:1;text-align:center;padding:10px 6px;background:${RT.stNaBg};border:1px solid #e2e8f0;border-radius:8px;">
        <div style="font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:${color};">${value}</div>
        <div style="margin-top:2px;font-family:Arial,sans-serif;font-size:8px;color:${RT.stNa};">${escapeHtml(label)}</div>
      </div>
    `;
    const gapContent = `
      <div style="display:flex;gap:8px;">
        ${gapStatBox(de ? "Kontrollen" : "Controls", gapSummary.totalControls, "#475569")}
        ${gapStatBox(de ? "Ohne Gap" : "Without Gap", gapSummary.processedWithoutGap, RT.stJa)}
        ${gapStatBox(de ? "Mit Gap" : "With Gap", gapSummary.processedWithGap, RT.stNein)}
        ${gapStatBox(de ? "Nicht bearb." : "Not Assessed", gapSummary.unprocessedControls, "#9ca3af")}
        ${gapStatBox(de ? "Kons. Gaps" : "Consol. Gaps", gapSummary.totalGaps, RT.stTeilweise)}
      </div>
    `;
    gapSection = `
      <section data-pdf-section style="box-sizing:border-box;width:770px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 22px;margin:0 0 14px;overflow:visible;">
        <div style="margin:0 0 10px;">
          <div style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:${RT.stNa};text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(de ? "Gap-Analyse" : "Gap Analysis")}</div>
        </div>
        ${gapContent}
      </section>
    `;
  }

  // Category table sections (from projection categories)
  const catSections = projection.categories.map(cat => {
    const rows = cat.controls.map(ctrl => controlRowHtml(ctrl, lang)).join("");
    return sectionShell(
      `${cat.article} — ${de ? cat.title : cat.titleEn}`,
      `<table style="width:100%;border-collapse:collapse;">${tableHeader(lang)}<tbody>${rows}</tbody></table>`
    );
  });

  // Manual controls section
  const manualSections: string[] = [];
  if (projection.manualControls.length > 0) {
    const rows = projection.manualControls.map(ctrl => controlRowHtml(ctrl, lang)).join("");
    manualSections.push(sectionShell(
      de ? "Manuell hinzugefügte Kontrollen" : "Manually Added Controls",
      `<table style="width:100%;border-collapse:collapse;">${tableHeader(lang)}<tbody>${rows}</tbody></table>`,
      de ? `${projection.manualControls.length} Kontrollen aus der Risikobehandlung` : `${projection.manualControls.length} controls from Risk Treatment`
    ));
  }

  // Excluded controls section
  const excludedSections: string[] = [];
  if (projection.excludedControls.length > 0) {
    const rows = projection.excludedControls.map(ctrl => {
      const name = de ? ctrl.name : ctrl.nameEn;
      const reason = ctrl.exclusionReason ? escapeHtml(ctrl.exclusionReason) : (de ? "Keine Begründung" : "No reason");
      const riskBadges = ctrl.linkedRisks.length > 0
        ? `<span style="font-size:9px;color:#6366f1;margin-left:6px;">${ctrl.linkedRisks.map(r => escapeHtml(r.risk_id.replace("risk-", "R-").toUpperCase().slice(0, 12))).join(", ")}</span>`
        : "";
      return `<tr>
        <td style="padding:6px 8px;font-weight:600;font-size:11px;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;">${escapeHtml(ctrl.id.toUpperCase())}</td>
        <td style="padding:6px 8px;font-size:11px;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;">${escapeHtml(name)}${riskBadges}</td>
        <td style="padding:6px 8px;font-size:10px;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;color:${RT.stNein};">${reason}</td>
      </tr>`;
    }).join("");
    excludedSections.push(sectionShell(
      de ? "Abgelehnte Kontrollen" : "Rejected Controls",
      `<table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#991b1b;">
          <th style="padding:8px;color:white;font-size:10px;text-align:left;font-family:Arial,sans-serif;">ID</th>
          <th style="padding:8px;color:white;font-size:10px;text-align:left;font-family:Arial,sans-serif;">${de ? "Kontrolle" : "Control"}</th>
          <th style="padding:8px;color:white;font-size:10px;text-align:left;font-family:Arial,sans-serif;">${de ? "Ablehnungsgrund" : "Rejection Reason"}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`,
      de ? `${projection.excludedControls.length} Kontrollen in der Risikobehandlung abgelehnt` : `${projection.excludedControls.length} controls rejected in Risk Treatment`
    ));
  }

  // AI Act: Matrix System × Rolle × Kontrolle (C-5) + Rollenkonsistenz (C-7)
  const matrixSections: string[] = [];
  const md = aiMatrixData(projection, ctx);
  if (md) {
    const th = (t: string) => `<th style="padding:6px;color:white;font-size:9px;text-align:left;font-family:Arial,sans-serif;">${escapeHtml(t)}</th>`;
    const td = (t: string, extra = "") => `<td style="padding:5px 6px;font-size:9.5px;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;vertical-align:top;${extra}">${t}</td>`;
    const sumRows = md.summary.map(x => `<tr>
      ${td(`<b>${escapeHtml(x.systemId)}</b>`)}${td(`${escapeHtml(x.name)}${x.version ? ` · ${escapeHtml(x.version)}` : ""}`)}
      ${td(escapeHtml(ROLLE_META[x.rolle]?.[de ? "de" : "en"] ?? x.rolle))}${td(escapeHtml(KLASSE_LABEL[x.risikoklasse]?.[de ? "de" : "en"] ?? x.risikoklasse))}
      ${td(escapeHtml(x.owner || "—"))}${td(escapeHtml(x.assessedAt ? fmtDay(x.assessedAt, lang) : "—"))}${td(escapeHtml(x.approvedBy || "—"))}
      ${td(String(x.applicable), "text-align:right;font-weight:700")}${td(String(x.implemented), `text-align:right;color:${RT.stJa}`)}${td(String(x.partial), `text-align:right;color:${RT.stTeilweise}`)}
      ${td(String(x.open), `text-align:right;color:${RT.stNein}`)}${td(String(x.later), "text-align:right;color:#1d4ed8")}
    </tr>`).join("");
    matrixSections.push(sectionShell(
      de ? "KI-Systeme × Rolle × Kontrolle" : "AI systems × role × control",
      `<table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#1A2E41;">
        ${th("ID")}${th(de ? "System · Version" : "System · version")}${th(de ? "Rolle" : "Role")}${th(de ? "Klasse" : "Class")}${th(de ? "Verantwortlich" : "Owner")}${th(de ? "Bewertet" : "Assessed")}${th(de ? "Freigabe" : "Approved by")}${th(de ? "Anw." : "Appl.")}${th(de ? "Umg." : "Impl.")}${th(de ? "Teilw." : "Part.")}${th(de ? "Offen" : "Open")}${th(de ? "Später" : "Later")}
      </tr></thead><tbody>${sumRows}</tbody></table>`,
      MATRIX_NOTE[de ? "de" : "en"],
    ));
    for (const x of md.summary) {
      const mine = md.rows.filter(r => r.systemId === x.systemId && r.applies);
      const groups = (["nein", "teilweise", "offen", "spaeter", "ja"] as const).map(k => {
        const ids = mine.filter(r => r.status === k).map(r => r.controlId.replace("AIACT-", ""));
        return ids.length ? `<div style="margin:3px 0;font-family:Arial,sans-serif;font-size:9.5px;line-height:1.5;"><b>${escapeHtml(MATRIX_STATUS[k][de ? "de" : "en"])} (${ids.length}):</b> ${escapeHtml(ids.join(", "))}</div>` : "";
      }).join("");
      const ev = x.evidence.length ? `<div style="margin-top:6px;font-family:Arial,sans-serif;font-size:9px;color:#475569;"><b>${de ? "Nachweise" : "Evidence"}:</b> ${x.evidence.map(escapeHtml).join(" · ")}</div>` : "";
      matrixSections.push(sectionShell(`${x.systemId} — ${x.name}`, groups + ev,
        `${ROLLE_META[x.rolle]?.[de ? "de" : "en"] ?? x.rolle} · ${KLASSE_LABEL[x.risikoklasse]?.[de ? "de" : "en"] ?? x.risikoklasse} · ${x.applicable} ${de ? "anwendbare Kontrollen" : "applicable controls"}`));
    }
    if (md.issues.length) {
      const list = md.issues.map(i => `<li style="margin:2px 0;color:${i.kind === "konflikt" ? RT.stNein : i.kind === "pruefen" ? RT.stTeilweise : "#475569"}"><b>${escapeHtml(ISSUE_LABEL[i.kind][de ? "de" : "en"])}:</b> ${escapeHtml(i.text[de ? "de" : "en"])}</li>`).join("");
      matrixSections.push(sectionShell(de ? "Rollenkonsistenz je System" : "Role consistency per system",
        `<ul style="margin:0 0 0 16px;padding:0;font-family:Arial,sans-serif;font-size:9.5px;line-height:1.5;">${list}</ul>`,
        de ? "Konflikt: „nicht anwendbar\", obwohl ein System die Pflicht auslöst. Prüfen: anwendbar, aber kein System löst sie aus." : "Conflict: \"not applicable\" although a system triggers the duty. Check: applicable, but no system triggers it."));
    }
  }

  const allSections = [heroSection, statsSection, ...(gapSection ? [gapSection] : []), ...matrixSections, ...catSections, ...manualSections, ...excludedSections];
  const suffix = ctx?.frameworkKey && ctx.frameworkKey !== "ISO27001" ? `-${ctx.frameworkKey}` : "";
  await renderSectionsToPdf(allSections, `${getReportBrandName(de)} - SoA${suffix}-${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ── Word Generator ──

export const generateSoAWord = async (projection: SoAProjection, lang: Lang, gapSummary?: GapSummary | null, ctx?: SoAReportContext) => {
  const de = lang === "de";
  assertSoAConsistent(projection, lang);
  const s = projection.stats;
  const T = reportTitles(ctx, lang);
  const baseline = ctx?.frameworkKey ? LEGAL_BASELINE[ctx.frameworkKey]?.[de ? "de" : "en"] : undefined;
  const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
  const headerShading = { fill: "1A2E41", type: ShadingType.CLEAR, color: "1A2E41" };
  const headerRun = (text: string) => new TextRun({ text, color: "FFFFFF", bold: true, size: 20, font: "Arial" });
  const margins = { top: 60, bottom: 60, left: 80, right: 80 };

  const makeHeaderRow = () => new TableRow({
    tableHeader: true,
    children: [
      new TableCell({ borders, shading: headerShading, margins, width: { size: 900, type: WidthType.DXA }, children: [new Paragraph({ children: [headerRun("ID")] })] }),
      new TableCell({ borders, shading: headerShading, margins, width: { size: 3200, type: WidthType.DXA }, children: [new Paragraph({ children: [headerRun(de ? "Kontrolle" : "Control")] })] }),
      new TableCell({ borders, shading: headerShading, margins, width: { size: 1200, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [headerRun(de ? "Anwendbar" : "Applicable")] })] }),
      new TableCell({ borders, shading: headerShading, margins, width: { size: 1400, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [headerRun("Status")] })] }),
      new TableCell({ borders, shading: headerShading, margins, width: { size: 2660, type: WidthType.DXA }, children: [new Paragraph({ children: [headerRun(de ? "Begründung" : "Justification")] })] }),
    ],
  });

  const controlToRow = (ctrl: SoAProjectedControl) => {
    const name = de ? ctrl.name : ctrl.nameEn;
    const app = ctrl.applicable && !ctrl.isExcluded; // B-38
    const applicableText = app ? (de ? "Anwendbar" : "Applicable") : (de ? "Nicht anwendbar" : "Not Applicable");
    const jt = soaJustificationText(ctrl, lang);
    const justification = jt.text;
    const extraLines = catalogLines(ctrl, lang);
    return new TableRow({
      children: [
        new TableCell({ borders, margins, width: { size: 900, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: ctrl.id.toUpperCase(), bold: true, size: 18, font: "Arial" })] })] }),
        new TableCell({ borders, margins, width: { size: 3200, type: WidthType.DXA }, children: [
          new Paragraph({ children: [new TextRun({ text: name, size: 18, font: "Arial" })] }),
          ...extraLines.map(l => new Paragraph({ children: [new TextRun({ text: l, size: 14, font: "Arial", color: "64748B" })] })),
        ] }),
        new TableCell({ borders, margins, width: { size: 1200, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: applicableText, size: 18, font: "Arial" })] })] }),
        new TableCell({ borders, margins, width: { size: 1400, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: statusLabel(ctrl, lang), size: 18, font: "Arial", bold: true })] })] }),
        new TableCell({ borders, margins, width: { size: 2660, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: justification, size: 18, font: "Arial", italics: true, ...(jt.missing ? { color: "DC2626", bold: true } : {}) })] })] }),
      ],
    });
  };

  // Gap Analysis summary (subdued, after SoA stats)
  const gapChildren: Paragraph[] = [];
  if (gapSummary) {
    gapChildren.push(
      new Paragraph({ spacing: { before: 100, after: 80 }, children: [new TextRun({ text: de ? "Gap-Analyse" : "Gap Analysis", bold: true, size: 18, color: "718096", font: "Arial" })] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun({ text: `${de ? "Kontrollen" : "Controls"}: ${gapSummary.totalControls} | `, size: 18, font: "Arial", color: "475569" }),
        new TextRun({ text: `${de ? "Ohne Gap" : "Without Gap"}: ${gapSummary.processedWithoutGap} | `, size: 18, font: "Arial", color: "16A34A" }),
        new TextRun({ text: `${de ? "Mit Gap" : "With Gap"}: ${gapSummary.processedWithGap} | `, size: 18, font: "Arial", color: "DC2626" }),
        new TextRun({ text: `${de ? "Nicht bearb." : "Not Assessed"}: ${gapSummary.unprocessedControls} | `, size: 18, font: "Arial", color: "9CA3AF" }),
        new TextRun({ text: `${de ? "Kons. Gaps" : "Consol. Gaps"}: ${gapSummary.totalGaps}`, size: 18, font: "Arial", color: "D97706" }),
      ] }),
    );
  }

  // Category sections
  const sectionChildren = projection.categories.flatMap(cat => {
    const dataRows = cat.controls.map(controlToRow);
    return [
      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 }, children: [new TextRun({ text: `${cat.article} — ${de ? cat.title : cat.titleEn}`, bold: true, color: "1A2E41", font: "Arial" })] }),
      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [900, 3200, 1200, 1400, 2660], rows: [makeHeaderRow(), ...dataRows] }),
    ];
  });

  // SoA stats line (prominent, first)
  const soaStatsLine = new Paragraph({ spacing: { after: 200 }, children: [
    new TextRun({ text: `${de ? "Gesamt" : "Total"}: ${s.total} | `, size: 22, bold: true, font: "Arial" }),
    new TextRun({ text: `${de ? "Anwendbar" : "Applicable"}: ${s.applicable} | `, size: 22, bold: true, font: "Arial", color: "16A34A" }),
    new TextRun({ text: `${de ? "Manuell hinzugef." : "Manual Added"}: ${s.manualCount} | `, size: 22, bold: true, font: "Arial", color: "B45309" }),
    new TextRun({ text: `${de ? "Umgesetzt" : "Implemented"}: ${s.implemented} | `, size: 22, bold: true, font: "Arial", color: "16A34A" }),
    new TextRun({ text: `${de ? "Teilweise" : "Partial"}: ${s.partial} | `, size: 22, bold: true, font: "Arial", color: "D97706" }),
    new TextRun({ text: `${de ? "Nicht umg." : "Not Impl."}: ${s.notImplemented} | `, size: 22, bold: true, font: "Arial", color: "DC2626" }),
    new TextRun({ text: `${de ? "Nicht bew." : "Not Assessed"}: ${s.notAssessed} | `, size: 22, bold: true, font: "Arial", color: "9CA3AF" }),
    ...(s.notYetApplicable ? [new TextRun({ text: `${de ? "Gilt später" : "Applies later"}: ${s.notYetApplicable} | `, size: 22, bold: true, font: "Arial", color: "1D4ED8" })] : []),
    new TextRun({ text: `${de ? "Nicht anw." : "Not Applic."}: ${s.notApplicable} | `, size: 22, bold: true, font: "Arial", color: "6B7280" }),
    new TextRun({ text: `${de ? "Ausgeschl." : "Excluded"}: ${s.excludedCount}`, size: 22, bold: true, font: "Arial", color: "991B1B" }),
  ] });
  const legendParas = legendItems(lang).map(([k, v]) => new Paragraph({ spacing: { after: 40 }, children: [
    new TextRun({ text: `${k}: `, bold: true, size: 16, font: "Arial", color: "475569" }),
    new TextRun({ text: v, size: 16, font: "Arial", color: "475569" }),
  ] }));

  // AI Act: Matrix System × Rolle × Kontrolle (C-5) + Rollenkonsistenz (C-7)
  const matrixChildren: (Paragraph | Table)[] = [];
  const md = aiMatrixData(projection, ctx);
  if (md) {
    const W = [900, 2000, 1100, 1100, 1500, 1000, 1760];
    const cell = (t: string, w: number, head = false) => new TableCell({ borders, margins, width: { size: w, type: WidthType.DXA }, ...(head ? { shading: headerShading } : {}),
      children: [new Paragraph({ children: [head ? headerRun(t) : new TextRun({ text: t, size: 16, font: "Arial" })] })] });
    const hdr = [ "ID", de ? "System · Version" : "System · version", de ? "Rolle" : "Role", de ? "Klasse" : "Class", de ? "Verantwortlich / Freigabe" : "Owner / approved by", de ? "Bewertet" : "Assessed", de ? "Anw. / umg. / teilw. / offen / später" : "Appl. / impl. / part. / open / later" ];
    matrixChildren.push(
      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 }, children: [new TextRun({ text: de ? "KI-Systeme × Rolle × Kontrolle" : "AI systems × role × control", bold: true, color: "1A2E41", font: "Arial" })] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: MATRIX_NOTE[de ? "de" : "en"], size: 16, font: "Arial", color: "475569" })] }),
      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: W, rows: [
        new TableRow({ tableHeader: true, children: hdr.map((h, i) => cell(h, W[i], true)) }),
        ...md.summary.map(x => new TableRow({ children: [
          cell(x.systemId, W[0]), cell(`${x.name}${x.version ? ` · ${x.version}` : ""}`, W[1]),
          cell(ROLLE_META[x.rolle]?.[de ? "de" : "en"] ?? x.rolle, W[2]), cell(KLASSE_LABEL[x.risikoklasse]?.[de ? "de" : "en"] ?? x.risikoklasse, W[3]),
          cell(`${x.owner || "—"} / ${x.approvedBy || "—"}`, W[4]), cell(x.assessedAt ? fmtDay(x.assessedAt, lang) : "—", W[5]),
          cell(`${x.applicable} / ${x.implemented} / ${x.partial} / ${x.open} / ${x.later}`, W[6]),
        ] })),
      ] }),
    );
    for (const x of md.summary) {
      const mine = md.rows.filter(r => r.systemId === x.systemId && r.applies);
      matrixChildren.push(new Paragraph({ spacing: { before: 160, after: 40 }, children: [new TextRun({ text: `${x.systemId} — ${x.name}`, bold: true, size: 18, font: "Arial", color: "1A2E41" })] }));
      for (const k of ["nein", "teilweise", "offen", "spaeter", "ja"] as const) {
        const ids = mine.filter(r => r.status === k).map(r => r.controlId.replace("AIACT-", ""));
        if (ids.length) matrixChildren.push(new Paragraph({ spacing: { after: 20 }, children: [
          new TextRun({ text: `${MATRIX_STATUS[k][de ? "de" : "en"]} (${ids.length}): `, bold: true, size: 16, font: "Arial" }),
          new TextRun({ text: ids.join(", "), size: 16, font: "Arial" }),
        ] }));
      }
      if (x.evidence.length) matrixChildren.push(new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `${de ? "Nachweise" : "Evidence"}: ${x.evidence.join(" · ")}`, size: 14, font: "Arial", color: "475569" })] }));
    }
    if (md.issues.length) {
      matrixChildren.push(new Paragraph({ spacing: { before: 200, after: 60 }, children: [new TextRun({ text: de ? "Rollenkonsistenz je System" : "Role consistency per system", bold: true, size: 20, font: "Arial", color: "1A2E41" })] }));
      for (const i of md.issues) matrixChildren.push(new Paragraph({ spacing: { after: 20 }, children: [
        new TextRun({ text: `${ISSUE_LABEL[i.kind][de ? "de" : "en"]}: `, bold: true, size: 16, font: "Arial", color: i.kind === "konflikt" ? "DC2626" : i.kind === "pruefen" ? "B45309" : "475569" }),
        new TextRun({ text: i.text[de ? "de" : "en"], size: 16, font: "Arial" }),
      ] }));
    }
  }

  // Manual controls section
  const manualChildren: (Paragraph | Table)[] = [];
  if (projection.manualControls.length > 0) {
    manualChildren.push(
      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 100 }, children: [new TextRun({ text: de ? "Manuell hinzugefügte Kontrollen" : "Manually Added Controls", bold: true, color: "B45309", font: "Arial" })] }),
      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [900, 3200, 1200, 1400, 2660], rows: [makeHeaderRow(), ...projection.manualControls.map(controlToRow)] }),
    );
  }

  // Excluded controls section
  const excludedChildren: (Paragraph | Table)[] = [];
  if (projection.excludedControls.length > 0) {
    const rejHeaderShading = { fill: "991B1B", type: ShadingType.CLEAR, color: "991B1B" };
    excludedChildren.push(
      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 100 }, children: [new TextRun({ text: de ? "Abgelehnte Kontrollen" : "Rejected Controls", bold: true, color: "991B1B", font: "Arial" })] }),
    );
    const rejRows = projection.excludedControls.map(ctrl => new TableRow({
      children: [
        new TableCell({ borders, margins, width: { size: 900, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: ctrl.id.toUpperCase(), bold: true, size: 18, font: "Arial" })] })] }),
        new TableCell({ borders, margins, width: { size: 5400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: de ? ctrl.name : ctrl.nameEn, size: 18, font: "Arial" })] })] }),
        new TableCell({ borders, margins, width: { size: 3060, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: ctrl.exclusionReason || "—", size: 18, font: "Arial", italics: true, color: "DC2626" })] })] }),
      ],
    }));
    excludedChildren.push(
      new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [900, 5400, 3060],
        rows: [
          new TableRow({ tableHeader: true, children: [
            new TableCell({ borders, shading: rejHeaderShading, margins, width: { size: 900, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "ID", color: "FFFFFF", bold: true, size: 20, font: "Arial" })] })] }),
            new TableCell({ borders, shading: rejHeaderShading, margins, width: { size: 5400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: de ? "Kontrolle" : "Control", color: "FFFFFF", bold: true, size: 20, font: "Arial" })] })] }),
            new TableCell({ borders, shading: rejHeaderShading, margins, width: { size: 3060, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: de ? "Ablehnungsgrund" : "Rejection Reason", color: "FFFFFF", bold: true, size: 20, font: "Arial" })] })] }),
          ] }),
          ...rejRows,
        ],
      }),
    );
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    sections: [{
      properties: {
        page: { margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } },
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: "718096" }),
          new TextRun({ text: "/", size: 16, font: "Arial", color: "718096" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: "Arial", color: "718096" }),
        ] })] }),
      },
      children: [
        new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, children: [new TextRun({ text: getReportBrandName(de), bold: true, color: "1A2E41", size: 36, font: "Arial" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: T.title, size: 24, font: "Arial" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: T.subtitle, size: 18, font: "Arial", color: "64748B" })] }),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: `${de ? "Datum" : "Date"}: ${new Date().toLocaleDateString(de ? "de-DE" : "en-US")}`, size: 20, font: "Arial" })] }),
        ...(baseline ? [new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: baseline, size: 18, font: "Arial", color: "475569" })] })] : []),
        ...(T.note ? [new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: T.note, size: 18, font: "Arial", color: "475569" })] })] : []),
        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: de ? "SoA Übersicht" : "SoA Overview", bold: true, color: "1A2E41", font: "Arial" })] }),
        soaStatsLine,
        ...legendParas,
        ...gapChildren,
        ...matrixChildren,
        ...sectionChildren,
        ...manualChildren,
        ...excludedChildren,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const suffix = ctx?.frameworkKey && ctx.frameworkKey !== "ISO27001" ? `-${ctx.frameworkKey}` : "";
  saveAs(blob, `${getReportBrandName(de)} - SoA${suffix}-${new Date().toISOString().slice(0, 10)}.docx`);
};

/**
 * SoA als Excel. Vorher gab es die SoA nur als PDF/Word — für die
 * Abstimmung mit Fachbereichen und für Auditoren ist eine filterbare
 * Tabelle aber das praktischste Format (Dr. Sait: „hepsi PDF, Word ve
 * Excel olarak verilebilmeli").
 */
export const generateSoAExcel = async (projection: SoAProjection, lang: Lang, ctx?: SoAReportContext) => {
  const de = lang === "de";
  assertSoAConsistent(projection, lang);
  const T = reportTitles(ctx, lang);
  const md = aiMatrixData(projection, ctx);
  const all = [
    ...projection.categories.flatMap(c => c.controls),
    ...projection.manualControls,
  ];
  await exportBrandedXlsx({
    fileBase: (de ? "Anwendbarkeitserklaerung-SoA" : "Statement-of-Applicability"),
    title: T.title,
    lang,
    scope: de
      ? `${projection.stats.total} Kontrollen · ${projection.stats.applicable} anwendbar · ${projection.stats.notApplicable} nicht anwendbar`
      : `${projection.stats.total} controls · ${projection.stats.applicable} applicable · ${projection.stats.notApplicable} not applicable`,
    sheets: [
      {
        name: de ? "Kennzahlen" : "Key figures",
        columns: [
          { header: de ? "Kennzahl" : "Metric", key: "k", width: 42 },
          { header: de ? "Wert" : "Value", key: "v", width: 14, kind: "num" },
        ],
        rows: [
          { k: de ? "Kontrollen gesamt" : "Controls total", v: projection.stats.total },
          { k: de ? "Anwendbar" : "Applicable", v: projection.stats.applicable },
          { k: de ? "Nicht anwendbar" : "Not applicable", v: projection.stats.notApplicable },
          { k: de ? "Umgesetzt" : "Implemented", v: projection.stats.implemented },
          { k: de ? "Teilweise umgesetzt" : "Partially implemented", v: projection.stats.partial },
          { k: de ? "Nicht umgesetzt" : "Not implemented", v: projection.stats.notImplemented },
          { k: de ? "Nicht bewertet" : "Not assessed", v: projection.stats.notAssessed },
          { k: de ? "Gilt später (Pflicht beginnt erst)" : "Applies later (duty not yet in force)", v: projection.stats.notYetApplicable },
          { k: de ? "Ausgeschlossen (Risikobehandlung)" : "Excluded (risk treatment)", v: projection.stats.excludedCount },
          { k: de ? "Begründung fehlt" : "Missing justification", v: projection.stats.missingJustification },
        ],
      },
      {
        name: de ? "Kontrollen" : "Controls",
        note: de
          ? 'Eine Zeile je Kontrolle. Anwendbar = Nein verlangt nach ISO/IEC 27001 6.1.3 d eine Begruendung.'
          : 'One row per control. Applicable = No requires a justification under ISO/IEC 27001 6.1.3 d.',
        statusKey: "status",
        columns: [
          { header: de ? "Referenz" : "Reference", key: "ref", width: 12 },
          { header: "ID", key: "id", width: 22 },
          { header: de ? "Kontrolle" : "Control", key: "name", width: 52 },
          { header: de ? "Kategorie" : "Category", key: "cat", width: 28 },
          { header: de ? "Anwendbar" : "Applicable", key: "status", width: 14 },
          { header: de ? "Begründung" : "Justification", key: "just", width: 54 },
          { header: de ? "Umsetzung" : "Implementation", key: "impl", width: 20 },
          { header: de ? "Verantwortlich" : "Owner", key: "owner", width: 24 },
          { header: de ? "Rechtsgrundlage" : "Legal basis", key: "legal", width: 40 },
          { header: de ? "Gilt ab" : "Applies from", key: "from", width: 12 },
          { header: de ? "Rolle" : "Role", key: "role", width: 20 },
          { header: de ? "Kennzeichnung" : "Flag", key: "flag", width: 22 },
        ],
        rows: all.map(c => ({
          ref: isoEntry(c.id)?.ref ?? "",
          id: c.id,
          name: de ? c.name : c.nameEn,
          cat: de ? c.categoryTitle : c.categoryTitleEn,
          status: c.isExcluded
            ? (de ? "Ausgeschlossen" : "Excluded")
            : c.applicable ? (de ? "Ja" : "Yes") : (de ? "Nein" : "No"),
          just: soaJustificationText(c, lang).text,
          impl: statusLabel(c, lang) + (c.isRollup ? (de ? " (Übersicht)" : " (overview)") : ""),
          owner: (c as any).owner ?? "",
          legal: c.catalog?.legalRef ?? "",
          from: c.catalog?.appliesFrom ?? "",
          role: (c.catalog?.role ?? []).map(r => ROLE_LABEL[r]?.[de ? "de" : "en"] ?? r).join(", "),
          flag: c.catalog?.policyFlag ? (POLICY_LABEL[c.catalog.policyFlag]?.[de ? "de" : "en"] ?? c.catalog.policyFlag) : "",
        })),
      },
      ...(md ? [
        {
          name: de ? "System-Matrix" : "System matrix",
          note: MATRIX_NOTE[de ? "de" : "en"],
          columns: [
            { header: de ? "System-ID" : "System ID", key: "sid", width: 12 },
            { header: "System", key: "sys", width: 32 },
            { header: "Version", key: "ver", width: 10 },
            { header: de ? "Rolle" : "Role", key: "rolle", width: 14 },
            { header: de ? "Risikoklasse" : "Risk class", key: "klasse", width: 18 },
            { header: "ID", key: "cid", width: 16 },
            { header: de ? "Kontrolle" : "Control", key: "cname", width: 52 },
            { header: de ? "Anwendbar" : "Applicable", key: "app", width: 12 },
            { header: de ? "Begründung (n. a.)" : "Justification (n/a)", key: "why", width: 50 },
            { header: "Status", key: "st", width: 18 },
            { header: de ? "Verantwortlich" : "Owner", key: "owner", width: 28 },
            { header: de ? "Bewertet am" : "Assessed on", key: "date", width: 12 },
            { header: de ? "Freigegeben von" : "Approved by", key: "appr", width: 28 },
            { header: de ? "Nachweise" : "Evidence", key: "ev", width: 50 },
          ],
          rows: md.rows.map(r => ({
            sid: r.systemId, sys: r.systemName, ver: r.version,
            rolle: ROLLE_META[r.rolle]?.[de ? "de" : "en"] ?? r.rolle,
            klasse: KLASSE_LABEL[r.risikoklasse]?.[de ? "de" : "en"] ?? r.risikoklasse,
            cid: r.controlId, cname: de ? r.controlName : r.controlNameEn,
            app: r.applies ? (de ? "Ja" : "Yes") : (de ? "Nein" : "No"),
            why: r.reason ? r.reason[de ? "de" : "en"] : "",
            st: MATRIX_STATUS[r.status]?.[de ? "de" : "en"] ?? r.status,
            owner: r.owner, date: r.assessedAt, appr: r.approvedBy, ev: r.evidence.join("\n"),
          })),
        },
        {
          name: de ? "Rollenkonsistenz" : "Role consistency",
          columns: [
            { header: de ? "Art" : "Kind", key: "k", width: 16 },
            { header: de ? "Kontrolle / System" : "Control / system", key: "ref", width: 18 },
            { header: de ? "Befund" : "Finding", key: "t", width: 110 },
          ],
          rows: md.issues.map(i => ({ k: ISSUE_LABEL[i.kind][de ? "de" : "en"], ref: i.controlId ?? i.systemId ?? "", t: i.text[de ? "de" : "en"] })),
        },
      ] : []),
    ],
  });
};
