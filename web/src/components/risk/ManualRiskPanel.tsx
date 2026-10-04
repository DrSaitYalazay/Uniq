/**
 * ManualRiskPanel — US4.6: Liste der manuell erfassten Risiken (Phase 04),
 * mit Bearbeiten/Löschen. Rein präsentational; Persistenz liegt in Risk.tsx
 * (useToolData "manual-risks").
 */
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, PenLine } from "lucide-react";
import { riskLevelLabel, scoreAndLevel, type RiskMatrixConfig, type RiskLevel } from "@/lib/riskEngine";
import type { ManualRisk } from "@/lib/manualRisks";

const LEVEL_TONE: Record<RiskLevel, string> = {
  critical: "bg-destructive/85 text-destructive-foreground",
  high:     "bg-destructive/50 text-destructive-foreground",
  medium:   "st-teilweise-bg text-white",
  low:      "st-ja-bg text-white",
};

interface Props {
  risks: ManualRisk[];
  config: RiskMatrixConfig;
  de: boolean;
  onAdd: () => void;
  onEdit: (r: ManualRisk) => void;
  onDelete: (id: string) => void;
}

export function ManualRiskPanel({ risks, config, de, onAdd, onEdit, onDelete }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <PenLine className="h-4 w-4 text-copper" />
          {de ? "Eigene Risiken" : "Custom risks"}
          <Badge variant="secondary" className="text-[10px]">{risks.length}</Badge>
          <span className="ml-1 text-[11px] font-normal text-muted-foreground">
            {de
              ? "zusätzlich zu den automatisch aus der Gap-Analyse abgeleiteten Risiken"
              : "in addition to the risks derived automatically from the gap analysis"}
          </span>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={onAdd}>
          <Plus className="h-3 w-3" />
          {de ? "Eigenes Risiko" : "Custom risk"}
        </Button>
      </div>

      {risks.length === 0 ? (
        <div className="text-[11px] text-muted-foreground italic">
          {de
            ? `Noch keine eigenen Risiken. Über „+ Eigenes Risiko" wählen Sie ein Katalog-Risiko per Stichwort oder erfassen ein Risiko frei (Titel, Beschreibung, L/I, Geltungsbereich).`
            : `No custom risks yet. Use "+ Custom risk" to pick a catalog risk by keyword or capture a risk free-form (title, description, L/I, scope).`}
        </div>
      ) : (
        <div className="divide-y divide-border rounded-md border border-border">
          {risks.map(m => {
            const { score, level } = scoreAndLevel(m.likelihood, m.impact, config);
            const title = de ? m.title_de : (m.title_en || m.title_de);
            return (
              <div key={m.id} className="flex items-start gap-2 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground break-words">{title}</span>
                    <Badge variant="outline" className="text-[9px] st-teilweise-tint st-teilweise-border st-teilweise-text">
                      {de ? "manuell" : "manual"}
                    </Badge>
                    <Badge className={`${LEVEL_TONE[level]} text-[10px]`}>{riskLevelLabel(level, de ? "de" : "en").toUpperCase()}</Badge>
                    <Badge variant="outline" className="text-[10px]">Score {score}</Badge>
                    <Badge variant="outline" className="text-[10px]">L {m.likelihood} × I {m.impact}</Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {m.scope === "organization" ? (de ? "Org-weit" : "Org-wide") : (m.asset_name ?? "Asset")}
                    </Badge>
                    {m.source === "catalog" && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {de ? "Katalog" : "Catalog"} {m.source_catalog_id}
                      </span>
                    )}
                  </div>
                  {(de ? m.description_de : (m.description_en || m.description_de)) && (
                    <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                      {de ? m.description_de : (m.description_en || m.description_de)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0"
                          title={de ? "Bearbeiten" : "Edit"} onClick={() => onEdit(m)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {confirmId === m.id ? (
                    <>
                      <Button type="button" size="sm" variant="destructive" className="h-7 text-[11px] px-2"
                              onClick={() => { onDelete(m.id); setConfirmId(null); }}>
                        {de ? "Löschen" : "Delete"}
                      </Button>
                      <Button type="button" size="sm" variant="ghost" className="h-7 text-[11px] px-2"
                              onClick={() => setConfirmId(null)}>
                        {de ? "Abbrechen" : "Cancel"}
                      </Button>
                    </>
                  ) : (
                    <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            title={de ? "Löschen" : "Delete"} onClick={() => setConfirmId(m.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
