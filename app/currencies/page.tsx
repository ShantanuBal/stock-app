import CurrenciesGrid from "@/app/components/CurrenciesGrid";
import { getAllForexRates } from "@/lib/polygon-forex";
import InfoTooltip from "@/app/components/InfoTooltip";

export const metadata = { title: "Currencies · Horizon" };
export const revalidate = 3600;

interface PairConfig {
  symbol: string;
  name: string;
  region: string;
  ticker: string;
}

const MAJOR_PAIRS: PairConfig[] = [
  { symbol: "EUR/USD", name: "Euro / US Dollar",              region: "Europe",   ticker: "C:EURUSD" },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen",      region: "Asia",     ticker: "C:USDJPY" },
  { symbol: "GBP/USD", name: "British Pound / US Dollar",     region: "Europe",   ticker: "C:GBPUSD" },
  { symbol: "USD/CHF", name: "US Dollar / Swiss Franc",       region: "Europe",   ticker: "C:USDCHF" },
  { symbol: "AUD/USD", name: "Australian Dollar / US Dollar", region: "Pacific",  ticker: "C:AUDUSD" },
  { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar",   region: "Americas", ticker: "C:USDCAD" },
];

const EM_PAIRS: PairConfig[] = [
  { symbol: "USD/CNY", name: "US Dollar / Chinese Yuan",       region: "Asia",     ticker: "C:USDCNY" },
  { symbol: "USD/INR", name: "US Dollar / Indian Rupee",       region: "Asia",     ticker: "C:USDINR" },
  { symbol: "USD/BRL", name: "US Dollar / Brazilian Real",     region: "Americas", ticker: "C:USDBRL" },
  { symbol: "USD/MXN", name: "US Dollar / Mexican Peso",       region: "Americas", ticker: "C:USDMXN" },
  { symbol: "USD/KRW", name: "US Dollar / South Korean Won",   region: "Asia",     ticker: "C:USDKRW" },
  { symbol: "USD/ZAR", name: "US Dollar / South African Rand", region: "Africa",   ticker: "C:USDZAR" },
];

const CRYPTO: PairConfig[] = [
  { symbol: "BTC/USD", name: "Bitcoin",      region: "Crypto", ticker: "X:BTCUSD" },
  { symbol: "ETH/USD", name: "Ethereum",     region: "Crypto", ticker: "X:ETHUSD" },
  { symbol: "SOL/USD", name: "Solana",       region: "Crypto", ticker: "X:SOLUSD" },
  { symbol: "BNB/USD", name: "Binance Coin", region: "Crypto", ticker: "X:BNBUSD" },
];

export default async function CurrenciesPage() {
  const allTickers = [
    ...MAJOR_PAIRS.map((p) => p.ticker),
    ...EM_PAIRS.map((p) => p.ticker),
    ...CRYPTO.map((p) => p.ticker),
  ];

  const allRates = await getAllForexRates(allTickers);

  const majorRates  = allRates.slice(0, MAJOR_PAIRS.length);
  const emRates     = allRates.slice(MAJOR_PAIRS.length, MAJOR_PAIRS.length + EM_PAIRS.length);
  const cryptoRates = allRates.slice(MAJOR_PAIRS.length + EM_PAIRS.length);

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-1.5 mb-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
            Currencies & Forex
          </h2>
          <InfoTooltip width="w-80">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What is forex?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
              The foreign exchange (forex) market is where currencies are bought and sold. An exchange rate like EUR/USD = 1.09 means one euro buys 1.09 US dollars. A rising rate means the base currency (EUR) has strengthened against the quote currency (USD).
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Forex is the world&apos;s largest and most liquid market, with over $7 trillion traded daily. It&apos;s driven by interest rate differentials, inflation, trade flows, and geopolitical events.
            </p>
            <a href="https://en.wikipedia.org/wiki/Foreign_exchange_market" target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-emerald-500 hover:text-emerald-400 underline underline-offset-2">
              Learn more on Wikipedia →
            </a>
          </InfoTooltip>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Live exchange rates for major forex pairs, emerging market currencies, and crypto · Data from Polygon · Updated hourly
        </p>
      </div>

      <CurrenciesGrid
        majorPairs={MAJOR_PAIRS}
        emPairs={EM_PAIRS}
        crypto={CRYPTO}
        majorRates={majorRates}
        emRates={emRates}
        cryptoRates={cryptoRates}
      />

      <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
        Data from Polygon · End-of-day rates · Updated hourly
      </p>
    </div>
  );
}
