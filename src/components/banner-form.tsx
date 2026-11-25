"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ProductPicker, type PickedProduct } from "@/components/product-picker";
import { toast } from "@/components/toast";
import { apiErrorMessage, apiErrorStatus, apiFieldErrors } from "@/lib/api-error";
import {
  BANNER_DISCOUNT_MAX,
  BANNER_DISCOUNT_MIN,
  discountedPrice,
  offerDate,
  toDateInput,
  todayInput,
  validateBanner,
  type BannerFormErrors,
  type BannerFormValues,
} from "@/lib/banner-schema";
import { money } from "@/lib/format";
import { imageFileProblem } from "@/lib/product-schema";
import type { BannerTarget, CategoryRecord } from "@/lib/types";
import {
  asList,
  useCreateBannerMutation,
  useGetBannerQuery,
  useGetCategoriesQuery,
  useUpdateBannerMutation,
} from "@/store/api";

const emptyValues: Omit<BannerFormValues, "hasImage"> = {
  targetType: "",
  productId: "",
  categoryId: "",
  discountPercent: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

const TARGETS: { value: BannerTarget; title: string; hint: string }[] = [
  { value: "product", title: "A product", hint: "Opens that product's page" },
  { value: "category", title: "A category", hint: "Opens the category page with all its products" },
];

export function BannerForm({ id, onDone }: { id?: string; onDone?: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: existing } = useGetBannerQuery(id as string, { skip: !id });
  const { data: categoryRes } = useGetCategoriesQuery();
  const [createBanner, createState] = useCreateBannerMutation();
  const [updateBanner, updateState] = useUpdateBannerMutation();
  const categories = asList<CategoryRecord>(categoryRes?.data).items;

  const [values, setValues] = useState(emptyValues);
  const [product, setProduct] = useState<PickedProduct | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [legacyLink, setLegacyLink] = useState("");
  const [savedDates, setSavedDates] = useState<{ startDate?: string; endDate?: string }>({});
  const [imageError, setImageError] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set());
  const [serverErrors, setServerErrors] = useState<BannerFormErrors>({});

  useEffect(() => {
    const banner = existing?.data;
    if (!banner) return;
    setValues({
      targetType: banner.targetType ?? "",
      productId: banner.productId ?? banner.product?.id ?? "",
      categoryId: banner.categoryId ?? banner.category?.id ?? "",
      discountPercent: banner.discountPercent ? String(banner.discountPercent) : "",
      startDate: toDateInput(banner.startDate),
      endDate: toDateInput(banner.endDate),
      isActive: banner.isActive !== false,
    });
    setProduct(banner.product ?? null);
    setPreview(banner.image ?? null);
    setLegacyLink(banner.targetType ? "" : (banner.link ?? ""));
    setSavedDates({ startDate: toDateInput(banner.startDate), endDate: toDateInput(banner.endDate) });
  }, [existing]);

  const validation = useMemo(
    () => validateBanner({ ...values, hasImage: Boolean(preview) }, savedDates),
    [values, preview, savedDates],
  );

  function errorFor(key: keyof BannerFormValues) {
    const clientError = submitted || touched.has(key) ? validation.errors[key] : undefined;
    return clientError ?? serverErrors[key];
  }

  function set<K extends keyof typeof emptyValues>(key: K, value: (typeof emptyValues)[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setServerErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function touch(key: string) {
    setTouched((current) => (current.has(key) ? current : new Set(current).add(key)));
  }

  function onPick(files: FileList | null) {
    const next = files?.[0];
    if (!next) return;
    const problem = imageFileProblem(next);
    setImageError(problem ?? "");
    if (problem) return;
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  function focusFirstError(errors: BannerFormErrors) {
    const field = Array.from(formRef.current?.elements ?? []).find(
      (element): element is HTMLInputElement =>
        element instanceof HTMLElement && Boolean(errors[(element as HTMLInputElement).name as keyof BannerFormValues]),
    );
    field?.scrollIntoView({ block: "center", behavior: "smooth" });
    field?.focus({ preventScroll: true });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitted(true);
    if (!validation.payload) {
      focusFirstError(validation.errors);
      return;
    }

    const body = new FormData();
    body.append("data", JSON.stringify(validation.payload));
    if (file) body.append("image", file);

    try {
      const result = id ? await updateBanner({ id, body }).unwrap() : await createBanner(body).unwrap();
      toast.success(result.message || (id ? "Banner updated." : "Banner added."));
      onDone?.();
    } catch (err) {
      const fields = serverFieldErrors(err);
      setServerErrors(fields);
      if (Object.keys(fields).length > 0) focusFirstError(fields);
      else setError(apiErrorMessage(err, "Could not save the banner. Please try again."));
    }
  }

  const loading = createState.isLoading || updateState.isLoading;
  const hasDiscount = values.discountPercent.trim() !== "";
  const category = categories.find((item) => item.id === values.categoryId) ?? existing?.data?.category ?? null;

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onBlur={(event) => {
        const target: EventTarget = event.target;
        if ((target instanceof HTMLInputElement || target instanceof HTMLSelectElement) && target.name) {
          touch(target.name);
        }
      }}
      noValidate
      className="space-y-5"
    >
      {/* Image */}
      <div>
        <p className="mb-2 text-sm font-semibold">
          Banner image <span className="text-danger">*</span>
        </p>
        <button
          type="button"
          name="hasImage"
          onClick={() => fileRef.current?.click()}
          aria-describedby={errorFor("hasImage") ? "hasImage-error" : undefined}
          className={`flex min-h-[180px] w-full flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center text-sm ${
            errorFor("hasImage") ? "border-danger bg-danger-bg text-danger" : "border-line bg-input text-muted"
          }`}
        >
          {preview ? (
            <Image src={preview} alt="" width={420} height={160} className="h-40 w-full rounded-xl object-cover" unoptimized />
          ) : (
            <>
              <span className="mb-2 text-2xl text-brand">+</span>
              Click to upload banner image
              <br />
              Recommended 1400×500 · PNG, JPG or WebP, up to 5 MB
            </>
          )}
        </button>
        {preview ? <p className="mt-1.5 px-1 text-xs text-muted">Click the image to replace it.</p> : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(event) => {
            onPick(event.target.files);
            event.target.value = "";
          }}
        />
        <ErrorText id="hasImage-error" message={imageError || errorFor("hasImage")} />
      </div>

      {/* Target */}
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">
          When shoppers click this banner, take them to <span className="text-danger">*</span>
        </legend>
        <p className="mb-3 text-xs text-muted">Choose one. Any discount below applies to what you pick here.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {TARGETS.map((target) => {
            const checked = values.targetType === target.value;
            return (
              <label
                key={target.value}
                className={`flex cursor-pointer gap-3 rounded-2xl border p-4 text-sm transition ${
                  checked
                    ? "border-brand bg-[#fbf4ec]"
                    : errorFor("targetType")
                      ? "border-danger"
                      : "border-line hover:border-brand/50"
                }`}
              >
                <input
                  type="radio"
                  name="targetType"
                  value={target.value}
                  checked={checked}
                  onChange={() => set("targetType", target.value)}
                  aria-describedby={errorFor("targetType") ? "targetType-error" : undefined}
                  className="mt-0.5 accent-brand"
                />
                <span>
                  <span className="block font-semibold text-ink">{target.title}</span>
                  <span className="block text-xs text-muted">{target.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
        <ErrorText id="targetType-error" message={errorFor("targetType")} />

        {values.targetType === "product" ? (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold">
              Product <span className="text-danger">*</span>
            </p>
            <ProductPicker
              name="productId"
              value={product}
              invalid={Boolean(errorFor("productId"))}
              describedBy={errorFor("productId") ? "productId-error" : undefined}
              onChange={(picked) => {
                setProduct(picked);
                set("productId", picked.id);
              }}
            />
            <ErrorText id="productId-error" message={errorFor("productId")} />
          </div>
        ) : null}

        {values.targetType === "category" ? (
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-semibold">
              Category <span className="text-danger">*</span>
            </span>
            <select
              name="categoryId"
              value={values.categoryId}
              onChange={(event) => set("categoryId", event.target.value)}
              aria-describedby={errorFor("categoryId") ? "categoryId-error" : undefined}
              className={`${inputClass} ${errorFor("categoryId") ? invalidTone : validTone}`}
            >
              <option value="">Select a category</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item._count?.products != null ? ` (${item._count.products} products)` : ""}
                  {item.status === "inactive" ? " · inactive" : ""}
                </option>
              ))}
            </select>
            <ErrorText id="categoryId-error" message={errorFor("categoryId")} />
          </label>
        ) : null}

        {legacyLink ? (
          <p className="mt-3 rounded-2xl bg-warning-bg px-4 py-3 text-xs text-warning">
            This banner was made with a custom link (<span className="break-all font-medium">{legacyLink}</span>).
            Choose a product or category above to replace it.
          </p>
        ) : null}
      </fieldset>

      {/* Discount */}
      <div className="rounded-2xl border border-line-soft p-4">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">
            Discount (%) <span className="font-normal text-muted">· optional</span>
          </span>
          <span className="mb-2 block text-xs text-muted">
            Leave empty for a banner without an offer.{" "}
            {values.targetType === "category"
              ? "The discount applies to every product in the category."
              : "The discount applies to the selected product."}
          </span>
          <span className="relative block">
            <input
              type="number"
              inputMode="decimal"
              name="discountPercent"
              min={BANNER_DISCOUNT_MIN}
              max={BANNER_DISCOUNT_MAX}
              step="0.5"
              placeholder="e.g. 15"
              value={values.discountPercent}
              onChange={(event) => set("discountPercent", event.target.value)}
              aria-invalid={errorFor("discountPercent") ? true : undefined}
              aria-describedby={errorFor("discountPercent") ? "discountPercent-error" : undefined}
              className={`${inputClass} pr-10 ${errorFor("discountPercent") ? invalidTone : validTone}`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted">%</span>
          </span>
          <ErrorText id="discountPercent-error" message={errorFor("discountPercent")} />
        </label>

        {hasDiscount ? (
          <div className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <DateField
                label="Offer starts"
                name="startDate"
                value={values.startDate}
                min={todayInput()}
                error={errorFor("startDate")}
                onChange={(value) => set("startDate", value)}
              />
              <DateField
                label="Offer ends"
                name="endDate"
                value={values.endDate}
                min={values.startDate || todayInput()}
                error={errorFor("endDate")}
                onChange={(value) => set("endDate", value)}
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              The offer runs from 12:00 AM on the first day to 11:59 PM on the last day (UTC time). Pick the same
              day twice for a one-day offer.
            </p>
          </div>
        ) : null}
      </div>

      <Summary
        targetType={values.targetType}
        product={values.targetType === "product" ? product : null}
        category={values.targetType === "category" ? category : null}
        discount={hasDiscount && !validation.errors.discountPercent ? Number(values.discountPercent) : null}
        startDate={values.startDate}
        endDate={values.endDate}
        isActive={values.isActive}
      />

      {/* Status */}
      <div>
        <p className="mb-2 text-sm font-semibold">Status</p>
        <div className="flex h-12 items-center gap-5 rounded-full border border-line bg-input px-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="isActive" checked={values.isActive} onChange={() => set("isActive", true)} />
            Active
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="isActive" checked={!values.isActive} onChange={() => set("isActive", false)} />
            Hidden
          </label>
        </div>
        <p className="mt-1.5 px-1 text-xs text-muted">
          Hidden banners don&apos;t appear on the homepage, and their discount is paused.
        </p>
      </div>

      {submitted && !validation.payload ? (
        <p className="text-sm text-danger">Fix the highlighted fields before saving.</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onDone}
          className="h-11 rounded-full border border-line bg-white px-5 text-sm font-semibold text-slate"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="h-11 rounded-full bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Saving..." : id ? "Update Banner" : "Add Banner"}
        </button>
      </div>
    </form>
  );
}

/** Plain-language recap of what shoppers will get, so the admin can check before saving. */
function Summary({
  targetType,
  product,
  category,
  discount,
  startDate,
  endDate,
  isActive,
}: {
  targetType: BannerTarget | "";
  product: PickedProduct | null;
  category: Pick<CategoryRecord, "name" | "_count"> | null;
  discount: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
}) {
  const targetName = targetType === "product" ? product?.name : category?.name;
  if (!targetType || !targetName) return null;

  const productCount = category?._count?.products;
  const dates =
    startDate && endDate ? (
      <>
        from <strong>{offerDate(`${startDate}T00:00:00Z`)}</strong> to <strong>{offerDate(`${endDate}T00:00:00Z`)}</strong>
      </>
    ) : (
      "during the offer dates"
    );

  let offer: ReactNode = null;
  if (discount) {
    if (targetType === "product" && product) {
      offer = (
        <>
          {" "}
          Its price drops by <strong>{discount}%</strong> {dates}:{" "}
          <strong>{money(discountedPrice(product.retailPrice, discount))}</strong> instead of {money(product.retailPrice)}.
        </>
      );
    } else {
      offer = (
        <>
          {" "}
          Every product in it{productCount != null ? ` (${productCount} right now)` : ""} is <strong>{discount}% off</strong> {dates}.
        </>
      );
    }
  }

  return (
    <div className="rounded-2xl bg-[#fbf4ec] px-4 py-3 text-sm leading-relaxed text-ink">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">What shoppers will get</p>
      <p>
        Clicking the banner opens the {targetType} <strong>{targetName}</strong>.{offer}
      </p>
      {discount ? (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted">
          <li>Wholesale customers get the same % off their wholesale price.</li>
          <li>If a product also has a deal, shoppers pay whichever price is lower. Discounts don&apos;t add up.</li>
          {!isActive ? <li className="text-warning">This banner is hidden, so the discount is paused.</li> : null}
        </ul>
      ) : null}
    </div>
  );
}

function DateField({
  label,
  name,
  value,
  min,
  error,
  onChange,
}: {
  label: string;
  name: keyof BannerFormValues;
  value: string;
  min?: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">
        {label} <span className="text-danger">*</span>
      </span>
      <input
        type="date"
        name={name}
        value={value}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`${inputClass} ${error ? invalidTone : validTone}`}
      />
      <ErrorText id={`${name}-error`} message={error} />
    </label>
  );
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="mt-1.5 block px-1 text-xs font-medium text-danger">
      {message}
    </span>
  );
}

/** Backend validation errors by field, plus a deleted product/category (404). */
function serverFieldErrors(err: unknown): BannerFormErrors {
  const fields: BannerFormErrors = {};
  for (const [key, message] of Object.entries(apiFieldErrors(err))) {
    if (key in emptyValues) fields[key as keyof BannerFormValues] = message;
  }
  const message = apiErrorMessage(err, "");
  if (apiErrorStatus(err) === 404 && /product/i.test(message)) {
    fields.productId = "This product no longer exists. Pick another one";
  }
  if (apiErrorStatus(err) === 404 && /category/i.test(message)) {
    fields.categoryId = "This category no longer exists. Pick another one";
  }
  return fields;
}

const inputClass = "h-12 w-full rounded-full border bg-input px-4 text-sm outline-none";
const validTone = "border-line focus:border-brand";
const invalidTone = "border-danger focus:border-danger";
