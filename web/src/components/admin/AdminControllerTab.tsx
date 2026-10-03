/**
 * Admin — Controller (Framework catalogue viewer).
 *
 * Read-only listing of every framework catalogue registered under
 * `src/data/frameworks/` plus the ISO-anchored mapping rows. Lets the
 * admin browse ISO 27001 (345 controls) and NIS2 (236 questions) side by
 * side and inspect which ISO nodes each NIS2 question resolves to.
 */
import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ISO27001_CATALOG, ISO27001_BY_ID } from "@/data/frameworks/iso27001";
import { NIS2_CATALOG } from "@/data/frameworks/nis2";
import { NIS2_TO_ISO } from "@/data/frameworkMappings/nis2-to-iso";
import type { FrameworkCatalog, ControlDef } from "@/data/frameworks/types";
import { BookOpen, ChevronDown, ChevronRight, Search, Link2, Download } from "lucide-react";
import ExcelJS from "exceljs";
import { NIS2_BY_ID } from "@/data/frameworks/nis2";

type Tab = "iso27001" | "nis2";

const FRAMEWORKS: Record<Tab, FrameworkCatalog> = {
  iso27001: ISO27001_CATALOG,
  nis2: NIS2_CATALOG,
};

const nis2MapBySource = new Map(NIS2_TO_ISO.map((r) => [r.sourceControlId, r]));
const nis2MapByIsoId = (() => {
  const m = new Map<string, string[]>();
  for (const row of NIS2_TO_ISO) {
    for (const iso of row.isoControlIds) {
      const arr = m.get(iso) ?? [];
      arr.push(row.sourceControlId);
      m.set(iso, arr);
    }
  }
  return m;
})();

async function exportMappingXlsx(de: boolean) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "UniqSuite";
  wb.created = new Date();

  const HDR_FILL: ExcelJS.FillPattern = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A8A" },
  };
  const HDR_FONT: Partial<ExcelJS.Font> = {
    bold: true,
    color: { argb: "FFFFFFFF" },
    name: "Arial",
    size: 11,
  };

  const style = (ws: ExcelJS.Worksheet, widths: number[]) => {
    widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));
    const hdr = ws.getRow(1);
    hdr.height = 22;
    hdr.eachCell((c) => {
      c.fill = HDR_FILL;
      c.font = HDR_FONT;
      c.alignment = { vertical: "middle", horizontal: "left" };
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: widths.length } };
  };

  // Sheet 1 — ISO 27001 master
  const isoSheet = wb.addWorksheet(de ? "ISO 27001 (Master)" : "ISO 27001 (Master)");
  isoSheet.addRow([
    "ISO ID",
    de ? "Thema" : "Theme",
    de ? "Titel (DE)" : "Title (DE)",
    de ? "Titel (EN)" : "Title (EN)",
    de ? "Referenz" : "Reference",
    de ? "Verknüpfte NIS2-IDs" : "Linked NIS2 IDs",
  ]);
  for (const c of ISO27001_CATALOG.controls) {
    const nis2 = nis2MapByIsoId.get(c.id) ?? [];
    isoSheet.addRow([c.id, c.theme, c.titleDe, c.titleEn, c.reference ?? "", nis2.join(", ")]);
  }
  style(isoSheet, [12, 32, 60, 60, 18, 40]);

  // Sheet 2 — NIS2 catalogue with ISO targets
  const nis2Sheet = wb.addWorksheet("NIS2");
  nis2Sheet.addRow([
    "NIS2 ID",
    de ? "Kategorie" : "Category",
    de ? "Frage (DE)" : "Question (DE)",
    de ? "Frage (EN)" : "Question (EN)",
    de ? "Referenz" : "Reference",
    de ? "ISO-Ziele" : "ISO targets",
    de ? "Mapping-Typ" : "Mapping type",
  ]);
  for (const c of NIS2_CATALOG.controls) {
    const row = nis2MapBySource.get(c.id);
    nis2Sheet.addRow([
      c.id,
      c.theme,
      c.titleDe,
      c.titleEn,
      c.reference ?? "",
      row?.isoControlIds.join(", ") ?? "",
      row?.type ?? "",
    ]);
  }
  style(nis2Sheet, [12, 32, 60, 60, 18, 40, 14]);

  // Sheet 3 — Mapping matrix (one row per NIS2 → ISO pair)
  const mapSheet = wb.addWorksheet(de ? "Mapping-Matrix" : "Mapping matrix");
  mapSheet.addRow([
    "NIS2 ID",
    de ? "NIS2 Frage" : "NIS2 question",
    "ISO ID",
    de ? "ISO Kontrolle" : "ISO control",
    de ? "Typ" : "Type",
    de ? "Begründung" : "Rationale",
  ]);
  for (const row of NIS2_TO_ISO) {
    const src = NIS2_BY_ID[row.sourceControlId];
    const srcTitle = src ? (de ? src.titleDe : src.titleEn) : "";
    for (const isoId of row.isoControlIds) {
      const iso = ISO27001_BY_ID[isoId];
      const isoTitle = iso ? (de ? iso.titleDe : iso.titleEn) : "";
      mapSheet.addRow([
        row.sourceControlId,
        srcTitle,
        isoId,
        isoTitle,
        row.type,
        de ? row.rationaleDe : row.rationaleEn,
      ]);
    }
  }
  style(mapSheet, [12, 60, 12, 60, 14, 70]);

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `uniqsuite-control-mapping-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminControllerTab() {
  const { lang } = useLanguage();
  const de = lang === "de";
  const [tab, setTab] = useState<Tab>("iso27001");
  const [query, setQuery] = useState("");
  const [openTheme, setOpenTheme] = useState<Record<string, boolean>>({});

  const catalog = FRAMEWORKS[tab];

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? catalog.controls.filter(
          (c) =>
            c.id.toLowerCase().includes(q) ||
            c.titleDe.toLowerCase().includes(q) ||
            c.titleEn.toLowerCase().includes(q) ||
            (c.reference ?? "").toLowerCase().includes(q),
        )
      : catalog.controls;

    const byTheme = new Map<string, ControlDef[]>();
    for (const c of filtered) {
      const key = c.theme || "—";
      const arr = byTheme.get(key) ?? [];
      arr.push(c);
      byTheme.set(key, arr);
    }
    return Array.from(byTheme.entries());
  }, [catalog, query]);

  const totalCount = catalog.controls.length;
  const filteredCount = grouped.reduce((s, [, arr]) => s + arr.length, 0);
  const mappedCount =
    tab === "nis2"
      ? catalog.controls.filter((c) => nis2MapBySource.has(c.id)).length
      : catalog.controls.filter((c) => nis2MapByIsoId.has(c.id)).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {de ? "Maßnahmen — Kontrollkataloge" : "Controls — Control catalogues"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {de
            ? "Alle registrierten Frameworks (schreibgeschützt). ISO 27001 ist Master; NIS2 wird über die Mapping-Tabelle darauf projiziert."
            : "All registered frameworks (read-only). ISO 27001 is master; NIS2 is projected onto it via the mapping table."}
        </p>
      </div>

      {/* framework tabs */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(FRAMEWORKS) as Tab[]).map((k) => {
          const active = tab === k;
          const label = de ? FRAMEWORKS[k].labelDe : FRAMEWORKS[k].labelEn;
          return (
            <button
              key={k}
              onClick={() => {
                setTab(k);
                setOpenTheme({});
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                active
                  ? "eu-gradient text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {label} · {FRAMEWORKS[k].controls.length}
            </button>
          );
        })}
      </div>

      {/* toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={de ? "ID, Titel oder Referenz suchen…" : "Search ID, title or reference…"}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredCount}</span> / {totalCount}{" "}
          {de ? "angezeigt" : "shown"}
          {" · "}
          <span className="font-semibold text-foreground">{mappedCount}</span>{" "}
          {de ? "verknüpft" : "mapped"}
        </div>
        <button
          onClick={() => exportMappingXlsx(de)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold eu-gradient text-primary-foreground hover:opacity-90"
        >
          <Download className="h-3.5 w-3.5" />
          {de ? "Mapping als Excel" : "Mapping as Excel"}
        </button>
      </div>

      {/* groups */}
      <div className="space-y-2">
        {grouped.map(([theme, list]) => {
          const open = openTheme[theme] ?? Boolean(query);
          return (
            <div key={theme} className="rounded-2xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setOpenTheme((s) => ({ ...s, [theme]: !open }))}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
              >
                {open ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-semibold text-foreground flex-1">{theme}</span>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {list.length}
                </span>
              </button>

              {open && (
                <div className="divide-y divide-border">
                  {list.map((c) => {
                    const isoLinks =
                      tab === "nis2"
                        ? nis2MapBySource.get(c.id)?.isoControlIds ?? []
                        : nis2MapByIsoId.get(c.id) ?? [];
                    const mapType =
                      tab === "nis2" ? nis2MapBySource.get(c.id)?.type : undefined;
                    return (
                      <div key={c.id} className="px-4 py-3">
                        <div className="flex items-start gap-3 flex-wrap">
                          <span className="text-[11px] font-mono font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                            {c.id}
                          </span>
                          <div className="flex-1 min-w-[220px]">
                            <p className="text-sm font-medium text-foreground">
                              {de ? c.titleDe : c.titleEn}
                            </p>
                            {c.reference && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {c.reference}
                              </p>
                            )}
                          </div>
                        </div>

                        {isoLinks.length > 0 && (
                          <div className="mt-2 flex items-start gap-2 flex-wrap">
                            <Link2 className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            <div className="flex-1 flex flex-wrap gap-1">
                              {mapType && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-secondary/20 text-foreground uppercase tracking-wide">
                                  {mapType}
                                </span>
                              )}
                              {isoLinks.map((id) => {
                                const target =
                                  tab === "nis2" ? ISO27001_BY_ID[id]?.titleDe : id;
                                return (
                                  <span
                                    key={id}
                                    title={target ?? id}
                                    className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded"
                                  >
                                    {id}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {grouped.length === 0 && (
          <p className="text-sm text-muted-foreground italic text-center py-8">
            {de ? "Keine Treffer." : "No matches."}
          </p>
        )}
      </div>
    </div>
  );
}
