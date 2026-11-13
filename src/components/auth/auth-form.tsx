"use client";

import * as React from "react";
import Link from "next/link";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/feedback";
import { fieldErrors, forgotPasswordSchema, loginSchema, registerSchema } from "@/lib/validation/forms";

type Mode = "login" | "register" | "forgot";

const SCHEMAS: Record<Mode, z.ZodType> = {
  login: loginSchema,
  register: registerSchema,
  forgot: forgotPasswordSchema,
};

const SUBMIT_LABEL: Record<Mode, string> = {
  login: "Log in",
  register: "Create account",
  forgot: "Send reset link",
};

/**
 * Auth form UI with validation. Phase 2 replaces `submit` with Supabase Auth
 * server actions; until then it reports that sign-in isn't connected,
 * rather than simulating success.
 */
export function AuthForm({ mode }: { mode: Mode }) {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [unconfigured, setUnconfigured] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = SCHEMAS[mode].safeParse(data);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setUnconfigured(false);
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setErrors({});
    setUnconfigured(true);
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
      {unconfigured && (
        <Notice tone="unconfigured" title="Accounts aren’t connected yet">
          Your details are valid, but sign-in will only work once Supabase Authentication is set up (Phase 2). Nothing
          was submitted or stored.
        </Notice>
      )}

      {mode === "register" && (
        <Field id="fullName" label="Full name" required error={errors.fullName}>
          {(a) => <Input {...a} name="fullName" autoComplete="name" />}
        </Field>
      )}

      <Field id="email" label="Email" required error={errors.email}>
        {(a) => <Input {...a} name="email" type="email" autoComplete="email" inputMode="email" />}
      </Field>

      {mode !== "forgot" && (
        <Field
          id="password"
          label="Password"
          required
          error={errors.password}
          hint={mode === "register" ? "At least 10 characters, with a letter and a number." : undefined}
        >
          {(a) => (
            <Input
              {...a}
              name="password"
              type="password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
          )}
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

      <Button type="submit" size="lg" className="w-full">
        {SUBMIT_LABEL[mode]}
      </Button>
    </form>
  );
}
