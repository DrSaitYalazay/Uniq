/**
 * Framework catalog registry (Roadmap-scoped).
 *
 * Roadmap Step 15 was originally NIS2-only. To support every framework the
 * user picks as `primary`, we produce a synthetic `NIS2Category[]`-shaped
 * catalog for any framework so the downstream SoAProjection engine keeps
 * working without a rewrite.
 *
 * - NIS2      → real domains from src/data/nis2Controls.ts
 * - ISO27001  → hydrated from src/data/frameworks/iso27001.ts
 * - Others    → derived from public.controls rows (id-prefix grouping)
 */
import type { NIS2Category, ControlQuestion } from "@/data/nis2Controls";
import { nis2Domains } from "@/data/nis2Controls";
import {
  ISO27001_CATEGORIES,
  ISO27001_BY_CATEGORY,
} from "@/data/frameworks/iso27001";
import type { FrameworkKey } from "@/contexts/FrameworkContext";
import { annexBucketLabel, annexSortKey } from "@/data/isoAnnexMap";

export interface DbControlRow {
  id: string;
  framework: string;
  req_de: string | null;
  req_en: string | null;
  meta: any;
}

/** Build the NIS2 native catalog (flat categories with hydrated questions). */
export function buildNis2Categories(): NIS2Category[] {
  return nis2Domains.flatMap((d) => d.categories);
}

/** Build ISO 27001 as NIS2Category[]-shaped for engine compatibility. */
export function buildIsoCategories(): NIS2Category[] {
  return ISO27001_CATEGORIES.map((cat) => {
    const controls = ISO27001_BY_CATEGORY[cat.id] ?? [];
    const questions: ControlQuestion[] = controls.map((c) => ({
      id: c.id,
      question: c.titleDe,
      questionEn: c.titleEn,
      description: c.descriptionDe ?? "",
      descriptionEn: c.descriptionEn ?? "",
      status: null,
    }));
    return {
      id: cat.id,
      article: cat.clause,
      nis2Ref: undefined,
      title: cat.title,
      titleEn: cat.title,
      titleDe: cat.titleDe,
      description: cat.description,
      icon: cat.icon,
      questions,
    };
  }).filter((cat) => cat.questions.length > 0);
}

/**
 * ID-prefix classifier for frameworks without a bundled taxonomy.
 * Extracts the "top-level bucket" from the control id:
 *   "ARCH.1.1.1" -> "ARCH"
 *   "DORA-260"   -> "DORA"
 *   "a-03"       -> "a"
 *   "1.2.3"      -> "1"
 */
function bucketFromId(id: string): string {
  const dot = id.indexOf(".");
  if (dot > 0) return id.slice(0, dot);
  const dash = id.indexOf("-");
  if (dash > 0) return id.slice(0, dash);
  return id;
}

/** ISO-Annex label for a bucket prefix ("a5", "a8", "c4"…). */
const ISO_BUCKET_LABEL: Record<string, string> = {
  a5: "A.5 Organisatorische Kontrollen",
  a6: "A.6 Personelle Kontrollen",
  a7: "A.7 Physische Kontrollen",
  a8: "A.8 Technologische Kontrollen",
  c4: "Kapitel 4 · Kontext der Organisation",
  c5: "Kapitel 5 · Führung",
  c6: "Kapitel 6 · Planung",
  c7: "Kapitel 7 · Unterstützung",
  c8: "Kapitel 8 · Betrieb",
  c9: "Kapitel 9 · Leistungsbewertung",
  c10: "Kapitel 10 · Verbesserung",
};

/** NIS2 Artikel-Labels (aus meta.ref abgeleitet). */
const NIS2_ARTICLE_LABEL: Record<string, string> = {
  "Art. 20": "Art. 20 · Governance & Verantwortung der Leitung",
  "Art. 20(1)": "Art. 20(1) · Governance, Aufsicht & Schulung der Leitung",
  "Art. 21(2)(a)": "Art. 21(2)(a) · Risikomanagement-Konzepte",
  "Art. 21(2)(b)": "Art. 21(2)(b) · Bewältigung von Sicherheitsvorfällen",
  "Art. 21(2)(c)": "Art. 21(2)(c) · Business Continuity & Krisenmanagement",
  "Art. 21(2)(d)": "Art. 21(2)(d) · Sicherheit der Lieferkette",
  "Art. 21(2)(e)": "Art. 21(2)(e) · Sicherheit in Beschaffung, Entwicklung & Wartung",
  "Art. 21(2)(f)": "Art. 21(2)(f) · Wirksamkeitsbewertung der Maßnahmen",
  "Art. 21(2)(g)": "Art. 21(2)(g) · Cyberhygiene & Schulung",
  "Art. 21(2)(h)": "Art. 21(2)(h) · Kryptographie & Verschlüsselung",
  "Art. 21(2)(i)": "Art. 21(2)(i) · Personalsicherheit, Zugriffsrechte & Assetmanagement",
  "Art. 21(2)(j)": "Art. 21(2)(j) · MFA, sichere Kommunikation & Notfallkommunikation",
  "Art. 23": "Art. 23 · Meldepflichten",
  "Art. 23(2)": "Art. 23(2) · Meldepflichten – Frühwarnung, Meldung, Abschlussbericht",
  "Art. 23(3); DVO (EU) 2024/2690": "Art. 23(3) · Meldepflichten nach DVO (EU) 2024/2690",
  "Art. 24": "Art. 24 · Nutzung zertifizierter IKT-Produkte",
  "Art. 25": "Art. 25 · Normen und technische Spezifikationen",

  // --- v6-Katalog (268 Kontrollen): zusätzliche Artikel aus meta.ref -------
  "Art. 2": "Art. 2 · Anwendungsbereich",
  "Art. 2(14)": "Art. 2(14) · Verarbeitung personenbezogener Daten",
  "Art. 3(4)": "Art. 3(4) · Registrierung und Meldung an die Behörde",
  "Art. 4": "Art. 4 · Sektorspezifische Rechtsakte",
  "Art. 20(2)": "Art. 20(2) · Schulung der Leitungsorgane",
  "Art. 21(1)": "Art. 21(1) · Angemessenheit und Verhältnismäßigkeit der Maßnahmen",
  "Art. 21(2)": "Art. 21(2) · Risikomanagementmaßnahmen (Allgemein)",
  "Art. 21(3)": "Art. 21(3) · Sicherheit in der Lieferkette – Bewertung",
  "Art. 21(4)": "Art. 21(4) · Korrekturmaßnahmen bei Nichteinhaltung",
  "Art. 23(1)": "Art. 23(1) · Meldepflicht bei erheblichen Sicherheitsvorfällen",
  "Art. 23(4)(c)": "Art. 23(4)(c) · Zwischenbericht",
  "Art. 23(4)(d)": "Art. 23(4)(d) · Abschlussbericht",
  "Art. 23(4)(e)": "Art. 23(4)(e) · Fortschrittsbericht",
  "Art. 23(7)": "Art. 23(7) · Unterrichtung der Empfänger",
  "Art. 24(1)": "Art. 24(1) · Zertifizierte IKT-Produkte und -Dienste",
  "Art. 26(3)": "Art. 26(3) · Gerichtsstand und Niederlassung",
  "Art. 28(1)": "Art. 28(1) · Datenbank der Domänennamen-Registrierungsdaten",
  "Art. 28(3)": "Art. 28(3) · Richtigkeit der Registrierungsdaten",
  "Art. 28(4)": "Art. 28(4) · Veröffentlichung nicht personenbezogener Daten",
  "Art. 28(5)": "Art. 28(5) · Zugang zu Registrierungsdaten",
  "Art. 28(6)": "Art. 28(6) · Zusammenarbeit und Doppelerfassung",
  "Art. 29(1)": "Art. 29(1) · Austausch von Cybersicherheitsinformationen",
  "Art. 29(4)": "Art. 29(4) · Mitteilung über Teilnahme am Informationsaustausch",
  "Art. 32(2)(a)": "Art. 32(2)(a) · Aufsicht – Vor-Ort-Prüfungen",
  "Art. 32(2)(b)": "Art. 32(2)(b) · Aufsicht – Sicherheitsscans",
  "Art. 32(2)(g)": "Art. 32(2)(g) · Aufsicht – Nachweis der Umsetzung",
  "Art. 32(4)(b)": "Art. 32(4)(b) · Durchsetzung – verbindliche Anweisungen",
  "Art. 32(4)(h)": "Art. 32(4)(h) · Durchsetzung – Bekanntmachung",
};

/** Framework-spezifische Präfix-Labels (id-basiert), für Fälle ohne meta.ref. */
const FRAMEWORK_PREFIX_LABELS: Record<string, Record<string, string>> = {
  NIS2: {
    a: "Art. 21(2)(a) · Risikoanalyse, Sicherheitskonzepte & Inventar",
    ai: "KI & automatisierte Entscheidungen",
    aw: "Awareness & Schulung",
    awr: "Awareness (erweitert)",
    b: "Vorfallbewältigung",
    c: "Business Continuity",
    cont: "Continuity (Notfall)",
    cry: "Kryptographie",
    d: "Lieferkettensicherheit",
    dev: "Sichere Entwicklung",
    e: "Sichere Entwicklung & Wartung",
    ep: "Endpoint-Sicherheit",
    f: "Wirksamkeit & Tests",
    g: "Art. 21(2)(g) · Cyberhygiene, IAM-Basics & Schulung",
    gov: "Governance",
    h: "Kryptographie & Schlüsselmanagement",
    i: "Assetmanagement & Zugriffe",
    iam: "Identity & Access Management",
    inc: "Incident Management",
    j: "Sichere Kommunikation",
    net: "Netzwerksicherheit",
    nis2: "NIS2 Governance (Art. 20)",
    org: "Organisatorische Anforderungen",
    ot: "OT- & ICS-Sicherheit",
    phy: "Physische Sicherheit",
    ppl: "Personalsicherheit",
    reg: "Regulatorik & Compliance",
    risk: "Risikomanagement",
    sup: "Supplier & Third-Party",
    tech: "Technische Schutzmaßnahmen",
    vul: "Schwachstellenmanagement",
  },
  DORA: {
    dora: "DORA – ICT-Risikomanagement",
    ict: "ICT-Risikomanagement",
    tprm: "Third-Party Risk Management",
    inc: "Vorfallbehandlung & Meldung",
    test: "Digital Operational Resilience Testing",
    info: "Informations- & Bedrohungsaustausch",
  },
  GDPR: {
    art: "GDPR Artikel",
    gdpr: "GDPR Artikel",
    ch: "GDPR Kapitel",
  },
  CRA: {
    cra: "CRA – Cyber Resilience Act",
    ann: "CRA Anhänge",
  },
  AIACT: {
    ai: "EU AI Act",
    art: "AI Act – Artikel",
    ann: "AI Act – Anhänge",
  },
};

/**
 * AI Act: Gruppierung nach Kontrollfamilie (meta.family) statt nach ISO-Zuordnung.
 * Vorher landeten Unterkontrollen über meta.iso_ids in Kodes wie „C27"/„C29" ohne
 * Bezeichnung und wurden von ihrer Familie getrennt (SoA-Prüfbericht C-9).
 */
const AIACT_FAMILY: Record<string, { de: string; en: string }> = {
  "A-01": { de: "Art. 5 – Verbotene Praktiken", en: "Art. 5 – Prohibited practices" },
  "A-02": { de: "Art. 6, Anhang I/III – Einstufung als Hochrisiko", en: "Art. 6, Annex I/III – High-risk classification" },
  "A-03": { de: "Art. 9 – Risikomanagementsystem", en: "Art. 9 – Risk management system" },
  "A-04": { de: "Art. 10 – Daten und Daten-Governance", en: "Art. 10 – Data and data governance" },
  "A-05": { de: "Art. 11, Anhang IV – Technische Dokumentation", en: "Art. 11, Annex IV – Technical documentation" },
  "A-06": { de: "Art. 12, 19, 26(6) – Aufzeichnung (Protokolle)", en: "Art. 12, 19, 26(6) – Record-keeping (logs)" },
  "A-07": { de: "Art. 13 – Transparenz und Betriebsanleitung", en: "Art. 13 – Transparency and instructions for use" },
  "A-08": { de: "Art. 14, 26(2) – Menschliche Aufsicht", en: "Art. 14, 26(2) – Human oversight" },
  "A-09": { de: "Art. 15 – Genauigkeit, Robustheit, Cybersicherheit", en: "Art. 15 – Accuracy, robustness, cybersecurity" },
  "A-10": { de: "Art. 17 – Qualitätsmanagementsystem", en: "Art. 17 – Quality management system" },
  "A-11": { de: "Art. 16, 43–49 – Konformität, CE, Registrierung", en: "Art. 16, 43–49 – Conformity, CE, registration" },
  "A-12": { de: "Art. 27 – Grundrechte-Folgenabschätzung", en: "Art. 27 – Fundamental rights impact assessment" },
  "A-13": { de: "Art. 72–73 – Beobachtung nach dem Inverkehrbringen, Vorfälle", en: "Art. 72–73 – Post-market monitoring, incidents" },
  "A-14": { de: "Art. 51–56 – KI-Modelle mit allgemeinem Verwendungszweck", en: "Art. 51–56 – General-purpose AI models" },
  "A-50": { de: "Art. 50 – Transparenz (Übersicht)", en: "Art. 50 – Transparency (overview)" },
  "E": { de: "Querschnitt – KI-Kompetenz, Betroffenenrechte, Lieferkette, Tests", en: "Cross-cutting – AI literacy, rights, supply chain, testing" },
  "T": { de: "Art. 50 – Transparenzpflichten (Leitlinien)", en: "Art. 50 – Transparency obligations (Guidelines)" },
};
export function aiactFamilyLabel(family: string, lang: "de" | "en" = "de"): string | null {
  const f = AIACT_FAMILY[family];
  return f ? f[lang] : null;
}

/** Ermittelt Bucket-Schlüssel + Label für eine Kontrolle. */
function bucketForRow(r: DbControlRow, framework: string): { key: string; label: string; sort: string; labelEn?: string } {
  // 0) AI Act: Kontrollfamilie (meta.family; Fallback aus der ID).
  if (framework === "AIACT") {
    const fam = (typeof r.meta?.family === "string" && r.meta.family)
      || (r.id.match(/^AIACT-(A-\d\d)/)?.[1]) || (r.id.startsWith("AIACT-E-") ? "E" : r.id.startsWith("AIACT-T-") ? "T" : "");
    const lab = AIACT_FAMILY[fam];
    if (lab) {
      const sort = fam.startsWith("A-") ? `1-${fam}` : fam === "E" ? "2-E" : "3-T";
      return { key: `aiact:${fam}`, label: `${fam} · ${lab.de}`, labelEn: `${fam} · ${lab.en}`, sort };
    }
  }

  // 1) NIS2: nutze meta.ref (Artikel) als Bucket → beste Semantik.
  if (framework === "NIS2") {
    const ref = typeof r.meta?.ref === "string" ? r.meta.ref.replace(/^NIS2\s+/i, "").trim() : "";
    if (ref) {
      const label = NIS2_ARTICLE_LABEL[ref] ?? ref;
      // Sort key: extract numeric article + sub-letter
      const m = ref.match(/Art\.\s*(\d+)(?:\((\d+)\)\(([a-z])\))?/i);
      const sort = m ? `${(m[1] ?? "").padStart(3, "0")}-${(m[2] ?? "0").padStart(2, "0")}-${m[3] ?? ""}` : ref;
      return { key: `nis2:${ref}`, label, sort };
    }
  }

  // 1a) ISO 27001: EIGENE Gliederung auf Normebene. Annex A hat 93 Kontrollen
  //     (A.5.1 … A.8.34) plus die Klauseln 4–10; unser Katalog öffnet sie in
  //     318 prüfbare Kontrollen auf. Gruppiert wird deshalb je Annex-A-Kontrolle
  //     bzw. Klausel — nicht je Kapitel (A.5/A.6/A.7/A.8), sonst verschwinden
  //     die 93 Überschriften, an denen Auditor und SoA sich orientieren.
  //     Reihenfolge: Klauseln 4–10 zuerst, dann Annex A (annexSortKey).
  const isoRefRaw = typeof r.meta?.annex === "string" ? r.meta.annex.trim() : "";
  if (framework === "ISO27001" && isoRefRaw) {
    return {
      key: `iso:${isoRefRaw}`,
      label: annexBucketLabel(isoRefRaw, "de"),
      sort: String(annexSortKey(isoRefRaw)).padStart(9, "0"),
    };
  }

  // 1b) Andere Frameworks mit `meta.annex`: gröbere Kapitel-/Annex-Familie.
  const annexRef = isoRefRaw;
  if (annexRef) {
    const am = annexRef.match(/^A\.(\d{1,2})/);
    const cm = annexRef.match(/^(\d{1,2})[.)]/);
    const bkey = am ? `a${am[1]}` : cm ? `c${cm[1]}` : "";
    if (bkey) {
      const label = ISO_BUCKET_LABEL[bkey] ?? bkey.toUpperCase();
      // Klauseln (c4…c10) vor Annex A (a5…a8) sortieren.
      const sort = bkey.startsWith("c")
        ? `0-${bkey.slice(1).padStart(2, "0")}`
        : `1-${bkey.slice(1).padStart(2, "0")}`;
      return { key: bkey, label, sort };
    }
  }

  // 2) meta.iso_ids[0] → ISO-Annex-Bucket (für Frameworks mit ISO-Mapping).
  const isoIds = Array.isArray(r.meta?.iso_ids)
    ? r.meta.iso_ids
    : Array.isArray(r.meta?.iso)
      ? r.meta.iso
      : undefined;
  if (isoIds && isoIds.length > 0 && typeof isoIds[0] === "string") {
    const m = String(isoIds[0]).toLowerCase().match(/^([ac]\d{1,2})/);
    if (m) {
      const bkey = m[1];
      const label = ISO_BUCKET_LABEL[bkey] ?? bkey.toUpperCase();
      return { key: bkey, label, sort: bkey };
    }
  }

  // 3) Framework-spezifische Präfix-Labels.
  const prefix = bucketFromId(r.id).toLowerCase();
  const fwLabels = FRAMEWORK_PREFIX_LABELS[framework];
  if (fwLabels && fwLabels[prefix]) {
    return { key: prefix, label: fwLabels[prefix], sort: prefix };
  }

  // 4) Fallback: id-Präfix als lesbarer String.
  const readable = prefix.toUpperCase();
  return { key: prefix, label: readable, sort: prefix };
}

/** Katalogangaben aus controls.meta für SoA und Berichte (nur gesetzte Felder). */
export function catalogMetaOf(meta: any): ControlQuestion["catalog"] {
  if (!meta || typeof meta !== "object") return undefined;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const out: NonNullable<ControlQuestion["catalog"]> = {
    appliesFrom: str(meta.applies_from), appliesFromNote: str(meta.applies_from_note),
    legalRef: str(meta.legal_ref) ?? str(meta.ref), policyFlag: str(meta.policy_flag),
    statutoryTrigger: str(meta.statutory_trigger), internalTarget: str(meta.internal_target),
    role: Array.isArray(meta.role) ? meta.role.filter((x: unknown) => typeof x === "string") : undefined,
    applicabilityCondition: str(meta.applicability_condition), evidenceHint: str(meta.evidence_hint),
    scored: meta.scored === false ? false : undefined,
    rollupOf: Array.isArray(meta.rollup_of) ? meta.rollup_of.filter((x: unknown) => typeof x === "string") : undefined,
    family: str(meta.family),
  };
  return Object.values(out).some(v => v !== undefined) ? out : undefined;
}

/** Build categories from raw DB control rows (generic per-framework path). */
export function buildDbCategories(rows: DbControlRow[], framework: string = ""): NIS2Category[] {
  const buckets = new Map<string, { label: string; labelEn?: string; sort: string; rows: DbControlRow[] }>();
  for (const r of rows) {
    const { key, label, sort, labelEn } = bucketForRow(r, framework);
    const b = buckets.get(key) ?? { label, labelEn, sort, rows: [] };
    b.rows.push(r);
    buckets.set(key, b);
  }
  const keys = Array.from(buckets.keys()).sort((a, b) => {
    const sa = buckets.get(a)!.sort;
    const sb = buckets.get(b)!.sort;
    return sa.localeCompare(sb, "de", { numeric: true });
  });
  return keys.map((k) => {
    const { label, labelEn, rows: bucketRows } = buckets.get(k)!;
    const parts = label.split(" · ");
    const shortRef = parts.length > 1 ? parts[0] : "";
    const title = parts.length > 1 ? parts.slice(1).join(" · ") : label;
    const partsEn = (labelEn ?? label).split(" · ");
    const titleEn = partsEn.length > 1 ? partsEn.slice(1).join(" · ") : (labelEn ?? label);
    const questions: ControlQuestion[] = bucketRows.map((r) => ({
      id: r.id,
      question: r.req_de ?? r.req_en ?? r.id,
      questionEn: r.req_en ?? r.req_de ?? r.id,
      // `meta.description` trägt im v6-Katalog den erklärenden Text; ohne ihn
      // stünde in der Beschreibung dieselbe Zeile wie in der Frage.
      //
      // Bis zum Deutsch-Seed stand hier zweimal derselbe Ausdruck: der eine
      // englische meta.description landete in BEIDEN Sprachfeldern, womit
      // description === descriptionEn galt und der deutsche Zweig nie deutschen
      // Text zeigen konnte. Seit nis2_iso_deutsch.sql liefert der Katalog
      // meta.description_de; der englische Wert bleibt die Rückfallebene.
      description: (typeof r.meta?.description_de === "string" && r.meta.description_de)
        || (typeof r.meta?.description === "string" && r.meta.description) || r.req_de || "",
      descriptionEn: (typeof r.meta?.description === "string" && r.meta.description) || r.req_en || "",
      status: null,
      catalog: catalogMetaOf(r.meta),
    }));
    return {
      id: `bucket:${k}`,
      article: shortRef,
      title,
      titleEn,
      titleDe: title,
      description: label,
      icon: "shield-check",
      questions,
    };
  });
}



/**
 * Static (no DB) catalogs — returns null when we must load from DB.
 * We now source every framework catalog from `public.controls` so the
 * SoA/Roadmap always reflect the latest DB content and support all
 * frameworks (including the new AI/Privacy/BCM ones). The static
 * NIS2/ISO datasets remain available to other pages via their own
 * imports, but this hub returns null so useFrameworkCatalog fetches.
 */
export function staticCatalogFor(_key: FrameworkKey): NIS2Category[] | null {
  return null;
}

/** Maps `FrameworkKey` (uppercase) to `answers.framework` (as stored in DB). */
export const FRAMEWORK_DB_VALUE: Record<FrameworkKey, string> = {
  NIS2: "NIS2",
  ISO27001: "ISO27001",
  DORA: "DORA",
  BSI_ITGS: "BSI",
  TISAX: "TISAX",
  MaRisk: "MaRisk",
  KRITIS: "KRITIS",
  GDPR: "GDPR",
  CRA: "CRA",
  AIACT: "AIACT",
  ISO42001: "ISO42001",
  NIST_AI_RMF: "NIST_AI_RMF",
  NIST_CSF: "NIST_CSF",
  ISO27701: "ISO27701",
  BCM22301: "BCM22301",
  BSI200_4: "BSI200_4",
  ISO27017: "ISO27017",
  ISO27018: "ISO27018",
  TR03183: "TR03183",
  KI_SEC: "KI_SEC",
};


