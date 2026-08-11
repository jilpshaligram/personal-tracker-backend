import { z } from 'zod';
import { CategoryTransactionType } from '../enums/category-transaction-type.enum';

/**
 * @schema createCategorySchema
 *
 * @description
 * Zod schema for validating the incoming payload when creating a new custom category.
 * Used by the ZodValidationPipe in the Controller.
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name cannot be blank.')
    .max(100, 'Category name cannot exceed 100 characters.'),
  type: z.nativeEnum(CategoryTransactionType),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
