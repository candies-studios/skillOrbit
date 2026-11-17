/**
 * Pure catalogue helpers, safe in both server and browser code.
 */
import type { Course, CourseLevel, CourseQuery, CourseSort, CategorySlug, PriceFilter } from "./types";

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
