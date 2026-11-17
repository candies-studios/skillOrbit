"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/auth/viewer";
import { dbError, invalid, type ActionResult } from "@/lib/actions";
import { CATALOG_TAG } from "@/lib/catalog/db";

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^([A-Z]{2})?$/, "Use a 2-letter country code, e.g. IN"),
});

export async function updateProfile(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const viewer = await requireViewer();
  const parsed = profileSchema.safeParse({ full_name: fd.get("full_name"), country: fd.get("country") ?? "" });
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, country: parsed.data.country || null })
    .eq("id", viewer.id);
  if (error) return dbError(error);
  return { ok: true, message: "Profile saved" };
}

const instructorSchema = z.object({
  display_name: z.string().trim().min(2, "Enter the name learners will see").max(80),
  headline: z.string().trim().min(2, "Add a short headline").max(120),
  bio: z.string().trim().min(20, "Write at least 20 characters about your experience").max(3000),
  expertise: z.array(z.string().trim().min(1).max(40)).max(10, "List up to 10 topics"),
  location: z.string().trim().max(80),
  website_url: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Use a full link starting with https://"),
  application_note: z.string().trim().max(3000),
});

export async function saveInstructorApplication(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const viewer = await requireViewer();
  const parsed = instructorSchema.safeParse({
    display_name: fd.get("display_name"),
    headline: fd.get("headline"),
    bio: fd.get("bio"),
    expertise: String(fd.get("expertise") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    location: fd.get("location") ?? "",
    website_url: fd.get("website_url") ?? "",
    application_note: fd.get("application_note") ?? "",
  });
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const supabase = await getServerSupabase();
  const row = {
    user_id: viewer.id,
    display_name: v.display_name,
    headline: v.headline,
    bio: v.bio,
    expertise: v.expertise,
    location: v.location || null,
    website_url: v.website_url || null,
    application_note: v.application_note || null,
  };
  const { data: existing } = await supabase
    .from("instructor_profiles")
    .select("status")
    .eq("user_id", viewer.id)
    .maybeSingle();
  const { error } = existing
    ? await supabase.from("instructor_profiles").update(row).eq("user_id", viewer.id)
    : await supabase.from("instructor_profiles").insert(row);
  if (error) return dbError(error);
  if (existing?.status === "approved") updateTag(CATALOG_TAG); // public profile changed
  return {
    ok: true,
    message: !existing
      ? "Application sent"
      : existing.status === "rejected"
        ? "Application resubmitted"
        : "Profile saved",
  };
}

const affiliateSchema = z.object({
  promotion_channels: z.string().trim().min(10, "Tell us where you’ll share links (at least 10 characters)").max(2000),
  website_url: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Use a full link starting with https://"),
  accept_terms: z.literal("on", { message: "Accept the affiliate terms to apply" }),
});

export async function saveAffiliateApplication(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const viewer = await requireViewer();
  const parsed = affiliateSchema.safeParse({
    promotion_channels: fd.get("promotion_channels"),
    website_url: fd.get("website_url") ?? "",
    accept_terms: fd.get("accept_terms") ?? undefined,
  });
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await getServerSupabase();
  const row = {
    user_id: viewer.id,
    promotion_channels: parsed.data.promotion_channels,
    website_url: parsed.data.website_url || null,
    terms_accepted_at: new Date().toISOString(),
  };
  const { data: existing } = await supabase
    .from("affiliate_profiles")
    .select("status")
    .eq("user_id", viewer.id)
    .maybeSingle();
  const { error } = existing
    ? await supabase.from("affiliate_profiles").update(row).eq("user_id", viewer.id)
    : await supabase.from("affiliate_profiles").insert(row);
  if (error) return dbError(error);
  return { ok: true, message: existing ? "Application updated" : "Application sent" };
}

export async function markNotificationsRead(): Promise<ActionResult> {
  const viewer = await requireViewer();
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", viewer.id)
    .is("read_at", null);
  if (error) return dbError(error);
  return { ok: true, message: "Marked as read" };
}
