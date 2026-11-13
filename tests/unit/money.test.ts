import { describe, expect, it } from "vitest";
import { formatMoney, percentOff } from "@/lib/money";

describe("formatMoney", () => {
  it("formats whole rupee amounts from paise without decimals", () => {
    expect(formatMoney({ amountMinor: 149900, currency: "INR" })).toBe("₹1,499");
  });
  it("uses Indian digit grouping", () => {
    expect(formatMoney({ amountMinor: 1234567800, currency: "INR" })).toBe("₹1,23,45,678");
  });
  it("keeps paise when the amount is fractional", () => {
    expect(formatMoney({ amountMinor: 149950, currency: "INR" })).toBe("₹1,499.50");
  });
  it("formats zero", () => {
    expect(formatMoney({ amountMinor: 0, currency: "INR" })).toBe("₹0");
  });
  it("rejects non-integer minor units", () => {
    expect(() => formatMoney({ amountMinor: 14.5, currency: "INR" })).toThrow(TypeError);
  });
  it("rejects unsafe integers", () => {
    expect(() => formatMoney({ amountMinor: Number.MAX_SAFE_INTEGER + 1, currency: "INR" })).toThrow();
  });
});

describe("percentOff", () => {
  it("floors the discount so savings are never overstated", () => {
    expect(percentOff(149900, 249900)).toBe(40); // 40.016…
    expect(percentOff(199900, 299900)).toBe(33); // 33.34…
  });
  it("returns 0 when there is no real discount", () => {
    expect(percentOff(100, 100)).toBe(0);
    expect(percentOff(200, 100)).toBe(0);
    expect(percentOff(100, 0)).toBe(0);
  });
});
