"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useTheme } from "./ThemeProvider";
import type { ChartData } from "./IndexChart";

const RANGES = ["1D", "3D", "1W", "1M", "3M", "6M", "1Y", "YTD"] as const;
type Range = typeof RANGES[number];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  label: string;
  index: string;
  initialRange: string;
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
      <p style={{ color }} className="font-semibold">{fmtValue(payload[0].value)}</p>
    </div>
  );
}

export default function IndexChartModal({ isOpen, onClose, label, index, initialRange }: Props) {
  const [range, setRange] = useState<Range>((initialRange as Range) ?? "1W");
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const fetchData = useCallback((r: Range) => {
    setLoading(true);
    setData(null);
    fetch(`/api/index-chart?range=${r}&index=${index}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [index]);

  useEffect(() => {
    if (isOpen) fetchData(range);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, range]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isUp = (data?.changePercent ?? 0) >= 0;
  const color = isUp ? "#10b981" : "#f87171";
  const tickColor = isDark ? "#4b5563" : "#9ca3af";
  const gridColor = isDark ? "#1f2937" : "#e5e7eb";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{label}</p>
            {data && (
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                  {fmtValue(data.currentValue)}
                </p>
                <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${isUp ? "bg-emerald-400/10 text-emerald-600 dark:text-emerald-400" : "bg-red-400/10 text-red-600 dark:text-red-400"}`}>
                  {isUp ? "▲" : "▼"} {Math.abs(data.changePercent).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Range tabs */}
        <div className="flex gap-0.5 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                range === r
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Chart */}
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : data && data.points.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data.points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="modalIndexGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtAxisDate} tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={["auto", "auto"]} tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtYAxis} width={48} />
              <Tooltip content={<CustomTooltip color={color} isDark={isDark} />} />
              <Area type="monotone" dataKey="close" stroke={color} strokeWidth={2} fill="url(#modalIndexGrad)" dot={false} activeDot={{ r: 4, fill: color, stroke: "none" }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <p className="text-sm text-gray-400 dark:text-gray-600">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
