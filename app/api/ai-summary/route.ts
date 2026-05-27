import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCachedSummary, saveSummary } from "@/lib/ai-summaries";
import { SP500_SECTORS } from "@/lib/sp500";
import { NASDAQ100_SECTORS } from "@/lib/nasdaq100";
import { DJIA_SECTORS } from "@/lib/djia";
import { RUSSELL2000_SECTORS } from "@/lib/russell2000";
import type { IndexKey } from "../top-performers/route";
import type { StockResult } from "@/lib/polygon";

const client = new Anthropic();

type IndexKeyWithoutAll = Exclude<IndexKey, "all">;

const SECTOR_MAPS: Record<IndexKeyWithoutAll, Record<string, string>> = {
  sp500: SP500_SECTORS,
  nasdaq100: NASDAQ100_SECTORS,
  djia: DJIA_SECTORS,
  russell2000: RUSSELL2000_SECTORS,
};

const INDEX_LABELS: Record<IndexKeyWithoutAll, string> = {
  sp500: "S&P 500",
  nasdaq100: "Nasdaq 100",
  djia: "Dow Jones Industrial Average",
  russell2000: "Russell 2000",
};

const RANGE_LABELS: Record<string, string> = {
  "1D": "today",
  "3D": "the past 3 days",
  "1W": "the past week",
  "1M": "the past month",
  "3M": "the past 3 months",
  "6M": "the past 6 months",
  "1Y": "the past year",
  "5Y": "the past 5 years",
  "YTD": "year to date",
};

const VALID_INDICES: (IndexKey | "summary")[] = ["sp500", "nasdaq100", "djia", "russell2000", "summary"];
const VALID_RANGES = ["1D", "3D", "1W", "1M", "3M", "6M", "1Y", "5Y", "YTD"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { index, range, stocks, indices } = body as {
    index: IndexKey | "summary";
    range: string;
    stocks?: StockResult[];
    indices?: { label: string; changePercent: number }[];
  };

  if (!VALID_INDICES.includes(index) || !VALID_RANGES.includes(range)) {
    console.error(`AI summary: invalid params — index=${index}, range=${range}`);
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];
  const pk = `${index}#${range}#${today}`;

  const cached = await getCachedSummary(pk, range === "1D" ? 15 * 60 : undefined);
  if (cached) {
    console.log(`AI summary for ${pk} found in DynamoDB — skipping Claude call`);
    return NextResponse.json({ summary: cached, cached: true });
  }
  console.log(`No AI summary found for ${pk} — generating with Claude`);

  let prompt: string;
  let maxTokens: number;

  if (index === "summary") {
    const indexLines = (indices ?? [])
      .map(({ label, changePercent }) => `${label}: ${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`)
      .join(", ");

    prompt = `You are a concise financial market analyst. The major US equity indices performed as follows for ${RANGE_LABELS[range] ?? range} as of ${today}: ${indexLines}.

Write exactly 2 paragraphs separated by a blank line:
- Paragraph 1: the overall market direction and which indices led or lagged, noting any notable divergences between them
- Paragraph 2: the likely macro or sector-specific drivers behind this performance, drawing on your knowledge of market conditions and economic context for this period

Be direct and specific. Professional but accessible tone. No disclaimers. Plain text only — no markdown, no headers, no bullet points, no bold.`;
    maxTokens = 600;
  } else {
    const sectorMap = SECTOR_MAPS[index as IndexKeyWithoutAll] ?? {};
    const top = (stocks ?? []).slice(0, 15);

    const stockLines = top
      .map((s, i) => {
        const sector = sectorMap[s.ticker] ?? "Other";
        const sign = s.changePercent >= 0 ? "+" : "";
        return `${i + 1}. ${s.name} (${s.ticker}) — ${sector} — ${sign}${s.changePercent.toFixed(2)}%`;
      })
      .join("\n");

    prompt = `You are a concise financial market analyst. Below are the top-performing stocks in the ${INDEX_LABELS[index as IndexKeyWithoutAll] ?? index} over the past ${RANGE_LABELS[range]} as of ${today}.

${stockLines}

Write exactly 2 paragraphs separated by a blank line:
- Paragraph 1: which stocks and industry groups led the gains
- Paragraph 2: likely macro or sector-specific reasons for the outperformance, drawing on your knowledge of market conditions and economic context for this period

Be direct and specific. Professional but accessible tone. No disclaimers. Plain text only — no markdown, no headers, no bullet points, no bold.`;
    maxTokens = 600;
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = (message.content[0] as { type: string; text: string }).text;

  // Fire-and-forget cache write — don't block the response
  saveSummary(pk, summary)
    .then(() => console.log(`AI summary for ${pk} saved to DynamoDB — future requests will be served from cache`))
    .catch(console.error);

  return NextResponse.json({ summary, cached: false });
}
