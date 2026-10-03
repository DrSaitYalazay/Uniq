import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  tenantId: string | null;
  /** Awaitable tenantId — resolves once auth + tenant lookup is complete.
   *  When the lecturer is impersonating a student, this returns the student's user_id. */
  getTenantId: () => Promise<string | null>;
  isPro: boolean;
  isPremium: boolean;
  isXl: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  isLecturer: boolean;
  /** Active student being viewed by a lecturer (null = normal mode). */
  viewAsUserId: string | null;
  viewAsLabel: string | null;
  lecturerEditMode: boolean;
  startImpersonation: (studentUserId: string, label: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  setLecturerEditMode: (enabled: boolean) => Promise<void>;
  refreshAccess: () => Promise<void>;
  loading: boolean;
  mfaRequired: boolean;
  signOut: () => Promise<void>;
  refreshMfaStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IMPERSONATE_KEY = "lecturer.viewAs.v1";
const LAST_USER_KEY = "cws.auth.lastUserId";

/**
 * Wipe all per-user app data from localStorage on this device.
 * Critical for tenant isolation: when account A signs out and account B signs
 * in on the same browser, the cached tool data from A must NOT bleed into B
 * (useToolData seeds state from localStorage before the cloud fetch returns).
 * Preserves auth tokens (Supabase `sb-*`) and this marker key itself.
 */
function clearLocalToolStorage() {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k === LAST_USER_KEY) continue;
      if (k.startsWith("sb-")) continue; // Supabase auth tokens
      // UI-Präferenzen (geräte-, nicht mandantengebunden) behalten.
      if (/lang|locale|i18n|sidebar|theme|dark|consent|cookie/i.test(k)) continue;
      // Multi-Mandanten-Sicherheit: ALLE übrigen (Tool-)Daten entfernen — nis2*, cws-*,
      // risk-treatment, soa, audit-* … — damit beim Kontowechsel/Mandantenwechsel keine
      // Daten eines Kunden in den nächsten lecken (useToolData seedet aus localStorage).
      toRemove.push(k);
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch { /* best-effort */ }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [rawTenantId, setRawTenantId] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isXl, setIsXl] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [isLecturer, setIsLecturer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);

  // Lecturer impersonation state (persisted in sessionStorage)
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(() => {
    try {
      const raw = sessionStorage.getItem(IMPERSONATE_KEY);
      if (raw) return JSON.parse(raw).userId ?? null;
    } catch { /* ignore */ }
    return null;
  });
  const [viewAsLabel, setViewAsLabel] = useState<string | null>(() => {
    try {
      const raw = sessionStorage.getItem(IMPERSONATE_KEY);
      if (raw) return JSON.parse(raw).label ?? null;
    } catch { /* ignore */ }
    return null;
  });
  const [lecturerEditMode, setLecturerEditModeState] = useState<boolean>(false);

  // CRITICAL tenant safety: the exposed tenantId MUST pivot to the impersonated
  // student when a lecturer is viewing-as. Every page that filters
  // `.eq("user_id", tenantId)` then automatically reads/writes the correct
  // tenant's data — preventing cross-tenant data leaks in lecturer mode.
  const tenantId = viewAsUserId ?? rawTenantId;


  const tenantPromiseRef = useRef<Map<string, Promise<string>>>(new Map());
  const rolesPromiseRef = useRef<Map<string, Promise<void>>>(new Map());
  const mfaPromiseRef = useRef<Promise<void> | null>(null);
  const lastUserIdRef = useRef<string | null>(null);

  const resolveTenant = useCallback((userId: string): Promise<string> => {
    const cached = tenantPromiseRef.current.get(userId);
    if (cached) return cached;
    const p = (async () => {
      const { data: ownRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if ((ownRoles ?? []).some((r) => r.role === "student")) return userId;

      const { data } = await supabase.rpc("get_org_owner_id", { _user_id: userId });
      return (data as string) || userId;
    })();
    tenantPromiseRef.current.set(userId, p);
    return p;
  }, []);

  const checkRoles = useCallback((userId: string): Promise<void> => {
    const cached = rolesPromiseRef.current.get(userId);
    if (cached) return cached;
    const p = (async () => {
      const { data: ownRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const roles = new Set<string>((ownRoles ?? []).map((r) => r.role));
      // Eigene Rollen getrennt merken: die vom Org-Inhaber geerbten Stufen
      // (pro/premium/xl/admin) steuern nur die Freischaltung, nicht die Rolle.
      const own = new Set(roles);

      const { data: orgId } = await supabase.rpc("get_user_org_id", { _user_id: userId });
      if (orgId) {
        const { data: org } = await supabase
          .from("organizations")
          .select("owner_id")
          .eq("id", orgId)
          .maybeSingle();

        if (org?.owner_id && org.owner_id !== userId) {
          const [ownerIsPro, ownerIsPremium, ownerIsXl, ownerIsAdmin] = await Promise.all([
            supabase.rpc("has_role", { _user_id: org.owner_id, _role: "pro" }),
            supabase.rpc("has_role", { _user_id: org.owner_id, _role: "premium" }),
            supabase.rpc("has_role", { _user_id: org.owner_id, _role: "xl" as any }),
            supabase.rpc("has_role", { _user_id: org.owner_id, _role: "admin" }),
          ]);
          if (ownerIsPro.data) roles.add("pro");
          if (ownerIsPremium.data) roles.add("premium");
          if (ownerIsXl.data) roles.add("xl");
          if (ownerIsAdmin.data) roles.add("admin");
        }
      }

      // Tier hierarchy: admin > xl > premium > pro
      // Lecturers AND students receive full Enterprise-tier access so they can
      // use every tool without hitting the paywall. Students are still
      // restricted in Policies (Step 14): they may download EXACTLY ONE
      // Richtlinie of their choice — enforced in src/pages/Policies.tsx.
      // Studierende in der Organisation eines Admins/Dozenten erbten bisher die
      // Admin-ROLLE mit — damit entfiel ihr Export-Kontingent in den Richtlinien
      // (studentLimited = isStudent && !isAdmin && !isLecturer). Geerbtes „admin"
      // schaltet für Studierende nur noch den Funktionsumfang frei.
      const isStu = own.has("student");
      const adminRolle = own.has("admin") || (roles.has("admin") && !isStu);
      const isLec = own.has("lecturer") || adminRolle;
      if (isStu) {
        tenantPromiseRef.current.delete(userId);
        setRawTenantId(userId);
      }
      const fullAccess = isLec || isStu;
      setIsPro(fullAccess || roles.has("pro") || roles.has("premium") || roles.has("xl") || roles.has("admin"));
      setIsPremium(fullAccess || roles.has("premium") || roles.has("xl") || roles.has("admin"));
      setIsXl(fullAccess || roles.has("xl") || roles.has("admin"));
      setIsAdmin(adminRolle);
      setIsStudent(isStu);
      setIsLecturer(isLec);
    })().finally(() => {
      rolesPromiseRef.current.delete(userId);
    });
    rolesPromiseRef.current.set(userId, p);
    return p;
  }, []);

  const checkMfaStatus = useCallback((): Promise<void> => {
    if (mfaPromiseRef.current) return mfaPromiseRef.current;
    const p = (async () => {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!error && data) {
        setMfaRequired(data.nextLevel === "aal2" && data.currentLevel === "aal1");
      }
    })().finally(() => {
      mfaPromiseRef.current = null;
    });
    mfaPromiseRef.current = p;
    return p;
  }, []);

  const refreshMfaStatus = useCallback(async () => {
    mfaPromiseRef.current = null;
    await checkMfaStatus();
  }, [checkMfaStatus]);

  const refreshAccess = useCallback(async () => {
    if (!user) return;
    tenantPromiseRef.current.delete(user.id);
    rolesPromiseRef.current.delete(user.id);
    const t = await resolveTenant(user.id);
    setRawTenantId(t);
    await checkRoles(user.id);
  }, [user, resolveTenant, checkRoles]);

  const getTenantId = useCallback(async (): Promise<string | null> => {
    // When a lecturer is impersonating, all data hooks pivot to that user's tenant.
    if (viewAsUserId) return viewAsUserId;
    if (tenantId) return tenantId;
    if (!user) return null;
    const t = await resolveTenant(user.id);
    return t;
  }, [tenantId, user, resolveTenant, viewAsUserId]);

  const logImpersonationEvent = useCallback(async (
    _targetUserId: string, _mode: "view" | "edit", _action: string, _details?: Record<string, unknown>
  ) => {
    // Impersonation logging removed with the legacy academy tables.
    return;
  }, []);

  const startImpersonation = useCallback(async (studentUserId: string, label: string) => {
    setViewAsUserId(studentUserId);
    setViewAsLabel(label);
    setLecturerEditModeState(false);
    sessionStorage.setItem(IMPERSONATE_KEY, JSON.stringify({ userId: studentUserId, label }));
    await logImpersonationEvent(studentUserId, "view", "start");
    // Force a reload so all useToolData hooks reinitialize against the new tenant.
    window.location.assign("/context");
  }, [logImpersonationEvent]);

  const stopImpersonation = useCallback(async () => {
    if (viewAsUserId) await logImpersonationEvent(viewAsUserId, lecturerEditMode ? "edit" : "view", "stop");
    setViewAsUserId(null);
    setViewAsLabel(null);
    setLecturerEditModeState(false);
    sessionStorage.removeItem(IMPERSONATE_KEY);
    window.location.assign("/lecturer");
  }, [viewAsUserId, lecturerEditMode, logImpersonationEvent]);

  const setLecturerEditMode = useCallback(async (enabled: boolean) => {
    if (viewAsUserId) {
      await logImpersonationEvent(viewAsUserId, enabled ? "edit" : "view", enabled ? "edit_on" : "edit_off");
    }
    setLecturerEditModeState(enabled);
  }, [viewAsUserId, logImpersonationEvent]);

  useEffect(() => {
    let mounted = true;

    const handleSession = async (newSession: Session | null, isInitial: boolean) => {
      if (!mounted) return;
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);

      if (newUser) {
        if (lastUserIdRef.current !== newUser.id) {
          // CRITICAL tenant isolation: if a different user previously used this
          // browser, wipe their cached tool data before any useToolData hook
          // can render with leaked state.
          try {
            const prevLocalUser = localStorage.getItem(LAST_USER_KEY);
            if (prevLocalUser && prevLocalUser !== newUser.id) {
              clearLocalToolStorage();
            }
            localStorage.setItem(LAST_USER_KEY, newUser.id);
          } catch { /* ignore */ }

          lastUserIdRef.current = newUser.id;
          tenantPromiseRef.current.clear();
          rolesPromiseRef.current.clear();

          resolveTenant(newUser.id).then((t) => mounted && setRawTenantId(t));
          // Await roles on initial session so paywalled pages don't flash
          // the gate for lecturers/premium users while roles are still loading.
          if (isInitial) {
            await checkRoles(newUser.id);
          } else {
            checkRoles(newUser.id);
          }
          checkMfaStatus();
        }
      } else {
        lastUserIdRef.current = null;
        tenantPromiseRef.current.clear();
        rolesPromiseRef.current.clear();
        mfaPromiseRef.current = null;
        setRawTenantId(null);

        setIsPro(false);
        setIsPremium(false);
        setIsXl(false);
        setIsAdmin(false);
        setIsStudent(false);
        setIsLecturer(false);
        setMfaRequired(false);
        // Drop impersonation on logout.
        setViewAsUserId(null);
        setViewAsLabel(null);
        sessionStorage.removeItem(IMPERSONATE_KEY);
      }

      if (isInitial) setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      const isInitial = _event === "INITIAL_SESSION";
      handleSession(newSession, isInitial);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [resolveTenant, checkRoles, checkMfaStatus]);

  const signOut = async () => {
    sessionStorage.removeItem(IMPERSONATE_KEY);
    // Wipe tool data from localStorage so the next account on this browser
    // starts clean and cannot see the previous user's manual risks, etc.
    clearLocalToolStorage();
    try { localStorage.removeItem(LAST_USER_KEY); } catch { /* ignore */ }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user, session, tenantId, getTenantId,
      isPro, isPremium, isXl, isAdmin, isStudent, isLecturer,
      viewAsUserId, viewAsLabel, lecturerEditMode,
      startImpersonation, stopImpersonation, setLecturerEditMode,
      refreshAccess, loading, mfaRequired, signOut, refreshMfaStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
