/**
 * ThirdPartyRisk — Werkzeug Drittparteien & Auslagerung / TPRM.
 * Dienstleister-Lebenszyklus, DORA-Informationsregister (D16, CSV-Export im
 * Behörden-Format), Exit-Strategien (Pflicht bei kritisch-wichtig), D46-Klausel-
 * Check, Zertifikats-Ablauf und Konzentrationsrisiko. Automatische Gap-Logik.
 *
 * EINE Registry (seit 2026-09-11): Stammdaten (Name, Kritikalität, Personenbezug,
 * letzte Prüfung, Risikoscore) kommen aus dem Lieferanten-Check (Blob
 * `supplier-check`). Dieses Werkzeug speichert je `supplierId` nur seine
 * DORA-Zusatzfelder (kat/lei/funktionen/region/klauseln/exit/zertifikat/
 * subdienstleister/status). TPRM-eigene Einträge ohne supplierId bleiben erlaubt;
 * bestehende Einträge werden einmalig per Namensabgleich verknüpft. Wird ein
 * Lieferant im Lieferanten-Check gelöscht, bleibt der Zusatz hier als „verwaist"
 * sichtbar (nichts wird stumm gelöscht).
 *
 * Persistenz: useToolData (org-weit).
 */
import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToolData } from "@/hooks/useToolData";
import { toast } from "sonner";
import { Network, Plus, Trash2, AlertTriangle, CheckCircle2, Download, Truck, Link2, Unlink } from "lucide-react";
import ToolStatusChart from "@/components/tools/ToolStatusChart";
import { CHART_SEVERITY } from "@/lib/chartPalette";
import {
  type Dienstleister, type TprmState, type TprmKat as Kat, type TprmKrit as Krit, type TprmStatus as Status,
  TPRM_DEFAULT, TPRM_TOOL_KEY, TPRM_LS_KEY, D46_KLAUSELN,
  type SupplierState, SUPPLIER_DEFAULT, SUPPLIER_TOOL_KEY, SUPPLIER_LS_KEY,
  projectDienstleister, newDienstleisterForSupplier, sameName,
} from "@/lib/tools/toolLinks";

type State = TprmState;
const DEFAULT: State = TPRM_DEFAULT;

const KRIT_META: Record<Krit, { de: string; en: string; cls: string }> = {
  kritisch_wichtig: { de: "Kritisch-wichtig", en: "Critical-important", cls: "bg-destructive/15 text-destructive" },
  wichtig: { de: "Wichtig", en: "Important", cls: "bg-orange-500/15 text-orange-600" },
  normal: { de: "Normal", en: "Normal", cls: "st-ja-tint st-ja-text" },
};
const KAT_META: Record<Kat, string> = { ikt: "IKT", nicht_ikt: "Nicht-IKT" };

interface Gap { id: string; typ: string; text: string; }

export default function ThirdPartyRisk() {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { data, setData, loading } = useToolData<State>(TPRM_TOOL_KEY, TPRM_LS_KEY, DEFAULT);
  // Lieferanten-Check nur lesend: Stammdaten-Quelle.
  const { data: supData, loading: supLoading } = useToolData<SupplierState>(SUPPLIER_TOOL_KEY, SUPPLIER_LS_KEY, SUPPLIER_DEFAULT);
  const suppliers = useMemo(() => supData?.suppliers ?? [], [supData]);
  const supById = useMemo(() => new Map(suppliers.map(s => [s.id, s] as const)), [suppliers]);

  const raw = useMemo(() => data.dienstleister ?? [], [data]);

  // Einmalige Migration je Sitzung: TPRM-Einträge ohne supplierId per Namensabgleich verknüpfen.
  const migratedRef = useRef(false);
  useEffect(() => {
    if (loading || supLoading || migratedRef.current) return;
    migratedRef.current = true;
    const taken = new Set(raw.map(d => d.supplierId).filter(Boolean) as string[]);
    let n = 0;
    const next = raw.map(d => {
      if (d.supplierId || !d.name) return d;
      const s = suppliers.find(x => !taken.has(x.id) && sameName(x.name, d.name));
      if (!s) return d;
      taken.add(s.id); n++;
      return { ...d, supplierId: s.id };
    });
    if (n > 0) {
      setData(prev => ({ ...prev, dienstleister: next }));
      toast.info(de
        ? `${n} Dienstleister per Namensabgleich mit dem Lieferanten-Check verknüpft.`
        : `${n} vendor(s) linked to the supplier check by name match.`);
    }
  }, [loading, supLoading, raw, suppliers, setData, de]);

  // Projizierte Sicht: Stammdaten aus Lieferanten-Check, Zusatz aus diesem Blob.
  const dl = useMemo(() => raw.map(d => projectDienstleister(d, d.supplierId ? supById.get(d.supplierId) : undefined)), [raw, supById]);
  const isLinked = (d: Dienstleister) => !!d.supplierId && supById.has(d.supplierId);
  const isOrphan = (d: Dienstleister) => !!d.supplierId && !supById.has(d.supplierId);

  // Lieferanten, die noch keinen DORA-Zusatz haben.
  const unregistered = useMemo(() => {
    const linked = new Set(raw.map(d => d.supplierId).filter(Boolean));
    return suppliers.filter(s => !s.archived && !!s.name && !linked.has(s.id));
  }, [raw, suppliers]);

  const gaps = useMemo<Gap[]>(() => {
    const out: Gap[] = [];
    const now = Date.now();
    for (const d of dl) {
      if (d.status === "beendet") continue;
      if (d.kritikalitaet === "kritisch_wichtig" && !d.exitStrategie) out.push({ id: d.id, typ: "Exit", text: `${d.name || "?"}: Exit-Strategie fehlt (DORA Art. 28, kritisch-wichtig)` });
      if ((d.klauseln ?? []).length < D46_KLAUSELN.length) out.push({ id: d.id, typ: "Vertrag", text: `${d.name || "?"}: D46-Pflichtklauseln unvollständig (${(d.klauseln ?? []).length}/${D46_KLAUSELN.length})` });
      if (d.personenbezug && !d.avvVorhanden) out.push({ id: d.id, typ: "AVV", text: `${d.name || "?"}: AVV fehlt (personenbezogene Daten)` });
      if (d.zertifikatBis && new Date(d.zertifikatBis).getTime() < now) out.push({ id: d.id, typ: "Zertifikat", text: `${d.name || "?"}: Nachweis/Zertifikat abgelaufen (${d.zertifikatBis})` });
      if (isOrphan(d)) out.push({ id: d.id, typ: "Verwaist", text: `${d.name || "?"}: Lieferant im Lieferanten-Check gelöscht — Zusatzdaten prüfen/lösen` });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dl, supById]);

  // Konzentrationsrisiko (D47): mehrere kritisch-wichtige Funktionen bei einem Anbieter/Region
  const konzentration = useMemo(() => {
    const perRegion: Record<string, number> = {};
    for (const d of dl) if (d.kritikalitaet === "kritisch_wichtig" && d.region) perRegion[d.region] = (perRegion[d.region] ?? 0) + 1;
    return Object.entries(perRegion).filter(([, n]) => n >= 2).map(([r, n]) => `${r}: ${n} kritisch-wichtige Anbieter`);
  }, [dl]);

  const kritStats = useMemo(() => {
    const c = { kritisch_wichtig: 0, wichtig: 0, normal: 0 };
    for (const d of dl) if (d.status !== "beendet") c[d.kritikalitaet]++;
    return c;
  }, [dl]);

  const add = () => setData(d => ({ dienstleister: [{ id: crypto.randomUUID(), name: "", lei: "", kat: "ikt", kritikalitaet: "normal", funktionen: "", region: "", riskScore: 0, letztePruefung: "", klauseln: [], personenbezug: false, avvVorhanden: false, exitStrategie: false, exitGetestet: "", zertifikatBis: "", subdienstleister: "", status: "angebahnt" }, ...(d.dienstleister ?? [])] }));
  const addFromSupplier = (supplierId: string) => {
    const s = supById.get(supplierId);
    if (!s) return;
    setData(d => {
      if ((d.dienstleister ?? []).some(x => x.supplierId === supplierId)) return d;
      return { dienstleister: [newDienstleisterForSupplier(s), ...(d.dienstleister ?? [])] };
    });
  };
  const addAllUnregistered = () => {
    const list = unregistered.map(s => newDienstleisterForSupplier(s));
    if (!list.length) return;
    setData(d => ({ dienstleister: [...list.filter(n => !(d.dienstleister ?? []).some(x => x.supplierId === n.supplierId)), ...(d.dienstleister ?? [])] }));
    toast.success(de ? `${list.length} Lieferant(en) ins DORA-Register aufgenommen.` : `${list.length} supplier(s) added to the DORA register.`);
  };
  const patch = (id: string, p: Partial<Dienstleister>) => setData(d => ({ dienstleister: (d.dienstleister ?? []).map(x => x.id === id ? { ...x, ...p } : x) }));
  const remove = (id: string) => setData(d => ({ dienstleister: (d.dienstleister ?? []).filter(x => x.id !== id) }));
  const unlink = (id: string) => setData(d => ({ dienstleister: (d.dienstleister ?? []).map(x => x.id === id ? { ...x, supplierId: undefined } : x) }));
  const toggleKlausel = (id: string, k: string) => { const d = raw.find(x => x.id === id); if (!d) return; const kl = d.klauseln ?? []; patch(id, { klauseln: kl.includes(k) ? kl.filter(x => x !== k) : [...kl, k] }); };

  // DORA-Informationsregister (D16) CSV-Export im Behörden-nahen Format
  const exportDora = () => {
    const head = ["Name", "LEI", "Kategorie", "Kritikalität", "Funktionen", "Subunternehmer", "Exit-Strategie", "Status"];
    const rows = dl.filter(d => d.kat === "ikt").map(d => [d.name, d.lei, KAT_META[d.kat], KRIT_META[d.kritikalitaet].de, d.funktionen, d.subdienstleister, d.exitStrategie ? "ja" : "nein", d.status]);
    const csv = [head, ...rows].map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "DORA_Informationsregister_D16.csv"; a.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">{de ? "Lädt…" : "Loading…"}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Network className="text-primary" size={22} />{de ? "Drittparteien & Auslagerung" : "Third-party & outsourcing"}</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">{de ? "Dienstleister-Lebenszyklus mit DORA-Informationsregister, Exit-Strategien, Vertragsklausel-Prüfung und Konzentrationsrisiko." : "Vendor lifecycle with DORA information register, exit strategies, contract-clause checks and concentration risk."}</p>
      </header>

      {/* Hinweis: eine Registry */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-xs flex flex-wrap items-center gap-2">
        <Truck size={14} className="text-primary" />
        <span>
          {de
            ? "Stammdaten (Name, Kritikalität, Personenbezug, letzte Prüfung, Risikoscore) kommen aus dem Lieferanten-Check. Hier werden nur die DORA-Zusatzfelder gepflegt."
            : "Master data (name, criticality, personal data, last review, risk score) comes from the Supplier Check. Only the DORA-specific fields are maintained here."}
        </span>
        <Link to="/suppliers" className="ml-auto text-primary font-medium hover:underline inline-flex items-center gap-1"><Link2 size={12} />{de ? "Lieferanten-Check öffnen" : "Open Supplier Check"}</Link>
      </div>

      <ToolStatusChart
        title={de ? "DORA-Einstufung" : "DORA classification"}
        subtitle={de
          ? `${dl.filter(d => d.status !== "beendet").length} aktive Dienstleister · ${dl.filter(isLinked).length} mit Stammdaten aus dem Lieferanten-Check · ${gaps.length} offene Gaps`
          : `${dl.filter(d => d.status !== "beendet").length} active vendors · ${dl.filter(isLinked).length} with master data from the Supplier Check · ${gaps.length} open gaps`}
        items={[
          { label: de ? "kritisch-wichtig" : "critical-important", value: kritStats.kritisch_wichtig, color: CHART_SEVERITY.kritisch },
          { label: de ? "wichtig" : "important", value: kritStats.wichtig, color: CHART_SEVERITY.hoch },
          { label: "normal", value: kritStats.normal, color: CHART_SEVERITY.niedrig },
        ]}
        emptyText={de ? "Noch keine Dienstleister." : "No vendors yet."}
      />

      {(gaps.length > 0 || konzentration.length > 0) && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-2">
          {gaps.length > 0 && <div><div className="text-sm font-semibold text-destructive flex items-center gap-1.5 mb-1"><AlertTriangle size={15} />{de ? "Gaps" : "Gaps"}</div><ul className="text-xs space-y-1">{gaps.map((g, i) => <li key={i} className="flex items-center gap-2"><span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive font-semibold">{g.typ}</span>{g.text}</li>)}</ul></div>}
          {konzentration.length > 0 && <div className="text-xs"><span className="font-semibold">{de ? "Konzentrationsrisiko (D47): " : "Concentration risk (D47): "}</span>{konzentration.join(" · ")}</div>}
        </div>
      )}

      {/* Lieferanten ohne DORA-Zusatz */}
      {unregistered.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold flex items-center gap-1.5"><Truck size={15} className="text-primary" />{de ? `${unregistered.length} Lieferant(en) aus dem Lieferanten-Check noch nicht im DORA-Register` : `${unregistered.length} supplier(s) from the Supplier Check not yet in the DORA register`}</div>
            <button onClick={addAllUnregistered} className="rounded-md border border-primary/40 text-primary px-3 py-1 text-xs font-semibold hover:bg-primary/5">{de ? "Alle aufnehmen" : "Add all"}</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {unregistered.map(s => (
              <button key={s.id} onClick={() => addFromSupplier(s.id)} className="text-[11px] px-2 py-1 rounded-md border border-dashed border-border hover:border-primary/50 inline-flex items-center gap-1">
                <Plus size={11} />{s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">{de ? "Dienstleisterregister" : "Vendor register"}</h2>
          <div className="flex gap-2">
            <button onClick={exportDora} className="rounded-md border border-border px-3 py-1.5 text-sm flex items-center gap-1.5"><Download size={15} />{de ? "DORA-Register (D16) CSV" : "DORA register (D16) CSV"}</button>
            <button onClick={add} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5" title={de ? "TPRM-eigener Eintrag ohne Lieferanten-Check" : "TPRM-only entry without supplier check"}><Plus size={15} />{de ? "Dienstleister (nur TPRM)" : "Vendor (TPRM only)"}</button>
          </div>
        </div>
        {dl.length === 0 ? <div className="p-6 text-sm text-muted-foreground flex items-center gap-2"><CheckCircle2 size={16} className="st-ja-text" />{de ? "Keine Dienstleister." : "No vendors."}</div> : (
          <div className="divide-y divide-border">
            {dl.map(d => {
              const linked = isLinked(d);
              const orphan = isOrphan(d);
              return (
              <div key={d.id} className="p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {linked ? (
                    <div className="flex-1 min-w-[180px] text-sm font-medium flex items-center gap-2">
                      {d.name}
                      <Link to="/suppliers" className="text-[10px] font-normal px-1.5 py-0.5 rounded-md border border-primary/30 bg-primary/5 text-primary inline-flex items-center gap-1 hover:underline" title={de ? "Stammdaten aus Lieferanten-Check" : "Master data from Supplier Check"}>
                        <Truck size={10} />{de ? "Stammdaten aus Lieferanten-Check" : "master data from Supplier Check"}
                      </Link>
                    </div>
                  ) : (
                    <input value={d.name} onChange={e => patch(d.id, { name: e.target.value })} placeholder={de ? "Dienstleister" : "Vendor"} className="flex-1 min-w-[180px] rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium" />
                  )}
                  {orphan && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md border border-destructive/40 bg-destructive/10 text-destructive inline-flex items-center gap-1">
                      <AlertTriangle size={10} />{de ? "verwaist: Lieferant gelöscht" : "orphaned: supplier deleted"}
                      <button onClick={() => unlink(d.id)} className="underline ml-1 inline-flex items-center gap-0.5"><Unlink size={9} />{de ? "lösen" : "unlink"}</button>
                    </span>
                  )}
                  <select value={d.kat} onChange={e => patch(d.id, { kat: e.target.value as Kat })} className="text-xs rounded-md border border-border bg-background px-2 py-1.5">{(Object.keys(KAT_META) as Kat[]).map(k => <option key={k} value={k}>{KAT_META[k]}</option>)}</select>
                  <select value={d.kritikalitaet} onChange={e => patch(d.id, { kritikalitaet: e.target.value as Krit })} disabled={linked} title={linked ? (de ? "abgeleitet aus Kritikalität im Lieferanten-Check" : "derived from criticality in Supplier Check") : undefined} className="text-xs rounded-md border border-border bg-background px-2 py-1.5 disabled:opacity-70">{(Object.keys(KRIT_META) as Krit[]).map(k => <option key={k} value={k}>{KRIT_META[k][lang]}</option>)}</select>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${KRIT_META[d.kritikalitaet].cls}`}>{KRIT_META[d.kritikalitaet][lang]}</span>
                  {linked && <span className="text-[11px] text-muted-foreground">{de ? "Score" : "score"} {d.riskScore}{d.letztePruefung ? ` · ${de ? "geprüft" : "checked"} ${d.letztePruefung}` : ""}</span>}
                  <select value={d.status} onChange={e => patch(d.id, { status: e.target.value as Status })} className="text-xs rounded-md border border-border bg-background px-2 py-1.5"><option value="angebahnt">{de ? "angebahnt" : "prospecting"}</option><option value="aktiv">{de ? "aktiv" : "active"}</option><option value="in_kuendigung">{de ? "in Kündigung" : "terminating"}</option><option value="beendet">{de ? "beendet" : "ended"}</option></select>
                  <button onClick={() => remove(d.id)} className="text-muted-foreground hover:text-destructive p-1" title={de ? "DORA-Zusatz löschen (Lieferant bleibt im Lieferanten-Check)" : "Delete DORA entry (supplier stays in Supplier Check)"}><Trash2 size={15} /></button>
                </div>
                <div className="flex flex-wrap gap-2 items-center text-xs">
                  <input value={d.lei} onChange={e => patch(d.id, { lei: e.target.value })} placeholder="LEI" className="w-32 rounded-md border border-border bg-background px-2 py-1 text-xs" />
                  <input value={d.funktionen} onChange={e => patch(d.id, { funktionen: e.target.value })} placeholder={de ? "Funktionen/Leistung" : "Functions/service"} className="w-40 rounded-md border border-border bg-background px-2 py-1 text-xs" />
                  <input value={d.region} onChange={e => patch(d.id, { region: e.target.value })} placeholder={de ? "Region/Standort" : "Region"} className="w-28 rounded-md border border-border bg-background px-2 py-1 text-xs" />
                  <input value={d.subdienstleister} onChange={e => patch(d.id, { subdienstleister: e.target.value })} placeholder={de ? "Subdienstleister" : "Sub-contractors"} className="w-36 rounded-md border border-border bg-background px-2 py-1 text-xs" />
                  <label className="flex items-center gap-1">{de ? "Zertifikat gültig bis" : "cert valid until"}<input type="date" value={d.zertifikatBis} onChange={e => patch(d.id, { zertifikatBis: e.target.value })} className="rounded-md border border-border bg-background px-1 py-1 text-xs" /></label>
                  <label className="flex items-center gap-1" title={linked ? (de ? "aus Datenzugriff im Lieferanten-Check" : "from data access in Supplier Check") : undefined}><input type="checkbox" checked={d.personenbezug} disabled={linked} onChange={e => patch(d.id, { personenbezug: e.target.checked })} />{de ? "pers.-bez. Daten" : "personal data"}</label>
                  {d.personenbezug && <label className={`flex items-center gap-1 ${!d.avvVorhanden ? "text-destructive" : ""}`}><input type="checkbox" checked={d.avvVorhanden} onChange={e => patch(d.id, { avvVorhanden: e.target.checked })} />AVV</label>}
                  {d.kritikalitaet === "kritisch_wichtig" && <label className={`flex items-center gap-1 ${!d.exitStrategie ? "text-destructive" : ""}`}><input type="checkbox" checked={d.exitStrategie} onChange={e => patch(d.id, { exitStrategie: e.target.checked })} />{de ? "Exit-Strategie (D18)" : "exit strategy (D18)"}</label>}
                  {d.exitStrategie && <label className="flex items-center gap-1">{de ? "Exit getestet" : "exit tested"}<input type="date" value={d.exitGetestet} onChange={e => patch(d.id, { exitGetestet: e.target.value })} className="rounded-md border border-border bg-background px-1 py-1 text-xs" /></label>}
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-muted-foreground mb-1">{de ? "D46-Pflichtklauseln" : "D46 mandatory clauses"} ({(d.klauseln ?? []).length}/{D46_KLAUSELN.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {D46_KLAUSELN.map(k => (
                      <button key={k} onClick={() => toggleKlausel(d.id, k)} className={`text-[11px] px-2 py-0.5 rounded-md border ${(d.klauseln ?? []).includes(k) ? "st-ja-border st-ja-tint st-ja-text" : "border-border bg-background text-muted-foreground"}`}>{k}</button>
                    ))}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
