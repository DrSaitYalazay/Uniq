// ============================================================================
// cy — kpi-snapshot Job (E9.2 / ENGINE_ARCHITECTURE_MARKETGRADE.md).
// ----------------------------------------------------------------------------
// Klasse C-RUNTIME. Läuft wöchentlich (scheduler.js), tenant-iterierend unter
// service_role (BYPASSRLS via asService). Schreibt je Tenant EINEN
// kpi_snapshots(tenant_id, metrics, has_data, source='auto').
//
// Der Trend hängt damit NICHT mehr davon ab, dass jemand das Dashboard öffnet.
// Es werden NUR serverseitig berechenbare Kennzahlen aufgenommen; UI-only-KPIs
// werden weggelassen (no_data-Doktrin: has_data[kpi]=false, wenn die
// Datengrundlage fehlt — nie ein falsches Grün).
//
// Serverseitig berechnete Metriken:
//   compliance_overall   (ja + 0.5·teilweise) / ANWENDBARE Controls (Katalog-total − na)
//   compliance:<fw>      dito je Framework  (CHG-12: gleicher Nenner wie Frontend;
//                        ohne Knoten-Projektion → Trend-Näherung, s. aggregateTenant)
//   open_deadlines       offene/überfällige compliance_deadlines
//   overdue_deadlines    davon überfällig
//   evidence_freshness   frische / gesamte Evidence (valid_until)
//   evidence_total       Anzahl Evidence
// ============================================================================
import { asService } from '../db.js';

function round4(x) {
  return Math.round(x * 1e4) / 1e4;
}

/** Existiert public.<name> in der Live-DB? (Migrations laufen nicht automatisch.) */
async function tableExists(c, name) {
  const r = await c.query(`SELECT to_regclass($1) IS NOT NULL AS ok`, [`public.${name}`]);
  return !!(r.rows[0] && r.rows[0].ok);
}

/** Aggregiert die serverseitigen Kennzahlen eines Tenants. */
async function aggregateTenant(c, tenantId) {
  const metrics = {};
  const hasData = {};

  // --- Antworten je Framework/Antwort ---
  const ans = await c.query(
    `SELECT framework, antwort, count(*)::int AS n
       FROM public.answers
      WHERE tenant_id = $1
        AND asset_id IS NULL
      GROUP BY framework, antwort`,
    [tenantId],
  );
  // { fw: { ja, teilweise, nein, na } }
  const byFw = {};
  for (const row of ans.rows) {
    const fw = row.framework;
    byFw[fw] = byFw[fw] || { ja: 0, teilweise: 0, nein: 0, na: 0 };
    byFw[fw][row.antwort] = (byFw[fw][row.antwort] || 0) + row.n;
  }
  // CHG-12: Nenner = „anwendbar" (Katalog-total − na), NICHT nur „beantwortet".
  // Damit deckt sich das Maß mit dem Frontend (compliancePct = (ja+0,5·teilw)/
  // (total−na)); unbeantwortete Kontrollen zählen als 0 im Nenner. Aktive
  // Frameworks + Katalog-Zahlen laden.
  // HINWEIS/Residuum: dieser Job rechnet auf ROHEN answers-Zeilen ohne Knoten-
  // Projektion (same-as). Das Dashboard nutzt EFFEKTIVE (projizierte) Zähler, daher
  // kann der Snapshot leicht niedriger liegen — die Sparkline ist ein Trend, nicht
  // die exakte Live-Zahl. Eine exakte Angleichung erforderte die Projektion serverseitig.
  const prof = await c.query(
    `SELECT enabled_frameworks FROM public.company_profiles WHERE user_id = $1`,
    [tenantId],
  );
  const enabled = (prof.rows[0] && prof.rows[0].enabled_frameworks) || [];
  const totals = {};
  if (enabled.length > 0) {
    const tot = await c.query(
      `SELECT framework, count(*)::int AS n FROM public.controls WHERE framework = ANY($1) GROUP BY framework`,
      [enabled],
    );
    for (const r of tot.rows) totals[r.framework] = r.n;
  }

  let totWeighted = 0, totApplicable = 0;
  const scopeFws = enabled.length > 0 ? enabled : Object.keys(byFw);
  for (const fw of scopeFws) {
    const g = byFw[fw] || { ja: 0, teilweise: 0, nein: 0, na: 0 };
    const total = totals[fw] != null ? totals[fw] : (g.ja + g.teilweise + g.nein + g.na);
    const applicable = Math.max(0, total - g.na);
    const weighted = g.ja + 0.5 * g.teilweise;
    if (applicable > 0) {
      metrics[`compliance:${fw}`] = round4(weighted / applicable);
      hasData[`compliance:${fw}`] = true;
    }
    totWeighted += weighted; totApplicable += applicable;
  }
  if (totApplicable > 0) {
    metrics.compliance_overall = round4(totWeighted / totApplicable);
    hasData.compliance_overall = true;
  } else {
    metrics.compliance_overall = 0;
    hasData.compliance_overall = false;
  }

  // --- Fristen ---
  const dl = await c.query(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE status IN ('open','overdue'))::int AS open_cnt,
            count(*) FILTER (WHERE status IN ('open','overdue')
                             AND due_at IS NOT NULL AND due_at < now())::int AS overdue_cnt
       FROM public.compliance_deadlines
      WHERE tenant_id = $1`,
    [tenantId],
  );
  const d = dl.rows[0] || { total: 0, open_cnt: 0, overdue_cnt: 0 };
  const hasDeadlines = d.total > 0;
  metrics.open_deadlines = d.open_cnt;
  hasData.open_deadlines = hasDeadlines;
  metrics.overdue_deadlines = d.overdue_cnt;
  hasData.overdue_deadlines = hasDeadlines;

  // --- Evidence-Frische (nur wenn die Tabelle live existiert) ---
  if (await tableExists(c, 'evidence')) {
    const ev = await c.query(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE valid_until IS NULL OR valid_until >= current_date)::int AS fresh
         FROM public.evidence
        WHERE tenant_id = $1`,
      [tenantId],
    );
    const e = ev.rows[0] || { total: 0, fresh: 0 };
    const hasEvidence = e.total > 0;
    metrics.evidence_total = e.total;
    hasData.evidence_total = hasEvidence;
    metrics.evidence_freshness = hasEvidence ? round4(e.fresh / e.total) : 0;
    hasData.evidence_freshness = hasEvidence;
  } else {
    metrics.evidence_total = 0;
    hasData.evidence_total = false;
    metrics.evidence_freshness = 0;
    hasData.evidence_freshness = false;
  }

  return { metrics, hasData };
}

/**
 * Ein Durchlauf: je Tenant serverseitige Kennzahlen aggregieren + snapshotten.
 * @returns {Promise<{tenants:number, written:number}>}
 */
export async function runKpiSnapshot() {
  // Aktive Tenants aus allen relevanten Tabellen. Nur Tabellen einbeziehen, die
  // live tatsächlich existieren — sonst wirft die Query bereits beim Parsen und
  // es wird KEIN einziger Snapshot geschrieben (Migrations laufen nicht auto).
  const tenants = await asService(async (c) => {
    const candidates = ['answers', 'evidence', 'compliance_deadlines', 'control_tests'];
    const present = [];
    for (const t of candidates) {
      if (await tableExists(c, t)) present.push(t);
    }
    if (present.length === 0) return [];
    const union = present
      .map((t) => `SELECT tenant_id FROM public.${t}`)
      .join(' UNION ');
    const res = await c.query(
      `SELECT DISTINCT tenant_id FROM ( ${union} ) u WHERE tenant_id IS NOT NULL`,
    );
    return res.rows.map((r) => r.tenant_id);
  });

  let written = 0;
  for (const tenantId of tenants) {
    try {
      await asService(async (c) => {
        const { metrics, hasData } = await aggregateTenant(c, tenantId);
        // Leere Tenants (keinerlei Datengrundlage) überspringen.
        if (!Object.values(hasData).some(Boolean)) return;
        await c.query(
          `INSERT INTO public.kpi_snapshots (tenant_id, metrics, has_data, source)
           VALUES ($1, $2::jsonb, $3::jsonb, 'auto')`,
          [tenantId, JSON.stringify(metrics), JSON.stringify(hasData)],
        );
        written++;
      });
    } catch (e) {
      // Non-fatal je Tenant.
      console.error(`[kpi-snapshot] Tenant ${tenantId} Fehler:`, e?.message || e);
    }
  }

  if (tenants.length) {
    console.log(`[kpi-snapshot] Tenants: ${tenants.length}, Snapshots geschrieben: ${written}`);
  }
  return { tenants: tenants.length, written };
}

export default runKpiSnapshot;
