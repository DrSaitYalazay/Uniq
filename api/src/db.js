// ============================================================================
// cy — PostgreSQL bağlantısı + RLS'i tetikleyen "claim'li transaction" yardımcısı
// ----------------------------------------------------------------------------
// PostgREST modeli: her istek bir transaction içinde çalışır; transaction'da
//   SET LOCAL ROLE <anon|authenticated|service_role>
//   set_config('request.jwt.claims', '<json>', true)
// ayarlanır. Böylece migration'lardaki 316 RLS politikası ve auth.uid() düz
// Postgres'te aynen çalışır.
// ============================================================================
import pg from 'pg';
const { Pool } = pg;

// DATE (OID 1082) unverändert als 'YYYY-MM-DD' ausliefern — wie PostgREST/Supabase,
// für das das Frontend geschrieben ist. Ohne diese Zeile macht node-pg daraus ein
// JS-Date (lokale Mitternacht) und JSON den Zeitstempel "2026-08-22T22:00:00.000Z":
// <input type="date"> bleibt leer, Datumsprüfungen (/^\d{4}-\d{2}-\d{2}$/) schlagen
// fehl und `${d}T12:00:00Z` wird ungültig — u. a. blieb dadurch der
// Umsetzungsfortschritt/Prognose im Dashboard leer. Betrifft nur DATE-Spalten
// (completed_at, due_date, valid_until, …); timestamptz bleibt unverändert.
pg.types.setTypeParser(1082, (v) => v);

// API "authenticator" rolüyle bağlanır; bu rol SET ROLE ile diğer rollere geçer.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX || 10),
});

pool.on('error', (err) => console.error('[pg] beklenmeyen pool hatası:', err.message));

/**
 * Bir işlemi, verilen kullanıcı bağlamıyla (JWT claim'leri) tek bir transaction
 * içinde çalıştırır. `fn(client)` içindeki tüm sorgular RLS altında koşar.
 *
 * @param {object|null} claims  { sub, role, email, ... }  (null => anon)
 * @param {(client) => Promise<any>} fn
 */
export async function withClaims(claims, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const role = (claims && claims.role) || 'anon';
    // Rol beyaz listesi (SQL injection'a karşı).
    // SICHERHEIT: service_role (BYPASSRLS) darf NIEMALS aus einem User-JWT stammen
    // (sonst Rechteausweitung). Der legitime Server-Pfad dafuer ist asService(),
    // das ueber _trustedRole laeuft und diese Grenze bewusst umgeht.
    const safeRole = claims && claims.__trusted === true && role === 'service_role'
      ? 'service_role'
      : (['authenticated', 'anon'].includes(role) ? role : 'anon');
    await client.query(`SET LOCAL ROLE ${safeRole}`);

    const claimsJson = JSON.stringify(claims || {});
    await client.query("SELECT set_config('request.jwt.claims', $1, true)", [claimsJson]);

    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* yut */ }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * service_role (BYPASSRLS) bağlamında çalışır — sadece güvenilir sunucu işleri
 * (auth, edge functions) için. RLS uygulanmaz.
 */
export function asService(fn) {
  // Server-interner, vertrauenswuerdiger Pfad (BYPASSRLS). __trusted-Flag erlaubt
  // service_role NUR hier — niemals aus einem eingehenden User-JWT.
  return withClaims({ role: 'service_role', __trusted: true }, fn);
}
