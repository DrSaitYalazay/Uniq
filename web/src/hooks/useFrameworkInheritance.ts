import { useMemo } from "react";
import { useToolData } from "@/hooks/useToolData";

/**
 * Cross-framework answer inheritance setting.
 *
 * Model:
 * - "off"      → Nur direkt für das ausgewählte Framework beantwortete Kontrollen
 *                zählen. Antworten aus anderen Frameworks (z. B. ISO 27001)
 *                fließen NICHT ein.
 * - "preview"  → Antworten aus anderen Frameworks werden im Speicher
 *                aggregiert und angezeigt, aber NICHT persistiert. Toggle
 *                aus → sofortiger Rollback.
 * - "applied"  → Der Nutzer hat "Übernehmen" gedrückt. Preview-Verhalten wird
 *                aktiv beibehalten und mit Zeitstempel markiert, sodass es
 *                Sitzungen überdauert. Zurücksetzen jederzeit möglich.
 *
 * Aggregation policy (Mapping mehrerer Anker-Antworten auf eine
 * Nicht-Hub-Anforderung):
 *   WEAKEST-LINK + relations-bewusste Deckelung — der STRENGSTE Status über alle
 *   den Knoten teilenden Frameworks gewinnt (nein < teilweise < ja, siehe
 *   projectAnswer; CHG-07). Ein späteres "ja" verdeckt ein "nein" NICHT. Der über
 *   einen Anker GEERBTE Status wird relations-bewusst gedeckelt: equal/superset-of
 *   vererben voll; subset-of/intersects-with deckeln ein geerbtes "ja" auf "teilweise".
 *
 * Default & Read-Migration (WICHTIG — Regressionsschutz):
 *   Faktisch lief die Projektion bisher IMMER (unabhängig vom gespeicherten
 *   Modus). Um jeden Bestands-Tenant beim heutigen Zahlenstand zu halten,
 *   ist der Default nun "applied" und ein Alt-Blob OHNE `v: 2` wird beim Lesen
 *   auf { mode: "applied", … , v: 2 } migriert. Erst NACH Deploy vom Nutzer
 *   erzeugte Zustände (mit v: 2) erzeugen echtes "off".
 */

export type InheritanceMode = "off" | "preview" | "applied";

export interface FrameworkInheritanceState {
  mode: InheritanceMode;
  appliedAt: string | null;
  /** Schema-Version. Ab v2 wird ein persistiertes "off" respektiert. */
  v?: 2;
}

const DEFAULT_STATE: FrameworkInheritanceState = { mode: "applied", appliedAt: null, v: 2 };

const TOOL_KEY = "framework-inheritance";
const LOCAL_KEY = "cws.framework-inheritance";

/**
 * READ-MIGRATION (pure): Ein Blob mit `v: 2` wird unverändert übernommen (echtes
 * "off" bleibt "off"). JEDER Alt-Blob (kein `v: 2`) wird als
 * { mode: "applied", appliedAt: appliedAt ?? now, v: 2 } interpretiert — heute
 * wird faktisch immer vererbt, also bleibt der Tenant beim heutigen Zahlenstand.
 */
export function migrateInheritanceState(raw: unknown): FrameworkInheritanceState {
  const r = (raw ?? {}) as Partial<FrameworkInheritanceState>;
  if (r && typeof r === "object" && r.v === 2) {
    const mode: InheritanceMode =
      r.mode === "off" || r.mode === "preview" || r.mode === "applied" ? r.mode : "applied";
    return { mode, appliedAt: r.appliedAt ?? null, v: 2 };
  }
  return { mode: "applied", appliedAt: r?.appliedAt ?? new Date().toISOString(), v: 2 };
}

export function useFrameworkInheritance() {
  const { data, setData, loading } = useToolData<FrameworkInheritanceState>(
    TOOL_KEY,
    LOCAL_KEY,
    DEFAULT_STATE,
  );

  // Bestands-Blobs (ohne v:2) auf das heutige faktische Verhalten pinnen.
  const migrated = useMemo(() => migrateInheritanceState(data), [data]);

  const setMode = (mode: InheritanceMode) => {
    setData({
      mode,
      appliedAt: mode === "applied" ? new Date().toISOString() : migrated.appliedAt,
      v: 2,
    });
  };

  const apply = () => setData({ mode: "applied", appliedAt: new Date().toISOString(), v: 2 });
  const preview = () => setData({ mode: "preview", appliedAt: migrated.appliedAt, v: 2 });
  const reset = () => setData({ mode: "off", appliedAt: null, v: 2 });

  return {
    state: migrated,
    mode: migrated.mode,
    appliedAt: migrated.appliedAt,
    isActive: migrated.mode === "preview" || migrated.mode === "applied",
    isApplied: migrated.mode === "applied",
    loading,
    setMode,
    apply,
    preview,
    reset,
  };
}
