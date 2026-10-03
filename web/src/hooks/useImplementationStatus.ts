/**
 * useImplementationStatus — the ONLY writable "live status" layer.
 *
 * Assessment (`answers`) and SoA are immutable snapshots. When the user marks a
 * control as done / running / blocked in Umsetzung, we write to
 * `public.implementation_status` keyed by a bundle_key:
 *
 *   • mapped controls  → ISO ref (e.g. "A.5.15") — status is shared across all
 *     frameworks that map to the same ISO control.
 *   • delta controls   → "FRAMEWORK:CONTROL_ID" (e.g. "NIS2:NIS2-101") — status
 *     is framework-specific, no dedup (NIS2 72h ≠ DORA 4h ≠ GDPR 72h).
 *
 * Changing status here does NOT rewrite `answers` — assessment history stays
 * frozen.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type ImplStatus = "offen" | "laufend" | "fertig" | "blockiert";

export interface ImplStatusRow {
  bundle_key: string;
  status: ImplStatus;
  owner: string | null;
  due_date: string | null;
  /** Tatsächliches Erledigungsdatum (editierbar). */
  completed_at: string | null;
  /** Unveränderlicher Erst-Umsetzungs-Anker (einmal gesetzt, nie überschrieben). */
  first_implemented_at: string | null;
  evidence_url: string | null;
  note: string | null;
  last_status_change_at: string;
  updated_at: string;
}

const DEBOUNCE_MS = 700;

/** ISO-Datum (YYYY-MM-DD) von heute — EINE Quelle für alle Fristvergleiche. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * P6.8 — Überfällig-Regel (reine Funktion, EINE Quelle für Umsetzung-Kachel,
 * Filter, Frist-Rotfärbung UND Dashboard-Hinweis): Frist gesetzt, Frist < heute
 * und effektiver Status ≠ fertig. `status` ist der EFFEKTIVE Status (Gap ∪
 * Umsetzung), nicht zwingend `row.status` — deshalb separat übergeben.
 */
export function isOverdue(
  row: { due_date?: string | null } | null | undefined,
  status: ImplStatus,
  today: string = todayIso(),
): boolean {
  const due = row?.due_date ?? "";
  return !!due && due < today && status !== "fertig";
}

export function useImplementationStatus() {
  const { user, tenantId } = useAuth();
  const [rows, setRows] = useState<Record<string, ImplStatusRow>>({});
  const [loading, setLoading] = useState(true);
  const timers = useRef<Map<string, number>>(new Map());
  const rowsRef = useRef(rows);
  useEffect(() => { rowsRef.current = rows; }, [rows]);

  useEffect(() => {
    let cancelled = false;
    if (!tenantId) { setRows({}); setLoading(false); return; }
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("implementation_status")
        .select("bundle_key, status, owner, due_date, completed_at, first_implemented_at, evidence_url, note, last_status_change_at, updated_at")
        .eq("tenant_id", tenantId);
      if (cancelled) return;
      if (error) {
        toast({ title: "Fehler", description: error.message, variant: "destructive" });
      } else {
        const map: Record<string, ImplStatusRow> = {};
        for (const r of (data ?? []) as ImplStatusRow[]) map[r.bundle_key] = r;
        setRows(map);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  const persist = useCallback(async (bundle_key: string, row: ImplStatusRow) => {
    if (!tenantId) return;
    const payload = {
      tenant_id: tenantId,
      bundle_key,
      status: row.status,
      owner: row.owner,
      due_date: row.due_date,
      completed_at: row.completed_at,
      first_implemented_at: row.first_implemented_at,
      evidence_url: row.evidence_url,
      note: row.note,
      updated_by: user?.id ?? null,
    };
    const { error } = await supabase
      .from("implementation_status")
      .upsert(payload, { onConflict: "tenant_id,bundle_key" });
    if (error) toast({ title: "Speichern fehlgeschlagen", description: error.message, variant: "destructive" });
  }, [tenantId, user]);

  const schedule = useCallback((bundle_key: string) => {
    const prev = timers.current.get(bundle_key);
    if (prev) window.clearTimeout(prev);
    const h = window.setTimeout(() => {
      const r = rowsRef.current[bundle_key];
      if (r) persist(bundle_key, r);
      timers.current.delete(bundle_key);
    }, DEBOUNCE_MS);
    timers.current.set(bundle_key, h);
  }, [persist]);

  const update = useCallback((bundle_key: string, patch: Partial<ImplStatusRow>) => {
    setRows(prev => {
      const next = { ...prev };
      const cur: ImplStatusRow = next[bundle_key] ?? {
        bundle_key, status: "offen",
        owner: null, due_date: null, completed_at: null, first_implemented_at: null, evidence_url: null, note: null,
        last_status_change_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      next[bundle_key] = { ...cur, ...patch, bundle_key };
      return next;
    });
    schedule(bundle_key);
  }, [schedule]);

  const getStatus = useCallback((bundle_key: string): ImplStatus => {
    return rows[bundle_key]?.status ?? "offen";
  }, [rows]);

  const summary = useMemo(() => {
    const arr = Object.values(rows);
    const c = { offen: 0, laufend: 0, fertig: 0, blockiert: 0 };
    for (const r of arr) c[r.status]++;
    return c;
  }, [rows]);

  return { rows, loading, update, getStatus, summary };
}
