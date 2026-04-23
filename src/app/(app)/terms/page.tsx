import { BackBar } from '@/components/back-bar';
import {
  TERMS_BODY,
  TERMS_VERSION,
  CREATOR_TERMS_BODY,
  CREATOR_TERMS_VERSION,
  PLATFORM_FEE_PERCENT,
  DISQUALIFICATION_REASONS,
  BAN_POLICY,
} from '@/lib/terms';
import { ScrollText, ShieldAlert, Sparkles, Ban } from 'lucide-react';

export const metadata = { title: 'Terms — DASHH' };

export default function TermsPage() {
  return (
    <>
      <BackBar crumbs={[{ label: 'Terms & Conditions' }]} backHref="/" />

      <div className="relative mb-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 to-zinc-900/60 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#9945FF]/20 to-[#14F195]/20 p-3 ring-1 ring-white/10">
            <ScrollText className="h-6 w-6 text-[#14F195]" />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#14F195]">
              Brand {TERMS_VERSION} · Creator {CREATOR_TERMS_VERSION}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Terms &amp; Conditions
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-300">
              DASHH is peer-to-peer: no admin override, no arbitrator. Every
              brand signs the Brand terms at campaign creation; every creator
              signs the Creator terms before joining a campaign. Platform fee:{' '}
              <span className="font-semibold text-[#14F195]">
                {PLATFORM_FEE_PERCENT}%
              </span>
              .
            </p>
          </div>
        </div>
      </div>

      <section id="brand" className="mb-8 scroll-mt-24">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#9945FF]" />
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
            Brand terms
          </h2>
          <span className="text-[11px] text-zinc-500">
            Signed on campaign creation
          </span>
        </div>
        <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-6 font-mono text-[13px] leading-relaxed text-zinc-300">
{TERMS_BODY}
        </pre>
      </section>

      <section id="creator" className="mb-8 scroll-mt-24">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#14F195]" />
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
            Creator terms
          </h2>
          <span className="text-[11px] text-zinc-500">
            Signed once per campaign on join
          </span>
        </div>
        <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-6 font-mono text-[13px] leading-relaxed text-zinc-300">
{CREATOR_TERMS_BODY}
        </pre>
      </section>

      <section id="disqualification" className="mb-8 scroll-mt-24">
        <div className="mb-3 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-400" />
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
            Disqualification grounds
          </h2>
          <span className="text-[11px] text-zinc-500">
            {DISQUALIFICATION_REASONS.length} offences
          </span>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-red-200">
            {DISQUALIFICATION_REASONS.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-zinc-400">
            Disqualifications are triggered automatically by failed Reclaim
            proofs, ownership mismatches, post-age checks, or velocity
            heuristics. A disqualified creator forfeits any pending payout on
            the offending campaign and takes a reputation hit. Three
            disqualifications inside 90 days = permanent ban (see below).
          </p>
        </div>
      </section>

      <section id="ban" className="scroll-mt-24">
        <div className="mb-3 flex items-center gap-2">
          <Ban className="h-4 w-4 text-red-500" />
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
            Ban policy
          </h2>
          <span className="text-[11px] text-zinc-500">Enforced on-chain</span>
        </div>
        <pre className="whitespace-pre-wrap rounded-xl border border-red-500/30 bg-red-950/30 p-6 font-mono text-[13px] leading-relaxed text-red-100/90">
{BAN_POLICY}
        </pre>
      </section>
    </>
  );
}
