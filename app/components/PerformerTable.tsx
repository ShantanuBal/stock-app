"use client";

import { useState, useMemo } from "react";
import type { StockResult } from "@/lib/polygon";
import InfoTooltip from "./InfoTooltip";
import TickerTooltip from "./TickerTooltip";

type SortCol = "price" | "change" | "marketCap" | "beta" | "volume";
type SortDir = "asc" | "desc";

interface Props {
  title: string;
  accent: "emerald" | "red";
  stocks: StockResult[];
  sectors?: Record<string, string>;
  betas?: Record<string, number | null>;
  sharesOutstanding?: Record<string, number | null>;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toString();
}

function formatMarketCap(v: number): string {
  if (v >= 1_000_000_000_000) return `$${(v / 1_000_000_000_000).toFixed(2)}T`;
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  return `$${(v / 1_000_000).toFixed(0)}M`;
}

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol | null; sortDir: SortDir }) {
  if (sortCol !== col) {
    return (
      <svg className="w-3 h-3 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 15l5 5 5-5M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      {sortDir === "desc"
        ? <path d="M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M7 14l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

function ColHeader({
  label, col, sortCol, sortDir, onSort, align = "right", children,
}: {
  label: string;
  col: SortCol;
  sortCol: SortCol | null;
  sortDir: SortDir;
  onSort: (col: SortCol) => void;
  align?: "left" | "right";
  children?: React.ReactNode;
}) {
  const isActive = sortCol === col;
  return (
    <th className={`px-3 py-3 text-${align} hidden xl:table-cell`}>
      <span className={`inline-flex items-center justify-end gap-1`}>
        <button
          onClick={() => onSort(col)}
          className={`inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors ${isActive ? "text-emerald-500" : ""}`}
        >
          {label}
          <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
        </button>
        {children && <InfoTooltip>{children}</InfoTooltip>}
      </span>
    </th>
  );
}

function SimpleColHeader({
  label, col, sortCol, sortDir, onSort, align = "right",
}: {
  label: string;
  col: SortCol;
  sortCol: SortCol | null;
  sortDir: SortDir;
  onSort: (col: SortCol) => void;
  align?: "left" | "right";
}) {
  const isActive = sortCol === col;
  return (
    <th className={`px-3 py-3 text-${align}`}>
      <button
        onClick={() => onSort(col)}
        className={`inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors ${isActive ? "text-emerald-500" : ""}`}
      >
        {label}
        <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
      </button>
    </th>
  );
}

export default function PerformerTable({ title, accent, stocks, sectors, betas, sharesOutstanding }: Props) {
  const accentColor = accent === "emerald" ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400";
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => d === "desc" ? "asc" : "desc");
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  const sortedStocks = useMemo(() => {
    if (!sortCol) return stocks;
    return [...stocks].sort((a, b) => {
      let av: number | null = null;
      let bv: number | null = null;
      if (sortCol === "price") { av = a.price; bv = b.price; }
      else if (sortCol === "change") { av = a.changePercent; bv = b.changePercent; }
      else if (sortCol === "volume") { av = a.volume; bv = b.volume; }
      else if (sortCol === "beta") {
        av = betas?.[a.ticker] ?? null;
        bv = betas?.[b.ticker] ?? null;
      } else if (sortCol === "marketCap") {
        const sa = sharesOutstanding?.[a.ticker];
        const sb = sharesOutstanding?.[b.ticker];
        av = sa != null ? sa * a.price : null;
        bv = sb != null ? sb * b.price : null;
      }
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [stocks, sortCol, sortDir, betas, sharesOutstanding]);

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
              <SimpleColHeader label="Price" col="price" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <SimpleColHeader label="% Change" col="change" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <ColHeader label="Mkt Cap" col="marketCap" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Market capitalisation — the total value of all outstanding shares at the current price. Calculated as share price × shares outstanding.
                </p>
              </ColHeader>
              <ColHeader label="Beta" col="beta" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Beta measures how volatile a stock is relative to the overall market (S&P 500).
                </p>
                <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Beta &gt; 1</span> — moves more than the market</p>
                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Beta = 1</span> — moves with the market</p>
                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Beta &lt; 1</span> — moves less than the market</p>
                </div>
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Calculated from 1 year of daily returns vs SPY.</p>
              </ColHeader>
              <ColHeader label="Volume" col="volume" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  The number of shares traded on the most recent trading day. High volume on a price move signals stronger conviction — low volume may suggest the move is less reliable.
                </p>
              </ColHeader>
            </tr>
          </thead>
          <tbody>
            {sortedStocks.map((stock, i) => {
              const isPos = stock.changePercent >= 0;
              const color = isPos ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
              const bg = isPos ? "bg-emerald-500/10" : "bg-red-500/10";
              const beta = betas?.[stock.ticker];
              const shares = sharesOutstanding?.[stock.ticker];
              const marketCap = shares != null ? shares * stock.price : null;
              return (
                <tr
                  key={stock.ticker}
                  className="border-b border-gray-100 dark:border-gray-800/50 bg-white dark:bg-gray-900/30 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-3 py-3 text-gray-400 dark:text-gray-500">{i + 1}</td>
                  <td className="px-3 py-3 font-bold text-gray-900 dark:text-white">
                    <TickerTooltip ticker={stock.ticker} />
                  </td>
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
                    {sharesOutstanding === undefined ? (
                      <span className="text-gray-300 dark:text-gray-600">···</span>
                    ) : marketCap == null ? (
                      <span className="text-gray-400 dark:text-gray-600">—</span>
                    ) : (
                      formatMarketCap(marketCap)
                    )}
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
