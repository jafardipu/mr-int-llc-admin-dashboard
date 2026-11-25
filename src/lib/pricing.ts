import { z } from "zod";
import { money, prettyDate } from "./format";
import type { AdminUser, StorePrices } from "./types";

/**
 * Store pricing (Settings → Pricing). Rules and messages mirror the backend's
 * `contents/content.validation.ts`. The form holds strings, which are turned into numbers before
 * they're sent (the API rejects "10").
 */

export const PRICE_FIELDS = ["shippingFee", "taxRate", "wholesaleAccountFee"] as const;
export type PriceField = (typeof PRICE_FIELDS)[number];
export type PriceForm = Record<PriceField, string>;
/** `prices` holds a backend error about the whole object rather than one field. */
export type PriceErrors = Partial<Record<PriceField | "prices", string>>;

/** Starting values on a fresh backend. */
export const DEFAULT_PRICES: StorePrices = { shippingFee: 10, taxRate: 0, wholesaleAccountFee: 20 };

/** Stripe can't charge less than this, so a non-zero wholesale fee must be at least $0.50. */
export const STRIPE_MIN_CHARGE = 0.5;

const dollars = (missing: string) =>
  z.string().trim().min(1, missing).refine((value) => /^-?\d+(\.\d{1,2})?$/.test(value), "Enter an amount like 10 or 9.99");

const pricesSchema = z.object({
  shippingFee: dollars("Enter the shipping fee")
    .refine((value) => Number(value) >= 0, "Shipping fee cannot be negative")
    .transform(Number),
  taxRate: z
    .string()
    .trim()
    .min(1, "Enter the tax rate")
    .refine((value) => /^-?\d+(\.\d{1,3})?$/.test(value), "Enter a rate like 8 or 8.25")
    .refine((value) => Number(value) >= 0, "Tax rate cannot be negative")
    .refine((value) => Number(value) <= 100, "Tax rate cannot be more than 100%")
    .transform(Number),
  wholesaleAccountFee: dollars("Enter the wholesale account fee")
    .refine((value) => Number(value) >= 0, "Wholesale account fee cannot be negative")
    .refine(
      (value) => Number(value) === 0 || Number(value) >= STRIPE_MIN_CHARGE,
      "Wholesale account fee must be 0 (off) or at least $0.50",
    )
    .transform(Number),
});

export function validatePrices(form: PriceForm): { prices: StorePrices; errors: PriceErrors } | { prices: null; errors: PriceErrors } {
  const result = pricesSchema.safeParse(form);
  if (result.success) return { prices: result.data, errors: {} };
  const errors: PriceErrors = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0]) as PriceField;
    errors[key] ??= issue.message;
  }
  return { prices: null, errors };
}

/** Only the prices that differ from the saved ones (the API keeps the rest). */
export function changedPrices(next: StorePrices, saved: StorePrices): Partial<StorePrices> {
  return Object.fromEntries(PRICE_FIELDS.filter((key) => next[key] !== saved[key]).map((key) => [key, next[key]]));
}

export function toPriceForm(prices: StorePrices): PriceForm {
  return {
    shippingFee: prices.shippingFee.toFixed(2),
    taxRate: String(prices.taxRate),
    wholesaleAccountFee: prices.wholesaleAccountFee.toFixed(2),
  };
}

/** e.g. "Shipping $10.00 · Tax 8.25% · Wholesale fee $20.00" */
export function pricesSummary(prices: StorePrices) {
  const wholesale = prices.wholesaleAccountFee > 0 ? money(prices.wholesaleAccountFee) : "off";
  return `Shipping ${money(prices.shippingFee)} · Tax ${prices.taxRate}% · Wholesale fee ${wholesale}`;
}

export type WholesaleFeeState = { label: string; tone: "success" | "warning" | "muted" };

/** The one-time wholesale fee status shown for wholesale users; null for everyone else. */
export function wholesaleFeeState(user: Pick<AdminUser, "role" | "wholesaleFee">): WholesaleFeeState | null {
  if (user.role !== "wholesale") return null;
  const fee = user.wholesaleFee;
  if (!fee) return { label: "Not required", tone: "muted" };
  if (fee.status === "paid") {
    const when = fee.paidAt ? ` on ${prettyDate(fee.paidAt)}` : "";
    return { label: `Paid ${money(fee.amount)}${when}`, tone: "success" };
  }
  return { label: "Unpaid", tone: "warning" };
}
