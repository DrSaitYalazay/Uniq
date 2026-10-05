/**
 * Seitensteuerung: Scroll (Lenis), Kapitel-Leiste, Hash, Tastatur, Header,
 * Scroll→Weltparameter u, Laden der 3D-Welt und des Quick-Checks.
 * Alles Weitere (3D, Quick-Check, PDF) wird erst bei Bedarf geladen.
 */
import Lenis from 'lenis';
import { bus, state } from './state';
import { initFx, initCarousel, initViz, initImgIn, initMirror } from './fx';
import { initAnfrage } from './anfrage';

const root = document.documentElement;
const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('reduced');
const isHome = !!document.querySelector('[data-world]');
const header = document.querySelector<HTMLElement>('[data-header]');
const progress = document.querySelector<HTMLElement>('[data-progress]');

function setWide() { root.classList.toggle('wide', innerWidth > 820); }
setWide();
addEventListener('resize', setWide, { passive: true });

// ── Glattes Scrollen (nicht bei reduzierter Bewegung) ─────────────────────
let lenis: Lenis | null = null;
if (!reduced && !params.has('still')) {
  lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9, anchors: false });
  state.lenis = lenis;
}

// ── Stationen: Scrollposition → Weltparameter u ───────────────────────────
type Mark = { y: number; u: number };
let marks: Mark[] = [];
let sections: { el: HTMLElement; id: string; y0: number; y1: number; dim: number }[] = [];
const dimEls = Array.from(document.querySelectorAll<HTMLElement>('[data-dim], [data-dim-m]'));

function measure() {
  const vh = innerHeight;
  marks = [];
  sections = [];
  document.querySelectorAll<HTMLElement>('[data-u0]').forEach((el) => {
    const top = el.getBoundingClientRect().top + scrollY;
    const y0 = top;
    const y1 = Math.max(y0 + 1, top + el.offsetHeight - vh);
    marks.push({ y: y0, u: parseFloat(el.dataset.u0!) }, { y: y1, u: parseFloat(el.dataset.u1!) });
    sections.push({ el, id: el.id, y0: top, y1: top + el.offsetHeight, dim: parseFloat(el.dataset.dim || '0') });
  });
  marks.sort((a, b) => a.y - b.y);
}

function uAt(y: number) {
  if (!marks.length) return 0;
  if (y <= marks[0].y) return marks[0].u;
  for (let i = 1; i < marks.length; i++) {
    const a = marks[i - 1], b = marks[i];
    if (y <= b.y) return a.u + (b.u - a.u) * ((y - a.y) / Math.max(1, b.y - a.y));
  }
  return marks[marks.length - 1].u;
}

function dimAt(y: number) {
  const vh = innerHeight;
  let d = 0;
  for (const el of dimEls) {
    const r = el.getBoundingClientRect();
    const v = parseFloat((innerWidth <= 820 && el.dataset.dimM) || el.dataset.dim || '0');
    // weich einblenden, solange der Abschnitt in den Bildschirm hineinläuft
    const inView = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.6))) * Math.min(1, Math.max(0, r.bottom / (vh * 0.6)));
    d = Math.max(d, v * inView);
  }
  return d;
}

// ── Kapitel-Leiste und Hash ───────────────────────────────────────────────
const railLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-rail]'));
const railIds = railLinks.map((a) => a.dataset.rail!);
let activeId = '';
let programmatic = false;
let programmaticTimer = 0;

function setActive(id: string) {
  if (id === activeId) return;
  activeId = id;
  let passed = true;
  for (const a of railLinks) {
    const on = a.dataset.rail === id;
    if (on) passed = false;
    a.setAttribute('aria-current', on ? 'true' : 'false');
    a.classList.toggle('is-done', passed && !on);
  }
  if (!programmatic && isHome) {
    const url = id && id !== 'wolke' ? `#${id}` : location.pathname + location.search;
    history.replaceState(history.state, '', url);
  }
  document.querySelector('.rail')?.classList.toggle('off', !id);
  root.classList.toggle('in-flow', id === 'regelwerke' || id === 'funktionen');
  bus.emit('station', id);
}

// Letzter Klick (in % des Fensters): Ziel des Zooms, wenn ein Klick einen Sprung auslöst
let lastClick = { x: 50, y: 50, t: 0 };
document.addEventListener('click', (e) => { lastClick = { x: Math.round(e.clientX / innerWidth * 100), y: Math.round(e.clientY / innerHeight * 100), t: performance.now() }; }, true);

/** Sprung zu einem Element: weit weg → Zoom (wie ein Seitenwechsel), nah → weiches Scrollen. */
function scrollToEl(el: HTMLElement, push = true, offset = 0) {
  const dist = Math.abs(el.getBoundingClientRect().top + offset);
  if (!reduced && (document as any).startViewTransition && dist > innerHeight * 1.1) {
    const c = performance.now() - lastClick.t < 1500 ? lastClick : { x: 50, y: 50 };
    zoomJump(el, c.x, c.y, push, false, offset);
    return;
  }
  smoothTo(el, push, offset);
}

function smoothTo(el: HTMLElement, push = true, offset = 0) {
  programmatic = true;
  clearTimeout(programmaticTimer);
  const done = () => {
    programmatic = false;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  };
  if (push && el.id) history.pushState({ uq: el.id }, '', `#${el.id}`);
  if (lenis) {
    lenis.scrollTo(el, { offset, duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4), onComplete: done });
  } else {
    scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: reduced ? 'auto' : 'smooth' });
    programmaticTimer = window.setTimeout(done, reduced ? 50 : 900);
  }
  programmaticTimer = window.setTimeout(() => (programmatic = false), 2200);
}
state.scrollToEl = scrollToEl;

/**
 * Sprung innerhalb der Seite als Kamerafahrt: statt schnell vorbeizuscrollen
 * zoomt das Bild in Richtung der angeklickten Stelle hinein (nach unten) bzw.
 * heraus (nach oben). Ohne View-Transition-Unterstützung: weiches Scrollen.
 */
function zoomJump(el: HTMLElement | null, x = 50, y = 50, push = true, topOnly = false, offset = 0) {
  const docAny = document as any;
  const targetTop = el && !topOnly ? el.getBoundingClientRect().top + scrollY + offset : 0;
  if (reduced || !docAny.startViewTransition) {
    if (el && !topOnly) smoothTo(el, push, offset);
    else if (lenis) lenis.scrollTo(0, { duration: 1.4 }); else scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    return;
  }
  const dir = targetTop >= scrollY ? 'vt-in' : 'vt-out';
  root.style.setProperty('--vt-x', `${x}%`);
  root.style.setProperty('--vt-y', `${y}%`);
  root.classList.add(dir);
  programmatic = true;
  // Achtung: während des Callbacks ist das Rendern angehalten (kein requestAnimationFrame) – daher synchron
  const vt = docAny.startViewTransition(() => {
    if (push && el && el.id && !topOnly) history.pushState({ uq: el.id }, '', `#${el.id}`);
    if (lenis) lenis.scrollTo(targetTop, { immediate: true, force: true });
    scrollTo({ top: targetTop, behavior: 'instant' as ScrollBehavior });
  });
  vt.finished.finally(() => {
    root.classList.remove(dir);
    programmatic = false;
    const f = el && !topOnly ? el : document.getElementById('inhalt');
    if (f) { if (!f.hasAttribute('tabindex')) f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); }
  });
}
(state as any).zoomJump = zoomJump;

document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
  if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey || a.hasAttribute('data-to-top')) return;
  const url = new URL(a.href);
  if (url.pathname !== location.pathname || !url.hash) return;
  const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
  if (!el) return;
  e.preventDefault();
  const r = a.getBoundingClientRect();
  zoomJump(el, Math.round((r.left + r.width / 2) / innerWidth * 100), Math.round((r.top + r.height / 2) / innerHeight * 100));
});

addEventListener('popstate', () => {
  const el = location.hash ? document.getElementById(location.hash.slice(1)) : document.getElementById('wolke');
  if (el) zoomJump(el, 50, 50, false);
});

// ── Tastatur: Pfeile / Bild↑↓ springen zwischen Stationen ─────────────────
const stops = ['wolke', 'regelwerke', 'funktionen', 'pdca', 'pdca-1', 'pdca-2', 'pdca-3', 'pdca-4', 'pdca-5', 'pdca-6', 'fristen', 'zeitachse', 'quick-check']
  .map((id) => document.getElementById(id))
  .filter((x): x is HTMLElement => !!x);

addEventListener('keydown', (e) => {
  if (!isHome || e.altKey || e.ctrlKey || e.metaKey) return;
  const tgt = e.target as HTMLElement;
  if (tgt.closest('input, textarea, select, [contenteditable], [data-qc], summary, .qc')) return;
  const down = e.key === 'ArrowDown' || e.key === 'PageDown';
  const up = e.key === 'ArrowUp' || e.key === 'PageUp';
  if (!down && !up) return;
  const qc = document.getElementById('quick-check');
  const y = scrollY + 4;
  if (qc && y > qc.getBoundingClientRect().top + scrollY + 10) return; // danach: normales Scrollen
  const tops = stops.map((el) => el.getBoundingClientRect().top + scrollY);
  let idx = -1;
  if (down) idx = tops.findIndex((t) => t > y + 8);
  else for (let i = tops.length - 1; i >= 0; i--) if (tops[i] < y - 8) { idx = i; break; }
  if (idx < 0) return;
  e.preventDefault();
  scrollToEl(stops[idx]);
});

// ── Magnetische Buttons ────────────────────────────────────────────────────
if (!reduced && matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width - 0.5) * 8}px`);
      el.style.setProperty('--my', `${((e.clientY - r.top) / r.height - 0.5) * 6}px`);
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); });
  });
}

// ── Haupt-Schleife ─────────────────────────────────────────────────────────
const dimEl = document.querySelector<HTMLElement>('.world .dim');
const msEls = Array.from(document.querySelectorAll<HTMLElement>('[data-ms]'));
let lastMs = -1;
const phEls = Array.from(document.querySelectorAll<HTMLElement>('[data-ph]'));
const stepsEl = document.querySelector<HTMLElement>('[data-steps]');
const stageEls = Array.from(document.querySelectorAll<HTMLElement>('[data-stage]'));
let lastPh = -2, lastF = -1;

/** Wechsel des aktiven Schritts: Karte kommt aus der Scroll-Richtung, die alte geht in die Gegenrichtung. */
function switchStep(ph: number, prev: number) {
  const down = ph > prev;
  stepsEl?.classList.toggle('dir-up', !down);
  phEls.forEach((el) => {
    const i = Number(el.dataset.ph);
    el.classList.toggle('is-active', i === ph);
    el.classList.toggle('done', i < ph);
    if (i !== ph) el.style.removeProperty('--f');
  });
  stepsEl?.classList.toggle('has-active', ph >= 0);
  const cur = Math.max(0, ph), old = Math.max(0, prev);
  stageEls.forEach((el) => {
    const i = Number(el.dataset.stage);
    if (i === cur && i !== old && prev > -2) {
      // Startlage ohne Übergang setzen, dann einblenden
      el.classList.remove('to-up', 'to-down');
      el.classList.add(down ? 'from-down' : 'from-up');
      void el.offsetWidth;
      el.classList.remove('from-down', 'from-up');
    }
    if (i === old && i !== cur) { el.classList.remove('to-up', 'to-down'); el.classList.add(down ? 'to-up' : 'to-down'); }
    const on = i === cur;
    el.classList.toggle('is-active', on);
    el.querySelector('[data-viz]')?.classList.toggle('on', on);
  });
}

function tick(time: number) {
  lenis?.raf(time);
  const y = scrollY;
  header?.classList.toggle('is-scrolled', y > 24);
  const max = document.documentElement.scrollHeight - innerHeight;
  if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
  if (isHome) {
    state.u = uAt(y);
    state.dim = dimAt(y);
    if (dimEl) dimEl.style.opacity = String(root.classList.contains('has3d') ? state.dim : 0);
    // aktive Station (Mitte des Bildschirms)
    const mid = y + innerHeight * 0.5;
    let id = '';
    for (const s of sections) if (mid >= s.y0 && mid < s.y1 && railIds.includes(s.id)) id = s.id;
    if (!id && sections.length && mid < sections[0].y0) id = 'wolke';
    setActive(id);
    // aktiver Meilenstein
    const ms = Math.round(Math.min(6, Math.max(0, (state.u - 13.3) / (14.9 - 13.3) * 6)));
    // aktiver Schritt in der Liste „Sechs Schritte“ (folgt der Kamera)
    const ph = state.u < 5.97 ? -1 : Math.round(Math.min(5, Math.max(0, state.u - 6)));
    if (ph !== lastPh) { switchStep(ph, lastPh); lastPh = ph; lastF = -1; }
    // Fortschritt innerhalb des Schritts: Linie zum nächsten Schritt füllt sich mit jedem Scrollen
    if (ph >= 0) {
      const f = Math.round(Math.min(1, Math.max(0, state.u - 6 - ph + 0.5)) * 100) / 100;
      if (f !== lastF) { lastF = f; phEls[ph]?.style.setProperty('--f', String(f)); }
    }
    if (ms !== lastMs && state.u > 14) {
      lastMs = ms;
      msEls.forEach((el) => el.classList.toggle('is-active', Number(el.dataset.ms) === ms));
    }
  }
  bus.emit('frame', time);
  requestAnimationFrame(tick);
}

if (isHome) {
  measure();
  const ro = new ResizeObserver(() => { measure(); lenis?.resize(); });
  ro.observe(document.querySelector('main')!);
  addEventListener('resize', measure, { passive: true });
  addEventListener('load', measure);
}
initAnfrage();
initFx();
initCarousel();
initViz();
initImgIn();
initMirror();
requestAnimationFrame(tick);
(window as any).__uq = { state, uAt, measure };

// Deep Link beim Laden
if (isHome && location.hash) {
  const el = document.getElementById(location.hash.slice(1));
  if (el) requestAnimationFrame(() => { measure(); el.scrollIntoView({ block: 'start' }); });
}

// ── 3D-Welt nach dem ersten Bild laden ─────────────────────────────────────
function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

const canvas = document.querySelector<HTMLCanvasElement>('[data-world]');
const want3d = isHome && canvas && !reduced && !params.has('no3d') && webglOk();
if (want3d) {
  const start = () => import('./world/world').then((m) => m.init(canvas!)).catch((err) => { console.warn('[3D] deaktiviert:', err); });
  if (params.has('still') || params.has('auto3d')) start();
  else {
    // Die 3D-Welt startet mit der ersten Nutzeraktion. Bis dahin zeigt das Poster
    // (aus derselben Szene gerendert) dasselbe Bild – die Seite bleibt sofort bedienbar.
    let started = false;
    const go = () => {
      if (started) return;
      started = true;
      evs.forEach((ev) => removeEventListener(ev, go));
      ('requestIdleCallback' in window ? requestIdleCallback : (f: () => void) => setTimeout(f, 1))(() => start());
    };
    const evs = ['pointermove', 'pointerdown', 'wheel', 'touchstart', 'scroll', 'keydown'];
    evs.forEach((ev) => addEventListener(ev, go, { passive: true, once: true }));
    if (location.hash) go();
  }
}

// ── Quick-Check bei Bedarf laden ───────────────────────────────────────────
let qcLoading: Promise<unknown> | null = null;
function loadQc() {
  qcLoading ??= import('./qc/qc').then((m) => m.init()).then(() => (document.querySelector('[data-qc-live]') ? import('./qc/live').then((m) => m.initLive()) : undefined));
  return qcLoading;
}
// ── Reiter in der Kopfzeile: aktiven Abschnitt markieren (auf Tablet/Handy sichtbar als Reiter) ──
const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.site-nav a[href*="#"]'))
  .map((a) => ({ a, el: document.getElementById(decodeURIComponent(a.hash.slice(1))) }))
  .filter((x): x is { a: HTMLAnchorElement; el: HTMLElement } => !!x.el && new URL(x.a.href).pathname === location.pathname);
const navBar = document.querySelector<HTMLElement>('.site-nav');
let navActive: HTMLAnchorElement | null = null;
// Unterseite: markierten Reiter sichtbar machen
const navHere = document.querySelector<HTMLAnchorElement>('.site-nav a[aria-current="location"]');
if (navHere && navBar && navBar.scrollWidth > navBar.clientWidth) navBar.scrollLeft = Math.max(0, navHere.offsetLeft - (navBar.clientWidth - navHere.offsetWidth) / 2);
if (navLinks.length) {
  const upd = () => {
    const y = scrollY + innerHeight * 0.4;
    let cur: HTMLAnchorElement | null = null;
    for (const { a, el } of navLinks) if (el.getBoundingClientRect().top + scrollY <= y) cur = a;
    if (cur === navActive) return;
    navActive = cur;
    navLinks.forEach(({ a }) => a.setAttribute('aria-current', a === cur ? 'true' : 'false'));
    // aktiven Reiter in den sichtbaren Bereich der Leiste schieben (nur waagerecht)
    if (cur && navBar && navBar.scrollWidth > navBar.clientWidth) {
      const l = cur.offsetLeft - (navBar.clientWidth - cur.offsetWidth) / 2;
      navBar.scrollTo({ left: Math.max(0, l), behavior: reduced ? 'auto' : 'smooth' });
    }
  };
  addEventListener('scroll', upd, { passive: true });
  addEventListener('resize', upd, { passive: true });
  upd();
}

const qcEl = document.querySelector<HTMLElement>('[data-qc]');
const qcBase = (() => { try { return JSON.parse(document.getElementById('uq-data')?.textContent || '{}').qcBase as string | undefined; } catch { return undefined; } })();
// Eigene Quick-Check-Seite: direkt mit dem gewählten Regelwerk starten
if (qcEl?.dataset.autostart) {
  const fw = qcEl.dataset.autostart;
  loadQc().then(() => bus.emit('qc:start', fw));
} else if (qcEl) {
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { loadQc(); io.disconnect(); }
  }, { rootMargin: '1200px 0px' });
  io.observe(qcEl);
}
// Turm-/Regelwerk-Buttons: Quick-Check direkt starten
document.addEventListener('click', (e) => {
  const b = (e.target as Element).closest<HTMLElement>('[data-start]');
  if (!b || !qcEl) return;
  e.preventDefault();
  const fw = b.dataset.start!;
  loadQc().then(() => bus.emit('qc:start', fw));
});
// Klick auf einen Turm in der 3D-Szene: Quick-Check in neuem Tab (Startseite) bzw. direkt starten
bus.on('world:tower', (fw) => {
  if (qcEl) loadQc().then(() => bus.emit('qc:start', fw));
  else if (qcBase) window.open(`${qcBase}${fw}/`, '_blank', 'noopener');
});

// ── Nach oben: Knopf erscheint gegen Ende der Seite ─────────────────────────
{
  const fab = document.querySelector<HTMLElement>('[data-fab-top]');
  const toTop = (e: Event) => {
    e.preventDefault();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    zoomJump(null, Math.round((r.left + r.width / 2) / innerWidth * 100), Math.round((r.top + r.height / 2) / innerHeight * 100), false, true);
  };
  document.querySelectorAll<HTMLElement>('[data-to-top]').forEach((a) => a.addEventListener('click', toTop));
  if (fab) {
    const upd = () => {
      const doc = document.documentElement.scrollHeight;
      fab.classList.toggle('show', scrollY > innerHeight && scrollY + innerHeight > doc - innerHeight * 1.5);
    };
    addEventListener('scroll', upd, { passive: true });
    upd();
  }
}
