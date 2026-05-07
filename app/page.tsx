"use client";

import { useState, useEffect, useCallback } from "react";

type TimeRange = "1D" | "3D" | "1W" | "1M" | "3M" | "YTD";

interface StockResult {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
  changeDollars: number;
  volume: number;
}

const RANGES: { label: string; value: TimeRange }[] = [
  { label: "1 Day", value: "1D" },
  { label: "3 Days", value: "3D" },
  { label: "1 Week", value: "1W" },
  { label: "1 Month", value: "1M" },
  { label: "3 Months", value: "3M" },
  { label: "YTD", value: "YTD" },
];

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toString();
}

export default function Home() {
  const [range, setRange] = useState<TimeRange>("1W");
  const [stocks, setStocks] = useState<StockResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStocks = useCallback(async (r: TimeRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/top-performers?range=${r}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStocks(data.results);
    } catch {
      setError("Could not load stock data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStocks(range);
  }, [range, fetchStocks]);

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10 font-[family-name:var(--font-geist-mono)]">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">S&P 500 Top Performers</h1>
          <p className="mt-1 text-sm text-gray-400">Best performing stocks from the S&P 500 index</p>
        </div>

        {/* Time range selector */}
        <div className="mb-6 flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                range === r.value
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {error ? (
          <div className="rounded-lg bg-red-900/30 border border-red-700 p-4 text-red-300 text-sm">
            {error}
          </div>
        ) : loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-gray-800/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left w-8">#</th>
                  <th className="px-4 py-3 text-left">Ticker</th>
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Change</th>
                  <th className="px-4 py-3 text-right">% Change</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">Volume</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock, i) => (
                  <tr
                    key={stock.ticker}
                    className="border-b border-gray-800/50 bg-gray-900/30 transition-colors hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-white">{stock.ticker}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 max-w-[160px] truncate">{stock.name}</td>
                    <td className="px-4 py-3 text-right text-white">
                      ${stock.price.toFixed(2)}
                    </td>
                    <td className={`px-4 py-3 text-right ${stock.changeDollars >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {stock.changeDollars >= 0 ? "+" : ""}
                      {stock.changeDollars.toFixed(2)}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${stock.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${stock.changePercent >= 0 ? "bg-emerald-400/10" : "bg-red-400/10"}`}>
                        {stock.changePercent >= 0 ? "▲" : "▼"} {Math.abs(stock.changePercent).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 hidden md:table-cell">
                      {formatVolume(stock.volume)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-600">
          Data from Polygon.io · EOD prices · Top 25 gainers shown
        </p>
      </div>
    </div>
  );
}
