import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

export class CreateSavingTransactionDto {
  @ApiProperty({
    example: 'CONTRIBUTION',
    enum: ['CONTRIBUTION', 'WITHDRAWAL'],
    description: 'Transaction type',
  })
  type: 'CONTRIBUTION' | 'WITHDRAWAL';

  @ApiProperty({ example: 100, description: 'Transaction amount' })
  amount: number;

  @ApiPropertyOptional({
    example: 'Monthly savings deposit',
    description: 'Optional note',
  })
  note?: string;
}
