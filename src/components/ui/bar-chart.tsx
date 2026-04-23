// Zero-dependency SVG bar chart. Keeps the bundle small and avoids recharts.

export function BarChart({
  data,
  height = 180,
  barColor = "url(#dashh_gradient)",
}: {
  data: { label: string; value: number }[];
  height?: number;
  barColor?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barW = 28;
  const gap = 16;
  const width = data.length * (barW + gap) + gap;

  return (
    <svg
      viewBox={`0 0 ${width} ${height + 30}`}
      className="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Bar chart"
    >
      <defs>
        <linearGradient id="dashh_gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="50%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const h = (d.value / max) * height;
        const x = gap + i * (barW + gap);
        const y = height - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx={4} fill={barColor} />
            <text
              x={x + barW / 2}
              y={height + 14}
              textAnchor="middle"
              fontSize="10"
              fill="#a1a1aa"
            >
              {d.label}
            </text>
            <text
              x={x + barW / 2}
              y={y - 4}
              textAnchor="middle"
              fontSize="9"
              fill="#e5e7eb"
            >
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
