"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Enrol/buy controls on the course page.
 * - Free courses: enrol through the enroll_in_free_course RPC (the database
 *   re-checks that the course is published and free).
 * - Paid courses: checkout arrives with payments (Phase 5), so the button is
 *   disabled with an explanation rather than faking a purchase.
 */
export function EnrolActions({
  courseId,
  slug,
  isFree,
  includedInMembership,
}: {
  courseId: string;
  slug: string;
  isFree: boolean;
  includedInMembership: boolean;
}) {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [enrolled, setEnrolled] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: rows } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", data.user.id)
        .eq("status", "active")
        .limit(1);
      if (active && rows && rows.length > 0) setEnrolled(true);
    });
    return () => {
      active = false;
    };
  }, [courseId]);

  async function enrol() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setPending(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`);
      return;
    }
    const { error } = await supabase.rpc("enroll_in_free_course", { p_course_id: courseId });
    setPending(false);
    if (error) {
      toast.error("Couldn’t enrol you", { description: "Try again in a moment." });
      return;
    }
    setEnrolled(true);
    toast.success("You’re enrolled", { description: "Find it any time under My courses." });
  }

  if (enrolled) {
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-2 font-medium text-success">
          <CircleCheck className="size-5" aria-hidden /> You’re enrolled
        </p>
        <Button asChild className="w-full" size="lg">
          <Link href="/dashboard">Go to my courses</Link>
        </Button>
      </div>
    );
  }

  const status = !configured
    ? "Enrolment opens once accounts are connected."
    : isFree
      ? "Free with an account."
      : "Online payments open soon. Until then this course can’t be bought here.";

  return (
    <div className="space-y-2.5">
      {isFree ? (
        <Button
          className="w-full"
          size="lg"
          disabled={!configured}
          loading={pending}
          onClick={enrol}
          aria-describedby="enrol-status"
        >
          Enrol for free
        </Button>
      ) : (
        <Button className="w-full" size="lg" disabled aria-describedby="enrol-status">
          Buy course
        </Button>
      )}
      {includedInMembership && !isFree && (
        <Button asChild variant="secondary" className="w-full">
          <Link href="/pricing">Get it with membership</Link>
        </Button>
      )}
      <p id="enrol-status" className="pt-1 text-center text-xs text-subtle">
        {status}
      </p>
    </div>
  );
}
