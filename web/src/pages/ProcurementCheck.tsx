/**
 * ProcurementCheck — Beschaffungs-/App-Freigabe-Prüfung.
 *
 * Vor dem Kauf/Einsatz einer neuen Anwendung wird eine Freigabeprüfung aus
 * IT-Sicherheits- und DSGVO-Sicht durchgeführt. Der Fragenkatalog passt sich an:
 *   • Betriebsmodell: SaaS / On-Premises / Hybrid
 *   • Verarbeitet personenbezogene Daten? → DSGVO-Block
 *   • Vorhandene Zertifikate (ISO 27001 / C5 / SOC 2 …) → reduziert die Tiefe der
 *     IT-Sicherheitsfragen (Zertifikat als Nachweis), sonst voller Kontrollkatalog.
 *
 * Ausgabe: automatische Ampel-Empfehlung (Freigabe / Auflagen / Ablehnung) auf
 * Basis offener kritischer Punkte, plus manuelle Entscheidung.
 *
 * Persistenz: useToolData (org-weit geteilt, kein Schema nötig).
 * Framework-Bezug: NIS2 Art. 21 (Lieferkette), ISO 27001 A.5.19-23, BSI, DSGVO.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToolData } from "@/hooks/useToolData";
import { toast } from "sonner";
import { ShoppingCart, Plus, Trash2, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Truck } from "lucide-react";
import ToolStatusChart from "@/components/tools/ToolStatusChart";
import { CHART_STATUS } from "@/lib/chartPalette";
import {
  type Supplier, type SupplierState, type SupplierCert, SUPPLIER_CERTS,
  SUPPLIER_DEFAULT, SUPPLIER_TOOL_KEY, SUPPLIER_LS_KEY, sameName,
} from "@/lib/tools/toolLinks";

type Deployment = "saas" | "onprem" | "hybrid";
type DataClass = "none" | "personal" | "special";
type Answer = "yes" | "no" | "na" | "";
type Decision = "open" | "approved" | "conditional" | "rejected";

const CERTS = ["ISO27001", "SOC2", "C5", "ISO27017", "ISO27018", "TISAX"] as const;
type Cert = typeof CERTS[number];
// Diese Zertifikate gelten als vollwertiger ISMS-Nachweis → IT-Sicherheitsfragen reduziert.
const MAJOR_CERTS: Cert[] = ["ISO27001", "SOC2", "C5"];

interface Question {
  id: string;
  de: string; en: string;
  section: "sec" | "dsgvo" | "saas" | "onprem";
  critical?: boolean;
}

const QUESTIONS: Question[] = [
  // ── IT-Sicherheit (Basis, entfällt großteils bei Major-Zertifikat) ──
  { id: "sec-isms",   section: "sec", critical: true,  de: "Betreibt der Anbieter ein dokumentiertes ISMS?", en: "Does the vendor operate a documented ISMS?" },
  { id: "sec-enc",    section: "sec", critical: true,  de: "Werden Daten verschlüsselt (Transport & Ruhezustand)?", en: "Is data encrypted (in transit & at rest)?" },
  { id: "sec-access", section: "sec", critical: true,  de: "Gibt es rollenbasierte Zugriffskontrolle & MFA?", en: "Is there role-based access control & MFA?" },
  { id: "sec-log",    section: "sec", critical: false, de: "Werden sicherheitsrelevante Ereignisse protokolliert?", en: "Are security-relevant events logged?" },
  { id: "sec-inc",    section: "sec", critical: true,  de: "Existiert ein Incident-Response-Prozess mit Meldung an Kunden?", en: "Is there an incident-response process with customer notification?" },
  { id: "sec-bcp",    section: "sec", critical: false, de: "Gibt es Backup-/Notfallkonzept mit definierten RTO/RPO?", en: "Backup/BCP with defined RTO/RPO?" },
  { id: "sec-pentest",section: "sec", critical: false, de: "Werden regelmäßige Pentests/Schwachstellenscans durchgeführt?", en: "Regular pentests/vulnerability scans?" },
  { id: "sec-exit",   section: "sec", critical: false, de: "Gibt es ein Exit-/Datenrückgabe- & Löschkonzept bei Vertragsende?", en: "Exit / data return & deletion concept at contract end?" },
  // ── DSGVO (nur bei personenbezogenen Daten) ──
  { id: "gdpr-avv",   section: "dsgvo", critical: true,  de: "Liegt ein Auftragsverarbeitungsvertrag (AVV, Art. 28) vor?", en: "Is there a Data Processing Agreement (Art. 28)?" },
  { id: "gdpr-tom",   section: "dsgvo", critical: true,  de: "Sind technische & organisatorische Maßnahmen (Art. 32) dokumentiert?", en: "Are technical & organizational measures (Art. 32) documented?" },
  { id: "gdpr-loc",   section: "dsgvo", critical: true,  de: "Erfolgt die Verarbeitung in der EU/EWR (oder mit gültigem Transfermechanismus)?", en: "Is processing within EU/EEA (or with a valid transfer mechanism)?" },
  { id: "gdpr-sub",   section: "dsgvo", critical: false, de: "Sind Unterauftragsverarbeiter transparent gelistet & genehmigungspflichtig?", en: "Are sub-processors listed & subject to approval?" },
  { id: "gdpr-rights",section: "dsgvo", critical: false, de: "Unterstützt der Anbieter Betroffenenrechte (Auskunft, Löschung)?", en: "Does the vendor support data-subject rights (access, deletion)?" },
  { id: "gdpr-dpia",  section: "dsgvo", critical: false, de: "Wurde geprüft, ob eine Datenschutz-Folgenabschätzung (DSFA) nötig ist?", en: "Was a DPIA necessity check performed?" },
  // ── SaaS-spezifisch ──
  { id: "saas-slasa", section: "saas", critical: false, de: "Ist eine Verfügbarkeits-SLA vertraglich zugesichert?", en: "Is an availability SLA contractually assured?" },
  { id: "saas-tenant",section: "saas", critical: true,  de: "Ist eine sichere Mandantentrennung gewährleistet?", en: "Is secure multi-tenant isolation ensured?" },
  { id: "saas-audit", section: "saas", critical: false, de: "Bestehen Audit-/Nachweisrechte gegenüber dem Anbieter?", en: "Are audit/evidence rights against the vendor in place?" },
  // ── On-Premises-spezifisch ──
  { id: "onprem-patch", section: "onprem", critical: true,  de: "Ist die Verantwortung für Patching & Updates geklärt?", en: "Is responsibility for patching & updates clarified?" },
  { id: "onprem-net",   section: "onprem", critical: false, de: "Kann die Software netzwerkseitig segmentiert werden?", en: "Can the software be network-segmented?" },
  { id: "onprem-eol",   section: "onprem", critical: false, de: "Ist der Support-/EOL-Zeitplan bekannt?", en: "Is the support/EOL schedule known?" },
];

interface Request {
  id: string;
  appName: string;
  vendor: string;
  requester: string;
  purpose: string;
  deployment: Deployment;
  dataClass: DataClass;
  certs: Cert[];
  answers: Record<string, Answer>;
  decision: Decision;
  assessedOn: string;   // Prüfdatum (YYYY-MM-DD)
  assessedBy: string;   // Prüfer:in
  archived: boolean;    // abgeschlossen/archiviert
  notes: string;
}
interface State { requests: Request[] }
const DEFAULT: State = { requests: [] };

const DEPLOY_LABEL: Record<Deployment, { de: string; en: string }> = {
  saas: { de: "SaaS / Cloud", en: "SaaS / Cloud" },
  onprem: { de: "On-Premises", en: "On-premises" },
  hybrid: { de: "Hybrid", en: "Hybrid" },
};
const DATA_LABEL: Record<DataClass, { de: string; en: string }> = {
  none: { de: "Keine personenbezogenen Daten", en: "No personal data" },
  personal: { de: "Personenbezogene Daten", en: "Personal data" },
  special: { de: "Besondere Kategorien (Art. 9)", en: "Special categories (Art. 9)" },
};
const DECISION_META: Record<Decision, { de: string; en: string; cls: string }> = {
  open:        { de: "Offen", en: "Open", cls: "bg-muted text-muted-foreground" },
  approved:    { de: "Freigabe", en: "Approved", cls: "st-ja-tint st-ja-text" },
  conditional: { de: "Freigabe mit Auflagen", en: "Conditional", cls: "st-teilweise-tint st-teilweise-text" },
  rejected:    { de: "Ablehnung", en: "Rejected", cls: "bg-destructive/15 text-destructive" },
};

// Welche Fragen gelten für eine Anfrage?
function applicableQuestions(r: Request): Question[] {
  const hasMajorCert = r.certs.some(c => MAJOR_CERTS.includes(c));
  return QUESTIONS.filter(q => {
    if (q.section === "dsgvo") return r.dataClass !== "none";
    if (q.section === "saas") return r.deployment === "saas" || r.deployment === "hybrid";
    if (q.section === "onprem") return r.deployment === "onprem" || r.deployment === "hybrid";
    if (q.section === "sec") {
      // Bei Major-Zertifikat nur die kritischen Restfragen zeigen (Zertifikat deckt Basis ab).
      return hasMajorCert ? q.critical === true : true;
    }
    return true;
  });
}

// Automatische Ampel-Empfehlung.
function autoVerdict(r: Request): { level: Decision; openCritical: number; openTotal: number } {
  const qs = applicableQuestions(r);
  let openCritical = 0, openTotal = 0;
  for (const q of qs) {
    const a = r.answers[q.id] ?? "";
    const bad = a === "no" || a === "";
    if (bad) { openTotal++; if (q.critical) openCritical++; }
  }
  const level: Decision = openCritical > 0 ? "rejected" : openTotal > 0 ? "conditional" : "approved";
  return { level, openCritical, openTotal };
}

export default function ProcurementCheck() {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { data, setData, loading } = useToolData<State>("procurement-check", "cws-procurement-check", DEFAULT);
  // Lieferanten-Check: Freigaben werden als Lieferant übernommen (Duplikate per Name verhindert).
  const { data: supData, setData: setSupData, loading: supLoading } = useToolData<SupplierState>(SUPPLIER_TOOL_KEY, SUPPLIER_LS_KEY, SUPPLIER_DEFAULT);
  const suppliers = supData?.suppliers ?? [];
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<"active" | "archived" | "all">("active");

  const requests = data.requests ?? [];
  const shown = requests.filter(r => view === "all" ? true : view === "archived" ? r.archived : !r.archived);

  /** Bereits vorhandener Lieferant zu einer Anfrage (per Request-ID oder Anbieter-/App-Name). */
  const supplierFor = (r: Request): Supplier | undefined =>
    suppliers.find(s => s.sourceRequestId === r.id)
    ?? suppliers.find(s => (r.vendor && sameName(s.name, r.vendor)) || (!r.vendor && r.appName && sameName(s.name, r.appName)));

  const adoptAsSupplier = (r: Request) => {
    const name = (r.vendor || r.appName).trim();
    if (!name) { toast.error(de ? "Bitte zuerst Anbieter oder Anwendung eintragen." : "Please enter a vendor or application name first."); return; }
    const dup = supplierFor(r);
    if (dup) { toast.info(de ? `Lieferant „${dup.name}" ist bereits im Lieferanten-Check.` : `Supplier "${dup.name}" already exists in the Supplier Check.`); return; }
    const answers: Record<string, "yes" | "no" | "na" | ""> = {};
    // Bereits beantwortete Punkte der Freigabe als Startwerte übernehmen (gleiche Frage, andere Sicht).
    const map: Array<[string, string]> = [["gdpr-avv", "q-avv"], ["sec-exit", "q-exit"], ["saas-audit", "q-audit"], ["sec-bcp", "q-bcp"], ["gdpr-sub", "q-subchain"], ["sec-inc", "q-incident"]];
    for (const [from, to] of map) { const a = r.answers[from]; if (a) answers[to] = a; }
    if (r.certs.some(c => MAJOR_CERTS.includes(c))) answers["q-cert"] = "yes";
    const s: Supplier = {
      id: crypto.randomUUID(),
      name,
      service: `${r.appName || ""}${r.appName ? " · " : ""}${DEPLOY_LABEL[r.deployment][lang]}`,
      criticality: r.dataClass === "special" ? "high" : "medium",
      dataAccess: r.dataClass === "special" ? "sensitive" : r.dataClass === "personal" ? "personal" : "none",
      certs: r.certs.filter((c): c is SupplierCert => (SUPPLIER_CERTS as readonly string[]).includes(c)),
      answers,
      lastReview: r.assessedOn || new Date().toISOString().slice(0, 10),
      reviewMonths: 12,
      assessedBy: r.assessedBy || "",
      archived: false,
      notes: de
        ? `Aus Beschaffungs-Freigabe „${r.appName || name}" (${DECISION_META[r.decision].de}${r.notes ? `; Auflagen: ${r.notes}` : ""}).`
        : `From procurement approval "${r.appName || name}" (${DECISION_META[r.decision].en}${r.notes ? `; conditions: ${r.notes}` : ""}).`,
      sourceRequestId: r.id,
    };
    setSupData(d => ({ suppliers: [s, ...(d?.suppliers ?? [])] }));
    toast.success(de ? `Lieferant „${name}" im Lieferanten-Check angelegt.` : `Supplier "${name}" created in the Supplier Check.`);
  };

  // Überblick-Grafik: Freigabe / Auflagen / Abgelehnt / offen (aktive Anfragen)
  const decisionStats = useMemo(() => {
    const c = { approved: 0, conditional: 0, rejected: 0, open: 0 };
    for (const r of requests) { if (r.archived) continue; c[r.decision]++; }
    return c;
  }, [requests]);

  const add = () => {
    const r: Request = {
      id: crypto.randomUUID(), appName: "", vendor: "", requester: "", purpose: "",
      deployment: "saas", dataClass: "personal", certs: [], answers: {}, decision: "open",
      assessedOn: new Date().toISOString().slice(0, 10), assessedBy: "", archived: false, notes: "",
    };
    setData(d => ({ requests: [r, ...(d.requests ?? [])] }));
    setOpenId(r.id);
  };
  const patch = (id: string, p: Partial<Request>) =>
    setData(d => ({ requests: (d.requests ?? []).map(r => r.id === id ? { ...r, ...p } : r) }));
  const remove = (id: string) =>
    setData(d => ({ requests: (d.requests ?? []).filter(r => r.id !== id) }));
  const setAnswer = (id: string, qid: string, a: Answer) =>
    setData(d => ({ requests: (d.requests ?? []).map(r => r.id === id ? { ...r, answers: { ...r.answers, [qid]: a } } : r) }));
  const toggleCert = (id: string, c: Cert) =>
    setData(d => ({ requests: (d.requests ?? []).map(r => r.id === id ? { ...r, certs: r.certs.includes(c) ? r.certs.filter(x => x !== c) : [...r.certs, c] } : r) }));

  const sectionTitle = (s: Question["section"]) =>
    s === "sec" ? (de ? "IT-Sicherheit" : "IT security")
    : s === "dsgvo" ? "DSGVO"
    : s === "saas" ? (de ? "SaaS-spezifisch" : "SaaS-specific")
    : (de ? "On-Premises-spezifisch" : "On-premises-specific");

  if (loading) return <div className="p-6 text-sm text-muted-foreground">{de ? "Lädt…" : "Loading…"}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="text-primary" size={22} />
          {de ? "Beschaffungs-Freigabe (App-Prüfung)" : "Procurement Approval (App Review)"}
        </h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          {de
            ? "Vor dem Kauf einer Anwendung: Freigabeprüfung aus IT-Sicherheits- und DSGVO-Sicht. Der Fragenkatalog passt sich an Betriebsmodell, Datenart und vorhandene Zertifikate an."
            : "Before buying an application: an approval check from IT-security and GDPR angles. The questionnaire adapts to deployment model, data type and existing certificates."}
        </p>
      </header>

      <ToolStatusChart
        title={de ? "Freigabe-Entscheidungen" : "Approval decisions"}
        subtitle={de
          ? `${requests.filter(r => !r.archived).length} aktive Anfrage(n) · ${requests.filter(r => !!supplierFor(r)).length} als Lieferant übernommen`
          : `${requests.filter(r => !r.archived).length} active request(s) · ${requests.filter(r => !!supplierFor(r)).length} adopted as supplier`}
        items={[
          { label: de ? "Freigabe" : "Approved", value: decisionStats.approved, color: CHART_STATUS.ja },
          { label: de ? "mit Auflagen" : "Conditional", value: decisionStats.conditional, color: CHART_STATUS.teilweise },
          { label: de ? "Abgelehnt" : "Rejected", value: decisionStats.rejected, color: CHART_STATUS.nein },
          { label: de ? "offen" : "Open", value: decisionStats.open, color: CHART_STATUS.offen },
        ]}
        emptyText={de ? "Noch keine aktiven Anfragen." : "No active requests yet."}
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">{de ? "Anfrage-Register" : "Request register"}</h2>
            <span className="text-xs text-muted-foreground">{shown.length}/{requests.length}</span>
            <select value={view} onChange={e => setView(e.target.value as any)} className="text-xs rounded-md border border-border bg-background px-2 py-1 ml-2">
              <option value="active">{de ? "Aktiv" : "Active"}</option>
              <option value="archived">{de ? "Archiv" : "Archive"}</option>
              <option value="all">{de ? "Alle" : "All"}</option>
            </select>
          </div>
          <button onClick={add} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5">
            <Plus size={15} />{de ? "Anfrage" : "Request"}
          </button>
        </div>

        {shown.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">{de ? "Keine Einträge in dieser Ansicht." : "No entries in this view."}</div>
        ) : (
          <div className="divide-y divide-border">
            {shown.map(r => {
              const v = autoVerdict(r);
              const isOpen = openId === r.id;
              const hasMajorCert = r.certs.some(c => MAJOR_CERTS.includes(c));
              const qs = applicableQuestions(r);
              const sections = Array.from(new Set(qs.map(q => q.section)));
              return (
                <div key={r.id} className="p-4 space-y-3">
                  {/* Kopf */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => setOpenId(isOpen ? null : r.id)} className="text-left flex-1 min-w-[200px]">
                      <div className="text-sm font-semibold flex items-center gap-2">
                        {r.appName || (de ? "(ohne Namen)" : "(unnamed)")}
                        <span className="text-xs text-muted-foreground">{r.vendor}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {DEPLOY_LABEL[r.deployment][lang]} · {DATA_LABEL[r.dataClass][lang]}
                      </div>
                    </button>
                    {/* Endgültige Entscheidung (falls gesetzt) sonst Auto-Empfehlung */}
                    {r.decision !== "open" ? (
                      <span className={`text-[11px] px-2 py-1 rounded-md ${DECISION_META[r.decision].cls}`}>{DECISION_META[r.decision][lang]}</span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md ${DECISION_META[v.level].cls}`}>
                        {v.level === "approved" ? <CheckCircle2 size={12} /> : v.level === "conditional" ? <AlertTriangle size={12} /> : <XCircle size={12} />}
                        {de ? "Empf.: " : "Rec.: "}{DECISION_META[v.level][lang]}
                      </span>
                    )}
                    {r.assessedOn && <span className="text-[11px] text-muted-foreground">{de ? "geprüft " : "checked "}{r.assessedOn}</span>}
                    {(() => {
                      const existing = supplierFor(r);
                      if (existing) return (
                        <Link to="/suppliers" className="text-[11px] px-2 py-1 rounded-md border border-border bg-muted/40 text-muted-foreground inline-flex items-center gap-1 hover:border-primary/50" title={de ? `Lieferant „${existing.name}" im Lieferanten-Check` : `Supplier "${existing.name}" in the Supplier Check`}>
                          <Truck size={11} />{de ? "Lieferant vorhanden" : "supplier exists"}
                        </Link>
                      );
                      if (r.decision === "approved" || r.decision === "conditional") return (
                        <button onClick={() => adoptAsSupplier(r)} disabled={supLoading} className="text-[11px] px-2 py-1 rounded-md border border-primary/40 text-primary inline-flex items-center gap-1 hover:bg-primary/5 disabled:opacity-50">
                          <Truck size={11} />{de ? "Als Lieferant übernehmen" : "Adopt as supplier"}
                        </button>
                      );
                      return null;
                    })()}
                    <button onClick={() => patch(r.id, { archived: !r.archived })} className="text-[11px] text-muted-foreground hover:text-primary px-1.5 py-1 rounded border border-border">
                      {r.archived ? (de ? "reaktivieren" : "reactivate") : (de ? "abschließen" : "archive")}
                    </button>
                    <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={15} /></button>
                  </div>

                  {isOpen && (
                    <div className="space-y-4 pt-1">
                      {/* Eckdaten */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input value={r.appName} onChange={e => patch(r.id, { appName: e.target.value })} placeholder={de ? "Anwendung" : "Application"} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
                        <input value={r.vendor} onChange={e => patch(r.id, { vendor: e.target.value })} placeholder={de ? "Anbieter" : "Vendor"} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
                        <input value={r.requester} onChange={e => patch(r.id, { requester: e.target.value })} placeholder={de ? "Antragsteller/Abteilung" : "Requester/Dept."} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
                        <input value={r.purpose} onChange={e => patch(r.id, { purpose: e.target.value })} placeholder={de ? "Zweck" : "Purpose"} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
                        <label className="text-xs text-muted-foreground flex items-center gap-2">{de ? "Geprüft am" : "Checked on"}
                          <input type="date" value={r.assessedOn} onChange={e => patch(r.id, { assessedOn: e.target.value })} className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                        </label>
                        <input value={r.assessedBy} onChange={e => patch(r.id, { assessedBy: e.target.value })} placeholder={de ? "Prüfer:in" : "Assessor"} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
                        <label className="text-xs text-muted-foreground flex items-center gap-2">{de ? "Betriebsmodell" : "Deployment"}
                          <select value={r.deployment} onChange={e => patch(r.id, { deployment: e.target.value as Deployment })} className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                            {(Object.keys(DEPLOY_LABEL) as Deployment[]).map(k => <option key={k} value={k}>{DEPLOY_LABEL[k][lang]}</option>)}
                          </select>
                        </label>
                        <label className="text-xs text-muted-foreground flex items-center gap-2">{de ? "Datenart" : "Data type"}
                          <select value={r.dataClass} onChange={e => patch(r.id, { dataClass: e.target.value as DataClass })} className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                            {(Object.keys(DATA_LABEL) as DataClass[]).map(k => <option key={k} value={k}>{DATA_LABEL[k][lang]}</option>)}
                          </select>
                        </label>
                      </div>

                      {/* Zertifikate */}
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <ShieldCheck size={13} />{de ? "Vorhandene Zertifikate/Nachweise" : "Existing certificates/attestations"}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {CERTS.map(c => (
                            <button key={c} onClick={() => toggleCert(r.id, c)}
                              className={`px-2 py-0.5 rounded-full text-[11px] border ${r.certs.includes(c) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}>
                              {c}{MAJOR_CERTS.includes(c) ? " ✓" : ""}
                            </button>
                          ))}
                        </div>
                        {hasMajorCert && (
                          <p className="text-[11px] st-ja-text mt-1">
                            {de ? "Anerkanntes ISMS-Zertifikat vorhanden — IT-Sicherheitsbasis gilt als nachgewiesen; nur kritische Restfragen bleiben." : "Recognized ISMS certificate present — IT-security baseline is considered attested; only critical residual questions remain."}
                          </p>
                        )}
                      </div>

                      {/* Fragen je Sektion */}
                      {sections.map(sec => (
                        <div key={sec}>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{sectionTitle(sec)}</div>
                          <div className="space-y-1.5">
                            {qs.filter(q => q.section === sec).map(q => {
                              const a = r.answers[q.id] ?? "";
                              return (
                                <div key={q.id} className="flex items-start gap-2 text-sm">
                                  <div className="flex-1">
                                    {de ? q.de : q.en}
                                    {q.critical && <span className="ml-1 text-[10px] text-destructive align-top">●</span>}
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    {(["yes", "no", "na"] as Answer[]).map(opt => (
                                      <button key={opt} onClick={() => setAnswer(r.id, q.id, opt)}
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
                      ))}

                      {/* Entscheidung */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60">
                        <span className="text-xs text-muted-foreground">
                          {de ? `Offene kritische Punkte: ${v.openCritical} · offen gesamt: ${v.openTotal}` : `Open critical: ${v.openCritical} · open total: ${v.openTotal}`}
                        </span>
                        <label className="text-xs text-muted-foreground flex items-center gap-2 ml-auto">{de ? "Entscheidung" : "Decision"}
                          <select value={r.decision} onChange={e => patch(r.id, { decision: e.target.value as Decision })} className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                            {(Object.keys(DECISION_META) as Decision[]).map(k => <option key={k} value={k}>{DECISION_META[k][lang]}</option>)}
                          </select>
                        </label>
                      </div>
                      <textarea value={r.notes} onChange={e => patch(r.id, { notes: e.target.value })} rows={2}
                        placeholder={de ? "Auflagen / Begründung / Notizen…" : "Conditions / rationale / notes…"}
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
        {de ? "Bezug: NIS2 Art. 21 (Lieferkette), ISO 27001 A.5.19–A.5.23, BSI, DSGVO Art. 28/32. ● = kritischer Punkt." : "Reference: NIS2 Art. 21 (supply chain), ISO 27001 A.5.19–A.5.23, BSI, GDPR Art. 28/32. ● = critical item."}
      </p>
    </div>
  );
}
