import InfoTooltip from "@/app/components/InfoTooltip";

export const metadata = {
  title: "Global Markets · Horizon",
  description: "Monitor equity indices across the Americas, Europe, and Asia-Pacific. A snapshot of how global markets are moving.",
};

const AMERICAS = [
  { symbol: "SPX", name: "S&P 500", country: "United States" },
  { symbol: "COMP", name: "Nasdaq Composite", country: "United States" },
  { symbol: "TSX", name: "S&P/TSX Composite", country: "Canada" },
  { symbol: "IBOV", name: "Bovespa Index", country: "Brazil" },
  { symbol: "MXX", name: "IPC Index", country: "Mexico" },
];

const EUROPE = [
  { symbol: "FTSE", name: "FTSE 100", country: "United Kingdom" },
  { symbol: "DAX", name: "DAX 40", country: "Germany" },
  { symbol: "CAC", name: "CAC 40", country: "France" },
  { symbol: "STOXX50", name: "Euro Stoxx 50", country: "Eurozone" },
  { symbol: "SMI", name: "Swiss Market Index", country: "Switzerland" },
  { symbol: "OMXS30", name: "OMX Stockholm 30", country: "Sweden" },
];

const ASIA_PACIFIC = [
  { symbol: "N225", name: "Nikkei 225", country: "Japan" },
  { symbol: "HSI", name: "Hang Seng Index", country: "Hong Kong" },
  { symbol: "CSI300", name: "CSI 300", country: "China" },
  { symbol: "SENSEX", name: "BSE Sensex", country: "India" },
  { symbol: "KOSPI", name: "KOSPI 200", country: "South Korea" },
  { symbol: "ASX200", name: "S&P/ASX 200", country: "Australia" },
];

function PlaceholderCard({ symbol, name, country }: { symbol: string; name: string; country: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{symbol}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{name}</p>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-600">{country}</span>
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

export default function GlobalMarketsPage() {
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
            Global Markets
          </h2>
          <InfoTooltip width="w-80">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Why do global markets matter?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
              Financial markets are globally interconnected. A sell-off in Asian markets overnight often sets the tone for European and US trading hours. Major events — a Fed rate decision, a Chinese GDP report, a UK election — ripple across every market.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Following global indices helps you distinguish whether a US move is isolated or part of a broader trend. When all markets fall together, it typically signals a global macro event. When the US diverges, it&apos;s likely something US-specific.
            </p>
            <a href="https://en.wikipedia.org/wiki/Stock_market_index" target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-emerald-500 hover:text-emerald-400 underline underline-offset-2">
              Learn more on Wikipedia →
            </a>
          </InfoTooltip>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Stock indices from every major market, from the Americas to Asia-Pacific · Coming soon
        </p>
      </div>

      {/* Why global markets matter */}
      <div className="mb-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-5">
        <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Why do global markets matter?</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
          Financial markets around the world are deeply interconnected. A sell-off in Asian markets overnight often sets the tone for European and US trading hours. Major economic events — a US Federal Reserve decision, a Chinese GDP report, a UK election — ripple across every market.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
          Following global indices helps you understand whether a move in the US is isolated or part of a broader trend. When all markets fall together, it typically signals a global macro event (recession fears, a financial crisis). When the US rises while others fall, it may reflect something specific to the US economy.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Global markets also trade at different hours — Asian markets open while the US is closed, European markets open during US pre-market. Together, they form a nearly 24-hour window into global investor sentiment.
        </p>
      </div>

      {/* Americas */}
      <div className="mb-10">
        <SectionHeader title="Americas">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Americas indices</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            The US markets dominate global finance — the NYSE and Nasdaq together account for over 40% of global equity market cap. But Canada, Brazil, and Mexico are significant markets in their own right, often influenced by commodity prices (oil, metals, agriculture).
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Brazil's Bovespa is particularly sensitive to commodity cycles and local political stability. Mexico's IPC tracks closely with NAFTA/USMCA trade dynamics and US economic conditions.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AMERICAS.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>

      {/* Europe */}
      <div className="mb-10">
        <SectionHeader title="Europe">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">European indices</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            European markets are heavily influenced by European Central Bank (ECB) policy, euro/dollar exchange rates, and trade relationships. The Euro Stoxx 50 is the flagship pan-European index, while Germany's DAX is often seen as a proxy for the eurozone's industrial heartbeat.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            The UK's FTSE 100 is dominated by large global companies (energy, mining, financials) that earn most of their revenue outside the UK — making it less sensitive to UK-specific economic news than you might expect.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {EUROPE.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>

      {/* Asia-Pacific */}
      <div className="mb-10">
        <SectionHeader title="Asia-Pacific">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Asia-Pacific indices</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            Asia-Pacific markets are the first to open each day and set the early tone for global sentiment. Japan's Nikkei 225 is closely watched — it's heavily influenced by the yen/dollar rate (a weaker yen boosts Japanese exporters) and Bank of Japan policy.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            China's CSI 300 tracks the largest companies on the Shanghai and Shenzhen exchanges. It's often influenced by Chinese government policy and economic data rather than purely market forces.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            India's Sensex has been one of the best-performing major indices over the past decade, reflecting India's rapid economic growth and expanding middle class.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ASIA_PACIFIC.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>
    </div>
  );
}
