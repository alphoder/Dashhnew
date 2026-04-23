'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/format-relative';
import { useMode } from '@/hooks/use-mode';

interface Notif {
  id: string;
  wallet: string;
  kind: string;
  title: string;
  body: string | null;
  payload: any;
  readAt: string | null;
  createdAt: string;
}

const KIND_BADGE: Record<string, string> = {
  proof_verified: 'bg-green-500/20 text-green-300',
  proof_rejected: 'bg-red-500/20 text-red-300',
  participation_joined: 'bg-blue-500/20 text-blue-300',
  payout_sent: 'bg-purple-500/20 text-purple-300',
  campaign_ending: 'bg-yellow-500/20 text-yellow-300',
};

// Which notification kinds belong to each side of the marketplace.
// Explore (creator) — things about MY submissions
// Create  (brand)   — things about MY campaigns
const EXPLORE_KINDS = new Set([
  'proof_verified',
  'proof_rejected',
  'payout_sent',
]);
const CREATE_KINDS = new Set([
  'participation_joined',
  'proof_verified',
  'payout_sent',
  'campaign_ending',
]);

type Scope = 'mode' | 'all';

export default function NotificationsPage() {
  const { mode } = useMode();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>('mode');

  const load = useCallback(async (w: string | null) => {
    if (!w) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v2/notifications?wallet=${encodeURIComponent(w)}`,
        { cache: 'no-store' },
      );
      const data = await res.json();
      setItems(data.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const w =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('dashh_wallet')
        : null;
    setWallet(w);
    load(w);
  }, [load]);

  // Filter list by scope + current mode.
  const visible = useMemo(() => {
    if (scope === 'all') return items;
    const kinds = mode === 'create' ? CREATE_KINDS : EXPLORE_KINDS;
    return items.filter((n) => kinds.has(n.kind));
  }, [items, scope, mode]);

  const unreadCount = visible.filter((i) => !i.readAt).length;

  async function markRead(id: string) {
    try {
      await fetch(`/api/v2/notifications/${id}/read`, { method: 'POST' });
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, readAt: new Date().toISOString() } : i,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function markAllRead() {
    const unread = visible.filter((i) => !i.readAt);
    await Promise.all(
      unread.map((i) =>
        fetch(`/api/v2/notifications/${i.id}/read`, { method: 'POST' }),
      ),
    );
    setItems((prev) =>
      prev.map((i) => {
        const match = unread.find((u) => u.id === i.id);
        return match ? { ...i, readAt: new Date().toISOString() } : i;
      }),
    );
  }

  // Mode-aware chrome
  const accent = mode === 'create' ? '#14F195' : '#9945FF';
  const modeLabel = mode === 'create' ? 'Brand inbox' : 'Creator inbox';
  const modeBlurb =
    mode === 'create'
      ? 'Activity on campaigns you launched — new creators, verified proofs, payouts.'
      : 'Activity on your participations — verified proofs, rejections, payouts.';

  return (
    <div className="space-y-6">
      {/* Mode-coloured hero banner */}
      <div
        className="relative overflow-hidden rounded-2xl border p-6 md:p-8"
        style={{
          borderColor: `${accent}55`,
          background: `linear-gradient(135deg, ${accent}20 0%, #000 50%, #000 100%)`,
        }}
      >
        <div
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl"
          style={{ backgroundColor: accent, opacity: 0.2 }}
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="rounded-xl p-3 ring-1"
              style={{
                backgroundColor: `${accent}22`,
                boxShadow: `inset 0 0 0 1px ${accent}44`,
              }}
            >
              <Bell className="h-6 w-6" style={{ color: accent }} />
            </div>
            <div>
              <p
                className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: accent }}
              >
                {modeLabel}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                Notifications
              </h1>
              <p className="mt-2 max-w-xl text-sm text-zinc-300">{modeBlurb}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="text-sm text-zinc-400">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
            {unreadCount > 0 && (
              <Button
                onClick={markAllRead}
                variant="outline"
                size="sm"
                className="border-white/10 bg-transparent text-zinc-300 hover:bg-white/5"
              >
                <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Scope toggle — lets user peek at the other side's inbox */}
      <div className="inline-flex rounded-lg border border-white/10 bg-black/40 p-1 text-sm">
        {(
          [
            { id: 'mode' as Scope, label: mode === 'create' ? 'Brand' : 'Creator' },
            { id: 'all' as Scope, label: 'Everything' },
          ]
        ).map((s) => (
          <button
            key={s.id}
            onClick={() => setScope(s.id)}
            className={`rounded-md px-4 py-1.5 transition ${
              scope === s.id
                ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {!wallet ? (
        <Card className="border-white/10 bg-black/40 p-10 text-center text-zinc-400">
          <Bell className="mx-auto mb-3 h-8 w-8 text-zinc-500" />
          <p className="text-white">Connect your wallet to see notifications</p>
          <p className="mt-1 text-sm">
            Head to{' '}
            <a href="/onboarding" className="text-[#14F195] underline">
              onboarding
            </a>{' '}
            to connect.
          </p>
        </Card>
      ) : loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : visible.length === 0 ? (
        <Card className="border-white/10 bg-black/40 p-10 text-center text-zinc-400">
          <Bell className="mx-auto mb-3 h-8 w-8 text-zinc-500" />
          <p className="text-white">
            {scope === 'mode'
              ? `No ${mode === 'create' ? 'brand' : 'creator'} notifications yet.`
              : 'No notifications yet.'}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Switch to "Everything" to see all activity on this wallet.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map((n) => (
            <Card
              key={n.id}
              className={`flex items-start gap-3 border-white/10 p-4 text-white transition ${
                n.readAt
                  ? 'bg-black/40'
                  : 'bg-gradient-to-r from-[#9945FF]/5 to-[#14F195]/5'
              }`}
            >
              <div
                className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                  n.readAt ? 'bg-zinc-600' : ''
                }`}
                style={n.readAt ? undefined : { backgroundColor: accent }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] uppercase ${
                      KIND_BADGE[n.kind] ?? 'bg-white/10 text-zinc-300'
                    }`}
                  >
                    {n.kind.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {formatDistanceToNow(new Date(n.createdAt))}
                  </span>
                </div>
                <p className="mt-1 font-medium">{n.title}</p>
                {n.body && (
                  <p className="mt-0.5 text-sm text-zinc-400">{n.body}</p>
                )}
              </div>
              {!n.readAt && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => markRead(n.id)}
                  className="text-zinc-400 hover:text-white"
                >
                  Mark read
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
