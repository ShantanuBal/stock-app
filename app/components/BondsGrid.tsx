"use client";

import { useState } from "react";
import IndicatorCard from "./IndicatorCard";
import BondsAiSummary from "./BondsAiSummary";
import YieldCurveChart from "./YieldCurveChart";
import InfoTooltip from "./InfoTooltip";
import HScrollContainer from "./HScrollContainer";
import type { BondIndicatorConfig } from "@/lib/fred-bonds";
import type { IndicatorResult } from "@/lib/fred";
import { TREASURY_CONFIGS, CREDIT_CONFIGS } from "@/lib/fred-bonds";

type Range = "1D" | "3D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "YTD";

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

const RANGE_CHANGE_LABELS: Record<string, string> = {
  "1D": "vs prev day", "3D": "vs 3 days ago", "1W": "vs 1 week ago",
  "1M": "vs 1 month ago", "3M": "vs 3 months ago", "6M": "vs 6 months ago",
  "1Y": "vs 1 year ago", "YTD": "vs start of year",
};

function ytdDays(): number {
  const now = new Date();
  return Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000);
}

function sliceResult(result: IndicatorResult | null, days: number): IndicatorResult | null {
  if (!result) return null;
  const sliced = result.points.slice(-days);
  if (sliced.length < 2) return { ...result, points: sliced };
  return { ...result, points: sliced, change: sliced[sliced.length - 1].value - sliced[0].value };
}

function UnavailableCard() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4 flex items-center justify-center h-32">
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
  treasuries: (IndicatorResult | null)[];
  credit: (IndicatorResult | null)[];
}

export default function BondsGrid({ treasuries, credit }: Props) {
  const [range, setRange] = useState<Range>("1M");

  const days = range === "YTD" ? ytdDays() : (RANGES.find((r) => r.value === range)?.days ?? 30);
  const changeLabel = RANGE_CHANGE_LABELS[range] ?? "vs prev period";

  const curvePoints = TREASURY_CONFIGS
    .map((c, i) => ({ label: c.maturityLabel!, yield: treasuries[i]?.value ?? null }))
    .filter((p): p is { label: string; yield: number } => p.yield != null);

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

      <BondsAiSummary range={range} />

      {/* Yield Curve */}
      <div className="mb-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-5">
        <div className="flex items-center gap-2 mb-4">
          <p className="text-sm font-bold text-gray-900 dark:text-white">US Treasury Yield Curve</p>
          <InfoTooltip>
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What is the yield curve?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
              The yield curve plots interest rates across different maturities — from 3-month bills to 30-year bonds. Normally it slopes upward: longer loans demand higher rates to compensate for more risk and uncertainty over time.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Normal</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Long-term rates higher than short-term — the typical healthy state.</p>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2">
                <p className="text-xs font-semibold text-red-500 mb-1">Inverted</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Short-term rates higher — has preceded every US recession since the 1950s.</p>
              </div>
            </div>
          </InfoTooltip>
        </div>
        {curvePoints.length > 0 ? (
          <YieldCurveChart points={curvePoints} />
        ) : (
          <div className="h-40 flex items-center justify-center">
            <p className="text-xs text-gray-400 dark:text-gray-600">Data unavailable</p>
          </div>
        )}
      </div>

      {/* Treasury Yields */}
      <div className="mb-10">
        <SectionHeader title="Treasury Yields">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Why do Treasury yields matter?</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
            Treasury yields are the benchmark for all borrowing costs — mortgages, auto loans, and corporate bonds are all priced relative to Treasuries.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            The <span className="font-medium text-gray-700 dark:text-gray-300">10-year yield</span> is the most watched — it has an inverse relationship with stock valuations. The <span className="font-medium text-gray-700 dark:text-gray-300">2-year</span> closely tracks Fed policy expectations.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TREASURY_CONFIGS.map((config: BondIndicatorConfig, i) => {
            const sliced = sliceResult(treasuries[i], days);
            return sliced
              ? <IndicatorCard key={config.id} config={{ ...config, changeLabel }} result={sliced} />
              : <UnavailableCard key={config.id} />;
          })}
        </div>
      </div>

      {/* Credit & Inflation */}
      <div className="mb-10">
        <SectionHeader title="Credit & Inflation">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Credit spreads and inflation expectations</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
            A <span className="font-medium text-gray-700 dark:text-gray-300">credit spread</span> is the extra yield investors demand for corporate vs government debt. Wider = more fear of defaults.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            The <span className="font-medium text-gray-700 dark:text-gray-300">10-year breakeven</span> (nominal yield minus TIPS yield) is the bond market&apos;s best estimate of long-run inflation.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CREDIT_CONFIGS.map((config: BondIndicatorConfig, i) => {
            const sliced = sliceResult(credit[i], days);
            return sliced
              ? <IndicatorCard key={config.id} config={{ ...config, changeLabel }} result={sliced} />
              : <UnavailableCard key={config.id} />;
          })}
        </div>
      </div>
    </>
  );
}
