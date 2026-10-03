/**
 * toolLinks — gemeinsame Typen, Schlüssel und Ableitungen für die
 * Werkzeug-Verknüpfungen (US-Audit 2026-09-11: „Werkzeuge sind isoliert").
 *
 *   Richtlinien  ←→ Dokumenten-Lebenszyklus   (policy.documentId)
 *   Lieferanten-Check ←→ TPRM/DORA-Register    (dienstleister.supplierId)
 *   BCM-Prozesse ← Inventar-Services           (prozess.serviceId)
 *   Schulungen → Kontroll-Vorschläge           (Blob `tool-suggestions`)
 *   Beschaffung → Lieferanten-Check            (supplier.sourceRequestId)
 *
 * Die Blob-Typen hier sind bewusst die *minimalen* Felder, die ein fremdes
 * Werkzeug lesen muss. Die Seiten selbst besitzen weiterhin ihre vollen Typen;
 * alle neuen Felder sind optional (alte Blobs laden unverändert).
 */

/* ------------------------------------------------------------------ */
/*  Tool-Keys (useToolData) + localStorage-Spiegel                      */
/* ------------------------------------------------------------------ */
export const DOC_TOOL_KEY = "document-lifecycle";
export const DOC_LS_KEY = "cws-document-lifecycle";
export const SUPPLIER_TOOL_KEY = "supplier-check";
export const SUPPLIER_LS_KEY = "cws-supplier-check";
export const TPRM_TOOL_KEY = "tprm";
export const TPRM_LS_KEY = "cws-tprm";
export const BCM_TOOL_KEY = "bcm";
export const BCM_LS_KEY = "cws-bcm";
export const SUGGESTIONS_TOOL_KEY = "tool-suggestions";
export const SUGGESTIONS_LS_KEY = "cws-tool-suggestions";
export const TRAINING_TOOL_KEY = "training";
export const TRAINING_LS_KEY = "nis2_training";

/* ------------------------------------------------------------------ */
/*  Text-Normalisierung + Titel-Ähnlichkeit                             */
/* ------------------------------------------------------------------ */
const STOP = new Set([
  "und", "oder", "der", "die", "das", "des", "dem", "den", "fuer", "fur", "zur", "zum", "von", "im", "in", "mit",
  "the", "of", "and", "for", "to", "a", "an", "on", "in", "with",
  "richtlinie", "richtlinien", "leitlinie", "policy", "policies", "guideline", "statement",
]);

/** Kleinbuchstaben, Umlaute → ASCII, Sonderzeichen entfernt. */
export function normalizeText(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Stichwörter eines Titels (ohne Stoppwörter, ohne „-richtlinie"-Suffix). */
export function titleTokens(s: string): string[] {
  return normalizeText(s)
    .split(" ")
    .map(t => t.replace(/(richtlinie|leitlinie|policy)$/g, ""))
    .filter(t => t.length >= 3 && !STOP.has(t));
}

function commonPrefix(a: string, b: string): number {
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i;
}
function commonSuffix(a: string, b: string): number {
  let i = 0; while (i < a.length && i < b.length && a[a.length - 1 - i] === b[b.length - 1 - i]) i++; return i;
}

/**
 * Stichwort-Overlap zweier Titel. Gleiche Wörter zählen 1; deutsche Komposita
 * (gemeinsamer Wortanfang ≥ 8 oder Wortende ≥ 10 Zeichen, z. B.
 * „informationssicherheits-richtlinie" ↔ „informationssicherheits-leitlinie")
 * zählen 2, damit die Regel „≥ 2 Wörter" auch für Einwort-Titel greift.
 */
/** KI-Kennzeichen im Titel (KI, AI, AIMS, FRIA, künstliche Intelligenz). */
const KI_MARKE = /\b(ki|ai|aims|fria|kuenstliche)\b/;

export function titleOverlap(a: string, b: string): number {
  // Ein KI-Dokument ist nie „dasselbe" wie ein allgemeines ISMS-/Datenschutz-
  // Dokument: „Internes AIMS-Audit" ≠ „Internes ISMS-Audit", „Grundrechte-
  // Folgenabschätzung (FRIA)" ≠ „DSFA". Ohne diese Sperre galt ein KI-Pflicht-
  // dokument als vorhanden, sobald das ISMS-Gegenstück existierte.
  if (KI_MARKE.test(normalizeText(a)) !== KI_MARKE.test(normalizeText(b))) return 0;
  const ta = titleTokens(a), tb = titleTokens(b);
  if (!ta.length || !tb.length) return 0;
  let score = 0;
  const used = new Set<number>();
  for (const x of ta) {
    for (let j = 0; j < tb.length; j++) {
      if (used.has(j)) continue;
      const y = tb[j];
      if (x === y) { score += x.length >= 12 ? 2 : 1; used.add(j); break; }
      const p = commonPrefix(x, y), s = commonSuffix(x, y);
      if (p >= 8 || (s >= 10 && x.length >= 10 && y.length >= 10)) { score += Math.max(p, s) >= 12 ? 2 : 1; used.add(j); break; }
    }
  }
  return score;
}

/** Name-Gleichheit für Duplikat-/Migrationsabgleich. */
export function sameName(a: string, b: string): boolean {
  const x = normalizeText(a), y = normalizeText(b);
  return !!x && !!y && x === y;
}

/* ------------------------------------------------------------------ */
/*  Dokumenten-Lebenszyklus (Blob `document-lifecycle`)                 */
/* ------------------------------------------------------------------ */
export type LifecycleDocClass = "einmalig" | "register" | "periodisch";
export type LifecycleDocStatus = "draft" | "active" | "archived";
export interface LifecycleDoc {
  id: string;
  name: string;
  docClass: LifecycleDocClass;
  owner: string;
  status: LifecycleDocStatus;
  lastReview: string;
  intervalMonths: number;
  basis?: string;
  notes: string;
}
export interface LifecycleState { docs: LifecycleDoc[] }
export const LIFECYCLE_DEFAULT: LifecycleState = { docs: [] };

export function docNextDue(lastReview: string, intervalMonths: number): Date | null {
  if (!lastReview || !intervalMonths) return null;
  const d = new Date(lastReview);
  if (isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + intervalMonths);
  return d;
}

/** Gesundheitszustand eines Dokuments — Basis der Richtlinien-Ableitung. */
export type DocHealth = "gueltig" | "ueberfaellig" | "entwurf" | "archiviert";
export function docHealth(doc: LifecycleDoc, now: Date = new Date()): DocHealth {
  if (doc.status === "archived") return "archiviert";
  if (doc.status === "draft") return "entwurf";
  if (doc.docClass === "periodisch") {
    const due = docNextDue(doc.lastReview, doc.intervalMonths);
    if (due && due < now) return "ueberfaellig";
  }
  return "gueltig";
}

export const DOC_HEALTH_LABEL: Record<DocHealth, { de: string; en: string }> = {
  gueltig:     { de: "gültig",      en: "valid" },
  ueberfaellig:{ de: "überfällig",  en: "overdue" },
  entwurf:     { de: "Entwurf",     en: "draft" },
  archiviert:  { de: "archiviert",  en: "archived" },
};

/** Richtlinien-Status, abgeleitet aus dem verknüpften Dokument (null = keine Ableitung). */
export type PolicyImplStatus = "draft" | "not_implemented" | "partially_implemented" | "implemented" | "entbehrlich";
export function policyStatusFromDoc(doc: LifecycleDoc | undefined | null): PolicyImplStatus | null {
  if (!doc) return null;
  const h = docHealth(doc);
  if (h === "gueltig") return "implemented";
  if (h === "ueberfaellig" || h === "entwurf") return "partially_implemented";
  return null; // archiviert → wie bisher (manueller Status)
}

/** Bester Dokument-Vorschlag für eine Richtlinie (Overlap ≥ 2). */
export function suggestDocForTitle(titles: string[], docs: LifecycleDoc[], exclude: Set<string> = new Set()): { doc: LifecycleDoc; score: number } | null {
  let best: { doc: LifecycleDoc; score: number } | null = null;
  for (const d of docs) {
    if (!d.name || exclude.has(d.id) || d.status === "archived") continue;
    const score = Math.max(...titles.map(t => titleOverlap(t, d.name)));
    if (score >= 2 && (!best || score > best.score)) best = { doc: d, score };
  }
  return best;
}

/* ------------------------------------------------------------------ */
/*  Lieferanten-Check (Blob `supplier-check`)                           */
/* ------------------------------------------------------------------ */
export type SupplierCriticality = "low" | "medium" | "high" | "critical";
export type SupplierDataAccess = "none" | "internal" | "personal" | "sensitive";
export type SupplierAnswer = "yes" | "no" | "na" | "";
export const SUPPLIER_CERTS = ["ISO27001", "SOC2", "C5", "TISAX", "ISO27017"] as const;
export type SupplierCert = typeof SUPPLIER_CERTS[number];

export interface SupplierQuestion { id: string; de: string; en: string; ref: string; critical?: boolean; onlyIfData?: boolean }
// ISO 27001 A.5.19–A.5.23 + NIS2 Art. 21 + BSI (Quelle: Lieferanten-Check)
export const SUPPLIER_QUESTIONS: SupplierQuestion[] = [
  { id: "q-contract", ref: "A.5.20", critical: true,  de: "Sind Informationssicherheitsanforderungen vertraglich geregelt?", en: "Are information-security requirements contractually agreed?" },
  { id: "q-incident", ref: "NIS2 Art.21", critical: true, de: "Besteht eine vertragliche Meldepflicht bei Sicherheitsvorfällen?", en: "Is there a contractual duty to report security incidents?" },
  { id: "q-avv",      ref: "DSGVO Art.28", critical: true, onlyIfData: true, de: "Liegt bei Zugriff auf personenbezogene Daten ein AVV vor?", en: "Is a DPA in place for access to personal data?" },
  { id: "q-cert",     ref: "A.5.19", critical: false, de: "Verfügt der Lieferant über ein Sicherheitszertifikat (ISO 27001/C5/SOC 2)?", en: "Does the supplier hold a security certificate (ISO 27001/C5/SOC 2)?" },
  { id: "q-subchain", ref: "A.5.21", critical: true,  de: "Ist die Sicherheit in der Liefer-/Unterauftragskette adressiert?", en: "Is security addressed across the (sub-)supply chain?" },
  { id: "q-access",   ref: "A.5.19", critical: false, de: "Sind Zugriffsrechte auf Systeme/Daten minimal & dokumentiert?", en: "Are access rights to systems/data minimal & documented?" },
  { id: "q-audit",    ref: "A.5.22", critical: false, de: "Bestehen Audit-/Nachweisrechte gegenüber dem Lieferanten?", en: "Are audit/evidence rights against the supplier in place?" },
  { id: "q-review",   ref: "A.5.22", critical: false, de: "Wird die Lieferantenleistung regelmäßig überprüft?", en: "Is supplier performance reviewed regularly?" },
  { id: "q-cloud",    ref: "A.5.23", critical: false, de: "Sind bei Cloud-Diensten Sicherheitsanforderungen definiert?", en: "For cloud services, are security requirements defined?" },
  { id: "q-bcp",      ref: "A.5.30", critical: false, de: "Wurde die Notfall-/BCM-Abhängigkeit vom Lieferanten bewertet?", en: "Was BCM dependency on the supplier assessed?" },
  { id: "q-exit",     ref: "A.5.20", critical: false, de: "Ist ein Exit-/Datenrückgabe- & Löschkonzept vereinbart?", en: "Is an exit / data return & deletion concept agreed?" },
];

export interface Supplier {
  id: string;
  name: string;
  service: string;
  criticality: SupplierCriticality;
  dataAccess: SupplierDataAccess;
  certs: SupplierCert[];
  answers: Record<string, SupplierAnswer>;
  lastReview: string;
  reviewMonths: number;
  assessedBy: string;
  archived: boolean;
  notes: string;
  /** Neu: Herkunft aus der Beschaffungs-Freigabe (Request-ID). */
  sourceRequestId?: string;
}
export interface SupplierState { suppliers: Supplier[] }
export const SUPPLIER_DEFAULT: SupplierState = { suppliers: [] };

export const SUPPLIER_CRIT_WEIGHT: Record<SupplierCriticality, number> = { low: 1, medium: 2, high: 3, critical: 4 };

export function supplierApplicableQuestions(s: Supplier): SupplierQuestion[] {
  const hasData = s.dataAccess === "personal" || s.dataAccess === "sensitive";
  return SUPPLIER_QUESTIONS.filter(q => !q.onlyIfData || hasData);
}

/** Risikoscore: Kritikalität × offene kritische Kontrollen → Ampel (identisch zum Lieferanten-Check). */
export function supplierRisk(s: Supplier): { score: number; level: SupplierCriticality; openCritical: number } {
  const qs = supplierApplicableQuestions(s);
  let openCritical = 0, openTotal = 0;
  for (const q of qs) {
    const a = s.answers?.[q.id] ?? "";
    if (a === "no" || a === "") { openTotal++; if (q.critical) openCritical++; }
  }
  const w = SUPPLIER_CRIT_WEIGHT[s.criticality] ?? 2;
  const score = Math.min(100, Math.round((w * (openCritical * 3 + openTotal)) * 100 / (w * qs.length + 8)));
  const level: SupplierCriticality = openCritical >= 2 && w >= 3 ? "critical" : openCritical >= 1 ? "high" : openTotal > 0 ? "medium" : "low";
  return { score, level, openCritical };
}

export const supplierHasPersonalData = (s: Supplier) => s.dataAccess === "personal" || s.dataAccess === "sensitive";

/* ------------------------------------------------------------------ */
/*  TPRM / DORA-Register (Blob `tprm`)                                  */
/* ------------------------------------------------------------------ */
export type TprmKat = "ikt" | "nicht_ikt";
export type TprmKrit = "kritisch_wichtig" | "wichtig" | "normal";
export type TprmStatus = "angebahnt" | "aktiv" | "in_kuendigung" | "beendet";
export const D46_KLAUSELN = ["Zugangs-/Auditrechte", "Kündigungsrechte", "Datenstandorte", "Subunternehmer-Zustimmung", "Sicherheitsanforderungen", "Exit-Unterstützung"];

export interface Dienstleister {
  id: string; name: string; lei: string; kat: TprmKat; kritikalitaet: TprmKrit;
  funktionen: string; region: string;
  riskScore: number; letztePruefung: string;
  klauseln: string[];
  personenbezug: boolean; avvVorhanden: boolean;
  exitStrategie: boolean; exitGetestet: string;
  zertifikatBis: string;
  subdienstleister: string;
  status: TprmStatus;
  /** Neu: Stammdaten kommen aus dem Lieferanten-Check (Supplier.id). */
  supplierId?: string;
}
export interface TprmState { dienstleister: Dienstleister[] }
export const TPRM_DEFAULT: TprmState = { dienstleister: [] };

/** Lieferanten-Kritikalität → DORA-Einstufung. */
export function tprmKritFromSupplier(c: SupplierCriticality): TprmKrit {
  return c === "critical" ? "kritisch_wichtig" : c === "high" ? "wichtig" : "normal";
}

/** Neuer TPRM-Zusatz für einen Lieferanten (nur Zusatzfelder, Stammdaten werden abgeleitet). */
export function newDienstleisterForSupplier(s: Supplier): Dienstleister {
  return {
    id: crypto.randomUUID(), supplierId: s.id,
    name: s.name, lei: "", kat: "ikt", kritikalitaet: tprmKritFromSupplier(s.criticality),
    funktionen: s.service || "", region: "", riskScore: supplierRisk(s).score, letztePruefung: s.lastReview || "",
    klauseln: [], personenbezug: supplierHasPersonalData(s), avvVorhanden: s.answers?.["q-avv"] === "yes",
    exitStrategie: s.answers?.["q-exit"] === "yes", exitGetestet: "", zertifikatBis: "", subdienstleister: "",
    status: s.archived ? "beendet" : "aktiv",
  };
}

/**
 * Stammdaten aus dem Lieferanten-Check auf den TPRM-Eintrag projizieren.
 * Ohne passenden Lieferanten (verwaist oder TPRM-eigen) bleibt der Eintrag wie gespeichert.
 */
export function projectDienstleister(d: Dienstleister, supplier: Supplier | undefined): Dienstleister {
  if (!supplier) return d;
  return {
    ...d,
    name: supplier.name,
    kritikalitaet: tprmKritFromSupplier(supplier.criticality),
    personenbezug: supplierHasPersonalData(supplier),
    letztePruefung: supplier.lastReview || "",
    riskScore: supplierRisk(supplier).score,
  };
}

/* ------------------------------------------------------------------ */
/*  BCM (Blob `bcm`) ← Inventar-Services                                */
/* ------------------------------------------------------------------ */
export interface InventoryService {
  id: string; name: string; category?: string | null; criticality?: number | null;
  owner?: string | null; rto_hours?: number | null; rpo_hours?: number | null;
}
export interface BcmProzess {
  id: string; name: string; verantwortlicher: string;
  kritisch: boolean; rtoStunden: number; rpoStunden: number;
  planVorhanden: boolean; planRtoStunden: number;
  letzteUebung: string; backupRestoreTest: string;
  /** Neu: Herkunft aus Phase 02 Inventar (services.id). */
  serviceId?: string;
}

export function prozessFromService(s: InventoryService): BcmProzess {
  return {
    id: crypto.randomUUID(), serviceId: s.id,
    name: s.name || "", verantwortlicher: s.owner || "",
    kritisch: (s.criticality ?? 0) >= 3,
    rtoStunden: s.rto_hours ?? 24, rpoStunden: s.rpo_hours ?? 24,
    planVorhanden: false, planRtoStunden: 0, letzteUebung: "", backupRestoreTest: "",
  };
}

/** Abweichungen Inventar ↔ BIA für einen verknüpften Prozess. */
export interface BcmDeviation { field: "rto" | "rpo" | "kritisch" | "owner" | "name"; inventar: string; bia: string }
export function bcmDeviations(p: BcmProzess, s: InventoryService): BcmDeviation[] {
  const out: BcmDeviation[] = [];
  if (s.rto_hours != null && s.rto_hours !== p.rtoStunden) out.push({ field: "rto", inventar: `${s.rto_hours}h`, bia: `${p.rtoStunden}h` });
  if (s.rpo_hours != null && s.rpo_hours !== p.rpoStunden) out.push({ field: "rpo", inventar: `${s.rpo_hours}h`, bia: `${p.rpoStunden}h` });
  const invKrit = (s.criticality ?? 0) >= 3;
  if (invKrit !== p.kritisch) out.push({ field: "kritisch", inventar: invKrit ? "kritisch" : "nicht kritisch", bia: p.kritisch ? "kritisch" : "nicht kritisch" });
  if ((s.owner || "") && (s.owner || "") !== (p.verantwortlicher || "")) out.push({ field: "owner", inventar: s.owner || "", bia: p.verantwortlicher || "—" });
  if ((s.name || "") && !sameName(s.name, p.name)) out.push({ field: "name", inventar: s.name, bia: p.name || "—" });
  return out;
}

/* ------------------------------------------------------------------ */
/*  Kontroll-Vorschläge (Blob `tool-suggestions`)                       */
/* ------------------------------------------------------------------ */
export type SuggestionStatus = "offen" | "uebernommen" | "verworfen";
export interface ToolSuggestion {
  id: string;
  source: "trainings" | "documents" | "suppliers" | "bcm" | "procurement";
  framework: string;          // z. B. "ISO27001", "NIS2"
  controlId?: string;         // sequenzielle Katalog-ID (z. B. "a6-08"), NICHT die Annex-Nummer
  controlLabel?: string;      // Anzeige (z. B. "A.6.3 Awareness")
  text: string;
  createdAt: string;          // ISO
  status: SuggestionStatus;
  meta?: Record<string, unknown>;
}
export interface SuggestionState { suggestions: ToolSuggestion[] }
export const SUGGESTIONS_DEFAULT: SuggestionState = { suggestions: [] };

/**
 * Kontrollen, die durch abgeschlossene Pflichtschulungen belegt werden.
 * IDs geprüft gegen die Tabelle controls (30.09.2026) — die früheren IDs
 * (a6-08, a6-10, g-06, gov-01) gibt es im Katalog nicht mehr; Vorschläge liefen ins Leere.
 *   ISO27001/NIS2 TRN-03 = geplante Sensibilisierung und rollenbezogene Schulungen
 *   ISO27001/NIS2 TRN-05 = Wirksamkeit der Schulungen (Quiz)
 *   NIS2 C25.1           = Schulung der Mitglieder des Leitungsorgans (Art. 20 Abs. 2)
 */
export const TRAINING_CONTROL_TARGETS: Array<{ framework: string; controlId: string; label: string; roles: string[] }> = [
  { framework: "ISO27001", controlId: "TRN-03", label: "ISO 27001 A.6.3 — Awareness/Schulung",       roles: ["all", "management", "it", "procurement", "developer", "ot"] },
  { framework: "ISO27001", controlId: "TRN-05", label: "ISO 27001 A.6.3 — Schulungswirksamkeit",     roles: ["all"] },
  { framework: "NIS2",     controlId: "TRN-03", label: "NIS2 Art. 21 (2) g — Awareness-Schulungen", roles: ["all", "it", "procurement", "developer", "ot"] },
  { framework: "NIS2",     controlId: "C25.1",  label: "NIS2 Art. 20 — Schulung der Geschäftsleitung", roles: ["management"] },
];
