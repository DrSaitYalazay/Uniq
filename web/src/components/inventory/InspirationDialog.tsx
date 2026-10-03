import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { INSPIRATION_CATALOG } from "@/data/inspirationCatalog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenantId: string | null;
  detectedSectorKey: string | null;
  de: boolean;
  onApplied: () => void;
}

export default function InspirationDialog({ open, onOpenChange, tenantId, detectedSectorKey, de, onApplied }: Props) {
  const t = (d: string, e: string) => (de ? d : e);
  const [sectorKey, setSectorKey] = useState<string>(detectedSectorKey ?? INSPIRATION_CATALOG[0].key);
  const sector = useMemo(() => INSPIRATION_CATALOG.find((s) => s.key === sectorKey) ?? INSPIRATION_CATALOG[0], [sectorKey]);
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({});
  const [selectedAssets, setSelectedAssets] = useState<Record<string, boolean>>({}); // key = `${serviceName}::${assetName}`
  const [saving, setSaving] = useState(false);

  const toggleService = (name: string, val: boolean) => {
    setSelectedServices((p) => ({ ...p, [name]: val }));
    if (!val) {
      // remove assets under this service
      setSelectedAssets((p) => {
        const next = { ...p };
        Object.keys(next).forEach((k) => { if (k.startsWith(`${name}::`)) delete next[k]; });
        return next;
      });
    }
  };

  const svcCount = Object.values(selectedServices).filter(Boolean).length;
  const astCount = Object.values(selectedAssets).filter(Boolean).length;

  const apply = async () => {
    if (!tenantId) return;
    if (svcCount === 0) { toast.error(t("Mindestens einen Service auswählen.", "Select at least one service.")); return; }
    setSaving(true);
    try {
      const svcInserts = sector.services
        .filter((s) => selectedServices[s.name])
        .map((s) => ({
          user_id: tenantId,
          name: s.name,
          category: s.category,
          description: s.description ?? null,
          criticality: 2, // default mid — user should re-assess
        }));
      const { data: createdSvcs, error: svcErr } = await supabase.from("services").insert(svcInserts).select("id,name");
      if (svcErr) throw svcErr;
      const svcIdByName = new Map<string, string>((createdSvcs ?? []).map((r: any) => [r.name, r.id]));

      const assetInserts: any[] = [];
      sector.services.forEach((s) => {
        if (!selectedServices[s.name]) return;
        const sid = svcIdByName.get(s.name);
        if (!sid) return;
        s.assets.forEach((a) => {
          if (selectedAssets[`${s.name}::${a.name}`]) {
            assetInserts.push({
              user_id: tenantId,
              service_id: sid,
              asset_name: a.name,
              asset_type: a.type,
              environment: "Production",
              inherited_criticality: true,
              zok_ids: [],
              instance_count: 1,
            });
          }
        });
      });
      if (assetInserts.length > 0) {
        const { error: aErr } = await supabase.from("assets").insert(assetInserts);
        if (aErr) throw aErr;
      }
      toast.success(t(`${svcCount} Services und ${astCount} Assets angelegt`, `Created ${svcCount} services and ${astCount} assets`));
      onApplied();
      onOpenChange(false);
      setSelectedServices({}); setSelectedAssets({});
    } catch (e: any) {
      toast.error(e.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Lightbulb size={18} className="text-accent"/>{t("Inspirations-Checkliste","Inspiration Checklist")}</DialogTitle>
          <DialogDescription>
            {t("Typische Services und Assets für Ihren Sektor. Haken Sie ab, was auf Ihre Organisation zutrifft — nur ausgewählte Elemente werden angelegt.",
               "Typical services and assets for your sector. Check what applies to your organization — only selected items are created.")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <label className="text-xs font-medium">{t("Sektor","Sector")}:</label>
          <Select value={sectorKey} onValueChange={setSectorKey}>
            <SelectTrigger className="w-64"><SelectValue/></SelectTrigger>
            <SelectContent>
              {INSPIRATION_CATALOG.map((s) => <SelectItem key={s.key} value={s.key}>{de ? s.de : s.en}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-2">
            <Badge variant="outline">{svcCount} Services</Badge>
            <Badge variant="outline">{astCount} Assets</Badge>
          </div>
        </div>

        <ScrollArea className="h-[420px] pr-4">
          <div className="space-y-3">
            {sector.services.map((s) => {
              const sel = !!selectedServices[s.name];
              return (
                <div key={s.name} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Checkbox id={`svc-${s.name}`} checked={sel} onCheckedChange={(v) => toggleService(s.name, !!v)} />
                    <label htmlFor={`svc-${s.name}`} className="font-medium text-sm cursor-pointer">{s.name}</label>
                    <Badge variant="outline" className="text-xs ml-auto">{s.category}</Badge>
                  </div>
                  {sel && (
                    <div className="mt-2 pl-6 grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {s.assets.map((a) => {
                        const key = `${s.name}::${a.name}`;
                        return (
                          <label key={key} className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                            <Checkbox checked={!!selectedAssets[key]} onCheckedChange={(v) => setSelectedAssets((p) => ({ ...p, [key]: !!v }))} />
                            <span>{a.name}</span>
                            <span className="opacity-60">· {a.type}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>{t("Abbrechen","Cancel")}</Button>
          <Button onClick={apply} disabled={saving || svcCount === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            {t("Ausgewählte übernehmen","Add selected")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
