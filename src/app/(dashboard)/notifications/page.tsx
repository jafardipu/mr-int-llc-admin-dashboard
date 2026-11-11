"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { notificationHref, prettyDateTime } from "@/lib/format";
import type { NotificationRecord } from "@/lib/types";
import {
  asList,
  useDeleteNotificationsMutation,
  useGetNotificationsQuery,
  useReadNotificationsMutation,
} from "@/store/api";

export default function NotificationsPage() {
  const { data, isLoading } = useGetNotificationsQuery();
  const [readNotifications, readState] = useReadNotificationsMutation();
  const [deleteNotifications, deleteState] = useDeleteNotificationsMutation();
  const items = asList<NotificationRecord>(data?.data).items;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Order and prep alerts for your admin account"
        action={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => readNotifications()}
              disabled={readState.isLoading || items.every((item) => item.isRead)}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-slate disabled:opacity-50"
            >
              Mark all read
            </button>
            <button
              type="button"
              onClick={() => deleteNotifications()}
              disabled={deleteState.isLoading || items.length === 0}
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Clear all
            </button>
          </div>
        }
      />
      <section className="overflow-hidden rounded-2xl bg-white">
        {isLoading ? (
          <p className="px-6 py-10 text-sm text-muted">Loading notifications…</p>
        ) : items.length === 0 ? (
          <p className="px-6 py-10 text-sm text-muted">No notifications yet.</p>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.id} className="border-t border-line-soft first:border-t-0">
                <Link
                  href={notificationHref(item)}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-[#faf8f5]"
                >
                  <span
                    className={`mt-2 size-2.5 shrink-0 rounded-full ${
                      item.isRead ? "bg-line" : "bg-brand"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{item.message}</p>
                      <span className="text-xs text-muted">{prettyDateTime(item.createdAt)}</span>
                    </div>
                    {item.description ? (
                      <p className="mt-1 text-sm text-muted">{item.description}</p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
