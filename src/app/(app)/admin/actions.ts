"use server";

import { z } from "zod";
import { refresh, updateTag } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/viewer";
import { dbError, invalid, type ActionResult } from "@/lib/actions";
import { CATALOG_TAG } from "@/lib/catalog/db";

/**
 * Admin actions. Each one re-checks admin access here AND in the database
 * (RPCs check is_admin(); RLS limits direct writes). Every change is written
 * to the audit log by the database.
 */
const uuid = z.string().uuid();
const done = (message: string, catalog = true): ActionResult => {
  if (catalog) updateTag(CATALOG_TAG);
  refresh();
  return { ok: true, message };
};

// ── Courses ───────────────────────────────────────────────────────────
const decisionSchema = z.object({
  decision: z.enum(["published", "rejected", "draft", "archived"]),
  reason: z.string().trim().max(2000),
});

export async function setCourseStatus(
  courseId: string,
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = decisionSchema.safeParse({ decision: fd.get("decision"), reason: fd.get("reason") ?? "" });
  if (!parsed.success || !uuid.safeParse(courseId).success) return { ok: false, error: "Choose a decision." };
  if (parsed.data.decision === "rejected" && !parsed.data.reason) {
    return {
      ok: false,
      error: "Tell the instructor what to change.",
      fieldErrors: { reason: "Required when requesting changes" },
    };
  }
  const supabase = await getServerSupabase();
  const { error } = await supabase.rpc("admin_set_course_status", {
    p_course_id: courseId,
    p_decision: parsed.data.decision,
    p_reason: parsed.data.reason || null,
  });
  if (error) return dbError(error);
  const label = {
    published: "Course published",
    rejected: "Changes requested",
    draft: "Course unpublished",
    archived: "Course archived",
  };
  return done(label[parsed.data.decision]);
}

export async function setCourseFeatured(courseId: string, featured: boolean): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("courses").update({ is_featured: featured }).eq("id", courseId);
  if (error) return dbError(error);
  await supabase.rpc("admin_log", {
    p_action: featured ? "course.featured" : "course.unfeatured",
    p_entity_type: "course",
    p_entity_id: courseId,
    p_after: { is_featured: featured },
  });
  return done(featured ? "Featured on the homepage" : "Removed from featured");
}

// ── Categories ────────────────────────────────────────────────────────
const categorySchema = z.object({
  name: z.string().trim().min(2, "At least 2 characters").max(80),
  short_name: z.string().trim().min(2, "At least 2 characters").max(24),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens"),
  description: z.string().trim().max(400),
  hue: z.coerce.number().int().min(0, "0–359").max(359, "0–359"),
  sort_order: z.coerce.number().int().min(0).max(1000),
  is_active: z.boolean(),
});

export async function saveCategory(
  categoryId: string | null,
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    name: fd.get("name"),
    short_name: fd.get("short_name"),
    slug: fd.get("slug"),
    description: fd.get("description") ?? "",
    hue: fd.get("hue") || 240,
    sort_order: fd.get("sort_order") || 0,
    is_active: fd.get("is_active") === "on",
  });
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await getServerSupabase();
  const { data, error } = categoryId
    ? await supabase.from("categories").update(parsed.data).eq("id", categoryId).select("id").single()
    : await supabase.from("categories").insert(parsed.data).select("id").single();
  if (error) return dbError(error);
  await supabase.rpc("admin_log", {
    p_action: categoryId ? "category.updated" : "category.created",
    p_entity_type: "category",
    p_entity_id: data.id,
    p_after: parsed.data,
  });
  return done(categoryId ? "Category saved" : "Category created");
}

// ── Applications ──────────────────────────────────────────────────────
const reviewSchema = z.object({
  decision: z.enum(["approved", "rejected", "suspended"]),
  reason: z.string().trim().max(2000),
  share_percent: z.string().trim(),
});

export async function reviewInstructor(
  userId: string,
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = reviewSchema.safeParse({
    decision: fd.get("decision"),
    reason: fd.get("reason") ?? "",
    share_percent: fd.get("share_percent") ?? "",
  });
  if (!parsed.success) return { ok: false, error: "Choose a decision." };
  let bps: number | null = null;
  if (parsed.data.decision === "approved") {
    // Percent with up to 2 decimals → integer basis points, no floats stored.
    const m = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(parsed.data.share_percent);
    bps = m ? Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0")) : NaN;
    if (!m || bps > 10000) {
      return {
        ok: false,
        error: "Enter the instructor share as a percentage from 0 to 100.",
        fieldErrors: { share_percent: "0–100" },
      };
    }
  } else if (!parsed.data.reason) {
    return { ok: false, error: "Give a reason the applicant will see.", fieldErrors: { reason: "Required" } };
  }
  const supabase = await getServerSupabase();
  const { error } = await supabase.rpc("admin_review_instructor", {
    p_user_id: userId,
    p_decision: parsed.data.decision,
    p_revenue_share_bps: bps,
    p_reason: parsed.data.reason || null,
  });
  if (error) return dbError(error);
  return done(`Instructor ${parsed.data.decision}`);
}

export async function reviewAffiliate(userId: string, _prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = reviewSchema.safeParse({
    decision: fd.get("decision"),
    reason: fd.get("reason") ?? "",
    share_percent: "",
  });
  if (!parsed.success) return { ok: false, error: "Choose a decision." };
  if (parsed.data.decision !== "approved" && !parsed.data.reason) {
    return { ok: false, error: "Give a reason the applicant will see.", fieldErrors: { reason: "Required" } };
  }
  const supabase = await getServerSupabase();
  const { error } = await supabase.rpc("admin_review_affiliate", {
    p_user_id: userId,
    p_decision: parsed.data.decision,
    p_reason: parsed.data.reason || null,
  });
  if (error) return dbError(error);
  return done(`Affiliate ${parsed.data.decision}`, false);
}

// ── Roles ─────────────────────────────────────────────────────────────
export async function setAdminRole(
  userId: string,
  role: "admin" | "super_admin",
  active: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await getServerSupabase();
  const { error } = await supabase.rpc("admin_set_role", { p_user_id: userId, p_role: role, p_active: active });
  if (error) return dbError(error);
  return done(active ? "Role granted" : "Role removed", false);
}

// ── Support tickets ───────────────────────────────────────────────────
const ticketSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  admin_note: z.string().trim().max(2000),
});

export async function updateTicket(ticketId: string, _prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = ticketSchema.safeParse({ status: fd.get("status"), admin_note: fd.get("admin_note") ?? "" });
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("support_tickets")
    .update({ status: parsed.data.status, admin_note: parsed.data.admin_note || null })
    .eq("id", ticketId);
  if (error) return dbError(error);
  return done("Ticket updated", false);
}
