import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseView } from "@/components/catalog/course-view";
import { Notice } from "@/components/ui/feedback";
import { requireInstructor } from "@/lib/auth/viewer";
import { getManagedCourse, listAllCategories, STATUS_LABEL, toPreviewCourse } from "@/lib/courses/manage";
import { getServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Course preview", robots: { index: false } };

/** Shows an unpublished course exactly as learners will see it. Owners and admins only (RLS). */
export default async function CoursePreviewPage({ params }: PageProps<"/instructor/courses/[id]/preview">) {
  await requireInstructor();
  const { id } = await params;
  const [course, categories] = await Promise.all([getManagedCourse(id), listAllCategories()]);
  if (!course) notFound();
  const supabase = await getServerSupabase();
  const { data: ins } = await supabase
    .from("instructor_profiles")
    .select("slug, display_name, headline, bio, expertise, location")
    .eq("user_id", course.owner_id)
    .maybeSingle();
  const preview = toPreviewCourse(course, categories, ins?.slug ?? "");

  return (
    <div className="-mx-5 sm:-mx-8 lg:mx-0">
      <Notice tone="info" title={`Preview · ${STATUS_LABEL[course.status]}`} className="mx-5 mb-4 sm:mx-8 lg:mx-0">
        This is how the course page will look.{" "}
        <Link className="underline" href={`/instructor/courses/${course.id}`}>
          Back to editing
        </Link>
      </Notice>
      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        <CourseView
          course={preview}
          category={categories.find((c) => c.id === course.category_id)}
          instructor={
            ins
              ? {
                  id: course.owner_id,
                  slug: ins.slug ?? "",
                  displayName: ins.display_name,
                  headline: ins.headline,
                  bio: ins.bio,
                  expertise: ins.expertise ?? [],
                  location: ins.location ?? "",
                  isFeatured: false,
                  isSample: false,
                }
              : null
          }
          purchase={
            <p className="text-sm text-subtle">Buy and enrol buttons appear here once the course is published.</p>
          }
        />
      </div>
    </div>
  );
}
