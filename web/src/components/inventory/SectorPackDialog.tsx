import { useEffect, useMemo, useState } from "react";
import { Sparkles, Loader2, AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SECTOR_PACK_REGISTRY, getRegistryEntry } from "@/data/sectorPacks";
import type { SectorPack, SectorPackService } from "@/data/sectorPacks/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenantId: string | null;
  detectedSectorKey: string | null;
  de: boolean;
  onApplied: () => void;
}

export default function SectorPackDialog({ open, onOpenChange, tenantId, detectedSectorKey, de, onApplied }: Props) {
  const detected = getRegistryEntry(detectedSectorKey);
  const initialKey = detected?.pack ? detected.sectorKey : SECTOR_PACK_REGISTRY.find((e) => e.pack)?.sectorKey ?? null;
  const [activeKey, setActiveKey] = useState<string | null>(initialKey);
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({});
  const [existingSvc, setExistingSvc] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (open) setActiveKey(detected?.pack ? detected.sectorKey : SECTOR_PACK_REGISTRY.find((e) => e.pack)?.sectorKey ?? null);
  }, [open, detected]);

  const activeEntry = activeKey ? getRegistryEntry(activeKey) : null;
  const pack = activeEntry?.pack ?? null;

  useEffect(() => {
    if (!pack) { setSelectedServices({}); return; }
    const next: Record<string, boolean> = {};
    pack.services.forEach((s) => { next[s.service_name] = true; });
    setSelectedServices(next);
  }, [pack]);

  useEffect(() => {
    if (!open || !tenantId) return;
    (async () => {
      const { data } = await supabase.from("services").select("name");
      setExistingSvc(new Set((data ?? []).map((s) => (s.name ?? "").toLowerCase().trim())));
    })();
  }, [open, tenantId]);

  const stats = useMemo(() => {
    if (!pack) return { services: 0, assets: 0, dependencies: 0 };
    const chosen = pack.services.filter((s) => selectedServices[s.service_name]);
    const chosenAssetNames = new Set(chosen.flatMap((s) => s.assets.map((a) => a.asset_name.toLowerCase().trim())));
    return {
      services: chosen.length,
      assets: chosen.reduce((n, s) => n + s.assets.length, 0),
      dependencies: pack.dependencies.filter((d) =>
        chosenAssetNames.has(d.source_asset_name.toLowerCase().trim()) &&
        chosenAssetNames.has(d.target_asset_name.toLowerCase().trim())
      ).length,
    };
  }, [pack, selectedServices]);

  const applyPack = async (p: SectorPack, chosen: SectorPackService[]) => {
    if (!tenantId) return;
    setApplying(true);
    try {
      // 1) Services
      const svcMap = new Map<string, string>();
      const { data: svcEx } = await supabase.from("services").select("id,name");
      (svcEx ?? []).forEach((s) => svcMap.set((s.name ?? "").toLowerCase().trim(), s.id));

      const svcToInsert = chosen
        .filter((s) => !svcMap.has(s.service_name.toLowerCase().trim()))
        .map((s) => ({
          user_id: tenantId, name: s.service_name, category: s.category,
          criticality: s.criticality, description: s.description ?? null,
          owner: s.owner ?? null, rto_hours: s.rto_hours ?? null, rpo_hours: s.rpo_hours ?? null,
        }));
      if (svcToInsert.length > 0) {
        const { data, error } = await supabase.from("services").insert(svcToInsert).select("id,name");
        if (error) throw error;
        (data ?? []).forEach((s) => svcMap.set((s.name ?? "").toLowerCase().trim(), s.id));
      }

      // 2) Assets
      const assetMap = new Map<string, { id: string; name: string }>();
      const { data: assetEx } = await supabase.from("assets").select("id,asset_name");
      (assetEx ?? []).forEach((a) => assetMap.set((a.asset_name ?? "").toLowerCase().trim(), { id: a.id, name: a.asset_name }));

      const assetsToInsert: any[] = [];
      chosen.forEach((s) => {
        const sid = svcMap.get(s.service_name.toLowerCase().trim());
        if (!sid) return;
        s.assets.forEach((a) => {
          if (assetMap.has(a.asset_name.toLowerCase().trim())) return;
          assetsToInsert.push({
            user_id: tenantId, service_id: sid,
            asset_name: a.asset_name, asset_type: a.asset_type, environment: a.environment,
            vendor: a.vendor ?? null, data_sensitivity: a.data_sensitivity ?? null,
            external_exposure: a.external_exposure ?? null, instance_count: a.instance_count ?? 1,
            inherited_criticality: true, zok_ids: [], notes: a.notes ?? null,
          });
        });
      });
      let insA = 0;
      if (assetsToInsert.length > 0) {
        const { data, error, count } = await supabase.from("assets").insert(assetsToInsert, { count: "exact" }).select("id,asset_name");
        if (error) throw error;
        insA = count ?? assetsToInsert.length;
        (data ?? []).forEach((a) => assetMap.set((a.asset_name ?? "").toLowerCase().trim(), { id: a.id, name: a.asset_name }));
      }

      // 3) Dependencies
      const chosenAssetSet = new Set(chosen.flatMap((s) => s.assets.map((a) => a.asset_name.toLowerCase().trim())));
      const depsToInsert = p.dependencies
        .filter((d) => chosenAssetSet.has(d.source_asset_name.toLowerCase().trim()) && chosenAssetSet.has(d.target_asset_name.toLowerCase().trim()))
        .map((d) => {
          const src = assetMap.get(d.source_asset_name.toLowerCase().trim());
          const target = assetMap.get(d.target_asset_name.toLowerCase().trim());
          return {
            user_id: tenantId,
            source_type: "asset", source_id: src?.id ?? null, source_label: src?.name ?? d.source_asset_name,
            target_type: "asset", target_id: target?.id ?? null, target_label: target?.name ?? d.target_asset_name,
            dependency_type: "technical",
            criticality: 0,
            is_spof: false,
            notes: d.description,
          };
        })
        .filter((d) => d.source_id && d.target_id && d.source_id !== d.target_id);
      let insD = 0;
      if (depsToInsert.length > 0) {
        const { error } = await supabase.from("dependencies").insert(depsToInsert);
        if (error) throw error;
        insD = depsToInsert.length;
      }

      toast.success(de
        ? `Geladen: ${svcToInsert.length} Services, ${insA} Assets, ${insD} Abhängigkeiten`
        : `Loaded: ${svcToInsert.length} services, ${insA} assets, ${insD} dependencies`);
      onApplied();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? (de ? "Fehler" : "Failed"));
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            {de ? "Sektorpaket laden" : "Load sector pack"}
          </DialogTitle>
          <DialogDescription>
            {de
              ? "Vorausgefüllte Services, Assets und Abhängigkeiten als Ausgangspunkt — bitte an Ihre Umgebung anpassen."
              : "Pre-filled services, assets and dependencies as a starting point — adapt to your environment."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {SECTOR_PACK_REGISTRY.map((e) => {
            const isActive = e.sectorKey === activeKey;
            const disabled = !e.pack;
            return (
              <button
                key={e.sectorKey}
                disabled={disabled}
                onClick={() => setActiveKey(e.sectorKey)}
                className={`px-3 py-1.5 rounded-md text-xs border transition-colors flex items-center gap-1.5 ${
                  isActive ? "bg-accent text-accent-foreground border-accent"
                    : disabled ? "bg-muted/40 text-muted-foreground border-border cursor-not-allowed opacity-60"
                    : "bg-background text-foreground border-border hover:bg-accent/10"
                }`}
              >
                {disabled && <Lock className="h-3 w-3" />}
                {de ? e.label_de : e.label_en}
                {detected?.sectorKey === e.sectorKey && (
                  <Badge variant="secondary" className="text-[9px] ml-1 h-4 px-1">
                    {de ? "Ihr Sektor" : "your sector"}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {!pack && activeEntry && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3">
              <Lock className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-semibold">{de ? activeEntry.label_de : activeEntry.label_en}</p>
              <p className="text-xs text-muted-foreground max-w-md">
                {de ? activeEntry.comingSoonReason_de : activeEntry.comingSoonReason_en}
              </p>
            </div>
          )}

          {pack && (
            <>
              <div className="mt-3 mb-2 p-3 rounded-md border st-teilweise-border st-teilweise-tint flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 st-teilweise-text flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-foreground/80">{de ? pack.source_de : pack.source_en}</p>
              </div>

              <div className="flex-1 overflow-y-auto pr-3 min-h-0">
                <div className="space-y-2 pb-2">
                  {pack.services.map((svc) => {
                    const exists = existingSvc.has(svc.service_name.toLowerCase().trim());
                    return (
                      <div key={svc.service_name} className="border rounded-md p-2.5">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            className="mt-0.5"
                            checked={!!selectedServices[svc.service_name]}
                            onCheckedChange={() => setSelectedServices((p) => ({ ...p, [svc.service_name]: !p[svc.service_name] }))}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold">{svc.service_name}</span>
                              {svc.criticality >= 3 && (
                                <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/30">
                                  {de ? "Kritisch" : "Critical"}
                                </Badge>
                              )}
                              {exists && (
                                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-300">
                                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                  {de ? "Vorhanden — wird übersprungen" : "Exists — will be skipped"}
                                </Badge>
                              )}
                            </div>
                            {svc.description && <p className="text-[11px] text-muted-foreground mt-0.5">{svc.description}</p>}
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {svc.assets.map((a) => (
                                <Badge key={a.asset_name} variant="secondary" className="text-[10px] font-normal">
                                  {a.asset_name}
                                  {a.instance_count && a.instance_count > 1 && <span className="ml-1 opacity-70">×{a.instance_count}</span>}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                <span>{de ? "Wird geladen:" : "Will load:"}</span>
                <Badge variant="outline">{stats.services} Services</Badge>
                <Badge variant="outline">{stats.assets} Assets</Badge>
                <Badge variant="outline">{stats.dependencies} {de ? "Abhängigkeiten" : "Dependencies"}</Badge>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={applying}>
            {de ? "Abbrechen" : "Cancel"}
          </Button>
          <Button
            disabled={!pack || stats.services === 0 || applying}
            onClick={() => pack && applyPack(pack, pack.services.filter((s) => selectedServices[s.service_name]))}
            className="gap-1.5"
          >
            {applying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <Sparkles className="h-3.5 w-3.5" />
            {de ? "Paket laden" : "Load pack"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
