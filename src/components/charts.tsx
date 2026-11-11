"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { YearPicker } from "@/components/year-picker";
import { money } from "@/lib/format";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const BRAND = "#995618";
const BRAND_SOFT = "#e8d7b8";
const TRACK = "#f4ebde";
const INK = "#1f2937";
const MUTED = "#64748b";

function YearSelect({
  year,
  onYearChange,
}: {
  year: number;
  years?: number[];
  onYearChange: (year: number) => void;
}) {
  return <YearPicker year={year} onYearChange={onYearChange} />;
}

function ChartTooltip({
  active,
  payload,
  label,
  valuePrefix,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string | number;
  valuePrefix?: "money" | "count";
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-lg">
      {label != null ? <p className="mb-1 font-semibold text-ink">{label}</p> : null}
      {payload.map((entry) => (
        <p key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-slate">
          <i className="size-2 rounded-full" style={{ background: entry.color || BRAND }} />
          <span>{entry.name}</span>
          <strong className="text-ink">
            {valuePrefix === "count"
              ? new Intl.NumberFormat("en-US").format(entry.value ?? 0)
              : money(entry.value)}
          </strong>
        </p>
      ))}
    </div>
  );
}

export function DonutChart({
  retail,
  wholesale,
  title = "Order Breakdown",
}: {
  retail: number;
  wholesale: number;
  title?: string;
}) {
  const sum = retail + wholesale;
  const retailPct = sum ? Math.round((retail / sum) * 100) : 0;
  const wholesalePct = sum ? 100 - retailPct : 0;
  const data = [
    { name: "Retail", value: retail, color: BRAND },
    { name: "Wholesale", value: wholesale, color: BRAND_SOFT },
  ].filter((item) => item.value > 0);

  return (
    <div className="flex h-full flex-col justify-between">
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <div className="relative mx-auto my-2 h-[180px] w-full max-w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.length ? data : [{ name: "Empty", value: 1, color: TRACK }]}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={70}
              paddingAngle={data.length > 1 ? 3 : 0}
              stroke="none"
            >
              {(data.length ? data : [{ name: "Empty", value: 1, color: TRACK }]).map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            {sum > 0 ? (
              <Tooltip content={<ChartTooltip valuePrefix="count" />} />
            ) : null}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink">{sum ? `${retailPct}%` : "0%"}</span>
          <span className="text-xs text-muted">Retail share</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-slate">
          <i className="size-2.5 rounded-sm bg-brand" /> Retail
        </span>
        <span className="font-semibold text-ink">
          {retailPct}% · {new Intl.NumberFormat("en-US").format(retail)}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-slate">
          <i className="size-2.5 rounded-sm bg-[#e8d7b8]" /> Wholesale
        </span>
        <span className="font-semibold text-ink">
          {wholesalePct}% · {new Intl.NumberFormat("en-US").format(wholesale)}
        </span>
      </div>
    </div>
  );
}

export function SalesLine({
  data,
  year,
  years,
  onYearChange,
}: {
  data: { month: number; retail: number; wholesale: number }[];
  year?: number;
  years?: number[];
  onYearChange?: (year: number) => void;
}) {
  const chartData = MONTHS.map((label, index) => {
    const point = data.find((item) => item.month === index + 1);
    return {
      name: label,
      Retail: point?.retail ?? 0,
      Wholesale: point?.wholesale ?? 0,
    };
  });

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink">Sales Overview</h3>
          <p className="text-sm text-muted">Monthly retail vs wholesale</p>
        </div>
        {year && years && onYearChange ? (
          <YearSelect year={year} years={years} onYearChange={onYearChange} />
        ) : null}
      </div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={TRACK} strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: MUTED, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: MUTED, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(value) =>
                new Intl.NumberFormat("en-US", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(Number(value))
              }
            />
            <Tooltip content={<ChartTooltip valuePrefix="money" />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: 12, color: MUTED, paddingBottom: 8 }}
            />
            <Line
              type="monotone"
              dataKey="Retail"
              stroke={BRAND}
              strokeWidth={3}
              dot={{ r: 3, fill: BRAND }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="Wholesale"
              stroke={BRAND_SOFT}
              strokeWidth={3}
              dot={{ r: 3, fill: BRAND_SOFT }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CategoryBars({
  data,
}: {
  data: { name: string; revenue: number; percent: number }[];
}) {
  const chartData = (data.length
    ? data
    : [{ name: "No paid category sales yet", revenue: 0, percent: 0 }]
  ).map((item) => ({
    name: item.name,
    Revenue: item.revenue,
    percent: item.percent,
  }));

  return (
    <div>
      <div className="mb-5 flex items-start justify-between">
        <h3 className="text-lg font-bold text-ink">Sales by Category</h3>
        <span className="text-xs text-muted">Performance</span>
      </div>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          >
            <CartesianGrid stroke={TRACK} strokeDasharray="4 4" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: MUTED, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) =>
                new Intl.NumberFormat("en-US", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(Number(value))
              }
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fill: INK, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip valuePrefix="money" />} />
            <Bar dataKey="Revenue" fill={BRAND} radius={[0, 8, 8, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function RevenueBars({
  data,
  year,
  years,
  onYearChange,
}: {
  data: { month: number; revenue: number }[];
  year: number;
  years: number[];
  onYearChange: (year: number) => void;
}) {
  const chartData = MONTHS.map((label, index) => {
    const point = data.find((item) => item.month === index + 1);
    return {
      name: label,
      Revenue: point?.revenue ?? 0,
    };
  });
  const peak = chartData.reduce(
    (best, item) => (item.Revenue > best.Revenue ? item : best),
    chartData[0] ?? { name: "JAN", Revenue: 0 },
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink">Revenue Overview</h3>
          <p className="text-sm text-muted">
            Yearly analysis · Peak {peak.name}: {money(peak.Revenue)}
          </p>
        </div>
        <YearSelect year={year} years={years} onYearChange={onYearChange} />
      </div>
      <div className="h-[240px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={TRACK} strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: MUTED, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: MUTED, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(value) =>
                new Intl.NumberFormat("en-US", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(Number(value))
              }
            />
            <Tooltip content={<ChartTooltip valuePrefix="money" />} />
            <Bar dataKey="Revenue" radius={[8, 8, 0, 0]} barSize={28}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.name === peak.name && peak.Revenue > 0 ? BRAND : BRAND_SOFT}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
