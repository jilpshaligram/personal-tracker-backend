import { PartialType } from '@nestjs/mapped-types';
import { z } from 'zod';
import {
  CreateDocumentCategoryDto,
  createDocumentCategorySchema,
} from '@/modules/document-category/dto/create-document-category.dto';

export const updateDocumentCategorySchema =
  createDocumentCategorySchema.partial();

export type UpdateDocumentCategoryDtoInput = z.infer<
  typeof updateDocumentCategorySchema
>;

export class UpdateDocumentCategoryDto extends PartialType(
  CreateDocumentCategoryDto,
) {}
