/**
 * Daily refresh job for ticker details and earnings (description, shares outstanding, net income).
 * Runs in ECS Fargate, triggered by EventBridge Scheduler daily at midnight PST (8 AM UTC).
 * Exits 1 and prints JOB_FAILED if errors exceed 10% of tickers.
 */

import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { ALL_TICKERS } from "../lib/all-tickers";
import { refreshTickerDetails } from "../lib/tickerDetails";

const cw = new CloudWatchClient({ region: process.env.AWS_REGION ?? "us-west-2" });
const CW_NAMESPACE = "Horizon/TickerRefresh";

async function publishMetrics(refreshed: number, errors: number, durationSeconds: number) {
  try {
    await cw.send(new PutMetricDataCommand({
      Namespace: CW_NAMESPACE,
      MetricData: [
        { MetricName: "TickersRefreshed", Value: refreshed, Unit: "Count" },
        { MetricName: "TickerErrors",     Value: errors,    Unit: "Count" },
        { MetricName: "RunDuration",      Value: durationSeconds, Unit: "Seconds" },
      ],
    }));
    console.log(`[refresh] Metrics published to CloudWatch (${CW_NAMESPACE})`);
  } catch (err) {
    console.error(`[refresh] Failed to publish metrics: ${err}`);
  }
}


(async () => {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const fromArg = process.argv.find((a) => a.startsWith("--from="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;
  const from = fromArg ? parseInt(fromArg.split("=")[1], 10) : 0;

  const apiKey = process.env.POLYGON_API_KEY;
  console.log(`[refresh] POLYGON_API_KEY: ${apiKey ? `set (${apiKey.slice(0, 4)}…)` : "NOT SET — all requests will 401"}`);

  const allTickers = ALL_TICKERS;
  const tickers = allTickers.slice(from, limit ? from + limit : undefined);
  const suffix = [from > 0 ? `from index ${from}` : "", limit ? `limit ${limit}` : ""].filter(Boolean).join(", ");
  console.log(`[refresh] Starting ticker details refresh for ${tickers.length} tickers${suffix ? ` (${suffix})` : ""}`);

  const startTime = Date.now();
  let refreshed = 0;
  let errors = 0;

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];
    process.stdout.write(`[refresh] [${i + 1}/${tickers.length}] ${ticker}... `);
    try {
      const details = await refreshTickerDetails(ticker);
      if (details) {
        console.log("ok");
        refreshed++;
      } else {
        console.log("no data");
        errors++;
      }
    } catch (err) {
      console.log(`ERROR: ${err}`);
      errors++;
    }
  }

  const durationSeconds = Math.round((Date.now() - startTime) / 1000);
  const errorRate = errors / tickers.length;
  console.log(`\n[refresh] Done. Refreshed: ${refreshed} · Errors: ${errors} · Duration: ${durationSeconds}s`);

  await publishMetrics(refreshed, errors, durationSeconds);

  if (errorRate > 0.1) {
    console.log(`JOB_FAILED error rate ${(errorRate * 100).toFixed(1)}% exceeds threshold`);
    process.exit(1);
  }
})();
