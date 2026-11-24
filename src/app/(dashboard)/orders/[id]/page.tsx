"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Table, TableCard, THead } from "@/components/data-table";
import DownloadInvoiceButton from "@/components/invoice/download-invoice-button";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/order-status-badge";
import { OrderStatusDialog } from "@/components/order-status-dialog";
import { PageHeader } from "@/components/page-header";
import { BackLink, TypeChip } from "@/components/ui";
import { apiErrorMessage, apiErrorStatus } from "@/lib/api-error";
import { money, prettyDate, prettyDateTime } from "@/lib/format";
import { orderActionLabel, orderActions, PAYMENT_STATUS_LABELS, type OrderAction } from "@/lib/orders";
import type { OrderRecord } from "@/lib/types";
import { useGetOrderQuery } from "@/store/api";

const back = <BackLink href="/orders">Back to Order List</BackLink>;

type TimelineStep = {
  label: string;
  done: boolean;
  date?: string | null;
  note?: string;
  tone: "success" | "danger";
};

/** Steps reflect real backend statuses; there is no separate "shipped" status. */
function timelineSteps(order: OrderRecord): TimelineStep[] {
  const paymentStatus = order.payment?.status ? String(order.payment.status) : null;
  const wasPaid = paymentStatus === "paid" || paymentStatus === "refunded";
  const placed = { label: "Order placed", done: true, date: order.createdAt, tone: "success" as const };
  const payment = {
    label: "Payment confirmed",
    done: wasPaid || order.status === "processing" || order.status === "completed",
    date: order.payment?.paidAt,
    tone: "success" as const,
  };

  if (order.status === "cancelled") {
    return [
      placed,
      ...(wasPaid ? [payment] : []),
      {
        label: "Cancelled",
        done: true,
        note: paymentStatus ? PAYMENT_STATUS_LABELS[paymentStatus] : undefined,
        tone: "danger" as const,
      },
    ];
  }
  return [
    placed,
    payment,
    {
      label: "Processing",
      done: order.status === "processing" || order.status === "completed",
      tone: "success" as const,
    },
    { label: "Completed", done: order.status === "completed", tone: "success" as const },
  ];
}

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useGetOrderQuery(params.id);
  const [dialogAction, setDialogAction] = useState<OrderAction | null>(null);
  const order = data?.data;
  const subtotal = order?.subtotal ?? order?.items?.reduce((sum, item) => sum + item.total, 0) ?? 0;

  // A 404 can also arrive on a refetch after a failed status change, while old data is still cached.
  if (!order || apiErrorStatus(error) === 404) {
    return (
      <div>
        <PageHeader title="Order" back={back} />
        <section className="rounded-2xl bg-white px-6 py-10 text-center text-sm text-muted">
          {apiErrorStatus(error) === 404 ? (
            "Order not found. It may have been removed."
          ) : isLoading ? (
            "Loading order…"
          ) : (
            <>
              <span className="text-danger">{apiErrorMessage(error, "Could not load this order.")}</span>{" "}
              <button type="button" onClick={() => refetch()} className="font-semibold text-brand">
                Try again
              </button>
            </>
          )}
        </section>
      </div>
    );
  }

  const actions = orderActions(order);

  return (
    <div>
      <PageHeader
        title={`Order #${order.orderNumber}`}
        back={back}
        description={
          <div className="flex flex-wrap items-center gap-2">
            <span>{prettyDateTime(order.createdAt)}</span>
            <TypeChip value={order.customerType ? `${order.customerType} Order` : undefined} />
          </div>
        }
        action={<DownloadInvoiceButton order={order} />}
      />
      <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-ink">Status</span>
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge payment={order.payment} />
        </div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <button
                key={action}
                type="button"
                disabled={dialogAction !== null}
                onClick={() => setDialogAction(action)}
                className={
                  action === "cancel"
                    ? "h-10 rounded-full border border-danger/40 bg-white px-5 text-sm font-semibold text-danger hover:bg-danger-bg disabled:opacity-60"
                    : "h-10 rounded-full bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60"
                }
              >
                {orderActionLabel(action, order)}
              </button>
            ))}
          </div>
        ) : order.status === "cancelled" ? (
          <p className="text-sm text-muted">This order is cancelled and can&apos;t be reopened.</p>
        ) : null}
      </section>
      {error ? (
        <p className="mb-6 rounded-2xl bg-warning-bg px-5 py-3 text-sm text-warning">
          Could not refresh this order. Showing the last loaded version.{" "}
          <button type="button" onClick={() => refetch()} className="font-semibold underline">
            Try again
          </button>
        </p>
      ) : null}
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
                        src={item.product?.images?.[0]?.url as string}
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
            {timelineSteps(order).map((step) => (
              <li key={step.label} className="flex gap-3">
                <span
                  className={`mt-1 size-3 rounded-full ${
                    !step.done ? "bg-line" : step.tone === "danger" ? "bg-danger" : "bg-success"
                  }`}
                />
                <div>
                  <p className={`text-sm font-semibold ${step.tone === "danger" ? "text-danger" : ""}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted">
                    {!step.done ? "Not yet" : step.date ? prettyDateTime(step.date) : (step.note ?? "Done")}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          {order.user?.id ? (
            <Link href={`/customers/${order.user.id}`} className="mt-6 inline-block text-sm font-medium text-brand">
              View customer
            </Link>
          ) : null}
        </section>
      </div>

      {dialogAction ? (
        <OrderStatusDialog
          key={dialogAction}
          order={order}
          action={dialogAction}
          onClose={() => setDialogAction(null)}
        />
      ) : null}
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
