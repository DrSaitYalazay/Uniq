/**
 * ModeToggle — globaler Überblick/Detail-Umschalter (Progressive Disclosure).
 *
 * Nutzt denselben org-/geräteweiten Zustand wie das Assessment
 * (useAssessmentMode, localStorage): „simple" = Überblick (Management-Sicht,
 * kompakt), „expert" = Detail (Fach-/Auditor-Sicht, vollständig).
 *
 * Bewusst KEIN Dekor: Auf jeder Seite blendet der Detail-Modus zusätzliche
 * analytische Abschnitte ein. Über `useAssessmentMode().mode` fragen Seiten den
 * Zustand ab und rendern entsprechend.
 */
import { useAssessmentMode } from "@/hooks/useAssessmentMode";

export function ModeToggle({ de = true, className = "" }: { de?: boolean; className?: string }) {
  const { mode, setMode } = useAssessmentMode();
  return (
    <div
      role="group"
      aria-label={de ? "Ansichtsmodus" : "View mode"}
      className={`inline-flex rounded-lg border border-border overflow-hidden ${className}`}
    >
      {(["simple", "expert"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          aria-pressed={mode === m}
          title={m === "simple"
            ? (de ? "Überblick — kompakte Management-Sicht" : "Overview — compact management view")
            : (de ? "Detail — vollständige Fach-/Auditor-Sicht" : "Detail — full expert/auditor view")}
          className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            mode === m ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/60"
          }`}
        >
          {m === "simple" ? (de ? "Überblick" : "Overview") : (de ? "Detail" : "Detail")}
        </button>
      ))}
    </div>
  );
}
