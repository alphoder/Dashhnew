import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'API reference' };

export default function ApiReference() {
  return (
    <>
      <h1>REST API reference</h1>
      <p>
        DASHH exposes a versioned REST API under <code>/api/v2/*</code>. All
        endpoints return JSON. Authentication is via SIWS session cookies
        (set after sign-in) OR explicit wallet pubkeys in request bodies
        for select endpoints.
      </p>

      <h2>Auth</h2>
      <ul>
        <li>
          <code>GET /api/auth/nonce</code> — issue a nonce to be signed.
        </li>
        <li>
          <code>POST /api/auth/verify</code> — submit signed nonce; receive
          session cookie.
        </li>
        <li>
          <code>POST /api/auth/logout</code> — clear session.
        </li>
        <li>
          <code>GET /api/auth/me</code> — current authenticated wallet.
        </li>
      </ul>

      <h2>Campaigns</h2>
      <ul>
        <li>
          <code>GET /api/v2/campaigns</code> — list. Query params:{' '}
          <code>platform=instagram|youtube|twitter|tiktok</code>,{' '}
          <code>status=active|...</code>, <code>brand=&lt;wallet&gt;</code>,{' '}
          <code>verifiedOnly=true</code>.
        </li>
        <li>
          <code>POST /api/v2/campaigns</code> — create. Requires SIWS or
          <code>brandWallet</code> in body. Rate-limited per wallet.
        </li>
        <li>
          <code>GET /api/v2/campaigns/[id]</code> — single campaign.
        </li>
        <li>
          <code>POST /api/v2/campaigns/[id]/participate</code> — creator
          joins. Body: <code>creatorWallet, termsSignature, referredBy?</code>.
        </li>
        <li>
          <code>POST /api/v2/campaigns/[id]/cancel</code> — brand-only.
          Allowed only with zero participants.
        </li>
        <li>
          <code>POST /api/v2/campaigns/[id]/refund</code> — brand-only.
          Allowed only after the final-window closes with zero settled
          creators.
        </li>
        <li>
          <code>GET /api/v2/campaigns/[id]/leaderboard</code> — per-campaign
          leaderboard.
        </li>
      </ul>

      <h2>Proofs</h2>
      <ul>
        <li>
          <code>POST /api/v2/proofs</code> — submit a Reclaim proof. Body:{' '}
          <code>participationId, reclaimProofId, rawProof</code>. Runs the
          13-rule pipeline, anchors to Arweave on success, routes proof to
          Join or Final based on timestamp.
        </li>
      </ul>

      <h2>Settlement</h2>
      <ul>
        <li>
          <code>GET /api/v2/settle</code> — cron-driven settlement runner.
          Walks every campaign past its 7-day window and finalises payouts.
          Gated by <code>CRON_SECRET</code> in production.
        </li>
        <li>
          <code>GET /api/v2/settle?force=true&amp;campaign=&lt;id&gt;</code>{' '}
          — manual trigger. Dev-only without CRON_SECRET.
        </li>
      </ul>

      <h2>Analytics</h2>
      <ul>
        <li>
          <code>GET /api/v2/analytics/summary</code> — aggregated metrics.
          Optional <code>?wallet=</code> param scopes to a brand&apos;s
          campaigns.
        </li>
        <li>
          <code>GET /api/v2/analytics/landing-counters</code> — public
          counters used by the landing page (cached 60s).
        </li>
      </ul>

      <h2>Creator-self</h2>
      <ul>
        <li>
          <code>GET /api/v2/creators/me?wallet=&lt;w&gt;</code> — current
          creator&apos;s lifetime stats, tier, and participations grouped by
          lifecycle bucket.
        </li>
        <li>
          <code>GET /api/v2/referrals/me?wallet=&lt;w&gt;</code> — referral
          attribution + bonuses-paid summary.
        </li>
      </ul>

      <h2>Notifications</h2>
      <ul>
        <li>
          <code>GET /api/v2/notifications?wallet=&lt;w&gt;</code> — latest 50
          notifications for the wallet.
        </li>
        <li>
          <code>POST /api/v2/notifications/[id]/read</code> — mark a single
          notification as read.
        </li>
      </ul>

      <h2>Embeds</h2>
      <ul>
        <li>
          <code>GET /embed/campaign/[id]</code> — minimal,
          chrome-free iframe-ready widget. Query params:{' '}
          <code>accent=14F195</code>, <code>theme=light</code>,{' '}
          <code>hide=image,description</code>.
        </li>
      </ul>

      <h2>Open Graph</h2>
      <ul>
        <li>
          <code>GET /og?title=...&amp;subtitle=...</code> — dynamic 1200×630
          PNG share card.
        </li>
      </ul>

      <h2>Rate limiting</h2>
      <p>
        All write endpoints are rate-limited per wallet AND per IP. Limits
        are in <code>src/lib/ratelimit.ts</code> under <code>LIMITS</code>:
      </p>
      <ul>
        <li>
          <code>CAMPAIGN_CREATE</code> — 5/hour per wallet
        </li>
        <li>
          <code>PARTICIPATE</code> — 20/hour per wallet
        </li>
        <li>
          <code>PROOF_SUBMIT</code> — 10/hour per IP
        </li>
        <li>
          <code>CANCEL_REFUND</code> — 5/min per wallet
        </li>
      </ul>

      <h2>CAPTCHA</h2>
      <p>
        Campaign creation accepts an optional{' '}
        <code>captchaToken</code> field. When the server is configured with{' '}
        <code>TURNSTILE_SECRET</code>, the token is verified against
        Cloudflare Turnstile and 403 is returned on failure. Without a
        configured secret, verification is bypassed (development mode).
      </p>
    </>
  );
}
