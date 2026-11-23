"use client";

import { useState } from "react";
import { toast } from "@/components/toast";
import { Modal } from "@/components/ui";
import { apiErrorMessage, apiErrorStatus } from "@/lib/api-error";
import { money } from "@/lib/format";
import { isOrderPaid, ORDER_ACTION_STATUS, orderActions, type OrderAction } from "@/lib/orders";
import type { OrderRecord } from "@/lib/types";
import { useUpdateOrderStatusMutation } from "@/store/api";

/** After these errors the action can never succeed, so only "Close" is offered. */
function isFinalError(error: unknown) {
  const message = apiErrorMessage(error, "");
  return apiErrorStatus(error) === 404 || /already cancelled|cannot be reopened/i.test(message);
}

function errorHint(error: unknown) {
  const message = apiErrorMessage(error, "");
  if (apiErrorStatus(error) === 404) return "It may have been removed.";
  if (/already cancelled/i.test(message)) {
    return "Another admin or the automatic expiry got there first. The order has been refreshed.";
  }
  if (/^Stripe Error/i.test(message)) return "The refund failed, so the order was not changed.";
  if (/No Stripe payment found/i.test(message)) return "Nothing was changed.";
  return null;
}

/**
 * Confirmation for a status change. Pass the live order (it can change underneath after an error
 * refetch) and mount with a `key` per opening so the state starts fresh.
 */
export function OrderStatusDialog({
  order,
  action,
  onClose,
}: {
  order: OrderRecord;
  action: OrderAction;
  onClose: () => void;
}) {
  const [updateStatus, { isLoading }] = useUpdateOrderStatusMutation();
  const [error, setError] = useState<unknown>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const number = order.orderNumber;
  const paid = isOrderPaid(order);
  const cancelling = action === "cancel";
  const cancellingCompleted = cancelling && order.status === "completed";
  const blocked = (error !== null && isFinalError(error)) || !orderActions(order).includes(action);
  const canConfirm = !blocked && !isLoading && (!cancellingCompleted || acknowledged);

  const title = !cancelling ? "Mark as completed" : paid ? "Cancel & refund" : "Cancel order";
  const question = !cancelling
    ? `Mark order ${number} as completed? The customer will be notified.`
    : paid
      ? `Cancel order ${number} and refund ${money(order.total)} to the customer's card? Items go back into stock, any promo code use is released, and the customer is notified. This cannot be undone.`
      : `Cancel order ${number}? The reserved stock is released and the customer is notified. This cannot be undone.`;
  const confirmLabel = isLoading
    ? cancelling
      ? paid
        ? "Refunding…"
        : "Cancelling…"
      : "Saving…"
    : !cancelling
      ? "Mark as completed"
      : paid
        ? `Cancel & refund ${money(order.total)}`
        : "Cancel order";

  async function confirm() {
    if (!canConfirm) return;
    setError(null);
    try {
      const result = await updateStatus({ id: order.id, status: ORDER_ACTION_STATUS[action] }).unwrap();
      toast.success(result.message || "Order updated.");
      onClose();
    } catch (err) {
      setError(err);
    }
  }

  const hint = error !== null ? errorHint(error) : null;

  return (
    <Modal
      open
      title={title}
      onClose={() => {
        if (!isLoading) onClose();
      }}
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-slate">{question}</p>

        {cancellingCompleted && !blocked ? (
          <div className="rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
            <p className="font-semibold">This order is already completed.</p>
            <p className="mt-1">
              Stock is added back even though the goods were already shipped. Only use this for returned
              orders.
            </p>
            <label className="mt-3 flex items-start gap-2 font-medium">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
                disabled={isLoading}
                className="mt-0.5 size-4 accent-[#e11d48]"
              />
              The goods for this order have been returned.
            </label>
          </div>
        ) : null}

        {isLoading && cancelling ? (
          <p className="text-xs text-muted">
            Cancelling goes through Stripe and can take a few seconds. Keep this window open.
          </p>
        ) : null}

        {error !== null ? (
          <div role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
            <p className="font-medium">{apiErrorMessage(error, "Could not update the order. Please try again.")}</p>
            {hint ? <p className="mt-1">{hint}</p> : null}
          </div>
        ) : null}

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-11 rounded-full border border-line bg-white px-5 text-sm font-semibold text-slate disabled:opacity-60"
          >
            {blocked ? "Close" : cancelling ? "Keep order" : "Go back"}
          </button>
          {!blocked ? (
            <button
              type="button"
              onClick={confirm}
              disabled={!canConfirm}
              className={`h-11 rounded-full px-5 text-sm font-semibold text-white disabled:opacity-60 ${
                cancelling ? "bg-danger" : "bg-brand"
              }`}
            >
              {confirmLabel}
            </button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
