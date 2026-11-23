"use client";

import { useState } from "react";
import { IconDownload } from "@/components/icons";
import { toast } from "@/components/toast";
import type { OrderRecord } from "@/lib/types";
import { toInvoiceOrder } from "./invoice-order";

// Small copy of the brand logo sized for the PDF (public/images/logo.png is ~800 KB).
const LOGO_PATH = "/images/invoice-logo.png";

function invoiceFileName(orderNumber: string) {
  const safe = orderNumber.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
  return `invoice-${safe || "order"}.pdf`;
}

export default function DownloadInvoiceButton({ order }: { order: OrderRecord }) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleDownload() {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      // Loaded on click so the PDF renderer stays out of the page bundle.
      const { createInvoicePdf } = await import("./invoice-pdf");
      const blob = await createInvoicePdf(toInvoiceOrder(order), {
        logoUrl: new URL(LOGO_PATH, window.location.href).href,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = invoiceFileName(order.orderNumber);
      document.body.append(link);
      link.click();
      link.remove();
      // Give the browser time to start the download before releasing it.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      console.error("Failed to generate invoice PDF", error);
      toast.error("Could not create the invoice. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isGenerating}
      aria-busy={isGenerating}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-semibold text-slate transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-70"
    >
      {isGenerating ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        <IconDownload className="size-4" aria-hidden="true" />
      )}
      {isGenerating ? "Preparing PDF…" : "Download Invoice"}
    </button>
  );
}
