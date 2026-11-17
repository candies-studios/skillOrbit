import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { PageTitle } from "@/components/app/page-title";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/data";
import { requireAdmin } from "@/lib/auth/viewer";
import { getServerSupabase } from "@/lib/supabase/server";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/courses/manage";
import type { CourseStatus } from "@/lib/catalog/types";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Courses", robots: { index: false } };

const FILTERS: { value: CourseStatus | "all"; label: string }[] = [
  { value: "in_review", label: "In review" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "rejected", label: "Needs changes" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

export default async function AdminCourses({ searchParams }: PageProps<"/admin/courses">) {
  await requireAdmin();
  const sp = await searchParams;
  const raw = typeof sp.status === "string" ? sp.status : "in_review";
  const status = FILTERS.some((f) => f.value === raw) ? (raw as CourseStatus | "all") : "in_review";
  const supabase = await getServerSupabase();
  let query = supabase
    .from("courses")
    .select(
      "id, title, status, price_minor, currency, is_featured, is_platform_owned, submitted_at, updated_at, owner:profiles!courses_owner_id_fkey(full_name, email)",
    )
    .order(status === "in_review" ? "submitted_at" : "updated_at", { ascending: status === "in_review" })
    .limit(200);
  if (status !== "all") query = query.eq("status", status);
  const { data: courses } = await query;

  return (
    <>
      <PageTitle title="Courses" description="Review submissions and manage what’s live." />
      <nav aria-label="Filter by status" className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/courses?status=${f.value}`}
            aria-current={f.value === status ? "page" : undefined}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm",
              f.value === status
                ? "border-ink bg-ink text-white"
                : "border-line-strong bg-surface text-muted hover:text-ink",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      {!courses?.length ? (
        <EmptyState icon={BookOpen} title="Nothing here" description="No courses with this status." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Course</TH>
              <TH>Instructor</TH>
              <TH>Status</TH>
              <TH className="text-right">Price</TH>
            </tr>
          </THead>
          <TBody>
            {courses.map((c) => {
              const owner = c.owner as unknown as { full_name: string | null; email: string } | null;
              return (
                <TR key={c.id}>
                  <TD>
                    <Link href={`/admin/courses/${c.id}`} className="font-medium text-primary hover:underline">
                      {c.title}
                    </Link>
                    {c.is_featured && (
                      <Badge tone="marigold" className="ml-2">
                        Featured
                      </Badge>
                    )}
                  </TD>
                  <TD className="text-muted">
                    {c.is_platform_owned ? "Platform" : (owner?.full_name ?? owner?.email ?? "—")}
                  </TD>
                  <TD>
                    <Badge tone={STATUS_TONE[c.status as CourseStatus]}>{STATUS_LABEL[c.status as CourseStatus]}</Badge>
                  </TD>
                  <TD className="text-right tabular-nums">
                    {Number(c.price_minor) === 0
                      ? "Free"
                      : formatMoney({ amountMinor: Number(c.price_minor), currency: c.currency })}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </>
  );
}
