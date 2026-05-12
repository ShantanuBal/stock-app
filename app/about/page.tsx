export const metadata = {
  title: "About · Horizon",
  description: "Horizon's mission and roadmap for financial market education.",
};

const FEATURES = [
  {
    status: "live",
    title: "Stock Markets",
    description:
      "Track top performers across the S&P 500, Nasdaq 100, Dow Jones, and Russell 2000. Filter by industry, sort by price, change, beta, market cap, or volume, and hover over any ticker for a company description.",
  },
  {
    status: "live",
    title: "Macroeconomy",
    description:
      "Monitor the health of the US economy through key FRED indicators — GDP growth, inflation (CPI & Core PCE), unemployment, the Fed Funds rate, Treasury yields, the yield curve, and consumer sentiment.",
  },
  {
    status: "soon",
    title: "Futures",
    description:
      "Follow equity index futures (ES, NQ, YM), commodity futures (crude oil, gold, natural gas, wheat), and interest rate futures — giving you a picture of where markets are headed before they open.",
  },
  {
    status: "soon",
    title: "Currencies & Forex",
    description:
      "Track major currency pairs (EUR/USD, USD/JPY, GBP/USD), the US Dollar Index (DXY), and emerging market currencies — essential for understanding global capital flows and trade dynamics.",
  },
  {
    status: "soon",
    title: "Options & Volatility",
    description:
      "Explore implied volatility, the VIX fear index, put/call ratios, and options flow — tools that reveal how professional traders are positioning for the future.",
  },
  {
    status: "soon",
    title: "Fixed Income & Credit",
    description:
      "Dive into the bond market: Treasury yields across the full curve, corporate credit spreads, and investment-grade vs high-yield dynamics.",
  },
  {
    status: "soon",
    title: "Global Markets",
    description:
      "Broaden your perspective with major international indices — Europe (FTSE, DAX, CAC), Asia-Pacific (Nikkei, Hang Seng, ASX), and emerging markets.",
  },
  {
    status: "soon",
    title: "Education",
    description:
      "Plain-English explainers for every metric, chart, and concept on the platform — from what beta actually means to how the yield curve predicts recessions.",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-2xl">

      {/* Mission */}
      <div className="mb-12">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-3">Our Mission</h2>
        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-snug mb-4">
          Financial foresight for everyone.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Horizon is an educational platform built to help anyone — from curious beginners to seasoned investors — understand how global financial markets work and where they may be heading. We bring together real-time data, clear visualisations, and plain-English explanations across every major asset class.
        </p>
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

      {/* Built by */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-2">Built by</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Horizon is built and maintained by{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">Shantanu Bal</span>.
          Have a feature idea, spotted a bug, or just want to chat markets?{" "}
          <a
            href="mailto:shantanu.r.bal@gmail.com"
            className="text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            shantanu.r.bal@gmail.com
          </a>
        </p>
      </div>

    </div>
  );
}
