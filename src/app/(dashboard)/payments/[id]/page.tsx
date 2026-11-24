"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { BackLink } from "@/components/ui";
import { initials, money, prettyDate, prettyDateTime } from "@/lib/format";
import { useGetPaymentQuery } from "@/store/api";

export default function PaymentDetailsPage() {
  const params = useParams<{ id: string }>();
  const { data } = useGetPaymentQuery(params.id);
  const payment = data?.data;
  const order = payment?.order;
  const items = order?.items ?? [];
  const subtotal = order?.subtotal ?? items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div>
      <PageHeader
        title={`Transaction #${payment?.transactionId || payment?.id.slice(-8) || ""}`}
        back={<BackLink href="/payments">Back to Payments & Revenue</BackLink>}
        description={`Processed ${prettyDateTime(payment?.paidAt || payment?.createdAt)}`}
      />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white px-5 py-4">
          <p className="text-xs text-muted">Total Paid</p>
          <p className="mt-1 text-2xl font-bold">{money(payment?.amount)}</p>
          <p className="text-xs text-muted">USD Gross</p>
        </div>
        <div className="rounded-2xl bg-white px-5 py-4">
          <p className="text-xs text-muted">Payment Method</p>
          <p className="mt-1 font-semibold capitalize">{payment?.paymentMethod || "—"}</p>
        </div>
        <div className="rounded-2xl bg-white px-5 py-4">
          <p className="text-xs text-muted">Payment Date</p>
          <p className="mt-1 font-semibold">{prettyDate(payment?.paidAt || payment?.createdAt)}</p>
        </div>
      </div>
      <section className="mb-6 rounded-2xl bg-white p-6">
        <h3 className="mb-4 font-bold">Customer Details</h3>
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#f4ebde] font-bold text-brand">
            {initials(payment?.user?.name)}
          </div>
          <div>
            <p className="font-semibold">{payment?.user?.name || "—"}</p>
            <p className="text-xs text-muted">ID: #{payment?.user?.id?.slice(-6)}</p>
          </div>
        </div>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between rounded-xl bg-[#faf8f5] px-4 py-3">
            <dt className="text-muted">Email</dt>
            <dd>{payment?.user?.email || "—"}</dd>
          </div>
          <div className="flex justify-between rounded-xl bg-[#faf8f5] px-4 py-3">
            <dt className="text-muted">Phone</dt>
            <dd>{payment?.user?.phoneNumber || "—"}</dd>
          </div>
        </dl>
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl bg-white p-6">
          <h3 className="mb-4 font-bold">Product list</h3>
          <div className="space-y-4">
            {items.length === 0 ? <p className="text-sm text-muted">No items on this payment.</p> : null}
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Image
                    src={item.product?.images?.[0]?.url as string || ""}
                    alt=""
                    width={48}
                    height={48}
                    className="size-12 rounded-xl object-cover"
                  />
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted">Quantity: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-semibold">{money(item.total)}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl bg-white p-6">
          <h3 className="mb-4 font-bold">Payment Breakdown</h3>
          <dl className="space-y-3 text-sm">
            <Row label="Total items" value={`${items.length} items`} />
            <Row label="Subtotal" value={money(subtotal)} />
            <Row label="Est. Delivery" value={money(order?.shippingFee)} />
            <Row label="Taxes" value={money(order?.tax)} accent />
            <Row label="Discount" value={`-${money(order?.discount)}`} />
            <div className="flex justify-between border-t border-line-soft pt-3 text-base font-bold">
              <dt>Final payment</dt>
              <dd>{money(payment?.amount ?? order?.total)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={accent ? "text-danger" : ""}>{value}</dd>
    </div>
  );
}
