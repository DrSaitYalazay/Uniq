/**
 * useRoadmapItems — loads + upserts roadmap_items rows for the current tenant.
 * Persistence layer for the Roadmap page. Presentational filtering /
 * grouping is handled inside the page.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { RoadmapItem, RoadmapPhase } from "@/lib/roadmapEngine";

interface UseRoadmapItemsState {
  items: RoadmapItem[];
  loading: boolean;
  error: string | null;
  upsert: (patch: Partial<RoadmapItem> & { risk_id: string; control_id: string }) => Promise<void>;
  reload: () => Promise<void>;
}

export function useRoadmapItems(): UseRoadmapItemsState {
  const { user, tenantId } = useAuth();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase
        .from("roadmap_items")
        .select("id, risk_id, control_id, owner_id, start_date, due_date, effort_pt, phase_override, notes")
        .eq("user_id", tenantId ?? user.id);
      if (error) throw error;
      setItems((data ?? []) as RoadmapItem[]);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, [user, tenantId]);

  useEffect(() => { load(); }, [load]);

  const upsert = useCallback(async (patch: Partial<RoadmapItem> & { risk_id: string; control_id: string }) => {
    if (!user) return;
    const existing = items.find(i => i.risk_id === patch.risk_id && i.control_id === patch.control_id);
    const merged: any = {
      user_id: tenantId ?? user.id,
      risk_id: patch.risk_id,
      control_id: patch.control_id,
      owner_id: patch.owner_id ?? existing?.owner_id ?? null,
      start_date: patch.start_date ?? existing?.start_date ?? null,
      due_date: patch.due_date ?? existing?.due_date ?? null,
      effort_pt: patch.effort_pt ?? existing?.effort_pt ?? null,
      phase_override: (patch.phase_override ?? existing?.phase_override ?? null) as RoadmapPhase | null,
      notes: patch.notes ?? existing?.notes ?? null,
    };
    // Optimistic update
    setItems(prev => {
      const rest = prev.filter(i => !(i.risk_id === patch.risk_id && i.control_id === patch.control_id));
      return [...rest, { ...(existing ?? { id: "pending" }), ...merged } as RoadmapItem];
    });
    const { error } = await supabase
      .from("roadmap_items")
      .upsert(merged, { onConflict: "user_id,risk_id,control_id" });
    if (error) {
      toast.error("Fehler beim Speichern / Save error");
      load();
    }
  }, [items, user, tenantId, load]);

  return { items, loading, error, upsert, reload: load };
}
