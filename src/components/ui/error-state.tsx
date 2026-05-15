import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Generic error-state block used across the app. Pairs with `EmptyState`
 * so layouts can choose between "nothing here" and "something broke"
 * without re-implementing the chrome.
 */
export function ErrorState({
  title = 'Something went wrong',
  description,
  detail,
  onRetry,
  retryLabel = 'Try again',
  className,
}: {
  title?: string;
  description?: string;
  detail?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center',
        className,
      )}
      role="alert"
    >
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
        <AlertTriangle className="h-6 w-6 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-300">
          {description}
        </p>
      )}
      {detail && (
        <pre className="mx-auto mt-3 max-w-md overflow-x-auto rounded bg-black/40 px-3 py-2 text-left text-[11px] text-zinc-500">
          {detail}
        </pre>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
