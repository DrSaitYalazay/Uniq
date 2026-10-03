import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // User-scoped client (validates JWT + RLS)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const orgId = String(body.org_id || "");
    const lang = body.lang === "en" ? "en" : "de";

    if (!email || !email.includes("@") || !orgId) {
      return new Response(JSON.stringify({ error: "invalid_input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service client to read org details
    const admin = createClient(supabaseUrl, serviceKey);

    // Verify user is owner/admin of org
    const { data: membership } = await admin
      .from("org_members")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check seat cap based on org owner's tier (members + pending invites < limit)
    const { data: seatCount } = await admin.rpc("org_total_seat_count", { _org_id: orgId });
    const { data: seatLimit } = await admin.rpc("org_seat_limit", { _org_id: orgId });
    if ((seatCount ?? 0) >= (seatLimit ?? 1)) {
      return new Response(JSON.stringify({ error: "seat_limit_reached" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if email already a member
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      const { data: existingMember } = await admin
        .from("org_members")
        .select("id")
        .eq("org_id", orgId)
        .eq("user_id", existingProfile.user_id)
        .maybeSingle();
      if (existingMember) {
        return new Response(JSON.stringify({ error: "already_member" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create invitation (the unique partial index prevents duplicates)
    const { data: invitation, error: inviteErr } = await admin
      .from("org_invitations")
      .insert({ org_id: orgId, email, invited_by: user.id })
      .select("token, expires_at")
      .single();

    if (inviteErr) {
      if (inviteErr.code === "23505") {
        return new Response(JSON.stringify({ error: "already_invited" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw inviteErr;
    }

    // Get org name + inviter name
    const { data: org } = await admin.from("organizations").select("name").eq("id", orgId).single();
    const { data: inviterProfile } = await admin
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", user.id)
      .single();

    const rawInviterName = inviterProfile?.display_name || inviterProfile?.email || "Ein Teammitglied";
    const rawOrgName = org?.name || "Organisation";

    // HTML-escape user-supplied values before interpolating into email HTML
    // to prevent HTML/script injection in the rendered invitation email.
    const escHtml = (s: string) => String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    const inviterName = escHtml(rawInviterName);
    const orgName = escHtml(rawOrgName);

    // Construct accept URL — ALWAYS use production domain so recipients land on the live app,
    // not the Lovable editor preview (which requires workspace access and shows "Access denied").
    const origin = "https://uniqsuite.com";
    const acceptUrl = `${origin}/accept-invite?token=${invitation.token}`;

    // Send email via transactional email function (queued)
    const subject = lang === "de"
      ? `Einladung zu ${orgName} auf UniqSuite`
      : `Invitation to join ${orgName} on UniqSuite`;

    const html = lang === "de"
      ? `
<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">
  <div style="background:linear-gradient(135deg,#003399,#0055cc);padding:32px;border-radius:12px;text-align:center;color:#fff;">
    <h1 style="margin:0;font-size:24px;">UniqSuite</h1>
    <p style="margin:8px 0 0;opacity:0.9;">NIS2 Umsetzung & Konformitätsprüfung</p>
  </div>
  <div style="padding:32px 16px;">
    <h2 style="color:#111827;">Sie wurden eingeladen</h2>
    <p><strong>${inviterName}</strong> hat Sie eingeladen, dem Team <strong>${orgName}</strong> auf UniqSuite beizutreten.</p>
    <p>Klicken Sie auf den folgenden Link, um die Einladung anzunehmen. Falls Sie noch kein Konto haben, können Sie eines erstellen.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${acceptUrl}" style="background:#003399;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Einladung annehmen</a>
    </div>
    <p style="color:#6b7280;font-size:13px;">Diese Einladung läuft in 14 Tagen ab. Falls Sie diese E-Mail nicht erwartet haben, können Sie sie ignorieren.</p>
    <p style="color:#9ca3af;font-size:12px;word-break:break-all;">Link: ${acceptUrl}</p>
  </div>
  <div style="text-align:center;color:#9ca3af;font-size:12px;padding:16px;border-top:1px solid #e5e7eb;">
    UniqSuite · uniqsuite.com
  </div>
</body></html>`
      : `
<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">
  <div style="background:linear-gradient(135deg,#003399,#0055cc);padding:32px;border-radius:12px;text-align:center;color:#fff;">
    <h1 style="margin:0;font-size:24px;">UniqSuite</h1>
    <p style="margin:8px 0 0;opacity:0.9;">NIS2 Implementation & Compliance</p>
  </div>
  <div style="padding:32px 16px;">
    <h2 style="color:#111827;">You've been invited</h2>
    <p><strong>${inviterName}</strong> invited you to join the team <strong>${orgName}</strong> on UniqSuite.</p>
    <p>Click the link below to accept the invitation. If you don't have an account yet, you can create one.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${acceptUrl}" style="background:#003399;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Accept invitation</a>
    </div>
    <p style="color:#6b7280;font-size:13px;">This invitation expires in 14 days. If you weren't expecting this email, you can safely ignore it.</p>
    <p style="color:#9ca3af;font-size:12px;word-break:break-all;">Link: ${acceptUrl}</p>
  </div>
  <div style="text-align:center;color:#9ca3af;font-size:12px;padding:16px;border-top:1px solid #e5e7eb;">
    UniqSuite · uniqsuite.com
  </div>
</body></html>`;

    // Enqueue via send-transactional-email — forward caller's JWT (function validates it)
    const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({
        templateName: "org-invitation",
        recipientEmail: email,
        idempotencyKey: `org-invite-${invitation.token}`,
        templateData: { inviterName: rawInviterName, orgName: rawOrgName, acceptUrl, lang },
      }),
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      console.error("Email send failed", errText);
      // Don't fail the invite — admin can resend
    }

    return new Response(
      JSON.stringify({ success: true, expires_at: invitation.expires_at }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-org-invitation error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
