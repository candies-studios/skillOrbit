import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default function RegisterPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-medium text-ink">Create your account</h1>
      <p className="mt-2 mb-8 text-muted">
        Already have one?{" "}
        <Link href="/login" className="text-primary underline underline-offset-4">
          Log in
        </Link>
      </p>
      <AuthForm mode="register" />
      <p className="mt-6 text-sm text-subtle">
        Want to teach or become an affiliate? Create a student account first, then apply from your dashboard.
      </p>
    </>
  );
}
