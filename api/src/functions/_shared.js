// Edge function'lar için ortak yardımcılar
import { verifyAccessToken } from '../lib/jwt.js';
import { asService as asServiceInternal } from '../db.js';
export { asService, withClaims } from '../db.js';
export { enqueueEmail } from '../lib/email.js';

export function bearerClaims(req) {
  const m = (req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  return verifyAccessToken(m[1]);
}

export function requireUser(req, res) {
  const c = bearerClaims(req);
  if (!c || !c.sub) { res.status(401).json({ error: 'Unauthorized' }); return null; }
  return c;
}

export const json = (res, status, body) => res.status(status).json(body);

// ── Admin-MFA-Pflicht (db/seeds/admin_mfa_pflicht.sql) ──────────────────────
// Im Dienst-Kontext sieht has_role() kein aal; deshalb prüft der Server es hier
// selbst. Fehlt die Einstellung (Seed noch nicht gelaufen), gilt: Pflicht AUS.
export const MFA_REQUIRED_BODY = {
  error: 'Für Admin-Funktionen ist die Zwei-Faktor-Anmeldung (MFA) Pflicht. Bitte mit dem zweiten Faktor anmelden bzw. MFA in den Einstellungen einrichten. / Yönetici işlemleri için MFA zorunlu.',
  code: 'mfa_required',
};

export async function adminMfaRequired() {
  try {
    return await asServiceInternal(async (c) => {
      const r = await c.query("SELECT (value->>'enabled')::boolean AS on FROM public.platform_settings WHERE key='admin_mfa_required'");
      return r.rows[0]?.on === true;
    });
  } catch { return false; }
}

/** 'ok' | 'forbidden' | 'mfa' — Rolle UND (falls Pflicht) zweiter Faktor. */
export async function adminAccess(claims) {
  const isAdmin = await asServiceInternal(async (c) =>
    (await c.query('SELECT public.has_role(_user_id => $1, _role => $2) AS r', [claims.sub, 'admin'])).rows[0]?.r);
  if (!isAdmin) return 'forbidden';
  if (claims.aal !== 'aal2' && await adminMfaRequired()) return 'mfa';
  return 'ok';
}

/** Antwortet selbst (403) und gibt false zurück, wenn der Aufrufer kein nutzbarer Admin ist. */
export async function requireAdminAccess(claims, res) {
  const a = await adminAccess(claims);
  if (a === 'forbidden') { res.status(403).json({ error: 'Forbidden' }); return false; }
  if (a === 'mfa') { res.status(403).json(MFA_REQUIRED_BODY); return false; }
  return true;
}
