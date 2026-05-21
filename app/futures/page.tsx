import InfoTooltip from "@/app/components/InfoTooltip";
import CommoditiesGrid from "@/app/components/CommoditiesGrid";
import { getAllMetalsData, getAllEnergyData, METALS_CONFIGS, ENERGY_CONFIGS } from "@/lib/polygon-commodities";

export const revalidate = 3600;

export const metadata = { title: "Futures · Horizon" };

const EQUITY_FUTURES = [
  { symbol: "ES", name: "S&P 500 Futures",    exchange: "CME"  },
  { symbol: "NQ", name: "Nasdaq 100 Futures", exchange: "CME"  },
  { symbol: "YM", name: "Dow Jones Futures",  exchange: "CBOT" },
  { symbol: "RTY", name: "Russell 2000",      exchange: "CME"  },
];

const RATE_FUTURES = [
  { symbol: "ZN", name: "10-Year T-Note", exchange: "CBOT" },
  { symbol: "ZB", name: "30-Year T-Bond", exchange: "CBOT" },
  { symbol: "ZF", name: "5-Year T-Note",  exchange: "CBOT" },
  { symbol: "ZT", name: "2-Year T-Note",  exchange: "CBOT" },
];

function PlaceholderCard({ symbol, name, exchange }: { symbol: string; name: string; exchange: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{symbol}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{name}</p>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-600">{exchange}</span>
      </div>
      <div className="flex items-end justify-between">
        <div className="space-y-1.5">
          <div className="h-5 w-20 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-3.5 w-14 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-8 w-16 rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    </div>
  );
}

function SectionHeader({ title, badge, children }: { title: string; badge?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-500">{title}</h2>
      {badge && (
        <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-400 dark:text-gray-500">
          Coming soon
        </span>
      )}
      <InfoTooltip width="w-80">{children}</InfoTooltip>
    </div>
  );
}

export default async function FuturesPage() {
  const [metalsData, energyData] = await Promise.all([
    getAllMetalsData(),
    getAllEnergyData(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 mb-1">
          Futures & Commodities
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Commodity spot prices and futures contracts · Metals from Polygon · Energy from FRED · Equity & rate futures coming soon
        </p>
      </div>

      {/* Commodities — live */}
      <CommoditiesGrid
        metalsConfigs={METALS_CONFIGS}
        energyConfigs={ENERGY_CONFIGS}
        metalsData={metalsData}
        energyData={energyData}
      />

      {/* Equity Index Futures */}
      <div className="mb-10">
        <SectionHeader title="Equity Index Futures" badge>
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What are equity index futures?</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            A futures contract is an agreement to buy or sell something at a set price on a future date. Equity index futures let traders bet on — or hedge against — the future value of a stock index like the S&P 500.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            They trade nearly 24 hours a day, so they&apos;re often used to gauge market sentiment outside regular trading hours. If S&P 500 futures are up before the market opens, it&apos;s a signal that stocks may open higher.
          </p>
          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <p><span className="font-medium text-gray-700 dark:text-gray-300">ES</span> — E-mini S&P 500 (most traded futures contract in the world)</p>
            <p><span className="font-medium text-gray-700 dark:text-gray-300">NQ</span> — E-mini Nasdaq 100</p>
            <p><span className="font-medium text-gray-700 dark:text-gray-300">YM</span> — E-mini Dow Jones</p>
            <p><span className="font-medium text-gray-700 dark:text-gray-300">RTY</span> — E-mini Russell 2000</p>
          </div>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EQUITY_FUTURES.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>

      {/* Interest Rate Futures */}
      <div className="mb-10">
        <SectionHeader title="Interest Rate Futures" badge>
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What are interest rate futures?</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            These futures track US Treasury bonds and notes. Their prices move inversely to interest rates — when rates are expected to rise, Treasury prices fall, and vice versa.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            They&apos;re used by banks, pension funds, and hedge funds to manage exposure to interest rate movements. Watching these gives you a window into what the market expects the Fed to do next.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {RATE_FUTURES.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400 dark:text-gray-600">
        Metals: USD spot prices per troy oz · Energy: USD spot prices from Federal Reserve (FRED) · Cached daily
      </p>
    </div>
  );
}
