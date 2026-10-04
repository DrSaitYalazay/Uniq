import { withLightTheme, withLightThemeAsync } from "@/lib/themeMode";
import html2canvas from "html2canvas";
import { RT } from "@/lib/reportTheme";
import { currentAccentHexPair } from "@/lib/accentTheme";
import { brandLogoDataUrl } from "@/lib/companyBrand";
/**
 * ReportKit — print-to-PDF + mso-Word export module.
 *
 * Visual style is aligned with UniqSuite brand (shield navy + copper).
 * Acts as the single source of truth for ALL report exports.
 *
 *   import { rkExport, rkSection, rkTable, rkKpiRow, rkScoreBox, rkBar, rkPill } from "@/lib/reportKit";
 *
 *   const body =
 *     rkKpiRow([{ label: "Controls", value: 142, color: RK.theme.head1 }, ...]) +
 *     rkSection("Top Gaps") +
 *     rkTable(["Control", "Severity", "Score"], rows);
 *
 *   rkExport("pdf",  { title: "Gap Report", sub: "Step 7", body, file: "NIS2_Gap", lang: "de" });
 *   rkExport("word", { title: "Gap Report", sub: "Step 7", body, file: "NIS2_Gap", lang: "de" });
 *
 * No jsPDF / docx-js / html2canvas dependency in this path.
 */

import { getCompanyBrand } from "./companyBrand";
import { getReportBrandName } from "./reportBrand";

export type Lang = "de" | "en";

// Brand identity in generated reports is the TENANT's company name, never
// the tool. `brand` / `footer` / `badge` are resolved at render time via
// getReportBrandName(lang) so a fresh company name flows into every export.
const theme = {
  brand:    "", // computed per-render — see brandHTML() / footerText()
  brandAlt: "",
  badge:    "", // computed from brand initials
  tagline:  "", // intentionally empty — no tool-side tagline in customer reports
  footer:   "", // computed per-render — see footerText()
  ink:      "#1A202C",
  ink2:     "#4A5568",
  ink3:     "#718096",
  line:     "#DBE3EF",
  bg:       "#F8FAFC",
  head1:    "#1A2E41", // shield navy
  head2:    "#112754", // navy deep
  accent:   RT.copper, // copper
  primary:  "#E56E19", // copper light (CTA)
  scoreColors: [
    { min: 66, color: "#7F1D1D" }, // critical
    { min: 40, color: "#9A3412" }, // high
    { min: 18, color: "#854D0E" }, // medium
    { min: 0,  color: "#14532D" }, // low
  ],
  // Kein externer Google-Fonts-Request im Kundendruck (DSGVO + offline). Es werden
  // System-/Fallback-Fonts genutzt (siehe pdfBody/pdfDisplay).
  pdfFontLink: '',
  pdfBody:     'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif',
  pdfDisplay:  'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif',
} as const;

const t = (lang: Lang | undefined, de: string, en: string) => (lang === "en" ? en : de);

function metaNow(lang: Lang = "de") {
  return new Date().toLocaleString(lang === "en" ? "en-GB" : "de-DE");
}

function hexScore(s: number): string {
  for (const tier of theme.scoreColors) if (s >= tier.min) return tier.color;
  return theme.scoreColors[theme.scoreColors.length - 1].color;
}

/* ─── Building blocks ─────────────────────────────────────────────────── */

export function rkSection(title: string): string {
  return `<h2>${title}</h2>`;
}

export function rkLead(text: string): string {
  return `<p class="lead">${text}</p>`;
}

/**
 * Legende & Begriffe — erklärt ALLE Kürzel/Kennzahlen der Report-Grafiken in
 * Management-Klartext (Dr. Sait: keine nackten Abkürzungen). Deckungsgleich mit
 * der Dashboard-GlossaryCard, damit Bildschirm und Bericht dieselbe Sprache
 * sprechen. Am Ende jedes management-orientierten Berichts einfügen.
 */
export function rkGlossary(lang: Lang): string {
  const de = lang === "de";
  const rows: Array<[string, string]> = de
    ? [
        ["Konformität / Compliance", "Anteil der erfüllten Anforderungen eines Frameworks (in Prozent)."],
        ["Reifegrad (0–5)", "Umsetzungsstand einer Maßnahme: 0 = nicht vorhanden, 5 = optimiert/gelebt."],
        ["Sicherheits-Posture", "Gesamtscore (0–100) aus Konformität, Nachweis-Aktualität, Reifegrad, Fristen-Treue und Risiko."],
        ["MUSS-Anforderung", "Pflichtanforderung (im Gegensatz zu SOLL/Empfehlung)."],
        ["Nachweis (Evidence)", "Beleg, dass eine Kontrolle umgesetzt ist (Richtlinie, Screenshot, Protokoll …)."],
        ["Frist / Fristen-Treue", "Termine (z. B. Meldepflichten). Treue = Anteil rechtzeitig erledigter Fristen."],
        ["CCM", "Continuous Control Monitoring: laufende, automatische Wirksamkeitsprüfung von Kontrollen."],
        ["Kontroll-Knoten (same-as)", "Inhaltsgleiche Kontrollen mehrerer Frameworks als EIN Knoten. Kein Framework ist Hauptframework."],
        ["Delta", "Framework-spezifische Zusatzanforderung ohne Pendant in anderen Frameworks."],
        ["Weakest-Link-Prinzip", "Bei geteiltem Knoten zählt der schlechteste Status: nicht erfüllt < teilweise < erfüllt."],
        ["Status", "Umgesetzt = vollständig erfüllt · Teilweise = angefangen · Nicht umgesetzt = Lücke · N.a. = nicht anwendbar · Unbeantwortet = noch nicht bewertet."],
      ]
    : [
        ["Conformity / Compliance", "Share of a framework's requirements that are met (as a percentage)."],
        ["Maturity (0–5)", "Implementation level of a measure: 0 = none, 5 = optimised/embedded."],
        ["Security posture", "Overall score (0–100) from conformity, evidence freshness, maturity, deadline adherence and risk."],
        ["MUST requirement", "Mandatory requirement (as opposed to a SHOULD/recommendation)."],
        ["Evidence", "Proof that a control is implemented (policy, screenshot, log …)."],
        ["Deadline / adherence", "Due dates (e.g. reporting duties). Adherence = share of deadlines met on time."],
        ["CCM", "Continuous Control Monitoring: ongoing automated checking that controls stay effective."],
        ["Control node (same-as)", "Content-equivalent controls of several frameworks as ONE node. No framework is a master."],
        ["Delta", "Framework-specific extra requirement with no equivalent in other frameworks."],
        ["Weakest-link rule", "When a node is shared, the worst status counts: not met < partial < met."],
        ["Status", "Met = implemented · Partial = started · Not met = gap · N/A = not applicable · Open = unassessed."],
      ];
  return (
    rkSection(de ? "Legende & Begriffe" : "Legend & glossary") +
    rkLead(de
      ? "Erklärung aller Kürzel und Kennzahlen dieses Berichts — damit auch ohne Fachhintergrund jede Grafik lesbar ist."
      : "Explanation of every abbreviation and metric in this report — so every chart is readable without a technical background.") +
    rkTable([de ? "Begriff" : "Term", de ? "Bedeutung" : "Meaning"], rows.map(([t, d]) => [`<strong>${t}</strong>`, d]))
  );
}

export function rkTable(headers: string[], rows: Array<Array<string | number>>): string {
  return `<table class="rt"><thead><tr>${
    headers.map(h => `<th>${h}</th>`).join("")
  }</tr></thead><tbody>${
    rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")
  }</tbody></table>`;
}

export function rkBar(items: Array<{ label: string; value: number; color: string }>): string {
  return `<table style="width:100%;border-collapse:collapse;margin:6px 0 2px">${
    items.map(it => {
      const v = Math.max(0, Math.min(100, it.value));
      const fill =
        `<table style="width:100%;border-collapse:collapse;table-layout:fixed"><tr>` +
        `<td style="width:${v}%;background:${it.color};height:16px;font-size:1px;line-height:16px">&nbsp;</td>` +
        (v < 100 ? `<td style="width:${100 - v}%;background:#EEF1F5;height:16px;font-size:1px;line-height:16px">&nbsp;</td>` : "") +
        `</tr></table>`;
      return `<tr><td style="padding:4px 10px 4px 0;font-size:11px;color:${theme.ink2};width:190px">${it.label}</td>` +
        `<td style="padding:4px 0">${fill}</td>` +
        `<td style="padding:4px 0 4px 10px;font-size:11px;font-weight:700;width:38px;text-align:right">${it.value}</td></tr>`;
    }).join("")
  }</table>`;
}

export function rkKpiRow(cells: Array<{ label: string; value: string | number; color: string }>): string {
  const w = Math.floor(100 / cells.length);
  return `<table style="width:100%;margin-bottom:8px"><tr>${
    cells.map(c =>
      `<td style="width:${w}%;border:1px solid ${theme.line};border-top:3px solid ${c.color};padding:12px 14px;vertical-align:top">` +
      `<div style="font-family:${theme.pdfDisplay};font-size:22px;font-weight:800;color:${c.color}">${c.value}</div>` +
      `<div style="font-size:10.5px;color:${theme.ink3};margin-top:3px">${c.label}</div></td>`
    ).join("")
  }</tr></table>`;
}

export function rkScoreBox(score: number, title: string, subtitle?: string, lines?: string, colorOverride?: string): string {
  // colorOverride: wenn der Score nicht auf der 0–100-Skala liegt (z. B. 5×5-
  // Risiko-Score 0–25), muss die Farbe vom Aufrufer kommen, sonst färbt
  // hexScore falsch (ein kritischer Score 20 sähe „mittel" aus).
  const c = colorOverride ?? hexScore(score);
  return `<table style="width:100%;margin-bottom:12px"><tr>` +
    `<td style="width:104px;vertical-align:middle"><table style="width:96px;background:${c}"><tr>` +
    `<td style="height:96px;text-align:center;color:#fff;font-size:38px;font-weight:800;font-family:${theme.pdfDisplay}">${score}</td></tr></table></td>` +
    `<td style="vertical-align:middle;padding-left:16px">` +
    `<div style="font-family:${theme.pdfDisplay};font-size:20px;font-weight:800">${title}</div>` +
    (subtitle ? `<div style="font-size:12.5px;color:${theme.ink2};margin-top:4px">${subtitle}</div>` : "") +
    (lines    ? `<div style="font-size:11.5px;color:${theme.ink3};margin-top:7px">${lines}</div>` : "") +
    `</td></tr></table>`;
}

export function rkPill(text: string, color: string): string {
  return `<span style="display:inline-block;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;color:#fff;background:${color}">${text}</span>`;
}

/* ─── Shell HTML ──────────────────────────────────────────────────────── */

/** Tenant-scoped brand block (no tool name). */
function resolveBrand(lang: Lang) {
  const name = getReportBrandName(lang);
  const initials = (name.match(/\b[A-Za-z0-9ÄÖÜäöü]/g) || []).slice(0, 2).join("").toUpperCase() || "•";
  return { name, initials };
}

function brandHTML(lang: Lang): string {
  const { name, initials } = resolveBrand(lang);
  const tagline = lang === "de" ? "Compliance-Bericht" : "Compliance Report";
  return `<span class="lg">${initials}</span>` +
    `<span><b>${name}</b><span>${tagline}</span></span>`;
}

function footerText(lang: Lang): string {
  const conf = lang === "de" ? "vertraulich" : "confidential";
  return `${resolveBrand(lang).name} · ${conf}`;
}

function companyLogoBoxHtml(size = 64): string {
  const brand = getCompanyBrand();
  const { accent, accent2 } = currentAccentHexPair();
  const logoUrl = brandLogoDataUrl(brand, accent, accent2); // Upload oder Anfangsbuchstabe
  if (!logoUrl) return "";
  // White padded card — logos with white or transparent backgrounds sit
  // cleanly on the navy header without visual seams.
  return `<div style="background:#fff;border-radius:10px;padding:8px;width:${size + 16}px;height:${size + 16}px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.12);flex-shrink:0;">
    <img src="${logoUrl}" alt="${brand.companyName || "Company logo"}" style="max-width:${size}px;max-height:${size}px;object-fit:contain;display:block;" />
  </div>`;
}


function pdfShell(title: string, sub: string, body: string, lang: Lang): string {
  const fd = theme.pdfDisplay, ff = theme.pdfBody;
  const closeLabel = t(lang, "Schlie\u00DFen", "Close");
  const printLabel = t(lang, "Als PDF speichern / Drucken", "Save as PDF / Print");
  const genLabel = t(lang, "Generiert", "Generated");
  const brandName = resolveBrand(lang).name;
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><title>${title} \u2014 ${brandName}</title>${theme.pdfFontLink}
    <style>
      /* Farben EXAKT wie am Bildschirm drucken (sonst blasst/verfälscht der
         Browser Flächen- und Diagrammfarben beim Druck). */
      *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      body{font-family:${ff};color:${theme.ink};background:${theme.bg}}
      /* Übernommene Bildschirm-Diagramme */
      .figs{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:8px}
      .figs figure{break-inside:avoid;page-break-inside:avoid;border:1px solid ${theme.line};border-radius:10px;padding:10px 10px 6px;background:#fff;text-align:center}
      .figs figcaption{font-size:11px;font-weight:700;color:${theme.head1};margin-bottom:6px;text-align:left}
      .figs svg{max-width:100%;height:auto}
      .sheet{max-width:900px;margin:24px auto;background:#fff;box-shadow:0 18px 48px -20px rgba(26,46,65,.28);border-radius:14px;overflow:hidden}
      .head{background:linear-gradient(135deg,${theme.head1},${theme.head2});color:#fff;padding:34px 40px}
      .brand{display:flex;align-items:center;gap:12px;margin-bottom:20px}
      .brand .lg{width:38px;height:38px;border-radius:10px;background:${theme.accent};display:inline-block;text-align:center;line-height:38px;font-family:${fd};font-weight:800;color:#fff;font-size:12px;letter-spacing:.5px}
      .brand b{font-family:${fd};font-size:18px;font-weight:800}
      .brand>span>span{font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:${theme.accent};display:block;font-weight:600}
      .head h1{font-family:${fd};font-size:26px;font-weight:800}
      .head p{font-size:13.5px;color:#A9B8CE;margin-top:6px}
      .head .meta{margin-top:16px;font-size:11.5px;color:#90A4C0}
      .body{padding:34px 40px}
      .body h2{font-family:${fd};font-size:16px;font-weight:700;margin:26px 0 8px;padding-bottom:7px;border-bottom:2px solid ${theme.line};color:${theme.head1}}
      .body h2:first-child{margin-top:0}
      .lead{font-size:13.5px;color:${theme.ink2};line-height:1.6;margin-bottom:8px}
      table.rt{width:100%;border-collapse:collapse;margin-top:6px;font-size:12.5px}
      table.rt th{text-align:left;background:#FAFBFC;color:${theme.ink3};font-size:10px;text-transform:uppercase;letter-spacing:.6px;padding:9px 11px;border-bottom:1px solid ${theme.line}}
      table.rt td{padding:10px 11px;border-bottom:1px solid #EEF1F5;vertical-align:top}
      table.rt tr{page-break-inside:avoid}
      .foot{padding:20px 40px;border-top:1px solid ${theme.line};font-size:11px;color:${theme.ink3}}
      .toolbar{position:sticky;top:0;z-index:10;background:#fff;border-bottom:1px solid ${theme.line};padding:12px 40px;text-align:right;max-width:900px;margin:0 auto}
      .btn{border:none;border-radius:9px;padding:9px 16px;font-weight:600;font-size:13px;cursor:pointer;margin-left:8px;font-family:${ff}}
      .btn.p{background:${theme.primary};color:#fff}.btn.g{background:#F4F6F9;color:${theme.ink2};border:1px solid ${theme.line}}
      @page{size:A4;margin:14mm 12mm}
      .printfoot{display:none}
      @media print{.toolbar{display:none}body{background:#fff}.sheet{box-shadow:none;margin:0;max-width:100%;border-radius:0}
        .printfoot{display:block;position:fixed;bottom:4mm;left:0;right:0;text-align:center;font-size:8.5px;color:${theme.ink3}}}
    </style></head><body>
    <div class="toolbar"><button class="btn g" onclick="window.close()">${closeLabel}</button><button class="btn p" onclick="window.print()">${printLabel}</button></div>
    <div class="sheet"><div class="head" style="display:flex;align-items:flex-start;gap:18px;">
      <div style="flex:1;min-width:0"><div class="brand">${brandHTML(lang)}</div>
      <h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}<div class="meta">${genLabel}: ${metaNow(lang)}</div></div>
      ${companyLogoBoxHtml(64)}
      </div>
      <div class="body">${body}</div>
      <div class="foot">${footerText(lang)}</div></div>
      <div class="printfoot">${brandName} · ${metaNow(lang)} · ${t(lang, "Vertraulich", "Confidential")}</div>
      </body></html>`;
}

function wordShell(title: string, sub: string, body: string, lang: Lang): string {
  const { name: brandName, initials: brandInitials } = resolveBrand(lang);
  const tagline = lang === "de" ? "Compliance-Bericht" : "Compliance Report";
  const brandBlock = `<span style="color:#fff;font-weight:bold;font-size:14pt">${brandName}</span>`;
  const genLabel = t(lang, "Generiert", "Generated");
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8">
    <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
    <style>
      @page{size:21cm 29.7cm;margin:1.6cm 1.8cm}
      body{font-family:Calibri,Arial,sans-serif;color:${theme.ink};font-size:11pt;margin:0}
      h2{font-family:Calibri,Arial,sans-serif;font-size:13pt;font-weight:bold;color:${theme.head1};margin:18pt 0 6pt;border-bottom:1.5pt solid ${theme.line};padding-bottom:3pt}
      p.lead{font-size:10.5pt;color:${theme.ink2};margin:0 0 6pt}
      table{border-collapse:collapse;width:100%}
      table.rt{margin-top:4pt;font-size:10pt}
      table.rt th{background:${theme.head1};color:#fff;text-align:left;padding:6pt 8pt;font-size:8.5pt;border:0.5pt solid ${theme.head1}}
      table.rt td{padding:5pt 8pt;border:0.5pt solid ${theme.line};vertical-align:top}
    </style></head><body>
    <table style="width:100%;background:${theme.head1};margin-bottom:14pt"><tr>
      <td style="padding:20pt 22pt;vertical-align:top">
        <table style="margin-bottom:8pt"><tr>
          <td style="background:${theme.accent};color:#fff;font-weight:bold;width:34pt;height:30pt;text-align:center;border-radius:6pt;font-size:10pt">${brandInitials}</td>
          <td style="padding-left:10pt">${brandBlock}<br><span style="color:${theme.accent};font-size:7.5pt;letter-spacing:1pt">${tagline.toUpperCase()}</span></td>
        </tr></table>
        <div style="color:#fff;font-size:20pt;font-weight:bold">${title}</div>
        ${sub ? `<div style="color:#A9B8CE;font-size:10.5pt;margin-top:4pt">${sub}</div>` : ""}
        <div style="color:#90A4C0;font-size:8.5pt;margin-top:10pt">${genLabel}: ${metaNow(lang)}</div>
      </td>
      <td style="padding:16pt 22pt 16pt 0;vertical-align:top;text-align:right;width:96pt">${companyLogoBoxHtml(64)}</td>
    </tr></table>
    <div style="padding:0 2pt">${body}</div>
    <table style="width:100%;margin-top:16pt;border-top:1pt solid ${theme.line}"><tr><td style="padding-top:8pt;font-size:8.5pt;color:${theme.ink3}">${footerText(lang)}</td></tr></table>
    </body></html>`;
}

/* ─── Delivery ────────────────────────────────────────────────────────── */

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Übernimmt die AKTUELL sichtbaren Diagramme der Seite 1:1 in den Bericht.
 *
 * Warum nicht einfach das SVG kopieren? Die Charts färben sich über CSS-Variablen
 * (`hsl(var(--primary))`). Im Druckfenster gibt es diese Variablen nicht — die
 * Grafik käme farblos/verfälscht heraus. Deshalb werden hier die vom Browser
 * BERECHNETEN Farben (exakt die Bildschirmwerte) auf den Klon eingefroren.
 * Zusammen mit `print-color-adjust:exact` im Shell druckt das Ergebnis exakt in
 * den Bildschirmfarben — nichts wird dunkler oder blasser.
 */
export function rkCaptureCharts(root?: HTMLElement | null, opts?: { max?: number; minSize?: number }): string {
  if (typeof document === "undefined" || typeof window === "undefined") return "";
  // Berichte sind „weißes Papier": Grafiken immer in heller Optik einfrieren,
  // auch wenn der Nutzer gerade im Dunkelmodus arbeitet (sonst helle Schrift
  // auf weißem Grund). Der Modus wird danach exakt wiederhergestellt.
  return withLightTheme(() => rkCaptureChartsImpl(root, opts));
}

function rkCaptureChartsImpl(root?: HTMLElement | null, opts?: { max?: number; minSize?: number }): string {
  const scope: ParentNode = root ?? document;
  const max = opts?.max ?? 12;
  const minSize = opts?.minSize ?? 60;
  const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

  let nodes: SVGSVGElement[] = [];
  try {
    nodes = Array.from(scope.querySelectorAll("svg")) as SVGSVGElement[];
  } catch { return ""; }

  const figs: string[] = [];
  for (const svg of nodes) {
    if (figs.length >= max) break;
    let rect: DOMRect;
    try { rect = svg.getBoundingClientRect(); } catch { continue; }
    // Sparklines, Icons und unsichtbare SVGs überspringen
    if (rect.width < minSize || rect.height < minSize) continue;

    let clone: SVGSVGElement;
    try { clone = svg.cloneNode(true) as SVGSVGElement; } catch { continue; }

    // Berechnete Farben/Schrift einfrieren → identische Optik im Druck.
    try {
      const origEls: Element[] = [svg, ...Array.from(svg.querySelectorAll("*"))];
      const cloneEls: Element[] = [clone, ...Array.from(clone.querySelectorAll("*"))];
      const n = Math.min(origEls.length, cloneEls.length);
      for (let i = 0; i < n; i++) {
        const cs = window.getComputedStyle(origEls[i]);
        const c = cloneEls[i] as SVGElement;
        if (cs.fill && cs.fill !== "none") c.setAttribute("fill", cs.fill);
        if (cs.stroke && cs.stroke !== "none") c.setAttribute("stroke", cs.stroke);
        if (cs.strokeWidth) c.setAttribute("stroke-width", cs.strokeWidth);
        if (cs.opacity && cs.opacity !== "1") c.setAttribute("opacity", cs.opacity);
        if (cs.fontSize) c.setAttribute("font-size", cs.fontSize);
        if (cs.fontWeight && cs.fontWeight !== "400") c.setAttribute("font-weight", cs.fontWeight);
        if (cs.fontFamily) c.setAttribute("font-family", cs.fontFamily);
      }
    } catch { /* Optik-Feinschliff ist optional — lieber Grafik ohne als gar keine */ }

    const w = Math.round(rect.width), h = Math.round(rect.height);
    clone.setAttribute("width", String(w));
    clone.setAttribute("height", String(h));
    if (!clone.getAttribute("viewBox")) clone.setAttribute("viewBox", `0 0 ${w} ${h}`);
    clone.removeAttribute("style");

    // Beschriftung: explizites data-report-title, sonst nächstliegende Überschrift.
    let caption = "";
    try {
      const holder = svg.closest("[data-report-title]") as HTMLElement | null;
      caption = holder?.getAttribute("data-report-title")
        || (svg.closest("section,article,div.rounded-xl,div.rounded-lg")?.querySelector("h1,h2,h3,h4")?.textContent || "").trim();
    } catch { caption = ""; }
    caption = caption.replace(/\s+/g, " ").slice(0, 90);

    figs.push(`<figure>${caption ? `<figcaption>${esc(caption)}</figcaption>` : ""}${clone.outerHTML}</figure>`);
  }

  return figs.length ? `<div class="figs">${figs.join("")}</div>` : "";
}

export interface RkCapturedPng { title: string; data: ArrayBuffer; width: number; height: number }

/**
 * Grafik-BEHÄLTER eines SVG bestimmen.
 *
 * Befund Dr. Sait 2026-09-12 (Word-Bericht): Die Ringdiagramme kamen als leere
 * Ringe an — ohne Zahl, ohne Beschriftung, ohne Legende. Ursache: Die Aufnahme
 * serialisierte NUR das <svg>. Bei den meisten unserer Diagramme stehen Wert,
 * Titel und Legende aber daneben im HTML (Flex-Zeile), nicht im SVG. Im Word-
 * Bericht fehlte damit genau die Information, um die es geht.
 *
 * Diese Funktion steigt vom SVG so weit nach oben, dass die zugehörige
 * Beschriftung mitkommt, ohne die halbe Seite einzufangen: höchstens bis zur
 * 2,6-fachen SVG-Höhe und 960 px Breite. Ein Vorfahr mit
 * `data-report-chart` gewinnt immer (explizite Auszeichnung).
 */
function chartHostOf(svg: SVGSVGElement): HTMLElement | null {
  try {
    const marked = svg.closest("[data-report-chart]") as HTMLElement | null;
    if (marked) return marked;
    const sr = svg.getBoundingClientRect();
    let node: HTMLElement | null = svg.parentElement;
    let best: HTMLElement | null = null;
    let hops = 0;
    while (node && hops < 4) {
      const r = node.getBoundingClientRect();
      const grows = r.width > sr.width + 8 || r.height > sr.height + 8;
      const sane = r.height <= sr.height * 2.6 + 40 && r.width <= 960 && r.width > 0;
      if (!sane) break;
      if (grows) best = node;                 // Beschriftung/Legende dazugekommen
      node = node.parentElement; hops++;
    }
    return best;
  } catch { return null; }
}

/**
 * Beschnitt im KLON lösen, damit in der Aufnahme keine halben Buchstaben landen.
 *
 * Befund Dr. Sait 2026-09-12 (Word-Bericht): „bazı isimler yarım mesela dora"
 * — die Rahmenwerk-Namen (DORA, NIS2, ISO/IEC 27001) waren waagerecht
 * halbiert. Ursache: Der Titel hat `truncate` (also `overflow:hidden` in einer
 * knappen Zeilenbox). html2canvas setzt die Grundlinie mit EIGENEN
 * Schriftmetriken, ein bis zwei Pixel tiefer als der Browser — und genau
 * diese Pixel schneidet die Box ab.
 *
 * Der Eingriff passiert nur im KLON, den html2canvas fotografiert: die Seite
 * des Nutzers bleibt unberührt. Beschnitt aus, Auslassungspunkte aus, und für
 * jede Textzeile eine Zeilenhöhe von mindestens 1,35 — so haben Unterlängen
 * (g, y, ß) wieder Platz.
 */
function relaxClippingForCapture(original: HTMLElement, cloned: HTMLElement): void {
  try {
    const orig: Element[] = [original, ...Array.from(original.querySelectorAll("*"))];
    const copy: Element[] = [cloned, ...Array.from(cloned.querySelectorAll("*"))];
    for (let i = 0; i < Math.min(orig.length, copy.length); i++) {
      const el = copy[i] as HTMLElement;
      if (!el.style) continue;
      const cs = window.getComputedStyle(orig[i]);
      // SVG-Inneres nicht anfassen — dort ist Beschnitt Teil der Darstellung.
      if (orig[i] instanceof SVGElement) continue;
      if (cs.overflow !== "visible") el.style.overflow = "visible";
      if (cs.textOverflow === "ellipsis") el.style.textOverflow = "clip";
      const fs = parseFloat(cs.fontSize) || 0;
      const lh = parseFloat(cs.lineHeight);
      if (fs > 0 && (!Number.isFinite(lh) || lh < fs * 1.35)) {
        el.style.lineHeight = `${Math.ceil(fs * 1.35)}px`;
      }
    }
  } catch { /* Aufnahme nie wegen Kosmetik abbrechen */ }
}

/**
 * Wie `rkCaptureCharts`, liefert die Diagramme aber als PNG — für Word/docx-
 * Berichte, die Inline-SVG nicht zuverlässig darstellen.
 *
 * Aufgenommen wird der Behälter samt Beschriftung und Legende (html2canvas),
 * nicht das nackte SVG. Nur wenn das fehlschlägt, greift der alte SVG-Pfad.
 * Der helle Modus wird über die GANZE asynchrone Aufnahme gehalten, damit im
 * Dunkelmodus keine dunklen Kacheln auf weißem Papier landen.
 */
export async function rkCaptureChartsPng(
  root?: HTMLElement | null,
  opts?: { max?: number; minSize?: number; scale?: number },
): Promise<RkCapturedPng[]> {
  if (typeof document === "undefined" || typeof window === "undefined") return [];
  const wantMax = opts?.max ?? 8;
  const wantMin = opts?.minSize ?? 60;
  const wantScale = opts?.scale ?? 2;

  // Behälter sammeln und entdoppeln (ein Behälter mit mehreren SVG = eine Grafik).
  const scopeRoot: ParentNode = root ?? document;
  let svgs: SVGSVGElement[] = [];
  try { svgs = Array.from(scopeRoot.querySelectorAll("svg")) as SVGSVGElement[]; } catch { svgs = []; }
  const hosts: Array<{ el: HTMLElement; title: string }> = [];
  const seen = new Set<Element>();
  for (const svg of svgs) {
    let r: DOMRect;
    try { r = svg.getBoundingClientRect(); } catch { continue; }
    if (r.width < wantMin || r.height < wantMin) continue;
    const host = chartHostOf(svg);
    if (!host || seen.has(host)) continue;
    seen.add(host);
    let title = "";
    try {
      const holder = svg.closest("[data-report-title]") as HTMLElement | null;
      title = holder?.getAttribute("data-report-title")
        || (svg.closest("section,article,div.rounded-xl,div.rounded-lg")?.querySelector("h1,h2,h3,h4")?.textContent || "").trim();
    } catch { title = ""; }
    hosts.push({ el: host, title: title.replace(/\s+/g, " ").slice(0, 90) });
    if (hosts.length >= wantMax) break;
  }

  if (hosts.length > 0) {
    const captured = await withLightThemeAsync(async () => {
      const out: RkCapturedPng[] = [];
      for (const h of hosts) {
        try {
          const cv = await html2canvas(h.el, {
            scale: wantScale, useCORS: true, backgroundColor: "#ffffff", logging: false,
            onclone: (_doc, cloned) => relaxClippingForCapture(h.el, cloned as HTMLElement),
          });
          if (cv.width < 8 || cv.height < 8) continue;
          const blob = await new Promise<Blob | null>((res) => cv.toBlob(b => res(b), "image/png"));
          if (!blob) continue;
          out.push({ title: h.title, data: await blob.arrayBuffer(), width: cv.width / wantScale, height: cv.height / wantScale });
        } catch { /* einzelne Grafik überspringen, Bericht nicht abbrechen */ }
      }
      return out;
    });
    if (captured.length > 0) return captured;
  }

  // Rückfallebene: nackte SVG-Serialisierung (besser als gar keine Grafik).
  return rkCaptureChartsPngSvgOnly(root, opts);
}

async function rkCaptureChartsPngSvgOnly(
  root?: HTMLElement | null,
  opts?: { max?: number; minSize?: number; scale?: number },
): Promise<RkCapturedPng[]> {
  if (typeof document === "undefined" || typeof window === "undefined") return [];
  const scope: ParentNode = root ?? document;
  const max = opts?.max ?? 8;
  const minSize = opts?.minSize ?? 60;
  const scale = opts?.scale ?? 2;
  const out: RkCapturedPng[] = [];
  let nodes: SVGSVGElement[] = [];
  try { nodes = Array.from(scope.querySelectorAll("svg")) as SVGSVGElement[]; } catch { return []; }

  for (const svg of nodes) {
    if (out.length >= max) break;
    let rect: DOMRect;
    try { rect = svg.getBoundingClientRect(); } catch { continue; }
    if (rect.width < minSize || rect.height < minSize) continue;
    const w = Math.round(rect.width), h = Math.round(rect.height);

    let clone: SVGSVGElement;
    try { clone = svg.cloneNode(true) as SVGSVGElement; } catch { continue; }
    // Farben in HELLER Optik einfrieren (Bericht = weißes Papier), synchron
    // innerhalb withLightTheme — der Dunkelmodus wird sofort wiederhergestellt.
    try {
      withLightTheme(() => {
        const o: Element[] = [svg, ...Array.from(svg.querySelectorAll("*"))];
        const c: Element[] = [clone, ...Array.from(clone.querySelectorAll("*"))];
        for (let i = 0; i < Math.min(o.length, c.length); i++) {
          const cs = window.getComputedStyle(o[i]); const el = c[i] as SVGElement;
          if (cs.fill && cs.fill !== "none") el.setAttribute("fill", cs.fill);
          if (cs.stroke && cs.stroke !== "none") el.setAttribute("stroke", cs.stroke);
          if (cs.strokeWidth) el.setAttribute("stroke-width", cs.strokeWidth);
          if (cs.opacity && cs.opacity !== "1") el.setAttribute("opacity", cs.opacity);
          if (cs.fontSize) el.setAttribute("font-size", cs.fontSize);
          if (cs.fontWeight && cs.fontWeight !== "400") el.setAttribute("font-weight", cs.fontWeight);
          if (cs.fontFamily) el.setAttribute("font-family", cs.fontFamily);
        }
      });
    } catch { /* optional */ }
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(w));
    clone.setAttribute("height", String(h));
    if (!clone.getAttribute("viewBox")) clone.setAttribute("viewBox", `0 0 ${w} ${h}`);
    clone.removeAttribute("style");

    let caption = "";
    try {
      const holder = svg.closest("[data-report-title]") as HTMLElement | null;
      caption = holder?.getAttribute("data-report-title")
        || (svg.closest("section,article,div.rounded-xl,div.rounded-lg")?.querySelector("h1,h2,h3,h4")?.textContent || "").trim();
    } catch { caption = ""; }
    caption = caption.replace(/\s+/g, " ").slice(0, 90);

    let xml = "";
    try { xml = new XMLSerializer().serializeToString(clone); } catch { continue; }
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);

    const buf = await new Promise<ArrayBuffer | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const cv = document.createElement("canvas");
          cv.width = Math.max(1, w * scale); cv.height = Math.max(1, h * scale);
          const ctx = cv.getContext("2d");
          if (!ctx) { resolve(null); return; }
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, cv.width, cv.height);
          ctx.drawImage(img, 0, 0, cv.width, cv.height);
          cv.toBlob((b) => {
            if (!b) { resolve(null); return; }
            b.arrayBuffer().then(resolve).catch(() => resolve(null));
          }, "image/png");
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
    if (buf) out.push({ title: caption, data: buf, width: w, height: h });
  }
  return out;
}

export interface RkExportOptions {
  title: string;
  sub?: string;
  body: string;
  file: string;
  lang?: Lang;
  /** true = sichtbare Diagramme der Seite anhängen; string = fertiges Figuren-HTML. */
  charts?: boolean | string;
  /** Überschrift für den Grafik-Abschnitt (Default: „Abbildungen"). */
  chartsTitle?: string;
}

export function rkExport(mode: "pdf" | "word", opts: RkExportOptions): void {
  const title = opts.title || "Bericht";
  const sub = opts.sub || "";
  const body = opts.body || "";
  const lang: Lang = opts.lang || "de";
  const file = (opts.file || "Report").replace(/[^a-zA-Z0-9_-]+/g, "_");

  // Bildschirm-Diagramme JETZT einsammeln (Seite ist noch gerendert), bevor das
  // Druckfenster geöffnet wird. Nur für PDF/Druck — Word importiert Inline-SVG
  // unzuverlässig und würde den Bericht eher beschädigen als bereichern.
  const figs = opts.charts === true
    ? rkCaptureCharts()
    : (typeof opts.charts === "string" ? opts.charts : "");
  const bodyWithFigs = figs
    ? `${body}<h2>${opts.chartsTitle || t(lang, "Abbildungen", "Figures")}</h2>${figs}`
    : body;

  if (mode === "word") {
    const html = wordShell(title, sub, body, lang);
    download("\uFEFF" + html, file + ".doc", "application/msword");
    return;
  }

  // PDF: print-ready HTML als Blob-URL öffnen (echte URL + <title> statt
  // „about:blank" in Kopf-/Fußzeile des Druckdialogs). KEIN Auto-Druck:
  // Produktregel „erst Vorschau, dann PDF" — der Nutzer prüft den Bericht im
  // Tab und klickt selbst „Als PDF speichern / Drucken" in der Toolbar.
  const printable = pdfShell(title, sub, bodyWithFigs, lang);
  let w: Window | null = null;
  let url: string | null = null;
  try {
    url = URL.createObjectURL(new Blob([printable], { type: "text/html" }));
    w = window.open(url, "_blank");
  } catch { w = null; }
  if (w) {
    if (url) setTimeout(() => URL.revokeObjectURL(url as string), 60000);
    return;
  }
  if (url) URL.revokeObjectURL(url);
  // Fallback when popup is blocked
  download(printable, file + ".html", "text/html");
}

export const RK = {
  theme,
  hexScore,
  section: rkSection,
  lead: rkLead,
  table: rkTable,
  bar: rkBar,
  kpiRow: rkKpiRow,
  scoreBox: rkScoreBox,
  pill: rkPill,
  glossary: rkGlossary,
  export: rkExport,
};
