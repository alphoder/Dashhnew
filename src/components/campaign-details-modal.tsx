'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Coins,
  Eye,
  Instagram,
  Youtube,
  Twitter,
  Music2,
  Loader2,
  ShieldCheck,
  Trophy,
  Users,
  Zap,
  FileSignature,
  ExternalLink,
  Medal,
  AlertTriangle,
} from 'lucide-react';
import { truncateAddress, formatAmount } from '@/lib/utils';
import {
  CREATOR_TERMS_VERSION,
  DISQUALIFICATION_REASONS,
  buildCreatorJoinMessage,
} from '@/lib/terms';

type Platform = 'instagram' | 'youtube' | 'twitter' | 'tiktok';

export interface FullCampaign {
  id: string;
  title: string;
  description: string;
  platform: Platform;
  iconUrl: string;
  ctaLabel: string;
  budget: number;
  cpv: number;
  status: string;
  startsAt: string;
  endsAt: string;
  brandWallet: string;
  paymentModel?:
    | 'per_view'
    | 'top_performer'
    | 'split_top_n'
    | 'equal_split';
  topNCount?: number | null;
  platformFeeBps?: number;
  termsVersion?: string | null;
  termsSignature?: string | null;
  termsSignedAt?: string | null;

  // Provided for v1 (legacy) campaigns — when present, the Join button
  // opens the Solana Blink URL instead of calling /api/v2/.../participate.
  blinkUrl?: string;
}

const PLATFORM_META: Record<
  Platform,
  { label: string; Icon: React.ComponentType<{ className?: string }>; tint: string }
> = {
  instagram: { label: 'Instagram', Icon: Instagram, tint: 'from-pink-500 to-orange-400' },
  youtube: { label: 'YouTube', Icon: Youtube, tint: 'from-red-500 to-red-700' },
  twitter: { label: 'X / Twitter', Icon: Twitter, tint: 'from-sky-500 to-sky-700' },
  tiktok: { label: 'TikTok', Icon: Music2, tint: 'from-zinc-700 to-zinc-900' },
};

const MODEL_META: Record<
  NonNullable<FullCampaign['paymentModel']>,
  { title: string; blurb: (c: FullCampaign) => string; Icon: React.ComponentType<{ className?: string }> }
> = {
  per_view: {
    title: 'Per verified view',
    blurb: (c) =>
      `Every verified view pays ${c.cpv.toFixed(4)} SOL, up to the total budget.`,
    Icon: Eye,
  },
  top_performer: {
    title: 'Winner takes all',
    blurb: () =>
      'The single top-viewed creator receives the entire creator pool when the campaign ends.',
    Icon: Trophy,
  },
  split_top_n: {
    title: 'Split across the top N',
    blurb: (c) =>
      `The top ${c.topNCount ?? 3} creators share the creator pool equally at campaign end.`,
    Icon: Users,
  },
  equal_split: {
    title: 'Equal split (all verified)',
    blurb: () =>
      'Every creator with a valid proof receives an equal share of the creator pool.',
    Icon: Users,
  },
};

interface CampaignDetailsModalProps {
  /** Pass an id to fetch from /api/v2/campaigns/[id]. */
  campaignId?: string | null;
  /** Or pass a preloaded campaign object (v1 legacy path). */
  preloaded?: FullCampaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignDetailsModal({
  campaignId,
  preloaded,
  open,
  onOpenChange,
}: CampaignDetailsModalProps) {
  const [campaign, setCampaign] = useState<FullCampaign | null>(preloaded ?? null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  // Participation id returned from /participate — we need it so the "submit
  // proof" button can deep-link into the verifyClaim page for THIS enrolment.
  const [participationId, setParticipationId] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [leaderboard, setLeaderboard] = useState<
    { wallet: string; views: number; proofs: number; earned: number }[] | null
  >(null);

  useEffect(() => {
    if (!open) return;
    setJoined(false);
    setParticipationId(null);
    setAcceptedTerms(false);
    setLeaderboard(null);
    // Preloaded wins — skip the fetch entirely.
    if (preloaded) {
      setCampaign(preloaded);
      setLoading(false);
      return;
    }
    if (!campaignId) return;
    let active = true;
    setLoading(true);
    setCampaign(null);
    fetch(`/api/v2/campaigns/${campaignId}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (active) setCampaign(data.campaign);
      })
      .catch((err) => {
        console.error(err);
        if (active) toast.error('Could not load campaign');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [campaignId, preloaded, open]);

  // Fetch per-campaign leaderboard once the campaign is known.
  useEffect(() => {
    if (!open || !campaign) return;
    let active = true;
    fetch(`/api/v2/campaigns/${campaign.id}/leaderboard`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (active) setLeaderboard(data.leaderboard ?? []);
      })
      .catch(() => {
        if (active) setLeaderboard([]);
      });
    return () => {
      active = false;
    };
  }, [open, campaign]);

  async function signCreatorTerms(wallet: string): Promise<string | null> {
    if (!campaign) return null;
    if (typeof window === 'undefined') return null;
    const { solana }: any = window;
    if (!solana?.signMessage) {
      toast.error('Phantom is not available — please connect your wallet.');
      return null;
    }
    const issuedAt = new Date().toISOString();
    const msg = buildCreatorJoinMessage({
      creatorWallet: wallet,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      paymentModel: campaign.paymentModel ?? 'per_view',
      platform: campaign.platform,
      issuedAt,
    });
    const encoded = new TextEncoder().encode(msg);
    const { signature } = await solana.signMessage(encoded, 'utf8');
    return btoa(String.fromCharCode(...(signature as Uint8Array)));
  }

  async function handleJoin() {
    if (!campaign) return;

    // v1 / legacy path — redirect to the Solana Blink URL so the user can
    // actually participate via dial.to's standard flow.
    if (campaign.blinkUrl) {
      window.open(campaign.blinkUrl, '_blank', 'noopener,noreferrer');
      setJoined(true);
      toast.success('Opening Blink…');
      return;
    }

    if (!acceptedTerms) {
      toast.info('Please agree to the creator terms first');
      return;
    }

    const wallet =
      typeof window !== 'undefined' ? window.localStorage.getItem('dashh_wallet') : null;
    if (!wallet) {
      toast.info('Connect your wallet first — head to Onboarding.');
      return;
    }
    setJoining(true);
    try {
      toast.info('Sign the creator terms in your wallet…');
      const termsSignature = await signCreatorTerms(wallet);
      if (!termsSignature) {
        setJoining(false);
        return;
      }
      const res = await fetch(`/api/v2/campaigns/${campaign.id}/participate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorWallet: wallet,
          termsVersion: CREATOR_TERMS_VERSION,
          termsSignature,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? `Status ${res.status}`);
      }
      const body = await res.json().catch(() => ({}));
      const pid = body?.participation?.id ?? null;
      setParticipationId(pid);
      setJoined(true);
      toast.success('You\u2019re in \u2014 now post the content & submit a proof');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? 'Could not join. Try again?');
    } finally {
      setJoining(false);
    }
  }

  const platformMeta = campaign
    ? PLATFORM_META[campaign.platform] ?? PLATFORM_META.instagram
    : null;
  const feeBps = campaign?.platformFeeBps ?? 2000;
  const feePct = feeBps / 100;
  const platformFee = campaign ? campaign.budget * (feeBps / 10_000) : 0;
  const creatorPool = campaign ? campaign.budget - platformFee : 0;

  const daysLeft = campaign
    ? Math.max(
        0,
        Math.ceil((new Date(campaign.endsAt).getTime() - Date.now()) / 86_400_000),
      )
    : 0;

  const paymentModel = campaign?.paymentModel ?? 'per_view';
  const modelMeta = MODEL_META[paymentModel];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black border border-white/10 text-white p-0">
        {loading || !campaign ? (
          <div className="flex items-center justify-center py-24 text-zinc-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading campaign…
          </div>
        ) : (
          <>
            {/* Hero image */}
            <div className="relative h-48 w-full">
              <Image
                src={campaign.iconUrl}
                alt={campaign.title}
                fill
                sizes="(max-width: 768px) 100vw, 672px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              {platformMeta && (
                <div
                  className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${platformMeta.tint} px-3 py-1 text-xs font-medium text-white shadow`}
                >
                  <platformMeta.Icon className="h-3.5 w-3.5" />
                  {platformMeta.label}
                </div>
              )}
              <div className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-1 text-[10px] uppercase tracking-wider text-zinc-300">
                {campaign.status}
              </div>
            </div>

            <div className="px-6 pb-6 pt-5 space-y-5">
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  {campaign.title}
                </DialogTitle>
                <p className="text-sm leading-relaxed text-zinc-300">
                  {campaign.description}
                </p>
              </DialogHeader>

              {/* Key stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Budget" value={`${campaign.budget.toFixed(2)} SOL`} Icon={Coins} tint="text-[#14F195]" />
                <Stat label="Cost / view" value={campaign.cpv.toFixed(4)} Icon={Zap} tint="text-[#14F195]" />
                <Stat label="Ends in" value={`${daysLeft}d`} Icon={Calendar} tint="text-[#9945FF]" />
                <Stat label="Brand" value={truncateAddress(campaign.brandWallet)} Icon={ShieldCheck} tint="text-[#9945FF]" mono />
              </div>

              {/* Payment model — THE transparency block */}
              <div className="rounded-xl border border-[#14F195]/20 bg-gradient-to-br from-[#14F195]/5 to-black p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#14F195]/20 p-2 ring-1 ring-[#14F195]/40">
                    <modelMeta.Icon className="h-5 w-5 text-[#14F195]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#14F195]">
                      How you get paid
                    </p>
                    <p className="mt-1 text-base font-semibold text-white">
                      {modelMeta.title}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {modelMeta.blurb(campaign)}
                    </p>
                  </div>
                </div>

                {/* Fee breakdown */}
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-black/40 p-3 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">Budget</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {campaign.budget.toFixed(2)} SOL
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                      Platform ({feePct}%)
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#9945FF]">
                      {platformFee.toFixed(4)} SOL
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">Creator pool</p>
                    <p className="mt-1 text-sm font-semibold text-[#14F195]">
                      {creatorPool.toFixed(4)} SOL
                    </p>
                  </div>
                </div>
              </div>

              {/* Signed terms attestation */}
              {campaign.termsSignature && (
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-4 text-xs">
                  <FileSignature className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#9945FF]" />
                  <div>
                    <p className="font-medium text-white">
                      Brand signed DASHH Terms{' '}
                      <span className="text-[#14F195]">
                        {campaign.termsVersion ?? 'v1'}
                      </span>
                    </p>
                    <p className="mt-0.5 text-zinc-400">
                      Signed {campaign.termsSignedAt
                        ? new Date(campaign.termsSignedAt).toLocaleString()
                        : 'before launch'}{' '}
                      — budget is locked in escrow and the payment model above
                      is enforced on settlement.
                    </p>
                    <Link
                      href="/terms"
                      target="_blank"
                      className="mt-1 inline-flex items-center gap-1 text-[#14F195] hover:underline"
                    >
                      Read the terms <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Per-campaign leaderboard */}
              {leaderboard && leaderboard.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-black/40">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Medal className="h-4 w-4 text-[#14F195]" />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#14F195]">
                        Top participants
                      </p>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      {leaderboard.length}{' '}
                      {leaderboard.length === 1 ? 'creator' : 'creators'} joined
                    </span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {leaderboard.slice(0, 5).map((row, i) => (
                      <div
                        key={row.wallet}
                        className="grid grid-cols-12 gap-2 items-center px-4 py-2.5 text-sm hover:bg-white/5"
                      >
                        <div className="col-span-1">
                          {i < 3 ? (
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-black ${
                                i === 0
                                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                                  : i === 1
                                    ? 'bg-gradient-to-r from-zinc-300 to-zinc-500'
                                    : 'bg-gradient-to-r from-amber-600 to-amber-800'
                              }`}
                            >
                              {i + 1}
                            </span>
                          ) : (
                            <span className="text-zinc-500 text-xs">{i + 1}</span>
                          )}
                        </div>
                        <div className="col-span-5 font-mono text-xs text-zinc-200 truncate">
                          {truncateAddress(row.wallet)}
                        </div>
                        <div className="col-span-3 text-right text-xs">
                          <span className="text-white">
                            {row.views.toLocaleString()}
                          </span>
                          <span className="text-zinc-500"> views</span>
                        </div>
                        <div className="col-span-3 text-right text-xs text-[#14F195]">
                          {formatAmount(row.earned, 3)} SOL
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {leaderboard && leaderboard.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-500">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1">
                    Top participants
                  </p>
                  No creators yet — be the first to join.
                </div>
              )}

              {/* What happens when you join — turns into the live action panel
                  after successful join so the creator always has a visible
                  next step. */}
              {!joined ? (
                <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-300">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-2">
                    When you join
                  </p>
                  <ol className="space-y-1.5 list-decimal list-inside marker:text-[#14F195]">
                    <li>Post the content on your {platformMeta?.label} account.</li>
                    <li>Submit a zkTLS proof via Reclaim — we scrape the view count, nothing else.</li>
                    <li>Payout settles per the model above once the proof verifies.</li>
                  </ol>
                </div>
              ) : (
                <div className="rounded-xl border border-[#14F195]/30 bg-gradient-to-br from-[#14F195]/10 to-black p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-[#14F195] p-1.5">
                      <ShieldCheck className="h-4 w-4 text-black" />
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#14F195]">
                      You\u2019re in. Two steps left.
                    </p>
                  </div>

                  <ol className="space-y-3 text-sm text-zinc-200">
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#14F195]/40 bg-black text-[11px] font-semibold text-[#14F195]">
                        1
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          Post the content on {platformMeta?.label}.
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          Must include the brand\u2019s required hashtag, mention or
                          phrase from the terms above \u2014 otherwise the proof is
                          disqualified.
                        </p>
                        <Link
                          href={
                            campaign.platform === 'instagram'
                              ? 'https://instagram.com'
                              : campaign.platform === 'youtube'
                                ? 'https://studio.youtube.com'
                                : campaign.platform === 'twitter'
                                  ? 'https://x.com/compose/post'
                                  : 'https://tiktok.com/upload'
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 text-xs text-[#14F195] hover:underline"
                        >
                          Open {platformMeta?.label} in a new tab <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#14F195]/40 bg-black text-[11px] font-semibold text-[#14F195]">
                        2
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          Submit your zkTLS proof.
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          Scan the Reclaim QR code with your phone, log into
                          {` ${platformMeta?.label} `}
                          inside the Reclaim app, and we\u2019ll capture the view
                          count \u2014 nothing else.
                        </p>
                      </div>
                    </li>
                  </ol>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      href={`/verifyClaim/${participationId ?? campaign.id}?platform=${campaign.platform}&campaignId=${campaign.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[#14F195] to-[#9945FF] px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90"
                      onClick={() => onOpenChange(false)}
                    >
                      <Zap className="h-4 w-4" />
                      Submit zkTLS proof now
                    </Link>
                    <Link
                      href={`/creatordashboard?participation=${participationId ?? ''}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/5"
                      onClick={() => onOpenChange(false)}
                    >
                      Save for later \u2014 go to my dashboard
                    </Link>
                  </div>

                  <p className="text-[11px] text-zinc-500">
                    Come back any time \u2014 you have until
                    {' '}
                    <span className="text-white">
                      {new Date(
                        new Date(campaign.endsAt).getTime() + 7 * 86_400_000,
                      ).toLocaleDateString()}
                    </span>
                    {' '}to submit your final proof before forfeiture.
                  </p>
                </div>
              )}

              {/* Disqualification notice + creator T&C */}
              {!campaign.blinkUrl && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-red-300">
                        Disqualification rules
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        Any of these voids your payout on this campaign. Full list at{' '}
                        <Link href="/terms#disqualification" target="_blank" className="text-[#14F195] underline">
                          /terms
                        </Link>
                        .
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-1 pl-6 text-xs text-zinc-300 list-disc marker:text-red-400/60">
                    {DISQUALIFICATION_REASONS.slice(0, 4).map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>

                  <label className="mt-4 flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[#14F195]"
                    />
                    <span className="text-sm text-zinc-200">
                      I've read and agree to the{' '}
                      <Link href="/terms#creator" target="_blank" className="text-[#14F195] underline">
                        DASHH Creator Terms {CREATOR_TERMS_VERSION}
                      </Link>{' '}
                      and will sign this acknowledgement with my wallet on join.
                    </span>
                  </label>
                </div>
              )}

              {/* CTA — hidden once the user has joined; the "What's next"
                  panel above takes over as the primary action zone. */}
              {!joined && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleJoin}
                    disabled={joining || (!campaign.blinkUrl && !acceptedTerms)}
                    className="flex-1 bg-gradient-to-r from-[#14F195] to-[#9945FF] text-black font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {joining
                      ? 'Signing & joining\u2026'
                      : campaign.blinkUrl
                        ? 'Open Blink to participate'
                        : acceptedTerms
                          ? 'Sign terms & join'
                          : 'Agree to terms first'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="border-white/10 bg-transparent text-zinc-300 hover:bg-white/5"
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({
  label,
  value,
  Icon,
  tint,
  mono,
}: {
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  tint: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">
          {label}
        </p>
        <Icon className={`h-3.5 w-3.5 ${tint}`} />
      </div>
      <p
        className={`mt-1 text-sm font-semibold text-white ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </p>
    </div>
  );
}
