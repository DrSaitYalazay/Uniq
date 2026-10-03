// Davet token'ıyla yeni hesap oluşturur ve oturum döndürür.
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { asService, json } from './_shared.js';
import { signAccessToken, ACCESS_TTL } from '../lib/jwt.js';
import { passwordPolicyError, BCRYPT_COST } from '../lib/password-policy.js';

export default async function signupFromInvite(req, res) {
  const token = String(req.body?.token || '').trim();
  const password = String(req.body?.password || '');
  const displayName = String(req.body?.display_name || '').trim();
  const marketingConsent = Boolean(req.body?.marketing_consent);
  const marketingCategories = Array.isArray(req.body?.marketing_categories) ? req.body.marketing_categories : [];
  if (!token) return json(res, 400, { error: 'invalid_input' });

  try {
    const invite = await asService(async (c) =>
      (await c.query('SELECT id, email, status, expires_at FROM public.org_invitations WHERE token=$1', [token])).rows[0]);
    if (!invite) return json(res, 404, { error: 'invalid_token' });
    if (invite.status !== 'pending') return json(res, 400, { error: 'invite_' + invite.status });
    if (new Date(invite.expires_at) < new Date()) return json(res, 400, { error: 'expired' });

    const email = invite.email.toLowerCase();
    const existing = await asService(async (c) =>
      (await c.query('SELECT id FROM auth.users WHERE lower(email)=lower($1)', [email])).rows[0]);
    if (existing) return json(res, 409, { error: 'account_exists', email });

    // A-15: die Einladung ist die VIERTE Stelle, an der ein Nutzer sein eigenes
    // Passwort setzt. Hier stand bisher nur `length < 8` — wer eine Einladung
    // hatte, konnte die Richtlinie damit umgehen und ein 8-Zeichen-Konto anlegen.
    // Geprüft wird erst nach dem Einlösen der Einladung, damit die Meldung nichts
    // über gültige Token verrät.
    const policyError = passwordPolicyError(password, { email });
    if (policyError) return json(res, 400, { error: policyError });

    const hash = await bcrypt.hash(password, BCRYPT_COST);
    const user = await asService(async (c) =>
      (await c.query(
        `INSERT INTO auth.users(email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, aud, role)
         VALUES ($1,$2,now(),$3,$4,'authenticated','authenticated') RETURNING *`,
        [email, hash, { display_name: displayName || email }, { provider: 'email', providers: ['email'] }])).rows[0]);

    // Pazarlama onayı (profil handle_new_user trigger'ıyla oluşur)
    await asService((c) => c.query(
      `UPDATE public.profiles SET marketing_consent=$2, marketing_consent_date=now(),
              marketing_consent_categories=$3 WHERE user_id=$1`,
      [user.id, marketingConsent, marketingConsent ? marketingCategories : []]).catch(() => {}));

    // Oturum üret
    const access_token = signAccessToken(user);
    const refresh_token = crypto.randomBytes(32).toString('hex');
    // A-17: wie in auth.js wandert nur sha256(token) in die Tabelle. Bliebe hier
    // der Rohwert stehen, hätte der Einladungsweg als einziger weiter einlösbare
    // Klartext-Token in der DB liegen — ein Leck genügte für die Übernahme genau
    // dieser Sitzungen.
    await asService((c) => c.query(
      'INSERT INTO auth.refresh_tokens(token, user_id, expires_at) VALUES ($1,$2, now() + interval \'30 days\')',
      [crypto.createHash('sha256').update(refresh_token).digest('hex'), user.id]));
    const session = {
      access_token, token_type: 'bearer', expires_in: ACCESS_TTL,
      expires_at: Math.floor(Date.now() / 1000) + ACCESS_TTL, refresh_token,
      user: { id: user.id, email: user.email, user_metadata: user.raw_user_meta_data },
    };
    return json(res, 200, { success: true, session, email });
  } catch (e) {
    return json(res, 500, { error: String(e.message) });
  }
}
