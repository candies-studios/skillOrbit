/**
 * Catalog data access. Pages call only these functions.
 *
 * Phase 1: reads development seed data (clearly labelled in the UI).
 * Phase 2/3: replace the bodies with Supabase queries — the signatures and
 * return types stay the same, and only status = 'published' rows are
 * returned for public reads (also enforced by RLS).
 */
import * as seed from "./seed";
import type {
  Category,
  CategorySlug,
  Course,
  CourseLevel,
  CourseQuery,
  CourseSort,
  Instructor,
  MembershipPlan,
  PriceFilter,
} from "./types";

export const CATALOG_SOURCE = "development-seed" as const;

const LEVELS: CourseLevel[] = ["beginner", "intermediate", "advanced"];
const SORTS: CourseSort[] = ["newest", "price-asc", "price-desc", "title"];
const PRICES: PriceFilter[] = ["all", "free", "paid", "membership"];

/** Parses untrusted URL search params into a typed, validated query. */
export function parseCourseQuery(
  params: Record<string, string | string[] | undefined>,
  validCategories: readonly string[],
): CourseQuery {
  const one = (k: string) => {
    const v = params[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const q = one("q")?.slice(0, 100);
  const category = one("category");
  const level = one("level");
  const price = one("price");
  const sort = one("sort");
  return {
    q,
    category: category && validCategories.includes(category) ? (category as CategorySlug) : undefined,
    level: level && (LEVELS as string[]).includes(level) ? (level as CourseLevel) : undefined,
    price: price && (PRICES as string[]).includes(price) ? (price as PriceFilter) : undefined,
    sort: sort && (SORTS as string[]).includes(sort) ? (sort as CourseSort) : undefined,
  };
}

/** Pure filter/sort used by the seed source and unit tests. */
export function filterCourses(all: Course[], query: CourseQuery): Course[] {
  const needle = query.q?.toLowerCase();
  const result = all.filter((c) => {
    if (c.status !== "published") return false;
    if (query.category && c.categorySlug !== query.category) return false;
    if (query.level && c.level !== query.level) return false;
    if (query.price === "free" && c.priceMinor !== 0) return false;
    if (query.price === "paid" && c.priceMinor === 0) return false;
    if (query.price === "membership" && !c.includedInMembership) return false;
    if (needle) {
      const hay = `${c.title} ${c.subtitle} ${c.description} ${c.outcomes.join(" ")}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
  const sort = query.sort ?? "newest";
  return result.sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return a.priceMinor - b.priceMinor;
      case "price-desc":
        return b.priceMinor - a.priceMinor;
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return b.publishedAt.localeCompare(a.publishedAt);
    }
  });
}

export function courseStats(course: Course) {
  const lessons = course.modules.flatMap((m) => m.lessons);
  return {
    moduleCount: course.modules.length,
    lessonCount: lessons.length,
    previewCount: lessons.filter((l) => l.isPreview).length,
    totalMinutes: lessons.reduce((sum, l) => sum + l.durationMinutes, 0),
  };
}

export async function listCategories(): Promise<Category[]> {
  return [...seed.categories].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getCategory(slug: string): Promise<Category | null> {
  return seed.categories.find((c) => c.slug === slug) ?? null;
}

export async function listCourses(query: CourseQuery = {}): Promise<Course[]> {
  return filterCourses(seed.courses, query);
}

export async function listFeaturedCourses(limit = 6): Promise<Course[]> {
  return filterCourses(seed.courses, {})
    .filter((c) => c.isFeatured)
    .slice(0, limit);
}

export async function getCourse(slug: string): Promise<Course | null> {
  return seed.courses.find((c) => c.slug === slug && c.status === "published") ?? null;
}

export async function countCoursesByCategory(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const c of filterCourses(seed.courses, {})) {
    counts[c.categorySlug] = (counts[c.categorySlug] ?? 0) + 1;
  }
  return counts;
}

export async function listInstructors(): Promise<Instructor[]> {
  return [...seed.instructors];
}

export async function listFeaturedInstructors(): Promise<Instructor[]> {
  return seed.instructors.filter((i) => i.isFeatured);
}

export async function getInstructor(slug: string): Promise<Instructor | null> {
  return seed.instructors.find((i) => i.slug === slug) ?? null;
}

export async function listCoursesByInstructor(slug: string): Promise<Course[]> {
  return filterCourses(seed.courses, {}).filter((c) => c.instructorSlug === slug);
}

export async function listMembershipPlans(): Promise<MembershipPlan[]> {
  return [...seed.membershipPlans];
}

/** Genuine testimonials only. Empty until real, consented reviews exist. */
export async function listTestimonials(): Promise<{ id: string; quote: string; name: string; context: string }[]> {
  return [];
}
