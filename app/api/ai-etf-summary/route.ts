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

  const today = new Date().toISOString().split("T")[0];
  const pk = `etf#${category}#${range}#${today}`;

  const cached = await getCachedSummary(pk, range === "1D" ? 15 * 60 : undefined);
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
    ? `You are a concise financial market analyst. Below are the top-moving ETFs across all categories (broad market, sectors, bonds, commodities, international) over the past ${RANGE_LABELS[range]} as of ${today}, sorted by absolute move.

${etfLines}

Write exactly 2 paragraphs separated by a blank line:
- Paragraph 1: the biggest movers across asset classes — what led, what lagged, and what cross-asset themes stand out
- Paragraph 2: the likely macro drivers behind these moves, drawing on your knowledge of market conditions for this period

Be direct and specific. Professional but accessible tone. No disclaimers. Plain text only — no markdown, no headers, no bullet points, no bold.`
    : `You are a concise financial market analyst. Below are the ${categoryLabel} ETFs ranked by performance over the past ${RANGE_LABELS[range]} as of ${today}.

${etfLines}

Write exactly 2 paragraphs separated by a blank line:
- Paragraph 1: which ETFs led and lagged, and what that tells us about the underlying market themes
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
