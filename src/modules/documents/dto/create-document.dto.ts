import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const createDocumentSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID '),
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
  @ApiProperty({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Document Category UUID',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'Passport Copy', description: 'Document title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: '2028-12-31',
    description: 'Expiry date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsNotEmpty()
  expiryDate: string;

  @ApiProperty({ example: 30, description: 'Reminder days before expiry' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reminderDaysBefore: number;
}
