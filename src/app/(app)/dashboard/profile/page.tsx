import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle, Panel } from "@/components/app/page-title";
import { ActionForm, SubmitButton } from "@/components/app/action-form";
import { TextField } from "@/components/app/fields";
import { requireViewer } from "@/lib/auth/viewer";
import { getServerSupabase } from "@/lib/supabase/server";
import { updateProfile } from "../actions";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function ProfilePage() {
  const viewer = await requireViewer();
  const supabase = await getServerSupabase();
  const { data: profile } = await supabase.from("profiles").select("full_name, country").eq("id", viewer.id).single();

  return (
    <>
      <PageTitle title="Profile" description="How your name appears on certificates and receipts." />
      <div className="grid max-w-2xl gap-6">
        <Panel>
          <ActionForm action={updateProfile} className="space-y-5">
            <TextField
              name="full_name"
              label="Full name"
              required
              defaultValue={profile?.full_name ?? ""}
              autoComplete="name"
            />
            <TextField
              name="country"
              label="Country code"
              hint="Two letters, e.g. IN, US, GB."
              defaultValue={profile?.country ?? ""}
              maxLength={2}
              className="w-24 uppercase"
            />
            <SubmitButton>Save profile</SubmitButton>
          </ActionForm>
        </Panel>
        <Panel title="Sign-in">
          <dl className="space-y-1 text-sm">
            <dt className="text-subtle">Email</dt>
            <dd className="text-text">{viewer.email}</dd>
          </dl>
          <p className="mt-4 text-sm">
            <Link href="/reset-password" className="text-primary underline underline-offset-4">
              Change password
            </Link>
          </p>
        </Panel>
      </div>
    </>
  );
}
