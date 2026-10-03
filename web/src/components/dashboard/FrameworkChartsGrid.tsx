import { useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FrameworkOverview } from "@/hooks/useComplianceOverview";
import type { ControlRow, EffectiveAnswer } from "@/lib/assessmentEngine";
import { groupKeyForControl, describeDomain } from "@/lib/domainLabels";
import { InfoHint } from "@/components/dashboard/InfoHint";

import { CHART_STATUS } from "@/lib/chartPalette";
const STATUS_COLORS = CHART_STATUS;

const FW_SHORT: Record<string, string> = {
  ISO27001: "ISO 27001", NIS2: "NIS2", BSI: "BSI", BSI200_4: "BSI 200-4",
  BCM22301: "ISO 22301", KRITIS: "KRITIS", DORA: "DORA", TISAX: "TISAX",
  GDPR: "GDPR", ISO27701: "ISO 27701", ISO27017: "ISO 27017", ISO27018: "ISO 27018",
  AIACT: "EU AI Act", ISO42001: "ISO 42001", NIST_AI_RMF: "NIST AI",
  MaRisk: "MaRisk", CRA: "CRA", NIST_CSF: "NIST CSF", TR03183: "TR-03183",
};

function computePieData(list: ControlRow[], effective: Map<string, EffectiveAnswer>) {
  const counts = { ja: 0, teilweise: 0, nein: 0, na: 0, offen: 0 };
  for (const c of list) {
    const s = effective.get(c.id)?.status;
    if (s === "ja") counts.ja++;
    else if (s === "teilweise") counts.teilweise++;
    else if (s === "nein") counts.nein++;
    else if (s === "na") counts.na++;
    else counts.offen++;
  }
  return counts;
}

interface RadarRow {
  code: string;        // axis label (short, e.g. "A.5", "DE", "AT")
  full: string;        // human-readable long form (tooltip + legend)
  pct: number;
  total: number;
}

function computeRadarData(
  framework: string,
  list: ControlRow[],
  effective: Map<string, EffectiveAnswer>,
  de: boolean,
): RadarRow[] {
  const groups = new Map<string, { ja: number; teilweise: number; total: number }>();
  for (const c of list) {
    // meta mitgeben: der v7-Katalog trägt seine Gruppierung in meta.annex/meta.topic.
    const key = groupKeyForControl(framework, c.id, c.meta);
    const g = groups.get(key) ?? { ja: 0, teilweise: 0, total: 0 };
    const s = effective.get(c.id)?.status;
    if (s === "na") { groups.set(key, g); continue; }
    g.total++;
    if (s === "ja") g.ja++;
    else if (s === "teilweise") g.teilweise++;
    groups.set(key, g);
  }
  const rows: RadarRow[] = Array.from(groups.entries())
    .filter(([, g]) => g.total > 0)
    .map(([code, g]) => ({
      code,
      full: describeDomain(framework, code, de) ?? code,
      pct: Math.round(((g.ja + 0.5 * g.teilweise) / g.total) * 100),
      total: g.total,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
  return rows.slice(0, 12);
}

/** PolarAngleAxis tick: short code + native SVG <title> for full-name hover. */
function RadarAxisTick(props: any) {
  const { x, y, textAnchor, payload, data } = props;
  const item = data?.find((r: RadarRow) => r.code === payload.value) ?? null;
  const full = item?.full ?? payload.value;
  return (
    <text x={x} y={y} textAnchor={textAnchor} fontSize={10} fill="hsl(var(--muted-foreground))">
      <title>{full}</title>
      {payload.value}
    </text>
  );
}

function FrameworkCard({ overview, de }: { overview: FrameworkOverview; de: boolean }) {
  const { framework, stats, controls, effective } = overview;
  const label = FW_SHORT[framework] ?? framework;

  const counts = useMemo(() => computePieData(controls, effective), [controls, effective]);
  const pieData = useMemo(() => ([
    { name: de ? "Umgesetzt" : "Implemented", value: counts.ja,        color: STATUS_COLORS.ja },
    { name: de ? "Teilweise" : "Partial",   value: counts.teilweise, color: STATUS_COLORS.teilweise },
    { name: de ? "Nicht umgesetzt" : "Not implemented", value: counts.nein,    color: STATUS_COLORS.nein },
    { name: de ? "N/A" : "N/A",             value: counts.na,        color: STATUS_COLORS.na },
    { name: de ? "Unbeantwortet" : "Unanswered", value: counts.offen,     color: STATUS_COLORS.offen },
  ].filter(d => d.value > 0)), [counts, de]);

  const radarData = useMemo(
    () => computeRadarData(framework, controls, effective, de),
    [framework, controls, effective, de],
  );
  const pct = stats.compliancePct;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between gap-2">
          <span className="truncate">{label}</span>
          <Badge variant="outline" className="text-[10px]">{stats.total} {de ? "Kontrollen" : "controls"}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Pie */}
          <div className="relative h-56">
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                {de ? "Noch keine Bewertungen" : "No assessments yet"}
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={78}
                         paddingAngle={3} dataKey="value" strokeWidth={0} cornerRadius={4}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, n: string) => [`${v}`, n]}
                      contentStyle={{
                        borderRadius: 8, border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))", color: "hsl(var(--card-foreground))",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold tabular-nums">{pct}%</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {de ? "Compliance" : "Compliance"}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Radar */}
          <div className="h-56">
            {radarData.length < 3 ? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground text-center px-4">
                {de ? "Zu wenige Domänen für Radar" : "Not enough domains for radar"}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="code"
                    tick={(props: any) => <RadarAxisTick {...props} data={radarData} />}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <Radar
                    name={de ? "Reife %" : "Maturity %"}
                    dataKey="pct"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.35}
                  />
                  <Tooltip
                    formatter={(v: number, _n: string, p: any) => [
                      `${v}%  ·  ${p?.payload?.total ?? 0} ${de ? "Kontrollen" : "controls"}`,
                      p?.payload?.full ?? "",
                    ]}
                    labelFormatter={() => ""}
                    contentStyle={{
                      borderRadius: 8, border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))", color: "hsl(var(--card-foreground))",
                      fontSize: 12,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Radar legend — code → full description, so managers can decode axis labels */}
        {radarData.length >= 3 && (
          <div className="mt-3 rounded-md border border-border bg-muted/30 p-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              {de ? "Legende" : "Legend"}
            </div>
            <div className="grid gap-x-4 gap-y-0.5 grid-cols-1 sm:grid-cols-2 text-[11px]">
              {radarData.map(r => (
                <div key={r.code} className="flex items-baseline gap-2">
                  <code className="font-mono text-[10px] text-primary shrink-0 min-w-[3.5rem]">{r.code}</code>
                  <span className="text-foreground/80 truncate" title={r.full}>{r.full}</span>
                  <span className="ml-auto tabular-nums text-muted-foreground shrink-0">{r.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend chips */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-muted-foreground">
          {pieData.map(d => (
            <span key={d.name} title={`${d.name}: ${d.value}`} className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
              {d.name}: <span className="font-semibold text-foreground">{d.value}</span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function FrameworkChartsGrid({
  overviews, de,
}: { overviews: FrameworkOverview[]; de: boolean }) {
  if (overviews.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {de ? "Framework-Analyse (Kreis & Netzdiagramm)" : "Framework analysis (pie & radar)"}
          <InfoHint
            title={de ? "Wie lese ich die Grafiken?" : "How to read the charts?"}
            text={de
              ? "Links (Kreis): Verteilung der Antworten je Framework — erfüllt / teilweise / nicht erfüllt / offen. Die Zahl in der Mitte ist der Erfüllungsgrad.\n\nRechts (Netz/Radar): Reifegrad je Themenbereich (Domäne). Je weiter außen, desto besser abgedeckt. Die Achsen tragen aus Platzgründen Kurzcodes — die Legende direkt darunter erklärt jeden Code im Klartext, und beim Überfahren einer Achse erscheint der volle Name."
              : "Left (pie): answer distribution per framework — met / partial / not met / open. The number in the middle is the fulfilment level.\n\nRight (radar): maturity per topic area (domain). The further out, the better covered. Axes carry short codes for space — the legend right below spells out every code, and hovering an axis shows the full name."}
          />
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {de
            ? "Pro Framework: Verteilung der Antworten und Reifegrad je Themenbereich. Kürzel werden in der Legende unter jedem Diagramm erklärt."
            : "Per framework: answer distribution and maturity per topic area. Abbreviations are explained in the legend under each chart."}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {overviews.map(o => <FrameworkCard key={o.framework} overview={o} de={de} />)}
        </div>
      </CardContent>
    </Card>
  );
}
