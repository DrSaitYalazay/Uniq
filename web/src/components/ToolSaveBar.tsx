import { Save, RotateCcw, Cloud, CloudOff, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  onSave: () => void;
  onReset: () => void;
  loading: boolean;
  lastSaved: Date | null;
}

const ToolSaveBar = ({ onSave, onReset, loading, lastSaved }: Props) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const de = lang === "de";

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 rounded-xl bg-card border border-border shadow-sm">
      {user ? (
        <>
          <button
            onClick={onSave}
            disabled={loading}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Cloud className="h-3.5 w-3.5" />
            {loading ? "..." : de ? "Speichern" : "Save"}
          </button>
          {lastSaved && (
            <span className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {de ? "Gespeichert: " : "Saved: "}
              {lastSaved.toLocaleTimeString(de ? "de-DE" : "en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </>
      ) : (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CloudOff className="h-3.5 w-3.5" />
          {de ? "Anmelden, um Fortschritt zu speichern" : "Sign in to save progress"}
        </span>
      )}
      <div className="ml-auto">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-destructive/20 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {de ? "Zurücksetzen" : "Reset"}
        </button>
      </div>
    </div>
  );
};

export default ToolSaveBar;
