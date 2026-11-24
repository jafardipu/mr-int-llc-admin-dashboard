"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useCreateProductMutation,
  useGetBrandsQuery,
  useGetCategoriesQuery,
  useGetProductQuery,
  useUpdateProductMutation,
} from "@/store/api";
import { apiErrorMessage, apiErrorStatus, apiFieldErrors, duplicateKeys } from "@/lib/api-error";
import {
  imageFileProblem,
  PRODUCT_IMAGE_LIMIT,
  PRODUCT_IMAGE_MAX_MB,
  validateProduct,
  type ProductFormErrors,
  type TierDraft,
} from "@/lib/product-schema";
import type { BrandRecord, CategoryRecord } from "@/lib/types";
import { asList } from "@/store/baseQuery";

type Preview = { url: string; file?: File; existing?: boolean };

const emptyForm = {
  name: "",
  sku: "",
  asin: "",
  description: "",
  retailPrice: "",
  wholesalePrice: "",
  wholesaleMinQty: "1",
  stock: "0",
  brandId: "",
  categoryId: "",
  status: "active",
  amazonUrl: "",
  walmartUrl: "",
};
type FormState = typeof emptyForm;

const TIER_FIELDS = ["minQty", "maxQty", "discountPercent", "unitPrice"] as const;

// Starts empty (placeholders show the format) so typing doesn't land next to a default "0".
const emptyTier = (): TierDraft => ({
  minQty: "",
  maxQty: "",
  discountPercent: "",
  unitPrice: "",
});

export function ProductForm({ id }: { id?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: existing } = useGetProductQuery(id as string, { skip: !id });
  const { data: categoryRes } = useGetCategoriesQuery();
  const { data: brandRes } = useGetBrandsQuery();
  const [createProduct, createState] = useCreateProductMutation();
  const [updateProduct, updateState] = useUpdateProductMutation();
  const categories = asList<CategoryRecord>(categoryRes?.data).items;
  const brands = asList<BrandRecord>(brandRes?.data).items;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isFeatured, setIsFeatured] = useState(false);
  const [tiers, setTiers] = useState<TierDraft[]>([]);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  // A field's error shows once it has been left (blurred) or after the first submit attempt.
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set());
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<ProductFormErrors>({});

  const validation = useMemo(
    () => validateProduct({ ...form, isFeatured, volumeTiers: tiers }, previews.length),
    [form, isFeatured, tiers, previews.length],
  );

  useEffect(() => {
    const product = existing?.data;
    if (!product) return;
    setForm({
      name: product.name ?? "",
      sku: product.sku ?? "",
      asin: product.asin ?? "",
      description: product.description ?? "",
      retailPrice: String(product.retailPrice ?? ""),
      wholesalePrice: String(product.wholesalePrice ?? ""),
      wholesaleMinQty: String(product.wholesaleMinQty ?? 1),
      stock: String(product.stock ?? 0),
      brandId: product.brandId ?? product.brand?.id ?? "",
      categoryId: product.categoryId ?? product.category?.id ?? "",
      status: product.status ?? "active",
      amazonUrl: product.amazonUrl ?? "",
      walmartUrl: product.walmartUrl ?? "",
    });
    setIsFeatured(product.isFeatured === true);
    setTiers(
      (Array.isArray(product.volumeTiers) ? product.volumeTiers : []).map((tier) => ({
        minQty: String(tier.minQty ?? ""),
        maxQty: tier.maxQty == null ? "" : String(tier.maxQty),
        discountPercent: String(tier.discountPercent ?? ""),
        unitPrice: String(tier.unitPrice ?? ""),
      })),
    );
    setPreviews(
      (product.images ?? []).map((image) => ({ url: image.url, existing: true })),
    );
  }, [existing]);

  function errorFor(name: string) {
    const clientError = submitted || touched.has(name) ? validation.errors[name] : undefined;
    return clientError ?? serverErrors[name];
  }

  /** Props for an input/select/textarea: name, error styling and the link to its message. */
  function control(name: string, kind: keyof typeof controlClass = "input", messageId = errorId(name)) {
    const message = errorFor(name);
    return {
      name,
      "aria-invalid": message ? true : undefined,
      "aria-describedby": message ? messageId : undefined,
      className: `${controlClass[kind]} ${message ? invalidTone : validTone}`,
    };
  }

  function touch(name: string) {
    setTouched((current) => (current.has(name) ? current : new Set(current).add(name)));
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setServerErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function onPickFiles(files: File[]) {
    if (!files.length) return;
    const problems = files.map(imageFileProblem).filter((problem) => problem !== null);
    const valid = files.filter((file) => !imageFileProblem(file));
    const accepted = valid.slice(0, Math.max(PRODUCT_IMAGE_LIMIT - previews.length, 0));
    const skipped = valid.length - accepted.length;
    if (skipped > 0) {
      problems.push(
        `A product can have up to ${PRODUCT_IMAGE_LIMIT} images, so ${skipped} ${skipped === 1 ? "image was" : "images were"} not added.`,
      );
    }
    setImageError(problems.join(" "));
    setPreviews((current) => [
      ...current,
      ...accepted.map((file) => ({ url: URL.createObjectURL(file), file })),
    ]);
  }

  function removeImage(index: number) {
    setPreviews((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setImageError("");
    touch("images"); // removing the last image shows "Add a cover image" right away
  }

  function updateTier(index: number, patch: Partial<TierDraft>) {
    setTiers((current) => current.map((tier, itemIndex) => (itemIndex === index ? { ...tier, ...patch } : tier)));
  }

  function removeTier(index: number) {
    setTiers((current) => current.filter((_, itemIndex) => itemIndex !== index));
    // Rows shift up after a removal, so per-row "touched" marks no longer line up.
    setTouched((current) => new Set([...current].filter((name) => !name.startsWith("volumeTiers."))));
  }

  /** Scrolls to and focuses the first field (in page order) that has a message. */
  function focusFirstError(errors: ProductFormErrors) {
    const field = Array.from(formRef.current?.elements ?? []).find(
      (element): element is HTMLInputElement =>
        element instanceof HTMLElement && Boolean(errors[(element as HTMLInputElement).name]),
    );
    field?.scrollIntoView({ block: "center", behavior: "smooth" });
    field?.focus({ preventScroll: true });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitted(true);
    if (!validation.data) {
      focusFirstError(validation.errors);
      return;
    }

    const payload = {
      ...validation.data,
      keepImages: previews.filter((item) => item.existing).map((item) => item.url),
    };
    const body = new FormData();
    body.append("data", JSON.stringify(payload));
    previews.forEach((item) => {
      if (item.file) body.append("images", item.file);
    });
    try {
      if (id) {
        await updateProduct({ id, body }).unwrap();
        router.push(`/products/${id}`);
      } else {
        const result = await createProduct(body).unwrap();
        router.push(result.data?.id ? `/products/${result.data.id}` : "/products");
      }
    } catch (err) {
      const fieldErrors = serverFieldErrors(err);
      setServerErrors(fieldErrors);
      if (Object.keys(fieldErrors).length > 0) focusFirstError(fieldErrors);
      else setError(apiErrorMessage(err, "Could not save the product. Please try again."));
    }
  }

  const loading = createState.isLoading || updateState.isLoading;
  const cover = previews[0];
  const showSummary = submitted && !validation.data;

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onBlur={(event) => {
        const target: EventTarget = event.target;
        const isControl =
          target instanceof HTMLInputElement ||
          target instanceof HTMLSelectElement ||
          target instanceof HTMLTextAreaElement;
        if (isControl && target.name) touch(target.name);
      }}
      noValidate
      className="space-y-6"
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-2xl bg-white p-4">
              {cover ? (
                <div className="relative">
                  <Image src={cover.url} alt="" width={420} height={420} className="h-[280px] w-full rounded-2xl object-cover" />
                  <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-semibold">Cover</span>
                  <button type="button" onClick={() => removeImage(0)} className="absolute right-3 top-3 rounded-full bg-white px-2 text-sm">
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  name="images"
                  onClick={() => fileRef.current?.click()}
                  aria-describedby={errorFor("images") ? errorId("images") : undefined}
                  className={`flex h-[280px] w-full items-center justify-center rounded-2xl border text-sm ${
                    errorFor("images")
                      ? "border-dashed border-danger bg-danger-bg text-danger"
                      : "border-transparent bg-input text-muted"
                  }`}
                >
                  Add cover image<span className="text-danger">&nbsp;*</span>
                </button>
              )}
              {errorFor("images") ? (
                <p id={errorId("images")} className="mt-2 px-1 text-xs font-medium text-danger">
                  {errorFor("images")}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white text-sm text-muted"
            >
              <span className="mb-2 text-2xl text-brand">+</span>
              Upload
              <span className="mt-1 text-xs">PNG, JPG or WebP, up to {PRODUCT_IMAGE_MAX_MB} MB each</span>
            </button>
          </div>
          {previews.length > 1 ? (
            <div className="flex flex-wrap gap-3">
              {previews.slice(1).map((item, index) => (
                <div key={`${item.url}-${index}`} className="relative">
                  <Image src={item.url} alt="" width={72} height={72} className="size-[72px] rounded-xl object-cover" />
                  <button type="button" onClick={() => removeImage(index + 1)} className="absolute -right-1 -top-1 size-5 rounded-full bg-white text-xs">
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          {imageError ? (
            <p role="alert" className="rounded-2xl bg-danger-bg px-4 py-3 text-sm text-danger">
              {imageError}
            </p>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            hidden
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = ""; // lets the same file be picked again after removing it
              onPickFiles(files);
            }}
          />

          <div className="rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold">Product Details</h3>
            <p className="mb-5 text-sm text-muted">Key info to describe and display your product.</p>
            <div className="space-y-4">
              <Field label="Product Name" required name="name" error={errorFor("name")}>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} required {...control("name")} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Status" required name="status" error={errorFor("status")}>
                  <select value={form.status} onChange={(e) => set("status", e.target.value)} {...control("status")}>
                    <option value="active">Active</option>
                    <option value="inactive">Draft</option>
                    <option value="out_of_stock">Out of stock</option>
                  </select>
                </Field>
                <Field label="Brand" required name="brandId" error={errorFor("brandId")}>
                  <select value={form.brandId} onChange={(e) => set("brandId", e.target.value)} required {...control("brandId")}>
                    <option value="">Select brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="SKU" required name="sku" error={errorFor("sku")}>
                  <input value={form.sku} onChange={(e) => set("sku", e.target.value)} required {...control("sku")} />
                </Field>
                <Field label="ASIN No" name="asin" error={errorFor("asin")}>
                  <input value={form.asin} onChange={(e) => set("asin", e.target.value)} {...control("asin")} />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Category" required name="categoryId" error={errorFor("categoryId")}>
                  <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} required {...control("categoryId")}>
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </Field>
                <div>
                  <p className="mb-2 text-sm font-semibold text-label">Featured</p>
                  <label className="flex h-12 cursor-pointer items-center gap-3 rounded-full border border-line bg-input px-5 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="size-4 accent-[var(--brand,#c45c26)]"
                    />
                    Featured product
                  </label>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Price / MSRP" required name="retailPrice" error={errorFor("retailPrice")}>
                  <input type="number" inputMode="decimal" min="0" step="0.01" value={form.retailPrice} onChange={(e) => set("retailPrice", e.target.value)} required {...control("retailPrice")} />
                </Field>
                <Field label="Discount / Wholesale Base" required name="wholesalePrice" error={errorFor("wholesalePrice")}>
                  <input type="number" inputMode="decimal" min="0" step="0.01" value={form.wholesalePrice} onChange={(e) => set("wholesalePrice", e.target.value)} required {...control("wholesalePrice")} />
                </Field>
                <Field label="Stock" name="stock" error={errorFor("stock")}>
                  <input type="number" inputMode="numeric" min="0" step="1" value={form.stock} onChange={(e) => set("stock", e.target.value)} {...control("stock")} />
                </Field>
                <Field label="Wholesale Min Qty" name="wholesaleMinQty" error={errorFor("wholesaleMinQty")}>
                  <input type="number" inputMode="numeric" min="1" step="1" value={form.wholesaleMinQty} onChange={(e) => set("wholesaleMinQty", e.target.value)} {...control("wholesaleMinQty")} />
                </Field>
              </div>
              <Field label="Description" required name="description" error={errorFor("description")}>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} required {...control("description", "textarea")} />
              </Field>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">Marketplace Linking</h3>
              <span className="text-xs text-muted">Sales Channels</span>
            </div>
            <Field label="Amazon Product URL" name="amazonUrl" error={errorFor("amazonUrl")}>
              <input type="url" value={form.amazonUrl} onChange={(e) => set("amazonUrl", e.target.value)} placeholder="https://www.amazon.com/..." {...control("amazonUrl")} />
            </Field>
            <div className="mt-4">
              <Field label="Walmart Product URL" name="walmartUrl" error={errorFor("walmartUrl")}>
                <input type="url" value={form.walmartUrl} onChange={(e) => set("walmartUrl", e.target.value)} placeholder="https://www.walmart.com/..." {...control("walmartUrl")} />
              </Field>
            </div>
          </section>
          <section className="rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">Volume Discount Tiers</h3>
              <button type="button" onClick={() => setTiers((current) => [...current, emptyTier()])} className="text-sm font-semibold text-brand">
                + Add Tier
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_80px_1fr_32px] gap-2 text-xs font-semibold uppercase text-muted">
                <span>Qty Range</span>
                <span>Discount</span>
                <span>Unit Price</span>
                <span />
              </div>
              {tiers.length === 0 ? <p className="text-sm text-muted">No volume tiers yet.</p> : null}
              {tiers.map((tier, index) => {
                const rowErrorId = `volumeTiers.${index}-error`;
                const messages = [
                  ...new Set(
                    TIER_FIELDS.map((field) => errorFor(`volumeTiers.${index}.${field}`)).filter(Boolean),
                  ),
                ];
                const tierControl = (field: (typeof TIER_FIELDS)[number]) =>
                  control(`volumeTiers.${index}.${field}`, "tiny", rowErrorId);
                return (
                  <div key={index}>
                    <div className="grid grid-cols-[1fr_80px_1fr_32px] items-center gap-2">
                      <div className="flex items-center gap-1">
                        <input type="number" inputMode="numeric" min="1" step="1" placeholder="Min" aria-label={`Tier ${index + 1} min qty`} value={tier.minQty} onChange={(e) => updateTier(index, { minQty: e.target.value })} {...tierControl("minQty")} />
                        <span className="text-muted">-</span>
                        <input type="number" inputMode="numeric" min="1" step="1" placeholder="Max" aria-label={`Tier ${index + 1} max qty`} value={tier.maxQty} onChange={(e) => updateTier(index, { maxQty: e.target.value })} {...tierControl("maxQty")} />
                      </div>
                      <input type="number" inputMode="decimal" min="0" max="100" placeholder="0" aria-label={`Tier ${index + 1} discount percent`} value={tier.discountPercent} onChange={(e) => updateTier(index, { discountPercent: e.target.value })} {...tierControl("discountPercent")} />
                      <input type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" aria-label={`Tier ${index + 1} unit price`} value={tier.unitPrice} onChange={(e) => updateTier(index, { unitPrice: e.target.value })} {...tierControl("unitPrice")} />
                      <button type="button" aria-label={`Remove tier ${index + 1}`} onClick={() => removeTier(index)} className="text-danger">
                        ×
                      </button>
                    </div>
                    {messages.length > 0 ? (
                      <div id={rowErrorId} className="mt-1.5 space-y-0.5 px-2 text-xs font-medium text-danger">
                        {messages.map((message) => (
                          <p key={message}>{message}</p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {tiers.length > 0 ? (
                <p className="text-xs text-muted">Leave the max qty empty for an open-ended tier (e.g. 50+).</p>
              ) : null}
            </div>
          </section>
          {showSummary ? (
            <p className="text-sm text-danger">Fix the highlighted fields before saving.</p>
          ) : null}
          {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
          <button type="submit" disabled={loading} className="h-12 w-full rounded-full bg-brand text-sm font-semibold text-white disabled:opacity-70">
            {loading ? "Saving..." : id ? "Save Changes" : "Create Product"}
          </button>
        </aside>
      </div>
    </form>
  );
}

/**
 * Maps a failed save to field messages: backend validation errors by field name, plus the
 * duplicate-SKU (409) and deleted brand/category (404) errors. Anything else stays a general error.
 */
function serverFieldErrors(err: unknown): ProductFormErrors {
  const fields: ProductFormErrors = {};
  for (const [key, message] of Object.entries(apiFieldErrors(err))) {
    if (key in emptyForm) fields[key] = message;
  }
  const status = apiErrorStatus(err);
  const message = apiErrorMessage(err, "");
  if (status === 409 && /sku/i.test(message)) fields.sku = "Another product already uses this SKU";
  for (const key of duplicateKeys(err)) {
    // The backend builds the slug from the name, and deleted products keep theirs.
    if (key.includes("slug")) {
      fields.name = "Another product, possibly a deleted one, already uses this name. Try a slightly different name";
    }
    if (key.includes("sku")) fields.sku = "Another product already uses this SKU";
  }
  if (status === 404 && /brand/i.test(message)) fields.brandId = "This brand no longer exists. Pick another one";
  if (status === 404 && /category/i.test(message)) {
    fields.categoryId = "This category no longer exists. Pick another one";
  }
  return fields;
}

const errorId = (name: string) => `${name}-error`;

const controlClass = {
  input: "h-12 w-full rounded-full border bg-input px-4 text-sm outline-none",
  textarea: "w-full rounded-2xl border bg-input px-4 py-3 text-sm outline-none",
  tiny: "h-10 w-full rounded-full border bg-input px-2 text-sm outline-none",
};
const validTone = "border-line focus:border-brand";
const invalidTone = "border-danger focus:border-danger";

function Field({
  label,
  required,
  name,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-label">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      {children}
      {error ? (
        <span id={errorId(name)} className="mt-1.5 block px-4 text-xs font-medium text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}
