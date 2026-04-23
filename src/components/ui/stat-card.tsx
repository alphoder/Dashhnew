import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <Card className={cn("bg-zinc-950/70 border-white/10 text-white", className)}>
      <CardContent className="p-5 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-400">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          {delta && <p className="mt-1 text-xs text-emerald-400">{delta}</p>}
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-gradient-to-br from-[#9945FF]/20 to-[#14F195]/20">
            <Icon className="h-5 w-5 text-[#14F195]" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
