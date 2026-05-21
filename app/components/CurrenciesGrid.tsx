"use client";

import { useState } from "react";
import ForexCard from "./ForexCard";
import InfoTooltip from "./InfoTooltip";
import HScrollContainer from "./HScrollContainer";
import CurrenciesAiSummary from "./CurrenciesAiSummary";
import type { ForexRate } from "@/lib/polygon-forex";

interface PairConfig {
  symbol: string;
  name: string;
  region: string;
  ticker: string;
}

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

function UnavailableCard() {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4 flex items-center justify-center h-36">
      <p className="text-xs text-gray-400 dark:text-gray-600">Data unavailable</p>
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

interface Props {
  majorPairs: PairConfig[];
  emPairs: PairConfig[];
  crypto: PairConfig[];
  majorRates: (ForexRate | null)[];
  emRates: (ForexRate | null)[];
  cryptoRates: (ForexRate | null)[];
}

export default function CurrenciesGrid({ majorPairs, emPairs, crypto, majorRates, emRates, cryptoRates }: Props) {
  const [range, setRange] = useState<Range>("1W");

  const days = range === "YTD" ? ytdDays() : (RANGES.find((r) => r.value === range)?.days ?? 7);

  function slicePoints(data: ForexRate | null): ForexRate | null {
    if (!data) return null;
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

      <CurrenciesAiSummary range={range} />

      {/* Major Pairs */}
      <div className="mb-10">
        <SectionHeader title="Major Pairs">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What are forex pairs?</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            The foreign exchange (forex) market is where currencies are traded. A currency pair shows how much of one currency you need to buy another. EUR/USD = 1.08 means 1 Euro buys 1.08 US Dollars.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            The &quot;major&quot; pairs all involve the US Dollar and are the most heavily traded currencies in the world. They have very tight spreads and trade around the clock, 5 days a week.
          </p>
          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <p><span className="font-medium text-gray-700 dark:text-gray-300">EUR/USD</span> — Most traded pair in the world (~23% of daily forex volume)</p>
            <p><span className="font-medium text-gray-700 dark:text-gray-300">USD/JPY</span> — Key safe-haven pair, sensitive to Bank of Japan policy</p>
            <p><span className="font-medium text-gray-700 dark:text-gray-300">GBP/USD</span> — &quot;Cable&quot; — heavily influenced by UK economic data</p>
          </div>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {majorPairs.map((pair, i) => {
            const d = slicePoints(majorRates[i]);
            return d ? <ForexCard key={pair.symbol} pair={pair} data={d} fullData={majorRates[i]!} /> : <UnavailableCard key={pair.symbol} />;
          })}
        </div>
      </div>

      {/* Emerging Markets */}
      <div className="mb-10">
        <SectionHeader title="Emerging Markets">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What are emerging market currencies?</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            Emerging market (EM) currencies come from developing economies like China, India, Brazil, and Mexico. They tend to offer higher returns than developed-market currencies but with greater volatility.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            EM currencies are sensitive to commodity prices, US interest rates, and global risk appetite. When investors get nervous, they often sell EM currencies and buy &quot;safe haven&quot; assets like USD, JPY, or CHF.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {emPairs.map((pair, i) => {
            const d = slicePoints(emRates[i]);
            return d ? <ForexCard key={pair.symbol} pair={pair} data={d} fullData={emRates[i]!} /> : <UnavailableCard key={pair.symbol} />;
          })}
        </div>
      </div>

      {/* Crypto */}
      <div className="mb-10">
        <SectionHeader title="Crypto">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What is crypto?</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            Cryptocurrencies are digital assets that use cryptography to secure transactions and control the creation of new units. Unlike traditional currencies, they&apos;re decentralized — not controlled by any government or central bank.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            Bitcoin (BTC) was the first and remains the largest by market cap. Ethereum (ETH) introduced programmable &quot;smart contracts.&quot; The market trades 24/7, including weekends.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Crypto is highly volatile — price swings of 10–20% in a single day are not uncommon. It&apos;s increasingly watched alongside traditional assets as an indicator of speculative risk appetite.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {crypto.map((pair, i) => {
            const d = slicePoints(cryptoRates[i]);
            return d ? <ForexCard key={pair.symbol} pair={pair} data={d} fullData={cryptoRates[i]!} /> : <UnavailableCard key={pair.symbol} />;
          })}
        </div>
      </div>
    </>
  );
}
