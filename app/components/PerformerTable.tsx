"use client";

import { useRef, useState } from "react";
import type { StockResult } from "@/lib/polygon";

interface Props {
  title: string;
  accent: "emerald" | "red";
  stocks: StockResult[];
  sectors?: Record<string, string>;
  betas?: Record<string, number | null>;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toString();
}

function BetaHeader() {
  const ref = useRef<HTMLTableCellElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  return (
    <th
      ref={ref}
      className="px-3 py-3 text-right hidden xl:table-cell"
      onMouseEnter={() => setRect(ref.current?.getBoundingClientRect() ?? null)}
      onMouseLeave={() => setRect(null)}
    >
      <span className="inline-flex items-center justify-end gap-1 cursor-help">
        Beta
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </span>
      {rect && (
        <div
          className="fixed z-50 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-left shadow-xl normal-case tracking-normal font-normal text-gray-900 dark:text-white"
          style={{ top: rect.top - 8, left: rect.right + 8, transform: "translateY(-100%)" }}
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Beta measures how volatile a stock is relative to the overall market (S&P 500).
          </p>
          <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <p><span className="font-medium text-gray-700 dark:text-gray-300">Beta &gt; 1</span> — moves more than the market</p>
            <p><span className="font-medium text-gray-700 dark:text-gray-300">Beta = 1</span> — moves with the market</p>
            <p><span className="font-medium text-gray-700 dark:text-gray-300">Beta &lt; 1</span> — moves less than the market</p>
          </div>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Calculated from 1 year of daily returns vs SPY.</p>
        </div>
      )}
    </th>
  );
}

export default function PerformerTable({ title, accent, stocks, sectors, betas }: Props) {
  const accentColor = accent === "emerald" ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400";

  return (
    <div>
      <h2 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${accentColor}`}>
        {title}
      </h2>
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-3 py-3 text-left w-7">#</th>
              <th className="px-3 py-3 text-left">Ticker</th>
              <th className="px-3 py-3 text-left hidden lg:table-cell">Company</th>
              <th className="px-3 py-3 text-left hidden xl:table-cell">Industry</th>
              <th className="px-3 py-3 text-right">Price</th>
              <th className="px-3 py-3 text-right">% Change</th>
              <BetaHeader />
              <th className="px-3 py-3 text-right hidden xl:table-cell">Volume</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, i) => {
              const isPos = stock.changePercent >= 0;
              const color = isPos ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
              const bg = isPos ? "bg-emerald-500/10" : "bg-red-500/10";
              const beta = betas?.[stock.ticker];
              return (
                <tr
                  key={stock.ticker}
                  className="border-b border-gray-100 dark:border-gray-800/50 bg-white dark:bg-gray-900/30 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-3 py-3 text-gray-400 dark:text-gray-500">{i + 1}</td>
                  <td className="px-3 py-3 font-bold text-gray-900 dark:text-white">{stock.ticker}</td>
                  <td className="px-3 py-3 text-gray-500 dark:text-gray-300 max-w-[140px] truncate hidden lg:table-cell">
                    {stock.name}
                  </td>
                  <td className="px-3 py-3 text-gray-500 dark:text-gray-400 max-w-[140px] truncate hidden xl:table-cell text-xs">
                    {sectors?.[stock.ticker] ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-900 dark:text-white tabular-nums">
                    ${stock.price.toFixed(2)}
                  </td>
                  <td className={`px-3 py-3 text-right font-semibold ${color}`}>
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${bg}`}>
                      {isPos ? "▲" : "▼"} {Math.abs(stock.changePercent).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right hidden xl:table-cell tabular-nums text-gray-600 dark:text-gray-300">
                    {betas === undefined ? (
                      <span className="text-gray-300 dark:text-gray-600">···</span>
                    ) : beta === null || beta === undefined ? (
                      <span className="text-gray-400 dark:text-gray-600">—</span>
                    ) : (
                      beta.toFixed(2)
                    )}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-500 dark:text-gray-400 hidden xl:table-cell tabular-nums">
                    {formatVolume(stock.volume)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
