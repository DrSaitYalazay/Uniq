// Plattform-Einstellungen für Admins. Bisher nur: Admin-MFA-Pflicht (ein/aus).
// POST /functions/admin-settings { action: 'get' }
// POST /functions/admin-settings { action: 'set', admin_mfa_required: boolean }
//
// Regeln:
//  - Lesen darf jeder Admin, auch ohne zweiten Faktor (er soll sehen, WARUM er
//    gesperrt ist).
//  - Ändern läuft über requireAdminAccess: ist die Pflicht EIN, braucht schon
//    das Ausschalten eine aal2-Sitzung — ein erbeutetes Passwort reicht nicht.
//  - Einschalten nur mit eingerichtetem UND in dieser Sitzung benutztem Faktor
//    (aal2), sonst sperrt sich der Admin selbst aus.
//  - Jede Änderung landet in auth.admin_actions.
import { requireUser, asService, json, adminAccess, requireAdminAccess, adminMfaRequired } from './_shared.js';

export default async function adminSettings(req, res) {
  const claims = requireUser(req, res); if (!claims) return;
  const action = req.body?.action || 'get';

  if (action === 'get') {
    if ((await adminAccess(claims)) === 'forbidden') return json(res, 403, { error: 'Forbidden' });
    const hasFactor = await asService(async (c) =>
      (await c.query("SELECT 1 FROM auth.mfa_factors WHERE user_id=$1 AND status='verified' LIMIT 1", [claims.sub])).rowCount > 0);
    return json(res, 200, {
      admin_mfa_required: await adminMfaRequired(),
      caller_aal: claims.aal || 'aal1',
      caller_has_factor: hasFactor,
    });
  }

  if (action === 'set') {
    const want = req.body?.admin_mfa_required;
    if (typeof want !== 'boolean') return json(res, 400, { error: 'Geçersiz parametre' });
    if (!(await requireAdminAccess(claims, res))) return;
    if (want && claims.aal !== 'aal2') {
      return json(res, 400, {
        error: 'Zum Einschalten zuerst MFA einrichten und sich mit dem zweiten Faktor anmelden — sonst sperren Sie sich selbst aus. / Önce MFA kurun ve ikinci faktörle giriş yapın.',
        code: 'mfa_setup_first',
      });
    }
    try {
      await asService(async (c) => {
        await c.query(
          `INSERT INTO public.platform_settings (key, value, updated_at, updated_by)
           VALUES ('admin_mfa_required', jsonb_build_object('enabled', $1::boolean), now(), $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now(), updated_by = EXCLUDED.updated_by`,
          [want, claims.sub]);
        await c.query(
          `INSERT INTO auth.admin_actions(actor_id, target_user_id, action, reason, details)
           VALUES ($1, NULL, 'admin_mfa_required', $2, $3)`,
          [claims.sub, want ? 'eingeschaltet' : 'ausgeschaltet', JSON.stringify({ enabled: want, aal: claims.aal || 'aal1' })]);
      });
      return json(res, 200, { ok: true, admin_mfa_required: want });
    } catch (e) {
      return json(res, 500, { error: e.message });
    }
  }
  return json(res, 400, { error: 'unknown action' });
}
