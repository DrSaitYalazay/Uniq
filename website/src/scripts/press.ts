/**
 * Berichte auf der Startseite: Beim Scrollen kommen die Seiten nacheinander aus einem leuchtenden
 * Druckschlitz, falten sich auf und fliegen auf ihren Platz in der Reihe. Rückwärts genauso.
 * Nur Breitbild ohne reduzierte Bewegung; sonst stehen die Karten einfach im Raster.
 */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wide = matchMedia('(min-width: 1024px)');

export function initPress(): () => void {
  const sec = document.querySelector<HTMLElement>('.reports-sec');
  const press = sec?.querySelector<HTMLElement>('[data-press]');
  const slot = press?.querySelector<HTMLElement>('.rp-slot');
  if (!sec || !press || !slot || reduced) return () => {};
  const cards = Array.from(press.querySelectorAll<HTMLElement>('.rp-card'));
  const n = cards.length;
  let on = false, d: { dx: number; dy: number; h: number }[] = [], last = -1, top = 0, span = 1;

  const layout = () => {
    on = wide.matches;
    sec.classList.toggle('js', on);
    cards.forEach((c) => { c.style.transform = ''; c.style.opacity = ''; });
    if (!on) { cards.forEach((c) => c.classList.add('on')); return; }
    // Lage ohne Transform: offsetLeft/Top sind davon unabhängig
    const sx = slot.offsetLeft + slot.offsetWidth / 2, sy = slot.offsetTop + slot.offsetHeight / 2;
    // Bezug ist die Oberkante der Karte (transform-origin oben): sie beginnt genau im Schlitz
    d = cards.map((c) => ({ dx: sx - (c.offsetLeft + c.offsetWidth / 2), dy: sy - c.offsetTop, h: c.offsetHeight }));
    top = sec.getBoundingClientRect().top + scrollY;
    span = Math.max(1, sec.offsetHeight - innerHeight);
    last = -1;
  };
  layout();
  new ResizeObserver(layout).observe(sec);
  wide.addEventListener('change', layout);
  addEventListener('load', layout);

  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  return () => {
    if (!on) return;
    top = sec.getBoundingClientRect().top + scrollY;
    const p = Math.min(1, Math.max(0, (scrollY - top) / span));
    if (Math.abs(p - last) < 0.0005) return;
    last = p;
    press.style.setProperty('--glow', String(Math.min(1, p * 6) * (1 - Math.max(0, p - 0.9) * 10)));
    cards.forEach((c, i) => {
      const t = Math.min(1, Math.max(0, (p - 0.03 - i * 0.13) / 0.3));
      const { dx, dy, h } = d[i];
      if (t <= 0) { c.style.opacity = '0'; c.style.transform = `translate(${dx}px, ${dy}px) rotateX(-80deg) scale(.5)`; c.classList.remove('on'); return; }
      // Phase 1: aus dem Schlitz herausdrucken (aufklappen), Phase 2: im Bogen auf den Platz fliegen
      const a = Math.min(1, t / 0.4), b = ease(Math.max(0, (t - 0.4) / 0.6));
      const ox = dx * (1 - b);
      const oy = (dy + h * 0.12 * a) * (1 - b);
      const bow = Math.sin(Math.PI * b) * (i - (n - 1) / 2) * 14; // leichter Bogen zur Seite
      const sc = (0.5 + 0.22 * a) * (1 - b) + b;
      const rx = (1 - a) * -80;
      const rz = (1 - b) * (i - (n - 1) / 2) * 3.2 * a;
      c.style.opacity = String(Math.min(1, a * 1.6));
      c.style.transform = `translate(${(ox + bow).toFixed(1)}px, ${oy.toFixed(1)}px) rotateX(${rx.toFixed(1)}deg) rotate(${rz.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      c.classList.toggle('on', t >= 1);
    });
  };
}
