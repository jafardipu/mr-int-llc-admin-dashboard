"use client";

import { useMemo, useState } from "react";
import { Pagination, Table, TableCard, THead } from "@/components/data-table";
import { IconEdit } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { TableActions } from "@/components/table-actions";
import { Toolbar } from "@/components/ui";
import { compactNumber, prettyDate } from "@/lib/format";
import type { PrepRecord } from "@/lib/types";
import { asList, useGetPrepRequestsQuery, useUpdatePrepStatusMutation } from "@/store/api";

const statuses = ["under_review", "correction_required", "completed"] as const;

export default function PrepRequestsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data } = useGetPrepRequestsQuery({ page, limit: 10, status: status || undefined });
  const totalRes = useGetPrepRequestsQuery({ page: 1, limit: 1 });
  const pendingRes = useGetPrepRequestsQuery({ page: 1, limit: 1, status: "under_review" });
  const correctionRes = useGetPrepRequestsQuery({
    page: 1,
    limit: 1,
    status: "correction_required",
  });
  const completedRes = useGetPrepRequestsQuery({ page: 1, limit: 1, status: "completed" });
  const [updateStatus] = useUpdatePrepStatusMutation();
  const list = asList<PrepRecord>(data?.data);
  const filtered = useMemo(
    () =>
      list.items.filter((item) => {
        const haystack = `${item.id} ${item.user?.name ?? ""} ${item.serviceType}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      }),
    [list.items, search],
  );
  const counts = {
    total: asList(totalRes.data?.data).total,
    pending: asList(pendingRes.data?.data).total,
    correction: asList(correctionRes.data?.data).total,
    completed: asList(completedRes.data?.data).total,
  };

  function exportCsv() {
    const rows = [
      ["Request ID", "Customer", "File Name", "Status", "Date"],
      ...filtered.map((item) => [
        `PR-${item.id.slice(-5)}`,
        item.user?.name ?? "",
        item.attachments?.[0]?.split("/").pop() || item.serviceType,
        String(item.status),
        prettyDate(item.createdAt),
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "prep-requests.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="3PL Prep Request List"
        action={
          <button
            type="button"
            onClick={exportCsv}
            className="h-11 rounded-full bg-brand px-5 text-sm font-semibold text-white"
          >
            Export Report
          </button>
        }
      />
      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <StatCard label="Total Requests" value={compactNumber(counts.total)} />
        <StatCard label="Pending" value={compactNumber(counts.pending)} />
        <StatCard label="Correction Required" value={compactNumber(counts.correction)} />
        <StatCard label="Completed" value={compactNumber(counts.completed)} />
      </div>
      <Toolbar search={search} onSearch={setSearch} placeholder="Search by request ID, customer name...">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="h-11 rounded-full border border-line bg-white px-4 text-sm"
        >
          <option value="">All Status</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={exportCsv}
          className="h-11 rounded-full border border-line bg-white px-4 text-sm"
        >
          Export
        </button>
      </Toolbar>
      <TableCard footer={<Pagination page={page} total={list.total} limit={10} onPage={setPage} />}>
        <Table>
          <THead columns={["Request ID", "Customer", "File Name", "Status", "Date", "Actions"]} />
          <tbody>
            {filtered.map((request) => (
              <tr key={request.id} className="border-t border-line-soft">
                <td className="px-6 py-4 font-semibold">PR-{request.id.slice(-5)}</td>
                <td className="px-6 py-4">{request.user?.name ?? "—"}</td>
                <td className="px-6 py-4 text-muted">
                  {request.attachments?.[0]?.split("/").pop() || request.serviceType}
                </td>
                <td className="px-6 py-4">
                  <StatusPill value={String(request.status)} />
                </td>
                <td className="px-6 py-4">{prettyDate(request.createdAt)}</td>
                <td className="relative px-6 py-4">
                  <TableActions>
                    <button
                      type="button"
                      aria-label="Update status"
                      title="Update status"
                      onClick={() => setOpenId(openId === request.id ? null : request.id)}
                      className="inline-flex size-9 items-center justify-center rounded-full text-slate transition hover:bg-[#f4ebde] hover:text-brand"
                    >
                      <IconEdit className="size-4" />
                    </button>
                  </TableActions>
                  {openId === request.id ? (
                    <div className="absolute right-6 z-10 mt-2 w-48 rounded-xl border border-line bg-white p-2 shadow-lg">
                      {statuses.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            updateStatus({ id: request.id, status: item });
                            setOpenId(null);
                          }}
                          className="block w-full rounded-lg px-3 py-2 text-left text-sm capitalize hover:bg-input"
                        >
                          Mark {item.replaceAll("_", " ")}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </div>
  );
}
