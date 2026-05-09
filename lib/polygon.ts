import { BatchGetCommand, BatchWriteCommand, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./dynamodb";

const API_KEY = process.env.POLYGON_API_KEY!;
const BASE_URL = "https://api.polygon.io";

// Sentinel SK written after a full grouped-daily batch is persisted.
// Its presence means the date's data is complete and trustworthy.
const COMPLETE_SENTINEL = "__complete__";

export type TimeRange = "1D" | "3D" | "1W" | "1M" | "3M" | "YTD";

export interface StockResult {
  ticker: string;
  name: string;
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

function getPreviousTradingDay(date: Date, daysBack: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - daysBack);
  // Skip weekends
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() - 1);
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

async function fetchGroupedDaily(date: string, tickers: Set<string>): Promise<GroupedDailyResult[]> {
  // Sentinel check — only trust DynamoDB if the full write completed successfully.
  const sentinel = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { date, ticker: COMPLETE_SENTINEL },
    }),
  );

  if (sentinel.Item) {
    console.log(`Stock data for ${date} already in database — skipping Polygon call`);
    return batchGetTickers(date, tickers);
  }

  // Not in DB (or write was incomplete) — fetch from Polygon, persist all tickers, then write sentinel.
  console.log(`No data found for ${date} — fetching from Polygon`);
  const url = `${BASE_URL}/v2/aggs/grouped/locale/us/market/stocks/${date}?adjusted=true&apiKey=${API_KEY}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Polygon grouped daily error ${res.status}: ${body}`);
  }
  const data = await res.json();
  const results: GroupedDailyResult[] = data.results ?? [];

  if (results.length > 0) {
    console.log(`Saving ${results.length} stocks for ${date} to database so we don't need to call Polygon again`);
    await batchWrite(
      results.map((r) => ({
        date,
        ticker: r.T,
        c: r.c,
        o: r.o,
        h: r.h,
        l: r.l,
        v: r.v,
        t: r.t,
      })),
    );
    // Sentinel written last — signals that all batch writes completed successfully.
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { date, ticker: COMPLETE_SENTINEL },
      }),
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
  // Always use the most recent completed trading day (free tier can't fetch today's data until after close)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const startDate = getStartDate(range, yesterday);

  const [currentData, startData] = await Promise.all([
    findMostRecentTradingData(yesterday, tickers),
    findMostRecentTradingData(startDate, tickers),
  ]);

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
  console.log(`No chart data found for ${ticker} — fetching from Polygon`);
  const url = `${BASE_URL}/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=500&apiKey=${API_KEY}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Polygon error: ${res.status}`);
  const data = await res.json();
  const bars: Array<{ t: number; c: number; o: number; h: number; l: number; v: number }> =
    data.results ?? [];

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

  return bars.map((b) => ({
    date: new Date(b.t).toISOString().split("T")[0],
    close: b.c,
  }));
}
