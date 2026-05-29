import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCachedSummary, saveSummary } from "@/lib/ai-summaries";
import { getAllForexRates } from "@/lib/polygon-forex";
import { ytdDays } from "@/lib/date-utils";

const client = new Anthropic();

const MAJOR_PAIRS = [
  { symbol: "EUR/USD", ticker: "C:EURUSD" },
  { symbol: "USD/JPY", ticker: "C:USDJPY" },
  { symbol: "GBP/USD", ticker: "C:GBPUSD" },
  { symbol: "USD/CHF", ticker: "C:USDCHF" },
  { symbol: "AUD/USD", ticker: "C:AUDUSD" },
  { symbol: "USD/CAD", ticker: "C:USDCAD" },
];

const EM_PAIRS = [
  { symbol: "USD/CNY", ticker: "C:USDCNY" },
  { symbol: "USD/INR", ticker: "C:USDINR" },
  { symbol: "USD/BRL", ticker: "C:USDBRL" },
  { symbol: "USD/MXN", ticker: "C:USDMXN" },
  { symbol: "USD/KRW", ticker: "C:USDKRW" },
  { symbol: "USD/ZAR", ticker: "C:USDZAR" },
];

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
  const range = req.nextUrl.searchParams.get("range") ?? "1W";
  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const etHour = parseInt(now.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }), 10);
  const etMinute = now.toLocaleString("en-US", { timeZone: "America/New_York", minute: "2-digit" });
  const etTimeStr = now.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: true });
  const dayOfWeek = now.toLocaleString("en-US", { timeZone: "America/New_York", weekday: "long" });
  const isWeekday = !["Saturday", "Sunday"].includes(dayOfWeek);
  const marketOpen = isWeekday && (etHour > 9 || (etHour === 9 && parseInt(etMinute, 10) >= 30)) && etHour < 16;
  const marketStatus = marketOpen ? `US markets are currently open (${etTimeStr} ET)` : `US markets are closed (${etTimeStr} ET)`;
  const pk = `currencies#${range}#${today}`;

  const cached = await getCachedSummary(pk);
  if (cached) {
    console.log(`AI currencies summary for ${pk} found in cache`);
    return NextResponse.json({ summary: cached, cached: true });
  }
  console.log(`No AI currencies summary for ${pk} — generating with Claude`);

  const allTickers = [...MAJOR_PAIRS.map((p) => p.ticker), ...EM_PAIRS.map((p) => p.ticker)];
  const allRates = await getAllForexRates(allTickers);
  const days = rangeToDays(range);
  const rangeLabel = RANGE_LABELS[range] ?? range;

  const majorLines = MAJOR_PAIRS.map((pair, i) => {
    const r = allRates[i];
    if (!r) return null;
    const sliced = r.points.slice(-days);
    const changePct = sliced.length >= 2
      ? ((r.rate - sliced[0].value) / sliced[0].value) * 100
      : r.changePct;
    const sign = changePct >= 0 ? "+" : "";
    return `${pair.symbol}: ${r.rate.toFixed(4)} (${sign}${changePct.toFixed(2)}% over ${rangeLabel})`;
  }).filter(Boolean).join("\n");

  const emLines = EM_PAIRS.map((pair, i) => {
    const r = allRates[MAJOR_PAIRS.length + i];
    if (!r) return null;
    const sliced = r.points.slice(-days);
    const changePct = sliced.length >= 2
      ? ((r.rate - sliced[0].value) / sliced[0].value) * 100
      : r.changePct;
    const sign = changePct >= 0 ? "+" : "";
    return `${pair.symbol}: ${r.rate.toFixed(4)} (${sign}${changePct.toFixed(2)}% over ${rangeLabel})`;
  }).filter(Boolean).join("\n");

  const prompt = `You are a concise foreign exchange analyst. Below is today's (${today}, ${marketStatus}) snapshot of currency markets over the past ${rangeLabel}.

Major Pairs:
${majorLines}

Emerging Market Currencies:
${emLines}

Write exactly 2 paragraphs separated by a blank line:
- Paragraph 1: what the major pair moves over the past ${rangeLabel} reveal about USD strength or weakness and what is driving it — consider Fed policy expectations, risk appetite, and any notable divergences between pairs
- Paragraph 2: what the emerging market currency moves signal about global risk appetite, capital flows, and whether investors are in risk-on or risk-off mode

Be direct and specific. Professional but accessible tone. No disclaimers. Plain text only — no markdown, no headers, no bullet points, no bold.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = (message.content[0] as { type: string; text: string }).text;

  saveSummary(pk, summary)
    .then(() => console.log(`AI currencies summary for ${pk} saved to cache`))
    .catch(console.error);

  return NextResponse.json({ summary, cached: false });
}
