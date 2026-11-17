import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle, Panel } from "@/components/app/page-title";
import { ActionForm, SubmitButton } from "@/components/app/action-form";
import { TextAreaField, TextField } from "@/components/app/fields";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { requireViewer } from "@/lib/auth/viewer";
import { getServerSupabase } from "@/lib/supabase/server";
import { saveInstructorApplication } from "../actions";

export const metadata: Metadata = { title: "Teach", robots: { index: false } };

export default async function TeachPage() {
  const viewer = await requireViewer();
  const supabase = await getServerSupabase();
  const { data: app } = await supabase
    .from("instructor_profiles")
    .select(
      "display_name, headline, bio, expertise, location, website_url, application_note, status, rejection_reason, revenue_share_bps, slug",
    )
    .eq("user_id", viewer.id)
    .maybeSingle();

  const status = app?.status as "pending" | "approved" | "rejected" | "suspended" | undefined;

  return (
    <>
      <PageTitle
        title={status === "approved" ? "Instructor profile" : "Teach on SkillOrbit"}
        description={
          status === "approved"
            ? "This is what learners see on your public instructor page."
            : "Tell us what you teach. We review every application before you can publish courses."
        }
        actions={
          status === "approved" ? (
            <>
              <Button asChild>
                <Link href="/instructor">My courses</Link>
              </Button>
              {app?.slug && (
                <Button asChild variant="secondary">
                  <Link href={`/instructors/${app.slug}`}>View public page</Link>
                </Button>
              )}
            </>
          ) : undefined
        }
      />

      <div className="max-w-2xl space-y-6">
        {status === "pending" && (
          <Notice tone="info" title="Your application is in review">
            We’ll notify you here when it’s decided. You can still edit it below.
          </Notice>
        )}
        {status === "rejected" && (
          <Notice tone="warning" title="Your application needs changes">
            {app?.rejection_reason} Update the details below and save to resubmit.
          </Notice>
        )}
        {status === "suspended" && (
          <Notice tone="warning" title="Your instructor access is suspended">
            {app?.rejection_reason} Contact support if you think this is a mistake.
          </Notice>
        )}
        {status === "approved" && app?.revenue_share_bps != null && (
          <Notice tone="success" title="You’re an approved instructor">
            Your agreed revenue share is {app.revenue_share_bps / 100}% of each sale’s distributable amount, recorded
            with every sale.
          </Notice>
        )}

        <Panel>
          <ActionForm action={saveInstructorApplication} className="space-y-5">
            <TextField
              name="display_name"
              label="Name shown to learners"
              required
              defaultValue={app?.display_name ?? viewer.fullName ?? ""}
            />
            <TextField
              name="headline"
              label="Headline"
              required
              hint="One line, e.g. “Performance marketer, 8 years in e-commerce”."
              defaultValue={app?.headline ?? ""}
            />
            <TextAreaField name="bio" label="About you" required rows={6} defaultValue={app?.bio ?? ""} />
            <TextField
              name="expertise"
              label="Topics you teach"
              hint="Separate with commas, up to 10."
              defaultValue={(app?.expertise ?? []).join(", ")}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField name="location" label="Location" defaultValue={app?.location ?? ""} />
              <TextField
                name="website_url"
                label="Website or portfolio"
                type="url"
                defaultValue={app?.website_url ?? ""}
              />
            </div>
            {status !== "approved" && (
              <TextAreaField
                name="application_note"
                label="Note to the review team"
                hint="Optional: courses you plan to create, links to your work."
                rows={4}
                defaultValue={app?.application_note ?? ""}
              />
            )}
            <SubmitButton>
              {!app ? "Send application" : status === "rejected" ? "Resubmit application" : "Save"}
            </SubmitButton>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
