/** Umschalter hell/dunkel. Der Anfangszustand kommt aus /theme.js (läuft vor dem ersten Bild). */
export function initTheme() {
  const html = document.documentElement;
  const btns = [...document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')];
  const sync = () => btns.forEach((b) => b.setAttribute('aria-pressed', html.dataset.theme === 'light' ? 'true' : 'false'));
  const set = (light: boolean) => {
    html.dataset.theme = light ? 'light' : 'dark';
    try { localStorage.setItem('uq-theme', light ? 'light' : 'dark'); } catch { /* privater Modus */ }
    const m = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]'); if (m) m.content = light ? 'light' : 'dark';
    const c = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]'); if (c) c.content = light ? '#f4f6fb' : '#0a1226';
    sync();
    window.dispatchEvent(new CustomEvent('uq-theme', { detail: { light } }));
  };
  btns.forEach((b) => b.addEventListener('click', () => set(html.dataset.theme !== 'light')));
  sync();
}
