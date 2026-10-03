// Training Certificate PDF — bilingual, tenant-branded
import jsPDF from "jspdf";
import { getReportBrandName, getReportBrandSlug } from "@/lib/reportBrand";
import { isNis2Active } from "@/lib/frameworkFlags";

export interface CertificateInput {
  participantName: string;
  participantEmail?: string;
  roleTrackLabel: string;
  topicLabels: string[];
  quizScore?: { score: number; total: number };
  completedDate: string; // ISO
  companyName?: string;
  lang: "de" | "en";
  trainerName?: string;
  trainerTitle?: string;
}

export const generateCertificatePDF = (input: CertificateInput) => {
  const de = input.lang === "de";
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297;
  const H = 210;

  // Gold double border
  doc.setDrawColor(201, 168, 76);
  doc.setLineWidth(2);
  doc.rect(10, 10, W - 20, H - 20);
  doc.setLineWidth(0.4);
  doc.rect(13, 13, W - 26, H - 26);

  // Header brand
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 27, 61);
  doc.setFontSize(11);
  doc.text(getReportBrandName(de), W / 2, 25, { align: "center" });
  // Keine Tool-Tagline im Kundenoutput (White-Label).

  // Title
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 27, 61);
  doc.setFontSize(28);
  doc.text(de ? "Schulungsnachweis" : "Certificate of Completion", W / 2, 55, { align: "center" });
  doc.setFontSize(11);
  doc.setTextColor(150, 130, 60);
  // Rechtsbezug nur, wenn NIS2 tatsächlich aktiv ist — sonst neutrale Bezeichnung.
  const nis2 = isNis2Active();
  const subtitle = nis2
    ? (de ? "NIS2 Cybersicherheits-Schulung gemäß Art. 20 / 21(2)(g)" : "NIS2 Cybersecurity Training per Art. 20 / 21(2)(g)")
    : (de ? "Cybersicherheits-Schulung" : "Cybersecurity Training");
  doc.text(subtitle, W / 2, 64, { align: "center" });

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text(de ? "Hiermit wird bestätigt, dass" : "This is to certify that", W / 2, 82, { align: "center" });

  // Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 27, 61);
  doc.text(input.participantName, W / 2, 96, { align: "center" });

  // Underline
  doc.setDrawColor(201, 168, 76);
  doc.setLineWidth(0.6);
  const nameW = doc.getTextWidth(input.participantName);
  doc.line(W / 2 - nameW / 2 - 5, 99, W / 2 + nameW / 2 + 5, 99);

  // Subline
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  const subline = de
    ? `als Teilnehmer der Zielgruppe "${input.roleTrackLabel}" erfolgreich abgeschlossen hat:`
    : `as participant of the audience "${input.roleTrackLabel}" has successfully completed:`;
  doc.text(subline, W / 2, 110, { align: "center" });

  // Topics list (max 5 shown)
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  const topics = input.topicLabels.slice(0, 5);
  let y = 122;
  for (const t of topics) {
    const line = `• ${t.length > 90 ? t.slice(0, 87) + "…" : t}`;
    doc.text(line, W / 2, y, { align: "center" });
    y += 5.5;
  }
  if (input.topicLabels.length > 5) {
    doc.setTextColor(120, 120, 120);
    doc.text(de ? `…und ${input.topicLabels.length - 5} weitere` : `…and ${input.topicLabels.length - 5} more`, W / 2, y, { align: "center" });
    y += 5.5;
  }

  // Quiz score
  if (input.quizScore) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 27, 61);
    doc.text(
      de
        ? `Quiz-Ergebnis: ${input.quizScore.score}/${input.quizScore.total} — bestanden`
        : `Quiz result: ${input.quizScore.score}/${input.quizScore.total} — passed`,
      W / 2,
      y + 4,
      { align: "center" }
    );
  }

  // Footer: date, signature, company
  const dateStr = new Date(input.completedDate).toLocaleDateString(de ? "de-DE" : "en-GB");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  // Left: date
  doc.text(de ? "Datum / Date" : "Date", 40, H - 35);
  doc.setDrawColor(120, 120, 120);
  doc.line(40, H - 30, 90, H - 30);
  doc.setFont("helvetica", "bold");
  doc.text(dateStr, 40, H - 25);

  // Right: trainer signature
  doc.setFont("helvetica", "normal");
  doc.text(de ? "Unterschrift Schulungsleitung" : "Trainer signature", W - 90, H - 35);
  doc.line(W - 90, H - 30, W - 40, H - 30);
  // Kein Vendor-Personenname als Default — nur ausfüllen, wenn der Kunde einen
  // Schulungsleiter übergibt; sonst bleibt nur die Unterschriftslinie.
  if (input.trainerName) {
    doc.setFont("helvetica", "bold");
    doc.text(input.trainerName, W - 90, H - 25);
  }
  if (input.trainerTitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(input.trainerTitle, W - 90, H - 21);
  }

  // Centre footer: company
  if (input.companyName) {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(input.companyName, W / 2, H - 18, { align: "center" });
  }
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    de ? `Ausgestellt durch ${getReportBrandName("de")} — automatisierter Schulungsnachweis` : `Issued by ${getReportBrandName("en")} — automated training certificate`,
    W / 2,
    H - 14,
    { align: "center" }
  );

  const isoDate = new Date(input.completedDate).toISOString().slice(0, 10); // YYYY-MM-DD, kein „/"
  const namePart = input.participantName.replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
  const prefix = de ? "Schulungsnachweis" : "Certificate";
  const fname = `${prefix}_${namePart}_${isoDate}.pdf`;
  doc.save(fname);
};
