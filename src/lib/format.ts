export function money(value?: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export function compactNumber(value?: number | null) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

export function prettyDate(value?: string | Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function prettyDateTime(value?: string | Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function timeAgo(value?: string | Date | null) {
  if (!value) return "—";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function titleCase(value?: string | null) {
  if (!value) return "—";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function initials(name?: string | null) {
  if (!name) return "MR";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function mediaUrl(url?: string | null, fallback = "/images/avatar-admin.png") {
  if (!url) return fallback;
  try {
    const parsed = new URL(url, "http://local.invalid");
    if (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") {
      return `/api/media${parsed.pathname}`;
    }
  } catch {
    return url;
  }
  return url;
}

export function notificationHref(item: { orderId?: string | null; message?: string | null }) {
  if (item.orderId) return `/orders/${item.orderId}`;
  if (/prep/i.test(item.message ?? "")) return "/prep-requests";
  return "/notifications";
}
