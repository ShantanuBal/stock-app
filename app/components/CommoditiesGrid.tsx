"use client";

import { useState } from "react";
import CommodityCard from "./CommodityCard";
import InfoTooltip from "./InfoTooltip";
import HScrollContainer from "./HScrollContainer";
import FuturesAiSummary from "./FuturesAiSummary";
import type { CommodityConfig, CommodityData } from "@/lib/polygon-commodities";

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
  metalsConfigs: CommodityConfig[];
  energyConfigs: CommodityConfig[];
  metalsData: (CommodityData | null)[];
  energyData: (CommodityData | null)[];
}

export default function CommoditiesGrid({ metalsConfigs, energyConfigs, metalsData, energyData }: Props) {
  const [range, setRange] = useState<Range>("1M");

  const days = range === "YTD" ? ytdDays() : (RANGES.find((r) => r.value === range)?.days ?? 30);

  function sliceData(data: CommodityData | null): CommodityData | null {
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

      <FuturesAiSummary range={range} />

      {/* Energy */}
      <div className="mb-10">
        <SectionHeader title="Energy">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Energy commodity prices</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
            Energy prices are among the most watched economic indicators — crude oil feeds directly into gasoline, plastics, and transportation costs, while natural gas affects electricity generation and heating bills globally.
          </p>
          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <p><span className="font-medium text-gray-700 dark:text-gray-300">WTI Crude</span> — US benchmark (NYMEX), delivered at Cushing, Oklahoma</p>
            <p><span className="font-medium text-gray-700 dark:text-gray-300">Brent Crude</span> — International benchmark (North Sea), used to price most OPEC exports</p>
            <p><span className="font-medium text-gray-700 dark:text-gray-300">Natural Gas</span> — Henry Hub spot price, the US benchmark for gas</p>
          </div>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {energyConfigs.map((config, i) => {
            const d = sliceData(energyData[i]);
            return d
              ? <CommodityCard key={config.ticker} data={d} fullData={energyData[i]!} />
              : <UnavailableCard key={config.ticker} />;
          })}
        </div>
      </div>

      {/* Precious Metals */}
      <div className="mb-10">
        <SectionHeader title="Precious Metals">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Precious metals spot prices</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
            Precious metals serve as stores of value, industrial inputs, and safe-haven assets. Gold in particular tends to rise when real interest rates fall, the dollar weakens, or investors seek safety during market stress.
          </p>
          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <p><span className="font-medium text-gray-700 dark:text-gray-300">Gold (XAU/USD)</span> — USD per troy oz · safe haven, central bank reserve asset</p>
            <p><span className="font-medium text-gray-700 dark:text-gray-300">Silver (XAG/USD)</span> — USD per troy oz · industrial (solar panels, electronics) + monetary</p>
            <p><span className="font-medium text-gray-700 dark:text-gray-300">Platinum (XPT/USD)</span> — USD per troy oz · catalytic converters, hydrogen fuel cells</p>
            <p><span className="font-medium text-gray-700 dark:text-gray-300">Palladium (XPD/USD)</span> — USD per troy oz · gasoline engine catalytic converters</p>
          </div>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metalsConfigs.map((config, i) => {
            const d = sliceData(metalsData[i]);
            return d
              ? <CommodityCard key={config.ticker} data={d} fullData={metalsData[i]!} />
              : <UnavailableCard key={config.ticker} />;
          })}
        </div>
      </div>

    </>
  );
}
