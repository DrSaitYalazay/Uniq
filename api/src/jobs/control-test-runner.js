// ============================================================================
// cy — control-test-runner Job (E3.5 / ENGINE_ARCHITECTURE_MARKETGRADE.md).
// ----------------------------------------------------------------------------
// Klasse C-RUNTIME. Läuft stündlich (scheduler.js), tenant-iterierend unter
// service_role (BYPASSRLS via asService — NIE aus User-JWT). Führt fällige
// control_tests aus (letzter Lauf > interval_hours) und schreibt je Test EIN
// control_test_results(tenant_id,test_id,status,detail). Bei 'pass' optional
// Auto-Evidence (kind 'log', valid_until = now + ttl) → evidence_id gesetzt.
//
// v1-Testkatalog OHNE externe Konnektoren (kind-basiert), sofort verkaufbar,
// weil er interne Datenqualität prüft:
//   * deadline_adherence — fail wenn überfällige compliance_deadlines für die
//                          Ziel-Kontrolle existieren, sonst pass.
//   * evidence_present   — pass wenn ≥1 nicht-abgelaufene Evidence an der
//                          Kontrolle (answer_evidence+evidence.valid_until).
//   * answer_review_age  — fail wenn answers.updated_at älter als
//                          config.max_age_days (Default 365), sonst pass;
//                          na wenn (noch) keine Antwort existiert.
//   * webhook_pull       — generischer HTTP-GET (config.url) + einfacher
//                          JSONPath-Vergleich (config.jsonpath vs config.expect);
//                          status 'error' bei Netzwerkfehler.
// Konnektor-SDK (Intune/Okta/GitHub) ist Phase 2 — trägt über config jsonb.
//
// Non-fatal: jeder Test-Fehler ist gekapselt; ein fehlerhafter Test darf den
// Lauf nicht abbrechen. Netzwerk-I/O (webhook_pull) läuft AUSSERHALB der
// DB-Transaktion, damit keine Verbindung während des HTTP-Calls blockiert.
// ============================================================================
import { asService } from '../db.js';

const DEFAULT_REVIEW_MAX_AGE_DAYS = 365;
const DEFAULT_AUTO_EVIDENCE_TTL_DAYS = 30;
const WEBHOOK_TIMEOUT_MS = 10_000;

/**
 * Minimaler JSONPath-Resolver: unterstützt Punkt-Segmente und [index]
 * (führendes '$'/'$.' wird entfernt). Reicht für Intune/ServiceNow/Okta-GETs.
 */
function resolvePath(obj, path) {
  if (path == null || path === '') return obj;
  const parts = String(path).replace(/^\$\.?/, '').split(/[.[\]]+/).filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

/** webhook_pull: GET + JSONPath-Vergleich. Kein DB-Zugriff. */
async function evalWebhook(test) {
  const cfg = test.config || {};
  const url = cfg.url;
  if (!url) {
    return { status: 'error', detail: { error: 'config.url fehlt', kind: test.kind } };
  }
  if (typeof globalThis.fetch !== 'function') {
    return { status: 'error', detail: { error: 'fetch nicht verfügbar (Node <18?)' } };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), WEBHOOK_TIMEOUT_MS);
  try {
    const res = await globalThis.fetch(url, {
      method: 'GET',
      headers: cfg.headers && typeof cfg.headers === 'object' ? cfg.headers : undefined,
      signal: ctrl.signal,
    });
    if (!res.ok) {
      return { status: 'error', detail: { error: `HTTP ${res.status}`, url } };
    }
    const json = await res.json();
    const actual = resolvePath(json, cfg.jsonpath);
    const ok = String(actual) === String(cfg.expect);
    return {
      status: ok ? 'pass' : 'fail',
      detail: { url, jsonpath: cfg.jsonpath ?? null, expected: cfg.expect ?? null, actual: actual ?? null },
    };
  } catch (e) {
    return { status: 'error', detail: { error: e?.message || String(e), url } };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * DB-gestützte v1-Tests (deadline_adherence / evidence_present / answer_review_age).
 * Läuft innerhalb der bereits offenen service_role-Transaktion (`c`).
 */
async function evalDbTest(c, test, now) {
  const fw = test.framework;
  const cid = test.control_id;
  const cfg = test.config || {};

  if (test.kind === 'deadline_adherence') {
    // Überfällige Fristen der Ziel-Kontrolle → fail. Verknüpfung über
    // (framework+ref_id) ODER answers-Referenz ODER meta.control_id.
    const r = await c.query(
      `SELECT count(*)::int AS overdue
         FROM public.compliance_deadlines
        WHERE tenant_id = $1
          AND due_at IS NOT NULL AND due_at < $2
          AND status IN ('open','overdue')
          AND (
                ($3::text IS NOT NULL AND framework = $3 AND ref_id = $4)
             OR (ref_table = 'answers' AND ref_id = $4)
             OR (meta->>'control_id' = $4)
          )`,
      [test.tenant_id, now.toISOString(), fw, cid],
    );
    const overdue = r.rows[0]?.overdue || 0;
    return {
      status: overdue > 0 ? 'fail' : 'pass',
      detail: { kind: test.kind, framework: fw, control_id: cid, overdue_deadlines: overdue },
    };
  }

  if (test.kind === 'evidence_present') {
    if (!fw || !cid) {
      return { status: 'na', detail: { kind: test.kind, reason: 'keine Ziel-Kontrolle' } };
    }
    const r = await c.query(
      `SELECT count(*)::int AS fresh
         FROM public.answer_evidence ae
         JOIN public.evidence e ON e.id = ae.evidence_id
        WHERE ae.tenant_id = $1 AND ae.framework = $2 AND ae.control_id = $3
          AND (e.valid_until IS NULL OR e.valid_until >= $4::date)`,
      [test.tenant_id, fw, cid, now.toISOString().slice(0, 10)],
    );
    const fresh = r.rows[0]?.fresh || 0;
    return {
      status: fresh >= 1 ? 'pass' : 'fail',
      detail: { kind: test.kind, framework: fw, control_id: cid, fresh_evidence: fresh },
    };
  }

  if (test.kind === 'answer_review_age') {
    if (!fw || !cid) {
      return { status: 'na', detail: { kind: test.kind, reason: 'keine Ziel-Kontrolle' } };
    }
    const maxAge = Number(cfg.max_age_days) > 0 ? Number(cfg.max_age_days) : DEFAULT_REVIEW_MAX_AGE_DAYS;
    const r = await c.query(
      `SELECT updated_at,
              (updated_at < $4::timestamptz - make_interval(days => $1)) AS stale
         FROM public.answers
        WHERE tenant_id = $2 AND framework = $3 AND control_id = $5`,
      [maxAge, test.tenant_id, fw, now.toISOString(), cid],
    );
    if (r.rowCount === 0) {
      return { status: 'na', detail: { kind: test.kind, framework: fw, control_id: cid, reason: 'keine Antwort' } };
    }
    const stale = r.rows[0].stale === true;
    return {
      status: stale ? 'fail' : 'pass',
      detail: { kind: test.kind, framework: fw, control_id: cid, max_age_days: maxAge, updated_at: r.rows[0].updated_at },
    };
  }

  // Unbekannter kind (z.B. Konnektor-Phase-2) → na, kein falsches Grün.
  return { status: 'na', detail: { kind: test.kind, reason: 'kind nicht im v1-Katalog' } };
}

/** Ergebnis + optionale Auto-Evidence schreiben. */
async function insertResult(c, test, evalResult, now) {
  let evidenceId = null;

  const cfg = test.config || {};
  const ttlRaw = Number(cfg.auto_evidence_ttl_days);
  const wantEvidence = evalResult.status === 'pass'
    && (cfg.auto_evidence === true || Number.isFinite(ttlRaw));

  if (wantEvidence) {
    const ttl = Number.isFinite(ttlRaw) && ttlRaw > 0 ? ttlRaw : DEFAULT_AUTO_EVIDENCE_TTL_DAYS;
    const ev = await c.query(
      `INSERT INTO public.evidence (tenant_id, title, kind, description, collected_at, valid_until)
       VALUES ($1, $2, 'log', $3, $4, ($4::timestamptz + make_interval(days => $5))::date)
       RETURNING id`,
      [
        test.tenant_id,
        `Auto-Nachweis: ${test.label || test.kind}`,
        `Automatisch erzeugt durch control-test-runner (${test.kind}), Test ${test.id}.`,
        now.toISOString(),
        ttl,
      ],
    );
    evidenceId = ev.rows[0]?.id || null;

    // An die Kontrolle hängen, damit evidence_present den Nachweis auch sieht.
    if (evidenceId && test.framework && test.control_id) {
      await c.query(
        `INSERT INTO public.answer_evidence (evidence_id, tenant_id, framework, control_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (evidence_id, framework, control_id) DO NOTHING`,
        [evidenceId, test.tenant_id, test.framework, test.control_id],
      );
    }
  }

  await c.query(
    `INSERT INTO public.control_test_results (tenant_id, test_id, ran_at, status, evidence_id, detail)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [test.tenant_id, test.id, now.toISOString(), evalResult.status, evidenceId, JSON.stringify(evalResult.detail || {})],
  );
}

/**
 * Ein Durchlauf: alle fälligen, aktivierten control_tests ausführen.
 * @returns {Promise<{due:number, ran:number, pass:number, fail:number, error:number, na:number}>}
 */
export async function runControlTests(now = new Date()) {
  const stats = { due: 0, ran: 0, pass: 0, fail: 0, error: 0, na: 0 };

  // Fällige Tests laden (letzter Lauf > interval_hours oder nie gelaufen).
  const due = await asService(async (c) => {
    const res = await c.query(
      `SELECT t.id, t.tenant_id, t.framework, t.control_id, t.node_id,
              t.kind, t.label, t.config, t.interval_hours, lr.last_run
         FROM public.control_tests t
         LEFT JOIN LATERAL (
           SELECT max(ran_at) AS last_run
             FROM public.control_test_results r
            WHERE r.test_id = t.id
         ) lr ON true
        WHERE t.enabled = true
          AND (lr.last_run IS NULL
               OR lr.last_run < now() - make_interval(hours => t.interval_hours))`,
    );
    return res.rows;
  });

  stats.due = due.length;

  for (const test of due) {
    try {
      // Netzwerk-Test außerhalb der DB-Transaktion vorab auswerten.
      let pre = null;
      if (test.kind === 'webhook_pull') {
        pre = await evalWebhook(test);
      }

      await asService(async (c) => {
        const evalResult = pre || (await evalDbTest(c, test, now));
        await insertResult(c, test, evalResult, now);
        stats.ran++;
        if (stats[evalResult.status] != null) stats[evalResult.status]++;
      });
    } catch (e) {
      // Non-fatal: einzelnen Test protokollieren, weiterlaufen.
      console.error(`[control-test-runner] Test ${test.id} (${test.kind}) Fehler:`, e?.message || e);
      try {
        await asService((c) => c.query(
          `INSERT INTO public.control_test_results (tenant_id, test_id, ran_at, status, detail)
           VALUES ($1, $2, $3, 'error', $4::jsonb)`,
          [test.tenant_id, test.id, now.toISOString(), JSON.stringify({ error: e?.message || String(e) })],
        ));
        stats.error++;
      } catch { /* auch das Fehler-Log darf nicht reißen */ }
    }
  }

  if (stats.due) {
    console.log(`[control-test-runner] fällig: ${stats.due}, ausgeführt: ${stats.ran} `
      + `(pass ${stats.pass} / fail ${stats.fail} / error ${stats.error} / na ${stats.na})`);
  }
  return stats;
}

export default runControlTests;
