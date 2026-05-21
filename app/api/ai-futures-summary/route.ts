import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCachedSummary, saveSummary } from "@/lib/ai-summaries";
import { getAllMetalsData, getAllEnergyData, METALS_CONFIGS, ENERGY_CONFIGS } from "@/lib/polygon-commodities";

const client = new Anthropic();

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const pk = `futures#${today}`;

  const cached = await getCachedSummary(pk);
  if (cached) {
    console.log(`AI futures summary for ${today} found in cache`);
    return NextResponse.json({ summary: cached, cached: true });
  }
  console.log(`No AI futures summary for ${today} — generating with Claude`);

  const [metalsData, energyData] = await Promise.all([
    getAllMetalsData(),
    getAllEnergyData(),
  ]);

  const metalsLines = METALS_CONFIGS.map((config, i) => {
    const d = metalsData[i];
    if (!d) return null;
    const change = d.changePct >= 0 ? `+${d.changePct.toFixed(2)}%` : `${d.changePct.toFixed(2)}%`;
    return `${config.name} (${config.ticker}): $${d.price.toFixed(2)}/oz (${change} vs prev day)`;
  }).filter(Boolean).join("\n");

  const energyLines = ENERGY_CONFIGS.map((config, i) => {
    const d = energyData[i];
    if (!d) return null;
    const unit = config.name === "Natural Gas" ? "/MMBtu" : "/barrel";
    const change = d.changePct >= 0 ? `+${d.changePct.toFixed(2)}%` : `${d.changePct.toFixed(2)}%`;
    return `${config.name}: $${d.price.toFixed(2)}${unit} (${change} vs prev day)`;
  }).filter(Boolean).join("\n");

  const prompt = `You are a concise commodity markets analyst. Below is today's (${today}) snapshot of precious metals and energy prices.

Precious Metals (spot prices, USD per troy oz):
${metalsLines}

Energy (spot prices):
${energyLines}

Write exactly 2 paragraphs separated by a blank line:
- Paragraph 1: what the current precious metals price levels and moves signal — focus on what gold is doing relative to real rates, dollar strength, and risk appetite; mention silver/platinum/palladium if noteworthy
- Paragraph 2: what energy prices reveal about supply/demand dynamics, inflationary pressure, and the global economic outlook

Be direct and specific. Professional but accessible tone. No disclaimers. Plain text only — no markdown, no headers, no bullet points, no bold.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = (message.content[0] as { type: string; text: string }).text;

  saveSummary(pk, summary)
    .then(() => console.log(`AI futures summary for ${today} saved to cache`))
    .catch(console.error);

  return NextResponse.json({ summary, cached: false });
}
