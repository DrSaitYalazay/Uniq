/**
 * Maturity Engine — Computes maturity scores from SoA Projection
 *
 * Single computation engine for BOTH domain and NIS2 views.
 * Consumes SoAProjection as its sole data source.
 *
 * @deprecated TOTER NIS2-Code (SoA-Projektions-Ära). Wird nur noch für Typ-Importe
 * referenziert und NICHT mehr aktiv genutzt. Der aktive Reifegrad-Pfad ist
 * `@/lib/maturityV2` (Reifegrad-SSOT + Ziel-Overlay, Spec-ITEM 11). Nicht umbauen,
 * nicht löschen — nur zur Migration behalten.
 */

import type { SoAProjectedControl, SoAProjection } from "@/lib/soaProjection";
import { controlMetadata } from "@/data/controlMetadata";
import {
  getNis2RequirementForControl,
  getNis2ArticleForControl,
  nis2Requirements,
  nis2Articles,
  type NIS2RequirementId,
} from "@/data/nis2RequirementMapping";
import { nis2Domains } from "@/data/nis2Controls";

// ── Types ──

export interface MaturityGroup {
  id: string;
  title: string;
  titleEn: string;
  controls: SoAProjectedControl[];
  maturityScore: number;        // 0–5 scale
  totalControls: number;
  applicableControls: number;
  implementedCount: number;
  partialCount: number;
  notImplementedCount: number;
  notAssessedCount: number;
  implementedPct: number;
  gapPct: number;
  hasHighRisk: boolean;
  highRiskCount: number;
  /** Optional roll-down: capability sub-groups under this regulatory article. */
  subGroups?: MaturityGroup[];
  /** Optional regulatory article reference (e.g. "Art. 21(2)(a)"). */
  article?: string;
}

export interface MaturityInsight {
  type: "weakest" | "strongest" | "quick_win" | "high_risk_weak";
  groupId: string;
  groupTitle: string;
  groupTitleEn: string;
  score: number;
  detail: string;
  detailEn: string;
}

export interface MaturityResult {
  groups: MaturityGroup[];
  overallScore: number;
  insights: MaturityInsight[];
}

// ── Score Computation ──

function computeMaturityScore(controls: SoAProjectedControl[]): number {
  const applicable = controls.filter(c => c.applicable && !c.isExcluded);
  if (applicable.length === 0) return 0;

  let points = 0;
  for (const c of applicable) {
    if (c.implStatus === "ja") points += 5;
    else if (c.implStatus === "teilweise") points += 2.5;
    // nein/null = 0
  }
  return Math.round((points / (applicable.length * 5)) * 50) / 10; // 0–5, one decimal
}

function computeImplementedPct(controls: SoAProjectedControl[]): number {
  const applicable = controls.filter(c => c.applicable && !c.isExcluded);
  if (applicable.length === 0) return 0;
  const impl = applicable.filter(c => c.implStatus === "ja").length;
  return Math.round((impl / applicable.length) * 100);
}

function buildGroup(
  id: string, title: string, titleEn: string,
  controls: SoAProjectedControl[],
): MaturityGroup {
  const applicable = controls.filter(c => c.applicable && !c.isExcluded);
  const implemented = applicable.filter(c => c.implStatus === "ja").length;
  const partial = applicable.filter(c => c.implStatus === "teilweise").length;
  const notImpl = applicable.filter(c => c.implStatus === "nein").length;
  const notAssessed = applicable.filter(c => c.implStatus === null).length;
  const highRiskCount = controls.filter(c => c.linkedToHighRisk).length;

  return {
    id, title, titleEn, controls,
    maturityScore: computeMaturityScore(controls),
    totalControls: controls.length,
    applicableControls: applicable.length,
    implementedCount: implemented,
    partialCount: partial,
    notImplementedCount: notImpl,
    notAssessedCount: notAssessed,
    implementedPct: computeImplementedPct(controls),
    gapPct: applicable.length > 0 ? Math.round(((notImpl + notAssessed) / applicable.length) * 100) : 0,
    hasHighRisk: highRiskCount > 0,
    highRiskCount,
  };
}

// ── Generate Insights ──

function generateInsights(groups: MaturityGroup[]): MaturityInsight[] {
  const insights: MaturityInsight[] = [];
  const sorted = [...groups].filter(g => g.applicableControls > 0);

  // Weakest 3
  const weakest = [...sorted].sort((a, b) => a.maturityScore - b.maturityScore).slice(0, 3);
  for (const g of weakest) {
    insights.push({
      type: "weakest",
      groupId: g.id, groupTitle: g.title, groupTitleEn: g.titleEn,
      score: g.maturityScore,
      detail: `Reifegrad ${g.maturityScore}/5 — ${g.gapPct}% Lücken`,
      detailEn: `Maturity ${g.maturityScore}/5 — ${g.gapPct}% gaps`,
    });
  }

  // Strongest 3
  const strongest = [...sorted].sort((a, b) => b.maturityScore - a.maturityScore).slice(0, 3);
  for (const g of strongest) {
    insights.push({
      type: "strongest",
      groupId: g.id, groupTitle: g.title, groupTitleEn: g.titleEn,
      score: g.maturityScore,
      detail: `Reifegrad ${g.maturityScore}/5 — ${g.implementedPct}% umgesetzt`,
      detailEn: `Maturity ${g.maturityScore}/5 — ${g.implementedPct}% implemented`,
    });
  }

  // Quick wins: groups with many partial controls (easy to complete)
  const quickWins = [...sorted]
    .filter(g => g.partialCount >= 2)
    .sort((a, b) => b.partialCount - a.partialCount)
    .slice(0, 3);
  for (const g of quickWins) {
    insights.push({
      type: "quick_win",
      groupId: g.id, groupTitle: g.title, groupTitleEn: g.titleEn,
      score: g.maturityScore,
      detail: `${g.partialCount} teilweise umgesetzte Kontrollen — schnelle Gewinne möglich`,
      detailEn: `${g.partialCount} partially implemented controls — quick wins possible`,
    });
  }

  // High-risk weak areas
  const highRiskWeak = [...sorted]
    .filter(g => g.hasHighRisk && g.maturityScore < 2.5)
    .sort((a, b) => a.maturityScore - b.maturityScore)
    .slice(0, 3);
  for (const g of highRiskWeak) {
    insights.push({
      type: "high_risk_weak",
      groupId: g.id, groupTitle: g.title, groupTitleEn: g.titleEn,
      score: g.maturityScore,
      detail: `${g.highRiskCount} Hochrisiko-Verknüpfungen bei Reifegrad ${g.maturityScore}/5`,
      detailEn: `${g.highRiskCount} high-risk links at maturity ${g.maturityScore}/5`,
    });
  }

  return insights;
}

// ── Domain View ──

export function computeDomainMaturity(projection: SoAProjection): MaturityResult {
  const allControls = projection.allControls;

  // Group by domain (from nis2Domains)
  const domainMap = new Map<string, { title: string; titleEn: string; controls: SoAProjectedControl[] }>();

  for (const domain of nis2Domains) {
    const catIds = new Set(domain.categories.map(c => c.id));
    const controls = allControls.filter(c => catIds.has(c.categoryId));
    if (controls.length > 0) {
      domainMap.set(domain.id, {
        title: domain.titleDe,
        titleEn: domain.title,
        controls,
      });
    }
  }

  // Add user-defined controls
  const userDefined = allControls.filter(c => c.categoryId === "user-defined");
  if (userDefined.length > 0) {
    domainMap.set("user-defined", {
      title: "Benutzerdefiniert",
      titleEn: "User-Defined",
      controls: userDefined,
    });
  }

  const groups = Array.from(domainMap.entries()).map(([id, d]) =>
    buildGroup(id, d.title, d.titleEn, d.controls)
  );

  const overallScore = groups.length > 0
    ? Math.round((groups.reduce((s, g) => s + g.maturityScore, 0) / groups.length) * 10) / 10
    : 0;

  return { groups, overallScore, insights: generateInsights(groups) };
}

// ── NIS2 View ──

export function computeNis2Maturity(projection: SoAProjection): MaturityResult {
  const allControls = projection.allControls;

  // Group by NIS2 requirement using familyId → nis2RequirementId mapping
  const groupMap = new Map<NIS2RequirementId, SoAProjectedControl[]>();

  for (const control of allControls) {
    const meta = controlMetadata[control.id];
    const familyId = meta?.familyId ?? "governance";
    const nis2Id = getNis2RequirementForControl(control.id, familyId);
    const arr = groupMap.get(nis2Id) ?? [];
    arr.push(control);
    groupMap.set(nis2Id, arr);
  }

  const groups: MaturityGroup[] = [];
  for (const req of nis2Requirements) {
    const controls = groupMap.get(req.id) ?? [];
    if (controls.length > 0) {
      groups.push(buildGroup(req.id, req.title, req.titleEn, controls));
    }
  }

  const overallScore = groups.length > 0
    ? Math.round((groups.reduce((s, g) => s + g.maturityScore, 0) / groups.length) * 10) / 10
    : 0;

  return { groups, overallScore, insights: generateInsights(groups) };
}

// ── NIS2 Article View (Variant B: 10 articles a–j with sub-group drill-down) ──

export function computeNis2ArticleMaturity(projection: SoAProjection): MaturityResult {
  const allControls = projection.allControls;

  // Bucket every control under its NIS2 article (a–j)
  const byArticle = new Map<string, SoAProjectedControl[]>();
  // Also keep the requirement-level split inside each article for drill-down
  const subByArticle = new Map<string, Map<NIS2RequirementId, SoAProjectedControl[]>>();

  for (const control of allControls) {
    const meta = controlMetadata[control.id];
    const familyId = meta?.familyId ?? "governance";
    const article = getNis2ArticleForControl(control.id, familyId);
    const reqId = getNis2RequirementForControl(control.id, familyId);

    const arr = byArticle.get(article) ?? [];
    arr.push(control);
    byArticle.set(article, arr);

    const subMap = subByArticle.get(article) ?? new Map<NIS2RequirementId, SoAProjectedControl[]>();
    const subArr = subMap.get(reqId) ?? [];
    subArr.push(control);
    subMap.set(reqId, subArr);
    subByArticle.set(article, subMap);
  }

  const groups: MaturityGroup[] = [];
  for (const art of nis2Articles) {
    const controls = byArticle.get(art.article) ?? [];
    if (controls.length === 0) continue;

    const subMap = subByArticle.get(art.article) ?? new Map();
    const subGroups: MaturityGroup[] = [];
    for (const req of nis2Requirements) {
      const subControls = subMap.get(req.id) ?? [];
      if (subControls.length > 0) {
        subGroups.push(buildGroup(req.id, req.title, req.titleEn, subControls));
      }
    }

    const group = buildGroup(art.article, art.title, art.titleEn, controls);
    group.subGroups = subGroups;
    group.article = art.article;
    groups.push(group);
  }

  const overallScore = groups.length > 0
    ? Math.round((groups.reduce((s, g) => s + g.maturityScore, 0) / groups.length) * 10) / 10
    : 0;

  return { groups, overallScore, insights: generateInsights(groups) };
}

export interface ExecutionStats {
  completed: number;
  inProgress: number;
  overdue: number;
  notStarted: number;
  total: number;
  completedPct: number;
  inProgressPct: number;
  overduePct: number;
  notStartedPct: number;
}

export interface ExecutionControl extends SoAProjectedControl {
  isOverdue: boolean;
  executionStatus: "completed" | "in_progress" | "not_started";
}

export function enrichWithExecution(controls: SoAProjectedControl[]): ExecutionControl[] {
  const now = new Date().toISOString().slice(0, 10);
  return controls
    .filter(c => c.applicable && !c.isExcluded)
    .map(c => {
      const isOverdue = !!c.dueDate && c.dueDate < now && c.implStatus !== "ja";
      let executionStatus: "completed" | "in_progress" | "not_started";
      if (c.implStatus === "ja") executionStatus = "completed";
      else if (c.implStatus === "teilweise") executionStatus = "in_progress";
      else executionStatus = "not_started";
      return { ...c, isOverdue, executionStatus };
    });
}

export function computeExecutionStats(controls: ExecutionControl[]): ExecutionStats {
  const total = controls.length;
  const completed = controls.filter(c => c.executionStatus === "completed").length;
  const inProgress = controls.filter(c => c.executionStatus === "in_progress").length;
  const overdue = controls.filter(c => c.isOverdue).length;
  const notStarted = controls.filter(c => c.executionStatus === "not_started").length;
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
  return {
    completed, inProgress, overdue, notStarted, total,
    completedPct: pct(completed), inProgressPct: pct(inProgress),
    overduePct: pct(overdue), notStartedPct: pct(notStarted),
  };
}

export interface ExecutionInsight {
  type: "overdue" | "blocked" | "fastest" | "critical_delay";
  groupId: string;
  groupTitle: string;
  groupTitleEn: string;
  detail: string;
  detailEn: string;
}

export function generateExecutionInsights(
  groups: { id: string; title: string; titleEn: string; controls: ExecutionControl[] }[]
): ExecutionInsight[] {
  const insights: ExecutionInsight[] = [];

  for (const g of groups) {
    const overdueCount = g.controls.filter(c => c.isOverdue).length;
    if (overdueCount > 0) {
      insights.push({
        type: "overdue",
        groupId: g.id, groupTitle: g.title, groupTitleEn: g.titleEn,
        detail: `${overdueCount} überfällige Kontrollen`,
        detailEn: `${overdueCount} overdue controls`,
      });
    }

    const highRiskOverdue = g.controls.filter(c => c.isOverdue && c.linkedToHighRisk).length;
    if (highRiskOverdue > 0) {
      insights.push({
        type: "critical_delay",
        groupId: g.id, groupTitle: g.title, groupTitleEn: g.titleEn,
        detail: `${highRiskOverdue} kritische Verzögerungen (Hochrisiko + überfällig)`,
        detailEn: `${highRiskOverdue} critical delays (high-risk + overdue)`,
      });
    }
  }

  // Progress per group: show ALL groups with at least one applicable control
  // (previously limited to top 3 — that hid domains like "Physische Kontrollen"
  // from the report's Fortschritts-Erkenntnisse list).
  const fastest = [...groups]
    .map(g => {
      const total = g.controls.length;
      const done = g.controls.filter(c => c.executionStatus === "completed").length;
      return { ...g, pct: total > 0 ? done / total : 0, total };
    })
    .filter(g => g.total > 0)
    .sort((a, b) => b.pct - a.pct);

  for (const g of fastest) {
    insights.push({
      type: "fastest",
      groupId: g.id, groupTitle: g.title, groupTitleEn: g.titleEn,
      detail: `${Math.round(g.pct * 100)}% abgeschlossen`,
      detailEn: `${Math.round(g.pct * 100)}% completed`,
    });
  }

  return insights;
}
