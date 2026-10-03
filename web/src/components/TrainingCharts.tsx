import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { CHART_STATUS, CHART_PHASE } from "@/lib/chartPalette";
import { useLanguage } from "@/contexts/LanguageContext";

interface TrainingTopic {
  id: string;
  mandatory: boolean;
}
interface TrainingCategory {
  id: string;
  titleDe: string;
  titleEn: string;
  topics: TrainingTopic[];
}

interface Props {
  categories: TrainingCategory[];
  completions: Record<string, { completed: boolean }>;
}

const TrainingCharts = ({ categories, completions }: Props) => {
  const { lang } = useLanguage();
  const de = lang === "de";

  const allTopics = categories.flatMap(c => c.topics);
  const completed = allTopics.filter(t => completions[t.id]?.completed).length;
  const mandatoryTotal = allTopics.filter(t => t.mandatory).length;
  const mandatoryDone = allTopics.filter(t => t.mandatory && completions[t.id]?.completed).length;
  const optionalTotal = allTopics.length - mandatoryTotal;
  const optionalDone = completed - mandatoryDone;

  const pieData = [
    { name: de ? "Pflicht abgeschlossen" : "Mandatory done", value: mandatoryDone, color: CHART_STATUS.ja },
    { name: de ? "Pflicht offen" : "Mandatory open", value: mandatoryTotal - mandatoryDone, color: CHART_STATUS.nein },
    { name: de ? "Optional abgeschlossen" : "Optional done", value: optionalDone, color: CHART_PHASE.later },
    { name: de ? "Optional offen" : "Optional open", value: Math.max(0, optionalTotal - optionalDone), color: CHART_STATUS.offen },
  ].filter(d => d.value > 0);

  const overallPct = allTopics.length ? Math.round((completed / allTopics.length) * 100) : 0;

  const radarData = categories.map(cat => {
    const total = cat.topics.length;
    const done = cat.topics.filter(t => completions[t.id]?.completed).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const fullName = de ? cat.titleDe : cat.titleEn;
    const short = fullName.length > 22 ? fullName.slice(0, 20) + "…" : fullName;
    return { category: short, score: pct, fullMark: 100 };
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Pie */}
      <Card className="border-border overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-6 relative">
          <h3 className="text-lg font-bold font-heading text-card-foreground mb-1">
            {de ? "Schulungsstatus" : "Training Status"}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {completed} {de ? "von" : "of"} {allTopics.length} {de ? "Themen abgeschlossen" : "topics completed"}
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
                {de ? "Fortschritt" : "Progress"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
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
            {de ? "Abschlussquote pro Schulungskategorie" : "Completion rate per training category"}
          </p>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 600 }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name={de ? "Abschluss" : "Completion"}
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
                  formatter={(value: number) => [`${value}%`, de ? "Abschluss" : "Completion"]}
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

export default TrainingCharts;
