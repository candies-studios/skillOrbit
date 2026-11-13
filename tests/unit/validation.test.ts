import { describe, expect, it } from "vitest";
import { contactSchema, fieldErrors, registerSchema } from "@/lib/validation/forms";
import { formatDuration } from "@/lib/utils";

describe("registerSchema", () => {
  const valid = { fullName: "Asha Patel", email: "asha@example.com", password: "learning123", acceptTerms: "on" };
  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects weak passwords and missing consent", () => {
    const r = registerSchema.safeParse({ ...valid, password: "short", acceptTerms: undefined });
    expect(r.success).toBe(false);
    if (!r.success) {
      const errs = fieldErrors(r.error);
      expect(errs.password).toBeDefined();
      expect(errs.acceptTerms).toBeDefined();
    }
  });
  it("rejects passwords without a number", () => {
    expect(registerSchema.safeParse({ ...valid, password: "onlyletters" }).success).toBe(false);
  });
});

describe("contactSchema", () => {
  it("requires a known topic and a meaningful message", () => {
    const r = contactSchema.safeParse({ name: "A B", email: "a@b.co", topic: "hack", message: "hi" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const errs = fieldErrors(r.error);
      expect(errs.topic).toBeDefined();
      expect(errs.message).toBeDefined();
    }
  });
});

describe("formatDuration", () => {
  it("formats minutes", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 hr");
    expect(formatDuration(97)).toBe("1 hr 37 min");
  });
  it("rejects invalid input", () => {
    expect(() => formatDuration(-1)).toThrow(RangeError);
  });
});
