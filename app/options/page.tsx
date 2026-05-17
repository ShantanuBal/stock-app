import OptionsGrid from "@/app/components/OptionsGrid";
import type { OptionData } from "@/app/components/OptionCard";

export const metadata = { title: "Options · Horizon" };

function pts(startDate: string, values: number[]): { date: string; value: number }[] {
  return values.map((value, i) => {
    const d = new Date(startDate + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + i);
    return { date: d.toISOString().split("T")[0], value };
  });
}

const START = "2026-04-17";

const STOCKS: OptionData[] = [
  {
    ticker: "O:AAPL260620C00210000",
    underlying: "AAPL", name: "Apple Inc.",
    contractType: "call", strike: 210, expiry: "2026-06-20",
    premium: 11.80, change: 0.35, changePct: 3.06,
    points: pts(START, [8.20, 8.45, 8.65, 8.50, 8.90, 9.10, 8.95, 9.35, 9.55, 9.80, 9.65, 10.05, 10.30, 10.15, 10.55, 10.80, 10.60, 11.00, 11.25, 11.05, 11.45, 11.70, 11.50, 11.85, 11.65, 12.00, 11.80, 12.20, 12.45, 11.80]),
  },
  {
    ticker: "O:AAPL260620P00210000",
    underlying: "AAPL", name: "Apple Inc.",
    contractType: "put", strike: 210, expiry: "2026-06-20",
    premium: 5.90, change: -0.30, changePct: -4.84,
    points: pts(START, [9.80, 9.55, 9.30, 9.50, 9.05, 8.80, 9.00, 8.55, 8.30, 8.05, 8.25, 7.80, 7.55, 7.75, 7.30, 7.05, 7.25, 6.80, 6.55, 6.75, 6.30, 6.05, 6.25, 5.90, 6.10, 5.75, 5.95, 5.60, 5.40, 5.90]),
  },
  {
    ticker: "O:AMZN260620C00200000",
    underlying: "AMZN", name: "Amazon.com Inc.",
    contractType: "call", strike: 200, expiry: "2026-06-20",
    premium: 11.80, change: 0.45, changePct: 3.96,
    points: pts(START, [7.80, 8.15, 8.50, 8.30, 8.75, 9.10, 8.85, 9.30, 9.65, 10.05, 9.80, 10.25, 10.60, 10.35, 10.80, 11.15, 10.90, 11.35, 11.70, 11.45, 11.80, 12.15, 11.90, 12.30, 12.00, 12.40, 12.10, 12.50, 11.80, 11.80]),
  },
  {
    ticker: "O:AMZN260620P00200000",
    underlying: "AMZN", name: "Amazon.com Inc.",
    contractType: "put", strike: 200, expiry: "2026-06-20",
    premium: 6.80, change: -0.35, changePct: -4.90,
    points: pts(START, [11.20, 10.90, 10.60, 10.80, 10.40, 10.10, 10.30, 9.90, 9.60, 9.20, 9.40, 9.00, 8.70, 8.90, 8.50, 8.20, 8.40, 8.00, 7.70, 7.90, 7.50, 7.20, 7.40, 7.00, 7.20, 6.80, 7.00, 6.60, 6.30, 6.80]),
  },
  {
    ticker: "O:GOOGL260620C00170000",
    underlying: "GOOGL", name: "Alphabet Inc.",
    contractType: "call", strike: 170, expiry: "2026-06-20",
    premium: 9.20, change: 0.30, changePct: 3.37,
    points: pts(START, [5.80, 6.10, 6.40, 6.20, 6.60, 6.90, 6.70, 7.10, 7.40, 7.75, 7.50, 7.90, 8.20, 8.00, 8.40, 8.70, 8.50, 8.90, 9.20, 9.00, 9.30, 9.60, 9.40, 9.70, 9.50, 9.80, 9.60, 9.90, 9.20, 9.20]),
  },
  {
    ticker: "O:GOOGL260620P00170000",
    underlying: "GOOGL", name: "Alphabet Inc.",
    contractType: "put", strike: 170, expiry: "2026-06-20",
    premium: 4.10, change: -0.25, changePct: -5.74,
    points: pts(START, [8.50, 8.20, 7.90, 8.10, 7.70, 7.40, 7.60, 7.20, 6.90, 6.50, 6.70, 6.30, 6.00, 6.20, 5.80, 5.50, 5.70, 5.30, 5.00, 5.20, 4.80, 4.50, 4.70, 4.30, 4.50, 4.10, 4.30, 3.90, 3.60, 4.10]),
  },
  {
    ticker: "O:META260620C00580000",
    underlying: "META", name: "Meta Platforms Inc.",
    contractType: "call", strike: 580, expiry: "2026-06-20",
    premium: 25.50, change: 0.90, changePct: 3.66,
    points: pts(START, [17.50, 18.20, 18.90, 18.50, 19.40, 20.10, 19.70, 20.60, 21.30, 22.10, 21.60, 22.50, 23.20, 22.70, 23.60, 24.30, 23.80, 24.70, 25.40, 24.90, 25.60, 26.30, 25.80, 26.50, 26.00, 26.80, 26.20, 27.00, 25.50, 25.50]),
  },
  {
    ticker: "O:META260620P00580000",
    underlying: "META", name: "Meta Platforms Inc.",
    contractType: "put", strike: 580, expiry: "2026-06-20",
    premium: 16.50, change: -0.70, changePct: -4.07,
    points: pts(START, [22.50, 22.00, 21.50, 21.90, 21.30, 20.80, 21.20, 20.60, 20.10, 19.50, 19.90, 19.30, 18.80, 19.20, 18.60, 18.10, 18.50, 17.90, 17.40, 17.80, 17.20, 16.70, 17.10, 16.50, 16.90, 16.30, 16.70, 16.10, 15.60, 16.50]),
  },
  {
    ticker: "O:MSFT260620C00420000",
    underlying: "MSFT", name: "Microsoft Corp.",
    contractType: "call", strike: 420, expiry: "2026-06-20",
    premium: 14.10, change: 0.50, changePct: 3.68,
    points: pts(START, [10.20, 10.55, 10.90, 10.70, 11.15, 11.50, 11.25, 11.70, 12.05, 12.45, 12.20, 12.65, 13.00, 12.75, 13.20, 13.55, 13.30, 13.75, 14.10, 13.85, 14.20, 14.55, 14.30, 14.70, 14.40, 14.80, 14.50, 14.90, 14.10, 14.10]),
  },
  {
    ticker: "O:MSFT260620P00420000",
    underlying: "MSFT", name: "Microsoft Corp.",
    contractType: "put", strike: 420, expiry: "2026-06-20",
    premium: 9.10, change: -0.40, changePct: -4.21,
    points: pts(START, [13.50, 13.20, 12.90, 13.10, 12.70, 12.40, 12.60, 12.20, 11.90, 11.50, 11.70, 11.30, 11.00, 11.20, 10.80, 10.50, 10.70, 10.30, 10.00, 10.20, 9.80, 9.50, 9.70, 9.30, 9.50, 9.10, 9.30, 8.90, 8.60, 9.10]),
  },
  {
    ticker: "O:NVDA260620C00130000",
    underlying: "NVDA", name: "NVIDIA Corp.",
    contractType: "call", strike: 130, expiry: "2026-06-20",
    premium: 10.80, change: 0.60, changePct: 5.88,
    points: pts(START, [6.20, 6.55, 6.90, 6.70, 7.15, 7.50, 7.30, 7.75, 8.10, 8.50, 8.25, 8.70, 9.05, 8.80, 9.25, 9.60, 9.35, 9.80, 10.15, 9.90, 10.35, 10.70, 10.45, 10.90, 10.60, 11.05, 10.75, 11.20, 11.55, 10.80]),
  },
  {
    ticker: "O:NVDA260620P00130000",
    underlying: "NVDA", name: "NVIDIA Corp.",
    contractType: "put", strike: 130, expiry: "2026-06-20",
    premium: 6.80, change: -0.35, changePct: -4.90,
    points: pts(START, [11.50, 11.20, 10.90, 11.10, 10.70, 10.40, 10.60, 10.20, 9.90, 9.50, 9.70, 9.30, 9.00, 9.20, 8.80, 8.50, 8.70, 8.30, 8.00, 8.20, 7.80, 7.50, 7.70, 7.30, 7.50, 7.10, 7.30, 6.90, 6.60, 6.80]),
  },
  {
    ticker: "O:TSLA260620C00280000",
    underlying: "TSLA", name: "Tesla Inc.",
    contractType: "call", strike: 280, expiry: "2026-06-20",
    premium: 28.50, change: 1.20, changePct: 4.40,
    points: pts(START, [18.50, 20.20, 19.40, 21.60, 20.80, 22.50, 21.70, 23.40, 22.60, 24.30, 23.50, 25.20, 24.40, 26.10, 25.30, 27.00, 26.20, 28.00, 27.20, 28.80, 28.00, 29.60, 28.80, 30.50, 29.60, 31.30, 30.50, 32.20, 31.40, 28.50]),
  },
  {
    ticker: "O:TSLA260620P00280000",
    underlying: "TSLA", name: "Tesla Inc.",
    contractType: "put", strike: 280, expiry: "2026-06-20",
    premium: 18.00, change: -0.80, changePct: -4.26,
    points: pts(START, [26.50, 25.80, 25.10, 25.60, 24.80, 24.10, 24.60, 23.80, 23.10, 22.30, 22.80, 22.00, 21.30, 21.80, 21.00, 20.30, 20.80, 20.00, 19.30, 19.80, 19.00, 18.30, 18.80, 18.00, 18.50, 17.70, 18.20, 17.40, 16.80, 18.00]),
  },
];

const ETFS: OptionData[] = [
  {
    ticker: "O:QQQ260620C00490000",
    underlying: "QQQ", name: "Invesco QQQ Trust",
    contractType: "call", strike: 490, expiry: "2026-06-20",
    premium: 15.40, change: 0.70, changePct: 4.76,
    points: pts(START, [9.80, 10.40, 10.90, 10.60, 11.20, 11.80, 11.40, 12.10, 12.60, 13.20, 12.80, 13.50, 14.00, 13.60, 14.30, 14.80, 14.40, 15.10, 15.60, 15.20, 15.80, 16.40, 16.00, 16.60, 16.20, 16.90, 16.50, 17.20, 15.40, 15.40]),
  },
  {
    ticker: "O:QQQ260620P00490000",
    underlying: "QQQ", name: "Invesco QQQ Trust",
    contractType: "put", strike: 490, expiry: "2026-06-20",
    premium: 9.00, change: -0.45, changePct: -4.76,
    points: pts(START, [13.50, 13.10, 12.70, 13.00, 12.50, 12.10, 12.40, 11.90, 11.50, 11.00, 11.30, 10.80, 10.40, 10.70, 10.20, 9.80, 10.10, 9.60, 9.20, 9.50, 9.00, 8.60, 8.90, 8.40, 8.70, 8.20, 8.50, 8.00, 7.60, 9.00]),
  },
  {
    ticker: "O:SPY260620C00560000",
    underlying: "SPY", name: "SPDR S&P 500 ETF",
    contractType: "call", strike: 560, expiry: "2026-06-20",
    premium: 17.50, change: 0.55, changePct: 3.24,
    points: pts(START, [11.50, 12.10, 12.60, 12.30, 13.00, 13.50, 13.20, 13.90, 14.30, 14.90, 14.50, 15.20, 15.70, 15.30, 16.00, 16.50, 16.10, 16.80, 17.30, 16.90, 17.50, 18.00, 17.60, 18.20, 17.80, 18.50, 18.10, 18.80, 17.50, 17.50]),
  },
  {
    ticker: "O:SPY260620P00550000",
    underlying: "SPY", name: "SPDR S&P 500 ETF",
    contractType: "put", strike: 550, expiry: "2026-06-20",
    premium: 10.00, change: -0.40, changePct: -3.85,
    points: pts(START, [14.20, 13.80, 13.40, 13.70, 13.20, 12.80, 13.10, 12.60, 12.20, 11.70, 12.00, 11.50, 11.10, 11.40, 10.90, 10.50, 10.80, 10.30, 9.90, 10.20, 9.70, 9.30, 9.60, 9.20, 9.50, 9.10, 9.40, 9.00, 8.70, 10.00]),
  },
];

const VOLATILITY: OptionData[] = [
  {
    ticker: "O:VIX260618C00020000",
    underlying: "VIX", name: "CBOE Volatility Index",
    contractType: "call", strike: 20, expiry: "2026-06-18",
    premium: 3.10, change: -0.15, changePct: -4.62,
    points: pts(START, [3.20, 4.10, 3.50, 2.80, 3.50, 4.20, 3.80, 2.90, 3.60, 4.30, 3.70, 2.80, 3.40, 4.10, 3.50, 2.90, 3.60, 4.20, 3.80, 3.10, 3.80, 4.50, 3.90, 3.20, 3.90, 4.60, 4.00, 3.30, 4.10, 3.10]),
  },
  {
    ticker: "O:VIX260618P00020000",
    underlying: "VIX", name: "CBOE Volatility Index",
    contractType: "put", strike: 20, expiry: "2026-06-18",
    premium: 2.50, change: 0.10, changePct: 4.17,
    points: pts(START, [2.50, 1.80, 2.40, 3.10, 2.50, 1.90, 2.60, 3.20, 2.60, 2.00, 2.70, 3.30, 2.70, 2.10, 2.80, 3.40, 2.80, 2.20, 2.90, 3.50, 2.90, 2.30, 3.00, 3.60, 3.00, 2.40, 3.10, 3.70, 3.10, 2.50]),
  },
];

export default function OptionsPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 mb-1">
          Options
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Premium history for at-the-money monthly contracts · Data from Polygon · Updated daily
        </p>
      </div>

      <OptionsGrid stocks={STOCKS} etfs={ETFS} volatility={VOLATILITY} />

      <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
        Data from Polygon · End-of-day premiums · Updated daily
      </p>
    </div>
  );
}
