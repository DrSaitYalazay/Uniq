/**
 * scopeReport — Phase 1 (Scope & Organization) report.
 * White-labelled: company name/logo/accent from tenant profile.
 * Formats: PDF (print), Word (.doc via mso), Excel (.xlsx via exceljs).
 */

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import { RT } from "./reportTheme";
import { getCompanyBrand } from "./companyBrand";
import { getReportBrandName } from "./reportBrand";
import {
  buildCoverHtml, buildKpiGrid, wrapHtmlDoc, esc,
  renderHtmlToPdf, renderHtmlToWord,
  rtDocFooter,
} from "./reportHtmlLayout";
import type { Person } from "./personnel";

export interface ScopeProfile {
  company_name: string;
  sector: string;
  company_size: string;
  employee_count: number | null;
  annual_revenue: number | null;
  enabled_frameworks: string[];
  kritis_sub_sectors: string[];
}

export interface ScopeReportInput {
  profile: ScopeProfile;
  people: Person[];
  de: boolean;
  authorName?: string;
}

const FW_LABELS: Record<string, string> = {
  ISO27001: "ISO/IEC 27001", NIS2: "NIS2", BSI: "BSI IT-Grundschutz",
  BSI200_4: "BSI 200-4 (BCM)", BCM22301: "ISO 22301 (BCM)", KRITIS: "KRITIS",
  DORA: "DORA", TISAX: "TISAX / VDA ISA", GDPR: "DSGVO / GDPR",
  ISO27701: "ISO 27701", AIACT: "EU AI Act", ISO42001: "ISO/IEC 42001",
  NIST_AI_RMF: "NIST AI RMF", MaRisk: "MaRisk", CRA: "Cyber Resilience Act",
};
const KRITIS_LABELS: Record<string, { de: string; en: string }> = {
  energy: { de: "Energie", en: "Energy" },
  water: { de: "Wasser", en: "Water" },
  food: { de: "Ernährung", en: "Food" },
  health: { de: "Gesundheit", en: "Health" },
  finance: { de: "Finanzen & Versicherungen", en: "Finance & Insurance" },
  transport: { de: "Transport & Verkehr", en: "Transport" },
  ict: { de: "IT & Telekommunikation", en: "IT & Telecom" },
  media: { de: "Medien & Kultur", en: "Media & Culture" },
  gov: { de: "Staat & Verwaltung", en: "Government" },
  waste: { de: "Siedlungsabfall", en: "Municipal waste" },
};

function fwLabel(code: string) { return FW_LABELS[code] ?? code; }
function fmtDate(d: Date, de: boolean) {
  return de ? d.toLocaleDateString("de-DE") : d.toLocaleDateString("en-US");
}
function fmtNum(n: number | null | undefined, de: boolean) {
  if (n == null) return "—";
  return de ? n.toLocaleString("de-DE") : n.toLocaleString("en-US");
}

function buildScopeHtmlBody(inp: ScopeReportInput): string {
  const { profile, people, de, authorName } = inp;
  const brand = getCompanyBrand();
  const companyName = profile.company_name?.trim() || brand.companyName || getReportBrandName(de ? "de" : "en");
  const dateStr = fmtDate(new Date(), de);

  const cover = buildCoverHtml({
    badge: de ? "PHASE 1" : "PHASE 1",
    title: de ? "Geltungsbereich & Organisation" : "Scope & Organization",
    subtitle: de
      ? "Unternehmensprofil, gewählte Rahmenwerke und IT-Sicherheitsorganisation"
      : "Company profile, selected frameworks and IT security organization",
    companyName,
    authorName: authorName ?? "",
    dateStr,
  });

  const kpis = buildKpiGrid([
    { label: de ? "Frameworks" : "Frameworks", value: profile.enabled_frameworks.length, variant: "accent" },
    { label: de ? "KRITIS-Sektoren" : "KRITIS sectors", value: profile.kritis_sub_sectors.length },
    { label: de ? "Personen" : "People", value: people.length },
    { label: de ? "Mitarbeitende" : "Employees", value: fmtNum(profile.employee_count, de) },
  ]);

  const profileTable = `
    <table>
      <thead><tr>
        <th style="width:32%">${esc(de ? "Feld" : "Field")}</th>
        <th>${esc(de ? "Wert" : "Value")}</th>
      </tr></thead>
      <tbody>
        <tr><td>${esc(de ? "Firmenname" : "Company name")}</td><td>${esc(companyName)}</td></tr>
        <tr><td>${esc(de ? "Sektor" : "Sector")}</td><td>${esc(profile.sector || "—")}</td></tr>
        <tr><td>${esc(de ? "Unternehmensgröße" : "Company size")}</td><td>${esc(profile.company_size || "—")}</td></tr>
        <tr><td>${esc(de ? "Mitarbeitende" : "Employees")}</td><td>${esc(fmtNum(profile.employee_count, de))}</td></tr>
        <tr><td>${esc(de ? "Jahresumsatz (EUR)" : "Annual revenue (EUR)")}</td><td>${esc(fmtNum(profile.annual_revenue, de))}</td></tr>
      </tbody>
    </table>`;

  const fwRows = profile.enabled_frameworks.length === 0
    ? `<tr><td colspan="2" style="text-align:center;color:${RT.muted}">${esc(de ? "Keine Rahmenwerke ausgewählt." : "No frameworks selected.")}</td></tr>`
    : profile.enabled_frameworks.map(c => `<tr><td style="width:22%;font-weight:600;color:${RT.navy}">${esc(c)}</td><td>${esc(fwLabel(c))}</td></tr>`).join("");
  const fwTable = `<table><thead><tr>
      <th>${esc(de ? "Code" : "Code")}</th><th>${esc(de ? "Rahmenwerk" : "Framework")}</th>
    </tr></thead><tbody>${fwRows}</tbody></table>`;

  const kritisBlock = profile.kritis_sub_sectors.length === 0
    ? ""
    : `<h2>${esc(de ? "KRITIS-Sektoren" : "KRITIS Sectors")}</h2>
       <div class="rt-meta-row">
         ${profile.kritis_sub_sectors.map(k => {
           const lbl = KRITIS_LABELS[k]?.[de ? "de" : "en"] ?? k;
           return `<span class="rt-badge low">${esc(lbl)}</span>`;
         }).join("")}
      ${rtDocFooter(brandName, de ? "de" : "en")}
       </div>`;

  const peopleRows = people.length === 0
    ? `<tr><td colspan="4" style="text-align:center;color:${RT.muted}">${esc(de ? "Keine Personen erfasst." : "No people recorded.")}</td></tr>`
    : people.map(p => `<tr>
        <td style="font-weight:600;color:${RT.ink}">${esc(p.name)}</td>
        <td>${esc(p.title || "—")}</td>
        <td>${esc(p.department || "—")}</td>
        <td style="font-family:'Courier New',monospace;font-size:10px">${esc(p.email || "—")}</td>
      </tr>`).join("");
  const peopleTable = `<table><thead><tr>
      <th style="width:26%">${esc(de ? "Name" : "Name")}</th>
      <th style="width:24%">${esc(de ? "Rolle" : "Role")}</th>
      <th style="width:22%">${esc(de ? "Abteilung" : "Department")}</th>
      <th>${esc(de ? "E-Mail" : "Email")}</th>
    </tr></thead><tbody>${peopleRows}</tbody></table>`;

  return `${cover}
    <div class="rt-section">${kpis}</div>
    <div class="rt-section">
      <h2>${esc(de ? "Unternehmensprofil" : "Company Profile")}</h2>
      ${profileTable}
    </div>
    <div class="rt-section">
      <h2>${esc(de ? "Gewählte Rahmenwerke" : "Selected Frameworks")}</h2>
      ${fwTable}
      ${kritisBlock}
    </div>
    <div class="rt-section">
      <h2>${esc(de ? "IT-Sicherheitsorganisation" : "IT Security Organization")}</h2>
      <p>${esc(de
        ? "Verantwortliche Personen, die im Geltungsbereich des Compliance-Programms benannt sind."
        : "Responsible persons named within the scope of the compliance programme.")}</p>
      ${peopleTable}
    </div>`;
}

function fileBase(profile: ScopeProfile, de: boolean) {
  const name = (profile.company_name || getReportBrandName(de ? "de" : "en"))
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scope";
  const ymd = new Date().toISOString().slice(0, 10);
  return `${name}-scope-${ymd}`;
}

export async function exportScopeReportPdf(inp: ScopeReportInput): Promise<void> {
  const body = buildScopeHtmlBody(inp);
  const doc = wrapHtmlDoc({
    title: inp.de ? "Geltungsbereich & Organisation" : "Scope & Organization",
    lang: inp.de ? "de" : "en",
    body,
  });
  await renderHtmlToPdf(doc, fileBase(inp.profile, inp.de) + ".pdf");
}

export async function exportScopeReportDocx(inp: ScopeReportInput): Promise<void> {
  const body = buildScopeHtmlBody(inp);
  const doc = wrapHtmlDoc({
    title: inp.de ? "Geltungsbereich & Organisation" : "Scope & Organization",
    lang: inp.de ? "de" : "en",
    body,
  });
  await renderHtmlToWord(doc, fileBase(inp.profile, inp.de));
}

// ── Excel ────────────────────────────────────────────────────────────────
const NAVY = "FF1A2E41";
const HEADER_FONT: Partial<ExcelJS.Font> = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
const BORDER: Partial<ExcelJS.Border> = { style: "thin", color: { argb: "FFDBE3EF" } };
const ALL_BORDERS: Partial<ExcelJS.Borders> = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function styleHeader(row: ExcelJS.Row) {
  row.eachCell(c => {
    c.font = HEADER_FONT;
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    c.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    c.border = ALL_BORDERS;
  });
  row.height = 22;
}

export async function exportScopeReportXlsx(inp: ScopeReportInput): Promise<void> {
  const { profile, people, de } = inp;
  const brand = getCompanyBrand();
  const brandName = profile.company_name?.trim() || brand.companyName || getReportBrandName(de ? "de" : "en");
  const wb = new ExcelJS.Workbook();
  wb.creator = brandName;
  wb.created = new Date();

  // Profile sheet
  const p = wb.addWorksheet(de ? "Profil" : "Profile");
  p.columns = [
    { header: de ? "Feld" : "Field", key: "k", width: 34 },
    { header: de ? "Wert" : "Value", key: "v", width: 60 },
  ];
  styleHeader(p.getRow(1));
  const rows: [string, string | number][] = [
    [de ? "Firmenname" : "Company name", brandName],
    [de ? "Sektor" : "Sector", profile.sector || "—"],
    [de ? "Unternehmensgröße" : "Company size", profile.company_size || "—"],
    [de ? "Mitarbeitende" : "Employees", profile.employee_count ?? "—"],
    [de ? "Jahresumsatz (EUR)" : "Annual revenue (EUR)", profile.annual_revenue ?? "—"],
    [de ? "Frameworks" : "Frameworks", profile.enabled_frameworks.length],
    [de ? "KRITIS-Sektoren" : "KRITIS sectors", profile.kritis_sub_sectors.length],
    [de ? "Personen" : "People", people.length],
    [de ? "Erstellt am" : "Created", fmtDate(new Date(), de)],
  ];
  rows.forEach(r => p.addRow({ k: r[0], v: r[1] }));
  p.eachRow((r, idx) => { if (idx > 1) r.eachCell(c => { c.border = ALL_BORDERS; c.font = { name: "Arial", size: 11 }; }); });

  // Frameworks sheet
  const f = wb.addWorksheet(de ? "Rahmenwerke" : "Frameworks");
  f.columns = [
    { header: "Code", key: "c", width: 16 },
    { header: de ? "Rahmenwerk" : "Framework", key: "n", width: 44 },
  ];
  styleHeader(f.getRow(1));
  profile.enabled_frameworks.forEach(code => f.addRow({ c: code, n: fwLabel(code) }));
  f.eachRow((r, idx) => { if (idx > 1) r.eachCell(c => { c.border = ALL_BORDERS; c.font = { name: "Arial", size: 11 }; }); });

  // KRITIS sheet (only if any)
  if (profile.kritis_sub_sectors.length > 0) {
    const k = wb.addWorksheet(de ? "KRITIS" : "KRITIS");
    k.columns = [
      { header: "Code", key: "c", width: 16 },
      { header: de ? "Sektor" : "Sector", key: "n", width: 44 },
    ];
    styleHeader(k.getRow(1));
    profile.kritis_sub_sectors.forEach(code => k.addRow({ c: code, n: KRITIS_LABELS[code]?.[de ? "de" : "en"] ?? code }));
    k.eachRow((r, idx) => { if (idx > 1) r.eachCell(c => { c.border = ALL_BORDERS; c.font = { name: "Arial", size: 11 }; }); });
  }

  // People sheet
  const pe = wb.addWorksheet(de ? "Personen" : "People");
  pe.columns = [
    { header: de ? "Name" : "Name", key: "n", width: 28 },
    { header: de ? "Rolle" : "Role", key: "t", width: 28 },
    { header: de ? "Abteilung" : "Department", key: "d", width: 22 },
    { header: "E-Mail", key: "e", width: 32 },
  ];
  styleHeader(pe.getRow(1));
  people.forEach(pers => pe.addRow({ n: pers.name, t: pers.title || "", d: pers.department || "", e: pers.email || "" }));
  pe.eachRow((r, idx) => { if (idx > 1) r.eachCell(c => { c.border = ALL_BORDERS; c.font = { name: "Arial", size: 11 }; }); });

  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileBase(profile, de) + ".xlsx");
}
