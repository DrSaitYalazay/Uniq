/**
 * useUmsetzungEffective — EINE Quelle für den Umsetzungs-Overlay.
 *
 * Bisher schrieb die Umsetzung-Seite einen Cache-Blob `umsetzung-effective`, den
 * Dashboard/Roadmap/Audit/Risiko lasen. Der Blob war nur so aktuell wie der letzte
 * Besuch der Umsetzung-Seite → je nach Reihenfolge der Seitenbesuche verschiedene
 * Zahlen (Befund US-Audit: ISO 75 % vs. 69 %, „In Bearbeitung 0" vs. „Laufend 169").
 *
 * Jetzt: Overlay wird LIVE aus `implementation_status` (DB) + derselben Bündelung
 * (`buildUmsetzungView`) berechnet, die die Umsetzung-Seite verwendet. Alle Konsumenten
 * sehen dieselben Werte, unabhängig von der Besuchsreihenfolge.
 */
import { useMemo } from "react";
import { useImplementationStatus, type ImplStatusRow, type ImplStatus } from "@/hooks/useImplementationStatus";
import { buildUmsetzungView, type RawControl } from "@/lib/implementationEngine";
import type { FrameworkKey } from "@/contexts/FrameworkContext";

export interface MemberImpl {
  bundle_key: string;
  status: ImplStatus;
  owner: string | null;
  due_date: string | null;
  completed_at: string | null;
  evidence_url: string | null;
}

export interface UmsetzungEffective {
  /** `${FW}:${id}` → "ja" (fertig) | "teilweise" (laufend) — Overlay für die Gap-Projektion. */
  members: Record<string, "ja" | "teilweise">;
  /** `${FW}:${id}` → Umsetzungszeile (Status/Owner/Frist/Nachweis) des zugehörigen Bündels. */
  byMember: Record<string, MemberImpl>;
  /** bundle_key → Zeile (roh). */
  rows: Record<string, ImplStatusRow>;
  loading: boolean;
}

type ControlLike = { id: string; framework: string; req_de?: string | null; req_en?: string | null; effort_pt?: number | null; meta?: Record<string, unknown> | null };

/** Pure Variante (für Lader ohne Hook-Kontext, z. B. useRiskAnalysis): Overlay aus Zeilen berechnen. */
export function computeUmsetzungEffective(
  controls: ControlLike[],
  enabledFrameworks: string[],
  rows: Record<string, ImplStatusRow>,
): { members: Record<string, "ja" | "teilweise">; byMember: Record<string, MemberImpl> } {
  const members: Record<string, "ja" | "teilweise"> = {};
  const byMember: Record<string, MemberImpl> = {};
  if (!controls.length || !enabledFrameworks.length) return { members, byMember };
  const raw: RawControl[] = controls.map(c => ({ id: c.id, framework: c.framework, req_de: c.req_de ?? null, req_en: c.req_en ?? null, effort_pt: c.effort_pt ?? null, meta: c.meta ?? null }));
  const view = buildUmsetzungView(raw, enabledFrameworks as FrameworkKey[]);
  for (const b of [...view.shared, ...Object.values(view.deltaByFramework).flat()]) {
    const r = rows[b.bundle_key];
    if (!r) continue;
    for (const id of (b.memberControlIds ?? [])) {
      byMember[id] = { bundle_key: b.bundle_key, status: r.status, owner: r.owner ?? null, due_date: r.due_date ?? null, completed_at: r.completed_at ?? null, evidence_url: r.evidence_url ?? null };
      if (r.status === "fertig") members[id] = "ja";
      else if (r.status === "laufend" && members[id] !== "ja") members[id] = "teilweise";
    }
  }
  return { members, byMember };
}

export function useUmsetzungEffective(
  controls: ControlLike[],
  enabledFrameworks: string[],
): UmsetzungEffective {
  const { rows, loading } = useImplementationStatus();
  const { members, byMember } = useMemo(() => computeUmsetzungEffective(controls, enabledFrameworks, rows), [controls, enabledFrameworks, rows]);
  return { members, byMember, rows, loading };
}
