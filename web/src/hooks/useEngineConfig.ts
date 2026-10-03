/**
 * useEngineConfig — org-scoped Konfiguration der marktreifen Risiko-Engines.
 *
 * Persistiert eine EINZELNE, organisationsweit geteilte Zeile über
 * `useToolData(..., { scope: "org" })` (Tabelle org_tool_data, tool_key
 * "engine-config"). Die Flags schalten additive Engine-Pfade frei:
 *
 *   - residual_model   'legacy'  → bisheriges Verhalten (Default)
 *                      'multiplicative' → E2 (multiplikatives Residual +
 *                                         Control-Effectiveness)
 *   - gap_context      false → bisherige 2×2-Severity `severityFor` (Default)
 *                      true  → E5 (Kontext-/Risiko-Gewichtung via
 *                              computeGapSeverity)
 *   - appetite_curve   optional, für spätere Engine-Erweiterungen reserviert.
 *
 * WICHTIG: Der Default (residual_model 'legacy', gap_context false) bildet das
 * heutige Verhalten byte-identisch ab. Kein Konsument darf sich auf die
 * Anwesenheit der Flags verlassen — fehlende Felder fallen auf die Defaults.
 */

import { useCallback } from "react";
import { useToolData } from "@/hooks/useToolData";

export type ResidualModel = "legacy" | "multiplicative";

export interface EngineConfig {
  /** Residual-Risiko-Modell. Default 'legacy'. */
  residual_model: ResidualModel;
  /** Kontext-/Risiko-Gewichtung der Gap-Severity (E5). Default false. */
  gap_context: boolean;
  /** Optionale Appetit-Kurve (reserviert, aktuell ungenutzt). */
  appetite_curve?: number[] | null;
}

export const ENGINE_CONFIG_TOOL_KEY = "engine-config";
export const ENGINE_CONFIG_LS_KEY = "cws-engine-config";

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  residual_model: "legacy",
  gap_context: false,
  appetite_curve: null,
};

export interface UseEngineConfigResult {
  config: EngineConfig;
  loading: boolean;
  setResidualModel: (model: ResidualModel) => void;
  setGapContext: (on: boolean) => void;
  setConfig: (next: Partial<EngineConfig>) => void;
}

export function useEngineConfig(): UseEngineConfigResult {
  const { data, setData, loading } = useToolData<EngineConfig>(
    ENGINE_CONFIG_TOOL_KEY,
    ENGINE_CONFIG_LS_KEY,
    DEFAULT_ENGINE_CONFIG,
    { scope: "org" },
  );

  // Verteidigt gegen ältere/teilweise Zeilen: fehlende Felder → Default.
  const config: EngineConfig = {
    residual_model: data?.residual_model === "multiplicative" ? "multiplicative" : "legacy",
    gap_context: data?.gap_context === true,
    appetite_curve: data?.appetite_curve ?? null,
  };

  const setResidualModel = useCallback(
    (model: ResidualModel) => setData(prev => ({ ...prev, residual_model: model })),
    [setData],
  );
  const setGapContext = useCallback(
    (on: boolean) => setData(prev => ({ ...prev, gap_context: on })),
    [setData],
  );
  const setConfig = useCallback(
    (next: Partial<EngineConfig>) => setData(prev => ({ ...prev, ...next })),
    [setData],
  );

  return { config, loading, setResidualModel, setGapContext, setConfig };
}
