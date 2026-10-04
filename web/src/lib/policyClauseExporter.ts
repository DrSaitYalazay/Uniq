/**
 * Policy Clause Exporter — generates a professional Word document for a single policy
 * with selected best-practice clauses.
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, HeadingLevel, AlignmentType, ShadingType, BorderStyle,
  Footer, PageNumber, PageBreak,
} from "docx";
import { saveAs } from "file-saver";
import type { Lang } from "@/contexts/LanguageContext";
import type { PolicyTemplate } from "@/data/policyTemplates";
import type { PolicyClause } from "@/data/policyClauseTemplates";
import { resolvePolicyRefs } from "@/lib/policyRefResolver";
import { getActiveFrameworkKeys } from "@/lib/frameworkFlags";
import { filterSourcesForActive, activeFilterKeysFor } from "@/lib/policyFrameworkFilter";

interface PolicyState {
  scope: string;
  policyOwner: string;
  responsibleRoles: string;
  approvalAuthority: string;
  purpose: string;
  purposeEn: string;
  implementationStatus: string;
  reviewFrequency: string;
  lastReviewDate: string;
  nextReviewDate: string;
  exceptions: string;
  systemsUsed: string;
  version: string;
  creationDate: string;
  lastUpdated: string;
  effectiveDate?: string;
}

export interface ClauseExportOptions {
  includeRationale: boolean;
  includeSources: boolean;
  includeApplicability: boolean;
  includeSectionHeaders: boolean;
  /** Vorbefüllte Angaben (z. B. KI-Systeme aus dem KI-Register) vor den Regelungen. */
  anhang?: ExportAnhang;
}

/** Datenblock, der vor den Regelungen ausgegeben wird (ein Abschnitt je Eintrag). */
export interface ExportAnhang {
  titel: string;
  hinweis?: string;
  eintraege: { titel: string; felder: [string, string][] }[];
}

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
const margins = { top: 60, bottom: 60, left: 100, right: 100 };

function metaRow(label: string, value: string) {
  return new TableRow({ children: [
    new TableCell({ borders, shading: { fill: "F0F4F8", type: ShadingType.CLEAR, color: "000000" }, width: { size: 3000, type: WidthType.DXA }, margins,
      children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, font: "Arial", color: "143264" })] })] }),
    new TableCell({ borders, width: { size: 6360, type: WidthType.DXA }, margins,
      children: [new Paragraph({ children: [new TextRun({ text: value || "—", size: 18, font: "Arial" })] })] }),
  ] });
}

export async function generateClausePolicyWord(
  template: PolicyTemplate,
  state: PolicyState,
  selectedClauses: PolicyClause[],
  lang: Lang,
  companyName: string,
  options?: ClauseExportOptions,
) {
  const de = lang === "de";
  const pName = de ? template.name : template.nameEn;
  const opts: ClauseExportOptions = options || { includeRationale: true, includeSources: true, includeApplicability: true, includeSectionHeaders: true };

  const children: any[] = [];

  // ── Title ──
  children.push(new Paragraph({ spacing: { before: 1600 }, alignment: AlignmentType.CENTER, children: [
    new TextRun({ text: pName, bold: true, size: 44, color: "143264", font: "Arial" }),
  ] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [
    new TextRun({ text: companyName || "Organisation", size: 28, bold: true, color: "157A50", font: "Arial" }),
  ] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [
    new TextRun({ text: new Date().toLocaleDateString(de ? "de-DE" : "en-US"), size: 20, color: "999999", font: "Arial" }),
  ] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [
    new TextRun({ text: `Version ${state.version || "1.0"}`, size: 18, color: "999999", font: "Arial" }),
  ] }));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ── Metadata Table ──
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 }, children: [
    new TextRun({ text: de ? "Dokumentinformationen" : "Document Information", bold: true, size: 28, color: "143264", font: "Arial" }),
  ] }));

  const statusMap: Record<string, string> = {
    draft: de ? "Entwurf" : "Draft",
    not_implemented: de ? "Nicht umgesetzt" : "Not Implemented",
    partially_implemented: de ? "Teilweise umgesetzt" : "Partially Implemented",
    implemented: de ? "Umgesetzt" : "Implemented",
    entbehrlich: de ? "Entbehrlich" : "Not Applicable",
  };

  const metaRows = [
    metaRow(de ? "Richtlinienname" : "Policy Name", pName),
    metaRow(de ? "Kategorie" : "Category", de ? template.category : template.categoryEn),
    metaRow(de ? "Zweck" : "Purpose", de ? state.purpose : state.purposeEn),
    metaRow(de ? "Geltungsbereich" : "Scope", state.scope),
    metaRow(de ? "Verantwortlicher" : "Policy Owner", state.policyOwner),
    metaRow(de ? "Verantwortliche Rollen" : "Responsible Roles", state.responsibleRoles),
    metaRow(de ? "Genehmigung" : "Approval Authority", state.approvalAuthority),
    metaRow("Status", statusMap[state.implementationStatus] || "—"),
    metaRow(de ? "Überprüfungsfrequenz" : "Review Frequency", state.reviewFrequency),
    metaRow(de ? "Letzte Überprüfung" : "Last Review", state.lastReviewDate),
    metaRow(de ? "Nächste Überprüfung" : "Next Review", state.nextReviewDate),
    metaRow(de ? "Unterstützende Systeme" : "Supporting Systems", state.systemsUsed),
    metaRow("Version", state.version),
    metaRow(de ? "Erstellungsdatum" : "Creation Date", state.creationDate),
    metaRow(de ? "Inkrafttreten" : "Effective Date", state.effectiveDate || ""),
  ];

  children.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3000, 6360],
    rows: metaRows,
  }));

  // ── Vorbefüllte Angaben (z. B. aus dem KI-Register) ──
  if (opts.anhang && opts.anhang.eintraege.length > 0) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 }, children: [
      new TextRun({ text: opts.anhang.titel, bold: true, size: 28, color: "143264", font: "Arial" }),
    ] }));
    if (opts.anhang.hinweis) children.push(new Paragraph({ spacing: { after: 200 }, children: [
      new TextRun({ text: opts.anhang.hinweis, size: 18, color: "666666", font: "Arial", italics: true }),
    ] }));
    for (const e of opts.anhang.eintraege) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 100 }, children: [
        new TextRun({ text: e.titel, bold: true, size: 24, color: "143264", font: "Arial" }),
      ] }));
      children.push(new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3000, 6360],
        rows: e.felder.map(([l, v]) => metaRow(l, v)),
      }));
    }
  }

  // ── Clauses ──
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 200 }, children: [
    new TextRun({ text: de ? "Regelungen" : "Policy Clauses", bold: true, size: 28, color: "143264", font: "Arial" }),
  ] }));
  children.push(new Paragraph({ spacing: { after: 200 }, children: [
    new TextRun({ text: de
      ? `Diese Richtlinie umfasst ${selectedClauses.length} Regelungen, die auf anerkannten Best-Practice-Standards basieren.`
      : `This policy comprises ${selectedClauses.length} clauses based on recognized best-practice standards.`,
      size: 20, color: "666666", font: "Arial", italics: true }),
  ] }));

  selectedClauses.forEach((clause, idx) => {
    // Clause heading
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 }, children: [
      new TextRun({ text: `${idx + 1}. ${de ? clause.title : clause.titleEn}`, bold: true, size: 24, color: "143264", font: "Arial" }),
    ] }));

    const clauseRows: TableRow[] = [];

    // Description header (optional)
    if (opts.includeSectionHeaders !== false) {
      clauseRows.push(new TableRow({ children: [
        new TableCell({ borders, shading: { fill: "143264", type: ShadingType.CLEAR, color: "FFFFFF" }, width: { size: 9360, type: WidthType.DXA }, margins, columnSpan: 2,
          children: [new Paragraph({ children: [new TextRun({ text: de ? "Beschreibung" : "Description", bold: true, size: 18, color: "FFFFFF", font: "Arial" })] })] }),
      ] }));
    }

    // Description content
    clauseRows.push(new TableRow({ children: [
      new TableCell({ borders, width: { size: 9360, type: WidthType.DXA }, margins, columnSpan: 2,
        children: [new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: resolvePolicyRefs(de ? clause.description : clause.descriptionEn, de), size: 18, font: "Arial" })] })] }),
    ] }));

    // Rationale (optional)
    if (opts.includeRationale) {
      clauseRows.push(new TableRow({ children: [
        new TableCell({ borders, shading: { fill: "FFF8E1", type: ShadingType.CLEAR, color: "000000" }, width: { size: 3000, type: WidthType.DXA }, margins,
          children: [new Paragraph({ children: [new TextRun({ text: de ? "Begründung" : "Rationale", bold: true, size: 16, font: "Arial", color: "8B6914" })] })] }),
        new TableCell({ borders, shading: { fill: "FFF8E1", type: ShadingType.CLEAR, color: "000000" }, width: { size: 6360, type: WidthType.DXA }, margins,
          children: [new Paragraph({ children: [new TextRun({ text: resolvePolicyRefs(de ? clause.reason : clause.reasonEn, de), size: 16, font: "Arial" })] })] }),
      ] }));
    }

    // Applicability (optional)
    if (opts.includeApplicability) {
      clauseRows.push(new TableRow({ children: [
        new TableCell({ borders, shading: { fill: "E8F0FE", type: ShadingType.CLEAR, color: "000000" }, width: { size: 3000, type: WidthType.DXA }, margins,
          children: [new Paragraph({ children: [new TextRun({ text: de ? "Anwendbarkeit" : "Applicability", bold: true, size: 16, font: "Arial", color: "143264" })] })] }),
        new TableCell({ borders, shading: { fill: "E8F0FE", type: ShadingType.CLEAR, color: "000000" }, width: { size: 6360, type: WidthType.DXA }, margins,
          children: [new Paragraph({ children: [new TextRun({ text: resolvePolicyRefs(de ? clause.whenRequired : clause.whenRequiredEn, de), size: 16, font: "Arial" })] })] }),
      ] }));
    }

    // Sources (optional) — CWS-Kernregel wie in der Oberfläche: nur Quellen aktiver
    // Frameworks (vorher exportierte Word alle Quellen, die Seite zeigte gefiltert).
    const quellen = filterSourcesForActive(clause.sources, activeFilterKeysFor(getActiveFrameworkKeys()));
    if (opts.includeSources && quellen.length > 0) {
      clauseRows.push(new TableRow({ children: [
        new TableCell({ borders, width: { size: 3000, type: WidthType.DXA }, margins,
          children: [new Paragraph({ children: [new TextRun({ text: de ? "Quellen" : "Sources", bold: true, size: 16, font: "Arial", color: "666666" })] })] }),
        new TableCell({ borders, width: { size: 6360, type: WidthType.DXA }, margins,
          children: [new Paragraph({ children: [new TextRun({ text: quellen.join("; "), size: 16, font: "Arial", color: "666666" })] })] }),
      ] }));
    }

    children.push(new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3000, 6360],
      rows: clauseRows,
    }));
  });

  // ── Exceptions ──
  if (state.exceptions) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 }, children: [
      new TextRun({ text: de ? "Ausnahmen" : "Exceptions", bold: true, size: 28, color: "143264", font: "Arial" }),
    ] }));
    children.push(new Paragraph({ children: [new TextRun({ text: state.exceptions, size: 20, font: "Arial" })] }));
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 20 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: "Arial" }, paragraph: { spacing: { before: 240, after: 120 } } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Arial" }, paragraph: { spacing: { before: 200, after: 100 } } },
      ],
    },
    sections: [{
      properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `${companyName || "Organisation"} — ${pName} | `, size: 14, color: "999999", font: "Arial" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "999999", font: "Arial" }),
            ],
          })],
        }),
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = pName.replace(/[^a-zA-Z0-9äöüÄÖÜß\-_\s]/g, "").replace(/\s+/g, "_");
  saveAs(blob, `${safeName}.docx`);
}
