"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import InfoTooltip from "@/app/components/InfoTooltip";
import Sparkline from "@/app/components/Sparkline";
import HScrollContainer from "@/app/components/HScrollContainer";
import type { FuturesData } from "@/lib/massive-futures";

type Range = "1M" | "3M" | "6M" | "YTD" | "1Y";

const RANGES: { label: string; value: Range; days: number }[] = [
  { label: "1 Month",  value: "1M",  days: 30  },
  { label: "3 Months", value: "3M",  days: 90  },
  { label: "6 Months", value: "6M",  days: 180 },
  { label: "YTD",      value: "YTD", days: 0   },
  { label: "1 Year",   value: "1Y",  days: 365 },
];

// Inclusive cutoff date (YYYY-MM-DD) for a range. Points are filtered by actual
// date rather than array position, so uneven history — gaps and varying point
// density across contracts — still maps to the correct calendar window.
function rangeCutoff(range: Range): string {
  const d = new Date();
  if (range === "YTD") return `${d.getFullYear()}-01-01`;
  const days = RANGES.find((r) => r.value === range)?.days ?? 90;
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function FuturesCard({ f, pageRange }: { f: FuturesData; pageRange: Range }) {
  const [expanded, setExpanded] = useState(false);
  const [range, setRange] = useState<Range>(pageRange);

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [expanded]);



  const formatPrice = (p: number) => {
    if (f.unit === "pts") return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (f.unit === "USD/oz") return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  };

  const allPoints = f.points ?? [];
  const filteredPoints = allPoints.filter((p) => p.date >= rangeCutoff(range));

  const modalChangePct = filteredPoints.length >= 2
    ? ((filteredPoints[filteredPoints.length - 1].value - filteredPoints[0].value) / filteredPoints[0].value) * 100
    : f.changePercent;
  const modalIsUp = modalChangePct >= 0;
  const modalChangeColor = modalIsUp
    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
    : "text-red-600 dark:text-red-400 bg-red-500/10";
  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? range;

  const cardPoints = allPoints.filter((p) => p.date >= rangeCutoff(pageRange));
  const cardChangePct = cardPoints.length >= 2
    ? ((cardPoints[cardPoints.length - 1].value - cardPoints[0].value) / cardPoints[0].value) * 100
    : f.changePercent;

  return (
    <>
      <div
        onClick={() => setExpanded(true)}
        className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4 cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-gray-900 dark:text-white">{f.product}</p>
            <InfoTooltip>
              <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">{f.name} ({f.ticker})</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.description}</p>
            </InfoTooltip>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-600">{f.exchange}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{f.name}</p>
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">
              {formatPrice(f.price)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{f.unit}</p>
          </div>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${cardChangePct >= 0 ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" : "text-red-600 dark:text-red-400 bg-red-500/10"}`}>
            {cardChangePct >= 0 ? "+" : ""}{cardChangePct.toFixed(2)}%
          </span>
        </div>
        {cardPoints.length > 1 && (
          <Sparkline points={cardPoints} color={cardChangePct >= 0 ? "#10b981" : "#f87171"} height={60} />
        )}
      </div>

      {expanded && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        >
          <div
            className="w-full max-w-4xl rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-600 mb-1">{f.exchange} · {f.ticker}</p>
                <p className="text-3xl font-bold tabular-nums text-gray-900 dark:text-white">
                  {formatPrice(f.price)}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${modalChangeColor}`}>
                    {modalIsUp ? "+" : ""}{modalChangePct.toFixed(2)}%
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-600">{rangeLabel} change</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{f.product}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{f.name}</p>
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

            {/* Range tabs */}
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
            {filteredPoints.length > 1
              ? <Sparkline points={filteredPoints} color={modalIsUp ? "#10b981" : "#f87171"} height={340} />
              : <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-16">No historical data available</p>
            }

            {/* Description */}
            <p className="mt-5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-4">
              {f.description}
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-4 w-10 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-3 w-12 rounded bg-gray-200 dark:bg-gray-800" />
      </div>
      <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800 mb-3" />
      <div className="flex items-end justify-between">
        <div className="h-6 w-20 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-6 w-14 rounded bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  );
}

function SectionHeader({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-500">{title}</h2>
      <InfoTooltip width="w-80">{children}</InfoTooltip>
    </div>
  );
}

export default function FuturesPage() {
  const [futures, setFutures] = useState<FuturesData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [pageRange, setPageRange] = useState<Range>("3M");

  useEffect(() => {
    fetch("/api/futures-data")
      .then((r) => r.json())
      .then((d) => setFutures(d.futures ?? []))
      .catch(() => {
        setError("Could not load futures data. Please try again.");
        setFutures([]);
      });
  }, []);

  useEffect(() => {
    if (!futures || futures.length === 0) return;
    setSummary(null);
    setSummaryLoading(true);
    setSummaryExpanded(false);
    const controller = new AbortController();
    fetch("/api/ai-futures-summary?range=1D", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setSummary(d.summary ?? null))
      .catch((e) => { if (e.name !== "AbortError") setSummary(null); })
      .finally(() => setSummaryLoading(false));
    return () => controller.abort();
  }, [futures]);

  const loading = futures === null;

  const equityFutures = futures?.filter((f) => f.category === "equity") ?? [];
  const commodityFutures = futures?.filter((f) => f.category === "commodity") ?? [];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
            Futures
          </h2>
          <InfoTooltip width="w-80">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What are futures?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
              A futures contract is an agreement to buy or sell an asset at a fixed price on a specific future date. They cover commodities, stock indices, currencies, and interest rates.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
              Futures are used by producers to lock in prices, consumers to hedge costs, and traders to speculate on direction. Equity index futures trade nearly 24 hours a day and are widely watched as a pre-market sentiment gauge.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Unlike options, futures obligate both sides to complete the trade — though in practice 99% of contracts are closed before delivery.
            </p>
            <a href="https://en.wikipedia.org/wiki/Futures_contract" target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-emerald-500 hover:text-emerald-400 underline underline-offset-2">
              Learn more on Wikipedia →
            </a>
          </InfoTooltip>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Equity index, commodity, and interest rate futures · Data from Massive · Front-month contracts · Prices delayed
        </p>
      </div>

      {/* Time range selector */}
      <div className="sticky top-[44px] z-10 bg-slate-50 dark:bg-gray-950 -mx-4 px-4 py-1 mb-4">
        <HScrollContainer variant="page">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setPageRange(r.value)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                pageRange === r.value
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

      {/* AI Summary */}
      {(summaryLoading || summary) && (
        <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">AI Summary</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">· Claude · Not financial advice</span>
          </div>
          {summaryLoading && !summary ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-3.5 w-3.5 text-emerald-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">Generating summary…</span>
            </div>
          ) : (
            <>
              <div className={`space-y-3 ${summaryExpanded ? "" : "line-clamp-5"}`}>
                {(summary ?? "").split("\n\n").map((para, i) => (
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
            </>
          )}
        </div>
      )}

      {error ? (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      ) : (
        <div className="space-y-10">
          {/* Equity Index Futures */}
          <div>
            <SectionHeader title="Equity Index Futures">
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Equity index futures</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                Futures on stock market indices like the S&P 500 and Nasdaq 100. They trade nearly 24 hours a day, making them the go-to signal for pre-market and overnight sentiment.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                If S&P 500 futures (ES) are up 0.5% before the market opens, it signals stocks will likely open higher. Major news events — Fed decisions, earnings — are often priced in through futures before regular trading hours begin.
              </p>
            </SectionHeader>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                : equityFutures.map((f) => <FuturesCard key={f.product} f={f} pageRange={pageRange} />)
              }
            </div>
          </div>

          {/* Commodity Futures */}
          <div>
            <SectionHeader title="Commodity Futures">
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Commodity futures</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                These are the contracts that set the prices you see quoted for oil, gold, and natural gas. The &quot;front month&quot; contract — the nearest expiry — is treated as the de facto spot price by most financial media.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Commodity futures trade on exchanges like NYMEX (energy) and COMEX (metals). Each contract represents a standardised quantity — one CL contract = 1,000 barrels of crude oil.
              </p>
            </SectionHeader>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                : commodityFutures.map((f) => <FuturesCard key={f.product} f={f} pageRange={pageRange} />)
              }
            </div>
          </div>

        </div>
      )}

      {/* Key concepts explainer */}
      <div className="mt-12">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
          Key Futures Concepts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            {
              symbol: "×",
              name: "Leverage",
              measures: "Amplified exposure",
              description: "Futures require only a margin deposit — a fraction of the contract's notional value. An ES (S&P 500) contract controls ~$230k of exposure for ~$12k of margin. Gains and losses are magnified proportionally. A 1% move in the index becomes a ~20% move on your margin.",
              color: "text-emerald-500 dark:text-emerald-400",
            },
            {
              symbol: "◻",
              name: "Margin",
              measures: "Performance bond",
              description: "Margin in futures is not a loan — it's a good-faith deposit held by the exchange. Initial margin is required to open a position; maintenance margin is the minimum to keep it open. If your account falls below maintenance margin, you get a margin call and must top up immediately or be liquidated.",
              color: "text-blue-500 dark:text-blue-400",
            },
            {
              symbol: "↻",
              name: "Expiry & Roll",
              measures: "Contract lifecycle",
              description: "Every futures contract has a fixed expiry date. Traders who want to maintain continuous exposure must \"roll\" — closing the expiring contract and opening the next one before expiry. Roll dates are published in advance. Failing to roll a physical commodity contract could result in actual delivery obligation.",
              color: "text-orange-500 dark:text-orange-400",
            },
            {
              symbol: "↗",
              name: "Contango",
              measures: "Futures > spot price",
              description: "When the futures price is higher than the current spot price. Normal for commodities with storage costs — you're paying a premium to take delivery later. For ETFs that hold rolling futures (like USO), contango creates \"roll drag\" that slowly erodes returns over time even if the spot price stays flat.",
              color: "text-purple-500 dark:text-purple-400",
            },
            {
              symbol: "↘",
              name: "Backwardation",
              measures: "Futures < spot price",
              description: "When the futures price is below the current spot price. Often signals near-term supply tightness — buyers prefer immediate delivery. Backwardation benefits rolling ETF holders because they sell expiring contracts at a premium and buy the next at a discount, creating positive roll yield.",
              color: "text-red-500 dark:text-red-400",
            },
          ].map(({ symbol, name, measures, description, color }) => (
            <div
              key={name}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4 flex flex-col gap-2"
            >
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold tabular-nums ${color}`}>{symbol}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{name}</span>
              </div>
              <p className={`text-xs font-medium ${color}`}>{measures}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
