import { z } from 'zod';

export const createSavingTransactionSchema = z.object({
  type: z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase() : val),
    z.enum(['CONTRIBUTION', 'WITHDRAWAL'], {
      error: 'Type must be CONTRIBUTION or WITHDRAWAL',
    }),
  ),

  amount: z
    .number({ error: 'Amount is required' })
    .positive('Amount must be greater than 0'),

  note: z.string().max(500, 'Note too long').optional(),
});

export type CreateSavingTransactionDto = z.infer<
  typeof createSavingTransactionSchema
>;
