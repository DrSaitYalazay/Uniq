/**
 * useBundleOwners — single source of truth for ISO-bundle owner overrides.
 *
 * One bundle = one of the 59 ISO 27001:2022 Annex A controls (e.g. "A.5.15").
 * Used across Step 8 (Risk), Step 9 (Decisions) and Step 15 (Roadmap) so that
 * assigning a primary owner to a bundle in one step is immediately reflected
 * in all others.
 *
 * Storage: useToolData("nis2-bundle-owners") — Supabase-backed, org-isolated,
 * 3s debounced auto-save (same contract as all other tool states).
 */

import { useCallback } from "react";
import { useToolData } from "@/hooks/useToolData";

export interface BundleOwnerEntry {
  /** Owner serialized via personnel.stringifyAssignment ("Name (Title) [+contribs]"). */
  owner: string;
  /** Optional bundle-level due date (ISO yyyy-mm-dd). Set in Step 15 Roadmap;
   *  overrides earlier per-measure dates for child items that have no Roadmap
   *  override of their own. */
  dueDate?: string;
  /** ISO timestamp of last update. */
  updated_at: string;
}

export interface BundleOwnerState {
  /** Map ISO ref → owner entry (e.g. { "A.5.15": { owner: "...", updated_at: "..." } }). */
  owners: Record<string, BundleOwnerEntry>;
}

const DEFAULT_STATE: BundleOwnerState = { owners: {} };
const TOOL_KEY = "nis2-bundle-owners";
const LS_KEY = "nis2-bundle-owners";

export function useBundleOwners() {
  const { data, setData } = useToolData<BundleOwnerState>(TOOL_KEY, LS_KEY, DEFAULT_STATE);

  const getOwner = useCallback(
    (bundleKey: string): string => data.owners?.[bundleKey]?.owner ?? "",
    [data.owners]
  );

  const getDueDate = useCallback(
    (bundleKey: string): string => data.owners?.[bundleKey]?.dueDate ?? "",
    [data.owners]
  );

  const setOwner = useCallback(
    (bundleKey: string, owner: string) => {
      setData(prev => {
        const next = { ...(prev.owners ?? {}) };
        const existing = next[bundleKey];
        const trimmed = (owner ?? "").trim();
        if (!trimmed && !existing?.dueDate) {
          delete next[bundleKey];
        } else {
          next[bundleKey] = {
            owner: trimmed,
            dueDate: existing?.dueDate,
            updated_at: new Date().toISOString(),
          };
        }
        return { owners: next };
      });
    },
    [setData]
  );

  const setDueDate = useCallback(
    (bundleKey: string, dueDate: string) => {
      setData(prev => {
        const next = { ...(prev.owners ?? {}) };
        const existing = next[bundleKey];
        const trimmed = (dueDate ?? "").trim();
        if (!trimmed && !existing?.owner) {
          delete next[bundleKey];
        } else {
          next[bundleKey] = {
            owner: existing?.owner ?? "",
            dueDate: trimmed || undefined,
            updated_at: new Date().toISOString(),
          };
        }
        return { owners: next };
      });
    },
    [setData]
  );

  /**
   * Resolve effective bundle owner: explicit override → member majority → empty.
   * Used as the "primary" badge in bundle headers across steps.
   */
  const resolveOwner = useCallback(
    (bundleKey: string, memberOwners: string[]): string => {
      const override = data.owners?.[bundleKey]?.owner;
      if (override && override.trim()) return override;
      const filled = memberOwners.filter(Boolean);
      if (filled.length === 0) return "";
      // Majority vote — fall back to first non-empty if tied.
      const counts = new Map<string, number>();
      for (const o of filled) counts.set(o, (counts.get(o) ?? 0) + 1);
      let best = "";
      let bestN = 0;
      for (const [o, n] of counts) {
        if (n > bestN) { best = o; bestN = n; }
      }
      return best;
    },
    [data.owners]
  );

  return { data, getOwner, getDueDate, setOwner, setDueDate, resolveOwner };
}
