import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCachedSummary, saveSummary } from "@/lib/ai-summaries";
import { getAllIndicators, INDICATOR_CONFIGS } from "@/lib/fred";

const client = new Anthropic();

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const pk = `economy#${today}`;

  const cached = await getCachedSummary(pk);
  if (cached) {
    console.log(`AI economy summary for ${today} found in cache`);
    return NextResponse.json({ summary: cached, cached: true });
  }
  console.log(`No AI economy summary for ${today} — generating with Claude`);

  const results = await getAllIndicators();

  const lines = INDICATOR_CONFIGS.map((config, i) => {
    const result = results[i];
    if (!result) return null;
    const changeStr = result.change != null
      ? ` (${result.change >= 0 ? "+" : ""}${result.change.toFixed(2)} ${config.changeLabel})`
      : "";
    return `${config.label}: ${result.value.toFixed(2)}${config.unitDisplay}${changeStr}`;
  }).filter(Boolean).join("\n");

  const prompt = `You are a concise economic analyst. Below are current US macroeconomic indicators as of ${today}.

${lines}

Write exactly 2 paragraphs separated by a blank line:
- Paragraph 1: summarise the current state of the US economy based on these indicators — growth, inflation, employment, and monetary policy
- Paragraph 2: what these readings collectively signal for the near-term economic outlook and what to watch

Be direct and specific. Professional but accessible tone. No disclaimers. Plain text only — no markdown, no headers, no bullet points, no bold.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = (message.content[0] as { type: string; text: string }).text;

  saveSummary(pk, summary)
    .then(() => console.log(`AI economy summary for ${today} saved to cache`))
    .catch(console.error);

  return NextResponse.json({ summary, cached: false });
}
