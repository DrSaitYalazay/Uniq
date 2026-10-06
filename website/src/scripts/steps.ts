/**
 * Sechs Schritte als Weg. Der Abschnitt bleibt stehen, während die Ansicht auf einer leuchtenden
 * Straße von Schritt zu Schritt fährt. Gesteuert allein vom Weltparameter u (6 … 11 = Schritt 1 … 6),
 * dadurch läuft die Fahrt synchron mit der Kamera um den Ring und rückwärts exakt gleich.
 * An jedem Schritt wird die Fahrt langsamer, hält aber nie an.
 */
import { dimFilter } from './state';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Touch-Geräte: kein Filter je Bild auf den gedrehten Karten (3D + Filter flackert in mobilen Browsern)
const touch = matchMedia('(hover: none) and (pointer: coarse)');

export function initPath(): (u: number) => void {
  const sec = document.querySelector<HTMLElement>('.steps.path');
  const track = sec?.querySelector<HTMLElement>('[data-path]');
  const view = sec?.querySelector<HTMLElement>('.path-view');
  if (!sec || !track || !view) return () => {};
  const stops = Array.from(track.querySelectorAll<HTMLElement>('.pstop'));
  const inners = stops.map((s) => s.querySelector<HTMLElement>('.pstop-in')!);
  const chips = Array.from(sec.querySelectorAll<HTMLElement>('[data-ph]'));
  const svg = track.querySelector<SVGSVGElement>('svg.path-road')!;
  const base = svg.querySelector<SVGPathElement>('.rd-base')!;
  const fill = svg.querySelector<SVGPathElement>('.rd-fill')!;
  const clip = svg.querySelector<SVGRectElement>('.rd-clip')!;
  const dot = svg.querySelector<SVGCircleElement>('.rd-dot')!;
  const nodes = Array.from(svg.querySelectorAll<SVGCircleElement>('.rd-node'));
  const n = stops.length;
  sec.classList.add('js');

  let S = 0, G = 0, pad = 0, roadY = 0, A = 16, fit = 1, last = -9, active = -2;
  const x0 = () => pad + S / 2;
  const yAt = (x: number) => roadY + A * Math.sin((Math.PI * (x - x0())) / (S + G));

  // Alle Karten gleich hoch; die große Schrittzahl neben jeder Karte richtet sich nach dieser Höhe
  const vizs = inners.map((el) => el.querySelector<HTMLElement>('.stage-card .viz')).filter((v): v is HTMLElement => !!v);
  const equalize = () => {
    vizs.forEach((v) => (v.style.minHeight = ''));
    const h = Math.max(...vizs.map((v) => v.offsetHeight));
    if (!(h > 0)) return;
    vizs.forEach((v) => (v.style.minHeight = `${h}px`));
    track.style.setProperty('--ph-h', `${h}px`);
  };

  const layout = () => {
    equalize();
    const vw = view.clientWidth;
    S = stops[0].offsetWidth;
    G = parseFloat(getComputedStyle(track).columnGap) || 0;
    pad = Math.max(0, (vw - S) / 2);
    track.style.paddingLeft = track.style.paddingRight = `${pad.toFixed(1)}px`;
    const W = pad * 2 + n * S + (n - 1) * G;
    const H = track.clientHeight;
    roadY = H - 30;
    A = Math.min(18, H * 0.03);
    svg.setAttribute('viewBox', `0 0 ${W.toFixed(0)} ${H.toFixed(0)}`);
    svg.setAttribute('width', W.toFixed(0));
    svg.setAttribute('height', H.toFixed(0));
    let d = '';
    for (let x = 0; x <= W; x += 12) d += `${d ? 'L' : 'M'}${x.toFixed(0)} ${yAt(x).toFixed(1)}`;
    base.setAttribute('d', d);
    fill.setAttribute('d', d);
    nodes.forEach((c, i) => { const x = x0() + i * (S + G); c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', yAt(x).toFixed(1)); });
    // Karten so skalieren, dass die höchste über der Straße Platz hat
    const room = roadY - 28;
    const tallest = Math.max(...inners.map((el) => el.offsetHeight));
    fit = Math.min(1, room / Math.max(1, tallest));
    last = -9;
  };
  layout();
  new ResizeObserver(layout).observe(view);
  addEventListener('load', layout);

  return (u: number) => {
    let p = Math.min(n - 1, Math.max(0, u - 6));
    const k = Math.min(n - 2, Math.floor(p)), fr = p - k;
    p = k + 0.62 * fr + 0.38 * fr * fr * (3 - 2 * fr); // an jedem Schritt langsamer, nie stehend
    if (Math.abs(p - last) < 0.0004) return;
    last = p;
    track.style.transform = `translate3d(${(-p * (S + G)).toFixed(1)}px, 0, 0)`;
    inners.forEach((el, i) => {
      const dd = i - p, ad = Math.min(1.4, Math.abs(dd));
      const rot = reduced ? 0 : -Math.max(-1.2, Math.min(1.2, dd)) * 22;
      el.style.transform = `rotateY(${rot.toFixed(2)}deg) scale(${((1 - ad * 0.15) * fit).toFixed(3)})`;
      el.style.filter = touch.matches ? '' : dimFilter(1 - ad * 0.4);
    });
    const x = x0() + p * (S + G);
    clip.setAttribute('width', x.toFixed(1));
    dot.setAttribute('cx', x.toFixed(1));
    dot.setAttribute('cy', yAt(x).toFixed(1));
    const a = Math.round(p);
    if (a !== active) {
      active = a;
      chips.forEach((c, i) => { c.classList.toggle('is-active', i === a); c.classList.toggle('done', i < a); });
      nodes.forEach((c, i) => c.classList.toggle('on', i <= a));
      stops.forEach((s, i) => {
        s.classList.toggle('is-active', i === a);
        if (i === a) s.querySelector('[data-viz]')?.classList.add('on');
      });
    }
  };
}
