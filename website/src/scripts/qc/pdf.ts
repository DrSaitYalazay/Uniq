/**
 * PDF-Bericht des Quick-Checks – vollständig im Browser erzeugt (pdf-lib), A4 hoch,
 * im Stil des White Papers: helle Seiten, Navy/Grün, selektierbarer Text, Vektor-Diagramm.
 */
import { PDFDocument, rgb, LineCapStyle, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import qrcode from 'qrcode-generator';
import { scoreOf, bandOf } from './qc';

const hex = (h: string): RGB => { const n = parseInt(h.slice(1), 16); return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };
const C = {
  navy: hex('#0E1A33'), navy2: hex('#13214A'), green: hex('#2BB673'), greenD: hex('#1F9D63'),
  text: hex('#1B2433'), muted: hex('#5B6780'), line: hex('#DCE3EE'), pale: hex('#F4F7FB'), white: rgb(1, 1, 1),
  red: hex('#E5484D'), amber: hex('#F5A524'),
};
const FWC: Record<string, RGB> = { nis2: hex('#2BB673'), iso27001: hex('#3B82F6'), aiact: hex('#8B5CF6'), iso42001: hex('#22D3EE'), cra: hex('#F5A524') };
const BANDC = { red: C.red, amber: C.amber, green: C.green };

const A4 = { w: 595.28, h: 841.89 };
const M = 48; // Rand

async function bytes(url: string) { const r = await fetch(url); if (!r.ok) throw new Error(url); return new Uint8Array(await r.arrayBuffer()); }

function wrap(text: string, font: PDFFont, size: number, max: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(t, size) <= max) line = t;
    else { if (line) lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines;
}

export async function makePdf(opts: { D: any; results: Map<string, any[]>; company: string; snapshot: string | null }) {
  const { D, results, company } = opts;
  const lang: 'de' | 'en' = D.lang;
  const T = D.pdf;
  const Q = D.qc;
  const fws: any[] = D.data.frameworks.filter((f: any) => results.has(f.id));

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const [fR, fB, fX, cover] = await Promise.all([
    bytes('/fonts/pdf/Inter-Regular.ttf'), bytes('/fonts/pdf/Inter-Bold.ttf'), bytes('/fonts/pdf/InterDisplay-ExtraBold.ttf'), bytes('/img/pdf/report-cover.jpg'),
  ]);
  const R = await doc.embedFont(fR, { subset: true });
  const B = await doc.embedFont(fB, { subset: true });
  const X = await doc.embedFont(fX, { subset: true });
  const coverImg = await doc.embedJpg(cover);

  const date = new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { day: '2-digit', month: lang === 'de' ? '2-digit' : 'long', year: 'numeric' });
  doc.setTitle(`UniqSuite – ${T.title}`);
  doc.setAuthor('UniqSuite');
  doc.setSubject(T.subtitle);
  doc.setLanguage(lang === 'de' ? 'de-DE' : 'en-GB');
  doc.setCreator('uniqsuite.cyberwerk.online');
  doc.setProducer('UniqSuite Quick-Check (pdf-lib, lokal im Browser)');

  const scores: Record<string, number> = Object.fromEntries(fws.map((f) => [f.id, scoreOf(f, results.get(f.id)!)]));
  const overall = fws.length ? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / fws.length) : 0;

  const pages: PDFPage[] = [];
  const logo = (p: PDFPage, x: number, y: number, s: number, onDark: boolean) => {
    // „U“-App-Icon als Vektor
    const k = s / 40;
    p.drawSvgPath('M13 3 H27 A10 10 0 0 1 37 13 V27 A10 10 0 0 1 27 37 H13 A10 10 0 0 1 3 27 V13 A10 10 0 0 1 13 3 Z', { x, y, scale: k, color: C.green });
    p.drawSvgPath('M13 11.5V21a7 7 0 0 0 14 0v-4', { x, y, scale: k, borderColor: C.white, borderWidth: 4.4 * k, borderLineCap: 1 as any });
    p.drawCircle({ x: x + 27 * k, y: y - 10.6 * k, size: 3.1 * k, color: hex('#143264'), borderColor: C.white, borderWidth: 1.4 * k });
    p.drawText('Uniq', { x: x + s + 8, y: y - s * 0.68, size: s * 0.56, font: X, color: onDark ? C.white : C.navy });
    const w = X.widthOfTextAtSize('Uniq', s * 0.56);
    p.drawText('Suite', { x: x + s + 8 + w, y: y - s * 0.68, size: s * 0.56, font: X, color: C.green });
  };
  const footer = (p: PDFPage, n: number) => {
    p.drawLine({ start: { x: M, y: 46 }, end: { x: A4.w - M, y: 46 }, thickness: 0.6, color: C.line });
    const disc = Q.disclaimer;
    p.drawText(disc, { x: M, y: 32, size: 7.2, font: R, color: C.muted });
    const pg = `${T.page} ${n}`;
    p.drawText(pg, { x: A4.w - M - R.widthOfTextAtSize(pg, 7.2), y: 32, size: 7.2, font: R, color: C.muted });
  };
  const newPage = () => { const p = doc.addPage([A4.w, A4.h]); pages.push(p); return p; };

  // ── Seite 1: Deckblatt + Überblick ──────────────────────────────────────
  let p = newPage();
  p.drawImage(coverImg, { x: 0, y: 0, width: A4.w, height: A4.h });
  logo(p, M, A4.h - 44, 26, true);
  p.drawText(T.title, { x: M, y: A4.h - 130, size: 30, font: X, color: C.white });
  wrap(T.subtitle, R, 11, 330).forEach((l, i) => p.drawText(l, { x: M, y: A4.h - 156 - i * 15, size: 11, font: R, color: hex('#C3CDE0') }));

  let y = A4.h - 270;
  const meta: [string, string][] = [[T.company, company || '—'], [T.date, date], [T.language, T.languageName]];
  meta.forEach(([k, v], i) => {
    p.drawText(k.toUpperCase(), { x: M + i * 170, y, size: 7.5, font: B, color: C.muted });
    p.drawText(v.slice(0, 40), { x: M + i * 170, y: y - 15, size: 11, font: B, color: C.text });
  });

  // Gesamtergebnis
  y -= 70;
  const shown = fws.length > 1 ? overall : scores[fws[0].id];
  const b = bandOf(shown);
  p.drawText(fws.length > 1 ? Q.overall : fws[0].name[lang], { x: M, y, size: 11, font: B, color: C.muted });
  p.drawText(`${shown}`, { x: M - 2, y: y - 62, size: 64, font: X, color: BANDC[b] });
  const sw = X.widthOfTextAtSize(`${shown}`, 64);
  p.drawText('%', { x: M + sw + 2, y: y - 62, size: 28, font: X, color: BANDC[b] });
  const bl = Q.bands[b];
  const bw = B.widthOfTextAtSize(bl, 10) + 24;
  p.drawRectangle({ x: M + sw + 42, y: y - 50, width: bw, height: 22, color: BANDC[b], opacity: 0.14, borderColor: BANDC[b], borderWidth: 0.8, borderOpacity: 0.6 });
  p.drawText(bl, { x: M + sw + 54, y: y - 43, size: 10, font: B, color: C.text });

  // Vektor-Diagramm: Balken je Regelwerk
  y -= 100;
  p.drawText(T.overview, { x: M, y, size: 12, font: B, color: C.navy });
  y -= 22;
  fws.forEach((f) => {
    const v = scores[f.id];
    p.drawText(f.name[lang], { x: M, y: y - 3, size: 10, font: R, color: C.text });
    p.drawRectangle({ x: M + 120, y: y - 5, width: 300, height: 10, color: C.pale, borderColor: C.line, borderWidth: 0.5 });
    p.drawRectangle({ x: M + 120, y: y - 5, width: Math.max(2, 3 * v), height: 10, color: FWC[f.id] ?? C.green });
    p.drawText(`${v} %`, { x: M + 432, y: y - 3, size: 10, font: B, color: C.text });
    p.drawText(Q.bands[bandOf(v)], { x: M + 470, y: y - 3, size: 8, font: R, color: C.muted });
    y -= 20;
  });
  // Skala
  [0, 40, 70, 100].forEach((t) => {
    p.drawLine({ start: { x: M + 120 + t * 3, y: y + 12 }, end: { x: M + 120 + t * 3, y: y + 6 }, thickness: 0.5, color: C.muted });
    p.drawText(`${t}`, { x: M + 117 + t * 3, y: y - 2, size: 6.5, font: R, color: C.muted });
  });

  // Diagramm aus Ihren echten Antworten: Ring mit Ihrem Ergebnis je Regelwerk,
  // daneben eine Säule je Frage (Ja = voll, Teilweise = halb, Nein = leer).
  const ANS: Record<string, { v: number; c: RGB }> = { yes: { v: 1, c: hex('#2BB673') }, partly: { v: 0.5, c: hex('#F5A524') }, no: { v: 0, c: hex('#E5484D') } };
  const ringPath = (r: number, frac: number) => {
    // SVG-Koordinaten (y nach unten), Start oben, im Uhrzeigersinn
    if (frac >= 0.999) return `M 0 ${-r} A ${r} ${r} 0 1 1 0 ${r} A ${r} ${r} 0 1 1 0 ${-r}`;
    const th = frac * Math.PI * 2;
    const ex = r * Math.sin(th), ey = -r * Math.cos(th);
    return `M 0 ${-r} A ${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
  };
  y -= 34;
  p.drawText(T.chartTitle, { x: M, y, size: 12, font: B, color: C.navy });
  // Legende
  let lx = A4.w - M;
  (['no', 'partly', 'yes'] as const).forEach((k) => {
    const t = Q.answers[k];
    const w = R.widthOfTextAtSize(t, 8);
    lx -= w;
    p.drawText(t, { x: lx, y: y + 1, size: 8, font: R, color: C.muted });
    lx -= 12;
    p.drawRectangle({ x: lx, y: y + 1, width: 8, height: 8, color: ANS[k].c });
    lx -= 14;
  });
  y -= 18;
  const rowH = 96;
  fws.forEach((f) => {
    if (y - rowH < 64) { footer(p, pages.length); p = newPage(); y = A4.h - M; }
    const v = scores[f.id];
    const cx = M + 44, cy = y - 46, r = 32;
    p.drawSvgPath(ringPath(r, 1), { x: cx, y: cy, borderColor: C.line, borderWidth: 9 });
    if (v > 0) p.drawSvgPath(ringPath(r, v / 100), { x: cx, y: cy, borderColor: BANDC[bandOf(v)], borderWidth: 9, borderLineCap: LineCapStyle.Round });
    const vt = `${v}%`;
    p.drawText(vt, { x: cx - X.widthOfTextAtSize(vt, 15) / 2, y: cy - 5.5, size: 15, font: X, color: C.text });
    // Säulen je Frage
    const answers = (results.get(f.id) || []) as (string | null)[];
    const x0 = M + 104, chartW = A4.w - M - x0, chartH = 54, top = y - 16;
    p.drawText(f.name[lang], { x: x0, y: top + 2, size: 10, font: B, color: C.text });
    const n = answers.length || 1;
    const gap = 3, bw = Math.min(26, (chartW - gap * (n - 1)) / n);
    const base = top - 12 - chartH;
    p.drawLine({ start: { x: x0, y: base }, end: { x: x0 + n * (bw + gap) - gap, y: base }, thickness: 0.5, color: C.line });
    answers.forEach((a, i) => {
      const x = x0 + i * (bw + gap);
      p.drawRectangle({ x, y: base, width: bw, height: chartH, color: C.pale });
      const d = a ? ANS[a] : null;
      if (d) p.drawRectangle({ x, y: base, width: bw, height: Math.max(3, chartH * d.v), color: d.c });
      const num = String(i + 1);
      p.drawText(num, { x: x + bw / 2 - R.widthOfTextAtSize(num, 6.5) / 2, y: base - 9, size: 6.5, font: R, color: C.muted });
    });
    y -= rowH;
  });
  footer(p, pages.length);

  // ── Folgeseiten: Fragen, Antworten, Empfehlungen ────────────────────────
  p = newPage();
  y = A4.h - M;
  const ensure = (need: number) => {
    if (y - need < 70) { footer(p, pages.length); p = newPage(); y = A4.h - M; }
  };
  p.drawText(T.answersTitle, { x: M, y: y - 18, size: 20, font: X, color: C.navy });
  y -= 44;
  const textW = A4.w - 2 * M - 92;
  fws.forEach((f) => {
    ensure(60);
    p.drawRectangle({ x: M, y: y - 22, width: A4.w - 2 * M, height: 26, color: C.pale });
    p.drawRectangle({ x: M, y: y - 22, width: 4, height: 26, color: FWC[f.id] ?? C.green });
    p.drawText(f.name[lang], { x: M + 14, y: y - 13, size: 12, font: B, color: C.navy });
    const s = `${scores[f.id]} % · ${Q.bands[bandOf(scores[f.id])]}`;
    p.drawText(s, { x: A4.w - M - 10 - B.widthOfTextAtSize(s, 10), y: y - 13, size: 10, font: B, color: C.text });
    y -= 40;
    const ans = results.get(f.id)!;
    f.questions.forEach((q: any, i: number) => {
      const a = ans[i] as 'yes' | 'partly' | 'no';
      const ql = wrap(q.q[lang], R, 9.5, textW);
      const rl = a !== 'yes' ? wrap(`→ ${q.rec[lang]}`, R, 9, textW) : [];
      const need = ql.length * 13 + rl.length * 12 + 26;
      ensure(need);
      p.drawText(`${i + 1}`, { x: M, y: y - 9, size: 9.5, font: B, color: C.muted });
      ql.forEach((l, k) => p.drawText(l, { x: M + 20, y: y - 9 - k * 13, size: 9.5, font: R, color: C.text }));
      const ac = a === 'yes' ? C.green : a === 'partly' ? C.amber : C.red;
      const al = Q.answers[a];
      const aw = B.widthOfTextAtSize(al, 8.5) + 14;
      p.drawRectangle({ x: A4.w - M - aw, y: y - 13, width: aw, height: 16, color: ac, opacity: 0.16, borderColor: ac, borderWidth: 0.7 });
      p.drawText(al, { x: A4.w - M - aw + 7, y: y - 8.5, size: 8.5, font: B, color: C.text });
      let yy = y - 9 - ql.length * 13;
      p.drawText(q.ref[lang], { x: M + 20, y: yy - 1, size: 7.5, font: R, color: C.muted });
      yy -= 13;
      rl.forEach((l, k) => p.drawText(l, { x: M + 20, y: yy - k * 12, size: 9, font: R, color: C.greenD }));
      yy -= rl.length * 12;
      y = yy - 8;
      p.drawLine({ start: { x: M + 20, y: y + 3 }, end: { x: A4.w - M, y: y + 3 }, thickness: 0.4, color: C.line });
      y -= 6;
    });
    y -= 10;
  });

  // ── Nächste Schritte, Kontakt, QR ───────────────────────────────────────
  ensure(230);
  y -= 6;
  p.drawText(T.next, { x: M, y: y - 16, size: 16, font: X, color: C.navy });
  y -= 36;
  (T.nextSteps as string[]).forEach((s, i) => {
    const l = wrap(s, R, 10, A4.w - 2 * M - 30);
    ensure(l.length * 14 + 8);
    p.drawCircle({ x: M + 8, y: y - 4, size: 8, color: C.green });
    p.drawText(String(i + 1), { x: M + 5.4, y: y - 7.5, size: 8.5, font: B, color: C.navy });
    l.forEach((t, k) => p.drawText(t, { x: M + 26, y: y - 8 - k * 14, size: 10, font: R, color: C.text }));
    y -= l.length * 14 + 10;
  });
  ensure(130);
  y -= 8;
  const target: string = D.demo.startsWith('http') ? D.demo : D.login;
  const qr = qrcode(0, 'M');
  qr.addData(target);
  qr.make();
  const n = qr.getModuleCount();
  const size = 96, cell = size / n;
  p.drawRectangle({ x: M, y: y - size - 8, width: size + 16, height: size + 16, color: C.white, borderColor: C.line, borderWidth: 0.6 });
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) p.drawRectangle({ x: M + 8 + c * cell, y: y - r * cell - cell, width: cell + 0.05, height: cell + 0.05, color: C.navy });
  p.drawText(T.contact, { x: M + size + 34, y: y - 14, size: 12, font: B, color: C.navy });
  p.drawText(D.login.replace(/\?.*$/, ''), { x: M + size + 34, y: y - 34, size: 10, font: R, color: C.greenD });
  const mail = D.demo.startsWith('mailto:') ? D.demo.slice(7).split('?')[0] : D.demo;
  p.drawText(mail, { x: M + size + 34, y: y - 50, size: 10, font: R, color: C.text });
  wrap(Q.disclaimer, R, 8, A4.w - 2 * M - size - 40)
    .forEach((l, k) => p.drawText(l, { x: M + size + 34, y: y - 74 - k * 11, size: 8, font: R, color: C.muted }));
  footer(p, pages.length);

  const out = await doc.save();
  const blob = new Blob([out as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `UniqSuite-Quick-Check-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  (window as any).__uqLastPdf = out; // für automatische Tests
}
