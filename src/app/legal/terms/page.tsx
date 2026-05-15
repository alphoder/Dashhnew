import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '../_components/legal-layout';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The agreement between you and DASHH when you create campaigns, join campaigns, or submit zkTLS proofs on the platform.',
  alternates: { canonical: '/legal/terms' },
};

export default function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service" effectiveDate="15 May 2026">
      <p>
        Welcome to DASHH. These Terms govern your use of{' '}
        <a href="https://dashhnew.vercel.app">dashhnew.vercel.app</a> and the
        related APIs. By connecting a wallet, you agree to be bound by them.
      </p>

      <p>
        <strong>
          DASHH is a peer-to-peer, zkTLS-verified influencer marketing
          platform on Solana.
        </strong>{' '}
        We are software infrastructure &mdash; not a financial intermediary,
        not your fiduciary, and not a party to any campaign. Funds escrow
        and settle via deterministic code, not human discretion.
      </p>

      <h2>1. Acceptance &amp; eligibility</h2>
      <ul>
        <li>You must be at least 18 years old.</li>
        <li>
          You must be legally permitted to use a cryptocurrency wallet and
          conduct on-chain transactions in your jurisdiction.
        </li>
        <li>
          By signing a Solana message via SIWS, you agree to these Terms,
          the campaign-specific signed Terms, and our{' '}
          <Link href="/legal/privacy">Privacy Policy</Link>.
        </li>
      </ul>

      <h2>2. The platform fee</h2>
      <p>
        DASHH retains a <strong>20% platform fee</strong> (2,000 basis
        points) on every campaign payout. The fee is signed into the
        campaign&apos;s Terms message and stored on-chain &mdash; it cannot be
        increased retroactively for a campaign that has already been
        funded.
      </p>

      <h2>3. Brands (campaign creators)</h2>
      <h3>3.1 Funding the escrow</h3>
      <p>
        When you launch a campaign, your full budget is transferred from
        your wallet to the platform recipient wallet (or, in future, an
        audited Anchor escrow program). You can refund the escrow under{' '}
        <strong>§3.4</strong> below.
      </p>

      <h3>3.2 Signed terms message</h3>
      <p>
        Before funding, you must sign a structured Terms message with your
        wallet. The signed message records: budget, payment model,
        platform-fee rate, content-match requirements, and campaign
        timing. This signature is the on-chain contract between you and
        any creator who joins.
      </p>

      <h3>3.3 Cancellation (pre-join)</h3>
      <p>
        You can cancel a campaign at any time <strong>before</strong> any
        creator has joined. We refund the full budget to your wallet
        on-chain. Once a creator has signed and joined, the campaign must
        run its course &mdash; cancelling after a creator has invested
        content-creation time would violate the signed terms.
      </p>

      <h3>3.4 Refund (post-window, no settlement)</h3>
      <p>
        If your campaign ends and the 7-day final-proof window closes with
        zero settled creators, your full budget is returned to your
        wallet automatically by the daily settlement cron, or immediately
        on demand via the &ldquo;Claim refund&rdquo; button.
      </p>

      <h3>3.5 Content responsibility</h3>
      <p>
        You are solely responsible for the campaign briefs you publish, the
        accuracy of required hashtags / mentions / phrases, and compliance
        with applicable advertising law in your jurisdiction (FTC,
        ASCI, etc.).
      </p>

      <h2>4. Creators (campaign participants)</h2>
      <h3>4.1 Joining a campaign</h3>
      <p>
        Joining requires signing a creator-side Terms acknowledgement with
        your wallet. The signed acknowledgement records the campaign you
        are joining and confirms you have read these Terms, the campaign
        brief, and the <Link href="/terms#disqualification">13 disqualification rules</Link>.
      </p>

      <h3>4.2 The two-proof model</h3>
      <p>
        DASHH uses a two-stage verification model:
      </p>
      <ul>
        <li>
          <strong>Join proof</strong> &mdash; submitted shortly after joining;
          anchors your social-platform handle and baseline view count.
        </li>
        <li>
          <strong>Final proof</strong> &mdash; submitted inside the 7-day
          window after the campaign&apos;s end date; finalises the view delta
          (&Delta;v) that determines payout.
        </li>
      </ul>
      <p>
        If you submit only a join proof and miss the final-proof window,
        your payout is forfeited.
      </p>

      <h3>4.3 Disqualification &amp; the 3-strike ban</h3>
      <p>
        Each proof runs through the 13-rule disqualification pipeline
        described at <Link href="/terms#disqualification">/terms#disqualification</Link>. A
        disqualified proof counts as a strike. Three strikes in a rolling
        90-day window trigger an automatic 90-day account ban. There is no
        human appeal &mdash; the pipeline is deterministic code.
      </p>

      <h3>4.4 Payouts</h3>
      <p>
        Payouts are computed by the deterministic{' '}
        <code>computePayoutForProof()</code> function and executed
        on-chain. Once submitted to the Solana network, payouts cannot be
        reversed by DASHH.
      </p>

      <h2>5. Prohibited use</h2>
      <p>
        You may not use DASHH to:
      </p>
      <ul>
        <li>
          Submit fraudulent proofs, screenshots, or any non-zkTLS-derived
          evidence of engagement.
        </li>
        <li>
          Run campaigns promoting illegal goods or services, regulated
          financial instruments (in jurisdictions where you lack the
          relevant licence), violent extremism, CSAM, hate speech, or
          deepfake content depicting real people without consent.
        </li>
        <li>
          Circumvent the strike counter or 90-day ban by using a different
          wallet (sybil behaviour is one of the 13 rules).
        </li>
        <li>
          Probe, scrape, or attempt to reverse-engineer the platform in
          ways that interfere with normal operation.
        </li>
      </ul>

      <h2>6. Disclaimers</h2>
      <p>
        DASHH is currently running on Solana <strong>devnet</strong>. SOL
        on devnet has no monetary value. DASHH may suspend, rate-limit, or
        end devnet operations at any time without notice.
      </p>
      <p>
        The service is provided <strong>&ldquo;as is&rdquo;</strong>
        without warranty of any kind. We make no guarantees about
        availability, uptime, or fitness for any particular purpose.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, DASHH and its contributors
        are not liable for any indirect, incidental, special, or
        consequential damages arising from your use of the platform. Our
        total liability for any direct damages is limited to the platform
        fees you have paid us in the 12 months preceding the claim.
      </p>

      <h2>8. Indemnity</h2>
      <p>
        You agree to indemnify DASHH for any claim, loss, or damage
        arising from your campaigns, your submitted content, your proofs,
        or your violation of these Terms.
      </p>

      <h2>9. Governing law &amp; disputes</h2>
      <p>
        These Terms are governed by the laws of India. Disputes are
        resolved via binding arbitration in Indore, Madhya Pradesh, except
        where applicable consumer law requires otherwise.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may amend these Terms; significant changes will be flagged in
        the in-app notification feed. Continued use after a change
        constitutes acceptance.
      </p>

      <h2>11. Contact</h2>
      <p>
        Open an issue on{' '}
        <a
          href="https://github.com/alphoder/Dashhnew/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>{' '}
        for legal or platform questions.
      </p>
    </LegalLayout>
  );
}
