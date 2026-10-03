/**
 * IncidentManagement — Vorfall-Werkzeug (Sprint 1).
 *
 * Ein Vorfall wird EINMAL erfasst; ein kurzes Assessment (6-8 Fragen) löst
 * automatisch die Meldepflichten der AKTIVEN Frameworks aus (Regel: unbekannt
 * = ja → Fristen laufen). Je Melde-Stufe wird ein Countdown-Timer mit Ampel
 * (75 % / 90 % / abgelaufen) berechnet. Nicht ausgelöste Pflichten werden mit
 * Begründung dokumentiert (Prüffestigkeit).
 *
 * Datenquelle: incidentReportForms.ts (Formulare/Trigger) + incidentTriggerEngine.ts.
 * Persistenz: useToolData (org-weit geteilt).
 */
import { useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RTooltip } from "recharts";
import { useFramework } from "@/contexts/FrameworkContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToolData } from "@/hooks/useToolData";
import { supabase } from "@/integrations/supabase/client";
import { cancelDeadlinesByRef, createDeadline } from "@/lib/deadlineEngine";
import { AlertOctagon, Plus, Trash2, ShieldAlert, Clock, CheckCircle2, Gauge, Building2, FileDown } from "lucide-react";
import { generateIncidentPdf, generateRegisterPdf, generateRegisterExcel, type IncidentExport, type ChecklistExport } from "@/lib/incidentReportGenerator";
import {
  VORFALL_ASSESSMENT_FELDER,
  VORFALL_FORMULARE,
} from "@/data/incidentReportForms";
import {
  resolveMeldepflichten,
  fristStatus,
  ablaufendeFristen,
  type VorfallAssessment,
  type MeldungInstanz,
  type NichtAusgeloest,
  type FristAmpel,
} from "@/lib/incidentTriggerEngine";
import { CHART_STATUS, CHART_SEVERITY, CHART_EMPTY } from "@/lib/chartPalette";
import { insideSliceLabel } from "@/lib/chartLabels";

type Severity = "low" | "medium" | "high" | "critical";
type Status = "open" | "investigating" | "contained" | "closed";

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: Status;
  detectedAt: string;   // ISO datetime-local (Erkennung)
  occurredAt?: string;  // Eintritt (für MTTD)
  containedAt?: string; // Eingedämmt (für MTTC)
  resolvedAt?: string;  // Behoben/geschlossen (für MTTR)
  notes: string;
  // Vorfall-Werkzeug:
  assessment?: VorfallAssessment;
  meldungen?: MeldungInstanz[];
  nichtAusgeloest?: NichtAusgeloest[];
  meldungenGeneriertAm?: string;
  // CHG-13: strukturierte Melde-/Berichtsfelder für die offizielle Meldung.
  impactDescription?: string;
  measuresTaken?: string;
  measuresPlanned?: string;
  lessonsLearned?: string;
  crossBorder?: boolean;
  affectedStates?: string;              // Komma-separierte ISO-Ländercodes
  serviceRecipientsAffected?: boolean;
}
interface IncidentState { incidents: Incident[] }

// CHG-13: Mapping des internen Vorfall-Modells auf das Report-Format
// (incidentReportGenerator). Die Melde-Kette (meldungen) wird als
// „Meldepflicht-Checkliste" (phase = Framework) sichtbar. Nicht erfasste
// Report-Felder bleiben leer.
function incidentToExport(inc: Incident): IncidentExport {
  const meld = inc.meldungen ?? [];
  return {
    id: inc.id,
    title: inc.title || "Vorfall",
    description: inc.description || "",
    incident_type: "",
    severity: inc.severity,
    status: inc.status,
    occurred_at: inc.occurredAt || null,
    detected_at: inc.detectedAt,
    closed_at: inc.resolvedAt || null,
    reportable: meld.length > 0,
    authority_notified: meld.some(m => m.status === "abgesendet" || m.status === "bestaetigt"),
    authority_name: meld.map(m => m.empfaenger).find(Boolean) || "",
    cross_border_impact: !!inc.crossBorder,
    affected_member_states: inc.affectedStates
      ? inc.affectedStates.split(",").map(s => s.trim()).filter(Boolean)
      : [],
    measures_taken: inc.measuresTaken || "",
    measures_planned: inc.measuresPlanned || "",
    impact_description: inc.impactDescription || "",
    service_recipients_affected: !!inc.serviceRecipientsAffected,
    awareness_confidence: "",
    recipient_notification_status: "",
    recipient_notification_sent_at: null,
    recipient_notification_channel: "",
    recipient_notification_scope: "",
    recipient_notification_proof: "",
    root_cause: inc.notes || "",
    lessons_learned: inc.lessonsLearned || "",
  };
}
// Interner Melde-Status (offen|entwurf|abgesendet|bestaetigt|entfallen) →
// Report-Vokabular (open|in_progress|done|na). Sonst erscheinen abgesendete /
// bestätigte Meldungen im offiziellen Bericht fälschlich als „Offen".
const MELDUNG_STATUS_MAP: Record<string, "open" | "in_progress" | "done" | "na"> = {
  offen: "open",
  entwurf: "in_progress",
  abgesendet: "done",
  bestaetigt: "done",
  entfallen: "na",
};
function meldungenToChecklist(inc: Incident): ChecklistExport[] {
  return (inc.meldungen ?? []).map((m, i) => {
    const mapped = MELDUNG_STATUS_MAP[m.status] ?? "open";
    return {
      id: `${inc.id}-m${i}`,
      incident_id: inc.id,
      phase: m.framework,
      label: m.label + (m.frist ? ` — ${m.frist}` : ""),
      status: mapped,
      responsible: m.empfaenger || "",
      evidence: m.rechtsgrundlage || "",
      // Kein echtes Sendedatum im Modell → completed_at bleibt null (der
      // „done"-Status zeigt die Erledigung; die Frist steht bereits im Label).
      completed_at: null,
      sort_order: i,
    };
  });
}
const DEFAULT: IncidentState = { incidents: [] };

const SEV_META: Record<Severity, { de: string; en: string; cls: string }> = {
  low:      { de: "Niedrig",  en: "Low",      cls: "st-ja-tint st-ja-text" },
  medium:   { de: "Mittel",   en: "Medium",   cls: "st-teilweise-tint st-teilweise-text" },
  high:     { de: "Hoch",     en: "High",     cls: "bg-orange-500/15 text-orange-600" },
  critical: { de: "Kritisch", en: "Critical", cls: "bg-destructive/15 text-destructive" },
};
const STATUS_META: Record<Status, { de: string; en: string }> = {
  open:          { de: "Offen",        en: "Open" },
  investigating: { de: "In Analyse",   en: "Investigating" },
  contained:     { de: "Eingedämmt",   en: "Contained" },
  closed:        { de: "Geschlossen",  en: "Closed" },
};

// Ampel → Tailwind-Klassen (Countdown-Karten)
const AMPEL_CLS: Record<FristAmpel, string> = {
  gruen:         "st-ja-border st-ja-tint st-ja-text",
  gelb:          "st-teilweise-border st-teilweise-tint st-teilweise-text",
  orange:        "border-orange-500/50 bg-orange-500/15 text-orange-700",
  rot:           "border-destructive/50 bg-destructive/15 text-destructive",
  unverzueglich: "border-destructive/50 bg-destructive/10 text-destructive",
  kein_timer:    "border-border bg-muted/40 text-muted-foreground",
};

// Meldestellen-Verzeichnis (konfigurierbar je Mandant — Startwerte)
const MELDESTELLEN: { framework: string; stelle: string; portal: string }[] = [
  { framework: "NIS2 / KRITIS", stelle: "BSI — Melde- und Kontaktstelle (MUK)", portal: "https://mip.bsi.bund.de" },
  { framework: "DORA", stelle: "BaFin — Melde- und Veröffentlichungsplattform (MVP)", portal: "https://portal.mvp.bafin.de" },
  { framework: "DSGVO", stelle: "Zuständige Datenschutz-Aufsichtsbehörde des Landes", portal: "" },
  { framework: "KRITIS-DachG", stelle: "Gemeinsame Meldestelle BBK/BSI", portal: "https://www.bbk.bund.de" },
  { framework: "AI Act", stelle: "Marktüberwachungsbehörde des Mitgliedstaats", portal: "" },
];

// CWS-Framework-Keys → Engine-Framework-Set. KRITIS-DachG ist (noch) kein
// eigenständig wählbares Framework: Betreiber kritischer Anlagen (KRITIS aktiv)
// unterliegen ihm ebenfalls → dann mit anbieten.
function engineFrameworks(activeKeys: string[]): string[] {
  const set = new Set<string>();
  for (const k of activeKeys) {
    if (["NIS2", "DORA", "KRITIS", "GDPR", "CRA", "AIACT"].includes(k)) set.add(k);
  }
  if (set.has("KRITIS")) set.add("KRITIS_DACHG");
  return [...set];
}

const toIso = (localDt: string) => (localDt ? new Date(localDt).toISOString() : new Date().toISOString());

export default function IncidentManagement() {
  const { active } = useFramework();
  const { lang } = useLanguage();
  const { getTenantId } = useAuth();
  const de = lang === "de";
  const { data, setData, loading } = useToolData<IncidentState>("incident-register", "cws-incident-register", DEFAULT);
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [openAssess, setOpenAssess] = useState<Record<string, boolean>>({});

  const engFw = useMemo(() => engineFrameworks(active.map(f => f.key)), [active]);

  const incidents = data.incidents ?? [];
  const shown = statusFilter === "all" ? incidents : incidents.filter(i => i.status === statusFilter);

  // Dashboard: ablaufende Fristen (nächste 24 h) über alle Vorfälle
  const ablaufend = useMemo(() => {
    const all: MeldungInstanz[] = [];
    for (const i of incidents) if (i.status !== "closed") all.push(...(i.meldungen ?? []));
    return ablaufendeFristen(all, 24);
  }, [incidents]);

  const addIncident = () => {
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const inc: Incident = {
      id: crypto.randomUUID(), title: "", description: "", severity: "medium",
      status: "open", detectedAt: localIso, notes: "", assessment: {}, meldungen: [], nichtAusgeloest: [],
    };
    setData(d => ({ incidents: [inc, ...(d.incidents ?? [])] }));
  };
  const patch = (id: string, p: Partial<Incident>) =>
    setData(d => ({ incidents: (d.incidents ?? []).map(i => i.id === id ? { ...i, ...p } : i) }));
  const remove = (id: string) =>
    setData(d => ({ incidents: (d.incidents ?? []).filter(i => i.id !== id) }));

  const setAssess = (id: string, feld: string, value: string) =>
    setData(d => ({
      incidents: (d.incidents ?? []).map(i =>
        i.id === id ? { ...i, assessment: { ...(i.assessment ?? {}), [feld]: value } } : i),
    }));

  // Additiv (Fristen-Engine): resultierende Meldefristen zusätzlich als
  // compliance_deadlines-Zeilen spiegeln — bewusst non-fatal. Schlägt dies fehl,
  // bleibt das lokale Vorfallregister (useToolData) vollständig unberührt.
  // Idempotenz: vor dem Schreiben werden offene Fristen dieses Vorfalls storniert,
  // sodass Mehrfach-Speichern keine Duplikate erzeugt.
  const materializeDeadlines = async (incidentId: string, meldungen: MeldungInstanz[]) => {
    try {
      const tenant = await getTenantId();
      if (!tenant) return;
      await cancelDeadlinesByRef(supabase, "incidents", incidentId);
      for (const m of meldungen) {
        if (!m.frist_ende) continue; // ohne feste Fälligkeit (dauer_h == null) kein Timer
        await createDeadline(supabase, {
          tenant_id: tenant,
          kind: "incident_report",
          framework: m.framework,
          ref_table: "incidents",
          ref_id: incidentId,
          label: `${m.framework} · ${m.label}`,
          starts_at: m.frist_start,
          due_at: m.frist_ende,
          meta: {
            stufe: m.stufe,
            empfaenger: m.empfaenger,
            rechtsgrundlage: m.rechtsgrundlage,
            frist: m.frist,
          },
        });
      }
    } catch {
      /* non-fatal: zentrale Fristen sind additiv; Register bleibt funktionsfähig. */
    }
  };

  const generateMeldungen = (inc: Incident) => {
    const { meldungen, nichtAusgeloest } = resolveMeldepflichten(
      (inc.assessment ?? {}) as VorfallAssessment,
      engFw,
      toIso(inc.detectedAt),
    );
    patch(inc.id, { meldungen, nichtAusgeloest, meldungenGeneriertAm: new Date().toISOString() });
    // Zusätzlich (non-fatal) in die zentrale Fristen-Engine spiegeln.
    void materializeDeadlines(inc.id, meldungen);
  };

  const setMeldungStatus = (incId: string, idx: number, status: MeldungInstanz["status"]) =>
    setData(d => ({
      incidents: (d.incidents ?? []).map(i => {
        if (i.id !== incId) return i;
        const ms = [...(i.meldungen ?? [])];
        if (ms[idx]) ms[idx] = { ...ms[idx], status };
        return { ...i, meldungen: ms };
      }),
    }));

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">{de ? "Lädt…" : "Loading…"}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="text-primary" size={22} />
          {de ? "Vorfall-Management" : "Incident Management"}
        </h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          {de
            ? "Ein Vorfall wird einmal erfasst und bewertet — das Werkzeug bestimmt automatisch die Meldepflichten Ihrer aktiven Frameworks und startet die Fristen-Timer. Regel: „unbekannt“ = „ja“ (Fristen laufen)."
            : "Record an incident once and assess it — the tool automatically derives the reporting obligations of your active frameworks and starts the deadline timers. Rule: “unknown” = “yes” (deadlines run)."}
        </p>
      </header>

      {/* Dashboard-Streifen: ablaufende Fristen */}
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${ablaufend.length ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}>
        <Gauge size={18} className={ablaufend.length ? "text-destructive" : "text-primary"} />
        <div className="text-sm">
          {ablaufend.length
            ? (de ? <><b>{ablaufend.length}</b> Meldefrist(en) laufen in den nächsten 24 h ab oder sind überfällig.</> : <><b>{ablaufend.length}</b> reporting deadline(s) expiring within 24 h or overdue.</>)
            : (de ? "Keine Meldefristen in den nächsten 24 h fällig." : "No reporting deadlines due within 24 h.")}
        </div>
      </div>

      {/* Meldestellen-Verzeichnis */}
      <details className="rounded-xl border border-border bg-card">
        <summary className="cursor-pointer p-4 text-sm font-semibold flex items-center gap-2">
          <Building2 size={15} className="text-primary" />{de ? "Meldestellen-Verzeichnis" : "Reporting authorities"}
        </summary>
        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          {MELDESTELLEN.map(m => (
            <div key={m.framework} className="text-xs rounded-md border border-border bg-muted/30 px-3 py-2">
              <div className="font-semibold">{m.framework}</div>
              <div className="text-muted-foreground">{m.stelle}</div>
              {m.portal && <a href={m.portal} target="_blank" rel="noreferrer" className="text-primary underline break-all">{m.portal}</a>}
            </div>
          ))}
        </div>
      </details>

      {/* Register */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold">{de ? "Vorfallregister (D83)" : "Incident register (D83)"}</h2>
            <span className="text-xs text-muted-foreground">{incidents.length}</span>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
              className="text-xs rounded-md border border-border bg-background px-2 py-1">
              <option value="all">{de ? "Alle Status" : "All statuses"}</option>
              {(Object.keys(STATUS_META) as Status[]).map(s => <option key={s} value={s}>{de ? STATUS_META[s].de : STATUS_META[s].en}</option>)}
            </select>
          </div>
          {incidents.length > 0 && (
            <button
              onClick={() => generateRegisterPdf(incidents.map(incidentToExport), incidents.flatMap(meldungenToChecklist), de ? "de" : "en", null)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5 hover:bg-muted/60"
              title={de ? "Alle Vorfälle als PDF" : "All incidents as PDF"}
            >
              <FileDown size={15} />{de ? "Register-Bericht" : "Register report"}
            </button>
          )}
          <button onClick={addIncident} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5">
            <Plus size={15} />{de ? "Vorfall" : "Incident"}
          </button>
        </div>

        {incidents.length > 0 && (() => {
          const diffs = (from: (i: Incident) => string | undefined, to: (i: Incident) => string | undefined) => {
            const arr: number[] = [];
            for (const i of incidents) {
              const a = from(i), b = to(i);
              if (a && b) { const d = (Date.parse(b) - Date.parse(a)) / 3600000; if (isFinite(d) && d >= 0) arr.push(d); }
            }
            return arr;
          };
          const med = (arr: number[]) => { if (!arr.length) return null; const s = [...arr].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
          const fmt = (h: number | null) => h == null ? "—" : h < 48 ? `${Math.round(h)} h` : `${(h / 24).toFixed(1)} ${de ? "Tage" : "days"}`;
          const cards = [
            { l: "MTTD", sub: de ? "Erkennungszeit (Median)" : "time to detect (median)", v: fmt(med(diffs(i => i.occurredAt, i => i.detectedAt))), n: diffs(i => i.occurredAt, i => i.detectedAt).length },
            { l: "MTTC", sub: de ? "Eindämmungszeit (Median)" : "time to contain (median)", v: fmt(med(diffs(i => i.detectedAt, i => i.containedAt))), n: diffs(i => i.detectedAt, i => i.containedAt).length },
            { l: "MTTR", sub: de ? "Behebungszeit (Median)" : "time to resolve (median)", v: fmt(med(diffs(i => i.detectedAt, i => i.resolvedAt))), n: diffs(i => i.detectedAt, i => i.resolvedAt).length },
          ];
          return (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {cards.map((c, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-3">
                  <div className="text-xs font-semibold text-muted-foreground">{c.l}</div>
                  <div className="text-2xl font-bold text-foreground tabular-nums">{c.v}</div>
                  <div className="text-[10px] text-muted-foreground">{c.sub} · {c.n} {de ? "Vorfälle" : "incidents"}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {incidents.length > 0 && (() => {
          const SEVC: Record<Severity, string> = { low: CHART_STATUS.ja, medium: CHART_STATUS.teilweise, high: CHART_STATUS.nein, critical: CHART_SEVERITY.kritisch };
          const STATC: Record<Status, string> = { open: CHART_STATUS.nein, investigating: CHART_STATUS.teilweise, contained: CHART_STATUS.na, closed: CHART_STATUS.ja };
          const sevCount: Record<Severity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
          const statCount: Record<Status, number> = { open: 0, investigating: 0, contained: 0, closed: 0 };
          for (const i of incidents) { sevCount[i.severity]++; statCount[i.status]++; }
          const totInc = incidents.length;
          const openInc = totInc - statCount.closed;
          const sevOrder: Severity[] = ["critical", "high", "medium", "low"];
          const sevDonut = sevOrder.map(s => ({ name: de ? SEV_META[s].de : SEV_META[s].en, value: sevCount[s], color: SEVC[s] })).filter(d => d.value > 0);
          const sevDD = sevDonut.length ? sevDonut : [{ name: "-", value: 1, color: CHART_EMPTY }];
          const statOrder: Status[] = ["open", "investigating", "contained", "closed"];
          return (
            <div className="flex flex-col md:flex-row md:items-center gap-8 mb-5">
              <div className="w-full md:w-72 shrink-0" style={{ height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    {/* Beschriftung IM Ring (lib/chartLabels) — siehe Regel dort. */}
                    <Pie data={sevDD} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={54} outerRadius={90} paddingAngle={2}
                         labelLine={false} label={insideSliceLabel("percent", 0.08)}>
                      {sevDD.map((d, i) => <Cell key={i} fill={(d as any).color} stroke="hsl(var(--card))" strokeWidth={2} />)}
                    </Pie>
                    <RTooltip contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <div className="text-sm font-semibold text-foreground mb-1">
                    {de ? "Vorfälle nach Schwere" : "Incidents by severity"}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">{openInc} {de ? "offen" : "open"} / {totInc}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {sevOrder.map(s => <span key={s} className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: SEVC[s] }} />{de ? SEV_META[s].de : SEV_META[s].en}: <b className="text-foreground">{sevCount[s]}</b></span>)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground mb-1">{de ? "Status" : "Status"}</div>
                  <div className="flex h-4 w-full rounded-full overflow-hidden border border-border">
                    {statOrder.map(s => statCount[s] > 0 ? <div key={s} style={{ width: `${(statCount[s] / Math.max(1, totInc)) * 100}%`, background: STATC[s] }} title={`${de ? STATUS_META[s].de : STATUS_META[s].en}: ${statCount[s]}`} /> : null)}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    {statOrder.map(s => <span key={s} className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: STATC[s] }} />{de ? STATUS_META[s].de : STATUS_META[s].en}: <b className="text-foreground">{statCount[s]}</b></span>)}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {shown.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 size={16} className="st-ja-text" />
            {de ? "Keine Vorfälle erfasst." : "No incidents recorded."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {shown.map(inc => {
              const assessOpen = openAssess[inc.id];
              return (
              <div key={inc.id} className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={inc.title}
                    onChange={e => patch(inc.id, { title: e.target.value })}
                    placeholder={de ? "Titel des Vorfalls" : "Incident title"}
                    className="flex-1 min-w-[200px] rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium"
                  />
                  <select value={inc.severity} onChange={e => patch(inc.id, { severity: e.target.value as Severity })}
                    className="text-xs rounded-md border border-border bg-background px-2 py-1.5">
                    {(Object.keys(SEV_META) as Severity[]).map(s => <option key={s} value={s}>{de ? SEV_META[s].de : SEV_META[s].en}</option>)}
                  </select>
                  <select value={inc.status} onChange={e => patch(inc.id, { status: e.target.value as Status })}
                    className="text-xs rounded-md border border-border bg-background px-2 py-1.5">
                    {(Object.keys(STATUS_META) as Status[]).map(s => <option key={s} value={s}>{de ? STATUS_META[s].de : STATUS_META[s].en}</option>)}
                  </select>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${SEV_META[inc.severity].cls}`}>{de ? SEV_META[inc.severity].de : SEV_META[inc.severity].en}</span>
                  <button onClick={() => generateIncidentPdf(incidentToExport(inc), meldungenToChecklist(inc), de ? "de" : "en", null)}
                    className="text-muted-foreground hover:text-accent p-1" title={de ? "Vorfall-Bericht (PDF)" : "Incident report (PDF)"}><FileDown size={15} /></button>
                  <button onClick={() => remove(inc.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={15} /></button>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <label className="text-xs text-muted-foreground flex flex-col gap-0.5">
                    {de ? "Eingetreten (MTTD)" : "Occurred (MTTD)"}
                    <input type="datetime-local" value={inc.occurredAt ?? ""} onChange={e => patch(inc.id, { occurredAt: e.target.value || undefined })}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                  </label>
                  <label className="text-xs text-muted-foreground flex flex-col gap-0.5">
                    {de ? "Erkannt am (startet Fristen)" : "Detected at (starts deadlines)"}
                    <input type="datetime-local" value={inc.detectedAt} onChange={e => patch(inc.id, { detectedAt: e.target.value })}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                  </label>
                  <label className="text-xs text-muted-foreground flex flex-col gap-0.5">
                    {de ? "Eingedämmt (MTTC)" : "Contained (MTTC)"}
                    <input type="datetime-local" value={inc.containedAt ?? ""} onChange={e => patch(inc.id, { containedAt: e.target.value || undefined })}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                  </label>
                  <label className="text-xs text-muted-foreground flex flex-col gap-0.5">
                    {de ? "Behoben (MTTR)" : "Resolved (MTTR)"}
                    <input type="datetime-local" value={inc.resolvedAt ?? ""} onChange={e => patch(inc.id, { resolvedAt: e.target.value || undefined })}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                  </label>
                </div>

                {/* Assessment */}
                <div className="rounded-lg border border-border bg-muted/20">
                  <button onClick={() => setOpenAssess(o => ({ ...o, [inc.id]: !o[inc.id] }))}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold">
                    <span>{de ? "Melde-Assessment (unbekannt = ja)" : "Reporting assessment (unknown = yes)"}</span>
                    <span className="text-muted-foreground">{assessOpen ? "▲" : "▼"}</span>
                  </button>
                  {assessOpen && (
                    <div className="px-3 pb-3 space-y-2">
                      {VORFALL_ASSESSMENT_FELDER.map(f => {
                        const val = (inc.assessment ?? {})[f.feld_id as keyof VorfallAssessment] as string | undefined;
                        // abhängige Frage risiko_betroffene nur zeigen wenn personenbezug ja/unbekannt
                        if (f.feld_id === "risiko_betroffene") {
                          const pb = (inc.assessment ?? {}).personenbezug;
                          if (!(pb === "ja" || pb === "unbekannt")) return null;
                        }
                        const opts = f.typ === "choice" && f.feld_id === "risiko_betroffene"
                          ? ["kein", "normal", "hoch", "unbekannt"]
                          : ["ja", "nein", "unbekannt"];
                        return (
                          <div key={f.feld_id} className="text-xs">
                            <div className="text-muted-foreground mb-1">{f.frage}</div>
                            <div className="flex flex-wrap gap-1">
                              {opts.map(o => (
                                <button key={o} onClick={() => setAssess(inc.id, f.feld_id, o)}
                                  className={`px-2 py-0.5 rounded-md border text-[11px] ${val === o ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border bg-background text-muted-foreground"}`}>
                                  {o}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      <button onClick={() => generateMeldungen(inc)}
                        className="mt-1 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold">
                        {de ? "Meldepflichten auflösen & Fristen starten" : "Resolve obligations & start deadlines"}
                      </button>
                      {engFw.length === 0 && (
                        <p className="text-[11px] text-muted-foreground">{de ? "Kein meldepflichtiges Framework aktiv (NIS2/DORA/KRITIS/DSGVO/CRA/AI-Act). In Schritt 1 wählen." : "No reporting framework active. Select in Step 1."}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Ausgelöste Meldungen mit Countdown */}
                {(inc.meldungen?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground">
                      {de ? "Ausgelöste Meldepflichten" : "Triggered obligations"}
                      {inc.meldungenGeneriertAm && <span className="ml-2 font-normal">({new Date(inc.meldungenGeneriertAm).toLocaleString(de ? "de-DE" : "en-GB", { dateStyle: "short", timeStyle: "short" })})</span>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {inc.meldungen!.map((m, idx) => {
                        const s = fristStatus(m);
                        const done = m.status === "abgesendet" || m.status === "bestaetigt";
                        return (
                          <div key={m.framework + m.stufe + idx}
                            className={`rounded-lg border px-3 py-2 ${done ? "st-ja-border st-ja-tint" : AMPEL_CLS[s.ampel]}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold">{m.framework} · {m.label}</span>
                              <span className="text-[10px] tabular-nums flex items-center gap-1">
                                <Clock size={10} />{done ? (de ? "erledigt" : "done") : s.restText}
                                {s.ampel === "rot" && !done && <AlertOctagon size={11} />}
                              </span>
                            </div>
                            <div className="text-[10px] mt-0.5 opacity-80">{m.frist}</div>
                            <div className="text-[10px] mt-0.5 opacity-70">{m.empfaenger} · {m.rechtsgrundlage}</div>
                            <div className="flex gap-1 mt-1.5">
                              {(["offen", "entwurf", "abgesendet", "entfallen"] as MeldungInstanz["status"][]).map(st => (
                                <button key={st} onClick={() => setMeldungStatus(inc.id, idx, st)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] border ${m.status === st ? "border-foreground/40 bg-background font-semibold" : "border-border bg-background/50 text-muted-foreground"}`}>
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Nicht ausgelöst (Prüffestigkeit) */}
                    {(inc.nichtAusgeloest?.length ?? 0) > 0 && (
                      <div className="text-[11px] text-muted-foreground">
                        <span className="font-semibold">{de ? "Nicht ausgelöst: " : "Not triggered: "}</span>
                        {inc.nichtAusgeloest!.map(n => `${n.framework} (${n.grund})`).join(" · ")}
                      </div>
                    )}
                  </div>
                )}

                {/* CHG-13: strukturierte Meldedetails für den offiziellen Vorfall-Bericht */}
                <div className="rounded-md border border-border/60 bg-muted/20 p-2.5 space-y-2">
                  <div className="text-[11px] font-semibold text-muted-foreground">{de ? "Meldedetails (für den Bericht)" : "Reporting details (for the report)"}</div>
                  <textarea value={inc.impactDescription ?? ""} onChange={e => patch(inc.id, { impactDescription: e.target.value })}
                    placeholder={de ? "Auswirkung (betroffene Dienste, Umfang, Dauer …)" : "Impact (affected services, scope, duration …)"}
                    rows={2} className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input value={inc.measuresTaken ?? ""} onChange={e => patch(inc.id, { measuresTaken: e.target.value })}
                      placeholder={de ? "Ergriffene Maßnahmen" : "Measures taken"} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs" />
                    <input value={inc.measuresPlanned ?? ""} onChange={e => patch(inc.id, { measuresPlanned: e.target.value })}
                      placeholder={de ? "Geplante Maßnahmen" : "Planned measures"} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs" />
                    <input value={inc.lessonsLearned ?? ""} onChange={e => patch(inc.id, { lessonsLearned: e.target.value })}
                      placeholder={de ? "Lessons Learned" : "Lessons learned"} className="md:col-span-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <input type="checkbox" checked={!!inc.crossBorder} onChange={e => patch(inc.id, { crossBorder: e.target.checked })} />
                      {de ? "Grenzüberschreitend" : "Cross-border"}
                    </label>
                    {inc.crossBorder && (
                      <input value={inc.affectedStates ?? ""} onChange={e => patch(inc.id, { affectedStates: e.target.value })}
                        placeholder={de ? "Betroffene Mitgliedstaaten (DE, FR …)" : "Affected member states (DE, FR …)"}
                        className="flex-1 min-w-[180px] rounded-md border border-border bg-background px-3 py-1.5 text-xs" />
                    )}
                    <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <input type="checkbox" checked={!!inc.serviceRecipientsAffected} onChange={e => patch(inc.id, { serviceRecipientsAffected: e.target.checked })} />
                      {de ? "Diensteempfänger betroffen" : "Service recipients affected"}
                    </label>
                  </div>
                </div>

                <textarea
                  value={inc.notes}
                  onChange={e => patch(inc.id, { notes: e.target.value })}
                  placeholder={de ? "Notizen / Root-Cause / Lessons Learned…" : "Notes / root cause / lessons learned…"}
                  rows={2}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                />
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
