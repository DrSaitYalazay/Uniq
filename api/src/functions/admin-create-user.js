// Admin-only: yeni kullanıcı oluşturur, otomatik başlangıç şifresi üretir ve döndürür.
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { requireUser, asService, json, requireAdminAccess } from './_shared.js';
import { passwordPolicyError, BCRYPT_COST } from '../lib/password-policy.js';

export default async function adminCreateUser(req, res) {
  const claims = requireUser(req, res); if (!claims) return;
  // Rolle + (falls eingeschaltet) Admin-MFA-Pflicht.
  if (!(await requireAdminAccess(claims, res))) return;

  const email = String(req.body?.email || '').trim().toLowerCase();
  const displayName = String(req.body?.display_name || '').trim();
  const roles = Array.isArray(req.body?.roles) ? req.body.roles : [];
  const withLicense = req.body?.license !== false; // Standard: mit Lizenz (Kunde)
  const SEATS = { basis: 1, pro: 5, enterprise: 10 };
  let plan = String(req.body?.plan || 'basis').trim().toLowerCase();
  if (!SEATS[plan]) plan = 'basis';
  const seats = SEATS[plan];
  if (!email || !email.includes('@')) return json(res, 400, { error: 'Geçerli bir e-posta gerekli' });

  try {
    const exists = await asService(async (c) =>
      (await c.query('SELECT 1 FROM auth.users WHERE lower(email)=lower($1)', [email])).rowCount);
    if (exists) return json(res, 409, { error: 'Bu e-posta zaten kayıtlı' });

    // Otomatik başlangıç şifresi (ör. Cws-a3f9c1b2e4d7f0)
    // A-15: 7 Zufallsbytes = 14 Hex-Zeichen, mit dem Präfix 18 Zeichen — damit
    // liegt das Start-Passwort selbst über der 12-Zeichen-Grenze. Vorher waren es
    // 14 Zeichen; das reichte zwar auch, lag aber ohne Puffer an der Grenze.
    const password = 'Uniq-' + crypto.randomBytes(7).toString('hex');
    // Dieselbe Richtlinie wie an den drei Nutzer-Endpunkten — hier als Zusicherung
    // gegen uns selbst: würde der Generator je gekürzt, flöge das sofort auf,
    // statt still Konten mit zu schwachem Start-Passwort anzulegen.
    const policyError = passwordPolicyError(password, { email });
    if (policyError) return json(res, 500, { error: 'Generiertes Start-Passwort verletzt die Richtlinie: ' + policyError });
    const hash = await bcrypt.hash(password, BCRYPT_COST);

    const user = await asService(async (c) => {
      const u = (await c.query(
        `INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, aud, role)
         VALUES ($1,$2,now(),$3,$4,'authenticated','authenticated') RETURNING id, email`,
        // must_change_password: Nutzer MUSS das Start-Passwort beim ersten Login ändern.
        [email, hash, { display_name: displayName || email, must_change_password: true }, { provider: 'email', providers: ['email'] }])).rows[0];
      // İsteğe bağlı ek roller (admin/pro/premium/xl/lecturer/student)
      const VALID = ['admin', 'pro', 'premium', 'xl', 'user', 'student', 'lecturer'];
      for (const role of roles) {
        if (VALID.includes(role)) {
          await c.query('INSERT INTO public.user_roles(user_id, role) VALUES ($1,$2) ON CONFLICT (user_id, role) DO NOTHING', [u.id, role]);
        }
      }
      // Lizenz: neuer Kunde = eigener Tenant → aktive Lizenz freischalten (Katalog-Zugriff).
      if (withLicense) {
        await c.query(
          `INSERT INTO public.tenant_licenses(tenant_id, plan, status, seat_limit)
           VALUES ($1, $2, 'active', $3)
           ON CONFLICT (tenant_id) DO UPDATE SET status='active', plan=EXCLUDED.plan, seat_limit=EXCLUDED.seat_limit, updated_at=now()`,
          [u.id, plan, seats]);
      }
      return u;
    });
    return json(res, 200, { user: { id: user.id, email: user.email }, password });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
}
