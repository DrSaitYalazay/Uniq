// ============================================================================
// cy — deadline-reminder Job (Spec-ITEM 05 / ARCHITECTURE.md §2.5).
// ----------------------------------------------------------------------------
// Läuft stündlich (scheduler.js), tenant-iterierend unter service_role
// (BYPASSRLS). Findet offene Fristen an den Schwellen 75 % / 90 % / überfällig
// und verschickt EINE E-Mail je (Deadline, Schwelle) — idempotent über
// public.frist_notification_log (measure_key = '<deadline_id>:<schwelle>').
//
// Idempotenz-Garantie: der Log-Insert läuft ON CONFLICT DO NOTHING; nur wenn er
// tatsächlich eine Zeile schreibt (RETURNING id), wird die Mail eingereiht.
// Damit versendet ein Testlauf einer 80-%-Frist GENAU eine Mail.
// ============================================================================
import { asService } from '../db.js';

/** Verbrauchter Anteil (0..100+) einer Frist zwischen starts_at und due_at. */
function pctOf(startsAt, dueAt, now) {
  const start = startsAt ? new Date(startsAt).getTime() : now.getTime();
  const due = new Date(dueAt).getTime();
  const total = due - start;
  if (!(total > 0)) return now.getTime() >= due ? 100 : 0;
  return Math.max(0, ((now.getTime() - start) / total) * 100);
}

/**
 * Bestimmt die HÖCHSTE erreichte Schwelle einer Frist.
 * @returns {{ schwelle: 'overdue'|'90'|'75', trigger: 'overdue'|'reminder' } | null}
 */
function reachedThreshold(startsAt, dueAt, now) {
  if (!dueAt) return null; // "unverzüglich"/auf Ersuchen → kein Timer
  if (now.getTime() >= new Date(dueAt).getTime()) {
    return { schwelle: 'overdue', trigger: 'overdue' };
  }
  const pct = pctOf(startsAt, dueAt, now);
  if (pct >= 90) return { schwelle: '90', trigger: 'reminder' };
  if (pct >= 75) return { schwelle: '75', trigger: 'reminder' };
  return null;
}

/**
 * Ein Durchlauf: alle offenen Fristen mit due_at prüfen, fällige Reminder
 * versenden + loggen. Gibt eine kleine Statistik zurück (für Logs/Tests).
 */
export async function runDeadlineReminders(now = new Date()) {
  let scanned = 0;
  let sent = 0;

  const rows = await asService(async (c) => {
    // Überfällige offene Fristen zusätzlich als 'overdue' markieren (additiv,
    // nur auf der neuen Tabelle — keine Verhaltensänderung an Bestand).
    await c.query(
      `UPDATE public.compliance_deadlines
         SET status = 'overdue'
       WHERE status = 'open' AND due_at IS NOT NULL AND due_at < now()`,
    );
    // Kandidaten: offen/überfällig, mit Fälligkeit, Tenant-Owner-Mail dazu.
    const res = await c.query(
      `SELECT d.id, d.tenant_id, d.label, d.kind, d.framework,
              d.starts_at, d.due_at, u.email AS owner_email
         FROM public.compliance_deadlines d
         JOIN auth.users u ON u.id = d.tenant_id
        WHERE d.status IN ('open','overdue')
          AND d.due_at IS NOT NULL`,
    );
    return res.rows;
  });

  for (const d of rows) {
    scanned++;
    const th = reachedThreshold(d.starts_at, d.due_at, now);
    if (!th) continue;
    if (!d.owner_email) continue;

    const measureKey = `${d.id}:${th.schwelle}`;
    const dueDate = new Date(d.due_at).toISOString().slice(0, 10); // date

    // Atomar: Idempotenter Log-Insert UND E-Mail-Enqueue in EINER Transaktion.
    // Zuvor lief das Enqueue in einer separaten Transaktion NACH dem bereits
    // committeten Log-Insert (und schluckte Fehler intern) — schlug das Enqueue
    // fehl, blieb der Log-Eintrag stehen und die Idempotenz verhinderte jeden
    // erneuten Versuch ⇒ Reminder für immer verloren. Jetzt: wirft der
    // enqueue_email-Aufruf, rollt der Log-Insert mit zurück ⇒ nächster Lauf
    // versucht es erneut.
    const emailed = await asService(async (c) => {
      const r = await c.query(
        `INSERT INTO public.frist_notification_log
           (user_id, measure_key, trigger_type, recipient_email, due_date)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, measure_key, trigger_type, recipient_email)
         DO NOTHING
         RETURNING id`,
        [d.tenant_id, measureKey, th.trigger, d.owner_email, dueDate],
      );
      if (r.rowCount === 0) return false; // schon versandt → idempotent überspringen
      // Gleiche Transaktion — Fehler propagiert und rollt den Log-Insert zurück.
      await c.query('SELECT public.enqueue_email($1, $2::jsonb)', [
        'transactional_emails',
        JSON.stringify({
          template_name: 'deadline-reminder',
          recipient_email: d.owner_email,
          variables: {
            label: d.label,
            kind: d.kind,
            framework: d.framework || '',
            due_date: dueDate,
            schwelle: th.schwelle,
            trigger_type: th.trigger,
          },
        }),
      ]);
      return true;
    });
    if (emailed) sent++;
  }

  if (scanned || sent) {
    console.log(`[deadline-reminder] geprüft: ${scanned}, versandt: ${sent}`);
  }
  return { scanned, sent };
}

export default runDeadlineReminders;
