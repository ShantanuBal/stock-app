import InfoTooltip from "@/app/components/InfoTooltip";

export const metadata = { title: "Options · Horizon" };

const POPULAR_UNDERLYINGS = [
  { symbol: "SPY", name: "S&P 500 ETF", type: "Index ETF" },
  { symbol: "QQQ", name: "Nasdaq 100 ETF", type: "Index ETF" },
  { symbol: "AAPL", name: "Apple Inc.", type: "Equity" },
  { symbol: "TSLA", name: "Tesla Inc.", type: "Equity" },
  { symbol: "NVDA", name: "NVIDIA Corp.", type: "Equity" },
  { symbol: "AMZN", name: "Amazon.com Inc.", type: "Equity" },
];

const VOLATILITY_METRICS = [
  { symbol: "VIX", name: "CBOE Volatility Index", type: "Index" },
  { symbol: "VIX3M", name: "3-Month VIX", type: "Index" },
  { symbol: "VVIX", name: "Volatility of VIX", type: "Index" },
  { symbol: "SKEW", name: "CBOE SKEW Index", type: "Index" },
];

function PlaceholderCard({ symbol, name, type }: { symbol: string; name: string; type: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{symbol}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{name}</p>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-600">{type}</span>
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

function SectionHeader({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-500">{title}</h2>
      <InfoTooltip width="w-80">{children}</InfoTooltip>
    </div>
  );
}

export default function OptionsPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Options</h1>
            <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-400 dark:text-gray-500">Coming soon</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Options flow, implied volatility, and key metrics for the most-traded underlyings.
          </p>
        </div>
      </div>

      {/* What are options? */}
      <div className="mb-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-5">
        <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">What are options?</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
          An option is a contract that gives you the <span className="font-medium text-gray-700 dark:text-gray-300">right, but not the obligation</span>, to buy or sell an asset at a specific price (the "strike") before a set date (the "expiration").
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Call option</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              The right to <span className="font-medium text-emerald-600 dark:text-emerald-400">buy</span> at the strike price. You profit if the stock rises above the strike. Think of it as a bet that the stock goes up.
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Put option</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              The right to <span className="font-medium text-red-600 dark:text-red-400">sell</span> at the strike price. You profit if the stock falls below the strike. Often used as insurance to protect a portfolio from losses.
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-4">
          Options are priced using models that factor in the stock price, strike price, time to expiration, and <span className="font-medium text-gray-700 dark:text-gray-300">implied volatility (IV)</span> — the market's expectation of how much the stock will move.
        </p>
      </div>

      {/* Popular Underlyings */}
      <div className="mb-10">
        <SectionHeader title="Popular Underlyings">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What to watch</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            These are the most actively traded options. High options volume often signals that large institutional players are positioning for a significant move — up or down.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            SPY and QQQ options are especially popular for hedging broad market exposure. Single-stock options like TSLA and NVDA often have high implied volatility, meaning option premiums are expensive.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {POPULAR_UNDERLYINGS.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>

      {/* Volatility */}
      <div className="mb-10">
        <SectionHeader title="Volatility">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What is the VIX?</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            The VIX (often called the "fear gauge") measures the market's expectation of S&P 500 volatility over the next 30 days. It's derived from the prices of SPX options. A high VIX means the market expects big swings.
          </p>
          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
            <p><span className="font-medium text-gray-700 dark:text-gray-300">VIX &lt; 15</span> — Calm market, low uncertainty</p>
            <p><span className="font-medium text-gray-700 dark:text-gray-300">VIX 15–25</span> — Moderate uncertainty</p>
            <p><span className="font-medium text-gray-700 dark:text-gray-300">VIX &gt; 30</span> — Fear and high volatility (seen during crashes)</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            The SKEW index measures the market's pricing of tail risk — the chance of an extreme, unexpected move. A rising SKEW means investors are buying more downside protection.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {VOLATILITY_METRICS.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>
    </div>
  );
}
