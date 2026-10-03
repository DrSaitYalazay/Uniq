import { useLanguage, type Lang } from "@/contexts/LanguageContext";

const LanguageToggle = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center rounded-lg overflow-hidden border border-border bg-muted shadow-sm">
      {(["de", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-3.5 py-2 text-sm font-semibold transition-all ${
            lang === l
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageToggle;
