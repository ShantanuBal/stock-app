import InfoTooltip from "@/app/components/InfoTooltip";

export const metadata = { title: "Currencies · Horizon" };

const MAJOR_PAIRS = [
  { symbol: "EUR/USD", name: "Euro / US Dollar", region: "Europe" },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", region: "Asia" },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", region: "Europe" },
  { symbol: "USD/CHF", name: "US Dollar / Swiss Franc", region: "Europe" },
  { symbol: "AUD/USD", name: "Australian Dollar / US Dollar", region: "Pacific" },
  { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", region: "Americas" },
];

const EM_PAIRS = [
  { symbol: "USD/CNY", name: "US Dollar / Chinese Yuan", region: "Asia" },
  { symbol: "USD/INR", name: "US Dollar / Indian Rupee", region: "Asia" },
  { symbol: "USD/BRL", name: "US Dollar / Brazilian Real", region: "Americas" },
  { symbol: "USD/MXN", name: "US Dollar / Mexican Peso", region: "Americas" },
  { symbol: "USD/KRW", name: "US Dollar / South Korean Won", region: "Asia" },
  { symbol: "USD/ZAR", name: "US Dollar / South African Rand", region: "Africa" },
];

const CRYPTO = [
  { symbol: "BTC/USD", name: "Bitcoin", region: "Crypto" },
  { symbol: "ETH/USD", name: "Ethereum", region: "Crypto" },
  { symbol: "SOL/USD", name: "Solana", region: "Crypto" },
  { symbol: "BNB/USD", name: "Binance Coin", region: "Crypto" },
];

function PlaceholderCard({ symbol, name, region }: { symbol: string; name: string; region: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{symbol}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{name}</p>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-600">{region}</span>
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

export default function CurrenciesPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Currencies</h1>
            <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-400 dark:text-gray-500">Coming soon</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Live exchange rates for major forex pairs, emerging market currencies, and crypto.
          </p>
        </div>
      </div>

      {/* Major Pairs */}
      <div className="mb-10">
        <SectionHeader title="Major Pairs">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What are forex pairs?</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            The foreign exchange (forex) market is where currencies are traded. A currency pair shows how much of one currency you need to buy another. EUR/USD = 1.08 means 1 Euro buys 1.08 US Dollars.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            The "major" pairs all involve the US Dollar and are the most heavily traded currencies in the world. They have very tight spreads (low transaction costs) and trade around the clock, 5 days a week.
          </p>
          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <p><span className="font-medium text-gray-700 dark:text-gray-300">EUR/USD</span> — Most traded pair in the world (~23% of daily forex volume)</p>
            <p><span className="font-medium text-gray-700 dark:text-gray-300">USD/JPY</span> — Key safe-haven pair, sensitive to Bank of Japan policy</p>
            <p><span className="font-medium text-gray-700 dark:text-gray-300">GBP/USD</span> — "Cable" — heavily influenced by UK economic data</p>
          </div>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {MAJOR_PAIRS.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>

      {/* Emerging Markets */}
      <div className="mb-10">
        <SectionHeader title="Emerging Markets">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What are emerging market currencies?</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            Emerging market (EM) currencies come from developing economies like China, India, Brazil, and Mexico. They tend to offer higher returns than developed-market currencies but with greater volatility.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            EM currencies are sensitive to commodity prices, US interest rates, and global risk appetite. When investors get nervous, they often sell EM currencies and buy "safe haven" assets like USD, JPY, or CHF.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {EM_PAIRS.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>

      {/* Crypto */}
      <div className="mb-10">
        <SectionHeader title="Crypto">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What is crypto?</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            Cryptocurrencies are digital assets that use cryptography to secure transactions and control the creation of new units. Unlike traditional currencies, they're decentralized — not controlled by any government or central bank.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            Bitcoin (BTC) was the first and remains the largest by market cap. Ethereum (ETH) introduced programmable "smart contracts." The market trades 24/7, including weekends.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Crypto is highly volatile — price swings of 10–20% in a single day are not uncommon. It's increasingly watched alongside traditional assets as an indicator of speculative risk appetite.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CRYPTO.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>
    </div>
  );
}
