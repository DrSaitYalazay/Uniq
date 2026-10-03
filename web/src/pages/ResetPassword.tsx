import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import ShieldLogo from "@/components/ShieldLogo";
import { passwordPolicyError, passwordRuleHint, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "@/lib/passwordPolicy";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang } = useLanguage();
  const de = lang === "de";

  // Der Token steht im Link aus der Mail (`/reset-password?token=…&type=recovery`).
  // Vorher hat die Seite stattdessen eine bestehende Sitzung geprüft und
  // `updateUser` gerufen — ohne Sitzung war der Link damit immer "ungültig",
  // und mit fremder Sitzung hätte sie das Passwort des gerade Angemeldeten
  // geändert statt das des Token-Inhabers.
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setValidSession(!!token);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // A-15: gleiche Regel wie auf dem Server. Die E-Mail ist hier nicht bekannt
    // (die Seite kennt nur den Token aus dem Link) — die Regel „Passwort ≠ eigene
    // Adresse" prüft deshalb erst der Server, der den Kontoinhaber kennt.
    const policyError = passwordPolicyError(password, { de });
    if (policyError) {
      toast.error(policyError);
      return;
    }
    if (password !== confirmPassword) {
      toast.error(de ? "Passwörter stimmen nicht überein" : "Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.confirmRecovery({ token, password });
      if (error) throw error;
      setSuccess(true);
      toast.success(de ? "Passwort aktualisiert" : "Password updated");
      // Sign out so user has to log in with new password
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/auth");
      }, 2500);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-body flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <button
          onClick={() => navigate("/auth")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> {de ? "Zurück zur Anmeldung" : "Back to login"}
        </button>

        <div className="flex items-center gap-3">
          <ShieldLogo size={40} />
          <span className="text-xl font-bold font-heading text-foreground">Uniq<span className="gold-gradient-text">Suite</span></span>
        </div>

        {validSession === null ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : validSession === false ? (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 text-center card-elevated">
            <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="text-xl font-bold font-heading text-foreground">
              {de ? "Ungültiger oder abgelaufener Link" : "Invalid or expired link"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {de
                ? "Der Reset-Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an."
                : "The reset link is invalid or expired. Please request a new one."}
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="w-full eu-gradient text-primary-foreground py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-all"
            >
              {de ? "Neuen Link anfordern" : "Request a new link"}
            </button>
          </div>
        ) : success ? (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 text-center card-elevated">
            <div className="mx-auto w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
            <h1 className="text-xl font-bold font-heading text-foreground">
              {de ? "Passwort aktualisiert" : "Password updated"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {de
                ? "Sie werden zur Anmeldung weitergeleitet..."
                : "Redirecting you to login..."}
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5 card-elevated">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold font-heading text-foreground">
                {de ? "Neues Passwort festlegen" : "Set new password"}
              </h1>
              <p className="text-sm text-muted-foreground">{passwordRuleHint(de)}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  {de ? "Neues Passwort" : "New password"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="••••••••"
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  {de ? "Passwort bestätigen" : "Confirm password"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="••••••••"
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full eu-gradient text-primary-foreground py-3.5 rounded-lg text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loading
                  ? "..."
                  : de
                  ? "Passwort speichern"
                  : "Save password"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
