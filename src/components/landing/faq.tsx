'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FadeIn } from '@/components/motion/fade-in';

type QA = {
  q: string;
  a: React.ReactNode;
};

const QAS: QA[] = [
  {
    q: 'Why Solana, and not Ethereum or Base?',
    a: (
      <>
        Three reasons. First, gas: a Solana transaction settles in ~0.4 seconds
        for less than $0.001, so a 0.001 SOL payout to a creator isn’t
        immediately eaten by fees. Second, throughput: ~65,000 transactions per
        second comfortably handles every campaign settling at once. Third,
        Reclaim Protocol has first-class Solana support — the verifier
        signatures and on-chain anchors all live on the same chain as the
        escrow.
      </>
    ),
  },
  {
    q: 'How exactly does zkTLS stop fake views?',
    a: (
      <>
        A regular screenshot can be faked in 30 seconds. zkTLS can’t. When a
        creator scans the Reclaim QR, their phone connects to Instagram (or
        YouTube, X, TikTok) over the platform’s real TLS channel. The Reclaim
        attestor sees that traffic, generates a zero-knowledge proof that the
        platform itself returned a page showing N views, and signs it. We
        verify the signature on our server. Forging this requires either
        compromising the platform’s TLS key or the Reclaim attestor — neither
        of which is feasible without massive resources.
      </>
    ),
  },
  {
    q: 'What happens if my campaign gets zero creators?',
    a: (
      <>
        Your entire escrow returns to your wallet automatically. After the
        campaign’s end date plus the 7-day final-proof window, the settlement
        runner checks the participation table. If no creator settled, the full
        budget is refunded on-chain back to the brand wallet. You can also
        claim early via the Cancel button (before any creator joins) or the
        Refund button (after the window closes).
      </>
    ),
  },
  {
    q: 'Is this on Solana mainnet or devnet?',
    a: (
      <>
        Currently <strong>devnet</strong> — Solana’s test network. All escrows
        and payouts are real on-chain transactions, but the SOL has no
        monetary value. Brands and creators can run the full flow without
        spending real money. Mainnet launch is gated on three things: an
        audited Anchor escrow program, multi-sig of the platform wallet, and
        KYB onboarding for high-volume brands. See the production roadmap in
        the repo for the exact checklist.
      </>
    ),
  },
  {
    q: 'How much SOL do I need to launch a campaign?',
    a: (
      <>
        On devnet: nothing of value — airdrops are free at{' '}
        <a
          href="https://faucet.solana.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#14F195] underline"
        >
          faucet.solana.com
        </a>
        . Minimum campaign budget is 0.01 SOL. On mainnet (future), realistic
        small campaigns start around 0.5 SOL (~$100) — enough to pay 100
        creators 1 cent per verified view.
      </>
    ),
  },
  {
    q: 'What if a creator games the system?',
    a: (
      <>
        Every proof runs through a 13-rule disqualification pipeline before
        any payout. Rules include: caption doesn’t reference the campaign,
        view-bot velocity signatures, deleted-post detection, account-handle
        mismatch between Join and Final proofs, duplicate proofs across
        campaigns, banned-phrase engagement farming, and more. Three
        disqualifications inside 90 days triggers an automatic 90-day wallet
        ban. No human is in the loop.
      </>
    ),
  },
  {
    q: 'Can I cancel a campaign after creators have joined?',
    a: (
      <>
        No — and that’s by design. When a brand creates a campaign, the
        signed-terms message commits to the payment model. Letting brands
        cancel after creators have invested content-creation time would break
        the trust contract. Cancellation is only available with zero
        participants. After creators join, the campaign runs its course; if
        nobody submits a final proof, the brand still gets a full refund.
      </>
    ),
  },
  {
    q: 'How are creators verified before joining?',
    a: (
      <>
        At join time, the creator’s wallet signs a creator-side terms message
        (covering disqualification rules, the 3-strike ban policy, content
        guidelines). The wallet itself is the identity — no email, no phone,
        no KYC for small participation. At Join Proof, their social-platform
        handle is anchored to their wallet via zkTLS. If they switch handles
        before Final Proof, it’s an automatic disqualification.
      </>
    ),
  },
  {
    q: 'Where is my data?',
    a: (
      <>
        Three places. Campaign metadata + participation records live in our
        Neon Postgres database. Every verified proof is anchored to Arweave
        (permanent decentralised storage) — anyone can audit a proof’s
        existence forever. All on-chain transactions (escrow, payouts) live on
        the Solana blockchain. We don’t store passwords, emails, phone
        numbers, or platform credentials — there’s nothing to leak.
      </>
    ),
  },
  {
    q: 'Is DASHH open source?',
    a: (
      <>
        Yes. The full repo is on GitHub at{' '}
        <a
          href="https://github.com/alphoder/Dashhnew"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#14F195] underline"
        >
          alphoder/Dashhnew
        </a>
        . The Anchor escrow program (when it ships) will also be open source
        and verifiable byte-for-byte against the deployed bytecode on Solana.
      </>
    ),
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative w-full border-t border-white/5 py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <FadeIn className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#14F195]">
            Frequently asked
          </p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Everything you’re probably wondering
          </h2>
        </FadeIn>

        <FadeIn>
          <div className="space-y-2">
            {QAS.map((qa, i) => {
              const open = openIndex === i;
              return (
                <div
                  key={qa.q}
                  className={`overflow-hidden rounded-xl border transition-colors ${
                    open
                      ? 'border-[#14F195]/30 bg-gradient-to-br from-[#14F195]/5 to-black'
                      : 'border-white/10 bg-black/40 hover:border-white/20'
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  >
                    <span className="text-base font-medium text-white">
                      {qa.q}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 flex-shrink-0 text-zinc-400 transition-transform ${
                        open ? 'rotate-180 text-[#14F195]' : ''
                      }`}
                    />
                  </button>
                  {open && (
                    <div className="border-t border-white/10 px-5 py-4 text-sm leading-relaxed text-zinc-300">
                      {qa.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
