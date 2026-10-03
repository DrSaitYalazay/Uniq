import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Check, X, Filter } from "lucide-react";
import { searchMeasures, type IndexedMeasure } from "@/data/allMeasuresIndex";
import { zokNodes } from "@/data/zielobjektkategorien";
import { cn } from "@/lib/utils";

export interface MeasurePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Measure IDs already in the user's plan (auto-suggested + manual). */
  inPlanIds: Set<string>;
  /** Measure IDs the user has manually pinned (subset of inPlan that are user-added). */
  pinnedIds: Set<string>;
  onPin: (measureId: string) => void;
  onUnpin: (measureId: string) => void;
  lang: "de" | "en";
}

export function MeasurePicker({
  open, onOpenChange, inPlanIds, pinnedIds, onPin, onUnpin, lang,
}: MeasurePickerProps) {
  const de = lang === "de";
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<string>("all");
  const [effort, setEffort] = useState<string>("all");
  const [zokFilter, setZokFilter] = useState<string>("all");
  const [showOnlyUnselected, setShowOnlyUnselected] = useState(false);

  const results = useMemo<IndexedMeasure[]>(() => {
    return searchMeasures({
      query,
      priority: priority === "all" ? undefined : (priority as "must" | "should" | "could"),
      effort: effort === "all" ? undefined : (effort as "low" | "medium" | "high"),
      zokId: zokFilter === "all" ? undefined : (zokFilter as IndexedMeasure["zok_ids"][number]),
      excludeIds: showOnlyUnselected ? inPlanIds : undefined,
      limit: 200,
    });
  }, [query, priority, effort, zokFilter, showOnlyUnselected, inPlanIds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] !flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{de ? "Maßnahmen-Bibliothek durchsuchen" : "Search Measure Library"}</DialogTitle>
          <DialogDescription>
            {de
              ? "Vollständiger Katalog aus ISO 27002, BSI IT-Grundschutz und Domain-spezifischen Maßnahmen. Eigene Maßnahmen pinnen oder aus dem Plan entfernen."
              : "Full catalog from ISO 27002, BSI IT-Grundschutz and domain-specific measures. Pin or unpin measures from your plan."}
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-2 border-b border-border/40 pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={de ? "Suche: Titel, Beschreibung, ISO/BSI-Referenz, ZOK..." : "Search: title, description, ISO/BSI ref, ZOK..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-[120px] h-8 text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{de ? "Alle Prioritäten" : "All priorities"}</SelectItem>
                <SelectItem value="must">MUST</SelectItem>
                <SelectItem value="should">SHOULD</SelectItem>
                <SelectItem value="could">COULD</SelectItem>
              </SelectContent>
            </Select>
            <Select value={effort} onValueChange={setEffort}>
              <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{de ? "Alle Aufwände" : "All efforts"}</SelectItem>
                <SelectItem value="low">{de ? "Niedrig" : "Low"}</SelectItem>
                <SelectItem value="medium">{de ? "Mittel" : "Medium"}</SelectItem>
                <SelectItem value="high">{de ? "Hoch" : "High"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={zokFilter} onValueChange={setZokFilter}>
              <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">{de ? "Alle ZOK" : "All ZOKs"}</SelectItem>
                <SelectItem value="__isms__">{de ? "ISMS (verbundweit)" : "ISMS (org-wide)"}</SelectItem>
                {zokNodes.map(n => (
                  <SelectItem key={n.id} value={n.id}>{de ? n.label_de : n.label_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showOnlyUnselected ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setShowOnlyUnselected(v => !v)}
            >
              {de ? "Nur nicht ausgewählte" : "Only unselected"}
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">
              {results.length} {de ? "Treffer" : "results"}
              {results.length === 200 && (de ? " (max)" : " (max)")}
            </span>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-3">
          <div className="space-y-2 py-2">
            {results.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {de ? "Keine Maßnahmen gefunden." : "No measures found."}
              </p>
            ) : (
              results.map(im => {
                const m = im.measure;
                const isInPlan = inPlanIds.has(m.id);
                const isPinned = pinnedIds.has(m.id);
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "rounded-lg border p-3 space-y-1.5 transition-colors",
                      isPinned ? "border-primary/40 bg-primary/5" :
                      isInPlan ? "st-ja-border st-ja-tint" :
                      "border-border/60 bg-card hover:bg-muted/30",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[12px] font-bold text-foreground">{de ? m.title_de : m.title_en}</span>
                          <Badge variant="outline" className="text-[9px] font-mono">{m.id}</Badge>
                          <span className={cn(
                            "text-[9px] font-semibold px-1.5 py-0.5 rounded",
                            m.priority === "must" ? "st-nein-tint st-nein-text" :
                            m.priority === "should" ? "st-teilweise-tint st-teilweise-text" :
                            "st-ja-tint st-ja-text",
                          )}>{m.priority.toUpperCase()}</span>
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {de ? "Aufwand" : "Effort"}: {m.effort}
                          </span>
                          {m.iso_ref && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">ISO {m.iso_ref}</span>}
                          {m.bsi_ref && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary/20 text-foreground">BSI {m.bsi_ref}</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{de ? m.description_de : m.description_en}</p>
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          <span className="text-[9px] text-muted-foreground font-medium">{de ? "ZOK:" : "ZOK:"}</span>
                          {(de ? im.zok_labels_de : im.zok_labels_en).map((l, i) => (
                            <span key={i} className="inline-flex items-center rounded-md bg-primary/8 border border-primary/15 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        {isPinned ? (
                          <Button
                            variant="outline" size="sm" className="h-7 text-[11px] gap-1"
                            onClick={() => onUnpin(m.id)}
                          >
                            <X className="h-3 w-3" /> {de ? "Entfernen" : "Remove"}
                          </Button>
                        ) : isInPlan ? (
                          <Badge className="text-[10px] gap-1 st-ja-tint st-ja-text st-ja-border">
                            <Check className="h-3 w-3" /> {de ? "Im Plan" : "In plan"}
                          </Badge>
                        ) : (
                          <Button
                            variant="default" size="sm" className="h-7 text-[11px] gap-1"
                            onClick={() => onPin(m.id)}
                          >
                            <Plus className="h-3 w-3" /> {de ? "Pinnen" : "Pin"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
