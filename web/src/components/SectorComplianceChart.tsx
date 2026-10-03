import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2, AlertTriangle, XCircle, Factory } from "lucide-react";

const SECTOR_STORAGE_KEY = "cws-sector-data";

const sectorLabels: Record<string, { de: string; en: string }> = {
  energy: { de: "Energie", en: "Energy" },
  transport: { de: "Transport", en: "Transport" },
  health: { de: "Gesundheitswesen", en: "Healthcare" },
  "digital-infra": { de: "Digitale Infrastruktur", en: "Digital Infra" },
  finance: { de: "Finanzwesen", en: "Finance" },
  water: { de: "Wasserversorgung", en: "Water Supply" },
  "public-admin": { de: "Öff. Verwaltung", en: "Public Admin" },
  manufacturing: { de: "Verarbeitendes Gew.", en: "Manufacturing" },
  "ict-services": { de: "IKT-Dienste", en: "ICT Services" },
};

const sectorIds = Object.keys(sectorLabels);

const SectorComplianceChart = () => {
  const { lang } = useLanguage();
  const de = lang === "de";

  const saved = localStorage.getItem(SECTOR_STORAGE_KEY);
  if (!saved) return null;

  const statusMap: Record<string, string> = JSON.parse(saved);
  const keys = Object.keys(statusMap);
  if (keys.length === 0) return null;

  const sectorData: Record<string, { ja: number; teil: number; nein: number; total: number }> = {};

  keys.forEach(key => {
    const matchedSector = sectorIds.find(sid => key.startsWith(sid + "-"));
    if (!matchedSector) return;
    if (!sectorData[matchedSector]) sectorData[matchedSector] = { ja: 0, teil: 0, nein: 0, total: 0 };
    sectorData[matchedSector].total += 1;
    const status = statusMap[key];
    if (status === "ja") sectorData[matchedSector].ja += 1;
    else if (status === "teilweise") sectorData[matchedSector].teil += 1;
    else if (status === "nein") sectorData[matchedSector].nein += 1;
  });

  const data = Object.entries(sectorData).map(([sectorId, counts]) => {
    const earned = counts.ja + counts.teil * 0.5;
    const score = counts.total > 0 ? Math.round((earned / counts.total) * 100) : 0;
    return {
      id: sectorId,
      name: sectorLabels[sectorId]?.[lang] || sectorId,
      score,
      ...counts,
    };
  });

  if (data.length === 0) return null;

  const totalEarned = data.reduce((s, d) => s + d.ja + d.teil * 0.5, 0);
  const totalAll = data.reduce((s, d) => s + d.total, 0);
  const overallScore = totalAll > 0 ? Math.round((totalEarned / totalAll) * 100) : 0;

  return (
    <div className="bg-card rounded-2xl p-6 card-elevated border border-border relative overflow-hidden">
      <div className="absolute top-0 left-0 w-32 h-32 bg-secondary/10 rounded-full -translate-y-1/2 -translate-x-1/2" />

      <div className="flex items-center justify-between mb-1 relative">
        <h3 className="text-xl font-bold font-heading text-card-foreground flex items-center gap-2">
          <Factory className="h-5 w-5 text-primary" />
          {de ? "Sektorspezifische Konformität" : "Sector-Specific Compliance"}
        </h3>
        <span className={`text-2xl font-bold ${overallScore >= 70 ? "text-success" : overallScore >= 40 ? "text-partial" : "text-destructive"}`}>
          {overallScore}%
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-5 relative">
        {de ? "Direkt aus der Sektorauswahl im Umsetzungsleitfaden" : "Directly from sector selection in the implementation guide"}
      </p>

      <div className="space-y-3 relative">
        {data.map(d => {
          const barColor = d.score >= 70 ? "bg-success" : d.score >= 40 ? "bg-partial" : d.score > 0 ? "bg-destructive" : "bg-muted-foreground/30";
          const scoreColor = d.score >= 70 ? "text-success" : d.score >= 40 ? "text-partial" : "text-destructive";

          return (
            <div key={d.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-card-foreground">{d.name}</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-success" />{d.ja}
                    <AlertTriangle className="h-3 w-3 text-partial ml-1" />{d.teil}
                    <XCircle className="h-3 w-3 text-destructive ml-1" />{d.nein}
                  </div>
                  <span className={`text-sm font-bold min-w-[3rem] text-right ${scoreColor}`}>{d.score}%</span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                  style={{ width: `${d.score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SectorComplianceChart;
