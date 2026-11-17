import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { PageTitle, Panel } from "@/components/app/page-title";
import { ActionForm, SubmitButton } from "@/components/app/action-form";
import { ActionButton } from "@/components/app/action-button";
import { SelectField, TextAreaField } from "@/components/app/fields";
import { CourseView } from "@/components/catalog/course-view";
import { Button } from "@/components/ui/button";
import { Badge, Notice } from "@/components/ui/feedback";
import { requireAdmin } from "@/lib/auth/viewer";
import { getManagedCourse, listAllCategories, STATUS_LABEL, STATUS_TONE, toPreviewCourse } from "@/lib/courses/manage";
import { setCourseFeatured, setCourseStatus } from "../../actions";

export const metadata: Metadata = { title: "Admin · Review course", robots: { index: false } };

export default async function AdminCourseReview({ params }: PageProps<"/admin/courses/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [course, categories] = await Promise.all([getManagedCourse(id), listAllCategories()]);
  if (!course) notFound();
  const lessons = course.modules.flatMap((m) => m.lessons);

  // Quick checklist to support the review decision.
  const checks = [
    { ok: Boolean(course.category_id), label: "Category chosen" },
    {
      ok: course.subtitle.length >= 10 && course.description.length >= 50,
      label: "Subtitle and description filled in",
    },
    { ok: course.outcomes.length > 0, label: "At least one learning outcome" },
    { ok: lessons.length > 0, label: `${lessons.length} lessons in ${course.modules.length} modules` },
    { ok: lessons.some((l) => l.is_preview), label: "Has a free preview lesson" },
    {
      ok: lessons.filter((l) => l.type === "video").every((l) => l.video_asset_id),
      label: "Every video lesson has a video ID",
    },
    { ok: Boolean(course.cover_image_path), label: "Cover image uploaded" },
  ];

  return (
    <>
      <p className="mb-3 text-sm">
        <Link href="/admin/courses" className="text-primary hover:underline">
          ← Courses
        </Link>
      </p>
      <PageTitle
        title={course.title}
        description={<Badge tone={STATUS_TONE[course.status]}>{STATUS_LABEL[course.status]}</Badge>}
        actions={
          <Button asChild variant="secondary">
            <Link href={`/instructor/courses/${course.id}`}>
              <Pencil /> Open in editor
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="order-2 overflow-hidden rounded-xl border border-line xl:order-1">
          <CourseView
            course={toPreviewCourse(course, categories)}
            category={categories.find((c) => c.id === course.category_id)}
            instructor={null}
            purchase={<p className="text-sm text-subtle">Preview</p>}
          />
        </div>

        <div className="order-1 space-y-6 xl:order-2">
          <Panel title="Decision">
            {course.rejection_reason && course.status === "rejected" && (
              <Notice tone="warning" className="mb-4" title="Last feedback">
                {course.rejection_reason}
              </Notice>
            )}
            <ActionForm action={setCourseStatus.bind(null, course.id)} className="space-y-4">
              <SelectField
                name="decision"
                label="Set status"
                defaultValue={course.status === "published" ? "draft" : "published"}
              >
                <option value="published">Publish</option>
                <option value="rejected">Request changes</option>
                <option value="draft">Unpublish (back to draft)</option>
                <option value="archived">Archive (enrolled learners keep access)</option>
              </SelectField>
              <TextAreaField
                name="reason"
                label="Message to the instructor"
                hint="Required when requesting changes."
                rows={4}
              />
              <SubmitButton className="w-full">Apply decision</SubmitButton>
            </ActionForm>
          </Panel>

          <Panel title="Review checklist">
            <ul className="space-y-2 text-sm">
              {checks.map((c) => (
                <li key={c.label} className={c.ok ? "text-text" : "text-danger"}>
                  {c.ok ? "✓" : "✗"} {c.label}
                </li>
              ))}
            </ul>
          </Panel>

          {course.status === "published" && (
            <Panel title="Homepage">
              <ActionButton variant="secondary" action={setCourseFeatured.bind(null, course.id, !course.is_featured)}>
                {course.is_featured ? "Remove from featured" : "Feature on homepage"}
              </ActionButton>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
