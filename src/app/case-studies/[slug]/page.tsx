import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/footer';
import { CASE_STUDIES, findCaseStudy } from '@/content/case-studies';
import {
  BadgeCheck,
  ArrowRight,
  Eye,
  Users,
  Coins,
  ShieldX,
  ExternalLink,
} from 'lucide-react';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, inArray } from 'drizzle-orm';
import * as schema from '@/lib/db/schemas';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return CASE_STUDIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const study = findCaseStudy(params.slug);
  if (!study) return { title: 'Case study not found' };
  return {
    title: `${study.brandName} case study`,
    description: study.hero.subtitle,
    openGraph: {
      title: study.hero.title,
      description: study.hero.subtitle,
    },
  };
}

/**
 * Pull live numbers for a campaign id. Returns null if id is missing or the
 * DB lookup fails — caller falls back to staticStats.
 */
async function fetchLiveStats(campaignId?: string) {
  if (!campaignId) return null;
  try {
    const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
    const [campaign] = await db
      .select()
      .from(schema.campaignsV2)
      .where(eq(schema.campaignsV2.id, campaignId))
      .limit(1);
    if (!campaign) return null;

    const parts = await db
      .select()
      .from(schema.participations)
      .where(eq(schema.participations.campaignId, campaignId));
    const partIds = parts.map((p) => p.id);
    if (partIds.length === 0) {
      return {
        verifiedViews: 0,
        creatorCount: 0,
        paidOutSol: 0,
        disqualifiedCount: 0,
        cpvActual: 0,
      };
    }

    const proofs = await db
      .select()
      .from(schema.proofs)
      .where(inArray(schema.proofs.participationId, partIds));
    const verifiedProofs = proofs.filter((p) => p.status === 'verified');
    const rejectedProofs = proofs.filter((p) => p.status === 'rejected');

    const proofIds = proofs.map((p) => p.id);
    const payouts =
      proofIds.length > 0
        ? await db
            .select()
            .from(schema.payouts)
            .where(inArray(schema.payouts.proofId, proofIds))
        : [];
    const paid = payouts
      .filter((p) => p.status === 'paid')
      .reduce((s, p) => s + (p.amount ?? 0), 0);

    const verifiedViews = verifiedProofs.reduce(
      (s, p) => s + (p.verifiedViews ?? 0),
      0,
    );

    return {
      verifiedViews,
      creatorCount: new Set(parts.map((p) => p.creatorWallet)).size,
      paidOutSol: paid,
      disqualifiedCount: rejectedProofs.length,
      cpvActual: verifiedViews > 0 ? paid / verifiedViews : 0,
    };
  } catch (err) {
    console.error('[case-study] live fetch failed', err);
    return null;
  }
}

export default async function CaseStudyPage({
  params,
}: {
  params: { slug: string };
}) {
  const study = findCaseStudy(params.slug);
  if (!study) notFound();

  // Prefer live numbers from the DB; fall back to staticStats authored in
  // src/content/case-studies.ts when no campaign id is set / DB unreachable.
  const live = await fetchLiveStats(study.campaignId);
  const stats = live ?? study.staticStats;
  const isLive = !!live;

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-32 text-zinc-300 md:px-6">
        <Link
          href="/case-studies"
          className="mb-6 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
        >
          ← All case studies
        </Link>

        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#14F195]/30 bg-[#14F195]/10 px-3 py-1 text-[10px] uppercase tracking-wider text-[#14F195]">
            <BadgeCheck className="h-3 w-3" />
            {study.brandName} · {study.platform}
            {isLive && <span className="text-zinc-400">· live data</span>}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {study.hero.title}
          </h1>
          <p className="mt-3 text-base text-zinc-400">{study.hero.subtitle}</p>
        </div>

        {/* Live numbers strip */}
        {stats && (
          <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              icon={Eye}
              label="Verified views"
              value={stats.verifiedViews.toLocaleString()}
            />
            <Stat
              icon={Users}
              label="Paid creators"
              value={stats.creatorCount.toString()}
            />
            <Stat
              icon={Coins}
              label="SOL paid out"
              value={stats.paidOutSol.toFixed(3)}
            />
            <Stat
              icon={ShieldX}
              label="Disqualified"
              value={stats.disqualifiedCount.toString()}
            />
          </div>
        )}

        {/* Body — markdown-style sections */}
        <article className="prose prose-invert max-w-none text-sm leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_p]:my-3">
          {study.sections.map((section) => (
            <div key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </div>
          ))}
        </article>

        {/* Pull quote */}
        {study.pullQuote && (
          <blockquote className="my-10 border-l-4 border-[#14F195] bg-[#14F195]/5 px-6 py-5">
            <p className="text-lg italic text-white">
              “{study.pullQuote.quote}”
            </p>
            <footer className="mt-3 text-xs text-zinc-400">
              — {study.pullQuote.speaker}
              {study.pullQuote.role && (
                <span className="text-zinc-500"> · {study.pullQuote.role}</span>
              )}
            </footer>
          </blockquote>
        )}

        {/* Replicate CTA */}
        <div className="mt-12 rounded-xl border border-[#9945FF]/30 bg-gradient-to-br from-[#9945FF]/10 to-black p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9945FF]">
            Want similar results?
          </p>
          <h3 className="mt-1 text-xl font-bold text-white">
            Run your own {study.platform} campaign in 4 minutes
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            We&apos;ll pre-fill the form with the same template{' '}
            {study.brandName} used.
          </p>
          <Link
            href={`/form${study.templateCta ? `?template=${study.templateCta}` : ''}`}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-[#9945FF] to-[#14F195] px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
          >
            Launch a campaign
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {study.campaignId && (
          <p className="mt-6 text-center text-[11px] text-zinc-600">
            Campaign id:{' '}
            <code className="rounded bg-white/5 px-1.5 py-0.5">
              {study.campaignId}
            </code>
            <a
              href={`/discover?campaign=${study.campaignId}`}
              className="ml-2 inline-flex items-center gap-0.5 text-[#14F195] hover:underline"
            >
              View live <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
      <Icon className="mb-2 h-4 w-4 text-[#14F195]" />
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </p>
    </div>
  );
}
