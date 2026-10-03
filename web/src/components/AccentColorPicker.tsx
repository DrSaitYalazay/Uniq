import { useEffect, useState } from "react";
import { Palette, RotateCcw, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ACCENT_PRESETS,
  DEFAULT_ACCENT,
  getStoredAccent,
  hexToHsl,
  hslToHex,
  resetAccent,
  setStoredAccent,
  subscribeAccent,
  type AccentHSL,
} from "@/lib/accentTheme";

interface Props {
  de: boolean;
}

const same = (a: AccentHSL, b: AccentHSL) =>
  a.h === b.h && a.s === b.s && a.l === b.l;

const AccentColorPicker = ({ de }: Props) => {
  const [accent, setAccent] = useState<AccentHSL>(() => getStoredAccent());
  const [draft, setDraft] = useState<string>(() => hslToHex(getStoredAccent()).toUpperCase());

  useEffect(() => subscribeAccent((hsl) => {
    setAccent(hsl);
    setDraft(hslToHex(hsl).toUpperCase());
  }), []);

  const hex = hslToHex(accent);
  const isDefault = same(accent, DEFAULT_ACCENT);
  const draftHsl = hexToHsl(draft);
  const draftValid = draftHsl !== null;
  const draftDirty = draftValid && hslToHex(draftHsl!).toUpperCase() !== hex.toUpperCase();

  const commitDraft = () => {
    if (draftHsl) setStoredAccent(draftHsl);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          {de ? "Akzentfarbe" : "Accent color"}
          <span
            className="ml-auto inline-block size-5 rounded-full border border-border shadow-sm"
            style={{ background: hex }}
            aria-hidden
          />
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {de
            ? "Wählen Sie die Akzentfarbe der Oberfläche. Navy und neutrale Flächen bleiben unverändert — nur die Highlight-/Verlaufsfarbe wird ersetzt (Sidebar-Rahmen, Buttons, Chart-Akzente, Marken-Verlauf)."
            : "Pick the interface accent. Navy and neutral surfaces stay locked — only the highlight/gradient color changes (sidebar frame, buttons, chart accents, brand gradient)."}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Presets */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {de ? "Voreinstellungen" : "Presets"}
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
            {ACCENT_PRESETS.map((p) => {
              const active = same(p.hsl, accent);
              const hexP = hslToHex(p.hsl).toUpperCase();
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setStoredAccent(p.hsl)}
                  title={`${p.label} — ${hexP}`}
                  aria-label={`${p.label} ${hexP}`}
                  className={`group relative aspect-square rounded-md border transition-all ${
                    active
                      ? "border-foreground ring-2 ring-foreground/20 scale-105"
                      : "border-border hover:scale-105"
                  }`}
                  style={{ background: hexP }}
                >
                  <span
                    className="pointer-events-none absolute left-1/2 -top-8 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] font-mono font-semibold text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100 z-10"
                  >
                    {hexP}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom picker */}
        <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-border">
          <div className="flex-1 min-w-[260px]">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              {de ? "Eigene Farbe (Hex-Code)" : "Custom color (hex code)"}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={hex}
                onChange={(e) => {
                  const hsl = hexToHsl(e.target.value);
                  if (hsl) setStoredAccent(hsl);
                }}
                className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent p-1"
                aria-label={de ? "Farbwähler" : "Color picker"}
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground pointer-events-none">
                  #
                </span>
                <input
                  type="text"
                  value={draft.replace(/^#/, "")}
                  onChange={(e) => setDraft("#" + e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); commitDraft(); }
                    if (e.key === "Escape") setDraft(hex.toUpperCase());
                  }}
                  onBlur={commitDraft}
                  placeholder="RRGGBB"
                  spellCheck={false}
                  maxLength={6}
                  className={`h-10 w-32 rounded border bg-background pl-7 pr-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    draft && !draftValid ? "border-destructive" : "border-border"
                  }`}
                  aria-invalid={draft ? !draftValid : undefined}
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={commitDraft}
                disabled={!draftValid || !draftDirty}
                className="h-10"
              >
                <Check className="h-3.5 w-3.5 mr-1.5" />
                {de ? "Übernehmen" : "Apply"}
              </Button>
            </div>
            <p className={`text-[11px] mt-1 ${draft && !draftValid ? "text-destructive" : "text-muted-foreground"}`}>
              {draft && !draftValid
                ? (de ? "Ungültiger Hex-Code (z.B. #1E88E5 oder #1AE)" : "Invalid hex code (e.g. #1E88E5 or #1AE)")
                : (de ? "3- oder 6-stelligen Hex-Code eingeben und Enter drücken." : "Enter a 3- or 6-digit hex code and press Enter.")}
            </p>
          </div>


          {/* Live preview */}
          <div className="flex items-center gap-2">
            <div
              className="h-10 px-4 rounded-md flex items-center text-sm font-semibold text-white shadow-sm"
              style={{
                background: `linear-gradient(135deg, hsl(${(accent.h + 15) % 360} ${Math.min(100, accent.s + 10)}% ${Math.min(100, accent.l + 5)}%), hsl(${accent.h} ${accent.s}% ${accent.l}%))`, /* = applyAccent: helles Gold → Akzent */
              }}
            >
              {de ? "Vorschau" : "Preview"}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDefault}
            onClick={() => resetAccent()}
            className="ml-auto"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            {de ? "Zurücksetzen" : "Reset"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccentColorPicker;
