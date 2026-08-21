import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@/modules/transactions/enums/transaction-type.enum';
import { PaymentMethod } from '@/modules/transactions/enums/payment-method.enum';

export const updateTransactionSchema = z.object({
  wallet_id: z.string().uuid('Invalid wallet ID format.').optional(),
  category_id: z
    .string()
    .uuid('Invalid category ID format.')
    .optional()
    .nullable(),
  saving_goal_id: z
    .string()
    .uuid('Invalid saving goal ID format.')
    .optional()
    .nullable(),
  type: z
    .nativeEnum(TransactionType, { message: 'Invalid transaction type.' })
    .optional(),
  amount: z.number().positive('Amount must be greater than zero.').optional(),
  payment_method: z
    .nativeEnum(PaymentMethod, { message: 'Invalid payment method.' })
    .optional()
    .nullable(),
  note: z.string().max(1000, 'Note is too long.').optional().nullable(),
  transaction_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'transaction_date must be in YYYY-MM-DD format.',
    )
    .optional(),
});

export class UpdateTransactionDto {
  @ApiPropertyOptional({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Wallet UUID',
  })
  wallet_id?: string;

  @ApiPropertyOptional({
    example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    description: 'Category UUID (Required for INCOME and EXPENSE)',
  })
  category_id?: string | null;

  @ApiPropertyOptional({
    example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    description: 'Saving Goal UUID (Required for TRANSFER transactions)',
  })
  saving_goal_id?: string | null;

  @ApiPropertyOptional({
    enum: TransactionType,
    example: TransactionType.EXPENSE,
    description: 'Transaction type',
  })
  type?: TransactionType;

  @ApiPropertyOptional({ example: 49.99, description: 'Transaction amount' })
  amount?: number;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
    description: 'Payment method',
  })
  payment_method?: PaymentMethod | null;

  @ApiPropertyOptional({
    example: 'Grocery shopping',
    description: 'Optional transaction note',
  })
  note?: string | null;

  @ApiPropertyOptional({
    example: '2026-08-12',
    description: 'Transaction date (YYYY-MM-DD)',
  })
  transaction_date?: string;
}
