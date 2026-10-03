import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, AlertCircle, ChevronDown, ChevronRight, FileText, CheckSquare, BookOpen, ShieldAlert, Users, Monitor, Network, Truck, Brain, FileDown, Briefcase, Code2, Cpu, Lock, Search, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToolData } from "@/hooks/useToolData";
import ToolSaveBar from "@/components/ToolSaveBar";
import TrainingCharts from "@/components/TrainingCharts";
import ReportExclusionDialog from "@/components/ReportExclusionDialog";
import { generateTrainingPDF, generateTrainingWord, generateTrainingExcel } from "@/lib/trainingReport";
import { generateTrainingPlanPDF } from "@/lib/trainingPlanReport";
import TopicParticipantsList from "@/components/training/TopicParticipantsList";
import PersonnelPicker from "@/components/PersonnelPicker";
import { useTrainingParticipants } from "@/hooks/useTrainingParticipants";
import { toast } from "sonner";
import { useFramework } from "@/contexts/FrameworkContext";
import { TOPIC_FRAMEWORKS } from "@/data/training/topicFrameworks";

import { CATEGORIES, type Role, type TrainingTopic, type TrainingCategory } from "@/data/training/categories";

const ROLE_META: { id: Role; de: string; en: string; icon: React.ReactNode }[] = [
  { id: "all", de: "Alle Mitarbeiter", en: "All Employees", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "management", de: "Geschäftsleitung", en: "Management", icon: <Briefcase className="h-3.5 w-3.5" /> },
  { id: "it", de: "IT-Team", en: "IT Team", icon: <Network className="h-3.5 w-3.5" /> },
  { id: "procurement", de: "Einkauf & Vertrag", en: "Procurement & Contracts", icon: <Truck className="h-3.5 w-3.5" /> },
  { id: "developer", de: "Entwickler", en: "Developers", icon: <Code2 className="h-3.5 w-3.5" /> },
  { id: "ot", de: "OT/ICS-Personal", en: "OT/ICS Staff", icon: <Cpu className="h-3.5 w-3.5" /> },
];

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


interface TrainingData {
  completions: Record<string, { completed: boolean; completionDate: string }>;
  itemChecks: Record<string, Record<number, boolean>>;
  docChecks: Record<string, Record<number, boolean>>;
  onboardingRequiredIds?: string[];
  trainingPlanSelectedIds?: string[];
  trainingPlanEntries?: Record<string, TrainingPlanEntry>;
}

type PlanQuarter = "Q1" | "Q2" | "Q3" | "Q4";
type PlanDeliveryMode = "e_learning" | "workshop" | "tabletop" | "briefing";
type PlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "overdue" | "deferred";

export interface PlanParticipantGroup {
  /** Department / board / team label (e.g. "IT", "Vorstand", "Einkauf"). */
  label: string;
  /** Number of people in this group attending the training. */
  count: number;
}

interface TrainingPlanEntry {
  quarter: PlanQuarter;
  owner: string;
  /** True once the user has manually changed the owner away from our suggestion. */
  ownerEdited?: boolean;
  deliveryMode: PlanDeliveryMode;
  status: PlanStatus;
  notes: string;
  /** New model: groups of attendees (department + count). Replaces participantNames. */
  participantGroups?: PlanParticipantGroup[];
  /** @deprecated Kept for backward-compat with existing saves. Migrated on read. */
  participantNames?: string[];
}

const PLAN_QUARTERS: PlanQuarter[] = ["Q1", "Q2", "Q3", "Q4"];
const PLAN_DELIVERY_MODES: PlanDeliveryMode[] = ["e_learning", "workshop", "tabletop", "briefing"];
const PLAN_STATUSES: PlanStatus[] = ["planned", "scheduled", "in_progress", "completed", "overdue", "deferred"];

/** Our recommended owner per topic, based on target roles. Shown in primary/italic until the user overrides. */
const suggestOwner = (topic: TrainingTopic, de: boolean): string =>
  topic.roles.includes("management")
    ? (de ? "Geschäftsleitung" : "Management")
    : topic.roles.includes("it")
      ? "IT / ISB"
      : topic.roles.includes("procurement")
        ? (de ? "Einkauf" : "Procurement")
        : topic.roles.includes("ot")
          ? "OT / ICS"
          : "HR / ISB";

const getDefaultPlanEntry = (topic: TrainingTopic, de: boolean): TrainingPlanEntry => ({
  quarter: topic.roles.includes("management") ? "Q1" : topic.roles.includes("ot") ? "Q3" : topic.roles.includes("developer") ? "Q2" : "Q4",
  owner: suggestOwner(topic, de),
  ownerEdited: false,
  deliveryMode: topic.roles.includes("management") || topic.roles.includes("ot") ? "workshop" : "e_learning",
  status: "planned",
  notes: "",
});

const planDeliveryLabel = (mode: PlanDeliveryMode, de: boolean) => ({
  e_learning: de ? "E-Learning" : "E-learning",
  workshop: "Workshop",
  tabletop: "Tabletop",
  briefing: "Briefing",
}[mode]);

const planStatusLabel = (status: PlanStatus, de: boolean) => ({
  planned: de ? "Geplant" : "Planned",
  scheduled: de ? "Terminiert" : "Scheduled",
  in_progress: de ? "Laufend" : "In progress",
  completed: de ? "Abgeschlossen" : "Completed",
  overdue: de ? "Überfällig" : "Overdue",
  deferred: de ? "Auf nächstes Jahr verschoben" : "Deferred to next year",
}[status]);

/** Migrate legacy participantNames → participantGroups (1 person each). */
const resolveGroups = (entry: TrainingPlanEntry | undefined): PlanParticipantGroup[] => {
  if (!entry) return [];
  if (entry.participantGroups && entry.participantGroups.length > 0) return entry.participantGroups;
  if (entry.participantNames && entry.participantNames.length > 0) {
    return entry.participantNames.filter(Boolean).map(n => ({ label: n, count: 1 }));
  }
  return [];
};

const groupTotal = (groups: PlanParticipantGroup[]) =>
  groups.reduce((sum, g) => sum + (Number.isFinite(g.count) && g.count > 0 ? Math.floor(g.count) : 0), 0);

const DEFAULT_GROUP_SUGGESTIONS = (de: boolean) => de
  ? ["Geschäftsleitung", "Vorstand", "IT", "OT / ICS", "HR", "Einkauf", "Fachbereich", "Gesamte Belegschaft"]
  : ["Management", "Board", "IT", "OT / ICS", "HR", "Procurement", "Business unit", "All staff"];

const PlanParticipantsPicker = ({
  groups,
  onChange,
  de,
}: {
  groups: PlanParticipantGroup[];
  onChange: (groups: PlanParticipantGroup[]) => void;
  de: boolean;
}) => {
  const [draftLabel, setDraftLabel] = useState("");
  const [draftCount, setDraftCount] = useState<string>("1");
  const total = groupTotal(groups);
  const suggestions = useMemo(
    () => DEFAULT_GROUP_SUGGESTIONS(de).filter(s => !groups.some(g => g.label.toLowerCase() === s.toLowerCase())),
    [groups, de]
  );

  const addGroup = (label: string, count: number) => {
    const trimmed = label.trim();
    const n = Math.max(1, Math.floor(Number.isFinite(count) ? count : 1));
    if (!trimmed) return;
    const existing = groups.findIndex(g => g.label.toLowerCase() === trimmed.toLowerCase());
    if (existing >= 0) {
      const next = [...groups];
      next[existing] = { label: next[existing].label, count: n };
      onChange(next);
    } else {
      onChange([...groups, { label: trimmed, count: n }]);
    }
    setDraftLabel("");
    setDraftCount("1");
  };

  const updateGroup = (idx: number, patch: Partial<PlanParticipantGroup>) => {
    const next = groups.map((g, i) => i === idx ? { ...g, ...patch } : g);
    onChange(next);
  };

  const removeGroup = (idx: number) => onChange(groups.filter((_, i) => i !== idx));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-8 w-full justify-between gap-2 text-xs font-normal">
          <span className="truncate">
            {total > 0
              ? `${total} ${de ? "TN" : "att."} · ${groups.length} ${de ? "Gruppen" : "groups"}`
              : (de ? "Teilnehmergruppen" : "Participant groups")}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-3 space-y-3" align="end">
        <div className="space-y-1">
          <p className="text-xs font-heading font-semibold text-foreground">
            {de ? "Teilnehmer nach Gruppe" : "Participants by group"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {de
              ? "Erfassen Sie Abteilungen / Gremien (z. B. Vorstand, IT) und die Anzahl der Teilnehmer — keine Einzelnamen nötig."
              : "Capture departments / boards (e.g. Board, IT) and the number of attendees — no individual names needed."}
          </p>
        </div>

        {groups.length > 0 && (
          <div className="space-y-1.5">
            {groups.map((g, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={g.label}
                  onChange={e => updateGroup(idx, { label: e.target.value })}
                  className="h-8 text-xs flex-1"
                />
                <Input
                  type="number"
                  min={1}
                  value={g.count}
                  onChange={e => updateGroup(idx, { count: Math.max(1, parseInt(e.target.value || "1", 10)) })}
                  className="h-8 text-xs w-16 text-right"
                />
                <button
                  type="button"
                  onClick={() => removeGroup(idx)}
                  className="text-muted-foreground hover:text-destructive text-xs px-1"
                  title={de ? "Entfernen" : "Remove"}
                >
                  ×
                </button>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground text-right">
              {de ? "Summe" : "Total"}: <span className="font-semibold text-foreground">{total}</span>
            </p>
          </div>
        )}

        <div className="flex gap-2 border-t pt-2">
          <Input
            value={draftLabel}
            onChange={e => setDraftLabel(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addGroup(draftLabel, parseInt(draftCount, 10) || 1); } }}
            placeholder={de ? "Gruppe (z. B. IT, Vorstand)" : "Group (e.g. IT, Board)"}
            className="h-8 text-xs flex-1"
          />
          <Input
            type="number"
            min={1}
            value={draftCount}
            onChange={e => setDraftCount(e.target.value)}
            placeholder="#"
            className="h-8 text-xs w-16 text-right"
          />
          <Button type="button" size="sm" onClick={() => addGroup(draftLabel, parseInt(draftCount, 10) || 1)} className="h-8 text-xs">
            {de ? "Hinzufügen" : "Add"}
          </Button>
        </div>

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestions.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => addGroup(s, 1)}
                className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 text-muted-foreground hover:text-primary transition"
              >
                + {s}
              </button>
            ))}
          </div>
        )}

        {groups.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="text-[11px] text-muted-foreground hover:text-destructive underline">
            {de ? "Auswahl leeren" : "Clear all"}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};


const TrainingTab = () => {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { active } = useFramework();
  const nis2Active = active.some((f) => f.key === "NIS2");
  const { data, setData, loading, lastSaved, saveToCloud, resetData } = useToolData<TrainingData>(
    "training", "nis2_training", { completions: {}, itemChecks: {}, docChecks: {}, onboardingRequiredIds: [], trainingPlanSelectedIds: [], trainingPlanEntries: {} }
  );

  const { user, isStudent, isAdmin, isLecturer, viewAsUserId } = useAuth();
  // Students may browse all training content but downloads are restricted:
  // - Status-Bericht and Zertifikate are blocked
  // - Annual Training Plan PDF is allowed
  const studentLimited = (isStudent && !isAdmin && !isLecturer) || !!viewAsUserId;
  const { completions: participantCompletions, quizResults } = useTrainingParticipants();
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "any">("any");
  const [trainingSearch, setTrainingSearch] = useState("");
  const [planOpen, setPlanOpen] = useState(true);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: ownerId } = await supabase.rpc("get_org_owner_id", { _user_id: user.id });
      const tid = (ownerId as string) || user.id;
      const { data: profile } = await supabase.from("company_profiles").select("company_name").eq("user_id", tid)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (profile?.company_name) setCompanyName(profile.company_name);
    })();
  }, [user]);

  const completions = data.completions ?? {};
  const itemChecks = data.itemChecks ?? {};
  const docChecks = data.docChecks ?? {};

  const toggleCat = (id: string) => setExpandedCats(p => ({ ...p, [id]: !p[id] }));
  const toggleTopic = (id: string) => setExpandedTopics(p => ({ ...p, [id]: !p[id] }));

  const toggleItem = (topicId: string, idx: number, total: number, docTotal: number) => {
    setData(d => {
      const cur = d.itemChecks?.[topicId] ?? {};
      const next = { ...cur, [idx]: !cur[idx] };
      const itemChecks = { ...(d.itemChecks ?? {}), [topicId]: next };
      const allItems = Array.from({ length: total }, (_, i) => !!next[i]).every(Boolean);
      const allDocs = Array.from({ length: docTotal }, (_, i) => !!(d.docChecks?.[topicId]?.[i])).every(Boolean);
      const completions = { ...(d.completions ?? {}) };
      if (allItems && allDocs) {
        completions[topicId] = { completed: true, completionDate: new Date().toISOString().split("T")[0] };
      } else if (completions[topicId]?.completed) {
        completions[topicId] = { completed: false, completionDate: "" };
      }
      return { ...d, itemChecks, completions };
    });
  };

  const toggleDoc = (topicId: string, idx: number, total: number, docTotal: number) => {
    setData(d => {
      const cur = d.docChecks?.[topicId] ?? {};
      const next = { ...cur, [idx]: !cur[idx] };
      const docChecks = { ...(d.docChecks ?? {}), [topicId]: next };
      const allItems = Array.from({ length: total }, (_, i) => !!(d.itemChecks?.[topicId]?.[i])).every(Boolean);
      const allDocs = Array.from({ length: docTotal }, (_, i) => !!next[i]).every(Boolean);
      const completions = { ...(d.completions ?? {}) };
      if (allItems && allDocs) {
        completions[topicId] = { completed: true, completionDate: new Date().toISOString().split("T")[0] };
      } else if (completions[topicId]?.completed) {
        completions[topicId] = { completed: false, completionDate: "" };
      }
      return { ...d, docChecks, completions };
    });
  };

  const toggleComplete = (id: string, total: number, docTotal: number) => {
    setData(d => {
      const wasComplete = !!d.completions?.[id]?.completed;
      const completions = { ...(d.completions ?? {}) };
      const itemChecks = { ...(d.itemChecks ?? {}) };
      const docChecks = { ...(d.docChecks ?? {}) };
      if (wasComplete) {
        completions[id] = { completed: false, completionDate: "" };
      } else {
        completions[id] = { completed: true, completionDate: new Date().toISOString().split("T")[0] };
        const fillItems: Record<number, boolean> = {};
        for (let i = 0; i < total; i++) fillItems[i] = true;
        itemChecks[id] = fillItems;
        const fillDocs: Record<number, boolean> = {};
        for (let i = 0; i < docTotal; i++) fillDocs[i] = true;
        docChecks[id] = fillDocs;
      }
      return { ...d, completions, itemChecks, docChecks };
    });
  };

  // Filters
  const filteredCategories = useMemo(() => {
    const q = trainingSearch.trim();
    const activeKeys = active.map(f => f.key);
    return CATEGORIES.map(c => ({
      ...c,
      topics: c.topics.filter(t => {
        // CWS-Regel: nur Schulungen zeigen, die zu einem AKTIVEN Framework gehören.
        // Leere Framework-Liste = übergreifend (immer sichtbar).
        const topicFw = (TOPIC_FRAMEWORKS as Record<string, string[]>)[t.id] ?? [];
        if (topicFw.length > 0 && !topicFw.some(f => activeKeys.includes(f as any))) return false;
        if (roleFilter === "all") {
          if (!t.roles.includes("all")) return false;
        } else if (roleFilter !== "any") {
          // Strict: only trainings explicitly tagged for this role
          if (!t.roles.includes(roleFilter)) return false;
        }
        if (!q) return true;
        const roleLabels = t.roles.flatMap(r => {
          const meta = ROLE_META.find(m => m.id === r);
          return meta ? [r, meta.de, meta.en] : [r];
        });
        const haystack = [
          t.id,
          de ? t.titleDe : t.titleEn,
          de ? t.basisDe : t.basisEn,
          de ? t.roleRationaleDe : t.roleRationaleEn,
          ...roleLabels,
        ].filter(Boolean).join(" ");
        return matchesFilterText(haystack, q);
      }),
    })).filter(c => c.topics.length > 0);
  }, [roleFilter, trainingSearch, de, active]);

  const allTopics = CATEGORIES.flatMap(c => c.topics);
  const visibleTopics = filteredCategories.flatMap(c => c.topics);
  const completedCount = visibleTopics.filter(t => completions[t.id]?.completed).length;
  const mandatoryTotal = visibleTopics.filter(t => t.mandatory).length;
  const mandatoryCompleted = visibleTopics.filter(t => t.mandatory && completions[t.id]?.completed).length;
  const progress = visibleTopics.length ? Math.round((completedCount / visibleTopics.length) * 100) : 0;

  const catIcons: Record<string, React.ReactNode> = {
    "cat-gov": <ShieldAlert className="h-5 w-5 text-blue-600" />,
    "cat-aware": <Lock className="h-5 w-5 st-nein-text" />,
    "cat-incident": <AlertCircle className="h-5 w-5 st-teilweise-text" />,
    "cat-risk": <Brain className="h-5 w-5 text-purple-600" />,
    "cat-tech": <Network className="h-5 w-5 text-cyan-600" />,
    "cat-supply": <Truck className="h-5 w-5 text-orange-600" />,
    "cat-spec": <Users className="h-5 w-5 st-ja-text" />,
  };

  const reportItems = useMemo(() => CATEGORIES.flatMap(cat =>
    cat.topics.map(t => ({
      id: t.id,
      label: de ? t.titleDe : t.titleEn,
      group: de ? cat.titleDe : cat.titleEn,
      meta: t.mandatory ? (de ? "Pflicht" : "Mandatory") : (de ? "Optional" : "Optional"),
    }))
  ), [de]);

  const handleReportExport = async (format: "pdf" | "word" | "excel", excluded: string[]) => {
    if (studentLimited) {
      toast.error(de
        ? "Studierende dürfen den detaillierten Schulungs-Statusbericht nicht herunterladen. Nur der Jahres-Schulungsplan ist verfügbar."
        : "Students cannot download the detailed training status report. Only the annual training plan is available.");
      return;
    }
    setReportLoading(true);
    try {
      if (format === "pdf") {
        await generateTrainingPDF(CATEGORIES as any, completions, excluded, lang, companyName);
      } else if (format === "excel") {
        await generateTrainingExcel({ topics: CATEGORIES as any, participants: completions as any }, lang);
      } else {
        await generateTrainingWord(CATEGORIES as any, completions, excluded, lang, companyName);
      }
      toast.success(de ? "Bericht exportiert" : "Report exported");
      setReportOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(de ? "Export fehlgeschlagen" : "Export failed");
    }
    setReportLoading(false);
  };

  const topicProgress = (t: TrainingTopic) => {
    const total = t.contentDe.length + t.docContentDe.length;
    const done = Object.values(itemChecks[t.id] ?? {}).filter(Boolean).length
      + Object.values(docChecks[t.id] ?? {}).filter(Boolean).length;
    return total ? Math.round((done / total) * 100) : 0;
  };

  return (
    <div className="space-y-4">
      <ToolSaveBar loading={loading} lastSaved={lastSaved} onSave={saveToCloud} onReset={resetData} />

      {/* Report header */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="text-xs text-muted-foreground">
          {de
            ? "Schulungsstatus pro Zielgruppe — jede Schulung als Checkliste mit Pflichtinhalten und Belegdokumenten."
            : "Training status per audience — each training is a checklist of mandatory content and supporting documents."}
        </div>
        {!studentLimited && (
          <Button size="sm" onClick={() => setReportOpen(true)} disabled={reportLoading} className="gap-1.5 h-8 flex-shrink-0">
            <FileDown className="h-3.5 w-3.5" />
            {de ? "Bericht erstellen" : "Generate report"}
          </Button>
        )}
      </div>

      {studentLimited && (
        <div className="st-teilweise-tint border st-teilweise-border rounded-xl p-3 text-xs text-foreground/90">
          <strong className="font-heading">
            {de ? "Studierenden-Hinweis: Downloads eingeschränkt" : "Student notice: downloads restricted"}
          </strong>
          <span className="ml-2 text-muted-foreground">
            {de
              ? "Sie können alle Schulungsinhalte ansehen und bearbeiten. Herunterladbar ist nur der Jahres-Schulungsplan (PDF). Detail-Statusberichte und Teilnahmezertifikate sind gesperrt."
              : "You can view and edit all training content. Only the annual training plan (PDF) is downloadable. Detailed status reports and participation certificates are locked."}
          </span>
        </div>
      )}

      <ReportExclusionDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        title={de ? "Schulungs-Statusbericht" : "Training Status Report"}
        description={de
          ? "Wählen Sie aus, welche Schulungs-Themen vom Bericht ausgeschlossen werden sollen."
          : "Select which training topics to exclude from the report."}
        items={reportItems}
        loading={reportLoading}
        onExport={handleReportExport}
      />


      {/* Role filter */}
      <Card className="border-primary/20">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Users className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">{de ? "Schulungen filtern" : "Filter trainings"}</p>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={trainingSearch}
                onChange={e => setTrainingSearch(e.target.value)}
                placeholder={de ? "Schulung suchen, z.B. OT, Phishing, DSGVO..." : "Search trainings, e.g. OT, phishing, GDPR..."}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setRoleFilter("any")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${roleFilter === "any" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/70"}`}
            >
              {de ? "Alle Themen" : "All topics"}
            </button>
            {ROLE_META.map(r => (
              <button
                key={r.id}
                onClick={() => setRoleFilter(r.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors flex items-center gap-1 ${roleFilter === r.id ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/70"}`}
              >
                {r.icon}
                {de ? r.de : r.en}
              </button>
            ))}
          </div>
          {trainingSearch.trim().length > 0 && trainingSearch.trim().length <= 2 && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {de
                ? "Kurze Suchbegriffe werden nur am Wort-/Code-Anfang gesucht, damit z.B. 'oc' nicht zufällig in Wörtern wie 'Social' oder 'process' matcht."
                : "Short terms only match word/code starts, so e.g. 'oc' does not randomly match words like 'Social' or 'process'."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Guidance */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex gap-3">
          <GraduationCap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="font-heading font-semibold">{nis2Active ? (de ? "📘 Warum sind NIS2-Schulungen Pflicht?" : "📘 Why are NIS2 trainings mandatory?") : (de ? "📘 Warum sind Awareness-Schulungen Pflicht?" : "📘 Why are awareness trainings mandatory?")}</p>
            <ul className="text-xs mt-2 space-y-1 list-disc list-inside text-muted-foreground">
              {nis2Active && <li>{de ? "NIS2 Art. 20 (2) verpflichtet Geschäftsleitungen zu regelmäßigen Schulungen und der Bereitstellung von Schulungen für Mitarbeitende." : "NIS2 Art. 20 (2) requires management to be trained regularly and to provide staff training."}</li>}
              {!nis2Active && <li>{de ? "Geschäftsleitung muss regelmäßig geschult werden und Schulungen für Mitarbeitende bereitstellen." : "Management must be trained regularly and provide training for staff."}</li>}
              <li>{nis2Active ? (de ? "NIS2 Art. 21 (2)(g) fordert grundlegende Cyberhygiene-Praktiken und Cybersicherheitsschulungen." : "NIS2 Art. 21 (2)(g) requires basic cyber hygiene practices and cybersecurity training.") : (de ? "Cyberhygiene und Awareness sind in allen gängigen Rahmenwerken verpflichtende Maßnahmen." : "Cyber hygiene and awareness are mandatory measures across all common frameworks.")}</li>
              <li>{de ? "Jede Pflicht-Position der Checkliste muss nachweislich erfüllt sein." : "Every mandatory checklist item must be verifiably fulfilled."}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-heading font-bold">{visibleTopics.length}</p><p className="text-xs text-muted-foreground">{de ? "Themen (sichtbar)" : "Topics (visible)"}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-heading font-bold st-ja-text">{completedCount}</p><p className="text-xs text-muted-foreground">{de ? "Abgeschlossen" : "Completed"}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-heading font-bold st-teilweise-text">{mandatoryCompleted}/{mandatoryTotal}</p><p className="text-xs text-muted-foreground">{de ? "Pflicht" : "Mandatory"}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-heading font-bold">{progress}%</p><p className="text-xs text-muted-foreground">{de ? "Fortschritt" : "Progress"}</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-4"><div className="flex justify-between text-sm mb-2"><span>{de ? "Gesamtfortschritt" : "Overall Progress"}</span><span className="font-heading font-bold">{progress}%</span></div><Progress value={progress} className="h-2" /></CardContent></Card>

      {/* Participants & Training Plan summary */}
      {(() => {
        const planEntriesArr = Object.values(data.trainingPlanEntries ?? {});
        const plannedAttendeeTotal = planEntriesArr.reduce((sum, entry) => sum + groupTotal(resolveGroups(entry as TrainingPlanEntry)), 0);
        const uniqueParticipants = new Set(participantCompletions.map(c => c.participant_name).filter(Boolean)).size + plannedAttendeeTotal;
        const passedQuizzes = quizResults.filter(q => q.passed).length;
        const now = Date.now();
        const overdue = participantCompletions.filter(c => new Date(c.next_due_at).getTime() < now).length;
        const dueSoon = participantCompletions.filter(c => {
          const d = new Date(c.next_due_at).getTime();
          return d >= now && d - now <= 30 * 86400000;
        }).length;
        // CWS-Regel: auch Plan-Builder / Onboarding / Empfehlungen nur Schulungen
        // aktiver Frameworks (gleiche Regel wie Katalog-Filter, sonst leckt z. B. NIS2).
        const _activeKeys = active.map(f => f.key);
        const allTopicsList = CATEGORIES.flatMap(c => c.topics).filter(t => {
          const fw = (TOPIC_FRAMEWORKS as Record<string, string[]>)[t.id] ?? [];
          return fw.length === 0 || fw.some(f => _activeKeys.includes(f as any));
        });
        const onboardingIds = data.onboardingRequiredIds ?? [];
        const planEntries = data.trainingPlanEntries ?? {};
        const selectedPlanIds = data.trainingPlanSelectedIds ?? [];
        const recommendedPlanIds = new Set(allTopicsList.filter(t => t.mandatory || onboardingIds.includes(t.id)).map(t => t.id));
        const planTopics = allTopicsList.filter(t => selectedPlanIds.includes(t.id));
        const deferredCount = planTopics.filter(t => planEntries[t.id]?.status === "deferred").length;
        const plannedCount = planTopics.filter(t => {
          const s = planEntries[t.id]?.status ?? "planned";
          return s !== "planned" && s !== "deferred";
        }).length;
        const completedPlanCount = planTopics.filter(t => planEntries[t.id]?.status === "completed").length;


        const updatePlanEntry = (topic: TrainingTopic, patch: Partial<TrainingPlanEntry>) => {
          setData(d => {
            const current = d.trainingPlanEntries?.[topic.id] ?? getDefaultPlanEntry(topic, de);
            return {
              ...d,
              trainingPlanEntries: {
                ...(d.trainingPlanEntries ?? {}),
                [topic.id]: { ...current, ...patch },
              },
            };
          });
        };

        const toggleOnboarding = (id: string) => {
          setData(d => {
            const cur = d.onboardingRequiredIds ?? [];
            const wasSelected = cur.includes(id);
            const next = wasSelected ? cur.filter(x => x !== id) : [...cur, id];
            const topic = allTopicsList.find(t => t.id === id);
            const selected = d.trainingPlanSelectedIds ?? [];
            const trainingPlanSelectedIds = wasSelected
              ? selected.filter(topicId => topicId !== id)
              : (selected.includes(id) ? selected : [...selected, id]);
            return {
              ...d,
              onboardingRequiredIds: next,
              trainingPlanSelectedIds,
              trainingPlanEntries: topic
                ? { ...(d.trainingPlanEntries ?? {}), [id]: d.trainingPlanEntries?.[id] ?? getDefaultPlanEntry(topic, de) }
                : d.trainingPlanEntries,
            };
          });
        };

        const togglePlanTopic = (topic: TrainingTopic) => {
          setData(d => {
            const cur = d.trainingPlanSelectedIds ?? [];
            const selected = cur.includes(topic.id);
            const trainingPlanSelectedIds = selected ? cur.filter(id => id !== topic.id) : [...cur, topic.id];
            const currentEntry = d.trainingPlanEntries?.[topic.id] ?? getDefaultPlanEntry(topic, de);
            return {
              ...d,
              trainingPlanSelectedIds,
              trainingPlanEntries: {
                ...(d.trainingPlanEntries ?? {}),
                [topic.id]: currentEntry,
              },
            };
          });
        };

        const handleExportPlan = () => {
          const exportEntries = Object.fromEntries(
            planTopics.map(t => [t.id, planEntries[t.id] ?? getDefaultPlanEntry(t, de)])
          );
          generateTrainingPlanPDF({
            year: new Date().getFullYear(),
            companyName,
            lang,
            topics: planTopics.map(t => ({ id: t.id, titleDe: t.titleDe, titleEn: t.titleEn, roles: t.roles as string[], mandatory: t.mandatory })),
            roleMeta: ROLE_META.map(r => ({ id: r.id, de: r.de, en: r.en })),
            completions: participantCompletions,
            quizResults,
            onboardingRequiredIds: onboardingIds,
            planEntries: exportEntries,
          });
          toast.success(de ? "Schulungsplan exportiert" : "Training plan exported");
        };

        return (
          <Card className="st-ja-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 st-ja-text" />
                  <h3 className="text-sm font-heading font-semibold text-foreground">
                    {de ? "Teilnehmer-Übersicht & Schulungsplan" : "Participants Overview & Training Plan"}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" aria-label="Info">
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 text-xs space-y-2" align="end">
                      <p className="font-heading font-semibold text-foreground">
                        {de ? "Wie wird der Jahres-Schulungsplan erzeugt?" : "How is the annual training plan generated?"}
                      </p>
                      <p className="text-muted-foreground">
                        {de
                          ? "Der Plan entsteht durch Ihre Auswahl: Jedes angehakte Schulungsmodul erscheint sofort im Jahresplan. Pflicht- und Onboarding-Module werden farblich als Empfehlung markiert, bleiben aber abwählbar."
                          : "The plan is created by your selection: every checked training module appears immediately in the annual plan. Mandatory and onboarding modules are colour-marked as recommendations, but remain optional for this year's plan."}
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        <li>{de ? "Teilnehmer wählen Sie direkt je Planzeile aus vorhandenen Nachweisen aus oder ergänzen Namen für die Planung." : "Participants are selected directly per plan row from existing records, or added by name for planning."}</li>
                        <li>
                          {de
                            ? <>Der <span className="text-primary italic font-medium">blau-kursiv</span> dargestellte Owner ist unser Vorschlag (abgeleitet aus den Zielrollen). Sobald Sie das Feld ändern, wird es als persönliche Festlegung übernommen und in normaler Farbe angezeigt.</>
                            : <>An owner shown in <span className="text-primary italic font-medium">blue italics</span> is our suggestion (derived from the target roles). Once you edit it, it becomes your decision and is displayed in normal colour.</>}
                        </li>
                        <li>
                          {de
                            ? <>Status <span className="font-medium text-foreground">„Auf nächstes Jahr verschoben"</span> nutzen Sie, wenn ein Thema in diesem Jahr nicht stattfindet. Es bleibt im Plan dokumentiert, zählt aber nicht zu den offenen Punkten.</>
                            : <>Use status <span className="font-medium text-foreground">"Deferred to next year"</span> when a topic will not run this year. It stays documented in the plan but does not count as an open item.</>}
                        </li>
                        <li>{de ? "Fällig/überfällig: 12-Monats-Auffrischung automatisch." : "Due/overdue: 12-month refresh calculated automatically."}</li>
                      </ul>
                    </PopoverContent>

                  </Popover>
                  <Button size="sm" variant="outline" onClick={handleExportPlan} className="gap-1.5 h-7 text-xs">
                    <FileDown className="h-3.5 w-3.5" />
                    {de ? "Jahres-Schulungsplan (PDF)" : "Annual Training Plan (PDF)"}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="rounded-md bg-card border border-border p-2 text-center">
                  <p className="text-lg font-heading font-bold text-foreground">{uniqueParticipants}</p>
                  <p className="text-[10px] text-muted-foreground">{de ? "Teilnehmer (gesamt)" : "Total participants"}</p>
                </div>
                <div className="rounded-md bg-card border border-border p-2 text-center">
                  <p className="text-lg font-heading font-bold st-ja-text">{completedPlanCount}/{planTopics.length}</p>
                  <p className="text-[10px] text-muted-foreground">{de ? "Umgesetzt" : "Implemented"}</p>
                </div>
                <div className="rounded-md bg-card border border-border p-2 text-center">
                  <p className="text-lg font-heading font-bold st-teilweise-text">{dueSoon}</p>
                  <p className="text-[10px] text-muted-foreground">{de ? "Bald fällig (30 T.)" : "Due soon (30 d)"}</p>
                </div>
                <div className="rounded-md bg-card border border-border p-2 text-center">
                  <p className={`text-lg font-heading font-bold ${overdue > 0 ? "st-nein-text" : "text-foreground"}`}>{overdue}</p>
                  <p className="text-[10px] text-muted-foreground">{de ? "Überfällig" : "Overdue"}</p>
                </div>
              </div>

              <button
                onClick={() => setPlanOpen(o => !o)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/40 transition-colors text-left"
              >
                {planOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">{de ? "Jahres-Schulungsplan bearbeiten" : "Edit annual training plan"}</span>
                <Badge variant="outline" className="ml-auto text-[10px]">{plannedCount}/{planTopics.length}</Badge>
              </button>
              {planOpen && (
                <div className="rounded-md border border-border bg-card overflow-hidden space-y-0">
                  <div className="border-b border-border bg-muted/20 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-heading font-semibold text-foreground">{de ? "Schulungsmodule für den Jahresplan auswählen" : "Select training modules for the annual plan"}</p>
                      <Badge variant="outline" className="text-[10px]">{selectedPlanIds.length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
                      {allTopicsList.map(t => {
                        const checked = selectedPlanIds.includes(t.id);
                        const recommended = recommendedPlanIds.has(t.id);
                        return (
                          <label
                            key={t.id}
                            className={`flex items-start gap-2 rounded-md border px-2 py-1.5 text-xs cursor-pointer transition-colors ${checked ? "border-primary bg-primary/10" : recommended ? "st-teilweise-border st-teilweise-tint/50" : "border-border bg-card hover:bg-muted/30"}`}
                          >
                            <Checkbox checked={checked} onCheckedChange={() => togglePlanTopic(t)} className="mt-0.5" />
                            <span className="min-w-0 flex-1 text-foreground">{de ? t.titleDe : t.titleEn}</span>
                            {recommended && <Badge className="bg-primary/10 text-primary border-primary/30 text-[9px]">{de ? "Empfohlen" : "Recommended"}</Badge>}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase">
                    <span className="col-span-12 md:col-span-3">{de ? "Thema" : "Topic"}</span>
                    <span className="hidden md:block md:col-span-1">{de ? "Quartal" : "Quarter"}</span>
                    <span className="hidden md:block md:col-span-2">Owner</span>
                    <span className="hidden md:block md:col-span-2">{de ? "Format" : "Mode"}</span>
                    <span className="hidden md:block md:col-span-2">Status</span>
                    <span className="hidden md:block md:col-span-2 text-right">{de ? "Teilnehmer" : "Participants"}</span>
                  </div>
                  <div className="divide-y divide-border/70">
                    {planTopics.length === 0 && (
                      <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                        {de ? "Noch kein Schulungsmodul ausgewählt. Haken Sie oben Module an, damit sie in den Jahresplan übernommen werden." : "No training module selected yet. Check modules above to add them to the annual plan."}
                      </div>
                    )}
                    {planTopics.map(topic => {
                      const entry = planEntries[topic.id] ?? getDefaultPlanEntry(topic, de);
                      const participantCount = groupTotal(resolveGroups(entry)) || new Set(participantCompletions.filter(c => c.topic_id === topic.id).map(c => c.participant_name)).size;
                      const suggested = suggestOwner(topic, de);
                      const ownerIsSuggested = !entry.ownerEdited && entry.owner === suggested;
                      const deferred = entry.status === "deferred";
                      return (
                        <div key={topic.id} className={`grid grid-cols-12 gap-2 px-3 py-2 items-center ${deferred ? "opacity-60 bg-muted/20" : ""}`}>
                          <div className="col-span-12 md:col-span-3 min-w-0">
                            <p className={`text-xs font-medium truncate ${deferred ? "line-through text-muted-foreground" : "text-foreground"}`}>{de ? topic.titleDe : topic.titleEn}</p>
                            <div className="mt-1 flex gap-1 flex-wrap">
                              {topic.mandatory && <Badge className="st-nein-tint st-nein-text text-[9px]">{de ? "Pflicht" : "Mandatory"}</Badge>}
                              {onboardingIds.includes(topic.id) && <Badge variant="outline" className="text-[9px]">Onboarding</Badge>}
                              {deferred && <Badge variant="outline" className="text-[9px] st-teilweise-border st-teilweise-text">{de ? "Verschoben" : "Deferred"}</Badge>}
                            </div>
                          </div>
                          <Select value={entry.quarter} onValueChange={(value) => updatePlanEntry(topic, { quarter: value as PlanQuarter })}>
                            <SelectTrigger className="col-span-4 md:col-span-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{PLAN_QUARTERS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                          </Select>
                          <div className="col-span-8 md:col-span-2 relative">
                            <PersonnelPicker
                              value={entry.owner}
                              onChange={(next) => updatePlanEntry(topic, { owner: next, ownerEdited: next !== suggested })}
                              size="sm"
                              placeholder={de ? "Verantwortlich" : "Owner"}
                              className={`w-full ${ownerIsSuggested ? "italic text-primary border-primary/40 bg-primary/5" : ""}`}
                            />
                            {!ownerIsSuggested && entry.owner !== suggested && (
                              <button
                                type="button"
                                onClick={() => updatePlanEntry(topic, { owner: suggested, ownerEdited: false })}
                                title={de ? "Auf Vorschlag zurücksetzen" : "Reset to suggestion"}
                                className="absolute -right-1 -top-1 text-[10px] text-muted-foreground hover:text-primary bg-background border rounded-full h-4 w-4 flex items-center justify-center"
                              >
                                ↺
                              </button>
                            )}
                          </div>
                          <Select value={entry.deliveryMode} onValueChange={(value) => updatePlanEntry(topic, { deliveryMode: value as PlanDeliveryMode })}>
                            <SelectTrigger className="col-span-6 md:col-span-2 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{PLAN_DELIVERY_MODES.map(mode => <SelectItem key={mode} value={mode}>{planDeliveryLabel(mode, de)}</SelectItem>)}</SelectContent>
                          </Select>
                          <Select value={entry.status} onValueChange={(value) => updatePlanEntry(topic, { status: value as PlanStatus })}>
                            <SelectTrigger className="col-span-6 md:col-span-2 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{PLAN_STATUSES.map(status => <SelectItem key={status} value={status}>{planStatusLabel(status, de)}</SelectItem>)}</SelectContent>
                          </Select>
                          <div className="col-span-12 md:col-span-2">
                            <PlanParticipantsPicker
                              groups={resolveGroups(entry)}
                              onChange={(participantGroups) => updatePlanEntry(topic, { participantGroups, participantNames: undefined })}
                              de={de}
                            />
                            {participantCount > 0 && <p className="mt-1 text-[10px] text-right text-muted-foreground tabular-nums">{participantCount}</p>}
                          </div>
                        </div>
                      );
                    })}

                  </div>
                  <div className="px-3 py-2 bg-muted/20 text-[11px] text-muted-foreground flex flex-wrap gap-3 justify-between">
                    <span>{de ? 'Tipp: Auf nächstes Jahr verschieben = Status „Verschoben".' : "Tip: Push to next year = status 'Deferred'."}</span>
                    <span>{de ? `${completedPlanCount} abgeschlossen · ${deferredCount} verschoben` : `${completedPlanCount} completed · ${deferredCount} deferred`}</span>
                  </div>

                </div>
              )}

              <button
                onClick={() => setOnboardingOpen(o => !o)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/40 transition-colors text-left"
              >
                {onboardingOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Briefcase className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">{de ? "Onboarding-Pflichtmodule (neue Mitarbeiter)" : "Onboarding mandatory modules (new staff)"}</span>
                <Badge variant="outline" className="ml-auto text-[10px]">{onboardingIds.length}</Badge>
              </button>
              {onboardingOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 pl-6">
                  {allTopicsList.map(t => (
                    <label key={t.id} className="flex items-start gap-2 text-xs cursor-pointer hover:bg-muted/30 rounded px-1.5 py-1">
                      <Checkbox
                        checked={onboardingIds.includes(t.id)}
                        onCheckedChange={() => toggleOnboarding(t.id)}
                        className="mt-0.5"
                      />
                      <span className="text-foreground">{de ? t.titleDe : t.titleEn}</span>
                      {t.mandatory && <Badge className="st-nein-tint st-nein-text text-[9px] ml-auto">{de ? "Pflicht" : "Mand."}</Badge>}
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      <TrainingCharts categories={CATEGORIES as any} completions={completions} />

      {/* Categories */}
      <div className="space-y-3">
        {filteredCategories.map(cat => {
          const catTopics = cat.topics;
          const catCompleted = catTopics.filter(t => completions[t.id]?.completed).length;
          const catMandatory = catTopics.filter(t => t.mandatory).length;
          const isOpen = expandedCats[cat.id] ?? false;

          return (
            <Card key={cat.id} className="border-border overflow-hidden">
              <button onClick={() => toggleCat(cat.id)} className="w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left">
                {isOpen ? <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {catIcons[cat.id] || <GraduationCap className={`h-5 w-5 ${cat.iconColor}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading font-bold text-foreground">{de ? cat.titleDe : cat.titleEn}</h2>
                    <Badge variant="outline" className="text-[10px]">{catCompleted}/{catTopics.length}</Badge>
                    {catMandatory > 0 && <Badge className="st-nein-tint st-nein-text text-[10px]">{catMandatory} {de ? "Pflicht" : "Mandatory"}</Badge>}
                  </div>
                </div>
                <div className="w-16 flex-shrink-0">
                  <Progress value={catTopics.length ? (catCompleted / catTopics.length) * 100 : 0} className="h-1.5" />
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-border">
                  {catTopics.map(topic => {
                    const isDone = completions[topic.id]?.completed;
                    const topicOpen = expandedTopics[topic.id] ?? false;
                    const tp = topicProgress(topic);
                    const total = topic.contentDe.length;
                    const docTotal = topic.docContentDe.length;
                    const topicChecks = itemChecks[topic.id] ?? {};
                    const topicDocChecks = docChecks[topic.id] ?? {};

                    return (
                      <div key={topic.id} className="border-b border-border/50 last:border-b-0">
                        <div className="flex items-center gap-3 px-4 py-3">
                          <Checkbox checked={!!isDone} onCheckedChange={() => toggleComplete(topic.id, total, docTotal)} className="flex-shrink-0" />
                          <button onClick={() => toggleTopic(topic.id)} className="flex items-center gap-2 flex-1 text-left hover:bg-muted/20 rounded-md px-2 py-1 -mx-2 transition-colors min-w-0">
                            {topicOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                            <span className={`text-sm font-medium text-foreground truncate ${isDone ? "line-through opacity-60" : ""}`}>{de ? topic.titleDe : topic.titleEn}</span>
                          </button>
                          <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                            {topic.roles.slice(0, 3).map(r => {
                              const meta = ROLE_META.find(m => m.id === r);
                              if (!meta) return null;
                              return (
                                <Badge key={r} variant="outline" className="text-[9px] gap-1 px-1.5 py-0">
                                  {meta.icon}
                                  <span className="hidden sm:inline">{de ? meta.de : meta.en}</span>
                                </Badge>
                              );
                            })}
                            {topic.mandatory && <Badge className="st-nein-tint st-nein-text text-[10px]">{de ? "Pflicht" : "Mandatory"}</Badge>}
                            <span className="text-[10px] text-muted-foreground tabular-nums">{tp}%</span>
                          </div>
                        </div>

                        {topicOpen && (
                          <div className="px-4 pb-4 ml-10 space-y-4">
                            {(topic.basisDe || topic.roleRationaleDe) && (
                              <div className="rounded-lg border st-teilweise-border st-teilweise-tint/60 p-4 space-y-3">
                                {topic.basisDe && (
                                  <div>
                                    <p className="text-[11px] font-heading font-semibold uppercase tracking-wide st-teilweise-text mb-1">
                                      {de ? "Warum diese Schulung Pflicht ist" : "Why this training is mandatory"}
                                    </p>
                                    <p className="text-xs leading-relaxed text-foreground">
                                      {de ? topic.basisDe : (topic.basisEn ?? topic.basisDe)}
                                    </p>
                                  </div>
                                )}
                                {topic.roleRationaleDe && (
                                  <div>
                                    <p className="text-[11px] font-heading font-semibold uppercase tracking-wide st-teilweise-text mb-1">
                                      {de ? "Warum diese Zielgruppen" : "Why these audiences"}
                                    </p>
                                    <p className="text-xs leading-relaxed text-foreground">
                                      {de ? topic.roleRationaleDe : (topic.roleRationaleEn ?? topic.roleRationaleDe)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="rounded-lg border border-border bg-muted/20 p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <CheckSquare className="h-4 w-4 text-primary" />
                                <h4 className="text-sm font-heading font-semibold text-foreground">{de ? "Pflichtinhalte der Schulung (abhaken)" : "Mandatory training content (check off)"}</h4>
                              </div>
                              <ul className="space-y-2">
                                {(de ? topic.contentDe : topic.contentEn).map((item, i) => {
                                  const checked = !!topicChecks[i];
                                  return (
                                    <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                                      <Checkbox
                                        checked={checked}
                                        onCheckedChange={() => toggleItem(topic.id, i, total, docTotal)}
                                        className="mt-0.5 flex-shrink-0"
                                      />
                                      <span className={checked ? "line-through opacity-60" : ""}>{item}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>

                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <FileText className="h-4 w-4 text-primary" />
                                <h4 className="text-sm font-heading font-semibold text-foreground">{de ? topic.docTitleDe : topic.docTitleEn}</h4>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">{de ? "Erforderliche Bestandteile des Schulungsdokuments:" : "Required components of the training document:"}</p>
                              <ul className="space-y-2">
                                {(de ? topic.docContentDe : topic.docContentEn).map((item, i) => {
                                  const checked = !!topicDocChecks[i];
                                  return (
                                    <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                                      <Checkbox
                                        checked={checked}
                                        onCheckedChange={() => toggleDoc(topic.id, i, total, docTotal)}
                                        className="mt-0.5 flex-shrink-0"
                                      />
                                      <BookOpen className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                                      <span className={checked ? "line-through opacity-60" : ""}>{item}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>

                            {(() => {
                              // Determine primary audience track for this topic
                              const primary = topic.roles.find(r => r !== "all") || topic.roles[0] || "all";
                              const meta = ROLE_META.find(m => m.id === primary);
                              return (
                                <TopicParticipantsList
                                  topicId={topic.id}
                                  topicLabel={de ? topic.titleDe : topic.titleEn}
                                  roleTrack={primary}
                                  roleTrackLabel={meta ? (de ? meta.de : meta.en) : primary}
                                  companyName={companyName}
                                />
                              );
                            })()}

                            {isDone && completions[topic.id]?.completionDate && (
                              <p className="text-[11px] st-ja-text">
                                ✓ {de ? "Abgeschlossen am" : "Completed on"} {completions[topic.id].completionDate}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
        {filteredCategories.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {de ? "Keine Schulungen gefunden." : "No trainings found."}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer warning */}
      <Card className="st-teilweise-border st-teilweise-tint/50">
        <CardContent className="p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 st-teilweise-text flex-shrink-0 mt-0.5" />
          <div className="text-sm st-teilweise-text">
            <p className="font-medium">{nis2Active ? (de ? "Schulungspflicht gemäß NIS2" : "Training obligation per NIS2") : (de ? "Schulungspflichten" : "Training Obligations")}</p>
            <ul className="text-xs mt-1 space-y-0.5 list-disc list-inside">
              <li>{de ? "Schulungen sind rollenspezifisch (Geschäftsleitung / IT / Mitarbeiter / Einkauf / Entwickler / OT)." : "Trainings are role-specific (management / IT / staff / procurement / developers / OT)."}</li>
              <li>{de ? "Schulungsnachweise sind 5 Jahre aufzubewahren." : "Training records must be retained for 5 years."}</li>
              <li>{de ? "Neue Mitarbeiter sind vor Zugriff auf kritische Systeme zu schulen." : "New employees must be trained before accessing critical systems."}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingTab;
