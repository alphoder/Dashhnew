// DASHH additive schema.
// Non-destructive: original `users` and `creators` tables in ./schema.ts are untouched.
// New tables live alongside. Reference existing tables by name only ("creators") to avoid cyclic imports.

import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  real,
  integer,
  jsonb,
  timestamp,
  pgEnum,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ───────── Enums ─────────
export const platformEnum = pgEnum('platform_v2', [
  'instagram',
  'youtube',
  'twitter',
  'tiktok',
]);

export const campaignStatusEnum = pgEnum('campaign_status_v2', [
  'draft',
  'active',
  'paused',
  'completed',
  'cancelled',
]);

export const proofStatusEnum = pgEnum('proof_status_v2', [
  'pending',
  'verified',
  'rejected',
]);

export const payoutStatusEnum = pgEnum('payout_status_v2', [
  'pending',
  'paid',
  'failed',
]);

export const roleEnum = pgEnum('role_v2', ['brand', 'creator']);

// Payment distribution models for a campaign.
// per_view         — every verified view gets cpv SOL (up to budget)
// top_performer    — whole budget (minus platform fee) goes to the single top-viewed creator
// split_top_n      — whole budget split among top N verified creators
// equal_split      — every verified creator gets an equal share
export const paymentModelEnum = pgEnum('payment_model_v2', [
  'per_view',
  'top_performer',
  'split_top_n',
  'equal_split',
]);

// ───────── Profiles (wallet-linked, multi-role) ─────────
export const profiles = pgTable(
  'profiles_v2',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    wallet: text('wallet').notNull(),
    role: roleEnum('role').notNull(),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    instagramHandle: text('instagram_handle'),
    youtubeHandle: text('youtube_handle'),
    twitterHandle: text('twitter_handle'),
    tiktokHandle: text('tiktok_handle'),
    reputation: integer('reputation').default(0).notNull(),
    totalEarned: real('total_earned').default(0).notNull(),
    // Ban tracking — see BAN_POLICY in lib/terms.ts
    banned: boolean('banned').default(false).notNull(),
    banReason: text('ban_reason'),
    bannedAt: timestamp('banned_at', { withTimezone: true }),
    disqualificationCount: integer('disqualification_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    walletRoleIdx: uniqueIndex('profiles_v2_wallet_role_idx').on(t.wallet, t.role),
  }),
);

// ───────── Campaigns v2 (multi-platform) ─────────
export const campaignsV2 = pgTable(
  'campaigns_v2',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    brandWallet: text('brand_wallet').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    platform: platformEnum('platform').notNull(),
    iconUrl: text('icon_url').notNull(),
    ctaLabel: text('cta_label').notNull(),
    budget: real('budget').notNull(),
    cpv: real('cpv').notNull(),
    escrowPubkey: text('escrow_pubkey'),
    status: campaignStatusEnum('status').default('draft').notNull(),

    // Payment terms (signed by brand at creation time)
    paymentModel: paymentModelEnum('payment_model').default('per_view').notNull(),
    topNCount: integer('top_n_count').default(1),
    platformFeeBps: integer('platform_fee_bps').default(2000).notNull(), // 2000 = 20%
    termsVersion: text('terms_version').default('v1'),
    termsSignature: text('terms_signature'), // base58 signature from the brand wallet
    termsSignedAt: timestamp('terms_signed_at', { withTimezone: true }),

    // Content-match rules — what the creator's post MUST contain. The
    // verification pipeline checks the caption/description of the proof
    // against these, and rejects the proof if any required marker is missing.
    requiredHashtag: text('required_hashtag'), // e.g. "#brewandbloom"
    requiredMention: text('required_mention'), // e.g. "@brewandbloom"
    requiredPhrase: text('required_phrase'),   // free-text phrase the post must contain

    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    // After endsAt, creators have this many days to submit their final
    // proof before forfeiture. Default 7.
    settlementWindowDays: integer('settlement_window_days').default(7).notNull(),
    settledAt: timestamp('settled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    brandIdx: index('campaigns_v2_brand_idx').on(t.brandWallet),
    statusIdx: index('campaigns_v2_status_idx').on(t.status),
    platformIdx: index('campaigns_v2_platform_idx').on(t.platform),
  }),
);

// ───────── Participations ─────────
export const participations = pgTable(
  'participations_v2',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaignsV2.id, { onDelete: 'cascade' }),
    creatorWallet: text('creator_wallet').notNull(),
    postUrl: text('post_url'),
    // Creator terms signature captured at join time
    termsVersion: text('terms_version'),
    termsSignature: text('terms_signature'),
    termsSignedAt: timestamp('terms_signed_at', { withTimezone: true }),
    // Disqualification tracking (peer-to-peer — no admin override)
    disqualified: boolean('disqualified').default(false).notNull(),
    disqualificationReason: text('disqualification_reason'),
    disqualifiedAt: timestamp('disqualified_at', { withTimezone: true }),
    // Auto-sync (public view count, NOT yet cryptographically verified)
    pendingViews: integer('pending_views').default(0).notNull(),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    // Trust mode — once a Reclaim proof succeeds, public-API updates can
    // auto-verify until `trustedUntil` expires or a safeguard trips.
    trustMode: boolean('trust_mode').default(false).notNull(),
    trustedUntil: timestamp('trusted_until', { withTimezone: true }),
    lastProofCheckpointAt: timestamp('last_proof_checkpoint_at', {
      withTimezone: true,
    }),
    // Two-proof settlement model — creators submit exactly two proofs per
    // campaign: (1) at join (anchors ownership + baseline views),
    // (2) in the 7-day window after campaign endsAt (finalises views and
    // triggers on-chain payout).
    joinProofId: uuid('join_proof_id'),
    finalProofId: uuid('final_proof_id'),
    settlementStatus: text('settlement_status').default('awaiting_join').notNull(),
    // one of: 'awaiting_join' | 'active' | 'awaiting_final' | 'settled' | 'forfeited'
    settledAt: timestamp('settled_at', { withTimezone: true }),
    forfeited: boolean('forfeited').default(false).notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniq: uniqueIndex('participations_v2_campaign_creator_idx').on(
      t.campaignId,
      t.creatorWallet,
    ),
  }),
);

// ───────── Proofs ─────────
export const proofs = pgTable('proofs_v2', {
  id: uuid('id').defaultRandom().primaryKey(),
  participationId: uuid('participation_id')
    .notNull()
    .references(() => participations.id, { onDelete: 'cascade' }),
  reclaimProofId: text('reclaim_proof_id').notNull(),
  arweaveTx: text('arweave_tx'),
  verifiedViews: integer('verified_views').default(0).notNull(),
  rawProof: jsonb('raw_proof'),
  status: proofStatusEnum('status').default('pending').notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ───────── Payouts ─────────
export const payouts = pgTable('payouts_v2', {
  id: uuid('id').defaultRandom().primaryKey(),
  proofId: uuid('proof_id')
    .notNull()
    .references(() => proofs.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  txSig: text('tx_sig'),
  status: payoutStatusEnum('status').default('pending').notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ───────── Notifications ─────────
export const notifications = pgTable(
  'notifications_v2',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    wallet: text('wallet').notNull(),
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    payload: jsonb('payload'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ walletIdx: index('notifications_v2_wallet_idx').on(t.wallet) }),
);

// ───────── Relations ─────────
export const campaignsV2Relations = relations(campaignsV2, ({ many }) => ({
  participations: many(participations),
}));

export const participationsRelations = relations(participations, ({ one, many }) => ({
  campaign: one(campaignsV2, {
    fields: [participations.campaignId],
    references: [campaignsV2.id],
  }),
  proofs: many(proofs),
}));

export const proofsRelations = relations(proofs, ({ one, many }) => ({
  participation: one(participations, {
    fields: [proofs.participationId],
    references: [participations.id],
  }),
  payouts: many(payouts),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  proof: one(proofs, { fields: [payouts.proofId], references: [proofs.id] }),
}));
