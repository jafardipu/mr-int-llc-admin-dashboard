"use client";

import { useState } from "react";
import { Pagination, Table, TableCard, THead } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { TableActions, ViewAction } from "@/components/table-actions";
import { FilterTabs, Toolbar, TypeChip } from "@/components/ui";
import { compactNumber, money, prettyDate } from "@/lib/format";
import type { OrderRecord } from "@/lib/types";
import { asList, useGetOrdersQuery, useGetOverviewQuery } from "@/store/api";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("");
  const { data } = useGetOrdersQuery({
    page,
    limit: 10,
    searchTerm: searchTerm || undefined,
    customerType: type === "all" ? undefined : type,
    status: status || undefined,
  });
  const { data: overviewRes } = useGetOverviewQuery();
  const overview = overviewRes?.data;
  const list = asList<OrderRecord>(data?.data);

  return (
    <div>
      <PageHeader title="Order List" />
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <StatCard label="Total Orders" value={compactNumber(overview?.totalOrders)} />
        <StatCard
          label="Retail Orders"
          value={compactNumber(overview?.orderCounts?.retail ?? overview?.orderBreakdown.retail)}
        />
        <StatCard
          label="Wholesale Orders"
          value={compactNumber(overview?.orderCounts?.wholesale ?? overview?.orderBreakdown.wholesale)}
        />
      </div>
      <Toolbar search={searchTerm} onSearch={setSearchTerm} placeholder="Search transaction by ID or wholesale...">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-11 rounded-full border border-line bg-white px-4 text-sm"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
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
            { id: "retail", label: "Retail" },
            { id: "wholesale", label: "Wholesale" },
          ]}
        />
      </div>
      <TableCard footer={<Pagination page={page} total={list.total} limit={10} onPage={setPage} />}>
        <Table>
          <THead columns={["Order ID", "Customer", "Type", "Date", "Total Amount", "Fulfillment Status", "Actions"]} />
          <tbody>
            {list.items.map((order) => (
              <tr key={order.id} className="border-t border-line-soft">
                <td className="px-6 py-4 font-semibold">#{order.orderNumber}</td>
                <td className="px-6 py-4">{order.user?.name ?? "—"}</td>
                <td className="px-6 py-4">
                  <TypeChip value={order.customerType} />
                </td>
                <td className="px-6 py-4">{prettyDate(order.createdAt)}</td>
                <td className="px-6 py-4">{money(order.total)}</td>
                <td className="px-6 py-4">
                  <StatusPill value={order.status} />
                </td>
                <td className="px-6 py-4">
                  <TableActions>
                    <ViewAction href={`/orders/${order.id}`} />
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
