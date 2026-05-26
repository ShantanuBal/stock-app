"use client";

import { useState, useEffect, useTransition } from "react";
import type { StockResult } from "@/lib/polygon";
import PerformerTable from "@/app/components/PerformerTable";
import InfoTooltip from "@/app/components/InfoTooltip";
import HScrollContainer from "@/app/components/HScrollContainer";
import {
  BROAD_MARKET, SECTOR_ETFS, BOND_ETFS, COMMODITY_ETFS, INTERNATIONAL_ETFS,
  ETF_CATEGORY_MAP, CATEGORY_LABELS,
  type ETFCategory,
} from "@/lib/etf-config";

type TimeRange = "1D" | "3D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "YTD";

const RANGES: { label: string; value: TimeRange }[] = [
  { label: "1 Day",    value: "1D"  },
  { label: "3 Days",   value: "3D"  },
  { label: "1 Week",   value: "1W"  },
  { label: "1 Month",  value: "1M"  },
  { label: "3 Months", value: "3M"  },
  { label: "6 Months", value: "6M"  },
  { label: "1 Year",   value: "1Y"  },
  { label: "5 Years",  value: "5Y"  },
  { label: "YTD",      value: "YTD" },
];

const SECTIONS: {
  key: ETFCategory;
  label: string;
  description: string;
  tickers: Set<string>;
}[] = [
  {
    key: "broad",
    label: "Broad Market",
    description: "Tracks entire markets or major indices. One purchase gives instant diversification across hundreds of companies. SPY and QQQ are among the most traded securities in the world.",
    tickers: new Set(BROAD_MARKET.map((e) => e.symbol)),
  },
  {
    key: "sector",
    label: "Sectors",
    description: "The S&P 500 is divided into 11 GICS sectors. Sector ETFs let you overweight or underweight specific parts of the economy — sectors rotate with the economic cycle.",
    tickers: new Set(SECTOR_ETFS.map((e) => e.symbol)),
  },
  {
    key: "bonds",
    label: "Bonds",
    description: "Bond ETFs hold fixed income securities. TLT is highly rate-sensitive; AGG is broad investment-grade; HYG gives high-yield exposure but behaves more like equities in a downturn.",
    tickers: new Set(BOND_ETFS.map((e) => e.symbol)),
  },
  {
    key: "commodities",
    label: "Commodities",
    description: "Commodity ETFs provide exposure without futures accounts or physical storage. GLD and SLV are physically-backed; USO and UNG hold rolling futures contracts subject to roll yield drag.",
    tickers: new Set(COMMODITY_ETFS.map((e) => e.symbol)),
  },
  {
    key: "international",
    label: "International",
    description: "Exposure to markets outside the US. EFA covers developed markets (Europe, Japan, Australia); EEM covers emerging markets. A strong dollar drags returns when converted back to USD.",
    tickers: new Set(INTERNATIONAL_ETFS.map((e) => e.symbol)),
  },
];

const categoryMap = Object.fromEntries(
  Object.entries(ETF_CATEGORY_MAP).map(([ticker, cat]) => [ticker, CATEGORY_LABELS[cat as ETFCategory] ?? cat])
);

export default function ETFsPage() {
  const [range, setRange] = useState<TimeRange>("1W");
  const [etfs, setEtfs] = useState<StockResult[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const loading = etfs === null || isPending;

  useEffect(() => {
    startTransition(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/etf-performers?range=${range}&category=all`);
        if (!res.ok) throw new Error("Failed to fetch ETF data");
        const json = await res.json();
        setEtfs(json.etfs ?? []);
      } catch {
        setError("Could not load ETF data. Please try again.");
        setEtfs((prev) => prev ?? []);
      }
    });
  }, [range]);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
            ETFs
          </h2>
          <InfoTooltip width="w-80">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What is an ETF?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
              An Exchange-Traded Fund (ETF) is a basket of assets — stocks, bonds, commodities — that trades on an exchange like a single stock. Buy one share of SPY and you&apos;re instantly diversified across 500 companies.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              ETFs combine the diversification of mutual funds with the flexibility of stocks — they trade throughout the day, have low fees, and are transparent about their holdings.
            </p>
            <a href="https://en.wikipedia.org/wiki/Exchange-traded_fund" target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-emerald-500 hover:text-emerald-400 underline underline-offset-2">
              Learn more on Wikipedia →
            </a>
          </InfoTooltip>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Broad market, sector, bond, commodity, and international ETFs · Data from Polygon · Prices delayed 15 min
        </p>
      </div>

      {/* Time range selector */}
      <div className="sticky top-[44px] z-10 bg-slate-50 dark:bg-gray-950 -mx-4 px-4 py-1 mb-6">
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

      {error ? (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      ) : (
        <div className="space-y-10">
          {SECTIONS.map((section) => {
            const sectionEtfs = loading ? [] : (etfs ?? []).filter((e) => section.tickers.has(e.ticker));
            return (
              <div key={section.key}>
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800/50 animate-pulse mb-3" />
                    {Array.from({ length: section.tickers.size }).map((_, i) => (
                      <div key={i} className="h-11 rounded-lg bg-gray-200 dark:bg-gray-800/50 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <PerformerTable
                    key={`${section.key}-${range}`}
                    title={section.label}
                    titleExtra={
                      <InfoTooltip>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{section.description}</p>
                      </InfoTooltip>
                    }
                    accent="emerald"
                    stocks={sectionEtfs}
                    sectors={categoryMap}
                    showBeta={false}
                    showSector={false}
                    defaultSortCol="change"
                    range={range}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ETF concepts explainer */}
      <div className="mt-12">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
          Understanding ETFs
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            {
              symbol: "%",
              name: "Expense Ratio",
              measures: "Annual fund cost",
              description: "The yearly fee deducted from fund assets, expressed as a percentage. SPY charges 0.09%; an actively managed ETF might charge 0.75%. A seemingly small difference compounds significantly over decades — a 1% fee on a $100k portfolio costs over $30k over 30 years.",
              color: "text-emerald-500 dark:text-emerald-400",
            },
            {
              symbol: "≈",
              name: "NAV",
              measures: "True per-share value",
              description: "Net Asset Value is the per-share value of the fund's actual holdings. ETF market prices stay very close to NAV because authorized participants arbitrage away any gap. A premium means the ETF trades above its holdings' value; a discount means below.",
              color: "text-blue-500 dark:text-blue-400",
            },
            {
              symbol: "σ",
              name: "Tracking Error",
              measures: "Benchmark deviation",
              description: "How closely an ETF follows its benchmark index over time. Differences arise from fees, dividend reinvestment timing, and sampling. Lower tracking error is better for passive investors — it means you're getting what the index delivered, minus costs.",
              color: "text-orange-500 dark:text-orange-400",
            },
            {
              symbol: "↔",
              name: "Bid-Ask Spread",
              measures: "Hidden trading cost",
              description: "The difference between what buyers pay and sellers receive. For liquid ETFs like SPY, the spread is fractions of a cent. For thinly traded ETFs it can be 0.5% or more — a cost paid on every trade. Use limit orders to avoid paying the full spread.",
              color: "text-purple-500 dark:text-purple-400",
            },
            {
              symbol: "↓",
              name: "Distribution Yield",
              measures: "Income paid out",
              description: "The income (dividends, interest) distributed to shareholders, expressed as an annualized percentage of price. Bond ETFs like AGG pay monthly; equity ETFs like SPY pay quarterly. Distributions are taxable in non-retirement accounts even if you reinvest them.",
              color: "text-pink-500 dark:text-pink-400",
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
