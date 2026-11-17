import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AppRole = "student" | "instructor" | "affiliate" | "admin" | "super_admin";

export type Viewer = {
  id: string;
  email: string;
  fullName: string | null;
  roles: Set<AppRole>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isInstructor: boolean;
  isAffiliate: boolean;
};

/**
 * The signed-in user with their active roles, or null. Memoised per request.
 * Uses auth.getUser(), which validates the session with Supabase rather than
 * trusting the cookie contents.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from("profiles").select("email, full_name").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("status", "active"),
  ]);
  const roles = new Set<AppRole>((roleRows ?? []).map((r) => r.role as AppRole));
  return {
    id: user.id,
    email: profile?.email ?? user.email ?? "",
    fullName: profile?.full_name ?? null,
    roles,
    isAdmin: roles.has("admin") || roles.has("super_admin"),
    isSuperAdmin: roles.has("super_admin"),
    isInstructor: roles.has("instructor"),
    isAffiliate: roles.has("affiliate"),
  };
});

export async function requireViewer(next = "/dashboard"): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer;
}

/** UI gate only — the database enforces the same rules with RLS. */
export async function requireInstructor(): Promise<Viewer> {
  const viewer = await requireViewer("/instructor");
  if (!viewer.isInstructor && !viewer.isAdmin) redirect("/dashboard/teach");
  return viewer;
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireViewer("/admin");
  if (!viewer.isAdmin) redirect("/dashboard");
  return viewer;
}
