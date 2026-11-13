"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/feedback";
import { contactSchema, fieldErrors } from "@/lib/validation/forms";

/**
 * Contact form. Validates in the browser and, until Phase 2 adds a
 * support_tickets store (server action, re-validated with the same schema),
 * reports honestly that the message was not sent.
 */
export function ContactForm({ supportEmail }: { supportEmail: string }) {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [unconfigured, setUnconfigured] = React.useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    setUnconfigured(true);
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
      <Button type="submit">Send message</Button>
    </form>
  );
}
