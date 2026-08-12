import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export const createDocumentCategorySchema = z.object({
  name: z.string().trim().min(3, 'Category name is required(min length 3)'),

  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export type CreateDocumentCategoryDtoInput = z.infer<
  typeof createDocumentCategorySchema
>;

export class CreateDocumentCategoryDto {
  @ApiProperty({ example: 'Identification Documents', description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive'], example: 'active', default: 'active', description: 'Status' })
  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive';
}
