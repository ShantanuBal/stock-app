import { NextRequest, NextResponse } from "next/server";
import { getIndexBars, getStartDate, formatDate, TimeRange, getPreviousTradingDay } from "@/lib/polygon";

const VALID_RANGES: TimeRange[] = ["1D", "3D", "1W", "1M", "3M", "6M", "1Y", "YTD"];

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  const range = (req.nextUrl.searchParams.get("range") ?? "1W") as TimeRange;

  if (!ticker) return NextResponse.json({ error: "Missing ticker" }, { status: 400 });
  if (!VALID_RANGES.includes(range)) return NextResponse.json({ error: "Invalid range" }, { status: 400 });

  const yesterday = getPreviousTradingDay(new Date(), 1);
  const startDate = getStartDate(range, yesterday);

  try {
    const points = await getIndexBars(ticker, formatDate(startDate), formatDate(yesterday));
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
