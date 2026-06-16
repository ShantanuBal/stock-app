"use client";

// Tiny dependency-free sparkline for the index snapshot cards. Renders a single
// polyline from a series of closes — no axes, grid, or tooltip (use the blow-up
// modal for the detailed chart).
interface Props {
  points: { close: number }[];
  color: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function MiniSparkline({ points, color, width = 96, height = 28, className }: Props) {
  if (!points || points.length < 2) return null;

  const closes = points.map((p) => p.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const n = closes.length;

  const coords = closes.map((c, i) => {
    const x = (i / (n - 1)) * width;
    const y = height - ((c - min) / span) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
