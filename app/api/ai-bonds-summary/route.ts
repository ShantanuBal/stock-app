import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCachedSummary, saveSummary } from "@/lib/ai-summaries";
import { getAllBondData, TREASURY_CONFIGS, CREDIT_CONFIGS } from "@/lib/fred-bonds";

const client = new Anthropic();

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const pk = `bonds#${today}`;

  const cached = await getCachedSummary(pk);
  if (cached) {
    console.log(`AI bonds summary for ${today} found in cache`);
    return NextResponse.json({ summary: cached, cached: true });
  }
  console.log(`No AI bonds summary for ${today} — generating with Claude`);

  const { treasuries, credit } = await getAllBondData();

  const treasuryLines = TREASURY_CONFIGS.map((config, i) => {
    const result = treasuries[i];
    if (!result) return null;
    const change = result.change >= 0 ? `+${result.change.toFixed(2)}pp` : `${result.change.toFixed(2)}pp`;
    return `${config.label} (${config.maturityLabel}): ${result.value.toFixed(2)}% (${change} vs prev day)`;
  }).filter(Boolean).join("\n");

  const creditLines = CREDIT_CONFIGS.map((config, i) => {
    const result = credit[i];
    if (!result) return null;
    const change = result.change >= 0 ? `+${result.change.toFixed(2)}pp` : `${result.change.toFixed(2)}pp`;
    return `${config.label}: ${result.value.toFixed(2)}% (${change} vs prev day)`;
  }).filter(Boolean).join("\n");

  const twoYear = treasuries[3]?.value;
  const tenYear = treasuries[5]?.value;
  const curveState = twoYear != null && tenYear != null
    ? twoYear > tenYear
      ? `inverted by ${(twoYear - tenYear).toFixed(2)}pp (2Y ${twoYear.toFixed(2)}% > 10Y ${tenYear.toFixed(2)}%)`
      : `normal — 10Y (${tenYear.toFixed(2)}%) above 2Y (${twoYear.toFixed(2)}%) by ${(tenYear - twoYear).toFixed(2)}pp`
    : "unknown";

  const prompt = `You are a concise fixed income analyst. Below is today's (${today}) snapshot of US Treasury yields and credit market data.

Yield curve: ${curveState}

Treasury Yields:
${treasuryLines}

Credit & Inflation:
${creditLines}

Write exactly 2 paragraphs separated by a blank line:
- Paragraph 1: what the current yield curve shape and level of Treasury yields signals about monetary policy expectations, inflation, and economic growth outlook
- Paragraph 2: what the credit spreads and inflation breakevens reveal about market risk appetite and where stress or calm is being priced in

Be direct and specific. Professional but accessible tone. No disclaimers. Plain text only — no markdown, no headers, no bullet points, no bold.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = (message.content[0] as { type: string; text: string }).text;

  saveSummary(pk, summary)
    .then(() => console.log(`AI bonds summary for ${today} saved to cache`))
    .catch(console.error);

  return NextResponse.json({ summary, cached: false });
}
