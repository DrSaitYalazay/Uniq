/**
 * Policy Clause Exporter — PDF variant for a single policy with selected clauses.
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import type { Lang } from "@/contexts/LanguageContext";
import type { PolicyTemplate } from "@/data/policyTemplates";
import type { PolicyClause } from "@/data/policyClauseTemplates";
import type { ClauseExportOptions } from "./policyClauseExporter";
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

const STATUS_MAP: Record<string, Record<Lang, string>> = {
  draft: { de: "Entwurf", en: "Draft" },
  not_implemented: { de: "Nicht umgesetzt", en: "Not Implemented" },
  partially_implemented: { de: "Teilweise umgesetzt", en: "Partially Implemented" },
  implemented: { de: "Umgesetzt", en: "Implemented" },
  entbehrlich: { de: "Entbehrlich", en: "Not Applicable" },
};

export function generateClausePolicyPDF(
  template: PolicyTemplate,
  state: PolicyState,
  selectedClauses: PolicyClause[],
  lang: Lang,
  companyName: string,
  options?: ClauseExportOptions,
) {
  const de = lang === "de";
  const opts: ClauseExportOptions = options || { includeRationale: true, includeSources: true, includeApplicability: true, includeSectionHeaders: true };
  const pName = de ? template.name : template.nameEn;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 14;
  const marginR = 14;
  const contentW = pageW - marginL - marginR;

  const addFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`${companyName || "Organisation"} — ${pName}`, marginL, pageH - 8);
  };

  // ── Cover Page ──
  doc.setFillColor(20, 50, 100);
  doc.rect(0, 0, pageW, 65, "F");
  doc.setFillColor(200, 170, 50);
  doc.rect(0, 65, pageW, 2, "F");

  doc.setTextColor(255);
  doc.setFontSize(22);
  const titleLines = doc.splitTextToSize(pName, pageW - 40);
  doc.text(titleLines, pageW / 2, 28, { align: "center" });

  doc.setFontSize(11);
  doc.text(companyName || "Organisation", pageW / 2, 50, { align: "center" });

  doc.setTextColor(80);
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString(de ? "de-DE" : "en-US"), pageW / 2, 78, { align: "center" });
  doc.text(`Version ${state.version || "1.0"}`, pageW / 2, 85, { align: "center" });
  addFooter();

  // ── Metadata Page ──
  doc.addPage();
  addFooter();

  doc.setFontSize(16);
  doc.setTextColor(20, 50, 100);
  doc.text(de ? "Dokumentinformationen" : "Document Information", marginL, 20);
  doc.setDrawColor(200, 170, 50);
  doc.setLineWidth(0.5);
  doc.line(marginL, 23, pageW - marginR, 23);

  const metaFields: [string, string][] = [
    [de ? "Richtlinienname" : "Policy Name", pName],
    [de ? "Kategorie" : "Category", de ? template.category : template.categoryEn],
    [de ? "Zweck" : "Purpose", de ? state.purpose : state.purposeEn],
    [de ? "Geltungsbereich" : "Scope", state.scope],
    [de ? "Verantwortlicher" : "Policy Owner", state.policyOwner],
    [de ? "Verantwortliche Rollen" : "Responsible Roles", state.responsibleRoles],
    [de ? "Genehmigung" : "Approval Authority", state.approvalAuthority],
    ["Status", STATUS_MAP[state.implementationStatus]?.[lang] ?? "—"],
    [de ? "Überprüfungsfrequenz" : "Review Frequency", state.reviewFrequency],
    [de ? "Letzte Überprüfung" : "Last Review", state.lastReviewDate],
    [de ? "Nächste Überprüfung" : "Next Review", state.nextReviewDate],
    [de ? "Unterstützende Systeme" : "Supporting Systems", state.systemsUsed],
    ["Version", state.version],
    [de ? "Erstellungsdatum" : "Creation Date", state.creationDate],
    [de ? "Inkrafttreten" : "Effective Date", state.effectiveDate || ""],
  ];

  autoTable(doc, {
    startY: 28,
    body: metaFields.map(([label, value]) => [label, value || "—"]),
    styles: { fontSize: 8, cellPadding: 3, font: "helvetica" },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, textColor: [20, 50, 100] },
      1: { cellWidth: contentW - 55 },
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: marginL, right: marginR },
    theme: "plain",
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0.2,
    didDrawCell: (data: any) => {
      if (data.column.index === 0) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    },
  });

  // ── Vorbefüllte Angaben (z. B. aus dem KI-Register) ──
  if (opts.anhang && opts.anhang.eintraege.length > 0) {
    doc.addPage();
    addFooter();
    doc.setFontSize(16);
    doc.setTextColor(20, 50, 100);
    doc.text(opts.anhang.titel, marginL, 20);
    doc.setDrawColor(200, 170, 50);
    doc.setLineWidth(0.5);
    doc.line(marginL, 23, pageW - marginR, 23);
    let y = 29;
    if (opts.anhang.hinweis) {
      doc.setFontSize(8.5);
      doc.setTextColor(100);
      const hl: string[] = doc.splitTextToSize(opts.anhang.hinweis, contentW);
      doc.text(hl, marginL, y);
      y += hl.length * 4 + 3;
    }
    for (const e of opts.anhang.eintraege) {
      if (y > pageH - 40) { doc.addPage(); addFooter(); y = 16; }
      doc.setFontSize(11);
      doc.setTextColor(20, 50, 100);
      doc.setFont("helvetica", "bold");
      const tl: string[] = doc.splitTextToSize(e.titel, contentW);
      doc.text(tl, marginL, y);
      doc.setFont("helvetica", "normal");
      autoTable(doc, {
        startY: y + tl.length * 5,
        body: e.felder.map(([l, v]) => [l, v || "—"]),
        styles: { fontSize: 8, cellPadding: 2.5, font: "helvetica" },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 55, textColor: [20, 50, 100] }, 1: { cellWidth: contentW - 55 } },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: marginL, right: marginR, bottom: 16 },
        theme: "plain",
        didDrawPage: () => addFooter(),
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // ── Clauses ──
  doc.addPage();
  addFooter();

  doc.setFontSize(16);
  doc.setTextColor(20, 50, 100);
  doc.text(de ? "Regelungen" : "Policy Clauses", marginL, 20);
  doc.setDrawColor(200, 170, 50);
  doc.setLineWidth(0.5);
  doc.line(marginL, 23, pageW - marginR, 23);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "italic");
  doc.text(
    de
      ? `Diese Richtlinie umfasst ${selectedClauses.length} Regelungen, basierend auf anerkannten Best-Practice-Standards.`
      : `This policy comprises ${selectedClauses.length} clauses based on recognized best-practice standards.`,
    marginL, 30
  );
  doc.setFont("helvetica", "normal");

  let curY = 38;

  selectedClauses.forEach((clause, idx) => {
    // Check space for heading + at least some content
    if (curY > pageH - 50) {
      doc.addPage();
      addFooter();
      curY = 16;
    }

    // Clause heading — lange Titel umbrechen (vorher liefen sie über den Balken hinaus)
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const headLines: string[] = doc.splitTextToSize(`${idx + 1}. ${de ? clause.title : clause.titleEn}`, contentW - 6);
    const headH = 4 + headLines.length * 4;
    doc.setFillColor(20, 50, 100);
    doc.rect(marginL, curY - 4, contentW, headH, "F");
    doc.setTextColor(255);
    headLines.forEach((l, i) => doc.text(l, marginL + 3, curY + 1 + i * 4));
    doc.setFont("helvetica", "normal");
    curY += headH + 2;

    // Description
    const descLabel = de ? "Beschreibung" : "Description";
    const descText = resolvePolicyRefs(de ? clause.description : clause.descriptionEn, de);

    if (opts.includeSectionHeaders !== false) {
      doc.setFontSize(8);
      doc.setTextColor(20, 50, 100);
      doc.setFont("helvetica", "bold");
      doc.text(descLabel, marginL, curY);
      doc.setFont("helvetica", "normal");
      curY += 4;
    }

    doc.setFontSize(8);
    doc.setTextColor(60);
    const descLines = doc.splitTextToSize(descText, contentW - 4);
    descLines.forEach((line: string) => {
      if (curY > pageH - 20) { doc.addPage(); addFooter(); curY = 16; }
      doc.text(line, marginL + 2, curY);
      curY += 4;
    });
    curY += 2;

    // Rationale
    if (opts.includeRationale) {
      if (curY > pageH - 25) { doc.addPage(); addFooter(); curY = 16; }
      if (opts.includeSectionHeaders !== false) {
        doc.setFillColor(255, 248, 225);
        doc.rect(marginL, curY - 3, contentW, 6, "F");
        doc.setFontSize(7);
        doc.setTextColor(139, 105, 20);
        doc.setFont("helvetica", "bold");
        doc.text(de ? "Begründung" : "Rationale", marginL + 2, curY + 1);
        doc.setFont("helvetica", "normal");
        curY += 5;
      }
      doc.setFontSize(7.5);
      doc.setTextColor(80);
      const ratLines = doc.splitTextToSize(resolvePolicyRefs(de ? clause.reason : clause.reasonEn, de), contentW - 4);
      ratLines.forEach((line: string) => {
        if (curY > pageH - 20) { doc.addPage(); addFooter(); curY = 16; }
        doc.text(line, marginL + 2, curY);
        curY += 3.5;
      });
      curY += 2;
    }

    // Applicability
    if (opts.includeApplicability) {
      if (curY > pageH - 25) { doc.addPage(); addFooter(); curY = 16; }
      if (opts.includeSectionHeaders !== false) {
        doc.setFillColor(232, 240, 254);
        doc.rect(marginL, curY - 3, contentW, 6, "F");
        doc.setFontSize(7);
        doc.setTextColor(20, 50, 100);
        doc.setFont("helvetica", "bold");
        doc.text(de ? "Anwendbarkeit" : "Applicability", marginL + 2, curY + 1);
        doc.setFont("helvetica", "normal");
        curY += 5;
      }
      doc.setFontSize(7.5);
      doc.setTextColor(80);
      const appLines = doc.splitTextToSize(resolvePolicyRefs(de ? clause.whenRequired : clause.whenRequiredEn, de), contentW - 4);
      appLines.forEach((line: string) => {
        if (curY > pageH - 20) { doc.addPage(); addFooter(); curY = 16; }
        doc.text(line, marginL + 2, curY);
        curY += 3.5;
      });
      curY += 2;
    }

    // Sources — nur aktive Frameworks (CWS-Kernregel), umgebrochen statt einer
    // überlangen Zeile, die rechts aus der Seite lief.
    const quellen = filterSourcesForActive(clause.sources, activeFilterKeysFor(getActiveFrameworkKeys()));
    if (opts.includeSources && quellen.length > 0) {
      if (curY > pageH - 25) { doc.addPage(); addFooter(); curY = 16; }
      if (opts.includeSectionHeaders !== false) {
        doc.setFontSize(7);
        doc.setTextColor(100);
        doc.setFont("helvetica", "bold");
        doc.text(de ? "Quellen" : "Sources", marginL + 2, curY);
        doc.setFont("helvetica", "normal");
        curY += 4;
      }
      doc.setFontSize(7);
      doc.setTextColor(120);
      const srcLines: string[] = doc.splitTextToSize(quellen.join("; "), contentW - 4);
      srcLines.forEach((line: string) => {
        if (curY > pageH - 20) { doc.addPage(); addFooter(); curY = 16; }
        doc.text(line, marginL + 2, curY);
        curY += 3.2;
      });
      curY += 3;
    }

    curY += 4; // space between clauses
  });

  // Exceptions
  if (state.exceptions) {
    if (curY > pageH - 40) { doc.addPage(); addFooter(); curY = 16; }
    doc.setFontSize(14);
    doc.setTextColor(20, 50, 100);
    doc.text(de ? "Ausnahmen" : "Exceptions", marginL, curY);
    curY += 6;
    doc.setFontSize(9);
    doc.setTextColor(60);
    const excLines = doc.splitTextToSize(state.exceptions, contentW);
    excLines.forEach((line: string) => {
      if (curY > pageH - 20) { doc.addPage(); addFooter(); curY = 16; }
      doc.text(line, marginL, curY);
      curY += 5;
    });
  }

  // Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    // Overwrite the placeholder
    doc.text(`${i}/${totalPages}`, pageW - marginR, pageH - 8, { align: "right" });
  }

  const safeName = pName.replace(/[^a-zA-Z0-9äöüÄÖÜß\-_\s]/g, "").replace(/\s+/g, "_");
  const pdfBlob = doc.output("blob");
  saveAs(pdfBlob, `${safeName}.pdf`);
}
