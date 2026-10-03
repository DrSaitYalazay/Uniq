import type { ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";

interface PipelinePageShellProps {
  /** Short step number label ("Step 1", "Schritt 3"). Optional. */
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Long-form InfoTip content shown in a Popover next to the title. */
  infotip?: ReactNode;
  /** Right-aligned action buttons (Save, Export, etc.). */
  actions?: ReactNode;
  /** Optional badges row (framework refs, status pills). */
  badges?: ReactNode;
  children: ReactNode;
  /** Reduce max-width for content-heavy forms. Default: full. */
  maxWidth?: "full" | "prose" | "wide";
}

/**
 * Standard shell for every pipeline step page.
 * Provides:
 *   - Consistent page header (eyebrow · title · subtitle · InfoTip · actions)
 *   - Optional badges row (framework references, status)
 *   - Semantic padding & max-width — no per-page ad-hoc <div className="p-6 space-y-6">
 *   - Works inside AppLayout, below the PhaseTabs bar
 */
const PipelinePageShell = ({
  eyebrow,
  title,
  subtitle,
  infotip,
  actions,
  badges,
  children,
  maxWidth = "full",
}: PipelinePageShellProps) => {
  const widthClass =
    maxWidth === "prose"
      ? "max-w-3xl"
      : maxWidth === "wide"
        ? "max-w-6xl"
        : "max-w-none";

  return (
    <div className="px-4 md:px-6 py-4 md:py-6">
      <div className={`${widthClass} mx-auto space-y-4`}>
        <header className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              {eyebrow && (
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {eyebrow}
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                  {title}
                </h1>
                {infotip && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center size-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label="More info"
                      >
                        <Info className="size-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="bottom"
                      align="start"
                      className="max-w-md text-sm leading-relaxed"
                    >
                      {infotip}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="shrink-0 flex items-center gap-2">{actions}</div>
            )}
          </div>
          {badges && <div className="flex flex-wrap items-center gap-2">{badges}</div>}
        </header>

        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
};

export default PipelinePageShell;
