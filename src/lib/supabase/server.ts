import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/**
 * Per-request client acting as the signed-in user (anon key + session
 * cookies). All reads and writes are subject to Row Level Security.
 * Throws when Supabase isn't configured — callers in account areas only.
 */
export async function getServerSupabase(): Promise<SupabaseClient> {
  const env = supabaseEnv();
  if (!env) throw new Error("Supabase is not configured");
  // Account pages render only for real requests. Without this, runtime
  // prefetches (Partial Prefetching) start the auth client, which reads the
  // clock — not allowed while prerendering.
  await connection();
  const cookieStore = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: cookies are read-only there.
          // The proxy refreshes sessions, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Cookie-less anonymous client for public catalogue reads. Safe inside
 * "use cache" functions because it never touches request data.
 */
export function getPublicSupabase(): SupabaseClient | null {
  const env = supabaseEnv();
  if (!env) return null;
  return createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
