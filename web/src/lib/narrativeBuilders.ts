/**
 * narrativeBuilders — deterministic (LLM-free) text generation for reports.
 *
 * Produces executive-summary paragraphs, criticality-aware key findings and
 * timeline-based next steps from the structured gap data. The same builder
 * powers Gap and Risk reports so tone stays consistent.
 */

import type { ControlRow, EffectiveAnswer } from "./assessmentEngine";
import { capabilityFor, humanCap, type CapabilityTag } from "./capabilityMap";
import { recommendationFor, scopedArticles, timelineBucketFor } from "./frameworkArticleMap";

export interface CriticalityContext {
  criticalServiceCount: number;
  highCriticalityAssetCount: number;
  spofCount: number;
  totalAssets: number;
  totalServices: number;
}

export interface OpenGap {
  framework: string;
  ctrl: ControlRow;
  status: "nein" | "teilweise" | null;
  muss: boolean;
  cap: CapabilityTag;
}

export interface GapAggregate {
  totalGaps: number;
  criticalMustGaps: number;
  partialGaps: number;
  byCap: Map<CapabilityTag, OpenGap[]>;
  topCaps: Array<{ cap: CapabilityTag; count: number; mustCount: number }>;
}

// ── Aggregation ────────────────────────────────────────────────────────────

export function collectOpenGaps(
  frameworks: Array<{ framework: string; controls: ControlRow[]; effective: Map<string, EffectiveAnswer> }>,
): OpenGap[] {
  const out: OpenGap[] = [];
  for (const pf of frameworks) {
    for (const c of pf.controls) {
      const e = pf.effective.get(c.id);
      const s = (e?.status ?? null) as OpenGap["status"] | "ja" | "na";
      if (s === "ja" || s === "na") continue;
      out.push({
        framework: pf.framework,
        ctrl: c,
        status: s as OpenGap["status"],
        muss: c.muss === "true",
        cap: capabilityFor(c),
      });
    }
  }
  return out;
}

export function aggregateGaps(gaps: OpenGap[]): GapAggregate {
  const byCap = new Map<CapabilityTag, OpenGap[]>();
  let critical = 0, partial = 0;
  for (const g of gaps) {
    if (g.status === "teilweise") partial++;
    if (g.status === "nein" && g.muss) critical++;
    const arr = byCap.get(g.cap);
    if (arr) arr.push(g); else byCap.set(g.cap, [g]);
  }
  const topCaps = [...byCap.entries()]
    .map(([cap, arr]) => ({ cap, count: arr.length, mustCount: arr.filter(g => g.muss && g.status === "nein").length }))
    .sort((a, b) => (b.mustCount - a.mustCount) || (b.count - a.count));
  return { totalGaps: gaps.length, criticalMustGaps: critical, partialGaps: partial, byCap, topCaps };
}

// ── Criticality-weighted priority ──────────────────────────────────────────

export interface PriorityItem { gap: OpenGap; score: number; drivers: string[] }

export function criticalityWeightedPriority(
  gaps: OpenGap[],
  ctx: CriticalityContext,
  de: boolean,
  limit = 20,
): PriorityItem[] {
  const critSvcBoost = ctx.criticalServiceCount > 0 ? 1 + Math.min(ctx.criticalServiceCount / 5, 1.5) : 1;
  const spofBoost    = ctx.spofCount > 0            ? 1 + Math.min(ctx.spofCount / 3, 1.2)          : 1;

  const items = gaps.map(g => {
    let score = g.status === "nein" ? 3 : 1.5;
    if (g.muss) score *= 1.8;
    const drivers: string[] = [];
    // Capability-scope amplification
    const opScope = new Set<CapabilityTag>(["incident_mgmt", "business_continuity", "monitoring_logging", "identity_access_mgmt", "network_security"]);
    if (opScope.has(g.cap) && ctx.criticalServiceCount > 0) {
      score *= critSvcBoost;
      drivers.push(de ? `${ctx.criticalServiceCount} kritische Dienste betroffen` : `${ctx.criticalServiceCount} critical services affected`);
    }
    const infraScope = new Set<CapabilityTag>(["asset_mgmt", "network_security", "supplier_security", "business_continuity"]);
    if (infraScope.has(g.cap) && ctx.spofCount > 0) {
      score *= spofBoost;
      drivers.push(de ? `${ctx.spofCount} SPOF in Abhängigkeitskarte` : `${ctx.spofCount} SPOFs in dependency map`);
    }
    if (g.muss) drivers.push(de ? "MUSS-Anforderung" : "MUST requirement");
    return { gap: g, score, drivers };
  });
  items.sort((a, b) => b.score - a.score);
  return items.slice(0, limit);
}

// ── Executive narrative (3 paragraphs) ─────────────────────────────────────

export function buildExecutiveNarrative(
  agg: GapAggregate,
  ctx: CriticalityContext,
  scopedFrameworks: string[],
  de: boolean,
): string[] {
  const paras: string[] = [];
  const top3 = agg.topCaps.slice(0, 3);
  const topNames = top3.map(t => humanCap(t.cap, de));

  // Para 1 — posture
  const posture = agg.totalGaps === 0
    ? (de ? "Alle geprüften Kontrollen sind erfüllt oder als nicht anwendbar dokumentiert. Der Fokus verschiebt sich auf Wirksamkeitsnachweis und kontinuierliche Verbesserung."
          : "All assessed controls are met or documented as not applicable. Focus shifts to effectiveness evidence and continuous improvement.")
    : (de ? `Der Bericht identifiziert ${agg.totalGaps} offene Kontrollen, davon ${agg.criticalMustGaps} kritische MUSS-Anforderungen und ${agg.partialGaps} teilweise umgesetzt. `
          : `The report identifies ${agg.totalGaps} open controls, of which ${agg.criticalMustGaps} are critical MUST requirements and ${agg.partialGaps} are partially implemented. `);
  const posture2 = agg.totalGaps > 0 && topNames.length > 0
    ? (de ? `Die Lücken konzentrieren sich auf ${topNames.join(", ")} — hier liegen ${top3.reduce((s, t) => s + t.count, 0)} von ${agg.totalGaps} Befunden.`
          : `Gaps concentrate in ${topNames.join(", ")} — ${top3.reduce((s, t) => s + t.count, 0)} of ${agg.totalGaps} findings sit there.`)
    : "";
  paras.push(posture + posture2);

  // Para 2 — criticality context
  if (ctx.totalServices > 0 || ctx.totalAssets > 0) {
    const parts: string[] = [];
    if (ctx.criticalServiceCount > 0) {
      parts.push(de
        ? `${ctx.criticalServiceCount} von ${ctx.totalServices} Diensten sind als kritisch klassifiziert`
        : `${ctx.criticalServiceCount} of ${ctx.totalServices} services are classified as critical`);
    }
    if (ctx.highCriticalityAssetCount > 0) {
      parts.push(de
        ? `${ctx.highCriticalityAssetCount} Assets mit hoher Kritikalität`
        : `${ctx.highCriticalityAssetCount} high-criticality assets`);
    }
    if (ctx.spofCount > 0) {
      parts.push(de
        ? `${ctx.spofCount} Single-Points-of-Failure in der Abhängigkeitskarte`
        : `${ctx.spofCount} single points of failure in the dependency map`);
    }
    if (parts.length > 0) {
      paras.push(de
        ? `Der Business-Kontext verstärkt die Dringlichkeit: ${parts.join(", ")}. Offene Kontrollen in Incident Management, Business Continuity, Monitoring und Zugriffssteuerung wirken auf diese kritischen Elemente direkt und werden im Priorisierungsscore entsprechend gewichtet.`
        : `The business context amplifies urgency: ${parts.join(", ")}. Open controls in incident management, business continuity, monitoring and access control directly affect these critical elements and are weighted accordingly in the priority score.`);
    } else {
      paras.push(de
        ? "Aus dem Business-Kontext (Phase 2) sind derzeit keine kritischen Dienste oder SPOF markiert. Die Priorisierung erfolgt daher rein nach Kontrollschwere (MUSS vs. SOLL)."
        : "The business context (Phase 2) currently marks no critical services or SPOFs. Priority ranking therefore relies purely on control severity (MUST vs. SHOULD).");
    }
  }

  // Para 3 — regulatory anchor + call to action
  if (top3.length > 0) {
    const articles = new Set<string>();
    for (const t of top3) scopedArticles(t.cap, scopedFrameworks).forEach(a => articles.add(a));
    const artList = [...articles].slice(0, 6);
    const artText = artList.length > 0
      ? (de ? ` Diese Cluster berühren unmittelbar ${artList.join(", ")}.` : ` These clusters directly touch ${artList.join(", ")}.`)
      : "";
    paras.push((de
      ? `Empfehlung: Fokussieren Sie die ersten 30 Tage auf die drei Top-Cluster (${topNames.join(", ")}), da hier sowohl die Kontrolldichte als auch die regulatorische Anschlussfähigkeit am höchsten sind.${artText} Der Zeitplan im Anhang "Nächste Schritte" ordnet jede Empfehlung einer 30/90/180-Tage-Welle zu und benennt Ergebnistypen.`
      : `Recommendation: focus the first 30 days on the three top clusters (${topNames.join(", ")}), where both control density and regulatory relevance peak.${artText} The "Next Steps" annex assigns every recommendation to a 30/90/180-day wave with concrete deliverables.`));
  }

  return paras;
}

// ── Timeline-based next steps ──────────────────────────────────────────────

export interface NextStep {
  cap: CapabilityTag;
  bucket: 30 | 90 | 180 | 365;
  recommendation: string;
  articles: string[];
  gapCount: number;
  mustCount: number;
}

export function buildNextSteps(
  agg: GapAggregate,
  scopedFrameworks: string[],
  de: boolean,
): NextStep[] {
  const out: NextStep[] = [];
  for (const { cap, count, mustCount } of agg.topCaps) {
    out.push({
      cap,
      bucket: timelineBucketFor(cap, mustCount > 0),
      recommendation: recommendationFor(cap, de),
      articles: scopedArticles(cap, scopedFrameworks),
      gapCount: count,
      mustCount,
    });
  }
  return out;
}

export const BUCKET_LABEL: Record<30 | 90 | 180 | 365, { de: string; en: string }> = {
  30:  { de: "Sofort (0–30 Tage)",       en: "Immediate (0–30 days)" },
  90:  { de: "Kurzfristig (30–90 Tage)", en: "Short-term (30–90 days)" },
  180: { de: "Mittelfristig (90–180 Tage)", en: "Mid-term (90–180 days)" },
  365: { de: "Langfristig (>180 Tage)",  en: "Long-term (>180 days)" },
};
