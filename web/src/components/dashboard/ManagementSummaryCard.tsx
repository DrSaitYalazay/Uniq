/**
 * ManagementSummaryCard — die „Chef-Sicht in 5 Sekunden" ganz oben im Dashboard.
 * Beantwortet drei Fragen ohne Fachjargon: WO stehe ich? WAS brennt? WAS ist der
 * nächste Schritt? Eine dominante Kennzahl (Ampel) + eine priorisierte
 * Handlungsbedarf-Liste (überfällige Fristen, kritische offene MUSS-Anforderungen)
 * — alles aus vorhandenen Daten, jede Zeile mit 1-Klick-Sprung. Kein leeres
 * Blackout: bei „alles gut" eine Positiv-Meldung.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Gauge, AlertTriangle, CalendarClock, ArrowRight, CheckCircle2, ClipboardList, FileDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { listOpenDeadlines, overdue, type ComplianceDeadline } from "@/lib/deadlineEngine";
import { getReportBrandName } from "@/lib/reportBrand";
import { RK } from "@/lib/reportKit";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { InfoHint } from "@/components/dashboard/InfoHint";

interface FwStats {
  framework: string;
  stats: { total: number; compliancePct: number; criticalOpen: number; criticalLater?: number };
}

interface Freshness {
  total: number; met: number; fromImpl: number; fromGapOnly: number;
  stale: number; staleMonths: number; asOf: string | null;
}

interface Props {
  overview: FwStats[];
  loading: boolean;
  de: boolean;
  freshness?: Freshness;
  /** Dashboard-Filter: nur Fristen dieses Frameworks; Score-Verlauf ausgeblendet (gibt es nur gesamt). */
  frameworkFilter?: string | null;
}

/** Ampel-Ton je Gesamtscore (konsistent zum restlichen Dashboard). */
function ampel(pct: number): { dot: string; text: string; ring: string; pill: string; cardTint: string; wort: { de: string; en: string } } {
  if (pct >= 80) return {
    dot: "st-ja-bg", text: "st-ja-text", ring: "st-ja-border",
    pill: "st-ja-tint st-ja-text",
    cardTint: "st-ja-tint/40",
    wort: { de: "gut aufgestellt", en: "on track" } };
  if (pct >= 50) return {
    dot: "st-teilweise-bg", text: "st-teilweise-text", ring: "st-teilweise-border",
    pill: "st-teilweise-tint st-teilweise-text",
    cardTint: "st-teilweise-tint/40",
    wort: { de: "auf gutem Weg", en: "making progress" } };
  if (pct > 0)   return {
    dot: "st-nein-bg", text: "st-nein-text", ring: "st-nein-border",
    pill: "st-nein-tint st-nein-text",
    cardTint: "st-nein-tint/40",
    wort: { de: "erhöhter Handlungsbedarf", en: "needs attention" } };
  return {
    dot: "bg-muted-foreground/50", text: "text-muted-foreground", ring: "border-border",
    pill: "bg-muted text-muted-foreground", cardTint: "",
    wort: { de: "noch nicht bewertet", en: "not assessed yet" } };
}

/** Kurze, lesbare Framework-Kürzel für die Handlungsliste. */
const FW_SHORT: Record<string, string> = {
  ISO27001: "ISO 27001", NIS2: "NIS2", BSI: "BSI", BSI200_4: "BSI 200-4",
  BCM22301: "ISO 22301", KRITIS: "KRITIS", DORA: "DORA", TISAX: "TISAX",
  GDPR: "DSGVO", ISO27701: "ISO 27701", ISO27017: "ISO 27017", ISO27018: "ISO 27018",
  AIACT: "EU AI Act", ISO42001: "ISO 42001", NIST_AI_RMF: "NIST AI", SOC2: "SOC 2",
  MaRisk: "MaRisk", CRA: "CRA", NIST_CSF: "NIST CSF", TR03183: "TR-03183",
};

export default function ManagementSummaryCard({ overview, loading, de, freshness, frameworkFilter = null }: Props) {
  const { tenantId } = useAuth();
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([]);
  const [trend, setTrend] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!tenantId) return;
    listOpenDeadlines(supabase)
      .then((d) => { if (!cancelled) setDeadlines(d); })
      .catch(() => { if (!cancelled) setDeadlines([]); });
    // Score-Verlauf (Sparkline) aus kpi_snapshots.
    supabase.from("kpi_snapshots").select("taken_at, metrics, has_data").eq("tenant_id", tenantId).order("taken_at", { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        const s = (data ?? [])
          .filter((r: any) => r.has_data?.compliance_overall !== false && typeof r.metrics?.compliance_overall === "number")
          .map((r: any) => Math.round(r.metrics.compliance_overall * 100));
        setTrend(s);
      }, () => {});
    return () => { cancelled = true; };
  }, [tenantId]);

  // Gesamtscore = gepoolte Rohzähler-Compliance (CHG-12): (Σja + 0,5·Σteilweise)/Σanwendbar.
  // Identisch zu Dashboard, Assessment-Übersicht und Gap-Bericht — keine ±1-Abweichung
  // mehr durch gewichtetes Mittel bereits gerundeter Framework-Werte.
  const overallPct = useMemo(() => {
    const num = overview.reduce((a, o) => a + (o.stats.ja || 0) + 0.5 * (o.stats.teilweise || 0), 0);
    const den = overview.reduce((a, o) => a + (o.stats.applicable || 0), 0);
    return den > 0 ? Math.round((num / den) * 100) : 0;
  }, [overview]);

  const criticalOpen = useMemo(() => overview.reduce((a, o) => a + (o.stats.criticalOpen || 0), 0), [overview]);
  // C-6: Pflichten mit künftigem Geltungsbeginn — getrennt, nicht „kritisch offen".
  const criticalLater = useMemo(() => overview.reduce((a, o) => a + (o.stats.criticalLater || 0), 0), [overview]);
  const overdueList = useMemo(
    () => overdue(frameworkFilter ? deadlines.filter(d => d.framework === frameworkFilter) : deadlines),
    [deadlines, frameworkFilter],
  );
  const hasFrameworks = overview.length > 0;

  // Score = überlagerte Compliance: die Umsetzung fließt bereits in
  // useComplianceOverview ein („spätere Phase gewinnt"), daher ist overallPct
  // konsistent mit KPI, Posture und Framework-Reife. Keine zweite Formel.
  const score = overallPct;

  // Datenaktualität — nur für den Info-Hinweis („?"), nicht im Wert selbst.
  const freshText = useMemo(() => {
    if (!freshness || freshness.total === 0) return null;
    const f = freshness;
    const stand = f.asOf ? new Date(f.asOf).toLocaleDateString(de ? "de-DE" : "en-GB", { day: "2-digit", month: "short", year: "numeric" }) : (de ? "—" : "—");
    if (de) {
      return [
        `Stand: ${stand}.`,
        `Dieser Wert ist kein reines Gap-Foto: Er verbindet die Gap-Analyse mit der dokumentierten Umsetzung (spätere Phase gewinnt).`,
        `Von ${f.met} erfüllten Anforderungen sind ${f.fromImpl} durch dokumentierte Umsetzung bestätigt, ${f.fromGapOnly} beruhen (noch) allein auf der Gap-Analyse.`,
        f.stale > 0
          ? `${f.stale} davon wurden seit über ${f.staleMonths} Monaten nicht neu bewertet — eine Neubewertung wird empfohlen, damit der Wert den heutigen Stand zeigt.`
          : `Keine überalterten Bewertungen (> ${f.staleMonths} Monate).`,
      ].join("\n\n");
    }
    return [
      `As of: ${stand}.`,
      `This figure is not a pure gap snapshot: it merges the gap analysis with documented implementation (later phase wins).`,
      `Of ${f.met} met requirements, ${f.fromImpl} are confirmed by documented implementation, ${f.fromGapOnly} still rest on the gap analysis alone.`,
      f.stale > 0
        ? `${f.stale} of those have not been re-assessed for over ${f.staleMonths} months — a re-assessment is recommended so the figure reflects today.`
        : `No stale assessments (> ${f.staleMonths} months).`,
    ].join("\n\n");
  }, [freshness, de]);

  const a = ampel(hasFrameworks ? score : -1);

  // Priorisierte Top-5-Handlungsliste: KONKRETE Punkte statt Sammelzahlen —
  // zuerst einzelne überfällige Fristen, dann kritische MUSS je Framework.
  // Management will To-dos, nicht „44 kritische MUSS".
  const items = useMemo(() => {
    const out: { icon: any; text: string; to: string; tone: string }[] = [];
    for (const d of overdueList.slice(0, 3)) {
      const days = d.due_at ? Math.max(0, Math.floor((Date.now() - new Date(d.due_at).getTime()) / 86400000)) : null;
      const fw = d.framework ? ` (${FW_SHORT[d.framework] ?? d.framework})` : "";
      out.push({
        icon: CalendarClock,
        text: de
          ? `Überfällig${days != null ? ` seit ${days} Tag${days === 1 ? "" : "en"}` : ""}: ${d.label}${fw}`
          : `Overdue${days != null ? ` by ${days} day${days === 1 ? "" : "s"}` : ""}: ${d.label}${fw}`,
        to: "/incidents",
        tone: "st-nein-text",
      });
    }
    const critFw = overview.filter((o) => (o.stats.criticalOpen || 0) > 0)
      .sort((x, y) => (y.stats.criticalOpen || 0) - (x.stats.criticalOpen || 0));
    for (const o of critFw.slice(0, Math.max(0, 5 - out.length))) {
      const n = o.stats.criticalOpen;
      out.push({
        icon: AlertTriangle,
        text: de
          ? `${n} kritische MUSS-Anforderung${n > 1 ? "en" : ""} offen — ${FW_SHORT[o.framework] ?? o.framework}`
          : `${n} critical MUST requirement${n > 1 ? "s" : ""} open — ${FW_SHORT[o.framework] ?? o.framework}`,
        to: "/assessment",
        tone: "st-teilweise-text",
      });
    }
    return out.slice(0, 5);
  }, [overdueList, overview, de]);

  // Der gespeicherte Verlauf (kpi_snapshots) existiert nur über alle Frameworks → bei Filter ausblenden.
  const trendData = useMemo(
    () => (frameworkFilter ? [] : hasFrameworks ? [...trend, score] : trend),
    [trend, score, hasFrameworks, frameworkFilter],
  );

  const printReport = () => {
    // Vorstandsbericht über das gemeinsame Bericht-Shell (Marke, Firmen-Logo/
    // Initial, Footer, Toolbar). Öffnet als VORSCHAU im Tab — kein Auto-Druck.
    const esc = (s: any) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
    const list = items.length ? items.map((it) => `<li>${esc(it.text)}</li>`).join("") : `<li>${de ? "Kein akuter Handlungsbedarf." : "No urgent action."}</li>`;
    const dls = overdueList.slice(0, 10);
    const dlList = dls.length ? dls.map((d) => `<li>${esc(d.label)}${d.due_at ? ` — ${new Date(d.due_at).toLocaleDateString(de ? "de-DE" : "en-GB")}` : ""}</li>`).join("") : `<li>${de ? "Keine überfälligen Fristen." : "No overdue deadlines."}</li>`;
    // Ampelfarbe des Bildschirms (0–100-Skala) — nicht die Risiko-Skala von hexScore.
    const scoreColor = !hasFrameworks ? "#64748b" : score >= 80 ? "#047857" : score >= 50 ? "#b45309" : "#b91c1c";
    const body =
      RK.scoreBox(hasFrameworks ? score : 0, de ? "Sicherheitslage" : "Security posture",
        `${de ? a.wort.de : a.wort.en}${criticalOpen ? ` · ${criticalOpen} ${de ? "kritische MUSS offen" : "critical MUST open"}` : ""}${criticalLater ? ` · ${criticalLater} ${de ? "MUSS gelten erst später" : "MUST apply later"}` : ""}`,
        `${de ? "Stand" : "As of"}: ${new Date().toLocaleDateString(de ? "de-DE" : "en-GB")}`, scoreColor) +
      RK.section(de ? "Handlungsbedarf" : "Action needed") + `<ul style="margin:6px 0 0 18px;font-size:12.5px;line-height:1.6">${list}</ul>` +
      RK.section(de ? "Überfällige Fristen" : "Overdue deadlines") + `<ul style="margin:6px 0 0 18px;font-size:12.5px;line-height:1.6">${dlList}</ul>` +
      RK.section(de ? "Compliance je Framework" : "Compliance per framework") +
      RK.table(["Framework", de ? "Konformität" : "Conformity", de ? "Kritische MUSS offen" : "Critical MUST open", de ? "MUSS, gilt später" : "MUST, applies later"],
        overview.map((o) => [esc(FW_SHORT[o.framework] ?? o.framework), `${o.stats.compliancePct}%`, String(o.stats.criticalOpen || 0), String(o.stats.criticalLater || 0)])) +
      RK.glossary(de ? "de" : "en");
    RK.export("pdf", { title: de ? "Vorstandsbericht — Sicherheitslage" : "Board report — Security posture", sub: getReportBrandName(de), body, file: "Vorstandsbericht", lang: de ? "de" : "en", charts: true });
  };

  return (
    <Card className={a.cardTint}>
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          {/* Dominante Kennzahl */}
          <div className="flex items-center gap-4 md:w-72 shrink-0">
            <div className={`flex items-center justify-center size-20 rounded-full border-4 ${hasFrameworks ? a.ring : "border-muted"}`}>
              <span className="text-2xl font-bold tabular-nums">{loading ? "…" : hasFrameworks ? `${score}%` : "—"}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Gauge className="size-4 text-accent" />
                {de ? "Sicherheitslage" : "Security posture"}
                {hasFrameworks && freshText && (
                  <InfoHint
                    title={de ? "Datenaktualität" : "Data freshness"}
                    text={freshText}
                  />
                )}
              </div>
              <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${a.pill}`}>
                <span className={`size-1.5 rounded-full ${a.dot}`} />
                {de ? a.wort.de : a.wort.en}
              </span>
              {trendData.length >= 2 && (
                <div className="mt-2 w-28" title={de ? "Score-Verlauf" : "Score trend"}>
                  <Sparkline data={trendData} height={22} />
                </div>
              )}
            </div>
          </div>

          {/* Klartext + Handlungsbedarf */}
          <div className="flex-1 min-w-0">
            {!hasFrameworks ? (
              <div className="text-sm text-muted-foreground">
                {de
                  ? "Noch keine Frameworks im Scope. Starten Sie mit "
                  : "No frameworks in scope yet. Start with "}
                <Link to="/context" className="text-accent hover:underline font-medium">{de ? "Scope & Kontext" : "Scope & Context"}</Link>
                {de ? ", dann bewerten Sie die Kontrollen." : ", then assess the controls."}
              </div>
            ) : items.length === 0 ? (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-4 st-ja-text shrink-0" />
                <span className="text-foreground">
                  {de
                    ? `Sie sind zu ${score}% vorbereitet — aktuell kein akuter Handlungsbedarf. Weiter so.`
                    : `You are ${score}% prepared — no urgent action needed right now. Keep it up.`}
                </span>
              </div>
            ) : (
              <>
                <div className="text-sm text-foreground mb-2">
                  {de
                    ? `Sie sind zu ${score}% vorbereitet. Diese Punkte brauchen Ihre Aufmerksamkeit:`
                    : `You are ${score}% prepared. These points need your attention:`}
                </div>
                <div className="space-y-1.5">
                  {items.map((it, i) => {
                    const Icon = it.icon;
                    return (
                      <Link key={i} to={it.to}
                            className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 transition-colors hover:border-accent hover:bg-accent/10 group">
                        <span className="flex items-center gap-2 min-w-0">
                          <Icon className={`size-4 shrink-0 ${it.tone}`} />
                          <span className="text-sm truncate">{it.text}</span>
                        </span>
                        <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
            <div className="flex items-center gap-4 mt-3">
              <Link to="/roadmap" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                <ClipboardList className="size-3" />
                {de ? "Zur Maßnahmen-Roadmap" : "Go to action roadmap"}
              </Link>
              <button type="button" onClick={printReport}
                      className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                <FileDown className="size-3" />
                {de ? "Vorstandsbericht" : "Board report"}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
