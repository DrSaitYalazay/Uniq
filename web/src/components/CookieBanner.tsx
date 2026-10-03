import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Cookie } from "lucide-react";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const de = lang === "de";

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = (all: boolean) => {
    const consent = {
      necessary: true,
      functional: all,
      analytics: all,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("cookie-consent", JSON.stringify(consent));
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="eu-gradient p-2 rounded-lg flex-shrink-0 mt-0.5">
            <Cookie className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-sm text-card-foreground">
              {de ? "Cookie-Einstellungen" : "Cookie Settings"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {de
                ? "Diese Website verwendet Cookies, um Ihnen die bestmögliche Erfahrung zu bieten. Sie können wählen, welche Cookies Sie zulassen möchten."
                : "This website uses cookies to provide you with the best possible experience. You can choose which cookies you want to allow."}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button onClick={() => accept(true)} className="eu-gradient text-primary-foreground text-xs">
            {de ? "Alle akzeptieren" : "Accept All"}
          </Button>
          <Button onClick={() => accept(false)} variant="outline" className="text-xs">
            {de ? "Nur notwendige" : "Necessary Only"}
          </Button>
          <Button onClick={() => { setVisible(false); navigate("/cookie-einstellungen"); }} variant="ghost" className="text-xs">
            {de ? "Einstellungen" : "Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
