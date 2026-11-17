"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Header account controls. Reads the session in the browser so public pages stay static. */
export function UserMenu({
  variant = "desktop",
  onNavigate,
}: {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  // Without Supabase there is no session to wait for.
  const [ready, setReady] = React.useState(() => !isSupabaseConfigured());

  React.useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await getBrowserSupabase()?.auth.signOut();
    onNavigate?.();
    router.replace("/");
    router.refresh();
  }

  const full = variant === "mobile" ? "w-full" : undefined;

  if (ready && user) {
    return (
      <>
        <Button asChild size="sm" className={full}>
          <Link href="/dashboard" onClick={onNavigate}>
            My dashboard
          </Link>
        </Button>
        <Button variant={variant === "mobile" ? "secondary" : "ghost"} size="sm" className={full} onClick={signOut}>
          Log out
        </Button>
      </>
    );
  }
  return (
    <>
      <Button asChild variant={variant === "mobile" ? "secondary" : "ghost"} size="sm" className={full}>
        <Link href="/login" onClick={onNavigate}>
          Log in
        </Link>
      </Button>
      <Button asChild size="sm" className={full}>
        <Link href="/register" onClick={onNavigate}>
          Create account
        </Link>
      </Button>
    </>
  );
}
