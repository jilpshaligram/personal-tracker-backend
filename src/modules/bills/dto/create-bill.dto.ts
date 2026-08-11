import { z } from 'zod';
import { RecurringType } from '../enums/recurring-type.enum';

export const createBillSchema = z
  .object({
    categoryId: z.string().uuid('Invalid category ID'),
    title: z
      .string()
      .min(2, 'Title must be at least 2 characters')
      .max(150, 'Title must be at most 150 characters'),
    description: z.string().optional(),
    amount: z.number().positive('Amount must be greater than 0'),
    dueDate: z.string().refine((date) => {
      const d = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    }, 'Due date cannot be in the past'),
    isRecurring: z.boolean().default(false),
    recurringType: z.nativeEnum(RecurringType).optional(),
    reminderDaysBefore: z
      .array(
        z.number().refine((val) => [1, 3, 7, 14, 30].includes(val), {
          message: 'Reminder days must be one of: 1, 3, 7, 14, 30',
        }),
      )
      .default([]),
    attachment: z
      .object({
        url: z.string().url(),
        publicId: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        size: z.number(),
      })
      .optional(),
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

export type CreateBillDto = z.infer<typeof createBillSchema>;
