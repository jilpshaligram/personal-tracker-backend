import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecurringType } from '../enums/recurring-type.enum';

export const createBillSchema = z
  .object({
    categoryId: z.string().uuid('Invalid category ID'),
    title: z
      .string()
      .min(2, 'Title must be at least 2 characters')
      .max(150, 'Title must be at most 150 characters'),
    description: z.string().optional(),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    dueDate: z.string().refine((dateStr) => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date(d);
      targetDate.setHours(0, 0, 0, 0);
      return targetDate >= today;
    }, 'Due date cannot be in the past'),
    isRecurring: z.preprocess(
      (val) => val === 'true' || val === true,
      z.boolean().default(false),
    ),
    recurringType: z.nativeEnum(RecurringType).optional(),
    reminderDaysBefore: z.preprocess(
      (val) => {
        if (typeof val === 'string') {
          try {
            const parsed: unknown = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
          } catch {
            return val.split(',').map((v) => parseInt(v.trim(), 10));
          }
        }
        return val;
      },
      z
        .array(
          z.coerce.number().refine((val) => [1, 3, 7, 14, 30].includes(val), {
            message: 'Reminder days must be one of: 1, 3, 7, 14, 30',
          }),
        )
        .default([]),
    ),
    attachment: z.preprocess(
      (val) =>
        val && typeof val === 'object' && Object.keys(val).length === 0
          ? undefined
          : val,
      z
        .object({
          url: z.string().url(),
          publicId: z.string(),
          fileName: z.string(),
          mimeType: z.string(),
          size: z.coerce.number(),
        })
        .optional()
        .nullable(),
    ),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isRecurring && !data.recurringType) {
        return false;
      }
      return true;
    },
    {
      message: 'Recurring type is required when isRecurring is true',
      path: ['recurringType'],
    },
  );

export class CreateBillDto {
  @ApiProperty({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Category UUID',
  })
  categoryId: string;

  @ApiProperty({ example: 'Electricity Bill', description: 'Bill title' })
  title: string;

  @ApiPropertyOptional({
    example: 'Monthly electric power bill',
    description: 'Description',
  })
  description?: string;

  @ApiProperty({ example: 120.5, description: 'Bill amount' })
  amount: number;

  @ApiProperty({ example: '2026-09-01', description: 'Due date (YYYY-MM-DD)' })
  dueDate: string;

  @ApiPropertyOptional({
    example: true,
    default: false,
    description: 'Is bill recurring',
  })
  isRecurring?: boolean;

  @ApiPropertyOptional({
    enum: RecurringType,
    example: RecurringType.MONTHLY,
    description: 'Recurring frequency',
  })
  recurringType?: RecurringType;

  @ApiPropertyOptional({
    example: [1, 3, 7],
    description: 'Reminder days before due date',
  })
  reminderDaysBefore?: number[];

  @ApiPropertyOptional({ description: 'Bill attachment details' })
  attachment?: {
    url: string;
    publicId: string;
    fileName: string;
    mimeType: string;
    size: number;
  };

  @ApiPropertyOptional({
    example: 'Account #12345',
    description: 'Additional notes',
  })
  notes?: string;
}
