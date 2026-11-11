"use client";

import Image from "next/image";
import Link from "next/link";
import { mediaUrl } from "@/lib/format";
import { useAppSelector } from "@/store/hooks";

export function ProfileMenu() {
  const user = useAppSelector((state) => state.auth.user);
  const roleLabel = user?.role === "supper_admin" ? "SUPER ADMIN" : "ADMIN";

  return (
    <Link
      href="/settings/profile"
      className="flex items-center gap-3 rounded-full py-1 pl-2 pr-1 hover:bg-white/70"
      aria-label="Open profile settings"
    >
      <div className="text-right">
        <p className="text-sm font-semibold text-ink">{user?.name || "Mitchell"}</p>
        <p className="text-[11px] uppercase tracking-wide text-muted">{roleLabel}</p>
      </div>
      <Image
        src={mediaUrl(user?.profile)}
        alt={user?.name || "Profile"}
        width={40}
        height={40}
        className="size-10 rounded-full object-cover"
        unoptimized={Boolean(user?.profile)}
      />
    </Link>
  );
}
