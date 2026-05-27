import { NextRequest, NextResponse } from "next/server";
import { getIndexBars, getStartDate, formatDate, TimeRange, getPreviousTradingDay, getTodayET } from "@/lib/polygon";

const VALID_RANGES: TimeRange[] = ["1D", "3D", "1W", "1M", "3M", "6M", "1Y", "5Y", "YTD"];

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  const range = (req.nextUrl.searchParams.get("range") ?? "1W") as TimeRange;

  if (!ticker) return NextResponse.json({ error: "Missing ticker" }, { status: 400 });
  if (!VALID_RANGES.includes(range)) return NextResponse.json({ error: "Invalid range" }, { status: 400 });

  const todayET = getTodayET();
  const isWeekday = todayET.getDay() !== 0 && todayET.getDay() !== 6;
  const endDate = isWeekday ? todayET : getPreviousTradingDay(todayET, 1);
  const startDate = getStartDate(range, endDate);

  try {
    const points = await getIndexBars(ticker, formatDate(startDate), formatDate(endDate));
    let changePercent = 0;
    if (points.length >= 2) {
      changePercent = ((points[points.length - 1].close - points[0].close) / points[0].close) * 100;
    } else if (points.length === 1) {
      for (let daysBack = 1; daysBack <= 5; daysBack++) {
        const prevDay = getPreviousTradingDay(new Date(points[0].date + "T12:00:00"), daysBack);
        const prev = await getIndexBars(ticker, formatDate(prevDay), formatDate(prevDay));
        if (prev.length > 0) {
          changePercent = ((points[0].close - prev[0].close) / prev[0].close) * 100;
          break;
        }
      }
    }

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
