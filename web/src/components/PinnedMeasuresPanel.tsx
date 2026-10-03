import { useState } from "react";
import { BookOpen, ChevronDown, X } from "lucide-react";
import type { IndexedMeasure } from "@/data/allMeasuresIndex";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PinnedMeasuresPanelProps {
  pinnedIds: string[];
  onUnpin: (id: string) => void;
  lang: "de" | "en";
}

export function PinnedMeasuresPanel({ pinnedIds, onUnpin, lang }: PinnedMeasuresPanelProps) {
  const de = lang === "de";
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pinnedMeasures, setPinnedMeasures] = useState<IndexedMeasure[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  if (pinnedIds.length === 0) return null;

  async function loadDetails() {
    if (detailsOpen) {
      setDetailsOpen(false);
      return;
    }
    setDetailsOpen(true);
    if (pinnedMeasures.length > 0) return;
    setLoadingDetails(true);
    const { getMeasureById } = await import("@/data/allMeasuresIndex");
    setPinnedMeasures(pinnedIds.map(getMeasureById).filter((x): x is IndexedMeasure => Boolean(x)));
    setLoadingDetails(false);
  }

  return (
    <Card className="p-4 space-y-2 border-primary/30 bg-primary/5">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">
          {de ? "Manuell gepinnte Maßnahmen" : "Manually Pinned Measures"} · {pinnedIds.length}
        </h3>
        <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs gap-1" onClick={loadDetails}>
          <ChevronDown className={`h-3 w-3 transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
          {loadingDetails ? (de ? "Lädt..." : "Loading...") : (detailsOpen ? (de ? "Ausblenden" : "Hide") : (de ? "Details" : "Details"))}
        </Button>
      </div>
      {!detailsOpen && (
        <div className="flex flex-wrap gap-1.5">
          {pinnedIds.map(id => (
            <Badge key={id} variant="outline" className="text-[9px] font-mono">{id}</Badge>
          ))}
        </div>
      )}
      {detailsOpen && <div className="space-y-1.5">
        {pinnedMeasures.map(im => {
          const m = im.measure;
          return (
            <div key={m.id} className="rounded-md border border-border/60 bg-card p-2 flex items-start gap-2">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-foreground">{de ? m.title_de : m.title_en}</span>
                  <Badge variant="outline" className="text-[9px] font-mono">{m.id}</Badge>
                  {m.iso_ref && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">ISO {m.iso_ref}</span>}
                  {m.bsi_ref && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary/20 text-foreground">BSI {m.bsi_ref}</span>}
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{de ? m.description_de : m.description_en}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0" onClick={() => onUnpin(m.id)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>}
    </Card>
  );
}
