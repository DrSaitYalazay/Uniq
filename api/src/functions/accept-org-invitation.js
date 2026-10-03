// Davet önizleme/kabul. preview: auth gerektirmez; accept: kimlik doğrulanmış kullanıcı.
import { requireUser, bearerClaims, asService, enqueueEmail, json } from './_shared.js';

// V-5: ohne PUBLIC_APP_URL ein relativer Link (wie in auth.js) — nicht ein
// fremder Host, bei dem sonst Einladungs-Token landen würden.
const APP_ORIGIN = process.env.PUBLIC_APP_URL || '';

export default async function acceptOrgInvitation(req, res) {
  const token = String(req.body?.token || '');
  if (!token) return json(res, 400, { error: 'missing_token' });
  const action = req.body?.action === 'accept' ? 'accept' : 'preview';

  try {
    const invite = await asService(async (c) =>
      (await c.query(
        `SELECT i.id, i.org_id, i.email, i.status, i.expires_at, o.name AS org_name
           FROM public.org_invitations i LEFT JOIN public.organizations o ON o.id=i.org_id
          WHERE i.token=$1`, [token])).rows[0]);

    if (!invite) return json(res, 404, { error: 'invalid_token' });
    if (invite.status !== 'pending') return json(res, 400, { error: 'invite_' + invite.status, email: invite.email });
    if (new Date(invite.expires_at) < new Date()) {
      await asService((c) => c.query('UPDATE public.org_invitations SET status=\'expired\' WHERE id=$1', [invite.id]));
      return json(res, 400, { error: 'expired', email: invite.email });
    }

    if (action === 'preview') {
      return json(res, 200, { success: true, email: invite.email, org_name: invite.org_name || '' });
    }

    // accept: kimlik gerekli
    const claims = bearerClaims(req);
    if (!claims?.sub) return json(res, 401, { error: 'auth_required', email: invite.email });
    const userId = claims.sub;

    const result = await asService(async (c) => {
      const user = (await c.query('SELECT email FROM auth.users WHERE id=$1', [userId])).rows[0];
      if ((user?.email || '').toLowerCase() !== invite.email.toLowerCase()) {
        return { status: 403, body: { error: 'email_mismatch', expected: invite.email } };
      }
      // V-5: Sperren in fester Reihenfolge Nutzer -> Org -> Einladung.
      //  - Nutzer: zwei gleichzeitige Annahmen in VERSCHIEDENE Orgs (oder eine
      //    Annahme parallel zu /functions/org-team, das eine eigene Org anlegt)
      //    bestanden sonst beide die Pruefung "schon in einer Org" unten.
      //  - Org: zwei gleichzeitige Annahmen fuer dieselbe Org bestanden sonst beide
      //    die Sitzplatzpruefung und ueberschritten das Limit.
      //  - Einladung: ein gleichzeitiges Widerrufen/Loeschen wartet jetzt, statt
      //    von der Annahme ueberschrieben zu werden.
      await c.query("SELECT pg_advisory_xact_lock(hashtextextended('org-membership:' || $1, 0))", [userId]);
      await c.query('SELECT id FROM public.organizations WHERE id=$1 FOR UPDATE', [invite.org_id]);
      const status = (await c.query('SELECT status FROM public.org_invitations WHERE id=$1 FOR UPDATE', [invite.id])).rows[0]?.status;
      if (status !== 'pending') return { status: 400, body: { error: 'invite_' + (status || 'invalid'), email: invite.email } };

      const seatCount = (await c.query('SELECT public.org_member_count(_org_id => $1) AS n', [invite.org_id])).rows[0]?.n ?? 0;
      const seatLimit = (await c.query('SELECT public.org_seat_limit(_org_id => $1) AS n', [invite.org_id])).rows[0]?.n ?? 1;
      const lecturerOrg = (await c.query('SELECT public.is_lecturer_org(_org_id => $1) AS b', [invite.org_id])).rows[0]?.b;
      if (seatCount >= seatLimit) return { status: 400, body: { error: 'seat_limit_reached' } };

      const existingOrg = (await c.query('SELECT id FROM public.org_members WHERE user_id=$1', [userId])).rows[0];
      if (existingOrg) return { status: 400, body: { error: 'already_in_org' } };

      await c.query('INSERT INTO public.org_members(org_id, user_id, role, invited_by) VALUES ($1,$2,\'member\',$3)',
        [invite.org_id, userId, invite.id]);
      const upd = await c.query('UPDATE public.org_invitations SET status=\'accepted\', accepted_at=now(), accepted_by=$2 WHERE id=$1 AND status=\'pending\'',
        [invite.id, userId]);
      if (upd.rowCount !== 1) throw new Error('invite_state_changed');   // rollt die Mitgliedschaft zurueck
      if (lecturerOrg === true) {
        await c.query('INSERT INTO public.user_roles(user_id, role) VALUES ($1,\'student\') ON CONFLICT (user_id, role) DO NOTHING', [userId]);
      }
      return { status: 200, body: { success: true, org_id: invite.org_id }, memberEmail: user.email };
    });

    // Sahibe bilgilendirme — V-5: wirklich best-effort, NACH dem Commit. Vorher lief
    // sie in derselben Transaktion und fragte die nicht existierende Spalte
    // profiles.locale ab: der Fehler rollte die Annahme zurück, jede Annahme
    // endete mit 500 und niemand kam per Einladung ins Team.
    if (result.status === 200) {
      try {
        await asService(async (c) => {
          const org = (await c.query('SELECT name, owner_id FROM public.organizations WHERE id=$1', [invite.org_id])).rows[0];
          if (!org?.owner_id) return;
          const owner = (await c.query(
            'SELECT email, display_name, to_jsonb(p)->>\'locale\' AS locale FROM public.profiles p WHERE user_id=$1',
            [org.owner_id])).rows[0];
          if (!owner?.email) return;
          const member = (await c.query('SELECT display_name FROM public.profiles WHERE user_id=$1', [userId])).rows[0];
          await enqueueEmail('transactional_emails', {
            template_name: 'org-invite-accepted',
            recipient_email: owner.email,
            idempotency_key: `org-invite-accepted-${invite.id}`,
            variables: {
              ownerName: owner.display_name || '', memberEmail: result.memberEmail,
              memberName: member?.display_name || '', orgName: org.name || '',
              manageUrl: `${APP_ORIGIN}/settings`, lang: owner.locale === 'en' ? 'en' : 'de',
            },
          });
        });
      } catch (e) {
        console.error('[accept-org-invitation] Benachrichtigung des Owners fehlgeschlagen:', e.message);
      }
    }
    return json(res, result.status, result.body);
  } catch (e) {
    return json(res, 500, { error: String(e.message) });
  }
}
