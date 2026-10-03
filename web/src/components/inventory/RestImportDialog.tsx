import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ArrowRight, ArrowLeft, PlugZap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { detectRecordArray, collectSourceFields, applyMapping, ASSET_TARGETS, type FieldMap } from "@/lib/fieldMapping";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenantId: string | null;
  services: { id: string; name: string }[];
  de: boolean;
  onImported: () => void;
}

type Step = "connect" | "map" | "preview";

export default function RestImportDialog({ open, onOpenChange, tenantId, services, de, onImported }: Props) {
  const t = (d: string, e: string) => (de ? d : e);
  const [step, setStep] = useState<Step>("connect");
  const [url, setUrl] = useState("");
  const [authType, setAuthType] = useState<"none" | "bearer" | "basic">("none");
  const [token, setToken] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [rootPath, setRootPath] = useState<string>("");
  const [map, setMap] = useState<FieldMap>({});
  const [importing, setImporting] = useState(false);

  const reset = () => {
    setStep("connect"); setUrl(""); setToken(""); setUser(""); setPass("");
    setRecords([]); setSourceFields([]); setMap({}); setRootPath("");
  };
  const close = (v: boolean) => { if (!v) reset(); onOpenChange(v); };

  const fetchPreview = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (authType === "bearer" && token) headers["Authorization"] = `Bearer ${token}`;
      if (authType === "basic" && user) headers["Authorization"] = `Basic ${btoa(`${user}:${pass}`)}`;

      const { data, error } = await supabase.functions.invoke("fetch-external-json", {
        body: { url, headers },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const payload = (data as any).data;
      const det = detectRecordArray(payload);
      if (det.records.length === 0) { toast.error(t("Keine Datensätze gefunden.","No records found.")); return; }
      setRecords(det.records);
      setRootPath(det.rootPath);
      setSourceFields(collectSourceFields(det.records));
      setStep("map");
    } catch (e: any) {
      toast.error(e.message ?? String(e));
    } finally { setLoading(false); }
  };

  const doImport = async () => {
    if (!tenantId) return;
    const mapped = applyMapping(records, map);
    const missing = mapped.filter((m) => !m.asset_name || !m.external_id).length;
    if (missing === mapped.length) { toast.error(t("Keine gültigen Datensätze — bitte Mapping prüfen.","No valid records — check mapping.")); return; }

    setImporting(true);
    try {
      const svcByName = new Map(services.map((s) => [s.name.toLowerCase(), s.id]));
      const rows = mapped
        .filter((m) => m.asset_name && m.external_id)
        .map((m) => ({
          user_id: tenantId,
          asset_name: String(m.asset_name),
          asset_type: m.asset_type ? String(m.asset_type) : "Application",
          environment: m.environment ? String(m.environment) : "Production",
          vendor: m.vendor ? String(m.vendor) : null,
          owner: m.owner ? String(m.owner) : null,
          service_id: m.service_name ? (svcByName.get(String(m.service_name).toLowerCase()) ?? services[0]?.id) : services[0]?.id,
          external_id: String(m.external_id),
          external_source: "rest_generic",
          inherited_criticality: true,
          zok_ids: [],
          instance_count: 1,
        }))
        .filter((r) => !!r.service_id);

      if (rows.length === 0) { toast.error(t("Zuerst mindestens einen Service anlegen.","Create at least one service first.")); return; }

      // Upsert on (user_id, external_source, external_id)
      const { error } = await supabase.from("assets").upsert(rows, { onConflict: "user_id,external_source,external_id" });
      if (error) throw error;
      toast.success(t(`${rows.length} Assets importiert / aktualisiert`, `${rows.length} assets imported / updated`));
      onImported();
      close(false);
    } catch (e: any) {
      toast.error(e.message ?? String(e));
    } finally { setImporting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><PlugZap size={18} className="text-accent"/>REST / JSON Import</DialogTitle>
          <DialogDescription>
            {t("Assets aus beliebiger REST-API importieren. 3 Schritte: Verbinden → Felder zuordnen → Vorschau.",
               "Import assets from any REST API. 3 steps: connect → map fields → preview.")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 text-xs">
          {(["connect","map","preview"] as Step[]).map((s, i) => (
            <Badge key={s} variant={step === s ? "default" : "outline"}>{i+1}. {s}</Badge>
          ))}
        </div>

        {step === "connect" && (
          <div className="space-y-3">
            <div>
              <Label>URL (https)</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://cmdb.example.com/api/assets" />
            </div>
            <div>
              <Label>{t("Authentifizierung","Authentication")}</Label>
              <Select value={authType} onValueChange={(v: any) => setAuthType(v)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("Keine","None")}</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {authType === "bearer" && (
              <div>
                <Label>Token</Label>
                <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="eyJ…" />
              </div>
            )}
            {authType === "basic" && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>User</Label><Input value={user} onChange={(e) => setUser(e.target.value)}/></div>
                <div><Label>Password</Label><Input type="password" value={pass} onChange={(e) => setPass(e.target.value)}/></div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {t("Zugangsdaten werden nur für diesen einen Vorschau-Aufruf verwendet und nicht gespeichert.",
                 "Credentials are used only for this preview call and are not stored.")}
            </p>
          </div>
        )}

        {step === "map" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {t(`${records.length} Datensätze gefunden${rootPath ? ` (unter „${rootPath}")` : ""}. Ordnen Sie Quell- zu Zielfeldern zu.`,
                 `${records.length} records found${rootPath ? ` (under "${rootPath}")` : ""}. Map source to target fields.`)}
            </p>
            <div className="space-y-2">
              {ASSET_TARGETS.map((t) => (
                <div key={t.key} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <Select value={map[t.key] ?? "__none__"} onValueChange={(v) => setMap((p) => ({ ...p, [t.key]: v === "__none__" ? undefined : v }))}>
                    <SelectTrigger><SelectValue placeholder={de ? "Quellfeld…" : "Source field…"}/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— {de ? "leer" : "empty"} —</SelectItem>
                      {sourceFields.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <ArrowRight size={14} className="text-muted-foreground"/>
                  <div className="text-sm">{t.label}{t.required && <span className="text-destructive ml-1">*</span>}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "preview" && (
          <ScrollArea className="h-[360px] pr-4">
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 bg-background border-b">
                <tr>{ASSET_TARGETS.map((t) => <th key={t.key} className="text-left p-1.5">{t.label}</th>)}</tr>
              </thead>
              <tbody>
                {applyMapping(records, map).slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {ASSET_TARGETS.map((t) => <td key={t.key} className="p-1.5 align-top">{r[t.key] != null ? String(r[t.key]).slice(0, 60) : <span className="opacity-40">—</span>}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {records.length > 50 && <p className="text-xs text-muted-foreground mt-2">… +{records.length - 50} {t("weitere","more")}</p>}
          </ScrollArea>
        )}

        <DialogFooter className="gap-2">
          {step !== "connect" && (
            <Button variant="ghost" onClick={() => setStep(step === "preview" ? "map" : "connect")}>
              <ArrowLeft size={14} className="mr-1"/>{t("Zurück","Back")}
            </Button>
          )}
          {step === "connect" && (
            <Button onClick={fetchPreview} disabled={!url || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              {t("Verbindung testen","Test connection")}
            </Button>
          )}
          {step === "map" && (
            <Button onClick={() => setStep("preview")} disabled={!map.asset_name || !map.external_id}>
              {t("Vorschau","Preview")}<ArrowRight size={14} className="ml-1"/>
            </Button>
          )}
          {step === "preview" && (
            <Button onClick={doImport} disabled={importing}>
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              {t("Importieren","Import")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
