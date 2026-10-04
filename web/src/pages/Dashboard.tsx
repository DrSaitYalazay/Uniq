import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LayoutDashboard, TrendingUp, ShieldCheck, AlertTriangle, ListChecks, ArrowRight, CalendarClock, Filter } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useComplianceOverview } from "@/hooks/useComplianceOverview";
import DashboardDeltaBacklog from "@/components/dashboard/DashboardDeltaBacklog";
import FrameworkChartsGrid from "@/components/dashboard/FrameworkChartsGrid";
import GlossaryCard from "@/components/dashboard/GlossaryCard";
import { InfoHint } from "@/components/dashboard/InfoHint";
import { Sparkline } from "@/components/dashboard/Sparkline";
import ManagementSummaryCard from "@/components/dashboard/ManagementSummaryCard";
import UmsetzungFortschrittCard from "@/components/dashboard/UmsetzungFortschrittCard";
import RiskAppetiteCard from "@/components/dashboard/RiskAppetiteCard";
import { PostureCard } from "@/components/PostureCard";
import { ModeToggle } from "@/components/ModeToggle";
import { SetupGate } from "@/components/SetupWizard";
import { useAssessmentMode } from "@/hooks/useAssessmentMode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  listOpenDeadlines,
  upcomingDeadlines,
  overdue,
  deadlineAmpel,
  type ComplianceDeadline,
  type FristAmpel,
} from "@/lib/deadlineEngine";


const FW_LABELS: Record<string, { de: string; en: string; short: string }> = {
  ISO27001: { de: "ISO/IEC 27001", en: "ISO/IEC 27001", short: "ISO 27001" },
  NIS2:     { de: "NIS2", en: "NIS2", short: "NIS2" },
  BSI:      { de: "BSI IT-Grundschutz", en: "BSI IT-Grundschutz", short: "BSI" },
  BSI200_4: { de: "BSI 200-4 (BCM)", en: "BSI 200-4 (BCM)", short: "BSI 200-4" },
  BCM22301: { de: "ISO 22301 (BCM)", en: "ISO 22301 (BCM)", short: "ISO 22301" },
  KRITIS:   { de: "KRITIS", en: "KRITIS", short: "KRITIS" },
  DORA:     { de: "DORA", en: "DORA", short: "DORA" },
  TISAX:    { de: "TISAX / VDA ISA", en: "TISAX / VDA ISA", short: "TISAX" },
  GDPR:     { de: "DSGVO / GDPR", en: "GDPR", short: "GDPR" },
  ISO27701: { de: "ISO 27701", en: "ISO 27701", short: "ISO 27701" },
  AIACT:    { de: "EU AI Act", en: "EU AI Act", short: "AI Act" },
  ISO42001: { de: "ISO 42001", en: "ISO 42001", short: "ISO 42001" },
  NIST_AI_RMF: { de: "NIST AI RMF", en: "NIST AI RMF", short: "NIST AI" },
  MaRisk:   { de: "MaRisk", en: "MaRisk", short: "MaRisk" },
  CRA:      { de: "Cyber Resilience Act", en: "Cyber Resilience Act", short: "CRA" },
  NIST_CSF: { de: "NIST CSF 2.0", en: "NIST CSF 2.0", short: "NIST CSF" },
};

/** Colour a compliance % — green ≥80, amber 50-79, red <50, muted 0. */
function toneOf(pct: number): string {
  if (pct >= 80) return "st-ja-text";
  if (pct >= 50) return "st-teilweise-text";
  if (pct > 0)   return "st-nein-text";
  return "text-muted-foreground";
}

// ── Fristen-Kachel (zentrale Fristen-Engine) ────────────────────────────────
/** Ampel → Punkt-Farbe für die Fristen-Liste. */
const AMPEL_DOT: Record<FristAmpel, string> = {
  gruen:         "st-ja-bg",
  gelb:          "st-teilweise-bg",
  orange:        "bg-orange-500",
  rot:           "st-nein-bg",
  unverzueglich: "st-nein-bg",
  kein_timer:    "bg-muted-foreground/50",
};

/** Additive Kachel: offene compliance_deadlines des Tenants (nächste 14 Tage + überfällig). */
function FristenCard({ de, frameworkFilter = null }: { de: boolean; frameworkFilter?: string | null }) {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ComplianceDeadline[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!tenantId) { setLoading(false); return; }
    setLoading(true);
    listOpenDeadlines(supabase)
      .then((data) => { if (!cancelled) { setRows(data); setFailed(false); } })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tenantId]);

  // Dashboard-Filter: nur Fristen des gewählten Frameworks.
  const scoped = useMemo(
    () => (frameworkFilter ? rows.filter(r => r.framework === frameworkFilter) : rows),
    [rows, frameworkFilter],
  );
  const upcoming = useMemo(() => upcomingDeadlines(scoped, 14), [scoped]);
  const late = useMemo(() => overdue(scoped), [scoped]);

  const fmtDue = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString(de ? "de-DE" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

  const renderRow = (d: ComplianceDeadline, isLate: boolean) => {
    const a = deadlineAmpel(d.due_at ?? null, d.starts_at);
    return (
      <div key={d.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 hover:bg-muted/40 transition-colors">
        <div className="min-w-0 flex items-center gap-2">
          <span className={`shrink-0 size-2.5 rounded-full ${AMPEL_DOT[isLate ? "rot" : a.ampel]}`} />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{d.label}</div>
            <div className="text-[10.5px] text-muted-foreground">
              {d.framework ? `${d.framework} · ` : ""}{fmtDue(d.due_at)}
            </div>
          </div>
        </div>
        <div className={`text-xs font-semibold tabular-nums shrink-0 ${isLate ? "st-nein-text" : "text-muted-foreground"}`}>
          {isLate ? (de ? "überfällig" : "overdue") : (de ? "offen" : "open")}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4 text-accent" />
              {de ? "Fristen" : "Deadlines"}
              <InfoHint
                title={de ? "Was zeigt diese Kachel?" : "What does this show?"}
                text={de
                  ? "Alle terminierten Pflichten der nächsten 14 Tage plus alles, was bereits überfällig ist: gesetzliche Meldeketten (z. B. NIS2 24h/72h), fällige Nachweise und anstehende Reviews. Rot = überfällig. Klick auf einen Eintrag springt zum Vorgang."
                  : "All scheduled obligations for the next 14 days plus anything already overdue: statutory reporting chains (e.g. NIS2 24h/72h), due evidence and upcoming reviews. Red = overdue. Click an item to jump to it."}
              />
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {de
                ? "Nächste 14 Tage und überfällige Fristen (Meldeketten, Nachweise, Reviews …)."
                : "Next 14 days and overdue deadlines (reporting chains, evidence, reviews …)."}
            </p>
          </div>
          {late.length > 0 && (
            <Badge variant="destructive" className="uppercase tracking-wide">
              {late.length} {de ? "überfällig" : "overdue"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="text-sm text-muted-foreground py-6 text-center">
            {de ? "Lade Fristen …" : "Loading deadlines …"}
          </div>
        )}

        {!loading && failed && (
          <div className="text-sm text-muted-foreground py-6 text-center">
            {de ? "Fristen konnten nicht geladen werden." : "Deadlines could not be loaded."}
          </div>
        )}

        {!loading && !failed && upcoming.length === 0 && late.length === 0 && (
          <div className="text-sm text-muted-foreground py-6 text-center">
            {de ? "Keine anstehenden Fristen." : "No upcoming deadlines."}
          </div>
        )}

        {!loading && !failed && (late.length > 0 || upcoming.length > 0) && (
          <div className="space-y-4">
            {late.length > 0 && (
              <div>
                <div className="text-xs font-semibold st-nein-text mb-2 uppercase tracking-wide">
                  {de ? "Überfällig" : "Overdue"}
                </div>
                <div className="space-y-2">{late.map((d) => renderRow(d, true))}</div>
              </div>
            )}
            {upcoming.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
                  {de ? "Nächste 14 Tage" : "Next 14 days"}
                </div>
                <div className="space-y-2">{upcoming.map((d) => renderRow(d, false))}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// UniqSuite: KPI-Kacheln und „Entscheidungsbedarf" wiederholten Zahlen der Kopfkarte.
const SHOW_KPI_TILES = false;
const SHOW_DECISION_CARD = false;

const Dashboard = () => {
  const { lang } = useLanguage();
  const de = lang === "de";
  // Framework-Filter (?fw=CODE in der URL, teilbar). Leer = alle Frameworks.
  const [searchParams, setSearchParams] = useSearchParams();
  const fwParam = searchParams.get("fw");
  const [scopeFrameworks, setScopeFrameworks] = useState<string[]>([]);
  const fwSel = fwParam && scopeFrameworks.includes(fwParam) ? fwParam : null;
  const setFwSel = (v: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (v) next.set("fw", v); else next.delete("fw");
    setSearchParams(next, { replace: true });
  };
  const { loading, enabledFrameworks, primary, secondary, overview, freshness } = useComplianceOverview({ frameworkFilter: fwSel });
  useEffect(() => { setScopeFrameworks(enabledFrameworks); }, [enabledFrameworks]);
  const fwSelLabel = fwSel ? (FW_LABELS[fwSel]?.[de ? "de" : "en"] ?? fwSel) : "";
  const { tenantId } = useAuth();

  // M9: 12-Wochen-Trend der Gesamt-Compliance aus kpi_snapshots (baut sich über
  // die tägliche Snapshot-Aufzeichnung auf, C3). Leer/<2 Punkte → keine Linie.
  const [complHistory, setComplHistory] = useState<number[]>([]);
  useEffect(() => {
    let cancelled = false;
    if (!tenantId) return;
    supabase.from("kpi_snapshots")
      .select("taken_at, metrics, has_data").eq("tenant_id", tenantId)
      .order("taken_at", { ascending: true })
      .then(({ data }: any) => {
        if (cancelled) return;
        const vals: number[] = [];
        for (const r of (data ?? [])) {
          if (r.has_data?.compliance_overall === false) continue;
          const v = r.metrics?.compliance_overall;
          if (typeof v === "number") vals.push(Math.round(v * 1000) / 10);
        }
        setComplHistory(vals.slice(-12));
      }, () => {});
    return () => { cancelled = true; };
  }, [tenantId]);

  const primaryLabel = primary
    ? (FW_LABELS[primary.framework]?.[de ? "de" : "en"] ?? primary.framework)
    : "";
  const primaryPct = primary?.stats.compliancePct ?? 0;
  const primaryTotal = primary?.stats.total ?? 0;
  const primaryCritical = primary?.stats.criticalOpen ?? 0;

  // Node-neutrale Gesamtkennzahlen ÜBER ALLE Frameworks (gleichrangig, kein Master).
  // Muss exakt zur Hero-Kachel passen (dieselbe Formel), damit keine widersprüchlichen
  // Zahlen entstehen (früher: KPI zeigte 0 kritische [nur Master], Hero 44 [alle]).
  const overallPct = useMemo(() => {
    // CHG-12: gepoolte Rohzähler-Formel (Σja + 0,5·Σteilweise)/Σanwendbar — identisch
    // zu Assessment-Übersicht, Gap-Bericht und ManagementSummaryCard. Kein gewichtetes
    // Mittel bereits gerundeter Framework-pct mehr (das konnte ±1 Punkt abweichen).
    // Der Server-KPI-Snapshot (kpi-snapshot.js) nutzt denselben Nenner „anwendbar"
    // (rechnet aber ohne Knoten-Projektion → historische Sparkline ist eine Näherung).
    const num = overview.reduce((a, o) => a + (o.stats.ja || 0) + 0.5 * (o.stats.teilweise || 0), 0);
    const den = overview.reduce((a, o) => a + (o.stats.applicable || 0), 0);
    return den > 0 ? Math.round((num / den) * 100) : 0;
  }, [overview]);
  const totalCritical = useMemo(() => overview.reduce((a, o) => a + (o.stats.criticalOpen || 0), 0), [overview]);
  // C-6: MUSS-Pflichten, die erst später gelten — getrennt, nicht in „kritisch offen".
  const totalLater = useMemo(() => overview.reduce((a, o) => a + (o.stats.criticalLater || 0), 0), [overview]);
  const totalControls = useMemo(() => overview.reduce((a, o) => a + o.stats.total, 0), [overview]);
  const hasFw = overview.length > 0;

  // Live-Kennzahlen für den Umsetzungsfortschritt (F-03): anwendbarer Nenner und
  // umgesetztes Gewicht direkt aus dem aktuellen (Overlay-)Overview — nicht aus
  // dem evtl. bayaten Cache eines früheren Scopes.
  const umsLiveTotal = useMemo(() => overview.reduce((a, o) => a + (o.stats.applicable || 0), 0), [overview]);
  const umsLiveDone = useMemo(() => overview.reduce((a, o) => a + (o.stats.ja || 0) + 0.5 * (o.stats.teilweise || 0), 0), [overview]);

  const { mode } = useAssessmentMode();
  const detail = mode === "expert";

  const kpis = [
    {
      icon: ShieldCheck,
      label: de ? "Gesamt-Compliance" : "Overall compliance",
      value: hasFw ? `${overallPct}%` : "—",
      hint: hasFw
        ? `${fwSel ? `${de ? "nur " : "only "}${fwSelLabel} · ` : (de ? "über alle Frameworks · " : "across all frameworks · ")}${totalControls} ${de ? "Kontrollen" : "controls"}`
        : (de ? "Wählen Sie in Scope Frameworks" : "Select frameworks in Scope"),
      // Der gespeicherte Verlauf existiert nur über alle Frameworks.
      spark: fwSel ? [] : complHistory,
      meta: de
        ? "Quelle: Gap-Analyse + Umsetzung (spätere Phase gewinnt). Aktualisierung: bei jeder Bewertung/Umsetzung. Verantwortlich: ISB. Auslöser < 50 %: Roadmap priorisieren."
        : "Source: Gap analysis + Implementation (later phase wins). Updated: on every assessment/implementation. Owner: ISO. Trigger < 50 %: prioritise roadmap.",
    },
    {
      icon: AlertTriangle,
      label: de ? "Kritische MUSS offen" : "Critical MUSTs open",
      value: hasFw ? String(totalCritical) : "—",
      hint: (fwSel ? `${de ? "nur " : "only "}${fwSelLabel}` : (de ? "über alle Frameworks" : "across all frameworks"))
        + (totalLater > 0 ? (de ? ` · ${totalLater} gelten erst später` : ` · ${totalLater} apply later`) : ""),
      meta: de
        ? "Offene Pflicht-Anforderungen (MUSS) über alle Frameworks. Nicht enthalten: Pflichten, deren Geltungsbeginn noch in der Zukunft liegt (getrennt ausgewiesen). Quelle: Gap-Analyse. Verantwortlich: ISB/Fachbereich. Auslöser > 0: in der Umsetzung abarbeiten."
        : "Open mandatory (MUST) requirements across frameworks. Not included: duties whose start date lies in the future (shown separately). Source: Gap analysis. Owner: ISO/dept. Trigger > 0: work off in Implementation.",
    },
    {
      icon: ListChecks,
      label: de ? "Frameworks im Scope" : "Frameworks in scope",
      value: fwSel ? `1 / ${enabledFrameworks.length}` : String(enabledFrameworks.length),
      hint: fwSel
        ? (de ? `Filter aktiv: ${fwSelLabel}` : `Filter active: ${fwSelLabel}`)
        : (de ? "gleichrangig — kein Master/Hub" : "all equal — no master/hub"),
      meta: de
        ? "Anzahl aktiver Normen/Gesetze. Quelle: Schritt 1 (Scope). Node-Modell: inhaltsgleiche Kontrollen teilen eine Antwort."
        : "Number of active standards/laws. Source: Step 1 (Scope). Node model: equivalent controls share one answer.",
    },
    {
      icon: TrendingUp,
      label: de ? "Kontrollen gesamt" : "Controls total",
      value: hasFw ? String(totalControls) : "—",
      hint: fwSel ? `${de ? "nur " : "only "}${fwSelLabel}` : (de ? "über alle Frameworks im Scope" : "across all frameworks in scope"),
      meta: de
        ? "Bewertbare Kontrollen über alle aktiven Frameworks. Quelle: Katalog + Scope."
        : "Assessable controls across all active frameworks. Source: catalog + scope.",
    },
  ];

  return (
    <SetupGate de={de}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="size-7 text-accent" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {de ? "Management-Dashboard" : "Management dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {fwSel
              ? (de ? `Executive-Übersicht — gefiltert auf ${fwSelLabel}.` : `Executive overview — filtered to ${fwSelLabel}.`)
              : (de ? "Executive-Übersicht über alle Phasen und Frameworks." : "Executive overview across all phases and frameworks.")}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
        <ModeToggle de={de} />
        {enabledFrameworks.length > 1 && (
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="dash-fw" className="text-xs text-muted-foreground">{de ? "Framework" : "Framework"}</label>
            <select
              id="dash-fw"
              value={fwSel ?? "__all__"}
              onChange={(e) => setFwSel(e.target.value === "__all__" ? null : e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="__all__">{de ? "Alle Frameworks" : "All frameworks"}</option>
              {enabledFrameworks.map((f) => (
                <option key={f} value={f}>{FW_LABELS[f]?.[de ? "de" : "en"] ?? f}</option>
              ))}
            </select>
          </div>
        )}
        </div>
      </div>

      {fwSel && (
        <div className="rounded-lg border border-accent/40 bg-accent/5 px-4 py-2.5 text-xs text-foreground flex items-center justify-between gap-3 flex-wrap">
          <span>
            {de
              ? <>Es werden nur Daten zu <b>{fwSelLabel}</b> angezeigt. Framework-übergreifende Kacheln (Sicherheits-Posture, Risiko-Appetit, Score-Verlauf) sind nur in der Ansicht „Alle Frameworks" sichtbar.</>
              : <>Only data for <b>{fwSelLabel}</b> is shown. Cross-framework tiles (security posture, risk appetite, score trend) are only visible in the "All frameworks" view.</>}
          </span>
          <button type="button" onClick={() => setFwSel(null)} className="text-accent hover:underline font-medium">
            {de ? "Alle Frameworks anzeigen" : "Show all frameworks"}
          </button>
        </div>
      )}

      {/* Chef-Sicht in 5 Sekunden: Score + Ampel + Handlungsbedarf ganz oben. */}
      <ManagementSummaryCard overview={overview} loading={loading} de={de} freshness={freshness} frameworkFilter={fwSel} hideDeadlines={detail} />

      {/* UniqSuite: KPI-Kacheln entfallen — Gesamtwert und Trend stehen in der Kopfkarte,
          Kontrollen/Frameworks/kritische MUSS in den Framework-Karten bzw. -Grafiken. */}
      {SHOW_KPI_TILES && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Icon className="size-4 text-accent" /> {k.label}
                  {(k as any).meta && (
                    <InfoHint title={de ? "Kennzahl-Info" : "Metric info"} text={(k as any).meta} />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? "…" : k.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{k.hint}</div>
                {(k as any).spark && (k as any).spark.length >= 2 && (
                  <div className="mt-2">
                    <Sparkline data={(k as any).spark} />
                    <div className="text-[10px] text-muted-foreground mt-0.5">{de ? "Verlauf (letzte Messungen)" : "Trend (recent measurements)"}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>}

      {/* Entscheidungsbedarf — die wirkungsvollste nächste Führungsentscheidung. */}
      {SHOW_DECISION_CARD && !loading && hasFw && (() => {
        const worst = [...overview]
          .filter(o => (o.stats.criticalOpen || 0) > 0)
          .sort((a, b) => (b.stats.criticalOpen || 0) - (a.stats.criticalOpen || 0))[0]
          ?? [...overview].sort((a, b) => a.stats.compliancePct - b.stats.compliancePct)[0];
        if (!worst) return null;
        const fw = FW_LABELS[worst.framework]?.[de ? "de" : "en"] ?? worst.framework;
        const allDone = totalCritical === 0 && overallPct >= 80;
        return (
          <Card className="border-primary/30 bg-primary/[0.03]">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0"><ListChecks className="size-5 text-primary" /></div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">{de ? "Entscheidungsbedarf" : "Decision needed"}</div>
                  {allDone ? (
                    <p className="text-sm text-muted-foreground mt-1">
                      {de ? "Kein akuter Entscheidungsbedarf — Kurs halten und Nachweise aktuell halten." : "No urgent decision — stay the course and keep evidence current."}
                    </p>
                  ) : (
                    <p className="text-sm text-foreground mt-1">
                      {de
                        ? <><b>{fw}</b> priorisieren: {worst.stats.criticalOpen || 0} kritische MUSS offen (Compliance {worst.stats.compliancePct}%). Diese zuerst in der Umsetzung abzuarbeiten hebt den Gesamtscore am stärksten.</>
                        : <>Prioritise <b>{fw}</b>: {worst.stats.criticalOpen || 0} critical MUST open (compliance {worst.stats.compliancePct}%). Working these off first raises the overall score the most.</>}
                    </p>
                  )}
                  {!allDone && (
                    <Link to="/roadmap" className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-2">
                      {de ? "In der Roadmap einplanen" : "Plan in the roadmap"} <ArrowRight className="size-3" />
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Sicherheits-Posture (additive Kennzahl aus vorhandenen Daten) — framework-übergreifend,
          daher nur ohne Framework-Filter. */}
      {detail && !fwSel && <PostureCard de={de} />}

      {/* Fortschrittskurve Plan vs. Ist vs. Prognose (monatlich/wöchentlich, Zeitraum) */}
      {detail && <UmsetzungFortschrittCard de={de} liveTotal={umsLiveTotal} liveDone={umsLiveDone} scopeCodes={fwSel ? [fwSel] : enabledFrameworks} strictScope={!!fwSel} />}

      {/* Management-Grafiken (Führungssicht) — direkt unter den Kennzahlen ganz oben */}
      {detail && !loading && overview.length > 0 && (
        <FrameworkChartsGrid overviews={overview} de={de} />
      )}

      {/* Legende & Begriffe — erklärt ALLE Kürzel/Kennzahlen der Grafiken */}
      {detail && <GlossaryCard de={de} />}

      {/* Framework compliance breakdown — UniqSuite: nur im Überblick; im Detail zeigen die Grafiken dieselben Zahlen. */}
      {!detail && <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {de ? "Framework-Compliance" : "Framework compliance"}
                <InfoHint
                  title={de ? "Wie ist das zu lesen?" : "How to read this?"}
                  text={de
                    ? "Erfüllungsgrad je Norm/Gesetz. Alle Frameworks sind gleichrangig — kein Master, kein Hub. Inhaltsgleiche Kontrollen teilen sich einen Kontroll-Knoten; eine Antwort zählt automatisch für alle Frameworks, die denselben Knoten teilen (Weakest-Link: der strengste Status gewinnt)."
                    : "Fulfilment level per standard/law. All frameworks are equal — no master, no hub. Equivalent controls share a control node; one answer counts automatically for every framework sharing that node (weakest-link: the strictest status wins)."}
                />
              </CardTitle>
              {primary && (
                <p className="text-xs text-muted-foreground mt-1">
                  {de
                    ? "Alle Frameworks sind gleichrangig — kein Master, kein Hub. Inhaltsgleiche Kontrollen teilen sich einen Kontroll-Knoten (same-as); eine Antwort gilt automatisch für alle Frameworks, die denselben Knoten teilen (Weakest-Link-Prinzip)."
                    : "All frameworks are equal — no master, no hub. Equivalent controls share a control node (same-as); one answer counts automatically for every framework sharing that node (weakest-link rule)."}
                </p>
              )}
            </div>
            <Link to="/assessment" className="text-xs text-accent hover:underline inline-flex items-center gap-1">
              {de ? "Zum Assessment" : "Go to Assessment"} <ArrowRight className="size-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-sm text-muted-foreground py-6 text-center">
              {de ? "Lade Compliance-Daten …" : "Loading compliance data …"}
            </div>
          )}

          {!loading && enabledFrameworks.length === 0 && (
            <div className="text-sm text-muted-foreground py-6 text-center">
              {de
                ? "Noch keine Frameworks im Scope. Aktivieren Sie in Phase 1 die relevanten Frameworks."
                : "No frameworks in scope yet. Enable the relevant frameworks in Phase 1."}
            </div>
          )}

          {!loading && overview.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {/* Alle Frameworks gleichrangig — kein Master, keine „abgeleiteten". */}
              {overview.map((o) => {
                const meta = FW_LABELS[o.framework] ?? { de: o.framework, en: o.framework, short: o.framework };
                const label = de ? meta.de : meta.en;
                const pct = o.stats.compliancePct;
                return (
                  <div key={o.framework} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <span className="font-semibold text-base">{label}</span>
                        <span className="block text-xs text-muted-foreground">
                          {o.stats.total} {de ? "Kontrollen" : "controls"} · {o.stats.applicable} {de ? "anwendbar" : "applicable"}
                        </span>
                      </div>
                      <div className={`text-2xl font-bold tabular-nums ${toneOf(pct)}`}>{pct}%</div>
                    </div>
                    <Progress value={pct} className="mt-3 h-2" />
                    <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <div className="text-muted-foreground">{de ? "Umgesetzt" : "Implemented"}</div>
                        <div className="font-semibold st-ja-text">{o.stats.ja}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">{de ? "Teilweise" : "Partial"}</div>
                        <div className="font-semibold st-teilweise-text">{o.stats.teilweise}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">{de ? "Nicht umgesetzt" : "Not implemented"}</div>
                        <div className="font-semibold st-nein-text">{o.stats.nein}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>}

      <div className={`grid gap-4 ${fwSel || !detail ? "" : "md:grid-cols-2"}`}>
        {/* Fristen: im Überblick stehen die überfälligen bereits in der Kopfkarte. */}
        {detail && <FristenCard de={de} frameworkFilter={fwSel} />}
        {/* Risiko-Appetit ist framework-übergreifend → nur ohne Filter. */}
        {!fwSel && <RiskAppetiteCard de={de} />}
      </div>

      {detail && <DashboardDeltaBacklog frameworkFilter={fwSel} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {de ? "Berichte & Nachweise" : "Reports & evidence"}
            <InfoHint
              title={de ? "Wofür sind Berichte?" : "What are reports for?"}
              text={de
                ? "Prüffertige Dokumente zum Herunterladen und Weitergeben — an Geschäftsleitung, Auditoren oder Behörden. Es gibt drei Arten:\n\n• Gap-Bericht: Was ist erfüllt, was fehlt (je Framework).\n• Risiko-Bericht: bewertete Risiken mit Maßnahmen.\n• Roadmap: geplante Umsetzung mit Terminen.\n\nErstellt werden sie direkt im jeweiligen Screen (Assessment / Risiko / Roadmap) als PDF, Word oder Excel."
                : "Audit-ready documents to download and share — with management, auditors or authorities. Three kinds:\n\n• Gap report: what's met, what's missing (per framework).\n• Risk report: assessed risks with measures.\n• Roadmap: planned implementation with dates.\n\nThey are generated in the respective screen (Assessment / Risk / Roadmap) as PDF, Word or Excel."}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {de
              ? "Prüffertige Berichte zum Weitergeben an Leitung, Auditoren und Behörden — als PDF, Word und Excel. Zum Erstellen den passenden Bericht öffnen:"
              : "Audit-ready reports to share with leadership, auditors and authorities — as PDF, Word and Excel. Open the report you need:"}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, to: "/assessment", titleDe: "Gap-Bericht", titleEn: "Gap report", descDe: "Erfüllungsstand je Framework — was ist erfüllt, was fehlt.", descEn: "Fulfilment per framework — what's met, what's missing." },
              { icon: AlertTriangle, to: "/decision", titleDe: "Risiko-Bericht", titleEn: "Risk report", descDe: "Bewertete Risiken samt Maßnahmen und Restrisiko.", descEn: "Assessed risks with measures and residual risk." },
              { icon: ListChecks, to: "/roadmap", titleDe: "Roadmap-Bericht", titleEn: "Roadmap report", descDe: "Maßnahmenplan mit Terminen und Aufwand.", descEn: "Action plan with dates and effort." },
            ].map((r) => {
              const Icon = r.icon;
              return (
                <Link key={r.to} to={r.to}
                      className="group flex flex-col rounded-lg border border-border bg-card p-3 transition-colors hover:border-accent hover:bg-accent/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="size-4 text-accent" />
                    <span className="text-sm font-semibold text-foreground group-hover:text-accent">{de ? r.titleDe : r.titleEn}</span>
                    <ArrowRight className="size-3.5 ml-auto text-muted-foreground group-hover:text-accent" />
                  </div>
                  <span className="text-xs text-muted-foreground leading-snug">{de ? r.descDe : r.descEn}</span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

    </div>
    </SetupGate>
  );
};

export default Dashboard;
