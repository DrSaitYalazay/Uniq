import { useLanguage } from "@/contexts/LanguageContext";
import type { NIS2Category } from "@/data/nis2Controls";

interface Props {
  categories: NIS2Category[];
}

const StatsBar = ({ categories }: Props) => {
  const { t } = useLanguage();
  const allQ = categories.flatMap(c => c.questions);
  const total = allQ.length;
  const answered = allQ.filter(q => q.status !== null).length;
  const ja = allQ.filter(q => q.status === "ja").length;
  const teilweise = allQ.filter(q => q.status === "teilweise").length;
  const nein = allQ.filter(q => q.status === "nein").length;

  const stats = [
    { label: t("stats.total"), value: total, accent: false },
    { label: t("stats.assessed"), value: `${answered}/${total}`, accent: false },
    { label: t("stats.implemented"), value: ja, accent: true },
    { label: t("stats.partial"), value: teilweise, accent: false },
    { label: t("stats.open"), value: nein, accent: false },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`rounded-xl px-3 sm:px-4 py-3 sm:py-3 text-center border ${
            s.accent ? "eu-gradient text-primary-foreground border-transparent" : "bg-card border-border text-card-foreground"
          }`}
        >
          <p className="text-2xl sm:text-3xl font-bold leading-tight">{s.value}</p>
          <p className={`text-[11px] sm:text-sm font-medium mt-1 leading-snug ${s.accent ? "text-primary-foreground/90" : "text-foreground/70"}`}>{s.label}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
