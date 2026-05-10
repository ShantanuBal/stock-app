"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import type { IndexKey } from "./api/top-performers/route";
import IndexChart, { type ChartData } from "./components/IndexChart";
import InfoModal from "./components/InfoModal";
import IndustryModal from "./components/IndustryModal";
import PerformerTable from "./components/PerformerTable";
import { useTheme } from "./components/ThemeProvider";
import type { StockResult } from "@/lib/polygon";
import { TICKER_SECTORS } from "@/lib/sp500";
import { NASDAQ100_SECTORS } from "@/lib/nasdaq100";
import { DJIA_SECTORS } from "@/lib/djia";
import { RUSSELL2000_SECTORS } from "@/lib/russell2000";

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
  meta: { label: string; value: string }[];
}[] = [
  {
    label: "S&P 500",
    value: "sp500",
    description:
      "The S&P 500 tracks 500 of the largest US-listed companies by market capitalization, spanning every major sector of the economy. Introduced in 1957 by Standard & Poor's, it is widely considered the single best gauge of large-cap US equities and serves as the benchmark for trillions of dollars in index funds worldwide.",
    wikiUrl: "https://en.wikipedia.org/wiki/S%26P_500",
    meta: [
      { label: "Stocks", value: "503" },
      { label: "Weighting", value: "Market-cap" },
      { label: "Founded", value: "1957" },
      { label: "Rebalance", value: "Quarterly" },
      { label: "Covers", value: "~80% of US market" },
    ],
  },
  {
    label: "Nasdaq 100",
    value: "nasdaq100",
    description:
      "The Nasdaq-100 comprises the 100 largest non-financial companies listed on the Nasdaq exchange, with a heavy concentration in technology, consumer discretionary, and healthcare. It includes household names like Apple, Microsoft, and NVIDIA, making it a widely watched barometer for the tech industry's health.",
    wikiUrl: "https://en.wikipedia.org/wiki/Nasdaq-100",
    meta: [
      { label: "Stocks", value: "101" },
      { label: "Weighting", value: "Market-cap" },
      { label: "Founded", value: "1985" },
      { label: "Rebalance", value: "Annual" },
      { label: "Focus", value: "Tech & Growth" },
    ],
  },
  {
    label: "Dow Jones",
    value: "djia",
    description:
      "The Dow Jones Industrial Average is one of the world's oldest and most-recognized stock indices, tracking 30 blue-chip US companies hand-picked by editors at S&P Dow Jones Indices. Unlike most indices, it is price-weighted — meaning higher-priced stocks exert more influence regardless of company size.",
    wikiUrl: "https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average",
    meta: [
      { label: "Stocks", value: "30" },
      { label: "Weighting", value: "Price-weighted" },
      { label: "Founded", value: "1896" },
      { label: "Rebalance", value: "As needed" },
      { label: "Focus", value: "Blue-chip" },
    ],
  },
  {
    label: "Russell 2000",
    value: "russell2000",
    description:
      "The Russell 2000 measures the performance of the 2,000 smallest stocks in the Russell 3000 Index, representing roughly 7% of the total US market capitalization. It is the most widely cited benchmark for US small-cap stocks and is often used as a leading indicator of domestic economic health.",
    wikiUrl: "https://en.wikipedia.org/wiki/Russell_2000_Index",
    meta: [
      { label: "Stocks", value: "2,000" },
      { label: "Weighting", value: "Market-cap" },
      { label: "Founded", value: "1984" },
      { label: "Rebalance", value: "Annual" },
      { label: "Focus", value: "Small-cap" },
    ],
  },
];


export default function Home() {
  const { toggle, theme } = useTheme();
  const isDark = theme === "dark";
  const [index, setIndex] = useState<IndexKey>("sp500");
  const [range, setRange] = useState<TimeRange>("1W");
  const [sectors, setSectors] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(30);
  // null = never loaded yet (show skeleton); [] = loaded but empty
  const [topStocks, setTopStocks] = useState<StockResult[] | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [infoOpen, setInfoOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [industryInfoOpen, setIndustryInfoOpen] = useState(false);

  const currentIndex = INDICES.find((i) => i.value === index)!;
  // Show skeleton on first load (null) or while a transition is in flight
  const loading = topStocks === null || isPending;

  const sectorMap = useMemo<Record<string, string>>(() => ({
    sp500: TICKER_SECTORS,
    nasdaq100: NASDAQ100_SECTORS,
    djia: DJIA_SECTORS,
    russell2000: RUSSELL2000_SECTORS,
  }[index]), [index]);

  const availableSectors = useMemo(() => {
    const sectors = new Set(
      (topStocks ?? []).map((s) => sectorMap[s.ticker]).filter(Boolean)
    );
    return ["All", ...Array.from(sectors).sort()];
  }, [topStocks, sectorMap]);

  const filteredTop = useMemo(() => {
    if (!topStocks || sectors.length === 0) return topStocks;
    return topStocks.filter((s) => sectors.includes(sectorMap[s.ticker]));
  }, [topStocks, sectors, sectorMap]);

  useEffect(() => {
    if (!topStocks || topStocks.length === 0) return;
    setSummary(null);
    setSummaryLoading(true);
    const controller = new AbortController();
    fetch("/api/ai-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index, range, stocks: topStocks.slice(0, 20) }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d) => { setSummary(d.summary ?? null); setSummaryExpanded(false); })
      .catch((e) => { if (e.name !== "AbortError") setSummary(null); })
      .finally(() => setSummaryLoading(false));
    return () => controller.abort();
  }, [topStocks, index, range]);

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
        setTopStocks(stocksJson.all);
        setChartData(chartJson);
        setSectors([]);
        setVisibleCount(30);
      } catch {
        setError("Could not load stock data. Please try again.");
        setTopStocks((prev) => prev ?? []);
      }
    });
  }, [index, range]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 px-4 py-10 font-[family-name:var(--font-geist-mono)]">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Market Watch</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">because your finance bro friends shouldn&apos;t be your only source of market news</p>
          </div>
          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="mt-1 flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            {isDark ? (
              /* Moon icon */
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              /* Sun icon */
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
              </svg>
            )}
          </button>
        </div>

        {/* Index selector */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 dark:bg-gray-900 p-1">
            {INDICES.map((idx) => (
              <button
                key={idx.value}
                onClick={() => { setIndex(idx.value); setSectors([]); }}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                  index === idx.value
                    ? "bg-emerald-500 text-white shadow"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
            className="flex items-center justify-center w-7 h-7 rounded-full border border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
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
                  : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Index metadata */}
        <div className="mb-5 flex flex-wrap gap-x-6 gap-y-3">
          {currentIndex.meta.map((item, i) => (
            <div key={item.label} className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{item.value}</p>
              </div>
              {i < currentIndex.meta.length - 1 && (
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />
              )}
            </div>
          ))}
        </div>

        {/* Index chart */}
        <IndexChart data={chartData} label={currentIndex.label} loading={loading} />

        {/* AI Summary */}
        {(topStocks !== null && !loading && summary === null) || summaryLoading ? (
          <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 flex items-center gap-3">
            <svg className="animate-spin h-4 w-4 text-emerald-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-gray-500 dark:text-gray-400">Generating AI summary…</span>
          </div>
        ) : summary ? (
          <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">AI Summary</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">· Claude · Not financial advice</span>
            </div>
            <div className={`space-y-3 ${summaryExpanded ? "" : "line-clamp-5"}`}>
              {summary.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-[family-name:var(--font-inter)]">
                  {para.trim()}
                </p>
              ))}
            </div>
            <button
              onClick={() => setSummaryExpanded((e) => !e)}
              className="mt-2 text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              {summaryExpanded ? "Show less" : "Read more"}
            </button>
          </div>
        ) : null}

        {/* Sector filter tabs */}
        <div className="mb-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Industry</p>
            <button
              onClick={() => setIndustryInfoOpen(true)}
              aria-label="About industry groups"
              className="flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSectors.map((s) => {
              const isAll = s === "All";
              const isActive = isAll ? sectors.length === 0 : sectors.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => {
                    setVisibleCount(30);
                    if (isAll) { setSectors([]); return; }
                    setSectors((prev) => {
                      const next = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s];
                      return next;
                    });
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        ) : loading ? (
          <div className="space-y-2">
            <div className="h-5 w-36 rounded bg-gray-200 dark:bg-gray-800/50 animate-pulse mb-3" />
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-11 rounded-lg bg-gray-200 dark:bg-gray-800/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <PerformerTable
              title="Companies"
              accent="emerald"
              stocks={(filteredTop ?? []).slice(0, visibleCount)}
              sectors={sectorMap}
            />
            {(filteredTop ?? []).length > visibleCount && (
              <button
                onClick={() => setVisibleCount((c) => c + 30)}
                className="mt-3 w-full rounded-lg border border-gray-200 dark:border-gray-800 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Show more ({(filteredTop ?? []).length - visibleCount} remaining)
              </button>
            )}
          </>
        )}

        <p className="mt-4 text-xs text-gray-400 dark:text-gray-600">
          Data from Polygon.io · EOD prices
        </p>

        <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          <p>
            Built with questionable amounts of caffeine by{" "}
            <span className="text-gray-700 dark:text-gray-300 font-medium">Shantanu Bal</span> 🤓
          </p>
          <p className="mt-1">
            Got feedback? Complaints? A hot stock tip?{" "}
            <a
              href="mailto:shantanu.r.bal@gmail.com"
              className="text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              shantanu.r.bal@gmail.com
            </a>
          </p>
        </div>
      </div>

      {infoOpen && (
        <InfoModal
          name={currentIndex.label}
          description={currentIndex.description}
          wikiUrl={currentIndex.wikiUrl}
          onClose={() => setInfoOpen(false)}
        />
      )}
      {industryInfoOpen && (
        <IndustryModal onClose={() => setIndustryInfoOpen(false)} />
      )}
    </div>
  );
}
