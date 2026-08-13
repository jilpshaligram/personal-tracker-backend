import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsDateString,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export const createDocumentSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  title: z.string().trim().min(1, 'Title is required'),
  expiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  reminderDaysBefore: z.preprocess((val) => {
    if (val === '' || val === undefined || val === null) {
      return undefined;
    }
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val) as unknown;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Number(parsed[0]);
        }
        if (typeof parsed === 'number') return parsed;
      } catch {
        const split = val
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => !isNaN(n));
        if (split.length > 0) return split[0];
      }
      const num = Number(val);
      if (!isNaN(num)) return num;
    }
    if (Array.isArray(val) && val.length > 0) {
      return Number(val[0]);
    }
    return val;
  }, z.coerce.number().int('Reminder days must be an integer').min(1, 'Reminder days must be at least 1').optional().default(7)),
});

export type CreateDocumentDtoInput = z.infer<typeof createDocumentSchema>;

export class CreateDocumentDto {
  @ApiProperty({
    example: 'd353420f-304b-4b0c-b05c-bce48803c377',
    description: 'Document Category UUID',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'Passport Copy', description: 'Document title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: '2028-12-31',
    description: 'Expiry date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  expiryDate?: string | null;

  @ApiPropertyOptional({
    example: 30,
    default: 7,
    description: 'Reminder days before expiry',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  reminderDaysBefore?: number;
}
