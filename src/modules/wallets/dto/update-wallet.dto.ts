import { z } from 'zod';

export const updateWalletSchema = z.object({
  currency: z
    .string()
    .length(3, 'Currency must be exactly 3 characters long')
    .toUpperCase()
    .optional(),
});

export type UpdateWalletDto = z.infer<typeof updateWalletSchema>;
