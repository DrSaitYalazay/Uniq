/**
 * useAssessmentMode — Umschalter „Einfacher Modus" (Bausteinebene) ↔
 * „Expertenmodus" (Kontrollebene). Bewusst PRO NUTZER/GERÄT (localStorage):
 * Geschäftsführung bewertet gern grob je Baustein, der ISB fein je Anforderung —
 * im selben Mandanten. Kein org-weites Erzwingen. Default = "expert" (heutiges
 * Verhalten, keine Verhaltensänderung ohne Nutzeraktion).
 */
import { useCallback, useEffect, useState } from "react";

export type AssessmentMode = "simple" | "expert";
const LS_KEY = "cws-assessment-mode";

function read(): AssessmentMode {
  try {
    // UniqSuite: Standard ist der Überblick; Detail nur nach bewusster Wahl.
    return localStorage.getItem(LS_KEY) === "expert" ? "expert" : "simple";
  } catch {
    return "simple";
  }
}

const EVT = "cws-assessment-mode-change";

export function useAssessmentMode(): { mode: AssessmentMode; setMode: (m: AssessmentMode) => void; toggle: () => void } {
  const [mode, setModeState] = useState<AssessmentMode>(() => read());

  // Synchron halten: über Tabs (storage) UND im selben Tab zwischen ALLEN
  // Komponenten, die den Hook nutzen (custom event) — sonst reagiert z. B. der
  // Umschalter, aber die gategete Seite nicht.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === LS_KEY) setModeState(read()); };
    const onLocal = () => setModeState(read());
    window.addEventListener("storage", onStorage);
    window.addEventListener(EVT, onLocal as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVT, onLocal as EventListener);
    };
  }, []);

  const setMode = useCallback((m: AssessmentMode) => {
    setModeState(m);
    try { localStorage.setItem(LS_KEY, m); } catch { /* ignore */ }
    try { window.dispatchEvent(new Event(EVT)); } catch { /* ignore */ }
  }, []);

  const toggle = useCallback(() => setMode(read() === "simple" ? "expert" : "simple"), [setMode]);

  return { mode, setMode, toggle };
}
