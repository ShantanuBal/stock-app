import type { StockResult } from "@/lib/polygon";

interface Props {
  title: string;
  accent: "emerald" | "red";
  stocks: StockResult[];
}

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toString();
}

export default function PerformerTable({ title, accent, stocks }: Props) {
  const accentColor = accent === "emerald" ? "text-emerald-400" : "text-red-400";

  return (
    <div>
      <h2 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${accentColor}`}>
        {title}
      </h2>
      <div className="overflow-hidden rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-3 py-3 text-left w-7">#</th>
              <th className="px-3 py-3 text-left">Ticker</th>
              <th className="px-3 py-3 text-left hidden lg:table-cell">Company</th>
              <th className="px-3 py-3 text-right">Price</th>
              <th className="px-3 py-3 text-right">% Change</th>
              <th className="px-3 py-3 text-right hidden xl:table-cell">Volume</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, i) => {
              const isPos = stock.changePercent >= 0;
              const color = isPos ? "text-emerald-400" : "text-red-400";
              const bg = isPos ? "bg-emerald-400/10" : "bg-red-400/10";
              return (
                <tr
                  key={stock.ticker}
                  className="border-b border-gray-800/50 bg-gray-900/30 transition-colors hover:bg-gray-800/50"
                >
                  <td className="px-3 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-3 py-3 font-bold text-white">{stock.ticker}</td>
                  <td className="px-3 py-3 text-gray-300 max-w-[140px] truncate hidden lg:table-cell">
                    {stock.name}
                  </td>
                  <td className="px-3 py-3 text-right text-white tabular-nums">
                    ${stock.price.toFixed(2)}
                  </td>
                  <td className={`px-3 py-3 text-right font-semibold ${color}`}>
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${bg}`}>
                      {isPos ? "▲" : "▼"} {Math.abs(stock.changePercent).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-gray-400 hidden xl:table-cell tabular-nums">
                    {formatVolume(stock.volume)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
