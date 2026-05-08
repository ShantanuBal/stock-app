"use client";

import { useState, useEffect, useTransition } from "react";
import type { IndexKey } from "./api/top-performers/route";
import IndexChart, { type ChartData } from "./components/IndexChart";
import InfoModal from "./components/InfoModal";
import PerformerTable from "./components/PerformerTable";
import type { StockResult } from "@/lib/polygon";

type TimeRange = "1D" | "3D" | "1W" | "1M" | "3M" | "YTD";

const RANGES: { label: string; value: TimeRange }[] = [
  { label: "1 Day", value: "1D" },
  { label: "3 Days", value: "3D" },
  { label: "1 Week", value: "1W" },
  { label: "1 Month", value: "1M" },
  { label: "3 Months", value: "3M" },
  { label: "YTD", value: "YTD" },
];

const INDICES: {
  label: string;
  value: IndexKey;
  description: string;
  wikiUrl: string;
}[] = [
  {
    label: "S&P 500",
    value: "sp500",
    description:
      "The S&P 500 tracks 500 of the largest US-listed companies by market capitalization, spanning every major sector of the economy. Introduced in 1957 by Standard & Poor's, it is widely considered the single best gauge of large-cap US equities and serves as the benchmark for trillions of dollars in index funds worldwide.",
    wikiUrl: "https://en.wikipedia.org/wiki/S%26P_500",
  },
  {
    label: "Nasdaq 100",
    value: "nasdaq100",
    description:
      "The Nasdaq-100 comprises the 100 largest non-financial companies listed on the Nasdaq exchange, with a heavy concentration in technology, consumer discretionary, and healthcare. It includes household names like Apple, Microsoft, and NVIDIA, making it a widely watched barometer for the tech industry's health.",
    wikiUrl: "https://en.wikipedia.org/wiki/Nasdaq-100",
  },
  {
    label: "Dow Jones",
    value: "djia",
    description:
      "The Dow Jones Industrial Average is one of the world's oldest and most-recognized stock indices, tracking 30 blue-chip US companies hand-picked by editors at S&P Dow Jones Indices. Unlike most indices, it is price-weighted — meaning higher-priced stocks exert more influence regardless of company size.",
    wikiUrl: "https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average",
  },
  {
    label: "Russell 2000",
    value: "russell2000",
    description:
      "The Russell 2000 measures the performance of the 2,000 smallest stocks in the Russell 3000 Index, representing roughly 7% of the total US market capitalization. It is the most widely cited benchmark for US small-cap stocks and is often used as a leading indicator of domestic economic health.",
    wikiUrl: "https://en.wikipedia.org/wiki/Russell_2000_Index",
  },
];


export default function Home() {
  const [index, setIndex] = useState<IndexKey>("sp500");
  const [range, setRange] = useState<TimeRange>("1W");
  // null = never loaded yet (show skeleton); [] = loaded but empty
  const [topStocks, setTopStocks] = useState<StockResult[] | null>(null);
  const [worstStocks, setWorstStocks] = useState<StockResult[] | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [infoOpen, setInfoOpen] = useState(false);

  const currentIndex = INDICES.find((i) => i.value === index)!;
  // Show skeleton on first load (null) or while a transition is in flight
  const loading = topStocks === null || isPending;

  useEffect(() => {
    startTransition(async () => {
      setError(null);
      try {
        const [stocksRes, chartRes] = await Promise.all([
          fetch(`/api/top-performers?range=${range}&index=${index}`),
          fetch(`/api/index-chart?range=${range}&index=${index}`),
        ]);
        if (!stocksRes.ok) throw new Error("Failed to fetch");
        const [stocksJson, chartJson] = await Promise.all([
          stocksRes.json(),
          chartRes.ok ? chartRes.json() : null,
        ]);
        setTopStocks(stocksJson.top);
        setWorstStocks(stocksJson.worst);
        setChartData(chartJson);
        setFromCache(stocksJson.fromCache || chartJson?.fromCache || false);
      } catch {
        setError("Could not load stock data. Please try again.");
        setTopStocks((prev) => prev ?? []);
        setWorstStocks((prev) => prev ?? []);
      }
    });
  }, [index, range]);

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10 font-[family-name:var(--font-geist-mono)]">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Market Top Performers</h1>
          <p className="mt-1 text-sm text-gray-400">Best performing stocks by index</p>
        </div>

        {/* Index selector */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex flex-wrap gap-1 rounded-xl bg-gray-900 p-1">
            {INDICES.map((idx) => (
              <button
                key={idx.value}
                onClick={() => setIndex(idx.value)}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                  index === idx.value
                    ? "bg-gray-700 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {idx.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setInfoOpen(true)}
            aria-label={`About ${currentIndex.label}`}
            title={`About ${currentIndex.label}`}
            className="flex items-center justify-center w-7 h-7 rounded-full border border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300 transition-colors text-sm"
          >
            ⓘ
          </button>
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

        {/* Stale data warning */}
        {fromCache && !loading && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-700/50 bg-amber-900/20 px-4 py-2.5 text-sm text-amber-400">
            <span>⚠</span>
            <span>Live data unavailable — showing last known values</span>
          </div>
        )}

        {/* Index chart */}
        <IndexChart data={chartData} label={currentIndex.label} loading={loading} />

        {error ? (
          <div className="rounded-lg bg-red-900/30 border border-red-700 p-4 text-red-300 text-sm">
            {error}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1].map((col) => (
              <div key={col} className="space-y-2">
                <div className="h-5 w-36 rounded bg-gray-800/50 animate-pulse mb-3" />
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-11 rounded-lg bg-gray-800/50 animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PerformerTable
              title="Top Performers"
              accent="emerald"
              stocks={topStocks ?? []}
            />
            <PerformerTable
              title="Worst Performers"
              accent="red"
              stocks={worstStocks ?? []}
            />
          </div>
        )}

        <p className="mt-4 text-xs text-gray-600">
          Data from Polygon.io · EOD prices · Top gainers shown
        </p>
      </div>

      {infoOpen && (
        <InfoModal
          name={currentIndex.label}
          description={currentIndex.description}
          wikiUrl={currentIndex.wikiUrl}
          onClose={() => setInfoOpen(false)}
        />
      )}
    </div>
  );
}
