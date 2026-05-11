"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";
import type { IndicatorPoint } from "@/lib/fred";

interface Props {
  points: IndicatorPoint[];
  color: string;
}

export default function Sparkline({ points, color }: Props) {
  return (
    <ResponsiveContainer width="100%" height={52}>
      <AreaChart data={points} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color.replace("#", "")})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
