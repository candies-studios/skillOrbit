import { z } from "zod";

/** Shared client/server schemas. The server always re-validates. */

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email address").max(254),
  topic: z.enum(["general", "course", "payment", "instructor", "affiliate", "privacy"], {
    message: "Choose a topic",
  }),
  message: z
    .string()
    .trim()
    .min(20, "Add a little more detail (at least 20 characters)")
    .max(5000, "Message is too long"),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(72, "Use 72 characters or fewer")
  .regex(/[a-z]/i, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(254),
  password: passwordSchema,
  acceptTerms: z.literal("on", { message: "Accept the terms to create an account" }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

/** Flattens zod issues into a { field: firstMessage } map for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
