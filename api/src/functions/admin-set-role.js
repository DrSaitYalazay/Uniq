// Admin-only: bir kullanıcıya rol verir/alır.
import { requireUser, asService, json, requireAdminAccess } from './_shared.js';

const VALID = ['admin', 'pro', 'premium', 'xl', 'user', 'student', 'lecturer'];

export default async function adminSetRole(req, res) {
  const claims = requireUser(req, res); if (!claims) return;
  // Rolle + (falls eingeschaltet) Admin-MFA-Pflicht.
  if (!(await requireAdminAccess(claims, res))) return;

  const { user_id, role, grant } = req.body || {};
  if (!user_id || !VALID.includes(role)) return json(res, 400, { error: 'Geçersiz parametre' });
  // Kendini admin'likten çıkarıp kilitlenmeyi önle
  if (user_id === claims.sub && role === 'admin' && grant === false) {
    return json(res, 400, { error: 'Kendi admin yetkinizi kaldıramazsınız' });
  }
  try {
    await asService(async (c) => {
      if (grant) {
        await c.query('INSERT INTO public.user_roles(user_id, role) VALUES ($1,$2) ON CONFLICT (user_id, role) DO NOTHING', [user_id, role]);
      } else {
        await c.query('DELETE FROM public.user_roles WHERE user_id=$1 AND role=$2', [user_id, role]);
      }
    });
    return json(res, 200, { ok: true });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
}
