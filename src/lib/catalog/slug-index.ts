/**
 * Lightweight slug index used by the proxy to return real 404s.
 *
 * Phase 1: derived from development seed data.
 * Phase 2+: replace with a cached index of published slugs (for example a
 * small table read through a cached Supabase query, refreshed when a course
 * is published or archived). Never query full course records here.
 */
import { categories, courses, instructors } from "./seed";

export type SlugKind = "course" | "category" | "instructor";

const INDEX: Record<SlugKind, ReadonlySet<string>> = {
  course: new Set(courses.filter((c) => c.status === "published").map((c) => c.slug)),
  category: new Set(categories.map((c) => c.slug)),
  instructor: new Set(instructors.map((i) => i.slug)),
};

export function isKnownSlug(kind: SlugKind, slug: string): boolean {
  return INDEX[kind].has(slug);
}
