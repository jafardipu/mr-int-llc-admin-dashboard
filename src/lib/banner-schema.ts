import { z } from "zod";
import { todayInput } from "./dates";
import type { BannerRecord, BannerTarget } from "./types";

export { todayInput, toDateInput } from "./dates";

/**
 * Banner form rules. A banner always sends shoppers to one product or one category. It can also
 * carry an optional discount, which the backend applies to that product (or every product in that
 * category) while the offer dates are running. Offer dates are whole days in UTC, like deals:
 * start = 00:00:00 UTC on the first day, end = 23:59:59 UTC on the last day.
 */

export const BANNER_DISCOUNT_MIN = 1;
export const BANNER_DISCOUNT_MAX = 99;

export type BannerFormValues = {
  hasImage: boolean;
  targetType: BannerTarget | "";
  productId: string;
  categoryId: string;
  discountPercent: string;
  /** `YYYY-MM-DD` */
  startDate: string;
  /** `YYYY-MM-DD` */
  endDate: string;
  isActive: boolean;
};

export type BannerFormErrors = Partial<Record<keyof BannerFormValues, string>>;

export type BannerPayload = {
  targetType: BannerTarget;
  productId: string | null;
  categoryId: string | null;
  discountPercent: number | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  /** Cleared: the product/category target replaces the old free-text link. */
  link: null;
};

const bannerSchema = z
  .object({
    hasImage: z.boolean().refine(Boolean, "Upload a banner image"),
    targetType: z
      .string()
      .refine((value) => value === "product" || value === "category", "Choose where this banner takes shoppers"),
    productId: z.string(),
    categoryId: z.string(),
    discountPercent: z
      .string()
      .trim()
      .refine((value) => !value || /^\d+(\.\d{1,2})?$/.test(value), "Enter a number like 15 or 12.5")
      .refine(
        (value) => !value || (Number(value) >= BANNER_DISCOUNT_MIN && Number(value) <= BANNER_DISCOUNT_MAX),
        `Discount must be between ${BANNER_DISCOUNT_MIN}% and ${BANNER_DISCOUNT_MAX}%`,
      ),
    startDate: z.string(),
    endDate: z.string(),
    isActive: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const issue = (path: keyof BannerFormValues, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (values.targetType === "product" && !values.productId) issue("productId", "Select the product to promote");
    if (values.targetType === "category" && !values.categoryId) issue("categoryId", "Select the category to promote");

    // Offer dates matter only when there is a discount.
    if (!values.discountPercent.trim()) return;
    if (!values.startDate) issue("startDate", "Choose the first day of the offer");
    if (!values.endDate) issue("endDate", "Choose the last day of the offer");
    // The offer ends at 23:59:59 on its last day, so the same day as the first day is a valid
    // one-day offer: its end time is still later than its start time.
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      issue("endDate", "The last day can't be before the first day");
    }
  });

/**
 * Validates the form. `saved` holds the dates stored on the banner being edited: an offer that
 * already started or ended can keep them, but a new or changed date must not be before today.
 */
export function validateBanner(
  values: BannerFormValues,
  saved: { startDate?: string; endDate?: string } = {},
): { payload: BannerPayload; errors: BannerFormErrors } | { payload: null; errors: BannerFormErrors } {
  const result = bannerSchema.safeParse(values);
  const errors: BannerFormErrors = {};
  for (const issue of result.error?.issues ?? []) {
    const key = String(issue.path[0]) as keyof BannerFormValues;
    errors[key] ??= issue.message;
  }

  const hasDiscount = values.discountPercent.trim() !== "";
  const today = todayInput();
  if (hasDiscount && values.startDate && values.startDate !== saved.startDate && values.startDate < today) {
    errors.startDate ??= "The first day can't be before today";
  }
  if (hasDiscount && values.endDate && values.endDate !== saved.endDate && values.endDate < today) {
    errors.endDate ??= "The last day is in the past";
  }

  if (Object.keys(errors).length > 0) return { payload: null, errors };

  const targetType = values.targetType as BannerTarget;
  return {
    errors,
    payload: {
      targetType,
      productId: targetType === "product" ? values.productId : null,
      categoryId: targetType === "category" ? values.categoryId : null,
      discountPercent: hasDiscount ? Number(values.discountPercent.trim()) : null,
      startDate: hasDiscount ? `${values.startDate}T00:00:00.000Z` : null,
      endDate: hasDiscount ? `${values.endDate}T23:59:59.999Z` : null,
      isActive: values.isActive,
      link: null,
    },
  };
}

/** Formats an offer date. Uses UTC so "Dec 7 23:59 UTC" reads as Dec 7 everywhere. */
export function offerDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export type OfferState = "scheduled" | "running" | "ended";

export const OFFER_STATE_LABELS: Record<OfferState, string> = {
  scheduled: "Scheduled",
  running: "Running now",
  ended: "Ended",
};

/** Where a banner's discount stands right now, or null when it has no discount. */
export function offerState(
  banner: Pick<BannerRecord, "discountPercent" | "startDate" | "endDate">,
  now = new Date(),
): OfferState | null {
  if (!banner.discountPercent || !banner.startDate || !banner.endDate) return null;
  if (now < new Date(banner.startDate)) return "scheduled";
  if (now > new Date(banner.endDate)) return "ended";
  return "running";
}

/** Price after a percentage discount, rounded to cents (the backend must round the same way). */
export function discountedPrice(price: number, percent: number) {
  return Math.round(price * (100 - percent)) / 100;
}
