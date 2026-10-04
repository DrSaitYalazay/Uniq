/**
 * reportXlsxKit — EIN Excel-Exporter für ALLE Berichte.
 *
 * Warum: Dr. Sait 2026-09-12 — „raporların hepsi PDF, Word ve Excel olarak
 * verilebilmeli; bazı yerlerde mümkün değil." Vorher hatten nur Gap, Risiko,
 * SoA-Übersicht, Scope und Inventar einen Excel-Export; SoA, Roadmap,
 * Umsetzung, Schulung, Personen und Vorfälle hatten keinen. Statt sechs neue
 * Generatoren zu schreiben, liefert dieses Kit das Gerüst (Deckblatt, Marke,
 * Kopfzeilen-Stil, Filter, Fixierung, Spaltenbreiten) und jeder Bericht
 * übergibt nur noch seine Daten.
 *
 * Farben kommen aus `reportTheme` (RT) — also aus derselben Quelle wie
 * Bildschirm und PDF. Keine eigenen Hex-Werte.
 */
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getCompanyBrand } from "./companyBrand";
import { getReportBrandName } from "./reportBrand";
import { RT } from "./reportTheme";

export type XlsxCellValue = string | number | boolean | Date | null | undefined;

export interface XlsxColumn {
  header: string;
  key: string;
  width?: number;
  /** "text" bricht lange Werte um; "num" rechts; "date" als Datum. */
  kind?: "text" | "num" | "date";
}

export interface XlsxSheetSpec {
  /** Tabellenblattname (max. 31 Zeichen, Excel-Grenze — wird gekürzt). */
  name: string;
  columns: XlsxColumn[];
  rows: Array<Record<string, XlsxCellValue>>;
  /** Optionale Erläuterung über der Tabelle (eine Zeile). */
  note?: string;
  /** Optional: Zeilenfarbe je Zeile, Schlüssel = Statuswert. */
  statusKey?: string;
}

export interface XlsxDocSpec {
  /** Dateiname ohne Endung. */
  fileBase: string;
  /** Titel auf dem Deckblatt. */
  title: string;
  lang: "de" | "en";
  /** Kurze Beschreibung: Umfang, Phase, Framework. */
  scope?: string;
  sheets: XlsxSheetSpec[];
}

/** "#RRGGBB" → "FFRRGGBB" (ExcelJS erwartet ARGB). */
function argb(hex: string): string {
  const h = String(hex || "").replace("#", "").trim();
  return "FF" + (h.length === 6 ? h.toUpperCase() : "1A2E41");
}

const FONT = "Arial";

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((c) => {
    c.font = { name: FONT, size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(RT.navy) } };
    c.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    c.border = {
      top: { style: "thin", color: { argb: argb(RT.border) } },
      bottom: { style: "thin", color: { argb: argb(RT.border) } },
      left: { style: "thin", color: { argb: argb(RT.border) } },
      right: { style: "thin", color: { argb: argb(RT.border) } },
    };
  });
  row.height = 26;
}

/** Statuswert → Zeilenfüllung aus der Palette (ampel oder Themenfarbe). */
function fillForStatus(v: XlsxCellValue): string | null {
  const s = String(v ?? "").toLowerCase();
  if (/^(ja|erfüllt|erfuellt|met|fertig|done|umgesetzt|implemented|abgeschlossen)/.test(s)) return argb(RT.stJaBg);
  if (/^(teilweise|partial|laufend|in progress|in bearbeitung)/.test(s)) return argb(RT.stTeilweiseBg);
  if (/^(nein|offen|open|not met|nicht erfüllt|nicht erfuellt|blockiert|blocked|überfällig|ueberfaellig|overdue)/.test(s)) return argb(RT.stNeinBg);
  if (/^(n\/a|na|entbehrlich|nicht anwendbar|not applicable|ausgeschlossen|excluded)/.test(s)) return argb(RT.stNaBg);
  return null;
}

/**
 * Schreibt die Arbeitsmappe und löst den Download aus.
 * Jedes Blatt bekommt: Kopfzeile im Markenton, Autofilter, fixierte Kopfzeile,
 * Spaltenbreiten, Zeilenumbruch für Textspalten und Statusfarben.
 */
export async function exportBrandedXlsx(doc: XlsxDocSpec): Promise<void> {
  const de = doc.lang === "de";
  const brand = getCompanyBrand();
  const company = brand.companyName?.trim() || getReportBrandName(doc.lang);
  const dateStr = new Date().toLocaleDateString(de ? "de-DE" : "en-GB",
    { day: "2-digit", month: "2-digit", year: "numeric" });

  const wb = new ExcelJS.Workbook();
  wb.creator = company;
  wb.lastModifiedBy = company;
  wb.created = new Date();

  // ── Deckblatt ────────────────────────────────────────────────────────────
  const cover = wb.addWorksheet(de ? "Deckblatt" : "Cover");
  cover.columns = [{ width: 26 }, { width: 74 }];
  const put = (label: string, value: string, bold = false) => {
    const r = cover.addRow([label, value]);
    r.getCell(1).font = { name: FONT, size: 11, bold: true, color: { argb: argb(RT.navy) } };
    r.getCell(2).font = { name: FONT, size: bold ? 14 : 11, bold };
    r.getCell(2).alignment = { wrapText: true, vertical: "top" };
    return r;
  };
  put(de ? "Bericht" : "Report", doc.title, true);
  put(de ? "Unternehmen" : "Company", company);
  put(de ? "Erstellt am" : "Generated", dateStr);
  if (doc.scope) put(de ? "Umfang" : "Scope", doc.scope);
  put(de ? "Blätter" : "Sheets", doc.sheets.map(s => s.name).join(" · "));
  cover.addRow([]);
  const hint = cover.addRow([
    de ? "Hinweis" : "Note",
    de
      ? "Statusfarben entsprechen der Anwendung (Ampel bzw. Themenfarbe). Zahlen sind der Stand zum Erstellungszeitpunkt."
      : "Status colours match the application (RAG or theme colour). Figures reflect the state at generation time.",
  ]);
  hint.getCell(1).font = { name: FONT, size: 10, bold: true, color: { argb: argb(RT.muted) } };
  hint.getCell(2).font = { name: FONT, size: 10, color: { argb: argb(RT.muted) } };
  hint.getCell(2).alignment = { wrapText: true, vertical: "top" };

  // ── Datenblätter ─────────────────────────────────────────────────────────
  for (const spec of doc.sheets) {
    const ws = wb.addWorksheet(spec.name.slice(0, 31));
    let headerRowIdx = 1;

    if (spec.note) {
      const n = ws.addRow([spec.note]);
      n.getCell(1).font = { name: FONT, size: 10, italic: true, color: { argb: argb(RT.muted) } };
      n.getCell(1).alignment = { wrapText: true, vertical: "top" };
      ws.mergeCells(1, 1, 1, Math.max(1, spec.columns.length));
      n.height = 28;
      ws.addRow([]);
      headerRowIdx = 3;
    }

    ws.columns = spec.columns.map(c => ({
      header: c.header,
      key: c.key,
      width: c.width ?? (c.kind === "num" ? 12 : 28),
    })) as ExcelJS.Column[];

    // Bei Notiz-Vorlauf steht die Kopfzeile nicht in Zeile 1 → neu schreiben.
    if (headerRowIdx !== 1) {
      const hr = ws.getRow(headerRowIdx);
      spec.columns.forEach((c, i) => { hr.getCell(i + 1).value = c.header; });
      hr.commit();
    }
    styleHeaderRow(ws.getRow(headerRowIdx));

    for (const row of spec.rows) {
      const r = ws.addRow(spec.columns.map(c => row[c.key] ?? ""));
      const statusVal = spec.statusKey ? row[spec.statusKey] : undefined;
      const fill = spec.statusKey ? fillForStatus(statusVal) : null;
      r.eachCell((cell, col) => {
        const kind = spec.columns[col - 1]?.kind ?? "text";
        cell.font = { name: FONT, size: 11 };
        cell.alignment = {
          vertical: "top",
          horizontal: kind === "num" ? "right" : "left",
          wrapText: kind === "text",
        };
        cell.border = {
          top: { style: "hair", color: { argb: argb(RT.border) } },
          bottom: { style: "hair", color: { argb: argb(RT.border) } },
          left: { style: "hair", color: { argb: argb(RT.border) } },
          right: { style: "hair", color: { argb: argb(RT.border) } },
        };
        if (fill) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      });
    }

    // Kopfzeile fixieren + Filter: bei langen Listen unverzichtbar.
    ws.views = [{ state: "frozen", ySplit: headerRowIdx }];
    if (spec.rows.length > 0) {
      ws.autoFilter = {
        from: { row: headerRowIdx, column: 1 },
        to: { row: headerRowIdx + spec.rows.length, column: spec.columns.length },
      };
    } else {
      const empty = ws.addRow([de ? "Keine Daten vorhanden." : "No data available."]);
      empty.getCell(1).font = { name: FONT, size: 11, italic: true, color: { argb: argb(RT.muted) } };
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  saveAs(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${doc.fileBase}.xlsx`,
  );
}
