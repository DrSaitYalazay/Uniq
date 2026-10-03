import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import MFAEnroll from "./MFAEnroll";

const MFASettings = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const de = lang === "de";
  const [factors, setFactors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnroll, setShowEnroll] = useState(false);

  const loadFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data) {
      setFactors(data.totp.filter((f: any) => f.status === "verified"));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadFactors();
  }, [user]);

  const handleUnenroll = async (factorId: string) => {
    const confirmed = window.confirm(
      de ? "MFA wirklich deaktivieren? Sie müssen es erneut einrichten." : "Really disable MFA? You'll need to set it up again."
    );
    if (!confirmed) return;

    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(de ? "MFA deaktiviert" : "MFA disabled");
      loadFactors();
    }
  };

  if (!user) return null;
  if (loading) return <div className="animate-pulse h-20 bg-muted rounded-2xl" />;

  if (showEnroll) {
    return (
      <div className="bg-card rounded-2xl border border-border card-elevated p-6">
        <MFAEnroll
          onEnrolled={() => {
            setShowEnroll(false);
            loadFactors();
          }}
          onCancel={() => setShowEnroll(false)}
        />
      </div>
    );
  }

  const hasMFA = factors.length > 0;

  return (
    <div className="bg-card rounded-2xl border border-border card-elevated p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasMFA ? "bg-success/20" : "bg-muted"}`}>
            {hasMFA ? <ShieldCheck className="h-5 w-5 text-success" /> : <Shield className="h-5 w-5 text-muted-foreground" />}
          </div>
          <div>
            <h3 className="text-base font-bold font-heading text-foreground">
              {de ? "Zwei-Faktor-Authentifizierung" : "Two-Factor Authentication"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {hasMFA
                ? (de ? "Authenticator-App ist aktiv" : "Authenticator app is active")
                : (de ? "Zusätzliche Sicherheit für Ihr Konto" : "Additional security for your account")}
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${hasMFA ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
          {hasMFA ? (de ? "Aktiv" : "Active") : (de ? "Inaktiv" : "Inactive")}
        </span>
      </div>

      {hasMFA ? (
        <div className="space-y-2">
          {factors.map((factor) => (
            <div key={factor.id} className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-foreground">{factor.friendly_name || "Authenticator"}</span>
              </div>
              <button
                onClick={() => handleUnenroll(factor.id)}
                className="text-destructive hover:text-destructive/80 transition-colors p-1"
                title={de ? "MFA deaktivieren" : "Disable MFA"}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <button
          onClick={() => setShowEnroll(true)}
          className="w-full eu-gradient text-primary-foreground py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-all"
        >
          {de ? "MFA aktivieren" : "Enable MFA"}
        </button>
      )}
    </div>
  );
};

export default MFASettings;
