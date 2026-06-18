"use client";

import { useState, useEffect, useTransition, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { IndexKey } from "./api/top-performers/route";
import { type ChartData } from "./components/IndexChart";
import IndexChartModal from "./components/IndexChartModal";
import MiniSparkline from "./components/MiniSparkline";
import InfoTooltip from "./components/InfoTooltip";
import PerformerTable, { type WatchListMeta } from "./components/PerformerTable";
import AddTickerSearch from "./components/AddTickerSearch";
import type { StockResult } from "@/lib/polygon";
import { SP500_SECTORS } from "@/lib/sp500";
import { NASDAQ100_SECTORS } from "@/lib/nasdaq100";
import { DJIA_SECTORS } from "@/lib/djia";
import { RUSSELL2000_SECTORS } from "@/lib/russell2000";
import HScrollContainer from "./components/HScrollContainer";
import { addToWatchList, removeFromWatchList } from "./actions/watchlists";

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
  const searchParams = useSearchParams();
  const router = useRouter();

  const indexParam = searchParams.get("index");
  const watchlistParam = searchParams.get("watchlist");
  const isWatchlistView = !!watchlistParam;
  // No index param (or a legacy "overview" link) defaults to the S&P 500 view
  const index = (!indexParam || indexParam === "overview" ? "sp500" : indexParam) as IndexKey;
  const range = (searchParams.get("range") ?? "1D") as TimeRange;

  function navigate(newIndex: string | null, newRange: string, watchlistId?: string) {
    const p = new URLSearchParams();
    if (watchlistId) {
      p.set("watchlist", watchlistId);
    } else if (newIndex) {
      p.set("index", newIndex);
    }
    p.set("range", newRange);
    router.replace(`/?${p.toString()}`, { scroll: false });
  }

  const [sectors, setSectors] = useState<string[]>([]);
  // null = never loaded yet (show skeleton); [] = loaded but empty
  const [topStocks, setTopStocks] = useState<StockResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  // Which index's chart is blown up in the modal (null = closed)
  const [modalIndex, setModalIndex] = useState<IndexKey | null>(null);
  const [betas, setBetas] = useState<Record<string, number | null> | undefined>(undefined);
  const [marketCapShares, setMarketCapShares] = useState<Record<string, { weighted: number | null; shares: number | null; netIncome: number | null; epsGrowth: number | null }> | undefined>(undefined);

  // Per-index performance snapshot — % change for each index over the selected range
  const [summaryCharts, setSummaryCharts] = useState<Record<string, ChartData | null> | null>(null);

  // Watchlists
  const [watchlists, setWatchlists] = useState<WatchListMeta[]>([]);
  const [watchlistAuthenticated, setWatchlistAuthenticated] = useState(false);
  const [newListTooltip, setNewListTooltip] = useState<{ right: number; y: number } | null>(null);
  // Delay hiding so the cursor can travel into the tooltip to click "Sign in"
  const newListTooltipHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelNewListTooltipHide = useCallback(() => {
    if (newListTooltipHideTimer.current) {
      clearTimeout(newListTooltipHideTimer.current);
      newListTooltipHideTimer.current = null;
    }
  }, []);
  const scheduleNewListTooltipHide = useCallback(() => {
    cancelNewListTooltipHide();
    newListTooltipHideTimer.current = setTimeout(() => setNewListTooltip(null), 300);
  }, [cancelNewListTooltipHide]);
  const [watchlistStocks, setWatchlistStocks] = useState<StockResult[] | null>(null);
  const [watchlistName, setWatchlistName] = useState<string>("");
  const [watchlistError, setWatchlistError] = useState<string | null>(null);

  const isAllStocks = !isWatchlistView && index === "all";
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
    if (!topStocks || topStocks.length === 0 || isAllStocks || isWatchlistView) return;
    setBetas(undefined);
    fetch("/api/beta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers: topStocks.map((s) => s.ticker) }),
    })
      .then((r) => r.json())
      .then((d) => setBetas(d.betas ?? {}))
      .catch(() => setBetas({}));
  }, [topStocks, isAllStocks, isWatchlistView]);

  useEffect(() => {
    if (!topStocks || topStocks.length === 0 || isWatchlistView) return;
    setMarketCapShares(undefined);
    fetch("/api/market-caps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers: topStocks.map((s) => s.ticker) }),
    })
      .then((r) => r.json())
      .then((d) => setMarketCapShares(d.marketCapShares ?? {}))
      .catch(() => setMarketCapShares({}));
  }, [topStocks, isWatchlistView]);

  useEffect(() => {
    if (!topStocks || topStocks.length === 0 || isAllStocks || isWatchlistView) return;
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
  }, [topStocks, index, range, isAllStocks, isWatchlistView]);

  useEffect(() => {
    if (isWatchlistView) return;
    startTransition(async () => {
      setError(null);
      try {
        const stocksRes = await fetch(`/api/top-performers?range=${range}&index=${index}`);
        if (!stocksRes.ok) throw new Error("Failed to fetch");
        const stocksJson = await stocksRes.json();
        setTopStocks(stocksJson.all);
        setSectors([]);
      } catch {
        setError("Could not load stock data. Please try again.");
        setTopStocks((prev) => prev ?? []);
      }
    });
  }, [index, range, isWatchlistView]);

  // Snapshot strip: fetch each index's chart (for its % change) whenever range changes
  useEffect(() => {
    setSummaryCharts(null);
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
  }, [range]);

  // Fetch user's watchlists once on mount
  useEffect(() => {
    fetch("/api/watchlists")
      .then((r) => r.json())
      .then((d) => {
        setWatchlists(d.lists ?? []);
        setWatchlistAuthenticated(d.authenticated ?? false);
      })
      .catch(() => {});
  }, []);

  // Fetch stocks for the active watchlist. showSkeleton=false refreshes in place
  // (e.g. after adding a ticker) without flashing the loading skeleton.
  const loadWatchlistStocks = useCallback(async (showSkeleton = true) => {
    if (!watchlistParam) { setWatchlistStocks(null); return; }
    if (showSkeleton) setWatchlistStocks(null);
    setWatchlistError(null);
    try {
      const r = await fetch(`/api/watchlist-stocks?listId=${watchlistParam}&range=${range}`);
      const d = await r.json();
      if (d.error) { setWatchlistError(d.error); setWatchlistStocks([]); return; }
      setWatchlistStocks(d.stocks ?? []);
      setWatchlistName(d.listName ?? "");
    } catch {
      setWatchlistStocks([]);
      setWatchlistError("Could not load watchlist data.");
    }
  }, [watchlistParam, range]);

  useEffect(() => { loadWatchlistStocks(true); }, [loadWatchlistStocks]);

  // Watchlist: fetch Beta + Market Cap / P/E / PEG columns for parity with the index tabs
  useEffect(() => {
    if (!isWatchlistView || !watchlistStocks || watchlistStocks.length === 0) return;
    setBetas(undefined);
    fetch("/api/beta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers: watchlistStocks.map((s) => s.ticker) }),
    })
      .then((r) => r.json())
      .then((d) => setBetas(d.betas ?? {}))
      .catch(() => setBetas({}));
  }, [isWatchlistView, watchlistStocks]);

  useEffect(() => {
    if (!isWatchlistView || !watchlistStocks || watchlistStocks.length === 0) return;
    setMarketCapShares(undefined);
    fetch("/api/market-caps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers: watchlistStocks.map((s) => s.ticker) }),
    })
      .then((r) => r.json())
      .then((d) => setMarketCapShares(d.marketCapShares ?? {}))
      .catch(() => setMarketCapShares({}));
  }, [isWatchlistView, watchlistStocks]);

  const handleAddToList = useCallback(async (ticker: string, listId: string) => {
    await addToWatchList(listId, ticker);
    // Optimistically update the in-memory tickers count isn't needed since WatchListMeta has no tickers
  }, []);

  const handleRemoveFromList = useCallback(async (ticker: string) => {
    if (!watchlistParam) return;
    await removeFromWatchList(watchlistParam, ticker);
    setWatchlistStocks((prev) => prev?.filter((s) => s.ticker !== ticker) ?? null);
  }, [watchlistParam]);

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
          S&P 500, Nasdaq 100, Dow Jones, and Russell 2000 · Data from Massive · Prices delayed 15 min
        </p>
      </div>

        {/* Time range selector */}
        <div className="sticky top-[44px] z-10 bg-slate-50 dark:bg-gray-950 -mx-4 px-4 py-1 mb-2">
          <HScrollContainer variant="page">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => navigate(isWatchlistView ? null : index, r.value, isWatchlistView ? watchlistParam! : undefined)}
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

        {/* Four-index performance snapshot — click a card to blow up its chart */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          {SUMMARY_INDICES.map((idx) => {
            const idxInfo = INDICES.find((i) => i.value === idx)!;
            const chart = summaryCharts?.[idx];
            const cp = chart?.changePercent;
            const pos = cp != null && cp >= 0;
            return (
              <button
                key={idx}
                onClick={() => setModalIndex(idx)}
                title={`${idxInfo.label} — click to enlarge`}
                className="text-left rounded-xl border px-3 py-2 transition-colors border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-700"
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Left: label + value */}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{idxInfo.label}</p>
                    {summaryCharts === null || cp == null ? (
                      <p className="mt-1 text-sm font-bold tabular-nums text-gray-300 dark:text-gray-600">···</p>
                    ) : chart?.currentValue != null ? (
                      <p className="mt-1 text-sm font-bold tabular-nums text-gray-900 dark:text-white leading-tight">
                        {chart.currentValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    ) : null}
                  </div>
                  {/* Right: % change above the sparkline */}
                  {summaryCharts !== null && cp != null && (
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p className={`text-xs font-semibold tabular-nums ${pos ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                        {pos ? "▲" : "▼"} {Math.abs(cp).toFixed(2)}%
                      </p>
                      {chart?.points && chart.points.length > 1 && (
                        <MiniSparkline
                          points={chart.points}
                          color={pos ? "#10b981" : "#ef4444"}
                          width={84}
                          height={26}
                        />
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Index selector */}
        <div className="sticky top-[84px] z-10 bg-slate-50 dark:bg-gray-950 -mx-4 px-4 pb-3 mb-2">
          <HScrollContainer variant="card" className="gap-2">
            {/* Indexes pill */}
            <div className="shrink-0 rounded-xl bg-gray-100 dark:bg-gray-900 py-1 flex">
              {INDICES.filter((idx) => idx.value !== "all").map((idx) => (
                <div
                  key={idx.value}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                    !isWatchlistView && index === idx.value
                      ? "bg-emerald-500 text-white shadow"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Link href={`/?index=${idx.value}&range=${range}`} scroll={false} onClick={() => setSectors([])} className="whitespace-nowrap">{idx.label}</Link>
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
                </div>
              ))}
            </div>
            {/* All Stocks pill */}
            {INDICES.filter((idx) => idx.value === "all").map((idx) => (
              <div key={idx.value} className="shrink-0 rounded-xl bg-gray-100 dark:bg-gray-900 py-1">
                <div className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                    !isWatchlistView && index === idx.value
                      ? "bg-emerald-500 text-white shadow"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}>
                  <Link href={`/?index=${idx.value}&range=${range}`} scroll={false} onClick={() => setSectors([])} className="whitespace-nowrap">{idx.label}</Link>
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
                </div>
              </div>
            ))}

            {/* Watchlist tabs — inside HScrollContainer so they scroll with the other tabs */}
            <div className="shrink-0 rounded-xl bg-gray-100 dark:bg-gray-900 py-1 flex items-center">
              {watchlistAuthenticated && watchlists.map((list) => (
                <Link
                  key={list.listId}
                  href={`/?watchlist=${list.listId}&range=${range}`}
                  scroll={false}
                  className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                    watchlistParam === list.listId
                      ? "bg-emerald-500 text-white shadow"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {list.name}
                </Link>
              ))}
              {watchlistAuthenticated ? (
                <Link
                  href="/watchlists"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                  title="Manage watchlists"
                >
                  {watchlists.length === 0 ? "+ New list" : "+"}
                </Link>
              ) : (
                <span
                  className="cursor-not-allowed"
                  onMouseEnter={(e) => {
                    cancelNewListTooltipHide();
                    const r = e.currentTarget.getBoundingClientRect();
                    setNewListTooltip({ right: window.innerWidth - r.right, y: r.bottom + 8 });
                  }}
                  onMouseLeave={scheduleNewListTooltipHide}
                >
                  <button
                    disabled
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-400 dark:text-gray-500 pointer-events-none"
                  >
                    + New list
                  </button>
                </span>
              )}
            </div>
          </HScrollContainer>
        </div>

        {/* Fixed-position tooltip — escapes overflow clipping */}
        {newListTooltip && (
          <div
            className="fixed z-50 w-max rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400 pointer-events-auto"
            style={{ right: newListTooltip.right, top: newListTooltip.y }}
            onMouseEnter={cancelNewListTooltipHide}
            onMouseLeave={scheduleNewListTooltipHide}
          >
            <div className="absolute -top-1.5 right-4 w-3 h-3 rotate-45 bg-white dark:bg-gray-900 border-l border-t border-gray-200 dark:border-gray-700" />
            <Link href="/login" className="pointer-events-auto text-emerald-500 hover:text-emerald-400 font-medium">Sign in</Link> to create watchlists
          </div>
        )}

        {/* Blow-up chart modal — opened by clicking a snapshot card */}
        <IndexChartModal
          isOpen={modalIndex !== null}
          onClose={() => setModalIndex(null)}
          label={INDICES.find((i) => i.value === modalIndex)?.label ?? ""}
          index={modalIndex ?? undefined}
          initialRange={range}
        />

        {/* AI Summary — hidden for All Stocks and Summary */}
        {!isWatchlistView && !isAllStocks && ((topStocks !== null && !loading && summary === null) || summaryLoading) ? (
          <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 flex items-center gap-3">
            <svg className="animate-spin h-4 w-4 text-emerald-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-gray-500 dark:text-gray-400">Generating AI summary…</span>
          </div>
        ) : !isWatchlistView && !isAllStocks && summary ? (
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
        {!isWatchlistView && !isAllStocks && <div className="mb-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-3">
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

        {/* Watchlist view */}
        {isWatchlistView && (
          <div>
            {/* Add tickers via search — shown once the list has loaded */}
            {watchlistStocks !== null && !watchlistError && watchlistParam && (
              <AddTickerSearch
                listId={watchlistParam}
                existing={watchlistStocks.map((s) => s.ticker)}
                onAdded={() => loadWatchlistStocks(false)}
                className="mb-4 max-w-md"
              />
            )}
            {watchlistStocks === null ? (
              <div className="space-y-2">
                <div className="h-5 w-36 rounded bg-gray-200 dark:bg-gray-800/50 animate-pulse mb-3" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-11 rounded-lg bg-gray-200 dark:bg-gray-800/50 animate-pulse" />
                ))}
              </div>
            ) : watchlistError ? (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 text-red-700 dark:text-red-300 text-sm">
                {watchlistError}
              </div>
            ) : watchlistStocks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">This list is empty.</p>
                <p className="text-xs text-gray-400 dark:text-gray-600">Use the search box above, or the <span className="font-medium">+</span> button on any stock row, to add tickers.</p>
              </div>
            ) : (
              <PerformerTable
                key={`watchlist-${watchlistParam}-${range}`}
                title={watchlistName}
                accent="emerald"
                stocks={watchlistStocks}
                sectors={Object.fromEntries(watchlistStocks.filter((s) => s.industry).map((s) => [s.ticker, s.industry!]))}
                betas={betas}
                showBeta={true}
                marketCapShares={marketCapShares}
                defaultSortCol="change"
                range={range}
                watchlists={watchlists}
                activeListId={watchlistParam ?? undefined}
                onAddToList={handleAddToList}
                onRemoveFromList={handleRemoveFromList}
              />
            )}
          </div>
        )}

        {!isWatchlistView && error ? (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        ) : !isWatchlistView && topStocks === null ? (
          // Full skeleton only on the very first load (no data to show yet)
          <div className="space-y-2">
            {isAllStocks && (
              <div className="flex items-center gap-2 mb-3 px-1">
                <svg className="animate-spin h-3.5 w-3.5 text-emerald-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs text-gray-500 dark:text-gray-400">Fetching stock data…</span>
              </div>
            )}
            <div className="h-5 w-36 rounded bg-gray-200 dark:bg-gray-800/50 animate-pulse mb-3" />
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-11 rounded-lg bg-gray-200 dark:bg-gray-800/50 animate-pulse" />
            ))}
          </div>
        ) : !isWatchlistView ? (
          // Subsequent index/range switches: keep the table visible, just dim it
          // while the new data loads, so it updates in place instead of flashing.
          <div className={`transition-opacity duration-200 ${(isPending || (isAllStocks && marketCapShares === undefined)) ? "opacity-50 pointer-events-none" : ""}`}>
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
              watchlists={watchlists}
              watchlistAuthenticated={watchlistAuthenticated}
              onAddToList={handleAddToList}
            />
          </div>
        ) : null}

    </div>
  );
}
