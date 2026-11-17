"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/feedback";
import { contactSchema, fieldErrors } from "@/lib/validation/forms";
import { getBrowserSupabase } from "@/lib/supabase/client";

/**
 * Contact form. Validates in the browser, then inserts a support ticket.
 * The database re-validates every field (check constraints) and RLS only
 * allows new tickets with status "open". Without Supabase (static preview)
 * it says plainly that nothing was sent.
 */
export function ContactForm({ supportEmail }: { supportEmail: string }) {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [unconfigured, setUnconfigured] = React.useState(false);

  const [status, setStatus] = React.useState<"idle" | "sent" | "failed">("idle");
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (fd.get("company_website")) return; // honeypot
    const parsed = contactSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setUnconfigured(false);
      requestAnimationFrame(() => form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setErrors({});
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setUnconfigured(true);
      return;
    }
    setPending(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // No .select(): visitors can create tickets but not read them back.
    const { error } = await supabase.from("support_tickets").insert({ ...parsed.data, user_id: user?.id ?? null });
    setPending(false);
    if (error) {
      setStatus("failed");
      return;
    }
    setStatus("sent");
    form.reset();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {unconfigured && (
        <Notice tone="unconfigured" title="Your message was not sent">
          The contact inbox isn&apos;t connected yet, so we couldn&apos;t deliver this message.{" "}
          {supportEmail ? (
            <>
              Please email{" "}
              <a className="underline" href={`mailto:${supportEmail}`}>
                {supportEmail}
              </a>{" "}
              instead.
            </>
          ) : (
            "Please try again after launch."
          )}
        </Notice>
      )}
      {status === "sent" && (
        <Notice tone="success" title="Message received">
          We’ll reply to the email address you gave, usually within 2 working days.
        </Notice>
      )}
      {status === "failed" && (
        <Notice tone="warning" title="Your message was not sent">
          Something went wrong on our side. Try again in a moment.
        </Notice>
      )}
      {errors.form && <Notice tone="warning">{errors.form}</Notice>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Name" required error={errors.name}>
          {(a) => <Input {...a} name="name" autoComplete="name" />}
        </Field>
        <Field id="email" label="Email" required error={errors.email}>
          {(a) => <Input {...a} name="email" type="email" autoComplete="email" />}
        </Field>
      </div>
      <Field id="topic" label="Topic" required error={errors.topic}>
        {(a) => (
          <Select {...a} name="topic" defaultValue="">
            <option value="" disabled>
              Choose a topic
            </option>
            <option value="general">General question</option>
            <option value="course">A course</option>
            <option value="payment">Payment or refund</option>
            <option value="instructor">Teaching</option>
            <option value="affiliate">Affiliate programme</option>
            <option value="privacy">Privacy or data request</option>
          </Select>
        )}
      </Field>
      <Field
        id="message"
        label="Message"
        required
        error={errors.message}
        hint="Include an order ID if your question is about a purchase."
      >
        {(a) => <Textarea {...a} name="message" rows={6} maxLength={5000} />}
      </Field>
      <div aria-hidden className="hidden">
        <label htmlFor="company_website">Leave this empty</label>
        <input id="company_website" name="company_website" tabIndex={-1} autoComplete="off" />
      </div>
      <Button type="submit" loading={pending}>
        Send message
      </Button>
    </form>
  );
}
