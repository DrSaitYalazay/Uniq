// Admin-only: permanently delete a user and all their tenant data.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const token = authHeader.replace('Bearer ', '')
  const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token)
  if (claimsError || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const callerId = claimsData.claims.sub as string

  const admin = createClient(supabaseUrl, serviceKey)

  // Verify caller is admin
  const { data: isAdmin, error: roleErr } = await admin.rpc('has_role', {
    _user_id: callerId, _role: 'admin',
  })
  if (roleErr || !isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let targetUserId = ''
  try {
    const body = await req.json()
    targetUserId = typeof body.user_id === 'string' ? body.user_id : ''
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (!targetUserId) {
    return new Response(JSON.stringify({ error: 'user_id required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (targetUserId === callerId) {
    return new Response(JSON.stringify({ error: 'cannot delete your own account here' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Refuse to delete other admins (safety)
  const { data: targetIsAdmin } = await admin.rpc('has_role', {
    _user_id: targetUserId, _role: 'admin',
  })
  if (targetIsAdmin) {
    return new Response(JSON.stringify({ error: 'cannot delete an admin user' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Surviving tenant tables under the new hub-and-spoke schema
  const tenantTables = [
    'answers', 'incidents', 'audit_findings', 'audits',
    'assets', 'company_profiles', 'user_tool_data',
  ]
  for (const t of tenantTables) {
    await admin.from(t).delete().eq('user_id', targetUserId)
  }
  await admin.from('user_roles').delete().eq('user_id', targetUserId)
  await admin.from('org_members').delete().eq('user_id', targetUserId)
  await admin.from('profiles').delete().eq('user_id', targetUserId)

  // Finally delete auth user (idempotent: ignore "not found")
  const { error: delErr } = await admin.auth.admin.deleteUser(targetUserId)
  if (delErr && !/not.?found/i.test(delErr.message)) {
    return new Response(JSON.stringify({ error: delErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
