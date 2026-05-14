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
  sharesOutstanding?: number;
  weightedSharesOutstanding?: number;
  netIncome?: number;
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

export async function refreshTickerDetails(ticker: string, delayMs = 15_000): Promise<TickerDetails | null> {
  const detailsRes = await fetch(
    `https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${process.env.POLYGON_API_KEY}`
  );
  if (!detailsRes.ok) return null;

  const { results } = await detailsRes.json();
  if (!results?.description) return null;

  // Wait before second API call to respect rate limits
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  const financialsRes = await fetch(
    `https://api.polygon.io/vX/reference/financials?ticker=${ticker}&limit=1&apiKey=${process.env.POLYGON_API_KEY}`
  );
  let netIncome: number | undefined;
  if (financialsRes.ok) {
    const financialsData = await financialsRes.json();
    netIncome = financialsData.results?.[0]?.financials?.income_statement?.net_income_loss?.value ?? undefined;
  }

  const details: TickerDetails = {
    ticker,
    name: results.name ?? ticker,
    description: results.description,
    homepageUrl: results.homepage_url ?? "",
    sharesOutstanding: results.share_class_shares_outstanding ?? undefined,
    weightedSharesOutstanding: results.weighted_shares_outstanding ?? undefined,
    netIncome,
  };

  await dynamo.send(new PutCommand({ TableName: TABLE, Item: details }));
  return details;
}
