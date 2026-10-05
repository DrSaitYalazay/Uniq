/**
 * Zentrale Konstanten der Website. Hier ändern, nirgendwo sonst.
 */
export const SITE_URL = 'https://uniqsuite.cyberwerk.online';
/** Produkt-App (Anmeldung). Sprache wird als ?lang=de|en angehängt. */
export const LOGIN_URL = 'https://uniq.cyberwerk.online';
/**
 * Externes Buchungstool für Demos. TODO: URL eintragen, sobald vorhanden.
 * Solange null, verweist „Demo vereinbaren“ auf CONTACT_EMAIL.
 */
export const DEMO_URL: string | null = null;
export const CONTACT_EMAIL = 'info@cyberwerksuite.com';

export type Lang = 'de' | 'en';

export const loginHref = (lang: Lang) => `${LOGIN_URL}/?lang=${lang}`;
export const demoHref = (lang: Lang) =>
  DEMO_URL ??
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    lang === 'de' ? 'UniqSuite – Demo vereinbaren' : 'UniqSuite – book a demo',
  )}`;

/** Werbespot auf Bunny Stream (Bibliothek 760752). Geladen wird der Player erst nach Klick. */
export const FILM_HOST = 'https://player.mediadelivery.net';
export const FILM = {
  de: { id: '8c83cc58-c915-47b8-b414-b854e7300329', dur: '2:40' },
  en: { id: '7542f680-323d-42ab-85eb-0422ec717900', dur: '2:25' },
} as const;
export const filmSrc = (lang: Lang) => `${FILM_HOST}/embed/760752/${FILM[lang].id}?autoplay=true&preload=true&responsive=true&rememberPosition=false`;
