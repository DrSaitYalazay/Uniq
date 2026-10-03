import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface FrameworkRow { code: string; name_en: string; role: string }
interface ControlCount { framework: string; count: number }
interface AdminUser { id: string; email: string; display_name: string; roles: string[]; created_at: string; last_sign_in_at: string | null; banned_until: string | null; licensed?: boolean; plan?: string | null; seat_limit?: number | null; must_change_password?: boolean }

const isFrozen = (u: AdminUser) => !!(u.banned_until && new Date(u.banned_until) > new Date());

const ROLE_OPTIONS = ["admin", "pro", "premium", "xl", "lecturer", "student"];
// A-14: Pflicht-Begründung beim MFA-Reset — gleiche Schwelle wie die
// Massen-Fertig-Notiz in der Umsetzung. Der Server prüft sie noch einmal.
const MFA_REASON_MIN = 10;
// Lizenzpläne: Sitzplätze = wie viele Nutzer sich an DENSELBEN Firmen-Account
// (Tenant/Container) anmelden und gemeinsam arbeiten dürfen.
const PLANS: { id: string; label: string; seats: number }[] = [
  { id: "basis", label: "Basis (1 Nutzer)", seats: 1 },
  { id: "pro", label: "Pro (5 Nutzer)", seats: 5 },
  { id: "enterprise", label: "Enterprise (10 Nutzer)", seats: 10 },
];

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const de = lang === "de";
  const [frameworks, setFrameworks] = useState<FrameworkRow[]>([]);
  const [controlCounts, setControlCounts] = useState<ControlCount[]>([]);
  const [riskCount, setRiskCount] = useState(0);

  // ── Kullanıcı yönetimi ──
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPlan, setNewPlan] = useState("basis");
  const [creating, setCreating] = useState(false);
  const [createdPw, setCreatedPw] = useState<{ email: string; password: string } | null>(null);
  // MFA-Reset läuft NUR über den Bestätigungsdialog — die Begründung landet in
  // der Audit-Spur (auth.admin_actions), deshalb kein stilles confirm().
  const [mfaTarget, setMfaTarget] = useState<AdminUser | null>(null);
  const [mfaReason, setMfaReason] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);

  // Admin-MFA-Pflicht (Server: functions/admin-settings, DB: platform_settings).
  const [sec, setSec] = useState<{ admin_mfa_required: boolean; caller_aal: string; caller_has_factor: boolean } | null>(null);
  const [secBusy, setSecBusy] = useState(false);
  const loadSec = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("admin-settings", { body: { action: "get" } });
    if (!error && data) setSec(data as typeof sec);
  }, []);
  const mfaBlocked = !!sec && sec.admin_mfa_required && sec.caller_aal !== "aal2";
  const toggleAdminMfa = async (on: boolean) => {
    setSecBusy(true);
    const { error } = await supabase.functions.invoke("admin-settings", { body: { action: "set", admin_mfa_required: on } });
    setSecBusy(false);
    if (error) { toast.error(error.message || (de ? "Änderung fehlgeschlagen" : "Change failed")); return; }
    toast.success(on
      ? (de ? "MFA-Pflicht für Admins eingeschaltet" : "Admin MFA requirement enabled")
      : (de ? "MFA-Pflicht für Admins ausgeschaltet" : "Admin MFA requirement disabled"));
    loadSec();
  };

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase.functions.invoke("admin-list-users", { body: {} });
    if (error) toast.error(error.message || "Kullanıcılar yüklenemedi");
    else setUsers((data?.users ?? []) as AdminUser[]);
    setLoadingUsers(false);
  }, []);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (!isAdmin) { navigate("/"); return; }
    (async () => {
      const { data: fw } = await supabase.from("frameworks").select("code, name_en, name_de, role").order("sort_order");
      setFrameworks(((fw as { code: string; name_en: string; name_de: string; role: string }[]) ?? []).map((f) => ({
        code: f.code, name_en: de ? f.name_de : f.name_en, role: f.role,
      })));
      const { data: ctrls } = await supabase.from("controls").select("framework");
      const counts = new Map<string, number>();
      (ctrls ?? []).forEach((c: { framework: string }) => counts.set(c.framework, (counts.get(c.framework) ?? 0) + 1));
      setControlCounts(Array.from(counts.entries()).map(([framework, count]) => ({ framework, count })).sort((a, b) => b.count - a.count));
      const { count: rc } = await supabase.from("risks").select("*", { count: "exact", head: true });
      setRiskCount(rc ?? 0);
    })();
    loadUsers();
    loadSec();
  }, [user, isAdmin, navigate, de, loadUsers, loadSec]);

  const handleCreate = async () => {
    if (!newEmail.includes("@")) { toast.error(de ? "Gültige E-Mail eingeben" : "Enter a valid email"); return; }
    setCreating(true); setCreatedPw(null);
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: { email: newEmail.trim(), display_name: newName.trim(), plan: newPlan, license: true },
    });
    if (error) { toast.error(error.message || (de ? "Erstellen fehlgeschlagen" : "Create failed")); }
    else {
      setCreatedPw({ email: data.user.email, password: data.password });
      setNewEmail(""); setNewName("");
      toast.success(de ? "Benutzer erstellt" : "User created");
      loadUsers();
    }
    setCreating(false);
  };

  const toggleRole = async (u: AdminUser, role: string) => {
    const grant = !u.roles.includes(role);
    const { error } = await supabase.functions.invoke("admin-set-role", {
      body: { user_id: u.id, role, grant },
    });
    if (error) toast.error(error.message || "Fehler");
    else { toast.success(de ? "Rolle aktualisiert" : "Role updated"); loadUsers(); }
  };

  const setLicense = async (u: AdminUser, active: boolean, plan?: string) => {
    const { error } = await supabase.functions.invoke("admin-set-license", {
      body: { user_id: u.id, active, plan: plan ?? u.plan ?? "basis" },
    });
    if (error) toast.error(error.message || "Fehler");
    else { toast.success(de ? "Lizenz aktualisiert" : "License updated"); loadUsers(); }
  };

  const toggleFreeze = async (u: AdminUser) => {
    const freeze = !isFrozen(u);
    if (freeze && !confirm(de ? `Konto ${u.email} einfrieren? Der Nutzer kann sich nicht mehr anmelden.` : `Freeze account ${u.email}? The user will no longer be able to log in.`)) return;
    const { error } = await supabase.functions.invoke("admin-set-ban", { body: { user_id: u.id, freeze } });
    if (error) toast.error(error.message || "Fehler");
    else { toast.success(freeze ? (de ? "Konto eingefroren" : "Account frozen") : (de ? "Konto entsperrt" : "Account unfrozen")); loadUsers(); }
  };

  // A-14: Zweiten Faktor zurücksetzen, wenn der Nutzer sein Authenticator-Gerät
  // verloren hat. Wirkung: alle Faktoren weg, alle Sitzungen beendet, Audit-Zeile
  // geschrieben, Hinweismail an den Betroffenen.
  const confirmResetMfa = async () => {
    if (!mfaTarget || mfaReason.trim().length < MFA_REASON_MIN) return;
    setMfaBusy(true);
    const { error } = await supabase.functions.invoke("admin-reset-mfa", {
      body: { user_id: mfaTarget.id, reason: mfaReason.trim() },
    });
    setMfaBusy(false);
    if (error) { toast.error(error.message || "Fehler"); return; }
    toast.success(de ? "MFA zurückgesetzt — der Nutzer wurde abgemeldet und benachrichtigt." : "MFA reset — the user was signed out and notified.");
    setMfaTarget(null); setMfaReason("");
    loadUsers();
  };

  const deleteUser = async (u: AdminUser) => {
    if (!confirm(de ? `Benutzer ${u.email} löschen?` : `Delete user ${u.email}?`)) return;
    const { error } = await supabase.functions.invoke("admin-delete-user", { body: { user_id: u.id } });
    if (error) toast.error(error.message || "Fehler");
    else { toast.success(de ? "Benutzer gelöscht" : "User deleted"); loadUsers(); }
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-6xl mx-auto p-6 md:p-10 space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">Admin</h1>

        {/* ── Sicherheit: Admin-MFA-Pflicht ── */}
        <section className="rounded-xl bg-card border border-border p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{de ? "Sicherheit" : "Security"}</h2>
              <p className="text-sm text-muted-foreground">
                {de
                  ? "MFA-Pflicht für Admin-Konten: Ist sie eingeschaltet, wirken Admin-Rechte nur nach Anmeldung mit dem zweiten Faktor."
                  : "MFA requirement for admin accounts: when on, admin rights only apply after signing in with the second factor."}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <Switch
                checked={!!sec?.admin_mfa_required}
                disabled={!sec || secBusy || (!sec.admin_mfa_required && sec.caller_aal !== "aal2") || mfaBlocked}
                onCheckedChange={(v) => toggleAdminMfa(v)}
                aria-label={de ? "MFA-Pflicht für Admins" : "Admin MFA requirement"}
              />
              {sec?.admin_mfa_required ? (de ? "Eingeschaltet" : "On") : (de ? "Ausgeschaltet" : "Off")}
            </label>
          </div>
          {sec && !sec.admin_mfa_required && sec.caller_aal !== "aal2" && (
            <p className="text-xs text-muted-foreground">
              {sec.caller_has_factor
                ? (de ? "Zum Einschalten einmal ab- und mit dem zweiten Faktor wieder anmelden." : "To enable, sign out and sign in again with your second factor.")
                : (de ? "Zum Einschalten zuerst MFA für dieses Konto einrichten: " : "To enable, first set up MFA for this account: ")}
              {!sec.caller_has_factor && <a href="/settings?tab=security" className="text-primary underline">{de ? "Einstellungen › Sicherheit" : "Settings › Security"}</a>}
            </p>
          )}
          {mfaBlocked && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm" role="alert">
              {de
                ? "Admin-Funktionen sind gesperrt: die MFA-Pflicht ist eingeschaltet, diese Sitzung hat aber keinen zweiten Faktor. "
                : "Admin functions are locked: the MFA requirement is on but this session has no second factor. "}
              {sec?.caller_has_factor
                ? (de ? "Bitte ab- und mit dem zweiten Faktor wieder anmelden." : "Please sign out and sign in again with your second factor.")
                : <a href="/settings?tab=security" className="text-primary underline">{de ? "MFA jetzt einrichten" : "Set up MFA now"}</a>}
            </div>
          )}
        </section>

        {/* ── Benutzerverwaltung ── */}
        <section className="rounded-xl bg-card border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">{de ? "Benutzerverwaltung" : "User management"}</h2>

          {/* Erstellen */}
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">{de ? "E-Mail" : "Email"}</label>
              <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" placeholder="user@example.com"
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm w-64" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">{de ? "Name (optional)" : "Name (optional)"}</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Max Mustermann"
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm w-56" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">{de ? "Lizenz-Plan" : "License plan"}</label>
              <select value={newPlan} onChange={(e) => setNewPlan(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm w-48">
                {PLANS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <button onClick={handleCreate} disabled={creating}
              className="rounded-md bg-primary text-primary-foreground px-4 py-1.5 text-sm font-semibold disabled:opacity-50">
              {creating ? "…" : (de ? "Benutzer erstellen" : "Create user")}
            </button>
          </div>

          {/* Otomatik üretilen başlangıç şifresi */}
          {createdPw && (
            <div className="mb-4 rounded-md border border-primary/40 bg-primary/5 px-4 py-3 text-sm">
              <div className="font-semibold mb-1">{de ? "Benutzer erstellt — Start-Passwort:" : "User created — initial password:"}</div>
              <div className="flex items-center gap-2">
                <code className="font-mono bg-muted px-2 py-1 rounded">{createdPw.email}</code>
                <code className="font-mono bg-muted px-2 py-1 rounded select-all">{createdPw.password}</code>
                <button onClick={() => { navigator.clipboard.writeText(createdPw.password); toast.success(de ? "Kopiert" : "Copied"); }}
                  className="text-xs text-primary underline">{de ? "kopieren" : "copy"}</button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {de ? "Diesem Nutzer mitteilen. Er kann es nach dem Login in den Einstellungen ändern." : "Share with the user. They can change it after login in Settings."}
              </p>
            </div>
          )}

          {/* Kullanıcı listesi */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">{de ? "E-Mail" : "Email"}</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">{de ? "Rollen" : "Roles"}</th>
                  <th className="py-2 pr-3">{de ? "Lizenz" : "License"}</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers && <tr><td colSpan={5} className="py-3 text-muted-foreground">{de ? "Lädt…" : "Loading…"}</td></tr>}
                {!loadingUsers && users.map((u) => (
                  <tr key={u.id} className="border-b border-border/60 align-top">
                    <td className="py-2 pr-3 font-medium">
                      {u.email}
                      {isFrozen(u) && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-destructive/15 text-destructive align-middle">{de ? "eingefroren" : "frozen"}</span>}
                    </td>
                    <td className="py-2 pr-3">{u.display_name}</td>
                    <td className="py-2 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {ROLE_OPTIONS.map((role) => {
                          const has = u.roles.includes(role);
                          return (
                            <button key={role} onClick={() => toggleRole(u, role)}
                              className={`px-2 py-0.5 rounded-full text-[11px] border transition ${has ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/50"}`}>
                              {role}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${u.licensed ? "st-ja-tint st-ja-text" : "bg-muted text-muted-foreground"}`}>
                          {u.licensed ? (de ? "lizenziert" : "licensed") : (de ? "keine" : "none")}
                        </span>
                        <select
                          value={u.plan ?? "basis"}
                          onChange={(e) => setLicense(u, true, e.target.value)}
                          className="rounded border border-border bg-background px-1.5 py-0.5 text-[11px]"
                          title={de ? "Plan setzen (aktiviert die Lizenz)" : "Set plan (activates license)"}>
                          {PLANS.map((p) => <option key={p.id} value={p.id}>{p.id} ({p.seats})</option>)}
                        </select>
                        {u.licensed
                          ? <button onClick={() => setLicense(u, false)} className="text-[11px] text-destructive hover:underline">{de ? "sperren" : "revoke"}</button>
                          : <button onClick={() => setLicense(u, true, u.plan ?? "basis")} className="text-[11px] st-ja-text hover:underline">{de ? "aktivieren" : "activate"}</button>}
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-3">
                        {/* MFA-Reset steht AUCH in der eigenen Zeile: der
                            Plattform-Admin ist die einzige Instanz, die sich
                            selbst zurücksetzen darf — sonst wäre ein verlorenes
                            Admin-Gerät das Ende des Zugangs. Einfrieren/Löschen
                            bleiben für die eigene Zeile gesperrt. */}
                        <button
                          onClick={() => { setMfaTarget(u); setMfaReason(""); }}
                          className="text-xs text-accent-readable hover:underline"
                          title={de ? "Zweiten Faktor (MFA) löschen — für Nutzer, die ihr Gerät verloren haben" : "Remove second factor (MFA) — for users who lost their device"}>
                          {de ? "MFA zurücksetzen" : "reset MFA"}
                        </button>
                        {u.id !== user.id && (
                          <>
                            <button onClick={() => toggleFreeze(u)} className="text-xs st-teilweise-text hover:underline">
                              {isFrozen(u) ? (de ? "entsperren" : "unfreeze") : (de ? "einfrieren" : "freeze")}
                            </button>
                            <button onClick={() => deleteUser(u)} className="text-xs text-destructive hover:underline">
                              {de ? "löschen" : "delete"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── İstatistik: Frameworks ── */}
        <section className="rounded-xl bg-card border border-border p-6">
          <h2 className="text-lg font-semibold mb-3">Frameworks ({frameworks.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {frameworks.map((f) => (
              <div key={f.code} className="rounded-md border border-border px-3 py-2">
                <div className="text-sm font-medium">{f.name_en}</div>
                <div className="text-xs text-muted-foreground">{f.role}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-card border border-border p-6">
          <h2 className="text-lg font-semibold mb-3">{de ? "Kontrollen je Framework" : "Controls per framework"}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
            {controlCounts.map((c) => (
              <div key={c.framework} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span className="font-mono text-xs">{c.framework}</span>
                <span className="font-bold">{c.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-card border border-border p-6">
          <h2 className="text-lg font-semibold mb-1">{de ? "Risiken (BSI Grundschutz++)" : "Risks (BSI Grundschutz++)"}</h2>
          <div className="text-3xl font-bold">{riskCount}</div>
        </section>
      </main>

      {/* A-14: MFA-Reset nur mit Pflicht-Begründung (≥ 10 Zeichen → auth.admin_actions) */}
      <AlertDialog open={!!mfaTarget} onOpenChange={o => { if (!o) { setMfaTarget(null); setMfaReason(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{de ? "Zweiten Faktor zurücksetzen?" : "Reset second factor?"}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  {de ? "Betrifft" : "Affects"}{" "}
                  <b className="text-foreground">{mfaTarget?.email}</b>
                  {mfaTarget?.id === user?.id && <> {de ? "(Ihr eigenes Konto)" : "(your own account)"}</>}
                </p>
                <p className="text-muted-foreground">
                  {de
                    ? "Alle MFA-Faktoren dieses Kontos werden gelöscht und alle Sitzungen beendet — der Nutzer muss sich neu anmelden und MFA umgehend neu einrichten. Bis dahin schützt nur das Passwort. Der Vorgang wird protokolliert (wer, wen, wann, warum) und der Nutzer per E-Mail informiert."
                    : "All MFA factors of this account are deleted and all sessions are revoked — the user has to sign in again and set up MFA immediately. Until then only the password protects the account. The action is logged (who, whom, when, why) and the user is notified by email."}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground" htmlFor="mfa-reset-reason">
              {de ? `Begründung (Pflicht, mind. ${MFA_REASON_MIN} Zeichen)` : `Reason (required, min. ${MFA_REASON_MIN} characters)`}
            </label>
            <Textarea
              id="mfa-reset-reason"
              value={mfaReason}
              onChange={e => setMfaReason(e.target.value)}
              rows={3}
              placeholder={de ? "z. B. Gerät verloren, Identität am 18.09. telefonisch geprüft (Ticket SUP-1423)." : "e.g. device lost, identity verified by phone on 18 Sep (ticket SUP-1423)."}
              className="text-sm"
            />
            <div className={`text-[10px] ${mfaReason.trim().length >= MFA_REASON_MIN ? "text-muted-foreground" : "text-destructive"}`}>
              {mfaReason.trim().length}/{MFA_REASON_MIN} {de ? "Zeichen" : "characters"}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{de ? "Abbrechen" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              disabled={mfaBusy || mfaReason.trim().length < MFA_REASON_MIN}
              onClick={e => { e.preventDefault(); confirmResetMfa(); }}
            >
              {mfaBusy ? "…" : (de ? "MFA zurücksetzen" : "Reset MFA")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPanel;
