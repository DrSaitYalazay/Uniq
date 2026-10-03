// RPC: supabase.rpc(fn, args) -> SELECT public.<fn>(named args)
import { withClaims } from '../db.js';

const IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

// Güvenlik: sadece uygulamanın gerçekten çağırdığı fonksiyonlara izin ver.
const ALLOWED = new Set([
  'get_org_owner_id',
  'get_user_org_id',
  'has_role',
  'wipe_tenant_data',
]);

export async function runRpc(fnName, args, claims) {
  try {
    if (!IDENT.test(fnName) || !ALLOWED.has(fnName)) {
      throw Object.assign(new Error(`İzin verilmeyen RPC: ${fnName}`), { status: 403 });
    }
    const keys = Object.keys(args || {});
    const params = [];
    const named = keys.map((k) => {
      if (!IDENT.test(k)) throw new Error(`Geçersiz argüman adı: ${k}`);
      params.push(args[k]);
      return `${k} => $${params.length}`;
    });
    const sql = `SELECT public."${fnName}"(${named.join(', ')}) AS __result`;
    const data = await withClaims(claims, async (client) => {
      const r = await client.query(sql, params);
      return r.rows[0] ? r.rows[0].__result : null;
    });
    return { data, error: null };
  } catch (err) {
    if (!err.status) console.error('[rpc] hata:', err.message);
    return { data: null, error: { message: err.message, code: String(err.status || 500) } };
  }
}
