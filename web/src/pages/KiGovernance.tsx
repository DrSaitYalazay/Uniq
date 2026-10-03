/**
 * KiGovernance — Werkzeug KI-Governance. Register aller KI-Systeme, Risikoklassifizierung
 * nach EU AI Act (Anhang III / Art. 5), automatisches Pflichtdokument-Set je
 * Rolle + Klasse mit Gap-Anzeige. Fachlogik und Rechtsstand: lib/kiGovernance.ts.
 *
 * Persistenz: useToolData (org-weit).
 */
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToolData } from "@/hooks/useToolData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Brain, Plus, Trash2, AlertTriangle, CheckCircle2, Clock, FileDown, FileText, File } from "lucide-react";
import PersonSelect from "@/components/PersonSelect";
import { PERSONNEL_TOOL_KEY, PERSONNEL_LS_KEY, DEFAULT_PERSONNEL, type Person, type PersonnelRegistry } from "@/lib/personnel";
import TEMPLATES from "@/data/policyTemplates";
import CLAUSES from "@/data/policyClauseTemplates";
import { generateClausePolicyWord } from "@/lib/policyClauseExporter";
import { generateClausePolicyPDF } from "@/lib/policyClauseExporterPdf";
import {
  type Rolle, type Risikoklasse, type KiSystem, type KiGovernanceState, type DocStatus, type LifeStatus,
  ANNEX_III, ART5, DOC_LABELS, AI_ACT_DATES, ROLLE_META, STATUS_LABEL, DOC_STATUS_LABEL, KI_TOOL_KEY, KI_LS_KEY,
  klassifiziere, docsForSystem, tageBis as tageBisDatum,
} from "@/lib/kiGovernance";
import { exportRegisterPdf, exportRegisterXlsx, registerAnhang, vorbelegung } from "@/lib/kiRegister";

const DEFAULT: KiGovernanceState = { systeme: [] };

const KLASSE_META: Record<Risikoklasse, { de: string; en: string; cls: string }> = {
  unannehmbar: { de: "Unannehmbar (verboten)", en: "Unacceptable (prohibited)", cls: "bg-destructive/15 text-destructive" },
  hoch: { de: "Hochrisiko", en: "High-risk", cls: "bg-orange-500/15 text-orange-600" },
  begrenzt: { de: "Begrenztes Risiko", en: "Limited risk", cls: "st-teilweise-tint st-teilweise-text" },
  minimal: { de: "Minimales Risiko", en: "Minimal risk", cls: "st-ja-tint st-ja-text" },
};

const fmtDatum = (iso: string, de: boolean) => new Date(iso + "T00:00:00Z").toLocaleDateString(de ? "de-DE" : "en-GB", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });
const docsFor = docsForSystem;
/** Vorlagen, die sich aus dem Register vorbefüllt erzeugen lassen (D-Dokumente mit Katalogvorlage). */
const erzeugbar = (d: string) => /^D\d+$/.test(d) && TEMPLATES.some(t => t.id === d);

/** Nur lesend: Bearbeitungsstand der Richtlinien (Klauselauswahl/-texte je Vorlage). */
type PolicyView = Record<string, { selectedClauses?: string[]; clauseEdits?: Record<string, { description?: string; descriptionEn?: string }>; [k: string]: unknown } | undefined>;

export default function KiGovernance() {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { data, setData, loading } = useToolData<KiGovernanceState>(KI_TOOL_KEY, KI_LS_KEY, DEFAULT);
  const [openId, setOpenId] = useState<string | null>(null);
  const { user, getTenantId, isStudent, isAdmin, isLecturer, viewAsUserId } = useAuth();
  // Studierende exportieren Richtlinien nur über das Kontingent in „Richtlinien".
  const studentLimited = (isStudent && !isAdmin && !isLecturer) || !!viewAsUserId;
  // CWS-Kernregel: Verantwortliche nur aus dem zentralen Personen-Register.
  const { data: personnel, setData: setPersonnel } = useToolData<PersonnelRegistry>(PERSONNEL_TOOL_KEY, PERSONNEL_LS_KEY, DEFAULT_PERSONNEL);
  const people = personnel.people ?? [];
  const addPerson = (p: Person) => setPersonnel(d => ({ people: [...(d.people ?? []), p] }));
  const { data: policyView } = useToolData<PolicyView>("policies", "nis2-policies", {});
  const [companyName, setCompanyName] = useState("");
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const tid = await getTenantId();
      if (!tid || cancelled) return;
      const { data: profile } = await (supabase.from("company_profiles").select("company_name").eq("user_id", tid)
        .order("created_at", { ascending: false }).limit(1).maybeSingle() as unknown as Promise<{ data: { company_name?: string } | null }>);
      if (!cancelled && profile?.company_name) setCompanyName(profile.company_name);
    })();
    return () => { cancelled = true; };
  }, [user, getTenantId]);
  const [docWahl, setDocWahl] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const systeme = data.systeme ?? [];
  const tageBis = tageBisDatum(AI_ACT_DATES.hochrisikoAnhangIII);

  const gapCount = useMemo(() => {
    let g = 0;
    for (const s of systeme) {
      for (const d of docsFor(s)) {
        if ((s.docStatus?.[d] ?? "fehlt") === "fehlt") g++;
      }
    }
    return g;
  }, [systeme]);

  const add = () => {
    const s: KiSystem = {
      id: crypto.randomUUID(), name: "", zweck: "", rolle: "betreiber", risikoklasse: "minimal",
      gpai: false, status: "planung", verantwortlicher: "", personenbezug: false,
      annexIII: [], art5: [], transparenzpflicht: false, docStatus: {},
    };
    setData(d => ({ systeme: [s, ...(d.systeme ?? [])] }));
    setOpenId(s.id);
  };
  const patch = (id: string, p: Partial<KiSystem>) =>
    setData(d => ({ systeme: (d.systeme ?? []).map(s => s.id === id ? { ...s, ...p } : s) }));
  const remove = (id: string) => setData(d => ({ systeme: (d.systeme ?? []).filter(s => s.id !== id) }));

  const toggleList = (id: string, key: "annexIII" | "art5", val: string) =>
    setData(d => ({
      systeme: (d.systeme ?? []).map(s => {
        if (s.id !== id) return s;
        const has = s[key].includes(val);
        const list = has ? s[key].filter(x => x !== val) : [...s[key], val];
        const next = { ...s, [key]: list };
        next.risikoklasse = klassifiziere(next.annexIII, next.art5, next.transparenzpflicht);
        return next;
      }),
    }));
  const setDoc = (id: string, doc: string, st: DocStatus) =>
    setData(d => ({ systeme: (d.systeme ?? []).map(s => s.id === id ? { ...s, docStatus: { ...(s.docStatus ?? {}), [doc]: st } } : s) }));

  const registerExport = async (format: "pdf" | "excel") => {
    if (systeme.length === 0) return;
    setBusy(true);
    try {
      if (format === "pdf") exportRegisterPdf(systeme, de, companyName);
      else await exportRegisterXlsx(systeme, de, companyName);
      toast.success(de ? "KI-Systemregister exportiert" : "AI system register exported");
    } catch (e) { console.error(e); toast.error(de ? "Export fehlgeschlagen" : "Export failed"); }
    setBusy(false);
  };

  /** Pflichtdokument für EIN System erzeugen — Katalogvorlage + Systemangaben aus dem Register. */
  const dokumentErzeugen = async (s: KiSystem, docId: string, format: "word" | "pdf") => {
    const t = TEMPLATES.find(x => x.id === docId);
    if (!t) return;
    const alle = CLAUSES[docId] ?? [];
    const p = policyView?.[docId];
    const auswahl = p?.selectedClauses?.length ? alle.filter(c => p.selectedClauses!.includes(c.id)) : alle;
    const klauseln = auswahl.map(c => {
      const e = p?.clauseEdits?.[c.id];
      return e ? { ...c, description: e.description || c.description, descriptionEn: e.descriptionEn || c.descriptionEn } : c;
    });
    const heute = new Date().toISOString().slice(0, 10);
    const vb = vorbelegung(s, de);
    const state = {
      purpose: t.purpose, purposeEn: t.purposeEn,
      responsibleRoles: "", approvalAuthority: de ? "Geschäftsführung" : "Executive Management",
      implementationStatus: "draft", reviewFrequency: de ? "Jährlich" : "Annually",
      lastReviewDate: "", nextReviewDate: new Date(Date.now() + 365 * 86400_000).toISOString().slice(0, 10),
      exceptions: "", version: "1.0", creationDate: heute, lastUpdated: heute, effectiveDate: heute,
      ...(p ?? {}),
      scope: vb.scope, policyOwner: vb.policyOwner || String((p as any)?.policyOwner ?? ""), systemsUsed: vb.systemsUsed,
    };
    const anhang = registerAnhang([s], "D25", de);
    const opts = { includeRationale: true, includeSources: true, includeApplicability: true, includeSectionHeaders: true, anhang };
    setBusy(true);
    try {
      if (format === "pdf") generateClausePolicyPDF(t, state as any, klauseln, lang, companyName, opts);
      else await generateClausePolicyWord(t, state as any, klauseln, lang, companyName, opts);
      if ((s.docStatus?.[docId] ?? "fehlt") === "fehlt") setDoc(s.id, docId, "entwurf");
      toast.success(de ? `${docId} erzeugt — Status auf „Entwurf" gesetzt` : `${docId} generated — status set to "draft"`);
    } catch (e) { console.error(e); toast.error(de ? "Erzeugung fehlgeschlagen" : "Generation failed"); }
    setBusy(false);
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">{de ? "Lädt…" : "Loading…"}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="text-primary" size={22} />{de ? "KI-Governance" : "AI Governance"}</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          {de ? "KI-Systemregister, Risikoklassifizierung nach EU AI Act (Anhang III / Art. 5) und automatische Pflichtdokument-Sets je Rolle und Klasse." : "AI system register, risk classification per EU AI Act (Annex III / Art. 5), and automatic mandatory-document sets by role and class."}
        </p>
      </header>

      {/* Fristen-Banner — Rechtsstand VO (EU) 2024/1689 i. d. F. VO (EU) 2026/1744 */}
      <div className={`rounded-xl border p-4 flex items-start gap-3 ${tageBis <= 60 ? "border-destructive/40 bg-destructive/5" : "st-teilweise-border st-teilweise-tint"}`}>
        <Clock size={18} className={`mt-0.5 shrink-0 ${tageBis <= 60 ? "text-destructive" : "st-teilweise-text"}`} />
        <div className="text-sm space-y-1">
          <div>
            {tageBis >= 0
              ? (de ? <>Hochrisiko-Pflichten (Art. 6 Abs. 2 / Anhang III) gelten ab <b>{fmtDatum(AI_ACT_DATES.hochrisikoAnhangIII, de)}</b> — noch <b>{tageBis} Tage</b>. KI in Produkten nach Anhang I: ab <b>{fmtDatum(AI_ACT_DATES.hochrisikoAnhangI, de)}</b>.</>
                    : <>High-risk obligations (Art. 6(2) / Annex III) apply from <b>{fmtDatum(AI_ACT_DATES.hochrisikoAnhangIII, de)}</b> — <b>{tageBis} days</b> left. AI in Annex I products: from <b>{fmtDatum(AI_ACT_DATES.hochrisikoAnhangI, de)}</b>.</>)
              : (de ? <>Hochrisiko-Pflichten (Anhang III) gelten <b>seit {fmtDatum(AI_ACT_DATES.hochrisikoAnhangIII, de)}</b> — fehlende Pflichtdokumente sind ein Verstoß.</>
                    : <>High-risk obligations (Annex III) have applied <b>since {fmtDatum(AI_ACT_DATES.hochrisikoAnhangIII, de)}</b> — missing mandatory documents are a breach.</>)}
          </div>
          <div className="text-xs text-muted-foreground">
            {de
              ? <>Bereits anwendbar: Verbote (Art. 5) und KI-Kompetenz (Art. 4) seit {fmtDatum(AI_ACT_DATES.verboteUndKompetenz, de)}, GPAI-Pflichten seit {fmtDatum(AI_ACT_DATES.gpai, de)}, Transparenz (Art. 50) seit {fmtDatum(AI_ACT_DATES.transparenz, de)}. Fristen geändert durch VO (EU) 2026/1744.</>
              : <>Already applicable: prohibitions (Art. 5) and AI literacy (Art. 4) since {fmtDatum(AI_ACT_DATES.verboteUndKompetenz, de)}, GPAI obligations since {fmtDatum(AI_ACT_DATES.gpai, de)}, transparency (Art. 50) since {fmtDatum(AI_ACT_DATES.transparenz, de)}. Dates amended by Regulation (EU) 2026/1744.</>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-2xl font-bold">{systeme.length}</div><div className="text-xs text-muted-foreground">{de ? "KI-Systeme" : "AI systems"}</div></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-2xl font-bold text-orange-600">{systeme.filter(s => s.risikoklasse === "hoch").length}</div><div className="text-xs text-muted-foreground">{de ? "Hochrisiko" : "High-risk"}</div></div>
        <div className={`rounded-xl border p-4 ${gapCount ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}><div className={`text-2xl font-bold ${gapCount ? "text-destructive" : ""}`}>{gapCount}</div><div className="text-xs text-muted-foreground">{de ? "Fehlende Pflichtdokumente" : "Missing mandatory docs"}</div></div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">{de ? "KI-Systemregister (D25)" : "AI system register (D25)"}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => registerExport("pdf")} disabled={busy || systeme.length === 0}
              className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 disabled:opacity-50" title={de ? "Register als PDF exportieren" : "Export register as PDF"}>
              <FileDown size={14} />{de ? "Register PDF" : "Register PDF"}</button>
            <button onClick={() => registerExport("excel")} disabled={busy || systeme.length === 0}
              className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 disabled:opacity-50" title={de ? "Register als Excel exportieren" : "Export register as Excel"}>
              <FileDown size={14} />{de ? "Register Excel" : "Register Excel"}</button>
            <button onClick={add} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5"><Plus size={15} />{de ? "KI-System" : "AI system"}</button>
          </div>
        </div>
        {systeme.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground flex items-center gap-2"><CheckCircle2 size={16} className="st-ja-text" />{de ? "Keine KI-Systeme erfasst." : "No AI systems recorded."}</div>
        ) : (
          <div className="divide-y divide-border">
            {systeme.map(s => {
              const docs = docsFor(s);
              const open = openId === s.id;
              return (
                <div key={s.id} className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input value={s.name} onChange={e => patch(s.id, { name: e.target.value })} placeholder={de ? "Name des KI-Systems" : "AI system name"}
                      className="flex-1 min-w-[200px] rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium" />
                    <select value={s.rolle} onChange={e => patch(s.id, { rolle: e.target.value as Rolle })} className="text-xs rounded-md border border-border bg-background px-2 py-1.5">
                      {(Object.keys(ROLLE_META) as Rolle[]).map(r => <option key={r} value={r}>{de ? ROLLE_META[r].de : ROLLE_META[r].en}</option>)}
                    </select>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${KLASSE_META[s.risikoklasse].cls}`}>{de ? KLASSE_META[s.risikoklasse].de : KLASSE_META[s.risikoklasse].en}</span>
                    <button onClick={() => setOpenId(open ? null : s.id)} className="text-xs text-primary underline">{open ? (de ? "zu" : "close") : (de ? "Klassifizieren" : "Classify")}</button>
                    <button onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={15} /></button>
                  </div>

                  {open && (
                    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                      <input value={s.zweck} onChange={e => patch(s.id, { zweck: e.target.value })} placeholder={de ? "Zweck / Einsatzkontext" : "Purpose / context"}
                        className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs" />
                      <div className="flex flex-wrap items-end gap-3 text-xs">
                        <label className="flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{de ? "Verantwortlich" : "Owner"}</span>
                          <PersonSelect value={s.verantwortlicher ?? ""} onChange={v => patch(s.id, { verantwortlicher: v })}
                            people={people} onAddPerson={addPerson} de={de} placeholder={de ? "— wählen —" : "— select —"} className="w-56" />
                        </label>
                        <label className="flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{de ? "Lebenszyklus" : "Life cycle"}</span>
                          <select value={s.status ?? "planung"} onChange={e => patch(s.id, { status: e.target.value as LifeStatus })}
                            aria-label={de ? "Lebenszyklus" : "Life cycle"}
                            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs">
                            {(Object.keys(STATUS_LABEL) as LifeStatus[]).map(k => <option key={k} value={k}>{de ? STATUS_LABEL[k].de : STATUS_LABEL[k].en}</option>)}
                          </select>
                        </label>
                      </div>
                      {/* SoA-Prüfbericht C-5: Angaben für die SoA-Matrix System × Rolle × Kontrolle */}
                      <div className="flex flex-wrap items-end gap-3 text-xs">
                        <label className="flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{de ? "System-ID" : "System ID"}</span>
                          <input value={s.kennung ?? ""} onChange={e => patch(s.id, { kennung: e.target.value })} placeholder={`KI-${String(systeme.indexOf(s) + 1).padStart(3, "0")}`}
                            className="w-28 rounded-md border border-border bg-background px-2 py-1.5 text-xs" />
                        </label>
                        <label className="flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{de ? "Version" : "Version"}</span>
                          <input value={s.version ?? ""} onChange={e => patch(s.id, { version: e.target.value })} placeholder="z. B. 2.1"
                            className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-xs" />
                        </label>
                        <label className="flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{de ? "Bewertet am" : "Assessed on"}</span>
                          <input type="date" value={s.bewertetAm ?? ""} onChange={e => patch(s.id, { bewertetAm: e.target.value })}
                            className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                        </label>
                        <label className="flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{de ? "Freigegeben von" : "Approved by"}</span>
                          <PersonSelect value={s.freigegebenVon ?? ""} onChange={v => patch(s.id, { freigegebenVon: v })}
                            people={people} onAddPerson={addPerson} de={de} placeholder={de ? "— wählen —" : "— select —"} className="w-56" />
                        </label>
                      </div>
                      <label className="flex flex-col gap-0.5 text-xs">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{de ? "Nachweise (ein Link je Zeile)" : "Evidence (one link per line)"}</span>
                        <textarea value={s.nachweise ?? ""} onChange={e => patch(s.id, { nachweise: e.target.value })} rows={2}
                          className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs font-mono" />
                      </label>
                      <div className="flex flex-wrap gap-3 text-xs">
                        <label className="flex items-center gap-1.5"><input type="checkbox" checked={s.gpai} onChange={e => patch(s.id, { gpai: e.target.checked })} />{de ? "nutzt ein GPAI-Modell (Info)" : "uses a GPAI model (info)"}</label>
                        <label className="flex items-center gap-1.5"><input type="checkbox" checked={s.personenbezug} onChange={e => patch(s.id, { personenbezug: e.target.checked })} />{de ? "personenbezogene Daten (→ DSFA)" : "personal data (→ DPIA)"}</label>
                        <label className="flex items-center gap-1.5"><input type="checkbox" checked={s.transparenzpflicht} onChange={e => { const v = e.target.checked; setData(d => ({ systeme: (d.systeme ?? []).map(x => x.id === s.id ? { ...x, transparenzpflicht: v, risikoklasse: klassifiziere(x.annexIII, x.art5, v) } : x) })); }} />{de ? "Chatbot/Deepfake (Art. 50)" : "chatbot/deepfake (Art. 50)"}</label>
                        {s.rolle === "betreiber" && s.risikoklasse === "hoch" && (
                          <label className="flex items-center gap-1.5" title={de ? "Art. 27 KI-VO: Betreiber, die Einrichtungen des öffentlichen Rechts oder private Anbieter öffentlicher Dienste sind, sowie Betreiber von Systemen nach Anhang III Nr. 5 b (Kreditwürdigkeit) und c (Lebens-/Krankenversicherung)." : "Art. 27 AI Act: deployers that are bodies governed by public law or private entities providing public services, and deployers of Annex III point 5(b) (creditworthiness) and (c) (life/health insurance) systems."}>
                            <input type="checkbox" checked={!!s.friaPflicht} onChange={e => patch(s.id, { friaPflicht: e.target.checked })} />
                            {de ? "FRIA-pflichtig (Art. 27: öffentliche Stelle/öffentliche Dienste, Anhang III Nr. 5 b/c)" : "FRIA required (Art. 27: public body/public services, Annex III 5(b)/(c))"}
                          </label>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-[11px] font-semibold text-orange-600 mb-1">{de ? "Anhang III — Hochrisiko-Bereiche" : "Annex III — high-risk areas"}</div>
                          <div className="space-y-1">
                            {ANNEX_III.map(a => (
                              <label key={a.id} className="flex items-start gap-1.5 text-[11px]"><input type="checkbox" checked={s.annexIII.includes(a.id)} onChange={() => toggleList(s.id, "annexIII", a.id)} className="mt-0.5" />{de ? a.de : a.en}</label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold text-destructive mb-1">{de ? "Art. 5 — verbotene Praktiken" : "Art. 5 — prohibited practices"}</div>
                          <div className="space-y-1">
                            {ART5.map(a => (
                              <label key={a.id} className="flex items-start gap-1.5 text-[11px]"><input type="checkbox" checked={s.art5.includes(a.id)} onChange={() => toggleList(s.id, "art5", a.id)} className="mt-0.5" />{de ? a.de : a.en}{a.ab ? <span className="text-muted-foreground">{de ? ` — ab ${fmtDatum(a.ab, de)}` : ` — from ${fmtDatum(a.ab, de)}`}</span> : null}</label>
                            ))}
                          </div>
                        </div>
                      </div>
                      {s.risikoklasse === "unannehmbar" && (
                        <div className="text-xs text-destructive flex items-center gap-1.5"><AlertTriangle size={13} />{de ? "Verbotene Praxis nach Art. 5 — System darf nicht betrieben werden." : "Prohibited practice under Art. 5 — system must not be operated."}</div>
                      )}
                    </div>
                  )}

                  {/* Pflichtdokument-Set mit Gap */}
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">{de ? "Pflichtdokumente" : "Mandatory documents"} ({de ? ROLLE_META[s.rolle].de : ROLLE_META[s.rolle].en} · {de ? KLASSE_META[s.risikoklasse].de : KLASSE_META[s.risikoklasse].en})</div>
                    <div className="flex flex-wrap gap-1.5">
                      {docs.map(d => {
                        const st = s.docStatus?.[d] ?? "fehlt";
                        const cls = st === "vorhanden" ? "st-ja-border st-ja-tint st-ja-text" : st === "entwurf" ? "st-teilweise-border st-teilweise-tint st-teilweise-text" : "border-destructive/40 bg-destructive/10 text-destructive";
                        const nextSt: DocStatus = st === "fehlt" ? "entwurf" : st === "entwurf" ? "vorhanden" : "fehlt";
                        return (
                          <button key={d} onClick={() => setDoc(s.id, d, nextSt)} title={de ? "Status wechseln" : "cycle status"}
                            className={`text-[11px] px-2 py-1 rounded-md border ${cls}`}>
                            <span className="font-semibold">{d}</span> {DOC_LABELS[d] ? (de ? DOC_LABELS[d].de : DOC_LABELS[d].en) : d} · {de ? DOC_STATUS_LABEL[st].de : DOC_STATUS_LABEL[st].en}
                          </button>
                        );
                      })}
                    </div>
                    {/* Vorbefüllte Pflichtdokumente erzeugen */}
                    {(() => {
                      const opts = docs.filter(erzeugbar);
                      if (opts.length === 0) return null;
                      if (studentLimited) return (
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {de ? "Vorbefüllte Dokumente: für Studierende über „Richtlinien“ (Export-Kontingent) — die Systemangaben werden dort automatisch übernommen."
                              : "Pre-filled documents: students export via “Policies” (export quota) — the system details are added there automatically."}
                        </p>
                      );
                      const wahl = docWahl[s.id] && opts.includes(docWahl[s.id]) ? docWahl[s.id] : opts[0];
                      return (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-muted-foreground">{de ? "Dokument vorbefüllt erzeugen:" : "Generate pre-filled document:"}</span>
                          <select value={wahl} onChange={e => setDocWahl(w => ({ ...w, [s.id]: e.target.value }))}
                            aria-label={de ? "Dokument wählen" : "Choose document"}
                            className="rounded-md border border-border bg-background px-2 py-1 text-xs max-w-[340px]">
                            {opts.map(d => {
                              const t = TEMPLATES.find(x => x.id === d)!;
                              return <option key={d} value={d}>{d} · {de ? t.name : t.nameEn}</option>;
                            })}
                          </select>
                          <button onClick={() => dokumentErzeugen(s, wahl, "word")} disabled={busy}
                            className="rounded-md border border-border px-2 py-1 flex items-center gap-1 disabled:opacity-50"><File size={13} />Word</button>
                          <button onClick={() => dokumentErzeugen(s, wahl, "pdf")} disabled={busy}
                            className="rounded-md border border-border px-2 py-1 flex items-center gap-1 disabled:opacity-50"><FileText size={13} />PDF</button>
                        </div>
                      );
                    })()}
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
