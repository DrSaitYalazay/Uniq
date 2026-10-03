import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Info } from "lucide-react";

export type StatusFilter = "all" | "open" | "partial" | "done" | "na" | "must";

interface Props {
  filter: StatusFilter;
  onFilter: (f: StatusFilter) => void;
  search: string;
  onSearch: (v: string) => void;
  de: boolean;
  tag: string | null;
  onTag: (t: string | null) => void;
  availableTags: string[];
  /** Whether the current framework has any control with muss = "true". Filter is disabled otherwise. */
  mustAvailable?: boolean;
  /** Framework id — shown in the disabled InfoTip so users know which framework lacks classification. */
  frameworkLabel?: string;
}

export function AssessmentFilters({
  filter, onFilter, search, onSearch, de, tag, onTag, availableTags,
  mustAvailable = true, frameworkLabel,
}: Props) {
  const chips: { value: StatusFilter; de: string; en: string; tip?: { de: string; en: string } }[] = [
    { value: "all",     de: "Alle",       en: "All" },
    { value: "open",    de: "Lücken",     en: "Gaps" },
    { value: "partial", de: "Teilweise",  en: "Partial" },
    { value: "done",    de: "Umgesetzt",  en: "Implemented" },
    { value: "na",      de: "N.a.",       en: "N/A" },
    {
      value: "must",
      de: "Nur Muss",
      en: "Must only",
      tip: {
        de: "Zeigt nur verpflichtende Kontrollen (MUSS). Nützlich für Audit-Vorbereitung und Mindestkonformität.",
        en: "Shows only mandatory controls (MUST). Useful for audit prep and minimum compliance.",
      },
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map(c => {
        const isMust = c.value === "must";
        const disabled = isMust && !mustAvailable;
        const btn = (
          <button
            key={c.value}
            onClick={() => !disabled && onFilter(c.value)}
            disabled={disabled}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === c.value
                ? "bg-primary text-primary-foreground"
                : disabled
                  ? "bg-muted/40 text-muted-foreground/50 cursor-not-allowed"
                  : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {de ? c.de : c.en}
          </button>
        );
        if (!isMust) return btn;
        return (
          <div key={c.value} className="inline-flex items-center gap-1">
            {btn}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground/70 hover:text-foreground transition-colors"
                  aria-label={de ? "Info zu 'Nur Muss'" : "Info about 'Must only'"}
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 text-xs leading-relaxed" side="bottom" align="start">
                <p className="font-semibold mb-1">{de ? "Nur Muss (MUSS)" : "Must only (MUST)"}</p>
                <p className="text-muted-foreground mb-2">
                  {de ? c.tip!.de : c.tip!.en}
                </p>
                {disabled && (
                  <p className="text-[11px] st-teilweise-text border-t border-border pt-2">
                    {de
                      ? `Für ${frameworkLabel ?? "dieses Framework"} ist die MUSS/SOLLTE/KANN-Klassifizierung noch nicht hinterlegt — der Filter ist deaktiviert.`
                      : `MUST/SHOULD/MAY classification is not yet populated for ${frameworkLabel ?? "this framework"} — filter disabled.`}
                  </p>
                )}
              </PopoverContent>
            </Popover>
          </div>
        );
      })}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-1 ml-2 border-l border-border pl-2">
          <span className="text-[11px] text-muted-foreground">Tags:</span>
          {availableTags.map(t => (
            <button
              key={t}
              onClick={() => onTag(tag === t ? null : t)}
              className={`px-2 py-0.5 rounded-full text-[11px] capitalize ${
                tag === t
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground/70 hover:text-foreground transition-colors ml-1"
                aria-label={de ? "Info zu Tags" : "Info about tags"}
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 text-xs leading-relaxed" side="bottom" align="start">
              <p className="font-semibold mb-1">{de ? "Themen-Tags" : "Topic tags"}</p>
              <p className="text-muted-foreground">
                {de
                  ? "Kontrollen sind nach Themen markiert (z. B. AI, MFA, Backup, OT, Cloud, Supplier). Wähle ein Tag, um nur passende Kontrollen zu sehen — z. B. 'AI' für KI-spezifische Anforderungen (AI Act, LLM-Governance)."
                  : "Controls are tagged by topic (e.g. AI, MFA, Backup, OT, Cloud, Supplier). Pick a tag to see only matching controls — e.g. 'AI' for AI-specific requirements (AI Act, LLM governance)."}
              </p>
            </PopoverContent>
          </Popover>
        </div>
      )}
      <div className="ml-auto relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={de ? "Kontrolle suchen …" : "Search control …"}
          className="pl-7 h-8 w-56 text-xs"
        />
      </div>
    </div>
  );
}
