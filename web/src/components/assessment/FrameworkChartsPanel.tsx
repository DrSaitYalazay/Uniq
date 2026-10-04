/**
 * FrameworkChartsPanel — visual summary for the currently-viewed framework.
 *
 * Renders the same data that the PDF report uses so the UI is a
 * WYSIWYG preview of the report. Three compact panels side-by-side:
 *   1) Compliance % ring (headline number)
 *   2) Status donut (Umgesetzt / Teilweise / Offen / N.a. / Ohne)
 *   3) Top families horizontal bar (worst → best, top 8)
 */

import { useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";
import type { ControlRow, EffectiveAnswer, FrameworkStats } from "@/lib/assessmentEngine";
import { familiesOf } from "@/lib/assessmentEngine";

interface Props {
  controls: ControlRow[];
  effective: Map<string, EffectiveAnswer>;
  stats: FrameworkStats;
  de: boolean;
  /** UniqSuite: „simple" = Überblick (nur Status-Verteilung; Themenliste darunter zeigt die Kategorien). */
  mode?: "simple" | "expert";
}

import { CHART_STATUS, CHART_STATUS_OHNE } from "@/lib/chartPalette";
const STATUS_COLORS = {
  ja:        CHART_STATUS.ja,
  teilweise: CHART_STATUS.teilweise,
  nein:      CHART_STATUS.nein,
  na:        CHART_STATUS.na,
  ohne:      CHART_STATUS_OHNE,
};

export function FrameworkChartsPanel({ controls, effective, stats, de, mode = "expert" }: Props) {
  const donutData = useMemo(() => {
    const ohne = stats.total - (stats.ja + stats.teilweise + stats.nein + stats.na);
    return [
      { name: de ? "Umgesetzt" : "Implemented", value: stats.ja,        color: STATUS_COLORS.ja },
      { name: de ? "Teilweise" : "Partial",     value: stats.teilweise, color: STATUS_COLORS.teilweise },
      { name: de ? "Nicht umgesetzt" : "Not implemented", value: stats.nein,      color: STATUS_COLORS.nein },
      { name: de ? "N.a."      : "N/A",         value: stats.na,        color: STATUS_COLORS.na },
      { name: de ? "Unbeantwortet" : "Unanswered", value: Math.max(0, ohne), color: STATUS_COLORS.ohne },
    ].filter(d => d.value > 0);
  }, [stats, de]);

  const familyData = useMemo(() => {
    const map = new Map<string, { label: string; total: number; ja: number; teil: number; na: number }>();
    for (const c of controls) {
      // familiesOf: jede Referenz zaehlt (gleiche Grundgesamtheit wie Akkordeon
      // und Reifegrad) — eine Kontrolle kann zu mehreren Familien beitragen.
      const s = effective.get(c.id)?.status;
      for (const f of familiesOf(c, de)) {
        if (!map.has(f.id)) map.set(f.id, { label: f.label, total: 0, ja: 0, teil: 0, na: 0 });
        const bucket = map.get(f.id)!;
        bucket.total += 1;
        if (s === "ja") bucket.ja += 1;
        else if (s === "teilweise") bucket.teil += 1;
        else if (s === "na") bucket.na += 1;
      }
    }
    const rows = Array.from(map.values()).map(b => {
      const applicable = b.total - b.na;
      const pct = applicable > 0 ? Math.round(((b.ja + 0.5 * b.teil) / applicable) * 100) : 0;
      return { name: b.label.length > 28 ? b.label.slice(0, 26) + "…" : b.label, pct, total: b.total };
    });
    rows.sort((a, b) => a.pct - b.pct);
    return rows.slice(0, 8);
  }, [controls, effective, de]);

  const ringData = [{ name: "Compliance", value: stats.compliancePct, fill: stats.compliancePct >= 75 ? CHART_STATUS.ja : stats.compliancePct >= 40 ? CHART_STATUS.teilweise : CHART_STATUS.nein }];

  return (
    <div className="rounded-xl border border-border bg-card p-4 card-elevated">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          {de ? "Grafische Auswertung" : "Visual analysis"}
        </h3>
        <span className="text-[11px] text-muted-foreground">
          {de ? "identisch mit Bericht" : "identical to report"}
        </span>
      </div>

      {/* UniqSuite: der Konformitäts-Ring wiederholte die Kennzahl „Konformität" direkt darüber — entfällt. */}
      <div className={`grid grid-cols-1 gap-4 ${mode === "simple" ? "" : "md:grid-cols-2"}`}>
        {SHOW_COMPLIANCE_RING && (
        <div className="rounded-lg border border-border/60 p-3 min-h-[220px] flex flex-col">
          <div className="text-[11px] text-muted-foreground mb-1">
            {de ? "Konformität" : "Compliance"}
          </div>
          <div className="flex-1 relative">
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={ringData} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar dataKey="value" angleAxisId={0} background={{ fill: "hsl(var(--muted))" }} cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-3xl font-bold text-foreground">{stats.compliancePct}%</div>
              <div className="text-[11px] text-muted-foreground">
                {stats.ja}/{stats.applicable} {de ? "erfüllt" : "met"}{stats.teilweise > 0 ? ` · ${stats.teilweise} ${de ? "teilweise" : "partial"}` : ""}
              </div>
            </div>
          </div>
        </div>

        )}

        {/* 2) Status donut */}
        <div className="rounded-lg border border-border/60 p-3 min-h-[220px] flex flex-col">
          <div className="text-[11px] text-muted-foreground mb-1">
            {de ? "Status-Verteilung" : "Status distribution"}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 11, borderRadius: 8 }}
                formatter={(v: number, n: string) => [`${v}`, n]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 text-[10px] justify-center mt-1">
            {donutData.map(d => (
              <span key={d.name} className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: d.color }} />
                {d.name}: {d.value}
              </span>
            ))}
          </div>
        </div>

        {/* 3) Family bar chart (worst first) — Überblick: die Themenliste darunter zeigt dasselbe */}
        {mode !== "simple" && (
        <div className="rounded-lg border border-border/60 p-3 min-h-[220px] flex flex-col">
          <div className="text-[11px] text-muted-foreground mb-1">
            {de ? "Schwächste Kategorien" : "Weakest categories"}
          </div>
          {familyData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[11px] text-muted-foreground">
              {de ? "Keine Daten" : "No data"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, familyData.length * 22)}>
              <BarChart data={familyData} layout="vertical" margin={{ left: 4, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={110} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 11, borderRadius: 8 }}
                  formatter={(v: number) => [`${v}%`, de ? "Konformität" : "Compliance"]}
                />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                  {familyData.map((d: any, i: number) => (
                    <Cell key={i} fill={d.pct >= 75 ? CHART_STATUS.ja : d.pct >= 40 ? CHART_STATUS.teilweise : CHART_STATUS.nein} />
                  ))}
                  <LabelList dataKey="pct" position="right" formatter={(v: number) => `${v}%`} style={{ fontSize: 10, fill: "hsl(var(--foreground))" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

const SHOW_COMPLIANCE_RING = false;
