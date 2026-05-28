import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCachedSummary, saveSummary } from "@/lib/ai-summaries";
import type { StockResult } from "@/lib/polygon";
import { CATEGORY_LABELS, type ETFCategory } from "@/lib/etf-config";

const client = new Anthropic();

const VALID_RANGES = ["1D", "3D", "1W", "1M", "3M", "6M", "1Y", "5Y", "YTD"];
const VALID_CATEGORIES = ["broad", "sector", "bonds", "commodities", "international", "all"];

const RANGE_LABELS: Record<string, string> = {
  "1D": "1 day",
  "3D": "3 days",
  "1W": "1 week",
  "1M": "1 month",
  "3M": "3 months",
  "6M": "6 months",
  "1Y": "1 year",
  "5Y": "5 years",
  "YTD": "year to date",
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { category, range, etfs } = body as {
    category: ETFCategory | "all";
    range: string;
    etfs: StockResult[];
  };

  if (!VALID_CATEGORIES.includes(category) || !VALID_RANGES.includes(range)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const etHour = parseInt(now.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }), 10);
  const etMinute = now.toLocaleString("en-US", { timeZone: "America/New_York", minute: "2-digit" });
  const etTimeStr = now.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: true });
  const dayOfWeek = now.toLocaleString("en-US", { timeZone: "America/New_York", weekday: "long" });
  const isWeekday = !["Saturday", "Sunday"].includes(dayOfWeek);
  const marketOpen = isWeekday && (etHour > 9 || (etHour === 9 && parseInt(etMinute, 10) >= 30)) && etHour < 16;
  const marketStatus = marketOpen ? `markets are currently open (${etTimeStr} ET)` : `markets are closed (${etTimeStr} ET)`;
  const pk = `etf#${category}#${range}#${today}`;

  const cached = await getCachedSummary(pk, range === "1D" ? 60 * 60 : undefined);
  if (cached) {
    console.log(`AI ETF summary for ${pk} found in cache`);
    return NextResponse.json({ summary: cached, cached: true });
  }
  console.log(`Generating AI ETF summary for ${pk}`);

  const categoryLabel = category === "all" ? "all" : CATEGORY_LABELS[category as ETFCategory];
  const sortedEtfs = [...etfs].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  const etfLines = (category === "all" ? sortedEtfs : etfs)
    .slice(0, 15)
    .map((e, i) => {
      const sign = e.changePercent >= 0 ? "+" : "";
      return `${i + 1}. ${e.name} (${e.ticker}) — ${sign}${e.changePercent.toFixed(2)}%`;
    })
    .join("\n");

  const prompt = category === "all"
    ? `You are a concise financial market analyst. Below are the top-moving ETFs across all categories (broad market, sectors, bonds, commodities, international) over the past ${RANGE_LABELS[range]} as of ${today} (${marketStatus}), sorted by absolute move.

${etfLines}

Write exactly 2 paragraphs separated by a blank line:
- Paragraph 1: the biggest movers across asset classes — what led, what lagged, and what cross-asset themes stand out${marketOpen ? ". Use present tense where appropriate since trading is ongoing" : ""}
- Paragraph 2: the likely macro drivers behind these moves, drawing on your knowledge of market conditions for this period

Be direct and specific. Professional but accessible tone. No disclaimers. Plain text only — no markdown, no headers, no bullet points, no bold.`
    : `You are a concise financial market analyst. Below are the ${categoryLabel} ETFs ranked by performance over the past ${RANGE_LABELS[range]} as of ${today} (${marketStatus}).

${etfLines}

Write exactly 2 paragraphs separated by a blank line:
- Paragraph 1: which ETFs led and lagged, and what that tells us about the underlying market themes${marketOpen ? ". Use present tense where appropriate since trading is ongoing" : ""}
- Paragraph 2: likely macro or sector-specific drivers for this performance, drawing on your knowledge of market conditions for this period

Be direct and specific. Professional but accessible tone. No disclaimers. Plain text only — no markdown, no headers, no bullet points, no bold.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = (message.content[0] as { type: string; text: string }).text;

  saveSummary(pk, summary)
    .then(() => console.log(`AI ETF summary for ${pk} saved to cache`))
    .catch(console.error);

  return NextResponse.json({ summary, cached: false });
}
