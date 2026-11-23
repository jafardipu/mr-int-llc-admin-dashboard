import { StatusPill } from "@/components/status-pill";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/orders";
import type { OrderRecord } from "@/lib/types";

export function OrderStatusBadge({ status }: { status?: OrderRecord["status"] | null }) {
  return <StatusPill value={status} label={status ? ORDER_STATUS_LABELS[status] : undefined} />;
}

export function PaymentStatusBadge({ payment }: { payment?: OrderRecord["payment"] }) {
  const status = payment?.status ? String(payment.status) : null;
  return (
    <StatusPill
      value={status ?? "none"}
      label={status ? (PAYMENT_STATUS_LABELS[status] ?? undefined) : "No payment"}
    />
  );
}
