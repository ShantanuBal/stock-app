import { getAllOptionsData } from "@/lib/polygon-options";
import OptionsGrid from "@/app/components/OptionsGrid";

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
