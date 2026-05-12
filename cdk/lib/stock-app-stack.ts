import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import * as events from "aws-cdk-lib/aws-events";
import * as events_targets from "aws-cdk-lib/aws-events-targets";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatch_actions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sns_subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export class StockAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── DynamoDB tables ────────────────────────────────────────────────────────

    const table = new dynamodb.Table(this, "StockDailyPrices", {
      tableName: "StockDailyPrices",
      partitionKey: { name: "date", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "ticker", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
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
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── IAM user for Vercel ────────────────────────────────────────────────────

    const appUser = new iam.User(this, "StockAppUser", {
      userName: "stock-app-vercel",
    });

    // Single managed policy covering all tables — avoids the 2048-byte inline policy limit
    new iam.ManagedPolicy(this, "StockAppPolicy", {
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

    // ── Ticker refresh Fargate job ─────────────────────────────────────────────

    // Polygon API key stored in Secrets Manager — value never touches the repo
    const polygonSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "PolygonApiKey",
      "polygon-api-key"
    );

    const vpc = ec2.Vpc.fromLookup(this, "DefaultVpc", { isDefault: true });

    const cluster = new ecs.Cluster(this, "RefreshCluster", {
      clusterName: "ticker-refresh",
      vpc,
    });

    const refreshLogGroup = new logs.LogGroup(this, "RefreshLogGroup", {
      logGroupName: "/ecs/ticker-refresh",
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const refreshImage = new ecr_assets.DockerImageAsset(this, "RefreshImage", {
      directory: path.join(__dirname, "../../"),
      file: "Dockerfile.refresh",
    });

    const taskDef = new ecs.FargateTaskDefinition(this, "RefreshTaskDef", {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    taskDef.addContainer("RefreshContainer", {
      image: ecs.ContainerImage.fromDockerImageAsset(refreshImage),
      environment: {
        AWS_REGION: this.region,
        TICKER_DETAILS_TABLE_NAME: tickerDetailsTable.tableName,
      },
      secrets: {
        POLYGON_API_KEY: ecs.Secret.fromSecretsManager(polygonSecret),
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "refresh",
        logGroup: refreshLogGroup,
      }),
    });

    // Grant task role access to DynamoDB and the secret
    tickerDetailsTable.grantReadWriteData(taskDef.taskRole);
    polygonSecret.grantRead(taskDef.taskRole);

    // Run on the 1st of every month at 2am UTC
    const scheduleRule = new events.Rule(this, "MonthlyRefreshRule", {
      description: "Trigger ticker details refresh on the 1st of each month",
      schedule: events.Schedule.cron({ minute: "0", hour: "2", day: "1", month: "*" }),
    });

    scheduleRule.addTarget(
      new events_targets.EcsTask({
        cluster,
        taskDefinition: taskDef,
        subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
        assignPublicIp: true,
      })
    );

    // ── Alerting ───────────────────────────────────────────────────────────────

    const alertTopic = new sns.Topic(this, "RefreshAlertTopic", {
      topicName: "ticker-refresh-alerts",
    });

    alertTopic.addSubscription(
      new sns_subscriptions.EmailSubscription("shantanu.r.bal@gmail.com")
    );

    // Metric filter matches the JOB_FAILED sentinel the script prints on exit 1
    const failureMetric = new logs.MetricFilter(this, "JobFailedFilter", {
      logGroup: refreshLogGroup,
      metricNamespace: "TickerRefresh",
      metricName: "JobFailed",
      filterPattern: logs.FilterPattern.literal("JOB_FAILED"),
      metricValue: "1",
    });

    const failureAlarm = new cloudwatch.Alarm(this, "JobFailedAlarm", {
      alarmName: "ticker-refresh-job-failed",
      alarmDescription: "Ticker refresh job reported a failure",
      metric: failureMetric.metric({ statistic: "Sum", period: cdk.Duration.hours(2) }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    failureAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    // ── Outputs ────────────────────────────────────────────────────────────────

    new cdk.CfnOutput(this, "TableName", { value: table.tableName });
    new cdk.CfnOutput(this, "Region", { value: this.region });
    new cdk.CfnOutput(this, "AccessKeyId", { value: accessKey.ref });
    new cdk.CfnOutput(this, "SecretAccessKey", {
      value: accessKey.attrSecretAccessKey,
    });
  }
}
