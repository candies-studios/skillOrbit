import type { Metadata } from "next";
import Link from "next/link";
import { Bell, BookOpen } from "lucide-react";
import { PageTitle, Panel } from "@/components/app/page-title";
import { ActionForm, SubmitButton } from "@/components/app/action-form";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { CourseCover } from "@/components/catalog/course-cover";
import { requireViewer } from "@/lib/auth/viewer";
import { getServerSupabase } from "@/lib/supabase/server";
import { publicImageUrl } from "@/lib/catalog/db";
import { markNotificationsRead } from "./actions";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

const STATUS_TONE = { pending: "marigold", approved: "success", rejected: "danger", suspended: "danger" } as const;
const STATUS_LABEL = {
  pending: "In review",
  approved: "Approved",
  rejected: "Needs changes",
  suspended: "Suspended",
} as const;
type AppStatus = keyof typeof STATUS_TONE;

export default async function DashboardPage() {
  const viewer = await requireViewer();
  const supabase = await getServerSupabase();
  const [enrolRes, notesRes, instrRes, affRes] = await Promise.all([
    supabase
      .from("enrollments")
      .select(
        "id, enrolled_at, course:courses(id, slug, title, subtitle, cover_image_path, category:categories(hue, short_name))",
      )
      .eq("user_id", viewer.id)
      .eq("status", "active")
      .order("enrolled_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("id, title, body, link, read_at, created_at")
      .eq("user_id", viewer.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("instructor_profiles").select("status").eq("user_id", viewer.id).maybeSingle(),
    supabase.from("affiliate_profiles").select("status").eq("user_id", viewer.id).maybeSingle(),
  ]);

  type EnrolRow = {
    id: string;
    course: {
      id: string;
      slug: string;
      title: string;
      subtitle: string;
      cover_image_path: string | null;
      category: { hue: number; short_name: string } | null;
    } | null;
  };
  const enrolments = ((enrolRes.data ?? []) as unknown as EnrolRow[]).filter((e) => e.course);
  const notes = notesRes.data ?? [];
  const unread = notes.filter((n) => !n.read_at).length;
  const instructorStatus = instrRes.data?.status as AppStatus | undefined;
  const affiliateStatus = affRes.data?.status as AppStatus | undefined;
  const firstName = viewer.fullName?.split(" ")[0];

  return (
    <>
      <PageTitle
        title={firstName ? `Welcome, ${firstName}` : "Welcome"}
        description="Your courses, applications and updates."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Panel title="My courses">
          {enrolments.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="You haven’t enrolled in a course yet"
              description="Browse the catalogue and start with a free preview."
              action={
                <Button asChild>
                  <Link href="/courses">Browse courses</Link>
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {enrolments.map(({ id, course }) => (
                <li key={id} className="overflow-hidden rounded-lg border border-line">
                  <CourseCover
                    seed={course!.id}
                    hue={course!.category?.hue ?? 240}
                    label={course!.category?.short_name}
                    imageUrl={publicImageUrl("course-images", course!.cover_image_path)}
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-text">{course!.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{course!.subtitle}</p>
                    <p className="mt-3 text-sm">
                      <Link
                        href={`/courses/${course!.slug}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Course page
                      </Link>
                      <span className="text-subtle"> · The course player arrives in the next release.</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Updates">
            {notes.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-subtle">
                <Bell className="size-4" aria-hidden /> No updates yet.
              </p>
            ) : (
              <>
                <ul className="space-y-3">
                  {notes.map((n) => (
                    <li key={n.id} className="text-sm">
                      <p className={n.read_at ? "text-muted" : "font-medium text-text"}>
                        {n.link ? (
                          <Link href={n.link} className="hover:underline">
                            {n.title}
                          </Link>
                        ) : (
                          n.title
                        )}
                      </p>
                      {n.body && <p className="mt-0.5 text-subtle">{n.body}</p>}
                    </li>
                  ))}
                </ul>
                {unread > 0 && (
                  <ActionForm action={markNotificationsRead} className="mt-4">
                    <SubmitButton variant="secondary" size="sm">
                      Mark all as read
                    </SubmitButton>
                  </ActionForm>
                )}
              </>
            )}
          </Panel>

          <Panel title="Teach and earn">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between gap-3">
                <Link
                  href={viewer.isInstructor ? "/instructor" : "/dashboard/teach"}
                  className="text-primary hover:underline"
                >
                  Instructor
                </Link>
                {instructorStatus ? (
                  <Badge tone={STATUS_TONE[instructorStatus]}>{STATUS_LABEL[instructorStatus]}</Badge>
                ) : (
                  <span className="text-subtle">Not applied</span>
                )}
              </li>
              <li className="flex items-center justify-between gap-3">
                <Link href="/dashboard/affiliate" className="text-primary hover:underline">
                  Affiliate
                </Link>
                {affiliateStatus ? (
                  <Badge tone={STATUS_TONE[affiliateStatus]}>{STATUS_LABEL[affiliateStatus]}</Badge>
                ) : (
                  <span className="text-subtle">Not applied</span>
                )}
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
