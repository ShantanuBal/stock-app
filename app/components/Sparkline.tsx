"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useTheme } from "./ThemeProvider";
import type { IndicatorPoint } from "@/lib/fred";

interface Props {
  points: IndicatorPoint[];
  color: string;
  unit?: string;
  height?: number;
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SparkTooltip({ active, payload, label, color, isDark }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-lg border px-2.5 py-1.5 text-xs shadow-lg ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
      <p className={`mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{fmtDate(label)}</p>
      <p style={{ color }} className="font-semibold">{payload[0].value.toFixed(2)}</p>
    </div>
  );
}

export default function Sparkline({ points, color, height = 130 }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tickColor = isDark ? "#4b5563" : "#9ca3af";
  const gridColor = isDark ? "#1f2937" : "#f3f4f6";
  const gradId = `spark-${color.replace("#", "")}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 4, right: 24, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={fmtDate}
          tick={{ fill: tickColor, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={["auto", "auto"]}
          tick={{ fill: tickColor, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v.toFixed(1)}
          width={38}
        />
        <Tooltip content={<SparkTooltip color={color} isDark={isDark} />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={false}
          activeDot={{ r: 3, fill: color, stroke: "none" }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
