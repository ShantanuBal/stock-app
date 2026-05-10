/**
 * Backfills the last N trading days of stock price data into DynamoDB.
 * Each day is one Polygon grouped-daily API call. Already-fetched days
 * (sentinel present) are skipped automatically.
 *
 * Usage:
 *   npm run backfill
 *   npm run backfill -- --days=60
 */

import { fetchGroupedDailyForBackfill, formatDate, getPreviousTradingDay } from "../lib/polygon";

const DAYS = parseInt(process.argv.find((a) => a.startsWith("--days="))?.split("=")[1] ?? "30");
const DELAY_MS = 12_000; // 5 calls/min free tier → 1 call every 12s

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTradingDays(count: number): string[] {
  const days: string[] = [];
  let cursor = getPreviousTradingDay(new Date(), 1);
  while (days.length < count) {
    days.push(formatDate(cursor));
    cursor = getPreviousTradingDay(cursor, 1);
  }
  return days.reverse(); // oldest first
}

(async () => {
  const days = getTradingDays(DAYS);
  console.log(`Backfilling ${days.length} trading days: ${days[0]} → ${days[days.length - 1]}\n`);

  for (const date of days) {
    process.stdout.write(`[${date}] Fetching... `);
    try {
      const count = await fetchGroupedDailyForBackfill(date);
      if (count === null) {
        console.log(`already in DynamoDB — skipped`);
      } else if (count === 0) {
        console.log(`no data returned (market closed or holiday)`);
      } else {
        console.log(`stored ${count} stocks ✓`);
      }
    } catch (err) {
      console.log(`ERROR: ${err}`);
    }
    await sleep(DELAY_MS);
  }

  console.log("\nBackfill complete.");
})();
