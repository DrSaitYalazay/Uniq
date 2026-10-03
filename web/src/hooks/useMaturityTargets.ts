/**
 * useMaturityTargets — lädt Ziel-Reifegrade aus public.maturity_targets für EIN
 * Framework. Additiv, RLS-tenant-scoped (Policy filtert automatisch).
 *
 * Rückgabe: Record<family_id, target>. Schlüssel "" = framework-weites Ziel
 * (Zeile mit family_id IS NULL). Default: TISAX bekommt framework-weit 3, wenn
 * für das Framework noch keine Zeile existiert (ARCHITECTURE §2.4). Kein Ziel
 * für andere Frameworks ohne Zeile → gap bleibt null.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useMaturityTargets(framework: string | null | undefined) {
  const { user, tenantId } = useAuth();
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || !framework) {
        if (!cancelled) { setTargets({}); setLoading(false); }
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("maturity_targets")
        .select("framework, family_id, target")
        .eq("framework", framework);
      if (cancelled) return;

      const map: Record<string, number> = {};
      if (!error && Array.isArray(data)) {
        for (const r of data as Array<{ family_id: string | null; target: number }>) {
          map[r.family_id ?? ""] = r.target;
        }
      }
      // App-seitiges Default (nicht im Schema): TISAX = 3 framework-weit.
      if (framework === "TISAX" && Object.keys(map).length === 0) {
        map[""] = 3;
      }
      setTargets(map);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, tenantId, framework]);

  return { targets, loading };
}
