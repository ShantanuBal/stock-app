import InfoTooltip from "@/app/components/InfoTooltip";

export const revalidate = 3600;

export const metadata = {
  title: "Futures · Horizon",
  description: "Commodity, equity index, and interest rate futures — coming soon to Horizon.",
};

const COMMODITY_FUTURES = [
  { symbol: "CL",  name: "WTI Crude Oil",   exchange: "NYMEX" },
  { symbol: "GC",  name: "Gold",            exchange: "COMEX" },
  { symbol: "SI",  name: "Silver",          exchange: "COMEX" },
  { symbol: "NG",  name: "Natural Gas",     exchange: "NYMEX" },
  { symbol: "HG",  name: "Copper",          exchange: "COMEX" },
];

const EQUITY_FUTURES = [
  { symbol: "ES",  name: "S&P 500",         exchange: "CME"  },
  { symbol: "NQ",  name: "Nasdaq 100",      exchange: "CME"  },
  { symbol: "YM",  name: "Dow Jones",       exchange: "CBOT" },
  { symbol: "RTY", name: "Russell 2000",    exchange: "CME"  },
];

const RATE_FUTURES = [
  { symbol: "ZN",  name: "10-Year T-Note",  exchange: "CBOT" },
  { symbol: "ZB",  name: "30-Year T-Bond",  exchange: "CBOT" },
  { symbol: "ZF",  name: "5-Year T-Note",   exchange: "CBOT" },
  { symbol: "ZT",  name: "2-Year T-Note",   exchange: "CBOT" },
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

function SectionHeader({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-500">{title}</h2>
      <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-400 dark:text-gray-500">
        Coming soon
      </span>
      <InfoTooltip width="w-80">{children}</InfoTooltip>
    </div>
  );
}


export default function FuturesPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-1.5 mb-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
            Futures
          </h2>
          <InfoTooltip width="w-80">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What are futures?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
              A futures contract is an agreement to buy or sell an asset at a fixed price on a specific future date. They cover commodities, stock indices, currencies, and interest rates.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
              Futures are used by producers to lock in prices, consumers to hedge costs, and traders to speculate on direction. Equity index futures trade nearly 24 hours a day and are widely watched as a pre-market sentiment gauge.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Unlike options, futures obligate both sides to complete the trade — though in practice 99% of contracts are closed before delivery.
            </p>
            <a href="https://en.wikipedia.org/wiki/Futures_contract" target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-emerald-500 hover:text-emerald-400 underline underline-offset-2">
              Learn more on Wikipedia →
            </a>
          </InfoTooltip>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Commodity, equity index, and interest rate futures · All sections coming soon
        </p>
      </div>

      {/* Commodity Futures */}
      <div className="mb-10">
        <SectionHeader title="Commodity Futures">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Commodity futures</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            These are the contracts that set the prices you see quoted for oil, gold, and natural gas. The &quot;front month&quot; contract — the nearest expiry — is treated as the de facto spot price by most financial media.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Commodity futures trade on exchanges like NYMEX (energy) and COMEX (metals). Each contract represents a standardised quantity — one CL contract = 1,000 barrels of crude oil.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {COMMODITY_FUTURES.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>

      {/* Equity Index Futures */}
      <div className="mb-10">
        <SectionHeader title="Equity Index Futures">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Equity index futures</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            Futures on stock market indices like the S&P 500 and Nasdaq 100. They trade nearly 24 hours a day, making them the go-to signal for pre-market and overnight sentiment.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            If S&P 500 futures (ES) are up 0.5% before the market opens, it signals stocks will likely open higher. Major news events — Fed decisions, earnings — are often priced in through futures before regular trading hours begin.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EQUITY_FUTURES.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>

      {/* Interest Rate Futures */}
      <div className="mb-10">
        <SectionHeader title="Interest Rate Futures">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Interest rate futures</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            Futures on US Treasury bonds and notes. Their prices move inversely to interest rates — when rates are expected to rise, Treasury prices fall, and vice versa.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Used by banks, pension funds, and hedge funds to hedge interest rate risk. The 10-Year T-Note (ZN) is the most widely watched — its yield is the global benchmark for long-term borrowing costs.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {RATE_FUTURES.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>
    </div>
  );
}
