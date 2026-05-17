/**
 * Seeds stock-app-options-contracts with the initial set of tracked contracts.
 * For each underlying, queries Polygon to find the nearest monthly ATM contract
 * (identified as the expiry date with the most strikes listed — proxy for most liquid).
 *
 * Usage:
 *   npm run seed:options
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.OPTIONS_CONTRACTS_TABLE_NAME ?? "stock-app-options-contracts";
const API_KEY = process.env.POLYGON_API_KEY!;
const BASE_URL = "https://api.polygon.io";
const DELAY_MS = 15_000; // 5 calls/min free tier — 15s for safety margin

const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-west-2" });
const docClient = DynamoDBDocumentClient.from(client);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
}

const UNDERLYINGS = [
  { ticker: "AAPL",  name: "Apple Inc.",              approxPrice: 210  },
  { ticker: "AMZN",  name: "Amazon.com Inc.",          approxPrice: 200  },
  { ticker: "GOOGL", name: "Alphabet Inc.",             approxPrice: 170  },
  { ticker: "META",  name: "Meta Platforms Inc.",       approxPrice: 580  },
  { ticker: "MSFT",  name: "Microsoft Corp.",           approxPrice: 420  },
  { ticker: "NVDA",  name: "NVIDIA Corp.",              approxPrice: 130  },
  { ticker: "TSLA",  name: "Tesla Inc.",                approxPrice: 280  },
  { ticker: "QQQ",   name: "Invesco QQQ Trust",         approxPrice: 490  },
  { ticker: "SPY",   name: "SPDR S&P 500 ETF",          approxPrice: 560  },
  { ticker: "VIX",   name: "CBOE Volatility Index",     approxPrice: 20   },
];

interface PolygonContract {
  ticker: string;
  strike_price: number;
  expiration_date: string;
  contract_type: string;
}

async function fetchContracts(underlying: string, contractType: "call" | "put", retries = 3): Promise<PolygonContract[]> {
  const from = daysFromNow(14);
  const to   = daysFromNow(90);
  const url  = `${BASE_URL}/v3/reference/options/contracts?underlying_ticker=${underlying}&expired=false&contract_type=${contractType}&expiration_date.gte=${from}&expiration_date.lte=${to}&sort=expiration_date&order=asc&limit=1000&apiKey=${API_KEY}`;
  const res  = await fetch(url);
  if (res.status === 429 && retries > 0) {
    console.log(`  rate limited — waiting 60s before retry (${retries} retries left)`);
    await sleep(60_000);
    return fetchContracts(underlying, contractType, retries - 1);
  }
  if (!res.ok) throw new Error(`Polygon reference API error: ${res.status}`);
  const data = await res.json();
  return data.results ?? [];
}

function findMonthlyATM(contracts: PolygonContract[], approxPrice: number): PolygonContract | null {
  if (!contracts.length) return null;

  // Group by expiry date
  const byExpiry = new Map<string, PolygonContract[]>();
  for (const c of contracts) {
    const arr = byExpiry.get(c.expiration_date) ?? [];
    arr.push(c);
    byExpiry.set(c.expiration_date, arr);
  }

  // Pick the expiry with the most strikes — that's the monthly (most liquid)
  let monthlyExpiry = "";
  let maxStrikes = 0;
  for (const [date, group] of byExpiry.entries()) {
    if (group.length > maxStrikes) {
      maxStrikes = group.length;
      monthlyExpiry = date;
    }
  }

  const monthly = byExpiry.get(monthlyExpiry) ?? [];

  // Find the contract with strike closest to approxPrice
  return monthly.reduce((best, c) =>
    Math.abs(c.strike_price - approxPrice) < Math.abs(best.strike_price - approxPrice) ? c : best
  );
}

async function seedContract(underlying: string, name: string, approxPrice: number, contractType: "call" | "put") {
  console.log(`  [${contractType}] fetching Polygon contracts...`);
  const contracts = await fetchContracts(underlying, contractType);
  const best = findMonthlyATM(contracts, approxPrice);

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
      ticker: best.ticker,
      name,
      contractType,
      strike: best.strike_price,
      expiry: best.expiration_date,
      status: "active",
    },
  }));

  console.log(`  [${contractType}] written to DynamoDB ✓`);
}

(async () => {
  console.log(`Seeding ${TABLE_NAME} with ${UNDERLYINGS.length} underlyings (call + put each)\n`);

  for (const { ticker, name, approxPrice } of UNDERLYINGS) {
    console.log(`\n${ticker} — ${name}`);

    await seedContract(ticker, name, approxPrice, "call");
    await sleep(DELAY_MS);
    await seedContract(ticker, name, approxPrice, "put");
    await sleep(DELAY_MS);
  }

  console.log("\nDone. All contracts seeded.");
})();
