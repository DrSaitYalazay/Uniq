import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { passwordPolicyError, passwordRuleHint } from "@/lib/passwordPolicy";
import { toast } from "sonner";

interface Props {
  children: ReactNode;
}

/**
 * Erst-Login-Zwang: Nutzer mit `must_change_password` (vom Admin mit Start-
 * Passwort angelegt) MÜSSEN zuerst ein neues Passwort setzen, bevor die App
 * nutzbar ist. Nach Erfolg löscht der Server das Flag (PUT /auth/user).
 */
const ForcePasswordChange = ({ de, email }: { de: boolean; email?: string }) => {
  const [currentPw, setCurrentPw] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    // Der Server verlangt jetzt das aktuelle Passwort. Hier ist das zumutbar:
    // der Nutzer hat sich gerade mit dem Start-Passwort angemeldet.
    if (!currentPw) { toast.error(de ? "Bitte aktuelles Passwort eingeben." : "Please enter your current password."); return; }
    // A-15: dieselbe Regel wie auf dem Server. Vorher galt hier „8 Zeichen, 3
    // verschiedene" — wer den Erst-Login durchlief, bekam damit ein Passwort,
    // das die Richtlinie nicht erfüllt hätte.
    const policyError = passwordPolicyError(pw, { email, de });
    if (policyError) { toast.error(policyError); return; }
    if (pw !== pw2) { toast.error(de ? "Passwörter stimmen nicht überein." : "Passwords do not match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw, currentPassword: currentPw });
    setBusy(false);
    if (error) { toast.error(error.message || (de ? "Fehlgeschlagen" : "Failed")); return; }
    toast.success(de ? "Passwort gesetzt. Willkommen!" : "Password set. Welcome!");
    // Frisch laden, damit das gelöschte Flag greift und die App startet.
    window.location.reload();
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">{de ? "Passwort ändern" : "Change password"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {de ? "Bitte legen Sie beim ersten Login ein eigenes Passwort fest." : "Please set your own password on first login."}
          </p>
          <p className="text-xs text-muted-foreground mt-2">{passwordRuleHint(de)}</p>
        </div>
        <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
          placeholder={de ? "Aktuelles (Start-)Passwort" : "Current (initial) password"}
          autoComplete="current-password"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={de ? "Neues Passwort" : "New password"}
          autoComplete="new-password"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder={de ? "Passwort wiederholen" : "Repeat password"}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          autoComplete="new-password"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <button onClick={submit} disabled={busy}
          className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {busy ? "…" : (de ? "Speichern & fortfahren" : "Save & continue")}
        </button>
      </div>
    </div>
  );
};

/**
 * Wraps protected routes:
 * - While auth is initializing, shows a lightweight spinner.
 * - If no user, redirects to /auth?redirect=<current-path> with a toast.
 * - Listens once globally for SIGNED_OUT / TOKEN_REFRESHED-failure events
 *   and triggers a friendly redirect instead of leaving the page stuck.
 */
const ProtectedRoute = ({ children }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { lang } = useLanguage();

  // Listen once for forced sign-outs (token expired, refresh failed, etc.).
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        toast.info(
          lang === "de"
            ? "Sitzung abgelaufen. Bitte erneut anmelden."
            : "Session expired. Please sign in again."
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [lang]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirect}`} replace />;
  }

  // Erst-Login-Passwortzwang: bis das Start-Passwort geändert ist, keine App.
  if ((user as { user_metadata?: { must_change_password?: boolean } })?.user_metadata?.must_change_password) {
    // E-Mail mitgeben, damit die Regel „Passwort ≠ eigene Adresse" schon hier
    // greift und nicht erst der Server sie zurückweist.
    return <ForcePasswordChange de={lang === "de"} email={(user as { email?: string })?.email} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
