"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useTheme } from "./ThemeProvider";

export interface ChartData {
  points: { date: string; close: number }[];
  changePercent: number;
  currentValue: number;
}

interface Props {
  data: ChartData | null;
  label: string;
  loading: boolean;
  onClick?: () => void;
  gradientId?: string;
}

function fmtAxisDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtValue(v: number): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtYAxis(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v.toFixed(0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, color, isDark }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs shadow-lg ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
      <p className={`mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{fmtAxisDate(label)}</p>
      <p style={{ color }} className="font-semibold">
        {fmtValue(payload[0].value)}
      </p>
    </div>
  );
}

export default function IndexChart({ data, label, loading, onClick, gradientId = "indexGrad" }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const tickColor = isDark ? "#4b5563" : "#9ca3af";
  const gridColor = isDark ? "#1f2937" : "#e5e7eb";

  if (loading) {
    return <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900/50 h-56 animate-pulse mb-6" />;
  }

  if (!data || data.points.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900/50 p-6 mb-6 flex flex-col items-center justify-center h-56 gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xs text-gray-400 dark:text-gray-600">No chart data available for this period</p>
      </div>
    );
  }

  const { points, changePercent, currentValue } = data;
  const isUp = changePercent >= 0;
  const color = isUp ? "#10b981" : "#f87171";

  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 mb-6 ${onClick ? "cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors group" : ""}`}
      onClick={onClick}
    >
      {/* Summary header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{fmtValue(currentValue)}</p>
        </div>
        <div className="flex items-center gap-2">
        {onClick && (
          <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        )}
        <span
          className={`mt-1 text-sm font-semibold px-3 py-1.5 rounded-full ${
            isUp ? "bg-emerald-400/10 text-emerald-600 dark:text-emerald-400" : "bg-red-400/10 text-red-600 dark:text-red-400"
          }`}
        >
          {isUp ? "▲" : "▼"} {Math.abs(changePercent).toFixed(2)}%
        </span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmtAxisDate}
            tick={{ fill: tickColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: tickColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmtYAxis}
            width={48}
          />
          <Tooltip content={<CustomTooltip color={color} isDark={isDark} />} />
          <Area
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: "none" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
