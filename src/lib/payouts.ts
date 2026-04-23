// Payment-model-aware payout calculator.
//
// RESUBMISSION MODEL
// ------------------
// Creators can (and should) resubmit proofs as their views grow. Each proof
// is a fresh zkTLS snapshot captured at a specific moment. We pay on the
// DELTA between proofs so a creator who went 1k → 5k views gets paid for
// 4k new views, not 5k (which would double-count the original 1k).
//
// Only per_view pays per-proof. The other three models settle at campaign
// end because rank-based payouts need the final standings.

export type PaymentModel =
  | 'per_view'
  | 'top_performer'
  | 'split_top_n'
  | 'equal_split';

export interface PayoutDecision {
  /** Amount to pay for THIS proof right now. 0 when nothing to pay. */
  amount: number;
  /** Human-readable explanation for the creator. */
  reason: string;
  /** True if the campaign budget has been fully consumed. */
  budgetExhausted: boolean;
  /** True when the model defers settlement to campaign end. */
  deferredToEnd: boolean;
}

export function computePayoutForProof(params: {
  model: PaymentModel;
  cpv: number;
  budget: number;
  newViews: number;
  previousMaxViewsThisCreator: number;
  totalAlreadyPaidOnCampaign: number;
}): PayoutDecision {
  const {
    model,
    cpv,
    budget,
    newViews,
    previousMaxViewsThisCreator,
    totalAlreadyPaidOnCampaign,
  } = params;

  // Ranking-based models don't pay per proof.
  if (model !== 'per_view') {
    return {
      amount: 0,
      reason: `Proof recorded. ${prettyModel(model)} settles at campaign end.`,
      budgetExhausted: false,
      deferredToEnd: true,
    };
  }

  const delta = Math.max(0, newViews - previousMaxViewsThisCreator);
  if (delta === 0) {
    return {
      amount: 0,
      reason: 'No new views since your last proof — nothing to pay out.',
      budgetExhausted: false,
      deferredToEnd: false,
    };
  }

  const remaining = Math.max(0, budget - totalAlreadyPaidOnCampaign);
  const uncapped = cpv * delta;
  const amount = Math.min(uncapped, remaining);
  const budgetExhausted = amount < uncapped;

  return {
    amount,
    reason: budgetExhausted
      ? `Paid ${amount.toFixed(4)} SOL — campaign budget exhausted.`
      : `Paid ${amount.toFixed(4)} SOL on ${delta.toLocaleString()} new views.`,
    budgetExhausted,
    deferredToEnd: false,
  };
}

function prettyModel(m: PaymentModel): string {
  switch (m) {
    case 'top_performer':
      return 'Winner-takes-all';
    case 'split_top_n':
      return 'Split-top-N';
    case 'equal_split':
      return 'Equal split';
    default:
      return m;
  }
}
