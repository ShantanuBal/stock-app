import { NextRequest, NextResponse } from "next/server";
import { getTopPerformers, TimeRange } from "@/lib/polygon";
import { SP500_TICKERS, TICKER_NAMES } from "@/lib/sp500";

const sp500Set = new Set(SP500_TICKERS);
const VALID_RANGES: TimeRange[] = ["1D", "3D", "1W", "1M", "3M", "YTD"];

export async function GET(req: NextRequest) {
  const range = (req.nextUrl.searchParams.get("range") ?? "1W") as TimeRange;

  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  try {
    const results = await getTopPerformers(range, sp500Set, TICKER_NAMES);
    return NextResponse.json({ results, range });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
