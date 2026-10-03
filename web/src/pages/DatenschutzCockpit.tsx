/**
 * DatenschutzCockpit — Werkzeug Datenschutz (DSGVO-Betriebsprozesse).
 * VVT (Art. 30) mit automatischer Gap-Logik (DSFA/AVV/Transfer/Art.26 fehlt),
 * Betroffenenanträge mit Monatsfrist-Timer (Art. 12 Abs. 3).
 *
 * Persistenz: useToolData (org-weit). Nicht zu verwechseln mit der öffentlichen
 * Datenschutzerklärung (/datenschutz).
 */
import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToolData } from "@/hooks/useToolData";
import { fristStatus, type FristAmpel } from "@/lib/incidentTriggerEngine";
import { ShieldCheck, Plus, Trash2, AlertTriangle, CheckCircle2, Clock, UserCheck } from "lucide-react";

interface Auftragsverarbeiter { id: string; name: string; avvUnterschrieben: boolean; drittland: boolean; garantie: boolean; }
interface Verarbeitung {
  id: string; name: string; zwecke: string; rechtsgrundlage: string; loeschfristen: string;
  hochrisiko: boolean; dsfaVorhanden: boolean;
  drittlandtransfer: boolean; transferGarantie: boolean;
  jointController: boolean; art26Vorhanden: boolean;
  avList: Auftragsverarbeiter[];
  status: "aktiv" | "eingestellt";
}
type AntragArt = "auskunft" | "berichtigung" | "loeschung" | "einschraenkung" | "portabilitaet" | "widerspruch";
type AntragStatus = "eingegangen" | "identitaet_geprueft" | "in_bearbeitung" | "beantwortet" | "abgeschlossen" | "abgelehnt";
interface Antrag { id: string; art: AntragArt; eingang: string; status: AntragStatus; verlaengert: boolean; verlaengerungsgrund: string; nachweis: string; }
interface State { verarbeitungen: Verarbeitung[]; antraege: Antrag[] }
const DEFAULT: State = { verarbeitungen: [], antraege: [] };

const ART_META: Record<AntragArt, { de: string; art: string }> = {
  auskunft: { de: "Auskunft", art: "Art. 15" }, berichtigung: { de: "Berichtigung", art: "Art. 16" },
  loeschung: { de: "Löschung", art: "Art. 17" }, einschraenkung: { de: "Einschränkung", art: "Art. 18" },
  portabilitaet: { de: "Portabilität", art: "Art. 20" }, widerspruch: { de: "Widerspruch", art: "Art. 21" },
};
const ANTRAG_STATUS: AntragStatus[] = ["eingegangen", "identitaet_geprueft", "in_bearbeitung", "beantwortet", "abgeschlossen", "abgelehnt"];
const AMPEL_CLS: Record<FristAmpel, string> = {
  gruen: "st-ja-text", gelb: "st-teilweise-text", orange: "text-orange-700", rot: "text-destructive",
  unverzueglich: "text-destructive", kein_timer: "text-muted-foreground",
};

interface Gap { vId: string; typ: string; text: string; }

export default function DatenschutzCockpit() {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { data, setData, loading } = useToolData<State>("datenschutz-cockpit", "cws-datenschutz-cockpit", DEFAULT);
  const [tab, setTab] = useState<"vvt" | "antraege">("vvt");

  const verarbeitungen = data.verarbeitungen ?? [];
  const antraege = data.antraege ?? [];

  // Gap-Logik (Herzstück)
  const gaps = useMemo<Gap[]>(() => {
    const out: Gap[] = [];
    for (const v of verarbeitungen) {
      if (v.status !== "aktiv") continue;
      if (v.hochrisiko && !v.dsfaVorhanden) out.push({ vId: v.id, typ: "DSFA", text: `${v.name}: DSFA fehlt (Art. 35)` });
      for (const av of v.avList) if (!av.avvUnterschrieben) out.push({ vId: v.id, typ: "AVV", text: `${v.name}: AVV für „${av.name || "?"}" fehlt (Art. 28)` });
      if (v.drittlandtransfer && !v.transferGarantie) out.push({ vId: v.id, typ: "Transfer", text: `${v.name}: Transfergrundlage/Garantie fehlt (Kap. V)` });
      if (v.jointController && !v.art26Vorhanden) out.push({ vId: v.id, typ: "Art26", text: `${v.name}: Art.-26-Vereinbarung fehlt` });
    }
    return out;
  }, [verarbeitungen]);

  const addV = () => setData(d => ({ ...d, verarbeitungen: [{ id: crypto.randomUUID(), name: "", zwecke: "", rechtsgrundlage: "Art. 6 (1) b", loeschfristen: "", hochrisiko: false, dsfaVorhanden: false, drittlandtransfer: false, transferGarantie: false, jointController: false, art26Vorhanden: false, avList: [], status: "aktiv" }, ...(d.verarbeitungen ?? [])] }));
  const patchV = (id: string, p: Partial<Verarbeitung>) => setData(d => ({ ...d, verarbeitungen: (d.verarbeitungen ?? []).map(v => v.id === id ? { ...v, ...p } : v) }));
  const removeV = (id: string) => setData(d => ({ ...d, verarbeitungen: (d.verarbeitungen ?? []).filter(v => v.id !== id) }));
  const addAv = (vId: string) => patchV(vId, { avList: [...(verarbeitungen.find(v => v.id === vId)?.avList ?? []), { id: crypto.randomUUID(), name: "", avvUnterschrieben: false, drittland: false, garantie: false }] });
  const patchAv = (vId: string, avId: string, p: Partial<Auftragsverarbeiter>) => { const v = verarbeitungen.find(x => x.id === vId); if (!v) return; patchV(vId, { avList: v.avList.map(a => a.id === avId ? { ...a, ...p } : a) }); };

  const addAntrag = () => { const now = new Date(); const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16); setData(d => ({ ...d, antraege: [{ id: crypto.randomUUID(), art: "auskunft", eingang: localIso, status: "eingegangen", verlaengert: false, verlaengerungsgrund: "", nachweis: "" }, ...(d.antraege ?? [])] })); };
  const patchA = (id: string, p: Partial<Antrag>) => setData(d => ({ ...d, antraege: (d.antraege ?? []).map(a => a.id === id ? { ...a, ...p } : a) }));
  const removeA = (id: string) => setData(d => ({ ...d, antraege: (d.antraege ?? []).filter(a => a.id !== id) }));

  if (loading) return <div className="p-6 text-sm text-muted-foreground">{de ? "Lädt…" : "Loading…"}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="text-primary" size={22} />{de ? "Datenschutz-Cockpit" : "Privacy Cockpit"}</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">{de ? "Verzeichnis von Verarbeitungstätigkeiten (Art. 30) mit automatischer Gap-Erkennung und Betroffenenanträge mit Monatsfrist." : "Records of processing activities (Art. 30) with automatic gap detection and data-subject requests with one-month deadline."}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-2xl font-bold">{verarbeitungen.length}</div><div className="text-xs text-muted-foreground">{de ? "Verarbeitungstätigkeiten" : "Processing activities"}</div></div>
        <div className={`rounded-xl border p-4 ${gaps.length ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}><div className={`text-2xl font-bold ${gaps.length ? "text-destructive" : ""}`}>{gaps.length}</div><div className="text-xs text-muted-foreground">{de ? "Offene Gaps" : "Open gaps"}</div></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-2xl font-bold">{antraege.filter(a => a.status !== "abgeschlossen" && a.status !== "abgelehnt").length}</div><div className="text-xs text-muted-foreground">{de ? "Offene Betroffenenanträge" : "Open data-subject requests"}</div></div>
      </div>

      {gaps.length > 0 && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <div className="text-sm font-semibold text-destructive flex items-center gap-1.5 mb-2"><AlertTriangle size={15} />{de ? "Automatische Gap-Erkennung" : "Automatic gap detection"}</div>
          <ul className="text-xs space-y-1">{gaps.map((g, i) => <li key={i} className="flex items-center gap-2"><span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive font-semibold">{g.typ}</span>{g.text}</li>)}</ul>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setTab("vvt")} className={`px-3 py-1.5 text-sm rounded-md ${tab === "vvt" ? "bg-primary text-primary-foreground font-semibold" : "border border-border"}`}>{de ? "VVT (Art. 30)" : "RoPA (Art. 30)"}</button>
        <button onClick={() => setTab("antraege")} className={`px-3 py-1.5 text-sm rounded-md ${tab === "antraege" ? "bg-primary text-primary-foreground font-semibold" : "border border-border"}`}>{de ? "Betroffenenanträge" : "Data-subject requests"}</button>
      </div>

      {tab === "vvt" ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between p-4 border-b border-border"><h2 className="font-semibold">{de ? "Verarbeitungstätigkeiten" : "Processing activities"}</h2><button onClick={addV} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5"><Plus size={15} />{de ? "Eintrag" : "Entry"}</button></div>
          {verarbeitungen.length === 0 ? <div className="p-6 text-sm text-muted-foreground flex items-center gap-2"><CheckCircle2 size={16} className="st-ja-text" />{de ? "Keine Verarbeitungstätigkeiten." : "No processing activities."}</div> : (
            <div className="divide-y divide-border">
              {verarbeitungen.map(v => (
                <div key={v.id} className="p-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <input value={v.name} onChange={e => patchV(v.id, { name: e.target.value })} placeholder={de ? "Name der Verarbeitung" : "Processing name"} className="flex-1 min-w-[200px] rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium" />
                    <input value={v.rechtsgrundlage} onChange={e => patchV(v.id, { rechtsgrundlage: e.target.value })} placeholder="Art. 6/9" className="w-28 rounded-md border border-border bg-background px-2 py-1.5 text-xs" />
                    <select value={v.status} onChange={e => patchV(v.id, { status: e.target.value as any })} className="text-xs rounded-md border border-border bg-background px-2 py-1.5"><option value="aktiv">{de ? "aktiv" : "active"}</option><option value="eingestellt">{de ? "eingestellt" : "discontinued"}</option></select>
                    <button onClick={() => removeV(v.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={15} /></button>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={v.hochrisiko} onChange={e => patchV(v.id, { hochrisiko: e.target.checked })} />{de ? "Hochrisiko" : "high-risk"}</label>
                    {v.hochrisiko && <label className="flex items-center gap-1.5"><input type="checkbox" checked={v.dsfaVorhanden} onChange={e => patchV(v.id, { dsfaVorhanden: e.target.checked })} />DSFA</label>}
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={v.drittlandtransfer} onChange={e => patchV(v.id, { drittlandtransfer: e.target.checked })} />{de ? "Drittlandtransfer" : "3rd-country transfer"}</label>
                    {v.drittlandtransfer && <label className="flex items-center gap-1.5"><input type="checkbox" checked={v.transferGarantie} onChange={e => patchV(v.id, { transferGarantie: e.target.checked })} />{de ? "Garantie/SCC" : "safeguard/SCC"}</label>}
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={v.jointController} onChange={e => patchV(v.id, { jointController: e.target.checked })} />Joint Controller</label>
                    {v.jointController && <label className="flex items-center gap-1.5"><input type="checkbox" checked={v.art26Vorhanden} onChange={e => patchV(v.id, { art26Vorhanden: e.target.checked })} />Art. 26</label>}
                  </div>
                  <div className="pl-2 border-l-2 border-border/60">
                    <div className="flex items-center gap-2 mb-1"><span className="text-[11px] font-semibold text-muted-foreground">{de ? "Auftragsverarbeiter" : "Processors"}</span><button onClick={() => addAv(v.id)} className="text-[11px] text-primary underline">+ {de ? "hinzufügen" : "add"}</button></div>
                    {v.avList.map(av => (
                      <div key={av.id} className="flex flex-wrap items-center gap-2 mb-1">
                        <input value={av.name} onChange={e => patchAv(v.id, av.id, { name: e.target.value })} placeholder={de ? "Dienstleister" : "Processor"} className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                        <label className={`text-[11px] flex items-center gap-1 ${!av.avvUnterschrieben ? "text-destructive" : ""}`}><input type="checkbox" checked={av.avvUnterschrieben} onChange={e => patchAv(v.id, av.id, { avvUnterschrieben: e.target.checked })} />AVV</label>
                        <label className="text-[11px] flex items-center gap-1"><input type="checkbox" checked={av.drittland} onChange={e => patchAv(v.id, av.id, { drittland: e.target.checked })} />{de ? "Drittland" : "3rd country"}</label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between p-4 border-b border-border"><h2 className="font-semibold">{de ? "Betroffenenanträge (Frist 1 Monat)" : "Data-subject requests (1-month deadline)"}</h2><button onClick={addAntrag} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5"><Plus size={15} />{de ? "Antrag" : "Request"}</button></div>
          {antraege.length === 0 ? <div className="p-6 text-sm text-muted-foreground flex items-center gap-2"><CheckCircle2 size={16} className="st-ja-text" />{de ? "Keine Anträge." : "No requests."}</div> : (
            <div className="divide-y divide-border">
              {antraege.map(a => {
                const dauer = a.verlaengert ? 2160 : 720; // 1M bzw. +2M
                const s = fristStatus({ frist_start: new Date(a.eingang).toISOString(), dauer_h: dauer });
                const done = a.status === "abgeschlossen" || a.status === "abgelehnt";
                return (
                  <div key={a.id} className="p-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <select value={a.art} onChange={e => patchA(a.id, { art: e.target.value as AntragArt })} className="text-xs rounded-md border border-border bg-background px-2 py-1.5 font-medium">{(Object.keys(ART_META) as AntragArt[]).map(k => <option key={k} value={k}>{ART_META[k].de} ({ART_META[k].art})</option>)}</select>
                      <label className="text-xs text-muted-foreground flex items-center gap-1">{de ? "Eingang" : "Received"}<input type="datetime-local" value={a.eingang} onChange={e => patchA(a.id, { eingang: e.target.value })} className="rounded-md border border-border bg-background px-2 py-1 text-xs" /></label>
                      <select value={a.status} onChange={e => patchA(a.id, { status: e.target.value as AntragStatus })} className="text-xs rounded-md border border-border bg-background px-2 py-1.5">{ANTRAG_STATUS.map(st => <option key={st} value={st}>{st}</option>)}</select>
                      <span className={`text-[11px] flex items-center gap-1 ${done ? "st-ja-text" : AMPEL_CLS[s.ampel]}`}><Clock size={11} />{done ? (de ? "erledigt" : "done") : s.restText}</span>
                      <label className="text-[11px] flex items-center gap-1"><input type="checkbox" checked={a.verlaengert} onChange={e => patchA(a.id, { verlaengert: e.target.checked })} />{de ? "verlängert +2M" : "extended +2M"}</label>
                      <button onClick={() => removeA(a.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={15} /></button>
                    </div>
                    {a.verlaengert && <input value={a.verlaengerungsgrund} onChange={e => patchA(a.id, { verlaengerungsgrund: e.target.value })} placeholder={de ? "Begründung der Verlängerung (Pflicht, Info an Betroffenen)" : "Reason for extension (mandatory, inform data subject)"} className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
