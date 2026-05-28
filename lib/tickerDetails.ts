import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchGetCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-east-1" })
);
const TABLE = process.env.TICKER_DETAILS_TABLE_NAME!;

export interface TickerDetails {
  ticker: string;
  name: string;
  industry?: string;
  description: string;
  homepageUrl: string;
  sharesOutstanding?: number;
  weightedSharesOutstanding?: number;
  netIncome?: number;
  epsGrowth?: number;
}

export async function getTickerDetails(ticker: string): Promise<TickerDetails | null> {
  const cached = await dynamo.send(new GetCommand({ TableName: TABLE, Key: { ticker } }));
  if (cached.Item?.description) {
    console.log(`[ticker-details] ${ticker} — served from DynamoDB cache`);
    return cached.Item as TickerDetails;
  }

  console.log(`[ticker-details] ${ticker} — not in cache, fetching from Polygon`);
  const res = await fetch(
    `https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${process.env.POLYGON_API_KEY}`
  );
  if (!res.ok) {
    console.log(`[ticker-details] ${ticker} — Polygon returned ${res.status}`);
    return null;
  }

  const { results } = await res.json();
  if (!results?.description) {
    console.log(`[ticker-details] ${ticker} — no description in Polygon response`);
    return null;
  }

  const details: TickerDetails = {
    ticker,
    name: results.name ?? ticker,
    description: results.description,
    homepageUrl: results.homepage_url ?? "",
    sharesOutstanding: results.share_class_shares_outstanding ?? undefined,
    weightedSharesOutstanding: results.weighted_shares_outstanding ?? undefined,
  };

  await dynamo.send(new PutCommand({ TableName: TABLE, Item: details }));
  console.log(`[ticker-details] ${ticker} — fetched from Polygon and cached in DynamoDB`);

  return details;
}

export async function batchGetTickerNames(tickers: string[]): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>();
  const chunks: string[][] = [];
  for (let i = 0; i < tickers.length; i += 100) chunks.push(tickers.slice(i, i + 100));

  const CONCURRENCY = 5;
  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    await Promise.all(
      chunks.slice(i, i + CONCURRENCY).map(async (chunk) => {
        const res = await dynamo.send(new BatchGetCommand({
          RequestItems: { [TABLE]: { Keys: chunk.map((t) => ({ ticker: t })), ProjectionExpression: "ticker, #n", ExpressionAttributeNames: { "#n": "name" } } },
        }));
        for (const item of res.Responses?.[TABLE] ?? []) {
          if (item.ticker && item.name) nameMap.set(item.ticker as string, item.name as string);
        }
      })
    );
  }
  return nameMap;
}

export async function batchGetTickerNamesAndIndustries(tickers: string[]): Promise<Map<string, { name: string; industry?: string }>> {
  const map = new Map<string, { name: string; industry?: string }>();
  const chunks: string[][] = [];
  for (let i = 0; i < tickers.length; i += 100) chunks.push(tickers.slice(i, i + 100));

  const CONCURRENCY = 5;
  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    await Promise.all(
      chunks.slice(i, i + CONCURRENCY).map(async (chunk) => {
        const res = await dynamo.send(new BatchGetCommand({
          RequestItems: { [TABLE]: { Keys: chunk.map((t) => ({ ticker: t })), ProjectionExpression: "ticker, #n, industry", ExpressionAttributeNames: { "#n": "name" } } },
        }));
        for (const item of res.Responses?.[TABLE] ?? []) {
          if (item.ticker && item.name) {
            map.set(item.ticker as string, { name: item.name as string, industry: item.industry as string | undefined });
          }
        }
      })
    );
  }
  return map;
}

export async function refreshTickerDetails(ticker: string): Promise<TickerDetails | null> {
  const detailsRes = await fetch(
    `https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${process.env.POLYGON_API_KEY}`
  );
  if (!detailsRes.ok) {
    console.log(`[ticker-details] ${ticker} — Polygon /tickers returned ${detailsRes.status}`);
    return null;
  }

  const { results } = await detailsRes.json();
  if (!results?.description) return null;

  const financialsRes = await fetch(
    `https://api.polygon.io/v1/reference/financials?ticker=${ticker}&limit=2&timeframe=annual&apiKey=${process.env.POLYGON_API_KEY}`
  );
  let netIncome: number | undefined;
  let epsGrowth: number | undefined;
  if (financialsRes.ok) {
    const financialsData = await financialsRes.json();
    const periods = financialsData.results ?? [];
    netIncome = periods[0]?.financials?.income_statement?.net_income_loss?.value ?? undefined;
    const prevNetIncome: number | undefined = periods[1]?.financials?.income_statement?.net_income_loss?.value ?? undefined;
    if (netIncome != null && prevNetIncome != null && prevNetIncome !== 0) {
      epsGrowth = ((netIncome - prevNetIncome) / Math.abs(prevNetIncome)) * 100;
    }
  }

  const details: TickerDetails = {
    ticker,
    name: results.name ?? ticker,
    industry: results.sic_description ?? undefined,
    description: results.description,
    homepageUrl: results.homepage_url ?? "",
    sharesOutstanding: results.share_class_shares_outstanding ?? undefined,
    weightedSharesOutstanding: results.weighted_shares_outstanding ?? undefined,
    netIncome,
    epsGrowth,
  };

  await dynamo.send(new PutCommand({ TableName: TABLE, Item: details }));
  return details;
}
