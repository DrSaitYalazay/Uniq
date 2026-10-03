/**
 * reportPaginate — gemeinsame Seitenumbruch-Logik für html2canvas → jsPDF.
 *
 * Problem: Langer Inhalt in fester Pixelhöhe zu zerschneiden trennt Karten,
 * Textzeilen und Tabellenzeilen mitten durch — am Seitenende ein halber Satz,
 * auf der nächsten Seite die andere Hälfte.
 *
 * Lösung in drei Stufen (die Canvas-Entsprechung von `break-inside: avoid`):
 *   1. Passt der Block in den Seitenrest, kommt er GANZ dorthin.
 *   2. Passt er auf eine ganze Seite, kommt er GANZ auf die nächste.
 *   3. Ist er länger als eine Seite, wird an einer ERLAUBTEN Kante geschnitten.
 *
 * Stufe 3 war die Fehlerquelle (Befund Dr. Sait 2026-09-12: „sayfa altlarında
 * kayıplar hâlâ devam ediyor"). Vorher wurde eine nahezu WEISSE Bildzeile
 * gesucht. In einer dichten Tabelle mit getönten Wechselzeilen und Rahmen gibt
 * es keine weiße Zeile — die Suche schlug fehl und es wurde doch blind
 * geschnitten, mitten durch eine Tabellenzeile.
 *
 * Jetzt liefert der Aufrufer die ECHTEN Blockkanten aus dem DOM
 * (`domCutEdges()`): Unterkante jeder Tabellenzeile, jeder Karte, jedes
 * Absatzes. Geschnitten wird nur dort. Ohne Kanten greifen die alten
 * Heuristiken — zuerst eine einfarbige Zeile (erkennt auch getönte Lücken und
 * Rahmenlinien), dann eine weiße Zeile.
 */
import type { jsPDF } from "jspdf";

interface PageGeom {
  pageW: number;   // mm
  pageH: number;   // mm
  margin: number;  // mm
  gap?: number;    // mm, Abstand zwischen Blöcken
}

/** Zeile (y) ist nahezu vollständig weiß/transparent → Blockzwischenraum. */
function isBlankRow(data: Uint8ClampedArray, width: number, y: number, step = 10): boolean {
  const base = y * width * 4;
  for (let x = 0; x < width; x += step) {
    const i = base + x * 4;
    const a = data[i + 3];
    if (a > 12 && (data[i] < 244 || data[i + 1] < 244 || data[i + 2] < 244)) return false;
  }
  return true;
}

/**
 * Zeile (y) ist über die ganze Breite EINFARBIG (±6 pro Kanal).
 *
 * Das trifft auch die getönten Lücken zwischen Tabellenzeilen und die
 * Trennlinien — genau die Stellen, an denen ein Schnitt nichts zerstört. Eine
 * Zeile MIT Text ist nie einfarbig, weil Glyphen dunkle Pixel setzen.
 */
function isUniformRow(data: Uint8ClampedArray, width: number, y: number, step = 6): boolean {
  const base = y * width * 4;
  let r0 = -1, g0 = -1, b0 = -1;
  for (let x = 0; x < width; x += step) {
    const i = base + x * 4;
    if (data[i + 3] < 12) continue;                       // transparent → zählt als gleich
    if (r0 < 0) { r0 = data[i]; g0 = data[i + 1]; b0 = data[i + 2]; continue; }
    if (Math.abs(data[i] - r0) > 6 || Math.abs(data[i + 1] - g0) > 6 || Math.abs(data[i + 2] - b0) > 6) return false;
  }
  return true;
}

/**
 * Erlaubte Schnittkanten eines Abschnitts in CANVAS-Pixeln.
 *
 * Genommen wird die Unterkante jedes atomaren Blocks: Tabellenzeile, Karte,
 * Absatz, Listenpunkt, Überschrift, Bild. Der Faktor `pxPerCssPx` rechnet
 * CSS-Pixel des DOM in Canvas-Pixel um (html2canvas-Skalierung).
 */
export function domCutEdges(section: HTMLElement, canvasHeight: number): number[] {
  if (typeof window === "undefined") return [];
  const h = section.offsetHeight || section.getBoundingClientRect().height;
  if (!h || !canvasHeight) return [];
  const pxPerCssPx = canvasHeight / h;
  const top = section.getBoundingClientRect().top;
  const sel = "tr, li, p, h1, h2, h3, h4, h5, figure, img, svg, .rt-card, .rt-kpi, .rt-gap-card, .rt-finding-card, [data-block]";
  const edges = new Set<number>();
  let nodes: Element[] = [];
  try { nodes = Array.from(section.querySelectorAll(sel)); } catch { return []; }
  for (const n of nodes) {
    let r: DOMRect;
    try { r = n.getBoundingClientRect(); } catch { continue; }
    if (r.height <= 0) continue;
    const bottom = Math.round((r.bottom - top) * pxPerCssPx);
    if (bottom > 4 && bottom < canvasHeight - 2) edges.add(bottom);
  }
  edges.add(canvasHeight);
  return Array.from(edges).sort((a, b) => a - b);
}

/**
 * Schnitthöhe für den nächsten Streifen.
 *
 * Reihenfolge: echte DOM-Kante → einfarbige Zeile → weiße Zeile → harter
 * Schnitt. `minCut` verhindert, dass eine Seite zu leer bleibt; findet sich
 * darüber keine Kante, wird bis 25 % heruntergegangen, bevor hart geschnitten
 * wird — eine halb gefüllte Seite ist besser als ein zerschnittener Satz.
 */
function bestCut(
  data: Uint8ClampedArray | null,
  width: number,
  startPx: number,
  targetPx: number,
  canvasH: number,
  edges?: number[] | null,
): number {
  const maxCut = Math.min(targetPx, canvasH - startPx);
  if (maxCut >= canvasH - startPx) return maxCut;        // letzter Streifen

  if (edges && edges.length > 0) {
    const lowest = Math.max(Math.floor(maxCut * 0.25), 1);
    let bestEdge = -1;
    for (const e of edges) {
      const cut = e - startPx;
      if (cut > maxCut) break;
      if (cut >= lowest) bestEdge = cut;
    }
    if (bestEdge > 0) return bestEdge;
  }

  if (data) {
    const minCut = Math.max(Math.floor(maxCut * 0.55), 1);
    for (let cut = maxCut; cut >= minCut; cut--) {
      if (isUniformRow(data, width, startPx + cut - 1)) return cut;
    }
    for (let cut = maxCut; cut >= minCut; cut--) {
      if (isBlankRow(data, width, startPx + cut - 1)) return cut;
    }
  }
  return maxCut;
}

/**
 * Fügt einen html2canvas-Canvas seitenübergreifend OHNE Schnittverluste ein.
 * @param edges  erlaubte Schnittkanten in Canvas-Pixeln (siehe `domCutEdges`).
 * @returns neues currentY (mm) nach dem Einfügen.
 */
export function addCanvasPaged(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  geom: PageGeom,
  startY: number,
  jpegQuality = 0.85,
  edges?: number[] | null,
): number {
  const gap = geom.gap ?? 4;
  const imgW = geom.pageW - geom.margin * 2;
  const contentH = geom.pageH - geom.margin * 2;
  const fullH = (canvas.height * imgW) / canvas.width;

  // 1) Passt vollständig in den Rest der Seite.
  if (startY + fullH <= geom.pageH - geom.margin) {
    pdf.addImage(canvas.toDataURL("image/jpeg", jpegQuality), "JPEG", geom.margin, startY, imgW, fullH, undefined, "FAST");
    return startY + fullH + gap;
  }
  // 2) Passt vollständig auf eine Seite → ganz auf die nächste.
  if (fullH <= contentH) {
    pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/jpeg", jpegQuality), "JPEG", geom.margin, geom.margin, imgW, fullH, undefined, "FAST");
    return geom.margin + fullH + gap;
  }
  // 3) Länger als eine Seite → an erlaubten Kanten schneiden.
  if (startY > geom.margin) { pdf.addPage(); }
  const pxPerMm = canvas.width / imgW;
  const pageSlicePx = Math.max(1, Math.floor(contentH * pxPerMm));
  let data: Uint8ClampedArray | null = null;
  try {
    const cx = canvas.getContext("2d");
    if (cx) data = cx.getImageData(0, 0, canvas.width, canvas.height).data;
  } catch { data = null; }   // CORS-getrübter Canvas → nur DOM-Kanten/harter Schnitt
  let startPx = 0;
  let lastH = 0;
  let first = true;
  while (startPx < canvas.height) {
    if (!first) pdf.addPage();
    first = false;
    const slicePx = bestCut(data, canvas.width, startPx, pageSlicePx, canvas.height, edges);
    const sc = document.createElement("canvas");
    sc.width = canvas.width; sc.height = slicePx;
    const cx2 = sc.getContext("2d");
    if (cx2) {
      cx2.fillStyle = "#ffffff";
      cx2.fillRect(0, 0, sc.width, sc.height);
      cx2.drawImage(canvas, 0, startPx, canvas.width, slicePx, 0, 0, canvas.width, slicePx);
    }
    lastH = (slicePx * imgW) / canvas.width;
    pdf.addImage(sc.toDataURL("image/jpeg", jpegQuality), "JPEG", geom.margin, geom.margin, imgW, lastH, undefined, "FAST");
    startPx += slicePx;
  }
  return geom.margin + lastH + gap;
}
