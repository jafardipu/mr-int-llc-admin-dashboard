import type { OrderRecord, OrderStatus } from "./types";

export const ORDER_STATUSES = ["pending", "processing", "completed", "cancelled"] as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
  canceled: "Payment canceled",
};

export type OrderAction = "complete" | "cancel";

export const ORDER_ACTION_STATUS: Record<OrderAction, OrderStatus> = {
  complete: "completed",
  cancel: "cancelled",
};

/**
 * Status changes are forward-only and never re-set the current status.
 * `pending` cannot be moved to processing/completed by hand: the backend does that when Stripe
 * confirms payment, and a manual change would not mark the payment as paid.
 */
export function orderActions(order: Pick<OrderRecord, "status">): OrderAction[] {
  switch (order.status) {
    case "pending":
      return ["cancel"];
    case "processing":
      return ["complete", "cancel"];
    case "completed":
      return ["cancel"];
    default:
      return [];
  }
}

/** A paid order is refunded through Stripe when cancelled. */
export function isOrderPaid(order: Pick<OrderRecord, "payment">) {
  return order.payment?.status === "paid";
}

export function orderActionLabel(action: OrderAction, order: Pick<OrderRecord, "payment">) {
  if (action === "complete") return "Mark as completed";
  return isOrderPaid(order) ? "Cancel & refund" : "Cancel order";
}
