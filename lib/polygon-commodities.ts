import { getAllForexRates } from "./polygon-forex";
import { getIndicator } from "./fred";
import type { IndicatorConfig } from "./fred";

export interface CommodityConfig {
  ticker: string;
  name: string;
  category: "metals" | "energy";
}

export interface CommodityData {
  ticker: string;
  name: string;
  category: string;
  price: number;
  change: number;
  changePct: number;
  points: { date: string; value: number }[];
}

// ── Precious metals ─────────────────────────────────────────────────────────
// Available via Polygon Forex API (XAU/XAG/XPT/XPD trade as USD forex pairs).
// Prices are USD per troy oz.

const METALS_FOREX_TICKERS = ["C:XAUUSD", "C:XAGUSD", "C:XPTUSD", "C:XPDUSD"];

export const METALS_CONFIGS: CommodityConfig[] = [
  { ticker: "XAU/USD", name: "Gold",      category: "metals" },
  { ticker: "XAG/USD", name: "Silver",    category: "metals" },
  { ticker: "XPT/USD", name: "Platinum",  category: "metals" },
  { ticker: "XPD/USD", name: "Palladium", category: "metals" },
];

export async function getAllMetalsData(): Promise<(CommodityData | null)[]> {
  const rates = await getAllForexRates(METALS_FOREX_TICKERS);
  return rates.map((rate, i) => {
    if (!rate) return null;
    return {
      ticker: METALS_CONFIGS[i].ticker,
      name: METALS_CONFIGS[i].name,
      category: "metals",
      price: rate.rate,
      change: rate.change,
      changePct: rate.changePct,
      points: rate.points,
    };
  });
}

// ── Energy ───────────────────────────────────────────────────────────────────
// FRED daily series. Prices are USD per barrel (oil) or USD per MMBtu (gas).
// Cached in EconomyCache DynamoDB table with 24h TTL.

export const ENERGY_FRED_CONFIGS: IndicatorConfig[] = [
  {
    id: "DCOILWTICO",
    label: "WTI Crude Oil",
    unitDisplay: "$/barrel",
    framing: "neutral",
    changeLabel: "vs prev day",
    fetchLimit: 400,
    tooltip: {
      what: "West Texas Intermediate (WTI) is the US benchmark crude, trading on NYMEX. It represents light sweet crude delivered at Cushing, Oklahoma.",
      why: "Oil prices feed directly into gasoline, plastics, and transport costs — a $10/barrel rise adds roughly 0.3% to US inflation. OPEC+ production decisions and US inventory data move WTI weekly.",
      good: "$50–$80/barrel is considered a moderate range. Below $40 stresses producers; above $100 squeezes consumers and has historically preceded recessions.",
    },
  },
  {
    id: "DCOILBRENTEU",
    label: "Brent Crude",
    unitDisplay: "$/barrel",
    framing: "neutral",
    changeLabel: "vs prev day",
    fetchLimit: 400,
    tooltip: {
      what: "Brent crude is the international benchmark, produced in the North Sea. Most of the world's oil — including OPEC exports — is priced relative to Brent.",
      why: "The Brent-WTI spread (Brent usually trades $2–$5 above WTI) reflects transportation and quality differences. A widening spread can signal US supply gluts or global demand stress.",
      good: "Similar to WTI. Brent typically trades at a slight premium due to transportation costs from the US to global markets.",
    },
  },
  {
    id: "DHHNGSP",
    label: "Natural Gas",
    unitDisplay: "$/MMBtu",
    framing: "neutral",
    changeLabel: "vs prev day",
    fetchLimit: 400,
    tooltip: {
      what: "Henry Hub Natural Gas Spot Price — the US benchmark for natural gas at the Henry Hub distribution point in Louisiana, measured in dollars per million British thermal units.",
      why: "Natural gas is used for electricity generation, home heating, and industrial feedstock. Prices are highly seasonal (cold winters spike demand) and volatile — the 2022 European energy crisis showed how gas supply shocks can ripple globally.",
      good: "$2–$4/MMBtu is the historical normal range. Spikes above $6 stress consumers and industry; below $2 is uneconomic for many producers.",
    },
  },
];

export const ENERGY_CONFIGS: CommodityConfig[] = ENERGY_FRED_CONFIGS.map((c) => ({
  ticker: c.id,
  name: c.label,
  category: "energy" as const,
}));

export async function getAllEnergyData(): Promise<(CommodityData | null)[]> {
  const results = await Promise.all(ENERGY_FRED_CONFIGS.map((c) => getIndicator(c)));
  return results.map((result, i) => {
    if (!result) return null;
    const prevPrice = result.value - result.change;
    const changePct = prevPrice !== 0 ? (result.change / Math.abs(prevPrice)) * 100 : 0;
    return {
      ticker: ENERGY_CONFIGS[i].ticker,
      name: ENERGY_CONFIGS[i].name,
      category: "energy",
      price: result.value,
      change: result.change,
      changePct,
      points: result.points.map((p) => ({ date: p.date, value: p.value })),
    };
  });
}
