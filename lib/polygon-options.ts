import { docClient } from "./dynamodb";
import { ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const CONTRACTS_TABLE = process.env.OPTIONS_CONTRACTS_TABLE_NAME ?? "stock-app-options-contracts";
const PRICES_TABLE    = process.env.OPTIONS_PRICES_TABLE_NAME    ?? "stock-app-options-prices";
const SPARKLINE_DAYS  = 400;

export interface OptionData {
  ticker: string;
  underlying: string;
  name: string;
  contractType: "call" | "put";
  strike: number;
  expiry: string;
  premium: number;
  change: number;
  changePct: number;
  points: { date: string; value: number }[];
}

interface Contract {
  ticker: string;
  underlying: string;
  name: string;
  contractType: "call" | "put";
  strike: number;
  expiry: string;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
}

async function getActiveContracts(): Promise<Contract[]> {
  const res = await docClient.send(new ScanCommand({
    TableName: CONTRACTS_TABLE,
    FilterExpression: "#s = :active",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":active": "active" },
  }));
  return (res.Items ?? []).map((item) => ({
    ticker:       item.ticker as string,
    underlying:   item.underlying as string,
    name:         item.name as string,
    contractType: item.contractType as "call" | "put",
    strike:       item.strike as number,
    expiry:       item.expiry as string,
  }));
}

async function getPriceHistory(ticker: string): Promise<{ date: string; close: number }[]> {
  const res = await docClient.send(new QueryCommand({
    TableName: PRICES_TABLE,
    KeyConditionExpression: "ticker = :t AND #d BETWEEN :from AND :to",
    ExpressionAttributeNames: { "#d": "date" },
    ExpressionAttributeValues: {
      ":t":    ticker,
      ":from": daysAgo(SPARKLINE_DAYS + 10),
      ":to":   today(),
    },
    ScanIndexForward: true,
  }));
  return (res.Items ?? []).map((item) => ({ date: item.date as string, close: item.close as number }));
}

async function contractToOptionData(contract: Contract): Promise<OptionData | null> {
  const history = await getPriceHistory(contract.ticker);
  if (history.length < 2) {
    console.log(`[options] insufficient history for ${contract.ticker}: ${history.length} rows`);
    return null;
  }

  const latest    = history[history.length - 1];
  const previous  = history[history.length - 2];
  const premium   = latest.close;
  const change    = premium - previous.close;
  const changePct = (change / previous.close) * 100;
  const points    = history.slice(-SPARKLINE_DAYS).map((h) => ({ date: h.date, value: h.close }));

  return {
    ticker:       contract.ticker,
    underlying:   contract.underlying,
    name:         contract.name,
    contractType: contract.contractType,
    strike:       contract.strike,
    expiry:       contract.expiry,
    premium,
    change,
    changePct,
    points,
  };
}

const ETF_UNDERLYINGS        = new Set(["SPY", "QQQ"]);
const VOLATILITY_UNDERLYINGS = new Set(["VIX"]);

export async function getAllOptionsData(): Promise<{
  stocks:     OptionData[];
  etfs:       OptionData[];
  volatility: OptionData[];
}> {
  const contracts = await getActiveContracts();
  console.log(`[options] found ${contracts.length} active contracts`);

  const results = await Promise.all(contracts.map(contractToOptionData));
  const valid   = results.filter((d): d is OptionData => d !== null);

  const stocks     = valid
    .filter((d) => !ETF_UNDERLYINGS.has(d.underlying) && !VOLATILITY_UNDERLYINGS.has(d.underlying))
    .sort((a, b) => a.underlying.localeCompare(b.underlying) || a.contractType.localeCompare(b.contractType));
  const etfs       = valid
    .filter((d) => ETF_UNDERLYINGS.has(d.underlying))
    .sort((a, b) => a.underlying.localeCompare(b.underlying) || a.contractType.localeCompare(b.contractType));
  const volatility = valid
    .filter((d) => VOLATILITY_UNDERLYINGS.has(d.underlying))
    .sort((a, b) => a.underlying.localeCompare(b.underlying) || a.contractType.localeCompare(b.contractType));

  return { stocks, etfs, volatility };
}
