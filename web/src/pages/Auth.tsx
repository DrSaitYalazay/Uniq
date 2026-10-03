import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowRight, Mail, Lock, ShieldCheck, CheckCircle2, Sparkles, KeyRound, Fingerprint } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import ShieldLogo from "@/components/ShieldLogo";
import LanguageToggle from "@/components/LanguageToggle";
import MFAVerify from "@/components/MFAVerify";
import SEO from "@/components/SEO";
import { passwordPolicyError, passwordRuleHint, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "@/lib/passwordPolicy";
import { toast } from "sonner";

// Links in Bestaetigungs- und Passwort-Mails zeigen auf die Adresse, unter der
// die App gerade laeuft. Eine feste Domain hier war bereits einmal tot.
const appOrigin = () =>
  typeof window !== "undefined" ? window.location.origin : "https://uniq.cyberwerk.online";
const toAppUrl = (path: string) => new URL(path || "/", appOrigin()).toString();

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, lang } = useLanguage();
  const { user, mfaRequired, refreshMfaStatus } = useAuth();
  const [isLogin, setIsLogin] = useState(searchParams.get("signup") !== "1");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMfaChallenge, setShowMfaChallenge] = useState(false);
  const [showConfirmEmail, setShowConfirmEmail] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const redirectAfter = searchParams.get("redirect");
  // Nach dem Login IMMER auf das Management-Dashboard (Führungssicht), außer ein
  // expliziter Deep-Link (?redirect=) ist gesetzt. (getRememberedRoute bewusst nicht mehr.)
  const resolveDestination = () => redirectAfter || "/dashboard";
  const signupRedirectTo = toAppUrl(redirectAfter || resolveDestination());

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error(lang === "de" ? "Bitte E-Mail eingeben" : "Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: toAppUrl("/reset-password"),
      });
      if (error) throw error;
      setResetEmailSent(true);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && mfaRequired) setShowMfaChallenge(true);
  }, [user, mfaRequired]);

  useEffect(() => {
    if (user && !mfaRequired && !showMfaChallenge) {
      navigate(resolveDestination(), { replace: true });
    }
  }, [user, mfaRequired, showMfaChallenge, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin) {
      // A-15: dieselbe Regel wie auf dem Server (Länge statt Zeichensalat). Die
      // frühere „3 verschiedene Zeichen"-Regel entfällt — sie ersetzte keine
      // Länge und stand jetzt nur noch neben der verbindlichen Prüfung.
      const policyError = passwordPolicyError(password, { email, de: lang === "de" });
      if (policyError) {
        toast.error(policyError);
        return;
      }
      if (password !== confirmPassword) {
        toast.error(lang === "de" ? "Passwörter stimmen nicht überein" : "Passwords don't match");
        return;
      }
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await refreshMfaStatus();
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalData?.nextLevel === "aal2" && aalData?.currentLevel === "aal1") {
          setShowMfaChallenge(true);
          return;
        }
        toast.success(lang === "de" ? "Erfolgreich angemeldet" : "Successfully signed in");
        navigate(resolveDestination(), { replace: true });
      } else {
        // A-18: Die Registrierung antwortet jetzt für eine neue und für eine
        // bereits vergebene Adresse GLEICH — also ohne Sitzung und ohne Nutzer.
        // Damit gibt es keinen Zweig mehr, der direkt in die App springt; alle
        // landen auf derselben neutralen Bestätigungsseite.
        //
        // Die Einwilligungen können deshalb nicht mehr nachträglich per
        // `profiles.update` geschrieben werden (dafür bräuchte es die Sitzung).
        // Sie gehen als user_metadata mit der Registrierung mit; der Trigger
        // handle_new_user übernimmt sie beim Anlegen des Profils.
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: signupRedirectTo,
            data: {
              marketing_consent: marketingConsent,
              marketing_consent_categories: marketingConsent ? ["newsletter", "products", "training"] : [],
              data_processing_consent: dataConsent,
            },
          },
        });
        if (error) throw error;
        setShowConfirmEmail(true);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3.5 bg-background border border-border rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60 transition-all";
  const labelClass =
    "block text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em] mb-2";

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background flex items-center justify-center p-4 md:p-8 font-body selection:bg-accent/30">
      {/* Ambient theme aurora */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/3 -left-1/4 w-[900px] h-[900px] rounded-full bg-[radial-gradient(circle,hsl(var(--accent)/0.22),transparent_65%)] blur-3xl" />
        <div className="absolute -bottom-1/3 -right-1/4 w-[900px] h-[900px] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.20),transparent_65%)] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,hsl(var(--secondary)/0.10),transparent_70%)] blur-3xl" />
      </div>

      <SEO
        title={lang === "de" ? "Anmelden & Registrieren | UniqSuite" : "Sign In & Register | UniqSuite"}
        description={lang === "de"
          ? "Melden Sie sich bei UniqSuite an oder erstellen Sie ein Konto — die Multi-Framework-Compliance-Plattform mit MFA und optionalem SAML SSO."
          : "Sign in to UniqSuite or create an account — the multi-framework compliance platform with MFA and optional SAML SSO."}
        path="/auth"
        lang={lang}
        noindex
      />

      <div className="relative max-w-6xl w-full grid grid-cols-1 md:grid-cols-[1.05fr_1fr] rounded-[28px] overflow-hidden shadow-2xl bg-card border border-border">
        {/* Brand Side — editorial, theme tokens only */}
        <div className="relative hidden md:flex flex-col justify-between p-14 overflow-hidden bg-primary text-primary-foreground">
          {/* Layered themed glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_15%_20%,hsl(var(--accent)/0.35),transparent_55%)]" />
            {/* Zweiter Schein trägt den HELLEN Goldton des Markenverlaufs, nicht
                --success. Grün ist in dieser Oberfläche die Statusfarbe für
                „erfüllt"; als Deko neben Navy und Kupfer ergibt es kein Bild. */}
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_85%_85%,hsl(var(--accent-2-h)_var(--accent-2-s)_58%_/_0.22),transparent_55%)]" />
            <div className="absolute top-1/2 right-0 w-96 h-96 bg-[radial-gradient(circle,hsl(var(--secondary)/0.15),transparent_70%)]" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-14">
              <div className="relative">
                <div className="absolute inset-0 bg-accent blur-xl opacity-40" />
                <ShieldLogo size={40} className="relative" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-semibold tracking-[0.28em] uppercase text-accent">{lang === "de" ? "Compliance-Plattform" : "Compliance Platform"}</span>
                <span className="text-xl font-semibold tracking-tight text-primary-foreground font-heading mt-1">Uniq<span className="gold-gradient-text">Suite</span></span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full border border-primary-foreground/15 bg-primary-foreground/5 backdrop-blur">
              <Sparkles className="h-3 w-3 text-secondary" />
              <span className="text-[10px] font-medium tracking-widest uppercase text-primary-foreground/80">
                {lang === "de" ? "Enterprise Edition" : "Enterprise Edition"}
              </span>
            </div>

            <h1 className="text-[42px] font-light leading-[1.05] mb-6 text-primary-foreground font-heading tracking-tight">
              {lang === "de" ? "Multi-Framework" : "Multi-Framework"}
              <br />
              <span className="gold-gradient-text font-semibold">
                Compliance
              </span>
              <br />
              <span className="text-primary-foreground/75 font-light">
                {lang === "de" ? "Governance-Plattform" : "Governance Platform"}
              </span>
            </h1>
            <p className="text-primary-foreground/70 max-w-sm leading-relaxed text-[15px]">
              {lang === "de"
                ? "Ein Arbeitsbereich für mehrere Rahmenwerke — konsistente Kontrollen, wiederverwendbare Nachweise, weniger Doppelarbeit."
                : "One workspace across multiple frameworks — consistent controls, reusable evidence, less duplicate work."}
            </p>
          </div>

          {/* Framework-agnostic trust bullets */}
          <div className="relative z-10 space-y-6">
            <div className="space-y-3">
              {[
                { icon: ShieldCheck, label: lang === "de" ? "Mehrere Frameworks in einem Arbeitsbereich" : "Multiple frameworks, one workspace" },
                { icon: Fingerprint, label: lang === "de" ? "MFA & SAML SSO auf Anfrage" : "MFA & SAML SSO on request" },
                { icon: KeyRound, label: lang === "de" ? "Verschlüsselt · Mandantenisoliert" : "Encrypted · Tenant-isolated" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 text-sm text-primary-foreground/80">
                  <div className="h-8 w-8 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-accent" />
                  </div>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-primary-foreground/15 to-transparent" />
            <p className="text-[10px] text-primary-foreground/50 tracking-widest uppercase">© 2026 UniqSuite · Compliance Governance</p>
          </div>
        </div>

        {/* Form Side */}
        <div className="relative bg-card p-8 md:p-12 flex flex-col justify-center min-h-[680px] border-l border-border">
          {/* Subtle themed glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[radial-gradient(circle,hsl(var(--accent)/0.10),transparent_70%)] blur-2xl" />
          </div>


          <div className="relative">
            {/* Mobile brand + language toggle row */}
            <div className="flex items-center justify-between mb-10">
              <div className="md:hidden flex items-center gap-2">
                <ShieldLogo size={30} />
                <span className="text-lg font-bold text-foreground tracking-tight font-heading">Uniq<span className="gold-gradient-text">Suite</span></span>
              </div>
              <div className="hidden md:block" />
              <LanguageToggle />
            </div>

            {showMfaChallenge ? (
              <MFAVerify
                onVerified={() => {
                  setShowMfaChallenge(false);
                  refreshMfaStatus();
                  toast.success(lang === "de" ? "Erfolgreich angemeldet" : "Successfully signed in");
                  navigate(resolveDestination(), { replace: true });
                }}
                onCancel={async () => {
                  await supabase.auth.signOut();
                  setShowMfaChallenge(false);
                }}
              />
            ) : showConfirmEmail ? (
              <div className="space-y-6 text-center">
                {/* „E-Mail bestätigen" ist noch kein Erfolg, sondern ein
                    Wartezustand — deshalb Marken-Kupfer, kein Grün. Das Grün
                    kommt erst im Schritt darunter, wenn das Konto wirklich
                    angelegt ist. */}
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 flex items-center justify-center shadow-lg">
                  <Mail className="h-7 w-7 text-accent" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold text-foreground font-heading">
                    {lang === "de" ? "E-Mail prüfen" : "Check your email"}
                  </h1>
                  {/* A-18: Diese Seite darf NICHT verraten, ob die Adresse neu war
                      oder längst ein Konto hat — sonst wäre die Registrierung
                      wieder das Orakel, das der Server gerade geschlossen hat.
                      Deshalb dieselbe Aussage für beide Fälle; welche Mail
                      ankommt, weiss nur, wer das Postfach hat. */}
                  <p className="text-muted-foreground text-sm">
                    {lang === "de"
                      ? `Wir haben eine E-Mail an ${email} gesendet. Darin steht, wie es weitergeht — melden Sie sich anschließend mit Ihrem Passwort an.`
                      : `We've sent an email to ${email}. It explains the next step — then sign in with your password.`}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border text-left space-y-2">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                    {lang === "de" ? "Keine E-Mail erhalten?" : "Didn't receive it?"}
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>{lang === "de" ? "Überprüfen Sie Ihren Spam-Ordner" : "Check your spam folder"}</li>
                    <li>{lang === "de" ? "Stellen Sie sicher, dass die E-Mail korrekt ist" : "Make sure the email is correct"}</li>
                  </ul>
                </div>
                <button
                  onClick={() => { setShowConfirmEmail(false); setIsLogin(true); }}
                  className="text-sm text-accent font-semibold hover:underline"
                >
                  {lang === "de" ? "Zurück zur Anmeldung" : "Back to sign in"}
                </button>
              </div>
            ) : showForgotPassword ? (
              <div className="space-y-6">
                {resetEmailSent ? (
                  <div className="space-y-6 text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-success/20 to-success/10 border border-success/30 flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="h-7 w-7 text-success" />
                    </div>
                    <div className="space-y-2">
                      <h1 className="text-2xl font-semibold text-foreground font-heading">
                        {lang === "de" ? "E-Mail gesendet" : "Email sent"}
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        {lang === "de"
                          ? `Wenn ein Konto mit ${email} existiert, haben wir einen Reset-Link gesendet.`
                          : `If an account with ${email} exists, we've sent a reset link.`}
                      </p>
                    </div>
                    <button
                      onClick={() => { setShowForgotPassword(false); setResetEmailSent(false); }}
                      className="text-sm text-accent font-semibold hover:underline"
                    >
                      {lang === "de" ? "Zurück zur Anmeldung" : "Back to sign in"}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <h1 className="text-2xl font-semibold text-foreground font-heading">
                        {lang === "de" ? "Passwort vergessen?" : "Forgot password?"}
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        {lang === "de"
                          ? "Wir senden Ihnen einen Link zum Zurücksetzen."
                          : "We'll send you a reset link."}
                      </p>
                    </div>
                    <form onSubmit={handleForgotPassword} className="space-y-5">
                      <div>
                        <label className={labelClass}>Email / E-Mail</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          required
                          className={inputClass}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full relative overflow-hidden copper-button text-primary-foreground font-semibold py-3.5 rounded-xl hover:shadow-lg transition-all shadow-lg disabled:opacity-50"
                      >
                        {loading ? "..." : (lang === "de" ? "Reset-Link senden" : "Send reset link")}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowForgotPassword(false); setResetEmailSent(false); }}
                        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {lang === "de" ? "Zurück" : "Back"}
                      </button>
                    </form>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Segmented tab switcher */}
                <div className="relative mb-8 p-1 rounded-xl bg-muted/40 border border-border grid grid-cols-2 text-sm font-medium">
                  <div
                    className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg copper-button shadow-md transition-transform duration-300 ease-out"
                    style={{ transform: isLogin ? "translateX(0%)" : "translateX(100%)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className={`relative z-10 py-2.5 rounded-lg transition-colors ${isLogin ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {lang === "de" ? "Anmelden" : "Sign In"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className={`relative z-10 py-2.5 rounded-lg transition-colors ${!isLogin ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {lang === "de" ? "Registrieren" : "Sign Up"}
                  </button>
                </div>

                <div className="mb-8">
                  <h2 className="text-3xl font-semibold text-foreground font-heading tracking-tight mb-2">
                    {isLogin
                      ? (lang === "de" ? "Willkommen zurück" : "Welcome back")
                      : (lang === "de" ? "Konto erstellen" : "Create your account")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isLogin
                      ? (lang === "de" ? "Setzen Sie Ihre Compliance-Reise fort." : "Continue your compliance journey.")
                      : (lang === "de" ? "Starten Sie Ihre Compliance-Reise in Minuten." : "Start your compliance journey in minutes.")}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="auth-email" className={labelClass}>Email / E-Mail</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        id="auth-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        required
                        className={`${inputClass} pl-11`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label htmlFor="auth-password" className={labelClass + " mb-0"}>
                        {t("auth.password")}
                      </label>
                      {isLogin && (
                        <button
                          type="button"
                          onClick={() => { setShowForgotPassword(true); setResetEmailSent(false); }}
                          className="text-[11px] font-medium text-accent-readable hover:text-accent underline-offset-2 hover:underline"
                        >
                          {lang === "de" ? "Passwort vergessen?" : "Forgot password?"}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        id="auth-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={isLogin ? undefined : PASSWORD_MIN_LENGTH}
                        maxLength={isLogin ? undefined : PASSWORD_MAX_LENGTH}
                        className={`${inputClass} pl-11`}
                      />
                    </div>
                    {!isLogin && (
                      <p className="text-[11px] text-muted-foreground mt-2">
                        {passwordRuleHint(lang === "de")}
                      </p>
                    )}
                  </div>

                  {!isLogin && (
                    <>
                      <div>
                        <label htmlFor="auth-password-confirm" className={labelClass}>
                          {t("auth.password_confirm")}
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <input
                            id="auth-password-confirm"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className={`${inputClass} pl-11`}
                          />
                        </div>
                      </div>

                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={dataConsent}
                          onChange={(e) => setDataConsent(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-border bg-muted text-accent focus:ring-accent/40"
                        />
                        <span className="text-[11px] text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                          {lang === "de"
                            ? "Ich willige ein, dass UniqSuite meine Profil- und Nutzungsdaten gemäß Datenschutzerklärung speichert."
                            : "I consent to UniqSuite storing my profile and usage data per the privacy policy."}
                        </span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={marketingConsent}
                          onChange={(e) => setMarketingConsent(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-border bg-muted text-accent focus:ring-accent/40"
                        />
                        <span className="text-[11px] text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                          {lang === "de"
                            ? "Ich möchte E-Mails zu Artikeln, Produkten und Schulungen erhalten (freiwillig)."
                            : "I'd like to receive emails about articles, products and training (optional)."}
                        </span>
                      </label>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full overflow-hidden copper-button text-primary-foreground font-semibold py-3.5 rounded-xl hover:shadow-xl transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative">
                      {loading
                        ? "..."
                        : (isLogin
                          ? (lang === "de" ? "Anmelden" : "Sign in")
                          : (lang === "de" ? "Konto erstellen" : "Create account"))}
                    </span>
                    <ArrowRight className="relative w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </form>

                {/* MFA reassurance — ruhiger Navy-Hinweis, kein Grün.
                    „Verfügbar" ist eine Produkteigenschaft, kein erfüllter
                    Prüfstatus; Grün ist in dieser Anwendung für „umgesetzt"
                    reserviert und würde hier eine Zusicherung vortäuschen. */}
                <div className="mt-6 flex items-center gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/15">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{t("auth.mfa")}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {lang === "de"
                        ? "In den Einstellungen aktivierbar · SAML SSO auf Anfrage"
                        : "Enable in settings · SAML SSO on request"}
                    </p>
                  </div>
                  <span className="ml-auto text-[10px] font-semibold text-accent-readable bg-accent/10 border border-accent/25 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {lang === "de" ? "Verfügbar" : "Available"}
                  </span>
                </div>
              </>
            )}

            {/* Legal footer */}
            <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground font-medium">
              <div className="flex gap-4">
                <Link to="/impressum" className="hover:text-foreground transition-colors uppercase tracking-tight">
                  {lang === "de" ? "Impressum" : "Legal Notice"}
                </Link>
                <Link to="/datenschutz" className="hover:text-foreground transition-colors uppercase tracking-tight">
                  {lang === "de" ? "Datenschutz" : "Privacy"}
                </Link>
                <Link to="/cookie-einstellungen" className="hover:text-foreground transition-colors uppercase tracking-tight">
                  {lang === "de" ? "Cookies" : "Cookies"}
                </Link>
              </div>
              <span className="text-[10px] text-muted-foreground tracking-wider">
                {lang === "de" ? "Sicherer Zugang · verschlüsselt" : "Secure access · encrypted"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
