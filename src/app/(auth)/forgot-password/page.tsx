import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-medium text-ink">Reset your password</h1>
      <p className="mt-2 mb-8 text-muted">Enter your account email and we’ll send you a link to set a new password.</p>
      <AuthForm mode="forgot" />
      <p className="mt-6 text-sm">
        <Link href="/login" className="text-primary underline underline-offset-4">
          Back to log in
        </Link>
      </p>
    </>
  );
}
