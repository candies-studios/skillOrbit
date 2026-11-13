/**
 * Money is always an integer count of minor units (paise for INR, cents for
 * USD) paired with an ISO 4217 currency code. Never use floats for money.
 */
export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";

export type Money = {
  amountMinor: number;
  currency: CurrencyCode;
};

const MINOR_UNIT_DIGITS: Record<CurrencyCode, number> = {
  INR: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
};

const LOCALE_FOR: Record<CurrencyCode, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
};

export function assertMinorUnits(amountMinor: number): void {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new TypeError(`Money amount must be a safe integer of minor units, got ${amountMinor}`);
  }
}

/**
 * Formats money for display. Whole amounts drop the decimals (₹1,499),
 * fractional amounts keep them (₹1,499.50).
 */
export function formatMoney({ amountMinor, currency }: Money): string {
  assertMinorUnits(amountMinor);
  const digits = MINOR_UNIT_DIGITS[currency];
  const divisor = 10 ** digits;
  const isWhole = amountMinor % divisor === 0;
  // Division here is display-only; no arithmetic result is stored.
  return new Intl.NumberFormat(LOCALE_FOR[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: isWhole ? 0 : digits,
    maximumFractionDigits: digits,
  }).format(amountMinor / divisor);
}

/** Percentage saved, rounded down to a whole percent. Integer maths only. */
export function percentOff(priceMinor: number, compareAtMinor: number): number {
  assertMinorUnits(priceMinor);
  assertMinorUnits(compareAtMinor);
  if (compareAtMinor <= 0 || priceMinor >= compareAtMinor) return 0;
  return Math.floor(((compareAtMinor - priceMinor) * 100) / compareAtMinor);
}
