/**
 * Execution Report Generator — PDF & Word export for Step 12
 * Mirrors the maturity report pattern with control scope, action stats,
 * priority blocks, execution chart data, and action items table.
 */

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, HeadingLevel, AlignmentType, ShadingType, BorderStyle,
  Footer, PageNumber, ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import { rkCaptureChartsPng } from "@/lib/reportKit";
import { addCanvasPaged, domCutEdges } from "@/lib/reportPaginate";
import { exportBrandedXlsx } from "@/lib/reportXlsxKit";
import { RT } from "@/lib/reportTheme";
import type { Lang } from "@/contexts/LanguageContext";
import { isNis2Active } from "@/lib/frameworkFlags";
import type { ExecutionStats, ExecutionInsight } from "@/lib/maturityEngine";

// ── Types ──

/**
 * KONTROLL-basierte Kennzahlen — exakt die Zahlen, die der Bildschirm
 * (Phase 06 Überblick, Management-Dashboard) zeigt.
 *
 * Dr. Sait 2026-09-12: Der Bericht rechnete AUFGABEN (Bündel: 1505 → 1490,
 * „Fertig" 829), der Bildschirm KONTROLLEN (1738, „Umgesetzt" 1025, 69 %).
 * Gleiche Worte, verschiedene Zahlen, keine Kennzeichnung — drei Summen an
 * einem Tag. Jetzt stehen BEIDE Basen im Bericht, jede ausdrücklich benannt.
 */
export interface ControlBasedStats {
  applicable: number;     // anwendbare Kontrollen (SoA)
  implemented: number;    // umgesetzt
  partial: number;        // teilweise
  open: number;           // offen
  gradePct: number;       // Umsetzungsgrad in % (wie Bildschirm/Dashboard)
  noEvidence: number;     // „fertig ohne Nachweis" — im Audit nicht belastbar
  overdue: number;        // überfällig
}

export interface ControlScopeStats {
  BASELINE: number;
  entbehrlich: number;
  soaExcluded: number;
  soaAdded: number;
  finalScope: number;
  implemented: number;
  partial: number;
  notImpl: number;
}

export interface ActionStats {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  notStarted: number;
  completedPct: number;
  inProgressPct: number;
  blockedPct: number;
  notStartedPct: number;
}

export interface ExecGroupData {
  name: string;
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
}

export interface ActionItemForReport {
  id: string;
  name: string;
  nameEn: string;
  actionStatus: string;
  actionOwner: string;
  actionDueDate: string;
  isOverdue: boolean;
  priority: string;
  linkedToHighRisk: boolean;
}

export interface ExecutionReportData {
  controlScope: ControlScopeStats;
  actionStats: ActionStats;
  controlBased?: ControlBasedStats;
  chartData: ExecGroupData[];
  chartDataDomain?: ExecGroupData[];
  chartDataNis2?: ExecGroupData[];
  insights: ExecutionInsight[];
  actionItems: ActionItemForReport[];
  criticalCount: number;
  quickWinCount: number;
  overdueCount: number;
  blockedCount?: number;
  userNotes?: string;
}

// ── Helpers ──

const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const PAGE = { width: 210, height: 297, margin: 12, gap: 4, footerH: 10 };

const explanations: Record<string, Record<string, string>> = {
  control_scope: {
    de: "Der Kontrollumfang zeigt, wie aus den Basis-Kontrollen die finale Anzahl anwendbarer Kontrollen berechnet wird: Basis − Entbehrlich − SoA-Ausschlüsse + manuell hinzugefügt.",
    en: "The control scope shows how the final number of applicable controls is calculated from the baseline: Baseline − N/A − SoA Excluded + Manually Added.",
  },
  action_stats: {
    de: "Die Maßnahmenstatistik zeigt den aktuellen Umsetzungsstatus aller offenen Kontrollen: Fertig, Laufend, Offen und Blockiert.",
    en: "Action statistics show the current implementation status of all open controls: Done, In Progress, Not Started, and Blocked.",
  },
  // Der Hinweis darf KEINE Farbnamen nennen: die Balken folgen der gewählten
  // Themenfarbe, „Grün/Gelb/Grau" stand im Widerspruch zum Bild (Befund
  // Dr. Sait 2026-09-12). Die Zuordnung steht in der Legende unter dem
  // Diagramm — dort mit dem tatsächlich gedruckten Farbfeld.
  execution_chart: {
    de: "Das Diagramm zeigt den Umsetzungsfortschritt pro Bereich. Die Balken sind von links nach rechts gestapelt: abgeschlossen, in Bearbeitung, nicht gestartet. Rechts steht abgeschlossen von anwendbar; die Farbzuordnung zeigt die Legende unter dem Diagramm.",
    en: "The chart shows implementation progress per area. Each bar is stacked left to right: completed, in progress, not started. The figure on the right is completed out of applicable; the legend below the chart maps the colours.",
  },
  action_table: {
    de: "Die Maßnahmentabelle listet alle offenen Kontrollen mit Verantwortlichen, Fälligkeiten, Priorität und Status.",
    en: "The action table lists all open controls with owners, due dates, priority, and status.",
  },
};

function priorityLabel(p: string, lang: Lang): string {
  const map: Record<string, Record<string, string>> = {
    high: { de: "Hoch", en: "High" },
    medium: { de: "Mittel", en: "Medium" },
    low: { de: "Niedrig", en: "Low" },
  };
  return map[p]?.[lang] ?? p;
}

/**
 * Fälligkeitsdatum lesbar ausgeben.
 *
 * Befund Dr. Sait 2026-09-12: In der Maßnahmentabelle stand
 * „2026-08-24T00:00:00.000Z" — der rohe ISO-Zeitstempel aus der Datenbank.
 * Für einen Bericht an die Leitung ist das unbrauchbar. Dieselbe Funktion
 * versorgt PDF und Word, damit beide Formate dasselbe Datum zeigen.
 */
function fmtDue(v: string | null | undefined, lang: Lang): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
  return d.toLocaleDateString(lang === "de" ? "de-DE" : "en-GB",
    { day: "2-digit", month: "2-digit", year: "numeric" });
}

function statusLabel(s: string, lang: Lang): string {
  const map: Record<string, Record<string, string>> = {
    offen: { de: "Offen", en: "Not Started" },
    laufend: { de: "Laufend", en: "In Progress" },
    fertig: { de: "Fertig", en: "Done" },
    blockiert: { de: "Blockiert", en: "Blocked" },
    // Englische Schlüssel als Alias: kommt ein Status aus einer anderen
    // Quelle (Import, Altbestand), darf im Bericht NIE der rohe Schlüssel
    // stehen („not_started" statt „Offen").
    not_started: { de: "Offen", en: "Not Started" },
    open: { de: "Offen", en: "Not Started" },
    in_progress: { de: "Laufend", en: "In Progress" },
    done: { de: "Fertig", en: "Done" },
    blocked: { de: "Blockiert", en: "Blocked" },
  };
  const hit = map[String(s || "").trim().toLowerCase()];
  if (hit) return hit[lang];
  // Unbekannter Wert: lesbar machen statt Schlüssel drucken.
  return String(s || "—").replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function priorityColor(p: string): string {
  if (p === "high") return RT.stNein;
  if (p === "medium") return RT.stTeilweise;
  return RT.stNa;
}

function priorityBg(p: string): string {
  if (p === "high") return RT.stNeinBg;
  if (p === "medium") return "#fef3c7";
  return RT.stNaBg;
}

// ── PDF Section Builder ──

function sectionShell(title: string, content: string, infoText?: string) {
  return `
    <section data-pdf-section style="box-sizing:border-box;width:770px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px 26px;margin:0 0 14px;box-shadow:0 10px 30px rgba(15,23,42,0.05);overflow:visible;">
      <div style="margin:0 0 14px;padding-bottom:8px;border-bottom:2px solid ${RT.copper};">
        <div style="font-family:Arial,sans-serif;font-size:18px;font-weight:800;color:#241A4D;letter-spacing:-0.2px;">${escapeHtml(title)}</div>
      </div>
      ${infoText ? `<div style="background:#f0f4ff;border:1px solid ${RT.copperLight};border-radius:8px;padding:10px 14px;margin:0 0 14px;font-family:Arial,sans-serif;font-size:10px;color:#4338ca;line-height:1.5;">ⓘ ${escapeHtml(infoText)}</div>` : ""}
      ${content}
    </section>
  `;
}

function buildHeroSection(data: ExecutionReportData, lang: Lang, companyName: string): string {
  const t = lang === "de";
  const implPct = data.controlScope.finalScope > 0 ? Math.round((data.controlScope.implemented / data.controlScope.finalScope) * 100) : 0;

  return `
    <section data-pdf-section style="box-sizing:border-box;width:770px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px 26px;margin:0 0 14px;box-shadow:0 10px 30px rgba(15,23,42,0.05);overflow:visible;">
      <div style="margin:0 0 18px;padding-bottom:10px;border-bottom:3px solid #241A4D;">
        <div style="font-family:Arial,sans-serif;font-size:22px;font-weight:900;color:#241A4D;letter-spacing:-0.3px;">${t ? "Umsetzung & Monitoring" : "Execution & Monitoring"}</div>
        <div style="font-family:Arial,sans-serif;font-size:11px;color:${RT.stNa};margin-top:4px;">
          ${t ? "Unternehmen" : "Company"}: <strong style="color:#1e293b;">${escapeHtml(companyName || "—")}</strong> &nbsp;|&nbsp;
          ${t ? "Erstellt am" : "Generated"}: <strong style="color:#1e293b;">${new Date().toLocaleDateString(t ? "de-DE" : "en-US")}</strong>
        </div>
      </div>

      <div style="display:flex;gap:14px;margin-bottom:18px;">
        <div style="flex:1;border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:#f8fafc;text-align:center;">
          <div style="font-family:Arial,sans-serif;font-size:28px;font-weight:900;color:#241A4D;">${implPct}%</div>
          <div style="font-family:Arial,sans-serif;font-size:10px;color:${RT.stNa};">${t ? "Umsetzung" : "Implementation"}</div>
        </div>
        <div style="flex:1;border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:${RT.stJaBg};text-align:center;">
          <div style="font-family:Arial,sans-serif;font-size:28px;font-weight:900;color:${RT.stJa};">${data.actionStats.completed}</div>
          <div style="font-family:Arial,sans-serif;font-size:10px;color:${RT.stNa};">${t ? "Fertig" : "Done"}</div>
        </div>
        <div style="flex:1;border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:#fffbeb;text-align:center;">
          <div style="font-family:Arial,sans-serif;font-size:28px;font-weight:900;color:${RT.stTeilweise};">${data.actionStats.inProgress}</div>
          <div style="font-family:Arial,sans-serif;font-size:10px;color:${RT.stNa};">${t ? "Laufend" : "In Progress"}</div>
        </div>
        <div style="flex:1;border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:${RT.stNaBg};text-align:center;">
          <div style="font-family:Arial,sans-serif;font-size:28px;font-weight:900;color:${RT.stNa};">${data.actionStats.notStarted}</div>
          <div style="font-family:Arial,sans-serif;font-size:10px;color:${RT.stNa};">${t ? "Offen" : "Open"}</div>
        </div>
      </div>

      <div style="display:flex;gap:10px;">
        <div style="flex:1;border:2px solid #fca5a5;border-radius:10px;padding:10px;background:${RT.stNeinBg};text-align:center;">
          <div style="font-family:Arial,sans-serif;font-size:20px;font-weight:800;color:${RT.stNein};">${data.criticalCount}</div>
          <div style="font-family:Arial,sans-serif;font-size:9px;color:${RT.stNein};">${t ? "Kritisch" : "Critical"}</div>
        </div>
        <div style="flex:1;border:2px solid #fcd34d;border-radius:10px;padding:10px;background:#fffbeb;text-align:center;">
          <div style="font-family:Arial,sans-serif;font-size:20px;font-weight:800;color:${RT.stTeilweise};">${data.quickWinCount}</div>
          <div style="font-family:Arial,sans-serif;font-size:9px;color:${RT.stTeilweise};">Quick Wins</div>
        </div>
        <div style="flex:1;border:2px solid #f4a3c9;border-radius:10px;padding:10px;background:#fff7ed;text-align:center;">
          <div style="font-family:Arial,sans-serif;font-size:20px;font-weight:800;color:#ea580c;">${data.overdueCount}</div>
          <div style="font-family:Arial,sans-serif;font-size:9px;color:#ea580c;">${t ? "Überfällig" : "Overdue"}</div>
        </div>
      </div>
    </section>
  `;
}

function buildAboutSection(lang: Lang): string {
  const t = lang === "de";
  const intro = t
    ? "Die Reifegrad-Analyse hat gezeigt, wie reif die Organisation ist. Die Umsetzung wandelt das in konkrete Maßnahmen um: Wer macht was, bis wann, und was ist blockiert."
    : "The maturity analysis showed how mature the organisation is. Implementation turns that into concrete actions: who does what, by when, and what is blocked.";
  const cards: Array<{ title: string; body: string; color: string }> = t
    ? [
        { title: "Eingang", color: "#241A4D", body: "Anwendbare Kontrollen aus der Erklärung zur Anwendbarkeit (SoA), den Risikobehandlungen und der Reifegrad-Baseline." },
        { title: "Vorgang", color: RT.stTeilweise, body: "Jede Kontrolle wird eine Maßnahme mit Status (Offen/Laufend/Fertig/Blockiert), Verantwortlichem, Fälligkeit und automatischer Priorität." },
        { title: "Ergebnis", color: RT.stJa, body: "Fortschrittsübersicht, Überfällig-Liste, Quick Wins, kritische Punkte — plus PDF/Word-Bericht für Management und Auditoren." },
      ]
    : [
        { title: "Input", color: "#241A4D", body: "Applicable controls from the Statement of Applicability (SoA), risk treatments, and the maturity baseline." },
        { title: "Process", color: RT.stTeilweise, body: "Each control becomes an action with status (Open/In Progress/Done/Blocked), owner, due date and auto-derived priority." },
        { title: "Output", color: RT.stJa, body: "Progress overview, overdue list, quick wins, critical items — and a PDF/Word report for management and auditors." },
      ];
  const nis2 = isNis2Active();
  const footer = t
    ? (nis2
        ? "<strong>Zwei Ansichten, gleiche Daten:</strong> Die Domänen-Ansicht gruppiert nach technischem Bereich (für IT-Teams). Die NIS2-Ansicht gruppiert nach Art. 21 Abs. 2 (a–j) (für Management und Auditoren)."
        : "<strong>Domänen-Ansicht:</strong> Maßnahmen gruppiert nach technischem Bereich.")
    : (nis2
        ? "<strong>Two views, same data:</strong> The Domain view groups actions by technical area (for IT teams). The NIS2 view groups by Art. 21(2) (a–j) (for management and auditors)."
        : "<strong>Domain view:</strong> Actions grouped by technical area.");

  const cardHtml = cards.map(c => `
    <div style="flex:1;border:1px solid #e2e8f0;border-left:4px solid ${c.color};border-radius:8px;padding:10px 12px;background:#fafbfc;">
      <div style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${c.color};margin-bottom:4px;">${escapeHtml(c.title)}</div>
      <div style="font-family:Arial,sans-serif;font-size:10px;color:#475569;line-height:1.5;">${escapeHtml(c.body)}</div>
    </div>`).join("");

  return sectionShell(
    t ? "Über diesen Bericht" : "About this report",
    `<p style="font-family:Arial,sans-serif;font-size:11px;color:#334155;line-height:1.55;margin:0 0 12px;">${escapeHtml(intro)}</p>
     <div style="display:flex;gap:10px;margin-bottom:12px;">${cardHtml}</div>
     <div style="background:${RT.stNaBg};border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-family:Arial,sans-serif;font-size:10px;color:#475569;line-height:1.55;">${footer}</div>`,
  );
}

function buildControlScopeSection(data: ExecutionReportData, lang: Lang): string {
  const t = lang === "de";
  const cs = data.controlScope;
  const cb = data.controlBased;
  const implPct = cs.finalScope > 0 ? Math.round((cs.implemented / cs.finalScope) * 100) : 0;

  return sectionShell(
    t ? "Kontrollumfang — zwei Zählbasen" : "Control Scope — two counting bases",
    `<div style="display:flex;gap:24px;">
      <div style="flex:1;">
        <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">
          <tr><td style="padding:6px 0;">${t ? "Basis-Maßnahmen (Aufgaben)" : "Baseline actions (tasks)"}</td><td style="text-align:right;font-weight:700;">${cs.BASELINE}</td></tr>
          <tr><td style="padding:4px 0 4px 16px;color:${RT.stNa};font-size:11px;">${t ? "Entbehrlich (N/A)" : "Not Applicable"}</td><td style="text-align:right;font-family:monospace;">− ${cs.entbehrlich}</td></tr>
          <tr><td style="padding:4px 0 4px 16px;color:${RT.stNa};font-size:11px;">${t ? "SoA-Ausschlüsse" : "SoA Excluded"}</td><td style="text-align:right;font-family:monospace;">− ${cs.soaExcluded}</td></tr>
          <tr><td style="padding:4px 0 4px 16px;color:${RT.stNa};font-size:11px;">${t ? "Manuell hinzugefügt" : "Manually Added"}</td><td style="text-align:right;font-family:monospace;">+ ${cs.soaAdded}</td></tr>
          <tr style="border-top:2px solid #e2e8f0;"><td style="padding:8px 0;font-weight:700;">${t ? "Finale Maßnahmen (Aufgaben)" : "Final actions (tasks)"}</td><td style="text-align:right;font-size:18px;font-weight:900;color:#241A4D;">${cs.finalScope}</td></tr>
        </table>
        <div style="font-family:monospace;font-size:9px;color:${RT.stNa};margin-top:4px;">${cs.BASELINE} − ${cs.entbehrlich} − ${cs.soaExcluded} + ${cs.soaAdded} = ${cs.finalScope}</div>
      </div>
      <div style="flex:1;">
        <div style="font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:${RT.stNa};margin-bottom:8px;">${t ? "Maßnahmenstatus (aufgabenbasiert)" : "Action status (task-based)"}</div>
        <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">
          <tr><td style="padding:4px 0;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${RT.stJa};margin-right:6px;vertical-align:middle;"></span>${t ? "Fertig" : "Done"}</td><td style="text-align:right;font-weight:700;">${cs.implemented}</td></tr>
          <tr><td style="padding:4px 0;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${RT.stTeilweise};margin-right:6px;vertical-align:middle;"></span>${t ? "Laufend" : "In Progress"}</td><td style="text-align:right;font-weight:700;">${cs.partial}</td></tr>
          <tr><td style="padding:4px 0;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${RT.stNein};margin-right:6px;vertical-align:middle;"></span>${t ? "Offen + Blockiert" : "Open + Blocked"}</td><td style="text-align:right;font-weight:700;">${cs.notImpl}</td></tr>
          <tr style="border-top:1px solid #e2e8f0;"><td style="padding:6px 0;font-weight:700;">${t ? "Offene Kontrollen" : "Open Controls"}</td><td style="text-align:right;font-weight:800;color:${RT.stNein};">${cs.partial + cs.notImpl}</td></tr>
        </table>
        <div style="width:100%;height:8px;background:#e2e8f0;border-radius:4px;margin-top:8px;overflow:hidden;">
          <div style="width:${implPct}%;height:100%;background:${RT.stJa};border-radius:4px;"></div>
        </div>
        <div style="font-family:Arial,sans-serif;font-size:9px;color:${RT.stNa};text-align:right;margin-top:2px;">${implPct}% ${t ? "der Aufgaben fertig" : "of tasks done"}</div>
      </div>
      ${cb ? `<div style="flex:1;">
        <div style="font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:${RT.stNa};margin-bottom:8px;">${t ? "Kontrollstatus (kontrollbasiert — wie Bildschirm)" : "Control status (control-based — as on screen)"}</div>
        <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">
          <tr><td style="padding:6px 0;">${t ? "Anwendbare Kontrollen (SoA)" : "Applicable controls (SoA)"}</td><td style="text-align:right;font-weight:700;">${cb.applicable}</td></tr>
          <tr><td style="padding:4px 0;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${RT.stJa};margin-right:6px;vertical-align:middle;"></span>${t ? "Umgesetzt" : "Implemented"}</td><td style="text-align:right;font-weight:700;">${cb.implemented}</td></tr>
          <tr><td style="padding:4px 0;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${RT.stTeilweise};margin-right:6px;vertical-align:middle;"></span>${t ? "Teilweise" : "Partial"}</td><td style="text-align:right;font-weight:700;">${cb.partial}</td></tr>
          <tr><td style="padding:4px 0;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${RT.stNein};margin-right:6px;vertical-align:middle;"></span>${t ? "Offen" : "Open"}</td><td style="text-align:right;font-weight:700;">${cb.open}</td></tr>
          <tr style="border-top:2px solid #e2e8f0;"><td style="padding:8px 0;font-weight:700;">${t ? "Umsetzungsgrad" : "Implementation level"}</td><td style="text-align:right;font-size:18px;font-weight:900;color:#241A4D;">${cb.gradePct}%</td></tr>
          <tr><td style="padding:4px 0;color:${RT.stTeilweise};font-weight:600;">${t ? "Fertig ohne Nachweis" : "Done without evidence"}</td><td style="text-align:right;font-weight:800;color:${RT.stTeilweise};">${cb.noEvidence}</td></tr>
          <tr><td style="padding:4px 0;color:${RT.stNein};font-weight:600;">${t ? "Überfällig" : "Overdue"}</td><td style="text-align:right;font-weight:800;color:${RT.stNein};">${cb.overdue}</td></tr>
        </table>
        <div style="font-family:Arial,sans-serif;font-size:9px;color:${RT.stNa};margin-top:6px;line-height:1.4;">${t
          ? "„Fertig ohne Nachweis" + String.fromCharCode(8220) + " ist im Audit nicht belastbar: der Status ist gesetzt, ein Nachweis fehlt."
          : "&#8222;Done without evidence&#8220; does not hold up in an audit: the status is set but no evidence is attached."}</div>
      </div>` : ""}
    </div>
    <div style="margin-top:10px;font-family:Arial,sans-serif;font-size:9.5px;color:${RT.stNa};line-height:1.5;border-top:1px solid #e2e8f0;padding-top:6px;">${t
      ? "Zwei Zählbasen, absichtlich getrennt: <b>Aufgaben</b> sind gebündelte Maßnahmen (eine Aufgabe kann mehrere Kontrollen abdecken) — sie steuern Aufwand und Termine. <b>Kontrollen</b> sind die anwendbaren Einzelkontrollen der Anwendbarkeitserklärung — sie steuern den Umsetzungsgrad und die Berichte an die Leitung. Die Zahlen sind deshalb unterschiedlich und dürfen nicht gegeneinander gerechnet werden."
      : "Two counting bases, deliberately separate: <b>tasks</b> are bundled actions (one task can cover several controls) — they drive effort and deadlines. <b>Controls</b> are the applicable individual controls from the Statement of Applicability — they drive the implementation level and management reporting. The figures therefore differ and must not be offset against each other."}</div>`,
    explanations.control_scope[lang],
  );
}

function buildChartSection(
  groups: ExecGroupData[],
  lang: Lang,
  titleOverride?: { de: string; en: string },
): string {
  const t = lang === "de";
  if (!groups || groups.length === 0) return "";

  const maxVal = Math.max(...groups.map(d => d.completed + d.inProgress + d.notStarted), 1);
  const barRows = groups.map(d => {
    const total = d.completed + d.inProgress + d.notStarted;
    const cW = total > 0 ? (d.completed / maxVal) * 100 : 0;
    const iW = total > 0 ? (d.inProgress / maxVal) * 100 : 0;
    const nW = total > 0 ? (d.notStarted / maxVal) * 100 : 0;
    return `<tr>
      <td style="padding:5px 8px;font-family:Arial,sans-serif;font-size:10px;line-height:1.35;">${escapeHtml(d.name)}</td>
      <td style="padding:5px 8px;">
        <div style="display:flex;height:16px;border-radius:4px;overflow:hidden;background:${RT.stNaBg};">
          ${cW > 0 ? `<div style="width:${cW}%;background:${RT.stJa};"></div>` : ""}
          ${iW > 0 ? `<div style="width:${iW}%;background:${RT.stTeilweise};"></div>` : ""}
          ${nW > 0 ? `<div style="width:${nW}%;background:${RT.stNa};"></div>` : ""}
        </div>
      </td>
      <td style="padding:5px 8px;font-family:Arial,sans-serif;font-size:10px;text-align:right;white-space:nowrap;">${d.completed}/${total}</td>
    </tr>`;
  }).join("");

  const legend = `<div style="display:flex;gap:16px;margin-top:10px;font-family:Arial,sans-serif;font-size:10px;color:${RT.stNa};">
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${RT.stJa};margin-right:4px;vertical-align:middle;"></span>${t ? "Abgeschlossen" : "Completed"}</span>
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${RT.stTeilweise};margin-right:4px;vertical-align:middle;"></span>${t ? "In Bearbeitung" : "In Progress"}</span>
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${RT.stNa};margin-right:4px;vertical-align:middle;"></span>${t ? "Nicht gestartet" : "Not Started"}</span>
  </div>`;

  const title = titleOverride
    ? (t ? titleOverride.de : titleOverride.en)
    : (t ? "Umsetzungsfortschritt pro Bereich" : "Execution Progress by Area");

  return sectionShell(
    title,
    `<table style="width:100%;border-collapse:collapse;table-layout:fixed;">
       <colgroup><col style="width:26%"/><col/><col style="width:13%"/></colgroup>
       ${barRows}</table>${legend}`,
    explanations.execution_chart[lang],
  );
}

function buildNotesSection(notes: string | undefined, lang: Lang): string {
  const t = lang === "de";
  if (!notes || !notes.trim()) return "";
  const safe = escapeHtml(notes).replace(/\n/g, "<br/>");
  return sectionShell(
    t ? "Benutzer-Notizen" : "User Notes",
    `<div style="font-family:Arial,sans-serif;font-size:11px;line-height:1.55;color:#1e293b;white-space:pre-wrap;">${safe}</div>`,
  );
}

function buildInsightsSection(insights: ExecutionInsight[], lang: Lang): string {
  const t = lang === "de";
  if (insights.length === 0) return "";

  const iconMap: Record<string, string> = { overdue: "⚠️", critical_delay: "🔴", fastest: "✅", blocked: "🟡" };
  const bgMap: Record<string, string> = { overdue: RT.stNeinBg, critical_delay: RT.stNeinBg, fastest: RT.stJaBg, blocked: "#fffbeb" };
  const borderMap: Record<string, string> = { overdue: "#fca5a5", critical_delay: RT.stNein, fastest: "#86efac", blocked: "#fcd34d" };

  const rows = insights.slice(0, 8).map(ins => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:10px;margin-bottom:4px;border:1px solid ${borderMap[ins.type] || "#e2e8f0"};border-left:4px solid ${borderMap[ins.type] || "#e2e8f0"};border-radius:8px;background:${bgMap[ins.type] || "#fafbfc"};">
      <span style="font-size:16px;line-height:1;">${iconMap[ins.type] || "ℹ️"}</span>
      <div style="font-family:Arial,sans-serif;">
        <div style="font-size:11px;font-weight:600;color:#1e293b;">${escapeHtml(t ? ins.groupTitle : ins.groupTitleEn)}</div>
        <div style="font-size:10px;color:#475569;margin-top:2px;">${escapeHtml(t ? ins.detail : ins.detailEn)}</div>
      </div>
    </div>
  `).join("");

  return sectionShell(t ? "Fortschritts-Erkenntnisse" : "Progress Insights", rows);
}

function buildActionTableSections(items: ActionItemForReport[], lang: Lang): string[] {
  const t = lang === "de";
  if (items.length === 0) return [];

  const CHUNK_SIZE = 25;
  const headerCells = [
    { label: "ID", width: "8%" },
    { label: t ? "Kontrolle" : "Control", width: "30%" },
    { label: t ? "Priorität" : "Priority", width: "10%" },
    { label: t ? "Verantwortlich" : "Owner", width: "16%" },
    { label: t ? "Fällig" : "Due", width: "12%" },
    { label: "Status", width: "12%" },
    { label: t ? "Risiko" : "Risk", width: "12%" },
  ];

  const header = headerCells.map(h =>
    `<th style="padding:8px 6px;text-align:left;font-family:Arial,sans-serif;font-size:9px;color:#ffffff;background:#241A4D;border-bottom:2px solid ${RT.copper};width:${h.width};">${h.label}</th>`
  ).join("");

  const sections: string[] = [];
  const totalChunks = Math.ceil(items.length / CHUNK_SIZE);

  for (let chunk = 0; chunk < totalChunks; chunk++) {
    const start = chunk * CHUNK_SIZE;
    const chunkItems = items.slice(start, start + CHUNK_SIZE);
    const isFirst = chunk === 0;
    const isLast = chunk === totalChunks - 1;

    const rows = chunkItems.map((item, idx) => {
      const realIdx = start + idx;
      const bg = item.isOverdue ? RT.stNeinBg : realIdx % 2 === 0 ? "#ffffff" : "#f8fafc";
      const pColor = priorityColor(item.priority);
      const pBg = priorityBg(item.priority);
      return `<tr style="background:${bg};">
        <td style="padding:6px;font-family:monospace;font-size:9px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.id)}</td>
        <td style="padding:6px;font-family:Arial,sans-serif;font-size:9px;border-bottom:1px solid #e2e8f0;">${escapeHtml(t ? item.name : item.nameEn)}${item.isOverdue ? ` <span style="color:${RT.stNein};font-weight:700;">⚠</span>` : ""}</td>
        <td style="padding:6px;border-bottom:1px solid #e2e8f0;">${item.priority ? `<span style="display:inline-block;padding:2px 6px;border-radius:4px;font-family:Arial,sans-serif;font-size:8px;font-weight:600;background:${pBg};color:${pColor};">${priorityLabel(item.priority, lang)}</span>` : `<span style="color:${RT.stNa};">—</span>`}</td>
        <td style="padding:6px;font-family:Arial,sans-serif;font-size:9px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.actionOwner || "—")}</td>
        <td style="padding:6px;font-family:Arial,sans-serif;font-size:9px;border-bottom:1px solid #e2e8f0;${item.isOverdue ? `color:${RT.stNein};font-weight:600;` : ""}">${escapeHtml(fmtDue(item.actionDueDate, lang))}</td>
        <td style="padding:6px;font-family:Arial,sans-serif;font-size:9px;border-bottom:1px solid #e2e8f0;">${statusLabel(item.actionStatus, lang)}</td>
        <td style="padding:6px;font-family:Arial,sans-serif;font-size:9px;border-bottom:1px solid #e2e8f0;">${item.linkedToHighRisk ? `<span style="color:${RT.stNein};font-weight:700;">⚠ ${t ? "Hoch" : "High"}</span>` : "—"}</td>
      </tr>`;
    }).join("");

    const title = isFirst
      ? (t ? "Maßnahmentabelle" : "Action Table")
      : (t ? `Maßnahmentabelle (Forts. ${chunk + 1}/${totalChunks})` : `Action Table (cont. ${chunk + 1}/${totalChunks})`);
    const info = isFirst ? explanations.action_table[lang] : undefined;
    const counter = isLast
      ? `<div style="font-family:Arial,sans-serif;font-size:10px;color:${RT.stNa};margin-top:8px;text-align:right;">${t ? "Gesamt" : "Total"}: ${items.length} ${t ? "Maßnahmen" : "actions"}</div>`
      : "";

    sections.push(sectionShell(
      title,
      `<table style="width:100%;border-collapse:collapse;"><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table>${counter}`,
      info,
    ));
  }

  return sections;
}

// ── PDF Renderer ──

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
    await new Promise(r => setTimeout(r, 150));
    const sectionEls = container.querySelectorAll<HTMLElement>("[data-pdf-section]");
    const sectionList = Array.from(sectionEls);
    pdfProgress.setTotal(sectionList.length, "render");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const usableH = PAGE.height - PAGE.margin - PAGE.footerH; // leave space for page number
    let y = PAGE.margin;
    let _sIdx = 0;

    for (const el of sectionList) {
      // Scale 2 statt 1.5: Text wird im PDF sichtbar schärfer (premium).
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
      // Seitenumbruch über addCanvasPaged. Geschnitten wird an den ECHTEN
      // Blockkanten aus dem DOM (Unterkante jeder Tabellenzeile, Karte,
      // Absatz) — nicht an einer geratenen Pixelzeile. Eine dichte Tabelle
      // mit getönten Wechselzeilen hat keine weiße Bildzeile; genau dort
      // wurde vorher mitten durch eine Zeile geschnitten.
      const edges = domCutEdges(el, canvas.height);
      y = addCanvasPaged(
        pdf,
        canvas,
        { pageW: PAGE.width, pageH: PAGE.height - PAGE.footerH, margin: PAGE.margin, gap: PAGE.gap },
        y,
        0.94, // JPEG-Qualität hoch: 0.82 erzeugte sichtbare Artefakte an Kanten
        edges,
      );
      _sIdx++;
      pdfProgress.update(_sIdx);
      await new Promise(r => setTimeout(r, 0));
    }
    pdfProgress.finalize();

    // Add page numbers "1/N" at the bottom of every page
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

// ── Public API ──

export async function generateExecutionPDF(data: ExecutionReportData, lang: Lang, companyName: string) {
  const sections: string[] = [];
  sections.push(buildHeroSection(data, lang, companyName));
  sections.push(buildAboutSection(lang));
  sections.push(buildControlScopeSection(data, lang));
  const domainGroups = data.chartDataDomain ?? data.chartData;
  const nis2Groups = data.chartDataNis2;
  sections.push(buildChartSection(domainGroups, lang, {
    de: "Umsetzungsfortschritt — Fähigkeiten-Ansicht",
    en: "Execution Progress — Domain View",
  }));
  if (isNis2Active() && nis2Groups && nis2Groups.length > 0) {
    sections.push(buildChartSection(nis2Groups, lang, {
      de: "Umsetzungsfortschritt — NIS2 Art. 21(2)",
      en: "Execution Progress — NIS2 Art. 21(2)",
    }));
  }
  sections.push(buildInsightsSection(data.insights, lang));
  sections.push(buildNotesSection(data.userNotes, lang));
  sections.push(...buildActionTableSections(data.actionItems, lang));
  const filename = `execution-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  await renderSectionsToPdf(sections.filter(Boolean), filename);
}

export async function generateExecutionWord(data: ExecutionReportData, lang: Lang, companyName: string) {
  const t = lang === "de";
  const accentColor = "241A4D";
  const goldColor = "DB2477";
  const lightBg = "F1F5F9";
  const infoBg = "EEF2FF";
  const infoColor = "4338CA";

  const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" };
  const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
  const headerCellBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: accentColor },
    bottom: { style: BorderStyle.SINGLE, size: 3, color: goldColor },
    left: { style: BorderStyle.SINGLE, size: 1, color: accentColor },
    right: { style: BorderStyle.SINGLE, size: 1, color: accentColor },
  };

  function infoTip(text: string): Paragraph {
    return new Paragraph({
      spacing: { before: 80, after: 120 },
      border: { left: { style: BorderStyle.SINGLE, size: 8, color: "C7D2FE", space: 8 } },
      shading: { fill: infoBg, type: ShadingType.CLEAR, color: "auto" },
      children: [
        new TextRun({ text: "ⓘ ", bold: true, size: 18, font: "Arial", color: infoColor }),
        new TextRun({ text, italics: true, size: 16, font: "Arial", color: infoColor }),
      ],
    });
  }

  function sectionHeading(text: string, level: typeof HeadingLevel.HEADING_1 | typeof HeadingLevel.HEADING_2 = HeadingLevel.HEADING_1): Paragraph {
    return new Paragraph({
      heading: level,
      spacing: { before: 300, after: 60 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: goldColor, space: 4 } },
      children: [new TextRun({ text, bold: true, size: level === HeadingLevel.HEADING_1 ? 28 : 24, font: "Arial", color: accentColor })],
    });
  }

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(new Paragraph({
    spacing: { after: 40 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: accentColor, space: 6 } },
    children: [new TextRun({ text: t ? "Umsetzung & Monitoring" : "Execution & Monitoring", bold: true, size: 40, font: "Arial", color: accentColor })],
  }));
  children.push(new Paragraph({
    spacing: { after: 40 },
    children: [
      new TextRun({ text: `${t ? "Unternehmen" : "Company"}: `, size: 20, font: "Arial", color: "64748B" }),
      new TextRun({ text: companyName || "—", bold: true, size: 20, font: "Arial" }),
      new TextRun({ text: `   |   ${t ? "Erstellt am" : "Generated"}: `, size: 20, font: "Arial", color: "64748B" }),
      new TextRun({ text: new Date().toLocaleDateString(t ? "de-DE" : "en-US"), bold: true, size: 20, font: "Arial" }),
    ],
  }));
  children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  // Über diesen Bericht
  children.push(sectionHeading(t ? "Über diesen Bericht" : "About this report"));
  children.push(new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({
      text: t
        ? "Die Reifegrad-Analyse hat gezeigt, wie reif die Organisation ist. Die Umsetzung wandelt das in konkrete Maßnahmen um: Wer macht was, bis wann, und was ist blockiert."
        : "The maturity analysis showed how mature the organisation is. Implementation turns that into concrete actions: who does what, by when, and what is blocked.",
      size: 20, font: "Arial", color: "334155",
    })],
  }));
  const aboutCards: Array<[string, string, string]> = t
    ? [
        ["Eingang", "Anwendbare Kontrollen aus der Erklärung zur Anwendbarkeit (SoA), den Risikobehandlungen und der Reifegrad-Baseline.", "241A4D"],
        ["Vorgang", "Jede Kontrolle wird eine Maßnahme mit Status (Offen/Laufend/Fertig/Blockiert), Verantwortlichem, Fälligkeit und automatischer Priorität.", "D97706"],
        ["Ergebnis", "Fortschrittsübersicht, Überfällig-Liste, Quick Wins, kritische Punkte — plus PDF/Word-Bericht für Management und Auditoren.", "16A34A"],
      ]
    : [
        ["Input", "Applicable controls from the Statement of Applicability (SoA), risk treatments, and the maturity baseline.", "241A4D"],
        ["Process", "Each control becomes an action with status (Open/In Progress/Done/Blocked), owner, due date and auto-derived priority.", "D97706"],
        ["Output", "Progress overview, overdue list, quick wins, critical items — and a PDF/Word report for management and auditors.", "16A34A"],
      ];
  children.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3120, 3120, 3120],
    rows: [new TableRow({
      children: aboutCards.map(([title, body, color]) => new TableCell({
        borders,
        width: { size: 3120, type: WidthType.DXA },
        shading: { fill: "FAFBFC", type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 120, bottom: 120, left: 140, right: 140 },
        children: [
          new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: title, bold: true, size: 20, font: "Arial", color })] }),
          new Paragraph({ children: [new TextRun({ text: body, size: 18, font: "Arial", color: "475569" })] }),
        ],
      })),
    })],
  }));
  const _nis2 = isNis2Active();
  children.push(new Paragraph({
    spacing: { before: 120, after: 200 },
    shading: { fill: "F1F5F9", type: ShadingType.CLEAR, color: "auto" },
    border: { left: { style: BorderStyle.SINGLE, size: 8, color: "CBD5E1", space: 8 } },
    children: [
      new TextRun({ text: t
        ? (_nis2 ? "Zwei Ansichten, gleiche Daten: " : "Domänen-Ansicht: ")
        : (_nis2 ? "Two views, same data: " : "Domain view: "),
        bold: true, size: 18, font: "Arial", color: "1E293B" }),
      new TextRun({
        text: t
          ? (_nis2
              ? "Die Domänen-Ansicht gruppiert nach technischem Bereich (für IT-Teams). Die NIS2-Ansicht gruppiert nach Art. 21 Abs. 2 (a–j) (für Management und Auditoren)."
              : "Maßnahmen gruppiert nach technischem Bereich.")
          : (_nis2
              ? "The Domain view groups actions by technical area (for IT teams). The NIS2 view groups by Art. 21(2) (a–j) (for management and auditors)."
              : "Actions grouped by technical area."),
        size: 18, font: "Arial", color: "475569",
      }),
    ],
  }));

  children.push(sectionHeading(t ? "Maßnahmenübersicht" : "Action Overview"));
  children.push(infoTip(explanations.action_stats[lang]));

  const statHeaders = [t ? "Fertig" : "Done", t ? "Laufend" : "In Progress", t ? "Offen" : "Open", t ? "Blockiert" : "Blocked"];
  const statValues = [data.actionStats.completed, data.actionStats.inProgress, data.actionStats.notStarted, data.actionStats.blocked];
  const statPcts = [data.actionStats.completedPct, data.actionStats.inProgressPct, data.actionStats.notStartedPct, data.actionStats.blockedPct];
  const statColors = ["16A34A", "D97706", "64748B", "EA580C"];

  children.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2340, 2340, 2340, 2340],
    rows: [
      new TableRow({
        children: statHeaders.map((h, i) => new TableCell({
          width: { size: 2340, type: WidthType.DXA },
          borders: noBorders,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${statValues[i]}`, bold: true, size: 40, font: "Arial", color: statColors[i] })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${h} (${statPcts[i]}%)`, size: 16, font: "Arial", color: "64748B" })] }),
          ],
        })),
      }),
    ],
  }));
  children.push(new Paragraph({ spacing: { after: 60 }, children: [] }));

  // Priority blocks
  const prioLabels = [t ? "Kritisch" : "Critical", "Quick Wins", t ? "Überfällig" : "Overdue", t ? "Blockierte" : "Blocked"];
  const prioValues = [data.criticalCount, data.quickWinCount, data.overdueCount, data.blockedCount ?? 0];
  const prioColors = ["DC2626", "D97706", "EA580C", "B45309"];
  const prioColWidth = 2340;

  children.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [prioColWidth, prioColWidth, prioColWidth, prioColWidth],
    rows: [
      new TableRow({
        children: prioLabels.map((lbl, i) => new TableCell({
          width: { size: prioColWidth, type: WidthType.DXA },
          borders,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${prioValues[i]}`, bold: true, size: 32, font: "Arial", color: prioColors[i] })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: lbl, size: 16, font: "Arial", color: prioColors[i] })] }),
          ],
        })),
      }),
    ],
  }));
  children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  // Control Scope
  children.push(sectionHeading(t ? "Kontrollumfang" : "Control Scope"));
  children.push(infoTip(explanations.control_scope[lang]));

  const cs = data.controlScope;
  const cb = data.controlBased;
  const scopeRows = [
    [t ? "AUFGABEN (gebündelte Maßnahmen)" : "TASKS (bundled actions)", ""],
    [t ? "Basis-Maßnahmen" : "Baseline actions", `${cs.BASELINE}`],
    [t ? "  − Entbehrlich (N/A)" : "  − Not Applicable", `− ${cs.entbehrlich}`],
    [t ? "  − SoA-Ausschlüsse" : "  − SoA Excluded", `− ${cs.soaExcluded}`],
    [t ? "  + Manuell hinzugefügt" : "  + Manually Added", `+ ${cs.soaAdded}`],
    [t ? "Finale Maßnahmen" : "Final actions", `${cs.finalScope}`],
    ...(cb ? [
      ["", ""],
      [t ? "KONTROLLEN (Einzelkontrollen der SoA — wie Bildschirm)" : "CONTROLS (individual SoA controls — as on screen)", ""],
      [t ? "Anwendbare Kontrollen" : "Applicable controls", `${cb.applicable}`],
      [t ? "  Umgesetzt" : "  Implemented", `${cb.implemented}`],
      [t ? "  Teilweise" : "  Partial", `${cb.partial}`],
      [t ? "  Offen" : "  Open", `${cb.open}`],
      [t ? "Umsetzungsgrad" : "Implementation level", `${cb.gradePct}%`],
      [t ? "Fertig ohne Nachweis (im Audit nicht belastbar)" : "Done without evidence (not audit-proof)", `${cb.noEvidence}`],
      [t ? "Überfällig" : "Overdue", `${cb.overdue}`],
    ] : []),
  ];

  children.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [7000, 2360],
    rows: scopeRows.map((row, idx) => {
      const isLast = idx === scopeRows.length - 1;
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 7000, type: WidthType.DXA },
            borders: isLast ? { ...borders, top: { style: BorderStyle.SINGLE, size: 3, color: accentColor } } : noBorders,
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: row[0], bold: isLast, size: isLast ? 22 : 18, font: "Arial", color: row[0].startsWith("  ") ? "64748B" : "1E293B" })] })],
          }),
          new TableCell({
            width: { size: 2360, type: WidthType.DXA },
            borders: isLast ? { ...borders, top: { style: BorderStyle.SINGLE, size: 3, color: accentColor } } : noBorders,
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: row[1], bold: isLast, size: isLast ? 26 : 18, font: "Arial", color: isLast ? accentColor : "1E293B" })] })],
          }),
        ],
      });
    }),
  }));

  // Gap breakdown
  children.push(new Paragraph({ spacing: { after: 60 }, children: [] }));
  const gapRows = [
    [t ? "Umgesetzt (Ja)" : "Implemented", `${cs.implemented}`, "16A34A"],
    [t ? "Teilweise" : "Partial", `${cs.partial}`, "D97706"],
    [t ? "Nicht umgesetzt" : "Not Implemented", `${cs.notImpl}`, "DC2626"],
    [t ? "Offene Kontrollen" : "Open Controls", `${cs.partial + cs.notImpl}`, "DC2626"],
  ];

  children.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [7000, 2360],
    rows: gapRows.map((row, idx) => {
      const isLast = idx === gapRows.length - 1;
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 7000, type: WidthType.DXA },
            borders: isLast ? { ...borders, top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } } : noBorders,
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: row[0], bold: isLast, size: 18, font: "Arial" })] })],
          }),
          new TableCell({
            width: { size: 2360, type: WidthType.DXA },
            borders: isLast ? { ...borders, top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } } : noBorders,
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: row[1], bold: true, size: 18, font: "Arial", color: row[2] })] })],
          }),
        ],
      });
    }),
  }));
  children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  // Execution Progress Tables (Domain + NIS2)
  const renderChartTable = (groups: ExecGroupData[], titleDe: string, titleEn: string) => {
    if (!groups || groups.length === 0) return;
    children.push(sectionHeading(t ? titleDe : titleEn, HeadingLevel.HEADING_2));
    children.push(infoTip(explanations.execution_chart[lang]));

    const chartHeaders = [t ? "Bereich" : "Area", t ? "Abgeschl." : "Completed", t ? "Laufend" : "In Progress", t ? "Offen" : "Open", t ? "Überfällig" : "Overdue"];
    children.push(new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [4200, 1290, 1290, 1290, 1290],
      rows: [
        new TableRow({
          children: chartHeaders.map((h, i) => new TableCell({
            width: { size: i === 0 ? 4200 : 1290, type: WidthType.DXA },
            borders: headerCellBorders,
            shading: { fill: accentColor, type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 16, font: "Arial", color: "FFFFFF" })] })],
          })),
        }),
        ...groups.map((d, idx) => {
          const rowBg = idx % 2 === 0 ? "FFFFFF" : lightBg;
          const rowShading = { fill: rowBg, type: ShadingType.CLEAR, color: "auto" };
          return new TableRow({
            children: [
              new TableCell({ width: { size: 4200, type: WidthType.DXA }, borders, shading: rowShading, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: d.name, size: 18, font: "Arial", bold: true })] })] }),
              new TableCell({ width: { size: 1290, type: WidthType.DXA }, borders, shading: rowShading, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${d.completed}`, size: 18, font: "Arial", color: "16A34A", bold: true })] })] }),
              new TableCell({ width: { size: 1290, type: WidthType.DXA }, borders, shading: rowShading, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${d.inProgress}`, size: 18, font: "Arial", color: "EAB308" })] })] }),
              new TableCell({ width: { size: 1290, type: WidthType.DXA }, borders, shading: rowShading, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${d.notStarted}`, size: 18, font: "Arial", color: "64748B" })] })] }),
              new TableCell({ width: { size: 1290, type: WidthType.DXA }, borders, shading: rowShading, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: d.overdue > 0 ? `⚠ ${d.overdue}` : "—", size: 18, font: "Arial", bold: d.overdue > 0, color: d.overdue > 0 ? "DC2626" : "718096" })] })] }),
            ],
          });
        }),
      ],
    }));
    children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  };

  renderChartTable(
    data.chartDataDomain ?? data.chartData,
    "Umsetzungsfortschritt — Fähigkeiten-Ansicht",
    "Execution Progress — Domain View",
  );
  if (isNis2Active() && data.chartDataNis2 && data.chartDataNis2.length > 0) {
    renderChartTable(
      data.chartDataNis2,
      "Umsetzungsfortschritt — NIS2 Art. 21(2)",
      "Execution Progress — NIS2 Art. 21(2)",
    );
  }

  // Insights
  if (data.insights.length > 0) {
    children.push(sectionHeading(t ? "Fortschritts-Erkenntnisse" : "Progress Insights", HeadingLevel.HEADING_2));
    const colorMap: Record<string, string> = { overdue: "FECACA", critical_delay: "FCA5A5", fastest: "BBF7D0", blocked: "FDE68A" };
    const bgMap: Record<string, string> = { overdue: "FEF2F2", critical_delay: "FEF2F2", fastest: "F0FDF4", blocked: "FFFBEB" };

    for (const ins of data.insights.slice(0, 8)) {
      const borderColor = colorMap[ins.type] || "E2E8F0";
      const bg = bgMap[ins.type] || "FAFBFC";
      children.push(new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({
          children: [new TableCell({
            width: { size: 9360, type: WidthType.DXA },
            borders: { top: thinBorder, bottom: thinBorder, right: thinBorder, left: { style: BorderStyle.SINGLE, size: 8, color: borderColor } },
            shading: { fill: bg, type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            children: [
              new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: t ? ins.groupTitle : ins.groupTitleEn, bold: true, size: 20, font: "Arial", color: "1E293B" })] }),
              new Paragraph({ children: [new TextRun({ text: t ? ins.detail : ins.detailEn, size: 18, font: "Arial", color: "475569" })] }),
            ],
          })],
        })],
      }));
    }
    children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  }

  // User Notes
  if (data.userNotes && data.userNotes.trim()) {
    children.push(sectionHeading(t ? "Benutzer-Notizen" : "User Notes", HeadingLevel.HEADING_2));
    for (const line of data.userNotes.split(/\n/)) {
      children.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: line || " ", size: 20, font: "Arial", color: "1E293B" })],
      }));
    }
    children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  }

  // Action Table
  if (data.actionItems.length > 0) {
    children.push(sectionHeading(t ? "Maßnahmentabelle" : "Action Table"));
    children.push(infoTip(explanations.action_table[lang]));

    const aHeaders = ["ID", t ? "Kontrolle" : "Control", t ? "Priorität" : "Priority", t ? "Verantw." : "Owner", t ? "Fällig" : "Due", "Status"];
    const colWidths = [1000, 3560, 1000, 1400, 1200, 1200];

    const maxItems = 80;
    const items = data.actionItems.slice(0, maxItems);

    children.push(new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: colWidths,
      rows: [
        new TableRow({
          children: aHeaders.map((h, i) => new TableCell({
            width: { size: colWidths[i], type: WidthType.DXA },
            borders: headerCellBorders,
            shading: { fill: accentColor, type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 40, bottom: 40, left: 60, right: 60 },
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 14, font: "Arial", color: "FFFFFF" })] })],
          })),
        }),
        ...items.map((item, idx) => {
          const rowBg = item.isOverdue ? "FEF2F2" : idx % 2 === 0 ? "FFFFFF" : lightBg;
          const rowShading = { fill: rowBg, type: ShadingType.CLEAR, color: "auto" };
          const pColor = item.priority === "high" ? "DC2626" : item.priority === "medium" ? "D97706" : "64748B";
          return new TableRow({
            children: [
              new TableCell({ width: { size: colWidths[0], type: WidthType.DXA }, borders, shading: rowShading, margins: { top: 30, bottom: 30, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: item.id, size: 14, font: "Courier New" })] })] }),
              new TableCell({ width: { size: colWidths[1], type: WidthType.DXA }, borders, shading: rowShading, margins: { top: 30, bottom: 30, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: t ? item.name : item.nameEn, size: 14, font: "Arial" })] })] }),
              new TableCell({ width: { size: colWidths[2], type: WidthType.DXA }, borders, shading: rowShading, margins: { top: 30, bottom: 30, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: priorityLabel(item.priority, lang), size: 14, font: "Arial", bold: true, color: pColor })] })] }),
              new TableCell({ width: { size: colWidths[3], type: WidthType.DXA }, borders, shading: rowShading, margins: { top: 30, bottom: 30, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: item.actionOwner || "—", size: 14, font: "Arial" })] })] }),
              new TableCell({ width: { size: colWidths[4], type: WidthType.DXA }, borders, shading: rowShading, margins: { top: 30, bottom: 30, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: fmtDue(item.actionDueDate, lang), size: 14, font: "Arial", color: item.isOverdue ? "DC2626" : "1E293B", bold: item.isOverdue })] })] }),
              new TableCell({ width: { size: colWidths[5], type: WidthType.DXA }, borders, shading: rowShading, margins: { top: 30, bottom: 30, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: statusLabel(item.actionStatus, lang), size: 14, font: "Arial" })] })] }),
            ],
          });
        }),
      ],
    }));

    if (data.actionItems.length > maxItems) {
      children.push(new Paragraph({
        spacing: { before: 60 },
        children: [new TextRun({ text: `+${data.actionItems.length - maxItems} ${t ? "weitere Maßnahmen" : "more actions"}`, size: 16, font: "Arial", color: "64748B", italics: true })],
      }));
    }
  }

  // Bildschirm-Diagramme (Stand der Ansicht) 1:1 übernehmen — Farben werden aus
  // den berechneten Bildschirmwerten eingefroren, nichts wird dunkler/blasser.
  try {
    const figs = await rkCaptureChartsPng(null, { max: 6 });
    if (figs.length) {
      children.push(new Paragraph({
        spacing: { before: 320, after: 120 },
        children: [new TextRun({ text: t ? "Abbildungen (Stand der Ansicht)" : "Figures (as displayed)", bold: true, size: 28, font: "Arial", color: accentColor })],
      }));
      for (const f of figs) {
        const w = Math.min(460, f.width);
        const h = Math.max(1, Math.round(f.height * (w / Math.max(1, f.width))));
        if (f.title) {
          children.push(new Paragraph({
            spacing: { before: 140, after: 40 },
            children: [new TextRun({ text: f.title, bold: true, size: 18, font: "Arial", color: "475569" })],
          }));
        }
        children.push(new Paragraph({ children: [new ImageRun({ data: f.data, transformation: { width: w, height: h } })] }));
      }
    }
  } catch { /* Grafiken sind optional — der Bericht darf daran nicht scheitern */ }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    sections: [{
      properties: { page: { margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } } },
      footers: {
        default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: "718096" }),
          new TextRun({ text: "/", size: 16, font: "Arial", color: "718096" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: "Arial", color: "718096" }),
        ] })] }),
      },
      children,
    }],
  });

  const buffer = await Packer.toBlob(doc);
  const filename = `execution-report-${new Date().toISOString().slice(0, 10)}.docx`;
  saveAs(buffer, filename);
}

/** Umsetzung als Excel — beide Zählbasen + filterbare Maßnahmenliste. */
export async function generateExecutionExcel(data: ExecutionReportData, lang: Lang) {
  const de = lang === "de";
  const cs = data.controlScope;
  const cb = data.controlBased;
  const sheets: any[] = [{
    name: de ? "Kennzahlen" : "Key figures",
    note: de
      ? "Zwei Zaehlbasen: AUFGABEN sind gebuendelte Massnahmen, KONTROLLEN sind die anwendbaren Einzelkontrollen der SoA. Die Zahlen duerfen nicht gegeneinander gerechnet werden."
      : "Two counting bases: TASKS are bundled actions, CONTROLS are the applicable individual SoA controls. The figures must not be offset against each other.",
    columns: [
      { header: de ? "Basis" : "Basis", key: "b", width: 16 },
      { header: de ? "Kennzahl" : "Metric", key: "k", width: 44 },
      { header: de ? "Wert" : "Value", key: "v", width: 14, kind: "num" },
    ],
    rows: [
      { b: de ? "Aufgaben" : "Tasks", k: de ? "Basis-Massnahmen" : "Baseline actions", v: cs.BASELINE },
      { b: de ? "Aufgaben" : "Tasks", k: de ? "Entbehrlich (N/A)" : "Not applicable", v: cs.entbehrlich },
      { b: de ? "Aufgaben" : "Tasks", k: de ? "SoA-Ausschluesse" : "SoA excluded", v: cs.soaExcluded },
      { b: de ? "Aufgaben" : "Tasks", k: de ? "Finale Massnahmen" : "Final actions", v: cs.finalScope },
      { b: de ? "Aufgaben" : "Tasks", k: de ? "Fertig" : "Done", v: cs.implemented },
      { b: de ? "Aufgaben" : "Tasks", k: de ? "Laufend" : "In progress", v: cs.partial },
      { b: de ? "Aufgaben" : "Tasks", k: de ? "Offen + Blockiert" : "Open + blocked", v: cs.notImpl },
      ...(cb ? [
        { b: de ? "Kontrollen" : "Controls", k: de ? "Anwendbare Kontrollen" : "Applicable controls", v: cb.applicable },
        { b: de ? "Kontrollen" : "Controls", k: de ? "Umgesetzt" : "Implemented", v: cb.implemented },
        { b: de ? "Kontrollen" : "Controls", k: de ? "Teilweise" : "Partial", v: cb.partial },
        { b: de ? "Kontrollen" : "Controls", k: de ? "Offen" : "Open", v: cb.open },
        { b: de ? "Kontrollen" : "Controls", k: de ? "Umsetzungsgrad (%)" : "Implementation level (%)", v: cb.gradePct },
        { b: de ? "Kontrollen" : "Controls", k: de ? "Fertig ohne Nachweis" : "Done without evidence", v: cb.noEvidence },
        { b: de ? "Kontrollen" : "Controls", k: de ? "Ueberfaellig" : "Overdue", v: cb.overdue },
      ] : []),
    ],
  }, {
    name: de ? "Massnahmen" : "Actions",
    statusKey: "status",
    columns: [
      { header: "ID", key: "id", width: 24 },
      { header: de ? "Massnahme" : "Action", key: "name", width: 56 },
      { header: de ? "Status" : "Status", key: "status", width: 16 },
      { header: de ? "Verantwortlich" : "Owner", key: "owner", width: 24 },
      { header: de ? "Faellig" : "Due", key: "due", width: 14 },
      { header: de ? "Ueberfaellig" : "Overdue", key: "od", width: 13 },
    ],
    rows: (data.actionItems ?? []).map(a => ({
      id: a.id,
      name: de ? a.name : (a.nameEn || a.name),
      status: a.actionStatus,
      owner: a.actionOwner,
      due: a.actionDueDate,
      od: a.isOverdue ? (de ? "Ja" : "Yes") : "",
    })),
  }];
  await exportBrandedXlsx({
    fileBase: de ? "Umsetzung" : "Implementation",
    title: de ? "Umsetzung & Monitoring" : "Implementation & monitoring",
    lang,
    scope: de
      ? `${cs.finalScope} Aufgaben` + (cb ? ` · ${cb.applicable} Kontrollen · ${cb.gradePct}% umgesetzt` : "")
      : `${cs.finalScope} tasks` + (cb ? ` · ${cb.applicable} controls · ${cb.gradePct}% implemented` : ""),
    sheets,
  });
}
