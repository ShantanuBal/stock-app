/**
 * Daily refresh job for ticker details and earnings (description, shares outstanding, net income).
 * Runs in ECS Fargate, triggered by EventBridge Scheduler daily at midnight PST (8 AM UTC).
 * Makes 2 sequential Polygon API calls per ticker with 15s between them (4 calls/min, under free tier limit).
 * Exits 1 and prints JOB_FAILED if errors exceed 10% of tickers.
 */

import { SP500_SECTORS } from "../lib/sp500";
import { NASDAQ100_SECTORS } from "../lib/nasdaq100";
import { DJIA_SECTORS } from "../lib/djia";
import { RUSSELL2000_SECTORS } from "../lib/russell2000";
import { refreshTickerDetails } from "../lib/tickerDetails";

const DELAY_MS = 15_000; // 15s after financials call before next ticker → 4 calls/min total

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uniqueTickers(): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const source of [SP500_SECTORS, NASDAQ100_SECTORS, DJIA_SECTORS, RUSSELL2000_SECTORS]) {
    for (const ticker of Object.keys(source)) {
      if (!seen.has(ticker)) {
        seen.add(ticker);
        result.push(ticker);
      }
    }
  }
  return result;
}

(async () => {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;

  const allTickers = uniqueTickers();
  const tickers = limit ? allTickers.slice(0, limit) : allTickers;
  console.log(`[refresh] Starting ticker details refresh for ${tickers.length} tickers${limit ? ` (limited to ${limit})` : ""}`);

  let refreshed = 0;
  let errors = 0;

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];
    process.stdout.write(`[refresh] [${i + 1}/${tickers.length}] ${ticker}... `);
    try {
      const details = await refreshTickerDetails(ticker);
      if (details) {
        console.log("ok");
        refreshed++;
      } else {
        console.log("no data");
        errors++;
      }
    } catch (err) {
      console.log(`ERROR: ${err}`);
      errors++;
    }
    await sleep(DELAY_MS);
  }

  const errorRate = errors / tickers.length;
  console.log(`\n[refresh] Done. Refreshed: ${refreshed} · Errors: ${errors}`);

  if (errorRate > 0.1) {
    console.log(`JOB_FAILED error rate ${(errorRate * 100).toFixed(1)}% exceeds threshold`);
    process.exit(1);
  }
})();
