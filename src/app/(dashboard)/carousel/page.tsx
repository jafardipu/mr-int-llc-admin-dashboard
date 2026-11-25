"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BannerForm } from "@/components/banner-form";
import { ConfirmDeleteAction } from "@/components/confirm-delete-action";
import { Pagination, Table, TableCard, THead } from "@/components/data-table";
import { IconPlus } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { EditAction, TableActions } from "@/components/table-actions";
import { toast } from "@/components/toast";
import { Modal, Toolbar } from "@/components/ui";
import { apiErrorMessage } from "@/lib/api-error";
import { OFFER_STATE_LABELS, offerDate, offerState, type OfferState } from "@/lib/banner-schema";
import { prettyDate } from "@/lib/format";
import type { BannerRecord } from "@/lib/types";
import { asList, useDeleteBannerMutation, useGetBannersQuery } from "@/store/api";

const offerTone: Record<OfferState, string> = {
  scheduled: "bg-warning-bg text-warning",
  running: "bg-success-bg text-success",
  ended: "bg-line-soft text-muted",
};

export default function CarouselPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [remove] = useDeleteBannerMutation();
  const limit = 8;

  const { data, isLoading } = useGetBannersQuery({
    page,
    limit,
    searchTerm: search || undefined,
    sort: "-createdAt",
    isActive: status === "active" ? true : status === "hidden" ? false : undefined,
  });
  const list = asList<BannerRecord>(data?.data);
  const total = list.total;

  async function handleDelete(banner: BannerRecord) {
    try {
      const result = await remove(banner.id).unwrap();
      toast.success(result.message || "Banner deleted.");
      if (list.items.length === 1 && page > 1) setPage(page - 1);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete the banner. Please try again."));
    }
  }

  return (
    <div>
      <PageHeader
        title="Carousel / Banners"
        description="Homepage slides. Each one opens a product or a category, and can give a discount for a set time."
      />
      <Toolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search by product or category..."
      >
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
          <option value="hidden">Hidden</option>
        </select>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white"
        >
          <IconPlus className="size-4" />
          Add Banner
        </button>
      </Toolbar>

      <TableCard footer={<Pagination page={page} total={total} limit={limit} onPage={setPage} />}>
        <Table>
          <THead columns={["Preview", "Opens", "Offer", "Status", "Created", "Actions"]} />
          <tbody>
            {list.items.map((banner) => {
              const state = offerState(banner);
              return (
                <tr key={banner.id} className="border-t border-line-soft">
                  <td className="px-6 py-4">
                    <Image
                      src={banner.image}
                      alt=""
                      width={120}
                      height={48}
                      className="h-12 w-30 rounded-xl object-cover"
                      unoptimized
                    />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <BannerTargetCell banner={banner} />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {state ? (
                      <div className="space-y-1">
                        <p className="font-semibold text-ink">{banner.discountPercent}% off</p>
                        <p className="text-xs text-muted">
                          {offerDate(banner.startDate)} – {offerDate(banner.endDate)}
                        </p>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${offerTone[state]}`}>
                          {state === "running" && banner.isActive === false ? "Paused (hidden)" : OFFER_STATE_LABELS[state]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted">No offer</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill value={banner.isActive === false ? "inactive" : "active"} />
                  </td>
                  <td className="px-6 py-4 text-slate">{prettyDate(banner.createdAt)}</td>
                  <td className="px-6 py-4">
                    <TableActions>
                      <EditAction onClick={() => setEditId(banner.id)} />
                      <ConfirmDeleteAction
                        title="Delete this banner?"
                        description={
                          state === "running" || state === "scheduled"
                            ? `It will be removed from the homepage and its ${banner.discountPercent}% discount will end.`
                            : "It will be removed from the homepage."
                        }
                        onConfirm={() => handleDelete(banner)}
                      />
                    </TableActions>
                  </td>
                </tr>
              );
            })}
            {!isLoading && list.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted">
                  No carousel slides yet. Add your first homepage banner.
                </td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </TableCard>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Banner"
        description="Upload an image, choose what it opens, and optionally add a time-limited discount."
      >
        <BannerForm onDone={() => setCreateOpen(false)} />
      </Modal>

      <Modal
        open={Boolean(editId)}
        onClose={() => setEditId(null)}
        title="Edit Banner"
        description="Change the image, what it opens, the discount or visibility."
      >
        {editId ? <BannerForm id={editId} onDone={() => setEditId(null)} /> : null}
      </Modal>
    </div>
  );
}

function BannerTargetCell({ banner }: { banner: BannerRecord }) {
  if (banner.targetType === "product" || banner.targetType === "category") {
    const isProduct = banner.targetType === "product";
    const target = isProduct ? banner.product : banner.category;
    const targetId = isProduct ? banner.productId : banner.categoryId;
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{isProduct ? "Product" : "Category"}</p>
        {targetId ? (
          <Link
            href={isProduct ? `/products/${targetId}` : `/categories/${targetId}`}
            className="font-medium text-brand underline-offset-2 hover:underline"
          >
            {target?.name ?? "Open"}
          </Link>
        ) : (
          <span className="text-muted">—</span>
        )}
      </div>
    );
  }
  if (banner.link) {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Custom link (old)</p>
        <span className="block max-w-[220px] truncate text-slate" title={banner.link}>
          {banner.link}
        </span>
      </div>
    );
  }
  return <span className="text-muted">—</span>;
}
