/**
 * SoA-Prüfbericht 02.10.2026 — Projektion und Katalog-Gruppierung:
 *  C-1  Kacheln = Zeilen (auch „entbehrlich", das in der SoA anwendbar bleibt)
 *  C-6  „Gilt ab …" statt „Nicht umgesetzt" für noch nicht geltende Pflichten
 *  C-10 Übersichtszeile (A-50.1) wird aus den Kindern abgeleitet, nicht gezählt
 *  C-9  AI-Act-Kontrollen nach Familie gruppiert, keine unbenannten C-Kodes
 */
import { describe, it, expect } from "vitest";
import { buildSoAProjection, validateSoAStats, soaStatusClass, type SoACategoryLite } from "@/lib/soaProjection";
import { buildDbCategories } from "@/data/frameworkCatalogs";

const later = "2099-01-01";
const earlier = "2025-02-02";
const q = (id: string, status: any, catalog?: any) => ({ id, question: id, questionEn: id, description: "", descriptionEn: "", status, catalog });

const categories: SoACategoryLite[] = [{
  id: "c1", article: "A-01", title: "T", titleEn: "T",
  questions: [
    q("X-1", "ja", { appliesFrom: earlier }),
    q("X-2", "nein", { appliesFrom: later }),            // gilt später → kein „Nicht umgesetzt"
    q("X-3", "teilweise", { appliesFrom: later }),       // schon begonnen → Status bleibt
    q("X-4", "entbehrlich"),                             // N/A aus Gap, aber SoA sagt anwendbar
    q("X-5", null),
    q("X-6", "entbehrlich"),                             // bleibt N/A, ohne Begründung
    q("R-1", null, { scored: false, rollupOf: ["X-1", "X-3"] }),
  ],
}];

describe("SoA-Projektion", () => {
  const p = buildSoAProjection({
    categories,
    savedSoAData: { controls: { "X-4": { applicable: true, justification: "" } } },
    treatmentData: { treatments: [] } as any,
    linkageMap: { byControl: new Map(), byRisk: new Map() } as any,
  });

  it("Kacheln und Zeilen zählen gleich (C-1)", () => {
    const s = p.stats;
    expect(s.total).toBe(6);                       // Übersicht zählt nicht
    expect(s.applicable).toBe(5);
    expect(s.implemented + s.partial + s.notImplemented + s.notAssessed + s.notYetApplicable).toBe(s.applicable);
    expect(s.notAssessed).toBe(2);                 // X-4 (entbehrlich, aber anwendbar) + X-5
    expect(validateSoAStats(p).ok).toBe(true);
  });

  it("noch nicht geltende Pflicht → eigener Status (C-6)", () => {
    const x2 = p.systemControls.find(c => c.id === "X-2")!;
    const x3 = p.systemControls.find(c => c.id === "X-3")!;
    expect(soaStatusClass(x2)).toBe("spaeter");
    expect(soaStatusClass(x3)).toBe("teilweise");
    expect(p.stats.notYetApplicable).toBe(1);
    expect(p.stats.notImplemented).toBe(0);
  });

  it("Übersichtszeile abgeleitet, nicht gezählt (C-10)", () => {
    const r = p.systemControls.find(c => c.id === "R-1")!;
    expect(r.isRollup).toBe(true);
    expect(r.implStatus).toBe("teilweise");        // ja + teilweise
  });

  it("fehlende Begründung wird gezählt (C-2)", () => {
    expect(p.stats.missingJustification).toBe(1);  // X-6
  });
});

describe("AI-Act-Gruppierung (C-9)", () => {
  it("Familien statt C-Kodes, Unterkontrollen bei ihrer Familie", () => {
    const rows = [
      { id: "AIACT-A-05.2", framework: "AIACT", req_de: "a", req_en: "a", meta: { iso_ids: ["C27.1"], family: "A-05" } },
      { id: "AIACT-A-05.1", framework: "AIACT", req_de: "b", req_en: "b", meta: { iso_ids: [] } },
      { id: "AIACT-T-07", framework: "AIACT", req_de: "c", req_en: "c", meta: { family: "A-01" } },
      { id: "AIACT-A-01.1", framework: "AIACT", req_de: "d", req_en: "d", meta: { applies_from: "2025-02-02", legal_ref: "Art. 5" } },
      { id: "AIACT-E-08", framework: "AIACT", req_de: "e", req_en: "e", meta: {} },
    ] as any[];
    const cats = buildDbCategories(rows, "AIACT");
    const byArticle = Object.fromEntries(cats.map(c => [c.article, c.questions.map(x => x.id)]));
    expect(byArticle["A-05"]).toEqual(["AIACT-A-05.2", "AIACT-A-05.1"]);
    expect(byArticle["A-01"]).toEqual(expect.arrayContaining(["AIACT-T-07", "AIACT-A-01.1"]));
    expect(cats.every(c => !/^C\d+/i.test(c.article))).toBe(true);
    const a011 = cats.flatMap(c => c.questions).find(x => x.id === "AIACT-A-01.1")!;
    expect(a011.catalog?.appliesFrom).toBe("2025-02-02");
    expect(cats.find(c => c.article === "A-05")!.titleEn).toMatch(/Technical documentation/);
  });
});
