/**
 * Framework mapping registry — shared types.
 *
 * A mapping row declares how a NON-master framework control relates to one
 * or more ISO 27001 Annex A controls. The write engine uses these rows to
 * propagate answers to the canonical ISO answer store; the projection
 * engine reconstructs a per-framework view from the same store.
 */
import type { FrameworkId } from "@/data/frameworks/types";

/**
 *  equivalent  (=)     Full 1:1 equivalence; ISO answer = framework answer.
 *  superset    (⊇)     ISO covers MORE than the framework control.
 *                      → ISO=Ja implies Framework=Ja (fully covered).
 *                      → Framework input contributes partial evidence.
 *  subset      (⊆)     ISO covers LESS than the framework control.
 *                      → ISO=Ja gives Framework partial evidence only.
 *  partial     (≈)     Overlap but neither is a full super/subset.
 *                      → suggestion only, requires explicit confirmation
 *                        before Framework locks to "Ja".
 */
export type MappingType = "equivalent" | "superset" | "subset" | "partial";

export interface MappingRow {
  /** ID of the non-master control (e.g. "a-01", "org-14"). */
  sourceControlId: string;
  sourceFramework: FrameworkId;
  /** Source category the control belongs to — informational, powers UI grouping. */
  nis2CategoryId?: string;
  /** One or more ISO 27001 control IDs (e.g. ["a5-01","a5-02"]). */
  isoControlIds: string[];
  type: MappingType;
  /** DE rationale — appears in audit trail. */
  rationaleDe: string;
  /** EN rationale — appears in audit trail. */
  rationaleEn: string;
  /** Set true once reviewed & approved by the tenant admin. Unapproved rows still project, but flagged in the UI. */
  approved?: boolean;
}
