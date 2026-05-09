import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCachedSummary, saveSummary } from "@/lib/ai-summaries";
import { TICKER_SECTORS } from "@/lib/sp500";
import { NASDAQ100_SECTORS } from "@/lib/nasdaq100";
import { DJIA_SECTORS } from "@/lib/djia";
import { RUSSELL2000_SECTORS } from "@/lib/russell2000";
import type { IndexKey } from "../top-performers/route";
import type { StockResult } from "@/lib/polygon";

const client = new Anthropic();

const SECTOR_MAPS: Record<IndexKey, Record<string, string>> = {
  sp500: TICKER_SECTORS,
  nasdaq100: NASDAQ100_SECTORS,
  djia: DJIA_SECTORS,
  russell2000: RUSSELL2000_SECTORS,
};

const INDEX_LABELS: Record<IndexKey, string> = {
  sp500: "S&P 500",
  nasdaq100: "Nasdaq 100",
  djia: "Dow Jones Industrial Average",
  russell2000: "Russell 2000",
};

const RANGE_LABELS: Record<string, string> = {
  "1D": "1 day",
  "3D": "3 days",
  "1W": "1 week",
  "1M": "1 month",
  "3M": "3 months",
  "YTD": "year to date",
};

const VALID_INDICES: IndexKey[] = ["sp500", "nasdaq100", "djia", "russell2000"];
const VALID_RANGES = ["1D", "3D", "1W", "1M", "3M", "YTD"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { index, range, stocks } = body as {
    index: IndexKey;
    range: string;
    stocks: StockResult[];
  };

  if (!VALID_INDICES.includes(index) || !VALID_RANGES.includes(range)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];
  const pk = `${index}#${range}#${today}`;

  const cached = await getCachedSummary(pk);
  if (cached) {
    return NextResponse.json({ summary: cached, cached: true });
  }

  const sectorMap = SECTOR_MAPS[index];
  const top = (stocks as StockResult[]).slice(0, 15);

  const stockLines = top
    .map((s, i) => {
      const sector = sectorMap[s.ticker] ?? "Other";
      const sign = s.changePercent >= 0 ? "+" : "";
      return `${i + 1}. ${s.name} (${s.ticker}) — ${sector} — ${sign}${s.changePercent.toFixed(2)}%`;
    })
    .join("\n");

  const prompt = `You are a concise financial market analyst. Below are the top-performing stocks in the ${INDEX_LABELS[index]} over the past ${RANGE_LABELS[range]} as of ${today}.

${stockLines}

Write a 2–3 paragraph market summary covering:
- Which stocks and industry groups led the gains
- Likely macro or sector-specific reasons for the outperformance, drawing on your knowledge of market conditions and economic context for this period

Be direct and specific. Professional but accessible tone. No disclaimers.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = (message.content[0] as { type: string; text: string }).text;

  // Fire-and-forget cache write — don't block the response
  saveSummary(pk, summary).catch(console.error);

  return NextResponse.json({ summary, cached: false });
}
