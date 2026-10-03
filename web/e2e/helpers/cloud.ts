/**
 * Node-side Supabase client used by the E2E test to seed user inputs
 * and verify preservation after a demo reload. Uses the same publishable
 * key as the browser; RLS isolates the test user from anyone else.
 */
import { createClient, type Session } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in env (load from .env)."
  );
}

export const cloud = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function ensureTestUser(email: string, password: string): Promise<Session> {
  // Try sign in first; if user does not exist, create then sign in.
  const signIn = await cloud.auth.signInWithPassword({ email, password });
  if (signIn.data.session) return signIn.data.session;

  const signUp = await cloud.auth.signUp({ email, password });
  if (signUp.error && !/already/i.test(signUp.error.message)) throw signUp.error;

  const retry = await cloud.auth.signInWithPassword({ email, password });
  if (!retry.data.session) {
    throw new Error(
      `Could not sign in test user (${email}). ` +
        `If email confirmation is enabled, disable it or use a confirmed account. ` +
        `Underlying: ${retry.error?.message ?? "unknown"}`
    );
  }
  return retry.data.session;
}

export async function writeToolData(userId: string, toolKey: string, data: unknown) {
  const { error } = await cloud.from("user_tool_data").upsert(
    { user_id: userId, tool_key: toolKey, data, updated_at: new Date().toISOString() },
    { onConflict: "user_id,tool_key" }
  );
  if (error) throw error;
}

export async function readToolData(userId: string, toolKey: string): Promise<any | null> {
  const { data, error } = await cloud
    .from("user_tool_data")
    .select("data")
    .eq("user_id", userId)
    .eq("tool_key", toolKey)
    .maybeSingle();
  if (error) throw error;
  return data?.data ?? null;
}
