import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_ORIGIN = "https://uniqsuite.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const body = await req.json().catch(() => ({}));
    const token = String(body.token || "");
    if (!token) {
      return new Response(JSON.stringify({ error: "missing_token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Lookup invite
    const { data: invite } = await admin
      .from("org_invitations")
      .select("id, org_id, email, status, expires_at, organizations(name)")
      .eq("token", token)
      .maybeSingle();

    if (!invite) {
      return new Response(JSON.stringify({ error: "invalid_token" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invite.status !== "pending") {
      return new Response(JSON.stringify({ error: "invite_" + invite.status, email: invite.email }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(invite.expires_at) < new Date()) {
      await admin.from("org_invitations").update({ status: "expired" }).eq("id", invite.id);
      return new Response(JSON.stringify({ error: "expired", email: invite.email }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check action: 'preview' or 'accept'
    const action = body.action === "accept" ? "accept" : "preview";

    if (action === "preview") {
      return new Response(
        JSON.stringify({
          success: true,
          email: invite.email,
          // @ts-ignore — joined relation
          org_name: invite.organizations?.name || "",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Accept: requires authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "auth_required", email: invite.email }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "auth_required", email: invite.email }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Email must match
    if ((user.email || "").toLowerCase() !== invite.email.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "email_mismatch", expected: invite.email }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check seat cap once more based on org owner's tier
    const { data: seatCount } = await admin.rpc("org_member_count", { _org_id: invite.org_id });
    const { data: seatLimit } = await admin.rpc("org_seat_limit", { _org_id: invite.org_id });
    const { data: lecturerOrg } = await admin.rpc("is_lecturer_org", { _org_id: invite.org_id });
    if ((seatCount ?? 0) >= (seatLimit ?? 1)) {
      return new Response(JSON.stringify({ error: "seat_limit_reached" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already in another org
    const { data: existingOrg } = await admin
      .from("org_members")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existingOrg) {
      return new Response(JSON.stringify({ error: "already_in_org" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add as member
    const { error: addErr } = await admin.from("org_members").insert({
      org_id: invite.org_id,
      user_id: user.id,
      role: "member",
      invited_by: invite.id,
    });

    if (addErr) {
      console.error("add member failed", addErr);
      return new Response(JSON.stringify({ error: addErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("org_invitations").update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by: user.id,
    }).eq("id", invite.id);

    if (lecturerOrg === true) {
      await admin.from("user_roles").upsert(
        { user_id: user.id, role: "student" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
    }

    // Notify the org owner that the invite was accepted (best-effort)
    try {
      const { data: org } = await admin
        .from("organizations")
        .select("name, owner_id")
        .eq("id", invite.org_id)
        .maybeSingle();
      if (org?.owner_id) {
        const { data: ownerProfile } = await admin
          .from("profiles")
          .select("email, display_name, locale")
          .eq("user_id", org.owner_id)
          .maybeSingle();
        if (ownerProfile?.email) {
          const { data: memberProfile } = await admin
            .from("profiles")
            .select("display_name")
            .eq("user_id", user.id)
            .maybeSingle();
          const lang = (ownerProfile.locale === "en" ? "en" : "de");
          await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceKey}`,
              apikey: anonKey,
            },
            body: JSON.stringify({
              templateName: "org-invite-accepted",
              recipientEmail: ownerProfile.email,
              idempotencyKey: `org-invite-accepted-${invite.id}`,
              templateData: {
                ownerName: ownerProfile.display_name || "",
                memberEmail: user.email,
                memberName: memberProfile?.display_name || "",
                orgName: org.name || "",
                manageUrl: `${APP_ORIGIN}/settings`,
                lang,
              },
            }),
          });
        }
      }
    } catch (notifyErr) {
      console.error("owner notification failed", notifyErr);
    }


    return new Response(
      JSON.stringify({ success: true, org_id: invite.org_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("accept-org-invitation error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
