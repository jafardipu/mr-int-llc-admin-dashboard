import { wholesaleFeeState } from "@/lib/pricing";
import type { AdminUser } from "@/lib/types";

const toneClass = {
  success: "text-success",
  warning: "text-warning",
  muted: "text-muted",
} as const;

/** "Paid $20.00 on Nov 25, 2026" / "Unpaid" / "Not required" for wholesale users; "—" otherwise. */
export function WholesaleFeeStatus({ user }: { user: Pick<AdminUser, "role" | "wholesaleFee"> }) {
  const state = wholesaleFeeState(user);
  if (!state) return <span className="text-muted">—</span>;
  return <span className={`font-medium ${toneClass[state.tone]}`}>{state.label}</span>;
}
