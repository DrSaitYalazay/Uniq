/**
 * Plattformfilm: Das Vorschaubild kommt vom eigenen Server. Erst der Klick auf die Karte
 * (oder auf „Film ansehen“ im Hero) lädt den Bunny-Player an derselben Stelle und startet ihn.
 */
import { state } from './state';

export function initFilm() {
  const card = document.querySelector<HTMLElement>('[data-film-card]');
  if (!card) return;
  const play = () => {
    if (card.classList.contains('on')) return;
    const f = document.createElement('iframe');
    f.src = card.dataset.filmUrl!;
    f.title = card.dataset.filmTitle || 'Video';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    card.classList.add('on');
    card.removeAttribute('role');
    card.removeAttribute('tabindex');
    card.appendChild(f);
    // Läuft der Film, tritt die Abschnittsleiste rechts zurück (sie lag über den Player-Tasten, z. B. Vollbild)
    const sec = card.closest('section') ?? card;
    new IntersectionObserver(([e]) => document.documentElement.classList.toggle('film-on', e.isIntersecting), { threshold: 0.15 }).observe(sec);
  };
  card.addEventListener('click', play);
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } });
  // „Film ansehen“ im Hero: zur Karte fahren und dort abspielen
  document.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-film]');
    if (!b) return;
    e.preventDefault();
    const sec = document.getElementById('film');
    if (state.lenis && sec) state.lenis.scrollTo(sec, { offset: -80, duration: 1.2 });
    else sec?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(play, 700);
  });
}
