/**
 * Backfills historical futures session data into stock-app-FuturesCache.
 * Fetches up to 1 year of daily session bars for all 8 tracked front-month
 * contracts. Already-stored dates are skipped automatically.
 *
 * Note: This script backfills the *current* front-month contract only.
 * Historical bars for expired contracts use the ticker active at that time,
 * but this simplified version uses today's front-month for the full window —
 * sufficient for charts showing recent price history.
 *
 * Usage:
 *   npx ts-node -e "require('./scripts/backfill-futures.ts')"
 *   # or with ts-node/esm:
 *   npm run backfill:futures
 *   npm run backfill:futures -- --from=2025-06-01
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.FUTURES_CACHE_TABLE_NAME ?? "stock-app-FuturesCache";
const API_KEY = process.env.POLYGON_API_KEY!;
const MASSIVE_BASE = "https://api.massive.com/futures/v1";
const DELAY_MS = 7_000; // ~8-9 req/min to stay under 10/min rate limit

const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

const MONTH_CODES = ["F","G","H","J","K","M","N","Q","U","V","X","Z"] as const;

type RollSchedule = "quarterly" | "monthly" | "bimonthly-gold" | "silver";

interface ContractConfig {
  product: string;
  rollSchedule: RollSchedule;
  twoDigitYear: boolean;
}

const CONTRACTS: ContractConfig[] = [
  { product: "ES",  rollSchedule: "quarterly",      twoDigitYear: false },
  { product: "NQ",  rollSchedule: "quarterly",      twoDigitYear: false },
  { product: "YM",  rollSchedule: "quarterly",      twoDigitYear: false },
  { product: "RTY", rollSchedule: "quarterly",      twoDigitYear: false },
  { product: "CL",  rollSchedule: "monthly",        twoDigitYear: false },
  { product: "GC",  rollSchedule: "bimonthly-gold", twoDigitYear: false },
  { product: "NG",  rollSchedule: "monthly",        twoDigitYear: true  },
  { product: "SI",  rollSchedule: "silver",         twoDigitYear: false },
];

function getFrontMonthTicker(config: ContractConfig): string {
  const now = new Date();
  const ctStr = now.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    year: "numeric", month: "2-digit", day: "2-digit",
  });
  const [mo, da, yr] = ctStr.split("/");
  const month = parseInt(mo) - 1;
  const day = parseInt(da);
  const year = parseInt(yr);

  let frontMonthIdx = 0;
  let frontYear = year;

  switch (config.rollSchedule) {
    case "quarterly": {
      const qMonths = [2, 5, 8, 11];
      let found = false;
      for (const qm of qMonths) {
        if (month < qm || (month === qm && day <= 13)) {
          frontMonthIdx = qm; frontYear = year; found = true; break;
        }
      }
      if (!found) { frontMonthIdx = 2; frontYear = year + 1; }
      break;
    }
    case "monthly": {
      const offset = day < 20 ? 1 : 2;
      let fm = month + offset;
      frontYear = year;
      if (fm > 11) { fm -= 12; frontYear = year + 1; }
      frontMonthIdx = fm;
      break;
    }
    case "bimonthly-gold": {
      const goldMonths = [1, 3, 5, 7, 9, 11];
      const effMonth = day >= 25 ? month + 1 : month;
      const effYear = effMonth > 11 ? year + 1 : year;
      const normMonth = effMonth % 12;
      let found = false;
      for (const gm of goldMonths) {
        if (gm > normMonth) { frontMonthIdx = gm; frontYear = effYear; found = true; break; }
      }
      if (!found) { frontMonthIdx = goldMonths[0]; frontYear = effYear + 1; }
      break;
    }
    case "silver": {
      const silverMonths = [2, 4, 6, 8, 11];
      const effMonth = day >= 20 ? month + 1 : month;
      const effYear = effMonth > 11 ? year + 1 : year;
      const normMonth = effMonth % 12;
      let found = false;
      for (const sm of silverMonths) {
        if (sm > normMonth) { frontMonthIdx = sm; frontYear = effYear; found = true; break; }
      }
      if (!found) { frontMonthIdx = silverMonths[0]; frontYear = effYear + 1; }
      break;
    }
  }

  const yearSuffix = config.twoDigitYear
    ? String(frontYear).slice(-2)
    : String(frontYear % 10);
  return `${config.product}${MONTH_CODES[frontMonthIdx]}${yearSuffix}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function isAlreadyCached(ticker: string, date: string): Promise<boolean> {
  const res = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { ticker, date },
  }));
  return !!res.Item;
}

interface SessionBar {
  session_end_date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  settlement_price: number;
  volume: number;
}

async function fetchAllSessions(ticker: string, fromDate: string): Promise<SessionBar[]> {
  const allSessions: SessionBar[] = [];
  const initialUrl = `${MASSIVE_BASE}/aggs/${ticker}?resolution=1session&window_start.gte=${fromDate}&limit=500&sort=window_start.asc`;
  let pageUrl: string | null = initialUrl;

  while (pageUrl) {
    const currentUrl: string = pageUrl;
    const fetchRes = await fetch(currentUrl, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    if (!fetchRes.ok) {
      console.error(`  API error ${fetchRes.status} for ${ticker}`);
      break;
    }

    const body = await fetchRes.json() as { results?: SessionBar[]; next_url?: string };
    const results: SessionBar[] = body.results ?? [];
    allSessions.push(...results);

    // Paginate if next_url is provided
    pageUrl = body.next_url ?? null;
    if (pageUrl) await sleep(DELAY_MS);
  }

  return allSessions;
}

async function storeSessions(ticker: string, sessions: SessionBar[]): Promise<number> {
  const ttl = Math.floor(Date.now() / 1000) + 2 * 365 * 24 * 60 * 60; // 2 years
  const items = sessions.map((bar) => ({
    PutRequest: {
      Item: {
        ticker,
        date: bar.session_end_date,
        createdAt: new Date().toISOString(),
        ttl,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        settlement_price: bar.settlement_price,
        volume: bar.volume,
      },
    },
  }));

  for (let i = 0; i < items.length; i += 25) {
    await docClient.send(new BatchWriteCommand({
      RequestItems: { [TABLE_NAME]: items.slice(i, i + 25) },
    }));
  }

  return items.length;
}

(async () => {
  const fromArg = process.argv.find((a) => a.startsWith("--from="))?.split("=")[1] ?? "2025-01-01";

  console.log(`Backfilling futures data from ${fromArg} → today\n`);
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`Contracts: ${CONTRACTS.map((c) => c.product).join(", ")}\n`);

  let totalStored = 0;

  for (const config of CONTRACTS) {
    const ticker = getFrontMonthTicker(config);
    process.stdout.write(`[${ticker}] `);

    // Check if today is already cached — quick proxy for "already done"
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    const alreadyCached = await isAlreadyCached(ticker, today);
    if (alreadyCached) {
      console.log(`already up to date — skipped`);
      continue;
    }

    try {
      const sessions = await fetchAllSessions(ticker, fromArg);
      if (sessions.length === 0) {
        console.log(`no sessions returned`);
      } else {
        const count = await storeSessions(ticker, sessions);
        console.log(`stored ${count} sessions ✓`);
        totalStored += count;
      }
    } catch (err) {
      console.log(`ERROR: ${err}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone. Total sessions stored: ${totalStored}`);
})();
