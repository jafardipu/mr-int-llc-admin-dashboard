"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { money } from "@/lib/format";
import type { ProductRecord } from "@/lib/types";
import { asList, useGetProductsQuery } from "@/store/api";

export type PickedProduct = Pick<ProductRecord, "id" | "name" | "sku" | "images" | "status" | "retailPrice">;

const STATUS_NOTE: Record<string, string> = { inactive: "Draft", out_of_stock: "Out of stock" };

/**
 * Searchable single-product dropdown. Searches the API as you type (name or SKU), so it works
 * however many products there are. `value` is the picked product, kept by the parent so the
 * trigger can show it even when it isn't in the current search results.
 */
export function ProductPicker({
  value,
  onChange,
  name,
  invalid,
  describedBy,
}: {
  value: PickedProduct | null;
  onChange: (product: PickedProduct) => void;
  name?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchTerm(term.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [term]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const { data, isFetching, isError } = useGetProductsQuery(
    { page: 1, limit: 20, searchTerm: searchTerm || undefined },
    { skip: !open },
  );
  const products = asList<ProductRecord>(data?.data).items;

  function pick(product: ProductRecord) {
    onChange(product);
    setOpen(false);
    setTerm("");
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={(event) => event.key === "Escape" && setOpen(false)}>
      <button
        type="button"
        name={name}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-describedby={describedBy}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-full items-center gap-3 rounded-full border bg-input px-3 text-left text-sm outline-none ${
          invalid ? "border-danger focus:border-danger" : "border-line focus:border-brand"
        }`}
      >
        {value ? (
          <>
            <ProductThumb product={value} size={32} />
            <span className="min-w-0 flex-1 truncate font-medium text-ink">
              {value.name}
              <span className="ml-1 font-normal text-muted">({value.sku})</span>
            </span>
          </>
        ) : (
          <span className="flex-1 px-1 text-muted">Search and select a product</span>
        )}
        <span className="pr-2 text-muted" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-line bg-white p-2 shadow-lg">
          <input
            autoFocus
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Type a product name or SKU..."
            aria-label="Search products"
            className="mb-1 h-10 w-full rounded-full border border-line bg-input px-4 text-sm outline-none focus:border-brand"
          />
          <div role="listbox" className="max-h-60 overflow-auto">
            {isError ? (
              <p className="px-3 py-4 text-sm text-danger">Could not load products. Close and try again.</p>
            ) : products.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted">{isFetching ? "Searching..." : "No products match your search."}</p>
            ) : (
              products.map((product) => {
                const selected = product.id === value?.id;
                const note = product.status ? STATUS_NOTE[product.status] : undefined;
                return (
                  <button
                    key={product.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => pick(product)}
                    className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm hover:bg-input ${
                      selected ? "bg-input" : ""
                    }`}
                  >
                    <ProductThumb product={product} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{product.name}</span>
                      <span className="block truncate text-xs text-muted">
                        {product.sku} · {money(product.retailPrice)}
                        {note ? <span className="text-warning"> · {note}</span> : null}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProductThumb({ product, size }: { product: Pick<ProductRecord, "images">; size: number }) {
  const url = product.images?.find((image) => image.isPrimary)?.url ?? product.images?.[0]?.url;
  if (!url) {
    return <span className="shrink-0 rounded-lg bg-line-soft" style={{ width: size, height: size }} aria-hidden />;
  }
  return (
    <Image
      src={url}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-lg object-cover"
      style={{ width: size, height: size }}
      unoptimized
    />
  );
}
