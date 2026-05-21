import { docClient } from "./dynamodb";
import { GetCommand, QueryCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";

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

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
}

async function isTodayCached(): Promise<boolean> {
  const res = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { ticker: "C:EURUSD", date: today() },
  }));
  return !!res.Item;
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

async function fetchAndStoreTodayFromPolygon(): Promise<void> {
  const date = today();
  console.log(`[forex] cache miss for ${date} — fetching grouped daily from Polygon`);

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
    console.log(`[forex] no results for ${date} (market closed?)`);
    return;
  }

  for (let i = 0; i < items.length; i += 25) {
    await docClient.send(new BatchWriteCommand({
      RequestItems: { [TABLE_NAME]: items.slice(i, i + 25) },
    }));
  }

  console.log(`[forex] stored ${items.length} pairs for ${date}`);
}

async function queryHistory(ticker: string): Promise<{ date: string; close: number }[]> {
  const res = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "ticker = :t AND #d BETWEEN :from AND :to",
    ExpressionAttributeNames: { "#d": "date" },
    ExpressionAttributeValues: {
      ":t": ticker,
      ":from": daysAgo(SPARKLINE_DAYS + 10), // buffer for weekends/holidays
      ":to": today(),
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
  // Ensure today's data is in DynamoDB before querying
  const cached = await isTodayCached();
  if (!cached) await fetchAndStoreTodayFromPolygon();

  return Promise.all(tickers.map((t) => getForexRate(t)));
}
