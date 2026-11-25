"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { toast } from "@/components/toast";
import { Modal } from "@/components/ui";
import { apiErrorMessage, apiFieldErrors } from "@/lib/api-error";
import {
  changedPrices,
  DEFAULT_PRICES,
  PRICE_FIELDS,
  pricesSummary,
  toPriceForm,
  validatePrices,
  type PriceErrors,
  type PriceField,
  type PriceForm,
} from "@/lib/pricing";
import type { StorePrices } from "@/lib/types";
import { useGetContentsQuery, useUpdateContentsMutation } from "@/store/api";

const FIELDS: { key: PriceField; label: string; unit: "$" | "%"; helper: string }[] = [
  {
    key: "shippingFee",
    label: "Shipping fee",
    unit: "$",
    helper: "Flat fee added to every order. 0 = free shipping.",
  },
  {
    key: "taxRate",
    label: "Tax rate",
    unit: "%",
    helper: "Charged on the order subtotal after any promo discount. 0 = no tax.",
  },
  {
    key: "wholesaleAccountFee",
    label: "Wholesale account fee",
    unit: "$",
    helper: "One-time fee a new wholesale account pays after verifying its email. 0 = off.",
  },
];

export default function PricingSettingsPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const { data, isLoading, error, refetch } = useGetContentsQuery("prices");
  const [updateContents, { isLoading: saving }] = useUpdateContentsMutation();
  const savedPrices = data?.data?.prices;
  const saved = useMemo<StorePrices | null>(
    () => (data ? { ...DEFAULT_PRICES, ...savedPrices } : null),
    [data, savedPrices],
  );

  const [form, setForm] = useState<PriceForm | null>(null);
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set());
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<PriceErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Fill the form when the saved prices load or change (e.g. after a save).
  const savedKey = saved ? JSON.stringify(saved) : "";
  useEffect(() => {
    if (savedKey) setForm(toPriceForm(JSON.parse(savedKey) as StorePrices));
  }, [savedKey]);

  if (error && !data) {
    return (
      <div>
        <Header />
        <section className="rounded-2xl bg-white px-6 py-12 text-center">
          <p className="text-sm text-danger">{apiErrorMessage(error, "Could not load the prices.")}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 h-10 rounded-full border border-line px-5 text-sm font-semibold text-brand"
          >
            Retry
          </button>
        </section>
      </div>
    );
  }

  if (isLoading || !saved || !form) {
    return (
      <div>
        <Header />
        <section className="space-y-6 rounded-2xl bg-white p-6" aria-busy="true" aria-label="Loading prices">
          {FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <span className="block h-4 w-32 animate-pulse rounded-full bg-line-soft" />
              <span className="block h-12 w-full max-w-sm animate-pulse rounded-full bg-line-soft" />
            </div>
          ))}
        </section>
      </div>
    );
  }

  const validation = validatePrices(form);
  const changes = validation.prices ? changedPrices(validation.prices, saved) : null;
  // Saved values are always valid, so an invalid form means something was edited.
  const dirty = changes === null || Object.keys(changes).length > 0;
  const turningFeeOff = changes?.wholesaleAccountFee === 0 && saved.wholesaleAccountFee > 0;

  function errorFor(key: PriceField) {
    const clientError = submitted || touched.has(key) ? validation.errors[key] : undefined;
    return clientError ?? serverErrors[key];
  }

  function setField(key: PriceField, value: string) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setServerErrors((current) => ({ ...current, [key]: undefined }));
    setGeneralError("");
  }

  async function save(next: Partial<StorePrices>) {
    try {
      const result = await updateContents({ prices: next }).unwrap();
      const savedNow = result.data?.prices;
      if (savedNow) setForm(toPriceForm({ ...DEFAULT_PRICES, ...savedNow }));
      setSubmitted(false);
      setTouched(new Set());
      toast.success(result.message || "Prices saved.");
    } catch (err) {
      const fields = apiFieldErrors(err);
      const mapped: PriceErrors = {};
      for (const key of [...PRICE_FIELDS, "prices"] as const) {
        if (fields[key]) mapped[key] = fields[key];
      }
      setServerErrors(mapped);
      const fieldErrorShown = PRICE_FIELDS.some((key) => mapped[key]);
      setGeneralError(
        mapped.prices ?? (fieldErrorShown ? "" : apiErrorMessage(err, "Could not save the prices. Please try again.")),
      );
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setGeneralError("");
    if (!validation.prices || !changes) {
      const firstInvalid = FIELDS.find((field) => validation.errors[field.key]);
      if (firstInvalid) {
        (formRef.current?.elements.namedItem(firstInvalid.key) as HTMLInputElement | null)?.focus();
      }
      return;
    }
    if (Object.keys(changes).length === 0) return;
    if (turningFeeOff) {
      setConfirmOpen(true);
      return;
    }
    void save(changes);
  }

  return (
    <div>
      <Header />
      <p className="mb-4 inline-flex rounded-full bg-white px-4 py-2 text-sm text-slate">
        <span className="mr-2 font-semibold text-ink">Current:</span>
        {pricesSummary(saved)}
      </p>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <form
          ref={formRef}
          onSubmit={onSubmit}
          onBlur={(event) => {
            const target: EventTarget = event.target;
            if (target instanceof HTMLInputElement && target.name) {
              const name = target.name;
              setTouched((current) => (current.has(name) ? current : new Set(current).add(name)));
            }
          }}
          noValidate
          className="space-y-6 rounded-2xl bg-white p-6"
        >
          {FIELDS.map((field) => {
            const message = errorFor(field.key);
            const describedBy = message ? `${field.key}-error` : `${field.key}-hint`;
            return (
              <label key={field.key} className="block max-w-md">
                <span className="mb-2 block text-sm font-semibold text-ink">{field.label}</span>
                <span className="relative block">
                  {field.unit === "$" ? (
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-muted">$</span>
                  ) : null}
                  <input
                    type="number"
                    inputMode="decimal"
                    name={field.key}
                    min={0}
                    max={field.unit === "%" ? 100 : undefined}
                    step={0.01}
                    value={form[field.key]}
                    onChange={(event) => setField(field.key, event.target.value)}
                    aria-invalid={message ? true : undefined}
                    aria-describedby={describedBy}
                    className={`h-12 w-full rounded-full border bg-input text-sm outline-none ${
                      field.unit === "$" ? "pl-8 pr-4" : "pl-4 pr-10"
                    } ${message ? "border-danger focus:border-danger" : "border-line focus:border-brand"}`}
                  />
                  {field.unit === "%" ? (
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted">%</span>
                  ) : null}
                </span>
                {message ? (
                  <span id={`${field.key}-error`} className="mt-1.5 block px-1 text-xs font-medium text-danger">
                    {message}
                  </span>
                ) : (
                  <span id={`${field.key}-hint`} className="mt-1.5 block px-1 text-xs text-muted">
                    {field.helper}
                  </span>
                )}
                {field.key === "wholesaleAccountFee" && turningFeeOff ? (
                  <span className="mt-2 block rounded-2xl bg-warning-bg px-4 py-2 text-xs text-warning">
                    Saving 0 turns the fee off and unlocks every wholesale account that hasn&apos;t paid yet.
                  </span>
                ) : null}
              </label>
            );
          })}

          {generalError ? (
            <p role="alert" className="rounded-2xl bg-danger-bg px-4 py-3 text-sm text-danger">
              {generalError}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving || !dirty}
              className="h-12 rounded-full bg-brand px-8 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save prices"}
            </button>
            {dirty && !saving ? (
              <button
                type="button"
                onClick={() => {
                  setForm(toPriceForm(saved));
                  setSubmitted(false);
                  setTouched(new Set());
                  setServerErrors({});
                  setGeneralError("");
                }}
                className="h-12 rounded-full border border-line px-6 text-sm font-semibold text-slate"
              >
                Discard changes
              </button>
            ) : null}
            {!dirty ? <span className="text-xs text-muted">No unsaved changes</span> : null}
          </div>
        </form>

        <aside className="h-fit rounded-2xl bg-white p-6 text-sm text-slate">
          <h2 className="mb-3 font-bold text-ink">How changes apply</h2>
          <ul className="space-y-3">
            <li>
              <span className="font-semibold text-ink">Shipping fee and tax rate</span> apply to the next checkout
              right away. Orders already placed keep their prices.
            </li>
            <li>
              <span className="font-semibold text-ink">Changing the wholesale fee</span> changes what wholesale
              accounts that haven&apos;t paid yet will be charged. Accounts that already paid aren&apos;t affected.
            </li>
            <li>
              <span className="font-semibold text-ink">Setting the wholesale fee to 0</span> turns it off. Wholesale
              accounts that haven&apos;t paid are unlocked straight away and won&apos;t be asked to pay again, even if
              you turn the fee back on later.
            </li>
          </ul>
        </aside>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Turn off the wholesale account fee?"
        description="Wholesale accounts that haven't paid will be unlocked."
      >
        <p className="text-sm text-slate">
          They won&apos;t be asked to pay again, even if you turn the fee back on later. Accounts that already paid
          aren&apos;t affected.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            className="h-11 rounded-full border border-line bg-white px-5 text-sm font-semibold text-slate"
          >
            Keep the fee
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              if (changes) await save(changes);
              setConfirmOpen(false);
            }}
            className="h-11 rounded-full bg-danger px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Turn off fee"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Header() {
  return (
    <PageHeader
      title="Pricing"
      description="Shipping fee, tax rate and the one-time wholesale account fee."
    />
  );
}
