/**
 * Daily options maintenance job.
 * Run after market close (e.g. 1 AM UTC / 6 PM PT).
 *
 * Steps (in order):
 *   1. Rotate expired contracts — mark expired, find + write new ATM monthly contract
 *   2. Fetch today's prices — write close price for every active contract
 *
 * Usage:
 *   npm run daily:options
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand, PutCommand, GetCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";

const CONTRACTS_TABLE = process.env.OPTIONS_CONTRACTS_TABLE_NAME ?? "stock-app-options-contracts";
const PRICES_TABLE    = process.env.OPTIONS_PRICES_TABLE_NAME    ?? "stock-app-options-prices";
const API_KEY         = process.env.POLYGON_API_KEY!;
const BASE_URL        = "https://api.polygon.io";
const DELAY_MS        = 15_000;

const client    = new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-west-2" });
const docClient = DynamoDBDocumentClient.from(client);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
}

function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
}

// VIX is an index — Polygon free tier can't serve it; use FRED (series VIXCLS)
async function fetchVixPrice(): Promise<number> {
  const key = process.env.FRED_API_KEY;
  if (!key) throw new Error("FRED_API_KEY not set");
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=VIXCLS&api_key=${key}&file_type=json&sort_order=desc&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FRED fetch failed: ${res.status}`);
  const data = await res.json();
  const value = parseFloat(data.observations?.[0]?.value);
  if (isNaN(value)) throw new Error(`Could not parse VIX from FRED response`);
  return value;
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface Contract {
  underlying: string;
  contractKey: string;
  ticker: string;
  name: string;
  contractType: "call" | "put";
  strike: number;
  expiry: string;
  status: string;
}

interface PolygonContract {
  ticker: string;
  strike_price: number;
  expiration_date: string;
  contract_type: string;
}

// ── DynamoDB helpers ───────────────────────────────────────────────────────────

async function getActiveContracts(): Promise<Contract[]> {
  const res = await docClient.send(new ScanCommand({
    TableName: CONTRACTS_TABLE,
    FilterExpression: "#s = :active",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":active": "active" },
  }));
  return (res.Items ?? []) as Contract[];
}

async function markExpired(underlying: string, contractKey: string): Promise<void> {
  await docClient.send(new UpdateCommand({
    TableName: CONTRACTS_TABLE,
    Key: { underlying, contractKey },
    UpdateExpression: "SET #s = :expired",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":expired": "expired" },
  }));
}

async function writeNewContract(contract: Omit<Contract, "status">): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: CONTRACTS_TABLE,
    Item: { ...contract, status: "active" },
  }));
}

async function isYesterdayCached(ticker: string): Promise<boolean> {
  const res = await docClient.send(new GetCommand({
    TableName: PRICES_TABLE,
    Key: { ticker, date: daysAgo(1) },
  }));
  return !!res.Item;
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

// ── Polygon helpers ────────────────────────────────────────────────────────────

async function fetchCurrentPrice(underlying: string, retries = 3): Promise<number> {
  if (underlying === "VIX") return fetchVixPrice();

  const url = `${BASE_URL}/v2/aggs/ticker/${underlying}/prev?adjusted=true&apiKey=${API_KEY}`;
  const res = await fetch(url);
  if (res.status === 429 && retries > 0) {
    console.log(`  rate limited — waiting 60s (${retries} retries left)`);
    await sleep(60_000);
    return fetchCurrentPrice(underlying, retries - 1);
  }
  if (!res.ok) throw new Error(`Polygon prev aggs error for ${underlying}: ${res.status}`);
  const data  = await res.json();
  const close = data.results?.[0]?.c as number | undefined;
  if (close == null) throw new Error(`No price data for ${underlying}`);
  return close;
}

async function fetchContracts(underlying: string, contractType: "call" | "put", retries = 3): Promise<PolygonContract[]> {
  const from = daysFromNow(14);
  const to   = daysFromNow(90);
  const url  = `${BASE_URL}/v3/reference/options/contracts?underlying_ticker=${underlying}&expired=false&contract_type=${contractType}&expiration_date.gte=${from}&expiration_date.lte=${to}&sort=expiration_date&order=asc&limit=1000&apiKey=${API_KEY}`;
  const res  = await fetch(url);
  if (res.status === 429 && retries > 0) {
    console.log(`  rate limited — waiting 60s (${retries} retries left)`);
    await sleep(60_000);
    return fetchContracts(underlying, contractType, retries - 1);
  }
  if (!res.ok) throw new Error(`Polygon reference error: ${res.status}`);
  const data = await res.json();
  return data.results ?? [];
}

async function fetchRecentPrices(ticker: string, retries = 3): Promise<{ t: number; o: number; h: number; l: number; c: number; v: number }[]> {
  const from = daysAgo(4);
  const to   = daysAgo(1);
  const url  = `${BASE_URL}/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&apiKey=${API_KEY}`;
  const res  = await fetch(url);
  if (res.status === 429 && retries > 0) {
    console.log(`  rate limited — waiting 60s (${retries} retries left)`);
    await sleep(60_000);
    return fetchRecentPrices(ticker, retries - 1);
  }
  if (!res.ok) throw new Error(`Polygon aggs error: ${res.status}`);
  const data = await res.json();
  return data.results ?? [];
}

function isMonthlyExpiry(dateStr: string): boolean {
  const d = new Date(dateStr + "T12:00:00Z");
  const day = d.getUTCDay();
  const date = d.getUTCDate();
  // 3rd week (15–21), Wed–Sat: covers Fri/Sat equity, Thu NDX-style, Wed VIX
  return date >= 15 && date <= 21 && day >= 3 && day <= 6;
}

function findMonthlyATM(contracts: PolygonContract[], approxStrike: number): PolygonContract | null {
  if (!contracts.length) return null;

  const byExpiry = new Map<string, PolygonContract[]>();
  for (const c of contracts) {
    const arr = byExpiry.get(c.expiration_date) ?? [];
    arr.push(c);
    byExpiry.set(c.expiration_date, arr);
  }

  // Prefer 3rd-Friday (standard monthly) expiries; fall back to most-strikes heuristic
  const monthlyExpiries = [...byExpiry.keys()].filter(isMonthlyExpiry).sort();
  const monthlyExpiry = monthlyExpiries[0] ?? (() => {
    let best = ""; let max = 0;
    for (const [date, group] of byExpiry.entries()) {
      if (group.length > max) { max = group.length; best = date; }
    }
    return best;
  })();

  const monthly = byExpiry.get(monthlyExpiry) ?? [];
  return monthly.reduce((best, c) =>
    Math.abs(c.strike_price - approxStrike) < Math.abs(best.strike_price - approxStrike) ? c : best
  );
}

// ── Step 1: rotate expired contracts ──────────────────────────────────────────

async function rotateExpired(contracts: Contract[]): Promise<Contract[]> {
  const date = today();
  const expired = contracts.filter((c) => c.expiry < date);

  if (!expired.length) {
    console.log("No expired contracts — skipping rotation.\n");
    return contracts;
  }

  console.log(`Found ${expired.length} expired contract(s) to rotate:\n`);

  for (const contract of expired) {
    console.log(`[${contract.underlying}] ${contract.ticker} expired ${contract.expiry}`);

    await markExpired(contract.underlying, contract.contractKey);
    console.log(`  marked expired ✓`);

    await sleep(DELAY_MS);

    let currentPrice: number;
    try {
      currentPrice = await fetchCurrentPrice(contract.underlying);
      console.log(`  current price: $${currentPrice}`);
    } catch (err) {
      console.log(`  ERROR fetching current price: ${err} — skipping`);
      continue;
    }

    await sleep(DELAY_MS);

    let newContracts: PolygonContract[];
    try {
      newContracts = await fetchContracts(contract.underlying, contract.contractType);
    } catch (err) {
      console.log(`  ERROR fetching new contracts: ${err}`);
      continue;
    }

    const best = findMonthlyATM(newContracts, currentPrice);
    if (!best) {
      console.log(`  no replacement found — skipping`);
      continue;
    }

    console.log(`  replacement: ${best.ticker} (strike $${best.strike_price}, expiry ${best.expiration_date})`);

    await writeNewContract({
      underlying:   contract.underlying,
      contractKey:  contract.contractKey,
      ticker:       best.ticker,
      name:         contract.name,
      contractType: contract.contractType,
      strike:       best.strike_price,
      expiry:       best.expiration_date,
    });
    console.log(`  written to DynamoDB ✓\n`);

    await sleep(DELAY_MS);
  }

  // Re-scan so price fetch uses updated contracts
  return getActiveContracts();
}

// ── Step 2: fetch today's prices ───────────────────────────────────────────────

async function fetchTodayPrices(contracts: Contract[]): Promise<void> {
  console.log(`Fetching recent prices (last 4 days → ${daysAgo(1)}) for ${contracts.length} active contracts:\n`);

  let stored  = 0;
  let skipped = 0;

  for (const contract of contracts) {
    process.stdout.write(`[${contract.underlying}] ${contract.ticker} `);

    const cached = await isYesterdayCached(contract.ticker);
    if (cached) {
      console.log(`already cached — skipped`);
      skipped++;
      continue;
    }

    try {
      const rows  = await fetchRecentPrices(contract.ticker);
      const count = await storePrices(contract.ticker, rows);
      if (count === 0) {
        console.log(`no data (market closed?)`);
      } else {
        console.log(`stored ✓`);
        stored++;
      }
    } catch (err) {
      console.log(`ERROR: ${err}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone. Stored ${stored} prices, skipped ${skipped} already cached.`);
}

// ── Main ───────────────────────────────────────────────────────────────────────

(async () => {
  console.log(`=== daily-options ${today()} ===\n`);

  let contracts = await getActiveContracts();
  console.log(`Found ${contracts.length} active contracts.\n`);

  contracts = await rotateExpired(contracts);
  await fetchTodayPrices(contracts);
})();
