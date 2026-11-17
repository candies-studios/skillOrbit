/**
 * Public Supabase settings. These are safe in the browser: the anon key only
 * grants what Row Level Security allows. The service-role key is NEVER read
 * here (see src/lib/supabase/admin.ts, server-only).
 *
 * When unset (e.g. the GitHub Pages static preview), the app falls back to
 * development seed data and shows features that need accounts as
 * "not connected".
 */
export function supabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || url.includes("your-project-ref")) return null;
  return { url, anonKey };
}

export const isSupabaseConfigured = () => supabaseEnv() !== null;

/** Only allow same-site relative redirects (prevents open redirects). */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
