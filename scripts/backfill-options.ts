/**
 * Backfills historical premium data for all active options contracts.
 * Reads tracked contracts from stock-app-options-contracts, fetches
 * daily OHLCV from Polygon, and writes to stock-app-options-prices.
 * Already-stored dates are skipped automatically.
 *
 * Usage:
 *   npm run backfill:options
 *   npm run backfill:options -- --days=60
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, GetCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";

const CONTRACTS_TABLE = process.env.OPTIONS_CONTRACTS_TABLE_NAME ?? "stock-app-options-contracts";
const PRICES_TABLE    = process.env.OPTIONS_PRICES_TABLE_NAME    ?? "stock-app-options-prices";
const API_KEY         = process.env.POLYGON_API_KEY!;
const BASE_URL        = "https://api.polygon.io";

const client    = new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-west-2" });
const docClient = DynamoDBDocumentClient.from(client);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

async function getActiveContracts(): Promise<{ ticker: string; underlying: string }[]> {
  const res = await docClient.send(new ScanCommand({
    TableName: CONTRACTS_TABLE,
    FilterExpression: "#s = :active",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":active": "active" },
  }));
  return (res.Items ?? []).map((item) => ({
    ticker:     item.ticker as string,
    underlying: item.underlying as string,
  }));
}

async function isAlreadyCached(ticker: string): Promise<boolean> {
  const res = await docClient.send(new GetCommand({
    TableName: PRICES_TABLE,
    Key: { ticker, date: today() },
  }));
  return !!res.Item;
}

async function fetchPriceHistory(ticker: string, from: string, to: string, retries = 3): Promise<{ t: number; o: number; h: number; l: number; c: number; v: number }[]> {
  const url = `${BASE_URL}/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&apiKey=${API_KEY}`;
  const res = await fetch(url);
  if (res.status === 429 && retries > 0) {
    console.log(`    rate limited — waiting 1s (${retries} retries left)`);
    await sleep(1_000);
    return fetchPriceHistory(ticker, from, to, retries - 1);
  }
  if (!res.ok) throw new Error(`Polygon aggs error: ${res.status}`);
  const data = await res.json();
  return data.results ?? [];
}

async function storePrices(ticker: string, rows: { t: number; o: number; h: number; l: number; c: number; v: number }[]): Promise<number> {
  if (!rows.length) return 0;

  const items = rows.map((r) => ({
    PutRequest: {
      Item: {
        ticker,
        date:   new Date(r.t).toISOString().split("T")[0],
        open:   r.o,
        high:   r.h,
        low:    r.l,
        close:  r.c,
        volume: r.v,
      },
    },
  }));

  for (let i = 0; i < items.length; i += 25) {
    await docClient.send(new BatchWriteCommand({
      RequestItems: { [PRICES_TABLE]: items.slice(i, i + 25) },
    }));
  }

  return items.length;
}

(async () => {
  const daysArg = process.argv.find((a) => a.startsWith("--days="))?.split("=")[1];
  const days    = daysArg ? parseInt(daysArg) : 90;
  const from    = daysAgo(days);
  const to      = today();

  console.log(`Backfilling options price history: ${from} → ${to} (${days} days)\n`);

  const contracts = await getActiveContracts();
  console.log(`Found ${contracts.length} active contracts\n`);

  let totalStored  = 0;
  let totalSkipped = 0;

  for (const { ticker, underlying } of contracts) {
    process.stdout.write(`[${underlying}] ${ticker} `);

    const cached = await isAlreadyCached(ticker);
    if (cached) {
      console.log(`already up to date — skipped`);
      totalSkipped++;
      continue;
    }

    try {
      const rows  = await fetchPriceHistory(ticker, from, to);
      const count = await storePrices(ticker, rows);
      if (count === 0) {
        console.log(`no data returned`);
      } else {
        console.log(`stored ${count} days ✓`);
        totalStored += count;
      }
    } catch (err) {
      console.log(`ERROR: ${err}`);
    }
  }

  console.log(`\nDone. Stored ${totalStored} rows, skipped ${totalSkipped} already up-to-date contracts.`);
})();
