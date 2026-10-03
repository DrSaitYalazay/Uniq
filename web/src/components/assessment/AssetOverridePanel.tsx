import { RotateCcw, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AnswerStatus, EffectiveAnswer, Reifegrad } from "@/lib/assessmentEngine";
import { REIFEGRAD_LABELS } from "@/lib/assessmentEngine";

export interface AssessmentAsset {
  id: string;
  asset_name: string;
  asset_type?: string | null;
  environment?: string | null;
  service_id?: string | null;
  service_name?: string | null;
  inherited_criticality?: number | null;
  user_override_criticality?: number | null;
}

interface Props {
  assets: AssessmentAsset[];
  effectiveByAsset: Map<string, EffectiveAnswer>;
  overrideIds: Set<string>;
  de: boolean;
  usesMaturity: boolean;
  orgEffective: EffectiveAnswer;
  onSetStatus: (assetId: string, status: AnswerStatus | null) => void;
  onSetReifegrad: (assetId: string, reifegrad: Reifegrad | null) => void;
  onApplyDefaultToAll: () => void;
  onClearAll: () => void;
}

const STATUS_META: { value: AnswerStatus; de: string; en: string; cls: string; icon: string }[] = [
  { value: "ja", de: "Umgesetzt", en: "Implemented", cls: "bg-success text-success-foreground", icon: "✓" },
  { value: "teilweise", de: "Teilweise", en: "Partial", cls: "bg-warning text-warning-foreground", icon: "◐" },
  { value: "nein", de: "Nicht umgesetzt", en: "Not implemented", cls: "bg-destructive text-destructive-foreground", icon: "✕" },
  { value: "na", de: "N.a.", en: "N/A", cls: "bg-muted text-muted-foreground", icon: "—" },
];

function criticalityOf(asset: AssessmentAsset): number | null {
  const value = Math.max(asset.user_override_criticality ?? 0, asset.inherited_criticality ?? 0);
  return value > 0 ? value : null;
}

export function AssetOverridePanel({
  assets,
  effectiveByAsset,
  overrideIds,
  de,
  usesMaturity,
  orgEffective,
  onSetStatus,
  onSetReifegrad,
  onApplyDefaultToAll,
  onClearAll,
}: Props) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Server className="h-3.5 w-3.5 text-accent" />
          {de ? "Asset-Bewertung" : "Asset assessment"}
          <Badge variant="secondary" className="text-[10px]">{assets.length}</Badge>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {overrideIds.size} {de ? "Overrides" : "overrides"}
        </Badge>
        {orgEffective.status && (
          <Badge variant="outline" className="text-[10px]">
            {de ? "Org-Default:" : "Org default:"} {STATUS_META.find(s => s.value === orgEffective.status)?.[de ? "de" : "en"]}
          </Badge>
        )}
        <span className="flex-1" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[11px]"
          disabled={!orgEffective.status}
          onClick={onApplyDefaultToAll}
        >
          {de ? "Default auf alle" : "Default to all"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[11px] gap-1"
          disabled={overrideIds.size === 0}
          onClick={onClearAll}
        >
          <RotateCcw className="h-3 w-3" /> {de ? "Overrides löschen" : "Clear overrides"}
        </Button>
      </div>

      <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1">
        {assets.map((asset) => {
          const eff = effectiveByAsset.get(asset.id) ?? orgEffective;
          const isOverride = overrideIds.has(asset.id);
          const crit = criticalityOf(asset);
          const showMaturity = usesMaturity && (eff.status === "ja" || eff.status === "teilweise");

          return (
            <div key={asset.id} className="rounded-md border border-border bg-background/70 p-2.5 space-y-2">
              <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground truncate">{asset.asset_name}</span>
                    <Badge variant={isOverride ? "default" : "outline"} className="text-[10px]">
                      {isOverride ? (de ? "Override" : "Override") : (de ? "Default" : "Default")}
                    </Badge>
                    {crit != null && <Badge variant="secondary" className="text-[10px]">Krit. {crit}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                    {asset.asset_type && <span>{asset.asset_type}</span>}
                    {asset.environment && <span>{asset.environment}</span>}
                    {asset.service_name && <span>{asset.service_name}</span>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1 lg:justify-end">
                  {STATUS_META.map((opt) => {
                    const active = eff.status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onSetStatus(asset.id, active && isOverride ? null : opt.value)}
                        className={`h-7 min-w-7 rounded-md px-2 text-[11px] font-semibold transition-all ${
                          active
                            ? `${opt.cls} ring-1 ring-ring`
                            : "border border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                        aria-pressed={active}
                      >
                        <span className="mr-1">{opt.icon}</span>{de ? opt.de : opt.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              {showMaturity && (
                <div className="flex flex-wrap items-center gap-1 border-t border-border/60 pt-2">
                  <span className="text-[11px] text-muted-foreground mr-1">{de ? "Reifegrad" : "Maturity"}</span>
                  {([0, 1, 2, 3, 4, 5] as Reifegrad[]).map((level) => {
                    const active = eff.reifegrad === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        title={REIFEGRAD_LABELS[level].hint}
                        onClick={() => onSetReifegrad(asset.id, active && isOverride ? null : level)}
                        className={`h-6 min-w-6 rounded text-[11px] font-bold transition-all ${
                          active
                            ? "bg-primary text-primary-foreground ring-1 ring-ring"
                            : "border border-border bg-background text-muted-foreground hover:text-foreground"
                        }`}
                        aria-pressed={active}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}