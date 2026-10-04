// ============================================================================
// cy — E-posta worker'ı. pgmq kuyruklarını (auth_emails, transactional_emails)
// belirli aralıklarla okur ve SMTP (nodemailer) ile gönderir. Supabase'in
// pg_cron + edge function pipeline'ının yerine geçer.
// ============================================================================
import 'dotenv/config';
import nodemailer from 'nodemailer';
import { asService } from '../db.js';
import { renderTemplate } from '../lib/email-templates.js';

const QUEUES = ['auth_emails', 'transactional_emails'];
const POLL_MS = Number(process.env.EMAIL_POLL_MS || 5000);
const BATCH = Number(process.env.EMAIL_BATCH || 10);
const VT = Number(process.env.EMAIL_VT_SECONDS || 60);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
});
const FROM = process.env.EMAIL_FROM || 'no-reply@localhost';

async function processQueue(queue) {
  const msgs = await asService(async (c) =>
    (await c.query('SELECT msg_id, read_ct, message FROM public.read_email_batch($1,$2,$3)', [queue, BATCH, VT])).rows);
  for (const m of msgs) {
    try {
      const p = m.message || {};
      const { subject, html } = renderTemplate(p.template_name, p.variables || {});
      if (process.env.SMTP_HOST) {
        // reply_to nur, wenn es eine schlichte Adresse ist (Website-Anfrage: bereits geprüft).
        const replyTo = typeof p.reply_to === 'string' && /^[^\s@<>,;"]+@[^\s@<>,;"]+$/.test(p.reply_to) ? p.reply_to : undefined;
        await transporter.sendMail({ from: FROM, to: p.recipient_email, subject, html, ...(replyTo ? { replyTo } : {}) });
      } else {
        console.log(`[email:dev] -> ${p.recipient_email} | ${subject}`); // SMTP yoksa logla
      }
      await asService((c) => c.query('SELECT public.delete_email($1,$2)', [queue, m.msg_id]));
      await asService((c) => c.query(
        'INSERT INTO public.email_send_log(template_name, recipient_email, status) VALUES ($1,$2,\'sent\')',
        [p.template_name || 'unknown', p.recipient_email]).catch(() => {}));
    } catch (e) {
      console.error(`[email] gönderim hatası (msg ${m.msg_id}, deneme ${m.read_ct}):`, e.message);
      if (m.read_ct >= 5) {
        // DLQ'ya taşı
        await asService((c) => c.query('SELECT public.move_to_dlq($1,$2,$3,$4)',
          [queue, `${queue}_dlq`, m.msg_id, m.message]).catch(() => {}));
      }
    }
  }
  return msgs.length;
}

async function loop() {
  for (const q of QUEUES) {
    try { await processQueue(q); } catch (e) { console.error(`[email] ${q}:`, e.message); }
  }
  setTimeout(loop, POLL_MS);
}

console.log('[cy-email-worker] başladı, kuyruklar:', QUEUES.join(', '));
loop();
