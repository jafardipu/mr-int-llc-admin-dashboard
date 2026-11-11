export function PageHeader({
  title,
  description,
  action,
  back,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  back?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back}
        <h1 className="text-[28px] font-bold tracking-tight text-ink">{title}</h1>
        {description ? (
          <div className="mt-1 text-sm text-muted">{description}</div>
        ) : null}
      </div>
      {action}
    </div>
  );
}
