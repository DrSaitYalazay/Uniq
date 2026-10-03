import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { isDarkActive, subscribeThemeMode, toggleThemeMode } from "@/lib/themeMode";

/** Header-Schnellumschalter hell ⇄ dunkel (Feineinstellung inkl. „System" in
 *  Scope & Kontext → Darstellung). */
const ThemeToggle = () => {
  const { lang } = useLanguage();
  const [dark, setDark] = useState<boolean>(() => isDarkActive());

  useEffect(() => subscribeThemeMode((_m, d) => setDark(d)), []);

  const title = dark
    ? (lang === "de" ? "Heller Modus" : "Light mode")
    : (lang === "de" ? "Dunkler Modus" : "Dark mode");

  return (
    <button
      type="button"
      onClick={toggleThemeMode}
      className="flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-accent hover:text-accent-foreground shadow-sm transition-colors"
      title={title}
      aria-label={title}
      aria-pressed={dark}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};

export default ThemeToggle;
