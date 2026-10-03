import { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, X, Check } from "lucide-react";
import {
  zokNodes,
  getZokRoots,
  getZokChildren,
  getZok,
  getZokPath,
  type ZokId,
  type ZokNode,
} from "@/data/zielobjektkategorien";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  value: ZokId[];
  onChange: (next: ZokId[]) => void;
  lang: "de" | "en";
  placeholder?: string;
}

const ZokMultiSelect = ({ value, onChange, lang, placeholder }: Props) => {
  const de = lang === "de";
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<ZokId>>(() => new Set());
  const [query, setQuery] = useState("");

  const selected = useMemo(() => new Set(value), [value]);

  const matchedIds = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    const out = new Set<ZokId>();
    for (const n of zokNodes) {
      if (
        n.label_de.toLowerCase().includes(q) ||
        n.label_en.toLowerCase().includes(q) ||
        n.description_de.toLowerCase().includes(q) ||
        n.description_en.toLowerCase().includes(q)
      ) {
        out.add(n.id);
        // include ancestors so the path is visible
        let p = n.parentId;
        while (p) {
          out.add(p);
          p = getZok(p)?.parentId ?? null;
        }
      }
    }
    return out;
  }, [query]);

  const toggle = (id: ZokId) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };

  const toggleExpand = (id: ZokId) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const renderNode = (node: ZokNode, depth: number) => {
    if (matchedIds && !matchedIds.has(node.id)) return null;
    const children = getZokChildren(node.id);
    const isExpanded = expanded.has(node.id) || !!matchedIds;
    const isChecked = selected.has(node.id);
    // Distinct background + left-bar accent per depth so hierarchy is obvious
    const depthStyle =
      depth === 0
        ? { bg: "bg-primary/15 hover:bg-primary/20", bar: "border-l-[3px] border-l-primary", weight: "font-semibold", size: "text-sm" }
        : depth === 1
          ? { bg: "bg-primary/[0.07] hover:bg-primary/15", bar: "border-l-[3px] border-l-primary/60", weight: "font-medium", size: "text-[13px]" }
          : depth === 2
            ? { bg: "bg-muted/50 hover:bg-muted/70", bar: "border-l-[3px] border-l-muted-foreground/40", weight: "font-normal", size: "text-[13px]" }
            : { bg: "bg-background hover:bg-accent/40", bar: "border-l-[3px] border-l-border", weight: "font-normal", size: "text-[12px]" };

    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-start gap-1.5 py-1.5 px-1.5 cursor-pointer",
            depthStyle.size,
            depthStyle.bg,
            depthStyle.bar,
            depth === 0 && "mt-1 rounded-sm",
            isChecked && "ring-1 ring-inset ring-primary/50"
          )}
          style={{ paddingLeft: 6 + depth * 14 }}
        >
          {children.length > 0 ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
              className="mt-0.5 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <span className="w-3.5" />
          )}
          <button
            type="button"
            onClick={() => toggle(node.id)}
            className="flex-1 flex items-start gap-2 text-left"
          >
            <span
              className={cn(
                "mt-0.5 h-4 w-4 rounded border flex items-center justify-center flex-shrink-0",
                isChecked ? "bg-primary border-primary text-primary-foreground" : "border-input"
              )}
            >
              {isChecked && <Check className="h-3 w-3" />}
            </span>
            <span className="flex-1">
              <span className={cn(depthStyle.weight, "text-foreground")}>
                {de ? node.label_de : node.label_en}
              </span>
              <span className="text-[11px] text-muted-foreground block leading-tight">
                {de ? node.description_de : node.description_en}
              </span>
            </span>
          </button>
        </div>
        {isExpanded && children.map(c => renderNode(c, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal h-auto min-h-9 py-1.5">
            <span className="text-xs text-muted-foreground">
              {value.length === 0
                ? (placeholder ?? (de ? "Zielobjektkategorien wählen…" : "Select target object categories…"))
                : (de
                    ? `${value.length} Kategorie${value.length === 1 ? "" : "n"} ausgewählt`
                    : `${value.length} categor${value.length === 1 ? "y" : "ies"} selected`)}
            </span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-2" align="start">
          <Input
            placeholder={de ? "Suchen…" : "Search…"}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="h-8 text-xs mb-2"
          />
          <div className="h-[340px] overflow-y-auto overscroll-contain pr-2" onWheel={(e) => e.stopPropagation()}>
            {getZokRoots().map(r => renderNode(r, 0))}
          </div>
          <div className="mt-2 pt-2 border-t flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">
              {de ? "BSI Grundschutz++ ZOK" : "BSI Grundschutz++ ZOK"}
            </span>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setOpen(false)}>
              {de ? "Fertig" : "Done"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(id => {
            const n = getZok(id);
            if (!n) return null;
            return (
              <Badge key={id} variant="secondary" className="text-[10px] gap-1 pr-1" title={getZokPath(id, lang)}>
                {de ? n.label_de : n.label_en}
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="hover:bg-destructive/20 rounded p-0.5"
                  aria-label="remove"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ZokMultiSelect;
