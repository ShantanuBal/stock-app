import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchGetCommand } from "@aws-sdk/lib-dynamodb";

const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-east-1" })
);
const TABLE = process.env.TICKER_DETAILS_TABLE_NAME!;

export async function POST(req: NextRequest) {
  const { tickers } = await req.json() as { tickers: string[] };
  if (!Array.isArray(tickers) || tickers.length === 0 || tickers.length > 6000) {
    return NextResponse.json({ error: "Invalid tickers" }, { status: 400 });
  }

  try {
    // BatchGetItem supports up to 100 keys per request
    const chunks: string[][] = [];
    for (let i = 0; i < tickers.length; i += 100) {
      chunks.push(tickers.slice(i, i + 100));
    }

    const results: Record<string, { weighted: number | null; shares: number | null; netIncome: number | null }> = {};
    for (const chunk of chunks) {
      const res = await dynamo.send(new BatchGetCommand({
        RequestItems: {
          [TABLE]: {
            Keys: chunk.map((ticker) => ({ ticker })),
            ProjectionExpression: "ticker, sharesOutstanding, weightedSharesOutstanding, netIncome",
          },
        },
      }));
      for (const item of res.Responses?.[TABLE] ?? []) {
        results[item.ticker] = {
          weighted: item.weightedSharesOutstanding ?? null,
          shares: item.sharesOutstanding ?? null,
          netIncome: item.netIncome ?? null,
        };
      }
    }

    // Fill in nulls for any tickers not found
    for (const ticker of tickers) {
      if (!(ticker in results)) results[ticker] = { weighted: null, shares: null, netIncome: null };
    }

    return NextResponse.json({ marketCapShares: results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch market caps" }, { status: 500 });
  }
}
