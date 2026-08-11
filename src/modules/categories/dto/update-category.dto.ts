import { z } from 'zod';
import { createCategorySchema } from './create-category.dto';

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

export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
