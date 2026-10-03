/**
 * KI-Systemregister → Dokumente: Register-Export (PDF/Excel) und vorbefüllte
 * KI-Pflichtdokumente (Word/PDF). Liest die erzeugten Dateien zurück.
 */
import { describe, it, expect, vi, beforeAll } from "vitest";
import { execFileSync } from "child_process";
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const saved: { name: string; blob: Blob }[] = [];
vi.mock("file-saver", () => ({
  saveAs: (blob: Blob, name: string) => { saved.push({ name, blob }); },
  default: { saveAs: (blob: Blob, name: string) => { saved.push({ name, blob }); } },
}));

import ExcelJS from "exceljs";
import JSZip from "jszip";
import TEMPLATES from "@/data/policyTemplates";
import CLAUSES from "@/data/policyClauseTemplates";
import type { KiSystem } from "@/lib/kiGovernance";
import { systemFelder, systemeFuerDokument, registerAnhang, vorbelegung, exportRegisterPdf, exportRegisterXlsx, KI_DOC_IDS } from "@/lib/kiRegister";
import { generateClausePolicyPDF } from "@/lib/policyClauseExporterPdf";
import { generateClausePolicyWord } from "@/lib/policyClauseExporter";

const HAS_PDFTOTEXT = (() => { try { execFileSync("pdftotext", ["-v"], { stdio: "ignore" }); return true; } catch { return false; } })();
const OUT = mkdtempSync(join(tmpdir(), "ki-register-"));
const bytes = (b: Blob) => new Promise<Buffer>((res, rej) => { const r = new FileReader(); r.onload = () => res(Buffer.from(r.result as ArrayBuffer)); r.onerror = () => rej(r.error); r.readAsArrayBuffer(b); });
const squash = (s: string) => s.replace(/[\s\-‐]+/g, "");
const pdfText = async (b: Blob, name: string) => {
  const f = join(OUT, name); writeFileSync(f, await bytes(b));
  return execFileSync("pdftotext", ["-enc", "UTF-8", f, "-"]).toString("utf8");
};

const anbieter: KiSystem = {
  id: "a", name: "Bewerber-Ranking", zweck: "Vorauswahl von Bewerbungen für Ausbildungsplätze", rolle: "anbieter",
  risikoklasse: "hoch", gpai: true, status: "entwicklung", verantwortlicher: "Dr. Erika Muster (KI-Beauftragte)",
  personenbezug: true, annexIII: ["beschaeftigung"], art5: [], transparenzpflicht: false, docStatus: { D27: "entwurf" },
};
const betreiber: KiSystem = {
  id: "b", name: "Chatbot Bürgerservice", zweck: "Auskunft zu Öffnungszeiten und Anträgen", rolle: "betreiber",
  risikoklasse: "begrenzt", gpai: true, status: "betrieb", verantwortlicher: "Max Beispiel (IT-Leitung)",
  personenbezug: false, annexIII: [], art5: [], transparenzpflicht: true, docStatus: {},
};
const kreditBetreiber: KiSystem = {
  ...betreiber, id: "c", name: "Kreditscoring", zweck: "Bonitätsprüfung", risikoklasse: "hoch", annexIII: ["grundleistungen"],
  transparenzpflicht: false, friaPflicht: true, personenbezug: true,
};
const ALLE = [anbieter, betreiber, kreditBetreiber];

beforeAll(() => {
  localStorage.setItem("cws.framework.active", JSON.stringify(["NIS2", "ISO27001", "AIACT", "ISO42001"]));
});

describe("Registerdaten", () => {
  it("alle Felder gefüllt und verständlich", () => {
    const f = Object.fromEntries(systemFelder(anbieter, true));
    expect(f["KI-System"]).toBe("Bewerber-Ranking");
    expect(f["Rolle der Organisation"]).toBe("Anbieter");
    expect(f["Risikoklasse (KI-VO)"]).toBe("Hochrisiko");
    expect(f["Anhang-III-Bereiche"]).toMatch(/Beschäftigung/);
    expect(f["Verantwortlich"]).toBe("Dr. Erika Muster (KI-Beauftragte)");
    expect(f["Lebenszyklus"]).toBe("Entwicklung");
    expect(f["Anwendbar ab"]).toMatch(/02\.12\.2027/);
    expect(f["Pflichtdokumente"]).toMatch(/D27 Technische Dokumentation.*\(Entwurf\)/);
    expect(f["Davon fehlend"]).not.toMatch(/D27/);
    expect(f["FRIA-pflichtig (Art. 27)"]).toBe("nicht einschlägig");
    expect(systemFelder(anbieter, false).every(([l, v]) => l && v)).toBe(true);
  });

  it("Zuordnung System → Dokument", () => {
    expect(systemeFuerDokument(ALLE, "D25").map(s => s.id)).toEqual(["a", "b", "c"]);
    expect(systemeFuerDokument(ALLE, "D27").map(s => s.id)).toEqual(["a"]);       // nur Anbieter
    expect(systemeFuerDokument(ALLE, "D26").map(s => s.id)).toEqual(["c"]);       // nur FRIA-pflichtiger Betreiber
    expect(systemeFuerDokument(ALLE, "D63").map(s => s.id)).toEqual(["a", "c"]);  // Hochrisiko
    expect(systemeFuerDokument(ALLE, "D21").map(s => s.id)).toEqual(["c"]);       // Betreiber + Personenbezug
    expect(registerAnhang([betreiber], "D27", true)).toBeUndefined();
    for (const id of KI_DOC_IDS) expect(TEMPLATES.some(t => t.id === id), id).toBe(true);
  });

  it("Vorbelegung Geltungsbereich/Verantwortliche", () => {
    const v = vorbelegung(anbieter, true);
    expect(v.scope).toContain("Bewerber-Ranking");
    expect(v.scope).toContain("Vorauswahl von Bewerbungen");
    expect(v.policyOwner).toBe("Dr. Erika Muster (KI-Beauftragte)");
  });
});

describe("Register-Export", () => {
  it("Excel: eine Zeile je System, alle Spalten", async () => {
    saved.length = 0;
    await exportRegisterXlsx(ALLE, true, "Musterstadt GmbH");
    expect(saved[0].name).toMatch(/KI-Systemregister_\d{4}-\d{2}-\d{2}\.xlsx$/);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load((await bytes(saved[0].blob)) as any);
    const ws = wb.worksheets[0];
    expect(ws.rowCount).toBe(4);
    const kopf = (ws.getRow(1).values as any[]).filter(Boolean);
    expect(kopf).toEqual(expect.arrayContaining(["KI-System", "Verantwortlich", "Lebenszyklus", "Pflichtdokumente", "Davon fehlend"]));
    const zeile2 = (ws.getRow(2).values as any[]).map(String).join(" | ");
    expect(zeile2).toContain("Bewerber-Ranking");
    expect(zeile2).toContain("Dr. Erika Muster");
  });

  it.each([true, false])("PDF (de=%s): Übersicht + Detailseite je System, nichts abgeschnitten", async (de) => {
    saved.length = 0;
    exportRegisterPdf(ALLE, de, "Musterstadt GmbH");
    expect(saved).toHaveLength(1);
    if (!HAS_PDFTOTEXT) return;
    const txt = squash(await pdfText(saved[0].blob, `register-${de}.pdf`));
    for (const s of ALLE) { expect(txt).toContain(squash(s.name)); expect(txt).toContain(squash(s.zweck)); expect(txt).toContain(squash(s.verantwortlicher)); }
    expect(txt).toContain(squash(de ? "Hochrisiko-Pflichten nach Anhang III ab 02.12.2027" : "Annex III from 02/12/2027"));
  });
});

describe("Vorbefüllte KI-Dokumente", () => {
  it.each(["pdf", "word"] as const)("D27 für den Anbieter (%s): Systemangaben vor den Regelungen", async (fmt) => {
    const t = TEMPLATES.find(x => x.id === "D27")!;
    const v = vorbelegung(anbieter, true);
    const state: any = { purpose: t.purpose, purposeEn: t.purposeEn, responsibleRoles: "", approvalAuthority: "Geschäftsführung", implementationStatus: "draft",
      reviewFrequency: "Jährlich", lastReviewDate: "", nextReviewDate: "2027-09-30", exceptions: "", version: "1.0", creationDate: "2026-09-30", lastUpdated: "2026-09-30", ...v };
    const opts = { includeRationale: true, includeSources: true, includeApplicability: true, includeSectionHeaders: true, anhang: registerAnhang([anbieter], "D25", true) };
    saved.length = 0;
    if (fmt === "pdf") generateClausePolicyPDF(t, state, CLAUSES.D27, "de", "Musterstadt GmbH", opts);
    else await generateClausePolicyWord(t, state, CLAUSES.D27, "de", "Musterstadt GmbH", opts);
    let txt: string;
    if (fmt === "pdf") { if (!HAS_PDFTOTEXT) return; txt = await pdfText(saved[0].blob, "d27.pdf"); }
    else {
      const zip = await JSZip.loadAsync(await bytes(saved[0].blob));
      txt = (await zip.file("word/document.xml")!.async("string")).replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
    }
    const flat = squash(txt);
    expect(flat).toContain(squash("Systemangaben aus dem KI-Register"));
    expect(flat).toContain(squash("Vorauswahl von Bewerbungen für Ausbildungsplätze"));
    expect(flat).toContain(squash("Dr. Erika Muster (KI-Beauftragte)"));
    expect(flat).toContain(squash(`KI-System „Bewerber-Ranking“`)); // Geltungsbereich
    // Reihenfolge: Systemangaben vor den Regelungen
    expect(flat.indexOf(squash("Systemangaben aus dem KI-Register"))).toBeLessThan(flat.indexOf(squash(CLAUSES.D27[0].title)));
    for (const c of CLAUSES.D27) expect(flat).toContain(squash(c.title));
  });

  it("D25 mit allen drei Systemen (PDF)", async () => {
    if (!HAS_PDFTOTEXT) return;
    const t = TEMPLATES.find(x => x.id === "D25")!;
    saved.length = 0;
    generateClausePolicyPDF(t, { purpose: t.purpose, purposeEn: t.purposeEn, scope: "Organisation", policyOwner: "CISO", responsibleRoles: "", approvalAuthority: "", implementationStatus: "draft", reviewFrequency: "", lastReviewDate: "", nextReviewDate: "", exceptions: "", systemsUsed: "", version: "1.0", creationDate: "", lastUpdated: "" } as any,
      CLAUSES.D25, "de", "Musterstadt GmbH", { includeRationale: false, includeSources: true, includeApplicability: false, includeSectionHeaders: true, anhang: registerAnhang(ALLE, "D25", true) });
    const flat = squash(await pdfText(saved[0].blob, "d25.pdf"));
    for (const s of ALLE) expect(flat).toContain(squash(s.name));
    expect(flat).toContain(squash("3 System(e)"));
  });
});
