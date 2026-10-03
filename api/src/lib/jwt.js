// JWT üretimi/doğrulaması + istekten claim çıkarma (Supabase GoTrue uyumlu şekil)
import jwt from 'jsonwebtoken';

// SICHERHEIT: In Produktion MUSS JWT_SECRET gesetzt sein. Sonst koennten mit dem
// bekannten Default-Secret Tokens (auch role=service_role) gefaelscht werden.
const SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET muss in Produktion gesetzt sein (kein Default-Secret erlaubt).');
  }
  return 'dev-insecure-secret-change-me';
})();
const ACCESS_TTL = Number(process.env.ACCESS_TOKEN_TTL || 3600);        // 1 saat
const ISSUER = process.env.JWT_ISSUER || 'cy-auth';

export function signAccessToken(user, { aal = 'aal1' } = {}) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: 'authenticated',
    aud: 'authenticated',
    aal,
    user_metadata: user.raw_user_meta_data || {},
    app_metadata: user.raw_app_meta_data || {},
  };
  return jwt.sign(payload, SECRET, { expiresIn: ACCESS_TTL, issuer: ISSUER });
}

/**
 * Dekodiert einen Access-Token OHNE Signatur-/Ablaufprüfung. Nur zum Auslesen
 * unkritischer Claims (z. B. aal beim Refresh, wenn das alte Token bereits
 * abgelaufen ist). NIEMALS für Autorisierung verwenden.
 */
export function decodeAccessTokenUnsafe(token) {
  try {
    return jwt.decode(token) || null;
  } catch {
    return null;
  }
}

export function verifyAccessToken(token) {
  try {
    // clockTolerance federt kleinen Client-Uhr-Skew ab (verhindert falsche 401).
    return jwt.verify(token, SECRET, { issuer: ISSUER, clockTolerance: 10 });
  } catch {
    return null;
  }
}

/**
 * Express middleware: Authorization: Bearer <jwt> başlığını çözer.
 * req.claims (null|obj), req.authInvalid set eder.
 * - Kein Bearer-Header  => anon (req.claims=null, authInvalid=false) — oeffentliche Pfade ok.
 * - Bearer vorhanden aber ungueltig/abgelaufen => req.authInvalid=true.
 *   Der Gateway antwortet dann 401 statt still auf anon zu fallen (sonst schlaegt
 *   Schreiben mit "permission denied"/42501 fehl und der Client erneuert nie).
 */
export function authMiddleware(req, _res, next) {
  const hdr = req.headers.authorization || '';
  const m = hdr.match(/^Bearer\s+(.+)$/i);
  req.claims = null;
  req.authInvalid = false;
  if (m) {
    const decoded = verifyAccessToken(m[1]);
    if (decoded && decoded.role) {
      // Defense-in-depth: eingehende Tokens duerfen niemals das interne
      // Vertrauens-Flag tragen (nur asService() setzt es serverseitig).
      delete decoded.__trusted;
      req.claims = decoded;
    } else {
      req.authInvalid = true; // Bearer da, aber ungueltig/abgelaufen
    }
  }
  next();
}

export { ACCESS_TTL };
