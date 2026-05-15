'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CampaignCard, type CampaignCardData } from '@/components/campaign-card';
import { CampaignDetailsModal } from '@/components/campaign-details-modal';
import { Button } from '@/components/ui/button';
import { Compass, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ReferralCard } from '@/components/referral-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCardGrid } from '@/components/ui/skeleton';

type Platform = 'all' | 'instagram' | 'youtube' | 'twitter' | 'tiktok';

export default function DiscoverPage() {
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState<CampaignCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stash a ?ref=<wallet> parameter into localStorage so the participate
  // endpoint can read it later when the user first joins a campaign.
  // We only honour the first ref seen — subsequent visits don't overwrite.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ref = searchParams?.get('ref');
    if (!ref) return;
    if (!window.localStorage.getItem('dashh_referrer')) {
      window.localStorage.setItem('dashh_referrer', ref);
    }
  }, [searchParams]);
  const [platform, setPlatform] = useState<Platform>('all');
  const [query, setQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ status: 'active' });
        if (platform !== 'all') params.set('platform', platform);
        if (verifiedOnly) params.set('verifiedOnly', 'true');
        const res = await fetch(`/api/v2/campaigns?${params}`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }
        const data = await res.json();
        if (!active) return;
        setCampaigns(data.campaigns ?? []);
      } catch (err: any) {
        console.error(err);
        if (active) setError(err?.message ?? 'Could not load campaigns');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [platform, verifiedOnly, reloadKey]);

  const filtered = campaigns.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  });

  const platforms: { id: Platform; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'twitter', label: 'X' },
    { id: 'tiktok', label: 'TikTok' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discover</h1>
          <p className="text-zinc-400">Browse active campaigns and start earning.</p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campaigns…"
            className="pl-9 bg-black/40 border-white/10 text-white placeholder:text-zinc-500"
          />
        </div>
      </div>

      <ReferralCard />

      <div className="flex flex-wrap items-center gap-2">
        {platforms.map((p) => (
          <Button
            key={p.id}
            variant={platform === p.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPlatform(p.id)}
            className={
              platform === p.id
                ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white'
                : 'bg-transparent border-white/10 text-zinc-300 hover:bg-white/5'
            }
          >
            {p.label}
          </Button>
        ))}
        <div className="ml-auto">
          <label className="inline-flex cursor-pointer select-none items-center gap-2 rounded-md border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/5">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="h-3.5 w-3.5 accent-[#14F195]"
            />
            Verified brands only
          </label>
        </div>
      </div>

      {loading ? (
        <SkeletonCardGrid count={6} />
      ) : error ? (
        <ErrorState
          title="Couldn't load campaigns"
          description="The campaigns API responded with an error. The product is still live — this is usually a transient blip."
          detail={error}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Compass}
          title={query ? 'No campaigns match your search' : 'No campaigns yet'}
          description={
            query
              ? `Nothing matched "${query}". Try a different keyword or clear the search.`
              : 'Be the first brand on the platform — create a campaign and creators will see it instantly on this page.'
          }
          action={
            query ? (
              <Button
                variant="outline"
                onClick={() => setQuery('')}
                className="border-white/10 bg-transparent text-zinc-200 hover:bg-white/5"
              >
                Clear search
              </Button>
            ) : (
              <a
                href="/form"
                className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-[#9945FF] to-[#14F195] px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
              >
                Launch a campaign
              </a>
            )
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              onView={(id) => {
                setSelectedId(id);
                setModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <CampaignDetailsModal
        campaignId={selectedId}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
