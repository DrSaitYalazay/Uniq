import { useNavigate } from "react-router-dom";
import { ArrowLeft, Cookie, Shield, Settings, BarChart3 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const CookieEinstellungen = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const de = lang === "de";

  const [functional, setFunctional] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (consent) {
      try {
        const parsed = JSON.parse(consent);
        setFunctional(parsed.functional ?? false);
        setAnalytics(parsed.analytics ?? false);
      } catch {}
    }
  }, []);

  const savePreferences = () => {
    const consent = { necessary: true, functional, analytics, timestamp: new Date().toISOString() };
    localStorage.setItem("cookie-consent", JSON.stringify(consent));
    toast({
      title: de ? "Einstellungen gespeichert" : "Settings saved",
      description: de ? "Ihre Cookie-Einstellungen wurden aktualisiert." : "Your cookie preferences have been updated.",
    });
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> {de ? "Zurück" : "Back"}
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Cookie className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">Cookie-Einstellungen</h1>
            <p className="text-sm text-muted-foreground">
              {de ? "Verwalten Sie Ihre Cookie-Präferenzen" : "Manage your cookie preferences"}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border card-elevated p-6 sm:p-8 space-y-6 text-sm text-foreground leading-relaxed">

          <p>{de
            ? "Diese Website verwendet Cookies und ähnliche Technologien, um bestimmte Funktionen bereitzustellen, die Nutzung der Website zu analysieren und unsere Inhalte zu verbessern."
            : "This website uses cookies and similar technologies to provide certain features, analyze website usage, and improve our content."}</p>
          <p>{de
            ? "Ein Cookie ist eine kleine Textdatei, die auf Ihrem Endgerät gespeichert wird und bestimmte Informationen enthält."
            : "A cookie is a small text file stored on your device that contains certain information."}</p>
          <p>{de
            ? "Sie können Ihre Cookie-Einstellungen jederzeit ändern oder widerrufen."
            : "You can change or revoke your cookie settings at any time."}</p>

          <div className="border-t border-border" />

          {/* 1. Technisch notwendige */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-heading flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {de ? "1. Technisch notwendige Cookies" : "1. Strictly Necessary Cookies"}
              </h2>
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {de ? "Immer aktiv" : "Always active"}
              </span>
            </div>
            <p>{de
              ? "Diese Cookies sind erforderlich, damit die Website korrekt funktioniert. Sie ermöglichen grundlegende Funktionen wie Seitenaufrufe, Sicherheit oder Formularübertragungen."
              : "These cookies are required for the website to function correctly. They enable basic functions such as page views, security, or form submissions."}</p>
            <p className="text-muted-foreground">{de
              ? "Die Website kann ohne diese Cookies nicht ordnungsgemäß funktionieren."
              : "The website cannot function properly without these cookies."}</p>
            <p className="text-xs text-muted-foreground">{de ? "Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO." : "Legal basis: Art. 6(1)(f) GDPR."}</p>
          </section>

          <div className="border-t border-border" />

          {/* 2. Funktionale */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-heading flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                {de ? "2. Funktionale Cookies" : "2. Functional Cookies"}
              </h2>
              <Switch checked={functional} onCheckedChange={setFunctional} />
            </div>
            <p>{de
              ? "Diese Cookies ermöglichen zusätzliche Funktionen und verbessern die Benutzererfahrung, zum Beispiel durch das Speichern von Einstellungen oder Präferenzen."
              : "These cookies enable additional features and improve the user experience, for example by saving settings or preferences."}</p>
            <p className="text-xs text-muted-foreground">{de ? "Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)." : "Legal basis: Art. 6(1)(a) GDPR (consent)."}</p>
          </section>

          <div className="border-t border-border" />

          {/* 3. Analyse */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-heading flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {de ? "3. Analyse-Cookies" : "3. Analytics Cookies"}
              </h2>
              <Switch checked={analytics} onCheckedChange={setAnalytics} />
            </div>
            <p>{de
              ? "Analyse-Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren. Die Informationen werden anonym gesammelt und ausschließlich zur Verbesserung unseres Angebots verwendet."
              : "Analytics cookies help us understand how visitors interact with the website. The information is collected anonymously and used exclusively to improve our services."}</p>
            <p className="text-muted-foreground">{de
              ? "Die Speicherung dieser Cookies erfolgt nur mit Ihrer Einwilligung."
              : "These cookies are only stored with your consent."}</p>
            <p className="text-xs text-muted-foreground">{de ? "Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO." : "Legal basis: Art. 6(1)(a) GDPR."}</p>
          </section>

          <div className="border-t border-border" />

          {/* Speicherdauer */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold font-heading">{de ? "4. Speicherdauer" : "4. Storage Duration"}</h2>
            <p>{de
              ? "Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie sie löschen oder bis ihre automatische Ablaufzeit erreicht ist."
              : "Cookies remain stored on your device until you delete them or until their automatic expiration time is reached."}</p>
          </section>

          {/* Deaktivierung */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold font-heading">{de ? "5. Deaktivierung von Cookies" : "5. Disabling Cookies"}</h2>
            <p>{de
              ? "Sie können Cookies auch direkt über die Einstellungen Ihres Browsers deaktivieren oder löschen."
              : "You can also disable or delete cookies directly via your browser settings."}</p>
            <p className="text-muted-foreground">{de
              ? "Bitte beachten Sie, dass dadurch einzelne Funktionen dieser Website eingeschränkt sein können."
              : "Please note that this may restrict individual functions of this website."}</p>
          </section>

          <div className="border-t border-border" />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={savePreferences} className="eu-gradient text-primary-foreground">
              {de ? "Einstellungen speichern" : "Save Settings"}
            </Button>
            <Button variant="outline" onClick={() => {
              setFunctional(true);
              setAnalytics(true);
              const consent = { necessary: true, functional: true, analytics: true, timestamp: new Date().toISOString() };
              localStorage.setItem("cookie-consent", JSON.stringify(consent));
              toast({ title: de ? "Alle akzeptiert" : "All accepted" });
            }}>
              {de ? "Alle akzeptieren" : "Accept All"}
            </Button>
          </div>

          <div className="pt-4 border-t border-border text-xs text-muted-foreground">
            <p>{de ? "Stand: März 2026" : "Last updated: March 2026"}</p>
            <p className="mt-1">© 2026 Cyberwerk</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CookieEinstellungen;
