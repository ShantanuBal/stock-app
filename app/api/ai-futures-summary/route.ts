import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCachedSummary, saveSummary } from "@/lib/ai-summaries";
import { getAllMetalsData, getAllEnergyData, METALS_CONFIGS, ENERGY_CONFIGS } from "@/lib/polygon-commodities";
import { ytdDays } from "@/lib/date-utils";

const client = new Anthropic();

const RANGE_LABELS: Record<string, string> = {
  "1D": "1 day", "3D": "3 days", "1W": "1 week", "1M": "1 month",
  "3M": "3 months", "6M": "6 months", "1Y": "1 year", "YTD": "year to date",
};

function rangeToDays(range: string): number {
  if (range === "YTD") return ytdDays();
  const map: Record<string, number> = { "1D": 1, "3D": 3, "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };
  return map[range] ?? 30;
}

export async function GET(req: NextRequest) {
  const range = req.nextUrl.searchParams.get("range") ?? "1M";
  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const etHour = parseInt(now.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }), 10);
  const etMinute = now.toLocaleString("en-US", { timeZone: "America/New_York", minute: "2-digit" });
  const etTimeStr = now.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: true });
  const dayOfWeek = now.toLocaleString("en-US", { timeZone: "America/New_York", weekday: "long" });
  const isWeekday = !["Saturday", "Sunday"].includes(dayOfWeek);
  const marketOpen = isWeekday && (etHour > 9 || (etHour === 9 && parseInt(etMinute, 10) >= 30)) && etHour < 16;
  const marketStatus = marketOpen ? `US markets are currently open (${etTimeStr} ET)` : `US markets are closed (${etTimeStr} ET)`;
  const pk = `futures#${range}#${today}`;

  const cached = await getCachedSummary(pk);
  if (cached) {
    console.log(`AI futures summary for ${pk} found in cache`);
    return NextResponse.json({ summary: cached, cached: true });
  }
  console.log(`No AI futures summary for ${pk} — generating with Claude`);

  const [metalsData, energyData] = await Promise.all([getAllMetalsData(), getAllEnergyData()]);
  const days = rangeToDays(range);
  const rangeLabel = RANGE_LABELS[range] ?? range;

  const metalsLines = METALS_CONFIGS.map((config, i) => {
    const d = metalsData[i];
    if (!d) return null;
    const sliced = d.points.slice(-days);
    const changePct = sliced.length >= 2
      ? ((d.price - sliced[0].value) / sliced[0].value) * 100
      : d.changePct;
    const sign = changePct >= 0 ? "+" : "";
    return `${config.name} (${config.ticker}): $${d.price.toFixed(2)}/oz (${sign}${changePct.toFixed(2)}% over ${rangeLabel})`;
  }).filter(Boolean).join("\n");

  const energyLines = ENERGY_CONFIGS.map((config, i) => {
    const d = energyData[i];
    if (!d) return null;
    const unit = config.name === "Natural Gas" ? "/MMBtu" : "/barrel";
    const sliced = d.points.slice(-days);
    const changePct = sliced.length >= 2
      ? ((d.price - sliced[0].value) / sliced[0].value) * 100
      : d.changePct;
    const sign = changePct >= 0 ? "+" : "";
    return `${config.name}: $${d.price.toFixed(2)}${unit} (${sign}${changePct.toFixed(2)}% over ${rangeLabel})`;
  }).filter(Boolean).join("\n");

  const prompt = `You are a concise commodity markets analyst. Below is today's (${today}, ${marketStatus}) snapshot of precious metals and energy prices over the past ${rangeLabel}.

Precious Metals (spot prices, USD per troy oz):
${metalsLines}

Energy (spot prices):
${energyLines}

Write exactly 2 paragraphs separated by a blank line:
- Paragraph 1: what the precious metals moves over the past ${rangeLabel} signal — focus on gold relative to real rates, dollar strength, and risk appetite; mention silver/platinum/palladium if noteworthy
- Paragraph 2: what energy price moves reveal about supply/demand dynamics, inflationary pressure, and the global economic outlook

Be direct and specific. Professional but accessible tone. No disclaimers. Plain text only — no markdown, no headers, no bullet points, no bold.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = (message.content[0] as { type: string; text: string }).text;

  saveSummary(pk, summary)
    .then(() => console.log(`AI futures summary for ${pk} saved to cache`))
    .catch(console.error);

  return NextResponse.json({ summary, cached: false });
}
