import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const STEP_STORAGE_KEY = "cws-step-data";

const stepLabels: Record<string, { de: string; en: string }> = {
  "0": { de: "Betroffenheitsanalyse", en: "Applicability Analysis" },
  "1": { de: "Governance & Organisation", en: "Governance & Organization" },
  "2": { de: "Risikomanagement", en: "Risk Management" },
  "3": { de: "Vorfallmanagement", en: "Incident Management" },
  "4": { de: "Business Continuity", en: "Business Continuity" },
  "5": { de: "Lieferkettensicherheit", en: "Supply Chain Security" },
  "6": { de: "Beschaffungssicherheit", en: "Procurement Security" },
  "7": { de: "Schulung & Awareness", en: "Training & Awareness" },
  "8": { de: "Kryptografie & Zugang", en: "Cryptography & Access" },
  "9": { de: "Kontinuierliche Verbess.", en: "Continuous Improvement" },
};

const StepComplianceChart = () => {
  const { lang } = useLanguage();
  const de = lang === "de";

  const saved = localStorage.getItem(STEP_STORAGE_KEY);
  if (!saved) return null;

  const statusMap: Record<string, string> = JSON.parse(saved);
  const keys = Object.keys(statusMap);
  if (keys.length === 0) return null;

  const stepData: Record<string, { ja: number; teil: number; nein: number; total: number }> = {};

  keys.forEach(key => {
    const match = key.match(/^step-(\d+)-/);
    if (!match) return;
    const stepIdx = match[1];
    if (!stepData[stepIdx]) stepData[stepIdx] = { ja: 0, teil: 0, nein: 0, total: 0 };
    stepData[stepIdx].total += 1;
    const status = statusMap[key];
    if (status === "ja") stepData[stepIdx].ja += 1;
    else if (status === "teilweise") stepData[stepIdx].teil += 1;
    else if (status === "nein") stepData[stepIdx].nein += 1;
  });

  const data = Object.entries(stepData).map(([stepIdx, counts]) => {
    const earned = counts.ja + counts.teil * 0.5;
    const score = counts.total > 0 ? Math.round((earned / counts.total) * 100) : 0;
    return {
      stepIdx,
      name: stepLabels[stepIdx]?.[lang] || `Step ${Number(stepIdx) + 1}`,
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
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="flex items-center justify-between mb-1 relative">
        <h3 className="text-xl font-bold font-heading text-card-foreground">
          {de ? "NIS2 Compliance Pipeline" : "NIS2 Compliance Pipeline"}
        </h3>
        <span className={`text-2xl font-bold ${overallScore >= 70 ? "text-success" : overallScore >= 40 ? "text-partial" : "text-destructive"}`}>
          {overallScore}%
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-5 relative">
        {de ? "Fortschritt pro NIS2-Umsetzungsschritt" : "Progress per NIS2 implementation step"}
      </p>

      <div className="space-y-3 relative">
        {data.map((d, i) => {
          const barColor = d.score >= 70 ? "bg-success" : d.score >= 40 ? "bg-partial" : d.score > 0 ? "bg-destructive" : "bg-muted-foreground/30";
          const scoreColor = d.score >= 70 ? "text-success" : d.score >= 40 ? "text-partial" : "text-destructive";

          return (
            <div key={d.stepIdx} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-card-foreground flex items-center gap-1.5">
                  <span className="text-muted-foreground font-mono text-[10px]">{i + 1}.</span>
                  {d.name}
                </span>
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

export default StepComplianceChart;
