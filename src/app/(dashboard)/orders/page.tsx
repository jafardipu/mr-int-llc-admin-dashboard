"use client";

import { useState } from "react";
import { Pagination, Table, TableCard, THead } from "@/components/data-table";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { OrderStatusDialog } from "@/components/order-status-dialog";
import { PageHeader } from "@/components/page-header";
import { RowMenu } from "@/components/row-menu";
import { StatCard } from "@/components/stat-card";
import { TableActions, ViewAction } from "@/components/table-actions";
import { FilterTabs, Toolbar, TypeChip } from "@/components/ui";
import { compactNumber, money, prettyDate } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  orderActionLabel,
  orderActions,
  type OrderAction,
} from "@/lib/orders";
import type { OrderRecord } from "@/lib/types";
import { asList, useGetOrdersQuery, useGetOverviewQuery } from "@/store/api";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState<{ order: OrderRecord; action: OrderAction } | null>(null);
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
  // Keep the dialog on the latest copy of the order; fall back to the snapshot if it left the list.
  const dialogOrder = pending
    ? (list.items.find((order) => order.id === pending.order.id) ?? pending.order)
    : null;

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
          {ORDER_STATUSES.map((item) => (
            <option key={item} value={item}>
              {ORDER_STATUS_LABELS[item]}
            </option>
          ))}
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
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-6 py-4">
                  <TableActions>
                    <ViewAction href={`/orders/${order.id}`} />
                    {orderActions(order).length > 0 ? (
                      <RowMenu
                        label={`Change status of order ${order.orderNumber}`}
                        items={orderActions(order).map((action) => ({
                          label: orderActionLabel(action, order),
                          tone: action === "cancel" ? "danger" : "default",
                          onSelect: () => setPending({ order, action }),
                        }))}
                      />
                    ) : null}
                  </TableActions>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>

      {pending && dialogOrder ? (
        <OrderStatusDialog
          key={`${pending.order.id}-${pending.action}`}
          order={dialogOrder}
          action={pending.action}
          onClose={() => setPending(null)}
        />
      ) : null}
    </div>
  );
}
