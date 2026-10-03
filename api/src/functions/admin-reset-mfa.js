// ============================================================================
// A-14 — MFA-Wiederherstellung durch einen Berechtigten.
// ----------------------------------------------------------------------------
// Seit der Härtung verlangt `DELETE /auth/factors/:id` eine aal2-Sitzung — mit
// Absicht, sonst hätte ein Angreifer mit erbeutetem Passwort den zweiten Faktor
// einfach weggelöscht. Die Kehrseite: wer sein Authenticator-Gerät verliert,
// kommt an keine aal2-Sitzung mehr und damit an gar nichts. Bis hierher gab es
// KEINEN Weg zurück — weder für den Nutzer noch für den Support. Das ist der
// Support-Blocker, den diese Funktion schliesst.
//
// Aufrufen darf:
//   - der Plattform-Admin (public.has_role(uid,'admin')) für jeden, auch für sich
//     selbst (er ist die letzte Instanz; ohne Selbst-Reset wäre das Produkt bei
//     einem verlorenen Admin-Gerät endgültig zu);
//   - der Org-Eigentümer für ein Mitglied SEINER Organisation — aber NICHT für
//     sich selbst. Dürfte er das, wäre MFA für ihn wirkungslos: wer sein Passwort
//     hat, meldet sich an und setzt seinen eigenen zweiten Faktor zurück. Der
//     Eigentümer braucht dafür den Plattform-Admin.
//
// Eigentümerschaft und Mitgliedschaft werden genau wie in org-team.js ermittelt
// (organizations.owner_id bzw. org_members), damit es nur EINE Definition von
// „meine Organisation" gibt.
//
// Request : POST /functions/admin-reset-mfa { user_id, reason }
// Response: 200 { ok, removed_factors, revoked_sessions }
// ============================================================================
import { requireUser, asService, json, enqueueEmail, adminMfaRequired, MFA_REQUIRED_BODY } from './_shared.js';

// Begründung ist Pflichtfeld — analog zur Massen-Fertig-Notiz in der Umsetzung
// (P6.5). Ein MFA-Reset entzieht einem Konto seinen zweiten Faktor; ohne
// belastbaren Grund in der Akte ist das im Audit nicht vertretbar.
const REASON_MIN_LENGTH = 10;

async function callerIsAdmin(userId) {
  return asService(async (c) =>
    (await c.query('SELECT public.has_role(_user_id => $1, _role => $2) AS r', [userId, 'admin'])).rows[0]?.r);
}

export default async function adminResetMfa(req, res) {
  const claims = requireUser(req, res); if (!claims) return;
  const actorId = claims.sub;

  const targetId = String(req.body?.user_id || '').trim();
  const reason = String(req.body?.reason || '').trim();
  // Form der ID vor dem ersten SQL prüfen: sonst quittiert Postgres eine
  // Falscheingabe mit „invalid input syntax for type uuid" und der Aufrufer
  // bekommt ein 500 statt einer verständlichen 400.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) {
    return json(res, 400, { error: 'Geçersiz parametre' });
  }
  if (reason.length < REASON_MIN_LENGTH) {
    return json(res, 400, {
      error: `Begründung ist Pflicht (mind. ${REASON_MIN_LENGTH} Zeichen). / Gerekçe zorunludur (en az ${REASON_MIN_LENGTH} karakter).`,
    });
  }

  try {
    const isAdmin = await callerIsAdmin(actorId);
    // Admin-MFA-Pflicht: eine Admin-Sitzung ohne zweiten Faktor darf keine
    // Faktoren anderer Konten löschen (der Org-Eigentümer-Pfad bleibt unberührt).
    if (isAdmin && claims.aal !== 'aal2' && await adminMfaRequired()) return json(res, 403, MFA_REQUIRED_BODY);

    const out = await asService(async (c) => {
      let via = 'admin';
      if (!isAdmin) {
        // Org-Eigentümer-Pfad, Prüfung wie in org-team.js.
        const org = (await c.query('SELECT id FROM public.organizations WHERE owner_id=$1 LIMIT 1', [actorId])).rows[0];
        if (!org) return { status: 403, body: { error: 'Forbidden' } };
        // Selbst-Reset ist nur dem Plattform-Admin erlaubt (siehe Kopf).
        if (targetId === actorId) {
          return { status: 403, body: {
            error: 'Ihren eigenen zweiten Faktor kann nur der Plattform-Administrator zurücksetzen. / Kendi ikinci faktörünüzü yalnızca platform yöneticisi sıfırlayabilir.',
          } };
        }
        const member = await c.query(
          'SELECT 1 FROM public.org_members WHERE org_id=$1 AND user_id=$2', [org.id, targetId]);
        if (!member.rowCount) return { status: 403, body: { error: 'Forbidden' } };
        via = 'org_owner';
      }

      const target = (await c.query('SELECT id, email FROM auth.users WHERE id=$1', [targetId])).rows[0];
      if (!target) return { status: 404, body: { error: 'Kullanıcı yok' } };

      // 1) Alle Faktoren entfernen — auch unbestätigte, sonst bliebe eine halb
      //    eingeschriebene Zeile liegen und das erneute Einschreiben schlüge fehl.
      const removed = await c.query('DELETE FROM auth.mfa_factors WHERE user_id=$1', [targetId]);
      // 2) Alle Sitzungen beenden. Ohne diesen Schritt liefe eine bereits offene
      //    aal2-Sitzung weiter, obwohl der Faktor weg ist — der Reset wäre für
      //    einen Angreifer, der genau in dieser Sitzung sitzt, folgenlos.
      //    revoked_reason: gewollte Sperre, kein Diebstahlsignal (die
      //    Wiederverwendungserkennung in auth.js wertet nur 'rotated' aus).
      const revoked = await c.query(
        "UPDATE auth.refresh_tokens SET revoked=true, revoked_reason='mfa_reset' WHERE user_id=$1 AND revoked=false", [targetId]);
      // 3) Audit-Spur. Pflicht im GRC-Produkt: wer hat wem wann warum den zweiten
      //    Faktor entzogen. Ohne diese Zeile ist der Vorgang nachträglich nicht
      //    mehr von einem Angriff zu unterscheiden.
      await c.query(
        `INSERT INTO auth.admin_actions(actor_id, target_user_id, action, reason, details)
         VALUES ($1,$2,$3,$4,$5::jsonb)`,
        [actorId, targetId, 'mfa_reset', reason,
         JSON.stringify({ via, removed_factors: removed.rowCount, revoked_sessions: revoked.rowCount })]);

      return { status: 200, body: {
        ok: true,
        removed_factors: removed.rowCount,
        revoked_sessions: revoked.rowCount,
        email: target.email,
      } };
    });

    if (out.status === 200) {
      // Hinweis an den Betroffenen: er muss MFA neu einrichten und erfährt
      // zugleich davon, falls der Reset NICHT von ihm angestossen wurde.
      await enqueueEmail('auth_emails', {
        template_name: 'mfa-reset-notice', recipient_email: out.body.email,
        variables: { email: out.body.email, reason, login_link: `${process.env.PUBLIC_APP_URL || ''}/auth` },
      });
      delete out.body.email; // die Adresse gehört nicht in die Antwort
    }
    return json(res, out.status, out.body);
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
}
