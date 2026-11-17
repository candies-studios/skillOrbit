import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle, Panel } from "@/components/app/page-title";
import { ActionForm, SubmitButton } from "@/components/app/action-form";
import { TextAreaField, TextField } from "@/components/app/fields";
import { Checkbox } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/feedback";
import { requireViewer } from "@/lib/auth/viewer";
import { getServerSupabase } from "@/lib/supabase/server";
import { brand } from "@/config/brand";
import { saveAffiliateApplication } from "../actions";

export const metadata: Metadata = { title: "Affiliate", robots: { index: false } };

export default async function AffiliatePage() {
  const viewer = await requireViewer();
  const supabase = await getServerSupabase();
  const { data: app } = await supabase
    .from("affiliate_profiles")
    .select("promotion_channels, website_url, status, rejection_reason, referral_code")
    .eq("user_id", viewer.id)
    .maybeSingle();
  const status = app?.status as "pending" | "approved" | "rejected" | "suspended" | undefined;

  return (
    <>
      <PageTitle
        title="Affiliate programme"
        description={
          <>
            Earn commission on courses bought through your links.{" "}
            <Link href="/affiliates" className="text-primary underline underline-offset-4">
              How it works
            </Link>
          </>
        }
      />
      <div className="max-w-2xl space-y-6">
        {status === "approved" && app?.referral_code && (
          <Panel title="Your referral code">
            <p className="font-mono text-2xl font-semibold tracking-wider text-ink">{app.referral_code}</p>
            <p className="mt-2 text-sm text-muted">
              Your link:{" "}
              <span className="break-all text-text">{`${brand.siteUrl.replace(/\/$/, "")}/?ref=${app.referral_code}`}</span>
            </p>
            <Notice tone="unconfigured" className="mt-4" title="Tracking isn’t live yet">
              Click tracking, course links and commissions launch with the affiliate dashboard in a coming release.
              Links shared before then won’t earn commission.
            </Notice>
          </Panel>
        )}
        {status === "pending" && (
          <Notice tone="info" title="Your application is in review">
            We’ll notify you here when it’s decided.
          </Notice>
        )}
        {status === "rejected" && (
          <Notice tone="warning" title="Your application wasn’t approved">
            {app?.rejection_reason} You can update it and save to resubmit.
          </Notice>
        )}
        {status === "suspended" && (
          <Notice tone="warning" title="Your affiliate access is suspended">
            {app?.rejection_reason}
          </Notice>
        )}

        {status !== "approved" && status !== "suspended" && (
          <Panel>
            <ActionForm action={saveAffiliateApplication} className="space-y-5">
              <TextAreaField
                name="promotion_channels"
                label="Where will you share links?"
                required
                rows={4}
                hint="E.g. your newsletter, YouTube channel or community, with rough audience size."
                defaultValue={app?.promotion_channels ?? ""}
              />
              <TextField
                name="website_url"
                label="Website or profile link"
                type="url"
                defaultValue={app?.website_url ?? ""}
              />
              <label className="flex items-start gap-2.5 text-sm text-muted">
                <Checkbox name="accept_terms" className="mt-0.5" />
                <span>
                  I agree not to make misleading claims about courses or earnings, and not to buy through my own links.
                </span>
              </label>
              <SubmitButton>{app ? "Update application" : "Send application"}</SubmitButton>
            </ActionForm>
          </Panel>
        )}
      </div>
    </>
  );
}
