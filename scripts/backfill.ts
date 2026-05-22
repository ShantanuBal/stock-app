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

function getTradingDays(count: number): string[] {
  const days: string[] = [];
  let cursor = getPreviousTradingDay(new Date(), 1);
  while (days.length < count) {
    days.push(formatDate(cursor));
    cursor = getPreviousTradingDay(cursor, 1);
  }
  return days.reverse(); // oldest first
}

const CONCURRENCY = 3;

(async () => {
  const days = getTradingDays(DAYS);
  console.log(`Backfilling ${days.length} trading days: ${days[0]} → ${days[days.length - 1]} (concurrency: ${CONCURRENCY})\n`);

  let stored = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < days.length; i += CONCURRENCY) {
    const batch = days.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (date) => {
      try {
        const count = await fetchGroupedDailyForBackfill(date);
        if (count === null) {
          console.log(`[${date}] already in DynamoDB — skipped`);
          skipped++;
        } else if (count === 0) {
          console.log(`[${date}] no data (market closed or holiday)`);
        } else {
          console.log(`[${date}] stored ${count} stocks ✓`);
          stored += count;
        }
      } catch (err) {
        console.log(`[${date}] ERROR: ${err}`);
        errors++;
      }
    }));
  }

  console.log(`\nBackfill complete. Stored: ${stored} rows · Skipped: ${skipped} days · Errors: ${errors}`);
})();
