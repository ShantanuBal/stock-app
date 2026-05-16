/**
 * Backfills historical forex + crypto data into DynamoDB (stock-app-forex-cache).
 * Uses Polygon's grouped daily endpoint — one API call per date, stores all
 * 16 tracked pairs. Already-stored dates are skipped automatically.
 *
 * Usage:
 *   npm run backfill:forex
 *   npm run backfill:forex -- --from=2024-06-01
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.FOREX_CACHE_TABLE_NAME ?? "stock-app-forex-cache";
const API_KEY = process.env.POLYGON_API_KEY!;
const BASE_URL = "https://api.polygon.io";
const DELAY_MS = 12_000; // 5 calls/min free tier → 1 call every 12s


const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-west-2" });
const docClient = DynamoDBDocumentClient.from(client);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDatesFrom(from: string): string[] {
  const dates: string[] = [];
  const start = new Date(from + "T12:00:00Z");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cursor = new Date(start);
  while (cursor < today) {
    dates.push(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

async function isDateCached(date: string): Promise<boolean> {
  // Check if any of our tickers already has data for this date
  const res = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { ticker: "C:EURUSD", date },
  }));
  return !!res.Item;
}

async function fetchGrouped(market: "fx" | "crypto", date: string): Promise<{ T: string; o: number; h: number; l: number; c: number; v: number }[]> {
  const res = await fetch(
    `${BASE_URL}/v2/aggs/grouped/locale/global/market/${market}/${date}?adjusted=true&apiKey=${API_KEY}`
  );
  if (res.status === 403) return [];
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.results ?? [];
}

async function fetchAndStore(date: string): Promise<number> {
  const fxResults = await fetchGrouped("fx", date);
  await sleep(DELAY_MS);
  const cryptoResults = await fetchGrouped("crypto", date);

  const items = [...fxResults, ...cryptoResults]
    .map((r) => ({
      PutRequest: {
        Item: { ticker: r.T, date, open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v },
      },
    }));

  if (!items.length) return 0;

  for (let i = 0; i < items.length; i += 25) {
    await docClient.send(new BatchWriteCommand({
      RequestItems: { [TABLE_NAME]: items.slice(i, i + 25) },
    }));
  }

  return items.length;
}

(async () => {
  const fromArg = process.argv.find((a) => a.startsWith("--from="))?.split("=")[1] ?? "2024-01-02";
  const dates = getDatesFrom(fromArg);

  console.log(`Backfilling forex data from ${fromArg} → today (${dates.length} dates)\n`);

  let stored = 0;
  let skipped = 0;

  for (const date of dates) {
    process.stdout.write(`[${date}] `);

    const cached = await isDateCached(date);
    if (cached) {
      console.log(`already cached — skipped`);
      skipped++;
      continue;
    }

    try {
      const count = await fetchAndStore(date);
      if (count === 0) {
        console.log(`no data (weekend/holiday)`);
      } else {
        console.log(`stored ${count} pairs ✓`);
        stored += count;
      }
    } catch (err) {
      console.log(`ERROR: ${err}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone. Stored ${stored} rows, skipped ${skipped} already-cached dates.`);
})();
