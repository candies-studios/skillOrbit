import type { Metadata } from "next";
import { UserCheck } from "lucide-react";
import { PageTitle, Panel } from "@/components/app/page-title";
import { ActionForm, SubmitButton } from "@/components/app/action-form";
import { SelectField, TextAreaField, TextField } from "@/components/app/fields";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { requireAdmin } from "@/lib/auth/viewer";
import { getServerSupabase } from "@/lib/supabase/server";
import { reviewAffiliate, reviewInstructor } from "../actions";

export const metadata: Metadata = { title: "Admin · Applications", robots: { index: false } };

const TONE = { pending: "marigold", approved: "success", rejected: "danger", suspended: "danger" } as const;
type Status = keyof typeof TONE;
const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function AdminApplications() {
  await requireAdmin();
  const supabase = await getServerSupabase();
  const [{ data: instructors }, { data: affiliates }, { data: setting }] = await Promise.all([
    supabase
      .from("instructor_profiles")
      .select(
        "user_id, display_name, headline, bio, expertise, website_url, application_note, status, revenue_share_bps, rejection_reason, created_at, profile:profiles!instructor_profiles_user_id_fkey(email)",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("affiliate_profiles")
      .select(
        "user_id, promotion_channels, website_url, status, referral_code, rejection_reason, created_at, profile:profiles!affiliate_profiles_user_id_fkey(email, full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("platform_settings").select("value").eq("key", "instructor.default_revenue_share_bps").maybeSingle(),
  ]);
  const defaultShare = typeof setting?.value === "number" ? setting.value / 100 : 70;
  const byPendingFirst = <T extends { status: string }>(rows: T[] | null) =>
    [...(rows ?? [])].sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));

  return (
    <>
      <PageTitle title="Applications" description="Approve instructors and affiliates. Applicants see your message." />

      <h2 className="mb-4 text-xl font-semibold">Instructors</h2>
      {!instructors?.length ? (
        <EmptyState icon={UserCheck} title="No instructor applications yet" className="mb-10" />
      ) : (
        <div className="mb-10 space-y-4">
          {byPendingFirst(instructors).map((a) => (
            <Panel key={a.user_id}>
              <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{a.display_name}</h3>
                    <Badge tone={TONE[a.status as Status]}>{a.status}</Badge>
                    {a.revenue_share_bps != null && <Badge>{a.revenue_share_bps / 100}% share</Badge>}
                  </div>
                  <p className="text-sm text-muted">
                    {(a.profile as unknown as { email: string } | null)?.email} · applied{" "}
                    {dateFmt.format(new Date(a.created_at))}
                  </p>
                  <p className="mt-3 font-medium">{a.headline}</p>
                  <p className="mt-1 text-sm whitespace-pre-line text-muted">{a.bio}</p>
                  {a.expertise?.length > 0 && (
                    <p className="mt-2 text-sm text-subtle">Topics: {a.expertise.join(", ")}</p>
                  )}
                  {a.website_url && (
                    <p className="mt-1 text-sm">
                      <a
                        href={a.website_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-primary underline"
                      >
                        {a.website_url}
                      </a>
                    </p>
                  )}
                  {a.application_note && (
                    <p className="mt-3 rounded-md bg-paper p-3 text-sm text-muted">{a.application_note}</p>
                  )}
                </div>
                <ActionForm action={reviewInstructor.bind(null, a.user_id)} className="space-y-3">
                  <SelectField
                    id={`d-${a.user_id}`}
                    name="decision"
                    label="Decision"
                    defaultValue={a.status === "approved" ? "suspended" : "approved"}
                  >
                    <option value="approved">Approve</option>
                    <option value="rejected">Request changes</option>
                    <option value="suspended">Suspend</option>
                  </SelectField>
                  <TextField
                    id={`s-${a.user_id}`}
                    name="share_percent"
                    label="Instructor share (%)"
                    hint="Of each sale’s distributable amount. Used when approving."
                    inputMode="decimal"
                    defaultValue={a.revenue_share_bps != null ? a.revenue_share_bps / 100 : defaultShare}
                  />
                  <TextAreaField
                    id={`r-${a.user_id}`}
                    name="reason"
                    label="Message"
                    rows={3}
                    hint="Required unless approving."
                  />
                  <SubmitButton size="sm" className="w-full">
                    Apply
                  </SubmitButton>
                </ActionForm>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <h2 className="mb-4 text-xl font-semibold">Affiliates</h2>
      {!affiliates?.length ? (
        <EmptyState icon={UserCheck} title="No affiliate applications yet" />
      ) : (
        <div className="space-y-4">
          {byPendingFirst(affiliates).map((a) => {
            const p = a.profile as unknown as { email: string; full_name: string | null } | null;
            return (
              <Panel key={a.user_id}>
                <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{p?.full_name ?? p?.email}</h3>
                      <Badge tone={TONE[a.status as Status]}>{a.status}</Badge>
                      {a.referral_code && <Badge>{a.referral_code}</Badge>}
                    </div>
                    <p className="text-sm text-muted">
                      {p?.email} · applied {dateFmt.format(new Date(a.created_at))}
                    </p>
                    <p className="mt-3 text-sm whitespace-pre-line text-muted">{a.promotion_channels}</p>
                    {a.website_url && (
                      <p className="mt-1 text-sm">
                        <a
                          href={a.website_url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-primary underline"
                        >
                          {a.website_url}
                        </a>
                      </p>
                    )}
                  </div>
                  <ActionForm action={reviewAffiliate.bind(null, a.user_id)} className="space-y-3">
                    <SelectField
                      id={`ad-${a.user_id}`}
                      name="decision"
                      label="Decision"
                      defaultValue={a.status === "approved" ? "suspended" : "approved"}
                    >
                      <option value="approved">Approve</option>
                      <option value="rejected">Decline</option>
                      <option value="suspended">Suspend</option>
                    </SelectField>
                    <TextAreaField
                      id={`ar-${a.user_id}`}
                      name="reason"
                      label="Message"
                      rows={3}
                      hint="Required unless approving."
                    />
                    <SubmitButton size="sm" className="w-full">
                      Apply
                    </SubmitButton>
                  </ActionForm>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </>
  );
}
