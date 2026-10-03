// Admin-only: tüm kullanıcıları rolleriyle listeler.
import { requireUser, asService, json, requireAdminAccess } from './_shared.js';

export default async function adminListUsers(req, res) {
  const claims = requireUser(req, res); if (!claims) return;
  // Rolle + (falls eingeschaltet) Admin-MFA-Pflicht.
  if (!(await requireAdminAccess(claims, res))) return;
  try {
    const users = await asService(async (c) => (await c.query(`
      SELECT u.id, u.email, u.created_at, u.last_sign_in_at, u.banned_until,
             COALESCE(p.display_name, '') AS display_name,
             COALESCE(array_agg(r.role::text) FILTER (WHERE r.role IS NOT NULL), '{}') AS roles,
             (l.tenant_id IS NOT NULL) AS licensed,
             l.plan AS plan, l.seat_limit AS seat_limit,
             COALESCE((u.raw_user_meta_data->>'must_change_password')::boolean, false) AS must_change_password
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.user_id = u.id
        LEFT JOIN public.user_roles r ON r.user_id = u.id
        LEFT JOIN public.tenant_licenses l
               ON l.tenant_id = COALESCE(public.get_org_owner_id(u.id), u.id)
              AND l.status = 'active'
              AND (l.valid_until IS NULL OR l.valid_until > now())
       GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, u.banned_until, p.display_name, l.tenant_id
       ORDER BY u.created_at DESC`)).rows);
    return json(res, 200, { users });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
}
