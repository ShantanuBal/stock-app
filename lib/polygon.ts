import { BatchGetCommand, BatchWriteCommand, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./dynamodb";
import { batchGetTickerNamesAndIndustries } from "./tickerDetails";

const API_KEY = process.env.POLYGON_API_KEY!;
const BASE_URL = "https://api.polygon.io";

// Sentinel SK written after a full grouped-daily batch is persisted.
// Its presence means the date's data is complete and trustworthy.
const COMPLETE_SENTINEL = "__complete__";

export type TimeRange = "1D" | "3D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "YTD";

export interface StockResult {
  ticker: string;
  name: string;
  industry?: string;
  price: number;
  changePercent: number;
  changeDollars: number;
  volume: number;
}

interface GroupedDailyResult {
  T: string;  // ticker
  c: number;  // close
  o: number;  // open
  h: number;  // high
  l: number;  // low
  v: number;  // volume
  t: number;  // timestamp
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Returns today's date in US Eastern Time as a noon-UTC Date, avoiding post-midnight UTC drift.
export function getTodayET(): Date {
  const etStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  return new Date(etStr + "T12:00:00Z");
}

// Returns the correct chart end date: today (ET) when market has closed (after 4 PM ET on a weekday),
// otherwise the previous weekday. This ensures today's closed bar is included while avoiding
// querying a date that hasn't traded yet.
export function getChartEndDate(): Date {
  const todayET = getTodayET();
  const nowET = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const isWeekday = todayET.getDay() !== 0 && todayET.getDay() !== 6;
  const isAfterMarketClose = nowET.getHours() >= 16;
  if (isWeekday && isAfterMarketClose) return todayET;
  return getPreviousTradingDay(todayET, 1);
}

export function getPreviousTradingDay(date: Date, daysBack: number): Date {
  const d = new Date(date);
  let count = 0;
  while (count < daysBack) {
    d.setDate(d.getDate() - 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) count++;
  }
  return d;
}

export function getStartDate(range: TimeRange, today: Date): Date {
  const d = new Date(today);
  switch (range) {
    case "1D":
      return getPreviousTradingDay(d, 1);
    case "3D":
      return getPreviousTradingDay(d, 3);
    case "1W":
      return getPreviousTradingDay(d, 7);
    case "1M":
      d.setMonth(d.getMonth() - 1);
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
      return d;
    case "3M":
      d.setMonth(d.getMonth() - 3);
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
      return d;
    case "6M":
      d.setMonth(d.getMonth() - 6);
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
      return d;
    case "1Y":
      d.setFullYear(d.getFullYear() - 1);
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
      return d;
    case "5Y":
      d.setFullYear(d.getFullYear() - 5);
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
      return d;
    case "YTD":
      return new Date(d.getFullYear(), 0, 2); // Jan 2 (Jan 1 market closed)
  }
}

async function batchWrite(items: Record<string, unknown>[]): Promise<void> {
  const chunks: Record<string, unknown>[][] = [];
  for (let i = 0; i < items.length; i += 25) {
    chunks.push(items.slice(i, i + 25));
  }
  // Process 5 chunks at a time to avoid overwhelming DynamoDB's initial partition capacity.
  // Firing all ~320 chunks simultaneously causes ThrottlingException on PAY_PER_REQUEST tables.
  const CONCURRENCY = 5;
  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    await Promise.all(
      chunks.slice(i, i + CONCURRENCY).map((chunk) =>
        docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [TABLE_NAME]: chunk.map((item) => ({ PutRequest: { Item: item } })),
            },
          }),
        ),
      ),
    );
  }
}

// Fetches only the requested tickers for a date using BatchGetItem (max 100 keys per call).
async function batchGetTickers(date: string, tickers: Set<string>): Promise<GroupedDailyResult[]> {
  const tickerList = Array.from(tickers);
  const chunks: string[][] = [];
  for (let i = 0; i < tickerList.length; i += 100) {
    chunks.push(tickerList.slice(i, i + 100));
  }

  const responses = await Promise.all(
    chunks.map((chunk) =>
      docClient.send(
        new BatchGetCommand({
          RequestItems: {
            [TABLE_NAME]: {
              Keys: chunk.map((ticker) => ({ date, ticker })),
            },
          },
        }),
      ),
    ),
  );

  return responses.flatMap((r) =>
    (r.Responses?.[TABLE_NAME] ?? []).map((item) => ({
      T: item.ticker as string,
      c: item.c as number,
      o: item.o as number,
      h: item.h as number,
      l: item.l as number,
      v: item.v as number,
      t: item.t as number,
    })),
  );
}

// Returns number of stocks stored, or null if the date was already in DynamoDB.
export async function fetchGroupedDailyForBackfill(date: string): Promise<number | null> {
  const sentinel = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { date, ticker: COMPLETE_SENTINEL } }),
  );
  if (sentinel.Item) return null;

  const url = `${BASE_URL}/v2/aggs/grouped/locale/us/market/stocks/${date}?adjusted=true&apiKey=${API_KEY}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Polygon grouped daily error ${res.status}: ${body}`);
  }
  const data = await res.json();
  const results: GroupedDailyResult[] = data.results ?? [];

  if (results.length > 0) {
    await batchWrite(
      results.map((r) => ({ date, ticker: r.T, c: r.c, o: r.o, h: r.h, l: r.l, v: r.v, t: r.t })),
    );
    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: { date, ticker: COMPLETE_SENTINEL } }));
  }

  return results.length;
}

async function fetchGroupedDaily(date: string, tickers: Set<string>): Promise<GroupedDailyResult[]> {
  const isToday = date === formatDate(new Date());

  // Historical dates: check DynamoDB permanent cache first.
  // Today's data: skip DynamoDB — use Next.js edge cache (revalidate: 900) to avoid write amplification.
  if (!isToday) {
    const sentinel = await docClient.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { date, ticker: COMPLETE_SENTINEL } }),
    );
    if (sentinel.Item) {
      console.log(`Stock data for ${date} already in database — skipping Polygon call`);
      return batchGetTickers(date, tickers);
    }
  }

  console.log(`Fetching ${isToday ? "today's" : ""} stock data for ${date} from Polygon`);
  const url = `${BASE_URL}/v2/aggs/grouped/locale/us/market/stocks/${date}?adjusted=true&apiKey=${API_KEY}`;
  const res = await fetch(url, isToday ? { next: { revalidate: 900 } } : { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 403) {
      console.log(`Polygon returned 403 for ${date} — no data available yet, trying previous day`);
      return [];
    }
    const body = await res.text();
    throw new Error(`Polygon grouped daily error ${res.status}: ${body}`);
  }
  const data = await res.json();
  const results: GroupedDailyResult[] = data.results ?? [];

  // Persist to DynamoDB only for completed (historical) dates, not today.
  if (!isToday && results.length > 0) {
    console.log(`Saving ${results.length} stocks for ${date} to database`);
    await batchWrite(
      results.map((r) => ({ date, ticker: r.T, c: r.c, o: r.o, h: r.h, l: r.l, v: r.v, t: r.t })),
    );
    await docClient.send(
      new PutCommand({ TableName: TABLE_NAME, Item: { date, ticker: COMPLETE_SENTINEL } }),
    );
    console.log(`All stock data for ${date} saved — future requests will be served from database`);
  }

  return results.filter((r) => tickers.has(r.T));
}

async function findMostRecentTradingData(
  date: Date,
  tickers: Set<string>,
): Promise<{ date: string; results: GroupedDailyResult[] }> {
  for (let i = 0; i < 7; i++) {
    const d = new Date(date);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const dateStr = formatDate(d);
    const results = await fetchGroupedDaily(dateStr, tickers);
    if (results.length > 0) return { date: dateStr, results };
  }
  throw new Error("Could not find recent trading data");
}

export async function getTopPerformers(
  range: TimeRange,
  tickers: Set<string>,
  tickerNames: Record<string, string>,
): Promise<StockResult[]> {
  // Resolve current data first — it may fall back to a prior date (weekend, pre-market, no data yet).
  // Start date must be computed from the resolved date so "1D" always means one trading day prior.
  const currentData = await findMostRecentTradingData(new Date(), tickers);
  const resolvedDate = new Date(currentData.date + "T12:00:00Z");
  const startDate = getStartDate(range, resolvedDate);
  const startData = await findMostRecentTradingData(startDate, tickers);

  const startPriceMap = new Map<string, number>();
  for (const item of startData.results) {
    startPriceMap.set(item.T, item.c);
  }

  const stocks: StockResult[] = [];
  for (const item of currentData.results) {
    const startPrice = startPriceMap.get(item.T);
    if (!startPrice || startPrice === 0) continue;

    const changePercent = ((item.c - startPrice) / startPrice) * 100;
    const changeDollars = item.c - startPrice;

    stocks.push({
      ticker: item.T,
      name: tickerNames[item.T] ?? item.T,
      price: item.c,
      changePercent,
      changeDollars,
      volume: item.v,
    });
  }

  return stocks.sort((a, b) => b.changePercent - a.changePercent);
}

// Queries all tickers for a given date from DynamoDB (no ticker filter), paginating as needed.
async function queryAllTickersForDate(dateStr: string): Promise<GroupedDailyResult[]> {
  const results: GroupedDailyResult[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const res = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "#d = :date",
        ExpressionAttributeNames: { "#d": "date" },
        ExpressionAttributeValues: { ":date": dateStr },
        ExclusiveStartKey: lastKey,
      }),
    );
    for (const item of res.Items ?? []) {
      if (item.ticker === COMPLETE_SENTINEL) continue;
      results.push({ T: item.ticker, c: item.c, o: item.o, h: item.h, l: item.l, v: item.v, t: item.t });
    }
    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  return results;
}

export async function getAllStocks(range: TimeRange): Promise<StockResult[]> {
  const yesterday = getPreviousTradingDay(new Date(), 1);
  const startDate = getStartDate(range, yesterday);

  // Use a small probe set to resolve dates and ensure DB is populated (fetchGroupedDaily
  // writes all ~9K tickers to DB on a cache miss regardless of the requested ticker set).
  const probe = new Set(["AAPL", "MSFT", "AMZN"]);
  const [currentMeta, startMeta] = await Promise.all([
    findMostRecentTradingData(yesterday, probe),
    findMostRecentTradingData(startDate, probe),
  ]);

  const [current, start] = await Promise.all([
    queryAllTickersForDate(currentMeta.date),
    queryAllTickersForDate(startMeta.date),
  ]);

  const startPriceMap = new Map<string, number>();
  for (const item of start) startPriceMap.set(item.T, item.c);

  const stocks: StockResult[] = [];
  for (const item of current) {
    const startPrice = startPriceMap.get(item.T);
    if (!startPrice || startPrice === 0) continue;
    stocks.push({
      ticker: item.T,
      name: "",
      price: item.c,
      changePercent: ((item.c - startPrice) / startPrice) * 100,
      changeDollars: item.c - startPrice,
      volume: item.v,
    });
  }

  const sorted = stocks.sort((a, b) => b.changePercent - a.changePercent);

  const detailsMap = await batchGetTickerNamesAndIndustries(sorted.map((s) => s.ticker));
  for (const s of sorted) {
    s.name = detailsMap.get(s.ticker)?.name ?? "";
    s.industry = detailsMap.get(s.ticker)?.industry;
  }

  return sorted.filter((s) => s.name !== "");
}

export interface ChartPoint {
  date: string;
  close: number;
}

// Counts weekdays between two date strings (inclusive). Used to estimate
// expected trading days so we can detect incomplete chart data in DynamoDB.
function countWeekdays(from: string, to: string): number {
  const d = new Date(from);
  const end = new Date(to);
  let count = 0;
  while (d <= end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export async function getIndexBars(
  ticker: string,
  from: string,
  to: string,
): Promise<ChartPoint[]> {
  // Query the GSI to find all stored bars for this ticker in the date range.
  const existing = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "ticker-date-index",
      KeyConditionExpression: "ticker = :ticker AND #d BETWEEN :from AND :to",
      ExpressionAttributeNames: { "#d": "date" },
      ExpressionAttributeValues: { ":ticker": ticker, ":from": from, ":to": to },
    }),
  );

  // Allow an 80% threshold to account for market holidays (~10/year).
  // If stored rows fall below it, the range has expanded (e.g. 1W → 1M) and
  // we need a fresh Polygon fetch to fill the gap.
  const expectedDays = countWeekdays(from, to);
  const hasCompleteData = (existing.Items?.length ?? 0) >= expectedDays * 0.8;

  if (hasCompleteData) {
    console.log(`Chart data for ${ticker} already in database (${existing.Items!.length}/${expectedDays} trading days) — skipping Polygon call`);
    return existing.Items!.map((item) => ({
      date: item.date as string,
      close: item.c as number,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  if (existing.Items && existing.Items.length > 0) {
    console.log(`Incomplete chart data for ${ticker} in database (${existing.Items.length}/${expectedDays} trading days) — fetching full range from Polygon`);
  }

  // Not in DB (or incomplete) — fetch from Polygon then persist.
  console.log(`No chart data found for ${ticker} — fetching from Polygon (${from} → ${to})`);
  const url = `${BASE_URL}/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=500&apiKey=${API_KEY}`;
  let res = await fetch(url, { cache: "no-store" });
  if (res.status === 429) {
    console.log(`Polygon rate limit for ${ticker} — retrying in 2s`);
    await new Promise((r) => setTimeout(r, 2000));
    res = await fetch(url, { cache: "no-store" });
  }
  if (!res.ok) throw new Error(`Polygon error: ${res.status}`);
  const data = await res.json();
  const bars: Array<{ t: number; c: number; o: number; h: number; l: number; v: number }> =
    data.results ?? [];
  console.log(`Polygon returned ${bars.length} bars for ${ticker} (status: ${data.status}, resultsCount: ${data.resultsCount ?? "n/a"})`);

  // If 0 bars, the from date may be a market holiday — retry with a 7-day wider start.
  if (bars.length === 0) {
    const extStart = new Date(from + "T12:00:00Z");
    extStart.setDate(extStart.getDate() - 7);
    const extFrom = extStart.toISOString().split("T")[0];
    console.log(`No bars for ${ticker} — retrying with extended range (${extFrom} → ${to})`);
    const retryRes = await fetch(
      `${BASE_URL}/v2/aggs/ticker/${ticker}/range/1/day/${extFrom}/${to}?adjusted=true&sort=asc&limit=500&apiKey=${API_KEY}`,
      { cache: "no-store" }
    );
    if (retryRes.ok) {
      const retryData = await retryRes.json();
      bars.push(...(retryData.results ?? []));
      console.log(`Retry returned ${bars.length} bars for ${ticker}`);
    }
  }

  if (bars.length > 0) {
    await Promise.all(
      bars.map((b) =>
        docClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: {
              date: new Date(b.t).toISOString().split("T")[0],
              ticker,
              c: b.c,
              o: b.o,
              h: b.h,
              l: b.l,
              v: b.v,
              t: b.t,
            },
          }),
        ),
      ),
    );
    console.log(`Saved ${bars.length} days of chart data for ${ticker} — future requests will be served from database`);
  }

  // Store all fetched bars (including any from the wider retry range) but only
  // return bars within the originally requested window so callers get the right slice.
  const allMapped = bars
    .map((b) => ({ date: new Date(b.t).toISOString().split("T")[0], close: b.c }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const inRange = allMapped.filter((p) => p.date >= from && p.date <= to);
  if (inRange.length > 0) return inRange;

  // No bars fell within the requested window (e.g. today's data not yet on free tier) —
  // return the single most recent bar we do have so the chart isn't blank.
  const fallback = [...allMapped].reverse().find((p) => p.date <= to);
  return fallback ? [fallback] : [];
}
