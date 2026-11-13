"use server";

import { contactSchema, fieldErrors } from "@/lib/validation/forms";

export type ContactState =
  | { status: "idle" }
  | { status: "invalid"; errors: Record<string, string> }
  | { status: "unconfigured" }
  | { status: "sent"; reference: string };

/**
 * Validates contact submissions on the server.
 * Phase 1: there is no message store yet, so we report "unconfigured"
 * rather than claiming the message was sent. Phase 2 inserts a
 * support_tickets row (and Phase 9 emails the admin via Resend).
 */
export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    topic: formData.get("topic"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { status: "invalid", errors: fieldErrors(parsed.error) };

  // Honeypot: real users never fill this hidden field.
  if (formData.get("company_website")) return { status: "invalid", errors: { form: "Submission rejected." } };

  return { status: "unconfigured" };
}
