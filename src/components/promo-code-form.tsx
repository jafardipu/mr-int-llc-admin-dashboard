"use client";

import { useEffect, useState } from "react";
import { addDays, toDateInput, todayInput } from "@/lib/dates";
import {
  useCreatePromoCodeMutation,
  useGetPromoCodeQuery,
  useUpdatePromoCodeMutation,
} from "@/store/api";

type DateKey = "startsAt" | "expiresAt";

/**
 * Date rules. Dates are sent as `YYYY-MM-DD`, which the backend stores as 00:00 UTC, and a code
 * counts as expired from that moment. So the expiry must be a later day than the start (or than
 * today when there's no start), or the code could never be used. Dates already saved on a
 * running or expired code may stay as they are.
 */
function dateErrors(
  form: { startsAt: string; expiresAt: string },
  saved: Partial<Record<DateKey, string>>,
): Partial<Record<DateKey, string>> {
  const today = todayInput();
  const errors: Partial<Record<DateKey, string>> = {};
  if (form.startsAt && form.startsAt !== saved.startsAt && form.startsAt < today) {
    errors.startsAt = "The start date can't be before today";
  }
  if (form.expiresAt) {
    if (form.startsAt && form.expiresAt <= form.startsAt) {
      errors.expiresAt = "The expiry date must be after the start date";
    } else if (!form.startsAt && form.expiresAt !== saved.expiresAt && form.expiresAt <= today) {
      errors.expiresAt = "The expiry date must be after today";
    }
  }
  return errors;
}

const empty = {
  code: "",
  description: "",
  discountType: "percentage" as "percentage" | "fixed",
  discountValue: "10",
  minOrderAmount: "0",
  maxDiscount: "",
  usageLimit: "",
  perUserLimit: "1",
  startsAt: "",
  expiresAt: "",
  isActive: true,
  customerType: "" as "" | "retail" | "wholesale",
};

export function PromoCodeForm({
  id,
  onDone,
}: {
  id?: string;
  onDone?: () => void;
}) {
  const { data: existing } = useGetPromoCodeQuery(id as string, { skip: !id });
  const [createPromo, createState] = useCreatePromoCodeMutation();
  const [updatePromo, updateState] = useUpdatePromoCodeMutation();
  const [form, setForm] = useState(empty);
  const [savedDates, setSavedDates] = useState<Partial<Record<DateKey, string>>>({});
  const [error, setError] = useState("");
  const invalidDates = dateErrors(form, savedDates);

  useEffect(() => {
    const promo = existing?.data;
    if (!promo) return;
    setSavedDates({ startsAt: toDateInput(promo.startsAt), expiresAt: toDateInput(promo.expiresAt) });
    setForm({
      code: promo.code ?? "",
      description: promo.description ?? "",
      discountType: promo.discountType ?? "percentage",
      discountValue: String(promo.discountValue ?? 0),
      minOrderAmount: String(promo.minOrderAmount ?? 0),
      maxDiscount: promo.maxDiscount != null ? String(promo.maxDiscount) : "",
      usageLimit: promo.usageLimit != null ? String(promo.usageLimit) : "",
      perUserLimit: String(promo.perUserLimit ?? 1),
      startsAt: toDateInput(promo.startsAt),
      expiresAt: toDateInput(promo.expiresAt),
      isActive: promo.isActive !== false,
      customerType: promo.customerType ?? "",
    });
  }, [existing]);

  function setField<K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const firstInvalid = (["startsAt", "expiresAt"] as const).find((key) => invalidDates[key]);
    if (firstInvalid) {
      (event.currentTarget.elements.namedItem(firstInvalid) as HTMLInputElement | null)?.focus();
      return;
    }
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount || 0),
      maxDiscount: form.maxDiscount === "" ? null : Number(form.maxDiscount),
      usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
      perUserLimit: Number(form.perUserLimit || 1),
      startsAt: form.startsAt || null,
      expiresAt: form.expiresAt || null,
      isActive: form.isActive,
      customerType: form.customerType || null,
    };

    try {
      if (id) {
        await updatePromo({ id, body: payload }).unwrap();
      } else {
        await createPromo(payload).unwrap();
      }
      onDone?.();
    } catch (err) {
      const message =
        err && typeof err === "object" && "data" in err
          ? ((err.data as { message?: string })?.message ?? "Save failed")
          : "Save failed";
      setError(message);
    }
  }

  const loading = createState.isLoading || updateState.isLoading;
  const inputClass =
    "h-12 w-full rounded-full border border-line bg-input px-4 text-sm outline-none focus:border-brand";
  const invalidInputClass =
    "h-12 w-full rounded-full border border-danger bg-input px-4 text-sm outline-none focus:border-danger";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-2 block text-sm font-semibold">
            Code <span className="text-danger">*</span>
          </span>
          <input
            value={form.code}
            onChange={(e) => setField("code", e.target.value.toUpperCase())}
            placeholder="WELCOME10"
            className={inputClass}
            required
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-2 block text-sm font-semibold">Description</span>
          <input
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            placeholder="Optional note for admins"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Discount type</span>
          <select
            value={form.discountType}
            onChange={(e) =>
              setField("discountType", e.target.value as "percentage" | "fixed")
            }
            className={inputClass}
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">
            Discount value <span className="text-danger">*</span>
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.discountValue}
            onChange={(e) => setField("discountValue", e.target.value)}
            className={inputClass}
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Min order amount</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.minOrderAmount}
            onChange={(e) => setField("minOrderAmount", e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Max discount</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.maxDiscount}
            onChange={(e) => setField("maxDiscount", e.target.value)}
            placeholder="No cap"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Usage limit</span>
          <input
            type="number"
            min="1"
            step="1"
            value={form.usageLimit}
            onChange={(e) => setField("usageLimit", e.target.value)}
            placeholder="Unlimited"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Per-user limit</span>
          <input
            type="number"
            min="1"
            step="1"
            value={form.perUserLimit}
            onChange={(e) => setField("perUserLimit", e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Starts at</span>
          <input
            type="date"
            name="startsAt"
            value={form.startsAt}
            min={todayInput()}
            onChange={(e) => setField("startsAt", e.target.value)}
            aria-invalid={invalidDates.startsAt ? true : undefined}
            aria-describedby={invalidDates.startsAt ? "promo-startsAt-error" : undefined}
            className={invalidDates.startsAt ? invalidInputClass : inputClass}
          />
          {invalidDates.startsAt ? (
            <span id="promo-startsAt-error" className="mt-1.5 block px-1 text-xs font-medium text-danger">
              {invalidDates.startsAt}
            </span>
          ) : (
            <span className="mt-1.5 block px-1 text-xs text-muted">Empty = usable right away</span>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Expires at</span>
          <input
            type="date"
            name="expiresAt"
            value={form.expiresAt}
            min={addDays(form.startsAt || todayInput(), 1)}
            onChange={(e) => setField("expiresAt", e.target.value)}
            aria-invalid={invalidDates.expiresAt ? true : undefined}
            aria-describedby={invalidDates.expiresAt ? "promo-expiresAt-error" : "promo-expiresAt-hint"}
            className={invalidDates.expiresAt ? invalidInputClass : inputClass}
          />
          {invalidDates.expiresAt ? (
            <span id="promo-expiresAt-error" className="mt-1.5 block px-1 text-xs font-medium text-danger">
              {invalidDates.expiresAt}
            </span>
          ) : (
            <span id="promo-expiresAt-hint" className="mt-1.5 block px-1 text-xs text-muted">
              The code stops working at 12:00 AM (UTC) on this day
            </span>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Customer type</span>
          <select
            value={form.customerType}
            onChange={(e) =>
              setField("customerType", e.target.value as "" | "retail" | "wholesale")
            }
            className={inputClass}
          >
            <option value="">All customers</option>
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
          </select>
        </label>

        <label className="flex items-center gap-3 pt-8">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setField("isActive", e.target.checked)}
            className="size-4 rounded border-line accent-brand"
          />
          <span className="text-sm font-semibold">Active</span>
        </label>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

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
          {loading ? "Saving..." : id ? "Update promo" : "Create promo"}
        </button>
      </div>
    </form>
  );
}
