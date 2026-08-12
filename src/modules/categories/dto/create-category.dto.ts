import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
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

export class CreateCategoryDto {
  @ApiProperty({ example: 'Dining Out', description: 'Category name' })
  name: string;

  @ApiProperty({
    enum: CategoryTransactionType,
    example: CategoryTransactionType.EXPENSE,
    description: 'Category transaction type',
  })
  type: CategoryTransactionType;
}
