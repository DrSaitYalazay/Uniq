// ============================================================================
// cy — Supabase istemcisinin DROP-IN muadili.
// ----------------------------------------------------------------------------
// Uygulama kodunun geri kalanı `import { supabase } from "@/integrations/supabase/client"`
// üzerinden aynı arayüzü (from/rpc/auth/storage/functions/channel) kullanmaya
// devam eder; ancak istekler artık Supabase'e DEĞİL, kendi cy-api sunucumuza
// (düz PostgreSQL) gider. Supabase'e hiçbir bağımlılık yoktur.
// ============================================================================

const API_BASE: string = (import.meta as any).env?.VITE_CY_API_URL || '';
const SESSION_KEY = 'cy.auth.session.v1';

// ---- gevşek tipler (uygulama strict:false; supabase-js tiplerinin yerine) --
export interface User { id: string; email?: string; user_metadata?: any; app_metadata?: any; [k: string]: any; }
export interface Session { access_token: string; refresh_token: string; expires_at?: number; user: User; [k: string]: any; }
export type AuthChangeEvent =
  | 'INITIAL_SESSION' | 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'PASSWORD_RECOVERY';

// ---- oturum yönetimi -------------------------------------------------------
// CHG-15: verwaiste Alt-Token der Supabase-Ära einmalig aufräumen
// (`sb-<projectref>-auth-token`). Sie werden nicht mehr genutzt (echte Session =
// cy.auth.session.v1) und können sonst als stale Fremd-Session missverstanden werden.
try {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && /^sb-.+-auth-token$/.test(k)) localStorage.removeItem(k);
  }
} catch { /* yut */ }

let currentSession: Session | null = loadSession();
const listeners = new Set<(event: AuthChangeEvent, session: Session | null) => void>();

function loadSession(): Session | null {
  try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function saveSession(s: Session | null) {
  currentSession = s;
  try { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); } catch { /* yut */ }
}
function emit(event: AuthChangeEvent) {
  for (const cb of listeners) { try { cb(event, currentSession); } catch { /* yut */ } }
}

// ---- proaktives Token-Refresh --------------------------------------------
// WICHTIG: Der Daten-Endpunkt /db/query liefert bei abgelaufenem JWT KEIN 401,
// sondern faellt serverseitig still auf die Rolle `anon` zurueck (Lesen via
// anon-SELECT-Grant ok, Schreiben => "permission denied for table", HTTP 200
// mit Body-Fehler). Dadurch griff das alte Refresh-nur-bei-401 nie und die
// Sitzung degradierte stillschweigend zu Read-only (Nutzer sah "konnte nicht
// gespeichert werden" / scheinbaren Datenverlust). Loesung: Token proaktiv
// anhand von expires_at erneuern, BEVOR eine authentifizierte Anfrage rausgeht.
let refreshPromise: Promise<boolean> | null = null;

function tokenExpiringSoon(skewSec = 60): boolean {
  const exp = currentSession?.expires_at;
  if (!exp) return false;                       // kein Ablauf bekannt => nichts tun
  return (exp - Math.floor(Date.now() / 1000)) <= skewSec;
}

/** Erneuert das Token hoechstens einmal gleichzeitig (geteiltes Promise). */
function ensureFreshToken(): Promise<boolean> {
  // Multi-Tab: ein anderer Tab hat evtl. gerade rotiert. Zuerst aus dem
  // Storage nachladen und, wenn dadurch bereits frisch, KEIN Refresh ausloesen
  // (der Refresh-Token ist Einmal-/Rotations-Token; doppeltes Einloesen wuerde
  // die gueltige Sitzung des anderen Tabs ungueltig machen).
  const stored = loadSession();
  if (stored && stored.access_token !== currentSession?.access_token) {
    currentSession = stored;
  }
  if (currentSession?.access_token && currentSession.expires_at && !tokenExpiringSoon()) {
    return Promise.resolve(true);
  }
  if (!currentSession?.refresh_token) return Promise.resolve(false);
  if (!refreshPromise) {
    refreshPromise = tryRefresh().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

// ---- HTTP yardımcı (otomatik token + proaktives/401-Refresh) ---------------
async function apiFetch(path: string, opts: { method?: string; body?: any; auth?: boolean; raw?: boolean; headers?: any } = {}): Promise<Response> {
  // Proaktiv: abgelaufenes/bald ablaufendes Token vor dem Request erneuern,
  // damit /db/query nie mit ungueltigem JWT (=> anon-Fallback) rausgeht.
  if (opts.auth !== false && currentSession?.access_token && tokenExpiringSoon()) {
    await ensureFreshToken();
  }
  const doFetch = async () => {
    const headers: any = { ...(opts.headers || {}) };
    if (!opts.raw) headers['Content-Type'] = 'application/json';
    if (opts.auth !== false && currentSession?.access_token) headers['Authorization'] = 'Bearer ' + currentSession.access_token;
    return fetch(API_BASE + path, {
      method: opts.method || 'GET',
      headers,
      body: opts.raw ? opts.body : (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
    });
  };
  let res = await doFetch();
  if (res.status === 401 && currentSession?.refresh_token && opts.auth !== false) {
    const ok = await ensureFreshToken();
    if (ok) res = await doFetch();
  }
  return res;
}

async function tryRefresh(): Promise<boolean> {
  const usedToken = currentSession?.refresh_token;
  if (!usedToken) return false;
  let r: Response;
  try {
    r = await fetch(API_BASE + '/auth/token?grant_type=refresh_token', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      // access_token mitschicken, damit der Server die aal-Stufe (MFA) erhalten kann (F-10).
      body: JSON.stringify({ refresh_token: usedToken, access_token: currentSession?.access_token ?? null }),
    });
  } catch {
    return false; // Netzfehler: Sitzung NICHT verwerfen, spaeter erneut versuchen
  }
  if (!r.ok) {
    // Nur ausloggen, wenn nicht inzwischen ein anderer Tab eine neue Sitzung
    // geschrieben hat (Rotation). Sonst dessen frische Sitzung uebernehmen.
    const stored = loadSession();
    if (stored?.refresh_token && stored.refresh_token !== usedToken) {
      currentSession = stored;
      emit('TOKEN_REFRESHED');
      return true;
    }
    // Transiente Serverfehler (>=500, z. B. Proxy/Deploy) NICHT als Logout werten
    // — Sitzung behalten und spaeter erneut versuchen (wie Netzfehler). Nur bei
    // echter Ablehnung (4xx) die Sitzung verwerfen.
    if (r.status >= 500) return false;
    saveSession(null); emit('SIGNED_OUT');
    return false;
  }
  const s = await r.json();
  saveSession(normalizeSession(s));
  emit('TOKEN_REFRESHED');
  return true;
}

function normalizeSession(s: any): Session {
  return {
    access_token: s.access_token, refresh_token: s.refresh_token,
    expires_at: s.expires_at, expires_in: s.expires_in, token_type: s.token_type || 'bearer',
    user: s.user,
  };
}

// ============================================================================
// QueryBuilder — .from(table) zincirinin thenable karşılığı
// ============================================================================
class QueryBuilder {
  private d: any;
  constructor(table: string) { this.d = { table, action: 'select', filters: [] }; }

  select(columns = '*', opts: any = {}) {
    if (this.d.action === 'select') this.d.columns = columns;
    else { this.d.returning = true; this.d.columns = columns; } // insert/update/delete sonrası
    if (opts.count) this.d.count = opts.count;
    if (opts.head) this.d.head = true;
    return this;
  }
  insert(values: any) { this.d.action = 'insert'; this.d.values = values; this.d.returning = false; return this; }
  upsert(values: any, opts: any = {}) { this.d.action = 'upsert'; this.d.values = values; this.d.onConflict = opts.onConflict; this.d.returning = false; return this; }
  update(values: any) { this.d.action = 'update'; this.d.values = values; this.d.returning = false; return this; }
  delete() { this.d.action = 'delete'; this.d.returning = false; return this; }

  eq(col: string, val: any)  { this.d.filters.push({ col, op: 'eq', val }); return this; }
  neq(col: string, val: any) { this.d.filters.push({ col, op: 'neq', val }); return this; }
  gt(col: string, val: any)  { this.d.filters.push({ col, op: 'gt', val }); return this; }
  gte(col: string, val: any) { this.d.filters.push({ col, op: 'gte', val }); return this; }
  lt(col: string, val: any)  { this.d.filters.push({ col, op: 'lt', val }); return this; }
  lte(col: string, val: any) { this.d.filters.push({ col, op: 'lte', val }); return this; }
  like(col: string, val: any)  { this.d.filters.push({ col, op: 'like', val }); return this; }
  ilike(col: string, val: any) { this.d.filters.push({ col, op: 'ilike', val }); return this; }
  is(col: string, val: any)  { this.d.filters.push({ col, op: 'is', val }); return this; }
  in(col: string, arr: any[]) { this.d.filters.push({ col, op: 'in', val: arr }); return this; }
  match(obj: Record<string, any>) { for (const k in obj) this.d.filters.push({ col: k, op: 'eq', val: obj[k] }); return this; }
  or(expr: string) { this.d.or = expr; return this; }
  not() { return this; } // desteklenmeyen ince durumlar için no-op zincir

  order(col: string, opts: any = {}) {
    (this.d.order ||= []).push({ col, asc: opts.ascending !== false, nullsFirst: opts.nullsFirst });
    return this;
  }
  limit(n: number) { this.d.limit = n; return this; }
  range(from: number, to: number) { this.d.rangeFrom = from; this.d.rangeTo = to; return this; }
  single() { this.d.single = true; return this; }
  maybeSingle() { this.d.maybeSingle = true; return this; }
  throwOnError() { this.d.throwOnError = true; return this; }
  abortSignal() { return this; }

  async run() {
    const res = await apiFetch('/db/query', { method: 'POST', body: this.d });
    let out: any; try { out = await res.json(); } catch { out = { data: null, error: { message: 'Bad response' } }; }
    if (out.error && this.d.throwOnError) throw new Error(out.error.message);
    return out; // { data, error, count }
  }
  then(resolve: any, reject: any) { return this.run().then(resolve, reject); }
  catch(reject: any) { return this.run().catch(reject); }
  finally(cb: any) { return this.run().finally(cb); }
}

// ============================================================================
// Auth (GoTrue muadili)
// ============================================================================
const authApi = {
  async signUp({ email, password, options }: any) {
    const res = await apiFetch('/auth/signup', { method: 'POST', auth: false, body: { email, password, data: options?.data } });
    const body = await res.json();
    if (!res.ok) return { data: { user: null, session: null }, error: { message: body.error?.message || body.error || 'signup failed' } };
    if (body.session) { saveSession(normalizeSession(body.session)); emit('SIGNED_IN'); }
    return { data: { user: body.user, session: body.session }, error: null };
  },
  async signInWithPassword({ email, password }: any) {
    const res = await apiFetch('/auth/token?grant_type=password', { method: 'POST', auth: false, body: { email, password } });
    const body = await res.json();
    if (!res.ok) return { data: { user: null, session: null }, error: { message: body.error?.message || body.error || 'login failed' } };
    const session = normalizeSession(body);
    saveSession(session); emit('SIGNED_IN');
    return { data: { user: session.user, session }, error: null };
  },
  async signOut() {
    try { await apiFetch('/auth/logout', { method: 'POST', body: { refresh_token: currentSession?.refresh_token } }); } catch { /* yut */ }
    saveSession(null); emit('SIGNED_OUT');
    return { error: null };
  },
  async getSession() {
    // Proaktiv erneuern, damit auch Nicht-apiFetch-Pfade (Settings-Export,
    // useToolData-Unload-Flush) nie ein abgelaufenes Token weiterreichen
    // (sonst gleicher stiller anon-Fallback wie F-CRIT-01, nur seltener).
    if (currentSession?.access_token && tokenExpiringSoon()) {
      try { await ensureFreshToken(); } catch { /* Netzfehler: alte Session zurückgeben */ }
    }
    return { data: { session: currentSession }, error: null };
  },
  async getUser() {
    if (!currentSession) return { data: { user: null }, error: null };
    const res = await apiFetch('/auth/user');
    if (!res.ok) return { data: { user: null }, error: { message: 'not authenticated' } };
    const body = await res.json();
    return { data: { user: body.user }, error: null };
  },
  async setSession(tokens: any) {
    // Lovable OAuth vb. dışarıdan token verdiğinde
    const session = normalizeSession(tokens);
    saveSession(session); emit('SIGNED_IN');
    return { data: { session, user: session.user }, error: null };
  },
  // Passwort- und E-Mail-Wechsel verlangen serverseitig `current_password`
  // (ein gestohlenes Token allein reicht nicht mehr). Der Aufrufer MUSS
  // attrs.currentPassword mitgeben, sonst antwortet die API mit 400.
  async updateUser(attrs: any) {
    const res = await apiFetch('/auth/user', {
      method: 'PUT',
      body: {
        password: attrs.password, data: attrs.data, email: attrs.email,
        current_password: attrs.currentPassword ?? attrs.current_password,
      },
    });
    const body = await res.json();
    if (!res.ok) return { data: { user: null }, error: { message: body.error?.message || 'update failed' } };
    // Nach einem Passwortwechsel widerruft der Server ALLE Refresh-Token und
    // liefert eine frische Sitzung. Ohne dieses Übernehmen würde der naechste
    // Refresh scheitern und den Nutzer stumm ausloggen.
    if (body.session?.access_token) { saveSession(normalizeSession(body.session)); emit('USER_UPDATED'); }
    return { data: { user: body.user }, error: null };
  },
  async resetPasswordForEmail(email: string, _opts?: any) {
    await apiFetch('/auth/recover', { method: 'POST', auth: false, body: { email } });
    return { data: {}, error: null };
  },
  /**
   * Setzt das Passwort über den Token aus der Wiederherstellungs-Mail
   * (`/reset-password?token=…`). Kein Supabase-Pendant: dort erzeugt der Link
   * eine Sitzung, bei uns löst der Server den Token selbst ein.
   */
  async confirmRecovery({ token, password }: { token: string; password: string }) {
    const res = await apiFetch('/auth/recover/confirm', { method: 'POST', auth: false, body: { token, password } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { data: { session: null }, error: { message: body.error?.message || 'reset failed' } };
    const session = normalizeSession(body);
    saveSession(session); emit('SIGNED_IN');
    return { data: { session }, error: null };
  },
  onAuthStateChange(cb: (event: AuthChangeEvent, session: Session | null) => void) {
    listeners.add(cb);
    // supabase gibi başlangıçta INITIAL_SESSION tetikle
    setTimeout(() => { try { cb('INITIAL_SESSION', currentSession); } catch { /* yut */ } }, 0);
    return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
  },
  // ---- MFA -----------------------------------------------------------------
  mfa: {
    async enroll({ factorType = 'totp', friendlyName }: any = {}) {
      const res = await apiFetch('/auth/factors', { method: 'POST', body: { factorType, friendlyName } });
      const body = await res.json();
      if (!res.ok) return { data: null, error: { message: body.error?.message || 'enroll failed' } };
      return body; // { data: { id, totp: { qr_code, secret, uri } }, error }
    },
    async challenge({ factorId }: any) {
      const res = await apiFetch(`/auth/factors/${factorId}/challenge`, { method: 'POST', body: {} });
      const body = await res.json();
      if (!res.ok) return { data: null, error: { message: body.error?.message || 'challenge failed' } };
      return body; // { data: { id }, error }
    },
    async verify({ factorId, challengeId, code }: any) {
      const res = await apiFetch(`/auth/factors/${factorId}/verify`, { method: 'POST', body: { challengeId, code } });
      const body = await res.json();
      if (!res.ok) return { data: null, error: { message: body.error?.message || 'verify failed' } };
      if (body.data?.access_token) { saveSession(normalizeSession(body.data)); emit('TOKEN_REFRESHED'); }
      return body; // { data: session, error }
    },
    async unenroll({ factorId }: any) {
      const res = await apiFetch(`/auth/factors/${factorId}`, { method: 'DELETE' });
      const body = await res.json();
      return res.ok ? body : { data: null, error: { message: body.error?.message || 'unenroll failed' } };
    },
    async listFactors() {
      const res = await apiFetch('/auth/factors');
      const body = await res.json();
      if (!res.ok) return { data: { all: [], totp: [] }, error: { message: 'list failed' } };
      return body; // { data: { all, totp, phone }, error }
    },
    async getAuthenticatorAssuranceLevel() {
      const res = await apiFetch('/auth/aal');
      const body = await res.json();
      return body; // { data: { currentLevel, nextLevel, ... }, error }
    },
  },
};

// ============================================================================
// Storage
// ============================================================================
function storageFrom(bucket: string) {
  return {
    async upload(path: string, fileBody: any, opts: any = {}) {
      const res = await apiFetch(`/storage/${bucket}/${path}`, {
        method: 'PUT', raw: true, body: fileBody,
        headers: { 'Content-Type': opts.contentType || fileBody?.type || 'application/octet-stream', 'x-upsert': opts.upsert ? 'true' : 'false' },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return { data: null, error: { message: body.error?.message || 'upload failed' } };
      return { data: body.data || { path }, error: null };
    },
    async download(path: string) {
      const res = await apiFetch(`/storage/${bucket}/${path}`);
      if (!res.ok) return { data: null, error: { message: 'download failed' } };
      const blob = await res.blob();
      return { data: blob, error: null };
    },
    async remove(paths: string[]) {
      for (const p of paths) await apiFetch(`/storage/${bucket}/${p}`, { method: 'DELETE' });
      return { data: {}, error: null };
    },
    getPublicUrl(path: string) {
      return { data: { publicUrl: `${API_BASE}/storage/${bucket}/${path}` } };
    },
  };
}

// ============================================================================
// Edge functions
// ============================================================================
const functionsApi = {
  async invoke(name: string, opts: any = {}) {
    const res = await apiFetch(`/functions/${name}`, { method: 'POST', body: opts.body ?? {} });
    let body: any; try { body = await res.json(); } catch { body = null; }
    if (!res.ok) return { data: null, error: { message: body?.error?.message || body?.error || `function ${name} failed`, context: body } };
    return { data: body, error: null };
  },
};

// ============================================================================
// Realtime (uygulama tek kanal kullanıyor; hafif no-op muadili)
// ============================================================================
function channel(_name: string) {
  const ch: any = {
    on() { return ch; },
    subscribe(cb?: any) { if (cb) setTimeout(() => cb('SUBSCRIBED'), 0); return ch; },
    unsubscribe() { return Promise.resolve('ok'); },
  };
  return ch;
}

// ============================================================================
// supabase — dışa aktarılan tekil istemci
// ============================================================================
export const supabase = {
  from: (table: string) => new QueryBuilder(table),
  rpc: async (fn: string, args?: any) => {
    const res = await apiFetch(`/db/rpc/${fn}`, { method: 'POST', body: args || {} });
    let body: any; try { body = await res.json(); } catch { body = { data: null, error: { message: 'bad response' } }; }
    return body; // { data, error }
  },
  auth: authApi,
  storage: { from: storageFrom },
  functions: functionsApi,
  channel,
  removeChannel: (_ch: any) => Promise.resolve('ok'),
};

export default supabase;
