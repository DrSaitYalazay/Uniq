/**
 * policyFrameworkFilter — welche Richtlinie/welches Dokument gehört zu welchem
 * Framework, und welche Quellenangabe gehört zu welchem Framework.
 *
 * Vorher lag diese Logik in pages/Policies.tsx und entschied ALLES über
 * Teilzeichenketten in `clause.sources`. Gemessen am 30.09.2026 schlug das an
 * mehreren Stellen fehl:
 *  - Der Katalog v2 zitiert NIS2 als „Directive (EU) 2022/2555" und die
 *    Durchführungsverordnung als „Implementing Regulation (EU) 2024/2690". Das
 *    Muster kannte nur „nis2" → der NIS2-Filter zeigte 16 statt 83 Dokumente;
 *    D11 Registrierung, D12 Selbsteinstufung, D13 GL-Schulung, D14 Meldeverfahren
 *    und D43 GL-Beschluss fehlten ausgerechnet unter NIS2.
 *  - ISO/IEC 42001 wird in keiner Quellenangabe genannt → Filter-Chip nie sichtbar.
 *  - „annex a" traf „Recommendation 2003/361/EC Annex Articles" (→ ISO 27001),
 *    „bsi" traf „BSIG" (→ IT-Grundschutz), „nist" traf „Administration".
 *  - Ein aktives Framework ohne Filtereintrag (z. B. KI_SEC) machte ALLE
 *    Richtlinien sichtbar.
 *
 * Neu: Die Zuordnung Dokument ↔ Framework kommt aus der gepflegten
 * Dokument-Matrix (DOCUMENT_FRAMEWORK_MATRIX, eine Zeile je Vorlage, Pflichtstufe
 * je Framework). Nur für Frameworks ohne Matrix-Spalte greift die Quellen-Erkennung.
 * Die Quellen-Erkennung selbst (für die Anzeige der Quellenangaben) arbeitet mit
 * Wortgrenzen und kennt die amtlichen Rechtsakt-Nummern.
 */
import { DOCUMENT_FRAMEWORK_MATRIX, type Pflichtstufe } from "@/data/documentFrameworkMatrix";
import type { PolicyClause } from "@/data/policyClauseTemplates";

export interface FrameworkFilterDef {
  key: string;
  label: string;
  /** Erkennung in Quellenangaben (auf Kleinschreibung angewendet). */
  pattern: RegExp;
  /** Spalte in DOCUMENT_FRAMEWORK_MATRIX; fehlt sie, entscheidet `pattern`. */
  matrixCols?: string[];
}

// Reihenfolge = Priorität bei der Zuordnung EINER Quellenangabe.
export const FRAMEWORK_FILTERS: FrameworkFilterDef[] = [
  { key: "NIS2",     label: "NIS2",       matrixCols: ["NIS2"],
    // BSIG (i. d. F. NIS2UmsuCG) ist die deutsche Umsetzung der NIS2 — §§ 28 ff.
    pattern: /\bnis[\s-]?2\b|2022\/2555|2024\/2690|\bcir\b|\bbsig\b|nis2umsucg/ },
  { key: "ISO27001", label: "ISO 27001",  matrixCols: ["ISO27001"],
    pattern: /\biso(\/iec)?\s?27001\b|\bannex a\b/ },
  { key: "ISO27017", label: "ISO 27017",  pattern: /\biso(\/iec)?\s?27017\b|\bcld\.\d/ },
  { key: "ISO27018", label: "ISO 27018",  pattern: /\biso(\/iec)?\s?27018\b/ },
  { key: "ISO27701", label: "ISO 27701",  matrixCols: ["ISO27701"], pattern: /\biso(\/iec)?\s?27701\b/ },
  { key: "ISO22301", label: "ISO 22301",  matrixCols: ["ISO22301"], pattern: /\biso(\/iec)?\s?22301\b/ },
  { key: "ISO42001", label: "ISO 42001",  matrixCols: ["ISO42001"], pattern: /\biso(\/iec)?\s?42001\b/ },
  { key: "DORA",     label: "DORA",       matrixCols: ["DORA"],
    pattern: /\bdora\b|2022\/2554|2024\/1772|2024\/1774|2024\/2956|2025\/301|2025\/302|2025\/1190/ },
  { key: "KRITIS",   label: "KRITIS",     matrixCols: ["KRITIS", "KRITIS_DACHG"],
    pattern: /kritis|\bbsig\b|§\s?8a|§\s?8b/ },
  { key: "GDPR",     label: "DSGVO/GDPR", matrixCols: ["GDPR"],
    pattern: /\bdsgvo\b|\bgdpr\b|2016\/679|\bbdsg\b|\bedpb\b|2021\/914/ },
  { key: "BSI",      label: "BSI",        matrixCols: ["BSI"],
    pattern: /\bbsi\b|grundschutz/ },
  { key: "BSI200_4", label: "BSI 200-4",  matrixCols: ["BSI200_4"], pattern: /200-4/ },
  { key: "MaRisk",   label: "MaRisk",     matrixCols: ["MaRisk"], pattern: /marisk|\bbait\b/ },
  { key: "CRA",      label: "CRA",        matrixCols: ["CRA"], pattern: /\bcra\b|cyber resilience|2024\/2847/ },
  { key: "TR03183",  label: "TR-03183",   pattern: /tr[\s-]?03183|\bsbom\b|\bcsaf\b/ },
  { key: "TISAX",    label: "TISAX",      matrixCols: ["TISAX"], pattern: /tisax|vda isa|\bisa 6/ },
  { key: "AIACT",    label: "AI Act",     matrixCols: ["AIACT"],
    pattern: /\bai act\b|ki-verordnung|\bki-vo\b|2024\/1689|2026\/1744/ },
  { key: "NIST",     label: "NIST",       matrixCols: ["NIST_CSF"], pattern: /\bnist\b/ },
];

const BY_KEY = new Map(FRAMEWORK_FILTERS.map(f => [f.key, f]));

/** FrameworkKey (Kontext) → Filter-Schlüssel. `null` = kein Filter (z. B. KI_SEC). */
export function filterKeyForFramework(frameworkKey: string): string | null {
  if (frameworkKey === "BSI_ITGS") return "BSI";
  if (frameworkKey === "BCM22301") return "ISO22301";
  if (frameworkKey === "NIST_CSF" || frameworkKey === "NIST_AI_RMF") return "NIST";
  return BY_KEY.has(frameworkKey) ? frameworkKey : null;
}

export function activeFilterKeysFor(frameworkKeys: Iterable<string>): Set<string> {
  const out = new Set<string>();
  for (const k of frameworkKeys) {
    const f = filterKeyForFramework(k);
    if (f) out.add(f);
  }
  return out;
}

/** Alle Frameworks, denen eine Quellenangabe zugeordnet ist (z. B. BSIG → NIS2 und KRITIS). */
export function sourceFrameworkKeys(src: string): string[] {
  const s = src.toLowerCase();
  return FRAMEWORK_FILTERS.filter(f => f.pattern.test(s)).map(f => f.key);
}

/** Erstes (vorrangiges) Framework einer Quellenangabe oder null (generisch). */
export function sourceFrameworkKey(src: string): string | null {
  return sourceFrameworkKeys(src)[0] ?? null;
}

/** Quellenangaben nur für aktive Frameworks; generische bleiben. Leere Auswahl = alle. */
export function filterSourcesForActive(sources: string[] | undefined, active: Set<string>): string[] {
  const list = sources ?? [];
  if (active.size === 0) return list;
  return list.filter(src => {
    const fws = sourceFrameworkKeys(src);
    return fws.length === 0 || fws.some(f => active.has(f));
  });
}

const MATRIX_BY_ID = new Map(DOCUMENT_FRAMEWORK_MATRIX.map(r => [r.docId.toUpperCase(), r]));

/** Pflichtstufe eines Dokuments für ein Framework laut Matrix (undefined = nicht gefordert / keine Spalte). */
export function matrixLevel(templateId: string, filterKey: string): Pflichtstufe | undefined {
  const f = BY_KEY.get(filterKey);
  const row = MATRIX_BY_ID.get(templateId.toUpperCase());
  if (!f?.matrixCols || !row) return undefined;
  const order: Pflichtstufe[] = ["Muss", "SoA-abhängig", "Empfohlen"];
  let best: Pflichtstufe | undefined;
  for (const c of f.matrixCols) {
    const v = row.frameworks[c];
    if (v && (!best || order.indexOf(v) < order.indexOf(best))) best = v;
  }
  return best;
}

function sourcesMatch(clauses: PolicyClause[], f: FrameworkFilterDef): boolean {
  return clauses.some(c => (c.sources ?? []).some(src => f.pattern.test(src.toLowerCase())));
}

/**
 * Gehört die Vorlage zum Framework?
 *  - "core": Pflicht oder SoA-abhängig (Filter-Chip, Zählung)
 *  - "any":  auch „Empfohlen" (Sichtbarkeit nach aktiven Frameworks)
 * Frameworks ohne Matrix-Spalte bzw. Vorlagen ohne Matrix-Zeile: Quellen-Erkennung.
 */
export function templateMatchesFramework(
  templateId: string,
  clauses: PolicyClause[],
  filterKey: string,
  mode: "core" | "any" = "core",
): boolean {
  if (filterKey === "all") return true;
  const f = BY_KEY.get(filterKey);
  if (!f) return false;
  const row = MATRIX_BY_ID.get(templateId.toUpperCase());
  if (f.matrixCols && row) {
    const lvl = matrixLevel(templateId, filterKey);
    if (!lvl) return false;
    return mode === "any" || lvl === "Muss" || lvl === "SoA-abhängig";
  }
  return sourcesMatch(clauses, f);
}

/**
 * Sichtbarkeit nach CWS-Kernregel: nur Vorlagen, die zu einem AKTIVEN Framework
 * gehören. Ohne aktive (bekannte) Frameworks: alles. Eine Vorlage, die keinem
 * einzigen Framework zugeordnet ist, gilt als framework-neutral und bleibt sichtbar.
 */
export function templateVisibleFor(templateId: string, clauses: PolicyClause[], active: Set<string>): boolean {
  if (active.size === 0) return true;
  for (const k of active) if (templateMatchesFramework(templateId, clauses, k, "any")) return true;
  // Neutral nur, wenn die Matrix KEIN Framework einträgt (auch keines ohne
  // eigenen Filter, z. B. SOC 2) und keine Quelle einem Framework zugeordnet ist.
  const row = MATRIX_BY_ID.get(templateId.toUpperCase());
  if (row && Object.values(row.frameworks).some(Boolean)) return false;
  return !FRAMEWORK_FILTERS.some(f => templateMatchesFramework(templateId, clauses, f.key, "any"));
}
