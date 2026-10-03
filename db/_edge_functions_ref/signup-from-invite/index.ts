import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const body = await req.json().catch(() => ({}));
    const token = String(body.token || "").trim();
    const password = String(body.password || "");
    const displayName = String(body.display_name || "").trim();
    const marketingConsent = Boolean(body.marketing_consent);
    const marketingCategories: string[] = Array.isArray(body.marketing_categories) ? body.marketing_categories : [];

    if (!token || password.length < 8) {

      return new Response(JSON.stringify({ error: "invalid_input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: invite } = await admin
      .from("org_invitations")
      .select("id, email, status, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (!invite) {
      return new Response(JSON.stringify({ error: "invalid_token" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (invite.status !== "pending") {
      return new Response(JSON.stringify({ error: "invite_" + invite.status }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(invite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "expired" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = invite.email.toLowerCase();

    // Reliable O(1) lookup by email — avoids the 200-user listUsers cap.
    let existing: any = null;
    try {
      // @ts-ignore — getUserByEmail is available on the admin API
      const { data: byEmail } = await admin.auth.admin.getUserByEmail(email);
      existing = byEmail?.user ?? null;
    } catch (_) {
      // Fallback: paginate listUsers if getUserByEmail is unavailable
      let page = 1;
      while (page <= 20 && !existing) {
        const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        existing = list?.users?.find((u: any) => (u.email || "").toLowerCase() === email) || null;
        if (!list?.users?.length || list.users.length < 200) break;
        page++;
      }
    }

    if (existing) {
      // SECURITY: never overwrite an existing account's password via an
      // invitation token — that path enables account takeover. Direct the
      // user to sign in with their existing credentials; org membership will
      // be wired up by accept-org-invitation once they are authenticated.
      return new Response(
        JSON.stringify({ error: "account_exists", email }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName || email },
    });
    if (createErr) {
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Now sign in to get a session for the client
    const anon = createClient(supabaseUrl, anonKey);
    const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({ email, password });
    if (signInErr || !signIn?.session) {
      return new Response(JSON.stringify({ error: signInErr?.message || "signin_failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persist marketing consent on the profile
    try {
      await admin.from("profiles").update({
        marketing_consent: marketingConsent,
        marketing_consent_date: new Date().toISOString(),
        marketing_consent_categories: marketingConsent ? marketingCategories : [],
      }).eq("user_id", signIn.user.id);
    } catch (e) {
      console.error("marketing consent save failed", e);
    }



    return new Response(JSON.stringify({
      success: true,
      session: signIn.session,
      email,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("signup-from-invite error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
