import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, Database, Link, Code, BarChart3, GraduationCap, Lock, Users, MessageSquareLock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import BausteinCard from "@/components/BausteinCard";
import type { NIS2Domain, ComplianceStatus } from "@/data/nis2Controls";
import { getReifegradScore } from "@/data/nis2Controls";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "shield-check": ShieldCheck,
  "alert-triangle": AlertTriangle,
  "database-backup": Database,
  "link": Link,
  "code": Code,
  "bar-chart": BarChart3,
  "graduation-cap": GraduationCap,
  "lock": Lock,
  "users": Users,
  "message-square-lock": MessageSquareLock,
};

interface Props {
  domain: NIS2Domain;
  onStatusChange: (questionId: string, status: ComplianceStatus) => void;
  onCommentChange?: (questionId: string, comment: string) => void;
}

const DomainCard = ({ domain, onStatusChange, onCommentChange }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const { lang } = useLanguage();
  const IconComp = iconMap[domain.icon] || ShieldCheck;

  const allQ = domain.categories.flatMap(c => c.questions);
  const total = allQ.length;
  const answered = allQ.filter(q => q.status !== null).length;
  const score = getReifegradScore(domain.categories);
  const progressPercent = total > 0 ? Math.round((answered / total) * 100) : 0;

  const domainLabels: Record<string, Record<string, string>> = {
    organisational: { de: "Organisatorische Kontrollen", en: "Organisational Controls" },
    people: { de: "Personelle Kontrollen", en: "People Controls" },
    physical: { de: "Physische Kontrollen", en: "Physical Controls" },
    technological: { de: "Technologische Kontrollen", en: "Technological Controls" },
  };

  const domainColors: Record<string, string> = {
    organisational: "eu-gradient",
    people: "gold-gradient",
    physical: "eu-gradient",
    technological: "gold-gradient",
  };

  return (
    <div className="bg-card rounded-2xl border border-border card-elevated overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 sm:px-6 py-5 sm:py-6 flex items-center gap-3 sm:gap-4 text-left hover:bg-accent/30 transition-colors"
      >
        <div className={`${domainColors[domain.id] || "eu-gradient"} p-3 sm:p-3.5 rounded-xl flex-shrink-0`}>
          <IconComp className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-xl font-bold text-card-foreground font-heading truncate">
            {domainLabels[domain.id]?.[lang] || domain.title}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {domain.categories.length} {lang === "de" ? "Unterkategorien" : "Subcategories"} · {total} {lang === "de" ? "Kontrollen" : "Controls"} · {answered}/{total} {lang === "de" ? "bewertet" : "assessed"}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="hidden sm:flex flex-col items-end gap-1">
            <div className="w-28 bg-muted rounded-full h-2">
              <div className="eu-gradient h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{score}% {lang === "de" ? "konform" : "compliant"}</span>
          </div>
          <span className="text-sm sm:text-base font-bold text-muted-foreground sm:hidden">{score}%</span>
          {expanded ? <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-3 sm:px-5 py-4 space-y-3 bg-accent/5">
          {domain.categories.map(cat => (
            <BausteinCard
              key={cat.id}
              category={cat}
              onStatusChange={onStatusChange}
              onCommentChange={onCommentChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DomainCard;
