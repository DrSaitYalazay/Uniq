/**
 * Policy Report Generator — PDF & Word for Step 14
 */
import { jsPDF } from "jspdf";
import { exportBrandedXlsx } from "@/lib/reportXlsxKit";
import autoTable from "jspdf-autotable";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, HeadingLevel, AlignmentType, ShadingType, BorderStyle,
  Footer, PageNumber, PageBreak,
} from "docx";
import { saveAs } from "file-saver";
import type { Lang } from "@/contexts/LanguageContext";
import { RGB } from "@/lib/reportTheme"; // CWS-Markenfarben (navy fix, copper = Akzent)

export interface PolicyData {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  categoryEn: string;
  purpose: string;
  purposeEn: string;
  scope: string;
  policyOwner: string;
  responsibleRoles: string;
  approvalAuthority: string;
  rules: string[];
  rulesEn: string[];
  implementationStatus: "draft" | "not_implemented" | "partially_implemented" | "implemented" | "entbehrlich";
  reviewFrequency: string;
  lastReviewDate: string;
  nextReviewDate: string;
  exceptions: string;
  systemsUsed: string;
  version: string;
  creationDate: string;
  lastUpdated: string;
}

const STATUS_LABELS: Record<string, Record<Lang, string>> = {
  draft: { de: "Entwurf", en: "Draft" },
  not_implemented: { de: "Nicht umgesetzt", en: "Not Implemented" },
  partially_implemented: { de: "Teilweise umgesetzt", en: "Partially Implemented" },
  implemented: { de: "Umgesetzt", en: "Implemented" },
  entbehrlich: { de: "Entbehrlich", en: "Not Applicable" },
};

// ── PDF ──
export function generatePolicyPDF(policies: PolicyData[], lang: Lang, companyName: string) {
  const de = lang === "de";
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let pageNum = 1;
  const totalPages = { value: 0 };

  const addFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`${companyName || (de ? "Ihr Unternehmen" : "Your organisation")} — ${de ? "Richtlinien-Bericht" : "Policy Report"}`, 14, pageH - 8);
  };

  // Title page
  doc.setFillColor(...RGB.navy);
  doc.rect(0, 0, pageW, 60, "F");
  doc.setFillColor(...RGB.copper);
  doc.rect(0, 60, pageW, 2, "F");
  doc.setTextColor(255);
  doc.setFontSize(24);
  doc.text(de ? "Richtlinien-Bericht" : "Policy Report", pageW / 2, 30, { align: "center" });
  doc.setFontSize(12);
  doc.text(de ? "Richtlinien" : "Policies", pageW / 2, 42, { align: "center" });
  if (companyName) {
    doc.setFontSize(14);
    doc.text(companyName, pageW / 2, 52, { align: "center" });
  }
  doc.setTextColor(80);
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString(de ? "de-DE" : "en-US"), pageW / 2, 72, { align: "center" });
  addFooter();

  // Summary
  doc.addPage();
  const implemented = policies.filter(p => p.implementationStatus === "implemented").length;
  const partial = policies.filter(p => p.implementationStatus === "partially_implemented").length;
  // „draft" zählt (wie im Excel-Export) zu „nicht umgesetzt", sonst ergeben
  // Umgesetzt+Teilweise+Nicht+Entbehrlich nicht die Gesamtzahl.
  const notImpl = policies.filter(p => p.implementationStatus === "not_implemented" || p.implementationStatus === "draft").length;
  const entbehrlich = policies.filter(p => p.implementationStatus === "entbehrlich").length;

  doc.setFontSize(16);
  doc.setTextColor(...RGB.navy);
  doc.text(de ? "Zusammenfassung" : "Executive Summary", 14, 20);
  doc.setDrawColor(...RGB.copper);
  doc.setLineWidth(0.5);
  doc.line(14, 23, pageW - 14, 23);

  doc.setFontSize(10);
  doc.setTextColor(60);
  let y = 32;
  doc.text(`${de ? "Gesamtanzahl Richtlinien" : "Total Policies"}: ${policies.length}`, 14, y); y += 7;
  doc.text(`${de ? "Umgesetzt" : "Implemented"}: ${implemented}`, 14, y); y += 7;
  doc.text(`${de ? "Teilweise umgesetzt" : "Partially Implemented"}: ${partial}`, 14, y); y += 7;
  doc.text(`${de ? "Nicht umgesetzt" : "Not Implemented"}: ${notImpl}`, 14, y); y += 7;
  if (entbehrlich > 0) { doc.text(`${de ? "Entbehrlich (nicht anwendbar)" : "Not Applicable"}: ${entbehrlich}`, 14, y); y += 7; }
  y += 7;

  // Summary table
  const summaryRows = policies.map(p => [
    de ? p.name : p.nameEn,
    de ? p.category : p.categoryEn,
    STATUS_LABELS[p.implementationStatus]?.[lang] ?? p.implementationStatus,
  ]);
  autoTable(doc, {
    startY: y,
    head: [[de ? "Richtlinie" : "Policy", de ? "Kategorie" : "Category", "Status"]],
    body: summaryRows,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [20, 50, 100], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
  });
  addFooter();

  // Detail pages
  policies.forEach(p => {
    doc.addPage();
    addFooter();
    let cy = 16;
    const pName = de ? p.name : p.nameEn;

    // Header
    doc.setFillColor(...RGB.navy);
    doc.rect(14, cy - 5, pageW - 28, 10, "F");
    doc.setFontSize(11);
    doc.setTextColor(255);
    doc.text(pName, 18, cy + 1);
    cy += 14;

    const addRow = (label: string, value: string) => {
      if (cy > pageH - 30) { doc.addPage(); addFooter(); cy = 16; }
      doc.setFontSize(8);
      doc.setTextColor(...RGB.navy);
      doc.setFont("helvetica", "bold");
      doc.text(label, 14, cy);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60);
      const lines = doc.splitTextToSize(value || "—", pageW - 65);
      doc.text(lines, 65, cy);
      cy += Math.max(lines.length * 4, 6) + 2;
    };

    addRow(de ? "Kategorie" : "Category", de ? p.category : p.categoryEn);
    addRow(de ? "Zweck" : "Purpose", de ? p.purpose : p.purposeEn);
    addRow(de ? "Geltungsbereich" : "Scope", p.scope);
    addRow(de ? "Richtlinienverantwortlicher" : "Policy Owner", p.policyOwner);
    addRow(de ? "Verantwortliche Rollen" : "Responsible Roles", p.responsibleRoles);
    addRow(de ? "Genehmigungsbehörde" : "Approval Authority", p.approvalAuthority);
    addRow("Status", STATUS_LABELS[p.implementationStatus]?.[lang] ?? "—");

    // Rules
    if (cy > pageH - 40) { doc.addPage(); addFooter(); cy = 16; }
    doc.setFontSize(8);
    doc.setTextColor(...RGB.navy);
    doc.setFont("helvetica", "bold");
    doc.text(de ? "Regeln" : "Rules", 14, cy);
    doc.setFont("helvetica", "normal");
    cy += 5;
    const rules = de ? p.rules : p.rulesEn;
    rules.forEach(r => {
      doc.setTextColor(60);
      const rl = doc.splitTextToSize(`• ${r}`, pageW - 18 - 14);
      if (cy + rl.length * 5 > pageH - 20) { doc.addPage(); addFooter(); cy = 16; }
      doc.text(rl, 18, cy);
      cy += rl.length * 5;
    });
    cy += 4;

    addRow(de ? "Überprüfungshäufigkeit" : "Review Frequency", p.reviewFrequency);
    addRow(de ? "Letzte Überprüfung" : "Last Review", p.lastReviewDate);
    addRow(de ? "Nächste Überprüfung" : "Next Review", p.nextReviewDate);
    addRow(de ? "Ausnahmen" : "Exceptions", p.exceptions);
    addRow(de ? "Unterstützende Systeme" : "Supporting Systems", p.systemsUsed);
    addRow("Version", p.version);
    addRow(de ? "Erstellungsdatum" : "Creation Date", p.creationDate);
    addRow(de ? "Zuletzt aktualisiert" : "Last Updated", p.lastUpdated);
  });

  // Seitenzahlen (echte Stempelung je Seite)
  const totalP = doc.getNumberOfPages();
  for (let i = 1; i <= totalP; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`${i}/${totalP}`, pageW - 14, pageH - 8, { align: "right" });
  }
  const pdfBlob = doc.output("blob");
  saveAs(pdfBlob, `${(companyName || "richtlinien").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${de ? "richtlinien-bericht" : "policy-report"}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── Word ──
export async function generatePolicyWord(policies: PolicyData[], lang: Lang, companyName: string) {
  const de = lang === "de";
  const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
  const headerShading = { fill: "143264", type: ShadingType.CLEAR, color: "FFFFFF" };

  const sections: any[] = [];

  // Title page
  sections.push({
    properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children: [
      new Paragraph({ spacing: { before: 3000 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: de ? "Richtlinien-Bericht" : "Policy Report", bold: true, size: 48, color: "143264", font: "Arial" }),
      ] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [
        new TextRun({ text: de ? "Richtlinien" : "Policies", size: 24, color: "666666", font: "Arial" }),
      ] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [
        new TextRun({ text: companyName || (de ? "Ihr Unternehmen" : "Your organisation"), size: 28, bold: true, color: "1E9E6A", font: "Arial" }),
      ] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [
        new TextRun({ text: new Date().toLocaleDateString(de ? "de-DE" : "en-US"), size: 20, color: "999999", font: "Arial" }),
      ] }),
      new Paragraph({ children: [new PageBreak()] }),
    ],
  });

  // Summary + detail
  const implemented = policies.filter(p => p.implementationStatus === "implemented").length;
  const partial = policies.filter(p => p.implementationStatus === "partially_implemented").length;
  // „draft" zählt (wie im Excel-Export) zu „nicht umgesetzt", sonst ergeben
  // Umgesetzt+Teilweise+Nicht+Entbehrlich nicht die Gesamtzahl.
  const notImpl = policies.filter(p => p.implementationStatus === "not_implemented" || p.implementationStatus === "draft").length;
  const entbehrlich = policies.filter(p => p.implementationStatus === "entbehrlich").length;

  const summaryLine = `${de ? "Gesamtanzahl" : "Total"}: ${policies.length}  |  ${de ? "Umgesetzt" : "Implemented"}: ${implemented}  |  ${de ? "Teilweise" : "Partial"}: ${partial}  |  ${de ? "Nicht umgesetzt" : "Not implemented"}: ${notImpl}` + (entbehrlich > 0 ? `  |  ${de ? "Entbehrlich" : "Not Applicable"}: ${entbehrlich}` : "");

  const summaryChildren: any[] = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [
      new TextRun({ text: de ? "Zusammenfassung" : "Executive Summary", bold: true, size: 28, color: "143264", font: "Arial" }),
    ] }),
    new Paragraph({ spacing: { before: 200, after: 100 }, children: [
      new TextRun({ text: summaryLine, size: 20, font: "Arial" }),
    ] }),
  ];

  // Summary table
  const summaryTableRows = [
    new TableRow({ children: [
      ...[de ? "Richtlinie" : "Policy", de ? "Kategorie" : "Category", "Status"].map(h =>
        new TableCell({ borders, shading: headerShading, width: { size: 3120, type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, color: "FFFFFF", font: "Arial" })] })] })
      ),
    ] }),
    ...policies.map(p => new TableRow({ children: [
      new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: de ? p.name : p.nameEn, size: 16, font: "Arial" })] })] }),
      new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: de ? p.category : p.categoryEn, size: 16, font: "Arial" })] })] }),
      new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: STATUS_LABELS[p.implementationStatus]?.[lang] ?? "—", size: 16, font: "Arial" })] })] }),
    ] })),
  ];
  summaryChildren.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3120, 3120, 3120], rows: summaryTableRows }));

  // Detail sections
  policies.forEach(p => {
    summaryChildren.push(new Paragraph({ children: [new PageBreak()] }));
    summaryChildren.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200 }, children: [
      new TextRun({ text: de ? p.name : p.nameEn, bold: true, size: 24, color: "143264", font: "Arial" }),
    ] }));

    const fieldRows = (label: string, value: string) => new TableRow({ children: [
      new TableCell({ borders, shading: { fill: "F0F4F8", type: ShadingType.CLEAR, color: "000000" }, width: { size: 3000, type: WidthType.DXA },
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 16, font: "Arial" })] })] }),
      new TableCell({ borders, width: { size: 6360, type: WidthType.DXA },
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children: [new Paragraph({ children: [new TextRun({ text: value || "—", size: 16, font: "Arial" })] })] }),
    ] });

    const rules = de ? p.rules : p.rulesEn;
    const rulesText = rules.map((r, i) => `${i + 1}. ${r}`).join("\n");

    const detailTable = new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3000, 6360],
      rows: [
        fieldRows(de ? "Kategorie" : "Category", de ? p.category : p.categoryEn),
        fieldRows(de ? "Zweck" : "Purpose", de ? p.purpose : p.purposeEn),
        fieldRows(de ? "Geltungsbereich" : "Scope", p.scope),
        fieldRows(de ? "Richtlinienverantwortlicher" : "Policy Owner", p.policyOwner),
        fieldRows(de ? "Verantwortliche Rollen" : "Responsible Roles", p.responsibleRoles),
        fieldRows(de ? "Genehmigungsbehörde" : "Approval Authority", p.approvalAuthority),
        fieldRows(de ? "Regeln" : "Rules", rulesText),
        fieldRows("Status", STATUS_LABELS[p.implementationStatus]?.[lang] ?? "—"),
        fieldRows(de ? "Überprüfungshäufigkeit" : "Review Frequency", p.reviewFrequency),
        fieldRows(de ? "Letzte Überprüfung" : "Last Review", p.lastReviewDate),
        fieldRows(de ? "Nächste Überprüfung" : "Next Review", p.nextReviewDate),
        fieldRows(de ? "Ausnahmen" : "Exceptions", p.exceptions),
        fieldRows(de ? "Unterstützende Systeme" : "Supporting Systems", p.systemsUsed),
        fieldRows("Version", p.version),
        fieldRows(de ? "Erstellungsdatum" : "Creation Date", p.creationDate),
        fieldRows(de ? "Zuletzt aktualisiert" : "Last Updated", p.lastUpdated),
      ],
    });
    summaryChildren.push(detailTable);
  });

  sections.push({
    properties: {
      page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
    },
    headers: {},
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: `${companyName || (de ? "Ihr Unternehmen" : "Your organisation")} — ${de ? "Richtlinien-Bericht" : "Policy Report"} | `, size: 14, color: "999999", font: "Arial" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "999999", font: "Arial" }),
          ],
        })],
      }),
    },
    children: summaryChildren,
  });

  const wordDoc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 20 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: "Arial" }, paragraph: { spacing: { before: 240, after: 120 } } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Arial" }, paragraph: { spacing: { before: 200, after: 100 } } },
      ],
    },
    sections,
  });

  const buffer = await Packer.toBuffer(wordDoc);
  const blob = new Blob([buffer as unknown as BlobPart], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  saveAs(blob, `${(companyName || "richtlinien").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${de ? "richtlinien-bericht" : "policy-report"}-${new Date().toISOString().slice(0, 10)}.docx`);
}

/** Richtlinien als Excel — je Zeile ein Abschnitt, für Review im Fachbereich. */
export async function generatePolicyExcel(policies: PolicyData[], lang: Lang, companyName: string) {
  const de = lang === "de";
  const rows: Array<Record<string, any>> = [];
  for (const p of policies) {
    const secs: any[] = (p as any).sections ?? (p as any).clauses ?? [];
    if (secs.length === 0) {
      rows.push({ pol: (p as any).title ?? "", sec: "", txt: (p as any).content ?? "", ver: (p as any).version ?? "", st: (p as any).status ?? "" });
      continue;
    }
    for (const sc of secs) {
      rows.push({
        pol: (p as any).title ?? "",
        sec: sc.title ?? sc.heading ?? "",
        txt: sc.text ?? sc.body ?? sc.content ?? "",
        ver: (p as any).version ?? "",
        st: (p as any).status ?? "",
      });
    }
  }
  await exportBrandedXlsx({
    fileBase: de ? "Richtlinien" : "Policies",
    title: de ? "Richtlinien" : "Policies",
    lang,
    scope: de ? `${policies.length} Richtlinien · ${rows.length} Abschnitte` : `${policies.length} policies · ${rows.length} sections`,
    sheets: [{
      name: de ? "Abschnitte" : "Sections",
      statusKey: "st",
      columns: [
        { header: de ? "Richtlinie" : "Policy", key: "pol", width: 34 },
        { header: de ? "Abschnitt" : "Section", key: "sec", width: 30 },
        { header: de ? "Text" : "Text", key: "txt", width: 80 },
        { header: de ? "Version" : "Version", key: "ver", width: 12 },
        { header: de ? "Status" : "Status", key: "st", width: 16 },
      ],
      rows,
    }],
  });
}
