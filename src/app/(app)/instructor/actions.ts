"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireInstructor } from "@/lib/auth/viewer";
import { dbError, invalid, lines, rupeesToPaise, type ActionResult } from "@/lib/actions";
import { CATALOG_TAG } from "@/lib/catalog/db";

/**
 * Course builder actions. Every write uses the signed-in user's session, so
 * Row Level Security and the database guards decide what is allowed —
 * these checks only make errors friendlier.
 */

const uuid = z.string().uuid();
const done = (message: string): ActionResult => {
  updateTag(CATALOG_TAG); // published content may have changed
  refresh();
  return { ok: true, message };
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// ── Course ────────────────────────────────────────────────────────────
const createSchema = z.object({
  title: z.string().trim().min(3, "Give the course a title (at least 3 characters)").max(120),
  category_id: uuid.or(z.literal("")),
});

export async function createCourse(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const viewer = await requireInstructor();
  const parsed = createSchema.safeParse({ title: fd.get("title"), category_id: fd.get("category_id") ?? "" });
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await getServerSupabase();
  const base = slugify(parsed.data.title) || "course";
  const isPlatform = viewer.isAdmin && fd.get("platform") === "on";

  let id: string | null = null;
  for (let attempt = 0; attempt < 5 && !id; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from("courses")
      .insert({
        slug,
        title: parsed.data.title,
        owner_id: viewer.id,
        category_id: parsed.data.category_id || null,
        is_platform_owned: isPlatform,
      })
      .select("id")
      .single();
    if (data) id = data.id;
    else if (error?.code !== "23505") return dbError(error);
  }
  if (!id) return { ok: false, error: "Couldn’t create a unique web address. Try a different title." };
  redirect(`/instructor/courses/${id}`);
}

const detailsSchema = z
  .object({
    title: z.string().trim().min(3, "At least 3 characters").max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens")
      .max(80),
    subtitle: z.string().trim().max(200),
    description: z.string().trim().max(10000),
    category_id: uuid.or(z.literal("")),
    level: z.enum(["beginner", "intermediate", "advanced"]),
    language: z.string().trim().min(2).max(40),
    price_minor: z.number({ message: "Enter a price like 1499 or 0 for free" }).int().min(0).max(99_999_900),
    compare_at_price_minor: z.number({ message: "Enter a price like 2499" }).int().min(1).nullable(),
    included_in_membership: z.boolean(),
    outcomes: z.array(z.string().max(200)).max(12),
    requirements: z.array(z.string().max(200)).max(12),
    audience: z.array(z.string().max(200)).max(12),
  })
  .refine((v) => v.compare_at_price_minor === null || v.compare_at_price_minor > v.price_minor, {
    message: "The “was” price must be higher than the price",
    path: ["compare_at_price_minor"],
  });

export async function updateCourseDetails(
  courseId: string,
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  await requireInstructor();
  if (!uuid.safeParse(courseId).success) return { ok: false, error: "Course not found." };
  const price = rupeesToPaise(fd.get("price"));
  const compare = rupeesToPaise(fd.get("compare_at_price"));
  const parsed = detailsSchema.safeParse({
    title: fd.get("title"),
    slug: fd.get("slug"),
    subtitle: fd.get("subtitle") ?? "",
    description: fd.get("description") ?? "",
    category_id: fd.get("category_id") ?? "",
    level: fd.get("level"),
    language: fd.get("language") || "English",
    price_minor: price === null || Number.isNaN(price) ? undefined : price,
    compare_at_price_minor: compare === null ? null : Number.isNaN(compare) ? undefined : compare,
    included_in_membership: fd.get("included_in_membership") === "on",
    outcomes: lines(fd.get("outcomes")),
    requirements: lines(fd.get("requirements")),
    audience: lines(fd.get("audience")),
  });
  if (!parsed.success) {
    const res = invalid(parsed.error);
    // Map back to the form's field names for prices.
    if (!res.ok && res.fieldErrors) {
      if (res.fieldErrors.price_minor) res.fieldErrors.price = res.fieldErrors.price_minor;
      if (res.fieldErrors.compare_at_price_minor)
        res.fieldErrors.compare_at_price = res.fieldErrors.compare_at_price_minor;
    }
    return res;
  }
  const v = parsed.data;
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("courses")
    .update({ ...v, category_id: v.category_id || null })
    .eq("id", courseId)
    .select("id");
  if (error) return dbError(error);
  if (!data?.length) return { ok: false, error: "Course not found, or you can’t edit it." };
  return done("Course details saved");
}

export async function setCoverImage(courseId: string, path: string): Promise<ActionResult> {
  await requireInstructor();
  if (!uuid.safeParse(courseId).success || !path.startsWith(`${courseId}/`) || path.includes("..")) {
    return { ok: false, error: "Invalid image path." };
  }
  const supabase = await getServerSupabase();
  const { data: before } = await supabase.from("courses").select("cover_image_path").eq("id", courseId).single();
  const { error } = await supabase.from("courses").update({ cover_image_path: path }).eq("id", courseId);
  if (error) return dbError(error);
  if (before?.cover_image_path && before.cover_image_path !== path) {
    await supabase.storage.from("course-images").remove([before.cover_image_path]);
  }
  return done("Cover image updated");
}

export async function submitForReview(courseId: string): Promise<ActionResult> {
  await requireInstructor();
  const supabase = await getServerSupabase();
  const { error } = await supabase.rpc("submit_course_for_review", { p_course_id: courseId });
  if (error) return dbError(error);
  return done("Submitted for review");
}

export async function withdrawFromReview(courseId: string): Promise<ActionResult> {
  await requireInstructor();
  const supabase = await getServerSupabase();
  const { error } = await supabase.rpc("withdraw_course_submission", { p_course_id: courseId });
  if (error) return dbError(error);
  return done("Withdrawn from review — you can edit again");
}

export async function deleteCourse(courseId: string): Promise<ActionResult> {
  await requireInstructor();
  const supabase = await getServerSupabase();
  const { data: course } = await supabase
    .from("courses")
    .select("status, published_at")
    .eq("id", courseId)
    .maybeSingle();
  if (!course || !["draft", "rejected"].includes(course.status) || course.published_at) {
    return { ok: false, error: "Only drafts that were never published can be deleted." };
  }
  // Remove files first: storage policies check ownership through the course row.
  const { data: res } = await supabase.from("lesson_resources").select("storage_path").eq("course_id", courseId);
  if (res?.length) await supabase.storage.from("lesson-resources").remove(res.map((r) => r.storage_path));
  const { data: files } = await supabase.storage.from("course-images").list(courseId);
  if (files?.length) await supabase.storage.from("course-images").remove(files.map((f) => `${courseId}/${f.name}`));
  const { data, error } = await supabase.from("courses").delete().eq("id", courseId).select("id");
  if (error) return dbError(error);
  if (!data?.length) return { ok: false, error: "Only drafts that were never published can be deleted." };
  updateTag(CATALOG_TAG);
  redirect("/instructor");
}

// ── Modules ───────────────────────────────────────────────────────────
const titleSchema = z.object({ title: z.string().trim().min(2, "At least 2 characters").max(120) });

export async function addModule(courseId: string, _prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireInstructor();
  const parsed = titleSchema.safeParse({ title: fd.get("title") });
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await getServerSupabase();
  const { count } = await supabase
    .from("course_modules")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);
  const { error } = await supabase
    .from("course_modules")
    .insert({ course_id: courseId, title: parsed.data.title, position: count ?? 0 });
  if (error) return dbError(error);
  return done("Module added");
}

export async function renameModule(moduleId: string, _prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireInstructor();
  const parsed = titleSchema.safeParse({ title: fd.get("title") });
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("course_modules").update({ title: parsed.data.title }).eq("id", moduleId);
  if (error) return dbError(error);
  return done("Module renamed");
}

export async function deleteModule(moduleId: string): Promise<ActionResult> {
  await requireInstructor();
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.from("course_modules").delete().eq("id", moduleId).select("id");
  if (error) return dbError(error);
  if (!data?.length) return { ok: false, error: "Module not found." };
  return done("Module deleted");
}

/** Swaps position with the neighbour above or below. */
async function move(
  table: "course_modules" | "lessons",
  id: string,
  dir: "up" | "down",
  scope: "course_id" | "module_id",
) {
  const supabase = await getServerSupabase();
  const { data: row } = await supabase.from(table).select(`id, position, ${scope}`).eq("id", id).single();
  if (!row) return { ok: false, error: "Not found." } as ActionResult;
  const scopeId = (row as Record<string, string>)[scope]!;
  const { data: siblings } = await supabase
    .from(table)
    .select("id, position")
    .eq(scope, scopeId)
    .order("position")
    .order("id");
  const list = siblings ?? [];
  const i = list.findIndex((s) => s.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true } as ActionResult;
  [list[i], list[j]] = [list[j]!, list[i]!];
  for (let k = 0; k < list.length; k++) {
    if (list[k]!.position !== k) {
      const { error } = await supabase.from(table).update({ position: k }).eq("id", list[k]!.id);
      if (error) return dbError(error);
    }
  }
  return done("Order updated");
}

export async function moveModule(moduleId: string, dir: "up" | "down"): Promise<ActionResult> {
  await requireInstructor();
  return move("course_modules", moduleId, dir, "course_id");
}

// ── Lessons ───────────────────────────────────────────────────────────
const lessonSchema = z.object({
  title: z.string().trim().min(2, "At least 2 characters").max(160),
  type: z.enum(["video", "reading", "quiz", "assignment"]),
  duration_minutes: z.coerce.number({ message: "Minutes as a whole number" }).int().min(0).max(1440),
  is_preview: z.boolean(),
  video_provider: z.string().trim().max(40),
  video_asset_id: z.string().trim().max(200),
  body: z.string().max(50000),
});

function parseLesson(fd: FormData) {
  return lessonSchema.safeParse({
    title: fd.get("title"),
    type: fd.get("type") ?? "video",
    duration_minutes: fd.get("duration_minutes") || 0,
    is_preview: fd.get("is_preview") === "on",
    video_provider: fd.get("video_provider") ?? "",
    video_asset_id: fd.get("video_asset_id") ?? "",
    body: fd.get("body") ?? "",
  });
}

export async function addLesson(
  courseId: string,
  moduleId: string,
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  await requireInstructor();
  const parsed = parseLesson(fd);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const supabase = await getServerSupabase();
  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("module_id", moduleId);
  const { error } = await supabase.from("lessons").insert({
    ...v,
    course_id: courseId,
    module_id: moduleId,
    position: count ?? 0,
    video_provider: v.video_provider || null,
    video_asset_id: v.video_asset_id || null,
    body: v.body || null,
  });
  if (error) return dbError(error);
  return done("Lesson added");
}

export async function updateLesson(lessonId: string, _prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireInstructor();
  const parsed = parseLesson(fd);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("lessons")
    .update({
      ...v,
      video_provider: v.video_provider || null,
      video_asset_id: v.video_asset_id || null,
      body: v.body || null,
    })
    .eq("id", lessonId)
    .select("id");
  if (error) return dbError(error);
  if (!data?.length) return { ok: false, error: "Lesson not found." };
  return done("Lesson saved");
}

export async function deleteLesson(lessonId: string): Promise<ActionResult> {
  await requireInstructor();
  const supabase = await getServerSupabase();
  const { data: res } = await supabase.from("lesson_resources").select("storage_path").eq("lesson_id", lessonId);
  const { data, error } = await supabase.from("lessons").delete().eq("id", lessonId).select("id");
  if (error) return dbError(error);
  if (!data?.length) return { ok: false, error: "Lesson not found." };
  if (res?.length) await supabase.storage.from("lesson-resources").remove(res.map((r) => r.storage_path));
  return done("Lesson deleted");
}

export async function moveLesson(lessonId: string, dir: "up" | "down"): Promise<ActionResult> {
  await requireInstructor();
  return move("lessons", lessonId, dir, "module_id");
}

// ── Lesson resources (files are uploaded from the browser, RLS-checked) ──
const resourceSchema = z.object({
  title: z.string().trim().min(1).max(160),
  path: z.string().max(500),
  size: z.number().int().min(0).max(52_428_800),
  mime: z.string().max(200),
});

export async function registerResource(
  courseId: string,
  lessonId: string,
  input: { title: string; path: string; size: number; mime: string },
): Promise<ActionResult> {
  await requireInstructor();
  const parsed = resourceSchema.safeParse(input);
  if (!parsed.success || !parsed.data.path.startsWith(`${courseId}/${lessonId}/`) || parsed.data.path.includes("..")) {
    return { ok: false, error: "Invalid file." };
  }
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("lesson_resources").insert({
    course_id: courseId,
    lesson_id: lessonId,
    title: parsed.data.title,
    storage_path: parsed.data.path,
    file_size_bytes: parsed.data.size,
    mime_type: parsed.data.mime || null,
  });
  if (error) {
    await supabase.storage.from("lesson-resources").remove([parsed.data.path]);
    return dbError(error);
  }
  return done("File added");
}

export async function deleteResource(resourceId: string): Promise<ActionResult> {
  await requireInstructor();
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.from("lesson_resources").delete().eq("id", resourceId).select("storage_path");
  if (error) return dbError(error);
  if (!data?.length) return { ok: false, error: "File not found." };
  await supabase.storage.from("lesson-resources").remove([data[0]!.storage_path]);
  return done("File removed");
}
