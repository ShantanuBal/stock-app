"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Sparkline from "./Sparkline";
import type { ForexRate } from "@/lib/polygon-forex";

interface PairConfig {
  symbol: string;
  name: string;
  region: string;
}

type Range = "1D" | "3D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "YTD";

function ytdDays(): number {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  return Math.ceil((now.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24));
}

const RANGES: { label: string; value: Range; days: number }[] = [
  { label: "1 Day",    value: "1D",  days: 1   },
  { label: "3 Days",   value: "3D",  days: 3   },
  { label: "1 Week",   value: "1W",  days: 7   },
  { label: "1 Month",  value: "1M",  days: 30  },
  { label: "3 Months", value: "3M",  days: 90  },
  { label: "6 Months", value: "6M",  days: 180 },
  { label: "1 Year",   value: "1Y",  days: 365 },
  { label: "YTD",      value: "YTD", days: 0   },
];

function formatRate(rate: number): string {
  if (rate >= 100) return rate.toFixed(2);
  if (rate >= 10)  return rate.toFixed(3);
  return rate.toFixed(4);
}

export default function ForexCard({ pair, data, fullData }: { pair: PairConfig; data: ForexRate; fullData: ForexRate }) {
  const [expanded, setExpanded] = useState(false);
  const [range, setRange] = useState<Range>("1M");

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [expanded]);

  const isPositive = data.change >= 0;
  const changeColor = isPositive
    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
    : "text-red-600 dark:text-red-400 bg-red-500/10";
  const sparkColor = isPositive ? "#10b981" : "#f87171";
  const sign = isPositive ? "+" : "";
  const badge = `${sign}${data.changePct.toFixed(2)}%`;

  const selectedDays = range === "YTD" ? ytdDays() : (RANGES.find((r) => r.value === range)?.days ?? 30);
  const filteredPoints = fullData.points.slice(-selectedDays);

  const modalChangePct = filteredPoints.length >= 2
    ? ((filteredPoints[filteredPoints.length - 1].value - filteredPoints[0].value) / filteredPoints[0].value) * 100
    : data.changePct;
  const modalIsPositive = modalChangePct >= 0;
  const modalChangeColor = modalIsPositive
    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
    : "text-red-600 dark:text-red-400 bg-red-500/10";
  const modalBadge = `${modalIsPositive ? "+" : ""}${modalChangePct.toFixed(2)}%`;
  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? range;

  return (
    <>
      <div
        onClick={() => setExpanded(true)}
        className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4 cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{pair.symbol}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{pair.name}</p>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-600">{pair.region}</span>
        </div>
        <div className="mb-2">
          <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
            {formatRate(data.rate)}
          </p>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${changeColor}`}>
            {badge}
          </span>
        </div>
        <Sparkline points={data.points} color={sparkColor} height={60} />
      </div>

      {expanded && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-600 mb-1">{pair.region}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                  {formatRate(data.rate)}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${modalChangeColor}`}>{modalBadge}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-600">{rangeLabel} change</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{pair.symbol}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{pair.name}</p>
                <button
                  onClick={() => setExpanded(false)}
                  className="mt-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Period tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                    range === r.value
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <span className="sm:hidden">{r.value}</span>
                  <span className="hidden sm:inline">{r.label}</span>
                </button>
              ))}
            </div>

            {/* Large chart */}
            <Sparkline points={filteredPoints} color={sparkColor} height={260} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
