"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { BrandForm } from "@/components/brand-form";
import { Pagination, Table, TableCard, THead } from "@/components/data-table";
import { IconPlus } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { DeleteAction, EditAction, TableActions } from "@/components/table-actions";
import { Modal, Toolbar } from "@/components/ui";
import { prettyDate } from "@/lib/format";
import type { BrandRecord } from "@/lib/types";

import { asList, useDeleteBrandMutation, useGetBrandsQuery } from "@/store/api";

export default function BrandsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [remove] = useDeleteBrandMutation();
  const { data, isLoading } = useGetBrandsQuery({
    page: 1,
    limit: 100,
    searchTerm: search || undefined,
  });
  const list = asList<BrandRecord>(data?.data);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return list.items;
    return list.items.filter((brand) => brand.name.toLowerCase().includes(term));
  }, [list.items, search]);

  const limit = 8;
  const pageItems = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div>
      <PageHeader
        title="Brand Management"
        description="Add, update, and remove product brands used across the catalog."
      />
      <Toolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search by brand name..."
      >
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white"
        >
          <IconPlus className="size-4" />
          Add Brand
        </button>
      </Toolbar>

      <TableCard
        footer={
          <Pagination page={page} total={filtered.length} limit={limit} onPage={setPage} />
        }
      >
        <Table>
          <THead columns={["Logo", "Brand Name", "Created", "Actions"]} />
          <tbody>
            {pageItems.map((brand) => (
              <tr key={brand.id} className="border-t border-line-soft">
                <td className="px-6 py-4">
                  <Image
                    src={brand.image || ""}
                    alt=""
                    width={44}
                    height={44}
                    className="size-11 rounded-xl object-cover"
                    unoptimized
                  />
                </td>
                <td className="px-6 py-4 font-semibold text-ink">{brand.name}</td>
                <td className="px-6 py-4 text-slate">{prettyDate(brand.createdAt)}</td>
                <td className="px-6 py-4">
                  <TableActions>
                    <EditAction onClick={() => setEditId(brand.id)} />
                    <DeleteAction onClick={() => remove(brand.id)} />
                  </TableActions>
                </td>
              </tr>
            ))}
            {!isLoading && pageItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted">
                  No brands found. Create your first brand.
                </td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </TableCard>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Brand"
        description="Create a brand that products can be assigned to."
      >
        <BrandForm onDone={() => setCreateOpen(false)} />
      </Modal>

      <Modal
        open={Boolean(editId)}
        onClose={() => setEditId(null)}
        title="Edit Brand"
        description="Update brand name or logo."
      >
        {editId ? <BrandForm id={editId} onDone={() => setEditId(null)} /> : null}
      </Modal>
    </div>
  );
}
