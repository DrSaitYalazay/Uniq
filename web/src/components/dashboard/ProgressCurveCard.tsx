/**
 * ProgressCurveCard — Fortschrittskurve „Plan vs. Ist vs. Prognose".
 * Beantwortet die Management-Frage: „Kommen wir bis zum Zieltermin auf 100 %?"
 *
 *  • Ist        = tatsächlicher Compliance-Verlauf aus kpi_snapshots (compliance_overall).
 *  • Plan (Soll) = lineare Rampe vom ersten Ist-Wert bis 100 % zum spätesten
 *                  Roadmap-Fälligkeitstermin (roadmap_items.due_date).
 *  • Prognose    = Extrapolation der jüngsten Ist-Steigung bis 100 %.
 *  • Zielmarker  = vertikale Linie am geplanten Zieltermin.
 *
 * Ansicht: Monatlich/Wöchentlich umschaltbar + optionaler Zeitraum (von–bis).
 * Kein Blackout: ohne Verlaufsdaten eine freundliche Positiv-/Hinweis-Meldung.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Granularity = "month" | "week";

interface IstPoint { t: number; pct: number; } // t = epoch ms, pct 0..100

// ── Perioden-Helfer ────────────────────────────────────────────────────────
function periodKey(d: Date, g: Granularity): string {
  const y = d.getUTCFullYear();
  if (g === "month") return `${y}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  // ISO-Woche (grob): Jahr + KW
  const onejan = new Date(Date.UTC(y, 0, 1));
  const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getUTCDay() + 1) / 7);
  return `${y}-W${String(week).padStart(2, "0")}`;
}
function periodStart(key: string, g: Granularity): number {
  if (g === "month") { const [y, m] = key.split("-").map(Number); return Date.UTC(y, m - 1, 1); }
  const [y, w] = key.split("-W").map(Number);
  return Date.UTC(y, 0, 1) + (w - 1) * 7 * 86400000;
}
function addPeriod(t: number, g: Granularity): number {
  const d = new Date(t);
  if (g === "month") return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  return t + 7 * 86400000;
}

export default function ProgressCurveCard({ de, currentPct }: { de: boolean; currentPct?: number | null }) {
  const { tenantId } = useAuth();
  const [ist, setIst] = useState<IstPoint[]>([]);
  const [targetDate, setTargetDate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [gran, setGran] = useState<Granularity>("month");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [reloadKey, setReloadKey] = useState(0);
  // Manueller Messpunkt (Verlauf aufbauen / Prognose demonstrieren).
  const [mpOpen, setMpOpen] = useState(false);
  const [mpDate, setMpDate] = useState<string>("");
  const [mpPct, setMpPct] = useState<string>("");
  const [mpSaving, setMpSaving] = useState(false);

  const addMeasurement = async () => {
    if (!tenantId) return;
    const pct = Number(mpPct);
    const day = mpDate || new Date().toISOString().slice(0, 10);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return;
    setMpSaving(true);
    // taken_at = gewähltes Datum (12:00 UTC, damit Tages-Zuordnung stabil ist).
    const takenAt = new Date(`${day}T12:00:00.000Z`).toISOString();
    await supabase.from("kpi_snapshots").insert({
      tenant_id: tenantId,
      taken_at: takenAt,
      metrics: { compliance_overall: pct / 100 },
      has_data: { compliance_overall: true },
      source: "manual",
    }).then(() => {}, () => {});
    setMpSaving(false);
    setMpOpen(false);
    setMpPct("");
    setMpDate("");
    setReloadKey(k => k + 1);
  };

  useEffect(() => {
    let cancelled = false;
    if (!tenantId) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      const [snapRes, roadRes, implRes] = await Promise.all([
        supabase.from("kpi_snapshots").select("taken_at, metrics, has_data").eq("tenant_id", tenantId).order("taken_at", { ascending: true }),
        supabase.from("roadmap_items").select("due_date").eq("user_id", tenantId),
        supabase.from("implementation_status").select("status, completed_at, last_status_change_at").eq("tenant_id", tenantId),
      ]);
      if (cancelled) return;

      // Ist bevorzugt aus TATSÄCHLICHEN Abschlussdaten (Umsetzung → completed_at):
      // kumulierte erledigte Aufgaben über die Zeit, skaliert auf die heutige
      // Live-Compliance. So bildet die Kurve echten Fortschritt an realen Daten ab,
      // ohne auf tägliche Snapshots zu warten. Fallback = gemessene kpi_snapshots.
      // completed_at (manuell/geändert) hat Vorrang; sonst Default = Datum, an dem
      // die Aufgabe auf „Fertig" gesetzt wurde (last_status_change_at).
      const doneDays = ((implRes.data ?? []) as any[])
        .filter(r => r.status === "fertig" && (r.completed_at || r.last_status_change_at))
        .map(r => Date.parse(r.completed_at ? `${r.completed_at}T12:00:00Z` : r.last_status_change_at))
        .filter((n: number) => !isNaN(n))
        .sort((a: number, b: number) => a - b);

      let pts: IstPoint[] = [];
      if (doneDays.length >= 1 && currentPct != null && Number.isFinite(currentPct)) {
        const total = doneDays.length;
        for (const d of [...new Set<number>(doneDays)]) {
          const cum = doneDays.filter((t: number) => t <= d).length;
          pts.push({ t: d, pct: Math.round((currentPct * cum / total) * 10) / 10 });
        }
      } else {
        for (const r of (snapRes.data ?? []) as any[]) {
          const has = r.has_data?.compliance_overall;
          const v = r.metrics?.compliance_overall;
          if (has === false || typeof v !== "number") continue;
          pts.push({ t: Date.parse(r.taken_at), pct: Math.round(v * 1000) / 10 });
        }
      }
      setIst(pts);
      const dues = ((roadRes.data ?? []) as any[]).map(r => r.due_date).filter(Boolean).map((d: string) => Date.parse(d)).filter((n: number) => !isNaN(n));
      setTargetDate(dues.length ? Math.max(...dues) : null);
      setLoading(false);
    })().catch(() => { if (!cancelled) { setIst([]); setTargetDate(null); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tenantId, reloadKey, currentPct]);

  // C3: Verlauf aus echter Nutzung aufbauen. Einmal pro Tag den heutigen
  // Ist-Stand als Snapshot schreiben (falls für heute noch keiner existiert) —
  // so entsteht Historie, ohne auf den wöchentlichen Server-Job zu warten, und
  // die Prognose erscheint schon nach dem 2. Tag. Fehler werden still ignoriert.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || loading) return;
    if (!tenantId || currentPct == null || !Number.isFinite(currentPct)) return;
    const todayKey = new Date().toISOString().slice(0, 10);
    const hasToday = ist.some(p => new Date(p.t).toISOString().slice(0, 10) === todayKey);
    seededRef.current = true;
    if (hasToday) return;
    supabase.from("kpi_snapshots").insert({
      tenant_id: tenantId,
      metrics: { compliance_overall: currentPct / 100 },
      has_data: { compliance_overall: true },
      source: "auto",
    }).then(() => {}, () => {});
  }, [tenantId, currentPct, ist, loading]);

  const chart = useMemo(() => {
    // Effektive Ist-Reihe: Historie aus Snapshots PLUS immer ein „heute"-Punkt
    // aus der aktuellen Live-Compliance. So ist die Kurve nie leer, auch wenn
    // (noch) keine wöchentliche Snapshot-Historie existiert — sie zeigt dann
    // „wo stehe ich heute" + Plan-Rampe + Zieltermin.
    const istEff = ist.map(p => ({ ...p }));
    if (currentPct != null && Number.isFinite(currentPct)) {
      const now = Date.now();
      const nowKey = periodKey(new Date(now), gran);
      if (istEff.length && periodKey(new Date(istEff[istEff.length - 1].t), gran) === nowKey) {
        istEff[istEff.length - 1] = { t: now, pct: currentPct };   // aktuelle Periode = Live-Wert
      } else {
        istEff.push({ t: now, pct: currentPct });
      }
    }
    if (istEff.length === 0) return { data: [], targetKey: null as string | null, projKey: null as string | null };

    const istByPeriod = new Map<string, number>();
    for (const p of istEff) istByPeriod.set(periodKey(new Date(p.t), gran), p.pct);

    const startT = istEff[0].t;
    const startVal = istEff[0].pct;
    const lastT = istEff[istEff.length - 1].t;
    const lastVal = istEff[istEff.length - 1].pct;
    const ist_ = istEff;
    const target = targetDate && targetDate > startT ? targetDate : Math.max(lastT, startT + 90 * 86400000);

    // Prognose-Steigung aus den letzten bis zu 4 Ist-Punkten (%/ms).
    // Nur echte Historie (mind. 2 gemessene Snapshots) ergibt eine Prognose —
    // ein einzelner „heute"-Punkt allein liefert keine sinnvolle Steigung.
    // Prognose sobald ≥2 zeitlich getrennte Punkte vorliegen — inkl. des heutigen
    // Live-Punktes. So genügt EIN gespeicherter Snapshot eines Vortags + heute,
    // die Kurve erscheint einen Tag früher (statt erst nach 2 gespeicherten Snapshots).
    // Durchschnittstempo über die GESAMTE erfasste Historie (erster → letzter
    // Punkt) statt nur der letzten Messungen. Verhindert unrealistisch steile
    // Prognosen, wenn mehrere Aufgaben kurz hintereinander erledigt wurden
    // (z. B. „100 % schon im September" bei erst 24 %).
    // Mindest-Historie: unter ~2 Wochen Spanne ist das Tempo zu verrauscht
    // (aus 1 Woche „24 %" ließe sich sonst „100 % nächste Woche" hochrechnen).
    const MIN_SPAN_MS = 14 * 86400000;
    let slope = 0;
    let tooShort = false;
    if (ist_.length >= 2) {
      const a = ist_[0];
      const b = ist_[ist_.length - 1];
      if (b.t - a.t >= MIN_SPAN_MS) {
        slope = b.t > a.t ? (b.pct - a.pct) / (b.t - a.t) : 0;
      } else {
        tooShort = true;
      }
    }
    const projReach = slope > 0 ? lastT + (100 - lastVal) / slope : null;

    // Achsen-Ende = spätestes aus Ziel / letztem Ist / Prognose-100.
    const endT = Math.max(target, lastT, projReach ?? 0);
    const rangeFromT = from ? Date.parse(from + "-01") : startT;
    const rangeToT = to ? addPeriod(Date.parse(to + "-01"), "month") : endT;

    const data: any[] = [];
    let targetKey: string | null = null;
    let projKey: string | null = null;
    for (let t = periodStart(periodKey(new Date(startT), gran), gran); t <= endT; t = addPeriod(t, gran)) {
      if (t < rangeFromT || t > rangeToT) continue;
      const key = periodKey(new Date(t), gran);
      const plan = target > startT ? Math.min(100, Math.round((startVal + (100 - startVal) * (t - startT) / (target - startT)) * 10) / 10) : 100;
      const istV = istByPeriod.has(key) ? istByPeriod.get(key)! : null;
      const prog = slope > 0 && t >= lastT ? Math.min(100, Math.round((lastVal + slope * (t - lastT)) * 10) / 10) : (t === lastT ? lastVal : null);
      if (targetDate && !targetKey && t >= targetDate) targetKey = key;
      if (projReach && !projKey && t >= projReach) projKey = key;
      data.push({ key, label: labelFor(key, gran, de), plan, ist: istV, prognose: prog });
    }
    return { data, targetKey, projKey, projReach, target, tooShort };
  }, [ist, currentPct, targetDate, gran, from, to, de]);

  const lastIst = (currentPct != null && Number.isFinite(currentPct))
    ? currentPct
    : (ist.length ? ist[ist.length - 1].pct : null);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-accent" />
              {de ? "Fortschritt: Plan vs. Ist" : "Progress: plan vs. actual"}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {de
                ? "Compliance-Verlauf über die Zeit gegen den geplanten Zieltermin. Ist = gemessen, Plan = Soll-Rampe zum Ziel, Prognose = aktuelle Geschwindigkeit."
                : "Compliance over time against the planned target date. Actual = measured, Plan = ramp to target, Forecast = current pace."}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              {(["month", "week"] as const).map(g => (
                <button key={g} type="button" onClick={() => setGran(g)} aria-pressed={gran === g}
                        className={`px-2.5 py-1 text-[11px] font-semibold ${gran === g ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/60"}`}>
                  {g === "month" ? (de ? "Monatlich" : "Monthly") : (de ? "Wöchentlich" : "Weekly")}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
              {de ? "von" : "from"}
              <input type="month" value={from} onChange={e => setFrom(e.target.value)}
                     className="h-7 rounded border border-border bg-background px-1 text-[11px]" />
            </label>
            <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
              {de ? "bis" : "to"}
              <input type="month" value={to} onChange={e => setTo(e.target.value)}
                     className="h-7 rounded border border-border bg-background px-1 text-[11px]" />
            </label>
            {(from || to) && (
              <button type="button" onClick={() => { setFrom(""); setTo(""); }}
                      className="text-[11px] text-accent hover:underline">{de ? "zurücksetzen" : "reset"}</button>
            )}
            <button type="button"
                    onClick={() => {
                      setMpOpen(o => !o);
                      if (!mpOpen) {
                        setMpDate(new Date().toISOString().slice(0, 10));
                        if (currentPct != null && Number.isFinite(currentPct)) setMpPct(String(Math.round(currentPct)));
                      }
                    }}
                    className="h-7 rounded border border-accent/40 text-accent px-2 text-[11px] font-semibold hover:bg-accent/10">
              + {de ? "Messpunkt" : "Data point"}
            </button>
          </div>
        </div>
        {mpOpen && (
          <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-accent/30 bg-accent/5 p-2.5">
            <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
              {de ? "Datum" : "Date"}
              <input type="date" value={mpDate} onChange={e => setMpDate(e.target.value)}
                     className="h-7 rounded border border-border bg-background px-1.5 text-[11px]" />
            </label>
            <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
              Compliance %
              <input type="number" min={0} max={100} value={mpPct} onChange={e => setMpPct(e.target.value)}
                     placeholder="0–100" className="h-7 w-24 rounded border border-border bg-background px-1.5 text-[11px]" />
            </label>
            <button type="button" onClick={addMeasurement} disabled={mpSaving || mpPct === ""}
                    className="h-7 rounded bg-primary text-primary-foreground px-3 text-[11px] font-semibold disabled:opacity-50">
              {mpSaving ? (de ? "Speichert…" : "Saving…") : (de ? "Speichern" : "Save")}
            </button>
            <span className="text-[10px] text-muted-foreground max-w-[260px] leading-snug">
              {de
                ? "Für die Prognose mindestens 2 Messpunkte an unterschiedlichen Tagen erfassen (z. B. vor 30 Tagen 20 %, heute 45 %)."
                : "Add at least 2 points on different days for a forecast (e.g. 30 days ago 20%, today 45%)."}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">{de ? "Lädt …" : "Loading …"}</div>
        ) : chart.data.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-center text-sm text-muted-foreground px-6">
            {de
              ? "Noch keine Daten. Wählen Sie Frameworks im Scope und bewerten Sie Kontrollen — dann erscheint hier Ihr heutiger Stand samt Plan-Rampe zum Zieltermin."
              : "No data yet. Select frameworks in scope and assess controls — your current position and the plan ramp to the target date will appear here."}
          </div>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart.data} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(v: any, n: string) => [v == null ? "—" : `${v}%`, n]}
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {chart.targetKey && (
                    <ReferenceLine x={chart.targetKey} stroke="hsl(var(--destructive))" strokeDasharray="4 3"
                                   label={{ value: de ? "Zieltermin" : "Target", fontSize: 10, fill: "hsl(var(--destructive))", position: "top" }} />
                  )}
                  <Line type="monotone" dataKey="plan" name={de ? "Plan (Soll)" : "Plan"} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 4" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="prognose" name={de ? "Prognose" : "Forecast"} stroke="hsl(var(--accent))" strokeDasharray="2 3" dot={false} strokeWidth={2} connectNulls />
                  <Line type="monotone" dataKey="ist" name={de ? "Ist" : "Actual"} stroke="hsl(var(--primary))" dot={{ r: 2 }} strokeWidth={2.5} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {de ? "Aktueller Ist-Stand: " : "Current actual: "}<span className="font-semibold text-foreground">{lastIst}%</span>
              {chart.target ? ` · ${de ? "Zieltermin" : "target"}: ${new Date(chart.target).toLocaleDateString(de ? "de-DE" : "en-GB", { month: "short", year: "numeric" })}` : ""}
              {typeof (chart as any).projReach === "number"
                ? ` · ${de ? "Prognose 100 %: " : "forecast 100%: "}${new Date((chart as any).projReach).toLocaleDateString(de ? "de-DE" : "en-GB", { month: "short", year: "numeric" })}`
                : (chart as any).tooShort
                  ? ` · ${de ? "Prognose: mehr Verlauf nötig (ca. 2 Wochen), sonst unzuverlässig" : "forecast: needs more history (~2 weeks) to be reliable"}`
                  : ist.length < 2
                    ? ` · ${de ? "Prognose: erscheint, sobald Verlaufsdaten vorliegen (ab 2 Messungen)" : "forecast: appears once history exists (2+ measurements)"}`
                    : (lastIst != null && lastIst < 100 ? ` · ${de ? "Prognose: bei aktuellem Tempo kein Zuwachs" : "forecast: no gain at current pace"}` : "")}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function labelFor(key: string, g: Granularity, de: boolean): string {
  if (g === "week") return key.replace("-W", " KW");
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString(de ? "de-DE" : "en-GB", { month: "short", year: "2-digit" });
}
