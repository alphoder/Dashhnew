import { z } from 'zod';

export const verifySiwsSchema = z.object({
  address: z.string().min(32).max(64),
  signature: z.string().min(1),
  nonce: z.string().min(16),
  role: z.enum(['brand', 'creator']),
});

export type VerifySiwsInput = z.infer<typeof verifySiwsSchema>;
