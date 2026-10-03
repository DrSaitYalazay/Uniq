import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getReifegradScore, getReifegradLevel, getDomainScore, type NIS2Category, type NIS2Domain } from "@/data/nis2Controls";

interface Props {
  categories: NIS2Category[];
  domains?: NIS2Domain[];
}

const getCategoryScore = (cat: NIS2Category): number => {
  let total = 0;
  let earned = 0;
  cat.questions.forEach(q => {
    if (q.status === "entbehrlich") return;
    total += 1;
    if (q.status === "ja") earned += 1;
    else if (q.status === "teilweise") earned += 0.5;
  });
  return total === 0 ? 0 : Math.round((earned / total) * 100);
};

const getCategoryLevel = (score: number): { level: string; label: string } => {
  if (score >= 90) return { level: "5", label: "Optimiert" };
  if (score >= 70) return { level: "4", label: "Gesteuert" };
  if (score >= 50) return { level: "3", label: "Definiert" };
  if (score >= 25) return { level: "2", label: "Wiederholbar" };
  return { level: "1", label: "Initial" };
};

const CategoryBreakdown = ({ categories, domains }: Props) => {
  const { t, lang } = useLanguage();
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const overallScore = getReifegradScore(categories);
  const overallLevel = getReifegradLevel(overallScore);

  const levelLabels: Record<string, Record<string, string>> = {
    "1": { de: "Initial", en: "Initial" },
    "2": { de: "Wiederholbar", en: "Repeatable" },
    "3": { de: "Definiert", en: "Defined" },
    "4": { de: "Gesteuert", en: "Managed" },
    "5": { de: "Optimiert", en: "Optimized" },
  };

  const domainLabels: Record<string, Record<string, string>> = {
    organisational: { de: "Organisatorische Kontrollen", en: "Organisational Controls" },
    people: { de: "Personelle Kontrollen", en: "People Controls" },
    physical: { de: "Physische Kontrollen", en: "Physical Controls" },
    technological: { de: "Technologische Kontrollen", en: "Technological Controls" },
  };

  return (
    <div className="bg-card rounded-2xl p-6 card-elevated border border-border">
      <h3 className="text-xl font-bold font-heading text-card-foreground mb-1">
        {lang === "de" ? "Kategorie-Detailübersicht" : "Category Detail Overview"}
      </h3>
      <p className="text-base text-muted-foreground mb-4">
        {lang === "de" ? "Konformitätsrate und Reifegrad pro Kategorie (Entbehrlich-Kontrollen ausgeschlossen)" : "Compliance rate and maturity level per category (N/A controls excluded)"}
      </p>

      {/* Overall summary bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 p-3 sm:p-4 rounded-xl bg-accent/30 border border-primary/10">
        <div className="eu-gradient text-primary-foreground w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-lg sm:text-xl font-bold">{overallScore}%</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-card-foreground">
            {lang === "de" ? "Gesamtkonformität" : "Overall Compliance"}
          </p>
          <p className="text-xs text-muted-foreground">
            {lang === "de" ? `Reifegrad Level ${overallLevel.level} – ${levelLabels[overallLevel.level]?.[lang]}` : `Maturity Level ${overallLevel.level} – ${levelLabels[overallLevel.level]?.[lang]}`}
          </p>
        </div>
        <div className="w-32 bg-muted rounded-full h-2.5 hidden sm:block">
          <div className="eu-gradient h-2.5 rounded-full transition-all duration-500" style={{ width: `${overallScore}%` }} />
        </div>
      </div>

      {/* Domain-level breakdown */}
      {domains && (
        <div className="space-y-4 mb-4">
          {domains.map(domain => {
            const domainScore = getDomainScore(domain);
            const domainCats = domain.categories;
            const isExpanded = expandedDomain === domain.id;
            const scoreColor = domainScore >= 70 ? "text-success" : domainScore >= 40 ? "text-partial" : domainScore > 0 ? "text-destructive" : "text-muted-foreground";
            const barColor = domainScore >= 70 ? "bg-success" : domainScore >= 40 ? "bg-partial" : "bg-destructive";

            return (
              <div key={domain.id} className="rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setExpandedDomain(isExpanded ? null : domain.id)}
                  className="w-full p-3 sm:p-4 flex items-center gap-3 hover:bg-accent/20 transition-colors text-left"
                >
                  <div className="eu-gradient w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-foreground">{domainScore}%</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-bold text-card-foreground truncate">
                      {domainLabels[domain.id]?.[lang] || domain.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {domainCats.length} {lang === "de" ? "Unterkategorien" : "subcategories"} · {domainCats.flatMap(c => c.questions).length} {lang === "de" ? "Kontrollen" : "controls"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="hidden sm:block w-24 bg-muted rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${domainScore}%` }} />
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-3 sm:px-4 py-2 space-y-2 bg-muted/10">
                    {domainCats.map(cat => {
                      const score = getCategoryScore(cat);
                      const level = getCategoryLevel(score);
                      const ja = cat.questions.filter(q => q.status === "ja").length;
                      const teil = cat.questions.filter(q => q.status === "teilweise").length;
                      const nein = cat.questions.filter(q => q.status === "nein").length;
                      const entb = cat.questions.filter(q => q.status === "entbehrlich").length;
                      const catScoreColor = score >= 70 ? "text-success" : score >= 40 ? "text-partial" : score > 0 ? "text-destructive" : "text-muted-foreground";
                      const catBarColor = score >= 70 ? "bg-success" : score >= 40 ? "bg-partial" : "bg-destructive";

                      return (
                        <div key={cat.id} className="p-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1.5">
                            <span className="text-xs sm:text-sm font-semibold text-card-foreground truncate flex-1 min-w-0">{lang === "en" ? cat.titleEn : cat.title}</span>
                            <span className={`text-xs sm:text-sm font-bold ${catScoreColor} flex-shrink-0`}>{score}%</span>
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                              L{level.level}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full transition-all duration-500 ${catBarColor}`} style={{ width: `${score}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0 whitespace-nowrap">
                              ✓{ja} ½{teil} ✗{nein} {entb > 0 ? `⊘${entb}` : ""}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategoryBreakdown;
