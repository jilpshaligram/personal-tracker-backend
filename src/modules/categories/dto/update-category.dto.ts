import { ApiPropertyOptional } from '@nestjs/swagger';
import { createCategorySchema } from './create-category.dto';
import { CategoryTransactionType } from '../enums/category-transaction-type.enum';

/**
 * @schema updateCategorySchema
 *
 * @description
 * Zod schema for validating the incoming payload when updating an existing custom category.
 * It makes all fields from createCategorySchema optional.
 */
export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update.',
  });

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    example: 'Restaurants & Fine Dining',
    description: 'Category name',
  })
  name?: string;

  @ApiPropertyOptional({
    enum: CategoryTransactionType,
    example: CategoryTransactionType.EXPENSE,
    description: 'Category type',
  })
  type?: CategoryTransactionType;
}
