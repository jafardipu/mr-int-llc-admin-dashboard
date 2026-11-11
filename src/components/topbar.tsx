"use client";

import { prettyDate } from "@/lib/format";
import { IconCalendar } from "./icons";
import { NotificationMenu } from "./notification-menu";
import { ProfileMenu } from "./profile-menu";

export function Topbar() {
  return (
    <header className="flex items-center justify-end gap-5 px-8 py-5">
      <NotificationMenu />
      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate shadow-sm">
        <IconCalendar className="size-4" />
        {prettyDate(new Date())}
      </div>
      <ProfileMenu />
    </header>
  );
}
