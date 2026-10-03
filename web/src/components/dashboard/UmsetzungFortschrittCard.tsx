/**
 * UmsetzungFortschrittCard — Fortschritt der Umsetzung mit 4 Ansichten:
 *   • Prognose   — kumulative %-Kurve + lineare Hochrechnung auf 100 % (Ø-Tempo).
 *   • Monatlich  — pro Monat umgesetzte Aufgaben (Balken, Fertig=1 / Laufend=0,5).
 *   • Wöchentlich— dito je Woche.
 *   • Kumulativ  — laufende Summe über die Zeit.
 * Optionaler Zeitraum (von–bis). Datenquelle: org-weiter Datensatz
 * "umsetzung-progress" (Single Source, in der Umsetzung dedupliziert berechnet):
 * { total, events: [{ d: "YYYY-MM-DD", w: 1|0.5 }] }.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Flag } from "lucide-react";
import { useToolData } from "@/hooks/useToolData";
import { supabase } from "@/integrations/supabase/client";
import { listOpenDeadlines, deadlineAmpel, type ComplianceDeadline, type FristAmpel } from "@/lib/deadlineEngine";

type Ansicht = "prognose" | "monat" | "woche" | "kumulativ" | "reifegrad";
interface ProgressEvent { d: string; w: number; k?: string; f?: string[] }
interface ProgressData { total: number; events: ProgressEvent[] }

function isoWeekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - day + 3);
  const firstThu = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((t.getTime() - firstThu.getTime()) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
  return `${t.getUTCFullYear()}-KW${String(week).padStart(2, "0")}`;
}
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key: string, de: boolean): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(de ? "de-DE" : "en-GB", { month: "short", year: "2-digit" });
}

const AMPEL: Record<FristAmpel, string> = {
  gruen: "st-ja-border st-ja-text",
  gelb: "st-teilweise-border st-teilweise-text",
  orange: "border-orange-500/40 text-orange-600 dark:text-orange-400",
  rot: "st-nein-border st-nein-text",
  unverzueglich: "st-nein-border st-nein-text",
  kein_timer: "border-border text-muted-foreground",
};

export default function UmsetzungFortschrittCard({ de, liveTotal, liveDone, scopeCodes, strictScope = false }: {
  de: boolean;
  /** Aktueller Scope-Nenner (anwendbare Kontrollen, live aus dem Overlay). Verhindert bayaten Cache-Nenner nach Scope-Wechsel (F-03). */
  liveTotal?: number;
  /** Aktuell umgesetztes Gewicht (ja + 0,5·teilweise, effektiv). */
  liveDone?: number;
  /** DB-Codes der aktiven Frameworks; filtert bayate framework-fremde Verlaufs-Events. */
  scopeCodes?: string[];
  /** Dashboard-Filter aktiv: Fristen ohne Framework-Bezug ebenfalls ausblenden. */
  strictScope?: boolean;
}) {
  const { data } = useToolData<ProgressData>("umsetzung-progress", "umsetzung-progress", { total: 0, events: [] });
  const [ansicht, setAnsicht] = useState<Ansicht>("monat");
  const [von, setVon] = useState("");
  const [bis, setBis] = useState("");
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([]);
  useEffect(() => {
    let alive = true;
    listOpenDeadlines(supabase).then(d => { if (alive) setDeadlines(d); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const total = Math.max(1, (typeof liveTotal === "number" && liveTotal > 0 ? liveTotal : data.total) || 0);

  const scopeSet = useMemo(
    () => (scopeCodes && scopeCodes.length ? new Set(scopeCodes) : null),
    [scopeCodes],
  );

  // Fristen (Plan-Linie, Meilensteine) nur für Frameworks im (gefilterten) Scope.
  const scopedDeadlines = useMemo(
    () => (scopeSet ? deadlines.filter(d => (d.framework ? scopeSet.has(d.framework) : !strictScope)) : deadlines),
    [deadlines, scopeSet, strictScope],
  );

  const events = useMemo(() => {
    const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
    let ev = (data.events ?? []).filter(e => e.d && validDate(e.d));
    // F-03: nur Events im aktuellen Scope zählen. Framework-eigene Aufgaben tragen den
    // Präfix im Schlüssel ("FRAMEWORK-CODE:controlId"); gemeinsame Bündel ("a5-21")
    // nicht — für sie zählen die Mitglieds-Frameworks (f). Früher fielen alle
    // gemeinsamen Bündel hier heraus, der Verlauf blieb dadurch (fast) leer.
    if (scopeSet) ev = ev.filter(e => {
      if (!e.k) return true;
      const k = String(e.k);
      if (k.includes(":")) return scopeSet.has(k.split(":")[0]);
      return Array.isArray(e.f) && e.f.length ? e.f.some(x => scopeSet.has(x)) : true;
    });
    if (von) ev = ev.filter(e => e.d >= von);
    if (bis) ev = ev.filter(e => e.d <= bis);
    return ev.slice().sort((a, b) => a.d.localeCompare(b.d));
  }, [data.events, von, bis, scopeSet]);

  // Balken je Periode (Monat/Woche): Summe der Gewichte.
  const barData = useMemo(() => {
    if (ansicht !== "monat" && ansicht !== "woche") return [];
    const map = new Map<string, number>();
    for (const e of events) {
      const dt = new Date(e.d + "T12:00:00");
      const key = ansicht === "monat" ? monthKey(dt) : isoWeekKey(dt);
      map.set(key, (map.get(key) ?? 0) + e.w);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, v]) => ({ key, label: ansicht === "monat" ? monthLabel(key, de) : key.replace(/^\d{4}-/, ""), umgesetzt: Math.round(v * 10) / 10 }));
  }, [events, ansicht, de]);

  // Kumulativ / Prognose: laufende Summe → % vom Total.
  const lineData = useMemo(() => {
    if (ansicht !== "kumulativ" && ansicht !== "prognose" && ansicht !== "reifegrad") return { rows: [] as any[], projReach: null as number | null, tooShort: false };
    // Aggregat je Monat (kumuliert).
    const byMonth = new Map<string, number>();
    for (const e of events) byMonth.set(monthKey(new Date(e.d + "T12:00:00")), (byMonth.get(monthKey(new Date(e.d + "T12:00:00"))) ?? 0) + e.w);
    const months = [...byMonth.keys()].sort();
    let cum = 0;
    const rows: any[] = [];
    for (const mk of months) {
      cum += byMonth.get(mk)!;
      rows.push({ key: mk, label: monthLabel(mk, de), pct: Math.round((cum / total) * 1000) / 10, reifegrad: Math.round((cum / total) * 5 * 100) / 100, t: (() => { const [y, m] = mk.split("-").map(Number); return Date.UTC(y, m - 1, 15); })() });
    }
    // Heute-Anker: aktuellen LIVE-Stand als heutigen Punkt sicherstellen — sonst
    // wirkt die Kurve leer bzw. bei 0 %, obwohl bereits X % umgesetzt sind
    // (Kurve zählt datierte Abschlüsse; frisch Bewertetes hat oft kein Datum).
    const nowPct = (total > 0 && typeof liveDone === "number")
      ? Math.round((liveDone / total) * 1000) / 10
      : (rows.length ? rows[rows.length - 1].pct : 0);
    const nowD = new Date();
    const nowKey = monthKey(nowD);
    const nowT = Date.UTC(nowD.getUTCFullYear(), nowD.getUTCMonth(), 15);
    const heute = rows.find(r => r.key === nowKey);
    if (heute) { heute.pct = Math.max(heute.pct ?? 0, nowPct); heute.reifegrad = Math.round((heute.pct / 20) * 100) / 100; }
    else rows.push({ key: nowKey, label: monthLabel(nowKey, de), pct: nowPct, reifegrad: Math.round((nowPct / 20) * 100) / 100, t: nowT });
    rows.sort((a, b) => a.t - b.t);

    // Prognose: echte Extrapolation nur bei ≥2 realen Messpunkten (≥14 Tage Spanne).
    // Sonst Plan-Linie (Soll-Tempo) vom heutigen Stand auf 100 % am spätesten Zieltermin.
    let projReach: number | null = null;
    let tooShort = false;
    let planReach: number | null = null;
    if (ansicht === "prognose") {
      const real = rows.filter(r => typeof r.pct === "number");
      const a = real[0], b = real[real.length - 1];
      if (real.length >= 2 && b.t - a.t >= 14 * 86400000 && b.pct > a.pct) {
        const slope = (b.pct - a.pct) / (b.t - a.t);
        if (slope > 0 && b.pct < 100) {
          projReach = b.t + (100 - b.pct) / slope;
          let t = b.t, pct = b.pct;
          while (pct < 100 && t < projReach + 40 * 86400000) {
            t = Date.UTC(new Date(t).getUTCFullYear(), new Date(t).getUTCMonth() + 1, 15);
            pct = Math.min(100, Math.round((b.pct + slope * (t - b.t)) * 10) / 10);
            rows.push({ key: monthKey(new Date(t)), label: monthLabel(monthKey(new Date(t)), de), prognose: pct, t });
          }
        }
      } else {
        tooShort = true;
        const targets = scopedDeadlines.map(d => d.due_at).filter(Boolean).map(x => new Date(x as string).getTime()).filter(t => t > nowT);
        if (targets.length && nowPct < 100) {
          const target = Math.max(...targets);
          planReach = target;
          const start = rows.find(r => r.key === nowKey);
          if (start) start.plan = nowPct;
          let t = nowT, guard = 0;
          while (t < target && guard++ < 120) {
            t = Date.UTC(new Date(t).getUTCFullYear(), new Date(t).getUTCMonth() + 1, 15);
            const frac = (t - nowT) / (target - nowT);
            const pct = Math.min(100, Math.round((nowPct + (100 - nowPct) * Math.min(1, frac)) * 10) / 10);
            const key = monthKey(new Date(t));
            const ex = rows.find(r => r.key === key);
            if (ex) ex.plan = pct;
            else rows.push({ key, label: monthLabel(key, de), plan: pct, t });
          }
          rows.sort((a, b) => a.t - b.t);
        }
      }
    }
    return { rows, projReach, tooShort, planReach };
  }, [events, ansicht, total, de, liveDone, scopedDeadlines]);

  // Meilenstein-Marker (NIS2/Audit-Fristen) — nur in Zeitverlauf-Ansichten.
  const marks = useMemo(() => {
    if (ansicht !== "prognose" && ansicht !== "kumulativ") return [] as Array<{ label: string; name: string }>;
    const byKey = new Map(lineData.rows.map((r: any) => [r.key, r.label]));
    const out: Array<{ label: string; name: string }> = [];
    for (const d of scopedDeadlines) {
      if (!d.due_at) continue;
      const lb = byKey.get(monthKey(new Date(d.due_at)));
      if (lb) out.push({ label: lb as string, name: `${d.framework ? d.framework + " · " : ""}${d.label ?? "Frist"}` });
    }
    return out;
  }, [scopedDeadlines, lineData.rows, ansicht]);

  // Headline-Zahl: bevorzugt den LIVE-Wert (aus dem Overlay), sonst Summe der
  // (scope-gefilterten) Events. So zeigt die Kachel nie mehr den bayaten Cache
  // eines früheren Scopes (z. B. 621,5 / 1461).
  const totalUmgesetzt = useMemo(
    () => (typeof liveDone === "number"
      ? Math.round(liveDone * 10) / 10
      : Math.round(events.reduce((s, e) => s + e.w, 0) * 10) / 10),
    [liveDone, events],
  );
  const pctNow = Math.round((totalUmgesetzt / total) * 1000) / 10;

  const btn = (v: Ansicht, label: string) => (
    <button type="button" onClick={() => setAnsicht(v)} aria-pressed={ansicht === v}
            className={`px-2.5 py-1 text-[11px] font-semibold ${ansicht === v ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/60"}`}>
      {label}
    </button>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-accent" />
              {de ? "Umsetzungsfortschritt" : "Implementation progress"}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {de
                ? "Was wurde je Zeitraum umgesetzt (Fertig = 1, Laufend = 0,5). Quelle: Gap + Umsetzung, dedupliziert."
                : "What was implemented per period (Done = 1, In progress = 0.5). Source: Gap + Implementation, deduplicated."}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              {btn("monat", de ? "Monatlich" : "Monthly")}
              {btn("woche", de ? "Wöchentlich" : "Weekly")}
              {btn("kumulativ", de ? "Kumulativ" : "Cumulative")}
              {btn("prognose", "Prognose")}
              {btn("reifegrad", "Reifegrad")}
            </div>
            <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
              {de ? "von" : "from"}
              <input type="date" value={von} onChange={e => setVon(e.target.value)} className="h-7 rounded border border-border bg-background px-1 text-[11px]" />
            </label>
            <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
              {de ? "bis" : "to"}
              <input type="date" value={bis} onChange={e => setBis(e.target.value)} className="h-7 rounded border border-border bg-background px-1 text-[11px]" />
            </label>
            {(von || bis) && (
              <button type="button" onClick={() => { setVon(""); setBis(""); }} className="text-[11px] text-accent hover:underline">{de ? "zurücksetzen" : "reset"}</button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-center text-sm text-muted-foreground px-6">
            {de
              ? "Noch keine Umsetzungen. Bewerten Sie Kontrollen in der Gap-Analyse (umgesetzt/teilweise) oder setzen Sie Aufgaben in der Umsetzung auf Fertig/Laufend."
              : "No implementations yet. Assess controls in the Gap analysis, or mark tasks Done/Running in the Implementation."}
          </div>
        ) : (
          <>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <ComposedChart data={(ansicht === "monat" || ansicht === "woche") ? barData : lineData.rows}
                               margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))"
                         domain={(ansicht === "monat" || ansicht === "woche") ? [0, "auto"] : ansicht === "reifegrad" ? [0, 5] : [0, 100]}
                         tickFormatter={(v) => (ansicht === "monat" || ansicht === "woche") ? `${v}` : ansicht === "reifegrad" ? `${v}` : `${v}%`} />
                  <Tooltip contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {(ansicht === "monat" || ansicht === "woche") && (
                    <Bar dataKey="umgesetzt" name={de ? "Umgesetzt" : "Implemented"} fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  )}
                  {ansicht === "kumulativ" && (
                    <Line type="monotone" dataKey="pct" name={de ? "Kumulativ %" : "Cumulative %"} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  )}
                  {ansicht === "prognose" && (
                    <Line type="monotone" dataKey="pct" name="Ist %" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                  )}
                  {ansicht === "prognose" && (
                    <Line type="monotone" dataKey="prognose" name="Prognose" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="4 3" dot={false} connectNulls />
                  )}
                  {ansicht === "prognose" && (
                    <Line type="monotone" dataKey="plan" name={de ? "Plan (Soll-Tempo)" : "Plan (target pace)"} stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="2 3" dot={false} connectNulls />
                  )}
                  {ansicht === "reifegrad" && (
                    <Line type="monotone" dataKey="reifegrad" name={de ? "Reifegrad (0–5)" : "Maturity (0–5)"} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                  )}
                  {marks.map((m, i) => (
                    <ReferenceLine key={`mk${i}`} x={m.label} stroke="hsl(var(--destructive))" strokeDasharray="3 3"
                                   label={{ value: "⚑", position: "top", fill: "hsl(var(--destructive))", fontSize: 12 }} />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {de ? "Aktuell umgesetzt: " : "Currently implemented: "}
              <span className="font-semibold text-foreground">{totalUmgesetzt} / {total} ({pctNow}%)</span>
              {ansicht === "prognose" && lineData.projReach
                ? ` · ${de ? "Prognose 100 %: " : "forecast 100%: "}${new Date(lineData.projReach).toLocaleDateString(de ? "de-DE" : "en-GB", { month: "short", year: "numeric" })}`
                : ansicht === "prognose" && lineData.planReach
                  ? ` · ${de ? "Soll-Tempo bis Zieltermin " : "target pace until "}${new Date(lineData.planReach).toLocaleDateString(de ? "de-DE" : "en-GB", { month: "short", year: "numeric" })}${de ? " (echte Prognose ab 2. Messung)" : " (real forecast from 2nd measurement)"}`
                : ansicht === "prognose" && lineData.tooShort
                  ? ` · ${de ? "Prognose: mehr Verlauf nötig (ca. 2 Wochen)" : "forecast: needs ~2 weeks of history"}`
                  : ansicht === "reifegrad"
                    ? ` · ${de ? `Reifegrad-Näherung aus Umsetzung (100 % ≈ 5,0) · aktuell ${(Math.round((pctNow / 20) * 10) / 10).toString().replace(".", ",")}/5` : `maturity proxy from implementation (100% ≈ 5.0) · now ${Math.round((pctNow / 20) * 10) / 10}/5`}`
                    : ""}
            </p>
            {scopedDeadlines.filter(d => d.due_at).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <Flag className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-[10px] text-muted-foreground mr-1">{de ? "Fristen:" : "Deadlines:"}</span>
                {[...scopedDeadlines].filter(d => d.due_at).sort((a, b) => (a.due_at as string).localeCompare(b.due_at as string)).slice(0, 6).map(d => {
                  const a = deadlineAmpel(d.due_at ?? null, d.starts_at);
                  return (
                    <span key={d.id} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${AMPEL[a.ampel]}`}
                          title={d.label ?? ""}>
                      {d.framework ? `${d.framework} · ` : ""}{new Date(d.due_at as string).toLocaleDateString(de ? "de-DE" : "en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                    </span>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
