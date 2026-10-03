import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * LegalBadges — renders MUSS/SOLL pill + Rechtsquelle-Link for delta controls.
 *
 * Reads from the meta payload persisted on `controls.meta` for delta rows:
 *   - stufe : "MUSS" | "SOLL"           → severity pill (red / amber)
 *   - ref   : legal citation string     → visible label
 *   - quelle: HTTPS URL                 → clickable, opens EUR-Lex/BSI/BaFin
 */
export interface LegalBadgeProps {
  stufe?: string | null;
  legalRef?: string | null;
  quelle?: string | null;
  de?: boolean;
}

export function LegalBadges({ stufe, legalRef: ref, quelle, de = true }: LegalBadgeProps) {
  const hasStufe = stufe && stufe.trim().length > 0;
  const hasRef = ref && ref.trim().length > 0;

  if (!hasStufe && !hasRef) return null;

  const stufeUpper = (stufe ?? "").toUpperCase();
  const isMuss = stufeUpper === "MUSS";
  const isSoll = stufeUpper === "SOLL";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1 flex-wrap">
        {hasStufe && (
          <Badge
            variant="outline"
            className={
              "text-[10px] font-bold px-1.5 py-0 " +
              (isMuss
                ? "bg-destructive/10 text-destructive border-destructive/40"
                : isSoll
                ? "st-teilweise-tint st-teilweise-text st-teilweise-border"
                : "bg-muted text-muted-foreground")
            }
          >
            {stufeUpper}
          </Badge>
        )}
        {hasRef && (
          quelle ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={quelle}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:underline max-w-[420px] truncate"
                  title={ref ?? ""}
                >
                  <span className="truncate">{ref}</span>
                  <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-md">
                <div className="font-mono">{ref}</div>
                <div className="text-[10px] text-muted-foreground mt-1 break-all">
                  {de ? "Quelle: " : "Source: "}{quelle}
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted/50 text-foreground/80 max-w-[420px] truncate" title={ref ?? ""}>
              {ref}
            </span>
          )
        )}
      </div>
    </TooltipProvider>
  );
}
