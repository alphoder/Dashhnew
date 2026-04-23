import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/footer';
import logo from '@/images/whiteDASHH.png';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion/fade-in';
import { HoverLift } from '@/components/motion/hover-lift';
import {
  Rocket,
  Compass,
  ShieldCheck,
  Coins,
  FileSignature,
  Zap,
  Megaphone,
  Trophy,
  Hourglass,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Eye,
  Sparkles,
  Ban,
  RefreshCw,
} from 'lucide-react';

export const metadata = {
  title: 'How it works — DASHH',
  description: 'The full flow: from campaign launch to cryptographic payout.',
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen text-white">
      {/* Simple top bar */}
      <div className="sticky top-0 z-20 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src={logo} alt="DASHH" width={36} height={36} />
            <span className="text-sm font-semibold tracking-wide">DASHH</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/discover"
              className="hidden sm:inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10"
            >
              Browse campaigns
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Get Started
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative mx-auto max-w-5xl px-4 pt-16 pb-10 md:px-6 md:pt-24">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#9945FF] opacity-20 blur-3xl" />
        <div className="absolute -right-20 top-0 h-64 w-64 rounded-full bg-[#14F195] opacity-20 blur-3xl" />
        <div className="relative">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#14F195]">
            How DASHH works
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            <span className="bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
              Two proofs.
            </span>{' '}
            One payout.
            <br />
            Zero fakes.
          </h1>
          <p className="mt-5 max-w-2xl text-base md:text-lg text-zinc-300 leading-relaxed">
            Brands fund campaigns in a Solana escrow. Creators submit two
            cryptographic proofs of engagement — one at the start, one after
            the campaign ends. Only the second proof, after the platform's own
            bot-cleanup has run, triggers the on-chain payout. There's no
            admin, no middleman, and fake views never reach the money.
          </p>
        </div>
      </section>

      {/* TL;DR cards */}
      <section className="mx-auto max-w-5xl px-4 md:px-6 pb-12">
        <Stagger className="grid gap-4 sm:grid-cols-3">
          <TldrCard
            icon={FileSignature}
            tint="text-[#9945FF]"
            title="Signed terms"
            body="Every brand signs a 20% platform fee + payout model. Every creator signs a 13-point honesty pledge before joining."
          />
          <TldrCard
            icon={ShieldCheck}
            tint="text-[#14F195]"
            title="zkTLS proofs"
            body="Reclaim Protocol cryptographically proves real views came from the real platform. Credentials never leak."
          />
          <TldrCard
            icon={Coins}
            tint="text-[#14F195]"
            title="Solana escrow"
            body="Budget is locked on-chain. Payouts auto-release per the payment model at the end of a 7-day settlement window."
          />
        </Stagger>
      </section>

      {/* Timeline — the heart of the page */}
      <section className="mx-auto max-w-5xl px-4 md:px-6 pb-16">
        <FadeIn>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#14F195]">
            The timeline
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            A campaign, end to end
          </h2>
        </FadeIn>

        {/* Brand row */}
        <FadeIn delay={0.05} className="mt-8 rounded-2xl border border-[#9945FF]/30 bg-gradient-to-br from-[#9945FF]/10 via-black to-black p-6 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-lg bg-[#9945FF]/20 p-2 ring-1 ring-[#9945FF]/40">
              <Megaphone className="h-4 w-4 text-[#9945FF]" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9945FF]">
              Brand path
            </p>
          </div>
          <Stagger className="grid gap-4 md:grid-cols-4" stagger={0.08}>
            <Step n={1} title="Create" body="Fill title, image, description, budget, CPV, end date. Add content-match rules (hashtag, mention, phrase)." />
            <Step n={2} title="Sign" body="Pick a payment model. Phantom signs a plain-English terms message acknowledging the 20% fee." />
            <Step n={3} title="Fund" body="Second Phantom popup deposits the budget into the campaign's Solana escrow." />
            <Step n={4} title="Share" body="Get a dial.to Blink URL. Share it anywhere — creators can join in one click." />
          </Stagger>
        </FadeIn>

        {/* Creator row */}
        <FadeIn delay={0.1} className="mt-6 rounded-2xl border border-[#14F195]/30 bg-gradient-to-br from-[#14F195]/10 via-black to-black p-6 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-lg bg-[#14F195]/20 p-2 ring-1 ring-[#14F195]/40">
              <Sparkles className="h-4 w-4 text-[#14F195]" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#14F195]">
              Creator path
            </p>
          </div>
          <Stagger className="grid gap-4 md:grid-cols-5" stagger={0.08}>
            <Step n={1} title="Browse" body="Open /discover. See full campaign details — payment model, creator pool, terms — before you commit." />
            <Step n={2} title="Sign & join" body="Tick the creator T&C, sign the join message in Phantom. Acknowledge the 13 disqualification rules." />
            <Step n={3} title="Post" body="Create the content on your real social account with the required hashtag/mention/phrase." />
            <Step n={4} title="Join proof" body="Open /verifyClaim → run Reclaim. A zkTLS proof anchors your ownership + baseline views." />
            <Step n={5} title="Final proof" body="Campaign ends → 7-day settlement window opens. Run Reclaim once more. Payout fires on-chain." />
          </Stagger>
        </FadeIn>
      </section>

      {/* The big visual */}
      <section className="mx-auto max-w-5xl px-4 md:px-6 pb-20">
        <div className="rounded-2xl border border-white/10 bg-black/60 p-6 md:p-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
            What happens when
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Dual timeline
          </h2>

          <div className="mt-8 space-y-8">
            {/* Active window */}
            <TimelineBlock
              label="Active window"
              sub="Between startsAt and endsAt"
              accent="from-[#9945FF]/30 via-black to-black"
              border="border-[#9945FF]/30"
            >
              <TimelineItem icon={Rocket} title="Brand funds escrow" body="Budget locked. Campaign becomes visible in /discover." />
              <TimelineItem icon={Eye} title="Creator joins + posts content" body="Creator signs T&C, posts content, submits Proof #1 (join)." />
              <TimelineItem icon={RefreshCw} title="Public-API polling (display only)" body="Every 30 min we pull the public view counter. No payment yet — just UI nudges." />
            </TimelineBlock>

            {/* Settlement window */}
            <TimelineBlock
              label="Settlement window"
              sub="7 days after endsAt"
              accent="from-[#14F195]/30 via-black to-black"
              border="border-[#14F195]/30"
            >
              <TimelineItem icon={Hourglass} title="Creators return for Proof #2" body="Platforms have rolled back any bot views by now. Final proof captures the stable number." />
              <TimelineItem icon={CheckCircle2} title="Honest creators get paid" body="Per-view: instant delta payout. Pool models: calculated at settlement." />
              <TimelineItem icon={XCircle} title="No-shows forfeit" body="Miss the 7-day window → payout voided. Funds redistribute or return to brand." />
            </TimelineBlock>

            {/* Post-settlement */}
            <TimelineBlock
              label="Settled"
              sub="After the settle cron closes the campaign"
              accent="from-zinc-500/20 via-black to-black"
              border="border-white/10"
            >
              <TimelineItem icon={Trophy} title="Leaderboard updated" body="Verified views and earnings flow into the global and per-campaign leaderboards." />
              <TimelineItem icon={ShieldCheck} title="Proofs anchored on Arweave" body="Every verified proof is permanently public. Bans and disqualifications are auditable forever." />
            </TimelineBlock>
          </div>
        </div>
      </section>

      {/* The trust defence in plain language */}
      <section className="mx-auto max-w-5xl px-4 md:px-6 pb-20">
        <FadeIn>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#14F195]">
            Why you can't cheat this
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Every fake-out, and how it dies
          </h2>
        </FadeIn>

        <Stagger className="mt-8 grid gap-4 md:grid-cols-2" stagger={0.07}>
          <TrustCard
            title="Submit someone else's video"
            catch="Rejected at Proof #1 (severe)"
            body="The adapter extracts `ownerHandle` from the proof. If it doesn't match the session user, it's a severe offence → instant ban."
          />
          <TrustCard
            title="Resubmit an old viral post"
            catch="Rejected at Proof #1"
            body="`postCreatedAt` in the proof must be after `campaign.startsAt`. Old posts don't qualify."
          />
          <TrustCard
            title="Post unrelated content"
            catch="Rejected at Proof #1"
            body="Brands set required hashtag / mention / phrase. Missing them fails the content-match check."
          />
          <TrustCard
            title="Buy 10k bot views"
            catch="Fails at Proof #2"
            body="Platforms roll back bot views within days. Your final proof captures a much lower number — or worse, you can't even match the join baseline."
          />
          <TrustCard
            title="Use multiple wallets + handles"
            catch="Rejected at Proof #1"
            body="The authenticated handle in the proof must match the handle you declared at onboarding. Sybils self-expose."
          />
          <TrustCard
            title="Skip Proof #2 to avoid the bot-drop"
            catch="Automatic forfeit"
            body="Miss the 7-day settlement window and the payout is void. Funds redistribute to honest creators or return to the brand."
          />
          <TrustCard
            title="Dispute a payout after settlement"
            catch="Impossible"
            body="Solana transactions are final. Disputes must happen before settlement, so payouts only fire on cryptographically-stable proofs."
          />
          <TrustCard
            title="Repeat all of the above"
            catch="Permanent ban"
            body="Three disqualifications in 90 days, or a single severe offence, flips `banned=true`. Banned wallets can't create, join, or submit proofs."
          />
        </Stagger>
      </section>

      {/* Payment models */}
      <section className="mx-auto max-w-5xl px-4 md:px-6 pb-20">
        <FadeIn>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#14F195]">
            Payment models
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Brands pick how creators split the pool
          </h2>
        </FadeIn>
        <p className="mt-3 max-w-2xl text-sm text-zinc-400">
          The platform always keeps a flat 20% fee. The remaining 80% — the
          creator pool — is distributed by one of four rules:
        </p>
        <Stagger className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
          <ModelCard
            name="Per verified view"
            body="Every verified view pays CPV SOL up to the budget. Classic, predictable."
          />
          <ModelCard
            name="Winner takes all"
            body="Top-viewed creator gets the whole creator pool at campaign end."
          />
          <ModelCard
            name="Split across top N"
            body="Top N creators split the creator pool equally. Brand picks N at creation."
          />
          <ModelCard
            name="Equal split"
            body="Every creator with a valid final proof gets an equal share. Participation-first."
          />
        </Stagger>
      </section>

      {/* Ban section */}
      <section className="mx-auto max-w-5xl px-4 md:px-6 pb-20">
        <FadeIn y={32} className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-red-500/20 p-3 ring-1 ring-red-500/40">
              <Ban className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-red-300">
                Consequences
              </p>
              <h2 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight">
                Bans are automatic and peer-to-peer
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-zinc-300">
                DASHH has no admin panel. Three disqualifications in 90 days,
                or a single severe offence (impersonation, coordinated fraud,
                proven bot ring), flips the wallet's <code>banned</code> flag.
                Banned wallets lose pending payouts, reputation, and the
                ability to create campaigns, join campaigns, or submit proofs.
                Every disqualification is anchored to Arweave — publicly
                auditable forever.
              </p>
              <Link
                href="/terms#ban"
                className="mt-4 inline-flex items-center gap-2 text-sm text-[#14F195] underline hover:text-white"
              >
                Full ban policy
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-4xl px-4 md:px-6 pb-24">
        <FadeIn y={32} duration={0.8} className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#9945FF]/10 via-black to-[#14F195]/10 p-10 text-center md:p-14">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#9945FF] opacity-20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#14F195] opacity-20 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ready to participate?
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-zinc-300">
              Four steps to onboard. Two proofs per campaign. Zero middlemen.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-[#9945FF]/30 transition hover:opacity-90"
              >
                Start onboarding
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10"
              >
                Browse campaigns
              </Link>
              <Link
                href="/terms"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-transparent px-6 py-3 text-sm text-zinc-300 hover:bg-white/5"
              >
                Read the terms
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      <Footer />
    </main>
  );
}

function TldrCard({
  icon: Icon,
  tint,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  title: string;
  body: string;
}) {
  return (
    <StaggerItem>
      <HoverLift className="h-full">
        <div className="h-full rounded-xl border border-white/10 bg-gradient-to-br from-black/60 to-zinc-900/60 p-5">
          <div className="mb-3 inline-flex rounded-lg bg-gradient-to-br from-[#9945FF]/20 to-[#14F195]/20 p-2">
            <Icon className={`h-5 w-5 ${tint}`} />
          </div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{body}</p>
        </div>
      </HoverLift>
    </StaggerItem>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <StaggerItem>
      <HoverLift className="h-full">
        <li className="relative h-full rounded-xl border border-white/10 bg-black/40 p-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Step {n}
          </span>
          <p className="mt-1 text-base font-semibold text-white">{title}</p>
          <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{body}</p>
        </li>
      </HoverLift>
    </StaggerItem>
  );
}

function TimelineBlock({
  label,
  sub,
  accent,
  border,
  children,
}: {
  label: string;
  sub: string;
  accent: string;
  border: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border ${border} bg-gradient-to-br ${accent} p-5 md:p-6`}>
      <div className="mb-4 flex items-baseline gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white">
          {label}
        </p>
        <p className="text-xs text-zinc-500">{sub}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">{children}</div>
    </div>
  );
}

function TimelineItem({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-black/40 p-4">
      <Icon className="mb-2 h-4 w-4 text-[#14F195]" />
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
}

function TrustCard({
  title,
  catch: catchText,
  body,
}: {
  title: string;
  catch: string;
  body: string;
}) {
  return (
    <StaggerItem>
      <HoverLift className="h-full">
        <div className="h-full rounded-xl border border-white/10 bg-black/40 p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-white">{title}</p>
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-300 flex-shrink-0">
              {catchText}
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{body}</p>
        </div>
      </HoverLift>
    </StaggerItem>
  );
}

function ModelCard({ name, body }: { name: string; body: string }) {
  return (
    <StaggerItem>
      <HoverLift className="h-full">
        <div className="h-full rounded-xl border border-white/10 bg-gradient-to-br from-black/60 to-zinc-900/60 p-5">
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{body}</p>
        </div>
      </HoverLift>
    </StaggerItem>
  );
}
