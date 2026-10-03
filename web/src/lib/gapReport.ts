/**
 * gapReport — Phase 3 Gap Analysis report (multi-framework, hub-and-spoke).
 *
 * Consumes the exact same data structures that the Assessment page renders
 * (controls, effectiveByFramework, computeStats) so the report always matches
 * what the user just saw on screen. White-labelled: company name, logo and
 * accent colour are pulled from the tenant profile at render time.
 */

import { RT } from "./reportTheme";
import { getCompanyBrand } from "./companyBrand";
import { getReportBrandName } from "./reportBrand";
import {
  buildCoverHtml, buildKpiGrid, wrapHtmlDoc, renderHtmlToPdf,
  reportGlobalCss, esc, rtGlossary,
} from "./reportHtmlLayout";
import {
  computeStats, familyOf, isUnscoredRow,
  type ControlRow, type EffectiveAnswer, type FrameworkStats,
  type Severity, type SeveritySource,
} from "./assessmentEngine";
import { capabilityFor, humanCap } from "./capabilityMap";
import { scopedArticles, recommendationFor } from "./frameworkArticleMap";
import {
  collectOpenGaps, aggregateGaps, criticalityWeightedPriority,
  buildExecutiveNarrative, buildNextSteps, BUCKET_LABEL,
  type CriticalityContext,
} from "./narrativeBuilders";

const FRAMEWORK_LABELS: Record<string, string> = {
  ISO27001: "ISO/IEC 27001", NIS2: "NIS2", BSI: "BSI IT-Grundschutz",
  BSI200_4: "BSI 200-4 (BCM)", BCM22301: "ISO 22301 (BCM)", KRITIS: "KRITIS",
  DORA: "DORA", TISAX: "TISAX / VDA ISA", GDPR: "DSGVO / GDPR",
  ISO27701: "ISO 27701", AIACT: "EU AI Act", ISO42001: "ISO/IEC 42001",
  NIST_AI_RMF: "NIST AI RMF", MaRisk: "MaRisk", CRA: "Cyber Resilience Act",
};

interface FrameworkPayload {
  framework: string;
  controls: ControlRow[];
  effective: Map<string, EffectiveAnswer>;
  /**
   * Y7: Abweichungsgrad je Kontroll-ID (Prüferentscheid aus public.answers).
   * Optional — fehlt er, zeigt der Bericht nur den Katalogvorschlag und
   * kennzeichnet ihn als solchen. Getrennt von der Risikopriorität.
   */
  severity?: Map<string, { severity?: Severity | null; severity_source?: SeveritySource | null; severity_note?: string | null }>;
}

/** Phase 2 inventory context used for criticality-aware weighting. */
export interface InventoryContext {
  services: Array<{ id: string; name: string; criticality: number | null; category?: string | null }>;
  assets: Array<{ id: string; asset_name: string; inherited_criticality?: number | null; user_override_criticality?: number | null }>;
  dependencies: Array<{ is_spof?: boolean | null; criticality?: number | null }>;
}

export interface BuildGapReportInput {
  frameworks: FrameworkPayload[];
  de: boolean;
  authorName?: string;
  /** Optional confidentiality label rendered in the page footer (e.g. "Vertraulich – nur zum internen Gebrauch"). Empty/omitted = no stamp. */
  classification?: string;
  inventory?: InventoryContext;
  /** Darstellungstiefe: "expert" = je Anforderung (Default), "simple" = je Baustein zusammengefasst. */
  mode?: "simple" | "expert";
}

// ── Premium SVG chart primitives (theme-aware, print-safe) ─────────────────

function svgDefs(id: string): string {
  // Reusable filter for soft drop shadow + subtle radial highlight on slices.
  return `<defs>
    <filter id="${id}-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2.2"/>
      <feOffset dx="0" dy="2" result="off"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.28"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="${id}-sheen" cx="50%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

// Chart palette — lighter, theme-friendly hues distinct from the dark
// text/badge colors used in RT (RT.low/RT.critical are near-black-red/green,
// which look muddy in a donut). Used ONLY inside charts + their legends.
// Als Funktionen, NICHT als Konstanten: `RT` wird bei Themen-/Moduswechsel an
// Ort und Stelle aktualisiert. Eine Konstante hätte den Wert beim Modul-Laden
// eingefroren — der Bericht wäre dann in der alten Farbe gedruckt.
const CHART_MET = () => RT.stJa;
const CHART_PARTIAL = () => RT.stTeilweise;
const CHART_NOT_MET = () => RT.stNein;
const CHART_OPEN     = "#CBD5E1"; // slate-300

function pieSvg(stats: FrameworkStats, size = 168): string {
  // Nenner = Summe der tatsächlichen Segmente (ja+teilweise+nein+offen) = anwendbare
  // Kontrollen. Vorher wurde "rest" doppelt gezählt → Donut füllte nur ~50 %.
  const answered = stats.ja + stats.teilweise + stats.nein;
  const rest = Math.max(0, stats.total - answered - stats.na);
  const total = Math.max(1, stats.ja + stats.teilweise + stats.nein + rest);
  const segs: { v: number; c: string }[] = [
    { v: stats.ja,        c: CHART_MET()     },
    { v: stats.teilweise, c: CHART_PARTIAL() },
    { v: stats.nein,      c: CHART_NOT_MET() },
    { v: rest,            c: CHART_OPEN    },
  ].filter(s => s.v > 0);

  const cx = size / 2, cy = size / 2, r = size / 2 - 10;
  const uid = "p" + Math.random().toString(36).slice(2, 8);
  let a = -Math.PI / 2;
  const slices = segs.map(s => {
    const frac = s.v / total;
    const a1 = a + frac * Math.PI * 2;
    // Guard: full-circle single slice
    const path = frac >= 0.9999
      ? `M ${cx} ${cy} m ${-r} 0 a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 ${-2 * r} 0`
      : arcPath(cx, cy, r, a, a1);
    a = a1;
    return `<path d="${path}" fill="${s.c}" stroke="#ffffff" stroke-width="1.5"/>`;
  }).join("");

  const donutHoleR = r * 0.56;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    ${svgDefs(uid)}
    <g filter="url(#${uid}-shadow)">${slices}</g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${uid}-sheen)" pointer-events="none"/>
    <circle cx="${cx}" cy="${cy}" r="${donutHoleR}" fill="#ffffff"/>
    <circle cx="${cx}" cy="${cy}" r="${donutHoleR}" fill="none" stroke="${RT.border}" stroke-width="1"/>
    <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-family="Inter,Arial" font-size="26" font-weight="800" fill="${RT.navy}">${stats.compliancePct}%</text>
    <text x="${cx}" y="${cy + 18}" text-anchor="middle" font-family="Inter,Arial" font-size="9" fill="${RT.muted}" letter-spacing="1.2">COMPLIANCE</text>
  </svg>`;
}

/**
 * Radar chart comparing compliance % across frameworks (or across the four
 * status buckets if only one framework is in scope). Adapts to accent color.
 */
function radarSvg(
  axes: { label: string; value: number }[],
  opts: { size?: number; max?: number } = {},
): string {
  const size = opts.size ?? 340;
  const max = opts.max ?? 100;
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 46;
  const n = Math.max(3, axes.length);
  const uid = "r" + Math.random().toString(36).slice(2, 8);

  const angleAt = (i: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;
  const point = (i: number, radius: number) => {
    const a = angleAt(i);
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)] as const;
  };

  // Concentric rings (25/50/75/100)
  const rings = [0.25, 0.5, 0.75, 1].map(f => {
    const pts = Array.from({ length: n }, (_, i) => point(i, r * f).map(v => v.toFixed(1)).join(",")).join(" ");
    return `<polygon points="${pts}" fill="none" stroke="${RT.border}" stroke-width="1" ${f === 1 ? "" : `stroke-dasharray="2 3"`}/>`;
  }).join("");

  // Spokes + labels
  const spokes = axes.map((ax, i) => {
    const [x, y] = point(i, r);
    const [lx, ly] = point(i, r + 22);
    const anchor = Math.abs(lx - cx) < 6 ? "middle" : (lx > cx ? "start" : "end");
    const label = ax.label.length > 14 ? ax.label.slice(0, 13) + "…" : ax.label;
    return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${RT.border}" stroke-width="1"/>
      <text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" text-anchor="${anchor}" font-family="Inter,Arial" font-size="10" font-weight="600" fill="${RT.navy}">${esc(label)}</text>
      <text x="${lx.toFixed(1)}" y="${(ly + 15).toFixed(1)}" text-anchor="${anchor}" font-family="Inter,Arial" font-size="9" fill="${RT.muted}">${Math.round(ax.value)}%</text>`;
  }).join("");

  // Data polygon
  const dataPts = axes.map((ax, i) => point(i, (Math.max(0, Math.min(max, ax.value)) / max) * r)
    .map(v => v.toFixed(1)).join(",")).join(" ");
  const dots = axes.map((ax, i) => {
    const [x, y] = point(i, (Math.max(0, Math.min(max, ax.value)) / max) * r);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${RT.copper}" stroke="#fff" stroke-width="1.5"/>`;
  }).join("");

  const ringLabel = (f: number) => `<text x="${cx + 3}" y="${(cy - r * f + 3).toFixed(1)}" font-family="Inter,Arial" font-size="8" fill="${RT.muted}">${Math.round(max * f)}%</text>`;

  // ViewBox is expanded horizontally (±60px) so long axis labels like
  // "Fortschritt" or "Nicht erfüllt" aren't clipped by the svg edge.
  const padX = 60, padY = 12;
  return `<svg width="${size + padX * 2}" height="${size + padY * 2}" viewBox="${-padX} ${-padY} ${size + padX * 2} ${size + padY * 2}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="${uid}-fill" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="${RT.copper}" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="${RT.copper}" stop-opacity="0.18"/>
      </radialGradient>
      <filter id="${uid}-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    ${rings}
    ${[0.25, 0.5, 0.75, 1].map(ringLabel).join("")}
    ${spokes}
    <polygon points="${dataPts}" fill="url(#${uid}-fill)" stroke="${RT.copper}" stroke-width="2" filter="url(#${uid}-glow)"/>
    ${dots}
  </svg>`;
}

function legendSwatch(c: string, label: string, n: number): string {
  return `<div style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:${RT.body}">
    <span style="width:10px;height:10px;border-radius:2px;background:${c};display:inline-block"></span>
    <span style="font-weight:600">${n}</span><span style="color:${RT.muted}">${esc(label)}</span>
  </div>`;
}


// ── Per-framework block ─────────────────────────────────────────────────────

function statusBadge(status: string | null, de: boolean): string {
  if (!status) return `<span class="rt-badge" style="background:${RT.surfaceAlt};color:${RT.muted}">${de ? "unbeantwortet" : "unanswered"}</span>`;
  if (status === "nein")      return `<span class="rt-badge critical">${de ? "Nicht umgesetzt" : "Not implemented"}</span>`;
  if (status === "teilweise") return `<span class="rt-badge medium">${de ? "Teilweise" : "Partial"}</span>`;
  if (status === "ja")        return `<span class="rt-badge low">${de ? "Umgesetzt" : "Implemented"}</span>`;
  return `<span class="rt-badge">${de ? "N/A" : "N/A"}</span>`;
}

function buildFrameworkSection(pf: FrameworkPayload, de: boolean, mode: "simple" | "expert" = "expert"): string {
  const label = FRAMEWORK_LABELS[pf.framework] ?? pf.framework;
  const stats = computeStats(pf.controls, pf.effective);

  // Group all open/partial controls by family for the gap list.
  const OPEN = new Set(["nein", "teilweise", null] as any[]);
  const gaps: { fam: { id: string; label: string }; ctrl: ControlRow; eff: EffectiveAnswer | undefined }[] = [];
  for (const c of pf.controls) {
    if (isUnscoredRow(c)) continue; // Übersichtszeile (C-10) — keine eigene Lücke
    const e = pf.effective.get(c.id);
    const s = e?.status ?? null;
    if (s === "ja" || s === "na") continue;
    if (!OPEN.has(s)) continue;
    gaps.push({ fam: familyOf(c, de), ctrl: c, eff: e });
  }
  // Sort: nein (critical MUSS first) → teilweise → offen; then by family.
  const rank = (s: string | null) => s === "nein" ? 0 : s === "teilweise" ? 1 : 2;
  gaps.sort((a, b) => {
    const ra = rank(a.eff?.status ?? null), rb = rank(b.eff?.status ?? null);
    if (ra !== rb) return ra - rb;
    const ma = a.ctrl.muss === "true" ? 0 : 1, mb = b.ctrl.muss === "true" ? 0 : 1;
    if (ma !== mb) return ma - mb;
    return a.fam.label.localeCompare(b.fam.label);
  });

  const groups = new Map<string, { label: string; items: typeof gaps }>();
  for (const g of gaps) {
    const k = g.fam.id;
    if (!groups.has(k)) groups.set(k, { label: g.fam.label, items: [] });
    groups.get(k)!.items.push(g);
  }

  const legend = `
    <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:10px">
      ${legendSwatch(CHART_MET(),     de ? "Umgesetzt"     : "Implemented",     stats.ja)}
      ${legendSwatch(CHART_PARTIAL(), de ? "Teilweise"     : "Partial", stats.teilweise)}
      ${legendSwatch(CHART_NOT_MET(), de ? "Nicht umgesetzt" : "Not implemented", stats.nein)}
      ${legendSwatch(CHART_OPEN,    de ? "Unbeantwortet" : "Unanswered", stats.total - stats.answered)}
      ${legendSwatch(RT.muted,      de ? "N/A"           : "N/A",     stats.na)}
    </div>`;

  const headerBar = `
    <div class="rt-card" style="display:flex;gap:20px;align-items:center;padding:16px 18px">
      <div style="flex:0 0 auto">${pieSvg(stats)}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">
          <h3 style="margin:0;color:${RT.navy};font-size:16.0px">${esc(label)}</h3>
          <span style="font-size:12.5px;color:${RT.muted}">${stats.total} ${de ? "Kontrollen" : "controls"} · ${stats.applicable} ${de ? "anwendbar" : "applicable"}</span>
        </div>
        ${buildKpiGrid([
          { label: de ? "Compliance" : "Compliance", value: stats.compliancePct + "%", variant: "accent" },
          { label: de ? "Beantwortet" : "Answered",  value: stats.progressPct + "%" },
          { label: de ? "Offene Lücken" : "Open gaps", value: stats.nein + stats.teilweise, variant: "crit" },
          { label: (de ? "Kritische MUSS" : "Critical MUST") + ((stats.criticalLater ?? 0) > 0 ? (de ? ` (+${stats.criticalLater} gelten später)` : ` (+${stats.criticalLater} apply later)`) : ""), value: stats.criticalOpen, variant: "crit" },
        ])}
        ${legend}
      </div>
    </div>
  `;


  const scopedFwList = [pf.framework];

  // M2-d: „Überblick"-Modus → je Baustein EINE Zusammenfassungszeile statt jeder
  // Anforderung. „Detail"-Modus → volle Anforderungsliste (wie bisher).
  if (mode === "simple") {
    const simpleBlocks = groups.size === 0
      ? `<div class="rt-callout"><strong>${de ? "Keine offenen Lücken" : "No open gaps"}</strong> — ${de ? "alle Bausteine sind erfüllt oder als N/A markiert." : "all blocks are met or marked N/A."}</div>`
      : `<table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-top:6px">
          <thead><tr style="text-align:left;color:${RT.muted};border-bottom:1px solid ${RT.border ?? "#e2e8f0"}">
            <th style="padding:6px 8px">${de ? "Baustein" : "Block"}</th>
            <th style="padding:6px 8px;text-align:right">${de ? "Lücken" : "Gaps"}</th>
            <th style="padding:6px 8px;text-align:right">${de ? "davon nicht umgesetzt" : "of which not implemented"}</th>
            <th style="padding:6px 8px;text-align:right">${de ? "Teilweise" : "Partial"}</th>
          </tr></thead>
          <tbody>
          ${Array.from(groups.entries()).map(([, g]) => {
            const nein = g.items.filter(i => (i.eff?.status ?? null) === "nein").length;
            const teil = g.items.filter(i => (i.eff?.status ?? null) === "teilweise").length;
            const offen = g.items.length - nein - teil;
            return `<tr style="border-bottom:1px solid ${RT.surfaceAlt}">
              <td style="padding:6px 8px;color:${RT.navy};font-weight:600;border-left:3px solid ${RT.copper}">${esc(g.label)}</td>
              <td style="padding:6px 8px;text-align:right;font-weight:700;color:${RT.navy}">${g.items.length}</td>
              <td style="padding:6px 8px;text-align:right;color:${CHART_NOT_MET()}">${nein || "–"}</td>
              <td style="padding:6px 8px;text-align:right;color:${CHART_PARTIAL()}">${teil || "–"}</td>
            </tr>`;
          }).join("")}
          </tbody>
        </table>`;
    return `
      <section class="rt-section">
        <h2>${esc(label)}</h2>
        ${headerBar}
        <h3>${de ? "Bausteine mit Lücken (Überblick)" : "Blocks with gaps (Overview)"}</h3>
        ${simpleBlocks}
      </section>
    `;
  }

  const gapBlocks = groups.size === 0
    ? `<div class="rt-callout"><strong>${de ? "Keine offenen Lücken" : "No open gaps"}</strong> — ${de ? "alle Kontrollen sind erfüllt oder als N/A markiert." : "all controls are met or marked N/A."}</div>`
    : Array.from(groups.entries()).map(([, g]) => `
        <div class="rt-capability-group">
          <h4 style="margin:14px 0 6px;color:${RT.navy};font-size:13.0px;border-left:3px solid ${RT.copper};padding-left:8px">${esc(g.label)} <span style="color:${RT.muted};font-weight:500">· ${g.items.length}</span></h4>
          ${g.items.slice(0, 60).map(it => {
            const cap = capabilityFor(it.ctrl);
            const inherited = it.eff?.origin === "inherited"
              ? `<span class="rt-meta-pill">${de ? "abgeleitet aus Kontroll-Knoten" : "inherited from control node"}: ${esc((it.eff!.inheritedFrom ?? []).slice(0, 3).join(", "))}</span>`
              : "";
            const muss = it.ctrl.muss === "true"
              ? `<span class="rt-badge critical" style="margin-left:6px">MUSS</span>` : "";
            const capBadge = `<span class="rt-meta-pill" style="background:${RT.surfaceAlt};color:${RT.navy};font-weight:600">${esc(humanCap(cap, de))}</span>`;
            const articles = scopedArticles(cap, scopedFwList);
            const articleBadges = articles.map(a => `<span class="rt-meta-pill" style="background:#EFF6FF;color:${RT.navy}">${esc(a)}</span>`).join("");
            const rec = `<div class="rt-gap-body" style="color:${RT.body};font-size:12.5px;margin-top:4px"><strong>${de ? "Empfehlung" : "Recommendation"}:</strong> ${esc(recommendationFor(cap, de))}</div>`;
            const note = it.eff?.note
              ? `<div class="rt-gap-body"><strong>${de ? "Notiz" : "Note"}:</strong> ${esc(it.eff.note)}</div>` : "";
            return `
              <div class="rt-gap-card">
                <div class="rt-gap-head">
                  <div class="rt-gap-title"><span class="rt-mono-pill rt-meta-pill">${esc(it.ctrl.id)}</span> ${esc((de ? it.ctrl.req_de : it.ctrl.req_en) || it.ctrl.req_de || it.ctrl.req_en || "")}${muss}</div>
                  <div>${statusBadge(it.eff?.status ?? null, de)}</div>
                </div>
                <div class="rt-meta-row">${capBadge}${articleBadges}${inherited}</div>
                ${rec}
                ${note}
              </div>`;
          }).join("")}
          ${g.items.length > 60 ? `<p style="font-size:12px;color:${RT.muted};margin-top:4px">… ${g.items.length - 60} ${de ? "weitere in dieser Gruppe" : "more in this group"}</p>` : ""}
        </div>
      `).join("");

  return `
    <section class="rt-section">
      <h2>${esc(label)}</h2>
      ${headerBar}
      <h3>${de ? "Offene Punkte" : "Open items"}</h3>
      ${gapBlocks}
    </section>
  `;
}

// ── Executive summary ───────────────────────────────────────────────────────

function buildExecSummary(inp: BuildGapReportInput): string {
  const de = inp.de;
  let total = 0, ja = 0, teil = 0, nein = 0, na = 0, crit = 0, later = 0;
  for (const pf of inp.frameworks) {
    const s = computeStats(pf.controls, pf.effective);
    total += s.total; ja += s.ja; teil += s.teilweise;
    nein += s.nein;  na += s.na;  crit += s.criticalOpen;  later += s.criticalLater ?? 0;
  }
  const applicable = total - na;
  const compliancePct = applicable > 0 ? Math.round(((ja + 0.5 * teil) / applicable) * 100) : 0;

  const rows = inp.frameworks.map(pf => {
    const s = computeStats(pf.controls, pf.effective);
    const label = FRAMEWORK_LABELS[pf.framework] ?? pf.framework;
    const barFill = Math.max(2, s.compliancePct);
    return `<tr>
      <td style="width:26%"><strong>${esc(label)}</strong></td>
      <td style="width:12%;text-align:center">${s.total}</td>
      <td style="width:12%;text-align:center;color:${RT.low};font-weight:700">${s.ja}</td>
      <td style="width:12%;text-align:center;color:${RT.warning};font-weight:700">${s.teilweise}</td>
      <td style="width:12%;text-align:center;color:${RT.critical};font-weight:700">${s.nein}</td>
      <td style="width:12%;text-align:center;color:${RT.muted}">${s.na}</td>
      <td style="width:14%">
        <div style="background:${RT.surfaceAlt};border-radius:4px;height:8px;position:relative;overflow:hidden">
          <div style="background:${RT.copper};height:100%;width:${barFill}%"></div>
        </div>
        <div style="font-size:12px;color:${RT.body};margin-top:3px;text-align:right;font-weight:700">${s.compliancePct}%</div>
      </td>
    </tr>`;
  }).join("");

  // Radar: per-framework compliance %. Fallback to status buckets if only 1 fw.
  const radarAxes = inp.frameworks.length >= 2
    ? inp.frameworks.map(pf => {
        const s = computeStats(pf.controls, pf.effective);
        return { label: FRAMEWORK_LABELS[pf.framework] ?? pf.framework, value: s.compliancePct };
      })
    : (() => {
        const s = inp.frameworks[0]
          ? computeStats(inp.frameworks[0].controls, inp.frameworks[0].effective)
          : { total: 0, applicable: 0, ja: 0, teilweise: 0, nein: 0, na: 0 } as any;
        const app = Math.max(1, s.applicable);
        return [
          { label: de ? "Umgesetzt" : "Implemented", value: (s.ja / app) * 100 },
          { label: de ? "Teilweise" : "Partial",   value: (s.teilweise / app) * 100 },
          { label: de ? "Unbeantwortet" : "Unanswered", value: ((s.total - s.ja - s.teilweise - s.nein - s.na) / app) * 100 },
          { label: de ? "Nicht umgesetzt" : "Not implemented", value: (s.nein / app) * 100 },
          { label: de ? "Fortschritt" : "Progress", value: ((s.ja + s.teilweise + s.nein) / app) * 100 },
        ];
      })();

  // Aggregate pie for overall status distribution.
  const aggregate: FrameworkStats = {
    total, applicable, ja, teilweise: teil, nein, na,
    answered: ja + teil + nein,
    compliancePct, progressPct: total ? Math.round(((ja + teil + nein) / total) * 100) : 0,
    criticalOpen: crit,
    criticalLater: later,
  };


  return `
    <section class="rt-section">
      <h2>${de ? "Zusammenfassung" : "Executive Summary"}</h2>
      ${buildKpiGrid([
        { label: de ? "Frameworks im Scope" : "Frameworks in scope", value: inp.frameworks.length, variant: "accent" },
        { label: de ? "Kontrollen gesamt" : "Total controls",        value: total },
        { label: de ? "Gesamt-Compliance" : "Overall compliance",    value: compliancePct + "%", variant: "accent" },
        { label: (de ? "Kritische Lücken (MUSS)" : "Critical gaps (MUST)") + (later > 0 ? (de ? ` (+${later} gelten später)` : ` (+${later} apply later)`) : ""), value: crit, variant: "crit" },
      ])}

      <div style="display:grid;grid-template-columns:1.15fr 1fr;gap:14px;margin:14px 0 8px">
        <div class="rt-card" style="padding:14px 16px">
          <h3 style="margin:0 0 4px;font-size:13.0px;color:${RT.navy}">${de ? "Compliance-Profil" : "Compliance profile"}</h3>
          <p style="margin:0 0 6px;font-size:12.5px;color:${RT.muted}">${de ? "Compliance je Framework (0–100%)" : "Compliance per framework (0–100%)"}</p>
          <div style="display:flex;justify-content:center">${radarSvg(radarAxes)}</div>
        </div>
        <div class="rt-card" style="padding:14px 16px">
          <h3 style="margin:0 0 4px;font-size:13.0px;color:${RT.navy}">${de ? "Status-Verteilung" : "Status distribution"}</h3>
          <p style="margin:0 0 6px;font-size:12.5px;color:${RT.muted}">${de ? "Alle Kontrollen im Scope" : "All in-scope controls"}</p>
          <div style="display:flex;justify-content:center">${pieSvg(aggregate, 190)}</div>
          <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:8px">
            ${legendSwatch(CHART_MET(),     de ? "Umgesetzt"     : "Implemented",     ja)}
            ${legendSwatch(CHART_PARTIAL(), de ? "Teilweise"     : "Partial", teil)}
            ${legendSwatch(CHART_NOT_MET(), de ? "Nicht umgesetzt" : "Not implemented", nein)}
            ${legendSwatch(CHART_OPEN,    de ? "Unbeantwortet" : "Unanswered", total - ja - teil - nein - na)}
          </div>
        </div>
      </div>

      <table>
        <thead><tr>
          <th>${de ? "Framework" : "Framework"}</th>
          <th style="text-align:center">${de ? "Gesamt" : "Total"}</th>
          <th style="text-align:center">${de ? "Umgesetzt" : "Implemented"}</th>
          <th style="text-align:center">${de ? "Teilweise" : "Partial"}</th>
          <th style="text-align:center">${de ? "Nicht umgesetzt" : "Not implemented"}</th>
          <th style="text-align:center">N/A</th>
          <th>${de ? "Compliance" : "Compliance"}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

// ── Public entry point ──────────────────────────────────────────────────────

// ── Criticality context + narrative blocks ─────────────────────────────────

export function buildCriticalityContext(inv?: InventoryContext): CriticalityContext {
  if (!inv) return { criticalServiceCount: 0, highCriticalityAssetCount: 0, spofCount: 0, totalAssets: 0, totalServices: 0 };
  const critSvc = inv.services.filter(s => (s.criticality ?? 0) >= 3).length;
  const critAsset = inv.assets.filter(a => Math.max(a.user_override_criticality ?? 0, a.inherited_criticality ?? 0) >= 3).length;
  const spofs = inv.dependencies.filter(d => d.is_spof === true).length;
  return {
    criticalServiceCount: critSvc,
    highCriticalityAssetCount: critAsset,
    spofCount: spofs,
    totalAssets: inv.assets.length,
    totalServices: inv.services.length,
  };
}

function buildCriticalityBlock(ctx: CriticalityContext, agg: any, de: boolean): string {
  if (ctx.totalServices === 0 && ctx.totalAssets === 0) return "";
  return `
    <section class="rt-section">
      <h2>${de ? "Kritikalitätskontext (aus Phase 2)" : "Criticality Context (from Phase 2)"}</h2>
      ${buildKpiGrid([
        { label: de ? "Kritische Dienste" : "Critical services", value: `${ctx.criticalServiceCount} / ${ctx.totalServices}`, variant: ctx.criticalServiceCount > 0 ? "crit" : undefined },
        { label: de ? "Hoch-krit. Assets" : "High-criticality assets", value: `${ctx.highCriticalityAssetCount} / ${ctx.totalAssets}`, variant: ctx.highCriticalityAssetCount > 0 ? "accent" : undefined },
        { label: de ? "SPOF in Abhängigkeiten" : "SPOFs in dependencies", value: ctx.spofCount, variant: ctx.spofCount > 0 ? "crit" : undefined },
        { label: de ? "Offene Cluster" : "Open clusters", value: agg.topCaps.length, variant: "accent" },
      ])}
      <p style="font-size:12.5px;color:${RT.body};margin-top:8px">
        ${de
          ? "Die folgende Priorisierung gewichtet jede offene Lücke mit der Anzahl betroffener kritischer Dienste und identifizierter Single-Points-of-Failure. Kontrollen aus Incident-Management, Business Continuity, Zugriffssteuerung und Monitoring wirken direkt auf kritische Dienste; Asset-, Netzwerk- und Lieferantenkontrollen wirken auf SPOF."
          : "The priority list below weights each open gap by the number of critical services affected and identified single points of failure. Controls in incident management, business continuity, access management and monitoring act directly on critical services; asset, network and supplier controls act on SPOFs."}
      </p>
    </section>
  `;
}

function buildNarrativeBlock(agg: any, ctx: CriticalityContext, scopedFw: string[], de: boolean): string {
  const paras = buildExecutiveNarrative(agg, ctx, scopedFw, de);
  if (paras.length === 0) return "";
  return `
    <section class="rt-section">
      <h2>${de ? "Management Narrative" : "Management Narrative"}</h2>
      ${paras.map(p => `<p style="font-size:13.5px;line-height:1.55;color:${RT.body};margin:0 0 10px">${esc(p)}</p>`).join("")}
    </section>
  `;
}

function buildPriorityBlock(gaps: any[], ctx: CriticalityContext, de: boolean): string {
  const items = criticalityWeightedPriority(gaps, ctx, de, 20);
  if (items.length === 0) return "";
  const rows = items.map((it, i) => {
    const cap = it.gap.cap;
    const label = (de ? it.gap.ctrl.req_de : it.gap.ctrl.req_en) || it.gap.ctrl.req_de || it.gap.ctrl.req_en || "";
    const trimmed = label.length > 140 ? label.slice(0, 137) + "…" : label;
    return `<tr>
      <td style="width:34px;text-align:center;color:${RT.muted};font-weight:700">${i + 1}</td>
      <td style="width:12%"><span class="rt-mono-pill rt-meta-pill">${esc(it.gap.ctrl.id)}</span></td>
      <td style="width:14%;font-size:12px;color:${RT.navy}"><strong>${esc(humanCap(cap, de))}</strong></td>
      <td>${esc(trimmed)}${it.gap.muss ? ` <span class="rt-badge critical" style="margin-left:4px">MUSS</span>` : ""}
        <div style="font-size:11px;color:${RT.muted};margin-top:2px">${it.drivers.map(d => esc(d)).join(" · ")}</div>
      </td>
      <td style="width:14%;text-align:right"><strong style="color:${RT.navy};font-size:13px">${it.score.toFixed(1)}</strong></td>
    </tr>`;
  }).join("");
  return `
    <section class="rt-section">
      <h2>${de ? "Kritikalitäts-gewichtete Priorität (Top 20)" : "Criticality-Weighted Priority (Top 20)"}</h2>
      <table>
        <thead><tr>
          <th style="width:34px">#</th>
          <th>ID</th>
          <th>${de ? "Capability" : "Capability"}</th>
          <th>${de ? "Anforderung / Treiber" : "Requirement / Drivers"}</th>
          <th style="text-align:right">${de ? "Score" : "Score"}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function buildTimelineBlock(agg: any, scopedFw: string[], de: boolean): string {
  const steps = buildNextSteps(agg, scopedFw, de);
  if (steps.length === 0) return "";
  const buckets: Record<number, typeof steps> = { 30: [], 90: [], 180: [], 365: [] };
  for (const s of steps) buckets[s.bucket].push(s);
  const blocks = ([30, 90, 180, 365] as const).map(b => {
    if (buckets[b].length === 0) return "";
    const label = de ? BUCKET_LABEL[b].de : BUCKET_LABEL[b].en;
    const rows = buckets[b].map(s => `
      <div class="rt-gap-card" style="margin-bottom:8px">
        <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap">
          <strong style="color:${RT.navy};font-size:13px">${esc(humanCap(s.cap, de))}</strong>
          <span class="rt-meta-pill">${s.gapCount} ${de ? "Lücken" : "gaps"}${s.mustCount > 0 ? ` · ${s.mustCount} MUSS` : ""}</span>
          ${s.articles.slice(0, 3).map(a => `<span class="rt-meta-pill" style="background:#EFF6FF;color:${RT.navy}">${esc(a)}</span>`).join("")}
        </div>
        <div style="margin-top:4px;font-size:12.5px;color:${RT.body}">${esc(s.recommendation)}</div>
      </div>
    `).join("");
    return `<h3 style="margin:14px 0 6px;color:${RT.copper};font-size:13px;border-left:3px solid ${RT.copper};padding-left:8px">${esc(label)}</h3>${rows}`;
  }).join("");
  return `
    <section class="rt-section">
      <h2>${de ? "Nächste Schritte — Zeitplan" : "Next Steps — Timeline"}</h2>
      ${blocks}
    </section>
  `;
}

export function buildGapReportHtml(inp: BuildGapReportInput): string {
  const brand = getCompanyBrand();
  const de = inp.de;
  const dateStr = new Date().toLocaleDateString(de ? "de-DE" : "en-GB", {
    year: "numeric", month: "long", day: "2-digit",
  });
  const cover = buildCoverHtml({
    badge: de ? "Bewertung · Gap Analyse" : "Assessment · Gap Analysis",
    title: de ? "Gap-Analyse Bericht" : "Gap Analysis Report",
    subtitle: de
      ? `Multi-Framework Compliance-Auswertung (${inp.frameworks.length} ${inp.frameworks.length === 1 ? "Framework" : "Frameworks"})`
      : `Multi-framework compliance evaluation (${inp.frameworks.length} framework${inp.frameworks.length === 1 ? "" : "s"})`,
    companyName: brand.companyName || "",
    authorName: inp.authorName || "",
    authorLabel: de ? "Bericht erstellt von" : "Report prepared by",
    dateStr,
  });

  const sections = inp.frameworks.map(pf => buildFrameworkSection(pf, de, inp.mode ?? "expert")).join("");

  const stamp = (inp.classification ?? "").trim();
  const footer = `
    <div style="margin-top:28px;border-top:1px solid ${RT.border};padding-top:10px;font-size:12px;color:${RT.muted};display:flex;justify-content:space-between">
      <span>${esc(brand.companyName || getReportBrandName(de ? "de" : "en"))} · ${esc(dateStr)}</span>
      ${stamp ? `<span>${esc(stamp)}</span>` : ""}
    </div>
  `;

  const gaps = collectOpenGaps(inp.frameworks);
  const agg = aggregateGaps(gaps);
  const ctx = buildCriticalityContext(inp.inventory);
  const scopedFwList = inp.frameworks.map(pf => pf.framework);

  const body = `
    <div class="rt-report">
      ${cover}
      ${buildExecSummary(inp)}
      ${buildCriticalityBlock(ctx, agg, de)}
      ${buildNarrativeBlock(agg, ctx, scopedFwList, de)}
      ${buildPriorityBlock(gaps, ctx, de)}
      ${buildTimelineBlock(agg, scopedFwList, de)}
      ${sections}
      ${rtGlossary(de ? "de" : "en")}
      ${footer}
    </div>
  `;

  return wrapHtmlDoc({
    title: (brand.companyName ? brand.companyName + " – " : "") + (de ? "Gap-Analyse" : "Gap Analysis"),
    lang: de ? "de" : "en",
    body: reportGlobalCss + body,
  });
}

export async function exportGapReportPdf(inp: BuildGapReportInput): Promise<void> {
  const html = buildGapReportHtml(inp);
  const brand = getCompanyBrand();
  const slug = (brand.companyName || "gap-analyse").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const stamp = new Date().toISOString().slice(0, 10);
  await renderHtmlToPdf(html, `${slug}-gap-analyse-${stamp}.pdf`);
}
