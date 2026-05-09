import { docClient } from "./dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.AI_SUMMARIES_TABLE_NAME ?? "AiSummaries";
const TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export async function getCachedSummary(pk: string): Promise<string | null> {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk },
    }));
    return (result.Item?.summary as string) ?? null;
  } catch {
    return null;
  }
}

export async function saveSummary(pk: string, summary: string): Promise<void> {
  const ttl = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: { pk, summary, ttl, createdAt: new Date().toISOString() },
  }));
}
