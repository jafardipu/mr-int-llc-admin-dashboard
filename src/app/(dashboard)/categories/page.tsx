"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { CategoryForm } from "@/components/category-form";
import { Pagination, Table, TableCard, THead } from "@/components/data-table";
import { IconPlus } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { DeleteAction, EditAction, TableActions, ViewAction } from "@/components/table-actions";
import { Modal, Toolbar } from "@/components/ui";
import type { CategoryRecord } from "@/lib/types";
import { asList, useDeleteCategoryMutation, useGetCategoriesQuery } from "@/store/api";

export default function CategoriesPage() {
  const { data } = useGetCategoriesQuery();
  const [remove] = useDeleteCategoryMutation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const list = asList<CategoryRecord>(data?.data);
  const filtered = useMemo(
    () =>
      list.items.filter((category) => {
        const matchesName = category.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = status === "all" || (category.status ?? "active") === status;
        return matchesName && matchesStatus;
      }),
    [list.items, search, status],
  );
  const limit = 8;
  const pageItems = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div>
      <PageHeader
        title="Category Management"
        description="Organize your product categories and manage visibility."
      />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search by category...">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="h-11 rounded-full border border-line bg-white px-4 text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white"
        >
          <IconPlus className="size-4" />
          Category
        </button>
      </Toolbar>
      <TableCard footer={<Pagination page={page} total={filtered.length} limit={limit} onPage={setPage} />}>
        <Table>
          <THead columns={["Image", "Category Name", "Products", "Status", "Actions"]} />
          <tbody>
            {pageItems.map((category) => (
              <tr key={category.id} className="border-t border-line-soft">
                <td className="px-6 py-4">
                  <Image
                    src={category.image || ""}
                    alt=""
                    width={44}
                    height={44}
                    className="size-11 rounded-xl object-cover"
                  />
                </td>
                <td className="px-6 py-4 font-semibold">{category.name}</td>
                <td className="px-6 py-4">{category._count?.products ?? category.products?.length ?? 0}</td>
                <td className="px-6 py-4">
                  <StatusPill value={category.status ?? "active"} />
                </td>
                <td className="px-6 py-4">
                  <TableActions>
                    <ViewAction href={`/categories/${category.id}`} />
                    <EditAction href={`/categories/${category.id}/edit`} />
                    <DeleteAction onClick={() => remove(category.id)} />
                  </TableActions>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add New Category"
        description="Create a new product category and configure catalog visibility."
      >
        <CategoryForm compact onDone={() => setOpen(false)} />
      </Modal>
    </div>
  );
}
