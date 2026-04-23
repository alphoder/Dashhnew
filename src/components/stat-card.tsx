'use client';

import { cn } from '@/lib/utils';
import { CountUp } from '@/components/motion/count-up';
import { HoverLift } from '@/components/motion/hover-lift';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

/**
 * Pull a number out of a display value like "42.1234", "$10.5" or
 * "0.0045 SOL" so we can animate the digit part while keeping any currency
 * decoration fixed.
 */
function splitValue(v: string | number) {
  if (typeof v === 'number') {
    return { numeric: v, prefix: '', suffix: '', decimals: 0 };
  }
  const match = v.match(/^(\D*?)(-?\d+(?:[.,]\d+)?)(.*)$/);
  if (!match) return { numeric: NaN, prefix: '', suffix: '', decimals: 0 };
  const [, prefix, numStr, suffix] = match;
  const numeric = Number(numStr.replace(/,/g, ''));
  const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0;
  return { numeric, prefix, suffix, decimals };
}

export function StatCard({ label, value, delta, icon: Icon, className }: StatCardProps) {
  const { numeric, prefix, suffix, decimals } = splitValue(value);
  const animatable = Number.isFinite(numeric);

  return (
    <HoverLift>
      <div
        className={cn(
          'rounded-xl border border-white/10 bg-gradient-to-br from-black/60 to-zinc-900/60 p-5 backdrop-blur-sm',
          className,
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 font-semibold">
              {label}
            </p>
            <p className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-white tabular-nums">
              {animatable ? (
                <CountUp
                  value={numeric}
                  prefix={prefix}
                  suffix={suffix}
                  decimals={Math.min(decimals, 4)}
                />
              ) : (
                value
              )}
            </p>
            {delta && <p className="mt-1 text-xs text-[#14F195]">{delta}</p>}
          </div>
          {Icon && (
            <div className="rounded-lg bg-gradient-to-br from-[#9945FF]/20 to-[#14F195]/20 p-2">
              <Icon className="h-4 w-4 text-[#14F195]" />
            </div>
          )}
        </div>
      </div>
    </HoverLift>
  );
}
