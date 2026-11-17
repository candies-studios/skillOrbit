import { PlugZap } from "lucide-react";
import { Container } from "@/components/layout/primitives";
import { EmptyState } from "@/components/ui/feedback";
import { getViewer, requireViewer } from "@/lib/auth/viewer";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SideNav, type NavGroup } from "./side-nav";

export async function AppShell({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <Container className="max-w-2xl py-16">
        <EmptyState
          icon={PlugZap}
          title="Accounts aren’t connected"
          description="Set the Supabase environment variables to use dashboards. See docs/SUPABASE_SETUP.md."
        />
      </Container>
    );
  }
  await requireViewer();
  const viewer = (await getViewer())!;

  const groups: NavGroup[] = [
    {
      title: "Learning",
      links: [
        { href: "/dashboard", label: "Overview", exact: true },
        { href: "/dashboard/profile", label: "Profile" },
      ],
    },
    {
      title: "Earn",
      links: [
        ...(viewer.isInstructor || viewer.isAdmin ? [{ href: "/instructor", label: "Course builder" }] : []),
        { href: "/dashboard/teach", label: viewer.isInstructor ? "Instructor profile" : "Teach" },
        { href: "/dashboard/affiliate", label: "Affiliate" },
      ],
    },
  ];
  if (viewer.isAdmin) {
    groups.push({
      title: "Admin",
      links: [
        { href: "/admin", label: "Overview", exact: true },
        { href: "/admin/courses", label: "Courses" },
        { href: "/admin/categories", label: "Categories" },
        { href: "/admin/applications", label: "Applications" },
        { href: "/admin/users", label: "Users and roles" },
        { href: "/admin/tickets", label: "Support tickets" },
        { href: "/admin/audit", label: "Audit log" },
      ],
    });
  }

  return (
    <Container className="grid flex-1 gap-6 py-6 lg:grid-cols-[14rem_1fr] lg:gap-10 lg:py-10">
      <SideNav groups={groups} />
      <main id="main" className="min-w-0">
        {children}
      </main>
    </Container>
  );
}
