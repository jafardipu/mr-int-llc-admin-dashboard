"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { notificationHref, timeAgo } from "@/lib/format";
import type { NotificationRecord } from "@/lib/types";
import {
  asList,
  useGetNotificationsQuery,
  useReadNotificationsMutation,
} from "@/store/api";
import { IconBell } from "./icons";

export function NotificationMenu() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { data, refetch } = useGetNotificationsQuery(undefined, {
    pollingInterval: 30000,
  });
  const [readNotifications] = useReadNotificationsMutation();
  const items = asList<NotificationRecord>(data?.data).items;
  const unread = items.filter((item) => !item.isRead).length;

  useEffect(() => {
    if (!open) return;

    function onDocumentClick(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const timer = window.setTimeout(() => {
      document.addEventListener("click", onDocumentClick);
      document.addEventListener("keydown", onKeyDown);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      await refetch();
    }
  }

  async function markAllRead() {
    if (unread === 0) return;
    await readNotifications().unwrap().catch(() => undefined);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="relative flex size-10 items-center justify-center rounded-full bg-white text-slate shadow-sm"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <IconBell className="size-5" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-3 w-[360px] overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(32,32,32,0.12)]">
          <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
            <div>
              <p className="text-sm font-bold text-ink">Notifications</p>
              <p className="text-xs text-muted">
                {unread > 0 ? `${unread} unread` : "You're all caught up"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {unread > 0 ? (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-semibold text-slate hover:text-brand"
                >
                  Mark read
                </button>
              ) : null}
              <Link href="/notifications" className="text-xs font-semibold text-brand">
                View all
              </Link>
            </div>
          </div>
          <ul className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-5 py-10 text-center text-sm text-muted">
                No notifications yet
              </li>
            ) : (
              items.slice(0, 8).map((item) => (
                <li key={item.id} className="border-t border-line-soft first:border-t-0">
                  <Link href={notificationHref(item)} className="block px-5 py-3.5 hover:bg-[#faf8f5]">
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${
                          item.isRead ? "bg-line" : "bg-brand"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-ink">{item.message}</p>
                          <span className="shrink-0 text-[11px] text-muted">
                            {timeAgo(item.createdAt)}
                          </span>
                        </div>
                        {item.description ? (
                          <p className="mt-1 line-clamp-2 text-xs text-muted">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
