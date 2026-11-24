"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { BackLink } from "@/components/ui";
import { money } from "@/lib/format";
import { useGetCategoryQuery } from "@/store/api";

export default function CategoryDetailsPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useGetCategoryQuery(params.id);
  const category = data?.data;
  const products = category?.products ?? [];

  return (
    <div>
      <PageHeader
        title="Category Details"
        back={<BackLink href="/categories">Back to Category Management</BackLink>}
        action={
          <Link
            href={`/categories/${params.id}/edit`}
            className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white"
          >
            Edit Category
          </Link>
        }
      />
      {isLoading ? <p className="text-sm text-muted">Loading category...</p> : null}
      <section className="mb-6 rounded-2xl bg-white p-6">
        <div className="flex flex-wrap items-start gap-5">
          <Image
            src={category?.image || ""}
            alt=""
            width={120}
            height={120}
            className="size-30 rounded-2xl object-cover"
          />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold">{category?.name || "—"}</h2>
              <StatusPill value={category?.status ?? "active"} />
            </div>
            <p className="mt-2 text-sm text-muted">
              {category?._count?.products ?? products.length} products in this category
            </p>
          </div>
        </div>
      </section>
      <h3 className="mb-3 text-xl font-bold">Products</h3>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-sm text-muted">No products in this category yet.</p>
        ) : (
          products.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`} className="rounded-2xl bg-white p-4 hover:shadow-sm">
              <Image
                src={product.images?.[0]?.url || ""}
                alt=""
                width={280}
                height={180}
                className="h-36 w-full rounded-xl object-cover"
              />
              <p className="mt-3 font-semibold">{product.name}</p>
              <p className="text-sm text-muted">{product.sku}</p>
              <p className="mt-1 text-sm font-semibold">{money(product.retailPrice)}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
