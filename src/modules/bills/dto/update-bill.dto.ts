import { z } from 'zod';
import { RecurringType } from '../enums/recurring-type.enum';

export const updateBillSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID').optional(),
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(150, 'Title must be at most 150 characters')
    .optional(),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be greater than 0').optional(),
  dueDate: z
    .string()
    .refine((date) => {
      const d = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    }, 'Due date cannot be in the past')
    .optional(),
  isRecurring: z.boolean().optional(),
  recurringType: z.nativeEnum(RecurringType).optional(),
  reminderDaysBefore: z
    .array(
      z.number().refine((val) => [1, 3, 7, 14, 30].includes(val), {
        message: 'Reminder days must be one of: 1, 3, 7, 14, 30',
      }),
    )
    .optional(),
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
});

export type UpdateBillDto = z.infer<typeof updateBillSchema>;
