import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Circle, GitBranchPlus, GitMerge, ChevronRight, ChevronDown, Server,
  Settings, Database, Cloud, Network, Cpu, Globe, Monitor, Smartphone, Wifi, ShieldCheck,
} from "lucide-react";

export type MappingState = "no_deps" | "partially_mapped" | "fully_mapped";

export interface WorklistAsset {
  id: string;
  asset_name: string;
  asset_type: string;
  service_id: string;
  inherited_criticality: boolean;
  user_override_criticality: boolean | null;
}

export interface DepRow {
  id: string;
  source_asset_id: string;
  target_asset_id: string;
  dependency_type: string;
}

interface ServiceInfo {
  id: string;
  service_name: string;
}

interface Props {
  assets: WorklistAsset[];
  services: ServiceInfo[];
  deps: DepRow[];
  de: boolean;
  onSelectAsset?: (assetId: string) => void;
  selectedAssetId?: string | null;
}

const MAPPING_CONFIG: Record<MappingState, { icon: React.ComponentType<{ className?: string }>; labelDe: string; labelEn: string; color: string }> = {
  no_deps: { icon: Circle, labelDe: "Keine Abhängigkeiten", labelEn: "No Dependencies", color: "text-muted-foreground" },
  partially_mapped: { icon: GitBranchPlus, labelDe: "Teilweise zugeordnet", labelEn: "Partially Mapped", color: "st-teilweise-text" },
  fully_mapped: { icon: GitMerge, labelDe: "Vollständig zugeordnet", labelEn: "Fully Mapped", color: "st-ja-text" },
};

const ASSET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Application: Settings, Server: Server, Database: Database,
  Cloud: Cloud, Network: Network, "OT/ICS": Cpu, External: Globe,
  Endpoint: Monitor, "Mobile Device": Smartphone, IoT: Wifi, "Security Tool": ShieldCheck,
};

function calcMappingState(assetId: string, deps: DepRow[]): MappingState {
  const hasDep = deps.some(d => d.target_asset_id === assetId || d.source_asset_id === assetId);
  if (!hasDep) return "no_deps";
  return "fully_mapped";
}

export function calcServiceMappingCompleteness(
  serviceId: string,
  assets: WorklistAsset[],
  deps: DepRow[],
): number {
  const serviceAssets = assets.filter(a => a.service_id === serviceId);
  if (serviceAssets.length === 0) return 0;
  const mapped = serviceAssets.filter(a => calcMappingState(a.id, deps) !== "no_deps").length;
  return Math.round((mapped / serviceAssets.length) * 100);
}

export default function AssetWorkList({ assets, services, deps, de, onSelectAsset, selectedAssetId }: Props) {
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

  const toggleService = (serviceId: string) => {
    setExpandedServices(prev => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  };

  const assetMappings = useMemo(() => {
    const m: Record<string, { state: MappingState; inCount: number; outCount: number }> = {};
    assets.forEach(a => {
      const inCount = deps.filter(d => d.target_asset_id === a.id).length;
      const outCount = deps.filter(d => d.source_asset_id === a.id).length;
      const state = calcMappingState(a.id, deps);
      m[a.id] = { state, inCount, outCount };
    });
    return m;
  }, [assets, deps]);

  const stats = useMemo(() => {
    const s = { total: assets.length, no_deps: 0, partially_mapped: 0, fully_mapped: 0 };
    assets.forEach(a => { s[assetMappings[a.id]?.state as keyof typeof s]++; });
    return s;
  }, [assets, assetMappings]);

  const serviceCompleteness = useMemo(() => {
    const m: Record<string, number> = {};
    services.forEach(s => { m[s.id] = calcServiceMappingCompleteness(s.id, assets, deps); });
    return m;
  }, [services, assets, deps]);

  const assetsByService = useMemo(() => {
    const m: Record<string, WorklistAsset[]> = {};
    services.forEach(s => { m[s.id] = []; });
    assets.forEach(a => {
      if (!m[a.service_id]) m[a.service_id] = [];
      m[a.service_id].push(a);
    });
    return m;
  }, [assets, services]);

  const isCritical = (a: WorklistAsset) => a.user_override_criticality !== null ? a.user_override_criticality : a.inherited_criticality;

  return (
    <div className="space-y-4">
      {/* stats bar */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(["no_deps", "fully_mapped"] as MappingState[]).map(s => {
          const cfg = MAPPING_CONFIG[s];
          const Icon = cfg.icon;
          return (
            <div key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-muted/50 border-border">
              <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
              <span>{de ? cfg.labelDe : cfg.labelEn}</span>
              <span className="font-bold">{stats[s]}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-muted/50 border-border text-muted-foreground">
          <span>{de ? "Gesamt" : "Total"}</span>
          <span className="font-bold">{stats.total}</span>
        </div>
      </div>

      {/* Service accordion */}
      <div className="space-y-2">
        {services.map(svc => {
          const svcAssets = assetsByService[svc.id] || [];
          const isOpen = expandedServices.has(svc.id);
          const completeness = serviceCompleteness[svc.id] || 0;

          return (
            <div key={svc.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Service header */}
              <button
                onClick={() => toggleService(svc.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors text-left"
              >
                {isOpen
                  ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{svc.service_name}</span>
                    <Badge variant="secondary" className="text-[10px]">{svcAssets.length} Assets</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Progress value={completeness} className="h-1.5 w-16" />
                  <span className="text-xs font-medium text-muted-foreground w-8 text-right">{completeness}%</span>
                </div>
              </button>

              {/* Expanded asset list */}
              {isOpen && (
                <div className="border-t border-border divide-y divide-border">
                  {svcAssets.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      {de ? "Keine Assets in diesem Dienst" : "No assets in this service"}
                    </div>
                  ) : svcAssets.map(asset => {
                    const crit = isCritical(asset);
                    const mapping = assetMappings[asset.id];
                    const cfg = MAPPING_CONFIG[mapping?.state || "no_deps"];
                    const MappingIcon = cfg.icon;
                    const AssetIcon = ASSET_ICONS[asset.asset_type] || Server;
                    const isSelected = selectedAssetId === asset.id;

                    return (
                      <button
                        key={asset.id}
                        onClick={() => onSelectAsset?.(asset.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/20 transition-colors text-left ${
                          isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""
                        }`}
                      >
                        <AssetIcon className={`h-4 w-4 flex-shrink-0 ${crit ? "text-destructive" : "text-muted-foreground"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{asset.asset_name}</p>
                          <p className="text-[10px] text-muted-foreground">{asset.asset_type}</p>
                        </div>
                        <span className={`flex items-center gap-1 text-[10px] ${cfg.color}`}>
                          <MappingIcon className="h-3 w-3" />
                          {mapping?.inCount || 0}↓ {mapping?.outCount || 0}↑
                        </span>
                        {crit && (
                          <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                            {de ? "Kritisch" : "Critical"}
                          </Badge>
                        )}
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
