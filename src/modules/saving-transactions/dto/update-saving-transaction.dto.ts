import { z } from 'zod';

export const updateSavingTransactionSchema = z.object({
  type: z
    .preprocess(
      (val) => (typeof val === 'string' ? val.toUpperCase() : val),
      z.enum(['CONTRIBUTION', 'WITHDRAWAL'], {
        error: 'Type must be CONTRIBUTION or WITHDRAWAL',
      }),
    )
    .optional(),

  amount: z
    .number({ error: 'Amount must be a number' })
    .positive('Amount must be greater than 0')
    .optional(),

  note: z.string().max(500, 'Note too long').optional(),
});

export type UpdateSavingTransactionDto = z.infer<
  typeof updateSavingTransactionSchema
>;
