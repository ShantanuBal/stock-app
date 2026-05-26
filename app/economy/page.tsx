import { getAllIndicators, INDICATOR_CONFIGS } from "@/lib/fred";
import EconomyGrid from "../components/EconomyGrid";
import InfoTooltip from "../components/InfoTooltip";

export const revalidate = 3600;

export const metadata = {
  title: "Economy · Horizon",
  description: "Track key US economic indicators — GDP growth, inflation, unemployment, interest rates, and more. Data from FRED, updated daily.",
};

export default async function EconomyPage() {
  const results = await getAllIndicators();

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
            US Economic Indicators
          </h2>
          <InfoTooltip width="w-80">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What are economic indicators?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
              Macroeconomic indicators measure the overall health and direction of an economy. They tell you whether growth is accelerating or slowing, whether inflation is under control, and how tight or loose the labor market is.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              These numbers directly drive central bank policy (like Fed rate decisions), corporate earnings expectations, and valuations across equities, bonds, and currencies.
            </p>
            <a href="https://en.wikipedia.org/wiki/Economic_indicator" target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-emerald-500 hover:text-emerald-400 underline underline-offset-2">
              Learn more on Wikipedia →
            </a>
          </InfoTooltip>
        </div>
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
