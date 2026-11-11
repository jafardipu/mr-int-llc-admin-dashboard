import { money, prettyDateTime, titleCase } from "@/lib/format";
import type { OrderRecord } from "@/lib/types";

function escapeHtml(value?: string | number | null) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatAddress(order: OrderRecord) {
  const address = order.address;
  if (!address) return "—";
  return [
    address.addressLine1,
    address.addressLine2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    address.country,
  ]
    .filter(Boolean)
    .map((line) => escapeHtml(line))
    .join("<br />");
}

export function buildInvoiceHtml(order: OrderRecord) {
  const logoUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/images/logo.png`
      : "/images/logo.png";
  const subtotal =
    order.subtotal ??
    order.items?.reduce((sum, item) => sum + item.total, 0) ??
    0;
  const itemRows = (order.items ?? [])
    .map(
      (item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>
          <strong>${escapeHtml(item.name)}</strong>
          <div class="muted">SKU: ${escapeHtml(item.sku)}</div>
        </td>
        <td class="center">${escapeHtml(item.quantity)}</td>
        <td class="right">${escapeHtml(money(item.unitPrice))}</td>
        <td class="right"><strong>${escapeHtml(money(item.total))}</strong></td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${escapeHtml(order.orderNumber)}</title>
  <style>
    :root {
      --brand: #0b607e;
      --brand-deep: #08485f;
      --ink: #132833;
      --muted: #5f7580;
      --line: #d7e5eb;
      --soft: #f3f8fb;
      --accent: #c9782a;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      background: #e8eef1;
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.5;
    }
    .sheet {
      width: min(900px, 100%);
      margin: 24px auto;
      background: #fff;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 18px 40px rgba(8, 72, 95, 0.12);
    }
    .toolbar {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 18px;
      background: var(--soft);
      border-bottom: 1px solid var(--line);
    }
    .toolbar button {
      border: 0;
      border-radius: 999px;
      padding: 10px 16px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-print { background: var(--brand); color: #fff; }
    .btn-close { background: #fff; border: 1px solid var(--line) !important; color: var(--ink); }
    .hero {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      padding: 28px 32px 22px;
      background: linear-gradient(135deg, var(--brand-deep), var(--brand));
      color: #fff;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand img {
      width: 64px;
      height: 64px;
      object-fit: contain;
      background: #fff;
      border-radius: 14px;
      padding: 6px;
    }
    .brand h1 {
      margin: 0;
      font-size: 1.45rem;
      letter-spacing: -0.02em;
    }
    .brand p { margin: 4px 0 0; opacity: 0.9; font-size: 0.92rem; }
    .invoice-meta { text-align: right; }
    .invoice-meta .label {
      font-size: 0.75rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      opacity: 0.8;
    }
    .invoice-meta .number {
      margin: 4px 0 8px;
      font-size: 1.65rem;
      font-weight: 800;
    }
    .content { padding: 28px 32px 36px; }
    .grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 18px;
      margin-bottom: 26px;
    }
    .card {
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 16px 18px;
      background: var(--soft);
    }
    .card h3 {
      margin: 0 0 10px;
      font-size: 0.78rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--brand);
    }
    .card p { margin: 0 0 6px; }
    .muted { color: var(--muted); font-size: 0.9rem; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    thead th {
      background: var(--brand);
      color: #fff;
      font-size: 0.82rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      text-align: left;
      padding: 12px 14px;
    }
    thead th:first-child { border-radius: 10px 0 0 0; }
    thead th:last-child { border-radius: 0 10px 0 0; }
    tbody td {
      padding: 14px;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
      font-size: 0.95rem;
    }
    tbody tr:nth-child(even) { background: #fafcfd; }
    .center { text-align: center; }
    .right { text-align: right; }
    .totals {
      margin-top: 18px;
      margin-left: auto;
      width: min(320px, 100%);
      border: 1px solid var(--line);
      border-radius: 14px;
      overflow: hidden;
    }
    .totals .row {
      display: flex;
      justify-content: space-between;
      padding: 10px 14px;
      border-bottom: 1px solid var(--line);
      font-size: 0.95rem;
    }
    .totals .row:last-child { border-bottom: 0; }
    .totals .grand {
      background: var(--brand);
      color: #fff;
      font-weight: 800;
      font-size: 1.05rem;
    }
    .footer {
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px dashed var(--line);
      display: flex;
      justify-content: space-between;
      gap: 16px;
      color: var(--muted);
      font-size: 0.88rem;
    }
    .badge {
      display: inline-block;
      margin-top: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(201, 120, 42, 0.15);
      color: var(--accent);
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    @media print {
      body { background: #fff; }
      .sheet {
        margin: 0;
        width: 100%;
        border-radius: 0;
        box-shadow: none;
      }
      .toolbar { display: none !important; }
      @page { margin: 12mm; }
    }
    @media (max-width: 720px) {
      .hero, .grid { grid-template-columns: 1fr; display: grid; }
      .invoice-meta { text-align: left; }
      .content, .hero { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="toolbar">
      <button class="btn-print" type="button" onclick="window.print()">Print / Save PDF</button>
      <button class="btn-close" type="button" onclick="window.close()">Close</button>
    </div>
    <header class="hero">
      <div class="brand">
        <img src="${escapeHtml(logoUrl)}" alt="MR International LLC logo" />
        <div>
          <h1>MR International LLC</h1>
          <p>Retail &amp; Wholesale Ecommerce</p>
          <p class="muted" style="color:rgba(255,255,255,.85)">support · admin@gmail.com</p>
        </div>
      </div>
      <div class="invoice-meta">
        <div class="label">Invoice</div>
        <div class="number">#${escapeHtml(order.orderNumber)}</div>
        <div>${escapeHtml(prettyDateTime(order.createdAt))}</div>
        <span class="badge">${escapeHtml(titleCase(order.status))}</span>
      </div>
    </header>
    <div class="content">
      <div class="grid">
        <section class="card">
          <h3>Bill To</h3>
          <p><strong>${escapeHtml(order.user?.name || "Customer")}</strong></p>
          <p class="muted">${escapeHtml(order.user?.email || "—")}</p>
          <p class="muted">${escapeHtml(order.user?.phoneNumber || "No phone on file")}</p>
          <p class="muted">Type: ${escapeHtml(titleCase(order.customerType || "retail"))}</p>
        </section>
        <section class="card">
          <h3>Ship To / Order Info</h3>
          <p>${formatAddress(order)}</p>
          <p class="muted" style="margin-top:10px">
            Payment: ${escapeHtml(order.payment?.paymentMethod || "—")}
            · ${escapeHtml(titleCase(String(order.payment?.status || "pending")))}
          </p>
          ${
            order.payment?.transactionId
              ? `<p class="muted">Txn: ${escapeHtml(order.payment.transactionId)}</p>`
              : ""
          }
        </section>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:48px">#</th>
            <th>Product</th>
            <th class="center" style="width:90px">Qty</th>
            <th class="right" style="width:120px">Unit</th>
            <th class="right" style="width:130px">Total</th>
          </tr>
        </thead>
        <tbody>
          ${
            itemRows ||
            `<tr><td colspan="5" class="center muted">No items on this order.</td></tr>`
          }
        </tbody>
      </table>

      <div class="totals">
        <div class="row"><span>Subtotal</span><span>${escapeHtml(money(subtotal))}</span></div>
        <div class="row"><span>Discount</span><span>-${escapeHtml(money(order.discount))}</span></div>
        <div class="row"><span>Shipping</span><span>${escapeHtml(money(order.shippingFee))}</span></div>
        <div class="row"><span>Tax</span><span>${escapeHtml(money(order.tax))}</span></div>
        <div class="row grand"><span>Total Due</span><span>${escapeHtml(money(order.total))}</span></div>
      </div>

      <div class="footer">
        <div>
          Thank you for your business.<br />
          This invoice was generated from the MR International LLC admin dashboard.
        </div>
        <div style="text-align:right">
          Questions?<br />
          admin@gmail.com
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function downloadOrderInvoice(order: OrderRecord) {
  const html = buildInvoiceHtml(order);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `invoice-${order.orderNumber}.html`;
  link.click();

  const printWindow = window.open(url, "_blank", "noopener,noreferrer,width=960,height=900");
  if (printWindow) {
    const triggerPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch {
        /* ignore print blockers */
      }
    };
    printWindow.addEventListener("load", () => {
      setTimeout(triggerPrint, 250);
    });
    setTimeout(triggerPrint, 700);
  }

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
