import { z } from 'zod';

export const createWalletSchema = z.object({
  currency: z
    .string()
    .length(3, 'Currency must be exactly 3 characters long')
    .toUpperCase(),
});

export type CreateWalletDto = z.infer<typeof createWalletSchema>;
