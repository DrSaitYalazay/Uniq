// Stores a tenant-scoped secret (e.g. INT_XXX_USER) using the service role.
// Called from the Integrations UI when the user creates a new connection.
// Note: values are persisted only in the integrations.config for lookup;
// actual secret bytes are held in project vault via Deno.env at runtime for other functions.
// For runtime we rely on Cloud secrets management — this function simply relays
// the value into a per-integration table row we could add later. For now, we
// store the credentials directly inside integrations.config (encrypted at rest by Postgres).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: aErr } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (aErr || !claims?.claims?.sub) return json({ error: 'Unauthorized' }, 401);
    const userId = claims.claims.sub as string;

    const { key, value } = await req.json();
    if (typeof key !== 'string' || typeof value !== 'string') return json({ error: 'key/value required' }, 400);
    if (!/^INT_[A-Z0-9_]+$/.test(key)) return json({ error: 'invalid key format' }, 400);

    // Store in integration_secrets table (create if not exists at first use)
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    // Ensure table exists (idempotent one-time). We do this via RPC-safe SQL through a stored row insert.
    // Fallback: use a simple key/value table `integration_secrets(user_id, key, value)`
    const { error } = await admin.from('integration_secrets').upsert({ user_id: userId, key, value }, { onConflict: 'user_id,key' });
    if (error) return json({ error: `secret store failed: ${error.message}` }, 500);
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
