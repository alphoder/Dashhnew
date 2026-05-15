import type { Metadata } from 'next';
import { LegalLayout } from '../_components/legal-layout';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How DASHH collects, uses, and protects your wallet, engagement, and platform data.',
  alternates: { canonical: '/legal/privacy' },
};

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" effectiveDate="15 May 2026">
      <p>
        This Privacy Policy explains what data DASHH (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;) collects when you use{' '}
        <a href="https://dashhnew.vercel.app">dashhnew.vercel.app</a> and
        related APIs, how we use it, and the rights you have over it.
      </p>

      <p>
        <strong>DASHH is built to need as little personal data as possible.</strong>{' '}
        Your wallet address is your identity. We do not collect your name,
        email, phone number, government-issued IDs, or social-platform
        passwords.
      </p>

      <h2>1. Data we collect</h2>

      <h3>1.1 From you, directly</h3>
      <ul>
        <li>
          <strong>Wallet address.</strong> When you connect a Solana wallet
          (e.g. Phantom), we read your public key. We never see your private
          key.
        </li>
        <li>
          <strong>Signed messages.</strong> When you sign a Terms message or
          authenticate via Sign-In With Solana (SIWS), the signature is
          stored alongside the campaign/participation it belongs to.
        </li>
        <li>
          <strong>Campaign content.</strong> If you are a brand, the title,
          description, budget, and platform you choose when launching a
          campaign.
        </li>
      </ul>

      <h3>1.2 From third-party services (with your consent)</h3>
      <ul>
        <li>
          <strong>Reclaim Protocol zkTLS proofs.</strong> When you submit a
          proof, Reclaim returns a cryptographically-signed object that
          attests to your view count on a target platform (Instagram,
          YouTube, X, TikTok). We store the proof object itself, plus the
          parsed metrics (view count, caption, handle).
        </li>
        <li>
          <strong>Solana blockchain.</strong> Every escrow funding,
          settlement, refund, and cancellation creates a public on-chain
          transaction. We index transaction signatures but do not own the
          underlying data &mdash; anyone can audit it on Solana Explorer.
        </li>
      </ul>

      <h3>1.3 Automatically</h3>
      <ul>
        <li>
          <strong>Server-side logs.</strong> Standard request logs (IP
          address, user agent, route hit) for rate-limit enforcement and
          abuse prevention. Logs are retained for 30 days.
        </li>
        <li>
          <strong>Anonymous analytics.</strong> If enabled, we use
          privacy-preserving page-view analytics (PostHog) to understand
          which features users adopt. No personally identifiable information
          is sent.
        </li>
        <li>
          <strong>Error tracking.</strong> If enabled, runtime errors are
          captured (Sentry) for debugging. Stack traces may include
          truncated user state (wallet address) but never private keys.
        </li>
      </ul>

      <h2>2. What we do NOT collect</h2>
      <ul>
        <li>Private keys, seed phrases, or wallet passwords</li>
        <li>Email addresses, phone numbers, or postal addresses</li>
        <li>Real names, dates of birth, or government IDs</li>
        <li>Bank account details or credit card numbers</li>
        <li>
          Your social-platform passwords or session cookies (Reclaim
          generates proofs without sharing these with us)
        </li>
      </ul>

      <h2>3. How we use your data</h2>
      <ul>
        <li>
          <strong>Operate the platform.</strong> Match brands and creators,
          run the 13-rule disqualification pipeline, compute payouts.
        </li>
        <li>
          <strong>Enforce the rules.</strong> Track strike counts (3 strikes
          in 90 days = 90-day ban), prevent duplicate proofs, and detect
          view-bot signatures.
        </li>
        <li>
          <strong>Issue payouts.</strong> Send SOL from the platform escrow
          wallet to your creator wallet when proofs verify.
        </li>
        <li>
          <strong>Support and abuse response.</strong> Investigate disputes
          or suspected platform abuse.
        </li>
      </ul>

      <h2>4. Who we share data with</h2>
      <p>
        We do not sell or rent your data. We share with the following
        sub-processors strictly to operate the platform:
      </p>
      <ul>
        <li>
          <strong>Neon (Postgres database)</strong> &mdash; encrypted at rest
          and in transit. Region: us-east-1.
        </li>
        <li>
          <strong>Vercel (hosting)</strong> &mdash; serverless functions and
          static assets. Request logs may be retained per Vercel&apos;s policy.
        </li>
        <li>
          <strong>Reclaim Protocol</strong> &mdash; the zkTLS attestor that
          generates engagement proofs. Reclaim sees your social-platform
          session inside its secure environment; DASHH only ever sees the
          resulting proof.
        </li>
        <li>
          <strong>Arweave / Irys</strong> &mdash; we permanently anchor
          verified proof bundles for public auditability. Once written, an
          Arweave anchor cannot be deleted.
        </li>
        <li>
          <strong>Solana blockchain</strong> &mdash; all financial state is
          public.
        </li>
      </ul>

      <h2>5. International transfers</h2>
      <p>
        Our infrastructure is primarily hosted in the United States. By
        using DASHH from outside the US, you consent to data transfers in
        line with applicable data-protection law.
      </p>

      <h2>6. Your rights</h2>
      <ul>
        <li>
          <strong>Access.</strong> Your wallet address gives you direct
          access to every record we hold about you via the platform UI.
        </li>
        <li>
          <strong>Deletion.</strong> Off-chain records (campaign metadata,
          notifications) can be deleted on request. On-chain transactions
          and Arweave anchors are immutable &mdash; we cannot delete those, by
          design.
        </li>
        <li>
          <strong>Portability.</strong> Your wallet, proofs, and on-chain
          transactions are already portable &mdash; you can read them yourself
          from any Solana RPC or Reclaim verifier without us.
        </li>
        <li>
          <strong>Withdraw consent.</strong> You can disable analytics +
          error tracking via the cookie banner at any time.
        </li>
      </ul>

      <h2>7. Children</h2>
      <p>
        DASHH is not intended for users under 18. We do not knowingly
        collect data from minors.
      </p>

      <h2>8. Changes to this policy</h2>
      <p>
        We&apos;ll update the &ldquo;Last updated&rdquo; date at the top of this
        page when we make material changes. Continued use after a change
        constitutes acceptance.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about this policy or about your data? Reach the team on{' '}
        <a
          href="https://github.com/alphoder/Dashhnew/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub Issues
        </a>
        .
      </p>
    </LegalLayout>
  );
}
