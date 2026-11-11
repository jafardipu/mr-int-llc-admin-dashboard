import { IconSearch } from "./icons";

export function TableCard({
  title,
  action,
  search,
  onSearch,
  children,
  footer,
}: {
  title?: string;
  action?: React.ReactNode;
  search?: string;
  onSearch?: (value: string) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {(title || action || onSearch) && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          {title ? <h2 className="text-lg font-bold text-ink">{title}</h2> : <div />}
          <div className="flex flex-wrap items-center gap-3">
            {onSearch ? (
              <label className="relative">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  value={search}
                  onChange={(event) => onSearch(event.target.value)}
                  placeholder="Search"
                  className="h-10 rounded-xl border border-line bg-input pl-9 pr-3 text-sm outline-none placeholder:text-muted focus:border-brand"
                />
              </label>
            ) : null}
            {action}
          </div>
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
      {footer ? <div className="border-t border-line-soft px-6 py-4">{footer}</div> : null}
    </section>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return <table className="w-full min-w-[720px] text-left text-sm">{children}</table>;
}

export function THead({ columns }: { columns: string[] }) {
  return (
    <thead className="bg-[#fcfaf6] text-xs uppercase tracking-wide text-muted">
      <tr>
        {columns.map((column) => (
          <th key={column} className="px-6 py-3 font-semibold">
            {column}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function Pagination({
  page,
  total,
  limit,
  onPage,
}: {
  page: number;
  total: number;
  limit: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
      <p>
        Showing {from} to {to} of {total} results
      </p>
      <div className="flex items-center gap-1">
        {Array.from({ length: pages }, (_, index) => index + 1)
          .slice(0, 7)
          .map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onPage(item)}
              className={`size-8 rounded-lg text-sm ${
                item === page ? "bg-brand text-white" : "text-slate hover:bg-input"
              }`}
            >
              {item}
            </button>
          ))}
      </div>
    </div>
  );
}
