import { getAllBondData } from "@/lib/fred-bonds";
import BondsGrid from "../components/BondsGrid";
import InfoTooltip from "../components/InfoTooltip";

export const revalidate = 3600;

export const metadata = {
  title: "Fixed Income · Horizon",
  description: "Track US Treasury yields, the yield curve, and key fixed income indicators. Data from FRED, updated daily.",
};

export default async function BondsPage() {
  const { treasuries, credit } = await getAllBondData();

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
            Fixed Income
          </h2>
          <InfoTooltip width="w-80">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What is fixed income?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
              Bonds are loans you make to governments or companies. In return, you receive regular interest payments (the coupon) and your principal back at maturity. They&apos;re called &quot;fixed income&quot; because the payment schedule is predetermined.
            </p>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">US Treasury instruments</p>
            <ul className="space-y-1.5 mb-3">
              <li className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed"><span className="font-medium text-gray-700 dark:text-gray-300">T-Bills</span> — mature in 4 weeks to 1 year. Sold at a discount; no coupon.</li>
              <li className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed"><span className="font-medium text-gray-700 dark:text-gray-300">T-Notes</span> — mature in 2–10 years. Pay a fixed coupon every 6 months.</li>
              <li className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed"><span className="font-medium text-gray-700 dark:text-gray-300">T-Bonds</span> — mature in 20–30 years. Longest duration; most sensitive to rate changes.</li>
              <li className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed"><span className="font-medium text-gray-700 dark:text-gray-300">TIPS</span> — inflation-protected. Principal adjusts with CPI, so your real return is preserved.</li>
              <li className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed"><span className="font-medium text-gray-700 dark:text-gray-300">I-Bonds</span> — retail savings bonds with an inflation-linked rate. Purchased directly from the Treasury; not tradeable.</li>
            </ul>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Treasury yields are the risk-free benchmark that underpins pricing across all asset classes. When yields rise, bond prices fall, and vice versa.
            </p>
            <a href="https://en.wikipedia.org/wiki/Fixed_income" target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-emerald-500 hover:text-emerald-400 underline underline-offset-2">
              Learn more on Wikipedia →
            </a>
          </InfoTooltip>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Treasury yields, credit spreads, and inflation expectations · Data from FRED · 1 business day lag
        </p>
      </div>

      <BondsGrid treasuries={treasuries} credit={credit} />

      <p className="mt-3 text-xs text-gray-400 dark:text-gray-600">
        Data from FRED (Federal Reserve Bank of St. Louis) · Cached daily
      </p>

      {/* Fixed income concepts explainer */}
      <div className="mt-12">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
          Understanding Fixed Income
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            {
              symbol: "%",
              name: "Yield",
              measures: "Return vs. price",
              description: "The annual return if you hold a bond to maturity. When demand for a bond rises, its price goes up — but the fixed coupon is now a smaller percentage of what you paid, so yield falls. This is the inverse relationship: prices up → yields down, prices down → yields up. When you hear 'yields are rising,' the bond market is selling off.",
              color: "text-emerald-500 dark:text-emerald-400",
            },
            {
              symbol: "D",
              name: "Duration",
              measures: "Rate sensitivity (years)",
              description: "The most important bond risk metric. A duration of 10 years means the bond's price falls roughly 10% for every 1% rise in interest rates. Short-dated T-Bills have very low duration; 30-year Treasury bonds and long-duration ETFs like TLT (~17yr duration) are extremely sensitive to rate changes — they behave like leveraged rate bets.",
              color: "text-blue-500 dark:text-blue-400",
            },
            {
              symbol: "⌇",
              name: "Yield Curve",
              measures: "Economic shape signal",
              description: "Plot all Treasury yields from 1-month to 30-year and you get the yield curve. Normally it slopes upward — longer maturities pay more to compensate for uncertainty. When it inverts (2-year yield > 10-year yield), the market is pricing in rate cuts ahead — historically one of the most reliable recession predictors. Watch the 2Y–10Y spread.",
              color: "text-orange-500 dark:text-orange-400",
            },
            {
              symbol: "+",
              name: "Credit Spread",
              measures: "Default risk premium (bps)",
              description: "The extra yield a corporate bond pays over an equivalent Treasury. If the 10-year Treasury yields 4.5% and a 10-year investment-grade corporate bond yields 5.1%, the spread is 60 basis points. Spreads widen when investors fear defaults — during 2008, IG spreads hit 600bps. Tight spreads signal confidence; wide spreads signal stress.",
              color: "text-purple-500 dark:text-purple-400",
            },
            {
              symbol: "π",
              name: "Breakeven Inflation",
              measures: "Market inflation forecast",
              description: "The yield gap between a nominal Treasury and a TIPS (inflation-protected Treasury) of the same maturity. If the 10-year Treasury yields 4.5% and the 10-year TIPS yields 2.0%, the 10-year breakeven is 2.5% — the bond market's best guess at average annual inflation over the next decade. Rising breakevens signal inflation expectations are increasing.",
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
