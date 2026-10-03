import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useComplianceOverview } from "@/hooks/useComplianceOverview";
import { FrameworkMiniGrid, type FwMiniItem } from "@/components/FrameworkMiniGrid";
import { MapPin, Calendar, Users, Target, TrendingUp, Clock, CheckCircle2, AlertTriangle, ArrowRight, ChevronDown, ChevronRight, Loader2, Milestone, Zap, Shield, BarChart3, XCircle, Play, Info, Sparkles, TrendingDown, CalendarDays, HelpCircle, FileDown, FileText, FileSpreadsheet, RotateCcw, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { generateRoadmapPDF, generateRoadmapWord, generateRoadmapExcel, type RoadmapReportAction, type RoadmapReportBundle } from "@/lib/roadmapReportGenerator";
import { generateSoAPDF, generateSoAWord, generateSoAExcel } from "@/lib/soaGenerator";
import { format, addDays, differenceInDays } from "date-fns";
import { de as deLocale, enUS } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import AppHeader from "@/components/AppHeader";
import PipelineNav from "@/components/PipelineNav";
import SoAMultiFramework from "@/components/roadmap/SoAMultiFramework";
import SoAVersionBar from "@/components/roadmap/SoAVersionBar";
import { ModeToggle } from "@/components/ModeToggle";
import { useAssessmentMode } from "@/hooks/useAssessmentMode";
import RoadmapFrameworkPanels from "@/components/roadmap/RoadmapFrameworkPanels";
import { DeltaObligationsCard } from "@/components/roadmap/DeltaObligationsCard";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFramework, FRAMEWORKS, type FrameworkKey } from "@/contexts/FrameworkContext";
import { supabase } from "@/integrations/supabase/client";
import { listOpenDeadlines, createDeadline, cancelDeadlinesByRef } from "@/lib/deadlineEngine";
import { useToolData } from "@/hooks/useToolData";
import { KI_TOOL_KEY, KI_LS_KEY, type KiGovernanceState } from "@/lib/kiGovernance";
import { nis2Domains, type NIS2Category, type ComplianceStatus } from "@/data/nis2Controls";
import { useFrameworkCatalog } from "@/hooks/useFrameworkCatalog";
import { FRAMEWORK_DB_VALUE } from "@/data/frameworkCatalogs";
import { controlMetadata } from "@/data/controlMetadata";
import {
  buildSoAProjection,
  type SoASavedData,
  type SoAProjection,
  type SoAProjectedControl,
  type TreatmentState,
} from "@/lib/soaProjection";
import { buildRiskLinkageMap, type RiskLinkageMap } from "@/lib/soaRiskLinkage";
import { ISO_CONTROL_MAP, ISO_THEME_FALLBACK_PD, extractIsoRef, type IsoTheme } from "@/data/iso27001Effort";
import { isoRef as annexRefOf, isAnnexA } from "@/data/isoAnnexMap";
import {
  splitEffort, addEffort, sumEffort, EMPTY_EFFORT, EFFORT_ROLES, ROLE_LABEL, ROLE_COLOR,
  type EffortVector, type EffortRole,
} from "@/data/effortProfiles";
import { mapIsoToNis2 } from "@/data/nis2Mapping";
import { useBundleOwners } from "@/hooks/useBundleOwners";
import PersonnelPicker from "@/components/PersonnelPicker";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell,
  Tooltip as ReTooltip, PieChart, Pie, Legend,
  ScatterChart, Scatter, ZAxis, ReferenceLine,
} from "recharts";
import { InfoHint } from "@/components/dashboard/InfoHint";
import { useNavigate } from "react-router-dom";

import { CHART_IMPL, CHART_PHASE, CHART_SEVERITY, CHART_STATUS, CHART_STATUS_OHNE } from "@/lib/chartPalette";
import { insideSliceLabel } from "@/lib/chartLabels";
import { isIsoClause } from "@/data/isoAnnexMap";
// ── Types ──
type ActionStatus = "offen" | "laufend" | "fertig" | "blockiert";
type Phase = "now" | "next" | "later";
type PriorityLevel = "high" | "medium" | "low";

interface ActionOverride {
  status?: ActionStatus;
  owner?: string;
  due_date?: string;
  // Phase 1: ROI fields (stored alongside Step 12 action overrides, backwards compatible)
  effort_days?: number;
  // Manueller Horizont (Drag&Drop). Überschreibt die Auto-Klassifizierung.
  manualPhase?: Phase;
}
interface ActionData { actions: Record<string, ActionOverride>; }

// Phase 1: editable milestone target date + checkpoints
interface RoadmapConfig {
  targetDate?: string; // ISO date — audit / compliance deadline
  checkpointPcts?: number[]; // default [25, 50, 75, 100]
  // User-editable day windows per phase. Defaults: Now=90d (3mo), Next=180d (6mo), Later=365d (12mo)
  phaseDays?: { now?: number; next?: number; later?: number };
  // Phase 2: team capacity for auto day calculation from PT totals
  fte?: number;              // legacy single FTE (kept for back-compat with older saves)
  // Phase 3: per-role FTE allocation (preferred). Sum = total team capacity.
  fteByRole?: Partial<Record<EffortRole, number>>;
  daysMode?: "manual" | "auto"; // manual = user-set days; auto = derived from PT / capacity
}
// Manual mode: days are the DURATION of each phase (not cumulative).
// Total = now + next + later → drives required FTE.
const DEFAULT_PHASE_DAYS = { now: 90, next: 90, later: 180 } as const;
const WORKDAYS_PER_YEAR = 220; // DE standard: 365 − weekends (104) − vacation (30) − holidays (11)
const DEFAULT_FTE = 1.0;
// Default per-role FTE: 1 IT, 0.5 ISB, 0.1 MGMT, 0.2 FACH = 1.8 total
// (typical mid-size org NIS2 team — heavy IT, part-time governance)
const DEFAULT_FTE_BY_ROLE: Record<EffortRole, number> = {
  it: 1.0, isb: 0.5, mgmt: 0.1, fach: 0.2,
};
const defaultRoadmapConfig: RoadmapConfig = {
  checkpointPcts: [25, 50, 75, 100],
  phaseDays: { ...DEFAULT_PHASE_DAYS },
  fte: DEFAULT_FTE,
  fteByRole: { ...DEFAULT_FTE_BY_ROLE },
  daysMode: "auto",
};
function getPhaseDays(phase: Phase, cfg: RoadmapConfig): number {
  const v = cfg.phaseDays?.[phase];
  return typeof v === "number" && v > 0 ? v : DEFAULT_PHASE_DAYS[phase];
}
function getFteByRole(cfg: RoadmapConfig): Record<EffortRole, number> {
  const src = cfg.fteByRole ?? {};
  return {
    it:   typeof src.it === "number" && src.it >= 0 ? src.it : DEFAULT_FTE_BY_ROLE.it,
    isb:  typeof src.isb === "number" && src.isb >= 0 ? src.isb : DEFAULT_FTE_BY_ROLE.isb,
    mgmt: typeof src.mgmt === "number" && src.mgmt >= 0 ? src.mgmt : DEFAULT_FTE_BY_ROLE.mgmt,
    fach: typeof src.fach === "number" && src.fach >= 0 ? src.fach : DEFAULT_FTE_BY_ROLE.fach,
  };
}
function getTotalFte(cfg: RoadmapConfig): number {
  const r = getFteByRole(cfg);
  return r.it + r.isb + r.mgmt + r.fach;
}
function getCapacityPTPerYear(cfg: RoadmapConfig): number {
  // Prefer per-role sum; fall back to legacy single FTE if all-zero
  const total = getTotalFte(cfg);
  const fte = total > 0 ? total : (typeof cfg.fte === "number" && cfg.fte > 0 ? cfg.fte : DEFAULT_FTE);
  return fte * WORKDAYS_PER_YEAR;
}
function getCapacityPTPerYearByRole(cfg: RoadmapConfig): EffortVector {
  const r = getFteByRole(cfg);
  return {
    it:   r.it   * WORKDAYS_PER_YEAR,
    isb:  r.isb  * WORKDAYS_PER_YEAR,
    mgmt: r.mgmt * WORKDAYS_PER_YEAR,
    fach: r.fach * WORKDAYS_PER_YEAR,
  };
}
function ptToDays(pt: number, cfg: RoadmapConfig): number {
  const cap = getCapacityPTPerYear(cfg);
  if (cap <= 0) return 0;
  return Math.max(1, Math.ceil((pt / cap) * 365));
}
/**
 * Bottleneck-aware days for a phase: the slowest role determines the duration.
 * If IT needs 120 days but ISB needs 30, the phase finishes when IT is done.
 * Falls back to flat ptToDays when a role has 0 capacity but 0 demand.
 */
function ptToDaysByRole(effort: EffortVector, cfg: RoadmapConfig): number {
  const cap = getCapacityPTPerYearByRole(cfg);
  let maxDays = 0;
  for (const role of EFFORT_ROLES) {
    const demand = effort[role];
    if (demand <= 0) continue;
    const c = cap[role];
    if (c <= 0) return Math.max(maxDays, 9999); // role has demand but no capacity → blocked
    const d = Math.ceil((demand / c) * 365);
    if (d > maxDays) maxDays = d;
  }
  return Math.max(1, maxDays);
}

interface RoadmapItem {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  categoryTitle: string;
  categoryTitleEn: string;
  phase: Phase;
  priority: PriorityLevel;
  status: ActionStatus;
  owner: string;
  dueDate: string;
  isOverdue: boolean;
  linkedToHighRisk: boolean;
  implStatus: string;
  domain: string;
  // Phase 1 — ROI
  effortDays: number;
  effortByRole: EffortVector; // Phase 3 — PT split per role (IT/ISB/MGMT/FACH)
  riskReduction: number;
  roi: number; // riskReduction / max(effortDays, 0.5)
  // ISO 27001 Annex A mapping (for bundle grouping & realistic PT)
  isoRef: string | null;
  isoTitle: string | null;
  isoTitleEn: string | null;
  isoTheme: IsoTheme | null;
}

interface MilestoneItem {
  id: string;
  label: string;
  labelEn: string;
  targetPct: number;
  currentPct: number;
  achieved: boolean;
  icon: React.ReactNode;
  targetDate?: string; // Phase 1 — derived from RoadmapConfig.targetDate
}

const defaultSoAData: SoASavedData = { controls: {} };
const defaultActionData: ActionData = { actions: {} };

// ── Phase logic ──
function classifyPhase(item: {
  status: ActionStatus;
  priority: PriorityLevel;
  linkedToHighRisk: boolean;
  isOverdue: boolean;
  dueDate: string;
}): Phase {
  if (item.status === "fertig") return "now"; // completed stays in "now"
  if (item.isOverdue || item.linkedToHighRisk || item.priority === "high") return "now";
  // Frist-Nähe zieht Maßnahmen automatisch nach vorne (NIS2-Stichtag/Audit rückt näher):
  // fällig in <= 30 Tagen -> Jetzt, <= 90 Tagen -> Als Nächstes.
  if (item.dueDate) {
    const days = (new Date(item.dueDate).getTime() - Date.now()) / 86400000;
    if (days >= 0 && days <= 30) return "now";
    if (days > 30 && days <= 90) return "next";
  }
  if (item.priority === "medium" || item.status === "laufend") return "next";
  return "later";
}

/**
 * Proportionaler Ausgleich der Horizonte (Dr. Sait 2026-09-10): Die reine
 * Regel-Klassifizierung schob fast alles nach „Später" (Jetzt/Nächste nur bei
 * Hochrisiko/Frist). Ziel-Pyramide ≈ 20 % Jetzt · 30 % Nächste · 50 % Später.
 * Pflicht-„Jetzt" (überfällig, Frist ≤ 30 T, Hochrisiko) bleibt immer Jetzt;
 * der Rest wird nach Score (Risikoreduktion, Priorität, Status, ROI, Quick Win)
 * aufgefüllt. Manuell gezogene Maßnahmen werden nicht angefasst.
 */
function balanceHorizons(items: RoadmapItem[], manualIds: Set<string>) {
  const open = items.filter(i => i.status !== "fertig");
  if (open.length < 6) return;
  const targetNow = Math.round(open.length * 0.20);
  const targetNext = Math.round(open.length * 0.30);
  const score = (i: RoadmapItem) => {
    let sc = 0;
    if (i.linkedToHighRisk) sc += 4;
    sc += i.priority === "high" ? 3 : i.priority === "medium" ? 2 : 0;
    if (i.status === "laufend") sc += 2;
    if (i.implStatus === "teilweise") sc += 1;
    sc += Math.min(3, (i.riskReduction ?? 0) / 2);
    sc += Math.min(2, (i.roi ?? 0) / 5);
    if ((i.effortDays ?? 99) <= 2) sc += 1; // Quick Win
    if (i.dueDate) {
      const d = (new Date(i.dueDate).getTime() - Date.now()) / 86400000;
      if (d <= 90) sc += 2; else if (d <= 180) sc += 1;
    }
    return sc;
  };
  const movable = open.filter(i => !manualIds.has(i.id));
  const mustNow = (i: RoadmapItem) => i.isOverdue || i.linkedToHighRisk
    || (!!i.dueDate && (new Date(i.dueDate).getTime() - Date.now()) / 86400000 <= 30);
  const mustNext = (i: RoadmapItem) => !!i.dueDate && (new Date(i.dueDate).getTime() - Date.now()) / 86400000 <= 90;
  let nowCount = open.filter(i => i.phase === "now" && (manualIds.has(i.id) || mustNow(i))).length;
  let nextCount = open.filter(i => i.phase === "next" && (manualIds.has(i.id) || mustNext(i))).length;
  const ranked = movable.filter(i => !mustNow(i)).sort((a, b) => score(b) - score(a));
  for (const i of movable) { if (mustNow(i)) i.phase = "now"; }
  for (const i of ranked) {
    if (mustNext(i)) { i.phase = "next"; continue; }
    if (nowCount < targetNow) { i.phase = "now"; nowCount++; }
    else if (nextCount < targetNext) { i.phase = "next"; nextCount++; }
    else i.phase = "later";
  }
}

function computePriority(c: SoAProjectedControl, status: ActionStatus): PriorityLevel {
  if (status === "fertig") return "low";
  if (c.linkedToHighRisk) return "high";
  if (c.implStatus === "teilweise") return "medium";
  return "low";
}

// Phase 1: ROI helpers — defaults derived from priority/risk if user hasn't set values
function defaultEffortDays(priority: PriorityLevel, implStatus: string): number {
  // Fallback (no ISO mapping) — coarse priority heuristic
  if (implStatus === "teilweise") return 3;
  if (priority === "high") return 5;
  if (priority === "medium") return 3;
  return 2;
}
/**
 * Realistic PT for a single NIS2 question, derived from its ISO 27001 mapping.
 * The ISO control's full implementation effort is divided across all NIS2 questions
 * mapping to the same ISO control, so a bundle's total ≈ the ISO control's effort.
 * `teilweise` (partial) gets 40% effort. Mapped items also get a ×1.5 multiplier
 * if linked to high risk (deeper testing/documentation needed).
 */
function isoBasedEffort(
  isoRef: string | null,
  isoTheme: IsoTheme | null,
  shareCount: number,
  implStatus: string,
  linkedToHighRisk: boolean,
): number {
  let base: number;
  if (isoRef && ISO_CONTROL_MAP[isoRef]) {
    const isoPd = ISO_CONTROL_MAP[isoRef].effortDays;
    base = isoPd / Math.max(shareCount, 1);
  } else if (isoTheme) {
    base = ISO_THEME_FALLBACK_PD[isoTheme];
  } else {
    base = 3; // unmapped NIS2-specific items
  }
  if (implStatus === "teilweise") base *= 0.4;
  if (linkedToHighRisk) base *= 1.5;
  // Realism factor: BSI-Grundschutz baseline values are conservative; reduce by 40%
  // to better reflect tooling-assisted modern implementations (templates, IaC, SaaS).
  base *= 0.6;
  // Round computed default up to full days (min 1 PT) — half days only allowed via manual user override
  return Math.max(1, Math.ceil(base));

}
function riskReductionScore(c: { linkedToHighRisk: boolean; implStatus: string; priority: PriorityLevel }): number {
  // Estimated relative risk-reduction (1–10) if this control is completed
  let s = 1;
  if (c.linkedToHighRisk) s += 5;
  if (c.priority === "high") s += 2;
  else if (c.priority === "medium") s += 1;
  if (c.implStatus === "teilweise") s += 1; // already partial → quicker close
  return Math.min(10, s);
}

const PHASE_CONFIG = {
  now: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", label: { de: "Jetzt", en: "Now" }, icon: Zap },
  next: { color: "st-teilweise-text", bg: "st-teilweise-tint", border: "st-teilweise-border", label: { de: "Nächste", en: "Next" }, icon: ArrowRight },
  later: { color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/30", label: { de: "Später", en: "Later" }, icon: Clock },
};

// ── Bundle (Konsolidierung) ──
// Groups roadmap items by NIS2 category into a single deliverable bundle.
// Example: 7 controls under "Sicherheitsrichtlinien & Governance" become one
// bundle "Sicherheitsrichtlinien & Governance" with 0/7 progress, primary owner
// inherited from the most-critical member, earliest due-date, and aggregated effort.
interface RoadmapBundle {
  key: string;
  title: string;
  titleEn: string;
  members: RoadmapItem[];
  doneCount: number;
  totalCount: number;
  primaryOwner: string;
  ownerCount: number;
  earliestDue: string;
  totalEffort: number;
  effortByRole: EffortVector; // Phase 3 — aggregated PT split per role
  hasHighRisk: boolean;
  hasOverdue: boolean;
  isQuickWin: boolean;
  status: ActionStatus;
}

const PRIORITY_RANK: Record<PriorityLevel, number> = { high: 3, medium: 2, low: 1 };

function buildBundles(items: RoadmapItem[]): RoadmapBundle[] {
  // Bundle key: ISO Annex A reference (e.g. "A.5.15") when available, else NIS2 category.
  // This consolidates all NIS2 questions targeting the same ISO control into one bundle.
  const groups = new Map<string, RoadmapItem[]>();
  for (const it of items) {
    const key = it.isoRef ?? `cat:${it.category}`;
    const arr = groups.get(key) ?? [];
    arr.push(it);
    groups.set(key, arr);
  }
  const bundles: RoadmapBundle[] = [];
  for (const [key, members] of groups) {
    const sorted = [...members].sort((a, b) => {
      const p = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      if (p !== 0) return p;
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
      return b.roi - a.roi;
    });
    const primary = sorted[0];
    const dueDates = members.map(m => m.dueDate).filter(Boolean).sort();
    const owners = new Set(members.map(m => m.owner).filter(Boolean));
    const doneCount = members.filter(m => m.status === "fertig").length;
    const anyRunning = members.some(m => m.status === "laufend");
    const anyBlocked = members.some(m => m.status === "blockiert");
    const status: ActionStatus =
      doneCount === members.length ? "fertig" :
      anyBlocked ? "blockiert" :
      anyRunning ? "laufend" : "offen";

    // ISO-keyed bundle uses ISO title; fallback uses NIS2 category title.
    const isIso = !key.startsWith("cat:");
    const title = isIso && primary.isoTitle
      ? `${key} — ${primary.isoTitle}`
      : (primary.categoryTitle || primary.name);
    const titleEn = isIso && primary.isoTitleEn
      ? `${key} — ${primary.isoTitleEn}`
      : (primary.categoryTitleEn || primary.nameEn);

    const totalEffort = members.reduce((s, m) => s + (m.effortDays || 0), 0);
    const effortByRole = members.reduce<EffortVector>((acc, m) => addEffort(acc, m.effortByRole), { ...EMPTY_EFFORT });
    bundles.push({
      key,
      title,
      titleEn,
      members,
      doneCount,
      totalCount: members.length,
      primaryOwner: primary.owner,
      ownerCount: owners.size,
      earliestDue: dueDates[0] ?? "",
      totalEffort: Math.round(totalEffort * 10) / 10,
      effortByRole,
      hasHighRisk: members.some(m => m.linkedToHighRisk),
      hasOverdue: members.some(m => m.isOverdue),
      // Quick-Win: bundle of >= 3 controls solvable with low aggregated effort
      isQuickWin: members.length >= 3 && totalEffort <= 8,
      status,
    });
  }
  // Sort bundles: high-risk first, then more open work, then larger
  return bundles.sort((a, b) => {
    if (a.hasHighRisk !== b.hasHighRisk) return a.hasHighRisk ? -1 : 1;
    const aOpen = a.totalCount - a.doneCount;
    const bOpen = b.totalCount - b.doneCount;
    if (aOpen !== bOpen) return bOpen - aOpen;
    return b.totalCount - a.totalCount;
  });
}

type RoadmapViewMode = "consolidated" | "detailed";
interface RoadmapViewState { mode: RoadmapViewMode; }
const defaultRoadmapView: RoadmapViewState = { mode: "consolidated" };

// ── Component ──
// ── Inline component: stacked role-effort bar (4 segments, hover for breakdown) ──
function RoleEffortBar({ effort, total, de }: { effort: EffortVector; total: number; de: boolean }) {
  const sum = Math.max(sumEffort(effort), 0.001);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          aria-label={de ? "Aufwand nach Rolle" : "Effort by role"}
        >
          <div className="flex h-2 w-16 rounded-full overflow-hidden border border-border bg-muted">
            {EFFORT_ROLES.map((role) => {
              const pct = (effort[role] / sum) * 100;
              if (pct <= 0) return null;
              return (
                <div
                  key={role}
                  className={cn("h-full", ROLE_COLOR[role].bg)}
                  style={{ width: `${pct}%` }}
                />
              );
            })}
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {total} {de ? "PT" : "PD"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 text-xs" align="end">
        <p className="font-semibold text-sm mb-2">{de ? "Aufwand nach Rolle" : "Effort by role"}</p>
        <div className="space-y-1.5">
          {EFFORT_ROLES.map((role) => {
            const pct = Math.round((effort[role] / sum) * 100);
            return (
              <div key={role} className="flex items-center gap-2">
                <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", ROLE_COLOR[role].bg)} />
                <span className="flex-1 text-foreground">{de ? ROLE_LABEL[role].de : ROLE_LABEL[role].en}</span>
                <span className="tabular-nums font-medium text-foreground">{effort[role]} {de ? "PT" : "PD"}</span>
                <span className="tabular-nums text-muted-foreground w-9 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 pt-2 border-t flex justify-between font-semibold">
          <span>{de ? "Gesamt" : "Total"}</span>
          <span className="tabular-nums">{total} {de ? "PT" : "PD"}</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const Roadmap = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { user, tenantId } = useAuth();
  const { primary, active } = useFramework();
  // Framework keys as stored in `answers.framework` (uppercase). Always include
  // ISO27001 so bundles keyed on Annex A references still resolve.
  const activeFrameworkKeys = useMemo(
    () => Array.from(new Set(["ISO27001", primary.key, ...active.map(a => a.key)])),
    [primary.key, active],
  );
  const de = lang === "de";
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [topTab, setTopTab] = useState<"soa" | "roadmap">("soa");
  // Per-Framework-Aufschlüsselung (Umsetzung-Standard) — überlagerte (effektive)
  // Compliance je Framework. EINZIGE Antwortquelle für SoA (Node-Projektion +
  // „spätere Phase gewinnt" + Asset-Overrides bereits konsolidiert).
  const { overview: fwOverview, loading: fwLoading, umsetzungByMember, effortByControl } = useComplianceOverview();
  const fwGridItems = useMemo<FwMiniItem[]>(() =>
    (fwOverview ?? []).map(o => {
      const s = o.stats;
      const ohne = Math.max(0, s.total - s.ja - s.teilweise - s.nein - s.na);
      return {
        key: o.framework,
        label: FRAMEWORKS[(o.framework === "BSI" ? "BSI_ITGS" : o.framework) as FrameworkKey]?.displayName ?? o.framework,
        pct: s.compliancePct,
        donut: [
          { name: de ? "Umgesetzt" : "Implemented", value: s.ja,        color: CHART_STATUS.ja },
          { name: de ? "Teilweise" : "Partial",     value: s.teilweise, color: CHART_STATUS.teilweise },
          { name: de ? "Nicht umgesetzt" : "Not implemented", value: s.nein,      color: CHART_STATUS.nein },
          { name: "N.a.",                           value: s.na,        color: CHART_STATUS.na },
          { name: de ? "Unbeantwortet" : "Unanswered", value: ohne,     color: CHART_STATUS_OHNE },
        ],
        rows: [
          { label: de ? "Umgesetzt" : "Implemented", value: s.ja,        color: CHART_STATUS.ja },
          { label: de ? "Teilweise" : "Partial",     value: s.teilweise, color: CHART_STATUS.teilweise },
          { label: de ? "Nicht umgesetzt" : "Not implemented", value: s.nein,      color: CHART_STATUS.nein },
        ],
        footer: { label: de ? "Anwendbar" : "Applicable", value: s.applicable },
      };
    }),
  [fwOverview, de]);
  const [expandedPhases, setExpandedPhases] = useState<Set<Phase>>(new Set());
  const [expandedBundles, setExpandedBundles] = useState<Set<string>>(new Set());
  const [ownerPageSize, setOwnerPageSize] = useState(5);
  const [ownerPage, setOwnerPage] = useState(0);
  // Owner filter — toggled by clicking an owner card in the Ressourcen tab.
  // Reveals the assigned bundles and control cards directly in the same tab.
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  // Sequenzierung filters: direct drill-down to specific actions.
  type SeqFilters = {
    overdue: boolean;
    highRisk: boolean;
    partial: boolean;
    blocked: boolean;
    inProgress: boolean;
    quickWin: boolean;
    noDate: boolean;
    priority: "all" | "high" | "medium" | "low";
  };
  const defaultSeqFilters: SeqFilters = {
    overdue: false, highRisk: false, partial: false,
    blocked: false, inProgress: false, quickWin: false, noDate: false, priority: "all",
  };
  const [seqFilters, setSeqFilters] = useState<SeqFilters>(defaultSeqFilters);
  const seqAnyActive =
    seqFilters.overdue || seqFilters.highRisk || seqFilters.partial ||
    seqFilters.blocked || seqFilters.inProgress || seqFilters.quickWin ||
    seqFilters.noDate || seqFilters.priority !== "all" || !!ownerFilter;
  // Bericht (PDF/Word export) state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  // Shared ISO-bundle owner state (Step 8/9/15 single source of truth)
  const { resolveOwner: resolveBundleOwner, setOwner: setBundleOwner, getOwner: getBundleOwner, getDueDate: getBundleDueDate, setDueDate: setBundleDueDate } = useBundleOwners();

  // Data
  const { data: soaData, setData: setSoAData } = useToolData<SoASavedData>("soa", "nis2suite-soa", defaultSoAData);
  // AI Act: KI-Register für die SoA-Matrix System × Rolle × Kontrolle (C-5) im Export.
  const { data: kiRegister } = useToolData<KiGovernanceState>(KI_TOOL_KEY, KI_LS_KEY, { systeme: [] });
  // WIRING-FIX (7-Schritt-Kette): Roadmap (Schritt 5) MUSS dasselbe Risiko-
  // register lesen, das die Risikoanalyse (Schritt 4, Risk.tsx) unter dem
  // Schlüssel "risk-treatment" persistiert — inkl. risk_level je Treatment.
  // Zuvor las diese Stelle "nis2-treatment-engine" (Alt-NIS2Suite-Schlüssel),
  // den KEIN Schreiber mehr befüllt ⇒ treatmentData.treatments war immer leer
  // ⇒ buildRiskLinkageMap() lieferte eine leere Linkage ⇒ linkedToHighRisk war
  // dauerhaft false und die Roadmap-Priorisierung ignorierte die echte
  // Risikolage. customControls/excludedControls sind im Risk-Register nicht
  // enthalten und werden unten defensiv mit `?? []` behandelt.
  const { data: treatmentData } = useToolData<TreatmentState>(
    "risk-treatment", "risk-treatment",
    { treatments: [], manualControlIds: [], customControls: [], excludedControls: [] }
  );
  const { data: actionData, setData: setActionData } = useToolData<ActionData>(
    "nis2-execution-actions", "nis2suite-execution-actions", defaultActionData
  );
  // Phase 1 — roadmap config (milestone target date)
  const { data: roadmapConfig, setData: setRoadmapConfig } = useToolData<RoadmapConfig>(
    "nis2-roadmap-config", "nis2suite-roadmap-config", defaultRoadmapConfig
  );
  // View-mode toggle for Now/Next/Later sequencing (consolidated bundles vs detailed list)
  const { data: roadmapView, setData: setRoadmapView } = useToolData<RoadmapViewState>(
    "nis2-roadmap-view", "nis2suite-roadmap-view", defaultRoadmapView
  );
  // Überblick (Management, schreibgeschützt) ↔ Detail (Experte, volle Bearbeitung).
  const { mode, setMode } = useAssessmentMode();
  const expert = mode === "expert";
  // Im Überblick immer die konsolidierte Management-Sicht (Bündel), nie die
  // granulare Einzel-Maßnahmenliste.
  const rmMode = expert ? roadmapView.mode : "consolidated";

  // Risks are no longer re-derived here — Roadmap consumes the risk_level
  // persisted on each treatment by the Risk Analysis (Schritt 4, "risk-treatment"),
  // the single source of truth for the risk register.
  const [companyName, setCompanyName] = useState("");
  // SoA-Antwortstand = effektiver Stand aus useComplianceOverview (Node-Projektion,
  // „spätere Phase gewinnt", Asset-Overrides). DB „na" → SoA „entbehrlich".
  const dbAnswerMap = useMemo<Record<string, ComplianceStatus>>(() => {
    const m: Record<string, ComplianceStatus> = {};
    for (const o of fwOverview) o.effective.forEach((e, cid) => {
      if (e.status) m[`${o.framework}:${cid}`] = e.status === "na" ? "entbehrlich" : (e.status as ComplianceStatus);
    });
    return m;
  }, [fwOverview]);
  // control_iso mapping for active frameworks → { "a5-15": ["DORA","NIS2"], ... }
  const [isoToFrameworks, setIsoToFrameworks] = useState<Record<string, string[]>>({});
  // KPI projected completion (Step 16 ↔ Step 15) — most recent snapshot's projected_completion (days).
  const [kpiProjectedDateIso, setKpiProjectedDateIso] = useState<string | null>(null);


  useEffect(() => {
    if (!user) { setDataLoading(false); return; }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeFrameworkKeys.join("|")]);

  async function loadData() {
    setDataLoading(true);
    try {
      const userId = tenantId ?? user!.id;
      // Roadmap consumes SoA + Treatment as the single source of truth:
      // implStatus flows from Treatment (implementedControls), risk_level is
      // persisted on each treatment during generation. We no longer re-run
      // gap/risk engines here — that avoids drift with the real Risk register.
      // Only load: assessment answers (to hydrate the primary framework catalog
      // for controls the user hasn't touched in Treatment yet), company name,
      // KPI snapshots, and the ISO cross-framework map.
      const activeDbCodes = activeFrameworkKeys.map(k => FRAMEWORK_DB_VALUE[k] ?? k);
      // Seitenweise laden wie ueberall sonst (useAssessment/useRiskAnalysis):
      // control_iso und control_node_member liegen beide deutlich ueber 1000 Zeilen.
      async function fetchAllRows<T>(build: (from: number, to: number) => any): Promise<T[]> {
        const PAGE = 1000;
        const out: T[] = [];
        for (let from = 0; from < 50 * PAGE; from += PAGE) {
          const { data, error } = await build(from, from + PAGE - 1);
          if (error) throw error;
          const rows = (data ?? []) as T[];
          out.push(...rows);
          if (rows.length < PAGE) break;
        }
        return out;
      }
      const [compRes, kpiSnapRes, isoRows, nodeRows] = await Promise.all([
        supabase.from("company_profiles").select("company_name").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        // KPI-Verlauf aus der Tabelle kpi_snapshots (dieselbe Quelle wie Dashboard/KPI-Job).
        // Früher: user_tool_data "kpi_snapshots" — diesen Schlüssel schreibt nichts mehr,
        // die KPI-Prognose blieb dadurch immer leer.
        supabase.from("kpi_snapshots").select("taken_at, metrics, has_data").eq("tenant_id", userId).order("taken_at", { ascending: true }),
        fetchAllRows<{ framework: string; iso_id: string }>((f, t) =>
          supabase.from("control_iso").select("framework, iso_id")
            .in("framework", activeDbCodes)
            .order("framework").order("iso_id").range(f, t)),
        // Knoten-Netz: NIS2 hat KEINE control_iso-Zeilen (die alten wurden beim
        // v6→v7-Wechsel per FK-Cascade entfernt). Seine Beziehung zu ISO 27001
        // liegt ausschliesslich in control_node_member — ohne diese Quelle blieb
        // das NIS2-Panel dauerhaft auf 0 Buendeln, obwohl NIS2 das einzige
        // Framework mit einer vollstaendigen ISO-Zuordnung ist.
        fetchAllRows<{ node_id: string; framework: string; control_id: string }>((f, t) =>
          supabase.from("control_node_member").select("node_id, framework, control_id")
            .order("node_id").order("framework").order("control_id").range(f, t)),
      ]);

      // Referenz → Framework[]: welche Frameworks adressieren diese ISO-Referenz.
      // Zwei Quellen, beide in derselben Waehrung (Annex-/Klausel-Referenz):
      //   1. control_iso  — deklarierter Crosswalk (iso_id ist seit S1 die Referenz)
      //   2. control_node_member — strikte same-as-Knoten ueber das ISO-Mitglied
      const isoMap: Record<string, Set<string>> = {};
      for (const row of isoRows) {
        if (!row.iso_id || !row.framework) continue;
        (isoMap[row.iso_id] ??= new Set()).add(row.framework);
      }
      const membersByNode = new Map<string, typeof nodeRows>();
      for (const nm of nodeRows) {
        const arr = membersByNode.get(nm.node_id) ?? [];
        arr.push(nm);
        membersByNode.set(nm.node_id, arr);
      }
      const activeDbSet = new Set(activeDbCodes);
      for (const members of membersByNode.values()) {
        const hub = members.find(m => m.framework === "ISO27001");
        if (!hub) continue;                      // ohne ISO-Mitglied keine Referenz
        const ref = annexRefOf(hub.control_id);  // v7-Kontroll-Id → "A.5.30" / "6.1.2"
        if (!ref || ref === hub.control_id) continue; // nicht aufloesbar ⇒ nicht raten
        for (const m of members) {
          if (m.framework === "ISO27001") continue;
          if (!activeDbSet.has(m.framework)) continue;
          (isoMap[ref] ??= new Set()).add(m.framework);
        }
      }
      setIsoToFrameworks(
        Object.fromEntries(Object.entries(isoMap).map(([k, s]) => [k, Array.from(s).sort()])),
      );

      // KPI-Prognose: Durchschnittstempo der Gesamt-Compliance über den erfassten
      // Verlauf (erster → letzter Messpunkt, mind. 14 Tage Spanne), hochgerechnet
      // auf 100 % — dieselbe Regel wie die Dashboard-Prognose.
      const pts = (((kpiSnapRes as any)?.data ?? []) as Array<{ taken_at: string; metrics: Record<string, number> | null; has_data: Record<string, boolean> | null }>)
        .filter(r => r.has_data?.compliance_overall !== false && typeof r.metrics?.compliance_overall === "number")
        .map(r => ({ t: Date.parse(r.taken_at), v: r.metrics!.compliance_overall as number }))
        .filter(p => !Number.isNaN(p.t));
      const first = pts[0], last = pts[pts.length - 1];
      const spanMs = first && last ? last.t - first.t : 0;
      const slopePerMs = spanMs >= 14 * 86400000 ? (last.v - first.v) / spanMs : 0;
      if (slopePerMs > 0 && last.v < 1) {
        setKpiProjectedDateIso(new Date(last.t + (1 - last.v) / slopePerMs).toISOString());
      } else {
        setKpiProjectedDateIso(null);
      }

      if (compRes.data?.company_name) setCompanyName(compRes.data.company_name);
      // dbAnswerMap wird aus useComplianceOverview abgeleitet (siehe oben) — keine
      // rohen answers-Zeilen mehr laden.
    } catch (err) {
      console.error("Roadmap: data load failed", err);
    } finally {
      setDataLoading(false);
    }
  }

  // Primary framework's native catalog (NIS2/ISO27001 → static bundled data;
  // DORA/BSI/TISAX → loaded from public.controls and grouped by id-prefix).
  const { categories: primaryCatalogCategories, loading: catalogLoading } =
    useFrameworkCatalog(primary.key);
  const primaryFwDbValue = FRAMEWORK_DB_VALUE[primary.key];

  // ── Derived: SoA Projection ──
  const categories = useMemo<NIS2Category[]>(() => {
    // Hydrate the primary framework's catalog with its own assessment answers.
    return primaryCatalogCategories.map(cat => ({
      ...cat,
      questions: (cat.questions ?? []).map(q => ({
        ...q,
        status: dbAnswerMap[`${primaryFwDbValue}:${q.id}`] ?? null,
      })),
    }));
  }, [primaryCatalogCategories, dbAnswerMap, primaryFwDbValue]);

  const linkageMap = useMemo<RiskLinkageMap>(() => {
    return buildRiskLinkageMap(treatmentData.treatments, null, treatmentData.customControls ?? [], treatmentData.excludedControls ?? []);
  }, [treatmentData.treatments, treatmentData.customControls, treatmentData.excludedControls]);

  // SoA-Overrides sind mit `${FrameworkKey}:${controlId}` benannt; projectControl
  // erwartet die reine Control-ID → auf das Primär-Framework scopen (wie SoAMultiFramework).
  const scopedSoAData = useMemo<SoASavedData>(() => {
    const prefix = `${primary.key}:`;
    const controls: SoASavedData["controls"] = {};
    for (const [k, v] of Object.entries(soaData.controls ?? {})) {
      if (k.startsWith(prefix)) controls[k.slice(prefix.length)] = v;
      else if (!k.includes(":")) controls[k] = v; // Altbestand ohne Namespace
    }
    return { controls };
  }, [soaData, primary.key]);

  const projection = useMemo<SoAProjection>(() => {
    return buildSoAProjection({
      categories,
      savedSoAData: scopedSoAData,
      treatmentData,
      linkageMap,
    });
  }, [categories, scopedSoAData, treatmentData, linkageMap]);

  // Bündel-Schlüssel: für ISO-Kontrollen die ECHTE Annex-Nummer aus der Annex-Map
  // (die Prüffragen-IDs a5-01… sind fortlaufend, nicht A.x.y) — vorher wurde nur eine
  // in der Beschreibung zufällig vorkommende „A.x.y" erkannt (Befund P5.R.3: „4 Bündel").
  const refOf = useCallback((c: { id: string; description?: string | null; descriptionEn?: string | null }): string | null => {
    const fromMap = primary.key === "ISO27001" ? annexRefOf(c.id) : null;
    if (fromMap) return fromMap;
    return extractIsoRef(c.description ?? undefined) ?? extractIsoRef(c.descriptionEn ?? undefined);
  }, [primary.key]);

  // ── Build roadmap items ──
  const roadmapItems = useMemo<RoadmapItem[]>(() => {
    // Pass 1: collect applicable controls and their ISO refs (to share effort across siblings)
    type Prepared = {
      c: SoAProjectedControl;
      override: ActionOverride;
      status: ActionStatus;
      priority: PriorityLevel;
      isoRef: string | null;
    };
    const prepared: Prepared[] = [];
    const isoShareCount = new Map<string, number>();
    const customEffortById = new Map<string, number>();
    for (const cc of (treatmentData.customControls ?? [])) {
      if (typeof cc.effort_days === "number" && cc.effort_days > 0) {
        customEffortById.set(cc.id, cc.effort_days);
      }
    }
    for (const c of projection.allControls) {
      if (!c.applicable || c.isExcluded) continue;
      // „Spätere Phase gewinnt": eine EXPLIZITE Umsetzungs-Zeile (Phase 06) entscheidet,
      // ob die Maßnahme erledigt ist — sonst zählte die Roadmap eine in der Umsetzung
      // wieder geöffnete Aufgabe als fertig (Befund: Laufend 119 vs. „In Bearbeitung 110").
      const implRowPre = umsetzungByMember[`${primaryFwDbValue}:${c.id}`];
      const doneEffective = implRowPre ? implRowPre.status === "fertig" : c.implStatus === "ja";
      if (doneEffective) continue;
      const override = actionData.actions[c.id] ?? {};
      // EINE Quelle: Status aus der Umsetzung (Phase 06, implementation_status) hat Vorrang
      // vor dem Roadmap-eigenen Status; Gap „teilweise" zählt als „laufend" (wie in der
      // Umsetzung: Laufend = teilweise ∪ laufend). Befund P5.R.2 („In Bearbeitung 0" vs. 169).
      const impl = umsetzungByMember[`${primaryFwDbValue}:${c.id}`];
      const implStatusUms: ActionStatus | null =
        impl?.status === "fertig" ? "fertig" : impl?.status === "laufend" ? "laufend" : impl?.status === "blockiert" ? "blockiert" : null;
      const status = (implStatusUms ?? override.status ?? (c.implStatus === "teilweise" ? "laufend" : "offen")) as ActionStatus;
      const priority = computePriority(c, status);
      const isoRef = refOf(c);
      if (isoRef) isoShareCount.set(isoRef, (isoShareCount.get(isoRef) ?? 0) + 1);
      prepared.push({ c, override, status, priority, isoRef });
    }

    // Pass 2: build items, distributing ISO effort across mapped siblings
    const items: RoadmapItem[] = [];
    const manualIds = new Set<string>();
    for (const { c, override, status, priority, isoRef } of prepared) {
      // Roadmap is the latest pipeline stage → its assignments override earlier ones.
      // Priority (highest wins): per-measure Roadmap override > bundle-level (Roadmap) > earlier stage (catalog c.owner / c.dueDate).
      const bundleOwnerVal =
        (isoRef ? getBundleOwner(isoRef) : "") ||
        getBundleOwner(`cat:${c.categoryId}`);
      const bundleDueVal =
        (isoRef ? getBundleDueDate(isoRef) : "") ||
        getBundleDueDate(`cat:${c.categoryId}`);
      // Owner/Frist: Umsetzung (Phase 06) ist die spätere Phase → gewinnt vor Roadmap-Override.
      const implRow = umsetzungByMember[`${primaryFwDbValue}:${c.id}`];
      const owner = implRow?.owner || override.owner || bundleOwnerVal || c.owner || "";
      const dueDate = implRow?.due_date ?? override.due_date ?? bundleDueVal ?? c.dueDate ?? "";
      const effectiveDue = implRow?.due_date ?? override.due_date ?? bundleDueVal ?? "";
      const isOverdue = status !== "fertig" && effectiveDue ? new Date(effectiveDue) < new Date() : false;

      const iso = isoRef ? ISO_CONTROL_MAP[isoRef] : undefined;   // Klausel-Refs (4.1 …) haben keinen Annex-Eintrag → undefined
      const isoTheme: IsoTheme | null = iso?.theme ?? null;
      const isoTitle = iso?.title ?? null;
      const isoTitleEn = iso?.titleEn ?? null;
      const shareCount = isoRef ? (isoShareCount.get(isoRef) ?? 1) : 1;

      // Default order: user override > manual-control's own PT > ISO-derived default
      const computedEffort = isoBasedEffort(isoRef, isoTheme, shareCount, c.implStatus, c.linkedToHighRisk);
      const manualEffort = customEffortById.get(c.id);
      // PT-Quelle = controls.effort_pt (wie Umsetzung: MUSS 0,75 / SOLLTE 0,4 / KANN 0,2);
      // ISO-Schätzung nur als Fallback, wenn die Kontrolle keinen Aufwand trägt.
      const dbEffort = effortByControl.get(`${primaryFwDbValue}:${c.id}`);
      const effortDays = override.effort_days ?? manualEffort ?? dbEffort ?? computedEffort;
      const riskReduction = riskReductionScore({ linkedToHighRisk: c.linkedToHighRisk, implStatus: c.implStatus, priority });
      const roi = riskReduction / Math.max(effortDays, 0.5);

      // "Domain" label = primary framework catalog category title (was hard-wired
      // to nis2Domains). Fallback to control's own categoryTitle.
      const domain = c.categoryTitle ?? "";

      const item: RoadmapItem = {
        id: c.id,
        name: c.name,
        nameEn: c.nameEn,
        category: c.categoryId,
        categoryTitle: c.categoryTitle,
        categoryTitleEn: c.categoryTitleEn,
        phase: "now",
        priority,
        status,
        owner,
        dueDate,
        isOverdue,
        linkedToHighRisk: c.linkedToHighRisk,
        implStatus: c.implStatus,
        domain,
        effortDays,
        effortByRole: splitEffort(effortDays, isoRef, isoTheme),
        riskReduction,
        roi,
        isoRef,
        isoTitle,
        isoTitleEn,
        isoTheme,
      };
      // Manueller Horizont (Drag&Drop) hat Vorrang vor der Auto-Klassifizierung.
      const manual = override.manualPhase as Phase | undefined;
      item.phase = manual ?? classifyPhase(item);
      if (manual) manualIds.add(item.id);
      items.push(item);
    }
    balanceHorizons(items, manualIds);
    // Debug: explain where every number comes from (dev only)
    if (import.meta.env.DEV) {
      const all = projection.allControls;
      const sysCount = all.filter(c => !c.id.startsWith("custom-") && c.categoryId !== "user-defined").length;
      const customCount = all.length - sysCount;
      const naCount = all.filter(c => !c.applicable).length;
      const exclCount = all.filter(c => c.isExcluded).length;
      const jaCount = all.filter(c => c.applicable && !c.isExcluded && c.implStatus === "ja").length;
      console.debug("🗺️ Roadmap breakdown:", {
        "projection.allControls (TOTAL)": all.length,
        "  ↳ system (catalog)": sysCount,
        "  ↳ custom/manual": customCount,
        "filtered out — SoA NA": naCount,
        "filtered out — Excluded": exclCount,
        "filtered out — implStatus=ja (umgesetzt)": jaCount,
        "→ roadmapItems (after filters)": items.length,
      });
    }
    return items;
  }, [projection, actionData, getBundleOwner, getBundleDueDate, umsetzungByMember, effortByControl, primaryFwDbValue, refOf]);

  // ── Statistics ──
  const stats = useMemo(() => {
    // "Open" = not yet completed. Total and phase buckets exclude fertig so numbers reconcile
    // with the per-phase visual filter (which also hides fertig).
    const openItems = roadmapItems.filter(i => i.status !== "fertig");
    const total = openItems.length;
    const now = openItems.filter(i => i.phase === "now");
    const next = openItems.filter(i => i.phase === "next");
    const later = openItems.filter(i => i.phase === "later");
    const overdue = openItems.filter(i => i.isOverdue);
    const completed = roadmapItems.filter(i => i.status === "fertig");
    const inProgress = openItems.filter(i => i.status === "laufend");
    const blocked = openItems.filter(i => i.status === "blockiert");

    // Owner workload — include ALL applicable controls (also implStatus "ja") for full picture
    const ownerMap: Record<string, { total: number; completed: number; overdue: number }> = {};
    for (const c of projection.allControls) {
      if (!c.applicable || c.isExcluded) continue;
      const override = actionData.actions[c.id] ?? {};
      const isoRef = refOf(c);
      const bundleOwner = (isoRef ? getBundleOwner(isoRef) : "") || getBundleOwner(`cat:${c.categoryId}`);
      const bundleDue = (isoRef ? getBundleDueDate(isoRef) : "") || getBundleDueDate(`cat:${c.categoryId}`);
      // Latest stage wins: Umsetzung (Phase 06) > Roadmap-Override > Bündel > frühere Phase.
      const implRow = umsetzungByMember[`${primaryFwDbValue}:${c.id}`];
      const ownerName = implRow?.owner || override.owner || bundleOwner || c.owner || "";
      const o = ownerName || (de ? "Nicht zugewiesen" : "Unassigned");
      if (!ownerMap[o]) ownerMap[o] = { total: 0, completed: 0, overdue: 0 };
      ownerMap[o].total++;
      const st = (implRow?.status === "fertig" ? "fertig" : implRow?.status === "laufend" ? "laufend" : implRow?.status === "blockiert" ? "blockiert" : (override.status ?? "offen")) as ActionStatus;
      if (st === "fertig" || (!implRow && c.implStatus === "ja")) ownerMap[o].completed++;
      const dd = implRow?.due_date ?? override.due_date ?? bundleDue ?? "";
      if (st !== "fertig" && !(!implRow && c.implStatus === "ja") && dd && new Date(dd) < new Date()) ownerMap[o].overdue++;
    }

    // Completion over total applicable
    const totalApplicable = projection.allControls.filter(c => c.applicable && !c.isExcluded).length;
    const fullyDone = projection.allControls.filter(c => {
      if (!c.applicable || c.isExcluded) return false;
      const r = umsetzungByMember[`${primaryFwDbValue}:${c.id}`];
      return r ? r.status === "fertig" : c.implStatus === "ja";
    }).length + completed.length;
    // Gleiche Formel wie Gap/Umsetzung/Dashboard (computeStats): Teilweise/Laufend = ½.
    const halfDone = inProgress.length + openItems.filter(i => i.status !== "laufend" && i.implStatus === "teilweise").length;
    const completionPct = totalApplicable > 0 ? Math.round(((fullyDone + 0.5 * halfDone) / totalApplicable) * 100) : 0;

    // Transparent breakdown for the overview card — every number traceable
    const all = projection.allControls;
    const catalogCount = all.filter(c => !c.id.startsWith("custom-") && c.categoryId !== "user-defined").length;
    const customCount = all.length - catalogCount;
    const naCount = all.filter(c => !c.applicable).length;
    const excludedCount = all.filter(c => c.applicable && c.isExcluded).length;
    const inScope = all.length - naCount - excludedCount;
    const umgesetztAssessment = all.filter(c => {
      if (!c.applicable || c.isExcluded) return false;
      const r = umsetzungByMember[`${primaryFwDbValue}:${c.id}`];
      return r ? r.status === "fertig" : c.implStatus === "ja";
    }).length;
    const erledigtExecution = completed.length;
    const openTotal = inScope - umgesetztAssessment - erledigtExecution;
    const breakdown = {
      catalogCount,
      customCount,
      totalCatalog: all.length,
      naCount,
      excludedCount,
      inScope,
      umgesetztAssessment,
      erledigtExecution,
      openTotal,
      nowCount: now.filter(i => i.status !== "fertig").length,
      nextCount: next.length,
      laterCount: later.length,
    };
    return { total, now, next, later, overdue, completed, inProgress, blocked, ownerMap, completionPct, totalApplicable, fullyDone, halfDone, breakdown };
  }, [roadmapItems, projection, actionData, de, getBundleOwner, getBundleDueDate, umsetzungByMember, primaryFwDbValue, refOf]);

  // ── Milestones (with editable target date) ──
  const milestones = useMemo<MilestoneItem[]>(() => {
    const pct = stats.completionPct;
    const targetISO = roadmapConfig.targetDate;
    const now = new Date();
    const target = targetISO ? new Date(targetISO) : null;
    const daysToTarget = target ? Math.max(1, differenceInDays(target, now)) : null;
    // Distribute checkpoints linearly between now and target
    const dateFor = (pctVal: number): string | undefined => {
      if (!target || !daysToTarget) return undefined;
      // Already achieved checkpoints have no future date
      if (pct >= pctVal) return undefined;
      // 100% milestone must snap exactly to the target date (no rounding drift)
      if (pctVal >= 100) return target.toISOString();
      const remaining = 100 - pct;
      if (remaining <= 0) return undefined;
      const share = (pctVal - pct) / remaining;
      return addDays(now, Math.round(daysToTarget * share)).toISOString();
    };
    const cp = roadmapConfig.checkpointPcts ?? [25, 50, 75, 100];
    const p1 = cp[0] ?? 25;
    const p2 = cp[1] ?? 50;
    const p3 = cp[2] ?? 75;
    return [
      { id: "m1", label: "Kritische Kontrollen abgeschlossen", labelEn: "Critical Controls Completed",
        targetPct: p1, currentPct: pct, achieved: pct >= p1, icon: <Shield className="h-4 w-4" />, targetDate: dateFor(p1) },
      { id: "m2", label: `${p2}% Umsetzung erreicht`, labelEn: `${p2}% Implementation Reached`,
        targetPct: p2, currentPct: pct, achieved: pct >= p2, icon: <TrendingUp className="h-4 w-4" />, targetDate: dateFor(p2) },
      { id: "m3", label: "Quick-Wins abgeschlossen", labelEn: "Quick Wins Completed",
        targetPct: p3, currentPct: pct, achieved: pct >= p3, icon: <Zap className="h-4 w-4" />, targetDate: dateFor(p3) },
      { id: "m4", label: "Audit-bereit", labelEn: "Audit-Ready",
        targetPct: 100, currentPct: pct, achieved: pct >= 100, icon: <CheckCircle2 className="h-4 w-4" />, targetDate: dateFor(100) },
    ];
  }, [stats.completionPct, roadmapConfig.targetDate, roadmapConfig.checkpointPcts]);

  // Update a single checkpoint percentage (index 0-2). Validates ascending order.
  const setCheckpointPct = (idx: number, raw: number) => {
    const cur = [...(roadmapConfig.checkpointPcts ?? [25, 50, 75, 100])];
    const v = Math.max(1, Math.min(99, Math.round(raw)));
    cur[idx] = v;
    // Enforce strict ascending order, locking 100 at the end.
    const min = idx === 0 ? 1 : (cur[idx - 1] ?? 1) + 1;
    const max = idx === 2 ? 99 : (cur[idx + 1] ?? 100) - 1;
    cur[idx] = Math.max(min, Math.min(max, v));
    cur[3] = 100;
    setRoadmapConfig({ ...roadmapConfig, checkpointPcts: cur });
  };

  // ── Phase 1 — Quick-Win scatter data (open items only) ──
  const quickWinData = useMemo(() => {
    return roadmapItems
      .filter(i => i.status !== "fertig")
      .map(i => ({
        id: i.id,
        name: de ? i.name : i.nameEn,
        x: i.effortDays,
        y: i.riskReduction,
        phase: i.phase,
        roi: i.roi,
        owner: i.owner,
      }));
  }, [roadmapItems, de]);

  // ── Phase 1 — Residual risk forecast ──
  const forecast = useMemo(() => {
    const open = roadmapItems.filter(i => i.status !== "fertig");
    const now = open.filter(i => i.phase === "now");
    const next = open.filter(i => i.phase === "next");
    const later = open.filter(i => i.phase === "later");
    const totalHighRisk = open.filter(i => i.linkedToHighRisk).length;
    const nowHighRisk = now.filter(i => i.linkedToHighRisk).length;
    const currentOpenMeasures = stats.breakdown.openTotal;
    const nowMeasures = stats.breakdown.nowCount;
    const nowReductionPct = currentOpenMeasures > 0
      ? Math.round((nowMeasures / currentOpenMeasures) * 100)
      : 0;
    const nowEffortDays = Math.round(now.reduce((s, i) => s + i.effortDays, 0));
    const nextEffortDays = Math.round(next.reduce((s, i) => s + i.effortDays, 0));
    const laterEffortDays = Math.round(later.reduce((s, i) => s + i.effortDays, 0));
    const sumByRole = (arr: RoadmapItem[]): EffortVector =>
      arr.reduce<EffortVector>((acc, i) => addEffort(acc, i.effortByRole), { ...EMPTY_EFFORT });
    const nowEffortByRole = sumByRole(now);
    const nextEffortByRole = sumByRole(next);
    const laterEffortByRole = sumByRole(later);
    const totalEffortByRole = addEffort(addEffort(nowEffortByRole, nextEffortByRole), laterEffortByRole);
    const currentRiskIndex = currentOpenMeasures;
    const residualRiskIndex = Math.max(0, currentOpenMeasures - nowMeasures);
    return {
      totalHighRisk, nowHighRisk,
      nowReductionPct, nowEffortDays, nextEffortDays, laterEffortDays,
      nowEffortByRole, nextEffortByRole, laterEffortByRole, totalEffortByRole,
      nowCount: now.length, nextCount: next.length, laterCount: later.length,
      currentRiskIndex, residualRiskIndex,
    };
  }, [roadmapItems, stats.breakdown.openTotal, stats.breakdown.nowCount]);


  // ── Chart data ──
  const phaseChartData = useMemo(() => [
    { name: de ? "Jetzt" : "Now", value: stats.now.filter(i => i.status !== "fertig").length, fill: CHART_PHASE.now },
    { name: de ? "Nächste" : "Next", value: stats.next.length, fill: CHART_PHASE.next },
    { name: de ? "Später" : "Later", value: stats.later.length, fill: CHART_PHASE.later },
  ], [stats, de]);

  const statusChartData = useMemo(() => [
    { name: de ? "Offen" : "Open", value: roadmapItems.filter(i => i.status === "offen").length, fill: CHART_IMPL.offen },
    { name: de ? "Laufend" : "In Progress", value: roadmapItems.filter(i => i.status === "laufend").length, fill: CHART_IMPL.laufend },
    { name: de ? "Fertig" : "Done", value: roadmapItems.filter(i => i.status === "fertig").length, fill: CHART_IMPL.fertig },
    { name: de ? "Blockiert" : "Blocked", value: roadmapItems.filter(i => i.status === "blockiert").length, fill: CHART_IMPL.blockiert },
  ].filter(d => d.value > 0), [roadmapItems, de]);

  const ownerChartData = useMemo(() => {
    return Object.entries(stats.ownerMap)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, d]) => ({
        name: name.length > 10 ? name.slice(0, 8) + "…" : name,
        fullName: name,
        total: d.total,
        completed: d.completed,
        overdue: d.overdue,
        open: d.total - d.completed - d.overdue,
      }));
  }, [stats.ownerMap]);

  const ownerFilteredPhases = useMemo(() => {
    if (!ownerFilter) return [];
    const unassignedLabel = de ? "Nicht zugewiesen" : "Unassigned";
    const ownerMatches = (value?: string) =>
      ownerFilter === unassignedLabel ? !value : value === ownerFilter;

    return (["now", "next", "later"] as Phase[])
      .map((phase) => {
        const phaseItems = roadmapItems.filter(i => i.phase === phase && i.status !== "fertig");
        const bundles = buildBundles(phaseItems).filter((bundle) => {
          const effectiveBundleOwner = resolveBundleOwner(bundle.key, bundle.members.map(m => m.owner));
          return ownerMatches(effectiveBundleOwner) || bundle.members.some(m => ownerMatches(m.owner));
        });
        return { phase, bundles };
      })
      .filter(group => group.bundles.length > 0);
  }, [de, ownerFilter, roadmapItems, resolveBundleOwner]);

  const togglePhase = (phase: Phase) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      next.has(phase) ? next.delete(phase) : next.add(phase);
      return next;
    });
  };

  // Phase 1 — patch effort/cost for one control
  const updateActionField = (controlId: string, patch: Partial<ActionOverride>) => {
    setActionData({
      ...actionData,
      actions: {
        ...actionData.actions,
        [controlId]: { ...(actionData.actions[controlId] ?? {}), ...patch },
      },
    });
  };

  // Drag&Drop: einen ganzen Bündel/Karte (mehrere Control-IDs) in EINEM Schritt in
  // einen anderen Horizont verschieben. manualPhase überschreibt die Auto-Sequenz.
  const moveToPhase = (controlIds: string[], phase: Phase) => {
    if (controlIds.length === 0) return;
    const actions = { ...actionData.actions };
    for (const id of controlIds) actions[id] = { ...(actions[id] ?? {}), manualPhase: phase };
    setActionData({ ...actionData, actions });
  };
  const [dragOverPhase, setDragOverPhase] = useState<Phase | null>(null);

  // E1: manuell (per Drag&Drop) gesetzte Horizonte wieder auf Auto-Sequenz zurücksetzen.
  const hasManualPhase = Object.values(actionData.actions).some((a: any) => a && a.manualPhase);
  const resetAllPhases = () => {
    const actions: Record<string, ActionOverride> = {};
    for (const [id, a] of Object.entries(actionData.actions)) {
      const { manualPhase, ...rest } = (a ?? {}) as ActionOverride;
      actions[id] = rest;
    }
    setActionData({ ...actionData, actions });
    toast.success(de ? "Auto-Sequenz wiederhergestellt" : "Auto sequence restored");
  };
  // K1: aus dem Ziel-/Audittermin automatisch EINE deduplizierte Frist erzeugen
  // (ref roadmap/audit-target). So ist die Fristen-Kachel nicht leer und der
  // Termin taucht in Countdown/Prognose auf. Idempotent: vorhandene wird ersetzt,
  // kein Termin -> vorhandene wird storniert. Fehler still ignoriert.
  const ensureAuditDeadline = async (iso?: string | null) => {
    const tid = tenantId ?? user?.id;
    if (!tid) return;
    try {
      if (!iso) { await cancelDeadlinesByRef(supabase, "roadmap", "audit-target"); return; }
      const open = await listOpenDeadlines(supabase);
      const ex = open.find(d => d.ref_table === "roadmap" && d.ref_id === "audit-target");
      if (ex && ex.due_at === iso) return;
      await cancelDeadlinesByRef(supabase, "roadmap", "audit-target");
      await createDeadline(supabase, {
        tenant_id: tid, kind: "audit_cycle", framework: null,
        ref_table: "roadmap", ref_id: "audit-target",
        label: de ? "Ziel-/Audittermin (Roadmap)" : "Target / audit date (roadmap)",
        due_at: iso,
      });
    } catch { /* still ignorieren */ }
  };

  const setTargetDate = (iso: string | undefined) => {
    setRoadmapConfig({ ...roadmapConfig, targetDate: iso });
    ensureAuditDeadline(iso ?? null);
  };

  // Backfill: bereits gesetzter Zieltermin ohne Frist -> einmal pro Mount erzeugen.
  const auditSeededRef = useRef(false);
  useEffect(() => {
    if (auditSeededRef.current) return;
    if (!(tenantId ?? user?.id) || !roadmapConfig.targetDate) return;
    auditSeededRef.current = true;
    ensureAuditDeadline(roadmapConfig.targetDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, roadmapConfig.targetDate]);
  const fmtDate = (iso?: string) => iso ? format(new Date(iso), "dd.MM.yyyy", { locale: de ? deLocale : enUS }) : "—";

  // ── Bericht: data-first PDF/Word export (no screenshot-only report pages) ──

  // Excel-Export (CSV, ohne Zusatz-Bibliothek). ';'-Trenner + BOM = Excel-DE-kompatibel.
  function handleCsvExport() {
    setReportOpen(false);
    const cell = (v: any) => {
      const s = String(v ?? "").replace(/"/g, '""');
      return /[";\n]/.test(s) ? `"${s}"` : s;
    };
    const header = de
      ? ["Horizont", "Maßnahme", "Priorität", "Status", "Verantwortlich", "Fällig", "Aufwand (PT)", "Hohes Risiko", "Framework/Domäne"]
      : ["Horizon", "Measure", "Priority", "Status", "Owner", "Due", "Effort (PD)", "High risk", "Framework/Domain"];
    const rows: string[] = [header.map(cell).join(";")];
    for (const phase of ["now", "next", "later"] as Phase[]) {
      const label = de ? PHASE_CONFIG[phase].label.de : PHASE_CONFIG[phase].label.en;
      for (const it of roadmapItems.filter(i => i.phase === phase && i.status !== "fertig")) {
        rows.push([
          label, de ? it.name : it.nameEn, it.priority, it.status, it.owner ?? "",
          it.dueDate ?? "", String(it.effortDays), it.linkedToHighRisk ? (de ? "ja" : "yes") : "",
          it.domain ?? "",
        ].map(cell).join(";"));
      }
    }
    const blob = new Blob(["﻿" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Roadmap_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success(de ? "Roadmap als CSV exportiert" : "Roadmap exported as CSV");
  }

  async function handleReport(kind: "pdf" | "word" | "excel") {
    setReportOpen(false);
    if (reportLoading) return;
    setReportLoading(true);
    const { pdfProgress } = await import("@/lib/pdfProgress");
    pdfProgress.start(de ? "Roadmap-Bericht" : "Roadmap report");
    pdfProgress.setTotal(1, "prepare");
    try {
      const phases: Phase[] = ["now", "next", "later"];
      const reportBundles: RoadmapReportBundle[] = phases.flatMap((phase) =>
        buildBundles(roadmapItems.filter(i => i.phase === phase && i.status !== "fertig")).map((b) => ({
          phase,
          bundleKey: b.key,
          title: b.title,
          titleEn: b.titleEn,
          totalCount: b.totalCount,
          doneCount: b.doneCount,
          owner: resolveBundleOwner(b.key, b.members.map(m => m.owner)),
          dueDate: getBundleDueDate(b.key) || b.earliestDue,
          totalEffort: b.totalEffort,
          hasHighRisk: b.hasHighRisk,
          hasOverdue: b.hasOverdue,
          isQuickWin: b.isQuickWin,
          status: b.status,
          nis2Ref: mapIsoToNis2(b.key.startsWith("cat:") ? null : b.key),
        }))
      );
      const bundleByKey = new Map(reportBundles.map(b => [`${b.phase}:${b.bundleKey}`, b]));
      const reportActions: RoadmapReportAction[] = roadmapItems.map((item) => {
        const bundleKey = item.isoRef ?? `cat:${item.category}`;
        const bundle = bundleByKey.get(`${item.phase}:${bundleKey}`);
        return {
          id: item.id,
          phase: item.phase,
          name: item.name,
          nameEn: item.nameEn,
          categoryTitle: item.categoryTitle,
          categoryTitleEn: item.categoryTitleEn,
          bundleKey,
          bundleTitle: bundle?.title ?? item.isoTitle ?? item.categoryTitle,
          bundleTitleEn: bundle?.titleEn ?? item.isoTitleEn ?? item.categoryTitleEn,
          priority: item.priority,
          status: item.status,
          owner: item.owner,
          dueDate: item.dueDate,
          isOverdue: item.isOverdue,
          linkedToHighRisk: item.linkedToHighRisk,
          implStatus: item.implStatus,
          effortDays: item.effortDays,
          isoRef: item.isoRef,
          nis2Ref: mapIsoToNis2(item.isoRef),
        };
      });
      const bundleCount = reportBundles.length;
      const ownerCount = Object.keys(stats.ownerMap).length;
      const reportData = {
        stats: {
          totalApplicable: stats.totalApplicable,
          fullyDone: stats.fullyDone,
          completionPct: stats.completionPct,
          nowOpenCount: stats.now.filter(i => i.status !== "fertig").length,
          nextCount: stats.next.length,
          laterCount: stats.later.length,
          overdueCount: stats.overdue.length,
          inProgressCount: stats.inProgress.length,
          bundleCount,
          ownerCount,
          targetDate: roadmapConfig.targetDate,
        },
        actions: reportActions,
        bundles: reportBundles,
        owners: Object.entries(stats.ownerMap)
          .map(([name, d]) => ({ name, total: d.total, completed: d.completed, overdue: d.overdue, open: d.total - d.completed - d.overdue }))
          .sort((a, b) => b.total - a.total),
      };
      pdfProgress.update(1);

      if (kind === "pdf") {
        await generateRoadmapPDF(reportData, lang, companyName);
      } else if (kind === "excel") {
        await generateRoadmapExcel(reportData, lang, companyName);
      } else {
        await generateRoadmapWord(reportData, lang, companyName);
      }
      toast.success(de ? "Bericht heruntergeladen" : "Report downloaded");
    } catch (err) {
      console.error("Roadmap report failed:", err);
      toast.error(de ? "Berichterstellung fehlgeschlagen" : "Report generation failed");
    } finally {
      pdfProgress.end();
      setReportLoading(false);
    }
  }

  // ── SoA export (framework-native) — uses the same projection that drives the roadmap ──
  async function handleSoAExport(kind: "pdf" | "word" | "excel") {
    setReportOpen(false);
    if (reportLoading) return;
    setReportLoading(true);
    const { pdfProgress } = await import("@/lib/pdfProgress");
    pdfProgress.start(de ? "SoA-Bericht" : "SoA report");
    pdfProgress.setTotal(1, "prepare");
    try {
      // Framework des Katalogs: steuert Titel („Anhang zur SoA" außer ISO 27001) und Rechtsstand.
      const ctx = { frameworkKey: primary.key, frameworkLabel: de ? primary.shortDe : primary.shortEn, aiSystems: kiRegister.systeme ?? [] };
      if (kind === "pdf") {
        await generateSoAPDF(projection, lang, null, ctx);
      } else if (kind === "excel") {
        await generateSoAExcel(projection, lang, ctx);
      } else {
        await generateSoAWord(projection, lang, null, ctx);
      }
      toast.success(de ? "SoA heruntergeladen" : "SoA downloaded");
    } catch (err) {
      console.error("SoA export failed:", err);
      toast.error((de ? "SoA-Export fehlgeschlagen" : "SoA export failed") + (err instanceof Error && /inkonsistent|inconsistent/.test(err.message) ? ` — ${err.message}` : ""));
    } finally {
      pdfProgress.end();
      setReportLoading(false);
    }
  }



  if (dataLoading || fwLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* AppHeader artık AppLayout'ta global */}
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // CWS-Kernregel: ohne Framework-Auswahl KEIN ISO27001-Default-Katalog zeigen.
  if (active.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 pt-2"><PipelineNav /></div>
        <main className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
          <div className="inline-flex p-3 rounded-xl bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold font-heading text-foreground">
            {de ? "Noch kein Framework ausgewählt" : "No framework selected yet"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {de
              ? "Wählen Sie zuerst in Schritt 1 (Unternehmensprofil) die relevanten Frameworks aus. SoA und Roadmap zeigen dann ausschließlich die Kontrollen dieser Frameworks."
              : "Please select the relevant frameworks in Step 1 (Company Profile) first. SoA and Roadmap will then show only those frameworks' controls."}
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* AppHeader artık AppLayout'ta global */}
      <div className="max-w-7xl mx-auto px-4 pt-2"><PipelineNav /></div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-heading text-foreground flex items-center">
              {de ? "SoA & Roadmap" : "SoA & Roadmap"}
              <RoadmapRichTip tipKey="page" de={de} />
            </h1>
            <p className="text-sm text-muted-foreground">
              {de
                ? "Analyse → Behandlung → SoA (Geltungsbereich) → Roadmap (Verantwortliche & Zeitplan)"
                : "Analysis → Treatment → SoA (Scope) → Roadmap (Owners & Schedule)"}
            </p>
          </div>
          {hasManualPhase && (
            <Button variant="ghost" size="sm" className="gap-2" onClick={resetAllPhases}
                    title={de ? "Manuell verschobene Karten wieder automatisch einsortieren" : "Re-sort manually moved cards automatically"}>
              <RotateCcw className="h-4 w-4" /> {de ? "Auto-Sequenz" : "Auto sequence"}
            </Button>
          )}
          <Popover open={reportOpen} onOpenChange={setReportOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" disabled={reportLoading}>
                {reportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                {de ? "Bericht" : "Report"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-1">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {de ? "Roadmap-Bericht" : "Roadmap report"}
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => handleReport("pdf")}>
                <FileDown className="h-3.5 w-3.5" /> PDF
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => handleReport("word")}>
                <FileText className="h-3.5 w-3.5" /> Word
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs" onClick={handleCsvExport}>
                <FileSpreadsheet className="h-3.5 w-3.5" /> Excel (CSV)
              </Button>
              <div className="my-1 border-t border-border" />
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {de ? "Anwendbarkeitserklärung (SoA)" : "Statement of Applicability (SoA)"}
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => handleSoAExport("pdf")}>
                <FileDown className="h-3.5 w-3.5" /> PDF
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => handleSoAExport("word")}>
                <FileText className="h-3.5 w-3.5" /> Word
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => handleSoAExport("excel")}>
                <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
              </Button>
            </PopoverContent>
          </Popover>
          <ModeToggle de={de} />
        </div>

        {/* Top tabs: SoA (input) → Roadmap (planning) */}
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
          <button
            onClick={() => setTopTab("soa")}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2 ${
              topTab === "soa"
                ? "bg-primary text-primary-foreground shadow-md ring-1 ring-primary/30 font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60 font-medium"
            }`}
          >
            <Shield className="h-4 w-4" />
            {de ? "1. Anwendbarkeit (SoA)" : "1. Applicability (SoA)"}
          </button>
          <button
            onClick={() => setTopTab("roadmap")}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2 ${
              topTab === "roadmap"
                ? "bg-primary text-primary-foreground shadow-md ring-1 ring-primary/30 font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60 font-medium"
            }`}
          >
            <MapPin className="h-4 w-4" />
            {de ? "2. Roadmap" : "2. Roadmap"}
          </button>
        </div>

        {topTab === "soa" && (
          <div className="space-y-4">
            {expert ? (<>
            <SoAVersionBar
              tenantId={tenantId ?? user?.id}
              projection={projection}
              approvedBy={user?.email}
              de={de}
            />
            <SoAMultiFramework
              frameworks={active}
              primaryKey={primary.key}
              soaData={soaData}
              setSoAData={setSoAData}
              treatmentData={treatmentData}
              linkageMap={linkageMap}
              dbAnswerMap={dbAnswerMap}
              lang={lang}
            />
            </>) : (() => {
              // ── ÜBERBLICK: SoA-Abdeckung je Thema (Kategorie) als Balken ──
              // ISO 27001: SoA = nur Annex A (6.1.3 d) — Klauseln 4–10 sind Pflicht und
              // werden hier nicht als „SoA-Geltungsbereich" gezählt (Detail: Info-Box).
              const soaControls = ((projection.allControls ?? []) as any[])
                .filter(c => !(primary.key === "ISO27001" && isIsoClause(String(c.id))));
              const clauseN = ((projection.allControls ?? []) as any[]).length - soaControls.length;
              const cats = new Map<string, { title: string; applicable: number; done: number; teil: number; excluded: number; na: number }>();
              for (const c of soaControls) {
                const key = c.categoryId ?? "—";
                const title = (de ? (c.categoryTitle || key) : (c.categoryTitleEn || c.categoryTitle || key)) as string;
                if (!cats.has(key)) cats.set(key, { title, applicable: 0, done: 0, teil: 0, excluded: 0, na: 0 });
                const e = cats.get(key)!;
                if (!c.applicable) e.na++;
                else if (c.isExcluded) e.excluded++;
                else { e.applicable++; if (c.implStatus === "ja") e.done++; else if (c.implStatus === "teilweise") e.teil++; }
              }
              const rows = [...cats.values()]
                .map(e => ({ ...e, pct: e.applicable > 0 ? Math.round(((e.done + 0.5 * e.teil) / e.applicable) * 100) : 0 }))
                .sort((a, b) => a.pct - b.pct);
              const totApplicable = rows.reduce((s, r) => s + r.applicable, 0);
              const totDone = rows.reduce((s, r) => s + r.done, 0);
              const totTeil = rows.reduce((s, r) => s + r.teil, 0);
              const totExcluded = rows.reduce((s, r) => s + r.excluded, 0);
              const totNa = rows.reduce((s, r) => s + r.na, 0);
              const totOffen = Math.max(0, totApplicable - totDone - totTeil);
              const overall = totApplicable > 0 ? Math.round(((totDone + 0.5 * totTeil) / totApplicable) * 100) : 0;
              const donut = [
                { name: de ? "Umgesetzt" : "Implemented", n: totDone, color: CHART_STATUS.ja },
                { name: de ? "Teilweise" : "Partial", n: totTeil, color: CHART_STATUS.teilweise },
                { name: de ? "Nicht umgesetzt" : "Not implemented", n: totOffen, color: CHART_STATUS.nein },
                { name: de ? "Ausgeschlossen" : "Excluded", n: totExcluded, color: CHART_STATUS.na },
                { name: "N.a.", n: totNa, color: CHART_STATUS_OHNE },
              ].filter(d => d.n > 0);
              return (
                <div className="space-y-4">
                  {/* ── Genel SoA-Geltungsbereich (Donut) ── */}
                  <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="relative w-full sm:w-56 shrink-0" style={{ height: 200 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={donut} dataKey="n" nameKey="name" cx="50%" cy="50%" innerRadius={64} outerRadius={94} paddingAngle={2}>
                            {donut.map((d, i) => <Cell key={i} fill={d.color} stroke="hsl(var(--card))" strokeWidth={2} />)}
                          </Pie>
                          <ReTooltip contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold text-foreground tabular-nums">{overall}%</span>
                        <span className="text-[11px] text-muted-foreground">{de ? "umgesetzt" : "implemented"}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="text-base font-semibold text-foreground">{de ? "SoA-Geltungsbereich (gesamt)" : "SoA scope (overall)"}</div>
                      {donut.map((d, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-sm">
                          <span className="inline-block w-3 h-3 rounded-sm shrink-0" style={{ background: d.color }} />
                          <span className="text-muted-foreground flex-1 min-w-0 truncate">{d.name}</span>
                          <b className="text-foreground tabular-nums">{d.n}</b>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <div className="text-base font-semibold text-foreground">{de ? "SoA-Abdeckung je Thema" : "SoA coverage by topic"}</div>
                      <div className="text-xs text-muted-foreground">{de ? "Umgesetzt (+½ teilweise) / anwendbar" : "Implemented (+½ partial) / applicable"} · <span className="font-semibold text-foreground">{overall}%</span></div>
                    </div>
                    {rows.length === 0 ? (
                      <div className="text-sm text-muted-foreground">{de ? "Noch keine Kontrollen im Scope." : "No controls in scope yet."}</div>
                    ) : rows.map((r, i) => {
                      const band = r.applicable === 0 ? "muted" : r.pct >= 75 ? "ok" : r.pct >= 40 ? "warn" : "bad";
                      const bar = band === "ok" ? "st-ja-bg" : band === "warn" ? "st-teilweise-bg" : band === "bad" ? "st-nein-bg" : "bg-muted-foreground/40";
                      const card = band === "ok" ? "st-ja-border st-ja-tint st-ja-text"
                        : band === "warn" ? "st-teilweise-border st-teilweise-tint st-teilweise-text"
                        : band === "bad" ? "st-nein-border st-nein-tint st-nein-text"
                        : "border-border bg-muted/30 text-muted-foreground";
                      return (
                      <button key={i} type="button" onClick={() => setMode("expert")}
                              title={de ? "Für Details in den Detail-Modus wechseln" : "Switch to Detail for the control list"}
                              className="w-full flex items-center gap-4 rounded-xl border border-border bg-card px-3 py-2.5 hover:border-accent hover:shadow-sm transition-all group">
                        <span className="text-sm md:text-base text-foreground flex-1 min-w-0 truncate text-left font-semibold group-hover:text-accent" title={r.title}>{r.title}</span>
                        <div className="w-32 sm:w-48 h-2.5 rounded-full bg-muted overflow-hidden shrink-0">
                          <div className={`h-full rounded-full ${bar} transition-all duration-500`} style={{ width: `${Math.max(r.pct, 2)}%` }} />
                        </div>
                        <div className={`shrink-0 rounded-lg border px-2.5 py-1 text-right leading-tight ${card}`}>
                          <span className="text-base font-bold tabular-nums">{r.pct}%</span>
                          <span className="block text-[10px] text-muted-foreground tabular-nums">{r.done}/{r.applicable}</span>
                        </div>
                      </button>
                      );
                    })}
                  </div>
                  {fwGridItems.length > 0 && (
                    <FrameworkMiniGrid
                      items={fwGridItems}
                      title={de ? "Aufschlüsselung je Framework" : "Breakdown by framework"}
                      subtitle={de ? "— umgesetzt / offen je gewähltem Framework" : "— implemented / open per selected framework"}
                    />
                  )}
                  <div className="text-[11px] text-muted-foreground">
                    {de ? "Vollständige Anwendbarkeitserklärung (je Kontrolle, Begründungen, Version freigeben) im " : "Full Statement of Applicability (per control, justifications, version release) in "}
                    <span className="font-semibold text-foreground">Detail</span>.
                    {clauseN > 0 && (
                      <>
                        {" "}
                        {de
                          ? `ISO 27001: ${clauseN} Klausel-Anforderungen (4–10, Pflicht) sind nicht Teil der SoA und hier nicht gezählt.`
                          : `ISO 27001: ${clauseN} clause requirements (4–10, mandatory) are not part of the SoA and not counted here.`}
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}


        {topTab === "roadmap" && (
        <>
        {/* Maßnahmen-Übersicht — elegant funnel hero */}
        {(() => {
          const b = stats.breakdown;
          const total = Math.max(b.totalCatalog, 1);
          const pct = (n: number) => Math.max(2, Math.round((n / total) * 100));
          const doneSum = b.umgesetztAssessment + b.erledigtExecution;
          const segments = [
            { key: "done", value: doneSum, cls: "st-ja-tint", label: de ? "Abgeschlossen" : "Completed" },
            { key: "open", value: b.openTotal, cls: "st-nein-bg", label: de ? "Offen" : "Open" },
            { key: "scoped-out", value: b.naCount + b.excludedCount, cls: "bg-muted-foreground/30", label: de ? "Nicht im Scope" : "Out of scope" },
          ];
          return (
            <Card className="relative overflow-hidden border-primary/20 shadow-sm">
              <div className="absolute inset-0 eu-gradient opacity-[0.04] pointer-events-none" />
              <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
              <CardHeader className="pb-4 relative">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="gold-gradient p-1.5 rounded-lg">
                        <Target className="h-3.5 w-3.5 text-accent-foreground" />
                      </div>
                      {de ? "Maßnahmen-Übersicht" : "Actions Overview"}
                      {/* Geltungsbereich sichtbar machen: die Roadmap plant das Primär-Framework.
                          Ohne dieses Label wirken „403 Maßnahmen" neben „1.487 Aufgaben" in der
                          Umsetzung widersprüchlich (Befund P5.R.2). */}
                      <Badge variant="outline" className="text-[10px] font-normal">{primary.short}</Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {de ? "Woher die Zahlen kommen — vollständig nachvollziehbar." : "Where the numbers come from — fully traceable."}
                      {active.length > 1 && (
                        <span className="block mt-0.5">
                          {de
                            ? `Geltungsbereich: ${primary.displayName}. Die übrigen ${active.length - 1} Framework(s) sind über gemeinsame Kontroll-Knoten abgedeckt — die Gesamtzahlen stehen in der Umsetzung (Phase 06).`
                            : `Scope: ${primary.displayName}. The other ${active.length - 1} framework(s) are covered via shared control nodes — totals are in Implementation (phase 06).`}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                      {de ? "Offene Maßnahmen" : "Open actions"}
                    </div>
                    <div className="flex items-baseline gap-2 justify-end">
                      <span className="text-4xl font-bold tracking-tight text-primary tabular-nums">{b.openTotal}</span>
                      <span className="text-sm text-muted-foreground tabular-nums">/ {b.inScope}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-5">
                {/* Funnel bar */}
                <div>
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/40">
                    {segments.map(s => s.value > 0 && (
                      <div key={s.key} className={cn("h-full transition-all", s.cls)} style={{ width: `${pct(s.value)}%` }} title={`${s.label}: ${s.value}`} />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    {segments.map(s => (
                      <span key={s.key} className="inline-flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full", s.cls)} />
                        {s.label}
                        <span className="font-semibold text-foreground tabular-nums">{s.value}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Now / Next / Later pills */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: de ? "Jetzt" : "Now", value: b.nowCount, accent: "text-destructive", ring: "ring-destructive/20" },
                    { label: de ? "Nächste" : "Next", value: b.nextCount, accent: "st-teilweise-text", ring: "ring-amber-500/20" },
                    { label: de ? "Später" : "Later", value: b.laterCount, accent: "text-muted-foreground", ring: "ring-border" },
                  ].map(p => (
                    <div key={p.label} className={cn("rounded-xl bg-card/80 backdrop-blur-sm px-3 py-2.5 ring-1", p.ring)}>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{p.label}</div>
                      <div className={cn("text-2xl font-bold tabular-nums", p.accent)}>{p.value}</div>
                    </div>
                  ))}
                </div>

                {/* Traceable breakdown — collapsible */}
                <details className="group rounded-lg border border-border/60 bg-muted/20 open:bg-muted/30 transition-colors">
                  <summary className="cursor-pointer list-none px-3 py-2 flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground">
                    <span className="inline-flex items-center gap-2">
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                      {de ? "Berechnung anzeigen" : "Show calculation"}
                    </span>
                    <span className="tabular-nums">{b.totalCatalog} → {b.inScope} → {b.openTotal}</span>
                  </summary>
                  {(() => {
                    const Row = ({ label, value, bold, accent, muted }: { label: string; value: number; bold?: boolean; accent?: boolean; muted?: boolean }) => (
                      <div className={cn("flex justify-between", muted && "text-muted-foreground", accent && "text-primary font-semibold")}>
                        <span>{label}</span>
                        <span className={cn("tabular-nums", bold && "font-bold")}>{value}</span>
                      </div>
                    );
                    return (
                      <div className="px-3 pb-3 pt-1 font-mono text-xs space-y-1">
                        <Row label={de ? `${primary.short}-Katalog` : `${primary.short} catalog`} value={b.catalogCount} muted />
                        <Row label={`+ ${de ? "Eigene Kontrollen (Risikobehandlung)" : "Custom controls (Risk treatment)"}`} value={b.customCount} muted />
                        <Separator className="my-1.5" />
                        <Row label={de ? "Gesamt" : "Total"} value={b.totalCatalog} bold />
                        <Row label={`− ${de ? "Entbehrlich (SoA)" : "Not applicable (SoA)"}`} value={b.naCount} muted />
                        <Row label={`− ${de ? "Ausgeschlossen (SoA)" : "Excluded (SoA)"}`} value={b.excludedCount} muted />
                        <Separator className="my-1.5" />
                        <Row label={de ? "Im Scope" : "In scope"} value={b.inScope} bold />
                        <Row label={`− ${de ? 'Umgesetzt (Gap-Analyse „Ja")' : 'Implemented (Gap Analysis "Yes")'}`} value={b.umgesetztAssessment} muted />
                        <Row label={`− ${de ? "Erledigt (Roadmap-Status)" : "Completed (Roadmap status)"}`} value={b.erledigtExecution} muted />
                        <Separator className="my-1.5" />
                        <Row label={de ? "Offene Maßnahmen" : "Open actions"} value={b.openTotal} accent />
                      </div>
                    );
                  })()}
                </details>
              </CardContent>
            </Card>
          );
        })()}

        {/* Aufschlüsselung je Framework (Umsetzung-Standard) */}
        {fwGridItems.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <FrameworkMiniGrid
                items={fwGridItems}
                title={de ? "Umsetzung je Framework" : "Implementation by framework"}
                subtitle={de ? "— Anteil umgesetzt je gewähltem Framework" : "— implemented share per selected framework"}
              />
            </CardContent>
          </Card>
        )}

        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Target className="h-5 w-5" />}
            label={de ? `Gesamtfortschritt (${primary.short})` : `Overall Progress (${primary.short})`}
            value={`${stats.completionPct}%`}
            sub={`${stats.fullyDone} ${de ? "fertig" : "done"} · ${stats.halfDone} ${de ? "laufend (½)" : "in progress (½)"} / ${stats.totalApplicable}`}
            color="text-primary"
            infoNode={<RoadmapRichTip tipKey="overall_progress" de={de} />}
          />
          <StatCard
            icon={<Zap className="h-5 w-5" />}
            label={de ? "Jetzt (kritisch)" : "Now (Critical)"}
            value={`${stats.now.filter(i => i.status !== "fertig").length}`}
            sub={de ? "Sofortige Maßnahmen" : "Immediate actions"}
            color="text-destructive"
            infoNode={<RoadmapRichTip tipKey="now" de={de} />}
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label={de ? "Überfällig" : "Overdue"}
            value={`${stats.overdue.length}`}
            sub={de ? "Benötigen Aufmerksamkeit" : "Need attention"}
            color={stats.overdue.length > 0 ? "text-destructive" : "text-muted-foreground"}
            infoNode={<RoadmapRichTip tipKey="overdue" de={de} />}
          />
          <StatCard
            icon={<Play className="h-5 w-5" />}
            label={de ? "In Bearbeitung" : "In Progress"}
            value={`${stats.inProgress.length}`}
            sub={de ? "Aktive Maßnahmen" : "Active actions"}
            color="text-primary"
            infoNode={<RoadmapRichTip tipKey="in_progress" de={de} />}
          />
        </div>

        {/* Overall Progress Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">{de ? "Gesamtfortschritt zur Audit-Bereitschaft" : "Overall Progress to Audit Readiness"}</span>
              <div className="flex items-center gap-2">
                <RoadmapRichTip tipKey="audit_readiness" de={de} />
                <span className="text-lg font-bold text-primary">{stats.completionPct}%</span>
              </div>
            </div>
            <div className="relative">
              <Progress value={stats.completionPct} className="h-4" />
              {/* Milestone markers */}
              <div className="absolute inset-0 flex items-center pointer-events-none">
                {milestones.map(m => (
                  <div
                    key={m.id}
                    className="absolute top-0 h-full flex items-center"
                    style={{ left: `${m.targetPct}%`, transform: "translateX(-50%)" }}
                  >
                    <div className={cn(
                      "w-0.5 h-full",
                      m.achieved ? "st-ja-bg" : "bg-muted-foreground/30"
                    )} />
                  </div>
                ))}
              </div>
            </div>
            {/* Milestone legend */}
            <div className="flex flex-wrap gap-4 mt-3">
              {milestones.map(m => (
                <div key={m.id} className="flex items-center gap-1.5 text-xs">
                  <div className={cn(
                    "p-1 rounded-full",
                    m.achieved ? "st-ja-tint st-ja-text" : "bg-muted text-muted-foreground"
                  )}>
                    {m.icon}
                  </div>
                  <span className={m.achieved ? "st-ja-text font-medium" : "text-muted-foreground"}>
                    {de ? m.label : m.labelEn} ({m.targetPct}%)
                  </span>
                  {m.achieved && <CheckCircle2 className="h-3 w-3 st-ja-text" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              {de ? "Übersicht" : "Overview"}
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1.5">
              <Calendar className="h-4 w-4" />
              {de ? "Zeitplan" : "Timeline"}
            </TabsTrigger>
            <TabsTrigger value="resources" className="gap-1.5">
              <Users className="h-4 w-4" />
              {de ? "Ressourcen" : "Resources"}
            </TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ── */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Phase 1 — Milestone target-date editor */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {de ? "Audit-Zieltermin & Meilenstein-Plan" : "Audit Target Date & Milestone Plan"}
                  <InfoTip text={de
                    ? `Setzen Sie Ihren ${primary.shortDe}-Audit-Termin. Die 25/50/75/100%-Meilensteine werden linear bis dahin verteilt.`
                    : `Set your ${primary.shortEn} audit deadline. The 25/50/75/100% milestones are spread linearly until then.`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm font-medium text-foreground">
                    {de ? "Zieltermin:" : "Target date:"}
                  </label>
                  <DatePickerPopover
                    value={roadmapConfig.targetDate ? roadmapConfig.targetDate.slice(0, 10) : ""}
                    onChange={(v) => setTargetDate(v ? new Date(v + "T00:00:00").toISOString() : undefined)}
                    placeholder={de ? "Datum wählen" : "Pick a date"}
                    locale={de ? deLocale : enUS}
                    className="h-9 w-44 text-sm"
                  />

                  {roadmapConfig.targetDate && (
                    <>
                      <Badge variant="outline" className="text-xs">
                        {differenceInDays(new Date(roadmapConfig.targetDate), new Date())} {de ? "Tage verbleibend" : "days remaining"}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => setTargetDate(undefined)}>
                        {de ? "Zurücksetzen" : "Reset"}
                      </Button>
                    </>
                  )}
                  {kpiProjectedDateIso && (() => {
                    const projDate = new Date(kpiProjectedDateIso);
                    const targetDate = roadmapConfig.targetDate ? new Date(roadmapConfig.targetDate) : null;
                    const onTrack = targetDate ? projDate <= targetDate : true;
                    return (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs gap-1",
                          targetDate
                            ? (onTrack ? "st-ja-border st-ja-tint st-ja-text"
                                       : "border-destructive/40 bg-destructive/10 text-destructive")
                            : "border-primary/40 bg-primary/10 text-primary"
                        )}
                        title={de
                          ? "Aus KPI-Schritt 16 (Geschwindigkeit × verbleibender Umsetzungsgrad)."
                          : "From KPI Step 16 (velocity × remaining implementation rate)."}
                      >
                        <TrendingUp className="h-3 w-3" />
                        {de ? "KPI-Prognose:" : "KPI projection:"} {fmtDate(kpiProjectedDateIso)}
                        {targetDate && (
                          <span className="opacity-80">
                            {" "}({onTrack ? (de ? "im Plan" : "on track") : (de ? "über Frist" : "past deadline")})
                          </span>
                        )}
                      </Badge>
                    );
                  })()}
                </div>
                {roadmapConfig.targetDate && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
                    {milestones.map((m, idx) => {
                      const editable = idx < 3;
                      return (
                        <div key={m.id} className={cn(
                          "p-3 rounded-lg border",
                          m.achieved ? "st-ja-tint st-ja-border" : "bg-card border-border"
                        )}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className={cn(
                              "p-1 rounded-full",
                              m.achieved ? "st-ja-tint st-ja-text" : "bg-muted text-muted-foreground"
                            )}>{m.icon}</div>
                            {editable ? (
                              <div className="flex items-center gap-0.5">
                                <Input
                                  type="number"
                                  min={1}
                                  max={99}
                                  value={m.targetPct}
                                  onChange={(e) => setCheckpointPct(idx, parseInt(e.target.value, 10) || 0)}
                                  className="h-6 w-12 px-1.5 text-xs font-semibold text-foreground tabular-nums"
                                  title={de ? "Meilenstein-Schwelle anpassen" : "Adjust milestone threshold"}
                                />
                                <span className="text-xs font-semibold text-foreground">%</span>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-foreground">{m.targetPct}%</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{de ? m.label : m.labelEn}</p>
                          <p className="text-xs font-medium text-primary mt-1">
                            {m.achieved ? (de ? "✓ erreicht" : "✓ achieved") : fmtDate(m.targetDate)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!roadmapConfig.targetDate && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {de
                      ? `Tipp: Wählen Sie einen realistischen ${primary.shortDe}-Audit-Termin (z. B. 6–12 Monate).`
                      : `Tip: Pick a realistic ${primary.shortEn} audit date (e.g. 6–12 months).`}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Phase 1 — Residual Risk Forecast */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  {de ? "Residualrisiko-Prognose" : "Residual Risk Forecast"}
                  <InfoTip text={de
                    ? "Vereinfachte Vorschau aus SoA/Roadmap-Daten: aktueller Index = offene Maßnahmen nach SoA-Filtern. Nach der „Jetzt“-Phase = offene Maßnahmen minus „Jetzt“-Maßnahmen."
                    : "Simplified forecast from SoA/Roadmap data: current index = open actions after SoA filters. After the „Now“ phase = open actions minus „Now“ actions."} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-card border">
                    <p className="text-xs text-muted-foreground mb-1">{de ? "Risiko-Index aktuell" : "Current risk index"}</p>
                    <p className="text-2xl font-bold text-destructive">{forecast.currentRiskIndex}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{de ? "offene Maßnahmen laut SoA" : "open actions from SoA"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-card border">
                    <p className="text-xs text-muted-foreground mb-1">{de ? "Nach „Jetzt“-Phase" : "After „Now“ phase"}</p>
                    <p className="text-2xl font-bold text-success">{forecast.residualRiskIndex}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      −{forecast.nowReductionPct}% {de ? "Reduktion" : "reduction"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-card border">
                    <p className="text-xs text-muted-foreground mb-1">{de ? "Maßnahmen pro Phase" : "Actions per phase"}</p>
                    <div className="space-y-1 mt-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">{de ? "Jetzt" : "Now"}</span>
                        <span className="text-lg font-bold text-destructive tabular-nums">{forecast.nowCount}<span className="text-[10px] font-normal text-muted-foreground ml-0.5">{de ? "Maßn." : "actions"}</span></span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">{de ? "Nächste" : "Next"}</span>
                        <span className="text-lg font-bold text-accent tabular-nums">{forecast.nextCount}<span className="text-[10px] font-normal text-muted-foreground ml-0.5">{de ? "Maßn." : "actions"}</span></span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">{de ? "Später" : "Later"}</span>
                        <span className="text-lg font-bold text-primary tabular-nums">{forecast.laterCount}<span className="text-[10px] font-normal text-muted-foreground ml-0.5">{de ? "Maßn." : "actions"}</span></span>
                      </div>
                    </div>
                  </div>
                </div>
                {forecast.totalHighRisk > 0 && (
                  <p className="text-xs text-muted-foreground mt-3">
                    {de
                      ? `${forecast.nowHighRisk} von ${forecast.totalHighRisk} hochrisiko-verknüpften Maßnahmen werden in der „Jetzt“-Phase adressiert.`
                      : `${forecast.nowHighRisk} of ${forecast.totalHighRisk} high-risk-linked actions are addressed in the „Now“ phase.`}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Phase 1 — Quick-Win Matrix (Effort x Risk-Reduction) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-secondary" />
                  {de ? "Quick-Win-Matrix" : "Quick-Win Matrix"}
                  <InfoTip text={de
                    ? "Y-Achse: Risiko-Reduktion (1–10). X-Achse: Aufwand (Personentage). Oben-links = höchster ROI. Zuerst dort beginnen."
                    : "Y-axis: risk reduction (1–10). X-axis: effort (person-days). Top-left = highest ROI. Start there."} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quickWinData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={320}>
                      <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="x" name={de ? "Aufwand (PT)" : "Effort (PD)"}
                          label={{ value: de ? "Aufwand (Personentage)" : "Effort (person-days)", position: "bottom", offset: 0, style: { fontSize: 11 } }}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis type="number" dataKey="y" name={de ? "Risiko-Reduktion" : "Risk reduction"} domain={[0, 10]}
                          label={{ value: de ? "Risiko-Reduktion" : "Risk reduction", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
                          tick={{ fontSize: 11 }}
                        />
                        
                        <ReferenceLine x={3} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                        <ReferenceLine y={5} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                        <ReTooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload as typeof quickWinData[0];
                            return (
                              <div className="bg-popover border rounded-lg p-2 shadow-md text-xs space-y-0.5 max-w-xs">
                                <p className="font-semibold text-foreground line-clamp-2">{d.name}</p>
                                <p className="text-muted-foreground">{de ? "Aufwand:" : "Effort:"} <span className="font-medium text-foreground">{d.x} {de ? "PT" : "PD"}</span></p>
                                <p className="text-muted-foreground">{de ? "Risiko-Reduktion:" : "Risk reduction:"} <span className="font-medium text-foreground">{d.y}/10</span></p>
                                
                                <p className="text-muted-foreground">{de ? "ROI:" : "ROI:"} <span className="font-medium text-primary">{d.roi.toFixed(2)}</span></p>
                                {d.owner && <p className="text-muted-foreground">{de ? "Owner:" : "Owner:"} {d.owner}</p>}
                              </div>
                            );
                          }}
                        />
                        <Scatter data={quickWinData.filter(d => d.phase === "now")} fill={CHART_PHASE.now} name={de ? "Jetzt" : "Now"} />
                        <Scatter data={quickWinData.filter(d => d.phase === "next")} fill={CHART_PHASE.next} name={de ? "Nächste" : "Next"} />
                        <Scatter data={quickWinData.filter(d => d.phase === "later")} fill={CHART_PHASE.later} name={de ? "Später" : "Later"} />
                        <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 11 }} />
                      </ScatterChart>
                    </ResponsiveContainer>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      <div className="flex items-start gap-1">
                        <Sparkles className="h-3 w-3 st-ja-text shrink-0 mt-0.5" />
                        <span>{de ? "Oben-links: Quick-Wins (wenig Aufwand, viel Wirkung) — zuerst umsetzen." : "Top-left: Quick wins (low effort, high impact) — do first."}</span>
                      </div>
                      <div className="flex items-start gap-1">
                        <AlertTriangle className="h-3 w-3 st-teilweise-text shrink-0 mt-0.5" />
                        <span>{de ? "Unten-rechts: Hoher Aufwand, geringer Effekt — kritisch hinterfragen." : "Bottom-right: High effort, low impact — challenge their priority."}</span>
                      </div>
                    </div>

                    {/* Top 5 quick-win list with inline effort editor */}
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        {de ? "Top 5 Quick-Wins (höchster ROI):" : "Top 5 quick wins (highest ROI):"}
                        <InfoHint
                          title={de ? "Warum genau diese fünf?" : "Why exactly these five?"}
                          text={de
                            ? "Rangfolge nach ROI = Risikoreduktion ÷ Aufwand.\n\nRisikoreduktion (1–10): +5 wenn mit einem hohen Risiko verknüpft, +2 bei hoher / +1 bei mittlerer Priorität, +1 wenn bereits teilweise umgesetzt (schnell abschließbar).\n\nAufwand: geschätzte Personentage der Maßnahme (aus der ISO-27001-Referenz abgeleitet, hier editierbar).\n\nNur offene Maßnahmen. Wer das Aufwand-Feld ändert, ändert die Rangfolge sofort.\n\nKlick auf eine Zeile öffnet die Maßnahme in der Umsetzung."
                            : "Ranked by ROI = risk reduction ÷ effort.\n\nRisk reduction (1–10): +5 if linked to a high risk, +2 high / +1 medium priority, +1 if already partially implemented (quick to close).\n\nEffort: estimated person-days (derived from the ISO 27001 reference, editable here).\n\nOpen actions only. Editing the effort re-ranks instantly.\n\nClick a row to open the action in Implementation."}
                        />
                      </p>
                      <div className="space-y-1.5">
                        {[...roadmapItems]
                          .filter(i => i.status !== "fertig")
                          .sort((a, b) => b.roi - a.roi)
                          .slice(0, 5)
                          .map(item => (
                            <div key={item.id} className="flex flex-wrap items-center gap-2 p-2 rounded-md border bg-card text-xs hover:border-accent/60 transition-colors">
                              <button
                                type="button"
                                onClick={() => navigate(`/implementation?focus=${encodeURIComponent(item.id)}${item.isoRef ? `&iso=${encodeURIComponent(item.isoRef)}` : ""}`)}
                                className="flex-1 min-w-[160px] text-left font-medium text-foreground truncate hover:text-accent underline-offset-2 hover:underline"
                                title={de ? "In der Umsetzung öffnen" : "Open in Implementation"}
                              >
                                {de ? item.name : item.nameEn}
                                <ArrowUpRight className="inline h-3 w-3 ml-1 opacity-60" />
                              </button>
                              <Badge variant="outline" className="text-[10px] gap-1">
                                ROI <span className="font-bold text-primary">{item.roi.toFixed(2)}</span>
                              </Badge>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <Input
                                  type="number" min={0.5} step={0.5}
                                  value={item.effortDays}
                                  onChange={(e) => updateActionField(item.id, { effort_days: Number(e.target.value) })}
                                  className="h-7 w-16 text-xs px-1.5"
                                />
                                <span className="text-[10px] text-muted-foreground">{de ? "PT" : "PD"}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {de ? "Keine offenen Maßnahmen für die Quick-Win-Analyse." : "No open actions for the quick-win analysis."}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Phase Distribution + Status Pie */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {de ? "Phasenverteilung" : "Phase Distribution"}
                    <RoadmapRichTip tipKey="phase_distribution" de={de} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={phaseChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 12 }} />
                      <ReTooltip />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                        {phaseChartData.map((d, i) => (
                          <Cell key={i} fill={d.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {de ? "Statusverteilung" : "Status Distribution"}
                    <RoadmapRichTip tipKey="status_distribution" de={de} />
                  </CardTitle>
                </CardHeader>
                {/* Beschriftung IM Ring + HTML-Legende darunter.
                    Vorher: `label={({name,value}) => ...}` zeichnete ausserhalb
                    des Rings und lief in die Recharts-<Legend> — „Laufend: 84"
                    lag quer auf „Laufend  Offen". Regel siehe lib/chartLabels. */}
                <CardContent>
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                          labelLine={false}
                          label={insideSliceLabel("value")}
                        >
                          {statusChartData.map((d, i) => (
                            <Cell key={i} fill={d.fill} />
                          ))}
                        </Pie>
                        <ReTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold leading-none">
                        {statusChartData.reduce((a, d) => a + d.value, 0)}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        {de ? "Maßnahmen" : "Actions"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
                    {statusChartData.map(d => (
                      <span key={d.name} className="flex items-center gap-1.5 text-xs min-w-0">
                        <span className="inline-block w-3 h-3 rounded-sm shrink-0" style={{ background: d.fill }} />
                        <span className="truncate text-muted-foreground">{d.name}</span>
                        <b className="ml-auto text-foreground">{d.value}</b>
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Framework-scoped Now/Next/Later panels — dedup counts stay global */}
            {(() => {
              const openItems = roadmapItems.filter(i => i.status !== "fertig");
              const allBundles = buildBundles(openItems);
              const primaryPhaseByKey = new Map<string, Phase>();
              // For panel display we pick the phase from the primary (first) member
              // of each bundle — matches how bundles are surfaced in the main view.
              for (const b of allBundles) {
                primaryPhaseByKey.set(b.key, b.members[0]?.phase ?? "later");
              }
              const panelBundles = allBundles.map(b => ({
                key: b.key,
                title: b.title,
                titleEn: b.titleEn,
                totalEffortPT: b.totalEffort,
                primaryOwner: b.primaryOwner,
                isoRef: b.key.startsWith("cat:") ? null : b.key,
                phase: primaryPhaseByKey.get(b.key) ?? "later",
                isQuickWin: b.isQuickWin,
                memberCount: b.totalCount,
                doneCount: b.doneCount,
              }));
              const activeDefs = [
                ...(active.some(a => a.key === primary.key) ? [] : [primary]),
                ...active,
              ];
              return (
                <RoadmapFrameworkPanels
                  frameworks={activeDefs}
                  bundles={panelBundles}
                  isoToFrameworks={isoToFrameworks}
                  primaryKey={primary.key}
                  lang={lang}
                />
              );
            })()}

            {/* Phase Timeline Visual */}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {de ? "Now / Next / Later Sequenzierung" : "Now / Next / Later Sequencing"}
                  <RoadmapRichTip tipKey="sequencing" de={de} />
                  <InfoTip text={de
                    ? `Konsolidiert: Maßnahmen sind nach ${primary.short}-Kategorie zu thematischen Bündeln gruppiert (z. B. alle Governance-Kontrollen = 1 Bündel „Sicherheitsrichtlinien & Governance“). Owner und Fälligkeit werden vom kritischsten Mitglied übernommen. Detailliert: jede Maßnahme einzeln.`
                    : `Consolidated: actions are grouped into thematic bundles per ${primary.short} category (e.g. all governance controls = 1 bundle „Security Policies & Governance“). Owner and due-date are inherited from the most critical member. Detailed: each action listed individually.`} />
                  {/* Konsolidiert/Detailliert-Umschalter nur im Detail-Modus; Überblick bleibt konsolidiert. */}
                  {expert && (
                  <div className="ml-auto inline-flex rounded-md border border-border overflow-hidden">
                    <button
                      onClick={() => setRoadmapView({ mode: "consolidated" })}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-medium transition-colors",
                        roadmapView.mode === "consolidated"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {de ? "Konsolidiert" : "Consolidated"}
                    </button>
                    <button
                      onClick={() => setRoadmapView({ mode: "detailed" })}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-medium transition-colors border-l border-border",
                        roadmapView.mode === "detailed"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {de ? "Detailliert" : "Detailed"}
                    </button>
                  </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Kapazität / capacity controls — Phase 2. Experten-Planung: im Überblick ausgeblendet. */}
                <div className={`mb-4 p-3 rounded-lg border border-border bg-muted/30 ${expert ? "" : "hidden"}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {de ? "Modus" : "Mode"}:
                      </span>
                      <div className="inline-flex rounded-md border border-border overflow-hidden">
                        <button
                          onClick={() => setRoadmapConfig({ ...roadmapConfig, daysMode: "manual" })}
                          className={cn(
                            "px-2.5 py-1 text-[11px] font-medium transition-colors",
                            (roadmapConfig.daysMode ?? "auto") === "manual"
                              ? "bg-primary text-primary-foreground"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {de ? "Manuell" : "Manual"}
                        </button>
                        <button
                          onClick={() => setRoadmapConfig({ ...roadmapConfig, daysMode: "auto" })}
                          className={cn(
                            "px-2.5 py-1 text-[11px] font-medium transition-colors border-l border-border",
                            (roadmapConfig.daysMode ?? "auto") === "auto"
                              ? "bg-primary text-primary-foreground"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {de ? "Auto (aus PT)" : "Auto (from PD)"}
                        </button>
                      </div>
                      <InfoTip text={de
                        ? "Manuell: Tage pro Phase frei wählbar. Auto: Tage werden aus dem PT-Aufwand der Phase und der Team-Kapazität berechnet (PT/Phase ÷ Kapazität × 365)."
                        : "Manual: set days per phase manually. Auto: days are derived from phase PD effort and team capacity (PD/phase ÷ capacity × 365)."} />
                    </div>
                    {(() => {
                      const isAuto = (roadmapConfig.daysMode ?? "auto") === "auto";
                      const totalPT = forecast.nowEffortDays + forecast.nextEffortDays + forecast.laterEffortDays;
                      const totalManualDays = getPhaseDays("now", roadmapConfig) + getPhaseDays("next", roadmapConfig) + getPhaseDays("later", roadmapConfig);
                      const requiredTotalFte = totalManualDays > 0 ? (totalPT * 365) / (totalManualDays * WORKDAYS_PER_YEAR) : 0;
                      const fteByRole = getFteByRole(roadmapConfig);
                      const totalFte = getTotalFte(roadmapConfig);
                      const capByRole = getCapacityPTPerYearByRole(roadmapConfig);
                      const demandByRole = forecast.totalEffortByRole;
                      return (
                        <div className="ml-auto text-xs">
                          <div className="flex items-center gap-2 mb-1.5 justify-end">
                            <span className="font-semibold text-foreground">
                              {isAuto
                                ? (de ? "Kapazität nach Rolle (FTE)" : "Capacity by role (FTE)")
                                : (de ? "Erforderlich gesamt (FTE)" : "Required total (FTE)")}:
                            </span>
                            {!isAuto && (
                              <span className="h-7 w-20 inline-flex items-center justify-end px-2 text-xs rounded-md border border-dashed border-border bg-muted/40 tabular-nums font-bold text-foreground">
                                {requiredTotalFte.toFixed(2)}
                              </span>
                            )}
                            <InfoTip text={isAuto
                              ? (de
                                ? "PT werden nach Rolle aufgeteilt: IT-Betrieb, ISB/Compliance, Leitung, Fachbereich. Profil je ISO Annex A-Bereich (techn. Kontrollen → IT-lastig, Richtlinien → ISB, Freigaben → Leitung). Phase-Dauer = Engpass-Rolle (langsamste Rolle bestimmt Tempo)."
                                : "PD are split per role: IT, ISO/Compliance, Management, Business Unit. Profile by ISO Annex A theme (technical → IT, policies → ISO, approvals → Mgmt). Phase duration = bottleneck role.")
                              : (de
                                ? `Manuell-Modus: ${totalPT} PT gesamt ÷ ${totalManualDays} Tage = ${requiredTotalFte.toFixed(2)} FTE notwendig.`
                                : `Manual mode: ${totalPT} PD total ÷ ${totalManualDays} days = ${requiredTotalFte.toFixed(2)} FTE required.`)} />
                          </div>
                          {isAuto && (
                            <>
                              <div className="grid grid-cols-4 gap-1.5">
                                {EFFORT_ROLES.map((role) => {
                                  const fte = fteByRole[role];
                                  const cap = capByRole[role];
                                  const demand = demandByRole[role];
                                  const util = cap > 0 ? Math.round((demand / cap) * 100) : (demand > 0 ? 999 : 0);
                                  const over = util > 100;
                                  return (
                                    <div key={role} className={cn(
                                      "rounded-md border p-1.5 flex flex-col items-center gap-0.5",
                                      over ? "border-destructive bg-destructive/5" : "border-border bg-background"
                                    )}>
                                      <div className="flex items-center gap-1 w-full justify-center">
                                        <span className={cn("w-2 h-2 rounded-full", ROLE_COLOR[role].bg)} />
                                        <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">
                                          {de ? ROLE_LABEL[role].de : ROLE_LABEL[role].en}
                                        </span>
                                      </div>
                                      <Input
                                        type="number" min={0} step={0.1}
                                        value={fte}
                                        onChange={(e) => {
                                          const n = parseFloat(e.target.value);
                                          setRoadmapConfig({
                                            ...roadmapConfig,
                                            fteByRole: {
                                              ...getFteByRole(roadmapConfig),
                                              [role]: Number.isFinite(n) && n >= 0 ? n : 0,
                                            },
                                          });
                                        }}
                                        className="h-6 w-full text-[11px] text-right px-1.5"
                                        aria-label={`FTE ${role}`}
                                      />
                                      <span className={cn(
                                        "text-[10px] tabular-nums",
                                        over ? "text-destructive font-bold" : "text-muted-foreground"
                                      )}>
                                        {Math.round(demand)}/{Math.round(cap)} PT ({util}%)
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="mt-1.5 text-right text-[11px] text-muted-foreground tabular-nums">
                                {de ? "Gesamt" : "Total"}: <span className="font-bold text-foreground">{totalFte.toFixed(1)} FTE</span> ≈ {Math.round(getCapacityPTPerYear(roadmapConfig))} {de ? "PT/Jahr" : "PD/year"}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Total summary — auto: shows days; manual: shows total days + required FTE */}
                  <div className="mt-2.5 pt-2.5 border-t border-border/50 flex items-center justify-between">
                    {(() => {
                      const isAuto = (roadmapConfig.daysMode ?? "auto") === "auto";
                      const totalDays = isAuto
                        ? ptToDaysByRole(forecast.nowEffortByRole, roadmapConfig)
                          + ptToDaysByRole(forecast.nextEffortByRole, roadmapConfig)
                          + ptToDaysByRole(forecast.laterEffortByRole, roadmapConfig)
                        : getPhaseDays("now", roadmapConfig) + getPhaseDays("next", roadmapConfig) + getPhaseDays("later", roadmapConfig);
                      const years = Math.round((totalDays / 365) * 10) / 10;
                      return (
                        <>
                          <span className="text-xs text-muted-foreground">
                            {de ? "Gesamtdauer (Engpass-Rolle)" : "Total duration (bottleneck role)"}:
                          </span>
                          <span className="text-xs font-bold text-foreground tabular-nums">
                            {totalDays} {de ? "Tage" : "days"}
                            <span className="font-normal text-muted-foreground ml-1">
                              ≈ {years} {de ? "Jahre" : "years"}
                            </span>
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="relative">

                  {/* Filter bar — direct drill-down to specific actions */}
                  {(() => {
                    const unassignedLabel = de ? "Nicht zugewiesen" : "Unassigned";
                    const ownerNames = Object.keys(stats.ownerMap).sort((a, b) => a.localeCompare(b));
                    const hasUnassigned = roadmapItems.some(i => !i.owner && i.status !== "fertig");
                    const toggleChip = (k: keyof Omit<SeqFilters, "priority">) =>
                      setSeqFilters(prev => ({ ...prev, [k]: !prev[k] }));
                    const chipCls = (active: boolean, tone: "destructive" | "amber" | "primary" | "muted" = "primary") => {
                      const tones: Record<string, string> = {
                        destructive: active
                          ? "bg-destructive text-destructive-foreground border-destructive"
                          : "bg-background text-destructive border-destructive/30 hover:bg-destructive/10",
                        amber: active
                          ? "st-teilweise-bg text-white st-teilweise-border"
                          : "bg-background st-teilweise-text st-teilweise-border hover:bg-amber-500/10",
                        primary: active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-primary border-primary/30 hover:bg-primary/10",
                        muted: active
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-muted-foreground border-border hover:bg-muted",
                      };
                      return cn("inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors", tones[tone]);
                    };
                    return (
                      <div className="mb-3 rounded-lg border border-border bg-muted/20 p-2.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {de ? "Filter" : "Filters"}
                          </span>
                          {seqAnyActive && (
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs"
                              onClick={() => { setSeqFilters(defaultSeqFilters); setOwnerFilter(null); }}>
                              <XCircle className="h-3 w-3 mr-1" />
                              {de ? "Alle entfernen" : "Clear all"}
                            </Button>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <select
                            value={ownerFilter ?? ""}
                            onChange={(e) => setOwnerFilter(e.target.value || null)}
                            className="text-[11px] h-7 rounded-md border border-border bg-background px-2 text-foreground"
                            aria-label={de ? "Verantwortlich" : "Owner"}
                          >
                            <option value="">{de ? "Alle Verantwortlichen" : "All owners"}</option>
                            {hasUnassigned && <option value={unassignedLabel}>{unassignedLabel}</option>}
                            {ownerNames.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                          <select
                            value={seqFilters.priority}
                            onChange={(e) => setSeqFilters(prev => ({ ...prev, priority: e.target.value as SeqFilters["priority"] }))}
                            className="text-[11px] h-7 rounded-md border border-border bg-background px-2 text-foreground"
                            aria-label={de ? "Priorität" : "Priority"}
                          >
                            <option value="all">{de ? "Alle Prioritäten" : "All priorities"}</option>
                            <option value="high">{de ? "Hoch" : "High"}</option>
                            <option value="medium">{de ? "Mittel" : "Medium"}</option>
                            <option value="low">{de ? "Niedrig" : "Low"}</option>
                          </select>
                          <button type="button" onClick={() => toggleChip("overdue")} className={chipCls(seqFilters.overdue, "destructive")}>
                            <AlertTriangle className="h-3 w-3" />
                            {de ? "Überfällig" : "Overdue"}
                          </button>
                          <button type="button" onClick={() => toggleChip("highRisk")} className={chipCls(seqFilters.highRisk, "destructive")}>
                            <Shield className="h-3 w-3" />
                            {de ? "Kritisch / Hohes Risiko" : "Critical / High Risk"}
                          </button>
                          <button type="button" onClick={() => toggleChip("partial")} className={chipCls(seqFilters.partial, "amber")}>
                            {de ? "Teilweise" : "Partial"}
                          </button>
                          <button type="button" onClick={() => toggleChip("inProgress")} className={chipCls(seqFilters.inProgress, "primary")}>
                            <Play className="h-3 w-3" />
                            {de ? "Laufend" : "In Progress"}
                          </button>
                          <button type="button" onClick={() => toggleChip("blocked")} className={chipCls(seqFilters.blocked, "amber")}>
                            <XCircle className="h-3 w-3" />
                            {de ? "Blockiert" : "Blocked"}
                          </button>
                          <button type="button" onClick={() => toggleChip("quickWin")} className={chipCls(seqFilters.quickWin, "primary")}>
                            <Sparkles className="h-3 w-3" />
                            Quick Win
                          </button>
                          <button type="button" onClick={() => toggleChip("noDate")} className={chipCls(seqFilters.noDate, "muted")}>
                            <Calendar className="h-3 w-3" />
                            {de ? "Kein Datum" : "No date"}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Management-Überblick je Horizont — eine Zeile, alles Wichtige. */}
                  {(() => {
                    const isAutoS = (roadmapConfig.daysMode ?? "auto") === "auto";
                    let cum = 0;
                    const cards = (["now", "next", "later"] as Phase[]).map((phase) => {
                      const cfg = PHASE_CONFIG[phase];
                      const cnt = roadmapItems.filter(i => i.phase === phase && i.status !== "fertig").length;
                      const pt = phase === "now" ? forecast.nowEffortDays : phase === "next" ? forecast.nextEffortDays : forecast.laterEffortDays;
                      const ebr = phase === "now" ? forecast.nowEffortByRole : phase === "next" ? forecast.nextEffortByRole : forecast.laterEffortByRole;
                      const dur = isAutoS ? ptToDaysByRole(ebr, roadmapConfig) : getPhaseDays(phase, roadmapConfig);
                      cum += dur;
                      const end = new Date(Date.now() + cum * 86400000).toLocaleDateString(de ? "de-DE" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
                      return { phase, cfg, cnt, pt, end, dur };
                    });
                    const finalEnd = cards[cards.length - 1]?.end;
                    const totalDays = Math.max(1, cards.reduce((a, c) => a + c.dur, 0));
                    const targetDays = roadmapConfig.targetDate
                      ? (new Date(roadmapConfig.targetDate).getTime() - Date.now()) / 86400000
                      : null;
                    const targetPct = targetDays != null ? Math.max(0, Math.min(100, (targetDays / totalDays) * 100)) : null;
                    const targetPast = targetDays != null && targetDays < 0;
                    return (
                      <div className="mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {cards.map(c => {
                            const CIcon = c.cfg.icon;
                            return (
                              <div key={c.phase} className={cn("rounded-xl border p-3", c.cfg.border, c.cfg.bg)}>
                                <div className="flex items-center gap-2">
                                  <CIcon className={cn("h-4 w-4", c.cfg.color)} />
                                  <span className={cn("font-bold text-sm", c.cfg.color)}>{de ? c.cfg.label.de : c.cfg.label.en}</span>
                                  <span className="ml-auto text-lg font-bold tabular-nums text-foreground">{c.cnt}</span>
                                </div>
                                <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                                  <span>{Math.round(c.pt)} {de ? "PT gesamt" : "PD total"}</span>
                                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{de ? "fertig ~" : "done ~"} {c.end}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Visuelle Zeitleiste: Horizonte als Balken über die Zeit + Zieltermin-Marker. */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                            <span>{de ? "Zeitleiste" : "Timeline"}</span>
                            {targetPct != null && (
                              <span className={targetPast ? "text-destructive font-semibold" : "text-accent font-semibold"}>
                                {de ? "Zieltermin " : "Target "}{fmtDate(roadmapConfig.targetDate)}{targetPast ? (de ? " (überfällig)" : " (overdue)") : ""}
                              </span>
                            )}
                          </div>
                          <div className="relative h-7 rounded-lg overflow-hidden border border-border flex">
                            {cards.map(c => (
                              <div key={c.phase}
                                   className={cn("h-full flex items-center justify-center text-[10px] font-semibold border-r border-background/60 last:border-r-0", c.cfg.bg, c.cfg.color)}
                                   style={{ width: `${(c.dur / totalDays) * 100}%` }}
                                   title={`${de ? c.cfg.label.de : c.cfg.label.en} · ${Math.round(c.dur)} ${de ? "Tage" : "days"}`}>
                                <span className="truncate px-1">{de ? c.cfg.label.de : c.cfg.label.en}</span>
                              </div>
                            ))}
                            {targetPct != null && !targetPast && (
                              <div className="absolute top-0 bottom-0 w-0.5 bg-accent" style={{ left: `${targetPct}%` }}
                                   title={`${de ? "Zieltermin" : "Target"}: ${fmtDate(roadmapConfig.targetDate)}`}>
                                <div className="absolute -top-1 -translate-x-1/2 size-2 rounded-full bg-accent" />
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                            <span>{de ? "heute" : "today"}</span>
                            <span>{finalEnd}</span>
                          </div>
                        </div>

                        {finalEnd && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {de ? "Voraussichtliche Gesamt-Fertigstellung: " : "Estimated overall completion: "}
                            <span className="font-semibold text-foreground">{finalEnd}</span>
                            {targetPct != null && !targetPast && targetDays != null && (
                              <span className={targetDays < totalDays ? "text-destructive" : "st-ja-text"}>
                                {" "}·{" "}
                                {targetDays < totalDays
                                  ? (de ? "Achtung: Fertigstellung nach Zieltermin" : "Warning: completion after target")
                                  : (de ? "im Plan vor Zieltermin" : "on track before target")}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {(() => {
                    const isAuto = (roadmapConfig.daysMode ?? "auto") === "auto";
                    let cumulativeDays = 0;
                    return (["now", "next", "later"] as Phase[]).map((phase) => {
                      const config = PHASE_CONFIG[phase];
                      const Icon = config.icon;
                      const unassignedLabel = de ? "Nicht zugewiesen" : "Unassigned";
                      const matchesOwnerFilter = (it: RoadmapItem) =>
                        !ownerFilter
                          ? true
                          : ownerFilter === unassignedLabel
                            ? !it.owner
                            : it.owner === ownerFilter;
                      const matchesSeq = (it: RoadmapItem) => {
                        if (seqFilters.overdue && !it.isOverdue) return false;
                        if (seqFilters.highRisk && !it.linkedToHighRisk) return false;
                        if (seqFilters.partial && it.implStatus !== "teilweise") return false;
                        if (seqFilters.inProgress && it.status !== "laufend") return false;
                        if (seqFilters.blocked && it.status !== "blockiert") return false;
                        if (seqFilters.noDate && it.dueDate) return false;
                        if (seqFilters.priority !== "all" && it.priority !== seqFilters.priority) return false;
                        return true;
                      };
                      let items = roadmapItems.filter(i => i.phase === phase && i.status !== "fertig" && matchesOwnerFilter(i) && matchesSeq(i));
                      if (seqFilters.quickWin) {
                        // Keep only items that belong to a quick-win bundle in this phase.
                        const allPhaseItems = roadmapItems.filter(i => i.phase === phase && i.status !== "fertig");
                        const qwKeys = new Set(buildBundles(allPhaseItems).filter(b => b.isQuickWin).map(b => b.key));
                        items = items.filter(i => qwKeys.has(i.isoRef ?? `cat:${i.category}`));
                      }
                      const bundles = buildBundles(items);
                      const isExpanded = expandedPhases.has(phase) || seqAnyActive;
                      const phasePT = phase === "now" ? forecast.nowEffortDays : phase === "next" ? forecast.nextEffortDays : forecast.laterEffortDays;
                      const phaseEffortByRole = phase === "now" ? forecast.nowEffortByRole : phase === "next" ? forecast.nextEffortByRole : forecast.laterEffortByRole;
                      const autoDays = ptToDaysByRole(phaseEffortByRole, roadmapConfig);
                      const phaseDuration = isAuto ? autoDays : getPhaseDays(phase, roadmapConfig);
                      const phaseDays = phaseDuration;
                      cumulativeDays += phaseDuration;
                      const phaseEnd = new Date(Date.now() + cumulativeDays * 86400000);
                      const phaseEndLabel = phaseEnd.toLocaleDateString(de ? "de-DE" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });

                    return (
                      <div
                        key={phase}
                        onDragOver={expert ? (e) => { e.preventDefault(); if (dragOverPhase !== phase) setDragOverPhase(phase); } : undefined}
                        onDragLeave={expert ? (e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverPhase(null); } : undefined}
                        onDrop={expert ? (e) => {
                          e.preventDefault();
                          const ids = (e.dataTransfer.getData("text/plain") || "").split(",").filter(Boolean);
                          moveToPhase(ids, phase);
                          setDragOverPhase(null);
                        } : undefined}
                        className={cn(
                          "relative mb-6 last:mb-0 rounded-2xl transition-all",
                          dragOverPhase === phase && "ring-2 ring-accent ring-offset-2 bg-accent/5"
                        )}
                      >
                        {/* Phase header */}
                        <div
                          className={cn(
                            "flex items-center gap-3 w-full p-3 rounded-xl transition-all",
                            config.bg
                          )}
                        >
                          <button
                            onClick={() => togglePhase(phase)}
                            className="flex items-center gap-3 flex-1 text-left hover:opacity-80"
                          >
                            <div className={cn("relative z-10 p-2 rounded-full", config.bg, config.border, "border")}>
                              <Icon className={cn("h-4 w-4", config.color)} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={cn("font-bold text-base", config.color)}>
                                  {de ? config.label.de : config.label.en}
                                </span>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className="text-muted-foreground hover:text-foreground transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <HelpCircle className="h-3.5 w-3.5" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent side="right" align="start" className="w-80 text-xs space-y-2">
                                    <p className="font-semibold text-foreground">
                                      {de ? "Phase-Sequenz — wie wird zugeordnet?" : "Phase Sequencing — how are items assigned?"}
                                    </p>
                                    <div className="space-y-1.5">
                                      <div className="flex items-start gap-1.5">
                                        <Zap className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground">
                                          {de
                                            ? "Jetzt: fertig, overdue, linkedToHighRisk oder priority=high"
                                            : "Now: done, overdue, linkedToHighRisk or priority=high"}
                                        </span>
                                      </div>
                                      <div className="flex items-start gap-1.5">
                                        <ArrowRight className="h-3 w-3 st-teilweise-text shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground">
                                          {de
                                            ? "Nächste: priority=medium oder status=laufend"
                                            : "Next: priority=medium or status=in_progress"}
                                        </span>
                                      </div>
                                      <div className="flex items-start gap-1.5">
                                        <Clock className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground">
                                          {de
                                            ? "Später: alle verbleibenden (priority=low oder status=offen)"
                                            : "Later: all remaining (priority=low or status=open)"}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="pt-1.5 border-t border-border/50 text-muted-foreground">
                                      {de
                                        ? "Phase-Fenster: Jetzt = 90 Tage, Nächste = 180 Tage, Später = 365 Tage (nur Timeline-Visualisierung)."
                                        : "Phase windows: Now = 90 days, Next = 180 days, Later = 365 days (timeline visualization only)."}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <span className="text-muted-foreground text-sm">
                                {rmMode === "consolidated"
                                  ? `(${bundles.length} ${de ? "Bündel" : "bundles"} · ${items.length} ${de ? "Maßnahmen" : "actions"})`
                                  : `(${items.length} ${de ? "Maßnahmen" : "actions"})`}
                              </span>
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                {de ? "Zielfenster bis" : "Window until"}: <span className="font-medium text-foreground">{phaseEndLabel}</span>
                              </div>
                            </div>
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          </button>
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {isAuto ? (
                              <>
                                <span className="h-7 w-16 inline-flex items-center justify-end px-2 text-xs rounded-md border border-dashed border-border bg-muted/40 tabular-nums text-foreground">
                                  {phaseDuration}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {de ? "Tage (auto)" : "days (auto)"}
                                </span>
                              </>
                            ) : (
                              <>
                                <Input
                                  type="number"
                                  min={1}
                                  value={phaseDays}
                                  onChange={(e) => {
                                    const n = parseInt(e.target.value, 10);
                                    setRoadmapConfig({
                                      ...roadmapConfig,
                                      phaseDays: {
                                        ...(roadmapConfig.phaseDays ?? DEFAULT_PHASE_DAYS),
                                        [phase]: Number.isFinite(n) && n > 0 ? n : DEFAULT_PHASE_DAYS[phase],
                                      },
                                    });
                                  }}
                                  className="h-7 w-16 text-xs text-right"
                                  aria-label={de ? `${config.label.de} Tage` : `${config.label.en} days`}
                                />
                                <span className="text-[11px] text-muted-foreground">
                                  {de ? "Tage" : "days"}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Phase items — consolidated bundles or detailed list */}
                        {expert && isExpanded && items.length > 0 && rmMode === "consolidated" && (
                          <div className="ml-14 mt-2 space-y-1.5">
                            {bundles.map(b => {
                              const bExpanded = expandedBundles.has(`${phase}:${b.key}`) || seqAnyActive;
                              const pct = b.totalCount > 0 ? Math.round((b.doneCount / b.totalCount) * 100) : 0;
                              return (
                                <div
                                  key={b.key}
                                  draggable={expert}
                                  onDragStart={expert ? (e) => {
                                    e.dataTransfer.effectAllowed = "move";
                                    e.dataTransfer.setData("text/plain", b.members.map(m => m.id).join(","));
                                  } : undefined}
                                  className={`group rounded-lg border bg-card overflow-hidden transition-colors hover:border-accent ${expert ? "cursor-grab active:cursor-grabbing" : ""}`}
                                  title={expert ? (de ? "Ziehen, um den Horizont zu ändern" : "Drag to change horizon") : undefined}
                                >
                                  <div
                                    className={cn(
                                      "w-full flex flex-wrap items-center gap-2 p-2.5 text-sm group-hover:bg-accent/5",
                                      b.hasOverdue && "bg-destructive/5"
                                    )}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setExpandedBundles(prev => {
                                        const next = new Set(prev);
                                        const k = `${phase}:${b.key}`;
                                        next.has(k) ? next.delete(k) : next.add(k);
                                        return next;
                                      })}
                                      className="flex items-center gap-2 flex-1 min-w-[180px] text-left hover:opacity-80 transition-opacity"
                                    >
                                      {bExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                                      <StatusDot status={b.status} />
                                      <span className="font-semibold text-foreground truncate">
                                        {de ? b.title : b.titleEn}
                                      </span>
                                    </button>
                                    <Badge variant="outline" className="text-[10px] gap-1">
                                      {b.doneCount}/{b.totalCount} {de ? "fertig" : "done"}
                                    </Badge>
                                    {b.isQuickWin && (
                                      <Badge className="text-[10px] gap-1 bg-secondary text-secondary-foreground border-secondary">
                                        <Sparkles className="h-3 w-3" /> Quick-Win
                                      </Badge>
                                    )}
                                    {b.hasHighRisk && (
                                      <Badge variant="destructive" className="text-[10px]">
                                        {de ? "Hohes Risiko" : "High Risk"}
                                      </Badge>
                                    )}
                                    {b.hasOverdue && (
                                      <Badge variant="outline" className="text-[10px] border-destructive text-destructive">
                                        {de ? "Überfällig" : "Overdue"}
                                      </Badge>
                                    )}
                                    {b.earliestDue && (
                                      <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {fmtDate(b.earliestDue)}
                                      </span>
                                    )}
                                    {/* Inline bundle-owner picker — writes to shared nis2-bundle-owners state */}
                                    <PersonnelPicker
                                      value={resolveBundleOwner(b.key, b.members.map(m => m.owner))}
                                      onChange={(v) => setBundleOwner(b.key, v)}
                                      size="sm"
                                      placeholder={de ? "Bundle-Verantwortlicher" : "Bundle owner"}
                                      className="h-7 text-[11px] min-w-[150px] max-w-[220px]"
                                    />
                                    {/* Bundle-level due date — overrides earlier per-measure dates */}
                                    <DatePickerPopover
                                      value={getBundleDueDate(b.key)}
                                      onChange={(v) => setBundleDueDate(b.key, v)}
                                      placeholder={de ? "Fällig" : "Due"}
                                      title={de ? "Bundle-Fälligkeitsdatum (überschreibt frühere Termine)" : "Bundle due date (overrides earlier per-measure dates)"}
                                      ariaLabel={de ? "Bundle-Fälligkeitsdatum" : "Bundle due date"}
                                      locale={de ? deLocale : enUS}
                                      className="h-7 text-[11px]"
                                    />

                                    {b.ownerCount > 1 && (
                                      <span
                                        className="text-[10px] text-muted-foreground"
                                        title={de ? "Mitglieder haben zusätzliche eigene Owner" : "Members have additional individual owners"}
                                      >
                                        +{b.ownerCount - 1} {de ? "weitere" : "more"}
                                      </span>
                                    )}
                                    <RoleEffortBar effort={b.effortByRole} total={b.totalEffort} de={de} />
                                  </div>
                                  <div className="px-3">
                                    <Progress value={pct} className="h-1" />
                                  </div>
                                  {bExpanded && (
                                    <div className="p-2 space-y-1 border-t bg-muted/20">
                                      {b.members.map(item => (
                                        <div
                                          key={item.id}
                                          className={cn(
                                            "flex flex-wrap items-center gap-2 p-2 rounded-md border text-xs",
                                            item.isOverdue ? "bg-destructive/5 border-destructive/20" : "bg-background border-border"
                                          )}
                                        >
                                          <StatusDot status={item.status} />
                                          <span className="flex-1 min-w-[160px] font-medium text-foreground truncate">
                                            {de ? item.name : item.nameEn}
                                          </span>
                                          {item.linkedToHighRisk && (
                                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                              {de ? "Hohes Risiko" : "High Risk"}
                                            </Badge>
                                          )}
                                          {item.owner && (
                                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                              {item.owner}
                                            </span>
                                          )}
                                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            <DatePickerPopover
                                              value={item.dueDate ?? ""}
                                              onChange={(v) => updateActionField(item.id, { due_date: v })}
                                              placeholder={de ? "Frist" : "Due"}
                                              title={de ? "Frist für diese Maßnahme" : "Due date for this measure"}
                                              ariaLabel={de ? "Frist" : "Due date"}
                                              locale={de ? deLocale : enUS}
                                              className="h-6 text-[11px]"
                                            />
                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                            <Input
                                              type="number" min={0.5} step={0.5}
                                              value={item.effortDays}
                                              onChange={(e) => updateActionField(item.id, { effort_days: Number(e.target.value) })}
                                              className="h-6 w-14 text-[11px] px-1.5"
                                              title={de ? "Aufwand überschreiben" : "Override effort"}
                                            />
                                            <span className="text-[10px] text-muted-foreground">{de ? "PT" : "PD"}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {isExpanded && items.length > 0 && rmMode === "detailed" && (
                          <div className="ml-14 mt-2 space-y-1.5">
                            {items.slice(0, 15).map(item => (
                              <div
                                key={item.id}
                                className={cn(
                                  "flex flex-wrap items-center gap-2 p-2.5 rounded-lg border text-sm transition-all",
                                  item.isOverdue ? "bg-destructive/5 border-destructive/20" : "bg-card border-border hover:border-primary/20"
                                )}
                              >
                                <StatusDot status={item.status} />
                                <span className="flex-1 min-w-[180px] font-medium text-foreground truncate">
                                  {de ? item.name : item.nameEn}
                                </span>
                                {item.linkedToHighRisk && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    {de ? "Hohes Risiko" : "High Risk"}
                                  </Badge>
                                )}
                                {item.isOverdue && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive text-destructive">
                                    {de ? "Überfällig" : "Overdue"}
                                  </Badge>
                                )}
                                {item.owner && (
                                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {item.owner}
                                  </span>
                                )}
                                <DatePickerPopover
                                  value={item.dueDate ?? ""}
                                  onChange={(v) => updateActionField(item.id, { due_date: v })}
                                  placeholder={de ? "Frist" : "Due"}
                                  title={de ? "Frist für diese Maßnahme" : "Due date for this measure"}
                                  ariaLabel={de ? "Frist" : "Due date"}
                                  locale={de ? deLocale : enUS}
                                  className="h-7 text-xs"
                                />
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <Input
                                    type="number" min={0.5} step={0.5}
                                    value={item.effortDays}
                                    onChange={(e) => updateActionField(item.id, { effort_days: Number(e.target.value) })}
                                    className="h-7 w-16 text-xs px-1.5"
                                    title={de ? "Aufwand überschreiben" : "Override effort"}
                                  />
                                  <span className="text-[10px] text-muted-foreground">{de ? "PT" : "PD"}</span>
                                </div>
                              </div>
                            ))}
                            {items.length > 15 && (
                              <p className="text-xs text-muted-foreground pl-2">
                                +{items.length - 15} {de ? "weitere" : "more"}…
                              </p>
                            )}
                          </div>
                        )}

                        {isExpanded && items.length === 0 && (
                          <div className="ml-14 mt-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                            {de ? "Keine offenen Maßnahmen in dieser Phase." : "No open actions in this phase."}
                          </div>
                        )}
                      </div>
                    );
                  });
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Framework-Pflichten (Delta, Rechtsquellen) */}
            <DeltaObligationsCard />
          </TabsContent>


          {/* ── Timeline Tab ── */}
          <TabsContent value="timeline" className="space-y-4 mt-4">
            {/* Gantt = Experten-Detailplanung; im Überblick ausgeblendet. */}
            {expert && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {de ? "Gantt-Ansicht nach Priorität" : "Gantt View by Priority"}
                  <RoadmapRichTip tipKey="gantt" de={de} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GanttChart
                  items={roadmapItems}
                  de={de}
                  targetDate={roadmapConfig.targetDate}
                  getBundleDueDate={getBundleDueDate}
                />

              </CardContent>
            </Card>
            )}

            {/* Milestones Detail */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Milestone className="h-4 w-4" />
                  {de ? "Meilensteine" : "Milestones"}
                  <RoadmapRichTip tipKey="milestones" de={de} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {milestones.map(m => (
                    <div
                      key={m.id}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border transition-all",
                        m.achieved ? "st-ja-tint st-ja-border" : "bg-card border-border"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-full",
                        m.achieved ? "st-ja-tint st-ja-text" : "bg-muted text-muted-foreground"
                      )}>
                        {m.icon}
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-sm font-medium", m.achieved ? "st-ja-text" : "text-foreground")}>
                          {de ? m.label : m.labelEn}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={Math.min(100, (m.currentPct / m.targetPct) * 100)} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground">{m.targetPct}%</span>
                        </div>
                      </div>
                      {m.achieved && <CheckCircle2 className="h-5 w-5 st-ja-text flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Resources Tab ── */}
          <TabsContent value="resources" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {de ? "Arbeitsbelastung pro Owner" : "Workload per Owner"}
                  <RoadmapRichTip tipKey="owner_workload" de={de} />
                </CardTitle>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-muted-foreground">{de ? "Anzeigen:" : "Show:"}</span>
                  <select
                    value={ownerPageSize}
                    onChange={e => { setOwnerPageSize(Number(e.target.value)); setOwnerPage(0); }}
                    className="text-xs border rounded px-1.5 py-0.5 bg-background text-foreground"
                  >
                    {Array.from({ length: Math.ceil(ownerChartData.length / 5) }, (_, i) => (i + 1) * 5).filter(v => v <= ownerChartData.length).concat(ownerChartData.length).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b).map(n => (
                      <option key={n} value={n}>{n === ownerChartData.length ? (de ? `Alle (${n})` : `All (${n})`) : n}</option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {ownerChartData.length > 0 ? (
                  <>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={ownerChartData.slice(ownerPage * ownerPageSize, (ownerPage + 1) * ownerPageSize)} margin={{ left: 10, right: 20, bottom: 70 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={55} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ReTooltip
                        formatter={(value: number | string, name: string) => [value, name]}
                        labelFormatter={(label: string) => {
                          const item = ownerChartData.find(d => d.name === label);
                          return item?.fullName ?? label;
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: 10 }} />
                      <Bar dataKey="open" name={de ? "Offen" : "Open"} stackId="a" fill={CHART_STATUS.na} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="overdue" name={de ? "Überfällig" : "Overdue"} stackId="a" fill={CHART_STATUS.nein} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="completed" name={de ? "Fertig" : "Done"} stackId="a" fill={CHART_STATUS.ja} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  {ownerChartData.length > ownerPageSize && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <Button variant="outline" size="sm" disabled={ownerPage === 0} onClick={() => setOwnerPage(p => p - 1)}>
                        ← {de ? "Zurück" : "Prev"}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {ownerPage * ownerPageSize + 1}–{Math.min((ownerPage + 1) * ownerPageSize, ownerChartData.length)} / {ownerChartData.length}
                      </span>
                      <Button variant="outline" size="sm" disabled={(ownerPage + 1) * ownerPageSize >= ownerChartData.length} onClick={() => setOwnerPage(p => p + 1)}>
                        {de ? "Weiter" : "Next"} →
                      </Button>
                    </div>
                  )}
                  </>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>{de ? "Keine Owner zugewiesen. Weisen Sie Owner in der Umsetzung (Phase 6) zu." : "No owners assigned. Assign owners in Implementation (Phase 6)."}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owner summary cards — click to reveal assigned bundles and controls in this tab */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(stats.ownerMap)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([owner, d]) => {
                  const pct = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;
                  const isActive = ownerFilter === owner;
                  return (
                    <button
                      key={owner}
                      type="button"
                      onClick={() => {
                        const next = isActive ? null : owner;
                        setOwnerFilter(next);
                      }}
                      aria-pressed={isActive}
                      title={isActive
                        ? (de ? "Filter entfernen" : "Clear filter")
                        : (de ? `Bündel und Kontrollen von ${owner} anzeigen` : `Show bundles and controls for ${owner}`)}
                      className={cn(
                        "text-left rounded-lg border bg-card transition-all hover:shadow-sm hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40",
                        d.overdue > 0 && "border-destructive/20",
                        isActive && "border-primary ring-2 ring-primary/30 bg-primary/5"
                      )}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <span className="text-sm font-semibold text-foreground truncate">{owner}</span>
                          <span className="text-sm font-bold text-primary shrink-0">{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-2 mb-2" />
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{d.total} {de ? "gesamt" : "total"}</span>
                          <span className="st-ja-text">{d.completed} ✓</span>
                          {d.overdue > 0 && <span className="text-destructive">{d.overdue} {de ? "überfällig" : "overdue"}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>

            {ownerFilter && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex flex-wrap items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{de ? "Zugewiesene Bündel & Kontrollkarten" : "Assigned bundles & control cards"}</span>
                    <Badge variant="outline" className="border-primary/40 text-primary">{ownerFilter}</Badge>
                    <Button variant="ghost" size="sm" className="ml-auto h-7 px-2 text-xs" onClick={() => setOwnerFilter(null)}>
                      {de ? "Filter entfernen" : "Clear filter"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ownerFilteredPhases.length > 0 ? ownerFilteredPhases.map(({ phase, bundles }) => {
                    const config = PHASE_CONFIG[phase];
                    const Icon = config.icon;
                    return (
                      <div key={phase} className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full border", config.bg, config.border)}>
                            <Icon className={cn("h-3.5 w-3.5", config.color)} />
                          </span>
                          <span className={config.color}>{de ? config.label.de : config.label.en}</span>
                          <span className="text-xs text-muted-foreground">({bundles.length} {de ? "Bündel" : "bundles"})</span>
                        </div>
                        <div className="space-y-2">
                          {bundles.map(bundle => {
                            const bundleOwner = resolveBundleOwner(bundle.key, bundle.members.map(m => m.owner));
                            const pct = bundle.totalCount > 0 ? Math.round((bundle.doneCount / bundle.totalCount) * 100) : 0;
                            return (
                              <div key={`${phase}:${bundle.key}`} className="rounded-lg border bg-card overflow-hidden">
                                <div className="flex flex-wrap items-center gap-2 p-2.5 text-sm">
                                  <StatusDot status={bundle.status} />
                                  <span className="flex-1 min-w-[180px] font-semibold text-foreground truncate">
                                    {de ? bundle.title : bundle.titleEn}
                                  </span>
                                  {bundleOwner && (
                                    <Badge variant="outline" className="text-[10px]">{bundleOwner}</Badge>
                                  )}
                                  <Badge variant="outline" className="text-[10px]">
                                    {bundle.doneCount}/{bundle.totalCount} {de ? "fertig" : "done"}
                                  </Badge>
                                  {bundle.earliestDue && (
                                    <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {fmtDate(bundle.earliestDue)}
                                    </span>
                                  )}
                                </div>
                                <div className="px-3">
                                  <Progress value={pct} className="h-1" />
                                </div>
                                <div className="p-2 space-y-1 border-t bg-muted/20">
                                  {bundle.members.map(item => (
                                    <div
                                      key={item.id}
                                      className={cn(
                                        "flex flex-wrap items-center gap-2 p-2 rounded-md border text-xs",
                                        item.isOverdue ? "bg-destructive/5 border-destructive/20" : "bg-background border-border"
                                      )}
                                    >
                                      <StatusDot status={item.status} />
                                      <span className="flex-1 min-w-[160px] font-medium text-foreground truncate">
                                        {de ? item.name : item.nameEn}
                                      </span>
                                      {item.linkedToHighRisk && (
                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                          {de ? "Hohes Risiko" : "High Risk"}
                                        </Badge>
                                      )}
                                      {item.owner && (
                                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                          {item.owner}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-muted-foreground">{item.effortDays} {de ? "PT" : "PD"}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                      {de ? "Keine offenen Bündel oder Kontrollkarten für diesen Owner." : "No open bundles or control cards for this owner."}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        </>
        )}

      </main>
    </div>
  );
};

// ── DatePickerPopover — shadcn calendar in popover, day-level selection ──

function DatePickerPopover({
  value,
  onChange,
  placeholder,
  title,
  ariaLabel,
  className,
  locale,
}: {
  value: string; // yyyy-mm-dd
  onChange: (v: string) => void;
  placeholder?: string;
  title?: string;
  ariaLabel?: string;
  className?: string;
  locale?: typeof deLocale;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + "T00:00:00") : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={title}
          aria-label={ariaLabel}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2 text-left hover:bg-muted transition-colors",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <Calendar className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {selected ? format(selected, "dd.MM.yyyy") : (placeholder ?? "—")}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[60]" align="start">
        <CalendarUI
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (d) {
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const dd = String(d.getDate()).padStart(2, "0");
              onChange(`${yyyy}-${mm}-${dd}`);
              setOpen(false);
            } else {
              onChange("");
            }
          }}
          locale={locale}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
        {value && (
          <div className="border-t p-2 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => { onChange(""); setOpen(false); }}>
              ×
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ── InfoTip (legacy simple) ──

function InfoTip({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span role="button" tabIndex={0} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} className="p-0.5 rounded-full hover:bg-muted transition-colors" aria-label="Info">
          <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
        </span>
      </PopoverTrigger>
      <PopoverContent className="max-w-xs text-xs text-muted-foreground leading-relaxed" side="top">
        {text}
      </PopoverContent>
    </Popover>
  );
}

// ── Strategic structured InfoTip (Was / Warum / Beispiel / Tipp) ──
type RoadmapTipKey =
  | "page" | "overall_progress" | "now" | "overdue" | "in_progress"
  | "audit_readiness" | "phase_distribution" | "status_distribution"
  | "sequencing" | "gantt" | "milestones" | "owner_workload";

const ROADMAP_TIPS: Record<RoadmapTipKey, { de: { was: string; warum: string; beispiel?: string; tipp?: string }; en: { was: string; warum: string; beispiel?: string; tipp?: string } }> = {
  page: {
    de: { was: "Step 15 ist die zeitliche Sequenzierung Ihrer Maßnahmen aus Steps 9, 10, 12 in drei Horizonte: Now / Next / Later.", warum: "Ohne klare Zeitachse werden alle Maßnahmen gleichzeitig angefangen und keine fertig. Die Roadmap zwingt zur Priorisierung und macht Ressourcenkonflikte sichtbar.", beispiel: "150 offene Maßnahmen → Roadmap zeigt: 12 in “Now” (sofort), 45 in “Next” (3-6 Monate), 93 in “Later” (>6 Monate). Team weiß, was diese Woche zu tun ist.", tipp: "Lebendiges Dokument: alle 2 Wochen prüfen — was rutscht von Next nach Now?" },
    en: { was: "Step 15 sequences your actions from Steps 9, 10, 12 into three horizons: Now / Next / Later.", warum: "Without a clear timeline all actions get started in parallel and none get finished. The roadmap forces prioritization and surfaces resource conflicts.", beispiel: "150 open actions → Roadmap shows: 12 in “Now” (immediate), 45 in “Next” (3-6 months), 93 in “Later” (>6 months). The team knows what to do this week.", tipp: "Living document: review every 2 weeks — what slips from Next into Now?" },
  },
  overall_progress: {
    de: { was: "Anteil aller anwendbaren Kontrollen, die als “Fertig” oder vollständig umgesetzt markiert sind.", warum: "Die einzige aggregierte Kennzahl, die direkt mit Audit-Bereitschaft korreliert. Ein Audit erwartet realistisch ≥ 80 %.", beispiel: "65 % von 236 anwendbaren Kontrollen fertig → 154 erledigt, 82 offen → noch ca. 9 Monate Vollzeit-Arbeit.", tipp: "Wachstum < 5 %/Quartal = Roadmap zu ambitioniert oder Ressourcen zu knapp." },
    en: { was: "Share of all applicable controls marked “Done” or fully implemented.", warum: "The only aggregated KPI that directly correlates with audit readiness. Audits realistically expect ≥ 80 %.", beispiel: "65 % of 236 applicable controls done → 154 finished, 82 open → ~9 more months of full-time work.", tipp: "Growth < 5 %/quarter = roadmap too ambitious or resources too tight." },
  },
  now: {
    de: { was: "“Now” enthält Maßnahmen mit hoher Priorität, hohem Risiko-Link oder überfälligem Datum — sofort handeln.", warum: "Wenn diese Zahl > 20 ist, kann das Team realistisch nicht alles parallel bearbeiten. Eskalation oder Re-Prioritisierung ist nötig.", beispiel: "12 Now-Items, davon 8 mit “Hochrisiko”-Link → CISO-Meeting diese Woche.", tipp: "Faustregel: Now-Anzahl ≤ Teamgröße × 2." },
    en: { was: "“Now” contains actions with high priority, high-risk linkage, or overdue dates — act immediately.", warum: "If this number > 20, the team cannot realistically work them all in parallel. Escalation or re-prioritization is needed.", beispiel: "12 Now items, 8 with “High Risk” link → CISO meeting this week.", tipp: "Rule of thumb: Now count ≤ team size × 2." },
  },
  overdue: {
    de: { was: "Maßnahmen mit überschrittenem Fälligkeitsdatum, die noch nicht “Fertig” sind.", warum: "Überfällige Items sind das stärkste Frühwarnsignal für Audit-Risiken — Auditoren prüfen genau, warum sie liegen blieben.", beispiel: "5 überfällig + alle haben gleichen Owner → Person ist überlastet → Workload-Umverteilung.", tipp: "Jede überfällige Maßnahme braucht entweder neues Datum (mit Begründung!) oder Eskalation. Nie ignorieren." },
    en: { was: "Actions past their due date that are not yet “Done”.", warum: "Overdue items are the strongest early warning for audit risk — auditors will probe why they were left to drift.", beispiel: "5 overdue + all share the same owner → person overloaded → re-balance workload.", tipp: "Every overdue item needs either a new date (with justification!) or escalation. Never ignore." },
  },
  in_progress: {
    de: { was: "Anzahl Maßnahmen mit Status “Laufend” — d. h. aktiv bearbeitet.", warum: "Zu viele parallele Maßnahmen = WIP-Limit überschritten = nichts wird fertig (Little's Law). 5–10 pro Person ist gesund.", beispiel: "40 In-Progress bei 4 Personen → 10/Person → grenzwertig. 80 → klar zu viel.", tipp: "Lieber wenige Items abschließen als viele anfangen — “Stop starting, start finishing”." },
    en: { was: "Number of actions in status “In Progress” — actively being worked.", warum: "Too many in parallel = WIP limit exceeded = nothing finishes (Little's Law). 5–10 per person is healthy.", beispiel: "40 in progress with 4 people → 10/person → borderline. 80 → clearly too many.", tipp: "Better finish a few than start many — “Stop starting, start finishing”." },
  },
  audit_readiness: {
    de: { was: "Visueller Fortschrittsbalken Richtung 100 % Audit-Bereitschaft mit Meilenstein-Markierungen bei 25/50/75/100 %.", warum: "Macht den langen Compliance-Weg in greifbare Etappen messbar — psychologisch wichtig für Team-Motivation.", tipp: "Nach jedem Meilenstein: kurzes Retro + sichtbare Anerkennung. Sonst verbrennen Sie Ihr Team." },
    en: { was: "Visual progress bar towards 100 % audit readiness with milestone markers at 25/50/75/100 %.", warum: "Turns the long compliance journey into measurable stages — psychologically critical for team motivation.", tipp: "After each milestone: brief retro + visible recognition. Otherwise you burn out your team." },
  },
  phase_distribution: {
    de: { was: "Verteilung offener Maßnahmen über die drei Horizonte Now / Next / Later.", warum: "Eine gesunde Pyramide hat ungefähr 10 % Now, 30 % Next, 60 % Later. Anders → Pipeline-Stau.", beispiel: "60 % Now, 30 % Next, 10 % Later → Pipeline ist “auf Anschlag”, Team wird brennen. Re-Priorisierung dringend.", tipp: "Wenn Later = 0 → Sie planen nicht weit genug. Wenn Now > Later → Sie reagieren nur." },
    en: { was: "Distribution of open actions across the three horizons Now / Next / Later.", warum: "A healthy pyramid has roughly 10 % Now, 30 % Next, 60 % Later. Otherwise → pipeline jam.", beispiel: "60 % Now, 30 % Next, 10 % Later → pipeline is “red-lined”, team will burn out. Urgent re-priorit.", tipp: "If Later = 0 → you don't plan far enough. If Now > Later → you only react." },
  },
  status_distribution: {
    de: { was: "Statusverteilung aller Maßnahmen: Offen, Laufend, Fertig, Blockiert.", warum: "Hoher “Blockiert”-Anteil ist Alarmsignal — meist fehlt Budget, Ownership oder externe Abhängigkeit. Diese müssen aktiv aufgelöst werden.", beispiel: "8 % blockiert, alle wegen “wartet auf IT-Beschaffung” → strukturelles Problem, nicht operatives.", tipp: "Blockierte Items haben höchste Eskalations-Priorität — sie verstopfen die ganze Pipeline." },
    en: { was: "Status distribution of all actions: Open, In Progress, Done, Blocked.", warum: "A high “Blocked” share is an alarm signal — usually budget, ownership or external dependency is missing. Must be actively resolved.", beispiel: "8 % blocked, all due to “waiting on IT procurement” → structural, not operational issue.", tipp: "Blocked items have highest escalation priority — they jam the whole pipeline." },
  },
  sequencing: {
    de: { was: "Automatische Zuordnung jeder Maßnahme zu Now / Next / Later auf Basis von Priorität, Risiko-Link, Fälligkeit.", warum: "Verhindert Cherry-Picking (“Ich mache erst die einfachen”) und ist auditierbar reproduzierbar.", beispiel: "Maßnahme “MFA für Admins”: Priorität=hoch + Risk-Link=ja + Fällig in 30T → automatisch Now.", tipp: "Diese Logik ist Ihr stärkstes Argument gegenüber dem Vorstand: keine Willkür, klare Regeln." },
    en: { was: "Automatic assignment of every action to Now / Next / Later based on priority, risk link, due date.", warum: "Prevents cherry-picking (“I'll do the easy ones first”) and is audit-reproducible.", beispiel: "Action “MFA for admins”: priority=high + risk link=yes + due in 30 days → auto Now.", tipp: "This logic is your strongest board argument: no arbitrariness, clear rules." },
  },
  gantt: {
    de: { was: "Gantt-Verteilung der Maßnahmen nach Prioritätsstufe (Hoch/Mittel/Niedrig) mit Bearbeitungs- und Überfällig-Anteil.", warum: "Zeigt sofort, ob Sie Ihre wertvollste Ressource (Zeit) auf hoch-priorisierte oder niedrig-priorisierte Items verteilen.", beispiel: "Mittel-Prio Bar dominiert → Team arbeitet am Falschen → re-prioritisieren oder Definition prüfen.", tipp: "Ziel: Hoch-Prio Bar sollte am dunkelsten sein (am meisten in Bearbeitung)." },
    en: { was: "Gantt distribution of actions by priority (High/Medium/Low) with in-progress and overdue share.", warum: "Immediately shows whether you spend your most valuable resource (time) on high or low priority items.", beispiel: "Medium-prio bar dominates → team works the wrong things → re-prioritize or revisit definitions.", tipp: "Target: high-prio bar should be the darkest (most in progress)." },
  },
  milestones: {
    de: { was: "Etappenziele auf dem Weg zur 100 % Audit-Bereitschaft (25/50/75/100 %).", warum: "Compliance-Projekte dauern 12–24 Monate. Ohne Zwischenziele verliert das Team Energie.", beispiel: "Meilenstein 50 % erreicht → kleine Feier, Vorstand-Update, Roadmap-Review.", tipp: "Definieren Sie pro Meilenstein einen konkreten Audit-Output (z. B. “SoA freigegeben”) — sonst werden sie weich." },
    en: { was: "Checkpoints on the path to 100 % audit readiness (25/50/75/100 %).", warum: "Compliance projects last 12–24 months. Without interim goals the team loses energy.", beispiel: "Milestone 50 % reached → small celebration, board update, roadmap review.", tipp: "Define a concrete audit output per milestone (e.g. “SoA approved”) — otherwise they go soft." },
  },
  owner_workload: {
    de: { was: "Verteilung aller Maßnahmen auf die zugewiesenen Owner — mit Anteil Offen / Fertig / Überfällig.", warum: "Macht Überlastung sichtbar, BEVOR Owner kündigen oder Items dauerhaft stehen bleiben.", beispiel: "Person A: 30 Items, davon 8 überfällig | Person B: 5 Items, alle fertig → klare Umverteilung nötig.", tipp: "Faustregel: kein Owner sollte mehr als 15 aktive Maßnahmen haben — sonst geht Qualität verloren." },
    en: { was: "Distribution of all actions across assigned owners — with open / done / overdue split.", warum: "Surfaces overload BEFORE owners quit or items stall permanently.", beispiel: "Person A: 30 items, 8 overdue | Person B: 5 items, all done → clear re-balancing needed.", tipp: "Rule: no owner should have more than 15 active actions — quality drops otherwise." },
  },
};

function RoadmapRichTip({ tipKey, de }: { tipKey: RoadmapTipKey; de: boolean }) {
  const c = ROADMAP_TIPS[tipKey][de ? "de" : "en"];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span role="button" tabIndex={0} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors ml-1 shrink-0" aria-label="Info">
          <Info className="h-3 w-3" />
        </span>
      </PopoverTrigger>
      <PopoverContent className="text-xs leading-relaxed max-w-sm z-[60] space-y-2" side="top" align="center">
        <div><span className="font-semibold text-primary">{de ? "Was:" : "What:"}</span> {c.was}</div>
        <div><span className="font-semibold text-primary">{de ? "Warum:" : "Why:"}</span> {c.warum}</div>
        {c.beispiel && <div><span className="font-semibold text-primary">{de ? "Beispiel:" : "Example:"}</span> {c.beispiel}</div>}
        {c.tipp && <div className="pt-1 border-t"><span className="font-semibold st-teilweise-text">{de ? "💡 Tipp:" : "💡 Tip:"}</span> {c.tipp}</div>}
      </PopoverContent>
    </Popover>
  );
}

// ── Sub-components ──

function StatCard({ icon, label, value, sub, color, info, infoNode }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string; info?: string; infoNode?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className={cn("p-1.5 rounded-lg bg-muted", color)}>{icon}</div>
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
          {infoNode ? infoNode : (info && <InfoTip text={info} />)}
        </div>
        <p className={cn("text-2xl font-bold", color)}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function StatusDot({ status }: { status: ActionStatus }) {
  const colors: Record<ActionStatus, string> = {
    offen: "bg-muted-foreground",
    laufend: "bg-primary",
    fertig: "st-ja-bg",
    blockiert: "bg-destructive",
  };
  return <div className={cn("w-2 h-2 rounded-full flex-shrink-0", colors[status])} />;
}

function GanttChart({
  items,
  de,
  targetDate,
  getBundleDueDate,
}: {
  items: RoadmapItem[];
  de: boolean;
  targetDate?: string;
  getBundleDueDate?: (bundleKey: string) => string;
}) {
  // Real, calendar-anchored Gantt: Phase → Bundle → Action.
  // Each action's bar END = its dueDate (set in Step 9 / Step 15 bundle picker);
  // START = end − effortDays. Items without a dueDate fall back to sequential
  // placement after the previous member's end inside the same bundle.
  // Bundle and phase bars span min(start)…max(end) of their children.
  const [ganttExpandedPhases, setGanttExpandedPhases] = useState<Set<Phase>>(new Set());
  const [ganttExpandedBundles, setGanttExpandedBundles] = useState<Set<string>>(new Set());

  const phases: Phase[] = ["now", "next", "later"];
  const openItems = items.filter(i => i.status !== "fertig");

  const PHASE_PALETTE: Record<Phase, { base: string; mid: string; soft: string; label: string }> = {
    now:   { base: "hsl(0 75% 55%)",    mid: "hsl(0 75% 68%)",    soft: "hsl(0 75% 86%)",    label: de ? "Jetzt" : "Now" },
    next:  { base: "hsl(38 92% 50%)",   mid: "hsl(38 92% 62%)",   soft: "hsl(38 92% 84%)",   label: de ? "Nächste" : "Next" },
    later: { base: "hsl(220 80% 52%)",  mid: "hsl(220 80% 65%)",  soft: "hsl(220 80% 86%)",  label: de ? "Später" : "Later" },
  };

  const DAY = 86_400_000;
  const MIN_DAYS = 0.5;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const parseDate = (s?: string): number | null => {
    if (!s) return null;
    const d = new Date(s.length <= 10 ? s + "T00:00:00" : s);
    const t = d.getTime();
    return Number.isFinite(t) ? t : null;
  };
  const targetMs = parseDate(targetDate);

  type Row = {
    level: 0 | 1 | 2;
    key: string;
    label: string;
    startMs: number;
    endMs: number;
    phase: Phase;
    bundleKey?: string;
    expandable?: boolean;
    expanded?: boolean;
    members?: number;
    badges?: { high?: boolean; overdue?: boolean; quickWin?: boolean };
    hasDate?: boolean;
  };

  // Build all rows with absolute date windows.
  type MemberBar = {
    id: string; phase: Phase; bundleKey: string;
    label: string; startMs: number; endMs: number;
    hasDate: boolean;
    badges?: { high?: boolean; overdue?: boolean };
  };
  type BundleBar = {
    phase: Phase; bundleKey: string; title: string;
    members: MemberBar[];
    startMs: number; endMs: number;
    badges?: { high?: boolean; overdue?: boolean; quickWin?: boolean };
    count: number;
  };

  const allBundleBars: BundleBar[] = [];
  let fallbackCursor = todayMs; // for items without any dueDate anywhere

  for (const phase of phases) {
    const phaseItems = openItems.filter(i => i.phase === phase);
    if (phaseItems.length === 0) continue;
    const bundles = buildBundles(phaseItems);

    for (const b of bundles) {
      // Sort members: dated first (by date asc), then undated by ROI desc
      const dated = b.members.filter(m => parseDate(m.dueDate) != null)
        .sort((a, c) => (parseDate(a.dueDate)! - parseDate(c.dueDate)!));
      const undated = b.members.filter(m => parseDate(m.dueDate) == null)
        .sort((a, c) => c.roi - a.roi);

      const memberBars: MemberBar[] = [];
      // Track a "last end" cursor inside the bundle so undated items chain
      // after the latest dated sibling.
      let bundleCursor = dated.length > 0
        ? Math.max(todayMs, parseDate(dated[0].dueDate)! - eff(dated[0].effortDays) * DAY)
        : fallbackCursor;

      for (const m of dated) {
        const endMs = parseDate(m.dueDate)!;
        const durDays = eff(m.effortDays);
        const startMs = Math.max(todayMs, endMs - durDays * DAY);
        memberBars.push({
          id: m.id, phase, bundleKey: b.key,
          label: de ? m.name : m.nameEn,
          startMs, endMs, hasDate: true,
          badges: { high: m.linkedToHighRisk, overdue: m.isOverdue },
        });
        bundleCursor = Math.max(bundleCursor, endMs);
      }
      for (const m of undated) {
        const durDays = eff(m.effortDays);
        const startMs = bundleCursor;
        const endMs = startMs + durDays * DAY;
        memberBars.push({
          id: m.id, phase, bundleKey: b.key,
          label: de ? m.name : m.nameEn,
          startMs, endMs, hasDate: false,
          badges: { high: m.linkedToHighRisk, overdue: m.isOverdue },
        });
        bundleCursor = endMs;
      }
      fallbackCursor = Math.max(fallbackCursor, bundleCursor);

      // Bundle-level due override (visual hint): if set, extend bundle end to it
      const bundleDueOverride = parseDate(getBundleDueDate?.(b.key));
      const bStart = Math.min(...memberBars.map(x => x.startMs));
      let bEnd = Math.max(...memberBars.map(x => x.endMs));
      if (bundleDueOverride != null) bEnd = Math.max(bEnd, bundleDueOverride);

      allBundleBars.push({
        phase, bundleKey: `${phase}:${b.key}`,
        title: de ? b.title : b.titleEn,
        members: memberBars,
        startMs: bStart, endMs: bEnd,
        badges: { high: b.hasHighRisk, overdue: b.hasOverdue, quickWin: b.isQuickWin },
        count: b.totalCount,
      });
    }
  }

  // Compute global window
  const allEnds = allBundleBars.flatMap(b => [b.endMs, ...b.members.map(m => m.endMs)]);
  const allStarts = allBundleBars.flatMap(b => [b.startMs, ...b.members.map(m => m.startMs)]);
  const windowStart = Math.min(todayMs, ...(allStarts.length ? allStarts : [todayMs]));
  const windowEndRaw = Math.max(
    todayMs + 30 * DAY,
    ...(allEnds.length ? allEnds : []),
    targetMs ?? 0,
  );
  // Add small right padding (5% of span)
  const span = Math.max(windowEndRaw - windowStart, DAY);
  const windowEnd = windowEndRaw + span * 0.04;

  // Build flat row list honoring expansion state
  const rows: Row[] = [];
  for (const phase of phases) {
    const bundlesInPhase = allBundleBars.filter(b => b.phase === phase);
    if (bundlesInPhase.length === 0) continue;
    const pStart = Math.min(...bundlesInPhase.map(b => b.startMs));
    const pEnd = Math.max(...bundlesInPhase.map(b => b.endMs));
    rows.push({
      level: 0, key: `p:${phase}`,
      label: PHASE_PALETTE[phase].label,
      startMs: pStart, endMs: pEnd, phase,
      expandable: true, expanded: ganttExpandedPhases.has(phase),
      members: bundlesInPhase.reduce((s, b) => s + b.count, 0),
      hasDate: bundlesInPhase.some(b => b.members.some(m => m.hasDate)),
    });
    if (ganttExpandedPhases.has(phase)) {
      for (const b of bundlesInPhase) {
        rows.push({
          level: 1, key: `b:${b.bundleKey}`,
          label: b.title, startMs: b.startMs, endMs: b.endMs,
          phase, bundleKey: b.bundleKey,
          expandable: true, expanded: ganttExpandedBundles.has(b.bundleKey),
          members: b.count, badges: b.badges,
          hasDate: b.members.some(m => m.hasDate),
        });
        if (ganttExpandedBundles.has(b.bundleKey)) {
          for (const m of b.members) {
            rows.push({
              level: 2, key: `m:${b.bundleKey}:${m.id}`,
              label: m.label, startMs: m.startMs, endMs: m.endMs,
              phase, badges: m.badges, hasDate: m.hasDate,
            });
          }
        }
      }
    }
  }

  function eff(n: number) { return Math.max(n || 0, MIN_DAYS); }

  if (rows.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        {de ? "Keine offenen Maßnahmen für die Gantt-Ansicht." : "No open actions for the Gantt view."}
      </div>
    );
  }

  // Axis ticks: real calendar dates
  const totalSpan = windowEnd - windowStart;
  const tickCount = 7;
  const axisTicks: { offsetPct: number; label: string }[] = [];
  for (let i = 0; i <= tickCount; i++) {
    const ms = windowStart + (totalSpan / tickCount) * i;
    const d = new Date(ms);
    axisTicks.push({
      offsetPct: ((ms - windowStart) / totalSpan) * 100,
      label: d.toLocaleDateString(de ? "de-DE" : "en-GB", { day: "2-digit", month: "short", year: "2-digit" }),
    });
  }
  const todayPct = ((todayMs - windowStart) / totalSpan) * 100;
  const targetPct = targetMs != null ? ((targetMs - windowStart) / totalSpan) * 100 : null;

  const togglePhaseRow = (p: Phase) => setGanttExpandedPhases(prev => {
    const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n;
  });
  const toggleBundleRow = (k: string) => setGanttExpandedBundles(prev => {
    const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n;
  });

  const LABEL_W = 260;
  const fmt = (ms: number) =>
    new Date(ms).toLocaleDateString(de ? "de-DE" : "en-GB", { day: "2-digit", month: "short", year: "2-digit" });

  return (
    <div className="space-y-3">
      {/* Legend + window */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        {phases.map(p => (
          <div key={p} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm shadow-sm" style={{ background: PHASE_PALETTE[p].base }} />
            <span className="text-foreground font-medium">{PHASE_PALETTE[p].label}</span>
          </div>
        ))}
        {targetMs != null && (
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "hsl(var(--primary))" }} />
            <span className="text-foreground font-medium">{de ? "Audit-Ziel" : "Audit target"}: {fmt(targetMs)}</span>
          </div>
        )}
        <span className="ml-auto inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {fmt(windowStart)} → {fmt(windowEndRaw)}
        </span>
      </div>

      {/* Time axis */}
      <div className="flex items-end">
        <div className="shrink-0" style={{ width: LABEL_W }} />
        <div className="relative w-full h-6 border-b border-border">
          {axisTicks.map((t, i) => (
            <div key={i} className="absolute top-0 bottom-0" style={{ left: `${t.offsetPct}%` }}>
              <span className="absolute -top-0.5 text-[10px] text-muted-foreground -translate-x-1/2 whitespace-nowrap">
                {t.label}
              </span>
              <div className="absolute bottom-0 left-0 w-px h-1.5 bg-border" />
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-1 relative">
        {/* Vertical grid lines */}
        <div className="absolute inset-0 pointer-events-none" style={{ left: LABEL_W }}>
          {axisTicks.map((t, i) => (
            <div key={i} className="absolute top-0 bottom-0 w-px bg-border/40"
                 style={{ left: `${t.offsetPct}%` }} />
          ))}
          {/* Today marker */}
          {todayPct >= 0 && todayPct <= 100 && (
            <div className="absolute top-0 bottom-0" style={{ left: `${todayPct}%` }}>
              <div className="w-px h-full st-ja-tint" />
              <span className="absolute -top-4 -translate-x-1/2 text-[9px] font-semibold st-ja-text whitespace-nowrap">
                {de ? "Heute" : "Today"}
              </span>
            </div>
          )}
          {/* Target date marker */}
          {targetPct != null && targetPct >= 0 && targetPct <= 100 && (
            <div className="absolute top-0 bottom-0" style={{ left: `${targetPct}%` }}>
              <div className="w-0.5 h-full" style={{ background: "hsl(var(--primary))" }} />
              <span className="absolute -top-4 -translate-x-1/2 text-[9px] font-semibold whitespace-nowrap" style={{ color: "hsl(var(--primary))" }}>
                {de ? "Ziel" : "Target"}
              </span>
            </div>
          )}
        </div>

        {rows.map(r => {
          const pal = PHASE_PALETTE[r.phase];
          const widthPct = Math.max(0.3, ((r.endMs - r.startMs) / totalSpan) * 100);
          const leftPct = ((r.startMs - windowStart) / totalSpan) * 100;
          const isPhase = r.level === 0;
          const isBundle = r.level === 1;
          const isMember = r.level === 2;
          const rowBg = isPhase ? "bg-muted/30" : isBundle ? "bg-muted/15" : "bg-transparent";
          const rowH = isPhase ? "h-9" : isBundle ? "h-7" : "h-6";
          const barH = isPhase ? "h-7" : isBundle ? "h-5" : "h-4";
          const indent = r.level * 14;
          const dashed = !r.hasDate && (isMember || isBundle);

          return (
            <div key={r.key} className={cn("flex items-stretch rounded transition-colors", rowBg, isMember && "hover:bg-muted/10")}>
              {/* Label */}
              <div
                className={cn(
                  "shrink-0 flex items-center gap-1.5 pr-2 text-xs",
                  rowH,
                  isPhase && "font-bold text-foreground",
                  isBundle && "font-semibold text-foreground",
                  isMember && "text-muted-foreground",
                )}
                style={{ width: LABEL_W, paddingLeft: 8 + indent }}
              >
                {r.expandable ? (
                  <button
                    onClick={() => isPhase ? togglePhaseRow(r.phase) : toggleBundleRow(r.bundleKey!)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    aria-label={r.expanded ? "collapse" : "expand"}
                  >
                    {r.expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                ) : (
                  <span className="inline-block w-3.5 shrink-0" />
                )}
                <span className="truncate" title={r.label}>{r.label}</span>
                {r.members !== undefined && (
                  <span className="text-[10px] text-muted-foreground shrink-0">({r.members})</span>
                )}
              </div>

              {/* Bar lane */}
              <div className={cn("relative flex-1", rowH)}>
                <div
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 rounded-md flex items-center px-1.5 gap-1 transition-all hover:brightness-110 hover:shadow-md",
                    barH,
                    isPhase && "shadow-md",
                    isBundle && "shadow-sm",
                  )}
                  style={{
                    left: `${leftPct}%`,
                    width: `max(3px, ${widthPct}%)`,
                    background: isPhase
                      ? `linear-gradient(90deg, ${pal.base} 0%, ${pal.mid} 100%)`
                      : isBundle
                      ? `linear-gradient(90deg, ${pal.mid} 0%, ${pal.soft} 100%)`
                      : pal.soft,
                    border: dashed
                      ? `1px dashed ${pal.mid}`
                      : isMember ? `1px solid ${pal.mid}` : "none",
                    opacity: dashed ? 0.7 : 1,
                  }}
                  title={`${r.label}\n${fmt(r.startMs)} → ${fmt(r.endMs)}${!r.hasDate ? ` (${de ? "geschätzt" : "estimated"})` : ""}`}
                >
                  {widthPct > 8 && (
                    <span
                      className={cn(
                        "text-[10px] font-semibold whitespace-nowrap truncate",
                        isPhase ? "text-white" : isBundle ? "text-foreground" : "text-foreground/80"
                      )}
                    >
                      {fmt(r.endMs)}
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-0.5 shrink-0">
                    {r.badges?.overdue && <AlertTriangle className="h-2.5 w-2.5 text-destructive" />}
                    {r.badges?.high && <Zap className="h-2.5 w-2.5 text-destructive" />}
                    {r.badges?.quickWin && <Sparkles className="h-2.5 w-2.5 st-teilweise-text" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border text-[11px] text-muted-foreground">
        <span>
          {de
            ? "Datierte Maßnahmen enden am Fälligkeitstermin (Start = Fälligkeit − Aufwand). Gestrichelte Balken = geschätzt (kein Datum gesetzt)."
            : "Dated actions end on their due date (start = due − effort). Dashed bars = estimated (no date set)."}
        </span>
        <span>{de ? "Tipp: Klicken Sie auf eine Phase, um Bündel und Maßnahmen zu öffnen." : "Tip: click a phase to expand bundles and actions."}</span>
      </div>
    </div>
  );
}


export default Roadmap;
