/**
 * DemoDataLoader — Demo-Paket „Nordwerk Energie GmbH (Demo)" für den
 * Eigentümer-Account: NIS2, ISO/IEC 27001, EU AI Act, ISO/IEC 42001 mit allen
 * Phasen, Abhängigkeiten, Personen und Werkzeugdaten (lib/demoPackage.ts).
 *
 *  - „Demo-Paket laden": löscht ALLE fachlichen Daten dieses Mandanten und lädt
 *    das Paket neu — beliebig oft wiederholbar, immer derselbe Ausgangsstand.
 *  - „Alle Daten löschen": leert den Mandanten (Konto, Rollen, Lizenz bleiben).
 *
 * Sichtbar NUR für den Eigentümer-Account (E-Mail-Gate). Geschrieben wird
 * ausschliesslich in den Mandanten des angemeldeten Nutzers (RLS).
 */
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Trash2, Loader2 } from "lucide-react";
import { loadDemoPackage, wipeTenant, DEMO_COMPANY } from "@/lib/demoPackage";

const DEMO_OWNER_EMAILS = ["ysait2021@gmail.com", "admin@cyberwerk.online"];

export default function DemoDataLoader() {
  const { user, getTenantId, viewAsUserId } = useAuth();
  const [busy, setBusy] = useState<null | "load" | "clear">(null);
  const [schritt, setSchritt] = useState("");

  if (!user || !DEMO_OWNER_EMAILS.includes((user.email ?? "").toLowerCase())) return null;
  // Während der Studierenden-Ansicht zeigt getTenantId() auf den Mandanten des
  // Studierenden — Löschen/Laden würde dessen Daten treffen. Daher ausblenden.
  if (viewAsUserId) return null;

  const neuLaden = () => window.setTimeout(() => window.location.assign("/dashboard"), 1200);

  const load = async () => {
    if (busy) return;
    if (!confirm(`Demo-Paket „${DEMO_COMPANY}" laden?\n\nALLE bisherigen Daten dieses Accounts (Scope, Inventar, Gap-Analyse, Risiken, Umsetzung, Audit, Werkzeuge) werden gelöscht und durch das Demo-Paket ersetzt. Das Paket kann jederzeit erneut geladen werden.`)) return;
    setBusy("load");
    try {
      const tenantId = await getTenantId();
      if (!tenantId) throw new Error("Kein Mandant");
      const r = await loadDemoPackage(tenantId, user.id, setSchritt);
      toast.success(`Demo-Paket geladen ✓ — ${r.antworten} Antworten, ${r.buendel} Umsetzungsaufgaben, ${r.assets} Assets, ${r.deps} Abhängigkeiten. Seite wird neu geladen …`);
      neuLaden();
    } catch (e: any) {
      toast.error("Demo-Paket fehlgeschlagen: " + (e?.message ?? String(e)));
      setBusy(null);
    }
  };

  const clear = async () => {
    if (busy) return;
    if (!confirm("ALLE fachlichen Daten dieses Accounts löschen?\n\nKonto, Rollen und Lizenz bleiben erhalten. Das Demo-Paket kann danach neu geladen werden.")) return;
    setBusy("clear");
    try {
      const tenantId = await getTenantId();
      if (!tenantId) throw new Error("Kein Mandant");
      await wipeTenant(tenantId, setSchritt);
      toast.success("Alle Daten gelöscht ✓ — Seite wird neu geladen …");
      neuLaden();
    } catch (e: any) {
      toast.error("Löschen fehlgeschlagen: " + (e?.message ?? String(e)));
      setBusy(null);
    }
  };

  return (
    <Card className="st-teilweise-border">
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
        <Database size={15} className="st-teilweise-text" />Demo-Paket (nur dieser Account)
      </CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">
          <b>{DEMO_COMPANY}</b> — Energieversorger mit NIS2, ISO 27001, EU AI Act und ISO 42001:
          10 Personen, 7 Services, 20 Assets mit 19 Abhängigkeiten, Gap-Analyse aller vier Frameworks,
          Umsetzungsverlauf, Audit mit Befunden, Management-Review, 4 KI-Systeme, Dokumente, Richtlinien,
          Vorfälle, Lieferanten, BCM und Fristen. Laden setzt den Account jedes Mal auf diesen Stand zurück.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={load} disabled={!!busy} className="gap-1.5">
            {busy === "load" ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}Demo-Paket laden (setzt alles zurück)
          </Button>
          <Button size="sm" variant="outline" onClick={clear} disabled={!!busy} className="gap-1.5">
            {busy === "clear" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}Alle Daten löschen
          </Button>
        </div>
        {busy && <p className="text-[11px] text-muted-foreground" role="status">{schritt}</p>}
      </CardContent>
    </Card>
  );
}
