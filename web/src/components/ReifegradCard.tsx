import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getReifegradScore, getReifegradLevel, type NIS2Category } from "@/data/nis2Controls";

interface Props {
  categories: NIS2Category[];
}

const levelDescriptions: Record<number, { de: string[]; en: string[] }> = {
  1: {
    de: [
      "Sicherheitsmaßnahmen sind nicht oder nur ad-hoc umgesetzt",
      "Keine dokumentierten Prozesse oder Richtlinien vorhanden",
      "Reaktion auf Vorfälle erfolgt ungeplant und unkoordiniert",
      "Verantwortlichkeiten für IT-Sicherheit sind nicht klar definiert",
      "Hohes Risiko für Verstöße gegen NIS2-Anforderungen",
    ],
    en: [
      "Security measures are not implemented or only ad-hoc",
      "No documented processes or policies exist",
      "Incident response is unplanned and uncoordinated",
      "Responsibilities for IT security are not clearly defined",
      "High risk of non-compliance with NIS2 requirements",
    ],
  },
  2: {
    de: [
      "Grundlegende Sicherheitsmaßnahmen sind implementiert",
      "Prozesse werden wiederholt, aber nicht formalisiert",
      "Erste Dokumentation von Sicherheitsrichtlinien vorhanden",
      "Reaktion auf bekannte Bedrohungen ist möglich",
      "Verantwortlichkeiten teilweise zugewiesen",
    ],
    en: [
      "Basic security measures are implemented",
      "Processes are repeated but not formalized",
      "Initial documentation of security policies exists",
      "Response to known threats is possible",
      "Responsibilities are partially assigned",
    ],
  },
  3: {
    de: [
      "Sicherheitsprozesse sind dokumentiert und standardisiert",
      "Regelmäßige Schulungen und Sensibilisierung der Mitarbeiter",
      "Risikomanagement-Prozess ist etabliert",
      "Incident-Response-Plan ist definiert und getestet",
      "Compliance-Anforderungen werden systematisch verfolgt",
    ],
    en: [
      "Security processes are documented and standardized",
      "Regular training and employee awareness programs",
      "Risk management process is established",
      "Incident response plan is defined and tested",
      "Compliance requirements are systematically tracked",
    ],
  },
  4: {
    de: [
      "Sicherheitsmaßnahmen werden aktiv überwacht und gemessen",
      "KPIs und Metriken zur Bewertung der Sicherheitslage definiert",
      "Regelmäßige Audits und Überprüfungen werden durchgeführt",
      "Automatisierte Erkennung und Reaktion auf Bedrohungen",
      "Kontinuierliche Verbesserung auf Basis von Messergebnissen",
    ],
    en: [
      "Security measures are actively monitored and measured",
      "KPIs and metrics for security posture assessment defined",
      "Regular audits and reviews are conducted",
      "Automated threat detection and response",
      "Continuous improvement based on measurement results",
    ],
  },
  5: {
    de: [
      "Proaktive und vorausschauende Sicherheitsstrategie",
      "Best Practices werden branchenweit geteilt und angewandt",
      "Vollständige Integration von Sicherheit in alle Geschäftsprozesse",
      "Adaptive Sicherheitsarchitektur mit Echtzeit-Anpassung",
      "Vorbildfunktion für NIS2-Konformität in der Branche",
    ],
    en: [
      "Proactive and predictive security strategy",
      "Best practices are shared and applied industry-wide",
      "Full integration of security into all business processes",
      "Adaptive security architecture with real-time adjustment",
      "Role model for NIS2 compliance in the industry",
    ],
  },
};

const ReifegradCard = ({ categories }: Props) => {
  const { t, lang } = useLanguage();
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const score = getReifegradScore(categories);
  const reifegrad = getReifegradLevel(score);

  const levels = [
    { level: 1, labelKey: "reifegrad.l1", min: 0 },
    { level: 2, labelKey: "reifegrad.l2", min: 25 },
    { level: 3, labelKey: "reifegrad.l3", min: 50 },
    { level: 4, labelKey: "reifegrad.l4", min: 70 },
    { level: 5, labelKey: "reifegrad.l5", min: 90 },
  ];

  const currentLabel = t(`reifegrad.l${reifegrad.level}`);

  const toggleLevel = (level: number) => {
    setExpandedLevel(prev => (prev === level ? null : level));
  };

  return (
    <div className="bg-card rounded-2xl p-6 card-elevated border border-border">
      <h3 className="text-xl font-bold font-heading text-card-foreground mb-1">{t("reifegrad.title")}</h3>
      <p className="text-base text-muted-foreground mb-4">{t("reifegrad.subtitle")}</p>

      <div className="flex items-center gap-4 mb-6">
        <div className="eu-gradient text-primary-foreground w-16 h-16 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{reifegrad.level}</span>
          <span className="text-xs opacity-80">{t("reifegrad.level")}</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-card-foreground">{currentLabel}</p>
          <p className="text-base text-muted-foreground">{t("reifegrad.score")}: {score}%</p>
        </div>
      </div>

      <div className="space-y-2">
        {levels.map((l) => {
          const isActive = reifegrad.level === l.level;
          const isExpanded = expandedLevel === l.level;
          const bullets = levelDescriptions[l.level]?.[lang] ?? [];

          return (
            <div key={l.level}>
              <button
                onClick={() => toggleLevel(l.level)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  isActive ? "bg-accent border border-primary/20" : "bg-muted/30 hover:bg-muted/50"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  isActive ? "eu-gradient text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {l.level}
                </div>
                <span className={`text-base ${isActive ? "font-semibold text-card-foreground" : "text-muted-foreground"}`}>
                  {t(l.labelKey)}
                </span>
                {isActive && <span className="text-xs font-medium text-primary ml-auto mr-2">{t("reifegrad.current")}</span>}
                {isExpanded
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-auto" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-auto" />}
              </button>

              {isExpanded && (
                <div className={`mt-1 ml-11 mr-2 mb-1 p-3 rounded-lg border ${
                  isActive ? "bg-accent/50 border-primary/10" : "bg-muted/20 border-border"
                }`}>
                  <ul className="space-y-1.5">
                    {bullets.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-card-foreground">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          isActive ? "bg-primary" : "bg-muted-foreground"
                        }`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReifegradCard;
