import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "de" | "en";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Lang, string>> = {
  // Header
  "header.subtitle": { de: "Multi-Framework Compliance Governance", en: "Multi-Framework Compliance Governance" },
  
  // Landing
  "landing.title": { de: "NIS2 systematisch umsetzen & prüfen", en: "Systematically Implement & Assess NIS2" },
  "landing.subtitle": { de: "Setzen Sie die NIS2-Anforderungen um und bewerten Sie die Konformität Ihrer Organisation mit detailliertem Soll-Ist-Vergleich gemäß EU-Richtlinie 2022/2555.", en: "Implement NIS2 requirements and assess your organization's compliance with detailed target-actual comparison per EU Directive 2022/2555." },
  "landing.umsetzung": { de: "NIS2-Umsetzung", en: "NIS2 Implementation" },
  "landing.umsetzung.desc": { de: "Schritt-für-Schritt Anleitung zur NIS2-Umsetzung mit Sektorauswahl", en: "Step-by-step NIS2 implementation guide with sector selection" },
  "landing.konformitaet": { de: "Konformitätscheck", en: "Compliance Check" },
  "landing.konformitaet.desc": { de: "Reifegrad- und Konformitätsbewertung nach EU-Richtlinie 2022/2555", en: "Maturity and compliance assessment per EU Directive 2022/2555" },
  "landing.overview": { de: "Übersicht", en: "Overview" },
  "landing.overview.desc": { de: "Dashboard mit Statistiken und Reifegradbewertung", en: "Dashboard with statistics and maturity assessment" },
  "landing.resources": { de: "Ressourcen", en: "Resources" },
  "landing.resources.desc": { de: "NIS2-Richtlinie, BSI-Standards und Referenzmaterial", en: "NIS2 Directive, BSI standards and reference material" },
  
  // Stats
  "stats.total": { de: "Gesamt", en: "Total" },
  "stats.assessed": { de: "Bewertet", en: "Assessed" },
  "stats.implemented": { de: "Umgesetzt", en: "Implemented" },
  "stats.partial": { de: "Teilweise", en: "Partial" },
  "stats.open": { de: "Nicht umgesetzt", en: "Not implemented" },
  
  // Pie chart
  "pie.title": { de: "Konformitätsübersicht", en: "Compliance Overview" },
  "pie.controls": { de: "Kontrollpunkte", en: "Control Points" },
  "pie.of": { de: "von", en: "of" },
  "pie.assessed": { de: "bewertet", en: "assessed" },
  "pie.compliance": { de: "Konformität", en: "Compliance" },
  "pie.yes": { de: "Umgesetzt (Ja)", en: "Implemented (Yes)" },
  "pie.partial": { de: "Teilweise", en: "Partial" },
  "pie.no": { de: "Nicht umgesetzt (Nein)", en: "Not Implemented (No)" },
  "pie.na": { de: "Entbehrlich", en: "Not Applicable" },
  "pie.notrated": { de: "Nicht bewertet", en: "Not Assessed" },
  "pie.controls_label": { de: "Kontrollen", en: "Controls" },
  
  // Reifegrad
  "reifegrad.title": { de: "Reifegrad-Bewertung", en: "Maturity Assessment" },
  "reifegrad.subtitle": { de: "NIS2 Soll-Ist-Vergleich", en: "NIS2 Target-Actual Comparison" },
  "reifegrad.level": { de: "Level", en: "Level" },
  "reifegrad.score": { de: "Gesamtbewertung", en: "Overall Score" },
  "reifegrad.current": { de: "← Aktuell", en: "← Current" },
  "reifegrad.l1": { de: "Initial", en: "Initial" },
  "reifegrad.l2": { de: "Wiederholbar", en: "Repeatable" },
  "reifegrad.l3": { de: "Definiert", en: "Defined" },
  "reifegrad.l4": { de: "Gesteuert", en: "Managed" },
  "reifegrad.l5": { de: "Optimiert", en: "Optimized" },
  
  // Check page
  "check.title": { de: "Soll-Ist-Vergleich · Bausteine", en: "Target-Actual Comparison · Modules" },
  "check.subtitle": { de: "Bewerten Sie jeden Kontrollpunkt nach dem NIS2-Schema", en: "Assess each control point according to the NIS2 scheme" },
  "check.save": { de: "Speichern", en: "Save" },
  "check.export": { de: "Bericht", en: "Report" },
  "check.reset": { de: "Reset", en: "Reset" },
  "check.saved": { de: "Bewertung gespeichert", en: "Assessment saved" },
  "check.reset_confirm": { de: "Alle Bewertungen zurücksetzen? Dies kann nicht rückgängig gemacht werden.", en: "Reset all assessments? This cannot be undone." },
  "check.reset_done": { de: "Alle Bewertungen wurden zurückgesetzt", en: "All assessments have been reset" },
  "check.back": { de: "Zurück", en: "Back" },
  
  // Baustein
  "baustein.assessed": { de: "bewertet", en: "assessed" },
  "baustein.implemented": { de: "umgesetzt", en: "implemented" },
  "status.ja": { de: "Ja", en: "Yes" },
  "status.teilweise": { de: "Teilweise", en: "Partial" },
  "status.nein": { de: "Nein", en: "No" },
  "status.entbehrlich": { de: "Entbehrlich", en: "N/A" },

  // Comments
  "comment.teilweise_label": { de: "Begründung / Erläuterung (Teilweise)", en: "Justification / Explanation (Partial)" },
  "comment.entbehrlich_label": { de: "Begründung (Entbehrlich)", en: "Justification (N/A)" },
  "comment.teilweise_placeholder": { de: "Erläutern Sie, welche Teile bereits umgesetzt sind und was noch fehlt…", en: "Explain which parts are already implemented and what is still missing…" },
  "comment.entbehrlich_placeholder": { de: "Begründen Sie, warum diese Kontrolle für Ihre Organisation nicht anwendbar ist…", en: "Explain why this control is not applicable to your organization…" },
  
  // Report
  "report.title": { de: "Bericht exportieren", en: "Export Report" },
  "report.executive": { de: "Zusammenfassung (PDF)", en: "Executive Summary (PDF)" },
  "report.detailed_pdf": { de: "Detaillierter Bericht (PDF)", en: "Detailed Report (PDF)" },
  "report.detailed_word": { de: "Detaillierter Bericht (Word)", en: "Detailed Report (Word)" },
  "report.exported": { de: "Bericht exportiert", en: "Report exported" },
  
  // Footer
  "footer.text": { de: "UniqSuite · NIS2 Umsetzung & Konformitätsprüfung · Basierend auf EU-Richtlinie 2022/2555", en: "UniqSuite · NIS2 Implementation & Compliance Assessment · Based on EU Directive 2022/2555" },
  
  // Auth
  "auth.welcome_back": { de: "Willkommen zurück", en: "Welcome back" },
  "auth.welcome_desc": { de: "Melden Sie sich an, um auf Ihr NIS2-Dashboard zuzugreifen.", en: "Sign in to access your NIS2 dashboard." },
  "auth.welcome_new": { de: "Konto erstellen", en: "Create account" },
  "auth.welcome_new_desc": { de: "Registrieren Sie sich für Ihre NIS2-Konformitätsprüfung.", en: "Register for your NIS2 compliance assessment." },
  "auth.or_email": { de: "Mit E-Mail", en: "With Email" },
  "auth.login": { de: "Anmeldung", en: "Sign In" },
  "auth.register": { de: "Registrieren", en: "Register" },
  "auth.email": { de: "E-Mail-Adresse", en: "Email Address" },
  "auth.password": { de: "Passwort", en: "Password" },
  "auth.password_confirm": { de: "Passwort bestätigen", en: "Confirm Password" },
  "auth.login_btn": { de: "Anmelden", en: "Sign In" },
  "auth.register_btn": { de: "Registrieren", en: "Sign Up" },
  "auth.google": { de: "Mit Google anmelden", en: "Sign in with Google" },
  "auth.apple": { de: "Mit Apple anmelden", en: "Sign in with Apple" },
  "auth.microsoft": { de: "Mit Microsoft anmelden", en: "Sign in with Microsoft" },
  "auth.or": { de: "oder", en: "or" },
  "auth.no_account": { de: "Noch kein Konto?", en: "Don't have an account?" },
  "auth.has_account": { de: "Bereits ein Konto?", en: "Already have an account?" },
  "auth.mfa": { de: "Multi-Faktor-Authentifizierung (MFA)", en: "Multi-Factor Authentication (MFA)" },
  "auth.mfa_desc": { de: "Zusätzliche Sicherheit für Ihr Konto – demnächst verfügbar", en: "Additional security for your account – coming soon" },
  "auth.forgot": { de: "Passwort vergessen?", en: "Forgot password?" },
  
  // Resources
  "resources.title": { de: "NIS2-Ressourcen & Referenzmaterial", en: "NIS2 Resources & Reference Material" },
  "resources.back": { de: "Zurück zur Startseite", en: "Back to Home" },
  "resources.nis2.title": { de: "EU NIS2-Richtlinie (2022/2555)", en: "EU NIS2 Directive (2022/2555)" },
  "resources.nis2.desc": { de: "Die vollständige NIS2-Richtlinie des Europäischen Parlaments und des Rates über Maßnahmen für ein hohes gemeinsames Cybersicherheitsniveau.", en: "The complete NIS2 Directive of the European Parliament and Council on measures for a high common level of cybersecurity." },
  "resources.bsi.title": { de: "BSI IT-Grundschutz-Kompendium", en: "BSI IT-Grundschutz Compendium" },
  "resources.bsi.desc": { de: "Das BSI IT-Grundschutz-Kompendium bietet eine umfassende Sammlung von Sicherheitsmaßnahmen und -empfehlungen.", en: "The BSI IT-Grundschutz Compendium provides a comprehensive collection of security measures and recommendations." },
  "resources.cis.title": { de: "CIS Controls v8", en: "CIS Controls v8" },
  "resources.cis.desc": { de: "Die CIS Controls bieten priorisierte Sicherheitsmaßnahmen, die als Referenz für die NIS2-Kontrollen dienen.", en: "CIS Controls provide prioritized security measures serving as reference for NIS2 controls." },
  "resources.impl.title": { de: "NIS2 Umsetzungsgesetz (", en: "NIS2 Implementation Act (" },
  "resources.impl.desc": { de: "Das deutsche Umsetzungsgesetz zur NIS2-Richtlinie mit spezifischen Anforderungen für in Deutschland tätige Einrichtungen.", en: "The German implementation act for the NIS2 Directive with specific requirements for entities operating in Germany." },
  "resources.link": { de: "Dokument öffnen", en: "Open Document" },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_KEY = "nis2-lang";

const getInitialLang = (): Lang => {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "de" || stored === "en") return stored;
  } catch {}
  const browserLang = navigator.language || (navigator as any).userLanguage || "de";
  return browserLang.startsWith("en") ? "en" : "de";
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    try { localStorage.setItem(LANG_KEY, newLang); } catch {}
  };

  const t = (key: string): string => {
    return translations[key]?.[lang] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
