"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Table, TableCard, THead } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { BackLink, TypeChip } from "@/components/ui";
import { money, prettyDate, prettyDateTime } from "@/lib/format";
import { downloadOrderInvoice } from "@/lib/invoice";
import type { OrderStatus } from "@/lib/types";
import { useGetOrderQuery, useUpdateOrderStatusMutation } from "@/store/api";

const timeline = [
  { id: "pending", label: "Order placed" },
  { id: "paid", label: "Payment confirmed" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "completed", label: "Delivered" },
] as const;

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const { data } = useGetOrderQuery(params.id);
  const [updateStatus, { isLoading }] = useUpdateOrderStatusMutation();
  const order = data?.data;
  const paid = Boolean(order?.payment && String(order.payment.status) === "paid");
  const current = order?.status === "cancelled"
    ? -1
    : order?.status === "completed"
      ? 4
      : order?.status === "processing"
        ? 2
        : paid
          ? 1
          : 0;
  const subtotal = order?.subtotal ?? order?.items?.reduce((sum, item) => sum + item.total, 0) ?? 0;

  function downloadInvoice() {
    if (!order) return;
    downloadOrderInvoice(order);
  }

  return (
    <div>
      <PageHeader
        title={`Order #${order?.orderNumber ?? ""}`}
        back={<BackLink href="/orders">Back to Order List</BackLink>}
        description={
          <div className="flex flex-wrap items-center gap-2">
            <span>{prettyDateTime(order?.createdAt)}</span>
            <TypeChip value={order?.customerType ? `${order.customerType} Order` : undefined} />
            <StatusPill value={order?.status} />
          </div>
        }
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isLoading || !order || order.status === "completed"}
              onClick={() => order && updateStatus({ id: order.id, status: "processing" as OrderStatus })}
              className="h-11 rounded-full bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              Start Shipping
            </button>
            <button
              type="button"
              onClick={downloadInvoice}
              className="h-11 rounded-full border border-line bg-white px-5 text-sm font-semibold text-slate"
            >
              Download Invoice
            </button>
          </div>
        }
      />
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoBox
          label="Customer"
          value={order?.user?.name || "—"}
          hint={order?.user?.email}
        />
        <InfoBox
          label="Payment Method"
          value={order?.payment?.paymentMethod || "—"}
        />
        <InfoBox
          label="Shipping Method"
          value={order?.address?.city ? `${order.address.city}` : "Standard Shipping"}
        />
        <InfoBox label="Order Date" value={prettyDate(order?.createdAt)} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_320px]">
        <TableCard title={`Order Items (${order?.items?.length ?? 0})`}>
          <Table>
            <THead columns={["Product", "SKU", "Quantity", "Unit Price", "Total"]} />
            <tbody>
              {(order?.items ?? []).map((item) => (
                <tr key={item.id} className="border-t border-line-soft">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src={item.product?.images?.[0]?.url || "/images/product-headphones.png"}
                        alt=""
                        width={44}
                        height={44}
                        className="size-11 rounded-xl object-cover"
                      />
                      <span className="font-semibold">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted">{item.sku}</td>
                  <td className="px-6 py-4">{item.quantity}</td>
                  <td className="px-6 py-4">{money(item.unitPrice)}</td>
                  <td className="px-6 py-4 font-semibold">{money(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <dl className="ml-auto max-w-xs space-y-2 px-6 py-5 text-sm">
            <Row label="Subtotal" value={money(subtotal)} />
            <Row
              label={order?.promoCode ? `Discount (${order.promoCode})` : "Discount"}
              value={`-${money(order?.discount)}`}
            />
            <Row label="Shipping" value={money(order?.shippingFee)} />
            <Row label="Tax" value={money(order?.tax)} />
            <div className="flex justify-between border-t border-line-soft pt-2 font-bold">
              <dt>Total Amount</dt>
              <dd>{money(order?.total)}</dd>
            </div>
          </dl>
        </TableCard>
        <section className="rounded-2xl bg-white p-6">
          <h3 className="mb-5 font-bold">Order Timeline</h3>
          <ol className="space-y-4">
            {timeline.map((step, index) => (
              <li key={step.id} className="flex gap-3">
                <span
                  className={`mt-1 size-3 rounded-full ${
                    current >= index ? "bg-success" : "bg-line"
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold">{step.label}</p>
                  <p className="text-xs text-muted">
                    {current >= index ? prettyDateTime(order?.createdAt) : "Not yet"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          {order?.user?.id ? (
            <Link href={`/customers/${order.user.id}`} className="mt-6 inline-block text-sm font-medium text-brand">
              View customer
            </Link>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function InfoBox({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white px-5 py-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-semibold capitalize text-ink">{value}</p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
