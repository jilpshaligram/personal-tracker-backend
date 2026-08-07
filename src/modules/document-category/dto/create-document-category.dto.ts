import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { z } from 'zod';

export const createDocumentCategorySchema = z.object({
  name: z.string().trim().min(3, 'Category name is required(min length 3)'),

  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export type CreateDocumentCategoryDtoInput = z.infer<
  typeof createDocumentCategorySchema
>;

export class CreateDocumentCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive';
}
