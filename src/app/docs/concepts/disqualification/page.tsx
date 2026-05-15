import type { Metadata } from 'next';
import { DISQUALIFICATION_REASONS } from '@/lib/terms';

export const metadata: Metadata = { title: '13 disqualification rules' };

export default function DisqualificationConcept() {
  return (
    <>
      <h1>The 13 disqualification rules</h1>
      <p>
        Every proof submitted to DASHH runs through a deterministic
        13-rule pipeline before any SOL moves. Failing any rule means the
        proof is rejected, a strike is recorded against the creator&apos;s
        wallet, and the campaign continues without paying out for that
        proof.
      </p>
      <p>
        The rules are coded in <code>src/lib/reclaim/verify.ts</code> and
        described in human terms in <code>src/lib/terms.ts</code>. They
        are the rules from <code>DISQUALIFICATION_REASONS</code>:
      </p>

      <ol className="my-4 list-decimal pl-5 space-y-2 text-zinc-300">
        {DISQUALIFICATION_REASONS.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ol>

      <h2>Severity tiers</h2>
      <p>
        The verifier classifies each violation into one of three tiers:
      </p>
      <ul>
        <li>
          <code>warn</code> — proof is flagged for community review but no
          strike is recorded. Used for borderline cases where a human
          should look.
        </li>
        <li>
          <code>reject</code> — proof is rejected and 1 strike is recorded.
          The standard outcome for the majority of rule violations.
        </li>
        <li>
          <code>severe</code> — proof is rejected AND triggers an immediate
          ban regardless of strike count. Reserved for proof-forgery
          attempts.
        </li>
      </ul>

      <h2>The 3-strike ban policy</h2>
      <ul>
        <li>3 strikes inside a rolling 90-day window &rarr; 90-day wallet ban.</li>
        <li>
          Banned wallets cannot join new campaigns, submit proofs, or
          receive payouts.
        </li>
        <li>
          Bans are wallet-level, not human-level. Sybil attacks (creating a
          new wallet to dodge a ban) are themselves disqualifying — rule
          11 catches self-engagement rings.
        </li>
        <li>
          After 90 days, the ban automatically lifts. The strike counter
          resets only on the FIRST clean settlement after the ban ends.
        </li>
      </ul>

      <h2>Why no human appeals?</h2>
      <p>
        DASHH is &ldquo;peer-to-peer, no admin&rdquo; on purpose. An
        appeal mechanism creates a discretionary chokepoint — exactly the
        thing Web3 advertising is supposed to remove. The trade-off is
        that the rules must be ruthlessly explicit AND deterministic. We
        believe that&apos;s a feature, not a bug.
      </p>

      <h2>What to do if you think you were unfairly disqualified</h2>
      <p>
        Open a GitHub issue with the participation id and the specific
        rule you believe was triggered. If we find a bug in the verifier,
        we&apos;ll fix the bug and the rule will treat past matching
        cases more leniently going forward — but we will not retroactively
        reverse paid-out settlements.
      </p>
    </>
  );
}
