import { NextRequest, NextResponse } from "next/server";
import { getTopPerformers } from "@/lib/polygon";
import { batchGetTickerNamesAndIndustries } from "@/lib/tickerDetails";
import { ETF_TICKERS_BY_CATEGORY, ETF_NAME_MAP, type ETFCategory } from "@/lib/etf-config";

const VALID_RANGES = ["1D", "3D", "1W", "1M", "3M", "6M", "1Y", "5Y", "YTD"];
const VALID_CATEGORIES = ["broad", "sector", "bonds", "commodities", "international", "all"];

export async function GET(req: NextRequest) {
  const range = req.nextUrl.searchParams.get("range") ?? "1W";
  const category = (req.nextUrl.searchParams.get("category") ?? "all") as ETFCategory | "all";

  if (!VALID_RANGES.includes(range) || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const tickers = new Set(ETF_TICKERS_BY_CATEGORY[category] ?? ETF_TICKERS_BY_CATEGORY.all);
  console.log(`ETF performers: category=${category}, range=${range}, tickers=${tickers.size}`);

  const results = await getTopPerformers(range as Parameters<typeof getTopPerformers>[0], tickers, ETF_NAME_MAP);

  const detailsMap = await batchGetTickerNamesAndIndustries(results.map((r) => r.ticker));
  for (const r of results) {
    const details = detailsMap.get(r.ticker);
    if (details?.name) r.name = details.name;
  }

  return NextResponse.json({ etfs: results });
}
