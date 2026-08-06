import { z } from 'zod';
import { CategoryType } from '../../transactions/enums/category-type.enum';

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
  type: z.nativeEnum(CategoryType),
});

export type _CreateCategoryDto = z.infer<typeof createCategorySchema>;

/**
 * @class CreateCategoryDto
 *
 * @description
 * TypeScript class mapping to the Zod schema. Exported as a class to satisfy
 * NestJS dependency injection and emitDecoratorMetadata requirements.
 */
export class CreateCategoryDto implements _CreateCategoryDto {
  name!: string;
  type!: CategoryType;
}
