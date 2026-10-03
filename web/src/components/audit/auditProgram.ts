/**
 * auditProgram — Datenmodell des Audit-Programms (ISO 27001 9.2, Phase 07).
 *
 * Bisher lag GENAU EIN Audit (auditor/datum/urteil + items) flach im Blob
 * `audit-workbench`. Jetzt gibt es `audits: AuditRecord[]` + `activeAuditId`.
 *
 * Rückwärtskompatibilität (zwei Richtungen):
 *  • LESEN: fehlt `audits`, wird aus den alten Top-Level-Feldern ein Record
 *    (status „laufend") erzeugt und als aktiv gesetzt (`normalizeAuditState`).
 *  • SCHREIBEN: die alten Top-Level-Felder `items/auditor/datum/urteil` werden
 *    weiter mitgeschrieben — als Spiegel des AKTIVEN Audits (`mirrorActive`).
 *    Andere Konsumenten (Bericht, KVP-Sync mit `audit-actions`) bleiben so
 *    unverändert lauffähig.
 *
 * Alle Funktionen sind pur (kein React) und werden vom Workbench-State genutzt.
 */

export type Sev = "major" | "minor" | "beobachtung";  // beobachtung = OFI (Opportunity for Improvement)
export type FindingState = "offen" | "in_bearbeitung" | "erledigt";

export interface AuditItem {
  severity: Sev;
  riskIds: string[];
  manualRisks: { id: string; text: string }[];
  measures: string;
  note: string;
  evidence: string;   // Nachweis/Beleg: Referenz, URL, Dateiname o. Ä.
  state: FindingState;
  owner?: string;     // Verantwortlich für die Korrekturmaßnahme (Personen-Register, "Name (Titel)")
  due?: string;       // Frist der Korrekturmaßnahme (YYYY-MM-DD)
  recheck?: string;   // Wiederholungsprüfung / Wirksamkeitsprüfung (YYYY-MM-DD)
  closedAt?: string;  // ISO — gesetzt, sobald der Befund „erledigt" wird
}

export type AuditTyp = "intern" | "extern" | "lieferanten" | "zertifizierung";
export type AuditStatus = "geplant" | "laufend" | "abgeschlossen";

export interface AuditRecord {
  id: string;
  typ: AuditTyp;
  titel: string;
  auditor: string;
  datum: string;                 // YYYY-MM-DD
  urteil: string;
  status: AuditStatus;
  scopeFrameworks: string[];     // DB-Codes (wie company_profiles.enabled_frameworks)
  items: Record<string, AuditItem>; // "FW::controlId" → Befund
  abgeschlossenAm?: string;      // YYYY-MM-DD
  naechstesAudit?: string;       // YYYY-MM-DD (Vorschlag/Planung beim Abschluss)
  createdAt?: string;            // ISO
}

export interface AuditState {
  // Spiegel des aktiven Audits (Legacy-Konsumenten lesen weiterhin diese Felder)
  items: Record<string, AuditItem>;
  auditor?: string;
  datum?: string;
  urteil?: string;
  // Audit-Programm
  audits?: AuditRecord[];
  activeAuditId?: string;
}

export const DEFAULT_AUDIT_STATE: AuditState = { items: {} };

/** Id des Records, der aus dem alten Ein-Audit-Zustand migriert wird (deterministisch → normalize ist pur). */
export const LEGACY_AUDIT_ID = "audit-1";

export const AUDIT_TYP_LABEL: Record<AuditTyp, { de: string; en: string }> = {
  intern:         { de: "Internes Audit", en: "Internal audit" },
  extern:         { de: "Externes Audit", en: "External audit" },
  lieferanten:    { de: "Lieferantenaudit", en: "Supplier audit" },
  zertifizierung: { de: "Zertifizierungsaudit", en: "Certification audit" },
};
export const AUDIT_STATUS_LABEL: Record<AuditStatus, { de: string; en: string; cls: string }> = {
  geplant:       { de: "Geplant", en: "Planned", cls: "bg-slate-500/15 text-slate-600 dark:text-slate-300" },
  laufend:       { de: "Laufend", en: "In progress", cls: "bg-amber-500/15 text-amber-600" },
  abgeschlossen: { de: "Abgeschlossen", en: "Completed", cls: "bg-emerald-500/15 text-emerald-700" },
};

export const todayIso = (): string => new Date().toISOString().slice(0, 10);

/** Datum + n Monate (Kalendermonate, YYYY-MM-DD). Ungültige Eingabe → heute + n Monate. */
export function addMonthsIso(dateIso: string | undefined, months: number): string {
  const base = dateIso && /^\d{4}-\d{2}-\d{2}/.test(dateIso) ? new Date(dateIso + "T00:00:00Z") : new Date();
  if (Number.isNaN(base.getTime())) return addMonthsIso(undefined, months);
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + months, base.getUTCDate()));
  return d.toISOString().slice(0, 10);
}

export function defaultAuditTitle(typ: AuditTyp, datum: string | undefined, de: boolean): string {
  const year = (datum && /^\d{4}/.test(datum)) ? datum.slice(0, 4) : String(new Date().getFullYear());
  return `${de ? AUDIT_TYP_LABEL[typ].de : AUDIT_TYP_LABEL[typ].en} ${year}`;
}

/** Hat der alte Ein-Audit-Zustand Inhalt, der migriert werden muss? */
export function hasLegacyContent(s: AuditState | null | undefined): boolean {
  if (!s) return false;
  return Object.keys(s.items ?? {}).length > 0 || !!(s.auditor || s.datum || s.urteil);
}

export function activeAudit(s: AuditState): AuditRecord | null {
  const list = s.audits ?? [];
  return list.find(a => a.id === s.activeAuditId) ?? null;
}

/** Top-Level-Spiegel (items/auditor/datum/urteil) auf das aktive Audit setzen. */
export function mirrorActive(s: AuditState): AuditState {
  const act = activeAudit(s);
  if (!act) return s;
  if (s.items === act.items && (s.auditor ?? "") === act.auditor && (s.datum ?? "") === act.datum && (s.urteil ?? "") === act.urteil) return s;
  return { ...s, items: act.items, auditor: act.auditor, datum: act.datum, urteil: act.urteil };
}

/**
 * Ist der Zustand bereits im Programm-Format und konsistent gespiegelt?
 * Hinweis: nach JSON-Roundtrip (DB/localStorage) sind `items` und `audits[i].items`
 * verschiedene Objekte mit gleichem Inhalt → strukturell vergleichen, sonst würde
 * jeder Ladevorgang eine (inhaltlich leere) Migration auslösen.
 */
export function isNormalized(s: AuditState | null | undefined): boolean {
  if (!s || !Array.isArray(s.audits) || s.audits.length === 0) return false;
  const act = activeAudit(s);
  if (!act) return false;
  if ((s.auditor ?? "") !== act.auditor || (s.datum ?? "") !== act.datum || (s.urteil ?? "") !== act.urteil) return false;
  if (s.items === act.items) return true;
  try { return JSON.stringify(s.items ?? {}) === JSON.stringify(act.items ?? {}); } catch { return false; }
}

/**
 * Migration + Konsistenz. Pur: liefert dasselbe Objekt zurück, wenn nichts zu tun ist.
 *  • `audits` fehlt/leer → aus den Legacy-Feldern EIN Record (laufend) erzeugen und aktivieren.
 *    (Auch ein komplett leerer Zustand erhält so ein erstes Audit — der Arbeitsbereich
 *    braucht immer ein aktives Audit.)
 *  • `activeAuditId` ungültig → laufendes, sonst geplantes, sonst letztes Audit aktivieren.
 *  • Top-Level-Felder = Spiegel des aktiven Audits.
 */
export function normalizeAuditState(input: AuditState | null | undefined, de = true): AuditState {
  const s: AuditState = input ?? DEFAULT_AUDIT_STATE;
  if (isNormalized(s)) return s;
  let audits: AuditRecord[] = Array.isArray(s.audits) ? s.audits.filter(a => a && typeof a.id === "string") : [];
  let activeId = s.activeAuditId;
  if (audits.length === 0) {
    const datum = s.datum ?? "";
    const rec: AuditRecord = {
      id: LEGACY_AUDIT_ID,
      typ: "intern",
      titel: defaultAuditTitle("intern", datum, de),
      auditor: s.auditor ?? "",
      datum,
      urteil: s.urteil ?? "",
      status: "laufend",
      scopeFrameworks: [],
      items: s.items ?? {},
    };
    audits = [rec];
    activeId = rec.id;
  }
  // Defensive: fehlende Felder in gespeicherten Records auffüllen (ältere Schreiber).
  audits = audits.map(a => ({
    ...a,
    typ: a.typ ?? "intern",
    titel: a.titel ?? "",
    auditor: a.auditor ?? "",
    datum: a.datum ?? "",
    urteil: a.urteil ?? "",
    status: a.status ?? "laufend",
    scopeFrameworks: Array.isArray(a.scopeFrameworks) ? a.scopeFrameworks : [],
    items: a.items ?? {},
  }));
  if (!activeId || !audits.some(a => a.id === activeId)) {
    activeId = (audits.find(a => a.status === "laufend") ?? audits.find(a => a.status === "geplant") ?? audits[audits.length - 1]).id;
  }
  return mirrorActive({ ...s, audits, activeAuditId: activeId });
}

/** Aktives Audit patchen (Objekt oder Updater) und Spiegel nachziehen. */
export function updateActiveAudit(s: AuditState, patch: Partial<AuditRecord> | ((a: AuditRecord) => Partial<AuditRecord>), de = true): AuditState {
  const n = normalizeAuditState(s, de);
  const act = activeAudit(n);
  if (!act) return n;
  const p = typeof patch === "function" ? patch(act) : patch;
  const next: AuditRecord = { ...act, ...p, id: act.id };
  return mirrorActive({ ...n, audits: (n.audits ?? []).map(a => a.id === act.id ? next : a) });
}

/** Beliebiges Audit patchen (z. B. Abschließen eines nicht-aktiven Audits). */
export function updateAudit(s: AuditState, id: string, patch: Partial<AuditRecord>, de = true): AuditState {
  const n = normalizeAuditState(s, de);
  if (!(n.audits ?? []).some(a => a.id === id)) return n;
  return mirrorActive({ ...n, audits: (n.audits ?? []).map(a => a.id === id ? { ...a, ...patch, id } : a) });
}

export function setActiveAudit(s: AuditState, id: string, de = true): AuditState {
  const n = normalizeAuditState(s, de);
  if (!(n.audits ?? []).some(a => a.id === id) || n.activeAuditId === id) return n;
  return mirrorActive({ ...n, activeAuditId: id });
}

export function addAudit(s: AuditState, rec: AuditRecord, activate = true, de = true): AuditState {
  const n = normalizeAuditState(s, de);
  const audits = [...(n.audits ?? []), rec];
  return mirrorActive({ ...n, audits, activeAuditId: activate ? rec.id : n.activeAuditId });
}

/** Löschen nur ohne Befunde; das letzte Audit bleibt immer bestehen. */
export function removeAudit(s: AuditState, id: string, de = true): AuditState {
  const n = normalizeAuditState(s, de);
  const list = n.audits ?? [];
  const rec = list.find(a => a.id === id);
  if (!rec || Object.keys(rec.items ?? {}).length > 0 || list.length <= 1) return n;
  const audits = list.filter(a => a.id !== id);
  const activeId = n.activeAuditId === id ? undefined : n.activeAuditId;
  return normalizeAuditState({ ...n, audits, activeAuditId: activeId }, de);
}

/** Befund-Zählung eines Audits (nur dokumentierte Befunde = items). */
export function countAuditFindings(rec: AuditRecord): { total: number; major: number; minor: number; ofi: number; erledigt: number; offen: number } {
  let major = 0, minor = 0, ofi = 0, erledigt = 0;
  const items = Object.values(rec.items ?? {});
  for (const it of items) {
    if (it.state === "erledigt") { erledigt++; continue; }
    if (it.severity === "major") major++;
    else if (it.severity === "beobachtung") ofi++;
    else minor++;
  }
  return { total: items.length, major, minor, ofi, erledigt, offen: items.length - erledigt };
}

/** Sortierung für Tabelle/Trend: nach Datum aufsteigend (leeres Datum zuletzt), dann Anlage. */
export function sortAudits(list: AuditRecord[]): AuditRecord[] {
  return [...list].sort((a, b) => {
    const da = a.datum || "9999-12-31", db = b.datum || "9999-12-31";
    if (da !== db) return da < db ? -1 : 1;
    return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
  });
}
