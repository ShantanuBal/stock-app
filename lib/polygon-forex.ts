import { docClient } from "./dynamodb";
import { QueryCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";

const API_KEY = process.env.POLYGON_API_KEY!;
const BASE_URL = "https://api.polygon.io";
const TABLE_NAME = process.env.FOREX_CACHE_TABLE_NAME ?? "stock-app-forex-cache";
const SPARKLINE_DAYS = 400;

export const FOREX_TICKERS = [
  "C:EURUSD", "C:USDJPY", "C:GBPUSD", "C:USDCHF", "C:AUDUSD", "C:USDCAD",
  "C:USDCNY", "C:USDINR", "C:USDBRL", "C:USDMXN", "C:USDKRW", "C:USDZAR",
  "X:BTCUSD", "X:ETHUSD", "X:SOLUSD", "X:BNBUSD",
  // Precious metals (XAU/XAG/XPT/XPD trade as forex pairs on Polygon)
  "C:XAUUSD", "C:XAGUSD", "C:XPTUSD", "C:XPDUSD",
];

export interface ForexRate {
  rate: number;
  change: number;
  changePct: number;
  points: { date: string; value: number }[];
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
}

async function getCachedDates(from: string, to: string): Promise<Set<string>> {
  // All pairs are written together per day, so one probe ticker covers all gaps.
  const res = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "ticker = :t AND #d BETWEEN :from AND :to",
    ExpressionAttributeNames: { "#d": "date" },
    ExpressionAttributeValues: { ":t": "C:EURUSD", ":from": from, ":to": to },
    ProjectionExpression: "#d",
  }));
  return new Set((res.Items ?? []).map((item) => item.date as string));
}

async function fetchGrouped(market: "fx" | "crypto", date: string): Promise<{ T: string; o: number; h: number; l: number; c: number; v: number }[]> {
  const res = await fetch(
    `${BASE_URL}/v2/aggs/grouped/locale/global/market/${market}/${date}?adjusted=true&apiKey=${API_KEY}`
  );
  if (!res.ok) {
    console.log(`[forex] grouped ${market} fetch failed: ${res.status}`);
    return [];
  }
  const data = await res.json();
  return data.results ?? [];
}

async function fetchAndStoreDate(date: string): Promise<void> {
  const [fxResults, cryptoResults] = await Promise.all([
    fetchGrouped("fx", date),
    fetchGrouped("crypto", date),
  ]);

  const tracked = new Set(FOREX_TICKERS);
  const items = [...fxResults, ...cryptoResults]
    .filter((r) => tracked.has(r.T))
    .map((r) => ({
      PutRequest: {
        Item: { ticker: r.T, date, open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v },
      },
    }));

  if (!items.length) {
    console.log(`[forex] no data for ${date} (weekend/holiday or not yet available)`);
    return;
  }

  for (let i = 0; i < items.length; i += 25) {
    await docClient.send(new BatchWriteCommand({
      RequestItems: { [TABLE_NAME]: items.slice(i, i + 25) },
    }));
  }
  console.log(`[forex] stored ${items.length} pairs for ${date}`);
}

// Fills gaps in the full sparkline window — runs fire-and-forget, never blocks the response.
async function fillHistoricalGaps(): Promise<void> {
  const cachedDates = await getCachedDates(daysAgo(SPARKLINE_DAYS), daysAgo(2));
  const toFetch: string[] = [];
  for (let i = SPARKLINE_DAYS; i >= 2; i--) {
    const date = daysAgo(i);
    if (!cachedDates.has(date)) toFetch.push(date);
  }
  if (!toFetch.length) return;
  console.log(`[forex] backfilling ${toFetch.length} historical gaps (background)`);
  const CONCURRENCY = 5;
  for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
    await Promise.all(toFetch.slice(i, i + CONCURRENCY).map(fetchAndStoreDate));
  }
}

// Blocks only on yesterday's data (needed for current rates), then fills history in the background.
async function ensureForexDataCurrent(): Promise<void> {
  const yesterday = daysAgo(1);
  const recent = await getCachedDates(yesterday, yesterday);
  if (!recent.has(yesterday)) {
    await fetchAndStoreDate(yesterday);
  }
  void fillHistoricalGaps();
}

async function queryHistory(ticker: string): Promise<{ date: string; close: number }[]> {
  const res = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "ticker = :t AND #d BETWEEN :from AND :to",
    ExpressionAttributeNames: { "#d": "date" },
    ExpressionAttributeValues: {
      ":t": ticker,
      ":from": daysAgo(SPARKLINE_DAYS + 10), // buffer for weekends/holidays
      ":to": daysAgo(0),
    },
    ScanIndexForward: true,
  }));

  return (res.Items ?? []).map((item) => ({ date: item.date as string, close: item.close as number }));
}

export async function getForexRate(ticker: string): Promise<ForexRate | null> {
  const history = await queryHistory(ticker);
  if (history.length < 2) {
    console.log(`[forex] insufficient history for ${ticker}: ${history.length} rows`);
    return null;
  }

  const latest = history[history.length - 1];
  const previous = history[history.length - 2];
  const rate = latest.close;
  const change = rate - previous.close;
  const changePct = (change / previous.close) * 100;
  const points = history.slice(-SPARKLINE_DAYS).map((h) => ({ date: h.date, value: h.close }));

  return { rate, change, changePct, points };
}

export async function getAllForexRates(tickers: string[]): Promise<(ForexRate | null)[]> {
  await ensureForexDataCurrent();
  return Promise.all(tickers.map((t) => getForexRate(t)));
}
