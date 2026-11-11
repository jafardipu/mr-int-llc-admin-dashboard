"use client";

import Link from "next/link";
import { useState } from "react";
import { DonutChart, RevenueBars } from "@/components/charts";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { TypeChip } from "@/components/ui";
import { Table, TableCard, THead } from "@/components/data-table";
import { compactNumber, money, timeAgo } from "@/lib/format";
import type { OrderRecord } from "@/lib/types";
import { asList, useGetOverviewQuery } from "@/store/api";

export default function DashboardPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data, isLoading, isFetching } = useGetOverviewQuery(
    { year },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      pollingInterval: 20_000,
    },
  );
  const overview = data?.data;
  const latest = asList<OrderRecord>(overview?.latestOrders ?? []).items;
  const activity = overview?.recentActivity ?? [];
  const chartBusy = isLoading || (isFetching && !overview);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here’s what’s happening with Bullfy Pedex."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Sales" value={isLoading ? "—" : money(overview?.totalSales)} />
        <StatCard label="Total Orders" value={isLoading ? "—" : compactNumber(overview?.totalOrders)} />
        <StatCard label="Customers" value={isLoading ? "—" : compactNumber(overview?.customers)} />
        <StatCard label="Products" value={isLoading ? "—" : compactNumber(overview?.products)} />
      </div>
      <div className={`mt-6 grid gap-6 xl:grid-cols-[1fr_1.4fr] ${isFetching ? "opacity-90" : ""}`}>
        <section className="rounded-2xl bg-white p-6">
          <DonutChart
            retail={overview?.orderBreakdown.retail ?? 0}
            wholesale={overview?.orderBreakdown.wholesale ?? 0}
          />
          <p className="mt-3 text-xs text-muted">
            Paid order share for {year}
            {isFetching ? " · refreshing…" : ""}
          </p>
        </section>
        <section className="rounded-2xl bg-white p-6">
          <RevenueBars
            data={overview?.yearlyRevenue ?? []}
            year={year}
            years={overview?.availableYears ?? [year]}
            onYearChange={setYear}
          />
          {chartBusy ? (
            <p className="mt-2 text-xs text-muted">Loading live revenue for {year}…</p>
          ) : (
            <p className="mt-2 text-xs text-muted">
              {year} revenue: {money(overview?.yearSales ?? 0)}
            </p>
          )}
        </section>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <TableCard
          title="Latest Orders"
          action={
            <Link href="/orders" className="text-sm font-semibold text-brand">
              View All
            </Link>
          }
        >
          <Table>
            <THead columns={["Order", "Customer", "Type", "Status", "Total"]} />
            <tbody>
              {latest.map((order) => (
                <tr key={order.id} className="border-t border-line-soft">
                  <td className="px-6 py-4 font-semibold text-ink">#{order.orderNumber}</td>
                  <td className="px-6 py-4">{order.user?.name ?? "—"}</td>
                  <td className="px-6 py-4">
                    <TypeChip value={order.customerType} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill value={order.status} />
                  </td>
                  <td className="px-6 py-4">{money(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableCard>
        <section className="rounded-2xl bg-white p-6">
          <h2 className="mb-5 text-lg font-bold text-ink">Recent Activity</h2>
          <ul className="space-y-3">
            {activity.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-[#faf8f5] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{item.message}</p>
                </div>
                <span className="text-xs text-muted">{timeAgo(item.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
