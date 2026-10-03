import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface MFAEnrollProps {
  onEnrolled: () => void;
  onCancel: () => void;
}

const MFAEnroll = ({ onEnrolled, onCancel }: MFAEnrollProps) => {
  const { lang } = useLanguage();
  const de = lang === "de";
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"scan" | "verify">("scan");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const enroll = async () => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "UniqSuite Authenticator",
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
      }
    };
    enroll();
  }, []);

  const handleVerify = async () => {
    if (verifyCode.length !== 6) return;
    setLoading(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;

      toast.success(de ? "MFA erfolgreich aktiviert!" : "MFA successfully enabled!");
      onEnrolled();
    } catch (err: any) {
      toast.error(err.message || (de ? "Verifizierung fehlgeschlagen" : "Verification failed"));
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl eu-gradient flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-bold font-heading text-foreground">
            {de ? "Zwei-Faktor-Authentifizierung" : "Two-Factor Authentication"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {de ? "Authenticator-App einrichten" : "Set up authenticator app"}
          </p>
        </div>
      </div>

      {step === "scan" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {de
              ? "Scannen Sie den QR-Code mit Ihrer Authenticator-App (z.B. Google Authenticator, Authy, Microsoft Authenticator)."
              : "Scan the QR code with your authenticator app (e.g. Google Authenticator, Authy, Microsoft Authenticator)."}
          </p>

          {qrCode ? (
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl">
                <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-48 h-48 bg-muted rounded-xl animate-pulse" />
            </div>
          )}

          <div className="bg-muted/50 rounded-xl p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">
              {de ? "Oder geben Sie diesen Schlüssel manuell ein:" : "Or enter this key manually:"}
            </p>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-foreground flex-1 break-all">{secret || "..."}</code>
              <button onClick={copySecret} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            onClick={() => setStep("verify")}
            disabled={!qrCode}
            className="w-full eu-gradient text-primary-foreground py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {de ? "Weiter zur Verifizierung" : "Continue to Verification"}
          </button>
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {de
              ? "Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein, um die Einrichtung abzuschließen."
              : "Enter the 6-digit code from your authenticator app to complete setup."}
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">
              {de ? "Verifizierungscode" : "Verification Code"}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("scan")}
              className="flex-1 bg-muted text-muted-foreground py-3 rounded-lg text-sm font-semibold hover:bg-muted/80 transition-all"
            >
              {de ? "Zurück" : "Back"}
            </button>
            <button
              onClick={handleVerify}
              disabled={verifyCode.length !== 6 || loading}
              className="flex-1 eu-gradient text-primary-foreground py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? "..." : (de ? "Aktivieren" : "Activate")}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={onCancel}
        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {de ? "Abbrechen" : "Cancel"}
      </button>
    </div>
  );
};

export default MFAEnroll;
