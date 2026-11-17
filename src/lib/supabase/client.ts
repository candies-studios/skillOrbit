"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

let client: SupabaseClient | null = null;

/**
 * Browser client (session in cookies). Returns null when not configured, and
 * always null during server rendering — call it from effects or event
 * handlers, and use isSupabaseConfigured() for anything rendered.
 */
export function getBrowserSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  const env = supabaseEnv();
  if (!env) return null;
  client ??= createBrowserClient(env.url, env.anonKey);
  return client;
}
