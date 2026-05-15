import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Payment models' };

export default function PaymentModelsConcept() {
  return (
    <>
      <h1>The four payment models</h1>
      <p>
        When a brand creates a campaign, they pick one of four payment
        models. The chosen model is signed into the Terms message, stored
        with the campaign, and used by{' '}
        <code>computePayoutForProof()</code> at settlement.
      </p>

      <h2>per_view</h2>
      <p>The classic. Pay a fixed SOL rate per verified view.</p>
      <ul>
        <li>
          Each creator earns <code>Δv × cpv</code>, capped at remaining
          campaign budget.
        </li>
        <li>
          First-come, first-served — if 10 creators race to fill the budget,
          earlier high-performers get more.
        </li>
        <li>Best for: brands that know their CPV ceiling and want predictable bidding.</li>
      </ul>

      <h2>top_performer</h2>
      <p>Winner takes all.</p>
      <ul>
        <li>The creator with the highest Δv receives the entire creator pool.</li>
        <li>Other valid creators get zero.</li>
        <li>Best for: prestige campaigns where you want viral pressure.</li>
      </ul>

      <h2>split_top_n</h2>
      <p>Top N creators split the pool evenly.</p>
      <ul>
        <li>
          The brand picks N (between 2 and 100). Each of the top-N creators
          by Δv receives <code>pool / N</code>.
        </li>
        <li>
          Tied at the cutoff? We sort by Join Proof timestamp — earlier wins.
        </li>
        <li>Best for: balance between virality and broad reach.</li>
      </ul>

      <h2>equal_split</h2>
      <p>Everyone who passes verification gets an equal share.</p>
      <ul>
        <li>
          <code>pool / numVerifiedCreators</code> to each. Quality is enforced
          by the 13-rule pipeline, not by ranking.
        </li>
        <li>Best for: brands building a long-tail creator community.</li>
      </ul>

      <h2>Where the platform fee fits</h2>
      <p>
        For all four models:{' '}
        <code>creatorPool = budget × (1 - platformFeeBps / 10_000)</code>
      </p>
      <p>
        With the default 2,000 bps (20%) fee, an 1 SOL campaign has a 0.8
        SOL creator pool. The 0.2 SOL platform fee is transferred at
        settlement, not at funding time — so cancelled / refunded campaigns
        never pay any fee.
      </p>

      <h2>When is the payout decided?</h2>
      <ul>
        <li>
          <code>per_view</code> — payouts happen INCREMENTALLY at proof
          submission. Each successful proof gets paid <code>Δv × cpv</code>{' '}
          up to budget.
        </li>
        <li>
          Other three (<code>top_performer</code>, <code>split_top_n</code>,
          <code>equal_split</code>) — payouts happen ONCE at settlement,
          after all participations are evaluated. The proof submission
          merely registers Δv.
        </li>
      </ul>
    </>
  );
}
