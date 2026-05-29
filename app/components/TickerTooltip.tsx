"use client";

import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { TickerDetails } from "@/lib/tickerDetails";
import { useTheme } from "./ThemeProvider";

const RANGES = ["1D", "3D", "1W", "1M", "3M", "6M", "1Y", "5Y", "YTD"] as const;
type Range = typeof RANGES[number];

interface ChartData {
  points: { date: string; close: number }[];
  changePercent: number;
  currentValue: number;
}

interface Props {
  ticker: string;
  name?: string;
  price?: number;
  changePercent?: number;
  initialRange?: string;
  description?: string;
}

export interface TickerTooltipHandle {
  show(): void;
  hide(): void;
}

const TOOLTIP_WIDTH = 900;

function fmtDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label, color, isDark }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-lg border px-2.5 py-1.5 text-xs shadow-lg ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
      <p className={`mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{fmtDate(label)}</p>
      <p style={{ color }} className="font-semibold tabular-nums">${payload[0].value.toFixed(2)}</p>
    </div>
  );
}

const TickerTooltip = forwardRef<TickerTooltipHandle, Props>(function TickerTooltip(
  { ticker, name, price, changePercent, initialRange, description }: Props,
  forwardedRef,
) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [details, setDetails] = useState<TickerDetails | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [range, setRange] = useState<Range>((initialRange as Range) ?? "1D");
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFetchedDetails = useRef(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const fetchChart = useCallback((r: Range) => {
    setChartLoading(true);
    setChartData(null);
    fetch(`/api/stock-chart?ticker=${ticker}&range=${r}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setChartData(d))
      .finally(() => setChartLoading(false));
  }, [ticker]);

  useEffect(() => {
    if (rect) fetchChart(range);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, rect !== null]);

  useImperativeHandle(forwardedRef, () => ({ show, hide }));

  useEffect(() => {
    if (!rect) return;
    const handler = (e: MouseEvent) => {
      if (tooltipRef.current?.contains(e.target as Node)) return;
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setRect(null);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [rect]);

  function show() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setRect(spanRef.current?.getBoundingClientRect() ?? null);
    if (!hasFetchedDetails.current) {
      hasFetchedDetails.current = true;
      fetch(`/api/ticker-details?ticker=${ticker}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setDetails(d));
    }
  }

  function hide() {
    hideTimer.current = setTimeout(() => setRect(null), 150);
  }

  const isUp = (chartData?.changePercent ?? changePercent ?? 0) >= 0;
  const color = isUp ? "#10b981" : "#f87171";
  const displayChange = chartData?.changePercent ?? changePercent;
  const displayPrice = chartData?.currentValue ?? price;

  const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const isDesktop = screenWidth >= 768;
  const effectiveWidth = Math.min(TOOLTIP_WIDTH, screenWidth - 32);
  const tooltipLeft = rect
    ? isDesktop
      ? Math.min(Math.round(screenWidth * 0.37), screenWidth - effectiveWidth - 8)
      : Math.max(8, Math.min(rect.left, screenWidth - effectiveWidth - 8))
    : 0;
  const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  const tooltipTop = rect ? Math.max(8, Math.round((windowHeight - 580) / 2)) : 0;

  return (
    <>
      <span
        ref={spanRef}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          if (rect) {
            if (hideTimer.current) clearTimeout(hideTimer.current);
            setRect(null);
          } else {
            show();
          }
        }}
      >
        {ticker}
      </span>
      {rect && (
        <div
          ref={tooltipRef}
          className="fixed z-50 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl font-normal normal-case tracking-normal font-[family-name:var(--font-inter)] overflow-hidden"
          style={{ top: tooltipTop, left: tooltipLeft, width: effectiveWidth }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{ticker}</span>
                {name && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{name}</span>}
              </div>
              {displayPrice != null && (
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">${displayPrice.toFixed(2)}</p>
                  {displayChange != null && (
                    <p className={`text-xs font-semibold ${isUp ? "text-emerald-500" : "text-red-500"}`}>
                      {isUp ? "▲" : "▼"} {Math.abs(displayChange).toFixed(2)}%
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chart */}
          <div className="px-2 pt-3">
            {chartLoading ? (
              <div className="h-72 flex items-center justify-center">
                <svg className="animate-spin h-4 w-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : chartData && chartData.points.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData.points} margin={{ top: 2, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: isDark ? "#4b5563" : "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={["auto", "auto"]} tick={{ fill: isDark ? "#4b5563" : "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<ChartTooltip color={color} isDark={isDark} />} />
                  <Area type="monotone" dataKey="close" stroke={color} strokeWidth={1.5} fill={`url(#grad-${ticker})`} dot={false} activeDot={{ r: 3, fill: color, stroke: "none" }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center">
                <p className="text-xs text-gray-400 dark:text-gray-600">No chart data available</p>
              </div>
            )}
          </div>

          {/* Range selector */}
          <div className="flex gap-0.5 px-3 pb-3 pt-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`flex-1 rounded py-1 text-xs font-medium transition-colors ${
                  range === r
                    ? "bg-emerald-500 text-white"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Description + links */}
          <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
            {details || description ? (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2 max-h-32 overflow-y-auto scrollbar-hide">
                  {details?.description || description}
                </p>
                <div className="flex gap-4">
                  {details?.homepageUrl && (
                    <a href={details.homepageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
                      Website ↗
                    </a>
                  )}
                  <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(details?.name ?? name ?? ticker)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
                    Wikipedia ↗
                  </a>
                </div>
              </>
            ) : (
              <div className="h-4 w-3/4 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            )}
          </div>
        </div>
      )}
    </>
  );
});

export default TickerTooltip;
