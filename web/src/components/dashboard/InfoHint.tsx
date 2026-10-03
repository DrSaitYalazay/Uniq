/**
 * InfoHint — kleines „?"-Symbol mit Erklär-Popover. Für jede Dashboard-Sektion,
 * damit auch ohne Fachhintergrund klar ist, WAS die Kachel zeigt und WIE man sie
 * liest. Dr. Sait: „ne ne anlatıyor bilinmesi lazım" — ein Fragezeichen je Bereich.
 */
import { HelpCircle } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export function InfoHint({ title, text, side = "top" }: { title: string; text: string; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={title}
          title={title}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center justify-center size-5 rounded-full text-muted-foreground hover:text-accent hover:bg-muted/70 transition-colors shrink-0"
        >
          <HelpCircle className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent side={side} align="start" className="w-72 text-xs leading-relaxed" onClick={(e) => e.stopPropagation()}>
        <div className="font-semibold text-sm mb-1 text-foreground">{title}</div>
        <p className="text-muted-foreground whitespace-pre-line">{text}</p>
      </PopoverContent>
    </Popover>
  );
}
