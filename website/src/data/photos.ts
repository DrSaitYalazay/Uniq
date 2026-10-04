/**
 * Bildmaterial (von Codex erzeugt, keine realen Teammitglieder – mit Ausnahme von 'founder').
 * Wird als Szenenbild verwendet, nie mit Namen oder als „unser Team“ beschriftet.
 */
export type Photo = { id: string; w: number; h: number; alt: { de: string; en: string } };
const P = (id: string, w: number, h: number, de: string, en: string): Photo => ({ id, w, h, alt: { de, en } });
export const photos = {
  leader: P('people-01', 1672, 941, 'Führungskraft am Besprechungstisch mit Laptop', 'Executive at a meeting table with a laptop'),
  relaxed: P('people-02', 1672, 941, 'Berater im Gespräch am Besprechungstisch', 'Consultant in conversation at a meeting table'),
  strategy: P('people-03', 1672, 941, 'Team bespricht Prioritäten am Konferenztisch', 'Team discussing priorities at a conference table'),
  ciso: P('people-04', 1122, 1402, 'Sicherheitsverantwortliche im Büro', 'Security lead in the office'),
  consultant: P('people-05', 1122, 1402, 'Berater im Büro', 'Consultant in the office'),
  collab: P('people-06', 1536, 1024, 'Zwei Kolleginnen arbeiten gemeinsam am Laptop', 'Two colleagues working together on a laptop'),
  audit: P('people-07', 1672, 941, 'Auditgespräch mit Unterlagen am Tisch', 'Audit conversation with documents on the table'),
  briefing: P('people-08', 1672, 941, 'Bericht an die Geschäftsleitung', 'Briefing for management'),
  womanWindow: P('people-09', 1122, 1402, 'Managerin am Fenster', 'Manager by the window'),
  manWindow: P('people-10', 1122, 1402, 'Manager am Fenster', 'Manager by the window'),
  break: P('people-11', 1672, 941, 'Team im Gespräch in der Lounge', 'Team talking in the lounge'),
  it: P('people-12', 1536, 1024, 'IT-Spezialistin am Bildschirm', 'IT specialist at a screen'),
  duo: P('people-14', 1536, 1024, 'Zwei Kollegen mit Unterlagen auf dem Weg zur Besprechung', 'Two colleagues with documents on their way to a meeting'),
  stage: P('people-16', 1672, 941, 'Fachvortrag vor vollem Saal', 'Expert talk in front of a full room'),
  group: P('people-15', 1672, 941, 'Gruppe von Fachleuten in einer Lounge', 'Group of professionals in a lounge'),
} as const;
export const photoSrc = (p: Photo) => ({
  src: `/img/${p.id}-800.webp`,
  srcset: `/img/${p.id}-800.webp 800w, /img/${p.id}-1600.webp ${Math.min(1600, p.w)}w`,
});
