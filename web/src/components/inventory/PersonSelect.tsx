import { Users, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToolData } from "@/hooks/useToolData";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type PersonnelRegistry,
  DEFAULT_PERSONNEL,
  PERSONNEL_TOOL_KEY,
  PERSONNEL_LS_KEY,
  formatPerson,
} from "@/lib/personnel";

interface Props {
  value: string | null | undefined;
  onChange: (v: string) => void;
  className?: string;
}

/**
 * Owner picker — bound strictly to Phase 1 personnel.
 * Rule: no free-text owners anywhere in the pipeline.
 * If a stale value exists that no longer matches a person, it is shown with
 * a "veraltet" marker so users see and can correct it.
 */
export default function PersonSelect({ value, onChange, className }: Props) {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { data } = useToolData<PersonnelRegistry>(
    PERSONNEL_TOOL_KEY, PERSONNEL_LS_KEY, DEFAULT_PERSONNEL,
  );
  const people = data.people ?? [];
  const options = people.map((p) => ({ id: p.id, label: formatPerson(p) }));

  const current = (value ?? "").trim();
  const isStale = current.length > 0 && !options.some((o) => o.label === current);

  if (people.length === 0) {
    return (
      <div className={`text-xs text-muted-foreground border rounded-md px-2 py-2 flex items-center justify-between gap-2 bg-muted/30 ${className ?? ""}`}>
        <span className="flex items-center gap-1.5">
          <Users size={12} />
          {de ? "Keine Personen in Phase 1" : "No persons in Phase 1"}
        </span>
        <Link to="/scope" className="text-accent hover:underline flex items-center gap-1">
          {de ? "hinzufügen" : "add"} <ExternalLink size={10} />
        </Link>
      </div>
    );
  }

  return (
    <Select value={current || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={de ? "Person wählen…" : "Select person…"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">— {de ? "Keine Zuordnung" : "Unassigned"} —</SelectItem>
        {isStale && <SelectItem value={current}>{current} · {de ? "veraltet" : "outdated"}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.id} value={o.label}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
