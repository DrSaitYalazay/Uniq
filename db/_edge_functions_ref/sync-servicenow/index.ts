// Sync assets from ServiceNow CMDB into UniqSuite.
// Auth: Basic (username + password) — stored as tenant-scoped secrets referenced by the integration.
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

    const { integration_id } = await req.json();
    if (!integration_id) return json({ error: 'integration_id required' }, 400);

    const { data: integ, error: iErr } = await supabase.from('integrations').select('*').eq('id', integration_id).maybeSingle();
    if (iErr || !integ) return json({ error: 'integration not found' }, 404);
    if (integ.type !== 'servicenow') return json({ error: 'wrong integration type' }, 400);

    const instance = integ.config?.instance as string | undefined; // e.g. "acme.service-now.com"
    const table = (integ.config?.table as string) ?? 'cmdb_ci_server';
    if (!instance) return json({ error: 'instance missing in config' }, 400);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: secs } = await admin.from('integration_secrets').select('key,value')
      .eq('user_id', integ.user_id).in('key', [`${integ.secret_ref}_USER`, `${integ.secret_ref}_PASS`]);
    const secMap = new Map((secs ?? []).map((s: any) => [s.key, s.value]));
    const user = secMap.get(`${integ.secret_ref}_USER`);
    const pass = secMap.get(`${integ.secret_ref}_PASS`);
    if (!user || !pass) return json({ error: 'credentials not configured' }, 400);


    const url = `https://${instance}/api/now/table/${table}?sysparm_limit=1000`;
    const resp = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${btoa(`${user}:${pass}`)}`,
      },
    });
    if (!resp.ok) {
      const txt = await resp.text();
      await recordSync(supabase, integration_id, 'error', { message: `HTTP ${resp.status}`, preview: txt.slice(0, 300) });
      return json({ error: `ServiceNow ${resp.status}`, body: txt.slice(0, 300) }, 502);
    }
    const payload = await resp.json();
    const records: any[] = payload?.result ?? [];

    // Need a default service to link imported assets to
    const { data: firstSvc } = await supabase.from('services').select('id').eq('user_id', integ.user_id).limit(1).maybeSingle();
    if (!firstSvc) {
      await recordSync(supabase, integration_id, 'error', { message: 'no services in tenant' });
      return json({ error: 'Create at least one service before syncing' }, 400);
    }

    const rows = records.map((r: any) => ({
      user_id: integ.user_id,
      service_id: firstSvc.id,
      asset_name: r.name ?? r.sys_id,
      asset_type: mapClassToType(r.sys_class_name),
      environment: r.used_for ?? 'Production',
      vendor: r.manufacturer?.display_value ?? r.manufacturer ?? null,
      owner: r.owned_by?.display_value ?? null,
      external_id: r.sys_id,
      external_source: 'servicenow',
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

function mapClassToType(cls?: string): string {
  if (!cls) return 'Other';
  if (/server|linux|windows/i.test(cls)) return 'Server';
  if (/database|mssql|oracle|mysql/i.test(cls)) return 'Database';
  if (/network|router|switch/i.test(cls)) return 'Network';
  if (/application|appl_/i.test(cls)) return 'Application';
  if (/cloud|aws|azure|gcp/i.test(cls)) return 'Cloud';
  return 'Other';
}
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
