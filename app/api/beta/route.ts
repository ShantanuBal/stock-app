import { NextRequest, NextResponse } from "next/server";
import { getBetas } from "@/lib/beta";

export async function POST(req: NextRequest) {
  const { tickers } = await req.json() as { tickers: string[] };
  if (!Array.isArray(tickers) || tickers.length === 0 || tickers.length > 600) {
    return NextResponse.json({ error: "Invalid tickers" }, { status: 400 });
  }
  try {
    const betas = await getBetas(tickers);
    return NextResponse.json({ betas });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to compute betas" }, { status: 500 });
  }
}
