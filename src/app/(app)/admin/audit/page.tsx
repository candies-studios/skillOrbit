import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { PageTitle } from "@/components/app/page-title";
import { EmptyState } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/data";
import { requireAdmin } from "@/lib/auth/viewer";
import { getServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin · Audit log", robots: { index: false } };

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
});

export default async function AdminAudit() {
  await requireAdmin();
  const supabase = await getServerSupabase();
  const { data: rows } = await supabase
    .from("audit_logs")
    .select(
      "id, action, entity_type, entity_id, before, after, created_at, actor:profiles!audit_logs_actor_id_fkey(email)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <>
      <PageTitle
        title="Audit log"
        description="Administrative and workflow changes, newest first. Entries can’t be edited or deleted."
      />
      {!rows?.length ? (
        <EmptyState icon={ScrollText} title="No entries yet" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>When</TH>
              <TH>Who</TH>
              <TH>Action</TH>
              <TH>Change</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD className="whitespace-nowrap text-muted">{dateFmt.format(new Date(r.created_at))}</TD>
                <TD className="text-muted">{(r.actor as unknown as { email: string } | null)?.email ?? "system"}</TD>
                <TD>
                  <p className="font-medium">{r.action}</p>
                  <p className="text-xs text-subtle">
                    {r.entity_type} {r.entity_id?.slice(0, 8)}
                  </p>
                </TD>
                <TD className="max-w-md text-xs text-muted">
                  <code className="break-all">
                    {r.before ? JSON.stringify(r.before) : ""}
                    {r.before && r.after ? " → " : ""}
                    {r.after ? JSON.stringify(r.after) : ""}
                  </code>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
