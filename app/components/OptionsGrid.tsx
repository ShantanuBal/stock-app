"use client";

import { useState } from "react";
import OptionCard from "./OptionCard";
import InfoTooltip from "./InfoTooltip";
import type { OptionData } from "@/lib/polygon-options";

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

function SectionHeader({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-500">{title}</h2>
      <InfoTooltip width="w-80">{children}</InfoTooltip>
    </div>
  );
}

function UnderlyingRows({ contracts, sliceData }: { contracts: OptionData[]; sliceData: (d: OptionData) => OptionData }) {
  const groups = Array.from(
    new Map(contracts.map((d) => [d.underlying, contracts.filter((s) => s.underlying === d.underlying)])).entries()
  );
  return (
    <div className="space-y-4">
      {groups.map(([underlying, group]) => (
        <div key={underlying}>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2">
            {underlying} — {group[0].name}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {group.map((d) => <OptionCard key={d.ticker} data={sliceData(d)} fullData={d} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

interface Props {
  stocks: OptionData[];
  etfs: OptionData[];
  volatility: OptionData[];
}

export default function OptionsGrid({ stocks, etfs, volatility }: Props) {
  const [range, setRange] = useState<Range>("1M");
  const [filter, setFilter] = useState<string>("All");

  const stockUnderlyings = ["All", ...Array.from(new Set(stocks.map((d) => d.underlying)))];
  const filteredStocks = filter === "All" ? stocks : stocks.filter((d) => d.underlying === filter);

  const days = range === "YTD" ? ytdDays() : (RANGES.find((r) => r.value === range)?.days ?? 30);

  function sliceData(data: OptionData): OptionData {
    const sliced = data.points.slice(-days);
    if (sliced.length < 2) return { ...data, points: sliced };
    const first = sliced[0].value;
    const last = sliced[sliced.length - 1].value;
    const change = last - first;
    const changePct = (change / first) * 100;
    return { ...data, points: sliced, change, changePct };
  }

  return (
    <>
      {/* Period tabs */}
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

      {/* Volatility */}
      <div className="mb-10">
        <SectionHeader title="Volatility">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Options on volatility</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            VIX options are unique — the underlying is volatility itself, not a stock. A VIX call profits when the market gets fearful and volatile. Traders use them as a &quot;crash hedge.&quot;
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            VIX options behave inversely to equities — when stocks sell off, VIX spikes and VIX calls become very valuable. This makes them a powerful portfolio protection tool.
          </p>
        </SectionHeader>
        <UnderlyingRows contracts={volatility} sliceData={sliceData} />
      </div>

      {/* Index ETFs */}
      <div className="mb-10">
        <SectionHeader title="Index ETFs">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Options on index ETFs</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            SPY and QQQ are the two most actively traded ETFs in the world, and their options are equally liquid. Institutions use these heavily for hedging broad market exposure.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            A call on SPY is a bet the S&P 500 goes up. A put on SPY is a bet (or hedge) that it goes down. Watching the put/call ratio on SPY is a key indicator of market sentiment.
          </p>
        </SectionHeader>
        <UnderlyingRows contracts={etfs} sliceData={sliceData} />
      </div>

      {/* Single Stocks */}
      <div className="mb-10">
        <SectionHeader title="Single Stocks">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Options on individual stocks</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            These are the most actively traded single-stock options. Each card shows the premium (price) for a specific contract — the call or put closest to the current stock price (at-the-money).
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            The premium rises when traders expect bigger moves in the underlying stock, and falls as the contract approaches expiry with no movement (theta decay).
          </p>
        </SectionHeader>
        <div className="mb-4 flex flex-wrap gap-2">
          {stockUnderlyings.map((u) => (
            <button
              key={u}
              onClick={() => setFilter(u)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === u
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
        <UnderlyingRows contracts={filteredStocks} sliceData={sliceData} />
      </div>
    </>
  );
}
