// ============================================================================
// cy — API sunucusu. Supabase yerine düz PostgreSQL üzerinde:
//   /auth/*      GoTrue muadili kimlik doğrulama + MFA
//   /db/query    PostgREST muadili veri gateway'i (RLS korunur)
//   /db/rpc/:fn  RPC
//   /storage/*   Storage (company-logos)
//   /functions/* Edge function muadilleri
// ============================================================================
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authMiddleware } from './lib/jwt.js';
import { authRouter } from './auth/auth.js';
import { gatewayRouter } from './gateway/router.js';
import { storageRouter } from './storage.js';
import { functionsRouter } from './functions/router.js';
import { startScheduler } from './jobs/scheduler.js';

process.on('unhandledRejection', (e) => console.error('[api] unhandledRejection:', e?.message || e));
process.on('uncaughtException', (e) => console.error('[api] uncaughtException:', e?.message || e));

const app = express();

// V-4: das Framework nicht in jeder Antwort ankündigen ("X-Powered-By: Express").
app.disable('x-powered-by');

// Die App steht hinter nginx und Caddy. Ohne trust proxy wäre req.ip die Adresse
// des Reverse-Proxys — die IP-Bremse der Anmeldung (auth/login-throttle.js)
// würde dann alle Nutzer als eine einzige IP sehen.
app.set('trust proxy', 1);

app.use(cors({ origin: (process.env.CORS_ORIGIN || '*').split(','), credentials: true }));
// Storage ham gövde (upload) için raw; diğer her şey JSON
app.use('/storage', express.raw({ type: () => true, limit: '12mb' }));
app.use(express.json({ limit: '4mb' }));
app.use(authMiddleware); // req.claims / anon

app.get('/health', (_req, res) => res.json({ ok: true, service: 'cy-api', ts: Date.now() }));

app.use('/auth', authRouter);
app.use('/db', gatewayRouter);
app.use('/storage', storageRouter);
app.use('/functions', functionsRouter);

// Realtime = Polling by design (kein serverseitiges Push). Frueherer /realtime-SSE-No-Op entfernt.

app.use((err, _req, res, _next) => {
  console.error('[api] hata:', err.message);
  res.status(500).json({ error: { message: 'Sunucu hatası' } });
});

const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, () => console.log(`[cy-api] port ${PORT} dinleniyor`));

// Hintergrundjobs (Fristen-Reminder) — non-fatal starten.
try {
  startScheduler().catch((e) => console.error('[api] Scheduler-Start fehlgeschlagen:', e?.message || e));
} catch (e) {
  console.error('[api] Scheduler-Start fehlgeschlagen:', e?.message || e);
}
