/**
 * SoAVersionBar — SoA-Versionsstände freigeben & Historie zeigen (J1).
 *
 * ISO-Auditoren wollen einen nachvollziehbaren Freigabe-Verlauf der
 * Anwendbarkeitserklärung. „Version freigeben" friert den aktuellen Stand
 * (Kennzahlen + je Kontrolle anwendbar/Begründung) mit Datum ein. Rein additiv.
 */
import { useEffect, useState } from "react";
import { History, Check, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listSoAVersions, saveSoAVersion, type SoAVersion } from "@/lib/soaVersioning";

interface ProjLike {
  allControls: { framework?: string; id: string; applicable: boolean; justification?: string }[];
  stats: { total: number; applicable: number; notApplicable: number; missingJustification: number };
}

export default function SoAVersionBar({
  tenantId, projection, approvedBy, de = true,
}: { tenantId: string | null | undefined; projection: ProjLike; approvedBy?: string | null; de?: boolean }) {
  const [versions, setVersions] = useState<SoAVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!tenantId) { setLoading(false); return; }
    listSoAVersions(supabase, tenantId)
      .then(v => { if (!cancelled) setVersions(v); })
      .catch(() => { if (!cancelled) setVersions([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tenantId]);

  // Freigabe nur mit vollständigen Begründungen (ISO/IEC 27001 6.1.3 d; SoA-Prüfbericht C-2).
  const fehlend = projection.stats.missingJustification;
  const freigeben = async () => {
    if (!tenantId || saving || fehlend > 0) return;
    setSaving(true);
    try {
      const controls = projection.allControls.map(c => ({
        framework: c.framework ?? "",
        controlId: c.id,
        applicable: c.applicable,
        justification: c.justification ?? "",
      }));
      const v = await saveSoAVersion(supabase, tenantId, {
        stats: {
          total: projection.stats.total,
          applicable: projection.stats.applicable,
          notApplicable: projection.stats.notApplicable,
          missingJustification: projection.stats.missingJustification,
        },
        controls,
        note,
        approved_by: approvedBy ?? null,
      });
      setVersions(prev => [...prev, v]);
      setNote("");
      setOpen(true);
    } catch { /* still */ }
    finally { setSaving(false); }
  };

  const latest = versions.length ? versions[versions.length - 1] : null;
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(de ? "de-DE" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button type="button" onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-sm font-semibold hover:text-accent">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          <History className="size-4 text-accent" />
          {de ? "SoA-Versionen" : "SoA versions"}
          <span className="text-xs font-normal text-muted-foreground">
            {loading ? "…" : latest ? `${de ? "aktuell v" : "current v"}${latest.version} · ${fmt(latest.created_at)}` : (de ? "noch keine Freigabe" : "no release yet")}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={de ? "Notiz (optional)" : "Note (optional)"}
            className="h-8 rounded border border-border bg-background px-2 text-xs w-44"
          />
          <button
            type="button"
            onClick={freigeben}
            disabled={saving || !tenantId || fehlend > 0}
            title={fehlend > 0
              ? (de ? `${fehlend} „nicht anwendbar"-Entscheidung(en) ohne Begründung — vor der Freigabe ergänzen (Filter „Begründung fehlt").`
                    : `${fehlend} "not applicable" decision(s) without justification — complete them before release (filter "Missing justification").`)
              : undefined}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 h-8 text-xs font-semibold disabled:opacity-50 hover:opacity-90"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            {de ? "Version freigeben" : "Release version"}
          </button>
        </div>
      </div>

      {open && versions.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-border pt-2">
          {versions.slice().reverse().map(v => (
            <div key={v.version} className="flex items-center justify-between gap-3 text-xs rounded-md px-2 py-1.5 hover:bg-accent/10">
              <span className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-foreground">v{v.version}</span>
                <span className="text-muted-foreground">{fmt(v.created_at)}</span>
                {v.approved_by && <span className="text-muted-foreground">· {v.approved_by}</span>}
                {v.note && <span className="truncate italic text-muted-foreground">„{v.note}"</span>}
              </span>
              <span className="text-muted-foreground shrink-0 tabular-nums">
                {v.stats.applicable}/{v.stats.total} {de ? "anwendbar" : "applicable"}
                {v.stats.missingJustification > 0 && <span className="st-teilweise-text"> · {v.stats.missingJustification} {de ? "o. Begr." : "no just."}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
