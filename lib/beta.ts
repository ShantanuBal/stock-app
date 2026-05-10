import { docClient, TABLE_NAME } from "./dynamodb";
import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { formatDate, getPreviousTradingDay } from "./polygon";

const BETA_CACHE_PK = "beta_v1";
const TTL_DAYS = 7;
const MIN_POINTS = 30;
const API_KEY = process.env.POLYGON_API_KEY!;

interface PricePoint { date: string; close: number }

async function getPricesFromDynamoDB(ticker: string, from: string, to: string): Promise<PricePoint[]> {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: "ticker-date-index",
    KeyConditionExpression: "ticker = :t AND #d BETWEEN :from AND :to",
    ExpressionAttributeNames: { "#d": "date" },
    ExpressionAttributeValues: { ":t": ticker, ":from": from, ":to": to },
    ProjectionExpression: "#d, c",
  }));
  return (result.Items ?? [])
    .map((item) => ({ date: item.date as string, close: item.c as number }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function getMarketPrices(from: string, to: string): Promise<PricePoint[]> {
  const db = await getPricesFromDynamoDB("SPY", from, to);
  if (db.length >= MIN_POINTS) return db;

  // Fall back to Polygon for SPY if not in DynamoDB
  const url = `https://api.polygon.io/v2/aggs/ticker/SPY/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=500&apiKey=${API_KEY}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return db;
  const data = await res.json();
  return (data.results ?? []).map((b: { t: number; c: number }) => ({
    date: new Date(b.t).toISOString().split("T")[0],
    close: b.c,
  }));
}

function computeBeta(stock: PricePoint[], market: PricePoint[]): number | null {
  const mMap = new Map(market.map((p) => [p.date, p.close]));

  const sRet: number[] = [];
  const mRet: number[] = [];

  for (let i = 1; i < stock.length; i++) {
    const mCurr = mMap.get(stock[i].date);
    const mPrev = mMap.get(stock[i - 1].date);
    if (!mCurr || !mPrev || mPrev === 0 || stock[i - 1].close === 0) continue;
    sRet.push((stock[i].close - stock[i - 1].close) / stock[i - 1].close);
    mRet.push((mCurr - mPrev) / mPrev);
  }

  if (sRet.length < MIN_POINTS) return null;

  const meanS = sRet.reduce((a, b) => a + b, 0) / sRet.length;
  const meanM = mRet.reduce((a, b) => a + b, 0) / mRet.length;

  let cov = 0, varM = 0;
  for (let i = 0; i < sRet.length; i++) {
    cov += (sRet[i] - meanS) * (mRet[i] - meanM);
    varM += (mRet[i] - meanM) ** 2;
  }

  return varM === 0 ? null : cov / varM;
}

export async function getBetas(tickers: string[]): Promise<Record<string, number | null>> {
  const now = Math.floor(Date.now() / 1000);
  const yesterday = getPreviousTradingDay(new Date(), 1);
  const oneYearAgo = new Date(yesterday);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const toDate = formatDate(yesterday);
  const fromDate = formatDate(oneYearAgo);

  // Check cache for all tickers in parallel
  const result: Record<string, number | null> = {};
  const uncached: string[] = [];

  await Promise.all(tickers.map(async (ticker) => {
    const cached = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { date: BETA_CACHE_PK, ticker },
    }));
    if (cached.Item && (!cached.Item.ttl || (cached.Item.ttl as number) > now)) {
      result[ticker] = cached.Item.beta as number | null;
    } else {
      uncached.push(ticker);
    }
  }));

  if (uncached.length === 0) {
    console.log(`Beta: all ${tickers.length} tickers served from cache`);
    return result;
  }

  console.log(`Beta: computing for ${uncached.length} uncached tickers`);

  const marketPrices = await getMarketPrices(fromDate, toDate);
  if (marketPrices.length < MIN_POINTS) {
    console.log("Beta: insufficient market data, returning nulls");
    uncached.forEach((t) => { result[t] = null; });
    return result;
  }

  let computed = 0, insufficient = 0, errors = 0;

  // Query DynamoDB for all uncached tickers in parallel
  await Promise.all(uncached.map(async (ticker) => {
    try {
      const stockPrices = await getPricesFromDynamoDB(ticker, fromDate, toDate);
      if (stockPrices.length < MIN_POINTS) {
        console.log(`Beta: ${ticker} — only ${stockPrices.length} data points in DynamoDB (need ${MIN_POINTS}), skipping`);
        insufficient++;
        result[ticker] = null;
        return;
      }
      const beta = computeBeta(stockPrices, marketPrices);
      if (beta === null) {
        console.log(`Beta: ${ticker} — insufficient overlapping returns with SPY`);
        insufficient++;
      } else {
        computed++;
      }
      result[ticker] = beta;
      if (beta !== null) {
        const ttl = now + TTL_DAYS * 24 * 60 * 60;
        await docClient.send(new PutCommand({
          TableName: TABLE_NAME,
          Item: { date: BETA_CACHE_PK, ticker, beta, ttl },
        }));
      }
    } catch (err) {
      console.log(`Beta: ${ticker} — error: ${err}`);
      errors++;
      result[ticker] = null;
    }
  }));

  console.log(`Beta: done — ${computed} computed, ${insufficient} insufficient data, ${errors} errors`);

  return result;
}
