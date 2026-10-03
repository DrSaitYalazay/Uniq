// E-posta kuyruğa alma — pgmq (public.enqueue_email RPC, service_role).
// Gerçek gönderim worker/email-worker.js tarafından yapılır (nodemailer/SMTP).
import { asService } from '../db.js';

export async function enqueueEmail(queue, payload) {
  try {
    await asService((c) =>
      c.query('SELECT public.enqueue_email($1, $2::jsonb)', [queue, JSON.stringify(payload)]));
  } catch (e) {
    console.error('[email] kuyruğa alınamadı:', e.message);
  }
}
