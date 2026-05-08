import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// The SDK automatically reads AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and
// AWS_REGION from environment variables — no explicit credential wiring needed.
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
export const docClient = DynamoDBDocumentClient.from(client);
export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;
