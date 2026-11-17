import type { Metadata } from "next";
import Form from "next/form";
import { PageTitle } from "@/components/app/page-title";
import { ActionButton } from "@/components/app/action-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/data";
import { requireAdmin } from "@/lib/auth/viewer";
import { getServerSupabase } from "@/lib/supabase/server";
import { setAdminRole } from "../actions";

export const metadata: Metadata = { title: "Admin · Users", robots: { index: false } };

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function AdminUsers({ searchParams }: PageProps<"/admin/users">) {
  const viewer = await requireAdmin();
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 100);
  const supabase = await getServerSupabase();
  let query = supabase
    .from("profiles")
    .select("id, email, full_name, created_at, user_roles(role, status)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) {
    // Escape PostgREST pattern characters before building the filter.
    const safe = q.replace(/[%_,()\\]/g, (ch) => `\\${ch}`);
    query = query.or(`email.ilike.%${safe}%,full_name.ilike.%${safe}%`);
  }
  const { data: users } = await query;

  return (
    <>
      <PageTitle
        title="Users and roles"
        description="Instructor and affiliate roles come from applications. Only a super admin can grant admin access."
      />
      <Form action="/admin/users" className="mb-5 flex max-w-md gap-2">
        <label htmlFor="user-q" className="sr-only">
          Search users
        </label>
        <input
          id="user-q"
          name="q"
          defaultValue={q}
          placeholder="Search by name or email"
          className="h-10 flex-1 rounded-md border border-line-strong bg-surface px-3 text-sm"
        />
        <Button type="submit" variant="secondary" size="sm" className="h-10">
          Search
        </Button>
      </Form>
      <Table>
        <THead>
          <tr>
            <TH>User</TH>
            <TH>Roles</TH>
            <TH>Joined</TH>
            {viewer.isSuperAdmin && <TH className="text-right">Admin access</TH>}
          </tr>
        </THead>
        <TBody>
          {(users ?? []).map((u) => {
            const roles = (u.user_roles as { role: string; status: string }[])
              .filter((r) => r.status === "active")
              .map((r) => r.role);
            const isAdmin = roles.includes("admin");
            return (
              <TR key={u.id}>
                <TD>
                  <p className="font-medium">{u.full_name ?? "—"}</p>
                  <p className="text-xs text-muted">{u.email}</p>
                </TD>
                <TD>
                  <div className="flex flex-wrap gap-1">
                    {roles.map((r) => (
                      <Badge key={r} tone={r.includes("admin") ? "primary" : "neutral"}>
                        {r.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                </TD>
                <TD className="text-muted">{dateFmt.format(new Date(u.created_at))}</TD>
                {viewer.isSuperAdmin && (
                  <TD className="text-right">
                    {u.id !== viewer.id && (
                      <ActionButton
                        size="sm"
                        variant={isAdmin ? "ghost" : "secondary"}
                        confirm={isAdmin ? `Remove admin access from ${u.email}?` : `Give ${u.email} admin access?`}
                        action={setAdminRole.bind(null, u.id, "admin", !isAdmin)}
                      >
                        {isAdmin ? "Remove admin" : "Make admin"}
                      </ActionButton>
                    )}
                  </TD>
                )}
              </TR>
            );
          })}
        </TBody>
      </Table>
      {users?.length === 100 && (
        <p className="mt-3 text-sm text-subtle">Showing the newest 100. Search to find others.</p>
      )}
    </>
  );
}
