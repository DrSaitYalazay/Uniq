// Gateway HTTP uçları: /db/query ve /db/rpc/:fn
import { Router } from 'express';
import { runQuery } from './query.js';
import { runRpc } from './rpc.js';

export const gatewayRouter = Router();

// Ungueltiges/abgelaufenes Bearer-Token => 401 (nicht still als anon weiterlaufen).
// Der Client erneuert bei 401 das Token und wiederholt die Anfrage. Fehlt der
// Header ganz (echter anon-Zugriff), greift dies NICHT.
function rejectIfAuthInvalid(req, res) {
  if (req.authInvalid) {
    res.status(401).json({ data: null, count: null, error: { message: 'Token ungültig oder abgelaufen', code: '401' } });
    return true;
  }
  return false;
}

// HTTP-Status für ein {data,error}-Ergebnis bestimmen.
// WICHTIG: PG-SQLSTATE (5-stellig, z. B. 42501/23505/22P02) darf NIE als
// HTTP-Status verwendet werden — sonst käme z. B. „permission denied" (42501)
// zufällig als 200 und „invalid_text" (22P02) als 400 durch. Nur echte,
// 3-stellige HTTP-Codes (100–599, z. B. unser eigenes '401') werden als Status
// gesetzt; jeder DB-Fehler bleibt HTTP 200 und trägt den Fehler im Body
// (PostgREST-Semantik, die der Client in `run()` unabhängig vom Status liest).
function httpStatusFor(result) {
  if (!result || !result.error) return 200;
  const code = result.error.code;
  if (typeof code === 'string' && /^[1-5]\d\d$/.test(code)) return Number(code);
  if (typeof code === 'number' && code >= 100 && code <= 599) return code;
  return 200;
}

// Yapılandırılmış sorgu tarifi çalıştır (from().select()... buradan geçer)
gatewayRouter.post('/query', async (req, res) => {
  if (rejectIfAuthInvalid(req, res)) return;
  const result = await runQuery(req.body || {}, req.claims);
  res.status(httpStatusFor(result)).json(result);
});

// RPC çağrısı
gatewayRouter.post('/rpc/:fn', async (req, res) => {
  if (rejectIfAuthInvalid(req, res)) return;
  const result = await runRpc(req.params.fn, req.body || {}, req.claims);
  res.status(httpStatusFor(result)).json(result);
});
