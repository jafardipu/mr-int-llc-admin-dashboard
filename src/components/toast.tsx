"use client";

import { useSyncExternalStore } from "react";

type Tone = "success" | "error";
type ToastItem = { id: number; tone: Tone; message: string };

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const EMPTY: ToastItem[] = [];

function emit() {
  listeners.forEach((listener) => listener());
}

function dismiss(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

function push(tone: Tone, message: string, duration: number) {
  const id = nextId++;
  items = [...items, { id, tone, message }];
  emit();
  window.setTimeout(() => dismiss(id), duration);
}

/** Call from anywhere on the client; rendered by the <Toaster /> in AdminShell. */
export const toast = {
  success: (message: string) => push("success", message, 4000),
  error: (message: string) => push("error", message, 6000),
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function Toaster() {
  const list = useSyncExternalStore(subscribe, () => items, () => EMPTY);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 right-6 z-[60] flex w-[min(380px,calc(100vw-48px))] flex-col gap-3"
    >
      {list.map((item) => (
        <div
          key={item.id}
          role={item.tone === "error" ? "alert" : "status"}
          className={`pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-[0_12px_40px_rgba(32,32,32,0.18)] ${
            item.tone === "success" ? "bg-ink" : "bg-danger"
          }`}
        >
          <span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.tone === "success" ? "bg-success" : "bg-white"}`} />
          <span className="flex-1">{item.message}</span>
          <button
            type="button"
            onClick={() => dismiss(item.id)}
            aria-label="Dismiss"
            className="text-lg leading-none text-white/70 hover:text-white"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
