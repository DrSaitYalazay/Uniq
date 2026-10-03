import { useMemo } from "react";
import { Globe, Info, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface AssetRow {
  id: string; service_id: string; asset_name: string; asset_type: string;
}
interface DepRow {
  id: string; source_asset_id: string; target_asset_id: string;
  dependency_type: string; description: string;
}
interface ServiceRow { id: string; service_name: string; user_marked_critical: boolean; }

interface Props {
  assets: AssetRow[];
  deps: DepRow[];
  services: ServiceRow[];
  de: boolean;
  onNavigateAssets: () => void;
}

/**
 * NIS2-relevant supplier/external view.
 * Shows external assets (asset_type === "External") and which internal assets/services depend on them.
 */
type SupplierTier = 1 | 2 | 3;

function tierMeta(tier: SupplierTier, de: boolean) {
  if (tier === 1) return {
    label: "TIER-1",
    sub: de ? "Kritisch" : "Critical",
    className: "st-nein-tint st-nein-text st-nein-border",
    why: de
      ? "Unterstützt mindestens einen kritischen Dienst oder hat 3+ abhängige interne Assets. Erfordert vertragliche Sicherheits­anforderungen (NIS2 Art. 21 Abs. 2 d), regelmäßige Bewertung und Incident-Meldepflicht."
      : "Supports at least one critical service or has 3+ dependent internal assets. Requires contractual security requirements (NIS2 Art. 21(2)(d)), regular assessment and incident reporting obligation.",
  };
  if (tier === 2) return {
    label: "TIER-2",
    sub: de ? "Wichtig" : "Important",
    className: "st-teilweise-tint st-teilweise-text st-teilweise-border",
    why: de
      ? "Unterstützt nicht-kritische Dienste mit 1–2 abhängigen Assets. Standard-Sicherheits­klauseln und jährliche Bewertung empfohlen."
      : "Supports non-critical services with 1–2 dependent assets. Standard security clauses and annual assessment recommended.",
  };
  return {
    label: "TIER-3",
    sub: de ? "Standard" : "Standard",
    className: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800",
    why: de
      ? "Keine erfassten Abhängigkeiten. Minimal-Anforderungen ausreichend, bis Abhängigkeiten dokumentiert werden."
      : "No recorded dependencies. Minimal requirements sufficient until dependencies are documented.",
  };
}

export default function SupplierDependencyView({ assets, deps, services, de, onNavigateAssets }: Props) {
  const externalAssets = useMemo(() => assets.filter(a => a.asset_type === "External"), [assets]);
  const serviceMap = useMemo(() => {
    const m: Record<string, string> = {};
    services.forEach(s => { m[s.id] = s.service_name; });
    return m;
  }, [services]);
  const criticalServiceIds = useMemo(
    () => new Set(services.filter(s => s.user_marked_critical).map(s => s.id)),
    [services],
  );

  if (externalAssets.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <Info className="h-10 w-10 text-muted-foreground/50 mx-auto" />
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {de
              ? "Keine externen Lieferanten erfasst. Erfassen Sie externe Anbieter als Assets vom Typ 'External' in Schritt 4."
              : "No external suppliers recorded. Add external providers as assets of type 'External' in Step 4."}
          </p>
          <Button size="sm" variant="outline" onClick={onNavigateAssets} className="gap-2">
            <ChevronRight className="h-4 w-4" />
            {de ? "Zum Asset-Inventar" : "Go to Asset Inventory"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {de ? "Lieferanten & externe Anbieter" : "Suppliers & External Providers"}
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground">
                  <Info className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" className="max-w-sm text-xs leading-relaxed">
                {de
                  ? "NIS2 verlangt explizit die Bewertung von Lieferketten-Risiken. Hier sehen Sie alle externen Anbieter und welche internen Assets/Dienste auf sie angewiesen sind."
                  : "NIS2 explicitly requires supply-chain risk assessment. This view shows all external providers and which internal assets/services depend on them."}
              </PopoverContent>
            </Popover>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {de
              ? `${externalAssets.length} externe Anbieter erfasst.`
              : `${externalAssets.length} external providers recorded.`}
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {externalAssets.map(ext => {
          // Find internal assets that depend ON this external (external is target)
          const dependents = deps
            .filter(d => d.target_asset_id === ext.id)
            .map(d => assets.find(a => a.id === d.source_asset_id))
            .filter(Boolean) as AssetRow[];
          const affectedServiceIds = Array.from(new Set(
            dependents.map(a => a.service_id).filter(Boolean)
          ));
          const affectedServices = affectedServiceIds.map(id => serviceMap[id]).filter(Boolean);
          const hasCritical = affectedServiceIds.some(id => criticalServiceIds.has(id));
          const tier: SupplierTier = hasCritical || dependents.length >= 3
            ? 1
            : dependents.length > 0
              ? 2
              : 3;
          const meta = tierMeta(tier, de);
          return (
            <Card key={ext.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start gap-2">
                  <Globe className="h-5 w-5 st-nein-text mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-sm truncate">{ext.asset_name}</CardTitle>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${meta.className}`}
                            title={meta.sub}
                          >
                            {meta.label}
                            <Info className="h-2.5 w-2.5 opacity-70" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="max-w-xs text-xs leading-relaxed">
                          <p className="font-semibold mb-1">{meta.label} · {meta.sub}</p>
                          <p className="text-muted-foreground">{meta.why}</p>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{de ? "Externer Anbieter" : "External Provider"}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{de ? "Abhängige Assets" : "Dependent assets"}</span>
                  <Badge variant={dependents.length === 0 ? "outline" : "secondary"} className="text-[10px]">
                    {dependents.length}
                  </Badge>
                </div>
                {affectedServices.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-1">{de ? "Betroffene Dienste" : "Affected services"}</p>
                    <div className="flex flex-wrap gap-1">
                      {affectedServices.slice(0, 4).map(s => (
                        <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                      ))}
                      {affectedServices.length > 4 && (
                        <Badge variant="outline" className="text-[10px]">+{affectedServices.length - 4}</Badge>
                      )}
                    </div>
                  </div>
                )}
                {dependents.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic">
                    {de
                      ? "Noch keine internen Assets mit Abhängigkeit zu diesem Anbieter."
                      : "No internal assets currently depend on this provider."}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
