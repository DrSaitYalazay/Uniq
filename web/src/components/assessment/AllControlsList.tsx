/**
 * AllControlsList — Detailansicht im Tab „Alle" der Gap-Analyse.
 *
 * Eine Liste über ALLE aktivierten Frameworks: je Zeile Framework, Anforderung,
 * MUSS-Kennzeichen und effektiver Status. Filter (Status, Framework, Suche);
 * ein Klick öffnet die Anforderung im Tab des jeweiligen Frameworks, wo sie
 * bewertet wird. Nur Anzeige — bewertet wird weiterhin im Framework-Tab, damit
 * es genau EINEN Ort pro Antwort gibt.
 */
import { useMemo, useState, useEffect } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { isoEntry, isIsoClause } from "@/data/isoAnnexMap";
import type { ControlRow, EffectiveAnswer } from "@/lib/assessmentEngine";

interface FrameworkPayload {
  framework: string;
  shortLabel: string;
  controls: ControlRow[];
  effective: Map<string, EffectiveAnswer>;
}

interface Props {
  frameworks: FrameworkPayload[];
  de: boolean;
  onOpenControl: (framework: string, controlId: string) => void;
}

type StatusKey = "all" | "open" | "unanswered" | "nein" | "teilweise" | "ja" | "na" | "must";

const PAGE = 50;

function isMust(c: ControlRow): boolean {
  if (c.muss === "true" || (c.muss as unknown) === true || c.muss === "MUSS") return true;
  if (c.muss === "false") return false;
  return c.framework === "ISO27001" && isIsoClause(c.id);
}

function titleOf(c: ControlRow, de: boolean): { ref: string; title: string } {
  if (c.framework === "ISO27001") {
    const a = isoEntry(c.id);
    if (a) return { ref: a.ref, title: de ? a.titleDe : a.titleEn };
  }
  const raw = (de ? (c.req_de ?? c.req_en) : (c.req_en ?? c.req_de)) ?? "";
  const first = raw.split("\n")[0].trim();
  return { ref: c.id, title: first.length > 180 ? `${first.slice(0, 177)}…` : first };
}

export function AllControlsList({ frameworks, de, onOpenControl }: Props) {
  const [status, setStatus] = useState<StatusKey>("all");
  const [fw, setFw] = useState<string>("__all__");
  const [search, setSearch] = useState("");
  const [shown, setShown] = useState(PAGE);

  const rows = useMemo(() => {
    const out: Array<{ key: string; framework: string; fwLabel: string; control: ControlRow; st: string | null; must: boolean; ref: string; title: string }> = [];
    for (const f of frameworks) {
      const sorted = [...f.controls].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
      for (const c of sorted) {
        const t = titleOf(c, de);
        out.push({
          key: `${f.framework}::${c.id}`,
          framework: f.framework,
          fwLabel: f.shortLabel || f.framework,
          control: c,
          st: f.effective.get(c.id)?.status ?? null,
          must: isMust(c),
          ref: t.ref,
          title: t.title,
        });
      }
    }
    return out;
  }, [frameworks, de]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (fw !== "__all__" && r.framework !== fw) return false;
      switch (status) {
        case "open": if (!(r.st === "nein" || r.st === "teilweise" || r.st === null)) return false; break;
        case "unanswered": if (r.st !== null) return false; break;
        case "nein": case "teilweise": case "ja": case "na": if (r.st !== status) return false; break;
        case "must": if (!r.must) return false; break;
      }
      if (q) {
        const hay = `${r.fwLabel} ${r.control.id} ${r.ref} ${r.title} ${r.control.req_de ?? ""} ${r.control.req_en ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, fw, status, search]);

  useEffect(() => { setShown(PAGE); }, [fw, status, search]);

  const chips: Array<{ v: StatusKey; de: string; en: string }> = [
    { v: "all", de: "Alle", en: "All" },
    { v: "open", de: "Offen (Lücken + teilweise + unbeantwortet)", en: "Open (gaps + partial + unanswered)" },
    { v: "nein", de: "Nicht umgesetzt", en: "Not implemented" },
    { v: "teilweise", de: "Teilweise", en: "Partial" },
    { v: "unanswered", de: "Unbeantwortet", en: "Unanswered" },
    { v: "ja", de: "Umgesetzt", en: "Implemented" },
    { v: "na", de: "N.a.", en: "N/A" },
    { v: "must", de: "Nur MUSS", en: "MUST only" },
  ];

  const statusView = (s: string | null) => {
    switch (s) {
      case "ja": return { label: de ? "Umgesetzt" : "Implemented", cls: "st-ja-text st-ja-tint" };
      case "teilweise": return { label: de ? "Teilweise" : "Partial", cls: "st-teilweise-text st-teilweise-tint" };
      case "nein": return { label: de ? "Nicht umgesetzt" : "Not implemented", cls: "st-nein-text st-nein-tint" };
      case "na": return { label: "N.a.", cls: "bg-muted text-muted-foreground" };
      default: return { label: de ? "Unbeantwortet" : "Unanswered", cls: "bg-muted/60 text-muted-foreground" };
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 card-elevated space-y-3">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {de ? "Alle Anforderungen im Detail" : "All requirements in detail"}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {de
              ? "Über alle Frameworks im Scope. Klick auf eine Zeile öffnet die Anforderung im Framework-Tab, dort wird sie bewertet."
              : "Across all frameworks in scope. Click a row to open the requirement in its framework tab, where it is assessed."}
          </p>
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {filtered.length} {de ? "von" : "of"} {rows.length}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={de ? "Suchen (Nr., Titel, Text) …" : "Search (no., title, text) …"}
            className="h-8 pl-8 text-xs"
            aria-label={de ? "Anforderungen durchsuchen" : "Search requirements"}
          />
        </div>
        <select
          value={fw}
          onChange={e => setFw(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          aria-label={de ? "Framework filtern" : "Filter framework"}
        >
          <option value="__all__">{de ? "Alle Frameworks" : "All frameworks"}</option>
          {frameworks.map(f => (
            <option key={f.framework} value={f.framework}>{f.shortLabel || f.framework}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label={de ? "Status filtern" : "Filter status"}>
        {chips.map(c => (
          <button
            key={c.v}
            type="button"
            onClick={() => setStatus(c.v)}
            aria-pressed={status === c.v}
            className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors ${
              status === c.v ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-muted/60"
            }`}
          >
            {de ? c.de : c.en}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-xs text-muted-foreground py-6 text-center">
          {de ? "Keine Anforderungen für diese Auswahl." : "No requirements for this selection."}
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {filtered.slice(0, shown).map(r => {
            const sv = statusView(r.st);
            return (
              <li key={r.key}>
                <button
                  type="button"
                  onClick={() => onOpenControl(r.framework, r.control.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/40 transition-colors"
                  title={de ? "Im Framework-Tab öffnen" : "Open in framework tab"}
                >
                  <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0 w-20 justify-center">{r.fwLabel}</Badge>
                  <span className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-foreground tabular-nums mr-1.5">{r.ref}</span>
                    <span className="text-xs text-foreground/90">{r.title}</span>
                  </span>
                  {r.must && (
                    <span className="text-[10px] font-semibold st-nein-text shrink-0">{de ? "MUSS" : "MUST"}</span>
                  )}
                  <span className={`text-[10.5px] font-medium rounded px-1.5 py-0.5 shrink-0 ${sv.cls}`}>{sv.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {filtered.length > shown && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShown(n => n + PAGE)}
            className="text-xs text-accent hover:underline"
          >
            {de
              ? `Weitere ${Math.min(PAGE, filtered.length - shown)} anzeigen (${filtered.length - shown} verbleibend)`
              : `Show ${Math.min(PAGE, filtered.length - shown)} more (${filtered.length - shown} left)`}
          </button>
        </div>
      )}
    </div>
  );
}
