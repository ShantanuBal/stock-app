/**
 * Daily refresh job for ticker details and earnings (description, shares outstanding, net income).
 * Runs in ECS Fargate, triggered by EventBridge Scheduler daily at midnight PST (8 AM UTC).
 * Makes 2 sequential Polygon API calls per ticker with 15s between them (4 calls/min, under free tier limit).
 * Exits 1 and prints JOB_FAILED if errors exceed 10% of tickers.
 */

import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { SP500_SECTORS } from "../lib/sp500";
import { NASDAQ100_SECTORS } from "../lib/nasdaq100";
import { DJIA_SECTORS } from "../lib/djia";
import { RUSSELL2000_SECTORS } from "../lib/russell2000";
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

const DELAY_MS = 15_000; // 15s after financials call before next ticker → 4 calls/min total

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uniqueTickers(): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const source of [SP500_SECTORS, NASDAQ100_SECTORS, DJIA_SECTORS, RUSSELL2000_SECTORS]) {
    for (const ticker of Object.keys(source)) {
      if (!seen.has(ticker)) {
        seen.add(ticker);
        result.push(ticker);
      }
    }
  }
  return result;
}

(async () => {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const fromArg = process.argv.find((a) => a.startsWith("--from="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;
  const from = fromArg ? parseInt(fromArg.split("=")[1], 10) : 0;

  const allTickers = uniqueTickers();
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
    await sleep(DELAY_MS);
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
