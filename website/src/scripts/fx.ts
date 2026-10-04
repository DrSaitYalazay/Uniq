/**
 * Kleine Bewegungseffekte (REDESIGN.md 2.8):
 *  - Überschriften mit [data-split]: Wörter werden in Masken gelegt und beim
 *    Eintritt in den Bildschirm nacheinander hochgeschoben.
 *  - Zahlen mit [data-countup]: zählen beim ersten Sichtkontakt hoch.
 * Ohne JS oder bei reduzierter Bewegung bleibt alles sofort sichtbar.
 * DOM wird nur mit createElement/Textknoten gebaut (Trusted Types, CSP).
 */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('reduced');

function wrapWords(el: HTMLElement) {
  let i = 0;
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = (child.textContent || '').split(/(\s+)/);
        const frag = document.createDocumentFragment();
        for (const p of parts) {
          if (!p) continue;
          if (/^\s+$/.test(p)) { frag.append(document.createTextNode(' ')); continue; }
          const w = document.createElement('span');
          w.className = 'w';
          const inner = document.createElement('span');
          inner.textContent = p;
          inner.style.setProperty('--i', String(i++));
          w.append(inner);
          frag.append(w);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    }
  };
  walk(el);
}

export function initFx() {
  if (reduced || !('IntersectionObserver' in window)) return;

  // Überschriften bleiben immer sichtbar (keine Wort-Enthüllung mehr: nichts soll
  // verschwinden oder erst beim Scrollen auftauchen).
  const heads: HTMLElement[] = [];
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -12% 0px' });
  for (const h of heads) {
    // nur Überschriften unterhalb des ersten Bildschirms (kein Aufblitzen)
    if (h.getBoundingClientRect().top < innerHeight) continue;
    // Bildschirmleser lesen den ursprünglichen Text
    h.setAttribute('aria-label', (h.textContent || '').replace(/\s+/g, ' ').trim());
    wrapWords(h);
    h.querySelectorAll('.w').forEach((w) => w.setAttribute('aria-hidden', 'true'));
    h.classList.add('split');
    io.observe(h);
  }

  const fmt = new Intl.NumberFormat(document.documentElement.lang || 'de');
  const nums = Array.from(document.querySelectorAll<HTMLElement>('[data-countup]'));
  const ioN = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      ioN.unobserve(e.target);
      const el = e.target as HTMLElement;
      const to = Number(el.dataset.countup);
      const t0 = performance.now();
      const dur = 1600;
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 4);
        el.textContent = fmt.format(Math.round(to * eased));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, { threshold: 0.6 });
  // nur Zahlen unterhalb des ersten Bildschirms (sonst springt die Zahl sichtbar auf 0)
  nums.filter((n) => n.getBoundingClientRect().top >= innerHeight).forEach((n) => ioN.observe(n));
}

/**
 * Drehauswahl der Regelwerke (Quick-Check): dreht sich langsam, hält bei Zeiger
 * oder Fokus an. Pfeile drehen um eine Karte; eine fokussierte Karte dreht nach vorn.
 * Bei reduzierter Bewegung zeigt CSS ein einfaches Raster.
 */
export function initCarousel() {
  if (reduced) return;
  document.querySelectorAll<HTMLElement>('[data-carousel]').forEach(setupCarousel);
}

function setupCarousel(car: HTMLElement) {
  const ring = car.querySelector<HTMLElement>('.ring');
  if (!ring) return;
  const items = Array.from(ring.querySelectorAll<HTMLElement>('.ring-item'));
  const step = 360 / items.length;
  let angle = 0;
  ring.classList.add('spin');
  const current = () => {
    const m = new DOMMatrix(getComputedStyle(ring).transform);
    return (Math.atan2(m.m31, m.m11) * 180) / Math.PI;
  };
  const stop = () => {
    if (!ring.classList.contains('spin')) return;
    angle = current();
    ring.classList.remove('spin');
    ring.style.transition = 'none';
    ring.style.transform = `rotateY(${angle}deg)`;
    void ring.offsetWidth;
    ring.style.transition = '';
  };
  const turnTo = (target: number) => {
    stop();
    // kürzester Weg
    while (target - angle > 180) target -= 360;
    while (target - angle < -180) target += 360;
    angle = target;
    ring.style.transform = `rotateY(${angle}deg)`;
  };
  car.querySelectorAll<HTMLButtonElement>('[data-car]').forEach((b) => b.addEventListener('click', () => {
    stop();
    turnTo(Math.round(angle / step) * step - Number(b.dataset.car) * step);
  }));
  items.forEach((it, k) => it.addEventListener('focusin', () => turnTo(-k * step)));
}
