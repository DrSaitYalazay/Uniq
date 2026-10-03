import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Server, Database, Cloud, Network, Settings, Globe, Monitor, Smartphone, Wifi, ShieldCheck, Cpu, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ServiceRow { id: string; service_name: string; user_marked_critical: boolean; }
interface AssetRow {
  id: string; service_id: string; asset_name: string; asset_type: string;
  inherited_criticality: boolean; user_override_criticality: boolean | null;
}

const ASSET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Application: Settings, Server, Database, Cloud, Network, "OT/ICS": Cpu, External: Globe,
  Endpoint: Monitor, "Mobile Device": Smartphone, IoT: Wifi, "Security Tool": ShieldCheck,
};

interface Props {
  services: ServiceRow[];
  assets: AssetRow[];
  de: boolean;
  onNavigateAssets: () => void;
}

/**
 * Service-centric dependency view.
 * Tier-1: Service → Assets, auto-derived from assets.service_id (no user data entry).
 * User only sees: which critical services are mapped, which lack assets.
 */
export default function ServiceDependencyView({ services, assets, de, onNavigateAssets }: Props) {
  const criticalServices = useMemo(
    () => services.filter(s => s.user_marked_critical),
    [services],
  );
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(criticalServices.map(s => s.id)));

  const toggle = (id: string) => setExpanded(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const assetsByService = useMemo(() => {
    const m: Record<string, AssetRow[]> = {};
    assets.forEach(a => {
      if (!a.service_id) return;
      (m[a.service_id] ||= []).push(a);
    });
    return m;
  }, [assets]);

  if (criticalServices.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <Info className="h-10 w-10 text-muted-foreground/50 mx-auto" />
          <p className="text-sm text-muted-foreground">
            {de
              ? "Keine kritischen Dienste markiert. Bitte zuerst in Schritt 3 kritische Dienste festlegen."
              : "No critical services marked. Please flag critical services in Step 3 first."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const mappedCount = criticalServices.filter(s => (assetsByService[s.id]?.length ?? 0) > 0).length;
  const coverage = Math.round((mappedCount / criticalServices.length) * 100);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {de ? "Dienst-Abhängigkeiten" : "Service Dependencies"}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground">
                      <Info className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right" className="max-w-sm text-xs leading-relaxed">
                    {de
                      ? "Jeder kritische Dienst wird automatisch auf die in Schritt 4 zugewiesenen Assets abgebildet. Sie pflegen hier keine Daten — Sie verifizieren nur die Zuordnung."
                      : "Each critical service is automatically mapped to the assets you assigned in Step 4. You don't enter data here — you only verify the mapping."}
                  </PopoverContent>
                </Popover>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {de
                  ? `Abdeckung: ${mappedCount} von ${criticalServices.length} kritischen Diensten haben Assets (${coverage}%).`
                  : `Coverage: ${mappedCount} of ${criticalServices.length} critical services have assets (${coverage}%).`}
              </p>
            </div>
            <Badge variant={coverage === 100 ? "default" : "secondary"} className="text-xs">
              {coverage}%
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-2">
        {criticalServices.map(svc => {
          const svcAssets = assetsByService[svc.id] ?? [];
          const isOpen = expanded.has(svc.id);
          const hasAssets = svcAssets.length > 0;
          return (
            <Card key={svc.id} className={hasAssets ? "" : "st-teilweise-border st-teilweise-tint/40"}>
              <button
                type="button"
                onClick={() => toggle(svc.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/40 transition-colors rounded-t-lg"
              >
                {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <span className="font-medium text-sm flex-1 truncate">{svc.service_name}</span>
                {hasAssets ? (
                  <Badge variant="outline" className="text-xs gap-1">
                    <CheckCircle2 className="h-3 w-3 st-ja-text" />
                    {svcAssets.length} {de ? "Assets" : "assets"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs gap-1 st-teilweise-border st-teilweise-text">
                    <AlertCircle className="h-3 w-3" />
                    {de ? "Keine Assets" : "No assets"}
                  </Badge>
                )}
              </button>
              {isOpen && (
                <CardContent className="pt-0 pb-3 px-4">
                  {hasAssets ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {svcAssets.map(a => {
                        const Icon = ASSET_ICONS[a.asset_type] || Server;
                        const crit = a.user_override_criticality !== null ? a.user_override_criticality : a.inherited_criticality;
                        return (
                          <div key={a.id} className="flex items-center gap-2 px-2.5 py-2 rounded-md border border-border bg-background">
                            <Icon className={`h-4 w-4 ${crit ? "st-nein-text" : "st-ja-text"} flex-shrink-0`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{a.asset_name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{a.asset_type}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 py-1">
                      <p className="text-xs text-muted-foreground">
                        {de
                          ? "Diesem Dienst sind noch keine Assets zugeordnet."
                          : "No assets are assigned to this service yet."}
                      </p>
                      <Button size="sm" variant="outline" onClick={onNavigateAssets} className="h-7 text-xs">
                        {de ? "Assets zuweisen" : "Assign assets"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
