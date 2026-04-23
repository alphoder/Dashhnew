// Gamification — creator tiers based on total verified views.
// Tiers only flex — they drive color, label, emoji, glow.

export interface Tier {
  key: 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'starter';
  name: string;
  emoji: string;
  minViews: number;
  accent: string; // css color / tailwind arbitrary
  gradient: string; // tailwind gradient classes
  glow: string; // shadow color
}

// Ordered from highest to lowest.
export const TIERS: Tier[] = [
  {
    key: 'diamond',
    name: 'Diamond',
    emoji: '💎',
    minViews: 250_000,
    accent: '#22d3ee',
    gradient: 'from-cyan-400 to-blue-500',
    glow: 'shadow-cyan-400/40',
  },
  {
    key: 'platinum',
    name: 'Platinum',
    emoji: '🏅',
    minViews: 100_000,
    accent: '#e5e7eb',
    gradient: 'from-zinc-200 to-zinc-400',
    glow: 'shadow-zinc-200/30',
  },
  {
    key: 'gold',
    name: 'Gold',
    emoji: '🥇',
    minViews: 25_000,
    accent: '#facc15',
    gradient: 'from-yellow-400 to-amber-500',
    glow: 'shadow-yellow-400/40',
  },
  {
    key: 'silver',
    name: 'Silver',
    emoji: '🥈',
    minViews: 5_000,
    accent: '#a1a1aa',
    gradient: 'from-zinc-300 to-zinc-500',
    glow: 'shadow-zinc-400/30',
  },
  {
    key: 'bronze',
    name: 'Bronze',
    emoji: '🥉',
    minViews: 500,
    accent: '#fb923c',
    gradient: 'from-amber-600 to-orange-600',
    glow: 'shadow-amber-500/30',
  },
  {
    key: 'starter',
    name: 'Starter',
    emoji: '🌱',
    minViews: 0,
    accent: '#14F195',
    gradient: 'from-[#9945FF] to-[#14F195]',
    glow: 'shadow-[#14F195]/30',
  },
];

export function tierForViews(views: number): Tier {
  return TIERS.find((t) => views >= t.minViews) ?? TIERS[TIERS.length - 1];
}

/** Views-to-next-tier helper. Returns null if at the top. */
export function nextTier(views: number): {
  next: Tier;
  remaining: number;
  progress: number; // 0..1 toward next tier
} | null {
  const current = tierForViews(views);
  const currentIdx = TIERS.findIndex((t) => t.key === current.key);
  if (currentIdx <= 0) return null;
  const next = TIERS[currentIdx - 1];
  const span = next.minViews - current.minViews;
  const done = views - current.minViews;
  return {
    next,
    remaining: Math.max(0, next.minViews - views),
    progress: Math.min(1, Math.max(0, done / span)),
  };
}

// ─────────── Badges — small achievements ───────────
export interface Badge {
  key: string;
  label: string;
  emoji: string;
  test: (row: { views: number; proofs: number; earned: number }, rank: number) => boolean;
}

export const BADGES: Badge[] = [
  { key: 'crown', label: 'Reigning', emoji: '👑', test: (_r, rank) => rank === 0 },
  { key: 'podium', label: 'Podium', emoji: '🏆', test: (_r, rank) => rank > 0 && rank < 3 },
  { key: 'top10', label: 'Top 10', emoji: '⭐', test: (_r, rank) => rank >= 3 && rank < 10 },
  {
    key: 'big-earner',
    label: '10+ SOL',
    emoji: '💰',
    test: (r) => r.earned >= 10,
  },
  {
    key: 'viral',
    label: 'Viral',
    emoji: '🔥',
    test: (r) => r.views >= 50_000,
  },
  {
    key: 'prolific',
    label: 'Prolific',
    emoji: '📚',
    test: (r) => r.proofs >= 5,
  },
  {
    key: 'first-blood',
    label: 'First Proof',
    emoji: '🎯',
    test: (r) => r.proofs === 1,
  },
];

export function badgesFor(
  row: { views: number; proofs: number; earned: number },
  rank: number,
): Badge[] {
  return BADGES.filter((b) => b.test(row, rank));
}
