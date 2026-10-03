// ServiceNow CMDB'den asset içe aktarır (Basic auth).
import { requireUser, asService, json } from './_shared.js';

async function recordSync(id, status, stats) {
  await asService((c) => c.query(
    'UPDATE public.integrations SET last_sync_at=now(), last_sync_status=$2, last_sync_stats=$3 WHERE id=$1',
    [id, status, stats])).catch(() => {});
}

function mapClassToType(cls) {
  const s = String(cls || '').toLowerCase();
  if (s.includes('server')) return 'Server';
  if (s.includes('database')) return 'Database';
  if (s.includes('network')) return 'Network';
  if (s.includes('computer') || s.includes('workstation')) return 'Endpoint';
  return 'Other';
}

export default async function syncServicenow(req, res) {
  const claims = requireUser(req, res); if (!claims) return;
  const { integration_id } = req.body || {};
  if (!integration_id) return json(res, 400, { error: 'integration_id required' });

  try {
    const integ = await asService(async (c) =>
      (await c.query('SELECT * FROM public.integrations WHERE id=$1', [integration_id])).rows[0]);
    if (!integ) return json(res, 404, { error: 'integration not found' });
    if (integ.type !== 'servicenow') return json(res, 400, { error: 'wrong integration type' });

    const instance = integ.config?.instance;
    const table = integ.config?.table ?? 'cmdb_ci_server';
    if (!instance) return json(res, 400, { error: 'instance missing in config' });

    const secs = await asService(async (c) =>
      (await c.query('SELECT key, value FROM public.integration_secrets WHERE user_id=$1 AND key = ANY($2)',
        [integ.user_id, [`${integ.secret_ref}_USER`, `${integ.secret_ref}_PASS`]])).rows);
    const secMap = new Map(secs.map((s) => [s.key, s.value]));
    const user = secMap.get(`${integ.secret_ref}_USER`);
    const pass = secMap.get(`${integ.secret_ref}_PASS`);
    if (!user || !pass) return json(res, 400, { error: 'credentials not configured' });

    const url = `https://${instance}/api/now/table/${table}?sysparm_limit=1000`;
    const resp = await fetch(url, {
      headers: { Accept: 'application/json', Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}` },
    });
    if (!resp.ok) {
      const txt = await resp.text();
      await recordSync(integration_id, 'error', { message: `HTTP ${resp.status}`, preview: txt.slice(0, 300) });
      return json(res, 502, { error: `ServiceNow ${resp.status}`, body: txt.slice(0, 300) });
    }
    const records = (await resp.json())?.result ?? [];

    const firstSvc = await asService(async (c) =>
      (await c.query('SELECT id FROM public.services WHERE user_id=$1 LIMIT 1', [integ.user_id])).rows[0]);
    if (!firstSvc) {
      await recordSync(integration_id, 'error', { message: 'no services in tenant' });
      return json(res, 400, { error: 'Create at least one service before syncing' });
    }

    const rows = records.map((r) => ({
      user_id: integ.user_id, service_id: firstSvc.id,
      asset_name: r.name ?? r.sys_id, asset_type: mapClassToType(r.sys_class_name),
      environment: r.used_for ?? 'Production',
      vendor: r.manufacturer?.display_value ?? r.manufacturer ?? null,
      owner: r.owned_by?.display_value ?? null,
      external_id: r.sys_id, external_source: 'servicenow', inherited_criticality: true, zok_ids: [], instance_count: 1,
    }));

    await asService(async (c) => {
      for (const r of rows) {
        await c.query(
          `INSERT INTO public.assets(user_id, service_id, asset_name, asset_type, environment, vendor, owner, external_id, external_source, inherited_criticality, zok_ids, instance_count)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           ON CONFLICT (user_id, external_source, external_id) DO UPDATE
           SET asset_name=EXCLUDED.asset_name, vendor=EXCLUDED.vendor, owner=EXCLUDED.owner`,
          [r.user_id, r.service_id, r.asset_name, r.asset_type, r.environment, r.vendor, r.owner, r.external_id, r.external_source, r.inherited_criticality, r.zok_ids, r.instance_count]);
      }
    });
    await recordSync(integration_id, 'success', { count: rows.length });
    return json(res, 200, { ok: true, imported: rows.length });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
}
