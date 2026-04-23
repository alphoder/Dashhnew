// Dependency-free bar chart using pure CSS. No recharts needed.

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  accentGradient?: string;
  formatValue?: (v: number) => string;
}

export function BarChart({
  data,
  height = 200,
  accentGradient = 'from-[#9945FF] via-[#9945FF] to-[#14F195]',
  formatValue,
}: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex w-full flex-col gap-2">
      <div
        className="flex w-full items-end gap-2 rounded-lg bg-white/5 p-4"
        style={{ height }}
      >
        {data.length === 0 ? (
          <p className="mx-auto text-sm text-zinc-500">No data yet.</p>
        ) : (
          data.map((d, i) => {
            const pct = Math.max(2, Math.round((d.value / max) * 100));
            return (
              <div key={i} className="group flex h-full flex-1 flex-col justify-end">
                <div
                  className={`rounded-t bg-gradient-to-t ${accentGradient} transition-all group-hover:opacity-80`}
                  style={{ height: `${pct}%` }}
                  title={`${d.label}: ${formatValue ? formatValue(d.value) : d.value}`}
                />
              </div>
            );
          })
        )}
      </div>
      <div className="flex w-full gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 truncate text-center text-[10px] text-zinc-500">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
