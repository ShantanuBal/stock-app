import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getList } from "@/lib/watchlists";
import { getTopPerformers, TimeRange } from "@/lib/polygon";
import { batchGetTickerNamesAndIndustries } from "@/lib/tickerDetails";

const VALID_RANGES: TimeRange[] = ["1D", "3D", "1W", "1M", "3M", "6M", "1Y", "5Y", "YTD"];

export async function GET(req: NextRequest) {
  const listId = req.nextUrl.searchParams.get("listId");
  const range = (req.nextUrl.searchParams.get("range") ?? "1D") as TimeRange;

  if (!listId) return NextResponse.json({ error: "Missing listId" }, { status: 400 });
  if (!VALID_RANGES.includes(range)) return NextResponse.json({ error: "Invalid range" }, { status: 400 });

  const session = await getSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const list = await getList(session.username, listId);
    if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });
    if (list.tickers.length === 0) return NextResponse.json({ stocks: [], listName: list.name });

    const detailsMap = await batchGetTickerNamesAndIndustries(list.tickers);
    const names: Record<string, string> = {};
    const industries: Record<string, string> = {};
    for (const [ticker, info] of detailsMap) {
      names[ticker] = info.name;
      if (info.industry) industries[ticker] = info.industry;
    }
    // Fall back to ticker symbol for any without a name
    for (const ticker of list.tickers) {
      if (!names[ticker]) names[ticker] = ticker;
    }

    const stocks = await getTopPerformers(range, new Set(list.tickers), names);
    // Attach industry to results
    const stocksWithIndustry = stocks.map((s) => ({
      ...s,
      industry: industries[s.ticker],
    }));

    console.log(`[watchlist-stocks] ${session.username}/${listId} (${list.name}) — ${stocks.length} stocks, range=${range}`);
    return NextResponse.json({ stocks: stocksWithIndustry, listName: list.name });
  } catch (err) {
    console.error("[watchlist-stocks] error:", err);
    return NextResponse.json({ error: "Failed to fetch stocks" }, { status: 500 });
  }
}
