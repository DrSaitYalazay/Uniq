// Admin-only: Konto einfrieren (sperren) oder entsperren — Alternative zum Löschen.
// freeze=true  → banned_until = weit in der Zukunft + aktive Sessions widerrufen.
// freeze=false → banned_until = NULL (Konto wieder aktiv).
import { requireUser, asService, json, requireAdminAccess } from './_shared.js';

export default async function adminSetBan(req, res) {
  const claims = requireUser(req, res); if (!claims) return;
  // Rolle + (falls eingeschaltet) Admin-MFA-Pflicht.
  if (!(await requireAdminAccess(claims, res))) return;

  const { user_id, freeze } = req.body || {};
  if (!user_id || typeof freeze !== 'boolean') return json(res, 400, { error: 'Geçersiz parametre' });
  // Selbst-Sperre verhindern (sonst sperrt sich der Admin aus).
  if (user_id === claims.sub) return json(res, 400, { error: 'Sie können Ihr eigenes Konto nicht einfrieren' });

  try {
    await asService(async (c) => {
      if (freeze) {
        // 100 Jahre in der Zukunft = dauerhaft eingefroren bis zur Entsperrung.
        await c.query("UPDATE auth.users SET banned_until = now() + interval '100 years' WHERE id=$1", [user_id]);
        // Laufende Sessions sofort beenden. revoked_reason hält fest, dass das
        // eine gewollte Sperre war — die Wiederverwendungserkennung in auth.js
        // wertet nur rotierte Token als Diebstahlsignal.
        await c.query("UPDATE auth.refresh_tokens SET revoked=true, revoked_reason='admin_ban' WHERE user_id=$1 AND revoked=false", [user_id]);
      } else {
        await c.query('UPDATE auth.users SET banned_until = NULL WHERE id=$1', [user_id]);
      }
    });
    return json(res, 200, { ok: true, frozen: freeze });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
}
