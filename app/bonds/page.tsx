import InfoTooltip from "@/app/components/InfoTooltip";

export const metadata = { title: "Fixed Income · Horizon" };

const TREASURY_YIELDS = [
  { symbol: "US3M", name: "3-Month Treasury Bill", maturity: "3M" },
  { symbol: "US6M", name: "6-Month Treasury Bill", maturity: "6M" },
  { symbol: "US1Y", name: "1-Year Treasury Note", maturity: "1Y" },
  { symbol: "US2Y", name: "2-Year Treasury Note", maturity: "2Y" },
  { symbol: "US5Y", name: "5-Year Treasury Note", maturity: "5Y" },
  { symbol: "US10Y", name: "10-Year Treasury Note", maturity: "10Y" },
  { symbol: "US20Y", name: "20-Year Treasury Bond", maturity: "20Y" },
  { symbol: "US30Y", name: "30-Year Treasury Bond", maturity: "30Y" },
];

const CREDIT_SPREADS = [
  { symbol: "IG", name: "Investment Grade Spread", maturity: "Corp" },
  { symbol: "HY", name: "High Yield Spread", maturity: "Corp" },
  { symbol: "TIPS", name: "10Y TIPS Yield", maturity: "10Y" },
  { symbol: "BREAKEVEN", name: "10Y Breakeven Inflation", maturity: "10Y" },
];

function PlaceholderCard({ symbol, name, maturity }: { symbol: string; name: string; maturity: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{symbol}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{name}</p>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-600">{maturity}</span>
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

export default function BondsPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fixed Income</h1>
            <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-400 dark:text-gray-500">Coming soon</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Treasury yields, the yield curve, credit spreads, and inflation expectations.
          </p>
        </div>
      </div>

      {/* Yield Curve Card */}
      <div className="mb-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-5">
        <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">What is the yield curve?</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
          A bond is a loan you make to a government or company. In return, they pay you interest (the "yield") and return your principal at maturity. US Treasury bonds are considered the safest investment in the world.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
          The yield curve plots interest rates across different maturities — from 3-month bills to 30-year bonds. Normally it slopes upward: longer loans demand higher rates to compensate for more risk and uncertainty.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Normal curve</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Long-term rates are higher than short-term rates. This is the typical state — it means the economy is expected to grow and inflation may rise.
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Inverted curve</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Short-term rates are higher than long-term rates. This is unusual and has historically preceded every US recession. It means the market expects the Fed to cut rates in the future.
            </p>
          </div>
        </div>
        <div className="mt-4 h-24 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
          <span className="text-xs text-gray-400 dark:text-gray-600">Yield curve chart coming soon</span>
        </div>
      </div>

      {/* Treasury Yields */}
      <div className="mb-10">
        <SectionHeader title="Treasury Yields">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Why do Treasury yields matter?</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            Treasury yields are the benchmark for borrowing costs across the entire economy. Mortgage rates, auto loan rates, and corporate bond yields are all priced relative to Treasuries.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            The <span className="font-medium text-gray-700 dark:text-gray-300">10-year yield</span> is the most watched — it's the de facto measure of long-term interest rates and has an inverse relationship with stock valuations (higher yields = lower P/E multiples).
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            The <span className="font-medium text-gray-700 dark:text-gray-300">2-year yield</span> closely tracks Fed policy expectations. When it's much higher than the 10-year ("2s10s inversion"), recession fears grow.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TREASURY_YIELDS.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>

      {/* Credit & Inflation */}
      <div className="mb-10">
        <SectionHeader title="Credit & Inflation">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What are credit spreads and TIPS?</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            A <span className="font-medium text-gray-700 dark:text-gray-300">credit spread</span> is the extra yield investors demand for lending to a company instead of the US government. Wider spreads mean higher perceived risk of default.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            <span className="font-medium text-gray-700 dark:text-gray-300">TIPS (Treasury Inflation-Protected Securities)</span> are bonds where the principal adjusts with inflation. Their yield represents the "real" return after inflation.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            The <span className="font-medium text-gray-700 dark:text-gray-300">breakeven inflation rate</span> is the difference between the 10-year nominal yield and the 10-year TIPS yield. It's the market's best estimate of where inflation will average over the next decade.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CREDIT_SPREADS.map((f) => <PlaceholderCard key={f.symbol} {...f} />)}
        </div>
      </div>
    </div>
  );
}
