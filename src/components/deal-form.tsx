"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DealType, ProductRecord } from "@/lib/types";
import {
  asList,
  useCreateDealMutation,
  useGetDealQuery,
  useGetProductsQuery,
  useUpdateDealMutation,
} from "@/store/api";

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** Convert `YYYY-MM-DD` (or empty) to ISO-8601 DateTime for Prisma. */
function toIsoDateTime(value?: string | null, endOfDay = false) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const suffix = endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z";
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}${suffix}` : trimmed;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function productCover(product?: ProductRecord | null) {
  return product?.images?.[0]?.url || "/images/product-headphones.png";
}

const empty = {
  productId: "",
  dealPrice: "",
  type: "weekly" as DealType,
  startDate: "",
  endDate: "",
  isActive: true,
};

export function DealForm({
  id,
  onDone,
}: {
  id?: string;
  onDone?: () => void;
}) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const { data: existing } = useGetDealQuery(id as string, { skip: !id });
  const { data: productsRes } = useGetProductsQuery({ page: 1, limit: 200 });
  const [createDeal, createState] = useCreateDealMutation();
  const [updateDeal, updateState] = useUpdateDealMutation();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const products = asList<ProductRecord>(productsRes?.data).items;

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === form.productId) ?? null,
    [products, form.productId],
  );

  useEffect(() => {
    const deal = existing?.data;
    if (!deal) return;
    setForm({
      productId: deal.productId ?? deal.product?.id ?? "",
      dealPrice: String(deal.dealPrice ?? ""),
      type: deal.type === "clearance" ? "clearance" : "weekly",
      startDate: toDateInput(deal.startDate),
      endDate: toDateInput(deal.endDate),
      isActive: deal.isActive !== false,
    });
  }, [existing]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function setField<K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const dealPrice = Number(form.dealPrice);
    if (!form.productId) {
      setError("Product is required");
      return;
    }
    if (!dealPrice || dealPrice <= 0) {
      setError("Deal price must be greater than 0");
      return;
    }
    if (form.type !== "weekly" && form.type !== "clearance") {
      setError("Type must be weekly or clearance");
      return;
    }

    const payload: Record<string, unknown> = {
      productId: form.productId,
      dealPrice,
      type: form.type,
      startDate: toIsoDateTime(form.startDate),
      endDate: toIsoDateTime(form.endDate, true),
      isActive: form.isActive,
    };

    try {
      if (id) {
        await updateDeal({ id, body: payload }).unwrap();
      } else {
        await createDeal(payload).unwrap();
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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="relative sm:col-span-2" ref={pickerRef}>
          <p className="mb-2 text-sm font-semibold">
            Product <span className="text-danger">*</span>
          </p>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-12 w-full items-center gap-3 rounded-full border border-line bg-input px-3 text-left text-sm outline-none focus:border-brand"
          >
            {selectedProduct ? (
              <>
                <Image
                  src={productCover(selectedProduct)}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 shrink-0 rounded-lg object-cover"
                  unoptimized
                />
                <span className="min-w-0 flex-1 truncate font-medium text-ink">
                  {selectedProduct.name}
                  <span className="ml-1 font-normal text-muted">({selectedProduct.sku})</span>
                </span>
              </>
            ) : (
              <span className="px-1 text-muted">Select product</span>
            )}
            <span className="pr-2 text-muted">{open ? "▴" : "▾"}</span>
          </button>

          {open ? (
            <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-line bg-white p-1 shadow-lg">
              {products.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted">No products found</p>
              ) : (
                products.map((product) => {
                  const active = product.id === form.productId;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setField("productId", product.id);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm hover:bg-[#faf8f5] ${
                        active ? "bg-[#faf8f5]" : ""
                      }`}
                    >
                      <Image
                        src={productCover(product)}
                        alt=""
                        width={36}
                        height={36}
                        className="size-9 shrink-0 rounded-lg object-cover"
                        unoptimized
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-ink">{product.name}</span>
                        <span className="block truncate text-xs text-muted">{product.sku}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          ) : null}
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">
            Deal price <span className="text-danger">*</span>
          </span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.dealPrice}
            onChange={(e) => setField("dealPrice", e.target.value)}
            className={inputClass}
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">
            Type <span className="text-danger">*</span>
          </span>
          <select
            value={form.type}
            onChange={(e) => setField("type", e.target.value as DealType)}
            className={inputClass}
            required
          >
            <option value="weekly">Weekly</option>
            <option value="clearance">Clearance</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Start date</span>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setField("startDate", e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">End date</span>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setField("endDate", e.target.value)}
            className={inputClass}
          />
        </label>

        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-semibold">Status</p>
          <div className="flex h-12 items-center gap-5 rounded-full border border-line bg-input px-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={form.isActive}
                onChange={() => setField("isActive", true)}
              />
              Active
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={!form.isActive}
                onChange={() => setField("isActive", false)}
              />
              Inactive
            </label>
          </div>
        </div>
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
          {loading ? "Saving..." : id ? "Update deal" : "Create deal"}
        </button>
      </div>
    </form>
  );
}
