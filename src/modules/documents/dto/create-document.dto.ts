/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { z } from 'zod';

export const createDocumentSchema = z.object({
  categoryId: z.coerce
    .number()
    .int()
    .positive('Category ID must be a positive number'),
  title: z.string().trim().min(1, 'Title is required'),
  expiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format'),
  reminderDaysBefore: z.coerce
    .number()
    .int('Reminder days must be an integer')
    .min(1, 'Reminder days must be at least 1'),
});

export type CreateDocumentDtoInput = z.infer<typeof createDocumentSchema>;

export class CreateDocumentDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  @IsNotEmpty()
  expiryDate: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  reminderDaysBefore: number;
}
