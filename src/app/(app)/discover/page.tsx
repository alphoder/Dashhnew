'use client';

import { useEffect, useState } from 'react';
import { CampaignCard, type CampaignCardData } from '@/components/campaign-card';
import { CampaignDetailsModal } from '@/components/campaign-details-modal';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ReferralCard } from '@/components/referral-card';

type Platform = 'all' | 'instagram' | 'youtube' | 'twitter' | 'tiktok';

export default function DiscoverPage() {
  const [campaigns, setCampaigns] = useState<CampaignCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<Platform>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ status: 'active' });
        if (platform !== 'all') params.set('platform', platform);
        const res = await fetch(`/api/v2/campaigns?${params}`, { cache: 'no-store' });
        const data = await res.json();
        if (!active) return;
        setCampaigns(data.campaigns ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [platform]);

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

      <div className="flex flex-wrap gap-2">
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading campaigns…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/40 p-12 text-center text-zinc-400">
          <p className="mb-2 text-lg text-white">No campaigns yet.</p>
          <p className="text-sm">
            Brands — head to{' '}
            <a href="/form" className="text-[#14F195] underline">
              create a campaign
            </a>{' '}
            to get started.
          </p>
        </div>
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
