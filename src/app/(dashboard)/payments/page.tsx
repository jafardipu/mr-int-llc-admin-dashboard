"use client";

import Image from "next/image";
import { useState } from "react";
import { CategoryBars, DonutChart, SalesLine } from "@/components/charts";
import { Pagination, Table, TableCard, THead } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { TableActions, ViewAction } from "@/components/table-actions";
import { Toolbar } from "@/components/ui";
import { money, prettyDate } from "@/lib/format";
import type { PaymentRecord } from "@/lib/types";
import { asList, useGetOverviewQuery, useGetPaymentsQuery } from "@/store/api";

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const { data } = useGetPaymentsQuery({ page, limit: 10, searchTerm: searchTerm || undefined });
  const { data: overviewRes, isLoading, isFetching } = useGetOverviewQuery(
    { year },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      pollingInterval: 20_000,
    },
  );
  const overview = overviewRes?.data;
  const list = asList<PaymentRecord>(data?.data);
  const monthlySales =
    overview?.monthlySales ??
    (overview?.yearlyRevenue ?? []).map((item) => ({
      month: item.month,
      retail: item.revenue,
      wholesale: 0,
      revenue: item.revenue,
    }));

  return (
    <div>
      <PageHeader title="Payments & Revenue" />
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <StatCard
          label={`${year} Revenue`}
          value={isLoading ? "—" : money(overview?.yearSales ?? 0)}
        />
        <StatCard
          label="Retail Sales"
          value={isLoading ? "—" : money(overview?.retailSales ?? 0)}
        />
        <StatCard
          label="Wholesale Sales"
          value={isLoading ? "—" : money(overview?.wholesaleSales ?? 0)}
        />
      </div>
      <div className={`mb-6 grid gap-6 xl:grid-cols-2 ${isFetching ? "opacity-90" : ""}`}>
        <section className="rounded-2xl bg-white p-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_180px]">
            <SalesLine
              data={monthlySales}
              year={year}
              years={overview?.availableYears ?? [year]}
              onYearChange={setYear}
            />
            <DonutChart
              title="Share"
              retail={overview?.orderBreakdown.retail ?? 0}
              wholesale={overview?.orderBreakdown.wholesale ?? 0}
            />
          </div>
          {isFetching ? (
            <p className="mt-3 text-xs text-muted">Refreshing live data for {year}…</p>
          ) : null}
        </section>
        <section className="rounded-2xl bg-white p-6">
          <CategoryBars data={overview?.salesByCategory ?? []} />
        </section>
      </div>
      <Toolbar search={searchTerm} onSearch={setSearchTerm} placeholder="Search transactions by ID or customer..." />
      <TableCard footer={<Pagination page={page} total={list.total} limit={10} onPage={setPage} />}>
        <Table>
          <THead columns={["Transaction ID", "Customer", "Amount", "Date", "Action"]} />
          <tbody>
            {list.items.map((payment) => (
              <tr key={payment.id} className="border-t border-line-soft">
                <td className="px-6 py-4 font-semibold text-brand">
                  #{payment.transactionId || payment.id.slice(-8)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src={payment.user?.profile || "/images/avatar-profile.png"}
                      alt=""
                      width={36}
                      height={36}
                      className="size-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold">{payment.user?.name ?? "—"}</p>
                      <p className="text-xs text-muted">{payment.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">{money(payment.amount)}</td>
                <td className="px-6 py-4">{prettyDate(payment.paidAt || payment.createdAt)}</td>
                <td className="px-6 py-4">
                  <TableActions>
                    <ViewAction href={`/payments/${payment.id}`} />
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
