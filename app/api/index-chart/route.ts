import { NextRequest, NextResponse } from "next/server";
import { getIndexBars, getStartDate, formatDate, TimeRange, getPreviousTradingDay } from "@/lib/polygon";
import type { IndexKey } from "../top-performers/route";

// I:NDX is freely available on Polygon's free tier.
// S&P, DJIA, and Russell index data requires a paid license, so we use ETF
// proxies (SPY, DIA, IWM) and scale them back to index-level values.
const INDEX_CONFIG: Record<IndexKey, { ticker: string; scale: number }> = {
  sp500:       { ticker: "SPY",   scale: 10  }, // SPY ≈ SPX / 10
  nasdaq100:   { ticker: "I:NDX", scale: 1   }, // direct index data
  djia:        { ticker: "DIA",   scale: 100 }, // DIA ≈ DJIA / 100
  russell2000: { ticker: "IWM",   scale: 10  }, // IWM ≈ RUT / 10
};

const VALID_RANGES: TimeRange[] = ["1D", "3D", "1W", "1M", "3M", "6M", "1Y", "YTD"];
const VALID_INDICES = Object.keys(INDEX_CONFIG) as IndexKey[];

export async function GET(req: NextRequest) {
  const range = (req.nextUrl.searchParams.get("range") ?? "1W") as TimeRange;
  const index = (req.nextUrl.searchParams.get("index") ?? "sp500") as IndexKey;

  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }
  if (!VALID_INDICES.includes(index)) {
    return NextResponse.json({ error: "Invalid index" }, { status: 400 });
  }

  const yesterday = getPreviousTradingDay(new Date(), 1);
  const startDate = getStartDate(range, yesterday);

  const { ticker, scale } = INDEX_CONFIG[index];

  try {
    const raw = await getIndexBars(ticker, formatDate(startDate), formatDate(yesterday));
    const points = scale === 1 ? raw : raw.map((p) => ({ ...p, close: p.close * scale }));

    const changePercent =
      points.length >= 2
        ? ((points[points.length - 1].close - points[0].close) / points[0].close) * 100
        : 0;

    return NextResponse.json({
      points,
      changePercent,
      currentValue: points[points.length - 1]?.close ?? 0,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 });
  }
}
