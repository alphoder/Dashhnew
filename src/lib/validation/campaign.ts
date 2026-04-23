import { z } from 'zod';

export const platformSchema = z.enum(['instagram', 'youtube', 'twitter', 'tiktok']);

export const paymentModelSchema = z.enum([
  'per_view',
  'top_performer',
  'split_top_n',
  'equal_split',
]);

export const createCampaignSchema = z
  .object({
    title: z.string().min(3).max(100),
    description: z.string().min(10).max(500),
    platform: platformSchema,
    iconUrl: z.string().url(),
    ctaLabel: z.string().min(2).max(30),
    budget: z.number().positive(),
    cpv: z.number().positive(),
    paymentModel: paymentModelSchema.default('per_view'),
    topNCount: z.number().int().positive().max(100).optional(),
    platformFeeBps: z.number().int().min(0).max(5000).default(2000),
    termsVersion: z.string().default('v1'),
    termsSignature: z.string().min(10),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .refine((d) => d.endsAt > d.startsAt, {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  })
  .refine((d) => d.budget >= d.cpv, {
    message: 'budget must cover at least one verified view',
    path: ['budget'],
  })
  .refine(
    (d) => d.paymentModel !== 'split_top_n' || (d.topNCount && d.topNCount >= 2),
    { message: 'Split-Top-N requires a topNCount of 2 or more', path: ['topNCount'] },
  );

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const participateSchema = z.object({
  campaignId: z.string().uuid(),
  postUrl: z.string().url().optional(),
});

export const submitProofSchema = z.object({
  participationId: z.string().uuid(),
  reclaimProofId: z.string().min(1),
  rawProof: z.unknown(),
});
