import { Info, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  de: boolean;
}

/**
 * Was rein gehört, was nicht — psychological-relief InfoTip.
 * Goal: kill the "do I have to enter 1000 devices?" fear in the first second.
 */
export default function AssetInventoryInfoTip({ de }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
          <Info className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[420px] max-w-[90vw] p-0">
        <div className="p-4 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              {de ? "Was gehört ins Asset-Inventar?" : "What belongs in the asset inventory?"}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {de
                ? "Erfassen Sie Asset-Klassen, nicht jedes einzelne Gerät. NIS2 §30 / ISO 27001 A.5.9 fordern ein Verzeichnis — keine Seriennummernliste."
                : "Capture asset classes, not every single device. NIS2 §30 / ISO 27001 A.5.9 require an inventory — not a list of serial numbers."}
            </p>
          </div>

          <div className="rounded-md border st-ja-border st-ja-tint p-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold st-ja-text">
              <Check className="h-3.5 w-3.5" />
              {de ? "Gehört hinein" : "Belongs in"}
            </div>
            <ul className="mt-1.5 space-y-0.5 text-[11px] text-foreground/80">
              <li>• {de ? "Server, Datenbanken, zentrale Anwendungen" : "Servers, databases, central applications"}</li>
              <li>• {de ? "Identity-Provider (AD / Entra)" : "Identity providers (AD / Entra)"}</li>
              <li>• {de ? "OT- / ICS-Komponenten (SCADA, SPS, Sensoren)" : "OT / ICS components (SCADA, PLC, sensors)"}</li>
              <li>• {de ? "Externe Dienstleister mit Datenzugriff" : "External providers with data access"}</li>
              <li>• {de ? "Endgeräte als Gruppen-Asset (z. B. „45 Vertriebs-Laptops“)" : "Endpoint groups (e.g. “45 sales laptops”)"}</li>
            </ul>
          </div>

          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
              <X className="h-3.5 w-3.5" />
              {de ? "Gehört nicht hinein" : "Does not belong"}
            </div>
            <ul className="mt-1.5 space-y-0.5 text-[11px] text-foreground/80">
              <li>• {de ? "Jedes einzelne Notebook mit Seriennummer" : "Every individual laptop with serial number"}</li>
              <li>• {de ? "Software-Lizenznummern" : "Software license numbers"}</li>
              <li>• {de ? "Einzelne Mitarbeiterkonten" : "Individual employee accounts"}</li>
            </ul>
          </div>

          <div className="rounded-md bg-muted/40 p-2.5">
            <p className="text-[11px] font-semibold text-foreground">
              {de ? "Beispiele aus der Praxis" : "Real-world examples"}
            </p>
            <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
              <li>
                {de
                  ? "„Workstations Stationen“ = 1 Eintrag, Anzahl: 120"
                  : "“Workstations wards” = 1 entry, count: 120"}
              </li>
              <li>
                {de
                  ? "„SAP ERP“ = 1 Anwendung, nicht jeder Modul-Aufruf"
                  : "“SAP ERP” = 1 application, not every module call"}
              </li>
              <li>
                {de
                  ? "„Active Directory“ = 1 Verzeichnisdienst, nicht jeder Benutzer"
                  : "“Active Directory” = 1 directory service, not every user"}
              </li>
            </ul>
          </div>

          <p className="text-[10px] text-muted-foreground italic">
            {de
              ? "Tipp: Wenn Ihre Branche unterstützt wird, laden Sie ein Sektorpaket – das spart 70-90 % Tipparbeit."
              : "Tip: If your sector is supported, load a sector pack — saves 70-90 % of the typing."}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
