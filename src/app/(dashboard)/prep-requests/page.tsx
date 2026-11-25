"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Pagination, Table, TableCard, THead } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { PrepStatusBadge } from "@/components/prep-status-badge";
import { FilterTabs, Toolbar, TypeChip } from "@/components/ui";
import { apiErrorMessage } from "@/lib/api-error";
import { prettyDate, prettyDateTime, timeAgo } from "@/lib/format";
import { isPrepStatus } from "@/lib/prep";
import type { PrepRecord, PrepStatus } from "@/lib/types";
import { asList, useGetPrepRequestsQuery } from "@/store/api";

type Tab = PrepStatus | "all";

const TABS: { id: Tab; label: string; empty: string }[] = [
  { id: "under_review", label: "Under review", empty: "No requests are waiting for review." },
  { id: "correction_required", label: "Needs correction", empty: "No requests are waiting on a customer correction." },
  { id: "completed", label: "Approved", empty: "No approved requests yet." },
  { id: "all", label: "All", empty: "No prep requests yet." },
];

const PAGE_SIZE = 10;
const COLUMNS = ["Customer", "Role", "Files", "Submitted", "Last updated", "Status"];

export default function PrepRequestsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading prep requests…</p>}>
      <PrepRequestsView />
    </Suspense>
  );
}

function usePrepCount(status?: PrepStatus) {
  const { data } = useGetPrepRequestsQuery(status ? { page: 1, limit: 1, status } : { page: 1, limit: 1 });
  return data ? asList(data.data).total : undefined;
}

function PrepRequestsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  // The tab lives in the URL so notification links can open the "Under review" queue.
  const tab: Tab = statusParam === "all" || isPrepStatus(statusParam) ? statusParam : "under_review";

  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setTerm(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const counts: Record<Tab, number | undefined> = {
    under_review: usePrepCount("under_review"),
    correction_required: usePrepCount("correction_required"),
    completed: usePrepCount("completed"),
    all: usePrepCount(),
  };

  return (
    <div>
      <PageHeader
        title="Prep Requests"
        description="Review the files customers upload for 3PL prep. Approve them or ask for a correction."
      />
      <div className="mb-4">
        <FilterTabs
          value={tab}
          onChange={(id) => router.replace(`/prep-requests?status=${id}`, { scroll: false })}
          items={TABS.map((item) => ({ id: item.id, label: item.label, count: counts[item.id] }))}
        />
      </div>
      <Toolbar search={search} onSearch={setSearch} placeholder="Search by customer name or email…" />
      {/* Keyed so pagination resets whenever the tab or search changes. */}
      <PrepRequestTable key={`${tab}|${term}`} tab={tab} term={term} />
    </div>
  );
}

function PrepRequestTable({ tab, term }: { tab: Tab; term: string }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = useGetPrepRequestsQuery({
    page,
    limit: PAGE_SIZE,
    ...(tab === "all" ? {} : { status: tab }),
    // Review queue: longest waiting first.
    ...(tab === "under_review" ? { sort: "updatedAt" } : {}),
    ...(term ? { searchTerm: term } : {}),
  });
  const list = asList<PrepRecord>(data?.data);
  const emptyText = term
    ? `No requests match "${term}".`
    : TABS.find((item) => item.id === tab)?.empty;

  return (
    <TableCard
      footer={
        list.total > PAGE_SIZE ? (
          <Pagination page={page} total={list.total} limit={PAGE_SIZE} onPage={setPage} />
        ) : null
      }
    >
      <Table>
        <THead columns={COLUMNS} />
        <tbody className={isFetching && !isLoading ? "opacity-60" : undefined}>
          {isLoading ? (
            <MessageRow>Loading prep requests…</MessageRow>
          ) : error ? (
            <MessageRow>
              <span className="text-danger">
                {apiErrorMessage(error, "Could not load prep requests.")}
              </span>{" "}
              <button type="button" onClick={() => refetch()} className="font-semibold text-brand">
                Try again
              </button>
            </MessageRow>
          ) : list.items.length === 0 ? (
            <MessageRow>{emptyText}</MessageRow>
          ) : (
            list.items.map((request) => {
              const href = `/prep-requests/${request.id}`;
              const files = request.attachments?.length ?? 0;
              return (
                <tr
                  key={request.id}
                  onClick={() => router.push(href)}
                  className="cursor-pointer border-t border-line-soft hover:bg-input"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={href}
                      onClick={(event) => event.stopPropagation()}
                      className="font-semibold text-ink hover:text-brand"
                    >
                      {request.user?.name || "Unnamed customer"}
                    </Link>
                    <p className="text-xs text-muted">{request.user?.email ?? "—"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <TypeChip value={request.user?.role} />
                  </td>
                  <td className="px-6 py-4 text-slate">
                    {files} {files === 1 ? "file" : "files"}
                  </td>
                  <td className="px-6 py-4 text-slate">{prettyDate(request.createdAt)}</td>
                  <td className="px-6 py-4 text-slate" title={prettyDateTime(request.updatedAt)}>
                    {prettyDate(request.updatedAt)}
                    <p className="text-xs text-muted">{timeAgo(request.updatedAt)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <PrepStatusBadge request={request} />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </TableCard>
  );
}

function MessageRow({ children }: { children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={COLUMNS.length} className="px-6 py-10 text-center text-sm text-muted">
        {children}
      </td>
    </tr>
  );
}
