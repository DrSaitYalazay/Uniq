import { useState, useMemo } from "react";
import { AlertTriangle, Search, Filter, List, LayoutGrid, ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { nis2Domains } from "@/data/nis2Controls";
import { cn } from "@/lib/utils";

interface CustomControlEntry {
  id: string;
  question: string;
  questionEn: string;
}

interface ControlPickerProps {
  selected: string[];
  onChange: (ids: string[]) => void;
  gapControlIds?: string[];
  customControls?: CustomControlEntry[];
  de?: boolean;
}

const ControlPicker = ({ selected, onChange, gapControlIds = [], customControls = [], de = true }: ControlPickerProps) => {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [grouped, setGrouped] = useState(true);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());

  // Flatten all controls with domain info
  const allControls = useMemo(() => {
    const catalogControls = nis2Domains.flatMap(domain =>
      domain.categories.flatMap(cat =>
        cat.questions.map(q => ({
          id: q.id,
          question: q.question,
          questionEn: q.questionEn,
          domainId: domain.id,
          domain: de ? domain.titleDe : domain.title,
          category: de ? cat.titleDe : cat.titleEn,
          isCustom: false,
        }))
      )
    );
    const customEntries = customControls.map(c => ({
      id: c.id,
      question: c.question,
      questionEn: c.questionEn,
      domainId: "__custom__",
      domain: de ? "Benutzerdefiniert" : "Custom Controls",
      category: de ? "Manuell hinzugefügt" : "Manually added",
      isCustom: true,
    }));
    return [...catalogControls, ...customEntries];
  }, [de, customControls]);

  const gapSet = useMemo(() => new Set(gapControlIds), [gapControlIds]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const displayedControls = useMemo(() => {
    let list = showAll ? allControls : allControls.filter(c => gapSet.has(c.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        c => c.id.toLowerCase().includes(q) ||
          c.question.toLowerCase().includes(q) ||
          c.questionEn.toLowerCase().includes(q) ||
          c.domain.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allControls, gapSet, showAll, search]);

  // Group by DOMAIN (main groups)
  const groupedByDomain = useMemo(() => {
    const map = new Map<string, { label: string; controls: typeof displayedControls }>();
    for (const c of displayedControls) {
      if (!map.has(c.domainId)) map.set(c.domainId, { label: c.domain, controls: [] });
      map.get(c.domainId)!.controls.push(c);
    }
    return map;
  }, [displayedControls]);

  const toggleDomain = (id: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleControl = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  const selectAllGaps = () => {
    const merged = new Set([...selected, ...gapControlIds]);
    onChange(Array.from(merged));
  };

  const selectAllVisible = () => {
    const merged = new Set([...selected, ...displayedControls.map(c => c.id)]);
    onChange(Array.from(merged));
  };

  const selectAllInDomain = (domainId: string) => {
    const domainControls = displayedControls.filter(c => c.domainId === domainId).map(c => c.id);
    const merged = new Set([...selected, ...domainControls]);
    onChange(Array.from(merged));
  };

  const clearAll = () => onChange([]);

  const renderControl = (c: typeof displayedControls[number]) => {
    const isGap = gapSet.has(c.id);
    const isSelected = selectedSet.has(c.id);
    return (
      <label
        key={c.id}
        className={cn(
          "flex items-start gap-2 px-3 py-1.5 cursor-pointer transition-colors text-xs",
          isGap && !isSelected && "st-nein-tint",
          isGap && isSelected && "st-nein-tint",
          !isGap && isSelected && "bg-primary/5",
          "hover:bg-muted/50"
        )}
      >
        <Checkbox checked={isSelected} onCheckedChange={() => toggleControl(c.id)} className="mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[10px] text-muted-foreground">{c.id}</span>
            {isGap && <Badge variant="destructive" className="text-[8px] px-1 py-0">Gap</Badge>}
            {c.isCustom && <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary text-primary">Custom</Badge>}
            {!grouped && <span className="text-[9px] text-muted-foreground">· {c.domain}</span>}
          </div>
          <p className="text-[11px] leading-tight mt-0.5">{de ? c.question : c.questionEn}</p>
        </div>
      </label>
    );
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={de ? "Kontrollen suchen..." : "Search controls..."} className="pl-7 h-8 text-xs" />
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={selectAllGaps}>
          <AlertTriangle className="h-3 w-3 text-orange-500" />
          {de ? "Alle Gaps" : "All Gaps"} ({gapControlIds.length})
        </Button>
        <Button variant={showAll ? "secondary" : "outline"} size="sm" className="h-8 text-xs gap-1" onClick={() => setShowAll(!showAll)}>
          <Filter className="h-3 w-3" />
          {showAll ? (de ? "Nur Gaps" : "Gaps only") : (de ? "Alle anzeigen" : "Show all")}
        </Button>
        <Button variant={grouped ? "secondary" : "outline"} size="sm" className="h-8 text-xs gap-1" onClick={() => setGrouped(!grouped)}>
          {grouped ? <List className="h-3 w-3" /> : <LayoutGrid className="h-3 w-3" />}
          {grouped ? "Flat" : (de ? "Gruppiert" : "Grouped")}
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={selectAllVisible}>{de ? "Alle auswählen" : "Select all"}</Button>
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearAll}>{de ? "Alle abwählen" : "Deselect all"}</Button>
        <Badge variant="secondary" className="text-[10px]">{selected.length} {de ? "ausgewählt" : "selected"}</Badge>
      </div>

      <p className="text-[10px] text-muted-foreground">
        {showAll
          ? (de ? `${displayedControls.length} Kontrollen angezeigt (alle)` : `${displayedControls.length} controls shown (all)`)
          : (de ? `${displayedControls.length} Gap-Kontrollen angezeigt — „Alle anzeigen" für die vollständige Liste` : `${displayedControls.length} gap controls shown — click "Show all" for full list`)}
      </p>

      <div className="max-h-[320px] overflow-y-auto border rounded-lg">
        {displayedControls.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">{de ? "Keine Kontrollen gefunden." : "No controls found."}</p>
        )}
        {grouped ? (
          Array.from(groupedByDomain.entries()).map(([domainId, { label, controls }]) => {
            const isExpanded = expandedDomains.has(domainId);
            const domainGaps = controls.filter(c => gapSet.has(c.id)).length;
            const domainSelected = controls.filter(c => selectedSet.has(c.id)).length;
            return (
              <div key={domainId} className="border-b last:border-b-0">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 hover:bg-muted/60 cursor-pointer" onClick={() => toggleDomain(domainId)}>
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />}
                  <span className="text-xs font-semibold flex-1">{label}</span>
                  {domainGaps > 0 && <Badge variant="destructive" className="text-[8px] px-1 py-0">{domainGaps} Gap{domainGaps > 1 ? "s" : ""}</Badge>}
                  {domainSelected > 0 && <Badge variant="secondary" className="text-[8px] px-1 py-0">{domainSelected}/{controls.length}</Badge>}
                  <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5" onClick={(e) => { e.stopPropagation(); selectAllInDomain(domainId); }}>
                    {de ? "Alle" : "All"}
                  </Button>
                </div>
                {isExpanded && (
                  <div className="divide-y divide-dashed">
                    {controls.map(c => renderControl(c))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="divide-y">{displayedControls.map(c => renderControl(c))}</div>
        )}
      </div>
    </div>
  );
};

export default ControlPicker;
