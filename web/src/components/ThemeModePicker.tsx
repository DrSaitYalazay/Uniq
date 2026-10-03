import { useEffect, useState } from "react";
import { Monitor, Moon, RotateCcw, Sun, Check, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_THEME_MODE,
  getStoredThemeMode,
  resetThemeMode,
  setStoredThemeMode,
  subscribeThemeMode,
  type ThemeMode,
} from "@/lib/themeMode";
import {
  DEFAULT_CHART_MODE,
  getChartPaletteMode,
  resetChartPaletteMode,
  setChartPaletteMode,
  subscribeChartPaletteMode,
  type ChartPaletteMode,
} from "@/lib/chartPalette";

interface Props {
  de: boolean;
}

const ThemeModePicker = ({ de }: Props) => {
  const [mode, setMode] = useState<ThemeMode>(() => getStoredThemeMode());
  useEffect(() => subscribeThemeMode((m) => setMode(m)), []);
  const [chart, setChart] = useState<ChartPaletteMode>(() => getChartPaletteMode());
  useEffect(() => subscribeChartPaletteMode((m) => setChart(m)), []);

  // „hybrid" ist entfallen (war inhaltsgleich mit „ampel"); gespeicherte Werte
  // werden in getChartPaletteMode() migriert.
  const chartOptions: { key: ChartPaletteMode; label: string; hint: string }[] = [
    { key: "ampel", label: de ? "Ampel (Standard)" : "RAG (default)",
      hint: de ? "Status grün/gelb/rot, Serien in Themenfarbe — gilt auch für Berichte"
               : "status green/amber/red, series in theme colour — reports included" },
    { key: "mono",  label: de ? "Themenfarbe" : "Theme colour",
      hint: de ? "ALLES in der Themenfarbe, auch der Status — Bildschirm und Bericht gleich"
               : "EVERYTHING in the theme colour, status included — screen and report alike" },
  ];

  const options: { key: ThemeMode; icon: typeof Sun; label: string; hint: string }[] = [
    { key: "light",  icon: Sun,     label: de ? "Hell" : "Light",    hint: de ? "Markenoptik (Standard)" : "Brand look (default)" },
    { key: "dark",   icon: Moon,    label: de ? "Dunkel" : "Dark",   hint: de ? "Navy-Fläche, Gold-Akzent" : "Navy surface, gold accent" },
    { key: "system", icon: Monitor, label: "System",                 hint: de ? "folgt der Betriebssystem-Einstellung" : "follows the OS setting" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Moon className="h-4 w-4 text-primary" />
          {de ? "Darstellung (Hell / Dunkel · Diagramme)" : "Appearance (light / dark · charts)"}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {de
            ? "Gilt für dieses Gerät und diesen Browser. Berichte und Exporte werden unabhängig davon immer in heller Optik erzeugt."
            : "Applies to this device and browser. Reports and exports are always rendered in the light look regardless of this setting."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {options.map(({ key, icon: Icon, label, hint }) => {
            const active = mode === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStoredThemeMode(key)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-colors ${
                  active
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-semibold flex items-center gap-1">
                  {label}{active && <Check className="h-3.5 w-3.5 text-accent" />}
                </span>
                <span className="text-[11px] leading-tight opacity-80">{hint}</span>
              </button>
            );
          })}
        </div>
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-sm font-semibold mb-1">
            <PieChart className="h-4 w-4 text-primary" />
            {de ? "Diagrammfarben" : "Chart colors"}
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {de
              ? "Gilt für alle Bildschirm-Diagramme; wirkt sofort. Berichte bleiben in Ampel-Optik."
              : "Applies to all on-screen charts instantly. Reports keep the RAG look."}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {chartOptions.map(({ key, label, hint }) => {
              const active = chart === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setChartPaletteMode(key)}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-colors ${
                    active
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="flex gap-1" aria-hidden>
                    {(key === "mono"
                      ? ["--ch-1", "--ch-2", "--ch-3", "--ch-grey"]
                      : ["--ch-ja", "--ch-teilweise", "--ch-nein", "--ch-1"]
                    ).map((v) => (
                      <span key={v} className="size-3 rounded-sm" style={{ background: `hsl(var(${v}))` }} />
                    ))}
                  </span>
                  <span className="text-sm font-semibold flex items-center gap-1">
                    {label}{active && <Check className="h-3.5 w-3.5 text-accent" />}
                  </span>
                  <span className="text-[11px] leading-tight opacity-80">{hint}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { resetThemeMode(); resetChartPaletteMode(); }}
            disabled={mode === DEFAULT_THEME_MODE && chart === DEFAULT_CHART_MODE}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {de ? "Auf Standard zurücksetzen" : "Reset to default"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeModePicker;
