/**
 * DocumentLifecycle — Dokumenten-Lebenszyklus-Register.
 *
 * Klassifiziert Dokumente in drei Lebenszyklus-Klassen:
 *   - einmalig    : Einmalige Dokumente (einmal erstellt, selten geändert)
 *   - register    : Lebende Register (laufend gepflegt, z. B. VVT, Asset-Register)
 *   - periodisch  : Periodisch-wiederkehrend (turnusmäßige Prüfung/Erneuerung)
 *
 * Für periodische Dokumente wird aus letzter Prüfung + Intervall die nächste
 * Fälligkeit berechnet und überfällige Dokumente markiert.
 *
 * Persistenz: useToolData (org-weit geteilt, kein Schema nötig).
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFramework } from "@/contexts/FrameworkContext";
import { useToolData } from "@/hooks/useToolData";
import { FolderArchive, Plus, Trash2, RefreshCw, FileCheck2, AlertTriangle, ListPlus, LayoutGrid, ScrollText } from "lucide-react";
import { DOCUMENT_CATALOG, catalogForFrameworks } from "@/data/documentCatalog";
import { DOCUMENT_FRAMEWORK_MATRIX, matrixDocName } from "@/data/documentFrameworkMatrix";
import POLICY_TEMPLATES from "@/data/policyTemplates";
import ToolStatusChart from "@/components/tools/ToolStatusChart";
import { CHART_STATUS } from "@/lib/chartPalette";
import {
  type LifecycleDoc, type LifecycleState, LIFECYCLE_DEFAULT, DOC_TOOL_KEY, DOC_LS_KEY,
  docHealth, docNextDue, DOC_HEALTH_LABEL, sameName, titleOverlap,
} from "@/lib/tools/toolLinks";

/** Minimaler Blick auf den Richtlinien-Blob (`policies`): nur die Verknüpfung interessiert hier. */
type PolicyLinkView = Record<string, { documentId?: string } | undefined>;
const POLICY_LINK_DEFAULT: PolicyLinkView = {};

// CWS-FrameworkKey → Matrix-Spaltenschlüssel (17 inkl. KRITIS_DACHG)
const FW_TO_MATRIX: Record<string, string> = {
  ISO27001: "ISO27001", BSI_ITGS: "BSI", NIS2: "NIS2", DORA: "DORA", GDPR: "GDPR",
  ISO27701: "ISO27701", KRITIS: "KRITIS", BCM22301: "ISO22301", BSI200_4: "BSI200_4",
  ISO42001: "ISO42001", AIACT: "AIACT", TISAX: "TISAX", MaRisk: "MaRisk", CRA: "CRA",
  NIST_CSF: "NIST_CSF",
};

type DocClass = "einmalig" | "register" | "periodisch";
type DocStatus = "draft" | "active" | "archived";

// Typ liegt zentral in @/lib/tools/toolLinks (wird auch von Richtlinien gelesen).
type Doc = LifecycleDoc;
type DocState = LifecycleState;
const DEFAULT: DocState = LIFECYCLE_DEFAULT;

const CLASS_META: Record<DocClass, { de: string; en: string; descDe: string; descEn: string; icon: any }> = {
  einmalig:   { de: "Einmalige Dokumente", en: "One-time documents", descDe: "Einmal erstellt, selten geändert (z. B. Leitlinie, Grundsatzbeschluss).", descEn: "Created once, rarely changed (e.g. charter, policy statement).", icon: FileCheck2 },
  register:   { de: "Lebende Register", en: "Living registers", descDe: "Laufend gepflegt (z. B. Verarbeitungsverzeichnis, Asset-Register, Risikoregister).", descEn: "Continuously maintained (e.g. RoPA, asset register, risk register).", icon: RefreshCw },
  periodisch: { de: "Periodisch-wiederkehrend", en: "Periodic / recurring", descDe: "Turnusmäßige Prüfung/Erneuerung (z. B. jährliche Richtlinien-Review, Notfallübung).", descEn: "Recurring review/renewal (e.g. annual policy review, BCM drill).", icon: RefreshCw },
};
const STATUS_META: Record<DocStatus, { de: string; en: string }> = {
  draft:    { de: "Entwurf",   en: "Draft" },
  active:   { de: "Aktiv",     en: "Active" },
  archived: { de: "Archiviert", en: "Archived" },
};

const nextDue = docNextDue;

/** Normgrundlage eines Dokuments: gespeichert (aus Vorlage) oder per Namensabgleich aus dem Katalog. */
function basisFor(doc: Doc): string | undefined {
  if (doc.basis) return doc.basis;
  if (!doc.name) return undefined;
  const hit = DOCUMENT_CATALOG.find(c => sameName(c.de, doc.name) || sameName(c.en, doc.name))
    ?? DOCUMENT_CATALOG.find(c => titleOverlap(c.de, doc.name) >= 2 || titleOverlap(c.en, doc.name) >= 2);
  return hit?.basis;
}

export default function DocumentLifecycle() {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { active } = useFramework();
  const { data, setData, loading } = useToolData<DocState>(DOC_TOOL_KEY, DOC_LS_KEY, DEFAULT);
  // Nur lesend: welche Richtlinie verweist auf welches Dokument (policy.documentId)?
  const { data: policyLinks } = useToolData<PolicyLinkView>("policies", "nis2-policies", POLICY_LINK_DEFAULT);
  const [tab, setTab] = useState<DocClass>("einmalig");
  // Vorlagen nur für aktive Frameworks (KI-Dokumente erscheinen nur mit AI Act / ISO 42001).
  const katalog = useMemo(() => catalogForFrameworks(active.map(f => f.key as string)), [active]);
  const [showMatrix, setShowMatrix] = useState(false);

  /** docId → Richtlinien-Namen, die dieses Dokument als Nachweis nutzen. */
  const coveredPolicies = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const t of POLICY_TEMPLATES) {
      const docId = policyLinks?.[t.id]?.documentId;
      if (!docId) continue;
      const list = map.get(docId) ?? [];
      list.push(de ? t.name : t.nameEn);
      map.set(docId, list);
    }
    return map;
  }, [policyLinks, de]);

  // Framework-Pflichtdokumente aus der Matrix (nur aktive Frameworks, nur "Muss")
  const matrixByFramework = useMemo(() => {
    return active
      .map(f => ({ f, col: FW_TO_MATRIX[f.key] }))
      .filter(x => !!x.col)
      .map(({ f, col }) => ({
        framework: f,
        muss: DOCUMENT_FRAMEWORK_MATRIX.filter(d => d.frameworks[col!] === "Muss"),
        soa: DOCUMENT_FRAMEWORK_MATRIX.filter(d => d.frameworks[col!] === "SoA-abhängig").length,
      }));
  }, [active]);

  const docs = data.docs ?? [];
  const byClass = useMemo(() => docs.filter(d => d.docClass === tab), [docs, tab]);

  const overdueCount = useMemo(() =>
    docs.filter(d => {
      if (d.docClass !== "periodisch" || d.status === "archived") return false;
      const due = nextDue(d.lastReview, d.intervalMonths);
      return due && due < new Date();
    }).length, [docs]);

  // Überblick-Grafik: gültig / überfällig / Entwurf / fehlt (Katalog-Vorlagen ohne Dokument)
  const chartStats = useMemo(() => {
    let gueltig = 0, ueberfaellig = 0, entwurf = 0;
    for (const d of docs) {
      const h = docHealth(d);
      if (h === "gueltig") gueltig++; else if (h === "ueberfaellig") ueberfaellig++; else if (h === "entwurf") entwurf++;
    }
    const fehlt = katalog.filter(c =>
      !docs.some(d => d.status !== "archived" && (sameName(d.name, c.de) || sameName(d.name, c.en) || titleOverlap(d.name, c.de) >= 2))
    ).length;
    return { gueltig, ueberfaellig, entwurf, fehlt };
  }, [docs, katalog]);

  const [tplKey, setTplKey] = useState<string>("");

  const addDoc = () => {
    const doc: Doc = {
      id: crypto.randomUUID(), name: "", docClass: tab, owner: "",
      status: "draft", lastReview: "", intervalMonths: tab === "periodisch" ? 12 : 0, notes: "",
    };
    setData(d => ({ docs: [doc, ...(d.docs ?? [])] }));
  };

  const addFromTemplate = () => {
    const c = katalog.find(x => x.key === tplKey);
    if (!c) return;
    const doc: Doc = {
      id: crypto.randomUUID(), name: de ? c.de : c.en, docClass: c.docClass, owner: "",
      status: "draft", lastReview: "", intervalMonths: c.intervalMonths ?? 0, basis: c.basis, notes: "",
    };
    setTab(c.docClass);
    setData(d => ({ docs: [doc, ...(d.docs ?? [])] }));
    setTplKey("");
  };
  const patch = (id: string, p: Partial<Doc>) =>
    setData(d => ({ docs: (d.docs ?? []).map(x => x.id === id ? { ...x, ...p } : x) }));
  const remove = (id: string) =>
    setData(d => ({ docs: (d.docs ?? []).filter(x => x.id !== id) }));

  if (loading) return <div className="p-6 text-sm text-muted-foreground">{de ? "Lädt…" : "Loading…"}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FolderArchive className="text-primary" size={22} />
          {de ? "Dokumenten-Lebenszyklus" : "Document Lifecycle"}
        </h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          {de
            ? "Ordnen Sie Ihre Dokumente den drei Lebenszyklus-Klassen zu. Periodische Dokumente erhalten automatisch eine nächste Fälligkeit; überfällige werden markiert."
            : "Assign your documents to the three lifecycle classes. Periodic documents get an automatic next-due date; overdue ones are flagged."}
        </p>
      </header>

      <ToolStatusChart
        title={de ? "Dokumentenstatus" : "Document status"}
        subtitle={de
          ? `${docs.length} Dokument(e) · ${coveredPolicies.size} als Richtlinien-Nachweis verknüpft · „fehlt" = Katalog-Vorlagen ohne Dokument`
          : `${docs.length} document(s) · ${coveredPolicies.size} linked as policy evidence · "missing" = catalog templates without a document`}
        items={[
          { label: de ? "gültig" : "valid", value: chartStats.gueltig, color: CHART_STATUS.ja },
          { label: de ? "überfällig" : "overdue", value: chartStats.ueberfaellig, color: CHART_STATUS.teilweise },
          { label: de ? "Entwurf" : "draft", value: chartStats.entwurf, color: CHART_STATUS.na },
          { label: de ? "fehlt (Katalog)" : "missing (catalog)", value: chartStats.fehlt, color: CHART_STATUS.nein },
        ]}
        centerLabel={String(docs.length)}
        emptyText={de ? "Noch keine Dokumente." : "No documents yet."}
      />

      {overdueCount > 0 && (
        <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-4 py-2 flex items-center gap-2">
          <AlertTriangle size={15} />
          {de ? `${overdueCount} periodische(s) Dokument(e) überfällig zur Prüfung.` : `${overdueCount} periodic document(s) overdue for review.`}
        </div>
      )}

      {/* Framework-Pflichtdokumente aus der Dokument-Matrix (142 Dok. × 17 Frameworks) */}
      {matrixByFramework.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <button onClick={() => setShowMatrix(v => !v)} className="w-full flex items-center justify-between p-4 text-sm font-semibold">
            <span className="flex items-center gap-2"><LayoutGrid size={16} className="text-primary" />
              {de ? "Framework-Pflichtdokumente (Matrix)" : "Framework mandatory documents (matrix)"}
            </span>
            <span className="text-muted-foreground">{showMatrix ? "▲" : "▼"}</span>
          </button>
          {showMatrix && (
            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {matrixByFramework.map(({ framework, muss, soa }) => (
                <div key={framework.key} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="text-xs font-semibold flex items-center justify-between">
                    <span>{de ? framework.shortDe : framework.shortEn}</span>
                    <span className="text-[10px] text-muted-foreground">{muss.length} Muss{soa ? ` · ${soa} SoA` : ""}</span>
                  </div>
                  <ul className="mt-1.5 space-y-0.5 max-h-40 overflow-y-auto">
                    {muss.map(d => (
                      <li key={d.docId} className="text-[11px] text-muted-foreground flex items-start gap-1">
                        <span className="font-mono text-[9px] opacity-60 shrink-0">{d.docId}</span>
                        <span className="truncate" title={matrixDocName(d, de)}>{matrixDocName(d, de)}</span>
                        {/* Aktualitätshinweis: „Muss" allein wäre hier irreführend —
                            z. B. Pflicht in Kraft, aber Adressat mangels Rechtsverordnung
                            noch nicht bestimmt. Volltext im Titel, damit die Liste kompakt bleibt. */}
                        {d.hinweis && (
                          <span
                            className="shrink-0 text-amber-600 dark:text-amber-500 cursor-help"
                            title={de ? d.hinweis.de : d.hinweis.en}
                            aria-label={de ? d.hinweis.de : d.hinweis.en}
                          >
                            <AlertTriangle size={11} />
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {muss.some(d => d.hinweis) && (
                    <p className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-500 leading-snug">
                      {de
                        ? "⚠ = Rechtslage prüfen (Details im Tooltip)."
                        : "⚠ = check the current legal position (details in the tooltip)."}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vorlagen-Katalog: gesetzlich/normativ erforderliche Dokumente */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-end gap-2">
        <div className="flex flex-col flex-1 min-w-[260px]">
          <label className="text-xs text-muted-foreground mb-1">
            {de ? "Aus Katalog wählen (typische ISMS-/DSGVO-/NIS2-/KI-Dokumente)" : "Choose from catalog (typical ISMS/GDPR/NIS2/AI documents)"}
          </label>
          <select value={tplKey} onChange={e => setTplKey(e.target.value)} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm">
            <option value="">{de ? "— Vorlage wählen —" : "— choose template —"}</option>
            {(["einmalig", "register", "periodisch"] as DocClass[]).map(cls => (
              <optgroup key={cls} label={de ? CLASS_META[cls].de : CLASS_META[cls].en}>
                {katalog.filter(c => c.docClass === cls).map(c => (
                  <option key={c.key} value={c.key}>{(de ? c.de : c.en)} — {c.basis}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <button onClick={addFromTemplate} disabled={!tplKey}
          className="rounded-md bg-primary text-primary-foreground px-4 py-1.5 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50">
          <ListPlus size={15} />{de ? "Aus Vorlage hinzufügen" : "Add from template"}
        </button>
      </div>

      {/* Klassen-Tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CLASS_META) as DocClass[]).map(c => {
          const Icon = CLASS_META[c].icon;
          const n = docs.filter(d => d.docClass === c).length;
          return (
            <button key={c} onClick={() => setTab(c)}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 border transition ${tab === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50"}`}>
              <Icon size={15} />{de ? CLASS_META[c].de : CLASS_META[c].en}
              <span className={`ml-1 text-[11px] px-1.5 rounded-full ${tab === c ? "bg-primary-foreground/20" : "bg-muted"}`}>{n}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <p className="text-xs text-muted-foreground max-w-2xl">{de ? CLASS_META[tab].descDe : CLASS_META[tab].descEn}</p>
          <button onClick={addDoc} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5 shrink-0">
            <Plus size={15} />{de ? "Dokument" : "Document"}
          </button>
        </div>

        {byClass.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">{de ? "Keine Dokumente in dieser Klasse." : "No documents in this class."}</div>
        ) : (
          <div className="divide-y divide-border">
            {byClass.map(doc => {
              const due = doc.docClass === "periodisch" ? nextDue(doc.lastReview, doc.intervalMonths) : null;
              const overdue = due && due < new Date() && doc.status !== "archived";
              return (
                <div key={doc.id} className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input value={doc.name} onChange={e => patch(doc.id, { name: e.target.value })}
                      placeholder={de ? "Dokumentname" : "Document name"}
                      className="flex-1 min-w-[200px] rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium" />
                    <input value={doc.owner} onChange={e => patch(doc.id, { owner: e.target.value })}
                      placeholder={de ? "Verantwortlich" : "Owner"}
                      className="w-40 rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
                    <select value={doc.status} onChange={e => patch(doc.id, { status: e.target.value as DocStatus })}
                      className="text-xs rounded-md border border-border bg-background px-2 py-1.5">
                      {(Object.keys(STATUS_META) as DocStatus[]).map(s => <option key={s} value={s}>{de ? STATUS_META[s].de : STATUS_META[s].en}</option>)}
                    </select>
                    <button onClick={() => remove(doc.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={15} /></button>
                  </div>
                  {(() => {
                    const basis = basisFor(doc);
                    const covers = coveredPolicies.get(doc.id) ?? [];
                    const health = docHealth(doc);
                    const healthCls = health === "gueltig" ? "st-ja-tint st-ja-text"
                      : health === "ueberfaellig" ? "st-teilweise-tint st-teilweise-text"
                      : "bg-muted text-muted-foreground";
                    if (!basis && covers.length === 0) return null;
                    return (
                      <div className="text-[11px] text-muted-foreground -mt-1 flex flex-wrap items-center gap-1.5">
                        {basis && (
                          <span className="font-mono bg-muted px-1.5 py-0.5 rounded" title={de ? "Norm-/Rechtsgrundlage (Katalog)" : "Legal/standard basis (catalog)"}>{basis}</span>
                        )}
                        {covers.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-1.5 py-0.5">
                            <ScrollText size={11} className="text-primary" />
                            {de ? "deckt Richtlinie(n): " : "covers policy(ies): "}
                            <Link to="/policies" className="font-medium text-primary hover:underline">{covers.join(", ")}</Link>
                            <span className={`ml-1 px-1 rounded ${healthCls}`}>{DOC_HEALTH_LABEL[health][lang]}</span>
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      {de ? "Letzte Prüfung" : "Last review"}
                      <input type="date" value={doc.lastReview} onChange={e => patch(doc.id, { lastReview: e.target.value })}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                    </label>
                    {doc.docClass === "periodisch" && (
                      <>
                        <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          {de ? "Intervall (Monate)" : "Interval (months)"}
                          <input type="number" min={1} max={120} value={doc.intervalMonths}
                            onChange={e => patch(doc.id, { intervalMonths: Number(e.target.value) || 0 })}
                            className="w-16 rounded-md border border-border bg-background px-2 py-1 text-xs" />
                        </label>
                        {due && (
                          <span className={`text-[11px] px-2 py-1 rounded-md border ${overdue ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border bg-muted/40 text-muted-foreground"}`}>
                            {de ? "Nächste Prüfung: " : "Next review: "}{due.toLocaleDateString(de ? "de-DE" : "en-GB")}
                            {overdue && <AlertTriangle size={11} className="inline ml-1 -mt-0.5" />}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <textarea value={doc.notes} onChange={e => patch(doc.id, { notes: e.target.value })}
                    placeholder={de ? "Notizen / Ablageort / Verweis…" : "Notes / location / reference…"}
                    rows={2} className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
