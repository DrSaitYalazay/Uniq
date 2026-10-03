import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Download, FileSpreadsheet } from "lucide-react";
import { CSV_COLUMNS, downloadCsvTemplate } from "@/lib/assetCsv";

export default function CsvImportHelpDialog({ de }: { de: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <HelpCircle className="h-3.5 w-3.5" />
          {de ? "CSV-Format" : "CSV format"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {de ? "CSV-Import: Spezifikation" : "CSV import: specification"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            {de
              ? "Die CSV-Datei muss eine Kopfzeile (Header) enthalten. Trennzeichen , oder ; werden automatisch erkannt. UTF-8 wird empfohlen."
              : "The CSV file must include a header row. Both , and ; delimiters are auto-detected. UTF-8 encoding recommended."}
          </p>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">{de ? "Spalte" : "Column"}</th>
                  <th className="text-left px-3 py-2 font-semibold">{de ? "Pflicht" : "Required"}</th>
                  <th className="text-left px-3 py-2 font-semibold">{de ? "Beschreibung" : "Description"}</th>
                </tr>
              </thead>
              <tbody>
                {CSV_COLUMNS.map(col => (
                  <tr key={col.key} className="border-t border-border">
                    <td className="px-3 py-2 font-mono">{col.key}</td>
                    <td className="px-3 py-2">
                      {col.required
                        ? <Badge variant="destructive" className="text-[10px]">{de ? "Ja" : "Yes"}</Badge>
                        : <Badge variant="secondary" className="text-[10px]">{de ? "Optional" : "Optional"}</Badge>}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{de ? col.description.de : col.description.en}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-1">
            <p className="font-semibold text-foreground">{de ? "Hinweise" : "Notes"}</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
              <li>{de ? "Werte mit Komma in doppelte Anführungszeichen setzen, z. B.: \"Backup, Standort A\"" : "Wrap values containing commas in double quotes, e.g. \"Backup, Site A\""}</li>
              <li>{de ? "Boolesche Werte: true / false (auch ja / nein, 1 / 0)" : "Booleans: true / false (also yes / no, 1 / 0)"}</li>
              <li>{de ? "user_override_criticality leer lassen, um die Kritikalität vom Dienst zu erben." : "Leave user_override_criticality empty to inherit criticality from the service."}</li>
              <li>{de ? "Assets werden dem aktuell ausgewählten Dienst zugeordnet." : "Assets are imported into the currently selected service."}</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={downloadCsvTemplate} className="gap-1.5">
            <Download className="h-4 w-4" />
            {de ? "Vorlage herunterladen" : "Download template"}
          </Button>
          <Button onClick={() => setOpen(false)}>{de ? "Verstanden" : "Got it"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
