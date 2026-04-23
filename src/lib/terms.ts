// Canonical Terms text + helper to build a signable message.
// Versioned so that a change invalidates old signatures.

export const TERMS_VERSION = 'v1';
export const CREATOR_TERMS_VERSION = 'v1';
export const PLATFORM_FEE_BPS = 2000; // 20%
export const PLATFORM_FEE_PERCENT = PLATFORM_FEE_BPS / 100;

export const TERMS_BODY = `DASHH — Campaign Terms (${TERMS_VERSION})

1. Platform fee. DASHH retains ${PLATFORM_FEE_PERCENT}% of every campaign
   budget at the moment of funding. The remaining ${100 - PLATFORM_FEE_PERCENT}%
   is distributed to creators according to the payment model you select below.

2. Verified engagement only. Creators are paid exclusively for engagement
   verified via the Reclaim Protocol's zkTLS proofs. Unverified claims never
   trigger a payout.

3. Payment models.
     per_view       — each verified view pays cpv SOL up to the budget.
     top_performer  — the top-viewed creator receives the full creator pool.
     split_top_n    — the top N creators split the creator pool equally.
     equal_split    — every verified creator receives an equal share.

4. Escrow. Campaign budget is locked in a Solana escrow from the moment of
   funding until campaign end or manual cancellation. Funds cannot be
   clawed back once a valid proof has been verified against them.

5. Dispute policy. DASHH operates peer-to-peer — there is no admin to
   arbitrate. A proof is either valid (verified by Reclaim) or it isn't.

6. Signature. By signing this message you acknowledge the above terms
   and authorise the platform fee deduction from your campaign budget.

Nothing in this document is legal or financial advice.`;

/** Build the message that the brand will sign with their Phantom wallet. */
export function buildTermsMessage(params: {
  brandWallet: string;
  budget: number;
  paymentModel: string;
  topNCount?: number;
  cpv: number;
  issuedAt: string;
}) {
  return [
    `DASHH Campaign Terms ${TERMS_VERSION}`,
    ``,
    `Wallet:        ${params.brandWallet}`,
    `Budget:        ${params.budget} SOL`,
    `Payment model: ${params.paymentModel}${params.topNCount ? ` (top ${params.topNCount})` : ''}`,
    `CPV:           ${params.cpv} SOL`,
    `Platform fee:  ${PLATFORM_FEE_PERCENT}%`,
    `Issued at:     ${params.issuedAt}`,
    ``,
    `By signing, I accept the DASHH ${TERMS_VERSION} terms.`,
  ].join('\n');
}

// ─────────────── Creator terms ───────────────

export const DISQUALIFICATION_REASONS = [
  'Fabricated or manipulated engagement (bot traffic, view farms, click bots)',
  'Sybil behaviour — using multiple wallets or sock-puppet social accounts',
  'Submitting content you do not own — the post owner in the proof must match your verified social handle',
  'Submitting content published before the campaign started (old/recycled posts)',
  'Deleting, hiding, or privating the content before the campaign ends',
  'Submitting a Reclaim proof that fails cryptographic verification',
  'Impossible view velocity — spikes that exceed realistic human-engagement rates for your follower base',
  'Engagement-ratio mismatch (e.g. views without any likes or comments, indicative of farmed traffic)',
  'Hate speech, harassment, or any content that violates the host platform\'s ToS',
  'Misrepresenting the brand, product, or campaign terms',
  'Attempting to reverse or challenge a payout after on-chain settlement',
  'Editing the post significantly after the proof is submitted (bait-and-switch)',
  'Coordinating with other wallets to game payment models (e.g. manipulating Split-Top-N ranks)',
] as const;

/**
 * A repeat offender is banned from the protocol. Bans are enforced via the
 * `profiles_v2.banned` flag — once true, the wallet cannot create campaigns,
 * join campaigns, or submit proofs. This is stored on-chain in spirit (the
 * proof of disqualification is the Reclaim proof itself, which is permanent
 * on Arweave).
 */
export const BAN_POLICY = `DASHH Ban Policy

A creator or brand wallet is banned from DASHH when:

  1. The wallet is disqualified from 3 or more campaigns within 90 days.
  2. A single disqualification carries a "severe" severity flag
     (impersonation, coordinated fraud, proven bot ring, hate speech).
  3. The wallet attempts to reverse or double-spend a verified payout.

Banned wallets:

  - Cannot create new campaigns (brand side).
  - Cannot join new campaigns or submit proofs (creator side).
  - Have all pending payouts forfeited to the respective campaign budgets.
  - Lose their full reputation score and any tier progress.
  - The ban is publicly visible — every proof anchored to Arweave contains
    the verification outcome, so bans are auditable by anyone.

Bans are enforced automatically — there is no admin arbitrator. A severe
disqualification or reaching the 3-strike threshold flips
\`profiles_v2.banned = true\` at the moment of violation.

Appealing a ban: currently not supported. DASHH is peer-to-peer; there
is no central team to reach. A future version may add a staked-appeal
mechanism where the ban can be challenged by burning SOL into a community
review vote. For now, a ban is final.`;

export const CREATOR_TERMS_BODY = `DASHH Creator Terms (${CREATOR_TERMS_VERSION})

1. Honest engagement only. You agree that every view, like, and proof you
   submit comes from real humans engaging with your content. DASHH uses the
   Reclaim Protocol's zkTLS proofs to verify this; fabricated engagement
   cannot pass verification.

2. One wallet, one creator identity per campaign. You may not create multiple
   wallets or sock-puppet social accounts to participate in the same
   campaign.

3. Keep the content up until campaign end. Removing, hiding, or significantly
   editing the post before a campaign's endsAt timestamp voids your proofs.

4. No platform-ToS violations. Content that violates the host platform's
   Terms of Service (e.g. hate speech, spam, sexually explicit material in
   non-adult contexts) is automatically disqualified.

5. Disqualification consequences. A disqualified creator forfeits:
     · any pending payout on the offending campaign,
     · their reputation score on DASHH,
     · access to the creator pool until manual reinstatement.
   Disqualifications are triggered automatically by failed Reclaim proofs
   and can be flagged by the brand — there is no central admin override.

5a. Repeat offenders are banned. Three disqualifications within 90 days, or
    a single "severe" offence (impersonation, coordinated fraud, proven bot
    ring), permanently bans the wallet from DASHH. Banned wallets lose all
    pending payouts and reputation. See the Ban Policy at /terms#ban.

6. Two-proof settlement. Every campaign requires exactly TWO Reclaim proofs
   from you:
     · Proof #1 (join)  — submitted during the campaign; anchors ownership
                          and baseline views. No payout yet.
     · Proof #2 (final) — submitted in the 7-day window AFTER the campaign
                          ends. Captures the post-campaign view count (by
                          which point platform bot-rollbacks have completed)
                          and triggers the on-chain payout.
   Missing the final proof = forfeited payout. No exceptions — the whole
   point is that only real, lasting engagement gets paid.

7. Payment is terminal. Once the settlement payout confirms on Solana it
   is irreversible. Disputes must be raised before settlement.

8. Signature. By signing this message you acknowledge the above rules and
   authorise your participation in this specific campaign.

Grounds for disqualification (non-exhaustive):
${DISQUALIFICATION_REASONS.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}`;

/**
 * Build a per-campaign message for the creator to sign when joining.
 * Differs from the brand message in that it's scoped to a single campaign
 * and enumerates the disqualification rules.
 */
export function buildCreatorJoinMessage(params: {
  creatorWallet: string;
  campaignId: string;
  campaignTitle: string;
  paymentModel: string;
  platform: string;
  issuedAt: string;
}) {
  return [
    `DASHH Creator Terms ${CREATOR_TERMS_VERSION}`,
    ``,
    `Wallet:        ${params.creatorWallet}`,
    `Campaign:      ${params.campaignTitle}`,
    `Campaign id:   ${params.campaignId}`,
    `Platform:      ${params.platform}`,
    `Payment:       ${params.paymentModel}`,
    `Issued at:     ${params.issuedAt}`,
    ``,
    `By signing, I accept the DASHH Creator Terms ${CREATOR_TERMS_VERSION}`,
    `and understand the disqualification rules, including:`,
    ...DISQUALIFICATION_REASONS.slice(0, 3).map((r) => `  • ${r}`),
    `  (…full list at /terms)`,
  ].join('\n');
}
