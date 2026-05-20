"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "./ThemeProvider";

interface Props {
  points: { label: string; yield: number }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label, color, isDark }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-lg border px-2.5 py-1.5 text-xs shadow-lg ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
      <p className={`mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
      <p style={{ color }} className="font-semibold tabular-nums">{payload[0].value.toFixed(2)}%</p>
    </div>
  );
}

export default function YieldCurveChart({ points }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const twoYear = points.find((p) => p.label === "2Y")?.yield;
  const tenYear = points.find((p) => p.label === "10Y")?.yield;
  const isInverted = twoYear != null && tenYear != null && twoYear > tenYear;

  const lineColor = isInverted ? "#f87171" : "#10b981";

  return (
    <div>
      {isInverted && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2">
          <span className="text-xs font-semibold text-red-500">Inverted curve</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">2-year yield exceeds 10-year — historically a recession warning signal</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: isDark ? "#4b5563" : "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: isDark ? "#4b5563" : "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<ChartTooltip color={lineColor} isDark={isDark} />} />
          <Line
            type="monotone"
            dataKey="yield"
            stroke={lineColor}
            strokeWidth={2}
            dot={{ fill: lineColor, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: lineColor, stroke: "none" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
