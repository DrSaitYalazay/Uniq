/**
 * ExportMenu — reusable PDF / Word / Excel dropdown trigger.
 * Wraps a Popover; caller supplies async handlers for each format.
 * White-labelled via existing report theme (button styling matches Assessment).
 */
import { FileDown, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  onPdf: () => void | Promise<void>;
  onWord: () => void | Promise<void>;
  onExcel: () => void | Promise<void>;
  disabled?: boolean;
  label?: string;
  size?: "sm" | "default";
}

export default function ExportMenu({ onPdf, onWord, onExcel, disabled, label, size = "sm" }: Props) {
  const { lang } = useLanguage();
  const de = lang === "de";
  
  const btnLabel = label ?? (de ? "Bericht" : "Report");
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size={size} className="gap-2" disabled={disabled}>
          <FileDown className="h-4 w-4" /> {btnLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-3">
        <div className="text-[11px] font-semibold text-foreground mb-2">
          {de ? "Format wählen" : "Choose format"}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1" disabled={disabled} onClick={() => onPdf()}>
            <FileDown className="h-3 w-3" /> PDF
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1" disabled={disabled} onClick={() => onWord()}>
            <FileText className="h-3 w-3" /> Word
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1" disabled={disabled} onClick={() => onExcel()}>
            <FileSpreadsheet className="h-3 w-3" /> Excel
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
