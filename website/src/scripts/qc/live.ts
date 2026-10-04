/**
 * Quick-Check-Seite: Grafik neben den Fragen, die mit jeder Antwort wächst.
 * Ring = Stand aus den bisherigen Antworten, Säulen = Antwort je Frage.
 * Aufbau nur mit createElement/createElementNS (CSP, Trusted Types).
 */
import { bus, state, type QcView } from '../state';
import { scoreOf, bandOf } from './qc';

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag: string, attrs: Record<string, string | number>) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
};

export function initLive() {
  const host = document.querySelector<HTMLElement>('[data-qc-live]');
  const D = state.data();
  if (!host || !D) return;
  const T = D.qc;
  const lang: 'de' | 'en' = D.lang;
  const fws: any[] = D.data.frameworks;
  const fmt = (s: string, o: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(o[k] ?? ''));

  const title = document.createElement('p');
  title.className = 'live-t';
  title.textContent = T.liveTitle;
  const R = 54, C = 2 * Math.PI * R;
  const ring = svg('svg', { viewBox: '0 0 140 140', class: 'live-ring', role: 'img' });
  const track = svg('circle', { cx: 70, cy: 70, r: R, class: 'tr' });
  const val = svg('circle', { cx: 70, cy: 70, r: R, class: 'va', 'stroke-dasharray': `0 ${C}` });
  const num = svg('text', { x: 70, y: 74, class: 'n' });
  const sub = svg('text', { x: 70, y: 94, class: 's' });
  ring.append(track, val, num, sub);
  const band = document.createElement('p');
  band.className = 'live-band';
  const cnt = document.createElement('p');
  cnt.className = 'live-cnt';
  const cols = svg('svg', { class: 'live-cols', viewBox: '0 0 260 110', preserveAspectRatio: 'none', role: 'img' });
  const capt = document.createElement('p');
  capt.className = 'live-cap';
  capt.textContent = T.columnsLabel;
  const keys = document.createElement('ul');
  keys.className = 'vz-keys';
  (['yes', 'partly', 'no'] as const).forEach((k) => {
    const li = document.createElement('li');
    li.className = `a-${k}`;
    li.append(document.createElement('i'), T.answers[k]);
    keys.append(li);
  });
  host.replaceChildren(title, ring, band, cnt, capt, cols, keys);

  let lastFw = '';
  const draw = (v: QcView) => {
    const fw = fws.find((f) => f.id === v.fw);
    if (!fw) return;
    host.classList.add('on');
    host.dataset.fw = fw.id;
    const answers = v.answers ?? fw.questions.map(() => null);
    const n = fw.questions.length;
    const a = answers.filter(Boolean).length;
    const sc = a ? scoreOf(fw, answers) : 0;
    const b = bandOf(sc);
    val.setAttribute('stroke-dasharray', `${((sc / 100) * C).toFixed(1)} ${C.toFixed(1)}`);
    val.setAttribute('class', `va ${a ? b : 'none'}`);
    num.textContent = a ? `${sc} %` : '–';
    sub.textContent = fw.name[lang];
    ring.setAttribute('aria-label', `${fw.name[lang]}: ${a ? sc + ' %' : '–'}`);
    band.textContent = a ? T.bands[b] : T.liveEmpty;
    band.className = `live-band ${a ? b : ''}`;
    cnt.textContent = fmt(T.liveAnswered, { a, n });
    // Säulen neu aufbauen, wenn das Regelwerk wechselt; sonst nur Höhen anpassen
    const w = 260 / n, gap = Math.min(6, w * 0.25);
    if (lastFw !== fw.id) {
      lastFw = fw.id;
      cols.replaceChildren();
      for (let i = 0; i < n; i++) {
        cols.append(svg('rect', { x: (i * w + gap / 2).toFixed(2), y: 0, width: (w - gap).toFixed(2), height: 110, rx: 3, class: 'bg' }));
        cols.append(svg('rect', { x: (i * w + gap / 2).toFixed(2), y: 110, width: (w - gap).toFixed(2), height: 0, rx: 3, class: 'c' }));
      }
    }
    const bars = cols.querySelectorAll('rect.c');
    const bgs = cols.querySelectorAll('rect.bg');
    answers.forEach((ans: string | null, i: number) => {
      const h = ans === 'yes' ? 106 : ans === 'partly' ? 56 : ans === 'no' ? 12 : 0;
      bars[i]?.setAttribute('y', String(110 - h));
      bars[i]?.setAttribute('height', String(h));
      bars[i]?.setAttribute('class', `c ${ans ? 'a-' + ans : ''}`);
      bgs[i]?.setAttribute('class', `bg${v.mode === 'question' && v.index === i ? ' cur' : ''}`);
    });
    cols.setAttribute('aria-label', `${T.columnsLabel}: ${answers.map((x: string | null, i: number) => `${i + 1} ${x ? T.answers[x] : '–'}`).join(', ')}`);
  };
  bus.on('qc:view', (v: QcView) => { if (v.mode !== 'pick') draw(v); });
  if (state.qc && state.qc.mode !== 'pick') draw(state.qc);
}
