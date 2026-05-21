import { docClient } from "./dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const CACHE_TABLE = process.env.ECONOMY_CACHE_TABLE_NAME ?? "EconomyCache";
const CACHE_TTL = 30 * 24 * 60 * 60; // 30 days — for eventual cleanup only; freshness is enforced by date key

export interface IndicatorPoint {
  date: string;
  value: number;
}

export interface IndicatorResult {
  id: string;
  value: number;
  change: number;
  points: IndicatorPoint[];
  lastDate: string;
}

export interface IndicatorConfig {
  id: string;
  label: string;
  unitDisplay: string;
  framing: "positive" | "negative" | "neutral";
  unitsParam?: string;
  changeLabel: string;
  fetchLimit: number;
  tooltip: { what: string; why: string; good: string };
}

export const INDICATOR_CONFIGS: IndicatorConfig[] = [
  {
    id: "A191RL1Q225SBEA",
    label: "Real GDP Growth",
    unitDisplay: "% annualized",
    framing: "positive",
    changeLabel: "vs prev quarter",
    fetchLimit: 12,
    tooltip: {
      what: "The annualized rate at which the US economy grew or shrank in the most recent quarter, adjusted for inflation.",
      why: "GDP is the broadest scorecard for the economy. Sustained growth signals healthy business activity and employment. Two consecutive quarters of negative growth is the common definition of a recession.",
      good: "Above 2% is considered healthy for the US. Above 3% is strong. Negative means the economy is contracting.",
    },
  },
  {
    id: "CPIAUCSL",
    label: "CPI Inflation",
    unitDisplay: "% year-over-year",
    framing: "negative",
    unitsParam: "pc1",
    changeLabel: "vs prev month",
    fetchLimit: 24,
    tooltip: {
      what: "The Consumer Price Index measures how much prices for everyday goods and services — food, housing, gas, clothing — have changed over the past year.",
      why: "The Fed targets ~2% inflation. When inflation runs too high, the Fed raises interest rates to cool spending. Higher rates make borrowing expensive, slow economic growth, and pressure stock valuations.",
      good: "Around 2% is ideal. Below 2% risks deflation (falling prices, which can stall economic activity). Above 4–5% triggers aggressive Fed rate hikes.",
    },
  },
  {
    id: "PCEPILFE",
    label: "Core PCE",
    unitDisplay: "% year-over-year",
    framing: "negative",
    unitsParam: "pc1",
    changeLabel: "vs prev month",
    fetchLimit: 24,
    tooltip: {
      what: "Personal Consumption Expenditures price index, excluding volatile food and energy. This is the Federal Reserve's officially preferred inflation measure.",
      why: "The Fed explicitly targets Core PCE at 2%. It adjusts for how consumers substitute goods when prices change, making it more flexible than CPI. Markets pay close attention to every monthly release.",
      good: "At or near 2%. Elevated readings keep the Fed in rate-hiking mode. Falling PCE signals the Fed's work may be done and rate cuts could follow.",
    },
  },
  {
    id: "UNRATE",
    label: "Unemployment Rate",
    unitDisplay: "%",
    framing: "negative",
    changeLabel: "vs prev month",
    fetchLimit: 24,
    tooltip: {
      what: "The percentage of the US labor force that is actively looking for work but cannot find a job. Measured monthly by the Bureau of Labor Statistics.",
      why: "Low unemployment signals a strong labor market and robust consumer spending. Very low unemployment can fuel wage inflation, prompting the Fed to raise rates. Very high unemployment signals economic distress.",
      good: "Around 4–5% is considered 'full employment' — some frictional unemployment always exists as people switch jobs. Below 4% is exceptional. Above 6% typically signals economic stress.",
    },
  },
  {
    id: "FEDFUNDS",
    label: "Fed Funds Rate",
    unitDisplay: "%",
    framing: "neutral",
    changeLabel: "vs prev month",
    fetchLimit: 24,
    tooltip: {
      what: "The interest rate at which banks lend money to each other overnight. The Federal Reserve sets a target range for this rate as its primary monetary policy tool.",
      why: "The fed funds rate is the foundation of all borrowing costs — mortgages, car loans, corporate debt, and savings accounts all follow its lead. Rate hikes slow inflation but also slow economic growth. Rate cuts stimulate activity but risk inflation.",
      good: "Depends on context. Near 0% during crises to stimulate growth. Around 4–5% when fighting high inflation. The 'neutral rate' (neither stimulating nor restrictive) is estimated around 2.5%.",
    },
  },
  {
    id: "GS10",
    label: "10-Year Treasury",
    unitDisplay: "%",
    framing: "neutral",
    changeLabel: "vs prev month",
    fetchLimit: 24,
    tooltip: {
      what: "The yield (annual interest rate) on 10-year US government bonds — considered the risk-free rate since the US government has never defaulted.",
      why: "The 10-year yield is the global benchmark for long-term borrowing costs. It influences mortgage rates, corporate bond pricing, and stock valuations. When yields rise, bonds become more attractive relative to stocks, often triggering equity sell-offs.",
      good: "Lower yields support higher stock valuations (especially growth stocks, whose future earnings are discounted at this rate). A sharp rise in yields signals inflation fears and tighter financial conditions.",
    },
  },
  {
    id: "T10Y2Y",
    label: "Yield Curve (10Y–2Y)",
    unitDisplay: "percentage points",
    framing: "positive",
    changeLabel: "vs prev month",
    fetchLimit: 24,
    tooltip: {
      what: "The difference between the 10-year and 2-year US Treasury yields. When positive, long-term rates are higher than short-term — the normal state. When negative, the curve is 'inverted.'",
      why: "An inverted yield curve (below 0) has preceded every US recession since the 1950s, typically by 6–18 months. It signals that investors expect the economy to weaken and the Fed to cut rates in the future. Banks also borrow short and lend long, so inversion squeezes their margins and reduces lending.",
      good: "Positive means the curve is normal and healthy. A deeply negative reading (below -0.5) is a strong recession warning. The curve re-steepening after an inversion — especially turning positive again — has historically signaled the recession is near or already underway.",
    },
  },
  {
    id: "UMCSENT",
    label: "Consumer Sentiment",
    unitDisplay: "index (1966=100)",
    framing: "positive",
    changeLabel: "vs prev month",
    fetchLimit: 24,
    tooltip: {
      what: "University of Michigan's monthly survey of ~500 US households, measuring how confident they feel about their personal finances and the broader economy.",
      why: "Consumer spending drives roughly 70% of the US economy. Confident consumers spend more freely; nervous consumers cut back. Sentiment often leads economic turns by several months, making it a valuable early warning signal.",
      good: "Above 80 signals healthy confidence. Below 60 is associated with recessions. The historical average is around 86. Sudden sharp drops often precede economic slowdowns.",
    },
  },
];

async function fetchFromFred(config: IndicatorConfig): Promise<IndicatorResult | null> {
  const key = process.env.FRED_API_KEY;
  if (!key) return null;

  const units = config.unitsParam ? `&units=${config.unitsParam}` : "";
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${config.id}&api_key=${key}&file_type=json&sort_order=desc&limit=${config.fetchLimit}${units}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const observations: IndicatorPoint[] = (data.observations ?? [])
    .filter((o: { value: string }) => o.value !== ".")
    .map((o: { date: string; value: string }) => ({
      date: o.date,
      value: parseFloat(o.value),
    }));

  if (observations.length < 2) return null;

  const points = [...observations].reverse(); // oldest first for sparkline
  const value = observations[0].value;
  const prev = observations[1].value;

  return {
    id: config.id,
    value,
    change: value - prev,
    points,
    lastDate: observations[0].date,
  };
}

export async function getIndicator(config: IndicatorConfig): Promise<IndicatorResult | null> {
  const pk = `${config.id}#${new Date().toISOString().split("T")[0]}`;

  try {
    const cached = await docClient.send(new GetCommand({ TableName: CACHE_TABLE, Key: { pk } }));
    if (cached.Item?.data) return JSON.parse(cached.Item.data as string) as IndicatorResult;
  } catch {}

  const result = await fetchFromFred(config);
  if (!result) return null;

  const ttl = Math.floor(Date.now() / 1000) + CACHE_TTL;
  try {
    await docClient.send(new PutCommand({ TableName: CACHE_TABLE, Item: { pk, data: JSON.stringify(result), ttl } }));
  } catch {}

  return result;
}

export async function getAllIndicators(): Promise<(IndicatorResult | null)[]> {
  return Promise.all(INDICATOR_CONFIGS.map((c) => getIndicator(c)));
}
