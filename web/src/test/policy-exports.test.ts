/**
 * Exporte des Richtlinien-Motors — jede NIS2-, ISO-27001- und KI-Vorlage wird
 * als PDF (DE+EN) und Word (DE) mit ALLEN Klauseln erzeugt und dann geprüft:
 *  - PDF: Text wird mit pdftotext zurückgelesen. Jeder Klauseltitel und jeder
 *    Klauseltext muss vollständig und unverfälscht darin stehen (fängt nicht
 *    darstellbare Zeichen ab), kein Wort darf rechts aus der Seite laufen.
 *  - Word: document.xml enthält jeden Klauseltitel.
 *  - Quellen: nur aktive Frameworks (CWS-Kernregel).
 * Dazu Sammelbericht PDF/Word/Excel und Übersicht Word/Excel.
 */
import { describe, it, expect, vi, beforeAll } from "vitest";
import { execFileSync } from "child_process";
import { mkdtempSync, writeFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const saved: { name: string; blob: Blob }[] = [];
vi.mock("file-saver", () => ({
  saveAs: (blob: Blob, name: string) => { saved.push({ name, blob }); },
  default: { saveAs: (blob: Blob, name: string) => { saved.push({ name, blob }); } },
}));

import TEMPLATES from "@/data/policyTemplates";
import CLAUSES from "@/data/policyClauseTemplates";
import { templateMatchesFramework, filterSourcesForActive, activeFilterKeysFor } from "@/lib/policyFrameworkFilter";
import { resolvePolicyRefs } from "@/lib/policyRefResolver";
import { generateClausePolicyPDF } from "@/lib/policyClauseExporterPdf";
import { generateClausePolicyWord } from "@/lib/policyClauseExporter";
import { generatePolicyPDF, generatePolicyWord, generatePolicyExcel, type PolicyData } from "@/lib/policyReportGenerator";
import { generatePolicyOverviewWord } from "@/lib/policyOverviewReport";
import { exportPolicyOverviewXlsx } from "@/lib/policyReportXlsx";
import JSZip from "jszip";

const ACTIVE = ["NIS2", "ISO27001", "AIACT", "ISO42001"];
const HAS_PDFTOTEXT = (() => { try { execFileSync("pdftotext", ["-v"], { stdio: "ignore" }); return true; } catch { return false; } })();
const OUT = mkdtempSync(join(tmpdir(), "policy-export-"));

const ids = [...new Set(ACTIVE.flatMap(fw =>
  TEMPLATES.filter(t => templateMatchesFramework(t.id, CLAUSES[t.id] ?? [], fw)).map(t => t.id)))];

function state(t: (typeof TEMPLATES)[number]) {
  return {
    scope: "Gesamte Organisation", policyOwner: "CISO", responsibleRoles: "CISO, IT-Leitung",
    approvalAuthority: "Geschäftsführung", purpose: t.purpose, purposeEn: t.purposeEn,
    implementationStatus: "draft", reviewFrequency: "Jährlich", lastReviewDate: "", nextReviewDate: "2027-09-30",
    exceptions: "Keine.", systemsUsed: "", version: "1.0", creationDate: "2026-09-30", lastUpdated: "2026-09-30",
    effectiveDate: "2026-10-01", rules: t.defaultRules, rulesEn: t.defaultRulesEn,
  };
}
// Leerraum und Bindestriche ignorieren: pdftotext fügt am Zeilenende getrennte
// Wörter („Identitäts-⏎und") ohne Bindestrich zusammen.
const squash = (s: string) => s.replace(/[\s\-‐]+/g, "");
// jsdom-Blob kennt kein arrayBuffer() → über FileReader lesen
const blobBytes = (b: Blob) => new Promise<Buffer>((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(Buffer.from(r.result as ArrayBuffer));
  r.onerror = () => rej(r.error);
  r.readAsArrayBuffer(b);
});

beforeAll(() => {
  localStorage.setItem("cws.framework.active", JSON.stringify(ACTIVE));
  // Übersicht-Word lädt über <a download> statt file-saver
  (URL as any).createObjectURL = (b: Blob) => { saved.push({ name: "objekt-url.docx", blob: b }); return "blob:test"; };
  (URL as any).revokeObjectURL = () => {};
});

describe("Klausel-Export je Vorlage", () => {
  it("deckt NIS2, ISO 27001 und KI ab", () => {
    for (const id of ["D11", "D14", "D43", "D01", "D03", "D25", "D26", "D27", "D63", "D73", "p50", "p31"]) expect(ids, id).toContain(id);
  });

  it.each(["de", "en"] as const)("PDF %s: vollständig, lesbar, nichts läuft aus der Seite", async (lang) => {
    const fehler: string[] = [];
    const active = activeFilterKeysFor(ACTIVE);
    for (const id of ids) {
      const t = TEMPLATES.find(x => x.id === id)!;
      const clauses = CLAUSES[id];
      saved.length = 0;
      try {
        generateClausePolicyPDF(t, state(t) as any, clauses, lang, "Musterstadt GmbH mit sehr langem Namen für den Fußzeilentest",
          { includeRationale: true, includeSources: true, includeApplicability: true, includeSectionHeaders: true });
      } catch (e) { fehler.push(`${id}: Ausnahme ${(e as Error).message}`); continue; }
      if (saved.length !== 1) { fehler.push(`${id}: ${saved.length} Dateien`); continue; }
      if (!HAS_PDFTOTEXT) continue;
      const f = join(OUT, `${id}-${lang}.pdf`);
      writeFileSync(f, await blobBytes(saved[0].blob));
      const text = execFileSync("pdftotext", ["-enc", "UTF-8", f, "-"]).toString("utf8");
      // Fußzeile und Seitenzahl entfernen — sie stehen bei Seitenumbrüchen mitten im Fließtext
      const flat = squash(text.split("\n").filter(l => !l.includes("Musterstadt GmbH mit") && !/^\s*\d+\/\d+\s*$/.test(l)).join("\n"));
      const de = lang === "de";
      for (const c of clauses) {
        const titel = de ? c.title : c.titleEn;
        if (!flat.includes(squash(titel))) fehler.push(`${id}/${c.id}: Titel fehlt/verfälscht: ${titel}`);
        const body = resolvePolicyRefs(de ? c.description : c.descriptionEn, de);
        if (!flat.includes(squash(body))) fehler.push(`${id}/${c.id}: Text fehlt/verfälscht`);
        for (const src of filterSourcesForActive(c.sources, active))
          if (!flat.includes(squash(src))) fehler.push(`${id}/${c.id}: Quelle fehlt: ${src}`);
        const fremd = (c.sources ?? []).filter(s => !filterSourcesForActive([s], active).length);
        for (const s of fremd) if (s.length > 12 && flat.includes(squash(s))) fehler.push(`${id}/${c.id}: fremde Quelle exportiert: ${s}`);
      }
      // Bounding boxes: kein Wort rechts über den Seitenrand (A4 = 595,28 pt)
      const bbox = execFileSync("pdftotext", ["-bbox", f, "-"]).toString("utf8");
      for (const m of bbox.matchAll(/<word xMin="([\d.]+)" yMin="[\d.]+" xMax="([\d.]+)"[^>]*>([^<]*)<\/word>/g)) {
        if (Number(m[2]) > 595.3 - 5) { fehler.push(`${id}: Wort außerhalb der Seite: ${m[3]} (xMax ${m[2]})`); break; }
      }
    }
    expect(fehler.slice(0, 40)).toEqual([]);
  }, 300_000);

  it("Word DE: jede Klausel mit Titel, fremde Quellen nicht enthalten", async () => {
    const fehler: string[] = [];
    for (const id of ids) {
      const t = TEMPLATES.find(x => x.id === id)!;
      saved.length = 0;
      try {
        await generateClausePolicyWord(t, state(t) as any, CLAUSES[id], "de", "Musterstadt GmbH",
          { includeRationale: true, includeSources: true, includeApplicability: true, includeSectionHeaders: true });
      } catch (e) { fehler.push(`${id}: Ausnahme ${(e as Error).message}`); continue; }
      if (saved.length !== 1) { fehler.push(`${id}: ${saved.length} Dateien`); continue; }
      const zip = await JSZip.loadAsync(await blobBytes(saved[0].blob));
      const xml = (await zip.file("word/document.xml")!.async("string")).replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
      const flat = squash(xml);
      for (const c of CLAUSES[id]) if (!flat.includes(squash(c.title))) fehler.push(`${id}/${c.id}: Titel fehlt`);
    }
    expect(fehler.slice(0, 40)).toEqual([]);
  }, 300_000);
});

describe("Sammel- und Übersichtsberichte", () => {
  const data: PolicyData[] = ids.map(id => {
    const t = TEMPLATES.find(x => x.id === id)!;
    return { id, name: t.name, nameEn: t.nameEn, category: t.category, categoryEn: t.categoryEn, ...(state(t) as any), implementationStatus: "partially_implemented" };
  });

  it.each(["de", "en"] as const)("Sammelbericht PDF/Word/Excel %s", async (lang) => {
    saved.length = 0;
    generatePolicyPDF(data, lang, "Musterstadt GmbH");
    await generatePolicyWord(data, lang, "Musterstadt GmbH");
    await generatePolicyExcel(data, lang, "Musterstadt GmbH");
    expect(saved.map(s => s.name.split(".").pop())).toEqual(["pdf", "docx", "xlsx"]);
    for (const s of saved) expect(s.blob.size).toBeGreaterThan(3000);
    if (HAS_PDFTOTEXT) {
      const f = join(OUT, `sammel-${lang}.pdf`);
      writeFileSync(f, await blobBytes(saved[0].blob));
      const flat = squash(execFileSync("pdftotext", ["-enc", "UTF-8", f, "-"]).toString("utf8"));
      for (const d of data.slice(0, 200)) expect(flat, d.id).toContain(squash(lang === "de" ? d.name : d.nameEn));
    }
  }, 120_000);

  it("Übersicht Word/Excel ohne ausgeblendete Frameworks", async () => {
    const policyMap: Record<string, any> = {};
    for (const t of TEMPLATES) policyMap[t.id] = { implementationStatus: "draft" };
    const hidden = TEMPLATES.filter(t => !ids.includes(t.id)).map(t => t.id);
    saved.length = 0;
    await generatePolicyOverviewWord(policyMap, hidden, "de", "Musterstadt GmbH");
    await exportPolicyOverviewXlsx(policyMap, hidden, "de", "Musterstadt GmbH");
    expect(saved).toHaveLength(2);
    const zip = await JSZip.loadAsync(await blobBytes(saved[0].blob));
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain("KI-Systemregister");
    expect(xml).not.toContain("TLPT-Programm"); // DORA
  }, 120_000);
});

it("Ausgabeordner", () => { expect(existsSync(OUT)).toBe(true); console.log("PDF-Ausgaben:", OUT); });
