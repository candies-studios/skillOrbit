import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { PageTitle, Panel } from "@/components/app/page-title";
import { ActionForm, SubmitButton } from "@/components/app/action-form";
import { SelectField, TextAreaField } from "@/components/app/fields";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { requireAdmin } from "@/lib/auth/viewer";
import { getServerSupabase } from "@/lib/supabase/server";
import { updateTicket } from "../actions";

export const metadata: Metadata = { title: "Admin · Support", robots: { index: false } };

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});
const TONE = { open: "marigold", in_progress: "primary", resolved: "success", closed: "neutral" } as const;

export default async function AdminTickets() {
  await requireAdmin();
  const supabase = await getServerSupabase();
  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, name, email, topic, message, status, admin_note, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const sorted = [...(tickets ?? [])].sort(
    (a, b) => Number(["open", "in_progress"].includes(b.status)) - Number(["open", "in_progress"].includes(a.status)),
  );

  return (
    <>
      <PageTitle
        title="Support tickets"
        description="Messages from the contact form. Reply by email; record what you did here."
      />
      {sorted.length === 0 ? (
        <EmptyState icon={Inbox} title="No messages yet" />
      ) : (
        <div className="space-y-4">
          {sorted.map((t) => (
            <Panel key={t.id}>
              <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={TONE[t.status as keyof typeof TONE]}>{t.status.replace("_", " ")}</Badge>
                    <Badge>{t.topic}</Badge>
                    <span className="text-sm text-subtle">{dateFmt.format(new Date(t.created_at))}</span>
                  </div>
                  <p className="mt-2 font-medium">
                    {t.name}{" "}
                    <a href={`mailto:${t.email}`} className="text-sm font-normal text-primary underline">
                      {t.email}
                    </a>
                  </p>
                  <p className="mt-2 text-sm whitespace-pre-line text-muted">{t.message}</p>
                </div>
                <ActionForm action={updateTicket.bind(null, t.id)} className="space-y-3">
                  <SelectField id={`ts-${t.id}`} name="status" label="Status" defaultValue={t.status}>
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </SelectField>
                  <TextAreaField
                    id={`tn-${t.id}`}
                    name="admin_note"
                    label="Internal note"
                    rows={2}
                    defaultValue={t.admin_note ?? ""}
                  />
                  <SubmitButton size="sm">Save</SubmitButton>
                </ActionForm>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
