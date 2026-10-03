// ============================================================================
// cy — Anmeldebremse (Konto-/IP-Sperre, MFA- und Wiederherstellungs-Limit)
// ----------------------------------------------------------------------------
// Vorher gab es KEINERLEI Begrenzung: ein Skript konnte beliebig viele
// Passwörter, 6-stellige TOTP-Codes oder Reset-Mails durchprobieren.
//
// Warum die Zählung in der DB (auth.login_attempts) liegt und nicht im Prozess-
// speicher: ein Neustart/Deploy würde einen In-Memory-Zähler leeren und dem
// Angreifer seine Versuche schenken; ausserdem ist eine Sperre nur über eine
// persistente Spur im Audit nachweisbar (GRC-Anforderung).
// ============================================================================
import { asService } from '../db.js';

// ---- Grenzwerte ------------------------------------------------------------
const WINDOW_MIN = 15;          // Beobachtungsfenster für Fehlversuche (Konto/IP/MFA)
const ACCOUNT_MAX_FAILS = 5;    // Fehlversuche je Konto im Fenster → Sperre
const IP_MAX_FAILS = 20;        // Fehlversuche je IP im Fenster → 429
const BASE_LOCK_MIN = 15;       // erste Sperrdauer
const MAX_LOCK_MIN = 60;        // Deckel; die Verdopplung endet hier
const HISTORY_HOURS = 24;       // Gedächtnis für die Eskalationsstufe
const MFA_MAX_FAILS = 5;        // falsche TOTP-Codes je Nutzer im Fenster
const RECOVER_MAX = 5;          // Reset-Anfragen je E-Mail/IP
const RECOVER_WINDOW_MIN = 60;  // ... pro Stunde

// Neutral (deutsch + türkisch, wie die übrigen Auth-Meldungen): die Antwort darf
// NICHT verraten, ob es die E-Mail gibt — sonst wäre die Sperre selbst ein
// Enumerations-Orakel ("gesperrt" ⇒ Konto existiert).
export const THROTTLE_MESSAGE =
  'Zu viele Versuche. Bitte später erneut versuchen. / Çok fazla deneme. Lütfen daha sonra tekrar deneyin.';

/**
 * Echte Client-IP. Die App läuft hinter nginx UND Caddy — ohne XFF-Auswertung
 * wäre `req.ip` die Adresse des Reverse-Proxys, alle Nutzer teilten sich also
 * eine IP und die IP-Bremse würde entweder nie oder für alle greifen.
 * Hinweis: der erste XFF-Eintrag stammt letztlich vom Client und ist fälschbar;
 * die IP-Regel ist deshalb nur das Netz unter der (nicht fälschbaren) Kontoregel.
 */
export function clientIp(req) {
  const xff = req.headers?.['x-forwarded-for'];
  const raw = Array.isArray(xff) ? xff[0] : xff;
  if (typeof raw === 'string' && raw.trim()) {
    const first = raw.split(',')[0].trim();
    if (first) return first.slice(0, 64);
  }
  return String(req.ip || req.socket?.remoteAddress || 'unknown').slice(0, 64);
}

/** Ein Versuch = eine Zeile. `kind`: password | mfa | recover. */
export async function recordAttempt({ emailLower, ip, kind = 'password', successful = false }) {
  try {
    await asService((c) => c.query(
      'INSERT INTO auth.login_attempts(email_lower, ip, kind, successful) VALUES ($1,$2,$3,$4)',
      [String(emailLower || '').slice(0, 320), ip || null, kind, !!successful]));
  } catch (e) {
    // Die Bremse darf die Anmeldung nicht verhindern, wenn die Tabelle (noch)
    // fehlt — runtime-ensure.sql legt sie an, der Deploy kann aber nachhängen.
    console.error('[login-throttle] Versuch nicht protokolliert:', e.message);
  }
}

const secsUntil = (ms) => Math.max(1, Math.ceil((ms - Date.now()) / 1000));

/**
 * Sperrfenster eines Kontos aus der reinen Versuchshistorie ableiten (kein
 * zusätzlicher Zustand, dadurch neustart- und mehrinstanzenfest).
 * 5 Fehler im 15-Minuten-Fenster → Sperre; jede weitere Runde verdoppelt die
 * Dauer (15 → 30 → 60), gedeckelt bei 60 Minuten.
 * @param {number[]} failTimes aufsteigende Zeitstempel (ms) der Fehlversuche
 * @returns {number} Ende der Sperre in ms (0 = keine Sperre)
 */
function accountLockUntil(failTimes) {
  const windowMs = WINDOW_MIN * 60_000;
  let rounds = 0;
  let lockUntil = 0;
  let bucket = [];
  for (const t of failTimes) {
    // Versuche WÄHREND einer laufenden Sperre zählen nicht mit — sonst könnte
    // ein Angreifer ein fremdes Konto durch Dauerfeuer endlos ausgesperrt halten.
    if (t < lockUntil) continue;
    bucket = bucket.filter((x) => t - x < windowMs);
    bucket.push(t);
    if (bucket.length >= ACCOUNT_MAX_FAILS) {
      rounds += 1;
      const minutes = Math.min(BASE_LOCK_MIN * 2 ** (rounds - 1), MAX_LOCK_MIN);
      lockUntil = t + minutes * 60_000;
      bucket = []; // nach dem Auslösen frisch zählen: die nächsten 5 Fehler = nächste Runde
    }
  }
  return lockUntil;
}

/**
 * Status für `POST /auth/token?grant_type=password`.
 * @returns {{blocked: boolean, retryAfterSec: number, reason?: 'ip'|'account'}}
 */
export async function passwordThrottleStatus({ emailLower, ip }) {
  const free = { blocked: false, retryAfterSec: 0 };
  try {
    // --- IP-Regel: 20 Fehlversuche in 15 Minuten ---------------------------
    if (ip) {
      const ipRows = await asService(async (c) => (await c.query(
        `SELECT created_at FROM auth.login_attempts
          WHERE ip = $1 AND kind = 'password' AND successful = false
            AND created_at > now() - make_interval(mins => $2)
          ORDER BY created_at DESC LIMIT $3`,
        [ip, WINDOW_MIN, IP_MAX_FAILS])).rows);
      if (ipRows.length >= IP_MAX_FAILS) {
        // Frei wird die IP, sobald der älteste dieser 20 Treffer aus dem Fenster fällt.
        const oldest = new Date(ipRows[ipRows.length - 1].created_at).getTime();
        return { blocked: true, retryAfterSec: secsUntil(oldest + WINDOW_MIN * 60_000), reason: 'ip' };
      }
    }

    // --- Kontoregel: Fehlversuche SEIT der letzten erfolgreichen Anmeldung --
    if (!emailLower) return free;
    const rows = await asService(async (c) => (await c.query(
      `SELECT created_at FROM auth.login_attempts
        WHERE email_lower = $1 AND kind = 'password' AND successful = false
          AND created_at > now() - make_interval(hours => $2)
          AND created_at > COALESCE((
                SELECT max(created_at) FROM auth.login_attempts
                 WHERE email_lower = $1 AND kind = 'password' AND successful = true),
                'epoch'::timestamptz)
        ORDER BY created_at`,
      [emailLower, HISTORY_HOURS])).rows);
    const lockUntil = accountLockUntil(rows.map((r) => new Date(r.created_at).getTime()));
    if (lockUntil > Date.now()) {
      return { blocked: true, retryAfterSec: secsUntil(lockUntil), reason: 'account' };
    }
    return free;
  } catch (e) {
    // Fail-open: eine defekte Bremse darf keine Anmeldung blockieren (sonst wäre
    // sie selbst der Ausfall). Der Fehler gehört ins Log, nicht in die Antwort.
    console.error('[login-throttle] Prüfung fehlgeschlagen:', e.message);
    return free;
  }
}

/**
 * Status für `POST /auth/factors/:id/verify`.
 * Ein TOTP-Code hat nur 6 Stellen — ohne Bremse ist MFA in Minuten durchprobiert.
 * Wie beim Passwort setzt ein erfolgreicher Code den Zähler zurück.
 */
export async function mfaThrottleStatus(emailLower) {
  const free = { blocked: false, retryAfterSec: 0 };
  if (!emailLower) return free;
  try {
    const rows = await asService(async (c) => (await c.query(
      `SELECT created_at FROM auth.login_attempts
        WHERE email_lower = $1 AND kind = 'mfa' AND successful = false
          AND created_at > now() - make_interval(mins => $2)
          AND created_at > COALESCE((
                SELECT max(created_at) FROM auth.login_attempts
                 WHERE email_lower = $1 AND kind = 'mfa' AND successful = true),
                'epoch'::timestamptz)
        ORDER BY created_at DESC LIMIT $3`,
      [emailLower, WINDOW_MIN, MFA_MAX_FAILS])).rows);
    if (rows.length >= MFA_MAX_FAILS) {
      const oldest = new Date(rows[rows.length - 1].created_at).getTime();
      return { blocked: true, retryAfterSec: secsUntil(oldest + WINDOW_MIN * 60_000) };
    }
    return free;
  } catch (e) {
    console.error('[login-throttle] MFA-Prüfung fehlgeschlagen:', e.message);
    return free;
  }
}

/**
 * Status für `POST /auth/recover` — 5 Anfragen pro Stunde je E-Mail UND je IP,
 * gegen Mail-Flut auf ein fremdes Postfach und gegen Nutzer-Enumeration.
 * Gezählt wird JEDE Anfrage (nicht nur „Treffer"), sonst wäre die Tabelle selbst
 * ein Orakel dafür, welche Adressen existieren.
 */
export async function recoverThrottleStatus({ emailLower, ip }) {
  const free = { blocked: false, retryAfterSec: 0 };
  try {
    const count = async (column, value) => asService(async (c) => (await c.query(
      `SELECT created_at FROM auth.login_attempts
        WHERE ${column} = $1 AND kind = 'recover'
          AND created_at > now() - make_interval(mins => $2)
        ORDER BY created_at DESC LIMIT $3`,
      [value, RECOVER_WINDOW_MIN, RECOVER_MAX])).rows);

    for (const [column, value] of [['email_lower', emailLower], ['ip', ip]]) {
      if (!value) continue;
      const rows = await count(column, value);
      if (rows.length >= RECOVER_MAX) {
        const oldest = new Date(rows[rows.length - 1].created_at).getTime();
        return { blocked: true, retryAfterSec: secsUntil(oldest + RECOVER_WINDOW_MIN * 60_000) };
      }
    }
    return free;
  } catch (e) {
    console.error('[login-throttle] Recover-Prüfung fehlgeschlagen:', e.message);
    return free;
  }
}
