/**
 * riskReport — Phase 4 Risk Analysis report (HTML → PDF).
 *
 * Mirrors gapReport structure: cover, executive narrative, KPI grid, 5×5
 * heatmap (report-safe SVG), Top-10 risk cards with whyCritical /
 * businessImpact / immediateAction, timeline plan. All from the pure
 * RiskAnalysisResult produced by riskEngine.generateRisks().
 */

import { RT } from "./reportTheme";
import { getCompanyBrand } from "./companyBrand";
import { getReportBrandName } from "./reportBrand";
import {
  buildCoverHtml, buildKpiGrid, wrapHtmlDoc, renderHtmlToPdf,
  reportGlobalCss, esc, rtGlossary,
} from "./reportHtmlLayout";
import {
  buildExecutiveNarrative, buildTopRiskInsight, buildNextStepsPlan,
} from "./riskReportNarrative";
import type { RiskAnalysisResult, RiskObject } from "./riskEngine";
import {
  riskLevelLabel, themeMatrixPalette, scoreAndLevel,
  type ColorPalette, type RiskLevel,
} from "./riskEngine";

export interface BuildRiskReportInput {
  result: RiskAnalysisResult;
  de: boolean;
  authorName?: string;
  classification?: string;
  /**
   * Farbpalette der Matrix — dieselbe wie auf dem Bildschirm.
   * Fehlt sie, wird die Themenfarbe genommen (`themeMatrixPalette()`), nicht
   * mehr eine feste rot/kupfer/grün-Reihe. Dr. Sait: „ekranda ne görünüyorsa
   * basılan metinde aynısı olsun."
   */
  palette?: ColorPalette;
  /** Vom Prüfer überschriebene Zellstufen (Schlüssel „likelihood-impact"). */
  cellOverrides?: Record<string, RiskLevel>;
  /** Zellen über dem Risikoappetit — zeichnet dieselbe gestrichelte Grenze wie am Bildschirm. */
  isOverAppetite?: (likelihood: number, impact: number, level: RiskLevel) => boolean;
}

const LEVEL_HEX: Record<string, string> = {
  critical: "#B91C1C", high: "#EA580C", medium: "#B45309", low: "#15803D",
};

const LEVEL_ORDER: RiskLevel[] = ["critical", "high", "medium", "low"];

function levelName(l: RiskLevel, de: boolean): string {
  return de
    ? ({ critical: "Kritisch", high: "Hoch", medium: "Mittel", low: "Niedrig" } as Record<string, string>)[l] ?? l
    : ({ critical: "Critical", high: "High", medium: "Medium", low: "Low" } as Record<string, string>)[l] ?? l;
}

/**
 * Risikomatrix für den Bericht — BILDSCHIRMGLEICH.
 *
 * Befund Dr. Sait 2026-09-12 („risk tablosu tamamen çıkmıyor"): Im Bericht war
 * die Matrix fast leer. Ursache war nicht der Seitenumbruch, sondern die
 * Einfärbung: hier wurden NUR belegte Zellen farbig, alle übrigen grau. Auf
 * dem Bildschirm ist jede Zelle nach ihrer Stufe gefärbt (leere Zellen nur
 * blasser) — dort sieht man die Klassifizierung der GANZEN Matrix. Im Druck
 * fehlte damit genau die Aussage der Grafik.
 *
 * Jetzt identisch zum Bildschirm (components/risk/RiskHeatmap.tsx):
 *   Stufe = Prüfer-Übersteuerung, sonst Stufe der belegten Risiken,
 *           sonst Stufe aus Score × Schwellen
 *   leere Zelle = 45 % Deckkraft · übersteuerte Zelle = dicker Rahmen
 *   Appetit-Grenze = gestrichelte Linie · darunter eine Legende
 * Farben kommen aus derselben Palette wie am Bildschirm.
 */
function heatmapSvg(
  result: RiskAnalysisResult,
  de: boolean,
  palette?: ColorPalette,
  cellOverrides?: Record<string, RiskLevel>,
  isOverAppetite?: (l: number, i: number, lvl: RiskLevel) => boolean,
): string {
  const dims = result.config.dimensions ?? { rows: 5, cols: 5 };
  const cw = 60, ch = 44, padL = 88, padT = 22, padB = 34;
  const w = padL + dims.cols * cw + 12;
  const h = padT + dims.rows * ch + padB;
  const pal = palette ?? themeMatrixPalette();
  const hex: Record<string, string> = {
    critical: pal.critical, high: pal.high, medium: pal.medium, low: pal.low,
  };

  const buckets: RiskObject[][][] = Array.from({ length: dims.rows }, () =>
    Array.from({ length: dims.cols }, () => [] as RiskObject[]));
  for (const r of result.risks) {
    const li = Math.min(dims.cols - 1, Math.max(0, r.likelihood - 1));
    const ii = Math.min(dims.rows - 1, Math.max(0, r.impact - 1));
    buckets[dims.rows - 1 - ii][li].push(r);
  }
  /** Strengste Stufe der Risiken in einer Zelle (wie cellLevel am Bildschirm). */
  const worst = (cells: RiskObject[]): RiskLevel => {
    for (const l of LEVEL_ORDER) if (cells.some(r => r.risk_level === l)) return l;
    return "low";
  };
  /** Stufe je Zelle — dieselbe Reihenfolge wie am Bildschirm. */
  const levelAt = (ri: number, ci: number, cells: RiskObject[]): RiskLevel => {
    const likelihood = ci + 1;
    const impact = dims.rows - ri;
    const ov = cellOverrides?.[`${likelihood}-${impact}`];
    if (ov) return ov;
    if (cells.length > 0) return worst(cells);
    // scoreAndLevel ist die ÖFFENTLICHE Berechnung der Engine (Formel +
    // Schwellen + Klemmung). Keine zweite Kopie der Logik im Bericht.
    return scoreAndLevel(likelihood, impact, result.config).level;
  };
  const over: boolean[][] = Array.from({ length: dims.rows }, (_r, ri) =>
    Array.from({ length: dims.cols }, (_c, ci) => {
      if (!isOverAppetite) return false;
      return isOverAppetite(ci + 1, dims.rows - ri, levelAt(ri, ci, buckets[ri][ci]));
    }));

  const cells = buckets.map((row, ri) => row.map((c, ci) => {
    const x = padL + ci * cw, y = padT + ri * ch;
    const likelihood = ci + 1, impact = dims.rows - ri;
    const ov = cellOverrides?.[`${likelihood}-${impact}`];
    const lvl = levelAt(ri, ci, c);
    const opacity = ov ? 1 : c.length > 0 ? 1 : 0.45;
    const stroke = ov ? RT.ink : RT.border;
    const sw = ov ? 1.2 : 0.5;
    return `<rect x="${x}" y="${y}" width="${cw - 2}" height="${ch - 2}" rx="4" fill="${hex[lvl]}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="${sw}"/>` +
      (over[ri][ci] ? `<rect x="${x}" y="${y}" width="${cw - 2}" height="${ch - 2}" rx="4" fill="${RT.stNein}" fill-opacity="0.10" stroke="none"/>` : "") +
      (c.length ? `<text x="${x + (cw - 2) / 2}" y="${y + (ch - 2) / 2 + 4}" text-anchor="middle" font-size="13" font-weight="700" fill="${RT.ink}">${c.length}</text>` : "");
  }).join("")).join("");

  // Appetit-Grenze: gestrichelte Linie zwischen akzeptabel und über Appetit.
  let boundary = "";
  if (isOverAppetite) {
    for (let ri = 0; ri < dims.rows; ri++) {
      for (let ci = 0; ci < dims.cols; ci++) {
        if (over[ri][ci]) continue;
        const x = padL + ci * cw, y = padT + ri * ch;
        if (ri > 0 && over[ri - 1][ci]) {
          boundary += `<line x1="${x}" y1="${y}" x2="${x + cw - 2}" y2="${y}" stroke="${RT.stNein}" stroke-width="2.5" stroke-dasharray="5 3"/>`;
        }
        if (ci < dims.cols - 1 && over[ri][ci + 1]) {
          boundary += `<line x1="${x + cw - 2}" y1="${y}" x2="${x + cw - 2}" y2="${y + ch - 2}" stroke="${RT.stNein}" stroke-width="2.5" stroke-dasharray="5 3"/>`;
        }
      }
    }
  }
  const colLabels = Array.from({ length: dims.cols }, (_, ci) =>
    `<text x="${padL + ci * cw + (cw - 2) / 2}" y="${padT - 6}" text-anchor="middle" font-size="10" fill="${RT.muted}">${ci + 1}</text>`).join("");
  const rowLabels = Array.from({ length: dims.rows }, (_, ri) =>
    `<text x="${padL - 8}" y="${padT + ri * ch + (ch - 2) / 2 + 4}" text-anchor="end" font-size="10" fill="${RT.muted}">${dims.rows - ri}</text>`).join("");
  // Legende — am Bildschirm steht sie unter der Matrix, im Bericht fehlte sie
  // ganz: die Bildunterschrift sprach von Farben, ohne sie zu erklären.
  const legend = `<div style="display:flex;justify-content:center;flex-wrap:wrap;gap:14px;margin-top:10px;font-size:11px;color:${RT.muted}">${
    LEVEL_ORDER.map(l =>
      `<span style="display:inline-flex;align-items:center;gap:5px;white-space:nowrap"><span style="display:inline-block;width:11px;height:11px;border-radius:2px;background:${hex[l]}"></span>${esc(levelName(l, de))}</span>`
    ).join("")
  }${isOverAppetite ? `<span style="display:inline-flex;align-items:center;gap:5px;white-space:nowrap"><span style="display:inline-block;width:16px;border-top:2px dashed ${RT.stNein}"></span>${esc(de ? "Risikoappetit-Grenze" : "Risk appetite boundary")}</span>` : ""}</div>`;

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <text x="${padL + (dims.cols * cw) / 2}" y="${h - 6}" text-anchor="middle" font-size="11" fill="${RT.muted}">${esc(de ? "Eintrittswahrscheinlichkeit →" : "Likelihood →")}</text>
    <text x="12" y="${padT + (dims.rows * ch) / 2}" transform="rotate(-90 12 ${padT + (dims.rows * ch) / 2})" text-anchor="middle" font-size="11" fill="${RT.muted}">${esc(de ? "Auswirkung →" : "Impact →")}</text>
    ${cells}${boundary}${colLabels}${rowLabels}
  </svg>${legend}`;
}

function buildExecSection(input: BuildRiskReportInput): string {
  const { result, de } = input;
  const s = result.summary;
  const narr = buildExecutiveNarrative(result, de ? "de" : "en");
  const kpi = buildKpiGrid([
    { label: de ? "Risiken gesamt" : "Total risks", value: s.totalRisks },
    { label: de ? "Kritisch" : "Critical", value: s.bySeverity.critical, variant: "crit" },
    { label: de ? "Hoch" : "High", value: s.bySeverity.high, variant: "crit" },
    { label: de ? "Mittel" : "Medium", value: s.bySeverity.medium, variant: "accent" },
    { label: de ? "Niedrig" : "Low", value: s.bySeverity.low },
    { label: de ? "Ø Score" : "Avg score", value: s.averageScore, variant: "accent" },
  ]);
  return `<section class="rt-section">
    <h2>${esc(de ? "Executive Summary" : "Executive Summary")}</h2>
    ${kpi}
    ${narr.paragraphs.map(p => `<p style="margin:8px 0;font-size:12.5px;color:${RT.body}">${esc(p)}</p>`).join("")}
  </section>`;
}

function buildHeatmapSection(inp: BuildRiskReportInput): string {
  const { result, de } = inp;
  const dims = result.config.dimensions ?? { rows: 5, cols: 5 };
  const dimLabel = `${dims.rows}×${dims.cols}`;
  return `<section class="rt-section">
    <h2>${esc(de ? `Risikomatrix (${dimLabel})` : `Risk Matrix (${dimLabel})`)}</h2>
    <div style="display:flex;flex-direction:column;align-items:center;padding:8px 0">${heatmapSvg(result, de, inp.palette, inp.cellOverrides, inp.isOverAppetite)}</div>
    <p style="font-size:11px;color:${RT.muted};margin:6px 0 0;text-align:center">
      ${esc(de ? "Zahl in Zelle = Anzahl der Risiken; Farbe = höchste Klassifizierung in dieser Zelle." : "Cell number = risk count; color = highest classification within the cell.")}
    </p>
  </section>`;
}

function levelBadge(level: RiskObject["risk_level"], de: boolean): string {
  return `<span class="rt-badge" style="background:${LEVEL_HEX[level]};color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:700;letter-spacing:0.3px">${esc(riskLevelLabel(level, de ? "de" : "en").toUpperCase())}</span>`;
}

function buildTopRisksSection(result: RiskAnalysisResult, de: boolean): string {
  const top = result.risks.slice(0, 10);
  if (top.length === 0) return "";
  const rows = top.map((r, i) => {
    const ins = buildTopRiskInsight(r, de ? "de" : "en");
    const title = de ? r.gap_title : r.gap_title_en;
    const badges = [
      levelBadge(r.risk_level, de),
      `<span class="rt-meta-pill">${esc(de ? "Score" : "Score")}: ${r.risk_score}</span>`,
      r.scope === "organization"
        ? `<span class="rt-meta-pill">${esc(de ? "Organisationsweit" : "Org-wide")}</span>`
        : `<span class="rt-meta-pill">${esc(r.asset_name ?? "—")}</span>`,
      r.service_name ? `<span class="rt-meta-pill" style="background:#EFF6FF;color:${RT.navy}">${esc(r.service_name)}</span>` : "",
      // ITEM 16 — inherent → residual pill, only when residual has been computed.
      typeof r.residual_score === "number"
        ? `<span class="rt-meta-pill">${esc(de ? "Inhärent" : "Inherent")}: ${r.inherent_score ?? r.risk_score} → ${esc(de ? "Residual" : "Residual")}: ${r.residual_score}</span>`
        : "",
    ].filter(Boolean).join(" ");
    return `<div class="rt-gap-card" style="margin-bottom:10px">
      <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;margin-bottom:6px">
        <strong style="color:${RT.muted};font-size:12px">#${i + 1}</strong>
        <strong style="color:${RT.navy};font-size:13.5px">${esc(title)}</strong>
        ${badges}
      </div>
      <div style="font-size:12px;line-height:1.5"><strong>${esc(de ? "Warum kritisch:" : "Why critical:")}</strong> ${esc(ins.whyCritical)}</div>
      <div style="font-size:12px;line-height:1.5;margin-top:4px"><strong>${esc(de ? "Business Impact:" : "Business impact:")}</strong> ${esc(ins.businessImpact)}</div>
      <div style="font-size:12px;line-height:1.5;margin-top:4px"><strong>${esc(de ? "Sofortmaßnahme:" : "Immediate action:")}</strong> ${esc(ins.immediateAction)}</div>
    </div>`;
  }).join("");
  return `<section class="rt-section">
    <h2>${esc(de ? "Top-10 Risiken" : "Top-10 Risks")}</h2>
    ${rows}
  </section>`;
}

function buildTimelineSection(result: RiskAnalysisResult, de: boolean): string {
  const plan = buildNextStepsPlan(result, de ? "de" : "en");
  const buckets: Array<{ key: keyof typeof plan; label: string }> = [
    { key: "sofort",        label: de ? "Sofort (0–30 Tage)"        : "Immediate (0–30 days)" },
    { key: "kurzfristig",   label: de ? "Kurzfristig (30–90 Tage)"  : "Short-term (30–90 days)" },
    { key: "mittelfristig", label: de ? "Mittelfristig (90–180 Tage)" : "Mid-term (90–180 days)" },
    { key: "langfristig",   label: de ? "Langfristig (>180 Tage)"    : "Long-term (>180 days)" },
  ];
  const body = buckets.map(b => {
    const items = plan[b.key];
    if (items.length === 0) return "";
    const rows = items.map(it => `
      <div class="rt-gap-card" style="margin-bottom:6px">
        <div style="font-size:12.5px;color:${RT.body}">${esc(it.text)}</div>
        <div style="font-size:11px;color:${RT.muted};margin-top:2px">${esc(it.owner)} · ${esc(it.due)}</div>
      </div>`).join("");
    return `<h3 style="margin:14px 0 6px;color:${RT.copper};font-size:13px;border-left:3px solid ${RT.copper};padding-left:8px">${esc(b.label)}</h3>${rows}`;
  }).join("");
  if (!body) return "";
  return `<section class="rt-section">
    <h2>${esc(de ? "Nächste Schritte — Zeitplan" : "Next Steps — Timeline")}</h2>
    ${body}
  </section>`;
}

export function buildRiskReportHtml(inp: BuildRiskReportInput): string {
  const brand = getCompanyBrand();
  const de = inp.de;
  const dateStr = new Date().toLocaleDateString(de ? "de-DE" : "en-GB", {
    year: "numeric", month: "long", day: "2-digit",
  });
  const cover = buildCoverHtml({
    badge: de ? "Phase 4 · Risiko" : "Phase 4 · Risk",
    title: de ? "Risikoanalyse Bericht" : "Risk Analysis Report",
    subtitle: de
      ? `${inp.result.summary.totalRisks} identifizierte Risiken aus der Gap-Analyse`
      : `${inp.result.summary.totalRisks} risks identified from gap analysis`,
    companyName: brand.companyName || "",
    authorName: inp.authorName || "",
    authorLabel: de ? "Bericht erstellt von" : "Report prepared by",
    dateStr,
  });
  const stamp = (inp.classification ?? "").trim();
  const footer = `<div style="margin-top:28px;border-top:1px solid ${RT.border};padding-top:10px;font-size:12px;color:${RT.muted};display:flex;justify-content:space-between">
    <span>${esc(brand.companyName || getReportBrandName(de ? "de" : "en"))} · ${esc(dateStr)}</span>
    ${stamp ? `<span>${esc(stamp)}</span>` : ""}
  </div>`;

  const body = `<div class="rt-report">
    ${cover}
    ${buildExecSection(inp)}
    ${buildHeatmapSection(inp)}
    ${buildTopRisksSection(inp.result, de)}
    ${buildTimelineSection(inp.result, de)}
    ${rtGlossary(de ? "de" : "en")}
    ${footer}
  </div>`;

  return wrapHtmlDoc({
    title: (brand.companyName ? brand.companyName + " – " : "") + (de ? "Risikoanalyse" : "Risk Analysis"),
    lang: de ? "de" : "en",
    body: reportGlobalCss + body,
  });
}

export async function exportRiskReportPdf(inp: BuildRiskReportInput): Promise<void> {
  const html = buildRiskReportHtml(inp);
  const brand = getCompanyBrand();
  const slug = (brand.companyName || "risikoanalyse").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const stamp = new Date().toISOString().slice(0, 10);
  await renderHtmlToPdf(html, `${slug}-risikoanalyse-${stamp}.pdf`);
}
