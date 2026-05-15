import { getAllIndicators, INDICATOR_CONFIGS } from "@/lib/fred";
import IndicatorCard from "../components/IndicatorCard";
import EconomyAiSummary from "../components/EconomyAiSummary";

export const revalidate = 3600; // ISR: revalidate every hour

export default async function EconomyPage() {
  const results = await getAllIndicators();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 mb-1">
          US Economic Indicators
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Key measures of macroeconomic health · Data from FRED (Federal Reserve Bank of St. Louis) · Updated monthly
        </p>
      </div>

      <EconomyAiSummary />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {INDICATOR_CONFIGS.map((config, i) => {
          const result = results[i];
          if (!result) {
            return (
              <div
                key={config.id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4 flex items-center justify-center h-32"
              >
                <p className="text-xs text-gray-400 dark:text-gray-600">Data unavailable</p>
              </div>
            );
          }
          return <IndicatorCard key={config.id} config={config} result={result} />;
        })}
      </div>

      <p className="mt-6 text-xs text-gray-400 dark:text-gray-600">
        Data from FRED (Federal Reserve Bank of St. Louis) · Cached daily
      </p>
    </div>
  );
}
