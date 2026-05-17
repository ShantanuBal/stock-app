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

    const usersTable = new dynamodb.Table(this, "Users", {
      tableName: "stock-app-users",
      partitionKey: { name: "username", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const forexCacheTable = new dynamodb.Table(this, "ForexCache", {
      tableName: "stock-app-forex-cache",
      partitionKey: { name: "ticker", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "date", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const optionsContractsTable = new dynamodb.Table(this, "OptionsContracts", {
      tableName: "stock-app-options-contracts",
      partitionKey: { name: "underlying", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "contractKey", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const optionsPricesTable = new dynamodb.Table(this, "OptionsPrices", {
      tableName: "stock-app-options-prices",
      partitionKey: { name: "ticker", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "date", type: dynamodb.AttributeType.STRING },
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
            usersTable.tableArn,
            forexCacheTable.tableArn,
            optionsContractsTable.tableArn,
            optionsPricesTable.tableArn,
          ],
        }),
      ],
    });

    new iam.CfnAccessKey(this, "StockAppAccessKey", {
      userName: appUser.userName,
    });

    // ── Ticker refresh Fargate job ─────────────────────────────────────────────

    // Polygon API key stored in Secrets Manager — value never touches the repo
    const polygonSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "PolygonApiKey",
      "polygon-api-key"
    );

    const vpc = ec2.Vpc.fromVpcAttributes(this, "DefaultVpc", {
      vpcId: "vpc-dcaf7cb9",
      availabilityZones: ["us-west-2a", "us-west-2b", "us-west-2c", "us-west-2d"],
      publicSubnetIds: ["subnet-13e24b76", "subnet-1778b460", "subnet-c1f81498", "subnet-b467349c"],
    });

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

    // Grant task role access to DynamoDB, the secret, and CloudWatch metrics
    tickerDetailsTable.grantReadWriteData(taskDef.taskRole);
    polygonSecret.grantRead(taskDef.taskRole);
    taskDef.taskRole.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ["cloudwatch:PutMetricData"],
      resources: ["*"],
    }));

    // Run daily at midnight PST (8 AM UTC)
    const scheduleRule = new events.Rule(this, "MonthlyRefreshRule", {
      description: "Trigger ticker details and earnings refresh daily at midnight PST",
      schedule: events.Schedule.cron({ minute: "0", hour: "8", day: "*", month: "*" }),
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

    // ── Dashboard ─────────────────────────────────────────────────────────────

    const refreshedMetric = new cloudwatch.Metric({
      namespace: "Horizon/TickerRefresh",
      metricName: "TickersRefreshed",
      statistic: "Sum",
      period: cdk.Duration.days(1),
    });

    const errorsMetric = new cloudwatch.Metric({
      namespace: "Horizon/TickerRefresh",
      metricName: "TickerErrors",
      statistic: "Sum",
      period: cdk.Duration.days(1),
    });

    const durationMetric = new cloudwatch.Metric({
      namespace: "Horizon/TickerRefresh",
      metricName: "RunDuration",
      statistic: "Average",
      period: cdk.Duration.days(1),
    });

    const dashboard = new cloudwatch.Dashboard(this, "RefreshDashboard", {
      dashboardName: "Horizon-TickerRefresh",
    });

    dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: "Last Run — Tickers Refreshed",
        metrics: [refreshedMetric],
        width: 8,
        height: 3,
      }),
      new cloudwatch.SingleValueWidget({
        title: "Last Run — Errors",
        metrics: [errorsMetric],
        width: 8,
        height: 3,
      }),
      new cloudwatch.SingleValueWidget({
        title: "Last Run — Duration (seconds)",
        metrics: [durationMetric],
        width: 8,
        height: 3,
      }),
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Tickers Refreshed (daily)",
        left: [refreshedMetric],
        width: 12,
        height: 6,
        leftYAxis: { min: 0 },
      }),
      new cloudwatch.GraphWidget({
        title: "Errors & Duration (daily)",
        left: [errorsMetric],
        right: [durationMetric],
        width: 12,
        height: 6,
        leftYAxis: { min: 0 },
      }),
    );

    dashboard.addWidgets(
      new cloudwatch.AlarmWidget({
        title: "Job Failed Alarm",
        alarm: failureAlarm,
        width: 24,
        height: 4,
      }),
    );

    new cdk.CfnOutput(this, "DashboardUrl", {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=Horizon-TickerRefresh`,
    });

    // ── Outputs ────────────────────────────────────────────────────────────────

    new cdk.CfnOutput(this, "TableName", { value: table.tableName });
    new cdk.CfnOutput(this, "Region", { value: this.region });

  }
}
