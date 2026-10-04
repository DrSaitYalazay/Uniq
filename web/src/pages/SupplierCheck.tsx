/**
 * SupplierCheck — Lieferanten-Check (Lieferantensicherheits-Bewertung).
 *
 * Bewertet die Informationssicherheit von Lieferanten/Dienstleistern nach
 * ISO 27001 A.5.19–A.5.23 (Lieferantenbeziehungen), NIS2 Art. 21 (Lieferkette)
 * und BSI IT-Grundschutz. Je Lieferant: Kritikalität, vertragliche/technische
 * Kontrollen, automatischer Risikoscore und Review-Zyklus (lebendes Register).
 *
 * Persistenz: useToolData (org-weit geteilt, kein Schema nötig).
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToolData } from "@/hooks/useToolData";
import { toast } from "sonner";
import { Truck, Plus, Trash2, ShieldCheck, AlertTriangle, Network, ShoppingCart } from "lucide-react";
import ToolStatusChart from "@/components/tools/ToolStatusChart";
import { CHART_SEVERITY } from "@/lib/chartPalette";
import { VISIBLE_TOOL_IDS } from "@/config/uniqFeatures";
import {
  type Supplier, type SupplierState, type SupplierCriticality as Criticality, type SupplierDataAccess as DataAccess,
  type SupplierAnswer as Answer, type SupplierCert as Cert, SUPPLIER_CERTS as CERTS,
  SUPPLIER_DEFAULT, SUPPLIER_TOOL_KEY, SUPPLIER_LS_KEY,
  supplierApplicableQuestions as applicableQuestions, supplierRisk as riskOf,
  type TprmState, TPRM_DEFAULT, TPRM_TOOL_KEY, TPRM_LS_KEY, D46_KLAUSELN,
} from "@/lib/tools/toolLinks";

// Typen, Fragenkatalog (ISO 27001 A.5.19–A.5.23 + NIS2 Art. 21 + BSI) und
// Risikoscore liegen zentral in @/lib/tools/toolLinks — das TPRM-Werkzeug liest
// dieselben Lieferanten als Stammdaten (eine Registry, keine Doppelpflege).
type State = SupplierState;
const DEFAULT: State = SUPPLIER_DEFAULT;

const CRIT_LABEL: Record<Criticality, { de: string; en: string }> = {
  low:      { de: "Niedrig",  en: "Low" },
  medium:   { de: "Mittel",   en: "Medium" },
  high:     { de: "Hoch",     en: "High" },
  critical: { de: "Kritisch", en: "Critical" },
};
const DATA_LABEL: Record<DataAccess, { de: string; en: string }> = {
  none:      { de: "Kein Datenzugriff", en: "No data access" },
  internal:  { de: "Interne Daten", en: "Internal data" },
  personal:  { de: "Personenbezogene Daten", en: "Personal data" },
  sensitive: { de: "Sensible Daten (Art. 9)", en: "Sensitive data (Art. 9)" },
};

function nextReview(lastReview: string, months: number): Date | null {
  if (!lastReview || !months) return null;
  const d = new Date(lastReview);
  if (isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + months);
  return d;
}

const LEVEL_CLS: Record<string, string> = {
  low: "st-ja-tint st-ja-text",
  medium: "st-teilweise-tint st-teilweise-text",
  high: "bg-orange-500/15 text-orange-600",
  critical: "bg-destructive/15 text-destructive",
};
const LEVEL_LABEL: Record<string, { de: string; en: string }> = {
  low: { de: "Gering", en: "Low" }, medium: { de: "Mittel", en: "Medium" },
  high: { de: "Hoch", en: "High" }, critical: { de: "Kritisch", en: "Critical" },
};

export default function SupplierCheck() {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { data, setData, loading } = useToolData<State>(SUPPLIER_TOOL_KEY, SUPPLIER_LS_KEY, DEFAULT);
  // DORA-Register (TPRM) nur lesend: Zusatzdaten je Lieferant (supplierId).
  const { data: tprmData } = useToolData<TprmState>(TPRM_TOOL_KEY, TPRM_LS_KEY, TPRM_DEFAULT);
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<"active" | "archived" | "all">("active");

  const suppliers = data.suppliers ?? [];
  const shown = suppliers.filter(s => view === "all" ? true : view === "archived" ? s.archived : !s.archived);

  const tprmBySupplier = useMemo(() => {
    const m = new Map<string, { klauseln: number; exit: boolean; krit: string }>();
    for (const d of tprmData?.dienstleister ?? []) {
      if (d.supplierId) m.set(d.supplierId, { klauseln: (d.klauseln ?? []).length, exit: !!d.exitStrategie, krit: d.kritikalitaet });
    }
    return m;
  }, [tprmData]);

  // Überblick-Grafik: Risiko gering / mittel / hoch / kritisch (aktive Lieferanten)
  const riskStats = useMemo(() => {
    const c = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const s of suppliers) { if (s.archived) continue; c[riskOf(s).level]++; }
    return c;
  }, [suppliers]);

  const add = () => {
    const s: Supplier = {
      id: crypto.randomUUID(), name: "", service: "", criticality: "medium", dataAccess: "personal",
      certs: [], answers: {}, lastReview: new Date().toISOString().slice(0, 10), reviewMonths: 12,
      assessedBy: "", archived: false, notes: "",
    };
    setData(d => ({ suppliers: [s, ...(d.suppliers ?? [])] }));
    setOpenId(s.id);
  };
  const patch = (id: string, p: Partial<Supplier>) =>
    setData(d => ({ suppliers: (d.suppliers ?? []).map(s => s.id === id ? { ...s, ...p } : s) }));
  const remove = (id: string) => {
    // TPRM-Zusatz wird NICHT stumm gelöscht: er bleibt im DORA-Register und wird dort als „verwaist" markiert.
    if (VISIBLE_TOOL_IDS.has("tprm") && tprmBySupplier.has(id)) {
      toast.info(de
        ? "Lieferant entfernt. Der DORA-Register-Eintrag (TPRM) bleibt erhalten und wird dort als verwaist markiert."
        : "Supplier removed. The DORA-register entry (TPRM) is kept and flagged as orphaned there.");
    }
    setData(d => ({ suppliers: (d.suppliers ?? []).filter(s => s.id !== id) }));
  };
  const setAnswer = (id: string, qid: string, a: Answer) =>
    setData(d => ({ suppliers: (d.suppliers ?? []).map(s => s.id === id ? { ...s, answers: { ...s.answers, [qid]: a } } : s) }));
  const toggleCert = (id: string, c: Cert) =>
    setData(d => ({ suppliers: (d.suppliers ?? []).map(s => s.id === id ? { ...s, certs: s.certs.includes(c) ? s.certs.filter(x => x !== c) : [...s.certs, c] } : s) }));

  if (loading) return <div className="p-6 text-sm text-muted-foreground">{de ? "Lädt…" : "Loading…"}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Truck className="text-primary" size={22} />
          {de ? "Lieferanten-Check" : "Supplier Check"}
        </h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          {de
            ? "Bewertung der Lieferantensicherheit nach ISO 27001 A.5.19–A.5.23 und NIS2 Art. 21 (Lieferkette). Je Lieferant: Kritikalität, Kontrollen, Risikoscore und Review-Zyklus."
            : "Assess supplier security per ISO 27001 A.5.19–A.5.23 and NIS2 Art. 21 (supply chain). Per supplier: criticality, controls, risk score and review cycle."}
        </p>
      </header>

      <ToolStatusChart
        title={de ? "Lieferantenrisiko" : "Supplier risk"}
        subtitle={de
          ? `${suppliers.filter(s => !s.archived).length} aktive Lieferant(en)${VISIBLE_TOOL_IDS.has("tprm") ? ` · ${tprmBySupplier.size} im DORA-Register (TPRM) geführt` : ""}`
          : `${suppliers.filter(s => !s.archived).length} active supplier(s)${VISIBLE_TOOL_IDS.has("tprm") ? ` · ${tprmBySupplier.size} tracked in the DORA register (TPRM)` : ""}`}
        items={[
          { label: de ? "gering" : "low", value: riskStats.low, color: CHART_SEVERITY.niedrig },
          { label: de ? "mittel" : "medium", value: riskStats.medium, color: CHART_SEVERITY.mittel },
          { label: de ? "hoch" : "high", value: riskStats.high, color: CHART_SEVERITY.hoch },
          { label: de ? "kritisch" : "critical", value: riskStats.critical, color: CHART_SEVERITY.kritisch },
        ]}
        emptyText={de ? "Noch keine aktiven Lieferanten." : "No active suppliers yet."}
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">{de ? "Lieferantenregister" : "Supplier register"}</h2>
            <span className="text-xs text-muted-foreground">{shown.length}/{suppliers.length}</span>
            <select value={view} onChange={e => setView(e.target.value as any)} className="text-xs rounded-md border border-border bg-background px-2 py-1 ml-2">
              <option value="active">{de ? "Aktiv" : "Active"}</option>
              <option value="archived">{de ? "Archiv" : "Archive"}</option>
              <option value="all">{de ? "Alle" : "All"}</option>
            </select>
          </div>
          <button onClick={add} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5">
            <Plus size={15} />{de ? "Lieferant" : "Supplier"}
          </button>
        </div>

        {shown.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">{de ? "Keine Einträge in dieser Ansicht." : "No entries in this view."}</div>
        ) : (
          <div className="divide-y divide-border">
            {shown.map(s => {
              const risk = riskOf(s);
              const isOpen = openId === s.id;
              const qs = applicableQuestions(s);
              const due = nextReview(s.lastReview, s.reviewMonths);
              const overdue = due && due < new Date();
              return (
                <div key={s.id} className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => setOpenId(isOpen ? null : s.id)} className="text-left flex-1 min-w-[200px]">
                      <div className="text-sm font-semibold flex items-center gap-2">
                        {s.name || (de ? "(ohne Namen)" : "(unnamed)")}
                        <span className="text-xs text-muted-foreground">{s.service}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {CRIT_LABEL[s.criticality][lang]} · {DATA_LABEL[s.dataAccess][lang]}
                      </div>
                    </button>
                    <span className={`text-[11px] px-2 py-1 rounded-md ${LEVEL_CLS[risk.level]}`}>
                      {de ? "Risiko: " : "Risk: "}{LEVEL_LABEL[risk.level][lang]} ({risk.score})
                    </span>
                    {overdue && !s.archived && (
                      <span className="text-[11px] px-2 py-1 rounded-md bg-destructive/10 text-destructive flex items-center gap-1">
                        <AlertTriangle size={11} />{de ? "Review überfällig" : "Review overdue"}
                      </span>
                    )}
                    {s.lastReview && <span className="text-[11px] text-muted-foreground">{de ? "geprüft " : "checked "}{s.lastReview}</span>}
                    {VISIBLE_TOOL_IDS.has("tprm") && (() => {
                      const t = tprmBySupplier.get(s.id);
                      return t ? (
                        <Link to="/tprm" title={de ? "DORA-Register (TPRM) öffnen" : "Open DORA register (TPRM)"}
                          className={`text-[11px] px-2 py-1 rounded-md border inline-flex items-center gap-1 hover:border-primary/50 ${t.exit || t.krit !== "kritisch_wichtig" ? "border-border bg-muted/40 text-muted-foreground" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
                          <Network size={11} />
                          {de ? "DORA-Register: " : "DORA register: "}{t.klauseln}/{D46_KLAUSELN.length} {de ? "Klauseln" : "clauses"}, Exit {t.exit ? "✓" : "✗"}
                        </Link>
                      ) : (
                        <Link to="/tprm" className="text-[11px] px-2 py-1 rounded-md border border-dashed border-border text-muted-foreground inline-flex items-center gap-1 hover:border-primary/50">
                          <Network size={11} />{de ? "nicht im DORA-Register" : "not in DORA register"}
                        </Link>
                      );
                    })()}
                    {VISIBLE_TOOL_IDS.has("procurement") && s.sourceRequestId && (
                      <Link to="/procurement" className="text-[11px] px-2 py-1 rounded-md border border-border bg-muted/40 text-muted-foreground inline-flex items-center gap-1 hover:border-primary/50" title={de ? "Aus Beschaffungs-Freigabe übernommen" : "Imported from procurement approval"}>
                        <ShoppingCart size={11} />{de ? "aus Beschaffung" : "from procurement"}
                      </Link>
                    )}
                    <button onClick={() => patch(s.id, { archived: !s.archived })} className="text-[11px] text-muted-foreground hover:text-primary px-1.5 py-1 rounded border border-border">
                      {s.archived ? (de ? "reaktivieren" : "reactivate") : (de ? "abschließen" : "archive")}
                    </button>
                    <button onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={15} /></button>
                  </div>

                  {isOpen && (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input value={s.name} onChange={e => patch(s.id, { name: e.target.value })} placeholder={de ? "Lieferant" : "Supplier"} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
                        <input value={s.service} onChange={e => patch(s.id, { service: e.target.value })} placeholder={de ? "Leistung/Dienst" : "Service"} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
                        <label className="text-xs text-muted-foreground flex items-center gap-2">{de ? "Kritikalität" : "Criticality"}
                          <select value={s.criticality} onChange={e => patch(s.id, { criticality: e.target.value as Criticality })} className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                            {(Object.keys(CRIT_LABEL) as Criticality[]).map(k => <option key={k} value={k}>{CRIT_LABEL[k][lang]}</option>)}
                          </select>
                        </label>
                        <label className="text-xs text-muted-foreground flex items-center gap-2">{de ? "Datenzugriff" : "Data access"}
                          <select value={s.dataAccess} onChange={e => patch(s.id, { dataAccess: e.target.value as DataAccess })} className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                            {(Object.keys(DATA_LABEL) as DataAccess[]).map(k => <option key={k} value={k}>{DATA_LABEL[k][lang]}</option>)}
                          </select>
                        </label>
                        <label className="text-xs text-muted-foreground flex items-center gap-2">{de ? "Letzte Prüfung" : "Last review"}
                          <input type="date" value={s.lastReview} onChange={e => patch(s.id, { lastReview: e.target.value })} className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                        </label>
                        <label className="text-xs text-muted-foreground flex items-center gap-2">{de ? "Review-Intervall (Monate)" : "Review interval (months)"}
                          <input type="number" min={1} max={60} value={s.reviewMonths} onChange={e => patch(s.id, { reviewMonths: Number(e.target.value) || 0 })} className="w-16 rounded-md border border-border bg-background px-2 py-1 text-xs" />
                        </label>
                        <input value={s.assessedBy} onChange={e => patch(s.id, { assessedBy: e.target.value })} placeholder={de ? "Prüfer:in" : "Assessor"} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
                      </div>
                      {due && (
                        <div className="text-[11px] text-muted-foreground">
                          {de ? "Nächste Prüfung: " : "Next review: "}{due.toLocaleDateString(de ? "de-DE" : "en-GB")}
                        </div>
                      )}

                      {/* Zertifikate */}
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <ShieldCheck size={13} />{de ? "Zertifikate" : "Certificates"}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {CERTS.map(c => (
                            <button key={c} onClick={() => toggleCert(s.id, c)}
                              className={`px-2 py-0.5 rounded-full text-[11px] border ${s.certs.includes(c) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}>{c}</button>
                          ))}
                        </div>
                      </div>

                      {/* Kontrollen */}
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{de ? "Kontrollen (ISO 27001 / NIS2 / BSI)" : "Controls (ISO 27001 / NIS2 / BSI)"}</div>
                        <div className="space-y-1.5">
                          {qs.map(q => {
                            const a = s.answers[q.id] ?? "";
                            return (
                              <div key={q.id} className="flex items-start gap-2 text-sm">
                                <div className="flex-1">
                                  {de ? q.de : q.en}
                                  <span className="ml-1.5 text-[10px] text-muted-foreground font-mono">{q.ref}</span>
                                  {q.critical && <span className="ml-1 text-[10px] text-destructive align-top">●</span>}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  {(["yes", "no", "na"] as Answer[]).map(opt => (
                                    <button key={opt} onClick={() => setAnswer(s.id, q.id, opt)}
                                      className={`px-2 py-0.5 rounded text-[11px] border ${a === opt
                                        ? (opt === "yes" ? "st-ja-tint st-ja-text st-ja-border" : opt === "no" ? "bg-destructive/15 text-destructive border-destructive/40" : "bg-muted text-muted-foreground border-border")
                                        : "bg-background text-muted-foreground border-border hover:border-primary/40"}`}>
                                      {opt === "yes" ? (de ? "Ja" : "Yes") : opt === "no" ? (de ? "Nein" : "No") : (de ? "N.a." : "N/A")}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <textarea value={s.notes} onChange={e => patch(s.id, { notes: e.target.value })} rows={2}
                        placeholder={de ? "Maßnahmen / Auflagen / Notizen…" : "Measures / conditions / notes…"}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {de ? "Bezug: ISO 27001 A.5.19–A.5.23, NIS2 Art. 21. ● = kritische Kontrolle." : "Reference: ISO 27001 A.5.19–A.5.23, NIS2 Art. 21. ● = critical control."}
      </p>
    </div>
  );
}
