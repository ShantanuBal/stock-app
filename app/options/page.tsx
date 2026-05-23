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

      {/* Greeks explainer */}
      <div className="mt-12">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
          Understanding the Greeks
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            {
              symbol: "Δ",
              name: "Delta",
              measures: "Price sensitivity",
              description: "How much the premium moves per $1 change in the underlying. Calls range from 0 to +1; puts from −1 to 0. An ATM option has a delta of roughly ±0.50, meaning it gains or loses about $0.50 for every $1 the stock moves.",
              color: "text-emerald-500 dark:text-emerald-400",
            },
            {
              symbol: "Γ",
              name: "Gamma",
              measures: "Delta sensitivity",
              description: "How fast delta itself changes as the stock moves. High gamma means your delta — and therefore your exposure — shifts quickly. ATM options near expiry carry the most gamma, amplifying both gains and losses.",
              color: "text-blue-500 dark:text-blue-400",
            },
            {
              symbol: "Θ",
              name: "Theta",
              measures: "Time decay",
              description: "How much value the option loses each day as expiration approaches. Always negative for buyers. ATM options decay the fastest in their final weeks — all else equal, every day you hold an option it becomes slightly cheaper.",
              color: "text-orange-500 dark:text-orange-400",
            },
            {
              symbol: "V",
              name: "Vega",
              measures: "Volatility sensitivity",
              description: "How much the premium changes for each 1% move in implied volatility (IV). When the market gets nervous and IV spikes, option prices rise even if the stock hasn't moved. Longer-dated options carry more vega.",
              color: "text-purple-500 dark:text-purple-400",
            },
            {
              symbol: "ρ",
              name: "Rho",
              measures: "Rate sensitivity",
              description: "How much the premium changes for each 1% move in interest rates. Higher rates make calls slightly more valuable and puts slightly less. Rho matters most for long-dated options; it's largely negligible for short-dated ones.",
              color: "text-pink-500 dark:text-pink-400",
            },
          ].map(({ symbol, name, measures, description, color }) => (
            <div
              key={name}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4 flex flex-col gap-2"
            >
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold tabular-nums ${color}`}>{symbol}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{name}</span>
              </div>
              <p className={`text-xs font-medium ${color}`}>{measures}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
