/**
 * Backfills Polygon ticker details (description, homepage URL) into DynamoDB
 * for all tickers across S&P 500, Nasdaq 100, DJIA, and Russell 2000.
 * Already-cached tickers (present in DynamoDB) are skipped automatically.
 *
 * Usage:
 *   npm run backfill:details
 */

import { SP500_SECTORS } from "../lib/sp500";
import { NASDAQ100_SECTORS } from "../lib/nasdaq100";
import { DJIA_SECTORS } from "../lib/djia";
import { RUSSELL2000_SECTORS } from "../lib/russell2000";
import { getTickerDetails } from "../lib/tickerDetails";

const DELAY_MS = 12_000; // 5 calls/min free tier → 1 call every 12s

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uniqueTickers(): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const sources = [SP500_SECTORS, NASDAQ100_SECTORS, DJIA_SECTORS, RUSSELL2000_SECTORS];
  for (const source of sources) {
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
  console.log(`Backfilling ticker details for ${tickers.length} unique tickers\n`);

  let fetched = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];
    process.stdout.write(`[${i + 1}/${tickers.length}] ${ticker}... `);
    try {
      // getTickerDetails checks DynamoDB first — returns cached item without hitting Polygon
      // We detect a cache hit by timing: if it returns instantly it was cached
      const before = Date.now();
      const details = await getTickerDetails(ticker);
      const elapsed = Date.now() - before;
      const wasCached = elapsed < 200; // DynamoDB get is <50ms; Polygon call is >200ms

      if (!details) {
        console.log(`no data returned`);
        errors++;
        await sleep(DELAY_MS);
      } else if (wasCached) {
        console.log(`already cached — skipped`);
        skipped++;
      } else {
        console.log(`stored ✓`);
        fetched++;
        await sleep(DELAY_MS);
      }
    } catch (err) {
      console.log(`ERROR: ${err}`);
      errors++;
      await sleep(DELAY_MS);
    }
  }

  console.log(`\nBackfill complete. Fetched: ${fetched} · Skipped: ${skipped} · Errors: ${errors}`);
})();
