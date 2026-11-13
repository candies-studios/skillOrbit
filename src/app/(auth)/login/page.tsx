import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default function LoginPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-medium text-ink">Welcome back</h1>
      <p className="mt-2 mb-8 text-muted">
        New here?{" "}
        <Link href="/register" className="text-primary underline underline-offset-4">
          Create an account
        </Link>
      </p>
      <AuthForm mode="login" />
    </>
  );
}
