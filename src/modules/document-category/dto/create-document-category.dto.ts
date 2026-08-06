import { IsNotEmpty, IsString } from 'class-validator';
import { z } from 'zod';

export const createDocumentCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
});

export type CreateDocumentCategoryDtoInput = z.infer<
  typeof createDocumentCategorySchema
>;

export class CreateDocumentCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
