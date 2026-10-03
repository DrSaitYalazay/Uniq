// Kundenseitige Team-Verwaltung (Zwei-Ebenen-Modell):
//  - Der Org-Owner (Kunde) verwaltet sein EIGENES Team bis zum Sitzplatzlimit
//    seines Tarifs (Pro=1, Enterprise/Premium=5, XL=15).
//  - Der Vendor/Superadmin (globales Admin-Panel) sieht diese Sub-User NICHT hier;
//    Team-Daten sind pro Organisation isoliert.
//
// Aktionen (POST /functions/org-team { action, ... }):
//   list           → stellt Org sicher (legt sie bei Bedarf an) + Mitglieder + Einladungen + Sitzplätze
//   remove-member  → { member_user_id }  (nur Owner; Owner/sich selbst nicht entfernbar)
//   revoke-invite  → { invitation_id }   (nur Owner)
import { requireUser, asService, json } from './_shared.js';

async function ensureOrg(c, userId) {
  // Dieselbe Nutzersperre wie in accept-org-invitation: sonst konnte eine
  // gleichzeitige Einladungsannahme zwischen Pruefung und Anlage durchrutschen
  // (Ergebnis: zwei Mitgliedschaften).
  await c.query("SELECT pg_advisory_xact_lock(hashtextextended('org-membership:' || $1, 0))", [userId]);
  // 1) Existiert bereits eine Org, deren Owner der Nutzer ist?
  let org = (await c.query('SELECT id, name FROM public.organizations WHERE owner_id=$1 ORDER BY created_at LIMIT 1', [userId])).rows[0];
  if (!org) {
    // V-5: Wer schon MITGLIED einer fremden Org ist, bekommt keine eigene. Vorher
    // legte das blosse Oeffnen des Reiters "Team" fuer jedes Mitglied eine zweite
    // Org an; mit zwei Mitgliedschaften loeste get_org_owner_id() den Mandanten
    // zufaellig auf (eigene Daten mal sichtbar, mal nicht).
    const fremd = (await c.query(
      `SELECT o.id, o.name FROM public.org_members m JOIN public.organizations o ON o.id = m.org_id
        WHERE m.user_id = $1 ORDER BY m.created_at, m.id LIMIT 1`, [userId])).rows[0];
    if (fremd) return { org: fremd, isOwner: false };
    const prof = (await c.query('SELECT display_name, email FROM public.profiles WHERE user_id=$1', [userId])).rows[0];
    const name = (prof?.display_name || prof?.email || 'Team').split('@')[0] + ' — Team';
    org = (await c.query('INSERT INTO public.organizations(name, owner_id) VALUES ($1,$2) RETURNING id, name', [name, userId])).rows[0];
  }
  // 2) Owner-Mitgliedschaft sicherstellen.
  await c.query(
    `INSERT INTO public.org_members(org_id, user_id, role)
       VALUES ($1,$2,'owner')
       ON CONFLICT (org_id, user_id) DO UPDATE SET role='owner'`,
    [org.id, userId]);
  return { org, isOwner: true };
}

export default async function orgTeam(req, res) {
  const claims = requireUser(req, res); if (!claims) return;
  const userId = claims.sub;
  const action = req.body?.action || 'list';

  try {
    const out = await asService(async (c) => {
      if (action === 'list') {
        const { org, isOwner } = await ensureOrg(c, userId);
        // Nacheinander statt Promise.all: dieselbe Verbindung kann nur eine Abfrage
        // zugleich ausfuehren (pg warnt, pg@9 wirft).
        const seatCount = await c.query('SELECT public.org_total_seat_count(_org_id => $1) AS n', [org.id]);
        const seatLimit = await c.query('SELECT public.org_seat_limit(_org_id => $1) AS n', [org.id]);
        if (!isOwner) {
          // V-5: Mitglieder sehen, zu welcher Org sie gehoeren — verwaltet wird sie
          // vom Owner. Keine Mitglieder- und Einladungslisten (E-Mail-Adressen).
          return { status: 200, body: {
            org_id: org.id, org_name: org.name, is_owner: false,
            seat_count: Number(seatCount.rows[0]?.n ?? 0),
            seat_limit: Number(seatLimit.rows[0]?.n ?? 1),
            members: [], invitations: [],
          }};
        }
        const members = await c.query(
          `SELECT m.user_id, m.role, COALESCE(p.display_name,'') AS display_name, COALESCE(p.email,'') AS email
             FROM public.org_members m
             LEFT JOIN public.profiles p ON p.user_id = m.user_id
            WHERE m.org_id=$1
            ORDER BY (m.role='owner') DESC, p.email`, [org.id]);
        const invitations = await c.query(
          `SELECT id, email, status, expires_at, created_at
             FROM public.org_invitations
            WHERE org_id=$1 AND status='pending'
            ORDER BY created_at DESC`, [org.id]);
        return { status: 200, body: {
          org_id: org.id, org_name: org.name, is_owner: true,
          seat_count: Number(seatCount.rows[0]?.n ?? 0),
          seat_limit: Number(seatLimit.rows[0]?.n ?? 1),
          members: members.rows,
          invitations: invitations.rows,
        }};
      }

      // Owner-Prüfung für mutierende Aktionen.
      const org = (await c.query('SELECT id FROM public.organizations WHERE owner_id=$1 LIMIT 1', [userId])).rows[0];
      if (!org) return { status: 403, body: { error: 'not_owner' } };

      if (action === 'remove-member') {
        const memberId = String(req.body?.member_user_id || '');
        if (!memberId) return { status: 400, body: { error: 'invalid_input' } };
        if (memberId === userId) return { status: 400, body: { error: 'cannot_remove_owner' } };
        await c.query('DELETE FROM public.org_members WHERE org_id=$1 AND user_id=$2 AND role<>$3', [org.id, memberId, 'owner']);
        return { status: 200, body: { ok: true } };
      }

      if (action === 'revoke-invite') {
        const invId = String(req.body?.invitation_id || '');
        if (!invId) return { status: 400, body: { error: 'invalid_input' } };
        await c.query("UPDATE public.org_invitations SET status='revoked' WHERE id=$1 AND org_id=$2 AND status='pending'", [invId, org.id]);
        return { status: 200, body: { ok: true } };
      }

      return { status: 400, body: { error: 'unknown_action' } };
    });
    return json(res, out.status, out.body);
  } catch (e) {
    return json(res, 500, { error: String(e.message) });
  }
}
