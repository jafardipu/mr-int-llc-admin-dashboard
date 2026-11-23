import type { OrderRecord } from "@/lib/types";

/*
 * The order shape invoice-pdf.tsx reads (it was written against the storefront's `Order` type).
 * GET /orders/:id returns all of these fields; the admin `OrderRecord` type just marks some of
 * them optional, so they get safe defaults here instead of changing the PDF code.
 */
export type Order = OrderRecord & {
  items: NonNullable<OrderRecord["items"]>;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  notes: string | null;
};

export function toInvoiceOrder(order: OrderRecord): Order {
  const items = order.items ?? [];
  return {
    ...order,
    items,
    subtotal: order.subtotal ?? items.reduce((sum, item) => sum + item.total, 0),
    shippingFee: order.shippingFee ?? 0,
    tax: order.tax ?? 0,
    discount: order.discount ?? 0,
    notes: order.notes ?? null,
  };
}
