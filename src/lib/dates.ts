/** Helpers for `<input type="date">` values (`YYYY-MM-DD`). Plain string comparison orders them correctly. */

/** Today in the admin's own calendar, used for "can't be before today" rules and `min` attributes. */
export function todayInput(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** A stored ISO date-time → its `YYYY-MM-DD` (UTC, the zone dates are saved in). */
export function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

/** `YYYY-MM-DD` shifted by whole days. */
export function addDays(dateInput: string, days: number) {
  const date = new Date(`${dateInput}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
