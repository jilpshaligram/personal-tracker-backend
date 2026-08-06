import { z } from 'zod';
import { createCategorySchema } from './create-category.dto';
import { CategoryType } from '../../transactions/enums/category-type.enum';

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

export type _UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

/**
 * @class UpdateCategoryDto
 *
 * @description
 * TypeScript class mapping to the Zod schema. Exported as a class to satisfy
 * NestJS dependency injection and emitDecoratorMetadata requirements.
 */
export class UpdateCategoryDto implements _UpdateCategoryDto {
  name?: string;
  type?: CategoryType;
}
