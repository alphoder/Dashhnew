'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, ExternalLink, X } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/format-relative';

interface Notif {
  id: string;
  wallet: string;
  kind: string;
  title: string;
  body: string | null;
  payload: Record<string, any> | null;
  readAt: string | null;
  createdAt: string;
}

const KIND_TINT: Record<string, string> = {
  payout_paid: 'bg-[#14F195]',
  payout_sent: 'bg-[#14F195]',
  settled: 'bg-[#14F195]',
  participation_joined: 'bg-sky-400',
  campaign_refunded: 'bg-[#9945FF]',
  campaign_cancelled: 'bg-amber-400',
  proof_join_recorded: 'bg-[#9945FF]',
  proof_final_recorded: 'bg-[#14F195]',
  proof_rejected: 'bg-red-400',
  proof_flagged: 'bg-amber-400',
  forfeited: 'bg-zinc-500',
  banned: 'bg-red-500',
};

export function NotificationBell({ wallet }: { wallet: string | null }) {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  useEffect(() => {
    if (!wallet) {
      setNotifications([]);
      return;
    }
    let active = true;
    const fetchAll = async () => {
      try {
        const res = await fetch(`/api/v2/notifications?wallet=${wallet}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const { notifications: rows } = await res.json();
        if (active && Array.isArray(rows)) setNotifications(rows);
      } catch {
        /* ignore — bell is non-critical */
      }
    };
    fetchAll();
    const t = setInterval(fetchAll, 30_000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [wallet]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  async function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );
    try {
      await fetch(`/api/v2/notifications/${id}/read`, { method: 'POST' });
    } catch {
      /* optimistic — already updated locally */
    }
  }

  async function markAllAsRead() {
    const unread = notifications.filter((n) => !n.readAt);
    if (unread.length === 0) return;
    setNotifications((prev) =>
      prev.map((n) =>
        n.readAt ? n : { ...n, readAt: new Date().toISOString() },
      ),
    );
    await Promise.all(
      unread.map((n) =>
        fetch(`/api/v2/notifications/${n.id}/read`, { method: 'POST' }).catch(
          () => null,
        ),
      ),
    );
  }

  const preview = notifications.slice(0, 6);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-label={`Notifications (${unreadCount} unread)`}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-[#9945FF] px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/10 bg-black/95 shadow-2xl backdrop-blur"
          role="menu"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Notifications</p>
              <p className="text-[11px] text-zinc-500">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : 'You’re all caught up'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="rounded px-2 py-1 text-[11px] text-zinc-400 hover:bg-white/5 hover:text-white"
                  title="Mark all as read"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-zinc-500 hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {!wallet ? (
              <div className="px-4 py-8 text-center text-xs text-zinc-500">
                Connect your wallet to receive notifications.
              </div>
            ) : preview.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-zinc-500">
                Nothing here yet. Join a campaign or launch one to start
                receiving updates.
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {preview.map((n) => {
                  const tint = KIND_TINT[n.kind] ?? 'bg-zinc-500';
                  return (
                    <li
                      key={n.id}
                      className={`group flex gap-3 px-4 py-3 text-sm ${
                        n.readAt ? 'opacity-60' : ''
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full ${tint}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-white">
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="line-clamp-2 text-xs text-zinc-400">
                            {n.body}
                          </p>
                        )}
                        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-600">
                          {formatDistanceToNow(new Date(n.createdAt))} ago
                          {n.payload?.txSignature &&
                            typeof n.payload.txSignature === 'string' &&
                            !n.payload.txSignature.startsWith('DRY_RUN') && (
                              <a
                                href={`https://explorer.solana.com/tx/${n.payload.txSignature}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 inline-flex items-center gap-0.5 normal-case text-[#14F195] hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                tx <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                        </p>
                      </div>
                      {!n.readAt && (
                        <button
                          type="button"
                          onClick={() => markAsRead(n.id)}
                          className="self-start rounded p-1 text-zinc-500 opacity-0 transition-opacity hover:bg-white/5 hover:text-[#14F195] group-hover:opacity-100"
                          title="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-white/10 px-4 py-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block w-full rounded-md py-1.5 text-center text-xs font-medium text-[#14F195] hover:bg-white/5"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
