/**
 * TeamManagement — kundenseitige Team-Verwaltung (Zwei-Ebenen-Modell).
 *
 * Der Org-Owner lädt eigene Teammitglieder bis zum Sitzplatzlimit seines Tarifs
 * ein und verwaltet sie selbst. Der Vendor/Superadmin ist hier NICHT beteiligt —
 * jede Organisation sieht nur ihre eigenen Mitglieder.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { Users, UserPlus, Loader2, X, Crown, Clock } from "lucide-react";

interface Member { user_id: string; role: string; display_name: string; email: string }
interface Invitation { id: string; email: string; status: string; expires_at: string; created_at: string }
interface TeamData {
  org_id: string; org_name: string; is_owner: boolean;
  seat_count: number; seat_limit: number;
  members: Member[]; invitations: Invitation[];
}

const ERR: Record<string, { de: string; en: string }> = {
  seat_limit_reached: { de: "Sitzplatzlimit erreicht — bitte Tarif upgraden.", en: "Seat limit reached — please upgrade your plan." },
  already_member:     { de: "Diese Person ist bereits Mitglied.", en: "This person is already a member." },
  already_invited:    { de: "Diese E-Mail wurde bereits eingeladen.", en: "This email was already invited." },
  invalid_input:      { de: "Ungültige Eingabe.", en: "Invalid input." },
  forbidden:          { de: "Keine Berechtigung.", en: "Not permitted." },
};

export default function TeamManagement() {
  const { lang } = useLanguage();
  const de = lang === "de";
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: res, error } = await supabase.functions.invoke("org-team", { body: { action: "list" } });
    if (error) toast.error(error.message || (de ? "Team konnte nicht geladen werden" : "Failed to load team"));
    else setData(res as TeamData);
    setLoading(false);
  }, [de]);

  useEffect(() => { load(); }, [load]);

  const invite = async () => {
    const e = email.trim().toLowerCase();
    if (!e.includes("@")) { toast.error(de ? "Gültige E-Mail eingeben" : "Enter a valid email"); return; }
    if (!data) return;
    if (data.seat_count >= data.seat_limit) { toast.error(ERR.seat_limit_reached[lang]); return; }
    setInviting(true);
    const { data: res, error } = await supabase.functions.invoke("send-org-invitation", {
      body: { email: e, org_id: data.org_id, lang },
    });
    const errKey = (res as any)?.error || (error ? "" : "");
    if (errKey && ERR[errKey]) toast.error(ERR[errKey][lang]);
    else if (error) toast.error(error.message || (de ? "Einladung fehlgeschlagen" : "Invitation failed"));
    else { toast.success(de ? "Einladung gesendet" : "Invitation sent"); setEmail(""); load(); }
    setInviting(false);
  };

  const removeMember = async (m: Member) => {
    if (!confirm(de ? `${m.email || m.display_name} aus dem Team entfernen?` : `Remove ${m.email || m.display_name} from the team?`)) return;
    const { error } = await supabase.functions.invoke("org-team", { body: { action: "remove-member", member_user_id: m.user_id } });
    if (error) toast.error(error.message || "Fehler"); else { toast.success(de ? "Mitglied entfernt" : "Member removed"); load(); }
  };

  const revokeInvite = async (inv: Invitation) => {
    const { error } = await supabase.functions.invoke("org-team", { body: { action: "revoke-invite", invitation_id: inv.id } });
    if (error) toast.error(error.message || "Fehler"); else { toast.success(de ? "Einladung widerrufen" : "Invitation revoked"); load(); }
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground py-6"><Loader2 className="h-4 w-4 animate-spin" />{de ? "Team wird geladen…" : "Loading team…"}</div>;
  }
  if (!data) return null;

  // V-5: Mitglieder verwalten das Team nicht. Der Server liefert fuer sie
  // is_owner=false und keine Listen — vorher wurde fuer jedes Mitglied beim
  // Oeffnen dieses Reiters eine eigene, zweite Organisation angelegt.
  if (!data.is_owner) {
    return (
      <div className="bg-card rounded-2xl border border-border card-elevated p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold font-heading text-foreground">Team</h3>
            <p className="text-xs text-muted-foreground">
              {de
                ? `Sie sind Mitglied von „${data.org_name}“. Das Team verwaltet die Inhaberin bzw. der Inhaber der Organisation.`
                : `You are a member of “${data.org_name}”. The team is managed by the organisation's owner.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const full = data.seat_count >= data.seat_limit;

  return (
    <div className="bg-card rounded-2xl border border-border card-elevated p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold font-heading text-foreground">{de ? "Team-Verwaltung" : "Team management"}</h3>
          <p className="text-xs text-muted-foreground">
            {de ? "Laden Sie Ihre Kolleginnen und Kollegen ein — bis zu Ihrem Sitzplatzlimit." : "Invite your colleagues — up to your seat limit."}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tabular-nums text-foreground">{data.seat_count}<span className="text-muted-foreground text-base font-normal"> / {data.seat_limit}</span></div>
          <div className="text-[11px] text-muted-foreground">{de ? "Sitzplätze belegt" : "seats used"}</div>
        </div>
      </div>

      {/* Einladen */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground mb-1">{de ? "E-Mail einladen" : "Invite by email"}</label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") invite(); }}
            type="email"
            placeholder="kollege@example.com"
            disabled={full}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-50"
          />
        </div>
        <button
          onClick={invite}
          disabled={inviting || full}
          className="rounded-md bg-primary text-primary-foreground px-4 py-1.5 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
        >
          {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {de ? "Einladen" : "Invite"}
        </button>
      </div>
      {full && (
        <div className="text-xs st-teilweise-text st-teilweise-tint rounded-md px-3 py-2">
          {de ? "Sitzplatzlimit erreicht. Für mehr Plätze bitte den Tarif upgraden (Pro=1, Enterprise=5, XL=15)." : "Seat limit reached. Upgrade your plan for more seats (Pro=1, Enterprise=5, XL=15)."}
        </div>
      )}

      {/* Mitglieder */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{de ? "Mitglieder" : "Members"}</div>
        <div className="divide-y divide-border/60">
          {data.members.map(m => (
            <div key={m.user_id} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                {(m.display_name || m.email || "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate flex items-center gap-1.5">
                  {m.display_name || m.email}
                  {m.role === "owner" && <Crown className="h-3.5 w-3.5 st-teilweise-text" />}
                </div>
                <div className="text-xs text-muted-foreground truncate">{m.email}</div>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{m.role === "owner" ? (de ? "Inhaber" : "Owner") : (de ? "Mitglied" : "Member")}</span>
              {m.role !== "owner" && (
                <button onClick={() => removeMember(m)} className="text-muted-foreground hover:text-destructive p-1" title={de ? "Entfernen" : "Remove"}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Ausstehende Einladungen */}
      {data.invitations.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{de ? "Ausstehende Einladungen" : "Pending invitations"}</div>
          <div className="divide-y divide-border/60">
            {data.invitations.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 py-2">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">{inv.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {de ? "Gültig bis " : "Valid until "}{new Date(inv.expires_at).toLocaleDateString(de ? "de-DE" : "en-GB")}
                  </div>
                </div>
                <button onClick={() => revokeInvite(inv)} className="text-xs text-destructive hover:underline">{de ? "widerrufen" : "revoke"}</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
