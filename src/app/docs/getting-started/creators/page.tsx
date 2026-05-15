import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Getting started for creators' };

export default function CreatorsGettingStarted() {
  return (
    <>
      <h1>Getting started — for creators</h1>
      <p>
        Earn SOL by promoting brand campaigns and proving your real
        engagement on-chain. Here&apos;s the loop.
      </p>

      <h2>Step 1 — Connect Phantom &amp; sign in</h2>
      <p>
        From the landing page, click <strong>Get Started</strong> and follow
        the onboarding. Once you&apos;re connected, you&apos;re identified by
        your wallet pubkey — no email, no KYC.
      </p>

      <h2>Step 2 — Browse Discover</h2>
      <p>
        <Link href="/discover">/discover</Link> shows every active campaign,
        filterable by platform. Each card shows the budget, per-view rate,
        and days remaining.
      </p>

      <h2>Step 3 — Join a campaign</h2>
      <p>
        Click any campaign card and read the details modal carefully:
      </p>
      <ul>
        <li>Required hashtag / mention / phrase (must include in your post).</li>
        <li>Payment model — affects how much you can earn.</li>
        <li>
          <strong>Tick the T&amp;C checkbox</strong> — you agree to the 13
          disqualification rules and the 3-strike ban policy.
        </li>
      </ul>
      <p>
        Click <strong>Sign terms &amp; join</strong>. Phantom pops up to sign
        the creator T&amp;C message. After signing, the &ldquo;What&apos;s
        next&rdquo; panel appears.
      </p>

      <h2>Step 4 — Post your content</h2>
      <p>
        Switch to the target platform (Instagram, YouTube, X, or TikTok) and
        publish your content. The required markers in the brief MUST appear
        in your caption / description — missing any one of them
        disqualifies the proof later.
      </p>

      <h2>Step 5 — Submit your Join Proof</h2>
      <p>
        Go to <code>/verifyClaim/&lt;participation_id&gt;</code> (or use the
        &ldquo;Submit Join Proof&rdquo; button on your dashboard). Click your
        platform. A QR code appears.
      </p>
      <ul>
        <li>Open the Reclaim app on your phone.</li>
        <li>Scan the QR.</li>
        <li>Log in to the target platform inside Reclaim&apos;s secure flow.</li>
        <li>Reclaim generates a zkTLS proof and ships it back to DASHH.</li>
        <li>
          DASHH runs the 13-rule pipeline server-side. If it passes, your
          baseline views are anchored.
        </li>
      </ul>

      <h2>Step 6 — Wait for the campaign to end</h2>
      <p>
        Your views accumulate naturally on the host platform. The DASHH cron
        polls public APIs to display these in the UI but the real money
        depends on your Final Proof.
      </p>

      <h2>Step 7 — Submit your Final Proof</h2>
      <p>
        The moment the campaign&apos;s end date passes, a 7-day window opens
        for Final Proofs. The same Reclaim flow as Step 5. Submit inside the
        window or you forfeit.
      </p>

      <h2>Step 8 — Get paid</h2>
      <p>
        Δv = final views − join views. Multiplied by the rate (per-view) or
        ranked against other creators (top-performer / split-top-N / equal-split),
        you receive SOL directly into your wallet. See the on-chain
        transaction link from your dashboard.
      </p>

      <h2>Rules you really need to follow</h2>
      <ul>
        <li>
          Include the brand&apos;s required hashtag / mention / phrase
          exactly as written.
        </li>
        <li>Don&apos;t buy views or follower bots — velocity anomalies trigger rejection.</li>
        <li>Don&apos;t delete the post before the Final Proof.</li>
        <li>Don&apos;t change your social handle between Join and Final.</li>
        <li>
          One social post = one campaign. Don&apos;t submit the same URL for
          two different campaigns.
        </li>
      </ul>
      <p>
        Three strikes in 90 days &rarr; 90-day wallet ban. No appeals — the
        rules are coded.
      </p>
    </>
  );
}
