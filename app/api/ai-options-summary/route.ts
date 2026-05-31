import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCachedSummary, saveSummary } from "@/lib/ai-summaries";
import { get1DCacheContext } from "@/lib/date-utils";
import type { OptionData } from "@/lib/polygon-options";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { contracts, range } = await req.json() as { contracts: OptionData[]; range: string };

  if (!Array.isArray(contracts) || contracts.length === 0) {
    return NextResponse.json({ error: "No contracts provided" }, { status: 400 });
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

  const oneDCtx = range === "1D" ? get1DCacheContext() : null;
  const promptDate = oneDCtx?.promptDate ?? today;
  const effectiveMarketStatus = oneDCtx?.isWeekend ? oneDCtx.marketStatus : marketStatus;
  const pk = `options#${range}#${oneDCtx?.cacheDate ?? today}`;

  const cached = await getCachedSummary(pk);
  if (cached) {
    console.log(`AI options summary for ${pk} found in DynamoDB — skipping Claude call`);
    return NextResponse.json({ summary: cached, cached: true });
  }
  console.log(`No AI options summary for ${pk} — generating with Claude`);

  const vix = contracts.find((c) => c.underlying === "VIX");
  const vixLine = vix
    ? `VIX (fear index) is at $${vix.underlyingPrice?.toFixed(2) ?? "N/A"} — VIX call premium: $${vix.premium.toFixed(2)} (${vix.changePct >= 0 ? "+" : ""}${vix.changePct.toFixed(2)}%)`
    : "";

  const contractLines = contracts
    .filter((c) => c.underlying !== "VIX")
    .map((c) => {
      const sign = c.changePct >= 0 ? "+" : "";
      const spotLine = c.underlyingPrice != null ? `, spot $${c.underlyingPrice.toFixed(2)}` : "";
      return `${c.underlying} ${c.contractType.toUpperCase()} — strike $${c.strike}${spotLine} — premium $${c.premium.toFixed(2)} (${sign}${c.changePct.toFixed(2)}%)`;
    })
    .join("\n");

  const prompt = `You are a concise options market analyst. Below is the (${promptDate}, ${effectiveMarketStatus}) snapshot of at-the-money monthly option premiums for major US stocks and ETFs.

${vixLine}

${contractLines}

Write exactly 2 paragraphs separated by a blank line:
- Paragraph 1: what the overall options market picture suggests about current market sentiment — reference the VIX level, the put/call premium patterns, and any notable divergences between stocks and index ETFs
- Paragraph 2: which contracts saw the biggest premium moves and what that signals about expected volatility in those names

Be direct and specific. Professional but accessible tone. No disclaimers. Plain text only — no markdown, no headers, no bullet points, no bold.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = (message.content[0] as { type: string; text: string }).text;

  saveSummary(pk, summary)
    .then(() => console.log(`AI options summary for ${pk} saved to DynamoDB`))
    .catch(console.error);

  return NextResponse.json({ summary, cached: false });
}
