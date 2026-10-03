// ============================================================================
// cy — Auth servisi (Supabase GoTrue muadili, uygulamanın kullandığı yüzey)
//   signup / signInWithPassword / refresh / signOut / getUser / updateUser
//   resetPasswordForEmail + recovery / TOTP MFA (enroll, challenge, verify...)
// ============================================================================
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { asService } from '../db.js';
import { signAccessToken, verifyAccessToken, decodeAccessTokenUnsafe, ACCESS_TTL } from '../lib/jwt.js';
import { enqueueEmail } from '../lib/email.js';
import { passwordPolicyError, BCRYPT_COST } from '../lib/password-policy.js';
import {
  clientIp, recordAttempt, passwordThrottleStatus, mfaThrottleStatus,
  recoverThrottleStatus, THROTTLE_MESSAGE,
} from '../lib/login-throttle.js';

export const authRouter = Router();

const ISSUER_NAME = process.env.MFA_ISSUER || 'cy';
// Wiederherstellungs- und E-Mail-Wechsel-Link laufen nach 60 Minuten ab. Vorher
// galt ein einmal erzeugter recovery_token unbegrenzt: ein Jahre alter Link aus
// einem kompromittierten Postfach öffnete das Konto immer noch.
const RECOVERY_TTL_MIN = 60;
const EMAIL_CHANGE_TTL_MIN = 60;
const AUTO_CONFIRM = process.env.AUTH_AUTOCONFIRM !== 'false'; // e-posta doğrulaması yoksa true
// Produkt-/IP-Schutz: öffentliche Selbstregistrierung ist STANDARDMÄSSIG ZU.
// Sonst kann sich jeder anmelden und den (authenticated-lesbaren) Katalog abziehen.
// Der ERSTE Account (Bootstrap-Admin) wird ausnahmsweise zugelassen; danach ist
// Signup nur offen, wenn PUBLIC_SIGNUP=true gesetzt ist (sonst Admin/Einladung).
const PUBLIC_SIGNUP = process.env.PUBLIC_SIGNUP === 'true';
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);

// Kısa ömürlü MFA challenge'ları (in-memory; tek instance yeterli)
const challenges = new Map(); // challengeId -> { factorId, userId, expires }
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of challenges) if (v.expires < now) challenges.delete(k);
}, 60_000).unref?.();

// ---- yardımcılar -----------------------------------------------------------
function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    aud: u.aud || 'authenticated',
    role: u.role || 'authenticated',
    email: u.email,
    email_confirmed_at: u.email_confirmed_at,
    phone: u.phone || '',
    confirmed_at: u.email_confirmed_at,
    last_sign_in_at: u.last_sign_in_at,
    app_metadata: u.raw_app_meta_data || { provider: 'email', providers: ['email'] },
    user_metadata: u.raw_user_meta_data || {},
    created_at: u.created_at,
    updated_at: u.updated_at,
  };
}

async function makeSession(user, { aal = 'aal1' } = {}) {
  const access_token = signAccessToken(user, { aal });
  const refresh_token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + REFRESH_TTL_DAYS * 86400_000);
  // A-17: gespeichert wird NUR sha256(token); der Rohwert verlässt den Server
  // allein in dieser Antwort. Vorher lag der einlösbare Token im Klartext in der
  // DB — ein Backup, ein Dump oder eine Lücke im Gateway war damit unmittelbar
  // eine Sitzungsübernahme, ganz ohne Passwort und ohne MFA.
  await asService((c) =>
    c.query('INSERT INTO auth.refresh_tokens(token, user_id, expires_at) VALUES ($1,$2,$3)',
      [sha256Hex(refresh_token), user.id, expires]));
  return {
    access_token,
    token_type: 'bearer',
    expires_in: ACCESS_TTL,
    expires_at: Math.floor(Date.now() / 1000) + ACCESS_TTL,
    refresh_token,
    user: publicUser(user),
  };
}

// Konto eingefroren, wenn banned_until in der Zukunft liegt.
function isBanned(user) {
  return !!(user && user.banned_until && new Date(user.banned_until) > new Date());
}
async function getUserById(id) {
  return asService(async (c) => (await c.query('SELECT * FROM auth.users WHERE id=$1', [id])).rows[0]);
}
async function getUserByEmail(email) {
  return asService(async (c) =>
    (await c.query('SELECT * FROM auth.users WHERE lower(email)=lower($1)', [email])).rows[0]);
}
function bearerUserId(req) {
  const m = (req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const d = verifyAccessToken(m[1]);
  return d ? { id: d.sub, aal: d.aal } : null;
}
function fail(res, status, message) { return res.status(status).json({ error: { message } }); }

// Einheitliche Drosselungs-Antwort: 429 + Retry-After, immer dieselbe neutrale
// Meldung — egal ob Konto, IP oder MFA die Sperre ausgelöst hat.
function tooMany(res, retryAfterSec) {
  res.set('Retry-After', String(Math.max(1, Number(retryAfterSec) || 1)));
  return res.status(429).json({ error: { message: THROTTLE_MESSAGE } });
}

// Token werden nur noch als sha256-Hex gespeichert; der Rohwert verlässt den
// Server ausschliesslich per E-Mail-Link. Ein DB-Leck (Backup, Gateway-Lücke)
// gibt damit keine einlösbaren Links mehr her.
function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

// Vergleich ohne `=`-Prüfung auf Strings: ein früh abbrechender Stringvergleich
// verrät über die Laufzeit die Anzahl übereinstimmender Zeichen.
function timingSafeEqualHex(stored, candidate) {
  const a = Buffer.from(String(stored || ''), 'utf8');
  const b = Buffer.from(String(candidate || ''), 'utf8');
  if (a.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Hat der Nutzer bereits einen bestätigten zweiten Faktor?
async function hasVerifiedFactor(userId) {
  return asService(async (c) =>
    (await c.query("SELECT 1 FROM auth.mfa_factors WHERE user_id=$1 AND status='verified' LIMIT 1", [userId])).rowCount > 0);
}
const AAL2_REQUIRED_MESSAGE =
  'Bitte bestätigen Sie zuerst Ihren zweiten Faktor (MFA-Code). / Lütfen önce ikinci faktörünüzü doğrulayın.';

// A-18: EINE Antwort für beide Fälle — Adresse neu oder Adresse schon vergeben.
// Vorher stand hier „Bu e-posta zaten kayıtlı": damit war /auth/signup bei offener
// Registrierung ein Orakel, mit dem sich Adresslisten auf vorhandene Konten
// filtern liessen (Vorstufe für gezieltes Phishing und Credential-Stuffing).
const SIGNUP_NEUTRAL_MESSAGE =
  'Wenn die Registrierung möglich war, haben wir Ihnen eine E-Mail geschickt. Bitte prüfen Sie Ihr Postfach. / Kayıt mümkünse size bir e-posta gönderdik. Lütfen posta kutunuzu kontrol edin.';

// ---- signup ----------------------------------------------------------------
authRouter.post('/signup', async (req, res) => {
  const { email, password, data } = req.body || {};
  if (!email || !password) return fail(res, 400, 'E-posta ve şifre gerekli');
  // Registrierungs-Gate: nur offen wenn PUBLIC_SIGNUP=true ODER noch kein Nutzer
  // existiert (Bootstrap des ersten Admins). Sonst 403 — schützt das Produkt/IP.
  // Diese 403 verrät nichts über eine einzelne Adresse und bleibt unverändert.
  if (!PUBLIC_SIGNUP) {
    // Gesperrte Konten zählen nicht: das aus schema.sql stammende Demo-Konto ist
    // auf jeder Installation gesperrt (db/seeds/demo_konto_sperren.sql) und darf die
    // Erstregistrierung des Admins nicht blockieren.
    const anyUser = await asService((c) => c.query(
      'SELECT 1 FROM auth.users WHERE banned_until IS NULL OR banned_until <= now() LIMIT 1'));
    if (anyUser.rows.length) {
      return fail(res, 403, 'Registrierung ist geschlossen. Bitte wenden Sie sich an den Administrator. / Kayıt kapalı; yöneticinize başvurun.');
    }
  }
  // A-15: Richtlinie VOR der Existenzprüfung. Die Meldung hängt allein am
  // eingegebenen Passwort und verrät deshalb nichts über die Adresse.
  const policyError = passwordPolicyError(password, { email });
  if (policyError) return fail(res, 400, policyError);

  // Gehasht wird IMMER, auch wenn die Adresse längst vergeben ist. Das ist keine
  // Verschwendung, sondern Teil der Gleichbehandlung: bcrypt mit Kosten 12 ist
  // der mit Abstand teuerste Schritt (~250 ms). Übersprängen wir ihn im
  // Kollisionsfall, wäre die ANTWORTZEIT das Orakel, das die Antwort selbst
  // gerade nicht mehr ist.
  const hash = await bcrypt.hash(String(password), BCRYPT_COST);

  const existing = await getUserByEmail(email);
  if (existing) {
    // Adresse ist vergeben: NICHTS anlegen, aber exakt dieselbe Antwort geben wie
    // bei einer neuen Adresse. Der rechtmässige Inhaber erfährt vom Versuch per
    // Mail (gleiche Absicherung wie beim E-Mail-Wechsel) und kann reagieren.
    await enqueueEmail('auth_emails', {
      template_name: 'signup-existing-notice', recipient_email: existing.email,
      variables: { email: existing.email, reset_link: `${process.env.PUBLIC_APP_URL || ''}/auth` },
    });
    return res.json({ user: null, session: null, message: SIGNUP_NEUTRAL_MESSAGE });
  }

  const user = await asService(async (c) => {
    const r = await c.query(
      `INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data,
                               raw_app_meta_data, aud, role)
       VALUES ($1,$2,$3,$4,$5,'authenticated','authenticated') RETURNING *`,
      [email, hash, AUTO_CONFIRM ? new Date() : null, data || {},
       { provider: 'email', providers: ['email'] }]);
    return r.rows[0];
  });
  // Bewusst KEINE Sitzung mehr in der Antwort: eine Sitzung gibt es nur für ein
  // frisch angelegtes Konto, und genau dieser Unterschied wäre wieder das Orakel,
  // das A-18 beseitigen soll. Der Nutzer meldet sich einmal regulär an.
  await enqueueEmail('auth_emails', {
    template_name: 'signup-welcome', recipient_email: user.email,
    variables: { email: user.email, login_link: `${process.env.PUBLIC_APP_URL || ''}/auth` },
  });
  res.json({ user: null, session: null, message: SIGNUP_NEUTRAL_MESSAGE });
});

// ---- token: password & refresh --------------------------------------------
authRouter.post('/token', async (req, res) => {
  const grant = req.query.grant_type || req.body?.grant_type;
  try {
    if (grant === 'password') {
      const { email, password } = req.body || {};
      const emailLower = String(email || '').trim().toLowerCase();
      const ip = clientIp(req);
      if (!emailLower || !password) return fail(res, 400, 'Geçersiz kimlik bilgileri');
      // Bremse VOR der Passwortprüfung: sonst bliebe das teure bcrypt.compare
      // auch für einen gesperrten Angreifer erreichbar und die Sperre kostete
      // ihn nur die Antwort, nicht den Versuch. Gesperrte Anfragen werden
      // absichtlich NICHT protokolliert — sonst könnte Dauerfeuer ein fremdes
      // Konto endlos gesperrt halten.
      const throttle = await passwordThrottleStatus({ emailLower, ip });
      if (throttle.blocked) return tooMany(res, throttle.retryAfterSec);
      const user = await getUserByEmail(emailLower);
      const ok = !!(user && user.encrypted_password)
        && await bcrypt.compare(String(password), user.encrypted_password);
      if (!ok) {
        // Auch Fehlversuche auf NICHT existierende Adressen werden gezählt —
        // sonst unterschiede sich das Sperrverhalten und verriete, wen es gibt.
        await recordAttempt({ emailLower, ip, kind: 'password', successful: false });
        return fail(res, 400, 'Geçersiz kimlik bilgileri');
      }
      if (isBanned(user)) return fail(res, 403, 'Konto ist gesperrt / Account is frozen');
      if (!AUTO_CONFIRM && !user.email_confirmed_at) return fail(res, 400, 'E-posta doğrulanmadı');
      // Erfolg setzt den Zähler dieses Kontos zurück (die Abfrage wertet nur
      // Fehlversuche NACH dem letzten Erfolg aus).
      await recordAttempt({ emailLower, ip, kind: 'password', successful: true });
      await asService((c) => c.query('UPDATE auth.users SET last_sign_in_at=now() WHERE id=$1', [user.id]));
      const session = await makeSession(user, { aal: 'aal1' });
      return res.json(session);
    }
    if (grant === 'refresh_token') {
      const { refresh_token } = req.body || {};
      // A-17: Nachgeschlagen wird über den Hash, nicht über den Rohwert. Der
      // Ablauf bleibt in SQL (`now()`), damit für die Frist die DB-Uhr gilt.
      // `revoked` wird bewusst NICHT mitgefiltert — eine widerrufene Zeile muss
      // sichtbar bleiben, sonst liesse sich Wiederverwendung nicht erkennen.
      const hashedToken = sha256Hex(String(refresh_token || ''));
      const row = await asService(async (c) =>
        (await c.query('SELECT * FROM auth.refresh_tokens WHERE token=$1 AND expires_at>now()',
          [hashedToken])).rows[0]);
      if (!row) return fail(res, 400, 'Geçersiz refresh token');
      if (row.revoked) {
        // Ein Refresh-Token ist ein Einmal-Token: beim Einlösen wird er sofort
        // widerrufen (revoked_reason='rotated'). Taucht GENAU so einer ein
        // zweites Mal auf, hatten ihn zwei Parteien — das klassische Zeichen für
        // einen gestohlenen Token (ob der Dieb oder der bestohlene Nutzer
        // nachlöst, ist von aussen nicht unterscheidbar). Dann stirbt die GANZE
        // Familie: alle Refresh-Tokens des Nutzers werden widerrufen, beide
        // Seiten fliegen raus und müssen sich mit Passwort (und ggf. MFA) neu
        // anmelden. Der Dieb verliert den Zugang, den er sonst unbemerkt endlos
        // verlängert hätte.
        //
        // WARUM der Grund zählt und nicht nur das Flag: Passwortwechsel, Reset,
        // Abmelden, Sperre und MFA-Reset widerrufen ebenfalls Tokens — dort ist
        // ein nachklappender zweiter Tab der Normalfall, kein Diebstahl. Ohne
        // diese Unterscheidung warf ein Passwortwechsel den Nutzer aus genau der
        // Sitzung, die er gerade frisch bekommen hatte: der alte Token eines
        // zweiten Tabs löste die Familien-Sperre aus und nahm die neue Sitzung
        // mit. Diese Fälle geben nur 400 zurück.
        if (row.revoked_reason === 'rotated') {
          await asService((c) => c.query(
            "UPDATE auth.refresh_tokens SET revoked=true, revoked_reason='reuse_detected' WHERE user_id=$1 AND revoked=false",
            [row.user_id]));
        }
        return fail(res, 400, 'Geçersiz refresh token');
      }
      const user = await getUserById(row.user_id);
      if (isBanned(user)) return fail(res, 403, 'Konto ist gesperrt / Account is frozen');
      await asService((c) => c.query(
        "UPDATE auth.refresh_tokens SET revoked=true, revoked_reason='rotated' WHERE token=$1", [hashedToken]));
      // F-10: aal der Sitzung erhalten. Das aal steht im (evtl. abgelaufenen) alten
      // Access-Token, das der Client mitschickt. aal2 nur dann fortführen, wenn der
      // Nutzer weiterhin einen verifizierten MFA-Faktor hat (Defense-in-depth) —
      // sonst würde ein Refresh die MFA-Stufe stumm nach 1 h auf aal1 zurücksetzen
      // und die App nach Reload erneut die MFA-Challenge zeigen.
      let aal = 'aal1';
      const oldToken = (req.body && req.body.access_token) || null;
      const claims = oldToken ? decodeAccessTokenUnsafe(oldToken) : null;
      if (claims && claims.aal === 'aal2' && String(claims.sub) === String(row.user_id)) {
        const hasVerified = await asService(async (c) =>
          (await c.query('SELECT 1 FROM auth.mfa_factors WHERE user_id=$1 AND status=\'verified\' LIMIT 1', [row.user_id])).rowCount > 0);
        if (hasVerified) aal = 'aal2';
      }
      const session = await makeSession(user, { aal });
      return res.json(session);
    }
    return fail(res, 400, 'Desteklenmeyen grant_type');
  } catch (e) {
    console.error('[auth/token]', e.message);
    return fail(res, 500, 'Sunucu hatası');
  }
});

// ---- logout ----------------------------------------------------------------
authRouter.post('/logout', async (req, res) => {
  const { refresh_token } = req.body || {};
  // A-17: in der Spalte steht der Hash, also muss auch hier gehasht gesucht
  // werden — sonst träfe das Abmelden keine Zeile mehr und die Sitzung liefe
  // nach dem „Abmelden" bis zum Ablauf weiter.
  // revoked_reason='logout': ein danach nachklappender Token ist kein Diebstahl,
  // sondern ein zweiter Tab — er bekommt 400, aber keine Familien-Sperre.
  if (refresh_token) {
    await asService((c) => c.query(
      "UPDATE auth.refresh_tokens SET revoked=true, revoked_reason='logout' WHERE token=$1",
      [sha256Hex(String(refresh_token))]));
  }
  res.status(204).end();
});

// ---- getUser / updateUser --------------------------------------------------
authRouter.get('/user', async (req, res) => {
  const b = bearerUserId(req);
  if (!b) return fail(res, 401, 'Yetkisiz');
  const user = await getUserById(b.id);
  if (!user) return fail(res, 401, 'Kullanıcı yok');
  res.json({ user: publicUser(user) });
});

authRouter.put('/user', async (req, res) => {
  const b = bearerUserId(req);
  if (!b) return fail(res, 401, 'Yetkisiz');
  const { password, data, email, current_password } = req.body || {};
  const me = await getUserById(b.id);
  if (!me) return fail(res, 401, 'Kullanıcı yok');

  // Passwort UND E-Mail sind die beiden Hebel zur dauerhaften Konto-Übernahme:
  // vorher genügte für beide ein gültiges Bearer-Token, ein gestohlenes Token
  // reichte also, um den rechtmässigen Inhaber auszusperren. Jetzt zusätzlich
  // das aktuelle Passwort — das ein Token-Dieb nicht hat.
  if (password || email) {
    const okCurrent = !!current_password && !!me.encrypted_password
      && await bcrypt.compare(String(current_password), me.encrypted_password);
    if (!okCurrent) {
      return fail(res, 400, 'Aktuelles Passwort fehlt oder ist falsch. / Mevcut şifre eksik veya hatalı.');
    }
  }

  // A-15: Richtlinie erst NACH dem Nachweis des aktuellen Passworts — wer sich
  // nicht ausweisen kann, soll auch keine Rückmeldung zur Regel bekommen.
  // Geprüft wird gegen die neue Adresse, falls eine mitgeschickt wurde: sonst
  // dürfte man das Passwort auf genau die Adresse setzen, auf die man gerade
  // wechselt.
  if (password) {
    const policyError = passwordPolicyError(password, { email: email || me.email });
    if (policyError) return fail(res, 400, policyError);
  }

  const sets = []; const params = []; let i = 1;
  if (password) {
    sets.push(`encrypted_password=$${i++}`); params.push(await bcrypt.hash(String(password), BCRYPT_COST));
    // Erst-Login-Passwortzwang aufheben, sobald der Nutzer sein Passwort ändert.
    sets.push(`raw_user_meta_data = raw_user_meta_data || '{"must_change_password":false}'::jsonb`);
  }
  if (data) { sets.push(`raw_user_meta_data=raw_user_meta_data || $${i++}::jsonb`); params.push(JSON.stringify(data)); }

  // E-Mail wird NICHT mehr sofort umgeschrieben. Bestätigt wird über einen Link
  // an die NEUE Adresse; sonst stellt ein Token-Dieb die Adresse um und holt
  // sich das Konto anschliessend per Passwort-Reset.
  let emailChangeRaw = null; let newEmail = null;
  if (email) {
    newEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return fail(res, 400, 'Geçersiz e-posta');
    if (newEmail === String(me.email || '').toLowerCase()) return fail(res, 400, 'Yeni e-posta mevcut ile aynı');
    if (await getUserByEmail(newEmail)) return fail(res, 400, 'Bu e-posta zaten kayıtlı');
    emailChangeRaw = crypto.randomBytes(24).toString('hex');
    sets.push(`email_change=$${i++}`); params.push(newEmail);
    sets.push(`email_change_token_new=$${i++}`); params.push(sha256Hex(emailChangeRaw));
    sets.push('email_change_sent_at=now()');
  }

  if (!sets.length) return fail(res, 400, 'Güncellenecek alan yok');
  params.push(b.id);
  const user = await asService(async (c) =>
    (await c.query(`UPDATE auth.users SET ${sets.join(', ')}, updated_at=now() WHERE id=$${i} RETURNING *`, params)).rows[0]);

  if (emailChangeRaw) {
    const link = `${process.env.PUBLIC_APP_URL || ''}/email-change/confirm?token=${emailChangeRaw}&type=email_change`;
    await enqueueEmail('auth_emails', {
      template_name: 'email-change-confirm', recipient_email: newEmail,
      variables: { confirm_link: link, new_email: newEmail, ttl_minutes: EMAIL_CHANGE_TTL_MIN },
    });
    // Hinweis an die ALTE Adresse: Standard-Absicherung gegen stille Übernahme —
    // der rechtmässige Inhaber erfährt vom Versuch, auch wenn er die neue
    // Mailbox nicht sieht.
    if (me.email) {
      await enqueueEmail('auth_emails', {
        template_name: 'email-change-notice', recipient_email: me.email,
        variables: { new_email: newEmail, old_email: me.email },
      });
    }
  }

  if (password) {
    // Gestohlene Sitzungen enden hier: alle Refresh-Tokens des Nutzers werden
    // widerrufen. Die aufrufende Sitzung bekommt eine frische zurück (und behält
    // ihre MFA-Stufe), damit der Nutzer nicht aus der laufenden App fliegt.
    // revoked_reason='password_change' hält fest, dass das eine gewollte Sperre
    // war — sonst hielte die Wiederverwendungserkennung den nachklappenden Token
    // eines zweiten Tabs für Diebstahl und nähme die frische Sitzung gleich mit.
    await asService((c) => c.query(
      "UPDATE auth.refresh_tokens SET revoked=true, revoked_reason='password_change' WHERE user_id=$1 AND revoked=false",
      [b.id]));
    const session = await makeSession(user, { aal: b.aal === 'aal2' ? 'aal2' : 'aal1' });
    return res.json({ user: publicUser(user), session });
  }
  res.json({ user: publicUser(user), email_change_pending: newEmail || null });
});

// E-Mail-Wechsel bestätigen (Link aus der Mail an die NEUE Adresse).
authRouter.post('/email-change/confirm', async (req, res) => {
  const { token } = req.body || {};
  if (!token) return fail(res, 400, 'token gerekli');
  const hashed = sha256Hex(String(token));
  // Kandidaten sind nur die noch laufenden, unabgelaufenen Wechsel; die
  // Entscheidung fällt timing-sicher, nicht per SQL-`=` auf dem Token.
  const rows = await asService(async (c) => (await c.query(
    `SELECT * FROM auth.users
      WHERE COALESCE(email_change_token_new,'') <> '' AND COALESCE(email_change,'') <> ''
        AND email_change_sent_at IS NOT NULL
        AND email_change_sent_at > now() - make_interval(mins => $1)`,
    [EMAIL_CHANGE_TTL_MIN])).rows);
  const user = rows.find((r) => timingSafeEqualHex(r.email_change_token_new, hashed));
  if (!user) return fail(res, 400, 'Geçersiz veya süresi dolmuş bağlantı');

  // Zwischen Anforderung und Bestätigung kann die Adresse vergeben worden sein.
  const taken = await getUserByEmail(user.email_change);
  if (taken && String(taken.id) !== String(user.id)) return fail(res, 400, 'Bu e-posta zaten kayıtlı');

  const updated = await asService(async (c) => (await c.query(
    `UPDATE auth.users
        SET email=$1, email_change='', email_change_token_new='', email_change_sent_at=NULL,
            email_confirmed_at=COALESCE(email_confirmed_at, now()), updated_at=now()
      WHERE id=$2 RETURNING *`, [user.email_change, user.id])).rows[0]);
  res.json({ user: publicUser(updated) });
});

// ---- password reset --------------------------------------------------------
authRouter.post('/recover', async (req, res) => {
  const { email } = req.body || {};
  const emailLower = String(email || '').trim().toLowerCase();
  const ip = clientIp(req);
  // Ohne Begrenzung liesse sich hier ein fremdes Postfach fluten und zugleich
  // (über die Antwortzeit) durchprobieren, welche Adressen es gibt.
  const throttle = await recoverThrottleStatus({ emailLower, ip });
  if (throttle.blocked) return tooMany(res, throttle.retryAfterSec);
  await recordAttempt({ emailLower, ip, kind: 'recover', successful: false });

  const user = emailLower ? await getUserByEmail(emailLower) : null;
  // Kullanıcı numaralandırmasını önlemek için her durumda 200 dön
  if (user) {
    // Nur der Hash landet in der DB; der Rohwert steht ausschliesslich im Link.
    const token = crypto.randomBytes(24).toString('hex');
    await asService((c) => c.query(
      'UPDATE auth.users SET recovery_token=$1, recovery_sent_at=now(), updated_at=now() WHERE id=$2',
      [sha256Hex(token), user.id]));
    const link = `${process.env.PUBLIC_APP_URL || ''}/reset-password?token=${token}&type=recovery`;
    await enqueueEmail('auth_emails', {
      template_name: 'recovery', recipient_email: user.email,
      variables: { reset_link: link, ttl_minutes: RECOVERY_TTL_MIN },
    });
  }
  res.json({ message: 'Eğer hesap varsa e-posta gönderildi' });
});

// recovery token ile şifre değiştir (ResetPassword sayfası kullanır)
authRouter.post('/recover/confirm', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return fail(res, 400, 'token ve password gerekli');
  const hashed = sha256Hex(String(token));
  // Kandidaten sind nur die noch gültigen (60 Min) Reset-Vorgänge; welcher es
  // ist, entscheidet timingSafeEqual — kein `=`-Vergleich auf dem Token in SQL.
  const rows = await asService(async (c) => (await c.query(
    `SELECT * FROM auth.users
      WHERE COALESCE(recovery_token,'') <> '' AND recovery_sent_at IS NOT NULL
        AND recovery_sent_at > now() - make_interval(mins => $1)`,
    [RECOVERY_TTL_MIN])).rows);
  const user = rows.find((r) => timingSafeEqualHex(r.recovery_token, hashed));
  if (!user) return fail(res, 400, 'Geçersiz veya süresi dolmuş bağlantı');
  // A-15: auch der Reset-Weg ist eine Setz-Stelle. Ohne Prüfung hier liesse sich
  // die Richtlinie schlicht umgehen — Reset anfordern, `a` setzen, fertig.
  // Geprüft wird erst nach dem Einlösen des Links, damit die Meldung zur Regel
  // niemandem ohne gültigen Link etwas über das Konto verrät.
  const policyError = passwordPolicyError(password, { email: user.email });
  if (policyError) return fail(res, 400, policyError);
  const hash = await bcrypt.hash(String(password), BCRYPT_COST);
  await asService((c) => c.query(
    "UPDATE auth.users SET encrypted_password=$1, recovery_token='', recovery_sent_at=NULL, updated_at=now() WHERE id=$2",
    [hash, user.id]));
  // Ein Reset ist der Fall „Kontrolle verloren": alte Sitzungen müssen enden,
  // sonst bleibt ein Angreifer mit gestohlenem Refresh-Token weiter drin.
  // Grund festhalten, damit die Wiederverwendungserkennung diese gewollte Sperre
  // nicht später als Token-Diebstahl liest (siehe grant_type=refresh_token).
  await asService((c) => c.query(
    "UPDATE auth.refresh_tokens SET revoked=true, revoked_reason='password_reset' WHERE user_id=$1 AND revoked=false",
    [user.id]));
  const session = await makeSession(user);
  res.json(session);
});

// ============================================================================
// MFA (TOTP)
// ============================================================================
authRouter.get('/factors', async (req, res) => {
  const b = bearerUserId(req);
  if (!b) return fail(res, 401, 'Yetkisiz');
  const rows = await asService(async (c) =>
    (await c.query('SELECT id, friendly_name, factor_type, status, created_at, updated_at FROM auth.mfa_factors WHERE user_id=$1 ORDER BY created_at', [b.id])).rows);
  const totp = rows.filter((f) => f.factor_type === 'totp');
  res.json({ data: { all: rows, totp, phone: [] }, error: null });
});

authRouter.post('/factors', async (req, res) => {
  const b = bearerUserId(req);
  if (!b) return fail(res, 401, 'Yetkisiz');
  // Wer bereits einen bestätigten Faktor hat, darf einen weiteren nur aus einer
  // aal2-Sitzung einschreiben: sonst hängt sich ein Angreifer mit erbeutetem
  // Passwort einfach seinen eigenen Faktor daneben und ist damit selbst aal2.
  // Ohne Faktor bleibt aal1 erlaubt, sonst käme niemand je zu MFA.
  if (b.aal !== 'aal2' && await hasVerifiedFactor(b.id)) return fail(res, 403, AAL2_REQUIRED_MESSAGE);
  const user = await getUserById(b.id);
  const friendly = req.body?.friendlyName || 'TOTP';
  const secret = authenticator.generateSecret();
  const factor = await asService(async (c) =>
    (await c.query('INSERT INTO auth.mfa_factors(user_id, friendly_name, factor_type, status, secret) VALUES ($1,$2,\'totp\',\'unverified\',$3) RETURNING id', [b.id, friendly, secret])).rows[0]);
  const uri = authenticator.keyuri(user.email, ISSUER_NAME, secret);
  const qr_code = await QRCode.toDataURL(uri);
  res.json({ data: { id: factor.id, type: 'totp', totp: { qr_code, secret, uri } }, error: null });
});

authRouter.delete('/factors/:id', async (req, res) => {
  const b = bearerUserId(req);
  if (!b) return fail(res, 401, 'Yetkisiz');
  // Entfernen des zweiten Faktors braucht aal2. Vorher genügte ein Bearer-Token
  // aus einer reinen Passwort-Sitzung — wer das Passwort hatte, löschte damit
  // MFA weg und der zweite Faktor war keiner mehr.
  if (b.aal !== 'aal2' && await hasVerifiedFactor(b.id)) return fail(res, 403, AAL2_REQUIRED_MESSAGE);
  await asService((c) => c.query('DELETE FROM auth.mfa_factors WHERE id=$1 AND user_id=$2', [req.params.id, b.id]));
  res.json({ data: {}, error: null });
});

authRouter.post('/factors/:id/challenge', async (req, res) => {
  const b = bearerUserId(req);
  if (!b) return fail(res, 401, 'Yetkisiz');
  const factor = await asService(async (c) =>
    (await c.query('SELECT * FROM auth.mfa_factors WHERE id=$1 AND user_id=$2', [req.params.id, b.id])).rows[0]);
  if (!factor) return fail(res, 404, 'Faktör yok');
  const challengeId = crypto.randomUUID();
  challenges.set(challengeId, { factorId: factor.id, userId: b.id, expires: Date.now() + 5 * 60_000 });
  res.json({ data: { id: challengeId, expires_at: Math.floor(Date.now() / 1000) + 300 }, error: null });
});

authRouter.post('/factors/:id/verify', async (req, res) => {
  const b = bearerUserId(req);
  if (!b) return fail(res, 401, 'Yetkisiz');
  const { challengeId, code } = req.body || {};
  const user = await getUserById(b.id);
  if (!user) return fail(res, 401, 'Kullanıcı yok');
  // Ein TOTP-Code hat nur 6 Stellen: ohne Bremse ist der ganze Raum in Minuten
  // durchprobiert und MFA damit wertlos.
  const emailLower = String(user.email || b.id).toLowerCase();
  const ip = clientIp(req);
  const throttle = await mfaThrottleStatus(emailLower);
  if (throttle.blocked) return tooMany(res, throttle.retryAfterSec);

  const ch = challenges.get(challengeId);
  if (!ch || ch.factorId !== req.params.id || ch.userId !== b.id) return fail(res, 400, 'Geçersiz challenge');
  const factor = await asService(async (c) =>
    (await c.query('SELECT * FROM auth.mfa_factors WHERE id=$1 AND user_id=$2', [req.params.id, b.id])).rows[0]);
  if (!factor) return fail(res, 404, 'Faktör yok');
  const ok = authenticator.verify({ token: String(code ?? '').replace(/\s/g, ''), secret: factor.secret });
  if (!ok) {
    await recordAttempt({ emailLower, ip, kind: 'mfa', successful: false });
    return fail(res, 400, 'Geçersiz kod');
  }
  await recordAttempt({ emailLower, ip, kind: 'mfa', successful: true });
  challenges.delete(challengeId);
  if (factor.status !== 'verified') {
    await asService((c) => c.query('UPDATE auth.mfa_factors SET status=\'verified\', updated_at=now() WHERE id=$1', [factor.id]));
  }
  // aal2 oturumu ver
  const session = await makeSession(user, { aal: 'aal2' });
  res.json({ data: session, error: null });
});

// AAL: token aal'i + kullanıcının doğrulanmış faktörü var mı
authRouter.get('/aal', async (req, res) => {
  const b = bearerUserId(req);
  if (!b) return res.json({ data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] }, error: null });
  const hasVerified = await asService(async (c) =>
    (await c.query('SELECT 1 FROM auth.mfa_factors WHERE user_id=$1 AND status=\'verified\' LIMIT 1', [b.id])).rowCount > 0);
  const currentLevel = b.aal || 'aal1';
  const nextLevel = hasVerified ? 'aal2' : 'aal1';
  res.json({ data: { currentLevel, nextLevel, currentAuthenticationMethods: [] }, error: null });
});
