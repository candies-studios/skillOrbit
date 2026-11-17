import type { Metadata } from "next";
import Link from "next/link";
import { BookPlus } from "lucide-react";
import { PageTitle, Panel } from "@/components/app/page-title";
import { ActionForm, SubmitButton } from "@/components/app/action-form";
import { SelectField, TextField } from "@/components/app/fields";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { Checkbox } from "@/components/ui/form-controls";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/data";
import { requireInstructor } from "@/lib/auth/viewer";
import { getServerSupabase } from "@/lib/supabase/server";
import { listAllCategories, STATUS_LABEL, STATUS_TONE } from "@/lib/courses/manage";
import { formatMoney } from "@/lib/money";
import type { CourseStatus } from "@/lib/catalog/types";
import { createCourse } from "./actions";

export const metadata: Metadata = { title: "My courses (teaching)", robots: { index: false } };

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function InstructorHome() {
  const viewer = await requireInstructor();
  const supabase = await getServerSupabase();
  const [{ data: courses }, categories] = await Promise.all([
    supabase
      .from("courses")
      .select("id, slug, title, status, price_minor, currency, updated_at, enrollments(count)")
      .eq("owner_id", viewer.id)
      .order("updated_at", { ascending: false }),
    listAllCategories(),
  ]);

  return (
    <>
      <PageTitle
        title="My courses"
        description="Create drafts, build the curriculum, then submit each course for review."
      />

      <Panel title="Start a new course" className="mb-6">
        <ActionForm action={createCourse} className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto] md:items-end">
          <TextField name="title" label="Working title" required placeholder="e.g. Email Marketing for Small Shops" />
          <SelectField name="category_id" label="Category" defaultValue="">
            <option value="">Choose later</option>
            {categories
              .filter((c) => c.isActive)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </SelectField>
          <SubmitButton>Create draft</SubmitButton>
          {viewer.isAdmin && (
            <label className="flex items-center gap-2 text-sm text-muted md:col-span-3">
              <Checkbox name="platform" /> Platform-owned course (no instructor revenue share)
            </label>
          )}
        </ActionForm>
      </Panel>

      {!courses?.length ? (
        <EmptyState
          icon={BookPlus}
          title="No courses yet"
          description="Create your first draft above. Nothing is public until it’s reviewed."
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Course</TH>
              <TH>Status</TH>
              <TH className="text-right">Price</TH>
              <TH className="text-right">Enrolments</TH>
              <TH>Updated</TH>
            </tr>
          </THead>
          <TBody>
            {courses.map((c) => {
              const enrolments = (c.enrollments as unknown as { count: number }[])[0]?.count ?? 0;
              return (
                <TR key={c.id}>
                  <TD>
                    <Link href={`/instructor/courses/${c.id}`} className="font-medium text-primary hover:underline">
                      {c.title}
                    </Link>
                  </TD>
                  <TD>
                    <Badge tone={STATUS_TONE[c.status as CourseStatus]}>{STATUS_LABEL[c.status as CourseStatus]}</Badge>
                  </TD>
                  <TD className="text-right tabular-nums">
                    {Number(c.price_minor) === 0
                      ? "Free"
                      : formatMoney({ amountMinor: Number(c.price_minor), currency: c.currency })}
                  </TD>
                  <TD className="text-right tabular-nums">{enrolments}</TD>
                  <TD className="text-muted">{dateFmt.format(new Date(c.updated_at))}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </>
  );
}
