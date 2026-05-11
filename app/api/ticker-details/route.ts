import { NextRequest, NextResponse } from "next/server";
import { getTickerDetails } from "@/lib/tickerDetails";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  if (!ticker) return NextResponse.json({ error: "Missing ticker" }, { status: 400 });

  const details = await getTickerDetails(ticker.toUpperCase());
  if (!details) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(details);
}
