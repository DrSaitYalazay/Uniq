/**
 * policyReportXlsx — Excel export for Step 14 (Richtlinien / Policies).
 *
 * Produces a two-sheet workbook:
 *   1. Übersicht — status summary counts.
 *   2. Richtlinien — one row per included policy with full metadata.
 *
 * Colors follow the CWS report theme (RT): navy header, accent divider.
 */
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { RT } from "./reportTheme";
import POLICY_TEMPLATES from "@/data/policyTemplates";
import type { Lang } from "@/contexts/LanguageContext";

const argb = (h: string) => "FF" + h.replace("#", "");

const STATUS_LABEL: Record<string, Record<Lang, string>> = {
  draft:                 { de: "Entwurf",           en: "Draft" },
  not_implemented:       { de: "Nicht umgesetzt",   en: "Not implemented" },
  partially_implemented: { de: "Teilweise umgesetzt", en: "Partially implemented" },
  implemented:           { de: "Umgesetzt",         en: "Implemented" },
  entbehrlich:           { de: "Entbehrlich",       en: "Not applicable" },
};

function styleHeader(ws: ExcelJS.Worksheet, rowIdx: number) {
  const row = ws.getRow(rowIdx);
  row.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(RT.navy) } };
  row.alignment = { vertical: "middle", horizontal: "left" };
  row.height = 20;
}

export async function exportPolicyOverviewXlsx(
  policyMap: Record<string, any>,
  excluded: string[],
  lang: Lang,
  companyName: string,
): Promise<void> {
  const de = lang === "de";
  const excl = new Set(excluded || []);
  const templates = POLICY_TEMPLATES.filter(t => !excl.has(t.id));

  const wb = new ExcelJS.Workbook();
  wb.creator = companyName || (de ? "Ihr Unternehmen" : "Your organization");
  wb.created = new Date();

  // ── Sheet 1: Übersicht ──
  const s1 = wb.addWorksheet(de ? "Übersicht" : "Overview");
  s1.mergeCells("A1:B1");
  const title = s1.getCell("A1");
  title.value = de ? "Richtlinien-Übersicht" : "Policy Overview";
  title.font = { bold: true, size: 15, color: { argb: argb(RT.navy) } };
  s1.getCell("A2").value = companyName || (de ? "Ihr Unternehmen" : "Your organization");
  s1.getCell("A3").value = (de ? "Erstellt: " : "Generated: ") + new Date().toLocaleDateString(de ? "de-DE" : "en-GB");

  const count = (pred: (s: string) => boolean) =>
    templates.filter(t => pred(policyMap[t.id]?.implementationStatus ?? "not_implemented")).length;

  const rows: Array<[string, number]> = [
    [de ? "Gesamt" : "Total", templates.length],
    [de ? "Umgesetzt" : "Implemented", count(s => s === "implemented")],
    [de ? "Teilweise umgesetzt" : "Partially implemented", count(s => s === "partially_implemented")],
    [de ? "Nicht umgesetzt" : "Not implemented", count(s => s === "not_implemented" || s === "draft")],
    [de ? "Entbehrlich" : "Not applicable", count(s => s === "entbehrlich")],
  ];
  s1.addRow([]);
  const headerRow1 = s1.addRow([de ? "Kennzahl" : "Metric", de ? "Anzahl" : "Count"]);
  styleHeader(s1, headerRow1.number);
  rows.forEach(r => s1.addRow(r));
  s1.getColumn(1).width = 32;
  s1.getColumn(2).width = 12;

  // ── Sheet 2: Richtlinien ──
  const s2 = wb.addWorksheet(de ? "Richtlinien" : "Policies");
  const cols = de
    ? ["ID", "Richtlinie", "Kategorie", "Status", "Verantwortlich", "Rollen", "Freigabe",
       "Version", "Review-Frequenz", "Letzte Prüfung", "Nächste Prüfung", "Geltungsbereich", "Zweck", "Regelungen"]
    : ["ID", "Policy", "Category", "Status", "Owner", "Roles", "Approval",
       "Version", "Review frequency", "Last review", "Next review", "Scope", "Purpose", "Clauses"];
  const hdr = s2.addRow(cols);
  styleHeader(s2, hdr.number);

  for (const t of templates) {
    const p = policyMap[t.id] ?? {};
    const st = p.implementationStatus ?? "not_implemented";
    const clauseCount = Array.isArray(p.selectedClauses) ? p.selectedClauses.length
      : Array.isArray(p.rules) ? p.rules.length : 0;
    s2.addRow([
      t.id,
      de ? t.name : t.nameEn,
      de ? t.category : t.categoryEn,
      (STATUS_LABEL[st] ?? STATUS_LABEL.not_implemented)[lang],
      p.policyOwner ?? "",
      p.responsibleRoles ?? "",
      p.approvalAuthority ?? "",
      p.version ?? "",
      p.reviewFrequency ?? "",
      p.lastReviewDate ?? "",
      p.nextReviewDate ?? "",
      p.scope ?? "",
      (de ? p.purpose : p.purposeEn) ?? p.purpose ?? "",
      clauseCount,
    ]);
  }

  const widths = [10, 34, 24, 20, 20, 22, 20, 9, 18, 14, 14, 40, 48, 11];
  widths.forEach((w, i) => { s2.getColumn(i + 1).width = w; });
  s2.autoFilter = { from: { row: hdr.number, column: 1 }, to: { row: hdr.number, column: cols.length } };
  s2.views = [{ state: "frozen", ySplit: hdr.number }];

  const buf = await wb.xlsx.writeBuffer();
  const safeName = (companyName || "Report").replace(/[^a-z0-9]+/gi, "_");
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${safeName}_Richtlinien_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
