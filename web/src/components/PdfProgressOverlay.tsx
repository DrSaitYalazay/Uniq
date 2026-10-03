import { useSyncExternalStore } from "react";
import { pdfProgress } from "@/lib/pdfProgress";
import { useLanguage } from "@/contexts/LanguageContext";

function fmt(s: number) {
  if (s <= 0) return "0s";
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function PdfProgressOverlay() {
  const state = useSyncExternalStore(
    pdfProgress.subscribe,
    pdfProgress.getState,
    pdfProgress.getState,
  );
  const { lang } = useLanguage();
  const t = (de: string, en: string) => (lang === "de" ? de : en);

  if (!state.active) return null;

  const { done, total, phase, label, startedAt } = state;
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const elapsed = (Date.now() - startedAt) / 1000;
  const etaSec =
    phase === "finalize" || phase === "prepare" || done === 0 || done >= total
      ? 0
      : Math.max(1, Math.round((elapsed / done) * (total - done)));

  const phaseText =
    phase === "prepare"
      ? t("Bericht wird vorbereitet …", "Preparing report …")
      : phase === "finalize"
        ? t("Datei wird abgeschlossen …", "Finalizing file …")
        : t(`Seite ${done} von ${total} wird gerendert`, `Rendering page ${done} of ${total}`);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-6 w-[90%] max-w-md space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <div className="min-w-0">
            <h3 className="text-base font-bold text-card-foreground truncate">
              {label || "PDF"} – {t("wird erstellt …", "generating …")}
            </h3>
            <p className="text-xs text-muted-foreground">{phaseText}</p>
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{pct}%</span>
          <span>
            {phase === "finalize" || etaSec === 0
              ? t("Fast fertig …", "Almost done …")
              : t(`Ca. ${fmt(etaSec)} verbleibend`, `~${fmt(etaSec)} remaining`)}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground text-center">
          {t("Bitte schließen Sie diesen Tab nicht.", "Please do not close this tab.")}
        </p>
      </div>
    </div>
  );
}
