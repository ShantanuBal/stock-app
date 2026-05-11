import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-east-1" })
);
const TABLE = process.env.TICKER_DETAILS_TABLE_NAME!;
const TTL_DAYS = 30;

export interface TickerDetails {
  ticker: string;
  name: string;
  description: string;
  homepageUrl: string;
}

export async function getTickerDetails(ticker: string): Promise<TickerDetails | null> {
  const cached = await dynamo.send(new GetCommand({ TableName: TABLE, Key: { ticker } }));
  if (cached.Item?.description) return cached.Item as TickerDetails;

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

  const ttl = Math.floor(Date.now() / 1000) + TTL_DAYS * 24 * 60 * 60;
  await dynamo.send(new PutCommand({ TableName: TABLE, Item: { ...details, ttl } }));

  return details;
}
