import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-east-1" })
);
const TABLE = process.env.TICKER_DETAILS_TABLE_NAME!;

export interface TickerDetails {
  ticker: string;
  name: string;
  description: string;
  homepageUrl: string;
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
  };

  await dynamo.send(new PutCommand({ TableName: TABLE, Item: details }));
  console.log(`[ticker-details] ${ticker} — fetched from Polygon and cached in DynamoDB`);

  return details;
}

export async function refreshTickerDetails(ticker: string): Promise<TickerDetails | null> {
  const res = await fetch(
    `https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${process.env.POLYGON_API_KEY}`
  );
  if (!res.ok) return null;

  const { results } = await res.json();
  if (!results?.description) return null;

  const details: TickerDetails = {
    ticker,
    name: results.name ?? ticker,
    description: results.description,
    homepageUrl: results.homepage_url ?? "",
  };

  await dynamo.send(new PutCommand({ TableName: TABLE, Item: details }));
  return details;
}
