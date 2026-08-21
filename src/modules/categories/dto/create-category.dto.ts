import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryTransactionType } from '@/modules/categories/enums/category-transaction-type.enum';

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
