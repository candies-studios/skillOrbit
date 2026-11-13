"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/feedback";
import { contactSchema, fieldErrors } from "@/lib/validation/forms";
import { submitContact, type ContactState } from "./actions";

export function ContactForm({ supportEmail }: { supportEmail: string }) {
  const [state, action, pending] = React.useActionState<ContactState, FormData>(submitContact, { status: "idle" });
  const [clientErrors, setClientErrors] = React.useState<Record<string, string>>({});
  const errors = { ...(state.status === "invalid" ? state.errors : {}), ...clientErrors };

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    const parsed = contactSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      e.preventDefault();
      setClientErrors(fieldErrors(parsed.error));
      const first = e.currentTarget.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
      return;
    }
    setClientErrors({});
  }

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="space-y-5">
      {state.status === "unconfigured" && (
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
      <Button type="submit" loading={pending}>
        Send message
      </Button>
    </form>
  );
}
