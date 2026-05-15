import { docClient } from "./dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.USERS_TABLE_NAME ?? "stock-app-users";

export interface User {
  username: string;
  passwordHash: string;
  createdAt: string;
}

export async function getUser(username: string): Promise<User | null> {
  const res = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { username } })
  );
  return (res.Item as User) ?? null;
}

export async function createUser(username: string, passwordHash: string): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { username, passwordHash, createdAt: new Date().toISOString() },
      ConditionExpression: "attribute_not_exists(username)",
    })
  );
}
