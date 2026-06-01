import { docClient } from "./dynamodb";
import {
  GetCommand, PutCommand, DeleteCommand, UpdateCommand, QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const TABLE = process.env.WATCHLISTS_TABLE_NAME ?? "stock-app-watchlists";

export interface WatchList {
  username: string;
  listId: string;
  name: string;
  tickers: string[];
  createdAt: string;
}

function generateListId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export async function getUserLists(username: string): Promise<WatchList[]> {
  const res = await docClient.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: "username = :u",
    ExpressionAttributeValues: { ":u": username },
  }));
  return (res.Items ?? [])
    .map((item) => item as WatchList)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getList(username: string, listId: string): Promise<WatchList | null> {
  const res = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { username, listId },
  }));
  return (res.Item as WatchList) ?? null;
}

export async function createList(username: string, name: string): Promise<WatchList> {
  const listId = generateListId();
  const list: WatchList = {
    username,
    listId,
    name: name.trim().slice(0, 50),
    tickers: [],
    createdAt: new Date().toISOString(),
  };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: list }));
  return list;
}

export async function deleteList(username: string, listId: string): Promise<void> {
  await docClient.send(new DeleteCommand({
    TableName: TABLE,
    Key: { username, listId },
  }));
}

export async function renameList(username: string, listId: string, name: string): Promise<void> {
  await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { username, listId },
    UpdateExpression: "SET #n = :name",
    ExpressionAttributeNames: { "#n": "name" },
    ExpressionAttributeValues: { ":name": name.trim().slice(0, 50) },
  }));
}

export async function addTicker(username: string, listId: string, ticker: string): Promise<void> {
  const list = await getList(username, listId);
  if (!list) return;
  const upper = ticker.toUpperCase();
  if (list.tickers.includes(upper)) return;
  const updated = [...list.tickers, upper].slice(0, 50);
  await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { username, listId },
    UpdateExpression: "SET tickers = :t",
    ExpressionAttributeValues: { ":t": updated },
  }));
}

export async function removeTicker(username: string, listId: string, ticker: string): Promise<void> {
  const list = await getList(username, listId);
  if (!list) return;
  const updated = list.tickers.filter((t) => t !== ticker.toUpperCase());
  await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { username, listId },
    UpdateExpression: "SET tickers = :t",
    ExpressionAttributeValues: { ":t": updated },
  }));
}
