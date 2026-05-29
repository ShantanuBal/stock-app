import { getTickerDetails } from "@/lib/tickerDetails";
import { ETF_DESCRIPTION_MAP, ETF_NAME_MAP } from "@/lib/etf-config";
import ETFPageClient from "./ETFPageClient";

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  return { title: `${ticker.toUpperCase()} · Horizon` };
}

export default async function ETFPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase();
  const details = await getTickerDetails(symbol);

  const description = ETF_DESCRIPTION_MAP[symbol] ?? details?.description ?? null;
  const name = ETF_NAME_MAP[symbol] ?? details?.name ?? null;

  return (
    <div className="max-w-4xl pt-6">
      <ETFPageClient ticker={symbol} details={details} description={description} name={name} />
    </div>
  );
}
