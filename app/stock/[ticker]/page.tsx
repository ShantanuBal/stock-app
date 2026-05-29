import { getTickerDetails } from "@/lib/tickerDetails";
import StockPageClient from "./StockPageClient";

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  return { title: `${ticker.toUpperCase()} · Horizon` };
}

export default async function StockPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase();
  const details = await getTickerDetails(symbol);

  return (
    <div className="max-w-4xl pt-6">
      <StockPageClient ticker={symbol} details={details} />
    </div>
  );
}
