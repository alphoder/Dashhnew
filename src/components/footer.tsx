import Link from 'next/link';
import Image from 'next/image';
import { Github, Zap } from 'lucide-react';
import logo from '../images/whiteDASHH.png';

export default function Footer() {
  return (
    <footer className="w-full text-zinc-100 py-12 px-4 mt-16">
      <div className="container mx-auto border-t border-white/10 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand column */}
          <div className="space-y-4">
            <Image src={logo} alt="DASHH" width={56} height={56} />
            <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
              Peer-to-peer, zkTLS-verified engagement, settled on Solana. No
              middlemen, no admin, no fake views.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#14F195]/30 bg-[#14F195]/10 px-3 py-1 text-[11px] font-medium text-[#14F195]">
              <Zap className="h-3 w-3" />
              Live on Solana Devnet
            </div>
          </div>

          {/* Explore */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9945FF]">
              Explore
            </h3>
            <nav className="flex flex-col space-y-2 text-sm">
              <Link href="/discover" className="text-zinc-300 hover:text-white transition-colors">
                Discover campaigns
              </Link>
              <Link href="/leaderboard" className="text-zinc-300 hover:text-white transition-colors">
                Leaderboard
              </Link>
              <Link href="/dashboard" className="text-zinc-300 hover:text-white transition-colors">
                Creator dashboard
              </Link>
            </nav>
          </div>

          {/* Create */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#14F195]">
              Create
            </h3>
            <nav className="flex flex-col space-y-2 text-sm">
              <Link href="/form" className="text-zinc-300 hover:text-white transition-colors">
                Launch a campaign
              </Link>
              <Link href="/creatordashboard" className="text-zinc-300 hover:text-white transition-colors">
                Studio
              </Link>
              <Link href="/analytics" className="text-zinc-300 hover:text-white transition-colors">
                Analytics
              </Link>
            </nav>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
              Product
            </h3>
            <nav className="flex flex-col space-y-2 text-sm">
              <Link href="/how-it-works" className="text-zinc-300 hover:text-white transition-colors">
                How it works
              </Link>
              <Link href="/onboarding" className="text-zinc-300 hover:text-white transition-colors">
                Get started
              </Link>
              <Link href="/terms" className="text-zinc-300 hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/terms#ban" className="text-zinc-300 hover:text-white transition-colors">
                Ban policy
              </Link>
            </nav>
          </div>
        </div>

        {/* Copyright + socials */}
        <div className="flex flex-col-reverse gap-6 md:flex-row md:items-center md:justify-between pt-8 border-t border-white/10">
          <div>
            <p className="text-sm text-zinc-400">
              © 2026 DASHH · All rights reserved
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Illustrative figures. Not financial advice.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="https://twitter.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X / Twitter"
              className="h-9 w-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <svg className="h-4 w-4 fill-current" role="img" viewBox="0 0 24 24">
                <title>X</title>
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
              </svg>
            </Link>
            <Link
              href="https://discord.gg/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
              className="h-9 w-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a13.06 13.06 0 0 0-.617 1.27 18.27 18.27 0 0 0-5.878 0A13.06 13.06 0 0 0 9.446 3a19.79 19.79 0 0 0-3.76 1.369C2.25 9.095 1.349 13.705 1.8 18.246A19.85 19.85 0 0 0 7.91 21c.49-.66.927-1.36 1.3-2.1a12.88 12.88 0 0 1-2.05-.98c.173-.127.342-.258.505-.393a14.22 14.22 0 0 0 12.67 0c.164.135.332.266.505.393-.655.387-1.34.713-2.05.98.373.74.81 1.44 1.3 2.1a19.85 19.85 0 0 0 6.11-2.754c.525-5.293-.87-9.86-4.883-13.877ZM8.687 15.33c-1.178 0-2.14-1.085-2.14-2.417 0-1.333.95-2.418 2.14-2.418 1.19 0 2.152 1.085 2.14 2.418 0 1.332-.95 2.417-2.14 2.417Zm6.626 0c-1.178 0-2.14-1.085-2.14-2.417 0-1.333.95-2.418 2.14-2.418 1.19 0 2.152 1.085 2.14 2.418 0 1.332-.95 2.417-2.14 2.417Z" />
              </svg>
            </Link>
            <Link
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="h-9 w-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <Github className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Trust-signal strip */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-zinc-600">
          <span>Powered by Solana</span>
          <span className="hidden sm:inline">·</span>
          <span>Proofs by Reclaim Protocol</span>
          <span className="hidden sm:inline">·</span>
          <span>Permanence on Arweave</span>
        </div>
      </div>
    </footer>
  );
}
