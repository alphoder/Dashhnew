import { BadgeCheck } from 'lucide-react';

/**
 * Verified-brand checkmark. Shown next to a campaign's brand wallet when
 * the brand has been manually vetted (basic) or completed KYB.
 *
 * Tooltip text reflects the verification level so creators know whether
 * they're seeing a name-confirmed or full-KYB brand.
 */
export function VerifiedBadge({
  level,
  size = 'sm',
  className = '',
}: {
  level?: 'none' | 'basic' | 'kyb' | string | null;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  if (!level || level === 'none') return null;

  const sizeCls =
    size === 'md' ? 'h-5 w-5' : size === 'sm' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  const title =
    level === 'kyb'
      ? 'KYB-verified brand — full business identity check on file'
      : 'Verified brand — basic identity check on file';

  return (
    <span
      title={title}
      aria-label={title}
      className={`inline-flex items-center text-[#14F195] ${className}`}
    >
      <BadgeCheck className={sizeCls} />
    </span>
  );
}
