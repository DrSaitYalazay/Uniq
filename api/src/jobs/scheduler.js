// ============================================================================
// cy — Job-Scheduler (Spec-ITEM 05 / ARCHITECTURE.md §6).
// ----------------------------------------------------------------------------
// Startet serverseitige Hintergrundjobs. Aktuell: deadline-reminder stündlich.
// Nutzt node-cron, falls installiert; sonst setInterval-Fallback (kein neuer
// Dependency-Zwang). Alle Jobs laufen unter service_role (siehe deadlineReminder).
// ============================================================================
import { runDeadlineReminders } from './deadlineReminder.js';
import { runControlTests } from './control-test-runner.js';
import { runKpiSnapshot } from './kpi-snapshot.js';
import { runBenchmarkAggregate } from './benchmark-aggregate.js';

const HOUR_MS = 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * HOUR_MS;

async function safeRun(name, fn) {
  try {
    await fn();
  } catch (e) {
    console.error(`[scheduler] Job "${name}" Fehler:`, e?.message || e);
  }
}

/**
 * Startet den Scheduler. Non-fatal: Fehler beim Start dürfen die API nicht
 * herunterreißen (Aufruf in index.js ist zusätzlich try/catch-gekapselt).
 */
export async function startScheduler() {
  let cron = null;
  try {
    // Optionales node-cron — nur nutzen, wenn vorhanden.
    ({ default: cron } = await import('node-cron'));
  } catch {
    cron = null;
  }

  const reminderJob = () => safeRun('deadline-reminder', runDeadlineReminders);
  // C-RUNTIME-Engine-Jobs (marktreife Engines): stündlich Test-Runner,
  // wöchentlich KPI-Snapshot + Benchmark-Aggregation. Alle non-fatal (safeRun),
  // laufen unter service_role (asService/BYPASSRLS in den Job-Modulen).
  const controlTestJob = () => safeRun('control-test-runner', runControlTests);
  const kpiSnapshotJob = () => safeRun('kpi-snapshot', runKpiSnapshot);
  const benchmarkJob = () => safeRun('benchmark-aggregate', runBenchmarkAggregate);

  if (cron && typeof cron.schedule === 'function') {
    // Stündlich zur Minute 0.
    cron.schedule('0 * * * *', reminderJob);
    // Test-Runner stündlich zur Minute 15 (versetzt zum Reminder).
    cron.schedule('15 * * * *', controlTestJob);
    // Wöchentlich (Montag): KPI-Snapshot 03:00, Benchmark 04:00 (nach Snapshots).
    cron.schedule('0 3 * * 1', kpiSnapshotJob);
    cron.schedule('0 4 * * 1', benchmarkJob);
    console.log('[scheduler] node-cron aktiv — deadline-reminder + control-test-runner stündlich, '
      + 'kpi-snapshot + benchmark-aggregate wöchentlich');
  } else {
    // Fallback ohne Dependency: setInterval.
    setInterval(reminderJob, HOUR_MS);
    setInterval(controlTestJob, HOUR_MS);
    setInterval(kpiSnapshotJob, WEEK_MS);
    setInterval(benchmarkJob, WEEK_MS);
    console.log('[scheduler] setInterval-Fallback aktiv — deadline-reminder + control-test-runner '
      + 'stündlich, kpi-snapshot + benchmark-aggregate wöchentlich');
  }

  // Einmalige Läufe kurz nach Start (verzögert, damit DB/Pool bereit ist).
  setTimeout(reminderJob, 30_000);
  setTimeout(controlTestJob, 45_000);
  setTimeout(kpiSnapshotJob, 60_000);
  // Benchmark nach dem ersten Snapshot-Lauf, damit jüngste Snapshots vorliegen.
  setTimeout(benchmarkJob, 90_000);
}

export default startScheduler;
