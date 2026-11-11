"use client";

import Link from "next/link";
import { IconSearch } from "./icons";

export function FilterTabs({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (value: string) => void;
  items: { id: string; label: string; count?: number }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              active ? "bg-brand text-white" : "bg-white text-slate"
            }`}
          >
            {item.label}
            {item.count !== undefined ? ` (${item.count})` : ""}
          </button>
        );
      })}
    </div>
  );
}

export function TypeChip({ value }: { value?: string | null }) {
  return (
    <span className="inline-flex rounded-full bg-[#f4ebde] px-3 py-1 text-xs font-semibold capitalize text-[#7d4513]">
      {value || "—"}
    </span>
  );
}

export function Toolbar({
  search,
  onSearch,
  placeholder = "Search...",
  children,
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <label className="relative min-w-[240px] flex-1">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm outline-none placeholder:text-muted focus:border-brand"
        />
      </label>
      {children}
    </div>
  );
}

export function Modal({
  title,
  description,
  open,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="text-xl text-muted" aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="mb-3 inline-flex items-center gap-2 text-sm text-muted hover:text-brand">
      ← {children}
    </Link>
  );
}

export function InfoCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-white px-5 py-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
