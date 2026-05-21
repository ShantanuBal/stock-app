import { getAllBondData } from "@/lib/fred-bonds";
import BondsGrid from "../components/BondsGrid";
import InfoTooltip from "../components/InfoTooltip";

export const revalidate = 3600;

export const metadata = { title: "Fixed Income · Horizon" };

export default async function BondsPage() {
  const { treasuries, credit } = await getAllBondData();

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
            Fixed Income
          </h2>
          <InfoTooltip width="w-80">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">What is fixed income?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
              Bonds are loans you make to governments or companies. In return, you receive regular interest payments (the coupon) and your principal back at maturity. They&apos;re called &quot;fixed income&quot; because the payment schedule is predetermined.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Treasury yields are the interest rate the US government pays to borrow money — they&apos;re the risk-free benchmark that underpins pricing across all asset classes. When yields rise, bond prices fall, and vice versa.
            </p>
            <a href="https://en.wikipedia.org/wiki/Fixed_income" target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-emerald-500 hover:text-emerald-400 underline underline-offset-2">
              Learn more on Wikipedia →
            </a>
          </InfoTooltip>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Treasury yields, credit spreads, and inflation expectations · Data from FRED · 1 business day lag
        </p>
      </div>

      <BondsGrid treasuries={treasuries} credit={credit} />

      <p className="mt-3 text-xs text-gray-400 dark:text-gray-600">
        Data from FRED (Federal Reserve Bank of St. Louis) · Cached daily
      </p>
    </div>
  );
}
