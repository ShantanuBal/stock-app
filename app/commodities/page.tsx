import { getAllMetalsData, getAllEnergyData, METALS_CONFIGS, ENERGY_CONFIGS } from "@/lib/polygon-commodities";
import CommoditiesGrid from "@/app/components/CommoditiesGrid";
import InfoTooltip from "@/app/components/InfoTooltip";

export const metadata = {
  title: "Commodities · Horizon",
  description: "Live spot prices for precious metals and energy benchmarks — gold, silver, crude oil, and natural gas. Data from Polygon and FRED.",
};
export const revalidate = 3600;

export default async function CommoditiesPage() {
  const [metalsData, energyData] = await Promise.all([
    getAllMetalsData(),
    getAllEnergyData(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-1.5 mb-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
            Commodities
          </h2>
          <InfoTooltip width="w-80">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What are commodities?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
              Commodities are raw materials and primary goods — precious metals, energy, agricultural products. Unlike stocks, they represent physical things that are produced, consumed, and traded globally.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Commodity prices are driven by supply and demand, geopolitics, weather, and currency movements. They often move differently from stocks, making them useful for portfolio diversification.
            </p>
            <a href="https://en.wikipedia.org/wiki/Commodity" target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-emerald-500 hover:text-emerald-400 underline underline-offset-2">
              Learn more on Wikipedia →
            </a>
          </InfoTooltip>
        </div>
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
      <p className="mt-2 mb-12 text-xs text-gray-400 dark:text-gray-600">
        Metals: USD per troy oz · Energy: USD per barrel / MMBtu · 1 business day lag
      </p>

      {/* Ways to Trade explainer */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
          Ways to Trade Commodities
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              number: "01",
              name: "Spot / Physical",
              color: "text-yellow-500 dark:text-yellow-400",
              description: "Actually buying the commodity itself — a gold bar, barrels of oil. Impractical for most retail investors due to storage, insurance, and delivery costs. The prices shown on this page are spot prices.",
            },
            {
              number: "02",
              name: "Futures Contracts",
              color: "text-blue-500 dark:text-blue-400",
              description: "Agreements to buy or sell a commodity at a fixed price on a future date — what actually sets the prices you see quoted. Complex due to margin requirements, monthly contract rolls, and delivery risk. See the Futures tab.",
            },
            {
              number: "03",
              name: "ETFs",
              color: "text-emerald-500 dark:text-emerald-400",
              description: "The most retail-friendly option. Physically-backed ETFs (GLD, SLV) hold the actual commodity in vaults. Futures-based ETFs (USO, UNG) hold rolling futures contracts — watch out for roll yield drag in contango markets. See the ETFs tab.",
            },
            {
              number: "04",
              name: "Producer Stocks",
              color: "text-purple-500 dark:text-purple-400",
              description: "Buying shares of companies that extract or produce commodities — miners like Newmont (gold), energy companies like ExxonMobil (oil). You get commodity exposure with added company-specific risk, often amplified due to operating leverage.",
            },
          ].map(({ number, name, color, description }) => (
            <div
              key={name}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4 flex flex-col gap-2"
            >
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold tabular-nums ${color}`}>{number}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{name}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
