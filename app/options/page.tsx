import { getAllOptionsData } from "@/lib/polygon-options";
import OptionsGrid from "@/app/components/OptionsGrid";
import InfoTooltip from "@/app/components/InfoTooltip";

export const metadata = { title: "Options · Horizon" };
export const revalidate = 3600;

export default async function OptionsPage() {
  const { stocks, etfs, volatility } = await getAllOptionsData();

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-1.5 mb-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
            Options
          </h2>
          <InfoTooltip width="w-80">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What are options?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
              An option is a contract that gives you the right — but not the obligation — to buy (call) or sell (put) an asset at a set price before a specific date. You pay a premium for that right.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              This tab shows premiums for <span className="font-medium text-gray-700 dark:text-gray-300">at-the-money (ATM)</span> contracts — where the strike price is closest to the current market price. ATM options are the most actively traded and are the best proxy for how expensive optionality is on a given stock.
            </p>
            <a href="https://en.wikipedia.org/wiki/Option_(finance)" target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-emerald-500 hover:text-emerald-400 underline underline-offset-2">
              Learn more on Wikipedia →
            </a>
          </InfoTooltip>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Premium history for at-the-money monthly contracts · Data from Polygon · Updated daily
        </p>
      </div>

      <OptionsGrid stocks={stocks} etfs={etfs} volatility={volatility} />

      <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
        Data from Polygon · End-of-day premiums · Updated daily
      </p>
    </div>
  );
}
