/**
 * IsoThemeGroups — Überblick nach der Gliederung von ISO/IEC 27001:2022:
 * Managementsystem (Kap. 4–10) und die vier Anhang-A-Themen. Jeder Bereich ist
 * zugeklappt eine Zeile mit Fortschritt; aufgeklappt zeigt er seine Themen.
 * Wird für alle Frameworks genutzt (Zuordnung: data/isoThemes.ts).
 */
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { ISO_THEMES, type IsoTheme } from "@/data/isoThemes";
import { CHART_STATUS } from "@/lib/chartPalette";

export interface ThemeTopic {
  label: string;
  /** Erfüllt (z. B. umgesetzt + ½ teilweise oder erledigte Aufgaben) */
  num: number;
  /** Bezugsgröße (anwendbare Kontrollen bzw. Aufgaben) */
  den: number;
  /** Anzeige „x/y" — standardmäßig gerundetes num/den */
  ratio?: string;
}

interface Props {
  de: boolean;
  topics: Map<IsoTheme, ThemeTopic[]>;
  title?: string;
  subtitle?: string;
}

const pctOf = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);
const colorOf = (pct: number, den: number) =>
  den === 0 ? CHART_STATUS.na : pct >= 75 ? CHART_STATUS.ja : pct >= 40 ? CHART_STATUS.teilweise : CHART_STATUS.nein;

function Bar({ pct, den, big }: { pct: number; den: number; big?: boolean }) {
  const c = colorOf(pct, den);
  return (
    <>
      <div className={`${big ? "w-32 sm:w-48 h-2.5" : "w-24 sm:w-36 h-2"} rounded-full bg-muted overflow-hidden shrink-0`}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${den > 0 ? Math.max(pct, 2) : 0}%`, background: c }} />
      </div>
      <div className="shrink-0 rounded-lg border px-2.5 py-1 text-right leading-tight min-w-[64px]"
           style={den === 0 ? undefined : { borderColor: `color-mix(in srgb, ${c} 45%, transparent)`, background: `color-mix(in srgb, ${c} 8%, transparent)`, color: c }}>
        <span className={`${big ? "text-base" : "text-sm"} font-bold tabular-nums`}>{den > 0 ? `${pct}%` : "—"}</span>
      </div>
    </>
  );
}

export function IsoThemeGroups({ de, topics, title, subtitle }: Props) {
  const [open, setOpen] = useState<Set<IsoTheme>>(() => new Set());
  const toggle = (c: IsoTheme) => setOpen(s => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; });

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-2 px-1 flex-wrap">
        <div className="text-base font-semibold text-foreground">
          {title ?? (de ? "Stand nach ISO-27001-Bereichen" : "Status by ISO 27001 area")}
        </div>
        <div className="text-xs text-muted-foreground">
          {subtitle ?? (de ? "Alle Frameworks in der Gliederung von ISO/IEC 27001 · zum Aufklappen tippen" : "All frameworks in the ISO/IEC 27001 structure · tap to expand")}
        </div>
      </div>
      {ISO_THEMES.map(t => {
        const list = topics.get(t.code) ?? [];
        if (list.length === 0) return null;
        const num = list.reduce((a, x) => a + x.num, 0);
        const den = list.reduce((a, x) => a + x.den, 0);
        const pct = pctOf(num, den);
        const isOpen = open.has(t.code);
        // ISO-Reihenfolge (A.5.1, A.5.2 … bzw. Kapitel 4–10); die Farbe zeigt die Lücken.
        const sorted = [...list].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
        return (
          <div key={t.code} className="rounded-xl border border-border bg-card overflow-hidden">
            <button type="button" onClick={() => toggle(t.code)} aria-expanded={isOpen}
                    className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-muted/40 transition-colors">
              <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
              <span className="shrink-0 rounded-md bg-primary/10 text-primary text-[11px] font-bold px-1.5 py-0.5 tabular-nums">{t.ref}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm md:text-base font-semibold text-foreground truncate">{de ? t.de : t.en}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {de ? `${list.length} Themen` : `${list.length} topics`}
                </span>
              </span>
              <Bar pct={pct} den={den} big />
            </button>
            {isOpen && (
              <div className="border-t border-border bg-muted/20 px-3 py-2 space-y-1">
                {sorted.map(x => {
                  const p = pctOf(x.num, x.den);
                  return (
                    <div key={x.label} className="flex items-center gap-3 pl-7 py-1.5">
                      <span className="flex-1 min-w-0 truncate text-sm text-foreground" title={x.label}>{x.label}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{x.ratio ?? `${Math.round(x.num)}/${x.den}`}</span>
                      <Bar pct={p} den={x.den} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
