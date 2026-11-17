import type { Metadata } from "next";
import Link from "next/link";
import { BookCheck, BookOpen, GraduationCap, Inbox, IndianRupee, Megaphone, UserCheck, Users } from "lucide-react";
import { PageTitle } from "@/components/app/page-title";
import { StatCard } from "@/components/ui/data";
import { Notice } from "@/components/ui/feedback";
import { requireAdmin } from "@/lib/auth/viewer";
import { getServerSupabase } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

/** KPIs are computed from database records on every visit. Nothing is hardcoded. */
export default async function AdminOverview() {
  await requireAdmin();
  const supabase = await getServerSupabase();
  const count = (table: string, filter?: (q: ReturnType<ReturnType<typeof supabase.from>["select"]>) => unknown) => {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) q = filter(q) as typeof q;
    return q.then((r) => (r.error ? null : (r.count ?? 0)));
  };

  const [users, instructors, affiliates, published, inReview, pendingInstr, pendingAff, openTickets, paidOrders] =
    await Promise.all([
      count("profiles"),
      count("user_roles", (q) => q.eq("role", "instructor").eq("status", "active")),
      count("user_roles", (q) => q.eq("role", "affiliate").eq("status", "active")),
      count("courses", (q) => q.eq("status", "published")),
      count("courses", (q) => q.eq("status", "in_review")),
      count("instructor_profiles", (q) => q.eq("status", "pending")),
      count("affiliate_profiles", (q) => q.eq("status", "pending")),
      count("support_tickets", (q) => q.in("status", ["open", "in_progress"])),
      supabase.from("orders").select("total_minor").eq("status", "paid").eq("currency", "INR"),
    ]);
  // Integer sum of minor units. Moves to a SQL aggregate with the reporting work in Phase 9.
  const gross = paidOrders.error ? null : (paidOrders.data ?? []).reduce((s, o) => s + Number(o.total_minor), 0);
  const n = (v: number | null) => (v === null ? null : v.toLocaleString("en-IN"));

  return (
    <>
      <PageTitle title="Admin overview" description="Live counts from the database." />
      {(pendingInstr ?? 0) + (pendingAff ?? 0) + (inReview ?? 0) > 0 && (
        <Notice tone="info" title="Waiting for you" className="mb-6">
          <ul className="list-disc pl-5">
            {!!inReview && (
              <li>
                <Link className="underline" href="/admin/courses?status=in_review">
                  {inReview} course{inReview === 1 ? "" : "s"} to review
                </Link>
              </li>
            )}
            {!!(pendingInstr || pendingAff) && (
              <li>
                <Link className="underline" href="/admin/applications">
                  {(pendingInstr ?? 0) + (pendingAff ?? 0)} application
                  {(pendingInstr ?? 0) + (pendingAff ?? 0) === 1 ? "" : "s"} to decide
                </Link>
              </li>
            )}
          </ul>
        </Notice>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered users" value={n(users)} icon={Users} />
        <StatCard label="Active instructors" value={n(instructors)} icon={GraduationCap} />
        <StatCard label="Active affiliates" value={n(affiliates)} icon={Megaphone} />
        <StatCard label="Published courses" value={n(published)} icon={BookOpen} />
        <StatCard label="Courses in review" value={n(inReview)} icon={BookCheck} />
        <StatCard
          label="Pending applications"
          value={n(pendingInstr === null || pendingAff === null ? null : pendingInstr + pendingAff)}
          icon={UserCheck}
        />
        <StatCard label="Open support tickets" value={n(openTickets)} icon={Inbox} />
        <StatCard
          label="Gross sales (INR)"
          value={gross === null ? null : formatMoney({ amountMinor: gross, currency: "INR" })}
          icon={IndianRupee}
          hint="Paid orders before refunds and fees. Payments aren’t live yet."
        />
      </div>
    </>
  );
}
