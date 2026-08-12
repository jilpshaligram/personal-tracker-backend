import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';

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

export class UpdateSavingTransactionDto {
  @ApiPropertyOptional({ example: 'CONTRIBUTION', enum: ['CONTRIBUTION', 'WITHDRAWAL'], description: 'Transaction type' })
  type?: 'CONTRIBUTION' | 'WITHDRAWAL';

  @ApiPropertyOptional({ example: 150, description: 'Transaction amount' })
  amount?: number;

  @ApiPropertyOptional({ example: 'Updated note', description: 'Optional note' })
  note?: string;
}
