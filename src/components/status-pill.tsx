const styles: Record<string, string> = {
  completed: "bg-success-bg text-success",
  delivered: "bg-success-bg text-success",
  paid: "bg-success-bg text-success",
  active: "bg-success-bg text-success",
  processing: "bg-warning-bg text-warning",
  pending: "bg-warning-bg text-warning",
  replied: "bg-success-bg text-success",
  under_review: "bg-warning-bg text-warning",
  shipped: "bg-[#e0f2fe] text-[#0369a1]",
  correction_required: "bg-[#fff4e5] text-[#c2410c]",
  cancelled: "bg-danger-bg text-danger",
  blocked: "bg-[#ffe4e6] text-[#e11d48]",
  suspended: "bg-[#ffe4e6] text-[#e11d48]",
  failed: "bg-danger-bg text-danger",
  inactive: "bg-[#f1f5f9] text-slate",
  refunded: "bg-[#f1f5f9] text-slate",
};

const labels: Record<string, string> = {
  blocked: "Suspended",
  completed: "Delivered",
  under_review: "Under Review",
  correction_required: "Correction Required",
};

export function StatusPill({ value }: { value?: string | null }) {
  const key = (value ?? "pending").toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        styles[key] ?? "bg-[#f1f5f9] text-slate"
      }`}
    >
      {labels[key] ?? key.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())}
    </span>
  );
}
