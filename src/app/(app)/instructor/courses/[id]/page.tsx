import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, FileText, Trash2 } from "lucide-react";
import { PageTitle, Panel } from "@/components/app/page-title";
import { ActionForm, SubmitButton } from "@/components/app/action-form";
import { ActionButton } from "@/components/app/action-button";
import { SelectField, TextAreaField, TextField } from "@/components/app/fields";
import { LessonFields } from "@/components/app/lesson-fields";
import { CoverUploader, ResourceUploader } from "@/components/app/uploaders";
import { CourseCover } from "@/components/catalog/course-cover";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, Notice } from "@/components/ui/feedback";
import { Checkbox } from "@/components/ui/form-controls";
import { requireInstructor } from "@/lib/auth/viewer";
import { getManagedCourse, listAllCategories, STATUS_LABEL, STATUS_TONE } from "@/lib/courses/manage";
import { publicImageUrl } from "@/lib/catalog/db";
import { paiseToRupeesInput } from "@/lib/actions";
import { formatDuration } from "@/lib/utils";
import * as A from "../../actions";

export const metadata: Metadata = { title: "Edit course", robots: { index: false } };

export default async function EditCoursePage({ params }: PageProps<"/instructor/courses/[id]">) {
  const viewer = await requireInstructor();
  const { id } = await params;
  const [course, categories] = await Promise.all([getManagedCourse(id), listAllCategories()]);
  if (!course) notFound();

  const locked = course.status === "in_review" && !viewer.isAdmin;
  const canDelete = ["draft", "rejected"].includes(course.status) && !course.published_at;
  const category = categories.find((c) => c.id === course.category_id);
  const lessonCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);
  const minutes = course.modules.reduce((n, m) => n + m.lessons.reduce((k, l) => k + l.duration_minutes, 0), 0);

  return (
    <>
      <p className="mb-3 text-sm">
        <Link
          href={viewer.isAdmin && course.owner_id !== viewer.id ? "/admin/courses" : "/instructor"}
          className="text-primary hover:underline"
        >
          ← All courses
        </Link>
      </p>
      <PageTitle
        title={course.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[course.status]}>{STATUS_LABEL[course.status]}</Badge>
            {course.is_platform_owned && <Badge tone="primary">Platform course</Badge>}
            <span className="text-sm text-subtle">
              {lessonCount} lessons · {formatDuration(minutes)}
            </span>
          </span>
        }
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href={`/instructor/courses/${course.id}/preview`}>
                <Eye /> Preview
              </Link>
            </Button>
            {(course.status === "draft" || course.status === "rejected") && (
              <ActionButton action={A.submitForReview.bind(null, course.id)}>Submit for review</ActionButton>
            )}
            {course.status === "in_review" && (
              <ActionButton variant="secondary" action={A.withdrawFromReview.bind(null, course.id)}>
                Withdraw to edit
              </ActionButton>
            )}
          </>
        }
      />

      <div className="space-y-6">
        {course.status === "rejected" && course.rejection_reason && (
          <Notice tone="warning" title="Changes requested by the review team">
            {course.rejection_reason}
          </Notice>
        )}
        {course.status === "in_review" && (
          <Notice tone="info" title="In review">
            Editing is locked while the team reviews this course. Withdraw it if you need to make changes.
          </Notice>
        )}
        {course.status === "published" && (
          <Notice tone="success" title="This course is live">
            Changes you save here appear on the public course page straight away.{" "}
            <Link className="underline" href={`/courses/${course.slug}`}>
              View it
            </Link>
          </Notice>
        )}

        <fieldset disabled={locked} className="space-y-6 disabled:opacity-70">
          <Panel title="Course details" description="What learners see on the course page.">
            <ActionForm action={A.updateCourseDetails.bind(null, course.id)} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-[1fr_16rem]">
                <TextField name="title" label="Title" required defaultValue={course.title} maxLength={120} />
                <TextField
                  name="slug"
                  label="Web address"
                  required
                  hint={`/courses/${course.slug}`}
                  defaultValue={course.slug}
                />
              </div>
              <TextField
                name="subtitle"
                label="Subtitle"
                hint="One sentence, at least 10 characters."
                defaultValue={course.subtitle}
                maxLength={200}
              />
              <TextAreaField
                name="description"
                label="Description"
                rows={6}
                hint="At least 50 characters."
                defaultValue={course.description}
              />
              <div className="grid gap-5 sm:grid-cols-3">
                <SelectField name="category_id" label="Category" defaultValue={course.category_id ?? ""}>
                  <option value="">Choose a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField name="level" label="Level" defaultValue={course.level}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </SelectField>
                <TextField name="language" label="Language" defaultValue={course.language} />
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <TextField
                  name="price"
                  label="Price (₹)"
                  inputMode="decimal"
                  hint="0 makes it free."
                  defaultValue={paiseToRupeesInput(course.price_minor)}
                />
                <TextField
                  name="compare_at_price"
                  label="Was price (₹)"
                  inputMode="decimal"
                  hint="Optional, shown struck through."
                  defaultValue={paiseToRupeesInput(course.compare_at_price_minor)}
                />
                <label className="flex items-center gap-2 self-center pt-6 text-sm text-text">
                  <Checkbox name="included_in_membership" defaultChecked={course.included_in_membership} /> Included in
                  membership
                </label>
              </div>
              <TextAreaField
                name="outcomes"
                label="What learners will be able to do"
                hint="One per line, up to 12."
                rows={4}
                defaultValue={course.outcomes.join("\n")}
              />
              <div className="grid gap-5 md:grid-cols-2">
                <TextAreaField
                  name="requirements"
                  label="Requirements"
                  hint="One per line."
                  rows={3}
                  defaultValue={course.requirements.join("\n")}
                />
                <TextAreaField
                  name="audience"
                  label="Who it’s for"
                  hint="One per line."
                  rows={3}
                  defaultValue={course.audience.join("\n")}
                />
              </div>
              <SubmitButton>Save details</SubmitButton>
            </ActionForm>
          </Panel>

          <Panel title="Cover image">
            <div className="grid gap-5 sm:grid-cols-[18rem_1fr] sm:items-center">
              <CourseCover
                seed={course.id}
                hue={category?.hue ?? 240}
                className="rounded-lg"
                imageUrl={publicImageUrl("course-images", course.cover_image_path)}
              />
              <div>
                {!course.cover_image_path && (
                  <p className="mb-3 text-sm text-muted">
                    No image yet — learners see generated artwork in the category colour.
                  </p>
                )}
                <CoverUploader
                  courseId={course.id}
                  onUploaded={A.setCoverImage.bind(null, course.id)}
                  disabled={locked}
                />
              </div>
            </div>
          </Panel>

          <Panel title="Curriculum" description="Modules group lessons. Mark a few lessons as free previews.">
            {course.modules.length === 0 && (
              <EmptyState
                icon={FileText}
                title="No modules yet"
                description="Add your first module below, then add lessons to it."
                className="mb-6"
              />
            )}
            <ol className="space-y-5">
              {course.modules.map((m, mi) => (
                <li key={m.id} className="rounded-lg border border-line">
                  <div className="flex flex-col gap-3 border-b border-line bg-paper/60 p-4 sm:flex-row sm:items-end">
                    <ActionForm
                      action={A.renameModule.bind(null, m.id)}
                      className="flex flex-1 items-end gap-2"
                      successToast={false}
                    >
                      <div className="flex-1">
                        <TextField id={`mod-${m.id}`} name="title" label={`Module ${mi + 1}`} defaultValue={m.title} />
                      </div>
                      <SubmitButton variant="secondary">Rename</SubmitButton>
                    </ActionForm>
                    <div className="flex gap-1">
                      <ActionButton
                        variant="ghost"
                        size="icon"
                        aria-label="Move module up"
                        disabled={mi === 0}
                        action={A.moveModule.bind(null, m.id, "up")}
                      >
                        <ArrowUp />
                      </ActionButton>
                      <ActionButton
                        variant="ghost"
                        size="icon"
                        aria-label="Move module down"
                        disabled={mi === course.modules.length - 1}
                        action={A.moveModule.bind(null, m.id, "down")}
                      >
                        <ArrowDown />
                      </ActionButton>
                      <ActionButton
                        variant="ghost"
                        size="icon"
                        aria-label="Delete module"
                        confirm={`Delete “${m.title}” and its ${m.lessons.length} lessons?`}
                        action={A.deleteModule.bind(null, m.id)}
                      >
                        <Trash2 />
                      </ActionButton>
                    </div>
                  </div>

                  <ul className="divide-y divide-line">
                    {m.lessons.map((l, li) => (
                      <li key={l.id} className="p-4">
                        <details className="group">
                          <summary className="flex cursor-pointer list-none items-center gap-3">
                            <span className="text-sm text-subtle tabular-nums">{li + 1}.</span>
                            <span className="flex-1 font-medium text-text">{l.title}</span>
                            {l.is_preview && <Badge tone="success">Preview</Badge>}
                            <span className="text-sm text-subtle">{l.duration_minutes} min</span>
                            <span className="text-sm text-primary group-open:hidden">Edit</span>
                            <span className="hidden text-sm text-primary group-open:inline">Close</span>
                          </summary>
                          <div className="mt-4 space-y-5">
                            <ActionForm action={A.updateLesson.bind(null, l.id)} className="space-y-4">
                              <LessonFields lesson={l} idPrefix={`l-${l.id}`} />
                              <div className="flex flex-wrap items-center gap-2">
                                <SubmitButton size="sm">Save lesson</SubmitButton>
                                <ActionButton
                                  size="sm"
                                  variant="ghost"
                                  disabled={li === 0}
                                  action={A.moveLesson.bind(null, l.id, "up")}
                                >
                                  <ArrowUp /> Up
                                </ActionButton>
                                <ActionButton
                                  size="sm"
                                  variant="ghost"
                                  disabled={li === m.lessons.length - 1}
                                  action={A.moveLesson.bind(null, l.id, "down")}
                                >
                                  <ArrowDown /> Down
                                </ActionButton>
                                <ActionButton
                                  size="sm"
                                  variant="ghost"
                                  confirm={`Delete the lesson “${l.title}”?`}
                                  action={A.deleteLesson.bind(null, l.id)}
                                >
                                  <Trash2 /> Delete
                                </ActionButton>
                              </div>
                            </ActionForm>
                            <div className="rounded-md border border-line p-4">
                              <p className="text-sm font-medium text-text">Downloadable files</p>
                              <p className="text-xs text-subtle">
                                Private. Enrolled learners get short-lived download links.
                              </p>
                              {l.resources.length > 0 && (
                                <ul className="mt-3 space-y-2 text-sm">
                                  {l.resources.map((r) => (
                                    <li key={r.id} className="flex items-center justify-between gap-3">
                                      <span className="truncate">{r.title}</span>
                                      <ActionButton
                                        size="sm"
                                        variant="ghost"
                                        confirm={`Remove “${r.title}”?`}
                                        action={A.deleteResource.bind(null, r.id)}
                                      >
                                        Remove
                                      </ActionButton>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              <div className="mt-3">
                                <ResourceUploader
                                  courseId={course.id}
                                  lessonId={l.id}
                                  onUploaded={A.registerResource.bind(null, course.id, l.id)}
                                  disabled={locked}
                                />
                              </div>
                            </div>
                          </div>
                        </details>
                      </li>
                    ))}
                  </ul>

                  <details className="border-t border-line p-4">
                    <summary className="cursor-pointer text-sm font-medium text-primary">
                      Add a lesson to this module
                    </summary>
                    <ActionForm
                      action={A.addLesson.bind(null, course.id, m.id)}
                      className="mt-4 space-y-4"
                      resetOnSuccess
                    >
                      <LessonFields idPrefix={`new-${m.id}`} />
                      <SubmitButton size="sm">Add lesson</SubmitButton>
                    </ActionForm>
                  </details>
                </li>
              ))}
            </ol>

            <ActionForm action={A.addModule.bind(null, course.id)} className="mt-6 flex items-end gap-2" resetOnSuccess>
              <div className="flex-1">
                <TextField id="new-module" name="title" label="New module" placeholder="e.g. Getting started" />
              </div>
              <SubmitButton variant="secondary">Add module</SubmitButton>
            </ActionForm>
          </Panel>
        </fieldset>

        {canDelete && (
          <Panel
            title="Delete draft"
            description="Removes this course, its curriculum and files. This can’t be undone."
          >
            <ActionButton
              variant="danger"
              confirm="Delete this course permanently?"
              action={A.deleteCourse.bind(null, course.id)}
            >
              <Trash2 /> Delete course
            </ActionButton>
          </Panel>
        )}
      </div>
    </>
  );
}
