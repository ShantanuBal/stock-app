"use client";

import { useState } from "react";
import IndicatorCard from "./IndicatorCard";
import EconomyAiSummary from "./EconomyAiSummary";
import HScrollContainer from "./HScrollContainer";
import type { IndicatorConfig, IndicatorResult } from "@/lib/fred";

type Range = "6M" | "1Y" | "2Y";

const RANGES: { label: string; value: Range; days: number }[] = [
  { label: "6 Months", value: "6M", days: 180 },
  { label: "1 Year",   value: "1Y", days: 365 },
  { label: "2 Years",  value: "2Y", days: 730 },
];

const RANGE_CHANGE_LABELS: Record<string, string> = {
  "6M": "vs 6 months ago",
  "1Y": "vs 1 year ago",
  "2Y": "vs 2 years ago",
};

function sliceResult(result: IndicatorResult | null, days: number): IndicatorResult | null {
  if (!result) return null;
  const sliced = result.points.slice(-days);
  if (sliced.length < 2) return { ...result, points: sliced };
  return { ...result, points: sliced, change: sliced[sliced.length - 1].value - sliced[0].value };
}

interface Props {
  configs: IndicatorConfig[];
  results: (IndicatorResult | null)[];
}

export default function EconomyGrid({ configs, results }: Props) {
  const [range, setRange] = useState<Range>("1Y");

  const days = RANGES.find((r) => r.value === range)?.days ?? 365;
  const changeLabel = RANGE_CHANGE_LABELS[range] ?? "vs prev period";

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
              {r.label}
            </button>
          ))}
        </HScrollContainer>
      </div>

      <EconomyAiSummary range={range} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {configs.map((config, i) => {
          const sliced = sliceResult(results[i], days);
          if (!sliced) {
            return (
              <div key={config.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4 flex items-center justify-center h-32">
                <p className="text-xs text-gray-400 dark:text-gray-600">Data unavailable</p>
              </div>
            );
          }
          return <IndicatorCard key={config.id} config={{ ...config, changeLabel }} result={sliced} />;
        })}
      </div>
    </>
  );
}
