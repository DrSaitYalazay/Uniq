// Admin-only: Lizenz (Katalog-Zugriff) eines Nutzers/Tenants freischalten oder sperren.
// tenant_licenses steuert public.has_catalog_access() → RLS auf allen Katalog-Tabellen.
import { requireUser, asService, json, requireAdminAccess } from './_shared.js';

export default async function adminSetLicense(req, res) {
  const claims = requireUser(req, res); if (!claims) return;
  // Rolle + (falls eingeschaltet) Admin-MFA-Pflicht.
  if (!(await requireAdminAccess(claims, res))) return;

  const SEATS = { basis: 1, pro: 5, enterprise: 10 };
  const userId = String(req.body?.user_id || '').trim();
  const active = req.body?.active !== false; // true = freischalten, false = sperren
  let plan = String(req.body?.plan || 'basis').trim().toLowerCase();
  if (!SEATS[plan]) plan = 'basis';
  const seats = SEATS[plan];
  if (!userId) return json(res, 400, { error: 'user_id gerekli' });

  try {
    await asService(async (c) => {
      // Tenant des Nutzers (Org-Owner oder er selbst).
      const t = (await c.query('SELECT COALESCE(public.get_org_owner_id($1), $1) AS tenant', [userId])).rows[0]?.tenant;
      if (active) {
        await c.query(
          `INSERT INTO public.tenant_licenses(tenant_id, plan, status, seat_limit)
           VALUES ($1, $2, 'active', $3)
           ON CONFLICT (tenant_id) DO UPDATE SET status='active', plan=EXCLUDED.plan, seat_limit=EXCLUDED.seat_limit, updated_at=now()`,
          [t, plan, seats]);
      } else {
        // Sperren statt löschen — Historie bleibt, sofort kein Katalog-Zugriff mehr.
        await c.query(
          `INSERT INTO public.tenant_licenses(tenant_id, plan, status, seat_limit)
           VALUES ($1, $2, 'suspended', $3)
           ON CONFLICT (tenant_id) DO UPDATE SET status='suspended', updated_at=now()`,
          [t, plan, seats]);
      }
    });
    return json(res, 200, { ok: true, active, plan, seat_limit: seats });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
}
