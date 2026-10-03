import { RT, RT_TYPE, RT_FONT } from "./reportTheme";
import { getCompanyBrand } from "./companyBrand";
import { getReportBrandName } from "./reportBrand";
import { brandLogoDataUrl } from "@/lib/companyBrand";
import { currentAccentHexPair } from "@/lib/accentTheme";

// Page geometry is controlled exclusively via @page margins so the on-screen
// preview width matches the printable area. The .rt-report wrapper no longer
// declares a fixed pixel width or extra padding — that previously caused
// horizontal overflow (text clipping) and phantom blank pages because the
// wrapper was wider than the printable area defined by @page.
const PAGE_MARGIN_V_MM = 14;
const PAGE_MARGIN_H_MM = 12;


export const esc = (v: string | undefined | null) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const reportGlobalCss = `
  <style>
    /* Seitengeometrie. HINWEIS: CSS-Randboxen (@bottom-left/@bottom-right mit
       counter(page)) funktionieren in Chrome NICHT — laufende Seitenzahlen
       liefert dort der Druckdialog. Deshalb trägt jeder Bericht am Dokumentende
       einen Footer mit Mandant + Datum (rtDocFooter), und die Seitenzahl kommt
       aus dem Druckdialog. Kein Vortäuschen von etwas, das der Browser nicht
       kann. */
    @page { size: A4; margin: ${PAGE_MARGIN_V_MM}mm ${PAGE_MARGIN_H_MM}mm; }
    * { box-sizing: border-box; }

    /* ══════════════════════════════════════════════════════════════════════
       DRUCKQUALITÄT — gilt für JEDEN Bericht, der dieses Layout einbindet.
       Dr. Sait: „çerçeveler kesilmemeli, sayfa altlarında kayıp olmamalı,
       sayfa kenarına taşma olmamalı — premium çıktı."

       WICHTIG (Korrektur 2026-09-12, zweiter Durchgang):
       break-inside:avoid darf NUR auf KLEINE Einheiten (Zeile, Karte, Bild).
       Auf lange Elemente — Tabellen, Abschnitte — wirkt es in Chrome genau
       umgekehrt: der Block wird auf eine neue Seite geschoben und dort am
       Seitenende ABGESCHNITTEN, weil er nicht passt. Genau das erzeugte die
       Verluste am Seitenende. Lange Container bekommen deshalb explizit
       break-inside:auto.
       ══════════════════════════════════════════════════════════════════════ */

    /* 1) KLEINE Einheiten bleiben zusammen — nie mitten durchgeschnitten. */
    tr, li, figure, img, svg, canvas, blockquote,
    .rt-kpi, .rt-card, .rt-box, .rt-gap-card, .rt-finding-card,
    [class*="kpi"], [class*="tile"], [class*="chip"] {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    /* 2) LANGE Container dürfen umbrechen (sonst Abschnitt am Seitenende weg). */
    table, tbody, thead, .rt-report, .rt-section, .sheet, section, article,
    [class*="card"]:not(.rt-card), div {
      break-inside: auto;
      page-break-inside: auto;
    }

    /* 3) Überschrift bleibt bei ihrem Inhalt. */
    h1, h2, h3, h4, .rt-h, [class*="heading"] {
      break-after: avoid; page-break-after: avoid;
      break-inside: avoid; page-break-inside: avoid;
    }

    /* 4) Keine Einzelzeilen am Seitenrand. */
    p, li, td, th { orphans: 3; widows: 3; }

    /* 5) Tabellen: Satzspiegelbreite, Kopfzeile wiederholt sich, Werte brechen.
          KEIN table-layout: fixed global! Es hat die Beschriftungsspalte des
          Balkendiagramms plattgedrückt, weil in derselben Zeile eine Zelle
          width:100% deklariert; mit overflow-wrap:anywhere wurde daraus ein
          Buchstabe pro Zeile („I S O 2 7 0 0 1", Befund Dr. Sait 2026-09-12).
          Gegen Überlauf genügt max-width + Umbruch in den Zellen; wer feste
          Spalten braucht, deklariert sie mit <colgroup> selbst.
          Auch word-break: break-word ist raus: es trennt mitten im Wort, ohne
          Trennstrich. hyphens: auto trennt regelkonform, anywhere greift nur
          für Zeichenketten ohne Trennstelle (IDs, URLs). */
    table { width: 100% !important; max-width: 100% !important; border-collapse: collapse; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    th, td { overflow-wrap: break-word; hyphens: auto; vertical-align: top; }

    /* 6) Kein Überlauf über den Seitenrand. */
    div, section, article, table, pre, code, img, svg, canvas { max-width: 100% !important; }
    img, svg, canvas { height: auto; }
    pre, code { white-space: pre-wrap; overflow-wrap: anywhere; }
    /* overflow-wrap: anywhere wirkt auf die MINDESTBREITE einer Zelle: eine
       Spalte darf dann auf einen Buchstaben zusammenfallen. Genau das erzeugte
       die senkrecht gestapelten Beschriftungen. break-word bricht nur, wenn es
       anders nicht passt, und lässt die Mindestbreite beim längsten Wort. */
    body, p, td, th, li, span, div { overflow-wrap: break-word; }

    @media print {
      /* a) Farben mitdrucken, sonst sind Status-Chips im PDF weiß. */
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

      /* b) VERLUST-URSACHE NR. 1: ein Container mit overflow: hidden
            schneidet alles ab, was über die Seitengrenze ragt. Für
            seitenübergreifende Container deshalb aufheben — kleine Elemente
            mit fester Höhe (Fortschrittsbalken) bleiben unberührt. */
      .sheet, .rt-report, .rt-section, section, article, table, tbody, tr, td, th, li {
        overflow: visible !important;
        max-height: none !important;
      }

      /* c) VERLUST-URSACHE NR. 2: sticky/fixed Elemente legen sich über den
            Inhalt bzw. erscheinen auf jeder Seite. Im Druck statisch. */
      .toolbar, .__rk_toolbar, [style*="position:sticky"], [style*="position: sticky"] {
        display: none !important;
      }

      /* d) VERLUST-URSACHE NR. 3: der letzte Absatz lag unter dem fixierten
            Fußzeilenband. Unten Platz reservieren. */
      .rt-report, .sheet { padding-bottom: 12mm !important; }

      /* e) Flex-Spalten umbrechen statt quetschen. */
      [style*="display:flex"], [style*="display: flex"] { flex-wrap: wrap; }

      /* f) Leere Blöcke erzeugen sonst Geisterseiten. */
      div:empty:not([style*="height"]):not([style*="background"]) { display: none !important; }
    }

    body { font-family: ${RT_FONT.html}; color: ${RT.ink}; font-size: ${RT_TYPE.html.body}; line-height: 1.58; margin: 0; -webkit-font-smoothing: antialiased; }
    h1, h2, h3, h4 { font-family: ${RT_FONT.html}; color: ${RT.navy}; margin: 0; word-wrap: break-word; }
    h1 { font-size: ${RT_TYPE.html.h1}; }
    h2 { font-size: ${RT_TYPE.html.h2}; margin-top: 26px; padding-bottom: 6px; position: relative; }
    h2::after { content: ""; display: block; position: absolute; bottom: 0; left: 0; width: 36px; height: 2px; background: ${RT.copper}; }
    h2::before { content: ""; display: block; position: absolute; bottom: 0; left: 38px; right: 0; height: 1px; background: ${RT.border}; }
    h3 { font-size: ${RT_TYPE.html.h3}; color: ${RT.inkSoft}; margin-top: 18px; }
    p { margin: 6px 0; color: ${RT.body}; word-wrap: break-word; overflow-wrap: anywhere; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: ${RT_TYPE.html.small}; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    th { background: ${RT.navy}; color: ${RT.white}; text-align: left; padding: 9px 10px; font-weight: 700; font-size: 10px; line-height: 1.45; vertical-align: middle; white-space: normal; overflow-wrap: anywhere; }
    td { border-bottom: 1px solid ${RT.border}; padding: 10px 10px 11px; vertical-align: top; line-height: 1.55; word-wrap: break-word; overflow-wrap: anywhere; hyphens: none; white-space: normal; overflow: visible; }
    td *, th * { max-width: 100%; white-space: normal; overflow-wrap: anywhere; }
    tr:nth-child(even) td { background: ${RT.surfaceAlt}; }
    .rt-card { border: 1px solid ${RT.border}; border-radius: 10px; padding: 14px; background: ${RT.surface}; }
    .rt-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0; }
    /* overflow: visible - eine dreizeilige Beschriftung wurde vorher am
       Kartenrand abgeschnitten; min-height laesst die Karte wachsen. */
    .rt-kpi { border: 1px solid ${RT.border}; border-radius: 8px; padding: 14px 12px 12px; background: ${RT.white}; position: relative; overflow: visible; min-height: 72px; }
    .rt-kpi::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: ${RT.navy}; }
    .rt-kpi.accent::before { background: ${RT.copper}; }
    .rt-kpi.crit::before { background: ${RT.critical}; }
    /* word-break: break-all trennte Kennzahlen MITTEN IN DER ZAHL
       (aus 15.4 wurde 15. + 4). Eine Zahl wird nie getrennt;
       tabular-nums haelt die Ziffernbreite konstant. */
    .rt-kpi-val { font-size: 22px; font-weight: 700; color: ${RT.navy}; display: block; line-height: 1.15; white-space: nowrap; word-break: normal; overflow-wrap: normal; font-variant-numeric: tabular-nums; }
    .rt-kpi-lbl { display: block; margin-top: 4px; font-size: 9.5px; color: ${RT.muted}; text-transform: uppercase; letter-spacing: 0.4px; line-height: 1.35; }
    .rt-badge { display: inline-block; padding: 3px 9px; border-radius: 10px; font-size: 10px; font-weight: 700; letter-spacing: 0.2px; line-height: 1.35; white-space: normal; }
    .rt-badge.critical { background: ${RT.criticalBg}; color: ${RT.critical}; }
    .rt-badge.high { background: ${RT.highBg}; color: ${RT.high}; }
    .rt-badge.medium { background: ${RT.mediumBg}; color: ${RT.medium}; }
    .rt-badge.low { background: ${RT.lowBg}; color: ${RT.low}; }
    .rt-note { background: ${RT.warningBg}; border-left: 3px solid ${RT.copper}; border-radius: 0 6px 6px 0; padding: 12px 14px; margin: 12px 0; }
    .rt-note strong { color: ${RT.warning}; font-size: 11px; }
    .rt-note p { color: ${RT.warning}; font-size: 11px; margin: 4px 0 0; }
    .rt-callout { border-left: 3px solid ${RT.navy}; background: ${RT.surface}; padding: 10px 14px; margin: 8px 0; border-radius: 0 6px 6px 0; }
    .rt-capability-group { margin: 16px 0 20px; }
    .rt-gap-card, .rt-finding-card { break-inside: avoid; page-break-inside: avoid; border: 1px solid ${RT.border}; border-radius: 8px; background: ${RT.white}; padding: 13px 14px; margin: 9px 0; box-shadow: 0 2px 8px rgba(26,46,65,0.04); overflow: visible; }
    .rt-gap-head, .rt-finding-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
    .rt-gap-title, .rt-finding-title { color: ${RT.ink}; font-size: 12.5px; line-height: 1.42; font-weight: 700; overflow-wrap: anywhere; }
    .rt-gap-body, .rt-finding-body { color: ${RT.body}; font-size: 10.8px; line-height: 1.6; margin: 5px 0 0; overflow-wrap: anywhere; }
    .rt-meta-row { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; margin: 7px 0; }
    .rt-meta-pill { display: inline-block; border: 1px solid ${RT.border}; background: ${RT.surfaceAlt}; color: ${RT.body}; border-radius: 999px; padding: 2px 8px; font-size: 9.5px; line-height: 1.5; font-weight: 600; white-space: normal; }
    .rt-mono-pill { font-family: 'Courier New', monospace; color: ${RT.navy}; background: ${RT.infoBg}; border-color: ${RT.infoBg}; }
    .rt-pagebreak { height: 0; margin-top: 18px; }
    .rt-section { margin: 0 0 18px; }
    h2, h3 { break-after: avoid; page-break-after: avoid; }
    .rt-section > h2:first-child, .rt-section > h3:first-child { margin-top: 0; }
    .rt-report { width: 100%; max-width: 100%; padding: 0; background: #ffffff; box-sizing: border-box; }
    .rt-cover { background: linear-gradient(135deg, ${RT.navyDeep}, ${RT.navyLight}); color: ${RT.white}; padding: 36px 32px; border-bottom: 4px solid ${RT.copper}; margin: 0 0 24px; border-radius: 10px; position: relative; }
    .rt-cover h1 { color: ${RT.white}; font-size: 28px; margin-bottom: 4px; }
    .rt-cover .rt-cover-sub { color: rgba(255,255,255,0.85); font-size: 14px; margin: 6px 0 16px; }
    .rt-cover .rt-cover-meta { display: flex; gap: 22px; font-size: 11px; color: rgba(255,255,255,0.75); flex-wrap: wrap; }
    .rt-cover .rt-cover-badge { display: inline-block; background: ${RT.copper}; color: ${RT.white}; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 10px; }
  </style>
`;

export function buildCoverHtml(opts: {
  badge: string;
  title: string;
  subtitle: string;
  companyName: string;
  authorName: string;
  authorLabel?: string;
  dateStr: string;
}): string {
  const brand = getCompanyBrand();
  // Prefer the tenant's saved company name; fall back to the report brand
  // (UniqSuite) so the cover ALWAYS shows a company/brand name.
  const companyName =
    opts.companyName?.trim() || brand.companyName?.trim() || getReportBrandName("de");
  // Logo is rendered ONLY on the cover, inside a white padded box so any
  // logo (transparent PNG, white JPG, colored SVG raster) sits on a clean
  // white surface and no header/footer logo can break subsequent pages.
  const coverLogo = brandLogoDataUrl(brand, currentAccentHexPair().accent, currentAccentHexPair().accent2); // Upload oder Anfangsbuchstabe
  const logoBox = coverLogo
    ? `<div style="position:absolute;top:20px;right:24px;background:#fff;padding:8px;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.12);width:72px;height:72px;display:flex;align-items:center;justify-content:center;">
         <img src="${esc(coverLogo)}" alt="${esc(companyName)}" style="max-width:100%;max-height:100%;object-fit:contain;display:block;" />
       </div>`
    : "";
  return `
    <div class="rt-cover">
      ${logoBox}
      <span class="rt-cover-badge">${esc(opts.badge)}</span>
      <h1>${esc(opts.title)}</h1>
      <p class="rt-cover-sub">${esc(opts.subtitle)}</p>
      <div class="rt-cover-meta">
        <span><strong>${esc(companyName)}</strong></span>
        ${opts.authorName ? `<span>${esc(opts.authorLabel || "Erstellt von")}: ${esc(opts.authorName)}</span>` : ""}
        <span>${esc(opts.dateStr)}</span>
      </div>
    </div>
  `;

}

export function buildKpiGrid(items: { label: string; value: string | number; variant?: "accent" | "crit" }[]): string {
  return `<div class="rt-kpi-grid">${items.map(i =>
    `<div class="rt-kpi${i.variant ? " " + i.variant : ""}">
      <span class="rt-kpi-val">${esc(String(i.value))}</span>
      <span class="rt-kpi-lbl">${esc(i.label)}</span>
    </div>`
  ).join("")}</div>`;
}

/**
 * Legende & Begriffe (RT-Stil) — erklärt ALLE Kürzel/Kennzahlen eines Berichts in
 * Management-Klartext. Dr. Sait: keine nackten Abkürzungen; jedes Kürzel wird
 * erklärt. Deckungsgleich mit der Dashboard-GlossaryCard und rkGlossary. Als
 * letzte Sektion in jeden management-orientierten RT-Bericht einfügen.
 */
export function rtGlossary(lang: "de" | "en"): string {
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
  return `
    <section class="rt-section">
      <h2>${de ? "Legende & Begriffe" : "Legend & glossary"}</h2>
      <p style="margin:0 0 8px">${de
        ? "Erklärung aller Kürzel und Kennzahlen dieses Berichts — damit jede Grafik auch ohne Fachhintergrund lesbar ist."
        : "Explanation of every abbreviation and metric in this report — so every chart is readable without a technical background."}</p>
      <table>
        <thead><tr><th style="width:220px">${de ? "Begriff" : "Term"}</th><th>${de ? "Bedeutung" : "Meaning"}</th></tr></thead>
        <tbody>${rows.map(([t, d]) => `<tr><td><strong>${esc(t)}</strong></td><td>${esc(d)}</td></tr>`).join("")}</tbody>
      </table>
    </section>`;
}

export function wrapHtmlDoc(opts: { title: string; lang: "de" | "en"; body: string }): string {
  return `<!doctype html><html lang="${opts.lang}"><head>
    <meta charset="utf-8">
    <title>${esc(opts.title)}</title>
    ${reportGlobalCss}
  </head><body>${opts.body}</body></html>`;
}

// Old html2canvas/jsPDF pagination helpers were removed when we switched to
// the native browser print dialog. The browser handles page breaks via the
// `page-break-inside: avoid` rules already declared in reportGlobalCss.



/* ─── ReportKit-style print-to-PDF + mso-Word export ─────────────────────
 *
 * Previous implementation used jsPDF + html2canvas to rasterize HTML into a
 * PDF. That was slow (O(N) per page), produced large files, and broke text
 * selectability. The new flow opens a print-ready HTML document in a new
 * tab and lets the browser handle PDF rendering via "Save as PDF" in the
 * print dialog — sharper output, native text, faster, no dependencies.
 *
 * The existing report bodies (cover + sections built with reportGlobalCss)
 * are preserved exactly; we just wrap them with a sticky toolbar and inject
 * print CSS for proper page breaks.
 */

const TOOLBAR_CSS = `
  .__rk_toolbar{position:sticky;top:0;z-index:9999;background:#fff;border-bottom:1px solid ${RT.border};padding:12px 24px;text-align:right;display:flex;justify-content:flex-end;gap:8px;align-items:center;font-family:${RT_FONT.html}}
  .__rk_toolbar .__rk_brand{margin-right:auto;display:flex;align-items:center;gap:10px;color:${RT.navy};font-weight:700;font-size:14px}
  .__rk_toolbar .__rk_brand .__rk_badge{background:${RT.copper};color:#fff;font-weight:800;font-size:11px;letter-spacing:.5px;padding:5px 9px;border-radius:6px}
  .__rk_toolbar button{border:none;border-radius:9px;padding:9px 16px;font-weight:600;font-size:13px;cursor:pointer;font-family:inherit}
  .__rk_toolbar button.__rk_p{background:${RT.copper};color:#fff}
  .__rk_toolbar button.__rk_g{background:${RT.surface};color:${RT.body};border:1px solid ${RT.border}}
  @page{size:A4;margin:14mm 12mm}
  @media print{.__rk_toolbar{display:none !important}}
`;

function buildPrintableDocument(htmlDoc: string, lang: "de" | "en"): string {
  const closeLabel = lang === "en" ? "Close" : "Schlie\u00DFen";
  const printLabel = lang === "en" ? "Save as PDF / Print" : "Als PDF speichern / Drucken";
  const brand = getCompanyBrand();
  const brandName = brand.companyName?.trim() || getReportBrandName(lang);
  const initials = brandName
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "").join("") || "•";
  const brandLogo = brand.logoDataUrl
    ? `<img src="${esc(brand.logoDataUrl)}" alt="" style="height:22px;width:22px;object-fit:contain;border-radius:4px;background:#fff;padding:2px;border:1px solid ${RT.border}"/>`
    : `<span class="__rk_badge">${esc(initials)}</span>`;
  const toolbar =
    `<div class="__rk_toolbar">` +
      `<div class="__rk_brand">${brandLogo}<span>${esc(brandName)}</span></div>` +
      `<button class="__rk_g" onclick="window.close()">${closeLabel}</button>` +
      `<button class="__rk_p" onclick="window.print()">${printLabel}</button>` +
    `</div>`;

  // KEIN Auto-Druck (Produktregel „erst Vorschau, dann PDF"): der geöffnete Tab
  // ist die Vorschau; Drucken/PDF löst der Nutzer über die Toolbar aus.
  const styleInjection = `<style>${TOOLBAR_CSS}</style>`;

  // Inject styles + toolbar into the existing htmlDoc without altering its body content.
  let out = htmlDoc;
  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `${styleInjection}</head>`);
  } else {
    out = `<style>${TOOLBAR_CSS}</style>` + out;
  }
  if (/<body[^>]*>/i.test(out)) {
    out = out.replace(/<body([^>]*)>/i, `<body$1>${toolbar}`);
  } else {
    out = toolbar + out;
  }
  return out;
}

function detectLang(htmlDoc: string): "de" | "en" {
  const m = htmlDoc.match(/<html[^>]*lang=["']([a-z-]+)["']/i);
  if (m && /^en/i.test(m[1])) return "en";
  return "de";
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function renderHtmlToPdf(htmlDoc: string, fileName: string): Promise<void> {
  const lang = detectLang(htmlDoc);
  const printable = buildPrintableDocument(htmlDoc, lang);
  // Blob-URL statt window.open("")+document.write → echte URL + <title> im
  // Druckdialog (kein „about:blank" in Kopf-/Fußzeile).
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
  // Popup blocked → fall back to .html download. User opens it and prints.
  downloadBlob(printable, fileName.replace(/\.pdf$/i, "") + ".html", "text/html");
}

/**
 * Render the same HTML body as an mso-compatible .doc download.
 * The htmlDoc must follow the conventions of `wrapHtmlDoc` / `reportGlobalCss`.
 * Word renders inline CSS reliably; gradients/shadows are flattened by Word
 * but the navy/copper palette comes through cleanly.
 */
export async function renderHtmlToWord(htmlDoc: string, fileName: string): Promise<void> {
  const mso =
    `<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->`;
  const pageCss = `<style>@page{size:21cm 29.7cm;margin:1.6cm 1.8cm}body{margin:0}</style>`;
  let out = htmlDoc;
  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `${mso}${pageCss}</head>`);
  } else {
    out = `<head>${mso}${pageCss}</head>` + out;
  }
  // Word picks up the xmlns declarations from <html>; add them if absent.
  if (/<html[^>]*>/i.test(out) && !/xmlns:o=/.test(out)) {
    out = out.replace(/<html([^>]*)>/i, `<html$1 xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">`);
  }
  const filename = fileName.replace(/\.(pdf|docx?)$/i, "") + ".doc";
  downloadBlob("\uFEFF" + out, filename, "application/msword");
}

/**
 * Dokument-Footer für HTML-/Druck-Berichte: Mandant · Datum · optionaler
 * Vertraulichkeitsstempel. Vorher hatten Scope- und Inventar-Bericht keinen
 * Footer; im Audit muss jedes Blatt zuordenbar sein (User Story G5).
 */
export function rtDocFooter(companyName: string, lang: "de" | "en", stamp?: string): string {
  const de = lang === "de";
  const dateStr = new Date().toLocaleDateString(de ? "de-DE" : "en-GB",
    { day: "2-digit", month: "2-digit", year: "numeric" });
  const esc = (x: string) => String(x ?? "").replace(/[&<>"]/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
  return `
    <div style="margin-top:28px;border-top:1px solid ${RT.border};padding-top:10px;font-size:11px;color:${RT.muted};display:flex;justify-content:space-between;gap:12px;">
      <span>${esc(companyName)} · ${esc(dateStr)}</span>
      <span>${de ? "Seitenzahlen: über den Druckdialog" : "Page numbers: via the print dialog"}${stamp ? " · " + esc(stamp) : ""}</span>
    </div>`;
}
