import "server-only";
import { getPublicSupabase } from "@/lib/supabase/server";
import type { Category, CategorySlug, Course, CourseModule, Instructor, MembershipPlan } from "./types";

export const CATALOG_TAG = "catalog";

export type CatalogSnapshot = {
  categories: Category[];
  courses: Course[];
  instructors: Instructor[];
  plans: MembershipPlan[];
};

type CourseRow = {
  id: string;
  slug: string;
  owner_id: string;
  title: string;
  subtitle: string;
  description: string;
  category_id: string | null;
  level: Course["level"];
  language: string;
  price_minor: number;
  compare_at_price_minor: number | null;
  currency: Course["currency"];
  included_in_membership: boolean;
  outcomes: string[];
  requirements: string[];
  audience: string[];
  cover_image_path: string | null;
  is_featured: boolean;
  published_at: string | null;
  updated_at: string;
};

type CurriculumRow = {
  id: string;
  course_id: string;
  module_id: string;
  module_title: string;
  module_position: number;
  title: string;
  type: CourseModule["lessons"][number]["type"];
  duration_minutes: number;
  is_preview: boolean;
  position: number;
};

export function publicImageUrl(bucket: string, path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base
    ? `${base}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`
    : null;
}

/** Groups flat curriculum rows into ordered modules and lessons. */
export function buildModules(rows: CurriculumRow[]): CourseModule[] {
  const byModule = new Map<string, { title: string; position: number; lessons: CurriculumRow[] }>();
  for (const r of rows) {
    const m = byModule.get(r.module_id) ?? { title: r.module_title, position: r.module_position, lessons: [] };
    m.lessons.push(r);
    byModule.set(r.module_id, m);
  }
  return [...byModule.entries()]
    .sort((a, b) => a[1].position - b[1].position)
    .map(([id, m]) => ({
      id,
      title: m.title,
      lessons: m.lessons
        .sort((a, b) => a.position - b.position)
        .map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type,
          durationMinutes: l.duration_minutes,
          isPreview: l.is_preview,
        })),
    }));
}

/**
 * Everything public in one read: published courses with curricula, active
 * categories, approved instructors and active membership plans.
 * Uncached — call loadCatalogSnapshot() (catalog-cache.ts) instead.
 */
export async function fetchCatalogSnapshot(): Promise<CatalogSnapshot> {
  const supabase = getPublicSupabase();
  if (!supabase) throw new Error("Supabase is not configured");

  const [cats, crs, cur, ins, plans] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, name, short_name, description, hue, sort_order")
      .eq("is_active", true),
    supabase
      .from("courses")
      .select(
        "id, slug, owner_id, title, subtitle, description, category_id, level, language, price_minor, compare_at_price_minor, currency, included_in_membership, outcomes, requirements, audience, cover_image_path, is_featured, published_at, updated_at",
      )
      .eq("status", "published"),
    supabase
      .from("course_curriculum")
      .select(
        "id, course_id, module_id, module_title, module_position, title, type, duration_minutes, is_preview, position",
      ),
    supabase
      .from("public_instructors")
      .select("id, slug, display_name, headline, bio, expertise, location, is_featured"),
    supabase
      .from("membership_plans")
      .select("id, code, name, interval, price_minor, currency, description, benefits, is_highlighted, sort_order")
      .eq("is_active", true),
  ]);
  for (const r of [cats, crs, cur, ins, plans]) {
    if (r.error) throw new Error(`Catalogue query failed: ${r.error.message}`);
  }

  const categories: Category[] = (cats.data ?? []).map((c) => ({
    id: c.id,
    slug: c.slug as CategorySlug,
    name: c.name,
    shortName: c.short_name,
    description: c.description,
    hue: c.hue,
    sortOrder: c.sort_order,
  }));
  const catById = new Map(categories.map((c) => [c.id, c]));

  const instructors: Instructor[] = (ins.data ?? []).map((i) => ({
    id: i.id,
    slug: i.slug,
    displayName: i.display_name,
    headline: i.headline,
    bio: i.bio,
    expertise: i.expertise ?? [],
    location: i.location ?? "",
    isFeatured: i.is_featured,
    isSample: false,
  }));
  const insById = new Map(instructors.map((i) => [i.id, i]));

  const curriculumByCourse = new Map<string, CurriculumRow[]>();
  for (const row of (cur.data ?? []) as CurriculumRow[]) {
    const list = curriculumByCourse.get(row.course_id) ?? [];
    list.push(row);
    curriculumByCourse.set(row.course_id, list);
  }

  const courses: Course[] = ((crs.data ?? []) as CourseRow[])
    .filter((c) => c.category_id && catById.has(c.category_id))
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle,
      description: c.description,
      categorySlug: catById.get(c.category_id!)!.slug,
      instructorSlug: insById.get(c.owner_id)?.slug ?? "",
      level: c.level,
      language: c.language,
      priceMinor: Number(c.price_minor),
      compareAtPriceMinor: c.compare_at_price_minor === null ? null : Number(c.compare_at_price_minor),
      currency: c.currency,
      includedInMembership: c.included_in_membership,
      outcomes: c.outcomes ?? [],
      requirements: c.requirements ?? [],
      audience: c.audience ?? [],
      modules: buildModules(curriculumByCourse.get(c.id) ?? []),
      status: "published",
      isFeatured: c.is_featured,
      publishedAt: (c.published_at ?? c.updated_at).slice(0, 10),
      updatedAt: c.updated_at.slice(0, 10),
      coverImageUrl: publicImageUrl("course-images", c.cover_image_path),
      isSample: false,
    }));

  const membershipPlans: MembershipPlan[] = (plans.data ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      interval: p.interval,
      priceMinor: Number(p.price_minor),
      currency: p.currency,
      description: p.description,
      benefits: p.benefits ?? [],
      isHighlighted: p.is_highlighted,
      isSample: false,
    }));

  return { categories, courses, instructors, plans: membershipPlans };
}
