/**
 * NIS2 Governance Document Templates — Word (.docx) generators.
 *
 * Style matches the rest of the tenant reports (policy / report look):
 *   Arial · navy #143264 headings · gold #157A50 accent
 *   light-blue meta tables (#E8F0FE) · cream callouts (#FFF8E1)
 *
 * Each generator outputs a real .docx file (docx-js) — not HTML-as-doc —
 * so the document opens populated, never empty.
 *
 * Merge fields known to the app (Step 1 + Personnel) are pre-filled.
 * Event-specific fields stay as visible "[ … ]" placeholders the user
 * completes in Word.
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, HeadingLevel, AlignmentType, ShadingType, BorderStyle,
  Footer, Header, PageNumber, PageBreak, LevelFormat,
} from "docx";
import { saveAs } from "file-saver";
import type { Person } from "@/lib/personnel";

export type DocLang = "de" | "en";

export type TemplateKind =
  | "charter"
  | "resolution"
  | "risk-acceptance"
  | "isms-scope"
  | "management-review"
  | "nis2-contact"
  | "training-attestation"
  | "supplier-notice"
  | "incident-escalation"
  | "company-structure";

// ── Style tokens — matches HealthCore Governance Pack reference ───────────
// Arial · navy #143264 headings/banners · gold #157A50 rules & callouts
// Navy-filled section banners (white text), navy-filled table header rows.
const FONT = "Arial";
const TEXT = "1F2A44";           // body text — deep slate
const NAVY = "143264";           // primary navy
const NAVY_DARK = "0E2347";      // darker navy for filled banners
const HEAD = NAVY;
const HEAD_DARK = NAVY_DARK;
const GOLD = "157A50";           // accent gold
const GOLD_SOFT = "E6C977";      // softer gold (borders / rules)
const CREAM = "FFF7E0";          // callout fill
const MUTED = "5B6B82";          // muted captions
const BORDER = "BFBFBF";         // neutral cell border

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: BORDER };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};
const margins = { top: 100, bottom: 100, left: 140, right: 140 };

// ── Helpers ────────────────────────────────────────────────────────────────
const T = (text: string, opts: any = {}) =>
  new TextRun({ text, font: FONT, size: 21, color: TEXT, ...opts });

const p = (text: string, opts: any = {}) =>
  new Paragraph({ spacing: { after: 120 }, alignment: AlignmentType.JUSTIFIED, ...opts.paragraph, children: [T(text, opts)] });

const muted = (text: string) => T(text, { color: MUTED, italics: true });
const fill = (text: string) => T(`[ ${text} ]`, { color: MUTED, italics: true });

/** Section heading (Heading 1) — navy bold with gold bottom rule. */
const h1 = (text: string) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 340, after: 140 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 4 } },
    children: [T(text, { bold: true, size: 30, color: NAVY })],
  });

const h2 = (text: string) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 100 },
    children: [T(text, { bold: true, size: 26, color: NAVY })],
  });

/** Gold left-bar callout — matches reference disclaimer/note box. */
const callout = (text: string) =>
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: GOLD_SOFT },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: GOLD_SOFT },
              right: { style: BorderStyle.SINGLE, size: 2, color: GOLD_SOFT },
              left: { style: BorderStyle.SINGLE, size: 32, color: GOLD },
            },
            shading: { fill: CREAM, type: ShadingType.CLEAR, color: "auto" },
            width: { size: 9360, type: WidthType.DXA },
            margins: { top: 160, bottom: 160, left: 220, right: 200 },
            children: [new Paragraph({ children: [T(text, { color: NAVY_DARK, size: 21 })] })],
          }),
        ],
      }),
    ],
  });

/** Navy-filled section banner — introduces each document. */
const sectionBanner = (title: string, subtitle?: string) =>
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            shading: { fill: NAVY_DARK, type: ShadingType.CLEAR, color: "auto" },
            width: { size: 9360, type: WidthType.DXA },
            margins: { top: 180, bottom: subtitle ? 160 : 180, left: 220, right: 200 },
            children: [
              new Paragraph({ spacing: { after: subtitle ? 80 : 0 }, children: [
                new TextRun({ text: title, font: FONT, size: 26, bold: true, color: "FFFFFF" }),
              ] }),
              ...(subtitle ? [new Paragraph({ children: [
                new TextRun({ text: subtitle, font: FONT, size: 19, color: "FFFFFF" }),
              ] })] : []),
            ],
          }),
        ],
      }),
    ],
  });

const metaRow = (label: string, value: string) =>
  new TableRow({
    children: [
      new TableCell({
        borders, width: { size: 3000, type: WidthType.DXA }, margins,
        shading: { fill: NAVY_DARK, type: ShadingType.CLEAR, color: "auto" },
        children: [new Paragraph({ children: [T(label, { bold: true, color: "FFFFFF", size: 20 })] })],
      }),
      new TableCell({
        borders, width: { size: 6360, type: WidthType.DXA }, margins,
        children: [new Paragraph({ children: [T(value || "—", { size: 21 })] })],
      }),
    ],
  });

const metaTable = (rows: TableRow[]) =>
  new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3000, 6360], rows });

const headerCell = (text: string, widthDxa: number) =>
  new TableCell({
    borders, width: { size: widthDxa, type: WidthType.DXA }, margins,
    shading: { fill: NAVY_DARK, type: ShadingType.CLEAR, color: "auto" },
    children: [new Paragraph({ children: [T(text, { bold: true, color: "FFFFFF", size: 20 })] })],
  });

const bodyCell = (text: string, widthDxa: number, opts: any = {}) =>
  new TableCell({
    borders, width: { size: widthDxa, type: WidthType.DXA }, margins,
    children: [new Paragraph({ children: [T(text || "—", { size: 21, ...opts })] })],
  });

const dataTable = (headers: string[], rows: (string | { text: string; opts?: any })[][], widths: number[]) => {
  const headRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => headerCell(h, widths[i])),
  });
  const bodyRows = rows.map(
    (cols) =>
      new TableRow({
        children: cols.map((cell, i) => {
          const text = typeof cell === "string" ? cell : cell.text;
          const opts = typeof cell === "string" ? {} : cell.opts ?? {};
          return new TableCell({
            borders, width: { size: widths[i], type: WidthType.DXA }, margins,
            children: [new Paragraph({ children: [T(text || "—", { size: 21, ...opts })] })],
          });
        }),
      })
  );
  return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: widths, rows: [headRow, ...bodyRows] });
};

const bullets = (items: string[]) =>
  items.map((it) =>
    new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      spacing: { after: 60 },
      children: [T(it)],
    })
  );

const ordered = (items: string[]) =>
  items.map((it) =>
    new Paragraph({
      numbering: { reference: "numbers", level: 0 },
      spacing: { after: 60 },
      children: [T(it)],
    })
  );

const space = (after = 100) => new Paragraph({ spacing: { after }, children: [T("")] });

const draftBadge = (lang: DocLang) =>
  new Paragraph({
    spacing: { after: 160 },
    children: [
      new TextRun({
        text: lang === "de"
          ? "ENTWURF — markierte Felder ergänzen"
          : "DRAFT — complete the highlighted fields",
        bold: true, font: FONT, size: 17, color: GOLD, italics: true,
      }),
    ],
  });

/** Title page — small gold "UNIQSUITE" eyebrow with gold rule,
 *  big navy entity name, subtitle, then navy document banner with the title.
 *  Adoption date / version are placeholders so the template never reads as
 *  pre-adopted evidence. */
const titleBlock = (title: string, subtitle: string, entityName: string, lang: DocLang) => {
  return [
    new Paragraph({ spacing: { before: 80, after: 40 }, children: [
      new TextRun({ text: "UNIQSUITE", font: FONT, size: 20, bold: true, color: GOLD }),
    ] }),
    new Paragraph({
      spacing: { after: 280 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: GOLD, space: 6 } },
      children: [
        new TextRun({
          text: lang === "de"
            ? "NIS2-GOVERNANCE-NACHWEISPAKET  ·  DOKUMENTVORLAGE"
            : "NIS2 GOVERNANCE EVIDENCE PACK  ·  DOCUMENT TEMPLATE",
          font: FONT, size: 18, bold: true, color: NAVY,
        }),
      ],
    }),
    new Paragraph({ spacing: { after: 80 }, children: [
      new TextRun({ text: entityName, font: FONT, size: 44, bold: true, color: NAVY }),
    ] }),
    new Paragraph({ spacing: { after: 200 }, children: [
      new TextRun({ text: subtitle, font: FONT, size: 22, color: TEXT }),
    ] }),
    new Paragraph({ spacing: { after: 240 }, children: [
      new TextRun({
        text: lang === "de"
          ? "Verabschiedet am [ Datum ]  ·  Version [ x.y ]"
          : "Adopted [ date ]  ·  Version [ x.y ]",
        font: FONT, size: 20, color: MUTED, italics: true,
      }),
    ] }),
    draftBadge(lang),
    sectionBanner(title, subtitle),
    space(120),
  ];
};

// ── Role derivation from personnel ────────────────────────────────────────
const titleMatches = (p: Person, patterns: RegExp[]) =>
  patterns.some((re) => re.test(p.title || "") || re.test(p.name || ""));

export function derivePersonRoles(people: Person[]) {
  const find = (patterns: RegExp[]) => people.find((p) => titleMatches(p, patterns))?.name;
  return {
    ceoName: find([/\bCEO\b/i, /Vorstand/i, /Geschäftsführ/i, /Chair/i]) ?? "",
    cfoName: find([/\bCFO\b/i, /Finanz/i, /Finance/i]) ?? "",
    cisoName: find([/\bCISO\b/i, /\bISB\b/i, /Informationssicher/i, /Information Security/i]) ?? "",
    deputyName: find([/Deput/i, /Stellvertr/i, /Legal/i, /Recht/i]) ?? "",
    dpoName: find([/\bDPO\b/i, /Datenschutz/i, /Data Protection/i]) ?? "",
  };
}

const boardPatterns = [
  /\bCEO\b/i, /\bCFO\b/i, /\bCOO\b/i, /\bCTO\b/i,
  /Vorstand/i, /Geschäftsführ/i, /Chair/i, /Aufsicht/i, /Board/i,
];

export interface BuildContext {
  entityName: string;
  people: Person[];
  lang: DocLang;
}

// ── Document factory ──────────────────────────────────────────────────────
function buildDocument(entityName: string, lang: DocLang, docTitle: string, children: any[]) {
  return new Document({
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 540, hanging: 240 } } },
            },
          ],
        },
        {
          reference: "numbers",
          levels: [
            {
              level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 540, hanging: 240 } } },
            },
          ],
        },
      ],
    },
    styles: {
      default: { document: { run: { font: FONT, size: 21, color: TEXT } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, font: FONT, color: HEAD },
          paragraph: { spacing: { before: 320, after: 140 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, font: FONT, color: HEAD },
          paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 1 } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: FONT, color: HEAD_DARK },
          paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 4 } },
            children: [
              new TextRun({ text: entityName, font: FONT, size: 16, bold: true, color: NAVY }),
              new TextRun({ text: "  ·  " + docTitle, font: FONT, size: 16, color: MUTED }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.LEFT,
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 4 } },
            children: [
              new TextRun({ text: "UniqSuite  ·  NIS2-Governance  ·  Seite  ", font: FONT, size: 16, color: MUTED }),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, bold: true, color: NAVY }),
            ],
          })],
        }),
      },
      children,
    }],
  });
}

function safeFilename(s: string): string {
  return s.replace(/[\\/:*?"<>|]+/g, " ").trim() || "Document";
}

async function save(doc: Document, entityName: string, docTitle: string) {
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${safeFilename(entityName)} — ${docTitle}.docx`);
}

// ─────────────────────────────────────────────────────────────────────────
// Template builders
// ─────────────────────────────────────────────────────────────────────────

// 1. Cyber Governance Charter
async function buildCharter(ctx: BuildContext) {
  const { entityName, people, lang } = ctx;
  const de = lang === "de";
  const roles = derivePersonRoles(people);
  const board = people.filter((p) => titleMatches(p, boardPatterns));

  const docTitle = de ? "Cyber-Governance-Charta" : "Cyber Governance Charter";
  const children: any[] = [
    ...titleBlock(docTitle, de
      ? "Wie das Leitungsorgan Cybersicherheit nach NIS2 steuert"
      : "How the management body governs cybersecurity under NIS2",
      entityName, lang),

    metaTable([
      metaRow(de ? "Dokument" : "Document", docTitle),
      metaRow(de ? "Unternehmen" : "Entity", entityName),
      metaRow(de ? "Programmverantwortung" : "Programme owner",
        roles.cisoName ? `${roles.cisoName} — CISO / ISB` : "[ CISO / ISB ]"),
      metaRow(de ? "Version / Status" : "Version / status", de ? "[ x.y / Entwurf ]" : "[ x.y / Draft ]"),
      metaRow(de ? "Angenommen am" : "Adopted on", de ? "[ Datum ] ([ Beschluss-Ref. ])" : "[ date ] ([ resolution ref. ])"),
      metaRow(de ? "Überprüfungszyklus" : "Review cycle",
        de ? "Jährlich oder bei wesentlicher Änderung" : "Annually or on material change"),
      metaRow(de ? "Rechtsgrundlage" : "Legal basis",
        de ? "NIS2 Art. 20 & 21 · § 38 BSIG" : "NIS2 Art. 20 & 21 · § 38 BSIG"),
    ]),

    h1(de ? "1. Zweck" : "1. Purpose"),
    p(de
      ? `Diese Charta legt fest, wie das Leitungsorgan von ${entityName} die Cybersicherheit nach der NIS2-Richtlinie steuert. Das Cyberrisiko wird auf Leitungsebene verantwortet, gelenkt und nachgewiesen — nicht wegdelegiert — damit eine Aufsichtsbehörde aus den Aufzeichnungen erkennt, dass das Leitungsorgan die Risikomanagementmaßnahmen billigt, überwacht und dazu geschult ist.`
      : `This charter sets out how the management body of ${entityName} governs cybersecurity under the NIS2 Directive. Cyber risk is owned, directed and evidenced at board level — not delegated away — so that a supervisory authority can see from the records that the board approves, oversees and is trained on the risk-management measures.`),

    h1(de ? "2. Geltungsbereich" : "2. Scope"),
    p(de
      ? `Diese Charta umfasst die gesamte Informations- und Betriebstechnik, die die regulierten Dienste von ${entityName} an seinen Standorten ([ Standorte ]) unterstützt, sowie alle Lieferanten, die seine Daten verarbeiten oder seine Systeme betreiben.`
      : `This charter covers all information and operational technology supporting the regulated services of ${entityName} across its sites ([ sites ]), and all suppliers that process its data or operate its systems.`),

    h1(de ? "3. Das Leitungsorgan und seine Pflichten (Artikel 20)" : "3. The management body and its duties (Article 20)"),
    p(de
      ? "Das Leitungsorgan ist gemeinschaftlich für die Cybersicherheits-Risikomanagementmaßnahmen verantwortlich. Jedes Mitglied trägt diese Pflicht persönlich und nicht delegierbar."
      : "The management body is collectively accountable for the cybersecurity risk-management measures. Each member carries this duty personally and non-delegably."),

    dataTable(
      [de ? "Mitglied" : "Member", de ? "Rolle" : "Role", de ? "NIS2-Verantwortung" : "NIS2 responsibility"],
      board.length > 0
        ? board.map((p) => [p.name, p.title,
            de ? "Billigung & Überwachung der Art. 21(2)-Maßnahmen" : "Approve & oversee the Article 21(2) measures"])
        : [["[ Name ]", "[ Rolle ]", de ? "Billigung & Überwachung der Art. 21(2)-Maßnahmen" : "Approve & oversee the Article 21(2) measures"]],
      [3000, 2360, 4000]
    ),

    space(),
    p(de
      ? "Nach Artikel 20 muss das Leitungsorgan (a) die Risikomanagementmaßnahmen billigen, (b) deren Umsetzung überwachen und (c) Schulungen absolvieren, um ausreichende Kenntnisse und Fähigkeiten zu erwerben."
      : "Under Article 20 the management body must (a) approve the risk-management measures, (b) oversee their implementation, and (c) undertake training to acquire sufficient knowledge and skills."),

    h1(de ? "4. Rollen außerhalb des Leitungsorgans" : "4. Roles outside the board"),
    dataTable(
      [de ? "Rolle" : "Role", de ? "Inhaber" : "Holder", de ? "Mandat" : "Mandate"],
      [
        [de ? "CISO / ISB" : "CISO / ISB", roles.cisoName || "[ Name ]",
          de ? "Führt das ISMS; berichtet vierteljährlich; registrierter NIS2-Kontakt" : "Runs the ISMS; reports quarterly; registered NIS2 contact"],
        [de ? "Stellvertretung / Recht" : "Deputy / Legal", roles.deputyName || "[ Name ]",
          de ? "Stellv. NIS2-Kontakt; rechtliche Schnittstelle" : "Deputy NIS2 contact; legal interface"],
        [de ? "Datenschutzbeauftragte/r" : "Data Protection Officer", roles.dpoName || "[ Name ]",
          de ? "DSGVO-Schnittstelle; Datenschutzverletzungen" : "GDPR interface; personal-data breaches"],
      ],
      [3000, 2800, 3560]
    ),

    h1(de ? "5. Berichterstattung und Genehmigung" : "5. Reporting and approval"),
    ...bullets(de ? [
      "Ein ständiger TOP Cybersicherheit steht mindestens vierteljährlich auf der Agenda des Leitungsorgans.",
      "Der CISO berichtet Top-Risiken, Programmstatus, Vorfälle und offene Lücken; das Leitungsorgan hält Fragen und Entscheidungen im Protokoll fest.",
      "Das Leitungsorgan billigt die Maßnahmen nach Artikel 21(2) — und jede wesentliche Änderung — förmlich per Beschluss.",
      "Akzeptiert das Leitungsorgan ein Restrisiko, wird die Entscheidung im Risikoakzeptanz-Register mit Namen und Datum festgehalten.",
    ] : [
      "A standing cybersecurity item is on the management-body agenda at least quarterly.",
      "The CISO reports top risks, programme status, incidents and open gaps; the board records its questions and decisions in the minutes.",
      "The board formally approves the Article 21(2) measures, and any material change, by resolution.",
      "Where the board tolerates a residual risk, the decision is recorded in the risk-acceptance log, by name and date.",
    ]),

    h1(de ? "6. Eskalation" : "6. Escalation"),
    p(de
      ? "Ein getesteter Eskalationspfad verbindet den Sicherheitsbetrieb mit dem Leitungsorgan schnell genug, um die 24-Stunden-Frühwarnpflicht nach Artikel 23 zu erfüllen. Er wird mindestens jährlich geübt, auch außerhalb der Geschäftszeiten."
      : "A tested escalation path connects security operations to the management body fast enough to meet the 24-hour early-warning obligation under Article 23. It is exercised at least annually, including out-of-hours."),

    h1(de ? "7. Schulung" : "7. Training"),
    p(de
      ? "Jedes Mitglied des Leitungsorgans absolviert eine individuelle Cybersicherheitsschulung nach dem Maßstab ausreichender Kenntnisse und Fähigkeiten (Art. 20(2)), mit personenbezogenem Nachweis und Auffrischung mindestens alle drei Jahre."
      : "Every member of the management body completes individual cybersecurity training to the sufficient-knowledge-and-skills standard of Article 20(2), with a per-person record and a refresh at least every three years."),

    h1(de ? "8. Ressourcen & Budget" : "8. Resources & budget"),
    p(de
      ? "Das Leitungsorgan stellt die für die Cybersicherheits-Funktion erforderlichen finanziellen und personellen Mittel bereit. Mindestbestandteile:"
      : "The management body provides the financial and human resources required for the cybersecurity function. Minimum components:"),
    ...bullets(de ? [
      "Cybersicherheits-Budget jährlich gebilligt (CapEx + OpEx), separat ausgewiesen vom IT-Budget.",
      "Personalstellen: CISO, Stellvertretung, mind. ein SOC/Detection-Engineer pro Schichtmodell.",
      "Externe Unterstützung: Incident-Response-Retainer, jährliches Pentest, ISO-27001-Audit-Partner.",
      "Werkzeuge: SIEM, EDR, Schwachstellen-Scanner, IAM/PAM, Backup mit Immutable-Storage.",
      "Schulungsbudget pro Mitarbeiter und gesondertes Budget für Leitungsorgan-Schulung.",
    ] : [
      "Cybersecurity budget approved annually (CapEx + OpEx), reported separately from the IT budget.",
      "Headcount: CISO, deputy, at least one SOC/detection engineer per shift model.",
      "External support: incident-response retainer, annual pentest, ISO 27001 audit partner.",
      "Tools: SIEM, EDR, vulnerability scanner, IAM/PAM, backup with immutable storage.",
      "Training budget per employee and a separate budget for board training.",
    ]),

    h1(de ? "9. Berichts-KPIs an das Leitungsorgan" : "9. Reporting KPIs to the management body"),
    dataTable(
      [de ? "KPI" : "KPI", de ? "Definition" : "Definition", de ? "Schwellwert" : "Threshold", de ? "Frequenz" : "Frequency"],
      [
        [de ? "Compliance-Rate (SoA)" : "Compliance rate (SoA)", de ? "Implementiert / Anwendbar" : "Implemented / applicable", "≥ 90 %", de ? "Quartal" : "Quarterly"],
        [de ? "Durchschnittlicher Reifegrad" : "Average maturity level", de ? "Skala 1–5" : "Scale 1–5", "≥ 3,5", de ? "Quartal" : "Quarterly"],
        [de ? "Offene Hochrisiken" : "Open high risks", de ? "Restrisiko ≥ Hoch" : "Residual ≥ High", "0", de ? "Monatlich" : "Monthly"],
        [de ? "24h-Meldefristen eingehalten" : "24h notification deadlines met", "n / n", "100 %", de ? "Pro Vorfall" : "Per incident"],
        [de ? "Schulungsabdeckung Belegschaft" : "Training coverage workforce", "% " + (de ? "geschult" : "trained"), "≥ 95 %", de ? "Quartal" : "Quarterly"],
        [de ? "Wirksamkeit kritischer Kontrollen" : "Effectiveness of critical controls", de ? "Audit-Ergebnis" : "Audit result", "≥ 80 %", de ? "Jährlich" : "Annual"],
        [de ? "Überfällige Maßnahmen" : "Overdue actions", de ? "Aus Risikobehandlung" : "From risk treatment", "0", de ? "Monatlich" : "Monthly"],
      ],
      [2800, 3200, 1660, 1700]
    ),

    h1(de ? "10. Ausnahmen, Schwellwerte & Eskalations-Trigger" : "10. Exceptions, thresholds & escalation triggers"),
    ...bullets(de ? [
      "Ausnahme von einer gebilligten Maßnahme: nur befristet (max. 6 Monate), schriftlich begründet, vom CISO und CEO gegengezeichnet, in Risikoakzeptanz-Register überführt.",
      "Ausserordentliche Einberufung des Leitungsorgans: bei kritischem Vorfall, Aufsichtsanfrage, ≥ 1 Stufe Risikoanstieg in Top-5, Ausfall eines wesentlichen Lieferanten.",
      "Kommunikation an Aufsichtsbehörde: ausschließlich über benannten NIS2-Kontakt, mit schriftlicher Freigabe des CEO.",
      "Whistleblower- / Hinweisgeberkanal für Cybersicherheits-Bedenken ist eingerichtet und in der Charta verankert.",
    ] : [
      "Exception from an approved measure: time-limited only (max 6 months), justified in writing, counter-signed by CISO and CEO, transferred to the risk-acceptance register.",
      "Extraordinary convening of the management body: on critical incident, supervisory request, ≥ 1 risk-level rise in top-5, failure of a material supplier.",
      "Communication with the supervisory authority: exclusively via the designated NIS2 contact, with written CEO release.",
      "Whistleblower / speak-up channel for cybersecurity concerns is set up and anchored in this charter.",
    ]),

    h1(de ? "11. Versionskontrolle dieser Charta" : "11. Version control of this charter"),
    dataTable(
      [de ? "Version" : "Version", de ? "Datum" : "Date", de ? "Änderung" : "Change", de ? "Freigabe" : "Approved by"],
      [
        ["1.0", new Date().toLocaleDateString(de ? "de-DE" : "en-GB"), de ? "Erstausgabe" : "Initial issue", roles.ceoName || "[ CEO ]"],
        ["[ x.y ]", de ? "[ Datum ]" : "[ date ]", de ? "[ Änderung ]" : "[ change ]", de ? "[ Name ]" : "[ name ]"],
      ],
      [1500, 2000, 3860, 2000]
    ),

    h1(de ? "12. Annahme & Unterschriften" : "12. Adoption & signatures"),
    p(de
      ? `Angenommen vom Leitungsorgan von ${entityName} am [ Datum ], protokolliert unter Beschluss [ Ref. ].`
      : `Adopted by the management body of ${entityName} on [ date ], minuted under resolution [ ref. ].`),
    space(200),
    dataTable(
      ["", "", ""],
      [
        [roles.ceoName || "[ Name ]", roles.cfoName || "[ Name ]", roles.cisoName || "[ Name ]"],
        [de ? "CEO / Vorsitz" : "CEO / Chair", "CFO", de ? "CISO / ISB" : "CISO / ISB"],
        [de ? "Unterschrift: ____________" : "Signature: ____________",
         de ? "Unterschrift: ____________" : "Signature: ____________",
         de ? "Unterschrift: ____________" : "Signature: ____________"],
      ],
      [3120, 3120, 3120]
    ),
  ];

  return { doc: buildDocument(entityName, lang, docTitle, children), title: docTitle };
}

// 2. Board Resolution
async function buildResolution(ctx: BuildContext) {
  const { entityName, people, lang } = ctx;
  const de = lang === "de";
  const roles = derivePersonRoles(people);
  const boardNames = people.filter((p) => titleMatches(p, boardPatterns)).map((p) => p.name).join(", ");
  const docTitle = de ? "Beschluss des Leitungsorgans — Art. 21(2)" : "Board Resolution — Article 21(2)";

  const children: any[] = [
    ...titleBlock(docTitle,
      de ? `Billigung der Risikomanagementmaßnahmen — ${entityName}` : `Approval of the risk-management measures — ${entityName}`,
      entityName, lang),

    metaTable([
      metaRow(de ? "Beschluss-Nr." : "Resolution no.", de ? "[ z. B. BR-2026-03 ]" : "[ e.g. BR-2026-03 ]"),
      metaRow(de ? "Datum / Ort" : "Date / place", de ? "[ Datum ], [ Ort ]" : "[ date ], [ place ]"),
      metaRow(de ? "Anwesend (alle stimmberechtigten Mitglieder)" : "Present (all voting members)",
        boardNames || (de ? "[ vollständiges Leitungsorgan — eine Zeile je Mitglied ]" : "[ full management body — one row per voting member ]")),
      metaRow(de ? "Zusätzlich anwesend (nicht stimmberechtigt)" : "In attendance (non-voting)",
        `${roles.cisoName || "[ CISO/ISB ]"} (CISO/ISB), ${roles.deputyName || (de ? "[ Stellvertretung ]" : "[ Deputy ]")} (Legal)`),
      metaRow(de ? "Beschlussfähigkeit erreicht" : "Quorum met", de ? "[ ja / nein ]" : "[ yes / no ]"),
    ]),

    h1(de ? "Erwägungsgründe" : "Whereas"),
    ...ordered(de ? [
      `IN ERWÄGUNG, dass ${entityName} der NIS2-Richtlinie und dem BSIG unterliegt und die Pflichten aus Art. 20 und 21 NIS2 erfüllen muss;`,
      "IN ERWÄGUNG, dass die Pflicht zur Billigung und Überwachung der Risikomanagementmaßnahmen nach § 38 BSIG nicht delegierbar ist und persönliche Haftung der Mitglieder des Leitungsorgans bei Vernachlässigung begründet;",
      "IN ERWÄGUNG, dass der CISO dem Leitungsorgan einen umfassenden Bericht zum aktuellen Risikobild, zur Wirksamkeit der bestehenden Kontrollen und zu den verbleibenden Lücken vorgelegt hat;",
      "IN ERWÄGUNG, dass das Leitungsorgan die in Art. 21(2)(a)–(j) NIS2 geforderten Themenfelder (Risikoanalyse, Vorfallbehandlung, Kontinuität, Lieferkette, Sichere Beschaffung & Entwicklung, Wirksamkeit, Hygiene & Training, Kryptographie, Personalsicherheit, MFA & sichere Kommunikation) vollständig adressiert hat;",
      "IN ERWÄGUNG, dass die Cybersicherheits-Funktion mit angemessenen finanziellen und personellen Mitteln auszustatten ist, um Reife, Vorhersehbarkeit und Aufsichtsfähigkeit zu gewährleisten;",
    ] : [
      `WHEREAS ${entityName} is subject to the NIS2 Directive and the BSIG and must fulfil the duties of Art. 20 and 21 NIS2;`,
      "WHEREAS the duty to approve and oversee the risk-management measures under § 38 BSIG is non-delegable and triggers personal liability of management-body members on neglect;",
      "WHEREAS the CISO has presented to the management body a comprehensive report on the current risk picture, the effectiveness of existing controls and the remaining gaps;",
      "WHEREAS the management body has addressed all the topic areas required by Art. 21(2)(a)–(j) NIS2 (risk analysis, incident handling, continuity, supply chain, secure acquisition & development, effectiveness, hygiene & training, cryptography, personnel security, MFA & secure communications);",
      "WHEREAS the cybersecurity function shall be resourced with adequate financial and human means to ensure maturity, predictability and supervisory readiness;",
    ]),

    h1(de ? "Beschluss" : "Resolved"),
    p(de
      ? `Das Leitungsorgan von ${entityName}, nach Prüfung des Berichts des CISO vom [ Datum ], BESCHLIESST wie folgt:`
      : `The management body of ${entityName}, having reviewed the report of the CISO dated [ date ], RESOLVES as follows:`),

    ...ordered(de ? [
      "Die Cybersicherheits-Risikomanagementmaßnahmen zur Umsetzung von Art. 21(2)(a)–(j) gemäß ISMS-Geltungsbereich und Anwendbarkeitserklärung ([ Anzahl SoA-Einträge ]) zu BILLIGEN.",
      "Den Umsetzungsfahrplan und ein Budget von [ Betrag ] über [ Zeitraum ] zu BILLIGEN, gegliedert nach Phasen Now / Next / Later.",
      `${roles.cisoName || "[ CISO ]"} als Informationssicherheitsbeauftragten (ISB) und registrierten NIS2-Kontakt sowie ${roles.deputyName || "[ Deputy ]"} als stellvertretenden Kontakt zu BESTÄTIGEN; die Benennung wird dem BSI binnen 14 Tagen mitgeteilt.`,
      "Die Cyber-Governance-Charta und den vierteljährlichen Überprüfungszyklus (TOP Cybersicherheit) zu VERABSCHIEDEN.",
      'FESTZULEGEN, dass jedes vom Leitungsorgan akzeptierte Restrisiko im Risikoakzeptanz-Register mit Namen, Datum und Begründung erfasst wird; Restrisiko-Stufe „Kritisch" ist nicht akzeptabel.',
      "ZUR KENNTNIS ZU NEHMEN, dass jedes Mitglied seine individuelle NIS2-Schulung (Art. 20(2)) bis [ Datum ] absolviert und mindestens alle drei Jahre auffrischt.",
      "Die Eskalationskette und die 24/72/1M-Meldepflichten nach Art. 23 förmlich in Kraft zu SETZEN; jährliche Übung verpflichtend, einmal außerhalb der Geschäftszeiten.",
      "Den Lieferanten-Anschreibe-Standard und die Mindestklauseln für IKT-Drittparteienverträge zu BILLIGEN.",
      "Den CISO zu BEAUFTRAGEN, bis [ Datum ] eine erste interne ISMS-Audit-Welle abzuschließen und die Ergebnisse dem Leitungsorgan im nächsten Quartal zu berichten.",
    ] : [
      "To APPROVE the cybersecurity risk-management measures implementing Article 21(2)(a)–(j), as set out in the ISMS scope and the Statement of Applicability ([ entries ]).",
      "To APPROVE the implementation roadmap and a budget of [ amount ] over [ period ], structured in phases Now / Next / Later.",
      `To CONFIRM ${roles.cisoName || "[ CISO ]"} as Information Security Officer (ISB) and registered NIS2 contact, and ${roles.deputyName || "[ Deputy ]"} as deputy contact; the designation is notified to BSI within 14 days.`,
      "To ADOPT the Cyber Governance Charter and the quarterly review cadence (standing cyber item).",
      "To REQUIRE that any residual risk the board accepts be recorded in the risk-acceptance log, by name, date and justification; residual risk level \"Critical\" is not acceptable.",
      "To NOTE that each member will complete individual NIS2 training (Art. 20(2)) by [ date ] and refresh it at least every three years.",
      "To formally ENACT the escalation chain and the 24/72/1M notification duties under Art. 23; annual exercise mandatory, once out-of-hours.",
      "To APPROVE the supplier-notice standard and the minimum clauses for ICT third-party contracts.",
      "To MANDATE the CISO to complete a first internal ISMS audit wave by [ date ] and to report results to the management body in the next quarter.",
    ]),

    callout(de
      ? "Bedeutung: Nach § 38 BSIG ist die Pflicht zur Billigung und Überwachung dieser Maßnahmen nicht abdingbar; persönliche Haftung des Leitungsorgans bei grober Vernachlässigung."
      : "Why this matters: under § 38 BSIG the duty to approve and oversee these measures is non-waivable; personal liability of the management body applies in case of gross neglect."),

    h1(de ? "Folgemaßnahmen" : "Follow-up actions"),
    dataTable(
      [de ? "Nr." : "No.", de ? "Folgemaßnahme" : "Follow-up action", de ? "Verantwortlich" : "Owner", de ? "Frist" : "Due"],
      [
        ["F-1", de ? "Benennung NIS2-Kontakt an BSI mitteilen" : "Notify NIS2 contact designation to BSI", roles.cisoName || "[ CISO ]", de ? "[ +14 Tage ]" : "[ +14 days ]"],
        ["F-2", de ? "Charter im Intranet veröffentlichen, Belegschaft informieren" : "Publish charter on intranet, inform workforce", de ? "[ Kommunikation ]" : "[ Communications ]", de ? "[ +30 Tage ]" : "[ +30 days ]"],
        ["F-3", de ? "Risikoakzeptanz-Register eröffnen / aktualisieren" : "Open / update risk-acceptance register", roles.cisoName || "[ CISO ]", de ? "[ +30 Tage ]" : "[ +30 days ]"],
        ["F-4", de ? "Lieferanten-Anschreiben an wesentliche Lieferanten versenden" : "Send supplier notice to material suppliers", de ? "[ Einkauf ]" : "[ Procurement ]", de ? "[ +60 Tage ]" : "[ +60 days ]"],
        ["F-5", de ? "Erste interne Audit-Welle abschließen" : "Complete first internal audit wave", de ? "[ Interne Revision ]" : "[ Internal Audit ]", de ? "[ +90 Tage ]" : "[ +90 days ]"],
        ["F-6", de ? "Bericht an nächstes Leitungsorgan-Quartal" : "Report to next management-body quarter", roles.cisoName || "[ CISO ]", "[ Q+1 ]"],
      ],
      [800, 4560, 2000, 2000]
    ),

    h1(de ? "Abstimmung" : "Vote"),
    dataTable(
      [de ? "Anwesend" : "Present", de ? "Ja" : "In favour", de ? "Nein" : "Against", de ? "Enthaltung" : "Abstain", de ? "Ergebnis" : "Outcome"],
      [["[ n ]", "[ n ]", "[ n ]", "[ n ]", de ? "[ Angenommen / Abgelehnt ]" : "[ Adopted / Rejected ]"]],
      [1800, 1800, 1800, 1800, 2160]
    ),

    h1(de ? "Unterschriften" : "Signatures"),
    dataTable(["", "", ""], [
      [roles.ceoName || "[ Name ]", roles.cfoName || "[ Name ]", roles.cisoName || "[ Name ]"],
      [de ? "CEO / Vorsitz" : "CEO / Chair", "CFO", "CISO / ISB"],
      [de ? "Unterschrift: ____________" : "Signature: ____________",
       de ? "Unterschrift: ____________" : "Signature: ____________",
       de ? "Unterschrift: ____________" : "Signature: ____________"],
    ], [3120, 3120, 3120]),
  ];

  return { doc: buildDocument(entityName, lang, docTitle, children), title: docTitle };
}

// 3. Risk Acceptance Statement
async function buildRiskAcceptance(ctx: BuildContext) {
  const { entityName, people, lang } = ctx;
  const de = lang === "de";
  const roles = derivePersonRoles(people);
  const docTitle = de ? "Risikoakzeptanz-Erklärung" : "Risk Acceptance Statement";

  const children: any[] = [
    ...titleBlock(docTitle,
      de ? "Bewusste Akzeptanz eines Restrisikos durch das Leitungsorgan" : "Conscious acceptance of a residual risk by the management body",
      entityName, lang),

    metaTable([
      metaRow(de ? "Akzeptanz-Nr." : "Acceptance no.", de ? "[ z. B. RA-2026-01 ]" : "[ e.g. RA-2026-01 ]"),
      metaRow(de ? "Datum" : "Date", de ? "[ Datum ]" : "[ date ]"),
      metaRow(de ? "Vorgeschlagen von" : "Proposed by", roles.cisoName || "[ CISO / ISB ]"),
      metaRow(de ? "Akzeptiert von (Mitglied Leitungsorgan)" : "Accepted by (management-body member)",
        de ? "[ Name — Mitglied Leitungsorgan ]" : "[ name — management-body member ]"),
      metaRow(de ? "Verantwortlich für Restrisiko" : "Residual risk owner", de ? "[ Name / Rolle ]" : "[ name / role ]"),
      metaRow(de ? "Gültig bis" : "Valid until", de ? "[ Datum — max. 12 Monate ]" : "[ date — max. 12 months ]"),
      metaRow(de ? "Rechtsgrundlage" : "Legal basis", "NIS2 Art. 21 · § 38 BSIG"),
    ]),

    h1(de ? "1. Beschreibung des Risikos" : "1. Risk description"),
    dataTable(
      [de ? "Feld" : "Field", de ? "Inhalt" : "Content"],
      [
        [de ? "Risiko-ID" : "Risk ID", "[ R-... ]"],
        [de ? "Bezeichnung" : "Title", de ? "[ kurze Bezeichnung des Risikos ]" : "[ short risk title ]"],
        [de ? "Betroffene Vermögenswerte / Dienste" : "Affected assets / services", de ? "[ Asset / Dienst ]" : "[ asset / service ]"],
        [de ? "Bedrohung & Schwachstelle" : "Threat & vulnerability", de ? "[ Beschreibung ]" : "[ description ]"],
        [de ? "Inhärentes Risiko (E × W)" : "Inherent risk (I × L)", de ? "[ z. B. 4 × 4 = 16 / Hoch ]" : "[ e.g. 4 × 4 = 16 / High ]"],
        [de ? "Bestehende Kontrollen" : "Existing controls", de ? "[ Liste ]" : "[ list ]"],
        [de ? "Restrisiko (E × W)" : "Residual risk (I × L)", de ? "[ z. B. 3 × 3 = 9 / Mittel ]" : "[ e.g. 3 × 3 = 9 / Medium ]"],
      ],
      [3000, 6360]
    ),

    h1(de ? "2. Warum wird die Behandlung NICHT umgesetzt?" : "2. Why treatment is NOT being implemented"),
    ...bullets(de ? [
      "Wirtschaftlich: Kosten der Behandlung übersteigen den potenziellen Schaden über [ Zeitraum ].",
      "Technisch: keine ausgereifte Lösung verfügbar; geplante Wiederbewertung bis [ Datum ].",
      "Operativ: Behandlung würde regulierten Dienst beeinträchtigen (Verfügbarkeitsverlust > [ % ]).",
      "Zeitlich: Behandlung ist im Roadmap-Schritt [ Phase ] bereits geplant — bis dahin akzeptiert.",
    ] : [
      "Economic: cost of treatment exceeds potential damage over [ period ].",
      "Technical: no mature solution available; planned re-assessment by [ date ].",
      "Operational: treatment would impair the regulated service (availability loss > [ % ]).",
      "Schedule: treatment is already planned in roadmap phase [ phase ] — accepted until then.",
    ]),
    p(de ? "Zutreffende Begründung(en) markieren und konkretisieren:" : "Mark applicable reason(s) and specify:"),
    p(de ? "[ Begründung ]" : "[ justification ]"),

    h1(de ? "3. Kompensierende Maßnahmen" : "3. Compensating controls"),
    ...bullets(de ? [
      "Monitoring: [ Detektion / Logquelle / Alarmschwelle ]",
      "Incident-Response-Bereitschaft: [ Runbook / Team / Trainingstand ]",
      "Versicherung / Risk-Transfer: [ Police / Deckung ]",
      "Vertragliche Klausel mit Lieferant: [ Klausel / Pönale ]",
    ] : [
      "Monitoring: [ detection / log source / alert threshold ]",
      "Incident-response readiness: [ runbook / team / training status ]",
      "Insurance / risk transfer: [ policy / coverage ]",
      "Contractual clause with supplier: [ clause / penalty ]",
    ]),

    h1(de ? "4. Wiedervorlage" : "4. Review trigger"),
    ...bullets(de ? [
      "Spätestens nach 12 Monaten erneute Bewertung.",
      "Vorzeitige Wiedervorlage bei: wesentlichem Vorfall, Änderung der Bedrohungslage, neuer Aufsichtsanforderung, Änderung des Restrisikos um ≥ 1 Stufe.",
    ] : [
      "Re-assessment at the latest after 12 months.",
      "Earlier review if: material incident, change in threat landscape, new regulatory requirement, residual risk shifts by ≥ 1 level.",
    ]),

    callout(de
      ? "Wichtig: Diese Akzeptanz hebt die Pflichten nach NIS2 Art. 21 nicht auf. Bei einem späteren Vorfall, der genau dieses Risiko realisiert, ist diese Erklärung Bestandteil der Aufsichtsdokumentation."
      : "Important: this acceptance does not waive NIS2 Art. 21 obligations. If an incident materialises this exact risk, this statement becomes part of the supervisory record."),

    h1(de ? "5. Laufende Überwachungspflichten" : "5. Ongoing monitoring obligations"),
    p(de
      ? "Solange diese Akzeptanz gilt, sind die folgenden Indikatoren zu überwachen. Überschreitet einer den Schwellwert, ist die Akzeptanz unverzüglich neu zu bewerten."
      : "While this acceptance is valid, the following indicators must be monitored. If any breaches its threshold, the acceptance must be re-assessed immediately."),
    dataTable(
      [de ? "Indikator" : "Indicator", de ? "Schwellwert" : "Threshold", de ? "Messung / Quelle" : "Measurement / source", de ? "Verantwortlich" : "Owner"],
      [
        [de ? "Anzahl Detektionen Bedrohung X" : "Detection count of threat X", "≥ [ n ] / " + (de ? "Monat" : "month"), de ? "SIEM-Report" : "SIEM report", roles.cisoName || "[ CISO ]"],
        [de ? "Veränderung Bedrohungslage (TLP-Warnung)" : "Threat-landscape change (TLP alert)", "TLP:AMBER+", de ? "BSI / Sektor-CSIRT" : "BSI / sector CSIRT", roles.cisoName || "[ CISO ]"],
        [de ? "Wirksamkeit kompensierender Kontrollen" : "Effectiveness of compensating controls", "≤ [ % ]", de ? "Audit / KPI" : "Audit / KPI", roles.cisoName || "[ CISO ]"],
        [de ? "Reaktionszeit (MTTR)" : "Response time (MTTR)", "> [ h ]", de ? "Ticketsystem" : "Ticket system", "[ SOC Lead ]"],
      ],
      [2800, 2000, 2560, 2000]
    ),

    h1(de ? "6. Vier-Augen-Prinzip & Eskalation" : "6. Four-eyes principle & escalation"),
    ...bullets(de ? [
      "Vorschlag durch CISO/ISB nach formalisierter Risikoanalyse — eigenständige Akzeptanz unzulässig.",
      "Vorprüfung durch CFO (Wirtschaftlichkeit) und Recht/DSB (Compliance / Datenschutz).",
      'Akzeptanz durch CEO bzw. Leitungsorgan — bei Restrisiko „Hoch" oder „Kritisch" zwingend Gesamt-Leitungsorgan.',
      'Ausnahme: Restrisiko-Stufe „Kritisch" ist grundsätzlich nicht akzeptabel; jede Ausnahme wird der Aufsichtsbehörde proaktiv mitgeteilt.',
    ] : [
      "Proposal by CISO/ISB after a formal risk analysis — self-acceptance not permitted.",
      "Pre-review by CFO (economics) and Legal/DPO (compliance / data protection).",
      "Acceptance by CEO or the management body — for residual risk \"High\" or \"Critical\" the full management body is mandatory.",
      "Exception: residual risk level \"Critical\" is in principle not acceptable; any exception is proactively notified to the supervisory authority.",
    ]),

    h1(de ? "7. Ablauf & Verlängerung" : "7. Expiry & renewal"),
    ...bullets(de ? [
      'Diese Akzeptanz erlischt automatisch zum Datum „Gültig bis" — keine stillschweigende Verlängerung.',
      "Eine Verlängerung verlangt eine neue Risikoanalyse und eine neue Akzeptanz-Erklärung mit neuer Nummer.",
      "Bei Auslaufen ohne neue Entscheidung tritt automatisch eine der Behandlungsstrategien (Mitigieren / Übertragen / Vermeiden) in Kraft.",
      "Status und Restlaufzeit werden in jedem Management Review (TOP 7) berichtet.",
    ] : [
      "This acceptance lapses automatically on the \"Valid until\" date — no tacit renewal.",
      "A renewal requires a new risk analysis and a new acceptance statement with a new number.",
      "On lapse without a new decision, one of the treatment strategies (mitigate / transfer / avoid) automatically applies.",
      "Status and remaining validity are reported in every Management Review (item 7).",
    ]),

    callout(de
      ? "Wichtig: Diese Akzeptanz hebt die Pflichten nach NIS2 Art. 21 nicht auf. Bei einem späteren Vorfall, der genau dieses Risiko realisiert, ist diese Erklärung Bestandteil der Aufsichtsdokumentation."
      : "Important: this acceptance does not waive NIS2 Art. 21 obligations. If an incident materialises this exact risk, this statement becomes part of the supervisory record."),

    h1(de ? "8. Genehmigung des Leitungsorgans" : "8. Management-body approval"),
    dataTable(
      [de ? "Rolle" : "Role", de ? "Name" : "Name", de ? "Datum / Unterschrift" : "Date / signature"],
      [
        [de ? "CEO / Vorsitz" : "CEO / Chair", roles.ceoName || (de ? "[ Name ]" : "[ name ]"), de ? "[ Datum / Unterschrift ]" : "[ date / signature ]"],
        ["CFO", roles.cfoName || (de ? "[ Name ]" : "[ name ]"), de ? "[ Datum / Unterschrift ]" : "[ date / signature ]"],
        ["CISO / ISB", roles.cisoName || (de ? "[ Name ]" : "[ name ]"), de ? "[ Datum / Unterschrift ]" : "[ date / signature ]"],
        [de ? "DPO (bei pers. Daten)" : "DPO (if personal data)", roles.dpoName || (de ? "[ Name ]" : "[ name ]"), de ? "[ Datum / Unterschrift ]" : "[ date / signature ]"],
      ],
      [2200, 3500, 3660]
    ),
  ];

  return { doc: buildDocument(entityName, lang, docTitle, children), title: docTitle };
}

// 4. ISMS Scope Statement
async function buildIsmsScope(ctx: BuildContext) {
  const { entityName, people, lang } = ctx;
  const de = lang === "de";
  const roles = derivePersonRoles(people);
  const docTitle = de ? "ISMS-Geltungsbereich (Scope-Statement)" : "ISMS Scope Statement";

  const children: any[] = [
    ...titleBlock(docTitle,
      de ? `Geltungsbereich des Informationssicherheits-Managementsystems — ${entityName}` : `Scope of the Information Security Management System — ${entityName}`,
      entityName, lang),

    metaTable([
      metaRow(de ? "Dokument" : "Document", docTitle),
      metaRow(de ? "Verantwortlich" : "Owner", roles.cisoName || "[ CISO / ISB ]"),
      metaRow(de ? "Version" : "Version", "[ x.y ]"),
      metaRow(de ? "Stand" : "As of", de ? "[ Datum ]" : "[ date ]"),
      metaRow(de ? "NIS2-Einstufung" : "NIS2 classification", de ? "[ wesentlich / wichtig ] · Sektor: [ … ]" : "[ essential / important ] · sector: [ … ]"),
      metaRow(de ? "Norm-Referenz" : "Standard reference", "ISO/IEC 27001:2022 §4.3 · NIS2 Art. 21"),
    ]),

    h1(de ? "1. Organisatorischer Geltungsbereich" : "1. Organisational scope"),
    p(de ? `Das ISMS umfasst die gesamte Organisation ${entityName} mit folgenden Einheiten:` : `The ISMS covers the entire organisation ${entityName} with the following units:`),
    ...bullets(de ? [
      "Hauptsitz: [ Stadt, Adresse ]",
      "Weitere Standorte: [ Liste ]",
      "Tochtergesellschaften im Geltungsbereich: [ Liste ]",
      "Ausgeschlossene Einheiten (mit Begründung): [ keine / Begründung ]",
    ] : [
      "Headquarters: [ city, address ]",
      "Other sites: [ list ]",
      "Subsidiaries in scope: [ list ]",
      "Excluded units (with justification): [ none / justification ]",
    ]),
    p(de
      ? "Abbildung NIS2-Art. 21(2)(a)–(j): die im Geltungsbereich umzusetzenden Maßnahmen werden in der Anwendbarkeitserklärung (SoA) je Kontrolle nachgewiesen."
      : "Mapping to NIS2 Art. 21(2)(a)–(j): the measures applicable in scope are evidenced per control in the Statement of Applicability (SoA)."),

    h1(de ? "2. Geschäftsprozesse & regulierte Dienste" : "2. Business processes & regulated services"),
    dataTable(
      [de ? "Dienst / Prozess" : "Service / process", de ? "Sektor (NIS2)" : "Sector (NIS2)", de ? "Kritikalität" : "Criticality"],
      de ? [
        ["[ Dienst 1 ]", "[ z. B. Gesundheit — Anhang I ]", "[ Hoch / Mittel / Niedrig ]"],
        ["[ Dienst 2 ]", "[ Sektor ]", "[ Stufe ]"],
        ["[ Dienst 3 ]", "[ Sektor ]", "[ Stufe ]"],
      ] : [
        ["[ service 1 ]", "[ e.g. Health — Annex I ]", "[ high / medium / low ]"],
        ["[ service 2 ]", "[ sector ]", "[ level ]"],
        ["[ service 3 ]", "[ sector ]", "[ level ]"],
      ],
      [3500, 3000, 2860]
    ),

    h1(de ? "3. Technologischer Geltungsbereich" : "3. Technology scope"),
    ...bullets(de ? [
      "IT-Systeme: [ ERP, CRM, Mailing, … ]",
      "OT/ICS-Systeme: [ SCADA, PLCs, … ]",
      "Cloud-Dienste: [ Anbieter / Workloads ]",
      "Mobilgeräte & Endpoints: [ Anzahl / Plattformen ]",
      "Netzwerk: [ Standorte, Standleitungen, VPN ]",
    ] : [
      "IT systems: [ ERP, CRM, mail, … ]",
      "OT/ICS systems: [ SCADA, PLCs, … ]",
      "Cloud services: [ provider / workloads ]",
      "Mobile & endpoints: [ count / platforms ]",
      "Network: [ sites, leased lines, VPN ]",
    ]),

    h1(de ? "4. Datenkategorien" : "4. Data categories"),
    ...bullets(de ? [
      "Personenbezogene Daten (DSGVO): [ Kategorien ]",
      "Besondere Kategorien personenbezogener Daten: [ z. B. Gesundheitsdaten ]",
      "Geschäftsgeheimnisse / IP: [ Beschreibung ]",
      "Betriebsdaten (OT-Sensoren, Telemetrie): [ Beschreibung ]",
    ] : [
      "Personal data (GDPR): [ categories ]",
      "Special-category personal data: [ e.g. health data ]",
      "Trade secrets / IP: [ description ]",
      "Operational data (OT sensors, telemetry): [ description ]",
    ]),

    h1(de ? "5. Schnittstellen & Abhängigkeiten" : "5. Interfaces & dependencies"),
    ...bullets(de ? [
      "Wesentliche Lieferanten / IKT-Drittparteien: [ Liste ]",
      "Behördliche Schnittstellen: [ BSI, Datenschutzbehörde, Sektor-CSIRT ]",
      "Konzern-/Mutterunternehmen IT-Schnittstellen: [ falls relevant ]",
    ] : [
      "Material suppliers / ICT third parties: [ list ]",
      "Authority interfaces: [ BSI, DPA, sector CSIRT ]",
      "Group / parent-company IT interfaces: [ if applicable ]",
    ]),

    h1(de ? "6. Ausschlüsse" : "6. Exclusions"),
    p(de
      ? "Folgende Bereiche sind aus dem ISMS-Geltungsbereich ausgeschlossen — mit Begründung, warum kein Risiko für regulierte Dienste entsteht:"
      : "The following areas are excluded from the ISMS scope — with justification why no risk to regulated services arises:"),
    dataTable(
      [de ? "Ausschluss" : "Exclusion", de ? "Begründung" : "Justification"],
      de ? [
        ["[ Bereich / System ]", "[ Begründung ]"],
        ["[ Bereich / System ]", "[ Begründung ]"],
      ] : [
        ["[ area / system ]", "[ justification ]"],
        ["[ area / system ]", "[ justification ]"],
      ],
      [3500, 5860]
    ),

    h1(de ? "7. Interessierte Parteien (ISO 27001 §4.2)" : "7. Interested parties (ISO 27001 §4.2)"),
    dataTable(
      [de ? "Interessierte Partei" : "Interested party", de ? "Anforderung / Erwartung" : "Requirement / expectation"],
      [
        [de ? "Aufsichtsbehörde (BSI)" : "Supervisory authority (BSI)", de ? "Einhaltung NIS2 / BSIG, fristgerechte Meldungen, Nachweisbarkeit" : "NIS2 / BSIG compliance, timely notifications, evidence"],
        [de ? "Datenschutzbehörde" : "Data protection authority", de ? "DSGVO, 72h-Meldepflicht, TOMs" : "GDPR, 72h notification, TOMs"],
        [de ? "Kunden / Patienten" : "Customers / patients", de ? "Vertraulichkeit, Verfügbarkeit, Datenintegrität" : "Confidentiality, availability, data integrity"],
        [de ? "Belegschaft & Personalvertretung" : "Workforce & works council", de ? "Sichere Arbeitsumgebung, Trainings, Mitbestimmung" : "Safe work environment, training, co-determination"],
        [de ? "Eigentümer / Konzern" : "Owners / group", de ? "Risikotransparenz, Reputationsschutz, ROI Cyber" : "Risk transparency, reputation, cyber ROI"],
        [de ? "Wesentliche Lieferanten / IKT-Drittparteien" : "Material suppliers / ICT third parties", de ? "Klare Sicherheitsanforderungen, Vorhersehbarkeit" : "Clear security requirements, predictability"],
        [de ? "Versicherer" : "Insurer", de ? "Nachweisbare Kontrollen, Schadenminderung" : "Demonstrable controls, loss mitigation"],
        [de ? "Sektor-CSIRT / Branche" : "Sector CSIRT / industry", de ? "Lageaustausch, koordinierte Reaktion" : "Threat sharing, coordinated response"],
      ],
      [3500, 5860]
    ),

    h1(de ? "8. Änderungs- & Versionskontrolle" : "8. Change & version control"),
    p(de
      ? "Geltungsbereichsänderungen (neue Standorte/Tochtergesellschaften, neue Dienste, neue OT-Umgebungen, neue Lieferanten mit Datenzugang) lösen eine außerordentliche Überprüfung dieses Statements aus. Mindestens jährliche Überprüfung im Management Review."
      : "Scope changes (new sites/subsidiaries, new services, new OT environments, new suppliers with data access) trigger an extraordinary review of this statement. Minimum annual review in the Management Review."),
    dataTable(
      [de ? "Version" : "Version", de ? "Datum" : "Date", de ? "Änderung" : "Change", de ? "Auslöser" : "Trigger", de ? "Freigabe" : "Approved by"],
      [
        ["1.0", new Date().toLocaleDateString(de ? "de-DE" : "en-GB"), de ? "Erstausgabe" : "Initial issue", de ? "ISMS-Implementierung" : "ISMS implementation", roles.ceoName || "[ CEO ]"],
        ["[ x.y ]", de ? "[ Datum ]" : "[ date ]", de ? "[ Änderung ]" : "[ change ]", de ? "[ Auslöser ]" : "[ trigger ]", de ? "[ Name ]" : "[ name ]"],
      ],
      [1200, 1600, 3000, 2160, 1400]
    ),

    h1(de ? "9. Freigabe" : "9. Approval"),
    dataTable([""],
      [
        [roles.ceoName || "[ CEO / Vorsitz ]"],
        [roles.cisoName || "[ CISO / ISB ]"],
        [de ? "Datum / Unterschrift: ____________" : "Date / signature: ____________"],
      ],
      [9360]
    ),
  ];

  return { doc: buildDocument(entityName, lang, docTitle, children), title: docTitle };
}

// 5. Management Review — quarterly board minutes template (with 4 example quarters)
async function buildManagementReview(ctx: BuildContext) {
  const { entityName, people, lang } = ctx;
  const de = lang === "de";
  const roles = derivePersonRoles(people);
  const docTitle = de ? "Management Review — Quartalsprotokoll" : "Management Review — Quarterly Minutes";

  const year = new Date().getFullYear();
  const quarters = de
    ? [`Q1 ${year}`, `Q2 ${year}`, `Q3 ${year}`, `Q4 ${year}`]
    : [`Q1 ${year}`, `Q2 ${year}`, `Q3 ${year}`, `Q4 ${year}`];

  const quarterBlock = (label: string) => [
    h2(label),
    metaTable([
      metaRow(de ? "Datum / Uhrzeit" : "Date / time", de ? "[ Datum, Uhrzeit ]" : "[ date, time ]"),
      metaRow(de ? "Vorsitz" : "Chair", roles.ceoName || (de ? "[ Name ]" : "[ name ]")),
      metaRow(de ? "Anwesende Mitglieder" : "Members present", de ? "[ Liste — eine Zeile je Mitglied ]" : "[ list — one row per member ]"),
      metaRow(de ? "Berichterstatter" : "Reporter", roles.cisoName || "[ CISO / ISB ]"),
      metaRow(de ? "Beschlussfähigkeit erreicht" : "Quorum met", de ? "[ ja / nein ]" : "[ yes / no ]"),
    ]),

    h2(de ? "TOP 1 — Top-Risiken & Heatmap" : "Item 1 — Top risks & heatmap"),
    p(de ? "Bericht des CISO zu den Top-5-Risiken (Inhärent vs. Restrisiko)." : "CISO report on top-5 risks (inherent vs residual)."),
    dataTable(
      [de ? "Rang" : "Rank", de ? "Risiko" : "Risk", de ? "Inhärent" : "Inherent", de ? "Restrisiko" : "Residual", de ? "Trend" : "Trend"],
      de ? [
        ["1", "[ Risiko ]", "[ Stufe ]", "[ Stufe ]", "[ ↑ → ↓ ]"],
        ["2", "[ Risiko ]", "[ Stufe ]", "[ Stufe ]", "[ ↑ → ↓ ]"],
        ["3", "[ Risiko ]", "[ Stufe ]", "[ Stufe ]", "[ ↑ → ↓ ]"],
        ["4", "[ Risiko ]", "[ Stufe ]", "[ Stufe ]", "[ ↑ → ↓ ]"],
        ["5", "[ Risiko ]", "[ Stufe ]", "[ Stufe ]", "[ ↑ → ↓ ]"],
      ] : [
        ["1", "[ risk ]", "[ level ]", "[ level ]", "[ ↑ → ↓ ]"],
        ["2", "[ risk ]", "[ level ]", "[ level ]", "[ ↑ → ↓ ]"],
        ["3", "[ risk ]", "[ level ]", "[ level ]", "[ ↑ → ↓ ]"],
        ["4", "[ risk ]", "[ level ]", "[ level ]", "[ ↑ → ↓ ]"],
        ["5", "[ risk ]", "[ level ]", "[ level ]", "[ ↑ → ↓ ]"],
      ],
      [800, 4060, 1500, 1500, 1500]
    ),

    h2(de ? "TOP 2 — Vorfälle & Beinahe-Vorfälle" : "Item 2 — Incidents & near-misses"),
    p(de ? "Anzahl, Schweregrad, Meldefristen (24h/72h/1M), Root-Cause-Status." : "Count, severity, reporting deadlines (24h/72h/1M), root-cause status."),
    ...bullets(de ? [
      "Vorfälle gesamt: [ n ] (davon meldepflichtig: [ n ])",
      "24h-Frühwarnungen fristgerecht: [ n / n ]",
      "72h-Vorfallsmeldungen fristgerecht: [ n / n ]",
      "Abschlussberichte (1 Monat) fristgerecht: [ n / n ]",
      "Beinahe-Vorfälle (intern): [ n ] — Lessons learned: [ Zusammenfassung ]",
    ] : [
      "Incidents total: [ n ] (notifiable: [ n ])",
      "24h early warnings on time: [ n / n ]",
      "72h incident notifications on time: [ n / n ]",
      "Final reports (1 month) on time: [ n / n ]",
      "Near-misses (internal): [ n ] — lessons learned: [ summary ]",
    ]),

    h2(de ? "TOP 3 — Programmstatus & KPIs" : "Item 3 — Programme status & KPIs"),
    dataTable(
      [de ? "KPI" : "KPI", de ? "Ziel" : "Target", de ? "Ist" : "Actual", "Δ"],
      [
        [de ? "Compliance-Rate (SoA)" : "Compliance rate (SoA)", "≥ 90 %", "[ % ]", "[ Δ ]"],
        [de ? "Reifegrad (Ø)" : "Maturity (avg.)", "≥ 3,5", "[ x.x ]", "[ Δ ]"],
        [de ? "Offene Hochrisiken" : "Open high risks", "0", "[ n ]", "[ Δ ]"],
        [de ? "Überfällige Maßnahmen" : "Overdue actions", "0", "[ n ]", "[ Δ ]"],
        [de ? "Schulungsabdeckung" : "Training coverage", "≥ 95 %", "[ % ]", "[ Δ ]"],
      ],
      [4060, 1500, 2000, 1800]
    ),

    h2(de ? "TOP 4 — Lieferanten / Drittparteien" : "Item 4 — Suppliers / third parties"),
    ...bullets(de ? [
      "Neue/abgegangene wesentliche Lieferanten: [ Liste ]",
      "Offene Lieferantenrisiken: [ Liste ]",
      "Re-Assessments im Quartal: [ n ]",
    ] : [
      "New/exited material suppliers: [ list ]",
      "Open supplier risks: [ list ]",
      "Re-assessments this quarter: [ n ]",
    ]),

    h2(de ? "TOP 5 — Aufsicht & Audit" : "Item 5 — Supervision & audit"),
    ...bullets(de ? [
      de ? "Behördenkontakt im Quartal: [ ja / nein — Vorgang ]" : "Authority contact this quarter: [ yes / no — case ]",
      "Interne Audits abgeschlossen: [ n ] — Findings: [ n ]",
      "Externe Audits / Zertifizierungsstand: [ Status ]",
    ] : [
      "Authority contact this quarter: [ yes / no — case ]",
      "Internal audits completed: [ n ] — findings: [ n ]",
      "External audits / certification status: [ status ]",
    ]),

    h2(de ? "TOP 6 — Beschlüsse" : "Item 6 — Decisions"),
    dataTable(
      [de ? "Nr." : "No.", de ? "Beschluss" : "Decision", de ? "Verantwortlich" : "Owner", de ? "Frist" : "Due"],
      de ? [
        ["1", "[ Beschluss ]", "[ Name ]", "[ Datum ]"],
        ["2", "[ Beschluss ]", "[ Name ]", "[ Datum ]"],
        ["3", "[ Beschluss ]", "[ Name ]", "[ Datum ]"],
      ] : [
        ["1", "[ decision ]", "[ name ]", "[ date ]"],
        ["2", "[ decision ]", "[ name ]", "[ date ]"],
        ["3", "[ decision ]", "[ name ]", "[ date ]"],
      ],
      [600, 4760, 2000, 2000]
    ),

    h2(de ? "TOP 7 — Restrisikoakzeptanzen" : "Item 7 — Risk acceptances"),
    p(de ? "Verweis auf Risikoakzeptanz-Register. Diese Sitzung hat akzeptiert:" : "Reference to risk-acceptance register. This meeting accepted:"),
    ...bullets(de ? [
      "[ RA-... ] — [ Bezeichnung ] (siehe separate Akzeptanz-Erklärung)",
    ] : [
      "[ RA-... ] — [ title ] (see separate acceptance statement)",
    ]),

    h2(de ? "TOP 8 — Aktionsverfolgung aus Vorquartal" : "Item 8 — Action tracking from previous quarter"),
    dataTable(
      [de ? "Nr." : "No.", de ? "Aktion" : "Action", de ? "Owner" : "Owner", de ? "Fällig" : "Due", de ? "Status" : "Status"],
      de ? [
        ["[ A-01 ]", "[ Aktion aus Vorquartal ]", "[ Name ]", "[ Datum ]", "[ offen / laufend / erledigt / verschoben ]"],
        ["[ A-02 ]", "[ Aktion ]", "[ Name ]", "[ Datum ]", "[ … ]"],
        ["[ A-03 ]", "[ Aktion ]", "[ Name ]", "[ Datum ]", "[ … ]"],
      ] : [
        ["[ A-01 ]", "[ action from previous quarter ]", "[ name ]", "[ date ]", "[ open / in progress / done / deferred ]"],
        ["[ A-02 ]", "[ action ]", "[ name ]", "[ date ]", "[ … ]"],
        ["[ A-03 ]", "[ action ]", "[ name ]", "[ date ]", "[ … ]"],
      ],
      [800, 4060, 1800, 1500, 1200]
    ),

    h2(de ? "TOP 9 — Kontinuierliche Verbesserung (KVP / PDCA)" : "Item 9 — Continual improvement (PDCA)"),
    ...bullets(de ? [
      "Signale aus Audits, Vorfällen und KPIs zusammengeführt — [ n ] Verbesserungsideen.",
      "Davon angenommen: [ n ] — übergeben an Roadmap-Phase [ Now / Next / Later ].",
      "Abgelehnt mit Begründung: [ n ] — siehe KVP-Register.",
      "Wirksamkeit umgesetzter Maßnahmen geprüft (Vorquartal): [ Ergebnis ].",
    ] : [
      "Signals from audits, incidents and KPIs consolidated — [ n ] improvement ideas.",
      "Of which accepted: [ n ] — handed to roadmap phase [ Now / Next / Later ].",
      "Rejected with reason: [ n ] — see KVP / CIP register.",
      "Effectiveness of previously implemented measures reviewed: [ outcome ].",
    ]),

    h2(de ? "TOP 10 — Sonstiges & nächste Sitzung" : "Item 10 — AOB & next meeting"),
    p(de ? "Nächste reguläre Sitzung: [ Datum ]. Außerordentliche Einberufung bei: kritischem Vorfall, Behördenanfrage, ≥ 1 Stufe Risikoanstieg." : "Next regular meeting: [ date ]. Extraordinary convening on: critical incident, authority request, ≥ 1 risk-level rise."),

    space(200),
    dataTable(["", ""], [
      [roles.ceoName || "[ Vorsitz ]", roles.cisoName || "[ Protokoll ]"],
      [de ? "Vorsitz · Datum / Unterschrift" : "Chair · date / signature",
       de ? "Protokoll · Datum / Unterschrift" : "Minutes · date / signature"],
    ], [4680, 4680]),
  ];

  const children: any[] = [
    ...titleBlock(docTitle,
      de ? `Vierteljährliche Cyber-Sitzungen des Leitungsorgans — Musterprotokoll ${year}` : `Quarterly cyber meetings of the management body — minute template ${year}`,
      entityName, lang),

    callout(de
      ? "Vorlage: Jede der vier Sitzungen folgt der gleichen Struktur (TOP 1–10). Trage je Sitzung die tatsächlichen Inhalte ein — die Struktur befriedigt die Berichts- und Überwachungspflicht aus NIS2 Art. 20."
      : "Template: each of the four meetings follows the same structure (Items 1–10). Fill in the actual contents per meeting — the structure satisfies the reporting and oversight duty under NIS2 Art. 20."),

    ...quarters.flatMap((q, i) => [
      i > 0 ? new Paragraph({ children: [new PageBreak()] }) : space(),
      ...quarterBlock(q),
    ]),
  ];

  return { doc: buildDocument(entityName, lang, docTitle, children), title: docTitle };
}

// 6. NIS2 Contact registration
async function buildNis2Contact(ctx: BuildContext) {
  const { entityName, people, lang } = ctx;
  const de = lang === "de";
  const roles = derivePersonRoles(people);
  const docTitle = de ? "NIS2-Registrierungsdaten — Meldekontakt (Art. 3(4) NIS2 / §§ 28, 33 BSIG)" : "NIS2 Registration Data — Notification Contact (Art. 3(4) NIS2 / §§ 28, 33 BSIG)";

  const children: any[] = [
    ...titleBlock(docTitle,
      de
        ? `Übermittlung der Registrierungsdaten und Benennung des Meldekontakts gemäß NIS2 Art. 3(4) i. V. m. § 28 BSIG sowie Vorfallmeldungen nach § 33 BSIG / Art. 23 NIS2 — ${entityName}`
        : `Submission of registration data and designation of the notification contact under NIS2 Art. 3(4) read with § 28 BSIG, and incident notifications under § 33 BSIG / NIS2 Art. 23 — ${entityName}`,
      entityName, lang),

    p(de ? "An: Zuständige nationale Behörde / CSIRT" : "To: Competent national authority / CSIRT"),
    p("[ BSI · Godesberger Allee 185–189 · 53175 Bonn ]"),
    space(),

    h1(de ? "Benennung" : "Designation"),
    p(de
      ? `Hiermit übermittelt ${entityName} die Registrierungsdaten nach NIS2 Art. 3(4) i. V. m. § 28 BSIG und benennt die folgenden Personen als Kontaktstellen für Vorfallmeldungen nach NIS2 Art. 23 / § 33 BSIG:`
      : `${entityName} hereby submits its registration data under NIS2 Art. 3(4) read with § 28 BSIG and designates the following persons as contact points for incident notifications under NIS2 Art. 23 / § 33 BSIG:`),

    dataTable(
      [de ? "Funktion" : "Function", de ? "Name" : "Name", de ? "E-Mail / Telefon" : "E-mail / phone"],
      [
        [de ? "Primärkontakt (CISO / ISB)" : "Primary contact (CISO / ISB)", roles.cisoName || (de ? "[ Name ]" : "[ name ]"), de ? "[ E-Mail / +49 ... ]" : "[ email / +49 ... ]"],
        [de ? "Stellvertretung" : "Deputy", roles.deputyName || (de ? "[ Name ]" : "[ name ]"), de ? "[ E-Mail / +49 ... ]" : "[ email / +49 ... ]"],
        [de ? "24/7-Eskalation (SOC)" : "24/7 escalation (SOC)", de ? "[ SOC-Hotline ]" : "[ SOC hotline ]", "[ +49 ... ]"],
      ],
      [3000, 3360, 3000]
    ),

    h1(de ? "Registrierungsdaten nach Art. 3(4) NIS2 — (a)–(e)" : "Registration data under Art. 3(4) NIS2 — (a)–(e)"),
    metaTable([
      metaRow(de ? "(a) Name der Einrichtung" : "(a) Name of the entity", entityName),
      metaRow(de ? "(a) Rechtsform / Handelsregister" : "(a) Legal form / commercial register",
        de ? "[ z. B. GmbH · Amtsgericht ... · HRB ... ]" : "[ e.g. GmbH · local court ... · HRB ... ]"),
      metaRow(de ? "(b) Sitz / Anschrift" : "(b) Registered office / address",
        de ? "[ Straße, PLZ Ort ]" : "[ street, postcode, city ]"),
      metaRow(de ? "(b) Niederlassungen / Standorte" : "(b) Establishments / sites",
        de ? "[ Liste der Standorte mit Land ]" : "[ list of sites with country ]"),
      metaRow(de ? "(b) Sektor (NIS2 Anhang I / II)" : "(b) Sector (NIS2 Annex I / II)",
        de ? "[ z. B. Gesundheit — Anhang I ]" : "[ e.g. Health — Annex I ]"),
      metaRow(de ? "(b) Einstufung" : "(b) Classification",
        de ? "[ wesentlich / wichtig ]" : "[ essential / important ]"),
      metaRow(de ? "(c) Aktuelle Kontaktdaten (E-Mail / Telefon)" : "(c) Current contact details (email / phone)",
        de ? "[ allgemeine E-Mail / Telefon ]" : "[ general email / phone ]"),
      metaRow(de ? "(d) Mitgliedstaaten, in denen Dienste erbracht werden" : "(d) Member states where services are provided",
        de ? "[ z. B. DE, AT, CH ]" : "[ e.g. DE, AT, CH ]"),
      metaRow(de ? "(e) IP-Adressbereiche" : "(e) IP address ranges",
        de ? "[ öffentliche IP-Bereiche, CIDR — falls zutreffend ]" : "[ public IP ranges, CIDR — where applicable ]"),
      metaRow(de ? "Beschäftigte" : "Employees", de ? "[ Anzahl ]" : "[ number ]"),
      metaRow(de ? "Jahresumsatz" : "Annual turnover", de ? "[ in Mio. EUR ]" : "[ in EUR million ]"),
    ]),

    h1(de ? "Registrierungsdaten beim BSI / Sektor-CSIRT" : "Registration data with BSI / sector CSIRT"),
    metaTable([
      metaRow(de ? "NIS2-Registrierungs-ID" : "NIS2 registration ID",
        de ? "[ wird durch die Behörde vergeben ]" : "[ assigned by the authority ]"),
      metaRow(de ? "Sektor-CSIRT" : "Sector CSIRT",
        de ? "[ z. B. UP KRITIS, Sektor-CSIRT, ... ]" : "[ e.g. UP KRITIS, sector CSIRT, ... ]"),
      metaRow(de ? "Bevorzugter Meldekanal" : "Preferred notification channel", de ? "BSI-Meldeportal (primär) · E-Mail (sekundär) · Telefon (Eskalation)" : "BSI portal (primary) · email (secondary) · phone (escalation)"),
      metaRow(de ? "Verschlüsselung" : "Encryption",
        de ? "PGP / S/MIME — [ Schlüssel-ID ]" : "PGP / S/MIME — [ key ID ]"),
      metaRow(de ? "Sprache der Kommunikation" : "Communication language", de ? "Deutsch (primär) · Englisch" : "German (primary) · English"),
    ]),

    h1(de ? "Verfügbarkeit & Erreichbarkeit" : "Availability & reach"),
    p(de
      ? "Die genannten Kontakte sind 24/7 erreichbar. Die Erreichbarkeit wird jährlich unangekündigt geprüft. Änderungen werden unverzüglich, spätestens binnen 14 Tagen, der zuständigen Behörde mitgeteilt."
      : "The named contacts are reachable 24/7. Reachability is tested annually without notice. Changes will be notified to the competent authority without delay, at the latest within 14 days."),

    h1(de ? "Nachfolgeregelung" : "Succession procedure"),
    ...ordered(de ? [
      "Beim Ausscheiden eines Kontakts: Meldung an das BSI binnen 14 Tagen mit Nachfolger und Ablösedatum.",
      "Übergabe der laufenden Vorgänge dokumentiert; Risikoregister und Vorfall-Tickets werden persönlich übertragen.",
      'Vom Ausscheiden des Primärkontakts bis zur Benennung und Meldung eines neuen Primärkontakts handelt die Stellvertretung automatisch als verbindlicher Primärkontakt — eine behördliche „Bestätigung" ist hierfür nicht vorgesehen.',
      "Wechsel werden im Management Review (TOP Aufsicht & Audit) protokolliert.",
    ] : [
      "When a contact leaves: notify BSI within 14 days, naming the successor and effective date.",
      "Open cases handed over with documentation; risk register and incident tickets are transferred personally.",
      "From the moment the primary leaves until a new primary is designated and notified, the deputy automatically acts as the binding primary contact — no authority \"confirmation\" is required.",
      "Changes are recorded in the Management Review (item Supervision & Audit).",
    ]),

    h1(de ? "Anlagen" : "Annexes"),
    ...bullets(de ? [
      "Anlage 1 — Handelsregisterauszug",
      "Anlage 2 — Vollmacht des Leitungsorgans (Beschluss BR-…)",
      "Anlage 3 — Erreichbarkeitsmatrix inkl. Bereitschaftsplan",
      "Anlage 4 — PGP-Schlüssel der benannten Kontakte",
    ] : [
      "Annex 1 — Commercial register extract",
      "Annex 2 — Power of attorney from the management body (Resolution BR-…)",
      "Annex 3 — Reachability matrix incl. on-call roster",
      "Annex 4 — PGP keys of the designated contacts",
    ]),

    space(200),
    p(de ? "[ Name, vertretungsberechtigtes Mitglied des Leitungsorgans ]" : "[ name, authorised representative of the management body ]"),
    p(de ? "Datum / Unterschrift: ____________" : "Date / signature: ____________"),
  ];

  return { doc: buildDocument(entityName, lang, docTitle, children), title: docTitle };
}

// 7. Board Training Attestation
async function buildTrainingAttestation(ctx: BuildContext) {
  const { entityName, people, lang } = ctx;
  const de = lang === "de";
  const roles = derivePersonRoles(people);
  const board = people.filter((p) => titleMatches(p, boardPatterns));
  const docTitle = de ? "Schulungsbestätigung Leitungsorgan (Art. 20(2))" : "Board Training Attestation (Art. 20(2))";

  const children: any[] = [
    ...titleBlock(docTitle,
      de ? "Nachweis ausreichender Kenntnisse & Fähigkeiten der Leitungsorgan-Mitglieder" : "Evidence of sufficient knowledge & skills of management-body members",
      entityName, lang),

    callout(de
      ? "Nach Art. 20(2) NIS2 müssen Mitglieder des Leitungsorgans regelmäßig Schulungen absolvieren, um ausreichende Kenntnisse und Fähigkeiten zur Erfassung und Bewertung von Cybersicherheitsrisiken zu erlangen. Dieser Nachweis ist personenbezogen zu führen."
      : "Under Art. 20(2) NIS2 management-body members must undertake training periodically to gain sufficient knowledge and skills to identify and assess cybersecurity risks. Evidence must be kept per person."),

    h1(de ? "Schulungsinhalt (Mindeststandard)" : "Training content (minimum standard)"),
    ...bullets(de ? [
      "NIS2-Pflichten des Leitungsorgans (Art. 20/21/23) und Haftung nach § 38 BSIG",
      "Risikoverständnis: Inhärentes vs. Restrisiko, Heatmap-Lesen, Akzeptanzentscheidungen",
      "Vorfallmanagement: 24h/72h/1-Monats-Meldefristen, Eskalationsketten",
      "Lieferketten- & Drittparteienrisiko",
      "Geschäftskontinuität & Wiederanlauf",
      "Berichtswesen an das Leitungsorgan und Kommunikation mit Aufsicht",
    ] : [
      "NIS2 management-body duties (Art. 20/21/23) and liability under § 38 BSIG",
      "Risk literacy: inherent vs residual risk, reading a heatmap, acceptance decisions",
      "Incident management: 24h/72h/1-month notification deadlines, escalation chains",
      "Supply-chain & third-party risk",
      "Business continuity & recovery",
      "Reporting to the management body and communication with the authority",
    ]),

    h1(de ? "Curriculum & Stundenumfang" : "Curriculum & training hours"),
    dataTable(
      [de ? "Modul" : "Module", de ? "Inhalt" : "Content", de ? "Dauer" : "Duration", de ? "Methode" : "Method"],
      [
        ["M1", de ? "NIS2-Grundlagen, Art. 20/21/23, § 38 BSIG, Haftung" : "NIS2 fundamentals, Art. 20/21/23, § 38 BSIG, liability", "90 min", de ? "Präsenz / Webinar" : "In-class / webinar"],
        ["M2", de ? "Risikomanagement-Vokabular: Inhärent vs. Restrisiko, Heatmap-Lesen" : "Risk-management vocabulary: inherent vs residual, reading a heatmap", "60 min", de ? "Workshop mit Beispielen" : "Workshop with examples"],
        ["M3", de ? "Vorfallmanagement: 24h/72h/1M-Meldefristen, Eskalation, Krisenstab" : "Incident management: 24h/72h/1M deadlines, escalation, crisis team", "90 min", de ? "Tabletop-Übung" : "Tabletop exercise"],
        ["M4", de ? "Lieferkette & Drittparteienrisiko" : "Supply chain & third-party risk", "45 min", de ? "Fallstudie" : "Case study"],
        ["M5", de ? "Geschäftskontinuität, Wiederanlauf (BCM/DR)" : "Business continuity, recovery (BCM/DR)", "45 min", de ? "Diskussion" : "Discussion"],
        ["M6", de ? "Berichtswesen Leitungsorgan, Aufsichtskommunikation" : "Board reporting, supervisory communication", "60 min", de ? "Rollenspiel" : "Role play"],
        [de ? "Gesamt" : "Total", "—", "≥ 6 h", "—"],
      ],
      [1100, 4360, 1400, 2500]
    ),

    h1(de ? "Lernzielkontrolle & Bestehensgrenze" : "Assessment & passing threshold"),
    ...bullets(de ? [
      "Schriftlicher Test (20 Fragen, Multiple Choice) — Bestehensgrenze 70 %.",
      "Tabletop-Auswertung: jeder Teilnehmer dokumentiert eine eigene Entscheidung in einem fiktiven Vorfall.",
      "Wiederholung bei Nichtbestehen innerhalb von 30 Tagen, sonst Bericht an das Leitungsorgan.",
    ] : [
      "Written test (20 questions, multiple choice) — passing threshold 70 %.",
      "Tabletop debrief: each participant documents one own decision in a fictional incident.",
      "Retake within 30 days on failure, otherwise report to the management body.",
    ]),

    h1(de ? "Schulungsanbieter & Zertifikat" : "Training provider & certificate"),
    metaTable([
      metaRow(de ? "Anbieter" : "Provider", de ? "[ Anbieter, Trainer & Qualifikation ]" : "[ provider, trainer & credentials ]"),
      metaRow(de ? "Zertifikat-Nr." : "Certificate no.", de ? "[ je Teilnehmer ]" : "[ per participant ]"),
      metaRow(de ? "Ausstellungsdatum" : "Issue date", de ? "[ Datum ]" : "[ date ]"),
      metaRow(de ? "Gültigkeit" : "Validity", de ? "3 Jahre" : "3 years"),
      metaRow(de ? "Archivierungsort" : "Archive location", de ? "Personalakte + ISMS-Dokumentation" : "Personnel file + ISMS documentation"),
    ]),

    h1(de ? "Personenbezogener Nachweis" : "Per-person record"),
    dataTable(
      [de ? "Mitglied" : "Member", de ? "Rolle" : "Role", de ? "Module" : "Modules",
       de ? "Schulung am" : "Trained on", de ? "Ergebnis (≥ 70 %)" : "Result (≥ 70 %)",
       de ? "Auffrischung bis" : "Refresh by", de ? "Unterschrift Teilnehmer" : "Member signature"],
      (board.length > 0 ? board : [{ name: de ? "[ Name ]" : "[ name ]", title: de ? "[ Rolle ]" : "[ role ]" } as Person])
        .map((p) => [p.name, p.title, "M1–M6",
          de ? "[ Datum ]" : "[ date ]",
          de ? "[ Punkte /20 — bestanden / nicht bestanden ]" : "[ score /20 — pass / fail ]",
          de ? "[ Datum + 3 J. ]" : "[ date + 3 yrs ]",
          de ? "[ Datum / Unterschrift ]" : "[ date / signature ]"]),
      [1600, 1300, 800, 1200, 1860, 1300, 1300]
    ),

    h1(de ? "Auffrischungsplan" : "Refresh schedule"),
    ...bullets(de ? [
      "Vollständige Wiederholung aller Module spätestens alle 3 Jahre.",
      "Jährliches Kurz-Update (60 min): aktuelle Bedrohungslage, neue BSI-Lageberichte, Lessons learned aus eigenen Vorfällen.",
      "Anlassbezogene Auffrischung bei: gesetzlichen Änderungen, Sektor-CSIRT-Warnungen TLP:RED, materiellen Vorfällen.",
    ] : [
      "Full re-run of all modules at the latest every 3 years.",
      "Annual short update (60 min): current threat landscape, latest BSI situational reports, lessons learned from own incidents.",
      "Trigger-based refresh on: legal changes, sector-CSIRT TLP:RED warnings, material incidents.",
    ]),

    h1(de ? "Bestätigung" : "Attestation"),
    p(de
      ? `Mit der eigenen Unterschrift in der obigen Zeile bestätigt jedes Mitglied, dass es die NIS2-Schulung absolviert und die geforderten ausreichenden Kenntnisse und Fähigkeiten zur Erfassung und Bewertung von Cybersicherheitsrisiken (Art. 20(2) NIS2) erworben hat. Die nächste Auffrischung erfolgt spätestens nach drei Jahren oder bei wesentlichen Änderungen der Bedrohungslage / Rechtslage.`
      : `By signing the row above, each member confirms that they have completed the NIS2 training and have acquired sufficient knowledge and skills to identify and assess cybersecurity risks as required by Art. 20(2) NIS2. The next refresh takes place at the latest after three years or on material changes in the threat / legal landscape.`),

    space(200),
    p(`${roles.cisoName || (de ? "[ Trainer / CISO ]" : "[ trainer / CISO ]")}`),
    p(de ? "Gegenzeichnung Trainer / CISO — Datum / Unterschrift: ____________" : "Counter-signature trainer / CISO — date / signature: ____________"),
  ];

  return { doc: buildDocument(entityName, lang, docTitle, children), title: docTitle };
}

// 8. Supplier NIS2 notice
async function buildSupplierNotice(ctx: BuildContext) {
  const { entityName, people, lang } = ctx;
  const de = lang === "de";
  const roles = derivePersonRoles(people);
  const docTitle = de ? "Lieferanten-Anschreiben — NIS2-Anforderungen" : "Supplier Notice — NIS2 Requirements";

  const children: any[] = [
    ...titleBlock(docTitle,
      de ? `Information & Anforderungen an wesentliche Lieferanten — ${entityName}` : `Information & requirements for material suppliers — ${entityName}`,
      entityName, lang),

    p(de ? "An: [ Lieferantenname ] · [ Adresse ]" : "To: [ Supplier name ] · [ address ]"),
    p(de ? "Betreff: NIS2-Anforderungen an die Lieferbeziehung" : "Subject: NIS2 requirements applying to our supply relationship"),
    space(),

    p(de ? "Sehr geehrte Damen und Herren," : "Dear Sir or Madam,"),

    p(de
      ? `${entityName} unterliegt als ${"[ wesentliche / wichtige Einrichtung ]"} der EU-Richtlinie NIS2 (umgesetzt in DE durch das BSIG). Da Sie für uns IKT-Dienste / Daten verarbeiten, ist unsere Lieferbeziehung Teil unseres regulierten Geltungsbereichs (Art. 21(2)(d)). Wir bitten Sie um Bestätigung der folgenden Punkte:`
      : `${entityName} is subject to the EU NIS2 Directive (transposed in Germany via the BSIG) as a ${"[ essential / important entity ]"}. Because you process ICT services / data for us, our supply relationship is part of our regulated scope (Art. 21(2)(d)). We ask you to confirm the following:`),

    h1(de ? "1. Sicherheitsanforderungen" : "1. Security requirements"),
    ...ordered(de ? [
      "Sie unterhalten ein angemessenes ISMS (idealerweise nach ISO/IEC 27001, ISO 27017/27018 oder gleichwertig).",
      "Sie führen ein Patch- und Schwachstellenmanagement mit dokumentierten SLAs für kritische Schwachstellen (≤ 7 Tage).",
      "Sie betreiben Zugriffskontrollen nach Stand der Technik (MFA, Least Privilege, Trennung).",
      "Sie verschlüsseln Daten in Transit (TLS 1.2+) und at Rest (AES-256 oder gleichwertig).",
      "Sie führen ein Lieferanten-Backup-Konzept (3-2-1-Regel) inkl. Restore-Tests.",
    ] : [
      "You maintain an appropriate ISMS (ideally ISO/IEC 27001, ISO 27017/27018 or equivalent).",
      "You operate patch & vulnerability management with documented SLAs for critical vulnerabilities (≤ 7 days).",
      "You operate state-of-the-art access controls (MFA, least privilege, segregation).",
      "You encrypt data in transit (TLS 1.2+) and at rest (AES-256 or equivalent).",
      "You maintain a backup concept (3-2-1 rule) including restore tests.",
    ]),

    h1(de ? "2. Vorfallmeldung an uns" : "2. Incident notification to us"),
    ...ordered(de ? [
      "Sie informieren uns über jeden Sicherheitsvorfall, der unsere Daten oder Dienste betrifft, unverzüglich, spätestens binnen 24 Stunden nach Kenntnis.",
      "Sie übermitteln eine erste Bewertung (Umfang, Datenkategorien, betroffene Systeme) binnen 72 Stunden.",
      "Sie liefern den Abschlussbericht inkl. Root Cause und Maßnahmen binnen 30 Tagen.",
      "Kontakt für Vorfallmeldungen bei uns: ${ciso} — [ Notrufnummer ].".replace("${ciso}", roles.cisoName || "[ CISO ]"),
    ] : [
      "You inform us of every security incident affecting our data or services without undue delay, at the latest within 24 hours of awareness.",
      "You provide an initial assessment (scope, data categories, affected systems) within 72 hours.",
      "You provide the final report including root cause and measures within 30 days.",
      `Our incident-notification contact: ${roles.cisoName || "[ CISO ]"} — [ hotline ].`,
    ]),

    h1(de ? "3. Audit- & Auskunftsrecht" : "3. Audit & information right"),
    p(de
      ? "Wir behalten uns das Recht vor, einmal jährlich (oder bei begründetem Anlass) Sicherheitsaudits durchzuführen oder anerkannte Audit-Berichte / Zertifikate einzufordern (SOC 2 Type II, ISO 27001-Zertifikat inkl. Statement of Applicability)."
      : "We reserve the right, annually (or for cause), to perform security audits or request recognised audit reports / certificates (SOC 2 Type II, ISO 27001 certificate including Statement of Applicability)."),

    h1(de ? "4. Unter-Lieferanten" : "4. Sub-processors"),
    p(de
      ? "Der Einsatz von Unter-Lieferanten, die unsere Daten verarbeiten, bedarf unserer vorherigen Zustimmung. Wechsel sind 30 Tage vorab anzukündigen."
      : "Use of sub-processors handling our data requires our prior consent. Changes must be announced 30 days in advance."),

    h1(de ? "5. SLA-Anhang" : "5. SLA annex"),
    dataTable(
      [de ? "Kennzahl" : "Metric", de ? "Anforderung" : "Requirement", de ? "Messung / Nachweis" : "Measurement / evidence"],
      [
        [de ? "Verfügbarkeit produktiver Dienst" : "Production service availability", "≥ 99,9 % p. a.", de ? "Monatlicher Verfügbarkeitsbericht" : "Monthly availability report"],
        [de ? "Erstreaktion Sicherheitsvorfall" : "Security-incident first response", "≤ 1 h", de ? "Ticketzeitstempel" : "Ticket timestamps"],
        [de ? "Patch kritische CVE (CVSS ≥ 9.0)" : "Patch critical CVE (CVSS ≥ 9.0)", "≤ 7 " + (de ? "Tage" : "days"), de ? "Patch-Report" : "Patch report"],
        [de ? "Patch hohe CVE (CVSS 7–8.9)" : "Patch high CVE (CVSS 7–8.9)", "≤ 30 " + (de ? "Tage" : "days"), de ? "Patch-Report" : "Patch report"],
        [de ? "RTO kritische Dienste" : "RTO critical services", "≤ 4 h", de ? "DR-Testprotokoll (jährlich)" : "DR test report (annual)"],
        [de ? "RPO kritische Daten" : "RPO critical data", "≤ 15 min", de ? "Backup-Report" : "Backup report"],
        [de ? "Vorfallmeldung an uns" : "Incident notification to us", "≤ 24 h", de ? "Meldekanal-Log" : "Notification channel log"],
        [de ? "Pönale bei SLA-Verstoß" : "Penalty on SLA breach", "[ % " + (de ? "der Monatsrechnung" : "of monthly fee") + " ]", de ? "Gutschrift im Folgemonat" : "Credit note next month"],
      ],
      [2800, 2800, 3760]
    ),

    h1(de ? "6. Bestätigung" : "6. Confirmation"),
    p(de
      ? "Bitte bestätigen Sie die obigen Anforderungen schriftlich binnen 30 Tagen oder benennen Sie konkrete Abweichungen. Eine fehlende Bestätigung führt zur Aufnahme in unser Risikoregister."
      : "Please confirm the above requirements in writing within 30 days or name concrete deviations. Lack of confirmation will result in inclusion in our risk register."),

    h2(de ? "Antwortbogen (vom Lieferanten auszufüllen)" : "Response form (to be completed by supplier)"),
    dataTable(
      [de ? "Punkt" : "Item", de ? "Bestätigt" : "Confirmed", de ? "Abweichung / Hinweis" : "Deviation / note"],
      [
        [de ? "ISMS / Zertifizierung" : "ISMS / certification", de ? "[ ☐ ja  ☐ nein ]" : "[ ☐ yes  ☐ no ]", "[ … ]"],
        [de ? "Patch-Management SLAs" : "Patch-management SLAs", de ? "[ ☐ ja  ☐ nein ]" : "[ ☐ yes  ☐ no ]", "[ … ]"],
        [de ? "Zugriffskontrollen (MFA, LP)" : "Access controls (MFA, LP)", de ? "[ ☐ ja  ☐ nein ]" : "[ ☐ yes  ☐ no ]", "[ … ]"],
        [de ? "Verschlüsselung" : "Encryption", de ? "[ ☐ ja  ☐ nein ]" : "[ ☐ yes  ☐ no ]", "[ … ]"],
        [de ? "Backup-/Restore-Tests" : "Backup / restore tests", de ? "[ ☐ ja  ☐ nein ]" : "[ ☐ yes  ☐ no ]", "[ … ]"],
        [de ? "Vorfallmeldung 24 h" : "Incident notification 24 h", de ? "[ ☐ ja  ☐ nein ]" : "[ ☐ yes  ☐ no ]", "[ … ]"],
        [de ? "Audit-/Auskunftsrecht" : "Audit / information right", de ? "[ ☐ ja  ☐ nein ]" : "[ ☐ yes  ☐ no ]", "[ … ]"],
        [de ? "Unter-Lieferanten-Genehmigung" : "Sub-processor approval", de ? "[ ☐ ja  ☐ nein ]" : "[ ☐ yes  ☐ no ]", "[ … ]"],
        [de ? "Eigener NIS2-Status des Lieferanten" : "Supplier's own NIS2 status",
          de ? "[ wesentlich / wichtig / nicht im Anwendungsbereich ] — [ Behörde / Mitgliedstaat ]" : "[ essential / important / out of scope ] — [ authority / member state ]", "[ … ]"],
      ],
      [3600, 2000, 3760]
    ),
    space(),
    dataTable(["", ""], [
      ["[ " + (de ? "Name Unterzeichner Lieferant" : "Supplier signatory name") + " ]", "[ " + (de ? "Funktion" : "Function") + " ]"],
      [de ? "Datum / Unterschrift: ____________" : "Date / signature: ____________",
       de ? "Stempel:" : "Stamp:"],
    ], [4680, 4680]),

    space(200),
    p(`${roles.cisoName || "[ CISO / ISB ]"}`),
    p(`${entityName}`),
    p(de ? "Datum / Unterschrift: ____________" : "Date / signature: ____________"),
  ];

  return { doc: buildDocument(entityName, lang, docTitle, children), title: docTitle };
}

// 9. Incident Escalation Chart
async function buildIncidentEscalation(ctx: BuildContext) {
  const { entityName, people, lang } = ctx;
  const de = lang === "de";
  const roles = derivePersonRoles(people);
  const docTitle = de ? "Vorfall-Eskalationskette (Art. 23)" : "Incident Escalation Chart (Art. 23)";

  const children: any[] = [
    ...titleBlock(docTitle,
      de ? `Wer wird wann informiert — ${entityName}` : `Who is informed when — ${entityName}`,
      entityName, lang),

    callout(de
      ? "Ziel: Die 24-Stunden-Frühwarnung an die zuständige Behörde nach NIS2 Art. 23 wird zuverlässig erreicht — auch nachts, am Wochenende und an Feiertagen."
      : "Goal: the 24-hour early warning to the competent authority under NIS2 Art. 23 is reliably met — also at night, on weekends and holidays."),

    callout(de
      ? "Wichtig — Fristbeginn: Alle Fristen (24 h Frühwarnung, 72 h Vorfallsmeldung, 1 Monat Abschlussbericht) laufen ab dem Zeitpunkt, zu dem die Einrichtung von einem erheblichen Vorfall im Sinne von Art. 23 NIS2 / § 32 BSIG KENNTNIS erlangt — nicht ab Erstdetektion (Stufe 1) und nicht ab Eintritt des Vorfalls."
      : "Important — clock-start: every deadline (24 h early warning, 72 h incident notification, 1 month final report) runs from the moment the entity becomes AWARE of a significant incident within the meaning of Art. 23 NIS2 / § 32 BSIG — not from first detection (Tier 1) and not from the actual occurrence."),

    callout(de
      ? "Vorab-Mandat des Leitungsorgans: Das Leitungsorgan ermächtigt den CISO/ISB (bzw. die Stellvertretung), die 24-Stunden-Frühwarnung innerhalb des Kenntnisfensters ohne Rückfrage abzugeben, sofern das Leitungsorgan außerhalb der Geschäftszeiten nicht erreichbar ist. Das Leitungsorgan wird unverzüglich, spätestens vor Versand, parallel informiert."
      : "Pre-delegated board authority: the management body authorises the CISO/ISB (or the deputy) to file the 24-hour early warning within the awareness window without further approval if the board is unreachable out-of-hours. The board is informed in parallel without delay, at the latest before dispatch."),

    h1(de ? "Stufe 1 — Erkennung (0–15 Min)" : "Tier 1 — Detection (0–15 min)"),
    dataTable(
      [de ? "Rolle" : "Role", de ? "Person / Stelle" : "Person / function", de ? "Aktion" : "Action"],
      [
        [de ? "Erstmeldender" : "First responder", de ? "[ SOC / IT-Bereitschaft ]" : "[ SOC / IT on-call ]",
          de ? "Klassifiziert Vorfall (Schweregrad 1–4), öffnet Ticket, ruft CISO an" : "Classifies incident (severity 1–4), opens ticket, calls CISO"],
        ["SOC-Hotline", "[ Tel: +49 ... ]", de ? "24/7 erreichbar" : "24/7 reachable"],
      ],
      [2200, 3500, 3660]
    ),

    h1(de ? "Stufe 2 — Triage (15 Min – 2 Std)" : "Tier 2 — Triage (15 min – 2 h)"),
    dataTable(
      [de ? "Rolle" : "Role", de ? "Person" : "Person", de ? "Kontakt" : "Contact"],
      [
        ["CISO / ISB", roles.cisoName || (de ? "[ Name ]" : "[ name ]"), de ? "[ Mobil / E-Mail ]" : "[ mobile / email ]"],
        [de ? "Stellv. CISO" : "Deputy CISO", roles.deputyName || (de ? "[ Name ]" : "[ name ]"), de ? "[ Mobil / E-Mail ]" : "[ mobile / email ]"],
        [de ? "Datenschutzbeauftragte/r" : "Data Protection Officer",
          roles.dpoName || (de ? "[ Name ]" : "[ name ]"), de ? "[ Mobil / E-Mail ]" : "[ mobile / email ]"],
      ],
      [3000, 3360, 3000]
    ),
    p(de ? "Aktion: CISO entscheidet über Aktivierung Krisenstab, ruft CEO an." : "Action: CISO decides on crisis-team activation, calls CEO."),

    h1(de ? "Stufe 3 — Krisenstab (2 – 12 Std)" : "Tier 3 — Crisis team (2 – 12 h)"),
    dataTable(
      [de ? "Rolle" : "Role", de ? "Person" : "Person", de ? "Kontakt" : "Contact"],
      [
        ["CEO / " + (de ? "Vorsitz" : "Chair"), roles.ceoName || (de ? "[ Name ]" : "[ name ]"), de ? "[ Mobil ]" : "[ mobile ]"],
        ["CFO", roles.cfoName || (de ? "[ Name ]" : "[ name ]"), de ? "[ Mobil ]" : "[ mobile ]"],
        [de ? "Recht / Compliance" : "Legal / Compliance", roles.deputyName || (de ? "[ Name ]" : "[ name ]"), de ? "[ Mobil ]" : "[ mobile ]"],
        [de ? "Kommunikation / Presse" : "Communications / PR", de ? "[ Name ]" : "[ name ]", de ? "[ Mobil ]" : "[ mobile ]"],
        ["IT Operations", de ? "[ Name ]" : "[ name ]", de ? "[ Mobil ]" : "[ mobile ]"],
      ],
      [3000, 3360, 3000]
    ),

    h1(de ? "Stufe 4 — Behördenmeldung (24h / 72h / 1 Monat ab KENNTNIS)" : "Tier 4 — Authority notification (24h / 72h / 1 month from AWARENESS)"),
    p(de
      ? "Hinweis: Stufe 4 wird durch das Bekanntwerden eines erheblichen Vorfalls ausgelöst; ab diesem Zeitpunkt laufen die Fristen. Verantwortlich ist der Meldekontakt (CISO/ISB) im Rahmen des Vorab-Mandats des Leitungsorgans."
      : "Note: Tier 4 is triggered by the entity becoming aware of a significant incident; the deadlines run from that moment. The notification contact (CISO/ISB) acts under the board's pre-delegated authority."),
    dataTable(
      [de ? "Frist" : "Deadline", de ? "Empfänger" : "Recipient", de ? "Verantwortlich" : "Responsible"],
      [
        [de ? "24 Stunden — Frühwarnung" : "24 hours — early warning",
          de ? "BSI / nationale Behörde + Sektor-CSIRT" : "BSI / national authority + sector CSIRT",
          roles.cisoName || "[ CISO ]"],
        [de ? "72 Stunden — Vorfallsmeldung" : "72 hours — incident notification",
          de ? "BSI (Update mit erster Einschätzung)" : "BSI (update with initial assessment)",
          roles.cisoName || "[ CISO ]"],
        [de ? "1 Monat — Abschlussbericht" : "1 month — final report",
          de ? "BSI (Root Cause, Maßnahmen)" : "BSI (root cause, measures)",
          roles.cisoName || "[ CISO ]"],
        [de ? "Parallel: DSGVO 72 h (falls personenbezogene Daten)" : "Parallel: GDPR 72 h (if personal data affected)",
          de ? "Datenschutzbehörde" : "Data Protection Authority",
          roles.dpoName || "[ DPO ]"],
      ],
      [2800, 3560, 3000]
    ),


    h1(de ? "Entscheidungsbaum: Ist der Vorfall meldepflichtig?" : "Decision tree: is the incident notifiable?"),
    ...ordered(de ? [
      "Beeinträchtigt der Vorfall einen wesentlichen Dienst? — Nein → Stufe 1/2, intern dokumentieren. Ja → weiter.",
      "Verursacht oder kann er erheblichen operativen, finanziellen oder physischen Schaden verursachen? — Nein → Stufe 2, intern. Ja → weiter.",
      "Betrifft er natürliche oder juristische Personen über erheblichen materiellen/immateriellen Schaden hinaus? — Ja → erhebliche Auswirkung iSv Art. 23(3) NIS2.",
      "Sind personenbezogene Daten betroffen? — Ja → parallele DSGVO-72h-Meldung an die Datenschutzbehörde (DPO übernimmt).",
      "Stufe 4 ausgelöst → 24h-Frühwarnung an BSI / Sektor-CSIRT, Krisenstab wird einberufen.",
    ] : [
      "Does the incident impact an essential service? — No → Tier 1/2, document internally. Yes → continue.",
      "Could it cause material operational, financial or physical harm? — No → Tier 2, internal. Yes → continue.",
      "Does it affect natural or legal persons beyond material/non-material damage? — Yes → significant impact per Art. 23(3) NIS2.",
      "Is personal data involved? — Yes → parallel GDPR 72h notification to the DPA (DPO leads).",
      "Tier 4 triggered → 24h early warning to BSI / sector CSIRT, crisis team convened.",
    ]),

    h1(de ? "Kommunikationsmatrix" : "Communication matrix"),
    dataTable(
      [de ? "Zielgruppe" : "Audience", de ? "Kanal" : "Channel", de ? "Verantwortlich" : "Owner", de ? "Frequenz" : "Frequency"],
      [
        [de ? "Leitungsorgan" : "Management body", "Email + Call", roles.cisoName || "[ CISO ]", de ? "T+0, T+4h, täglich" : "T+0, T+4h, daily"],
        [de ? "BSI / nationale Behörde" : "BSI / national authority", de ? "BSI-Meldeportal" : "BSI portal", roles.cisoName || "[ CISO ]", "24h / 72h / 1M"],
        [de ? "Datenschutzbehörde" : "Data protection authority", de ? "Webformular" : "Web form", roles.dpoName || "[ DPO ]", de ? "72h (DSGVO)" : "72h (GDPR)"],
        [de ? "Sektor-CSIRT" : "Sector CSIRT", "TLP:AMBER", roles.cisoName || "[ CISO ]", de ? "T+0 + Updates" : "T+0 + updates"],
        [de ? "Wesentliche Lieferanten" : "Material suppliers", "Email", de ? "[ Einkauf ]" : "[ Procurement ]", de ? "Falls Ursache extern" : "If root cause external"],
        [de ? "Betroffene Kunden / Patienten" : "Affected customers / patients", de ? "Brief + Website" : "Letter + website", roles.deputyName || (de ? "[ Recht ]" : "[ Legal ]"), de ? "Nach Behördenfreigabe" : "After authority clearance"],
        [de ? "Presse / Öffentlichkeit" : "Press / public", de ? "Pressemitteilung" : "Press release", de ? "[ PR ]" : "[ PR ]", de ? "Bei medialer Relevanz" : "If media-relevant"],
        [de ? "Belegschaft" : "Workforce", "Intranet + Townhall", roles.ceoName || "[ CEO ]", "T+24h"],
      ],
      [2800, 2200, 2360, 2000]
    ),

    h1(de ? "Bereitschaftsplan (Wochenende & Feiertage)" : "On-call roster (weekends & holidays)"),
    dataTable(
      [de ? "Zeitfenster" : "Window", de ? "Primärrufbereitschaft" : "Primary on-call", de ? "Sekundär" : "Secondary"],
      [
        [de ? "Werktag 08–18 Uhr" : "Workday 08:00–18:00", de ? "[ Name / Tel ]" : "[ name / phone ]", de ? "[ Name / Tel ]" : "[ name / phone ]"],
        [de ? "Werktag 18–08 Uhr" : "Workday 18:00–08:00", de ? "[ Name / Tel ]" : "[ name / phone ]", de ? "[ Name / Tel ]" : "[ name / phone ]"],
        [de ? "Wochenende / Feiertag" : "Weekend / holiday", de ? "[ Name / Tel ]" : "[ name / phone ]", de ? "[ Name / Tel ]" : "[ name / phone ]"],
        [de ? "Urlaubsvertretung" : "Holiday cover", de ? "[ Name / Tel ]" : "[ name / phone ]", de ? "[ Name / Tel ]" : "[ name / phone ]"],
      ],
      [3000, 3180, 3180]
    ),

    h1(de ? "Schweregradskala" : "Severity scale"),
    dataTable(
      [de ? "Stufe" : "Level", de ? "Bedeutung" : "Meaning", de ? "Eskalationsziel" : "Escalates to"],
      [
        ["1 — " + (de ? "Niedrig" : "Low"), de ? "Lokales Ereignis, keine Dienstauswirkung" : "Local event, no service impact",
          de ? "IT-Bereitschaft" : "IT on-call"],
        ["2 — " + (de ? "Mittel" : "Medium"), de ? "Begrenzte Dienstauswirkung, kein Datenverlust" : "Limited service impact, no data loss", "CISO"],
        ["3 — " + (de ? "Hoch" : "High"), de ? "Wesentliche Dienstauswirkung oder Datenverlust" : "Material service impact or data loss",
          de ? "CISO + CEO" : "CISO + CEO"],
        ["4 — " + (de ? "Kritisch" : "Critical"), de ? "Meldepflichtig nach NIS2 Art. 23" : "Notifiable under NIS2 Art. 23",
          de ? "Krisenstab + Behörde" : "Crisis team + authority"],
      ],
      [1800, 4760, 2800]
    ),

    h1(de ? "Übung & Nachweis" : "Exercise & evidence"),
    p(de
      ? "Diese Eskalationskette wird mindestens jährlich, einmal davon außerhalb der Geschäftszeiten, geübt. Ergebnis wird im Management Review protokolliert."
      : "This escalation chain is exercised at least annually, once of which out-of-hours. Results are recorded in the Management Review."),
    dataTable(
      [de ? "Datum" : "Date", de ? "Szenario" : "Scenario", de ? "Teilnehmer" : "Participants", de ? "Erreichbarkeit" : "Reach time", de ? "Lessons learned" : "Lessons learned"],
      [
        [de ? "[ Datum ]" : "[ date ]", de ? "[ z. B. Ransomware Patientendaten ]" : "[ e.g. ransomware patient data ]", "[ n / n ]", "[ < 20 min ]", "[ … ]"],
        [de ? "[ Datum ]" : "[ date ]", "[ … ]", "[ n / n ]", "[ … ]", "[ … ]"],
      ],
      [1500, 2800, 1700, 1500, 1860]
    ),

    space(200),
    p(`${roles.cisoName || "[ CISO / ISB ]"}`),
    p(de ? "Datum / Unterschrift: ____________" : "Date / signature: ____________"),
  ];

  return { doc: buildDocument(entityName, lang, docTitle, children), title: docTitle };
}

// 10. Company structure (replaces previous HTML export)
async function buildCompanyStructure(ctx: BuildContext) {
  const { entityName, people, lang } = ctx;
  const de = lang === "de";
  const roles = derivePersonRoles(people);
  const docTitle = de ? "Unternehmensstruktur" : "Company Structure";

  const children: any[] = [
    ...titleBlock(docTitle,
      de ? `Verantwortlichkeiten & Rollen — ${entityName}` : `Responsibilities & roles — ${entityName}`,
      entityName, lang),

    metaTable([
      metaRow(de ? "Dokument" : "Document", docTitle),
      metaRow(de ? "Unternehmen" : "Entity", entityName),
      metaRow(de ? "Erstellt am" : "Generated on", new Date().toLocaleDateString(de ? "de-DE" : "en-GB")),
      metaRow(de ? "Personen erfasst" : "Persons on record", String(people.length)),
    ]),

    h1(de ? "Schlüsselrollen (NIS2 Art. 20/21)" : "Key roles (NIS2 Art. 20/21)"),
    dataTable(
      [de ? "Rolle" : "Role", de ? "Inhaber" : "Holder"],
      [
        [de ? "CEO / Vorsitz des Leitungsorgans" : "CEO / Chair of the management body", roles.ceoName || "[ — ]"],
        ["CFO", roles.cfoName || "[ — ]"],
        [de ? "CISO / Informationssicherheitsbeauftragter (ISB)" : "CISO / Information Security Officer (ISB)", roles.cisoName || "[ — ]"],
        [de ? "Stellvertretung / Recht" : "Deputy / Legal", roles.deputyName || "[ — ]"],
        [de ? "Datenschutzbeauftragte/r" : "Data Protection Officer", roles.dpoName || "[ — ]"],
      ],
      [5160, 4200]
    ),

    h1(de ? "Verantwortliche Personen" : "Responsible persons"),
    dataTable(
      [de ? "Name" : "Name", de ? "Titel / Rolle" : "Title / Role", de ? "Abteilung" : "Department", de ? "E-Mail" : "E-mail"],
      people.length > 0
        ? people.map((p) => [p.name, p.title, p.department ?? "", p.email ?? ""])
        : [["[ — ]", "[ — ]", "", ""]],
      [2600, 2600, 2080, 2080]
    ),

    h1(de ? "Organigramm (textuell)" : "Organisation chart (textual)"),
    p(de
      ? `Das Leitungsorgan von ${entityName} besteht aus den o. g. C-Level-Funktionen. Direkt unter dem CEO berichten CFO, COO/CTO und CISO. Der CISO ist dem Leitungsorgan als Programmverantwortlicher direkt unterstellt; eine disziplinarische Zwischenebene zur IT-Leitung besteht ausdrücklich nicht, um die Unabhängigkeit der Cybersicherheits-Funktion zu wahren. Der Datenschutzbeauftragte berichtet rechtlich unabhängig direkt an den CEO und an die Aufsichtsbehörde.`
      : `The management body of ${entityName} consists of the C-level functions named above. CFO, COO/CTO and CISO report directly to the CEO. The CISO reports to the management body as programme owner; there is intentionally no disciplinary IT-management layer in between, in order to preserve the independence of the cybersecurity function. The Data Protection Officer reports independently and directly to the CEO and to the supervisory authority.`),

    h1(de ? "RACI für NIS2-Kernfunktionen" : "RACI for NIS2 core functions"),
    p(de
      ? "R = Responsible (Durchführung) · A = Accountable (Verantwortung, nicht delegierbar) · C = Consulted · I = Informed"
      : "R = Responsible (executes) · A = Accountable (owns, non-delegable) · C = Consulted · I = Informed"),
    dataTable(
      [de ? "Funktion" : "Function", "CEO", "CFO", "CISO", de ? "Stellv." : "Deputy", "DPO"],
      [
        [de ? "Billigung Art. 21(2)-Maßnahmen" : "Approve Art. 21(2) measures", "A", "C", "R", "C", "I"],
        [de ? "Budget & Ressourcen" : "Budget & resources", "A", "R", "C", "I", "I"],
        [de ? "ISMS-Betrieb" : "ISMS operations", "I", "I", "A/R", "C", "C"],
        [de ? "Risikoakzeptanz (Hoch)" : "Risk acceptance (high)", "A", "C", "R", "C", "I"],
        [de ? "Vorfallmeldung 24h (Art. 23)" : "Incident notification 24h (Art. 23)", "I", "I", "A/R", "C", "C"],
        [de ? "Datenschutzverletzung (DSGVO 72h)" : "Personal data breach (GDPR 72h)", "I", "I", "C", "I", "A/R"],
        [de ? "Schulung Leitungsorgan" : "Board training", "A", "I", "R", "I", "C"],
        [de ? "Lieferantenrisiko" : "Supplier risk", "I", "C", "A/R", "C", "C"],
        [de ? "Krisenkommunikation" : "Crisis communications", "A", "C", "R", "C", "C"],
      ],
      [3160, 1240, 1240, 1240, 1240, 1240]
    ),

    h1(de ? "Vertretungs- & Ersatzregelung" : "Substitution & deputy matrix"),
    p(de
      ? "Jede sicherheitskritische Rolle hat eine benannte Vertretung, die binnen 60 Minuten erreichbar ist. Bei längerer Abwesenheit (> 14 Tage) übernimmt die Vertretung vollumfänglich."
      : "Every security-critical role has a named deputy, reachable within 60 minutes. For longer absences (> 14 days) the deputy fully takes over."),
    dataTable(
      [de ? "Primärrolle" : "Primary role", de ? "Vertretung" : "Deputy", de ? "Übergabeverfahren" : "Handover procedure"],
      [
        ["CEO", de ? "[ CFO o. ä. ]" : "[ CFO or equiv. ]", de ? "Schriftliche Übergabe, Mitteilung an Aufsicht" : "Written handover, notice to authority"],
        ["CISO / ISB", roles.deputyName || "[ Deputy ]", de ? "Übergabe Risiko-Register, NIS2-Kontaktwechsel beim BSI" : "Handover risk register, NIS2 contact change with BSI"],
        ["DPO", de ? "[ stellv. DPO ]" : "[ deputy DPO ]", de ? "Übergabe lfd. Verfahren, Mitteilung an Datenschutzbehörde" : "Handover open cases, notice to DPA"],
      ],
      [2800, 3000, 3560]
    ),

    h1(de ? "Versionskontrolle" : "Version control"),
    dataTable(
      [de ? "Version" : "Version", de ? "Datum" : "Date", de ? "Änderung" : "Change", de ? "Freigabe" : "Approved by"],
      [
        ["1.0", new Date().toLocaleDateString(de ? "de-DE" : "en-GB"), de ? "Erstausgabe" : "Initial issue", roles.ceoName || "[ CEO ]"],
        ["[ x.y ]", de ? "[ Datum ]" : "[ date ]", de ? "[ Änderung ]" : "[ change ]", de ? "[ Name ]" : "[ name ]"],
      ],
      [1500, 2000, 3860, 2000]
    ),

    space(),
    p(de
      ? "Hinweis: Diese Personen stehen in allen späteren Schritten zur Auswahl (Asset-Owner, Risiko-Behandlung, Maßnahmen-Owner, Auditor)."
      : "Note: these persons are available for selection in all later steps (asset owner, risk treatment, action owner, auditor).",
      { italics: true, color: MUTED }),
  ];

  return { doc: buildDocument(entityName, lang, docTitle, children), title: docTitle };
}

// ─────────────────────────────────────────────────────────────────────────
// Dispatch
// ─────────────────────────────────────────────────────────────────────────
const builders: Record<TemplateKind, (ctx: BuildContext) => Promise<{ doc: Document; title: string }>> = {
  "charter": buildCharter,
  "resolution": buildResolution,
  "risk-acceptance": buildRiskAcceptance,
  "isms-scope": buildIsmsScope,
  "management-review": buildManagementReview,
  "nis2-contact": buildNis2Contact,
  "training-attestation": buildTrainingAttestation,
  "supplier-notice": buildSupplierNotice,
  "incident-escalation": buildIncidentEscalation,
  "company-structure": buildCompanyStructure,
};

export async function downloadTemplate(kind: TemplateKind, ctx: BuildContext) {
  const { doc, title } = await builders[kind](ctx);
  await save(doc, ctx.entityName, title);
}

// Catalog used by the UI (label + short description per language).
export interface TemplateMeta {
  kind: TemplateKind;
  group: "core" | "operational" | "evidence";
  label: { de: string; en: string };
  description: { de: string; en: string };
}

export const TEMPLATE_CATALOG: TemplateMeta[] = [
  {
    kind: "charter", group: "core",
    label: { de: "Cyber-Governance-Charta", en: "Cyber Governance Charter" },
    description: {
      de: "Wie das Leitungsorgan Cybersicherheit nach NIS2 Art. 20/21 steuert.",
      en: "How the management body governs cybersecurity under NIS2 Art. 20/21.",
    },
  },
  {
    kind: "resolution", group: "core",
    label: { de: "Beschluss des Leitungsorgans — Art. 21(2)", en: "Board Resolution — Article 21(2)" },
    description: {
      de: "Förmliche Billigung der Risikomanagementmaßnahmen durch das Leitungsorgan.",
      en: "Formal approval of the risk-management measures by the management body.",
    },
  },
  {
    kind: "isms-scope", group: "core",
    label: { de: "ISMS-Geltungsbereich (Scope-Statement)", en: "ISMS Scope Statement" },
    description: {
      de: "Anwendungsbereich des Informationssicherheits-Managementsystems (ISO 27001 §4.3).",
      en: "Scope of the Information Security Management System (ISO 27001 §4.3).",
    },
  },
  {
    kind: "risk-acceptance", group: "evidence",
    label: { de: "Risikoakzeptanz-Erklärung", en: "Risk Acceptance Statement" },
    description: {
      de: "Dokumentierte Akzeptanz eines Restrisikos durch das Leitungsorgan.",
      en: "Documented acceptance of a residual risk by the management body.",
    },
  },
  {
    kind: "management-review", group: "operational",
    label: { de: "Management Review — Quartalsprotokoll (4 Quartale)", en: "Management Review — Quarterly Minutes (4 quarters)" },
    description: {
      de: "Vollständige Musterprotokolle für 4 vierteljährliche Cyber-Sitzungen (TOP 1–10).",
      en: "Full minute templates for 4 quarterly cyber meetings (items 1–10).",
    },
  },
  {
    kind: "training-attestation", group: "evidence",
    label: { de: "Schulungsbestätigung Leitungsorgan (Art. 20(2))", en: "Board Training Attestation (Art. 20(2))" },
    description: {
      de: "Personenbezogener Nachweis der Cybersicherheitsschulung.",
      en: "Per-person record of the cybersecurity training.",
    },
  },
  {
    kind: "nis2-contact", group: "operational",
    label: { de: "NIS2-Meldekontakt — Registrierungsschreiben", en: "NIS2 Notification Contact — Registration Letter" },
    description: {
      de: "Übermittlung der Registrierungsdaten und Benennung des Meldekontakts (Art. 3(4) NIS2 / §§ 28, 33 BSIG).",
      en: "Submission of registration data and designation of the notification contact (Art. 3(4) NIS2 / §§ 28, 33 BSIG).",
    },
  },
  {
    kind: "supplier-notice", group: "operational",
    label: { de: "Lieferanten-Anschreiben — NIS2-Anforderungen", en: "Supplier Notice — NIS2 Requirements" },
    description: {
      de: "Standardisierte Anforderungen an wesentliche Lieferanten / IKT-Drittparteien.",
      en: "Standardised requirements for material suppliers / ICT third parties.",
    },
  },
  {
    kind: "incident-escalation", group: "operational",
    label: { de: "Vorfall-Eskalationskette (Art. 23)", en: "Incident Escalation Chart (Art. 23)" },
    description: {
      de: "4-stufige Eskalation zur Einhaltung der 24h/72h/1M-Meldepflichten.",
      en: "4-tier escalation to meet the 24h/72h/1M notification deadlines.",
    },
  },
  {
    kind: "company-structure", group: "evidence",
    label: { de: "Unternehmensstruktur (Word)", en: "Company Structure (Word)" },
    description: {
      de: "Firmenprofil + Schlüsselrollen + Personenliste im Standard-Layout.",
      en: "Company profile + key roles + persons list in standard layout.",
    },
  },
];
