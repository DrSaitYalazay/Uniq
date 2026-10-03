// Bun script: export all Schulungen (training categories + topics + quizzes) → single Word doc.
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageOrientation, LevelFormat, PageBreak, TableOfContents, Footer, PageNumber,
} from "docx";
import { writeFileSync } from "node:fs";

import { CATEGORIES } from "../src/data/training/categories";
import { TRAINING_QUIZZES } from "../src/data/training/quizzes";

const ARIAL = "Arial";

const ROLE_LABEL: Record<string, { de: string; en: string }> = {
  all: { de: "Alle Mitarbeiter", en: "All Employees" },
  management: { de: "Geschäftsleitung", en: "Management" },
  it: { de: "IT-Team", en: "IT Team" },
  procurement: { de: "Einkauf & Vertrag", en: "Procurement & Contracts" },
  developer: { de: "Entwickler", en: "Developers" },
  ot: { de: "OT/ICS-Personal", en: "OT/ICS Staff" },
};

const p = (text: string, opts: { bold?: boolean; size?: number; italics?: boolean; spacingBefore?: number; spacingAfter?: number } = {}) =>
  new Paragraph({
    spacing: { before: opts.spacingBefore ?? 60, after: opts.spacingAfter ?? 60 },
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italics, size: opts.size ?? 22, font: ARIAL })],
  });

const bullet = (text: string, italics = false) =>
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, size: 22, font: ARIAL, italics })],
  });

const h = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) =>
  new Paragraph({
    heading: level,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, font: ARIAL })],
  });

const children: Paragraph[] = [];

let totalTopics = 0;
let totalMandatory = 0;
for (const c of CATEGORIES) {
  totalTopics += c.topics.length;
  totalMandatory += c.topics.filter((t) => t.mandatory).length;
}
const totalQuestions = TRAINING_QUIZZES.reduce((s, q) => s + q.questions.length, 0);

// Cover
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 2400, after: 240 },
    children: [new TextRun({ text: "UniqSuite – Vollständiger Schulungskatalog", bold: true, size: 44, font: ARIAL })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({ text: "Awareness, Role-based Training & Quizzes", italics: true, size: 28, font: ARIAL })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({ text: `Stand: ${new Date().toLocaleDateString("de-DE")}`, size: 22, font: ARIAL })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({
      text: `${CATEGORIES.length} Kategorien · ${totalTopics} Themen (${totalMandatory} Pflicht) · ${TRAINING_QUIZZES.length} Quizzes · ${totalQuestions} Fragen · Bilingual (DE / EN)`,
      size: 22, font: ARIAL,
    })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
);

// TOC
children.push(h("Inhaltsverzeichnis / Table of Contents", HeadingLevel.HEADING_1));
children.push(new Paragraph({
  children: [new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" })],
}));
children.push(new Paragraph({ children: [new PageBreak()] }));

// Part 1: Topics by category
children.push(h("Teil 1 — Schulungsthemen / Part 1 — Training Topics", HeadingLevel.HEADING_1));
children.push(new Paragraph({ children: [new PageBreak()] }));

for (const cat of CATEGORIES) {
  children.push(h(`${cat.titleDe}`, HeadingLevel.HEADING_1));
  children.push(p(cat.titleEn, { italics: true, size: 22 }));

  for (const t of cat.topics) {
    children.push(h(`${t.id.toUpperCase()} — ${t.titleDe}`, HeadingLevel.HEADING_2));
    children.push(p(t.titleEn, { italics: true, size: 22 }));

    const meta: string[] = [];
    meta.push(t.mandatory ? "Pflicht / Mandatory" : "Optional");
    meta.push("Rollen / Roles: " + t.roles.map((r) => ROLE_LABEL[r]?.de ?? r).join(", "));
    children.push(p(meta.join("  ·  "), { italics: true, size: 20 }));

    children.push(p("Lerninhalte / Learning Content (DE):", { bold: true, spacingBefore: 160 }));
    for (const line of t.contentDe) children.push(bullet(line));
    children.push(p("Learning Content (EN):", { bold: true, spacingBefore: 100 }));
    for (const line of t.contentEn) children.push(bullet(line, true));

    children.push(p(`Schulungsunterlage / Training Document: ${t.docTitleDe}`, { bold: true, spacingBefore: 160 }));
    children.push(p(t.docTitleEn, { italics: true, size: 20 }));
    children.push(p("Inhalt (DE):", { bold: true, spacingBefore: 80 }));
    for (const line of t.docContentDe) children.push(bullet(line));
    children.push(p("Content (EN):", { bold: true, spacingBefore: 80 }));
    for (const line of t.docContentEn) children.push(bullet(line, true));

    children.push(new Paragraph({ children: [new PageBreak()] }));
  }
}

// Part 2: Quizzes
children.push(h("Teil 2 — Quizzes / Part 2 — Quizzes", HeadingLevel.HEADING_1));
children.push(new Paragraph({ children: [new PageBreak()] }));

for (const quiz of TRAINING_QUIZZES) {
  children.push(h(`${quiz.titleDe}`, HeadingLevel.HEADING_2));
  children.push(p(quiz.titleEn, { italics: true, size: 22 }));
  children.push(p(`Rolle / Role-track: ${quiz.roleTrack} · Fragen / Questions: ${quiz.questions.length}`, { italics: true, size: 20 }));

  quiz.questions.forEach((q, i) => {
    children.push(p(`Frage ${i + 1} / Question ${i + 1} (${q.id})`, { bold: true, spacingBefore: 200 }));
    children.push(p(q.questionDe));
    children.push(p(q.questionEn, { italics: true }));

    children.push(p("Antwortmöglichkeiten / Options (DE):", { bold: true, spacingBefore: 80, size: 20 }));
    q.optionsDe.forEach((o, idx) => {
      const mark = idx === q.correctIndex ? "✓ " : "   ";
      children.push(bullet(`${mark}${String.fromCharCode(65 + idx)}) ${o}`));
    });
    children.push(p("Options (EN):", { bold: true, spacingBefore: 60, size: 20 }));
    q.optionsEn.forEach((o, idx) => {
      const mark = idx === q.correctIndex ? "✓ " : "   ";
      children.push(bullet(`${mark}${String.fromCharCode(65 + idx)}) ${o}`, true));
    });

    children.push(p(`Richtige Antwort / Correct: ${String.fromCharCode(65 + q.correctIndex)}`, { bold: true, spacingBefore: 80, size: 20 }));
    children.push(p(`Begründung: ${q.explanationDe}`, { spacingBefore: 60 }));
    children.push(p(`Explanation: ${q.explanationEn}`, { italics: true }));
  });
  children.push(new Paragraph({ children: [new PageBreak()] }));
}

// Summary
children.push(h("Zusammenfassung / Summary", HeadingLevel.HEADING_1));
children.push(p(`Kategorien: ${CATEGORIES.length}`));
children.push(p(`Themen gesamt: ${totalTopics} (davon Pflicht: ${totalMandatory})`));
children.push(p(`Quizzes: ${TRAINING_QUIZZES.length}`));
children.push(p(`Fragen gesamt: ${totalQuestions}`));

const doc = new Document({
  creator: "UniqSuite",
  title: "UniqSuite – Schulungskatalog",
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
        size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "UniqSuite – Schulungskatalog · Seite ", size: 18, font: ARIAL }),
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
const outPath = "/mnt/documents/UniqSuite-Schulungskatalog.docx";
writeFileSync(outPath, buf);
console.log(`✓ ${outPath}`);
console.log(`  Kategorien: ${CATEGORIES.length} · Themen: ${totalTopics} (Pflicht: ${totalMandatory}) · Quizzes: ${TRAINING_QUIZZES.length} · Fragen: ${totalQuestions}`);
console.log(`  Größe: ${(buf.length / 1024).toFixed(1)} KB`);
