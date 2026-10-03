/**
 * ControlMonitoring — Werkzeug „Control-Monitoring" (Engine E3 / CCM).
 *
 * Aktiviert die kontinuierliche Control-Überwachung, indem es die (bislang
 * leeren) Tabellen `control_tests` je Tenant BEWIRTSCHAFTET. Der Server-Job
 * `api/src/jobs/control-test-runner.js` führt fällige, aktivierte Tests
 * stündlich aus und schreibt `control_test_results`; `useControlHealth` +
 * Posture/Dashboard leben davon. Ohne Tests bleibt alles ruhig — diese Seite
 * gibt der Engine überhaupt erst etwas zu tun.
 *
 * Funktionen:
 *   1. Liste bestehender control_tests (Label, Art, Ziel-Kontrolle/Framework
 *      bzw. Knoten, enabled-Toggle, interval_hours, jüngstes Ergebnis) +
 *      Löschen + aufklappbare Ergebnis-Historie (letzte N control_test_results).
 *   2. Neuen Test anlegen (kind-Auswahl + Ziel + Label + Intervall + kind-
 *      spezifische config) — Insert mit tenant_id = getTenantId().
 *   3. „Standard-Tests anlegen": erzeugt für die aktiven Frameworks je MUSS-
 *      Kontrolle, die bereits beantwortet ist (Obergrenze), je einen
 *      evidence_present- + answer_review_age-Test — IDEMPOTENT (überspringt
 *      bereits vorhandene (framework, control_id, kind)-Kombinationen).
 *
 * Robust: leere Tabellen ⇒ sauberer Leerzustand; alle Abfragen RLS-scoped
 * (Policies control_tests_*), jeder DB-Fehler wird abgefangen & gemeldet.
 * Additiv: keine bestehenden Dateien/Engines verändert.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, Radar, Plus, Trash2, Loader2, RefreshCw, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, AlertTriangle, MinusCircle, Wand2, Power,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useComplianceOverview } from "@/hooks/useComplianceOverview";
import { supabase } from "@/integrations/supabase/client";
import type { ControlTest, ControlTestResult } from "@/lib/controlHealthEngine";

// ── Konstanten ──────────────────────────────────────────────────────────────
type TestKind = "deadline_adherence" | "evidence_present" | "answer_review_age" | "webhook_pull";

const KINDS: TestKind[] = ["deadline_adherence", "evidence_present", "answer_review_age", "webhook_pull"];

const KIND_LABEL: Record<TestKind, { de: string; en: string }> = {
  deadline_adherence: { de: "Fristen-Einhaltung", en: "Deadline adherence" },
  evidence_present:   { de: "Nachweis vorhanden", en: "Evidence present" },
  answer_review_age:  { de: "Antwort-Aktualität", en: "Answer review age" },
  webhook_pull:       { de: "Webhook-Abfrage",   en: "Webhook pull" },
};

const KIND_HINT: Record<TestKind, { de: string; en: string }> = {
  deadline_adherence: { de: "fail bei überfälligen Fristen der Ziel-Kontrolle.", en: "fail on overdue deadlines for the target control." },
  evidence_present:   { de: "pass, wenn ≥1 nicht-abgelaufener Nachweis an der Kontrolle hängt.", en: "pass when ≥1 non-expired evidence is attached to the control." },
  answer_review_age:  { de: "fail, wenn die Antwort älter als max_age_days ist.", en: "fail when the answer is older than max_age_days." },
  webhook_pull:       { de: "HTTP-GET + JSONPath-Vergleich (url / jsonpath / expect).", en: "HTTP GET + JSONPath compare (url / jsonpath / expect)." },
};

/** Ergebnis-Historie: wie viele Läufe je Test geladen/angezeigt werden. */
const HISTORY_LIMIT = 8;
/** Obergrenze der Kontrollen, die „Standard-Tests anlegen" bearbeitet. */
const MAX_STANDARD_CONTROLS = 25;
/** kinds, die die Standard-Aktion je Kontrolle anlegt. */
const STANDARD_KINDS: TestKind[] = ["evidence_present", "answer_review_age"];

type Msg = { kind: "ok" | "err"; text: string } | null;

function fmtDate(iso: string | null | undefined, de: boolean): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(de ? "de-DE" : "en-GB", {
      year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  } catch { return String(iso); }
}

function StatusBadge({ status, de }: { status: ControlTestResult["status"] | "none"; de: boolean }) {
  const map: Record<string, { cls: string; icon: JSX.Element; de: string; en: string }> = {
    pass:  { cls: "st-ja-tint st-ja-text", icon: <CheckCircle2 size={12} />, de: "bestanden", en: "pass" },
    fail:  { cls: "bg-destructive/15 text-destructive", icon: <XCircle size={12} />,      de: "durchgefallen", en: "fail" },
    error: { cls: "st-teilweise-tint st-teilweise-text",     icon: <AlertTriangle size={12} />, de: "Fehler", en: "error" },
    na:    { cls: "bg-muted text-muted-foreground",      icon: <MinusCircle size={12} />,   de: "n/a", en: "n/a" },
    none:  { cls: "bg-muted text-muted-foreground",      icon: <MinusCircle size={12} />,   de: "noch kein Lauf", en: "no run yet" },
  };
  const m = map[status] ?? map.none;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${m.cls}`}>
      {m.icon}{de ? m.de : m.en}
    </span>
  );
}

export default function ControlMonitoring() {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { user, getTenantId } = useAuth();

  // Überblick liefert aktive Frameworks + Kontroll-Katalog + effektive Antworten
  // (für „Standard-Tests" und die Ziel-Auswahl im Formular).
  const { overview, enabledFrameworks, loading: ovLoading } = useComplianceOverview();

  const [tests, setTests] = useState<ControlTest[]>([]);
  const [resultsByTest, setResultsByTest] = useState<Map<string, ControlTestResult[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [busyToggle, setBusyToggle] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [standardBusy, setStandardBusy] = useState(false);

  // ── Laden (RLS-scoped: SELECT * liefert nur Tenant-Zeilen) ─────────────────
  const loadAll = useCallback(async () => {
    if (!user) { setTests([]); setResultsByTest(new Map()); setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    try {
      const { data: testRows, error: te } = await supabase
        .from("control_tests")
        .select("*")
        .order("created_at", { ascending: false });
      if (te) throw te;
      const t = (testRows ?? []) as ControlTest[];
      setTests(t);

      const byTest = new Map<string, ControlTestResult[]>();
      if (t.length > 0) {
        const ids = t.map((x) => x.id);
        const { data: resRows, error: re } = await supabase
          .from("control_test_results")
          .select("*")
          .in("test_id", ids)
          .order("ran_at", { ascending: false });
        if (re) throw re;
        for (const r of (resRows ?? []) as ControlTestResult[]) {
          const arr = byTest.get(r.test_id) ?? [];
          if (arr.length < HISTORY_LIMIT) arr.push(r);
          byTest.set(r.test_id, arr);
        }
      }
      setResultsByTest(byTest);
    } catch (e: any) {
      setTests([]);
      setResultsByTest(new Map());
      setLoadError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Formular-State (neuer Test) ────────────────────────────────────────────
  const [fKind, setFKind] = useState<TestKind>("evidence_present");
  const [fTargetMode, setFTargetMode] = useState<"control" | "node">("control");
  const [fFramework, setFFramework] = useState<string>("");
  const [fControlId, setFControlId] = useState<string>("");
  const [fNodeId, setFNodeId] = useState<string>("");
  const [fLabel, setFLabel] = useState<string>("");
  const [fInterval, setFInterval] = useState<number>(24);
  // config-Felder
  const [fMaxAge, setFMaxAge] = useState<number>(365);
  const [fUrl, setFUrl] = useState<string>("");
  const [fJsonpath, setFJsonpath] = useState<string>("");
  const [fExpect, setFExpect] = useState<string>("");

  // Kontroll-Optionen des gewählten Frameworks (aus dem Überblick).
  const controlOptions = useMemo(() => {
    const o = overview.find((x) => x.framework === fFramework);
    if (!o) return [] as { id: string; title: string }[];
    return o.controls.map((c) => ({ id: c.id, title: (de ? c.req_de : c.req_en) || c.id }));
  }, [overview, fFramework, de]);

  // Default-Framework setzen, sobald der Überblick da ist.
  useEffect(() => {
    if (!fFramework && overview.length > 0) setFFramework(overview[0].framework);
  }, [overview, fFramework]);

  const webhookNeedsTarget = fKind === "webhook_pull" ? false : true;

  const resetForm = () => {
    setFControlId(""); setFNodeId(""); setFLabel("");
    setFMaxAge(365); setFUrl(""); setFJsonpath(""); setFExpect("");
  };

  const buildConfig = (): Record<string, unknown> => {
    if (fKind === "answer_review_age") return { max_age_days: fMaxAge > 0 ? fMaxAge : 365 };
    if (fKind === "webhook_pull") {
      const cfg: Record<string, unknown> = { url: fUrl.trim() };
      if (fJsonpath.trim()) cfg.jsonpath = fJsonpath.trim();
      if (fExpect.trim() !== "") cfg.expect = fExpect.trim();
      return cfg;
    }
    return {};
  };

  const createValid = useMemo(() => {
    if (fKind === "webhook_pull") return fUrl.trim().length > 0;
    if (fTargetMode === "control") return !!fFramework && !!fControlId;
    return !!fNodeId.trim();
  }, [fKind, fUrl, fTargetMode, fFramework, fControlId, fNodeId]);

  // ── Neuen Test anlegen ─────────────────────────────────────────────────────
  async function createTest() {
    if (creating || !createValid) return;
    setCreating(true);
    setMsg(null);
    try {
      const tenantId = await getTenantId();
      if (!tenantId) throw new Error(de ? "Kein Tenant ermittelbar." : "No tenant.");

      const useControl = fTargetMode === "control" && fKind !== "webhook_pull";
      const framework = useControl ? fFramework : null;
      const control_id = useControl ? fControlId : null;
      const node_id = (!useControl && fTargetMode === "node" && fKind !== "webhook_pull") ? fNodeId.trim() : null;

      const label = fLabel.trim() || defaultLabel(fKind, framework, control_id, node_id, de);

      const { error } = await supabase.from("control_tests").insert({
        tenant_id: tenantId,
        framework,
        control_id,
        node_id: node_id || null,
        kind: fKind,
        label,
        schedule: null,
        config: buildConfig(),
        enabled: true,
        interval_hours: fInterval > 0 ? Math.round(fInterval) : 24,
      });
      if (error) throw error;

      setMsg({ kind: "ok", text: de ? "Test angelegt." : "Test created." });
      resetForm();
      await loadAll();
    } catch (e: any) {
      setMsg({ kind: "err", text: (de ? "Anlegen fehlgeschlagen: " : "Create failed: ") + (e?.message || String(e)) });
    } finally {
      setCreating(false);
    }
  }

  // ── enabled togglen ─────────────────────────────────────────────────────────
  async function toggleEnabled(t: ControlTest) {
    if (busyToggle.has(t.id)) return;
    setBusyToggle((s) => new Set(s).add(t.id));
    setMsg(null);
    try {
      const { error } = await supabase
        .from("control_tests")
        .update({ enabled: !t.enabled })
        .eq("id", t.id);
      if (error) throw error;
      setTests((prev) => prev.map((x) => (x.id === t.id ? { ...x, enabled: !x.enabled } : x)));
    } catch (e: any) {
      setMsg({ kind: "err", text: (de ? "Umschalten fehlgeschlagen: " : "Toggle failed: ") + (e?.message || String(e)) });
    } finally {
      setBusyToggle((s) => { const n = new Set(s); n.delete(t.id); return n; });
    }
  }

  // ── Test löschen ─────────────────────────────────────────────────────────────
  async function deleteTest(t: ControlTest) {
    if (busyToggle.has(t.id)) return;
    if (typeof window !== "undefined" && !window.confirm(de ? `Test „${t.label}" löschen?` : `Delete test "${t.label}"?`)) return;
    setBusyToggle((s) => new Set(s).add(t.id));
    setMsg(null);
    try {
      const { error } = await supabase.from("control_tests").delete().eq("id", t.id);
      if (error) throw error;
      setTests((prev) => prev.filter((x) => x.id !== t.id));
      setResultsByTest((prev) => { const n = new Map(prev); n.delete(t.id); return n; });
    } catch (e: any) {
      setMsg({ kind: "err", text: (de ? "Löschen fehlgeschlagen: " : "Delete failed: ") + (e?.message || String(e)) });
    } finally {
      setBusyToggle((s) => { const n = new Set(s); n.delete(t.id); return n; });
    }
  }

  // ── Standard-Tests anlegen (idempotent, gedeckelt) ──────────────────────────
  async function createStandardTests() {
    if (standardBusy) return;
    setStandardBusy(true);
    setMsg(null);
    try {
      const tenantId = await getTenantId();
      if (!tenantId) throw new Error(de ? "Kein Tenant ermittelbar." : "No tenant.");

      // Vorhandene (framework::control_id::kind)-Kombinationen — Idempotenz-Basis.
      const existing = new Set(
        tests
          .filter((t) => t.framework && t.control_id)
          .map((t) => `${t.framework}::${t.control_id}::${t.kind}`),
      );

      // Ziel-Kontrollen: MUSS + bereits beantwortet, über alle aktiven
      // Frameworks, hart auf MAX_STANDARD_CONTROLS gedeckelt.
      const targets: { framework: string; control_id: string; title: string }[] = [];
      outer: for (const o of overview) {
        for (const c of o.controls) {
          if (c.muss !== "true") continue;                       // nur MUSS-Kontrollen
          const eff = o.effective.get(c.id);
          if (!eff || eff.status == null || eff.status === "na") continue; // nur beantwortete
          targets.push({ framework: o.framework, control_id: c.id, title: (de ? c.req_de : c.req_en) || c.id });
          if (targets.length >= MAX_STANDARD_CONTROLS) break outer;
        }
      }

      if (targets.length === 0) {
        setMsg({ kind: "ok", text: de
          ? "Keine passenden Kontrollen (MUSS + beantwortet) gefunden — nichts angelegt."
          : "No matching controls (mandatory + answered) — nothing created." });
        return;
      }

      const rows: Record<string, unknown>[] = [];
      let skipped = 0;
      for (const t of targets) {
        for (const kind of STANDARD_KINDS) {
          const key = `${t.framework}::${t.control_id}::${kind}`;
          if (existing.has(key)) { skipped++; continue; }
          existing.add(key); // Doppelanlage innerhalb desselben Laufs verhindern
          rows.push({
            tenant_id: tenantId,
            framework: t.framework,
            control_id: t.control_id,
            node_id: null,
            kind,
            label: defaultLabel(kind, t.framework, t.control_id, null, de),
            schedule: null,
            config: kind === "answer_review_age" ? { max_age_days: 365 } : {},
            enabled: true,
            interval_hours: 24,
          });
        }
      }

      if (rows.length === 0) {
        setMsg({ kind: "ok", text: de
          ? `Alle Standard-Tests für ${targets.length} Kontrolle(n) existieren bereits (${skipped} übersprungen).`
          : `All standard tests for ${targets.length} control(s) already exist (${skipped} skipped).` });
        return;
      }

      const { error } = await supabase.from("control_tests").insert(rows);
      if (error) throw error;

      setMsg({ kind: "ok", text: de
        ? `${rows.length} Standard-Test(s) für ${targets.length} Kontrolle(n) angelegt, ${skipped} bereits vorhanden übersprungen.`
        : `Created ${rows.length} standard test(s) for ${targets.length} control(s); skipped ${skipped} existing.` });
      await loadAll();
    } catch (e: any) {
      setMsg({ kind: "err", text: (de ? "Standard-Tests fehlgeschlagen: " : "Standard tests failed: ") + (e?.message || String(e)) });
    } finally {
      setStandardBusy(false);
    }
  }

  const toggleExpand = (id: string) =>
    setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const inputCls = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";
  const busy = loading || ovLoading;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Radar className="text-primary" size={22} />
          {de ? "Control-Monitoring" : "Control Monitoring"}
        </h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          {de
            ? "Kontinuierliche Kontroll-Überwachung (CCM). Lege automatisierte Tests je Kontrolle an — der Server führt fällige, aktivierte Tests regelmäßig aus und speist Ergebnisse in Health-Score, Posture und Dashboard ein."
            : "Continuous control monitoring (CCM). Define automated tests per control — the server runs due, enabled tests periodically and feeds results into health score, posture and dashboard."}
        </p>
      </header>

      {/* ── Aktionsleiste ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={createStandardTests}
          disabled={standardBusy || busy || !user}
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          {standardBusy ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
          {de ? "Standard-Tests anlegen" : "Create standard tests"}
        </button>
        <button
          onClick={loadAll}
          disabled={busy}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
          {de ? "Aktualisieren" : "Refresh"}
        </button>
        <span className="text-xs text-muted-foreground">
          {de
            ? `Standard = evidence_present + answer_review_age je MUSS-Kontrolle (beantwortet), max. ${MAX_STANDARD_CONTROLS} Kontrollen, idempotent.`
            : `Standard = evidence_present + answer_review_age per mandatory answered control, max. ${MAX_STANDARD_CONTROLS} controls, idempotent.`}
        </span>
      </div>

      {msg && (
        <div className={`text-sm rounded-md px-3 py-2 ${msg.kind === "ok" ? "st-ja-tint st-ja-text" : "bg-destructive/10 text-destructive"}`}>
          {msg.text}
        </div>
      )}

      {/* ── Neuen Test anlegen ────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Plus size={16} className="text-primary" />{de ? "Neuen Test anlegen" : "New test"}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Art */}
          <label className="space-y-1 block">
            <span className="text-sm font-medium">{de ? "Art" : "Kind"}</span>
            <select className={inputCls} value={fKind} onChange={(e) => setFKind(e.target.value as TestKind)}>
              {KINDS.map((k) => (
                <option key={k} value={k}>{de ? KIND_LABEL[k].de : KIND_LABEL[k].en} — {k}</option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground block">{de ? KIND_HINT[fKind].de : KIND_HINT[fKind].en}</span>
          </label>

          {/* Intervall */}
          <label className="space-y-1 block">
            <span className="text-sm font-medium">{de ? "Intervall (Stunden)" : "Interval (hours)"}</span>
            <input type="number" min={1} className={inputCls} value={fInterval}
              onChange={(e) => setFInterval(Number(e.target.value))} />
          </label>

          {/* Ziel — nur für DB-Tests (nicht webhook_pull) */}
          {webhookNeedsTarget && (
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">{de ? "Ziel" : "Target"}:</span>
                <label className="flex items-center gap-1.5">
                  <input type="radio" checked={fTargetMode === "control"} onChange={() => setFTargetMode("control")} />
                  {de ? "Kontrolle (Framework + ID)" : "Control (framework + id)"}
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="radio" checked={fTargetMode === "node"} onChange={() => setFTargetMode("node")} />
                  {de ? "Knoten (node_id)" : "Node (node_id)"}
                </label>
              </div>

              {fTargetMode === "control" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 block">
                    <span className="text-sm font-medium">{de ? "Framework" : "Framework"}</span>
                    <select className={inputCls} value={fFramework} onChange={(e) => { setFFramework(e.target.value); setFControlId(""); }}>
                      {overview.length === 0 && <option value="">{de ? "— keine —" : "— none —"}</option>}
                      {overview.map((o) => <option key={o.framework} value={o.framework}>{o.framework}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-sm font-medium">{de ? "Kontrolle" : "Control"}</span>
                    <select className={inputCls} value={fControlId} onChange={(e) => setFControlId(e.target.value)}>
                      <option value="">{de ? "— wählen —" : "— select —"}</option>
                      {controlOptions.map((c) => (
                        <option key={c.id} value={c.id}>{c.id} — {c.title.slice(0, 60)}</option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : (
                <label className="space-y-1 block">
                  <span className="text-sm font-medium">node_id</span>
                  <input className={inputCls} value={fNodeId} onChange={(e) => setFNodeId(e.target.value)} placeholder="z. B. node-a1b2…" />
                </label>
              )}
            </div>
          )}

          {/* kind-spezifische config */}
          {fKind === "answer_review_age" && (
            <label className="space-y-1 block">
              <span className="text-sm font-medium">max_age_days</span>
              <input type="number" min={1} className={inputCls} value={fMaxAge} onChange={(e) => setFMaxAge(Number(e.target.value))} />
            </label>
          )}
          {fKind === "webhook_pull" && (
            <>
              <label className="space-y-1 block md:col-span-2">
                <span className="text-sm font-medium">url</span>
                <input className={inputCls} value={fUrl} onChange={(e) => setFUrl(e.target.value)} placeholder="https://…" />
              </label>
              <label className="space-y-1 block">
                <span className="text-sm font-medium">jsonpath</span>
                <input className={inputCls} value={fJsonpath} onChange={(e) => setFJsonpath(e.target.value)} placeholder="$.data.status" />
              </label>
              <label className="space-y-1 block">
                <span className="text-sm font-medium">expect</span>
                <input className={inputCls} value={fExpect} onChange={(e) => setFExpect(e.target.value)} placeholder="ok" />
              </label>
            </>
          )}

          {/* Label */}
          <label className="space-y-1 block md:col-span-2">
            <span className="text-sm font-medium">{de ? "Bezeichnung (optional)" : "Label (optional)"}</span>
            <input className={inputCls} value={fLabel} onChange={(e) => setFLabel(e.target.value)}
              placeholder={de ? "Leer = automatisch benannt" : "Empty = auto-named"} />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={createTest}
            disabled={creating || !createValid || !user}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {de ? "Test anlegen" : "Create test"}
          </button>
          {!user && <span className="text-xs text-muted-foreground">{de ? "Anmelden, um Tests anzulegen." : "Sign in to create tests."}</span>}
        </div>
      </section>

      {/* ── Bestehende Tests ──────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border font-semibold flex items-center gap-2">
          <Activity size={16} className="text-primary" />
          {de ? "Aktive Tests" : "Active tests"} ({tests.length})
        </div>

        {busy && tests.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />{de ? "Lädt…" : "Loading…"}
          </div>
        ) : loadError ? (
          <div className="p-6 text-sm text-destructive">{de ? "Fehler beim Laden: " : "Load error: "}{loadError}</div>
        ) : tests.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            {de
              ? "Noch keine Tests. Lege oben einen Test an oder nutze „Standard-Tests anlegen“ — danach überwacht der Server-Job die gewählten Kontrollen kontinuierlich."
              : "No tests yet. Create one above or use \"Create standard tests\" — the server job will then monitor the selected controls continuously."}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {tests.map((t) => {
              const history = resultsByTest.get(t.id) ?? [];
              const latest = history[0] ?? null;
              const isOpen = expanded.has(t.id);
              const rowBusy = busyToggle.has(t.id);
              const target = t.framework && t.control_id
                ? `${t.framework} · ${t.control_id}`
                : t.node_id ? `${de ? "Knoten" : "Node"} · ${t.node_id}`
                : (de ? "— kein Ziel —" : "— no target —");
              return (
                <li key={t.id} className="p-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => toggleExpand(t.id)} className="text-muted-foreground shrink-0" aria-label={de ? "Historie" : "History"}>
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" title={t.label}>{t.label}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        <span className="font-medium">{de ? KIND_LABEL[t.kind as TestKind]?.de ?? t.kind : KIND_LABEL[t.kind as TestKind]?.en ?? t.kind}</span>
                        {" · "}{target}{" · "}{de ? "alle" : "every"} {t.interval_hours}h
                      </div>
                    </div>
                    <StatusBadge status={latest?.status ?? "none"} de={de} />
                    <span className="text-xs text-muted-foreground shrink-0 w-32 text-right hidden sm:block">
                      {latest ? fmtDate(latest.ran_at, de) : (de ? "kein Lauf" : "no run")}
                    </span>
                    <button
                      onClick={() => toggleEnabled(t)}
                      disabled={rowBusy}
                      title={t.enabled ? (de ? "Aktiv — klicken zum Deaktivieren" : "Enabled — click to disable") : (de ? "Inaktiv — klicken zum Aktivieren" : "Disabled — click to enable")}
                      className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border ${t.enabled ? "st-ja-border st-ja-text st-ja-tint" : "border-border text-muted-foreground"}`}
                    >
                      <Power size={12} />{t.enabled ? (de ? "Aktiv" : "On") : (de ? "Aus" : "Off")}
                    </button>
                    <button
                      onClick={() => deleteTest(t)}
                      disabled={rowBusy}
                      className="shrink-0 text-destructive/80 hover:text-destructive disabled:opacity-50"
                      title={de ? "Löschen" : "Delete"}
                    >
                      {rowBusy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="pl-7">
                      {history.length === 0 ? (
                        <div className="text-xs text-muted-foreground">{de ? "Noch keine Ergebnisse — der Server-Job hat diesen Test noch nicht ausgeführt." : "No results yet — the server job hasn't run this test."}</div>
                      ) : (
                        <ul className="text-xs space-y-1 border-l border-border pl-3">
                          {history.map((r) => (
                            <li key={r.id} className="flex items-start gap-2">
                              <StatusBadge status={r.status} de={de} />
                              <span className="text-muted-foreground shrink-0">{fmtDate(r.ran_at, de)}</span>
                              {r.detail && Object.keys(r.detail).length > 0 && (
                                <span className="text-muted-foreground/80 truncate" title={JSON.stringify(r.detail)}>
                                  {JSON.stringify(r.detail)}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {enabledFrameworks.length === 0 && !ovLoading && (
        <p className="text-xs text-muted-foreground">
          {de
            ? "Hinweis: Es sind keine Frameworks aktiviert — „Standard-Tests anlegen“ findet dann keine Ziel-Kontrollen."
            : "Note: no frameworks are enabled — \"Create standard tests\" will find no target controls."}
        </p>
      )}
    </div>
  );
}

/** Automatischer Test-Titel, wenn der Nutzer kein Label eingibt. */
function defaultLabel(
  kind: TestKind,
  framework: string | null,
  controlId: string | null,
  nodeId: string | null,
  de: boolean,
): string {
  const name = de ? KIND_LABEL[kind].de : KIND_LABEL[kind].en;
  const target = framework && controlId ? `${framework} ${controlId}` : nodeId ? (de ? `Knoten ${nodeId}` : `Node ${nodeId}`) : "";
  return target ? `${name} — ${target}` : name;
}
