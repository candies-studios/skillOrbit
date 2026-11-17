/**
 * Slug existence check used by the proxy to return real 404s.
 *
 * Seed mode: derived from development seed data.
 * Supabase mode: a single indexed lookup per unknown slug, cached in memory
 * (found: 5 min; not found: 5 s, so a newly published course appears almost at once).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/supabase/env";
import { categories, courses, instructors } from "./seed";

export type SlugKind = "course" | "category" | "instructor";

const SEED_INDEX: Record<SlugKind, ReadonlySet<string>> = {
  course: new Set(courses.filter((c) => c.status === "published").map((c) => c.slug)),
  category: new Set(categories.map((c) => c.slug)),
  instructor: new Set(instructors.map((i) => i.slug)),
};

const QUERY: Record<SlugKind, { table: string; extra?: [string, string] }> = {
  course: { table: "courses", extra: ["status", "published"] },
  category: { table: "categories", extra: ["is_active", "true"] },
  instructor: { table: "public_instructors" },
};

const cache = new Map<string, { exists: boolean; until: number }>();
let client: SupabaseClient | null = null;

export async function isKnownSlug(kind: SlugKind, slug: string): Promise<boolean> {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 80) return false;
  const env = supabaseEnv();
  if (!env) return SEED_INDEX[kind].has(slug);

  const key = `${kind}:${slug}`;
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) return hit.exists;

  client ??= createClient(env.url, env.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { table, extra } = QUERY[kind];
  let query = client.from(table).select("slug").eq("slug", slug).limit(1);
  if (extra) query = query.eq(extra[0], extra[1]);
  const { data, error } = await query;
  if (error) return true; // fail open: let the page decide rather than 404 on a DB hiccup
  const exists = (data?.length ?? 0) > 0;
  cache.set(key, { exists, until: Date.now() + (exists ? 300_000 : 5_000) });
  if (cache.size > 5000) cache.clear();
  return exists;
}
