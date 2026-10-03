/**
 * Richtlinien-Motor, Dokumente und KI-Governance — strenger Regressionstest
 * für NIS2, ISO/IEC 27001 und KI (AI Act + ISO/IEC 42001). Stand 30.09.2026.
 *
 * Prüft Daten (Katalog, Klauseln, Matrix), Framework-Zuordnung, Quellenfilter,
 * KI-Pflichtdokument-Logik und den Dokumentkatalog. Die Exporte laufen in
 * policy-exports.test.ts.
 */
import { describe, it, expect } from "vitest";
import TEMPLATES, { POLICY_CATEGORIES } from "@/data/policyTemplates";
import CLAUSES from "@/data/policyClauseTemplates";
import { DOCUMENT_FRAMEWORK_MATRIX as MATRIX } from "@/data/documentFrameworkMatrix";
import { unresolvedPolicyRefs } from "@/lib/policyRefResolver";
import {
  FRAMEWORK_FILTERS, templateMatchesFramework, templateVisibleFor, filterSourcesForActive,
  activeFilterKeysFor, sourceFrameworkKey, sourceFrameworkKeys,
} from "@/lib/policyFrameworkFilter";
import { DOCUMENT_CATALOG, catalogForFrameworks } from "@/data/documentCatalog";
import { sameName, titleOverlap } from "@/lib/tools/toolLinks";
import { pflichtDocs, klassifiziere, ART5, ANNEX_III, AI_ACT_DATES, DOC_LABELS } from "@/lib/kiGovernance";

const byId = new Map(TEMPLATES.map(t => [t.id.toUpperCase(), t]));
const cl = (id: string) => CLAUSES[id] ?? [];
const core = (fw: string) => TEMPLATES.filter(t => templateMatchesFramework(t.id, cl(t.id), fw)).map(t => t.id.toUpperCase());
const TENANT = activeFilterKeysFor(["NIS2", "ISO27001", "AIACT", "ISO42001"]);
const visible = (active: Set<string>) => TEMPLATES.filter(t => templateVisibleFor(t.id, cl(t.id), active)).map(t => t.id.toUpperCase());

// ── 1. Katalog-Integrität ──────────────────────────────────────────────────
describe("Katalog", () => {
  it("eindeutige IDs, jede Vorlage hat Klauseln, keine verwaisten Klauseln", () => {
    const ids = TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(TEMPLATES.filter(t => cl(t.id).length === 0).map(t => t.id)).toEqual([]);
    expect(Object.keys(CLAUSES).filter(k => !byId.has(k.toUpperCase()))).toEqual([]);
  });

  it("Pflichtfelder DE/EN gefüllt, Regeln DE/EN gleich lang", () => {
    const fehler: string[] = [];
    for (const t of TEMPLATES) {
      for (const f of ["name", "nameEn", "category", "categoryEn", "purpose", "purposeEn"] as const)
        if (!String(t[f] ?? "").trim()) fehler.push(`${t.id}.${f}`);
      if (t.defaultRules.length !== t.defaultRulesEn.length) fehler.push(`${t.id} rules ${t.defaultRules.length}/${t.defaultRulesEn.length}`);
      if ([...t.defaultRules, ...t.defaultRulesEn].some(r => !String(r).trim())) fehler.push(`${t.id} leere Regel`);
    }
    expect(fehler).toEqual([]);
  });

  it("Klauseln: eindeutige IDs, Titel/Text DE+EN, Quellen vorhanden", () => {
    const seen = new Map<string, string>();
    const fehler: string[] = [];
    for (const [tid, list] of Object.entries(CLAUSES)) {
      for (const c of list) {
        if (seen.has(c.id)) fehler.push(`doppelt ${c.id} (${seen.get(c.id)} / ${tid})`);
        seen.set(c.id, tid);
        for (const f of ["title", "titleEn", "description", "descriptionEn"] as const)
          if (!String(c[f] ?? "").trim()) fehler.push(`${c.id}.${f}`);
        if (!(c.sources ?? []).length) fehler.push(`${c.id} ohne Quellen`);
      }
    }
    expect(fehler).toEqual([]);
  });

  it("jeder interne Verweis (p31, D05, p10-c23) im Klauseltext hat ein Ziel", () => {
    const offen: string[] = [];
    for (const list of Object.values(CLAUSES)) for (const c of list)
      for (const txt of [c.description, c.descriptionEn, c.reason, c.reasonEn, c.whenRequired, c.whenRequiredEn]) {
        const u = unresolvedPolicyRefs(txt);
        if (u.length) offen.push(`${c.id}: ${u.join(",")}`);
      }
    expect(offen).toEqual([]);
  });

  it("jede Kategorie ist im Kategorienfilter und hat genau eine EN-Übersetzung", () => {
    const filterDe = new Set(POLICY_CATEGORIES.map(c => c.de));
    expect([...new Set(TEMPLATES.map(t => t.category))].filter(c => !filterDe.has(c))).toEqual([]);
    const en = new Map<string, Set<string>>();
    for (const t of TEMPLATES) (en.get(t.category) ?? en.set(t.category, new Set()).get(t.category)!).add(t.categoryEn);
    expect([...en].filter(([, v]) => v.size > 1).map(([k, v]) => `${k}: ${[...v].join(" | ")}`)).toEqual([]);
  });

  it("Matrix und Vorlagen decken sich 1:1", () => {
    const m = new Set(MATRIX.map(r => r.docId.toUpperCase()));
    expect(MATRIX.length).toBe(m.size);
    expect(TEMPLATES.filter(t => !m.has(t.id.toUpperCase())).map(t => t.id)).toEqual([]);
    expect([...m].filter(id => !byId.has(id))).toEqual([]);
  });
});

// ── 2. Framework-Zuordnung (Filter-Chips) ──────────────────────────────────
describe("Framework-Zuordnung", () => {
  it("NIS2: alle Matrix-Pflichtdokumente, u. a. Registrierung, Meldeverfahren, GL-Beschluss", () => {
    const n = core("NIS2");
    for (const id of ["D11", "D12", "D13", "D14", "D43", "D02", "D39", "D83", "P30", "P31", "P36", "P44", "P01"]) expect(n, id).toContain(id);
    const muss = MATRIX.filter(r => r.frameworks.NIS2 === "Muss").map(r => r.docId.toUpperCase());
    expect(muss.filter(id => !n.includes(id))).toEqual([]);
    expect(n.length).toBeGreaterThan(60);
  });

  it("ISO 27001: SoA, Scope, RTP, Audit, Management-Review, Ziele", () => {
    const n = core("ISO27001");
    for (const id of ["D01", "D02", "D03", "D04", "D05", "D38", "D39", "D40", "D41", "D42", "D84", "D85", "P01", "P10"]) expect(n, id).toContain(id);
    const muss = MATRIX.filter(r => r.frameworks.ISO27001 === "Muss").map(r => r.docId.toUpperCase());
    expect(muss.filter(id => !n.includes(id))).toEqual([]);
  });

  it("AI Act: KI-Register, FRIA, Technische Doku, CE, PMM, Daten-Governance, EU-DB, Gebrauchsanweisung, Aufsicht, QMS, KI-Richtlinie", () => {
    const n = core("AIACT");
    for (const id of ["D25", "D26", "D27", "D28", "D29", "D60", "D61", "D62", "D63", "D73", "P50"]) expect(n, id).toContain(id);
    // Kein Passwort-/Netzwerk-Rauschen im KI-Chip (nur „Empfohlen" in der Matrix)
    expect(n).not.toContain("P13");
    expect(n).not.toContain("P16");
  });

  it("ISO 42001: Chip existiert und enthält die KI- und Managementsystem-Dokumente", () => {
    const n = core("ISO42001");
    expect(n.length).toBeGreaterThan(10);
    for (const id of ["D25", "D26", "D60", "D63", "P50", "D01", "D03", "D04", "D41"]) expect(n, id).toContain(id);
  });

  it("Sichtbarkeit Mandant NIS2+ISO27001+AI Act+ISO 42001: fremde Frameworks ausgeblendet", () => {
    const v = visible(TENANT);
    for (const id of ["D11", "D14", "D25", "D26", "D27", "D73", "P50", "D01", "P13"]) expect(v, id).toContain(id);
    // DORA, KRITIS, CRA, SOC 2, MaRisk, TISAX, BSI-Grundschutz-eigene Dokumente
    for (const id of ["D15", "D16", "D17", "D18", "D19", "D44", "D45", "D46", "D47", "D48", "D55", "D56", "D57", "D30", "D64", "D37", "D75", "D77", "D32", "D06", "D07"])
      expect(v, id).not.toContain(id);
  });

  it("ein Framework ohne Filter (KI_SEC) macht NICHT alles sichtbar", () => {
    const withKiSec = visible(activeFilterKeysFor(["NIS2", "KI_SEC"]));
    expect(withKiSec).not.toContain("D15"); // DORA
    expect(withKiSec).toContain("D14");
  });

  it("jede Chip-Zahl > 0 für NIS2, ISO 27001, AI Act, ISO 42001", () => {
    for (const k of ["NIS2", "ISO27001", "AIACT", "ISO42001"]) expect(core(k).length, k).toBeGreaterThan(0);
    expect(FRAMEWORK_FILTERS.map(f => f.key)).toEqual(expect.arrayContaining(["NIS2", "ISO27001", "AIACT", "ISO42001"]));
  });
});

// ── 3. Quellenangaben (CWS-Kernregel: nur aktive Frameworks) ─────────────────
describe("Quellenangaben", () => {
  it("amtliche Rechtsakt-Nummern werden erkannt", () => {
    expect(sourceFrameworkKey("Directive (EU) 2022/2555 Article 21(2)(i)")).toBe("NIS2");
    expect(sourceFrameworkKey("Implementing Regulation (EU) 2024/2690 Annex 3.1")).toBe("NIS2");
    expect(sourceFrameworkKey("CIR 2024/2690 Annex 2.1")).toBe("NIS2");
    expect(sourceFrameworkKey("Regulation (EU) 2016/679 Articles 33–34")).toBe("GDPR");
    expect(sourceFrameworkKey("Regulation (EU) 2022/2554 5(2)")).toBe("DORA");
    expect(sourceFrameworkKey("Regulation (EU) 2024/1689, consolidated 27 July 2026, Articles 2–4")).toBe("AIACT");
    expect(sourceFrameworkKey("AI Act Art. 27(1)")).toBe("AIACT");
    expect(sourceFrameworkKey("ISO/IEC 27001:2022 A.5.15")).toBe("ISO27001");
    expect(sourceFrameworkKey("ISO/IEC 42001:2023 6.1.4")).toBe("ISO42001");
  });

  it("keine Fehlzuordnung durch Teilzeichenketten", () => {
    expect(sourceFrameworkKey("Recommendation 2003/361/EC Annex Articles 2–6")).toBeNull();
    expect(sourceFrameworkKeys("BSIG § 39(1)")).toEqual(expect.arrayContaining(["NIS2", "KRITIS"]));
    expect(sourceFrameworkKeys("BSIG § 39(1)")).not.toContain("BSI"); // kein IT-Grundschutz
    expect(sourceFrameworkKey("Public administration guidance")).toBeNull();
    expect(sourceFrameworkKey("democracy and accreditation")).toBeNull();
  });

  it("ISO-27001-Mandant sieht keine NIS2-/DSGVO-Quellen, NIS2-Mandant sieht sie", () => {
    const src = ["ISO/IEC 27001:2022 A.5.24", "Directive (EU) 2022/2555 Article 23", "Regulation (EU) 2016/679 Article 33", "internal governance practice"];
    expect(filterSourcesForActive(src, activeFilterKeysFor(["ISO27001"]))).toEqual(["ISO/IEC 27001:2022 A.5.24", "internal governance practice"]);
    expect(filterSourcesForActive(src, activeFilterKeysFor(["NIS2"]))).toEqual(["Directive (EU) 2022/2555 Article 23", "internal governance practice"]);
  });

  it("BSIG (deutsche NIS2-Umsetzung) bleibt für NIS2 sichtbar", () => {
    expect(filterSourcesForActive(["BSIG § 30(8)–(9)"], activeFilterKeysFor(["NIS2"]))).toEqual(["BSIG § 30(8)–(9)"]);
    expect(filterSourcesForActive(["BSIG § 39(1)"], activeFilterKeysFor(["KRITIS"]))).toEqual(["BSIG § 39(1)"]);
  });

  it("jede Pflicht-/SoA-Vorlage des Mandanten behält mindestens eine Quelle", () => {
    const leer: string[] = [];
    const pflicht = new Set([...core("NIS2"), ...core("ISO27001"), ...core("AIACT"), ...core("ISO42001")]);
    for (const id of [...pflicht]) {
      const t = byId.get(id)!;
      const any = cl(t.id).some(c => filterSourcesForActive(c.sources, TENANT).length > 0);
      if (!any) leer.push(id);
    }
    expect(leer).toEqual([]);
  });
});

// ── 4. KI-Governance (Register, Einstufung, Pflichtdokumente) ────────────────
describe("KI-Governance", () => {
  it("Fristen nach VO (EU) 2026/1744", () => {
    expect(AI_ACT_DATES.hochrisikoAnhangIII).toBe("2027-12-02");
    expect(AI_ACT_DATES.hochrisikoAnhangI).toBe("2028-08-02");
    expect(AI_ACT_DATES.transparenz).toBe("2026-08-02");
    expect(AI_ACT_DATES.verboteUndKompetenz).toBe("2025-02-02");
  });

  it("Einstufung", () => {
    expect(klassifiziere([], ["social_scoring"], true)).toBe("unannehmbar");
    expect(klassifiziere(["beschaeftigung"], [], false)).toBe("hoch");
    expect(klassifiziere([], [], true)).toBe("begrenzt");
    expect(klassifiziere([], [], false)).toBe("minimal");
    expect(ANNEX_III).toHaveLength(8);
    expect(ART5.filter(a => !a.ab)).toHaveLength(8); // Art. 5 Abs. 1 a–h
    expect(ART5.find(a => a.id === "social_scoring")!.de).not.toMatch(/Behörde/);
  });

  it("FRIA (Art. 27) nie beim Anbieter, beim Betreiber nur wenn pflichtig", () => {
    expect(pflichtDocs("anbieter", "hoch", { transparenz: false })).not.toContain("D26");
    expect(pflichtDocs("betreiber", "hoch", { transparenz: false })).not.toContain("D26");
    expect(pflichtDocs("betreiber", "hoch", { transparenz: false, friaPflicht: true })).toContain("D26");
  });

  it("Anbieter Hochrisiko: vollständiges Set", () => {
    expect(pflichtDocs("anbieter", "hoch", { transparenz: false }))
      .toEqual(expect.arrayContaining(["D25", "D27", "D28", "D29", "D60", "D61", "D62", "D63", "D73", "SCHULUNG"]));
  });

  it("Art. 4 nur Anbieter/Betreiber; Art. 50 nur Anbieter/Betreiber; DSFA bei Personenbezug", () => {
    expect(pflichtDocs("haendler", "minimal", { transparenz: true })).toEqual(["D25"]);
    expect(pflichtDocs("einfuehrer", "hoch", { transparenz: false })).toEqual(["D25", "D28", "D62"]);
    expect(pflichtDocs("betreiber", "begrenzt", { transparenz: true })).toEqual(["D25", "SCHULUNG", "TRANSP"]);
    expect(pflichtDocs("betreiber", "hoch", { transparenz: false, personenbezug: true })).toContain("D21");
    expect(pflichtDocs("anbieter", "unannehmbar", { transparenz: true })).toEqual(["D25"]);
  });

  it("jedes Pflichtdokument hat DE/EN-Bezeichnung und — falls D-Dokument — eine Vorlage", () => {
    const alle = new Set<string>();
    for (const r of ["anbieter", "betreiber", "einfuehrer", "haendler"] as const)
      for (const k of ["unannehmbar", "hoch", "begrenzt", "minimal"] as const)
        for (const d of pflichtDocs(r, k, { transparenz: true, friaPflicht: true, personenbezug: true })) alle.add(d);
    for (const d of alle) {
      expect(DOC_LABELS[d]?.de, d).toBeTruthy();
      expect(DOC_LABELS[d]?.en, d).toBeTruthy();
      if (/^D\d+$/.test(d)) expect(byId.has(d), d).toBe(true);
    }
  });

  it("AI-Act-Hochrisiko-Dokumente tragen in der Matrix den Fristhinweis", () => {
    for (const id of ["D26", "D27", "D28", "D29", "D60", "D61", "D62", "D63", "D73"]) {
      const r = MATRIX.find(x => x.docId === id)!;
      expect(r.hinweis?.de, id).toMatch(/02\.12\.2027/);
      expect(r.hinweis?.en, id).toMatch(/2 Dec 2027/);
    }
  });
});

// ── 5. Dokumentkatalog (Dokumenten-Lebenszyklus) ─────────────────────────────
describe("Dokumentkatalog", () => {
  const ki = DOCUMENT_CATALOG.filter(c => c.frameworks?.some(f => f === "AIACT" || f === "ISO42001"));

  it("KI-Dokumente vorhanden: Register, FRIA, Technische Doku, Logs, Vorfälle, Kompetenz, AIMS", () => {
    const keys = ki.map(c => c.key);
    for (const k of ["ki-register", "ki-fria", "ki-tech-doc", "ki-logs", "ki-vorfaelle", "ki-kompetenz", "ki-policy",
      "aims-scope", "aims-soa", "ki-impact", "ki-risk-assess", "aims-audit", "aims-review", "ki-eu-db", "ki-transparenz", "ki-qms", "ki-aufsicht", "ki-pmm"])
      expect(keys, k).toContain(k);
    expect(ki.length).toBeGreaterThanOrEqual(20);
  });

  it("eindeutige Schlüssel und Namen; periodische haben Turnus", () => {
    expect(new Set(DOCUMENT_CATALOG.map(c => c.key)).size).toBe(DOCUMENT_CATALOG.length);
    expect(new Set(DOCUMENT_CATALOG.map(c => c.de)).size).toBe(DOCUMENT_CATALOG.length);
    expect(DOCUMENT_CATALOG.filter(c => c.docClass === "periodisch" && !c.intervalMonths).map(c => c.key)).toEqual([]);
    expect(DOCUMENT_CATALOG.filter(c => !c.basis || !c.en).map(c => c.key)).toEqual([]);
  });

  it("KI-Dokumente nur mit AI Act / ISO 42001 sichtbar", () => {
    const nis2Iso = catalogForFrameworks(["NIS2", "ISO27001"]).map(c => c.key);
    expect(nis2Iso.some(k => k.startsWith("ki-") || k.startsWith("aims-"))).toBe(false);
    const aiAct = catalogForFrameworks(["AIACT"]).map(c => c.key);
    expect(aiAct).toContain("ki-register");
    expect(aiAct).toContain("ki-fria");
    expect(aiAct).not.toContain("aims-audit");
    const iso42 = catalogForFrameworks(["ISO42001"]).map(c => c.key);
    expect(iso42).toContain("aims-audit");
    expect(iso42).not.toContain("ki-fria");
  });

  it("Namensabgleich: ein ISMS-Dokument deckt kein KI-Dokument ab (und umgekehrt)", () => {
    const allg = DOCUMENT_CATALOG.filter(c => !c.frameworks);
    const kreuz: string[] = [];
    for (const a of allg) for (const k of ki) {
      if (sameName(a.de, k.de) || titleOverlap(a.de, k.de) >= 2 || titleOverlap(k.de, a.de) >= 2) kreuz.push(`${a.de} ↔ ${k.de}`);
    }
    expect(kreuz).toEqual([]);
  });
});
