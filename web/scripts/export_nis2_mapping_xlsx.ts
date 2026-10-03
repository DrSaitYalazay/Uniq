// Bun script: export 206 NIS2 controls → Excel (.xlsx) with NIS2/BSIG mapping.
import ExcelJS from "exceljs";
import { nis2Domains } from "../src/data/nis2Controls";
import { controlMetadata } from "../src/data/controlMetadata";
import { getNis2RequirementForControl, getNis2RequirementById } from "../src/data/nis2RequirementMapping";

type Row = {
  control_id: string;
  domain_de: string; domain_en: string;
  category_de: string; category_en: string;
  control_de: string; control_en: string;
  description_de: string; description_en: string;
  scope: string; family: string;
  nis2_article: string; nis2_title_de: string; nis2_title_en: string;
  bsig: string;
};

// Map NIS2 Art. 21(2)(a..j) → BSIG §30 Abs. 2 (DE umsetzung)
const BSIG_BY_LETTER: Record<string, string> = {
  a: "BSIG §30 Abs. 2 Nr. 1 (Risikoanalyse & Sicherheitskonzepte)",
  b: "BSIG §30 Abs. 2 Nr. 2 (Bewältigung von Sicherheitsvorfällen)",
  c: "BSIG §30 Abs. 2 Nr. 3 (Aufrechterhaltung des Betriebs / BCM)",
  d: "BSIG §30 Abs. 2 Nr. 4 (Sicherheit der Lieferkette)",
  e: "BSIG §30 Abs. 2 Nr. 5 (Sicherheit in Beschaffung, Entwicklung, Wartung)",
  f: "BSIG §30 Abs. 2 Nr. 6 (Wirksamkeitsmessung)",
  g: "BSIG §30 Abs. 2 Nr. 7 (Cyber-Hygiene & Schulungen)",
  h: "BSIG §30 Abs. 2 Nr. 8 (Kryptographie & Verschlüsselung)",
  i: "BSIG §30 Abs. 2 Nr. 9 (Personalsicherheit, Zugriffskontrolle, Asset-Mgmt)",
  j: "BSIG §30 Abs. 2 Nr. 10 (MFA, sichere Kommunikation, Notfallkommunikation)",
};

const bsigFor = (article: string): string => {
  const m = article.match(/\(([a-j])\)/i);
  return m ? BSIG_BY_LETTER[m[1].toLowerCase()] : "BSIG §30 (allgemein)";
};

const rows: Row[] = [];
for (const d of nis2Domains) {
  for (const cat of d.categories) {
    for (const q of cat.questions) {
      const meta = controlMetadata[q.id];
      const familyId = meta?.familyId ?? "governance";
      const nis2Id = getNis2RequirementForControl(q.id, familyId);
      const req = getNis2RequirementById(nis2Id)!;
      rows.push({
        control_id: q.id,
        domain_de: d.titleDe, domain_en: d.title,
        category_de: cat.titleDe, category_en: cat.title,
        control_de: q.question, control_en: q.questionEn,
        description_de: q.description, description_en: q.descriptionEn,
        scope: meta?.scope ?? "unknown",
        family: familyId,
        nis2_article: req.article,
        nis2_title_de: req.title, nis2_title_en: req.titleEn,
        bsig: bsigFor(req.article),
      });
    }
  }
}

const wb = new ExcelJS.Workbook();
wb.creator = "UniqSuite";
wb.created = new Date();

// ---- Sheet 1: All controls ----
const ws = wb.addWorksheet("Kontrollen (206)", { views: [{ state: "frozen", ySplit: 1 }] });
ws.columns = [
  { header: "Control ID", key: "control_id", width: 14 },
  { header: "Domain (DE)", key: "domain_de", width: 28 },
  { header: "Domain (EN)", key: "domain_en", width: 28 },
  { header: "Kategorie (DE)", key: "category_de", width: 28 },
  { header: "Category (EN)", key: "category_en", width: 28 },
  { header: "Kontrolle (DE)", key: "control_de", width: 60 },
  { header: "Control (EN)", key: "control_en", width: 60 },
  { header: "Beschreibung (DE)", key: "description_de", width: 70 },
  { header: "Description (EN)", key: "description_en", width: 70 },
  { header: "Scope", key: "scope", width: 14 },
  { header: "Family", key: "family", width: 22 },
  { header: "NIS2 Artikel", key: "nis2_article", width: 18 },
  { header: "NIS2 Titel (DE)", key: "nis2_title_de", width: 42 },
  { header: "NIS2 Title (EN)", key: "nis2_title_en", width: 42 },
  { header: "BSIG", key: "bsig", width: 56 },
];
ws.addRows(rows);

// Header style
const header = ws.getRow(1);
header.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3A68" } };
header.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
header.height = 28;

// Body style
ws.eachRow((row, idx) => {
  if (idx === 1) return;
  row.alignment = { vertical: "top", wrapText: true };
  row.font = { name: "Arial", size: 10 };
  if (idx % 2 === 0) {
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F8FC" } };
  }
});

ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columns.length } };

// ---- Sheet 2: NIS2 article summary ----
const summary = wb.addWorksheet("NIS2 Artikel-Übersicht");
summary.columns = [
  { header: "NIS2 Artikel", key: "art", width: 18 },
  { header: "Titel (DE)", key: "de", width: 50 },
  { header: "Title (EN)", key: "en", width: 50 },
  { header: "BSIG", key: "bsig", width: 56 },
  { header: "Anzahl Kontrollen", key: "count", width: 18 },
];
const counts = new Map<string, { de: string; en: string; bsig: string; count: number }>();
for (const r of rows) {
  const k = r.nis2_article;
  const c = counts.get(k) ?? { de: r.nis2_title_de, en: r.nis2_title_en, bsig: r.bsig, count: 0 };
  c.count++;
  counts.set(k, c);
}
for (const [art, v] of [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  summary.addRow({ art, de: v.de, en: v.en, bsig: v.bsig, count: v.count });
}
const sh = summary.getRow(1);
sh.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
sh.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB8860B" } };
sh.alignment = { vertical: "middle", wrapText: true };
sh.height = 26;
summary.eachRow((row, idx) => {
  if (idx === 1) return;
  row.alignment = { vertical: "top", wrapText: true };
  row.font = { name: "Arial", size: 10 };
});
summary.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 5 } };

const out = "/mnt/documents/UniqSuite-206-Kontrollen-Mapping.xlsx";
await wb.xlsx.writeFile(out);
console.log(`✓ ${out}  (${rows.length} Kontrollen, ${counts.size} NIS2-Artikel)`);
