import { ApiPropertyOptional } from '@nestjs/swagger';
import { createCategorySchema } from '@/modules/categories/dto/create-category.dto';
import { CategoryTransactionType } from '@/modules/categories/enums/category-transaction-type.enum';

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
