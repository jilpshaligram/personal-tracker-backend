import { z } from 'zod';
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

/**
 * @type CreateTransactionDto
 *
 * @description
 * TypeScript type mapping to the Zod schema. Exported as a type to avoid
 * conflicts with NestJS global ValidationPipe.
 */
export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
