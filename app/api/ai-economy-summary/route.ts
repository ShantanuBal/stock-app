import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCachedSummary, saveSummary } from "@/lib/ai-summaries";
import { getAllIndicators, INDICATOR_CONFIGS } from "@/lib/fred";

const client = new Anthropic();

const RANGE_LABELS: Record<string, string> = {
  "6M": "6 months", "1Y": "1 year", "2Y": "2 years",
};

function rangeToDays(range: string): number {
  const map: Record<string, number> = { "6M": 180, "1Y": 365, "2Y": 730 };
  return map[range] ?? 365;
}

export async function GET(req: NextRequest) {
  const range = req.nextUrl.searchParams.get("range") ?? "1Y";
  const today = new Date().toISOString().split("T")[0];
  const pk = `economy#${range}#${today}`;

  const cached = await getCachedSummary(pk);
  if (cached) {
    console.log(`AI economy summary for ${pk} found in cache`);
    return NextResponse.json({ summary: cached, cached: true });
  }
  console.log(`No AI economy summary for ${pk} — generating with Claude`);

  const results = await getAllIndicators();
  const days = rangeToDays(range);
  const rangeLabel = RANGE_LABELS[range] ?? range;

  const lines = INDICATOR_CONFIGS.map((config, i) => {
    const result = results[i];
    if (!result) return null;
    const sliced = result.points.slice(-days);
    const change = sliced.length >= 2 ? result.value - sliced[0].value : result.change;
    const sign = change >= 0 ? "+" : "";
    return `${config.label}: ${result.value.toFixed(2)}${config.unitDisplay} (${sign}${change.toFixed(2)} over ${rangeLabel})`;
  }).filter(Boolean).join("\n");

  const prompt = `You are a concise economic analyst. Below are current US macroeconomic indicators as of ${today}, with changes over the past ${rangeLabel}.

${lines}

Write exactly 2 paragraphs separated by a blank line:
- Paragraph 1: summarise the current state of the US economy based on these indicators — growth, inflation, employment, and monetary policy — noting significant moves over the past ${rangeLabel}
- Paragraph 2: what these readings collectively signal for the near-term economic outlook and what to watch

Be direct and specific. Professional but accessible tone. No disclaimers. Plain text only — no markdown, no headers, no bullet points, no bold.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = (message.content[0] as { type: string; text: string }).text;

  saveSummary(pk, summary)
    .then(() => console.log(`AI economy summary for ${pk} saved to cache`))
    .catch(console.error);

  return NextResponse.json({ summary, cached: false });
}
