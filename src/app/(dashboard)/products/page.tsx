"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Pagination, Table, TableCard, THead } from "@/components/data-table";
import { IconPlus } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { ConfirmDeleteAction } from "@/components/confirm-delete-action";
import { EditAction, TableActions, ViewAction } from "@/components/table-actions";
import { toast } from "@/components/toast";
import { Toolbar } from "@/components/ui";
import { apiErrorMessage } from "@/lib/api-error";
import { money } from "@/lib/format";
import type { CategoryRecord, ProductRecord } from "@/lib/types";
import { asList, useDeleteProductMutation, useGetCategoriesQuery, useGetProductsQuery } from "@/store/api";

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const { data } = useGetProductsQuery({
    page,
    limit: 10,
    searchTerm: searchTerm || undefined,
    categoryId: categoryId || undefined,
    isFeatured: featuredFilter === "featured" ? true : undefined,
  });
  const { data: categoryRes } = useGetCategoriesQuery();
  const [remove] = useDeleteProductMutation();
  const list = asList<ProductRecord>(data?.data);
  const categories = asList<CategoryRecord>(categoryRes?.data).items;

  async function handleDelete(product: ProductRecord) {
    try {
      const result = await remove(product.id).unwrap();
      toast.success(result.message || "Product deleted.");
      // Deleting the only row on a later page would leave that page empty.
      if (list.items.length === 1 && page > 1) setPage(page - 1);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete the product. Please try again."));
    }
  }

  return (
    <div>
      <PageHeader title="Product List" />
      <Toolbar
        search={searchTerm}
        onSearch={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        placeholder="Search by product name, SKU or category..."
      >
        <select
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setPage(1);
          }}
          className="h-11 rounded-full border border-line bg-white px-4 text-sm"
        >
          <option value="">Category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={featuredFilter}
          onChange={(event) => {
            setFeaturedFilter(event.target.value);
            setPage(1);
          }}
          className="h-11 rounded-full border border-line bg-white px-4 text-sm"
        >
          <option value="all">All Products</option>
          <option value="featured">Featured only</option>
        </select>
        <Link
          href="/products/new"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white"
        >
          <IconPlus className="size-4" />
          Add Product
        </Link>
      </Toolbar>
      <TableCard
        footer={<Pagination page={page} total={list.total} limit={10} onPage={setPage} />}
      >
        <Table>
          <THead columns={["Image", "Product Name", "Brand", "Category", "Retail Price", "Wholesale Price", "Stock", "Featured", "Status", "Actions"]} />
          <tbody>
            {list.items.map((product) => (
              <tr key={product.id} className="border-t border-line-soft">
                <td className="px-6 py-3">
                  <Image
                    src={product.images?.[0]?.url as string}
                    alt=""
                    width={44}
                    height={44}
                    className="size-11 rounded-xl object-cover"
                  />
                </td>
                <td className="px-6 py-3 font-semibold text-ink">{product.name}</td>
                <td className="px-6 py-3">{product.brand?.name ?? "—"}</td>
                <td className="px-6 py-3">{product.category?.name ?? "—"}</td>
                <td className="px-6 py-3">{money(product.retailPrice)}</td>
                <td className="px-6 py-3">{money(product.wholesalePrice)}</td>
                <td className="px-6 py-3">{product.stock}</td>
                <td className="px-6 py-3">
                  {product.isFeatured ? (
                    <span className="inline-flex items-center rounded-full bg-[#fff4e5] px-3 py-1 text-xs font-semibold text-[#c2410c]">
                      Featured
                    </span>
                  ) : (
                    <span className="text-sm text-muted">—</span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <StatusPill value={product.status} />
                </td>
                <td className="px-6 py-3">
                  <TableActions>
                    <ViewAction href={`/products/${product.id}`} />
                    <EditAction href={`/products/${product.id}/edit`} />
                    <ConfirmDeleteAction
                      title="Delete this product?"
                      description={`"${product.name}" will be removed from the product list and the storefront.`}
                      onConfirm={() => handleDelete(product)}
                    />
                  </TableActions>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </div>
  );
}
