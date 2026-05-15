// Public embeddable campaign widget.
//
// Embed via:
//   <iframe src="https://dashhnew.vercel.app/embed/campaign/<id>"
//           width="400" height="320" style="border:0"></iframe>
//
// Optional query params:
//   ?accent=14F195    — hex tint (no '#') for the CTA button
//   ?hide=image,description — comma-separated parts to strip
//   ?theme=light      — light variant (default is dark)
//
// We can't nest <html>, so the root layout still renders the global
// chrome. We hide it with inline CSS that targets the body's direct
// children — anything outside the embed card disappears.

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '@/lib/db/schemas';
import { Instagram, Youtube, Twitter, Music2, BadgeCheck } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const PLATFORM_ICON = {
  instagram: Instagram,
  youtube: Youtube,
  twitter: Twitter,
  tiktok: Music2,
} as const;

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

async function fetchCampaign(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = getDb();
  const [campaign] = await db
    .select()
    .from(schema.campaignsV2)
    .where(eq(schema.campaignsV2.id, id))
    .limit(1);
  return campaign ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const campaign = await fetchCampaign(params.id);
  if (!campaign) return { title: 'Campaign not found' };
  return {
    title: `${campaign.title} on DASHH`,
    description: campaign.description,
    openGraph: {
      title: campaign.title,
      description: campaign.description,
      images: campaign.iconUrl ? [campaign.iconUrl] : undefined,
    },
    robots: { index: false, follow: false },
  };
}

export default async function EmbedCampaign({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { accent?: string; hide?: string; theme?: string };
}) {
  const campaign = await fetchCampaign(params.id);
  if (!campaign) notFound();

  const accent = searchParams.accent?.match(/^[0-9a-fA-F]{6}$/)
    ? `#${searchParams.accent}`
    : '#14F195';
  const hide = (searchParams.hide ?? '').split(',').map((s) => s.trim());
  const light = searchParams.theme === 'light';

  const Icon =
    PLATFORM_ICON[campaign.platform as keyof typeof PLATFORM_ICON] ??
    Instagram;

  const endsAt = new Date(campaign.endsAt);
  const daysLeft = Math.max(
    0,
    Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  const platformFee = (campaign.platformFeeBps ?? 2000) / 10_000;
  const creatorPool = campaign.budget * (1 - platformFee);

  const target =
    process.env.NEXT_PUBLIC_APP_URL || 'https://dashhnew.vercel.app';
  const joinUrl = `${target}/discover?campaign=${campaign.id}`;

  return (
    <>
      {/* Hide global chrome — the iframe parent only wants the card. */}
      <style>{`
        body > nav,
        body > header,
        body > div.fixed,
        body > div[role="dialog"],
        body > .Toastify,
        body > [data-sonner-toaster],
        body > [data-radix-popper-content-wrapper] { display: none !important; }
        body { background: transparent !important; padding: 0 !important; margin: 0 !important; }
      `}</style>

      <div
        className={`mx-auto max-w-md overflow-hidden rounded-xl border ${
          light
            ? 'border-zinc-200 bg-white text-zinc-900'
            : 'border-white/10 bg-black/80 text-white'
        }`}
        style={{
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {!hide.includes('image') && campaign.iconUrl && (
          <div className="relative h-40 w-full">
            <Image
              src={campaign.iconUrl}
              alt={campaign.title}
              fill
              className="object-cover"
              sizes="400px"
            />
            <div
              className="absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs capitalize backdrop-blur"
              style={{
                background: light
                  ? 'rgba(255,255,255,0.9)'
                  : 'rgba(0,0,0,0.7)',
                color: light ? '#27272a' : 'white',
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {campaign.platform}
            </div>
          </div>
        )}

        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="m-0 text-base font-semibold leading-tight">
              {campaign.title}
            </h3>
            <span
              className={`whitespace-nowrap text-xs ${
                light ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              {daysLeft}d left
            </span>
          </div>

          {!hide.includes('description') && (
            <p
              className={`m-0 text-sm ${
                light ? 'text-zinc-600' : 'text-zinc-400'
              }`}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {campaign.description}
            </p>
          )}

          <div className="flex justify-between gap-2 pt-1 text-xs">
            <div>
              <p
                className={`m-0 uppercase tracking-wider ${
                  light ? 'text-zinc-500' : 'text-zinc-500'
                }`}
              >
                Creator pool
              </p>
              <p className="m-0 mt-0.5 text-sm font-semibold tabular-nums">
                {creatorPool.toFixed(2)} SOL
              </p>
            </div>
            <div className="text-right">
              <p
                className={`m-0 uppercase tracking-wider ${
                  light ? 'text-zinc-500' : 'text-zinc-500'
                }`}
              >
                Per verified view
              </p>
              <p className="m-0 mt-0.5 text-sm font-semibold tabular-nums">
                {campaign.cpv.toFixed(4)} SOL
              </p>
            </div>
          </div>

          <a
            href={joinUrl}
            target="_top"
            rel="noopener"
            className="block rounded-md py-2 text-center text-sm font-semibold"
            style={{
              background: `linear-gradient(90deg, #9945FF, ${accent})`,
              color: '#000',
            }}
          >
            Join on DASHH →
          </a>

          <div
            className={`flex items-center justify-center gap-1 text-[10px] ${
              light ? 'text-zinc-500' : 'text-zinc-500'
            }`}
          >
            <BadgeCheck className="h-3 w-3" />
            zkTLS-verified · on-chain settlement
          </div>
        </div>
      </div>
    </>
  );
}
