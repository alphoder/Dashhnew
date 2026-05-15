import Link from 'next/link';

export default function DocsIndex() {
  return (
    <>
      <h1>DASHH Documentation</h1>
      <p>
        DASHH is a peer-to-peer, zkTLS-verified influencer marketing platform
        on Solana. Brands escrow SOL on-chain, creators submit cryptographic
        proofs of engagement, and payouts settle deterministically — no
        middlemen, no admins.
      </p>
      <p>
        This documentation covers the platform from both sides — brand &amp;
        creator — plus the underlying concepts that make the whole thing
        trustless.
      </p>

      <h2>New here?</h2>
      <ul>
        <li>
          <Link href="/docs/getting-started/brands">
            I&apos;m a brand — how do I launch a campaign?
          </Link>
        </li>
        <li>
          <Link href="/docs/getting-started/creators">
            I&apos;m a creator — how do I earn?
          </Link>
        </li>
      </ul>

      <h2>Core concepts</h2>
      <ul>
        <li>
          <Link href="/docs/concepts/two-proof">
            The two-proof settlement model
          </Link>{' '}
          — Join Proof + Final Proof, and why both matter.
        </li>
        <li>
          <Link href="/docs/concepts/payment-models">
            The four payment models
          </Link>{' '}
          — per-view, top-performer, split-top-N, equal-split.
        </li>
        <li>
          <Link href="/docs/concepts/disqualification">
            13 disqualification rules
          </Link>{' '}
          — what gets a proof rejected, and the 3-strike ban policy.
        </li>
      </ul>

      <h2>API</h2>
      <ul>
        <li>
          <Link href="/docs/api">REST endpoint reference</Link>
        </li>
      </ul>

      <h2>Want to ship?</h2>
      <ul>
        <li>
          <Link href="/form">Launch a campaign</Link> — start with a template
          and the form fills itself.
        </li>
        <li>
          <Link href="/discover">Browse Discover</Link> — see active
          campaigns and join one.
        </li>
        <li>
          <a
            href="https://github.com/alphoder/Dashhnew"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>{' '}
          — full open-source codebase.
        </li>
      </ul>
    </>
  );
}
