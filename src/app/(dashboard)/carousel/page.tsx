"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BannerForm } from "@/components/banner-form";
import { Pagination, Table, TableCard, THead } from "@/components/data-table";
import { IconPlus } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { DeleteAction, EditAction, TableActions } from "@/components/table-actions";
import { Modal, Toolbar } from "@/components/ui";
import { prettyDate } from "@/lib/format";
import type { BannerRecord } from "@/lib/types";
import { asList, useDeleteBannerMutation, useGetBannersQuery } from "@/store/api";

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

  return (
    <div>
      <PageHeader
        title="Carousel / Banners"
        description="Add and manage homepage carousel slides shown on the storefront."
      />
      <Toolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search by link..."
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

      <TableCard
        footer={
          <Pagination page={page} total={total} limit={limit} onPage={setPage} />
        }
      >
        <Table>
          <THead columns={["Preview", "Link", "Status", "Created", "Actions"]} />
          <tbody>
            {list.items.map((banner) => (
              <tr key={banner.id} className="border-t border-line-soft">
                <td className="px-6 py-4">
                  <Image
                    src={banner.image || "/images/product-headphones.png"}
                    alt=""
                    width={120}
                    height={48}
                    className="h-12 w-[120px] rounded-xl object-cover"
                    unoptimized
                  />
                </td>
                <td className="px-6 py-4 text-sm">
                  {banner.link ? (
                    <Link
                      href={banner.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand underline underline-offset-2 hover:opacity-80"
                    >
                      Project link
                    </Link>
                  ) : (
                    <span className="text-slate">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <StatusPill value={banner.isActive === false ? "inactive" : "active"} />
                </td>
                <td className="px-6 py-4 text-slate">{prettyDate(banner.createdAt)}</td>
                <td className="px-6 py-4">
                  <TableActions>
                    <EditAction onClick={() => setEditId(banner.id)} />
                    <DeleteAction onClick={() => remove(banner.id)} />
                  </TableActions>
                </td>
              </tr>
            ))}
            {!isLoading && list.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted">
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
        description="Upload an image and optionally set a CTA link and visibility."
      >
        <BannerForm onDone={() => setCreateOpen(false)} />
      </Modal>

      <Modal
        open={Boolean(editId)}
        onClose={() => setEditId(null)}
        title="Edit Banner"
        description="Update banner image, link, or visibility."
      >
        {editId ? <BannerForm id={editId} onDone={() => setEditId(null)} /> : null}
      </Modal>
    </div>
  );
}
