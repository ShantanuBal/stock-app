"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import type { IndexKey } from "./api/top-performers/route";
import IndexChart, { type ChartData } from "./components/IndexChart";
import IndexChartModal from "./components/IndexChartModal";
import InfoTooltip from "./components/InfoTooltip";
import PerformerTable from "./components/PerformerTable";
import type { StockResult } from "@/lib/polygon";
import { SP500_SECTORS } from "@/lib/sp500";
import { NASDAQ100_SECTORS } from "@/lib/nasdaq100";
import { DJIA_SECTORS } from "@/lib/djia";
import { RUSSELL2000_SECTORS } from "@/lib/russell2000";
import HScrollContainer from "./components/HScrollContainer";

type TimeRange = "1D" | "3D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "YTD";

const RANGES: { label: string; value: TimeRange }[] = [
  { label: "1 Day", value: "1D" },
  { label: "3 Days", value: "3D" },
  { label: "1 Week", value: "1W" },
  { label: "1 Month", value: "1M" },
  { label: "3 Months", value: "3M" },
  { label: "6 Months", value: "6M" },
  { label: "1 Year", value: "1Y" },
  { label: "5 Years", value: "5Y" },
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
  {
    label: "All Stocks",
    value: "all",
    description: "Every US-listed stock in our database, sorted by performance over the selected time period.",
    wikiUrl: "https://en.wikipedia.org/wiki/Stock_market",
    meta: [
      { label: "Coverage", value: "~9,000 stocks" },
      { label: "Exchange", value: "NYSE + Nasdaq" },
      { label: "Data", value: "Polygon" },
    ],
  },
];


const SUMMARY_INDICES = ["sp500", "nasdaq100", "djia", "russell2000"] as const;

const GICS = [
  { sector: "Information Technology", groups: ["Software", "Semiconductors", "Tech Hardware"] },
  { sector: "Health Care",            groups: ["Pharma & Biotech", "Health Services"] },
  { sector: "Financials",             groups: ["Banks", "Financial Services", "Insurance"] },
  { sector: "Industrials",            groups: ["Capital Goods", "Transportation", "Prof. Services"] },
  { sector: "Consumer Discretionary", groups: ["Consumer Services", "Retail", "Consumer Goods"] },
  { sector: "Consumer Staples",       groups: ["Food & Beverage", "Household Products"] },
  { sector: "Communication Services", groups: ["Media", "Telecom"] },
  { sector: "Energy",                 groups: ["Energy"] },
  { sector: "Materials",              groups: ["Materials"] },
  { sector: "Real Estate",            groups: ["REITs"] },
  { sector: "Utilities",              groups: ["Utilities"] },
];

export default function Home() {
  const [index, setIndex] = useState<IndexKey>("sp500");
  const [range, setRange] = useState<TimeRange>("1D");
  const [sectors, setSectors] = useState<string[]>([]);
  // null = never loaded yet (show skeleton); [] = loaded but empty
  const [topStocks, setTopStocks] = useState<StockResult[] | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [betas, setBetas] = useState<Record<string, number | null> | undefined>(undefined);
  const [marketCapShares, setMarketCapShares] = useState<Record<string, { weighted: number | null; shares: number | null; netIncome: number | null; epsGrowth: number | null }> | undefined>(undefined);
  const [isSummary, setIsSummary] = useState(true);
  const [summaryCharts, setSummaryCharts] = useState<Record<string, ChartData | null> | null>(null);
  const [overviewSummary, setOverviewSummary] = useState<string | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewExpanded, setOverviewExpanded] = useState(false);

  const isAllStocks = !isSummary && index === "all";
  const currentIndex = INDICES.find((i) => i.value === index) ?? null;
  // Show skeleton on first load (null) or while a transition is in flight
  const loading = topStocks === null || isPending;

  const sectorMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, Record<string, string>> = {
      sp500: SP500_SECTORS,
      nasdaq100: NASDAQ100_SECTORS,
      djia: DJIA_SECTORS,
      russell2000: RUSSELL2000_SECTORS,
    };
    return map[index] ?? {};
  }, [index]);

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
    if (!topStocks || topStocks.length === 0 || isAllStocks) return;
    setBetas(undefined);
    fetch("/api/beta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers: topStocks.map((s) => s.ticker) }),
    })
      .then((r) => r.json())
      .then((d) => setBetas(d.betas ?? {}))
      .catch(() => setBetas({}));
  }, [topStocks, isAllStocks]);

  useEffect(() => {
    if (!topStocks || topStocks.length === 0) return;
    setMarketCapShares(undefined);
    fetch("/api/market-caps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers: topStocks.map((s) => s.ticker) }),
    })
      .then((r) => r.json())
      .then((d) => setMarketCapShares(d.marketCapShares ?? {}))
      .catch(() => setMarketCapShares({}));
  }, [topStocks]);

  useEffect(() => {
    if (!topStocks || topStocks.length === 0 || isAllStocks) return;
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
  }, [topStocks, index, range, isAllStocks]);

  useEffect(() => {
    startTransition(async () => {
      setError(null);
      try {
        const fetchChart = !isAllStocks;
        const [stocksRes, chartRes] = await Promise.all([
          fetch(`/api/top-performers?range=${range}&index=${index}`),
          fetchChart ? fetch(`/api/index-chart?range=${range}&index=${index}`) : Promise.resolve(null),
        ]);
        if (!stocksRes.ok) throw new Error("Failed to fetch");
        const stocksJson = await stocksRes.json();
        const chartJson = chartRes && chartRes.ok ? await chartRes.json() : null;
        setTopStocks(stocksJson.all);
        setChartData(fetchChart ? chartJson : null);
        setSectors([]);
      } catch {
        setError("Could not load stock data. Please try again.");
        setTopStocks((prev) => prev ?? []);
      }
    });
  }, [index, range, isAllStocks]);

  useEffect(() => {
    if (!isSummary) return;
    setSummaryCharts(null);
    setOverviewSummary(null);
    setOverviewExpanded(false);
    Promise.all(
      SUMMARY_INDICES.map(async (idx) => {
        try {
          const res = await fetch(`/api/index-chart?range=${range}&index=${idx}`);
          const data = res.ok ? await res.json() : null;
          return [idx, data] as [string, ChartData | null];
        } catch {
          return [idx, null] as [string, null];
        }
      })
    ).then((results) => setSummaryCharts(Object.fromEntries(results)));
  }, [isSummary, range]);

  useEffect(() => {
    if (!isSummary || !summaryCharts) return;
    const indices = SUMMARY_INDICES.map((idx) => {
      const idxInfo = INDICES.find((i) => i.value === idx)!;
      return { label: idxInfo.label, changePercent: summaryCharts[idx]?.changePercent ?? 0 };
    });
    setOverviewLoading(true);
    fetch("/api/ai-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index: "summary", range, indices }),
    })
      .then((r) => r.json())
      .then((d) => setOverviewSummary(d.summary ?? null))
      .catch(() => setOverviewSummary(null))
      .finally(() => setOverviewLoading(false));
  }, [isSummary, summaryCharts, range]);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
            Equities
          </h2>
          <InfoTooltip width="w-80">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What are equities?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
              Equities (stocks) represent ownership in a company. When you buy a share, you own a small slice of that business and are entitled to a proportional claim on its earnings and assets.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              This tab tracks top movers across four major US indices: the <span className="font-medium text-gray-700 dark:text-gray-300">S&amp;P 500</span> (500 large-cap companies), <span className="font-medium text-gray-700 dark:text-gray-300">Nasdaq 100</span> (tech-heavy), <span className="font-medium text-gray-700 dark:text-gray-300">Dow Jones</span> (30 blue-chip stocks), and <span className="font-medium text-gray-700 dark:text-gray-300">Russell 2000</span> (small-caps).
            </p>
            <a href="https://en.wikipedia.org/wiki/Stock" target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-emerald-500 hover:text-emerald-400 underline underline-offset-2">
              Learn more on Wikipedia →
            </a>
          </InfoTooltip>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Top performers across S&P 500, Nasdaq 100, Dow Jones, and Russell 2000 · Data from Polygon · Prices delayed 15 min
        </p>
      </div>

        {/* Time range selector */}
        <div className="sticky top-[44px] z-10 bg-slate-50 dark:bg-gray-950 -mx-4 px-4 py-1 mb-2">
          <HScrollContainer variant="page">
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
          </HScrollContainer>
        </div>

        {/* Index selector */}
        <div className="sticky top-[84px] z-10 bg-slate-50 dark:bg-gray-950 -mx-4 px-4 pb-3 mb-2">
        <div className="rounded-xl bg-gray-100 dark:bg-gray-900 py-1 w-fit max-w-full">
          <HScrollContainer variant="card" className="gap-1">
            <button
              onClick={() => setIsSummary(true)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                isSummary
                  ? "bg-emerald-500 text-white shadow"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Overview
              <InfoTooltip element="span">
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">About</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Overview</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  A side-by-side view of all four major US indices — S&amp;P 500, Nasdaq 100, Dow Jones, and Russell 2000 — over the selected time range. Click any chart to drill into that index.
                </p>
              </InfoTooltip>
            </button>
            {INDICES.map((idx) => (
              <button
                key={idx.value}
                onClick={() => { setIndex(idx.value); setSectors([]); setIsSummary(false); }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                  !isSummary && index === idx.value
                    ? "bg-emerald-500 text-white shadow"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {idx.label}
                <InfoTooltip element="span">
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">About</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">{idx.label}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">{idx.description}</p>
                  {idx.meta.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                      {idx.meta.map((item) => (
                        <div key={item.label}>
                          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">{item.label}</p>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <a
                    href={idx.wikiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    Read more on Wikipedia ↗
                  </a>
                </InfoTooltip>
              </button>
            ))}
          </HScrollContainer>
        </div>
        </div>

        {/* Summary view — AI overview */}
        {isSummary && (overviewLoading || overviewSummary) && (
          <div className="mb-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">AI Overview</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">· Claude · Not financial advice</span>
            </div>
            {overviewLoading && !overviewSummary ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5 text-emerald-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-gray-500 dark:text-gray-400">Generating overview…</span>
              </div>
            ) : (
              <>
                <div className={`space-y-3 ${overviewExpanded ? "" : "line-clamp-5"}`}>
                  {(overviewSummary ?? "").split("\n\n").map((para, i) => (
                    <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-[family-name:var(--font-inter)]">
                      {para.trim()}
                    </p>
                  ))}
                </div>
                <button
                  onClick={() => setOverviewExpanded((e) => !e)}
                  className="mt-2 text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  {overviewExpanded ? "Show less" : "Read more"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Summary view — 2×2 index chart grid */}
        {isSummary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SUMMARY_INDICES.map((idx) => {
              const idxInfo = INDICES.find((i) => i.value === idx)!;
              return (
                <IndexChart
                  key={idx}
                  data={summaryCharts?.[idx] ?? null}
                  label={idxInfo.label}
                  loading={summaryCharts === null}
                  gradientId={`summaryGrad-${idx}`}
                  onClick={() => { setIsSummary(false); setIndex(idx); setSectors([]); }}
                />
              );
            })}
          </div>
        )}

        {/* Chart — hidden for All Stocks and Summary */}
        {!isSummary && !isAllStocks && currentIndex && (
          <>
            <IndexChart data={chartData} label={currentIndex.label} loading={loading} onClick={() => setChartModalOpen(true)} range={range} />
            <IndexChartModal
              isOpen={chartModalOpen}
              onClose={() => setChartModalOpen(false)}
              label={currentIndex.label}
              index={index}
              initialRange={range}
            />
          </>
        )}

        {/* AI Summary — hidden for All Stocks and Summary */}
        {!isSummary && !isAllStocks && ((topStocks !== null && !loading && summary === null) || summaryLoading) ? (
          <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 flex items-center gap-3">
            <svg className="animate-spin h-4 w-4 text-emerald-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-gray-500 dark:text-gray-400">Generating AI summary…</span>
          </div>
        ) : !isSummary && !isAllStocks && summary ? (
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

        {/* Sector filter tabs — hidden for All Stocks and Summary */}
        {!isSummary && !isAllStocks && <div className="mb-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Industry</p>
            <InfoTooltip>
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Industry Groups</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                Companies are classified using <span className="font-medium text-gray-700 dark:text-gray-300">GICS Industry Groups</span> — one level below the 11 broad sectors, giving a more granular view without being overwhelming.
              </p>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {GICS.map(({ sector, groups }) => (
                  <div key={sector}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{sector}</p>
                    <div className="flex flex-wrap gap-1">
                      {groups.map((g) => (
                        <span key={g} className="rounded bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300">{g}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </InfoTooltip>
          </div>
          <HScrollContainer variant="card">
            {availableSectors.map((s) => {
              const isAll = s === "All";
              const isActive = isAll ? sectors.length === 0 : sectors.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => {
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
          </HScrollContainer>
        </div>}

        {!isSummary && error ? (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        ) : !isSummary && (loading || (isAllStocks && marketCapShares === undefined)) ? (
          <div className="space-y-2">
            {isAllStocks && (
              <div className="flex items-center gap-2 mb-3 px-1">
                <svg className="animate-spin h-3.5 w-3.5 text-emerald-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {loading ? "Fetching stock data…" : "Fetching market cap data…"}
                </span>
              </div>
            )}
            <div className="h-5 w-36 rounded bg-gray-200 dark:bg-gray-800/50 animate-pulse mb-3" />
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-11 rounded-lg bg-gray-200 dark:bg-gray-800/50 animate-pulse" />
            ))}
          </div>
        ) : !isSummary ? (
          <>
            <PerformerTable
              key={`${index}-${range}-${sectors.join(",")}`}
              title="Companies"
              accent="emerald"
              stocks={filteredTop ?? []}
              sectors={isAllStocks ? Object.fromEntries((topStocks ?? []).filter((s) => s.industry).map((s) => [s.ticker, s.industry!])) : sectorMap}
              betas={isAllStocks ? undefined : betas}
              showBeta={!isAllStocks}
              defaultSortCol={isAllStocks ? "marketCap" : "change"}
              marketCapShares={marketCapShares}
              range={range}
            />
          </>
        ) : null}

    </div>
  );
}
