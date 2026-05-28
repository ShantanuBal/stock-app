import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCachedSummary, saveSummary } from "@/lib/ai-summaries";
import { getAllBondData, TREASURY_CONFIGS, CREDIT_CONFIGS } from "@/lib/fred-bonds";

const client = new Anthropic();

const RANGE_LABELS: Record<string, string> = {
  "1D": "1 day", "3D": "3 days", "1W": "1 week", "1M": "1 month",
  "3M": "3 months", "6M": "6 months", "1Y": "1 year", "YTD": "year to date",
};

function ytdDays(): number {
  const now = new Date();
  return Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000);
}

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
  const marketStatus = marketOpen ? `markets are currently open (${etTimeStr} ET)` : `markets are closed (${etTimeStr} ET)`;
  const pk = `bonds#${range}#${today}`;

  const cached = await getCachedSummary(pk);
  if (cached) {
    console.log(`AI bonds summary for ${pk} found in cache`);
    return NextResponse.json({ summary: cached, cached: true });
  }
  console.log(`No AI bonds summary for ${pk} — generating with Claude`);

  const { treasuries, credit } = await getAllBondData();
  const days = rangeToDays(range);
  const rangeLabel = RANGE_LABELS[range] ?? range;

  const treasuryLines = TREASURY_CONFIGS.map((config, i) => {
    const result = treasuries[i];
    if (!result) return null;
    const sliced = result.points.slice(-days);
    const change = sliced.length >= 2 ? result.value - sliced[0].value : result.change;
    const changeStr = change >= 0 ? `+${change.toFixed(2)}pp` : `${change.toFixed(2)}pp`;
    return `${config.label} (${config.maturityLabel}): ${result.value.toFixed(2)}% (${changeStr} over ${rangeLabel})`;
  }).filter(Boolean).join("\n");

  const creditLines = CREDIT_CONFIGS.map((config, i) => {
    const result = credit[i];
    if (!result) return null;
    const sliced = result.points.slice(-days);
    const change = sliced.length >= 2 ? result.value - sliced[0].value : result.change;
    const changeStr = change >= 0 ? `+${change.toFixed(2)}pp` : `${change.toFixed(2)}pp`;
    return `${config.label}: ${result.value.toFixed(2)}% (${changeStr} over ${rangeLabel})`;
  }).filter(Boolean).join("\n");

  const twoYear = treasuries[3]?.value;
  const tenYear = treasuries[5]?.value;
  const curveState = twoYear != null && tenYear != null
    ? twoYear > tenYear
      ? `inverted by ${(twoYear - tenYear).toFixed(2)}pp (2Y ${twoYear.toFixed(2)}% > 10Y ${tenYear.toFixed(2)}%)`
      : `normal — 10Y (${tenYear.toFixed(2)}%) above 2Y (${twoYear.toFixed(2)}%) by ${(tenYear - twoYear).toFixed(2)}pp`
    : "unknown";

  const prompt = `You are a concise fixed income analyst. Below is today's (${today}, ${marketStatus}) snapshot of US Treasury yields and credit market data over the past ${rangeLabel}.

Yield curve: ${curveState}

Treasury Yields:
${treasuryLines}

Credit & Inflation:
${creditLines}

Write exactly 2 paragraphs separated by a blank line:
- Paragraph 1: what the current yield curve shape and Treasury yield moves over the past ${rangeLabel} signal about monetary policy expectations, inflation, and economic growth outlook
- Paragraph 2: what the credit spreads and inflation breakevens reveal about market risk appetite and where stress or calm is being priced in

Be direct and specific. Professional but accessible tone. No disclaimers. Plain text only — no markdown, no headers, no bullet points, no bold.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = (message.content[0] as { type: string; text: string }).text;

  saveSummary(pk, summary)
    .then(() => console.log(`AI bonds summary for ${pk} saved to cache`))
    .catch(console.error);

  return NextResponse.json({ summary, cached: false });
}
