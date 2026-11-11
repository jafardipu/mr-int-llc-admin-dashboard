"use client";

import { useMemo, useState } from "react";
import { Pagination, Table, TableCard, THead } from "@/components/data-table";
import { IconPlus } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { PromoCodeForm } from "@/components/promo-code-form";
import { StatusPill } from "@/components/status-pill";
import { DeleteAction, EditAction, TableActions } from "@/components/table-actions";
import { Modal, Toolbar, TypeChip } from "@/components/ui";
import { money, prettyDate } from "@/lib/format";
import type { PromoCodeRecord } from "@/lib/types";
import { asList, useDeletePromoCodeMutation, useGetPromoCodesQuery } from "@/store/api";

function formatDiscount(promo: PromoCodeRecord) {
  if (promo.discountType === "percentage") {
    return `${promo.discountValue}%`;
  }
  return money(promo.discountValue);
}

export default function PromoCodesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [remove] = useDeletePromoCodeMutation();
  const { data, isLoading } = useGetPromoCodesQuery({
    page: 1,
    limit: 100,
    searchTerm: search || undefined,
  });
  const list = asList<PromoCodeRecord>(data?.data);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return list.items;
    return list.items.filter(
      (promo) =>
        promo.code.toLowerCase().includes(term) ||
        promo.description?.toLowerCase().includes(term),
    );
  }, [list.items, search]);

  const limit = 8;
  const pageItems = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div>
      <PageHeader
        title="Promo Codes"
        description="Create and manage discount codes for checkout."
      />
      <Toolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search code or description..."
      >
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white"
        >
          <IconPlus className="size-4" />
          Add promo
        </button>
      </Toolbar>

      <TableCard
        footer={
          <Pagination page={page} total={filtered.length} limit={limit} onPage={setPage} />
        }
      >
        <Table>
          <THead
            columns={[
              "Code",
              "Discount",
              "Usage",
              "Audience",
              "Expires",
              "Status",
              "Actions",
            ]}
          />
          <tbody>
            {pageItems.map((promo) => (
              <tr key={promo.id} className="border-t border-line-soft">
                <td className="px-6 py-4">
                  <p className="font-semibold text-ink">{promo.code}</p>
                  {promo.description ? (
                    <p className="mt-1 max-w-xs truncate text-xs text-muted">
                      {promo.description}
                    </p>
                  ) : null}
                </td>
                <td className="px-6 py-4">
                  <p className="font-semibold">{formatDiscount(promo)}</p>
                  {promo.minOrderAmount ? (
                    <p className="text-xs text-muted">Min {money(promo.minOrderAmount)}</p>
                  ) : null}
                </td>
                <td className="px-6 py-4 text-sm text-slate">
                  {promo.usedCount ?? 0}
                  {promo.usageLimit != null ? ` / ${promo.usageLimit}` : " / ∞"}
                </td>
                <td className="px-6 py-4">
                  <TypeChip value={promo.customerType || "All"} />
                </td>
                <td className="px-6 py-4 text-slate">{prettyDate(promo.expiresAt)}</td>
                <td className="px-6 py-4">
                  <StatusPill value={promo.isActive ? "active" : "inactive"} />
                </td>
                <td className="px-6 py-4">
                  <TableActions>
                    <EditAction onClick={() => setEditId(promo.id)} />
                    <DeleteAction onClick={() => remove(promo.id)} />
                  </TableActions>
                </td>
              </tr>
            ))}
            {!isLoading && pageItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted">
                  No promo codes yet. Create your first code.
                </td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </TableCard>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add promo code"
        description="Set discount rules, limits, and audience."
      >
        <PromoCodeForm onDone={() => setCreateOpen(false)} />
      </Modal>

      <Modal
        open={Boolean(editId)}
        onClose={() => setEditId(null)}
        title="Edit promo code"
        description="Update discount rules or deactivate the code."
      >
        {editId ? <PromoCodeForm id={editId} onDone={() => setEditId(null)} /> : null}
      </Modal>
    </div>
  );
}
