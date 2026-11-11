"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  IconBan,
  IconEdit,
  IconEye,
  IconTrash,
  IconUnlock,
} from "@/components/icons";

const toneClass = {
  slate: "text-slate hover:bg-[#f4ebde] hover:text-brand",
  danger: "text-danger hover:bg-[#fde8e8]",
  success: "text-success hover:bg-[#e8f6ee]",
} as const;

function actionClass(tone: keyof typeof toneClass = "slate") {
  return `inline-flex size-9 items-center justify-center rounded-full transition ${toneClass[tone]}`;
}

export function TableActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-1">{children}</div>;
}

export function ViewAction({ href }: { href: string }) {
  return (
    <Link href={href} aria-label="View" title="View" className={actionClass()}>
      <IconEye className="size-4" />
    </Link>
  );
}

export function EditAction({
  href,
  onClick,
}: {
  href?: string;
  onClick?: () => void;
}) {
  if (onClick) {
    return (
      <button
        type="button"
        aria-label="Edit"
        title="Edit"
        onClick={onClick}
        className={actionClass()}
      >
        <IconEdit className="size-4" />
      </button>
    );
  }
  return (
    <Link href={href || "#"} aria-label="Edit" title="Edit" className={actionClass()}>
      <IconEdit className="size-4" />
    </Link>
  );
}

export function DeleteAction({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Delete"
      title="Delete"
      onClick={onClick}
      className={actionClass("danger")}
    >
      <IconTrash className="size-4" />
    </button>
  );
}

export function BlockAction({
  blocked,
  onClick,
}: {
  blocked: boolean;
  onClick: () => void;
}) {
  const label = blocked ? "Unsuspend" : "Suspend";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={actionClass(blocked ? "success" : "danger")}
    >
      {blocked ? <IconUnlock className="size-4" /> : <IconBan className="size-4" />}
    </button>
  );
}
