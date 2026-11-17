import type { PostgrestError } from "@supabase/supabase-js";
import type { z } from "zod";
import { fieldErrors } from "@/lib/validation/forms";

/** Result returned by every server action, rendered by <ActionMessage>. */
export type ActionResult =
  { ok: true; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const idle: ActionResult | null = null;

export function invalid(error: z.ZodError): ActionResult {
  const fe = fieldErrors(error);
  const messages = Object.values(fe);
  return {
    ok: false,
    error: messages.length === 1 ? messages[0]! : "Check the highlighted fields.",
    fieldErrors: fe,
  };
}

/**
 * Turns a database error into a message for the user. Our own SQL functions
 * raise readable messages (check_violation / insufficient_privilege / not
 * found); anything else gets a generic message so internals never leak.
 */
export function dbError(error: PostgrestError | { message: string; code?: string } | null): ActionResult {
  const code = error?.code ?? "";
  const msg = error?.message ?? "";
  if (code === "23505") {
    if (/slug/i.test(msg)) return { ok: false, error: "That web address is already taken. Choose another." };
    if (/code/i.test(msg)) return { ok: false, error: "That code is already in use." };
    return { ok: false, error: "That already exists." };
  }
  if (["23514", "42501", "P0002", "P0001"].includes(code) && msg && !/violates|constraint|policy/i.test(msg)) {
    return { ok: false, error: msg.charAt(0).toUpperCase() + msg.slice(1) + (msg.endsWith(".") ? "" : ".") };
  }
  if (/row-level security|permission denied/i.test(msg)) {
    return { ok: false, error: "You don’t have permission to do that." };
  }
  if (code === "23514" || code === "22001")
    return { ok: false, error: "One of the values is too long or not allowed." };
  return { ok: false, error: "Something went wrong saving that. Try again." };
}

/** Splits a textarea into trimmed, non-empty lines. */
export function lines(value: FormDataEntryValue | null, max = 12): string[] {
  return String(value ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, max);
}

/** Parses a rupee amount like "1,499" or "1499.50" into integer paise. */
export function rupeesToPaise(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").replace(/[,\s₹]/g, "");
  if (raw === "") return null;
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(raw)) return NaN;
  const [whole, frac = ""] = raw.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

export function paiseToRupeesInput(paise: number | null | undefined): string {
  if (paise === null || paise === undefined) return "";
  const whole = Math.floor(paise / 100);
  const frac = paise % 100;
  return frac === 0 ? String(whole) : `${whole}.${String(frac).padStart(2, "0")}`;
}
