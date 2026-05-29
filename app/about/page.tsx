export const metadata = {
  title: "About · Horizon",
  description: "Horizon's mission and roadmap for financial market education.",
};

const FEATURES = [
  {
    status: "live",
    title: "Equities",
    description:
      "Track top performers across the S&P 500, Nasdaq 100, Dow Jones, and Russell 2000. Filter by sector, sort by price change, beta, market cap, or volume, and get a daily AI-generated summary of what's driving the market.",
  },
  {
    status: "live",
    title: "ETFs",
    description:
      "Monitor performance across broad market, sector, bond, commodity, and international ETFs. See how SPY, QQQ, TLT, GLD, and dozens of others are moving — with sparklines and AI-generated commentary.",
  },
  {
    status: "live",
    title: "Options & Volatility",
    description:
      "Monitor at-the-money option premiums for the most actively traded stocks (AAPL, NVDA, TSLA and more), index ETFs (SPY, QQQ), and the VIX fear index. See premium history across multiple timeframes and get an AI read on what the options market is signaling.",
  },
  {
    status: "live",
    title: "Futures",
    description:
      "Follow equity index futures (ES, NQ, YM, RTY) and commodity futures (crude oil, gold, natural gas, silver) — front-month contracts with sparklines, historical charts, and an AI summary of what futures markets are signaling.",
  },
  {
    status: "live",
    title: "Fixed Income & Credit",
    description:
      "Dive into the bond market: Treasury yields across the full curve, corporate credit spreads, and investment-grade vs high-yield dynamics.",
  },
  {
    status: "live",
    title: "Currencies & Forex",
    description:
      "Track major forex pairs (EUR/USD, USD/JPY, GBP/USD), emerging market currencies (CNY, INR, BRL, MXN), and crypto (BTC, ETH, SOL, XRP) — with sparklines and historical performance across 1D to 1Y timeframes.",
  },
  {
    status: "live",
    title: "Commodities",
    description:
      "Live spot prices for precious metals (gold, silver, platinum, palladium) and energy benchmarks (WTI crude, Brent crude, natural gas) — with historical sparklines and plain-English explainers on how each commodity fits into the broader economy.",
  },
  {
    status: "live",
    title: "Macroeconomy",
    description:
      "Monitor the health of the US economy through key FRED indicators — GDP growth, inflation (CPI & Core PCE), unemployment, the Fed Funds rate, Treasury yields, the yield curve, and consumer sentiment.",
  },
  {
    status: "soon",
    title: "Global Markets",
    description:
      "Broaden your perspective with major international indices — Europe (FTSE, DAX, CAC), Asia-Pacific (Nikkei, Hang Seng, ASX), and emerging markets.",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-2xl pt-6">

      {/* Mission */}
      <div className="mb-12">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-3">Our Mission</h2>
        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-snug mb-1">
          Financial foresight for everyone
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-600 mb-4">Built by Shantanu Bal · Since May 2026</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Horizon is an educational platform built to help anyone — from curious beginners to seasoned investors — understand how global financial markets work and where they may be heading. We bring together real-time data, clear visualisations, plain-English explanations, and AI-generated insights across equities, ETFs, options, futures, fixed income, currencies, commodities, and the broader economy.
        </p>
      </div>

      {/* Philosophy */}
      <div className="mb-12">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-5">Our Philosophy</h2>
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Invest in what you know</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Sound investing starts with understanding. I believe in long-term positions in companies and industries you genuinely understand — businesses whose products you use, whose economics you can reason about, and whose long-term prospects you can evaluate with confidence. Horizon is built to deepen that understanding, not replace it — while also helping investors learn about the full range of financial instruments available to them, so they can make sound decisions and build long-term wealth.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Markets are connected</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              A rate decision by the Fed ripples into bond yields, which moves the dollar, which affects commodity prices, which feeds into inflation data, which shapes corporate earnings. Geopolitical events move energy markets; energy moves inflation; inflation moves central banks. Horizon exists to help investors see these connections — so that when something moves, you have a framework for understanding why.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Always evolving</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Horizon is a continuous work in progress. Markets evolve, data sources improve, and new tools emerge. The goal is to keep building — adding depth, improving clarity, and expanding coverage — so the platform grows alongside the investors who use it. But growth will never come at the cost of simplicity. Financial data can be overwhelming; the whole point is to make it approachable.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Broad markets beat most stock pickers</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              For new investors or those sensitive to volatility, broad index funds — accessible through ETFs like SPY or QQQ — remain the most reliable path to long-term wealth. Low cost, diversified, and historically resilient. Individual stock picking is best approached only once you have a strong grasp of the underlying businesses and your own risk tolerance.
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mb-12">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-5">What We Cover</h2>
        <div className="space-y-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{f.title}</span>
                {f.status === "live" ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">Live</span>
                ) : (
                  <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-400 dark:text-gray-500">Coming soon</span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* About the author */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-4">About the Author</h2>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Shantanu Bal</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              Software engineer with a passion for financial markets. Horizon started as a personal project to make market data more accessible and understandable — the kind of dashboard he always wanted but couldn&apos;t find.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://shantanubal.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-500 hover:bg-emerald-500/20 transition-colors"
              >
                Portfolio ↗
              </a>
              <a
                href="mailto:shantanu.r.bal@gmail.com"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                shantanu.r.bal@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
