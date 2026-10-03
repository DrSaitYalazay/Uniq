/**
 * BusinessContinuity — Werkzeug BCM & Resilienz.
 * BIA je Geschäftsprozess (RTO/RPO), Wiederanlauf-/Übungsnachweis-Gaps sowie
 * die KRITIS-DachG-Kette je kritischer Anlage (D80 Registrierung → D81 Risiko-
 * analyse → D82 Resilienzplan) mit Countdown-Timern.
 *
 * Persistenz: useToolData (org-weit).
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToolData } from "@/hooks/useToolData";
import { toast } from "sonner";
import { fristStatus, type FristAmpel } from "@/lib/incidentTriggerEngine";
import { Activity, Plus, Trash2, AlertTriangle, CheckCircle2, Clock, Boxes, RefreshCw } from "lucide-react";
import ToolStatusChart from "@/components/tools/ToolStatusChart";
import { CHART_STATUS } from "@/lib/chartPalette";
import {
  type BcmProzess, type InventoryService, BCM_TOOL_KEY, BCM_LS_KEY,
  prozessFromService, bcmDeviations, sameName,
} from "@/lib/tools/toolLinks";

// Prozess-Typ liegt zentral in @/lib/tools/toolLinks (serviceId = Herkunft Phase 02 Inventar).
type Prozess = BcmProzess;
interface Anlage {
  id: string; name: string; sektor: string;
  einstufung: string;            // ISO date (startet D80-Frist 3M)
  registrierung: string;         // ISO date (startet D81/D82)
  d80: boolean; d81: boolean; d82: boolean;
}
interface State { prozesse: Prozess[]; anlagen: Anlage[] }
const DEFAULT: State = { prozesse: [], anlagen: [] };

const AMPEL_CLS: Record<FristAmpel, string> = {
  gruen: "st-ja-text", gelb: "st-teilweise-text", orange: "text-orange-700", rot: "text-destructive",
  unverzueglich: "text-destructive", kein_timer: "text-muted-foreground",
};
const monthsH = (m: number) => m * 30 * 24;
const isOlderThanMonths = (iso: string, m: number) => !iso || (Date.now() - new Date(iso).getTime()) > m * 30 * 86400_000;

interface Gap { typ: string; text: string; }

export default function BusinessContinuity() {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { data, setData, loading } = useToolData<State>(BCM_TOOL_KEY, BCM_LS_KEY, DEFAULT);
  const prozesse = data.prozesse ?? [];
  const anlagen = data.anlagen ?? [];

  // Phase 02 Inventar: Services (tenant-scoped über RLS, wie in Inventory.tsx)
  const { user, tenantId } = useAuth();
  const [services, setServices] = useState<InventoryService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const loadServices = async () => {
    if (!user) return [] as InventoryService[];
    setServicesLoading(true);
    const { data: rows, error } = await supabase
      .from("services")
      .select("id,name,category,criticality,owner,rto_hours,rpo_hours")
      .order("created_at");
    setServicesLoading(false);
    if (error) { toast.error(error.message); return [] as InventoryService[]; }
    const list = (rows ?? []) as InventoryService[];
    setServices(list);
    return list;
  };
  useEffect(() => { void loadServices(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user, tenantId]);
  const serviceById = useMemo(() => new Map(services.map(s => [s.id, s] as const)), [services]);

  /** „Aus Inventar übernehmen": fehlende Services als Prozesse anlegen, namensgleiche unverknüpfte Prozesse verknüpfen. */
  const importFromInventory = async () => {
    const list = services.length ? services : await loadServices();
    if (!list.length) { toast.info(de ? "Keine Services im Inventar (Phase 02) gefunden." : "No services found in the inventory (phase 02)."); return; }
    let created = 0, linked = 0;
    setData(d => {
      const cur = [...(d.prozesse ?? [])];
      for (const s of list) {
        if (cur.some(p => p.serviceId === s.id)) continue;
        const byName = cur.findIndex(p => !p.serviceId && sameName(p.name, s.name));
        if (byName >= 0) { cur[byName] = { ...cur[byName], serviceId: s.id }; linked++; continue; }
        cur.push(prozessFromService(s)); created++;
      }
      return { ...d, prozesse: cur };
    });
    toast.success(de
      ? `${created} Prozess(e) aus dem Inventar angelegt, ${linked} bestehende verknüpft.`
      : `${created} process(es) created from the inventory, ${linked} existing ones linked.`);
  };
  /** Abweichung auflösen: Inventar-Werte in die BIA übernehmen. */
  const adoptFromInventory = (p: Prozess) => {
    const s = p.serviceId ? serviceById.get(p.serviceId) : undefined;
    if (!s) return;
    patchP(p.id, {
      name: s.name || p.name, verantwortlicher: s.owner || p.verantwortlicher,
      kritisch: (s.criticality ?? 0) >= 3,
      rtoStunden: s.rto_hours ?? p.rtoStunden, rpoStunden: s.rpo_hours ?? p.rpoStunden,
    });
  };

  const planStats = useMemo(() => {
    let mit = 0, ohne = 0, nicht = 0;
    for (const p of prozesse) { if (!p.kritisch) nicht++; else if (p.planVorhanden) mit++; else ohne++; }
    return { mit, ohne, nicht };
  }, [prozesse]);

  const gaps = useMemo<Gap[]>(() => {
    const out: Gap[] = [];
    for (const p of prozesse) {
      if (!p.kritisch) continue;
      if (!p.planVorhanden) out.push({ typ: "Plan", text: `${p.name || "?"}: kritischer Prozess ohne Wiederanlaufplan (D35)` });
      if (p.planVorhanden && isOlderThanMonths(p.letzteUebung, 12)) out.push({ typ: "Übung", text: `${p.name || "?"}: keine Übung < 12 Monate (D36)` });
      if (isOlderThanMonths(p.backupRestoreTest, 12)) out.push({ typ: "Restore", text: `${p.name || "?"}: kein erfolgreicher Restore-Test < 12 Monate` });
      if (p.planVorhanden && p.planRtoStunden > p.rtoStunden && p.rtoStunden > 0) out.push({ typ: "Widerspruch", text: `${p.name || "?"}: Plan-RTO (${p.planRtoStunden}h) > BIA-RTO (${p.rtoStunden}h)` });
    }
    for (const a of anlagen) {
      if (!a.d80) out.push({ typ: "D80", text: `${a.name || "?"}: Registrierung (D80) offen` });
      if (a.registrierung && !a.d81) out.push({ typ: "D81", text: `${a.name || "?"}: Risikoanalyse (D81) offen` });
      if (a.registrierung && !a.d82) out.push({ typ: "D82", text: `${a.name || "?"}: Resilienzplan (D82) offen` });
    }
    return out;
  }, [prozesse, anlagen]);

  const addP = () => setData(d => ({ ...d, prozesse: [{ id: crypto.randomUUID(), name: "", verantwortlicher: "", kritisch: false, rtoStunden: 24, rpoStunden: 24, planVorhanden: false, planRtoStunden: 0, letzteUebung: "", backupRestoreTest: "" }, ...(d.prozesse ?? [])] }));
  const patchP = (id: string, p: Partial<Prozess>) => setData(d => ({ ...d, prozesse: (d.prozesse ?? []).map(x => x.id === id ? { ...x, ...p } : x) }));
  const removeP = (id: string) => setData(d => ({ ...d, prozesse: (d.prozesse ?? []).filter(x => x.id !== id) }));
  const addA = () => setData(d => ({ ...d, anlagen: [{ id: crypto.randomUUID(), name: "", sektor: "", einstufung: "", registrierung: "", d80: false, d81: false, d82: false }, ...(d.anlagen ?? [])] }));
  const patchA = (id: string, p: Partial<Anlage>) => setData(d => ({ ...d, anlagen: (d.anlagen ?? []).map(x => x.id === id ? { ...x, ...p } : x) }));
  const removeA = (id: string) => setData(d => ({ ...d, anlagen: (d.anlagen ?? []).filter(x => x.id !== id) }));

  const countdown = (startIso: string, months: number, done: boolean) => {
    if (done) return <span className="st-ja-text flex items-center gap-1"><CheckCircle2 size={11} />{de ? "erledigt" : "done"}</span>;
    if (!startIso) return <span className="text-muted-foreground">{de ? "kein Startdatum" : "no start date"}</span>;
    const s = fristStatus({ frist_start: new Date(startIso).toISOString(), dauer_h: monthsH(months) });
    return <span className={`flex items-center gap-1 ${AMPEL_CLS[s.ampel]}`}><Clock size={11} />{s.restText}</span>;
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">{de ? "Lädt…" : "Loading…"}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="text-primary" size={22} />{de ? "Business Continuity & Resilienz" : "Business Continuity & Resilience"}</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">{de ? "BIA je Geschäftsprozess (RTO/RPO), Wiederanlauf- und Übungsnachweise sowie die KRITIS-DachG-Kette (D80→D81→D82) mit Countdown je kritischer Anlage." : "BIA per business process (RTO/RPO), recovery/exercise evidence and the KRITIS umbrella-act chain (D80→D81→D82) with countdown per critical installation."}</p>
      </header>

      <ToolStatusChart
        title={de ? "Wiederanlaufpläne" : "Recovery plans"}
        subtitle={de
          ? `${prozesse.length} Prozess(e) · ${prozesse.filter(p => !!p.serviceId).length} aus dem Inventar (Phase 02) · ${services.length} Service(s) im Inventar`
          : `${prozesse.length} process(es) · ${prozesse.filter(p => !!p.serviceId).length} from the inventory (phase 02) · ${services.length} service(s) in the inventory`}
        items={[
          { label: de ? "kritisch, mit Plan" : "critical, with plan", value: planStats.mit, color: CHART_STATUS.ja },
          { label: de ? "kritisch, ohne Plan" : "critical, no plan", value: planStats.ohne, color: CHART_STATUS.nein },
          { label: de ? "nicht kritisch" : "not critical", value: planStats.nicht, color: CHART_STATUS.na },
        ]}
        emptyText={de ? "Noch keine Prozesse — ‚Aus Inventar übernehmen‘ oder manuell anlegen." : "No processes yet — use ‘Import from inventory’ or add manually."}
      />

      {gaps.length > 0 && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <div className="text-sm font-semibold text-destructive flex items-center gap-1.5 mb-2"><AlertTriangle size={15} />{de ? "Gaps" : "Gaps"} ({gaps.length})</div>
          <ul className="text-xs space-y-1">{gaps.map((g, i) => <li key={i} className="flex items-center gap-2"><span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive font-semibold">{g.typ}</span>{g.text}</li>)}</ul>
        </div>
      )}

      {/* BIA / Prozesse */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-border">
          <h2 className="font-semibold">{de ? "BIA — Geschäftsprozesse (D34)" : "BIA — business processes (D34)"}</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={importFromInventory} disabled={servicesLoading}
              title={de ? "Services aus Phase 02 (Inventar) als Prozesse übernehmen: Name, Verantwortlicher, kritisch (Kritikalität ≥ 3), RTO/RPO" : "Import services from phase 02 (inventory) as processes: name, owner, critical (criticality ≥ 3), RTO/RPO"}
              className="rounded-md border border-primary/40 text-primary px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5 hover:bg-primary/5 disabled:opacity-50">
              <Boxes size={15} />{de ? "Aus Inventar übernehmen" : "Import from inventory"}{services.length ? ` (${services.length})` : ""}
            </button>
            <button onClick={addP} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5"><Plus size={15} />{de ? "Prozess" : "Process"}</button>
          </div>
        </div>
        {prozesse.length === 0 ? <div className="p-6 text-sm text-muted-foreground flex items-center gap-2"><CheckCircle2 size={16} className="st-ja-text" />{de ? "Keine Prozesse." : "No processes."}</div> : (
          <div className="divide-y divide-border">
            {prozesse.map(p => {
              const svc = p.serviceId ? serviceById.get(p.serviceId) : undefined;
              const devs = svc ? bcmDeviations(p, svc) : [];
              const fieldLabel = (f: string) => f === "rto" ? "RTO" : f === "rpo" ? "RPO" : f === "kritisch" ? (de ? "Kritikalität" : "criticality") : f === "owner" ? (de ? "Verantwortlich" : "owner") : "Name";
              return (
              <div key={p.id} className="p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input value={p.name} onChange={e => patchP(p.id, { name: e.target.value })} placeholder={de ? "Geschäftsprozess" : "Business process"} className="flex-1 min-w-[180px] rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium" />
                  {p.serviceId && (
                    <Link to="/inventory" title={svc ? (de ? `Inventar-Service: ${svc.name}` : `Inventory service: ${svc.name}`) : (de ? "Service im Inventar nicht (mehr) gefunden" : "Service not found in inventory")}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md border inline-flex items-center gap-1 hover:underline ${svc ? "border-primary/30 bg-primary/5 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
                      <Boxes size={10} />{svc ? (de ? "aus Inventar" : "from inventory") : (de ? "Inventar: gelöscht" : "inventory: deleted")}
                    </Link>
                  )}
                  <input value={p.verantwortlicher} onChange={e => patchP(p.id, { verantwortlicher: e.target.value })} placeholder={de ? "Verantwortlich" : "Owner"} className="w-36 rounded-md border border-border bg-background px-2 py-1.5 text-xs" />
                  <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={p.kritisch} onChange={e => patchP(p.id, { kritisch: e.target.checked })} />{de ? "kritisch" : "critical"}</label>
                  <label className="text-xs flex items-center gap-1">RTO<input type="number" value={p.rtoStunden} onChange={e => patchP(p.id, { rtoStunden: +e.target.value })} className="w-16 rounded-md border border-border bg-background px-1 py-1 text-xs" />h</label>
                  <label className="text-xs flex items-center gap-1">RPO<input type="number" value={p.rpoStunden} onChange={e => patchP(p.id, { rpoStunden: +e.target.value })} className="w-16 rounded-md border border-border bg-background px-1 py-1 text-xs" />h</label>
                  <button onClick={() => removeP(p.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={15} /></button>
                </div>
                {devs.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] rounded-md border st-teilweise-border st-teilweise-tint st-teilweise-text px-2 py-1.5">
                    <AlertTriangle size={12} />
                    <span>
                      {devs.map(d => `${de ? "Inventar" : "Inventory"}: ${fieldLabel(d.field)} ${d.inventar} ≠ BIA ${d.bia}`).join(" · ")}
                    </span>
                    <button onClick={() => adoptFromInventory(p)} className="ml-auto inline-flex items-center gap-1 rounded border st-teilweise-border bg-background px-2 py-0.5 font-semibold hover:bg-amber-500/10">
                      <RefreshCw size={11} />{de ? "aus Inventar übernehmen" : "adopt from inventory"}
                    </button>
                  </div>
                )}
                {p.kritisch && (
                  <div className="flex flex-wrap gap-3 text-xs pl-2 border-l-2 border-border/60">
                    <label className="flex items-center gap-1"><input type="checkbox" checked={p.planVorhanden} onChange={e => patchP(p.id, { planVorhanden: e.target.checked })} />{de ? "Wiederanlaufplan (D35)" : "recovery plan (D35)"}</label>
                    {p.planVorhanden && <label className="flex items-center gap-1">Plan-RTO<input type="number" value={p.planRtoStunden} onChange={e => patchP(p.id, { planRtoStunden: +e.target.value })} className="w-14 rounded-md border border-border bg-background px-1 py-1 text-xs" />h</label>}
                    <label className="flex items-center gap-1">{de ? "letzte Übung" : "last exercise"}<input type="date" value={p.letzteUebung} onChange={e => patchP(p.id, { letzteUebung: e.target.value })} className="rounded-md border border-border bg-background px-1 py-1 text-xs" /></label>
                    <label className="flex items-center gap-1">{de ? "Restore-Test" : "restore test"}<input type="date" value={p.backupRestoreTest} onChange={e => patchP(p.id, { backupRestoreTest: e.target.value })} className="rounded-md border border-border bg-background px-1 py-1 text-xs" /></label>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KRITIS-DachG Anlagen */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border"><h2 className="font-semibold">{de ? "KRITIS-DachG — Kritische Anlagen" : "KRITIS umbrella act — critical installations"}</h2><button onClick={addA} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5"><Plus size={15} />{de ? "Anlage" : "Installation"}</button></div>
        {anlagen.length === 0 ? <div className="p-6 text-sm text-muted-foreground flex items-center gap-2"><CheckCircle2 size={16} className="st-ja-text" />{de ? "Keine kritischen Anlagen." : "No critical installations."}</div> : (
          <div className="divide-y divide-border">
            {anlagen.map(a => (
              <div key={a.id} className="p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input value={a.name} onChange={e => patchA(a.id, { name: e.target.value })} placeholder={de ? "Anlage" : "Installation"} className="flex-1 min-w-[160px] rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium" />
                  <input value={a.sektor} onChange={e => patchA(a.id, { sektor: e.target.value })} placeholder={de ? "Sektor" : "Sector"} className="w-28 rounded-md border border-border bg-background px-2 py-1.5 text-xs" />
                  <label className="text-xs flex items-center gap-1">{de ? "Einstufung" : "designation"}<input type="date" value={a.einstufung} onChange={e => patchA(a.id, { einstufung: e.target.value })} className="rounded-md border border-border bg-background px-1 py-1 text-xs" /></label>
                  <label className="text-xs flex items-center gap-1">{de ? "Registrierung" : "registration"}<input type="date" value={a.registrierung} onChange={e => patchA(a.id, { registrierung: e.target.value })} className="rounded-md border border-border bg-background px-1 py-1 text-xs" /></label>
                  <button onClick={() => removeA(a.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={15} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div className="rounded-md border border-border bg-muted/20 px-2 py-1.5"><label className="flex items-center gap-1 font-semibold"><input type="checkbox" checked={a.d80} onChange={e => patchA(a.id, { d80: e.target.checked })} />D80 {de ? "Registrierung (3 M)" : "registration (3 M)"}</label><div className="mt-1">{countdown(a.einstufung, 3, a.d80)}</div></div>
                  <div className="rounded-md border border-border bg-muted/20 px-2 py-1.5"><label className="flex items-center gap-1 font-semibold"><input type="checkbox" checked={a.d81} onChange={e => patchA(a.id, { d81: e.target.checked })} />D81 {de ? "Risikoanalyse (9 M)" : "risk analysis (9 M)"}</label><div className="mt-1">{countdown(a.registrierung, 9, a.d81)}</div></div>
                  <div className="rounded-md border border-border bg-muted/20 px-2 py-1.5"><label className="flex items-center gap-1 font-semibold"><input type="checkbox" checked={a.d82} onChange={e => patchA(a.id, { d82: e.target.checked })} />D82 {de ? "Resilienzplan (10 M)" : "resilience plan (10 M)"}</label><div className="mt-1">{countdown(a.registrierung, 10, a.d82)}</div></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
