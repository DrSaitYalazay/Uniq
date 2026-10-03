import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDomainScore, type NIS2Domain } from "@/data/nis2Controls";

interface Props {
  domains: NIS2Domain[];
}

const domainLabels: Record<string, Record<string, string>> = {
  organisational: { de: "Organisation", en: "Organisation" },
  people: { de: "Personal", en: "People" },
  physical: { de: "Physisch", en: "Physical" },
  technological: { de: "Technologie", en: "Technology" },
};

const DomainRadarChart = ({ domains }: Props) => {
  const { lang } = useLanguage();

  const data = domains.map(d => ({
    domain: domainLabels[d.id]?.[lang] || d.title,
    score: getDomainScore(d),
    fullMark: 100,
  }));

  return (
    <div className="bg-card rounded-2xl p-6 card-elevated border border-border relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <h3 className="text-xl font-bold font-heading text-card-foreground mb-1 relative">
        {lang === "de" ? "Domänen-Übersicht" : "Domain Overview"}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 relative">
        {lang === "de" ? "Konformitätsrate nach Kontrolldomäne" : "Compliance rate by control domain"}
      </p>

      <div className="w-full h-72 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <PolarAngleAxis 
              dataKey="domain" 
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 600 }} 
            />
            <Radar
              name={lang === "de" ? "Konformität" : "Compliance"}
              dataKey="score"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              strokeWidth={2.5}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                background: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
              }}
              formatter={(value: number) => [`${value}%`, lang === "de" ? "Konformität" : "Compliance"]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 relative">
        {data.map(d => {
          const colorClass = d.score >= 70 ? "text-success" : d.score >= 40 ? "text-partial" : "text-destructive";
          return (
            <div key={d.domain} className="flex items-center justify-between bg-muted/30 rounded-xl px-3 py-2">
              <span className="text-sm font-medium text-card-foreground">{d.domain}</span>
              <span className={`text-sm font-bold ${colorClass}`}>{d.score}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DomainRadarChart;
