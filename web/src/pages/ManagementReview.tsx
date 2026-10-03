/**
 * ManagementReview — Werkzeug „Management-Review" (Spec-ITEM 17).
 *
 * Führt die ISMS-Leitungsbewertung (ISO 27001 Kap. 9.3 / NIS2 §38 Leitungs-
 * Kenntnisnahme) an einem Ort zusammen:
 *   1. Ist-Stand-Zusammenfassung (Compliance je Framework, Top-Risiken,
 *      Incident-Statistik, offene Fristen) — read-only aus den vorhandenen
 *      Engines/Hooks.
 *   2. Eingabefelder Teilnehmer / Beschlüsse / Chancen / Ressourcen.
 *   3. NIS2-§38-Leitungs-Kenntnisnahme (Freitext + Checkbox) — NUR wenn
 *      isNis2Active().
 *   4. Abschluss:
 *        (a) createEvidence(kind:"attestation")           — Nachweis der Bewertung
 *        (b) createDeadline(kind:"audit_cycle", +1 Jahr)  — nächste Review-Frist
 *        (c) INSERT kpi_snapshots (tenant_id = getTenantId, RLS-konform)
 *        (d) rkExport("pdf"/"word", …)                    — Protokoll-Export
 *   5. Review-Historie im eigenen Tool-Blob „management-review".
 *
 * Berichte-Regel: erst In-App-Vorschau, dann Druck/PDF (rkExport öffnet das
 * Druckfenster — konform).
 *
 * Additiv: keine bestehenden Dateien/Engines verändert.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ClipboardCheck, Users, Gavel, Lightbulb, Wallet, ShieldCheck,
  AlertTriangle, CheckCircle2, FileText, Printer, History, Loader2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToolData } from "@/hooks/useToolData";
import { useComplianceOverview } from "@/hooks/useComplianceOverview";
import { useRiskAnalysis } from "@/hooks/useRiskAnalysis";
import { supabase } from "@/integrations/supabase/client";
import { createEvidence } from "@/lib/evidenceEngine";
import { cancelDeadlinesByRef, createDeadline, addInterval, listOpenDeadlines, type ComplianceDeadline } from "@/lib/deadlineEngine";
import { isNis2Active } from "@/lib/frameworkFlags";
import { rkExport, rkSection, rkTable, rkKpiRow, rkScoreBox, rkGlossary, RK } from "@/lib/reportKit";

// ── Incident-Blob (read-only aus dem gemeinsamen Register) ──────────────────
type IncSeverity = "low" | "medium" | "high" | "critical";
type IncStatus = "open" | "investigating" | "contained" | "closed";
interface IncidentLite {
  id: string; title?: string; severity?: IncSeverity; status?: IncStatus; detectedAt?: string;
}
interface IncidentRegister { incidents: IncidentLite[] }
const INCIDENT_DEFAULT: IncidentRegister = { incidents: [] };

// ── Review-Historie-Blob ────────────────────────────────────────────────────
interface ReviewSnapshot {
  compliance: Array<{ framework: string; pct: number; applicable: number }>;
  topRisks: Array<{ title: string; level: string; score: number }>;
  incidents: { total: number; open: number; critical: number };
  openDeadlines: number;
}
interface ReviewEntry {
  id: string;
  createdAt: string;            // ISO
  teilnehmer: string;
  beschluesse: string;
  chancen: string;
  ressourcen: string;
  nis2Kenntnisnahme: string;
  nis2Bestaetigt: boolean;
  snapshot: ReviewSnapshot;
}
interface ReviewState { reviews: ReviewEntry[] }
const REVIEW_DEFAULT: ReviewState = { reviews: [] };

const OPEN_INCIDENT_STATES: IncStatus[] = ["open", "investigating", "contained"];

// Stabile Referenz für die (wiederkehrende) Management-Review-Frist. Ein
// konstanter ref_id sorgt zusammen mit cancelDeadlinesByRef dafür, dass bei
// jedem Abschluss die offene Vorgänger-Frist storniert und nur EINE offene
// audit_cycle-Frist gehalten wird (RLS isoliert bereits je Tenant).
const MR_DEADLINE_REF_TABLE = "management_review";
const MR_DEADLINE_REF_ID = "isms-93-review-cycle";

function fmtDate(iso: string, de: boolean): string {
  try { return new Date(iso).toLocaleDateString(de ? "de-DE" : "en-GB", { year: "numeric", month: "short", day: "2-digit" }); }
  catch { return iso; }
}

/**
 * HTML-Escaping für ALLE nutzer-/datengetriebenen Werte, die in den Report-
 * HTML-String bzw. in die dangerouslySetInnerHTML-Vorschau fließen. Der
 * management-review-Blob ist org-geteilt — ohne Escaping könnte ein Mitglied
 * über Freitexte (Beschlüsse/Teilnehmer/NIS2/Risiko-Titel) Script injizieren,
 * das andere im App-Origin ausführen. `& < > " '` werden neutralisiert.
 */
function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function ManagementReview() {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { user, getTenantId } = useAuth();
  const nis2 = isNis2Active();

  // ── Ist-Stand aus den vorhandenen Engines ─────────────────────────────────
  const { overview, loading: compLoading } = useComplianceOverview();
  const { result: riskResult, loading: riskLoading } = useRiskAnalysis();
  // Incident-Register nur lesen (gemeinsamer Blob), Historie separat schreiben.
  const { data: incidentData } = useToolData<IncidentRegister>("incident-register", "cws-incident-register", INCIDENT_DEFAULT);
  const { data: reviewData, setData: setReviewData, loading: revLoading } =
    useToolData<ReviewState>("management-review", "cws-management-review", REVIEW_DEFAULT);

  const [openDeadlines, setOpenDeadlines] = useState<ComplianceDeadline[]>([]);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      try {
        const rows = await listOpenDeadlines(supabase);
        if (alive) setOpenDeadlines(rows);
      } catch { if (alive) setOpenDeadlines([]); }
    })();
    return () => { alive = false; };
  }, [user]);

  // ── Ableitungen ───────────────────────────────────────────────────────────
  const complianceRows = useMemo(
    () => overview.map(o => ({
      framework: o.framework,
      pct: o.stats.compliancePct,
      applicable: o.stats.applicable,
      criticalOpen: o.stats.criticalOpen,
    })),
    [overview],
  );

  const topRisks = useMemo(() => {
    const risks = riskResult?.risks ?? [];
    return [...risks]
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 5)
      .map(r => ({
        title: de ? r.gap_title : (r.gap_title_en || r.gap_title),
        level: r.risk_level,
        score: r.risk_score,
      }));
  }, [riskResult, de]);

  const incidentStats = useMemo(() => {
    const list = incidentData?.incidents ?? [];
    const open = list.filter(i => OPEN_INCIDENT_STATES.includes((i.status ?? "open") as IncStatus)).length;
    const critical = list.filter(i => i.severity === "critical").length;
    return { total: list.length, open, critical };
  }, [incidentData]);

  // ── Eingabefelder aktuelle Sitzung ────────────────────────────────────────
  const [teilnehmer, setTeilnehmer] = useState("");
  const [beschluesse, setBeschluesse] = useState("");
  const [chancen, setChancen] = useState("");
  const [ressourcen, setRessourcen] = useState("");
  const [nis2Text, setNis2Text] = useState("");
  const [nis2Ok, setNis2Ok] = useState(false);

  const [busy, setBusy] = useState(false);
  // Atomarer Guard gegen Doppelklick/Retry (synchron, unabhängig vom Re-Render).
  const submittingRef = useRef(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [lastReport, setLastReport] = useState<{ title: string; sub: string; body: string; file: string } | null>(null);

  const buildSnapshot = (): ReviewSnapshot => ({
    compliance: complianceRows.map(c => ({ framework: c.framework, pct: c.pct, applicable: c.applicable })),
    topRisks,
    incidents: incidentStats,
    openDeadlines: openDeadlines.length,
  });

  // ── Report-Body (ReportKit) ───────────────────────────────────────────────
  function buildReportBody(entry: ReviewEntry): string {
    const s = entry.snapshot;
    const T = RK.theme;
    const avgPct = s.compliance.length
      ? Math.round(s.compliance.reduce((a, c) => a + c.pct, 0) / s.compliance.length)
      : 0;

    const kpis = rkKpiRow([
      { label: de ? "Ø Compliance" : "Avg compliance", value: `${avgPct}%`, color: T.head1 },
      { label: de ? "Offene Vorfälle" : "Open incidents", value: s.incidents.open, color: T.accent },
      { label: de ? "Offene Fristen" : "Open deadlines", value: s.openDeadlines, color: T.primary },
      { label: de ? "Top-Risiken" : "Top risks", value: s.topRisks.length, color: T.head2 },
    ]);

    // Höchster Risiko-Score bestimmt die ScoreBox-Farbe. Der Score liegt auf der
    // 5×5-Skala (0–25) — Farbe deshalb über eigene Schwellen, nicht hexScore (0–100).
    const worst = s.topRisks.reduce((m, r) => Math.max(m, r.score), 0);
    const worstColor = worst >= 20 ? "#7F1D1D" : worst >= 12 ? "#9A3412" : worst >= 6 ? "#854D0E" : "#14532D";
    const scoreBox = rkScoreBox(
      worst,
      de ? "ISMS-Leitungsbewertung (höchster Risiko-Score, max 25)" : "ISMS management review (highest risk score, max 25)",
      de ? `Durchgeführt am ${fmtDate(entry.createdAt, de)}` : `Conducted on ${fmtDate(entry.createdAt, de)}`,
      de
        ? `Teilnehmer: ${escapeHtml(entry.teilnehmer || "—")}`
        : `Participants: ${escapeHtml(entry.teilnehmer || "—")}`,
      worstColor,
    );

    const compTable = s.compliance.length
      ? rkSection(de ? "Compliance je Rahmenwerk" : "Compliance per framework") +
        rkTable(
          [de ? "Rahmenwerk" : "Framework", de ? "Compliance" : "Compliance", de ? "Anwendbar" : "Applicable"],
          // Framework-Werte stammen aus der DB → defense-in-depth escapen.
          s.compliance.map(c => [escapeHtml(c.framework), `${c.pct}%`, c.applicable]),
        )
      : "";

    const riskTable = s.topRisks.length
      ? rkSection(de ? "Top-Risiken" : "Top risks") +
        rkTable(
          [de ? "Risiko" : "Risk", de ? "Stufe" : "Level", "Score"],
          // Risiko-Titel/-Stufe sind daten-/nutzergetrieben → escapen.
          s.topRisks.map(r => [escapeHtml(r.title), escapeHtml(r.level), r.score]),
        )
      : "";

    const incTable =
      rkSection(de ? "Vorfall-Statistik" : "Incident statistics") +
      rkTable(
        [de ? "Kennzahl" : "Metric", de ? "Wert" : "Value"],
        [
          [de ? "Vorfälle gesamt" : "Incidents total", s.incidents.total],
          [de ? "Offen / in Bearbeitung" : "Open / in progress", s.incidents.open],
          [de ? "Kritisch" : "Critical", s.incidents.critical],
          [de ? "Offene Fristen" : "Open deadlines", s.openDeadlines],
        ],
      );

    // Freitexte zuerst escapen, DANN Zeilenumbrüche → <br> (die <br> müssen erhalten bleiben).
    const decisions =
      rkSection(de ? "Beschlüsse & Maßnahmen" : "Decisions & actions") +
      `<p>${escapeHtml(entry.beschluesse || (de ? "— keine erfasst —" : "— none recorded —")).replace(/\n/g, "<br>")}</p>` +
      rkSection(de ? "Chancen zur Verbesserung" : "Opportunities for improvement") +
      `<p>${escapeHtml(entry.chancen || "—").replace(/\n/g, "<br>")}</p>` +
      rkSection(de ? "Ressourcenbedarf" : "Resource needs") +
      `<p>${escapeHtml(entry.ressourcen || "—").replace(/\n/g, "<br>")}</p>`;

    const nis2Block = entry.nis2Bestaetigt || entry.nis2Kenntnisnahme
      ? rkSection(de ? "NIS2 §38 — Kenntnisnahme der Leitung" : "NIS2 §38 — management acknowledgement") +
        `<p><b>${entry.nis2Bestaetigt ? (de ? "Bestätigt" : "Acknowledged") : (de ? "Offen" : "Pending")}</b></p>` +
        `<p>${escapeHtml(entry.nis2Kenntnisnahme || "—").replace(/\n/g, "<br>")}</p>`
      : "";

    // Legende/Glossar am Ende — erklärt alle Kürzel/Kennzahlen für das Management.
    return scoreBox + kpis + compTable + riskTable + incTable + decisions + nis2Block + rkGlossary(lang);
  }

  // ── Vorschau erzeugen (In-App, VOR jedem Export) ──────────────────────────
  function previewFor(entry: ReviewEntry) {
    const body = buildReportBody(entry);
    const title = de ? "Management-Review-Protokoll" : "Management review minutes";
    const sub = `${de ? "Stand" : "As of"} ${fmtDate(entry.createdAt, de)}`;
    setLastReport({ title, sub, body, file: `Management_Review_${entry.createdAt.slice(0, 10)}` });
    setPreviewHtml(body);
  }

  function doExport(mode: "pdf" | "word") {
    if (!lastReport) return;
    rkExport(mode, { ...lastReport, lang });
  }

  // ── Abschluss-Aktion ──────────────────────────────────────────────────────
  async function finalize() {
    // Atomarer Doppelklick-/Retry-Guard: synchron über einen Ref, BEVOR ein
    // Re-Render den Button deaktivieren kann. Verhindert parallele Läufe, die
    // sonst Frist-/Nachweis-/KPI-Duplikate erzeugen würden.
    if (submittingRef.current || busy) return;
    submittingRef.current = true;
    setBusy(true);
    setMsg(null);

    let tenantId: string | null = null;
    try {
      tenantId = await getTenantId();
    } catch {
      tenantId = null;
    }
    if (!tenantId) {
      setMsg({ kind: "err", text: de ? "Kein Tenant ermittelbar — bitte anmelden." : "No tenant — please sign in." });
      setBusy(false);
      submittingRef.current = false;
      return;
    }

    const nowIso = new Date().toISOString();
    const snapshot = buildSnapshot();
    const entry: ReviewEntry = {
      id: crypto.randomUUID(),
      createdAt: nowIso,
      teilnehmer, beschluesse, chancen, ressourcen,
      nis2Kenntnisnahme: nis2 ? nis2Text : "",
      nis2Bestaetigt: nis2 ? nis2Ok : false,
      snapshot,
    };

    // Ø Compliance = mit „applicable" gewichtet (nicht naiver Mittelwert der
    // gerundeten Framework-Prozente) — sonst verzerren ungleich große Frameworks
    // (BSI ~1000 vs. NIS2 ~60 Kontrollen) das Ergebnis.
    const avgApp = snapshot.compliance.reduce((a, c) => a + (c.applicable || 0), 0);
    const avgPct = avgApp > 0
      ? Math.round(snapshot.compliance.reduce((a, c) => a + c.pct * (c.applicable || 0), 0) / avgApp)
      : (snapshot.compliance.length ? Math.round(snapshot.compliance.reduce((a, c) => a + c.pct, 0) / snapshot.compliance.length) : 0);

    // Jeder Persistenz-Schritt wird EINZELN abgefangen: ein Teilfehler bricht
    // nicht die ganze Aktion ab und zwingt den Nutzer NICHT zum erneuten
    // Absenden (das würde Duplikate erzeugen). Fehler werden gesammelt gemeldet.
    const errors: string[] = [];

    // (a) Nachweis der Leitungsbewertung.
    try {
      const descLines = [
        `${de ? "Teilnehmer" : "Participants"}: ${teilnehmer || "—"}`,
        `${de ? "Ø Compliance" : "Avg compliance"}: ${avgPct}%`,
        `${de ? "Offene Vorfälle" : "Open incidents"}: ${snapshot.incidents.open}`,
        `${de ? "Offene Fristen" : "Open deadlines"}: ${snapshot.openDeadlines}`,
        `${de ? "Beschlüsse" : "Decisions"}: ${beschluesse || "—"}`,
        nis2 ? `NIS2 §38: ${nis2Ok ? (de ? "Kenntnisnahme bestätigt" : "acknowledged") : (de ? "offen" : "pending")}` : "",
      ].filter(Boolean).join("\n");

      await createEvidence(supabase, tenantId, {
        kind: "attestation",
        title: `${de ? "Management-Review" : "Management review"} ${fmtDate(nowIso, de)}`,
        description: descLines,
      });
    } catch (e: any) {
      errors.push(`${de ? "Nachweis" : "Attestation"}: ${e?.message || String(e)}`);
    }

    // (b) Nächste Review-Frist (Audit-Zyklus, jährlich) — DEDUPLIZIERT:
    // erst offene Vorgänger-Frist über die stabile Referenz stornieren, dann
    // genau EINE neue offene Frist anlegen. Kein Duplikat bei Wiederholung.
    try {
      await cancelDeadlinesByRef(supabase, MR_DEADLINE_REF_TABLE, MR_DEADLINE_REF_ID);
      await createDeadline(supabase, {
        tenant_id: tenantId,
        kind: "audit_cycle",
        ref_table: MR_DEADLINE_REF_TABLE,
        ref_id: MR_DEADLINE_REF_ID,
        label: de ? "Nächstes Management-Review (ISMS 9.3)" : "Next management review (ISMS 9.3)",
        starts_at: nowIso,
        due_at: addInterval(nowIso, "1 year"),
        recurrence: "1 year",
        meta: { review_id: entry.id, conducted_at: nowIso },
      });
    } catch (e: any) {
      errors.push(`${de ? "Folge-Frist" : "Next deadline"}: ${e?.message || String(e)}`);
    }

    // (c) KPI-Snapshot (RLS: tenant_id = COALESCE(org_owner, uid) = getTenantId()).
    try {
      const metrics: Record<string, number> = {
        mr_avg_compliance: avgPct,
        mr_incidents_total: snapshot.incidents.total,
        mr_incidents_open: snapshot.incidents.open,
        mr_incidents_critical: snapshot.incidents.critical,
        mr_open_deadlines: snapshot.openDeadlines,
        mr_top_risk_score: snapshot.topRisks[0]?.score ?? 0,
      };
      const has_data: Record<string, boolean> = {
        mr_avg_compliance: snapshot.compliance.length > 0,
        mr_incidents_total: true,
        mr_incidents_open: true,
        mr_incidents_critical: true,
        mr_open_deadlines: true,
        mr_top_risk_score: snapshot.topRisks.length > 0,
      };
      for (const c of snapshot.compliance) {
        metrics[`mr_compliance_${c.framework}`] = c.pct;
        has_data[`mr_compliance_${c.framework}`] = c.applicable > 0;
      }
      const { error: kpiErr } = await supabase
        .from("kpi_snapshots")
        .insert({ tenant_id: tenantId, metrics, has_data, source: "manual" });
      if (kpiErr) throw new Error(kpiErr.message || "kpi_snapshots insert failed");
    } catch (e: any) {
      errors.push(`KPI-Snapshot: ${e?.message || String(e)}`);
    }

    // Historie fortschreiben (eigener Blob) + Protokoll-Vorschau bereitstellen.
    setReviewData(d => ({ reviews: [entry, ...(d.reviews ?? [])] }));
    previewFor(entry);

    if (errors.length === 0) {
      // Nur bei vollem Erfolg Eingaben leeren (verhindert versehentliches Re-Submit).
      setTeilnehmer(""); setBeschluesse(""); setChancen(""); setRessourcen("");
      setNis2Text(""); setNis2Ok(false);
      setMsg({ kind: "ok", text: de
        ? "Review abgeschlossen: Nachweis + Folge-Frist + KPI-Snapshot gespeichert. Vorschau unten — dann drucken/exportieren."
        : "Review finalized: attestation + next deadline + KPI snapshot saved. Preview below — then print/export." });
    } else {
      setMsg({ kind: "err", text: (de
        ? "Teilweise gespeichert (Vorschau unten). Diese Schritte schlugen fehl — KEIN erneutes Absenden nötig: "
        : "Partially saved (preview below). These steps failed — no need to resubmit: ") + errors.join(" · ") });
    }

    setBusy(false);
    submittingRef.current = false;
  }

  const loading = compLoading || riskLoading || revLoading;
  const reviews = reviewData?.reviews ?? [];

  const inputCls = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="text-primary" size={22} />
          {de ? "Management-Review" : "Management Review"}
        </h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          {de
            ? "Leitungsbewertung des ISMS (ISO 27001 Kap. 9.3). Ist-Stand aus Compliance, Risiken, Vorfällen und Fristen — Beschlüsse werden als Nachweis dokumentiert, die nächste Bewertung als jährliche Frist geplant und ein KPI-Snapshot festgehalten."
            : "ISMS management review (ISO 27001 §9.3). Current state from compliance, risks, incidents and deadlines — decisions are documented as evidence, the next review scheduled as an annual deadline and a KPI snapshot captured."}
        </p>
      </header>

      {/* ── Ist-Stand-Zusammenfassung ─────────────────────────────────────── */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* Compliance je Framework */}
        <div className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border font-semibold flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" />
            {de ? "Compliance je Rahmenwerk" : "Compliance per framework"}
          </div>
          <div className="p-4">
            {loading && complianceRows.length === 0 ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 size={14} className="animate-spin" />{de ? "Lädt…" : "Loading…"}</div>
            ) : complianceRows.length === 0 ? (
              <div className="text-sm text-muted-foreground">{de ? "Keine aktiven Rahmenwerke." : "No active frameworks."}</div>
            ) : (
              <ul className="space-y-2">
                {complianceRows.map(c => (
                  <li key={c.framework} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-28 shrink-0">{c.framework}</span>
                    <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, c.pct))}%` }} />
                    </div>
                    <span className="text-sm font-semibold w-12 text-right">{c.pct}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Top-Risiken */}
        <div className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border font-semibold flex items-center gap-2">
            <AlertTriangle size={16} className="st-teilweise-text" />
            {de ? "Top-Risiken" : "Top risks"}
          </div>
          <div className="p-4">
            {riskLoading && topRisks.length === 0 ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 size={14} className="animate-spin" />{de ? "Lädt…" : "Loading…"}</div>
            ) : topRisks.length === 0 ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle2 size={15} className="st-ja-text" />{de ? "Keine bewerteten Risiken." : "No assessed risks."}</div>
            ) : (
              <ol className="space-y-1.5 text-sm">
                {topRisks.map((r, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded st-teilweise-tint st-teilweise-text">{r.score}</span>
                    <span className="flex-1 truncate" title={r.title}>{r.title}</span>
                    <span className="text-xs text-muted-foreground">{r.level}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Vorfall-Statistik */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="font-semibold flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-destructive" />{de ? "Vorfall-Statistik" : "Incident statistics"}</div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><div className="text-2xl font-bold">{incidentStats.total}</div><div className="text-xs text-muted-foreground">{de ? "gesamt" : "total"}</div></div>
            <div><div className="text-2xl font-bold st-teilweise-text">{incidentStats.open}</div><div className="text-xs text-muted-foreground">{de ? "offen" : "open"}</div></div>
            <div><div className="text-2xl font-bold text-destructive">{incidentStats.critical}</div><div className="text-xs text-muted-foreground">{de ? "kritisch" : "critical"}</div></div>
          </div>
        </div>

        {/* Offene Fristen */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="font-semibold flex items-center gap-2 mb-3"><FileText size={16} className="text-primary" />{de ? "Offene Fristen" : "Open deadlines"}</div>
          {openDeadlines.length === 0 ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle2 size={15} className="st-ja-text" />{de ? "Keine offenen Fristen." : "No open deadlines."}</div>
          ) : (
            <ul className="text-sm space-y-1 max-h-40 overflow-auto">
              {openDeadlines.slice(0, 8).map(d => (
                <li key={d.id} className="flex items-center justify-between gap-2">
                  <span className="truncate" title={d.label}>{d.label}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{d.due_at ? fmtDate(d.due_at, de) : "—"}</span>
                </li>
              ))}
              {openDeadlines.length > 8 && <li className="text-xs text-muted-foreground">+{openDeadlines.length - 8} {de ? "weitere" : "more"}</li>}
            </ul>
          )}
        </div>
      </section>

      {/* ── Sitzungs-Eingaben ─────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h2 className="font-semibold">{de ? "Bewertung dieser Sitzung" : "This session's review"}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 block">
            <span className="text-sm font-medium flex items-center gap-1.5"><Users size={14} />{de ? "Teilnehmer" : "Participants"}</span>
            <input className={inputCls} value={teilnehmer} onChange={e => setTeilnehmer(e.target.value)} placeholder={de ? "Namen / Rollen, kommagetrennt" : "Names / roles, comma-separated"} />
          </label>
          <label className="space-y-1 block">
            <span className="text-sm font-medium flex items-center gap-1.5"><Wallet size={14} />{de ? "Ressourcenbedarf" : "Resource needs"}</span>
            <textarea className={inputCls} rows={2} value={ressourcen} onChange={e => setRessourcen(e.target.value)} placeholder={de ? "Budget, Personal, Tools…" : "Budget, staff, tools…"} />
          </label>
          <label className="space-y-1 block">
            <span className="text-sm font-medium flex items-center gap-1.5"><Gavel size={14} />{de ? "Beschlüsse & Maßnahmen" : "Decisions & actions"}</span>
            <textarea className={inputCls} rows={3} value={beschluesse} onChange={e => setBeschluesse(e.target.value)} placeholder={de ? "Getroffene Entscheidungen, Verantwortliche, Termine…" : "Decisions, owners, due dates…"} />
          </label>
          <label className="space-y-1 block">
            <span className="text-sm font-medium flex items-center gap-1.5"><Lightbulb size={14} />{de ? "Chancen zur Verbesserung" : "Opportunities for improvement"}</span>
            <textarea className={inputCls} rows={3} value={chancen} onChange={e => setChancen(e.target.value)} placeholder={de ? "Verbesserungspotenziale, Trends…" : "Improvement potential, trends…"} />
          </label>
        </div>

        {/* NIS2 §38 — nur wenn aktiv */}
        {nis2 && (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-2">
            <div className="text-sm font-semibold flex items-center gap-1.5"><ShieldCheck size={14} className="text-primary" />{de ? "NIS2 §38 — Kenntnisnahme der Leitung" : "NIS2 §38 — management acknowledgement"}</div>
            <textarea className={inputCls} rows={2} value={nis2Text} onChange={e => setNis2Text(e.target.value)} placeholder={de ? "Vermerk der Geschäftsleitung zur Kenntnisnahme der Risikomanagementmaßnahmen…" : "Management note acknowledging the risk-management measures…"} />
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={nis2Ok} onChange={e => setNis2Ok(e.target.checked)} />
              {de ? "Die Leitung hat die Risikomanagementmaßnahmen zur Kenntnis genommen (NIS2 §38)." : "Management has acknowledged the risk-management measures (NIS2 §38)."}
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={finalize}
            disabled={busy || !user}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <ClipboardCheck size={15} />}
            {de ? "Review abschließen" : "Finalize review"}
          </button>
          {!user && <span className="text-xs text-muted-foreground">{de ? "Anmelden, um abzuschließen." : "Sign in to finalize."}</span>}
        </div>

        {msg && (
          <div className={`text-sm rounded-md px-3 py-2 ${msg.kind === "ok" ? "st-ja-tint st-ja-text" : "bg-destructive/10 text-destructive"}`}>
            {msg.text}
          </div>
        )}
      </section>

      {/* ── In-App-Vorschau + Export ──────────────────────────────────────── */}
      {previewHtml && lastReport && (
        <section className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold flex items-center gap-2"><FileText size={16} className="text-primary" />{de ? "Protokoll-Vorschau" : "Minutes preview"}</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => doExport("pdf")} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5"><Printer size={14} />{de ? "Drucken / PDF" : "Print / PDF"}</button>
              <button onClick={() => doExport("word")} className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5"><FileText size={14} />Word</button>
            </div>
          </div>
          <div className="p-4 overflow-auto max-h-[540px] bg-white text-black rounded-b-xl" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </section>
      )}

      {/* ── Historie ──────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border font-semibold flex items-center gap-2"><History size={16} className="text-primary" />{de ? "Review-Historie" : "Review history"} ({reviews.length})</div>
        {reviews.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">{de ? "Noch keine Reviews erfasst." : "No reviews recorded yet."}</div>
        ) : (
          <ul className="divide-y divide-border">
            {reviews.map(r => (
              <li key={r.id} className="p-4 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{fmtDate(r.createdAt, de)}</span>
                  <div className="flex items-center gap-2">
                    {r.nis2Bestaetigt && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-semibold">NIS2 §38 ✓</span>}
                    <button onClick={() => previewFor(r)} className="text-xs rounded border border-border px-2 py-1 flex items-center gap-1"><FileText size={12} />{de ? "Vorschau" : "Preview"}</button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {de ? "Teilnehmer" : "Participants"}: {r.teilnehmer || "—"} · {de ? "Ø Compliance" : "Avg compliance"}:{" "}
                  {(() => { const ta = r.snapshot.compliance.reduce((a, c) => a + (c.applicable || 0), 0); return ta > 0 ? Math.round(r.snapshot.compliance.reduce((a, c) => a + c.pct * (c.applicable || 0), 0) / ta) : (r.snapshot.compliance.length ? Math.round(r.snapshot.compliance.reduce((a, c) => a + c.pct, 0) / r.snapshot.compliance.length) : 0); })()}% ·{" "}
                  {de ? "offene Vorfälle" : "open incidents"}: {r.snapshot.incidents.open} · {de ? "offene Fristen" : "open deadlines"}: {r.snapshot.openDeadlines}
                </div>
                {r.beschluesse && <div className="text-xs"><span className="font-medium">{de ? "Beschlüsse" : "Decisions"}:</span> {r.beschluesse}</div>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
