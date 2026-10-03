import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield } from "lucide-react";
import { toast } from "sonner";

interface MFAVerifyProps {
  onVerified: () => void;
  onCancel: () => void;
}

const MFAVerify = ({ onVerified, onCancel }: MFAVerifyProps) => {
  const { lang } = useLanguage();
  const de = lang === "de";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];
      if (!totpFactor) throw new Error(de ? "Kein MFA-Faktor gefunden" : "No MFA factor found");

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code,
      });
      if (verifyError) throw verifyError;

      toast.success(de ? "Erfolgreich verifiziert!" : "Successfully verified!");
      onVerified();
    } catch (err: any) {
      toast.error(err.message || (de ? "Ungültiger Code" : "Invalid code"));
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl eu-gradient flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-bold font-heading text-foreground">
            {de ? "Zwei-Faktor-Verifizierung" : "Two-Factor Verification"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {de ? "Code aus Ihrer Authenticator-App eingeben" : "Enter code from your authenticator app"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="mfa-code" className="sr-only">
          {de ? "Sechsstelliger Authentifizierungscode" : "Six-digit authentication code"}
        </label>
        <input
          id="mfa-code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && code.length === 6 && handleVerify()}
          placeholder="000000"
          aria-label={de ? "Sechsstelliger Authentifizierungscode" : "Six-digit authentication code"}
          className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-4 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          autoFocus
        />
        <p className="text-xs text-muted-foreground text-center">
          {de ? "Geben Sie den 6-stelligen Code ein" : "Enter the 6-digit code"}
        </p>
      </div>

      <button
        onClick={handleVerify}
        disabled={code.length !== 6 || loading}
        className="w-full eu-gradient text-primary-foreground py-3.5 rounded-lg text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
      >
        {loading ? "..." : (de ? "Verifizieren" : "Verify")}
      </button>

      <button
        onClick={onCancel}
        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {de ? "Abmelden" : "Sign out"}
      </button>
    </div>
  );
};

export default MFAVerify;
