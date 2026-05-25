import InfoTooltip from "@/app/components/InfoTooltip";

export const metadata = { title: "ETFs · Horizon" };

const BROAD_MARKET = [
  { symbol: "SPY",  name: "SPDR S&P 500 ETF",          exchange: "NYSE" },
  { symbol: "QQQ",  name: "Invesco Nasdaq 100 ETF",     exchange: "NASDAQ" },
  { symbol: "IWM",  name: "iShares Russell 2000 ETF",   exchange: "NYSE" },
  { symbol: "DIA",  name: "SPDR Dow Jones ETF",         exchange: "NYSE" },
  { symbol: "VTI",  name: "Vanguard Total Market ETF",  exchange: "NYSE" },
];

const SECTOR_ETFS = [
  { symbol: "XLK",  name: "Technology",                 exchange: "NYSE" },
  { symbol: "XLF",  name: "Financials",                 exchange: "NYSE" },
  { symbol: "XLV",  name: "Health Care",                exchange: "NYSE" },
  { symbol: "XLE",  name: "Energy",                     exchange: "NYSE" },
  { symbol: "XLI",  name: "Industrials",                exchange: "NYSE" },
  { symbol: "XLY",  name: "Consumer Discretionary",     exchange: "NYSE" },
  { symbol: "XLP",  name: "Consumer Staples",           exchange: "NYSE" },
  { symbol: "XLU",  name: "Utilities",                  exchange: "NYSE" },
  { symbol: "XLB",  name: "Materials",                  exchange: "NYSE" },
  { symbol: "XLRE", name: "Real Estate",                exchange: "NYSE" },
];

const BOND_ETFS = [
  { symbol: "AGG",  name: "iShares Core US Aggregate",  exchange: "NYSE" },
  { symbol: "BND",  name: "Vanguard Total Bond Market", exchange: "NASDAQ" },
  { symbol: "TLT",  name: "iShares 20+ Year Treasury",  exchange: "NASDAQ" },
  { symbol: "HYG",  name: "iShares High Yield Corp",    exchange: "NYSE" },
  { symbol: "LQD",  name: "iShares Investment Grade",   exchange: "NYSE" },
];

const COMMODITY_ETFS = [
  { symbol: "GLD",  name: "SPDR Gold Shares",           exchange: "NYSE" },
  { symbol: "SLV",  name: "iShares Silver Trust",       exchange: "NYSE" },
  { symbol: "USO",  name: "United States Oil Fund",     exchange: "NYSE" },
  { symbol: "UNG",  name: "United States Natural Gas",  exchange: "NYSE" },
  { symbol: "GDX",  name: "VanEck Gold Miners ETF",     exchange: "NYSE" },
];

const INTERNATIONAL_ETFS = [
  { symbol: "EFA",  name: "iShares MSCI EAFE",          exchange: "NYSE" },
  { symbol: "EEM",  name: "iShares MSCI Emerging Markets", exchange: "NYSE" },
  { symbol: "VEA",  name: "Vanguard Developed Markets", exchange: "NYSE" },
  { symbol: "VWO",  name: "Vanguard Emerging Markets",  exchange: "NYSE" },
  { symbol: "FXI",  name: "iShares China Large-Cap",    exchange: "NYSE" },
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

export default function ETFsPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-1.5 mb-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
            ETFs
          </h2>
          <InfoTooltip width="w-80">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What is an ETF?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
              An Exchange-Traded Fund (ETF) is a basket of assets — stocks, bonds, commodities — that trades on an exchange like a single stock. You buy one share of SPY and you&apos;re instantly diversified across 500 companies.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
              ETFs combine the diversification of mutual funds with the flexibility of stocks — they trade throughout the day, typically have low fees, and are highly transparent about their holdings.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              They&apos;re the most popular investment vehicle for retail investors and have largely replaced mutual funds for index investing.
            </p>
            <a href="https://en.wikipedia.org/wiki/Exchange-traded_fund" target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-emerald-500 hover:text-emerald-400 underline underline-offset-2">
              Learn more on Wikipedia →
            </a>
          </InfoTooltip>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Broad market, sector, bond, commodity, and international ETFs · All sections coming soon
        </p>
      </div>

      {/* Broad Market */}
      <div className="mb-10">
        <SectionHeader title="Broad Market">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Broad market ETFs</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            These track entire markets or major indices. SPY and QQQ are among the most traded securities in the world — retail investors, hedge funds, and institutions all use them for broad exposure.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            A classic long-term portfolio might be just two ETFs: VTI (total US market) + VXUS (total international). Simple, cheap, and diversified.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {BROAD_MARKET.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>

      {/* Sector ETFs */}
      <div className="mb-10">
        <SectionHeader title="Sectors">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Sector ETFs</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            The S&P 500 is divided into 11 sectors (GICS). Sector ETFs let you overweight or underweight specific parts of the economy — useful if you have a view on tech, energy, or healthcare.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Sectors rotate in and out of favour with the economic cycle. Energy and materials tend to lead in inflationary periods; utilities and staples hold up in downturns.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {SECTOR_ETFS.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>

      {/* Bond ETFs */}
      <div className="mb-10">
        <SectionHeader title="Bonds">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Bond ETFs</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            Bond ETFs hold portfolios of fixed income securities. They&apos;re a much easier way to own bonds than buying individual issues — which have high minimums and trade over-the-counter.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            TLT (long-dated Treasuries) is highly rate-sensitive — it falls sharply when rates rise. AGG is a broad investment-grade mix. HYG gives corporate high-yield exposure but behaves more like equities in a downturn.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {BOND_ETFS.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>

      {/* Commodity ETFs */}
      <div className="mb-10">
        <SectionHeader title="Commodities">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Commodity ETFs</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            The easiest way to get commodity exposure without futures accounts or physical storage. GLD and SLV are physically-backed — they hold actual metal in vaults. USO and UNG hold rolling futures contracts.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Watch out for roll yield drag on futures-based ETFs in contango markets — USO has historically underperformed the WTI spot price over long periods because of this.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {COMMODITY_ETFS.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>

      {/* International ETFs */}
      <div className="mb-10">
        <SectionHeader title="International">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">International ETFs</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            International ETFs provide exposure to markets outside the US. EFA covers developed markets (Europe, Japan, Australia); EEM covers emerging markets (China, India, Brazil, etc.).
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            International diversification reduces reliance on a single economy, but adds currency risk. A strong US dollar tends to drag returns from foreign holdings when converted back to USD.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {INTERNATIONAL_ETFS.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>
    </div>
  );
}
