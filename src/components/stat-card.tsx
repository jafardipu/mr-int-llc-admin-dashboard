export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-white px-5 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 text-[28px] font-bold tracking-tight text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
