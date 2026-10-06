/** Umschalter hell/dunkel. Der Anfangszustand kommt aus /theme.js (läuft vor dem ersten Bild). */
/** Standbilder der 3D-Welt: helle Fassung (…-dl / …-ml.webp, wie world/ink.ts gezeichnet) */
function stills(light: boolean) {
  const sw = (v: string) => v.replace(/(\/img\/still\/[a-z]+-[dm])l?\.webp/g, light ? '$1l.webp' : '$1.webp');
  document.querySelectorAll<HTMLImageElement>('img[src*="/img/still/"]').forEach((i) => { const n = sw(i.getAttribute('src')!); if (n !== i.getAttribute('src')) i.src = n; });
  document.querySelectorAll<HTMLSourceElement>('source[srcset*="/img/still/"]').forEach((s) => { const n = sw(s.getAttribute('srcset')!); if (n !== s.getAttribute('srcset')) s.srcset = n; });
  document.documentElement.classList.add('stills-ok');
}

export function initTheme() {
  const html = document.documentElement;
  const btns = [...document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')];
  const sync = () => btns.forEach((b) => b.setAttribute('aria-pressed', html.dataset.theme === 'light' ? 'true' : 'false'));
  const set = (light: boolean) => {
    html.dataset.theme = light ? 'light' : 'dark';
    try { localStorage.setItem('uq-theme', light ? 'light' : 'dark'); } catch { /* privater Modus */ }
    const m = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]'); if (m) m.content = light ? 'light' : 'dark';
    const c = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]'); if (c) c.content = light ? '#f7f8fa' : '#0a1226';
    sync();
    stills(light);
    window.dispatchEvent(new CustomEvent('uq-theme', { detail: { light } }));
  };
  btns.forEach((b) => b.addEventListener('click', () => set(html.dataset.theme !== 'light')));
  sync();
  stills(html.dataset.theme === 'light');
}
