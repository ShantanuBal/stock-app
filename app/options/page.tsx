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
        <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 mb-1">
          Options
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          Premium history for at-the-money monthly contracts · Data from Polygon · Updated daily
          <InfoTooltip width="w-72">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">At-the-money (ATM)</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              An option is at-the-money when its strike price is closest to the current market price of the underlying asset. ATM options are the most actively traded and carry the most time value — making them the best proxy for how expensive optionality is on a given stock.
            </p>
          </InfoTooltip>
        </p>
      </div>

      <OptionsGrid stocks={stocks} etfs={etfs} volatility={volatility} />

      <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
        Data from Polygon · End-of-day premiums · Updated daily
      </p>
    </div>
  );
}
