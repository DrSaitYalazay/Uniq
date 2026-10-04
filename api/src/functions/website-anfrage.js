// ============================================================================
// Demo-Anfrage aus der Marketing-Website (uniqsuite.cyberwerk.online).
// ----------------------------------------------------------------------------
// Öffentlich (ohne Anmeldung). Die Website schickt das Formular an ihren
// eigenen Pfad /api/anfrage; ihr Caddy reicht es an diese Funktion weiter.
// Ergebnis ist genau EINE Mail an das Vertriebspostfach (WEBSITE_ANFRAGE_TO,
// Standard info@cyberwerksuite.com) mit Reply-To = Absender. Der Absender
// selbst bekommt KEINE Mail: sonst wäre das Formular ein Werkzeug, um
// beliebigen Adressen Post von unserem Server zu schicken.
//
// Schutz gegen Missbrauch, ohne CAPTCHA (kein Drittanbieter, keine Cookies):
//   - Honeypot-Feld "website" (für Menschen unsichtbar) und Mindestdauer
//     zwischen Öffnen und Absenden: Treffer bekommen dieselbe Erfolgsantwort,
//     es wird aber nichts verschickt.
//   - Bremse in der DB (auth.login_attempts, kind='anfrage'): je IP, je
//     Adresse und insgesamt pro Tag. In der DB statt im Speicher, damit ein
//     Neustart die Zähler nicht leert.
//   - Strenge Prüfung aller Felder; Steuerzeichen werden entfernt (keine
//     Header-Injektion über Betreff oder Namen).
//
// Gespeichert wird nur, was die Bremse braucht (Adresse, IP, Zeit; 30 Tage) — Name,
// Firma und Telefon stehen ausschließlich in der Mail-Warteschlange und werden
// dort nach dem Versand gelöscht (worker/email-worker.js).
// ============================================================================
import { asService, json } from './_shared.js';
import { clientIp } from '../lib/login-throttle.js';

const TO = process.env.WEBSITE_ANFRAGE_TO || 'info@cyberwerksuite.com';
const KIND = 'anfrage';
const IP_MAX_PER_HOUR = 5;
const EMAIL_MAX_PER_DAY = 3;
const TOTAL_MAX_PER_DAY = 200;
const MIN_FILL_MS = 2500;

// Gängige Freemail-Anbieter (DACH + international). Die Website verlangt eine
// geschäftliche Adresse; dieselbe Liste prüft der Browser vorab.
export const FREEMAIL = new Set([
  'gmail.com', 'googlemail.com', 'gmx.de', 'gmx.net', 'gmx.at', 'gmx.ch', 'gmx.com',
  'web.de', 't-online.de', 'freenet.de', 'arcor.de', 'online.de', 'email.de', 'mail.de',
  'posteo.de', 'posteo.net', 'mailbox.org', 'outlook.com', 'outlook.de', 'hotmail.com',
  'hotmail.de', 'live.com', 'live.de', 'msn.com', 'yahoo.com', 'yahoo.de', 'ymail.com',
  'icloud.com', 'me.com', 'mac.com', 'aol.com', 'aol.de', 'proton.me', 'protonmail.com',
  'protonmail.ch', 'tutanota.com', 'tutanota.de', 'tuta.io', 'zoho.com', 'yandex.com',
  'yandex.ru', 'mail.ru', 'bluewin.ch', 'gmx.li', 'kabelmail.de', 'vodafonemail.de',
]);

const EMAIL_RE = /^[A-Za-z0-9._%+-]{1,64}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;
const PHONE_RE = /^\+?[0-9][0-9 ()/.-]{4,30}[0-9]$/;

/** Text säubern: Steuerzeichen (inkl. CR/LF) raus, Leerraum zusammenfassen. */
export function clean(v, max) {
  const s = String(v ?? '').replace(/[\u0000-\u001F\u007F-\u009F\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim();
  return s.length > max ? null : s;
}

/** Prüft die Eingaben. Gibt { data } oder { error: '<feld>' } zurück. */
export function validate(body) {
  const company = clean(body?.company, 160);
  const firstName = clean(body?.firstName, 80);
  const lastName = clean(body?.lastName, 80);
  const email = clean(body?.email, 254);
  const phone = clean(body?.phone, 40);
  const lang = body?.lang === 'en' ? 'en' : 'de';
  if (!company || company.length < 2) return { error: 'company' };
  if (!firstName) return { error: 'firstName' };
  if (!lastName) return { error: 'lastName' };
  if (!email || !EMAIL_RE.test(email)) return { error: 'email' };
  const domain = email.split('@')[1].toLowerCase();
  if (FREEMAIL.has(domain)) return { error: 'email_business' };
  if (phone === null || (phone && !PHONE_RE.test(phone))) return { error: 'phone' };
  return { data: { company, firstName, lastName, email, emailLower: email.toLowerCase(), phone, lang } };
}

async function counts(c, ip, emailLower) {
  const r = await c.query(
    `SELECT
       count(*) FILTER (WHERE ip = $2 AND created_at > now() - interval '1 hour')          AS by_ip,
       count(*) FILTER (WHERE email_lower = $3 AND created_at > now() - interval '1 day')  AS by_email,
       count(*) FILTER (WHERE created_at > now() - interval '1 day')                       AS total
     FROM auth.login_attempts WHERE kind = $1 AND created_at > now() - interval '1 day'`,
    [KIND, ip, emailLower]);
  const row = r.rows[0] || {};
  return { byIp: Number(row.by_ip || 0), byEmail: Number(row.by_email || 0), total: Number(row.total || 0) };
}

export default async function websiteAnfrage(req, res) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  // Bot-Filter: still "erfolgreich", damit Bots nichts lernen.
  const filled = Number(body.elapsedMs);
  if (String(body.website || '') !== '' || !Number.isFinite(filled) || filled < MIN_FILL_MS) {
    return json(res, 200, { ok: true });
  }

  const v = validate(body);
  if (v.error) return json(res, 400, { error: 'invalid', field: v.error });
  const d = v.data;
  const ip = clientIp(req);

  try {
    const limited = await asService(async (c) => {
      // Speicherbegrenzung (Art. 5 Abs. 1 lit. e DSGVO): Bremsdaten nach 30 Tagen löschen
      await c.query("DELETE FROM auth.login_attempts WHERE kind = $1 AND created_at < now() - interval '30 days'", [KIND]);
      const n = await counts(c, ip, d.emailLower);
      if (n.byIp >= IP_MAX_PER_HOUR || n.byEmail >= EMAIL_MAX_PER_DAY || n.total >= TOTAL_MAX_PER_DAY) return true;
      await c.query(
        'INSERT INTO auth.login_attempts(email_lower, ip, kind, successful) VALUES ($1,$2,$3,true)',
        [d.emailLower, ip, KIND]);
      // Anders als enqueueEmail() (verschluckt Fehler) muss hier ein Fehler
      // ankommen: die Website zeigt dann die direkte Mail-Adresse an.
      await c.query('SELECT public.enqueue_email($1, $2::jsonb)', ['transactional_emails', JSON.stringify({
        template_name: 'website-anfrage',
        recipient_email: TO,
        reply_to: d.email,
        variables: {
          company: d.company, firstName: d.firstName, lastName: d.lastName,
          email: d.email, phone: d.phone, lang: d.lang,
          receivedAt: new Date().toISOString(),
        },
      })]);
      return false;
    });
    if (limited) return json(res, 429, { error: 'rate_limited' });
    return json(res, 200, { ok: true });
  } catch (e) {
    console.error('[website-anfrage] fehlgeschlagen:', e.message);
    return json(res, 503, { error: 'unavailable' });
  }
}
