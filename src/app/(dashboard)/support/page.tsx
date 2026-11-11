"use client";

import { useMemo, useState } from "react";
import { Pagination, Table, TableCard, THead } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { EditAction, TableActions } from "@/components/table-actions";
import { FilterTabs, Modal, Toolbar } from "@/components/ui";
import { prettyDateTime } from "@/lib/format";
import type { SupportMessageRecord } from "@/lib/types";
import {
  asList,
  useGetSupportMessageQuery,
  useGetSupportMessagesQuery,
  useReplySupportMessageMutation,
} from "@/store/api";

export default function SupportPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [replySupport, replyState] = useReplySupportMessageMutation();

  const listParams = {
    page: 1,
    limit: 100,
    searchTerm: search || undefined,
    status: status === "pending" || status === "replied" ? status : undefined,
  };

  const { data, isLoading } = useGetSupportMessagesQuery(listParams);
  const all = useGetSupportMessagesQuery({ page: 1, limit: 1 });
  const pending = useGetSupportMessagesQuery({ page: 1, limit: 1, status: "pending" });
  const replied = useGetSupportMessagesQuery({ page: 1, limit: 1, status: "replied" });
  const { data: detailRes } = useGetSupportMessageQuery(selectedId as string, {
    skip: !selectedId,
  });
  const detail = detailRes?.data;
  const list = asList<SupportMessageRecord>(data?.data);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return list.items.filter((item) => {
      const matchesStatus =
        status === "all" ||
        (status === "pending" && (item.status ?? "pending") === "pending") ||
        (status === "replied" && item.status === "replied");
      if (!matchesStatus) return false;
      if (!term) return true;
      return (
        item.name.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        item.subject?.toLowerCase().includes(term) ||
        item.message.toLowerCase().includes(term)
      );
    });
  }, [list.items, search, status]);

  const limit = 8;
  const pageItems = filtered.slice((page - 1) * limit, page * limit);

  function openMessage(id: string) {
    setSelectedId(id);
    setReply("");
    setError("");
  }

  async function onReply(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId) return;
    setError("");
    try {
      await replySupport({ id: selectedId, reply }).unwrap();
      setReply("");
    } catch (err) {
      const message =
        err && typeof err === "object" && "data" in err
          ? ((err.data as { message?: string })?.message ?? "Reply failed")
          : "Reply failed";
      setError(message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Support Messages"
        description="View customer support messages and send email replies."
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          items={[
            { id: "all", label: "All", count: asList(all.data?.data).total },
            { id: "pending", label: "Pending", count: asList(pending.data?.data).total },
            { id: "replied", label: "Replied", count: asList(replied.data?.data).total },
          ]}
        />
        <Toolbar
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search name, email, subject..."
        />
      </div>

      <TableCard
        footer={
          <Pagination page={page} total={filtered.length} limit={limit} onPage={setPage} />
        }
      >
        <Table>
          <THead columns={["From", "Subject", "Message", "Status", "Received", "Actions"]} />
          <tbody>
            {pageItems.map((item) => (
              <tr key={item.id} className="border-t border-line-soft">
                <td className="px-6 py-4">
                  <p className="font-semibold text-ink">{item.name}</p>
                  <p className="text-xs text-muted">{item.email}</p>
                </td>
                <td className="px-6 py-4 text-slate">{item.subject || "General inquiry"}</td>
                <td className="px-6 py-4">
                  <p className="max-w-sm truncate text-sm text-slate">{item.message}</p>
                </td>
                <td className="px-6 py-4">
                  <StatusPill value={item.status ?? "pending"} />
                </td>
                <td className="px-6 py-4 text-slate">{prettyDateTime(item.createdAt)}</td>
                <td className="px-6 py-4">
                  <TableActions>
                    <EditAction onClick={() => openMessage(item.id)} />
                  </TableActions>
                </td>
              </tr>
            ))}
            {!isLoading && pageItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted">
                  No support messages found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </TableCard>

      <Modal
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title="Support Message"
        description="Review the customer message and send a reply by email."
      >
        {detail ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-[#faf8f5] p-4 text-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{detail.name}</p>
                  <p className="text-muted">{detail.email}</p>
                </div>
                <StatusPill value={detail.status ?? "pending"} />
              </div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Subject
              </p>
              <p className="mb-3 font-medium">{detail.subject || "General inquiry"}</p>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Message
              </p>
              <p className="whitespace-pre-wrap text-slate">{detail.message}</p>
              <p className="mt-3 text-xs text-muted">{prettyDateTime(detail.createdAt)}</p>
            </div>

            {detail.reply ? (
              <div className="rounded-2xl border border-success/20 bg-success-bg/40 p-4 text-sm">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-success">
                  Previous reply
                </p>
                <p className="whitespace-pre-wrap text-ink">{detail.reply}</p>
                <p className="mt-2 text-xs text-muted">{prettyDateTime(detail.repliedAt)}</p>
              </div>
            ) : null}

            <form onSubmit={onReply} className="space-y-3">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  {detail.reply ? "Send another reply" : "Your reply"}
                </span>
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  rows={5}
                  required
                  placeholder="Type your reply. This will be emailed to the customer."
                  className="w-full rounded-2xl border border-line bg-input px-4 py-3 text-sm outline-none focus:border-brand"
                />
              </label>
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="h-11 rounded-full border border-line bg-white px-5 text-sm font-semibold text-slate"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={replyState.isLoading}
                  className="h-11 rounded-full bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {replyState.isLoading ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <p className="text-sm text-muted">Loading message…</p>
        )}
      </Modal>
    </div>
  );
}
