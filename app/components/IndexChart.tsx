"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export interface ChartData {
  points: { date: string; close: number }[];
  changePercent: number;
  currentValue: number;
}

interface Props {
  data: ChartData | null;
  label: string;
  loading: boolean;
}

function fmtAxisDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtValue(v: number): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtYAxis(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v.toFixed(0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, color }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-400 mb-1">{fmtAxisDate(label)}</p>
      <p style={{ color }} className="font-semibold">
        {fmtValue(payload[0].value)}
      </p>
    </div>
  );
}

export default function IndexChart({ data, label, loading }: Props) {
  if (loading) {
    return <div className="rounded-xl border border-gray-800 bg-gray-900/50 h-56 animate-pulse mb-6" />;
  }

  if (!data || data.points.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 mb-6 flex flex-col items-center justify-center h-56 gap-2">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-xs text-gray-600">No chart data available for this period</p>
      </div>
    );
  }

  const { points, changePercent, currentValue } = data;
  const isUp = changePercent >= 0;
  const color = isUp ? "#10b981" : "#f87171";

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 mb-6">
      {/* Summary header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-bold text-white tabular-nums">{fmtValue(currentValue)}</p>
        </div>
        <span
          className={`mt-1 text-sm font-semibold px-3 py-1.5 rounded-full ${
            isUp ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
          }`}
        >
          {isUp ? "▲" : "▼"} {Math.abs(changePercent).toFixed(2)}%
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="indexGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmtAxisDate}
            tick={{ fill: "#4b5563", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "#4b5563", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmtYAxis}
            width={48}
          />
          <Tooltip content={<CustomTooltip color={color} />} />
          <Area
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={2}
            fill="url(#indexGrad)"
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: "none" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
