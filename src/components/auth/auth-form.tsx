"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { z } from "zod";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/feedback";
import {
  fieldErrors,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/forms";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/supabase/env";

type Mode = "login" | "register" | "forgot" | "reset";

const SCHEMAS: Record<Mode, z.ZodType> = {
  login: loginSchema,
  register: registerSchema,
  forgot: forgotPasswordSchema,
  reset: resetPasswordSchema,
};

const SUBMIT_LABEL: Record<Mode, string> = {
  login: "Log in",
  register: "Create account",
  forgot: "Send reset link",
  reset: "Save new password",
};

/** Maps Supabase Auth errors to plain-language messages. */
function authMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email or password is incorrect.";
  if (m.includes("email not confirmed")) return "Confirm your email first — check your inbox for the link we sent.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a minute and try again.";
  if (m.includes("same password") || m.includes("different from the old"))
    return "Choose a password you haven’t used here before.";
  if (m.includes("weak") || m.includes("password should"))
    return "That password is too weak. Use a longer one with letters and numbers.";
  if (m.includes("session") && m.includes("missing")) return "Your reset link has expired. Request a new one.";
  return "Something went wrong. Try again in a moment.";
}

/**
 * Email/password auth with Supabase. Runs in the browser so the same pages
 * work on the static preview, where Supabase isn't configured and the form
 * says so instead of pretending to succeed.
 */
export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(params.get("error"));
  const [unconfigured, setUnconfigured] = React.useState(false);
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = SCHEMAS[mode].safeParse(data);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setErrors({});
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setUnconfigured(true);
      return;
    }

    setPending(true);
    try {
      const origin = window.location.origin;
      const v = parsed.data as Record<string, string>;
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: v.email!, password: v.password! });
        if (error) return setFormError(authMessage(error.message));
        router.replace(safeNextPath(params.get("next")));
        router.refresh();
      } else if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email: v.email!,
          password: v.password!,
          options: {
            data: { full_name: v.fullName },
            emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(safeNextPath(params.get("next")))}`,
          },
        });
        if (error) return setFormError(authMessage(error.message));
        // Supabase returns success for existing emails too (prevents account enumeration).
        setSentTo(v.email!);
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(v.email!, {
          redirectTo: `${origin}/auth/confirm?next=/reset-password`,
        });
        if (error) return setFormError(authMessage(error.message));
        setSentTo(v.email!);
      } else {
        const { error } = await supabase.auth.updateUser({ password: v.password! });
        if (error) return setFormError(authMessage(error.message));
        router.replace("/dashboard?password=updated");
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6" role="status">
        <MailCheck className="size-6 text-success" aria-hidden />
        <h2 className="mt-3 text-lg font-semibold text-text">Check your email</h2>
        <p className="mt-1.5 text-muted">
          {mode === "register"
            ? `If ${sentTo} can be registered, we’ve sent a link to confirm it. Open it on this device to finish creating your account.`
            : `If an account exists for ${sentTo}, we’ve sent a link to reset your password.`}
        </p>
        <p className="mt-4 text-sm text-subtle">Nothing there after a few minutes? Check spam, or try again.</p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
      {unconfigured && (
        <Notice tone="unconfigured" title="Accounts aren’t connected on this site">
          This is a static preview. Sign-in works on the full app once Supabase is configured. Nothing was submitted.
        </Notice>
      )}
      {formError && (
        <Notice tone="warning" title="That didn’t work">
          {formError}
        </Notice>
      )}

      {mode === "register" && (
        <Field id="fullName" label="Full name" required error={errors.fullName}>
          {(a) => <Input {...a} name="fullName" autoComplete="name" />}
        </Field>
      )}

      {mode !== "reset" && (
        <Field id="email" label="Email" required error={errors.email}>
          {(a) => <Input {...a} name="email" type="email" autoComplete="email" inputMode="email" />}
        </Field>
      )}

      {mode !== "forgot" && (
        <Field
          id="password"
          label={mode === "reset" ? "New password" : "Password"}
          required
          error={errors.password}
          hint={
            mode === "register" || mode === "reset" ? "At least 10 characters, with a letter and a number." : undefined
          }
        >
          {(a) => (
            <Input
              {...a}
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          )}
        </Field>
      )}

      {mode === "reset" && (
        <Field id="confirmPassword" label="Confirm new password" required error={errors.confirmPassword}>
          {(a) => <Input {...a} name="confirmPassword" type="password" autoComplete="new-password" />}
        </Field>
      )}

      {mode === "login" && (
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        </div>
      )}

      {mode === "register" && (
        <div className="space-y-1.5">
          <label className="flex items-start gap-2.5 text-sm text-muted">
            <Checkbox
              name="acceptTerms"
              className="mt-0.5"
              aria-invalid={errors.acceptTerms ? true : undefined}
              aria-describedby={errors.acceptTerms ? "acceptTerms-error" : undefined}
            />
            <span>
              I agree to the{" "}
              <Link href="/legal/terms" className="text-primary underline underline-offset-4">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/legal/privacy" className="text-primary underline underline-offset-4">
                privacy policy
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms && (
            <p id="acceptTerms-error" className="text-sm text-danger" role="alert">
              {errors.acceptTerms}
            </p>
          )}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {SUBMIT_LABEL[mode]}
      </Button>
    </form>
  );
}
