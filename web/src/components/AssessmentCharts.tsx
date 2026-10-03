import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2, AlertTriangle, XCircle, MinusCircle, HelpCircle } from "lucide-react";
import { CHART_STATUS } from "@/lib/chartPalette";

type StatusValue = "ja" | "teilweise" | "nein" | "entbehrlich";

interface FamilyGroup {
  familyId: string;
  familyLabel: string;
  familyLabelEn: string;
  controls: { id: string }[];
}

interface Props {
  groups: FamilyGroup[];
  answers: Record<string, { status: StatusValue | null; comment: string }>;
  title?: string;
  subtitle?: string;
}

const AssessmentCharts = ({ groups, answers, title, subtitle }: Props) => {
  const { lang } = useLanguage();
  const de = lang === "de";

  const stats = useMemo(() => {
    const allControls = groups.flatMap(g => g.controls);
    const total = allControls.length;
    const counts = { ja: 0, teilweise: 0, nein: 0, entbehrlich: 0, offen: 0 };
    for (const c of allControls) {
      const s = answers[c.id]?.status;
      if (s === "ja") counts.ja++;
      else if (s === "teilweise") counts.teilweise++;
      else if (s === "nein") counts.nein++;
      else if (s === "entbehrlich") counts.entbehrlich++;
      else counts.offen++;
    }
    const applicable = total - counts.entbehrlich;
    const compliant = counts.ja + counts.teilweise * 0.5;
    const complianceRate = applicable > 0 ? Math.round((compliant / applicable) * 100) : 0;
    const assessed = counts.ja + counts.teilweise + counts.nein + counts.entbehrlich;
    const progressRate = total > 0 ? Math.round((assessed / total) * 100) : 0;
    return { total, counts, complianceRate, progressRate, assessed, applicable };
  }, [groups, answers]);

  const pieData = [
    { name: de ? "Umgesetzt" : "Implemented", value: stats.counts.ja, color: CHART_STATUS.ja },
    { name: de ? "Teilweise" : "Partial", value: stats.counts.teilweise, color: CHART_STATUS.teilweise },
    { name: de ? "Nicht umgesetzt" : "Not implemented", value: stats.counts.nein, color: CHART_STATUS.nein },
    { name: de ? "Entbehrlich" : "N/A", value: stats.counts.entbehrlich, color: CHART_STATUS.na },
    { name: de ? "Nicht bewertet" : "Not rated", value: stats.counts.offen, color: CHART_STATUS.offen },
  ].filter(d => d.value > 0);

  const barData = useMemo(() => {
    return groups.map(g => {
      const total = g.controls.length;
      const c = { ja: 0, teilweise: 0, nein: 0, entbehrlich: 0, offen: 0 };
      for (const ctrl of g.controls) {
        const s = answers[ctrl.id]?.status;
        if (s === "ja") c.ja++;
        else if (s === "teilweise") c.teilweise++;
        else if (s === "nein") c.nein++;
        else if (s === "entbehrlich") c.entbehrlich++;
        else c.offen++;
      }
      const applicable = total - c.entbehrlich;
      const compliant = c.ja + c.teilweise * 0.5;
      const rate = applicable > 0 ? Math.round((compliant / applicable) * 100) : 0;
      const label = de ? g.familyLabel : g.familyLabelEn;
      return {
        family: label.length > 22 ? label.slice(0, 20) + "…" : label,
        fullName: label,
        rate,
        Umgesetzt: c.ja,
        Teilweise: c.teilweise,
        Offen: c.nein,
      };
    });
  }, [groups, answers, de]);

  const kpis = [
    {
      icon: CheckCircle2,
      label: de ? "Umgesetzt" : "Implemented",
      value: stats.counts.ja,
      cls: "text-success",
      bg: "bg-success/10",
    },
    {
      icon: AlertTriangle,
      label: de ? "Teilweise" : "Partial",
      value: stats.counts.teilweise,
      cls: "text-partial",
      bg: "bg-partial/10",
    },
    {
      icon: XCircle,
      label: de ? "Nicht umgesetzt" : "Not implemented",
      value: stats.counts.nein,
      cls: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      icon: MinusCircle,
      label: de ? "Entbehrlich" : "N/A",
      value: stats.counts.entbehrlich,
      cls: "text-muted-foreground",
      bg: "bg-muted/40",
    },
    {
      icon: HelpCircle,
      label: de ? "Nicht bewertet" : "Not rated",
      value: stats.counts.offen,
      cls: "text-muted-foreground",
      bg: "bg-muted/40",
    },
  ];

  if (stats.total === 0) return null;

  return (
    <div className="space-y-4">
      {(title || subtitle) && (
        <div>
          {title && <h3 className="text-lg font-bold font-heading text-foreground">{title}</h3>}
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3 card-elevated">
            <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center mb-2`}>
              <k.icon className={`h-4 w-4 ${k.cls}`} />
            </div>
            <p className="text-2xl font-bold text-card-foreground leading-none">{k.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="bg-card rounded-2xl p-5 border border-border card-elevated relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <h4 className="text-sm font-bold text-card-foreground relative">
            {de ? "Status-Verteilung" : "Status Distribution"}
          </h4>
          <p className="text-xs text-muted-foreground mb-3 relative">
            {stats.assessed} / {stats.total} {de ? "bewertet" : "assessed"}
          </p>
          <div className="relative w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                  cornerRadius={4}
                >
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [`${v}`, ""]}
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
              <span className="text-3xl font-bold text-card-foreground">{stats.complianceRate}%</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                {de ? "Konformität" : "Compliance"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-2 relative">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-muted-foreground">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart per family */}
        <div className="bg-card rounded-2xl p-5 border border-border card-elevated relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <h4 className="text-sm font-bold text-card-foreground relative">
            {de ? "Konformität pro Kontrollfamilie" : "Compliance per Control Family"}
          </h4>
          <p className="text-xs text-muted-foreground mb-3 relative">
            {de ? "Konformitätsrate (%)" : "Compliance rate (%)"}
          </p>
          <div className="w-full h-56 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis
                  type="category"
                  dataKey="family"
                  width={120}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, de ? "Konformität" : "Compliance"]}
                  labelFormatter={(_, p) => (p?.[0]?.payload as any)?.fullName ?? ""}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                  }}
                />
                <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                  {barData.map((d, i) => {
                    const color = d.rate >= 70 ? CHART_STATUS.ja : d.rate >= 40 ? CHART_STATUS.teilweise : CHART_STATUS.nein;
                    return <Cell key={i} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentCharts;
