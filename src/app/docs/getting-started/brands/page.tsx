import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Getting started for brands' };

export default function BrandsGettingStarted() {
  return (
    <>
      <h1>Getting started — for brands</h1>
      <p>
        You&apos;re a brand looking to run an influencer campaign without
        paying for fake views. Here&apos;s the full flow, end to end.
      </p>

      <h2>Prerequisites</h2>
      <ul>
        <li>
          A Solana wallet — <a href="https://phantom.com" target="_blank" rel="noopener noreferrer">Phantom</a> is what we test against.
        </li>
        <li>
          Some SOL — on Devnet (testing), grab it free from{' '}
          <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer">faucet.solana.com</a>. Mainnet
          launch will require buying SOL from an exchange.
        </li>
      </ul>

      <h2>Step 1 — Connect &amp; pick a template</h2>
      <p>
        Click <strong>Get Started</strong> on the landing page or go straight
        to <Link href="/form">/form</Link>. Approve the Phantom connect prompt
        (one click; no signature yet). Pick a template — Instagram Reel,
        YouTube Short, X Thread, or TikTok GRWM — and the form pre-fills
        sensible defaults.
      </p>

      <h2>Step 2 — Fill in details</h2>
      <p>The fields that matter:</p>
      <ul>
        <li>
          <strong>Title &amp; description</strong> — what creators see on
          Discover.
        </li>
        <li>
          <strong>Platform</strong> — locks which Reclaim provider the
          creator&apos;s proof will use.
        </li>
        <li>
          <strong>Budget</strong> — total SOL you&apos;ll escrow. Includes the
          20% platform fee.
        </li>
        <li>
          <strong>Payment model</strong> — see{' '}
          <Link href="/docs/concepts/payment-models">the four models</Link>.
          Defaults to per-view.
        </li>
        <li>
          <strong>Required hashtag / mention / phrase</strong> — content
          markers the creator&apos;s post MUST include. Missing markers =
          disqualification.
        </li>
      </ul>

      <h2>Step 3 — Sign the terms</h2>
      <p>
        Phantom pops up a Terms message to sign. The signed message is stored
        with the campaign and binds you to the payment model + fee for this
        campaign. You can&apos;t change them after — that&apos;s by design.
      </p>

      <h2>Step 4 — Fund the escrow</h2>
      <p>
        Phantom pops up a second prompt — the actual SOL transfer into the
        platform recipient wallet. (In future this becomes a PDA-owned Anchor
        escrow program; see the production roadmap.)
      </p>

      <h2>Step 5 — Wait, monitor, adjust</h2>
      <p>
        Your campaign is now live on{' '}
        <Link href="/discover">/discover</Link>. Creators can join. Two things
        you can do as the brand:
      </p>
      <ul>
        <li>
          <strong>Cancel</strong> — only allowed while zero creators have
          joined. Refunds the full escrow.
        </li>
        <li>
          <strong>Refund</strong> — only after the campaign ends + the 7-day
          final-proof window closes with zero verified settlements. Refunds
          the full escrow.
        </li>
      </ul>

      <h2>Step 6 — Settlement</h2>
      <p>
        On day 1 after the campaign + 7-day final-proof window closes, the
        cron-driven settlement runner walks every participation:
      </p>
      <ul>
        <li>
          Creators who submitted valid Join + Final proofs get paid the delta
          (Δv = final views − join views) at the configured rate.
        </li>
        <li>Creators who missed the final window forfeit their share.</li>
        <li>
          Disqualified creators (failed any of the 13 rules) forfeit their
          share + take a strike against their wallet.
        </li>
        <li>
          If nobody settled, the entire escrow returns to your wallet
          automatically. No discretion, just code.
        </li>
      </ul>

      <h2>What you can monitor live</h2>
      <ul>
        <li>
          <Link href="/analytics?scope=mine">/analytics</Link> — view counts,
          top creators, disqualification breakdown.
        </li>
        <li>
          Campaign details modal — per-campaign leaderboard updates as
          proofs verify.
        </li>
        <li>
          <Link href="/notifications">/notifications</Link> — every join,
          proof, settlement, and refund fires a notification.
        </li>
      </ul>
    </>
  );
}
