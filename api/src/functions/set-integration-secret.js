// Tenant kapsamlı sır saklar (INT_XXX_* anahtarları). integration_secrets tablosu.
import { requireUser, asService, json } from './_shared.js';

export default async function setIntegrationSecret(req, res) {
  const claims = requireUser(req, res); if (!claims) return;
  const userId = claims.sub;
  const { key, value } = req.body || {};
  if (typeof key !== 'string' || typeof value !== 'string') return json(res, 400, { error: 'key/value required' });
  if (!/^INT_[A-Z0-9_]+$/.test(key)) return json(res, 400, { error: 'invalid key format' });
  try {
    await asService((c) =>
      c.query(
        `INSERT INTO public.integration_secrets(user_id, key, value) VALUES ($1,$2,$3)
         ON CONFLICT (user_id, key) DO UPDATE SET value=EXCLUDED.value`,
        [userId, key, value]));
    return json(res, 200, { ok: true });
  } catch (e) {
    return json(res, 500, { error: `secret store failed: ${e.message}` });
  }
}
