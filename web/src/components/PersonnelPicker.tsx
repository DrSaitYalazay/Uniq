import { useMemo, useState } from "react";
import { Users, ChevronDown, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToolData } from "@/hooks/useToolData";
import {
  type PersonnelRegistry,
  DEFAULT_PERSONNEL,
  PERSONNEL_TOOL_KEY,
  PERSONNEL_LS_KEY,
  formatPerson,
  parseAssignment,
  stringifyAssignment,
} from "@/lib/personnel";

interface Props {
  /** Legacy single-string owner field. */
  value: string;
  onChange: (next: string) => void;
  className?: string;
  placeholder?: string;
  /** Compact triggers for table cells */
  size?: "sm" | "default";
}

/**
 * Owner picker: 1 primary + multiple contributors, drawn from the central
 * personnel registry (Step 1). Falls back to free text if no people defined.
 */
export default function PersonnelPicker({ value, onChange, className, placeholder, size = "default" }: Props) {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { data } = useToolData<PersonnelRegistry>(
    PERSONNEL_TOOL_KEY,
    PERSONNEL_LS_KEY,
    DEFAULT_PERSONNEL
  );
  const people = data.people ?? [];

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const assignment = useMemo(() => parseAssignment(value), [value]);

  // label → email lookup so we can show e-mails in the picker rows
  const emailByLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of people) {
      if (p.email) m.set(formatPerson(p), p.email);
    }
    return m;
  }, [people]);

  const formatted = useMemo(() => people.map(formatPerson), [people]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return formatted;
    return formatted.filter(s => s.toLowerCase().includes(q));
  }, [formatted, search]);

  const setPrimary = (label: string) => {
    const next = { ...assignment, primary: label, contributors: assignment.contributors.filter(c => c !== label) };
    onChange(stringifyAssignment(next));
  };
  const toggleContrib = (label: string) => {
    if (label === assignment.primary) return; // can't be both
    const exists = assignment.contributors.includes(label);
    const contributors = exists
      ? assignment.contributors.filter(c => c !== label)
      : [...assignment.contributors, label];
    onChange(stringifyAssignment({ ...assignment, contributors }));
  };
  const clearAll = () => onChange("");

  const trigger = (
    <Button
      type="button"
      variant="outline"
      size={size === "sm" ? "sm" : "default"}
      className={`justify-between gap-2 font-normal ${size === "sm" ? "h-8" : ""} ${className ?? ""}`}
    >
      <span className="flex items-center gap-1.5 min-w-0 flex-1">
        <Users className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        <span className="truncate text-left">
          {assignment.primary
            ? assignment.primary + (assignment.contributors.length > 0 ? ` +${assignment.contributors.length}` : "")
            : (placeholder ?? (de ? "Verantwortlich auswählen" : "Select responsible"))}
        </span>
      </span>
      <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder={de ? "Suchen…" : "Search…"}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8"
          />
        </div>

        {/* Current selection summary */}
        {(assignment.primary || assignment.contributors.length > 0) && (
          <div className="p-2 border-b bg-muted/40 space-y-1">
            {assignment.primary && (
              <div className="flex items-center gap-1.5 text-xs">
                <Badge variant="default" className="text-[10px]">{de ? "Hauptverantwortlich" : "Primary"}</Badge>
                <span className="truncate flex-1">{assignment.primary}</span>
              </div>
            )}
            {assignment.contributors.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {assignment.contributors.map(c => (
                  <Badge key={c} variant="secondary" className="text-[10px] gap-1">
                    {c}
                    <button onClick={() => toggleContrib(c)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <button
              onClick={clearAll}
              className="text-[11px] text-muted-foreground hover:text-destructive underline"
            >
              {de ? "Alle entfernen" : "Clear all"}
            </button>
          </div>
        )}

        {/* People list */}
        <div className="max-h-64 overflow-y-auto p-1">
          {people.length === 0 ? (
            <div className="p-3 text-xs text-muted-foreground">
              {de
                ? "Noch keine Personen erfasst. Bitte unter Schritt 1 (Unternehmenskontext) → Verantwortliche Personen anlegen."
                : "No persons defined yet. Please add them under Step 1 (Company Context) → Responsible Persons."}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-3 text-xs text-muted-foreground">
              {de ? "Keine Treffer." : "No matches."}
            </div>
          ) : (
            filtered.map(label => {
              const isPrimary = assignment.primary === label;
              const isContrib = assignment.contributors.includes(label);
              const email = emailByLabel.get(label);
              return (
                <div
                  key={label}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{label}</div>
                    {email && (
                      <div className="text-[10px] text-muted-foreground truncate">{email}</div>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={isPrimary ? "default" : "ghost"}
                    className="h-6 px-2 text-[10px]"
                    onClick={() => setPrimary(label)}
                    title={de ? "Als Hauptverantwortlich setzen" : "Set as primary"}
                  >
                    {isPrimary ? <Check className="h-3 w-3" /> : (de ? "Haupt" : "Primary")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={isContrib ? "secondary" : "ghost"}
                    className="h-6 px-2 text-[10px]"
                    onClick={() => toggleContrib(label)}
                    disabled={isPrimary}
                    title={de ? "Als Mitwirkender hinzufügen" : "Add as contributor"}
                  >
                    {isContrib ? <Check className="h-3 w-3" /> : "+"}
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {/* Free-text fallback */}
        <div className="p-2 border-t">
          <Input
            placeholder={de ? "Oder freier Text…" : "Or free text…"}
            value={assignment.primary}
            onChange={e => onChange(stringifyAssignment({ ...assignment, primary: e.target.value }))}
            className="h-8 text-xs"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
