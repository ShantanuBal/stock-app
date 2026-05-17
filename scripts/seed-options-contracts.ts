/**
 * Seeds stock-app-options-contracts with the initial set of tracked contracts.
 * For each underlying, fetches the actual current price from Polygon, then
 * queries to find the nearest monthly ATM contract.
 *
 * Usage:
 *   npm run seed:options
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.OPTIONS_CONTRACTS_TABLE_NAME ?? "stock-app-options-contracts";
const API_KEY    = process.env.POLYGON_API_KEY!;
const BASE_URL   = "https://api.polygon.io";
const DELAY_MS   = 15_000;

const client    = new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-west-2" });
const docClient = DynamoDBDocumentClient.from(client);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
}

// VIX is an index — Polygon uses the I: prefix for price lookups
const PRICE_TICKER: Record<string, string> = {
  VIX: "I:VIX",
};

function priceTicker(underlying: string): string {
  return PRICE_TICKER[underlying] ?? underlying;
}

const UNDERLYINGS = [
  { ticker: "AAPL",  name: "Apple Inc."            },
  { ticker: "AMZN",  name: "Amazon.com Inc."        },
  { ticker: "GOOGL", name: "Alphabet Inc."           },
  { ticker: "META",  name: "Meta Platforms Inc."     },
  { ticker: "MSFT",  name: "Microsoft Corp."         },
  { ticker: "NVDA",  name: "NVIDIA Corp."            },
  { ticker: "TSLA",  name: "Tesla Inc."              },
  { ticker: "QQQ",   name: "Invesco QQQ Trust"       },
  { ticker: "SPY",   name: "SPDR S&P 500 ETF"        },
  { ticker: "VIX",   name: "CBOE Volatility Index"   },
];

interface PolygonContract {
  ticker: string;
  strike_price: number;
  expiration_date: string;
  contract_type: string;
}

async function fetchCurrentPrice(underlying: string, retries = 3): Promise<number> {
  const ticker = priceTicker(underlying);
  const url    = `${BASE_URL}/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${API_KEY}`;
  const res    = await fetch(url);
  if (res.status === 429 && retries > 0) {
    console.log(`  rate limited — waiting 60s (${retries} retries left)`);
    await sleep(60_000);
    return fetchCurrentPrice(underlying, retries - 1);
  }
  if (!res.ok) throw new Error(`Polygon prev aggs error for ${ticker}: ${res.status}`);
  const data = await res.json();
  const close = data.results?.[0]?.c as number | undefined;
  if (close == null) throw new Error(`No price data for ${ticker}`);
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
  if (!res.ok) throw new Error(`Polygon reference API error: ${res.status}`);
  const data = await res.json();
  return data.results ?? [];
}

function findMonthlyATM(contracts: PolygonContract[], currentPrice: number): PolygonContract | null {
  if (!contracts.length) return null;

  const byExpiry = new Map<string, PolygonContract[]>();
  for (const c of contracts) {
    const arr = byExpiry.get(c.expiration_date) ?? [];
    arr.push(c);
    byExpiry.set(c.expiration_date, arr);
  }

  let monthlyExpiry = "";
  let maxStrikes    = 0;
  for (const [date, group] of byExpiry.entries()) {
    if (group.length > maxStrikes) {
      maxStrikes    = group.length;
      monthlyExpiry = date;
    }
  }

  const monthly = byExpiry.get(monthlyExpiry) ?? [];
  return monthly.reduce((best, c) =>
    Math.abs(c.strike_price - currentPrice) < Math.abs(best.strike_price - currentPrice) ? c : best
  );
}

async function seedContract(underlying: string, name: string, currentPrice: number, contractType: "call" | "put") {
  console.log(`  [${contractType}] fetching Polygon contracts...`);
  const contracts = await fetchContracts(underlying, contractType);
  const best      = findMonthlyATM(contracts, currentPrice);

  if (!best) {
    console.log(`  [${contractType}] no contracts found — skipping`);
    return;
  }

  console.log(`  [${contractType}] selected ${best.ticker} (strike $${best.strike_price}, expiry ${best.expiration_date})`);

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      underlying,
      contractKey: contractType,
      ticker:      best.ticker,
      name,
      contractType,
      strike:      best.strike_price,
      expiry:      best.expiration_date,
      status:      "active",
    },
  }));

  console.log(`  [${contractType}] written to DynamoDB ✓`);
}

(async () => {
  console.log(`Seeding ${TABLE_NAME} with ${UNDERLYINGS.length} underlyings (call + put each)\n`);

  for (const { ticker, name } of UNDERLYINGS) {
    console.log(`\n${ticker} — ${name}`);

    let currentPrice: number;
    try {
      currentPrice = await fetchCurrentPrice(ticker);
      console.log(`  current price: $${currentPrice}`);
    } catch (err) {
      console.log(`  ERROR fetching price: ${err} — skipping`);
      continue;
    }
    await sleep(DELAY_MS);

    await seedContract(ticker, name, currentPrice, "call");
    await sleep(DELAY_MS);
    await seedContract(ticker, name, currentPrice, "put");
    await sleep(DELAY_MS);
  }

  console.log("\nDone. All contracts seeded.");
})();
