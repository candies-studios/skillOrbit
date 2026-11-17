import "server-only";
import { getServerSupabase } from "@/lib/supabase/server";
import { publicImageUrl } from "@/lib/catalog/db";
import type { Category, CategorySlug, Course, CourseStatus, LessonType } from "@/lib/catalog/types";

export type ManagedLesson = {
  id: string;
  title: string;
  type: LessonType;
  duration_minutes: number;
  is_preview: boolean;
  position: number;
  body: string | null;
  video_provider: string | null;
  video_asset_id: string | null;
  resources: { id: string; title: string; storage_path: string; file_size_bytes: number | null }[];
};

export type ManagedCourse = {
  id: string;
  slug: string;
  owner_id: string;
  is_platform_owned: boolean;
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
  status: CourseStatus;
  is_featured: boolean;
  rejection_reason: string | null;
  submitted_at: string | null;
  published_at: string | null;
  updated_at: string;
  modules: { id: string; title: string; position: number; lessons: ManagedLesson[] }[];
};

const COURSE_COLUMNS =
  "id, slug, owner_id, is_platform_owned, title, subtitle, description, category_id, level, language, price_minor, compare_at_price_minor, currency, included_in_membership, outcomes, requirements, audience, cover_image_path, status, is_featured, rejection_reason, submitted_at, published_at, updated_at";

/**
 * Loads a course with its full curriculum for its owner or an admin.
 * RLS returns nothing for anyone else, so this doubles as an access check.
 */
export async function getManagedCourse(id: string): Promise<ManagedCourse | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await getServerSupabase();
  const [{ data: course }, { data: modules }, { data: lessons }, { data: resources }] = await Promise.all([
    supabase.from("courses").select(COURSE_COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("course_modules").select("id, title, position").eq("course_id", id).order("position"),
    supabase
      .from("lessons")
      .select(
        "id, module_id, title, type, duration_minutes, is_preview, position, body, video_provider, video_asset_id",
      )
      .eq("course_id", id)
      .order("position"),
    supabase.from("lesson_resources").select("id, lesson_id, title, storage_path, file_size_bytes").eq("course_id", id),
  ]);
  if (!course) return null;
  return {
    ...(course as Omit<ManagedCourse, "modules">),
    price_minor: Number(course.price_minor),
    compare_at_price_minor: course.compare_at_price_minor === null ? null : Number(course.compare_at_price_minor),
    modules: (modules ?? []).map((m) => ({
      ...m,
      lessons: (lessons ?? [])
        .filter((l) => l.module_id === m.id)
        .map((l) => ({
          ...l,
          resources: (resources ?? []).filter((r) => r.lesson_id === l.id),
        })) as ManagedLesson[],
    })),
  };
}

export async function listAllCategories(): Promise<(Category & { isActive: boolean })[]> {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, short_name, description, hue, sort_order, is_active")
    .order("sort_order");
  return (data ?? []).map((c) => ({
    id: c.id,
    slug: c.slug as CategorySlug,
    name: c.name,
    shortName: c.short_name,
    description: c.description,
    hue: c.hue,
    sortOrder: c.sort_order,
    isActive: c.is_active,
  }));
}

/** Converts a managed course into the public Course shape for previews. */
export function toPreviewCourse(c: ManagedCourse, categories: Category[], instructorSlug = ""): Course {
  const cat = categories.find((x) => x.id === c.category_id);
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    description: c.description,
    categorySlug: (cat?.slug ?? "ai") as CategorySlug,
    instructorSlug,
    level: c.level,
    language: c.language,
    priceMinor: c.price_minor,
    compareAtPriceMinor: c.compare_at_price_minor,
    currency: c.currency,
    includedInMembership: c.included_in_membership,
    outcomes: c.outcomes,
    requirements: c.requirements,
    audience: c.audience,
    modules: c.modules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        type: l.type,
        durationMinutes: l.duration_minutes,
        isPreview: l.is_preview,
      })),
    })),
    status: c.status,
    isFeatured: c.is_featured,
    publishedAt: (c.published_at ?? c.updated_at).slice(0, 10),
    updatedAt: c.updated_at.slice(0, 10),
    coverImageUrl: publicImageUrl("course-images", c.cover_image_path),
    isSample: false,
  };
}

export const STATUS_LABEL: Record<CourseStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  published: "Published",
  rejected: "Needs changes",
  archived: "Archived",
};
export const STATUS_TONE = {
  draft: "neutral",
  in_review: "marigold",
  published: "success",
  rejected: "danger",
  archived: "neutral",
} as const;
