import { useState, useRef } from "react";
import { Upload, Download, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { csvToObjects, downloadCsv, objectsToCsv } from "@/lib/csv";
import { supabase } from "@/integrations/supabase/client";

type Kind = "services" | "assets" | "dependencies";

const TEMPLATES: Record<Kind, { headers: string[]; sample: Record<string, string>[] }> = {
  services: {
    headers: ["name", "category", "criticality", "description", "owner", "rto_hours", "rpo_hours"],
    sample: [
      { name: "EHR", category: "Business", criticality: "4", description: "Patientenakte", owner: "CIO", rto_hours: "4", rpo_hours: "1" },
      { name: "HR-Portal", category: "Support", criticality: "2", description: "Personio", owner: "HR", rto_hours: "24", rpo_hours: "8" },
    ],
  },
  assets: {
    headers: ["service_name", "asset_name", "asset_type", "environment", "vendor", "data_sensitivity", "external_exposure", "instance_count"],
    sample: [
      { service_name: "EHR", asset_name: "EHR-DB", asset_type: "Database", environment: "Production", vendor: "Oracle", data_sensitivity: "Highly Confidential", external_exposure: "false", instance_count: "1" },
      { service_name: "EHR", asset_name: "EHR-App", asset_type: "Application", environment: "Production", vendor: "Epic", data_sensitivity: "Highly Confidential", external_exposure: "false", instance_count: "1" },
    ],
  },
  dependencies: {
    headers: ["source_asset", "target_asset", "notes"],
    sample: [
      { source_asset: "EHR-App", target_asset: "EHR-DB", notes: "Application requires database" },
      { source_asset: "EHR-App", target_asset: "Identity Provider", notes: "Login dependency" },
    ],
  },
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: Kind;
  tenantId: string | null;
  de: boolean;
  onImported: () => void;
}

export default function CsvImportDialog({ open, onOpenChange, kind, tenantId, de, onImported }: Props) {
  const [text, setText] = useState("");
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const tpl = TEMPLATES[kind];
  const t = (d: string, e: string) => (de ? d : e);

  const parse = (raw: string) => {
    setText(raw);
    const rows = csvToObjects(raw);
    setPreview(rows.slice(0, 5));
    const errs: string[] = [];
    if (rows.length === 0) errs.push(t("Keine Datenzeilen gefunden.", "No data rows found."));
    const missing = tpl.headers.filter((h) => rows[0] && !(h in rows[0]));
    if (missing.length > 0) errs.push(t(`Fehlende Spalten: ${missing.join(", ")}`, `Missing columns: ${missing.join(", ")}`));
    setErrors(errs);
  };

  const handleFile = async (f: File) => {
    const raw = await f.text();
    parse(raw);
  };

  const downloadTemplate = () => downloadCsv(`${kind}_template.csv`, objectsToCsv(tpl.sample, tpl.headers));

  const doImport = async () => {
    if (!tenantId) return;
    const rows = csvToObjects(text);
    if (rows.length === 0) return;
    setImporting(true);

    try {
      let count = 0;
      if (kind === "services") {
        const payload = rows.map((r) => ({
          user_id: tenantId,
          name: r.name, category: r.category || "Business",
          criticality: Math.max(0, Math.min(4, parseInt(r.criticality || "2") || 2)),
          description: r.description || null, owner: r.owner || null,
          rto_hours: r.rto_hours ? parseInt(r.rto_hours) : null,
          rpo_hours: r.rpo_hours ? parseInt(r.rpo_hours) : null,
        })).filter((r) => r.name);
        const { error } = await supabase.from("services").insert(payload);
        if (error) throw error;
        count = payload.length;
      } else if (kind === "assets") {
        const { data: svcs } = await supabase.from("services").select("id,name");
        const svcMap = new Map((svcs ?? []).map((s) => [(s.name ?? "").toLowerCase().trim(), s.id]));
        const missing = rows.filter((r) => !svcMap.has((r.service_name || "").toLowerCase().trim()));
        if (missing.length > 0) {
          toast.error(t(`${missing.length} Assets: unbekannter Service. Bitte erst Services anlegen.`, `${missing.length} assets: unknown service. Create services first.`));
        }
        const payload = rows
          .filter((r) => svcMap.has((r.service_name || "").toLowerCase().trim()))
          .map((r) => ({
            user_id: tenantId,
            service_id: svcMap.get(r.service_name.toLowerCase().trim())!,
            asset_name: r.asset_name, asset_type: r.asset_type || "Application",
            environment: r.environment || "Production", vendor: r.vendor || null,
            data_sensitivity: r.data_sensitivity || null,
            external_exposure: r.external_exposure === "true",
            instance_count: r.instance_count ? parseInt(r.instance_count) : 1,
            inherited_criticality: true, zok_ids: [],
          })).filter((r) => r.asset_name);
        const { error } = await supabase.from("assets").insert(payload);
        if (error) throw error;
        count = payload.length;
      } else {
        const { data: assetRows } = await supabase.from("assets").select("id,asset_name");
        const assetMap = new Map((assetRows ?? []).map((asset) => [(asset.asset_name ?? "").toLowerCase().trim(), { id: asset.id, name: asset.asset_name }]));
        const missing = rows.filter((r) => {
          const sourceKey = (r.source_asset || "").toLowerCase().trim();
          const targetKey = (r.target_asset || "").toLowerCase().trim();
          return !assetMap.has(sourceKey) || !assetMap.has(targetKey);
        });
        if (missing.length > 0) {
          toast.error(t(`${missing.length} Zeilen: unbekanntes Asset. Bitte erst Assets anlegen.`, `${missing.length} rows: unknown asset. Create assets first.`));
        }
        const payload = rows.map((r) => {
          const sourceKey = (r.source_asset || "").toLowerCase().trim();
          const targetKey = (r.target_asset || "").toLowerCase().trim();
          const src = assetMap.get(sourceKey);
          const target = assetMap.get(targetKey);
          return {
            user_id: tenantId,
            source_type: "asset", source_id: src?.id ?? null, source_label: src?.name ?? r.source_asset,
            target_type: "asset", target_id: target?.id ?? null, target_label: target?.name ?? r.target_asset,
            dependency_type: "technical",
            criticality: 0,
            is_spof: false,
            supplier_country: null,
            notes: r.notes || null,
          };
        }).filter((r) => r.source_id && r.target_id && r.source_id !== r.target_id);
        const { error } = await supabase.from("dependencies").insert(payload);
        if (error) throw error;
        count = payload.length;
      }

      toast.success(t(`${count} Zeilen importiert.`, `${count} rows imported.`));
      onImported();
      onOpenChange(false);
      setText(""); setPreview([]); setErrors([]);
    } catch (e: any) {
      toast.error(e?.message ?? t("Import fehlgeschlagen", "Import failed"));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-accent" />
            CSV Import — {kind}
          </DialogTitle>
          <DialogDescription>
            {t("Datei hochladen oder CSV einfügen. Getrennt durch Komma oder Semikolon.",
               "Upload a file or paste CSV. Comma or semicolon delimited.")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5 mr-1.5" />{t("Datei wählen", "Choose file")}
          </Button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}/>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-3.5 w-3.5 mr-1.5" />{t("Vorlage herunterladen", "Download template")}
          </Button>
          <div className="text-xs text-muted-foreground flex flex-wrap gap-1 ml-auto">
            {tpl.headers.map((h) => <Badge key={h} variant="outline" className="text-[10px]">{h}</Badge>)}
          </div>
        </div>

        <Textarea
          rows={8}
          className="font-mono text-xs"
          placeholder={tpl.headers.join(",") + "\n" + tpl.sample.map((r) => tpl.headers.map((h) => r[h]).join(",")).join("\n")}
          value={text}
          onChange={(e) => parse(e.target.value)}
        />

        {errors.length > 0 && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 space-y-1">
            {errors.map((er, i) => (
              <div key={i} className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />{er}
              </div>
            ))}
          </div>
        )}

        {preview.length > 0 && errors.length === 0 && (
          <div className="rounded-md border p-2 overflow-x-auto">
            <div className="text-xs text-muted-foreground mb-1">{t("Vorschau (5 Zeilen)", "Preview (5 rows)")}</div>
            <table className="text-xs w-full">
              <thead><tr>{Object.keys(preview[0]).map((k) => <th key={k} className="text-left pr-3 pb-1 font-medium">{k}</th>)}</tr></thead>
              <tbody>{preview.map((r, i) => (
                <tr key={i} className="border-t border-border/50">
                  {Object.values(r).map((v, j) => <td key={j} className="pr-3 py-1 truncate max-w-[140px]">{v}</td>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("Abbrechen", "Cancel")}</Button>
          <Button onClick={doImport} disabled={importing || errors.length > 0 || preview.length === 0}>
            {importing && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            {t("Importieren", "Import")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
