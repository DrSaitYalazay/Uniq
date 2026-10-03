// Admin-only: bir kullanıcıyı ve tüm tenant verisini kalıcı siler.
import { requireUser, asService, json, requireAdminAccess } from './_shared.js';

const TENANT_TABLES = ['answers', 'incidents', 'audit_findings', 'audits', 'assets', 'company_profiles', 'user_tool_data'];

export default async function adminDeleteUser(req, res) {
  const claims = requireUser(req, res); if (!claims) return;
  const callerId = claims.sub;
  try {
    // Rolle + (falls eingeschaltet) Admin-MFA-Pflicht.
    if (!(await requireAdminAccess(claims, res))) return;

    const targetUserId = typeof req.body?.user_id === 'string' ? req.body.user_id : '';
    if (!targetUserId) return json(res, 400, { error: 'user_id required' });
    if (targetUserId === callerId) return json(res, 400, { error: 'cannot delete your own account here' });

    const targetIsAdmin = await asService(async (c) =>
      (await c.query('SELECT public.has_role(_user_id => $1, _role => $2) AS r', [targetUserId, 'admin'])).rows[0]?.r);
    if (targetIsAdmin) return json(res, 400, { error: 'cannot delete an admin user' });

    await asService(async (c) => {
      for (const t of TENANT_TABLES) {
        await c.query(`DELETE FROM public."${t}" WHERE user_id=$1`, [targetUserId]).catch(() => {});
      }
      await c.query('DELETE FROM public.user_roles WHERE user_id=$1', [targetUserId]).catch(() => {});
      await c.query('DELETE FROM public.org_members WHERE user_id=$1', [targetUserId]).catch(() => {});
      await c.query('DELETE FROM public.profiles WHERE user_id=$1', [targetUserId]).catch(() => {});
      // auth.users silinince FK CASCADE ile bağlı satırlar da temizlenir
      await c.query('DELETE FROM auth.users WHERE id=$1', [targetUserId]);
    });
    return json(res, 200, { ok: true });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
}
