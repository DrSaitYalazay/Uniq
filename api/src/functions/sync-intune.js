// Microsoft Intune (Graph API) yönetilen cihazları asset olarak içe aktarır.
import { requireUser, asService, json } from './_shared.js';

async function recordSync(id, status, stats) {
  await asService((c) => c.query(
    'UPDATE public.integrations SET last_sync_at=now(), last_sync_status=$2, last_sync_stats=$3 WHERE id=$1',
    [id, status, stats])).catch(() => {});
}

export default async function syncIntune(req, res) {
  const claims = requireUser(req, res); if (!claims) return;
  const { integration_id } = req.body || {};
  if (!integration_id) return json(res, 400, { error: 'integration_id required' });

  try {
    const integ = await asService(async (c) =>
      (await c.query('SELECT * FROM public.integrations WHERE id=$1', [integration_id])).rows[0]);
    if (!integ) return json(res, 404, { error: 'integration not found' });
    if (integ.type !== 'intune') return json(res, 400, { error: 'wrong integration type' });

    const tenantId = integ.config?.tenant_id;
    const clientId = integ.config?.client_id;
    const sec = await asService(async (c) =>
      (await c.query('SELECT value FROM public.integration_secrets WHERE user_id=$1 AND key=$2',
        [integ.user_id, `${integ.secret_ref}_CLIENT_SECRET`])).rows[0]);
    const clientSecret = sec?.value;
    if (!tenantId || !clientId || !clientSecret) return json(res, 400, { error: 'incomplete config or missing secret' });

    const tokenResp = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials' }),
    });
    if (!tokenResp.ok) {
      const txt = await tokenResp.text();
      await recordSync(integration_id, 'error', { message: `token ${tokenResp.status}`, preview: txt.slice(0, 300) });
      return json(res, 502, { error: 'token request failed', body: txt.slice(0, 300) });
    }
    const { access_token } = await tokenResp.json();

    const devResp = await fetch('https://graph.microsoft.com/v1.0/deviceManagement/managedDevices?$top=999', {
      headers: { Authorization: `Bearer ${access_token}`, Accept: 'application/json' },
    });
    if (!devResp.ok) {
      const txt = await devResp.text();
      await recordSync(integration_id, 'error', { message: `graph ${devResp.status}`, preview: txt.slice(0, 300) });
      return json(res, 502, { error: 'graph request failed', body: txt.slice(0, 300) });
    }
    const devices = (await devResp.json()).value ?? [];

    const firstSvc = await asService(async (c) =>
      (await c.query('SELECT id FROM public.services WHERE user_id=$1 LIMIT 1', [integ.user_id])).rows[0]);
    if (!firstSvc) {
      await recordSync(integration_id, 'error', { message: 'no services in tenant' });
      return json(res, 400, { error: 'Create at least one service before syncing' });
    }

    const rows = devices.map((d) => ({
      user_id: integ.user_id, service_id: firstSvc.id,
      asset_name: d.deviceName ?? d.id, asset_type: 'Endpoint', environment: 'Production',
      vendor: d.manufacturer ?? null, owner: d.userPrincipalName ?? null,
      external_id: d.id, external_source: 'intune', inherited_criticality: true, zok_ids: [], instance_count: 1,
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
