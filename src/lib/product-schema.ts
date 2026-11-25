import { z } from "zod";

/**
 * Client-side rules for the product form (create and edit). They mirror the backend's
 * `product.validation.ts`, plus a few checks the backend doesn't make (wholesale <= retail,
 * tier ranges, 2-decimal prices, link format). The parsed output is the JSON payload sent as `data`.
 */

export const PRODUCT_STATUSES = ["active", "inactive", "out_of_stock"] as const;

export const PRODUCT_IMAGE_LIMIT = 8;
export const PRODUCT_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const PRODUCT_IMAGE_MAX_MB = 5;

const required = (label: string) => z.string().trim().min(1, `${label} is required`);

function price(label: string) {
  return required(label)
    .refine((value) => Number(value) > 0, `${label} must be greater than 0`)
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), "Enter an amount like 19.99, with up to 2 decimals")
    .transform(Number);
}

function wholeNumber(label: string, min: number) {
  return required(label)
    .refine((value) => /^-?\d+$/.test(value), `${label} must be a whole number`)
    .refine(
      (value) => Number(value) >= min,
      min === 0 ? `${label} can't be negative` : `${label} must be at least ${min}`,
    )
    .transform(Number);
}

function optionalWholeNumber(label: string, min: number) {
  return z
    .string()
    .trim()
    .refine((value) => !value || /^-?\d+$/.test(value), `${label} must be a whole number`)
    .refine((value) => !value || Number(value) >= min, `${label} must be at least ${min}`)
    .transform((value) => (value ? Number(value) : null));
}

function isWebUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}

function storeLink(store: string) {
  return z
    .string()
    .trim()
    .refine((value) => !value || isWebUrl(value), `Enter the full ${store} link, starting with https://`)
    .transform((value) => value || null);
}

/** Tier inputs are kept as typed strings, so an emptied field stays empty instead of becoming 0. */
const tierSchema = z.object({
  minQty: wholeNumber("Min qty", 1),
  maxQty: optionalWholeNumber("Max qty", 1), // empty = open-ended ("50+")
  discountPercent: z
    .string()
    .trim()
    .refine(
      (value) => !value || (Number(value) >= 0 && Number(value) <= 100),
      "Discount must be between 0 and 100%",
    )
    .transform((value) => (value ? Number(value) : 0)),
  unitPrice: price("Unit price"),
});

export type TierDraft = z.input<typeof tierSchema>;

export const productFormSchema = z
  .object({
    name: required("Product name"),
    sku: required("SKU"),
    asin: z
      .string()
      .trim()
      .transform((value) => value || null),
    description: required("Description"),
    retailPrice: price("Price"),
    wholesalePrice: price("Wholesale price"),
    wholesaleMinQty: wholeNumber("Wholesale min qty", 1),
    stock: wholeNumber("Stock", 0),
    brandId: z.string().min(1, "Select a brand"),
    categoryId: z.string().min(1, "Select a category"),
    status: z.enum(PRODUCT_STATUSES, { error: "Select a status" }),
    amazonUrl: storeLink("Amazon"),
    walmartUrl: storeLink("Walmart"),
    isFeatured: z.boolean(),
    volumeTiers: z.array(tierSchema),
  })
  .superRefine((data, ctx) => {
    // Fields that failed their own checks reach this point as their raw strings, so check types first.
    if (
      typeof data.retailPrice === "number" &&
      typeof data.wholesalePrice === "number" &&
      data.wholesalePrice > data.retailPrice
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["wholesalePrice"],
        message: "Wholesale price can't be higher than the retail price",
      });
    }

    const ranges = data.volumeTiers.map(tierRange);
    ranges.forEach((range, index) => {
      if (!range) return;
      if (range.maxQty !== null && range.maxQty < range.minQty) {
        ctx.addIssue({
          code: "custom",
          path: ["volumeTiers", index, "maxQty"],
          message: "Max qty can't be less than min qty",
        });
        ranges[index] = null; // don't compare a broken range with later tiers
        return;
      }
      const overlap = ranges.findIndex(
        (other, otherIndex) => otherIndex < index && other !== null && rangesOverlap(range, other),
      );
      if (overlap !== -1) {
        ctx.addIssue({
          code: "custom",
          path: ["volumeTiers", index, "minQty"],
          message: `This range overlaps tier ${overlap + 1} (${rangeLabel(ranges[overlap]!)})`,
        });
      }
    });
  });

type Range = { minQty: number; maxQty: number | null };

/** The tier's quantity range, or null while its quantities are still invalid (raw strings). */
function tierRange(tier: unknown): Range | null {
  const { minQty, maxQty } = tier as { minQty: unknown; maxQty: unknown };
  if (typeof minQty !== "number") return null;
  if (maxQty !== null && typeof maxQty !== "number") return null;
  return { minQty, maxQty };
}

function rangesOverlap(a: Range, b: Range) {
  return a.minQty <= (b.maxQty ?? Infinity) && b.minQty <= (a.maxQty ?? Infinity);
}

function rangeLabel(range: Range) {
  return range.maxQty == null ? `${range.minQty}+` : `${range.minQty}–${range.maxQty}`;
}

/** What the form holds. `status` is a plain string because the API types it that way. */
export type ProductFormValues = Omit<z.input<typeof productFormSchema>, "status"> & { status: string };
export type ProductPayload = z.output<typeof productFormSchema>;
/** Messages keyed by field name; tier fields use `volumeTiers.<index>.<field>`. */
export type ProductFormErrors = Record<string, string>;

/**
 * Validates the form. `imageCount` is the number of images (kept + new); the first one is the
 * cover and is required. Its message is under the `images` key.
 */
export function validateProduct(
  input: ProductFormValues,
  imageCount: number,
): { data: ProductPayload; errors: ProductFormErrors } | { data: null; errors: ProductFormErrors } {
  const result = productFormSchema.safeParse(input);
  const errors: ProductFormErrors = {};
  if (imageCount === 0) errors.images = "Add a cover image";
  for (const issue of result.error?.issues ?? []) {
    const key = issue.path.map(String).join(".");
    errors[key] ??= issue.message; // first message per field
  }

  if (!result.success || Object.keys(errors).length > 0) return { data: null, errors };
  return { data: result.data, errors };
}

/** Returns why an image can't be added, or null when it's fine. */
export function imageFileProblem(file: File) {
  if (!PRODUCT_IMAGE_TYPES.includes(file.type)) return `"${file.name}" isn't a PNG, JPG or WebP image.`;
  if (file.size > PRODUCT_IMAGE_MAX_MB * 1024 * 1024) {
    return `"${file.name}" is larger than ${PRODUCT_IMAGE_MAX_MB} MB.`;
  }
  return null;
}
