/**
 * useSoaNotApplicable — SoA-Entscheidungen (Phase 05) als „nicht anwendbar"-Menge.
 *
 * Eine in der SoA ausgeschlossene Kontrolle ist in JEDER Ansicht „n.a." — sonst zählt
 * die Gap-Analyse 404 anwendbar, während SoA/Dashboard 403 zeigen (Befund P5.R.4).
 * Schlüssel: `${DB-Framework-Code}:${controlId}`; Altbestand ohne Namespace und der
 * Context-Key BSI_ITGS werden toleriert.
 */
import { useMemo } from "react";
import { useToolData } from "@/hooks/useToolData";

export interface SoaOverrideBlob {
  controls: Record<string, { applicable: boolean; justification?: string }>;
}

/** `${fw}:${id}` → true, wenn in der SoA als nicht anwendbar/ausgeschlossen markiert. */
export function useSoaNotApplicable(): { set: Set<string>; has: (fw: string, id: string) => boolean } {
  const { data } = useToolData<SoaOverrideBlob>("soa", "nis2suite-soa", { controls: {} });
  return useMemo(() => {
    const set = new Set<string>();
    for (const [k, v] of Object.entries(data.controls ?? {})) {
      if (!v || v.applicable !== false) continue;
      const key = k.replace(/^BSI_ITGS:/, "BSI:");
      set.add(key);
      if (!key.includes(":")) set.add(key); // Altbestand ohne Framework-Präfix
    }
    return {
      set,
      has: (fw: string, id: string) => set.has(`${fw}:${id}`) || set.has(id),
    };
  }, [data]);
}
