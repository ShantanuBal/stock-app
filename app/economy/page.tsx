import { getAllIndicators, INDICATOR_CONFIGS } from "@/lib/fred";
import EconomyGrid from "../components/EconomyGrid";

export const revalidate = 3600;

export const metadata = { title: "Economy · Horizon" };

export default async function EconomyPage() {
  const results = await getAllIndicators();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 mb-1">
          US Economic Indicators
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Key measures of macroeconomic health · Data from FRED (Federal Reserve Bank of St. Louis) · Updated monthly
        </p>
      </div>

      <EconomyGrid configs={INDICATOR_CONFIGS} results={results} />

      <p className="mt-6 text-xs text-gray-400 dark:text-gray-600">
        Data from FRED (Federal Reserve Bank of St. Louis) · Cached daily
      </p>
    </div>
  );
}
