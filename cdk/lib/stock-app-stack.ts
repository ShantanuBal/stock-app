import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class StockAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "StockDailyPrices", {
      tableName: "StockDailyPrices",
      partitionKey: { name: "date", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "ticker", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      // Retain data if the stack is deleted
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Allows querying a single ticker across a date range (used for index charts)
    table.addGlobalSecondaryIndex({
      indexName: "ticker-date-index",
      partitionKey: { name: "ticker", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "date", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const summariesTable = new dynamodb.Table(this, "AiSummaries", {
      tableName: "AiSummaries",
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const economyCacheTable = new dynamodb.Table(this, "EconomyCache", {
      tableName: "EconomyCache",
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const tickerDetailsTable = new dynamodb.Table(this, "TickerDetails", {
      tableName: "TickerDetails",
      partitionKey: { name: "ticker", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // IAM user whose credentials will be stored as Vercel environment variables
    const appUser = new iam.User(this, "StockAppUser", {
      userName: "stock-app-vercel",
    });

    // Single managed policy covering all tables — avoids the 2048-byte inline policy limit
    const appPolicy = new iam.ManagedPolicy(this, "StockAppPolicy", {
      users: [appUser],
      statements: [
        new iam.PolicyStatement({
          actions: [
            "dynamodb:BatchGetItem",
            "dynamodb:Query",
            "dynamodb:GetItem",
            "dynamodb:Scan",
            "dynamodb:ConditionCheckItem",
            "dynamodb:BatchWriteItem",
            "dynamodb:PutItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem",
            "dynamodb:DescribeTable",
            "dynamodb:GetRecords",
            "dynamodb:GetShardIterator",
          ],
          resources: [
            table.tableArn,
            `${table.tableArn}/index/*`,
            summariesTable.tableArn,
            economyCacheTable.tableArn,
            tickerDetailsTable.tableArn,
          ],
        }),
      ],
    });

    const accessKey = new iam.CfnAccessKey(this, "StockAppAccessKey", {
      userName: appUser.userName,
    });

    new cdk.CfnOutput(this, "TableName", { value: table.tableName });
    new cdk.CfnOutput(this, "Region", { value: this.region });
    new cdk.CfnOutput(this, "AccessKeyId", { value: accessKey.ref });
    new cdk.CfnOutput(this, "SecretAccessKey", {
      value: accessKey.attrSecretAccessKey,
    });
  }
}
