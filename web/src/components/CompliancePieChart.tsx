import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { CHART_STATUS } from "@/lib/chartPalette";
import type { NIS2Category } from "@/data/nis2Controls";

interface Props {
  categories: NIS2Category[];
}

const CompliancePieChart = ({ categories }: Props) => {
  const { t } = useLanguage();
  const allQuestions = categories.flatMap(c => c.questions);

  const counts = {
    ja: allQuestions.filter(q => q.status === "ja").length,
    teilweise: allQuestions.filter(q => q.status === "teilweise").length,
    nein: allQuestions.filter(q => q.status === "nein").length,
    entbehrlich: allQuestions.filter(q => q.status === "entbehrlich").length,
    offen: allQuestions.filter(q => q.status === null).length,
  };

  const data = [
    { name: t("pie.yes"), value: counts.ja, color: CHART_STATUS.ja },
    { name: t("pie.partial"), value: counts.teilweise, color: CHART_STATUS.teilweise },
    { name: t("pie.no"), value: counts.nein, color: CHART_STATUS.nein },
    { name: t("pie.na"), value: counts.entbehrlich, color: CHART_STATUS.na },
    { name: t("pie.notrated"), value: counts.offen, color: CHART_STATUS.offen },
  ].filter(d => d.value > 0);

  const total = allQuestions.length;
  const applicable = total - counts.entbehrlich;
  const compliant = counts.ja + counts.teilweise * 0.5;
  const complianceRate = applicable > 0 ? Math.round((compliant / applicable) * 100) : 0;

  return (
    <div className="bg-card rounded-2xl p-6 card-elevated border border-border relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <h3 className="text-xl font-bold font-heading text-card-foreground mb-1 relative">{t("pie.title")}</h3>
      <p className="text-sm text-muted-foreground mb-6 relative">
        {counts.ja + counts.teilweise + counts.nein + counts.entbehrlich} {t("pie.of")} {total} {t("pie.assessed")}
      </p>

      <div className="flex flex-col items-center gap-6 relative">
        <div className="relative w-64 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={data} 
                cx="50%" 
                cy="50%" 
                innerRadius={72} 
                outerRadius={105} 
                paddingAngle={4} 
                dataKey="value" 
                strokeWidth={0}
                cornerRadius={6}
              >
                {data.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} ${t("pie.controls_label")}`, ""]}
                contentStyle={{ 
                  borderRadius: "12px", 
                  border: "1px solid hsl(var(--border))", 
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  background: "hsl(var(--card))",
                  color: "hsl(var(--card-foreground))",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-card-foreground tracking-tight">{complianceRate}%</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{t("pie.compliance")}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 w-full">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2.5 group">
              <div className="w-3.5 h-3.5 rounded-md flex-shrink-0 shadow-sm transition-transform group-hover:scale-110" style={{ backgroundColor: item.color }} />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{item.name}</p>
                <p className="text-lg font-bold text-card-foreground leading-tight">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompliancePieChart;
