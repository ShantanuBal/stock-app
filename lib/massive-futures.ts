import { docClient } from "./dynamodb";
import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const CACHE_TABLE = process.env.FUTURES_CACHE_TABLE_NAME ?? "stock-app-FuturesCache";
const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // DynamoDB cleanup TTL
const FRESHNESS_SECONDS = 60 * 60; // re-fetch today's bar after 60 minutes
const MASSIVE_BASE = "https://api.massive.com/futures/v1";

const MONTH_CODES = ["F","G","H","J","K","M","N","Q","U","V","X","Z"] as const;

type RollSchedule = "quarterly" | "monthly" | "bimonthly-gold" | "silver";

export interface FuturesContractConfig {
  product: string;
  name: string;
  exchange: string;
  category: "equity" | "commodity" | "rates";
  rollSchedule: RollSchedule;
  twoDigitYear: boolean;
  unit: string;
  description: string;
}

export interface FuturesData {
  ticker: string;
  product: string;
  name: string;
  exchange: string;
  category: "equity" | "commodity" | "rates";
  price: number;
  open: number;
  high: number;
  low: number;
  prevSettlement: number;
  change: number;
  changePercent: number;
  volume: number;
  sessionDate: string;
  unit: string;
  description: string;
  points: { date: string; value: number }[];
}

export const FUTURES_CONTRACTS: FuturesContractConfig[] = [
  {
    product: "ES", name: "S&P 500 E-mini", exchange: "CME", category: "equity",
    rollSchedule: "quarterly", twoDigitYear: false, unit: "pts",
    description: "The most liquid equity index futures contract worldwide. Tracks the S&P 500 index. Each 1-point move = $50. Used by institutions for hedging and by traders for overnight and pre-market exposure.",
  },
  {
    product: "NQ", name: "Nasdaq 100 E-mini", exchange: "CME", category: "equity",
    rollSchedule: "quarterly", twoDigitYear: false, unit: "pts",
    description: "Tracks the Nasdaq 100 index with heavy tech weighting. Each 1-point move = $20. More volatile than ES due to concentration in mega-cap growth names like Apple, Microsoft, and Nvidia.",
  },
  {
    product: "YM", name: "Dow Jones Mini", exchange: "CBOT", category: "equity",
    rollSchedule: "quarterly", twoDigitYear: false, unit: "pts",
    description: "Tracks the Dow Jones Industrial Average — 30 large-cap US stocks. Each 1-point move = $5. Less volatile than ES or NQ due to its value and industrial tilt and price-weighted methodology.",
  },
  {
    product: "RTY", name: "Russell 2000 Mini", exchange: "CME", category: "equity",
    rollSchedule: "quarterly", twoDigitYear: false, unit: "pts",
    description: "Tracks the Russell 2000 small-cap index. Each 1-point move = $50. RTY often leads market turns — small caps are more sensitive to domestic economic conditions and credit availability than large caps.",
  },
  {
    product: "CL", name: "WTI Crude Oil", exchange: "NYMEX", category: "commodity",
    rollSchedule: "monthly", twoDigitYear: false, unit: "USD/bbl",
    description: "The US benchmark for crude oil. Each contract = 1,000 barrels. OPEC+ production decisions, US inventory data (weekly EIA report), and geopolitical risk drive weekly moves. Typically trades at a slight discount to Brent.",
  },
  {
    product: "GC", name: "Gold", exchange: "COMEX", category: "commodity",
    rollSchedule: "bimonthly-gold", twoDigitYear: false, unit: "USD/oz",
    description: "The world's primary safe-haven asset. Each contract = 100 troy oz. Gold rises on dollar weakness, rising inflation expectations, geopolitical risk, and falling real interest rates. It competes with Treasuries as a store of value.",
  },
  {
    product: "NG", name: "Natural Gas", exchange: "NYMEX", category: "commodity",
    rollSchedule: "monthly", twoDigitYear: true, unit: "USD/MMBtu",
    description: "Henry Hub natural gas futures. Each contract = 10,000 MMBtu. Highly seasonal and volatile — winter demand spikes for heating, summer for power generation. US LNG exports have increasingly linked US and European gas prices.",
  },
  {
    product: "SI", name: "Silver", exchange: "COMEX", category: "commodity",
    rollSchedule: "silver", twoDigitYear: false, unit: "USD/oz",
    description: "Silver is both a precious metal and an industrial commodity (solar panels, electronics). Each contract = 5,000 troy oz. More volatile than gold — it amplifies gold's moves and adds an industrial demand component tied to global growth.",
  },
];

function getFrontMonthTicker(config: FuturesContractConfig): string {
  const now = new Date();
  const ctStr = now.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    year: "numeric", month: "2-digit", day: "2-digit",
  });
  const [mo, da, yr] = ctStr.split("/");
  const month = parseInt(mo) - 1; // 0-indexed
  const day = parseInt(da);
  const year = parseInt(yr);

  let frontMonthIdx = 0;
  let frontYear = year;

  switch (config.rollSchedule) {
    case "quarterly": {
      // Mar(2), Jun(5), Sep(8), Dec(11) — roll around day 13 of expiry month
      const qMonths = [2, 5, 8, 11];
      let found = false;
      for (const qm of qMonths) {
        if (month < qm || (month === qm && day <= 13)) {
          frontMonthIdx = qm;
          frontYear = year;
          found = true;
          break;
        }
      }
      if (!found) { frontMonthIdx = 2; frontYear = year + 1; } // March next year
      break;
    }
    case "monthly": {
      // Roll ~day 20 of prior month: if day < 20 front = month+1, else front = month+2
      const offset = day < 20 ? 1 : 2;
      let fm = month + offset;
      frontYear = year;
      if (fm > 11) { fm -= 12; frontYear = year + 1; }
      frontMonthIdx = fm;
      break;
    }
    case "bimonthly-gold": {
      // Feb(1), Apr(3), Jun(5), Aug(7), Oct(9), Dec(11) — roll ~day 25 of prior month
      const goldMonths = [1, 3, 5, 7, 9, 11];
      const effMonth = day >= 25 ? month + 1 : month;
      const effYear = effMonth > 11 ? year + 1 : year;
      const normMonth = effMonth % 12;
      let found = false;
      for (const gm of goldMonths) {
        if (gm > normMonth) {
          frontMonthIdx = gm; frontYear = effYear; found = true; break;
        }
      }
      if (!found) { frontMonthIdx = goldMonths[0]; frontYear = effYear + 1; }
      break;
    }
    case "silver": {
      // Mar(2), May(4), Jul(6), Sep(8), Dec(11) — roll ~day 20 of prior month
      const silverMonths = [2, 4, 6, 8, 11];
      const effMonth = day >= 20 ? month + 1 : month;
      const effYear = effMonth > 11 ? year + 1 : year;
      const normMonth = effMonth % 12;
      let found = false;
      for (const sm of silverMonths) {
        if (sm > normMonth) {
          frontMonthIdx = sm; frontYear = effYear; found = true; break;
        }
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

interface SessionBar {
  session_end_date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  settlement_price: number;
  volume: number;
}

async function fetchSessions(ticker: string, limit = 2): Promise<SessionBar[]> {
  const daysBack = limit <= 2 ? 10 : Math.ceil(limit * 1.6) + 30; // buffer for weekends/holidays
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - daysBack);
  const fromStr = fromDate.toISOString().split("T")[0];

  const res = await fetch(
    `${MASSIVE_BASE}/aggs/${ticker}?resolution=1session&window_start.gte=${fromStr}&limit=${limit}&sort=window_start.desc`,
    { headers: { Authorization: `Bearer ${process.env.POLYGON_API_KEY}` } }
  );

  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []) as SessionBar[];
}

interface CachedBar {
  ticker: string;
  date: string;
  createdAt: string;
  ttl: number;
  open: number;
  high: number;
  low: number;
  close: number;
  settlement_price: number;
  volume: number;
}

async function getCachedBar(ticker: string, date: string): Promise<CachedBar | null> {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: CACHE_TABLE,
      Key: { ticker, date },
    }));
    return (result.Item as CachedBar) ?? null;
  } catch {
    return null;
  }
}

async function saveBar(ticker: string, date: string, bar: SessionBar): Promise<void> {
  const ttl = Math.floor(Date.now() / 1000) + CACHE_TTL_SECONDS;
  try {
    await docClient.send(new PutCommand({
      TableName: CACHE_TABLE,
      Item: {
        ticker,
        date,
        createdAt: new Date().toISOString(),
        ttl,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        settlement_price: bar.settlement_price,
        volume: bar.volume,
      },
    }));
  } catch {
    // Non-fatal
  }
}

function isFresh(cachedBar: CachedBar): boolean {
  const age = (Date.now() - new Date(cachedBar.createdAt).getTime()) / 1000;
  return age < FRESHNESS_SECONDS;
}

function todayET(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

async function getHistoricalPoints(ticker: string): Promise<{ date: string; value: number }[]> {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: CACHE_TABLE,
      KeyConditionExpression: "ticker = :t",
      ExpressionAttributeValues: { ":t": ticker },
      ProjectionExpression: "#d, #c",
      ExpressionAttributeNames: { "#d": "date", "#c": "close" },
    }));
    console.log(`[futures-history] ${ticker} — ${result.Items?.length ?? 0} items`);
    return (result.Items ?? [])
      .map((item) => ({ date: item.date as string, value: item.close as number }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error(`[futures-history] ${ticker} — query failed:`, err);
    return [];
  }
}

export async function getAllFuturesData(): Promise<FuturesData[]> {
  const today = todayET();
  const results: FuturesData[] = [];

  for (const config of FUTURES_CONTRACTS) {
    const ticker = getFrontMonthTicker(config);

    // Check cache for today's bar
    const cachedToday = await getCachedBar(ticker, today);
    let todayBar: SessionBar | null = null;
    let prevBar: SessionBar | null = null;

    if (cachedToday && isFresh(cachedToday)) {
      console.log(`Futures ${ticker} today — served from cache`);
      todayBar = {
        session_end_date: cachedToday.date,
        open: cachedToday.open,
        high: cachedToday.high,
        low: cachedToday.low,
        close: cachedToday.close,
        settlement_price: cachedToday.settlement_price,
        volume: cachedToday.volume,
      };
      // For prevSettlement, check yesterday's cached bar — use a prior date key
      // Fetch from API anyway since we need prev; it's a cheap 2-session call
    }

    if (!todayBar) {
      console.log(`Futures ${ticker} — fetching fresh sessions from Massive`);
      const sessions = await fetchSessions(ticker, 2);
      todayBar = sessions[0] ?? null;
      prevBar = sessions[1] ?? null;

      if (todayBar) {
        saveBar(ticker, today, todayBar).catch(console.error);
      }

      await new Promise((r) => setTimeout(r, 200));
    }

    if (!todayBar) continue;

    // Get prev settlement for change calculation
    if (!prevBar) {
      // Try to find yesterday's bar in cache
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
      const cachedYesterday = await getCachedBar(ticker, yStr);
      if (cachedYesterday) {
        prevBar = {
          session_end_date: cachedYesterday.date,
          open: cachedYesterday.open,
          high: cachedYesterday.high,
          low: cachedYesterday.low,
          close: cachedYesterday.close,
          settlement_price: cachedYesterday.settlement_price,
          volume: cachedYesterday.volume,
        };
      }
    }

    const price = todayBar.close;
    const prevSettlement = prevBar?.settlement_price ?? prevBar?.close ?? price;
    const change = price - prevSettlement;
    const changePercent = prevSettlement !== 0 ? (change / prevSettlement) * 100 : 0;
    const points = await getHistoricalPoints(ticker);

    results.push({
      ticker,
      product: config.product,
      name: config.name,
      exchange: config.exchange,
      category: config.category,
      price,
      open: todayBar.open,
      high: todayBar.high,
      low: todayBar.low,
      prevSettlement,
      change,
      changePercent,
      volume: todayBar.volume,
      sessionDate: todayBar.session_end_date,
      unit: config.unit,
      description: config.description,
      points,
    });
  }

  return results;
}
