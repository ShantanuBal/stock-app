import { NextRequest, NextResponse } from "next/server";
import { getTopPerformers, TimeRange } from "@/lib/polygon";
import { SP500_TICKERS, TICKER_NAMES as SP500_NAMES } from "@/lib/sp500";
import { NASDAQ100_TICKERS, NASDAQ100_NAMES } from "@/lib/nasdaq100";
import { DJIA_TICKERS, DJIA_NAMES } from "@/lib/djia";
import { RUSSELL2000_TICKERS, RUSSELL2000_NAMES } from "@/lib/russell2000";

export type IndexKey = "sp500" | "nasdaq100" | "djia" | "russell2000";

const INDEX_DATA: Record<IndexKey, { tickers: string[]; names: Record<string, string> }> = {
  sp500: { tickers: SP500_TICKERS, names: SP500_NAMES },
  nasdaq100: { tickers: NASDAQ100_TICKERS, names: NASDAQ100_NAMES },
  djia: { tickers: DJIA_TICKERS, names: DJIA_NAMES },
  russell2000: { tickers: RUSSELL2000_TICKERS, names: RUSSELL2000_NAMES },
};

const VALID_RANGES: TimeRange[] = ["1D", "3D", "1W", "1M", "3M", "YTD"];
const VALID_INDICES = Object.keys(INDEX_DATA) as IndexKey[];

export async function GET(req: NextRequest) {
  const range = (req.nextUrl.searchParams.get("range") ?? "1W") as TimeRange;
  const index = (req.nextUrl.searchParams.get("index") ?? "sp500") as IndexKey;

  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }
  if (!VALID_INDICES.includes(index)) {
    return NextResponse.json({ error: "Invalid index" }, { status: 400 });
  }

  const { tickers, names } = INDEX_DATA[index];
  try {
    const all = await getTopPerformers(range, new Set(tickers), names);
    return NextResponse.json({ all, range, index });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
