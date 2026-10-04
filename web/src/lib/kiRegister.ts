/**
 * kiRegister — Daten aus dem KI-Systemregister (Werkzeug KI-Governance) in
 * Dokumente übernehmen:
 *  - Register-Export als PDF und Excel,
 *  - vorbefüllte KI-Dokumente (D25–D29, D60–D63, D73, D21): Systemangaben als
 *    eigener Abschnitt vor den Regelungen, Geltungsbereich/Verantwortliche aus
 *    dem Registereintrag.
 * Nur Datenübernahme — die Regelungstexte selbst kommen unverändert aus dem Katalog.
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  type KiSystem, ANNEX_III, ART5, DOC_LABELS, ROLLE_META, KLASSE_LABEL, STATUS_LABEL, DOC_STATUS_LABEL,
  AI_ACT_DATES, docsForSystem,
} from "@/lib/kiGovernance";
import type { ExportAnhang } from "@/lib/policyClauseExporter";

const ja = (b: boolean, de: boolean) => (b ? (de ? "ja" : "yes") : (de ? "nein" : "no"));
const datum = (iso: string, de: boolean) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString(de ? "de-DE" : "en-GB", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });

/** Dokument-IDs, die aus dem Register vorbefüllt werden können. */
export const KI_DOC_IDS = ["D25", "D26", "D27", "D28", "D29", "D60", "D61", "D62", "D63", "D73", "D21"] as const;

export function systemName(s: KiSystem, de: boolean): string {
  return s.name?.trim() || (de ? "(ohne Namen)" : "(unnamed)");
}

/** Pflichtdokumente mit Status als lesbarer Text. */
function docListe(s: KiSystem, de: boolean): { alle: string; fehlend: string } {
  const docs = docsForSystem(s);
  const lab = (d: string) => `${d} ${DOC_LABELS[d] ? (de ? DOC_LABELS[d].de : DOC_LABELS[d].en) : ""}`.trim();
  const st = (d: string) => s.docStatus?.[d] ?? "fehlt";
  return {
    alle: docs.map(d => `${lab(d)} (${de ? DOC_STATUS_LABEL[st(d)].de : DOC_STATUS_LABEL[st(d)].en})`).join("; "),
    fehlend: docs.filter(d => st(d) === "fehlt").map(lab).join("; "),
  };
}

/** Anwendungsbeginn der Pflichten für diesen Eintrag (KI-VO i. d. F. VO 2026/1744). */
function anwendbarAb(s: KiSystem, de: boolean): string {
  if (s.risikoklasse === "unannehmbar") return de ? `verboten seit ${datum(AI_ACT_DATES.verboteUndKompetenz, de)}` : `prohibited since ${datum(AI_ACT_DATES.verboteUndKompetenz, de)}`;
  if (s.risikoklasse === "hoch") return de
    ? `Hochrisiko-Pflichten ab ${datum(AI_ACT_DATES.hochrisikoAnhangIII, de)} (Anhang III)`
    : `high-risk obligations from ${datum(AI_ACT_DATES.hochrisikoAnhangIII, de)} (Annex III)`;
  if (s.risikoklasse === "begrenzt") return de ? `Art. 50 seit ${datum(AI_ACT_DATES.transparenz, de)}` : `Art. 50 since ${datum(AI_ACT_DATES.transparenz, de)}`;
  return de ? `Art. 4 seit ${datum(AI_ACT_DATES.verboteUndKompetenz, de)}` : `Art. 4 since ${datum(AI_ACT_DATES.verboteUndKompetenz, de)}`;
}

/** Alle Registerangaben eines Systems als Beschriftung/Wert-Paare. */
export function systemFelder(s: KiSystem, de: boolean): [string, string][] {
  const annex = s.annexIII.map(id => ANNEX_III.find(a => a.id === id)).filter(Boolean).map(a => (de ? a!.de : a!.en));
  const art5 = s.art5.map(id => ART5.find(a => a.id === id)).filter(Boolean).map(a => (de ? a!.de : a!.en));
  const d = docListe(s, de);
  return [
    [de ? "KI-System" : "AI system", systemName(s, de)],
    [de ? "Zweck / Einsatzkontext" : "Purpose / context", s.zweck || "—"],
    [de ? "Rolle der Organisation" : "Role of the organisation", de ? ROLLE_META[s.rolle].de : ROLLE_META[s.rolle].en],
    [de ? "Risikoklasse (KI-VO)" : "Risk class (AI Act)", de ? KLASSE_LABEL[s.risikoklasse].de : KLASSE_LABEL[s.risikoklasse].en],
    [de ? "Anhang-III-Bereiche" : "Annex III areas", annex.join("; ") || "—"],
    [de ? "Verbotene Praktiken (Art. 5)" : "Prohibited practices (Art. 5)", art5.join("; ") || "—"],
    [de ? "Transparenzpflicht (Art. 50)" : "Transparency duty (Art. 50)", ja(s.transparenzpflicht, de)],
    [de ? "GPAI-Modell genutzt" : "GPAI model used", ja(s.gpai, de)],
    [de ? "Personenbezogene Daten" : "Personal data", ja(s.personenbezug, de)],
    [de ? "FRIA-pflichtig (Art. 27)" : "FRIA required (Art. 27)", s.rolle === "betreiber" && s.risikoklasse === "hoch" ? ja(!!s.friaPflicht, de) : (de ? "nicht einschlägig" : "not applicable")],
    [de ? "Verantwortlich" : "Owner", s.verantwortlicher || "—"],
    [de ? "Lebenszyklus" : "Life cycle", de ? STATUS_LABEL[s.status ?? "planung"].de : STATUS_LABEL[s.status ?? "planung"].en],
    [de ? "Anwendbar ab" : "Applicable from", anwendbarAb(s, de)],
    [de ? "Pflichtdokumente" : "Mandatory documents", d.alle],
    [de ? "Davon fehlend" : "Of which missing", d.fehlend || "—"],
  ];
}

/** Welche Registereinträge gehören in ein Dokument? D25 = alle, sonst die, für die es Pflicht ist. */
export function systemeFuerDokument(systeme: KiSystem[], docId: string): KiSystem[] {
  const id = docId.toUpperCase();
  if (id === "D25") return systeme;
  return systeme.filter(s => docsForSystem(s).includes(id));
}

/** Vorbefüllter Abschnitt für ein Dokument; undefined, wenn kein Registereintrag passt. */
export function registerAnhang(systeme: KiSystem[], docId: string, de: boolean): ExportAnhang | undefined {
  const liste = systemeFuerDokument(systeme, docId);
  if (liste.length === 0) return undefined;
  return {
    titel: de ? "Systemangaben aus dem KI-Register" : "System details from the AI register",
    hinweis: de
      ? `Automatisch übernommen aus dem KI-Systemregister (Werkzeug KI-Governance), Stand ${new Date().toLocaleDateString("de-DE")}. ${liste.length} System(e). Änderungen bitte im Register vornehmen und das Dokument neu erzeugen.`
      : `Taken automatically from the AI system register (AI Governance tool), as of ${new Date().toLocaleDateString("en-GB")}. ${liste.length} system(s). Please change the data in the register and regenerate the document.`,
    eintraege: liste.map((s, i) => ({ titel: `${i + 1}. ${systemName(s, de)}`, felder: systemFelder(s, de) })),
  };
}

/** Geltungsbereich / Verantwortliche für ein Dokument zu EINEM System vorbelegen. */
export function vorbelegung(s: KiSystem, de: boolean): { scope: string; policyOwner: string; systemsUsed: string } {
  const name = systemName(s, de);
  return {
    scope: s.zweck ? `${de ? "KI-System" : "AI system"} „${name}“ — ${s.zweck}` : `${de ? "KI-System" : "AI system"} „${name}“`,
    policyOwner: s.verantwortlicher || "",
    systemsUsed: name,
  };
}

// ── Register-Export ─────────────────────────────────────────────────────────
const LEER: KiSystem = { id: "", name: "", zweck: "", rolle: "betreiber", risikoklasse: "minimal", gpai: false, status: "planung", verantwortlicher: "", personenbezug: false, annexIII: [], art5: [], transparenzpflicht: false, docStatus: {} };
const dateiBasis = (company: string, de: boolean) =>
  `${(company || (de ? "Organisation" : "organisation")).replace(/[^a-zA-Z0-9äöüÄÖÜß\-_\s]/g, "").trim().replace(/\s+/g, "_")}_${de ? "KI-Systemregister" : "AI-System-Register"}_${new Date().toISOString().slice(0, 10)}`;

export async function exportRegisterXlsx(systeme: KiSystem[], de: boolean, company: string): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = company || "Organisation";
  wb.created = new Date();
  const ws = wb.addWorksheet(de ? "KI-Systemregister" : "AI system register");
  const kopf = systemFelder(systeme[0] ?? LEER, de).map(([l]) => l);
  ws.addRow(["Nr.", ...kopf]);
  const h = ws.getRow(1);
  h.font = { bold: true, color: { argb: "FFFFFFFF" } };
  h.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF143264" } };
  h.alignment = { vertical: "middle", wrapText: true };
  systeme.forEach((s, i) => ws.addRow([i + 1, ...systemFelder(s, de).map(([, v]) => v)]));
  ws.columns.forEach((c, i) => { c.width = i === 0 ? 6 : [2, 14, 15].includes(i) ? 50 : 24; c.alignment = { wrapText: true, vertical: "top" }; });
  ws.views = [{ state: "frozen", ySplit: 1, xSplit: 2 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: kopf.length + 1 } };
  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${dateiBasis(company, de)}.xlsx`);
}

export function exportRegisterPdf(systeme: KiSystem[], de: boolean, company: string): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const titel = de ? "KI-Systemregister" : "AI System Register";
  const fuss = () => {
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`${company || "Organisation"} — ${titel}`, 12, pageH - 7);
  };
  doc.setFillColor(20, 50, 100);
  doc.rect(0, 0, pageW, 24, "F");
  doc.setTextColor(255);
  doc.setFontSize(16);
  doc.text(titel, 12, 13);
  doc.setFontSize(9);
  doc.text(`${company || "Organisation"} · ${new Date().toLocaleDateString(de ? "de-DE" : "en-GB")} · ${systeme.length} ${de ? "System(e)" : "system(s)"}`, 12, 19);
  doc.setTextColor(90);
  doc.setFontSize(8);
  doc.text(doc.splitTextToSize(de
    ? "Rechtsstand: VO (EU) 2024/1689 i. d. F. VO (EU) 2026/1744. Hochrisiko-Pflichten nach Anhang III ab 02.12.2027, nach Anhang I ab 02.08.2028."
    : "Legal basis: Regulation (EU) 2024/1689 as amended by Regulation (EU) 2026/1744. High-risk obligations under Annex III from 02/12/2027, Annex I from 02/08/2028.", pageW - 24), 12, 30);

  const felder = systeme.map(s => systemFelder(s, de));
  const spalten = [0, 1, 2, 3, 4, 10, 11, 12, 14]; // kompakte Übersicht
  const kopf = ["Nr.", ...spalten.map(i => (felder[0] ?? systemFelder(LEER, de))[i][0])];
  autoTable(doc, {
    startY: 36,
    head: [kopf],
    body: felder.map((f, n) => [String(n + 1), ...spalten.map(i => f[i][1])]),
    styles: { fontSize: 7.5, cellPadding: 1.8, overflow: "linebreak", valign: "top" },
    headStyles: { fillColor: [20, 50, 100], textColor: 255 },
    columnStyles: { 0: { cellWidth: 8 } },
    margin: { left: 12, right: 12, bottom: 14 },
    didDrawPage: () => fuss(),
  });

  // Je System eine Detailtabelle mit allen Angaben
  felder.forEach((f, n) => {
    doc.addPage();
    fuss();
    doc.setFontSize(12);
    doc.setTextColor(20, 50, 100);
    doc.text(`${n + 1}. ${f[0][1]}`, 12, 16);
    autoTable(doc, {
      startY: 21,
      body: f,
      styles: { fontSize: 8.5, cellPadding: 2.2, overflow: "linebreak" },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 60, textColor: [20, 50, 100] } },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      theme: "plain",
      margin: { left: 12, right: 12, bottom: 14 },
      didDrawPage: () => fuss(),
    });
  });

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`${i}/${total}`, pageW - 12, pageH - 7, { align: "right" });
  }
  saveAs(doc.output("blob"), `${dateiBasis(company, de)}.pdf`);
}
