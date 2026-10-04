/**
 * deadlineEngine — Zentrale Fristen-Engine (ARCHITECTURE.md §2.5, Spec-ITEM 05).
 *
 * EINE Quelle für alle Fristen (`compliance_deadlines`): Incident-Meldeketten,
 * DSAR, KRITIS-Nachweis, Dokument-Reviews, Schulungszyklen, Evidence-Frische …
 *
 * Kompatibilität: `fristStatus` / `ablaufendeFristen` (+ Typen) werden aus
 * `incidentTriggerEngine` RE-EXPORTIERT — bestehende Importe bleiben unverändert
 * gültig, egal ob sie aus `@/lib/incidentTriggerEngine` oder hier importieren.
 * Für das neue Tabellen-Schema (starts_at/due_at statt frist_start/dauer_h) gibt
 * es zusätzlich `deadlineAmpel()` mit derselben 75/90/100-%-Logik.
 */

// ── Kompat-Re-Export (kein bestehender Import bricht) ───────────────────────
export {
  fristStatus,
  ablaufendeFristen,
  type FristStatus,
  type FristAmpel,
} from "@/lib/incidentTriggerEngine";
import { type FristAmpel } from "@/lib/incidentTriggerEngine";
import { visibleFrameworkCodes } from "@/config/uniqFeatures";

// ── Typen der Tabelle public.compliance_deadlines (ARCHITECTURE.md §2.5) ────
export type DeadlineKind =
  | "incident_report"
  | "dsar"
  | "kritis_nachweis"
  | "evidence_review"
  | "document_review"
  | "training_cycle"
  | "audit_cycle"
  | "exercise"
  | "ai_act_deadline"
  | "custom";

export type DeadlineStatus = "open" | "done" | "cancelled" | "overdue";

export interface ComplianceDeadline {
  id: string;
  tenant_id: string;
  kind: DeadlineKind;
  framework?: string | null;
  ref_table?: string | null;
  ref_id?: string | null;
  label: string;
  starts_at: string;            // ISO
  due_at?: string | null;       // ISO — NULL = "unverzüglich"/auf Ersuchen
  recurrence?: string | null;   // Postgres-Interval, z. B. "2 years", "1 year"
  status: DeadlineStatus;
  done_at?: string | null;      // ISO
  meta?: Record<string, unknown>;
  created_at?: string;          // ISO
}

/** Meldestufen der Vorfall-Fristen (meta.stufe) — englische Anzeige. Die Zeile speichert
 *  das deutsche Label; für EN wird es aus der Stufe abgeleitet statt aus dem Freitext. */
const INCIDENT_STAGE_EN: Record<string, string> = {
  fruehwarnung: "Early warning",
  meldung: "Incident notification",
  erstmeldung: "Initial notification",
  stoerungsmeldung: "Initial notification",
  zwischenbericht: "Intermediate report",
  zwischenmeldung: "Intermediate report",
  folgemeldung: "Follow-up notification",
  abschluss: "Final report",
  abschlussbericht: "Final report",
  abschlussmeldung: "Final report",
  nachbericht: "Investigation / final report",
  meldung_behoerde: "Notification to the supervisory authority",
  benachrichtigung_betroffene: "Notification of affected persons",
  registereintrag: "Internal register entry",
};

/** Anzeige-Label einer Frist in der gewählten Sprache. */
export function deadlineLabel(d: Pick<ComplianceDeadline, "kind" | "framework" | "label" | "meta">, de: boolean): string {
  if (de || d.kind !== "incident_report") return d.label;
  const stufe = typeof d.meta?.stufe === "string" ? d.meta.stufe : "";
  const en = INCIDENT_STAGE_EN[stufe];
  if (!en) return d.label;
  return d.framework ? `${d.framework} · ${en}` : en;
}

/** Eingabe zum Anlegen — id/status/created_at werden serverseitig gesetzt. */
export interface NewDeadline {
  tenant_id: string;
  kind: DeadlineKind;
  framework?: string | null;
  ref_table?: string | null;
  ref_id?: string | null;
  label: string;
  starts_at?: string | null;
  due_at?: string | null;
  recurrence?: string | null;
  meta?: Record<string, unknown>;
}

/** Minimaler Supabase-kompatibler Client (Drop-in aus integrations/supabase). */
type DataClient = {
  from: (table: string) => any;
};

const TABLE = "compliance_deadlines";

// ── Ampel für eine Deadline (starts_at → due_at), 75/90/100 % ───────────────
/**
 * Ampel-Zustand einer Deadline anhand ihres Fortschritts zwischen `startsAt`
 * und `dueAt`. Gleiche Schwellen wie `fristStatus` (75 % gelb / 90 % orange /
 * 100 % rot). `dueAt` NULL ⇒ kein Timer.
 */
export function deadlineAmpel(
  dueAt?: string | null,
  startsAt?: string | null,
  now: Date = new Date(),
): { ampel: FristAmpel; pct: number; restMs: number | null } {
  if (!dueAt) return { ampel: "kein_timer", pct: 0, restMs: null };
  const start = startsAt ? new Date(startsAt).getTime() : now.getTime();
  const due = new Date(dueAt).getTime();
  const total = due - start;
  if (!(total > 0)) {
    // Fällig „sofort" / degenerierte Spanne → sofort rot bei Erreichen/Überschreiten.
    const rest = due - now.getTime();
    return { ampel: rest <= 0 ? "rot" : "gruen", pct: rest <= 0 ? 100 : 0, restMs: rest };
  }
  const elapsed = now.getTime() - start;
  const pct = Math.max(0, (elapsed / total) * 100);
  let ampel: FristAmpel = "gruen";
  if (pct >= 100) ampel = "rot";
  else if (pct >= 90) ampel = "orange";
  else if (pct >= 75) ampel = "gelb";
  return { ampel, pct: Math.round(pct), restMs: due - now.getTime() };
}

/** Ampel direkt für ein Deadline-Objekt. */
export function statusOf(d: ComplianceDeadline, now: Date = new Date()) {
  return deadlineAmpel(d.due_at ?? null, d.starts_at, now);
}

// ── CRUD-Helfer gegen den vorhandenen Daten-Client ──────────────────────────

/** Alle offenen/überfälligen Fristen eines Tenants (RLS liefert nur eigene). */
export async function listOpenDeadlines(
  client: DataClient,
): Promise<ComplianceDeadline[]> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .in("status", ["open", "overdue"])
    .order("due_at", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message || "listOpenDeadlines failed");
  const rows = (data ?? []) as ComplianceDeadline[];
  // Fristen inaktiver Frameworks ausblenden (z. B. KRITIS-Meldeketten, die aus einer
  // früheren Framework-Auswahl stammen): sie verfälschen Dashboard, Fristen-Treue
  // und Management-Review. DSGVO gilt immer; KRITIS-DachG folgt KRITIS.
  try {
    const { data: prof } = await client
      .from("company_profiles")
      .select("enabled_frameworks")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const active = new Set(visibleFrameworkCodes(((prof?.enabled_frameworks ?? []) as string[]).filter(Boolean)));
    if (active.size) {
      if (active.has("KRITIS")) active.add("KRITIS_DACHG");
      active.add("GDPR"); active.add("DSGVO");
      return rows.filter(r => !r.framework || !FRAMEWORK_CODES.has(r.framework) || active.has(r.framework));
    }
  } catch { /* Profil nicht lesbar → ungefiltert */ }
  return rows;
}
/** Bekannte Framework-Codes, die an Fristen hängen können (nur diese werden gegen die Auswahl geprüft). */
const FRAMEWORK_CODES = new Set(["NIS2", "DORA", "KRITIS", "KRITIS_DACHG", "CRA", "AIACT", "ISO27001", "BSI", "BSI_ITGS", "TISAX", "MARISK", "ISO42001", "NIST"]);

/** Legt eine Frist an. `starts_at` default = now. */
export async function createDeadline(
  client: DataClient,
  d: NewDeadline,
): Promise<ComplianceDeadline | null> {
  const row = {
    tenant_id: d.tenant_id,
    kind: d.kind,
    framework: d.framework ?? null,
    ref_table: d.ref_table ?? null,
    ref_id: d.ref_id ?? null,
    label: d.label,
    starts_at: d.starts_at ?? new Date().toISOString(),
    due_at: d.due_at ?? null,
    recurrence: d.recurrence ?? null,
    status: "open" as DeadlineStatus,
    meta: d.meta ?? {},
  };
  const { data, error } = await client.from(TABLE).insert(row).select("*").single();
  if (error) throw new Error(error.message || "createDeadline failed");
  return (data ?? null) as ComplianceDeadline | null;
}

/**
 * Schließt eine Frist ab. Bei `recurrence` wird eine Folgeinstanz erzeugt:
 * `starts_at = due_at + recurrence`, `due_at` entsprechend (gleiche Fensterlänge).
 * Rückgabe: die neu erzeugte Folgeinstanz (oder null, wenn keine Wiederkehr).
 */
export async function completeDeadline(
  client: DataClient,
  id: string,
): Promise<ComplianceDeadline | null> {
  // 1) aktuelle Zeile lesen (für recurrence-Rollover)
  const { data: cur, error: readErr } = await client
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message || "completeDeadline read failed");
  const nowIso = new Date().toISOString();

  // 2) als erledigt markieren
  const { error: updErr } = await client
    .from(TABLE)
    .update({ status: "done", done_at: nowIso })
    .eq("id", id);
  if (updErr) throw new Error(updErr.message || "completeDeadline update failed");

  const deadline = cur as ComplianceDeadline | null;
  if (!deadline || !deadline.recurrence) return null;

  // 3) Folgeinstanz: nächste Fälligkeit = alte Fälligkeit + Wiederholung; das
  // neue Fenster beginnt an der alten Fälligkeit (nicht + 2× Wiederholung).
  const nextDue: string | null = deadline.due_at ? addInterval(deadline.due_at, deadline.recurrence) : null;
  const nextStart = deadline.due_at ?? addInterval(deadline.starts_at ?? nowIso, deadline.recurrence);

  return createDeadline(client, {
    tenant_id: deadline.tenant_id,
    kind: deadline.kind,
    framework: deadline.framework ?? null,
    ref_table: deadline.ref_table ?? null,
    ref_id: deadline.ref_id ?? null,
    label: deadline.label,
    starts_at: nextStart,
    due_at: nextDue,
    recurrence: deadline.recurrence,
    meta: deadline.meta ?? {},
  });
}

/**
 * Storniert alle offenen Fristen, die auf eine bestimmte Quelle verweisen
 * (z. B. beim Löschen eines Incidents / Dokuments oder Framework-Deaktivierung).
 */
export async function cancelDeadlinesByRef(
  client: DataClient,
  refTable: string,
  refId: string,
): Promise<void> {
  const { error } = await client
    .from(TABLE)
    .update({ status: "cancelled" })
    .eq("ref_table", refTable)
    .eq("ref_id", refId)
    .in("status", ["open", "overdue"]);
  if (error) throw new Error(error.message || "cancelDeadlinesByRef failed");
}

// ── Dashboard-Kachel-Helfer (rein funktional, ohne Client) ──────────────────

/** Kommende Fristen der nächsten `days` Tage (offen, mit due_at, nicht überfällig). */
export function upcomingDeadlines(
  list: ComplianceDeadline[],
  days = 14,
  now: Date = new Date(),
): ComplianceDeadline[] {
  const horizon = now.getTime() + days * 86_400_000;
  return list
    .filter((d) => d.status === "open" || d.status === "overdue")
    .filter((d) => !!d.due_at)
    .filter((d) => {
      const due = new Date(d.due_at as string).getTime();
      return due >= now.getTime() && due <= horizon;
    })
    .sort(
      (a, b) =>
        new Date(a.due_at as string).getTime() - new Date(b.due_at as string).getTime(),
    );
}

/** Überfällige Fristen (due_at in der Vergangenheit, noch nicht erledigt). */
export function overdue(
  list: ComplianceDeadline[],
  now: Date = new Date(),
): ComplianceDeadline[] {
  return list
    .filter((d) => d.status === "open" || d.status === "overdue")
    .filter((d) => !!d.due_at && new Date(d.due_at as string).getTime() < now.getTime())
    .sort(
      (a, b) =>
        new Date(a.due_at as string).getTime() - new Date(b.due_at as string).getTime(),
    );
}

// ── Interval-Arithmetik (Postgres-Interval-String ODER Objekt) ──────────────

/**
 * Addiert ein Postgres-Interval auf ein ISO-Datum. Akzeptiert String-Formen
 * ("2 years", "1 year", "6 mons", "30 days", "12:00:00") sowie das pg-Objekt
 * `{ years, months, days, hours, minutes, seconds }`.
 */
export function addInterval(baseIso: string, interval: string | Record<string, number>): string {
  const d = new Date(baseIso);
  const parts = typeof interval === "string" ? parseIntervalString(interval) : interval || {};
  if (parts.years) d.setUTCFullYear(d.getUTCFullYear() + parts.years);
  if (parts.months) d.setUTCMonth(d.getUTCMonth() + parts.months);
  if (parts.days) d.setUTCDate(d.getUTCDate() + parts.days);
  if (parts.hours) d.setUTCHours(d.getUTCHours() + parts.hours);
  if (parts.minutes) d.setUTCMinutes(d.getUTCMinutes() + parts.minutes);
  if (parts.seconds) d.setUTCSeconds(d.getUTCSeconds() + parts.seconds);
  return d.toISOString();
}

function parseIntervalString(s: string): {
  years?: number; months?: number; days?: number;
  hours?: number; minutes?: number; seconds?: number;
} {
  const out: Record<string, number> = {};
  const rx = /(-?\d+)\s*(year|yr|mon|month|week|day|hour|hr|min|minute|sec|second)s?/gi;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(s)) !== null) {
    const n = parseInt(m[1], 10);
    const unit = m[2].toLowerCase();
    if (unit.startsWith("year") || unit === "yr") out.years = (out.years || 0) + n;
    else if (unit.startsWith("mon")) out.months = (out.months || 0) + n;
    else if (unit.startsWith("week")) out.days = (out.days || 0) + n * 7;
    else if (unit.startsWith("day")) out.days = (out.days || 0) + n;
    else if (unit.startsWith("hour") || unit === "hr") out.hours = (out.hours || 0) + n;
    else if (unit.startsWith("min")) out.minutes = (out.minutes || 0) + n;
    else if (unit.startsWith("sec")) out.seconds = (out.seconds || 0) + n;
  }
  // "HH:MM:SS"-Anteil
  const t = s.match(/(\d{1,3}):(\d{2}):(\d{2})/);
  if (t) {
    out.hours = (out.hours || 0) + parseInt(t[1], 10);
    out.minutes = (out.minutes || 0) + parseInt(t[2], 10);
    out.seconds = (out.seconds || 0) + parseInt(t[3], 10);
  }
  return out;
}
