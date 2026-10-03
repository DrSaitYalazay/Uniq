import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, Database, Link, Code, BarChart3, GraduationCap, Lock, Users, MessageSquareLock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { NIS2Category, ComplianceStatus } from "@/data/nis2Controls";

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
  category: NIS2Category;
  onStatusChange: (questionId: string, status: ComplianceStatus) => void;
  onCommentChange?: (questionId: string, comment: string) => void;
}

const BausteinCard = ({ category, onStatusChange, onCommentChange }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();
  const { lang } = useLanguage();
  const isEn = lang === "en";
  const IconComp = iconMap[category.icon] || ShieldCheck;

  const answered = category.questions.filter(q => q.status !== null).length;
  const total = category.questions.length;
  const jaCount = category.questions.filter(q => q.status === "ja").length;
  const applicable = category.questions.filter(q => q.status !== "entbehrlich").length;
  const progressPercent = total > 0 ? Math.round((answered / total) * 100) : 0;

  const statusOptions: { value: ComplianceStatus; label: string; colorClass: string }[] = [
    { value: "ja", label: t("status.ja"), colorClass: "bg-success text-success-foreground" },
    { value: "teilweise", label: t("status.teilweise"), colorClass: "bg-partial text-partial-foreground" },
    { value: "nein", label: t("status.nein"), colorClass: "bg-destructive text-destructive-foreground" },
    { value: "entbehrlich", label: t("status.entbehrlich"), colorClass: "bg-muted text-muted-foreground" },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border card-elevated overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 sm:gap-4 text-left hover:bg-accent/30 transition-colors"
      >
        <div className="bg-accent border border-primary/15 p-2 sm:p-2.5 rounded-xl flex-shrink-0">
          <IconComp className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-lg font-bold text-card-foreground font-heading truncate">{isEn ? category.titleEn : category.title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">
            {answered}/{total} {t("baustein.assessed")} · {jaCount}/{applicable > 0 ? applicable : total} {t("baustein.implemented")}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="hidden sm:block w-24 bg-muted rounded-full h-2">
            <div className="eu-gradient h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-muted-foreground w-10 text-right">{progressPercent}%</span>
          {expanded ? <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border">
          <div className="px-4 sm:px-6 py-3 bg-accent/20">
            <p className="text-xs text-muted-foreground italic">{isEn ? category.description : category.titleDe}</p>
          </div>
          <div className="divide-y divide-border">
            {category.questions.map((q, idx) => (
              <div key={q.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-accent/10 transition-colors">
                <div className="flex gap-2 sm:gap-3">
                  <span className="text-xs font-mono text-muted-foreground mt-1 flex-shrink-0 w-6 sm:w-8">{idx + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-card-foreground leading-relaxed mb-1">{isEn ? q.questionEn : q.question}</p>
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{isEn ? q.descriptionEn : q.description}</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                      {statusOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => onStatusChange(q.id, q.status === opt.value ? null : opt.value)}
                          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                            q.status === opt.value
                              ? `${opt.colorClass} ring-2 ring-offset-1 ring-offset-card scale-105`
                              : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {(q.status === "teilweise" || q.status === "entbehrlich") && (
                      <div className="mt-3">
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                          {q.status === "teilweise"
                            ? (t("comment.teilweise_label"))
                            : (t("comment.entbehrlich_label"))}
                        </label>
                        <textarea
                          value={q.comment || ""}
                          onChange={(e) => onCommentChange?.(q.id, e.target.value)}
                          placeholder={q.status === "teilweise"
                            ? t("comment.teilweise_placeholder")
                            : t("comment.entbehrlich_placeholder")}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y min-h-[60px]"
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BausteinCard;
