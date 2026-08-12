import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../enums/transaction-type.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

/**
 * @schema createTransactionSchema
 *
 * @description
 * Zod schema for validating the incoming payload when creating a transaction.
 * Validates the presence and format of required fields.
 * Does NOT perform cross-table business logic (e.g. checking if wallet belongs to user).
 */
export const createTransactionSchema = z
  .object({
    wallet_id: z.string().uuid('Invalid wallet ID format.'),

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

    type: z.nativeEnum(TransactionType, {
      message: 'Invalid transaction type.',
    }),

    amount: z.number().positive('Amount must be greater than zero.'),

    payment_method: z
      .nativeEnum(PaymentMethod, {
        message: 'Invalid payment method.',
      })
      .optional()
      .nullable(),

    note: z.string().max(1000, 'Note is too long.').optional().nullable(),

    transaction_date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'transaction_date must be in YYYY-MM-DD format.',
      ),
  })
  .refine(
    (data) => {
      // INCOME / EXPENSE require a category
      if (
        (data.type === TransactionType.INCOME ||
          data.type === TransactionType.EXPENSE) &&
        !data.category_id
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'category_id is required for INCOME and EXPENSE transactions',
      path: ['category_id'],
    },
  )
  .refine(
    (data) => {
      // INCOME / EXPENSE should NOT have a saving_goal_id
      if (
        (data.type === TransactionType.INCOME ||
          data.type === TransactionType.EXPENSE) &&
        data.saving_goal_id
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        'saving_goal_id should not be provided for INCOME or EXPENSE transactions',
      path: ['saving_goal_id'],
    },
  )
  .refine(
    (data) => {
      // TRANSFER transactions require a saving goal
      if (
        (data.type === TransactionType.TRANSFER_TO_SAVING ||
          data.type === TransactionType.TRANSFER_FROM_SAVING) &&
        !data.saving_goal_id
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'saving_goal_id is required for TRANSFER transactions',
      path: ['saving_goal_id'],
    },
  )
  .refine(
    (data) => {
      // TRANSFER transactions should NOT have a category
      if (
        (data.type === TransactionType.TRANSFER_TO_SAVING ||
          data.type === TransactionType.TRANSFER_FROM_SAVING) &&
        data.category_id
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'category_id should not be provided for TRANSFER transactions',
      path: ['category_id'],
    },
  )
  .refine(
    (data) => {
      // OPENING_BALANCE should have neither category nor saving goal
      if (
        data.type === TransactionType.OPENING_BALANCE &&
        (data.category_id || data.saving_goal_id)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        'OPENING_BALANCE should not have a category_id or saving_goal_id',
      path: ['type'],
    },
  );

export class CreateTransactionDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Wallet UUID' })
  wallet_id: string;

  @ApiPropertyOptional({ example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', description: 'Category UUID (Required for INCOME and EXPENSE)' })
  category_id?: string | null;

  @ApiPropertyOptional({ example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', description: 'Saving Goal UUID (Required for TRANSFER transactions)' })
  saving_goal_id?: string | null;

  @ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE, description: 'Transaction type' })
  type: TransactionType;

  @ApiProperty({ example: 49.99, description: 'Transaction amount' })
  amount: number;

  @ApiPropertyOptional({ enum: PaymentMethod, example: PaymentMethod.CREDIT_CARD, description: 'Payment method' })
  payment_method?: PaymentMethod | null;

  @ApiPropertyOptional({ example: 'Grocery shopping', description: 'Optional transaction note' })
  note?: string | null;

  @ApiProperty({ example: '2026-08-12', description: 'Transaction date (YYYY-MM-DD)' })
  transaction_date: string;
}
