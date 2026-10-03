import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Org-aware persistence hook.
 * - All members of an organization read/write the SAME row (keyed by org owner's user_id).
 * - Realtime subscription keeps every member in sync when anyone edits.
 * - Falls back to the user's own user_id if they don't belong to an org.
 */
export function useToolData<T>(
  toolKey: string,
  localStorageKey: string,
  defaultData: T,
  opts?: { scope?: "user" | "org" },
) {
  const { user, session, getTenantId } = useAuth();
  // --- Persistence scope (additive, non-breaking) ------------------------
  // Default ("user") preserves byte-identical existing behavior against
  // user_tool_data (keyed by user_id = getTenantId()). "org" persists to the
  // org_tool_data table keyed by tenant_id (a single shared org row) and also
  // stamps updated_by. updated_at is never sent (DB default handles it).
  const isOrgScope = opts?.scope === "org";
  const TABLE = isOrgScope ? "org_tool_data" : "user_tool_data";
  const KEY_COL = isOrgScope ? "tenant_id" : "user_id";
  const ON_CONFLICT = isOrgScope ? "tenant_id,tool_key" : "user_id,tool_key";
  const buildRow = (tenantId: string, rowData: any) =>
    isOrgScope
      ? { tenant_id: tenantId, tool_key: toolKey, data: rowData, updated_by: user?.id }
      : { user_id: tenantId, tool_key: toolKey, data: rowData };
  const [data, setDataState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(localStorageKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return defaultData;
  });
  // Start with loading=true when a user is logged in so auto-save is gated
  // until the cloud row is fetched. This prevents an empty/default state from
  // overwriting good cloud data when the user signs in on a fresh device/browser.
  const [loading, setLoading] = useState<boolean>(!!user);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const ownerIdRef = useRef<string | null>(null);
  const initialLoadDone = useRef(false);
  const initialLoadComplete = useRef(false);
  // Tenant this hook last performed its initial load for. Used to detect a
  // tenant pivot (lecturer impersonation / account switch) so the initial-load
  // guard can be reset and the new tenant's state loaded fresh — otherwise the
  // stale guard would skip the load and the first edit would upsert the OLD
  // tenant's blob into the NEW tenant's row (cross-tenant overwrite).
  const loadedTenantRef = useRef<string | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutoSave = useRef(false);
  const lastRemotePayload = useRef<string | null>(null);
  // Holds the most recent unsaved payload so we can flush it on
  // unmount / tab-hide / page-unload before it's lost (e.g. user logs out
  // a few hundred ms after editing).
  const pendingPayloadRef = useRef<string | null>(null);
  const dataRef = useRef<T>(data);
  const accessTokenRef = useRef<string | null>(session?.access_token ?? null);
  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { accessTokenRef.current = session?.access_token ?? accessTokenRef.current; }, [session]);

  // Resolve via the central AuthContext cache (deduped). Falls back to user.id.
  const resolveTenantId = useCallback(async (userId: string): Promise<string> => {
    const t = await getTenantId();
    return t || userId;
  }, [getTenantId]);

  // Initial load + realtime subscription
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const tenantId = await resolveTenantId(user.id);
      if (cancelled) return;

      // Tenant pivot (impersonation start/stop, account switch without a full
      // reload): reset every guard/ref that must not survive a tenant change so
      // the new tenant is loaded fresh and no stale payload is written into it.
      const tenantChanged = loadedTenantRef.current !== null && loadedTenantRef.current !== tenantId;
      if (tenantChanged) {
        initialLoadDone.current = false;
        initialLoadComplete.current = false;
        lastRemotePayload.current = null;
        pendingPayloadRef.current = null;
        skipNextAutoSave.current = false;
        if (autoSaveTimer.current) { clearTimeout(autoSaveTimer.current); autoSaveTimer.current = null; }
      }
      ownerIdRef.current = tenantId;

      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        loadedTenantRef.current = tenantId;
        setLoading(true);
        const { data: row, error } = await supabase
          .from(TABLE)
          .select("data")
          .eq(KEY_COL, tenantId)
          .eq("tool_key", toolKey)
          .maybeSingle();
        if (!cancelled) {
          if (!error && row?.data) {
            const dbData = row.data as T;
            skipNextAutoSave.current = true;
            lastRemotePayload.current = JSON.stringify(dbData);
            setDataState(dbData);
            localStorage.setItem(localStorageKey, JSON.stringify(dbData));
            setLastSaved(new Date());
          } else if (!error && !row) {
            if (tenantChanged) {
              // New tenant has no row yet — start from defaults instead of
              // carrying the previous tenant's local state over as a baseline
              // (which would otherwise be written into the new tenant's row).
              skipNextAutoSave.current = true;
              lastRemotePayload.current = JSON.stringify(defaultData);
              setDataState(defaultData);
              localStorage.setItem(localStorageKey, JSON.stringify(defaultData));
            } else {
              // No remote row yet — mark current local state as the baseline so
              // we don't immediately overwrite anything unexpectedly.
              lastRemotePayload.current = JSON.stringify(data);
            }
          }
          // Mark cloud-load complete BEFORE clearing loading so auto-save can run.
          initialLoadComplete.current = true;
          setLoading(false);
        }
      }

      // Realtime: listen for any change to the shared row from other members
      channel = supabase
        .channel(`tool-data-${tenantId}-${toolKey}${isOrgScope ? "-org" : ""}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: TABLE,
            filter: `${KEY_COL}=eq.${tenantId}`,
          },
          (payload) => {
            const row = (payload.new ?? payload.old) as { tool_key?: string; data?: unknown } | null;
            if (!row || row.tool_key !== toolKey) return;
            const incoming = (payload.new as { data?: unknown } | null)?.data;
            if (incoming === undefined) return;
            const serialized = JSON.stringify(incoming);
            if (serialized === lastRemotePayload.current) return;
            lastRemotePayload.current = serialized;
            skipNextAutoSave.current = true;
            setDataState(incoming as T);
            localStorage.setItem(localStorageKey, serialized);
            setLastSaved(new Date());
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [user, toolKey, localStorageKey, resolveTenantId]);

  // Mirror to localStorage
  useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(data));
  }, [data, localStorageKey]);

  // Debounced auto-save to shared row
  useEffect(() => {
    if (!user) return;
    // CRITICAL: never auto-save until the initial cloud-load has finished.
    // Otherwise an empty/default state on a fresh device would overwrite good cloud data.
    if (!initialLoadComplete.current) return;
    if (skipNextAutoSave.current) {
      skipNextAutoSave.current = false;
      return;
    }
    const serialized = JSON.stringify(data);
    if (serialized === lastRemotePayload.current) return;
    pendingPayloadRef.current = serialized;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      const tenantId = ownerIdRef.current ?? (await resolveTenantId(user.id));
      ownerIdRef.current = tenantId;
      const payload = pendingPayloadRef.current;
      if (payload === null) return;
      // Write EXACTLY the pending payload (the latest edit), not the stale
      // closure `data`. Otherwise an older snapshot would be written while the
      // newest one is recorded as saved (lastRemotePayload), silently losing it.
      const { error } = await supabase
        .from(TABLE)
        .upsert(
          buildRow(tenantId, JSON.parse(payload)),
          { onConflict: ON_CONFLICT }
        );
      if (!error) {
        lastRemotePayload.current = payload;
        pendingPayloadRef.current = null;
        setLastSaved(new Date());
      }
    }, 1500);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [user, toolKey, data, resolveTenantId]);

  // Best-effort flush of pending unsaved data when the tab is hidden,
  // the page unloads, or the hook unmounts (e.g. user logs out / navigates
  // away). Uses fetch with `keepalive` so the request survives unload.
  useEffect(() => {
    if (!user) return;

    const flush = async () => {
      const payload = pendingPayloadRef.current;
      if (!payload) return;
      try {
        const tenantId = ownerIdRef.current ?? (await resolveTenantId(user.id));
        const sessionRes = await supabase.auth.getSession();
        const accessToken = sessionRes.data.session?.access_token ?? accessTokenRef.current;
        const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
        const apikey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
        if (!accessToken || !supabaseUrl || !apikey) {
          // Fallback: try the regular client (may not complete on unload)
          await supabase
            .from(TABLE)
            .upsert(
              buildRow(tenantId, dataRef.current as any),
              { onConflict: ON_CONFLICT }
            );
        } else {
          await fetch(
            `${supabaseUrl}/rest/v1/${TABLE}?on_conflict=${ON_CONFLICT}`,
            {
              method: "POST",
              keepalive: true,
              headers: {
                "Content-Type": "application/json",
                apikey,
                Authorization: `Bearer ${accessToken}`,
                Prefer: "resolution=merge-duplicates,return=minimal",
              },
              body: JSON.stringify(buildRow(tenantId, JSON.parse(payload))),
            },
          );
        }
        lastRemotePayload.current = payload;
        pendingPayloadRef.current = null;
      } catch {
        // best-effort
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    const onPageHide = () => { void flush(); };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onPageHide);
      // Hook unmount (e.g. logout / route change) — flush immediately too.
      void flush();
    };
  }, [user, toolKey, resolveTenantId]);

  const setData: typeof setDataState = useCallback((value) => {
    const next = typeof value === "function"
      ? (value as (prev: T) => T)(dataRef.current)
      : value;
    const serialized = JSON.stringify(next);
    dataRef.current = next;
    localStorage.setItem(localStorageKey, serialized);
    if (user && initialLoadComplete.current && serialized !== lastRemotePayload.current) {
      pendingPayloadRef.current = serialized;
    }
    setDataState(next);
  }, [localStorageKey, user]);

  const saveToCloud = useCallback(async () => {
    if (!user) {
      toast.error("Bitte melden Sie sich an / Please sign in");
      return;
    }
    setLoading(true);
    const tenantId = ownerIdRef.current ?? (await resolveTenantId(user.id));
    ownerIdRef.current = tenantId;
    const payload = dataRef.current;
    const serialized = JSON.stringify(payload);
    const { error } = await supabase
      .from(TABLE)
      .upsert(
        buildRow(tenantId, payload as any),
        { onConflict: ON_CONFLICT }
      );
    if (error) {
      toast.error("Fehler beim Speichern / Save error");
    } else {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      lastRemotePayload.current = serialized;
      pendingPayloadRef.current = null;
      setLastSaved(new Date());
      toast.success("Gespeichert / Saved ✓");
    }
    setLoading(false);
  }, [user, toolKey, resolveTenantId]);

  const resetData = useCallback(() => {
    // Local-only reset (cloud deletion is the separate resetAndDeleteCloud).
    // Suppress the auto-save that the state change would otherwise trigger and
    // drop any queued payload, so the debounce does NOT push defaultData into
    // the cloud (which in org-scope would wipe the shared row for everyone).
    skipNextAutoSave.current = true;
    pendingPayloadRef.current = null;
    if (autoSaveTimer.current) { clearTimeout(autoSaveTimer.current); autoSaveTimer.current = null; }
    setDataState(defaultData);
    localStorage.removeItem(localStorageKey);
    toast.info("Zurückgesetzt / Reset ✓");
  }, [defaultData, localStorageKey]);

  const resetAndDeleteCloud = useCallback(async () => {
    setDataState(defaultData);
    localStorage.removeItem(localStorageKey);
    if (user) {
      const tenantId = ownerIdRef.current ?? (await resolveTenantId(user.id));
      await supabase
        .from(TABLE)
        .delete()
        .eq(KEY_COL, tenantId)
        .eq("tool_key", toolKey);
    }
    toast.info("Vollständig zurückgesetzt / Fully reset ✓");
  }, [user, defaultData, localStorageKey, toolKey, resolveTenantId]);

  return { data, setData, loading, lastSaved, saveToCloud, resetData, resetAndDeleteCloud };
}
