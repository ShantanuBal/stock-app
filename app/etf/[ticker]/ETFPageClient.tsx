"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { TickerDetails } from "@/lib/tickerDetails";
import { useTheme } from "@/app/components/ThemeProvider";

const RANGES = ["1D", "3D", "1W", "1M", "3M", "6M", "1Y", "5Y", "YTD"] as const;
type Range = typeof RANGES[number];

interface ChartData {
  points: { date: string; close: number }[];
  changePercent: number;
  currentValue: number;
}

interface Props {
  ticker: string;
  details: TickerDetails | null;
  description: string | null;
  name: string | null;
}

function fmt(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label, color, isDark }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-lg border px-2.5 py-1.5 text-xs shadow-lg ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
      <p className={`mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{fmt(label)}</p>
      <p style={{ color }} className="font-semibold tabular-nums">${payload[0].value.toFixed(2)}</p>
    </div>
  );
}

export default function ETFPageClient({ ticker, details, description, name }: Props) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [range, setRange] = useState<Range>("1D");
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [beta, setBeta] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    setChartLoading(true);
    setChartData(null);
    fetch(`/api/stock-chart?ticker=${ticker}&range=${range}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setChartData(d))
      .finally(() => setChartLoading(false));
  }, [ticker, range]);

  useEffect(() => {
    fetch("/api/beta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tickers: [ticker] }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBeta(d?.betas?.[ticker] ?? null));
  }, [ticker]);

  const price = chartData?.currentValue ?? null;
  const changePercent = chartData?.changePercent ?? null;
  const isUp = (changePercent ?? 0) >= 0;
  const color = isUp ? "#10b981" : "#f87171";

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        ← Back
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{ticker}</h1>
              <span className="rounded-full border border-gray-200 dark:border-gray-700 px-2.5 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                ETF
              </span>
            </div>
            {name && <p className="text-base text-gray-500 dark:text-gray-400">{name}</p>}
          </div>
          {price != null && (
            <div className="text-right">
              <p className="text-3xl font-bold tabular-nums text-gray-900 dark:text-white">${price.toFixed(2)}</p>
              {changePercent != null && (
                <p className={`text-sm font-semibold mt-0.5 ${isUp ? "text-emerald-500" : "text-red-500"}`}>
                  {isUp ? "▲" : "▼"} {Math.abs(changePercent).toFixed(2)}%
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4 mb-5">
        {chartLoading ? (
          <div className="h-64 flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : chartData && chartData.points.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData.points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tickFormatter={fmt} tick={{ fill: isDark ? "#4b5563" : "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={["auto", "auto"]} tick={{ fill: isDark ? "#4b5563" : "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<ChartTooltip color={color} isDark={isDark} />} />
              <Area type="monotone" dataKey="close" stroke={color} strokeWidth={2} fill={`url(#grad-${ticker})`} dot={false} activeDot={{ r: 4, fill: color, stroke: "none" }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-sm text-gray-400 dark:text-gray-600">No chart data available</p>
          </div>
        )}

        {/* Range selector */}
        <div className="flex gap-0.5 pt-3">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 rounded py-1.5 text-xs font-medium transition-colors ${
                range === r
                  ? "bg-emerald-500 text-white"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Beta</p>
          <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
            {beta !== undefined ? (beta != null ? beta.toFixed(2) : "—") : (
              <span className="inline-block h-3 w-12 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            )}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4">
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{description}</p>
        )}
        <div className="flex gap-4">
          {details?.homepageUrl && (
            <a href={details.homepageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
              Website ↗
            </a>
          )}
          <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(name ?? ticker)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
            Wikipedia ↗
          </a>
        </div>
      </div>
    </div>
  );
}
