// Bir organizasyona üyelik daveti oluşturur ve davet e-postasını kuyruğa alır.
import { requireUser, asService, enqueueEmail, json } from './_shared.js';

// V-5: ohne PUBLIC_APP_URL ein relativer Link (wie in auth.js) — nicht ein
// fremder Host, bei dem sonst Einladungs-Token landen würden.
const APP_ORIGIN = process.env.PUBLIC_APP_URL || '';

export default async function sendOrgInvitation(req, res) {
  const claims = requireUser(req, res); if (!claims) return;
  const userId = claims.sub;
  const email = String(req.body?.email || '').trim().toLowerCase();
  const orgId = String(req.body?.org_id || '');
  const lang = req.body?.lang === 'en' ? 'en' : 'de';
  if (!email || !email.includes('@') || !orgId) return json(res, 400, { error: 'invalid_input' });

  try {
    const result = await asService(async (c) => {
      const membership = (await c.query('SELECT role FROM public.org_members WHERE org_id=$1 AND user_id=$2', [orgId, userId])).rows[0];
      if (!membership || !['owner', 'admin'].includes(membership.role)) return { status: 403, body: { error: 'forbidden' } };

      const seatCount = (await c.query('SELECT public.org_total_seat_count(_org_id => $1) AS n', [orgId])).rows[0]?.n ?? 0;
      const seatLimit = (await c.query('SELECT public.org_seat_limit(_org_id => $1) AS n', [orgId])).rows[0]?.n ?? 1;
      if (seatCount >= seatLimit) return { status: 400, body: { error: 'seat_limit_reached' } };

      const existingProfile = (await c.query('SELECT user_id FROM public.profiles WHERE email=$1', [email])).rows[0];
      if (existingProfile) {
        const existingMember = (await c.query('SELECT id FROM public.org_members WHERE org_id=$1 AND user_id=$2', [orgId, existingProfile.user_id])).rows[0];
        if (existingMember) return { status: 400, body: { error: 'already_member' } };
      }

      let invite;
      try {
        invite = (await c.query(
          'INSERT INTO public.org_invitations(org_id, email, invited_by) VALUES ($1,$2,$3) RETURNING token, expires_at',
          [orgId, email, userId])).rows[0];
      } catch (e) {
        if (e.code === '23505') return { status: 400, body: { error: 'already_invited' } };
        throw e;
      }

      const org = (await c.query('SELECT name FROM public.organizations WHERE id=$1', [orgId])).rows[0];
      const inviter = (await c.query('SELECT display_name, email FROM public.profiles WHERE user_id=$1', [userId])).rows[0];
      const inviterName = inviter?.display_name || inviter?.email || 'Ein Teammitglied';
      const orgName = org?.name || 'Organisation';
      const acceptUrl = `${APP_ORIGIN}/accept-invite?token=${invite.token}`;

      await enqueueEmail('transactional_emails', {
        template_name: 'org-invitation',
        recipient_email: email,
        idempotency_key: `org-invite-${invite.token}`,
        variables: { inviterName, orgName, acceptUrl, lang },
      });
      return { status: 200, body: { success: true, expires_at: invite.expires_at } };
    });
    return json(res, result.status, result.body);
  } catch (e) {
    return json(res, 500, { error: String(e.message) });
  }
}
