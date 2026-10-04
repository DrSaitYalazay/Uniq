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

/** Grafiken (Viz) und Abschnitte mit [data-rv] einmal beim Erscheinen einblenden. */
export function initViz() {
  if (reduced || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('viz-anim');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add(e.target.hasAttribute('data-viz') ? 'on' : 'rv-in');
      io.unobserve(e.target);
    }
  }, { threshold: 0.25 });
  document.querySelectorAll<HTMLElement>('[data-viz]').forEach((v) => {
    if (v.closest('[data-stage]')) return;
    if (v.closest('.belt')) { v.classList.add('on'); return; } // im laufenden Band sofort fertig
    io.observe(v);
  });
  // Abschnitte auf Unterseiten: nur unterhalb des ersten Bildschirms (nichts blitzt auf)
  document.querySelectorAll<HTMLElement>('[data-rv]').forEach((el) => {
    if (el.getBoundingClientRect().top < innerHeight * 0.9) return;
    el.classList.add('rv');
    io.observe(el);
  });
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
 * Drehauswahl der Regelwerke (Quick-Check, 3D-Ring) und Band der Funktionen.
 * Beide bewegen sich ständig langsam weiter. Sie halten nur an, solange der Zeiger
 * auf einer Karte liegt oder eine Karte den Fokus hat. Pfeile springen um eine Karte,
 * danach geht die Bewegung weiter. Bewegung nur, solange der Bereich sichtbar ist.
 * Bei reduzierter Bewegung: CSS zeigt ein Raster bzw. eine waagerecht scrollbare Reihe.
 */
export function initCarousel() {
  if (reduced) {
    document.querySelectorAll<HTMLElement>('[data-belt]').forEach((belt) => {
      const sec = belt.closest('section');
      sec?.querySelectorAll<HTMLButtonElement>('[data-belt-go]').forEach((b) => b.addEventListener('click', () => belt.scrollBy({ left: Number(b.dataset.beltGo) * 320 })));
    });
    return;
  }
  document.querySelectorAll<HTMLElement>('[data-carousel]').forEach(setupRing);
  document.querySelectorAll<HTMLElement>('[data-belt]').forEach(setupBelt);
}

function whenVisible(el: HTMLElement, cb: (v: boolean) => void) {
  new IntersectionObserver((e) => cb(e[0].isIntersecting), { rootMargin: '100px 0px' }).observe(el);
}

function setupRing(car: HTMLElement) {
  const ring = car.querySelector<HTMLElement>('.ring');
  if (!ring) return;
  const items = Array.from(ring.querySelectorAll<HTMLElement>('.ring-item'));
  const step = 360 / items.length;
  const speed = 9; // Grad pro Sekunde, eine Runde in 40 s
  let angle = 0, target: number | null = null, hold = 0, paused = false, visible = false, raf = 0, last = 0;
  ring.classList.add('js');
  const frame = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000 || 0);
    last = now;
    if (target !== null) {
      angle += (target - angle) * Math.min(1, dt * 6);
      if (Math.abs(target - angle) < 0.05) { angle = target; target = null; hold = now + 1500; }
    } else if (!paused && now > hold) angle -= speed * dt;
    ring.style.transform = `rotateY(${angle.toFixed(3)}deg)`;
    raf = visible ? requestAnimationFrame(frame) : 0;
  };
  whenVisible(car, (v) => { visible = v; if (v && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } });
  const turnTo = (t: number) => {
    while (t - angle > 180) t -= 360;
    while (t - angle < -180) t += 360;
    target = t;
  };
  items.forEach((it, k) => {
    it.addEventListener('pointerenter', () => { paused = true; });
    it.addEventListener('pointerleave', () => { paused = false; hold = performance.now() + 600; });
    it.addEventListener('focusin', () => { paused = true; turnTo(-k * step); });
    it.addEventListener('focusout', () => { paused = false; });
  });
  car.querySelectorAll<HTMLButtonElement>('[data-car]').forEach((b) => b.addEventListener('click', () => {
    turnTo(Math.round((target ?? angle) / step) * step - Number(b.dataset.car) * step);
  }));
}

function setupBelt(belt: HTMLElement) {
  const track = belt.querySelector<HTMLElement>('.belt-track');
  if (!track) return;
  const originals = Array.from(track.children) as HTMLElement[];
  // zweite Reihe für den nahtlosen Übergang (für Bildschirmleser und Tastatur verborgen)
  originals.forEach((li) => {
    const c = li.cloneNode(true) as HTMLElement;
    c.setAttribute('aria-hidden', 'true');
    c.setAttribute('inert', '');
    track.append(c);
  });
  belt.classList.add('js');
  const speed = 26; // Pixel pro Sekunde
  let x = 0, target: number | null = null, hold = 0, paused = false, visible = false, raf = 0, last = 0;
  const setW = () => track.scrollWidth / 2;
  const cardW = () => originals[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || '0');
  const wrap = () => { const w = setW(); if (x <= -w) { x += w; if (target !== null) target += w; } if (x > 0) { x -= w; if (target !== null) target -= w; } };
  const frame = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000 || 0);
    last = now;
    if (target !== null) {
      x += (target - x) * Math.min(1, dt * 6);
      if (Math.abs(target - x) < 0.5) { x = target; target = null; hold = now + 1500; }
    } else if (!paused && now > hold) x -= speed * dt;
    wrap();
    track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    raf = visible ? requestAnimationFrame(frame) : 0;
  };
  whenVisible(belt, (v) => { visible = v; if (v && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } });
  track.addEventListener('pointerover', (e) => { if ((e.target as Element).closest('.belt-item')) paused = true; });
  track.addEventListener('pointerleave', () => { paused = false; hold = performance.now() + 600; });
  track.addEventListener('focusin', (e) => {
    paused = true;
    const li = (e.target as Element).closest<HTMLElement>('.belt-item');
    if (!li) return;
    const r = li.getBoundingClientRect(), br = belt.getBoundingClientRect();
    if (r.left < br.left + 16 || r.right > br.right - 16) target = x - (r.left - br.left - 24);
  });
  track.addEventListener('focusout', () => { paused = false; });
  belt.closest('section')?.querySelectorAll<HTMLButtonElement>('[data-belt-go]').forEach((b) => b.addEventListener('click', () => {
    const w = cardW();
    const base = target ?? x;
    target = Math.round(base / w) * w - Number(b.dataset.beltGo) * w;
  }));
}
