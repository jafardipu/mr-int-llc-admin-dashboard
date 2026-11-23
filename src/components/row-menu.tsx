"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { IconDots } from "./icons";

export type RowMenuItem = {
  label: string;
  onSelect: () => void;
  tone?: "default" | "danger";
};

/**
 * "⋯" button with a dropdown of actions. The menu is portalled and fixed-positioned so the
 * table's overflow container doesn't clip it.
 */
export function RowMenu({ items, label = "More actions" }: { items: RowMenuItem[]; label?: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CSSProperties | null>(null);
  const open = position !== null;

  function toggle() {
    if (open) {
      setPosition(null);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const right = window.innerWidth - rect.right;
    const openUp = rect.bottom + 160 > window.innerHeight;
    setPosition(
      openUp ? { right, bottom: window.innerHeight - rect.top + 6 } : { right, top: rect.bottom + 6 },
    );
  }

  useEffect(() => {
    if (!open) return;
    const close = () => setPosition(null);

    function onMouseDown(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      close();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      close();
      buttonRef.current?.focus();
    }

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="inline-flex size-9 items-center justify-center rounded-full text-slate transition hover:bg-[#f4ebde] hover:text-brand"
      >
        <IconDots className="size-4" />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={position}
              className="fixed z-40 min-w-48 rounded-xl border border-line bg-white p-1.5 shadow-[0_12px_40px_rgba(32,32,32,0.12)]"
            >
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPosition(null);
                    item.onSelect();
                  }}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-input ${
                    item.tone === "danger" ? "text-danger" : "text-ink"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
