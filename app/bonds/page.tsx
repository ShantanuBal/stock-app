import { getAllBondData, TREASURY_CONFIGS, CREDIT_CONFIGS } from "@/lib/fred-bonds";
import IndicatorCard from "../components/IndicatorCard";
import InfoTooltip from "../components/InfoTooltip";
import YieldCurveChart from "../components/YieldCurveChart";

export const revalidate = 3600;

export const metadata = { title: "Fixed Income · Horizon" };

function SectionHeader({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-500">{title}</h2>
      <InfoTooltip width="w-80">{children}</InfoTooltip>
    </div>
  );
}

function UnavailableCard() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4 flex items-center justify-center h-32">
      <p className="text-xs text-gray-400 dark:text-gray-600">Data unavailable</p>
    </div>
  );
}

export default async function BondsPage() {
  const { treasuries, credit } = await getAllBondData();

  const curvePoints = TREASURY_CONFIGS
    .map((c, i) => ({ label: c.maturityLabel!, yield: treasuries[i]?.value ?? null }))
    .filter((p): p is { label: string; yield: number } => p.yield != null);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 mb-1">
          Fixed Income
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Treasury yields, credit spreads, and inflation expectations · Data from FRED · 1 business day lag
        </p>
      </div>

      {/* Yield Curve */}
      <div className="mb-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-5">
        <div className="flex items-center gap-2 mb-4">
          <p className="text-sm font-bold text-gray-900 dark:text-white">US Treasury Yield Curve</p>
          <InfoTooltip>
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What is the yield curve?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
              The yield curve plots interest rates across different maturities — from 3-month bills to 30-year bonds. Normally it slopes upward: longer loans demand higher rates to compensate for more risk and uncertainty over time.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Normal</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Long-term rates higher than short-term — the typical healthy state.</p>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2">
                <p className="text-xs font-semibold text-red-500 mb-1">Inverted</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Short-term rates higher — has preceded every US recession since the 1950s.</p>
              </div>
            </div>
          </InfoTooltip>
        </div>
        {curvePoints.length > 0 ? (
          <YieldCurveChart points={curvePoints} />
        ) : (
          <div className="h-40 flex items-center justify-center">
            <p className="text-xs text-gray-400 dark:text-gray-600">Data unavailable</p>
          </div>
        )}
      </div>

      {/* Treasury Yields */}
      <div className="mb-10">
        <SectionHeader title="Treasury Yields">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Why do Treasury yields matter?</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
            Treasury yields are the benchmark for all borrowing costs — mortgages, auto loans, and corporate bonds are all priced relative to Treasuries.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            The <span className="font-medium text-gray-700 dark:text-gray-300">10-year yield</span> is the most watched — it has an inverse relationship with stock valuations. The <span className="font-medium text-gray-700 dark:text-gray-300">2-year</span> closely tracks Fed policy expectations.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TREASURY_CONFIGS.map((config, i) => {
            const result = treasuries[i];
            return result
              ? <IndicatorCard key={config.id} config={config} result={result} />
              : <UnavailableCard key={config.id} />;
          })}
        </div>
      </div>

      {/* Credit & Inflation */}
      <div className="mb-10">
        <SectionHeader title="Credit & Inflation">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Credit spreads and inflation expectations</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
            A <span className="font-medium text-gray-700 dark:text-gray-300">credit spread</span> is the extra yield investors demand for corporate vs government debt. Wider = more fear of defaults.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            The <span className="font-medium text-gray-700 dark:text-gray-300">10-year breakeven</span> (nominal yield minus TIPS yield) is the bond market's best estimate of long-run inflation.
          </p>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CREDIT_CONFIGS.map((config, i) => {
            const result = credit[i];
            return result
              ? <IndicatorCard key={config.id} config={config} result={result} />
              : <UnavailableCard key={config.id} />;
          })}
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400 dark:text-gray-600">
        Data from FRED (Federal Reserve Bank of St. Louis) · Cached daily
      </p>
    </div>
  );
}
