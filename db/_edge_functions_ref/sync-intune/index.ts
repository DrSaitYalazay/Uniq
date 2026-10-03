// Sync managed devices from Microsoft Intune (Graph API) into UniqSuite as assets.
// Auth: OAuth2 client credentials (tenant_id + client_id + client_secret) — client_secret stored as tenant-scoped secret.
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

    const { integration_id } = await req.json();
    if (!integration_id) return json({ error: 'integration_id required' }, 400);

    const { data: integ, error: iErr } = await supabase.from('integrations').select('*').eq('id', integration_id).maybeSingle();
    if (iErr || !integ) return json({ error: 'integration not found' }, 404);
    if (integ.type !== 'intune') return json({ error: 'wrong integration type' }, 400);

    const tenantId = integ.config?.tenant_id as string | undefined;
    const clientId = integ.config?.client_id as string | undefined;
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: sec } = await admin.from('integration_secrets').select('value')
      .eq('user_id', integ.user_id).eq('key', `${integ.secret_ref}_CLIENT_SECRET`).maybeSingle();
    const clientSecret = sec?.value as string | undefined;
    if (!tenantId || !clientId || !clientSecret) return json({ error: 'incomplete config or missing secret' }, 400);


    // 1. Get access token
    const tokenResp = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    });
    if (!tokenResp.ok) {
      const txt = await tokenResp.text();
      await recordSync(supabase, integration_id, 'error', { message: `token ${tokenResp.status}`, preview: txt.slice(0, 300) });
      return json({ error: 'token request failed', body: txt.slice(0, 300) }, 502);
    }
    const { access_token } = await tokenResp.json();

    // 2. Fetch devices
    const devResp = await fetch('https://graph.microsoft.com/v1.0/deviceManagement/managedDevices?$top=999', {
      headers: { Authorization: `Bearer ${access_token}`, Accept: 'application/json' },
    });
    if (!devResp.ok) {
      const txt = await devResp.text();
      await recordSync(supabase, integration_id, 'error', { message: `graph ${devResp.status}`, preview: txt.slice(0, 300) });
      return json({ error: 'graph request failed', body: txt.slice(0, 300) }, 502);
    }
    const devices: any[] = (await devResp.json()).value ?? [];

    const { data: firstSvc } = await supabase.from('services').select('id').eq('user_id', integ.user_id).limit(1).maybeSingle();
    if (!firstSvc) {
      await recordSync(supabase, integration_id, 'error', { message: 'no services in tenant' });
      return json({ error: 'Create at least one service before syncing' }, 400);
    }

    const rows = devices.map((d) => ({
      user_id: integ.user_id,
      service_id: firstSvc.id,
      asset_name: d.deviceName ?? d.id,
      asset_type: 'Endpoint',
      environment: 'Production',
      vendor: d.manufacturer ?? null,
      owner: d.userPrincipalName ?? null,
      external_id: d.id,
      external_source: 'intune',
      inherited_criticality: true,
      zok_ids: [],
      instance_count: 1,
    }));

    const { error: upErr } = await supabase.from('assets').upsert(rows, { onConflict: 'user_id,external_source,external_id' });
    if (upErr) {
      await recordSync(supabase, integration_id, 'error', { message: upErr.message });
      return json({ error: upErr.message }, 500);
    }
    await recordSync(supabase, integration_id, 'success', { count: rows.length });
    return json({ ok: true, imported: rows.length });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

async function recordSync(supabase: any, id: string, status: string, stats: any) {
  await supabase.from('integrations').update({
    last_sync_at: new Date().toISOString(),
    last_sync_status: status,
    last_sync_stats: stats,
  }).eq('id', id);
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
