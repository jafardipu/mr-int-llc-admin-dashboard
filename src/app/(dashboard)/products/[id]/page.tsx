"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { BackLink } from "@/components/ui";
import { money } from "@/lib/format";
import type { VolumeTier } from "@/lib/types";
import { useGetProductQuery } from "@/store/api";

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useGetProductQuery(params.id);
  const product = data?.data;
  const images = product?.images ?? [];
  const cover = images.find((image) => image.isPrimary)?.url || images[0]?.url;
  const tiers = (Array.isArray(product?.volumeTiers) ? product?.volumeTiers : []) as VolumeTier[];

  return (
    <div>
      <PageHeader
        title="Product Details"
        back={<BackLink href="/products">Back to Product List</BackLink>}
        action={
          <Link
            href={`/products/${params.id}/edit`}
            className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white"
          >
            Edit Product
          </Link>
        }
      />
      {isLoading ? <p className="text-sm text-muted">Loading product...</p> : null}
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4">
              <Image
                src={cover || "/images/product-headphones.png"}
                alt=""
                width={480}
                height={480}
                className="h-[280px] w-full rounded-2xl object-cover"
              />
              <p className="mt-3 text-sm text-muted">Cover</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <div className="grid grid-cols-2 gap-3">
                {images.slice(1, 5).map((image) => (
                  <Image
                    key={image.id}
                    src={image.url}
                    alt=""
                    width={140}
                    height={140}
                    className="h-28 w-full rounded-xl object-cover"
                  />
                ))}
                {images.length <= 1 ? (
                  <p className="col-span-2 flex h-full items-center justify-center text-sm text-muted">
                    No extra images
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <section className="rounded-2xl bg-white p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">{product?.name || "—"}</h2>
                <p className="mt-1 text-sm text-muted">{product?.description || "No description yet."}</p>
              </div>
              <StatusPill value={product?.status} />
            </div>
            <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Info label="Brand" value={product?.brand?.name} />
              <Info label="SKU" value={product?.sku} />
              <Info label="ASIN No" value={product?.asin} />
              <Info label="Stock" value={product ? String(product.stock) : "—"} />
              <Info label="Category" value={product?.category?.name} />
              <Info label="Subcategory" value={product?.subcategory} />
              <Info label="Price / MSRP" value={money(product?.retailPrice)} />
              <Info label="Wholesale Base" value={money(product?.wholesalePrice)} />
            </dl>
          </section>
        </section>
        <aside className="space-y-5">
          <section className="rounded-2xl bg-white p-6">
            <h3 className="mb-4 font-bold">Marketplace Linking</h3>
            <Info label="Amazon Product URL" value={product?.amazonUrl} />
            <div className="mt-4">
              <Info label="Walmart Product URL" value={product?.walmartUrl} />
            </div>
          </section>
          <section className="rounded-2xl bg-white p-6">
            <h3 className="mb-4 font-bold">Volume Discount Tiers</h3>
            {tiers.length === 0 ? <p className="text-sm text-muted">No volume tiers.</p> : null}
            <ul className="space-y-3">
              {tiers.map((tier, index) => (
                <li key={`${tier.minQty}-${index}`} className="flex justify-between rounded-xl bg-[#faf8f5] px-4 py-3 text-sm">
                  <span>
                    {tier.minQty}
                    {tier.maxQty ? `-${tier.maxQty}` : "+"} units
                  </span>
                  <span>{tier.discountPercent}% off</span>
                  <span className="font-semibold">{money(tier.unitPrice)}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-all font-semibold text-ink">{value || "—"}</p>
    </div>
  );
}
