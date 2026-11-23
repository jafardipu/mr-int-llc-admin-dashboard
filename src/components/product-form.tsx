"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  useCreateProductMutation,
  useGetBrandsQuery,
  useGetCategoriesQuery,
  useGetProductQuery,
  useUpdateProductMutation,
} from "@/store/api";
import type { BrandRecord, CategoryRecord, VolumeTier } from "@/lib/types";
import { asList } from "@/store/baseQuery";

type Preview = { url: string; file?: File; existing?: boolean };

const emptyTier = (): VolumeTier => ({
  minQty: 1,
  maxQty: 9,
  discountPercent: 0,
  unitPrice: 0,
});

export function ProductForm({ id }: { id?: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: existing } = useGetProductQuery(id as string, { skip: !id });
  const { data: categoryRes } = useGetCategoriesQuery();
  const { data: brandRes } = useGetBrandsQuery();
  const [createProduct, createState] = useCreateProductMutation();
  const [updateProduct, updateState] = useUpdateProductMutation();
  const categories = asList<CategoryRecord>(categoryRes?.data).items;
  const brands = asList<BrandRecord>(brandRes?.data).items;
  const [form, setForm] = useState({
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
  });
  const [isFeatured, setIsFeatured] = useState(false);
  const [tiers, setTiers] = useState<VolumeTier[]>([]);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [error, setError] = useState("");

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
    setTiers(Array.isArray(product.volumeTiers) ? product.volumeTiers : []);
    setPreviews(
      (product.images ?? []).map((image) => ({ url: image.url, existing: true })),
    );
  }, [existing]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onPickFiles(files: FileList | null) {
    if (!files?.length) return;
    const next = Array.from(files).slice(0, 8 - previews.length).map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }));
    setPreviews((current) => [...current, ...next].slice(0, 8));
  }

  function removeImage(index: number) {
    setPreviews((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const payload = {
      name: form.name,
      sku: form.sku,
      asin: form.asin || null,
      description: form.description,
      retailPrice: Number(form.retailPrice),
      wholesalePrice: Number(form.wholesalePrice),
      wholesaleMinQty: Number(form.wholesaleMinQty),
      stock: Number(form.stock),
      brandId: form.brandId,
      categoryId: form.categoryId,
      status: form.status,
      amazonUrl: form.amazonUrl || null,
      walmartUrl: form.walmartUrl || null,
      isFeatured,
      keepImages: previews.filter((item) => item.existing).map((item) => item.url),
      volumeTiers: tiers.filter((tier) => tier.minQty && tier.unitPrice),
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
      const message =
        err && typeof err === "object" && "data" in err
          ? ((err.data as { message?: string })?.message ?? "Save failed")
          : "Save failed";
      setError(message);
    }
  }

  const loading = createState.isLoading || updateState.isLoading;
  const cover = previews[0];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
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
                  onClick={() => fileRef.current?.click()}
                  className="flex h-[280px] w-full items-center justify-center rounded-2xl bg-[#faf8f5] text-sm text-muted"
                >
                  Add cover image
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white text-sm text-muted"
            >
              <span className="mb-2 text-2xl text-brand">+</span>
              Upload
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
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            hidden
            onChange={(event) => onPickFiles(event.target.files)}
          />

          <div className="rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold">Product Details</h3>
            <p className="mb-5 text-sm text-muted">Key info to describe and display your product.</p>
            <div className="space-y-4">
              <Field label="Product Name" required>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} required className={inputClass} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Status" required>
                  <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputClass}>
                    <option value="active">Active</option>
                    <option value="inactive">Draft</option>
                    <option value="out_of_stock">Out of stock</option>
                  </select>
                </Field>
                <Field label="Brand" required>
                  <select value={form.brandId} onChange={(e) => set("brandId", e.target.value)} required className={inputClass}>
                    <option value="">Select brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="SKU" required>
                  <input value={form.sku} onChange={(e) => set("sku", e.target.value)} required className={inputClass} />
                </Field>
                <Field label="ASIN No">
                  <input value={form.asin} onChange={(e) => set("asin", e.target.value)} className={inputClass} />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Category" required>
                  <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} required className={inputClass}>
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
                <Field label="Price / MSRP" required>
                  <input type="number" min="0" step="0.01" value={form.retailPrice} onChange={(e) => set("retailPrice", e.target.value)} required className={inputClass} />
                </Field>
                <Field label="Discount / Wholesale Base" required>
                  <input type="number" min="0" step="0.01" value={form.wholesalePrice} onChange={(e) => set("wholesalePrice", e.target.value)} required className={inputClass} />
                </Field>
                <Field label="Stock">
                  <input type="number" min="0" value={form.stock} onChange={(e) => set("stock", e.target.value)} className={inputClass} />
                </Field>
                <Field label="Wholesale Min Qty">
                  <input type="number" min="1" value={form.wholesaleMinQty} onChange={(e) => set("wholesaleMinQty", e.target.value)} className={inputClass} />
                </Field>
              </div>
              <Field label="Description" required>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} required className={`${inputClass} h-auto rounded-2xl py-3`} />
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
            <Field label="Amazon Product URL">
              <input value={form.amazonUrl} onChange={(e) => set("amazonUrl", e.target.value)} placeholder="https://www.amazon.com/..." className={inputClass} />
            </Field>
            <div className="mt-4">
              <Field label="Walmart Product URL">
                <input value={form.walmartUrl} onChange={(e) => set("walmartUrl", e.target.value)} placeholder="https://www.walmart.com/..." className={inputClass} />
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
              {tiers.map((tier, index) => (
                <div key={index} className="grid grid-cols-[1fr_80px_1fr_32px] items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input type="number" min="1" value={tier.minQty} onChange={(e) => updateTier(index, { minQty: Number(e.target.value) })} className={tinyInput} />
                    <span className="text-muted">-</span>
                    <input type="number" min="1" value={tier.maxQty ?? ""} onChange={(e) => updateTier(index, { maxQty: e.target.value ? Number(e.target.value) : null })} className={tinyInput} />
                  </div>
                  <input type="number" min="0" max="100" value={tier.discountPercent} onChange={(e) => updateTier(index, { discountPercent: Number(e.target.value) })} className={tinyInput} />
                  <input type="number" min="0" step="0.01" value={tier.unitPrice} onChange={(e) => updateTier(index, { unitPrice: Number(e.target.value) })} className={tinyInput} />
                  <button type="button" onClick={() => setTiers((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-danger">
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button type="submit" disabled={loading} className="h-12 w-full rounded-full bg-brand text-sm font-semibold text-white disabled:opacity-70">
            {loading ? "Saving..." : id ? "Save Changes" : "Create Product"}
          </button>
        </aside>
      </div>
    </form>
  );

  function updateTier(index: number, patch: Partial<VolumeTier>) {
    setTiers((current) => current.map((tier, itemIndex) => (itemIndex === index ? { ...tier, ...patch } : tier)));
  }
}

const inputClass =
  "h-12 w-full rounded-full border border-line bg-input px-4 text-sm outline-none focus:border-brand";
const tinyInput =
  "h-10 w-full rounded-full border border-line bg-input px-2 text-sm outline-none focus:border-brand";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-label">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
