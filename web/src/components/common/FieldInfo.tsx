import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  title: string;
  body: string;
  className?: string;
}

/**
 * Small ⓘ popover — click reveals a short explanation.
 * Use next to labels for field-level definitions (e.g. "DR = Disaster Recovery").
 */
export default function FieldInfo({ title, body, className }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={title}
          className={`inline-flex items-center justify-center h-4 w-4 text-muted-foreground hover:text-accent transition-colors align-middle ${className ?? ""}`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3 text-xs">
        <div className="font-semibold text-foreground mb-1">{title}</div>
        <div className="text-muted-foreground leading-relaxed">{body}</div>
      </PopoverContent>
    </Popover>
  );
}
