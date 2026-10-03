/**
 * SoA-Prüfbericht 02.10.2026:
 *  C-6 Dashboard — künftige MUSS-Pflichten nicht in „kritisch offen", sondern getrennt
 *  C-5 Matrix System × Rolle × Kontrolle aus dem KI-Register
 *  C-7 Rollenkonsistenz über die Matrix
 */
import { describe, it, expect } from "vitest";
import { computeStats } from "@/lib/assessmentEngine";
import { buildAiActMatrix, matrixConsistency, summarizeMatrix, systemTrigger } from "@/lib/aiActMatrix";
import type { KiSystem } from "@/lib/kiGovernance";

describe("computeStats: künftige Pflichten (C-6)", () => {
  const row = (id: string, muss: string, meta: any = null) => ({ id, framework: "AIACT", sub_sector: null, req_de: id, req_en: id, muss, tags: null, meta });
  const controls = [
    row("a", "true"),                                  // nein → kritisch offen
    row("b", "true", { applies_from: "2027-12-02" }),  // nein, gilt später
    row("c", "true", { applies_from: "2027-12-02" }),  // unbeantwortet, gilt später
    row("d", "true"),                                  // unbeantwortet
    row("e", "true", { applies_from: "2025-02-02" }),  // nein, gilt schon
    row("r", "true", { scored: false }),               // Übersicht — nicht gezählt
  ] as any[];
  const eff = new Map<string, any>([["a", { status: "nein" }], ["b", { status: "nein" }], ["e", { status: "nein" }], ["r", { status: "nein" }]]);
  const s = computeStats(controls, eff, "2026-10-02");
  it("trennt später geltende Pflichten", () => {
    expect(s.criticalOpen).toBe(2);        // a, e
    expect(s.criticalUnanswered).toBe(1);  // d
    expect(s.criticalLater).toBe(2);       // b, c
  });
  it("Übersichtszeile zählt nicht", () => {
    expect(s.total).toBe(5);
  });
});

const sys = (p: Partial<KiSystem>): KiSystem => ({
  id: "x", name: "S", zweck: "", rolle: "betreiber", risikoklasse: "minimal", gpai: false, status: "betrieb",
  verantwortlicher: "A", personenbezug: false, annexIII: [], art5: [], transparenzpflicht: false, docStatus: {}, ...p,
});
const ctl = (id: string, family: string, role: string[], applicable = true, implStatus: any = "ja") => ({
  id, name: id, nameEn: id, applicable, isExcluded: false, implStatus, notYetApplicable: false, isRollup: false,
  justification: "", catalog: { family, role }, linkedRisks: [],
}) as any;

describe("KI-Matrix (C-5/C-7)", () => {
  const anbieterHoch = sys({ id: "s1", name: "Prognose", rolle: "anbieter", risikoklasse: "hoch", bewertetAm: "2026-09-01", freigegebenVon: "GF", kennung: "KI-001" });
  const chatbot = sys({ id: "s2", name: "Bot", transparenzpflicht: true, risikoklasse: "begrenzt" });
  const controls = [
    ctl("AIACT-A-03.1", "A-03", ["anbieter"]),
    ctl("AIACT-A-12.1", "A-12", ["betreiber"]),
    ctl("AIACT-T-01", "T", ["betreiber"], false),          // n. a., aber der Chatbot löst aus → Konflikt
    ctl("AIACT-A-14.1", "A-14", ["gpai_anbieter"]),        // anwendbar, kein System → prüfen
  ];

  it("löst je System nach Rolle und Klasse aus", () => {
    expect(systemTrigger(controls[0], anbieterHoch).applies).toBe(true);
    expect(systemTrigger(controls[0], chatbot).reasonType).toBe("rolle");
    expect(systemTrigger(controls[1], sys({ risikoklasse: "hoch" })).reasonType).toBe("fria");
    expect(systemTrigger(controls[2], chatbot).applies).toBe(true);
  });

  it("baut Matrix und Zusammenfassung", () => {
    const rows = buildAiActMatrix(controls, [anbieterHoch, chatbot, sys({ status: "eingestellt" })]);
    expect(rows.length).toBe(8);                              // 2 aktive Systeme × 4 Kontrollen
    const sum = summarizeMatrix(rows);
    expect(sum.find(s => s.systemId === "KI-001")!.applicable).toBe(1);
    expect(sum.find(s => s.systemId === "KI-002")!.applicable).toBe(1);
  });

  it("meldet Konflikt, Prüffall und fehlende Angaben", () => {
    const issues = matrixConsistency(controls, [anbieterHoch, chatbot]);
    expect(issues.filter(i => i.kind === "konflikt").map(i => i.controlId)).toEqual(["AIACT-T-01"]);
    expect(issues.filter(i => i.kind === "pruefen").map(i => i.controlId)).toEqual(expect.arrayContaining(["AIACT-A-14.1", "AIACT-A-12.1"]));
    expect(issues.filter(i => i.kind === "angaben").map(i => i.systemId)).toEqual(["KI-002"]);
  });
});
