import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/footer';
import {
  Mail,
  Twitter,
  Github,
  Wallet,
  MapPin,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Connect with DASHH',
  description:
    'Get in touch with the builder behind DASHH — grant reviewers, brands, creators, and Web3 builders all welcome.',
};

export default function ContactPage() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-32 md:px-6">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-widest text-[#14F195]">
            Connect with us
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Let&apos;s build the future of verified marketing together
          </h1>
          <p className="mt-4 max-w-2xl text-zinc-400">
            DASHH is built by one person — me, Vedant Singh. I read every
            message. If you&apos;re here to invest, partner, integrate, run
            a pilot campaign, or just say hello, pick a channel below.
          </p>
        </div>

        {/* Primary contact card — email is the main CTA */}
        <a
          href="mailto:vedant1609singh@gmail.com?subject=DASHH%20%E2%80%94%20"
          className="group mb-6 block rounded-2xl border border-[#14F195]/30 bg-gradient-to-br from-[#14F195]/10 to-black p-8 transition hover:border-[#14F195]/60"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-[#14F195]/20 p-3">
              <Mail className="h-6 w-6 text-[#14F195]" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#14F195]">
                Email — fastest reply
              </p>
              <p className="mt-1 text-xl font-bold text-white">
                vedant1609singh@gmail.com
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                Direct line to the builder. I typically reply within 24
                hours, faster on weekdays.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 flex-shrink-0 text-zinc-400 transition group-hover:translate-x-1 group-hover:text-[#14F195]" />
          </div>
        </a>

        {/* Secondary channels grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="https://x.com/dashhhee"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-white/10 bg-black/40 p-5 transition hover:border-white/30 hover:bg-black/60"
          >
            <Twitter className="mb-3 h-5 w-5 text-[#14F195]" />
            <p className="text-sm font-semibold text-white">Twitter / X</p>
            <p className="mt-0.5 text-xs text-zinc-400">@dashhhee</p>
            <p className="mt-2 text-xs text-zinc-500">
              Build-in-public updates, demos, grant + bounty wins.
            </p>
          </a>

          <a
            href="https://github.com/alphoder/Dashhnew"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-white/10 bg-black/40 p-5 transition hover:border-white/30 hover:bg-black/60"
          >
            <Github className="mb-3 h-5 w-5 text-[#14F195]" />
            <p className="text-sm font-semibold text-white">GitHub</p>
            <p className="mt-0.5 text-xs text-zinc-400">
              alphoder/Dashhnew (private)
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Source code (invite-only). Request access via email.
            </p>
          </a>

          <div className="group rounded-xl border border-white/10 bg-black/40 p-5">
            <Wallet className="mb-3 h-5 w-5 text-[#9945FF]" />
            <p className="text-sm font-semibold text-white">
              Solana wallet
            </p>
            <p className="mt-0.5 break-all font-mono text-[10px] text-zinc-400">
              7ZyHfVPKqQN67LtQ6Drr1WhLfpYwbmAzQ5v8xpsAvqve
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Grant and bounty USDC payouts go here. Verify on{' '}
              <a
                href="https://explorer.solana.com/address/7ZyHfVPKqQN67LtQ6Drr1WhLfpYwbmAzQ5v8xpsAvqve?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#14F195] underline"
              >
                Solana Explorer
              </a>
              .
            </p>
          </div>

          <div className="group rounded-xl border border-white/10 bg-black/40 p-5">
            <MapPin className="mb-3 h-5 w-5 text-[#9945FF]" />
            <p className="text-sm font-semibold text-white">Based in</p>
            <p className="mt-0.5 text-xs text-zinc-400">Indore, India</p>
            <p className="mt-2 text-xs text-zinc-500">
              UTC+5:30 — meetings 8 AM to 11 PM IST.
            </p>
          </div>
        </div>

        {/* What I'm looking for */}
        <div className="mt-12 rounded-2xl border border-[#9945FF]/20 bg-gradient-to-br from-[#9945FF]/5 to-black p-6">
          <div className="mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#9945FF]" />
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9945FF]">
              What I&apos;m especially interested in
            </p>
          </div>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li className="flex gap-2">
              <span className="text-[#14F195]">→</span>
              <span>
                <strong className="text-white">Brands</strong> running
                influencer campaigns who want to pilot DASHH on a 0.5–2
                SOL budget. First 5 design partners get zero platform fee.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#14F195]">→</span>
              <span>
                <strong className="text-white">Micro-influencers</strong>{' '}
                (1k–50k followers) on Instagram, YouTube, X, or TikTok
                who want to test crypto payouts.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#14F195]">→</span>
              <span>
                <strong className="text-white">Grant programs +
                investors</strong> in the Solana + Reclaim + creator-economy
                space. Live demo + working code beats every deck.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#14F195]">→</span>
              <span>
                <strong className="text-white">Builders</strong> who want
                to integrate DASHH (an embeddable campaign widget is live
                at <code>/embed/campaign/[id]</code>).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#14F195]">→</span>
              <span>
                <strong className="text-white">Indian Web3 community
                members</strong> — Superteam India, Solana India, Buidlers
                Tribe folks. Always up for chai + roadmap chat in Indore.
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-white"
          >
            ← Back to dashhnew.vercel.app
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
