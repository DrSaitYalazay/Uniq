import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, RefreshCw, Trash2, PlugZap, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  type: "servicenow" | "intune" | "rest_generic";
  config: any;
  secret_ref: string | null;
  enabled: boolean;
  schedule: string;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_stats: any;
}

const TYPE_LABEL: Record<string, string> = {
  servicenow: "ServiceNow CMDB",
  intune: "Microsoft Intune",
  rest_generic: "Generic REST",
};

export default function Integrations() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const de = lang === "de";
  const t = (d: string, e: string) => (de ? d : e);

  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [openNew, setOpenNew] = useState(false);

  // new-integration state
  const [type, setType] = useState<Integration["type"]>("servicenow");
  const [name, setName] = useState("");
  const [snInstance, setSnInstance] = useState("");
  const [snTable, setSnTable] = useState("cmdb_ci_server");
  const [snUser, setSnUser] = useState("");
  const [snPass, setSnPass] = useState("");
  const [inTenant, setInTenant] = useState("");
  const [inClient, setInClient] = useState("");
  const [inSecret, setInSecret] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("integrations").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setItems((data ?? []) as Integration[]);
    setLoading(false);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const create = async () => {
    if (!user || !name) { toast.error(t("Bitte Namen eingeben","Please enter a name")); return; }
    setCreating(true);
    try {
      const secretRef = `INT_${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
      let config: any = {};
      let secrets: { key: string; value: string }[] = [];

      if (type === "servicenow") {
        if (!snInstance || !snUser || !snPass) throw new Error(t("Alle Felder erforderlich","All fields required"));
        config = { instance: snInstance, table: snTable };
        secrets = [
          { key: `${secretRef}_USER`, value: snUser },
          { key: `${secretRef}_PASS`, value: snPass },
        ];
      } else if (type === "intune") {
        if (!inTenant || !inClient || !inSecret) throw new Error(t("Alle Felder erforderlich","All fields required"));
        config = { tenant_id: inTenant, client_id: inClient };
        secrets = [{ key: `${secretRef}_CLIENT_SECRET`, value: inSecret }];
      } else {
        config = {};
      }

      // Store secrets via edge function that uses service role
      for (const s of secrets) {
        const { error } = await supabase.functions.invoke("set-integration-secret", {
          body: { key: s.key, value: s.value },
        });
        if (error) throw new Error(`${t("Secret speichern fehlgeschlagen","Failed to store secret")}: ${error.message}`);
      }

      const { error } = await supabase.from("integrations").insert({
        user_id: user.id, name, type, config, secret_ref: secretRef,
      });
      if (error) throw error;

      toast.success(t("Verbindung angelegt","Integration created"));
      setOpenNew(false);
      setName(""); setSnInstance(""); setSnUser(""); setSnPass("");
      setInTenant(""); setInClient(""); setInSecret("");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setCreating(false); }
  };

  const runSync = async (i: Integration) => {
    setSyncing(i.id);
    try {
      const fn = i.type === "servicenow" ? "sync-servicenow" : i.type === "intune" ? "sync-intune" : null;
      if (!fn) { toast.info(t("Generic REST bitte über den Import-Wizard auf der Inventar-Seite nutzen.","Use the Import wizard on the Inventory page for Generic REST.")); return; }
      const { data, error } = await supabase.functions.invoke(fn, { body: { integration_id: i.id } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(t(`Sync erfolgreich — ${(data as any).imported} Assets`, `Sync ok — ${(data as any).imported} assets`));
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSyncing(null); }
  };

  const del = async (id: string) => {
    if (!confirm(t("Verbindung löschen?","Delete integration?"))) return;
    const { error } = await supabase.from("integrations").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success(t("Gelöscht","Deleted")); load(); }
  };

  const statusBadge = (s: Integration) => {
    if (!s.last_sync_at) return <Badge variant="outline" className="gap-1"><Clock size={11}/>{t("Nie synchronisiert","Never synced")}</Badge>;
    if (s.last_sync_status === "success") return <Badge className="gap-1 st-ja-tint st-ja-text"><CheckCircle2 size={11}/>OK</Badge>;
    return <Badge variant="destructive" className="gap-1"><XCircle size={11}/>Error</Badge>;
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><PlugZap className="text-accent"/>{t("Integrationen","Integrations")}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("Verbindungen zu externen CMDBs und Device-Management-Systemen — Assets werden automatisch synchronisiert.",
                 "Connections to external CMDBs and device management systems — assets sync automatically.")}
            </p>
          </div>
          <Button onClick={() => setOpenNew(true)}><Plus size={14} className="mr-1"/>{t("Neue Verbindung","New integration")}</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-accent" /></div>
        ) : items.length === 0 ? (
          <Card><CardContent className="text-center py-12 text-muted-foreground text-sm">
            {t("Noch keine Integrationen angelegt.","No integrations configured yet.")}
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {items.map((i) => (
              <Card key={i.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <PlugZap size={16} className="text-accent"/>{i.name}
                      <Badge variant="outline">{TYPE_LABEL[i.type]}</Badge>
                      {statusBadge(i)}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => runSync(i)} disabled={syncing === i.id}>
                        {syncing === i.id ? <Loader2 size={14} className="animate-spin mr-1"/> : <RefreshCw size={14} className="mr-1"/>}
                        {t("Jetzt synchronisieren","Sync now")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => del(i.id)}><Trash2 size={14}/></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <div>{t("Konfiguration","Config")}: <code className="text-foreground">{JSON.stringify(i.config)}</code></div>
                  {i.last_sync_at && <div>{t("Letzter Sync","Last sync")}: {new Date(i.last_sync_at).toLocaleString()} · {JSON.stringify(i.last_sync_stats)}</div>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("Neue Integration","New integration")}</DialogTitle>
            <DialogDescription>
              {t("Zugangsdaten werden verschlüsselt gespeichert und ausschließlich für Sync-Aufrufe verwendet.",
                 "Credentials are stored encrypted and only used for sync calls.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("Typ","Type")}</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="servicenow">ServiceNow CMDB</SelectItem>
                  <SelectItem value="intune">Microsoft Intune / Entra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("Anzeigename","Display name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("z.B. Prod-CMDB","e.g. Prod CMDB")}/>
            </div>

            {type === "servicenow" && (
              <>
                <div><Label>Instance</Label><Input value={snInstance} onChange={(e) => setSnInstance(e.target.value)} placeholder="acme.service-now.com"/></div>
                <div><Label>Table</Label><Input value={snTable} onChange={(e) => setSnTable(e.target.value)} placeholder="cmdb_ci_server"/></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>User</Label><Input value={snUser} onChange={(e) => setSnUser(e.target.value)}/></div>
                  <div><Label>Password</Label><Input type="password" value={snPass} onChange={(e) => setSnPass(e.target.value)}/></div>
                </div>
              </>
            )}

            {type === "intune" && (
              <>
                <div><Label>Tenant ID</Label><Input value={inTenant} onChange={(e) => setInTenant(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000"/></div>
                <div><Label>Client ID</Label><Input value={inClient} onChange={(e) => setInClient(e.target.value)}/></div>
                <div><Label>Client Secret</Label><Input type="password" value={inSecret} onChange={(e) => setInSecret(e.target.value)}/></div>
                <p className="text-xs text-muted-foreground">
                  {t("Erforderliche Graph-Berechtigung: DeviceManagementManagedDevices.Read.All (Application).",
                     "Required Graph permission: DeviceManagementManagedDevices.Read.All (Application).")}
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenNew(false)} disabled={creating}>{t("Abbrechen","Cancel")}</Button>
            <Button onClick={create} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{t("Anlegen","Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
