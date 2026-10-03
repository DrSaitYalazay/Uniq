// Bun script: export all Richtlinien (policy templates + clauses) → single Word doc.
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageOrientation, LevelFormat, PageBreak, TableOfContents, Footer, PageNumber,
} from "docx";
import { writeFileSync } from "node:fs";

import POLICY_TEMPLATES from "../src/data/policyTemplates";
import CLAUSES from "../src/data/policyClauseTemplates";

const ARIAL = "Arial";

const p = (text: string, opts: { bold?: boolean; size?: number; italics?: boolean; spacingBefore?: number; spacingAfter?: number; numbering?: { reference: string; level: number } } = {}) =>
  new Paragraph({
    spacing: { before: opts.spacingBefore ?? 60, after: opts.spacingAfter ?? 60 },
    numbering: opts.numbering,
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italics, size: opts.size ?? 22, font: ARIAL })],
  });

const h = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) =>
  new Paragraph({
    heading: level,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, font: ARIAL })],
  });

// Group by category, preserving order from POLICY_TEMPLATES.
const byCategory = new Map<string, typeof POLICY_TEMPLATES>();
for (const pol of POLICY_TEMPLATES) {
  if (!byCategory.has(pol.category)) byCategory.set(pol.category, []);
  byCategory.get(pol.category)!.push(pol);
}

const children: Paragraph[] = [];

// Cover page
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 2400, after: 240 },
    children: [new TextRun({ text: "UniqSuite – Vollständige Richtlinien-Sammlung", bold: true, size: 44, font: ARIAL })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({ text: "Information Security Management System – Policy Library", italics: true, size: 28, font: ARIAL })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({ text: `Stand: ${new Date().toLocaleDateString("de-DE")}`, size: 22, font: ARIAL })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({ text: `${POLICY_TEMPLATES.length} Richtlinien · Bilingual (DE / EN)`, size: 22, font: ARIAL })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
);

// Table of contents
children.push(h("Inhaltsverzeichnis / Table of Contents", HeadingLevel.HEADING_1));
children.push(new Paragraph({
  children: [new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" })],
}));
children.push(new Paragraph({ children: [new PageBreak()] }));

let policyCount = 0;
let clauseCount = 0;

for (const [category, pols] of byCategory) {
  children.push(h(category, HeadingLevel.HEADING_1));
  for (const pol of pols) {
    policyCount++;
    const clauses = (CLAUSES as Record<string, any[]>)[pol.id] ?? [];

    children.push(h(`${pol.id.toUpperCase()} — ${pol.name}`, HeadingLevel.HEADING_2));
    children.push(p(pol.nameEn, { italics: true, size: 20 }));

    children.push(p("Beschreibung / Description", { bold: true, spacingBefore: 160 }));
    children.push(p(pol.description));
    children.push(p(pol.descriptionEn, { italics: true }));

    children.push(p("Zweck / Purpose", { bold: true, spacingBefore: 160 }));
    children.push(p(pol.purpose));
    children.push(p(pol.purposeEn, { italics: true }));

    children.push(p("Grundregeln / Default Rules", { bold: true, spacingBefore: 160 }));
    for (const r of pol.defaultRules) children.push(new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      children: [new TextRun({ text: r, size: 22, font: ARIAL })],
    }));
    for (const r of pol.defaultRulesEn) children.push(new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      children: [new TextRun({ text: r, size: 22, font: ARIAL, italics: true })],
    }));

    if (clauses.length > 0) {
      children.push(h(`Klauseln / Clauses (${clauses.length})`, HeadingLevel.HEADING_3));
      for (const c of clauses) {
        clauseCount++;
        children.push(p(`${c.id} — ${c.title}`, { bold: true, spacingBefore: 200 }));
        children.push(p(c.titleEn, { italics: true, size: 20 }));

        children.push(p("Anforderung / Requirement:", { bold: true, spacingBefore: 100 }));
        children.push(p(c.description));
        children.push(p(c.descriptionEn, { italics: true }));

        children.push(p("Begründung / Rationale:", { bold: true, spacingBefore: 100 }));
        children.push(p(c.reason));
        children.push(p(c.reasonEn, { italics: true }));

        children.push(p("Wann erforderlich / When required:", { bold: true, spacingBefore: 100 }));
        children.push(p(c.whenRequired));
        children.push(p(c.whenRequiredEn, { italics: true }));

        if (c.sources?.length) {
          children.push(p(`Quellen / Sources: ${c.sources.join(" · ")}`, { size: 20, italics: true, spacingBefore: 80 }));
        }
      }
    }
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }
}

// Summary
children.push(h("Zusammenfassung / Summary", HeadingLevel.HEADING_1));
children.push(p(`Kategorien: ${byCategory.size}`));
children.push(p(`Richtlinien: ${policyCount}`));
children.push(p(`Klauseln: ${clauseCount}`));

const doc = new Document({
  creator: "UniqSuite",
  title: "UniqSuite – Richtlinien-Sammlung",
  styles: {
    default: { document: { run: { font: ARIAL, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: ARIAL, color: "1F3A68" },
        paragraph: { spacing: { before: 320, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: ARIAL, color: "2A5A9F" },
        paragraph: { spacing: { before: 260, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: ARIAL, color: "B8860B" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT }, // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "UniqSuite – Richtlinien-Sammlung · Seite ", size: 18, font: ARIAL }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, font: ARIAL }),
          new TextRun({ text: " / ", size: 18, font: ARIAL }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: ARIAL }),
        ],
      })] }),
    },
    children,
  }],
});

const buf = await Packer.toBuffer(doc);
const outPath = "/mnt/documents/UniqSuite-Richtlinien-Sammlung.docx";
writeFileSync(outPath, buf);
console.log(`✓ ${outPath}`);
console.log(`  Kategorien: ${byCategory.size} · Richtlinien: ${policyCount} · Klauseln: ${clauseCount}`);
console.log(`  Größe: ${(buf.length / 1024).toFixed(1)} KB`);
