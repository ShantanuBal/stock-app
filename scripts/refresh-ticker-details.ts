/**
 * Monthly refresh job for ticker details (description, homepage URL).
 * Runs in ECS Fargate, triggered by EventBridge Scheduler on the 1st of each month.
 * Always calls Polygon directly — bypasses the DynamoDB cache to force fresh data.
 * Exits 1 and prints JOB_FAILED if errors exceed 10% of tickers.
 */

import { SP500_SECTORS } from "../lib/sp500";
import { NASDAQ100_SECTORS } from "../lib/nasdaq100";
import { DJIA_SECTORS } from "../lib/djia";
import { RUSSELL2000_SECTORS } from "../lib/russell2000";
import { refreshTickerDetails } from "../lib/tickerDetails";

const DELAY_MS = 12_000; // 5 calls/min free tier → 1 call every 12s

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
  const tickers = uniqueTickers();
  console.log(`[refresh] Starting ticker details refresh for ${tickers.length} tickers`);

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
