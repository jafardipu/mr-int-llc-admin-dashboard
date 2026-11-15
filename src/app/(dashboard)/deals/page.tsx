"use client";

import Image from "next/image";
import { useState } from "react";
import { DealForm } from "@/components/deal-form";
import { Pagination, Table, TableCard, THead } from "@/components/data-table";
import { IconPlus } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { DeleteAction, EditAction, TableActions } from "@/components/table-actions";
import { FilterTabs, Modal, Toolbar, TypeChip } from "@/components/ui";
import { money, prettyDate } from "@/lib/format";
import type { DealRecord, DealType } from "@/lib/types";
import { asList, useDeleteDealMutation, useGetDealsQuery } from "@/store/api";

export default function DealsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [remove] = useDeleteDealMutation();
  const limit = 10;

  const { data, isLoading } = useGetDealsQuery({
    page,
    limit,
    searchTerm: search || undefined,
    type: type === "all" ? undefined : (type as DealType),
  });
  const list = asList<DealRecord>(data?.data);

  return (
    <div>
      <PageHeader
        title="Deals"
        description="Manage weekly and clearance deals linked to products."
      />
      <Toolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search by product..."
      >
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white"
        >
          <IconPlus className="size-4" />
          Add Deal
        </button>
      </Toolbar>

      <div className="mb-4">
        <FilterTabs
          value={type}
          onChange={(value) => {
            setType(value);
            setPage(1);
          }}
          items={[
            { id: "all", label: "All" },
            { id: "weekly", label: "Weekly" },
            { id: "clearance", label: "Clearance" },
          ]}
        />
      </div>

      <TableCard
        footer={<Pagination page={page} total={list.total} limit={limit} onPage={setPage} />}
      >
        <Table>
          <THead
            columns={["Product", "Deal Price", "Type", "Dates", "Status", "Actions"]}
          />
          <tbody>
            {list.items.map((deal) => (
              <tr key={deal.id} className="border-t border-line-soft">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src={
                        deal.product?.images?.[0]?.url ||
                        "/images/product-headphones.png"
                      }
                      alt=""
                      width={44}
                      height={44}
                      className="size-11 rounded-xl object-cover"
                      unoptimized
                    />
                    <div>
                      <p className="font-semibold text-ink">
                        {deal.product?.name || "—"}
                      </p>
                      {deal.product?.sku ? (
                        <p className="text-xs text-muted">{deal.product.sku}</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold">{money(deal.dealPrice)}</td>
                <td className="px-6 py-4">
                  <TypeChip value={deal.type === "clearance" ? "Clearance" : "Weekly"} />
                </td>
                <td className="px-6 py-4 text-sm text-slate">
                  {prettyDate(deal.startDate)} – {prettyDate(deal.endDate)}
                </td>
                <td className="px-6 py-4">
                  <StatusPill value={deal.isActive === false ? "inactive" : "active"} />
                </td>
                <td className="px-6 py-4">
                  <TableActions>
                    <EditAction onClick={() => setEditId(deal.id)} />
                    <DeleteAction onClick={() => remove(deal.id)} />
                  </TableActions>
                </td>
              </tr>
            ))}
            {!isLoading && list.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted">
                  No deals yet. Create a weekly or clearance deal.
                </td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </TableCard>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Deal"
        description="Select a product, set deal price, and choose weekly or clearance."
      >
        <DealForm onDone={() => setCreateOpen(false)} />
      </Modal>

      <Modal
        open={Boolean(editId)}
        onClose={() => setEditId(null)}
        title="Edit Deal"
        description="Update deal price, type, dates, or visibility."
      >
        {editId ? <DealForm id={editId} onDone={() => setEditId(null)} /> : null}
      </Modal>
    </div>
  );
}
