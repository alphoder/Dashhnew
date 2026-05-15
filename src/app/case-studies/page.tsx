import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/footer';
import { CASE_STUDIES } from '@/content/case-studies';
import { ArrowRight, BadgeCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Case studies',
  description:
    'Real DASHH campaigns, broken down: what the brand spent, what creators earned, and what the 13-rule pipeline caught along the way.',
};

export default function CaseStudiesIndex() {
  return (
    <>
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-32 md:px-6">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs uppercase tracking-widest text-[#14F195]">
            Case studies
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Real campaigns, real numbers
          </h1>
          <p className="mt-3 text-zinc-400">
            Each case study breaks down a finished DASHH campaign — what the
            brand spent, what creators earned, and what the disqualification
            pipeline caught.
          </p>
        </div>

        {CASE_STUDIES.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/30 p-10 text-center text-zinc-400">
            No case studies published yet — check back as campaigns settle.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {CASE_STUDIES.map((c) => (
              <Link
                key={c.slug}
                href={`/case-studies/${c.slug}`}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-6 transition-colors hover:border-white/30 hover:bg-black/60"
              >
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#14F195]/30 bg-[#14F195]/10 px-3 py-1 text-[10px] uppercase tracking-wider text-[#14F195]">
                  <BadgeCheck className="h-3 w-3" />
                  {c.brandName} · {c.platform}
                </div>
                <h2 className="text-xl font-semibold text-white">
                  {c.hero.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-zinc-400">
                  {c.hero.subtitle}
                </p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm text-[#14F195] opacity-80 group-hover:opacity-100">
                  Read the breakdown
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
