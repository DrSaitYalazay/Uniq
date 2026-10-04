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

  const heads = Array.from(document.querySelectorAll<HTMLElement>('[data-split]'));
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
