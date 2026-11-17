import "server-only";
/**
 * Catalogue data access. Pages call only these functions.
 *
 * Supabase configured → published data from the database (one cached
 * snapshot, invalidated by tag on every admin/instructor change).
 * Not configured (e.g. the GitHub Pages static preview) → development seed
 * data, labelled as samples in the UI.
 */
import * as seed from "./seed";
import type { CatalogSnapshot } from "./db";
import { loadCatalogSnapshot } from "./catalog-cache";
import { filterCourses } from "./query";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Category, Course, CourseQuery, Instructor, MembershipPlan } from "./types";

export { courseStats, filterCourses, parseCourseQuery } from "./query";

export type CatalogSource = "supabase" | "development-seed";
export const catalogSource = (): CatalogSource => (isSupabaseConfigured() ? "supabase" : "development-seed");

async function snapshot(): Promise<CatalogSnapshot> {
  if (catalogSource() === "supabase") return loadCatalogSnapshot();
  return {
    categories: seed.categories,
    courses: seed.courses,
    instructors: seed.instructors,
    plans: seed.membershipPlans,
  };
}

export async function listCategories(): Promise<Category[]> {
  return [...(await snapshot()).categories].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getCategory(slug: string): Promise<Category | null> {
  return (await snapshot()).categories.find((c) => c.slug === slug) ?? null;
}

export async function listCourses(query: CourseQuery = {}): Promise<Course[]> {
  return filterCourses((await snapshot()).courses, query);
}

export async function listFeaturedCourses(limit = 6): Promise<Course[]> {
  const all = filterCourses((await snapshot()).courses, {});
  const featured = all.filter((c) => c.isFeatured);
  // Until enough courses are featured, fill with the newest ones.
  return [...featured, ...all.filter((c) => !c.isFeatured)].slice(0, limit);
}

export async function getCourse(slug: string): Promise<Course | null> {
  return (await snapshot()).courses.find((c) => c.slug === slug && c.status === "published") ?? null;
}

export async function countCoursesByCategory(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const c of filterCourses((await snapshot()).courses, {})) {
    counts[c.categorySlug] = (counts[c.categorySlug] ?? 0) + 1;
  }
  return counts;
}

export async function listInstructors(): Promise<Instructor[]> {
  return [...(await snapshot()).instructors];
}

export async function listFeaturedInstructors(limit = 3): Promise<Instructor[]> {
  const all = (await snapshot()).instructors;
  return [...all.filter((i) => i.isFeatured), ...all.filter((i) => !i.isFeatured)].slice(0, limit);
}

export async function getInstructor(slug: string): Promise<Instructor | null> {
  return (await snapshot()).instructors.find((i) => i.slug === slug) ?? null;
}

export async function listCoursesByInstructor(slug: string): Promise<Course[]> {
  return filterCourses((await snapshot()).courses, {}).filter((c) => c.instructorSlug === slug);
}

export async function listMembershipPlans(): Promise<MembershipPlan[]> {
  return [...(await snapshot()).plans];
}

/** Genuine testimonials only. Empty until real, consented reviews exist. */
export async function listTestimonials(): Promise<{ id: string; quote: string; name: string; context: string }[]> {
  return [];
}

/**
 * Cache Components requires generateStaticParams to return at least one
 * entry. On an empty catalogue this placeholder renders the not-found page.
 */
export function staticParamsOrPlaceholder(slugs: string[]): { slug: string }[] {
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: "none-yet" }];
}
