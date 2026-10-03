import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { CHART_STATUS } from "@/lib/chartPalette";
import { useLanguage } from "@/contexts/LanguageContext";
import ALL_TEMPLATES, { type PolicyTemplate } from "@/data/policyTemplates";

interface PolicyState {
  implementationStatus: "draft" | "not_implemented" | "partially_implemented" | "implemented" | "entbehrlich";
}

interface Props {
  policies: Record<string, PolicyState>;
  /** Nur diese Vorlagen auswerten (sichtbare = aktive Frameworks). Fehlt: alle. */
  templates?: PolicyTemplate[];
}

const PolicyCharts = ({ policies, templates }: Props) => {
  const POLICY_TEMPLATES = templates ?? ALL_TEMPLATES;
  const { lang } = useLanguage();
  const de = lang === "de";

  // Pie: implementation status distribution (entbehrlich excluded from compliance math)
  let impl = 0, partial = 0, notImpl = 0, entbehrlich = 0;
  POLICY_TEMPLATES.forEach(t => {
    const p = policies[t.id];
    if (!p) { notImpl++; return; }
    if (p.implementationStatus === "entbehrlich") { entbehrlich++; return; }
    if (p.implementationStatus === "implemented") impl++;
    else if (p.implementationStatus === "partially_implemented") partial++;
    else notImpl++;
  });
  const total = impl + partial + notImpl; // applicable only

  const pieData = [
    { name: de ? "Umgesetzt" : "Implemented", value: impl, color: CHART_STATUS.ja },
    { name: de ? "Teilweise" : "Partial", value: partial, color: CHART_STATUS.teilweise },
    { name: de ? "Nicht umgesetzt" : "Not Implemented", value: notImpl, color: CHART_STATUS.nein },
    { name: de ? "Entbehrlich" : "Not Applicable", value: entbehrlich, color: CHART_STATUS.na },
  ].filter(d => d.value > 0);

  // Weighted: implemented = 1, partial = 0.5 (denominator excludes entbehrlich)
  const overallPct = total ? Math.round(((impl + partial * 0.5) / total) * 100) : 0;

  // Radar: per category implementation % (entbehrlich excluded from per-category totals)
  const catMap = new Map<string, { total: number; weighted: number }>();
  POLICY_TEMPLATES.forEach(t => {
    const p = policies[t.id];
    if (p?.implementationStatus === "entbehrlich") return;
    const cat = de ? t.category : t.categoryEn;
    const entry = catMap.get(cat) || { total: 0, weighted: 0 };
    entry.total += 1;
    if (p?.implementationStatus === "implemented") entry.weighted += 1;
    else if (p?.implementationStatus === "partially_implemented") entry.weighted += 0.5;
    catMap.set(cat, entry);
  });

  const radarData = Array.from(catMap.entries()).map(([cat, v]) => {
    const pct = v.total ? Math.round((v.weighted / v.total) * 100) : 0;
    return { category: cat, score: pct, fullMark: 100 };
  });

  // Multi-line tick renderer so long category names don't get clipped at the chart edges.
  const renderPolarTick = (props: any) => {
    const { x, y, payload, textAnchor } = props;
    const words: string[] = String(payload.value).split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    const MAX = 14;
    for (const w of words) {
      if ((cur + " " + w).trim().length <= MAX) cur = (cur + " " + w).trim();
      else { if (cur) lines.push(cur); cur = w.length > MAX ? w.slice(0, MAX - 1) + "…" : w; }
    }
    if (cur) lines.push(cur);
    const display = lines.slice(0, 2);
    if (lines.length > 2) display[1] = display[1].slice(0, MAX - 1) + "…";
    return (
      <text x={x} y={y} textAnchor={textAnchor} fill="hsl(var(--muted-foreground))" fontSize={10} fontWeight={600}>
        {display.map((ln, i) => (
          <tspan key={i} x={x} dy={i === 0 ? 0 : 11}>{ln}</tspan>
        ))}
      </text>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Pie */}
      <Card className="border-border overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-6 relative">
          <h3 className="text-lg font-bold font-heading text-card-foreground mb-1">
            {de ? "Richtlinien-Status" : "Policy Status"}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {impl + partial} {de ? "von" : "of"} {total} {de ? "anwendbaren Richtlinien (teil-)umgesetzt" : "applicable policies (partially) implemented"}
            {entbehrlich > 0 && <span className="ml-1">· {entbehrlich} {de ? "entbehrlich" : "not applicable"}</span>}
          </p>

          <div className="relative w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                  cornerRadius={4}
                >
                  {pieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value}`, ""]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-card-foreground">{overallPct}%</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {de ? "Reife" : "Maturity"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground truncate">{item.name}</p>
                  <p className="text-sm font-bold text-card-foreground leading-tight">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Radar */}
      <Card className="border-border overflow-hidden relative">
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <CardContent className="p-6 relative">
          <h3 className="text-lg font-bold font-heading text-card-foreground mb-1">
            {de ? "Abdeckung nach Kategorie" : "Coverage by Category"}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {de ? "Umsetzungsgrad pro Richtlinienkategorie" : "Implementation rate per policy category"}
          </p>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="62%" margin={{ top: 16, right: 56, bottom: 16, left: 56 }}>
                <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={renderPolarTick as any}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name={de ? "Umsetzung" : "Implementation"}
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.25}
                  strokeWidth={2.5}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                  }}
                  formatter={(value: number) => [`${value}%`, de ? "Umsetzung" : "Implementation"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-3">
            {radarData.map(d => {
              const color = d.score >= 70 ? "st-ja-text" : d.score >= 40 ? "st-teilweise-text" : "text-destructive";
              return (
                <div key={d.category} className="flex items-center justify-between bg-muted/30 rounded-md px-2 py-1">
                  <span className="text-[10px] text-card-foreground truncate">{d.category}</span>
                  <span className={`text-xs font-bold ${color}`}>{d.score}%</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PolicyCharts;
