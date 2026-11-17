import { Suspense } from "react";
import { Container, Logo } from "@/components/layout/primitives";
import { UserMenu } from "@/components/layout/user-menu";
import { Skeleton } from "@/components/ui/feedback";
import { AppShell } from "@/components/app/app-shell";

/**
 * Signed-in area: /dashboard, /instructor, /admin.
 * The static frame renders immediately; the session-dependent shell streams
 * inside Suspense (required for cookie access with Cache Components).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <Container className="flex h-16 items-center gap-4">
          <Logo />
          <div className="ml-auto flex items-center gap-2">
            <UserMenu />
          </div>
        </Container>
      </header>
      <Suspense fallback={<ShellSkeleton />}>
        <AppShell>{children}</AppShell>
      </Suspense>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <Container className="grid flex-1 gap-8 py-8 lg:grid-cols-[14rem_1fr]">
      <div className="hidden space-y-2 lg:block">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </Container>
  );
}
