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
/** Stand der Inhalte (Broschüre, White Paper, Quick-Check). */
export const CONTENT_DATE = { de: 'Oktober 2026', en: 'October 2026' };

export type Lang = 'de' | 'en';

export const loginHref = (lang: Lang) => `${LOGIN_URL}/?lang=${lang}`;
export const demoHref = (lang: Lang) =>
  DEMO_URL ??
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    lang === 'de' ? 'UniqSuite – Demo vereinbaren' : 'UniqSuite – book a demo',
  )}`;
