/**
 * Personnel / IT-Security Organization Chart — PDF + Word export.
 * Groups people by department and renders a card-based org chart plus a full roster table.
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, HeadingLevel, AlignmentType, ShadingType, Header, Footer,
  PageNumber, BorderStyle,
} from "docx";
import { saveAs } from "file-saver";
import { exportBrandedXlsx } from "@/lib/reportXlsxKit";
import { RT } from "./reportTheme";
import { esc, reportGlobalCss, buildCoverHtml, buildKpiGrid, renderHtmlToPdf } from "./reportHtmlLayout";
import { getReportBrandName, getReportBrandSlug } from "@/lib/reportBrand";
import type { Person } from "./personnel";

export interface PersonnelReportOptions {
  companyName: string;
  authorName?: string;
  lang: "de" | "en";
}

const UNASSIGNED_DE = "Ohne Abteilung";
const UNASSIGNED_EN = "Unassigned";

function groupByDepartment(people: Person[], lang: "de" | "en") {
  const label = lang === "de" ? UNASSIGNED_DE : UNASSIGNED_EN;
  const map = new Map<string, Person[]>();
  for (const p of people) {
    const dept = (p.department?.trim() || label);
    if (!map.has(dept)) map.set(dept, []);
    map.get(dept)!.push(p);
  }
  // Sort each dept alphabetically by name; sort departments alpha, unassigned last
  const sorted = Array.from(map.entries())
    .sort(([a], [b]) => {
      if (a === label) return 1;
      if (b === label) return -1;
      return a.localeCompare(b);
    })
    .map(([dept, list]) => [dept, list.slice().sort((x, y) => x.name.localeCompare(y.name))] as const);
  return sorted;
}

/* ───────────────────────── PDF ───────────────────────── */

export async function generatePersonnelReportPDF(people: Person[], opts: PersonnelReportOptions) {
  const { lang, companyName, authorName } = opts;
  const de = lang === "de";
  const dateStr = new Date().toLocaleDateString(de ? "de-DE" : "en-US");
  const groups = groupByDepartment(people, lang);

  const title = de ? "IT-Sicherheits-Organigramm" : "IT Security Organization Chart";
  const subtitle = de ? "Verantwortliche Personen & Rollen" : "Responsible Persons & Roles";

  const cover = buildCoverHtml({
    badge: de ? "Scope · Personen" : "Scope · People",
    title, subtitle,
    companyName,
    authorName: authorName ?? "",
    dateStr,
  });

  const totals = {
    people: people.length,
    departments: groups.filter(([d]) => d !== UNASSIGNED_DE && d !== UNASSIGNED_EN).length,
    withEmail: people.filter(p => (p.email ?? "").trim()).length,
    unassigned: people.filter(p => !p.department?.trim()).length,
  };

  const summaryHtml = `<h2>1. ${de ? "Zusammenfassung" : "Executive Summary"}</h2>
    ${buildKpiGrid([
      { label: de ? "Personen gesamt" : "Total Persons", value: totals.people, variant: "accent" },
      { label: de ? "Abteilungen" : "Departments", value: totals.departments },
      { label: de ? "Mit E-Mail" : "With E-mail", value: totals.withEmail },
      { label: de ? "Ohne Abteilung" : "Unassigned", value: totals.unassigned, variant: totals.unassigned > 0 ? "crit" : undefined },
    ])}
    <p>${de
      ? "Diese Übersicht dokumentiert die Rollen- und Verantwortungsstruktur der IT- und Informationssicherheit. Sie dient als Nachweis gegenüber Auditoren und regulatorischen Stellen (z. B. NIS2, DORA, ISO 27001) und als interne Referenz für Zuständigkeiten."
      : "This overview documents the roles and responsibilities structure of IT and information security. It serves as evidence for auditors and regulatory bodies (e.g. NIS2, DORA, ISO 27001) and as an internal reference for accountability."}</p>`;

  // Org chart: department cards containing person cards
  const chartHtml = `<div class="rt-pagebreak"></div>
    <h2>2. ${de ? "Organigramm nach Abteilung" : "Chart by Department"}</h2>
    <div style="display:flex;flex-direction:column;gap:14px;">
      ${groups.map(([dept, list]) => `
        <section style="break-inside:avoid;page-break-inside:avoid;border:1px solid ${RT.border};border-radius:10px;overflow:hidden;background:${RT.white};">
          <header style="background:${RT.navy};color:${RT.white};padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">
            <strong style="font-size:12.5px;letter-spacing:0.3px;">${esc(dept)}</strong>
            <span style="font-size:10px;opacity:0.85;">${list.length} ${list.length === 1 ? (de ? "Person" : "Person") : (de ? "Personen" : "People")}</span>
          </header>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:12px;">
            ${list.map(p => `
              <div style="border:1px solid ${RT.border};border-left:3px solid ${RT.copper};border-radius:6px;padding:9px 11px;background:${RT.surface};">
                <div style="font-weight:700;color:${RT.ink};font-size:11.5px;line-height:1.35;">${esc(p.name)}</div>
                <div style="color:${RT.navy};font-size:10px;font-weight:600;margin-top:2px;">${esc(p.title)}</div>
                ${p.email ? `<div style="color:${RT.muted};font-size:9.5px;margin-top:4px;">${esc(p.email)}</div>` : ""}
              </div>
            `).join("")}
          </div>
        </section>
      `).join("")}
    </div>`;

  // Roster table
  const rosterRows = people.slice().sort((a, b) => a.name.localeCompare(b.name)).map(p => `
    <tr>
      <td style="font-weight:600;color:${RT.ink};">${esc(p.name)}</td>
      <td style="color:${RT.body};">${esc(p.title)}</td>
      <td style="color:${RT.body};">${esc(p.department || "—")}</td>
      <td style="color:${RT.body};font-size:10px;">${esc(p.email || "—")}</td>
    </tr>`).join("");

  const rosterHtml = `<div class="rt-pagebreak"></div>
    <h2>3. ${de ? "Vollständige Liste" : "Full Roster"}</h2>
    <table>
      <thead><tr>
        <th style="width:26%;">${de ? "Name" : "Name"}</th>
        <th style="width:26%;">${de ? "Titel / Rolle" : "Title / Role"}</th>
        <th style="width:20%;">${de ? "Abteilung" : "Department"}</th>
        <th style="width:28%;">${de ? "E-Mail" : "E-mail"}</th>
      </tr></thead>
      <tbody>${rosterRows || `<tr><td colspan="4" style="text-align:center;color:${RT.muted};">—</td></tr>`}</tbody>
    </table>`;

  const body = [cover, "<main>", summaryHtml, chartHtml, rosterHtml, "</main>"].join("");
  const htmlDoc = `<!doctype html><html lang="${lang}"><head>
    <meta charset="utf-8"><title>${esc(title)} — ${esc(companyName)}</title>
    ${reportGlobalCss}
  </head><body>${body}</body></html>`;

  const filename = `${getReportBrandSlug("en")}_${de ? "IT-Sicherheit_Organigramm" : "IT_Security_Org_Chart"}.pdf`;
  await renderHtmlToPdf(htmlDoc, filename);
}

/* ───────────────────────── Word ───────────────────────── */

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "DBE3EF" };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
const margins = { top: 60, bottom: 60, left: 100, right: 100 };

function hCell(text: string, width: number): TableCell {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: "1A2E41", type: ShadingType.CLEAR }, margins,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })],
  });
}
function dCell(text: string, width: number, opts?: { bold?: boolean; fill?: string; size?: number; color?: string }): TableCell {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA }, margins,
    ...(opts?.fill ? { shading: { fill: opts.fill, type: ShadingType.CLEAR } } : {}),
    children: [new Paragraph({ children: [new TextRun({
      text, bold: opts?.bold, size: opts?.size ?? 18, font: "Arial", color: opts?.color,
    })] })],
  });
}
function sectionHeading(num: number, text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1, spacing: { before: 300 },
    children: [new TextRun({ text: `${num}. ${text}`, bold: true, font: "Arial", color: "1A2E41" })],
  });
}

export async function generatePersonnelReportWord(people: Person[], opts: PersonnelReportOptions) {
  const { lang, companyName, authorName } = opts;
  const de = lang === "de";
  const dateStr = new Date().toLocaleDateString(de ? "de-DE" : "en-US");
  const groups = groupByDepartment(people, lang);

  const totals = {
    people: people.length,
    departments: groups.filter(([d]) => d !== UNASSIGNED_DE && d !== UNASSIGNED_EN).length,
    withEmail: people.filter(p => (p.email ?? "").trim()).length,
    unassigned: people.filter(p => !p.department?.trim()).length,
  };

  const children: (Paragraph | Table)[] = [];

  // Cover
  children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [
    new TextRun({
      text: `${getReportBrandName(de)} — ${de ? "IT-Sicherheits-Organigramm" : "IT Security Organization Chart"}`,
      bold: true, size: 36, font: "Arial", color: "1A2E41",
    }),
  ] }));
  children.push(new Paragraph({ children: [new TextRun({
    text: de ? "Verantwortliche Personen & Rollen" : "Responsible Persons & Roles",
    size: 24, color: "1E9E6A", font: "Arial",
  })] }));
  children.push(new Paragraph({ spacing: { after: 100 }, children: [
    ...(companyName ? [new TextRun({ text: `${de ? "Organisation" : "Organization"}: ${companyName}  `, size: 20, font: "Arial" })] : []),
    ...(authorName ? [new TextRun({ text: `${de ? "Erstellt von" : "Prepared by"}: ${authorName}  `, size: 20, font: "Arial" })] : []),
    new TextRun({ text: `${de ? "Datum" : "Date"}: ${dateStr}`, size: 20, font: "Arial" }),
  ] }));

  // Section 1: Summary
  children.push(sectionHeading(1, de ? "Zusammenfassung" : "Executive Summary"));
  const summary: [string, string][] = [
    [de ? "Personen gesamt" : "Total Persons", String(totals.people)],
    [de ? "Abteilungen" : "Departments", String(totals.departments)],
    [de ? "Mit E-Mail" : "With E-mail", String(totals.withEmail)],
    [de ? "Ohne Abteilung" : "Unassigned", String(totals.unassigned)],
  ];
  children.push(new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [4680, 4680],
    rows: summary.map(([k, v]) => new TableRow({ children: [
      dCell(k, 4680, { bold: true, fill: "F8FAFC" }),
      dCell(v, 4680),
    ] })),
  }));

  // Section 2: Chart by department
  children.push(sectionHeading(2, de ? "Organigramm nach Abteilung" : "Chart by Department"));
  for (const [dept, list] of groups) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 220 }, children: [
      new TextRun({ text: dept, bold: true, size: 22, font: "Arial", color: "1A2E41" }),
      new TextRun({ text: `  (${list.length})`, size: 18, font: "Arial", color: "718096" }),
    ] }));
    children.push(new Table({
      width: { size: 9360, type: WidthType.DXA }, columnWidths: [3120, 3120, 3120],
      rows: [
        new TableRow({ children: [
          hCell(de ? "Name" : "Name", 3120),
          hCell(de ? "Titel / Rolle" : "Title / Role", 3120),
          hCell(de ? "E-Mail" : "E-mail", 3120),
        ] }),
        ...list.map(p => new TableRow({ children: [
          dCell(p.name, 3120, { bold: true }),
          dCell(p.title, 3120),
          dCell(p.email || "—", 3120, { size: 16, color: p.email ? "1A2E41" : "999999" }),
        ] })),
      ],
    }));
  }

  // Section 3: Full roster
  children.push(sectionHeading(3, de ? "Vollständige Liste" : "Full Roster"));
  children.push(new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [2400, 2400, 1800, 2760],
    rows: [
      new TableRow({ children: [
        hCell(de ? "Name" : "Name", 2400),
        hCell(de ? "Titel / Rolle" : "Title / Role", 2400),
        hCell(de ? "Abteilung" : "Department", 1800),
        hCell(de ? "E-Mail" : "E-mail", 2760),
      ] }),
      ...people.slice().sort((a, b) => a.name.localeCompare(b.name)).map(p => new TableRow({ children: [
        dCell(p.name, 2400, { bold: true }),
        dCell(p.title, 2400),
        dCell(p.department || "—", 1800),
        dCell(p.email || "—", 2760, { size: 16 }),
      ] })),
    ],
  }));

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 20 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      headers: {
        default: new Header({ children: [new Paragraph({ children: [new TextRun({
          text: `${getReportBrandName(de)} — ${companyName || ""}`, size: 16, font: "Arial", color: "999999",
        })] })] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: "999999" }),
          new TextRun({ text: "/", size: 16, font: "Arial", color: "999999" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: "Arial", color: "999999" }),
        ] })] }),
      },
      children: children as never,
    }],
  });

  const buffer = await Packer.toBlob(doc);
  const filename = `${getReportBrandSlug("en")}_${de ? "IT-Sicherheit_Organigramm" : "IT_Security_Org_Chart"}.docx`;
  saveAs(buffer, filename);
}

/** Personen/Rollen als Excel — Zuständigkeiten filterbar. */
export async function generatePersonnelReportExcel(input: any, lang: Lang = "de") {
  const de = lang === "de";
  const people: any[] = input?.people ?? input?.personnel ?? input?.registry?.people ?? [];
  await exportBrandedXlsx({
    fileBase: de ? "Personen-und-Rollen" : "People-and-roles",
    title: de ? "Personen, Rollen und Zuständigkeiten" : "People, roles and responsibilities",
    lang,
    scope: de ? `${people.length} Personen` : `${people.length} people`,
    sheets: [{
      name: de ? "Personen" : "People",
      columns: [
        { header: de ? "Name" : "Name", key: "n", width: 28 },
        { header: de ? "Rolle" : "Role", key: "r", width: 26 },
        { header: de ? "Bereich" : "Unit", key: "u", width: 24 },
        { header: "E-Mail", key: "e", width: 30 },
        { header: de ? "Kontrollen" : "Controls", key: "c", width: 14, kind: "num" },
        { header: de ? "Stellvertretung" : "Deputy", key: "d", width: 24 },
      ],
      rows: people.map((p2: any) => ({
        n: p2.name ?? "", r: p2.role ?? "", u: p2.unit ?? p2.department ?? "",
        e: p2.email ?? "", c: (p2.controlIds ?? p2.controls ?? []).length || "",
        d: p2.deputy ?? "",
      })),
    }],
  });
}
