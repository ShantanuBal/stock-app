import { getAllBondData } from "@/lib/fred-bonds";
import BondsGrid from "../components/BondsGrid";

export const revalidate = 3600;

export const metadata = { title: "Fixed Income · Horizon" };

export default async function BondsPage() {
  const { treasuries, credit } = await getAllBondData();

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

      <BondsGrid treasuries={treasuries} credit={credit} />

      <p className="mt-3 text-xs text-gray-400 dark:text-gray-600">
        Data from FRED (Federal Reserve Bank of St. Louis) · Cached daily
      </p>
    </div>
  );
}
