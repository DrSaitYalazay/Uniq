/**
 * Generic exclusion dialog for Policies/Training reports.
 * User picks items to EXCLUDE; confirms via PDF or Word button.
 */
import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText, File as FileIcon, Search, AlertCircle, Sheet } from "lucide-react";

export type ReportFormat = "pdf" | "word" | "excel";

export interface ReportItem {
  id: string;
  label: string;
  group?: string;
  meta?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  items: ReportItem[];
  initialExcluded?: string[];
  loading?: boolean;
  /** Which format buttons to show. Default: PDF + Word (backward compatible). */
  formats?: ReportFormat[];
  onExport: (format: ReportFormat, excludedIds: string[]) => void;
}

const ReportExclusionDialog = ({ open, onOpenChange, title, description, items, initialExcluded, loading, formats, onExport }: Props) => {
  const { lang } = useLanguage();
  const de = lang === "de";
  const [excluded, setExcluded] = useState<Set<string>>(new Set(initialExcluded || []));
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => i.label.toLowerCase().includes(q) || (i.group || "").toLowerCase().includes(q));
  }, [items, search]);

  const grouped = useMemo(() => {
    const m = new Map<string, ReportItem[]>();
    for (const it of filtered) {
      const g = it.group || (de ? "Allgemein" : "General");
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(it);
    }
    return Array.from(m.entries());
  }, [filtered, de]);

  const toggle = (id: string) => {
    setExcluded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const includeAll = () => setExcluded(new Set());
  const excludeAll = () => setExcluded(new Set(items.map(i => i.id)));

  const includedCount = items.length - excluded.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="px-6 flex items-center gap-2 mt-2 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={de ? "Suchen..." : "Search..."}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" onClick={includeAll} className="text-xs whitespace-nowrap">
            {de ? "Alle einbeziehen" : "Include all"}
          </Button>
          <Button variant="outline" size="sm" onClick={excludeAll} className="text-xs whitespace-nowrap">
            {de ? "Alle ausschließen" : "Exclude all"}
          </Button>
        </div>

        <div className="px-6 mt-2 flex items-center gap-2 text-xs flex-shrink-0">
          <Badge variant="secondary" className="font-mono">
            {includedCount} / {items.length} {de ? "einbezogen" : "included"}
          </Badge>
          {excluded.size > 0 && (
            <Badge variant="outline" className="st-teilweise-text st-teilweise-border st-teilweise-tint font-mono">
              {excluded.size} {de ? "ausgeschlossen" : "excluded"}
            </Badge>
          )}
        </div>

        <div className="flex-1 min-h-0 px-6 mt-3 overflow-hidden">
          <ScrollArea className="h-full border border-border rounded-md">
            <div className="p-2 space-y-3">
              {grouped.map(([group, list]) => (
                <div key={group}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1.5 py-1 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                    {group}
                  </div>
                  <div className="space-y-0.5">
                    {list.map(it => {
                      const isExcl = excluded.has(it.id);
                      return (
                        <label
                          key={it.id}
                          className={`flex items-start gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                            isExcl ? "st-teilweise-tint hover:bg-amber-100" : "hover:bg-muted/40"
                          }`}
                        >
                          <Checkbox
                            checked={!isExcl}
                            onCheckedChange={() => toggle(it.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs ${isExcl ? "text-muted-foreground line-through" : "text-foreground"}`}>
                              {it.label}
                            </div>
                            {it.meta && (
                              <div className="text-[10px] text-muted-foreground">{it.meta}</div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-6 flex items-center justify-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {de ? "Keine Einträge" : "No entries"}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="px-6 pb-6 pt-3 gap-2 sm:gap-2 border-t border-border bg-background flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {de ? "Abbrechen" : "Cancel"}
          </Button>
          {(formats ?? ["pdf", "word"]).includes("word") && (
            <Button
              onClick={() => onExport("word", Array.from(excluded))}
              disabled={loading || includedCount === 0}
              variant="outline"
              className="gap-1.5"
            >
              <FileIcon className="h-4 w-4" />
              Word
            </Button>
          )}
          {(formats ?? ["pdf", "word"]).includes("excel") && (
            <Button
              onClick={() => onExport("excel", Array.from(excluded))}
              disabled={loading || includedCount === 0}
              variant="outline"
              className="gap-1.5"
            >
              <Sheet className="h-4 w-4" />
              Excel
            </Button>
          )}
          {(formats ?? ["pdf", "word"]).includes("pdf") && (
            <Button
              onClick={() => onExport("pdf", Array.from(excluded))}
              disabled={loading || includedCount === 0}
              className="gap-1.5"
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportExclusionDialog;
