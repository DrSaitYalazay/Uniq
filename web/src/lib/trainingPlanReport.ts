// Annual Training Plan PDF — auditor-ready overview
import jsPDF from "jspdf";
import { buildCoverHtml, wrapHtmlDoc, renderHtmlToWord, esc, rtDocFooter } from "./reportHtmlLayout";
import { getCompanyBrand } from "./companyBrand";
import { getReportBrandName } from "./reportBrand";
import { exportBrandedXlsx } from "@/lib/reportXlsxKit";
import { TrainingCompletion, QuizResult } from "@/hooks/useTrainingParticipants";
import { getActiveFrameworkKeys } from "@/lib/frameworkFlags";
import { getReportBrandName } from "@/lib/reportBrand";

interface TopicRef {
  id: string;
  titleDe: string;
  titleEn: string;
  roles: string[];
  mandatory: boolean;
}

export interface TrainingPlanGroupRef {
  label: string;
  count: number;
}

export interface TrainingPlanEntryRef {
  quarter?: "Q1" | "Q2" | "Q3" | "Q4";
  owner?: string;
  ownerEdited?: boolean;
  deliveryMode?: "e_learning" | "workshop" | "tabletop" | "briefing";
  status?: "planned" | "scheduled" | "in_progress" | "completed" | "overdue" | "deferred";
  notes?: string;
  participantGroups?: TrainingPlanGroupRef[];
  /** @deprecated kept for backward-compat */
  participantNames?: string[];
}

export interface TrainingPlanInput {
  year: number;
  companyName?: string;
  lang: "de" | "en";
  topics: TopicRef[];
  roleMeta: { id: string; de: string; en: string }[];
  completions: TrainingCompletion[];
  quizResults: QuizResult[];
  onboardingRequiredIds?: string[];
  planEntries?: Record<string, TrainingPlanEntryRef>;
}

const FONT = "helvetica";

const planLabel = (value: string | undefined, de: boolean) => {
  const labels: Record<string, { de: string; en: string }> = {
    e_learning: { de: "E-Learning", en: "E-learning" },
    workshop: { de: "Workshop", en: "Workshop" },
    tabletop: { de: "Tabletop", en: "Tabletop" },
    briefing: { de: "Briefing", en: "Briefing" },
    planned: { de: "Geplant", en: "Planned" },
    scheduled: { de: "Terminiert", en: "Scheduled" },
    in_progress: { de: "Laufend", en: "In progress" },
    completed: { de: "Abgeschlossen", en: "Completed" },
    overdue: { de: "Überfällig", en: "Overdue" },
    deferred: { de: "Verschoben", en: "Deferred" },
  };
  if (!value) return "—";
  return labels[value]?.[de ? "de" : "en"] ?? value;
};

// Status pill colour (background, text)
const statusColor = (s: string | undefined): { bg: [number, number, number]; fg: [number, number, number] } => {
  switch (s) {
    case "completed": return { bg: [220, 252, 231], fg: [22, 101, 52] };
    case "in_progress": return { bg: [219, 234, 254], fg: [30, 64, 175] };
    case "scheduled": return { bg: [243, 232, 255], fg: [107, 33, 168] };
    case "overdue": return { bg: [254, 226, 226], fg: [153, 27, 27] };
    case "deferred": return { bg: [254, 243, 199], fg: [146, 64, 14] };
    default: return { bg: [241, 245, 249], fg: [71, 85, 105] };
  }
};

const drawPill = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  bg: [number, number, number],
  fg: [number, number, number],
) => {
  doc.setFontSize(7.5);
  const w = doc.getTextWidth(text) + 4;
  doc.setFillColor(bg[0], bg[1], bg[2]);
  doc.roundedRect(x, y - 3.3, w, 4.6, 1.2, 1.2, "F");
  doc.setTextColor(fg[0], fg[1], fg[2]);
  doc.text(text, x + 2, y);
  doc.setTextColor(40, 40, 40);
  return w;
};

export const generateTrainingPlanPDF = (input: TrainingPlanInput) => {
  const de = input.lang === "de";
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const M = 16;
  let y = M;

  // ---- Header band -------------------------------------------------------
  doc.setFillColor(15, 27, 61);
  doc.rect(0, 0, W, 26, "F");
  doc.setFillColor(212, 175, 55); // gold accent
  doc.rect(0, 26, W, 1.2, "F");

  doc.setFont(FONT, "bold");
  doc.setFontSize(17);
  doc.setTextColor(255, 255, 255);
  doc.text(de ? `Jährlicher Schulungsplan ${input.year}` : `Annual Training Plan ${input.year}`, M, 13);
  doc.setFont(FONT, "normal");
  doc.setFontSize(9);
  doc.setTextColor(212, 220, 240);
  {
    const active = getActiveFrameworkKeys();
    const refs = [
      active.includes("NIS2") && "NIS2 Art. 20/21",
      active.includes("ISO27001") && "ISO 27001 A.6.3",
      active.includes("DORA") && "DORA Art. 13",
    ].filter(Boolean).join(", ");
    const suffix = refs ? (de ? ` (u. a. ${refs})` : ` (e.g. ${refs})`) : "";
    doc.text(de ? `Cybersicherheits- & Awareness-Schulungen${suffix}` : `Cybersecurity & Awareness Trainings${suffix}`, M, 19);
  }
  if (input.companyName) {
    doc.setFontSize(9);
    doc.text(input.companyName, W - M, 13, { align: "right" });
  }
  doc.setFontSize(8);
  doc.text(`${de ? "Stand" : "As of"}: ${new Date().toLocaleDateString(de ? "de-DE" : "en-GB")}`, W - M, 19, { align: "right" });

  y = 34;

  // ---- KPI strip ---------------------------------------------------------
  const totalTopics = input.topics.length;
  const mandatoryTopics = input.topics.filter(t => t.mandatory).length;
  const entries = input.planEntries ?? {};
  const deferredTopics = input.topics.filter(t => entries[t.id]?.status === "deferred");
  const activeTopics = input.topics.filter(t => entries[t.id]?.status !== "deferred");
  const totalParticipants = new Set(input.completions.map(c => c.participant_name)).size;
  const certsIssued = input.completions.length;
  const passedQuizzes = input.quizResults.filter(q => q.passed).length;
  const overdue = input.completions.filter(c => new Date(c.next_due_at).getTime() < Date.now()).length;

  const kpis: Array<[string, string, [number, number, number]]> = [
    [de ? "Themen aktiv" : "Active topics", String(activeTopics.length), [15, 27, 61]],
    [de ? "Pflicht" : "Mandatory", String(mandatoryTopics), [153, 27, 27]],
    [de ? "Verschoben" : "Deferred", String(deferredTopics.length), [146, 64, 14]],
    [de ? "Teilnehmer" : "Participants", String(totalParticipants), [30, 64, 175]],
    [de ? "Quizze bestanden" : "Quizzes passed", String(passedQuizzes), [22, 101, 52]],
    [de ? "Überfällig" : "Overdue", String(overdue), [153, 27, 27]],
  ];
  const kpiW = (W - 2 * M - 5 * 3) / kpis.length;
  kpis.forEach(([label, value, color], i) => {
    const x = M + i * (kpiW + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, kpiW, 14, 1.5, 1.5, "FD");
    doc.setFont(FONT, "bold");
    doc.setFontSize(13);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(value, x + kpiW / 2, y + 7, { align: "center" });
    doc.setFont(FONT, "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x + kpiW / 2, y + 11.5, { align: "center" });
  });
  y += 20;

  // ---- Section: active plan table ---------------------------------------
  doc.setFont(FONT, "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 27, 61);
  doc.text(de ? "Schulungsplan — aktive Themen" : "Training plan — active topics", M, y);
  y += 5;

  // Column layout (mm)
  const COL = {
    topic: M,
    quarter: M + 78,
    owner: M + 94,
    mode: M + 126,
    status: M + 150,
    part: W - M,
  };

  const drawHeader = () => {
    doc.setFillColor(15, 27, 61);
    doc.rect(M, y - 4, W - 2 * M, 6, "F");
    doc.setFont(FONT, "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(de ? "Thema" : "Topic", COL.topic + 2, y);
    doc.text(de ? "Q." : "Q.", COL.quarter, y);
    doc.text(de ? "Owner" : "Owner", COL.owner, y);
    doc.text(de ? "Format" : "Mode", COL.mode, y);
    doc.text("Status", COL.status, y);
    doc.text(de ? "Teil." : "Part.", COL.part, y, { align: "right" });
    y += 6;
  };
  drawHeader();

  doc.setFont(FONT, "normal");
  doc.setFontSize(8);

  let rowIdx = 0;
  for (const t of activeTopics) {
    if (y > H - 22) {
      doc.addPage();
      y = M;
      drawHeader();
    }
    const entry = entries[t.id] ?? {};
    const topicComps = input.completions.filter(c => c.topic_id === t.id);
    const rawGroups: TrainingPlanGroupRef[] = entry.participantGroups && entry.participantGroups.length > 0
      ? entry.participantGroups
      : (entry.participantNames ?? []).filter(Boolean).map(n => ({ label: n, count: 1 }));
    const plannedGroups = rawGroups.filter(g => g.label && g.count > 0);
    const plannedTotal = plannedGroups.reduce((s, g) => s + Math.max(0, Math.floor(g.count)), 0);
    const topicParts = plannedTotal > 0 ? plannedTotal : new Set(topicComps.map(c => c.participant_name)).size;

    // Zebra
    if (rowIdx % 2 === 0) {
      doc.setFillColor(249, 250, 252);
      doc.rect(M, y - 4, W - 2 * M, 7, "F");
    }

    doc.setTextColor(30, 41, 59);
    const title = de ? t.titleDe : t.titleEn;
    const lines = doc.splitTextToSize(title, 72);
    doc.text(lines[0] + (lines.length > 1 ? "…" : ""), COL.topic + 2, y);
    if (t.mandatory) {
      doc.setFontSize(6.5);
      doc.setTextColor(153, 27, 27);
      doc.text(de ? "PFLICHT" : "MANDATORY", COL.topic + 2, y + 3);
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
    }

    doc.text(entry.quarter ?? "—", COL.quarter, y);

    // Owner: italic+blue when our suggestion, dark when user override
    const ownerTxt = (entry.owner || "—").slice(0, 18);
    if (entry.owner && entry.ownerEdited) {
      doc.setFont(FONT, "bold");
      doc.setTextColor(30, 41, 59);
    } else {
      doc.setFont(FONT, "italic");
      doc.setTextColor(37, 99, 235);
    }
    doc.text(ownerTxt, COL.owner, y);
    doc.setFont(FONT, "normal");
    doc.setTextColor(30, 41, 59);

    doc.text(planLabel(entry.deliveryMode, de), COL.mode, y);

    const sc = statusColor(entry.status);
    drawPill(doc, planLabel(entry.status, de), COL.status, y, sc.bg, sc.fg);

    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(String(topicParts), COL.part, y, { align: "right" });
    if (plannedGroups.length > 0) {
      doc.setFontSize(6.5);
      const labels = plannedGroups.slice(0, 2).map(g => `${g.label} (${g.count})`).join(", ")
        + (plannedGroups.length > 2 ? ` +${plannedGroups.length - 2}` : "");
      doc.text(labels.slice(0, 32), COL.part, y + 3, { align: "right" });
    }
    doc.setTextColor(30, 41, 59);

    y += 7;
    rowIdx++;
  }

  // ---- Owner legend ------------------------------------------------------
  y += 3;
  if (y > H - 20) { doc.addPage(); y = M; }
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont(FONT, "italic");
  doc.setTextColor(37, 99, 235);
  doc.text(de ? "kursiv blau" : "blue italic", M, y);
  doc.setFont(FONT, "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(de
    ? " = von uns vorgeschlagener Owner (Rollen-basiert)   ·   "
    : " = owner suggested by the system (role-based)   ·   ", M + 18, y);
  doc.setFont(FONT, "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(de ? "fett" : "bold", M + 92, y);
  doc.setFont(FONT, "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(de ? " = vom Verantwortlichen bestätigt/angepasst" : " = confirmed / adjusted by responsible person", M + 100, y);

  // ---- Deferred section --------------------------------------------------
  if (deferredTopics.length > 0) {
    y += 8;
    if (y > H - 30) { doc.addPage(); y = M; }
    doc.setFont(FONT, "bold");
    doc.setFontSize(11);
    doc.setTextColor(146, 64, 14);
    doc.text(de ? "Auf nächstes Jahr verschoben" : "Deferred to next year", M, y);
    y += 5;
    doc.setFont(FONT, "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      de
        ? "Diese Themen sind dokumentiert, finden im laufenden Jahr aber nicht statt und fließen nicht in offene Punkte ein."
        : "These topics are documented but will not run this year and are excluded from open items.",
      M, y,
    );
    y += 5;
    doc.setTextColor(30, 41, 59);
    for (const t of deferredTopics) {
      if (y > H - 18) { doc.addPage(); y = M; }
      doc.setFillColor(254, 243, 199);
      doc.roundedRect(M, y - 3.5, 2, 4.5, 0.5, 0.5, "F");
      doc.text(`• ${de ? t.titleDe : t.titleEn}`, M + 4, y);
      const owner = entries[t.id]?.owner;
      if (owner) {
        doc.setTextColor(100, 116, 139);
        doc.text(`(${owner})`, W - M, y, { align: "right" });
        doc.setTextColor(30, 41, 59);
      }
      y += 5;
    }
  }

  // ---- Onboarding section -----------------------------------------------
  if (input.onboardingRequiredIds && input.onboardingRequiredIds.length > 0) {
    y += 6;
    if (y > H - 30) { doc.addPage(); y = M; }
    doc.setFont(FONT, "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 27, 61);
    doc.text(de ? "Onboarding-Pflichtmodule (neue Mitarbeiter)" : "Onboarding mandatory modules (new staff)", M, y);
    y += 6;
    doc.setFont(FONT, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    for (const id of input.onboardingRequiredIds) {
      const t = input.topics.find(tt => tt.id === id);
      if (!t) continue;
      if (y > H - 18) { doc.addPage(); y = M; }
      doc.text(`• ${de ? t.titleDe : t.titleEn}`, M + 2, y);
      y += 5;
    }
  }

  // ---- Footer ------------------------------------------------------------
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(M, H - 12, W - M, H - 12);
    doc.setFont(FONT, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`${getReportBrandName(de ? "de" : "en")} · ${de ? "Jährlicher Schulungsplan" : "Annual Training Plan"} ${input.year}`, M, H - 7);
    doc.text(`${i} / ${pageCount}`, W - M, H - 7, { align: "right" });
  }

  doc.save(`${de ? "Schulungsplan" : "Training_Plan"}_${input.year}.pdf`);
};

/** Schulungsplan als Excel — Jahresplanung filterbar. */
export async function generateTrainingPlanExcel(input: TrainingPlanInput, lang: "de" | "en" = "de") {
  const de = lang === "de";
  const entries: any[] = (input as any).entries ?? (input as any).plan ?? [];
  await exportBrandedXlsx({
    fileBase: de ? "Schulungsplan" : "Training-plan",
    title: de ? "Schulungsplan" : "Training plan",
    lang,
    scope: de ? `${entries.length} Einträge` : `${entries.length} entries`,
    sheets: [{
      name: de ? "Plan" : "Plan",
      statusKey: "status",
      columns: [
        { header: de ? "Thema" : "Topic", key: "t", width: 46 },
        { header: de ? "Zielgruppe" : "Audience", key: "a", width: 28 },
        { header: de ? "Turnus" : "Cycle", key: "c", width: 16 },
        { header: de ? "Termin" : "Date", key: "d", width: 16 },
        { header: de ? "Dauer" : "Duration", key: "du", width: 12 },
        { header: de ? "Verantwortlich" : "Owner", key: "o", width: 24 },
        { header: de ? "Status" : "Status", key: "status", width: 16 },
      ],
      rows: entries.map((e: any) => ({
        t: de ? (e.title ?? e.topic ?? "") : (e.titleEn ?? e.title ?? e.topic ?? ""),
        a: e.audience ?? e.group ?? "", c: e.cycle ?? "",
        d: e.date ?? e.due ?? "", du: e.duration ?? "",
        o: e.owner ?? "", status: e.status ?? "",
      })),
    }],
  });
}

/**
 * Schulungsplan als Word. Vorher gab es den Plan NUR als PDF — damit war er
 * für Fachbereiche nicht bearbeitbar. Nutzt denselben HTML-Körper wie der
 * Excel-Export und das gemeinsame Druck-Layout (Seitenumbruchregeln).
 */
export async function generateTrainingPlanWord(input: TrainingPlanInput, lang: "de" | "en" = "de") {
  const de = lang === "de";
  const entries: any[] = (input as any).entries ?? (input as any).plan ?? [];
  const brandName = getCompanyBrand().companyName?.trim() || getReportBrandName(lang);
  const head = (h: string) => `<th style="text-align:left;padding:6px 8px;">${esc(h)}</th>`;
  const cell = (v: any) => `<td style="padding:6px 8px;">${esc(String(v ?? ""))}</td>`;
  const body = `
    <div class="rt-report">
      ${buildCoverHtml({
        badge: de ? "Schulung & Sensibilisierung" : "Training & awareness",
        title: de ? "Schulungsplan" : "Training plan",
        subtitle: de ? `${entries.length} geplante Einheiten` : `${entries.length} planned units`,
        companyName: brandName,
        authorName: brandName,
        dateStr: new Date().toLocaleDateString(de ? "de-DE" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }),
      })}
      <div class="rt-section">
        <h2>${esc(de ? "Jahresplanung" : "Annual plan")}</h2>
        <table>
          <thead><tr>${[
            de ? "Thema" : "Topic", de ? "Zielgruppe" : "Audience", de ? "Turnus" : "Cycle",
            de ? "Termin" : "Date", de ? "Dauer" : "Duration", de ? "Verantwortlich" : "Owner",
            de ? "Status" : "Status",
          ].map(head).join("")}</tr></thead>
          <tbody>${entries.length
            ? entries.map(e => `<tr>${[
                de ? (e.title ?? e.topic ?? "") : (e.titleEn ?? e.title ?? e.topic ?? ""),
                e.audience ?? e.group ?? "", e.cycle ?? "", e.date ?? e.due ?? "",
                e.duration ?? "", e.owner ?? "", e.status ?? "",
              ].map(cell).join("")}</tr>`).join("")
            : `<tr><td colspan="7" style="padding:10px 8px;font-style:italic;">${esc(de ? "Keine Einträge vorhanden." : "No entries available.")}</td></tr>`}
          </tbody>
        </table>
      </div>
      ${rtDocFooter(brandName, lang)}
    </div>`;
  const doc = wrapHtmlDoc({ title: de ? "Schulungsplan" : "Training plan", lang, body });
  await renderHtmlToWord(doc, (de ? "Schulungsplan" : "Training-plan") + ".doc");
}
