/**
 * Tenant data wipe utility.
 *
 * Clears localStorage state for the active tenant and calls the server-side
 * `wipe_tenant_data` RPC which atomically deletes every tenant-scoped row.
 * Returns per-table delete counts so the UI can display "wipe complete" with
 * concrete numbers.
 */
import { supabase } from "@/integrations/supabase/client";

const IMPERSONATE_KEY = "lecturer.viewAs.v1";

const getActiveTenantId = async (): Promise<string | null> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) return null;

  try {
    const raw = sessionStorage.getItem(IMPERSONATE_KEY);
    const viewAsUserId = raw ? JSON.parse(raw)?.userId : null;
    if (typeof viewAsUserId === "string" && viewAsUserId) return viewAsUserId;
  } catch { /* best-effort */ }

  const { data: ownerId } = await supabase.rpc("get_org_owner_id", { _user_id: userId });
  return (ownerId as string | null) || userId;
};

export async function clearAllTenantData(): Promise<Record<string, number>> {
  // Wipe every nis2* key from localStorage so cached UI state can't bleed
  // through after the cloud is empty.
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("nis2")) toRemove.push(k);
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch { /* best-effort */ }

  const userId = await getActiveTenantId();
  if (!userId) return {};

  const { data, error } = await supabase.rpc("wipe_tenant_data", { _tenant_id: userId });
  if (error) {
    console.error("[clearAllTenantData] wipe_tenant_data failed", error);
    throw error;
  }
  return (data as Record<string, number>) ?? {};
}
