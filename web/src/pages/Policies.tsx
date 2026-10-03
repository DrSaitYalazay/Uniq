import { useState, useMemo, useCallback, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFramework } from "@/contexts/FrameworkContext";
import { isNis2Active, getActiveFrameworkKeys } from "@/lib/frameworkFlags";
import { supabase } from "@/integrations/supabase/client";
import { useToolData } from "@/hooks/useToolData";
// PipelineNav/AppHeader entfernt: Richtlinien laufen als Standalone-Werkzeug ausserhalb des Pipeline-Shells.
import ToolSaveBar from "@/components/ToolSaveBar";

import PolicyCharts from "@/components/PolicyCharts";
import ReportExclusionDialog from "@/components/ReportExclusionDialog";
import POLICY_TEMPLATES, { POLICY_CATEGORIES, type PolicyTemplate } from "@/data/policyTemplates";
import CLAUSE_TEMPLATES from "@/data/policyClauseTemplates";
import { resolvePolicyRefs } from "@/lib/policyRefResolver";
import { KI_TOOL_KEY, KI_LS_KEY, type KiGovernanceState } from "@/lib/kiGovernance";
import { KI_DOC_IDS, registerAnhang, systemeFuerDokument } from "@/lib/kiRegister";
import { FRAMEWORK_FILTERS, templateMatchesFramework, templateVisibleFor, filterSourcesForActive, activeFilterKeysFor } from "@/lib/policyFrameworkFilter";
import type { PolicyClause } from "@/data/policyClauseTemplates";
import { generatePolicyPDF, generatePolicyWord, generatePolicyExcel, type PolicyData } from "@/lib/policyReportGenerator";
import { exportPolicyOverviewXlsx } from "@/lib/policyReportXlsx";
import { generateClausePolicyWord } from "@/lib/policyClauseExporter";
import { generateClausePolicyPDF } from "@/lib/policyClauseExporterPdf";
import { generatePolicyOverviewPDF, generatePolicyOverviewWord } from "@/lib/policyOverviewReport";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Info, FileDown, File, FileText, Search, Filter, CheckCircle2, AlertCircle, MinusCircle, BookOpen, Plus, Check, X, Pencil, GraduationCap } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { FolderArchive, Link2, Unlink } from "lucide-react";
import {
  type LifecycleState, LIFECYCLE_DEFAULT, DOC_TOOL_KEY, DOC_LS_KEY,
  docHealth, DOC_HEALTH_LABEL, policyStatusFromDoc, suggestDocForTitle,
} from "@/lib/tools/toolLinks";

// ── Types ──
interface PolicyState {
  /**
   * Verknüpftes Nachweis-Dokument aus dem Dokumenten-Lebenszyklus (Blob
   * `document-lifecycle`). Ist es gesetzt, wird `implementationStatus` aus dem
   * Dokument ABGELEITET (gültig → umgesetzt, überfällig/Entwurf → teilweise,
   * archiviert/gelöscht → gespeicherter Status). Optional → alte Blobs laden.
   */
  documentId?: string;
  scope: string;
  policyOwner: string;
  responsibleRoles: string;
  approvalAuthority: string;
  purpose: string;
  purposeEn: string;
  rules: string[];
  rulesEn: string[];
  implementationStatus: "draft" | "not_implemented" | "partially_implemented" | "implemented" | "entbehrlich";
  reviewFrequency: string;
  lastReviewDate: string;
  nextReviewDate: string;
  exceptions: string;
  systemsUsed: string;
  version: string;
  creationDate: string;
  lastUpdated: string;
  effectiveDate: string;
  selectedClauses: string[];
  clauseEdits: Record<string, { description?: string; descriptionEn?: string }>;
}

type AllPoliciesState = Record<string, PolicyState>;

function makeDefault(t: PolicyTemplate): PolicyState {
  const today = new Date().toISOString().slice(0, 10);
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return {
    scope: "Gesamte Organisation, alle Mitarbeitenden, Auftragnehmer und Systeme im Geltungsbereich des ISMS / Entire organisation, all employees, contractors and systems within the ISMS scope",
    policyOwner: "CISO / Information Security Officer",
    responsibleRoles: "CISO, IT-Leitung, Datenschutzbeauftragte/r / CISO, Head of IT, Data Protection Officer",
    approvalAuthority: "Geschäftsführung / Executive Management",
    purpose: t.purpose,
    purposeEn: t.purposeEn,
    rules: [...t.defaultRules],
    rulesEn: [...t.defaultRulesEn],
    // Kaynaklierte Best-Practice-Klauseln (ISO/NIS2/BSI/NIST) standardmäßig
    // ausgewählt — sonst wirkt die Richtlinie „dünn" (nur 3 Default-Regeln),
    // obwohl 16–30 belegte Klauseln je Richtlinie vorhanden sind.
    selectedClauses: (CLAUSE_TEMPLATES[t.id] ?? []).map(c => c.id),
    implementationStatus: "draft",
    reviewFrequency: "Jährlich / Annually",
    lastReviewDate: "",
    nextReviewDate: nextYear,
    exceptions: "",
    systemsUsed: "",
    version: "1.0",
    creationDate: today,
    lastUpdated: today,
    effectiveDate: today,
    clauseEdits: {},
  };
}

function initAll(): AllPoliciesState {
  const s: AllPoliciesState = {};
  POLICY_TEMPLATES.forEach(t => { s[t.id] = makeDefault(t); });
  return s;
}

// ── Info Tip ──
const InfoTip = ({ text }: { text: string }) => (
  <Popover>
    <PopoverTrigger asChild>
      <span role="button" tabIndex={0} onPointerDown={(e) => e.stopPropagation()} className="inline-flex ml-1 text-primary/60 hover:text-primary" onClick={e => e.stopPropagation()}>
        <Info className="h-3.5 w-3.5" />
      </span>
    </PopoverTrigger>
    <PopoverContent side="top" className="max-w-[280px] text-xs p-3">
      {text}
    </PopoverContent>
  </Popover>
);

// ── Status badge ──
const StatusBadge = ({ status, de }: { status: string; de: boolean }) => {
  if (status === "implemented") return <Badge className="st-ja-tint st-ja-text st-ja-border text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />{de ? "Umgesetzt" : "Implemented"}</Badge>;
  if (status === "partially_implemented") return <Badge className="st-teilweise-tint st-teilweise-text st-teilweise-border text-[10px]"><MinusCircle className="h-3 w-3 mr-1" />{de ? "Teilweise" : "Partial"}</Badge>;
  if (status === "not_implemented") return <Badge className="st-nein-tint st-nein-text st-nein-border text-[10px]"><AlertCircle className="h-3 w-3 mr-1" />{de ? "Nicht umgesetzt" : "Not Implemented"}</Badge>;
  if (status === "entbehrlich") return <Badge className="bg-slate-400/15 text-slate-600 border-slate-300 text-[10px]"><MinusCircle className="h-3 w-3 mr-1" />{de ? "Entbehrlich" : "Not Applicable"}</Badge>;
  return <Badge className="bg-slate-500/15 text-slate-700 border-slate-200 text-[10px]">{de ? "Entwurf" : "Draft"}</Badge>;
};

const normalizeFilterText = (value: string) =>
  value
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const matchesFilterText = (haystack: string, query: string) => {
  const text = normalizeFilterText(haystack);
  const q = normalizeFilterText(query.trim());
  if (!q) return true;
  if (q.length <= 2) {
    return text
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .some(token => token.startsWith(q));
  }
  return text.includes(q);
};

// ── Framework-Filter: Zuordnung aus der Dokument-Matrix, Quellen-Erkennung mit Wortgrenzen ──
// (ausgelagert nach lib/policyFrameworkFilter.ts, dort begründet und getestet)

/** CWS-Kernregel: Quellenangaben nur für AKTIV gewählte Frameworks zeigen.
 *  Generische Referenzen (keinem Framework zuordenbar) bleiben sichtbar.
 *  Ohne Auswahl: alle Quellen. */
function visibleSources(sources: string[] | undefined): string[] {
  return filterSourcesForActive(sources, activeFilterKeysFor(getActiveFrameworkKeys()));
}


const ClauseCard = ({ clause, selected, onToggle, expanded, onToggleExpand, de, editedText, onEditText }: {
  clause: PolicyClause;
  selected: boolean;
  onToggle: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  de: boolean;
  editedText?: { description?: string; descriptionEn?: string };
  onEditText: (field: "description" | "descriptionEn", value: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  // Interne Verweise („… Meldefristen nach p31.") beim Anzeigen auflösen —
  // der Katalogtext bleibt unverändert, nur die Darstellung wird lesbar.
  const displayDesc = resolvePolicyRefs(de
    ? (editedText?.description || clause.description)
    : (editedText?.descriptionEn || clause.descriptionEn), de);

  return (
    <div className={`rounded-lg border transition-all ${selected ? "border-primary/40 bg-primary/5" : "border-border/60 bg-card"}`}>
      <div className="flex items-start gap-3 p-3">
        <Checkbox checked={selected} onCheckedChange={onToggle} className="mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <button onClick={onToggleExpand} className="text-left w-full group">
            <div className="flex items-center gap-2">
              {expanded ? <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
              <span className="text-xs font-semibold text-card-foreground group-hover:text-primary transition-colors">
                {de ? clause.title : clause.titleEn}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 ml-5 line-clamp-2">
              {displayDesc.slice(0, 120)}...
            </p>
          </button>

          {expanded && (
            <div className="mt-3 ml-5 space-y-3">
              {/* Full Description — editable */}
              <div className="bg-muted/40 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {de ? "Beschreibung" : "Description"}
                  </div>
                  <button
                    onClick={() => setEditing(!editing)}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                  >
                    <Pencil className="h-3 w-3" />
                    {editing ? (de ? "Fertig" : "Done") : (de ? "Bearbeiten" : "Edit")}
                  </button>
                </div>
                {editing ? (
                  <Textarea
                    value={displayDesc}
                    onChange={e => onEditText(de ? "description" : "descriptionEn", e.target.value)}
                    className="text-xs min-h-[80px]"
                  />
                ) : (
                  <p className="text-xs text-foreground/80 leading-relaxed">{displayDesc}</p>
                )}
              </div>

              {/* Why is this needed? */}
              <div className="st-teilweise-tint border st-teilweise-border rounded-lg p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider st-teilweise-text mb-1 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {de ? "Warum ist das nötig?" : "Why is this needed?"}
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {resolvePolicyRefs(de ? clause.reason : clause.reasonEn, de)}
                </p>
              </div>

              {/* When is this required? */}
              <div className="bg-primary/5 border border-primary/15 rounded-lg p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {de ? "Wann wird das benötigt?" : "When is this required?"}
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {resolvePolicyRefs(de ? clause.whenRequired : clause.whenRequiredEn, de)}
                </p>
              </div>

              {/* Sources — nur aktive Frameworks (CWS-Kernregel) */}
              {visibleSources(clause.sources).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {visibleSources(clause.sources).map(s => (
                    <span key={s} className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono">{s}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {selected && (
          <Badge className="bg-primary/15 text-primary border-primary/20 text-[9px] flex-shrink-0">
            <Check className="h-2.5 w-2.5 mr-0.5" />{de ? "Gewählt" : "Selected"}
          </Badge>
        )}
      </div>
    </div>
  );
};

// ── Export Options Dialog ──
interface ExportOptionsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onExport: (options: ExportOptions) => void;
  de: boolean;
  loading: boolean;
}

export interface ExportOptions {
  includeRationale: boolean;
  includeSources: boolean;
  includeApplicability: boolean;
  includeSectionHeaders: boolean;
  format: "word" | "pdf";
  /** Vorbefüllte Angaben (KI-Register) — wird beim Export gesetzt, nicht im Dialog. */
  anhang?: import("@/lib/policyClauseExporter").ExportAnhang;
}

const ExportOptionsDialog = ({ open, onOpenChange, onExport, de, loading }: ExportOptionsDialogProps) => {
  const [includeRationale, setIncludeRationale] = useState(true);
  const [includeSources, setIncludeSources] = useState(true);
  const [includeApplicability, setIncludeApplicability] = useState(true);
  const [includeSectionHeaders, setIncludeSectionHeaders] = useState(true);
  const [format, setFormat] = useState<"word" | "pdf">("word");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{de ? "Export-Optionen" : "Export Options"}</DialogTitle>
          <DialogDescription>
            {de
              ? "Wählen Sie Format und Optionen für den Export."
              : "Choose format and options for the export."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Format selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">{de ? "Format" : "Format"}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={format === "word" ? "default" : "outline"}
                size="sm"
                onClick={() => setFormat("word")}
                className="gap-1.5 flex-1"
              >
                <File className="h-3.5 w-3.5" />
                Word (.docx)
              </Button>
              <Button
                type="button"
                variant={format === "pdf" ? "default" : "outline"}
                size="sm"
                onClick={() => setFormat("pdf")}
                className="gap-1.5 flex-1"
              >
                <FileText className="h-3.5 w-3.5" />
                PDF
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sectionHeaders" className="text-sm cursor-pointer">
              {de ? "Abschnittsüberschriften (Beschreibung, Begründung...)" : "Section Headers (Description, Rationale...)"}
            </Label>
            <Switch id="sectionHeaders" checked={includeSectionHeaders} onCheckedChange={setIncludeSectionHeaders} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="rationale" className="text-sm cursor-pointer">
              {de ? "Begründung (Warum?)" : "Rationale (Why?)"}
            </Label>
            <Switch id="rationale" checked={includeRationale} onCheckedChange={setIncludeRationale} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="applicability" className="text-sm cursor-pointer">
              {de ? "Anwendbarkeit (Wann?)" : "Applicability (When?)"}
            </Label>
            <Switch id="applicability" checked={includeApplicability} onCheckedChange={setIncludeApplicability} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sources" className="text-sm cursor-pointer">
              {(() => {
                const _ak = getActiveFrameworkKeys();
                const parts = ([
                  ["ISO27001", "ISO"], ["NIS2", "NIS2"], ["DORA", "DORA"],
                  ["BSI_ITGS", "BSI"], ["GDPR", de ? "DSGVO" : "GDPR"],
                  ["AIACT", de ? "KI-VO" : "AI Act"], ["ISO42001", "ISO 42001"],
                ] as Array<[string, string]>).filter(([k]) => _ak.includes(k)).map(([, l]) => l);
                return de ? `Quellen (${parts.join(", ")}…)` : `Sources (${parts.join(", ")}…)`;
              })()}
            </Label>
            <Switch id="sources" checked={includeSources} onCheckedChange={setIncludeSources} />
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            {!includeSectionHeaders && !includeRationale && !includeSources && !includeApplicability
              ? (de ? "⚡ Nur reiner Regelungstext — ohne Überschriften, maximale Klarheit." : "⚡ Pure clause text only — no headers, maximum clarity.")
              : !includeRationale && !includeSources && !includeApplicability
              ? (de ? "⚡ Nur Regelungstext wird exportiert — schlankes Dokument." : "⚡ Only clause text will be exported — lean document.")
              : (de ? "📄 Vollständiger Export mit gewählten Detailebenen." : "📄 Full export with selected detail levels.")}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{de ? "Abbrechen" : "Cancel"}</Button>
          <Button onClick={() => onExport({ includeRationale, includeSources, includeApplicability, includeSectionHeaders, format })} disabled={loading} className="gap-2">
            {format === "pdf" ? <FileText className="h-4 w-4" /> : <File className="h-4 w-4" />}
            {de ? "Exportieren" : "Export"} ({format === "pdf" ? "PDF" : "Word"})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Main ──
const Policies = () => {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { user, getTenantId, isStudent, isAdmin, isLecturer, viewAsUserId } = useAuth();
  // Student quota: each student may export UP TO TWO distinct Richtlinien.
  // Choices are persisted in `student_policy_downloads` (one row per export).
  // Lecturers/admins are unlimited; lecturer-impersonation inherits the
  // student's limit so the UX matches.
  const STUDENT_POLICY_QUOTA = 2;
  const studentLimited = (isStudent && !isAdmin && !isLecturer) || !!viewAsUserId;
  const [studentChosenPolicies, setStudentChosenPolicies] = useState<
    { policy_id: string; downloaded_at: string | null }[]
  >([]);
  useEffect(() => {
    if (!user || !studentLimited) return;
    let cancelled = false;
    (async () => {
      const { data: rows } = await supabase
        .from("student_policy_downloads")
        .select("policy_id, downloaded_at")
        .eq("student_user_id", user.id)
        .order("downloaded_at", { ascending: true });
      if (cancelled) return;
      if (rows) {
        setStudentChosenPolicies(
          rows.map(r => ({ policy_id: r.policy_id, downloaded_at: r.downloaded_at ?? null })),
        );
      }
    })();
    return () => { cancelled = true; };
  }, [user, studentLimited]);

  const studentChosenIds = useMemo(
    () => studentChosenPolicies.map(r => r.policy_id),
    [studentChosenPolicies],
  );
  const studentQuotaUsed = studentChosenIds.length;
  const studentQuotaFull = studentQuotaUsed >= STUDENT_POLICY_QUOTA;

  const persistStudentChoice = useCallback(async (
    policyId: string,
    policyTitle: string,
    format: "pdf" | "word",
  ) => {
    if (!user) return;
    // Don't double-count the same policy if re-exported.
    if (studentChosenIds.includes(policyId)) return;
    const usedAt = new Date().toISOString();
    // Kontingent in der Sitzung immer zählen — auch wenn (ohne Organisation)
    // nicht gespeichert werden kann; vorher blieb es dann unbegrenzt.
    setStudentChosenPolicies(prev => [...prev, { policy_id: policyId, downloaded_at: usedAt }]);
    const { data: orgId } = await supabase.rpc("get_user_org_id", { _user_id: user.id });
    if (!orgId) return;
    await supabase
      .from("student_policy_downloads")
      .insert({
        student_user_id: user.id,
        org_id: orgId as string,
        policy_id: policyId,
        policy_title: policyTitle,
        format,
        downloaded_at: usedAt,
      });
  }, [user, studentChosenIds]);



  const { data, setData, loading, lastSaved, saveToCloud, resetData } = useToolData<AllPoliciesState>(
    "policies",
    "nis2-policies",
    initAll()
  );
  // KI-Systemregister (nur lesend): KI-Dokumente werden beim Export mit den
  // Systemangaben aus dem Register vorbefüllt.
  const { data: kiData } = useToolData<KiGovernanceState>(KI_TOOL_KEY, KI_LS_KEY, { systeme: [] });
  const kiSysteme = kiData?.systeme ?? [];
  const kiAnzahl = useCallback((policyId: string) =>
    (KI_DOC_IDS as readonly string[]).includes(policyId) ? systemeFuerDokument(kiSysteme, policyId).length : 0, [kiSysteme]);
  // Dokumenten-Lebenszyklus (nur lesend): Nachweis-Dokumente für Richtlinien.
  const { data: docData } = useToolData<LifecycleState>(DOC_TOOL_KEY, DOC_LS_KEY, LIFECYCLE_DEFAULT);
  const lifecycleDocs = useMemo(() => (docData?.docs ?? []).filter(d => !!d.name), [docData]);
  const docById = useMemo(() => new Map(lifecycleDocs.map(d => [d.id, d] as const)), [lifecycleDocs]);

  const [expandedPolicies, setExpandedPolicies] = useState<Set<string>>(new Set());
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [frameworkFilter, setFrameworkFilter] = useState<string>("all");
  const { active: activeFrameworks } = useFramework();
  const activeFrameworkKeys = useMemo(() => new Set(activeFrameworks.map(f => f.key)), [activeFrameworks]);
  // CWS-Kernregel: nur Richtlinien der AKTIV gewählten Frameworks zeigen.
  // FrameworkKey → Filter-Schlüssel (BSI_ITGS → BSI usw.); KI_SEC & Co. ohne
  // eigene Zuordnung werden ignoriert statt alles sichtbar zu machen.
  const activeFilterKeys = useMemo(() => activeFilterKeysFor(activeFrameworks.map(f => f.key as string)), [activeFrameworks]);
  const isFrameworkActive = useCallback((k: string) => activeFilterKeys.has(k), [activeFilterKeys]);

  // Sichtbar wenn: kein Framework gewählt (zeige alles) ODER Vorlage gehört laut
  // Dokument-Matrix zu einem aktiven Framework ODER ist framework-neutral.
  const templateFrameworkVisible = useCallback(
    (tid: string) => templateVisibleFor(tid, CLAUSE_TEMPLATES[tid] || [], activeFilterKeys),
    [activeFilterKeys],
  );
  // Kennzahlen, Berichte und Ausschlussliste über DIESELBE Menge wie die Liste:
  // vorher zählten sie alle 152 Vorlagen (auch DORA/KRITIS/CRA bei einem
  // NIS2-Mandanten) — Umsetzungsgrad und Berichte passten nicht zur Anzeige.
  const visibleTemplates = useMemo(
    () => POLICY_TEMPLATES.filter(t => templateFrameworkVisible(t.id)),
    [templateFrameworkVisible],
  );
  const hiddenTemplateIds = useMemo(
    () => POLICY_TEMPLATES.filter(t => !templateFrameworkVisible(t.id)).map(t => t.id),
    [templateFrameworkVisible],
  );

  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [clauseExportLoading, setClauseExportLoading] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [pendingExportPolicyId, setPendingExportPolicyId] = useState<string | null>(null);
  const [overviewDialogOpen, setOverviewDialogOpen] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Ensure all policies exist in state
  const policies = useMemo(() => {
    const base = initAll();
    const merged: AllPoliciesState = {};
    for (const key of Object.keys(base)) {
      merged[key] = {
        ...base[key],
        ...data[key],
        // Ohne gespeicherte Auswahl standardmäßig ALLE belegten Klauseln zeigen
        // (sonst wirkt die Richtlinie „dünn"). Eine bewusste, nicht-leere Auswahl
        // des Nutzers bleibt erhalten.
        selectedClauses: (data[key]?.selectedClauses && data[key].selectedClauses.length)
          ? data[key].selectedClauses
          : (CLAUSE_TEMPLATES[key] ?? []).map((c: any) => c.id),
        clauseEdits: data[key]?.clauseEdits || {},
        effectiveDate: data[key]?.effectiveDate || "",
      };
      // Status-Ableitung aus dem verknüpften Nachweis-Dokument (Werkzeug-Brücke).
      // „Entbehrlich" bleibt eine bewusste Entscheidung und wird nicht überschrieben.
      const docId = merged[key].documentId;
      if (docId && merged[key].implementationStatus !== "entbehrlich") {
        const derived = policyStatusFromDoc(docById.get(docId));
        if (derived) merged[key] = { ...merged[key], implementationStatus: derived };
      }
    }
    return merged;
  }, [data, docById]);

  /** Dokument-Vorschlag je Richtlinie (Titel-Overlap ≥ 2 Stichwörter), nur ohne bestehende Verknüpfung. */
  const linkedDocIds = useMemo(() => new Set(Object.values(data).map(p => p?.documentId).filter(Boolean) as string[]), [data]);
  const docSuggestionFor = useCallback((t: PolicyTemplate) => {
    if (data[t.id]?.documentId) return null;
    return suggestDocForTitle([t.name, t.nameEn], lifecycleDocs, linkedDocIds);
  }, [data, lifecycleDocs, linkedDocIds]);

  const togglePolicy = (id: string) => {
    setExpandedPolicies(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleClauseExpand = (id: string) => {
    setExpandedClauses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const updateField = useCallback((policyId: string, field: keyof PolicyState, value: any) => {
    setData(prev => ({ ...prev, [policyId]: { ...prev[policyId], [field]: value } as PolicyState }));
  }, [setData]);

  const updateClauseEdit = useCallback((policyId: string, clauseId: string, field: "description" | "descriptionEn", value: string) => {
    setData(prev => {
      const p = { ...prev[policyId] };
      const edits = { ...(p.clauseEdits || {}) };
      edits[clauseId] = { ...(edits[clauseId] || {}), [field]: value };
      return { ...prev, [policyId]: { ...p, clauseEdits: edits } };
    });
  }, [setData]);

  const toggleClauseSelection = useCallback((policyId: string, clauseId: string) => {
    setData(prev => {
      const p = { ...prev[policyId] };
      const selected = p.selectedClauses || [];
      const next = selected.includes(clauseId)
        ? selected.filter(c => c !== clauseId)
        : [...selected, clauseId];
      return { ...prev, [policyId]: { ...p, selectedClauses: next } };
    });
  }, [setData]);

  const selectAllClauses = useCallback((policyId: string) => {
    const clauses = CLAUSE_TEMPLATES[policyId] || [];
    setData(prev => ({
      ...prev,
      [policyId]: { ...prev[policyId], selectedClauses: clauses.map(c => c.id) },
    }));
  }, [setData]);

  const deselectAllClauses = useCallback((policyId: string) => {
    setData(prev => ({
      ...prev,
      [policyId]: { ...prev[policyId], selectedClauses: [] },
    }));
  }, [setData]);

  const updateRule = useCallback((policyId: string, idx: number, value: string, isEn: boolean) => {
    setData(prev => {
      const p = { ...prev[policyId] };
      const key = isEn ? "rulesEn" : "rules";
      const arr = [...p[key]];
      arr[idx] = value;
      return { ...prev, [policyId]: { ...p, [key]: arr } };
    });
  }, [setData]);

  const addRule = useCallback((policyId: string) => {
    setData(prev => {
      const p = { ...prev[policyId] };
      return { ...prev, [policyId]: { ...p, rules: [...p.rules, ""], rulesEn: [...p.rulesEn, ""] } };
    });
  }, [setData]);

  const removeRule = useCallback((policyId: string, idx: number) => {
    setData(prev => {
      const p = { ...prev[policyId] };
      return { ...prev, [policyId]: { ...p, rules: p.rules.filter((_, i) => i !== idx), rulesEn: p.rulesEn.filter((_, i) => i !== idx) } };
    });
  }, [setData]);

  // Filter
  const filteredTemplates = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return POLICY_TEMPLATES.filter(t => {
      if (q) {
        const haystack = [
          t.id,
          de ? t.name : t.nameEn,
          de ? t.category : t.categoryEn,
          de ? t.description : t.descriptionEn,
          de ? t.purpose : t.purposeEn,
        ].join(" ").toLowerCase();
        if (!matchesFilterText(haystack, q)) return false;
      }
      if (categoryFilter !== "all") {
        const catMatch = de ? t.category : t.categoryEn;
        if (catMatch !== categoryFilter) return false;
      }
      if (statusFilter !== "all") {
        if (policies[t.id]?.implementationStatus !== statusFilter) return false;
      }
      // CWS-Kernregel: nur Richtlinien aktiver Frameworks (immer, nicht nur bei Chip-Klick)
      if (!templateFrameworkVisible(t.id)) return false;
      if (frameworkFilter !== "all") {
        const clauses = CLAUSE_TEMPLATES[t.id] || [];
        if (!templateMatchesFramework(t.id, clauses, frameworkFilter)) return false;
      }
      return true;
    });
  }, [searchTerm, categoryFilter, statusFilter, frameworkFilter, de, policies, templateFrameworkVisible]);

  // Framework chip counts (over category+status+search-filtered set, before FW filter)
  const frameworkCounts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const base = POLICY_TEMPLATES.filter(t => {
      if (q) {
        const haystack = [
          t.id,
          de ? t.name : t.nameEn,
          de ? t.category : t.categoryEn,
          de ? t.description : t.descriptionEn,
          de ? t.purpose : t.purposeEn,
        ].join(" ").toLowerCase();
        if (!matchesFilterText(haystack, q)) return false;
      }
      if (categoryFilter !== "all") {
        const catMatch = de ? t.category : t.categoryEn;
        if (catMatch !== categoryFilter) return false;
      }
      if (statusFilter !== "all") {
        if (policies[t.id]?.implementationStatus !== statusFilter) return false;
      }
      // „Alle" zählt nur, was nach der Kernregel überhaupt sichtbar ist.
      return templateFrameworkVisible(t.id);
    });
    const counts: Record<string, number> = { all: base.length };
    for (const fw of FRAMEWORK_FILTERS) {
      counts[fw.key] = base.filter(t => templateMatchesFramework(t.id, CLAUSE_TEMPLATES[t.id] || [], fw.key)).length;
    }
    return counts;
  }, [searchTerm, categoryFilter, statusFilter, de, policies, templateFrameworkVisible]);


  // Stats — entbehrlich is excluded from compliance denominator (like SoA NA)
  const stats = useMemo(() => {
    let impl = 0, partial = 0, notImpl = 0, entbehrlich = 0;
    visibleTemplates.forEach(t => {
      const p = policies[t.id];
      if (!p) { notImpl++; return; }
      if (p.implementationStatus === "entbehrlich") entbehrlich++;
      else if (p.implementationStatus === "implemented") impl++;
      else if (p.implementationStatus === "partially_implemented") partial++;
      else notImpl++;
    });
    const applicable = impl + partial + notImpl;
    return { impl, partial, notImpl, entbehrlich, applicable, total: visibleTemplates.length };
  }, [policies, visibleTemplates]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, PolicyTemplate[]>();
    filteredTemplates.forEach(t => {
      const cat = de ? t.category : t.categoryEn;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    });
    return Array.from(map.entries());
  }, [filteredTemplates, de]);

  // Export
  const buildExportData = useCallback((): PolicyData[] => {
    return visibleTemplates.map(t => {
      const p = policies[t.id] || makeDefault(t);
      return {
        id: t.id, name: t.name, nameEn: t.nameEn, category: t.category, categoryEn: t.categoryEn,
        purpose: p.purpose, purposeEn: p.purposeEn, scope: p.scope, policyOwner: p.policyOwner,
        responsibleRoles: p.responsibleRoles, approvalAuthority: p.approvalAuthority,
        rules: p.rules, rulesEn: p.rulesEn, implementationStatus: p.implementationStatus,
        reviewFrequency: p.reviewFrequency, lastReviewDate: p.lastReviewDate, nextReviewDate: p.nextReviewDate,
        exceptions: p.exceptions, systemsUsed: p.systemsUsed, version: p.version,
        creationDate: p.creationDate, lastUpdated: p.lastUpdated,
      };
    });
  }, [policies, visibleTemplates]);

  const [companyName, setCompanyName] = useState("");

  // Fetch company name from context (Step 1)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const tid = await getTenantId();
      if (!tid) return;
      const { data: profile } = await supabase.from("company_profiles").select("company_name").eq("user_id", tid)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (profile?.company_name) setCompanyName(profile.company_name);
    })();
  }, [user, getTenantId]);

  const handleExport = useCallback(async (format: "pdf" | "word" | "excel") => {
    if (studentLimited) {
      toast.error(de
        ? `Studierende dürfen maximal ${STUDENT_POLICY_QUOTA} einzelne Richtlinien exportieren — kein Sammelbericht. Bitte wählen Sie eine einzelne Richtlinie aus der Liste.`
        : `Students may only export up to ${STUDENT_POLICY_QUOTA} individual policies — no bundled report. Please pick a single policy from the list below.`);
      return;
    }

    setReportLoading(true);
    try {
      const data = buildExportData();
      if (format === "pdf") generatePolicyPDF(data, lang, companyName);
      else if (format === "excel") await generatePolicyExcel(data, lang, companyName);
      else await generatePolicyWord(data, lang, companyName);
      toast.success(de ? "Bericht exportiert" : "Report exported");
    } catch (e) { console.error(e); toast.error(de ? "Export fehlgeschlagen" : "Export failed"); }
    setReportLoading(false);
    setReportOpen(false);
  }, [buildExportData, lang, de, companyName]);

  const handleOverviewExport = useCallback(async (format: "pdf" | "word" | "excel", excluded: string[]) => {
    if (studentLimited) {
      toast.error(de
        ? `Studierende dürfen den Übersichtsbericht nicht exportieren — nur bis zu ${STUDENT_POLICY_QUOTA} einzelne Richtlinien.`
        : `Students cannot export the overview report — only up to ${STUDENT_POLICY_QUOTA} individual policies.`);
      return;
    }

    setOverviewLoading(true);
    try {
      const policyMap: Record<string, any> = {};
      for (const [k, v] of Object.entries(policies)) policyMap[k] = v;
      // Vorlagen nicht aktiver Frameworks gehören nicht in den Bericht.
      excluded = [...new Set([...excluded, ...hiddenTemplateIds])];
      if (format === "pdf") await generatePolicyOverviewPDF(policyMap, excluded, lang, companyName);
      else if (format === "excel") await exportPolicyOverviewXlsx(policyMap, excluded, lang, companyName);
      else await generatePolicyOverviewWord(policyMap, excluded, lang, companyName);
      toast.success(de ? "Bericht exportiert" : "Report exported");
      setOverviewDialogOpen(false);
    } catch (e) { console.error(e); toast.error(de ? "Export fehlgeschlagen" : "Export failed"); }
    setOverviewLoading(false);
  }, [policies, lang, de, companyName, hiddenTemplateIds]);

  const policyReportItems = useMemo(() => visibleTemplates.map(t => ({
    id: t.id,
    label: de ? t.name : t.nameEn,
    group: de ? t.category : t.categoryEn,
    meta: `${t.id} · ${(() => { const s = policies[t.id]?.implementationStatus; if (s === "implemented") return de ? "Umgesetzt" : "Implemented"; if (s === "partially_implemented") return de ? "Teilweise" : "Partial"; if (s === "entbehrlich") return de ? "Entbehrlich" : "Not Applicable"; return de ? "Nicht umgesetzt" : "Not implemented"; })()}`,
  })), [de, policies, visibleTemplates]);

  // Open export options dialog
  const openClauseExportDialog = useCallback((policyId: string) => {
    const p = policies[policyId];
    const clauses = CLAUSE_TEMPLATES[policyId] || [];
    if (!p) return;
    const selected = clauses.filter(c => (p.selectedClauses || []).includes(c.id));
    if (selected.length === 0) {
      toast.error(de ? "Bitte wählen Sie mindestens eine Regelung aus." : "Please select at least one clause.");
      return;
    }
    setPendingExportPolicyId(policyId);
    setExportDialogOpen(true);
  }, [policies, de]);

  const handleClauseExportWithOptions = useCallback(async (options: ExportOptions) => {
    if (
      studentLimited &&
      studentQuotaFull &&
      pendingExportPolicyId &&
      !studentChosenIds.includes(pendingExportPolicyId)
    ) {
      toast.error(de
        ? `Studierende dürfen maximal ${STUDENT_POLICY_QUOTA} Richtlinien exportieren. Sie haben bereits "${studentChosenIds.join('", "')}" gewählt.`
        : `Students may export at most ${STUDENT_POLICY_QUOTA} policies. You already chose "${studentChosenIds.join('", "')}".`);
      return;
    }

    if (!pendingExportPolicyId) return;
    const policyId = pendingExportPolicyId;
    const p = policies[policyId];
    const t = POLICY_TEMPLATES.find(tp => tp.id === policyId);
    const clauses = CLAUSE_TEMPLATES[policyId] || [];
    if (!t || !p) return;

    // Apply edits to clauses
    const selected = clauses
      .filter(c => (p.selectedClauses || []).includes(c.id))
      .map(c => {
        const edits = p.clauseEdits?.[c.id];
        if (!edits) return c;
        return {
          ...c,
          description: edits.description || c.description,
          descriptionEn: edits.descriptionEn || c.descriptionEn,
        };
      });

    // KI-Dokumente: Systemangaben aus dem KI-Register vor die Regelungen setzen.
    if ((KI_DOC_IDS as readonly string[]).includes(policyId)) {
      const anhang = registerAnhang(kiSysteme, policyId, de);
      if (anhang) options = { ...options, anhang };
    }

    setClauseExportLoading(true);
    try {
      if (options.format === "pdf") {
        generateClausePolicyPDF(t, p, selected, lang, companyName, options);
      } else {
        await generateClausePolicyWord(t, p, selected, lang, companyName, options);
      }
      if (studentLimited && pendingExportPolicyId) {
        const title = de ? t.name : (t.nameEn || t.name);
        await persistStudentChoice(pendingExportPolicyId, title, options.format);
      }
      toast.success(de ? "Richtlinie exportiert" : "Policy exported");
    } catch (e) { console.error(e); toast.error(de ? "Export fehlgeschlagen" : "Export failed"); }
    setClauseExportLoading(false);
    setExportDialogOpen(false);
    setPendingExportPolicyId(null);
  }, [pendingExportPolicyId, policies, lang, de, companyName, studentLimited, studentQuotaFull, studentChosenIds, persistStudentChoice, kiSysteme]);


  // ── Field Row ──
  const FieldRow = ({ label, tipDe, tipEn, children }: { label: string; tipDe: string; tipEn: string; children: React.ReactNode }) => (
    <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 items-start py-2 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-1 text-xs font-medium text-foreground/80">
        {label}
        <InfoTip text={de ? tipDe : tipEn} />
      </div>
      <div>{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 max-w-6xl space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground">
              {de ? "Richtlinien" : "Policies"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {de ? "Erstellen Sie Sicherheitsrichtlinien." : "Create security policies."}
            </p>
          </div>
        </div>

        <Tabs defaultValue="policies" className="w-full">
          <TabsList className="hidden">
            <TabsTrigger value="policies">Policies</TabsTrigger>
          </TabsList>


          <TabsContent value="policies" className="space-y-4">

        <ToolSaveBar loading={loading} lastSaved={lastSaved} onSave={saveToCloud} onReset={resetData} />

        {studentLimited && (
          <div className="st-teilweise-tint border st-teilweise-border rounded-xl p-3 text-xs text-foreground/90">
            <strong className="font-heading">
              {de
                ? `Studierenden-Quota: ${studentQuotaUsed}/${STUDENT_POLICY_QUOTA} Richtlinien`
                : `Student quota: ${studentQuotaUsed}/${STUDENT_POLICY_QUOTA} policies`}
            </strong>
            <span className="ml-2 text-muted-foreground">
              {studentChosenIds.length > 0
                ? (de
                    ? `Bereits exportiert: "${studentChosenIds.join('", "')}". ${studentQuotaFull ? "Weitere Exporte sind gesperrt." : `Noch ${STUDENT_POLICY_QUOTA - studentQuotaUsed} Auswahl frei.`}`
                    : `Already exported: "${studentChosenIds.join('", "')}". ${studentQuotaFull ? "Further exports are locked." : `${STUDENT_POLICY_QUOTA - studentQuotaUsed} slot(s) remaining.`}`)
                : (de
                    ? `Sie dürfen bis zu ${STUDENT_POLICY_QUOTA} Richtlinien als Word/PDF exportieren. Wählen Sie sorgfältig — jede Auswahl ist final.`
                    : `You may export up to ${STUDENT_POLICY_QUOTA} policies as Word/PDF. Choose carefully — each choice is final.`)}
            </span>
          </div>
        )}


        {/* Report bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-card border border-border rounded-xl p-3">
          <div className="text-xs text-foreground/80">
            <strong className="font-heading">{de ? "Übersichtsbericht" : "Overview Report"}</strong>
            <span className="text-muted-foreground ml-2">
              {de ? "Status, Reife und Abdeckung — mit Diagrammen und Tabellen." : "Status, maturity and coverage — with charts and tables."}
            </span>
          </div>
          <Button size="sm" onClick={() => setOverviewDialogOpen(true)} className="gap-1.5 h-8" disabled={overviewLoading}>
            <FileDown className="h-3.5 w-3.5" />
            {de ? "Bericht erstellen" : "Generate report"}
          </Button>
        </div>

        {/* Organisation Name */}
        <div className="bg-card border border-border rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-medium text-foreground/80 min-w-[140px]">
            {de ? "Organisationsname" : "Organisation Name"}
            <InfoTip text={de
              ? "Wird automatisch aus Schritt 1 (Kontext) übernommen. Sie können den Namen hier für die Richtlinien anpassen."
              : "Automatically loaded from Step 1 (Context). You can customize the name here for policies."
            } />
          </div>
          <Input
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder={de ? "z.B. Musterbehörde / Muster GmbH" : "e.g. Example Agency / Example Inc."}
            className="text-xs h-8 flex-1"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: de ? "Gesamt" : "Total", value: stats.total, color: "bg-primary/10 text-primary" },
            { label: de ? "Umgesetzt" : "Implemented", value: stats.impl, color: "st-ja-tint st-ja-text" },
            { label: de ? "Teilweise" : "Partial", value: stats.partial, color: "st-teilweise-tint st-teilweise-text" },
            { label: de ? "Nicht umgesetzt" : "Not Impl.", value: stats.notImpl, color: "st-nein-tint st-nein-text" },
            { label: de ? "Entbehrlich" : "Not Applicable", value: stats.entbehrlich, color: "bg-slate-400/10 text-slate-600" },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[10px] font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Werkzeug-Brücke: Nachweis-Dokumente */}
        {(() => {
          const linked = POLICY_TEMPLATES.filter(t => !!data[t.id]?.documentId).length;
          const suggested = POLICY_TEMPLATES.filter(t => !!docSuggestionFor(t)).length;
          return (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground bg-card border border-border rounded-xl px-3 py-2">
              <FolderArchive className="h-3.5 w-3.5 text-primary" />
              <span>
                {de
                  ? `${linked} Richtlinie(n) mit Nachweis-Dokument verknüpft (Status abgeleitet) · ${lifecycleDocs.length} Dokument(e) im Dokumenten-Lebenszyklus`
                  : `${linked} policy(ies) linked to an evidence document (status derived) · ${lifecycleDocs.length} document(s) in the Document Lifecycle`}
              </span>
              {suggested > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">
                  <Link2 className="h-3 w-3" />{de ? `${suggested} Verknüpfungsvorschlag/-vorschläge` : `${suggested} link suggestion(s)`}
                </span>
              )}
              <Link to="/documents" className="ml-auto text-primary hover:underline">{de ? "Dokumenten-Werkzeug öffnen" : "Open document tool"}</Link>
            </div>
          );
        })()}

        {/* Charts: Pie + Radar */}
        <PolicyCharts policies={policies} templates={visibleTemplates} />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={de ? "Richtlinie suchen..." : "Search policies..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 h-9 text-sm" />
            {searchTerm.trim().length > 0 && searchTerm.trim().length <= 2 && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {de ? "Kurze Suchbegriffe matchen nur Wort-/Code-Anfänge." : "Short terms only match word/code starts."}
              </p>
            )}
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-9"><Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{de ? "Alle Kategorien" : "All Categories"}</SelectItem>
              {POLICY_CATEGORIES.map(c => <SelectItem key={c.en} value={de ? c.de : c.en}>{de ? c.de : c.en}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{de ? "Alle Status" : "All Status"}</SelectItem>
              <SelectItem value="draft">{de ? "Entwurf" : "Draft"}</SelectItem>
              <SelectItem value="implemented">{de ? "Umgesetzt" : "Implemented"}</SelectItem>
              <SelectItem value="partially_implemented">{de ? "Teilweise" : "Partial"}</SelectItem>
              <SelectItem value="not_implemented">{de ? "Nicht umgesetzt" : "Not Implemented"}</SelectItem>
              <SelectItem value="entbehrlich">{de ? "Entbehrlich" : "Not Applicable"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Framework-Filter chips — Richtlinien die den gewaehlten Rahmen adressieren */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground mr-1 inline-flex items-center gap-1">
            <Filter className="h-3 w-3" />
            {de ? "Framework:" : "Framework:"}
          </span>
          <button
            type="button"
            onClick={() => setFrameworkFilter("all")}
            className={
              "text-[11px] px-2 py-0.5 rounded-full border transition-colors " +
              (frameworkFilter === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-foreground/80 border-border hover:bg-muted")
            }
          >
            {de ? "Alle" : "All"} <span className="opacity-70">({frameworkCounts.all ?? 0})</span>
          </button>
          {FRAMEWORK_FILTERS.filter(fw => (frameworkCounts[fw.key] ?? 0) > 0 && isFrameworkActive(fw.key)).map(fw => {
            const active = frameworkFilter === fw.key;
            return (
              <button
                key={fw.key}
                type="button"
                onClick={() => setFrameworkFilter(active ? "all" : fw.key)}
                className={
                  "text-[11px] px-2 py-0.5 rounded-full border transition-colors " +
                  (active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-foreground/80 border-border hover:bg-muted")
                }
              >
                {fw.label} <span className="opacity-70">({frameworkCounts[fw.key]})</span>
              </button>
            );
          })}
        </div>


        <div className="space-y-4">
          {grouped.map(([catName, templates]) => (
            <div key={catName}>
              <h2 className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-2 flex items-center gap-2">
                <div className="h-1 w-4 rounded-full bg-primary" />
                {catName}
                <span className="text-[10px] font-normal text-muted-foreground">({templates.length})</span>
              </h2>
              <div className="space-y-2">
                {templates.map(t => {
                  const p = policies[t.id] || makeDefault(t);
                  const isExpanded = expandedPolicies.has(t.id);
                  
                  const clauses = CLAUSE_TEMPLATES[t.id] || [];
                  const hasClauses = clauses.length > 0;
                  const selectedCount = (p.selectedClauses || []).length;

                  return (
                    <div key={t.id} className="bg-card border border-border rounded-xl overflow-hidden">
                      {/* Header */}
                      <button
                        onClick={() => togglePolicy(t.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors text-left"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-card-foreground truncate block">{de ? t.name : t.nameEn}</span>
                          <span className="text-[10px] text-muted-foreground">{de ? t.description : t.descriptionEn}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {hasClauses && selectedCount > 0 && (
                            <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">
                              {selectedCount}/{clauses.length}
                            </Badge>
                          )}
                          {p.documentId && (() => {
                            const d = docById.get(p.documentId!);
                            return (
                              <Badge variant="outline" className={`text-[9px] gap-1 ${d ? "border-primary/30 text-primary" : "border-destructive/40 text-destructive"}`} title={d ? d.name : (de ? "Verknüpftes Dokument nicht mehr vorhanden" : "Linked document no longer exists")}>
                                <FolderArchive className="h-3 w-3" />
                                {d ? (de ? "Dokument" : "Document") : (de ? "Dokument fehlt" : "Doc missing")}
                              </Badge>
                            );
                          })()}

                          <StatusBadge status={p.implementationStatus} de={de} />
                        </div>
                      </button>

                      {/* Expanded form */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-border/40 space-y-1">
                          {/* Basic Info */}
                          <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{de ? "Grundinfo" : "Basic Info"}</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 text-xs">
                              <div><span className="text-muted-foreground">{de ? "Name" : "Name"}:</span> <span className="font-medium">{de ? t.name : t.nameEn}</span></div>
                              <div><span className="text-muted-foreground">{de ? "Kategorie" : "Category"}:</span> <span className="font-medium">{de ? t.category : t.categoryEn}</span></div>
                            </div>
                          </div>

                          {/* Purpose */}
                          <FieldRow label={de ? "Zweck" : "Purpose"} tipDe="Der Zweck beschreibt, warum diese Richtlinie existiert." tipEn="The purpose explains why this policy exists.">
                            <Textarea value={de ? p.purpose : p.purposeEn} onChange={e => updateField(t.id, de ? "purpose" : "purposeEn", e.target.value)} className="text-xs min-h-[50px]" />
                          </FieldRow>

                          {/* Scope */}
                          <FieldRow label={de ? "Geltungsbereich" : "Scope"} tipDe="Legen Sie fest, welche Systeme, Abteilungen oder Standorte betroffen sind." tipEn="Specify which systems, departments, users, or locations are covered.">
                            <Input value={p.scope} onChange={e => updateField(t.id, "scope", e.target.value)} placeholder={de ? "z.B. Alle IT-Systeme und Standorte" : "e.g. All IT systems and locations"} className="text-xs h-8" />
                          </FieldRow>

                          {/* Roles */}
                          <FieldRow label={de ? "Richtlinienverantwortlicher" : "Policy Owner"} tipDe="Wer ist für die Pflege dieser Richtlinie verantwortlich?" tipEn="Who is responsible for maintaining this policy?">
                            <Input value={p.policyOwner} onChange={e => updateField(t.id, "policyOwner", e.target.value)} placeholder={de ? "z.B. CISO" : "e.g. CISO"} className="text-xs h-8" />
                          </FieldRow>
                          <FieldRow label={de ? "Verantwortliche Rollen" : "Responsible Roles"} tipDe="Wer muss diese Richtlinie befolgen und umsetzen?" tipEn="Who must follow and implement this policy?">
                            <Input value={p.responsibleRoles} onChange={e => updateField(t.id, "responsibleRoles", e.target.value)} placeholder={de ? "z.B. IT-Abteilung, alle Mitarbeiter" : "e.g. IT department, all employees"} className="text-xs h-8" />
                          </FieldRow>
                          <FieldRow label={de ? "Genehmigungsbehörde" : "Approval Authority"} tipDe="Wer genehmigt diese Richtlinie offiziell?" tipEn="Who officially approves this policy?">
                            <Input value={p.approvalAuthority} onChange={e => updateField(t.id, "approvalAuthority", e.target.value)} placeholder={de ? "z.B. Geschäftsführung" : "e.g. Executive Management"} className="text-xs h-8" />
                          </FieldRow>

                          {/* ═══ BEST PRACTICE CLAUSES ═══ */}
                          {hasClauses && (
                            <div className="py-3 border-b border-border/40">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="eu-gradient p-1.5 rounded-lg">
                                    <BookOpen className="h-3.5 w-3.5 text-primary-foreground" />
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-card-foreground">
                                      {de ? "Empfohlene Regelungen" : "Recommended Clauses"}
                                    </span>
                                    <InfoTip text={(() => {
                                      const srcParts = [
                                        isFrameworkActive("ISO27001") && "ISO 27001/27002",
                                        isFrameworkActive("BSI") && "BSI IT-Grundschutz",
                                        isFrameworkActive("NIST") && "NIST CSF",
                                        isFrameworkActive("NIS2") && "NIS2",
                                        isFrameworkActive("DORA") && "DORA",
                                        isFrameworkActive("GDPR") && (de ? "DSGVO" : "GDPR"),
                                        isFrameworkActive("AIACT") && (de ? "KI-Verordnung" : "AI Act"),
                                        isFrameworkActive("ISO42001") && "ISO/IEC 42001",
                                      ].filter(Boolean);
                                      const src = (srcParts.length ? srcParts : [de ? "Best Practices" : "best practices"]).join(", ");
                                      return de
                                        ? `Best-Practice-Regelungen basierend auf ${src}. Wählen Sie die für Ihre Organisation relevanten Regelungen aus.`
                                        : `Best-practice clauses based on ${src}. Select the clauses relevant to your organization.`;
                                    })()} />
                                  </div>
                                  <Badge variant="outline" className="text-[9px]">
                                    {selectedCount}/{clauses.length} {de ? "gewählt" : "selected"}
                                  </Badge>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => selectAllClauses(t.id)}>
                                    <Plus className="h-3 w-3 mr-1" />{de ? "Alle" : "All"}
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => deselectAllClauses(t.id)}>
                                    <X className="h-3 w-3 mr-1" />{de ? "Keine" : "None"}
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                                {clauses.map(clause => (
                                  <ClauseCard
                                    key={clause.id}
                                    clause={clause}
                                    selected={(p.selectedClauses || []).includes(clause.id)}
                                    onToggle={() => toggleClauseSelection(t.id, clause.id)}
                                    expanded={expandedClauses.has(clause.id)}
                                    onToggleExpand={() => toggleClauseExpand(clause.id)}
                                    de={de}
                                    editedText={p.clauseEdits?.[clause.id]}
                                    onEditText={(field, value) => updateClauseEdit(t.id, clause.id, field, value)}
                                  />
                                ))}
                              </div>

                              {/* Export selected as Word (students: up to STUDENT_POLICY_QUOTA policies) */}
                              {selectedCount > 0 && (() => {
                                const alreadyChosen = studentChosenIds.includes(t.id);
                                const studentBlocked = studentLimited && studentQuotaFull && !alreadyChosen;
                                return (
                                  <div className="mt-3 flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-2 text-xs"
                                      onClick={() => openClauseExportDialog(t.id)}
                                      disabled={clauseExportLoading || studentBlocked}
                                      title={studentBlocked
                                        ? (de
                                            ? `Quota ausgeschöpft (${studentQuotaUsed}/${STUDENT_POLICY_QUOTA}) — bereits gewählt: "${studentChosenIds.join('", "')}"`
                                            : `Quota used (${studentQuotaUsed}/${STUDENT_POLICY_QUOTA}) — already chose: "${studentChosenIds.join('", "')}"`)
                                        : undefined}
                                    >
                                      <File className="h-3.5 w-3.5 text-primary" />
                                      {de ? "Richtlinie als Word exportieren" : "Export policy as Word"}
                                      <Badge variant="secondary" className="text-[9px] ml-1">{selectedCount} {de ? "Regelungen" : "clauses"}</Badge>
                                      {studentLimited && alreadyChosen && (
                                        <Badge variant="secondary" className="text-[9px] ml-1">{de ? "gewählt" : "chosen"}</Badge>
                                      )}
                                    </Button>
                                    {kiAnzahl(t.id) > 0 && (
                                      <span className="text-[10px] text-muted-foreground">
                                        {de ? `+ Systemangaben aus dem KI-Register (${kiAnzahl(t.id)} System${kiAnzahl(t.id) === 1 ? "" : "e"})`
                                            : `+ system details from the AI register (${kiAnzahl(t.id)} system${kiAnzahl(t.id) === 1 ? "" : "s"})`}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}

                            </div>
                          )}

                          {/* Manual Rules */}
                          <div className="py-2 border-b border-border/40">
                            <div className="flex items-center gap-1 text-xs font-medium text-foreground/80 mb-2">
                              {de ? "Eigene Regeln" : "Custom Rules"}
                              <InfoTip text={de ? "Zusätzliche eigene Regeln. Bearbeitbar und erweiterbar." : "Additional custom rules. Editable and extensible."} />
                            </div>
                            <div className="space-y-1.5">
                              {(de ? p.rules : p.rulesEn).map((rule, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground w-5 text-right flex-shrink-0">{idx + 1}.</span>
                                  <Input value={rule} onChange={e => updateRule(t.id, idx, e.target.value, !de)} className="text-xs h-7 flex-1" />
                                  <button onClick={() => removeRule(t.id, idx)} className="text-destructive/60 hover:text-destructive text-xs px-1">✕</button>
                                </div>
                              ))}
                              <button onClick={() => addRule(t.id)} className="text-[10px] text-primary hover:underline ml-7">+ {de ? "Regel hinzufügen" : "Add rule"}</button>
                            </div>
                          </div>

                          {/* Nachweis-Dokument (Werkzeug-Brücke zum Dokumenten-Lebenszyklus) */}
                          {(() => {
                            const linkedDoc = p.documentId ? docById.get(p.documentId) : undefined;
                            const derived = p.documentId && p.implementationStatus !== "entbehrlich" ? policyStatusFromDoc(linkedDoc) : null;
                            const suggestion = docSuggestionFor(t);
                            const health = linkedDoc ? docHealth(linkedDoc) : null;
                            return (
                              <FieldRow
                                label={de ? "Nachweis-Dokument" : "Evidence document"}
                                tipDe="Verknüpft diese Richtlinie mit einem Dokument aus dem Werkzeug ‚Dokumenten-Lebenszyklus‘. Der Status wird dann aus dem Dokument abgeleitet: gültig → umgesetzt, überfällig/Entwurf → teilweise. Ohne Dokument bleibt der manuelle Status."
                                tipEn="Links this policy to a document from the Document Lifecycle tool. The status is then derived from the document: valid → implemented, overdue/draft → partial. Without a document the manual status remains."
                              >
                                <div className="space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Select value={p.documentId ?? "__none"} onValueChange={v => updateField(t.id, "documentId", v === "__none" ? undefined : v)}>
                                      <SelectTrigger className="h-8 text-xs flex-1 min-w-[220px]"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="__none">{de ? "— kein Dokument verknüpft —" : "— no document linked —"}</SelectItem>
                                        {lifecycleDocs.map(d => (
                                          <SelectItem key={d.id} value={d.id}>
                                            {d.name} · {DOC_HEALTH_LABEL[docHealth(d)][de ? "de" : "en"]}
                                          </SelectItem>
                                        ))}
                                        {p.documentId && !linkedDoc && (
                                          <SelectItem value={p.documentId}>{de ? "(gelöschtes Dokument)" : "(deleted document)"}</SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                    {p.documentId && (
                                      <Button variant="ghost" size="sm" className="h-8 text-[10px] px-2 gap-1" onClick={() => updateField(t.id, "documentId", undefined)}>
                                        <Unlink className="h-3 w-3" />{de ? "lösen" : "unlink"}
                                      </Button>
                                    )}
                                    <Link to="/documents" className="text-[10px] text-primary hover:underline inline-flex items-center gap-1">
                                      <FolderArchive className="h-3 w-3" />{de ? "Dokumenten-Werkzeug" : "Document tool"}
                                    </Link>
                                  </div>
                                  {linkedDoc && health && (
                                    <p className="text-[10px] text-muted-foreground">
                                      {de ? "Dokument ist " : "Document is "}
                                      <span className="font-medium">{DOC_HEALTH_LABEL[health][de ? "de" : "en"]}</span>
                                      {derived
                                        ? (de ? ` → Status abgeleitet: ${derived === "implemented" ? "Umgesetzt" : "Teilweise"}.` : ` → derived status: ${derived === "implemented" ? "Implemented" : "Partial"}.`)
                                        : (de ? " → keine Ableitung, manueller Status gilt." : " → no derivation, manual status applies.")}
                                    </p>
                                  )}
                                  {p.documentId && !linkedDoc && (
                                    <p className="text-[10px] text-destructive">
                                      {de ? "Das verknüpfte Dokument existiert nicht mehr — bitte neu verknüpfen oder lösen." : "The linked document no longer exists — please re-link or unlink."}
                                    </p>
                                  )}
                                  {!p.documentId && suggestion && (
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1.5" onClick={() => updateField(t.id, "documentId", suggestion.doc.id)}>
                                      <Link2 className="h-3 w-3 text-primary" />
                                      {de ? "Dokument verknüpfen: " : "Link document: "}<span className="font-semibold">{suggestion.doc.name}</span>
                                    </Button>
                                  )}
                                  {!p.documentId && !suggestion && lifecycleDocs.length === 0 && (
                                    <p className="text-[10px] text-muted-foreground">
                                      {de ? "Noch keine Dokumente im Dokumenten-Lebenszyklus angelegt." : "No documents in the Document Lifecycle yet."}
                                    </p>
                                  )}
                                </div>
                              </FieldRow>
                            );
                          })()}

                          {/* Implementation Status */}
                          {(() => {
                            const derived = p.documentId && p.implementationStatus !== "entbehrlich" ? policyStatusFromDoc(docById.get(p.documentId)) : null;
                            return (
                          <FieldRow label="Status" tipDe="Gibt an, wie weit diese Richtlinie derzeit umgesetzt ist. 'Entbehrlich' bedeutet: für unsere Organisation nicht anwendbar — wird aus der Compliance-Berechnung (Reife %) ausgeschlossen, ähnlich wie 'Not Applicable' in der SoA. Bei verknüpftem Nachweis-Dokument wird der Status aus dem Dokument abgeleitet." tipEn="Indicates how much of this policy is currently applied. 'Not Applicable' means: not relevant for our organisation — excluded from the compliance maturity calculation, similar to NA in the SoA. With a linked evidence document the status is derived from the document.">
                            <div className="flex flex-wrap items-center gap-2">
                              <Select value={p.implementationStatus} onValueChange={v => updateField(t.id, "implementationStatus", v)} disabled={!!derived}>
                                <SelectTrigger className="h-8 text-xs flex-1 min-w-[200px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">{de ? "Entwurf" : "Draft"}</SelectItem>
                                  <SelectItem value="not_implemented">{de ? "Nicht umgesetzt" : "Not Implemented"}</SelectItem>
                                  <SelectItem value="partially_implemented">{de ? "Teilweise umgesetzt" : "Partially Implemented"}</SelectItem>
                                  <SelectItem value="implemented">{de ? "Umgesetzt" : "Implemented"}</SelectItem>
                                  <SelectItem value="entbehrlich">{de ? "Entbehrlich (nicht anwendbar)" : "Not Applicable"}</SelectItem>
                                </SelectContent>
                              </Select>
                              {derived && (
                                <span className="text-[10px] text-muted-foreground">
                                  {de ? "abgeleitet aus Nachweis-Dokument (zum Ändern Verknüpfung lösen)" : "derived from evidence document (unlink to change)"}
                                </span>
                              )}
                            </div>
                          </FieldRow>
                            );
                          })()}

                          {/* Review & Governance */}
                          <FieldRow label={de ? "Überprüfungshäufigkeit" : "Review Frequency"} tipDe="Wie oft soll diese Richtlinie überprüft werden?" tipEn="How often should this policy be reviewed?">
                            <Input value={p.reviewFrequency} onChange={e => updateField(t.id, "reviewFrequency", e.target.value)} placeholder={de ? "z.B. Jährlich" : "e.g. Annually"} className="text-xs h-8" />
                          </FieldRow>
                          <FieldRow label={de ? "Letzte Überprüfung" : "Last Review Date"} tipDe="Wann wurde diese Richtlinie zuletzt überprüft?" tipEn="When was this policy last reviewed?">
                            <Input type="date" value={p.lastReviewDate} onChange={e => updateField(t.id, "lastReviewDate", e.target.value)} className="text-xs h-8" />
                          </FieldRow>
                          <FieldRow label={de ? "Nächste Überprüfung" : "Next Review Date"} tipDe="Wann steht die nächste Überprüfung an?" tipEn="When is the next review due?">
                            <Input type="date" value={p.nextReviewDate} onChange={e => updateField(t.id, "nextReviewDate", e.target.value)} className="text-xs h-8" />
                          </FieldRow>

                          {/* Exceptions */}
                          <FieldRow label={de ? "Ausnahmen" : "Exceptions"} tipDe="Begründete Abweichungen von dieser Richtlinie auflisten." tipEn="List any justified deviations from this policy.">
                            <Textarea value={p.exceptions} onChange={e => updateField(t.id, "exceptions", e.target.value)} className="text-xs min-h-[40px]" placeholder={de ? "Keine" : "None"} />
                          </FieldRow>

                          {/* Systems */}
                          <FieldRow label={de ? "Unterstützende Systeme" : "Supporting Systems"} tipDe="Welche Tools oder Systeme unterstützen diese Richtlinie?" tipEn="Which tools or systems support this policy?">
                            <Input value={p.systemsUsed} onChange={e => updateField(t.id, "systemsUsed", e.target.value)} placeholder={de ? "z.B. SIEM, IAM, Firewall" : "e.g. SIEM, IAM, Firewall"} className="text-xs h-8" />
                          </FieldRow>

                          {/* Document Control */}
                          <div className="bg-muted/30 rounded-lg p-3 mt-2 space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{de ? "Dokumentkontrolle" : "Document Control"}</div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="text-[10px] text-muted-foreground flex items-center gap-1">Version <InfoTip text={de ? "Aktuelle Versionsnummer des Dokuments." : "Current version number of the document."} /></label>
                                <Input value={p.version} onChange={e => updateField(t.id, "version", e.target.value)} className="text-xs h-7" />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground flex items-center gap-1">{de ? "Erstellt" : "Created"} <InfoTip text={de ? "Datum der ersten Erstellung." : "Date of first creation."} /></label>
                                <Input type="date" value={p.creationDate} onChange={e => updateField(t.id, "creationDate", e.target.value)} className="text-xs h-7" />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground flex items-center gap-1">{de ? "Aktualisiert" : "Updated"} <InfoTip text={de ? "Datum der letzten Aktualisierung." : "Date of last update."} /></label>
                                <Input type="date" value={p.lastUpdated} onChange={e => updateField(t.id, "lastUpdated", e.target.value)} className="text-xs h-7" />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground flex items-center gap-1">{de ? "Yürürlük Tarihi" : "Effective Date"} <InfoTip text={de ? "Das Datum, ab dem diese Richtlinie verbindlich gilt." : "The date from which this policy becomes binding."} /></label>
                                <Input type="date" value={p.effectiveDate} onChange={e => updateField(t.id, "effectiveDate", e.target.value)} className="text-xs h-7" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {grouped.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {de ? "Keine Richtlinien gefunden." : "No policies found."}
            </div>
          )}
        </div>
          </TabsContent>
        </Tabs>

      </div>

      {/* Export Options Dialog */}
      <ExportOptionsDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleClauseExportWithOptions}
        de={de}
        loading={clauseExportLoading}
      />

      {/* Overview Report Dialog */}
      <ReportExclusionDialog
        open={overviewDialogOpen}
        onOpenChange={setOverviewDialogOpen}
        title={de ? "Richtlinien-Übersichtsbericht" : "Policy Overview Report"}
        description={de
          ? "Wählen Sie aus, welche Richtlinien im Bericht (Diagramme + Tabellen) enthalten sein sollen."
          : "Choose which policies to include in the report (charts + tables)."}
        items={policyReportItems}
        loading={overviewLoading}
        formats={["pdf", "word", "excel"]}
        onExport={handleOverviewExport}
      />
    </div>
  );
};

export default Policies;
