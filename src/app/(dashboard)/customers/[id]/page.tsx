"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Table, TableCard, THead } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { TableActions, ViewAction } from "@/components/table-actions";
import { BackLink, TypeChip } from "@/components/ui";
import { money, prettyDate } from "@/lib/format";
import { useBlockUserMutation, useGetUserQuery } from "@/store/api";

export default function CustomerDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data } = useGetUserQuery(params.id);
  const [blockUser, { isLoading }] = useBlockUserMutation();
  const user = data?.data;
  const orders = user?.orders ?? [];
  const nextStatus = user?.status === "blocked" ? "active" : "blocked";

  return (
    <div>
      <PageHeader
        title="Customer Details"
        back={<BackLink href="/customers">Back to Customer List</BackLink>}
      />
      <section className="rounded-2xl bg-white p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Image
            src={user?.profile || "/images/avatar-profile.png"}
            alt=""
            width={64}
            height={64}
            className="size-16 rounded-full object-cover"
          />
          <div>
            <h2 className="text-xl font-bold text-ink">{user?.name || "Customer"}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <TypeChip value={user?.role} />
              <StatusPill value={user?.status} />
            </div>
          </div>
        </div>
        <dl className="mt-6 space-y-3 text-sm text-slate">
          <div>✉ {user?.email}</div>
          <div>☎ {user?.phoneNumber || "—"}</div>
          <div>Customer ID: {user?.id ? `CUST-${user.id.slice(-6)}` : "—"}</div>
          <div>Joined: {prettyDate(user?.createdAt)}</div>
        </dl>
      </section>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/customers")}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isLoading || !user}
          onClick={() => user && blockUser({ id: user.id, status: nextStatus })}
          className="rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {user?.status === "blocked" ? "Unsuspend" : "Suspend"}
        </button>
      </div>
      <h3 className="mb-3 mt-8 text-xl font-bold text-ink">Order Details</h3>
      <TableCard>
        <Table>
          <THead columns={["Order ID", "Date", "Type", "Total", "Status", ""]} />
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t border-line-soft">
                  <td className="px-6 py-4 font-semibold">#{order.orderNumber}</td>
                  <td className="px-6 py-4">{prettyDate(order.createdAt)}</td>
                  <td className="px-6 py-4">
                    <TypeChip value={order.customerType} />
                  </td>
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
              ))
            )}
          </tbody>
        </Table>
      </TableCard>
    </div>
  );
}
