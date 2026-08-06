import { PartialType } from '@nestjs/mapped-types';
import { z } from 'zod';
import { CreateDocumentDto, createDocumentSchema } from './create-document.dto';

export const updateDocumentSchema = createDocumentSchema.partial();

export type UpdateDocumentDtoInput = z.infer<typeof updateDocumentSchema>;

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {}
