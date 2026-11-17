import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Set a new password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-medium text-ink">Set a new password</h1>
      <p className="mt-2 mb-8 text-muted">Choose a password you don’t use on other sites.</p>
      <Suspense>
        <AuthForm mode="reset" />
      </Suspense>
    </>
  );
}
