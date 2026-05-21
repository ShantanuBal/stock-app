import { getAllMetalsData, getAllEnergyData, METALS_CONFIGS, ENERGY_CONFIGS } from "@/lib/polygon-commodities";
import CommoditiesGrid from "../components/CommoditiesGrid";

export const revalidate = 3600;

export const metadata = { title: "Commodities · Horizon" };

export default async function CommoditiesPage() {
  const [metalsData, energyData] = await Promise.all([
    getAllMetalsData(),
    getAllEnergyData(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 mb-1">
          Commodities
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Precious metals spot prices and energy benchmarks · Metals from Polygon · Energy from FRED · 1 business day lag
        </p>
      </div>

      <CommoditiesGrid
        metalsConfigs={METALS_CONFIGS}
        energyConfigs={ENERGY_CONFIGS}
        metalsData={metalsData}
        energyData={energyData}
      />

      <p className="mt-3 text-xs text-gray-400 dark:text-gray-600">
        Metals: USD spot prices per troy oz · Energy: USD spot prices from Federal Reserve (FRED) · Cached daily
      </p>
    </div>
  );
}
