const API_KEY = process.env.POLYGON_API_KEY!;
const BASE_URL = "https://api.polygon.io";

export type TimeRange = "1D" | "3D" | "1W" | "1M" | "3M" | "YTD";

export interface StockResult {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
  changeDollars: number;
  volume: number;
}

interface GroupedDailyResult {
  T: string;  // ticker
  c: number;  // close
  o: number;  // open
  h: number;  // high
  l: number;  // low
  v: number;  // volume
  t: number;  // timestamp
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getPreviousTradingDay(date: Date, daysBack: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - daysBack);
  // Skip weekends
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

export function getStartDate(range: TimeRange, today: Date): Date {
  const d = new Date(today);
  switch (range) {
    case "1D":
      return getPreviousTradingDay(d, 1);
    case "3D":
      return getPreviousTradingDay(d, 3);
    case "1W":
      return getPreviousTradingDay(d, 7);
    case "1M":
      d.setMonth(d.getMonth() - 1);
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
      return d;
    case "3M":
      d.setMonth(d.getMonth() - 3);
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
      return d;
    case "YTD":
      return new Date(d.getFullYear(), 0, 2); // Jan 2 (Jan 1 market closed)
  }
}

async function fetchGroupedDaily(date: string): Promise<GroupedDailyResult[]> {
  const url = `${BASE_URL}/v2/aggs/grouped/locale/us/market/stocks/${date}?adjusted=true&apiKey=${API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Polygon error: ${res.status}`);
  const data = await res.json();
  return data.results ?? [];
}

async function findMostRecentTradingData(date: Date): Promise<{ date: string; results: GroupedDailyResult[] }> {
  for (let i = 0; i < 7; i++) {
    const d = new Date(date);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const dateStr = formatDate(d);
    const results = await fetchGroupedDaily(dateStr);
    if (results.length > 0) return { date: dateStr, results };
  }
  throw new Error("Could not find recent trading data");
}

export async function getTopPerformers(range: TimeRange, sp500Tickers: Set<string>, tickerNames: Record<string, string>): Promise<StockResult[]> {
  // Always use the most recent completed trading day (free tier can't fetch today's data until after close)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const startDate = getStartDate(range, yesterday);

  const [currentData, startData] = await Promise.all([
    findMostRecentTradingData(yesterday),
    findMostRecentTradingData(startDate),
  ]);

  const startPriceMap = new Map<string, number>();
  for (const item of startData.results) {
    if (sp500Tickers.has(item.T)) {
      startPriceMap.set(item.T, item.c);
    }
  }

  const results: StockResult[] = [];
  for (const item of currentData.results) {
    if (!sp500Tickers.has(item.T)) continue;
    const startPrice = startPriceMap.get(item.T);
    if (!startPrice || startPrice === 0) continue;

    const changePercent = ((item.c - startPrice) / startPrice) * 100;
    const changeDollars = item.c - startPrice;

    results.push({
      ticker: item.T,
      name: tickerNames[item.T] ?? item.T,
      price: item.c,
      changePercent,
      changeDollars,
      volume: item.v,
    });
  }

  return results.sort((a, b) => b.changePercent - a.changePercent).slice(0, 100);
}

export interface ChartPoint {
  date: string;
  close: number;
}

export async function getIndexBars(ticker: string, from: string, to: string): Promise<ChartPoint[]> {
  const url = `${BASE_URL}/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=500&apiKey=${API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Polygon error: ${res.status}`);
  const data = await res.json();
  const bars: Array<{ t: number; c: number }> = data.results ?? [];
  return bars.map((b) => ({
    date: new Date(b.t).toISOString().split("T")[0],
    close: b.c,
  }));
}
