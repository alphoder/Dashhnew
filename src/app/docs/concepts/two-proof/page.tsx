import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'The two-proof settlement model' };

export default function TwoProofConcept() {
  return (
    <>
      <h1>The two-proof settlement model</h1>
      <p>
        DASHH&apos;s headline differentiator. Every paid view is bracketed
        by two cryptographic proofs of engagement — a baseline at join time
        and a final reading at settlement. Payout = the verified delta.
      </p>

      <h2>Why two proofs, not one?</h2>
      <p>
        Single-proof schemes (the obvious approach) have a fatal flaw: a
        creator can game them by submitting at peak views, regardless of
        whether those views were real over the campaign window. They can
        also submit immediately and then delete their post.
      </p>
      <p>
        Two proofs solve this by anchoring both ends of the window. We pay
        only for views accrued between the two readings, AND we require the
        post to still exist at the final reading. View-bots, deletion
        attacks, and screenshot fraud all break.
      </p>

      <h2>The Join Proof</h2>
      <ul>
        <li>Submitted shortly after the creator joins the campaign.</li>
        <li>
          Anchors three things: the creator&apos;s wallet ↔ social handle
          binding, the baseline view count, and the post&apos;s caption.
        </li>
        <li>
          Goes through the same 13-rule verification pipeline as the Final
          Proof.
        </li>
        <li>
          On success, the participation transitions from{' '}
          <code>awaiting_join</code> &rarr; <code>active</code>.
        </li>
      </ul>

      <h2>The Final Proof</h2>
      <ul>
        <li>
          Submitted inside the 7-day window after the campaign&apos;s
          <code>endsAt</code>.
        </li>
        <li>Reads the final view count.</li>
        <li>
          Must reference the SAME social handle as the Join Proof (handle
          switches are a disqualification).
        </li>
        <li>
          Must show view count ≥ Join Proof (a drop indicates deletion
          fraud).
        </li>
        <li>
          On success, settlement runs. On miss, the participation is
          forfeited.
        </li>
      </ul>

      <h2>The math</h2>
      <pre>
        {`Δv = finalProof.viewCount - joinProof.viewCount

payout (per_view)        = min(Δv * cpv, remainingBudget)
payout (top_performer)   = creatorPool, if I have max Δv
payout (split_top_n)     = creatorPool / N, if I am in top N
payout (equal_split)     = creatorPool / numVerifiedCreators`}
      </pre>

      <h2>Why a 7-day final window?</h2>
      <p>
        Long enough to absorb time-zone differences and creator
        availability, short enough to keep escrow capital efficient.
      </p>
      <p>
        Mathematically: the window is the period during which the
        platform&apos;s on-chain liability is bounded by{' '}
        <code>budget × (1 - platformFee)</code>. Beyond 7 days, residual
        capital should be deployable elsewhere, so we close the window.
      </p>

      <h2>Code references</h2>
      <ul>
        <li>
          <code>src/lib/settlement.ts</code> — <code>routeProofByWindow()</code>{' '}
          decides Join vs Final based on timestamp,{' '}
          <code>readyToSettle()</code> determines if a campaign is past its
          window.
        </li>
        <li>
          <code>src/lib/payouts.ts</code> — <code>computePayoutForProof()</code>{' '}
          implements the four payment models.
        </li>
        <li>
          <code>src/app/api/v2/proofs/route.ts</code> — the proof submission
          handler that drives the state machine.
        </li>
      </ul>
    </>
  );
}
